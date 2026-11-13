-- LOOTLIST | Base de datos completa para los TPs 1 a 6
-- Compatible con el ZIP original RecoManga (tabla series con tipo = plataforma).
-- Pegar en Supabase > SQL Editor > New query > Run.
-- NO elimina publicaciones ni cuentas existentes, pero REEMPLAZA las politicas RLS de las
-- tablas public.series y public.comentarios por las reglas indicadas por la docente.

create extension if not exists pgcrypto;

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

create table if not exists public.series (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null, -- Plataforma de videojuegos: PC, PlayStation, Xbox, etc.
  genero text not null,
  puntuacion numeric not null check (puntuacion >= 0 and puntuacion <= 10),
  resena text not null,
  por_que text not null,
  terminada boolean not null default false, -- "Ya lo jugué"
  imagen_url text,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.comentarios (
  id uuid primary key default gen_random_uuid(),
  serie_id uuid not null references public.series(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  comentario text not null,
  created_at timestamptz not null default now()
);

-- Si las tablas existian previamente, crea columnas nuevas cuando falten
-- (sin perder filas). Este paso espera que la columna id del ZIP original sea UUID.
alter table public.series add column if not exists tipo text;
alter table public.series add column if not exists por_que text;
alter table public.series add column if not exists terminada boolean default false;
alter table public.series add column if not exists imagen_url text;
alter table public.series add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.series add column if not exists user_email text;
alter table public.series add column if not exists created_at timestamptz default now();
alter table public.comentarios add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.comentarios add column if not exists user_email text;
alter table public.comentarios add column if not exists created_at timestamptz default now();

-- Perfil auxiliar automatico. Las contraseñas SOLO las guarda Supabase Auth.
create or replace function public.crear_usuario_lootlist()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.usuarios (id,email) values (new.id,new.email)
  on conflict (id) do update set email=excluded.email;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_recomanga on auth.users;
drop trigger if exists on_auth_user_created_lootlist on auth.users;
create trigger on_auth_user_created_lootlist
  after insert on auth.users for each row
  execute procedure public.crear_usuario_lootlist();
insert into public.usuarios (id,email)
  select id,email from auth.users
  on conflict (id) do update set email=excluded.email;

-- RLS: reglas efectivas (no se confía en esconder botones en el navegador).
alter table public.usuarios enable row level security;
alter table public.series enable row level security;
alter table public.comentarios enable row level security;

-- Evitamos que una politica permisiva vieja deje abiertas operaciones inseguras.
do $$
declare policy_row record;
begin
  for policy_row in select policyname,tablename from pg_policies
    where schemaname='public' and tablename in ('series','comentarios')
  loop
    execute format('drop policy if exists %I on public.%I',policy_row.policyname,policy_row.tablename);
  end loop;
end $$;
drop policy if exists "Usuarios pueden ver su perfil" on public.usuarios;
drop policy if exists "Usuarios ven su perfil LootList" on public.usuarios;

create policy "Usuarios ven su perfil LootList" on public.usuarios
  for select to authenticated using (auth.uid()=id);

-- Publico: lectura de juegos (RLS SELECT).
create policy "Juegos: lectura publica" on public.series
  for select to anon,authenticated using (true);

-- Registrados: alta de sus propias publicaciones (RLS INSERT).
create policy "Juegos: insercion del autor" on public.series
  for insert to authenticated
  with check (auth.uid()=user_id and user_email=(auth.jwt()->>'email'));

-- Solo el propietario puede editar (RLS UPDATE).
create policy "Juegos: edicion del autor" on public.series
  for update to authenticated
  using (auth.uid()=user_id)
  with check (auth.uid()=user_id);

-- Solo el propietario puede borrar (RLS DELETE).
create policy "Juegos: borrado del autor" on public.series
  for delete to authenticated using (auth.uid()=user_id);

-- Comentarios: lectura publica y escritura de usuarios autenticados.
create policy "Comentarios: lectura publica" on public.comentarios
  for select to anon,authenticated using (true);
create policy "Comentarios: insercion autenticada" on public.comentarios
  for insert to authenticated
  with check (auth.uid()=user_id and user_email=(auth.jwt()->>'email'));

-- Los comentarios no se pueden editar/eliminar desde la app, solo se borran
-- en cascada si el dueño elimina el juego al que pertenecen.

grant usage on schema public to anon,authenticated;
grant select on public.series,public.comentarios to anon,authenticated;
grant select on public.usuarios to authenticated;
grant insert,update,delete on public.series to authenticated;
grant insert on public.comentarios to authenticated;

-- Storage para las portadas de juegos. Archivo privado por usuario, lectura publica.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
  values ('portadas','portadas',true,5242880,array['image/png','image/jpeg','image/webp'])
  on conflict (id) do update set public=true,file_size_limit=excluded.file_size_limit,
    allowed_mime_types=excluded.allowed_mime_types;

-- Reemplazar politicas viejas conocidas: algunas guias permiten uploads sin login.
drop policy if exists "Portadas publicas" on storage.objects;
drop policy if exists "Usuarios suben sus portadas" on storage.objects;
drop policy if exists "Usuarios actualizan sus portadas" on storage.objects;
drop policy if exists "Usuarios eliminan sus portadas" on storage.objects;
drop policy if exists "Permisos totales portadas" on storage.objects;
drop policy if exists "LootList: ver portadas" on storage.objects;
drop policy if exists "LootList: subir portadas propias" on storage.objects;
drop policy if exists "LootList: borrar portadas propias" on storage.objects;

create policy "LootList: ver portadas" on storage.objects for select
  to anon,authenticated using (bucket_id='portadas');
create policy "LootList: subir portadas propias" on storage.objects for insert
  to authenticated with check (
    bucket_id='portadas' and (storage.foldername(name))[1]=auth.uid()::text
  );
create policy "LootList: borrar portadas propias" on storage.objects for delete
  to authenticated using (
    bucket_id='portadas' and (storage.foldername(name))[1]=auth.uid()::text
  );

-- Realtime. Agrega las tablas solo si no figuran ya en la publicacion.
do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='series') then
      alter publication supabase_realtime add table public.series;
    end if;
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='comentarios') then
      alter publication supabase_realtime add table public.comentarios;
    end if;
  end if;
end $$;

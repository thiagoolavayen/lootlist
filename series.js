/** Operaciones de datos: usamos las tablas `series` y `comentarios` del práctico,
 * aunque la interfaz muestra videojuegos, para conservar el Supabase original. */
import { supabase } from './supabaseClient.js?v=20261113-4';

export const PLATAFORMAS = ['PC','PlayStation','Xbox','Nintendo Switch','Móvil','Multiplataforma'];
export const GENEROS = ['Acción','Aventura','RPG','Estrategia','Deportes','Carreras','Simulación','Plataformas','Puzles','Terror','Indie','Otro'];

function extraerError(resultado) {
  if (resultado.error) throw resultado.error;
  return resultado.data;
}

export async function obtenerSeriesBD() {
  return extraerError(await supabase.from('series').select('*').order('created_at',{ascending:false}).limit(100));
}
export async function obtenerSerie(id) {
  return extraerError(await supabase.from('series').select('*').eq('id', id).single());
}
export async function crearSerie(datos) {
  return extraerError(await supabase.from('series').insert([datos]).select('id').single());
}
export async function actualizarSerie(id, uid, datos) {
  const fila = extraerError(await supabase.from('series').update(datos).eq('id',id).eq('user_id',uid).select('id').maybeSingle());
  if (!fila) throw new Error('No se actualizó la publicación. Verificá que seas el propietario.');
  return fila;
}
export async function eliminarSerieBD(id, uid) {
  const fila = extraerError(await supabase.from('series').delete().eq('id',id).eq('user_id',uid).select('id').maybeSingle());
  if (!fila) throw new Error('No se eliminó la publicación. Verificá que seas el propietario.');
  return fila;
}
export async function obtenerComentarios(ids) {
  if (!ids.length) return [];
  return extraerError(await supabase.from('comentarios').select('id,serie_id,user_email,comentario,created_at').in('serie_id',ids).order('created_at',{ascending:true}).limit(1000));
}
export async function insertarComentario(datos) {
  return extraerError(await supabase.from('comentarios').insert([datos]).select('id').single());
}
export async function subirPortada(file, uid) {
  if (!file) return null;
  if (!uid) throw new Error('Iniciá sesión antes de subir una portada.');
  if (!['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error('La portada debe ser JPG, PNG o WebP.');
  if (file.size > 5 * 1024 * 1024) throw new Error('La portada no puede superar los 5 MB.');
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${uid}/${crypto.randomUUID()}.${ext}`;
  const resultado = await supabase.storage.from('portadas').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
  if (resultado.error) {
    const extra = /bucket not found/i.test(resultado.error.message)
      ? ` (Conectado a: ${supabase.supabaseUrl}; bucket esperado: portadas. Si el bucket existe, verificá que estés abriendo la carpeta nueva y no una pestaña o PWA antigua.)`
      : '';
    throw new Error('Falló la subida de la portada: ' + resultado.error.message + extra);
  }
  const {data} = supabase.storage.from('portadas').getPublicUrl(path);
  return {url:data.publicUrl,path};
}
export async function borrarPortada(url, uid) {
  if (!url || !uid) return;
  const marker = '/storage/v1/object/public/portadas/';
  let parsed;
  try { parsed = new URL(url); } catch { return; }
  if (parsed.origin !== new URL(supabase.supabaseUrl).origin) return;
  if (!parsed.pathname.includes(marker)) return;
  const path = decodeURIComponent(parsed.pathname.split(marker)[1] || '');
  if (!path.startsWith(`${uid}/`)) return;
  const {error} = await supabase.storage.from('portadas').remove([path]);
  if (error) console.warn('No se pudo limpiar una portada anterior:',error.message);
}

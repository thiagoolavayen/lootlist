# LootList — proyecto final de recomendaciones de videojuegos

Versión adaptada del proyecto `RECOMANGA_COMPLETO_FUNCIONANDO.zip`. Incluye todos los temas pedidos por la profesora, desde el formulario HTML/CSS hasta Supabase Auth, RLS, CRUD, comentarios, módulos y PWA.

## Lo que tiene
- Formulario de recomendación: título, plataforma, género, puntuación, reseña, razón de recomendar, archivo de portada (Storage) y casilla de jugado.
- Catálogo dinámico con SELECT, búsqueda, filtros, orden y comentarios visibles para visitantes.
- Registro, inicio/cierre de sesión y persistencia con Supabase Auth.
- CRUD: crear/editar/borrar recomendaciones, con formulario reutilizable y botones solo del dueño.
- Comentarios solo cuando hay sesión iniciada.
- Seguridad en la base mediante RLS y Storage por carpetas de usuario (no solamente ocultando botones).
- Diseño responsive y PWA instalable con manifest, service worker e íconos PNG 192/512.
- Archivos divididos: `main.js`, `auth.js`, `series.js`, `supabaseClient.js`.

## MUY IMPORTANTE
El código conserva la **URL y Publishable Key** ya presentes en `RECOMANGA/FINAL/supabaseClient.js`. Es una clave pública; no incluye ningún service_role secret. Para que el sistema funcione de verdad con tu proyecto online, **tenés que ejecutar el SQL en tu Supabase y publicar en tu GitHub**. Nadie puede hacer esos pasos desde un ZIP local sin acceso autorizado a tus cuentas. La aplicación no trae registros ficticios fingiendo que están en una base de datos.

## Instalación rápida (hacelo en este orden)

### 1. Abrir en VS Code
1. Extraé el ZIP.
2. Abrí la carpeta `LOOTLIST` (donde se encuentra `index.html`).
3. Si no tenés la extensión **Live Server**, instalala en VS Code.
4. Clic derecho en `index.html` > `Open with Live Server`. No abrir con doble clic desde Windows.

### 2. Crear / actualizar la base de datos en Supabase
1. Entrá a https://supabase.com/dashboard y elegí el proyecto que ya usabas con RecoManga.
2. Abrí `SQL Editor` > `New query`.
3. Abrí el archivo `SUPABASE/schema.sql`, copiá **todo** su contenido y pegalo en SQL Editor.
4. Ejecutá `Run`. Si muestra un mensaje de error, NO ignores el error. Revisá qué dice.
5. Verificá en `Table Editor` que existan `series` y `comentarios`.
6. Verificá que ambas tablas tengan `RLS enabled`.
7. En `Storage`, verificá que exista el bucket público `portadas`.
8. Si ya tenías otras políticas de Storage que habilitan `public` a escribir en portadas, eliminálas para respetar la consigna. El SQL borra las conocidas del proyecto original.

**Nota de compatibilidad:** para respetar el ejercicio y evitar romper tu conexión, la base de datos mantiene el nombre interno `series` y guarda la plataforma en la columna `tipo`. Los antiguos mangas/animes no se muestran en LootList, aunque sus filas siguen existiendo hasta que vos decidas qué hacer con ellas. El script NO borra datos.

### 3. Habilitar el login
1. Supabase > `Authentication` > `Providers` > `Email`: dejá habilitado el proveedor.
2. Para probar sin correos reales, en `Authentication` > opciones de email podés desactivar temporalmente `Confirm email`. Para una app pública es preferible dejarlo habilitado.
3. En `Authentication` > `URL Configuration`, poné la URL definitiva de GitHub Pages como `Site URL` y agregala a `Redirect URLs` (por ejemplo `https://TU-USUARIO.github.io/lootlist/**`). Así los enlaces de confirmación de correo vuelven a la app correcta.
4. Revisá la URL y Publishable Key de `supabaseClient.js`. Se conservaron del ZIP. Si creaste **otro** proyecto de Supabase, reemplazá estos dos valores por los de ese proyecto. No uses la clave `service_role`.

### 4. Probar cada requisito
1. Abrí la web en ventana de incógnito. Se debe ver el catálogo y no el formulario de publicación ni la caja para comentar.
2. Registrá el usuario 1 (necesitás un correo real si la confirmación de email está activada).
3. Iniciá sesión y publicá un videojuego con o sin portada. Verificá en Supabase `Table Editor` que se creó la fila.
4. Editá los datos y guardalos. Probá eliminarlo. Si lo eliminás, creá otro para seguir probando.
5. Cerrá sesión, registrá el usuario 2 e iniciá sesión. Debe poder leer y comentar la publicación del usuario 1, pero no editarla/borrarla.
6. Abrí la página desde el celular y probá `Instalar aplicación`.

### 5. Subir el proyecto a GitHub
Creá un repositorio público, por ejemplo `lootlist`, sin README inicial, y ejecutá los siguientes comandos **desde la carpeta LOOTLIST** en la terminal de VS Code:

```bash
git init
git add .
git commit -m "Proyecto final LootList - TPs 1 al 6"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/lootlist.git
git push -u origin main
```

Si tu proyecto ya es un repositorio Git, NO hace falta volver a ejecutar `git init` o `git remote add origin`: bastará con `git add .`, `git commit -m "Proyecto final"` y `git push`.

En GitHub > `Settings` > `Pages` > `Build and deployment` > `Deploy from a branch` > `main` > `/ (root)` > `Save`.

Tu dirección pública tendrá esta forma:
`https://TU-USUARIO.github.io/lootlist/`

### 6. Subir a Classroom
Entregá **los dos enlaces**: (1) repositorio GitHub y (2) web publicada en GitHub Pages. La profesora pidió los dos. Más detalles en `GUIA_DE_ENTREGA.md`.

## Solución de problemas
- **Error relation series does not exist / permission denied**: no corriste el SQL completo o usaste otro proyecto de Supabase.
- **new row violates row-level security policy**: verificá que estés logueado y que la política RLS esté creada. Si quedaron políticas antiguas inseguras en Storage, revisalas.
- **Error al subir una imagen**: comprobá que existe `portadas`, que elegiste JPG/PNG/WebP menor a 5 MB y que tenés sesión.
- **Email not confirmed**: confirmá el correo o cambiá la configuración temporalmente para una prueba.
- **Página en blanco**: usá Live Server / GitHub Pages (no `file://`), abrí F12 > Console, y comprobá que no haya error de carga del módulo de Supabase.
- **Un juego viejo de RecoManga no aparece**: es intencional: LootList muestra solo registros cuyo campo `tipo` indica una plataforma de videojuegos.
- **La PWA muestra una versión anterior**: el Service Worker guarda archivos estáticos en cache; actualizá `CACHE` en `sw.js` a una versión nueva cuando publiques cambios mayores.
- **Modo offline**: la estructura puede abrirse offline si fue cargada antes, pero los datos, login y operaciones de Supabase requieren internet.

## Mapa de archivos
- `index.html`: formulario y contenedores.
- `style.css`: diseño responsive y animaciones.
- `supabaseClient.js`: conexión, URL y publishable key.
- `auth.js`: registro, login, logout y sesión.
- `series.js`: operaciones SELECT/INSERT/UPDATE/DELETE, comentarios y portadas.
- `main.js`: coordina eventos y dibuja el catálogo de manera segura.
- `manifest.json`: identidad PWA.
- `sw.js`: cache estática offline.
- `icons/`: iconos PNG y portada genérica SVG.
- `SUPABASE/schema.sql`: creación de tablas, policies, Storage y Realtime.

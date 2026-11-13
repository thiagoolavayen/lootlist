/** LootList - TP1 a TP6: HTML, CSS, Supabase, CRUD, Auth, módulos y PWA */
import { supabase } from './supabaseClient.js?v=20261113-4';
import { obtenerSesion, registrarse, iniciarSesion, cerrarSesion, escucharSesion } from './auth.js?v=20261113-4';
import { PLATAFORMAS, GENEROS, obtenerSeriesBD, obtenerSerie, crearSerie, actualizarSerie,
  eliminarSerieBD, obtenerComentarios, insertarComentario, subirPortada, borrarPortada } from './series.js?v=20261113-4';

const $ = (id) => document.getElementById(id);
const form = $('form-recomendacion');
const grid = $('grid-series');
const inputId = $('recomendacion-id');
const btnSubmit = $('btn-submit');
const btnCancelar = $('btn-cancelar');
const archivo = $('imagen-file');
const sesionMensaje = $('auth-mensaje');
const botonesAuth = [$('btn-login'), $('btn-registro')];
const PLACEHOLDER = './icons/cover-placeholder.svg';

let sesionActual = null;
let todas = [];
let comentarios = new Map();
let consultaEnCurso = 0;
let huboCargaExitosa = false;
let enviando = false;

function mostrarMensaje(el, texto, esError = false) {
  if (!el) return;
  el.textContent = texto;
  el.style.color = esError ? 'var(--danger)' : 'var(--lime)';
}
function msgFormulario(texto, error=false) { mostrarMensaje($('form-mensaje'),texto,error); }
function msgAuth(texto, error=false) { mostrarMensaje(sesionMensaje,texto,error); }
function estaLogueado(){return Boolean(sesionActual?.user?.id);}
function esDueno(serie){return estaLogueado() && sesionActual.user.id===serie.user_id;}
function permitido(url) {
  if (!url) return PLACEHOLDER;
  try { const u=new URL(url,location.href);return ['https:','http:'].includes(u.protocol) ? u.href : PLACEHOLDER; }
  catch{return PLACEHOLDER;}
}
function fechaLegible(s){
  if(!s) return 'Sin fecha';
  try{return new Date(s).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'});}catch{return 'Sin fecha';}
}
function nodo(tag, clase='', texto='') {
  const n=document.createElement(tag);
  if(clase)n.className=clase;
  if(texto!==undefined && texto!==null)n.textContent=String(texto);
  return n;
}
function actualizarCuenta() {
  const conectado=estaLogueado();
  $('estado-cuenta').textContent=conectado ? `Conectado: ${sesionActual.user.email || 'Usuario'}` : 'Modo visitante';
  $('auth-grid').classList.toggle('hidden',conectado);
  $('btn-logout').classList.toggle('hidden',!conectado);
  form.classList.toggle('hidden',!conectado);
  $('publicar-aviso').classList.toggle('hidden',conectado);
  $('filtro-mias-label').classList.toggle('hidden',!conectado);
  if (!conectado) {
    $('solo-mias').checked=false;
    cancelarEdicion();
    msgAuth('Iniciá sesión para publicar recomendaciones y comentar.');
  } else {
    msgAuth('¡Sesión activa! Ya podés recomendar videojuegos y dejar comentarios.');
  }
  dibujarCatalogo();
}
function aplicarFiltros() {
  const busqueda=$('buscar').value.trim().toLocaleLowerCase('es');
  const genero=$('filtrar-genero').value;
  let items=todas.filter((s)=>{
    const texto=`${s.titulo || ''} ${s.resena || ''} ${s.por_que || ''}`.toLocaleLowerCase('es');
    return (!busqueda || texto.includes(busqueda)) && (!genero || s.genero===genero)
      && (!$('solo-mias').checked || esDueno(s));
  });
  switch($('ordenar').value){
    case 'mejor-puntuados': items.sort((a,b)=>Number(b.puntuacion)-Number(a.puntuacion));break;
    case 'titulo': items.sort((a,b)=>String(a.titulo).localeCompare(String(b.titulo),'es'));break;
    default: items.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  }
  return items;
}
function dibujarCatalogo() {
  if (!huboCargaExitosa) return;
  const items=aplicarFiltros();
  $('cantidad').textContent=`${items.length} ${items.length === 1?'publicación':'publicaciones'}`;
  grid.replaceChildren();
  if(!items.length){
    grid.append(nodo('div','empty',todas.length ? 'No encontramos juegos con esos filtros. Probá otra búsqueda.' : 'Todavía no hay videojuegos recomendados. Iniciá sesión y publicá el primero.'));
    return;
  }
  const fragment=document.createDocumentFragment();
  for(const juego of items){fragment.appendChild(crearTarjeta(juego));}
  grid.appendChild(fragment);
}
function crearTarjeta(juego) {
  const card=nodo('article','card-serie');
  const poster=nodo('div','poster-wrap');
  const img=nodo('img');
  img.src=permitido(juego.imagen_url);
  img.alt=`Portada de ${juego.titulo || 'videojuego'}`;
  img.loading='lazy';
  img.addEventListener('error',()=>{if(!img.src.endsWith('cover-placeholder.svg'))img.src=PLACEHOLDER;});
  poster.append(img,nodo('span','poster-label',juego.tipo || 'Videojuego'));
  const body=nodo('div','card-body');
  const info=nodo('div','card-header-info');
  info.append(nodo('span','badge-genero',juego.genero||'Otro'),nodo('span','score',`★ ${Number(juego.puntuacion||0).toLocaleString('es-AR',{maximumFractionDigits:1})}/10`));
  body.append(info,nodo('h3','card-title',juego.titulo),nodo('p','card-resena',juego.resena));
  const razon=nodo('p','card-why');
  razon.append(nodo('strong','', '¿Por qué jugarlo? '),document.createTextNode(juego.por_que||''));
  body.append(razon);
  const autor=nodo('div','card-footer-author');
  autor.append(nodo('span','',`Por: ${juego.user_email||'Jugador anónimo'}`),nodo('span','',`${juego.terminada?'✓ Ya lo jugó':'En su lista'} · ${fechaLegible(juego.created_at)}`));
  body.append(autor);
  if(esDueno(juego)){
    const acciones=nodo('div','card-actions');
    for(const [accion,etiqueta,clase] of [['editar','✏️ Editar',''],['eliminar','🗑 Eliminar','danger']]){
      const b=nodo('button',clase,etiqueta);b.type='button';b.dataset.accion=accion;b.dataset.id=juego.id;acciones.append(b);
    }
    body.append(acciones);
  }
  const caja=nodo('div','comment-box');
  const comentariosJuego=comentarios.get(String(juego.id))||[];
  caja.append(nodo('div','comment-heading',`💬 Comentarios (${comentariosJuego.length})`));
  const lista=nodo('div','comment-list');
  if (!comentariosJuego.length){lista.append(nodo('p','comment-signin','Todavía no hay comentarios.'));}
  else {
    for(const c of comentariosJuego){
      const bloque=nodo('div','comment-item');
      bloque.append(nodo('span','',c.user_email||'Usuario'),nodo('p','',c.comentario));
      lista.append(bloque);
    }
  }
  caja.append(lista);
  if(estaLogueado()){
    const f=nodo('form','comment-form');f.dataset.serieId=juego.id;
    const entrada=nodo('input');entrada.type='text';entrada.name='comentario';entrada.placeholder='Sumá tu opinión...';entrada.maxLength=500;entrada.required=true;entrada.setAttribute('aria-label',`Comentar en ${juego.titulo}`);
    const btn=nodo('button','','Enviar');btn.type='submit';
    f.append(entrada,btn);caja.append(f);
  }else caja.append(nodo('p','comment-signin','Iniciá sesión para dejar un comentario.'));
  body.append(caja);card.append(poster,body);return card;
}
async function cargarCatalogo(){
  const orden=++consultaEnCurso;
  if(!huboCargaExitosa) grid.replaceChildren(nodo('div','empty','Cargando recomendaciones...'));
  try{
    const respuesta=await obtenerSeriesBD();
    // La tabla original se llama "series" por compatibilidad con la profesora.
    // Solo mostramos videojuegos, no las publicaciones de anime/manga del ZIP anterior.
    const nuevos=respuesta.filter((s)=>PLATAFORMAS.includes(s.tipo));
    const comm=await obtenerComentarios(nuevos.map((s)=>s.id));
    if(orden!==consultaEnCurso)return;
    todas=nuevos;
    comentarios=new Map();
    for(const c of comm){
      const id=String(c.serie_id);
      if(!comentarios.has(id)) comentarios.set(id,[]);
      comentarios.get(id).push(c);
    }
    huboCargaExitosa=true;
    $('cantidad-total').textContent=String(todas.length);
    dibujarCatalogo();
  }catch(error){
    if(orden!==consultaEnCurso)return;
    if(!huboCargaExitosa){grid.replaceChildren(nodo('div','empty',`No se pudo cargar el catálogo: ${error.message}. Revisá SUPABASE/schema.sql y tu conexión.`));}
    else msgFormulario('No se pudo actualizar el catálogo: '+error.message,true);
    console.error('Error en Supabase:',error);
  }
}
function cancelarEdicion(){
  form.reset();inputId.value='';archivo.value='';
  $('titulo-form').textContent='Recomendá un videojuego';
  $('modo-form').textContent='Nueva recomendación';
  btnSubmit.textContent='Publicar recomendación';
  btnCancelar.classList.add('hidden');
  msgFormulario('');
}
async function prepararEdicion(id){
  if(!estaLogueado())return;
  try{
    const juego=await obtenerSerie(id);
    if(!esDueno(juego))throw new Error('Solo podés editar publicaciones propias.');
    inputId.value=juego.id;
    for(const campo of ['titulo','tipo','genero','puntuacion','resena'])$(campo).value=juego[campo]??'';
    $('por-que').value=juego.por_que||'';
    $('terminada').checked=Boolean(juego.terminada);
    archivo.value='';
    $('titulo-form').textContent='Editar recomendación';
    $('modo-form').textContent='Editando publicación';
    btnSubmit.textContent='Guardar cambios';
    btnCancelar.classList.remove('hidden');
    msgFormulario('Podés cambiar los datos y, opcionalmente, subir otra portada.');
    $('formulario').scrollIntoView({behavior:'smooth',block:'start'});
  }catch(error){alert('No se pudo abrir la edición: '+error.message);}
}
async function eliminarPublicacion(id){
  if(!estaLogueado() || !confirm('¿Seguro que querés borrar esta recomendación y sus comentarios?'))return;
  try{
    const juego=await obtenerSerie(id);
    if(!esDueno(juego))throw new Error('Solo podés eliminar publicaciones propias.');
    await eliminarSerieBD(id,sesionActual.user.id);
    if(juego.imagen_url)await borrarPortada(juego.imagen_url,sesionActual.user.id);
    if(inputId.value===String(id))cancelarEdicion();
    await cargarCatalogo();
  }catch(error){alert('No se pudo eliminar: '+error.message);}
}
async function publicarComentario(f){
  if(!estaLogueado())return;
  const texto=f.elements.comentario.value.trim();
  if(!texto){f.elements.comentario.focus();return;}
  const boton=f.querySelector('button');boton.disabled=true;
  try{
    await insertarComentario({serie_id:f.dataset.serieId,user_id:sesionActual.user.id,user_email:sesionActual.user.email,comentario:texto});
    f.reset();await cargarCatalogo();
  }catch(error){alert('Error al comentar: '+error.message);}finally{boton.disabled=false;}
}
async function guardarPublicacion(event){
  event.preventDefault();
  if(enviando)return;
  if(!estaLogueado()){msgFormulario('Iniciá sesión para publicar.',true);return;}
  if(!form.reportValidity())return;
  const titulo=$('titulo').value.trim(),tipo=$('tipo').value,genero=$('genero').value;
  const puntuacion=Number($('puntuacion').value),resena=$('resena').value.trim();
  const por_que=$('por-que').value.trim(),terminada=$('terminada').checked;
  if(!titulo||!resena||!por_que||!PLATAFORMAS.includes(tipo)||!GENEROS.includes(genero)
    ||!Number.isFinite(puntuacion)||puntuacion<0||puntuacion>10){
    msgFormulario('Completá correctamente todos los campos obligatorios.',true);return;
  }
  enviando=true;btnSubmit.disabled=true;
  msgFormulario('Guardando recomendación...');
  let subida=null;
  const id=inputId.value,uid=sesionActual.user.id;
  try{
    let anterior=null;
    if(id){anterior=await obtenerSerie(id);if(!esDueno(anterior))throw new Error('Solo podés actualizar publicaciones propias.');}
    if(archivo.files?.[0])subida=await subirPortada(archivo.files[0],uid);
    const datos={titulo,tipo,genero,puntuacion,resena,por_que,terminada};
    if(subida)datos.imagen_url=subida.url;
    if(id){
      await actualizarSerie(id,uid,datos);
      if(subida && anterior?.imagen_url)await borrarPortada(anterior.imagen_url,uid);
    }else{
      await crearSerie({...datos,imagen_url:subida?.url||null,user_id:uid,user_email:sesionActual.user.email});
    }
    cancelarEdicion();
    msgFormulario(id?'¡Recomendación actualizada!':'¡Tu juego ya está publicado!');
    await cargarCatalogo();
  }catch(error){
    if(subida)await borrarPortada(subida.url,uid);
    msgFormulario('No se pudo guardar: '+error.message,true);
  }finally{enviando=false;btnSubmit.disabled=false;}
}
function obtenerCredenciales(){
  const email=$('email').value.trim(),password=$('password').value;
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){msgAuth('Ingresá un correo electrónico válido.',true);return null;}
  if(password.length<6){msgAuth('La contraseña debe tener 6 caracteres o más.',true);return null;}
  return {email,password};
}
async function gestionarAcceso(registro){
  const cred=obtenerCredenciales();if(!cred)return;
  botonesAuth.forEach(b=>b.disabled=true);
  msgAuth(registro?'Registrando cuenta...':'Iniciando sesión...');
  try{
    const respuesta=registro?await registrarse(cred.email,cred.password):await iniciarSesion(cred.email,cred.password);
    if(respuesta.session){
      sesionActual=respuesta.session;
      actualizarCuenta();
      msgAuth(registro?'¡Cuenta creada correctamente!':'¡Inicio de sesión correcto!');
      $('password').value='';
      await cargarCatalogo();
    }else if(registro){
      msgAuth('Supabase todavía exige confirmar el correo. Desactivá Confirm email en Authentication → Providers → Email y registrá un usuario nuevo para probar.',true);
    }else{throw new Error('No se recibió una sesión válida.');}
  }catch(error){msgAuth(`No se pudo ${registro?'registrar':'iniciar sesión'}: ${error.message}`,true);}
  finally{botonesAuth.forEach(b=>b.disabled=false);}
}

$('buscar').addEventListener('input',dibujarCatalogo);
$('filtrar-genero').addEventListener('change',dibujarCatalogo);
$('ordenar').addEventListener('change',dibujarCatalogo);
$('solo-mias').addEventListener('change',dibujarCatalogo);
btnCancelar.addEventListener('click',cancelarEdicion);
form.addEventListener('submit',guardarPublicacion);
$('btn-registro').addEventListener('click',()=>gestionarAcceso(true));
$('btn-login').addEventListener('click',()=>gestionarAcceso(false));
for(const id of ['email','password'])$(id).addEventListener('keydown',(e)=>{if(e.key==='Enter')gestionarAcceso(false);});
$('btn-logout').addEventListener('click',async()=>{
  try{
    await cerrarSesion();
    sesionActual=null;actualizarCuenta();
    msgAuth('Sesión cerrada. El catálogo sigue disponible para explorar.');
    await cargarCatalogo();
  }catch(error){msgAuth('Error al cerrar sesión: '+error.message,true);}
});
grid.addEventListener('click',(e)=>{
  const boton=e.target.closest('button[data-accion]');if(!boton)return;
  if(boton.dataset.accion==='editar')prepararEdicion(boton.dataset.id);
  if(boton.dataset.accion==='eliminar')eliminarPublicacion(boton.dataset.id);
});
grid.addEventListener('submit',(e)=>{
  const f=e.target.closest('form.comment-form');if(!f)return;
  e.preventDefault();publicarComentario(f);
});
// Este callback NO espera a la base de datos: evita bloqueos de Supabase Auth.
escucharSesion((sesion)=>{
  const viejoId=sesionActual?.user?.id;
  sesionActual=sesion;
  queueMicrotask(()=>{
    actualizarCuenta();
    if(viejoId!==sesion?.user?.id && huboCargaExitosa)cargarCatalogo();
  });
});
(async()=>{
  try{sesionActual=await obtenerSesion();}
  catch(error){console.error('No se pudo obtener sesión:',error);}
  actualizarCuenta();
  await cargarCatalogo();
})();
// Opcional: las publicaciones o comentarios de otros usuarios se refrescan en vivo.
// Si Realtime no está disponible, la lectura, búsqueda y CRUD siguen funcionando.
try {
  supabase.channel('lootlist-actualizaciones')
    .on('postgres_changes',{event:'*',schema:'public',table:'series'},()=>cargarCatalogo())
    .on('postgres_changes',{event:'*',schema:'public',table:'comentarios'},()=>cargarCatalogo())
    .subscribe();
} catch (error) { console.warn('Realtime no disponible:',error); }

if('serviceWorker' in navigator && location.protocol!=='file:'){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=20261113-4', {updateViaCache:'none'}).catch(err=>console.warn('PWA:',err)));
}

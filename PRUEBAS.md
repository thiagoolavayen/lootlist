# Pruebas efectuadas y pendientes

## Verificadas automáticamente sobre el código entregado (simulando respuestas de Supabase)
- El JavaScript de todos los módulos y el service worker pasa la comprobación sintáctica de Node.
- En modo visitante se ve el catálogo, pero el formulario de publicación y el de comentarios quedan ocultos.
- Las publicaciones históricas de anime/manga del antiguo proyecto no aparecen en LootList.
- Con sesión simulada del usuario A aparecen los botones editar/borrar sobre su recomendación.
- Crear un juego nuevo agrega una tarjeta al catálogo.
- La edición reutiliza el formulario y actualiza título correctamente.
- Enviar un comentario lo agrega a la tarjeta.
- Con sesión simulada del usuario B se ven los comentarios y se puede comentar, pero no aparecen los botones para editar/borrar la publicación del usuario A.
- El diseño en ancho de celular de 390 px no tiene desplazamiento horizontal.
- No se detectaron excepciones JavaScript en esas pruebas.

## Falta verificar con el Supabase REAL (necesita tus credenciales/tu proyecto)
- Ejecución satisfactoria de `SUPABASE/schema.sql` en tu proyecto.
- Permisos RLS reales (deben ser probados desde dos cuentas registradas).
- Subida real de imágenes a Storage `portadas`.
- Confirmación por email si está activada.
- Realtime y PWA una vez desplegada en tu URL pública de GitHub Pages.

Estas pruebas simuladas NO significan que la app ya esté configurada en tu Supabase. Seguí `GUIA_DE_ENTREGA.md` antes de entregarla a Classroom.

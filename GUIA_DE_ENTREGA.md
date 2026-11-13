# GUÍA DE ENTREGA | LOOTLIST

## Qué te toca hacer vos (en orden)

- [ ] **1. Supabase:** abrir tu proyecto anterior y ejecutar por completo el archivo `SUPABASE/schema.sql` en `SQL Editor`.
- [ ] **2. Confirmar configuración:** Table Editor: `series` y `comentarios` con RLS Enabled. Storage: `portadas` público con políticas seguras. Authentication → Providers → Email: proveedor Email habilitado y **Confirm email DESACTIVADO** (para entrar inmediatamente).
- [ ] **3. Chequear conexión:** verificar `supabaseClient.js`; la URL y Publishable Key apuntan al proyecto xdxkfshxmmghmbrtwrer.
- [ ] **4. Abrir la app:** VS Code > carpeta LOOTLIST > `index.html` > Live Server.
- [ ] **5. Prueba visitante:** ventana incógnito: solo puede leer catálogo/comentarios; no puede publicar ni comentar.
- [ ] **6. Prueba usuario 1:** registrarlo, iniciar sesión, publicar un juego, subir imagen, editarlo y comprobar en la base de datos. Dejá al menos un juego publicado.
- [ ] **7. Prueba usuario 2:** registrarlo e iniciar sesión. Debe poder comentar la publicación del usuario 1, pero no editarla ni eliminarla.
- [ ] **8. GitHub:** subir todos los archivos de la carpeta LOOTLIST al repositorio público.
- [ ] **9. Pages:** GitHub > Settings > Pages > Branch main > /(root) > Save. Comprobar que la web abre y funciona.
- [ ] **10. Login publicado:** Sin confirmación por email no hace falta configurar una URL de confirmación.
- [ ] **11. Classroom:** subir el **link del repositorio** y el **link de la web en GitHub Pages**.

## Comandos Git (copiar en terminal VS Code dentro de LOOTLIST)
```bash
git init
git add .
git commit -m "Entrega final LootList"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/lootlist.git
git push -u origin main
```

## Texto sugerido para pegar en Classroom

Proyecto: **LootList — Recomendaciones de videojuegos**

Repositorio: `https://github.com/TU-USUARIO/lootlist`

Página web: `https://TU-USUARIO.github.io/lootlist/`

Aplicación web con Supabase, usuarios, comentarios, portadas, CRUD, seguridad RLS y PWA.

## Aclaración sobre lo que no se puede completar desde el ZIP
La aplicación necesita acceso en línea a tu proyecto de Supabase y a tu cuenta de GitHub para comprobar las operaciones reales. El código, las políticas y el instructivo están preparados, pero **hasta que ejecutes el SQL, hagas las pruebas con dos usuarios reales y lo publiques**, no se puede considerar una entrega completamente verificada en internet.

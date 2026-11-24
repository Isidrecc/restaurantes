# Cuaderno de restaurantes

App web personal para puntuar y reseñar restaurantes: mapa, lista con filtros y una ficha por restaurante.

## Estado

Publicada en https://isidrecc.github.io/restaurantes/. Se ve sin entrar, en solo lectura; añadir, editar y puntuar es solo para quien tiene permiso, que se da en la consola de Firebase (`docs/accesos.md`). En construcción: la app básica (paso 3) está hecha; falta el remate (paso 5).

## Contenido

- `index.html` y `app/`: la app. HTML, CSS y JavaScript sin paso de compilación, con Firebase y Google Maps.
- `firestore.rules` y `storage.rules`: reglas de seguridad de Firebase. Se publican a mano en la consola.
- `.github/workflows/pages.yml` y `tools/build-site.mjs`: publicación en GitHub Pages con las páginas de compartir de cada ficha (`docs/publicacion.md`).
- `docs/especificacion.md`: decisiones, modelo de datos y orden de construcción.
- `docs/diseno.md`: diseño vigente, que manda sobre la especificación y la demo.
- `docs/accesos.md`: cómo dar y quitar permisos en la consola de Firebase.
- `docs/mapa/`: estilos del mapa para importar en Google Cloud.
- `demo/index.html`: prototipo de la interfaz con datos inventados. Ya no se actualiza.
- `CLAUDE.md`: instrucciones de trabajo para Claude Code.

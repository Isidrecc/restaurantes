# Cuaderno de restaurantes

App web personal para puntuar y reseñar restaurantes: mapa, lista con filtros y una ficha por restaurante.

## Estado

Publicada en https://isidrecc.github.io/restaurantes/ con acceso solo por invitación. En construcción: la app básica (paso 3) está hecha; falta el remate (paso 5). Los accesos se gestionan en la consola de Firebase (`docs/accesos.md`).

## Contenido

- `index.html` y `app/`: la app. HTML, CSS y JavaScript sin paso de compilación, con Firebase y Google Maps.
- `firestore.rules` y `storage.rules`: reglas de seguridad de Firebase. Se publican a mano en la consola.
- `docs/especificacion.md`: decisiones, modelo de datos y orden de construcción.
- `docs/diseno.md`: diseño vigente, que manda sobre la especificación y la demo.
- `docs/accesos.md`: cómo dar y quitar acceso en la consola de Firebase.
- `docs/mapa/`: estilos del mapa para importar en Google Cloud.
- `demo/index.html`: prototipo de la interfaz con datos inventados. Ya no se actualiza.
- `CLAUDE.md`: instrucciones de trabajo para Claude Code.

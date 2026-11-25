# Cuaderno de restaurantes

App web personal para puntuar y reseñar restaurantes: mapa, lista con filtros y una ficha por restaurante. Se servirá desde este repo con GitHub Pages.

## Estado

- La fase de diseño inicial se cerró en una conversación previa (21 a 23 de noviembre de 2026). La app real está publicada en GitHub Pages (https://isidrecc.github.io/restaurantes/) desde el 23 de noviembre de 2026.
- Nombre de la app: «Puntuam a taula».
- Pasos 1 y 2 terminados el 23 de noviembre de 2026. Resultados de la prueba técnica en `docs/especificacion.md`, sección 8.
- Diseño vigente en `docs/diseno.md`: solo puntúan dos personas (`azul` y `rosa` en los datos, vistos en tinta y turquesa); desde el 24 de noviembre de 2026 la app se ve sin entrar, en solo lectura, y las fichas se comparten con un enlace; texto largo y fotos con pie por restaurante (23 de noviembre de 2026). Desde el 24 de noviembre, también el aspecto (paleta «Terracota suau» con letra del sistema, mapa «Terracota» y «Terracota nit», menú flotante), el alta en cuatro pasos, la edición en una pantalla y la app en catalán. El aspecto se sigue retocando poco a poco, a petición del propietario. La demo no se actualiza.
- Paso 3 terminado el 24 de noviembre de 2026, con la prueba final y la aprobación del propietario en el iPhone. Partes y decisiones en `docs/diseno.md`, sección 10.
- Paso 4 (pantalla de accesos) descartado el 24 de noviembre de 2026: los accesos se gestionan en la consola de Firebase con `docs/accesos.md`.
- Peticiones del propietario del 24 de noviembre de 2026, en cinco partes (`docs/diseno.md`, sección 10, «Peticiones del 24 de noviembre de 2026»): terminadas y aprobadas el 25 de noviembre de 2026. En espera, sin fecha: fotos intercaladas con el texto del comentario.
- Siguiente: paso 5, remate (icono e instalación, consulta sin cobertura, copia de seguridad y sacar la clave del mapa del repo). Orden de construcción en `docs/especificacion.md`, sección 6.
- Ficha de prueba en la base de datos real que el propietario conserva por ahora: «Prova Claude (esborrar)». «Celler de proves» ya no está (comprobado el 24 de noviembre de 2026).
- Se trabaja directamente en `main`, sin ramas ni pull requests, por decisión del propietario (24 de noviembre de 2026). Se retomarán cuando los cambios sean más complicados.
- Copia local del propietario: `Dropbox\08 CURSOS PERSONALES\11 Puntuam a taula`.
- La seguridad está en la sección 9 de la especificación.

## Qué leer antes de tocar nada

1. `docs/especificacion.md`: decisiones tomadas, pendientes de confirmar, pantallas, modelo de datos, orden de construcción y condiciones de Google.
2. `docs/diseno.md`: diseño vigente, que manda sobre partes de la especificación y de la demo.
3. `demo/index.html`: prototipo aprobado. Es la referencia de comportamiento, salvo lo que cambia `docs/diseno.md`. Ya no lo es de aspecto ni de textos. Se abre directamente en un navegador.

## Cómo trabajar con el propietario

- Idioma: español.
- Antes de construir, estructurar el trabajo y acordar el enfoque con él. Unas preguntas de opción múltiple no equivalen a aprobar el enfoque.
- Enseñarle el resultado al final de cada paso del orden de construcción y esperar su visto bueno antes del siguiente.
- Respuestas concisas y estructuradas, con lo crítico primero.
- Redacción llana, sin frases hechas. No usar rayas ni guiones a modo de raya.
- Si algo no se ha comprobado, decirlo. No dar por buenos precios ni condiciones de servicios externos sin verificarlos en la documentación oficial.
- Los pasos que haga él en consolas externas (Google Cloud, Firebase, GitHub) se guían uno a uno.

## Reglas del proyecto

- No añadir funciones que no estén en la especificación sin proponerlas antes.
- El aspecto es el de `docs/diseno.md` (secciones 4 a 8). Cualquier cambio visual que no esté ahí se consulta.
- El repo es público. No subir datos de restaurantes, fotos, correos de usuarios ni credenciales privadas.
- La configuración web de Firebase y la clave de Google Maps sí van en el código, porque son identificadores públicos. Deben estar protegidas: clave limitada al dominio de GitHub Pages y a las API necesarias, y datos cerrados por reglas de seguridad.
- Textos de la interfaz en catalán. Decimales con coma (8,5).
- Mensajes de commit en español, con una línea de resumen en imperativo.

## Técnica (confirmada por el propietario)

- HTML, CSS y JavaScript sin framework ni paso de compilación, con módulos ES. La demo ya está hecha así.
- Publicación (desde el 24 de noviembre de 2026): GitHub Actions monta la web con `tools/build-site.mjs` (versión en los archivos y páginas de compartir `f/<id>/` con la portada) y la publica en GitHub Pages en cada push a `main` y cada 30 minutos. Ver `docs/publicacion.md`. Si se añade un archivo o carpeta que la app necesita, hay que añadirlo a la copia de ese script.
- Firebase (Auth con Google, Firestore y Storage) con el SDK modular.
- Google Maps JavaScript API para el mapa. La demo usa Leaflet con una base esquemática solo porque se hizo dentro de un artefacto que bloquea mapas externos.
- PWA instalable en iPhone.

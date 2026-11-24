# Cuaderno de restaurantes

App web personal para puntuar y reseñar restaurantes: mapa, lista con filtros y una ficha por restaurante. Se servirá desde este repo con GitHub Pages.

## Estado

- La fase de diseño inicial se cerró en una conversación previa (21 a 23 de noviembre de 2026). La app real está publicada en GitHub Pages (https://isidrecc.github.io/restaurantes/) desde el 23 de noviembre de 2026.
- Nombre de la app: «Puntuam a taula».
- Pasos 1 y 2 terminados el 23 de noviembre de 2026. Resultados de la prueba técnica en `docs/especificacion.md`, sección 8.
- Diseño vigente en `docs/diseno.md`: solo puntúan dos personas (azul y rosa), los demás invitados miran; texto largo y fotos con pie por restaurante (23 de noviembre de 2026). Desde el 24 de noviembre, también el aspecto (paleta «Berenjena», mapa «Lavanda» y «Noche», menú flotante), el alta en cuatro pasos, la edición en una pantalla y la app en catalán. La demo no se actualiza.
- Paso 3 casi cerrado: partes 3a a 3g publicadas y aprobadas (la última, el 24 de noviembre de 2026). De la 3h (cierre) solo falta la prueba final del propietario en el iPhone; la carpeta `prueba/` ya está borrada (`docs/diseno.md`, sección 10).
- Siguiente: paso 4, compartir (pantalla de accesos y solicitudes de acceso). Orden de construcción en `docs/especificacion.md`, sección 6.
- Fichas de prueba en la base de datos real que el propietario conserva por ahora: «Celler de proves» y «Prova Claude (esborrar)».
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

- HTML, CSS y JavaScript sin framework ni paso de compilación, con módulos ES. La demo ya está hecha así y GitHub Pages lo sirve tal cual.
- Firebase (Auth con Google, Firestore y Storage) con el SDK modular.
- Google Maps JavaScript API para el mapa. La demo usa Leaflet con una base esquemática solo porque se hizo dentro de un artefacto que bloquea mapas externos.
- PWA instalable en iPhone.

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
- Paso 5, remate (icono e instalación, consulta sin cobertura, copia de seguridad, sacar la clave del mapa del repo y, desde el 25 de noviembre de 2026, estadísticas de uso y vista para ordenador). Orden de construcción en `docs/especificacion.md`, sección 6. Partes y estado en `docs/diseno.md`, sección 10, «Paso 5, por partes». Icono (opción A) hecho el 25 de noviembre de 2026; las demás opciones de logotipo, en `docs/logo/`. La parte 5b (consulta sin cobertura) la probó el propietario en su iPhone el 25 de noviembre de 2026. La 5c (copia de seguridad) es un .csv que se saca con `node tools/copia-csv.mjs` y queda en `copias/`, en Dropbox y fuera de git; aprobada por el propietario el 25 de noviembre de 2026.
- **Siguiente** (25 de noviembre de 2026):
  1. Pendiente de respuesta del propietario (`docs/diseno.md`, sección 10, «Altas del 25 de noviembre de 2026»): qué tipo llevan Blat al Sac, Selvatge y Los Platos de Soto, y la opción «Sense preu» para los tres hoteles. Las otras 12 fichas nuevas ya tienen tipo.
  2. Parte 5d, clave del mapa: proponer el enfoque antes de construir. Después 5e y 5f, en ese orden salvo que él diga otro.
- Ya no quedan fichas de prueba en la base de datos real: ni «Celler de proves» ni «Prova Claude (esborrar)» (comprobado el 25 de noviembre de 2026).
- Desde el 25 de noviembre de 2026 una ficha puede tener varios locales (`branches`, hasta tres más), pedido por el propietario para Santa Chiara y Klüg. Estado en `docs/diseno.md`, sección 10, «Varios locales por ficha». Aprobado por el propietario en su iPhone el 25 de noviembre de 2026.
- Desde el 25 de noviembre de 2026 hay un tipo nuevo, «Prendre una copa», para bares y terrazas de copas, creado al dar de alta los primeros. Es un tipo más de la lista, sin pantalla propia.
- Se trabaja directamente en `main`, sin ramas ni pull requests, por decisión del propietario (24 de noviembre de 2026). Se retomarán cuando los cambios sean más complicados.
- Copia local del propietario: `Dropbox\08 CURSOS PERSONALES\11 Puntuam a taula`.
- La seguridad está en la sección 9 de la especificación.

## Qué leer antes de tocar nada

1. `docs/especificacion.md`: decisiones tomadas, pendientes de confirmar, pantallas, modelo de datos, orden de construcción y condiciones de Google.
2. `docs/diseno.md`: diseño vigente, que manda sobre partes de la especificación y de la demo.
3. `demo/index.html`: prototipo aprobado. Es la referencia de comportamiento, salvo lo que cambia `docs/diseno.md`. Ya no lo es de aspecto ni de textos. Se abre directamente en un navegador.
4. `docs/forma-de-trabajar.md`: cómo trabaja el propietario, paso a paso, y aprendizajes técnicos de sesiones anteriores (prueba local, despliegue, estilos del mapa).

## Cómo trabajar con el propietario

- Idioma: español.
- Antes de construir, estructurar el trabajo y acordar el enfoque con él. Unas preguntas de opción múltiple no equivalen a aprobar el enfoque.
- Enseñarle el resultado al final de cada paso del orden de construcción y esperar su visto bueno antes del siguiente.
- Respuestas concisas y estructuradas, con lo crítico primero.
- Redacción llana, sin frases hechas. No usar rayas ni guiones a modo de raya.
- Si algo no se ha comprobado, decirlo. No dar por buenos precios ni condiciones de servicios externos sin verificarlos en la documentación oficial.
- Los pasos que haga él en consolas externas (Google Cloud, Firebase, GitHub) se guían uno a uno, con los nombres de menú en español y un enlace de GitHub fijado al commit para los archivos.
- Suele seguir la sesión desde el móvil con Remote Control: el último mensaje debe entenderse solo y acabar con la pregunta y sus opciones.
- «Dale» aprueba la propuesta tal como está, con sus recomendaciones. Si había que elegir y no elige, se toma la recomendada y se dice.
- Al terminar cada parte: publicar, comprobar en la web publicada, enviarle capturas y preguntar si la da por buena. Detalle en `docs/forma-de-trabajar.md`.

## Reglas del proyecto

- No añadir funciones que no estén en la especificación sin proponerlas antes.
- El aspecto es el de `docs/diseno.md` (secciones 4 a 8). Cualquier cambio visual que no esté ahí se consulta.
- El repo es público. No subir datos de restaurantes, fotos, correos de usuarios ni credenciales privadas.
- La configuración web de Firebase y la clave de Google Maps sí van en el código, porque son identificadores públicos. Deben estar protegidas: clave limitada al dominio de GitHub Pages y a las API necesarias, y datos cerrados por reglas de seguridad.
- Textos de la interfaz en catalán. Decimales con coma (8,5).
- Mensajes de commit en español, con una línea de resumen en imperativo.

## Técnica (confirmada por el propietario)

- HTML, CSS y JavaScript sin framework ni paso de compilación, con módulos ES. La demo ya está hecha así.
- Publicación (desde el 24 de noviembre de 2026): GitHub Actions monta la web con `tools/build-site.mjs` (versión en los archivos y páginas de compartir `f/<id>/` con la portada) y la publica en GitHub Pages en cada push a `main` y cada 30 minutos. Ver `docs/publicacion.md`. Si se añade un archivo o carpeta que la app necesita, hay que añadirlo a la copia de ese script y, si no está en `app/` ni en `icons/`, a la lista del service worker (`sw.js`, consulta sin cobertura desde el 25 de noviembre de 2026).
- Firebase (Auth con Google, Firestore y Storage) con el SDK modular.
- Google Maps JavaScript API para el mapa. La demo usa Leaflet con una base esquemática solo porque se hizo dentro de un artefacto que bloquea mapas externos.
- PWA instalable en iPhone.

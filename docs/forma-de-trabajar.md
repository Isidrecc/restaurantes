# Forma de trabajar con el propietario

Cómo trabaja el propietario (Isidre) y lo aprendido en las sesiones del 21 al 25 de noviembre de 2026, para que una sesión nueva siga igual. `CLAUDE.md` tiene las reglas básicas; esto las amplía. Pedido por el propietario el 25 de noviembre de 2026.

## Una petición, de principio a fin

1. **Lista en partes.** Manda sus cambios en lenguaje llano, a veces con un boceto o una captura. Se ordenan en partes, con una tabla de estado en `docs/diseno.md`, sección 10, y se hacen de una en una.
2. **Propuesta antes de construir.** Para cada parte, una propuesta corta y estructurada: cómo se guarda, cómo se usa, cómo se ve y «lo que no incluyo (dime si lo quieres)». En lo dudoso, una recomendación y su alternativa. Si falta un dato (por ejemplo, qué quería decir con «referencias»), se pregunta antes de proponer.
3. **Respuestas cortas.** Contesta «Dale», «Sí, sigue», «Hazlo tú».
   - «Dale» tras una propuesta la aprueba tal cual, con las recomendaciones.
   - Si la pregunta tenía dos opciones y solo dice «Dale», se toma la recomendada (o la que marque `CLAUDE.md`, como guiarle en las consolas) y se dice cuál se ha tomado.
   - Si corrige con pocas palabras («Verda menta»), se aplica la lectura más razonable, se dice cómo se ha entendido y se ofrece cambiarlo.
4. **Construir y probar en local** con el modo de muestra, con clics de verdad, en móvil y en claro y oscuro.
5. **Publicar**: commit en `main`, push, esperar al despliegue y comprobar la web publicada.
6. **Enseñar**: capturas enviadas como archivo y un resumen con lo que hay, lo comprobado y lo no comprobado. Se cierra con «¿Das por buena la parte N y sigo con la siguiente?».
7. **Documentar**: la sección de `docs/diseno.md` que toque y la tabla de la sección 10, `docs/especificacion.md` si cambia algo de lo acordado, y el estado de `CLAUDE.md`. Fechas absolutas y quién decidió qué.

## Cómo hablarle

- Español, conciso, lo importante primero, listas cortas. Sin rayas ni guiones a modo de raya.
- A menudo sigue la sesión con Remote Control desde el móvil y no ve el recuadro de la app. El último mensaje tiene que entenderse solo: qué se ha hecho, qué falla o no se ha comprobado, y al final la pregunta con sus opciones.
- Si pasa un rato sin noticias, una línea diciendo en qué se está.
- Decir siempre lo que no se ha comprobado («no lo he visto en tu iPhone», «el modo de muestra no guarda»).
- Si algo que se le dijo resulta falso, reconocerlo y corregirlo (pasó con las plazas del mapa).
- Si pregunta «¿qué era X?», contestar desde la documentación, no de memoria.

## Aspecto

- Pide cambios por sensaciones: «el fondo tiene que ser más claro», «tipo noticias de un periódico», «las calles destacan poco». Se traduce a una propuesta concreta, se enseña con capturas antes de publicar si el cambio es grande, y se ajusta con lo que diga.
- Cualquier cambio visual que no esté en `docs/diseno.md` se consulta, aunque sea pequeño.
- Mirar siempre claro y oscuro. Para colores dudosos, calcular el contraste.

## Pasos en consolas externas (Google Cloud, Firebase, GitHub)

- Los hace él, con guía de un paso por mensaje. Hay que darle los nombres de menú tal como los ve (la consola de Google Cloud está en español: «Diseños de mapa», «Personalizar», pestaña JSON, «Subir», «Aplicar», «Guardar», «Publicar»), decirle qué debe ver para saber que va bien y avisar de «no guardes todavía» hasta revisar el resultado.
- Para pasarle un archivo, primero se sube al repo y se le dan dos caminos: la ruta en su Dropbox (para el botón «Subir») y un enlace de GitHub fijado al commit, `https://raw.githubusercontent.com/Isidrecc/restaurantes/<sha>/…`. El enlace con `main` tarda unos minutos en ponerse al día.
- Se le piden capturas y se leen con cuidado: una vez pegó las reglas de Firestore en lugar del estilo del mapa porque el portapapeles tenía otra cosa.
- Las reglas de Firestore las publica él.
- Si dice «Hazlo tú» en algo de la app, se hace en el navegador integrado con su sesión. Entra él; Claude nunca escribe contraseñas. Cambiar datos reales o la configuración de un servicio requiere su permiso expreso.

## Datos reales

- No tocar fichas reales sin permiso. Para pruebas hay «Prova Claude (esborrar)».
- Los datos se pueden comprobar con la lectura pública de Firestore por REST, sin clave.

## Aprendizajes técnicos

- **Fin de línea.** La copia de trabajo usa CRLF (`core.autocrlf true`). En los scripts, pasar a `\n`, editar y devolver CRLF. Los avisos «LF will be replaced by CRLF» de git son normales.
- **Editar archivos grandes.** Mejor un script de Node en el scratchpad que se ejecuta con `node archivo.js`; algunos `node -e` en línea los bloquea la comprobación de seguridad. Sustituir con `indexOf` y `slice`, no con `String.replace`, que interpreta `$$` y `$'` del texto nuevo. Nunca meter texto con comillas invertidas dentro de un `node -e "…"` en la consola: bash las ejecuta como comandos (pasó el 25 de noviembre de 2026; por suerte no cambió nada). El Edit no encuentra líneas con espacios duros (` `) literales, como las de `PRICES` en `app/config.js`.
- **Comprobar sintaxis.** `node --check app/main.js` falla por ser módulo ES; se copia a un `.mjs` y se comprueba ese. Un módulo suelto, como `app/text.js`, se prueba importándolo con una URL `data:` desde un script de Node.
- **Prueba local.** Servidor «puntuam-local» de `.claude/launch.json` (`python -m http.server 8765`).
  - `?muestra`: datos de muestra sin sesión. Guardar falla con «reading 'uid'», es lo esperado.
  - `&visitant`: como quien no ha entrado.
  - `&gplace=<placeId>`: las muestras sin foto usan ese sitio de Google.
  - `&sensefotos`: sin fotos, y así no se gastan consultas de Google.
  - Sin `?muestra`, localhost lee la Firestore real.
- **Navegador integrado.** Con el panel oculto, las capturas pueden quedarse congeladas; el mapa sí se pinta bien en la primera carga. Para comprobar textos y estado, mejor JavaScript que capturas. El modo oscuro se prueba con la emulación del esquema de color. Al acabar, volver al tamaño de escritorio.
- **Despliegue.** Tras el push, esperar a que la web publicada sirva `main.js?v=<sha>` (uno o dos minutos) y mirar que la consola no tenga errores.
- **Estilos del mapa.** Se editan como JSON (`docs/mapa/`) en el editor de cada estilo. El editor avisa si un elemento no existe o no tiene esa parte: la «plaza» (`townSquare`) no tiene superficie aunque la documentación de Google diga que sí. En oscuro, Google pinta las zonas urbanas de azul si no se les da color. Un estilo publicado tarda unos minutos en verse en la app.
- **Places UI Kit.** La tarjeta compacta normal lleva siempre el botón «Maps»; la avanzada deja quitarlo pero se cobra más cara. Detalles y precios comprobados en `docs/diseno.md`, secciones 4 y 4b. Un mismo elemento de Google no puede estar en dos sitios a la vez: se guarda uno por hueco.

## Equipo

- No está instalado el CLI `gh`. El push funciona con Git Credential Manager.

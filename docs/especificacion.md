# Cuaderno de restaurantes: especificación

Documento de traspaso. Recoge lo acordado entre el propietario y Claude entre el 21 y el 23 de noviembre de 2026, con las partes que han cambiado después ya actualizadas. Lo decidido más tarde está en `docs/diseno.md`, que manda sobre este documento. Lo que no aparece en ninguno de los dos no está decidido.

## 1. Qué es

App personal para puntuar y reseñar los restaurantes visitados.

- Volumen previsto: como máximo unos 100 restaurantes.
- ~~Privada. Se comparte con unas pocas personas invitadas.~~ Desde el 24 de noviembre de 2026, pública en solo lectura: cualquiera la ve sin entrar y las fichas se comparten con un enlace. Añadir, editar y puntuar sigue siendo solo para quien tiene permiso.
- Uso principal desde el iPhone, también desde ordenador.

## 2. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Vistas | Dos: mapa y lista. Los filtros son comunes a ambas. |
| Criterios | Seis, en este orden: calidad del producto, plato estrella, técnica y creatividad, servicio, calidad/precio, ambiente. |
| Escala | De 1 a 10 con una décima (8,6), desde el 24 de noviembre de 2026; antes, medios puntos. |
| Nota global | Media simple de los criterios puntuados. |
| Plato estrella | Lleva nombre propio del plato además de la nota. |
| Fichas | Una por restaurante, no una por visita. |
| Tipos de cocina | Varios por restaurante. |
| Roseta | En la ficha, debajo de las puntuaciones. Estilo de las cartas de jugadores de fútbol (ver sección 4). |
| Alta | En cuatro pasos, empezando por el buscador de Google para situar el restaurante. Ver `docs/diseno.md`, sección 5. |
| Mapa | Google Maps, con estilo propio en claro y oscuro. Ver `docs/diseno.md`, sección 8. |
| Datos y fotos | Firebase: Auth con cuentas de Google, Firestore y Storage. |
| Alojamiento | GitHub Pages desde este repo, que es público. Desde el 24 de noviembre de 2026 lo publica un flujo de GitHub Actions que añade las páginas de compartir de cada ficha (`docs/publicacion.md`). |
| UI | La estructura de la demo (`demo/index.html`), aprobada por el propietario, con el aspecto, el alta y la edición de `docs/diseno.md` (secciones 5 a 8). |
| Idioma de la app | Catalán. Ver `docs/diseno.md`. |
| Compartir | Puntúan dos personas (colores tinta y turquesa). La app se ve sin entrar y cada ficha se comparte con un enlace (24 de noviembre de 2026). Ver `docs/diseno.md`, sección 1. |
| Ámbito | También restaurantes de fuera de Mallorca. La localidad se saca de la dirección de Google. Solo se escribe a mano si Google no la da, y entonces el campo sugiere las ya usadas, para evitar variantes del mismo sitio. |
| Técnica | HTML, CSS y JavaScript sin framework ni paso de compilación. |
| Orden de construcción | El de la sección 6. |
| Nombre | «Puntuam a taula». Bajo el icono del iPhone, «Puntuam». Proyecto de Firebase `puntuam-a-taula`. Decidido el 23 de noviembre de 2026. |
| Cuenta de administración | Una cuenta de Google aparte, solo para las consolas de Firebase y Google Cloud y la facturación. En la app, el propietario entra con su cuenta personal. Su cuenta personal se añade como segunda propietaria del proyecto para no perder el acceso. |
| Plan y control de gasto | Plan Blaze con alerta de presupuesto de 5 € (solo avisa). Los límites de gasto de Google Cloud no cubren los servicios que usamos (ver sección 9). |
| Seguridad | La de la sección 9. Nadie sin permiso puede leer, escribir ni subir fotos. |

### Opciones descartadas

- **Artefacto dentro de Claude:** bloquea mapas y API externas. Sirvió para la demo.
- **OpenStreetMap:** se usó como idea para la demo. Se abandona porque los datos de Places solo pueden mostrarse sobre un mapa de Google.
- **Dropbox como almacén:** compartir tiene más fricción (cada editor necesita cuenta y carpeta compartida) y la integración se valoró como más difícil.
- **Servidor en un Mac propio:** exige exponerlo a Internet, con mantenimiento y copias a cargo del propietario.
- **Supabase:** el plan gratuito pausa el proyecto tras una semana sin actividad.
- **Solo en el dispositivo:** no sincroniza ni permite compartir.

## 3. Pendiente de confirmar con el propietario

Los cuatro puntos que quedaban abiertos el 23 de noviembre (compartir, orden de construcción, técnica y restaurantes de fuera de Mallorca) los confirmó el propietario y están en la sección 2.

### Diseño de puntuaciones

El 23 de noviembre de 2026 se aprobó primero un «cuaderno común» en el que puntuaba todo el grupo y, al revisar la demo, se sustituyó por el diseño vigente: `docs/diseno.md`. Puntúan dos personas, cada una en su color; los demás invitados miran. Donde `docs/diseno.md` choque con esta especificación, manda `docs/diseno.md`.

### Copias de seguridad

No se activaron al crear Firestore (23 de noviembre de 2026). Se decide en el paso 5: copias programadas de Firestore (verificar antes su precio), qué hacer con las fotos de Storage, que esas copias no cubren, o si basta con la exportación desde la app.

Decidido por el propietario el 25 de noviembre de 2026: un .csv con las puntuaciones, sacado con un script y guardado en Dropbox, sin nada en la app y sin copias programadas. Detalle en `docs/diseno.md`, sección 10, «5c · Copia de seguridad».

## 4. Pantallas y comportamiento

La referencia es la demo, salvo el aspecto, el alta y la edición, que están en `docs/diseno.md`. Este apartado resume lo que hay que conservar y lo que cambia.

### Navegación

La app se abre en Inici, con paneles destacados (`docs/diseno.md`, sección 4b). Menú inferior flotante «Inici · Mapa · + · Llista», con el «+» para añadir (sección 7). La ficha se abre a pantalla completa por encima.

### Filtros (comunes a mapa y lista)

- Búsqueda por nombre, localidad y dirección, sin distinguir acentos ni mayúsculas.
- Nota mínima, aplicable a la nota global o a uno de los seis criterios. En pasos de medio punto.
- Tipos de cocina: se muestra el restaurante si tiene cualquiera de los marcados.
- Localidad.
- Precio.
- Los filtros activos se ven como etiquetas que se quitan una a una o todas a la vez. Contador "N de M".

### Mapa

- Un pin por restaurante, con la nota global dentro y coloreado según ella.
- Los pines que se solapan se agrupan en un círculo con el número. Se separan al acercar.
- Al tocar un pin aparece una tarjeta resumen con acceso a la ficha. El pin seleccionado queda visible por encima de la tarjeta.
- Leyenda de colores.
- Estilo propio «Terracota» en claro y «Terracota nit» en oscuro (antes, «Lavanda» y «Noche»), sin los puntos de interés de Google (`docs/diseno.md`, sección 8).

### Lista

- Tarjetas con nota global, nombre, localidad, tipos de cocina, precio, plato estrella con su nota y fecha de visita.
- Orden por nota, por fecha o por nombre.

### Color y texto de la nota

Se calcula sobre la nota redondeada a un decimal.

| Nota | Texto |
|---|---|
| 9 o más | Excel·lent |
| De 8 a 8,9 | Molt bo |
| De 7 a 7,9 | Bo |
| De 5 a 6,9 | Correcte |
| Menos de 5 | Fluix |

Los colores exactos están en los tokens `--s1` a `--s5` de `app/styles.css` (los mismos de la demo), con variantes para modo claro y oscuro. No cambian con la paleta nueva. El color nunca va solo: siempre acompaña a un número.

### Añadir y editar

- Alta en cuatro pasos (dónde está, datos, nota, texto y fotos) con barra de progreso. Edición en una sola pantalla. Detalle en `docs/diseno.md`, secciones 5 y 6.
- Datos: nombre (obligatorio), tipos de cocina (selección múltiple), fecha de visita (por defecto hoy, con atajos «Avui» y «Ahir», o «Pendent de visitar», sin fecha ni nota) y precio en cinco tramos.
- Ubicación: el buscador de Google lleva el mapa al sitio; el pin lo pone el usuario tocando el mapa y se puede arrastrar para afinar. La localidad se saca de Google.
- Valoración: un deslizador por criterio, con décimas desde el 24 de noviembre de 2026 (`docs/diseno.md`, sección 5). Un criterio sin tocar queda «Sense nota». El plato estrella lleva además el nombre del plato. La nota global y la roseta se actualizan en vivo. Es opcional.
- Texto largo y fotos con pie. Se pueden añadir varias fotos y quitarlas antes de guardar. El texto admite negrita, cursiva, subrayado y enlaces a otras webs, con botones (`docs/diseno.md`, sección 5, paso 4).

### Ficha

Detalle en `docs/diseno.md`, sección 4.

- Nombre, dirección, etiquetas de localidad, tipos de cocina y precio, y fecha de visita.
- Nota global grande con su texto.
- Las seis notas, con una barra por persona que puntúa.
- **Roseta:** rejilla hexagonal con un hexágono interior en el 5 y radios a los vértices. Una línea por persona que puntúa, en su color. Nombres de los criterios en negrita en los vértices. Sin números dentro del gráfico: las notas exactas están en las barras de encima. Orden desde arriba y en sentido horario: producto, plato estrella, técnica, servicio, calidad/precio, ambiente.
- Texto largo con su formato, y fotos con pie que se amplían al tocarlas.
- Acciones: ver en el mapa, puntuar, editar y borrar con confirmación.

### Valores usados en la demo

- Tipos de cocina: Mallorquina, Mediterránea, Arroces, Pescado y marisco, Brasa, Tapas, De autor, Italiana, Japonesa, Otra. La lista es ampliable. En la app se sustituyen por los de docs/diseno.md, sección 2, con un botón para añadir más.
- Precio: €, €€, €€€, €€€€. En la app pasan a ser precio por persona sin bebida: <20 €, 20-40 €, 40-60 €, 60-100 € y >100 € desde el 24 de noviembre de 2026; antes, cuatro tramos (docs/diseno.md, sección 2).
- Los restaurantes de la demo son inventados.

### Qué cambia respecto a la demo

- La base del mapa pasa a ser Google Maps. La demo dibuja un contorno de Mallorca con municipios porque no podía cargar mapas externos.
- La localidad se saca de la dirección de Google. En la demo es una lista cerrada de municipios de Mallorca que se detecta sola al tocar el mapa.
- Se añade "usar mi ubicación" al situar el restaurante.
- El aspecto cambia: paleta «Terracota suau» con letra del sistema, mapa «Terracota» y «Terracota nit» y menú inferior flotante (`docs/diseno.md`, secciones 7 y 8). Antes del 24 de noviembre de 2026, «Berenjena», «Lavanda» y «Noche».
- El alta va en cuatro pasos y la edición en una sola pantalla.
- Los textos están en catalán.
- Los datos y las fotos se guardan de verdad. Las fotos se comprimen antes de subirlas.
- Sin entrar, todo se ve en solo lectura, y cada ficha tiene «Comparteix».

## 5. Modelo de datos

El modelo vigente está en `docs/diseno.md`, sección 9: la parte común de cada restaurante en `restaurants`, la nota de cada persona en una subcolección `ratings` y los papeles en `members`. El modelo inicial del 23 de noviembre de 2026 (notas dentro del restaurante y un documento con dos listas de correos) se sustituyó al pasar al diseño de dos personas y queda en el historial de git.

### Fotos

En Storage, una carpeta por restaurante. Lado mayor de 1600 px y una miniatura de 400 px para las listas, en JPEG (sección 8).

## 6. Orden de construcción

Confirmado por el propietario.

1. **Preparación.** La hace el propietario con guía, unos 20 minutos: proyecto de Google con tarjeta y alerta de presupuesto, Firebase en región europea y clave del mapa restringida al dominio de GitHub Pages. El repo ya está creado.
2. **Prueba técnica.** Login con Google en el iPhone con la app instalada, guardar y leer una ficha, subir una foto y cargar el mapa. Es el punto con más riesgo y va antes de portar nada.
3. **App real.** La estructura de la demo con datos reales y mapa de Google, con el aspecto, el alta y la edición de `docs/diseno.md`. Partes y estado en `docs/diseno.md`, sección 10. Terminado el 24 de noviembre de 2026.
4. ~~**Compartir.** Pantalla de accesos (propietarios, editores e invitados que solo miran, con el color de quien puntúa) y solicitudes de acceso.~~ Descartado por el propietario el 24 de noviembre de 2026: los permisos se dan y se quitan en la consola de Firebase (`docs/accesos.md`). Ese mismo día la app pasó a verse sin entrar y las solicitudes de acceso se quitaron.
5. **Remate.** Icono e instalación en el iPhone, consulta sin cobertura de lo ya cargado y exportar una copia de seguridad. Además, sacar la clave de Google Maps del repo (propuesto por el propietario el 24 de noviembre de 2026): clave nueva con las mismas restricciones y topes, guardada como secreto de GitHub y puesta en la página al publicar con GitHub Actions; en local, en un archivo que no se sube. Después, borrar la clave antigua para que las del historial dejen de valer y quitarla de la sección 10. La clave seguirá viéndose en la web publicada: lo que se gana es que no esté en GitHub. Decidir entonces qué hacer con la configuración de Firebase, que también está en el repo. Hecho el 25 de noviembre de 2026; la configuración de Firebase se queda en el repo (`docs/diseno.md`, sección 10, «5d · Clave del mapa»). Por último, **estadísticas de uso** (pedido por el propietario el 25 de noviembre de 2026): saber cuánta gente entra y qué mira, por ejemplo visitas, fichas abiertas y enlaces compartidos que se abren. Al empezar el paso se analizan las opciones (lo que ya dan Google Cloud y Firebase, herramientas de estadísticas web sin cookies y Google Analytics) y se comprueban en su documentación oficial el precio, las condiciones y si hace falta aviso de cookies o consentimiento. También una **vista para ordenador** (pedido por el propietario el 25 de noviembre de 2026): hoy la web está pensada para el móvil y en una pantalla ancha se ve como una columna estrecha; qué incluye y cómo se reparte la pantalla se propone al empezar esa parte.
6. **Más adelante.** Lo que quede de Places. El buscador para situar el restaurante se adelantó al paso 3 (`docs/diseno.md`, sección 5).

Se enseña el resultado al propietario al final de los pasos 2, 3 y 5.

## 7. Condiciones de Google que afectan al diseño

Comprobadas el 23 de noviembre de 2026. Volver a verificarlas antes de apoyarse en ellas.

- **Mapa.** Los datos de Places que se muestren en un mapa tienen que ir sobre un mapa de Google.
- **Almacenamiento.** De lo que devuelve Places solo se puede guardar de forma indefinida el identificador del sitio. El resto hay que pedirlo de nuevo cuando haga falta. Los datos propios del usuario (notas, reseña, fotos, tipos de cocina) no tienen restricción. Lo que la app hace con los datos de Places al dar de alta está en `docs/diseno.md`, sección 5, y se aparta de esta regla por decisión del propietario.
- **Atribución.** Mostrar datos de Places exige la atribución de Google.
- **Cupos gratuitos mensuales vistos:** 10.000 cargas de mapa dinámico, 10.000 peticiones por servicio de la categoría Essentials y 5.000 por servicio de la categoría Pro.
- **Firebase.** Storage exige el plan de pago por uso, que no tiene cuota fija y mantiene cupos gratuitos. Cupos vistos: Firestore con 1 GiB, 50.000 lecturas y 20.000 escrituras al día. Storage con 5 GB gratis en regiones de EE. UU. y del orden de 0,026 $ por GB al mes fuera de ellas.
- **Coste esperado a esta escala:** 0 € al mes o céntimos. Requiere tarjeta.
- **GitHub Pages.** En el plan gratuito solo funciona con repos públicos.

Fuentes:

- https://developers.google.com/maps/documentation/places/web-service/policies
- https://developers.google.com/maps/billing-and-pricing/pricing
- https://developers.google.com/maps/billing-and-pricing/pricing-categories
- https://firebase.google.com/pricing
- https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024
- https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/what-is-github-pages

### Condiciones de Google Maps Platform para el EEE

Comprobado el 23 de noviembre de 2026. Al activar Maps JavaScript API la consola exige aceptar las condiciones del Espacio Económico Europeo.

- Se aplican desde el 8 de julio de 2025 a los proyectos con cuenta de facturación en el EEE, como este (España). No hay alternativa si se quiere usar Google Maps.
- Maps JavaScript API no tiene cambios técnicos. Según la FAQ, los precios no cambian. No se ha confirmado si cambian los cupos gratuitos.
- Se eliminan tres restricciones, entre ellas «no usar con mapas que no sean de Google». Esto contradice el motivo por el que se descartó OpenStreetMap (sección 2): revisarlo antes del paso 6.
- **Places en el EEE:** salvo latitud, longitud e identificador del sitio, el contenido de Places no se puede mostrar sobre ningún mapa, tampoco el de Google. El componente Place Autocomplete del Places UI Kit queda fuera de esta restricción. Afecta al alta (`docs/diseno.md`, sección 5).
- La regla de almacenamiento no está en las páginas del EEE, sino en la de políticas de Places, comprobada el 24 de noviembre de 2026: el identificador del sitio, de forma indefinida; las coordenadas, 30 días; el resto, nada.

Fuentes:

- https://developers.google.com/maps/comms/eea/faq
- https://developers.google.com/maps/comms/eea/places

## 8. Riesgos y resultados de la prueba técnica (paso 2)

Probado el 23 de noviembre de 2026 con la página `prueba/` en un iPhone (iOS 18.7) y en local. Firebase 13.4.0. La página se borró el 24 de noviembre de 2026 y sigue en el historial de git.

| Riesgo | Resultado |
|---|---|
| Entrar con Google en la app instalada en el iPhone | ✅ Funciona con **ventana emergente** (`signInWithPopup`). La **redirección** no funciona (vuelve sin sesión), como avisa la documentación de Firebase para webs fuera de Firebase Hosting. Google Identity Services no hizo falta. |
| La sesión se mantiene | ✅ Al recargar y al cerrar la app del todo. Pendiente de aclarar: en una ocasión, tras publicar una versión nueva, el propietario volvió a entrar; no se sabe si la sesión se había perdido. |
| Cuentas de Google en la app instalada | ⚠️ La app instalada no comparte sesiones con Safari ni con Chrome. La primera vez hay que escribir el correo y la contraseña de Google. Después se recuerda. Es una norma de Apple: no tiene arreglo por nuestra parte. |
| Permisos | ✅ Una cuenta no invitada entra con Google pero ve «sin acceso», no puede leer, crear ni subir fotos, y puede enviar una solicitud de acceso, que llega a Firestore. El propietario lee, crea y sube fotos. |
| Reglas de Storage que consultan Firestore | ✅ Funcionan en los dos sentidos: permiten al propietario y rechazan al no invitado. |
| Fotos | ✅ Una foto de 4,6 MB queda en 556 KB (1600 px) y una miniatura de 47 KB (400 px). ⚠️ Una foto ya pequeña (305 KB) creció a 367 KB al recomprimirla: si el original es JPEG y ya cabe en 1600 px, se sube tal cual. |
| Mapa con clave restringida | ✅ Carga en GitHub Pages y en `localhost:8000`. |
| Lentitud al abrir | ❌→✅ Con la conexión por defecto de Firestore, la primera lectura al abrir la app instalada se atascaba unos 30 segundos por consulta (27 a 80 s en total). Forzando **long polling** (`experimentalForceLongPolling: true`) y manteniendo la caché del dispositivo: 0,8 a 2,5 s en tres aperturas. Sin caché también es rápido, pero se pierde la consulta sin cobertura. |
| Consulta sin cobertura | Construida el 25 de noviembre de 2026 (paso 5, parte 5b; `docs/diseno.md`, sección 10). Probada en local con el servidor parado; falta la prueba en el iPhone con el modo avión. |

Decisiones que salen de la prueba:

- Entrar solo con ventana emergente. Quitar las otras dos vías.
- Firestore con caché en el dispositivo y long polling forzado.
- Fotos a 1600 px y miniatura a 400 px, en JPEG. Si el original ya es JPEG y cabe en 1600 px, se sube sin recomprimir. Esto cierra la propuesta de tamaño de la sección 5.
- Leer las opiniones en paralelo (o con una consulta de grupo de colecciones) en lugar de una tras otra, y evitar dos lecturas a la vez.
- La carpeta `prueba/` se borra al terminar el paso 3. Hecho el 24 de noviembre de 2026.

## 9. Seguridad y protección frente a abusos

Acordado el 23 de noviembre de 2026 y cambiado el 24: desde entonces cualquiera puede **leer** restaurantes, notas, nombres visibles y fotos, porque la app es pública en solo lectura (`docs/diseno.md`, sección 1). El objetivo pasa a ser que nadie sin permiso pueda escribir datos, subir fotos ni ver los correos, y que leer no genere un gasto apreciable. Las reglas se aplican en los servidores de Firebase, así que no se pueden saltar tocando el código de la app, que es público.

- Queda a la vista de cualquiera que encuentre la dirección (el repo la enlaza): restaurantes, notas, textos, fotos y los nombres visibles de quien puntúa. Los correos (`members`) no.
- El montaje de la web con GitHub Actions lee todos los datos cada 30 minutos: unas 14.400 lecturas al día con 100 restaurantes (`docs/publicacion.md`).
- Cada visita gasta lecturas de Firestore (50.000 gratis al día), cargas del mapa (con su tope diario, más abajo) y descargas de fotos de Storage. El coste de esas descargas en `europe-southwest1` no se ha comprobado; con el uso previsto debería ser de céntimos.
- Sin sesión, nadie puede abusar de la Geocoding API ni del buscador: solo se usan en el alta.
- Reglas de Firestore y de Storage con lectura pública publicadas en la consola el 24 de noviembre de 2026. Comprobado ese día sin sesión, desde la web publicada: se leen `restaurants` y `users`, `members` responde PERMISSION_DENIED y las fotos se descargan.

### Fotos (Storage)

- Solo pueden subir fotos los propietarios y editores que han entrado con Google. Un usuario sin cuenta o que no esté en la lista recibe un error.
- Las fotos van en `restaurants/{idRestaurante}/{archivo}`. Cualquier editor puede subirlas y borrarlas.
- Solo se aceptan imágenes JPEG, PNG o WebP de menos de 3 MB. La app comprime antes de subir, así que una foto normal queda muy por debajo.
- Ver fotos: cualquiera, sin entrar (desde el 24 de noviembre de 2026).
- Las reglas de Storage consultan los papeles guardados en Firestore. Comprobado en el paso 2 (sección 8).

### Datos (Firestore)

- Todo cerrado por defecto: la base de datos se crea en modo de producción.
- Leer restaurantes, notas y nombres visibles: cualquiera, sin entrar (desde el 24 de noviembre de 2026). Leer `members`: cada uno el suyo y los propietarios.
- Crear y editar la parte común de un restaurante: solo los editores.
- Escribir una puntuación: solo su autor y solo la suya.
- Modificar las listas de permisos: solo el propietario.
- Se validan los datos: notas de 1 a 10 con una décima (antes del 24 de noviembre de 2026, en pasos de 0,5), precio de 1 a 5 (antes del 24 de noviembre de 2026, de 1 a 4), fecha de visita con formato de fecha o vacía (pendiente de visitar), marca de recomendación verdadera o falsa y textos con longitud máxima.

### Mapa (Google Maps)

- Clave limitada a la web de GitHub Pages y a `localhost` para el desarrollo, y solo a Maps JavaScript API, Places UI Kit, Places API (New) y Geocoding API (esta última, desde el 24 de noviembre de 2026, para la localidad del pin; `docs/diseno.md`, sección 5). Desde el 25 de noviembre de 2026 no está en el repo (sección 10).
- Los topes diarios son del proyecto, no de la clave: según Google, las cuotas limitan lo que puede usar el proyecto de Google Cloud (https://developers.google.com/maps/billing-and-pricing/manage-costs, consultado el 25 de noviembre de 2026). No hubo que repetirlos al cambiar de clave.
- La clave es pública por necesidad: el navegador la necesita para cargar el mapa, así que está en la página publicada y no se puede ocultar. La restricción por web frena a quien la copie en su página, pero no a quien falsee el origen desde un programa propio. Lo que limita el gasto son los topes diarios.
- **Topes diarios**, puestos el 24 de noviembre de 2026 en Google Cloud (Google Maps Platform → Cuotas). Están calculados para quedar dentro de los cupos gratuitos mensuales aunque alguien abusara de la clave:

| API | Cuota por día | Tope |
|---|---|---|
| Maps JavaScript API | Map loads | 300 |
| Maps JavaScript API | 3D Map loads, Maps Grounding Widget | 0 |
| Places API (New) | GetPlaceRequest y AutocompletePlacesRequest | 140 |
| Places API (New) | Las demás (búsquedas por texto y cercanas, fotos, reseñas) | 0 |
| Places UI Kit | Query Requests | 300 |
| Places UI Kit | Session Requests y Advanced Query Requests | 100 |
| Geocoding API | v3 requests per day | 300 |
| Geocoding API | Todas las v4 (por día, por minuto y por minuto y usuario) | 0 |

- Geocoding API, puesta el 24 de noviembre de 2026: el geocodificador del mapa de Google gasta la cuota **v3**. Comprobado ese día desde la web publicada con todas las v4 a 0: la consulta funcionó. Las v3 por minuto se dejan con sus valores de origen.

- Las cuotas por minuto de lo que usa la app se dejan con sus valores de origen: a 0 bloquean el buscador. Las de funciones que no se usan están a 0.
- Al llegar a un tope, Google rechaza las peticiones siguientes sin cobrarlas. El contador se comprueba con cada petición y se reinicia a medianoche de California, hacia las 9:00 en Mallorca. Se notaría en que el buscador o el mapa dejan de responder ese día; la lista y las fichas siguen funcionando.
- El 23 de noviembre de 2026 la cuota de cargas del mapa aparecía como no ajustable; el 24 ya se podía cambiar.
- Si hubiera abuso: inhabilitar la API afectada o cambiar la clave.

### Gasto

- Alerta de presupuesto de 5 € al 50, 90 y 100 %, sin contar créditos. Solo avisa: no corta el servicio.
- Los límites de gasto de Google Cloud (spend caps) no sirven aquí. Comprobado el 23 de noviembre de 2026: solo cubren Gemini API, Vertex AI, Cloud Run y Cloud Run functions. Fuente: https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps
- La cuenta de facturación se pasó a cuenta completa el 23 de noviembre de 2026, así que la app no se para al acabar la prueba. El crédito restante se sigue usando primero.

### A valorar más adelante

- Firebase App Check, para que solo la propia app pueda llamar a Firebase y a Places API (New). Según Google, en apps privadas no hace falta. Con la app pública (24 de noviembre de 2026) frenaría que alguien leyera los datos en bucle desde un programa propio. No está decidido.

## 10. Datos del proyecto en Firebase y Google Cloud

Creado el 23 de noviembre de 2026. Son identificadores públicos: pueden ir en el repo. Nunca subir aquí contraseñas, claves privadas ni cuentas de servicio.

| Dato | Valor |
|---|---|
| Proyecto | Puntuam a taula (`puntuam-a-taula`) |
| Propietarios | La cuenta personal del propietario y la cuenta de administración |
| Plan | Blaze. Cuenta de facturación pasada a cuenta completa el 23 de noviembre de 2026; conserva el crédito de la prueba (269,43 €) hasta que se gaste o caduque |
| Alerta de presupuesto | 5 €, solo avisa |
| Firestore | Edición Standard, `(default)`, `europe-southwest1` (Madrid), modo de producción, sin copias programadas |
| Storage | `puntuam-a-taula.firebasestorage.app`, `europe-southwest1`, clase Standard, modo de producción |
| Authentication | Solo Google. Dominios autorizados: `localhost` e `isidrecc.github.io` |
| Map ID | «Puntuam a taula», `ef2c6b7a22cee90b3aee6ac8`, JavaScript vectorial. Creado el 24 de noviembre de 2026 con los estilos «Lavanda» (claro) y «Noche» (oscuro); ese mismo día pasó a «Terracota» y «Terracota nit» (`docs/mapa/`) |

Configuración web:

```js
const firebaseConfig = {
  apiKey: "AIzaSyAuuYMP5wyLNBIWM9p_BHngih1YnwA3kYk",
  authDomain: "puntuam-a-taula.firebaseapp.com",
  projectId: "puntuam-a-taula",
  storageBucket: "puntuam-a-taula.firebasestorage.app",
  messagingSenderId: "1052734827532",
  appId: "1:1052734827532:web:0af35c48cc58ab17975229"
};
```

La clave `apiKey` de Firebase está restringida a 25 API de Firebase y no incluye Maps JavaScript API (comprobado el 23 de noviembre de 2026).

Clave de Google Maps, «Mapa web Puntuam 261125», creada por el propietario el 25 de noviembre de 2026 (parte 5d). No está en el repo: la pone al publicar el secreto `MAPS_KEY` de GitHub y en local está en `app/clau-local.js`, que no se sube (`docs/publicacion.md`). Limitada a los sitios `https://isidrecc.github.io/*`, `https://isidrecc.github.io/restaurantes/*`, `http://localhost/*`, `http://localhost:8000/*` y `http://localhost:8765/*`, y solo a Maps JavaScript API, Places API (New), Places UI Kit y Geocoding API. `https://isidrecc.github.io/*` hace falta porque las tarjetas y el buscador del Places UI Kit solo envían el origen, sin `/restaurantes/` (comprobado ese día: sin ese sitio, Google las rechazaba).

La clave anterior, «Mapa web Puntuam» (empezaba por `AIzaSyC1`), se borró el 25 de noviembre de 2026. La que queda en el historial de git ya no vale: comprobado ese día, Google responde `API_KEY_INVALID`.

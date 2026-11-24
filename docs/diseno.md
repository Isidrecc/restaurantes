# Diseño vigente

Acordado con el propietario el 23 de noviembre de 2026, al aprobar la demo y antes de empezar el paso 3, y ampliado el 24 de noviembre de 2026 con el aspecto (colores, mapa y menú) y el alta en cuatro pasos, acordados con maquetas en otra conversación. Sustituye a la propuesta del «cuaderno común» (todos puntúan), que queda en el historial de git. Donde este documento choque con `especificacion.md` o con la demo, manda este documento.

La demo (`demo/index.html`) ya no se actualiza. Sirve de referencia para el comportamiento que este documento no cambia, pero no para el aspecto ni para los textos.

**Idioma:** la app está solo en catalán (decidido el 24 de noviembre de 2026), también los criterios, los tipos de cocina, las fechas y Google Maps. Los textos en castellano de la demo y de las maquetas no son la referencia. La documentación sigue en castellano.

## 1. Quién hace qué

| Papel | Ve todo | Puntúa | Da de alta, edita datos, texto y fotos | Borra restaurantes | Gestiona accesos |
|---|---|---|---|---|---|
| Propietario | ✔ | Si tiene color | ✔ | ✔ | ✔ |
| Editor | ✔ | Si tiene color | ✔ | | |
| Invitado (solo mira) | ✔ | | | | |

- Puntúan solo dos personas, cada una con su color: **azul** (el propietario) y **rosa** (Cris). El color va en su documento de `members`.
- Puede haber más de un propietario. Hoy hay dos.
- Solicitudes de acceso: quien no está invitado puede pedir acceso para ver. Lo aprueba un propietario (paso 4). Desaparece «solicitar ser editor».

## 2. Qué guarda cada restaurante

| Común | De cada persona que puntúa |
|---|---|
| Nombre, localidad, dirección, posición, tipos de cocina, precio | Seis notas |
| **Fecha de visita** (una sola) | **Plato estrella**: nombre y nota propios |
| **Texto largo tipo blog** (uno por restaurante) | |
| **Fotos, cada una con su pie de foto** | |

Desaparecen las reseñas de cada persona.

- **Precio por persona, sin bebida**, en cuatro tramos: menos de 20 €, de 20 a 50 €, de 50 a 100 € y más de 100 €. Se muestran como «<20 €», «20-50 €», «50-100 €» y «>100 €». Se guarda como 1 a 4 (decidido el 24 de noviembre de 2026; sustituye a €, €€, €€€ y €€€€ con la misma numeración).
- **Tipos de cocina** de partida: Autor, Japonès, Nikkei, Xinès, Menú degustació, Menú de migdia, Mallorquí, Asiàtic, Italià, Brasa y Arrossos (decidido el 24 de noviembre de 2026). Al final hay un botón «+ Afegeix» para crear otro. Los tipos añadidos no se guardan aparte: salen de los restaurantes que los usan, así que los ven todos y desaparecen si ningún restaurante los usa. Si se escribe uno que ya existe con otras mayúsculas o sin tildes, se marca el existente. Máximo 10 por restaurante. Los nombres antiguos en castellano se muestran en catalán (`CUISINE_RENAMES` en `app/config.js`) y se guardan así al editar.
- **Localidad**: el pueblo o ciudad de la dirección de Google (sección 5), por ejemplo Caimari o Port de Pollença, no el municipio. No se pide en el alta: solo se escribe a mano si Google no la da. Se sigue viendo en la ficha como etiqueta tocable, sirve de filtro y el buscador de la app busca en ella (confirmado el 24 de noviembre de 2026).
- **Dirección**: la de Google al elegir el restaurante en el buscador (sección 5). Se ve en la ficha y el buscador de la app busca también en ella.

## 3. Nota que se ve

- **Selector de nota** (mapa, lista, filtros y orden): **Mitjana** (por defecto) o el nombre de cada persona que puntúa, en su color. Se guarda en el dispositivo.
- La media es la media de las notas globales de quienes han puntuado. Si solo ha puntuado uno, la media es su nota.
- Pines y tarjetas siguen coloreados por la nota, con la tabla de la especificación (sección 4).

## 4. Ficha

De arriba abajo:

1. Nombre y dirección. **Etiquetas tocables** de localidad, tipos de cocina y precio: al tocar una, se abre el mapa con ese filtro puesto **sustituyendo** los filtros que hubiera. Fecha de visita.
2. Nota grande (la del selector) con su texto (Excel·lent, Molt bo…).
3. **Barras por criterio, dos por criterio: azul y rosa**, cada una con su valor. En el plato estrella, cada persona con su estrella en su color, el nombre de su plato y su nota.
4. **Nota media de cada uno**, en su color.
5. **Roseta con dos líneas**, azul y rosa, con leyenda.
6. **Texto largo** del restaurante.
7. **Fotos al final**, cada una con su pie. Al tocarla se amplía con el pie debajo.
8. Acciones: «Mostra al mapa»; «Puntua» o «Edita la meva nota» (quien puntúa), que abre solo su nota; «Edita» (editores), que abre la edición completa (sección 6); «Esborra» (propietario).

Pendiente: la maqueta de la ficha con el aspecto de la sección 7, y comprobar en la app que las barras y la roseta azul y rosa se leen bien junto al morado.

## 5. Alta de un restaurante

Acordado el 23 de noviembre de 2026 y ajustado el 24. Adelanta al paso 3 una parte del buscador de Places previsto para el paso 6.

El alta va en **cuatro pasos**. Arriba, una barra de progreso con cuatro segmentos y «Pas N de 4», y un botón para cerrar. Abajo, «Enrere» y «Següent»; en el último paso, «Desa el restaurant». Si quien da de alta no puntúa (no tiene color), el paso 3 no aparece y son tres pasos.

### Paso 1. On és

- Solo el buscador de Google (autocompletado básico del Places UI Kit) y el mapa, con «Usa la meva ubicació» debajo. Al elegir un sitio se piden sus coordenadas, su nombre y su dirección. El mapa salta allí y **marca el sitio con un aro**.
- **El pin lo pone el usuario** tocando el sitio marcado: los toques atraviesan el aro y llegan al mapa. Después puede arrastrarlo. Elegir otro resultado quita el pin anterior.
- **El nombre va en la casilla del buscador.** La casilla de Google se vacía al elegir un resultado y la app no puede escribir en ella, así que, al elegir, se sustituye por un campo de la app con el mismo aspecto, con el nombre de Google, editable ahí mismo y con una X para volver a buscar (confirmado el 24 de noviembre de 2026). No hay casilla «Nom» aparte. Si se pone el pin sin elegir ningún resultado, la casilla pasa igualmente a campo de nombre, con lo que se hubiera escrito en el buscador.
- **La localidad no se muestra.** Se saca de la dirección de Google y se guarda. La casilla «Localitat», con sugerencias de las ya usadas, solo aparece si Google no la da, por ejemplo al poner el pin sin buscador.
- Para pasar al paso siguiente hacen falta el nombre, el pin y, si se muestra la casilla, la localidad.

### Paso 2. Dades

- Tipos de cocina en fichas (sección 2) y precio en cuatro botones grandes.
- Fecha de visita con los atajos «Avui» y «Ahir» además del selector de fecha (confirmado el 24 de noviembre de 2026). Por defecto, hoy.

### Paso 3. La teva nota

- Arriba, la nota global grande con su color y su texto, y al lado la roseta de quien puntúa, que se dibuja en directo.
- Debajo, un deslizador por criterio con su valor coloreado. El nombre del plato estrella va dentro de su criterio.
- Botón «Puntua més tard»: la nota sigue siendo opcional.

### Paso 4. Text i fotos

- Texto largo y fotos, cada una con su pie.

### Datos de Google y sus condiciones

- Se guardan el pin, el nombre, la localidad, la dirección y el identificador de Google (`placeId`, `source: places`).
- **Esto incumple las condiciones de Google**, comprobadas el 23 y el 24 de noviembre de 2026: el nombre y la dirección de Places no se pueden guardar; las coordenadas, solo 30 días; el identificador, indefinidamente. Isidre lo decidió el 24 de noviembre de 2026, sabiendo que el riesgo es que Google desactive la clave del mapa; en una app privada y pequeña lo considera bajo. Las coordenadas de Google no se guardan: el pin es el que pone el usuario.
- Coste: el nombre hace que cada elección cuente como Place Details Pro, con 5.000 gratis al mes. Dirección, componentes de la dirección y coordenadas son Essentials. «Places UI Kit» y «Places API (New)» están activadas y añadidas a la clave.
- En la demo, el buscador está simulado con sitios inventados.

Fuentes: https://developers.google.com/maps/documentation/places/web-service/policies · https://developers.google.com/maps/comms/eea/places · https://developers.google.com/maps/documentation/javascript/places-ui-kit/basic-autocomplete · https://developers.google.com/maps/billing-and-pricing/pricing · https://developers.google.com/maps/documentation/places/web-service/data-fields

## 6. Editar un restaurante

- **«Edita»** (editores) abre una sola pantalla con los bloques del alta seguidos, sin pasos ni barra de progreso. El bloque de la nota solo lo ve quien puntúa. En el primer bloque aparece también la casilla «Localitat», para poder corregirla: la localidad solo desaparece del alta.
- **«Puntua» o «Edita la meva nota»** se mantiene en la ficha y abre solo el bloque de la nota (confirmado el 24 de noviembre de 2026).

## 7. Aspecto: colores, modo oscuro y menú

Acordado el 24 de noviembre de 2026 con maquetas. Sustituye al aspecto de la demo (paleta náutica).

### Paleta «Berenjena»

Dos colores protagonistas: morado y amarillo mostaza.

| Uso | Claro | Oscuro |
|---|---|---|
| Fondo | `#fbf7ff` | `#151020` |
| Superficies | `#ffffff` | `#211a2e` |
| Texto | `#2a1a40` | `#efe9f7` |
| Texto secundario | `#6d6180` | `#a79bb8` |
| Acento principal (menú, botones) | `#6b3fa0` | `#b48be0` |
| Texto sobre el acento principal | `#ffffff` | `#170f22` |
| Acento secundario (botón «+», detalles) | `#ffb81c` | `#ffc444` |
| Texto sobre el acento secundario | `#2a1a05` | `#2a1a05` |
| Líneas y pistas de barras | `#e7dcf3` / `#efe8f6` | `#3a2f4a` / `#2f2640` |
| Azul (propietario) | `#2f6fd0` | `#6ea8ff` |
| Rosa (Cris) | `#d6457f` | `#ff7fb5` |

- Los colores de nota (`--s1` a `--s5` de `app/styles.css`) no cambian, ni en claro ni en oscuro.
- Sobre el amarillo, el texto es siempre oscuro, en los dos modos.
- En oscuro, el fondo es morado muy oscuro, no negro.
- El acento no puede ser azul medio ni rosa, porque son los colores de quien puntúa.
- El `theme-color` de `index.html` y del manifiesto pasa a la paleta nueva.

### Modo claro y oscuro

- La app sigue siempre el modo del sistema. No hay interruptor manual, así que sobran las reglas `:root[data-theme="light"]` y `:root[data-theme="dark"]` de `app/styles.css`.

### Menú inferior flotante

- Pastilla redondeada, separada de los bordes, con fondo del acento principal, flotando sobre el mapa.
- En el centro, un botón «+» más grande en el acento secundario para añadir restaurante. A los lados, Mapa y Llista.

## 8. Mapa

- Estilo propio en la nube de Google, asociado al Map ID: **«Lavanda»** en claro y **«Noche»** en oscuro, en el mismo estilo.
- El mapa se crea con `colorScheme: FOLLOW_SYSTEM`. Solo se puede fijar al crearlo: si el sistema cambia de modo con la app abierta, el mapa no cambia hasta volver a abrirla. Aceptado.
- En los dos modos se ocultan los puntos de interés de Google (comercios y restaurantes). Se dejan los nombres de pueblos y del mar.

| Elemento | Lavanda | Noche |
|---|---|---|
| Mar | `#d9cdf0` | `#17203a` |
| Tierra | `#f7f2fd` | `#241d30` |
| Línea de costa | `#c9b6e6` | `#3a2f4a` |
| Parques y zonas verdes | `#ece2f8` | `#2a2338` |
| Carreteras principales | `#ffd77a` | `#5a4a2a` |
| Carreteras secundarias | `#e3d6f3` | `#33293f` |
| Etiquetas de pueblos | `#6b3fa0` | `#a79bb8` |
| Etiquetas del mar | `#6b3fa0` | `#6e7fa8` |

- Coste: usar un Map ID se cobra con el SKU de Dynamic Maps, el mismo de cada carga del mapa; no añade coste aparte. Comprobado el 24 de noviembre de 2026.
- Según la conversación de las maquetas, el JSON de estilos en la nube es de disponibilidad general desde el 21 de septiembre de 2026, así que el estilo se puede preparar en un archivo e importar en la consola. No se ha podido confirmar en la documentación el 24 de noviembre: comprobarlo al preparar el estilo.
- Tarea del propietario: crear el Map ID y asociarle el estilo, guiado paso a paso. Mientras tanto se usa `DEMO_MAP_ID`, que muestra los puntos de interés de Google.
- Pendiente: la maqueta de la pantalla del mapa con el menú flotante y las tarjetas.
- Ideas comentadas y no aprobadas: pines con la nota escrita dentro, carrusel de tarjetas sobre el mapa, grupos de pines con la nota media, filtros como fichas flotantes y primera foto como portada de la ficha.

Fuentes: https://developers.google.com/maps/documentation/javascript/cloud-customization/setup · https://developers.google.com/maps/documentation/javascript/mapcolorscheme

## 9. Modelo de datos (Firestore)

| Documento | Contenido | Quién escribe |
|---|---|---|
| `members/{correo}` | `role`: `owner`, `editor` o `viewer`. `color`: `azul`, `rosa` o ninguno | Propietarios |
| `users/{uid}` | `displayName`, `color` (debe coincidir con el de `members`), `updatedAt` | Cada uno el suyo |
| `restaurants/{id}` | `name`, `locality`, `address` (opcional), `location`, `cuisines`, `price`, `visitDate`, `blog`, `photos` (lista de `{full, thumb, caption}`), `placeId`, `source`, `createdBy`, `createdAt`, `updatedBy`, `updatedAt` | Editores |
| `restaurants/{id}/ratings/{uid}` | `scores`, `global`, `dish`, `updatedAt` | Solo su autor, si tiene color |
| `accessRequests/{uid}` | `email`, `displayName`, `status`, `createdAt` | El solicitante la crea; los propietarios la resuelven |

Fotos en Storage: `restaurants/{id}/{archivo}`. Suben y borran los editores; ven todos los invitados.

## 10. Orden de trabajo

### Paso 3, en cuatro partes

Publicadas en GitHub Pages el 23 y el 24 de noviembre de 2026.

| Parte | Contenido |
|---|---|
| 3a · Base | Archivos, entrar con Google, nombre visible la primera vez, pantalla sin acceso, conexión a Firebase con long polling |
| 3b · Lista y ficha | Datos en tiempo real, selector de nota, ficha nueva, roseta azul y rosa, etiquetas tocables |
| 3c · Mapa | Google Maps con pines de nota, agrupación y tarjeta resumen |
| 3d · Editar | Alta y edición de datos, buscador para ubicar, puntuar, texto largo, fotos con pie, «usar mi ubicación», borrar |

Ajustes del 24 de noviembre de 2026, ya publicados: buscador arriba con nombre, localidad y dirección de Google, precios por tramos, tipos de cocina nuevos y la app en catalán.

### Para cerrar el paso 3

Orden aprobado por el propietario el 24 de noviembre de 2026. Al final de cada parte se le enseña el resultado y se espera su visto bueno.

| Parte | Contenido |
|---|---|
| 3e · Colores y menú | Paleta «Berenjena» en claro y oscuro, sin interruptor manual, `theme-color` y menú inferior flotante con el «+» (sección 7). Va primero para comprobar pronto que el azul y el rosa se leen bien junto al morado |
| 3f · Mapa | Estilo «Lavanda» y «Noche» preparado por Claude, Map ID creado por el propietario con guía, y conexión con `FOLLOW_SYSTEM` (sección 8) |
| 3g · Alta y edición | Alta en cuatro pasos y edición en una pantalla, que comparten los mismos bloques (secciones 5 y 6) |
| 3h · Cierre | Prueba del propietario en el iPhone y su aprobación, estado al día en `CLAUDE.md` y borrar la carpeta `prueba/` |

Antes de empezar, el propietario publica las reglas de Firestore que aceptan `address`.

Tareas del propietario: publicar las reglas de Firestore que aceptan `address` (pendiente desde el 24 de noviembre; sin ellas, guardar da error) y crear el Map ID con el estilo (sección 8). Hechas: poner `color` en los dos documentos de `members` y borrar las fichas de prueba.

# Diseño vigente

Acordado con el propietario el 23 de noviembre de 2026, al aprobar la demo y antes de empezar el paso 3, y ampliado el 24 de noviembre de 2026 con el aspecto (colores, mapa y menú) y el alta en cuatro pasos, acordados con maquetas en otra conversación. Sustituye a la propuesta del «cuaderno común» (todos puntúan), que queda en el historial de git. Donde este documento choque con `especificacion.md` o con la demo, manda este documento.

La demo (`demo/index.html`) ya no se actualiza. Sirve de referencia para el comportamiento que este documento no cambia, pero no para el aspecto ni para los textos.

**Idioma:** la app está solo en catalán (decidido el 24 de noviembre de 2026), también los criterios, los tipos de cocina, las fechas y Google Maps. Los textos en castellano de la demo y de las maquetas no son la referencia. La documentación sigue en castellano.

## 1. Quién hace qué

| Papel | Ve todo | Puntúa | Da de alta, edita datos, texto y fotos | Borra restaurantes | Gestiona accesos |
|---|---|---|---|---|---|
| Propietario | ✔ | Si tiene color | ✔ | ✔ | ✔ |
| Editor | ✔ | Si tiene color | ✔ | | |
| Cualquiera, sin entrar | ✔ | | | | |

- Puntúan solo dos personas, cada una con su color: `azul` (el propietario) y `rosa` (Cris). El color va en su documento de `members`. Son nombres internos: desde el 24 de noviembre de 2026 se ven en **tinta** y **turquesa** (sección 7).
- Puede haber más de un propietario. Hoy hay dos.
- **La app se ve sin entrar, en solo lectura** (decidido por el propietario el 24 de noviembre de 2026): mapa, lista y fichas, con notas, textos, fotos y los nombres de quien puntúa, pero no los correos. Arriba a la derecha sale «Entra»; entrar con Google solo sirve para añadir, editar y puntuar. Quien entra sin permiso lo ve todo igual y su perfil le dice que no puede editar.
- Los permisos se dan y se quitan en la consola de Firebase (`docs/accesos.md`); la pantalla de accesos del paso 4 se descartó el 24 de noviembre de 2026. El papel `viewer` y las solicitudes de acceso desaparecen con la app pública.
- **Compartir**: cada ficha tiene «Comparteix», que en el iPhone abre el menú de compartir con el enlace a la ficha. Sin menú de compartir, el enlace se copia. En la web publicada el enlace es `f/<id>/`, una página con la portada para la vista previa (WhatsApp y otras apps) que lleva al instante a la ficha (`?r=id`); se monta con GitHub Actions (`docs/publicacion.md`, 24 de noviembre de 2026).

## 2. Qué guarda cada restaurante

| Común | De cada persona que puntúa |
|---|---|
| Nombre, localidad, dirección, posición, tipos de cocina, precio | Seis notas |
| **Fecha de visita** (una sola) | **Plato estrella**: nombre y nota propios |
| **Texto largo tipo blog** (uno por restaurante) | |
| **Fotos, cada una con su pie de foto** | |

Desaparecen las reseñas de cada persona.

- **Precio por persona, sin bebida**, en cinco tramos: «<20 €», «20-40 €», «40-60 €», «60-100 €» y «>100 €». Se guarda como 1 a 5 (pedido por el propietario el 24 de noviembre de 2026). Antes eran cuatro (<20, 20-50, 50-100 y >100, guardados como 1 a 4); se mantienen los códigos, así que los restaurantes guardados con 2 pasan a «20-40 €». Ese día los tres restaurantes reales estaban en 2; solo «Prova Claude (esborrar)» estaba en 3 y pasa de «50-100 €» a «40-60 €».
- **Pendent de visitar** (24 de noviembre de 2026): restaurante guardado sin fecha de visita (`visitDate` nulo) y sin nota, para apuntar los que se quieren probar. Se ve con «Pendent» en el recuadro de la nota.
- **Recomanació de l'inici** (24 de noviembre de 2026): marca opcional (`featured`) para el panel «Recomanació per menys de 40 €» de la página de inicio. Solo se puede poner con precio de menos de 40 € (tramos 1 y 2).
- **Tipos de cocina** de partida: Autor, Japonès, Nikkei, Xinès, Menú degustació, Menú de migdia, Mallorquí, Asiàtic, Italià, Brasa y Arrossos (decidido el 24 de noviembre de 2026). Al final hay un botón «+ Afegeix» para crear otro. Los tipos añadidos no se guardan aparte: salen de los restaurantes que los usan, así que los ven todos y desaparecen si ningún restaurante los usa. Si se escribe uno que ya existe con otras mayúsculas o sin tildes, se marca el existente. Máximo 10 por restaurante. Los nombres antiguos en castellano se muestran en catalán (`CUISINE_RENAMES` en `app/config.js`) y se guardan así al editar.
- **Localidad**: el pueblo o ciudad de la dirección de Google (sección 5), por ejemplo Caimari o Port de Pollença, no el municipio. No se pide en el alta: solo se escribe a mano si Google no la da. Se sigue viendo en la ficha como etiqueta tocable, sirve de filtro y el buscador de la app busca en ella (confirmado el 24 de noviembre de 2026).
- **Dirección**: la de Google al elegir el restaurante en el buscador (sección 5). Se ve en la ficha y el buscador de la app busca también en ella.

## 3. Nota que se ve

- **Selector de nota** (mapa, lista, filtros y orden): **Mitjana** (por defecto) o el nombre de cada persona que puntúa, en su color. Se guarda en el dispositivo.
- La media es la media de las notas globales de quienes han puntuado. Si solo ha puntuado uno, la media es su nota.
- Pines y tarjetas siguen coloreados por la nota, con la tabla de la especificación (sección 4).

## 4. Ficha

De arriba abajo:

1. **Cabecera sobre la portada** (boceto del propietario, 24 de noviembre de 2026): la foto marcada como portada o, si no hay ninguna, la primera, a todo el ancho y arriba del todo; mientras carga se ve una rueda y al tocarla se amplía. Encima, en blanco sobre un oscurecido arriba y abajo:
   - arriba, el **nombre** y, debajo, el **recuadro con la nota** (la del selector) con su texto (Excel·lent, Molt bo…) y quién ha puntuado al lado;
   - abajo a la izquierda, la **dirección** y **«Visitat el…»**;
   - abajo a la derecha, las **etiquetas tocables** de localidad, tipos de cocina y precio, translúcidas: al tocar una, se abre el mapa con ese filtro puesto **sustituyendo** los filtros que hubiera.
   Sin fotos, la misma disposición sobre un fondo de color, con el texto oscuro. Si está pendiente de visitar, el recuadro dice «Pendent», al lado «Pendent de visitar» y no hay fecha.
2. (Desde el 24 de noviembre de 2026, el nombre, la dirección, las etiquetas, la fecha y la nota van en la cabecera.)
3. (La tarjeta de nota que había aquí pasó a la cabecera.)
4. **Barras por criterio, dos por criterio: tinta y turquesa**, cada una con su valor. En el plato estrella, cada persona con su estrella en su color, el nombre de su plato y su nota.
5. **Nota media de cada uno**, en su color.
6. **Roseta con dos líneas**, tinta y turquesa, con leyenda.
7. **Texto largo** del restaurante, con su formato (sección 5, paso 4): negrita, cursiva, subrayado y enlaces a otras webs, en el color de acento y subrayados, que se abren aparte sin salir de la app.
8. **Fotos al final**, cada una con su pie y también la portada. Al tocarla se amplía con el pie debajo. Mientras cargan se ve una rueda y aparecen con un fundido. En la foto ampliada se pasa a la anterior o la siguiente con flechas a los lados, deslizando el dedo o con las teclas de flecha, y debajo se ve «2 / 5» (24 de noviembre de 2026). Al llegar al final vuelve a la primera.
9. **A Google Maps** (24 de noviembre de 2026, pedido por el propietario): si el sitio se eligió en el buscador de Google (tiene `placeId`), la tarjeta compacta de Google (Places UI Kit, Place Details compacto) con foto y galería, nombre, estrellas con número de reseñas, tipo, precio, si está abierto y su botón «Maps» al perfil. **Pequeña, para que no destaque** (pedido por el propietario el 24 de noviembre de 2026): en horizontal, con la foto pequeña a la izquierda, a todo el ancho de la ficha y sin tarjeta alrededor; con menos ancho, Google quita la foto. Sin `placeId`, o si la tarjeta no carga (por ejemplo, por el tope diario), sale «Obre a Google Maps» (Maps URLs: el sitio de Google o, si no lo hay, el punto del pin).
   - El UI Kit queda fuera de las restricciones del EEE y no hace falta mostrarlo con un mapa. Cada tarjeta creada cuenta una consulta «Places UI Kit Query» (categoría Essentials, 10.000 gratis al mes y después 1 dólar por 1.000; comprobado el 24 de noviembre de 2026). La app guarda cada tarjeta creada y redibujar la ficha no la vuelve a pedir. Por dentro, Google descarga además las fotos de su galería (10 en la prueba). No se ha comprobado qué cuota diaria de Google Cloud cuenta estas tarjetas: probablemente «Query Requests» de Places UI Kit, que tiene un tope de 300.
10. Acciones: «Comparteix» (todos, también sin entrar); «Mostra al mapa»; «Puntua» o «Edita la meva nota» (quien puntúa), que abre solo su nota; en un pendiente, en su lugar, «Ja hi hem anat: posa la data i la nota» (editores), que abre la edición con la fecha de hoy y el bloque de la nota; «Edita» (editores), que abre la edición completa (sección 6); «Esborra» (propietario).

Las maquetas del aspecto (24 de noviembre de 2026) incluyeron la ficha; las barras en tinta y turquesa se comprobaron en la app en local, en claro y oscuro.

## 4b. Inici

Primera pantalla de la app desde el 24 de noviembre de 2026 (pedida por el propietario). Sin buscador ni filtros arriba. **Aspecto de portada de periódico** (pedido por el propietario y aprobado con capturas el 24 de noviembre de 2026; sustituye a las tarjetas que se deslizaban en horizontal):

- Arriba, la fecha del día («Dimarts, 24 de novembre del 2026») y el número de restaurantes, con un filete fino debajo.
- Cada sección empieza con un filete grueso y su nombre en versalitas.
- En cada sección, una **noticia principal**: la foto a todo el ancho, con esquinas rectas; el antetítulo (localidad, cocina y precio, sin la cocina que da nombre a la sección); el nombre como titular en letra con serifa (New York en el iPhone, `ui-serif`; Georgia en otros sistemas); la entradilla, con el principio del primer párrafo del comentario sin las marcas de formato (unos 190 caracteres, cortado en una palabra) o, si no hay comentario, el plato estrella; y la firma, con la nota y su texto, quién ha puntuado y la fecha. Si está pendiente de visitar, la firma solo dice «Pendent de visitar».
- El resto, como **breves** de solo texto separados por filetes finos: antetítulo, titular con serifa, una línea con el texto de la nota y quién ha puntuado (o «Pendent de visitar») y, a la derecha, el recuadro de la nota. Sin fotos, así que tampoco se piden a Google.
- Sin tarjetas: papel blanco (#ffffff) en claro y el fondo de siempre (#18130f) en oscuro, con filetes #ddd1c5 y #45392f. Variables `--home-*` y `--font-serif` en `app/styles.css`. (Antes, el mismo día, tarjetas más oscuras que el fondo, también a petición del propietario.)

Secciones:

- **Recomanació · menys de 40 €**: los restaurantes marcados en «Edita» (sección 6) con precio «<20 €» o «20-40 €», por nombre: el primero es la noticia principal y los demás, breves. Sin ninguno, quien edita ve cómo marcar uno; quien no ha entrado no ve la sección.
- **Millors menús degustació**: los restaurantes con el tipo «Menú degustació», primero los puntuados, de más a menos nota, y después los demás por nombre. A la derecha del nombre de la sección, «Veure’ls al mapa» abre el mapa con ese filtro, sustituyendo los que hubiera.
- Tocar una noticia o un breve abre la ficha.

Fotos:

- **Foto de la noticia principal**: la portada propia. Si no hay, la de Google (decidido por el propietario el 24 de noviembre de 2026), con el elemento compacto **avanzado** del Places UI Kit en vertical, solo con la foto y la atribución «Google Maps ⓘ» debajo, como un crédito; es obligatoria y la ⓘ abre una nota de Google, no un enlace. Sin enlaces a Google Maps en Inici, pedido por el propietario el 24 de noviembre de 2026: el elemento normal lleva siempre el botón «Maps»; el avanzado permite elegir los botones y, sin ninguno, no sale (comprobado ese día). En la ficha se mantiene la tarjeta normal con su botón. Las condiciones de Google piden no tapar ni quitar la atribución y separar su contenido del resto con un borde, un fondo o espacio (comprobado en su documentación el 24 de noviembre de 2026), así que la foto de Google va en su propio recuadro, con su fondo igual al del papel (`--gmp-mat-color-surface`), y el texto de la app debajo, nunca encima. Tocar la foto de Google abre la ficha; la franja de la atribución se deja para Google. Sin foto propia ni sitio de Google, un recuadro con un plato.
- **Coste de las fotos de Google**: el elemento avanzado se cobra como «Places UI Kit Pro»: 5.000 gratis al mes y después 5 dólares por 1.000 (lista de precios de Google, consultada el 24 de noviembre de 2026; no se ha visto una lista distinta para el EEE). No se ha comprobado qué cuota diaria de Google Cloud lo cuenta. Solo lleva foto la noticia principal de cada sección, se pide solo al verse (con Inici a la vista y sin ficha abierta) y no se vuelve a pedir mientras la app está abierta: como mucho dos por apertura.

## 5. Alta de un restaurante

Acordado el 23 de noviembre de 2026 y ajustado el 24. Adelanta al paso 3 una parte del buscador de Places previsto para el paso 6.

El alta va en **cuatro pasos**. Arriba, una barra de progreso con cuatro segmentos y «Pas N de 4», y un botón para cerrar. Abajo, «Enrere» y «Següent»; en el último paso, «Desa el restaurant». Si quien da de alta no puntúa (no tiene color), el paso 3 no aparece y son tres pasos.

### Paso 1. On és

- Solo el buscador de Google (autocompletado básico del Places UI Kit) y el mapa, con «Usa la meva ubicació» debajo. Al elegir un sitio se piden sus coordenadas, su nombre y su dirección. El mapa salta allí y **marca el sitio con un aro**.
- **El pin lo pone el usuario** tocando el sitio marcado: los toques atraviesan el aro y llegan al mapa. Después puede arrastrarlo. Elegir otro resultado quita el pin anterior.
- **El nombre va en la casilla del buscador.** La casilla de Google se vacía al elegir un resultado y la app no puede escribir en ella, así que, al elegir, se sustituye por un campo de la app con el mismo aspecto, con el nombre de Google, editable ahí mismo y con una X para volver a buscar (confirmado el 24 de noviembre de 2026). No hay casilla «Nom» aparte. Si se pone el pin sin elegir ningún resultado, la casilla pasa igualmente a campo de nombre, con lo que se hubiera escrito en el buscador. La casilla de Google no deja leer su texto (no tiene `value` y su shadow DOM está cerrado), pero sus eventos de teclado sí salen de ella, con lo escrito y los borrados; la app reconstruye el nombre con ellos (24 de noviembre de 2026, a petición del propietario: el nombre escrito no se puede perder). Supone que se escribe al final: con el autocorrector, al pegar o al mover el cursor puede no coincidir, y entonces se corrige a mano en el campo. Si antes se había elegido un sitio y se toca la X sin escribir nada, se recupera ese nombre.
- Debajo del nombre se ve en pequeño la dirección de Google, para comprobar que es el sitio correcto (24 de noviembre de 2026).
- **La localidad no se muestra.** Se saca de la dirección de Google y se guarda. Si el sitio no viene del buscador, o Google no da su localidad, al poner o mover el pin la app pide a Google la localidad de ese punto (geocodificación inversa, Geocoding API; 24 de noviembre de 2026). La casilla «Localitat», con sugerencias de las ya usadas, solo aparece si tampoco así se obtiene. Si se escribe a mano, la app ya no la cambia. Comprobado el 24 de noviembre de 2026: dentro de un pueblo Google da el pueblo (Lloseta, Caimari, Port de Pollença); en el campo, fuera del casco urbano, puede dar el municipio (Selva en vez de Caimari). Se corrige con «Edita», donde la casilla siempre se ve.
- Para pasar al paso siguiente hacen falta el nombre, el pin y, si se muestra la casilla, la localidad.

### Paso 2. Dades

- Tipos de cocina en fichas (sección 2) y precio en cinco botones grandes: tres arriba y dos abajo.
- Fecha de visita con los atajos «Avui» y «Ahir» además del selector de fecha (confirmado el 24 de noviembre de 2026). Por defecto, hoy.
- Debajo, «Pendent de visitar» (24 de noviembre de 2026): al marcarlo se esconde la fecha y desaparece el paso de la nota, así que el alta queda en tres pasos.

### Paso 3. La teva nota

- Arriba, la nota global grande con su color y su texto, y al lado la roseta de quien puntúa, que se dibuja en directo. Esa parte se queda fija arriba al bajar por los deslizadores, y la roseta usa nombres cortos (Producte, Plat, Tècnica, Servei, Q/preu, Ambient) para que se lean a ese tamaño.
- Debajo, un deslizador por criterio con su valor coloreado. El nombre del plato estrella va dentro de su criterio.
- **Notas con décimas** (8,6), desde el 24 de noviembre de 2026; antes, medios puntos. El deslizador es propio: barra con relleno del color de la nota y tirador grande y translúcido que sigue al dedo sin saltos; la nota va de décima en décima y, al soltar, el tirador se coloca en ella. Tocar la barra lleva el tirador allí; deslizar en vertical mueve la página. Los botones − y + suben o bajan una décima. El número de cada criterio se toca y se escribe (acepta «8,6» u «8.6»; se redondea a la décima, entre 1 y 10; vacío quita la nota de ese criterio).
- Botón «Puntua més tard»: la nota sigue siendo opcional.

### Paso 4. Text i fotos

- Texto largo y fotos, cada una con su pie y un botón «Fes-la portada» («Portada» en la que lo es). Solo hay una portada; si no se marca ninguna, lo es la primera.
- **Formato del texto** (parte 4 de las peticiones del 24 de noviembre de 2026, enfoque aprobado por el propietario ese día). Se guarda en el mismo campo con marcas sencillas: `**negreta**`, `*cursiva*`, `__subratllat__` y `[text](https://web.com)` para los enlaces, que son a otras webs (no a otras fichas). Encima del campo, cuatro botones: **B**, *I*, U subrayada y una cadena. Se selecciona un trozo y se toca un botón: se rodea con las marcas y, si ya las tiene, se quitan; sin selección, se ponen las marcas con el cursor en medio. Los botones no se llevan el foco, así que el teclado no se cierra. La cadena abre debajo de la barra un campo para la dirección (se completa con `https://` si no lo lleva; si no es válida, «Escriu una adreça web, com ara guide.michelin.com.») y el trozo seleccionado pasa a ser el enlace; sin selección, el enlace dice el nombre de la web, sin «www.». En el campo se ven las marcas tal cual. Se descartó un editor visual porque en el iPhone fallan a menudo y obligarían a guardar HTML. Solo se aceptan enlaces `http` y `https`, y el texto nunca puede meter HTML. Lo que no se entiende como marca se queda como texto, y los comentarios anteriores se ven igual. Sin vista previa, listas, títulos ni lista de referencias al final (no pedidos). Código en `app/text.js`.

### Datos de Google y sus condiciones

- Se guardan el pin, el nombre, la localidad, la dirección y el identificador de Google (`placeId`, `source: places`).
- **Esto incumple las condiciones de Google**, comprobadas el 23 y el 24 de noviembre de 2026: el nombre y la dirección de Places no se pueden guardar; las coordenadas, solo 30 días; el identificador, indefinidamente. Isidre lo decidió el 24 de noviembre de 2026, sabiendo que el riesgo es que Google desactive la clave del mapa; en una app privada y pequeña lo considera bajo. Las coordenadas de Google no se guardan: el pin es el que pone el usuario.
- Coste: el nombre hace que cada elección cuente como Place Details Pro, con 5.000 gratis al mes. Dirección, componentes de la dirección y coordenadas son Essentials. «Places UI Kit» y «Places API (New)» están activadas y añadidas a la clave.
- En la demo, el buscador está simulado con sitios inventados.
- **Localidad del pin (Geocoding API).** Comprobado el 24 de noviembre de 2026: SKU «Geocoding», categoría Essentials, 10.000 gratis al mes; hay que activar la Geocoding API en el proyecto y añadirla a la clave. En el EEE, el contenido de Geocoding (salvo latitud, longitud y `place_id`) no se puede usar con ningún mapa, y la app muestra la localidad en la tarjeta sobre el mapa. Tampoco se ha podido confirmar que se permita guardarla (las condiciones específicas del servicio no se leyeron). Es el mismo riesgo que con los datos de Places; el propietario eligió Google el 24 de noviembre de 2026 sabiéndolo. La alternativa sin estas condiciones sería OpenStreetMap (Nominatim).
- **Buscador propio con sugerencias de Google**, descartado el 24 de noviembre de 2026: las sugerencias de Places API (New) fuera del Places UI Kit sí entran en las restricciones del EEE. Por eso se mantiene la casilla de Google y el nombre se reconstruye con sus eventos de teclado.

Fuentes: https://developers.google.com/maps/documentation/places/web-service/policies · https://developers.google.com/maps/comms/eea/places · https://developers.google.com/maps/comms/eea/geocoding · https://developers.google.com/maps/documentation/geocoding/policies · https://developers.google.com/maps/documentation/javascript/geocoding · https://developers.google.com/maps/documentation/javascript/places-ui-kit/basic-autocomplete · https://developers.google.com/maps/billing-and-pricing/pricing · https://developers.google.com/maps/documentation/places/web-service/data-fields

## 6. Editar un restaurante

- **«Edita»** (editores) abre una sola pantalla con los bloques del alta seguidos, sin pasos ni barra de progreso. El bloque de la nota solo lo ve quien puntúa. En el primer bloque aparece también la casilla «Localitat», para poder corregirla: la localidad solo desaparece del alta.
- **«Puntua» o «Edita la meva nota»** se mantiene en la ficha y abre solo el bloque de la nota (confirmado el 24 de noviembre de 2026).
- Al guardar la edición, la nota de quien puntúa solo se guarda si la ha cambiado.
- «Pendent de visitar» solo aparece si nadie ha puntuado el restaurante. Al quitarlo vuelven la fecha (hoy) y el bloque de la nota.
- **«Recomanació per menys de 40 €»** (bajo el precio, «Pàgina d'inici»): solo al editar y solo con precio «<20 €» o «20-40 €». Con otro precio no se ve y se guarda sin marcar.

### Común al alta y a la edición

Decidido el 24 de noviembre de 2026, al aprobar el enfoque de la parte 3g:

- El formulario ocupa la pantalla: arriba el título y la X, abajo los botones. Mientras tanto no se ve el menú flotante.
- Cerrar con algo puesto pide confirmación («Vols descartar…?»). Sin cambios, se cierra directamente.
- Intro en un campo solo cierra el teclado; se guarda siempre con el botón.

## 7. Aspecto: colores, modo oscuro y menú

Elegido por el propietario el 24 de noviembre de 2026 con maquetas, entre la paleta anterior («Berenjena», morado y amarillo; en el historial de git) y tres propuestas pastel. Pidió quitar el «estilo IA» (letra, botones muy redondos, falta de detalles, colores) e ir cambiando cosas pequeñas.

### Paleta «Terracota suau»

Tonos pastel poco saturados: terracota suave (el color de la icona) y amarillo mantequilla. El acento es pastel y lleva texto oscuro; para textos y enlaces se usa su versión intensa.

| Uso | Claro | Oscuro |
|---|---|---|
| Fondo | `#faf6f2` | `#18130f` |
| Superficies | `#fffdfb` / `#f4ede6` | `#211a15` / `#2b231d` |
| Texto | `#33261f` | `#f2e9e2` |
| Texto secundario | `#74645a` | `#b5a597` |
| Líneas y pistas de barras | `#ebe1d7` / `#efe6dd` | `#392f28` / `#332a23` |
| Acento (botones, «+», fichas marcadas) | `#eec0ab` | `#eec0ab` |
| Texto sobre el acento | `#46200f` | `#3a170b` |
| Acento intenso (enlaces, progreso, detalles) | `#a3553a` | `#f0c6b3` |
| Amarillo mantequilla | `#e9dba8` | `#e9dba8` |
| Peligro y errores | `#b3393f` | `#f0a0a0` |

**Quien puntúa**, colores propios de esta paleta (fuera de los verdes, amarillos, naranjas y rojos de las notas, y con claridad distinta entre los dos). La app los sigue guardando como `azul` y `rosa`; se muestran como «tinta» y «turquesa».

| Persona | Barra, puntos, avatar | Números y nombres (claro / oscuro) | Texto sobre la barra |
|---|---|---|---|
| Isidre, tinta (`azul`) | `#8a93b5` / `#a3acd0` | `#343e6a` / `#c6cce6` | `#161c38` |
| Cris, turquesa (`rosa`) | `#7cc2c0` / `#8fd0ce` | `#23686a` / `#b6e4e2` | `#0d3135` |

**Notas**: los mismos cinco tonos pastel en claro y oscuro, con el número siempre oscuro (`#2b211b`): 9 o más `#a8d8bd`, 8 `#c9e2a0`, 7 `#f3dc94`, 5 y 6 `#f5c19c`, menos de 5 `#f0a9a9`; sin nota, `#e3dad2` (`#c9bdb2` en oscuro). Los colores de nota no se usan como texto.

### Letra, formas y detalles

- Letra del sistema (SF Pro en el iPhone), sin cargar letras de Google. Títulos en seminegrita.
- Esquinas poco redondas: tarjetas 10 px, botones y campos 8 px, etiquetas 8 px (antes, pastillas), notas 10 y 14 px.
- Títulos de sección en minúscula y a 15 px («La teva nota», «Fotos»), sin mayúsculas espaciadas.
- `theme-color` de `index.html` y del manifiesto con las superficies de la paleta.

### Modo claro y oscuro

- La app sigue siempre el modo del sistema. No hay interruptor manual.

### Menú inferior flotante

- Pieza clara y redondeada (22 px), con borde fino, separada de los bordes y flotando sobre el mapa. La sección activa en el acento intenso sobre fondo suave.
- Botones «Inici · Mapa · + · Llista» desde el 24 de noviembre de 2026 (elegido por el propietario); antes, Mapa y Llista a los lados del «+». El «+» es más grande, cuadrado redondeado, en el acento con texto oscuro. Quien no puede añadir no ve el «+» y los otros tres se reparten el ancho.

## 8. Mapa

- Estilo propio en la nube de Google: **«Terracota»** para el modo claro y **«Terracota nit»** para el oscuro, a juego con la paleta (24 de noviembre de 2026; antes, «Lavanda» y «Noche», en el historial de git). Son dos estilos de Google, uno de variante clara y otro oscura, asociados al mismo Map ID: cada Map ID admite uno de cada.
- El mapa se crea con `colorScheme: FOLLOW_SYSTEM`. Solo se puede fijar al crearlo: si el sistema cambia de modo con la app abierta, el mapa no cambia hasta volver a abrirla. Aceptado.
- En los dos modos se ocultan los puntos de interés de Google (comercios y restaurantes). Se dejan los nombres de pueblos y del mar.
- Sin nombres de autopistas y vías rápidas ni de sus enlaces, sin placas de carreteras (Ma-20, Ma-1110…) y sin números de salida; las calles y avenidas conservan el nombre, también las que Google agrupa como «arterial» con las carreteras secundarias (parte 5 de las peticiones, 25 de noviembre de 2026).
- Zonas verdes en **verde menta** (elegido por el propietario el 25 de noviembre de 2026, en lugar del verde salvia propuesto): parques y jardines (Google los trata igual), campos e instalaciones de deporte, golf y zonas peatonales. Antes, los parques iban en beis y el deporte en el verde intenso de Google.
- **Plazas:** no se pueden colorear. Google tiene el elemento «plaza» (`townSquare`), y su documentación dice que se representa con una forma, pero la consola lo rechaza al importar («No se encontró el elemento», geometría; 25 de noviembre de 2026). Las zonas peatonales se pintan por si alguna plaza está dibujada así; en Palma no se ha visto que cambie ninguna. Dibujarlas desde la app con contornos de OpenStreetMap se descartó por el trabajo que da para lo que aporta.
- En «Terracota nit», Google pinta las zonas urbanas en azul marino si no se les da color; van en el marrón de la cubierta del suelo (25 de noviembre de 2026). En «Terracota» se deja su gris claro. Quedan algunas manchas azuladas pequeñas en oscuro, sin identificar, que no se han tocado.

| Elemento | Terracota | Terracota nit |
|---|---|---|
| Mar | `#cfe3e1` | `#142427` |
| Tierra | `#f8f3ee` | `#221b16` |
| Cubierta del suelo | `#efe7dc` | `#29211b` |
| Parques, jardines, deporte y zonas peatonales | `#cdebd5` | `#213628` |
| Zona urbana | (gris de Google) | `#29211b` |
| Carreteras principales | `#f1d9b5` | `#5a4630` |
| Carreteras secundarias | `#ebe1d6` | `#33291f` |
| Etiquetas de pueblos | `#7a4a35` | `#b5a597` |
| Etiquetas del mar | `#3f7a78` | `#6fa5a3` |

- La línea de costa no se puede aplicar: al importar, Google rechaza el color de borde en el agua (`strokeColor` en `natural.water`, 24 de noviembre de 2026). La costa queda como el contraste entre mar y tierra.
- Coste: usar un Map ID se cobra con el SKU de Dynamic Maps, el mismo de cada carga del mapa; no añade coste aparte. Comprobado el 24 de noviembre de 2026.
- Los dos estilos están en `docs/mapa/terracota.json` y `docs/mapa/terracota-nit.json`, con los colores de la tabla. Se importan en la consola de Google Cloud desde «Diseños de mapa» → «Crear estilo» → pestaña JSON (comprobado en la documentación el 24 de noviembre de 2026) y se asocian al Map ID en lugar de los anteriores. Si se retocan en la consola, conviene exportarlos y actualizar estos archivos.
- Map ID «Puntuam a taula» (`ef2c6b7a22cee90b3aee6ac8`, vectorial, sin inclinación ni rotación), en `app/config.js`. Desde el 24 de noviembre de 2026 tiene «Terracota» en claro y «Terracota nit» en oscuro, importados y asociados por el propietario (antes, «Lavanda» y «Noche»). El cambio tardó unos minutos en verse. El 25 de noviembre de 2026 el propietario los actualizó desde el editor de cada estilo: «Personalizar», pestaña JSON, «Subir» con el archivo de `docs/mapa/`, «Aplicar», «Guardar» y «Publicar», sin tocar el Map ID. Comprobado después en la app publicada, en claro y en oscuro.
- El mapa del formulario usa el mismo estilo, así que tampoco muestra los restaurantes de Google: el sitio elegido en el buscador lo marca el aro (sección 5).
- Pendiente: la maqueta de la pantalla del mapa con el menú flotante y las tarjetas.
- Ideas comentadas y no aprobadas: pines con la nota escrita dentro, carrusel de tarjetas sobre el mapa, grupos de pines con la nota media, y filtros como fichas flotantes. La portada de la ficha sí se aprobó el 24 de noviembre de 2026 (sección 4).

Fuentes: https://developers.google.com/maps/documentation/javascript/cloud-customization/setup · https://developers.google.com/maps/documentation/javascript/mapcolorscheme · https://developers.google.com/maps/documentation/javascript/cloud-customization/json · https://developers.google.com/maps/documentation/javascript/cloud-customization/json-reference · https://developers.google.com/maps/documentation/javascript/cloud-customization/map-styles

## 9. Modelo de datos (Firestore)

| Documento | Contenido | Quién escribe |
|---|---|---|
| `members/{correo}` | `role`: `owner` o `editor` (`viewer` ya no hace falta). `color`: `azul`, `rosa` o ninguno | Propietarios, en la consola |
| `users/{uid}` | `displayName`, `color` (debe coincidir con el de `members`), `updatedAt` | Cada uno el suyo |
| `restaurants/{id}` | `name`, `locality`, `address` (opcional), `location`, `cuisines`, `price` (1 a 5), `visitDate` (`AAAA-MM-DD`, o nulo si está pendiente de visitar), `featured` (opcional, recomendación de la página de inicio), `blog` (con las marcas de formato de la sección 5, paso 4), `photos` (lista de `{full, thumb, caption}`, y `cover: true` en la portada si se ha elegido), `placeId`, `source`, `createdBy`, `createdAt`, `updatedBy`, `updatedAt` | Editores |
| `restaurants/{id}/ratings/{uid}` | `scores`, `global`, `dish`, `updatedAt` | Solo su autor, si tiene color |
| ~~`accessRequests/{uid}`~~ | Retirada el 24 de noviembre de 2026 con la app pública. Las que queden se borran en la consola | Nadie desde la app |

Fotos en Storage: `restaurants/{id}/{archivo}`. Suben y borran los editores; las ve cualquiera.

Lectura: `restaurants`, sus `ratings` y `users` los lee cualquiera, sin entrar; `members`, solo cada uno el suyo y los propietarios.

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
| 3g · Alta y edición | Alta en cuatro pasos y edición en una pantalla, que comparten los mismos bloques (secciones 5 y 6). Publicada el 24 de noviembre de 2026 y aprobada por el propietario tras probarla Claude en la app publicada (alta con Google, nota y edición) |
| 3h · Cierre | Prueba del propietario en el iPhone y su aprobación, estado al día en `CLAUDE.md` y borrar la carpeta `prueba/`. Hecha el 24 de noviembre de 2026: `prueba/` borrada, estado al día y prueba final del propietario en el iPhone aprobada. **Paso 3 cerrado.** |

Tareas del propietario hechas: publicar las reglas de Firestore que aceptan `address` (comprobado el 24 de noviembre de 2026 al guardar en la app publicada un restaurante con la dirección de Google), poner `color` en los dos documentos de `members`, borrar las fichas de prueba y crear el Map ID con los estilos (sección 8).

Fichas de prueba que el propietario decidió conservar por ahora (24 de noviembre de 2026): «Celler de proves» y «Prova Claude (esborrar)». Esa misma noche ya solo quedaba la segunda.

### Peticiones del 24 de noviembre de 2026, por partes

Lista del propietario de ese día, ordenada en partes. Al final de cada una se le enseña el resultado.

| Parte | Contenido | Estado |
|---|---|---|
| 1 · Ficha y mapa | Cabecera de la ficha según su boceto, tarjeta de Google pequeña y mapa que se abre en Palma (sección 4) | Publicada el 24 de noviembre de 2026 |
| 2 · Datos | Cinco tramos de precio, «Pendent de visitar» y la marca de recomendación de la página de inicio (secciones 2, 5 y 6). Reglas de Firestore nuevas publicadas por el propietario | Publicada el 24 de noviembre de 2026. Comprobada al guardar Bar Vius como recomendado |
| 3 · Inici | Página de inicio como primera pantalla, con el menú «Inici · Mapa · + · Llista». Paneles «Recomanació per menys de 40 €» (el restaurante marcado, empezando por Bar Vius; sin foto propia, la de Google) y «Millors menús degustació» (tarjetas que llevan a la ficha y «Veure'ls al mapa» con el filtro Menú degustació) (sección 4b). Alta de Miceli, Tomeu Caldentey, Boro, Santi Taura y Daica como pendientes de visitar, con el tipo Menú degustació y precio «>100 €» mientras el propietario no diga otro | Hecha el 24 de noviembre de 2026 y aprobada por el propietario, con Inici como portada de periódico. Los cinco los dio de alta Claude en la app publicada con la sesión del propietario, eligiéndolos en el buscador de Google («Boro» es VORO, el único que sale en Mallorca) |
| 4 · Comentario con formato | Negrita, cursiva, subrayado y enlaces a otras webs en el texto largo, con botones (sección 5, paso 4). «Referencias» son enlaces a otras webs, aclarado por el propietario | Publicada el 24 de noviembre de 2026 y aprobada por el propietario |
| 5 · Mapa | Parques, jardines y plazas en verde suave dentro de «Terracota»; sin nombres de autopistas y carreteras, solo los de las calles. El propietario actualiza los dos estilos en Google Cloud (sección 8) | Publicada el 25 de noviembre de 2026 y aprobada por el propietario. Zonas verdes en menta; las plazas no se pueden colorear |

En espera, sin fecha: fotos intercaladas con el texto en el comentario.

# Rediseño visual (provisional, para integrar)

Acordado con el propietario el 24 de noviembre de 2026 en una conversación de Claude fuera de Claude Code, con maquetas. **Este archivo es temporal**: su contenido debe integrarse en `docs/diseno.md` (y en `docs/especificacion.md` donde corresponda) y después se borra. No debe quedar como apartado suelto.

Las maquetas se hicieron con textos en castellano. Los textos de la interfaz van en catalán, como manda `docs/diseno.md`.

## 1. Paleta «Berenjena»

Sustituye a la paleta náutica actual de `app/styles.css`. Dos colores protagonistas: morado y amarillo mostaza.

| Uso | Claro | Oscuro |
|---|---|---|
| Fondo | `#fbf7ff` | `#151020` |
| Superficies | `#ffffff` | `#211a2e` |
| Texto | `#2a1a40` | `#efe9f7` |
| Texto secundario | `#6d6180` | `#a79bb8` |
| Acento principal (menú, botones) | `#6b3fa0` | `#b48be0` |
| Texto sobre el acento principal | `#ffffff` | `#170f22` |
| Acento secundario (botón +, detalles) | `#ffb81c` | `#ffc444` |
| Texto sobre el acento secundario | `#2a1a05` | `#2a1a05` |
| Líneas y pistas de barras | `#e7dcf3` / `#efe8f6` | `#3a2f4a` / `#2f2640` |
| Azul (propietario) | `#2f6fd0` | `#6ea8ff` |
| Rosa (Cris) | `#d6457f` | `#ff7fb5` |

- Colores de nota: se mantienen los actuales (`--s1` a `--s5`) en claro y en oscuro.
- Sobre el amarillo el texto es siempre oscuro, en los dos modos.
- En oscuro el fondo no es negro puro sino morado muy oscuro.
- El acento no puede ser azul medio ni rosa, porque son los colores de quien puntúa.
- Pendiente de comprobar en la app real: que las barras y la roseta azul y rosa se lean bien junto al morado en la ficha.
- Actualizar también `theme-color` en `index.html` y el manifiesto.

## 2. Modo claro y oscuro

- La app sigue siempre el modo del sistema. No hay interruptor manual.
- Las reglas `:root[data-theme="light"]` y `:root[data-theme="dark"]` de `app/styles.css` no las usa nada y se pueden quitar.

## 3. Mapa

- Estilo propio en la nube de Google, asociado al Map ID: **«Lavanda»** en claro y **«Noche»** en oscuro, en el mismo estilo.
- El mapa se crea con `colorScheme: FOLLOW_SYSTEM`. Solo se puede fijar al crear el mapa: si el sistema cambia de modo con la app abierta, el mapa no cambia hasta volver a abrirla. Aceptado.
- En los dos estilos se ocultan los puntos de interés de Google (comercios y restaurantes). Se dejan los nombres de pueblos y del mar.

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

- Coste, comprobado el 24 de noviembre de 2026: usar un Map ID se cobra contra el SKU de Dynamic Maps, el mismo que ya usa cada carga del mapa. No añade coste aparte. Fuente: https://developers.google.com/maps/documentation/javascript/cloud-customization/setup
- Modo oscuro con estilo en la nube: https://developers.google.com/maps/documentation/javascript/mapcolorscheme
- El JSON de estilos en la nube es de disponibilidad general desde el 21 de septiembre de 2026, así que el estilo se puede preparar en un archivo e importarlo en la consola en vez de configurarlo a mano.
- Tarea del propietario (ya prevista): crear el Map ID y asociarle el estilo. Se guía paso a paso.

## 4. Menú inferior flotante

- Pastilla redondeada separada de los bordes, con fondo del acento principal, flotando sobre el mapa.
- Botón «+» central más grande, en el acento secundario, para añadir restaurante.

## 5. Alta de restaurante en cuatro pasos

Sustituye al formulario largo de cuatro grupos. Barra de progreso arriba (cuatro segmentos y «Paso N de 4»), botón de cerrar, y abajo «Atrás» y «Siguiente» («Guardar restaurante» en el último).

1. **Dónde está.** Solo el buscador de Google y el mapa con el aro y el pin, como dice la sección 5 de `docs/diseno.md`.
   - **El nombre es el de la casilla del buscador**: al elegir un resultado, la casilla se queda con el nombre de Google y se puede retocar ahí mismo. No hay casilla «Nombre» aparte.
   - **La localidad desaparece del alta.** Se sigue sacando de la dirección de Google y guardando en `locality`, sin mostrarse. La casilla solo aparece si Google no la da.
2. **Datos.** Tipos de cocina en fichas, precio en cuatro botones grandes y fecha de visita con atajos «Hoy» y «Ayer» además del selector de fecha. Los atajos son nuevos: se propusieron en la maqueta y el propietario no puso objeciones; confirmarlo con él.
3. **Tu nota.** Arriba, la nota global grande con su color y su texto, y al lado la roseta de quien puntúa dibujándose en directo. Debajo, un deslizador por criterio con su valor coloreado. El nombre del plato estrella va dentro de su criterio. Botón «Puntuar más tarde», porque la nota sigue siendo opcional.
4. **Texto y fotos.** Texto largo y fotos con su pie.

## 6. Editar un restaurante

Una sola pantalla con los cuatro bloques anteriores seguidos, sin pasos ni barra de progreso.

## 7. Localidad fuera del alta

Solo desaparece del alta. Se mantiene en la ficha como etiqueta tocable, y se ha dado por hecho que también sigue en los filtros y en el buscador de la app (confirmarlo con el propietario).

## 8. Sin decidir todavía

- Maquetas de la ficha y de la pantalla del mapa con el menú flotante y las tarjetas.
- Otras ideas comentadas y no aprobadas: pines con la nota escrita dentro, carrusel de tarjetas sobre el mapa, grupos de pines con la nota media, filtros como fichas flotantes, primera foto como portada de la ficha.

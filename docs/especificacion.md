# Cuaderno de restaurantes: especificación

Documento de traspaso. Recoge lo acordado entre el propietario y Claude entre el 21 y el 23 de noviembre de 2026. Lo que no aparece aquí no está decidido.

## 1. Qué es

App personal para puntuar y reseñar los restaurantes visitados.

- Volumen previsto: como máximo unos 100 restaurantes.
- Privada. Se comparte con unas pocas personas invitadas.
- Uso principal desde el iPhone, también desde ordenador.

## 2. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Vistas | Dos: mapa y lista. Los filtros son comunes a ambas. |
| Criterios | Seis, en este orden: calidad del producto, plato estrella, técnica y creatividad, servicio, calidad/precio, ambiente. |
| Escala | De 1 a 10 con medios puntos. |
| Nota global | Media simple de los criterios puntuados. |
| Plato estrella | Lleva nombre propio del plato además de la nota. |
| Fichas | Una por restaurante, no una por visita. |
| Tipos de cocina | Varios por restaurante. |
| Roseta | En la ficha, debajo de las puntuaciones. Estilo de las cartas de jugadores de fútbol (ver sección 4). |
| Alta | Manual en la primera versión. Buscador de Google Places en un paso posterior. El propietario dijo que el buscador no es crítico ahora. |
| Mapa | Google Maps. |
| Datos y fotos | Firebase: Auth con cuentas de Google, Firestore y Storage. |
| Alojamiento | GitHub Pages desde este repo, que es público. |
| UI | La de la demo (`demo/index.html`), aprobada por el propietario. |

### Opciones descartadas

- **Artefacto dentro de Claude:** bloquea mapas y API externas. Sirvió para la demo.
- **OpenStreetMap:** se usó como idea para la demo. Se abandona porque los datos de Places solo pueden mostrarse sobre un mapa de Google.
- **Dropbox como almacén:** compartir tiene más fricción (cada editor necesita cuenta y carpeta compartida) y la integración se valoró como más difícil.
- **Servidor en un Mac propio:** exige exponerlo a Internet, con mantenimiento y copias a cargo del propietario.
- **Supabase:** el plan gratuito pausa el proyecto tras una semana sin actividad.
- **Solo en el dispositivo:** no sincroniza ni permite compartir.

## 3. Pendiente de confirmar con el propietario

1. **Modelo de compartir.** Supuesto de trabajo: dos personas editan (el propietario y una más) y el resto de invitados solo mira. Se le planteó varias veces y no lo contradijo, pero tampoco lo confirmó de forma explícita.
2. **Orden de construcción** (sección 6). Se le presentó el 23 de noviembre y siguió adelante con el traspaso sin objeciones, pero no dio un visto bueno explícito.
3. **Propuesta técnica** de `CLAUDE.md` (sin framework ni compilación). No se le ha presentado todavía.
4. **Restaurantes fuera de Mallorca.** Se le dijo que se daba por hecho que también querría apuntarlos, con la localidad como texto libre. No lo corrigió.

## 4. Pantallas y comportamiento

La referencia es la demo. Este apartado resume lo que hay que conservar y lo que cambia.

### Navegación

Barra inferior con tres secciones: Mapa, Lista y Añadir. La ficha se abre a pantalla completa por encima.

### Filtros (comunes a mapa y lista)

- Búsqueda por nombre, sin distinguir acentos ni mayúsculas.
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

### Lista

- Tarjetas con nota global, nombre, localidad, tipos de cocina, precio, plato estrella con su nota y fecha de visita.
- Orden por nota, por fecha o por nombre.

### Color y texto de la nota

Se calcula sobre la nota redondeada a un decimal.

| Nota | Texto |
|---|---|
| 9 o más | Excelente |
| De 8 a 8,9 | Muy bueno |
| De 7 a 7,9 | Bueno |
| De 5 a 6,9 | Correcto |
| Menos de 5 | Flojo |

Los colores exactos están en los tokens `--s1` a `--s5` de la demo, con variantes para tema claro y oscuro. El color nunca va solo: siempre acompaña a un número.

### Añadir y editar

- Datos: nombre (obligatorio), tipos de cocina (selección múltiple), fecha de visita (por defecto hoy) y precio en cuatro niveles.
- Ubicación: localidad y posición marcada tocando el mapa. El pin se puede arrastrar para afinar.
- Valoración: seis barras deslizantes con botones de medio punto a los lados. Un criterio sin tocar queda "Sin nota". El plato estrella tiene además un campo de texto para el nombre del plato. La nota global se actualiza en vivo.
- Reseña y fotos. Se pueden añadir varias fotos y quitarlas antes de guardar.

### Ficha

- Nombre, localidad, tipos de cocina, precio y fecha de visita.
- Nota global grande con su texto.
- Las seis notas con barra y valor.
- **Roseta:** rejilla hexagonal con un hexágono interior en el 5 y radios a los vértices. Una sola línea une las seis notas. La línea toma el color de la nota global. Nombres de los criterios en negrita en los vértices. Sin números dentro del gráfico: las notas exactas están en las barras de encima. Orden desde arriba y en sentido horario: producto, plato estrella, técnica, servicio, calidad/precio, ambiente.
- Reseña, y fotos que se amplían al tocarlas.
- Acciones: ver en el mapa, editar y borrar con confirmación.

### Valores usados en la demo

- Tipos de cocina: Mallorquina, Mediterránea, Arroces, Pescado y marisco, Brasa, Tapas, De autor, Italiana, Japonesa, Otra. La lista es ampliable.
- Precio: €, €€, €€€, €€€€.
- Los restaurantes de la demo son inventados.

### Qué cambia respecto a la demo

- La base del mapa pasa a ser Google Maps. La demo dibuja un contorno de Mallorca con municipios porque no podía cargar mapas externos.
- La localidad pasa a ser texto libre. En la demo es una lista cerrada de municipios de Mallorca que se detecta sola al tocar el mapa.
- Se añade "usar mi ubicación" al situar el restaurante.
- Los datos y las fotos se guardan de verdad. Las fotos se comprimen antes de subirlas.
- Hay modo de solo lectura para invitados.

## 5. Modelo de datos

Propuesta presentada al propietario en lenguaje llano. Los nombres de campo son orientativos.

### `restaurants/{id}`

| Campo | Tipo | Notas |
|---|---|---|
| `name` | texto | |
| `locality` | texto | Libre |
| `location` | `{lat, lng}` | Posición del pin colocado por el usuario |
| `cuisines` | lista de textos | Uno o varios |
| `price` | 1 a 4 | |
| `visitDate` | `AAAA-MM-DD` | |
| `scores` | objeto | Claves `producto`, `plato`, `tecnica`, `servicio`, `precio`, `ambiente`. De 1 a 10 en pasos de 0,5, o vacío |
| `global` | número | Media de los criterios puntuados. Se guarda para ordenar y filtrar |
| `dish` | texto | Nombre del plato estrella |
| `review` | texto | |
| `photos` | lista | Referencias a los archivos en Storage |
| `placeId` | texto o vacío | Reservado para el buscador de Places |
| `source` | `manual` o `places` | |
| `createdBy`, `createdAt`, `updatedBy`, `updatedAt` | | Autoría y fechas |

### Permisos

Un documento de configuración con dos listas de correos: quienes editan y quienes solo miran. Las reglas de seguridad cierran todo lo demás. Solo el propietario modifica las listas.

### Fotos

En Storage, una carpeta por restaurante. Propuesta sin acordar: lado mayor de unos 1600 px y una miniatura para las listas.

## 6. Orden de construcción

1. **Preparación.** La hace el propietario con guía, unos 20 minutos: proyecto de Google con tarjeta y alerta de presupuesto, Firebase en región europea y clave del mapa restringida al dominio de GitHub Pages. El repo ya está creado.
2. **Prueba técnica.** Login con Google en el iPhone con la app instalada, guardar y leer una ficha, subir una foto y cargar el mapa. Es el punto con más riesgo y va antes de portar nada.
3. **Portar la demo.** Misma UI, con datos reales y mapa de Google.
4. **Compartir.** Modo de solo lectura para invitados y una pantalla para gestionar los correos con acceso.
5. **Remate.** Icono e instalación en el iPhone, consulta sin cobertura de lo ya cargado y exportar una copia de seguridad.
6. **Más adelante.** Buscador de Places.

Se enseña el resultado al propietario al final de los pasos 2, 3 y 4.

## 7. Condiciones de Google que afectan al diseño

Comprobadas el 23 de noviembre de 2026. Volver a verificarlas antes de apoyarse en ellas.

- **Mapa.** Los datos de Places que se muestren en un mapa tienen que ir sobre un mapa de Google.
- **Almacenamiento.** De lo que devuelve Places solo se puede guardar de forma indefinida el identificador del sitio. El resto hay que pedirlo de nuevo cuando haga falta. Los datos propios del usuario (notas, reseña, fotos, tipos de cocina) no tienen restricción. El diseño concreto para los restaurantes dados de alta con Places queda para el paso 6.
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

## 8. Riesgos a probar pronto

- Login con Google dentro de una PWA instalada en iPhone.
- Restricción de la clave del mapa por dominio sin romper el desarrollo en local.
- Consulta sin cobertura.

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
| Compartir | Sustituido el 23 de noviembre de 2026 por el cuaderno común: todos los invitados puntúan y solo los editores dan de alta (ver sección 3 y `docs/propuesta-cuaderno-comun.md`). |
| Ámbito | También restaurantes de fuera de Mallorca. La localidad es texto libre y el campo sugiere las ya usadas, para evitar variantes del mismo sitio. |
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

### Cuaderno común con puntuaciones de varias personas

**Aprobado el 23 de noviembre de 2026.** Todos los invitados puntúan, todos ven las puntuaciones de los demás y cada uno elige de quién es la media que ve. El detalle (papeles, pantallas, modelo de datos, reglas y decisiones D1 a D5) está en `docs/propuesta-cuaderno-comun.md`. Donde ese documento choque con las secciones 1, 4 y 5 de esta especificación, manda ese documento.

Pendiente:

- Antes del paso 3, Claude actualiza la demo con las piezas nuevas y el propietario la revisa.
- Tamaño de las fotos: sigue la propuesta de la sección 5, sin acordar.

### Copias de seguridad

No se activaron al crear Firestore (23 de noviembre de 2026). Se decide en el paso 5: copias programadas de Firestore (verificar antes su precio), qué hacer con las fotos de Storage, que esas copias no cubren, o si basta con la exportación desde la app.

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
- La localidad pasa a ser texto libre, con sugerencia de las localidades ya usadas al escribir. En la demo es una lista cerrada de municipios de Mallorca que se detecta sola al tocar el mapa.
- Se añade "usar mi ubicación" al situar el restaurante.
- Los datos y las fotos se guardan de verdad. Las fotos se comprimen antes de subirlas.
- Hay modo de solo lectura para invitados.

## 5. Modelo de datos

Presentado al propietario en lenguaje llano y sin objeciones. Los nombres de campo son orientativos.

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

Un documento de configuración con dos listas de correos: quienes editan (de momento dos personas) y quienes solo miran. Las reglas de seguridad cierran todo lo demás. Solo el propietario modifica las listas.

### Fotos

En Storage, una carpeta por restaurante. Propuesta sin acordar: lado mayor de unos 1600 px y una miniatura para las listas.

## 6. Orden de construcción

Confirmado por el propietario.

1. **Preparación.** La hace el propietario con guía, unos 20 minutos: proyecto de Google con tarjeta y alerta de presupuesto, Firebase en región europea y clave del mapa restringida al dominio de GitHub Pages. El repo ya está creado.
2. **Prueba técnica.** Login con Google en el iPhone con la app instalada, guardar y leer una ficha, subir una foto y cargar el mapa. Es el punto con más riesgo y va antes de portar nada.
3. **Portar la demo.** Misma UI, con datos reales y mapa de Google.
4. **Compartir.** Papeles de propietario, editor y miembro, pantalla de accesos y solicitudes de acceso (ver `docs/propuesta-cuaderno-comun.md`).
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

### Condiciones de Google Maps Platform para el EEE

Comprobado el 23 de noviembre de 2026. Al activar Maps JavaScript API la consola exige aceptar las condiciones del Espacio Económico Europeo.

- Se aplican desde el 8 de julio de 2025 a los proyectos con cuenta de facturación en el EEE, como este (España). No hay alternativa si se quiere usar Google Maps.
- Maps JavaScript API no tiene cambios técnicos. Según la FAQ, los precios no cambian. No se ha confirmado si cambian los cupos gratuitos.
- Se eliminan tres restricciones, entre ellas «no usar con mapas que no sean de Google». Esto contradice el motivo por el que se descartó OpenStreetMap (sección 2): revisarlo antes del paso 6.
- **Places en el EEE:** salvo latitud, longitud e identificador del sitio, el contenido de Places no se puede mostrar sobre ningún mapa, tampoco el de Google. El componente Place Autocomplete del Places UI Kit queda fuera de esta restricción. Afecta al diseño del paso 6, no a los anteriores.
- No se ha encontrado en las páginas del EEE la regla de almacenamiento (solo el identificador del sitio de forma indefinida). Volver a comprobarla en el paso 6.

Fuentes:

- https://developers.google.com/maps/comms/eea/faq
- https://developers.google.com/maps/comms/eea/places

## 8. Riesgos a probar pronto

- Login con Google dentro de una PWA instalada en iPhone.
- Restricción de la clave del mapa por dominio sin romper el desarrollo en local.
- Consulta sin cobertura.

## 9. Seguridad y protección frente a abusos

Acordado el 23 de noviembre de 2026. El objetivo es que nadie de fuera del grupo pueda leer datos, escribirlos, subir fotos ni generar gasto. Las reglas se aplican en los servidores de Firebase, así que no se pueden saltar tocando el código de la app, que es público.

### Fotos (Storage)

- Solo pueden subir fotos los usuarios que han entrado con Google y figuran en la lista de personas con permiso para puntuar. Un usuario sin cuenta o que no esté en la lista recibe un error.
- Cada persona sube solo a su propia carpeta: `restaurants/{idRestaurante}/{idUsuario}/`. No puede escribir en la de otro.
- Solo se aceptan imágenes (tipo `image/*`) y con un tamaño máximo por archivo. Propuesta: 3 MB. La app comprime antes de subir, así que una foto normal queda muy por debajo.
- Borrar una foto: su autor o el propietario.
- Ver fotos: solo los miembros del grupo.
- Las reglas de Storage consultan la lista de permisos que está en Firestore. Comprobar en el paso 2 que esta consulta funciona y cuánto cuesta en lecturas.

### Datos (Firestore)

- Todo cerrado por defecto: la base de datos se crea en modo de producción.
- Leer: solo miembros del grupo.
- Crear y editar la parte común de un restaurante: solo los editores.
- Escribir una puntuación: solo su autor y solo la suya.
- Modificar las listas de permisos: solo el propietario.
- Se validan los datos: notas de 1 a 10 en pasos de 0,5, precio de 1 a 4 y textos con longitud máxima.

### Mapa (Google Maps)

- Clave limitada a la web de GitHub Pages y a `localhost` para el desarrollo, y solo a Maps JavaScript API.
- Cuota diaria máxima de cargas de mapa: no se pudo fijar. El 23 de noviembre de 2026 la consola mostraba «Map loads per day» como ilimitado y no ajustable, con la edición desactivada. Sigue igual tras pasar a cuenta completa, así que no era por la prueba. Ninguna cuota de Maps JavaScript API aparece como ajustable. Pendiente: buscar la causa en la documentación de Google.
- Mientras no haya tope, la protección del mapa es la restricción de la clave y la alerta de presupuesto. Si hubiera abuso: inhabilitar Maps JavaScript API o cambiar la clave.

### Gasto

- Alerta de presupuesto de 5 € al 50, 90 y 100 %, sin contar créditos. Solo avisa: no corta el servicio.
- Los límites de gasto de Google Cloud (spend caps) no sirven aquí. Comprobado el 23 de noviembre de 2026: solo cubren Gemini API, Vertex AI, Cloud Run y Cloud Run functions. Fuente: https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps
- La cuenta de facturación se pasó a cuenta completa el 23 de noviembre de 2026, así que la app no se para al acabar la prueba. El crédito restante se sigue usando primero.

### A valorar más adelante

- Firebase App Check, para que solo la propia app pueda llamar a Firebase. No está decidido.

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

Clave de Google Maps, «Mapa web Puntuam»: `AIzaSyC1tU3zrYHXj7WsXPDbgbxz5kAdaHh9GP8`. Limitada a los sitios `https://isidrecc.github.io/restaurantes/*`, `http://localhost/*` y `http://localhost:8000/*`, y solo a Maps JavaScript API. Si se renombra el repo, hay que cambiar el primer sitio.

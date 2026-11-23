# Cuaderno común: puntuaciones de varias personas

Propuesta de Claude del 23 de noviembre de 2026, **aprobada por el propietario el mismo día**, incluidas las decisiones de la sección 9. Donde este documento choque con las secciones 1, 4 y 5 de `especificacion.md`, manda este documento.

Parte de lo ya decidido (especificación, sección 3): solo invitados, altas y datos comunes solo para editores, roseta con dos líneas.

## 1. Idea en una frase

Un único cuaderno de restaurantes para el grupo. Cada persona pone su propia puntuación a cada restaurante y todos ven las de todos. Cada uno elige de quién es la media que ve.

## 2. Personas y permisos

Tres papeles. Las listas se guardan por correo, para poder invitar a alguien antes de que entre por primera vez.

| Papel | Ve todo | Puntúa | Da de alta y edita datos comunes | Borra restaurantes | Gestiona accesos |
|---|---|---|---|---|---|
| Propietario | ✔ | ✔ | ✔ | ✔ | ✔ |
| Editor | ✔ | ✔ | ✔ | Solo si no hay opiniones de otros (D2) | |
| Miembro | ✔ | ✔ | | | |

- Desaparece el papel de «solo mira» de la especificación anterior: todo invitado puede puntuar (decisión D1).
- Cada persona tiene un **nombre visible** corto que elige la primera vez que entra (por defecto, su nombre de pila de Google). Es lo que ven los demás junto a sus notas. Su correo no se muestra a los miembros.

### Solicitudes de acceso

- Quien entra con Google y no está en ninguna lista ve una pantalla «No tienes acceso» con el botón **Solicitar acceso**.
- Un miembro puede **solicitar ser editor** desde su perfil.
- Los miembros no proponen restaurantes nuevos en la primera versión (D4).
- El propietario ve las solicitudes pendientes con un aviso en la barra inferior y las aprueba (como miembro o como editor) o las rechaza. Sin correo electrónico.

## 3. Qué es común y qué es de cada persona

| Común (una vez por restaurante) | De cada persona |
|---|---|
| Nombre | Seis notas |
| Localidad | Plato estrella (nombre y nota) |
| Posición en el mapa | Reseña |
| Tipos de cocina | Fecha de visita |
| Precio | Fotos |

## 4. Cómo se calcula la nota que se ve

- **Selector «Nota de»:** Todos, Solo yo o Personas elegidas (casillas en la lista de personas). Se guarda en el dispositivo, así que cada uno lo deja como prefiera. Ver la media de algunas personas es lo que más interesa al propietario.
- Grupos guardados con nombre («la familia»): no en la primera versión.
- **Nota global de un restaurante** = media de las notas globales de las personas seleccionadas que lo han puntuado. Cada persona pesa lo mismo, haya puntuado seis criterios o tres.
- **Nota de un criterio** (barras, roseta, filtro por criterio) = media de las personas seleccionadas que han puntuado ese criterio.
- Por eso la nota global no siempre coincide con la media de las seis barras. Es lo esperable y se explica con un texto pequeño en la ficha.
- Un restaurante que nadie de la selección ha puntuado aparece con pin gris «Sin nota». El filtro de nota mínima lo deja fuera.
- El color y el texto (Excelente, Muy bueno…) siguen la tabla de la sección 4 de la especificación, aplicada a la media.

## 5. Cambios en las pantallas

La base sigue siendo la demo. Solo cambian estas piezas:

### Barra superior y filtros

- Un chip fijo **«Nota de: Todos»** junto al buscador. Al tocarlo se abre el selector con la lista de personas.
- Los filtros, el contador «N de M» y la leyenda del mapa funcionan igual, sobre la media de la selección.

### Mapa

- El pin muestra la media de la selección. Sin cambios visuales.
- La tarjeta resumen añade «3 opiniones».

### Lista

- La tarjeta muestra la media, el número de opiniones y, si lo has puntuado, **tu nota** en pequeño.
- Plato estrella: el tuyo si has puntuado; si no, el de la opinión más reciente.
- Fecha: la de la visita más reciente de la selección.
- Orden por nota, por fecha o por nombre, como ahora.

### Ficha

De arriba abajo:

1. Datos comunes. Los editores ven **Editar datos**.
2. Nota grande (media de la selección) con su texto y «Media de N personas».
3. Seis barras con la media por criterio.
4. **Roseta con dos líneas:** la media (en el color de su nota) y la tuya (discontinua, en gris oscuro). Pequeña leyenda debajo. Si no has puntuado, o si la selección eres solo tú, una sola línea.
5. **Tu puntuación:** si no has puntuado, botón **Puntuar este restaurante**. Si ya lo has hecho, tu nota y **Editar mi puntuación**.
6. **Opiniones:** una tarjeta por persona con nombre, nota global, fecha, plato estrella, reseña y fotos. Al tocarla se ven sus seis notas.
7. Ver en el mapa. Borrar, para quien tenga permiso.

### Añadir (solo editores)

- La pestaña **Añadir** solo aparece a los editores.
- El formulario es el de la demo: datos comunes, ubicación y, en la misma pantalla, tu puntuación (opcional).
- Si ya existe un restaurante con el mismo nombre (sin acentos ni mayúsculas), avisa antes de guardar para evitar duplicados.

### Puntuar (todos)

- Desde la ficha. Es la parte de valoración del formulario de la demo: fecha de visita, seis notas con plato estrella, reseña y fotos.

### Perfil

- Accesible desde la barra superior: nombre visible, cerrar sesión y, para miembros, **Solicitar ser editor**.

### Accesos (solo propietario, paso 4)

- Lista de personas con su papel. Añadir por correo, cambiar papel y quitar.
- Solicitudes pendientes con Aprobar como miembro, Aprobar como editor y Rechazar.

## 6. Modelo de datos (Firestore)

Los nombres de campo son orientativos.

| Documento | Contenido | Quién escribe |
|---|---|---|
| `config/access` | `owner` (correo), `editors` y `members` (listas de correos) | Solo el propietario |
| `users/{uid}` | `displayName`, `email` | Cada uno el suyo |
| `restaurants/{id}` | `name`, `locality`, `location`, `cuisines`, `price`, `placeId`, `source`, `createdBy`, `createdAt`, `updatedBy`, `updatedAt` | Editores |
| `restaurants/{id}/ratings/{uid}` | `scores`, `global`, `dish`, `review`, `visitDate`, `photos`, `createdAt`, `updatedAt` | Solo su autor |
| `accessRequests/{uid}` | `email`, `displayName`, `type` (acceso o editor), `status`, `createdAt` | Lo crea el solicitante; lo resuelve el propietario |

- La puntuación usa el identificador del usuario como clave, así que cada persona tiene como máximo una por restaurante.
- `global` se guarda en cada puntuación para no recalcularla. Las medias se calculan en el dispositivo.
- Fotos en Storage: `restaurants/{id}/{uid}/`, como ya dice la sección 9 de la especificación.

### Lecturas estimadas

Cálculo aproximado, sin comprobar en la práctica: 100 restaurantes con unas 3 opiniones cada uno son unos 400 documentos por carga completa. Con 20 cargas al día, 8.000 lecturas, lejos de las 50.000 gratuitas. La caché del dispositivo reduce más la cifra. Medirlo en el paso 2.

## 7. Reglas de seguridad (resumen)

- Leer cualquier cosa: solo correos de las listas, con correo verificado.
- `restaurants`: crear y editar, editores. Borrar, el propietario; un editor solo si no hay opiniones de otras personas (D2).
- `ratings/{uid}`: solo si `uid` es el del usuario y está en las listas. Se validan notas, longitudes y fechas.
- `config/access`: solo el propietario.
- `accessRequests/{uid}`: cualquiera con sesión crea la suya; solo el propietario la lee entera y la resuelve.
- Storage: lo de la sección 9 de la especificación, con la carpeta por persona.

## 8. Efecto en el orden de construcción

- **Paso 2 (prueba técnica):** igual, pero la ficha de prueba se guarda ya con el modelo nuevo (restaurante y una puntuación).
- **Antes del paso 3:** Claude actualiza la demo con las piezas nuevas (chip «Nota de», ficha con opiniones, roseta de dos líneas, puntuar, perfil, pantalla sin acceso) y datos inventados de tres personas. El propietario la revisa y la aprueba.
- **Paso 3:** se porta la demo actualizada.
- **Paso 4 (compartir):** pantalla de accesos y solicitudes.

## 9. Decisiones

Aprobadas por el propietario el 23 de noviembre de 2026 tal como las propuso Claude.

| | Pregunta | Decisión |
|---|---|---|
| D1 | ¿Sigue existiendo alguien que solo mira, sin puntuar? | No. Todo invitado puede puntuar; si no quiere, no puntúa. |
| D2 | ¿Quién puede borrar un restaurante, con todas las opiniones y fotos de todos? | Solo el propietario. Un editor puede borrarlo si solo tiene su propia opinión. |
| D3 | Cuando alguien sale del grupo, ¿qué pasa con sus opiniones? | Se quedan, con su nombre. El propietario puede borrarlas. |
| D4 | ¿Pueden los miembros proponer restaurantes nuevos para que un editor los apruebe? | No en la primera versión. Lo piden por fuera o solicitan ser editores. |
| D5 | Nota global: ¿media de las notas globales de cada persona o media de las barras? | Media de las notas globales: cada persona pesa lo mismo. |

## 10. Fuera de esta propuesta

Ideas que podrían venir después y que no se incluyen sin acordarlas: filtro «Pendientes de puntuar por mí», comentarios sobre opiniones ajenas, avisos por correo, varias visitas por persona.

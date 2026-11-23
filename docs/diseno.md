# Diseño vigente: dos personas puntúan, los amigos miran

Acordado con el propietario el 23 de noviembre de 2026, al aprobar la demo y antes de empezar el paso 3. Sustituye a la propuesta del «cuaderno común» (todos puntúan), que queda en el historial de git. Donde este documento choque con `especificacion.md`, manda este documento.

Los cambios se aplican directamente en la app real del paso 3: la demo no se vuelve a actualizar. El propietario quiere ajustar detalles visuales después de ver la app terminada.

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
| Nombre, localidad, posición, tipos de cocina, precio | Seis notas |
| **Fecha de visita** (una sola) | **Plato estrella**: nombre y nota propios |
| **Texto largo tipo blog** (uno por restaurante) | |
| **Fotos, cada una con su pie de foto** | |

Desaparecen las reseñas de cada persona.

## 3. Nota que se ve

- **Selector de nota** (mapa, lista, filtros y orden): **Media** (por defecto), **Azul** o **Rosa**, con los nombres de las personas. Se guarda en el dispositivo.
- La media es la media de las notas globales de quienes han puntuado. Si solo ha puntuado uno, la media es su nota.
- Pines y tarjetas siguen coloreados por la nota, con la tabla de la especificación (sección 4).

## 4. Ficha

De arriba abajo:

1. Nombre. **Etiquetas tocables** de localidad, tipos de cocina y precio: al tocar una, se abre el mapa con ese filtro puesto **sustituyendo** los filtros que hubiera. Fecha de visita.
2. Nota grande (la del selector) con su texto (Excelente, Muy bueno…).
3. **Barras por criterio, dos por criterio: azul y rosa**, cada una con su valor. En el plato estrella, cada persona con su estrella en su color, el nombre de su plato y su nota.
4. **Nota media de cada uno**, en su color.
5. **Roseta con dos líneas**, azul y rosa, con leyenda.
6. **Texto largo** del restaurante.
7. **Fotos al final**, cada una con su pie. Al tocarla se amplía con el pie debajo.
8. Acciones: ver en el mapa; puntuar o editar mi nota (quien puntúa); editar datos, texto y fotos (editores); borrar (propietario).

## 5. Buscar el restaurante para ubicarlo

Decidido el 23 de noviembre de 2026. Adelanta al paso 3 una parte del buscador de Places previsto para el paso 6.

- Al añadir, un buscador de Google (autocompletado básico del Places UI Kit) devuelve solo el identificador del sitio. Con él se piden sus coordenadas y el mapa del formulario **salta a ese sitio**.
- **El pin lo pone el usuario** tocando el mapa y **el nombre lo escribe él**. Se guardan su pin, su nombre y el identificador de Google (`placeId`, `source: places`).
- Motivo, según la documentación de Google comprobada el 23 de noviembre de 2026: el nombre y la dirección de Places no se pueden guardar; las coordenadas, solo 30 días; el identificador, indefinidamente. En el EEE, el contenido de Places no se puede mostrar junto a un mapa, salvo coordenadas e identificador; el Places UI Kit está exento. Rellenar nombre y pin automáticamente no estaría permitido.
- Coste: dentro de los cupos gratuitos (unas 10.000 búsquedas al mes). Hay que activar «Places UI Kit» y «Places API (New)» y añadirlas a la clave. Volver a comprobar precios y nombres de las API al implementarlo.
- En la demo, el buscador está simulado con sitios inventados.

Fuentes: https://developers.google.com/maps/documentation/places/web-service/policies · https://developers.google.com/maps/comms/eea/places · https://developers.google.com/maps/documentation/javascript/places-ui-kit/basic-autocomplete · https://developers.google.com/maps/billing-and-pricing/pricing

## 6. Modelo de datos (Firestore)

| Documento | Contenido | Quién escribe |
|---|---|---|
| `members/{correo}` | `role`: `owner`, `editor` o `viewer`. `color`: `azul`, `rosa` o ninguno | Propietarios |
| `users/{uid}` | `displayName`, `color` (debe coincidir con el de `members`), `updatedAt` | Cada uno el suyo |
| `restaurants/{id}` | `name`, `locality`, `location`, `cuisines`, `price`, `visitDate`, `blog`, `photos` (lista de `{full, thumb, caption}`), `placeId`, `source`, `createdBy`, `createdAt`, `updatedBy`, `updatedAt` | Editores |
| `restaurants/{id}/ratings/{uid}` | `scores`, `global`, `dish`, `updatedAt` | Solo su autor, si tiene color |
| `accessRequests/{uid}` | `email`, `displayName`, `status`, `createdAt` | El solicitante la crea; los propietarios la resuelven |

Fotos en Storage: `restaurants/{id}/{archivo}`. Suben y borran los editores; ven todos los invitados.

## 7. Orden de trabajo

Primero se actualiza la demo con este diseño y el propietario la revisa. Después se construye la app real (paso 3) y se publica en el repo.

### Paso 3, en cuatro partes

| Parte | Contenido |
|---|---|
| 3a · Base | Archivos, entrar con Google, nombre visible la primera vez, pantalla sin acceso, conexión a Firebase con long polling |
| 3b · Lista y ficha | Datos en tiempo real, selector de nota, ficha nueva, roseta azul y rosa, etiquetas tocables |
| 3c · Mapa | Google Maps con pines de nota, agrupación y tarjeta resumen |
| 3d · Editar | Alta y edición de datos, buscador para ubicar (sección 5), puntuar, texto largo, fotos con pie, «usar mi ubicación», localidad con sugerencias, borrar |

Tareas del propietario: crear un Map ID en Google Cloud (verificar antes que es gratuito), publicar las reglas nuevas, poner `color` en los dos documentos de `members` y borrar las fichas de prueba.

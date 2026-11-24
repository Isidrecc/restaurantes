# Cómo dar y quitar permisos

Desde el 24 de noviembre de 2026 la app se ve sin entrar, en solo lectura. Los permisos solo hacen falta para **añadir, editar y puntuar**, y se gestionan en la consola de Firebase. La pantalla de accesos de la app (paso 4) se descartó ese mismo día: con tan poca gente, la consola basta.

## Lo que hay que saber

- Cada persona con permiso tiene un documento en la colección `members`. **El ID del documento es su correo de Google en minúsculas.**
- El documento lleva estos campos, los dos de tipo texto (`string`):

| Campo | Valores | Para qué |
|---|---|---|
| `role` | `owner` o `editor` | Propietario o editor (`docs/diseno.md`, sección 1). El antiguo `viewer` ya no hace falta: para mirar no se necesita entrar |
| `color` | `azul` o `rosa` | Solo quien puntúa. Cada color, una sola persona |

- **La consola no comprueba nada.** Un correo con mayúsculas, `Editor` en vez de `editor` o un color mal escrito dejan a la persona sin acceso o sin poder puntuar, y la app no dice por qué. Si alguien no puede entrar, lo primero es revisar el documento letra a letra.
- La lista de quién puntúa no sale de `members`, sale de `users`: cada persona guarda allí su nombre y su color al abrir la app.

## Dar permiso

1. Abre https://console.firebase.google.com y entra en el proyecto **puntuam-a-taula**.
2. En el menú de la izquierda, **Firestore Database** y la pestaña **Datos**.
3. Toca la colección **members** y después **Añadir documento**.
4. En **ID del documento**, escribe el correo en minúsculas.
5. Añade el campo `role`, tipo `string`, con `editor` u `owner`.
6. Si la persona puntúa, añade el campo `color`, tipo `string`, con `azul` o `rosa`.
7. **Guardar.** Podrá editar la próxima vez que abra la app y entre con Google.

Los nombres de los botones pueden cambiar con las versiones de la consola.

Quien entra con Google sin tener permiso lo ve todo igual; su perfil le dice que no puede añadir ni puntuar. Las solicitudes de acceso que había antes (colección `accessRequests`) ya no se usan: si queda alguna, se puede borrar.

## Cambiar el papel o el color

- Cambia el campo en su documento de `members`.
- El color también está copiado en `users` y se pone al día solo la próxima vez que la persona abra la app.

## Quitar el permiso

1. Borra su documento en `members`.
2. Si puntuaba, borra también su documento en `users` (búscalo por el campo `displayName`). Si no, seguiría saliendo en las notas y en el selector «Nota de».
3. Sus notas quedan guardadas en los restaurantes, pero la app deja de mostrarlas y de contarlas en las medias.

## Cuidado

- No borres ni cambies tu propio documento de `members`: te quedarías sin poder editar. La consola seguiría funcionando y podrías volver a crearlo.
- Las reglas de seguridad (`firestore.rules`) también dejan escribir en `members` a los propietarios desde la app, aunque la app no tiene ninguna pantalla que lo haga.

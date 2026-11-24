# Cómo se publica la web

Desde el 24 de noviembre de 2026, GitHub Pages publica lo que monta un flujo de GitHub Actions, no la rama `main` tal cual. Se hizo para que al compartir una ficha (en WhatsApp, por ejemplo) salga su portada en la vista previa.

## Qué hace

El flujo `.github/workflows/pages.yml` ejecuta `tools/build-site.mjs`, que:

1. Copia la app: `index.html`, `manifest.webmanifest`, `app/`, `icons/` y `demo/`. Lo demás del repo (`docs/`, reglas, herramientas) ya no se publica.
2. Pone la versión del commit (`?v=…`) a los archivos de la app y a sus importaciones, para que el navegador no siga con los de la publicación anterior.
3. Lee de Firestore, sin clave ni sesión, los restaurantes, las notas y los nombres de quien puntúa, y crea `f/<id>/index.html` por restaurante con la vista previa (nombre; nota, localidad, cocinas y precio; la portada) y una redirección inmediata a la ficha (`?r=id`).
4. Crea `404.html`: un enlace `f/<id>/` de una ficha que aún no tiene página lleva igualmente a la ficha.

«Comparteix» en la app publicada comparte `https://isidrecc.github.io/restaurantes/f/<id>/`.

## Cuándo se publica

- Con cada cambio que se sube a `main`.
- Cada 30 minutos, para que las fichas nuevas o cambiadas tengan su página. GitHub no garantiza la puntualidad de estas ejecuciones y, según su documentación, las desactiva si el repo pasa 60 días sin cambios.
- A mano: en GitHub, pestaña **Actions** → «Publica la web» → **Run workflow**.

Si una ejecución falla (por ejemplo, porque Firestore no responde), sigue publicada la anterior.

## Limitaciones

- Una ficha recién creada no tiene página hasta la siguiente ejecución (hasta unos 30 minutos). Su enlace funciona igual, pero la vista previa sale sin foto.
- WhatsApp guarda la vista previa de cada enlace: si se compartió antes de que existiera la página, puede seguir saliendo sin foto. No se ha comprobado cuánto tiempo la guarda.
- La imagen es la miniatura de la portada (400 px, unos 60 KB): las vistas previas no cargan imágenes pesadas. Sin fotos, sale el icono de la app.
- Cada montaje lee todos los restaurantes, notas y nombres (unos 300 documentos con 100 restaurantes). Con dos montajes por hora son unas 14.400 lecturas al día, dentro de las 50.000 gratuitas de Firestore.
- El HTML de la app (`index.html`) lo sigue guardando el navegador unos minutos tras publicar; los demás archivos ya cambian de nombre con cada versión.

## Probarlo en local

```
node tools/build-site.mjs
```

Deja la web montada en `_site/` (no se sube al repo).

## Ajuste de GitHub Pages

En el repo: **Settings** → **Pages** → **Build and deployment** → **Source: GitHub Actions**. Cambiado por el propietario el 24 de noviembre de 2026. Antes estaba en «Deploy from a branch» (`main`, raíz). Hay que cambiarlo antes de subir el flujo: si no, los enlaces `f/<id>/` no existen en la web publicada desde la rama.

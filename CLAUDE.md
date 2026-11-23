# Cuaderno de restaurantes

App web personal para puntuar y reseñar restaurantes: mapa, lista con filtros y una ficha por restaurante. Se servirá desde este repo con GitHub Pages.

## Estado

- La fase de diseño se cerró en una conversación previa (21 a 23 de noviembre de 2026). La app real todavía no existe: este repo contiene solo la especificación y la demo de UI.
- Siguiente paso: el punto 1 del orden de construcción (`docs/especificacion.md`, sección 6).
- Hay dos puntos sin confirmación explícita del propietario (sección 3 de la especificación). Confirmarlos antes de construir.

## Qué leer antes de tocar nada

1. `docs/especificacion.md`: decisiones tomadas, pendientes de confirmar, pantallas, modelo de datos, orden de construcción y condiciones de Google.
2. `demo/index.html`: prototipo aprobado. Es la referencia exacta de pantallas, textos y comportamiento. Se abre directamente en un navegador.

## Cómo trabajar con el propietario

- Idioma: español.
- Antes de construir, estructurar el trabajo y acordar el enfoque con él. Unas preguntas de opción múltiple no equivalen a aprobar el enfoque.
- Enseñarle el resultado al final de cada paso del orden de construcción y esperar su visto bueno antes del siguiente.
- Respuestas concisas y estructuradas, con lo crítico primero.
- Redacción llana, sin frases hechas. No usar rayas ni guiones a modo de raya.
- Si algo no se ha comprobado, decirlo. No dar por buenos precios ni condiciones de servicios externos sin verificarlos en la documentación oficial.
- Los pasos que haga él en consolas externas (Google Cloud, Firebase, GitHub) se guían uno a uno.

## Reglas del proyecto

- No añadir funciones que no estén en la especificación sin proponerlas antes.
- La UI no se rediseña: se porta la de la demo. Cualquier cambio visual se consulta.
- El repo es público. No subir datos de restaurantes, fotos, correos de usuarios ni credenciales privadas.
- La configuración web de Firebase y la clave de Google Maps sí van en el código, porque son identificadores públicos. Deben estar protegidas: clave limitada al dominio de GitHub Pages y a las API necesarias, y datos cerrados por reglas de seguridad.
- Textos de la interfaz en español. Decimales con coma (8,5).
- Mensajes de commit en español, con una línea de resumen en imperativo.

## Propuesta técnica (a confirmar con el propietario antes de empezar)

- HTML, CSS y JavaScript sin framework ni paso de compilación, con módulos ES. La demo ya está hecha así y GitHub Pages lo sirve tal cual.
- Firebase (Auth con Google, Firestore y Storage) con el SDK modular.
- Google Maps JavaScript API para el mapa. La demo usa Leaflet con una base esquemática solo porque se hizo dentro de un artefacto que bloquea mapas externos.
- PWA instalable en iPhone.

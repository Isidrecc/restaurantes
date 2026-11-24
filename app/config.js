// Identificadores públicos del proyecto (docs/especificacion.md, sección 10).
// No son secretos: la seguridad la ponen las reglas de Firebase y las restricciones de la clave del mapa.

export const firebaseConfig = {
  apiKey: 'AIzaSyAuuYMP5wyLNBIWM9p_BHngih1YnwA3kYk',
  authDomain: 'puntuam-a-taula.firebaseapp.com',
  projectId: 'puntuam-a-taula',
  storageBucket: 'puntuam-a-taula.firebasestorage.app',
  messagingSenderId: '1052734827532',
  appId: '1:1052734827532:web:0af35c48cc58ab17975229'
};

export const MAPS_KEY = 'AIzaSyC1tU3zrYHXj7WsXPDbgbxz5kAdaHh9GP8';

// Map ID de Google Maps. «DEMO_MAP_ID» solo sirve para probar; se sustituye por el del proyecto.
export const MAP_ID = 'DEMO_MAP_ID';

export const FIREBASE_VERSION = '13.4.0';

export const CRITERIA = [
  { k: 'producto', label: 'Calidad del producto', short: 'Producto' },
  { k: 'plato', label: 'Plato estrella', short: 'Plato estrella' },
  { k: 'tecnica', label: 'Técnica y creatividad', short: 'Técnica' },
  { k: 'servicio', label: 'Servicio', short: 'Servicio' },
  { k: 'precio', label: 'Calidad/precio', short: 'Calidad/precio' },
  { k: 'ambiente', label: 'Ambiente', short: 'Ambiente' }
];

// Tipos de cocina de partida. Los que se añadan desde el formulario salen de los restaurantes guardados.
export const CUISINES = ['Autor', 'Japonés', 'Nikkei', 'Chino', 'Menú degustación', 'Menú mediodía', 'Mallorquín', 'Asiático', 'Italiano', 'Brasa', 'Arroces'];
// Precio por persona, sin bebida. Se guarda como 1 a 4.
export const PRICES = ['<20\u00a0€', '20-50\u00a0€', '50-100\u00a0€', '>100\u00a0€'];

// Colores de quien puntúa. El orden decide quién va primero en barras y leyendas.
export const COLORS = ['azul', 'rosa'];

// Centro y zoom por defecto: Mallorca.
export const HOME = { center: { lat: 39.62, lng: 2.98 }, zoom: 9 };

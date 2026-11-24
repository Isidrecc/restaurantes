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

// Map ID de Google Maps «Puntuam a taula», con los estilos «Lavanda» (claro) y «Noche» (oscuro)
// asociados en Google Cloud (docs/diseno.md, sección 8). Es un identificador público.
export const MAP_ID = 'ef2c6b7a22cee90b3aee6ac8';

export const FIREBASE_VERSION = '13.4.0';

export const CRITERIA = [
  { k: 'producto', label: 'Qualitat del producte', short: 'Producte' },
  { k: 'plato', label: 'Plat estrella', short: 'Plat estrella' },
  { k: 'tecnica', label: 'Tècnica i creativitat', short: 'Tècnica' },
  { k: 'servicio', label: 'Servei', short: 'Servei' },
  { k: 'precio', label: 'Qualitat/preu', short: 'Qualitat/preu' },
  { k: 'ambiente', label: 'Ambient', short: 'Ambient' }
];

// Tipos de cocina de partida. Los que se añadan desde el formulario salen de los restaurantes guardados.
export const CUISINES = ['Autor', 'Japonès', 'Nikkei', 'Xinès', 'Menú degustació', 'Menú de migdia', 'Mallorquí', 'Asiàtic', 'Italià', 'Brasa', 'Arrossos'];
// Noms antics en castellà: es mostren i es tornen a desar amb el nom en català.
export const CUISINE_RENAMES = {
  'Japonés': 'Japonès', 'Japonesa': 'Japonès', 'Chino': 'Xinès', 'Menú degustación': 'Menú degustació',
  'Menú mediodía': 'Menú de migdia', 'Mallorquín': 'Mallorquí', 'Mallorquina': 'Mallorquí', 'Asiático': 'Asiàtic',
  'Italiano': 'Italià', 'Italiana': 'Italià', 'Arroces': 'Arrossos', 'De autor': 'Autor', 'Mediterránea': 'Mediterrània',
  'Pescado y marisco': 'Peix i marisc', 'Tapas': 'Tapes', 'Otra': 'Altres'
};
// Nom de cada color per mostrar-lo.
export const COLOR_NAMES = { azul: 'blau', rosa: 'rosa' };
// Precio por persona, sin bebida. Se guarda como 1 a 4.
export const PRICES = ['<20\u00a0€', '20-50\u00a0€', '50-100\u00a0€', '>100\u00a0€'];

// Colores de quien puntúa. El orden decide quién va primero en barras y leyendas.
export const COLORS = ['azul', 'rosa'];

// Centro y zoom por defecto: Mallorca.
export const HOME = { center: { lat: 39.62, lng: 2.98 }, zoom: 9 };

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

// Map ID de Google Maps «Puntuam a taula», con los estilos «Terracota» (claro) y «Terracota nit» (oscuro)
// asociados en Google Cloud (docs/diseno.md, sección 8). Es un identificador público.
export const MAP_ID = 'ef2c6b7a22cee90b3aee6ac8';

export const FIREBASE_VERSION = '13.4.0';

// mini: nom curt per a la roseta petita del formulari, al costat de la nota.
export const CRITERIA = [
  { k: 'producto', label: 'Qualitat del producte', short: 'Producte', mini: 'Producte' },
  { k: 'plato', label: 'Plat estrella', short: 'Plat estrella', mini: 'Plat' },
  { k: 'tecnica', label: 'Tècnica i creativitat', short: 'Tècnica', mini: 'Tècnica' },
  { k: 'servicio', label: 'Servei', short: 'Servei', mini: 'Servei' },
  { k: 'precio', label: 'Qualitat/preu', short: 'Qualitat/preu', mini: 'Q/preu' },
  { k: 'ambiente', label: 'Ambient', short: 'Ambient', mini: 'Ambient' }
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
// Nom de cada color per mostrar-lo. «azul» i «rosa» són els noms que guarda l'app (members i users); des del
// 24 de novembre de 2026 es veuen en tinta i turquesa (docs/diseno.md, secció 7).
export const COLOR_NAMES = { azul: 'tinta', rosa: 'turquesa' };
// Precio por persona, sin bebida. Se guarda como 1 a 5. Cinco tramos desde el 24 de noviembre de 2026; antes eran
// cuatro (<20, 20-50, 50-100 y >100): los códigos se mantienen y los restaurantes guardados con 2 pasan a 20-40.
export const PRICES = ['<20 €', '20-40 €', '40-60 €', '60-100 €', '>100 €'];
// Tramos de la recomendación de la página de inicio («per menys de 40 €»): <20 y 20-40.
export const CHEAP_PRICES = PRICES.slice(0, 2);

// Otros locales de una ficha, además del principal (docs/diseno.md, sección 2; 25 de noviembre de 2026).
// El tope lo fijan también las reglas de Firestore.
export const MAX_BRANCHES = 3;

// Colores de quien puntúa. El orden decide quién va primero en barras y leyendas.
export const COLORS = ['azul', 'rosa'];

// Centro y zoom por defecto: el centro de Palma, como en la captura que mandó el propietario el 25 de noviembre
// de 2026 (de Bons Aires y L'Olivera al mar). Calculado con los pines que se veían en ella. El mapa vectorial
// acepta zoom con decimales. Antes: Palma entera con zoom 13 (24 de noviembre) y, al principio, toda Mallorca.
export const HOME = { center: { lat: 39.5725, lng: 2.6528 }, zoom: 14.3 };

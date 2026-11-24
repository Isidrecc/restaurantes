// Google Maps: mapa principal con pines de nota y agrupación, mapa para situar el pin
// y buscador del Places UI Kit (docs/diseno.md, sección 5).
import { MAPS_KEY, MAP_ID, HOME } from './config.js';

let loading = null;

// Cargador dinámico oficial de Google Maps (importLibrary), versión mínima.
function bootstrap() {
  if (window.google && window.google.maps && window.google.maps.importLibrary) return Promise.resolve();
  return new Promise((resolve, reject) => {
    window.__gmReady = resolve;
    window.gm_authFailure = () => console.error('Google Maps ha rebutjat la clau');
    const s = document.createElement('script');
    const params = new URLSearchParams({ key: MAPS_KEY, v: 'weekly', language: 'ca', region: 'ES', loading: 'async', callback: '__gmReady' });
    s.src = 'https://maps.googleapis.com/maps/api/js?' + params.toString();
    s.async = true;
    s.onerror = () => reject(new Error('No s’ha pogut carregar Google Maps'));
    document.head.appendChild(s);
  });
}

function loadClusterer() {
  if (window.markerClusterer) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/@googlemaps/markerclusterer@2.6.2/dist/index.min.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('No s’ha pogut carregar l’agrupació de pins'));
    document.head.appendChild(s);
  });
}

export function loadMaps() {
  if (!loading) {
    loading = (async () => {
      await bootstrap();
      const [{ Map }, { AdvancedMarkerElement }, { ColorScheme }] = await Promise.all([
        google.maps.importLibrary('maps'),
        google.maps.importLibrary('marker'),
        google.maps.importLibrary('core')
      ]);
      await loadClusterer();
      // El mapa sigue el modo claro u oscuro del sistema: «Lavanda» o «Noche». Solo se fija al crearlo.
      const options = { ...BASE_OPTIONS, colorScheme: ColorScheme.FOLLOW_SYSTEM };
      return { Map, AdvancedMarkerElement, options };
    })();
    loading.catch(() => { loading = null; });
  }
  return loading;
}

const BASE_OPTIONS = {
  mapId: MAP_ID,
  center: HOME.center,
  zoom: HOME.zoom,
  disableDefaultUI: true,
  zoomControl: true,
  clickableIcons: false,
  gestureHandling: 'greedy'
};

function pinElement(text, klass) {
  const wrap = document.createElement('div');
  wrap.className = 'gpin';
  wrap.innerHTML = '<div class="pin ' + klass + '"><span></span></div>';
  wrap.querySelector('span').textContent = text;
  return wrap;
}

// ---------- Mapa principal ----------

export async function createMainMap(el, { onMapClick }) {
  const { Map, AdvancedMarkerElement, options } = await loadMaps();
  // Botones de zoom a media altura: abajo los taparía el menú flotante.
  const map = new Map(el, { ...options, zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER } });
  map.addListener('click', () => onMapClick && onMapClick());
  const markers = new globalThis.Map();
  const clusterer = new window.markerClusterer.MarkerClusterer({
    map,
    markers: [],
    renderer: {
      render: (cluster) => {
        const div = document.createElement('div');
        div.className = 'cluster gcluster';
        div.innerHTML = '<span></span>';
        div.querySelector('span').textContent = String(cluster.count);
        return new AdvancedMarkerElement({ position: cluster.position, content: div, zIndex: 2000 + cluster.count });
      }
    }
  });

  // items: [{ id, lat, lng, text, klass, title, selected }]
  function setMarkers(items, onSelect) {
    clusterer.clearMarkers();
    markers.forEach((m) => { m.map = null; });
    markers.clear();
    const list = items.filter((x) => x.lat != null && x.lng != null).map((x) => {
      const m = new AdvancedMarkerElement({
        position: { lat: x.lat, lng: x.lng },
        content: pinElement(x.text, x.klass + (x.selected ? ' is-selected' : '')),
        title: x.title,
        gmpClickable: true,
        zIndex: x.selected ? 1000 : 0
      });
      m.addEventListener('gmp-click', () => onSelect(x.id));
      markers.set(x.id, m);
      return m;
    });
    clusterer.addMarkers(list);
  }

  // Centra un punto dejando sitio abajo para la tarjeta resumen.
  function focus(lat, lng, minZoom, bottomPad) {
    if (minZoom && map.getZoom() < minZoom) map.setZoom(minZoom);
    map.setCenter({ lat, lng });
    if (bottomPad) map.panBy(0, bottomPad / 2);
  }

  return { map, setMarkers, focus };
}

// ---------- Mapa para situar el pin ----------

export async function createPickMap(el, { onPick }) {
  const { Map, AdvancedMarkerElement, options } = await loadMaps();
  const map = new Map(el, options);
  let marker = null;

  function setPin(lat, lng) {
    if (!marker) {
      marker = new AdvancedMarkerElement({ map, position: { lat, lng }, content: pinElement('', 'pin-new'), gmpDraggable: true, title: 'Ubicació del restaurant' });
      marker.addListener('dragend', () => {
        const p = marker.position;
        onPick(typeof p.lat === 'function' ? p.lat() : p.lat, typeof p.lng === 'function' ? p.lng() : p.lng);
      });
    } else {
      marker.position = { lat, lng };
      marker.map = map;
    }
  }
  function clearPin() { if (marker) marker.map = null; }

  // Marca el sitio elegido en el buscador. Los toques lo atraviesan y llegan al mapa,
  // así que el pin lo pone el usuario donde toca (no se guardan coordenadas de Google).
  let place = null;
  function showPlace(lat, lng) {
    if (!place) {
      const ring = document.createElement('div');
      ring.className = 'gplace';
      ring.style.pointerEvents = 'none';
      place = new AdvancedMarkerElement({ position: { lat, lng }, content: ring, zIndex: -1 });
      place.style.pointerEvents = 'none';
    } else {
      place.position = { lat, lng };
    }
    place.map = map;
  }
  function hidePlace() { if (place) place.map = null; }

  map.addListener('click', (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setPin(lat, lng);
    onPick(lat, lng);
  });

  return {
    map,
    setPin,
    clearPin,
    showPlace,
    hidePlace,
    center(lat, lng, zoom) { map.setCenter({ lat, lng }); if (zoom) map.setZoom(zoom); },
    home() { map.setCenter(HOME.center); map.setZoom(HOME.zoom); }
  };
}

// ---------- Buscador de Google (Places UI Kit) ----------
// Al elegir un sitio se piden sus coordenadas, su nombre y su dirección (categoría Pro).
// Nombre, localidad y dirección se copian al formulario: decisión del propietario del 24 de noviembre de 2026,
// aunque las condiciones de Google no permiten guardarlos (docs/diseno.md, sección 5).
// Las coordenadas solo sirven para llevar el mapa allí; el pin lo pone el usuario.

// Localidad de la dirección: el pueblo o ciudad (no la provincia). Places (New) da longText; Geocoder, long_name.
function localityOf(components) {
  const order = ['locality', 'postal_town', 'administrative_area_level_4', 'administrative_area_level_3'];
  for (const type of order) {
    const c = (components || []).find((x) => (x.types || []).includes(type));
    const name = c && (c.longText || c.long_name);
    if (name) return name;
  }
  return '';
}

// Crea una casilla de búsqueda nueva y vacía; quien la llama decide dónde ponerla.
export async function createPlaceSearch({ getBias, onPlace, onError }) {
  await loadMaps();
  const { BasicPlaceAutocompleteElement, Place } = await google.maps.importLibrary('places');
  const el = new BasicPlaceAutocompleteElement({ requestedLanguage: 'ca', placeholder: 'Nom del restaurant' });
  el.addEventListener('gmp-select', async (event) => {
    try {
      const id = event.place.id;
      const place = new Place({ id });
      await place.fetchFields({ fields: ['location', 'displayName', 'addressComponents', 'formattedAddress'] });
      onPlace({
        id,
        lat: place.location.lat(),
        lng: place.location.lng(),
        name: (place.displayName || '').trim().slice(0, 80),
        locality: localityOf(place.addressComponents).slice(0, 60),
        address: (place.formattedAddress || '').slice(0, 200)
      });
    } catch (e) { onError && onError(e); }
  });
  // Da prioridad a resultados cerca de donde está el mapa.
  const bias = getBias && getBias();
  if (bias) el.locationBias = bias;
  return el;
}

// ---------- Tarjeta de Google del sitio ----------
// Places UI Kit, Place Details compacto: foto (con galería), nombre, estrellas con número de reseñas, tipo,
// precio, si está abierto y enlace a Google Maps. El UI Kit queda fuera de las restricciones del EEE y cada
// tarjeta creada cuenta una consulta «Places UI Kit Query» (docs/diseno.md, sección 4). Se guarda cada
// tarjeta creada: volver a ponerla en la página no la vuelve a pedir (comprobado el 24 de noviembre de 2026).
const placeCards = new Map();
export async function placeCard(placeId) {
  if (placeCards.has(placeId)) return placeCards.get(placeId);
  const ready = (async () => {
    await loadMaps();
    await google.maps.importLibrary('places');
    const wrap = document.createElement('div');
    // Horizontal y pequeña, para que no destaque: foto pequeña a la izquierda y el texto al lado. Va a todo el
    // ancho de la ficha, sin tarjeta alrededor: con menos ancho, Google quita la foto.
    wrap.innerHTML = '<gmp-place-details-compact orientation="horizontal">' +
      '<gmp-place-details-place-request></gmp-place-details-place-request>' +
      '<gmp-place-content-config>' +
        '<gmp-place-media lightbox-preferred></gmp-place-media><gmp-place-rating></gmp-place-rating>' +
        '<gmp-place-type></gmp-place-type><gmp-place-price></gmp-place-price><gmp-place-open-now-status></gmp-place-open-now-status>' +
        '<gmp-place-attribution light-scheme-color="gray" dark-scheme-color="white"></gmp-place-attribution>' +
      '</gmp-place-content-config></gmp-place-details-compact>';
    const el = wrap.firstElementChild;
    el.querySelector('gmp-place-details-place-request').setAttribute('place', placeId);
    // Se resuelve al cargar o falla (por ejemplo, si se ha llegado al tope diario).
    el.loaded = new Promise((resolve, reject) => {
      el.addEventListener('gmp-load', resolve, { once: true });
      el.addEventListener('gmp-error', reject, { once: true });
    });
    // Si falla, no se guarda: la próxima vez que se abra la ficha se vuelve a intentar.
    el.loaded.catch(() => placeCards.delete(placeId));
    return el;
  })();
  placeCards.set(placeId, ready);
  ready.catch(() => placeCards.delete(placeId));
  return ready;
}

// Enlace a Google Maps (Maps URLs, sin clave ni coste): el sitio de Google si lo hay; si no, el punto.
export function mapsLink(r) {
  const q = r.placeId ? r.name : r.lat + ',' + r.lng;
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q) +
    (r.placeId ? '&query_place_id=' + encodeURIComponent(r.placeId) : '');
}

// ---------- Localidad de un punto (geocodificación inversa) ----------
// Para el pin puesto a mano: Google devuelve la dirección del punto y se saca el pueblo o ciudad.
// Necesita la Geocoding API activada en el proyecto y añadida a la clave (docs/diseno.md, sección 5).
// Si no está o no hay resultado, devuelve '' y la app pide la localidad.
let geocoder = null;
export async function localityAt(lat, lng) {
  await loadMaps();
  if (!geocoder) {
    const { Geocoder } = await google.maps.importLibrary('geocoding');
    geocoder = new Geocoder();
  }
  const { results } = await geocoder.geocode({ location: { lat, lng } });
  for (const r of results || []) {
    const name = localityOf(r.address_components);
    if (name) return name.slice(0, 60);
  }
  return '';
}

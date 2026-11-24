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

// Localidad de la dirección: el pueblo o ciudad (no la provincia).
function localityOf(components) {
  const order = ['locality', 'postal_town', 'administrative_area_level_4', 'administrative_area_level_3'];
  for (const type of order) {
    const c = (components || []).find((x) => x.types.includes(type));
    if (c && c.longText) return c.longText;
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

// Lo escrito en la casilla de Google sin elegir ningún resultado. Google no lo documenta: se prueba con
// la propiedad value y con el campo interno si su shadow DOM está abierto. Si no se puede leer, vacío.
export function searchText(el) {
  if (!el) return '';
  let v = '';
  try {
    if (typeof el.value === 'string') v = el.value;
    else if (el.shadowRoot && el.shadowRoot.querySelector('input')) v = el.shadowRoot.querySelector('input').value;
  } catch (e) { v = ''; }
  return String(v || '').replace(/\s+/g, ' ').trim().slice(0, 80);
}

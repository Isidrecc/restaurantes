// Google Maps: mapa principal con pines de nota y agrupación, mapa para situar el pin
// y buscador del Places UI Kit (docs/diseno.md, sección 5).
import { MAPS_KEY, MAP_ID, HOME } from './config.js';

let loading = null;

// Cargador dinámico oficial de Google Maps (importLibrary), versión mínima.
function bootstrap() {
  if (window.google && window.google.maps && window.google.maps.importLibrary) return Promise.resolve();
  return new Promise((resolve, reject) => {
    window.__gmReady = resolve;
    window.gm_authFailure = () => console.error('Google Maps rechazó la clave');
    const s = document.createElement('script');
    const params = new URLSearchParams({ key: MAPS_KEY, v: 'weekly', language: 'es', region: 'ES', loading: 'async', callback: '__gmReady' });
    s.src = 'https://maps.googleapis.com/maps/api/js?' + params.toString();
    s.async = true;
    s.onerror = () => reject(new Error('No se ha podido cargar Google Maps'));
    document.head.appendChild(s);
  });
}

function loadClusterer() {
  if (window.markerClusterer) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/@googlemaps/markerclusterer@2.6.2/dist/index.min.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('No se ha podido cargar la agrupación de pines'));
    document.head.appendChild(s);
  });
}

export function loadMaps() {
  if (!loading) {
    loading = (async () => {
      await bootstrap();
      const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
        google.maps.importLibrary('maps'),
        google.maps.importLibrary('marker')
      ]);
      await loadClusterer();
      return { Map, AdvancedMarkerElement };
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
  const { Map, AdvancedMarkerElement } = await loadMaps();
  const map = new Map(el, BASE_OPTIONS);
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
  const { Map, AdvancedMarkerElement } = await loadMaps();
  const map = new Map(el, BASE_OPTIONS);
  let marker = null;

  function setPin(lat, lng) {
    if (!marker) {
      marker = new AdvancedMarkerElement({ map, position: { lat, lng }, content: pinElement('', 'pin-new'), gmpDraggable: true, title: 'Ubicación del restaurante' });
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
    center(lat, lng, zoom) { map.setCenter({ lat, lng }); if (zoom) map.setZoom(zoom); },
    home() { map.setCenter(HOME.center); map.setZoom(HOME.zoom); }
  };
}

// ---------- Buscador de Google (Places UI Kit) ----------
// Devuelve solo el identificador del sitio; después se piden sus coordenadas para llevar el mapa allí.
// El nombre y la dirección de Google no se guardan ni se muestran junto al mapa (EEE).

export async function attachPlaceSearch(container, { getBias, onPlace, onError }) {
  await loadMaps();
  const { BasicPlaceAutocompleteElement, Place } = await google.maps.importLibrary('places');
  const el = new BasicPlaceAutocompleteElement({ requestedLanguage: 'es', placeholder: 'Nombre del restaurante' });
  container.innerHTML = '';
  container.appendChild(el);
  el.addEventListener('gmp-select', async (event) => {
    try {
      const id = event.place.id;
      const place = new Place({ id });
      await place.fetchFields({ fields: ['location'] });
      onPlace({ id, lat: place.location.lat(), lng: place.location.lng() });
    } catch (e) { onError && onError(e); }
  });
  // Da prioridad a resultados cerca de donde está el mapa.
  const bias = getBias && getBias();
  if (bias) el.locationBias = bias;
  return el;
}

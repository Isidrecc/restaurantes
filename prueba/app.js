// Prueba técnica del paso 2. Código temporal: se borra al terminar el paso 3.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  signInWithCredential, onAuthStateChanged, signOut
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, memoryLocalCache, doc, collection, getDoc, getDocs,
  setDoc, updateDoc, writeBatch, serverTimestamp, arrayUnion
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js';
import {
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-storage.js';

// Identificadores públicos (docs/especificacion.md, sección 10).
const firebaseConfig = {
  apiKey: 'AIzaSyAuuYMP5wyLNBIWM9p_BHngih1YnwA3kYk',
  authDomain: 'puntuam-a-taula.firebaseapp.com',
  projectId: 'puntuam-a-taula',
  storageBucket: 'puntuam-a-taula.firebasestorage.app',
  messagingSenderId: '1052734827532',
  appId: '1:1052734827532:web:0af35c48cc58ab17975229'
};
const MAPS_KEY = 'AIzaSyC1tU3zrYHXj7WsXPDbgbxz5kAdaHh9GP8';
// ID de cliente web de OAuth. Solo hace falta si fallan las vías A y B.
const GIS_CLIENT_ID = '';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Modo de conexión de Firestore, elegido en la sección 7 de la página.
// auto: caché en el dispositivo y conexión por defecto.
// longpoll: caché en el dispositivo y conexión forzada por «long polling».
// memoria: sin caché en el dispositivo.
const CONN_MODES = ['auto', 'longpoll', 'memoria'];
let connMode = 'auto';
try { connMode = CONN_MODES.includes(localStorage.getItem('connMode')) ? localStorage.getItem('connMode') : 'auto'; } catch { /* sin almacenamiento */ }
const db = initializeFirestore(app,
  connMode === 'memoria' ? { localCache: memoryLocalCache() }
    : connMode === 'longpoll' ? { localCache: persistentLocalCache(), experimentalForceLongPolling: true }
      : { localCache: persistentLocalCache() });
const T_START = performance.now();
const storage = getStorage(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

const $ = (s) => document.querySelector(s);
let user = null;
let role = null;
let reads = 0;
let lastRid = safeGet('lastRid');
let restaurantsCache = [];

// ---------- Utilidades ----------

function safeGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } }

// El registro se guarda en el dispositivo para que sobreviva a cerrar la app.
$('#log').textContent = safeGet('testLog') || '';
function log(msg, kind) {
  const t = new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const line = `[${t}] ${kind === 'bad' ? '✗ ' : kind === 'ok' ? '✓ ' : ''}${msg}`;
  const text = (line + '\n' + $('#log').textContent).split('\n').slice(0, 300).join('\n');
  $('#log').textContent = text;
  safeSet('testLog', text);
  (kind === 'bad' ? console.error : console.log)(line);
}
function fail(what, e) {
  log(`${what}: ${e && (e.code || e.name) || 'error'} · ${e && e.message || e}`, 'bad');
}
function countReads(n) { reads += n; $('#reads').textContent = reads; }
function fmt(n) { return n == null ? 'sin nota' : n.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function globalOf(scores) {
  const v = Object.values(scores).filter((x) => x != null);
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
}
function isStandalone() {
  return window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
}

// ---------- 0. Entorno ----------

$('#env').innerHTML =
  `Dirección: ${location.origin}${location.pathname}<br>` +
  `Instalada (pantalla de inicio): <b>${isStandalone() ? 'sí' : 'no'}</b><br>` +
  `Navegador: ${navigator.userAgent}`;
log(`—— Inicio. Instalada: ${isStandalone() ? 'sí' : 'no'}. Firebase 13.4.0. Conexión: ${connMode}. ——`);

// Mide una consulta y la apunta en el registro si tarda más de 1 segundo.
async function timed(label, promise) {
  const t0 = performance.now();
  const result = await promise;
  const ms = Math.round(performance.now() - t0);
  if (ms > 1000) log(`Lenta: ${label} tardó ${ms} ms (a los ${Math.round((t0 - T_START) / 1000)} s de abrir)`, 'bad');
  return result;
}

// ---------- 1. Entrar ----------

$('#btn-popup').onclick = async () => {
  log('A · Ventana emergente: iniciando…');
  try {
    const r = await signInWithPopup(auth, provider);
    log(`A · Ventana emergente: correcto (${r.user.email})`, 'ok');
  } catch (e) { fail('A · Ventana emergente', e); }
};

$('#btn-redirect').onclick = async () => {
  log('B · Redirección: saliendo a Google…');
  safeSet('pendingRedirect', '1');
  try { await signInWithRedirect(auth, provider); } catch (e) { fail('B · Redirección', e); }
};

getRedirectResult(auth).then((r) => {
  const pending = safeGet('pendingRedirect');
  safeSet('pendingRedirect', '');
  if (r) log(`B · Redirección: correcto (${r.user.email})`, 'ok');
  else if (pending === '1') log('B · Redirección: volvió sin sesión', 'bad');
}).catch((e) => { safeSet('pendingRedirect', ''); fail('B · Redirección', e); });

function setupGis() {
  if (!GIS_CLIENT_ID) {
    $('#gis').innerHTML = '<p class="meta">Sin configurar. Solo se activa si fallan A y B.</p>';
    return;
  }
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client';
  s.async = true;
  s.onload = () => {
    window.google.accounts.id.initialize({
      client_id: GIS_CLIENT_ID,
      ux_mode: 'popup',
      callback: async (resp) => {
        try {
          const r = await signInWithCredential(auth, GoogleAuthProvider.credential(resp.credential));
          log(`C · Google Identity Services: correcto (${r.user.email})`, 'ok');
        } catch (e) { fail('C · Google Identity Services', e); }
      }
    });
    window.google.accounts.id.renderButton($('#gis'), { theme: 'outline', size: 'large', text: 'signin_with', locale: 'es' });
  };
  s.onerror = () => log('C · No se pudo cargar Google Identity Services', 'bad');
  document.head.appendChild(s);
}
setupGis();

$('#btn-out').onclick = async () => {
  try { await signOut(auth); log('Sesión cerrada', 'ok'); } catch (e) { fail('Salir', e); }
};

onAuthStateChanged(auth, async (u) => {
  user = u;
  $('#who').textContent = u ? u.email : 'sin sesión';
  $('#btn-out').disabled = !u;
  $('#btn-name').disabled = !u;
  if (u) {
    log(`Sesión activa: ${u.email} (uid ${u.uid.slice(0, 6)}…)`, 'ok');
    if (!$('#name').value) $('#name').value = (u.displayName || '').split(' ')[0];
    await checkRole();
    // Al abrir con sesión y acceso, carga sola los datos para ver si persisten.
    if (role) await readAll();
  } else {
    role = null;
    showRole();
  }
});

// ---------- 2. Acceso ----------

function showRole() {
  const names = { owner: 'propietario', editor: 'editor', member: 'miembro' };
  $('#role').textContent = !user ? 'desconocido' : role ? names[role] || role : 'sin acceso';
  $('#role').className = 'pill ' + (user ? (role ? 'ok' : 'bad') : '');
  $('#btn-request').hidden = !(user && !role);
  $('#btn-create').disabled = !(role === 'owner' || role === 'editor');
}

async function checkRole() {
  try {
    const snap = await timed('papel', getDoc(doc(db, 'members', user.email.toLowerCase())));
    countReads(1);
    role = snap.exists() ? snap.data().role : null;
    log(role ? `Papel: ${role}` : 'Sin acceso: este correo no está invitado', role ? 'ok' : 'bad');
  } catch (e) { role = null; fail('Comprobar papel', e); }
  showRole();
}

$('#btn-request').onclick = async () => {
  try {
    await setDoc(doc(db, 'accessRequests', user.uid), {
      email: user.email.toLowerCase(),
      displayName: user.displayName || '',
      type: 'access',
      status: 'pending',
      createdAt: serverTimestamp()
    });
    log('Solicitud de acceso enviada', 'ok');
  } catch (e) { fail('Solicitar acceso', e); }
};

$('#btn-name').onclick = async () => {
  const name = $('#name').value.trim();
  if (!name) return log('Escribe un nombre', 'bad');
  try {
    await setDoc(doc(db, 'users', user.uid), { displayName: name, updatedAt: serverTimestamp() });
    log(`Nombre visible guardado: ${name}`, 'ok');
  } catch (e) { fail('Guardar nombre', e); }
};

// ---------- 3. Datos ----------

$('#btn-create').onclick = async () => {
  const uid = user.uid;
  const rRef = doc(collection(db, 'restaurants'));
  const scores = { producto: 8.5, plato: 9, tecnica: 8, servicio: 7.5, precio: 8, ambiente: null };
  const batch = writeBatch(db);
  batch.set(rRef, {
    name: 'Prueba ' + new Date().toLocaleTimeString('es-ES'),
    locality: 'Palma',
    location: { lat: 39.5696, lng: 2.6502 },
    cuisines: ['Mallorquina'],
    price: 2,
    placeId: null,
    source: 'manual',
    raters: [uid],
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedBy: uid,
    updatedAt: serverTimestamp()
  });
  batch.set(doc(rRef, 'ratings', uid), {
    scores,
    global: globalOf(scores),
    dish: 'Arròs brut',
    review: 'Ficha de prueba del paso 2.',
    visitDate: todayISO(),
    photos: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  try {
    await batch.commit();
    lastRid = rRef.id;
    safeSet('lastRid', lastRid);
    log(`Ficha de prueba creada (${rRef.id.slice(0, 6)}…) con tu puntuación`, 'ok');
  } catch (e) { fail('Crear ficha', e); }
};

$('#btn-read').onclick = () => readAll();

// Evita dos lecturas a la vez (duplicaban los pines del mapa).
let readRunning = null;
function readAll() {
  if (!readRunning) readRunning = doReadAll().finally(() => { readRunning = null; });
  return readRunning;
}

async function doReadAll() {
  const t0 = performance.now();
  try {
    const rs = await timed('restaurantes', getDocs(collection(db, 'restaurants')));
    countReads(rs.size);
    const users = await timed('nombres', getDocs(collection(db, 'users')));
    countReads(users.size);
    const names = {};
    users.forEach((d) => { names[d.id] = d.data().displayName; });
    restaurantsCache = [];
    for (const r of rs.docs) {
      const ratings = await timed('opiniones de ' + r.data().name, getDocs(collection(r.ref, 'ratings')));
      countReads(ratings.size);
      const list = ratings.docs.map((d) => ({ uid: d.id, ...d.data() }));
      const globals = list.map((x) => x.global).filter((x) => x != null);
      const avg = globals.length ? globals.reduce((a, b) => a + b, 0) / globals.length : null;
      restaurantsCache.push({ id: r.id, ...r.data(), ratings: list, avg });
    }
    const ms = Math.round(performance.now() - t0);
    $('#list').innerHTML = restaurantsCache.map((r) =>
      `<li><b>${escapeHtml(r.name)}</b> · media ${fmt(r.avg)} · ${r.ratings.length} opinión(es)` +
      (r.ratings.length ? ` (${r.ratings.map((x) => escapeHtml(names[x.uid] || 'sin nombre') + ' ' + fmt(x.global)).join(', ')})` : '') +
      `</li>`).join('') || '<li class="meta">No hay restaurantes</li>';
    log(`Leídos ${rs.size} restaurantes en ${ms} ms${rs.metadata.fromCache ? ' (desde caché)' : ''}`, 'ok');
  } catch (e) { fail('Leer todo', e); }
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- 4. Foto ----------

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')); };
    img.src = url;
  });
}

function toJpeg(img, maxSide, quality) {
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.getContext('2d').drawImage(img, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve({ blob: b, w, h }) : reject(new Error('No se pudo comprimir'))), 'image/jpeg', quality));
}

$('#file').onchange = async (ev) => {
  const file = ev.target.files && ev.target.files[0];
  ev.target.value = '';
  if (!file) return;
  if (!user) return log('Entra primero', 'bad');
  if (!lastRid) return log('Crea antes una ficha de prueba', 'bad');
  try {
    log(`Foto elegida: ${file.type || 'tipo desconocido'}, ${(file.size / 1024).toFixed(0)} KB`);
    const img = await loadImage(file);
    const full = await toJpeg(img, 1600, 0.82);
    const thumb = await toJpeg(img, 400, 0.78);
    log(`Comprimida: ${full.w}×${full.h} ${(full.blob.size / 1024).toFixed(0)} KB · miniatura ${thumb.w}×${thumb.h} ${(thumb.blob.size / 1024).toFixed(0)} KB`, 'ok');
    const base = `restaurants/${lastRid}/${user.uid}/${Date.now()}`;
    const meta = { contentType: 'image/jpeg' };
    await uploadBytes(ref(storage, base + '.jpg'), full.blob, meta);
    await uploadBytes(ref(storage, base + '_t.jpg'), thumb.blob, meta);
    await updateDoc(doc(db, 'restaurants', lastRid, 'ratings', user.uid), {
      photos: arrayUnion({ full: base + '.jpg', thumb: base + '_t.jpg' }),
      updatedAt: serverTimestamp()
    });
    log('Foto subida y guardada en tu puntuación', 'ok');
    await showPhotos();
  } catch (e) { fail('Subir foto', e); }
};

$('#btn-photos').onclick = showPhotos;

async function showPhotos() {
  if (!lastRid || !user) return log('Crea antes una ficha de prueba', 'bad');
  try {
    const snap = await getDoc(doc(db, 'restaurants', lastRid, 'ratings', user.uid));
    countReads(1);
    const photos = (snap.exists() && snap.data().photos) || [];
    const urls = await Promise.all(photos.map(async (p) => ({
      thumb: await getDownloadURL(ref(storage, p.thumb)),
      full: await getDownloadURL(ref(storage, p.full))
    })));
    $('#thumbs').innerHTML = urls.map((u) => `<a href="${u.full}" target="_blank" rel="noopener"><img src="${u.thumb}" alt="Foto de prueba"></a>`).join('');
    log(`Fotos mostradas: ${urls.length}`, 'ok');
  } catch (e) { fail('Ver fotos', e); }
}

// ---------- 5. Mapa ----------

let mapsPromise = null;
function loadMaps() {
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise((resolve, reject) => {
    window.__mapsReady = resolve;
    window.gm_authFailure = () => log('Google Maps rechazó la clave (gm_authFailure). Revisa las restricciones de la clave.', 'bad');
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&v=weekly&language=es&region=ES&loading=async&callback=__mapsReady`;
    s.async = true;
    s.onerror = () => reject(new Error('No se pudo cargar el script de Google Maps'));
    document.head.appendChild(s);
  });
  return mapsPromise;
}

$('#btn-map').onclick = async () => {
  try {
    const t0 = performance.now();
    await loadMaps();
    const map = new google.maps.Map($('#map'), { center: { lat: 39.6, lng: 2.95 }, zoom: 9, gestureHandling: 'greedy' });
    restaurantsCache.forEach((r) => {
      new google.maps.Marker({ map, position: r.location, label: r.avg == null ? '–' : fmt(r.avg), title: r.name });
    });
    log(`Mapa cargado en ${Math.round(performance.now() - t0)} ms con ${restaurantsCache.length} pin(es)`, 'ok');
  } catch (e) { fail('Mapa', e); }
};

// ---------- 6. Limpiar ----------

$('#btn-clean').onclick = async () => {
  if (!user) return log('Entra primero', 'bad');
  try {
    const rs = await getDocs(collection(db, 'restaurants'));
    countReads(rs.size);
    let n = 0;
    for (const r of rs.docs) {
      const d = r.data();
      if (d.createdBy !== user.uid || !String(d.name).startsWith('Prueba')) continue;
      const myRating = await getDoc(doc(r.ref, 'ratings', user.uid));
      countReads(1);
      for (const p of (myRating.exists() && myRating.data().photos) || []) {
        for (const path of [p.full, p.thumb]) {
          try { await deleteObject(ref(storage, path)); } catch (e) { if (e.code !== 'storage/object-not-found') throw e; }
        }
      }
      const batch = writeBatch(db);
      if (myRating.exists()) batch.delete(myRating.ref);
      batch.delete(r.ref);
      await batch.commit();
      n++;
    }
    lastRid = null;
    safeSet('lastRid', '');
    $('#thumbs').innerHTML = '';
    log(`Fichas de prueba borradas: ${n}`, 'ok');
    await readAll();
  } catch (e) { fail('Limpiar', e); }
};

// ---------- Registro ----------

$('#btn-copy').onclick = async () => {
  try {
    await navigator.clipboard.writeText($('#env').innerText + '\n\n' + $('#log').textContent);
    log('Registro copiado', 'ok');
  } catch (e) { fail('Copiar registro', e); }
};
$('#btn-clear').onclick = () => { $('#log').textContent = ''; safeSet('testLog', ''); };

// ---------- 7. Conexión ----------

$('#conn').value = connMode;
$('#btn-conn').onclick = () => {
  safeSet('connMode', $('#conn').value);
  log(`Cambio de conexión a «${$('#conn').value}». Cierra la app del todo y vuelve a abrirla.`);
  $('#conn-msg').hidden = false;
};

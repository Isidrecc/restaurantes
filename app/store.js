// Datos: Firebase (Auth, Firestore y Storage). Sin interfaz.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, doc, collection, collectionGroup, getDoc, getDocFromCache,
  setDoc, updateDoc, writeBatch, serverTimestamp, onSnapshot
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js';
import {
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-storage.js';
import { firebaseConfig, CRITERIA, PRICES, COLORS, CUISINE_RENAMES } from './config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Long polling forzado: con la conexión por defecto, la app instalada en el iPhone
// tardaba hasta 80 s en la primera lectura (prueba del paso 2, especificación sección 8).
const db = initializeFirestore(app, { localCache: persistentLocalCache(), experimentalForceLongPolling: true });
const storage = getStorage(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// Sin conexión, las lecturas sueltas van directas a la copia del teléfono: getDoc esperaría al servidor.
// Si no está en la copia, se intenta igualmente con getDoc (parte 5b).
function readDoc(r) {
  if (navigator.onLine === false) return getDocFromCache(r).catch(() => getDoc(r));
  return getDoc(r);
}

// ---------- Sesión y acceso ----------

export function onSession(cb) { return onAuthStateChanged(auth, cb); }
export function signIn() { return signInWithPopup(auth, provider); }
export function logOut() { return signOut(auth); }
export function currentUser() { return auth.currentUser; }

// Papel y color de la persona: members/{correo en minúsculas}.
export async function getMembership(user) {
  const snap = await readDoc(doc(db, 'members', user.email.toLowerCase()));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { role: d.role, color: COLORS.includes(d.color) ? d.color : null };
}

export async function getProfile(uid) {
  const snap = await readDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export function saveProfile(uid, displayName, color) {
  return setDoc(doc(db, 'users', uid), { displayName, color: color || null, updatedAt: serverTimestamp() });
}

// ---------- Lectura en tiempo real ----------

// Llama a onChange({ people, restaurants }) cada vez que cambia algo.
export function watchAll(onChange, onError) {
  let users = [];
  let rests = [];
  let ratings = {};
  let ready = { users: false, rests: false, ratings: false };
  const emit = () => {
    if (!ready.users || !ready.rests || !ready.ratings) return;
    const people = users
      .filter((u) => COLORS.includes(u.color))
      .sort((a, b) => COLORS.indexOf(a.color) - COLORS.indexOf(b.color));
    const restaurants = rests.map((r) => ({ ...r, ratings: ratings[r.id] || {} }));
    onChange({ people, restaurants });
  };
  const unsubs = [
    onSnapshot(collection(db, 'users'), (snap) => {
      users = snap.docs.map((d) => ({ uid: d.id, name: d.data().displayName || 'Sense nom', color: d.data().color || null }));
      ready.users = true; emit();
    }, onError),
    onSnapshot(collection(db, 'restaurants'), (snap) => {
      rests = snap.docs.map((d) => fromDoc(d.id, d.data()));
      ready.rests = true; emit();
    }, onError),
    onSnapshot(collectionGroup(db, 'ratings'), (snap) => {
      ratings = {};
      snap.docs.forEach((d) => {
        const rid = d.ref.parent.parent.id;
        const x = d.data();
        (ratings[rid] = ratings[rid] || {})[d.id] = { scores: x.scores || {}, dish: x.dish || '' };
      });
      ready.ratings = true; emit();
    }, onError)
  ];
  return () => unsubs.forEach((u) => u());
}

function fromDoc(id, d) {
  return {
    id,
    name: d.name || '',
    locality: d.locality || '',
    address: d.address || '',
    lat: d.location ? d.location.lat : null,
    lng: d.location ? d.location.lng : null,
    cuisines: Array.from(new Set((d.cuisines || []).map((c) => CUISINE_RENAMES[c] || c))),
    price: PRICES[(d.price || 2) - 1] || PRICES[1],
    // Sin fecha: «Pendent de visitar».
    visitDate: d.visitDate || '',
    featured: d.featured === true,
    blog: d.blog || '',
    photos: d.photos || [],
    placeId: d.placeId || null,
    createdBy: d.createdBy || null
  };
}

// ---------- Escritura ----------

function commonFields(r) {
  return {
    name: r.name,
    locality: r.locality,
    address: r.address || null,
    location: { lat: r.lat, lng: r.lng },
    cuisines: r.cuisines,
    price: PRICES.indexOf(r.price) + 1,
    visitDate: r.visitDate || null,
    featured: !!r.featured,
    blog: r.blog,
    // La portada se marca en su foto con cover: true; si no hay ninguna, la portada es la primera.
    photos: r.photos.map((p) => Object.assign({ full: p.full, thumb: p.thumb, caption: p.caption || '' }, p.cover ? { cover: true } : {})),
    placeId: r.placeId || null,
    source: r.placeId ? 'places' : 'manual'
  };
}

export function newRestaurantId() { return doc(collection(db, 'restaurants')).id; }

function ratingFields(rating) {
  const scores = {};
  CRITERIA.forEach((c) => { scores[c.k] = rating.scores[c.k] == null ? null : rating.scores[c.k]; });
  const vals = Object.values(scores).filter((v) => v != null);
  return {
    scores,
    global: vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : null,
    dish: rating.dish || '',
    updatedAt: serverTimestamp()
  };
}

export async function createRestaurant(id, r, myRating) {
  const uid = auth.currentUser.uid;
  const batch = writeBatch(db);
  const rRef = doc(db, 'restaurants', id);
  batch.set(rRef, { ...commonFields(r), createdBy: uid, createdAt: serverTimestamp(), updatedBy: uid, updatedAt: serverTimestamp() });
  if (myRating) batch.set(doc(rRef, 'ratings', uid), ratingFields(myRating));
  await batch.commit();
}

export function updateRestaurant(id, r) {
  const uid = auth.currentUser.uid;
  return updateDoc(doc(db, 'restaurants', id), { ...commonFields(r), updatedBy: uid, updatedAt: serverTimestamp() });
}

export function saveMyRating(rid, rating) {
  return setDoc(doc(db, 'restaurants', rid, 'ratings', auth.currentUser.uid), ratingFields(rating));
}

// Borra el restaurante con todas sus notas y fotos (solo propietarios).
export async function deleteRestaurant(r) {
  for (const p of r.photos) await removePhotoFiles(p);
  const batch = writeBatch(db);
  Object.keys(r.ratings).forEach((uid) => batch.delete(doc(db, 'restaurants', r.id, 'ratings', uid)));
  batch.delete(doc(db, 'restaurants', r.id));
  await batch.commit();
}

// ---------- Fotos ----------

const urlCache = new Map();
export function photoURL(path) {
  if (!urlCache.has(path)) urlCache.set(path, getDownloadURL(ref(storage, path)).catch((e) => { urlCache.delete(path); throw e; }));
  return urlCache.get(path);
}

export async function uploadPhoto(rid, full, thumb) {
  const base = `restaurants/${rid}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const meta = { contentType: 'image/jpeg' };
  await uploadBytes(ref(storage, base + '.jpg'), full, meta);
  await uploadBytes(ref(storage, base + '_t.jpg'), thumb, meta);
  return { full: base + '.jpg', thumb: base + '_t.jpg' };
}

export async function removePhotoFiles(p) {
  for (const path of [p.full, p.thumb]) {
    try { await deleteObject(ref(storage, path)); } catch (e) { if (e.code !== 'storage/object-not-found') throw e; }
    urlCache.delete(path);
  }
}

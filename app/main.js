// Puntuam a taula: interfaz. Porta la demo aprobada (demo/index.html) con los cambios de docs/diseno.md.
import { CRITERIA, CUISINES, PRICES, CHEAP_PRICES, COLORS, COLOR_NAMES } from './config.js';
import * as store from './store.js';
import { createMainMap, createPickMap, createPlaceSearch, localityAt, placeCard, placePhoto, mapsLink } from './maps.js';
import { preparePhoto } from './photos.js';
import { MARKS, blogHTML, paragraphs, plainText, toggleMark, cleanURL, insertLink } from './text.js';

// ---------- Estado ----------
let me = null;            // { uid, email, role, color }
let people = [];          // quienes puntúan: [{ uid, name, color }]
let restaurants = [];
let stopWatch = null;
let dataReady = false;
let pendingOpen = null;   // ficha que abrir cuando lleguen los datos guardados
let linkId = null;        // ficha de un enlace compartido (?r=id), que se abre al llegar los datos

const filters = { q: '', min: 0, field: 'global', cuisines: new Set(), munis: new Set(), prices: new Set() };
let sortBy = 'nota';
let view = 'home';
let lastBrowse = 'home';
let selectedId = null;
let detailId = null;
let draft = null;
let formMode = 'add';
let saving = false;
let confirmFn = null;
let mainMap = null;
let pickMap = null;
let pickMapPromise = null;
let formStep = 0;         // paso del alta (índice en formBlocks())
let initialSnap = '';     // estado del formulario al abrirlo, para saber si hay algo que descartar
let searchEl = null;      // casilla de Google del paso 1
let searchToken = 0;      // descarta casillas que terminan de crearse cuando ya no hacen falta
let searchFailed = false; // sin buscador de Google: el nombre se escribe a mano
let nameBeforeSearch = '';// nombre que había antes de tocar la X para volver a buscar
let autoLocality = '';    // localidad copiada de Google
let typedText = '';       // lo escrito en la casilla de Google, reconstruido tecla a tecla
let geoToken = 0;         // descarta respuestas de localidad de un pin anterior
let localityManual = false; // la localidad la ha escrito la persona: no se sustituye

// Selector de nota: 'all' (media) o el color de quien puntúa.
let who = 'all';
try { const w = localStorage.getItem('puntuam-nota'); if (w === 'all' || COLORS.includes(w)) who = w; } catch (e) { /* sin almacenamiento */ }
function saveWho() { try { localStorage.setItem('puntuam-nota', who); } catch (e) { /* sin almacenamiento */ } }

// ---------- Utilidades ----------
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.prototype.slice.call((el || document).querySelectorAll(s));
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function round1(n) { return Math.round(n * 10) / 10; }
function fmt(n) { return n == null ? 'Sense nota' : round1(n).toLocaleString('ca-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
function globalOf(scores) {
  const v = CRITERIA.map((c) => scores[c.k]).filter((x) => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
function cls(n) {
  if (n == null) return 's0';
  const r = round1(n);
  return r >= 9 ? 's5' : r >= 8 ? 's4' : r >= 7 ? 's3' : r >= 5 ? 's2' : 's1';
}
function word(n) {
  if (n == null) return 'Sense valorar';
  const r = round1(n);
  return r >= 9 ? 'Excel·lent' : r >= 8 ? 'Molt bo' : r >= 7 ? 'Bo' : r >= 5 ? 'Correcte' : 'Fluix';
}
function fmtDate(iso) {
  if (!iso) return '';
  const p = iso.split('-');
  return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}
// Fecha de hace «back» días en formato AAAA-MM-DD (0: hoy, 1: ayer).
function dayISO(back) {
  const d = new Date();
  d.setDate(d.getDate() - (back || 0));
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function todayISO() { return dayISO(0); }
// «de» davant de nom: «d’Isidre», «de Cris».
function de(name) { return (/^h?[aeiouàáèéíïòóúü]/i.test(name) ? 'd’' : 'de ') + name; }
function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function placeLine(r, withPrice) { return [r.locality, r.cuisines.join(', '), withPrice ? r.price : ''].filter(Boolean).map(esc).join(' · '); }
function byId(id) { return restaurants.find((r) => r.id === id); }
// «Pendent de visitar»: guardado sin fecha de visita.
function isPending(r) { return !r.visitDate; }
// Texto de la casilla de nota: la nota, «Sense nota» o, si está pendiente y sin nota, «Pendent».
function scoreLabel(r, g) { return g == null && isPending(r) ? 'Pendent' : fmt(g); }
function avg(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null; }
const STAR = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8L12 3z"></path></svg>';
const XICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>';

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('is-on'), 2600);
}
function errText(e) { return (e && (e.code || e.message)) || 'error desconegut'; }

// ---------- Personas y medias ----------
function person(uid) { return people.find((p) => p.uid === uid) || null; }
function personName(uid) { const p = person(uid); return p ? p.name : 'Antic'; }
function pcls(uid) { const p = person(uid); return p ? 'p-' + p.color : ''; }
function selectedUids() { return who === 'all' ? people.map((p) => p.uid) : people.filter((p) => p.color === who).map((p) => p.uid); }
function ratingOf(r, uid) {
  const x = r.ratings[uid];
  return x ? { uid, scores: x.scores, dish: x.dish, global: globalOf(x.scores) } : null;
}
// Nota que se ve: media de las notas globales de la selección. Cada criterio: media de quienes lo han puntuado.
function agg(r) {
  const list = selectedUids().map((u) => ratingOf(r, u)).filter(Boolean);
  const crit = {};
  CRITERIA.forEach((c) => { crit[c.k] = avg(list.map((o) => o.scores[c.k]).filter((v) => v != null)); });
  return { g: avg(list.map((o) => o.global).filter((v) => v != null)), crit, n: list.length, list };
}
function whoLabel() {
  if (who === 'all') return 'Mitjana';
  const p = people.find((x) => x.color === who);
  return p ? p.name : 'Mitjana';
}
function canRate() { return !!me && !!me.color && (me.role === 'owner' || me.role === 'editor'); }
function canEditData() { return !!me && (me.role === 'owner' || me.role === 'editor'); }
function canDelete() { return !!me && me.role === 'owner'; }

// Tipos de cocina: los de config.js y, detrás y por orden alfabético, los añadidos en algún restaurante.
function cuisineList(extra) {
  const seen = new Set(CUISINES.map(norm));
  const added = [];
  const add = (c) => { const k = norm(c); if (c && !seen.has(k)) { seen.add(k); added.push(c); } };
  restaurants.forEach((r) => r.cuisines.forEach(add));
  (extra || []).forEach(add);
  return CUISINES.concat(added.sort((a, b) => a.localeCompare(b, 'ca')));
}

// ---------- Filtros ----------
function passes(r) {
  if (filters.q && norm([r.name, r.locality, r.address].join(' ')).indexOf(norm(filters.q)) < 0) return false;
  if (filters.min > 0) {
    const a = agg(r);
    const v = filters.field === 'global' ? a.g : a.crit[filters.field];
    if (v == null || round1(v) < filters.min) return false;
  }
  if (filters.cuisines.size && !r.cuisines.some((c) => filters.cuisines.has(c))) return false;
  if (filters.munis.size && !filters.munis.has(r.locality)) return false;
  if (filters.prices.size && !filters.prices.has(r.price)) return false;
  return true;
}
function filtered() {
  const out = restaurants.filter(passes);
  out.sort((a, b) => {
    if (sortBy === 'nombre') return a.name.localeCompare(b.name, 'ca');
    if (sortBy === 'fecha') return (b.visitDate || '').localeCompare(a.visitDate || '');
    const ga = agg(a).g, gb = agg(b).g;
    return (gb == null ? -1 : gb) - (ga == null ? -1 : ga);
  });
  return out;
}
function activeCount() { return (filters.min > 0 ? 1 : 0) + filters.cuisines.size + filters.munis.size + filters.prices.size; }
function clearFilters() {
  filters.q = ''; filters.min = 0; filters.field = 'global';
  filters.cuisines.clear(); filters.munis.clear(); filters.prices.clear();
  $('#q').value = '';
}
function fieldLabel(k) { return k === 'global' ? 'Nota global' : CRITERIA.find((c) => c.k === k).label; }
function localities() {
  return Array.from(new Set(restaurants.map((r) => r.locality).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es'));
}

// ---------- Lista, mapa y tarjeta resumen ----------
function rowHTML(r) {
  const a = agg(r);
  const g = a.g;
  const dishes = a.list.filter((o) => o.dish).map((o) =>
    '<span class="dish person ' + pcls(o.uid) + '">' + STAR + '<b>' + esc(o.dish) + '</b>' +
    (o.scores.plato != null ? '<span class="num">' + fmt(o.scores.plato) + '</span>' : '') + '</span>').join('');
  const minis = who === 'all' ? '<span class="pminis">' + people.map((p) => {
    const o = ratingOf(r, p.uid);
    return o ? '<span class="pmini p-' + p.color + '">' + esc(p.name) + ' <b>' + fmt(o.global) + '</b></span>' : '';
  }).join('') + '</span>' : '';
  return '<span class="row">' +
    '<span class="score ' + cls(g) + (g == null ? ' is-empty' : '') + '">' + scoreLabel(r, g) + '</span>' +
    '<span class="row-main">' +
      '<span class="row-title"><strong class="row-name">' + esc(r.name) + '</strong><span class="price">' + esc(r.price) + '</span></span>' +
      '<span class="meta">' + placeLine(r, false) + '</span>' +
      dishes + minis +
      (r.visitDate ? '<span class="meta">' + esc(fmtDate(r.visitDate)) + '</span>' : '') +
    '</span></span>';
}

function renderMarkers(list) {
  if (!mainMap) return;
  mainMap.setMarkers(list.slice().reverse().map((r) => {
    const g = agg(r).g;
    return { id: r.id, lat: r.lat, lng: r.lng, text: g == null ? '·' : fmt(g), klass: cls(g), title: r.name + (g == null && isPending(r) ? ', pendent de visitar' : ', nota ' + fmt(g)), selected: r.id === selectedId };
  }), selectOnMap);
}
function renderPreview() {
  const box = $('#preview');
  const r = selectedId && byId(selectedId);
  if (!r || !passes(r)) { box.hidden = true; $('#legend').hidden = false; return; }
  box.innerHTML = rowHTML(r) +
    '<div class="preview-actions">' +
      '<button class="btn" type="button" data-act="close-preview">Tanca</button>' +
      '<button class="btn btn-primary" type="button" data-act="open" data-id="' + r.id + '">Obre la fitxa</button>' +
    '</div>';
  box.hidden = false;
  $('#legend').hidden = true;
}
function selectOnMap(id) {
  selectedId = id;
  render();
  const r = byId(id);
  if (r && mainMap) mainMap.focus(r.lat, r.lng, null, $('#preview').offsetHeight + 12);
}
function renderList(list) {
  const el = $('#list');
  if (!restaurants.length) {
    el.innerHTML = '<div class="empty"><p>Encara no hi ha restaurants.</p>' + (canEditData() ? '<p>Afegeix el primer des de la pestanya Afegeix.</p>' : '') + '</div>';
    return;
  }
  if (!list.length) {
    el.innerHTML = '<div class="empty"><p>Cap restaurant no compleix aquests filtres.</p><button class="btn" type="button" data-act="clear">Treu els filtres</button></div>';
    return;
  }
  el.innerHTML = list.map((r) => '<button class="card" type="button" data-act="open" data-id="' + r.id + '">' + rowHTML(r) + '</button>').join('');
}
function renderChips() {
  const chips = [];
  if (filters.min > 0) chips.push({ t: fieldLabel(filters.field) + ' ≥ ' + fmt(filters.min), k: 'min' });
  filters.cuisines.forEach((c) => chips.push({ t: c, k: 'cuisines', v: c }));
  filters.munis.forEach((c) => chips.push({ t: c, k: 'munis', v: c }));
  filters.prices.forEach((c) => chips.push({ t: c, k: 'prices', v: c }));
  const box = $('#active-chips');
  box.hidden = !chips.length || view === 'form' || view === 'home';
  box.innerHTML = chips.map((c) =>
    '<button class="chip chip-x" type="button" data-rm="' + c.k + '" data-v="' + esc(c.v || '') + '" aria-label="Treu el filtre ' + esc(c.t) + '">' + esc(c.t) + XICON + '</button>').join('') +
    (chips.length ? '<button class="chip chip-clear" type="button" data-act="clear">Treu-los tots</button>' : '');
  const n = activeCount();
  $('#filter-count').hidden = !n;
  $('#filter-count').textContent = n;
}
function countText(n) {
  const total = restaurants.length;
  if (n === total) return total + (total === 1 ? ' restaurant' : ' restaurants');
  return n + ' de ' + total;
}
function updateWhoLabel() {
  $('#who-label').textContent = whoLabel();
  $('#btn-who').setAttribute('aria-label', 'Nota: ' + whoLabel());
  $('#btn-who').className = 'btn' + (who === 'all' ? '' : ' p-' + who);
}
function render() {
  const list = filtered();
  if (selectedId && !list.some((r) => r.id === selectedId)) selectedId = null;
  renderChips();
  updateWhoLabel();
  $('#map-count').textContent = countText(list.length);
  $('#list-count').textContent = countText(list.length);
  $('#flt-apply').textContent = 'Mostra ' + (list.length === 1 ? '1 restaurant' : list.length + ' restaurants');
  renderMarkers(list);
  renderPreview();
  renderList(list);
  renderHome();
}

// ---------- Inici ----------
// Primera pantalla (pedida por el propietario el 24 de noviembre de 2026; docs/diseno.md, sección 4b):
// «Recomanació per menys de 40 €» (los marcados en «Edita») y «Millors menús degustació».
const DEGUSTACIO = 'Menú degustació';
const PLATE = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="6.5"></circle><circle cx="12" cy="12" r="3.5"></circle><path d="M3 4v5M3 9v11M21 4c-1.5 1-2 3-2 5s.5 2 2 2v9"></path></svg>';
function homeRecommended() {
  return restaurants.filter((r) => r.featured && CHEAP_PRICES.includes(r.price)).sort((a, b) => a.name.localeCompare(b.name, 'ca'));
}
// Menús degustación: primero los puntuados, de más a menos nota; después los demás, por nombre.
function homeTasting() {
  return restaurants.filter((r) => r.cuisines.includes(DEGUSTACIO)).map((r) => ({ r, g: agg(r).g })).sort((a, b) => {
    if (a.g != null || b.g != null) return (b.g == null ? -1 : b.g) - (a.g == null ? -1 : a.g);
    return a.r.name.localeCompare(b.r.name, 'ca');
  }).map((x) => x.r);
}
// Foto de la noticia: la portada propia; si no hay, la de Google (se pone al verse, ver flushHomePhotos);
// si tampoco, un recuadro con un plato.
function homePhoto(r, slot) {
  const ci = coverIndex(r.photos);
  const open = ' data-act="open" data-id="' + esc(r.id) + '"';
  if (ci >= 0) return '<div class="thumb news-photo"' + open + '><img data-path="' + esc(r.photos[ci].full) + '" alt=""></div>';
  if (r.placeId) return '<div class="hcard-google news-photo"' + open + ' data-place="' + esc(r.placeId) + '" data-slot="' + slot + '"></div>';
  return '<div class="news-photo news-none"' + open + '>' + PLATE + '</div>';
}
// Entradilla: el principio del comentario, sin las marcas de formato y cortado en una palabra.
function standfirst(text, max) {
  const first = plainText(paragraphs(text)[0] || '').replace(/\s+/g, ' ').trim();
  if (first.length <= max) return first;
  return first.slice(0, max).replace(/\s+\S*$/, '') + '…';
}
// Quién ha puntuado: «Isidre», «Isidre i Cris».
function ratersText(r) {
  return people.filter((pp) => r.ratings[pp.uid]).map((pp) => pp.name).join(' i ');
}
// Antetítulo: localidad y cocina (sin la que da nombre a la sección) y precio.
function kicker(r, skip) {
  return [r.locality, r.cuisines.filter((c) => c !== skip).join(', '), r.price].filter(Boolean).join(' · ');
}
// Firma: la nota con su texto, quién ha puntuado y la fecha; o «Pendent de visitar».
function byline(r) {
  const g = agg(r).g;
  const pending = isPending(r) && g == null;
  // Pendiente: sin recuadro de nota, ya lo dice el texto.
  const tile = pending ? '' : '<span class="score is-small ' + cls(g) + (g == null ? ' is-empty' : '') + '">' + fmt(g) + '</span>';
  const bits = pending
    ? ['<b>Pendent de visitar</b>']
    : ['<b>' + esc(word(g)) + '</b>', ratersText(r) ? 'Per ' + esc(ratersText(r)) : '', r.visitDate ? esc(fmtDate(r.visitDate)) : ''].filter(Boolean);
  return '<span class="byline">' + tile + '<span>' + bits.join(' · ') + '</span></span>';
}
// Noticia principal de cada sección: foto, antetítulo, titular, entradilla y firma.
function leadHTML(r, slot, skip) {
  const dish = agg(r).list.find((o) => o.dish);
  const text = standfirst(r.blog, 190) || (dish ? 'Plat estrella: ' + dish.dish + (dish.scores.plato != null ? ' (' + fmt(dish.scores.plato) + ')' : '') + '.' : '');
  return '<article class="lead">' + homePhoto(r, slot) +
    '<button class="lead-body" type="button" data-act="open" data-id="' + esc(r.id) + '">' +
      '<span class="kicker">' + esc(kicker(r, skip)) + '</span>' +
      '<span class="headline">' + esc(r.name) + '</span>' +
      (text ? '<span class="standfirst">' + esc(text) + '</span>' : '') +
      byline(r) +
    '</button></article>';
}
// Breves: solo texto, separados por filetes (sin fotos: tampoco se piden a Google).
function briefsHTML(list, skip) {
  if (!list.length) return '';
  return '<ul class="briefs">' + list.map((r) => {
    const g = agg(r).g;
    return '<li><button class="brief" type="button" data-act="open" data-id="' + esc(r.id) + '">' +
      '<span class="brief-text"><span class="kicker">' + esc(kicker(r, skip)) + '</span>' +
      '<span class="brief-title">' + esc(r.name) + '</span>' +
      '<span class="brief-meta">' + (isPending(r) && g == null ? 'Pendent de visitar' : esc(word(g)) + (ratersText(r) ? ' · Per ' + esc(ratersText(r)) : '')) + '</span></span>' +
      (isPending(r) && g == null ? '' : '<span class="score is-small ' + cls(g) + (g == null ? ' is-empty' : '') + '">' + fmt(g) + '</span>') +
    '</button></li>';
  }).join('') + '</ul>';
}
// Solo se dibuja con Inici a la vista (o debajo de una ficha); si no, se apunta y se dibuja al volver.
// Portada de periódico (pedida por el propietario el 24 de noviembre de 2026): fecha del día, secciones con
// filete y, en cada una, una noticia principal con foto y el resto como breves.
let homeDirty = true;
function renderHome() {
  const box = $('#home');
  if (view !== 'home') { homeDirty = true; return; }
  homeDirty = false;
  if (!dataReady) { box.innerHTML = ''; return; }
  const rec = homeRecommended();
  const tasting = homeTasting();
  const today = new Date().toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  let html = '<div class="paper-date"><span>' + esc(today) + '</span><span>' + restaurants.length + (restaurants.length === 1 ? ' restaurant' : ' restaurants') + '</span></div>';
  let any = false;
  if (rec.length || canEditData()) {
    any = true;
    html += '<section class="news-sec" aria-labelledby="h-rec"><div class="news-head"><h2 class="news-label" id="h-rec">Recomanació · menys de 40 €</h2></div>' +
      (rec.length ? leadHTML(rec[0], 'rec', '') + briefsHTML(rec.slice(1), '')
        : '<p class="hint">Encara no n’hi ha cap. Es marca a «Edita», en un restaurant de menys de 40 €.</p>') +
      '</section>';
  }
  if (tasting.length || canEditData()) {
    any = true;
    html += '<section class="news-sec" aria-labelledby="h-tast"><div class="news-head"><h2 class="news-label" id="h-tast">Millors menús degustació</h2>' +
      (tasting.length ? '<button class="link-btn" type="button" data-act="map-filter" data-g="cuisines" data-v="' + esc(DEGUSTACIO) + '">Veure’ls al mapa</button>' : '') + '</div>' +
      (tasting.length ? leadHTML(tasting[0], 'tast', DEGUSTACIO) + briefsHTML(tasting.slice(1), DEGUSTACIO)
        : '<p class="hint">Encara no n’hi ha cap amb el tipus «' + esc(DEGUSTACIO) + '».</p>') +
      '</section>';
  }
  if (!any) html += '<div class="empty"><p>Encara no hi ha res a destacar.</p></div>';
  box.innerHTML = html;
  hydratePhotos(box);
  watchHomePhotos();
}
// Fotos de Google: cada una es una consulta de pago (gratis hasta 10.000 al mes), así que solo se piden las de
// las tarjetas que se ven, con Inici a la vista y sin ficha abierta. Las ya pedidas no se vuelven a pedir.
let homeIO = null;
const homeSeen = new Set();
function watchHomePhotos() {
  homeSeen.clear();
  const boxes = $$('#home .hcard-google');
  if (!('IntersectionObserver' in window)) { boxes.forEach((b) => homeSeen.add(b)); flushHomePhotos(); return; }
  if (!homeIO) {
    homeIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) homeSeen.add(en.target); else homeSeen.delete(en.target); });
      flushHomePhotos();
    });
  }
  homeIO.disconnect();
  boxes.forEach((b) => homeIO.observe(b));
}
function flushHomePhotos() {
  if (view !== 'home' || !$('#detail').hidden) return;
  homeSeen.forEach((box) => {
    homeSeen.delete(box);
    if (box.dataset.state) return;
    box.dataset.state = 'loading';
    if (homeIO) homeIO.unobserve(box);
    const fail = () => { box.dataset.state = 'failed'; box.innerHTML = PLATE; };
    placePhoto(box.dataset.place, box.dataset.slot).then((el) => {
      if (!document.body.contains(box)) return;
      box.appendChild(el);
      el.loaded.then(() => { box.dataset.state = 'loaded'; }, fail);
    }).catch(fail);
  });
}
// Mapa con un solo filtro, sustituyendo los que hubiera (etiquetas de la ficha y «Veure’ls al mapa»).
function showFilteredMap(group, value) {
  clearFilters();
  filters[group].add(value);
  selectedId = null;
  closeDetail();
  setView('map');
  buildFilterChips();
  render();
  toast('Filtre: ' + value);
}

// ---------- Vistas ----------
function setView(v) {
  view = v;
  if (v !== 'form') lastBrowse = v;
  $$('.view').forEach((s) => s.classList.toggle('is-active', s.id === 'view-' + v));
  $$('.tabs button').forEach((b) => {
    if (b.dataset.view === v && !(v === 'form' && formMode !== 'add')) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  // En Inici no hay buscador ni filtros: son paneles fijos.
  $('#tools').hidden = v === 'form' || v === 'home';
  // El formulario ocupa la pantalla con su X arriba y sus botones abajo: el menú flotante se oculta.
  $('#tabs').hidden = v === 'form';
  $('#active-chips').hidden = v === 'form' || v === 'home' || !activeCount();
  if (v === 'home') { if (homeDirty) renderHome(); flushHomePhotos(); }
  if (v === 'form') ensurePickMap().then(placeDraftOnPickMap).catch((e) => toast('No s’ha pogut carregar el mapa: ' + errText(e)));
}

// ---------- Roseta ----------
// compact: versión pequeña para el formulario, al lado de la nota, con los nombres cortos (mini) más grandes.
function chartSVG(list, compact) {
  const W = compact ? 290 : 380, H = compact ? 212 : 252, cx = W / 2, cy = compact ? 106 : 128, R = compact ? 66 : 88, n = CRITERIA.length, step = 360 / n;
  const fs = compact ? 17 : 13.5;
  const pt = (rad, deg) => { const a = deg * Math.PI / 180; return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)]; };
  const f = (x) => Math.round(x * 10) / 10;
  const hex = (rad) => CRITERIA.map((c, i) => { const q = pt(rad, -90 + i * step); return f(q[0]) + ',' + f(q[1]); }).join(' ');
  const poly = (scores) => CRITERIA.map((c, i) => { const v = scores[c.k]; const q = pt(R * (v == null ? 0 : v) / 10, -90 + i * step); return f(q[0]) + ',' + f(q[1]); }).join(' ');
  const desc = list.map((o) => personName(o.uid) + ': ' + CRITERIA.map((c) => c.short + ' ' + fmt(o.scores[c.k])).join(', ')).join('. ');
  let o = '<svg class="rose' + (compact ? ' is-compact' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Roseta de puntuacions. ' + esc(desc) + '">';
  o += '<polygon class="hex-outer" points="' + hex(R) + '"></polygon>';
  o += '<polygon class="hex-inner" points="' + hex(R / 2) + '"></polygon>';
  CRITERIA.forEach((c, i) => { const e = pt(R, -90 + i * step); o += '<line class="rose-spoke" x1="' + cx + '" y1="' + cy + '" x2="' + f(e[0]) + '" y2="' + f(e[1]) + '"></line>'; });
  list.forEach((x) => { o += '<polygon class="radar-line person ' + pcls(x.uid) + '" points="' + poly(x.scores) + '"><title>' + esc(personName(x.uid)) + '</title></polygon>'; });
  CRITERIA.forEach((c, i) => {
    const deg = -90 + i * step, q = pt(R + 12, deg), cos = Math.cos(deg * Math.PI / 180), sin = Math.sin(deg * Math.PI / 180);
    const anchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle';
    const y = sin < -0.9 ? q[1] - 2 : sin > 0.9 ? q[1] + Math.round(fs * 0.9) : q[1] + Math.round(fs * 0.37);
    o += '<text class="rose-name" text-anchor="' + anchor + '" x="' + f(q[0]) + '" y="' + f(y) + '">' + (compact ? c.mini : c.short) + '</text>';
  });
  return o + '</svg>';
}

// ---------- Ficha ----------
function tagBtn(group, value) {
  return '<button class="chip ftag" type="button" data-act="tag" data-g="' + group + '" data-v="' + esc(value) + '" aria-label="Mostra al mapa: ' + esc(value) + '">' + esc(value) + '</button>';
}
// Dirección de una foto. Las del modo de muestra van dentro de la página (data:); las reales, en Storage.
function photoSrc(path) {
  return path.indexOf('data:') === 0 ? Promise.resolve(path) : store.photoURL(path);
}
function hydratePhotos(root) {
  $$('img[data-path]', root).forEach((img) => {
    photoSrc(img.dataset.path).then((url) => { img.src = url; }).catch(() => {
      img.alt = 'No s’ha pogut carregar la foto';
      markPhoto(img, false);
    });
  });
}
// Portada: la foto marcada o, si no hay ninguna, la primera (docs/diseno.md, sección 4). -1 si no hay fotos.
function coverIndex(photos) {
  if (!photos.length) return -1;
  const i = photos.findIndex((p) => p.cover);
  return i >= 0 ? i : 0;
}
// Foto ampliada: flechas a los lados, deslizar el dedo o las teclas de flecha pasan a la anterior o la
// siguiente (da la vuelta al llegar al final), con el pie y «2 / 5» debajo.
let lbPhotos = [];
let lbIndex = 0;
let lbToken = 0;
function openLightbox(photos, i) {
  lbPhotos = photos;
  $('#lightbox').hidden = false;
  showLightboxPhoto(i);
}
function showLightboxPhoto(i) {
  const n = lbPhotos.length;
  if (!n) return;
  lbIndex = (i + n) % n;
  const photo = lbPhotos[lbIndex];
  const token = ++lbToken;
  $('#lightbox').classList.remove('is-loaded', 'is-error');
  $('#lightbox-img').removeAttribute('src');
  $('#lightbox-img').alt = photo.caption || 'Foto';
  $('#lightbox-cap').textContent = photo.caption || '';
  $('#lightbox-count').textContent = n > 1 ? (lbIndex + 1) + ' / ' + n : '';
  $('#lightbox-prev').hidden = n < 2;
  $('#lightbox-next').hidden = n < 2;
  photoSrc(photo.full).then((url) => { if (token === lbToken) $('#lightbox-img').src = url; }).catch(() => {
    if (token !== lbToken) return;
    markPhoto($('#lightbox-img'), false);
    toast('No s’ha pogut carregar la foto');
  });
  // Deja preparadas la anterior y la siguiente para que el cambio sea inmediato.
  if (n > 1) [lbIndex - 1, lbIndex + 1].forEach((j) => {
    photoSrc(lbPhotos[(j + n) % n].full).then((url) => { new Image().src = url; }).catch(() => {});
  });
}
function closeLightbox() { $('#lightbox').hidden = true; lbToken++; }
// Mientras una foto carga se ve una rueda; al llegar, aparece suavemente (styles.css, «Fotos»).
function markPhoto(img, ok) {
  const box = img.closest('.thumb, .lightbox');
  if (box) box.classList.add(ok ? 'is-loaded' : 'is-error');
}
function openDetail(id, keepScroll) {
  const r = byId(id);
  if (!r) { closeDetail(); return; }
  const prevScroll = keepScroll && $('#detail .panel-body') ? $('#detail .panel-body').scrollTop : 0;
  detailId = id;
  const a = agg(r);
  const g = a.g;
  const raters = people.map((p) => ratingOf(r, p.uid)).filter(Boolean);
  const missing = people.filter((p) => !r.ratings[p.uid]);
  const whoP = people.find((p) => p.color === who);
  const scoreText = who !== 'all' && whoP
    ? (a.n ? 'Nota ' + de(whoP.name) : whoP.name + ' encara no l’ha puntuat')
    : raters.length === 2 ? 'Mitjana ' + de(people.map((p) => p.name).join(' i '))
    : raters.length === 1 ? 'Només l’ha puntuat ' + personName(raters[0].uid)
    : 'Encara sense puntuar';
  const critHTML = CRITERIA.map((c) => '<div class="crit2"><span class="crit-name">' + c.label + '</span>' + raters.map((o) => {
    const v = o.scores[c.k];
    const label = c.k === 'plato' && o.dish ? '<span class="pbar-dish">' + STAR + '<b>' + esc(o.dish) + '</b></span>' : '<span></span>';
    return '<div class="pbar ' + pcls(o.uid) + '">' + label +
      '<span class="crit-val">' + (v == null ? '<span class="meta">Sense nota</span>' : fmt(v)) + '</span>' +
      '<div class="crit-bar"><i style="width:' + (v == null ? 0 : v * 10) + '%"></i></div></div>';
  }).join('') + '</div>').join('');
  const legend = '<div class="people-legend">' + raters.map((o) => '<span class="' + pcls(o.uid) + '"><i class="dot"></i>' + esc(personName(o.uid)) + '</span>').join('') + '</div>';
  const pscores = '<div class="pscores">' + raters.map((o) =>
    '<div class="pscore ' + pcls(o.uid) + '"><span class="pscore-name">Nota mitjana ' + esc(de(personName(o.uid))) + '</span>' +
    '<span class="pscore-val">' + fmt(o.global) + '</span><span class="meta">' + word(o.global) + '</span></div>').join('') + '</div>';
  const rose = '<div class="card"><p class="section-title">Roseta</p>' + chartSVG(raters) +
    '<div class="rose-legend">' + raters.map((o) => '<span class="' + pcls(o.uid) + '"><i class="ln"></i>' + esc(personName(o.uid)) + '</span>').join('') + '</div></div>';
  const photos = r.photos.map((p, i) =>
    '<figure class="photo"><button class="thumb" type="button" data-act="photo" data-i="' + i + '" aria-label="Amplia la foto ' + (i + 1) + '">' +
    '<img data-path="' + esc(p.thumb) + '" alt="' + esc(p.caption || 'Foto ' + (i + 1)) + '"></button>' +
    (p.caption ? '<figcaption>' + esc(p.caption) + '</figcaption>' : '') + '</figure>').join('');
  const ci = coverIndex(r.photos);
  const pending = isPending(r) && !raters.length;
  // Cabecera (boceto del propietario, 24 de noviembre de 2026; docs/diseno.md, sección 4): sobre la portada, arriba
  // el nombre y la nota; abajo, a la izquierda la dirección y la fecha de visita y a la derecha las etiquetas.
  // Sin fotos, lo mismo sobre un fondo de color.
  const tags = '<div class="tags">' + (r.locality ? tagBtn('munis', r.locality) : '') + r.cuisines.map((c) => tagBtn('cuisines', c)).join('') + tagBtn('prices', r.price) + '</div>';
  const hero =
    '<div class="hero' + (ci < 0 ? ' no-photo' : '') + '">' +
      (ci < 0 ? '' :
        '<button class="thumb cover" type="button" data-act="photo" data-i="' + ci + '" aria-label="Amplia la portada">' +
        '<img data-path="' + esc(r.photos[ci].full) + '" alt="' + esc(r.photos[ci].caption || 'Portada') + '"></button>') +
      '<div class="hero-text">' +
        '<div class="hero-top">' +
          '<h2>' + esc(r.name) + '</h2>' +
          '<div class="hero-score-row">' +
            '<div class="score hero-score ' + cls(g) + (g == null ? ' is-empty' : '') + '">' + scoreLabel(r, g) + '</div>' +
            (pending
              ? '<div class="hero-word"><strong>Pendent de visitar</strong></div>'
              : '<div class="hero-word"><strong>' + word(g) + '</strong><span>' + esc(scoreText) + '</span></div>') +
          '</div>' +
        '</div>' +
        '<div class="hero-bottom">' +
          '<div class="hero-info">' + (r.address ? '<span>' + esc(r.address) + '</span>' : '') +
            (r.visitDate ? '<span>Visitat el ' + esc(fmtDate(r.visitDate)) + '</span>' : '') + '</div>' +
          tags +
        '</div>' +
      '</div>' +
    '</div>';
  const mine = me && r.ratings[me.uid];
  const actions = '<button class="link-btn" type="button" data-act="share">Comparteix</button>' +
    (canEditData() ? '<button class="link-btn" type="button" data-act="edit">Edita</button>' : '') +
    (canDelete() ? '<button class="link-btn is-danger" type="button" data-act="delete">Esborra</button>' : '');
  $('#detail').innerHTML =
    '<div class="panel-bar">' +
      '<button class="link-btn" type="button" data-act="back"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg>Torna</button>' +
      '<div class="panel-actions">' + actions + '</div>' +
    '</div>' +
    '<div class="panel-body">' +
      hero +
      (raters.length
        ? '<div class="card crit">' + legend + critHTML + pscores +
            (missing.length ? '<p class="hint">' + missing.map((p) => esc(p.name)).join(' i ') + ' encara no l’ha puntuat.</p>' : '') +
          '</div>' + rose
        : pending ? '' : '<div class="card"><p class="meta">Encara no l’ha puntuat ningú.</p></div>') +
      // Pendiente: el botón abre la edición con la fecha de hoy y, si se puntúa, la nota.
      (pending
        ? (canEditData() ? '<button class="btn btn-primary btn-block" type="button" data-act="visited">' + (canRate() ? 'Ja hi hem anat: posa la data i la nota' : 'Ja hi hem anat: posa la data') + '</button>' : '')
        : (canRate() ? '<button class="btn btn-primary btn-block" type="button" data-act="rate">' + (mine ? 'Edita la meva nota' : 'Puntua aquest restaurant') + '</button>' : '')) +
      (r.blog ? '<div class="card"><p class="section-title">Comentari</p><div class="blog">' + blogHTML(r.blog) + '</div></div>' : '') +
      (photos ? '<div class="card"><p class="section-title">Fotos</p><div class="photos">' + photos + '</div></div>' : '') +
      // Google Maps: la tarjeta de Google si el sitio se eligió en su buscador (lleva su propio botón «Maps»);
      // si no la hay o no carga, el enlace.
      '<div class="gmaps"><p class="section-title">A Google Maps</p>' +
        (r.placeId ? '<div class="gmaps-card" id="gmaps-card"></div>' : '') +
        '<a class="btn btn-block" id="gmaps-link" href="' + esc(mapsLink(r)) + '" target="_blank" rel="noopener"' + (r.placeId ? ' hidden' : '') + '>Obre a Google Maps</a></div>' +
      '<button class="btn btn-block" type="button" data-act="show-on-map">Mostra al mapa</button>' +
    '</div>';
  $('#detail').hidden = false;
  $('#detail .panel-body').scrollTop = prevScroll;
  hydratePhotos($('#detail'));
  if (r.placeId) showPlaceCard(r.id, r.placeId);
}
function closeDetail() { $('#detail').hidden = true; detailId = null; flushHomePhotos(); }
// Pone la tarjeta de Google en la ficha abierta. Si no carga (sin red o tope diario), se quita y queda el enlace.
function showPlaceCard(rid, placeId) {
  const box = $('#gmaps-card');
  const link = $('#gmaps-link');
  const fail = () => { box.hidden = true; link.hidden = false; };
  placeCard(placeId).then((el) => {
    if (detailId !== rid || !document.body.contains(box)) return;
    box.appendChild(el);
    el.loaded.catch(fail);
  }).catch(fail);
}
// Comparteix: enlace a la ficha, que se ve sin entrar. En el iPhone abre el menú de compartir.
// En la web publicada es la página f/<id>/, con la portada para la vista previa (tools/build-site.mjs), que
// lleva a la ficha; en local, directamente ?r=id.
function shareURL(r) {
  const base = location.origin + location.pathname.replace(/[^/]*$/, '');
  return location.hostname.endsWith('github.io')
    ? base + 'f/' + encodeURIComponent(r.id) + '/'
    : base + '?r=' + encodeURIComponent(r.id);
}
async function shareRestaurant(r) {
  const url = shareURL(r);
  if (navigator.share) {
    try { await navigator.share({ title: r.name + ' · Puntuam a taula', url }); } catch (e) { /* cancel·lat */ }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toast('Enllaç copiat');
  } catch (e) { window.prompt('Copia l’enllaç de la fitxa', url); }
}

// ---------- Formulario ----------
// Tres modos con los mismos bloques (docs/diseno.md, secciones 5 y 6): add (alta en pasos, editores),
// edit (todos los bloques en una pantalla, editores) y rate (solo mi nota, quien puntúa).
async function ensurePickMap() {
  if (pickMap) return pickMap;
  if (!pickMapPromise) {
    pickMapPromise = createPickMap($('#pick-map'), { onPick: setDraftLocation }).then((m) => { pickMap = m; return m; });
    pickMapPromise.catch(() => { pickMapPromise = null; });
  }
  return pickMapPromise;
}

// Paso 1. La casilla de Google y el campo del nombre ocupan el mismo sitio. Al elegir un resultado, la casilla
// (que Google vacía y en la que la app no puede escribir) se sustituye por el campo con el nombre de Google,
// editable y con una X para volver a buscar (sección 5).
function searching() { return !$('#f-gsearch').hidden; }
function showNameBox(name) {
  $('#f-gsearch').hidden = true;
  $('#f-namebox').hidden = false;
  $('#f-name').value = name || '';
  $('#f-name-x').hidden = searchFailed;
  $('#name-hint').hidden = true;
  $('#err-name').hidden = true;
  showDraftAddress();
}
async function showSearch() {
  const token = ++searchToken;
  searchEl = null;
  typedText = '';
  $('#f-namebox').hidden = true;
  $('#f-address').hidden = true;
  $('#f-gsearch').hidden = false;
  $('#f-gsearch').innerHTML = '';
  $('#name-hint').textContent = 'Escriu el nom i tria’l de la llista. El mapa el marcarà.';
  $('#name-hint').hidden = false;
  try {
    const m = await ensurePickMap();
    const el = await createPlaceSearch({
      getBias: () => {
        const c = m.map.getCenter();
        return c ? { center: { lat: c.lat(), lng: c.lng() }, radius: 50000 } : null;
      },
      onPlace: (p) => onPlacePicked(m, p),
      onError: (e) => toast('No s’ha pogut cercar: ' + errText(e))
    });
    if (token !== searchToken || !draft) return;
    $('#f-gsearch').innerHTML = '';
    $('#f-gsearch').appendChild(el);
    searchEl = el;
  } catch (e) {
    if (token !== searchToken || !draft) return;
    // Sin buscador, el nombre y la localidad se escriben a mano y el restaurante se sitúa tocando el mapa.
    searchFailed = true;
    showNameBox(nameBeforeSearch);
    showLocality(true);
    $('#name-hint').textContent = 'El cercador de Google no està disponible (' + errText(e) + '). Escriu el nom i toca el mapa per situar-lo.';
    $('#name-hint').hidden = false;
  }
}
function onPlacePicked(m, p) {
  if (!draft) return;
  draft.placeId = p.id;
  // El pin lo pone el usuario tocando el sitio marcado: elegir otro resultado quita el anterior.
  draft.lat = null;
  draft.lng = null;
  m.clearPin();
  m.showPlace(p.lat, p.lng);
  m.center(p.lat, p.lng, 18);
  draft.address = p.address || '';
  showNameBox(p.name);
  // La localidad sale de la dirección de Google y en el alta no se muestra. Si Google no la da, se pide
  // la del punto al poner el pin (fillLocalityFromPin).
  const input = $('#f-locality');
  if (p.locality && !localityManual) input.value = p.locality;
  else if (input.value.trim() === autoLocality) input.value = '';
  autoLocality = p.locality || '';
  if (formMode !== 'add') showLocality(true);
  else if (p.locality) showLocality(false);
  $('#err-muni').hidden = true;
  $('#err-loc').hidden = true;
  $('#pick-status').textContent = 'Toca el restaurant marcat per posar-hi el pin.';
  $('#pick-map').scrollIntoView({ block: 'center', behavior: 'smooth' });
}
function showLocality(on) { $('#fld-locality').hidden = !on; }
function showDraftAddress() {
  const box = $('#f-address');
  box.hidden = !draft || !draft.address || searching();
  box.textContent = draft && draft.address ? draft.address : '';
}
function round5(n) { return Math.round(n * 1e5) / 1e5; }
function setDraftLocation(lat, lng) {
  if (!draft) return;
  draft.lat = round5(lat);
  draft.lng = round5(lng);
  $('#err-loc').hidden = true;
  $('#pick-status').textContent = 'Punt marcat. Pots arrossegar el pin per afinar.';
  // Pin puesto sin elegir ningún resultado: la casilla pasa a campo de nombre con lo que se hubiera escrito.
  if (searching()) {
    const typed = typedText.replace(/\s+/g, ' ').trim().slice(0, 80);
    searchToken++;
    if (typed) {
      // Sitio nuevo escrito a mano: sin datos de Google.
      draft.placeId = null;
      draft.address = '';
      if (pickMap) pickMap.hidePlace();
      if ($('#f-locality').value.trim() === autoLocality) $('#f-locality').value = '';
      autoLocality = '';
      showNameBox(typed);
    } else {
      // No se ha escrito nada: se recupera lo que había antes de volver a buscar.
      showNameBox(nameBeforeSearch);
    }
  }
  fillLocalityFromPin();
}
// Alta: la localidad del pin la da Google (geocodificación inversa) si no ha llegado con el sitio elegido
// en el buscador ni la ha escrito la persona. Si Google no la da, aparece la casilla «Localitat».
function fillLocalityFromPin() {
  if (!draft || formMode !== 'add' || localityManual) return;
  if (draft.placeId && autoLocality) return;
  const token = ++geoToken;
  localityAt(draft.lat, draft.lng).then((loc) => {
    if (token !== geoToken || !draft || localityManual) return;
    if (loc) {
      $('#f-locality').value = loc;
      autoLocality = loc;
      $('#err-muni').hidden = true;
      showLocality(false);
    } else showLocality(true);
  }).catch((e) => {
    if (token !== geoToken || !draft) return;
    console.warn('No s’ha pogut obtenir la localitat del punt', e);
    showLocality(true);
  });
}
// Reconstruye lo escrito en la casilla de Google a partir de sus eventos de teclado, que sí salen de ella
// (la casilla no deja leer su texto). Supone que se escribe al final: con el autocorrector, al pegar o al
// mover el cursor puede no coincidir, y entonces el nombre se corrige a mano.
function trackSearchTyping(e) {
  if (e.type === 'compositionend') { typedText += e.data || ''; return; }
  const t = e.inputType || '';
  const text = e.data != null ? e.data : (e.dataTransfer ? e.dataTransfer.getData('text/plain') : '');
  if (t === 'insertText' || t === 'insertFromPaste' || t === 'insertFromDrop') typedText += text || '';
  else if (t === 'insertReplacementText') typedText = typedText.replace(/\S*$/, text || '');
  else if (t === 'deleteContentBackward') typedText = Array.from(typedText).slice(0, -1).join('');
  else if (t === 'deleteWordBackward') typedText = typedText.replace(/\S*\s*$/, '');
  else if (t.indexOf('delete') === 0) typedText = '';
}
function placeDraftOnPickMap(m) {
  if (!m || !draft) return;
  m.hidePlace();
  if (draft.lat != null) {
    m.setPin(draft.lat, draft.lng);
    m.center(draft.lat, draft.lng, 16);
    $('#pick-status').textContent = 'Pots arrossegar el pin per afinar.';
  } else {
    m.clearPin();
    m.home();
    $('#pick-status').textContent = 'Cerca el restaurant o toca el mapa per situar-lo.';
  }
}
function buildFormStatics() {
  $('#f-price').innerHTML = PRICES.map((p, i) => '<input type="radio" name="f-price" id="f-price-' + i + '" value="' + esc(p) + '"><label for="f-price-' + i + '">' + esc(p) + '</label>').join('');
  // Cada criterio: nombre, nota tecleable y deslizador propio de 1 a 10 con décimas (docs/diseno.md, sección 5).
  $('#rates').innerHTML = CRITERIA.map((c) => {
    const extra = c.k === 'plato' ? '<input class="input" id="f-dish" type="text" maxlength="80" placeholder="Nom del plat" aria-label="Nom del plat estrella" autocomplete="off">' : '';
    return '<div class="rate" data-k="' + c.k + '">' +
      '<div class="rate-head"><span class="rate-label" id="f-l-' + c.k + '">' + c.label + '</span>' +
        '<input class="rate-num" id="f-v-' + c.k + '" type="text" inputmode="decimal" enterkeyhint="done" autocomplete="off" maxlength="4" placeholder="–" aria-label="Nota de ' + c.label + ', de 1 a 10"></div>' + extra +
      '<div class="rate-ctl">' +
        '<button class="step" type="button" data-step="-0.1" aria-label="Baixa una dècima a ' + c.label + '">−</button>' +
        '<div class="slider is-empty" id="f-r-' + c.k + '" role="slider" tabindex="0" aria-valuemin="1" aria-valuemax="10" aria-labelledby="f-l-' + c.k + '">' +
          '<div class="slider-track"><div class="slider-fill"></div></div><div class="slider-thumb"></div></div>' +
        '<button class="step" type="button" data-step="0.1" aria-label="Puja una dècima a ' + c.label + '">+</button>' +
      '</div></div>';
  }).join('');
  $('#flt-field').innerHTML = '<option value="global">Nota global</option>' + CRITERIA.map((c) => '<option value="' + c.k + '">' + c.label + '</option>').join('');
}
// Nota de un criterio: de 1 a 10 con una décima, o null (sin nota).
function clampScore(v) { return Math.round(Math.min(10, Math.max(1, v)) * 10) / 10; }
// pos: dónde dibujar el tirador mientras se arrastra (continuo); si no, va a la nota.
function setRate(k, v, pos) {
  v = v == null ? null : clampScore(v);
  draft.scores[k] = v;
  const num = $('#f-v-' + k);
  if (document.activeElement !== num) num.value = v == null ? '' : fmt(v);
  num.className = 'rate-num ' + (v == null ? 'is-empty' : cls(v));
  const s = $('#f-r-' + k);
  s.className = 'slider ' + (v == null ? 'is-empty' : cls(v)) + (s.classList.contains('is-dragging') ? ' is-dragging' : '');
  s.style.setProperty('--p', String(((pos != null ? pos : v == null ? 5 : v) - 1) / 9));
  s.setAttribute('aria-valuenow', v == null ? '' : String(v));
  s.setAttribute('aria-valuetext', v == null ? 'Sense nota' : fmt(v));
  renderRateTop();
}
// Deslizador: el tirador sigue al dedo sin saltos y la nota va de décima en décima; al soltar, el tirador
// se coloca en la nota. Tocar la barra lleva el tirador allí. Deslizar en vertical mueve la página, no la nota.
function sliderValue(s, clientX) {
  const r = s.getBoundingClientRect();
  const inset = 17; // medio tirador: la barra empieza y acaba en el centro del tirador
  const p = Math.min(1, Math.max(0, (clientX - r.left - inset) / (r.width - inset * 2)));
  return 1 + p * 9;
}
function wireSliders() {
  let drag = null;
  $('#rates').addEventListener('pointerdown', (e) => {
    const s = e.target.closest('.slider');
    if (!s || !draft) return;
    drag = { s, k: s.closest('.rate').dataset.k, x: e.clientX, y: e.clientY, id: e.pointerId, moved: false };
  });
  $('#rates').addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved) {
      // Empieza a arrastrar solo si el gesto es horizontal.
      if (Math.abs(e.clientX - drag.x) < 4) return;
      drag.moved = true;
      drag.s.classList.add('is-dragging');
      try { drag.s.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
    }
    const raw = sliderValue(drag.s, e.clientX);
    setRate(drag.k, raw, raw);
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    d.s.classList.remove('is-dragging');
    if (e.type === 'pointercancel') return;
    // Un toque sin arrastrar también pone la nota donde se ha tocado.
    setRate(d.k, d.moved ? draft.scores[d.k] : sliderValue(d.s, e.clientX));
  };
  $('#rates').addEventListener('pointerup', end);
  $('#rates').addEventListener('pointercancel', end);
  // Teclado: flechas, una décima; avance y retroceso de página, un punto; Inicio y Fin, 1 y 10.
  $('#rates').addEventListener('keydown', (e) => {
    const s = e.target.closest('.slider');
    if (!s || !draft) return;
    const k = s.closest('.rate').dataset.k;
    const cur = draft.scores[k] == null ? 5 : draft.scores[k];
    const map = { ArrowLeft: -0.1, ArrowDown: -0.1, ArrowRight: 0.1, ArrowUp: 0.1, PageDown: -1, PageUp: 1 };
    let v = null;
    if (e.key in map) v = cur + map[e.key];
    else if (e.key === 'Home') v = 1;
    else if (e.key === 'End') v = 10;
    if (v == null) return;
    e.preventDefault();
    setRate(k, v);
  });
  // Nota tecleada: acepta «8,6» u «8.6»; vacía, quita la nota del criterio.
  const typed = (e) => {
    const inp = e.target.closest('.rate-num');
    if (!inp || !draft) return;
    const k = inp.closest('.rate').dataset.k;
    const t = inp.value.replace(',', '.').trim();
    const n = parseFloat(t);
    if (!t) setRate(k, null);
    else if (!isNaN(n)) setRate(k, n);
    if (e.type === 'change') inp.value = draft.scores[k] == null ? '' : fmt(draft.scores[k]);
  };
  $('#rates').addEventListener('input', (e) => {
    // Mientras se escribe se actualiza la nota, pero no se reescribe el número.
    const inp = e.target.closest('.rate-num');
    if (!inp || !draft) return;
    const n = parseFloat(inp.value.replace(',', '.'));
    if (!isNaN(n) && n >= 1 && n <= 10) setRate(inp.closest('.rate').dataset.k, n);
  });
  $('#rates').addEventListener('change', typed);
  $('#rates').addEventListener('focusin', (e) => { if (e.target.closest('.rate-num')) e.target.select(); });
  $('#rates').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.closest('.rate-num')) { e.preventDefault(); e.target.blur(); }
  });
}
// Nota global grande con su color y su texto y, al lado, la roseta de quien puntúa, que se dibuja en directo.
function renderRateTop() {
  const g = globalOf(draft.scores);
  const box = $('#f-global');
  box.className = 'score is-big ' + cls(g) + (g == null ? ' is-empty' : '');
  box.textContent = fmt(g);
  $('#f-global-word').textContent = g == null ? '' : word(g);
  $('#f-rose').innerHTML = me ? chartSVG([{ uid: me.uid, scores: draft.scores }], true) : '';
}
function updateDateChips() {
  const v = $('#f-date').value;
  $$('#grp-datos [data-day]').forEach((b) => b.setAttribute('aria-pressed', v === dayISO(+b.dataset.day) ? 'true' : 'false'));
}

// «Pendent de visitar»: sin fecha ni nota (24 de noviembre de 2026). Al marcarlo se esconde la fecha y desaparece
// el bloque de la nota. Al editar solo se ofrece si nadie lo ha puntuado.
function setPending(on) {
  draft.pending = on;
  $('#f-pending').setAttribute('aria-pressed', on ? 'true' : 'false');
  $('#f-date-row').hidden = on;
  $('#f-pending-hint').hidden = !on;
  if (formMode === 'add') showStep(true);
  else if (formMode === 'edit') $('#grp-val').hidden = !formBlocks().includes('#grp-val');
}
// Recomendación de la página de inicio: solo al editar y solo con precio de menos de 40 €.
function updateFeaturedField() {
  const pr = $('#f-price input:checked');
  $('#fld-featured').hidden = !(formMode === 'edit' && pr && CHEAP_PRICES.includes(pr.value));
}
// Formato del texto (docs/diseno.md, sección 5, paso 4): los botones ponen o quitan las marcas de app/text.js.
let linkSel = null; // lo seleccionado en el texto al abrir el campo del enlace
function applyEdit(res) {
  const ta = $('#f-review');
  ta.value = res.value;
  ta.focus();
  ta.setSelectionRange(res.start, res.end);
}
function formatText(kind) {
  const ta = $('#f-review');
  applyEdit(toggleMark(ta.value, ta.selectionStart, ta.selectionEnd, MARKS[kind]));
}
function showLinkRow(on) {
  $('#f-link-row').hidden = !on;
  $('#f-link-btn').setAttribute('aria-expanded', on ? 'true' : 'false');
  $('#err-link').hidden = true;
  if (!on) return;
  const ta = $('#f-review');
  linkSel = [ta.selectionStart, ta.selectionEnd];
  $('#f-link-url').value = '';
  $('#f-link-url').focus();
}
function addLink() {
  const url = cleanURL($('#f-link-url').value);
  if (!url) { $('#err-link').hidden = false; $('#f-link-url').focus(); return; }
  const ta = $('#f-review');
  const sel = linkSel || [ta.value.length, ta.value.length];
  showLinkRow(false);
  applyEdit(insertLink(ta.value, sel[0], sel[1], url));
}

// Bloques de cada modo, en orden. En el alta son los pasos; si quien da de alta no puntúa o el restaurante
// está pendiente de visitar, no hay paso de nota.
const BLOCKS = ['#grp-ubic', '#grp-datos', '#grp-val', '#grp-res'];
function formBlocks() {
  if (formMode === 'rate') return ['#grp-val'];
  return BLOCKS.filter((s) => s !== '#grp-val' || (canRate() && !(draft && draft.pending)));
}
// Alta: se ve un bloque cada vez, con la barra de progreso, «Enrere» y «Següent» o «Desa el restaurant».
function showStep(keepScroll) {
  const blocks = formBlocks();
  const last = blocks.length - 1;
  BLOCKS.forEach((s) => { $(s).hidden = s !== blocks[formStep]; });
  $('#f-step-label').textContent = 'Pas ' + (formStep + 1) + ' de ' + blocks.length;
  $('#f-progress').innerHTML = blocks.map((s, i) => '<i' + (i <= formStep ? ' class="is-on"' : '') + '></i>').join('');
  $('#f-back').hidden = formStep === 0;
  $('#f-next').hidden = formStep === last;
  $('#f-save').hidden = formStep !== last;
  if (!keepScroll) $('#form').scrollTop = 0;
}
// visited: viene de «Ja hi hem anat» en la ficha de un pendiente; se abre con la fecha de hoy y la nota.
function startForm(mode, r, visited) {
  formMode = mode;
  const mine = r && me && r.ratings[me.uid];
  draft = {
    id: r ? r.id : null,
    name: r ? r.name : '', locality: r ? r.locality : '', address: r ? r.address : '', lat: r ? r.lat : null, lng: r ? r.lng : null,
    cuisines: r ? r.cuisines.slice() : [], price: r ? r.price : PRICES[1],
    visitDate: r && r.visitDate ? r.visitDate : todayISO(),
    pending: !!r && !r.visitDate && !visited,
    featured: !!r && r.featured,
    blog: r ? r.blog : '',
    photos: r ? r.photos.map((p) => ({ full: p.full, thumb: p.thumb, caption: p.caption || '', cover: !!p.cover })) : [],
    removed: [],
    placeId: r ? r.placeId : null,
    scores: mine ? Object.assign({}, mine.scores) : {},
    dish: mine ? mine.dish : ''
  };
  draft.origRating = ratingKey(draft.scores, draft.dish);
  formStep = 0;
  searchFailed = false;
  nameBeforeSearch = draft.name;
  autoLocality = '';
  typedText = '';
  localityManual = false;
  geoToken++;
  $('#form-title').textContent = mode === 'add' ? 'Afegeix un restaurant' : mode === 'edit' ? 'Edita · ' + r.name : (mine ? 'Edita la meva nota · ' : 'Puntua · ') + r.name;
  $('#f-save').textContent = mode === 'add' ? 'Desa el restaurant' : mode === 'edit' ? 'Desa els canvis' : 'Desa la meva nota';
  const blocks = formBlocks();
  BLOCKS.forEach((s) => { $(s).hidden = !blocks.includes(s); });
  $('#val-hint').hidden = mode !== 'add';
  $('#f-later').hidden = mode !== 'add';
  // Paso 1: en el alta se empieza por el buscador y la localidad no se ve; al editar, nombre y localidad a la vista.
  $('#f-locality').value = draft.locality;
  $('#localities').innerHTML = localities().map((l) => '<option value="' + esc(l) + '"></option>').join('');
  if (mode === 'add') {
    $('#f-name').value = '';
    showLocality(false);
    showSearch();
  } else if (mode === 'edit') {
    searchToken++;
    searchEl = null;
    showNameBox(draft.name);
    showLocality(true);
  }
  renderFormCuisines();
  $('#f-cuisine-new').hidden = true;
  $('#f-cuisine-text').value = '';
  $('#f-date').value = draft.visitDate;
  updateDateChips();
  // «Pendent de visitar»: en el alta siempre; al editar, si nadie lo ha puntuado.
  $('#f-pending-row').hidden = mode === 'rate' || (mode === 'edit' && Object.keys(r.ratings).length > 0);
  $('#f-featured').setAttribute('aria-pressed', draft.featured ? 'true' : 'false');
  $('#f-dish').value = draft.dish || '';
  $('#f-review').value = draft.blog;
  showLinkRow(false);
  $$('#f-price input').forEach((i) => { i.checked = i.value === draft.price; });
  updateFeaturedField();
  CRITERIA.forEach((c) => {
    const v = draft.scores[c.k];
    setRate(c.k, v == null ? null : v);
  });
  ['#err-name', '#err-muni', '#err-loc', '#err-rate'].forEach((s) => { $(s).hidden = true; });
  renderDraftPhotos();
  $('#f-progress-row').hidden = mode !== 'add';
  if (mode !== 'rate') setPending(draft.pending);
  if (mode === 'add') showStep();
  else {
    $('#f-back').hidden = true;
    $('#f-next').hidden = true;
    $('#f-save').hidden = false;
    $('#form').scrollTop = 0;
  }
  readForm();
  initialSnap = snapshot();
}
// Pasa lo escrito en el formulario al borrador.
function readForm() {
  if (!draft) return;
  draft.name = $('#f-namebox').hidden ? '' : $('#f-name').value.trim();
  draft.cuisines = cuisineList(draft.cuisines).filter((c) => draft.cuisines.includes(c));
  draft.visitDate = draft.pending ? '' : $('#f-date').value || todayISO();
  draft.locality = $('#f-locality').value.trim();
  draft.dish = $('#f-dish').value.trim();
  draft.blog = $('#f-review').value.trim();
  const pr = $('#f-price input:checked');
  draft.price = pr ? pr.value : PRICES[1];
  draft.featured = !$('#fld-featured').hidden && $('#f-featured').getAttribute('aria-pressed') === 'true';
}
function ratingKey(scores, dish) { return JSON.stringify([CRITERIA.map((c) => (scores[c.k] == null ? null : scores[c.k])), dish || '']); }
function snapshot() {
  return JSON.stringify([draft.name, draft.locality, draft.lat, draft.lng, draft.placeId, draft.cuisines, draft.price, draft.visitDate, draft.featured, draft.blog,
    ratingKey(draft.scores, draft.dish), draft.photos.map((p) => [p.thumb || p.preview, p.caption, !!p.cover])]);
}
// Comprueba un bloque y marca lo que falta. Devuelve adónde llevar la vista, o null si está completo.
function checkBlock(sel) {
  if (sel === '#grp-ubic') {
    let bad = null;
    $('#err-name').textContent = searching() ? 'Tria el restaurant de la llista o toca el mapa per situar-lo.' : 'Escriu el nom del restaurant.';
    $('#err-name').hidden = !!draft.name;
    if (!draft.name) bad = '#fld-name';
    $('#err-loc').hidden = draft.lat != null;
    if (draft.lat == null) bad = bad || '#pick-map';
    // La localidad solo se pide si la casilla se ve o si ya hay nombre y pin y Google no la ha dado.
    const needLocality = !$('#fld-locality').hidden || (draft.name && draft.lat != null);
    if (needLocality && !draft.locality) {
      showLocality(true);
      $('#err-muni').hidden = false;
      bad = bad || '#f-locality';
    } else $('#err-muni').hidden = true;
    return bad;
  }
  if (sel === '#grp-val') {
    const hasScore = CRITERIA.some((c) => draft.scores[c.k] != null);
    const need = formMode === 'rate' || !!draft.dish;
    $('#err-rate').hidden = !(need && !hasScore);
    return need && !hasScore ? '#rates' : null;
  }
  return null;
}
function showProblem(sel) {
  $(sel).scrollIntoView({ block: 'center' });
  toast('Falten dades per omplir');
}
function nextStep() {
  readForm();
  const blocks = formBlocks();
  const bad = checkBlock(blocks[formStep]);
  if (bad) { showProblem(bad); return; }
  if (formStep < blocks.length - 1) { formStep++; showStep(); }
}
function closeForm() {
  const back = draft && draft.id;
  if (draft) draft.photos.forEach((p) => { if (p.preview) URL.revokeObjectURL(p.preview); });
  draft = null;
  searchToken++;
  setView(lastBrowse);
  if (back && byId(back)) openDetail(back);
}
// Cerrar con algo puesto pide confirmación; sin cambios, se cierra directamente.
function askCloseForm() {
  if (!draft || saving) return;
  readForm();
  if (snapshot() === initialSnap) { closeForm(); return; }
  const title = formMode === 'add' ? 'Vols descartar aquest restaurant?' : formMode === 'edit' ? 'Vols descartar els canvis?' : 'Vols descartar la nota?';
  askConfirm(title, 'El que has posat no es desarà.', closeForm, 'Descarta');
}
function renderFormCuisines() {
  $('#f-cuisines').innerHTML = cuisineList(draft.cuisines).map((c) =>
    '<button class="chip" type="button" aria-pressed="' + (draft.cuisines.includes(c) ? 'true' : 'false') + '" data-c="' + esc(c) + '">' + esc(c) + '</button>').join('') +
    '<button class="chip chip-add" type="button" id="f-cuisine-add">+ Afegeix</button>';
}
// Añade un tipo de cocina nuevo (o marca el que ya exista escrito con otras mayúsculas o tildes).
function addCuisine() {
  const text = $('#f-cuisine-text').value.replace(/\s+/g, ' ').trim();
  if (text) {
    const found = cuisineList(draft.cuisines).find((c) => norm(c) === norm(text)) || text;
    if (!draft.cuisines.includes(found)) draft.cuisines.push(found);
    renderFormCuisines();
  }
  $('#f-cuisine-text').value = '';
  $('#f-cuisine-new').hidden = true;
}
function renderDraftPhotos() {
  const box = $('#f-thumbs');
  box.hidden = !draft.photos.length;
  const ci = coverIndex(draft.photos);
  box.innerHTML = draft.photos.map((p, i) =>
    '<div class="photo-edit">' +
      '<div class="thumb">' + (p.preview ? '<img src="' + p.preview + '" alt="Foto ' + (i + 1) + '">' : '<img data-path="' + esc(p.thumb) + '" alt="Foto ' + (i + 1) + '">') +
      '<button class="thumb-x" type="button" data-rmphoto="' + i + '" aria-label="Treu la foto ' + (i + 1) + '">' + XICON + '</button></div>' +
      '<div class="photo-edit-side">' +
        '<input class="input" type="text" maxlength="200" placeholder="Peu de foto" aria-label="Peu de la foto ' + (i + 1) + '" data-cap="' + i + '" value="' + esc(p.caption) + '">' +
        '<button class="chip cover-btn" type="button" data-cover="' + i + '" aria-pressed="' + (i === ci ? 'true' : 'false') + '">' + STAR + (i === ci ? 'Portada' : 'Fes-la portada') + '</button>' +
      '</div>' +
    '</div>').join('');
  hydratePhotos(box);
}
async function saveForm() {
  if (saving || !draft) return;
  readForm();
  const blocks = formBlocks();
  for (let i = 0; i < blocks.length; i++) {
    const bad = checkBlock(blocks[i]);
    if (bad) {
      if (formMode === 'add' && formStep !== i) { formStep = i; showStep(); }
      showProblem(bad);
      return;
    }
  }
  const hasScore = CRITERIA.some((c) => draft.scores[c.k] != null);
  const rateOn = blocks.includes('#grp-val');

  saving = true;
  const btn = $('#f-save');
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Desant…';
  try {
    const rating = { scores: Object.assign({}, draft.scores), dish: draft.dish };
    let id = draft.id;
    if (formMode === 'rate') {
      await store.saveMyRating(id, rating);
    } else {
      if (formMode === 'add') id = store.newRestaurantId();
      // Sube las fotos nuevas antes de guardar la ficha.
      const photos = [];
      const fresh = draft.photos.filter((p) => p.file).length;
      let done = 0;
      for (const p of draft.photos) {
        if (p.file) {
          done++;
          btn.textContent = 'Pujant la foto ' + done + ' de ' + fresh + '…';
          const prepared = await preparePhoto(p.file);
          const paths = await store.uploadPhoto(id, prepared.full, prepared.thumb);
          photos.push({ ...paths, caption: p.caption, cover: !!p.cover });
        } else {
          photos.push({ full: p.full, thumb: p.thumb, caption: p.caption, cover: !!p.cover });
        }
      }
      btn.textContent = 'Desant…';
      const data = { name: draft.name, locality: draft.locality, address: draft.address, lat: draft.lat, lng: draft.lng, cuisines: draft.cuisines, price: draft.price, visitDate: draft.visitDate, featured: draft.featured, blog: draft.blog, photos, placeId: draft.placeId };
      if (formMode === 'add') await store.createRestaurant(id, data, rateOn && hasScore ? rating : null);
      else {
        await store.updateRestaurant(id, data);
        // Al editar, la nota de quien puntúa solo se guarda si la ha cambiado.
        if (rateOn && hasScore && ratingKey(draft.scores, draft.dish) !== draft.origRating) await store.saveMyRating(id, rating);
      }
      for (const p of draft.removed) { try { await store.removePhotoFiles(p); } catch (e) { console.warn('No se ha podido borrar una foto', e); } }
    }
    const msg = formMode === 'add' ? 'Restaurant afegit' : formMode === 'edit' ? 'Canvis desats' : 'Nota desada';
    draft.photos.forEach((p) => { if (p.preview) URL.revokeObjectURL(p.preview); });
    draft = null;
    selectedId = id;
    setView(lastBrowse);
    if (byId(id)) openDetail(id); else pendingOpen = id;
    toast(msg);
  } catch (e) {
    console.error(e);
    toast('No s’ha pogut desar: ' + errText(e));
  } finally {
    saving = false;
    btn.disabled = false;
    btn.textContent = label;
  }
}

// ---------- Hojas: filtros, nota, perfil, confirmar ----------
function chipToggle(v, on, group) {
  return '<button class="chip" type="button" aria-pressed="' + (on ? 'true' : 'false') + '" data-g="' + group + '" data-v="' + esc(v) + '">' + esc(v) + '</button>';
}
function buildFilterChips() {
  const cs = cuisineList().filter((c) => restaurants.some((r) => r.cuisines.includes(c)));
  $('#flt-cuisines').innerHTML = cs.map((c) => chipToggle(c, filters.cuisines.has(c), 'cuisines')).join('');
  $('#flt-munis').innerHTML = localities().map((c) => chipToggle(c, filters.munis.has(c), 'munis')).join('');
  $('#flt-prices').innerHTML = PRICES.map((c) => chipToggle(c, filters.prices.has(c), 'prices')).join('');
  $('#flt-field').value = filters.field;
  $('#flt-min').value = filters.min;
  $('#flt-min-out').textContent = filters.min > 0 ? fmt(filters.min) + ' o més' : 'Qualsevol';
}
function renderWho() {
  $('#who-opts').innerHTML = '<button type="button" data-who="all">Mitjana</button>' +
    people.map((p) => '<button type="button" data-who="' + p.color + '" class="p-' + p.color + '"><i class="dot"></i>' + esc(p.name) + '</button>').join('');
  $('#who-opts').style.gridTemplateColumns = 'repeat(' + (people.length + 1) + ', 1fr)';
  $$('#who-opts [data-who]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.who === who ? 'true' : 'false'));
  const n = filtered().length;
  $('#who-apply').textContent = 'Mostra ' + (n === 1 ? '1 restaurant' : n + ' restaurants');
}
const ROLE_NAMES = { owner: 'Propietari', editor: 'Editor', viewer: 'Convidat (només mira)' };
// Perfil de quien ha entrado. Sin permiso para editar, solo se ve con qué correo y se puede salir.
function renderProfile() {
  const member = canEditData();
  const p = person(me.uid);
  $('#p-name-field').hidden = !member;
  $('#p-save').hidden = !member;
  $('#sheet-profile .sheet-foot').classList.toggle('one', !member);
  $('#p-name').value = p ? p.name : (me.displayName || '');
  $('#p-role').innerHTML = member
    ? 'Paper: <b>' + ROLE_NAMES[me.role] + '</b>' + (me.color ? ' · puntues en <b class="p-' + me.color + '" style="color:var(--pc-text)">' + COLOR_NAMES[me.color] + '</b>' : '') +
      '<br><span class="meta">' + esc(me.email) + '</span>'
    : 'Has entrat com a <b>' + esc(me.email) + '</b>. Pots veure-ho tot, però no afegir ni puntuar restaurants: t’hi ha de donar permís un propietari.';
  // Los permisos se dan y se quitan en la consola de Firebase (docs/accesos.md).
  $('#p-extra').innerHTML = me.role === 'owner'
    ? '<p class="meta">Els permisos per afegir i puntuar es donen i es treuen a la consola de Firebase, a la col·lecció <b>members</b>.</p>' : '';
}
// Botón de arriba a la derecha: «Entra» sin sesión; con sesión, la inicial en el color de quien puntúa.
function applyRole() {
  $('#tab-add').hidden = !canEditData();
  $('#tabs').classList.toggle('is-viewer', !canEditData());
  const btn = $('#btn-profile');
  if (!me) {
    btn.className = 'btn btn-enter';
    btn.setAttribute('aria-label', 'Entra amb Google per afegir i puntuar');
    $('#avatar-ini').textContent = 'Entra';
    return;
  }
  btn.setAttribute('aria-label', 'El teu perfil');
  $('#avatar-ini').textContent = ((person(me.uid) || {}).name || me.displayName || me.email || '?').charAt(0).toUpperCase();
  btn.className = 'avatar' + (me.color ? ' p-' + me.color : '');
}
async function signIn() {
  try { await store.signIn(); } catch (e) {
    if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
    toast('No s’ha pogut entrar: ' + errText(e));
  }
}
function askConfirm(title, text, fn, okLabel) {
  $('#cf-title').textContent = title;
  $('#cf-text').textContent = text;
  $('#cf-ok').textContent = okLabel || 'Esborra';
  confirmFn = fn;
  $('#sheet-confirm').hidden = false;
}

// ---------- Eventos ----------
function wire() {
  // Las fotos avisan al cargar o al fallar (los eventos de imagen no suben: se escuchan en captura).
  document.addEventListener('load', (e) => { if (e.target instanceof HTMLImageElement) markPhoto(e.target, true); }, true);
  document.addEventListener('error', (e) => { if (e.target instanceof HTMLImageElement) markPhoto(e.target, false); }, true);
  $$('.tabs button').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.view === 'form' && !(view === 'form' && formMode === 'add')) startForm('add', null);
    setView(b.dataset.view);
  }));
  $('#q').addEventListener('input', (e) => { filters.q = e.target.value; render(); });
  $('#btn-filters').addEventListener('click', () => { buildFilterChips(); $('#sheet-filters').hidden = false; });
  $$('[data-close]').forEach((b) => b.addEventListener('click', () => { b.closest('.sheet').hidden = true; }));
  $('#flt-min').addEventListener('input', (e) => {
    filters.min = parseFloat(e.target.value);
    $('#flt-min-out').textContent = filters.min > 0 ? fmt(filters.min) + ' o més' : 'Qualsevol';
    render();
  });
  $('#flt-field').addEventListener('change', (e) => { filters.field = e.target.value; render(); });
  $('#sheet-filters').addEventListener('click', (e) => {
    const c = e.target.closest('.chip[data-g]');
    if (!c) return;
    const set = filters[c.dataset.g];
    if (set.has(c.dataset.v)) set.delete(c.dataset.v); else set.add(c.dataset.v);
    c.setAttribute('aria-pressed', set.has(c.dataset.v) ? 'true' : 'false');
    render();
  });
  $('#flt-clear').addEventListener('click', () => { clearFilters(); buildFilterChips(); render(); });
  $('#active-chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-rm]');
    if (b) {
      if (b.dataset.rm === 'min') { filters.min = 0; filters.field = 'global'; } else filters[b.dataset.rm].delete(b.dataset.v);
      render();
      return;
    }
    if (e.target.closest('[data-act="clear"]')) { clearFilters(); render(); }
  });
  $$('.seg [data-sort]').forEach((b) => b.addEventListener('click', () => {
    sortBy = b.dataset.sort;
    $$('.seg [data-sort]').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    render();
  }));
  $('#list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'open') openDetail(b.dataset.id);
    if (b.dataset.act === 'clear') { clearFilters(); render(); }
  });
  // La foto de Google se queda los toques: se recogen antes de que le lleguen (fase de captura) y abren la ficha.
  // La franja de abajo, con la atribución de Google y su botón ⓘ, se deja para Google.
  $('#home').addEventListener('click', (e) => {
    const box = e.target.closest && e.target.closest('.hcard-google');
    if (!box || box.dataset.state !== 'loaded') return;
    if (e.clientY > box.getBoundingClientRect().bottom - 44) return;
    e.stopPropagation();
    openDetail(box.dataset.id);
  }, true);
  $('#home').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'open') openDetail(b.dataset.id);
    if (b.dataset.act === 'map-filter') showFilteredMap(b.dataset.g, b.dataset.v);
  });
  $('#preview').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'open') openDetail(b.dataset.id);
    if (b.dataset.act === 'close-preview') { selectedId = null; render(); }
  });
  $('#detail').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const r = byId(detailId);
    const act = b.dataset.act;
    if (act === 'back') { closeDetail(); return; }
    if (!r) return;
    if (act === 'share') shareRestaurant(r);
    if (act === 'edit') { closeDetail(); startForm('edit', r); setView('form'); }
    if (act === 'rate') { closeDetail(); startForm('rate', r); setView('form'); }
    if (act === 'visited') {
      closeDetail();
      startForm('edit', r, true);
      setView('form');
      $('#f-date-row').scrollIntoView({ block: 'center' });
    }
    if (act === 'delete') {
      askConfirm('Vols esborrar aquest restaurant?', 'S’esborrarà la fitxa ' + de(r.name) + ' amb les notes, el comentari i les fotos. No es pot desfer.', async () => {
        try {
          await store.deleteRestaurant(r);
          if (selectedId === r.id) selectedId = null;
          closeDetail();
          toast('Restaurant esborrat');
        } catch (err) { toast('No s’ha pogut esborrar: ' + errText(err)); }
      });
    }
    // Etiqueta tocable: abre el mapa con ese filtro, sustituyendo los que hubiera.
    if (act === 'tag') showFilteredMap(b.dataset.g, b.dataset.v);
    if (act === 'photo') {
      openLightbox(r.photos, +b.dataset.i);
    }
    if (act === 'show-on-map') {
      if (!passes(r)) { clearFilters(); toast('Filtres trets per mostrar-lo'); }
      selectedId = r.id;
      closeDetail();
      setView('map');
      render();
      if (mainMap) setTimeout(() => mainMap.focus(r.lat, r.lng, 14, $('#preview').offsetHeight + 12), 30);
    }
  });
  $('#cf-ok').addEventListener('click', () => {
    const fn = confirmFn;
    confirmFn = null;
    $('#sheet-confirm').hidden = true;
    if (fn) fn();
  });
  $('#lightbox-close').addEventListener('click', closeLightbox);
  $('#lightbox').addEventListener('click', (e) => { if (e.target.id === 'lightbox') closeLightbox(); });
  $('#lightbox-prev').addEventListener('click', () => showLightboxPhoto(lbIndex - 1));
  $('#lightbox-next').addEventListener('click', () => showLightboxPhoto(lbIndex + 1));
  // Deslizar el dedo en horizontal pasa de foto.
  let swipe = null;
  $('#lightbox').addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    swipe = e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null;
  }, { passive: true });
  $('#lightbox').addEventListener('touchend', (e) => {
    if (!swipe || lbPhotos.length < 2) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipe.x;
    const dy = t.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) showLightboxPhoto(lbIndex + (dx < 0 ? 1 : -1));
  }, { passive: true });

  // Formulario. Intro en un campo solo cierra el teclado: se guarda con el botón.
  $('#form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  });
  $('#f-save').addEventListener('click', saveForm);
  $('#f-close').addEventListener('click', askCloseForm);
  $('#f-next').addEventListener('click', nextStep);
  $('#f-back').addEventListener('click', () => {
    readForm();
    if (formStep > 0) { formStep--; showStep(); }
  });
  $('#f-later').addEventListener('click', () => {
    CRITERIA.forEach((c) => setRate(c.k, null));
    $('#f-dish').value = '';
    $('#err-rate').hidden = true;
    nextStep();
  });
  $('#f-name-x').addEventListener('click', () => {
    nameBeforeSearch = $('#f-name').value.trim();
    showSearch();
  });
  $('#f-name').addEventListener('input', () => { $('#err-name').hidden = true; });
  $('#f-locality').addEventListener('input', () => {
    $('#err-muni').hidden = true;
    localityManual = !!$('#f-locality').value.trim();
  });
  // Los eventos de teclado de la casilla de Google salen de ella aunque su texto no se pueda leer.
  $('#f-gsearch').addEventListener('beforeinput', trackSearchTyping, true);
  $('#f-gsearch').addEventListener('compositionend', trackSearchTyping, true);
  $$('#grp-datos [data-day]').forEach((b) => b.addEventListener('click', () => {
    $('#f-date').value = dayISO(+b.dataset.day);
    updateDateChips();
  }));
  ['input', 'change'].forEach((t) => $('#f-date').addEventListener(t, updateDateChips));
  $('#f-pending').addEventListener('click', () => setPending(!draft.pending));
  $('#f-price').addEventListener('change', updateFeaturedField);
  $('#f-featured').addEventListener('click', (e) => {
    const b = e.currentTarget;
    b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
  });
  wireSliders();
  $('#rates').addEventListener('click', (e) => {
    const b = e.target.closest('.step');
    if (!b) return;
    const k = b.closest('.rate').dataset.k;
    const cur = draft.scores[k];
    setRate(k, cur == null ? 5 : cur + parseFloat(b.dataset.step));
  });
  $('#f-cuisines').addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    if (b.id === 'f-cuisine-add') {
      $('#f-cuisine-new').hidden = false;
      $('#f-cuisine-text').focus();
      return;
    }
    const i = draft.cuisines.indexOf(b.dataset.c);
    if (i >= 0) draft.cuisines.splice(i, 1); else draft.cuisines.push(b.dataset.c);
    b.setAttribute('aria-pressed', i >= 0 ? 'false' : 'true');
  });
  // Formato del texto. Los botones no se llevan el foco: no se cierra el teclado ni se pierde la selección.
  $('#f-fmt').addEventListener('mousedown', (e) => { if (e.target.closest('button')) e.preventDefault(); });
  $('#f-fmt').addEventListener('click', (e) => {
    const b = e.target.closest('[data-fmt]');
    if (!b) return;
    if (b.dataset.fmt === 'link') showLinkRow($('#f-link-row').hidden);
    else formatText(b.dataset.fmt);
  });
  $('#f-link-ok').addEventListener('click', addLink);
  $('#f-link-url').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addLink(); }
    if (e.key === 'Escape') { e.preventDefault(); showLinkRow(false); $('#f-review').focus(); }
  });
  $('#f-link-url').addEventListener('input', () => { $('#err-link').hidden = true; });
  $('#f-cuisine-ok').addEventListener('click', addCuisine);
  $('#f-cuisine-text').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addCuisine(); }
  });
  $('#f-photos').addEventListener('change', (e) => {
    Array.prototype.forEach.call(e.target.files, (f) => {
      if (f.type.indexOf('image/') === 0 || /\.(heic|heif)$/i.test(f.name)) draft.photos.push({ file: f, preview: URL.createObjectURL(f), caption: '' });
    });
    e.target.value = '';
    renderDraftPhotos();
  });
  $('#f-thumbs').addEventListener('click', (e) => {
    const c = e.target.closest('[data-cover]');
    if (c) {
      const i = +c.dataset.cover;
      draft.photos.forEach((p, j) => { p.cover = j === i; });
      renderDraftPhotos();
      return;
    }
    const b = e.target.closest('[data-rmphoto]');
    if (!b) return;
    const [p] = draft.photos.splice(+b.dataset.rmphoto, 1);
    if (p.preview) URL.revokeObjectURL(p.preview); else draft.removed.push(p);
    renderDraftPhotos();
  });
  $('#f-thumbs').addEventListener('input', (e) => {
    const i = e.target.dataset.cap;
    if (i != null && draft) draft.photos[+i].caption = e.target.value;
  });
  $('#f-geo').addEventListener('click', () => {
    if (!navigator.geolocation) { toast('Aquest dispositiu no dona la ubicació'); return; }
    toast('Cercant la teva ubicació…');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const m = await ensurePickMap();
      const { latitude: lat, longitude: lng } = pos.coords;
      m.setPin(lat, lng);
      m.center(lat, lng, 17);
      setDraftLocation(lat, lng);
    }, (err) => toast(err.code === 1 ? 'Sense permís per usar la teva ubicació' : 'No s’ha pogut obtenir la teva ubicació'), { enableHighAccuracy: true, timeout: 15000 });
  });

  // Nota: media o cada persona
  $('#btn-who').addEventListener('click', () => { renderWho(); $('#sheet-who').hidden = false; });
  $('#who-opts').addEventListener('click', (e) => {
    const q = e.target.closest('[data-who]');
    if (!q) return;
    who = q.dataset.who;
    saveWho();
    render();
    renderWho();
  });

  // Perfil
  $('#btn-profile').addEventListener('click', () => {
    if (!me) { signIn(); return; }
    renderProfile();
    $('#sheet-profile').hidden = false;
  });
  $('#p-save').addEventListener('click', async () => {
    const name = $('#p-name').value.trim();
    if (!name) { toast('Escriu un nom'); return; }
    try {
      await store.saveProfile(me.uid, name, me.color);
      me.displayName = name;
      $('#sheet-profile').hidden = true;
      toast('Nom desat');
    } catch (e) { toast('No s’ha pogut desar: ' + errText(e)); }
  });
  $('#p-logout').addEventListener('click', () => { $('#sheet-profile').hidden = true; store.logOut(); });

  document.addEventListener('keydown', (e) => {
    if (!$('#lightbox').hidden && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      showLightboxPhoto(lbIndex + (e.key === 'ArrowRight' ? 1 : -1));
      return;
    }
    if (e.key !== 'Escape') return;
    if (!$('#lightbox').hidden) { closeLightbox(); return; }
    const open = $$('.sheet').filter((s) => !s.hidden && s.id !== 'sheet-name')[0];
    if (open) { open.hidden = true; return; }
    if (!$('#detail').hidden) { closeDetail(); return; }
    if (view === 'form') askCloseForm();
  });
}

// ---------- Arranque y sesión ----------
// La app se ve sin entrar, en solo lectura (desde el 24 de noviembre de 2026). Entrar con Google solo hace
// falta para añadir, editar y puntuar, y lo deciden los permisos de members/{correo} (docs/accesos.md).
function showScreen(id) {
  ['loading'].forEach((s) => { $('#' + s).hidden = s !== id; });
}
function askName(suggestion) {
  return new Promise((resolve) => {
    $('#n-name').value = suggestion || '';
    $('#sheet-name').hidden = false;
    const done = () => {
      const v = $('#n-name').value.trim();
      if (!v) { toast('Escriu un nom'); return; }
      $('#n-save').removeEventListener('click', done);
      $('#sheet-name').hidden = true;
      resolve(v);
    };
    $('#n-save').addEventListener('click', done);
  });
}
function onData(data) {
  people = data.people;
  restaurants = data.restaurants;
  dataReady = true;
  applyRole();
  buildFilterChips();
  render();
  if (linkId) {
    // Ficha de un enlace compartido (?r=id).
    const id = linkId;
    linkId = null;
    if (byId(id)) openDetail(id); else toast('Aquest restaurant ja no hi és');
  } else if (pendingOpen && byId(pendingOpen)) { const id = pendingOpen; pendingOpen = null; openDetail(id); }
  else if (detailId) openDetail(detailId, true);
}
async function startSession(user) {
  if (stopWatch) { stopWatch(); stopWatch = null; }
  me = null;
  if (user) {
    let m = null;
    try { m = await store.getMembership(user); } catch (e) {
      console.error(e);
      toast('No s’ha pogut comprovar el teu permís: ' + errText(e));
    }
    me = { uid: user.uid, email: user.email, role: m && ROLE_NAMES[m.role] ? m.role : null, color: m ? m.color : null, displayName: '' };
    // El nombre visible solo lo tienen quienes pueden editar (users/{uid} solo lo escriben ellos).
    if (canEditData()) {
      try {
        const prof = await store.getProfile(user.uid);
        let name = prof && prof.displayName;
        if (!name) { showScreen(null); name = await askName((user.displayName || '').split(' ')[0]); }
        me.displayName = name;
        if (!prof || prof.displayName !== name || (prof.color || null) !== (m.color || null)) await store.saveProfile(user.uid, name, m.color);
      } catch (e) { console.error(e); toast('No s’ha pogut desar el teu nom: ' + errText(e)); }
    }
  }
  // Sin permiso para editar no se puede seguir en el formulario.
  if (view === 'form' && !canEditData()) { draft = null; setView(lastBrowse); }
  showScreen(null);
  applyRole();
  if (dataReady) {
    render();
    if (detailId) openDetail(detailId, true);
  }
  // Los datos se vuelven a pedir con cada cambio de sesión: así nadie se queda sin ellos si una lectura
  // sin entrar se rechazara.
  stopWatch = store.watchAll(onData, (e) => { console.error(e); toast('Error en llegir les dades: ' + errText(e)); });
  if (!mainMap) {
    createMainMap($('#map'), { onMapClick: () => { if (selectedId) { selectedId = null; render(); } } })
      .then((m2) => { mainMap = m2; if (dataReady) render(); })
      .catch((e) => { $('#map').innerHTML = '<p class="map-error">No s’ha pogut carregar el mapa: ' + esc(errText(e)) + '</p>'; });
  }
}

// Modo de muestra para revisar la interfaz en local sin iniciar sesión: solo en localhost y con ?muestra.
// Usa datos inventados y no escribe en Firebase.
function localPreview() {
  const sc = (a) => ({ producto: a[0], plato: a[1], tecnica: a[2], servicio: a[3], precio: a[4], ambiente: a[5] });
  // Foto inventada, dibujada aquí mismo: el repo es público y no lleva fotos de restaurantes.
  const FOTO = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9c9a0"/><stop offset="1" stop-color="#8a5a3c"/></linearGradient></defs>' +
    '<rect width="1200" height="800" fill="url(#g)"/><circle cx="420" cy="430" r="250" fill="#f6efe6"/><circle cx="420" cy="430" r="190" fill="#e7d6c1"/>' +
    '<circle cx="380" cy="400" r="70" fill="#c0563b"/><circle cx="470" cy="470" r="55" fill="#7c9a4a"/><circle cx="900" cy="300" r="120" fill="#5b3a2a" opacity=".55"/></svg>');
  const FOTO2 = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">' +
    '<rect width="1200" height="800" fill="#2f4a3a"/><rect x="140" y="420" width="920" height="40" rx="20" fill="#c9a77c"/>' +
    '<circle cx="420" cy="330" r="110" fill="#f2e6d0"/><circle cx="780" cy="330" r="110" fill="#f2e6d0"/><circle cx="420" cy="330" r="60" fill="#d27a3c"/><circle cx="780" cy="330" r="60" fill="#e0b84a"/></svg>');
  // Con ?muestra&visitant se ve como alguien que no ha entrado.
  me = params.has('visitant') ? null : { uid: 'u1', email: 'muestra@localhost', role: 'owner', color: 'azul', displayName: 'Isidre' };
  showScreen(null);
  applyRole();
  // Con &gplace=<placeId>, los de muestra sin fotos usan ese sitio de Google; con &sensefotos, Can Exemple tampoco tiene.
  const gplace = params.get('gplace') || null;
  const sense = params.has('sensefotos');
  onData({
    people: [{ uid: 'u1', name: 'Isidre', color: 'azul' }, { uid: 'u2', name: 'Cris', color: 'rosa' }],
    restaurants: [
      { id: 'm1', name: 'Can Exemple', locality: 'Palma', lat: 39.5712, lng: 2.6498, cuisines: ['Mallorquí', 'Arrossos'], price: PRICES[1], featured: true, address: 'Carrer de Mostra, 1, 07001 Palma, Illes Balears', visitDate: '2026-10-17',
        blog: 'Primer paràgraf de mostra, amb **negreta**, *cursiva*, __subratllat__ i un [enllaç a una altra web](https://www.example.com/).\n\nSegon paràgraf.', photos: sense ? [] : [{ full: FOTO, thumb: FOTO, caption: 'Foto de mostra' }, { full: FOTO2, thumb: FOTO2, caption: 'Segona foto' }], placeId: gplace, ratings: { u1: { scores: sc([8.5, 9, 7, 8, 8.5, 7.5]), dish: 'Arròs brut' }, u2: { scores: sc([9, 9, 8, 8.5, 9, 7]), dish: 'Llom amb col' } } },
      { id: 'm2', name: 'Sa Fonda Fictícia', locality: 'Sóller', lat: 39.7665, lng: 2.7152, cuisines: ['Menú degustació', 'Peix i marisc'], price: PRICES[2], visitDate: '2026-09-05',
        blog: '', photos: [], placeId: gplace, ratings: { u2: { scores: sc([9.5, 10, 9, 9, 6, 9.5]), dish: 'Gamba roja' } } },
      { id: 'm3', name: 'Bodega Sense Nom', locality: 'Palma', lat: 39.5745, lng: 2.6551, cuisines: ['Autor'], price: PRICES[0], visitDate: '2026-11-07',
        blog: '', photos: [], placeId: null, ratings: {} },
      { id: 'm4', name: 'Celler Pendent', locality: 'Palma', lat: 39.5689, lng: 2.6420, cuisines: ['Menú degustació'], price: PRICES[4], visitDate: '',
        blog: '', photos: [], placeId: gplace, ratings: {} }
    ]
  });
  createMainMap($('#map'), { onMapClick: () => { if (selectedId) { selectedId = null; render(); } } })
    .then((m2) => { mainMap = m2; render(); })
    .catch((e) => { $('#map').innerHTML = '<p class="map-error">No s’ha pogut carregar el mapa: ' + esc(errText(e)) + '</p>'; });
}

buildFormStatics();
wire();
setView(view);
// Enlace compartido a una ficha: se abre al llegar los datos y se quita de la dirección.
const params = new URLSearchParams(location.search);
if (params.get('r')) {
  linkId = params.get('r');
  const rest = new URLSearchParams(params);
  rest.delete('r');
  history.replaceState(null, '', location.pathname + (rest.toString() ? '?' + rest.toString() : ''));
}
if (location.hostname === 'localhost' && params.has('muestra')) localPreview();
else store.onSession(startSession);

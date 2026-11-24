// Puntuam a taula: interfaz. Porta la demo aprobada (demo/index.html) con los cambios de docs/diseno.md.
import { CRITERIA, CUISINES, PRICES, COLORS, COLOR_NAMES } from './config.js';
import * as store from './store.js';
import { createMainMap, createPickMap, createPlaceSearch, searchText } from './maps.js';
import { preparePhoto } from './photos.js';

// ---------- Estado ----------
let me = null;            // { uid, email, role, color }
let people = [];          // quienes puntúan: [{ uid, name, color }]
let restaurants = [];
let stopWatch = null;
let dataReady = false;
let pendingOpen = null;   // ficha que abrir cuando lleguen los datos guardados

const filters = { q: '', min: 0, field: 'global', cuisines: new Set(), munis: new Set(), prices: new Set() };
let sortBy = 'nota';
let view = 'map';
let lastBrowse = 'map';
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
    '<span class="score ' + cls(g) + (g == null ? ' is-empty' : '') + '">' + fmt(g) + '</span>' +
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
    return { id: r.id, lat: r.lat, lng: r.lng, text: g == null ? '·' : fmt(g), klass: cls(g), title: r.name + ', nota ' + fmt(g), selected: r.id === selectedId };
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
  box.hidden = !chips.length || view === 'form';
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
  $('#tools').hidden = v === 'form';
  // El formulario ocupa la pantalla con su X arriba y sus botones abajo: el menú flotante se oculta.
  $('#tabs').hidden = v === 'form';
  $('#active-chips').hidden = v === 'form' || !activeCount();
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
function blogHTML(text) {
  return text.split(/\n\s*\n/).map((p) => '<p>' + esc(p.trim()).replace(/\n/g, '<br>') + '</p>').join('');
}
function hydratePhotos(root) {
  $$('img[data-path]', root).forEach((img) => {
    store.photoURL(img.dataset.path).then((url) => { img.src = url; }).catch(() => {
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
  const cover = ci < 0 ? '' :
    '<button class="thumb cover" type="button" data-act="photo" data-i="' + ci + '" aria-label="Amplia la portada">' +
    '<img data-path="' + esc(r.photos[ci].full) + '" alt="' + esc(r.photos[ci].caption || 'Portada') + '"></button>';
  const mine = me && r.ratings[me.uid];
  const actions = (canEditData() ? '<button class="link-btn" type="button" data-act="edit">Edita</button>' : '') +
    (canDelete() ? '<button class="link-btn is-danger" type="button" data-act="delete">Esborra</button>' : '');
  $('#detail').innerHTML =
    '<div class="panel-bar">' +
      '<button class="link-btn" type="button" data-act="back"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg>Torna</button>' +
      '<div class="panel-actions">' + actions + '</div>' +
    '</div>' +
    '<div class="panel-body">' +
      cover +
      '<div class="d-head">' +
        '<h2>' + esc(r.name) + '</h2>' +
        (r.address ? '<p class="meta d-address">' + esc(r.address) + '</p>' : '') +
        '<div class="tags">' + (r.locality ? tagBtn('munis', r.locality) : '') + r.cuisines.map((c) => tagBtn('cuisines', c)).join('') + tagBtn('prices', r.price) + '</div>' +
        (r.visitDate ? '<p class="meta">Visitat el ' + esc(fmtDate(r.visitDate)) + '</p>' : '') +
      '</div>' +
      '<div class="card d-score">' +
        '<div class="score is-big ' + cls(g) + (g == null ? ' is-empty' : '') + '">' + fmt(g) + '</div>' +
        '<div class="d-score-text"><strong>' + word(g) + '</strong><span class="meta">' + esc(scoreText) + '</span></div>' +
      '</div>' +
      (raters.length
        ? '<div class="card crit">' + legend + critHTML + pscores +
            (missing.length ? '<p class="hint">' + missing.map((p) => esc(p.name)).join(' i ') + ' encara no l’ha puntuat.</p>' : '') +
          '</div>' + rose
        : '<div class="card"><p class="meta">Encara no l’ha puntuat ningú.</p></div>') +
      (canRate() ? '<button class="btn btn-primary btn-block" type="button" data-act="rate">' + (mine ? 'Edita la meva nota' : 'Puntua aquest restaurant') + '</button>' : '') +
      (r.blog ? '<div class="card"><p class="section-title">Comentari</p><div class="blog">' + blogHTML(r.blog) + '</div></div>' : '') +
      (photos ? '<div class="card"><p class="section-title">Fotos</p><div class="photos">' + photos + '</div></div>' : '') +
      '<button class="btn btn-block" type="button" data-act="show-on-map">Mostra al mapa</button>' +
    '</div>';
  $('#detail').hidden = false;
  $('#detail .panel-body').scrollTop = prevScroll;
  hydratePhotos($('#detail'));
}
function closeDetail() { $('#detail').hidden = true; detailId = null; }

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
  // La localidad sale de la dirección de Google y en el alta no se muestra; si Google no la da, se pide.
  const input = $('#f-locality');
  if (p.locality) input.value = p.locality;
  else if (input.value.trim() === autoLocality) input.value = '';
  autoLocality = p.locality || '';
  showLocality(formMode !== 'add' || !p.locality);
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
  if (!searching()) return;
  const typed = searchText(searchEl);
  searchToken++;
  if (typed) {
    // Sitio nuevo escrito a mano: sin datos de Google, y la localidad se pide.
    draft.placeId = null;
    draft.address = '';
    if (pickMap) pickMap.hidePlace();
    if ($('#f-locality').value.trim() === autoLocality) $('#f-locality').value = '';
    autoLocality = '';
    showNameBox(typed);
    showLocality(true);
  } else {
    // No se ha escrito nada: se recupera lo que había antes de volver a buscar.
    showNameBox(nameBeforeSearch);
    showLocality(formMode !== 'add' || !$('#f-locality').value.trim());
  }
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
  $('#rates').innerHTML = CRITERIA.map((c) => {
    const extra = c.k === 'plato' ? '<input class="input" id="f-dish" type="text" maxlength="80" placeholder="Nom del plat" aria-label="Nom del plat estrella" autocomplete="off">' : '';
    return '<div class="rate" data-k="' + c.k + '">' +
      '<div class="rate-head"><label for="f-r-' + c.k + '">' + c.label + '</label><span class="rate-val is-empty" id="f-v-' + c.k + '">Sense nota</span></div>' + extra +
      '<div class="rate-ctl">' +
        '<button class="step" type="button" data-step="-0.5" aria-label="Baixa mig punt a ' + c.label + '">−</button>' +
        '<input type="range" id="f-r-' + c.k + '" min="1" max="10" step="0.5" value="5">' +
        '<button class="step" type="button" data-step="0.5" aria-label="Puja mig punt a ' + c.label + '">+</button>' +
      '</div></div>';
  }).join('');
  $('#flt-field').innerHTML = '<option value="global">Nota global</option>' + CRITERIA.map((c) => '<option value="' + c.k + '">' + c.label + '</option>').join('');
}
function setRate(k, v) {
  draft.scores[k] = v;
  const out = $('#f-v-' + k);
  out.textContent = fmt(v);
  out.className = 'rate-val ' + (v == null ? 'is-empty' : cls(v));
  $('#f-r-' + k).value = v == null ? 5 : v;
  renderRateTop();
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

// Bloques de cada modo, en orden. En el alta son los pasos; si quien da de alta no puntúa, no hay paso de nota.
const BLOCKS = ['#grp-ubic', '#grp-datos', '#grp-val', '#grp-res'];
function formBlocks() {
  if (formMode === 'rate') return ['#grp-val'];
  return BLOCKS.filter((s) => s !== '#grp-val' || canRate());
}
// Alta: se ve un bloque cada vez, con la barra de progreso, «Enrere» y «Següent» o «Desa el restaurant».
function showStep() {
  const blocks = formBlocks();
  const last = blocks.length - 1;
  BLOCKS.forEach((s) => { $(s).hidden = s !== blocks[formStep]; });
  $('#f-step-label').textContent = 'Pas ' + (formStep + 1) + ' de ' + blocks.length;
  $('#f-progress').innerHTML = blocks.map((s, i) => '<i' + (i <= formStep ? ' class="is-on"' : '') + '></i>').join('');
  $('#f-back').hidden = formStep === 0;
  $('#f-next').hidden = formStep === last;
  $('#f-save').hidden = formStep !== last;
  $('#form').scrollTop = 0;
}
function startForm(mode, r) {
  formMode = mode;
  const mine = r && me && r.ratings[me.uid];
  draft = {
    id: r ? r.id : null,
    name: r ? r.name : '', locality: r ? r.locality : '', address: r ? r.address : '', lat: r ? r.lat : null, lng: r ? r.lng : null,
    cuisines: r ? r.cuisines.slice() : [], price: r ? r.price : PRICES[1],
    visitDate: r ? r.visitDate || todayISO() : todayISO(),
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
  $('#f-dish').value = draft.dish || '';
  $('#f-review').value = draft.blog;
  $$('#f-price input').forEach((i) => { i.checked = i.value === draft.price; });
  CRITERIA.forEach((c) => {
    const v = draft.scores[c.k];
    setRate(c.k, v == null ? null : v);
  });
  ['#err-name', '#err-muni', '#err-loc', '#err-rate'].forEach((s) => { $(s).hidden = true; });
  renderDraftPhotos();
  $('#f-progress-row').hidden = mode !== 'add';
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
  draft.visitDate = $('#f-date').value || todayISO();
  draft.locality = $('#f-locality').value.trim();
  draft.dish = $('#f-dish').value.trim();
  draft.blog = $('#f-review').value.trim();
  const pr = $('#f-price input:checked');
  draft.price = pr ? pr.value : PRICES[1];
}
function ratingKey(scores, dish) { return JSON.stringify([CRITERIA.map((c) => (scores[c.k] == null ? null : scores[c.k])), dish || '']); }
function snapshot() {
  return JSON.stringify([draft.name, draft.locality, draft.lat, draft.lng, draft.placeId, draft.cuisines, draft.price, draft.visitDate, draft.blog,
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
      const data = { name: draft.name, locality: draft.locality, address: draft.address, lat: draft.lat, lng: draft.lng, cuisines: draft.cuisines, price: draft.price, visitDate: draft.visitDate, blog: draft.blog, photos, placeId: draft.placeId };
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
async function renderProfile() {
  const p = person(me.uid);
  $('#p-name').value = p ? p.name : (me.displayName || '');
  $('#p-role').innerHTML = 'Paper: <b>' + ROLE_NAMES[me.role] + '</b>' + (me.color ? ' · puntues en <b class="p-' + me.color + '" style="color:var(--pc)">' + COLOR_NAMES[me.color] + '</b>' : '') +
    '<br><span class="meta">' + esc(me.email) + '</span>';
  $('#p-extra').innerHTML = '';
  if (me.role === 'owner') {
    try {
      const n = await store.countPendingRequests();
      $('#p-extra').innerHTML = '<p class="meta">Sol·licituds d’accés pendents: <b>' + n + '</b>. La pantalla d’accessos arriba al pas 4; mentrestant es gestionen a la consola de Firebase.</p>';
    } catch (e) { /* no es crítico */ }
  }
}
function applyRole() {
  $('#tab-add').hidden = !canEditData();
  $('#tabs').classList.toggle('is-two', !canEditData());
  const ini = ((person(me.uid) || {}).name || me.displayName || me.email || '?').charAt(0).toUpperCase();
  $('#avatar-ini').textContent = ini;
  $('#btn-profile').className = 'avatar' + (me.color ? ' p-' + me.color : '');
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
    if (act === 'edit') { closeDetail(); startForm('edit', r); setView('form'); }
    if (act === 'rate') { closeDetail(); startForm('rate', r); setView('form'); }
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
    if (act === 'tag') {
      // Etiqueta tocable: abre el mapa con ese filtro, sustituyendo los que hubiera.
      clearFilters();
      filters[b.dataset.g].add(b.dataset.v);
      selectedId = null;
      closeDetail();
      setView('map');
      buildFilterChips();
      render();
      toast('Filtre: ' + b.dataset.v);
    }
    if (act === 'photo') {
      const photo = r.photos[+b.dataset.i];
      $('#lightbox').classList.remove('is-loaded', 'is-error');
      $('#lightbox-img').removeAttribute('src');
      $('#lightbox-img').alt = photo.caption || 'Foto';
      $('#lightbox-cap').textContent = photo.caption || '';
      $('#lightbox').hidden = false;
      store.photoURL(photo.full).then((url) => { $('#lightbox-img').src = url; }).catch(() => {
        markPhoto($('#lightbox-img'), false);
        toast('No s’ha pogut carregar la foto');
      });
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
  $('#lightbox-close').addEventListener('click', () => { $('#lightbox').hidden = true; });
  $('#lightbox').addEventListener('click', (e) => { if (e.target.id === 'lightbox') $('#lightbox').hidden = true; });

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
  $('#f-locality').addEventListener('input', () => { $('#err-muni').hidden = true; });
  $$('#grp-datos [data-day]').forEach((b) => b.addEventListener('click', () => {
    $('#f-date').value = dayISO(+b.dataset.day);
    updateDateChips();
  }));
  ['input', 'change'].forEach((t) => $('#f-date').addEventListener(t, updateDateChips));
  const rateInput = (e) => { if (e.target.type === 'range') setRate(e.target.closest('.rate').dataset.k, parseFloat(e.target.value)); };
  ['input', 'change', 'pointerup'].forEach((t) => $('#rates').addEventListener(t, rateInput));
  $('#rates').addEventListener('click', (e) => {
    const b = e.target.closest('.step');
    if (!b) return;
    const k = b.closest('.rate').dataset.k;
    const cur = draft.scores[k];
    setRate(k, cur == null ? parseFloat($('#f-r-' + k).value) : Math.min(10, Math.max(1, cur + parseFloat(b.dataset.step))));
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
  $('#btn-profile').addEventListener('click', () => { renderProfile(); $('#sheet-profile').hidden = false; });
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

  // Entrar y sin acceso
  $('#btn-login').addEventListener('click', async () => {
    $('#login-error').hidden = true;
    try { await store.signIn(); } catch (e) {
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
      $('#login-error').textContent = 'No s’ha pogut entrar: ' + errText(e);
      $('#login-error').hidden = false;
    }
  });
  $('#na-request').addEventListener('click', async () => {
    try {
      await store.requestAccess(store.currentUser());
      $('#na-request').hidden = true;
      $('#na-status').hidden = false;
    } catch (e) { toast('No s’ha pogut enviar: ' + errText(e)); }
  });
  $('#na-other').addEventListener('click', () => store.logOut());

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('#lightbox').hidden) { $('#lightbox').hidden = true; return; }
    const open = $$('.sheet').filter((s) => !s.hidden && s.id !== 'sheet-name')[0];
    if (open) { open.hidden = true; return; }
    if (!$('#detail').hidden) { closeDetail(); return; }
    if (view === 'form') askCloseForm();
  });
}

// ---------- Arranque y sesión ----------
function showScreen(id) {
  ['loading', 'login', 'noaccess'].forEach((s) => { $('#' + s).hidden = s !== id; });
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
  if (pendingOpen && byId(pendingOpen)) { const id = pendingOpen; pendingOpen = null; openDetail(id); }
  else if (detailId) openDetail(detailId, true);
}
async function startSession(user) {
  if (stopWatch) { stopWatch(); stopWatch = null; }
  me = null;
  closeDetail();
  if (!user) { showScreen('login'); return; }
  showScreen('loading');
  let m;
  try { m = await store.getMembership(user); } catch (e) {
    console.error(e);
    toast('No s’ha pogut comprovar el teu accés: ' + errText(e));
    m = null;
  }
  if (!m || !ROLE_NAMES[m.role]) {
    $('#na-email').textContent = user.email;
    let req = null;
    try { req = await store.getAccessRequest(user.uid); } catch (e) { /* sin permiso o sin red */ }
    $('#na-request').hidden = !!req;
    $('#na-status').hidden = !req;
    showScreen('noaccess');
    return;
  }
  me = { uid: user.uid, email: user.email, role: m.role, color: m.color, displayName: '' };
  try {
    const prof = await store.getProfile(user.uid);
    let name = prof && prof.displayName;
    if (!name) { showScreen(null); name = await askName((user.displayName || '').split(' ')[0]); }
    me.displayName = name;
    if (!prof || prof.displayName !== name || (prof.color || null) !== (m.color || null)) await store.saveProfile(user.uid, name, m.color);
  } catch (e) { console.error(e); toast('No s’ha pogut desar el teu nom: ' + errText(e)); }
  showScreen(null);
  applyRole();
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
  me = { uid: 'u1', email: 'muestra@localhost', role: 'owner', color: 'azul', displayName: 'Isidre' };
  showScreen(null);
  onData({
    people: [{ uid: 'u1', name: 'Isidre', color: 'azul' }, { uid: 'u2', name: 'Cris', color: 'rosa' }],
    restaurants: [
      { id: 'm1', name: 'Can Exemple', locality: 'Palma', lat: 39.5712, lng: 2.6498, cuisines: ['Mallorquí', 'Arrossos'], price: PRICES[1], address: 'Carrer de Mostra, 1, 07001 Palma, Illes Balears', visitDate: '2026-10-17',
        blog: 'Primer paràgraf de mostra.\n\nSegon paràgraf.', photos: [], placeId: null, ratings: { u1: { scores: sc([8.5, 9, 7, 8, 8.5, 7.5]), dish: 'Arròs brut' }, u2: { scores: sc([9, 9, 8, 8.5, 9, 7]), dish: 'Llom amb col' } } },
      { id: 'm2', name: 'Sa Fonda Fictícia', locality: 'Sóller', lat: 39.7665, lng: 2.7152, cuisines: ['Menú degustació', 'Peix i marisc'], price: PRICES[2], visitDate: '2026-09-05',
        blog: '', photos: [], placeId: null, ratings: { u2: { scores: sc([9.5, 10, 9, 9, 6, 9.5]), dish: 'Gamba roja' } } },
      { id: 'm3', name: 'Bodega Sense Nom', locality: 'Palma', lat: 39.5745, lng: 2.6551, cuisines: ['Autor'], price: PRICES[0], visitDate: '2026-11-07',
        blog: '', photos: [], placeId: null, ratings: {} }
    ]
  });
  createMainMap($('#map'), { onMapClick: () => { if (selectedId) { selectedId = null; render(); } } })
    .then((m2) => { mainMap = m2; render(); })
    .catch((e) => { $('#map').innerHTML = '<p class="map-error">No s’ha pogut carregar el mapa: ' + esc(errText(e)) + '</p>'; });
}

buildFormStatics();
wire();
if (location.hostname === 'localhost' && new URLSearchParams(location.search).has('muestra')) localPreview();
else store.onSession(startSession);

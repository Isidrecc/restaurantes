// Puntuam a taula: interfaz. Porta la demo aprobada (demo/index.html) con los cambios de docs/diseno.md.
import { CRITERIA, CUISINES, PRICES, COLORS } from './config.js';
import * as store from './store.js';
import { createMainMap, createPickMap, attachPlaceSearch } from './maps.js';
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
let autoName = '';        // nombre y localidad copiados del buscador de Google
let autoLocality = '';

// Selector de nota: 'all' (media) o el color de quien puntúa.
let who = 'all';
try { const w = localStorage.getItem('puntuam-nota'); if (w === 'all' || COLORS.includes(w)) who = w; } catch (e) { /* sin almacenamiento */ }
function saveWho() { try { localStorage.setItem('puntuam-nota', who); } catch (e) { /* sin almacenamiento */ } }

// ---------- Utilidades ----------
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.prototype.slice.call((el || document).querySelectorAll(s));
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function round1(n) { return Math.round(n * 10) / 10; }
function fmt(n) { return n == null ? 'Sin nota' : round1(n).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
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
  if (n == null) return 'Sin valorar';
  const r = round1(n);
  return r >= 9 ? 'Excelente' : r >= 8 ? 'Muy bueno' : r >= 7 ? 'Bueno' : r >= 5 ? 'Correcto' : 'Flojo';
}
function fmtDate(iso) {
  if (!iso) return '';
  const p = iso.split('-');
  return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}
function todayISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
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
function errText(e) { return (e && (e.code || e.message)) || 'error desconocido'; }

// ---------- Personas y medias ----------
function person(uid) { return people.find((p) => p.uid === uid) || null; }
function personName(uid) { const p = person(uid); return p ? p.name : 'Antiguo'; }
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
  if (who === 'all') return 'Media';
  const p = people.find((x) => x.color === who);
  return p ? p.name : 'Media';
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
  return CUISINES.concat(added.sort((a, b) => a.localeCompare(b, 'es')));
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
    if (sortBy === 'nombre') return a.name.localeCompare(b.name, 'es');
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
      '<button class="btn" type="button" data-act="close-preview">Cerrar</button>' +
      '<button class="btn btn-primary" type="button" data-act="open" data-id="' + r.id + '">Ver ficha</button>' +
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
    el.innerHTML = '<div class="empty"><p>Aún no hay restaurantes.</p>' + (canEditData() ? '<p>Añade el primero desde la pestaña Añadir.</p>' : '') + '</div>';
    return;
  }
  if (!list.length) {
    el.innerHTML = '<div class="empty"><p>Ningún restaurante cumple estos filtros.</p><button class="btn" type="button" data-act="clear">Quitar filtros</button></div>';
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
    '<button class="chip chip-x" type="button" data-rm="' + c.k + '" data-v="' + esc(c.v || '') + '" aria-label="Quitar filtro ' + esc(c.t) + '">' + esc(c.t) + XICON + '</button>').join('') +
    (chips.length ? '<button class="chip chip-clear" type="button" data-act="clear">Quitar todos</button>' : '');
  const n = activeCount();
  $('#filter-count').hidden = !n;
  $('#filter-count').textContent = n;
}
function countText(n) {
  const total = restaurants.length;
  if (n === total) return total + (total === 1 ? ' restaurante' : ' restaurantes');
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
  $('#flt-apply').textContent = 'Ver ' + list.length + (list.length === 1 ? ' restaurante' : ' restaurantes');
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
  $('#active-chips').hidden = v === 'form' || !activeCount();
  if (v === 'form') ensurePickMap().then(placeDraftOnPickMap).catch((e) => toast('No se ha podido cargar el mapa: ' + errText(e)));
}

// ---------- Roseta ----------
function chartSVG(list) {
  const W = 380, H = 252, cx = 190, cy = 128, R = 88, n = CRITERIA.length, step = 360 / n;
  const pt = (rad, deg) => { const a = deg * Math.PI / 180; return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)]; };
  const f = (x) => Math.round(x * 10) / 10;
  const hex = (rad) => CRITERIA.map((c, i) => { const q = pt(rad, -90 + i * step); return f(q[0]) + ',' + f(q[1]); }).join(' ');
  const poly = (scores) => CRITERIA.map((c, i) => { const v = scores[c.k]; const q = pt(R * (v == null ? 0 : v) / 10, -90 + i * step); return f(q[0]) + ',' + f(q[1]); }).join(' ');
  const desc = list.map((o) => personName(o.uid) + ': ' + CRITERIA.map((c) => c.short + ' ' + fmt(o.scores[c.k])).join(', ')).join('. ');
  let o = '<svg class="rose" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Roseta de puntuaciones. ' + esc(desc) + '">';
  o += '<polygon class="hex-outer" points="' + hex(R) + '"></polygon>';
  o += '<polygon class="hex-inner" points="' + hex(R / 2) + '"></polygon>';
  CRITERIA.forEach((c, i) => { const e = pt(R, -90 + i * step); o += '<line class="rose-spoke" x1="' + cx + '" y1="' + cy + '" x2="' + f(e[0]) + '" y2="' + f(e[1]) + '"></line>'; });
  list.forEach((x) => { o += '<polygon class="radar-line person ' + pcls(x.uid) + '" points="' + poly(x.scores) + '"><title>' + esc(personName(x.uid)) + '</title></polygon>'; });
  CRITERIA.forEach((c, i) => {
    const deg = -90 + i * step, q = pt(R + 12, deg), cos = Math.cos(deg * Math.PI / 180), sin = Math.sin(deg * Math.PI / 180);
    const anchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle';
    const y = sin < -0.9 ? q[1] - 2 : sin > 0.9 ? q[1] + 12 : q[1] + 5;
    o += '<text class="rose-name" text-anchor="' + anchor + '" x="' + f(q[0]) + '" y="' + f(y) + '">' + c.short + '</text>';
  });
  return o + '</svg>';
}

// ---------- Ficha ----------
function tagBtn(group, value) {
  return '<button class="chip ftag" type="button" data-act="tag" data-g="' + group + '" data-v="' + esc(value) + '" aria-label="Ver en el mapa: ' + esc(value) + '">' + esc(value) + '</button>';
}
function blogHTML(text) {
  return text.split(/\n\s*\n/).map((p) => '<p>' + esc(p.trim()).replace(/\n/g, '<br>') + '</p>').join('');
}
function hydratePhotos(root) {
  $$('img[data-path]', root).forEach((img) => {
    store.photoURL(img.dataset.path).then((url) => { img.src = url; }).catch(() => { img.alt = 'No se ha podido cargar la foto'; });
  });
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
    ? (a.n ? 'Nota de ' + whoP.name : whoP.name + ' aún no lo ha puntuado')
    : raters.length === 2 ? 'Media de ' + people.map((p) => p.name).join(' y ')
    : raters.length === 1 ? 'Solo lo ha puntuado ' + personName(raters[0].uid)
    : 'Aún sin puntuar';
  const critHTML = CRITERIA.map((c) => '<div class="crit2"><span class="crit-name">' + c.label + '</span>' + raters.map((o) => {
    const v = o.scores[c.k];
    const label = c.k === 'plato' && o.dish ? '<span class="pbar-dish">' + STAR + '<b>' + esc(o.dish) + '</b></span>' : '<span></span>';
    return '<div class="pbar ' + pcls(o.uid) + '">' + label +
      '<span class="crit-val">' + (v == null ? '<span class="meta">Sin nota</span>' : fmt(v)) + '</span>' +
      '<div class="crit-bar"><i style="width:' + (v == null ? 0 : v * 10) + '%"></i></div></div>';
  }).join('') + '</div>').join('');
  const legend = '<div class="people-legend">' + raters.map((o) => '<span class="' + pcls(o.uid) + '"><i class="dot"></i>' + esc(personName(o.uid)) + '</span>').join('') + '</div>';
  const pscores = '<div class="pscores">' + raters.map((o) =>
    '<div class="pscore ' + pcls(o.uid) + '"><span class="pscore-name">Nota media de ' + esc(personName(o.uid)) + '</span>' +
    '<span class="pscore-val">' + fmt(o.global) + '</span><span class="meta">' + word(o.global) + '</span></div>').join('') + '</div>';
  const rose = '<div class="card"><p class="section-title">Roseta</p>' + chartSVG(raters) +
    '<div class="rose-legend">' + raters.map((o) => '<span class="' + pcls(o.uid) + '"><i class="ln"></i>' + esc(personName(o.uid)) + '</span>').join('') + '</div></div>';
  const photos = r.photos.map((p, i) =>
    '<figure class="photo"><button class="thumb" type="button" data-act="photo" data-i="' + i + '" aria-label="Ampliar foto ' + (i + 1) + '">' +
    '<img data-path="' + esc(p.thumb) + '" alt="' + esc(p.caption || 'Foto ' + (i + 1)) + '"></button>' +
    (p.caption ? '<figcaption>' + esc(p.caption) + '</figcaption>' : '') + '</figure>').join('');
  const mine = me && r.ratings[me.uid];
  const actions = (canEditData() ? '<button class="link-btn" type="button" data-act="edit">Editar</button>' : '') +
    (canDelete() ? '<button class="link-btn is-danger" type="button" data-act="delete">Borrar</button>' : '');
  $('#detail').innerHTML =
    '<div class="panel-bar">' +
      '<button class="link-btn" type="button" data-act="back"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg>Volver</button>' +
      '<div class="panel-actions">' + actions + '</div>' +
    '</div>' +
    '<div class="panel-body">' +
      '<div class="d-head">' +
        '<h2>' + esc(r.name) + '</h2>' +
        (r.address ? '<p class="meta d-address">' + esc(r.address) + '</p>' : '') +
        '<div class="tags">' + (r.locality ? tagBtn('munis', r.locality) : '') + r.cuisines.map((c) => tagBtn('cuisines', c)).join('') + tagBtn('prices', r.price) + '</div>' +
        (r.visitDate ? '<p class="meta">Visitado el ' + esc(fmtDate(r.visitDate)) + '</p>' : '') +
      '</div>' +
      '<div class="card d-score">' +
        '<div class="score is-big ' + cls(g) + (g == null ? ' is-empty' : '') + '">' + fmt(g) + '</div>' +
        '<div class="d-score-text"><strong>' + word(g) + '</strong><span class="meta">' + esc(scoreText) + '</span></div>' +
      '</div>' +
      (raters.length
        ? '<div class="card crit">' + legend + critHTML + pscores +
            (missing.length ? '<p class="hint">' + missing.map((p) => esc(p.name)).join(' y ') + ' aún no lo ha puntuado.</p>' : '') +
          '</div>' + rose
        : '<div class="card"><p class="meta">Aún no lo ha puntuado nadie.</p></div>') +
      (canRate() ? '<button class="btn btn-primary btn-block" type="button" data-act="rate">' + (mine ? 'Editar mi nota' : 'Puntuar este restaurante') + '</button>' : '') +
      (r.blog ? '<div class="card"><p class="section-title">Comentario</p><div class="blog">' + blogHTML(r.blog) + '</div></div>' : '') +
      (photos ? '<div class="card"><p class="section-title">Fotos</p><div class="photos">' + photos + '</div></div>' : '') +
      '<button class="btn btn-block" type="button" data-act="show-on-map">Ver en el mapa</button>' +
    '</div>';
  $('#detail').hidden = false;
  $('#detail .panel-body').scrollTop = prevScroll;
  hydratePhotos($('#detail'));
}
function closeDetail() { $('#detail').hidden = true; detailId = null; }

// ---------- Formulario ----------
async function ensurePickMap() {
  if (pickMap) return pickMap;
  if (!pickMapPromise) {
    pickMapPromise = (async () => {
      const m = await createPickMap($('#pick-map'), { onPick: setDraftLocation });
      pickMap = m;
      attachPlaceSearch($('#f-gsearch'), {
        getBias: () => {
          const c = m.map.getCenter();
          return c ? { center: { lat: c.lat(), lng: c.lng() }, radius: 50000 } : null;
        },
        onPlace: (p) => {
          if (!draft) return;
          draft.placeId = p.id;
          // El pin lo pone el usuario tocando el sitio marcado (sección 5 de docs/diseno.md).
          draft.lat = null;
          draft.lng = null;
          m.clearPin();
          m.showPlace(p.lat, p.lng);
          m.center(p.lat, p.lng, 18);
          // Se rellenan si están vacíos o conservan lo copiado de una búsqueda anterior.
          autoName = autoFill('#f-name', '#name-hint', '#err-name', p.name, autoName);
          autoLocality = autoFill('#f-locality', '#locality-hint', '#err-muni', p.locality, autoLocality);
          draft.address = p.address || '';
          showDraftAddress();
          $('#pick-status').textContent = 'Toca el restaurante marcado para poner el pin.';
          $('#pick-map').scrollIntoView({ block: 'center', behavior: 'smooth' });
        },
        onError: (e) => toast('No se ha podido buscar: ' + errText(e))
      }).catch((e) => {
        $('#f-gsearch').innerHTML = '<p class="hint">El buscador de Google no está disponible (' + esc(errText(e)) + '). Sitúa el restaurante tocando el mapa.</p>';
      });
      return m;
    })();
    pickMapPromise.catch(() => { pickMapPromise = null; });
  }
  return pickMapPromise;
}
function showDraftAddress() {
  const box = $('#f-address');
  box.hidden = !draft.address;
  box.textContent = draft.address ? 'Dirección: ' + draft.address : '';
}
function autoFill(inputSel, hintSel, errSel, value, prevAuto) {
  const input = $(inputSel);
  const current = input.value.trim();
  if (!value || (current && current !== prevAuto)) return prevAuto;
  input.value = value;
  $(hintSel).hidden = false;
  $(errSel).hidden = true;
  return value;
}
function round5(n) { return Math.round(n * 1e5) / 1e5; }
function setDraftLocation(lat, lng) {
  if (!draft) return;
  draft.lat = round5(lat);
  draft.lng = round5(lng);
  $('#err-loc').hidden = true;
  $('#pick-status').textContent = 'Punto marcado. Puedes arrastrar el pin para afinar.';
}
function placeDraftOnPickMap(m) {
  if (!m || !draft) return;
  m.hidePlace();
  if (draft.lat != null) {
    m.setPin(draft.lat, draft.lng);
    m.center(draft.lat, draft.lng, 16);
    $('#pick-status').textContent = 'Puedes arrastrar el pin para afinar.';
  } else {
    m.clearPin();
    m.home();
    $('#pick-status').textContent = 'Busca el restaurante o toca el mapa para situarlo.';
  }
}
function buildFormStatics() {
  $('#f-price').innerHTML = PRICES.map((p, i) => '<input type="radio" name="f-price" id="f-price-' + i + '" value="' + esc(p) + '"><label for="f-price-' + i + '">' + esc(p) + '</label>').join('');
  $('#rates').innerHTML = CRITERIA.map((c) => {
    const extra = c.k === 'plato' ? '<input class="input" id="f-dish" type="text" maxlength="80" placeholder="Nombre del plato" aria-label="Nombre del plato estrella" autocomplete="off">' : '';
    return '<div class="rate" data-k="' + c.k + '">' +
      '<div class="rate-head"><label for="f-r-' + c.k + '">' + c.label + '</label><span class="rate-val is-empty" id="f-v-' + c.k + '">Sin nota</span></div>' + extra +
      '<div class="rate-ctl">' +
        '<button class="step" type="button" data-step="-0.5" aria-label="Bajar medio punto en ' + c.label + '">−</button>' +
        '<input type="range" id="f-r-' + c.k + '" min="1" max="10" step="0.5" value="5">' +
        '<button class="step" type="button" data-step="0.5" aria-label="Subir medio punto en ' + c.label + '">+</button>' +
      '</div></div>';
  }).join('');
  $('#flt-field').innerHTML = '<option value="global">Nota global</option>' + CRITERIA.map((c) => '<option value="' + c.k + '">' + c.label + '</option>').join('');
}
function setRate(k, v) {
  draft.scores[k] = v;
  const out = $('#f-v-' + k);
  out.textContent = fmt(v);
  out.classList.toggle('is-empty', v == null);
  if (v != null) $('#f-r-' + k).value = v;
  const g = globalOf(draft.scores);
  const box = $('#f-global');
  box.className = 'score ' + cls(g) + (g == null ? ' is-empty' : '');
  box.textContent = fmt(g);
}
// Modos: add (alta, editores), edit (datos, comentario y fotos, editores), rate (mi nota, quien puntúa).
function startForm(mode, r) {
  formMode = mode;
  const mine = r && me && r.ratings[me.uid];
  draft = {
    id: r ? r.id : null,
    name: r ? r.name : '', locality: r ? r.locality : '', address: r ? r.address : '', lat: r ? r.lat : null, lng: r ? r.lng : null,
    cuisines: r ? r.cuisines.slice() : [], price: r ? r.price : PRICES[1],
    visitDate: r ? r.visitDate || todayISO() : todayISO(),
    blog: r ? r.blog : '',
    photos: r ? r.photos.map((p) => ({ full: p.full, thumb: p.thumb, caption: p.caption || '' })) : [],
    removed: [],
    placeId: r ? r.placeId : null,
    scores: mine ? Object.assign({}, mine.scores) : {},
    dish: mine ? mine.dish : ''
  };
  $('#form-title').textContent = mode === 'add' ? 'Añadir restaurante' : mode === 'edit' ? 'Editar · ' + r.name : (mine ? 'Editar mi nota · ' : 'Puntuar · ') + r.name;
  $('#f-save').textContent = mode === 'add' ? 'Guardar restaurante' : mode === 'edit' ? 'Guardar cambios' : 'Guardar mi nota';
  $('#grp-datos').hidden = mode === 'rate';
  $('#grp-ubic').hidden = mode === 'rate';
  $('#grp-val').hidden = mode === 'edit' || (mode === 'add' && !canRate());
  $('#grp-res').hidden = mode === 'rate';
  $('#val-hint').hidden = mode !== 'add';
  $('#f-name').value = draft.name;
  autoName = '';
  autoLocality = '';
  $('#name-hint').hidden = true;
  $('#locality-hint').hidden = true;
  renderFormCuisines();
  $('#f-cuisine-new').hidden = true;
  $('#f-cuisine-text').value = '';
  $('#f-date').value = draft.visitDate;
  $('#f-locality').value = draft.locality;
  showDraftAddress();
  $('#localities').innerHTML = localities().map((l) => '<option value="' + esc(l) + '"></option>').join('');
  $('#f-dish').value = draft.dish || '';
  $('#f-review').value = draft.blog;
  $$('#f-price input').forEach((i) => { i.checked = i.value === draft.price; });
  CRITERIA.forEach((c) => {
    const v = draft.scores[c.k];
    $('#f-r-' + c.k).value = v == null ? 5 : v;
    setRate(c.k, v == null ? null : v);
  });
  ['#err-name', '#err-muni', '#err-loc', '#err-rate'].forEach((s) => { $(s).hidden = true; });
  renderDraftPhotos();
  $('#view-form').scrollTop = 0;
}
function renderFormCuisines() {
  $('#f-cuisines').innerHTML = cuisineList(draft.cuisines).map((c) =>
    '<button class="chip" type="button" aria-pressed="' + (draft.cuisines.includes(c) ? 'true' : 'false') + '" data-c="' + esc(c) + '">' + esc(c) + '</button>').join('') +
    '<button class="chip chip-add" type="button" id="f-cuisine-add">+ Añadir</button>';
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
  box.innerHTML = draft.photos.map((p, i) =>
    '<div class="photo-edit">' +
      '<div class="thumb">' + (p.preview ? '<img src="' + p.preview + '" alt="Foto ' + (i + 1) + '">' : '<img data-path="' + esc(p.thumb) + '" alt="Foto ' + (i + 1) + '">') +
      '<button class="thumb-x" type="button" data-rmphoto="' + i + '" aria-label="Quitar foto ' + (i + 1) + '">' + XICON + '</button></div>' +
      '<input class="input" type="text" maxlength="200" placeholder="Pie de foto" aria-label="Pie de la foto ' + (i + 1) + '" data-cap="' + i + '" value="' + esc(p.caption) + '">' +
    '</div>').join('');
  hydratePhotos(box);
}
async function saveForm() {
  if (saving) return;
  draft.name = $('#f-name').value.trim();
  draft.cuisines = cuisineList(draft.cuisines).filter((c) => draft.cuisines.includes(c));
  draft.visitDate = $('#f-date').value || todayISO();
  draft.locality = $('#f-locality').value.trim();
  draft.dish = $('#f-dish').value.trim();
  draft.blog = $('#f-review').value.trim();
  const pr = $('#f-price input:checked');
  draft.price = pr ? pr.value : PRICES[1];
  let bad = null;
  if (formMode !== 'rate') {
    $('#err-name').hidden = !!draft.name; if (!draft.name) bad = bad || '#f-name';
    $('#err-muni').hidden = !!draft.locality; if (!draft.locality) bad = bad || '#f-locality';
    $('#err-loc').hidden = draft.lat != null; if (draft.lat == null) bad = bad || '#pick-map';
  }
  const hasScore = CRITERIA.some((c) => draft.scores[c.k] != null);
  const rateVisible = !$('#grp-val').hidden;
  const needScore = formMode === 'rate' || (formMode === 'add' && rateVisible && !!draft.dish);
  $('#err-rate').hidden = !(needScore && !hasScore);
  if (needScore && !hasScore) bad = bad || '#rates';
  if (bad) { $(bad).scrollIntoView({ block: 'center' }); toast('Faltan datos por rellenar'); return; }

  saving = true;
  const btn = $('#f-save');
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Guardando…';
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
          btn.textContent = 'Subiendo foto ' + done + ' de ' + fresh + '…';
          const prepared = await preparePhoto(p.file);
          const paths = await store.uploadPhoto(id, prepared.full, prepared.thumb);
          photos.push({ ...paths, caption: p.caption });
        } else {
          photos.push({ full: p.full, thumb: p.thumb, caption: p.caption });
        }
      }
      btn.textContent = 'Guardando…';
      const data = { name: draft.name, locality: draft.locality, address: draft.address, lat: draft.lat, lng: draft.lng, cuisines: draft.cuisines, price: draft.price, visitDate: draft.visitDate, blog: draft.blog, photos, placeId: draft.placeId };
      if (formMode === 'add') await store.createRestaurant(id, data, rateVisible && hasScore ? rating : null);
      else await store.updateRestaurant(id, data);
      for (const p of draft.removed) { try { await store.removePhotoFiles(p); } catch (e) { console.warn('No se ha podido borrar una foto', e); } }
    }
    const msg = formMode === 'add' ? 'Restaurante añadido' : formMode === 'edit' ? 'Cambios guardados' : 'Nota guardada';
    draft.photos.forEach((p) => { if (p.preview) URL.revokeObjectURL(p.preview); });
    draft = null;
    selectedId = id;
    setView(lastBrowse);
    if (byId(id)) openDetail(id); else pendingOpen = id;
    toast(msg);
  } catch (e) {
    console.error(e);
    toast('No se ha podido guardar: ' + errText(e));
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
  $('#flt-min-out').textContent = filters.min > 0 ? fmt(filters.min) + ' o más' : 'Cualquiera';
}
function renderWho() {
  $('#who-opts').innerHTML = '<button type="button" data-who="all">Media</button>' +
    people.map((p) => '<button type="button" data-who="' + p.color + '" class="p-' + p.color + '"><i class="dot"></i>' + esc(p.name) + '</button>').join('');
  $('#who-opts').style.gridTemplateColumns = 'repeat(' + (people.length + 1) + ', 1fr)';
  $$('#who-opts [data-who]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.who === who ? 'true' : 'false'));
  const n = filtered().length;
  $('#who-apply').textContent = 'Ver ' + n + (n === 1 ? ' restaurante' : ' restaurantes');
}
const ROLE_NAMES = { owner: 'Propietario', editor: 'Editor', viewer: 'Invitado (solo mira)' };
async function renderProfile() {
  const p = person(me.uid);
  $('#p-name').value = p ? p.name : (me.displayName || '');
  $('#p-role').innerHTML = 'Papel: <b>' + ROLE_NAMES[me.role] + '</b>' + (me.color ? ' · puntúas en <b class="p-' + me.color + '" style="color:var(--pc)">' + me.color + '</b>' : '') +
    '<br><span class="meta">' + esc(me.email) + '</span>';
  $('#p-extra').innerHTML = '';
  if (me.role === 'owner') {
    try {
      const n = await store.countPendingRequests();
      $('#p-extra').innerHTML = '<p class="meta">Solicitudes de acceso pendientes: <b>' + n + '</b>. La pantalla de accesos llega en el paso 4; mientras tanto se gestionan en la consola de Firebase.</p>';
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
function askConfirm(title, text, fn) {
  $('#cf-title').textContent = title;
  $('#cf-text').textContent = text;
  confirmFn = fn;
  $('#sheet-confirm').hidden = false;
}

// ---------- Eventos ----------
function wire() {
  $$('.tabs button').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.view === 'form' && !(view === 'form' && formMode === 'add')) startForm('add', null);
    setView(b.dataset.view);
  }));
  $('#q').addEventListener('input', (e) => { filters.q = e.target.value; render(); });
  $('#btn-filters').addEventListener('click', () => { buildFilterChips(); $('#sheet-filters').hidden = false; });
  $$('[data-close]').forEach((b) => b.addEventListener('click', () => { b.closest('.sheet').hidden = true; }));
  $('#flt-min').addEventListener('input', (e) => {
    filters.min = parseFloat(e.target.value);
    $('#flt-min-out').textContent = filters.min > 0 ? fmt(filters.min) + ' o más' : 'Cualquiera';
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
      askConfirm('¿Borrar este restaurante?', 'Se borrará la ficha de ' + r.name + ' con las notas, el comentario y las fotos. No se puede deshacer.', async () => {
        try {
          await store.deleteRestaurant(r);
          if (selectedId === r.id) selectedId = null;
          closeDetail();
          toast('Restaurante borrado');
        } catch (err) { toast('No se ha podido borrar: ' + errText(err)); }
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
      toast('Filtro: ' + b.dataset.v);
    }
    if (act === 'photo') {
      const photo = r.photos[+b.dataset.i];
      $('#lightbox-img').removeAttribute('src');
      $('#lightbox-img').alt = photo.caption || 'Foto';
      $('#lightbox-cap').textContent = photo.caption || '';
      $('#lightbox').hidden = false;
      store.photoURL(photo.full).then((url) => { $('#lightbox-img').src = url; }).catch(() => toast('No se ha podido cargar la foto'));
    }
    if (act === 'show-on-map') {
      if (!passes(r)) { clearFilters(); toast('Filtros quitados para mostrarlo'); }
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

  // Formulario
  $('#form').addEventListener('submit', (e) => { e.preventDefault(); saveForm(); });
  $('#f-cancel').addEventListener('click', () => {
    const back = draft && draft.id;
    draft = null;
    setView(lastBrowse);
    if (back && byId(back)) openDetail(back);
  });
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
  $('#f-name').addEventListener('input', () => {
    $('#name-hint').hidden = !autoName || $('#f-name').value.trim() !== autoName;
  });
  $('#f-locality').addEventListener('input', () => {
    $('#locality-hint').hidden = !autoLocality || $('#f-locality').value.trim() !== autoLocality;
  });
  $('#f-geo').addEventListener('click', () => {
    if (!navigator.geolocation) { toast('Este dispositivo no da la ubicación'); return; }
    toast('Buscando tu ubicación…');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const m = await ensurePickMap();
      const { latitude: lat, longitude: lng } = pos.coords;
      m.setPin(lat, lng);
      m.center(lat, lng, 17);
      setDraftLocation(lat, lng);
    }, (err) => toast(err.code === 1 ? 'Sin permiso para usar tu ubicación' : 'No se ha podido obtener tu ubicación'), { enableHighAccuracy: true, timeout: 15000 });
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
    if (!name) { toast('Escribe un nombre'); return; }
    try {
      await store.saveProfile(me.uid, name, me.color);
      me.displayName = name;
      $('#sheet-profile').hidden = true;
      toast('Nombre guardado');
    } catch (e) { toast('No se ha podido guardar: ' + errText(e)); }
  });
  $('#p-logout').addEventListener('click', () => { $('#sheet-profile').hidden = true; store.logOut(); });

  // Entrar y sin acceso
  $('#btn-login').addEventListener('click', async () => {
    $('#login-error').hidden = true;
    try { await store.signIn(); } catch (e) {
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
      $('#login-error').textContent = 'No se ha podido entrar: ' + errText(e);
      $('#login-error').hidden = false;
    }
  });
  $('#na-request').addEventListener('click', async () => {
    try {
      await store.requestAccess(store.currentUser());
      $('#na-request').hidden = true;
      $('#na-status').hidden = false;
    } catch (e) { toast('No se ha podido enviar: ' + errText(e)); }
  });
  $('#na-other').addEventListener('click', () => store.logOut());

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('#lightbox').hidden) { $('#lightbox').hidden = true; return; }
    const open = $$('.sheet').filter((s) => !s.hidden && s.id !== 'sheet-name')[0];
    if (open) { open.hidden = true; return; }
    if (!$('#detail').hidden) closeDetail();
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
      if (!v) { toast('Escribe un nombre'); return; }
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
    toast('No se ha podido comprobar tu acceso: ' + errText(e));
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
  } catch (e) { console.error(e); toast('No se ha podido guardar tu nombre: ' + errText(e)); }
  showScreen(null);
  applyRole();
  stopWatch = store.watchAll(onData, (e) => { console.error(e); toast('Error al leer los datos: ' + errText(e)); });
  if (!mainMap) {
    createMainMap($('#map'), { onMapClick: () => { if (selectedId) { selectedId = null; render(); } } })
      .then((m2) => { mainMap = m2; if (dataReady) render(); })
      .catch((e) => { $('#map').innerHTML = '<p class="map-error">No se ha podido cargar el mapa: ' + esc(errText(e)) + '</p>'; });
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
      { id: 'm1', name: 'Can Exemple', locality: 'Palma', lat: 39.5712, lng: 2.6498, cuisines: ['Mallorquín', 'Arroces'], price: PRICES[1], address: 'Carrer de Mostra, 1, 07001 Palma, Illes Balears', visitDate: '2026-10-17',
        blog: 'Primer párrafo de muestra.\n\nSegundo párrafo.', photos: [], placeId: null, ratings: { u1: { scores: sc([8.5, 9, 7, 8, 8.5, 7.5]), dish: 'Arròs brut' }, u2: { scores: sc([9, 9, 8, 8.5, 9, 7]), dish: 'Llom amb col' } } },
      { id: 'm2', name: 'Sa Fonda Fictícia', locality: 'Sóller', lat: 39.7665, lng: 2.7152, cuisines: ['Menú degustación', 'Pescado y marisco'], price: PRICES[2], visitDate: '2026-09-05',
        blog: '', photos: [], placeId: null, ratings: { u2: { scores: sc([9.5, 10, 9, 9, 6, 9.5]), dish: 'Gamba roja' } } },
      { id: 'm3', name: 'Bodega Sense Nom', locality: 'Palma', lat: 39.5745, lng: 2.6551, cuisines: ['Autor'], price: PRICES[0], visitDate: '2026-11-07',
        blog: '', photos: [], placeId: null, ratings: {} }
    ]
  });
  createMainMap($('#map'), { onMapClick: () => { if (selectedId) { selectedId = null; render(); } } })
    .then((m2) => { mainMap = m2; render(); })
    .catch((e) => { $('#map').innerHTML = '<p class="map-error">No se ha podido cargar el mapa: ' + esc(errText(e)) + '</p>'; });
}

buildFormStatics();
wire();
if (location.hostname === 'localhost' && new URLSearchParams(location.search).has('muestra')) localPreview();
else store.onSession(startSession);

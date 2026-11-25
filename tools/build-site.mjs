// Monta la web que publica GitHub Pages (lo ejecuta .github/workflows/pages.yml; docs/publicacion.md).
// Uso: node tools/build-site.mjs [carpeta de salida, por defecto _site]
//
// 1. Copia la app: index.html, manifest, app/, icons/ y demo/.
// 2. Pone la versión (?v=commit) a los archivos de la app, para que el navegador no siga con los viejos.
// 3. Crea f/<id>/index.html por restaurante: la vista previa al compartir (Open Graph: nombre, nota, localidad,
//    cocinas, precio y la portada) y lleva al instante a la ficha (?r=id). WhatsApp y las demás apps leen
//    esta página, no la app, que es la misma para todas las fichas.
// 4. Crea 404.html: un enlace f/<id>/ de una ficha que aún no tiene página lleva igualmente a la ficha.
// 5. Copia sw.js con la versión y la lista de archivos que el teléfono guarda para abrir la app sin conexión.
//
// Los datos se leen de Firestore sin clave ni sesión: la lectura es pública (docs/diseno.md, sección 1).
import { cp, mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2] ? resolve(process.argv[2]) : join(ROOT, '_site');
const SITE = 'https://isidrecc.github.io/restaurantes/';
const BASE_PATH = '/restaurantes/';
const BUCKET = 'puntuam-a-taula.firebasestorage.app';
const DB = 'https://firestore.googleapis.com/v1/projects/puntuam-a-taula/databases/(default)/documents';
const VERSION = (process.env.GITHUB_SHA || 'local' + Date.now()).slice(0, 12);
// Igual que PRICES y COLORS de app/config.js (aquí no se puede importar: no es un módulo de Node).
const PRICES = ['<20 €', '20-40 €', '40-60 €', '60-100 €', '>100 €'];
const COLORS = ['azul', 'rosa'];

// ---------- Datos de Firestore (API REST) ----------

function val(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(val);
  if ('mapValue' in v) return fields(v.mapValue.fields);
  return null;
}
function fields(f) {
  const o = {};
  for (const k of Object.keys(f || {})) o[k] = val(f[k]);
  return o;
}
async function getJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(url + ' → HTTP ' + res.status + ' ' + (await res.text()).slice(0, 200));
  return res.json();
}
async function list(collection) {
  const out = [];
  let token = '';
  do {
    const j = await getJSON(DB + '/' + collection + '?pageSize=300' + (token ? '&pageToken=' + encodeURIComponent(token) : ''));
    (j.documents || []).forEach((d) => out.push({ id: d.name.split('/').pop(), ...fields(d.fields) }));
    token = j.nextPageToken || '';
  } while (token);
  return out;
}
// Todas las notas de una vez (consulta de grupo de colecciones).
async function allRatings() {
  const j = await getJSON(DB + ':runQuery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'ratings', allDescendants: true }] } })
  });
  return j.filter((x) => x.document).map((x) => {
    const parts = x.document.name.split('/');
    return { rid: parts[parts.length - 3], uid: parts[parts.length - 1], ...fields(x.document.fields) };
  });
}

// ---------- Textos, como en la app ----------

const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const round1 = (n) => Math.round(n * 10) / 10;
const fmt = (n) => round1(n).toLocaleString('ca-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
function word(n) {
  const r = round1(n);
  return r >= 9 ? 'Excel·lent' : r >= 8 ? 'Molt bo' : r >= 7 ? 'Bo' : r >= 5 ? 'Correcte' : 'Fluix';
}
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const photoURL = (path) => 'https://firebasestorage.googleapis.com/v0/b/' + BUCKET + '/o/' + encodeURIComponent(path) + '?alt=media';

// Nota que se ve en la app por defecto: la media de las notas globales de quienes puntúan (con color).
function noteOf(r, ratings, raters) {
  const globals = ratings.filter((x) => x.rid === r.id && raters.has(x.uid)).map((x) => {
    if (typeof x.global === 'number') return x.global;
    return avg(Object.values(x.scores || {}).filter((v) => typeof v === 'number'));
  }).filter((v) => v != null);
  return avg(globals);
}

function sharePage(r, note) {
  const cover = (r.photos || []).find((p) => p && p.cover) || (r.photos || [])[0];
  // La miniatura (400 px, unas decenas de KB): las vistas previas no cargan imágenes pesadas.
  const image = cover && cover.thumb ? photoURL(cover.thumb) : SITE + 'icons/icon-512.png';
  const price = PRICES[(r.price || 2) - 1];
  const desc = [note == null ? 'Sense puntuar' : fmt(note) + ' · ' + word(note), r.locality, (r.cuisines || []).join(', '), price]
    .filter(Boolean).join(' · ');
  const page = SITE + 'f/' + r.id + '/';
  const app = '../../?r=' + encodeURIComponent(r.id);
  return '<!doctype html>\n<html lang="ca">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + esc(r.name) + ' · Puntuam a taula</title>\n' +
    '<meta name="description" content="' + esc(desc) + '">\n' +
    '<meta property="og:type" content="website">\n' +
    '<meta property="og:site_name" content="Puntuam a taula">\n' +
    '<meta property="og:locale" content="ca_ES">\n' +
    '<meta property="og:title" content="' + esc(r.name) + '">\n' +
    '<meta property="og:description" content="' + esc(desc) + '">\n' +
    '<meta property="og:url" content="' + esc(page) + '">\n' +
    '<meta property="og:image" content="' + esc(image) + '">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<link rel="canonical" href="' + esc(page) + '">\n' +
    '<meta http-equiv="refresh" content="0; url=' + esc(app) + '">\n' +
    '<script>location.replace(' + JSON.stringify(app) + ');</script>\n' +
    '</head>\n<body><p><a href="' + esc(app) + '">Obre la fitxa de ' + esc(r.name) + '</a></p></body>\n</html>\n';
}

const NOT_FOUND = '<!doctype html>\n<html lang="ca">\n<head>\n<meta charset="utf-8">\n<title>Puntuam a taula</title>\n' +
  '<script>\n// f/<id>/ de una ficha que aún no tiene página: a la ficha. Cualquier otra dirección: a la app.\n' +
  'var m = location.pathname.match(/\\/f\\/([A-Za-z0-9_-]+)\\/?$/);\n' +
  'location.replace(' + JSON.stringify(BASE_PATH) + ' + (m ? "?r=" + m[1] : ""));\n' +
  '</script>\n</head>\n<body><p><a href="' + BASE_PATH + '">Puntuam a taula</a></p></body>\n</html>\n';

// ---------- Montaje ----------

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  for (const f of ['index.html', 'manifest.webmanifest']) await cp(join(ROOT, f), join(OUT, f));
  for (const d of ['app', 'icons', 'demo']) await cp(join(ROOT, d), join(OUT, d), { recursive: true });

  // Versión en los archivos de la app: index.html los pide con ?v= y los módulos se importan entre sí igual.
  const v = '?v=' + VERSION;
  let index = await readFile(join(OUT, 'index.html'), 'utf8');
  index = index.replace('href="app/styles.css"', 'href="app/styles.css' + v + '"').replace('src="app/main.js"', 'src="app/main.js' + v + '"');
  await writeFile(join(OUT, 'index.html'), index);
  for (const f of await readdir(join(OUT, 'app'))) {
    if (!f.endsWith('.js')) continue;
    const p = join(OUT, 'app', f);
    const js = (await readFile(p, 'utf8')).replace(/from '\.\/([\w-]+\.js)'/g, "from './$1" + v + "'");
    await writeFile(p, js);
  }

  // Clave de Google Maps (parte 5d): no está en el repo. La pone el secreto MAPS_KEY de GitHub (pages.yml). Sin él,
  // en GitHub el montaje falla y sigue publicada la versión anterior; en local se deja la marca y la app usa
  // app/clau-local.js.
  const cfgPath = join(OUT, 'app', 'config.js');
  const cfg = await readFile(cfgPath, 'utf8');
  const key = (process.env.MAPS_KEY || '').trim();
  if (key) {
    if (!/^[A-Za-z0-9_-]{30,60}$/.test(key)) throw new Error('MAPS_KEY no té forma de clau de Google');
    if (!cfg.includes("'__MAPS_KEY__'")) throw new Error('config.js: no hi ha la marca de la clau del mapa');
    await writeFile(cfgPath, cfg.split("'__MAPS_KEY__'").join("'" + key + "'"));
  } else if (process.env.GITHUB_ACTIONS) {
    throw new Error('Falta el secret MAPS_KEY: sense la clau, el mapa no funcionaria');
  }

  await writeFile(join(OUT, '404.html'), NOT_FOUND);

  // Service worker (docs/diseno.md, sección 10, parte 5b): la versión, para borrar la copia anterior, y los
  // archivos que se guardan al instalarlo: la página, el manifiesto, la app con su versión, los iconos y Firebase.
  const appFiles = (await readdir(join(OUT, 'app'))).filter((f) => /\.(js|css)$/.test(f)).map((f) => 'app/' + f + v);
  const iconFiles = (await readdir(join(OUT, 'icons'))).map((f) => 'icons/' + f);
  const storeSrc = await readFile(join(ROOT, 'app', 'store.js'), 'utf8');
  const sdk = [...new Set(storeSrc.match(/https:\/\/www\.gstatic\.com\/firebasejs\/[\w.\/-]+\.js/g) || [])];
  const precache = ['./', 'manifest.webmanifest', ...appFiles, ...iconFiles, ...sdk];
  let sw = await readFile(join(ROOT, 'sw.js'), 'utf8');
  sw = sw.split("const VERSION = 'dev';").join('const VERSION = ' + JSON.stringify(VERSION) + ';')
    .split('const PRECACHE = [];').join('const PRECACHE = ' + JSON.stringify(precache) + ';');
  if (!sw.includes(JSON.stringify(VERSION)) || sdk.length === 0) throw new Error('sw.js: no se han podido poner la versión o la lista');
  await writeFile(join(OUT, 'sw.js'), sw);

  // Páginas de compartir. Si Firestore falla, el montaje falla y GitHub deja publicada la versión anterior.
  const [restaurants, users, ratings] = await Promise.all([list('restaurants'), list('users'), allRatings()]);
  const raters = new Set(users.filter((u) => COLORS.includes(u.color)).map((u) => u.id));
  let n = 0;
  for (const r of restaurants) {
    if (!/^[A-Za-z0-9_-]+$/.test(r.id) || !r.name) continue;
    const dir = join(OUT, 'f', r.id);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'index.html'), sharePage(r, noteOf(r, ratings, raters)));
    n++;
  }
  console.log('Pàgines per compartir: ' + n + ' de ' + restaurants.length + ' restaurants. Versió ' + VERSION + '.');
}

main().catch((e) => { console.error(e); process.exit(1); });

// Copia de seguridad de las puntuaciones en un .csv (parte 5c, 25 de noviembre de 2026; docs/diseno.md, sección 10).
// Uso: node tools/copia-csv.mjs [carpeta de salida, por defecto copias/]
//
// Lee Firestore sin clave ni sesión (la lectura es pública) y escribe copias/puntuam-AAAA-MM-DD.csv: una fila por
// restaurante con sus datos, la nota media, las seis notas, la nota global y el plato estrella de cada persona que
// puntúa, y el comentario. Separado por punto y coma, con coma decimal y BOM, para que Excel en español lo abra
// bien. La carpeta copias/ está en Dropbox pero no se sube a GitHub (.gitignore): el repo es público.
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2] ? resolve(process.argv[2]) : join(ROOT, 'copias');
const DB = 'https://firestore.googleapis.com/v1/projects/puntuam-a-taula/databases/(default)/documents';
// Igual que PRICES, COLORS y CRITERIA de app/config.js (aquí no se puede importar: no es un módulo de Node).
const PRICES = ['<20 €', '20-40 €', '40-60 €', '60-100 €', '>100 €'];
const COLORS = ['azul', 'rosa'];
const CRITERIA = [
  { k: 'producto', label: 'Producte' },
  { k: 'plato', label: 'Plat estrella' },
  { k: 'tecnica', label: 'Tècnica' },
  { k: 'servicio', label: 'Servei' },
  { k: 'precio', label: 'Qualitat/preu' },
  { k: 'ambiente', label: 'Ambient' }
];

// ---------- Datos de Firestore (API REST), como en tools/build-site.mjs ----------

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

// ---------- Notas, como en la app ----------

const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
// Nota global de una persona: media de los criterios que ha puntuado (globalOf en app/main.js).
const globalOf = (scores) => avg(CRITERIA.map((c) => (scores || {})[c.k]).filter((v) => typeof v === 'number'));
// Una décima y coma decimal (8,6).
const num = (n) => (typeof n === 'number' ? (Math.round(n * 10) / 10).toFixed(1).replace('.', ',') : '');

// ---------- CSV ----------

function cell(v) {
  const s = v == null ? '' : String(v);
  return /[";\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

async function main() {
  const [restaurants, users, ratings] = await Promise.all([list('restaurants'), list('users'), allRatings()]);
  const people = users.filter((u) => COLORS.includes(u.color)).sort((a, b) => COLORS.indexOf(a.color) - COLORS.indexOf(b.color));

  const header = ['Restaurant', 'Localitat', 'Adreça', 'Tipus', 'Preu', 'Data de visita', 'Nota mitjana'];
  people.forEach((p) => {
    const name = p.displayName || p.color;
    header.push(name + ': nota global', ...CRITERIA.map((c) => name + ': ' + c.label), name + ': plat estrella (nom)');
  });
  header.push('Comentari', 'Id de la fitxa');

  let rated = 0;
  const rows = restaurants
    .slice()
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ca'))
    .map((r) => {
      const mine = (uid) => ratings.find((x) => x.rid === r.id && x.uid === uid);
      const globals = people.map((p) => { const x = mine(p.id); return x ? globalOf(x.scores) : null; }).filter((v) => v != null);
      if (globals.length) rated++;
      const row = [
        r.name, r.locality, r.address || '', (r.cuisines || []).join(', '), PRICES[(r.price || 0) - 1] || '',
        r.visitDate || 'Pendent', num(avg(globals))
      ];
      people.forEach((p) => {
        const x = mine(p.id);
        row.push(num(x ? globalOf(x.scores) : null), ...CRITERIA.map((c) => num(x && x.scores ? x.scores[c.k] : null)), x ? x.dish || '' : '');
      });
      row.push(r.blog || '', r.id);
      return row;
    });

  const d = new Date();
  const day = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  await mkdir(OUT, { recursive: true });
  const file = join(OUT, 'puntuam-' + day + '.csv');
  await writeFile(file, '﻿' + [header, ...rows].map((row) => row.map(cell).join(';')).join('\r\n') + '\r\n', 'utf8');
  console.log('Copia: ' + file);
  console.log(restaurants.length + ' restaurants, ' + rated + ' amb nota. Puntuen: ' + people.map((p) => p.displayName || p.color).join(' i ') + '.');
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });

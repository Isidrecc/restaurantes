// Formato del comentario (docs/diseno.md, sección 5, paso 4): marcas sencillas guardadas en el mismo texto.
// **negreta**, *cursiva*, __subratllat__ y [text](https://web.com) para los enlaces, solo http y https.
// Párrafos separados por una línea en blanco; un salto de línea dentro de un párrafo se respeta.
// Lo que no se entiende como marca se deja tal cual. El HTML se escapa siempre: el texto no puede meter etiquetas.

export const MARKS = { bold: '**', italic: '*', underline: '__' };
const TAGS = { '**': 'strong', '*': 'em', '__': 'u' };
const LINK = /^\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/i;

function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function blank(c) { return c === undefined || /\s/.test(c); }

export function paragraphs(text) {
  return String(text || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

// Una línea de texto a nodos: { t: 'text', v }, { t: 'strong' | 'em' | 'u', c } o { t: 'a', href, c }.
// Una sola pasada con una pila de marcas abiertas: una marca abre si la sigue algo que no es un espacio y
// cierra si la precede algo que no es un espacio. Las que quedan sin pareja vuelven a ser texto.
function parse(s, inLink) {
  const out = [];
  const stack = [];
  let buf = '';
  const flush = () => { if (buf) { out.push({ t: 'text', v: buf }); buf = ''; } };
  const literal = (n) => (n.t === 'mark' ? { t: 'text', v: n.v } : n);
  const open = (v) => { out.push({ t: 'mark', v }); stack.push({ v, pos: out.length - 1 }); };
  // La marca abierta más cercana del mismo carácter que cabe en lo que queda de la tira.
  const findOpen = (ch, rest) => {
    for (let k = stack.length - 1; k >= 0; k--) if (stack[k].v[0] === ch && stack[k].v.length <= rest) return k;
    return -1;
  };
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '[' && !inLink) {
      const m = LINK.exec(s.slice(i));
      if (m) { flush(); out.push({ t: 'a', href: m[2], c: parse(m[1], true) }); i += m[0].length; continue; }
    }
    if (ch === '*' || ch === '_') {
      let len = 1;
      while (s[i + len] === ch) len++;
      if (ch === '*' ? len <= 3 : len === 2) {
        flush();
        let rest = len;
        if (!blank(s[i - 1])) {
          for (let k = findOpen(ch, rest); k >= 0; k = findOpen(ch, rest)) {
            const e = stack[k];
            const kids = out.splice(e.pos + 1).map(literal);
            out.length = e.pos;
            stack.length = k;
            if (kids.length) out.push({ t: TAGS[e.v], c: kids }); else out.push({ t: 'text', v: e.v + e.v });
            rest -= e.v.length;
          }
        }
        if (rest > 0 && !blank(s[i + len])) {
          if (ch === '_') open('__');
          else if (rest === 3) { open('**'); open('*'); }
          else open(ch.repeat(rest));
          rest = 0;
        }
        if (rest > 0) buf += ch.repeat(rest);
        i += len;
        continue;
      }
      buf += ch.repeat(len);
      i += len;
      continue;
    }
    buf += ch;
    i++;
  }
  flush();
  return out.map(literal);
}

function toHTML(nodes) {
  return nodes.map((n) => {
    if (n.t === 'text') return esc(n.v).replace(/\n/g, '<br>');
    if (n.t === 'a') return '<a href="' + esc(n.href) + '" target="_blank" rel="noopener noreferrer">' + toHTML(n.c) + '</a>';
    return '<' + n.t + '>' + toHTML(n.c) + '</' + n.t + '>';
  }).join('');
}
function toText(nodes) { return nodes.map((n) => (n.t === 'text' ? n.v : toText(n.c))).join(''); }

// El comentario de la ficha, con formato.
export function blogHTML(text) {
  return paragraphs(text).map((p) => '<p>' + toHTML(parse(p, false)) + '</p>').join('');
}
// Un trozo de comentario sin las marcas (los enlaces dejan solo su texto), para la entradilla de Inici.
export function plainText(text) { return toText(parse(String(text || ''), false)); }

// Botones de formato de Edita: rodea lo seleccionado con la marca o, si ya la tiene, se la quita.
// Devuelve el texto nuevo y la selección que hay que dejar.
export function toggleMark(value, start, end, mark) {
  let a = start, b = end;
  while (a < b && /\s/.test(value[a])) a++;
  while (b > a && /\s/.test(value[b - 1])) b--;
  const ch = mark[0];
  const runBefore = (() => { let n = 0; while (value[a - 1 - n] === ch) n++; return n; })();
  const runAfter = (() => { let n = 0; while (value[b + n] === ch) n++; return n; })();
  // Ya marcado: «*» es cursiva con una o tres (negreta y cursiva); «**» y «__», con dos o más.
  const has = mark === '*' ? (runBefore === 1 || runBefore === 3) && (runAfter === 1 || runAfter === 3)
    : runBefore >= 2 && runAfter >= 2 && (ch === '*' || (runBefore === 2 && runAfter === 2));
  const m = mark.length;
  if (has && a < b) {
    return { value: value.slice(0, a - m) + value.slice(a, b) + value.slice(b + m), start: a - m, end: b - m };
  }
  // La selección incluye las marcas: también se quitan.
  const sel = value.slice(a, b);
  if (sel.length > 2 * m && sel.startsWith(mark) && sel.endsWith(mark) && sel[m] !== ch && sel[sel.length - m - 1] !== ch) {
    return { value: value.slice(0, a) + sel.slice(m, -m) + value.slice(b), start: a, end: b - 2 * m };
  }
  return { value: value.slice(0, a) + mark + sel + mark + value.slice(b), start: a + m, end: b + m };
}

// Botón de enlace: la dirección se completa con https:// si no lo lleva; si no es válida, null.
export function cleanURL(raw) {
  let s = String(raw || '').trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s.replace(/^\/+/, '');
  let u;
  try { u = new URL(s); } catch (e) { return null; }
  if ((u.protocol !== 'http:' && u.protocol !== 'https:') || u.hostname.indexOf('.') < 0) return null;
  // Los paréntesis cerrarían la marca antes de tiempo.
  return u.href.replace(/\(/g, '%28').replace(/\)/g, '%29');
}
// Inserta el enlace en lugar de lo seleccionado; sin selección, el texto es el nombre de la web.
export function insertLink(value, start, end, url) {
  let a = start, b = end;
  while (a < b && /\s/.test(value[a])) a++;
  while (b > a && /\s/.test(value[b - 1])) b--;
  let text = value.slice(a, b).replace(/\s*\n\s*/g, ' ').replace(/[[\]]/g, '');
  if (!text) text = new URL(url).hostname.replace(/^www\./, '');
  const md = '[' + text + '](' + url + ')';
  return { value: value.slice(0, a) + md + value.slice(b), start: a + md.length, end: a + md.length };
}

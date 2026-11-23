// Compresión de fotos antes de subirlas (resultado de la prueba técnica, especificación sección 8).
// Foto: lado mayor de 1600 px en JPEG. Miniatura: 400 px.
// Si el original ya es JPEG y cabe en 1600 px, se sube tal cual para no hacerlo crecer.

const FULL = 1600;
const THUMB = 400;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se ha podido leer la imagen')); };
    img.src = url;
  });
}

function toJpeg(img, maxSide, quality) {
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * scale);
  c.height = Math.round(img.naturalHeight * scale);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('No se ha podido comprimir la imagen'))), 'image/jpeg', quality));
}

export async function preparePhoto(file) {
  const img = await loadImage(file);
  const fits = Math.max(img.naturalWidth, img.naturalHeight) <= FULL;
  const full = file.type === 'image/jpeg' && fits ? file : await toJpeg(img, FULL, 0.82);
  const thumb = await toJpeg(img, THUMB, 0.78);
  return { full, thumb };
}

# Iconos de la app: opción A del logotipo (docs/logo/README.md), una mesa ovalada vista en planta con
# ocho sillas alrededor, en crema sobre terracota (--accent-strong y --bg de app/styles.css).
# Uso, desde la raíz del repo:  python tools/icons.py
# Necesita Pillow (pip install pillow). Dibuja a 4 aumentos y reduce, para que los bordes salgan suaves.
import math
import os
from PIL import Image, ImageDraw

TERRA = '#a3553a'
CREAM = '#faf6f2'
S = 4
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'icons')


def logo(size, scale=1.0):
    """La mesa y las sillas en un cuadrado de 512 unidades; scale < 1 deja más margen (icono adaptable)."""
    W = size * S
    k = W / 512 * scale
    c = W / 2
    im = Image.new('RGB', (W, W), TERRA)
    d = ImageDraw.Draw(im)

    def ellipse(x, y, rx, ry):
        d.ellipse([c + (x - rx) * k, c + (y - ry) * k, c + (x + rx) * k, c + (y + ry) * k], fill=CREAM)

    rx, ry, gap, r = 150, 92, 44, 25
    ellipse(0, 0, rx, ry)  # la mesa
    for dx in (-92, 0, 92):  # tres sillas a cada lado
        dy = ry * math.sqrt(1 - (dx / rx) ** 2)
        ellipse(dx, -dy - gap, r, r)
        ellipse(dx, dy + gap, r, r)
    ellipse(-rx - gap, 0, r, r)  # una en cada cabecera
    ellipse(rx + gap, 0, r, r)
    return im.resize((size, size), Image.LANCZOS)


def main():
    files = {
        'icon-180.png': logo(180),               # iPhone (apple-touch-icon)
        'icon-192.png': logo(192),               # Android y manifiesto
        'icon-512.png': logo(512),               # manifiesto y vista previa al compartir
        'icon-maskable-512.png': logo(512, 0.8),  # Android recorta en círculo: el dibujo cabe en el 80 % central
        'favicon-32.png': logo(32),              # pestaña del navegador
    }
    for name, im in files.items():
        im.save(os.path.join(OUT, name), optimize=True)
        print('icons/' + name)


if __name__ == '__main__':
    main()

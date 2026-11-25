# Propuestas de logotipo: mesa ovalada vista en planta con las sillas como puntos alrededor.
# Dibuja a 4x y reduce para suavizar los bordes. Genera cada variante y una lámina comparativa.
import math, sys, os
from PIL import Image, ImageDraw, ImageFont

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
S = 4  # supermuestreo

# Paleta «Terracota suau» (app/styles.css)
TERRA = '#a3553a'    # --accent-strong
PEACH = '#eec0ab'    # --accent
CREAM = '#faf6f2'    # --bg
SURF = '#fffdfb'     # --surface
INK = '#33261f'      # --ink
AZUL = '#a3acd0'     # --p-azul (oscuro, más claro)
ROSA = '#8fd0ce'     # --p-rosa (oscuro, más claro)

def chairs(cx, cy, rx, ry, gap, xs):
    """Sillas arriba y abajo en las x dadas y una en cada cabecera."""
    pts = []
    for dx in xs:
        dy = ry * math.sqrt(max(0.0, 1 - (dx / rx) ** 2))
        for sgn in (-1, 1):
            # Separación medida en la normal aproximada: vertical, con algo de corrección en los extremos
            pts.append((cx + dx, cy + sgn * (dy + gap)))
    pts.append((cx - rx - gap, cy))
    pts.append((cx + rx + gap, cy))
    return pts

def icon(bg, table, chair, size=512, rim=None, special=None, xs=(-92, 0, 92), rx=150, ry=92, gap=44, cr=25):
    W = size * S
    k = W / 512
    im = Image.new('RGB', (W, W), bg)
    d = ImageDraw.Draw(im)
    cx = cy = W / 2
    RX, RY = rx * k, ry * k
    if rim:
        t = 10 * k
        d.ellipse([cx - RX - t, cy - RY - t, cx + RX + t, cy + RY + t], fill=rim)
    d.ellipse([cx - RX, cy - RY, cx + RX, cy + RY], fill=table)
    pts = chairs(cx, cy, RX, RY, gap * k, [x * k for x in xs])
    R = cr * k
    for i, (x, y) in enumerate(pts):
        col = chair
        if special and i in special:
            col = special[i]
        d.ellipse([x - R, y - R, x + R, y + R], fill=col)
    return im.resize((size, size), Image.LANCZOS)

variants = {
    'A_terracota': dict(bg=TERRA, table=CREAM, chair=CREAM),
    'B_crema': dict(bg=CREAM, table=TERRA, chair=TERRA),
    # Las dos sillas de las cabeceras en los colores de quien puntúa (tinta y turquesa).
    'C_dos_colores': dict(bg=TERRA, table=CREAM, chair=PEACH, special={6: AZUL, 7: ROSA}),
}

def rounded(im, radius_frac=0.2237):
    """Máscara de esquinas redondeadas como la del iPhone (aproximada)."""
    w = im.size[0]
    m = Image.new('L', (w * S, w * S), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w * S - 1, w * S - 1], radius=int(w * S * radius_frac), fill=255)
    m = m.resize((w, w), Image.LANCZOS)
    out = Image.new('RGBA', (w, w), (0, 0, 0, 0))
    out.paste(im, (0, 0), m)
    return out

icons = {}
for name, kw in variants.items():
    im = icon(**kw)
    im.save(os.path.join(OUT, name + '.png'))
    icons[name] = im

# Lámina: por cada variante, grande (180, como en el iPhone), pequeña (60) sobre fondo claro y oscuro.
try:
    font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 26)
    small = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 20)
except Exception:
    font = small = ImageFont.load_default()
labels = {'A_terracota': 'A · Terracota', 'B_crema': 'B · Crema', 'C_dos_colores': 'C · Dos colores'}
colw, H = 360, 640
sheet = Image.new('RGB', (colw * len(icons), H), '#ffffff')
d = ImageDraw.Draw(sheet)
for i, (name, im) in enumerate(icons.items()):
    x0 = i * colw
    d.text((x0 + 30, 20), labels[name], font=font, fill=INK)
    big = rounded(im.resize((240, 240), Image.LANCZOS))
    sheet.paste(big, (x0 + 60, 70), big)
    # Fondo claro y oscuro con el icono a tamaño de pantalla de inicio
    for j, (bgc, txt) in enumerate((('#e9e4de', INK), ('#1c1c1e', '#f2f2f7'))):
        y0 = 350 + j * 140
        d.rounded_rectangle([x0 + 30, y0, x0 + colw - 30, y0 + 125], radius=18, fill=bgc)
        sm = rounded(im.resize((60, 60), Image.LANCZOS))
        sheet.paste(sm, (x0 + 60, y0 + 18), sm)
        d.text((x0 + 58, y0 + 84), 'Puntuam', font=small, fill=txt)
        tiny = rounded(im.resize((32, 32), Image.LANCZOS))
        sheet.paste(tiny, (x0 + 170, y0 + 32), tiny)
        d.text((x0 + 212, y0 + 36), '32 px', font=small, fill=txt)
sheet.save(os.path.join(OUT, 'lamina.png'))
print('ok')

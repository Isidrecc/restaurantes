# Segunda ronda de logotipos, más simples: menos sillas y más grandes.
import math, sys, os
from PIL import Image, ImageDraw, ImageFont

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
S = 4
TERRA = '#a3553a'
PEACH = '#eec0ab'
CREAM = '#faf6f2'
INK = '#33261f'
AZUL = '#a3acd0'
ROSA = '#8fd0ce'

def icon(bg, table, chair, heads=True, xs=(), head_cols=None, rx=138, ry=96, gap=50, cr=34, size=512):
    W = size * S
    k = W / 512
    im = Image.new('RGB', (W, W), bg)
    d = ImageDraw.Draw(im)
    cx = cy = W / 2
    RX, RY, G, R = rx * k, ry * k, gap * k, cr * k
    d.ellipse([cx - RX, cy - RY, cx + RX, cy + RY], fill=table)
    pts = []
    for dx in xs:
        dx *= k
        dy = RY * math.sqrt(max(0.0, 1 - (dx / RX) ** 2))
        pts += [((cx + dx, cy - dy - G), chair), ((cx + dx, cy + dy + G), chair)]
    if heads:
        l, r = (head_cols or (chair, chair))
        pts += [((cx - RX - G, cy), l), ((cx + RX + G, cy), r)]
    for (x, y), col in pts:
        d.ellipse([x - R, y - R, x + R, y + R], fill=col)
    return im.resize((size, size), Image.LANCZOS)

variants = [
    ('D', 'D · Dos sillas', dict(bg=TERRA, table=CREAM, chair=CREAM)),
    ('E', 'E · Dos sillas, vuestros colores', dict(bg=TERRA, table=CREAM, chair=CREAM, head_cols=(AZUL, ROSA))),
    ('F', 'F · Cuatro sillas', dict(bg=TERRA, table=CREAM, chair=CREAM, xs=(0,), rx=150, ry=88, gap=46, cr=32)),
]

def rounded(im, frac=0.2237):
    w = im.size[0]
    m = Image.new('L', (w * S, w * S), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w * S - 1, w * S - 1], radius=int(w * S * frac), fill=255)
    m = m.resize((w, w), Image.LANCZOS)
    out = Image.new('RGBA', (w, w), (0, 0, 0, 0))
    out.paste(im, (0, 0), m)
    return out

font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 24)
small = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 20)
colw, H = 380, 640
sheet = Image.new('RGB', (colw * len(variants), H), '#ffffff')
d = ImageDraw.Draw(sheet)
for i, (key, label, kw) in enumerate(variants):
    im = icon(**kw)
    im.save(os.path.join(OUT, key + '.png'))
    x0 = i * colw
    d.text((x0 + 30, 20), label, font=font, fill=INK)
    big = rounded(im.resize((240, 240), Image.LANCZOS))
    sheet.paste(big, (x0 + 70, 70), big)
    for j, (bgc, txt) in enumerate((('#e9e4de', INK), ('#1c1c1e', '#f2f2f7'))):
        y0 = 350 + j * 140
        d.rounded_rectangle([x0 + 30, y0, x0 + colw - 30, y0 + 125], radius=18, fill=bgc)
        sm = rounded(im.resize((60, 60), Image.LANCZOS))
        sheet.paste(sm, (x0 + 60, y0 + 18), sm)
        d.text((x0 + 58, y0 + 84), 'Puntuam', font=small, fill=txt)
        tiny = rounded(im.resize((32, 32), Image.LANCZOS))
        sheet.paste(tiny, (x0 + 170, y0 + 32), tiny)
        d.text((x0 + 212, y0 + 36), '32 px', font=small, fill=txt)
sheet.save(os.path.join(OUT, 'lamina2.png'))
print('ok')

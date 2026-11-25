# Tercera ronda: conceptos distintos de la mesa, con la A como referencia.
import math, sys, os
from PIL import Image, ImageDraw, ImageFont

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
S = 4
W = 512 * S
k = S
TERRA = '#a3553a'
PEACH = '#eec0ab'
CREAM = '#faf6f2'
INK = '#33261f'
AZUL = '#a3acd0'
ROSA = '#8fd0ce'
FONTS = 'C:/Windows/Fonts/'

def canvas(bg=TERRA):
    im = Image.new('RGB', (W, W), bg)
    return im, ImageDraw.Draw(im)

def done(im):
    return im.resize((512, 512), Image.LANCZOS)

def circle(d, x, y, r, fill):
    d.ellipse([(x - r) * k, (y - r) * k, (x + r) * k, (y + r) * k], fill=fill)

# A: la mesa con ocho sillas (referencia)
def logo_A():
    im, d = canvas()
    d.ellipse([(256 - 150) * k, (256 - 92) * k, (256 + 150) * k, (256 + 92) * k], fill=CREAM)
    for dx in (-92, 0, 92):
        dy = 92 * math.sqrt(1 - (dx / 150) ** 2)
        circle(d, 256 + dx, 256 - dy - 44, 25, CREAM)
        circle(d, 256 + dx, 256 + dy + 44, 25, CREAM)
    circle(d, 256 - 194, 256, 25, CREAM)
    circle(d, 256 + 194, 256, 25, CREAM)
    return done(im)

# G: monograma, una P con serifa
def logo_G():
    im, d = canvas()
    f = ImageFont.truetype(FONTS + 'georgiab.ttf', 330 * k)
    d.text((256 * k, 262 * k), 'P', font=f, fill=CREAM, anchor='mm')
    circle(d, 352, 352, 22, PEACH)
    return done(im)

# H: la roseta de la ficha, en hexágono
def logo_H():
    im, d = canvas()
    cx, cy, R = 256, 262, 176
    def pt(i, r):
        a = math.radians(-90 + 60 * i)
        return ((cx + r * math.cos(a)) * k, (cy + r * math.sin(a)) * k)
    hexo = [pt(i, R) for i in range(6)]
    d.polygon(hexo, outline=PEACH, width=9 * k)
    d.polygon([pt(i, R / 2) for i in range(6)], outline=PEACH, width=5 * k)
    for i in range(6):
        d.line([pt(i, 0), pt(i, R)], fill=PEACH, width=4 * k)
    vals = [0.92, 0.78, 0.88, 0.62, 0.96, 0.72]
    d.polygon([pt(i, R * v) for i, v in enumerate(vals)], fill=CREAM)
    return done(im)

# I: chincheta de mapa con un plato dentro
def logo_I():
    im, d = canvas()
    cx, cy, r, tip = 256, 222, 128, 446
    dist = tip - cy
    a = math.acos(r / dist)
    p1 = (cx + r * math.sin(a), cy + r * math.cos(a))
    p2 = (cx - r * math.sin(a), cy + r * math.cos(a))
    d.polygon([(p1[0] * k, p1[1] * k), (cx * k, tip * k), (p2[0] * k, p2[1] * k)], fill=CREAM)
    circle(d, cx, cy, r, CREAM)
    circle(d, cx, cy, 70, TERRA)
    circle(d, cx, cy, 50, PEACH)
    return done(im)

# J: plato con tenedor y cuchillo, vistos desde arriba
def logo_J():
    im, d = canvas()
    circle(d, 256, 256, 120, CREAM)
    circle(d, 256, 256, 86, PEACH)
    circle(d, 256, 256, 78, CREAM)
    def rr(x0, y0, x1, y1, rad):
        d.rounded_rectangle([x0 * k, y0 * k, x1 * k, y1 * k], radius=rad * k, fill=CREAM)
    # Tenedor
    rr(90, 236, 108, 400, 9)
    rr(78, 196, 120, 246, 14)
    for x in (79, 94, 109):
        rr(x, 120, x + 10, 214, 5)
    # Cuchillo
    rr(404, 236, 422, 400, 9)
    d.pieslice([392 * k, 112 * k, 452 * k, 272 * k], 180, 270, fill=CREAM)
    rr(404, 112, 422, 250, 4)
    d.rectangle([404 * k, 150 * k, 422 * k, 250 * k], fill=CREAM)
    return done(im)

# K: una nota, como los recuadros de la app
def logo_K():
    im, d = canvas()
    f = ImageFont.truetype(FONTS + 'segoeuib.ttf', 200 * k)
    d.text((256 * k, 248 * k), '9,5', font=f, fill=CREAM, anchor='mm')
    return done(im)

logos = [
    ('A', 'A · Mesa (la anterior)', logo_A),
    ('G', 'G · Monograma', logo_G),
    ('H', 'H · Roseta', logo_H),
    ('I', 'I · Chincheta con plato', logo_I),
    ('J', 'J · Plato y cubiertos', logo_J),
    ('K', 'K · Una nota', logo_K),
]

def rounded(im, frac=0.2237):
    w = im.size[0]
    m = Image.new('L', (w * S, w * S), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w * S - 1, w * S - 1], radius=int(w * S * frac), fill=255)
    m = m.resize((w, w), Image.LANCZOS)
    out = Image.new('RGBA', (w, w), (0, 0, 0, 0))
    out.paste(im, (0, 0), m)
    return out

font = ImageFont.truetype(FONTS + 'segoeui.ttf', 24)
small = ImageFont.truetype(FONTS + 'segoeui.ttf', 18)
cw, ch = 380, 430
cols = 3
sheet = Image.new('RGB', (cw * cols, ch * 2), '#ffffff')
d = ImageDraw.Draw(sheet)
for n, (key, label, fn) in enumerate(logos):
    im = fn()
    im.save(os.path.join(OUT, key + '.png'))
    x0, y0 = (n % cols) * cw, (n // cols) * ch
    d.text((x0 + 30, y0 + 16), label, font=font, fill=INK)
    big = rounded(im.resize((210, 210), Image.LANCZOS))
    sheet.paste(big, (x0 + 85, y0 + 60), big)
    for j, (bgc, txt) in enumerate((('#e9e4de', INK), ('#1c1c1e', '#f2f2f7'))):
        bx = x0 + 30 + j * 165
        d.rounded_rectangle([bx, y0 + 290, bx + 155, y0 + 410], radius=16, fill=bgc)
        sm = rounded(im.resize((60, 60), Image.LANCZOS))
        sheet.paste(sm, (bx + 14, y0 + 304), sm)
        tiny = rounded(im.resize((32, 32), Image.LANCZOS))
        sheet.paste(tiny, (bx + 98, y0 + 318), tiny)
        d.text((bx + 12, y0 + 372), 'Puntuam', font=small, fill=txt)
sheet.save(os.path.join(OUT, 'lamina3.png'))
print('ok')

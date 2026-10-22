"""The Magic Rainbow Bus - Episode 1, Opening Shot.

World space: 1920x1080 design units, y down. Ground line y≈900.
The background is baked once into a large "plate" and sampled per frame
through the camera, so moving things (clouds, water sparkle, pollen,
characters, captions) can be drawn live while detail stays high.
"""
from __future__ import annotations

import math
import random

from PIL import Image, ImageDraw, ImageFilter

from lib import (Canvas, arc_points, bez, ease_in_out, gradient, hexc, lerp,
                 mix, shade, smoothstep, with_alpha)
from characters import render_sprite, WORLD_HEIGHT

W, H = 1920, 1080
S = 2

# plate covers this world rectangle
PX0, PY0, PX1, PY1 = -460, -300, 2380, 1400
PLATE_W, PLATE_H = PX1 - PX0, PY1 - PY0

# ---------------------------------------------------------------- palette
SKY_TOP = hexc("3FB8EE")
SKY_MID = hexc("83D5F7")
SKY_HOR = hexc("DFF6E9")
SUN = hexc("FFF8CF")
HILL_A = hexc("A7D6BC")
HILL_B = hexc("8EC9A4")
HILL_C = hexc("72BE8E")
FAR_GRASS = hexc("96D287")
MID_GRASS = hexc("7EC86F")
NEAR_GRASS = hexc("57AE4E")
NEAR_GRASS_D = hexc("469B44")
PATH = hexc("D8C79A")
WATER_TOP = hexc("9AE4F7")
WATER = hexc("46B6E0")
WATER_D = hexc("1F8FBF")
STONE = hexc("CEC4AD")
STONE_D = hexc("A79C86")
STONE_L = hexc("E9E1CC")
TRUNK = hexc("8A6746")
LEAF_A = hexc("4F9E5C")
LEAF_B = hexc("3E8A50")

FLOWERS = [hexc("F98BB4"), hexc("FFFDF2"), hexc("FFD447"), hexc("BE93F0"),
           hexc("FF9A57"), hexc("8CC8F5"), hexc("F4666B"), hexc("A8E063"),
           hexc("FFC0D9")]


# ---------------------------------------------------------------- stream
def stream_center(u):
    """Centreline of the stream, u in [0,1] (far -> near)."""
    p0, p1, p2, p3 = (1186, 556), (1214, 700), (1300, 900), (1740, 1400)
    mt = 1 - u
    x = (mt ** 3) * p0[0] + 3 * (mt ** 2) * u * p1[0] + 3 * mt * u * u * p2[0] + u ** 3 * p3[0]
    y = (mt ** 3) * p0[1] + 3 * (mt ** 2) * u * p1[1] + 3 * mt * u * u * p2[1] + u ** 3 * p3[1]
    return x, y


def stream_halfwidth(u):
    return 16 + 268 * (u ** 2.3)


def stream_frame(u):
    """(centre, normal, halfwidth) at parameter u."""
    x, y = stream_center(u)
    x2, y2 = stream_center(min(1.0, u + 0.012))
    dx, dy = x2 - x, y2 - y
    L = math.hypot(dx, dy) or 1.0
    return (x, y), (-dy / L, dx / L), stream_halfwidth(u)


def stream_polygon(n=60, expand=1.0):
    left, right = [], []
    for i in range(n + 1):
        u = i / n
        (x, y), (nx, ny), hw = stream_frame(u)
        hw *= expand
        left.append((x + nx * hw, y + ny * hw))
        right.append((x - nx * hw, y - ny * hw))
    return left + list(reversed(right))


# ---------------------------------------------------------------- decorations
def flower(c: Canvas, x, y, h, col, sway=0.0, petals=5, size=1.0, kind="daisy"):
    topx = x + math.sin(sway) * h * 0.3
    topy = y - h
    stem = hexc("3F8F45")
    c.line([(x, y), (x + math.sin(sway) * h * 0.16, y - h * 0.55), (topx, topy + 5 * size)], stem, 2.6 * size)
    # leaves
    for sgn in (-1, 1):
        ly = y - h * (0.34 if sgn < 0 else 0.52)
        c.poly([(x, ly), (x + sgn * 13 * size, ly - 9 * size),
                (x + sgn * 15 * size, ly + 2 * size), (x + sgn * 3 * size, ly + 4 * size)],
               hexc("4E9E52"))
    r = 7.2 * size
    if kind == "tulip":
        c.poly([(topx - r * 0.95, topy + r * 0.35), (topx - r * 0.7, topy - r * 0.9),
                (topx, topy - r * 0.25), (topx + r * 0.7, topy - r * 0.9),
                (topx + r * 0.95, topy + r * 0.35)], col)
        c.poly([(topx - r * 0.45, topy + r * 0.2), (topx - r * 0.3, topy - r * 0.7),
                (topx + r * 0.1, topy - r * 0.1), (topx + r * 0.05, topy + r * 0.2)],
               shade(col, 0.22))
    elif kind == "round":
        for i in range(petals):
            a = math.radians(i * 360 / petals + 10)
            c.ellipse(topx + math.cos(a) * r * 0.72, topy + math.sin(a) * r * 0.72,
                      r * 0.78, r * 0.7, col)
        c.circle(topx, topy, r * 0.52, hexc("FFCE3D"))
        c.circle(topx, topy, r * 0.28, hexc("F0A82E"))
    else:  # daisy
        for i in range(petals):
            a = math.radians(i * 360 / petals)
            c.ellipse(topx + math.cos(a) * r * 0.88, topy + math.sin(a) * r * 0.88,
                      r * 0.62, r * 0.46, col)
        c.circle(topx, topy, r * 0.48, hexc("FFD447"))


def grass_blade(c: Canvas, x, y, h, lean, col, w):
    tipx, tipy = x + lean, y - h
    c.poly([(x - w, y), (x + w, y), (tipx + w * 0.25, tipy), (tipx - w * 0.15, tipy - h * 0.02)], col)


def tuft(c: Canvas, x, y, h, seed, col, blades=5):
    for i in range(blades):
        k = (i - (blades - 1) / 2) / max(1, (blades - 1) / 2)
        lean = k * h * 0.45 + math.sin(seed + i * 2.1) * h * 0.18
        grass_blade(c, x + k * 5, y, h * (0.72 + 0.34 * math.cos(k * 1.2)), lean, col, 1.9)


def tree(c: Canvas, x, y, s, haze=0.0, rnd=None):
    rnd = rnd or random
    c.poly([(x - 5 * s, y + 2), (x - 3.4 * s, y - 30 * s), (x + 3.4 * s, y - 30 * s), (x + 5 * s, y + 2)], TRUNK)
    base = mix(LEAF_B, HILL_B, haze)
    top = mix(LEAF_A, HILL_A, haze * 0.8)
    blobs = [(-15, -34, 16), (15, -35, 17), (0, -50, 19), (-7, -22, 13), (9, -21, 12)]
    for (dx, dy, r) in blobs:
        c.circle(x + dx * s, y + dy * s, r * s, base)
    for (dx, dy, r) in blobs[:3]:
        c.circle(x + dx * s * 0.85, y + (dy - 6) * s, r * s * 0.72, top)


def stone_stump(c: Canvas, x, y, s, flip=1, rot=0.0):
    """Broken stone end of the vanished rainbow bridge."""
    def P(dx, dy):
        a = math.radians(rot)
        px, py = dx * s * flip, dy * s
        return (x + px * math.cos(a) - py * math.sin(a), y + px * math.sin(a) + py * math.cos(a))

    c.poly([P(-52, 6), P(-46, -44), P(-12, -58), P(26, -50), P(52, -30), P(56, 6)], STONE)
    c.poly([P(-52, 6), P(-46, -44), P(-14, -56), P(-6, 6)], shade(STONE, -0.09))
    # jagged broken top
    c.poly([P(-46, -44), P(-24, -62), P(-6, -48), P(10, -66), P(30, -48), P(46, -38),
            P(52, -30), P(26, -50), P(-12, -58)], STONE_L)
    c.line([P(-18, -50), P(-10, -22), P(-22, 2)], STONE_D, 2.4 * s)
    c.line([P(20, -44), P(14, -24)], with_alpha(STONE_D, 150), 2.0 * s)
    for i in range(5):
        c.ellipse(*P(-34 + i * 16, -2 - (i % 2) * 6), 9 * s * 0.8, 6 * s * 0.7,
                  with_alpha(hexc("6FB56A"), 140))


def cloud(c: Canvas, x, y, s, alpha=255):
    puffs = [(-64, 8, 30), (-30, -10, 40), (10, -20, 46), (48, -4, 34), (76, 10, 24), (0, 16, 36)]
    for (dx, dy, r) in puffs:
        c.circle(x + dx * s, y + dy * s + r * s * 0.35, r * s, with_alpha(hexc("FFFFFF"), alpha))
    for (dx, dy, r) in puffs[:4]:
        c.circle(x + dx * s, y + (dy - 4) * s + r * s * 0.1, r * s * 0.7,
                 with_alpha(hexc("FFFFFF"), min(255, alpha + 20)))


# ---------------------------------------------------------------- plate
def build_plate(skip=()) -> Image.Image:
    c = Canvas(PLATE_W, PLATE_H, S)
    c.set_origin(-PX0, -PY0)
    rnd = random.Random(11)
    HORIZON = 556

    # ---------------- sky (opaque base for the whole plate)
    c.img.paste(gradient(c.img.size, SKY_TOP, SKY_HOR, "v"), (0, 0))

    # sun
    c.glow(1500, 150, 380, hexc("FFF3B4"), 0.45)
    c.glow(1500, 150, 190, hexc("FFFBE2"), 0.8)
    c.circle(1500, 150, 66, SUN)
    c.circle(1500, 150, 66, None, outline=with_alpha(hexc("FFFDF2"), 210), width=5)
    for i in range(10):
        a = math.radians(i * 36 + 10)
        c.line([(1500 + 82 * math.cos(a), 150 + 82 * math.sin(a)),
                (1500 + (112 + (12 if i % 2 else 0)) * math.cos(a), 150 + (112 + (12 if i % 2 else 0)) * math.sin(a))],
               with_alpha(hexc("FFF7CB"), 110), 7 if i % 2 else 4)

    # ---------------- layered hills
    def ridge(y0, amp, freq, phase, col, x_from=PX0, x_to=PX1, step=14, bottom=PY1):
        pts = [(x_from, bottom)]
        x = x_from
        while x <= x_to:
            y = y0 + math.sin((x + phase) * freq) * amp + math.sin((x + phase) * freq * 2.3 + 1.1) * amp * 0.3
            pts.append((x, y))
            x += step
        pts += [(x_to, bottom)]
        c.poly(pts, col)

    ridge(524, 26, 0.0026, 300, HILL_A)
    ridge(556, 30, 0.0021, 90, HILL_B)
    # soft rounded caps
    for (x, r) in [(-320, 130), (-60, 100), (230, 150), (520, 110), (800, 140), (1080, 105),
                   (1380, 135), (1660, 115), (1950, 150), (2250, 120)]:
        c.circle(x, 560 + r * 0.55, r, HILL_B)
    ridge(600, 20, 0.0031, 620, HILL_C)

    # far trees on the ridge line
    for x in range(-300, 2300, 78):
        y = 600 + math.sin((x + 620) * 0.0031) * 20 + math.sin((x + 620) * 0.0072) * 6
        if rnd.random() < 0.5:
            tree(c, x + rnd.uniform(-14, 14), y + 6, rnd.uniform(0.5, 0.8), haze=0.6, rnd=rnd)

    # ---------------- far meadow
    ridge(646, 16, 0.0044, 40, FAR_GRASS, step=18)

    # ---------------- meadow bands with soft, organic edges
    top_mid = []
    xx = PX0 - 60
    while xx <= PX1 + 60:
        top_mid.append((xx, 742 + math.sin(xx * 0.0031 + 0.6) * 22 + math.sin(xx * 0.0071 + 2.2) * 9))
        xx += 16
    if 'mid' not in skip: c.soft_poly(top_mid + [(PX1 + 60, PY1 + 60), (PX0 - 60, PY1 + 60)], MID_GRASS, blur=26)

    top_near = []
    xx = PX0 - 60
    while xx <= PX1 + 60:
        top_near.append((xx, 858 + math.sin(xx * 0.0036 + 1.9) * 26 + math.sin(xx * 0.0092 + 0.3) * 10))
        xx += 16
    if 'near' not in skip: c.soft_poly(top_near + [(PX1 + 60, PY1 + 60), (PX0 - 60, PY1 + 60)], NEAR_GRASS, blur=22)

    # warm light pools dancing over the grass
    for (x, y, rx, ry, col) in [
        (-160, 830, 430, 120, hexc("9CD98A")), (520, 860, 470, 130, hexc("94D483")),
        (1180, 828, 420, 110, hexc("A2DE8E")), (1820, 850, 480, 130, hexc("93D382")),
        (120, 1040, 520, 150, hexc("7FC76C")), (1280, 1070, 560, 160, hexc("7CC46A")),
        (2000, 1020, 460, 140, hexc("80C86D")),
    ]:
        if "pools" not in skip: c.soft_ellipse(x, y, rx, ry, col, blur=64)

    # ---------------- the stream
    poly = stream_polygon()
    c.grad_poly(poly, WATER_TOP, WATER_D, "v")

    water = Canvas(PLATE_W, PLATE_H, S)
    water.set_origin(-PX0, -PY0)
    for i in range(150):
        u = rnd.uniform(0, 1)
        (cx, cy), (nx, ny), hw = stream_frame(u)
        off = rnd.uniform(-0.9, 0.9)
        x, y = cx + nx * hw * off, cy + ny * hw * off
        ln = rnd.uniform(10, 46) * (0.4 + u)
        light = rnd.random() < 0.68
        col = with_alpha(hexc("E6FAFF"), rnd.randint(80, 165)) if light else \
            with_alpha(hexc("2187B4"), rnd.randint(40, 80))
        water.line([(x - ln / 2, y), (x + ln / 2, y - 1.0)], col, rnd.uniform(1.4, 3.2 * (0.6 + u)))
    # sky reflection down the middle
    refl = Canvas(PLATE_W, PLATE_H, S)
    refl.set_origin(-PX0, -PY0)
    for i in range(40):
        u = i / 40
        (cx, cy), (nx, ny), hw = stream_frame(u)
        refl.ellipse(cx, cy, hw * 0.55, hw * 0.16, with_alpha(hexc("DCF4FF"), 70))
    water.img.alpha_composite(refl.img)
    # clip shimmer to the water shape
    mask = Image.new("L", c.img.size, 0)
    ImageDraw.Draw(mask).polygon([((x - PX0) * S, (y - PY0) * S) for x, y in poly], fill=255)
    water.img.putalpha(Image.composite(water.img.getchannel("A"), Image.new("L", water.img.size, 0), mask))
    c.img.alpha_composite(water.img)

    # bank highlight right at the waterline (sand), softened
    bank = Canvas(PLATE_W, PLATE_H, S)
    bank.set_origin(-PX0, -PY0)
    for i in range(121):
        u = i / 120
        (cx, cy), (nx, ny), hw = stream_frame(u)
        for side in (1, -1):
            bank.ellipse(cx + nx * hw * side, cy + ny * hw * side, 7 + 30 * u, 4 + 11 * u,
                         with_alpha(hexc("E4D7AE"), 95))
    bank.blur(9)
    c.img.alpha_composite(bank.img)
    # pebbles at the waterline
    for i in range(90):
        u = rnd.uniform(0.05, 1)
        (cx, cy), (nx, ny), hw = stream_frame(u)
        side = rnd.choice([-1, 1])
        off = hw * rnd.uniform(0.95, 1.15)
        c.ellipse(cx + nx * off * side, cy + ny * off * side,
                  rnd.uniform(2.5, 6.5) * (0.5 + u), rnd.uniform(1.6, 4) * (0.5 + u),
                  rnd.choice([hexc("CFC3A4"), hexc("B3A88D"), hexc("E7DEC7"), hexc("9C927C")]))

    c.flush_alpha()
    # ---------------- mask of the stream so plants never grow in the water
    wet = Image.new("L", c.img.size, 0)
    ImageDraw.Draw(wet).polygon([((x - PX0) * S, (y - PY0) * S) for x, y in poly], fill=255)
    wet = wet.resize((PLATE_W, PLATE_H), Image.BILINEAR)
    wp = wet.load()

    def in_water(x, y, pad=18):
        px, py = int(x - PX0), int(y - PY0)
        if not (0 <= px < PLATE_W and 0 <= py < PLATE_H):
            return False
        return wp[px, py] > 0 or any(
            wp[int(max(0, min(PLATE_W - 1, x - PX0 + dx))), int(max(0, min(PLATE_H - 1, y - PY0 + dy)))] > 0
            for dx, dy in ((pad, 0), (-pad, 0), (0, pad), (0, -pad)))

    # ---------------- grass + flowers on the near bank
    for i in range(260):
        x = rnd.uniform(PX0, PX1)
        y = rnd.uniform(770, PY1)
        d = (y - 700) / 700
        if in_water(x, y, 10):
            continue
        col = with_alpha(rnd.choice([NEAR_GRASS_D, hexc("3F9142"), hexc("68BC58")]), 225)
        tuft(c, x, y, 9 + d * 26, rnd.uniform(0, 6.28), col, blades=rnd.choice([3, 4, 5]))

    for i in range(120):
        x = rnd.uniform(PX0, PX1)
        y = rnd.uniform(790, PY1 - 10)
        d = (y - 700) / 700
        if in_water(x, y, 26):
            continue
        flower(c, x, y, 18 + d * 46, rnd.choice(FLOWERS), rnd.uniform(-0.55, 0.55),
               petals=rnd.choice([5, 6, 8]), size=0.75 + d * 0.95,
               kind=rnd.choice(["daisy", "daisy", "round", "tulip"]))

    # foreground flower bed framing the bottom-left
    for i in range(16):
        x = rnd.uniform(-460, 300)
        y = rnd.uniform(1130, 1400)
        flower(c, x, y, rnd.uniform(70, 130), rnd.choice(FLOWERS), rnd.uniform(-0.4, 0.4),
               petals=6, size=1.9, kind=rnd.choice(["daisy", "round", "tulip"]))

    # bushes at the edges
    for (x, y, s) in [(-430, 980, 1.6), (-250, 1130, 1.25), (2360, 960, 1.4), (2150, 1180, 1.5)]:
        for k in range(5):
            c.circle(x + (k - 2) * 36 * s, y - 18 * s - (k % 2) * 16 * s, (36 - abs(k - 2) * 6) * s,
                     mix(hexc("46964F"), hexc("5CAF5F"), (k % 3) / 3))
        for k in range(5):
            c.circle(x + (k - 2) * 36 * s, y - 28 * s - (k % 2) * 14 * s, (17 - abs(k - 2) * 3.5) * s,
                     with_alpha(hexc("79C67C"), 140))

    # ---------------- bridge stumps hugging the banks
    # left bank stump (near Sunny) and the opposite bank stump across the water
    (cx, cy), (nx, ny), hw = stream_frame(0.60)
    stone_stump(c, cx - nx * (hw + 70), cy - ny * (hw + 70), 1.45, flip=-1, rot=3)
    (cx2, cy2), (nx2, ny2), hw2 = stream_frame(0.60)
    stone_stump(c, cx2 + nx2 * (hw2 + 74), cy2 + ny2 * (hw2 + 74), 1.35, flip=1, rot=-3)


    # ---------------- unifying light + gentle vignette
    warm = Canvas(PLATE_W, PLATE_H, S)
    warm.img.paste(gradient(warm.img.size, with_alpha(hexc("FFE9B0"), 26),
                            with_alpha(hexc("FFD08A"), 8), "v"), (0, 0))
    c.img.alpha_composite(warm.img)

    c.flush_alpha()
    return c.img


PLATE = None


def get_plate():
    global PLATE


def get_plate():
    global PLATE
    if PLATE is None:
        PLATE = build_plate()
    return PLATE

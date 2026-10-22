"""Cast of The Magic Rainbow Bus - parametric vector characters (v2).

Authored around (0,0) = ground point between the feet, y negative = up.
Each character has a nominal height in sprite units so the scene can scale
them into the same world.
"""
from __future__ import annotations

import math

from PIL import Image

from lib import Canvas, hexc, mix, shade, with_alpha, arc_points, bez, lerp

# ------------------------------------------------------------------ palette
GOLD = hexc("F7C144")
GOLD_L = hexc("FFDD78")
GOLD_D = hexc("DE9A22")
CREAM = hexc("FFF7E6")
INK = hexc("2B3A45")
TURQ = hexc("39CFC6")
TURQ_L = hexc("B6F5EF")
IRIS = hexc("4A93DC")
IRIS_D = hexc("255F9B")
WHITE = hexc("FDFDF9")
PIP_SH = hexc("DFE0DA")
PINK = hexc("F6A8BF")
PINK_D = hexc("DE7C99")
MINT = hexc("72D5AE")
MINT_D = hexc("3FAE85")
CARAMEL = hexc("CF9155")
CARAMEL_L = hexc("E6AE6F")
CARAMEL_D = hexc("A4662F")
SKY = hexc("74C5EA")
SKY_D = hexc("3C93C4")
FROG = hexc("61C64E")
FROG_L = hexc("92E27E")
FROG_D = hexc("3BA02E")
LEAF = hexc("4B9B3A")
DUCK = hexc("FFD64B")
DUCK_L = hexc("FFE98F")
ORANGE = hexc("F78C30")
AQUA = hexc("5FD3D9")
PURPLE = hexc("9A6AD6")
LAV = hexc("CBA9F2")
RAINBOW = [hexc("E9504B"), hexc("F79E2C"), hexc("F7D941"),
           hexc("55B85A"), hexc("3F8BD6"), hexc("8F63CB")]
GREY_BAND = hexc("B9C2BE")


def star(c: Canvas, x, y, r, colour, points=5, inner=0.42, rot=-90):
    pts = []
    n = points * 2
    for i in range(n):
        a = math.radians(rot + i * 360 / n)
        rr = r if i % 2 == 0 else r * inner
        pts.append((x + rr * math.cos(a), y + rr * math.sin(a)))
    c.poly(pts, colour)


def soft_eye(c: Canvas, x, y, rx, ry, blink=0.0, look=(0.0, 0.0), happy=False,
             iris=IRIS, sparkle=1.0):
    """Large cartoon eye with white sclera, coloured iris, pupil + highlights."""
    if happy or blink > 0.85:
        pts = arc_points(x, y + ry * 0.28, rx * 0.92, ry * 0.62, 200, 340, 20)
        c.line(pts, INK, max(2.4, rx * 0.16))
        return
    k = max(0.12, 1 - blink)
    ry2 = ry * k
    # socket shading
    c.ellipse(x, y, rx * 1.05, ry2 * 1.05, with_alpha(hexc("C9D6DA"), 90))
    c.ellipse(x, y, rx, ry2, WHITE)
    irx, iry = rx * 0.66, ry2 * 0.80
    ox, oy = look[0] * rx * 0.20, look[1] * ry2 * 0.16
    c.ellipse(x + ox, y + oy, irx, iry, iris)
    c.ellipse(x + ox, y + oy + iry * 0.22, irx * 0.90, iry * 0.72, IRIS_D)
    c.ellipse(x + ox, y + oy + iry * 0.04, irx * 0.42, iry * 0.52, hexc("16304A"))
    hx, hy = x + ox - irx * 0.32, y + oy - iry * 0.36
    c.ellipse(hx, hy, irx * 0.30 * sparkle, iry * 0.28 * sparkle, with_alpha(WHITE, 245))
    c.ellipse(x + ox + irx * 0.34, y + oy + iry * 0.30, irx * 0.15, iry * 0.15,
              with_alpha(WHITE, 175))
    # upper lid line
    lid = arc_points(x, y - ry2 * 0.10, rx * 1.0, ry2 * 1.02, 196, 344, 20)
    c.line(lid, with_alpha(INK, 55), max(1.6, rx * 0.10))


def brow(c: Canvas, x, y, w, angle, colour, thick=4.0):
    pts = [(x - w / 2, y - math.tan(math.radians(angle)) * w / 2),
           (x + w / 2, y + math.tan(math.radians(angle)) * w / 2)]
    c.line(pts, colour, thick)


def blush(c: Canvas, x, y, r, strength=1.0):
    c.glow(x, y, r, PINK, 0.34 * strength)


# ================================================================== SUNNY
def sunny(c: Canvas, t, blink=0.0, mood="curious", glow=1.0, look=(0.15, 0.05),
          badge_fill=0.0, sparkle=0.0, wheel_spin=0.0, talk=0.0):
    """Little golden-yellow rainbow bus. 256 units tall, 190 wide."""
    bob = math.sin(t * 2.0) * 1.4

    c.shadow(0, -1, 88, 13, (63, 82, 50, 105), 8)

    # ---- wheels (drawn first so the body overlaps their tops)
    for wx in (-62, 62):
        c.rrect(wx - 34, -66, wx + 34, -14, 14, shade(GOLD_D, -0.3))
        c.circle(wx, -26 + bob * 0.25, 30, hexc("242A32"))
        c.circle(wx, -26 + bob * 0.25, 24, hexc("303944"))
        c.circle(wx, -26 + bob * 0.25, 13.5, hexc("C7D6D8"))
        c.circle(wx, -26 + bob * 0.25, 9.0, hexc("8AA0A5"))
        for i in range(3):
            a = math.radians(wheel_spin + i * 120)
            c.line([(wx + 3.4 * math.cos(a), -26 + bob * 0.25 + 3.4 * math.sin(a)),
                    (wx + 8.0 * math.cos(a), -26 + bob * 0.25 + 8.0 * math.sin(a))],
                   hexc("B8C8CB"), 2.4)
        c.ellipse(wx - 9, -40 + bob * 0.25, 11, 4.5, with_alpha(WHITE, 55))

    # ---- body shell
    body = (bez([(-96, -34), (-100, -120), (-100, -196), (-74, -220)])
            + bez([(-74, -220), (-36, -234), (36, -234), (74, -220)])
            + bez([(74, -220), (100, -196), (100, -120), (96, -34)])
            + bez([(96, -34), (58, -24), (-58, -24), (-96, -34)]))
    c.grad_poly(body, GOLD_L, GOLD_D, "v")

    # volume
    c.poly([(-100, -204), (-72, -218), (-64, -30), (-96, -38)], with_alpha(shade(GOLD_D, -0.10), 80))
    c.poly([(100, -204), (72, -218), (64, -30), (96, -38)], with_alpha(shade(GOLD_D, -0.22), 95))
    c.poly(bez([(-70, -222), (-20, -233), (20, -233), (72, -222)])
           + list(reversed(bez([(-70, -214), (-20, -225), (20, -225), (72, -214)]))),
           with_alpha(GOLD_L, 190))
    # front-face sheen down the middle
    c.poly([(-16, -214), (14, -214), (22, -34), (-22, -34)], with_alpha(GOLD_L, 45))

    # ---- roof light (sits on the roof)
    c.glow(0, -246, 32, TURQ, 0.8 * glow)
    c.rrect(-22, -240, 22, -232, 5, shade(GOLD_D, -0.34))
    c.rrect(-13, -256, 13, -237, 7, TURQ)
    c.rrect(-9, -253, 3, -245, 4, TURQ_L)
    c.rrect(-17, -238, 17, -234, 3, TURQ_L)

    # ---- side windows
    for wx in (-84, 84):
        for wy in (-208, -178, -148):
            c.rrect(wx - 8, wy - 11, wx + 8, wy + 11, 5, with_alpha(hexc("D8F2F3"), 215))
            c.rrect(wx - 6, wy - 9, wx, wy - 1, 3, with_alpha(WHITE, 120))

    # ---- windshield (face)
    c.grad_rrect(-58, -218, 58, -128, 27, hexc("F4FCFA"), hexc("BCE2DB"), "v")
    c.rrect(-58, -218, 58, -128, 27, None, outline=CREAM, width=5.5)
    c.rrect(-58, -218, 58, -128, 27, None, outline=with_alpha(shade(GOLD_D, -0.4), 120), width=1.2)
    c.poly(bez([(-54, -150), (-40, -212), (-16, -213), (-44, -142)]), with_alpha(WHITE, 45))
    c.poly(bez([(28, -136), (10, -148), (16, -156), (34, -146)]), with_alpha(WHITE, 60))

    # eyes
    ex, ey = 24, -182
    open_k = {"curious": 1.0, "happy": 0.96, "determined": 0.86, "worry": 1.02}.get(mood, 1.0)
    for sx in (-1, 1):
        if mood == "happy":
            soft_eye(c, sx * ex, ey, 20, 22, happy=True)
        else:
            soft_eye(c, sx * ex, ey, 20, 22 * open_k, blink=blink, look=(look[0], look[1]))

    # brows painted on the glass, just above the eyes
    if mood == "determined":
        brow(c, -ex, -208, 26, 11, hexc("7C8C6E"), 4.2)
        brow(c, ex, -208, 26, -11, hexc("7C8C6E"), 4.2)
    elif mood == "worry":
        brow(c, -ex, -208, 26, -12, hexc("6E7F62"), 4.2)
        brow(c, ex, -208, 26, 12, hexc("6E7F62"), 4.2)
    elif mood == "curious":
        brow(c, -ex, -208, 24, -2, with_alpha(hexc("6E7F62"), 190), 4.2)
        brow(c, ex, -210, 24, -16, with_alpha(hexc("6E7F62"), 190), 4.2)

    # ---- mouth on the hood
    if mood == "determined":
        # brave, hopeful smile (not a frown)
        c.line(arc_points(0, -118, 24, 12, 18, 162, 22), INK, 4.4)
    elif mood == "worry":
        c.line(arc_points(0, -100, 20, 12, 205, 335, 18), INK, 4.2)
    else:
        c.line(arc_points(0, -116, 24, 13 + 10 * talk, 10, 170, 24), INK, 4.4)
        if talk > 0.05:
            c.poly(arc_points(0, -112, 18 * (0.55 + 0.45 * talk), 4 + 12 * talk, 12, 168, 22)
                   + list(reversed(arc_points(0, -112, 18 * (0.55 + 0.45 * talk), 4 + 12 * talk, 168, 12, 22))),
                   hexc("B94E48"))
            c.ellipse(0, -106 + 6 * talk, 11 * talk, 4 * talk, hexc("E8827A"))
        else:
            c.ellipse(0, -110, 10, 5, with_alpha(hexc("C9554E"), 220))
        if mood == "happy":
            for sx in (-1, 1):
                c.ellipse(sx * 30, -120, 5.5, 3.2, with_alpha(INK, 80))

    # ---- headlights
    for sx in (-1, 1):
        c.circle(sx * 72, -104, 13, hexc("EFE7CF"))
        c.circle(sx * 72, -104, 10.5, hexc("FFF2B4"))
        c.circle(sx * 69, -107, 3.4, with_alpha(WHITE, 225))
        c.circle(sx * 72, -104, 13, None, outline=with_alpha(hexc("A98A3E"), 90), width=1.2)

    # ---- rainbow badge
    bx, by, br = 0, -76, 22
    c.circle(bx, by, br + 4, CREAM)
    c.circle(bx, by, br + 4, None, outline=shade(GOLD_D, -0.42), width=2.0)
    for i in range(6):
        a0 = -90 + i * 60
        col = mix(GREY_BAND, RAINBOW[i], badge_fill)
        pts = [(bx, by)] + arc_points(bx, by, br, br, a0 + 2.0, a0 + 58.0, 14)
        c.poly(pts, col)
    c.circle(bx, by, br * 0.18, CREAM)
    c.circle(bx, by, br * 0.34, None, outline=with_alpha(shade(GOLD_D, -0.3), 70), width=1.0)
    c.circle(bx, by, br * 0.26, None, outline=with_alpha(shade(GOLD_D, -0.3), 120), width=1.0)
    if badge_fill > 0.02:
        c.glow(bx, by, 34, RAINBOW[2], 0.4 * badge_fill)

    # ---- smiling bumper
    bar = bez([(-86, -44), (-40, -58), (40, -58), (86, -44)])
    c.line(bar, hexc("C9D7D4"), 15.0)
    c.line([(p[0], p[1] - 3) for p in bar], hexc("F0F6F4"), 8.0)
    c.line([(p[0], p[1] + 3.5) for p in bar], with_alpha(hexc("9BACAA"), 170), 3.0)
    for sx in (-1, 1):
        c.circle(sx * 88, -44, 7.0, hexc("C2D0CE"))
        c.circle(sx * 88, -44, 4.2, hexc("E7EFED"))

    # ---- mirrors
    for sx in (-1, 1):
        c.line([(sx * 92, -196), (sx * 104, -203)], shade(GOLD_D, -0.18), 3.4)
        c.ellipse(sx * 107, -209, 7.5, 9.5, hexc("D5E2DF"))
        c.ellipse(sx * 107, -209, 4.6, 6.6, hexc("F2FAF8"))

    if sparkle > 0:
        for i, (sx, sy) in enumerate([(-62, -240), (46, -212), (-46, -138), (66, -160)]):
            k = max(0.0, math.sin(t * 5 + i * 2.1)) * sparkle
            if k > 0.05:
                star(c, sx, sy, 4 + 6 * k, with_alpha(hexc("FFF2A8"), int(235 * k)), inner=0.38)
    return c


# ================================================================== PIP
def pip(c: Canvas, t, blink=0.0, ear=0.0, wave=0.0):
    """Little white rabbit with mint backpack. ~150 units tall incl. ears."""
    bob = math.sin(t * 2.2) * 1.2
    c.shadow(0, -1, 40, 8, (63, 82, 50, 90), 6)

    # tail
    for i, (dx, dy, r) in enumerate([(-30, -44, 10), (-35, -49, 8), (-31, -55, 6.5)]):
        c.circle(dx + math.sin(t * 3 + i) * 1.2, dy + bob, r, shade(WHITE, 0.06))

    # feet
    for sx in (-1, 1):
        c.ellipse(sx * 15, -7, 15, 8, shade(WHITE, -0.07))
        c.ellipse(sx * 15, -9, 11, 5.5, WHITE)

    # body
    c.grad_ellipse(0, -42 + bob, 31, 37, WHITE, hexc("E4E5DE"), "v")
    c.ellipse(6, -34 + bob, 17, 22, with_alpha(hexc("FFFFFF"), 110))

    # backpack (behind the shoulder, on the left)
    c.rrect(-44, -74 + bob, -12, -22 + bob, 12, MINT)
    c.rrect(-41, -70 + bob, -15, -26 + bob, 9, shade(MINT, 0.14))
    c.rrect(-44, -46 + bob, -12, -38 + bob, 4, MINT_D)
    c.rrect(-32, -54 + bob, -24, -46 + bob, 3, shade(MINT_D, 0.1))
    c.line([(-11, -66 + bob), (4, -48 + bob)], shade(MINT_D, -0.02), 3.2)

    # head
    hy = -96 + bob
    c.grad_ellipse(0, hy, 34, 32, WHITE, hexc("E4E5DE"), "v")

    # ears
    for sx, ph in ((-1, 0.0), (1, 0.9)):
        tilt = (-10 - math.sin(t * 2.4 + ph * 2) * (4 + ear * 16)) * sx
        a = math.radians(tilt)
        bx0, by0 = sx * 13, hy - 22
        L = 58
        tipx = bx0 + math.sin(a) * L
        tipy = by0 - math.cos(a) * L
        outer = bez([(bx0 - 11, by0), (bx0 - 16, by0 - 30), (tipx - 10, tipy + 16), (tipx, tipy)]) + \
                bez([(tipx, tipy), (tipx + 11, tipy + 14), (bx0 + 12, by0 - 28), (bx0 + 11, by0)])
        c.poly(outer, WHITE)
        inner = bez([(bx0 - 4, by0 - 5), (bx0 - 8, by0 - 26), (tipx - 4, tipy + 15), (tipx, tipy + 7)]) + \
                bez([(tipx, tipy + 7), (tipx + 5, tipy + 15), (bx0 + 6, by0 - 24), (bx0 + 4, by0 - 6)])
        c.poly(inner, PINK)
        c.line([(bx0, by0), (tipx * 0.9 + bx0 * 0.1, tipy + 8)], with_alpha(PINK_D, 60), 1.2)

    # face
    for sx in (-1, 1):
        soft_eye(c, sx * 13, hy - 2, 9.5, 10.5, blink=blink, look=(0.45, 0.1))
        blush(c, sx * 22, hy + 11, 9, 0.85)
    c.poly([(-5.5, hy + 11), (5.5, hy + 11), (0, hy + 17)], PINK_D)
    c.line(arc_points(0, hy + 17, 7, 5, 25, 155, 14), INK, 1.9)
    for sx in (-1, 1):
        c.line([(sx * 12, hy + 14), (sx * 29, hy + 9)], with_alpha(INK, 60), 1.1)
        c.line([(sx * 12, hy + 17), (sx * 28, hy + 19)], with_alpha(INK, 60), 1.1)

    # paw wave
    if wave > 0:
        wx = 26 + math.sin(t * 9) * 4 * wave
        wy = -60 + bob - 8 * wave
        c.ellipse(wx, wy, 10, 9, WHITE)
        c.ellipse(wx, wy + 1, 6, 5, with_alpha(PINK, 120))
    return c


# ================================================================== MILO
def milo(c: Canvas, t, blink=0.0, wag=1.0, mood="happy"):
    """Caramel puppy with floppy ears + sky-blue bandana. ~130 units tall."""
    bob = math.sin(t * 2.5) * 1.3
    c.shadow(0, -1, 48, 9, (63, 82, 50, 90), 6)

    # tail
    sway = math.sin(t * 9) * 15 * wag
    base = (32, -40 + bob)
    c.line([base, (base[0] + 14 + sway * 0.2, base[1] - 14),
            (base[0] + 20 + sway * 0.4, base[1] - 26)], CARAMEL_D, 9.0)
    c.circle(base[0] + 21 + sway * 0.4, base[1] - 27, 7.5, CARAMEL_D)
    c.circle(base[0] + 21 + sway * 0.4, base[1] - 28.5, 5.0, CARAMEL_L)

    # feet
    for sx in (-1, 1):
        c.ellipse(sx * 18, -8, 17, 9, CARAMEL_D)
        c.ellipse(sx * 18, -6, 12, 6, CARAMEL_L)

    # body
    c.grad_ellipse(0, -40 + bob, 36, 36, CARAMEL_L, CARAMEL, "v")
    c.ellipse(2, -28 + bob, 20, 20, hexc("F5D8B2"))
    c.ellipse(-14, -52 + bob, 12, 9, with_alpha(hexc("FFE0BC"), 120))

    # head
    hy = -90 + bob
    # floppy ears behind head
    for sx in (-1, 1):
        sw = math.sin(t * 2.1 + (0.8 if sx > 0 else 0)) * 3
        ear = bez([(sx * 24, hy - 24), (sx * 50, hy - 30), (sx * 54, hy + 6 + sw), (sx * 44, hy + 20 + sw)]) + \
              bez([(sx * 44, hy + 20 + sw), (sx * 34, hy + 30 + sw), (sx * 22, hy + 4), (sx * 20, hy - 14)])
        c.poly(ear, CARAMEL_D)
        ear2 = bez([(sx * 29, hy - 18), (sx * 45, hy - 22), (sx * 47, hy + 6 + sw), (sx * 41, hy + 15 + sw)]) + \
               bez([(sx * 41, hy + 15 + sw), (sx * 35, hy + 21 + sw), (sx * 27, hy + 2), (sx * 26, hy - 12)])
        c.poly(ear2, shade(CARAMEL_D, -0.12))

    c.grad_ellipse(0, hy, 35, 33, CARAMEL_L, CARAMEL, "v")
    c.ellipse(0, hy + 12, 19, 14, hexc("F7DEBE"))

    for sx in (-1, 1):
        soft_eye(c, sx * 14, hy - 3, 10, 11.5, blink=blink, look=(0.4, 0.12))
    c.ellipse(0, hy + 6, 7.5, 5.8, hexc("33302F"))
    c.ellipse(-2.4, hy + 4.2, 2.4, 1.7, with_alpha(WHITE, 150))
    c.line(arc_points(0, hy + 13, 9, 6, 15, 165, 14), INK, 2.0)
    c.ellipse(0, hy + 19, 5, 3.6, hexc("E87A80"))
    blush(c, -24, hy + 9, 9, 0.9)
    blush(c, 24, hy + 9, 9, 0.9)

    # bandana
    c.poly([(-26, -60 + bob), (26, -60 + bob), (0, -28 + bob)], SKY)
    c.poly([(-20, -58 + bob), (20, -58 + bob), (0, -36 + bob)], shade(SKY, 0.14))
    c.circle(19, -58 + bob, 5.5, SKY_D)
    c.circle(17.5, -59.5 + bob, 2.2, with_alpha(WHITE, 160))
    return c


# ================================================================== POGO
def pogo(c: Canvas, t, blink=0.0):
    """Bright green frog with a tiny leaf cap. ~105 units tall."""
    bob = math.sin(t * 3.0) * 1.6
    c.shadow(0, -1, 36, 7, (63, 82, 50, 85), 5)

    for sx in (-1, 1):
        c.ellipse(sx * 22, -6, 15, 7, FROG_D)
        c.ellipse(sx * 22, -8, 10, 4.5, FROG_L)

    c.grad_ellipse(0, -26 + bob, 32, 26, FROG_L, FROG, "v")
    c.ellipse(0, -17 + bob, 17, 12, shade(FROG_L, 0.30))

    hy = -56 + bob
    c.grad_ellipse(0, hy, 29, 23, FROG_L, FROG, "v")

    # eye bumps
    for sx in (-1, 1):
        c.circle(sx * 14, hy - 18, 12.5, FROG_L)
        c.circle(sx * 14, hy - 18, 12.5, None, outline=with_alpha(FROG_D, 90), width=1.4)
        soft_eye(c, sx * 14, hy - 18, 9, 9.5, blink=blink, look=(0.35, 0.1))

    # smile
    c.line(arc_points(0, hy + 4, 17, 11, 8, 172, 22), INK, 2.7)
    c.ellipse(0, hy + 8, 5, 3, with_alpha(hexc("D9736E"), 160))
    blush(c, -21, hy + 8, 7, 0.8)
    blush(c, 21, hy + 8, 7, 0.8)

    # leaf cap, tipped back-left
    cap = bez([(-26, hy - 26), (-22, hy - 44), (10, hy - 46), (22, hy - 34)]) + \
          bez([(22, hy - 34), (10, hy - 28), (-14, hy - 26), (-26, hy - 26)])
    c.poly(cap, LEAF)
    c.poly(bez([(-22, hy - 28), (-17, hy - 41), (6, hy - 42), (14, hy - 34)]) +
           bez([(14, hy - 34), (4, hy - 30), (-13, hy - 29), (-22, hy - 28)]), shade(LEAF, 0.18))
    c.line([(-6, hy - 44), (2, hy - 28)], shade(LEAF, -0.25), 1.6)
    c.line([(-14, hy - 34), (-2, hy - 31)], with_alpha(shade(LEAF, -0.25), 140), 1.2)
    return c


# ================================================================== DUCKY
def ducky(c: Canvas, t, blink=0.0):
    """Fluffy yellow duckling with orange beak + aqua scarf. ~95 units tall."""
    bob = math.sin(t * 2.7) * 1.3
    c.shadow(0, -1, 30, 6, (63, 82, 50, 85), 5)
    for sx in (-1, 1):
        c.ellipse(sx * 13, -6, 11, 5.5, ORANGE)

    c.grad_ellipse(0, -24 + bob, 27, 22, DUCK_L, DUCK, "v")
    c.ellipse(-14, -24 + bob, 10, 8, shade(DUCK, -0.04))
    c.line(arc_points(-14, -25 + bob, 8, 6, 210, 330, 10), with_alpha(ORANGE, 120), 1.2)

    hy = -54 + bob
    for i in range(4):
        c.circle(-9 + i * 6, hy - 17 + math.sin(t * 4 + i) * 1.1, 5.5, DUCK_L)
    c.grad_ellipse(0, hy, 24, 22, DUCK_L, DUCK, "v")

    for sx in (-1, 1):
        soft_eye(c, sx * 10, hy - 2, 8, 9, blink=blink, look=(0.5, 0.05))
    c.ellipse(0, hy + 11, 11.5, 7, ORANGE)
    c.ellipse(0, hy + 9, 9, 4.5, hexc("FFB45F"))
    c.line(arc_points(0, hy + 11, 8, 4.5, 18, 162, 12), shade(ORANGE, -0.25), 1.5)
    blush(c, -17, hy + 7, 6, 0.85)
    blush(c, 17, hy + 7, 6, 0.85)

    c.rrect(-17, hy + 20, 17, hy + 27, 3.5, AQUA)
    c.poly([(3, hy + 25), (16, hy + 36), (8, hy + 38)], shade(AQUA, -0.04))
    return c


# ================================================================== BEA
def bea(c: Canvas, t, blink=0.0):
    """Small purple butterfly, lavender dotted wings. ~62 units tall."""
    flap = 0.88 + math.sin(t * 9.0) * 0.12
    c.glow(0, -34, 32, LAV, 0.25)
    for sx in (-1, 1):
        for k, off in ((1.0, 0), (0.74, 9)):
            rx, ry = 20 * k * (flap - (0 if k == 1 else 0.06)), 24 * k
            cx, cy = sx * (16 * k + 2), -36 - off
            c.ellipse(cx, cy, rx, ry, with_alpha(LAV, 240 if k == 1 else 205))
            c.ellipse(cx + sx * 3, cy - 3, rx * 0.62, ry * 0.55, with_alpha(shade(LAV, 0.18), 150))
            for dy in (-8, 2, 11):
                c.circle(cx - sx * rx * 0.30, cy + dy * k, 3.1 * k, with_alpha(WHITE, 235))
                c.circle(cx + sx * rx * 0.40, cy + dy * k - 4, 2.4 * k, with_alpha(WHITE, 200))

    c.grad_ellipse(0, -36, 7.5, 22, PURPLE, shade(PURPLE, -0.22), "v")
    c.circle(0, -56, 10, PURPLE)
    for sx in (-1, 1):
        soft_eye(c, sx * 4.2, -57, 3.8, 4.4, blink=blink, look=(0.2, 0))
    c.line([(-3, -64), (-9, -75), (-14, -82)], PURPLE, 1.8)
    c.line([(3, -64), (9, -75), (14, -82)], PURPLE, 1.8)
    c.circle(-15, -84, 3.2, PINK)
    c.circle(15, -84, 3.2, PINK)
    c.line(arc_points(0, -52, 4.5, 3, 25, 155, 10), INK, 1.2)
    return c


# ================================================================== sprites
# name: (sprite_w, sprite_h, anchor_x, anchor_y, height_in_units, draw_fn)
SPRITES = {
    "sunny": (300, 350, (150, 336), 262, sunny),
    "pip":   (160, 180, (80, 174), 150, pip),
    "milo":  (180, 170, (90, 164), 128, milo),
    "pogo":  (140, 130, (70, 124), 104, pogo),
    "ducky": (120, 120, (60, 114), 92, ducky),
    "bea":   (130, 130, (65, 124), 62, bea),
}

# world-space height (px in the 1920x1080 frame) for each character
WORLD_HEIGHT = {
    "sunny": 232, "pip": 108, "milo": 100, "pogo": 78, "ducky": 70, "bea": 48,
}


def world_scale(name):
    return WORLD_HEIGHT[name] / SPRITES[name][3]


def render_sprite(name, t, extra_scale=1.0, **kw):
    w, h, (ax, ay), _, fn = SPRITES[name]
    c = Canvas(w, h)
    c.set_origin(ax, ay)
    fn(c, t, **kw)
    c.flush_alpha()
    img = c.img
    sc = world_scale(name) * extra_scale
    if sc != 1.0:
        img = img.resize((max(1, int(img.width * sc)), max(1, int(img.height * sc))), Image.LANCZOS)
        ax, ay = ax * sc, ay * sc
    return img, (ax, ay)

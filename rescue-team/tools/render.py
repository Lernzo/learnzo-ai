#!/usr/bin/env python3
"""Renders the Leanzo Rescue Team 60s intro.

Picture: illustrated 3D-style key art with Ken-Burns camera moves, cross fades,
brand banner framing, kinetic typography and colour-coded name tags.
Sound  : audio/master.wav built by mix_audio.py.

usage:
    python3 render.py                    # full render -> LEARNZO_RESCUE_TEAM_INTRO.mp4
    python3 render.py --stills 1.5,12,40 # inspection frames -> tools/stills/*.png
"""
import os
import sys
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

import timeline as TL

FPS = TL.FPS
W, H = TL.W, TL.H
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
SCENES = os.path.join(ROOT, "scenes")
AUDIO = os.path.join(ROOT, "audio", "master.wav")
OUT = os.path.join(ROOT, "LEARNZO_RESCUE_TEAM_INTRO.mp4")
FONTS = os.path.join(HERE, "fonts")

# ---------------------------------------------------------------- brand palette
NAVY = (0, 40, 104)
BLUE = (20, 115, 230)
TEAL = (22, 184, 176)
GREEN = (63, 165, 53)
YELLOW = (245, 168, 0)
RED = (232, 50, 45)
PURPLE = (140, 70, 201)
RAINBOW = [RED, (247, 133, 32), YELLOW, GREEN, BLUE, PURPLE]
# brand gradient used for the series wordmark (deep navy -> brand blue -> teal)
BRAND_GRAD = [(11, 46, 120), (18, 96, 214), (16, 150, 200), (22, 190, 178)]


def hexrgb(hexstr):
    hexstr = hexstr.lstrip("#")
    return tuple(int(hexstr[i:i + 2], 16) for i in (0, 2, 4))

# ---------------------------------------------------------------- easing helpers
def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def smooth(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_out_back(x, s=1.9):
    x = clamp(x) - 1
    return 1 + (s + 1) * x ** 3 + s * x ** 2


def rg(x):
    return clamp(x)


def ramp(t, a, b):
    """0 before a, 1 after b, smooth in between"""
    if b <= a:
        return 1.0 if t >= b else 0.0
    return smooth((t - a) / (b - a))


def pulse(t, a, b, edge=0.25):
    return ramp(t, a, a + edge) * (1 - ramp(t, b - edge, b))


# ---------------------------------------------------------------- fonts
def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def tracked_width(text, fnt, tracking):
    return sum(fnt.getlength(c) + tracking for c in text) - tracking if text else 0


def draw_tracked(draw, xy, text, fnt, fill, tracking, anchor_left=True):
    x, y = xy
    for c in text:
        draw.text((x, y), c, font=fnt, fill=fill)
        x += fnt.getlength(c) + tracking
    return x


# ---------------------------------------------------------------- image builders
def _shadow_mask(mask, blur, offset, opacity=120):
    pad = blur * 3
    sh = Image.new("L", (mask.width + pad * 2, mask.height + pad * 2), 0)
    sh.paste(mask, (pad + offset[0], pad + offset[1]))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    sh = sh.point(lambda v: int(v * opacity / 255))
    layer = Image.new("RGBA", sh.size, (10, 18, 40, 0))
    layer.putalpha(sh)
    return layer, pad


def text_img(text, fnt, fill=(255, 255, 255, 255), gradient=None,
             stroke=0, stroke_fill=(255, 255, 255, 255),
             shadow=None, pad_extra=0):
    """Render one line of text to a tightly cropped RGBA image."""
    pad = int(fnt.size * 0.45) + stroke + pad_extra
    dummy = Image.new("L", (10, 10))
    d = ImageDraw.Draw(dummy)
    box = d.textbbox((0, 0), text, font=fnt, stroke_width=stroke)
    w = box[2] - box[0] + pad * 2
    h = box[3] - box[1] + pad * 2
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    # stroke / body mask
    mask = Image.new("L", (w, h), 0)
    md = ImageDraw.Draw(mask)
    md.text((pad - box[0], pad - box[1]), text, font=fnt, fill=255,
            stroke_width=stroke, stroke_fill=255)
    body = Image.new("L", (w, h), 0)
    bd = ImageDraw.Draw(body)
    bd.text((pad - box[0], pad - box[1]), text, font=fnt, fill=255)

    if shadow:
        blur, off, op = shadow
        sh, spad = _shadow_mask(mask, blur, off, op)
        layer.alpha_composite(sh, (-spad, -spad))

    # stroke colour
    if stroke:
        stroke_img = Image.new("RGBA", (w, h), stroke_fill)
        stroke_img.putalpha(mask)
        layer.alpha_composite(stroke_img)

    if gradient is not None:
        grad = make_gradient(w, h, gradient)
        body_img = grad
    else:
        body_img = Image.new("RGBA", (w, h), fill)
    body_img = body_img.copy()
    body_img.putalpha(body)
    layer.alpha_composite(body_img)
    bb = layer.getchannel("A").getbbox()
    if bb:
        m = 2
        layer = layer.crop((max(0, bb[0] - m), max(0, bb[1] - m),
                            min(layer.width, bb[2] + m), min(layer.height, bb[3] + m)))
    return layer


def stack(images, gap=0, align="center"):
    """vertically stack tightly cropped RGBA images"""
    w = max(im.width for im in images)
    h = sum(im.height for im in images) + gap * (len(images) - 1)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    y = 0
    for im in images:
        x = 0 if align == "left" else (w - im.width) // 2
        out.alpha_composite(im, (x, y))
        y += im.height + gap
    return out


def row(images, gap=0, pad=0):
    h = max(im.height for im in images)
    w = sum(im.width for im in images) + gap * (len(images) - 1)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    x = 0
    for im in images:
        out.alpha_composite(im, (x, (h - im.height) // 2))
        x += im.width + gap
    return out


def dot_strip(colours, r=11, gap=20, alpha=255):
    w = len(colours) * (2 * r) + (len(colours) - 1) * gap
    out = Image.new("RGBA", (w, 2 * r + 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(out)
    for i, c in enumerate(colours):
        x0 = i * (2 * r + gap)
        d.ellipse((x0, 0, x0 + 2 * r, 2 * r), fill=tuple(c) + (alpha,))
    return out


def make_gradient(w, h, stops):
    """vertical multi-stop gradient RGBA (alpha 255)"""
    ys = np.linspace(0, 1, h)
    pos = np.linspace(0, 1, len(stops))
    rgb = np.zeros((h, 3), dtype=np.float32)
    for c in range(3):
        rgb[:, c] = np.interp(ys, pos, [s[c] for s in stops])
    arr = np.zeros((h, w, 4), dtype=np.uint8)
    arr[:, :, :3] = rgb.astype(np.uint8)[:, None, :]
    arr[:, :, 3] = 255
    return Image.fromarray(arr, "RGBA")


def round_rect(w, h, radius, fill, border=None, bw=0, shadow=None):
    pad = 0
    if shadow:
        blur, off, op = shadow
        pad = blur * 3
    img = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if shadow:
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle(
            (pad, pad, pad + w, pad + h), radius=radius, fill=(6, 16, 38, op))
        img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)), (off[0], off[1]))
    d.rounded_rectangle((pad, pad, pad + w, pad + h), radius=radius, fill=fill,
                        outline=border, width=bw)
    return img, pad


def paste_center(dst, src, cx, cy, scale=1.0, alpha=1.0, angle=0.0):
    if alpha <= 0.003:
        return
    im = src
    if abs(angle) > 0.01:
        im = im.rotate(angle, resample=Image.BICUBIC, expand=True)
    if abs(scale - 1.0) > 0.002:
        nw = max(1, int(im.width * scale))
        nh = max(1, int(im.height * scale))
        im = im.resize((nw, nh), Image.LANCZOS)
    if alpha < 0.997:
        im = im.copy()
        im.putalpha(im.getchannel("A").point(lambda v: int(v * alpha)))
    dst.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))


def dots(dst, cx, cy, r=9, gap=34, colours=RAINBOW[:4], alpha=1.0):
    n = len(colours)
    x0 = cx - (n - 1) * gap / 2
    ov = Image.new("RGBA", dst.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for i, c in enumerate(colours):
        d.ellipse((x0 + i * gap - r, cy - r, x0 + i * gap + r, cy + r),
                  fill=c + (int(255 * alpha),))
    dst.alpha_composite(ov)


# ---------------------------------------------------------------- static layers
SCENE_LABELS = {
    "s1_world":    "SCENE 1 OF 6  ·  THE MAGICAL WORLD",
    "s2_captain":  "SCENE 2 OF 6  ·  MEET CAPTAIN RAINBOW",
    "s3a_ruby":    "SCENE 3 OF 6  ·  MEET THE RESCUE FRIENDS",
    "s3b_sunny":   "SCENE 3 OF 6  ·  MEET THE RESCUE FRIENDS",
    "s4_learning": "SCENE 4 OF 6  ·  WHAT WILL WE LEARN?",
    "s5_kitten":   "SCENE 5 OF 6  ·  THE ADVENTURE BEGINS",
    "s6_finale":   "SCENE 6 OF 6  ·  LEARNZO BRAND ENDING",
}


def build_top_banner():
    """persistent brand banner across the top of every scene"""
    top = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    hgt = 132
    band = np.zeros((hgt, W, 4), dtype=np.uint8)
    for y in range(hgt):
        a = 232 * (1 - (y / hgt) ** 1.4)
        band[y, :, :] = (255, 255, 255, int(a))
    top.alpha_composite(Image.fromarray(band, "RGBA"))

    logo = Image.open(os.path.join(HERE, "learnzo_logo.png")).convert("RGBA")
    lh = 84
    logo = logo.resize((int(logo.width * lh / logo.height), lh), Image.LANCZOS)
    top.alpha_composite(logo, (52, 18))

    d = ImageDraw.Draw(top)
    # rainbow hairline
    x0, x1, seg = 54, W - 54, 7
    total = x1 - x0
    for i in range(seg):
        c = RAINBOW[i % len(RAINBOW)]
        a = int(225 * (1 - (i / seg) ** 1.2))
        d.rectangle((x0 + total * i / seg, 112, x0 + total * (i + 1) / seg + 1, 116),
                    fill=tuple(c) + (max(a, 34),))

    # right-side lockup
    word = text_img("RESCUE TEAM", font("Baloo2-Bold.ttf", 34), gradient=BRAND_GRAD)
    sub = text_img("LEARNZO ORIGINAL SERIES", font("Fredoka-Medium.ttf", 19),
                   fill=(74, 96, 132, 255))
    block = stack([word, sub], gap=-2)
    top.alpha_composite(block, (W - 56 - block.width, 22))
    return top


def build_bottom_banner(sid):
    """lower third with the running scene label"""
    bot = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    y0, y1 = 950, H
    band = np.zeros((y1 - y0, W, 4), dtype=np.uint8)
    for y in range(y1 - y0):
        a = 226 * ((y / (y1 - y0)) ** 0.8)
        band[y, :, :] = (3, 26, 68, int(a))
    bot.alpha_composite(Image.fromarray(band, "RGBA"), (0, y0))

    left = text_img("LEARNZO RESCUE TEAM", font("Baloo2-Bold.ttf", 36),
                    fill=(255, 255, 255, 252))
    sub = text_img("Learn. Understand. Grow.", font("Fredoka-Medium.ttf", 21),
                   fill=(150, 208, 255, 238))
    bot.alpha_composite(left, (60, 962))
    bot.alpha_composite(sub, (62, 1006))

    label = text_img(SCENE_LABELS[sid], font("Fredoka-SemiBold.ttf", 20),
                     fill=(176, 205, 240, 232))
    bot.alpha_composite(label, (W - 60 - label.width, 975))

    chips = row([Image.new("RGBA", (26, 26), tuple(c) + (250,))
                 for c in (RED, BLUE, YELLOW, GREEN)], gap=16)
    mask = Image.new("L", (26 * 4 + 16 * 3, 26), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, mask.width - 1, 25),
                                           radius=13, fill=255)
    chips.putalpha(mask)
    bot.alpha_composite(chips, (W - 60 - chips.width, 1008))
    return bot


def build_title_card():
    """scene 1 series title lockup"""
    kicker = text_img("LEARNZO PRESENTS", font("Baloo2-Bold.ttf", 38),
                      fill=(84, 106, 142, 255))
    main = text_img("RESCUE TEAM", font("Baloo2-ExtraBold.ttf", 156),
                    gradient=BRAND_GRAD, stroke=15,
                    stroke_fill=(255, 255, 255, 255),
                    shadow=(15, (0, 12), 95))
    sub = text_img("The Official Series Introduction",
                   font("Fredoka-SemiBold.ttf", 44), fill=NAVY + (255,))
    body = stack([kicker, main, dot_strip(RAINBOW[:4], 10, 26), sub],
                 gap=0)
    # finer control: rebuild with explicit gaps
    blocks = [kicker, main, dot_strip(RAINBOW[:4], 10, 26), sub]
    gaps = [6, 26, 26]
    inner_w = max(b.width for b in blocks)
    inner_h = sum(b.height for b in blocks) + sum(gaps)
    pad_x, pad_y = 74, 46
    card, pad = round_rect(inner_w + pad_x * 2, inner_h + pad_y * 2, 52,
                           (255, 255, 255, 232), shadow=(28, (0, 24), 110))
    y = pad + pad_y
    for b, g in zip(blocks, gaps + [0]):
        card.alpha_composite(b, (pad + (inner_w + pad_x * 2 - b.width) // 2, y))
        y += b.height + g
    return card


def build_nametag(name, role, colour):
    name_img = text_img(name, font("Baloo2-ExtraBold.ttf", 60), fill=(15, 30, 62, 255))
    role_img = text_img(role, font("Fredoka-SemiBold.ttf", 29), fill=(80, 102, 138, 255))
    inner_w = max(name_img.width, role_img.width) + 26
    inner = stack([name_img, role_img], gap=2, align="left")
    bar_w = 14
    pad_x, pad_y = 46, 26
    card_w = inner_w + pad_x * 2
    card_h = inner.height + pad_y * 2
    card, pad = round_rect(card_w, card_h, card_h // 2 - 6,
                           (255, 255, 255, 244), shadow=(22, (0, 16), 105))
    d = ImageDraw.Draw(card)
    d.rounded_rectangle((pad, pad + 24, pad + bar_w, pad + card_h - 24),
                        radius=7, fill=tuple(colour) + (255,))
    card.alpha_composite(inner, (pad + bar_w + 30, pad + pad_y))
    # colour dot at the right edge
    dx = pad + card_w - 34
    d.ellipse((dx - 10, pad + card_h / 2 - 10, dx + 10, pad + card_h / 2 + 10),
              fill=tuple(colour) + (255,))
    return card


def build_word_chip(word, colour):
    t = text_img(word, font("Baloo2-ExtraBold.ttf", 50),
                 fill=(255, 255, 255, 255), shadow=(9, (0, 5), 85))
    w, h = t.width + 76, t.height + 34
    card, pad = round_rect(w, h, h // 2, tuple(colour) + (242,),
                           shadow=(16, (0, 11), 95))
    card.alpha_composite(t, (pad + 38, pad + 17))
    return card


def build_letsgo():
    main = text_img("LET'S GO!", font("Baloo2-ExtraBold.ttf", 230),
                    gradient=[YELLOW, (255, 150, 30), RED],
                    stroke=20, stroke_fill=(255, 255, 255, 255),
                    shadow=(24, (0, 20), 125))
    return main


def build_endcard():
    logo = Image.open(os.path.join(HERE, "learnzo_logo.png")).convert("RGBA")
    lw = 760
    logo = logo.resize((lw, int(logo.height * lw / logo.width)), Image.LANCZOS)
    card_w, card_h = logo.width + 104, logo.height + 76
    card, pad = round_rect(card_w, card_h, 44, (255, 255, 255, 240),
                           shadow=(28, (0, 22), 120))
    card.alpha_composite(logo, (pad + 52, pad + 38))
    ser = text_img("RESCUE TEAM", font("Baloo2-ExtraBold.ttf", 112),
                   gradient=BRAND_GRAD, stroke=13,
                   stroke_fill=(255, 255, 255, 255), shadow=(17, (0, 13), 115))
    tagline = text_img("An exciting world of learning and fun!",
                       font("Fredoka-SemiBold.ttf", 54), fill=(255, 255, 255, 255),
                       shadow=(13, (0, 8), 115))
    tw, th = tagline.width + 96, tagline.height + 40
    tag, tpad = round_rect(tw, th, th // 2, (5, 28, 72, 176),
                           shadow=(18, (0, 12), 110))
    tag.alpha_composite(tagline, (tpad + 48, tpad + 20))
    return card, ser, tag


# ---------------------------------------------------------------- scene plates
MASTER_W, MASTER_H = 2304, 1296


def load_plate(name):
    path = os.path.join(SCENES, name)
    if not os.path.exists(path):
        base, _ = os.path.splitext(path)
        path = base + ".jpg"
    im = Image.open(path).convert("RGB")
    im = im.resize((MASTER_W, MASTER_H), Image.LANCZOS)
    im = ImageEnhance.Color(im).enhance(1.06)
    im = ImageEnhance.Contrast(im).enhance(1.03)
    return im


CAMERA = {
    "s1_world":    dict(z0=1.00, z1=1.13, f0=(0.50, 0.42), f1=(0.50, 0.34)),
    "s2_captain":  dict(z0=1.15, z1=1.02, f0=(0.50, 0.52), f1=(0.50, 0.54)),
    "s3a_ruby":    dict(z0=1.01, z1=1.14, f0=(0.44, 0.55), f1=(0.54, 0.52)),
    "s3b_sunny":   dict(z0=1.14, z1=1.02, f0=(0.56, 0.52), f1=(0.48, 0.55)),
    "s4_learning": dict(z0=1.05, z1=1.16, f0=(0.50, 0.55), f1=(0.50, 0.48)),
    "s5_kitten":   dict(z0=1.00, z1=1.13, f0=(0.45, 0.50), f1=(0.62, 0.38)),
    "s6_finale":   dict(z0=1.12, z1=1.01, f0=(0.50, 0.55), f1=(0.50, 0.52)),
}


def camera_frame(plate, cam, p):
    """p in 0..1 over the scene"""
    z = cam["z0"] + (cam["z1"] - cam["z0"]) * smooth(p)
    fx = cam["f0"][0] + (cam["f1"][0] - cam["f0"][0]) * p
    fy = cam["f0"][1] + (cam["f1"][1] - cam["f0"][1]) * p
    cw = MASTER_W / z
    ch = MASTER_H / z
    cx = clamp(fx * MASTER_W, cw / 2, MASTER_W - cw / 2)
    cy = clamp(fy * MASTER_H, ch / 2, MASTER_H - ch / 2)
    box = (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)
    return plate.resize((W, H), Image.BICUBIC, box=box)


# ---------------------------------------------------------------- compositor
class Film:
    def __init__(self):
        self.top = build_top_banner()
        self.bots = {s["id"]: build_bottom_banner(s["id"]) for s in TL.SCENES}
        self.plates = {s["img"]: load_plate(s["img"]) for s in TL.SCENES}
        self.title = build_title_card()
        self.tags = {n["name"]: build_nametag(n["name"], n["role"], hexrgb(n["colour"]))
                     for n in TL.NAMETAGS}
        self.chips = {w["word"]: build_word_chip(w["word"], hexrgb(w["colour"])) for w in TL.WORDS}
        self.letsgo = build_letsgo()
        self.endcard, self.ser, self.tag = build_endcard()
        self.mrr = build_word_chip("MRRROW?", TEAL)

    # -------------------------------------------------- scene content overlays
    def scene_overlay(self, sc, t):
        lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        sid = sc["id"]
        s0, s1 = sc["start"], sc["end"]

        if sid == "s1_world":
            a = ease_out(ramp(t, 0.55, 1.20)) * (1 - ramp(t, s1 - 1.05, s1 - 0.45))
            pop = 0.84 + 0.16 * ease_out_back(ramp(t, 0.55, 1.50))
            bob = 7 * np.sin((t - 0.55) * 1.8)
            paste_center(lay, self.title, W / 2, 500 + bob, pop, a)
            self.sparkles(lay, t, 0.9, 0.9)

        if sid in ("s2_captain", "s3a_ruby", "s3b_sunny"):
            for n in TL.NAMETAGS:
                if not (s0 - 0.2 <= n["at"] <= s1):
                    continue
                ain = ease_out(ramp(t, n["at"], n["at"] + 0.45))
                aout = 1 - ramp(t, n["out"] - 0.35, n["out"])
                a = ain * aout
                if a <= 0.003:
                    continue
                x = 96 - (1 - ain) * 90 + (1 - aout) * 40
                tag = self.tags[n["name"]]
                paste_center(lay, tag, x + tag.width / 2 * (1 + 0.0),
                             860 - (1 - ain) * 26,
                             1.0, clamp(a))
            if sid == "s2_captain":
                self.sparkles(lay, t, 0.7, 1.4)

        if sid == "s4_learning":
            # one kinetic word chip at a time, sequentially swapped
            for i, wd in enumerate(TL.WORDS):
                nxt = TL.WORDS[i + 1]["at"] if i + 1 < len(TL.WORDS) else s1 - 0.3
                a = pulse(t, wd["at"], nxt + 0.16, 0.22)
                if a <= 0.004:
                    continue
                jin = ease_out_back(ramp(t, wd["at"], wd["at"] + 0.4))
                slide = (1 - rg(ramp(t, wd["at"], wd["at"] + 0.45))) * 70
                bob = 4 * np.sin(t * 1.9 + i)
                chip = self.chips[wd["word"]]
                paste_center(lay, chip, W / 2 + slide, H * 0.845 + bob,
                             0.82 + 0.18 * clamp(jin), clamp(a), -1.6)

        if sid == "s5_kitten":
            a = pulse(t, 44.60, 46.6, 0.28)
            if a > 0.003:
                paste_center(lay, self.mrr, W * 0.31, H * 0.30, 0.9, a, -3)
            a2 = ease_out_back(ramp(t, 49.98, 50.42)) * (1 - ramp(t, 51.25, 51.7))
            if a2 > 0.003:
                paste_center(lay, self.letsgo, W * 0.47, H * 0.66,
                             0.52 + 0.12 * clamp(a2), clamp(a2), -2.5)

        if sid == "s6_finale":
            card = self.endcard
            la = ease_out_back(ramp(t, 51.95, 52.75))
            if la > 0.003:
                paste_center(lay, card, W / 2, 250, 0.9 + 0.1 * clamp(la),
                             clamp(la))
            sa = ease_out_back(ramp(t, 53.25, 54.0)) * (1 - ramp(t, 59.55, 60.0))
            if sa > 0.003:
                paste_center(lay, self.ser, W / 2, 470, 0.92 + 0.08 * clamp(sa),
                             clamp(sa))
            ta = ease_out(ramp(t, 54.45, 55.3))
            if ta > 0.003:
                paste_center(lay, self.tag, W / 2, 588, 0.96 + 0.04 * ta, ta)
            self.sparkles(lay, t, 1.0, 1.0)
        return lay

    @staticmethod
    def sparkles(lay, t, opacity=1.0, rate=1.0):
        """slow drifting sparkle dust"""
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(ov)
        n = 26
        for i in range(n):
            ph = (t * (0.10 + 0.05 * (i % 5)) * rate + i * 0.137) % 1.0
            x = (i * 149.7 + 40 * np.sin(t * 0.5 + i)) % W
            y = H * (1 - ph * 1.05) + 30 * np.cos(t * 0.7 + i * 1.3)
            tw = 0.5 + 0.5 * np.sin(t * 3.1 + i * 0.9)
            r = 3 + 5 * (i % 4) / 3
            a = int(150 * tw * opacity)
            if a <= 4:
                continue
            d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 240, a))
            d.ellipse((x - r * 0.45, y - r * 0.45, x + r * 0.45, y + r * 0.45),
                      fill=(255, 255, 255, min(255, int(a * 1.6))))
        lay.alpha_composite(ov)

    def frame(self, t):
        idx = 0
        for i, sc in enumerate(TL.SCENES):
            if t >= sc["start"]:
                idx = i
        sc = TL.SCENES[idx]
        p = clamp((t - sc["start"]) / (sc["end"] - sc["start"]))
        base = camera_frame(self.plates[sc["img"]], CAMERA[sc["id"]], p).convert("RGBA")

        # cross fade with the outgoing scene
        if idx > 0 and t < sc["start"] + TL.XFADE:
            prev = TL.SCENES[idx - 1]
            pp = clamp((t - prev["start"]) / (prev["end"] - prev["start"]))
            old = camera_frame(self.plates[prev["img"]],
                               CAMERA[prev["id"]], pp).convert("RGBA")
            fa = smooth((t - sc["start"]) / TL.XFADE)
            base = Image.blend(old, base, fa)

        base.alpha_composite(self.scene_overlay(sc, t))

        # soft white flash on the cut into a new scene
        if idx > 0:
            ft = (t - sc["start"]) / 0.42
            if 0 <= ft < 1:
                fl = int(105 * (1 - ft) ** 2)
                ov = Image.new("RGBA", (W, H), (255, 255, 255, fl))
                base.alpha_composite(ov)
        # bigger flash on "LET'S GO!"
        if 49.95 <= t < 50.7:
            fl = int(150 * (1 - (t - 49.95) / 0.75) ** 2)
            base.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, fl)))

        base.alpha_composite(self.top)
        base.alpha_composite(self.bots[sc["id"]])

        # vignette + intro/outro fades
        base.alpha_composite(VIGNETTE)
        f = 1.0
        if t < 0.6:
            f = smooth(t / 0.6)
        if t > TL.TOTAL - 0.9:
            f = 1 - smooth((t - (TL.TOTAL - 0.9)) / 0.9)
        if f < 0.999:
            v = int(255 * (1 - f))
            base.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, v)))
        return base.convert("RGB")


def build_vignette():
    y, x = np.mgrid[0:H, 0:W]
    nx = (x - W / 2) / (W / 2)
    ny = (y - H / 2) / (H / 2)
    r = np.sqrt(nx ** 2 * 0.85 + ny ** 2)
    a = np.clip((r - 0.75) / 0.75, 0, 1) ** 1.5 * 105
    arr = np.zeros((H, W, 4), dtype=np.uint8)
    arr[:, :, 3] = a.astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


VIGNETTE = build_vignette()


# ---------------------------------------------------------------- entry point
def main():
    import imageio_ffmpeg
    ff = imageio_ffmpeg.get_ffmpeg_exe()

    if "--stills" in sys.argv:
        times = [float(x) for x in sys.argv[sys.argv.index("--stills") + 1].split(",")]
        os.makedirs(os.path.join(HERE, "stills"), exist_ok=True)
        film = Film()
        for t in times:
            film.frame(t).save(os.path.join(HERE, "stills", f"still_{t:05.2f}.png"))
            print("still", t)
        return

    film = Film()
    n = int(TL.TOTAL * FPS)
    cmd = [ff, "-y", "-loglevel", "error",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
           "-i", "-", "-i", AUDIO,
           "-c:v", "libx264", "-preset", "medium", "-crf", "20",
           "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.1",
           "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
           "-shortest", "-movflags", "+faststart", OUT]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(n):
        t = i / FPS
        proc.stdin.write(film.frame(t).tobytes())
        if i % 150 == 0:
            print(f"  frame {i}/{n}  t={t:5.2f}s", flush=True)
    proc.stdin.close()
    proc.wait()
    print("wrote", OUT, os.path.getsize(OUT) / 1e6, "MB")


if __name__ == "__main__":
    main()

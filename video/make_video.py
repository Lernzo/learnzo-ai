"""Render 'The Magical Rainbow Bus - Animal Friends Adventure'.

Procedural 3D-look animation built from the supplied Learnzo logo, generated
character art and generated sets. Every frame is composed with the camera moves,
sprite animation, colour cards, song captions and sparkle effects described in
the episode plan, then piped to ffmpeg.
"""
import json
import math
import os
import subprocess
import sys

import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

import plan

HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(HERE, "assets")
BUILD = plan.BUILD
W, H = plan.W, plan.H
FPS = plan.FPS

FONT_PATH = os.path.join(A, "fonts", "Fredoka[wdth,wght].ttf")

NAVY = (30, 52, 96)          # Learnzo deep navy
CREAM = (255, 250, 240)
INK = (24, 42, 78)


# --------------------------------------------------------------------- easing
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def lin(x):
    return clamp(x)


def smooth(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_in(x):
    x = clamp(x)
    return x ** 3


def ease_back(x, s=1.9):
    x = clamp(x)
    return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2


def ease_elastic(x):
    x = clamp(x)
    if x in (0.0, 1.0):
        return x
    return 2 ** (-9 * x) * math.sin((x * 10 - 0.75) * (2 * math.pi / 3)) + 1


# --------------------------------------------------------------------- assets
def load_rgba(path):
    im = Image.open(path).convert("RGBA")
    a = np.array(im)
    return a


def load_bgr(path):
    return cv2.imread(path, cv2.IMREAD_COLOR)


def cover_resize(img, w, h):
    ih, iw = img.shape[:2]
    s = max(w / iw, h / ih)
    out = cv2.resize(img, (int(round(iw * s)), int(round(ih * s))), interpolation=cv2.INTER_LANCZOS4)
    y0 = (out.shape[0] - h) // 2
    x0 = (out.shape[1] - w) // 2
    return out[y0:y0 + h, x0:x0 + w]


class Assets:
    def __init__(self):
        self.chars = {}
        for n in ("maggie", "bunny", "buddy", "leo", "ellie", "miko"):
            self.chars[n] = load_rgba(os.path.join(A, f"char_{n}.png"))
        self.icons = {}
        for n in ("red", "orange", "yellow", "green", "blue", "indigo", "violet"):
            self.icons[n] = load_rgba(os.path.join(A, f"icon_{n}.png"))
        self.logo = load_rgba(os.path.join(A, "learnzo-logo.png"))
        self.decal = load_rgba(os.path.join(A, "decal_side.png"))
        self.village = self.plate("scene_village_logo.png")
        self.road = self.plate("s2_road.png")
        self.title = self.plate("title_bg.png")
        self.sign = self.plate("sign_plate_logo.png", 1.6)
        self.quiz_bg = load_bgr(os.path.join(A, "quiz_bg.png"))
        self.heads = {k: self.head_crop(v) for k, v in self.chars.items()}
        self._card_bg = None
        self._quiz_bg = None

    @staticmethod
    def plate(name, scale=1.7):
        img = load_bgr(os.path.join(A, name))
        return cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_LANCZOS4) \
            if scale != 1 else img

    @staticmethod
    def head_crop(sprite):
        h = sprite.shape[0]
        return sprite[: int(h * 0.52)]


# ------------------------------------------------------------------ compositing
def paste(frame, rgba, cx, cy, height=None, width=None, rot=0.0, alpha=1.0,
          flip=False, squash=1.0, anchor="bottom"):
    """Composite an RGBA sprite onto a BGR frame at (cx, cy)."""
    if alpha <= 0.003 or height == 0:
        return
    h, w = rgba.shape[:2]
    if height is not None:
        s = height / h
    elif width is not None:
        s = width / w
    else:
        s = 1.0
    if squash != 1.0:
        s = (s, s)
    nw, nh = max(1, int(round(w * s[0] if isinstance(s, tuple) else w * s))), \
             max(1, int(round(h * s[1] if isinstance(s, tuple) else h * s)))
    if squash != 1.0:
        nw = max(1, int(round(w * (height / h if height else 1) / squash)))
        nh = max(1, int(round(h * (height / h if height else 1) * squash)))
    img = rgba
    if flip:
        img = img[:, ::-1]
    interp = cv2.INTER_AREA if (nw < img.shape[1] or nh < img.shape[0]) else cv2.INTER_LINEAR
    img = cv2.resize(img, (nw, nh), interpolation=interp)
    if abs(rot) > 0.6:
        M = cv2.getRotationMatrix2D((nw / 2, nh / 2), rot, 1.0)
        cos, sin = abs(M[0, 0]), abs(M[0, 1])
        bwd, bht = int(nh * sin + nw * cos), int(nh * cos + nw * sin)
        M[0, 2] += bwd / 2 - nw / 2
        M[1, 2] += bht / 2 - nh / 2
        img = cv2.warpAffine(img, M, (bwd, bht), flags=cv2.INTER_LINEAR,
                             borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
        nw, nh = bwd, bht
    x0 = int(round(cx - nw / 2))
    y0 = int(round(cy - nh if anchor == "bottom" else cy - nh / 2 if anchor == "center" else cy))
    x1, y1 = x0 + nw, y0 + nh
    fx0, fy0 = max(0, x0), max(0, y0)
    fx1, fy1 = min(W, x1), min(H, y1)
    if fx1 <= fx0 or fy1 <= fy0:
        return
    sub = img[fy0 - y0:fy1 - y0, fx0 - x0:fx1 - x0]
    a = (sub[:, :, 3:4].astype(np.float32) / 255.0) * alpha
    rgb = sub[:, :, :3][:, :, ::-1].astype(np.float32)
    dst = frame[fy0:fy1, fx0:fx1].astype(np.float32)
    frame[fy0:fy1, fx0:fx1] = np.clip(dst * (1 - a) + rgb * a, 0, 255).astype(np.uint8)


def add_glow(frame, cx, cy, radius, colour, strength=0.55, hardness=2.0):
    """Soft radial light. The falloff is evaluated at quarter resolution and
    upsampled, which is visually identical and much cheaper."""
    if radius <= 1 or strength <= 0.004:
        return
    x0, y0 = int(cx - radius), int(cy - radius)
    x1, y1 = int(cx + radius), int(cy + radius)
    x0c, y0c = max(0, x0), max(0, y0)
    x1c, y1c = min(W, x1), min(H, y1)
    if x1c <= x0c or y1c <= y0c:
        return
    h, w = y1c - y0c, x1c - x0c
    sh, sw = max(2, h // 4), max(2, w // 4)
    yy = (y0c + (np.arange(sh) + 0.5) * (h / sh))[:, None]
    xx = (x0c + (np.arange(sw) + 0.5) * (w / sw))[None, :]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / radius
    m = np.clip(1 - d, 0, 1) ** hardness * strength
    m = cv2.resize(m.astype(np.float32), (w, h), interpolation=cv2.INTER_LINEAR)[:, :, None]
    patch = frame[y0c:y1c, x0c:x1c].astype(np.float32)
    col = np.array(colour[::-1], np.float32)
    frame[y0c:y1c, x0c:x1c] = np.clip(patch * (1 - m) + col * m, 0, 255).astype(np.uint8)


def vignette(frame, strength=0.28):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    m = np.clip((d - 0.72) / 0.75, 0, 1)[:, :, None] * strength
    return (frame.astype(np.float32) * (1 - m)).astype(np.uint8)


def soft_blur(frame, k=41):
    return cv2.GaussianBlur(frame, (k, k), 0)


# ------------------------------------------------------------------------ text
class Text:
    _cache = {}
    _font_path = FONT_PATH

    @staticmethod
    def font(size, weight=600, width=100):
        key = ("font", size, weight, width)
        if key not in Text._cache:
            f = ImageFont.truetype(Text._font_path, size)
            try:
                f.set_variation_by_axes([weight, width])
            except Exception:
                pass
            Text._cache[key] = f
        return Text._cache[key]

    @staticmethod
    def word(text, size, fill, stroke_col, stroke, weight=600, shadow=True):
        key = ("w", text, size, fill, stroke_col, stroke, weight, shadow)
        if key in Text._cache:
            return Text._cache[key]
        f = Text.font(size, weight)
        pad = stroke + 6 + (8 if shadow else 0)
        bbox = f.getbbox(text, stroke_width=stroke)
        img = Image.new("RGBA", (bbox[2] - bbox[0] + pad * 2, bbox[3] - bbox[1] + pad * 2),
                        (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        ox, oy = pad - bbox[0], pad - bbox[1]
        if shadow:
            d.text((ox + 5, oy + 7), text, font=f, fill=(12, 26, 52, 120),
                   stroke_width=stroke, stroke_fill=(12, 26, 52, 120))
        d.text((ox, oy), text, font=f, fill=fill + (255,),
               stroke_width=stroke, stroke_fill=stroke_col + (255,))
        arr = np.array(img)
        Text._cache[key] = arr
        return arr

    @staticmethod
    def line_width(words, size):
        f = Text.font(size)
        return sum(f.getlength(w) for w in words) + size * 0.28 * max(0, len(words) - 1)


def band(frame, y0, y1, alpha=0.35, colour=(16, 34, 64)):
    """Soft gradient scrim so captions always read over busy art."""
    y0i, y1i = int(max(0, y0)), int(min(H, y1))
    if y1i <= y0i:
        return
    h = y1i - y0i
    prof = np.linspace(0, 1, h) ** 1.6
    m = (prof * alpha)[:, None, None]
    col = np.array(colour[::-1], np.float32)
    frame[y0i:y1i] = np.clip(frame[y0i:y1i].astype(np.float32) * (1 - m) + col * m, 0, 255).astype(np.uint8)


def draw_line(frame, words, cx, cy, size, fill, stroke_col=(255, 255, 255),
              stroke=10, weight=600, reveal=None, pop_scale=0.55, alpha=1.0,
              spacing=0.28, tilt=0.0, wave=0.0, time=0.0):
    """Draw a line of words centred at (cx, cy); `reveal` is per-word 0..1."""
    f = Text.font(size, weight)
    widths = [f.getlength(w) for w in words]
    gap = size * spacing
    total = sum(widths) + gap * max(0, len(words) - 1)
    x = cx - total / 2
    for i, w in enumerate(words):
        r = 1.0 if reveal is None else clamp(reveal[i] if i < len(reveal) else reveal[-1])
        if r > 0.01:
            sc = 1.0 + (1 - r) * (1 - pop_scale) * 1.2 if r < 1 else 1.0
            sc = max(sc, 0.2)
            bob = math.sin(time * 3.0 + i * 0.5) * wave
            img = Text.word(w, size, fill, stroke_col, stroke, weight)
            hgt = img.shape[0] * sc
            paste(frame, img, x + widths[i] / 2, cy + bob - (size * 0.35), height=hgt,
                  alpha=alpha * ease_out(min(1.0, r * 1.6)), anchor="center")
        x += widths[i] + gap


def reveal_progress(t, start, per_word=0.09, count=1):
    return [clamp((t - start - i * per_word) / 0.22) for i in range(count)]


# ------------------------------------------------------------------ decorations
def star_sprite(size=128):
    key = ("star", size)
    if key in Text._cache:
        return Text._cache[key]
    c = size / 2.0
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for rot in (0.0, math.pi / 4):
        pts = []
        n = 4
        for i in range(n * 2):
            ang = rot + i * math.pi / n
            r = c * 0.98 if i % 2 == 0 else c * 0.13
            pts.append((c + math.cos(ang) * r, c + math.sin(ang) * r))
        d.polygon(pts, fill=(255, 255, 255, 255))
    d.ellipse([c - c * 0.20, c - c * 0.20, c + c * 0.20, c + c * 0.20], fill=(255, 255, 255, 255))
    arr = np.array(img)
    arr = cv2.GaussianBlur(arr, (3, 3), 0.4)
    Text._cache[key] = arr
    return arr


def draw_star(frame, cx, cy, size, colour=(255, 255, 255), alpha=1.0, rot=0.0):
    sp = star_sprite()
    tinted = sp.copy()
    tinted[:, :, 0] = np.clip(sp[:, :, 0].astype(np.float32) * colour[2] / 255, 0, 255)
    tinted[:, :, 1] = np.clip(sp[:, :, 1].astype(np.float32) * colour[1] / 255, 0, 255)
    tinted[:, :, 2] = np.clip(sp[:, :, 2].astype(np.float32) * colour[0] / 255, 0, 255)
    paste(frame, tinted, cx, cy, height=size, alpha=alpha, rot=rot, anchor="center")


def draw_sparkles(frame, t, n=18, seed=1, area=(0, 0, W, H), size=(12, 34),
                  alpha=0.9, drift=18.0, colour=(255, 255, 255)):
    rng = np.random.default_rng(seed)
    x0, y0, x1, y1 = area
    for i in range(n):
        bx, by = rng.uniform(x0, x1), rng.uniform(y0, y1)
        ph = rng.uniform(0, 6.28)
        sp = rng.uniform(1.2, 2.6)
        sz = rng.uniform(*size)
        x = bx + math.sin(t * sp + ph) * drift
        y = by + math.cos(t * sp * 0.8 + ph) * drift * 0.6
        tw = 0.45 + 0.55 * (0.5 + 0.5 * math.sin(t * sp * 3 + ph))
        draw_star(frame, x, y, sz * tw, colour=colour, alpha=alpha * tw)


def fill_poly(frame, pts, colour, alpha):
    """Alpha-fill a polygon using only its bounding box (fast)."""
    if alpha <= 0.004:
        return
    pts = np.asarray(pts, np.int32)
    x0, y0 = np.maximum(pts.min(axis=0) - 2, 0)
    x1, y1 = np.minimum(pts.max(axis=0) + 3, (W, H))
    if x1 <= x0 or y1 <= y0:
        return
    roi = frame[int(y0):int(y1), int(x0):int(x1)]
    mask = np.zeros(roi.shape[:2], np.uint8)
    cv2.fillPoly(mask, [pts - np.array([x0, y0], np.int32)], 255, lineType=cv2.LINE_AA)
    m = (mask.astype(np.float32) / 255.0 * alpha)[:, :, None]
    col = np.array(colour[::-1], np.float32)
    frame[int(y0):int(y1), int(x0):int(x1)] = np.clip(
        roi.astype(np.float32) * (1 - m) + col * m, 0, 255).astype(np.uint8)


def fill_circle(frame, cx, cy, r, colour, alpha):
    if alpha <= 0.004 or r <= 0:
        return
    x0, y0 = int(max(0, cx - r - 2)), int(max(0, cy - r - 2))
    x1, y1 = int(min(W, cx + r + 3)), int(min(H, cy + r + 3))
    if x1 <= x0 or y1 <= y0:
        return
    roi = frame[y0:y1, x0:x1]
    mask = np.zeros(roi.shape[:2], np.uint8)
    cv2.circle(mask, (int(cx - x0), int(cy - y0)), int(round(r)), 255, -1, cv2.LINE_AA)
    m = (mask.astype(np.float32) / 255.0 * alpha)[:, :, None]
    col = np.array(colour[::-1], np.float32)
    frame[y0:y1, x0:x1] = np.clip(roi.astype(np.float32) * (1 - m) + col * m, 0, 255).astype(np.uint8)


def ellipse_mask(shape, cx, cy, ax, ay, ang):
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]].astype(np.float32)
    ca, sa = math.cos(ang), math.sin(ang)
    dx, dy = xx - cx, yy - cy
    u = dx * ca + dy * sa
    v = -dx * sa + dy * ca
    return ((u / max(ax, 1)) ** 2 + (v / max(ay, 1)) ** 2) <= 1.0


def butterfly_sprite(S=256, colour=(120, 200, 255)):
    """Cached cartoon butterfly, drawn once with PIL (alpha correct)."""
    key = ("bfly", S, colour)
    if key in Text._cache:
        return Text._cache[key]
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    dark = (52, 56, 86, 255)
    light = tuple(min(255, int(c * 1.15 + 40)) for c in colour) + (255,)
    body = (76, 62, 80, 255)
    cx, cy = S / 2.0, S * 0.56
    wings = [  # side, centre offset x, y, radius x, y
        (-1, 0.235, -0.135, 0.225, 0.190),
        (1, 0.235, -0.135, 0.225, 0.190),
        (-1, 0.180, 0.115, 0.160, 0.135),
        (1, 0.180, 0.115, 0.160, 0.135),
    ]
    ring = max(2, S // 40)
    for sgn, ox, oy, rx, ry in wings:
        mx, my = cx + sgn * ox * S, cy + oy * S
        box = [mx - rx * S, my - ry * S, mx + rx * S, my + ry * S]
        d.ellipse(box, fill=light, outline=dark, width=ring)
        k = 0.76
        inner = [mx - rx * S * k, my - ry * S * k, mx + rx * S * k, my + ry * S * k]
        d.ellipse(inner, fill=colour + (255,))
        d.ellipse([mx - rx * S * 0.52, my - ry * S * 0.62, mx - rx * S * 0.12, my - ry * S * 0.22],
                  fill=(255, 255, 255, 220))
    # body, head, antennae on top
    d.ellipse([cx - S * 0.045, cy - S * 0.20, cx + S * 0.045, cy + S * 0.26], fill=body)
    d.ellipse([cx - S * 0.072, cy - S * 0.33, cx + S * 0.072, cy - S * 0.17], fill=body)
    d.ellipse([cx - S * 0.030, cy - S * 0.30, cx - S * 0.005, cy - S * 0.24], fill=(255, 255, 255, 200))
    for sgn in (-1, 1):
        d.line([cx + sgn * S * 0.02, cy - S * 0.31, cx + sgn * S * 0.14, cy - S * 0.47],
               fill=dark, width=max(2, S // 64))
        d.ellipse([cx + sgn * S * 0.14 - S * 0.025, cy - S * 0.50,
                   cx + sgn * S * 0.14 + S * 0.025, cy - S * 0.45], fill=dark)
    arr = np.array(img)
    Text._cache[key] = arr
    return arr


def draw_butterfly(frame, cx, cy, size, t, colour=(120, 200, 255), alpha=1.0, phase=0.0):
    flap = 0.45 + 0.55 * abs(math.sin(t * 7.5 + phase))
    sp = butterfly_sprite(256, colour)
    h = int(size * 1.8)
    w = max(6, int(h * flap))
    img = cv2.resize(sp, (w, h), interpolation=cv2.INTER_AREA)
    tilt = math.sin(t * 2.0 + phase) * 10
    paste(frame, img, cx, cy, rot=tilt, alpha=alpha, anchor="center")


def draw_note(frame, cx, cy, size, t, colour=(255, 255, 255), alpha=1.0, phase=0.0):
    key = ("note", int(size // 12))
    if key not in Text._cache:
        S = 160
        img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        d.ellipse([14, 104, 66, 140], fill=(255, 255, 255, 255))
        d.rectangle([58, 18, 68, 122], fill=(255, 255, 255, 255))
        d.polygon([(66, 18), (128, 34), (128, 54), (66, 40)], fill=(255, 255, 255, 255))
        d.ellipse([96, 84, 148, 120], fill=(255, 255, 255, 255))
        d.rectangle([140, 12, 150, 104], fill=(255, 255, 255, 255))
        arr = np.array(img)
        arr = cv2.GaussianBlur(arr, (5, 5), 1.0)
        # white outline so the note reads on any background
        core = (arr[:, :, 3] > 40).astype(np.uint8) * 255
        arr[:, :, 3] = np.maximum(arr[:, :, 3], cv2.GaussianBlur(core, (13, 13), 3))
        Text._cache[key] = arr
    img = Text._cache[key].copy()
    tinted = img.copy()
    lum = img[:, :, :3]
    tinted[:, :, 0] = lum[:, :, 0].astype(np.float32) * colour[2] / 255
    tinted[:, :, 1] = lum[:, :, 1].astype(np.float32) * colour[1] / 255
    tinted[:, :, 2] = lum[:, :, 2].astype(np.float32) * colour[0] / 255
    rot = math.sin(t * 2.2 + phase) * 14
    paste(frame, tinted, cx, cy, height=size * 1.3 * (0.9 + 0.12 * math.sin(t * 3 + phase)),
          alpha=alpha, rot=rot, anchor="center")


def draw_confetti(frame, t, n=60, seed=7, area=(0, 0, W, H), speed=110.0):
    rng = np.random.default_rng(seed)
    cols = [(255, 90, 110), (255, 190, 60), (90, 210, 130), (90, 170, 255), (200, 120, 255)]
    for i in range(n):
        x0 = rng.uniform(area[0], area[2])
        off = rng.uniform(0, area[3])
        sp = rng.uniform(0.6, 1.4) * speed
        sway = rng.uniform(20, 60)
        ph = rng.uniform(0, 6.28)
        y = area[1] + ((off + t * sp) % (area[3] - area[1] + 80)) - 40
        x = x0 + math.sin(t * 1.6 + ph) * sway
        col = cols[i % len(cols)]
        w_ = rng.uniform(9, 17)
        a = math.sin(t * 3 + ph)
        rect = [[x - w_ / 2, y - w_ / 4], [x + w_ / 2, y - w_ / 4],
                [x + w_ / 2, y + w_ / 4], [x - w_ / 2, y + w_ / 4]]
        fill_poly(frame, rect, col, 0.9 * (0.65 + 0.35 * a))


def draw_speed_lines(frame, t, y0=0.62, y1=0.86, n=14, seed=3, alpha=0.35, direction=1):
    rng = np.random.default_rng(seed)
    for i in range(n):
        y = rng.uniform(y0, y1) * H
        ln = rng.uniform(80, 260)
        ph = rng.uniform(0, 1)
        x = ((ph + t * rng.uniform(0.9, 1.5)) % 1.25 - 0.15) * W
        if direction < 0:
            x = W - x
        cv2.line(frame, (int(x), int(y)), (int(x + direction * ln), int(y)),
                 (255, 255, 255), int(rng.uniform(2, 5)), cv2.LINE_AA)


def draw_dust(frame, cx, cy, t, alpha=0.5, size=1.0):
    for i in range(7):
        ph = (t * 1.1 + i * 0.137) % 1.0
        r = size * (18 + 60 * ph)
        a = alpha * (1 - ph) ** 1.6
        if a <= 0.01:
            continue
        fill_circle(frame, cx - ph * 90, cy - ph * 26, r, (245, 245, 250), a * 0.55)


def rainbow_band(frame, t, alpha=0.5, phase=0.0):
    cols = [(120, 60, 240), (90, 70, 250), (80, 150, 250), (90, 210, 120),
            (250, 220, 80), (250, 150, 60), (240, 70, 80)]
    for i, c in enumerate(cols):
        off = math.sin(t * 0.8 + i * 0.4 + phase) * 10
        cv2.line(frame, (0, int(H * 0.86 + i * 26 + off)), (W, int(H * 0.86 - 60 + i * 26 + off)),
                 c[::-1], 24, cv2.LINE_AA)
    frame[:] = cv2.addWeighted(frame, 1 - 0.0, frame, 0, 0)


def flash(frame, amount):
    if amount <= 0.001:
        return
    frame[:] = np.clip(frame.astype(np.float32) + (255 - frame.astype(np.float32)) * amount, 0, 255).astype(np.uint8)


def camera(plate, zoom=1.0, cx=0.5, cy=0.5, roll=0.0, shake=(0.0, 0.0)):
    ph, pw = plate.shape[:2]
    z = max(0.5, zoom)
    half_w, half_h = W / (2 * z), H / (2 * z)
    cxp = min(max(cx * pw, half_w), max(half_w, pw - half_w))
    cyp = min(max(cy * ph, half_h), max(half_h, ph - half_h))
    M = cv2.getRotationMatrix2D((cxp, cyp), roll, z)
    M[0, 2] += W / 2 - cxp + shake[0]
    M[1, 2] += H / 2 - cyp + shake[1]
    out = cv2.warpAffine(plate, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    return out


# ------------------------------------------------------------------- rig drawing
class Rig:
    """A character with a body that can bob, squash, hop and tilt."""

    def __init__(self, assets, name, height):
        self.name = name
        self.sprite = assets.chars[name]
        self.h = height

    def draw(self, frame, x, y, t, phase=0.0, bob=1.0, scale=1.0, tilt=0.0,
             hop=0.0, alpha=1.0, flip=False, head_only=False, head_h=None):
        h = self.h * scale
        yy = y - hop
        by = math.sin(t * 2.2 + phase) * 4.0 * bob
        sq = 1.0 + 0.03 * math.sin(t * 2.2 + phase + 1.2) + hop * 0.0016
        tw = math.sin(t * 1.7 + phase) * tilt
        paste(frame, self.sprite, x, yy + by, height=h, rot=tw, alpha=alpha, flip=flip, squash=sq)
        return yy + by


# ------------------------------------------------------------------- renderer
class Episode:
    def __init__(self):
        self.as_ = Assets()
        self.rigs = {
            "maggie": Rig(self.as_, "maggie", H * 0.50),
            "bunny": Rig(self.as_, "bunny", H * 0.34),
            "buddy": Rig(self.as_, "buddy", H * 0.31),
            "leo": Rig(self.as_, "leo", H * 0.35),
            "ellie": Rig(self.as_, "ellie", H * 0.34),
            "miko": Rig(self.as_, "miko", H * 0.30),
        }
        self.decal = self.as_.decal
        self.info = plan.write_json()
        self._card_bg = None
        self._quiz_bg = None

    # -------------------------------------------------------------- effects
    def maggie(self, frame, x, ground, scale=1.0, t=0.0, phase=0.0, rot=0.0,
               decal=True, children=0, alpha=1.0, bob=1.0):
        h = H * 0.50 * scale
        sq = 1.0 + 0.018 * math.sin(t * 6.0 + phase)
        y = ground + math.sin(t * 3.0 + phase) * 5 * bob
        paste(frame, self.as_.chars["maggie"], x, y, height=h, rot=rot + math.sin(t * 1.6) * 0.8,
              squash=sq, alpha=alpha)
        bus_w = h * (self.as_.chars["maggie"].shape[1] / self.as_.chars["maggie"].shape[0])
        if decal and bus_w > 260:
            dw = bus_w * 0.19
            paste(frame, self.decal, x + bus_w * 0.235, y - h * 0.47, width=dw,
                  rot=-9 + rot, alpha=0.95 * alpha, anchor="center")
        # little passengers peeking through the side windows
        self.bus_w = bus_w
        return y

    # ---------------------------------------------------------------- shots
    def shot_title(self, t, tl, dur):
        # keep the bus low in frame and float the type in the soft sky above it
        bg = camera(self.as_.title, zoom=1.20 + 0.05 * smooth(tl / dur), cx=0.50, cy=0.44)
        blur = cv2.GaussianBlur(bg, (0, 0), 14)
        w = np.clip((np.linspace(0, 1, H) - 0.24) / 0.42, 0, 1)[:, None, None]
        frame = (blur * (1 - w) + bg * w).astype(np.uint8)
        frame = np.clip(frame.astype(np.float32) * 0.94 + np.array([16, 26, 40], np.float32), 0, 255).astype(np.uint8)
        draw_sparkles(frame, t, n=22, seed=11, alpha=0.85)
        a = ease_out(clamp(tl / 0.9))
        lw = 460 * (0.92 + 0.08 * a)
        paste(frame, self.as_.logo, W / 2, H * 0.125, width=lw * 2.0, alpha=a, anchor="center")
        r1 = reveal_progress(tl, 0.7, 0.16, 4)
        draw_line(frame, ["The", "Magical", "Rainbow", "Bus"], W / 2, H * 0.335, 110,
                  (255, 255, 255), NAVY, 15, weight=700, reveal=r1, wave=3, time=t)
        r2 = reveal_progress(tl, 1.7, 0.10, 3)
        draw_line(frame, ["Animal", "Friends", "Adventure"], W / 2, H * 0.455, 66,
                  (255, 236, 140), NAVY, 11, weight=600, reveal=r2, time=t)
        b = clamp((tl - 1.4) / 1.2)
        if 0 < b < 1:
            for i in range(10):
                ang = i * math.pi / 5 + 0.4
                rr = 240 + 400 * ease_out(b)
                draw_star(frame, W / 2 + math.cos(ang) * rr * 1.5, H * 0.335 + math.sin(ang) * rr * 0.5,
                          34 * (1 - b) + 6, (255, 250, 205), (1 - b) * 0.9)
        flash(frame, max(0.0, 0.6 - tl * 1.6))
        return frame

    def shot_sign(self, t, tl, dur):
        z = 1.06 + 0.06 * smooth(tl / dur)
        frame = camera(self.as_.sign, zoom=z, cx=0.52 + 0.02 * math.sin(tl * 0.8), cy=0.30)
        draw_butterfly(frame, W * 0.80 + math.sin(tl * 1.3) * 30, H * 0.62 + math.cos(tl * 1.1) * 20,
                       54, t, colour=(255, 180, 90), alpha=0.9)
        draw_sparkles(frame, t, n=12, seed=21, alpha=0.55)
        # logo ping on the board
        ping = clamp((tl - 1.1) / 0.9)
        if 0 < ping < 1:
            add_glow(frame, W * 0.50, H * 0.22, 220 + 240 * ping, (255, 250, 210), 0.45 * (1 - ping))
            draw_star(frame, W * 0.50, H * 0.22, 70 * (1 - ping) + 12, (255, 250, 205), 1 - ping)
        a = ease_out(clamp((tl - 0.9) / 0.7))
        if a > 0.02:
            band(frame, H * 0.855, H * 0.99, 0.30)
            draw_line(frame, ["The", "Learnzo", "Bus", "Stop"], W / 2, H * 0.90, 62,
                      (255, 255, 255), NAVY, 10, weight=600, alpha=a, time=t)
        flash(frame, max(0.0, 0.5 - tl * 2.2))
        return frame

    def village_ground(self):
        return H * 0.90

    def shot_arrive(self, t, tl, dur):
        drive = clamp(tl / 6.4)
        ease = 1 - (1 - drive) ** 2.5
        pan = 0.30 + 0.10 * smooth(clamp(tl / 8.0))
        frame = camera(self.as_.village, zoom=1.16, cx=0.34 + 0.26 * (1 - ease), cy=0.60)
        draw_sparkles(frame, t, n=10, seed=31, alpha=0.5)
        # the animal friends wait at the stop
        ground = H * 0.735
        friends = [("bunny", 0.545, 1.0), ("buddy", 0.635, 1.0), ("leo", 0.715, 1.05),
                   ("ellie", 0.800, 1.0), ("miko", 0.885, 0.95)]
        for i, (n, fx, sc) in enumerate(friends):
            wiggle = math.sin(t * 3.2 + i) * 6 if drive < 0.98 else 0
            self.rigs[n].draw(frame, W * fx, ground, t, phase=i * 1.3, scale=sc,
                              hop=abs(math.sin(t * 3 + i)) * (10 + 22 * clamp((drive - 0.85) * 8)))
        # Maggie rolls in
        bx = W * (-0.35 + 0.78 * ease)
        by = H * 0.795
        draw_dust(frame, bx + 120, by, t, alpha=0.5 * (1 - clamp((drive - 0.7) * 3)))
        self.maggie(frame, bx, by, scale=1.06, t=t, phase=0.4, rot=-1.2 * (1 - ease))
        if drive > 0.96:
            bounce = clamp((drive - 0.96) * 25)
            add_glow(frame, bx, by - H * 0.16, 240, (255, 245, 200), 0.35 * (1 - bounce))
        a = ease_out(clamp((tl - 0.6) / 0.7))
        if a > 0.02:
            draw_line(frame, ["Toot", "toot!", "Here", "comes", "Maggie!"], W / 2, H * 0.90, 58,
                      (255, 255, 255), NAVY, 10, weight=600, alpha=a, time=t)
        return frame

    def greet_layout(self):
        ground = H * 0.945
        return {
            "maggie": (W * 0.185, ground - 10, 1.02),
            "bunny": (W * 0.405, ground, 0.92),
            "buddy": (W * 0.500, ground, 0.88),
            "leo": (W * 0.590, ground, 0.96),
            "ellie": (W * 0.685, ground, 0.92),
            "miko": (W * 0.790, ground, 0.86),
        }

    def shot_greet(self, t, tl, dur):
        frame = camera(self.as_.village, zoom=1.10 + 0.03 * smooth(tl / dur), cx=0.50, cy=0.60)
        draw_sparkles(frame, t, n=10, seed=41, alpha=0.45)
        lay = self.greet_layout()
        cues = {c["clip"]: c for c in self.info["cues"]}
        order = ["maggie_intro", "bunny_yay", "buddy_go", "leo_wait", "ellie_fun",
                 "miko_adventure", "maggie_board"]
        who = {"maggie_intro": "maggie", "bunny_yay": "bunny", "buddy_go": "buddy",
               "leo_wait": "leo", "ellie_fun": "ellie", "miko_adventure": "miko",
               "maggie_board": "maggie"}
        active = None
        for c in order:
            s = cues[c]["start"]
            d = max(1.0, cues[c]["dur"] or 1.4)
            if s - 0.15 <= t <= s + d + 0.25:
                active = who[c]
        # draw background characters first, active speaker last
        names = [n for n in lay if n != active] + ([active] if active else [])
        for n in names:
            x, y, sc = lay[n]
            is_act = (n == active)
            hop = 0.0
            tilt = 0.0
            if is_act:
                k = (t * 3.4) % 1.0
                hop = abs(math.sin(t * 6.5)) * 26
                tilt = math.sin(t * 5.0) * 3.5
                sc *= 1.06
            if n == "maggie":
                self.maggie(frame, x, y + math.sin(t * 2.0) * 3, scale=sc * 0.98, t=t,
                            rot=-1.0 + tilt * 0.4)
            else:
                self.rigs[n].draw(frame, x, y, t, phase=hash(n) % 6, scale=sc,
                                  hop=hop, tilt=tilt)
            if is_act:
                add_glow(frame, x, y - H * (0.22 if n != "maggie" else 0.20), 210, (255, 250, 220), 0.30)
                draw_star(frame, x + 60, y - H * (0.34 if n != "maggie" else 0.30),
                          46 * (0.8 + 0.25 * math.sin(t * 6)), (255, 245, 180), 0.95)
        # caption
        for c in order:
            s = cues[c]["start"]
            d = max(1.0, cues[c]["dur"] or 1.4)
            if s - 0.1 <= t <= s + d + 0.9:
                n = who[c]
                spx, spy, sps = lay[n]
                chip_y = spy - (H * (0.34 if n == "maggie" else 0.30)) * sps
                self.caption(frame, c, t - s, t, chip_at=(spx, chip_y))
        return frame

    def caption(self, frame, clip, lt, t, chip_at=None):
        c = next(x for x in self.info["cues"] if x["clip"] == clip)
        text = c["text"]
        who = c["who"]
        words = text.split()
        lines, cur = [], []
        f = Text.font(56)
        for w in words:
            if f.getlength(" ".join(cur + [w])) > W * 0.80 and cur:
                lines.append(cur)
                cur = [w]
            else:
                cur = cur + [w]
        if cur:
            lines.append(cur)
        n_words = sum(len(l) for l in lines)
        reveal = []
        idx = 0
        for l in lines:
            for w in l:
                reveal.append(clamp((lt - idx * 0.085) / 0.20))
                idx += 1
        y = H * 0.885 if len(lines) == 1 else H * 0.855
        band(frame, y - 84 - (len(lines) - 1) * 62, H, 0.34)
        idx = 0
        chip_col = {"Maggie": (255, 205, 80), "Bunny": (150, 220, 255), "Buddy": (255, 190, 150),
                    "Leo": (255, 215, 120), "Ellie": (205, 190, 255), "Miko": (255, 225, 120),
                    "All": (255, 240, 160)}.get(who, (255, 240, 160))
        # name chip
        a_chip = ease_out(clamp(lt / 0.25))
        if a_chip > 0.01:
            fchip = Text.font(42, 600)
            tw = fchip.getlength(who) + 58
            cx_chip, cy_chip = (chip_at if chip_at else (W / 2, y - 78 - (len(lines) - 1) * 52))
            x0c, y0c = int(cx_chip - tw / 2), int(cy_chip - 32)
            x1c, y1c = int(cx_chip + tw / 2), int(cy_chip + 32)
            x0c, y0c = max(0, x0c), max(0, y0c)
            x1c, y1c = min(W, x1c), min(H, y1c)
            if x1c > x0c and y1c > y0c:
                roi = frame[y0c:y1c, x0c:x1c]
                pil = (250, 248, 242)[::-1]
                frame[y0c:y1c, x0c:x1c] = np.clip(
                    roi.astype(np.float32) * (1 - 0.92 * a_chip)
                    + np.array(pil, np.float32) * (0.92 * a_chip), 0, 255).astype(np.uint8)
            cv2.rectangle(frame, (x0c, y0c), (x1c, y1c), NAVY[::-1], 3, cv2.LINE_AA)
            draw_line(frame, [who], cx_chip, cy_chip, 42, NAVY, (255, 255, 255), 0,
                      weight=600, alpha=a_chip, time=t)
        for li, l in enumerate(lines):
            rv = reveal[idx:idx + len(l)]
            idx += len(l)
            draw_line(frame, l, W / 2, y + li * 62, 56, (255, 255, 255), NAVY, 11,
                      weight=600, reveal=rv, time=t)

    def shot_board(self, t, tl, dur):
        # 40 -> 56 : everybody climbs aboard, then a bus-side party
        phase2 = tl > 7.0
        frame = camera(self.as_.village, zoom=1.26 if phase2 else 1.10, cx=0.30 if phase2 else 0.50, cy=0.60)
        draw_sparkles(frame, t, n=14, seed=51, alpha=0.6)
        lay = self.greet_layout()
        if not phase2:
            ground = H * 0.905
            # each friend hops toward the bus door and disappears inside
            for i, n in enumerate(["bunny", "buddy", "leo", "ellie", "miko"]):
                start = 0.7 + i * 1.6
                k = clamp((tl - start) / 1.5)
                x0, y0, sc = lay[n]
                doorx = lay["maggie"][0] + W * 0.10
                door_y = ground - H * 0.12
                x = x0 + (doorx - x0) * ease_in(k)
                y = y0 + (door_y - y0) * ease_in(k) - math.sin(k * math.pi) * H * 0.10
                s = sc * (1 - 0.75 * ease_in(k))
                a = 1.0 - clamp((k - 0.75) / 0.25)
                if a > 0.02:
                    self.rigs[n].draw(frame, x, y, t, phase=i, scale=s, hop=0, alpha=a)
                if 0.0 < k < 1.0:
                    draw_star(frame, x, y - H * 0.1, 34, (255, 245, 180), 0.7 * (1 - k))
            # Maggie waits with the door open
            self.maggie(frame, lay["maggie"][0], lay["maggie"][1], scale=1.12, t=t, rot=-0.8, children=0)
            door_glow = 0.4 + 0.2 * math.sin(t * 4)
            add_glow(frame, lay["maggie"][0] + W * 0.10, H * 0.72, 150, (255, 240, 180), 0.25 * door_glow)
        else:
            # everybody dances in front of / around the bus
            bx = W * 0.60
            by = H * 0.90
            self.maggie(frame, bx, by, scale=1.36, t=t)
            gang = [("bunny", 0.150), ("buddy", 0.265), ("leo", 0.375)]
            for i, (n, fx) in enumerate(gang):
                hop = abs(math.sin(t * 5.0 + i * 0.9)) * 26
                self.rigs[n].draw(frame, W * fx, H * 0.945, t, phase=i, hop=hop,
                                  tilt=math.sin(t * 4 + i) * 4, scale=0.95)
            if int(t * 2.2) % 2 == 0:
                draw_star(frame, W * 0.30, H * 0.34, 34, (255, 250, 205), 0.9)
            for i in range(6):
                draw_note(frame, W * (0.12 + 0.14 * i) + math.sin(t * 1.6 + i) * 30,
                          H * (0.34 + 0.08 * math.sin(t * 1.2 + i * 1.7)), 34,
                          t, (255, 240, 170), 0.95, phase=i)
            draw_confetti(frame, t, n=26, seed=55, speed=90)
        # lyrics
        s = 41.0
        if t >= s - 0.2:
            self.lyric(frame, t - s, t)
        a = ease_out(clamp((tl - 0.2) / 0.6))
        if tl < 6.5 and a > 0.02:
            pass
        return frame

    def lyric(self, frame, lt, t, text=None, size=62, y=None):
        text = text or "Come along, come along, let's sing a happy song! Rainbow bus is on its way, learning something new today!"
        lines = [["Come", "along,", "come", "along,", "let's", "sing", "a", "happy", "song!"],
                 ["Rainbow", "bus", "is", "on", "its", "way,", "learning", "something", "new", "today!"]]
        n = sum(len(l) for l in lines)
        rv, idx = [], 0
        for l in lines:
            for w in l:
                rv.append(clamp((lt - idx * 0.12) / 0.24))
                idx += 1
        idx = 0
        base = y if y is not None else H * 0.865
        for li, l in enumerate(lines):
            r = rv[idx:idx + len(l)]
            idx += len(l)
            draw_line(frame, l, W / 2, base + li * 74, size, (255, 255, 255), NAVY, 12,
                      weight=700, reveal=r, time=t)

    def shot_depart(self, t, tl, dur):
        speed = smooth(clamp(tl / 3.2))
        frame = camera(self.as_.village, zoom=1.30 + 0.14 * speed,
                       cx=0.62 - 0.30 * speed, cy=0.58)
        bx = W * (0.34 + 0.95 * ease_in(clamp((tl - 0.4) / 6.0)))
        by = H * 0.925 + math.sin(t * 7) * 3
        self.maggie(frame, bx, by, scale=1.25, t=t, children=4, rot=1.5)
        draw_dust(frame, bx - 140, by, t * 1.4, alpha=0.6)
        # rainbow sparkle trail behind the bus
        for i in range(16):
            ph = (t * 1.1 + i * 0.11) % 1.0
            x = bx - 120 - ph * 520
            y = by - H * 0.14 + math.sin(i * 1.7 + t * 2) * 60
            col = [(255, 120, 120), (255, 190, 90), (255, 240, 120), (140, 230, 140),
                   (130, 200, 255), (170, 150, 255)][i % 6]
            draw_star(frame, x, y, 30 * (1 - ph) + 8, col, 0.8 * (1 - ph))
        draw_sparkles(frame, t, n=16, seed=61, alpha=0.7)
        a = ease_out(clamp((tl - 0.4) / 0.7))
        draw_line(frame, ["Here", "we", "go!"], W / 2, H * 0.30, 96, (255, 255, 255), NAVY, 14,
                  weight=700, alpha=a * (1 - clamp((tl - 5.0) / 1.0)), wave=3, time=t)
        flash(frame, max(0.0, 0.55 * (1 - tl / 1.4)) if tl < 1.4 else 0.0)
        return frame

    def shot_rainbow(self, t, tl, dur):
        zoom = 1.20 - 0.10 * smooth(tl / dur)
        frame = camera(self.as_.road, zoom=zoom, cx=0.50, cy=0.50 + 0.04 * smooth(tl / dur))
        # the rainbow paints itself across the sky
        grow = ease_out(clamp(tl / 2.6))
        if grow > 0.01:
            cols = [(120, 60, 240), (90, 70, 250), (80, 150, 250), (90, 210, 120),
                    (250, 220, 80), (250, 150, 60), (240, 70, 80)]
            fade = 1.0 - clamp((tl - 2.4) / 1.6)
            for i, c in enumerate(cols):
                pts = []
                for k in range(0, 61):
                    f = k / 60.0
                    ang = math.pi * (0.02 + 0.96 * f * grow)
                    x = W * 0.5 + math.cos(ang) * W * 0.62
                    y = H * 0.98 - math.sin(ang) * H * 1.05 - i * 13
                    pts.append([x, y])
                for j in range(len(pts) - 1):
                    cv2.line(frame, (int(pts[j][0]), int(pts[j][1])),
                             (int(pts[j + 1][0]), int(pts[j + 1][1])), c[::-1],
                             max(2, int(13 * fade)), cv2.LINE_AA)
            if fade > 0.02:
                for i in range(14):
                    f = i / 13.0
                    ang = math.pi * (0.02 + 0.96 * f * grow)
                    draw_star(frame, W * 0.5 + math.cos(ang) * W * 0.62,
                              H * 0.98 - math.sin(ang) * H * 1.05,
                              34 * fade, (255, 252, 220), fade)
        # magical light sweep
        sweep = clamp((tl - 0.5) / 3.0)
        add_glow(frame, W * (0.15 + 0.7 * sweep), H * 0.55, 420, (255, 245, 210), 0.30)
        draw_sparkles(frame, t, n=26, seed=71, alpha=0.95, size=(14, 40))
        draw_butterfly(frame, W * 0.16 + math.sin(tl) * 40, H * 0.30, 64, t, (255, 190, 240), 0.95)
        draw_butterfly(frame, W * 0.86 + math.sin(tl * 1.2 + 1) * 46, H * 0.24, 54, t, (170, 230, 255), 0.95)
        # Maggie rides the rainbow road
        bx = W * (0.16 + 0.10 * smooth(tl / dur))
        by = H * 0.80 + math.sin(t * 5.0) * 5
        self.maggie(frame, bx, by, scale=0.80, t=t, children=4, rot=-2.0)
        for i in range(6):
            draw_star(frame, bx - 180 - i * 60, by - H * 0.10 + math.sin(t * 2 + i) * 40,
                      34 - i * 3, (255, 250, 200), 0.8 - i * 0.1)
        # dialogue caption
        cues = {c["clip"]: c for c in self.info["cues"]}
        c = cues.get("maggie_rainbow")
        if c and c["dur"] and t >= c["start"] - 0.1 and t <= c["start"] + c["dur"] + 2.2:
            self.caption(frame, "maggie_rainbow", t - c["start"], t)
        # "seven colours" marquee at the end
        a = ease_out(clamp((tl - 14.0) / 1.0))
        if a > 0.02:
            draw_line(frame, ["Seven", "colours", "of", "the", "rainbow!"], W / 2, H * 0.86, 66,
                      (255, 255, 255), NAVY, 12, weight=700, alpha=a, time=t)
            for i, k in enumerate(["red", "orange", "yellow", "green", "blue", "indigo", "violet"]):
                x = W * (0.27 + 0.076 * i)
                pop = ease_back(clamp((tl - 14.2 - i * 0.12) / 0.5))
                if pop > 0.02:
                    paste(frame, self.as_.icons[k], x, H * 0.745, height=110 * pop, alpha=min(1, pop), anchor="center")
        flash(frame, max(0.0, 0.5 * (1 - tl / 1.2)) if tl < 1.2 else 0.0)
        return frame

    # ---------------------------------------------------------- colour cards
    def colour_card(self, frame, t, tl, idx, dur=4.2):
        key, word, obj, fx, fy, rgb = plan.COLOURS[idx]
        # blurred rainbow plate, dimmed (built once, then re-framed cheaply)
        if self._card_bg is None:
            bg = camera(self.as_.road, zoom=1.35, cx=0.5, cy=0.5)
            bg = soft_blur(bg, 45)
            self._card_bg = np.clip(bg.astype(np.float32) * 0.72 + np.array([24, 12, 30], np.float32),
                                    0, 255).astype(np.uint8)
        bg = self._card_bg
        if abs(tl) > 0.001:
            M = np.float32([[1, 0, 14 * math.sin(tl * 0.5)], [0, 1, 6 * math.sin(tl * 0.4)]])
            bg = cv2.warpAffine(bg, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        frame[:] = bg
        # colour wash
        add_glow(frame, W * 0.5, H * 0.52, 900, rgb, 0.25)
        draw_sparkles(frame, t, n=20, seed=100 + idx, alpha=0.7, size=(10, 30))

        # big icon in a soft spotlight
        pop = ease_back(clamp(tl / 0.75))
        bob = math.sin(tl * 2.4) * 12
        icon_h = 470 * pop
        add_glow(frame, W * 0.665, H * 0.50 + bob, 330, rgb, 0.45 * min(1, pop))
        paste(frame, self.as_.icons[key], W * 0.665, H * 0.50 + bob, height=icon_h,
              alpha=min(1.0, pop * 1.4), anchor="center", rot=math.sin(tl * 1.6) * 4)

        # colour word
        rv = reveal_progress(tl, 0.25, 0.06, 1)
        draw_line(frame, [word], W * 0.335, H * 0.42, 190, rgb, (255, 255, 255), 22,
                  weight=700, reveal=rv, time=t)
        # object line
        rv2 = reveal_progress(tl, 0.9, 0.07, 4)
        draw_line(frame, obj.split(), W * 0.335, H * 0.585, 66, (255, 255, 255), NAVY, 12,
                  weight=600, reveal=rv2, time=t)

        # little colour dots progress
        for i in range(7):
            k, _, _, _, _, c = plan.COLOURS[i]
            x = W * (0.30 + 0.045 * i)
            on = i == idx
            r = 20 if on else 13
            fill_circle(frame, x, H * 0.72, r, c, 0.95 if on else 0.55)
            cv2.circle(frame, (int(x), int(H * 0.72)), int(r), (255, 255, 255), 3, cv2.LINE_AA)
        # burst at the moment the card lands
        b = clamp((tl - 0.42) / 0.8)
        if 0 < b < 1:
            for i in range(12):
                ang = i * math.pi / 6
                rr = 200 + 320 * ease_out(b)
                draw_star(frame, W * 0.665 + math.cos(ang) * rr, H * 0.50 + math.sin(ang) * rr * 0.7,
                          40 * (1 - b) + 6, (255, 255, 255), 1 - b)
        flash(frame, max(0.0, 0.35 - tl * 2.5))
        return frame

    def shot_colours(self, t, tl, dur):
        idx = int(tl // plan.COLOUR_STEP)
        idx = max(0, min(6, idx))
        lt = tl - idx * plan.COLOUR_STEP
        frame = np.zeros((H, W, 3), np.uint8)
        self.colour_card(frame, t, lt, idx)
        # quick crossfade between cards
        if lt > plan.COLOUR_STEP - 0.22 and idx < 6:
            nxt = np.zeros((H, W, 3), np.uint8)
            self.colour_card(nxt, t, 0.02, idx + 1)
            w = smooth((lt - (plan.COLOUR_STEP - 0.22)) / 0.22)
            frame = cv2.addWeighted(frame, 1 - w, nxt, w, 0)
        return frame

    # ------------------------------------------------------------ song shots
    def road_drive(self, frame, t, bx, by, scale=0.86, children=4):
        self.maggie(frame, bx, by, scale=scale, t=t, children=children, rot=-1.6)
        for i in range(8):
            draw_star(frame, bx - 200 - i * 70, by - H * 0.08 + math.sin(t * 2 + i) * 44,
                      30 - i * 2, (255, 250, 210), 0.8 - i * 0.08)

    def highlight_icon(self, frame, t, key, ap):
        x, y = self.icon_pos(key)
        add_glow(frame, x, y, 130, (255, 252, 220), 0.45 * ap)
        for j in range(6):
            ang = j * math.pi / 3 + t * 1.4
            draw_star(frame, x + math.cos(ang) * 95, y + math.sin(ang) * 78,
                      26 + 6 * math.sin(t * 4 + j), (255, 250, 210), 0.9 * ap)

    def icon_pos(self, key):
        for k, word, obj, fx, fy, rgb in plan.COLOURS:
            if k == key:
                return W * fx * 0.95 + W * 0.03, H * fy
        return W * 0.5, H * 0.5

    def shot_song_a(self, t, tl, dur):
        frame = camera(self.as_.road, zoom=1.18 + 0.03 * math.sin(tl * 0.5), cx=0.5, cy=0.55)
        draw_sparkles(frame, t, n=22, seed=81, alpha=0.85)
        self.road_drive(frame, t, W * (0.30 + 0.05 * smooth(tl / dur)), H * 0.82)
        for i in range(5):
            draw_note(frame, W * (0.14 + 0.17 * i) + math.sin(t * 1.4 + i) * 26,
                      H * (0.24 + 0.06 * math.sin(t * 1.1 + i)), 30, t, (255, 240, 170), 0.9, phase=i)
        # the plate icons flash as the lyric names them
        for i, k in enumerate(["red", "orange", "yellow", "green"]):
            ap = clamp((tl - 0.2 - i * 1.55) / 0.4) * (1 - clamp((tl - 0.9 - i * 1.55) / 0.6) * 0.45)
            if ap > 0.02:
                self.highlight_icon(frame, t, k, ap)
        lines = [["Red,", "red,", "apples", "red!"], ["Orange,", "orange,", "look", "ahead!"]]
        self.draw_song_lines(frame, lines, tl, t, size=68)
        return frame

    def shot_song_b(self, t, tl, dur):
        frame = camera(self.as_.road, zoom=1.16 + 0.04 * math.sin(tl * 0.45), cx=0.5, cy=0.52)
        draw_sparkles(frame, t, n=20, seed=91, alpha=0.85)
        self.road_drive(frame, t, W * (0.62 - 0.04 * smooth(tl / dur)), H * 0.82, scale=0.82)
        for i in range(4):
            draw_note(frame, W * (0.18 + 0.18 * i) + math.cos(t * 1.3 + i) * 30,
                      H * (0.26 + 0.05 * math.sin(t + i)), 30, t, (255, 240, 190), 0.9, phase=i * 2)
        for i, k in enumerate(["yellow", "green", "blue", "indigo"]):
            ap = clamp((tl - 0.2 - i * 1.45) / 0.4) * (1 - clamp((tl - 0.9 - i * 1.45) / 0.6) * 0.45)
            if ap > 0.02:
                self.highlight_icon(frame, t, k, ap)
        lines = [["Yellow", "sunshine", "in", "the", "sky,"], ["green", "trees", "waving", "way", "up", "high!"]]
        self.draw_song_lines(frame, lines, tl, t, size=66)
        return frame

    def draw_song_lines(self, frame, lines, tl, t, size=66):
        band(frame, H * 0.775, H, 0.38)
        rv, idx = [], 0
        for l in lines:
            for w in l:
                rv.append(clamp((tl - idx * 0.11) / 0.22))
                idx += 1
        idx = 0
        for li, l in enumerate(lines):
            r = rv[idx:idx + len(l)]
            idx += len(l)
            draw_line(frame, l, W / 2, H * (0.845 + 0.075 * li), size, (255, 255, 255), NAVY, 13,
                      weight=700, reveal=r, time=t)

    def shot_friends(self, t, tl, dur):
        frame = camera(self.as_.road, zoom=1.28, cx=0.5 + 0.04 * math.sin(tl * 0.5), cy=0.58)
        draw_sparkles(frame, t, n=18, seed=101, alpha=0.8)
        draw_confetti(frame, t, n=40, seed=103, speed=120)
        # the whole gang dancing on the rainbow road
        gang = [("bunny", 0.20), ("buddy", 0.315), ("leo", 0.43), ("ellie", 0.55), ("miko", 0.665)]
        for i, (n, fx) in enumerate(gang):
            hop = abs(math.sin(t * 5.2 + i * 0.6)) * 30
            self.rigs[n].draw(frame, W * fx, H * 0.80, t, phase=i * 1.1, hop=hop,
                              tilt=math.sin(t * 4 + i) * 4)
        self.maggie(frame, W * 0.85, H * 0.80, scale=0.72, t=t, children=0)
        draw_line(frame, ["Seven", "colours,", "you", "and", "me!"], W / 2, H * 0.175, 84,
                  (255, 255, 255), NAVY, 15, weight=700, time=t, wave=3)
        return frame

    def quiz_plate(self, frame, t, icons, reveal_idx=None, caption=None, caption_t=0.0,
                   dim=True, label=None):
        if self._quiz_bg is None:
            bg = camera(self.as_.quiz_bg, zoom=1.12, cx=0.5, cy=0.5)
            bg = soft_blur(bg, 9)
            self._quiz_bg = np.clip(bg.astype(np.float32) * 0.94, 0, 255).astype(np.uint8)
        frame[:] = self._quiz_bg
        add_glow(frame, W * 0.5, H * 0.5, 900, (250, 245, 255), 0.16)
        draw_sparkles(frame, t, n=16, seed=111, alpha=0.6)
        n = len(icons)
        span = W * 0.74
        x0 = W / 2 - span / 2
        for i, k in enumerate(icons):
            x = x0 + span * (i / max(1, n - 1))
            centre = (W / 2, H * 0.52)
            on = reveal_idx == i
            ap = 1.0
            sc = 1.0
            bob = math.sin(t * 2 + i) * 8
            if reveal_idx is not None:
                if on:
                    sc = 1.22 + 0.06 * math.sin(t * 6)
                    add_glow(frame, x, H * 0.52 + bob, 220, (255, 245, 180), 0.5)
                else:
                    ap = 0.55
            paste(frame, self.as_.icons[k], x, H * 0.52 + bob, height=290 * sc, alpha=ap, anchor="center",
                  rot=0 if not on else math.sin(t * 5) * 5)
            if on:
                for j in range(8):
                    ang = j * math.pi / 4 + t
                    draw_star(frame, x + math.cos(ang) * 170, H * 0.52 + math.sin(ang) * 130,
                              26 + 8 * math.sin(t * 5 + j), (255, 250, 200), 0.9)
        if caption:
            band(frame, H * 0.755, H, 0.34)
            rv = reveal_progress(caption_t, 0.05, 0.08, len(caption.split()))
            draw_line(frame, caption.split(), W / 2, H * 0.845, 74, (255, 255, 255), NAVY, 14,
                      weight=700, reveal=rv, time=t)
        if label:
            draw_line(frame, label.split(), W / 2, H * 0.175, 64, (255, 246, 200), NAVY, 12,
                      weight=700, time=t)
        return frame

    def shot_quiz_red(self, t, tl, dur):
        frame = np.zeros((H, W, 3), np.uint8)
        icons = ["green", "yellow", "red", "violet", "indigo"]
        reveal_idx = None
        lt = t - 147.0
        if lt > 0:
            reveal_idx = 2
        self.quiz_plate(frame, t, icons, reveal_idx=reveal_idx,
                        caption=("The apple is RED!") if lt > 0 else None, caption_t=max(0.0, lt))
        # question bubble before the answer
        if t < 147.0:
            a = ease_out(clamp(tl / 0.6))
            draw_line(frame, ["Can", "you", "find", "something", "red?"], W / 2, H * 0.175, 72,
                      (255, 255, 255), NAVY, 14, weight=700, alpha=a, time=t)
            # thinking dots
            for i in range(3):
                ph = (t * 1.6 + i * 0.25) % 1.0
                draw_star(frame, W * 0.5 + (i - 1) * 70, H * 0.30 - 20 * math.sin(ph * math.pi),
                          26 + 10 * math.sin(ph * math.pi), (255, 240, 180), 0.9)
        else:
            draw_line(frame, ["You", "found", "it!"], W / 2, H * 0.175, 64,
                      (255, 246, 200), NAVY, 12, weight=700, time=t)
            draw_confetti(frame, t, n=36, seed=113, speed=140)
        flash(frame, max(0.0, 0.4 - tl * 2.4))
        return frame

    def shot_quiz_sun(self, t, tl, dur):
        frame = np.zeros((H, W, 3), np.uint8)
        icons = ["blue", "green", "yellow", "red", "violet"]
        lt = t - 157.4
        reveal_idx = 2 if lt > 0 else None
        self.quiz_plate(frame, t, icons, reveal_idx=reveal_idx,
                        caption=("The sunshine is YELLOW!") if lt > 0 else None,
                        caption_t=max(0.0, lt), label=None)
        if lt <= 0:
            a = ease_out(clamp(tl / 0.6))
            draw_line(frame, ["Which", "colour", "is", "the", "sunshine?"], W / 2, H * 0.175, 72,
                      (255, 255, 255), NAVY, 14, weight=700, alpha=a, time=t)
            for i in range(3):
                ph = (t * 1.5 + i * 0.3) % 1.0
                draw_star(frame, W * 0.5 + (i - 1) * 70, H * 0.30 - 22 * math.sin(ph * math.pi),
                          26 + 10 * math.sin(ph * math.pi), (255, 240, 180), 0.9)
        else:
            draw_line(frame, ["Yes!", "Yellow!"], W / 2, H * 0.175, 64,
                      (255, 246, 200), NAVY, 12, weight=700, time=t)
            draw_confetti(frame, t, n=40, seed=117, speed=150)
        flash(frame, max(0.0, 0.4 - tl * 2.4))
        return frame

    def shot_finale(self, t, tl, dur):
        frame = camera(self.as_.road, zoom=1.22 - 0.04 * smooth(tl / dur), cx=0.5, cy=0.50)
        draw_sparkles(frame, t, n=30, seed=121, alpha=0.95, size=(14, 38))
        draw_confetti(frame, t, n=64, seed=123, speed=130)
        draw_rainbow_sheen(frame, t)
        # characters ride along the rainbow
        gang = [("bunny", 0.14), ("buddy", 0.245), ("leo", 0.36), ("ellie", 0.475), ("miko", 0.585)]
        for i, (n, fx) in enumerate(gang):
            hop = abs(math.sin(t * 4.6 + i * 0.7)) * 34
            self.rigs[n].draw(frame, W * fx, H * 0.84, t, phase=i, hop=hop, tilt=math.sin(t * 3.6 + i) * 5)
        self.maggie(frame, W * 0.78, H * 0.86, scale=0.74, t=t, children=4, rot=-1.4)
        for i in range(6):
            draw_note(frame, W * (0.10 + 0.15 * i) + math.sin(t * 1.5 + i) * 30,
                      H * (0.22 + 0.07 * math.sin(t * 1.2 + i * 1.3)), 54, t,
                      (255, 245, 190), 0.9, phase=i)
        for i, k in enumerate(["red", "orange", "yellow", "green", "blue", "indigo", "violet"]):
            x = W * (0.24 + 0.086 * i)
            y = H * 0.105 + math.sin(t * 2 + i * 0.7) * 12
            paste(frame, self.as_.icons[k], x, y, height=96, alpha=0.98, anchor="center")
        draw_line(frame, ["Seven", "colours,", "you", "and", "me!"], W / 2, H * 0.30, 82,
                  (255, 255, 255), NAVY, 15, weight=700, time=t, wave=4)
        return frame

    def shot_outro(self, t, tl, dur):
        frame = np.full((H, W, 3), 250, np.uint8)
        frame[:] = (247, 244, 236)
        # soft colour blobs
        for i, col in enumerate([(255, 220, 120), (150, 220, 255), (255, 170, 200)]):
            add_glow(frame, W * (0.18 + 0.32 * i), H * (0.2 + 0.12 * i), 420, col, 0.35)
        draw_sparkles(frame, t, n=24, seed=131, alpha=0.9)
        # characters wave goodbye at the bottom
        gang = [("bunny", 0.115), ("buddy", 0.235), ("leo", 0.355), ("ellie", 0.475), ("miko", 0.590)]
        for i, (n, fx) in enumerate(gang):
            hop = abs(math.sin(t * 4.0 + i * 0.8)) * 24
            self.rigs[n].draw(frame, W * fx, H * 1.03, t, phase=i, hop=hop, tilt=math.sin(t * 3 + i) * 4,
                              scale=1.02)
        self.maggie(frame, W * 0.80, H * 1.045, scale=0.64, t=t, children=0)
        a = ease_out(clamp(tl / 0.8))
        paste(frame, self.as_.logo, W / 2, H * 0.30, width=560 * (0.94 + 0.06 * a), alpha=a, anchor="center")
        rv2 = reveal_progress(tl, 1.2, 0.12, 5)
        draw_line(frame, ["See", "you", "soon,", "little", "friends!"], W / 2, H * 0.445, 74,
                  (255, 255, 255), NAVY, 13, weight=700, reveal=rv2, time=t, wave=3)
        cues = {c["clip"]: c for c in self.info["cues"]}
        c = cues.get("maggie_close")
        if c and c["dur"] and t >= c["start"] and t <= c["start"] + c["dur"] + 1.5:
            self.caption(frame, "maggie_close", t - c["start"], t)
        frame = vignette(frame, 0.18)
        # fade out to white
        flash(frame, clamp((t - (plan.END - 2.6)) / 2.4) * 0.95)
        return frame

    # ------------------------------------------------------------- dispatcher
    def render(self, t):
        for i, (sid, s, e) in enumerate(plan.SHOTS):
            if s <= t < e:
                tl = t - s
                fn = getattr(self, "shot_" + sid)
                frame = fn(t, tl, e - s)
                # crossfade in from the previous shot
                if i > 0 and tl < 0.45:
                    psid, ps, pe = plan.SHOTS[i - 1]
                    prev = getattr(self, "shot_" + psid)(t, pe - ps, pe - ps)
                    w = smooth(tl / 0.45)
                    frame = cv2.addWeighted(prev, 1 - w, frame, w, 0)
                return frame
        return self.shot_outro(t, plan.END - 176.0, 10.0)


def draw_rainbow_sheen(frame, t):
    cols = [(255, 110, 120), (255, 170, 80), (255, 230, 110), (120, 220, 130),
            (110, 190, 255), (150, 140, 250), (210, 120, 240)]
    for i, c in enumerate(cols):
        y = H * 0.965 + i * 9
        cv2.line(frame, (0, int(y)), (W, int(y + 40)), c[::-1], 12, cv2.LINE_AA)


# ------------------------------------------------------------------------ main
def encode(out_path, start=0.0, end=None, scale=1.0, preview=False):
    ep = Episode()
    end = end or plan.END
    n_frames = int(round((end - start) * FPS))
    ow, oh = int(W * scale) // 2 * 2, int(H * scale) // 2 * 2
    import imageio_ffmpeg
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [ff, "-y", "-v", "warning",
           "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-vf", f"scale={ow}:{oh}:flags=lanczos",
           "-c:v", "libx264", "-preset", "medium", "-crf", "18" if preview else "19",
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", out_path]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(n_frames):
        t = start + i / FPS
        frame = ep.render(t)
        if scale != 1.0:
            frame = cv2.resize(frame, (ow, oh), interpolation=cv2.INTER_AREA)
        proc.stdin.write(np.ascontiguousarray(frame).tobytes())
        if i % 150 == 0:
            print("  frame %d/%d  t=%.1fs" % (i, n_frames, t), flush=True)
    proc.stdin.close()
    proc.wait()
    return out_path


if __name__ == "__main__":
    args = sys.argv[1:]
    if args and args[0] == "frames":
        ep = Episode()
        for spec in args[1:]:
            t = float(spec)
            f = ep.render(t)
            cv2.imwrite(os.path.join(BUILD, "f_%06.2f.jpg" % t), f, [cv2.IMWRITE_JPEG_QUALITY, 92])
            print("wrote frame", t)
    elif args and args[0] == "range":
        a, b = float(args[1]), float(args[2])
        out = args[3] if len(args) > 3 else os.path.join(BUILD, "clip.mp4")
        encode(out, a, b, scale=float(args[4]) if len(args) > 4 else 1.0, preview=True)
    else:
        encode(os.path.join(BUILD, "picture.mp4"))

"""Render frames for 'The Magic Rainbow Bus' - Opening Shot.

Composes: baked background plate (camera-sampled) -> live environment
(clouds, water sparkle, pollen, birds, butterflies) -> characters with
per-frame animation -> foreground -> captions.
"""
from __future__ import annotations

import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter, ImageFont

import world
from lib import Canvas, bez, ease_in_out, hexc, lerp, mix, shade, smoothstep, with_alpha
from characters import render_sprite, WORLD_HEIGHT

W, H = 1920, 1080
FPS = 24
S = world.S

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "..", "assets")

FONT_CAP = os.path.join(ASSETS, "fonts", "nunito-latin-700.ttf")
FONT_TITLE = os.path.join(ASSETS, "fonts", "fredoka-latin-600.ttf")

PLATE = world.get_plate()


# ------------------------------------------------------------------ helpers
def blink_at(t, times, dur=0.14):
    for tt in times:
        d = t - tt
        if 0 <= d <= dur:
            k = math.sin(math.pi * d / dur)
            return min(1.0, k * 1.15)
    return 0.0


def camera_at(t, keys):
    """keys: list of (time, cx, cy, scale). Smooth ease between neighbours."""
    if t <= keys[0][0]:
        _, cx, cy, s = keys[0]
        return cx, cy, s
    for i in range(len(keys) - 1):
        t0, x0, y0, s0 = keys[i]
        t1, x1, y1, s1 = keys[i + 1]
        if t0 <= t <= t1:
            k = ease_in_out((t - t0) / max(1e-6, t1 - t0))
            return lerp(x0, x1, k), lerp(y0, y1, k), lerp(s0, s1, k)
    _, cx, cy, s = keys[-1]
    return cx, cy, s


def fade(t, t0, t1):
    """0 -> 1 smooth ramp."""
    if t <= t0:
        return 0.0
    if t >= t1:
        return 1.0
    return smoothstep((t - t0) / (t1 - t0))


class Cam:
    def __init__(self, cx, cy, scale):
        self.cx, self.cy, self.scale = cx, cy, scale
        self.hw = W / 2 / scale
        self.hh = H / 2 / scale

    def to_screen(self, wx, wy):
        return ((wx - self.cx) * self.scale + W / 2, (wy - self.cy) * self.scale + H / 2)

    def bg(self):
        x0 = (self.cx - self.hw - world.PX0) * S
        y0 = (self.cy - self.hh - world.PY0) * S
        w = (self.hw * 2) * S
        h = (self.hh * 2) * S
        crop = PLATE.crop((int(x0), int(y0), int(x0 + w), int(y0 + h)))
        return crop.resize((W, H), Image.BILINEAR)


# ------------------------------------------------------------------ environment
def draw_clouds(c: Canvas, cam: Cam, t):
    layer = Canvas(W, H, 1)
    for i, (wx, wy, s, speed, alpha) in enumerate([
        (-120, 150, 1.35, 12, 235), (620, 96, 0.95, 8, 210), (1500, 190, 1.1, 10, 225),
        (2050, 120, 0.8, 9, 190), (300, 260, 0.7, 7, 170), (1150, 300, 0.6, 6, 150),
    ]):
        x = wx + (t * speed) % 900
        sx, sy = cam.to_screen(x, wy)
        ss = s * cam.scale
        world.cloud(layer, sx / layer.s, sy / layer.s, ss, alpha)
    c.composite(layer)


def draw_birds(c: Canvas, cam: Cam, t):
    layer = Canvas(W, H, 1)
    for i in range(5):
        base_x = 300 + i * 90 + t * 26
        base_y = 210 + math.sin(i * 1.9) * 26 + 10 * math.sin(t * 0.9 + i)
        sx, sy = cam.to_screen(base_x, base_y)
        sx, sy = sx / layer.s, sy / layer.s
        flap = math.sin(t * 7 + i * 1.3)
        span = 13 * cam.scale / 2
        col = with_alpha(hexc("4A6A72"), 120)
        layer.line([(sx - span, sy - flap * span * 0.4), (sx, sy), (sx + span, sy - flap * span * 0.4)],
                   col, max(1.4, 2.2 * cam.scale / 2))
    c.composite(layer)


def draw_water_sparkles(c: Canvas, cam: Cam, t):
    rnd = random.Random(3)
    layer = Canvas(W, H, 1)
    for i in range(34):
        u = 0.16 + (((i * 0.118) + t * 0.045) % 0.82)
        (cx, cy), (nx, ny), hw = world.stream_frame(u)
        off = math.sin(i * 2.7 + t * 1.7) * 0.8
        wx, wy = cx + nx * hw * off, cy + ny * hw * off
        k = max(0.0, math.sin(t * 4.2 + i * 1.9))
        if k < 0.08:
            continue
        sx, sy = cam.to_screen(wx, wy)
        sx, sy = sx / layer.s, sy / layer.s
        r = (3.0 + 5.0 * k) * (0.4 + cam.scale * 0.55)
        layer.line([(sx - r * 1.5, sy), (sx + r * 1.5, sy)],
                   with_alpha(hexc("FFFFFF"), int(150 * k)), max(1.0, r * 0.20))
        layer.line([(sx, sy - r * 0.8), (sx, sy + r * 0.8)],
                   with_alpha(hexc("FFFFFF"), int(110 * k)), max(0.8, r * 0.13))
    c.composite(layer)


def draw_pollen(c: Canvas, cam: Cam, t):
    rnd = random.Random(9)
    layer = Canvas(W, H, 1)
    for i in range(26):
        bx = rnd.uniform(200, 2400)
        by = rnd.uniform(760, 1300)
        wx = bx + math.sin(t * 0.7 + i) * 18 + t * 6
        wy = by - ((t * 14 + i * 40) % 120)
        sx, sy = cam.to_screen(wx, wy)
        sx, sy = sx / layer.s, sy / layer.s
        r = 2.6 * min(3.0, cam.scale) * (0.6 + 0.4 * math.sin(t + i))
        if r < 0.6:
            continue
        layer.glow(sx, sy, r * 3.2, hexc("FFFCE0"), 0.55)
        layer.circle(sx, sy, r, with_alpha(hexc("FFFDF0"), 210))
    c.composite(layer)


def draw_butterfly(c: Canvas, cam: Cam, t, x0, y0, amp, speed, phase):
    wx = x0 + math.sin(t * speed + phase) * amp
    wy = y0 + math.sin(t * speed * 1.7 + phase) * 26 - math.sin(t * 0.6 + phase) * 10
    img, (ax, ay) = render_sprite("bea", t, 1.15)
    sx, sy = cam.to_screen(wx, wy)
    sx, sy = sx / c.s, sy / c.s
    c.img.alpha_composite(img, (int(sx * c.s - ax * c.s), int(sy * c.s - ay * c.s)))


def draw_swaying_flowers(c: Canvas, cam: Cam, t):
    """Live flowers with gentle sway, in front of the cast for parallax."""
    for i, (wx, wy, h, col, pet) in enumerate([
        (596, 1012, 118, hexc("FFFDF4"), 6), (700, 1058, 96, hexc("FFD447"), 5),
        (1140, 1044, 104, hexc("F98BB4"), 6), (1216, 1010, 84, hexc("C9A8F0"), 8),
        (1420, 1072, 126, hexc("FFFDF4"), 6), (1520, 1032, 92, hexc("FF9A57"), 5),
        (150, 1088, 130, hexc("FFFDF4"), 6), (250, 1052, 96, hexc("F98BB4"), 6),
    ]):
        sx, sy = cam.to_screen(wx, wy)
        sway = math.sin(t * 1.15 + i * 1.3) * 0.10
        layer = Canvas(W, H, 1)
        world.flower(layer, sx, sy, h * cam.scale, col, sway,
                     petals=pet, size=1.05 * cam.scale, kind="daisy" if pet == 6 else "round")
        layer.flush_alpha()
        c.img.alpha_composite(layer.img)
    _ = 0


def draw_foreground(c: Canvas, cam: Cam, t):
    """Soft, out-of-focus flowers at the very bottom for depth."""
    layer = Canvas(W, H, 1)
    mask = Image.new("L", layer.img.size, 0)
    for i, (wx, wy, h, col) in enumerate([
        (60, 1330, 200, hexc("FFFDF2")), (1830, 1320, 210, hexc("FFFDF2")),
    ]):
        sx, sy = cam.to_screen(wx, wy)
        sx, sy = sx / c.s, sy / c.s
        petal = (h * cam.scale / c.s) * 0.055
        if petal < 2:
            continue
        world.flower(layer, sx, sy, h * cam.scale / c.s * 0.55, col, math.sin(t * 0.8 + i) * 0.12,
                     petals=6, size=petal / 7.2 * 1.6, kind="daisy")
    layer.blur(7)
    c.composite(layer, alpha=0.5)


# ------------------------------------------------------------------ characters
def draw_cast(c: Canvas, cam: Cam, t, mood_sunny, sparkle, badge_fill):
    """Sunny + Pip + Milo on the left bank of the stream."""
    # --- positions (world)
    sunx, suny = 862, 902
    pipx, pipy = 1052, 916
    milox, miloy = 690, 916

    # --- Milo (left)
    img, (ax, ay) = render_sprite("milo", t, 1.0, blink=blink_at(t, [2.9, 7.8, 12.4]),
                                  wag=1.0 + 0.3 * math.sin(t * 0.7), mood="happy")
    sx, sy = cam.to_screen(milox, miloy)
    c.img.alpha_composite(img, (int(sx - ax * c.s), int(sy - ay * c.s)))

    # --- Pip (right, near the stream)
    img, (ax, ay) = render_sprite("pip", t, 1.05, blink=blink_at(t, [1.7, 5.6, 10.9, 14.2]),
                                  ear=0.35 + 0.25 * math.sin(t * 0.9), wave=0.0)
    sx, sy = cam.to_screen(pipx, pipy)
    c.img.alpha_composite(img, (int(sx - ax * c.s), int(sy - ay * c.s)))

    # --- Sunny (centre)
    look = (lerp(0.95, 0.55, fade(t, 9.0, 11.0)), 0.08)
    if t > 13.4:
        look = (lerp(0.55, 0.12, fade(t, 13.4, 14.6)), 0.02)
    talk = 0.0
    if 2.6 < t < 5.9:   # "Meet Sunny, the little rainbow bus."
        talk = 0.45 + 0.45 * math.sin(t * 17.0) * math.sin(t * 6.1)
    if 13.4 < t < 16.2:  # little celebration wiggle
        talk = 0.25 + 0.2 * math.sin(t * 9.0)
    img, (ax, ay) = render_sprite(
        "sunny", t, 1.0,
        blink=blink_at(t, [3.6, 9.4, 15.1]),
        mood=mood_sunny, look=look, badge_fill=badge_fill, sparkle=sparkle,
        glow=1.0, wheel_spin=t * 8, talk=max(0.0, talk))
    sx, sy = cam.to_screen(sunx, suny)
    c.img.alpha_composite(img, (int(sx - ax * c.s), int(sy - ay * c.s)))


# ------------------------------------------------------------------ captions
_wrap_cache = {}


def fit_text(draw, text, font_path, max_width, start_size):
    size = start_size
    while size > 20:
        font = ImageFont.truetype(font_path, size)
        if draw.textlength(text, font=font) <= max_width:
            return font
        size -= 2
    return ImageFont.truetype(font_path, size)


def draw_caption(frame: Image.Image, text, alpha=1.0, y=H - 118):
    if alpha <= 0.01 or not text:
        return
    d = ImageDraw.Draw(frame)
    font = ImageFont.truetype(FONT_CAP, 46)
    max_w = W - 400
    if d.textlength(text, font=font) > max_w:
        font = fit_text(d, text, FONT_CAP, max_w, 46)
    # gentle dark gradient behind the subtitle band for legibility
    band = Image.new("RGBA", (W, 260), (0, 0, 0, 0))
    bd = ImageDraw.Draw(band)
    for i in range(260):
        a = int(105 * alpha * (i / 259) ** 1.5)   # 0 at the top edge, strongest at the bottom
        bd.line([(0, i), (W, i)], fill=(12, 24, 32, a))
    frame.alpha_composite(band, (0, H - 260))

    bbox = d.textbbox((0, 0), text, font=font, stroke_width=4)
    tw = bbox[2] - bbox[0]
    x = (W - tw) / 2 - bbox[0]
    yy = y
    # soft shadow
    d.text((x + 2, yy + 3), text, font=font, fill=(10, 20, 28, int(150 * alpha)),
           stroke_width=6, stroke_fill=(10, 20, 28, int(110 * alpha)))
    d.text((x, yy), text, font=font, fill=(255, 255, 255, int(255 * alpha)),
           stroke_width=4, stroke_fill=(24, 38, 48, int(235 * alpha)))


# ------------------------------------------------------------------ timeline
# narration: block A 0.55 -> 6.03, block B 6.55 -> 13.67 (mp3 durations)
T_END = 17.4

CAPTIONS = [
    (0.70, 2.55, "Hello, little explorers!"),
    (2.75, 5.90, "Meet Sunny, the little rainbow bus."),
    (6.70, 9.60, "One beautiful morning, Sunny and his friends"),
    (9.75, 13.55, "discovered that their magical rainbow bridge was missing!"),
]

CAM_KEYS = [
    # establishing -> three-shot -> close-up push on Sunny
    (0.0, 1000, 600, 0.82),
    (3.0, 1010, 610, 0.88),
    (5.2, 930, 700, 1.16),
    (8.6, 900, 730, 1.30),
    (11.4, 905, 752, 1.85),
    (14.2, 896, 756, 2.10),
    (T_END, 890, 762, 2.22),
]

MOOD_KEYS = [
    ("curious", 0.0), ("curious", 8.6), ("worry", 9.9), ("worry", 12.6),
    ("determined", 13.9), ("determined", 99),
]


def mood_at(t):
    cur = MOOD_KEYS[0][0]
    for m, tt in MOOD_KEYS:
        if t >= tt:
            cur = m
    return cur


def caption_at(t):
    for a, b, txt in CAPTIONS:
        if a <= t <= b:
            fade_in = min(1.0, (t - a) / 0.25)
            fade_out = min(1.0, (b - t) / 0.25)
            return txt, max(0.0, min(fade_in, fade_out))
    return "", 0.0


def render_frame(frame_index: int) -> Image.Image:
    t = frame_index / FPS
    cx, cy, sc = camera_at(t, CAM_KEYS)
    # subtle handheld float
    cx += math.sin(t * 0.42) * 5
    cy += math.sin(t * 0.55 + 1.2) * 3.2
    cam = Cam(cx, cy, sc)

    base = cam.bg().convert("RGBA")
    c = Canvas(W, H)
    c.img = base.copy()
    c.d = ImageDraw.Draw(c.img)

    # environment in front of the plate but behind the cast
    draw_water_sparkles(c, cam, t)
    draw_birds(c, cam, t)
    draw_pollen(c, cam, t)

    # ambient butterflies
    draw_butterfly(c, cam, t, 700, 960, 36, 0.55, 0.0)
    draw_butterfly(c, cam, t, 1445, 1010, 42, 0.4, 4.0)

    # moods / effects
    mood = mood_at(t)
    sparkle = 0.0
    if 13.6 < t < 16.4:
        sparkle = math.sin((t - 13.6) / 2.8 * math.pi)
    badge_fill = fade(t, 14.4, 16.6) * 0.55 + 0.12 * math.sin(t * 3.0) * fade(t, 14.4, 15.2)

    draw_cast(c, cam, t, mood, max(0.0, sparkle), max(0.0, badge_fill))
    draw_swaying_flowers(c, cam, t)

    frame = c.finish()
    txt, a = caption_at(t)
    draw_caption(frame, txt, a)
    return frame.convert("RGB"), t

"""Prepare cut-out character / icon sprites and dress the village set with the Learnzo logo.

All art is either the user-supplied logo file or generated 3D art; the characters
are cut once and reused everywhere, so they stay perfectly consistent.
"""
import os
import numpy as np
import cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(HERE, "assets")
BUILD = os.path.join(HERE, "build")
LOGO = os.path.join(A, "learnzo-logo.png")


def read(path):
    return np.array(Image.open(path).convert("RGB"))


# ----------------------------------------------------------------------------- keying
def cut_magenta(path, area_min=3000):
    """Key a magenta cyc via chroma triples (both R and B well above G) then
    keep the outer silhouette and decontaminate the soft edge."""
    img = read(path)
    f = img.astype(np.float32)
    keyness = np.minimum(f[:, :, 0], f[:, :, 2]) - f[:, :, 1]   # magenta cyc => ~185
    bright = (f[:, :, 0] > 140) & (f[:, :, 2] > 140)            # violet art has R < B
    alpha = 1.0 - np.clip((keyness - 112.0) / 42.0, 0, 1) * bright   # 1 = character
    alpha = cv2.GaussianBlur(alpha.astype(np.float32), (3, 3), 0.7)

    solid = (alpha > 0.5).astype(np.uint8)
    solid = cv2.morphologyEx(solid, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    solid = cv2.morphologyEx(solid, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(solid, 8)
    keep = np.zeros_like(solid)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] > area_min:
            keep[lab == i] = 1
    cnts, _ = cv2.findContours(keep, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    sil = np.zeros_like(keep)
    cv2.drawContours(sil, cnts, -1, 1, thickness=-1)
    sil = cv2.morphologyEx(sil, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))

    a = np.clip(alpha, 0, 1) * cv2.dilate(sil, np.ones((3, 3), np.uint8))
    # trim the outer half-pixel of the ramp: that is where cyc contamination lives
    a = np.clip((a - 0.34) / 0.66, 0, 1)
    a = cv2.GaussianBlur(a.astype(np.float32), (3, 3), 0.45)

    K = np.median(np.concatenate([img[:12].reshape(-1, 3), img[-12:].reshape(-1, 3),
                                  img[:, :12].reshape(-1, 3), img[:, -12:].reshape(-1, 3)]),
                  axis=0).astype(np.float32)
    a3 = np.maximum(a, 0.18)[:, :, None]
    fgc = np.clip((f - (1 - a)[:, :, None] * K) / a3, 0, 255)
    fgc = np.where(a[:, :, None] > 0.985, f, fgc)
    # magenta cast on near-neutral surfaces (chrome bumper, white fur, tyres): lift
    # green to the R/B average so the surface reads as grey-white, not pink
    grey = (fgc.max(axis=2) - fgc.min(axis=2)) < 85
    target_g = (fgc[:, :, 0] + fgc[:, :, 2]) / 2.0
    # only the rim can be contaminated - keep genuine pink interiors untouched
    band = cv2.dilate((a < 0.995).astype(np.uint8), np.ones((7, 7), np.uint8)) > 0
    fix = grey & band & (target_g - fgc[:, :, 1] > 3)
    fgc[:, :, 1] = np.where(fix, target_g * 0.99, fgc[:, :, 1])

    # global de-bounce: the render carries a magenta bounce over the whole cyc-lit
    # body, so lift green on low-saturation magenta-hued pixels everywhere
    hsv = cv2.cvtColor(np.clip(fgc, 0, 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32)
    cast = (hsv[:, :, 0] > 128) & (hsv[:, :, 0] < 180) & (hsv[:, :, 1] < 120)
    rb = (fgc[:, :, 0] + fgc[:, :, 2]) / 2.0
    gain = np.where(cast, np.clip((rb - fgc[:, :, 1]) * 0.85, 0, 60), 0)
    fgc[:, :, 1] += gain

    return np.clip(fgc, 0, 255).astype(np.uint8), np.clip(a, 0, 1)


def fix_bus_cast(rgba):
    """The bus was rendered on a magenta cyc; its shaded panels picked up pink.
    Pull blue down towards green wherever the body reads pink rather than orange."""
    arr = np.array(rgba).astype(np.float32)
    f = arr[:, :, :3]
    r, g, b = f[:, :, 0], f[:, :, 1], f[:, :, 2]
    pink = (b > g + 18) & (r > g + 25) & (np.abs(r - b) < 70) & (arr[:, :, 3] > 40)
    # orange body: cap blue just above green; shadowed panels stay believable
    b2 = np.where(pink, np.minimum(b, g * 0.85 + 34), b)
    arr[:, :, 2] = b2
    # reduce residual pink cast on neutral chrome / bumper
    grey = (np.abs(r - b) < 45) & (b > g) & (b > 90)
    arr[:, :, 1] = np.where(grey, np.maximum(g, (r + b) / 2 * 0.96), arr[:, :, 1])
    # any surviving magenta hue on the body is desaturated toward its own luminance,
    # which reads as neutral shadow instead of pink spill
    hsv = cv2.cvtColor(np.clip(arr[:, :, :3], 0, 255).astype(np.uint8), cv2.COLOR_RGB2HSV)
    pinkish = (hsv[:, :, 0] > 148) & (hsv[:, :, 1] > 35) & (hsv[:, :, 2] > 55)
    lum = arr[:, :, :3].mean(axis=2, keepdims=True)
    soft = arr[:, :, :3] * 0.25 + lum * 0.75
    arr[:, :, :3] = np.where(pinkish[:, :, None], soft, arr[:, :, :3])
    # and nudge the residual green up so warm grey stays warm rather than mauve
    arr[:, :, 1] = np.where(pinkish, np.maximum(arr[:, :, 1], arr[:, :, 2] * 0.80), arr[:, :, 1])
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")


def clean_side_bus(path, raw_path=None):
    """The keyed side bus carries a violet window fill and pink hubcap spokes
    from the cyc. Replace the glass (masked exactly by the old violet pane, so
    the rounded rubber seal survives) and neutralise the hubcaps."""
    raw = path if raw_path is None else raw_path
    raw_arr = np.array(Image.open(raw).convert("RGBA"))
    arr = np.array(Image.open(path).convert("RGBA"))
    rf = raw_arr[:, :, :3].astype(np.float32)
    f = arr[:, :, :3].astype(np.float32)
    windows = [[130, 96, 300, 196], [492, 96, 268, 196], [800, 100, 172, 168]]
    wheels = [(227.4, 529.8, 96.0), (877.8, 532.2, 92.0)]

    for wx, wy, ww, wh in windows:
        # pane = rounded rect inset from the light rubber seal
        px0, py0 = wx + 26, wy + 20
        px1, py1 = wx + ww - 26, wy + wh - 20
        pw, ph = px1 - px0, py1 - py0
        rad = int(min(pw, ph) * 0.30)
        panes = np.zeros(arr.shape[:2], np.uint8)
        cv2.rectangle(panes, (px0 + rad, py0), (px1 - rad, py1), 255, -1, cv2.LINE_AA)
        cv2.rectangle(panes, (px0, py0 + rad), (px1, py1 - rad), 255, -1, cv2.LINE_AA)
        for ccx in (px0 + rad, px1 - rad):
            for ccy in (py0 + rad, py1 - rad):
                cv2.circle(panes, (ccx, ccy), rad, 255, -1, cv2.LINE_AA)
        m = cv2.GaussianBlur(panes.astype(np.float32), (5, 5), 1.0)[:, :, None] / 255.0
        m = m[py0:py1, px0:px1]
        hh, ww2 = py1 - py0, px1 - px0
        yy = np.linspace(0, 1, hh)[:, None, None]
        xx = np.linspace(0, 1, ww2)[None, :, None]
        top = np.array([170, 212, 240], np.float32)
        bot = np.array([104, 158, 212], np.float32)
        glass = top * (1 - yy * 0.75) + bot * (yy * 0.75)
        for sk in (0.24, 0.60):
            glass = glass + (np.abs((xx * 1.6 - yy) - sk) < 0.045) * 30
        glass = np.clip(glass, 0, 255)
        sub = f[py0:py1, px0:px1]
        f[py0:py1, px0:px1] = sub * (1 - m) + glass * m

    for cx, cy, rw in wheels:
        rr = rw * 0.42
        x0, y0 = int(cx - rr), int(cy - rr)
        x1, y1 = int(cx + rr), int(cy + rr)
        sub = f[y0:y1, x0:x1]
        hsv = cv2.cvtColor(np.clip(sub, 0, 255).astype(np.uint8), cv2.COLOR_RGB2HSV)
        pink = ((hsv[:, :, 0] > 135) & (hsv[:, :, 1] > 45) & (hsv[:, :, 2] > 60)).astype(np.float32)
        pink = cv2.GaussianBlur(pink, (9, 9), 2.5)[:, :, None]
        grey = np.repeat(sub.mean(axis=2, keepdims=True), 3, axis=2)
        f[y0:y1, x0:x1] = sub * (1 - pink) + (grey * 0.9 + 16) * pink

    arr[:, :, :3] = np.clip(f, 0, 255).astype(np.uint8)
    hsv = cv2.cvtColor(arr[:, :, :3], cv2.COLOR_RGB2HSV)
    spec = (hsv[:, :, 0] > 138) & (hsv[:, :, 0] < 175) & (hsv[:, :, 1] > 60)
    lum = arr[:, :, :3].mean(axis=2, keepdims=True)
    arr[:, :, :3] = np.where(spec[:, :, None], np.repeat(lum, 3, axis=2) * 0.9 + 18,
                             arr[:, :, :3])
    out = Image.fromarray(arr.astype(np.uint8), "RGBA")
    out.save(path)
    return out


def trim(rgba, pad=2):
    a = np.array(rgba)[:, :, 3]
    ys, xs = np.where(a > 12)
    y0, y1 = max(0, ys.min() - pad), min(rgba.height, ys.max() + 1 + pad)
    x0, x1 = max(0, xs.min() - pad), min(rgba.width, xs.max() + 1 + pad)
    return rgba.crop((x0, y0, x1, y1))


def split_sprites(img, alpha, names, min_w=40, gap=8, thresh=0.75, area_min=900):
    full = Image.fromarray(np.dstack([img, (alpha * 255).astype(np.uint8)]), "RGBA")
    col = (alpha > thresh).sum(axis=0)
    xs = np.where(col > 2)[0]
    groups, start = [], xs[0]
    for x, y in zip(xs[:-1], xs[1:]):
        if y - x > gap:
            groups.append((start, x + 1))
            start = y
    groups.append((start, xs[-1] + 1))
    groups = [g for g in groups if g[1] - g[0] > min_w]

    # split merged neighbours at the emptiest column inside the widest blob
    while len(groups) < len(names):
        idx = int(np.argmax([g[1] - g[0] for g in groups]))
        x0, x1 = groups[idx]
        lo, hi = x0 + int((x1 - x0) * 0.28), x0 + int((x1 - x0) * 0.72)
        cs = cv2.GaussianBlur(col.astype(np.float32)[None, :], (1, 15), 0)[0]
        cut = lo + int(np.argmin(cs[lo:hi]))
        groups = groups[:idx] + [(x0, cut), (cut, x1)] + groups[idx + 1:]
    assert len(groups) == len(names), "sprite split mismatch"
    print("spans", groups)

    msk = (alpha > 0.4).astype(np.uint8)
    n, lab, stats, cent = cv2.connectedComponentsWithStats(msk, 8)
    out = []
    for name, (x0, x1) in zip(names, groups):
        keep = np.zeros_like(msk)
        for i in range(1, n):
            cx = cent[i][0]
            if x0 - 2 <= cx < x1 + 2 and stats[i, cv2.CC_STAT_AREA] > area_min:
                keep[lab == i] = 1
        keep = cv2.dilate(keep, np.ones((3, 3), np.uint8))
        a = alpha * keep
        rgba = np.dstack([img, (np.clip(a, 0, 1) * 255).astype(np.uint8)])
        sub = Image.fromarray(rgba, "RGBA").crop((max(0, x0 - 6), 0, min(full.width, x1 + 6), full.height))
        sub = trim(sub)
        # repaint any leftover magenta speck inside the sprite
        arr = np.array(sub)
        f = arr[:, :, :3].astype(np.float32)
        hot = (f[:, :, 0] > 165) & (f[:, :, 2] > 165) & (f[:, :, 1] < 115)
        speck = (hot & (arr[:, :, 3] > 60)).astype(np.uint8)
        # only tiny magenta crumbs, never large legit violet areas
        nn2, ll2, ss2, _ = cv2.connectedComponentsWithStats(speck, 8)
        speck2 = np.zeros_like(speck)
        for j in range(1, nn2):
            if ss2[j, cv2.CC_STAT_AREA] < 260:
                speck2[ll2 == j] = 1
        speck = cv2.dilate(speck2, np.ones((3, 3), np.uint8))
        if speck.sum():
            arr[:, :, :3] = cv2.inpaint(arr[:, :, :3], speck, 3, cv2.INPAINT_TELEA)
        sub = Image.fromarray(arr, "RGBA")
        out.append((name, sub))
        print("  ", name, sub.size, "specks", int(speck.sum()))
    return out


def prepare_characters():
    img, alpha = cut_magenta(os.path.join(A, "ref_characters_magenta.png"))
    for name, sprite in split_sprites(
            img, alpha, ["maggie", "bunny", "buddy", "leo", "ellie", "miko"]):
        if name == "maggie":
            sprite = fix_bus_cast(sprite)
        sprite.save(os.path.join(A, f"char_{name}.png"), optimize=True)


def prepare_icons():
    img, alpha = cut_magenta(os.path.join(A, "icons_magenta.png"), area_min=1200)
    for name, sprite in split_sprites(
            img, alpha, ["red", "orange", "yellow", "green", "blue", "indigo", "violet"],
            min_w=60, gap=6):
        sprite.save(os.path.join(A, f"icon_{name}.png"), optimize=True)


# ------------------------------------------------------------------- logo on the set
def find_white_quad(img, box):
    x0, y0, x1, y1 = box
    roi = img[y0:y1, x0:x1]
    hsv = cv2.cvtColor(roi, cv2.COLOR_RGB2HSV)
    mask = ((hsv[:, :, 1] < 70) & (hsv[:, :, 2] > 190)).astype(np.uint8) * 255
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    c = max(cnts, key=cv2.contourArea)
    quad = cv2.boxPoints(cv2.minAreaRect(c))
    s, d = quad.sum(axis=1), np.diff(quad, axis=1).ravel()
    quad = quad[[np.argmin(s), np.argmin(d), np.argmax(s), np.argmax(d)]]
    quad[:, 0] += x0
    quad[:, 1] += y0
    return quad


def dress_sign_plate():
    """Put the supplied Learnzo logo on the blank board of the close-up plate."""
    path = os.path.join(A, "sign_plate.png")
    img = read(path).copy()
    h, w, _ = img.shape
    quad = find_white_quad(img, (int(w * 0.25), int(h * 0.05), int(w * 0.75), int(h * 0.60)))
    # pull in slightly so the paint stays inside the wooden frame
    ctr = quad.mean(axis=0)
    quad = ctr + (quad - ctr) * 0.965
    print("plate sign quad", quad.astype(int))

    logo = Image.open(LOGO).convert("RGBA")
    # match the board's own aspect so the artwork is never stretched
    bw = max(1.0, np.linalg.norm(quad[1] - quad[0]))
    bh = max(1.0, np.linalg.norm(quad[3] - quad[0]))
    Wb = 1000
    Hb = max(1, int(round(Wb * bh / bw)))
    padx, pady = 0.055, 0.10
    sc = min(Wb * (1 - 2 * padx) / logo.width, Hb * (1 - 2 * pady) / logo.height)
    lg = logo.resize((int(logo.width * sc), int(logo.height * sc)), Image.LANCZOS)
    board = Image.new("RGBA", (Wb, Hb), (0, 0, 0, 0))
    board.alpha_composite(lg, ((Wb - lg.width) // 2, (Hb - lg.height) // 2))
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [Wb, 0], [Wb, Hb], [0, Hb]]),
                                   quad.astype(np.float32))
    warped = cv2.warpPerspective(np.array(board), M, (w, h), flags=cv2.INTER_LANCZOS4)
    a = warped[:, :, 3:4].astype(np.float32) / 255.0
    base = img.astype(np.float32)
    paint = warped[:, :, :3].astype(np.float32)
    out = base * (1 - a) + (base * paint / 255.0) * a
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(
        os.path.join(A, "sign_plate_logo.png"), optimize=True)


def build_sign():
    img = read(os.path.join(A, "scene_village.png")).copy()
    quad = find_white_quad(img, (200, 180, 560, 360))
    print("sign quad", quad.astype(int))

    logo = Image.open(LOGO).convert("RGBA")
    W, H = 1000, 340
    pad = 0.07
    s = min(W * (1 - 2 * pad) / logo.width, H * (1 - 2 * pad) / logo.height)
    lg = logo.resize((int(logo.width * s), int(logo.height * s)), Image.LANCZOS)
    board = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    board.alpha_composite(lg, ((W - lg.width) // 2, (H - lg.height) // 2))
    src = np.array(board)
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [W, 0], [W, H], [0, H]]),
                                    quad.astype(np.float32))
    warped = cv2.warpPerspective(src, M, (img.shape[1], img.shape[0]),
                                 flags=cv2.INTER_LANCZOS4)
    a = warped[:, :, 3:4].astype(np.float32) / 255.0
    # paint-like blend: multiply the colour in so the surface lighting reads through
    base = img.astype(np.float32)
    paint = warped[:, :, :3].astype(np.float32)
    out = base * (1 - a) + (base * paint / 255.0) * a
    out = np.clip(out, 0, 255).astype(np.uint8)
    Image.fromarray(out).save(os.path.join(A, "scene_village_logo.png"), optimize=True)

    x0, y0 = quad[:, 0].min() - 26, quad[:, 1].min() - 26
    x1, y1 = quad[:, 0].max() + 26, quad[:, 1].max() + 26
    crop = Image.fromarray(out).crop((int(x0), int(y0), int(x1), int(y1)))
    crop.resize((crop.width * 3, crop.height * 3), Image.LANCZOS).save(
        os.path.join(A, "sign_closeup.png"), optimize=True)


def bus_side_decal():
    """Small Learnzo decal, perspective-skewed to sit on Maggie's side panel."""
    logo = Image.open(LOGO).convert("RGBA")
    logo = logo.resize((520, int(520 * logo.height / logo.width)), Image.LANCZOS)
    W, H = logo.width + 24, logo.height + 24
    plate = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    plate.alpha_composite(logo, (12, 12))
    plate.save(os.path.join(A, "decal_side.png"), optimize=True)


def main():
    import sys
    if "--side" in sys.argv:
        rgba = cut_magenta(os.path.join(A, "ref_bus_side.png"))
        full = Image.fromarray(np.dstack([rgba[0], (rgba[1] * 255).astype(np.uint8)]), "RGBA")
        raw = trim(full)
        raw.save(os.path.join(BUILD, "bus_side_raw.png"))
        clean_side_bus(os.path.join(BUILD, "bus_side_raw.png"))
        Image.open(os.path.join(BUILD, "bus_side_raw.png")).save(os.path.join(A, "bus_side.png"))


if __name__ == "__main__":
    prepare_characters()
    prepare_icons()
    build_sign()
    dress_sign_plate()
    bus_side_decal()

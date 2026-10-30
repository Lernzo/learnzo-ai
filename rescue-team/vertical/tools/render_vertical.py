#!/usr/bin/env python3
"""Renders the vertical 9:16 (1080x1920) cut of the Learnzo Rescue Team intro.

Reads plan.json (timings) + audio/master.wav (mixed sound) and writes
LEARNZO_RESCUE_TEAM_REEL_9x16.mp4.

The character art is 3D-render-grade key art; the camera, lower thirds and
karaoke captions are real generated motion. This is a previz/animatic cut with
finished voice acting and locked timing for a 3D studio to animate over.
"""
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
ART = os.path.join(ROOT, "art")
AUDIO = os.path.join(ROOT, "audio", "master.wav")
OUT = os.path.join(ROOT, "..", "LEARNZO_RESCUE_TEAM_REEL_9x16.mp4")
FONTS = os.path.abspath(os.path.join(ROOT, "..", "tools", "fonts"))
LOGO = os.path.abspath(os.path.join(ROOT, "..", "tools", "learnzo_logo.png"))
PLAN = json.load(open(os.path.join(ROOT, "plan.json")))

W, H = 1080, 1920
FPS = 30
TOTAL = PLAN["duration"]
XF = PLAN["xfade"]

MS_W, MS_H = 1242, 2208          # master art size (zoom headroom)

NAVY = (6, 24, 62)
BRAND_GRAD = [(11, 46, 120), (18, 96, 214), (16, 150, 200), (22, 190, 178)]


def hexrgb(s):
    s = s.lstrip("#")
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


# ------------------------------------------------------------------ helpers
def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def smooth(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_out_back(x, s=1.7):
    x = clamp(x) - 1
    return 1 + (s + 1) * x ** 3 + s * x ** 2


def ramp(t, a, b):
    return smooth((t - a) / (b - a)) if b > a else (1.0 if t >= b else 0.0)


def pulse(t, a, b, edge=0.22):
    return ramp(t, a, a + edge) * (1 - ramp(t, b - edge, b))


def font(name, size):
    from PIL import ImageFont
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def text_img(text, fnt, fill=(255, 255, 255, 255), gradient=None, stroke=0,
             stroke_fill=(255, 255, 255, 255), shadow=None):
    pad = int(fnt.size * 0.5) + stroke
    box = fnt.getbbox(text, stroke_width=stroke)
    w, h = box[2] - box[0] + pad * 2, box[3] - box[1] + pad * 2
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).text((pad - box[0], pad - box[1]), text, font=fnt,
                              fill=255, stroke_width=stroke, stroke_fill=255)
    body = Image.new("L", (w, h), 0)
    ImageDraw.Draw(body).text((pad - box[0], pad - box[1]), text, font=fnt, fill=255)
    if shadow:
        blur, off, op = shadow
        sh = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        sh.putalpha(mask)
        sh = sh.filter(ImageFilter.GaussianBlur(blur))
        sh = sh.point(lambda v: int(v * op / 255))
        tint = Image.new("RGBA", (w, h), (8, 18, 44, 0))
        tint.putalpha(sh.getchannel("A"))
        layer.alpha_composite(tint, (off[0], off[1]))
    if stroke:
        sf = tuple(stroke_fill)
        sf = sf if len(sf) == 4 else sf + (255,)
        s = Image.new("RGBA", (w, h), sf)
        s.putalpha(mask)
        layer.alpha_composite(s)
    if gradient:
        ys = np.linspace(0, 1, h)
        pos = np.linspace(0, 1, len(gradient))
        arr = np.zeros((h, w, 4), dtype=np.uint8)
        for c in range(3):
            arr[:, :, c] = np.interp(ys, pos, [g[c] for g in gradient]).astype(np.uint8)[:, None]
        arr[:, :, 3] = 255
        body_img = Image.fromarray(arr, "RGBA")
    else:
        body_img = Image.new("RGBA", (w, h), fill)
    body_img = body_img.copy()
    body_img.putalpha(body)
    layer.alpha_composite(body_img)
    bb = layer.getchannel("A").getbbox()
    if bb:
        layer = layer.crop((max(0, bb[0] - 2), max(0, bb[1] - 2),
                            min(w, bb[2] + 2), min(h, bb[3] + 2)))
    return layer


def round_rect(w, h, radius, fill, shadow=None):
    pad = shadow[0] * 3 if shadow else 0
    img = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    if shadow:
        blur, off, op = shadow
        sh = Image.new("L", img.size, 0)
        ImageDraw.Draw(sh).rounded_rectangle(
            (pad, pad, pad + w, pad + h), radius=radius, fill=op)
        sh = sh.filter(ImageFilter.GaussianBlur(blur))
        tint = Image.new("RGBA", img.size, (4, 12, 30, 0))
        tint.putalpha(sh)
        img.alpha_composite(tint, (off[0], off[1]))
    ImageDraw.Draw(img).rounded_rectangle((pad, pad, pad + w, pad + h),
                                          radius=radius, fill=fill)
    return img, pad


def paste_center(dst, src, cx, cy, scale=1.0, alpha=1.0, angle=0.0):
    if alpha <= 0.004:
        return
    im = src
    if abs(angle) > 0.05:
        im = im.rotate(angle, resample=Image.BICUBIC, expand=True)
    if abs(scale - 1) > 0.002:
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))),
                       Image.LANCZOS)
    if alpha < 0.995:
        im = im.copy()
        im.putalpha(im.getchannel("A").point(lambda v: int(v * alpha)))
    dst.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))


# ------------------------------------------------------------------ assets
def load_plate(name):
    im = Image.open(os.path.join(ART, name + ".jpg")).convert("RGB")
    im = im.resize((MS_W, MS_H), Image.LANCZOS)
    im = ImageEnhance.Color(im).enhance(1.05)
    return im


def vignette():
    y, x = np.mgrid[0:H, 0:W]
    nx, ny = (x - W / 2) / (W / 2), (y - H / 2) / (H / 2)
    r = np.sqrt(nx ** 2 + ny ** 2 * 0.7)
    a = (np.clip((r - 0.72) / 0.8, 0, 1) ** 1.5 * 120).astype(np.uint8)
    arr = np.zeros((H, W, 4), dtype=np.uint8)
    arr[:, :, 3] = a
    return Image.fromarray(arr, "RGBA")


class Reel:
    def __init__(self):
        self.plates = {}
        for s in PLAN["shots"]:
            self.plates.setdefault(s["plate"], load_plate(s["plate"]))
        self.vig = vignette()
        self.logo_full = Image.open(LOGO).convert("RGBA")

        # brand bug, top-left
        bug = self.logo_full.copy()
        bh = 58
        bug = bug.resize((int(bug.width * bh / bug.height), bh), Image.LANCZOS)
        scrim, sp = round_rect(bug.width + 34, bug.height + 26, 20,
                               (255, 255, 255, 208))
        scrim.alpha_composite(bug, (sp + 17, sp + 13))
        self.bug = scrim

        # captions
        self.cap_font = font("Baloo2-Bold.ttf", 47)
        self.chip_name = font("Baloo2-ExtraBold.ttf", 46)
        self.chip_role = font("Fredoka-SemiBold.ttf", 26)
        self.shots = []
        for s in PLAN["shots"]:
            item = dict(s)
            if s.get("caption"):
                self.shots.append(self.prepare_caption(s))
            else:
                self.shots.append(item)
        self.built = {s["id"]: self.build_shot(s) for s in self.shots}
        self.by_id = {s["id"]: s for s in self.shots}

    # ---------------------------------------------------------- captions
    def prepare_caption(self, s):
        words = s["caption"].split()
        maxw = W - 190
        lines, cur, curw = [], [], 0
        for wd in words:
            ww = self.cap_font.getlength(wd + " ")
            if curw + ww > maxw and cur:
                lines.append(cur)
                cur, curw = [], 0
            cur.append(wd)
            curw += ww
        if cur:
            lines.append(cur)

        # karaoke timing: weight by visible length, hold a little on longer words
        weights = [max(3.0, len(wd) + 1.0) for wd in words]
        total_w = sum(weights)
        dur = s["vo_dur"]
        times, acc = [], 0.0
        for wt in weights:
            times.append(s["vo_at"] + dur * acc / total_w)
            acc += wt
        idx = {wd: i for i, wd in enumerate(words)}
        return dict(s, cap_lines=lines, cap_word_at=times, cap_words=words,
                    cap_word_index=idx)

    # ---------------------------------------------------------- per shot chrome
    def build_shot(self, s):
        # speaker chip
        chip = None
        if s.get("speaker"):
            col = hexrgb(s["colour"])
            name = text_img(s["speaker"], self.chip_name, fill=(255, 255, 255, 255),
                            shadow=(8, (0, 4), 90))
            role = text_img(s["role"], self.chip_role, fill=(226, 238, 255, 240))
            iw = max(name.width, role.width)
            w = iw + 78
            h = name.height + role.height + 30
            chip, pad = round_rect(w, h, 26, tuple(col) + (238,),
                                   shadow=(16, (0, 10), 105))
            d = ImageDraw.Draw(chip)
            d.rounded_rectangle((pad, pad + 10, pad + 9, pad + h - 10), radius=5,
                                fill=(255, 255, 255, 235))
            chip.alpha_composite(name, (pad + 30, pad + 6))
            chip.alpha_composite(role, (pad + 30, pad + 6 + name.height - 4))
        # caption block background
        cap = None
        if s.get("cap_lines"):
            lh = int(self.cap_font.size * 1.32)
            bw = W - 130
            bh = lh * len(s["cap_lines"]) + 44
            cap, pad = round_rect(bw, bh, 26, (6, 20, 48, 150),
                                  shadow=(20, (0, 12), 110))
        return dict(chip=chip, cap=cap)

    # ---------------------------------------------------------- frame pieces
    def camera(self, s, t, p):
        plate = self.plates[s["plate"]]
        if s["id"] == "open":
            z = 1.00 + 0.09 * smooth(p)
            fy = 0.50 - 0.03 * p
        elif s["id"] == "end":
            z = 1.13 - 0.07 * smooth(p)
            fy = 0.46
        elif s["id"] == "together":
            z = 1.13 - 0.10 * smooth(p)
            fy = 0.47
        else:
            # punch in when the line starts, then keep creeping
            punch = ease_out(ramp(t, s["vo_at"] - 0.10, s["vo_at"] + 0.45))
            z = 1.045 + 0.055 * punch + 0.035 * smooth(p)
            fy = 0.50 - 0.015 * punch
        fx = 0.5 + 0.01 * np.sin(p * 2.4)
        cw, chh = MS_W / z, MS_H / z
        cx = clamp(fx * MS_W, cw / 2, MS_W - cw / 2)
        cy = clamp(fy * MS_H, chh / 2, MS_H - chh / 2)
        return plate.resize((W, H), Image.BICUBIC,
                            box=(cx - cw / 2, cy - chh / 2, cx + cw / 2, cy + chh / 2))

    def sparkles(self, lay, t, opacity=1.0):
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(ov)
        for i in range(22):
            ph = (t * (0.11 + 0.04 * (i % 4)) + i * 0.163) % 1.0
            x = (i * 173.3 + 46 * np.sin(t * 0.6 + i)) % W
            y = H * (1.04 - ph * 1.1)
            tw = 0.5 + 0.5 * np.sin(t * 3.0 + i * 1.1)
            r = 2.5 + 4.5 * (i % 3) / 2
            a = int(150 * tw * opacity)
            if a > 4:
                d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 253, 235, a))
                d.ellipse((x - r * .4, y - r * .4, x + r * .4, y + r * .4),
                          fill=(255, 255, 255, min(255, int(a * 1.7))))
        lay.alpha_composite(ov)

    def draw_caption(self, lay, s, t):
        lines = s.get("cap_lines")
        if not lines:
            return
        built = self.built[s["id"]]["cap"]
        a = pulse(t, s["vo_at"] - 0.25, s["vo_at"] + s["vo_dur"] + 0.55, 0.22)
        if a <= 0.004:
            return
        cap = built.copy()
        pad = (cap.width - (W - 130)) // 2
        lh = int(self.cap_font.size * 1.32)
        d = ImageDraw.Draw(cap)
        # index of the word being spoken
        active = -1
        for i, wt in enumerate(s["cap_word_at"]):
            if t >= wt:
                active = i
            else:
                break
        words = s["cap_words"]
        n = 0
        for li, line in enumerate(lines):
            widths = [self.cap_font.getlength(wd + " ") for wd in line]
            total = sum(widths) - self.cap_font.getlength(" ")
            x = pad + ((W - 130) - total) / 2
            y = pad + 20 + li * lh
            for wd, ww in zip(line, widths):
                hot = n == active
                col = (255, 214, 64, 255) if hot else (255, 255, 255, 246)
                if hot:
                    d.text((x + 2, y + 2), wd, font=self.cap_font, fill=(0, 0, 0, 90))
                d.text((x, y), wd, font=self.cap_font, fill=col)
                x += ww
                n += 1
        paste_center(lay, cap, W / 2, H - 210, 1.0, a)

    @staticmethod
    def _nth(s, i):
        return i

    # ---------------------------------------------------------- main frame
    def frame(self, t):
        idx = 0
        for i, s in enumerate(PLAN["shots"]):
            if t >= s["start"]:
                idx = i
        s = PLAN["shots"][idx]
        p = clamp((t - s["start"]) / (s["end"] - s["start"]))
        base = self.camera(s, t, p).convert("RGBA")

        if idx > 0 and t < s["start"] + XF:
            prev = PLAN["shots"][idx - 1]
            pp = clamp((t - prev["start"]) / (prev["end"] - prev["start"]))
            base = Image.blend(self.camera(prev, t, pp).convert("RGBA"), base,
                               smooth((t - s["start"]) / XF))

        lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        sid = s["id"]

        # ---- opening title
        if sid == "open":
            la = ease_out_back(ramp(t, 0.25, 0.95))
            if la > 0.004:
                logo = self.logo_full.copy()
                lw = int(560 * (0.9 + 0.1 * clamp(la)))
                logo = logo.resize((lw, int(logo.height * lw / logo.width)),
                                   Image.LANCZOS)
                paste_center(lay, logo, W / 2, 470, 1.0, clamp(la))
            ta = ease_out(ramp(t, 0.65, 1.30))
            if ta > 0.004:
                title = text_img("RESCUE TEAM", font("Baloo2-ExtraBold.ttf", 132),
                                 gradient=BRAND_GRAD, stroke=13,
                                 stroke_fill=(255, 255, 255, 255),
                                 shadow=(14, (0, 12), 110))
                paste_center(lay, title, W / 2, 700, 0.94 + 0.06 * ta, ta)
                sub = text_img("THE OFFICIAL SERIES INTRO",
                               font("Fredoka-SemiBold.ttf", 34),
                               fill=(255, 255, 255, 255), shadow=(9, (0, 5), 100))
                paste_center(lay, sub, W / 2, 812, 1.0, ta)
                prev = text_img("PREVIZ CUT  ·  VOICE + TIMING LOCKED",
                                font("Fredoka-Medium.ttf", 25),
                                fill=(226, 240, 255, 226))
                paste_center(lay, prev, W / 2, 878, 1.0, ta * 0.95)

        # ---- speaker chip
        chip = self.built[sid]["chip"]
        if chip is not None:
            ain = ease_out(ramp(t, s["vo_at"] - 0.30, s["vo_at"] + 0.12))
            aout = 1 - ramp(t, s["end"] - 0.45, s["end"] - 0.08)
            a = clamp(ain * aout)
            if a > 0.004:
                bob = 4 * np.sin(t * 2.1)
                paste_center(lay, chip, W / 2,
                             H * 0.735 + bob - (1 - ain) * 26, 1.0, a)

        # ---- karaoke captions
        cap_src = self.by_id.get(sid)
        if cap_src and cap_src.get("cap_lines"):
            self.draw_caption(lay, cap_src, t)

        # ---- endcard
        if sid == "end":
            panel = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            grad = np.zeros((H, W, 4), dtype=np.uint8)
            for y in range(H):
                d = abs(y - H * 0.44) / (H * 0.5)
                grad[y, :, :] = (5, 20, 52, int(224 * clamp(1 - d) ** 0.85))
            panel.alpha_composite(Image.fromarray(grad, "RGBA"))
            lay.alpha_composite(panel)

            la = ease_out_back(ramp(t, s["start"] + 0.25, s["start"] + 0.9))
            if la > 0.004:
                logo = self.logo_full.copy()
                lw = int(760 * (0.92 + 0.08 * clamp(la)))
                logo = logo.resize((lw, int(logo.height * lw / logo.width)),
                                   Image.LANCZOS)
                card, pad = round_rect(logo.width + 90, logo.height + 60, 34,
                                       (255, 255, 255, 244), shadow=(26, (0, 20), 120))
                card.alpha_composite(logo, (pad + 45, pad + 30))
                paste_center(lay, card, W / 2, H * 0.34, 1.0, clamp(la))
            ta = ease_out(ramp(t, s["start"] + 0.85, s["start"] + 1.55))
            if ta > 0.004:
                title = text_img("RESCUE TEAM", font("Baloo2-ExtraBold.ttf", 120),
                                 gradient=BRAND_GRAD, stroke=12,
                                 stroke_fill=(255, 255, 255, 255),
                                 shadow=(13, (0, 11), 110))
                paste_center(lay, title, W / 2, H * 0.47, 0.94 + 0.06 * ta, ta)
                tag = text_img("Learn. Understand. Grow.",
                               font("Fredoka-SemiBold.ttf", 52),
                               fill=(255, 255, 255, 255), shadow=(10, (0, 6), 110))
                paste_center(lay, tag, W / 2, H * 0.53, 1.0, ease_out(
                    ramp(t, s["start"] + 1.35, s["start"] + 2.0)))
                cta = text_img("New episodes every week",
                               font("Fredoka-Medium.ttf", 32),
                               fill=(205, 228, 255, 235))
                paste_center(lay, cta, W / 2, H * 0.585, 1.0, ease_out(
                    ramp(t, s["start"] + 1.9, s["start"] + 2.5)))

        self.sparkles(lay, t, 0.85)
        base.alpha_composite(lay)

        # cuts flash
        if idx > 0 and sid != "end":
            ft = (t - s["start"]) / 0.30
            if 0 <= ft < 1:
                base.alpha_composite(Image.new("RGBA", (W, H),
                                               (255, 255, 255, int(70 * (1 - ft) ** 2))))

        base.alpha_composite(self.bug, (46, 52))
        base.alpha_composite(self.vig)

        # tiny brand strip at the very bottom edge
        strip = Image.new("RGBA", (W, 8), (0, 0, 0, 0))
        cols = [(232, 50, 45), (20, 115, 230), (245, 168, 0), (63, 165, 53)]
        d = ImageDraw.Draw(strip)
        for i, c in enumerate(cols):
            d.rectangle((i * W / 4, 0, (i + 1) * W / 4, 8), fill=c + (235,))
        base.alpha_composite(strip, (0, H - 8))

        # global fades
        f = 1.0
        if t < 0.5:
            f = smooth(t / 0.5)
        if t > TOTAL - 0.85:
            f = 1 - smooth((t - (TOTAL - 0.85)) / 0.85)
        if f < 0.999:
            base.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0,
                                                            int(255 * (1 - f)))))
        return base.convert("RGB")


def main():
    import imageio_ffmpeg
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    reel = Reel()

    if "--stills" in sys.argv:
        times = [float(x) for x in sys.argv[sys.argv.index("--stills") + 1].split(",")]
        os.makedirs(os.path.join(HERE, "stills"), exist_ok=True)
        for t in times:
            reel.frame(t).save(os.path.join(HERE, "stills", f"s_{t:05.2f}.png"))
            print("still", t)
        return

    n = int(TOTAL * FPS)
    cmd = [ff, "-y", "-loglevel", "error",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
           "-i", "-", "-i", AUDIO,
           "-c:v", "libx264", "-preset", "medium", "-crf", "20",
           "-pix_fmt", "yuv420p", "-profile:v", "high",
           "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
           "-shortest", "-movflags", "+faststart", OUT]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(n):
        proc.stdin.write(reel.frame(i / FPS).tobytes())
        if i % 150 == 0:
            print(f"  frame {i}/{n}", flush=True)
    proc.stdin.close()
    proc.wait()
    print("wrote", os.path.abspath(OUT), round(os.path.getsize(OUT) / 1e6, 1), "MB")


if __name__ == "__main__":
    main()

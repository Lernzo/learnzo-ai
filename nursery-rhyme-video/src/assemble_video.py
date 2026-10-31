#!/usr/bin/env python3
"""Assemble the Learnzo 'Wheels on the Bus' animatic music video.

Pipeline:
  1. Normalize scene stills to 1920x1080 and derive rainbow variants (PIL).
  2. Render one Ken-Burns (zoompan) segment per shot with ffmpeg.
  3. Concatenate segments.
  4. Composite the official Learnzo logo bottom-right for the whole video,
     mix the original music bed with the vocal clips, export H.264/AAC MP4.

Usage:  python3 src/assemble_video.py
"""
import os
import subprocess
import sys

import imageio_ffmpeg
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MEDIA = os.path.join(ROOT, "media")
SCENES = os.path.join(MEDIA, "scenes")
AUDIO = os.path.join(MEDIA, "audio")
OUT = os.path.join(ROOT, "output")
WORK = os.path.join(MEDIA, "work")
FF = imageio_ffmpeg.get_ffmpeg_exe()

W, H, FPS = 1920, 1080, 30
TOTAL = 345.0

os.makedirs(SCENES, exist_ok=True)
os.makedirs(AUDIO, exist_ok=True)
os.makedirs(OUT, exist_ok=True)
os.makedirs(WORK, exist_ok=True)


def run(cmd):
    print("+", " ".join(cmd)[:160])
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-2000:])
        sys.exit(1)


# ---------------------------------------------------------------- 1. stills
def normalize(src, dst):
    im = Image.open(src).convert("RGB")
    im = im.resize((W, int(W * im.height / im.width)), Image.LANCZOS)
    if im.height < H:  # pad
        bg = Image.new("RGB", (W, H), (135, 206, 250))
        bg.paste(im, (0, (H - im.height) // 2))
        im = bg
    else:
        im = im.crop((0, (im.height - H) // 2, W, (im.height - H) // 2 + H))
    im.save(dst)


for f in sorted(os.listdir(SCENES)):
    if f.startswith("s") and f.endswith(".png"):
        normalize(os.path.join(SCENES, f), os.path.join(WORK, "n_" + f))


def rainbow_variant(src, dst, cx_frac, cy_frac, r0, width, alpha):
    im = Image.open(src).convert("RGBA")
    ov = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    cx, cy = im.width * cx_frac, im.height * cy_frac
    colors = [(255, 0, 0), (255, 127, 0), (255, 220, 0), (60, 190, 60),
              (40, 120, 255), (130, 60, 200)]
    for i, c in enumerate(colors):
        r = r0 - i * width
        d.arc([cx - r, cy - r, cx + r, cy + r], start=180, end=360,
              fill=c + (alpha,), width=width)
    im = Image.alpha_composite(im, ov).convert("RGB")
    im.save(dst)


rainbow_variant(os.path.join(WORK, "n_s01a.png"), os.path.join(WORK, "n_s10a.png"),
                0.30, 0.98, int(W * 0.62), 26, 235)
rainbow_variant(os.path.join(WORK, "n_s01a.png"), os.path.join(WORK, "n_s10b.png"),
                0.72, 1.02, int(W * 0.55), 22, 235)

# ---------------------------------------------------------------- 2. shots
# (start_s, dur_s, image, mode, pan_x, pan_y)
SHOTS = [
    (0,   15, "n_s01a.png", "in",  25,  10),
    (15,  15, "n_s01b.png", "out", -25, 8),
    (30,  22, "n_s02a.png", "in",  -30, 0),
    (52,  18, "n_s02b.png", "out", 30,  12),
    (70,  18, "n_s03a.png", "in",  0,  -20),
    (88,  15, "n_s03b.png", "out", 0,  20),
    (103, 15, "n_s04a.png", "in",  -28, 0),
    (118, 15, "n_s04b.png", "out", 28,  0),
    (133, 20, "n_s05a.png", "in",  20,  10),
    (153, 15, "n_s05b.png", "out", -20, -8),
    (168, 20, "n_s05b.png", "in",  24,  12),   # people up and down (alt crop)
    (188, 35, "n_s04a.png", "out", 0,  18),   # babies wah wah (funny faces)
    (223, 23, "n_s05b.png", "out", -24, -12), # parents shh shh (alt crop)
    (246, 23, "n_s04a.png", "in",  26, -6),   # animal friends join
    (269, 15, "n_s10a.png", "in",  0,  -14),  # magical rainbow road
    (284, 15, "n_s10b.png", "out", 0,  14),
    (299, 23, "n_s01b.png", "in",  -22, 8),   # grand finale
    (322, 23, "n_s02b.png", "out", 26,  -10), # everyone singing
]

segs = []
for i, (start, dur, img, mode, px, py) in enumerate(SHOTS):
    frames = int(dur * FPS)
    if mode == "in":
        z = f"min(1+0.30*on/{frames},1.25)"
    else:
        z = f"max(1.25-0.30*on/{frames},1.0)"
    vf = (f"scale=2400:1350:flags=lanczos,"
          f"zoompan=z='{z}':x='iw/2-(iw/zoom/2)+{px}*sin(on/40)':"
          f"y='ih/2-(ih/zoom/2)+{py}*sin(on/55)':d=1:s={W}x{H}:fps={FPS},"
          f"format=yuv420p")
    seg = os.path.join(WORK, f"seg_{i:02d}.mp4")
    run([FF, "-y", "-loop", "1", "-framerate", str(FPS),
         "-i", os.path.join(WORK, img),
         "-vf", vf, "-t", str(dur),
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-an", seg])
    segs.append(seg)

with open(os.path.join(WORK, "concat.txt"), "w") as f:
    for s in segs:
        f.write(f"file '{s}'\n")

video_only = os.path.join(WORK, "video_only.mp4")
run([FF, "-y", "-f", "concat", "-safe", "0", "-i", os.path.join(WORK, "concat.txt"),
     "-c", "copy", video_only])

# ---------------------------------------------------------------- 3. vocals
# v6 (babies) is 102 s raw; speed it up 3x so it fits its 35 s scene.
v6_fast = os.path.join(WORK, "v6_fast.wav")
run([FF, "-y", "-i", os.path.join(AUDIO, "v6_babies.mp3"),
     "-filter:a", "atempo=3.0", "-ar", "44100", v6_fast])

VOCALS = [  # (file, start_seconds)
    ("intro.mp3", 2.0),
    ("v1_wheels.mp3", 31.0),
    ("v2_wipers.mp3", 71.0),
    ("v3_horn.mp3", 104.0),
    ("v4_doors.mp3", 134.0),
    ("v5_people.mp3", 169.0),
    (v6_fast, 189.0),
    ("v7_parents.mp3", 224.0),
    ("v8_animals.mp3", 247.0),
    ("v9_finale.mp3", 300.0),
    ("v9_finale.mp3", 323.0),
]

# ---------------------------------------------------------------- 4. final
logo = os.path.join(MEDIA, "learnzo-logo.png")
logo_w = 340
logo_h = int(logo_w * Image.open(logo).height / Image.open(logo).width)

inputs = [FF, "-y", "-i", video_only, "-i", logo, "-i", os.path.join(AUDIO, "music.wav")]
for vf_, _ in VOCALS:
    src = vf_ if os.path.isabs(vf_) else os.path.join(AUDIO, vf_)
    inputs += ["-i", src]

fc = []
n_in = 3
fc.append(f"[1:v]scale={logo_w}:{logo_h}:flags=lanczos[lg]")
fc.append(f"[0:v][lg]overlay=W-w-28:H-h-28:format=auto[vout]")
fc.append(f"[2:a]volume=0.85[music]")
for i, (_, start) in enumerate(VOCALS):
    ms = int(start * 1000)
    fc.append(f"[{n_in + i}:a]adelay={ms}|{ms},volume=1.0[a{i}]")
amix_in = "[music]" + "".join(f"[a{i}]" for i in range(len(VOCALS)))
fc.append(f"{amix_in}amix=inputs={len(VOCALS) + 1}:normalize=0,"
          f"volume=0.9,alimiter=limit=0.95,afade=t=out:st={TOTAL - 4}:d=4[aout]")
fc.append(f"[vout]fade=t=in:st=0:d=1,fade=t=out:st={TOTAL - 3}:d=3[vv]")

final = os.path.join(OUT, "Wheels-on-the-Bus-Learnzo-1080p.mp4")
run(inputs + ["-filter_complex", ";".join(fc),
              "-map", "[vv]", "-map", "[aout]",
              "-c:v", "libx264", "-preset", "medium", "-crf", "19",
              "-pix_fmt", "yuv420p", "-r", str(FPS),
              "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
              "-movflags", "+faststart", "-t", str(TOTAL), final])
print("DONE:", final)

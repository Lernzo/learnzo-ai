#!/usr/bin/env python3
"""Remove baked-in text (e.g. 'SCHOOL BUS', bus numbers) from scene stills by
blurring those regions, then re-render only the affected segments and re-run
concat + final mux. Produces the same output MP4 as assemble_video.py."""
import os
import subprocess
import sys

import imageio_ffmpeg
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MEDIA = os.path.join(ROOT, "media")
SCENES = os.path.join(MEDIA, "scenes")
AUDIO = os.path.join(MEDIA, "audio")
OUT = os.path.join(ROOT, "output")
WORK = os.path.join(MEDIA, "work")
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1920, 1080, 30
TOTAL = 345.0

# text regions to blur, in original 1376x768 coordinates: file -> [boxes]
PATCHES = {
    "s02a.png": [(862, 0, 918, 36)],            # "22" on side
    "s02b.png": [(603, 452, 652, 502)],         # "73" on door
    "s03a.png": [(605, 95, 900, 172)],          # "SCHOOL BUS" front panel
    "s05a.png": [(960, 100, 1170, 172),          # "SCHOOL BUS" front panel
                (798, 140, 845, 192),           # "24" by door
                (842, 362, 892, 412)],          # "24" on fender
    "s05b.png": [(342, 100, 435, 146)],         # "BENNY" on door glass
}

for fname, boxes in PATCHES.items():
    p = os.path.join(SCENES, fname)
    im = Image.open(p).convert("RGB")
    for b in boxes:
        crop = im.crop(b).filter(ImageFilter.GaussianBlur(10))
        im.paste(crop, b)
    im.save(p)
    print("patched", fname)


def run(cmd):
    print("+", " ".join(cmd)[:120])
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-2000:])
        sys.exit(1)


def normalize(src, dst):
    im = Image.open(src).convert("RGB")
    im = im.resize((W, int(W * im.height / im.width)), Image.LANCZOS)
    if im.height < H:
        bg = Image.new("RGB", (W, H), (135, 206, 250))
        bg.paste(im, (0, (H - im.height) // 2))
        im = bg
    else:
        im = im.crop((0, (im.height - H) // 2, W, (im.height - H) // 2 + H))
    im.save(dst)


for f in ["s02a.png", "s02b.png", "s03a.png", "s05a.png", "s05b.png"]:
    normalize(os.path.join(SCENES, f), os.path.join(WORK, "n_" + f))

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
    (168, 20, "n_s05b.png", "in",  24,  12),
    (188, 35, "n_s04a.png", "out", 0,  18),
    (223, 23, "n_s05b.png", "out", -24, -12),
    (246, 23, "n_s04a.png", "in",  26, -6),
    (269, 15, "n_s10a.png", "in",  0,  -14),
    (284, 15, "n_s10b.png", "out", 0,  14),
    (299, 23, "n_s01b.png", "in",  -22, 8),
    (322, 23, "n_s02b.png", "out", 26,  -10),
]
AFFECTED = {2, 3, 4, 8, 9, 10, 12, 17}

segs = []
for i, (start, dur, img, mode, px, py) in enumerate(SHOTS):
    seg = os.path.join(WORK, f"seg_{i:02d}.mp4")
    if i not in AFFECTED and os.path.exists(seg):
        segs.append(seg)
        continue
    frames = int(dur * FPS)
    z = (f"min(1+0.30*on/{frames},1.25)" if mode == "in"
         else f"max(1.25-0.30*on/{frames},1.0)")
    vf = (f"scale=2400:1350:flags=lanczos,"
          f"zoompan=z='{z}':x='iw/2-(iw/zoom/2)+{px}*sin(on/40)':"
          f"y='ih/2-(ih/zoom/2)+{py}*sin(on/55)':d=1:s={W}x{H}:fps={FPS},"
          f"format=yuv420p")
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

v6_fast = os.path.join(WORK, "v6_fast.wav")
if not os.path.exists(v6_fast):
    run([FF, "-y", "-i", os.path.join(AUDIO, "v6_babies.mp3"),
         "-filter:a", "atempo=3.0", "-ar", "44100", v6_fast])

VOCALS = [("intro.mp3", 2.0), ("v1_wheels.mp3", 31.0), ("v2_wipers.mp3", 71.0),
          ("v3_horn.mp3", 104.0), ("v4_doors.mp3", 134.0), ("v5_people.mp3", 169.0),
          (v6_fast, 189.0), ("v7_parents.mp3", 224.0), ("v8_animals.mp3", 247.0),
          ("v9_finale.mp3", 300.0), ("v9_finale.mp3", 323.0)]

logo = os.path.join(MEDIA, "learnzo-logo.png")
li = Image.open(logo)
logo_w = 340
logo_h = int(logo_w * li.height / li.width)

inputs = [FF, "-y", "-i", video_only, "-i", logo, "-i", os.path.join(AUDIO, "music.wav")]
for vf_, _ in VOCALS:
    src = vf_ if os.path.isabs(vf_) else os.path.join(AUDIO, vf_)
    inputs += ["-i", src]

fc = [f"[1:v]scale={logo_w}:{logo_h}:flags=lanczos[lg]",
      "[0:v][lg]overlay=W-w-28:H-h-28:format=auto[vout]",
      "[2:a]volume=0.85[music]"]
n_in = 3
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

#!/usr/bin/env python3
"""Encode the rendered 3D frames into the final animated video:
1920x1080 24fps H.264 + AAC, Learnzo logo bottom-right, English audio
(verse 1 of the Wheels-on-the-Bus song). -> downloads/ + output/
"""
import os
import subprocess
import sys

import imageio_ffmpeg
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FRAMES = os.path.join(ROOT, "media", "work3d", "frames")
FF = imageio_ffmpeg.get_ffmpeg_exe()
FPS = 24
DUR = 8.0

logo = os.path.join(ROOT, "media", "learnzo-logo.png")
li = Image.open(logo)
lw = 340
lh = int(lw * li.height / li.width)

song = os.path.join(ROOT, "output", "Wheels-on-the-Bus-song.wav")
video_tmp = os.path.join(ROOT, "media", "work3d", "video_nologo.mp4")
final_dl = os.path.join(ROOT, "..", "downloads", "Wheels-on-the-Bus-3D-animated-8s.mp4")
final_out = os.path.join(ROOT, "output", "Wheels-on-the-Bus-3D-animated-8s.mp4")


def run(cmd):
    print("+", " ".join(cmd)[:140])
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-1500:])
        sys.exit(1)


# 1) frames -> 1080p video (no logo yet)
run([FF, "-y", "-framerate", str(FPS), "-i", os.path.join(FRAMES, "f%04d.png"),
     "-vf", "scale=1920:1080:flags=lanczos,format=yuv420p,setsar=1",
     "-c:v", "libx264", "-preset", "medium", "-crf", "19",
     "-t", str(DUR), "-an", video_tmp])

# 2) logo overlay + audio (verse 1 of the song, English vocals) + fades
run([FF, "-y", "-i", video_tmp, "-i", logo, "-ss", "14.545", "-t", str(DUR), "-i", song,
     "-filter_complex",
     f"[1:v]scale={lw}:{lh}:flags=lanczos[lg];"
     f"[0:v][lg]overlay=W-w-28:H-h-28:format=auto,fade=t=in:st=0:d=0.3,fade=t=out:st={DUR-0.8}:d=0.8[v];"
     f"[2:a]afade=t=in:st=0:d=0.3,afade=t=out:st={DUR-1.2}:d=1.2,alimiter=limit=0.95[a]",
     "-map", "[v]", "-map", "[a]",
     "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
     "-r", str(FPS), "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
     "-movflags", "+faststart", final_out])

run(["cp", final_out, final_dl])
print("DONE:", os.path.abspath(final_out), "and", os.path.abspath(final_dl))

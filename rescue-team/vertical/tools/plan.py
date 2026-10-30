#!/usr/bin/env python3
"""Builds the vertical cut plan (scene timings, subtitle cues, mouth anchors).

Voice durations are measured, so every scene is exactly long enough for its
line. Writes plan.json, which both the mixer and the renderer read.
"""
import json
import os
import subprocess

import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
VO = os.path.join(ROOT, "vo")

LEAD, TAIL = 0.55, 0.45


def duration(path):
    out = subprocess.run([FF, "-i", path], capture_output=True, text=True).stderr
    for line in out.splitlines():
        if "Duration:" in line:
            hms = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = hms.split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    raise RuntimeError("no duration for " + path)


# ------------------------------------------------------------------ the script
# one entry per shot: art plate, who speaks, caption text, mouth hit point
# (mouth_x, mouth_y) are normalised coords in the 9:16 frame.
SHOTS = [
    dict(id="open", plate="v_town", speaker=None, vo=None,
         title="LEARNZO RESCUE TEAM", sub="THE OFFICIAL SERIES INTRO",
         dur=3.4),
    dict(id="captain", plate="v_captain", speaker="CAPTAIN RAINBOW",
         role="Team Leader", colour="#8C46C9", vo="captain.mp3",
         caption="Hello, little heroes! Welcome to Leanzo Rescue Team! "
                 "Let's go on some amazing adventures!",
         mouth=(0.47, 0.385)),
    dict(id="ruby", plate="v_ruby", speaker="RUBY", role="Red Fire Truck",
         colour="#E8322D", vo="ruby.mp3",
         caption="Hi, friends! I'm Ruby, the RED fire truck! "
                 "I love helping everyone!",
         mouth=(0.50, 0.632)),
    dict(id="blue", plate="v_blue", speaker="OFFICER BLUE", role="Blue Police Car",
         colour="#1473E6", vo="blue.mp3",
         caption="Hello! I'm Officer Blue, the BLUE police car! "
                 "I'm always ready to help!",
         mouth=(0.47, 0.607)),
    dict(id="sunny", plate="v_sunny", speaker="SUNNY", role="Yellow Ambulance",
         colour="#F5A800", vo="sunny.mp3",
         caption="Hi there! I'm Sunny, the YELLOW ambulance! "
                 "I love caring for my friends!",
         mouth=(0.44, 0.640)),
    dict(id="greenie", plate="v_greenie", speaker="GREENIE", role="Green Rescue Jeep",
         colour="#3FA535", vo="greenie.mp3",
         caption="Hey, everyone! I'm Greenie, the GREEN rescue jeep! "
                 "Let's explore together!",
         mouth=(0.55, 0.645)),
    dict(id="together", plate="v_group", speaker="ALL TOGETHER",
         role="Leanzo Rescue Team", colour="#16B8B0",
         vo="chorus_a.mp3", chorus=["chorus_b.mp3", "chorus_c.mp3"],
         caption="Let's learn, laugh and rescue together!",
         mouth=(0.47, 0.372)),
    dict(id="end", plate="v_group", speaker=None, vo=None,
         title="LEARNZO", sub="Learn. Understand. Grow.", endcard=True,
         dur=4.6),
]

PAD_AFTER_CHORUS = 0.35


def main():
    plan, t = [], 0.0
    for shot in SHOTS:
        s = dict(shot)
        if shot.get("vo"):
            vp = os.path.join(VO, shot["vo"])
            vd = duration(vp)
            s["vo_dur"] = round(vd, 3)
            s["vo_at"] = round(t + LEAD, 3)
            shot_len = LEAD + vd + TAIL + (PAD_AFTER_CHORUS if shot.get("chorus") else 0)
            if shot.get("chorus"):
                s["chorus_dur"] = [round(duration(os.path.join(VO, c)), 3)
                                   for c in shot["chorus"]]
        else:
            shot_len = shot["dur"]
        s["start"] = round(t, 3)
        s["end"] = round(t + shot_len, 3)
        t += shot_len
        plan.append(s)

    out = dict(duration=round(t, 3), shots=plan, fade_out=1.1, xfade=0.42)
    path = os.path.join(ROOT, "plan.json")
    with open(path, "w") as f:
        json.dump(out, f, indent=2)
    print(f"total {t:.2f}s -> {path}")
    for s in plan:
        print(f"  {s['id']:9s} {s['start']:6.2f}-{s['end']:6.2f}  "
              f"vo@{s.get('vo_at', '-')}")


if __name__ == "__main__":
    main()

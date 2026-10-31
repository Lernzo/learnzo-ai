# Wheels on the Bus — Learnzo 3D Nursery Rhyme Video

Production package for **"Wheels on the Bus | Learnzo 3D Nursery Rhymes & Kids Songs"** —
a ~5:45, 1920×1080 (16:9, 30 fps) animated nursery-rhyme music video for preschoolers (2–6).

## Deliverable

- `output/Wheels-on-the-Bus-Learnzo-1080p.mp4` — final video (H.264 + AAC, faststart).
  - 12 scenes / 18 shots, Ken-Burns cinematic camera motion over 3D-style scene art.
  - Original synthesized music bed (`media/audio/music.wav`) — no copyrighted recordings.
  - English vocal clips (`media/audio/*.mp3`) timed to each verse; the bed ducks under vocals.
  - Official Learnzo logo composited **bottom-right for the entire video**, unaltered
    (`media/learnzo-logo.png`, sourced from the attached reference).
  - No on-screen text, no subtitles, no other watermarks.

## Contents

| Path | Purpose |
|---|---|
| `STORYBOARD.md` | Full scene-by-scene storyboard, timings, character designs, lyrics |
| `src/make_music.py` | Original cheerful music-bed synthesizer (numpy → WAV, 100 BPM, 345 s) |
| `src/assemble_video.py` | Still normalization, rainbow scene variants, per-shot `zoompan` segments, concat, logo composite, audio mix, MP4 export |
| `media/scenes/` | Generated 3D-style scene stills (source art for the shots) |
| `media/audio/` | Vocal clips + synthesized music bed |
| `media/work/` | Intermediate render files (gitignored) |
| `output/` | Final MP4 (gitignored — binary artifact) |

## Rebuild

```bash
pip install pillow numpy imageio-ffmpeg   # ffmpeg binary comes from imageio-ffmpeg
python3 nursery-rhyme-video/src/make_music.py
python3 nursery-rhyme-video/src/assemble_video.py
```

## Scene → lyric map (timings in the final video)

| Time | Scene | Vocal |
|---|---|---|
| 0:00 | Magical morning, Benny appears | intro greeting |
| 0:30 | Wheels go round and round | verse 1 |
| 1:10 | Wipers swish swish swish (rain) | verse 2 |
| 1:43 | Horn beep beep beep | verse 3 |
| 2:13 | Doors open and shut, kids board | verse 4 |
| 2:48 | People go up and down | verse 5 |
| 3:08 | Babies go wah wah wah | verse 6 (sped up ×3) |
| 3:43 | Parents go shh shh shh | verse 7 |
| 4:06 | Animal friends join, wheels verse | verse 8 |
| 4:29 | Magical rainbow road | instrumental |
| 4:59 | Grand musical finale | chorus ×2 |
| 5:22 | Everyone singing, happy goodbye | chorus |

Note: this package renders a cinematic **animatic** (motion over scene art). For a fully
animated 3D render, feed `STORYBOARD.md` + `media/scenes/` to a 3D/animation pipeline;
the timing map, music bed, vocal track and logo composite carry over unchanged.

## Fully-animated 3D scene (Blender/bpy)
- `src/build_3d_scene.py` — builds the real 3D scene (Benny + riders, road, scrolling
  background, butterflies, clouds) and renders 192 frames with Cycles CPU
  (`pip install bpy`; on headless Linux stub the X/GL libs or set LD_LIBRARY_PATH).
  All characters are animated: spinning wheels, bouncing suspension, blinking eyes,
  waving arms, wiggling bunny ears, swaying trees/flowers, drifting clouds.
- `src/encode_3d.py` — frames → 1920×1080 H.264 + logo bottom-right + English song audio.
- Output: `output/Wheels-on-the-Bus-3D-animated-8s.mp4` (+ `downloads/` copy).

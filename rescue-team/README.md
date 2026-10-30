# LEARNZO RESCUE TEAM — Official Series Introduction

60-second animated series intro, produced from the supplied script and the official
Learnzo logo.

| File | What it is |
|---|---|
| `LEARNZO_RESCUE_TEAM_INTRO.mp4` | **The deliverable.** 1920×1080, 30 fps, H.264 + AAC, exactly 60.00 s, full voice cast + original music. |
| `poster.jpg` | 1080p brand end-card still (handy as a thumbnail). |
| `contact-sheet.jpg` | 8-frame overview of the finished video. |
| `scenes/` | 7 illustrated key-art plates, 1376×768 (used as the camera plates). |
| `audio/vo/` | The 10 recorded voice lines, one file per character beat. |
| `audio/music/music_bed.wav` | 60 s original instrumental bed (synthesised, royalty-free). |
| `audio/master.wav` | Final mixed/normalised audio master (the MP4 carries this as AAC). |
| `TOOLS` below | Full, re-runnable pipeline — change a line of dialogue, a colour or a
timing and rebuild the whole film. |

## How it was made

The world, the characters and the brand framing are **illustrated key art driven by a
real motion pipeline**, not static slides:

- **Camera** — every scene has its own Ken-Burns move (push-in, pull-back, pan, crane)
  timed to the scene length, with a 0.7 s cross-fade plus a soft white cut flash.
- **Branding** — the Learnzo logo sits in a persistent top banner on every scene
  (logo lockup left, series lockup right, rainbow hairline), and a lower third carries
  the running scene label. The 55–60 s ending promotes the full logo lockup, the
  "RESCUE TEAM" wordmark and the tagline *Learn. Understand. Grow.*
- **Typography** — kinetic name tags (colour-coded per character), sequential learning
  chips in scene 4, the "LET'S GO!" slam in scene 5, drifting sparkle dust.
- **Sound** — 6 distinct voices (narrator, Captain Rainbow, Ruby, Officer Blue, Sunny,
  Greenie), an original C-major ukulele/marimba kids-pop bed at 124 BPM, and
  auto-ducking so every line sits clear of the music (−8.4 dB duck under speech).

## Timeline

| Time | Scene | Picture | Sound |
|---|---|---|---|
| 0.0–9.3 | 1 · The magical world | town, rainbow, title card "RESCUE TEAM" | Narrator: *Welcome to a magical world… Welcome to… the Learnzo Rescue Team!* |
| 9.3–16.4 | 2 · Captain Rainbow | Captain lands + waves, name tag | Captain: *Hello, little heroes…* |
| 16.4–25.4 | 3a · Ruby & Officer Blue | fire truck + police car drive in | Ruby, then Officer Blue |
| 25.4–35.0 | 3b · Sunny & Greenie | ambulance + jeep arrive | Sunny, then Greenie |
| 35.0–43.8 | 4 · What will we learn? | dancing vehicles, number/shape confetti | Captain + chips: COLOURS · SONGS · NUMBERS · NEW THINGS · HELPING FRIENDS |
| 43.8–51.2 | 5 · The adventure begins | kitten in the tree, "MRRROW?" | Ruby: *Did you hear that?* / Captain: *Come on, team!* / All: *Let's go!* |
| 51.2–60.0 | 6 · Learnzo brand ending | team + rainbow, full logo lockup | Narrator brand sting + music resolve |

## Cast

| Role | Voice character |
|---|---|
| Narrator | warm, excited children's storyteller |
| Captain Rainbow | bright, encouraging team leader |
| Ruby | playful, energetic fire truck |
| Officer Blue | steady, dependable police car |
| Sunny | gentle, caring ambulance |
| Greenie | adventurous, curious jeep |

## Rebuilding

```bash
cd rescue-team/tools
python3 make_music.py     # original instrumental bed      -> audio/music/music_bed.wav
python3 mix_audio.py      # voices + ducking + master      -> audio/master.wav
python3 render.py         # 1800 frames + mux              -> LEARNZO_RESCUE_TEAM_INTRO.mp4
python3 render.py --stills 12,38,56   # spot-check single frames
```

Requirements: Python 3, Pillow, numpy, imageio-ffmpeg (`pip install pillow numpy imageio-ffmpeg`).
`timeline.py` is the single source of truth for scene timings, voice placement,
name tags and learning words — picture and sound read from it, so they can't drift.

Fonts (SIL Open Font Licence): Baloo 2 (Ek Type) and Fredoka (Milena Brandão),
subset to Latin and stored in `tools/fonts/`.

## Notes / honest limits

- This is an **animatic-grade** film: the artwork is illustrated stills moved by a
  camera-and-graphics compositor. True 3D character animation (lip-sync, wheels
  turning, the vehicles physically driving in) still needs a 3D studio — this cut is
  built to be the locked picture-locked script, timing sheet and scratch-track that
  such a studio would take over.
- The music is generated from code, so it is 100% original and free of licensing
  claims — but it is a bed, not a bespoke score. Swap in a real recording any time by
  replacing `audio/music/music_bed.wav` and re-running `mix_audio.py`.
- Character dialogue uses the script verbatim; the ending uses the brand sting
  "Learnzo Rescue Team!" (same narrator voice) so the name lands with the logo.

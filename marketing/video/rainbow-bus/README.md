# The Magic Rainbow Bus — Episode 1, opening shot

A short 3D-animated-style children's opening for Learnzo, built entirely from
code in this folder: original characters, original score, original narration.

**Watch:** `output/rainbow-bus-opening.mp4`
1920x1080 (16:9) · 24 fps · 17.4 s · H.264 + AAC · English narration ·
burned-in English captions.

Character reference sheet: `output/cast-sheet.png`

---

## The shot, beat by beat

| Time | What happens |
|---|---|
| 0.0 – 5.2 s | Wide establishing shot — meadow, sun, green hills, sparkling stream. Camera eases in on Sunny, Pip and Milo at the water's edge. |
| 5.2 – 8.6 s | Three-shot. Pip's ears twitch, Milo's tail wags, flowers sway, sunlight glints on the water. |
| 8.6 – 13.4 s | Slow push toward Sunny's face as he looks across the stream. The rainbow bridge is gone — only broken stone stumps on each bank, and the six bands on his badge have turned grey. Worried expression. |
| 13.4 – 17.4 s | Sunny turns back to camera with his brave face, then a warm smile — determined to begin the adventure. A soft magic sparkle sweeps the frame as his badge bands glow back to colour. |

## Narration (captions match word for word)

> “Hello, little explorers! Meet Sunny, the little rainbow bus. One beautiful
> morning, Sunny and his friends discovered that their magical rainbow bridge
> was missing!”

Warm female English narrator; captions split across four cards timed to the
voice.

## Sound

* Original music-box lullaby in C major (C–Am–F–G), marimba bass and soft
  shaker, auto-ducked under the narration.
* Gentle stream ambience with water droplets.
* Distant birdsong in the opening beats.
* A rising bell sparkle for the closing "determined" beat.

## Cast

| Character | Design |
|---|---|
| **Sunny** | Golden-yellow little school bus, big blue eyes, smiling chrome bumper, turquoise roof light, black tyres, circular six-band rainbow badge that greys out when the bridge is missing and relights at the end. |
| **Pip** | Little white rabbit, pink inner ears, mint-green backpack. |
| **Milo** | Caramel puppy, floppy ears, sky-blue bandana. |
| **Pogo** | Bright-green frog with a tiny leaf cap. |
| **Ducky** | Fluffy yellow duckling, orange beak, aqua scarf. |
| **Bea** | Small purple butterfly, lavender wings with white dots. |

Pogo, Ducky and Bea are fully modelled and rigged (`output/cast-sheet.png`)
and are written into the following shots; this opening follows the brief and
stars Sunny, Pip and Milo.

## Rebuild

```bash
python3 -m venv /tmp/vid
/tmp/vid/bin/pip install pillow numpy imageio-ffmpeg
/tmp/vid/bin/python pipeline/audio.py     # soundtrack -> assets/mix.wav
/tmp/vid/bin/python pipeline/render.py    # frames -> output/rainbow-bus-opening.mp4
/tmp/vid/bin/python pipeline/castsheet.py # character reference sheet
```

## Source map

```
pipeline/lib.py          drawing toolkit: gradients, feathered shapes, alpha-safe canvas
pipeline/characters.py   parametric rigs for all six characters (blink, ears, tail, moods)
pipeline/world.py        the meadow plate: sky, hills, stream, flowers, broken bridge
pipeline/film.py         camera path, live environment, captions, timeline
pipeline/audio.py        music, ambience and narration mix (numpy synthesis)
pipeline/render.py       multiprocessing frame renderer piped into ffmpeg
pipeline/castsheet.py    cast reference sheet
```

Fonts: Fredoka and Nunito (SIL Open Font License), subset files in `assets/fonts`.

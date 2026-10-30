# LEARNZO RESCUE TEAM — 9:16 vertical previz cut + 3D production package

## What this folder is

| File | What it is |
|---|---|
| `../LEARNZO_RESCUE_TEAM_REEL_9x16.mp4` | 1080×1920, 30 fps, 41.6 s — every line of your new dialogue, five distinct character voices, karaoke captions, brand bug, logo open + end card. |
| `art/v_*.jpg` | 7 vertical key-art plates at 3D-render grade (town, Captain Rainbow, Ruby, Officer Blue, Sunny, Greenie, group). These are the *first frames* for a video model. |
| `vo/*.mp3` | Final voice performances, one file per character + 3 stacked chorus takes. |
| `audio/master.wav` | Mixed audio master (voices + original bed, ducked). |
| `plan.json` | Machine-readable shot list: start/end, speaker, line, caption, mouth anchor. |
| `poster-9x16.jpg`, `contact-sheet-9x16.jpg` | Thumbnail and 8-frame overview. |
| `tools/` | `plan.py` (timings from measured VO lengths) → `mix_vertical.py` (audio) → `render_vertical.py` (picture). Re-runnable end to end. |

## Honest status

This cut is **previz grade, not finished 3D**. The characters are 3D-render-quality
key art; the movement is camera, typography and effects. There is no rigged
geometry, so there is no lip-sync, no wheel rotation and no body performance.

That is still the most useful thing to own before a studio starts, because it locks:
the script, the five voice identities, the running order, the exact shot lengths and
the brand framing. What follows is everything a 3D vendor needs to turn it into real
animation.

---

# 3D production package

## 1. Delivery spec

- 1080×1920 (9:16), 30 fps, H.264 High, ~16 Mbps, AAC 48 kHz stereo.
- Target 40–45 s for Instagram Reels / YouTube Shorts; hook in the first 1.5 s.
- Safe areas: keep faces between y = 300 px and 1500 px, keep text out of the top
  220 px and bottom 320 px (Reels UI).
- Brand bug: the supplied `Learnzo_transparent.png`, unmodified, top-left,
  46 px margin, live-action opacity 80–100 %, never re-coloured or redrawn.

## 2. Character bibles (locked from `art/`)

| Character | Model notes |
|---|---|
| **Captain Rainbow** | 5–6-year-old girl, chubby preschool proportions (head ≈ 1/3.5 of height), brown hair in two pigtails with a purple star headband, brown eyes, rosy cheeks. **Outfit: fitted PURPLE suit**, purple gloves and boots, glossy rainbow star emblem on chest, long rainbow-striped cape (simulated cloth, 2-bone minimum). Rig: face board with 12 blendshapes minimum (see §4), cape simulation, hair cards with secondary motion. |
| **Ruby** | Bright red vintage fire truck, yellow roof ladder, silver hose reel, chrome bumper/headlights, four chunky tyres. Face lives in the windscreen: eyes + brows on glass, animated mouth integrated into the grille with teeth and tongue. Rig: wheel pivots, suspension bounce, chassis tilt, ladder hinge, brow/eye/mouth shape animation. |
| **Officer Blue** | Royal blue police car, silver star badge on the door, red/blue light bar (emissive, alternating), chrome push bar, alloy rims. Same face rig pattern as Ruby. |
| **Sunny** | Sunny yellow ambulance, red cross on the side, roof beacons, soft rounded boxy body, chrome bumper and mirrors. Same face rig pattern. |
| **Greenie** | Green off-road rescue jeep, seven-slot grille, deep-tread tyres, tow hook, roof light bar, side mirrors as ears. Same face rig pattern. |

Consistency rules for the vendor: same proportions, same face construction, same
palette in every shot; the reference plates in `art/` are the target render.

## 3. Style / look spec

Premium preschool CG: physically based renderer with soft global illumination, warm
key + cool sky fill + subtle rim; skin with subsurface scattering; automotive paint
with clearcoat reflections; fabric fibre detail on the cape and suit; shallow depth
of field (f/2.8 equivalent) on close-ups; gentle bloom; ACES-style grade leaning warm
and saturated but never clipping skin tones. Environment: cobbled fantasy town,
round doors, warm-lit windows, flower boxes, bunting, balloons, huge rainbow,
golden-hour sun shafts and floating dust motes.

## 4. Lip-sync and performance rules (this is where the brief lives)

- Build one viseme set per character: `A/O`, `E`, `I`, `U/WQ`, `M/B/P` (lips fully
  closed), `FV` (teeth on lip), `L/TH` (tongue), `S/Z` (teeth close), `rest`.
- Drive mouth shapes from the delivered `vo/*.mp3` with forced alignment; snap
  plosives to the closed shape, hold vowels, add 1–2 frame overshoot on emphasis.
- Eyebrows lead emotion by 2–3 frames; blinks every 2.5–4 s and on every line break;
  eye darts on list items ("colours, songs, numbers").
- Vehicles: idle suspension breathing (2–3 px), wheel rotation matched to any
  forward motion, a small chassis dip on each emphasised word, ladder/light-bar
  secondary motion on cuts, a blink on the first frame of their close-up.
- Every speaker must be on screen and in focus for the whole of their own line.
- Captain Rainbow flies in on shot 2 (arc + cape drag), lands with a two-frame
  squash, then stays grounded for the chorus.

## 5. Shot list (locked timings from `plan.json`)

| # | In–out | Shot | Action | Line |
|---|---|---|---|---|
| 1 | 0.0–3.4 | Wide town, rainbow, balloons | Camera cranes down the cobbled street; logo lockup resolves, "RESCUE TEAM" lands | — |
| 2 | 3.4–10.3 | Low-angle medium, Captain Rainbow | Flies in from frame top-right, lands with squash, waves at lens, eye contact | "Hello, little heroes! Welcome to Learnzo Rescue Team! Let's go on some amazing adventures!" |
| 3 | 10.3–15.8 | Close-up, Ruby | Drives in and brakes to a stop, rocks on suspension, ladder wobbles, grille-mouth speaks | "Hi, friends! I'm Ruby, the RED fire truck! I love helping everyone!" |
| 4 | 15.8–21.7 | Close-up, Officer Blue | Pulls alongside Ruby, light bar flashes, star badge catches light, salute with mirror | "Hello! I'm Officer Blue, the BLUE police car! I'm always ready to help!" |
| 5 | 21.7–27.1 | Close-up, Sunny | Rolls in gently, beacons pulse, tilts toward camera caringly | "Hi there! I'm Sunny, the YELLOW ambulance! I love caring for my friends!" |
| 6 | 27.1–32.8 | Close-up, Greenie | Bounces over the cobbles, front tyres turn, laughs mid-line | "Hey, everyone! I'm Greenie, the GREEN rescue jeep! Let's explore together!" |
| 7 | 32.8–37.0 | Group hero shot | All five together; Captain leaps, vehicles bounce and honk in rhythm, confetti burst on the last word | "Let's learn, laugh and rescue together!" |
| 8 | 37.0–41.6 | End card | Logo lockup over the group, "RESCUE TEAM", "Learn. Understand. Grow." | — |

## 6. Prompt pack for a video model (image-to-video)

Use the matching plate from `art/` as the **first frame** of every shot, generate at
9:16, then cut to the timings above. Keep the same seed family across shots.

**Shot 2 — Captain Rainbow**
> 3D animated preschool film, vertical 9:16. The little superhero girl in the purple
> suit and rainbow cape flies in from the top right, lands softly on the cobbles with
> a small squash, then turns to camera, waves and speaks with natural lip movement;
> her cape settles with cloth physics, her eyes blink and her eyebrows lift on the
> greeting. Cinematic push-in, shallow depth of field, warm rim light, rainbow town
> behind. No text.

**Shots 3–6 — the vehicles** (swap the subject line per character)
> 3D animated preschool film, vertical 9:16. The red fire truck with cartoon eyes in
> the windscreen drives toward camera and brakes to a stop, suspension rocking, wheels
> slowing to a halt, ladder wobbling; then it turns to the lens, blinks, smiles and
> speaks with its grille-mouth articulating each syllable, eyebrows reacting. Smooth
> tracking close-up, clearcoat paint reflections, sunny cobbled street bokeh. No text.

**Shot 7 — group**
> 3D animated preschool film, vertical 9:16. Five characters together on the town
> square: the little superhero in the purple suit leaps with both arms up while the
> red fire truck, blue police car, yellow ambulance and green jeep bounce and honk in
> rhythm, all cheering to camera with lip-synced shouting; confetti bursts, balloons
> rise, rainbow behind. Slow crane up, cinematic depth of field. No text.

**Shot 8 — end card** — do not generate; composite the real logo file in the edit.

**Negatives for every shot:** text, letters, logos, watermark, extra characters,
changed costume colours, photoreal humans, flat 2D, slideshow, still frame.

## 7. Audio

Voices are final: one distinct performer per character, English, cheerful and
intelligible, plus a three-voice chorus stack for the closing line. Bed is an original
124 BPM C-major ukulele/marimba cue, ducked −8 dB under dialogue. If the 3D cut is
re-timed, re-run `tools/plan.py` and `tools/mix_vertical.py` so picture and sound stay
locked together.

---

## Rebuilding this cut

```bash
cd rescue-team/vertical/tools
python3 plan.py            # measure VO, rebuild shot timings -> ../plan.json
python3 mix_vertical.py    # voices + bed + ducking      -> ../audio/master.wav
python3 render_vertical.py # 1248 frames + mux          -> ../../LEARNZO_RESCUE_TEAM_REEL_9x16.mp4
python3 render_vertical.py --stills 12,34.5   # spot-check frames
```

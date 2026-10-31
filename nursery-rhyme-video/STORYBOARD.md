# Wheels on the Bus — Learnzo 3D Nursery Rhyme Video
## Production storyboard & scene plan (master prompt, condensed)

- **Title:** "Wheels on the Bus | Learnzo 3D Nursery Rhymes & Kids Songs"
- **Duration:** ~5:45 (target 5–6 min) · **Format:** 16:9 · **Resolution:** 1920×1080 · 30 fps
- **Audience:** preschool children aged 2–6 · **Language:** English
- **On-screen text:** none. **Branding:** official Learnzo logo (attached reference,
  `media/learnzo-logo.png`) composited bottom-right for the entire video, unaltered.
- **Subtitles:** none. **Music:** original cheerful nursery-rhyme arrangement
  (synthesized in `src/make_music.py` — no copyrighted recordings).

## Characters (consistent across all scenes)
- **Benny** — bright golden-yellow rounded school bus; big expressive blue eyes on the
  windshield; friendly smiling grille; four colourful blue wheels.
- **Mia** — ~4 y/o girl, pink dress, two ponytails, big expressive eyes.
- **Leo** — ~5 y/o boy, blue overalls, brown hair.
- **Bunny** — fluffy white rabbit, long pink ears.
- Also: baby, friendly mother, puppy, kitten, little yellow duck.

## Scene sequence (shot list used for `media/scenes/*.png`)

| Shot | Time | Scene | Lyrics (TTS clip) |
|---|---|---|---|
| s01a | 0:00–0:13 | Magical morning: colourful houses, hills, birds, butterflies; Benny appears from behind a hill | intro |
| s01b | 0:13–0:25 | Benny drives toward camera smiling; Mia & Leo wave excitedly | — |
| s02a | 0:25–0:43 | Close-up of Benny's blue wheels spinning | "The wheels on the bus go round and round…" |
| s02b | 0:43–1:00 | Tracking shot through cheerful town; Mia, Leo, Bunny singing at windows | (verse continues) |
| s03a | 1:00–1:15 | Soft rain, droplets on windshield, wipers activate | "The wipers on the bus go swish, swish, swish…" |
| s03b | 1:15–1:30 | Wiper close-up, rhythmic, rainy countryside | |
| s04a | 1:30–1:45 | Benny at colourful intersection, honking; birds & animals react | "The horn on the bus goes beep, beep, beep…" |
| s04b | 1:45–2:00 | Front view horn with sound waves; happy animals | |
| s05a | 2:00–2:15 | Bus stop; doors open; Mia, Leo, Bunny board | "The doors on the bus go open and shut…" |
| s05b | 2:15–2:30 | Doors closing in rhythm; interior, kids in seats | |
| s06a | 2:30–3:00 | Interior: Mia, Leo, Bunny bouncing joyfully | "The people on the bus go up and down…" |
| s07a | 3:00–3:30 | Cute baby passenger, funny "wah wah" expressions | "The babies on the bus go wah, wah, wah…" |
| s08a | 3:30–4:00 | Mother gently comforts baby; baby calms and smiles | "The parents on the bus go shh, shh, shh…" |
| s09a | 4:00–4:15 | Puppy, kitten, duck wave and hop aboard | "The wheels…" (animals join) |
| s09b | 4:15–4:30 | Animals at windows, everyone singing | |
| s10a | 4:30–4:45 | Rain stops; magical rainbow over green hills | (instrumental) |
| s10b | 4:45–5:00 | Sparkling streams, flowers, butterflies, sunshine; cinematic wide | |
| s11a | 5:00–5:15 | All characters dancing in a meadow circle, balloons | finale chorus |
| s11b | 5:15–5:30 | Benny centre, everyone singing big finale | |
| s12  | 5:30–5:45 | Benny parked in meadow; everyone waves goodbye; gentle honk | outro |

## Build pipeline
1. `src/make_music.py` — synthesizes the original music bed (numpy → WAV).
2. `src/assemble_video.py` — normalizes scene stills to 1920×1080, renders Ken-Burns
   camera motion per shot with ffmpeg `zoompan`, concatenates, composites the Learnzo
   logo bottom-right, mixes music + vocal clips, exports H.264/AAC MP4.
3. Vocal clips: `media/audio/*.mp3` (TTS voice `voice-00`), timed per the table above.

Output: `output/Wheels-on-the-Bus-Learnzo-1080p.mp4`

# Wheels on the Bus — Song Production Sheet

**Deliverable:** `output/Wheels-on-the-Bus-song.wav` (5:20, 44.1 kHz stereo, 16-bit PCM master)
**Web/download copy:** `downloads/Wheels-on-the-Bus-song.mp3` (192 kbps MP3)

## Specs
- Duration: **5:20** (within the 5–6 min target) · Language: English · Tempo: **66 BPM, 4/4**, 88 bars
- Melody: traditional public-domain nursery-rhyme tune, one consistent melody for every verse
- Arrangement: bright piano (lead + chords), ukulele off-beat plucks, marimba bass,
  bells (intro/chorus/outro), gentle kick/snare/hi-hats — original studio-style render
- Vocals: warm lead voice, every lyric sung exactly as written (no extra verses, no narration)
- Final chorus: wheels verse ×2 with a pitch-shifted child-voice layer ("children singing along")
- Bed ducks −5 dB under each vocal; gentle fades in/out

## Timeline
| Time | Section |
|---|---|
| 0:00–0:14 | Instrumental intro (piano + bells) |
| 0:14–0:43 | Verse 1 — Wheels |
| 0:43–1:12 | Verse 2 — Wipers |
| 1:12–1:41 | Verse 3 — Horn |
| 1:41–2:10 | Verse 4 — Doors |
| 2:10–2:39 | Verse 5 — People |
| 2:39–3:08 | Verse 6 — Babies |
| 3:08–3:37 | Verse 7 — Parents |
| 3:37–4:06 | Verse 8 — Friends |
| 4:06–4:35 | Final chorus — Wheels ×1 (all singers) |
| 4:35–5:04 | Final chorus — Wheels ×2 (all singers) |
| 5:04–5:20 | Cheerful instrumental outro |

## Lyrics (sung verbatim)
1. The wheels on the bus go round and round, round and round, round and round. The wheels on the bus go round and round, all through the town.
2. The wipers on the bus go swish, swish, swish, swish, swish, swish, swish, swish, swish. The wipers on the bus go swish, swish, swish, all through the town.
3. The horn on the bus go beep, beep, beep, beep, beep, beep, beep, beep, beep. The horn on the bus go beep, beep, beep, all through the town.
4. The doors on the bus go open and shut, open and shut, open and shut. The doors on the bus go open and shut, all through the town.
5. The people on the bus go up and down, up and down, up and down. The people on the bus go up and down, all through the town.
6. The babies on the bus go wah, wah, wah, wah, wah, wah, wah, wah, wah. The babies on the bus go wah, wah, wah, all through the town.
7. The parents on the bus go shh, shh, shh, shh, shh, shh, shh, shh, shh. The parents on the bus go shh, shh, shh, all through the town.
8. The friends on the bus go laugh, laugh, laugh, laugh, laugh, laugh, laugh, laugh, laugh. The friends on the bus go laugh, laugh, laugh, all through the town.

Final chorus: verse 1 sung twice. Ending: instrumental outro.

## Rebuild
```bash
python3 nursery-rhyme-video/src/make_song.py   # instrumental bed -> media/audio/song_music.wav
python3 nursery-rhyme-video/src/mix_song.py     # + vocals (media/songvocals/*.mp3) -> output WAV
ffmpeg -i output/Wheels-on-the-Bus-song.wav -b:a 192k downloads/Wheels-on-the-Bus-song.mp3
```
Vocal clips: `media/songvocals/v1..v8 + chorus1/chorus2` (TTS lead voice, time-stretched per verse slot).

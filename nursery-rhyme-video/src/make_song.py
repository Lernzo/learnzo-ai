#!/usr/bin/env python3
"""Compose the instrumental arrangement for 'Wheels on the Bus' (traditional
public-domain nursery-rhyme melody, original arrangement) -> media/audio/song_music.wav

Structure (66 BPM, 4/4, 88 bars = 320 s = 5:20):
  bars  0- 3  instrumental intro (piano + bells)
  bars  4-67  verses 1-8 (8 bars each): wheels, wipers, horn, doors, people,
              babies, parents, friends
  bars 68-83  final chorus: wheels verse x2 (bells + fuller arrangement)
  bars 84-87  cheerful instrumental outro

Instruments: bright piano (melody + chords), ukulele off-beat plucks, marimba
bass, bells (intro/chorus/outro), gentle kick/snare/hats.
"""
import numpy as np
import wave
import os

SR = 44100
BPM = 66.0
BEAT = 60.0 / BPM          # 0.9091 s
BAR = 4 * BEAT             # 3.6364 s
N_BARS = 88
DUR = N_BARS * BAR         # 320 s
N = int(DUR * SR)
rng = np.random.default_rng(11)
mixL = np.zeros(N)
mixR = np.zeros(N)


def midi2f(m):
    return 440.0 * 2.0 ** ((m - 69) / 12.0)


def add(sig, start, vol, pan=0.0):
    i0 = int(start * SR)
    i1 = min(N, i0 + len(sig))
    if i1 <= i0:
        return
    seg = sig[: i1 - i0] * vol
    mixL[i0:i1] += seg * np.cos((pan + 1) * np.pi / 4)
    mixR[i0:i1] += seg * np.sin((pan + 1) * np.pi / 4)


def tone(freq, start, dur, vol, timbre="piano", pan=0.0, vib=0.0):
    n = int(dur * SR)
    if n <= 0:
        return
    tt = np.arange(n) / SR
    ph = 2 * np.pi * freq * tt
    if vib:
        ph = ph + vib * np.sin(2 * np.pi * 5.2 * tt)
    if timbre == "piano":
        w = np.sin(ph) + 0.45 * np.sin(2 * ph) + 0.22 * np.sin(3 * ph) + 0.1 * np.sin(4 * ph)
        dec = np.exp(-3.2 * tt / max(dur, 0.05))
    elif timbre == "pluck":      # ukulele
        w = np.sin(ph) + 0.6 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph)
        dec = np.exp(-9.0 * tt)
    elif timbre == "marimba":    # woody mallet bass
        w = np.sin(ph) + 0.35 * np.sin(3 * ph)
        dec = np.exp(-7.0 * tt)
    elif timbre == "bell":
        w = np.sin(ph) + 0.5 * np.sin(2.01 * ph) + 0.3 * np.sin(2.99 * ph) + 0.15 * np.sin(4.16 * ph)
        dec = np.exp(-3.5 * tt / max(dur, 0.05))
    elif timbre == "sine":
        w = np.sin(ph)
        dec = np.exp(-2.5 * tt / max(dur, 0.05))
    else:
        w = np.sin(ph)
        dec = np.ones(n)
    a = max(1, int(0.008 * SR))
    env = np.minimum(1.0, tt / (a / SR)) * dec
    add(w * env, start, vol, pan)


def kick(start, vol=0.4):
    n = int(0.22 * SR)
    tt = np.arange(n) / SR
    f = 120 * np.exp(-tt * 25) + 45
    add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 14), start, vol)


def snare(start, vol=0.12):
    n = int(0.13 * SR)
    tt = np.arange(n) / SR
    w = rng.standard_normal(n) * np.exp(-tt * 32) + np.sin(2 * np.pi * 190 * tt) * np.exp(-tt * 42)
    add(w, start, vol, -0.1)


def hat(start, vol=0.06):
    n = int(0.05 * SR)
    w = np.diff(np.concatenate(([0.0], rng.standard_normal(n))))
    tt = np.arange(n) / SR
    add(w * np.exp(-tt * 95), start, vol, 0.2)


# ------------------------------------------------------------------ harmony
# Chord per bar. Verse progression (8 bars): C C G G F F C G
C, G, F, Am = [60, 64, 67], [59, 62, 67], [57, 60, 65], [57, 60, 64]
BASSROOT = {id(C): 36, id(G): 31, id(F): 29, id(Am): 33}
VERSE_PROG = [C, C, G, G, F, F, C, G]
INTRO_PROG = [C, F, G, C]
OUTRO_PROG = [C, F, C, C]
BASS_MIDI = [36, 31, 29, 33, 36, 31, 29, 36]

# ------------------------------------------------------------------ melody
# One verse = 4 lines x 2 bars (8 beats each). midi + beats.
LINE1 = [(60, 1), (60, 1), (64, 1), (64, 1), (67, 1), (67, 1), (64, 2)]      # "The wheels on the bus go round and round,"
LINE2 = [(65, 1), (65, 1), (64, 1), (64, 1), (62, 1), (62, 1), (60, 2)]      # "Round and round, round and round,"
LINE4 = [(67, 2), (64, 2), (62, 2), (60, 2)]                                  # "All through the town."
VERSE_MELODY = LINE1 + LINE2 + LINE1 + LINE4          # 32 beats = 8 bars
INTRO_MELODY = [(64, 2), (65, 2), (67, 2), (72, 2), (67, 2), (65, 2), (64, 2), (60, 2)]
OUTRO_MELODY = [(60, 4), (64, 4), (67, 4), (72, 4)]


def play_melody(notes, t0, vol, timbre="piano", vib=0.005, pan=0.0):
    t = t0
    for m, beats in notes:
        tone(midi2f(m), t, beats * BEAT * 1.05, vol, timbre, pan=pan, vib=vib)
        t += beats * BEAT


def arrange_bar(bar_idx, prog, melody_notes=None, t0=None, bells=False, pluck=True):
    ch = prog[bar_idx % len(prog)]
    t0 = bar_idx * BAR if t0 is None else t0
    # marimba bass on beats 1 and 3
    tone(midi2f(BASS_MIDI[bar_idx % 8]), t0, BEAT * 1.8, 0.20, "marimba")
    tone(midi2f(BASS_MIDI[bar_idx % 8]), t0 + 2 * BEAT, BEAT * 1.5, 0.13, "marimba")
    # piano chord pad
    for i, m in enumerate(ch):
        tone(midi2f(m), t0, BEAT * 3.8, 0.05, "piano", pan=(i - 1) * 0.4)
    # ukulele off-beat plucks
    if pluck:
        for b in range(4):
            for i, m in enumerate(ch):
                tone(midi2f(m + 12), t0 + (b + 0.5) * BEAT, 0.22, 0.028, "pluck", pan=(i - 1) * 0.45)
    # gentle percussion
    kick(t0, 0.38)
    snare(t0 + 2 * BEAT, 0.10)
    for b in range(8):
        hat(t0 + (b + 0.5) * BEAT, 0.05 if b % 2 else 0.035)
    # bells sparkle
    if bells:
        for b in range(4):
            tone(midi2f(ch[(b + 1) % 3] + 24), t0 + b * BEAT, BEAT * 0.9, 0.05, "bell", pan=0.3)
            tone(midi2f(ch[(b + 2) % 3] + 24), t0 + (b + 0.5) * BEAT, BEAT * 0.8, 0.035, "bell", pan=-0.3)


# intro
for b in range(4):
    arrange_bar(b, INTRO_PROG, bells=True)
play_melody(INTRO_MELODY, 0 * BAR, 0.16, "piano", vib=0.004, pan=0.1)

# verses 1-8: bars 4..67
for v in range(8):
    base = 4 + v * 8
    for b in range(8):
        arrange_bar(base + b, VERSE_PROG, bells=False)
    play_melody(VERSE_MELODY, base * BAR, 0.17, "piano", vib=0.005, pan=0.05)

# final chorus (wheels verse x2): bars 68..83, fuller
for c in range(2):
    base = 68 + c * 8
    for b in range(8):
        arrange_bar(base + b, VERSE_PROG, bells=True)
    play_melody(VERSE_MELODY, base * BAR, 0.19, "piano", vib=0.006, pan=0.0)

# outro: bars 84..87
for b in range(4):
    arrange_bar(84 + b, OUTRO_PROG, bells=True, pluck=(b < 2))
play_melody(OUTRO_MELODY, 84 * BAR, 0.15, "piano", vib=0.004)

# ------------------------------------------------------------------ master
fade = int(1.5 * SR)
mixL[:fade] *= np.linspace(0, 1, fade)
mixR[:fade] *= np.linspace(0, 1, fade)
fo = int(5 * SR)
mixL[-fo:] *= np.linspace(1, 0, fo)
mixR[-fo:] *= np.linspace(1, 0, fo)
peak = max(np.abs(mixL).max(), np.abs(mixR).max())
g = 0.89 / max(peak, 1e-9)
mixL *= g
mixR *= g

out = np.stack([mixL, mixR], axis=1)
out16 = (np.clip(out, -1, 1) * 32767).astype(np.int16)
path = os.path.join(os.path.dirname(__file__), "..", "media", "audio", "song_music.wav")
with wave.open(path, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(out16.tobytes())
print("wrote", os.path.abspath(path), f"{DUR:.1f}s = {DUR/60:.2f} min, {BPM} BPM, {N_BARS} bars")

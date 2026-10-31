#!/usr/bin/env python3
"""Synthesize an ORIGINAL cheerful nursery-rhyme music bed for the Learnzo
'Wheels on the Bus' video. No copyrighted material: the melody is an original
chord-arpeggio composition written here, generated with numpy -> WAV.

Output: media/audio/music.wav  (44.1 kHz stereo, ~345 s)
"""
import numpy as np
import wave
import os

SR = 44100
BPM = 100.0
BEAT = 60.0 / BPM          # 0.6 s
DUR = 345.0                # seconds (matches video timeline)
N = int(DUR * SR)
rng = np.random.default_rng(7)

mixL = np.zeros(N, dtype=np.float64)
mixR = np.zeros(N, dtype=np.float64)


def midi2f(m):
    return 440.0 * 2.0 ** ((m - 69) / 12.0)


def add(sig, start, vol, pan=0.0):
    i0 = int(start * SR)
    i1 = min(N, i0 + len(sig))
    if i1 <= i0:
        return
    seg = sig[: i1 - i0] * vol
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    mixL[i0:i1] += seg * l
    mixR[i0:i1] += seg * r


def tone(freq, start, dur, vol, timbre="piano", pan=0.0, vib=0.0):
    i0 = int(start * SR)
    n = int(dur * SR)
    if n <= 0:
        return
    tt = np.arange(n) / SR
    ph = 2 * np.pi * freq * tt
    if vib:
        ph = ph + vib * np.sin(2 * np.pi * 5.5 * tt)
    if timbre == "sine":
        w = np.sin(ph)
        dec = np.exp(-2.5 * tt / max(dur, 0.05))
    elif timbre == "tri":
        w = 2 * np.abs(2 * ((freq * tt) % 1.0) - 1) - 1
        dec = np.exp(-2.0 * tt / max(dur, 0.05))
    elif timbre == "piano":
        w = np.sin(ph) + 0.45 * np.sin(2 * ph) + 0.22 * np.sin(3 * ph) + 0.1 * np.sin(4 * ph)
        dec = np.exp(-3.5 * tt / max(dur, 0.05))
    elif timbre == "pluck":  # ukulele-ish
        w = np.sin(ph) + 0.6 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph)
        dec = np.exp(-9.0 * tt)
    elif timbre == "bell":
        w = np.sin(ph) + 0.5 * np.sin(2.01 * ph) + 0.3 * np.sin(2.99 * ph) + 0.15 * np.sin(4.2 * ph)
        dec = np.exp(-4.0 * tt / max(dur, 0.05))
    else:
        w = np.sin(ph)
        dec = np.ones(n)
    a = max(1, int(0.008 * SR))
    env = np.minimum(1.0, tt / (a / SR)) * dec
    add(w * env, start, vol, pan)


def kick(start, vol=0.5):
    n = int(0.22 * SR)
    tt = np.arange(n) / SR
    f = 130 * np.exp(-tt * 25) + 45
    w = np.sin(2 * np.pi * np.cumsum(f) / SR)
    add(w * np.exp(-tt * 14), start, vol, 0.0)


def hat(start, vol=0.10):
    n = int(0.06 * SR)
    w = rng.standard_normal(n)
    w = np.diff(np.concatenate(([0.0], w)))
    tt = np.arange(n) / SR
    add(w * np.exp(-tt * 90), start, vol, 0.15)


def snare(start, vol=0.16):
    n = int(0.14 * SR)
    tt = np.arange(n) / SR
    w = rng.standard_normal(n) * np.exp(-tt * 30) + np.sin(2 * np.pi * 190 * tt) * np.exp(-tt * 40)
    add(w, start, vol, -0.1)


# ---------------------------------------------------------------- harmony
# I - V - vi - IV in C major, one chord per bar (4 beats).
CHORDS = [
    [60, 64, 67],   # C
    [59, 62, 67],   # G (root position-ish)
    [57, 60, 64],   # Am
    [57, 60, 65],   # F
]
BASS = [36, 31, 33, 29]  # C2 G1 A1 F1

n_beats = int(DUR / BEAT)
for b in range(n_beats):
    bar = (b // 4) % 4
    ch = CHORDS[bar]
    t0 = b * BEAT
    if b % 2 == 0:  # gentle kick on 1 and 3
        kick(t0, 0.42 if b % 4 == 0 else 0.3)
    if b % 4 == 2:
        snare(t0, 0.10)
    hat(t0 + BEAT * 0.5, 0.07)
    hat(t0 + BEAT * 1.5, 0.05)
    hat(t0 + BEAT * 2.5, 0.07)
    hat(t0 + BEAT * 3.5, 0.05)
    # bass
    tone(midi2f(BASS[bar]), t0, BEAT * 1.8, 0.16, "sine")
    if b % 2 == 0:
        tone(midi2f(BASS[bar]), t0 + 2 * BEAT, BEAT * 1.6, 0.12, "sine")
    # soft piano chord on beat 1
    for i, m in enumerate(ch):
        tone(midi2f(m + 12), t0, BEAT * 3.6, 0.055, "piano", pan=(i - 1.5) * 0.4)
    # ukulele off-beat stabs
    for off in (1.5, 3.5):
        for i, m in enumerate(ch):
            tone(midi2f(m + 24), t0 + off * BEAT, 0.28, 0.030, "pluck", pan=(i - 1.5) * 0.5)

# ---------------------------------------------------------------- melody
# Original lead melody: chord-tone arpeggios with a stepwise counter-line.
def arp(ch, t0, octave=1, vol=0.10, dur=BEAT * 0.5):
    seq = [0, 1, 2, 2, 1, 0]  # root 3rd 5th 5th 3rd root
    for k, idx in enumerate(seq):
        tone(midi2f(ch[idx] + 12 * octave), t0 + k * dur, dur * 1.4, vol, "tri",
             pan=0.2, vib=0.004)

COUNTER = {  # a gentle original stepwise line, one note per 2 beats
    0: [76, 79, 81, 79],
    1: [79, 83, 86, 83],
    2: [81, 84, 88, 84],
    3: [84, 81, 77, 81],
}

for b in range(0, n_beats - 4, 4):
    bar = (b // 4) % 4
    ch = CHORDS[bar]
    t0 = b * BEAT
    arp(ch, t0, octave=1, vol=0.085)
    arp(ch, t0 + 2 * BEAT, octave=1, vol=0.085)
    # counter-line every 8 beats
    if (b // 4) % 2 == 0:
        notes = COUNTER[bar]
        for k in range(4):
            tone(midi2f(notes[k]), t0 + k * 2 * BEAT, BEAT * 2.2, 0.075, "sine", pan=-0.3, vib=0.006)

# Finale (last ~46 s): bells + busier hats + higher arpeggio
finale_start = DUR - 46.0
fb = int(finale_start / BEAT)
for b in range(fb, n_beats - 2, 2):
    bar = (b // 4) % 4
    ch = CHORDS[bar]
    t0 = b * BEAT
    for k, m in enumerate([ch[2] + 24, ch[1] + 24, ch[0] + 24, ch[1] + 24]):
        tone(midi2f(m), t0 + k * BEAT * 0.5, BEAT * 0.9, 0.06, "bell", pan=0.3 * (k % 2 and 1 or -1))
    hat(t0 + BEAT * 0.25, 0.09)
    hat(t0 + BEAT * 0.75, 0.09)

# ---------------------------------------------------------------- vocal ducking
# Dip the music bed ~4 dB while a vocal clip is playing.
VOCAL_WINDOWS = [(2, 13.3), (31, 51.4), (71, 87.6), (104, 117.8), (134, 153.2),
                 (169, 188.6), (189, 223.1), (224, 245.6), (247, 268.5),
                 (300, 321.8), (323, 344.8)]
duck = np.ones(N)
for s, e in VOCAL_WINDOWS:
    i0, i1 = int(s * SR), int(e * SR)
    ramp = int(0.4 * SR)
    seg = np.ones(i1 - i0)
    seg[:ramp] = np.linspace(1.0, 10 ** (-4 / 20), ramp)
    seg[-ramp:] = np.linspace(10 ** (-4 / 20), 1.0, ramp)
    duck[i0:i1] *= seg
mixL *= duck
mixR *= duck

# ---------------------------------------------------------------- master
# soft fade in/out, gentle limiter
fade_in = int(1.0 * SR)
mixL[:fade_in] *= np.linspace(0, 1, fade_in)
mixR[:fade_in] *= np.linspace(0, 1, fade_in)
fade_out = int(4.0 * SR)
mixL[-fade_out:] *= np.linspace(1, 0, fade_out)
mixR[-fade_out:] *= np.linspace(1, 0, fade_out)

peak = max(np.abs(mixL).max(), np.abs(mixR).max())
gain = 0.89 / max(peak, 1e-9)
mixL *= gain
mixR *= gain

out = np.stack([mixL, mixR], axis=1)
out16 = (np.clip(out, -1, 1) * 32767).astype(np.int16)

path = os.path.join(os.path.dirname(__file__), "..", "media", "audio", "music.wav")
os.makedirs(os.path.dirname(path), exist_ok=True)
with wave.open(path, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(out16.tobytes())
print("wrote", os.path.abspath(path), f"{DUR:.1f}s")

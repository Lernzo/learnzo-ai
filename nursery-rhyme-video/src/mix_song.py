#!/usr/bin/env python3
"""Mix the 'Wheels on the Bus' song: instrumental bed + sung vocal clips.

- Verse clips are time-stretched (ffmpeg atempo, pitch preserved) to sit inside
  their 8-bar verse slot at 66 BPM (not rushed).
- Bed ducks ~5 dB under vocals.
- Final chorus gets a pitch-shifted (+5 semitones) 'children singing along' layer.
Output: output/Wheels-on-the-Bus-song.wav
"""
import os
import subprocess
import sys
import wave

import numpy as np
import imageio_ffmpeg

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MEDIA = os.path.join(ROOT, "media")
VOC = os.path.join(MEDIA, "songvocals")
AUDIO = os.path.join(MEDIA, "audio")
OUT = os.path.join(ROOT, "output")
WORK = os.path.join(MEDIA, "work")
FF = imageio_ffmpeg.get_ffmpeg_exe()
SR = 44100
BEAT = 60.0 / 66.0
BAR = 4 * BEAT

CLIPS = [
    ("v1_wheels.mp3", 1, 0.50), ("v2_wipers.mp3", 2, 0.55), ("v3_horn.mp3", 3, 0.70),
    ("v4_doors.mp3", 4, 0.50), ("v5_people.mp3", 5, 0.50), ("v6_babies.mp3", 6, 1.90),
    ("v7_parents.mp3", 7, 0.50), ("v8_friends.mp3", 8, 0.58),
    ("chorus1.mp3", "c1", 0.50), ("chorus2.mp3", "c2", 0.55),
]


def start_of(slot):
    bar = 68 if slot == "c1" else 76 if slot == "c2" else 4 + (slot - 1) * 8
    return bar * BAR


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-1500:])
        sys.exit(1)


def read_wav_mono(path):
    with wave.open(path, "rb") as w:
        n = w.getnframes()
        data = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64) / 32768.0
        if w.getnchannels() == 2:
            data = data.reshape(-1, 2).mean(axis=1)
        return data


os.makedirs(WORK, exist_ok=True)
os.makedirs(OUT, exist_ok=True)

bed_mono = read_wav_mono(os.path.join(AUDIO, "song_music.wav"))
N = len(bed_mono)                       # frames
print(f"bed: {N/SR:.1f}s")

# convert + time-stretch vocals
sigs = {}
for fname, slot, atempo in CLIPS:
    src = os.path.join(VOC, fname)
    dst = os.path.join(WORK, fname.replace(".mp3", f"_{atempo}.wav"))
    run([FF, "-y", "-i", src, "-filter:a", f"atempo={atempo}", "-ar", str(SR), "-ac", "1", dst])
    sigs[fname] = read_wav_mono(dst)
    print(f"{fname}: slot={slot} start={start_of(slot):.1f}s dur={len(sigs[fname])/SR:.1f}s")

# duck map on the bed
duck = np.ones(N)
for fname, slot, atempo in CLIPS:
    sig = sigs[fname]
    i0 = int(start_of(slot) * SR)
    i1 = min(N, i0 + len(sig))
    if i1 <= i0:
        continue
    ramp = min(int(0.6 * SR), (i1 - i0) // 2)
    seg = np.ones(i1 - i0)
    seg[:ramp] = np.linspace(1, 10 ** (-5 / 20), ramp)
    seg[-ramp:] = np.linspace(10 ** (-5 / 20), 1, ramp)
    duck[i0:i1] *= seg


def pitch_shift(sig, semitones):
    r = 2.0 ** (semitones / 12.0)
    m = int(len(sig) / r)
    short = np.interp(np.arange(m) * r, np.arange(len(sig)), sig)
    return np.interp(np.arange(len(sig)), np.arange(m) * (len(sig) / m), short)


def place(mix, sig, t0, vol):
    i0 = int(t0 * SR)
    i1 = min(N, i0 + len(sig))
    if i1 <= i0:
        return
    seg = sig[: i1 - i0] * vol
    ramp = min(int(0.25 * SR), len(seg) // 2)
    seg[:ramp] *= np.linspace(0, 1, ramp)
    seg[-ramp:] *= np.linspace(1, 0, ramp)
    mix[i0:i1] += seg


mix = bed_mono * duck
for fname, slot, atempo in CLIPS:
    sig = sigs[fname]
    t0 = start_of(slot)
    place(mix, sig, t0, 0.95)
    if slot in ("c1", "c2"):  # children singing along
        place(mix, pitch_shift(sig, 5), t0 + 0.05, 0.45)

# master
peak = np.abs(mix).max()
mix *= 0.95 / max(peak, 1e-9)
fo = int(4 * SR)
mix[-fo:] *= np.linspace(1, 0, fo)

stereo = np.stack([mix, mix], axis=1)
out16 = (np.clip(stereo, -1, 1) * 32767).astype(np.int16)
wav_path = os.path.join(OUT, "Wheels-on-the-Bus-song.wav")
with wave.open(wav_path, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(out16.tobytes())
print("wrote", wav_path, f"{N/SR:.1f}s = {N/SR/60:.2f} min")

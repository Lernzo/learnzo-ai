"""Original score + ambience + narration mix for the Rainbow Bus opening shot.

Everything here is synthesised from scratch with numpy: a gentle music-box
lullaby in C major, a soft water bed, distant birds, and a magic sparkle for
the ending beat.
"""
from __future__ import annotations

import math
import os
import subprocess
import wave

import numpy as np

SR = 48000
DUR = 17.4
N = int(SR * DUR)
HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "..", "assets")


def t_axis():
    return np.arange(N) / SR


def env_ad(n, attack, decay, curve=3.0):
    a = max(1, int(attack * SR))
    d = max(1, n - a)
    e = np.concatenate([np.linspace(0, 1, a) ** 0.6,
                        np.exp(-np.linspace(0, curve, d))])
    return e[:n]


def bell(freq, dur, amp=0.2, attack=0.005, decay=2.6, bright=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    w = (np.sin(2 * np.pi * freq * t) * 1.0
         + np.sin(2 * np.pi * freq * 2.01 * t) * 0.42 * bright
         + np.sin(2 * np.pi * freq * 3.02 * t) * 0.20 * bright
         + np.sin(2 * np.pi * freq * 4.97 * t) * 0.10 * bright)
    return w * env_ad(n, attack, decay) * amp


def marimba(freq, dur, amp=0.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    w = (np.sin(2 * np.pi * freq * t) * 1.0
         + np.sin(2 * np.pi * freq * 3.99 * t) * 0.16
         + np.sin(2 * np.pi * freq * 9.2 * t) * 0.05)
    return w * env_ad(n, 0.004, 4.2) * amp


def pad(freqs, dur, amp=0.08):
    n = int(dur * SR)
    t = np.arange(n) / SR
    w = np.zeros(n)
    for f in freqs:
        for det in (-0.6, 0.0, 0.7):
            w += np.sin(2 * np.pi * (f + det) * t + np.random.rand() * 6.28)
    w /= (len(freqs) * 3)
    e = np.concatenate([np.linspace(0, 1, int(0.9 * SR)) ** 1.5,
                        np.ones(max(1, n - int(1.5 * SR))),
                        np.linspace(1, 0, max(1, int(0.6 * SR)))])
    e = np.resize(e, n)
    return w * e * amp


NOTE = {"C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23, "G4": 392.00,
        "A4": 440.00, "B4": 493.88, "C5": 523.25, "D5": 587.33, "E5": 659.25,
        "G5": 783.99, "A5": 880.00, "C6": 1046.5, "E6": 1318.5, "G6": 1568.0,
        "C3": 130.81, "E3": 164.81, "F3": 174.61, "G3": 196.00, "A3": 220.00,
        "B3": 246.94, "F2": 87.31, "G2": 98.00, "C2": 65.41, "A2": 110.00}


def add(buf, sig, at):
    i = int(at * SR)
    if i >= len(buf):
        return
    end = min(len(buf), i + len(sig))
    buf[i:end] += sig[:end - i]


def music():
    buf = np.zeros(N)
    bpm = 104
    beat = 60 / bpm
    bar = beat * 4

    # chord progression: C - Am - F - G  (two bars each, then C)
    prog = [("C3", ["C4", "E4", "G4"]), ("A2", ["A3", "C4", "E4"]),
            ("F2", ["F3", "A3", "C4"]), ("G2", ["G3", "B3", "D4"]),
            ("C3", ["C4", "E4", "G4"]), ("A2", ["A3", "C4", "E4"]),
            ("F2", ["F3", "A3", "C4"]), ("G2", ["G3", "B3", "D4"])]

    for i, (root, chord) in enumerate(prog):
        t0 = i * bar
        if t0 > DUR:
            break
        add(buf, pad([NOTE[n] for n in chord], min(bar + 0.6, DUR - t0), amp=0.055), t0)
        # gentle bass on beats 1 and 3
        add(buf, marimba(NOTE[root] / 2, min(1.4, DUR - t0), amp=0.135), t0)
        add(buf, marimba(NOTE[root] / 2, 1.1, amp=0.09), t0 + 2 * beat)

    # music-box melody (pentatonic, lullaby contour)
    mel = [
        ("E5", 0.0), ("G5", 0.5), ("A5", 1.0), ("G5", 1.5), ("E5", 2.0), ("D5", 2.5), ("C5", 3.0),
        ("A4", 4.0), ("C5", 4.5), ("E5", 5.0), ("D5", 5.5), ("C5", 6.0), ("A4", 7.0),
        ("F4", 8.0), ("A4", 8.5), ("C5", 9.0), ("D5", 9.5), ("C5", 10.0), ("A4", 10.5),
        ("G4", 11.0), ("B4", 11.5), ("D5", 12.0), ("E5", 13.0), ("D5", 13.5),
        ("C5", 14.0), ("E5", 14.5), ("G5", 15.0), ("A5", 15.5), ("G5", 16.0), ("E5", 16.5),
    ]
    for name, bt in mel:
        t0 = bt * beat * 0.5
        if t0 >= DUR:
            continue
        add(buf, bell(NOTE[name], 1.6, amp=0.085, decay=3.0, bright=0.35), t0)
        add(buf, bell(NOTE[name] * 2, 1.1, amp=0.022, decay=4.5, bright=0.2), t0)

    # soft off-beat shaker
    rng = np.random.RandomState(5)
    for k in range(int(DUR / (beat / 2))):
        t0 = k * beat / 2
        n = int(0.07 * SR)
        noise = rng.randn(n) * np.exp(-np.linspace(0, 7, n))
        noise = np.diff(noise, prepend=0) * 0.018     # brighten
        add(buf, noise, t0)

    return buf


def water():
    rng = np.random.RandomState(2)
    n = N
    # brown-ish noise bed
    w = rng.randn(n)
    b = np.zeros(n)
    acc = 0.0
    for i in range(0, n, 1):  # vectorised below instead
        break
    kernel = 256
    w = np.convolve(w, np.ones(kernel) / kernel, mode="same")
    w = np.convolve(w, np.ones(kernel) / kernel, mode="same")
    t = t_axis()
    mod = 0.65 + 0.35 * np.sin(2 * np.pi * 0.12 * t) * np.sin(2 * np.pi * 0.031 * t + 1.0)
    w = w * mod
    w /= (np.abs(w).max() + 1e-9)
    # gentle droplets
    for k, (at, f, a) in enumerate([(1.4, 1400, 0.03), (3.9, 1750, 0.022), (6.2, 1200, 0.028),
                                    (9.1, 1600, 0.02), (12.3, 1350, 0.024), (15.2, 1800, 0.018)]):
        n2 = int(0.25 * SR)
        tt = np.arange(n2) / SR
        s = np.sin(2 * np.pi * f * tt * (1 + 0.6 * np.exp(-tt * 30))) * np.exp(-tt * 16) * a
        add(w, s, at)
    return w * 0.5


def birds():
    buf = np.zeros(N)
    for at, f0, f1, dur, amp in [(1.15, 2700, 3400, 0.10, 0.05), (1.38, 2900, 3600, 0.08, 0.04),
                                 (5.6, 2500, 3200, 0.09, 0.045), (12.0, 2800, 3500, 0.10, 0.038)]:
        n = int(dur * SR)
        t = np.arange(n) / SR
        f = f0 + (f1 - f0) * (t / dur)
        s = np.sin(2 * np.pi * f * t) * np.sin(np.pi * t / dur) ** 2 * amp
        add(buf, s, at)
    return buf


def sparkle():
    buf = np.zeros(N)
    notes = ["C6", "E6", "G6", "C6", "E6", "G6", "C6", "E6"]
    for i, nm in enumerate(notes):
        add(buf, bell(NOTE[nm], 1.2, amp=0.05, decay=4.0, bright=0.6), 13.9 + i * 0.17)
    # shimmer
    rng = np.random.RandomState(8)
    n = int(1.8 * SR)
    t = np.arange(n) / SR
    sh = rng.randn(n) * np.exp(-t * 2.2) * 0.012
    add(buf, sh, 14.2)
    return buf


def load_narration(name):
    """Decode an mp3 to mono float using the bundled ffmpeg."""
    import imageio_ffmpeg
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    path = os.path.join(ASSETS, name)
    raw = subprocess.run([ff, "-v", "quiet", "-i", path, "-f", "f32le", "-ac", "1",
                          "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def write_wav(path, mono):
    data = np.clip(mono, -1, 1)
    st = np.stack([data, data], axis=1)
    pcm = (st * 32767).astype("<i2")
    with wave.open(path, "wb") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(pcm.tobytes())


def main():
    voice = np.zeros(N)
    a = load_narration("narration_a.mp3")
    b = load_narration("narration_b.mp3")
    add(voice, a, 0.55)
    add(voice, b, 6.55)
    print("narration A", round(len(a) / SR, 2), "B", round(len(b) / SR, 2))

    mu = music() * 0.9
    wa = water() * 0.5
    bi = birds()
    sp = sparkle() * 1.0

    # duck the music under the voice
    env = np.abs(voice)
    k = int(0.25 * SR)
    env = np.convolve(env, np.ones(k) / k, mode="same")
    env = np.clip(env / (env.max() + 1e-9) * 2.4, 0, 1)
    duck = 1.0 - 0.45 * env

    mix = voice * 1.0 + mu * duck * 0.55 + wa * 0.35 + bi * 0.8 + sp * 0.55

    # gentle fade in / out
    t = t_axis()
    fade_in = np.clip(t / 0.6, 0, 1) ** 1.5
    fade_out = np.clip((DUR - t) / 1.5, 0, 1) ** 1.2
    mix *= fade_in * fade_out

    peak = np.abs(mix).max()
    mix = mix / peak * 0.92
    write_wav(os.path.join(ASSETS, "mix.wav"), mix)
    print("peak before norm", round(float(peak), 3), "-> wrote mix.wav")


if __name__ == "__main__":
    main()

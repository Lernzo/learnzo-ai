#!/usr/bin/env python3
"""Generates the original instrumental bed for the Leanzo Rescue Team intro.

Pure synthesis (no samples), so the music is 100% original and licence-free.
Style: cheerful ukulele/marimba kids' pop in C major, 124 BPM.

Output: rescue-team/audio/music/music_bed.wav (44.1 kHz, stereo, 32-bit float->16-bit)
"""
import os
import wave
import numpy as np

SR = 44100
DURATION = 60.0
BPM = 124.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT

OUT = os.path.join(os.path.dirname(__file__), "..", "audio", "music", "music_bed.wav")
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)

rng = np.random.default_rng(20261030)


def midi_hz(m):
    return 440.0 * 2.0 ** ((m - 69) / 12.0)


# ----------------------------------------------------------------------------
# instruments (all return mono float32 arrays)
# ----------------------------------------------------------------------------
def marimba(f, dur=0.55, vel=0.7):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = (
        np.sin(2 * np.pi * f * t) * np.exp(-t / 0.32)
        + 0.30 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.14)
        + 0.08 * np.sin(2 * np.pi * 3.98 * f * t) * np.exp(-t / 0.07)
    )
    atk = np.minimum(1.0, t / 0.004)
    return (x * atk * vel * 0.30).astype(np.float32)


def glock(f, dur=1.4, vel=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = (
        np.sin(2 * np.pi * f * t) * np.exp(-t / 0.9)
        + 0.45 * np.sin(2 * np.pi * 2.01 * f * t) * np.exp(-t / 0.5)
        + 0.20 * np.sin(2 * np.pi * 3.02 * f * t) * np.exp(-t / 0.25)
    )
    atk = np.minimum(1.0, t / 0.002)
    return (x * atk * vel * 0.20).astype(np.float32)


def bass(f, dur=0.5, vel=0.8):
    n = int(dur * SR)
    t = np.arange(n) / SR
    env = np.exp(-t / 0.30) * np.minimum(1.0, t / 0.008)
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.12)
    return (x * env * vel * 0.34).astype(np.float32)


def pad(freqs, dur, vel=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n, dtype=np.float64)
    for f in freqs:
        for h in range(1, 6):
            x += (1.0 / h ** 1.6) * np.sin(2 * np.pi * f * h * t + rng.uniform(0, 6.28))
    atk = np.minimum(1.0, t / 0.35)
    rel = np.minimum(1.0, (dur - t) / 0.45).clip(0, 1)
    return (x * atk * rel * vel * 0.035).astype(np.float32)


def kick(vel=0.9):
    n = int(0.30 * SR)
    t = np.arange(n) / SR
    f = 112 * np.exp(-t / 0.035) + 44
    phase = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(phase) * np.exp(-t / 0.10) * vel * 0.55).astype(np.float32)


def snare(vel=0.5):
    n = int(0.20 * SR)
    t = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    noise = np.diff(noise, prepend=0.0)  # cheap high-pass
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05) * 0.4
    return ((noise * np.exp(-t / 0.055) * 0.5 + tone) * vel * 0.28).astype(np.float32)


def shaker(vel=0.5):
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    noise = np.diff(noise, prepend=0.0)
    noise = np.diff(noise, prepend=0.0)
    return (noise * np.exp(-t / 0.022) * vel * 0.16).astype(np.float32)


def cymbal(vel=0.6, dur=2.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    noise = np.diff(noise, prepend=0.0)
    env = np.exp(-t / 0.7) * np.minimum(1.0, t / 0.003)
    return (noise * env * vel * 0.12).astype(np.float32)


def sparkle(vel=0.4, dur=1.6):
    """shimmering cluster used for magic / transitions"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n, dtype=np.float64)
    for f in (2093, 2637, 3136, 4186):
        x += np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * np.exp(-t / rng.uniform(0.3, 0.8))
    return (x * vel * 0.035).astype(np.float32)


# ----------------------------------------------------------------------------
# harmony plan
# ----------------------------------------------------------------------------
PROG = {
    "C":  dict(chord=[60, 64, 67, 72], bass=36),
    "G":  dict(chord=[59, 62, 67, 71], bass=31),
    "Am": dict(chord=[57, 60, 64, 69], bass=33),
    "F":  dict(chord=[57, 60, 65, 69], bass=29),
}
# a gentle melodic motif, one entry per bar of the loop (beats -> scale degree note)
MOTIF = [
    [(0.0, 79), (0.75, 76), (1.5, 79), (2.25, 81), (3.0, 79)],
    [(0.0, 74), (0.75, 76), (1.5, 74), (2.25, 71), (3.0, 74)],
    [(0.0, 72), (0.75, 74), (1.5, 76), (2.25, 81), (3.0, 79)],
    [(0.0, 77), (0.75, 76), (1.5, 74), (2.25, 72), (3.0, 69)],
]

# sections: (start, end, mood)
SECTIONS = [
    (0.0, 9.3, "intro"),
    (9.3, 16.4, "build"),
    (16.4, 35.0, "full"),
    (35.0, 43.8, "full"),
    (43.8, 51.2, "soft"),
    (51.2, 60.0, "finale"),
]

TRANSITIONS = [9.3, 16.4, 25.4, 35.0, 43.8, 51.2, 57.6]


def mood_at(t):
    for a, b, m in SECTIONS:
        if a <= t < b:
            return m, a, b
    return "finale", 51.2, 60.0


def build():
    n = int(DURATION * SR)
    L = np.zeros(n, dtype=np.float64)
    R = np.zeros(n, dtype=np.float64)

    def add(sig, t0, pan=0.0, gain=1.0):
        i = int(t0 * SR)
        if i >= n or i < 0:
            return
        seg = sig[: max(0, n - i)]
        gl = gain * np.sqrt((1 - pan) / 2) * 1.4142
        gr = gain * np.sqrt((1 + pan) / 2) * 1.4142
        L[i:i + len(seg)] += seg * gl
        R[i:i + len(seg)] += seg * gr

    bars = int(np.ceil(DURATION / BAR)) + 1
    for b in range(bars):
        t_bar = b * BAR
        if t_bar >= DURATION:
            break
        mood, s0, s1 = mood_at(t_bar + 0.01)
        # chord choice: same 4-bar loop everywhere, soft section leans minor
        if mood == "soft":
            names = ["Am", "F", "C", "G"]
        else:
            names = ["C", "G", "Am", "F"]
        name = names[b % 4]
        ch = PROG[name]

        # --- pad (always, quiet)
        if mood != "soft":
            add(pad([midi_hz(m - 12) for m in ch["chord"]], BAR * 1.05, 0.55), t_bar)
        else:
            add(pad([midi_hz(m - 12) for m in ch["chord"][:3]], BAR * 1.05, 0.75), t_bar)

        # --- marimba arpeggio (eighths)
        pattern = [0, 1, 2, 3, 2, 1, 2, 3]
        vel = {"intro": 0.42, "build": 0.55, "full": 0.62, "soft": 0.34, "finale": 0.60}[mood]
        for k, idx in enumerate(pattern):
            t = t_bar + k * BEAT / 2
            if t >= DURATION:
                break
            m = ch["chord"][idx]
            pan = -0.35 if k % 2 == 0 else 0.35
            add(marimba(midi_hz(m), 0.5, vel * (1.0 if k in (0, 4) else 0.8)), t, pan)

        # --- bass
        if mood in ("build", "full", "finale"):
            add(bass(midi_hz(ch["bass"]), 0.45, 0.9), t_bar)
            add(bass(midi_hz(ch["bass"]), 0.42, 0.7), t_bar + 2 * BEAT)
            if mood in ("full", "finale"):
                add(bass(midi_hz(ch["bass"] + 7), 0.35, 0.6), t_bar + 3.5 * BEAT)
        elif mood == "soft":
            add(bass(midi_hz(ch["bass"]), 0.9, 0.55), t_bar)
        elif mood == "intro":
            add(bass(midi_hz(ch["bass"]), 0.9, 0.40), t_bar)

        # --- melody motif
        if mood in ("full", "finale"):
            for off, note in MOTIF[b % 4]:
                t = t_bar + off * BEAT
                if t >= DURATION:
                    continue
                add(glock(midi_hz(note), 1.2, 0.55), t, 0.15)
                add(marimba(midi_hz(note - 12), 0.5, 0.35), t, 0.0)
        elif mood == "build" and b % 2 == 0:
            for off, note in MOTIF[b % 4][:3]:
                add(glock(midi_hz(note), 1.0, 0.34), t_bar + off * BEAT, 0.15)

        # --- drums
        if mood in ("build", "full", "finale"):
            for beat in range(4):
                t = t_bar + beat * BEAT
                if t >= DURATION:
                    break
                if mood in ("full", "finale") or beat % 2 == 0:
                    add(kick(0.9 if beat % 2 == 0 else 0.65), t)
                add(shaker(0.55 if beat % 2 else 0.35), t + BEAT / 2, 0.3)
            if mood in ("full", "finale"):
                add(snare(0.55), t_bar + 1 * BEAT, -0.1)
                add(snare(0.55), t_bar + 3 * BEAT, -0.1)
        elif mood == "intro":
            add(shaker(0.35), t_bar + 1 * BEAT, 0.25)
            add(shaker(0.35), t_bar + 3 * BEAT, 0.25)
        elif mood == "soft":
            add(shaker(0.22), t_bar + 2 * BEAT, 0.25)

    # --- transitions: sparkles + cymbal swells
    for t in TRANSITIONS:
        if t >= DURATION:
            continue
        add(sparkle(0.55, 1.8), t - 0.05, 0.1)
        if t >= 16.0:
            add(cymbal(0.45, 1.8), t, 0.0)
    # opening magic
    add(sparkle(0.45, 2.0), 0.15, -0.1)
    add(glock(midi_hz(84), 1.6, 0.5), 0.30, 0.2)

    # final chord (held, gentle fade)
    final_t = 57.6
    for m, v in ((60, 0.9), (64, 0.8), (67, 0.8), (72, 0.7), (79, 0.55)):
        add(marimba(midi_hz(m), 2.6, v * 0.55), final_t, 0.0)

    return L, R


def reverb(L, R, wet=0.16, dur=1.6):
    n_ir = int(dur * SR)
    t = np.arange(n_ir) / SR
    ir = rng.normal(0, 1, n_ir) * np.exp(-t / 0.42)
    ir[: int(0.012 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))

    def conv(x):
        size = 1 << int(np.ceil(np.log2(len(x) + len(ir))))
        X = np.fft.rfft(x, size)
        H = np.fft.rfft(ir, size)
        y = np.fft.irfft(X * H, size)[: len(x)]
        return y

    return L + wet * conv(L), R + wet * conv(R)


def main():
    L, R = build()
    L, R = reverb(L, R)

    # gentle fade in / out
    n = len(L)
    t = np.arange(n) / SR
    env = np.minimum(1.0, t / 1.2) * np.minimum(1.0, (DURATION - t) / 1.6).clip(0, 1)
    # master "finale swell" - a touch of lift into the last section
    env *= 1.0 + 0.10 * np.clip((t - 51.2) / 2.0, 0, 1)
    L *= env
    R *= env

    peak = max(np.max(np.abs(L)), np.max(np.abs(R)))
    L = L / peak * 0.75
    R = R / peak * 0.75
    stereo = np.stack([L, R], axis=1)
    pcm = np.clip(stereo, -1, 1)
    pcm = (pcm * 32767).astype(np.int16)

    with wave.open(os.path.abspath(OUT), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("wrote", os.path.abspath(OUT), f"{n / SR:.2f}s")


if __name__ == "__main__":
    main()

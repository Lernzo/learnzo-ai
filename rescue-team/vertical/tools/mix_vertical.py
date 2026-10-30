#!/usr/bin/env python3
"""Audio master for the vertical 9:16 cut.

- voices placed per plan.json, chorus line stacked from three cast members
- original instrumental bed (re-used from the 60s film) ducked under speech
- fades in/out to the planned total length
Output: vertical/audio/master.wav
"""
import json
import os
import subprocess
import wave

import numpy as np
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
VO = os.path.join(ROOT, "vo")
BED = os.path.abspath(os.path.join(ROOT, "..", "audio", "music", "music_bed.wav"))
OUT = os.path.join(ROOT, "audio", "master.wav")
PLAN = os.path.join(ROOT, "plan.json")


def load_any(path):
    raw = subprocess.run(
        [FF, "-v", "error", "-i", path, "-f", "f32le", "-acodec", "pcm_f32le",
         "-ac", "1", "-ar", str(SR), "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def load_bed(path):
    with wave.open(path) as w:
        assert w.getframerate() == SR
        n = w.getnframes()
        x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768
        return x.reshape(-1, 2)


def trim_silence(x, thresh=0.004, pad=0.035):
    idx = np.where(np.abs(x) > thresh)[0]
    if not len(idx):
        return x
    return x[max(0, idx[0] - int(pad * SR)): min(len(x), idx[-1] + int(pad * SR))]


def rms(x):
    return float(np.sqrt(np.mean(x ** 2)) + 1e-9)


def main():
    plan = json.load(open(PLAN))
    total = plan["duration"]
    n = int(total * SR)
    voice = np.zeros(n, dtype=np.float32)

    def place(path, at, gain=1.0, target=0.115):
        x = trim_silence(load_any(path))
        g = np.clip(target / rms(x), 0.35, 2.8) * gain
        x = np.tanh(x * g * 0.9) / 0.9
        i = int(at * SR)
        seg = x[: max(0, n - i)]
        voice[i:i + len(seg)] += seg
        return len(x) / SR

    print("voice placement")
    for s in plan["shots"]:
        if not s.get("vo"):
            continue
        d = place(os.path.join(VO, s["vo"]), s["vo_at"])
        line = f"  {s['speaker']:15s} {s['vo_at']:6.2f}s  {d:5.2f}s"
        if s.get("chorus"):
            # group shout: the other cast members stacked just behind, quieter
            for k, c in enumerate(s["chorus"]):
                place(os.path.join(VO, c), s["vo_at"] + 0.045 * (k + 1),
                      gain=0.62)
            line += "  + 2 chorus voices"
        print(line)

    # ------------------------------------------------------------ ducking
    frame = int(0.01 * SR)
    env = np.abs(voice[:(len(voice) // frame) * frame]).reshape(-1, frame).max(axis=1)
    active = (env > 0.012).astype(np.float32)
    duck = np.ones_like(active)
    lvl = 1.0
    for i, a in enumerate(active):
        target = 0.34 if a else 1.0
        lvl += (target - lvl) * (0.55 if target < lvl else 0.06)
        duck[i] = lvl
    duck = np.repeat(duck, frame)
    duck = np.pad(duck, (0, n - len(duck)), mode="edge")

    bed = load_bed(BED)
    if len(bed) < n:
        bed = np.pad(bed, ((0, n - len(bed)), (0, 0)))
    bed = bed[:n].copy()

    # sectional lift so the bed follows the picture (intro soft, outro big)
    t = np.arange(n) / SR
    lift = np.interp(t, [0, 2.5, 3.4, 32.8, 37.0, total - 1.2, total],
                     [0.55, 0.62, 0.80, 0.86, 0.95, 0.85, 0.0])
    bed_gain = 0.78

    m = bed * (bed_gain * lift * (0.34 + 0.66 * duck))[:, None]
    v = np.stack([voice, voice], axis=1)
    mix = m + v

    # fades
    env_fade = np.minimum(1.0, t / 0.8) * np.minimum(1.0, (total - t) / plan["fade_out"]).clip(0, 1)
    mix *= env_fade[:, None]

    peak = np.max(np.abs(mix))
    if peak > 0.93:
        mix = np.tanh(mix / peak * 1.2) / np.tanh(1.2) * 0.93

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
    with wave.open(OUT, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())

    print(f"\nwrote {OUT}")
    print(f"  duration   {n / SR:.2f}s")
    print(f"  peak       {20 * np.log10(np.max(np.abs(mix)) + 1e-9):.1f} dBFS")
    print(f"  voice rms  {20 * np.log10(rms(voice[voice != 0])):.1f} dBFS (speaking)")
    print(f"  bed rms    {20 * np.log10(rms(m)):.1f} dBFS")


if __name__ == "__main__":
    main()

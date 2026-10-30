#!/usr/bin/env python3
"""Builds the final 60s audio master: voices placed on the timeline, sitting on
top of the original music bed with automatic ducking. Output is analysed for
peak/loudness sanity before it is written.

Inputs : rescue-team/audio/vo/*.mp3, rescue-team/audio/music/music_bed.wav
Output : rescue-team/audio/master.wav
"""
import os
import subprocess
import wave
import numpy as np

import timeline as TL
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
VO_DIR = os.path.join(ROOT, "audio", "vo")
MUSIC = os.path.join(ROOT, "audio", "music", "music_bed.wav")
OUT = os.path.join(ROOT, "audio", "master.wav")


def load_any(path):
    """decode any audio to mono float32 at SR via ffmpeg"""
    raw = subprocess.run(
        [FF, "-v", "error", "-i", path, "-f", "f32le", "-acodec", "pcm_f32le",
         "-ac", "1", "-ar", str(SR), "-"],
        check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def load_wav(path):
    with wave.open(path) as w:
        assert w.getframerate() == SR
        n = w.getnframes()
        x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768
        return x.reshape(-1, 2)


def trim_silence(x, thresh=0.004, pad=0.04):
    idx = np.where(np.abs(x) > thresh)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(pad * SR))
    b = min(len(x), idx[-1] + int(pad * SR))
    return x[a:b]


def rms(x):
    return float(np.sqrt(np.mean(x ** 2)) + 1e-9)


def main():
    n = int(TL.TOTAL * SR)
    voice = np.zeros(n, dtype=np.float32)

    print("voice over placement")
    for item in TL.VO:
        path = os.path.join(VO_DIR, item["clip"])
        x = load_any(path)
        if item.get("trim"):
            a, b = item["trim"]
            x = x[int(a * SR): int(b * SR)]
        x = trim_silence(x)
        # consistent perceived level across the cast
        target = 0.115                      # ~ -18.8 dBFS rms while talking
        g = np.clip(target / rms(x), 0.35, 2.8)
        x = x * g
        x = np.tanh(x * 0.9) / 0.9          # gentle peak rounding
        i = int(item["at"] * SR)
        seg = x[: n - i]
        voice[i:i + len(seg)] += seg
        print(f"  {item['who']:9s} {item['clip']:26s} {item['at']:6.2f}s  "
              f"len {len(x) / SR:5.2f}s  gain x{g:.2f}")

    # ---- ducking envelope driven by the voice track
    frame = int(0.01 * SR)
    env = np.abs(voice[: (len(voice) // frame) * frame]).reshape(-1, frame).max(axis=1)
    active = (env > 0.012).astype(np.float32)
    # smooth: fast attack, slow release
    duck = np.ones_like(active)
    level = 1.0
    atk, rel = 0.55, 0.06
    for i, a in enumerate(active):
        target = 0.30 if a else 1.0
        level += (target - level) * (atk if target < level else rel)
        duck[i] = level
    duck_full = np.repeat(duck, frame)
    duck_full = np.pad(duck_full, (0, len(voice) - len(duck_full)), mode="edge")

    music = load_wav(MUSIC)
    if len(music) < n:
        music = np.pad(music, ((0, n - len(music)), (0, 0)))
    music = music[:n]

    # music bed is wide; voice is mono -> centre.
    # bed sits ~8 dB lower while somebody is talking.
    bed_gain = 0.80
    m = music * (bed_gain * (0.38 + 0.62 * duck_full))[:, None]
    v = np.stack([voice, voice], axis=1)

    mix = m + v
    peak = np.max(np.abs(mix))
    if peak > 0.93:                     # brick-wall safety only
        mix = np.tanh(mix / peak * 1.2) / np.tanh(1.2) * 0.93
    print(f"\n  bed solo rms  {20 * np.log10(rms(music) * bed_gain):.1f} dBFS")
    print(f"  voice rms     {20 * np.log10(rms(voice[voice != 0])):.1f} dBFS (speaking)")

    pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
    with wave.open(OUT, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())

    print(f"\nwrote {OUT}")
    print(f"  duration      {n / SR:.2f}s")
    print(f"  peak          {20 * np.log10(np.max(np.abs(mix)) + 1e-9):.1f} dBFS")
    print(f"  rms (all)     {20 * np.log10(np.sqrt(np.mean(mix ** 2))):.1f} dBFS")
    print(f"  rms (voice)   {20 * np.log10(rms(voice)):.1f} dBFS")
    print(f"  duck depth    {20 * np.log10(0.38):.1f} dB under speech")


if __name__ == "__main__":
    main()

"""Build the soundtrack: original music bed + SFX + the recorded character voices.

Everything is synthesised with numpy (no external samples), so the score and the
sound design are licence-free and can be re-timed by editing plan.py.
"""
import os
import subprocess
import wave
import numpy as np

import plan

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = plan.BUILD
VO = os.path.join(BUILD, "vo")
FF = None


def ffmpeg():
    global FF
    if FF is None:
        import imageio_ffmpeg
        FF = imageio_ffmpeg.get_ffmpeg_exe()
    return FF


def decode_all():
    os.makedirs(VO, exist_ok=True)
    table = dict(plan.VOICES, **plan.OPTIONAL)
    for name, (fn, who, text) in table.items():
        src = os.path.join(plan.AUDIO, fn)
        dst = os.path.join(VO, fn.replace(".mp3", ".wav"))
        if not os.path.exists(src):
            continue
        subprocess.run([ffmpeg(), "-y", "-v", "error", "-i", src,
                        "-ac", "1", "-ar", str(SR), "-acodec", "pcm_s16le", dst],
                       check=True)


def load_vo(name):
    table = dict(plan.VOICES, **plan.OPTIONAL)
    path = os.path.join(VO, table[name][0].replace(".mp3", ".wav"))
    if not os.path.exists(path):
        return None
    with wave.open(path, "rb") as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32)
    x /= 32768.0
    # gentle trim of leading/trailing silence
    env = np.abs(x)
    idx = np.where(env > 0.01)[0]
    if len(idx):
        x = x[max(0, idx[0] - 400): idx[-1] + 1200]
    return x


# ----------------------------------------------------------------- primitives
def env_adsr(n, a=0.01, d=0.1, s=0.7, r=0.2):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    a, d, r = max(a, 1), max(d, 1), max(r, 1)
    s_len = max(n - a - d - r, 0)
    e = np.concatenate([
        np.linspace(0, 1, a),
        np.linspace(1, s, d),
        np.full(s_len, s),
        np.linspace(s, 0, r) if r else np.array([]),
    ])
    if len(e) < n:
        e = np.pad(e, (0, n - len(e)))
    return e[:n]


def note_hz(name):
    names = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6,
             "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    pitch, octave = name[:-1], int(name[-1])
    midi = 12 * (octave + 1) + names[pitch]
    return 440.0 * 2 ** ((midi - 69) / 12.0)


def bell(freq, dur=1.2, amp=0.3, bright=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    partials = [(1.0, 1.0), (2.01, 0.42 * bright), (3.02, 0.2 * bright), (4.7, 0.1 * bright)]
    x = np.zeros(n)
    for mult, g in partials:
        x += g * np.sin(2 * np.pi * freq * mult * t) * np.exp(-t * (3.2 + mult))
    x *= amp
    return x * env_adsr(n, 0.004, 0.02, 0.6, min(0.35, dur * 0.4))


def pluck(freq, dur=0.5, amp=0.25):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(4 * np.pi * freq * t)
    x += 0.12 * (np.random.rand(n) * 2 - 1)
    x *= np.exp(-t * 9)
    return x * amp


def pad(freqs, dur, amp=0.06):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for f in freqs:
        for det in (-0.4, 0.0, 0.4):
            x += np.sin(2 * np.pi * (f + det) * t + np.random.rand() * 6)
    x /= (len(freqs) * 3)
    x *= env_adsr(n, min(0.4, dur * 0.3), 0.2, 0.8, min(0.5, dur * 0.3))
    return x * amp


def shaker(dur=0.08, amp=0.06):
    n = int(dur * SR)
    noise = np.random.randn(n)
    noise = np.diff(noise, prepend=0.0)          # crude high-pass
    return noise * np.exp(-np.arange(n) / (0.25 * n)) * amp


def clap(amp=0.12):
    n = int(0.16 * SR)
    noise = np.random.randn(n)
    e = np.exp(-np.arange(n) / (0.12 * n))
    return noise * e * amp


def kick(amp=0.22):
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    f = 110 * np.exp(-t * 18) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * amp


def horn(amp=0.16):
    n = int(0.55 * SR)
    t = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * 392 * t)) + np.sign(np.sin(2 * np.pi * 494 * t))
    x = 0.5 * x * env_adsr(n, 0.02, 0.05, 0.8, 0.2)
    return x * amp


# ------------------------------------------------------------------- the score
CHORDS = {
    "C":  ["C3", "E3", "G3"],
    "Am": ["A2", "C3", "E3"],
    "F":  ["F2", "A2", "C3"],
    "G":  ["G2", "B2", "D3"],
}
PROG = ["C", "Am", "F", "G"]
MELODY = ["E5", "G5", "C6", "B5", "G5", "A5", "G5", "E5"]   # main theme, 8 notes / 8 beats
BEAT = 60.0 / 100.0


def build_music(total):
    n = int((total + 2) * SR)
    left = np.zeros(n, np.float32)
    right = np.zeros(n, np.float32)

    def add(sig, t0, pan=0.0, gain=1.0):
        i = int(t0 * SR)
        if i < 0 or i >= n:
            return
        seg = sig[: max(0, n - i)]
        l = gain * (1 - max(0.0, pan)) * 0.5 + gain * 0.5
        r = gain * (1 + min(0.0, pan)) * 0.5 + gain * 0.5
        left[i:i + len(seg)] += seg * l
        right[i:i + len(seg)] += seg * r

    def section(t0, t1):
        return max(0.0, min(t1, total) - max(t0, 0.0))

    # ---- arrangement map: which layers are on in which window
    windows = [
        # (start, end, pad, bass, bells, shaker, claps, kicks)
        (0.0, 8.0, 0.9, 0.0, 0.5, 0.0, 0.0, 0.0),
        (8.0, 22.0, 0.7, 0.7, 0.8, 0.5, 0.0, 0.4),
        (22.0, 40.0, 0.6, 0.6, 0.7, 0.5, 0.0, 0.3),
        (40.0, 56.0, 0.8, 1.0, 1.0, 1.0, 1.0, 1.0),
        (56.0, 68.0, 0.9, 0.9, 0.9, 0.8, 0.6, 0.7),
        (68.0, 88.0, 1.0, 0.3, 0.7, 0.3, 0.0, 0.0),
        (88.0, 117.4, 0.8, 0.6, 1.0, 0.7, 0.3, 0.4),
        (117.4, 142.0, 0.8, 1.0, 1.0, 1.0, 1.0, 1.0),
        (142.0, 164.0, 0.7, 0.6, 0.9, 0.5, 0.0, 0.3),
        (164.0, 176.0, 0.9, 1.0, 1.0, 1.0, 1.0, 1.0),
        (176.0, 186.0, 1.0, 0.4, 0.7, 0.2, 0.0, 0.0),
    ]

    def layers(t):
        for (a, b, p, ba, be, sh, cl, ki) in windows:
            if a <= t < b:
                return dict(pad=p, bass=ba, bell=be, shaker=sh, clap=cl, kick=ki)
        return dict(pad=0.3, bass=0.0, bell=0.3, shaker=0.0, clap=0.0, kick=0.0)

    bars = int(np.ceil(total / (4 * BEAT))) + 1
    for bar in range(bars):
        t_bar = bar * 4 * BEAT
        chord = PROG[bar % 4]
        L = layers(t_bar + 0.01)
        # pad + bass, one chord per bar
        if L["pad"] > 0:
            add(pad([note_hz(x) for x in CHORDS[chord]], 4 * BEAT, 0.09 * L["pad"]), t_bar, -0.2)
        if L["bass"] > 0:
            for b in range(4):
                f = note_hz(CHORDS[chord][0]) / 2
                add(pluck(f, 0.45, 0.22 * L["bass"]), t_bar + b * BEAT, 0.05)
        if L["bell"] > 0:
            for b in range(0, 8):
                idx = (bar * 8 + b) % len(MELODY)
                note = MELODY[idx]
                # lift the melody an octave every 4th bar for sparkle
                add(bell(note_hz(note), 0.9, 0.13 * L["bell"]), t_bar + b * BEAT / 2,
                    0.25 if b % 2 else -0.25)
                if b % 4 == 2:
                    add(bell(note_hz(note) * 1.5, 0.7, 0.07 * L["bell"]), t_bar + b * BEAT / 2, 0.4)
        if L["shaker"] > 0:
            for b in range(8):
                add(shaker(0.07, 0.05 * L["shaker"] * (1.0 if b % 2 else 0.7)),
                    t_bar + b * BEAT / 2, 0.35)
        if L["clap"] > 0:
            for b in (1, 3):
                add(clap(0.1 * L["clap"]), t_bar + b * BEAT, 0.0)
        if L["kick"] > 0:
            for b in (0, 2):
                add(kick(0.16 * L["kick"]), t_bar + b * BEAT, 0.0)

    # harp glissandi at the magical moments
    for t0 in (68.4, 86.2, 142.6, 153.6, 176.4):
        scale = ["C5", "D5", "E5", "G5", "A5", "C6", "D6", "E6", "G6"]
        for i, nt in enumerate(scale):
            add(bell(note_hz(nt), 0.8, 0.07), t0 + i * 0.055, -0.4 + i * 0.1)
    return left, right


# ------------------------------------------------------------------------ sfx
def sfx_bank():
    bank = {}
    # engine: low saw with wobble + filtered noise
    n = int(3.0 * SR)
    t = np.arange(n) / SR
    f = 70 + 12 * np.sin(2 * np.pi * 2.4 * t)
    saw = 2 * ((np.cumsum(f) / SR) % 1.0) - 1
    noise = np.random.randn(n)
    noise = np.convolve(noise, np.ones(60) / 60, mode="same")
    bank["engine"] = (0.5 * saw + 0.9 * noise) * env_adsr(n, 0.25, 0.3, 0.8, 0.6) * 0.13

    # whoosh: band-passed noise sweep
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    noise = np.random.randn(n)
    for _ in range(3):
        noise = np.convolve(noise, np.ones(24) / 24, mode="same")
    env = np.exp(-((t - 0.45) ** 2) / 0.02)
    bank["whoosh"] = noise * env * 0.5

    # sparkle: rising cluster of bells
    n = int(2.6 * SR)
    x = np.zeros(n)
    for i, nt in enumerate(["C6", "E6", "G6", "C7", "E7", "G7", "C7"]):
        b = bell(note_hz(nt), 1.1, 0.10)
        s = int(0.05 * i * SR)
        x[s:s + len(b)] += b[: max(0, n - s)]
    bank["sparkle"] = x

    # chime: warm major triad
    n = int(1.8 * SR)
    x = np.zeros(n)
    for nt in ["C6", "E6", "G6", "C7"]:
        b = bell(note_hz(nt), 1.6, 0.12)
        x[: len(b)] += b
    bank["chime"] = x

    n = int(1.8 * SR)
    x = np.zeros(n)
    for nt in ["F5", "A5", "C6", "F6"]:
        b = bell(note_hz(nt), 1.6, 0.12)
        x[: len(b)] += b
    bank["chime2"] = x

    # pop
    n = int(0.28 * SR)
    t = np.arange(n) / SR
    f = 700 + 900 * t / t[-1]
    bank["pop"] = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22) * 0.22

    # horn
    bank["horn"] = horn(0.16)

    # door_slide: a soft servo whirr with a rubbery slide
    n = int(1.5 * SR)
    t = np.arange(n) / SR
    noise = np.random.randn(n)
    for _ in range(4):
        noise = np.convolve(noise, np.ones(18) / 18, mode="same")
    whirr = np.sin(2 * np.pi * np.cumsum(150 + 60 * np.sin(2 * np.pi * 9 * t)) / SR)
    env = np.clip(np.sin(np.pi * np.clip(t / 1.35, 0, 1)), 0, 1) ** 0.7
    bank["door_slide"] = (noise * 0.30 + whirr * 0.05) * env

    # step: a small wooden thud up the bus stair
    n = int(0.30 * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * 118 * t) * np.exp(-t * 26)
    knock = np.random.randn(n) * np.exp(-t * 90) * 0.25
    bank["step"] = (body * 0.30 + knock) * 0.9

    # cheer: noise swell + bells (soft, never harsh)
    n = int(3.0 * SR)
    t = np.arange(n) / SR
    noise = np.random.randn(n)
    noise = np.convolve(noise, np.ones(80) / 80, mode="same")
    swell = np.clip(np.sin(np.pi * np.clip(t / 2.4, 0, 1)) ** 2, 0, 1)
    x = noise * swell * 0.16
    for i, nt in enumerate(["C6", "D6", "E6", "G6"]):
        b = bell(note_hz(nt), 1.2, 0.06)
        s = int(0.12 * i * SR)
        x[s:s + len(b)] += b[: max(0, n - s)]
    bank["cheer"] = x
    return bank


def main():
    decode_all()
    plan.write_json()
    total = plan.END
    left, right = build_music(total)
    n = left.shape[0]

    def place(sig, t0, gain=1.0, pan=0.0):
        i = int(t0 * SR)
        seg = sig[: max(0, n - i)]
        left[i:i + len(seg)] += seg * gain * (1 - max(0, pan)) * 0.65 + seg * gain * 0.35
        right[i:i + len(seg)] += seg * gain * (1 + min(0, pan)) * 0.65 + seg * gain * 0.35

    bank = sfx_bank()
    for kind, t0, ln in plan.SFX:
        sig = bank.get({"engine_in": "engine", "engine_out": "engine"}.get(kind, kind))
        if sig is None:
            continue
        if kind == "engine_in":
            sig = sig * np.linspace(0.2, 1.0, len(sig))
        if kind == "engine_out":
            sig = sig * np.linspace(1.0, 0.1, len(sig))
        place(sig, t0, 1.0)

    # voices sit on top, slightly narrowed and lifted
    vo_bus = np.zeros(n, np.float32)
    for name, t0 in plan.CUES:
        x = load_vo(name)
        if x is None:
            print("  (missing voice clip: %s)" % name)
            continue
        i = int(t0 * SR)
        seg = x[: max(0, n - i)]
        vo_bus[i:i + len(seg)] += seg
        print("  voice %-16s at %6.2f  %.2fs" % (name, t0, len(x) / SR))

    # de-ess / warm the voices a touch + make them a little "cartoon"
    vo = vo_bus
    vo = np.convolve(vo, np.ones(6) / 6, mode="same")
    vo = np.tanh(vo * 1.15) * 0.9

    # duck the music under dialogue
    env = np.abs(vo)
    k = int(0.08 * SR)
    env = np.convolve(env, np.ones(k) / k, mode="same")
    duck = 1.0 - 0.55 * np.clip(env / 0.06, 0, 1)
    k2 = int(0.25 * SR)
    duck = np.convolve(duck, np.ones(k2) / k2, mode="same")

    mix_l = left * duck + vo * 1.0
    mix_r = right * duck + vo * 1.0

    # master: glue compression (soft knee) then normalise for a punchy kids mix
    peak_pre = max(np.abs(mix_l).max(), np.abs(mix_r).max(), 1e-6)
    g_in = 1.25 / peak_pre
    for ch in (mix_l, mix_r):
        ch *= g_in
        np.tanh(ch * 2.2, out=ch)
        ch /= np.tanh(2.2)
    fi, fo = int(0.6 * SR), int(1.5 * SR)
    for ch in (mix_l, mix_r):
        ch[:fi] *= np.linspace(0, 1, fi)
        ch[-fo:] *= np.linspace(1, 0, fo)

    peak = max(np.abs(mix_l).max(), np.abs(mix_r).max())
    g = 0.89 / max(peak, 1e-6)
    mix_l *= g
    mix_r *= g

    stereo = np.stack([mix_l, mix_r], axis=1)
    pcm = (np.clip(stereo, -1, 1) * 32767).astype(np.int16)
    out = os.path.join(BUILD, "mix.wav")
    with wave.open(out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("wrote", out, "%.1fs" % (len(mix_l) / SR))


if __name__ == "__main__":
    main()

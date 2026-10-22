"""Render the opening shot to MP4 (frames + mixed audio)."""
import multiprocessing as mp
import os
import subprocess
import sys
import time

import imageio_ffmpeg
import numpy as np

import film

OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "output",
                                   "rainbow-bus-opening.mp4"))
WAV = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "mix.wav"))
NFRAMES = int(film.T_END * film.FPS)


def work(i):
    img, _ = film.render_frame(i)
    return i, img.tobytes()


def main():
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [ff, "-y", "-hide_banner", "-loglevel", "error",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{film.W}x{film.H}",
           "-r", str(film.FPS), "-i", "-",
           "-i", WAV,
           "-c:v", "libx264", "-preset", "medium", "-crf", "18",
           "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.1",
           "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
           "-shortest", "-movflags", "+faststart",
           "-metadata", "title=The Magic Rainbow Bus - Episode 1 Opening",
           OUT]
    print("encoding to", OUT, "frames:", NFRAMES, flush=True)
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    t0 = time.time()
    try:
        with mp.Pool(2) as pool:
            for k, (i, buf) in enumerate(pool.imap(work, range(NFRAMES), chunksize=1)):
                proc.stdin.write(buf)
                if k % 24 == 0:
                    el = time.time() - t0
                    rate = (k + 1) / max(el, 1e-6)
                    print(f"  frame {k+1}/{NFRAMES}  {rate:.2f} fps  eta {int((NFRAMES-k-1)/max(rate,1e-6))}s",
                          flush=True)
    finally:
        proc.stdin.close()
        proc.wait()
    print("done in", round(time.time() - t0, 1), "s -> rc", proc.returncode)


if __name__ == "__main__":
    main()

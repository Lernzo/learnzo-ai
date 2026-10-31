"""Render the key-art poster from the same episode renderer."""
import os
import sys

import cv2

import make_video as M

if __name__ == "__main__":
    ep = M.Episode()
    t = float(sys.argv[1]) if len(sys.argv) > 1 else 6.4
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(M.HERE, "magical-rainbow-bus-poster.png")
    frame = ep.render(t)
    cv2.imwrite(out, frame)
    print("wrote", out, frame.shape)

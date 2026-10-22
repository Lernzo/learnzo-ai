import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import Canvas, hexc
from characters import render_sprite
from PIL import Image, ImageFont

W, H = 1920, 1080
c = Canvas(W, H)
c.grad_rrect(0, 0, W, 640, 0, hexc("D9F0FC"), hexc("EFFAF7"), "v")
c.grad_rrect(0, 620, W, H, 0, hexc("A2D9A2"), hexc("84C784"), "v")

FB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "fonts") + "/fredoka-latin-600.ttf"
FN = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "fonts") + "/nunito-latin-700.ttf"
f_title = ImageFont.truetype(FB, 76)
f_sub = ImageFont.truetype(FN, 26)
f_name = ImageFont.truetype(FB, 40)
f_desc = ImageFont.truetype(FN, 22)
f_head = ImageFont.truetype(FB, 36)

c.text((960, 90), "THE MAGIC RAINBOW BUS", f_title, hexc("23424F"), anchor="ms")
c.text((960, 148), "Cast sheet  ·  Episode 1  ·  Learnzo", f_sub, hexc("5B7A85"), anchor="ms")

items = [
    ("sunny", dict(mood="curious"), "Sunny", "golden school bus · rainbow badge", 1.02),
    ("pip", dict(), "Pip", "white rabbit · mint backpack", 1.48),
    ("milo", dict(), "Milo", "caramel puppy · sky-blue bandana", 1.46),
    ("pogo", dict(), "Pogo", "bright-green frog · leaf cap", 1.55),
    ("ducky", dict(), "Ducky", "yellow duckling · aqua scarf", 1.60),
    ("bea", dict(), "Bea", "purple butterfly · dotted wings", 1.75),
]
xs = [235, 520, 790, 1050, 1290, 1515]
ground = 600
for (name, kw, label, desc, sc), x in zip(items, xs):
    img, (ax, ay) = render_sprite(name, 0.85, sc, **kw)
    c.img.alpha_composite(img, (int(x * 2 - ax * 2), int(ground * 2 - ay * 2)))
    c.text((x, ground + 48), label, f_name, hexc("23424F"), anchor="ms")
    c.text((x, ground + 84), desc, f_desc, hexc("4E6B76"), anchor="ms")

# divider
c.line([(140, 742), (1780, 742)], hexc("6FB273"), 2.0)

# expressions strip on the right, legend on the left
c.text((150, 806), "Sunny's expressions", f_head, hexc("23424F"), anchor="ls")
c.text((150, 858), "Curious at the water's edge. Worried when the bridge is gone.", f_desc, hexc("41606C"), anchor="ls")
c.text((150, 892), "Then determined to bring the colours back.", f_desc, hexc("41606C"), anchor="ls")
c.text((150, 964), "Badge bands turn grey without the rainbow bridge,", f_desc, hexc("52707B"), anchor="ls")
c.text((150, 996), "and glow back to colour once the adventure begins.", f_desc, hexc("52707B"), anchor="ls")

mx = 1210
for mood, label in (("curious", "curious"), ("worry", "bridge is gone"), ("determined", "determined")):
    img, (ax, ay) = render_sprite("sunny", 0.85, 0.56, mood=mood,
                                  badge_fill=0.95 if mood == "determined" else 0.0)
    c.img.alpha_composite(img, (int(mx * 2 - ax * 2), int(1000 * 2 - ay * 2)))
    c.text((mx, 1036), label, f_desc, hexc("41606C"), anchor="ms")
    mx += 215

c.flush_alpha()
c.finish().convert("RGB").save(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'output', 'cast-sheet.png'))
print("ok")

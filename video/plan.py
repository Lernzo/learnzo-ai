"""Single source of truth for the episode timeline.

Both the soundtrack build and the picture build import this, so every line of
dialogue, song lyric and colour beat lands on exactly the same frame.
"""
import json
import os
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
AUDIO = os.path.join(HERE, "audio")
BUILD = os.path.join(HERE, "build")

FPS = 30
W, H = 1920, 1080

# ---------------------------------------------------------------- voice clips
# name -> (file, character, on-screen caption)
VOICES = {
    "maggie_intro":   ("maggie_intro.mp3",   "Maggie",  "Good morning, little friends! Are you ready for a magical adventure?"),
    "bunny_yay":      ("bunny_yay.mp3",      "Bunny",   "Yay! Maggie's here!"),
    "buddy_go":       ("buddy_go.mp3",       "Buddy",   "Let's go!"),
    "leo_wait":       ("leo_wait.mp3",       "Leo",     "I can't wait!"),
    "ellie_fun":      ("ellie_fun.mp3",      "Ellie",   "This is going to be fun!"),
    "miko_adventure": ("miko_adventure.mp3", "Miko",    "Adventure time!"),
    "maggie_board":   ("maggie_board.mp3",   "Maggie",  "All aboard! Let's sing our happy song!"),
    "song_v1":        ("song_v1.mp3",        "All",     "Come along, come along, let's sing a happy song! Rainbow bus is on its way, learning something new today!"),
    "maggie_rainbow": ("maggie_rainbow.mp3", "Maggie",  "Ooh! Look, little friends! A magical rainbow road!"),
    "maggie_quiz1":   ("maggie_quiz1.mp3",   "Maggie",  "Can you find something red?"),
}

# optional lines that are only mixed in when the clip exists on disk
OPTIONAL = {
    "song_v2a":     ("song_v2a.mp3",     "Bunny & Leo", "Red, red, apples red! Orange, orange, look ahead!"),
    "song_v2b":     ("song_v2b.mp3",     "Ellie & Miko", "Yellow sunshine in the sky, green trees waving way up high!"),
    "bunny_blue":   ("bunny_blue.mp3",   "Bunny",  "Blue, blue, butterfly blue!"),
    "buddy_indigo": ("buddy_indigo.mp3", "Buddy",  "Indigo flower, just for you!"),
    "leo_violet":   ("leo_violet.mp3",   "Leo",    "Violet balloon, floating free!"),
    "all_seven":    ("all_seven.mp3",    "All",    "Seven colours, you and me!"),
    "maggie_quiz2": ("maggie_quiz2.mp3", "Maggie", "Which colour is the sunshine?"),
    "maggie_close": ("maggie_close.mp3", "Maggie", "That was magical! See you next time, little friends!"),
}


def clip_len(name):
    """Duration of a voice clip in seconds (0 if it does not exist yet)."""
    table = dict(VOICES, **OPTIONAL)
    if name not in table:
        return 0.0
    path = os.path.join(AUDIO, table[name][0])
    if not os.path.exists(path):
        return 0.0
    import wave
    wav = os.path.join(BUILD, "vo", table[name][0].replace(".mp3", ".wav"))
    if not os.path.exists(wav):
        return 0.0
    with wave.open(wav, "rb") as w:
        return w.getnframes() / float(w.getframerate())


# ------------------------------------------------------------------ timeline
COLOURS = [
    # key, word, object, icon x/y on the rainbow-road plate (fractions), cue colour
    ("red",    "RED",    "an apple",      0.088, 0.505, (226, 58, 62)),
    ("orange", "ORANGE", "an orange",     0.205, 0.500, (245, 138, 40)),
    ("yellow", "YELLOW", "the sunshine",  0.310, 0.470, (247, 205, 45)),
    ("green",  "GREEN",  "a leafy tree",  0.404, 0.455, (86, 178, 66)),
    ("blue",   "BLUE",   "a butterfly",   0.520, 0.490, (60, 150, 235)),
    ("indigo", "INDIGO", "a flower",      0.628, 0.505, (93, 79, 186)),
    ("violet", "VIOLET", "a balloon",     0.775, 0.395, (150, 82, 205)),
]

SHOTS = [
    # id, start, end
    ("title",      0.0,   8.0),
    ("sign",       8.0,  14.0),
    ("arrive",    14.0,  22.0),
    ("greet",     22.0,  36.0),
    ("board",     36.0,  52.0),
    ("depart",    52.0,  68.0),
    ("rainbow",   68.0,  88.0),
    ("colours",   88.0, 117.4),
    ("song_a",   117.4, 126.0),
    ("song_b",   126.0, 134.6),
    ("friends",  134.6, 142.0),
    ("quiz_red", 142.0, 153.0),
    ("quiz_sun", 153.0, 164.0),
    ("finale",   164.0, 176.0),
    ("outro",    176.0, 186.0),
]

# voice cues: (clip, start)  -- starts are absolute seconds
CUES = [
    ("maggie_intro",   23.0),
    ("bunny_yay",      27.6),
    ("buddy_go",       29.0),
    ("leo_wait",       30.1),
    ("ellie_fun",      31.7),
    ("miko_adventure", 33.9),
    ("maggie_board",   35.8),
    ("song_v1",        53.4),
    ("maggie_rainbow", 75.0),
    ("song_v2a",      117.6),
    ("song_v2b",      126.2),
    ("bunny_blue",    134.8),
    ("buddy_indigo",  136.6),
    ("leo_violet",    138.4),
    ("all_seven",     140.2),
    ("maggie_quiz1",  143.0),
    ("maggie_quiz2",  154.0),
    ("maggie_close",  177.5),
]

COLOUR_START = 88.0
COLOUR_STEP = 4.2

# sound effects: (kind, start, length)
SFX = [
    ("sparkle",   1.0, 1.2),
    ("whoosh",    7.6, 0.9),
    ("engine_in", 15.2, 3.0),
    ("pop",      22.6, 0.3),
    ("pop",      27.0, 0.3),
    ("sparkle",  36.1, 1.0),
    ("door_slide", 37.0, 1.4),
    ("step",     38.6, 0.5),
    ("step",     41.2, 0.5),
    ("step",     43.8, 0.5),
    ("step",     46.4, 0.5),
    ("step",     48.6, 0.5),
    ("door_slide", 50.2, 1.4),
    ("horn",     53.0, 0.7),
    ("engine_out", 54.0, 6.0),
    ("whoosh",   67.0, 1.2),
    ("sparkle",  69.5, 2.4),
    ("chime",    75.0, 1.6),
    ("sparkle",  86.0, 1.4),
] + [("chime", COLOUR_START + i * COLOUR_STEP + 0.35, 1.6) for i in range(7)] + [
    ("pop",     117.6, 0.3),
    ("sparkle", 142.8, 1.0),
    ("chime2",  146.9, 1.8),
    ("sparkle", 153.8, 1.0),
    ("chime2",  157.4, 1.8),
    ("cheer",   164.2, 3.0),
    ("sparkle", 176.2, 2.0),
]

END = SHOTS[-1][2]


def write_json():
    os.makedirs(BUILD, exist_ok=True)
    data = {
        "fps": FPS, "w": W, "h": H, "end": END,
        "shots": [{"id": a, "start": b, "end": c} for a, b, c in SHOTS],
        "colours": [{"key": k, "word": w, "object": o, "x": x, "y": y,
                     "rgb": list(c)} for k, w, o, x, y, c in COLOURS],
        "cues": [{"clip": c, "start": s, "dur": clip_len(c),
                  "who": (VOICES.get(c) or OPTIONAL.get(c))[1],
                  "text": (VOICES.get(c) or OPTIONAL.get(c))[2]} for c, s in CUES],
    }
    with open(os.path.join(BUILD, "timeline.json"), "w") as f:
        json.dump(data, f, indent=1)
    return data


if __name__ == "__main__":
    d = write_json()
    print("episode length %.2fs (%d:%05.2f)" % (END, END // 60, END % 60))
    for c in d["cues"]:
        print("  %-16s %6.2f  dur %.2f" % (c["clip"], c["start"], c["dur"]))

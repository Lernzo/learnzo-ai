"""Single source of truth for the Leanzo Rescue Team intro timeline.

Both the audio mix and the video render read from here so picture and
sound can never drift apart.
"""

TOTAL = 60.0
FPS = 30
W, H = 1920, 1080

# (id, start, end, image, label)
SCENES = [
    dict(id="s1_world",     start=0.0,  end=9.3,  img="scene1_town.jpg"),
    dict(id="s2_captain",   start=9.3,  end=16.4, img="scene2_captain.jpg"),
    dict(id="s3a_ruby",     start=16.4, end=25.4, img="scene3a_ruby_blue.jpg"),
    dict(id="s3b_sunny",    start=25.4, end=35.0, img="scene3b_sunny_greenie.jpg"),
    dict(id="s4_learning",  start=35.0, end=43.8, img="scene4_learning.jpg"),
    dict(id="s5_kitten",    start=43.8, end=51.2, img="scene5_kitten.jpg"),
    dict(id="s6_finale",    start=51.2, end=60.0, img="scene6_finale.jpg"),
]

XFADE = 0.7  # seconds

# voice over placements: (clip, time in, optional (start,end) trim of the source)
VO = [
    dict(clip="01_narrator_welcome.mp3", at=0.35, who="narrator"),
    dict(clip="02_captain_hello.mp3",    at=10.10, who="captain"),
    dict(clip="03_ruby.mp3",             at=17.05, who="ruby"),
    dict(clip="04_officer_blue.mp3",     at=21.30, who="blue"),
    dict(clip="05_sunny.mp3",            at=25.90, who="sunny"),
    dict(clip="06_greenie.mp3",          at=31.00, who="greenie"),
    dict(clip="07_captain_learn.mp3",    at=35.70, who="captain"),
    dict(clip="08_ruby_hear.mp3",        at=44.70, who="ruby"),
    dict(clip="09_captain_comeon.mp3",   at=46.90, who="captain"),
    dict(clip="10_team_letsgo.mp3",      at=49.90, who="team"),
    # brand sting: the narrator's "Learnzo Rescue Team!" tag lifted from the
    # opening line (same voice, same session) so the name lands on the logo.
    dict(clip="01_narrator_welcome.mp3", at=52.45, who="narrator", trim=(7.30, 8.98)),
]

# on-screen name tags / colour beats
NAMETAGS = [
    dict(at=10.35, out=16.05, name="CAPTAIN RAINBOW", role="Team Leader", colour="#16B8B0"),
    dict(at=17.05, out=21.15, name="RUBY",           role="Red Fire Truck", colour="#E8322D"),
    dict(at=21.30, out=25.30, name="OFFICER BLUE",   role="Blue Police Car", colour="#1473E6"),
    dict(at=25.90, out=30.85, name="SUNNY",          role="Yellow Ambulance", colour="#F5A800"),
    dict(at=31.00, out=34.90, name="GREENIE",        role="Green Rescue Jeep", colour="#3FA535"),
]

# learning words in scene 4
WORDS = [
    dict(at=36.10, word="COLOURS",         colour="#E8322D"),
    dict(at=37.30, word="SONGS",           colour="#8C46C9"),
    dict(at=38.50, word="NUMBERS",         colour="#1473E6"),
    dict(at=39.70, word="NEW THINGS",      colour="#3FA535"),
    dict(at=40.90, word="HELPING FRIENDS", colour="#F5A800"),
]

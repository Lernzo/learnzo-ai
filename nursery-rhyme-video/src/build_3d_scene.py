#!/usr/bin/env python3
"""Build and render a REAL fully-animated 3D cartoon scene (Blender/bpy, Cycles CPU).

Scene: Benny the school bus drives along a road while Mia, Leo and Bunny ride
inside (visible through the windshield), waving and bouncing. Wheels spin,
suspension bounces, eyes blink, ears wiggle, trees/flowers/grass sway, clouds
drift, butterflies flap across, road dashes + background scroll (one continuous
camera shot, no cuts).

Usage:
  LD_LIBRARY_PATH=/home/user/xstubs python3 src/build_3d_scene.py --test   # 1 frame
  LD_LIBRARY_PATH=/home/user/xstubs python3 src/build_3d_scene.py           # full render
"""
import bpy
import math
import os
import sys
import random

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FRAMES_DIR = os.path.join(ROOT, "media", "work3d", "frames")
os.makedirs(FRAMES_DIR, exist_ok=True)

FPS = 24
DUR = 8.0
F0, F1 = 1, int(FPS * DUR)          # 1..288
BUS_SPEED = 11.0 / (F1 - F0) * FPS / FPS  # m/s -> 11 m over the clip
BUS_X0, BUS_X1 = -8.0, 3.0
WHEEL_R = 0.34
OMEGA = (BUS_X1 - BUS_X0) / DUR / WHEEL_R   # rad/s

random.seed(42)

# ------------------------------------------------------------------ helpers
def set_linear(obj):
    ad = obj.animation_data
    if not ad or not ad.action:
        return
    fcs = []
    try:
        fcs = list(ad.action.fcurves)
    except Exception:
        fcs = []
    if not fcs:
        for layer in ad.action.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    fcs.extend(cb.fcurves)
    for fc in fcs:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def key(obj, path, frame, value, index=None):
    if index is None:
        setattr(obj, path, value)
        obj.keyframe_insert(data_path=path, frame=frame)
    else:
        if isinstance(value, (tuple, list)):
            value = value[index]
        v = getattr(obj, path)
        v[index] = value
        obj.keyframe_insert(data_path=path, frame=frame, index=index)


def mat(name, color, rough=0.5, metallic=0.0, emission=None, estr=0.0, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metallic
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1)
        bsdf.inputs["Emission Strength"].default_value = estr
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        m.surface_render_method = 'DITHERED'
    return m


def cube(name, loc, scale, material, parent=None, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    if bevel > 0:
        mod = o.modifiers.new("bev", 'BEVEL')
        mod.width = bevel
        mod.segments = 3
    if material:
        o.data.materials.append(material)
    if parent:
        o.parent = parent
    return o


def sphere(name, loc, radius, material, parent=None, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, location=loc, segments=24, ring_count=16)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    if material:
        o.data.materials.append(material)
    if parent:
        o.parent = parent
    return o


def ico(name, loc, radius, material, parent=None, scale=(1, 1, 1), subdiv=2):
    bpy.ops.mesh.primitive_ico_sphere_add(radius=radius, location=loc, subdivisions=subdiv)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    if material:
        o.data.materials.append(material)
    if parent:
        o.parent = parent
    return o


def cyl(name, loc, radius, depth, material, parent=None, axis='Z', rotation=None):
    rot = (math.pi / 2, 0, 0) if axis == 'Y' else ((0, math.pi / 2, 0) if axis == 'X' else (0, 0, 0))
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    bpy.ops.object.transform_apply(rotation=True)
    if rotation:
        o.rotation_euler = rotation
    if material:
        o.data.materials.append(material)
    if parent:
        o.parent = parent
    return o


def arc(name, loc, radius, material, parent=None, z0=0.0, flip=False, width=0.03, plane='YZ'):
    """Semicircular smile arc. plane YZ -> arc lies in YZ facing +X."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = width
    cu.bevel_resolution = 2
    sp = cu.splines.new('POLY')
    n = 12
    sp.points.add(n)
    for i in range(n + 1):
        a = math.pi * (i / n)          # 0..pi
        y = radius * math.cos(a)
        z = z0 + radius * math.sin(a) * (1 if not flip else -1)
        sp.points[i].co = (loc[0], loc[1] + y, loc[2] + z, 1)
    o = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(o)
    if material:
        cu.materials.append(material)
    if parent:
        o.parent = parent
    return o


def empty(name, loc=(0, 0, 0), parent=None):
    o = bpy.data.objects.new(name, None)
    o.location = loc
    bpy.context.collection.objects.link(o)
    if parent:
        o.parent = parent
    return o


# ------------------------------------------------------------------ scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 16
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 6
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.fps = FPS
scene.frame_start = F0
scene.frame_end = F1
scene.render.filepath = os.path.join(FRAMES_DIR, "f####.png")
scene.render.image_settings.file_format = 'PNG'

world = bpy.data.worlds.new("Sky")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.38, 0.62, 1.0, 1)
bg.inputs["Strength"].default_value = 0.9

sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", 'SUN'))
sun.data.energy = 3.5
sun.data.angle = 0.12
sun.rotation_euler = (math.radians(50), math.radians(15), math.radians(30))
bpy.context.collection.objects.link(sun)

# materials
m_grass = mat("grass", (0.25, 0.65, 0.2), rough=0.9)
m_road = mat("road", (0.25, 0.25, 0.28), rough=0.95)
m_dash = mat("dash", (0.95, 0.95, 0.9), rough=0.6)
m_yellow = mat("bus_yellow", (1.0, 0.72, 0.05), rough=0.35, metallic=0.25)
m_yellow2 = mat("bus_yellow2", (1.0, 0.82, 0.2), rough=0.4)
m_blue = mat("wheel_blue", (0.1, 0.4, 0.95), rough=0.3, metallic=0.4)
m_hub = mat("hub", (0.8, 0.85, 0.9), rough=0.25, metallic=0.7)
m_glass = mat("glass", (0.05, 0.08, 0.13), rough=0.08, alpha=0.9)
m_swin = mat("swin", (0.08, 0.12, 0.18), rough=0.1)
m_dark = mat("dark", (0.12, 0.12, 0.14), rough=0.5)
m_white = mat("white", (0.98, 0.98, 0.98), rough=0.4)
m_iris = mat("iris", (0.15, 0.5, 1.0), rough=0.15)
m_pupil = mat("pupil", (0.02, 0.02, 0.03), rough=0.2)
m_skin = mat("skin", (1.0, 0.8, 0.62), rough=0.6)
m_hair = mat("hair", (0.35, 0.2, 0.1), rough=0.8)
m_pink = mat("pink", (1.0, 0.45, 0.65), rough=0.6)
m_dress = mat("dress", (1.0, 0.55, 0.75), rough=0.7)
m_overall = mat("overall", (0.2, 0.45, 0.85), rough=0.7)
m_shirt = mat("shirt", (0.95, 0.95, 0.9), rough=0.8)
m_fur = mat("fur", (0.99, 0.99, 1.0), rough=0.9)
m_ear = mat("earpink", (1.0, 0.65, 0.75), rough=0.7)
m_trunk = mat("trunk", (0.4, 0.25, 0.12), rough=0.9)
m_leaf = mat("leaf", (0.2, 0.6, 0.25), rough=0.8)
m_leaf2 = mat("leaf2", (0.3, 0.7, 0.3), rough=0.8)
m_light = mat("headlight", (1, 1, 0.9), rough=0.2, emission=(1, 0.95, 0.7), estr=2.0)
house_cols = [mat("h1", (1.0, 0.6, 0.55)), mat("h2", (0.6, 0.8, 1.0)), mat("h3", (1.0, 0.85, 0.5)),
              mat("h4", (0.75, 0.95, 0.6)), mat("h5", (0.95, 0.7, 0.9))]
m_roof = mat("roof", (0.75, 0.25, 0.2), rough=0.8)
m_cloud = mat("cloud", (1, 1, 1), rough=1.0)
m_flower = [mat("fl1", (1.0, 0.3, 0.4)), mat("fl2", (1.0, 0.85, 0.2)), mat("fl3", (0.7, 0.4, 1.0)), mat("fl4", (1.0, 0.6, 0.2))]
m_bfly = [mat("bf1", (1.0, 0.55, 0.1), rough=0.6), mat("bf2", (0.6, 0.4, 1.0), rough=0.6), mat("bf3", (1.0, 0.4, 0.7), rough=0.6)]
m_tire = mat("tire", (0.08, 0.08, 0.09), rough=0.9)

# ------------------------------------------------------------------ ground / road / sky props
ground = cube("ground", (0, 10, -0.5), (80, 40, 0.5), m_grass)
road = cube("road", (0, 0, 0.02), (80, 2.4, 0.02), m_road)

# distant hills (static, far)
for i, (hx, hy, hr) in enumerate([(-25, 38, 14), (5, 42, 18), (35, 38, 15), (-50, 40, 16), (60, 42, 17)]):
    ico(f"hill{i}", (hx, hy, -2), hr, m_leaf2 if i % 2 else m_grass, scale=(1, 1, 0.45))

# scrolling props: trees, houses, flowers, grass tufts, road dashes
scroll_objs = []  # (obj, x0, sway_phase, sway_amp, sway_axis)


def add_scroll_x(obj, x0):
    key(obj, "location", F0, (x0, obj.location.y, obj.location.z), index=0)
    key(obj, "location", F1, (x0 - (BUS_X1 - BUS_X0), obj.location.y, obj.location.z), index=0)
    scroll_objs.append(obj)


# trees
for i in range(14):
    x0 = random.uniform(-24, 30)
    y = random.choice([4.2, 6.5, 9.5, 14, 20])
    trunk = cyl(f"trunk{i}", (x0, y, 0.7), 0.16, 1.4, m_trunk)
    fol = ico(f"fol{i}", (x0, y, 1.9), 1.05, m_leaf if i % 2 else m_leaf2, scale=(1, 1, 0.9))
    fol2 = ico(f"fol{i}b", (x0 + 0.5, y, 1.4), 0.7, m_leaf2)
    add_scroll_x(trunk, x0)
    add_scroll_x(fol, x0)
    add_scroll_x(fol2, x0)
    for o in (trunk, fol, fol2):
        o["sway"] = random.uniform(0, 6.28)

# houses
for i in range(8):
    x0 = random.uniform(-26, 30)
    y = random.choice([9, 12.5, 17])
    s = random.uniform(0.9, 1.4)
    body = cube(f"house{i}", (x0, y, 0.8 * s), (1.0 * s, 0.9 * s, 0.8 * s), house_cols[i % 5], bevel=0.05)
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=1.25 * s, radius2=0.0, depth=0.7 * s, location=(x0, y, 1.95 * s), rotation=(0, 0, math.radians(45)))
    roof = bpy.context.object
    roof.name = f"roof{i}"
    roof.data.materials.append(m_roof)
    add_scroll_x(body, x0)
    add_scroll_x(roof, x0)

# flowers + grass tufts along roadside
for i in range(40):
    x0 = random.uniform(-28, 32)
    side = random.choice([-3.1, 3.1, -3.8, 3.8])
    stem = cyl(f"stem{i}", (x0, side, 0.18), 0.02, 0.36, m_leaf)
    head = sphere(f"fhead{i}", (x0, side, 0.42), 0.13, m_flower[i % 4])
    add_scroll_x(stem, x0)
    add_scroll_x(head, x0)
    for o in (stem, head):
        o["sway"] = random.uniform(0, 6.28)

# road dashes
for i in range(30):
    x0 = -30 + i * 2.2
    d = cube(f"dash{i}", (x0, 0, 0.045), (0.55, 0.09, 0.01), m_dash)
    add_scroll_x(d, x0)

# clouds (own slow drift, no scroll)
clouds = []
for i in range(6):
    cx = random.uniform(-30, 30)
    cz = random.uniform(5.5, 8.5)
    cy = random.uniform(18, 24)
    parts = []
    for k in range(3):
        p = sphere(f"cl{i}_{k}", (cx + k * 1.6 - 1.6, cy, cz + random.uniform(-0.4, 0.4)), random.uniform(1.3, 2.2), m_cloud)
        parts.append((p, cx + k * 1.6 - 1.6))
    clouds.append((parts, cz))
    for p, px in parts:
        key(p, "location", F0, (px, cy, cz), index=0)
        key(p, "location", F1, (px + 3.0, cy, cz), index=0)  # drift

# ------------------------------------------------------------------ BENNY THE BUS
bus = empty("BusRoot")
key(bus, "location", F0, (BUS_X0, 0, 0), index=0)
key(bus, "location", F1, (BUS_X1, 0, 0), index=0)

body = cube("busbody", (0, 0, 1.05), (2.0, 0.95, 0.8), m_yellow, parent=bus, bevel=0.18)
cube("bustop", (0, 0, 1.88), (1.9, 0.9, 0.08), m_yellow2, parent=bus, bevel=0.04)
cube("busfront", (1.95, 0, 1.05), (0.12, 0.95, 0.8), m_yellow, parent=bus, bevel=0.12)
# windshield
cube("windshield", (2.02, 0, 1.42), (0.05, 0.8, 0.36), m_glass, parent=bus, bevel=0.07)
# side windows (camera side -Y)
for i in range(4):
    cube(f"swin{i}", (-1.2 + i * 0.8, -0.955, 1.5), (0.32, 0.03, 0.24), m_swin, parent=bus, bevel=0.05)
# grille + bumper + lights
cube("grille", (2.03, 0, 1.02), (0.04, 0.42, 0.1), m_dark, parent=bus, bevel=0.03)
cube("bumper", (2.05, 0, 0.5), (0.07, 0.92, 0.07), m_hub, parent=bus, bevel=0.03)
sphere("lightL", (2.06, -0.6, 0.95), 0.09, m_light, parent=bus)
sphere("lightR", (2.06, 0.6, 0.95), 0.09, m_light, parent=bus)
# smile arc on the front
smile = arc("smile", (2.07, 0, 0.98), 0.32, m_dark, parent=bus, z0=0.0, flip=True, width=0.04)

# eyes (blink via scale z of eye groups)
eye_groups = []
for side, y in (("L", -0.33), ("R", 0.33)):
    eg = empty(f"eye{side}", (2.07, y, 1.56), parent=bus)
    sphere(f"white{side}", (0, 0, 0), 0.19, m_white, parent=eg)
    sphere(f"iris{side}", (0.15, 0, 0), 0.1, m_iris, parent=eg)
    sphere(f"pupil{side}", (0.2, 0, 0), 0.05, m_pupil, parent=eg)
    sphere(f"glint{side}", (0.21, 0.06, 0.07), 0.025, m_white, parent=eg)
    eye_groups.append(eg)

# wheels (spin around local Y)
wheels = []
for i, (wx, wy) in enumerate([(1.35, -0.92), (1.35, 0.92), (-1.35, -0.92), (-1.35, 0.92)]):
    w = cyl(f"wheel{i}", (wx, wy, WHEEL_R), WHEEL_R, 0.26, m_tire, parent=bus, axis='Y')
    cyl(f"hub{i}", (wx, wy, WHEEL_R), 0.13, 0.3, m_hub, parent=bus, axis='Y')
    wheels.append(w)
for w in wheels:
    key(w, "rotation_euler", F0, (0, 0, 0), index=1)
    key(w, "rotation_euler", F1, (0, -OMEGA * DUR, 0), index=1)


def add_blink(egs, period, offset):
    f = F0
    while f <= F1:
        tb = f + offset * FPS
        for fr, sc in ((tb - 2, 1.0), (tb, 0.08), (tb + 2, 1.0)):
            if F0 <= fr <= F1:
                key(egs[0], "scale", int(round(fr)), (1, 1, sc), index=2)
                key(egs[1], "scale", int(round(fr)), (1, 1, sc), index=2)
        f += int(period * FPS)


# ------------------------------------------------------------------ riders: MIA, LEO, BUNNY (leaning out of the side windows, facing camera)
def make_face_y(parent, hx, hy, hz, r=0.23):
    eg_l = empty(f"{parent.name}_eL", (hx - r * 0.38, hy - r * 0.72, hz + r * 0.1), parent=parent)
    eg_r = empty(f"{parent.name}_eR", (hx + r * 0.38, hy - r * 0.72, hz + r * 0.1), parent=parent)
    for eg in (eg_l, eg_r):
        sphere("w", (0, 0, 0), r * 0.34, m_white, parent=eg)
        sphere("p", (0, -r * 0.2, 0), r * 0.17, m_pupil, parent=eg)
    cu = bpy.data.curves.new(parent.name + "_sm", 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = 0.02
    cu.bevel_resolution = 2
    sp = cu.splines.new('POLY')
    n = 10
    sp.points.add(n)
    for i in range(n + 1):
        a = math.pi * i / n
        sp.points[i].co = (hx + r * 0.5 * math.cos(a), hy - r * 0.78, hz - r * 0.18 - r * 0.32 * math.sin(a), 1)
    so = bpy.data.objects.new(parent.name + "_smile", cu)
    bpy.context.collection.objects.link(so)
    cu.materials.append(m_dark)
    so.parent = parent
    return [eg_l, eg_r]


def rider(name, x, z, kind):
    r = empty(name, (x, -1.02, z), parent=bus)
    sk = m_fur if kind == "bunny" else m_skin
    sphere(name + "_head", (0, 0, 0.22), 0.23, sk, parent=r)
    ears = []
    if kind == "mia":
        sphere(name + "_hair", (-0.02, 0.04, 0.3), 0.25, m_hair, parent=r, scale=(1.0, 1.0, 0.85))
        sphere(name + "_ptL", (-0.1, -0.18, 0.3), 0.09, m_hair, parent=r)
        sphere(name + "_ptR", (-0.1, 0.26, 0.3), 0.09, m_hair, parent=r)
        cube(name + "_dress", (0, 0.06, -0.06), (0.2, 0.18, 0.22), m_dress, parent=r, bevel=0.06)
    elif kind == "leo":
        sphere(name + "_hair", (-0.02, 0.04, 0.33), 0.24, m_hair, parent=r, scale=(1.05, 1.0, 0.75))
        cube(name + "_body", (0, 0.06, -0.06), (0.2, 0.18, 0.22), m_overall, parent=r, bevel=0.05)
    else:
        for sgn in (-1, 1):
            e = empty(name + f"_ear{sgn}", (0.02, 0.06 * sgn, 0.42), parent=r)
            sphere("e", (0, 0, 0.12), 0.06, m_fur, parent=e, scale=(0.7, 1, 2.2))
            sphere("ei", (0, 0, 0.12), 0.035, m_ear, parent=e, scale=(0.5, 1, 2.0))
            ears.append(e)
        sphere(name + "_nose", (0, -0.2, 0.2), 0.035, m_ear, parent=r)
    eyes = make_face_y(r, 0, -0.1, 0.24)
    arm = empty(name + "_arm", (0.13, -0.15, 0.05), parent=r)
    cyl(name + "_armb", (0, -0.22, 0), 0.045, 0.44, sk, parent=arm, axis='Y')
    sphere(name + "_hand", (0, -0.46, 0), 0.07, sk, parent=arm)
    return r, eyes, arm, ears


mia, mia_eyes, mia_arm, _ = rider("Mia", -0.4, 1.42, "mia")
leo, leo_eyes, leo_arm, _ = rider("Leo", 0.4, 1.42, "leo")
bunny, bunny_eyes, bunny_arm, bunny_ears = rider("Bunny", 1.15, 1.3, "bunny")

# ------------------------------------------------------------------ animation curves
def wave_y(arm, base, amp, freq, phase):
    for f in range(F0, F1 + 1, 3):
        t = (f - F0) / FPS
        key(arm, "rotation_euler", f, (base + amp * math.sin(2 * math.pi * freq * t + phase), 0, 0), index=0)


wave_y(mia_arm, 0.45, 0.6, 1.6, 0.0)
wave_y(leo_arm, -0.45, 0.65, 1.4, 2.1)
wave_y(bunny_arm, 0.7, 0.55, 2.0, 0.5)

add_blink(mia_eyes, 2.3, 0.0)
add_blink(leo_eyes, 2.7, 0.6)
add_blink(bunny_eyes, 1.9, 1.1)
add_blink(eye_groups, 2.5, 0.3)   # Benny blinks

# head bobs + bunny ear wiggle + nose twitch
for f in range(F0, F1 + 1, 3):
    t = (f - F0) / FPS
    key(mia, "location", f, (-0.4, -1.02, 1.42 + 0.03 * math.sin(2 * math.pi * 2.2 * t)), index=2)
    key(leo, "location", f, (0.4, -1.02, 1.42 + 0.03 * math.sin(2 * math.pi * 2.2 * t + 1.0)), index=2)
    key(bunny, "location", f, (1.15, -1.02, 1.3 + 0.035 * math.sin(2 * math.pi * 2.2 * t + 2.0)), index=2)
    key(bunny_ears[0], "rotation_euler", f, (0.18 * math.sin(2 * math.pi * 3.0 * t), 0, 0), index=0)
    key(bunny_ears[1], "rotation_euler", f, (-0.18 * math.sin(2 * math.pi * 3.0 * t + 0.7), 0, 0), index=0)
    ns = 1.0 + (0.5 if math.sin(2 * math.pi * 5 * t) > 0.7 else 0.0)
    key(bpy.data.objects["Bunny_nose"], "scale", f, (ns, ns, ns))

# bus suspension bounce + pitch
for f in range(F0, F1 + 1, 2):
    t = (f - F0) / FPS
    key(bus, "location", f, (BUS_X0 + (BUS_X1 - BUS_X0) * t / DUR, 0, 0.05 * math.sin(2 * math.pi * 2.2 * t)), index=2)
    key(bus, "rotation_euler", f, (0, 0.015 * math.sin(2 * math.pi * 2.2 * t + 0.8), 0), index=1)

# smile grows happily
for f in range(F0, F1 + 1, 24):
    t = (f - F0) / FPS
    s = 1.0 + 0.12 * math.sin(2 * math.pi * 0.5 * t)
    key(smile, "scale", f, (1, s, s))

# tree / flower sway (scroll + tilt)
for o in scroll_objs:
    ph = o.get("sway", 0.0)
    for f in range(F0, F1 + 1, 6):
        t = (f - F0) / FPS
        key(o, "rotation_euler", f, (0, 0.045 * math.sin(2 * math.pi * 0.8 * t + ph), 0), index=1)

# ------------------------------------------------------------------ butterflies
for i in range(3):
    b = empty(f"bfly{i}")
    cyl(f"bfly{i}_body", (0, 0, 0), 0.03, 0.25, m_dark, parent=b, axis='X')
    wl = empty(f"bfly{i}_wL", (0, -0.02, 0), parent=b)
    wr = empty(f"bfly{i}_wR", (0, 0.02, 0), parent=b)
    cube(f"bfly{i}_wl", (0, -0.14, 0), (0.12, 0.13, 0.015), m_bfly[i], parent=wl, bevel=0.02)
    cube(f"bfly{i}_wr", (0, 0.14, 0), (0.12, 0.13, 0.015), m_bfly[i], parent=wr, bevel=0.02)
    phase = i * 2.1
    for f in range(F0, F1 + 1, 2):
        t = (f - F0) / FPS
        x = -12 + 24 * t / DUR + i * 3
        y = 1.5 + 2.0 * math.sin(1.7 * t + phase)
        z = 2.2 + 0.9 * math.sin(2.3 * t + phase)
        key(b, "location", f, (x, y, z))
        flap = 0.9 * abs(math.sin(2 * math.pi * 9 * t + phase))
        key(wl, "rotation_euler", f, (flap, 0, 0), index=0)
        key(wr, "rotation_euler", f, (-flap, 0, 0), index=0)

# ------------------------------------------------------------------ camera (one continuous shot, slow drift)
cam = bpy.data.objects.new("Cam", bpy.data.cameras.new("Cam"))
cam.data.lens = 52
cam.location = (8.5, -13.5, 4.6)
bpy.context.collection.objects.link(cam)
tgt = empty("CamTarget", (-4.0, 0.5, 1.2))
key(tgt, "location", F0, (-4.0, 0.5, 1.2), index=0)
key(tgt, "location", F1, (1.5, 0.5, 1.2), index=0)
con = cam.constraints.new('TRACK_TO')
con.target = tgt
scene.camera = cam
for ax in range(3):
    key(cam, "location", F0, (8.5, -13.5, 4.6), index=ax)
    key(cam, "location", F1, (6.8, -13.8, 4.5), index=ax)

for o in bpy.data.objects:
    set_linear(o)

scene.frame_set(F0)

if "--test" in sys.argv:
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.frame_set(120)
    import time
    t0 = time.time()
    scene.render.filepath = os.path.join(FRAMES_DIR, "test.png")
    bpy.ops.render.render(write_still=True)
    print(f"TEST FRAME OK in {time.time()-t0:.1f}s")
else:
    bpy.ops.render.render(animation=True)
    print("FULL RENDER DONE")

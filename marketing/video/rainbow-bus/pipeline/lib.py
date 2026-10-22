"""Tiny vector-ish drawing toolkit on top of Pillow, with supersampling.

All public helpers take *design-space* coordinates (1920x1080 frame units)
and scale them by S internally, so the pipeline can render at 2x and
downsample for clean antialiased edges.
"""
from __future__ import annotations

import math
from functools import lru_cache

from PIL import Image, ImageDraw, ImageFilter, ImageChops

S = 2  # supersample factor


# ---------------------------------------------------------------- colour utils
def hexc(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def mix(c0, c1, t):
    t = max(0.0, min(1.0, t))
    return tuple(int(round(c0[i] + (c1[i] - c0[i]) * t)) for i in range(4))


def shade(c, f):
    """Lighten (f>0) or darken (f<0) a colour, keeping alpha."""
    if f >= 0:
        return mix(c, (255, 255, 255, c[3]), f)
    return mix(c, (0, 0, 0, c[3]), -f)


def with_alpha(c, a):
    return (c[0], c[1], c[2], int(max(0, min(255, a))))


def smoothstep(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def ease_in_out(t):
    t = max(0.0, min(1.0, t))
    return 0.5 - 0.5 * math.cos(math.pi * t)


def lerp(a, b, t):
    return a + (b - a) * t


# ---------------------------------------------------------------- geometry
def bez(points, steps=48):
    """Sample a chain of cubic beziers. points = [(x,y), (c1),(c2),(p), ...]."""
    pts = []
    i = 0
    while i + 3 < len(points):
        p0, p1, p2, p3 = points[i], points[i + 1], points[i + 2], points[i + 3]
        for k in range(steps):
            t = k / steps
            mt = 1 - t
            x = (mt ** 3) * p0[0] + 3 * (mt ** 2) * t * p1[0] + 3 * mt * t * t * p2[0] + t ** 3 * p3[0]
            y = (mt ** 3) * p0[1] + 3 * (mt ** 2) * t * p1[1] + 3 * mt * t * t * p2[1] + t ** 3 * p3[1]
            pts.append((x, y))
        i += 3
    return pts


def arc_points(cx, cy, rx, ry, a0, a1, steps=40):
    return [(cx + rx * math.cos(math.radians(a0 + (a1 - a0) * k / steps)),
             cy + ry * math.sin(math.radians(a0 + (a1 - a0) * k / steps))) for k in range(steps + 1)]


# ---------------------------------------------------------------- gradients
@lru_cache(maxsize=512)
def _ramp(size, c0, c1, direction, stops):
    """Cached 1-D colour ramp, size=(w,h)."""
    w, h = size
    if direction == "v":
        ramp = Image.linear_gradient("L").resize((w, h), Image.BILINEAR)
    elif direction == "h":
        ramp = Image.linear_gradient("L").rotate(90, expand=True).resize((w, h), Image.BILINEAR)
    else:  # diagonal
        ramp = Image.linear_gradient("L").resize((w, h), Image.BILINEAR)
        grad = Image.new("L", (w, h))
        gd = ImageDraw.Draw(grad)
        for y in range(h):
            gd.line([(0, y), (w, y)], fill=int(255 * y / max(1, h - 1)))
        ramp = grad
    base = Image.new("RGBA", (w, h), c0)
    over = Image.new("RGBA", (w, h), c1)
    return Image.composite(over, base, ramp)


def gradient(size, c0, c1, direction="v"):
    return _ramp(size, c0, c1, direction, 0).copy()


def radial(size, inner, outer, centre=(0.5, 0.5), radius=0.5):
    w, h = size
    cx, cy = centre[0] * w, centre[1] * h
    rad = radius * max(w, h)
    small = 160
    img = Image.new("RGBA", (small, small))
    px = img.load()
    for y in range(small):
        for x in range(small):
            dx = (x / small - centre[0]) * w
            dy = (y / small - centre[1]) * h
            d = min(1.0, math.hypot(dx, dy) / rad)
            px[x, y] = mix(inner, outer, d ** 0.85)
    return img.resize((w, h), Image.BICUBIC)


# ---------------------------------------------------------------- canvas
class Canvas:
    def __init__(self, w=1920, h=1080, s=S, bg=(0, 0, 0, 0)):
        self.w, self.h, self.s = w, h, s
        self.img = Image.new("RGBA", (w * s, h * s), bg)
        self.d = ImageDraw.Draw(self.img)
        self.ox = 0.0
        self.oy = 0.0
        self._ov = None          # translucent-overlay canvas
        self._ov_d = None

    def set_origin(self, x, y):
        """Shift the local coordinate system (design units)."""
        self.ox, self.oy = x, y
        self.d = ImageDraw.Draw(self.img)

    # -- coordinate helpers
    def p(self, pt):
        return ((pt[0] + self.ox) * self.s, (pt[1] + self.oy) * self.s)

    def box(self, b):
        return [(b[0] + self.ox) * self.s, (b[1] + self.oy) * self.s,
                (b[2] + self.ox) * self.s, (b[3] + self.oy) * self.s]

    # -- translucent overlay (Pillow's ImageDraw overwrites alpha, so anything
    #    with alpha < 255 must be drawn on a separate layer and composited)
    def _target(self, *colours):
        need = False
        for col in colours:
            if col is None:
                continue
            if isinstance(col, (tuple, list)) and len(col) == 4 and col[3] < 255:
                need = True
        if not need:
            return self.d
        if self._ov is None:
            self._ov = Canvas(self.w, self.h, self.s, (0, 0, 0, 0))
            self._ov.ox, self._ov.oy = self.ox, self.oy
            self._ov_d = ImageDraw.Draw(self._ov.img)
        return self._ov_d

    def flush_alpha(self):
        if self._ov is not None:
            self.img.alpha_composite(self._ov.img)
            self._ov = None
            self._ov_d = None
            self.d = ImageDraw.Draw(self.img)

    # -- primitives
    def ellipse(self, cx, cy, rx, ry, fill, outline=None, width=0):
        b = self.box((cx - rx, cy - ry, cx + rx, cy + ry))
        self._target(fill, outline).ellipse(b, fill=fill, outline=outline, width=int(width * self.s))

    def circle(self, cx, cy, r, fill, outline=None, width=0):
        self.ellipse(cx, cy, r, r, fill, outline, width)

    def rrect(self, x0, y0, x1, y1, r, fill, outline=None, width=0):
        self._target(fill, outline).rounded_rectangle(self.box((x0, y0, x1, y1)), radius=r * self.s,
                                                      fill=fill, outline=outline, width=int(width * self.s))

    def poly(self, pts, fill=None, outline=None, width=0):
        pp = [self.p(q) for q in pts]
        t = self._target(fill, outline)
        if fill is not None:
            t.polygon(pp, fill=fill)
        if outline:
            t.line(pp + [pp[0]], fill=outline, width=int(width * self.s), joint="curve")

    def line(self, pts, fill, width=1.0, joint="curve"):
        self._target(fill).line([self.p(q) for q in pts], fill=fill, width=int(width * self.s), joint=joint)

    def text(self, xy, s, font, fill, anchor="ls", spacing=0):
        self._target(fill).text(self.p(xy), s, font=font, fill=fill, anchor=anchor, spacing=spacing)

    def blur(self, radius):
        self.flush_alpha()
        self.img = self.img.filter(ImageFilter.GaussianBlur(radius * self.s))
        self.d = ImageDraw.Draw(self.img)

    # -- gradients through a shape mask
    def _mask(self, fn, bbox, pad=0):
        x0, y0, x1, y1 = [int(v) for v in self.box(bbox)]
        x0 = max(0, x0 - pad); y0 = max(0, y0 - pad)
        x1 = min(self.img.width, x1 + pad); y1 = min(self.img.height, y1 + pad)
        m = Image.new("L", (max(1, x1 - x0), max(1, y1 - y0)), 0)
        d = ImageDraw.Draw(m)
        fn(d, x0, y0, self.s, self.ox, self.oy)
        return m, (x0, y0)

    def _grad_shape(self, fn, bbox, c0, c1, direction="v"):
        """Fill an arbitrary shape with a linear gradient."""
        m, (x0, y0) = self._mask(fn, bbox, pad=2)
        g = gradient(m.size, c0, c1, direction)
        g.putalpha(ImageChops.multiply(g.getchannel("A"), m))
        self.img.alpha_composite(g, (x0, y0))

    def grad_ellipse(self, cx, cy, rx, ry, c0, c1, direction="v"):
        def fn(d, x0, y0, s, ox, oy):
            d.ellipse([(cx - rx + ox) * s - x0, (cy - ry + oy) * s - y0,
                       (cx + rx + ox) * s - x0, (cy + ry + oy) * s - y0], fill=255)
        self._grad_shape(fn, (cx - rx, cy - ry, cx + rx, cy + ry), c0, c1, direction)

    def grad_rrect(self, gx0, gy0, gx1, gy1, r, c0, c1, direction="v"):
        def fn(d, mx0, my0, s, ox, oy):
            d.rounded_rectangle([(gx0 + ox) * s - mx0, (gy0 + oy) * s - my0,
                                 (gx1 + ox) * s - mx0, (gy1 + oy) * s - my0],
                                radius=r * s, fill=255)
        self._grad_shape(fn, (gx0, gy0, gx1, gy1), c0, c1, direction)

    def grad_poly(self, pts, c0, c1, direction="v"):
        xs = [q[0] for q in pts]; ys = [q[1] for q in pts]

        def fn(d, x0, y0, s, ox, oy):
            d.polygon([((q[0] + ox) * s - x0, (q[1] + oy) * s - y0) for q in pts], fill=255)
        self._grad_shape(fn, (min(xs), min(ys), max(xs), max(ys)), c0, c1, direction)

    # -- soft light / shadow
    def glow(self, cx, cy, r, color, strength=1.0):
        size = int(r * 2 * self.s)
        if size < 2:
            return
        tile = radial((size, size), with_alpha(color, int(150 * strength)),
                      with_alpha(color, 0), (0.5, 0.5), 0.5)
        self.img.alpha_composite(tile, (int((cx + self.ox) * self.s - r * self.s),
                                        int((cy + self.oy) * self.s - r * self.s)))

    def shadow(self, cx, cy, rx, ry, color=(40, 55, 40, 90), blur=8, alpha=1.0):
        pad = int(blur * 3)
        w = int(rx * 2 * self.s) + pad * 2
        h = int(ry * 2 * self.s) + pad * 2
        layer = Image.new("RGBA", (max(w, 2), max(h, 2)), (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        ld.ellipse([pad, pad, max(w - pad, pad + 2), max(h - pad, pad + 2)],
                   fill=with_alpha(color, int(color[3] * alpha)))
        layer = layer.filter(ImageFilter.GaussianBlur(blur * self.s))
        self.img.alpha_composite(layer, (int((cx + self.ox) * self.s - w / 2),
                                         int((cy + self.oy) * self.s - h / 2)))

    # -- feathered shapes (mask-based, keeps the canvas opaque)
    def soft_poly(self, pts, colour, blur=20, bbox=None):
        from PIL import ImageFilter
        if bbox is None:
            xs = [q[0] for q in pts]; ys = [q[1] for q in pts]
            bbox = (min(xs) - blur * 3, min(ys) - blur * 3, max(xs) + blur * 3, max(ys) + blur * 3)
        x0, y0, x1, y1 = [int(v) for v in self.box(bbox)]
        x0 = max(0, x0); y0 = max(0, y0)
        x1 = min(self.img.width, x1); y1 = min(self.img.height, y1)
        m = Image.new("L", (max(1, x1 - x0), max(1, y1 - y0)), 0)
        ImageDraw.Draw(m).polygon([((q[0] + self.ox) * self.s - x0, (q[1] + self.oy) * self.s - y0)
                                   for q in pts], fill=255)
        m = m.filter(ImageFilter.GaussianBlur(blur * self.s))
        layer = Image.new("RGBA", m.size, colour)
        layer.putalpha(m)
        self.img.alpha_composite(layer, (x0, y0))

    def soft_ellipse(self, cx, cy, rx, ry, colour, blur=20):
        from PIL import ImageFilter
        pad = int(blur * 3)
        x0 = int((cx - rx + self.ox) * self.s) - pad
        y0 = int((cy - ry + self.oy) * self.s) - pad
        x1 = int((cx + rx + self.ox) * self.s) + pad
        y1 = int((cy + ry + self.oy) * self.s) + pad
        x0 = max(0, x0); y0 = max(0, y0)
        x1 = min(self.img.width, x1); y1 = min(self.img.height, y1)
        m = Image.new("L", (max(1, x1 - x0), max(1, y1 - y0)), 0)
        ImageDraw.Draw(m).ellipse([(cx - rx + self.ox) * self.s - x0, (cy - ry + self.oy) * self.s - y0,
                                   (cx + rx + self.ox) * self.s - x0, (cy + ry + self.oy) * self.s - y0],
                                  fill=255)
        m = m.filter(ImageFilter.GaussianBlur(blur * self.s))
        layer = Image.new("RGBA", m.size, colour)
        layer.putalpha(m)
        self.img.alpha_composite(layer, (x0, y0))

    # -- group rendering
    def layer(self):
        return Canvas(self.w, self.h, self.s)

    def composite(self, other, offset=(0, 0), alpha=1.0):
        other.flush_alpha()
        img = other.img
        if alpha < 1:
            img = img.copy()
            img.putalpha(img.getchannel("A").point(lambda v: int(v * alpha)))
        self.img.alpha_composite(img, (int(offset[0] * self.s), int(offset[1] * self.s)))

    def finish(self):
        self.flush_alpha()
        return self.img.resize((self.w, self.h), Image.LANCZOS)


# ---------------------------------------------------------------- sprite cache
def make_sprite(w, h, drawfn, s=S):
    c = Canvas(w, h, s)
    drawfn(c)
    c.flush_alpha()
    return c.img


def paste(canvas, sprite, x, y, scale=1.0, angle=0.0, alpha=1.0):
    """Paste sprite (design-space px) with its top-left at (x,y)."""
    img = sprite
    if scale != 1.0:
        nw = max(1, int(img.width * scale))
        nh = max(1, int(img.height * scale))
        img = img.resize((nw, nh), Image.LANCZOS)
    if angle:
        img = img.rotate(angle, resample=Image.BICUBIC, expand=True)
    if alpha < 1:
        img = img.copy()
        img.putalpha(img.getchannel("A").point(lambda v: int(v * alpha)))
    canvas.img.alpha_composite(img, (int(x * canvas.s), int(y * canvas.s)))

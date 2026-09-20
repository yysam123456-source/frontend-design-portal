#!/usr/bin/env python3
"""Generate the 1200x630 Open Graph share card for Frontend Design Gallery.

Why this exists: Twitter/X, LinkedIn, Slack and Discord do not render SVG OG
images, so `favicon.svg` produced no card at all. This writes `public/og-image.png`.

Not part of `npm run build` -- the card is a brand asset that changes rarely, so
the PNG is committed. Re-run it when the headline or the catalogue size changes:

    python scripts/generate-og-image.py            # after `npm run build`
    python scripts/generate-og-image.py --counts 5047 9 45

Component/project/category counts are read from `dist/sitemap.xml` so the card
always advertises what is actually indexed rather than a hardcoded guess.

Requires Pillow (`pip install Pillow`).
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:  # pragma: no cover
    sys.exit("Pillow is required: pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
SITEMAP = ROOT / "dist" / "sitemap.xml"
OUT = ROOT / "public" / "og-image.png"

W, H = 1200, 630
BG = (11, 15, 25)  # matches --code-bg in public/seo-pages.css
ACCENT = (255, 77, 0)  # matches --accent
INK = (237, 240, 246)
INK_MUTED = (140, 150, 168)

PAD = 76
SITE = "fxlab.craftisle.com"
BRAND = "Frontend Design Gallery"
HEADLINE = ["Open-source UI components", "& animations, with live previews"]

FONT_CANDIDATES_BOLD = ["segoeuib.ttf", "arialbd.ttf", "arial.ttf"]
FONT_CANDIDATES_REGULAR = ["segoeui.ttf", "arial.ttf"]
FONT_CANDIDATES_MONO = ["consolab.ttf", "consola.ttf", "cour.ttf"]


def load_font(candidates: list[str], size: int):
    """First available font from the candidate list, else Pillow's bitmap default."""
    for name in candidates:
        path = Path("C:/Windows/Fonts") / name
        if path.exists():
            return ImageFont.truetype(str(path), size)
        if Path(name).is_absolute() and Path(name).exists():
            return ImageFont.truetype(name, size)
    return ImageFont.load_default()


def counts_from_sitemap() -> tuple[int, int, int]:
    if not SITEMAP.exists():
        sys.exit(f"sitemap not found at {SITEMAP} -- run `npm run build` first")
    locs = re.findall(r"<loc>([^<]+)</loc>", SITEMAP.read_text(encoding="utf-8"))
    components = sum(1 for u in locs if "/components/" in u)
    projects = sum(1 for u in locs if "/projects/" in u)
    categories = sum(1 for u in locs if "/categories/" in u)
    return components, projects, categories


def rgba_layer() -> Image.Image:
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))


def draw_background(img: Image.Image) -> None:
    """Dot grid + corner glow, composited over the flat base colour."""
    overlay = rgba_layer()
    d = ImageDraw.Draw(overlay)

    # Dot grid: 1px dots on a 34px lattice, barely brighter than the base.
    for y in range(0, H, 34):
        for x in range(0, W, 34):
            d.point((x, y), fill=(255, 255, 255, 22))

    # Two accent glows, built from concentric ellipses (Pillow has no radial fill).
    for (cx, cy, radius, peak) in ((W - 90, -60, 520, 58), (W - 420, H + 150, 380, 30)):
        steps = 60
        for i in range(steps, 0, -1):
            r = radius * i / steps
            alpha = int(peak * (1 - i / steps) ** 2)
            if alpha <= 0:
                continue
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=ACCENT + (alpha,))

    img.alpha_composite(overlay)


def draw_content(img: Image.Image, components: int, projects: int, categories: int) -> None:
    d = ImageDraw.Draw(img)

    f_brand = load_font(FONT_CANDIDATES_BOLD, 30)
    f_head = load_font(FONT_CANDIDATES_BOLD, 66)
    f_stat = load_font(FONT_CANDIDATES_BOLD, 32)
    f_stat_label = load_font(FONT_CANDIDATES_REGULAR, 24)
    f_site = load_font(FONT_CANDIDATES_MONO, 27)

    # ── brand row: accent dot + wordmark ────────────────────────────────
    y = 84
    dot_r = 11
    d.ellipse(
        [PAD, y + 12 - dot_r, PAD + dot_r * 2, y + 12 + dot_r],
        fill=ACCENT,
    )
    d.text((PAD + dot_r * 2 + 16, y - 2), BRAND, font=f_brand, fill=INK)

    # ── headline, shrink to fit the widest line ─────────────────────────
    max_w = W - PAD * 2
    size = 66
    while size > 36:
        f_head = load_font(FONT_CANDIDATES_BOLD, size)
        if max(d.textlength(line, font=f_head) for line in HEADLINE) <= max_w:
            break
        size -= 2

    hy = 214
    for line in HEADLINE:
        # Second line in accent-muted tone for visual hierarchy.
        colour = INK if line is HEADLINE[0] else ACCENT
        d.text((PAD, hy), line, font=f_head, fill=colour)
        hy += int(size * 1.26)

    # ── stat row ────────────────────────────────────────────────────────
    sy = 452
    stats = [
        (f"{components:,}", "components"),
        (str(projects), "source projects"),
        (str(categories), "categories"),
    ]
    sx = PAD
    for i, (value, label) in enumerate(stats):
        if i:
            d.ellipse([sx + 18, sy + 13, sx + 24, sy + 19], fill=(90, 98, 116))
            sx += 42
        d.text((sx, sy), value, font=f_stat, fill=INK)
        vw = d.textlength(value, font=f_stat)
        d.text((sx + vw + 10, sy + 8), label, font=f_stat_label, fill=INK_MUTED)
        sx += vw + 10 + d.textlength(label, font=f_stat_label) + 10

    # ── footer: accent rule + domain ────────────────────────────────────
    d.rectangle([PAD, H - 116, PAD + 54, H - 112], fill=ACCENT)
    d.text((PAD, H - 96), SITE, font=f_site, fill=INK_MUTED)


def main() -> None:
    ap = argparse.ArgumentParser(description="Generate public/og-image.png")
    ap.add_argument(
        "--counts",
        nargs=3,
        type=int,
        metavar=("COMPONENTS", "PROJECTS", "CATEGORIES"),
        help="override the counts read from dist/sitemap.xml",
    )
    args = ap.parse_args()

    if args.counts:
        components, projects, categories = args.counts
    else:
        components, projects, categories = counts_from_sitemap()

    img = Image.new("RGBA", (W, H), BG + (255,))
    draw_background(img)
    draw_content(img, components, projects, categories)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(OUT, "PNG", optimize=True)
    print(f"wrote {OUT} ({OUT.stat().st_size:,} bytes)")
    print(f"  {components:,} components / {projects} projects / {categories} categories")


if __name__ == "__main__":
    main()

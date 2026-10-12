"""Fetch and prepare the world's CC0 assets from Poly Haven (polyhaven.com, CC0, no attribution needed).

Downloads into scratch/polyhaven (gitignored), writes web-ready files into public/world:
  tex/<name>-<size>-albedo.webp   colour
  tex/<name>-512-nr.webp          normal map (RGB) with roughness in alpha
  models/<name>.glb               simplified, meshopt-compressed, 512 px WebP textures
  tex/leaves-cluster.webp, tex/palm-frond.webp, tex/pine-sprig.webp   foliage cards

Usage: python -I scripts/world-assets.py        (re-running skips finished files)
"""
import json
import math
import os
import random
import subprocess
import sys
import urllib.request

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "scratch", "polyhaven")
TEX = os.path.join(ROOT, "public", "world", "tex")
MODELS = os.path.join(ROOT, "public", "world", "models")

# name -> Poly Haven id
TEXTURES = {
    "sand": "aerial_beach_01",
    "grass": "leafy_grass",
    "rock": "aerial_rocks_02",
    "darkrock": "dark_rock",
    "planks": "weathered_planks",
    "concrete": "concrete_floor_02",
    "teak": "teak_veneer",
    "bark": "bark_brown_02",
}

# name -> (Poly Haven id, simplify ratio)
MODEL_LIST = {
    "boulder-b": ("namaqualand_boulder_02", 0.014),
    "boulder-c": ("namaqualand_boulder_03", 0.014),
    "buoy": ("ocean_buoy", 0.5),
    "marker": ("lateral_sea_marker", 0.5),
    "lifebuoy": ("lifebuoy", 0.35),
    "crate": ("wooden_crate_01", 0.6),
    "lamp": ("street_lamp_01", 0.25),
    "fern": ("fern_02", 0.6),
}


UA = {"User-Agent": "dn-portfolio-asset-script/1.0 (design.digitallynext.com)"}


def get_json(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return json.loads(r.read())


def download(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=300) as r, open(path, "wb") as f:
        f.write(r.read())


def texture_set(name, pid):
    files = get_json(f"https://api.polyhaven.com/files/{pid}")
    paths = {}
    for key in ("Diffuse", "nor_gl", "Rough"):
        entry = files.get(key, {}).get("1k")
        if not entry:
            # Some assets name the maps in lower case.
            alt = {"Diffuse": "diff", "Rough": "rough"}.get(key, key)
            entry = files.get(alt, {}).get("1k")
        src = entry.get("jpg") or entry.get("png")
        path = os.path.join(CACHE, "tex", pid, f"{key}.{'jpg' if entry.get('jpg') else 'png'}")
        download(src["url"], path)
        paths[key] = path
    os.makedirs(TEX, exist_ok=True)
    albedo = Image.open(paths["Diffuse"]).convert("RGB")
    normal = Image.open(paths["nor_gl"]).convert("RGB")
    rough = Image.open(paths["Rough"]).convert("L").resize(normal.size)
    # Colour at two sizes (1024 for the full tier); normals with roughness at 512 for everyone.
    for size in (1024, 512):
        a = albedo.resize((size, size), Image.LANCZOS)
        a.save(os.path.join(TEX, f"{name}-{size}-albedo.webp"), "WEBP", quality=80, method=6)
    n = normal.resize((512, 512), Image.LANCZOS)
    r = rough.resize((512, 512), Image.LANCZOS)
    nr = n.copy()
    nr.putalpha(r)
    nr.save(os.path.join(TEX, f"{name}-512-nr.webp"), "WEBP", quality=74, method=6)
    print("texture", name, pid)


def model(name, pid, ratio):
    out = os.path.join(MODELS, f"{name}.glb")
    if os.path.exists(out):
        return
    files = get_json(f"https://api.polyhaven.com/files/{pid}")
    g = files["gltf"]["1k"]["gltf"]
    folder = os.path.join(CACHE, "models", pid)
    gltf_path = os.path.join(folder, f"{pid}.gltf")
    download(g["url"], gltf_path)
    for rel, f in g["include"].items():
        download(f["url"], os.path.join(folder, rel))
    os.makedirs(MODELS, exist_ok=True)
    cmd = [
        "npx", "-y", "@gltf-transform/cli@4", "optimize", gltf_path, out,
        "--compress", "meshopt", "--texture-compress", "webp", "--texture-size", "512",
        "--simplify", "true" if ratio < 1 else "false",
        "--simplify-ratio", str(ratio), "--simplify-error", "0.01" if name.startswith("boulder") else "0.002",
        "--palette", "false",
    ]
    subprocess.run(cmd, check=True, shell=(os.name == "nt"))
    if name.startswith("boulder"):
        # Photoscans keep UV seams that stop the first pass early; a second, looser pass gets
        # each rock to about 1,500 triangles, with the scan's normal map carrying the detail.
        tmp = out + ".tmp.glb"
        os.replace(out, tmp)
        subprocess.run(["npx", "-y", "@gltf-transform/cli@4", "simplify", tmp, out, "--ratio", "0.12", "--error", "0.03"], check=True, shell=(os.name == "nt"))
        os.remove(tmp)
    print("model", name, pid, os.path.getsize(out) // 1024, "KB")


# ---------------------------------------------------------------------------------------------
# Foliage cards, composed from Poly Haven leaf scans (island_tree_02) or drawn.

def leaves_cluster():
    out = os.path.join(TEX, "leaves-cluster.webp")
    if os.path.exists(out):
        return
    files = get_json("https://api.polyhaven.com/files/island_tree_02")
    diff = os.path.join(CACHE, "tex", "island_tree_02", "leaves_diff.jpg")
    alpha = os.path.join(CACHE, "tex", "island_tree_02", "leaves_alpha.jpg")
    download(files["leaves_diff"]["1k"]["jpg"]["url"], diff)
    download(files["leaves_alpha"]["1k"]["jpg"]["url"], alpha)
    atlas = Image.open(diff).convert("RGB")
    mask = Image.open(alpha).convert("L").resize(atlas.size)
    rgba = atlas.copy()
    rgba.putalpha(mask)
    # Cut out each leaf from the atlas by finding connected alpha regions on a coarse grid.
    w, h = rgba.size
    leaves = []
    small = mask.resize((64, 64))
    seen = set()
    for y in range(64):
        for x in range(64):
            if (x, y) in seen or small.getpixel((x, y)) < 128:
                continue
            stack = [(x, y)]
            box = [x, y, x, y]
            while stack:
                cx, cy = stack.pop()
                if (cx, cy) in seen or cx < 0 or cy < 0 or cx >= 64 or cy >= 64 or small.getpixel((cx, cy)) < 128:
                    continue
                seen.add((cx, cy))
                box = [min(box[0], cx), min(box[1], cy), max(box[2], cx), max(box[3], cy)]
                stack += [(cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)]
            if (box[2] - box[0]) * (box[3] - box[1]) > 6:
                s = w / 64
                leaves.append(rgba.crop((int((box[0] - 1) * s), int((box[1] - 1) * s), int((box[2] + 2) * s), int((box[3] + 2) * s))))
    random.seed(7)
    size = 512
    card = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(card)
    # A twig through the middle, then leaves fanned along it.
    draw.line([(size * 0.5, size * 0.98), (size * 0.5, size * 0.1)], fill=(74, 58, 40, 255), width=6)
    for i in range(26):
        leaf = random.choice(leaves)
        scale = random.uniform(0.38, 0.55) * size / max(leaf.size)
        lf = leaf.resize((max(1, int(leaf.size[0] * scale)), max(1, int(leaf.size[1] * scale))), Image.LANCZOS)
        t = i / 26
        side = -1 if i % 2 else 1
        angle = side * random.uniform(25, 70) + random.uniform(-10, 10)
        lf = lf.rotate(angle, expand=True, resample=Image.BICUBIC)
        # Slight colour variation per leaf.
        tint = random.uniform(0.82, 1.08)
        r, g, b, a = lf.split()
        r = r.point(lambda v: min(255, int(v * tint * 0.95)))
        g = g.point(lambda v: min(255, int(v * tint)))
        lf = Image.merge("RGBA", (r, g, b, a))
        cx = size * 0.5 + side * random.uniform(20, 110) * (0.4 + t)
        cy = size * (0.92 - t * 0.82) + random.uniform(-20, 20)
        card.alpha_composite(lf, (int(cx - lf.size[0] / 2), int(cy - lf.size[1] / 2)))
    card.save(out, "WEBP", quality=88, method=6)
    print("leaves cluster from", len(leaves), "leaves")


def _leaf_scans():
    """Individual leaves cut from the island_tree_02 leaf atlas (CC0), as RGBA images."""
    diff = os.path.join(CACHE, "tex", "island_tree_02", "leaves_diff.jpg")
    alpha = os.path.join(CACHE, "tex", "island_tree_02", "leaves_alpha.jpg")
    atlas = Image.open(diff).convert("RGB")
    mask = Image.open(alpha).convert("L").resize(atlas.size)
    rgba = atlas.copy()
    rgba.putalpha(mask)
    w = rgba.size[0]
    small = mask.resize((64, 64))
    seen, leaves = set(), []
    for y in range(64):
        for x in range(64):
            if (x, y) in seen or small.getpixel((x, y)) < 128:
                continue
            stack, box = [(x, y)], [x, y, x, y]
            while stack:
                cx, cy = stack.pop()
                if (cx, cy) in seen or not (0 <= cx < 64 and 0 <= cy < 64) or small.getpixel((cx, cy)) < 128:
                    continue
                seen.add((cx, cy))
                box = [min(box[0], cx), min(box[1], cy), max(box[2], cx), max(box[3], cy)]
                stack += [(cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)]
            if (box[2] - box[0]) * (box[3] - box[1]) > 6:
                k = w / 64
                leaves.append(rgba.crop((int((box[0] - 1) * k), int((box[1] - 1) * k), int((box[2] + 2) * k), int((box[3] + 2) * k))))
    return leaves


def palm_frond():
    """A palm frond: leaf scans stretched into long leaflets, either side of a rachis."""
    out = os.path.join(TEX, "palm-frond.webp")
    if os.path.exists(out):
        return
    random.seed(11)
    leaves = _leaf_scans()
    W, H = 512, 1024
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    n = 46
    for i in range(n):
        t = i / n
        y = H * (0.05 + t * 0.9)
        length = int(((1 - t) ** 0.55) * W * 0.5 + 24)
        width = max(10, int(34 * (1 - t * 0.5)))
        for side in (-1, 1):
            leaf = random.choice(leaves)
            strip = leaf.resize((width, length), Image.LANCZOS)  # long and thin
            # Point the leaflet out and slightly toward the tip of the frond.
            angle = side * (90 - random.uniform(28, 38))
            rot = strip.rotate(angle, expand=True, resample=Image.BICUBIC)
            tint = random.uniform(0.8, 1.05)
            r, g, b, a = rot.split()
            g = g.point(lambda v: min(255, int(v * tint * 1.05)))
            r = r.point(lambda v: int(v * tint * 0.9))
            rot = Image.merge("RGBA", (r, g, b, a))
            ox = W / 2 + side * rot.size[0] / 2 - side * 6
            img.alpha_composite(rot, (int(ox - rot.size[0] / 2), int(y - rot.size[1] / 2 - length * 0.18)))
    d = ImageDraw.Draw(img)
    d.line([(W / 2, H * 0.02), (W / 2, H * 0.98)], fill=(92, 104, 52, 255), width=7)
    img.save(out, "WEBP", quality=86, method=6)
    print("palm frond")


def pine_sprig():
    """A fir sprig: a stem with branchlets fanned either side, dense needles on both edges."""
    out = os.path.join(TEX, "pine-sprig.webp")
    if os.path.exists(out):
        return
    random.seed(13)
    S = 512
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    stem_top, stem_bottom = (S * 0.5, S * 0.04), (S * 0.5, S * 0.98)
    for b in range(16):
        t = b / 16
        by = stem_top[1] + (stem_bottom[1] - stem_top[1]) * t
        for side in (-1, 1):
            length = S * (0.16 + 0.3 * t) * random.uniform(0.85, 1.1)
            ang = math.radians(25 + random.uniform(-6, 6))
            ex = S / 2 + side * math.cos(ang) * length
            ey = by - math.sin(ang) * length * 0.55
            d.line([(S / 2, by), (ex, ey)], fill=(66, 50, 34, 255), width=3)
            for k in range(int(length / 2.2)):
                u = k / (length / 2.2)
                px = S / 2 + (ex - S / 2) * u
                py = by + (ey - by) * u
                for e in (-1, 1):
                    nl = random.uniform(10, 18) * (1 - u * 0.3)
                    na = math.atan2(ey - by, ex - S / 2) + e * random.uniform(0.7, 1.1)
                    g = random.randint(58, 98)
                    col = (int(g * 0.38), g, int(g * 0.5), 255)
                    d.line([(px, py), (px + math.cos(na) * nl, py + math.sin(na) * nl)], fill=col, width=2)
    d.line([stem_top, stem_bottom], fill=(70, 52, 36, 255), width=5)
    img.save(out, "WEBP", quality=86, method=6)
    print("pine sprig")


def main():
    for name, pid in TEXTURES.items():
        if os.path.exists(os.path.join(TEX, f"{name}-512-nr.webp")):
            continue
        texture_set(name, pid)
    for name, (pid, ratio) in MODEL_LIST.items():
        model(name, pid, ratio)
    leaves_cluster()
    palm_frond()
    pine_sprig()
    total = sum(os.path.getsize(os.path.join(d, f)) for d in (TEX, MODELS) for f in os.listdir(d))
    print("total", total // 1024, "KB")


if __name__ == "__main__":
    sys.exit(main())

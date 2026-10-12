"""Fetch and prepare the world's assets. Textures and props are CC0 scans from Poly Haven
(polyhaven.com, no attribution needed); the client models (SKELMET's skull, the Know Your Genes
mascots) and the photos on in-world screens come from this repo and get lighter world copies.

Downloads into scratch/polyhaven (gitignored), writes web-ready files into public/world:
  tex/<name>-512-albedo.webp      colour, for everyone
  tex/<name>-1024-albedo.webp     colour, full quality on desktops (ground layers only)
  tex/<name>-nr-512.webp          normal X and Y in red and green, roughness in blue
  tex/<name>-nr-256.webp          the same for phones (the shader rebuilds normal Z)
  tex/leaves-cluster.webp, tex/palm-frond.webp, tex/pine-sprig.webp   foliage cards
  models/<name>.glb               props: simplified, meshopt, small WebP textures
  models/skull.glb                SKELMET's print file, simplified for the world
  models/kyg/<id>.glb             the Know Your Genes mascots, simplified for the world
  img/<name>.webp                 photos shown on in-world screens and billboards, at screen size

Why these sizes: the camera sits 22-86 m from the boat, so a 9 m ground tile at 512 px already
matches a desktop screen; 1024 px only shows on retina screens zoomed in, so only the ground
layers that fill the view get it. Phones sample the 256 px mip level almost everywhere.

Usage: python -I scripts/world-assets.py [--force]   (re-running skips finished files)
"""
import json
import math
import os
import random
import shutil
import struct
import subprocess
import sys
import urllib.request

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "scratch", "polyhaven")
WORK = os.path.join(ROOT, "scratch", "world-assets")
TEX = os.path.join(ROOT, "public", "world", "tex")
MODELS = os.path.join(ROOT, "public", "world", "models")
IMG = os.path.join(ROOT, "public", "world", "img")
FORCE = "--force" in sys.argv

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
# Ground layers that fill the view get a 1024 px colour map on desktops; everything else (planks,
# concrete, the boat's teak, bark on thin trunks) never shows more than 512 px on screen.
FULL_RES = {"sand", "grass", "rock", "darkrock"}

# name -> (Poly Haven id, simplify ratio, colour map px, detail maps px)
MODEL_LIST = {
    "boulder-b": ("namaqualand_boulder_02", 0.014, 512, 256),
    "boulder-c": ("namaqualand_boulder_03", 0.014, 512, 256),
    "buoy": ("ocean_buoy", 0.5, 256, 256),
    "marker": ("lateral_sea_marker", 0.5, 256, 256),
    "lifebuoy": ("lifebuoy", 0.35, 256, 256),
    "crate": ("wooden_crate_01", 0.6, 256, 256),
    "lamp": ("street_lamp_01", 0.25, 256, 256),
    "fern": ("fern_02", 0.6, 256, 256),
}

# The Know Your Genes mascots: the case study shows the originals up close (public/models/kyg);
# the world sees them from 20 m and more, so it gets simplified copies.
KYG = ["genee", "vita", "cardi", "dozy", "guard", "glow"]

# Photos on in-world screens and billboards -> (source under public/, width px).
SCREENS = {
    "studio-team": ("studio/team.webp", 640),
    "studio-c1": ("studio/c1.webp", 640),
    "studio-workhere": ("studio/workhere.webp", 640),
    "dnms-dashboard-hr": ("work/dnms/dashboard-hr.webp", 512),
    "dnms-analytics": ("work/dnms/analytics.webp", 512),
    "dnms-project-goals": ("work/dnms/project-goals.webp", 512),
    "dnms-ai-connections": ("work/dnms/ai-connections.webp", 512),
    "reel-poster": ("video/reel-poster.webp", 960),
}
# The archive's floating screens (9 m wide; they load as the boat comes near).
for _name in ("advent-global", "imet-global", "khaleej", "house-of-nandini", "mauli", "gajna-overseas", "sanjivani-edge", "opinova-foundation", "neotech-world-lab", "neet-playbook"):
    SCREENS[f"archive-{_name}"] = (f"archive/{_name}.webp", 768)


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


def todo(path):
    """True when an output still has to be (re)made."""
    return FORCE or not os.path.exists(path)


def gt(*args):
    """Run a glTF-Transform CLI command."""
    subprocess.run(["npx", "-y", "@gltf-transform/cli@4", *args], check=True, shell=(os.name == "nt"), stdout=subprocess.DEVNULL)


def kb(path):
    return f"{os.path.getsize(path) // 1024} KB"


def texture_set(name, pid):
    outs = [os.path.join(TEX, f"{name}-512-albedo.webp"), os.path.join(TEX, f"{name}-nr-512.webp"), os.path.join(TEX, f"{name}-nr-256.webp")]
    if name in FULL_RES:
        outs.append(os.path.join(TEX, f"{name}-1024-albedo.webp"))
    if not any(todo(o) for o in outs):
        return
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
    # Colour: 512 px for everyone at high quality; 1024 px for the ground layers on desktops, at a
    # quality where WebP's loss stays under the detail the extra pixels add.
    albedo.resize((512, 512), Image.LANCZOS).save(outs[0], "WEBP", quality=85, method=6)
    if name in FULL_RES:
        albedo.resize((1024, 1024), Image.LANCZOS).save(outs[3], "WEBP", quality=72, method=6)
    # Normal X and Y with roughness as the third channel. No alpha plane (WebP stores alpha apart,
    # at great cost), and the redundant Z gives way to roughness; the shader rebuilds Z.
    for size, out in ((512, outs[1]), (256, outs[2])):
        x, y, _ = normal.resize((size, size), Image.LANCZOS).split()
        r = rough.resize((size, size), Image.LANCZOS)
        Image.merge("RGB", (x, y, r)).save(out, "WEBP", quality=85, method=6)
    print("texture", name, pid, ", ".join(f"{os.path.basename(o)} {kb(o)}" for o in outs))


def model(name, pid, ratio, albedo_px, detail_px):
    out = os.path.join(MODELS, f"{name}.glb")
    if not todo(out):
        return
    files = get_json(f"https://api.polyhaven.com/files/{pid}")
    g = files["gltf"]["1k"]["gltf"]
    folder = os.path.join(CACHE, "models", pid)
    gltf_path = os.path.join(folder, f"{pid}.gltf")
    download(g["url"], gltf_path)
    for rel, f in g["include"].items():
        download(f["url"], os.path.join(folder, rel))
    os.makedirs(MODELS, exist_ok=True)
    os.makedirs(WORK, exist_ok=True)
    a = os.path.join(WORK, f"{name}.a.glb")
    b = os.path.join(WORK, f"{name}.b.glb")
    gt(
        "optimize", gltf_path, a,
        "--compress", "false", "--texture-compress", "webp", "--texture-size", str(albedo_px),
        "--simplify", "true" if ratio < 1 else "false",
        "--simplify-ratio", str(ratio), "--simplify-error", "0.01" if name.startswith("boulder") else "0.002",
        "--palette", "false",
    )
    # Simplifying before quantisation (meshopt comes last) takes each boulder scan to about 1,500
    # triangles in one pass, with the scan's normal map carrying the detail.
    if detail_px < albedo_px:
        # Normal, roughness and emission maps carry less than colour at prop scale.
        for pattern in ("*nor_gl*", "*rough*", "*emission*"):
            gt("resize", a, b, "--width", str(detail_px), "--height", str(detail_px), "--pattern", pattern)
            shutil.move(b, a)
    # Last, so no step above undoes it: quantise and meshopt-compress the geometry.
    gt("meshopt", a, out)
    os.remove(a)
    print("model", name, pid, kb(out))


def skull_lod():
    """SKELMET's print file (188k triangles, for the case study) at about 6% for the world: it stands
    2.4 m tall and never covers more than a few hundred pixels."""
    out = os.path.join(MODELS, "skull.glb")
    if not todo(out):
        return
    os.makedirs(WORK, exist_ok=True)
    a = os.path.join(WORK, "skull.a.glb")
    gt("simplify", os.path.join(ROOT, "public", "models", "skelmet", "skull.glb"), a, "--ratio", "0.06", "--error", "0.004")
    gt("meshopt", a, out)
    os.remove(a)
    print("model skull (world)", kb(out))


def kyg_lods():
    """The mascots for the world (2.6 m tall, seen from 20 m and more): an eighth of the triangles
    where the UV seams allow (GENEe's generated atlas keeps it near 14k), 512 px textures,
    materials merged into a palette, meshopt; every animation clip kept."""
    os.makedirs(os.path.join(MODELS, "kyg"), exist_ok=True)
    for cid in KYG:
        out = os.path.join(MODELS, "kyg", f"{cid}.glb")
        if not todo(out):
            continue
        gt(
            "optimize", os.path.join(ROOT, "public", "models", "kyg", f"{cid}.glb"), out,
            "--compress", "meshopt", "--texture-compress", "webp", "--texture-size", "512",
            "--simplify", "true", "--simplify-ratio", "0.12", "--simplify-error", "0.01",
        )
        linear_samplers(out)
        print("model kyg", cid, kb(out))


def linear_samplers(path):
    """The palette texture's sampler is NEAREST; three r186 (WebGPU) can then emit filtered sampling
    code without declaring the sampler. Each palette block is sampled at its centre, so LINEAR
    without mipmaps returns the same exact colours."""
    with open(path, "rb") as f:
        data = f.read()
    json_len = struct.unpack_from("<I", data, 12)[0]
    doc = json.loads(data[20 : 20 + json_len])
    changed = False
    for s in doc.get("samplers", []):
        if s.get("magFilter") == 9728 or s.get("minFilter") in (9728, 9984, 9986):
            s["magFilter"] = 9729
            s["minFilter"] = 9729
            changed = True
    if not changed:
        return
    chunk = json.dumps(doc, separators=(",", ":")).encode()
    chunk += b" " * (-len(chunk) % 4)
    rest = data[20 + json_len :]
    body = struct.pack("<II", len(chunk), 0x4E4F534A) + chunk + rest
    with open(path, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, 12 + len(body)) + body)


def screens():
    """Photos on in-world screens: a billboard 3 m tall never needs more than about 640 px."""
    os.makedirs(IMG, exist_ok=True)
    for name, (rel, width) in SCREENS.items():
        out = os.path.join(IMG, f"{name}.webp")
        if not todo(out):
            continue
        img = Image.open(os.path.join(ROOT, "public", rel)).convert("RGB")
        if img.width > width:
            img = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
        img.save(out, "WEBP", quality=80, method=6)
        print("screen", name, img.size, kb(out))


# ---------------------------------------------------------------------------------------------
# Foliage cards, composed from Poly Haven leaf scans (island_tree_02) or drawn.

def leaves_cluster():
    out = os.path.join(TEX, "leaves-cluster.webp")
    if not todo(out):
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
    card.save(out, "WEBP", quality=80, alpha_quality=70, method=6)
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
    if not todo(out):
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
    img.save(out, "WEBP", quality=80, alpha_quality=60, method=6)
    print("palm frond")


def pine_sprig():
    """A fir sprig: a stem with branchlets fanned either side, dense needles on both edges."""
    out = os.path.join(TEX, "pine-sprig.webp")
    if not todo(out):
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
    img.save(out, "WEBP", quality=80, alpha_quality=70, method=6)
    print("pine sprig")


def main():
    for name, pid in TEXTURES.items():
        texture_set(name, pid)
    for name, (pid, ratio, albedo_px, detail_px) in MODEL_LIST.items():
        model(name, pid, ratio, albedo_px, detail_px)
    skull_lod()
    kyg_lods()
    leaves_cluster()
    palm_frond()
    pine_sprig()
    screens()
    total = 0
    for d in (TEX, MODELS, os.path.join(MODELS, "kyg"), IMG):
        total += sum(os.path.getsize(os.path.join(d, f)) for f in os.listdir(d) if os.path.isfile(os.path.join(d, f)))
    print("total", total // 1024, "KB")


if __name__ == "__main__":
    sys.exit(main())

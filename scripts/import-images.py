"""Copy source images into public/, resized and converted to WebP, and print their final sizes.

Usage: python -I scripts/import-images.py <dest_dir> <max_width> <src> [<src> ...]
Each src may be "path" or "path=name" to rename the output (extension is always .webp).
Prints one JSON line per image: {"src": "/work/...", "width": w, "height": h, "kb": n}.
"""

import json
import os
import sys

from PIL import Image


def main() -> None:
    dest, max_width, sources = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
    os.makedirs(dest, exist_ok=True)
    public = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "public"))
    for spec in sources:
        path, _, name = spec.partition("=")
        stem = name or os.path.splitext(os.path.basename(path))[0]
        image = Image.open(path)
        image = image.convert("RGBA" if image.mode in ("RGBA", "LA", "P") else "RGB")
        if image.width > max_width:
            image = image.resize((max_width, round(image.height * max_width / image.width)), Image.LANCZOS)
        out = os.path.join(dest, f"{stem}.webp")
        image.save(out, "WEBP", quality=82, method=6)
        rel = "/" + os.path.relpath(os.path.abspath(out), public).replace(os.sep, "/")
        print(json.dumps({"src": rel, "width": image.width, "height": image.height, "kb": os.path.getsize(out) // 1024}))


if __name__ == "__main__":
    main()

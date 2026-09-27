#!/usr/bin/env python3
"""
fit.py — place transparent cut-outs onto fixed canvases.

Pose cards (each figure scaled independently to a target height, feet on a baseline):
  python3 fit.py canvas --size 1200,1600 --baseline 1517 --height 1440 --max-w 1150 \
      in1.png=assets/photobooth/poses/pose-vsign.webp in2.png=...

Sprite frames (ONE shared scale for all frames so animation doesn't pulse; bottom-center anchor):
  python3 fit.py frames --size 320,400 --pad 6 in1.png=out1.webp in2.png=out2.webp ...

Inputs must already have alpha (use whitebg_alpha.py, slice_sheet.py or Higgsfield remove_background).
Tiny stray specks (<0.2% of the figure) are removed before measuring.
"""
import argparse, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi


def clean(im):
    a = np.asarray(im).copy()
    m = a[..., 3] > 30
    lab, n = ndi.label(ndi.binary_dilation(m, iterations=3))
    if n > 1:
        sizes = ndi.sum(m, lab, range(1, n + 1))
        keep = np.zeros(n + 1, bool)
        keep[1:] = sizes >= 0.002 * sizes.max()
        a[..., 3] = np.where(keep[lab], a[..., 3], 0)
    ys, xs = np.where(a[..., 3] > 30)
    return Image.fromarray(a, 'RGBA').crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def save(im, path):
    os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
    if path.endswith('.webp'):
        im.save(path, 'WEBP', quality=88, method=6)
    else:
        im.save(path, optimize=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('mode', choices=['canvas', 'frames'])
    ap.add_argument('--size', required=True)
    ap.add_argument('--baseline', type=int)
    ap.add_argument('--height', type=int)
    ap.add_argument('--max-w', type=int)
    ap.add_argument('--pad', type=int, default=6)
    ap.add_argument('pairs', nargs='+')
    a = ap.parse_args()
    W, H = (int(v) for v in a.size.split(','))
    pairs = [p.split('=', 1) for p in a.pairs]
    crops = [(clean(Image.open(i).convert('RGBA')), o) for i, o in pairs]
    if a.mode == 'canvas':
        base = a.baseline or H - 80
        th = a.height or int(H * 0.9)
        mw = a.max_w or W - 40
        for im, out in crops:
            s = min(th / im.height, mw / im.width)
            r = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
            c = Image.new('RGBA', (W, H), (0, 0, 0, 0))
            c.alpha_composite(r, ((W - r.width) // 2, max(0, base - r.height)))
            save(c, out); print(out, r.size)
    else:
        s = min(min((H - 2 * a.pad) / im.height, (W - 2 * a.pad) / im.width) for im, _ in crops)
        for im, out in crops:
            r = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
            c = Image.new('RGBA', (W, H), (0, 0, 0, 0))
            c.alpha_composite(r, ((W - r.width) // 2, H - a.pad - r.height))
            save(c, out); print(out, r.size, 'scale', round(s, 4))


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
slice_sheet.py — cut a generated item sheet (grid layout, background removed)
into individual transparent assets.

  python3 slice_sheet.py sheet_nobg.png --grid 4x3 --ids a,b,c,... --outdir DIR
      [--size 256] [--pad 0.06] [--fmt webp] [--min-alpha 24] [--preview out.jpg]

Items are assigned to grid cells by the centroid of their connected components,
so small detached parts (sparkles, steam) stay with their item. Use "-" in
--ids to skip a cell. Each output is the item's bbox, padded, fitted into a
size×size transparent square (or --keep-aspect to keep bbox aspect, max side = size).
"""
import argparse, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('sheet')
    ap.add_argument('--grid', default='1x1', help='COLSxROWS')
    ap.add_argument('--ids', default='')
    ap.add_argument('--outdir', required=True)
    ap.add_argument('--size', type=int, default=256)
    ap.add_argument('--pad', type=float, default=0.06)
    ap.add_argument('--fmt', default='webp')
    ap.add_argument('--min-alpha', type=int, default=24)
    ap.add_argument('--keep-aspect', action='store_true')
    ap.add_argument('--min-area', type=float, default=0.0004, help='fraction of sheet area')
    ap.add_argument('--preview')
    ap.add_argument('--open', type=int, default=0, help='binary opening iterations before labeling')
    ap.add_argument('--dilate', type=int, default=3, help='dilation iterations used to group nearby parts')
    ap.add_argument('--drop-large', type=float, default=0.55,
                    help='drop components whose bbox spans more than this fraction of sheet width or height (grid lines)')
    ap.add_argument('--boxes', help='instead of --grid cells: "id:x0,y0,x1,y1;id2:..." (sheet px); components whose centroid is inside a box belong to it')
    a = ap.parse_args()

    cols, rows = (int(v) for v in a.grid.lower().split('x'))
    boxes_def = []
    if a.boxes:
        for part in a.boxes.split(';'):
            if not part.strip():
                continue
            name, coords = part.split(':')
            boxes_def.append((name.strip(), tuple(int(float(v)) for v in coords.split(','))))
        ids = [b[0] for b in boxes_def]
    else:
        ids = [s.strip() for s in a.ids.split(',')]
    im = Image.open(a.sheet).convert('RGBA')
    arr = np.asarray(im)
    H, W = arr.shape[:2]
    alpha = arr[..., 3]
    mask = alpha > a.min_alpha
    # erase straight full-length grid lines (rows/cols that are mostly opaque)
    rows_full = mask.mean(axis=1) > 0.95
    cols_full = mask.mean(axis=0) > 0.95
    rows_full = ndi.binary_dilation(rows_full, iterations=3)
    cols_full = ndi.binary_dilation(cols_full, iterations=3)
    if rows_full.any() or cols_full.any():
        print(f'   erased grid lines: {int(rows_full.sum())} rows, {int(cols_full.sum())} cols')
        mask[rows_full, :] = False
        mask[:, cols_full] = False
    if a.open > 0:
        # break thin grid lines / hairline shadows that would glue items together
        mask = ndi.binary_opening(mask, structure=np.ones((3, 3)), iterations=a.open)
    lab, n = ndi.label(ndi.binary_dilation(mask, iterations=a.dilate))
    cells = {}
    objs = ndi.find_objects(lab)
    for i, sl in enumerate(objs, start=1):
        if sl is None:
            continue
        comp = (lab[sl] == i) & mask[sl]
        area = comp.sum()
        if area < a.min_area * W * H:
            continue
        bw_, bh_ = sl[1].stop - sl[1].start, sl[0].stop - sl[0].start
        if bw_ > a.drop_large * W or bh_ > a.drop_large * H:
            print(f'   dropped large component {bw_}x{bh_} (grid line / frame)')
            continue
        cy, cx = ndi.center_of_mass(comp)
        cy += sl[0].start; cx += sl[1].start
        box = (sl[1].start, sl[0].start, sl[1].stop, sl[0].stop)
        if boxes_def:
            for bi, (_, (bx0, by0, bx1, by1)) in enumerate(boxes_def):
                if bx0 <= cx < bx1 and by0 <= cy < by1:
                    cells.setdefault(bi, []).append((box, i))
                    break
            continue
        c, r = int(cx / W * cols), int(cy / H * rows)
        c, r = min(c, cols - 1), min(r, rows - 1)
        cells.setdefault(r * cols + c, []).append((box, i))
    os.makedirs(a.outdir, exist_ok=True)
    thumbs = []
    for idx, name in enumerate(ids):
        if name == '-' or not name:
            continue
        if idx not in cells:
            print(f'!! cell {idx} ({name}) empty')
            continue
        boxes = [b for b, _ in cells[idx]]
        labels = [l for _, l in cells[idx]]
        x0 = min(b[0] for b in boxes); y0 = min(b[1] for b in boxes)
        x1 = max(b[2] for b in boxes); y1 = max(b[3] for b in boxes)
        keep = np.isin(lab[y0:y1, x0:x1], labels)
        crop = arr[y0:y1, x0:x1].copy()
        crop[..., 3] = np.where(keep, crop[..., 3], 0)
        ci = Image.fromarray(crop, 'RGBA')
        bw, bh = ci.size
        side = max(bw, bh)
        padpx = int(side * a.pad)
        if a.keep_aspect:
            canvas = Image.new('RGBA', (bw + 2 * padpx, bh + 2 * padpx), (0, 0, 0, 0))
            canvas.paste(ci, (padpx, padpx))
            s = a.size / max(canvas.size)
            out = canvas.resize((max(1, round(canvas.width * s)), max(1, round(canvas.height * s))), Image.LANCZOS)
        else:
            canvas = Image.new('RGBA', (side + 2 * padpx, side + 2 * padpx), (0, 0, 0, 0))
            canvas.paste(ci, ((side - bw) // 2 + padpx, (side - bh) // 2 + padpx))
            out = canvas.resize((a.size, a.size), Image.LANCZOS)
        p = os.path.join(a.outdir, f'{name}.{a.fmt}')
        if a.fmt == 'webp':
            out.save(p, 'WEBP', quality=90, method=6)
        else:
            out.save(p, optimize=True)
        thumbs.append(out)
        print(f'{name}: bbox {bw}x{bh} -> {out.size} ({len(boxes)} parts)')
    extra = sorted(set(cells) - set(i for i, n in enumerate(ids) if n and n != '-'))
    if extra:
        print('!! unassigned cells with content:', extra)
    if a.preview and thumbs:
        t = 128
        per = 8
        rows_ = (len(thumbs) + per - 1) // per
        sheet = Image.new('RGB', (per * t, rows_ * t), (255, 0, 255))
        for k, th in enumerate(thumbs):
            th = th.copy(); th.thumbnail((t, t))
            bg = Image.new('RGBA', (t, t), (255, 0, 255, 255))
            bg.alpha_composite(th, ((t - th.width) // 2, (t - th.height) // 2))
            sheet.paste(bg.convert('RGB'), ((k % per) * t, (k // per) * t))
        sheet.save(a.preview, quality=85)


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
make_layer.py — production wrapper: turn an edited canonical-base generation into a
final Dress Up layer (1200x1600 WebP) + 200x200 thumbnail + QA preview.

  python3 make_layer.py <slot> <item_id> <edit.png> [--thresh N] [--region x0,y0,x1,y1]
                        [--exclude x0,y0,x1,y1 ...] [--out-name NAME]

Slots: head | shoes | bottom | top | shirt | knit | hoodie | outer | accessory | bag | hat
All coordinates are in canonical-base pixels (1728x2304). See docs/ASSET_GUIDE (anchors).

The canonical base is art-source/character/base_b.png (job 38a8b081-d104-4ae6-91cf-c4ef80716e8a),
its matte art-source/character/test-edits/base_nobg.png (job a93e0dc3-...).
"""
import argparse, os, subprocess, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BASE = os.path.join(ROOT, 'art-source/character/base_b.png')
BASE_A = os.path.join(ROOT, 'art-source/character/test-edits/base_nobg.png')
PREV = '/private/tmp/claude-501/-Users-ayda-Desktop-hamingames/e42f78d2-ad95-4f53-970e-ee004cb22257/scratchpad/previews/layers'
FINAL = (1200, 1600)
CHIN_Y = 405  # chin line in base px: head layers end here, body layer starts here

HEAD_BOX = (660, 60, 1070, CHIN_Y)
ANCHOR_HEAD = '720,120,1000,380'      # unchanged region for clothing edits
ANCHOR_BODY = '600,1300,1150,1880'    # unchanged region for head/hair/expression edits

SLOTS = {
    # region, anchor, thresh, mode, extra
    'head':      dict(region=f'{HEAD_BOX[0]},{HEAD_BOX[1]},{HEAD_BOX[2]},{HEAD_BOX[3]}', anchor=ANCHOR_BODY, mode='alpha', feather=26),
    'hat':       dict(region='600,20,1130,360', anchor=ANCHOR_BODY, thresh=10),
    'top':       dict(region='440,400,1290,1320', anchor=ANCHOR_HEAD, thresh=9),
    'shirt':     dict(region='440,400,1290,1400', anchor=ANCHOR_HEAD, thresh=9),
    'knit':      dict(region='440,400,1290,1320', anchor=ANCHOR_HEAD, thresh=9),
    'hoodie':    dict(region='440,330,1290,1360', anchor=ANCHOR_HEAD, thresh=9),
    'outer':     dict(region='420,380,1310,1900', anchor=ANCHOR_HEAD, thresh=9),
    'bottom':    dict(region='480,940,1250,2010', anchor=ANCHOR_HEAD, thresh=8),
    'shoes':     dict(region='420,1860,1310,2304', anchor=ANCHOR_HEAD, thresh=10),
    'accessory': dict(region='420,300,1310,1500', anchor=ANCHOR_HEAD, thresh=11),
    'bag':       dict(region='400,380,1330,1600', anchor=ANCHOR_HEAD, thresh=10),
}


def flat_bg_alpha(rgb, tol=16.0, soft=36.0):
    """Alpha for a generation on a flat light background (border flood fill)."""
    im = rgb.astype(np.float32)
    border = np.concatenate([im[0], im[-1], im[:, 0], im[:, -1]])
    bgc = np.median(border, axis=0)
    dist = np.sqrt(((im - bgc) ** 2).sum(-1))
    lab, _ = ndi.label(dist < tol)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge))
    alpha = np.ones(dist.shape, np.float32)
    alpha[bg] = 0
    near = ndi.binary_dilation(bg, iterations=2) & ~bg
    alpha[near] = np.clip((dist[near] - tol * 0.5) / (soft - tol * 0.5), 0, 1)
    return alpha


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('slot'); ap.add_argument('item_id'); ap.add_argument('edit')
    ap.add_argument('--thresh', type=float)
    ap.add_argument('--region')
    ap.add_argument('--exclude', action='append', default=[])
    ap.add_argument('--out-name')
    ap.add_argument('--no-thumb', action='store_true')
    a = ap.parse_args()
    cfg = dict(SLOTS[a.slot])
    region = a.region or cfg['region']
    name = a.out_name or a.item_id
    tmp_dir = os.path.join(ROOT, 'art-source/layers-work'); os.makedirs(tmp_dir, exist_ok=True)
    os.makedirs(PREV, exist_ok=True)
    full = os.path.join(tmp_dir, f'{name}_full.png')

    # alpha of the edit (flat background) → used to clip the layer to the figure
    edit_rgb = np.asarray(Image.open(a.edit).convert('RGB').resize(Image.open(BASE).size, Image.LANCZOS))
    ea = flat_bg_alpha(edit_rgb)
    ea_path = os.path.join(tmp_dir, f'{name}_ealpha.png')
    Image.fromarray(np.dstack([edit_rgb, (ea * 255).astype(np.uint8)]), 'RGBA').save(ea_path)

    cmd = [sys.executable, os.path.join(ROOT, 'tools/art/layerize.py'), '--base', BASE, '--edit', a.edit,
           '--edit-alpha', ea_path, '--region', region, '--anchor', cfg['anchor'], '--out', full]
    if cfg.get('mode') == 'alpha':
        cmd += ['--mode', 'alpha', '--feather-bottom', str(cfg.get('feather', 20))]
    else:
        cmd += ['--thresh', str(a.thresh or cfg.get('thresh', 9))]
    for ex in a.exclude:
        cmd += ['--exclude', ex]
    if a.slot not in ('head', 'hat'):
        # never let a clothing layer contain the face / hair
        cmd += ['--exclude', f'{HEAD_BOX[0]},0,{HEAD_BOX[2]},{CHIN_Y - 10}']
    r = subprocess.run(cmd, capture_output=True, text=True)
    print(r.stdout.strip()); print(r.stderr.strip()) if r.returncode else None
    if r.returncode:
        sys.exit(1)

    lay = Image.open(full).convert('RGBA')
    if a.slot == 'head':
        # extend: dark hair strands hanging below the chin at the sides (not the neck column,
        # not white shirts / skin) are kept down to shoulder level
        arr = np.asarray(lay).astype(np.float32).copy()
        lum = edit_rgb[..., 0] * 0.299 + edit_rgb[..., 1] * 0.587 + edit_rgb[..., 2] * 0.114
        side = np.zeros(ea.shape, bool)
        side[CHIN_Y - 30:CHIN_Y + 80, HEAD_BOX[0] - 40:790] = True
        side[CHIN_Y - 30:CHIN_Y + 80, 940:HEAD_BOX[2] + 40] = True
        hair = side & (lum < 95) & (ea > 0.5)
        hair = ndi.binary_opening(hair, iterations=1)
        ramp = np.ones(ea.shape[0], np.float32)
        ramp[CHIN_Y + 50:CHIN_Y + 80] = np.linspace(1, 0, 30); ramp[CHIN_Y + 80:] = 0
        add = hair * ramp[:, None] * ea * 255
        arr[..., :3] = np.where(add[..., None] > arr[..., 3:4], edit_rgb.astype(np.float32), arr[..., :3])
        arr[..., 3] = np.maximum(arr[..., 3], add)
        lay = Image.fromarray(arr.clip(0, 255).astype(np.uint8), 'RGBA')
    fin = lay.resize(FINAL, Image.LANCZOS)
    if a.slot == 'head':
        out = os.path.join(ROOT, f'assets/character/dressup/{name}.webp')
    else:
        out = os.path.join(ROOT, f'assets/clothes/{a.slot}/{name}.webp')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    fin.save(out, 'WEBP', quality=88, method=6)
    print('wrote', os.path.relpath(out, ROOT), os.path.getsize(out) // 1024, 'KB')

    if not a.no_thumb:
        al = np.asarray(fin)[..., 3]
        ys, xs = np.where(al > 40)
        if len(xs):
            x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
            side = int(max(x1 - x0, y1 - y0) * 1.08)
            cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
            crop = fin.crop((cx - side // 2, cy - side // 2, cx - side // 2 + side, cy - side // 2 + side))
            th = crop.resize((200, 200), Image.LANCZOS)
            tdir = os.path.join(os.path.dirname(out), 'thumbs'); os.makedirs(tdir, exist_ok=True)
            th.save(os.path.join(tdir, f'{name}.webp'), 'WEBP', quality=86, method=6)

    # QA preview: body + (default head unless this is a head) + layer, on pink
    body = Image.open(os.path.join(ROOT, 'assets/character/dressup/body.webp')).convert('RGBA') \
        if os.path.exists(os.path.join(ROOT, 'assets/character/dressup/body.webp')) else None
    canvas = Image.new('RGBA', FINAL, (255, 225, 238, 255))
    if body:
        canvas.alpha_composite(body)
    if a.slot == 'head':
        canvas.alpha_composite(fin)
    else:
        dh = os.path.join(ROOT, 'assets/character/dressup/head-era-b-neutral.webp')
        order_after_head = a.slot in ('hat', 'accessory', 'bag')
        if os.path.exists(dh) and order_after_head:
            canvas.alpha_composite(Image.open(dh).convert('RGBA'))
        canvas.alpha_composite(fin)
        if os.path.exists(dh) and not order_after_head:
            canvas.alpha_composite(Image.open(dh).convert('RGBA'))
    pv = canvas.convert('RGB'); pv.thumbnail((360, 480))
    pv.save(os.path.join(PREV, f'{name}.jpg'), quality=85)


if __name__ == '__main__':
    main()

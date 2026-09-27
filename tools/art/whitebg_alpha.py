#!/usr/bin/env python3
"""
whitebg_alpha.py — local background removal for item sheets drawn on a flat
white / light background with dark outlines.

  python3 whitebg_alpha.py in.png out.png [--tol 18] [--soft 40]

Background = near-background-colored pixels connected to the image border
(flood fill), so white highlights *inside* outlined items are kept. Edge pixels
get a soft alpha from their color distance to the background color.
"""
import argparse
import numpy as np
from PIL import Image
from scipy import ndimage as ndi


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('dst')
    ap.add_argument('--tol', type=float, default=18.0, help='max RGB distance counted as background')
    ap.add_argument('--soft', type=float, default=40.0, help='distance at which edge alpha reaches 1')
    ap.add_argument('--global-min-frac', type=float, default=0.0,
                    help='also treat enclosed background-colored regions larger than this fraction as background')
    a = ap.parse_args()
    im = np.asarray(Image.open(a.src).convert('RGB')).astype(np.float32)
    h, w = im.shape[:2]
    border = np.concatenate([im[0], im[-1], im[:, 0], im[:, -1]])
    bgc = np.median(border, axis=0)
    dist = np.sqrt(((im - bgc) ** 2).sum(-1))
    cand = dist < a.tol
    lab, n = ndi.label(cand)
    edge_labels = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge_labels))
    if a.global_min_frac > 0 and n:
        sizes = ndi.sum(cand, lab, range(1, n + 1))
        big = [i + 1 for i, sz in enumerate(sizes) if sz >= a.global_min_frac * h * w]
        bg |= np.isin(lab, big)
    # soft edge: pixels within 2px of background get alpha from distance
    near = ndi.binary_dilation(bg, iterations=2) & ~bg
    alpha = np.ones((h, w), np.float32)
    alpha[bg] = 0.0
    alpha[near] = np.clip((dist[near] - a.tol * 0.5) / (a.soft - a.tol * 0.5), 0, 1)
    # un-premultiply the white fringe on soft pixels
    rgb = im.copy()
    soft = near & (alpha > 0.02) & (alpha < 1)
    al = alpha[soft][:, None]
    rgb[soft] = np.clip((im[soft] - bgc * (1 - al)) / al, 0, 255)
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(a.dst)
    print('bg color', bgc.round(), 'bg frac', round(float(bg.mean()), 3))


if __name__ == '__main__':
    main()

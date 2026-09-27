#!/usr/bin/env python3
"""composite.py out.jpg base.png layer1.png layer2.png ... [--bg r,g,b] [--w 600]
Alpha-composites layers in order over a base for visual QA."""
import sys
from PIL import Image
args = [a for a in sys.argv[1:] if not a.startswith('--')]
bg = (255, 240, 246)
w = 600
for i, a in enumerate(sys.argv):
    if a == '--bg': bg = tuple(int(v) for v in sys.argv[i + 1].split(','))
    if a == '--w': w = int(sys.argv[i + 1])
args = [a for a in args if not (',' in a and a.replace(',', '').isdigit()) and not a.isdigit()]
out, layers = args[0], args[1:]
base = Image.open(layers[0]).convert('RGBA')
canvas = Image.new('RGBA', base.size, bg + (255,))
for p in layers:
    im = Image.open(p).convert('RGBA')
    if im.size != base.size: im = im.resize(base.size, Image.LANCZOS)
    canvas.alpha_composite(im)
canvas = canvas.convert('RGB')
canvas.thumbnail((w, w * 4))
canvas.save(out, quality=88)
print('wrote', out, canvas.size)

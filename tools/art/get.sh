#!/bin/bash
# Usage: get.sh <url> <out_path> [preview_width]
# Downloads a Higgsfield output (approved source) and writes a small JPEG preview to the scratchpad.
set -e
URL="$1"; OUT="$2"; W="${3:-480}"
SCRATCH=/private/tmp/claude-501/-Users-ayda-Desktop-hamingames/e42f78d2-ad95-4f53-970e-ee004cb22257/scratchpad/previews
mkdir -p "$(dirname "$OUT")" "$SCRATCH"
[ -f "$OUT" ] || curl -sf --retry 3 -o "$OUT" "$URL"
python3 - "$OUT" "$SCRATCH" "$W" <<'PY'
import sys, os
from PIL import Image
p, scratch, w = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(p)
print(os.path.basename(p), im.size, im.mode)
if im.mode == 'RGBA':
    bg = Image.new('RGBA', im.size, (255, 0, 255, 255)); bg.alpha_composite(im); im = bg
im = im.convert('RGB'); h = int(im.height * w / im.width)
im.resize((w, h), Image.LANCZOS).save(os.path.join(scratch, os.path.splitext(os.path.basename(p))[0] + '.jpg'), quality=85)
PY

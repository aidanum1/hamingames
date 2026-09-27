#!/bin/bash
# build-deploy.sh — assemble the clean Neocities upload folder: neocities-deploy/
#
# Copies ONLY the public static site (HTML pages, css/, js/, data/, assets/).
# Never copies research/, art-source/, tools/, docs/, .claude/ or any reference photo.
# Afterwards it verifies that no file in the deploy folder is byte-identical to a
# private reference photo in research/hamin-reference/.
#
# Usage: bash tools/build-deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=neocities-deploy
rm -rf "$OUT"
mkdir -p "$OUT"

PAGES=(index.html dress-up.html lunch-time.html photo-booth.html run-hamin.html practice-room.html my-room.html collection.html not_found.html)
for p in "${PAGES[@]}"; do
  if [ -f "$p" ]; then cp "$p" "$OUT/"; else echo "!! missing page $p"; fi
done
for d in css js data assets; do
  rsync -a --exclude '.DS_Store' --exclude '*.psd' --exclude '*.kra' --exclude 'Thumbs.db' "$d/" "$OUT/$d/"
done
[ -f robots.txt ] && cp robots.txt "$OUT/" || true

# Safety: no private reference photo may ever be deployed.
if [ -d research/hamin-reference ]; then
  REFSUMS=$(find research/hamin-reference -type f -exec md5 -q {} \; 2>/dev/null | sort -u)
  LEAK=0
  while IFS= read -r f; do
    s=$(md5 -q "$f")
    if echo "$REFSUMS" | grep -qx "$s"; then echo "!! PRIVATE REFERENCE FILE FOUND IN DEPLOY: $f"; LEAK=1; fi
  done < <(find "$OUT" -type f)
  if [ "$LEAK" = 1 ]; then echo "Aborting: remove the files above."; rm -rf "$OUT"; exit 1; fi
fi
# No jpg/jpeg photos are expected in the public site at all (art is WebP/PNG).
if find "$OUT" -type f \( -iname '*.jpg' -o -iname '*.jpeg' \) | grep -q .; then
  echo "!! JPEG files found in deploy (review them):"; find "$OUT" -type f \( -iname '*.jpg' -o -iname '*.jpeg' \)
fi

COUNT=$(find "$OUT" -type f | wc -l | tr -d ' ')
SIZE=$(du -sh "$OUT" | cut -f1)
echo "neocities-deploy ready: $COUNT files, $SIZE"

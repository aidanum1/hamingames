# HAMIN GAMES — Asset Guide

How every image in the site is sized, aligned and named, so new art can be dropped in
without touching layout code. Generation workflow and prompts: `research/HAMIN_GENERATION_BIBLE.md`.
Full list of runtime files: `docs/ASSET_PLAN.md`.

## 1. General rules

| Rule | Value |
|---|---|
| Web format | **WebP** (quality 82–90, `method=6`) for all illustrations; PNG only for the favicon |
| Transparency | Real alpha (no baked checkerboard, no white halo). Cut-outs are exported with soft 1–2 px edges |
| Colour | sRGB, no embedded print profiles |
| Naming | lowercase kebab-case, category prefix: `top-…`, `knit-…`, `st-…` (stickers), `room-…`, `food-…`, `obs-…`, `col-…`, `pow-…`, `bg-…`, `mem-001…` |
| Text | **No text baked into images.** All words are HTML/Canvas text so the 4 languages work |
| Sources | Raw generations and high-res masters live in `art-source/` (never deployed). Only optimized files go in `assets/` |
| Privacy | Reference photos (`research/hamin-reference/`) are never copied into `assets/` or the deploy folder. `tools/build-deploy.sh` aborts if one is found |

## 2. Dress Up character canvas (the most important contract)

All Dress Up layers are **1200 × 1600 px, transparent, full-canvas** (a layer is mostly empty
except for its garment). Stacking them at (0,0) produces the outfit. Never crop or trim a layer.

The canonical base was generated at 1728 × 2304 and scaled by **0.6944** to 1200 × 1600.

### Anchor landmarks (final 1200 × 1600 coordinates)
| Landmark | y (px) | Notes |
|---|---|---|
| Top of hair | ≈ 76 | |
| Eye line | ≈ 180 | |
| **Chin line / head-layer cut** | **281** | head layers fade out over 263–281; body layer starts at 250 |
| Shoulders | ≈ 333 | shoulder width ≈ 408–775 |
| Tee hem / waist | ≈ 730 | |
| Crotch | ≈ 868 | |
| Hands (fingertips) | ≈ 865 | hands hang beside the thighs at x ≈ 420 and ≈ 760 |
| Ankle cuffs | ≈ 1326 | |
| Soles / floor line | **≈ 1517** | photo-booth pose cards use the same floor line |
| Body centre line | x ≈ 600 | |

### Layer order (bottom → top)
`background · body · shoes · bottom · top · shirt · knit · hoodie · outer · head · accessory · bag · hat`

- **body** (`assets/character/dressup/body.webp`): neck-down canonical body wearing the plain base
  outfit (white crew-neck tee, slim light-grey joggers, white socks). The base is never shown undressed.
- **head** (`assets/character/dressup/head-<style>-<expr>.webp`): the whole head (hair + face + ears),
  cut at the chin line with a feathered neck; dark hair strands at the sides may continue to the
  shoulders. Styles: `era-a` (tousled), `era-b` (default, neat curtain fringe), `era-c` (fluffy), `stage`.
  Expressions: `neutral`, `smile`, `big` for all styles; `era-b` also has `sheep`, `surprised`,
  `focused`, `wink`, `pout`, `eating`.
- **Garment layers** (`assets/clothes/<slot>/<id>.webp`) contain ONLY the garment pixels. Where a
  garment is open (jackets, V-necks) the layer is transparent so the layer below shows through.
- Thumbnails: `assets/clothes/<slot>/thumbs/<id>.webp`, **200 × 200**, item cropped to its bounding
  box + 8 % margin, centred, transparent.

### Slot regions (where a garment may have pixels, base 1728×2304 px — scale ×0.6944)
| Slot | Region x0,y0,x1,y1 |
|---|---|
| hat | 600,20 → 1130,360 |
| head | 660,60 → 1070,405 (+ side strands to 485) |
| top / knit | 440,400 → 1290,1320 |
| shirt | 440,400 → 1290,1400 |
| hoodie | 440,330 → 1290,1360 |
| outer | 420,380 → 1310,1900 (long coats reach the knee) |
| bottom | 480,940 → 1250,2010 |
| shoes | 420,1860 → 1310,2304 |
| accessory | 420,300 → 1310,1500 |
| bag | 400,380 → 1330,1600 |

### Replacing Dress Up art by hand
1. Draw on a 1200 × 1600 transparent canvas over `body.webp` + `head-era-b-neutral.webp` as guides
   (keep the pose: arms slightly away from the body, palms towards the thighs, feet slightly apart).
2. Export only the garment on its own layer, same canvas size, same position.
3. Save as `assets/clothes/<slot>/<id>.webp` + a 200×200 thumbnail. No code changes are needed if the
   id already exists in `data/wardrobe.js`; new items need an entry there + a name in
   `data/translations-wardrobe.js`.
4. With AI generation, use the edit pipeline instead: `tools/art/make_layer.py` (see the bible §7).

## 3. Backgrounds
| Use | Size | Path |
|---|---|---|
| Dress Up / Photo Booth | 1200 × 1600 opaque (+ 240 × 320 thumb) | `assets/backgrounds/<id>.webp`, `…/thumbs/<id>.webp` |
| Lunch Time | 1600 × 900 | `assets/food/bg-lunch.webp` |
| Practice Room | 1600 × 900 | `assets/rhythm/bg-practice-room.webp` |
| My Room | 1600 × 1000 (wall = top 60 %, floor = bottom 40 %, straight front view, empty) | `assets/room/bg-room.webp` |
| Run, Hamin! stages | 2100 × 900, flat side view, ground band in the bottom 16 % | `assets/runner/bg-<stage>.webp` |
Portrait backgrounds keep the centre open (the character stands there) and show floor in the lower third.
Runner backgrounds are drawn mirror-tiled (normal, flipped, normal…), so the left and right edges
need not match exactly, but the scene must have no perspective vanishing point.

## 4. Photo Booth
- **Pose cards** `assets/photobooth/poses/<pose-id>.webp`: 1200 × 1600 transparent, same framing as the
  Dress Up canvas: full body, feet on the floor line y ≈ 1517, figure height ≈ 1440, max width 1150.
  Poses are new full-body illustrations in fixed outfits (the "look" pose is built from Dress Up layers).
- **Stickers** `assets/stickers/<id>.webp`: 256 × 256 transparent, die-cut white border included,
  item centred with ~4 % margin.
- **Frames** are drawn in code (`js/photo-booth.js`) — no image files.

## 5. Run, Hamin! sprites
| Sprite | Canvas | Anchor |
|---|---|---|
| `hamin-run-1..4`, `hamin-jump`, `hamin-duck`, `hamin-startled` | 320 × 400 | feet at bottom-centre, 6 px padding; **all frames share one scale** |
| `dog-run-1..4`, `dog-happy`, `dog-hop` | 300 × 260 | paws at bottom-centre; all frames one scale |
| `obs-*` obstacles | max side 256, trimmed | bottom edge = ground contact |
| `col-*` collectibles, `pow-*` power-ups | 128 × 128 (source 256) | centred |
Characters face **right**. The run cycle is 4 frames (contact, down, passing, up) at ~10 fps.
Sprite-sheet alternative: a horizontal strip of equal cells is also fine if `js/run-hamin.js` is pointed
at it; keep the same cell size and anchors.

## 6. Practice Room (rhythm)
- `assets/rhythm/hamin-dance-{idle,1,2,3,4}.webp`: 600 × 800 transparent, front view, feet at
  bottom-centre, one shared scale. The game swaps poses on hits (idle when combo breaks).
- Lane arrows, hit effects and the judgement line are drawn in code.
- Music & charts: `data/songs.js` (synth arrangements + charts). A song may set `audioSrc` to an
  original/royalty-free audio file (`assets/audio/…`, OGG/MP3) and supply matching charts.

## 7. My Room
- Items `assets/room/items/<id>.webp`: transparent, **max side 512 px**, drawn in the same straight
  front view with a slight top-down tilt; the bottom edge is where the item stands.
- Display size comes from `w` in `data/room-items.js` (fraction of the room width), so art may be any
  aspect ratio. Wall items: `zone: 'wall'`; floor items: `zone: 'floor'`.

## 8. Food, collection, UI
| Asset | Size |
|---|---|
| `assets/food/food-*.webp` | 256 × 256 transparent |
| `assets/collection/mem-001..018.webp` | 480 × 640 (3:4 memory cards) |
| `assets/character/bust/hamin-<expr>.webp` | 800 × 800 transparent (head & shoulders) |
| `assets/ui/thumbs/<game-id>.webp` | 480 × 300 |
| `assets/ui/og.webp` | 1200 × 630 share image |
| `assets/ui/banner-event.webp` | 840 × 360 (no text) |
| `assets/ui/favicon.png` | 64 × 64 pixel icon |

## 9. Checking assets
- `node tools/check-site.js` lists every missing file referenced by pages, CSS, scripts and catalogs.
- `bash tools/build-deploy.sh` builds `neocities-deploy/` and rejects private reference photos.

# HAMIN GAMES — Asset manifest (internal)

Every runtime image the site references. Game code must reference exactly these
paths and must degrade gracefully while a file is missing. Sizes are the final
optimized web sizes (source art in `art-source/` is larger).

Formats: `.webp` (quality ~88, alpha where noted). Transparent = alpha background.

## character/ (canonical Hamin, generated from the character master)
| Path | Size | Notes |
|---|---|---|
| `assets/character/dressup/body.webp` | 1200×1600, alpha | neck-down base: plain white tee, slim grey joggers, white socks |
| `assets/character/dressup/head-<hair>-<expr>.webp` | 1200×1600, alpha | whole head (hair+face) layer; expr ∈ neutral, smile, big |
| `assets/character/dressup/preview.webp` | 600×800 | composite of the default outfit (portal / og image) |
| `assets/character/bust/hamin-<expr>.webp` | 800×800, alpha | head & shoulders, soft default outfit. expr ∈ neutral, smile, big-smile, sheep-smile, surprised, focused, wink, pout, eating |

## clothes/ (Dress Up layers — all share the 1200×1600 canvas exactly)
`assets/clothes/<slot>/<item-id>.webp` (1200×1600 alpha) and
`assets/clothes/<slot>/thumbs/<item-id>.webp` (200×200 alpha, item cropped & centered).
Slots: shoes, bottom, top, shirt, knit, hoodie, outer, accessory, bag, hat.

## backgrounds/ (Dress Up + Photo Booth)
`assets/backgrounds/<bg-id>.webp` 1200×1600 opaque; `assets/backgrounds/thumbs/<bg-id>.webp` 240×320.
ids: bg-bedroom, bg-practice, bg-street, bg-stage, bg-starry, bg-cafeteria, bg-park.

## photobooth/
`assets/photobooth/poses/<pose-id>.webp` 1200×1600 alpha, same framing as the Dress Up
canvas (full body, feet near y≈1540). ids: pose-vsign, pose-heart, pose-wave, pose-dance,
pose-sheep-smile, pose-run, pose-stage, pose-cozy.
(Frames are drawn in code.)

## stickers/
`assets/stickers/<sticker-id>.webp` 256×256 alpha (ids in data/stickers.js).

## food/ (Lunch Time)
`assets/food/<food-id>.webp` 256×256 alpha:
food-ramen, food-dumplings, food-rice-bowl, food-kimbap, food-tteokbokki, food-fried-chicken,
food-strawberry, food-strawberry-cake, food-tangerine, food-watermelon, food-banana-milk,
food-strawberry-milk, food-fish-bread, food-ice-cream, food-cookie, food-egg-toast.
Desserts (count for lunch.desserts): strawberry, strawberry-cake, tangerine, watermelon,
fish-bread, ice-cream, cookie.
`assets/food/bg-lunch.webp` 1600×900 opaque — cafeteria table scene (landscape).

## runner/ (Run, Hamin!)
| Path | Size |
|---|---|
| `assets/runner/hamin-run-1..4.webp` | 320×400 alpha, facing right, feet at bottom-center |
| `assets/runner/hamin-jump.webp`, `hamin-duck.webp`, `hamin-startled.webp` | 320×400 alpha, same anchor |
| `assets/runner/dog-run-1..4.webp` | 300×240 alpha, facing right, paws at bottom-center |
| `assets/runner/dog-happy.webp` | 300×240 alpha (sitting, tail wag, hearts) |
| `assets/runner/obs-{box,puddle,bench,cone,bag,sign}.webp` | ≤256 max side, alpha, bottom-aligned |
| `assets/runner/col-{star,heart,snack,note}.webp` | 128×128 alpha |
| `assets/runner/pow-{speed,jump,shield,snack}.webp` | 128×128 alpha |
| `assets/runner/bg-{school,park,city,river,festival}.webp` | 2100×900 opaque, horizontally mirror-tiled |

## rhythm/ (Practice Room)
`assets/rhythm/bg-practice-room.webp` 1600×900 opaque;
`assets/rhythm/hamin-dance-{idle,1,2,3,4}.webp` 600×800 alpha (practice outfit).

## room/ (My Room)
`assets/room/bg-room.webp` 1600×1000 opaque — empty cozy bedroom/practice-room hybrid, front view
(wall top ~60%, floor bottom ~40%).
`assets/room/items/<room-id>.webp` alpha, max side 512 (ids in data/room-items.js).

## collection/
`assets/collection/mem-001..018.webp` 480×640 memory card illustrations.

## ui/
`assets/ui/thumbs/<game-id>.webp` 480×300 game card thumbnails
(dress-up, photo-booth, run-hamin, lunch-time, practice-room, my-room).
`assets/ui/favicon.png` 64×64. `assets/ui/og.webp` 1200×630 share image.
`assets/ui/banner-event.webp` 600×160 (no text; text is overlaid in HTML).

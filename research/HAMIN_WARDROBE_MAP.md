# HAMIN GAMES — Wardrobe Map (Dress Up v1)

Research v1 · compiled 2026-09-27 · companion to `HAMIN_VISUAL_BIBLE.md` and `REFERENCE_MANIFEST.md`

## Principles
- Every item is an **original design inspired by observed styling motifs, never a copy** of a real
  outfit, costume, merch piece or photo.
- Plain, wholesome clothing only. **No logos, no brand names or brand-like marks, no text, no crests,
  no school names**, no copies of official merch graphics or stage costumes.
- Most real outfits have **not been visually reviewed yet** (see the bible, section D). Where a source only
  gives context (an event, a date, a merch list), the item says so. Items with no Hamin source are marked
  **general styling motif**.
- Confidence notes come from the bible: TEXT-CONFIRMED / INFERRED / FAN-UNVERIFIED / GENERAL MOTIF.

## Field legend
- **id**: stable kebab-case id with the slot prefix used in `docs/CONTRACT.md` (§6.2).
  Prefixes: `top-`, `shirt-`, `knit-`, `hoodie-`, `outer-`, `bottom-`, `shoes-`, `acc-`, `bag-`, `hat-`,
  `hair-` (slot `head`), `bg-`.
- **Tags** only from: cute, cool, cozy, preppy, casual, stage, sporty, soft.
- **Stats** `{cute, cool, cozy, stage}`, each 0–5.
- **Style group**: casual · preppy · practice · stage · event · travel (travel includes off-duty).
- **Art description**: garment-only line for image-generation prompts (colour, material, fit, details).
  Always append the house style from the bible (smooth high-resolution 2D illustration, glossy cel shading,
  clean outlines, NOT pixel art).

Ids already referenced by the code are reused as-is: `knit-navy-vneck` (contract example, same tags and
stats), `top-practice-tee`, `bottom-track-pants`, `shoes-sporty-runner`, `hat-special-star`
(`data/unlock-rules.js`), and backgrounds `bg-cafeteria`, `bg-practice`, `bg-stage`, `bg-park`
(`docs/ASSET_PLAN.md`). Check the existing background renders against the art descriptions below.

Counts: 5 tops · 3 shirts · 4 knitwear · 3 hoodies/sweatshirts · 5 outerwear · 6 bottoms · 6 shoes ·
6 accessories · 3 bags · 3 headwear · 4 hairstyles · 4 backgrounds = **52 entries**, plus 7 style challenges.

---

## 1. Tops (5) — slot `top`

#### `top-bicycle-pocket-tee` — Bicycle Pocket Tee
- **Reference era / source:** THE CULTURE brand-film cameo, Oct 2024 (https://www.youtube.com/watch?v=nKMJJE9XZns); "bicycle boy" nickname reported by press (https://tvreport.co.kr/star/article/895741/)
- **Visual features borrowed:** the bicycle motif only. The cameo's clothes are not described anywhere
- **Changes made:** original tiny line-art bicycle embroidery on a patch pocket; plain tee construction; no text, no logo
- **Game tags:** cute · casual · soft | **Stats:** cute 3 · cool 1 · cozy 2 · stage 0 | **Style group:** casual
- **Art description:** `powder blue cotton crew-neck T-shirt, relaxed regular fit, short sleeves, ribbed collar, left chest patch pocket with a tiny white embroidered bicycle outline, no text, no logo`

#### `top-practice-tee` — Practice Room Tee
- **Reference era / source:** general styling motif (dance practice wear); context from the practice-room video (https://www.youtube.com/watch?v=sSsDOYiQoJc), whose outfits are not described
- **Visual features borrowed:** loose, easy-moving practice tee
- **Changes made:** original mint shoulder-seam stripe; no numbers, text or print
- **Game tags:** sporty · casual | **Stats:** cute 1 · cool 3 · cozy 1 · stage 1 | **Style group:** practice
- **Art description:** `charcoal gray oversized cotton T-shirt, dropped shoulders, short sleeves, thin mint stripe along each shoulder seam, plain front, no print`

#### `top-spirit-ringer-tee` — School Spirit Ringer Tee
- **Reference era / source:** Reply High School pop-up merch T-shirts, Apr 2026 (https://www.starnewskorea.com/music/2026/04/01/2026040109130528520), TEXT-CONFIRMED as merch
- **Visual features borrowed:** the idea of a school-spirit tee
- **Changes made:** school logo and lettering removed entirely; contrast ringer trims instead of a print
- **Game tags:** casual · cute | **Stats:** cute 3 · cool 1 · cozy 2 · stage 0 | **Style group:** casual
- **Art description:** `cream cotton ringer T-shirt, regular fit, short sleeves, powder blue ribbed collar and sleeve bands, plain front, no print, no text`

#### `top-mono-mockneck` — Monochrome Mock-Neck
- **Reference era / source:** intro film, Apr 2025: "modern outfit in neutral tones" (Merdeka, http://www.merdeka.com/artis/read/7983916/sm-entertainment-perkenalkan-trainee-smtr25-bernama-hamin-visual-menawan-curi-perhatian); "black-and-white" look from a low-tier source only (https://www.dojeonmedia.com/post/sm-entertainment-s-next-gen-get-your-first-look-at-smtr25-male-trainees)
- **Visual features borrowed:** sleek, minimal, monochrome concept-film mood
- **Changes made:** simple original top with seam piping; no futuristic hardware or panels from the film
- **Game tags:** cool · stage | **Stats:** cute 0 · cool 4 · cozy 1 · stage 3 | **Style group:** stage
- **Art description:** `black fitted long-sleeve mock-neck top, smooth stretch jersey, thin off-white piping along the shoulder seams, clean minimal look, no print`

#### `top-pastel-stripe-longsleeve` — Pastel Stripe Long Sleeve
- **Reference era / source:** general styling motif (retro casual); the official retro-fashion contest exists (https://www.youtube.com/watch?v=REbNJFfY438) but Hamin's outfit in it is not described
- **Visual features borrowed:** retro-casual attitude only
- **Changes made:** original stripe in portal colours
- **Game tags:** cute · soft · casual | **Stats:** cute 4 · cool 0 · cozy 2 · stage 0 | **Style group:** casual
- **Art description:** `cream long-sleeve cotton T-shirt with thin horizontal baby pink and powder blue stripes, regular fit, crew neck, no print`

---

## 2. Shirts (3) — slot `shirt`

#### `shirt-oxford-white` — Class Oxford Shirt
- **Reference era / source:** school uniforms in the Reply High School teaser, Jan 2026 (https://www.starnewskorea.com/broadcast-show/2026/01/23/2026012310011370806); era-researched uniforms (http://v.daum.net/v/20260206115538879). TEXT-CONFIRMED as group styling; the '10s class cut is not described
- **Visual features borrowed:** white school shirt as the base of a uniform layer
- **Changes made:** no crest, name badge or embroidered school name; slim-regular fit chosen by design
- **Game tags:** preppy · soft | **Stats:** cute 2 · cool 2 · cozy 1 · stage 1 | **Style group:** preppy
- **Art description:** `crisp white cotton oxford button-down shirt, slim-regular fit, long sleeves with buttoned cuffs, button-down collar, one plain chest pocket, tucked in, no embroidery, no badge`

#### `shirt-powder-stripe-overshirt` — Powder Stripe Overshirt
- **Reference era / source:** general styling motif (off-duty layering)
- **Visual features borrowed:** none specific
- **Changes made:** n/a (original)
- **Game tags:** casual · soft | **Stats:** cute 2 · cool 2 · cozy 2 · stage 0 | **Style group:** travel
- **Art description:** `relaxed powder blue and white vertical-stripe cotton shirt worn open over a tee, long sleeves rolled to the forearm, point collar, white buttons, no print`

#### `shirt-midnight-stage` — Midnight Stage Shirt
- **Reference era / source:** 2025 KGMA stage, Nov 2025: "black-and-gray leather" costumes (http://v.daum.net/v/20251114190424928), TEXT-CONFIRMED as group styling
- **Visual features borrowed:** black and charcoal colour pairing
- **Changes made:** a woven shirt, not leather; original shoulder yoke; no studs, chains or insignia
- **Game tags:** stage · cool | **Stats:** cute 0 · cool 4 · cozy 0 · stage 4 | **Style group:** stage
- **Art description:** `black satin-finish long-sleeve shirt, slim fit, charcoal gray contrast shoulder yoke, small silver buttons, pointed collar, tucked in, no print`

---

## 3. Knitwear (4) — slot `knit`

No official or press source shows Hamin in knitwear (gap in the manifest). All knits are motifs.

#### `knit-navy-vneck` — Navy V-Neck School Knit
- **Reference era / source:** school-uniform concept at SMTOWN LIVE 2025 Seoul, Jan 2025 (http://v.daum.net/v/20250112232704951), group; the individual pieces are not described. A knit layer is a general Korean school-uniform motif
- **Visual features borrowed:** layered school-knit idea
- **Changes made:** no crest or emblem; original cream tipping; navy is a design choice (no uniform colour is documented)
- **Game tags:** preppy · soft · cozy | **Stats:** cute 2 · cool 2 · cozy 4 · stage 0 | **Style group:** preppy
- **Art description:** `navy fine-gauge wool V-neck sweater, regular fit, long sleeves, ribbed cuffs and hem, thin cream tipping along the V-neck and hem, no emblem, no text`

#### `knit-cream-cable-cardigan` — Cream Cable Cardigan
- **Reference era / source:** general styling motif (cozy, portal palette)
- **Visual features borrowed:** none specific
- **Changes made:** n/a (original)
- **Game tags:** cozy · soft · cute | **Stats:** cute 3 · cool 1 · cozy 5 · stage 0 | **Style group:** casual
- **Art description:** `chunky cream cable-knit cardigan, relaxed fit, long sleeves, five round light-wood buttons, ribbed hem and cuffs, buttoned halfway, no logo`

#### `knit-open-stitch-stage` — Open-Stitch Stage Knit
- **Reference era / source:** Reply High School festival stage, Oct 2025: fan description of a "ripped mesh knit" (https://x.com/hachandes/status/1982033149787078712), **FAN-UNVERIFIED**
- **Visual features borrowed:** only the idea of a textured knit on stage
- **Changes made:** no rips or distressing; neat open stitch; always layered over a tee for full coverage
- **Game tags:** stage · cool | **Stats:** cute 1 · cool 4 · cozy 2 · stage 4 | **Style group:** stage
- **Art description:** `charcoal gray open-stitch knit sweater with a neat ladder pattern, slightly oversized, crew neck, worn over a black T-shirt, no holes, no rips, no logo`

#### `knit-lavender-sweater-vest` — Lavender Sweater Vest
- **Reference era / source:** school-uniform concept (http://v.daum.net/v/20250112232704951; https://www.starnewskorea.com/broadcast-show/2026/01/23/2026012310011370806) + portal lavender
- **Visual features borrowed:** vest-over-shirt school layering
- **Changes made:** portal colour instead of a uniform colour; no crest
- **Game tags:** preppy · cute · soft | **Stats:** cute 4 · cool 1 · cozy 3 · stage 0 | **Style group:** preppy
- **Art description:** `lavender cable-knit V-neck sweater vest, regular fit, ribbed armholes and hem, worn over a white shirt, no emblem, no text`

---

## 4. Hoodies / sweatshirts (3) — slot `hoodie`

#### `hoodie-heather-spirit` — School Spirit Hoodie
- **Reference era / source:** Reply High School pop-up merch school-logo hoodies, Apr 2026 (https://www.starnewskorea.com/music/2026/04/01/2026040109130528520), TEXT-CONFIRMED as merch
- **Visual features borrowed:** the school-spirit hoodie idea
- **Changes made:** logo and lettering removed; plain chest; original powder blue drawcords
- **Game tags:** casual · cozy · sporty | **Stats:** cute 2 · cool 2 · cozy 4 · stage 0 | **Style group:** casual
- **Art description:** `heather gray fleece pullover hoodie, relaxed fit, kangaroo pocket, powder blue flat drawcords, ribbed cuffs and hem, plain front, no print, no text`

#### `hoodie-mint-crewneck` — Mint Crewneck Sweatshirt
- **Reference era / source:** general styling motif (portal mint). Loose nod to the leaf-emoji caption of the official greenery post, Jun 2025 (https://www.instagram.com/p/DLCZSJbTD4k/); the images were not viewed
- **Visual features borrowed:** fresh-green mood only
- **Changes made:** original leaf embroidery
- **Game tags:** soft · cozy · cute | **Stats:** cute 3 · cool 1 · cozy 4 · stage 0 | **Style group:** casual
- **Art description:** `mint green cotton-fleece crewneck sweatshirt, relaxed fit, ribbed collar, cuffs and hem, small cream embroidered leaf on the left chest, no text`

#### `hoodie-charcoal-zip` — Practice Zip-Up Hoodie
- **Reference era / source:** general styling motif (practice wear)
- **Visual features borrowed:** none specific
- **Changes made:** n/a (original)
- **Game tags:** sporty · cool | **Stats:** cute 1 · cool 3 · cozy 3 · stage 1 | **Style group:** practice
- **Art description:** `charcoal zip-up hoodie, regular fit, silver zipper, thin mint piping along the zipper and hood edge, side pockets, worn half-zipped, no print`

---

## 5. Outerwear (5) — slot `outer`

#### `outer-midnight-panel-jacket` — Midnight Panel Jacket
- **Reference era / source:** 2025 KGMA stage, Nov 2025: "black-and-gray leather" costumes (http://v.daum.net/v/20251114190424928), TEXT-CONFIRMED as group styling
- **Visual features borrowed:** black and gray leather look
- **Changes made:** faux leather; original colour-block panel layout; no studs, chains, insignia or text
- **Game tags:** stage · cool | **Stats:** cute 0 · cool 5 · cozy 1 · stage 5 | **Style group:** stage
- **Art description:** `cropped black faux-leather jacket with charcoal gray colour-block panels on the shoulders and sleeves, stand collar, straight silver front zipper, slim fit, glossy highlights, no studs, no text`

#### `outer-cream-puffer` — Snowday Puffer
- **Reference era / source:** winter departure during a cold snap, Jan 2026 (http://v.daum.net/v/20260130200944633); outerwear INFERRED, garment not described
- **Visual features borrowed:** winter-travel layering idea
- **Changes made:** original design; no brand patch or label
- **Game tags:** cozy · cute · casual | **Stats:** cute 3 · cool 1 · cozy 5 · stage 0 | **Style group:** travel
- **Art description:** `cream short puffer jacket with rounded horizontal quilting, high stand collar, hip length, snap-front placket, soft matte nylon with a gentle sheen, no logo patch`

#### `outer-charcoal-long-coat` — Departure Long Coat
- **Reference era / source:** general styling motif (winter travel); context from the Feb 2026 departure tagged #공항패션 (https://www.xportsnews.com/article/2112434), outfit not described
- **Visual features borrowed:** none specific (pending visual review of REF_10)
- **Changes made:** n/a (original)
- **Game tags:** cool · preppy · cozy | **Stats:** cute 0 · cool 4 · cozy 3 · stage 1 | **Style group:** travel
- **Art description:** `charcoal gray wool-blend single-breasted long coat, knee length, notch lapels, three dark buttons, straight relaxed fit, worn open, no logo`

#### `outer-navy-blazer` — Class Blazer
- **Reference era / source:** school-uniform styling (http://v.daum.net/v/20250112232704951; https://www.starnewskorea.com/broadcast-show/2026/01/23/2026012310011370806); a blazer is INFERRED, not named
- **Visual features borrowed:** uniform blazer layer
- **Changes made:** no crest, emblem, name tag or badge; original cream lapel piping; navy is a design choice
- **Game tags:** preppy · cool | **Stats:** cute 1 · cool 3 · cozy 1 · stage 2 | **Style group:** preppy
- **Art description:** `navy single-breasted school blazer, two buttons, notch lapels with thin cream piping, flap pockets, tailored regular fit, plain breast pocket with no emblem`

#### `outer-light-denim-jacket` — Weekend Denim Jacket
- **Reference era / source:** general styling motif (off-duty); matches the open-denim-jacket layer already tested in `research/GENERATION_LOG.md`
- **Visual features borrowed:** none specific
- **Changes made:** n/a (original)
- **Game tags:** casual · cool | **Stats:** cute 1 · cool 3 · cozy 2 · stage 0 | **Style group:** casual
- **Art description:** `light-wash denim trucker jacket, regular fit, worn open, point collar, two chest flap pockets, silver buttons, no patches, no leather tag`

---

## 6. Bottoms (6) — slot `bottom`

#### `bottom-slim-school-slacks` — Slim School Slacks
- **Reference era / source:** era-researched uniforms: "slim fit" for the '00s class (http://v.daum.net/v/20260206115538879). Hamin's '10s class cut is not described; slim chosen by design
- **Visual features borrowed:** slim uniform trouser line
- **Changes made:** plain; no crest or tag
- **Game tags:** preppy · cool | **Stats:** cute 1 · cool 3 · cozy 1 · stage 1 | **Style group:** preppy
- **Art description:** `charcoal gray slim tapered trousers, flat front, pressed centre crease, ankle length, plain black belt, no logo`

#### `bottom-wide-beige-chinos` — Wide Retro Chinos
- **Reference era / source:** era-researched uniforms: "wide pants" for the '90s class (http://v.daum.net/v/20260206115538879), used here as a retro casual motif; matches the wide-chino layer already tested in `research/GENERATION_LOG.md`
- **Visual features borrowed:** wide '90s trouser silhouette
- **Changes made:** casual chino, not a uniform trouser
- **Game tags:** casual · soft | **Stats:** cute 2 · cool 2 · cozy 2 · stage 0 | **Style group:** casual
- **Art description:** `beige cotton wide-leg chinos, high-rise relaxed fit, soft front pleats, full length with a slight break, no logo`

#### `bottom-track-pants` — Practice Track Pants
- **Reference era / source:** general styling motif (practice wear)
- **Visual features borrowed:** none specific
- **Changes made:** n/a (original)
- **Game tags:** sporty · casual | **Stats:** cute 1 · cool 2 · cozy 3 · stage 1 | **Style group:** practice
- **Art description:** `charcoal track pants, relaxed straight fit, elastic waist with drawcord, thin mint stripe down each outer leg, zipped ankle hems, no logo`

#### `bottom-oatmeal-sweatpants` — Oatmeal Jogger Sweatpants
- **Reference era / source:** Reply High School pop-up merch sweatpants, Apr 2026 (https://www.starnewskorea.com/music/2026/04/01/2026040109130528520), TEXT-CONFIRMED as merch
- **Visual features borrowed:** school-spirit sweatpants idea
- **Changes made:** logo removed; oatmeal colour so it reads differently from the base grey joggers
- **Game tags:** cozy · casual · soft | **Stats:** cute 2 · cool 1 · cozy 5 · stage 0 | **Style group:** casual
- **Art description:** `oatmeal cotton-fleece jogger sweatpants, relaxed fit, elastic waist with cream drawcord, ribbed ankle cuffs, side pockets, no print`

#### `bottom-light-straight-jeans` — Light Wash Straight Jeans
- **Reference era / source:** general styling motif (off-duty)
- **Visual features borrowed:** none specific
- **Changes made:** n/a (original)
- **Game tags:** casual · cool | **Stats:** cute 1 · cool 3 · cozy 1 · stage 0 | **Style group:** casual
- **Art description:** `light-wash blue denim straight-leg jeans, mid-rise regular fit, five-pocket style, clean hems, no rips, no leather patch`

#### `bottom-black-stage-pants` — Stage Straight Pants
- **Reference era / source:** 2025 KGMA stage costumes (http://v.daum.net/v/20251114190424928); stage trousers INFERRED
- **Visual features borrowed:** black and charcoal stage palette
- **Changes made:** woven trousers with a satin stripe; no leather, no hardware
- **Game tags:** stage · cool | **Stats:** cute 0 · cool 4 · cozy 0 · stage 4 | **Style group:** stage
- **Art description:** `black straight-leg trousers, slim regular fit, charcoal satin stripe down each outer seam, clean flat front, no hardware`

---

## 7. Shoes (6) — slot `shoes`

#### `shoes-chunky-white-sneakers` — Chunky White Sneakers
- **Reference era / source:** general styling motif; matches the chunky-sneaker layer already tested in `research/GENERATION_LOG.md`
- **Visual features borrowed:** none specific
- **Changes made:** plain side panels so nothing reads as a brand
- **Game tags:** casual · soft | **Stats:** cute 2 · cool 2 · cozy 1 · stage 0 | **Style group:** casual
- **Art description:** `chunky white leather-look low-top sneakers, thick rounded sole, white laces, cream sole edge, plain side panels with no stripes, no logo`

#### `shoes-sporty-runner` — Sporty Runners
- **Reference era / source:** general styling motif (practice / running)
- **Visual features borrowed:** none specific
- **Changes made:** plain side panels, no stripes or swoosh-like curves
- **Game tags:** sporty · casual | **Stats:** cute 1 · cool 3 · cozy 1 · stage 1 | **Style group:** practice
- **Art description:** `light gray mesh running shoes with mint accents on the heel tab and laces, cushioned white sole, plain side panels, no logo, no stripes`

#### `shoes-doodle-slippers` — Doodle Indoor Slippers
- **Reference era / source:** Reply High School Ep3, '10s class customised indoor school slippers (https://www.slist.kr/news/articleView.html?idxno=720182), TEXT-CONFIRMED as an activity
- **Visual features borrowed:** decorated indoor school slippers
- **Changes made:** original doodles (stars, hearts, tiny bicycle); no copies of designs made on the show; no text
- **Game tags:** cute · preppy · soft | **Stats:** cute 5 · cool 0 · cozy 3 · stage 0 | **Style group:** preppy
- **Art description:** `white rubber slip-on school slippers with a wide strap, hand-drawn doodles in baby pink, powder blue and cherry red (small stars, hearts, a tiny bicycle), worn with white socks, no text`

#### `shoes-black-stage-boots` — Stage Ankle Boots
- **Reference era / source:** 2025 KGMA stage styling (http://v.daum.net/v/20251114190424928); boots INFERRED
- **Visual features borrowed:** black stage palette
- **Changes made:** simple chelsea shape; no hardware
- **Game tags:** stage · cool | **Stats:** cute 0 · cool 4 · cozy 1 · stage 4 | **Style group:** stage
- **Art description:** `black faux-leather chelsea ankle boots, elastic side panels, slim rounded toe, low stacked heel, glossy highlights, no hardware`

#### `shoes-penny-loafers` — Penny Loafers
- **Reference era / source:** general styling motif (school uniform); uniforms TEXT-CONFIRMED as group styling (https://www.starnewskorea.com/broadcast-show/2026/01/23/2026012310011370806), shoes not described
- **Visual features borrowed:** school-shoe idea
- **Changes made:** n/a (original)
- **Game tags:** preppy | **Stats:** cute 2 · cool 2 · cozy 1 · stage 1 | **Style group:** preppy
- **Art description:** `dark brown polished penny loafers, moc-toe stitching, low heel, worn with white socks, no logo`

#### `shoes-lined-winter-boots` — Snowday Lined Boots
- **Reference era / source:** general styling motif (winter travel); context from the Jan/Feb 2026 winter departures (REF_10, REF_11), shoes not described
- **Visual features borrowed:** none specific
- **Changes made:** n/a (original)
- **Game tags:** cozy · casual | **Stats:** cute 2 · cool 2 · cozy 5 · stage 0 | **Style group:** travel
- **Art description:** `tan suede-look lace-up ankle boots with cream fleece lining showing at the collar, chunky treaded sole, round toe, no logo`

---

## 8. Accessories (6) — slot `accessory`

#### `acc-sticker-headphones` — Sticker Headphones
- **Reference era / source:** Bangkok departure, Feb 2026: headline mentions a headset with a sticker (http://v.daum.net/v/20260213184123916), TEXT-CONFIRMED
- **Visual features borrowed:** over-ear headset decorated with stickers
- **Changes made:** original stickers (star, heart, cherry), never the real ones; no brand marks; worn around the neck so it does not clash with hair or hats
- **Game tags:** cute · casual | **Stats:** cute 4 · cool 2 · cozy 1 · stage 0 | **Style group:** travel
- **Art description:** `powder blue over-ear headphones resting around the neck, cream ear cushions, headband decorated with three small stickers (cherry red star, baby pink heart, tiny cherry), no brand marks, no text`

#### `acc-striped-school-tie` — Striped School Tie
- **Reference era / source:** school uniforms in the Reply High School teaser (https://www.starnewskorea.com/broadcast-show/2026/01/23/2026012310011370806); tie INFERRED, not named
- **Visual features borrowed:** uniform tie layer
- **Changes made:** original stripe colours; no crest
- **Game tags:** preppy | **Stats:** cute 2 · cool 2 · cozy 0 · stage 1 | **Style group:** preppy
- **Art description:** `navy necktie with thin diagonal powder blue and cream stripes, neat four-in-hand knot, standard width, no crest`

#### `acc-cream-knit-muffler` — Cream Knit Muffler
- **Reference era / source:** general styling motif (winter)
- **Visual features borrowed:** none specific
- **Changes made:** n/a (original)
- **Game tags:** cozy · soft · cute | **Stats:** cute 3 · cool 1 · cozy 5 · stage 0 | **Style group:** travel
- **Art description:** `chunky cream rib-knit scarf wrapped once around the neck with short fringed ends at the front, no pattern, no label`

#### `acc-silver-chain` — Silver Stage Chain
- **Reference era / source:** general styling motif (stage; portal silver)
- **Visual features borrowed:** none specific
- **Changes made:** n/a (original)
- **Game tags:** stage · cool | **Stats:** cute 0 · cool 4 · cozy 0 · stage 3 | **Style group:** stage
- **Art description:** `simple polished silver curb-chain necklace, medium thickness, sitting at the collarbone, no pendant, no logo`

#### `acc-selfie-stick-phone` — Selfie Stick Phone
- **Reference era / source:** Reply High School Ep7, '10s class graduation photos with smartphones and selfie sticks (https://www.topstarnews.net/news/articleView.html?idxno=16018589), TEXT-CONFIRMED as an activity
- **Visual features borrowed:** smartphone plus selfie stick prop
- **Changes made:** generic phone in a plain pastel case; blank screen, no UI or brand; the flour prank is not reproduced
- **Game tags:** casual · cute | **Stats:** cute 3 · cool 1 · cozy 0 · stage 1 | **Style group:** event
- **Note:** a held prop needs a free hand in the base pose; if the pose does not allow it, use it as a Photo Booth prop instead
- **Art description:** `small smartphone in a plain baby pink case mounted on a short silver extendable selfie stick, held in one hand, blank dark screen, no brand, no text`

#### `acc-mint-wristband` — Mint Wristband
- **Reference era / source:** general styling motif (practice)
- **Visual features borrowed:** none specific
- **Changes made:** n/a (original)
- **Game tags:** sporty | **Stats:** cute 2 · cool 2 · cozy 0 · stage 1 | **Style group:** practice
- **Art description:** `mint terry-cloth sweat wristband on the right wrist, plain, no logo`

---

## 9. Bags (3) — slot `bag`

#### `bag-cream-canvas-tote` — Cream Canvas Tote
- **Reference era / source:** pop-up merch acrylic keychains, Apr 2026 (https://www.starnewskorea.com/music/2026/04/01/2026040109130528520) for the charm idea; the tote itself is a general motif
- **Visual features borrowed:** acrylic charm clipped to a bag
- **Changes made:** original cherry charm; no logo, no text, no merch graphic
- **Game tags:** casual · soft · cute | **Stats:** cute 3 · cool 1 · cozy 2 · stage 0 | **Style group:** casual
- **Art description:** `cream canvas tote bag worn on one shoulder, baby pink cotton handles, small clear acrylic cherry charm clipped to a handle, plain front, no print, no text`

#### `bag-black-trainee-backpack` — Trainee Backpack
- **Reference era / source:** general styling motif; context from the official "EP6. WHAT'S IN MY BAG" video (https://www.youtube.com/watch?v=EwC1zSNcGhI), contents not read
- **Visual features borrowed:** none specific
- **Changes made:** n/a (original)
- **Game tags:** sporty · casual · cool | **Stats:** cute 1 · cool 3 · cozy 1 · stage 0 | **Style group:** practice
- **Art description:** `black nylon backpack worn on both shoulders, silver zippers, front zip pocket, padded straps, plain, no logo`

#### `bag-lavender-crossbody` — Trip Mini Crossbody
- **Reference era / source:** "Graduation Trip" fan-meeting tour concept, May 2026 (https://x.com/SMTR25_official/status/2038467898596003962), theme only
- **Visual features borrowed:** travel theme
- **Changes made:** generic bag; no tour name, logo or date
- **Game tags:** casual · cute | **Stats:** cute 3 · cool 2 · cozy 1 · stage 0 | **Style group:** travel
- **Art description:** `small lavender nylon crossbody bag worn across the chest, silver zipper and buckle, adjustable lavender strap, plain, no logo`

---

## 10. Headwear (3) — slot `hat`

#### `hat-powder-ball-cap` — Powder Blue Ball Cap
- **Reference era / source:** brand-film cameo; a cap is suggested only by a 🧢 emoji in a magazine's social post (https://www.threads.com/@fronta_magazine/post/DIHruGiIJsn), **FAN-UNVERIFIED**, so treat as a general motif
- **Visual features borrowed:** casual cap + bicycle motif
- **Changes made:** plain original cap; tiny bicycle embroidery on the side; no front logo
- **Game tags:** casual · sporty · cute | **Stats:** cute 3 · cool 2 · cozy 1 · stage 0 | **Style group:** casual
- **Art description:** `powder blue cotton six-panel baseball cap, curved brim, worn forward, tiny white bicycle outline embroidered on the left side panel, plain front, no text, no logo`

#### `hat-lavender-beanie` — Lavender Knit Beanie
- **Reference era / source:** general styling motif (winter)
- **Visual features borrowed:** none specific
- **Changes made:** n/a (original)
- **Game tags:** cozy · soft · cute | **Stats:** cute 4 · cool 1 · cozy 4 · stage 0 | **Style group:** travel
- **Art description:** `lavender rib-knit beanie with a folded cuff, snug fit sitting behind the fringe, no pom-pom, no label`

#### `hat-special-star` — Starlight Bucket Hat
- **Reference era / source:** general styling motif (portal star collectible; special reward in `data/unlock-rules.js`)
- **Visual features borrowed:** none specific
- **Changes made:** n/a (original)
- **Game tags:** cute · stage | **Stats:** cute 4 · cool 2 · cozy 1 · stage 2 | **Style group:** event
- **Art description:** `cream cotton bucket hat with a short soft brim, one small cherry red embroidered star and one small silver embroidered star on the front, no text`

---

## 11. Hairstyles (4) — category `hair`, slot `head`

Hair is **PENDING VISUAL REVIEW** (bible, section C): no text source describes Hamin's hair in any era.
The four styles below are tied to dated eras and named neutrally. Their "borrowed" features and art lines
are **templates** to be filled once REF images are reviewed. Do not generate hair before that.
Each style needs `neutral / smile / big` head layers (`head-<style>-<expr>.webp`, per `docs/CONTRACT.md`).
If two eras turn out identical, merge them and use the spare slot for a neutral styling variant of the
verified cut (e.g. "neat parted" or "soft tousled").

#### `hair-era-a` — Hairstyle A · Spring '25 (default)
- **Reference era / source:** Era A, April 2025 official profile photos (https://x.com/SMTR25_official/status/1910996316185821219; REF_01–04) and intro film (https://www.youtube.com/watch?v=qrWr-BfaSw0)
- **Visual features borrowed:** PENDING: silhouette, fringe length and direction, parting, volume, colour
- **Changes made:** simplified into a few large glossy clumps with one highlight band; no strand-level detail; colour flattened to a 3-tone ramp
- **Game tags:** soft · preppy | **Stats:** cute 2 · cool 2 · cozy 1 · stage 1 | **Style group:** casual
- **Art description (template):** `[colour from review] hair, [length], [fringe description], [parting], smooth glossy cel-shaded clumps with one soft highlight band, neat natural shape`

#### `hair-era-b` — Hairstyle B · Summer '25
- **Reference era / source:** Era B, mid/late 2025: official L.A. set (https://x.com/SMTR25_official/status/1945091383393706378), Aug 2025 departure (https://tvreport.co.kr/photo/article/927816/), Sep 2025 profile (https://www.elle.co.kr/article/1888111)
- **Visual features borrowed:** PENDING (as above)
- **Changes made:** same simplification rules
- **Game tags:** casual · soft | **Stats:** cute 2 · cool 2 · cozy 1 · stage 0 | **Style group:** casual
- **Art description (template):** `[colour] hair, [length], [fringe], [parting], relaxed natural texture, glossy cel-shaded clumps`

#### `hair-era-c` — Hairstyle C · Winter '26
- **Reference era / source:** Era C, Jan–Feb 2026 departures (https://www.xportsnews.com/article/2112434; side profile https://m.news.nate.com/view/20260130n31354)
- **Visual features borrowed:** PENDING (as above; REF_06 also gives the back/side silhouette)
- **Changes made:** same simplification rules
- **Game tags:** casual · cool | **Stats:** cute 1 · cool 3 · cozy 2 · stage 0 | **Style group:** travel
- **Art description (template):** `[colour] hair, [length], [fringe], [parting], soft volume, glossy cel-shaded clumps`

#### `hair-stage-styled` — Hairstyle D · Stage Styled
- **Reference era / source:** stage looks: 2025 KGMA (http://v.daum.net/v/20251114190424928, group), Seoul fan meeting (https://v.daum.net/v/20260504171347994, group), finale stage video (https://www.youtube.com/watch?v=zXhlCB0Lukk)
- **Visual features borrowed:** PENDING: how the verified cut is styled for stage (e.g. fringe lifted or swept). If nothing distinct is visible, make a neater, glossier version of Hairstyle A
- **Changes made:** stronger gloss band; tidier shape; no costume-specific hair accessories copied
- **Game tags:** stage · cool | **Stats:** cute 1 · cool 4 · cozy 0 · stage 4 | **Style group:** stage
- **Art description (template):** `[colour] hair styled for stage, [fringe styling], sleek glossy finish with a bright highlight band, tidy shape`

---

## 12. Dress-up backgrounds (4)

All four ids already exist in `docs/ASSET_PLAN.md`; check the current renders against these descriptions
(no text, no logos, original locations).

#### `bg-cafeteria` — Modern School Cafeteria
- **Reference era / source:** '10s class era props: electronic whiteboards and a modern cafeteria (https://www.sportsworldi.com/newsView/20260202519087), TEXT-CONFIRMED
- **Visual features borrowed:** the modern-cafeteria setting of Hamin's class
- **Changes made:** an original, unnamed school; no show logo, crest, signage or menu text; not the real set
- **Game tags:** preppy · casual | **Stats:** cute 2 · cool 1 · cozy 2 · stage 0 | **Style group:** preppy
- **Art description:** `bright modern school cafeteria, long light-wood tables, powder blue chairs, large windows with soft daylight, pastel tiled wall, blank menu board, no text, no people`

#### `bg-practice` — Mirror Practice Room
- **Reference era / source:** "Into the New World" practice-room version (https://www.youtube.com/watch?v=sSsDOYiQoJc)
- **Visual features borrowed:** mirrored practice-room setting
- **Changes made:** original room; no signage or logos
- **Game tags:** sporty | **Stats:** cute 1 · cool 3 · cozy 1 · stage 2 | **Style group:** practice
- **Art description:** `dance practice room with a full-width wall mirror, light wood floor, ballet barre, a small speaker on the floor, soft overhead lights, no text, no people`

#### `bg-stage` — School Festival Stage
- **Reference era / source:** Reply High School festival, recorded in Busan on 2025-10-25 (http://v.daum.net/v/20251005112446559), aired in the finale (https://v.daum.net/v/20260412093101060)
- **Visual features borrowed:** school-festival stage idea
- **Changes made:** original small stage; no show banner, no venue, no text
- **Game tags:** stage | **Stats:** cute 1 · cool 3 · cozy 0 · stage 5 | **Style group:** stage
- **Art description:** `small outdoor school-festival stage at dusk, cherry red curtains tied back, silver truss with pastel spotlights, paper bunting in pink, blue and cream, empty stage floor, no text, no people`

#### `bg-park` — Bicycle Path Park
- **Reference era / source:** brand-film bicycle cameo (https://www.youtube.com/watch?v=nKMJJE9XZns); official greenery post caption (https://www.instagram.com/p/DLCZSJbTD4k/)
- **Visual features borrowed:** bicycle motif; fresh green mood
- **Changes made:** original park; no real location or scene from the film
- **Game tags:** casual · soft · cozy | **Stats:** cute 3 · cool 1 · cozy 3 · stage 0 | **Style group:** travel
- **Art description:** `sunny riverside park with a curving bicycle path, leafy green trees, a pastel bicycle parked by a bench, soft blue sky with round clouds, no text, no people`
- **Variant:** winter lighting (light snow on trees and bench, pale sky) for WINTER DAY, if a second render is affordable

---

## 13. Style challenges (7)

Suggested scoring (tune in code): for each equipped item, +2 per **target** tag, +1 per **bonus** tag;
add the **key stat** total across equipped items; a missing **required** slot caps the result at 2 stars.
Stars: 1–5 from the combined score relative to the best achievable outfit.

| id | Name | Target tags | Bonus tags | Key stat | Required | Suggested background | Hint text |
|---|---|---|---|---|---|---|---|
| `ch-soft-cozy` | SOFT & COZY | soft, cozy | cute | cozy | a knit **or** a hoodie | `bg-park` | "Snuggly layers in gentle colours." |
| `ch-practice-day` | PRACTICE DAY | sporty, casual | cool | cool | shoes tagged sporty | `bg-practice` | "Ready to move: comfy and sporty." |
| `ch-preppy-day` | PREPPY DAY | preppy | soft, cool | cute | a shirt | `bg-cafeteria` | "Neat school-day layers." |
| `ch-off-duty` | OFF-DUTY | casual | cool, soft | cool | — | `bg-park` | "Easy weekend style." |
| `ch-stage-ready` | STAGE READY | stage, cool | — | stage | an outer **or** a shirt tagged stage | `bg-stage` | "Lights on! Go bold and sharp." |
| `ch-winter-day` | WINTER DAY | cozy | soft, casual | cozy | an outer tagged cozy **and** a hat or the muffler | `bg-park` (winter variant) | "Bundle up for the cold." |
| `ch-trip-day` | TRIP DAY | casual | sporty, cute | cute | a bag | `bg-park` | "Pack light and head out!" |

Coverage check: every challenge has at least 6 matching items across at least 4 slots (see the index below).
Items tagged `stage` should score 0 target points in PRACTICE DAY, not negative, so players are nudged
without being punished.

---

## 14. Quick index

| id | slot | name | tags | cute | cool | cozy | stage | group |
|---|---|---|---|---|---|---|---|---|
| top-bicycle-pocket-tee | top | Bicycle Pocket Tee | cute, casual, soft | 3 | 1 | 2 | 0 | casual |
| top-practice-tee | top | Practice Room Tee | sporty, casual | 1 | 3 | 1 | 1 | practice |
| top-spirit-ringer-tee | top | School Spirit Ringer Tee | casual, cute | 3 | 1 | 2 | 0 | casual |
| top-mono-mockneck | top | Monochrome Mock-Neck | cool, stage | 0 | 4 | 1 | 3 | stage |
| top-pastel-stripe-longsleeve | top | Pastel Stripe Long Sleeve | cute, soft, casual | 4 | 0 | 2 | 0 | casual |
| shirt-oxford-white | shirt | Class Oxford Shirt | preppy, soft | 2 | 2 | 1 | 1 | preppy |
| shirt-powder-stripe-overshirt | shirt | Powder Stripe Overshirt | casual, soft | 2 | 2 | 2 | 0 | travel |
| shirt-midnight-stage | shirt | Midnight Stage Shirt | stage, cool | 0 | 4 | 0 | 4 | stage |
| knit-navy-vneck | knit | Navy V-Neck School Knit | preppy, soft, cozy | 2 | 2 | 4 | 0 | preppy |
| knit-cream-cable-cardigan | knit | Cream Cable Cardigan | cozy, soft, cute | 3 | 1 | 5 | 0 | casual |
| knit-open-stitch-stage | knit | Open-Stitch Stage Knit | stage, cool | 1 | 4 | 2 | 4 | stage |
| knit-lavender-sweater-vest | knit | Lavender Sweater Vest | preppy, cute, soft | 4 | 1 | 3 | 0 | preppy |
| hoodie-heather-spirit | hoodie | School Spirit Hoodie | casual, cozy, sporty | 2 | 2 | 4 | 0 | casual |
| hoodie-mint-crewneck | hoodie | Mint Crewneck Sweatshirt | soft, cozy, cute | 3 | 1 | 4 | 0 | casual |
| hoodie-charcoal-zip | hoodie | Practice Zip-Up Hoodie | sporty, cool | 1 | 3 | 3 | 1 | practice |
| outer-midnight-panel-jacket | outer | Midnight Panel Jacket | stage, cool | 0 | 5 | 1 | 5 | stage |
| outer-cream-puffer | outer | Snowday Puffer | cozy, cute, casual | 3 | 1 | 5 | 0 | travel |
| outer-charcoal-long-coat | outer | Departure Long Coat | cool, preppy, cozy | 0 | 4 | 3 | 1 | travel |
| outer-navy-blazer | outer | Class Blazer | preppy, cool | 1 | 3 | 1 | 2 | preppy |
| outer-light-denim-jacket | outer | Weekend Denim Jacket | casual, cool | 1 | 3 | 2 | 0 | casual |
| bottom-slim-school-slacks | bottom | Slim School Slacks | preppy, cool | 1 | 3 | 1 | 1 | preppy |
| bottom-wide-beige-chinos | bottom | Wide Retro Chinos | casual, soft | 2 | 2 | 2 | 0 | casual |
| bottom-track-pants | bottom | Practice Track Pants | sporty, casual | 1 | 2 | 3 | 1 | practice |
| bottom-oatmeal-sweatpants | bottom | Oatmeal Jogger Sweatpants | cozy, casual, soft | 2 | 1 | 5 | 0 | casual |
| bottom-light-straight-jeans | bottom | Light Wash Straight Jeans | casual, cool | 1 | 3 | 1 | 0 | casual |
| bottom-black-stage-pants | bottom | Stage Straight Pants | stage, cool | 0 | 4 | 0 | 4 | stage |
| shoes-chunky-white-sneakers | shoes | Chunky White Sneakers | casual, soft | 2 | 2 | 1 | 0 | casual |
| shoes-sporty-runner | shoes | Sporty Runners | sporty, casual | 1 | 3 | 1 | 1 | practice |
| shoes-doodle-slippers | shoes | Doodle Indoor Slippers | cute, preppy, soft | 5 | 0 | 3 | 0 | preppy |
| shoes-black-stage-boots | shoes | Stage Ankle Boots | stage, cool | 0 | 4 | 1 | 4 | stage |
| shoes-penny-loafers | shoes | Penny Loafers | preppy | 2 | 2 | 1 | 1 | preppy |
| shoes-lined-winter-boots | shoes | Snowday Lined Boots | cozy, casual | 2 | 2 | 5 | 0 | travel |
| acc-sticker-headphones | accessory | Sticker Headphones | cute, casual | 4 | 2 | 1 | 0 | travel |
| acc-striped-school-tie | accessory | Striped School Tie | preppy | 2 | 2 | 0 | 1 | preppy |
| acc-cream-knit-muffler | accessory | Cream Knit Muffler | cozy, soft, cute | 3 | 1 | 5 | 0 | travel |
| acc-silver-chain | accessory | Silver Stage Chain | stage, cool | 0 | 4 | 0 | 3 | stage |
| acc-selfie-stick-phone | accessory | Selfie Stick Phone | casual, cute | 3 | 1 | 0 | 1 | event |
| acc-mint-wristband | accessory | Mint Wristband | sporty | 2 | 2 | 0 | 1 | practice |
| bag-cream-canvas-tote | bag | Cream Canvas Tote | casual, soft, cute | 3 | 1 | 2 | 0 | casual |
| bag-black-trainee-backpack | bag | Trainee Backpack | sporty, casual, cool | 1 | 3 | 1 | 0 | practice |
| bag-lavender-crossbody | bag | Trip Mini Crossbody | casual, cute | 3 | 2 | 1 | 0 | travel |
| hat-powder-ball-cap | hat | Powder Blue Ball Cap | casual, sporty, cute | 3 | 2 | 1 | 0 | casual |
| hat-lavender-beanie | hat | Lavender Knit Beanie | cozy, soft, cute | 4 | 1 | 4 | 0 | travel |
| hat-special-star | hat | Starlight Bucket Hat | cute, stage | 4 | 2 | 1 | 2 | event |
| hair-era-a | head | Hairstyle A · Spring '25 | soft, preppy | 2 | 2 | 1 | 1 | casual |
| hair-era-b | head | Hairstyle B · Summer '25 | casual, soft | 2 | 2 | 1 | 0 | casual |
| hair-era-c | head | Hairstyle C · Winter '26 | casual, cool | 1 | 3 | 2 | 0 | travel |
| hair-stage-styled | head | Hairstyle D · Stage Styled | stage, cool | 1 | 4 | 0 | 4 | stage |
| bg-cafeteria | background | Modern School Cafeteria | preppy, casual | 2 | 1 | 2 | 0 | preppy |
| bg-practice | background | Mirror Practice Room | sporty | 1 | 3 | 1 | 2 | practice |
| bg-stage | background | School Festival Stage | stage | 1 | 3 | 0 | 5 | stage |
| bg-park | background | Bicycle Path Park | casual, soft, cozy | 3 | 1 | 3 | 0 | travel |

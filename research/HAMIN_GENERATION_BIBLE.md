# HAMIN GENERATION BIBLE

The single source of truth for generating Hamin art for HAMIN GAMES (fan-made, unofficial,
non-commercial). Every Hamin asset must follow this document so the character does not change
from page to page. Research basis: `HAMIN_VISUAL_BIBLE.md` (sections B, C, I).

## 1. Model & service
- Service: Higgsfield MCP (tools: `generate_image`, `generate_image_batch`, `remove_background`,
  `media_upload`/`media_confirm`, `media_import_url`).
- **Model: Seedream 4.5 — `seedream_v4_5`** (available and verified; 1 credit / image).
- Output: `3:4` → 1728×2304, `1:1` → 2048², `16:9` → 2560×1440, `21:9` → 3024×1296, `3:2` → 2496×1664.
- `quality: basic` (server default). Seeds are exposed per job (logged in GENERATION_LOG.md) but
  there is no seed-lock or reference-strength parameter exposed for Seedream 4.5 in this MCP.
- Reference images: `medias: [{value: <media_id|job_id>, role: "image"}]` (server maps to `image_references`).
- Seedream 4.5 **edits of an existing image keep pose, framing and scale pixel-identical**
  (measured: alignment offset 0,0 on every edit). All Dress Up layers rely on this.

## 2. Reference images used
| Id | Where | Used for |
|---|---|---|
| `a3f0df16-63d4-40a8-9a39-eee2655c4221` | REF_12 (official Reply High School portrait, via ELLE Korea), imported | face (front), hair Era B |
| `6c784575-3da4-40ee-91b7-0a7c3806f703` | REF_04 (official April 2025 full-body profile photo), imported | body proportions |
| `25c155da-0e12-4702-8516-d26a3d612e76` | **MAIN GENERATED REFERENCE** (master front portrait crop, uploaded) | identity for all new poses/scenes |
| `38a8b081-d104-4ae6-91cf-c4ef80716e8a` | **CANONICAL BASE** (full-body job) | input image of every Dress Up edit; identity for sprites/poses |
Imports of REF_01, REF_02 and REF_08 were blocked by the session's permission classifier and
were not used. Press-agency photos were used only for private visual study, never uploaded.

### Character master
- Sheet jobs (16:9, 3 variants): `db1d2583-93c2-4f7f-9a85-1cb27303aa76`, `0c92b520-4ba7-420e-92b5-baf3d9a31c07` (**selected**),
  `43f36eb8-8d53-468f-9137-b0a9729e0ae5`. In all three, the two front portraits were consistent and
  recognizable, while the side/3-4 views drifted into a generic style → **only the front neutral portrait of
  `0c92b520` was kept** (`art-source/character/MASTER_front_neutral.png`) and every other view is made by
  *editing* canonical images instead of generating new sheets.
- Canonical base jobs (3:4, 3 variants): `92b90f13-…`, `38a8b081-…` (**selected**: best margins, no floor
  shadow, closest face to the master), `98ded561-…`. Matte: `a93e0dc3-eee3-4095-9a54-b6fbd2846ab2`.

## 3. Canonical description (paste into prompts)
**Face (identity):** slim oval face with a gently tapered jaw and small softly pointed chin; medium-large
almond-shaped dark brown eyes with thin double eyelids and a calm gaze (keep them almond — never round
anime eyes); straight slim nose with a small soft tip; small mouth with soft coral-pink lips; fair skin with
a neutral-warm undertone.

**Hair (default, "Era B / neat curtain"):** black layered hair with a blue-black sheen, soft slightly tousled
curtain fringe falling to the eyebrows with a few wispy strands, face-framing side pieces to the cheekbones,
nape covering the neck.

**Body:** slim and tall, narrow shoulders, long legs, small head (~7.5 heads tall), natural young-adult
proportions.

**Style block:** "Art style: polished Korean web-game character illustration, a modern high-quality
interpretation of mid-2000s Korean Flash dress-up game art, clean even dark-brown line art, slightly glossy
cel shading, soft gradient highlights and small specular glints in the hair and eyes, subtle dimensionality,
smooth high resolution (NOT pixel art, NOT a photo, not chibi, not anime-exaggerated)."

**Background for cut-outs:** "Plain flat very light grey background, no floor shadow."

## 4. Negative instructions (always)
No text, letters, numbers, labels, logos, brand marks, swooshes, crests or school names; no watermark; not
pixel art; not photorealistic; no extra fingers; no franchise characters; no copies of official photos,
costumes or merch; never undressed (the base always wears a plain white tee, slim grey joggers, white socks).
Never present generated art as an official photo.

## 5. Rendering notes
- Outline: warm dark brown, even weight. Shading: 2-3 tone cel with soft gradient; small white speculars.
- Eyes: dark brown iris with a larger highlight top-right and a small one bottom-left.
- Skin: base `#F6E1D6`, shadow `#E9C3B6`, blush `#F2B6B0` (stylized).
- Hair: `#12141A` base, blue sheen highlight toward `#3A4660`.
- Palette & tag colours: `HAMIN_VISUAL_BIBLE.md` §F and §I5.

## 6. Proven prompt templates
**Dress Up garment edit** (input image = canonical base job):
> Edit this exact image. Keep EVERYTHING identical: same person, same face, same hair, same head position and
> size, same pose, same arms and hands, same body position and scale, same framing, same background, same art
> style and line weight, same <unchanged garments>. Only change: <replace the white t-shirt with / he now
> wears … over the white t-shirt / replace the grey jogger pants with / he now wears … on his feet> <ART
> DESCRIPTION>. No text, no letters, no logos, no brand marks.
Full per-item prompts: `art-source/gen_specs/wardrobe_jobs.json`.

**Expression edit:** "…Keep EVERYTHING identical… Only change the facial expression to <expression>."
**Hairstyle edit:** "…same face and expression… Only change the hairstyle to <hair description>."
**New pose / scene** (not an edit): references `[25c155da (master), 38a8b081 (base)]` + "The character is EXACTLY
the young man from the reference images: same face, same hair, same illustration style" + canonical
description + pose/outfit + style block.

## 7. Production pipeline (tools/art)
1. Generate (batch ≤ 12) → `wait_jobs.py` downloads from the Higgsfield CDN into `art-source/…`.
2. Dress Up layers: `make_layer.py <slot> <id> <edit.png>` → aligns to the base, extracts the Lab-ΔE
   difference mask inside the slot region, cleans it, writes `assets/clothes/<slot>/<id>.webp` (1200×1600)
   + 200×200 thumb + QA preview. Heads are whole-head layers (`--mode alpha`, chin line y=405 base px,
   feathered neck, dark side strands kept to shoulder level).
3. Item sheets: `whitebg_alpha.py` (flat-colour flood fill) or `remove_background` → `slice_sheet.py`.
4. Poses / sprites: `fit.py canvas|frames`.
5. Every output is inspected; rejects are logged with the reason and regenerated (max 2 retries).
Raw generations stay in `art-source/` (never deployed); only optimized WebP goes to `assets/`.

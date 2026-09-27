# GENERATION LOG — HAMIN GAMES

All image generation for HAMIN GAMES goes through the **Higgsfield MCP** connected to
this environment. This log records the tools and models that were *actually* used.

## Higgsfield MCP — tools actually exposed in this environment (inspected 2026-09-27)

Image-relevant tools that exist and were used or inspected:

| Tool | What it does (from its schema) |
|---|---|
| `generate_image` | one generation request (count 1–4), `model`, `prompt`, `aspect_ratio`, `medias[]` (reference inputs by media_id / job_id), `get_cost` preflight |
| `generate_image_batch` | 1–12 independent generations submitted in parallel |
| `job_display` | inspect one job (status, params incl. seed/size, result URLs) |
| `show_generation_by_ids` | fetch up to 60 finished jobs (result URLs) |
| `remove_background` | background removal for an image job/media → transparent PNG |
| `media_import_url` | import an HTTPS image URL into Higgsfield storage → media_id |
| `media_upload` / `media_confirm` | presigned upload of local files → media_id |
| `upscale_image`, `outpaint_image` | available, not needed so far |
| `show_reference_elements` | reusable "Elements" (documented as working with Seedream 4.5 / 5 lite) |

Tools that other Higgsfield tool descriptions *mention* but which are **not exposed**
here: `models_explore`, `jobs_wait`, `list_workspaces`, `job_status`. They were not used.
Model catalog could therefore not be listed; model ids below come from the tool
descriptions and were confirmed by successful jobs.

## Model

- **Seedream 4.5** — model id `seedream_v4_5` — available and used.
  - Cost preflight: 1 credit per image (`get_cost`).
  - Default output for `aspect_ratio: "3:4"`: 1728 × 2304 PNG, `quality: "basic"`, seed exposed per job.
  - Reference images: pass `medias[{value: <job_id|media_id>, role: "image"}]`; the server
    coerces the role to `image_references` for Seedream 4.5.
- `image_background_remover` (via `remove_background`) for alpha cut-outs.

## Pipeline tests (generic original test character — NOT Hamin, not used in the game)

| Job | Purpose | Result |
|---|---|---|
| `8de291aa-dd95-4688-a494-57b408c1648a` | first style test, "early-2000s Flash" wording | came out as **pixel art** → style prompt must say "smooth high-resolution 2D illustration, NOT pixel art" |
| `c4109615-ab3e-4644-8f28-9f318c3ec23e` | base body test (white tee, grey joggers, socks) | clean smooth style, symmetrical pose, seed 942428 |
| `1e6c054d-8bce-46d6-9d7c-8dea8b70e3fa` | edit: navy V-neck knit | pose preserved pixel-exact |
| `41ed5c85-e889-4248-b4e5-da2d7bb161b9` | edit: open denim jacket | pose preserved; open front shows base tee |
| `5de18456-894e-4fe5-b47f-f72c7552728f` | edit: wide beige chinos | pose preserved |
| `2ee25919-0f7d-4601-8796-6936b8272fa0` | edit: chunky sneakers | pose preserved |
| `5be708f6-c350-427c-a689-0840e86c3681` | background removal of base | clean alpha |

**Finding:** Seedream 4.5 *edits* of a base image keep pose, scale and framing pixel-identical
(alignment search in `tools/art/layerize.py` found dx=dy=0, scale 1.0, NCC ≈ 0.985 for all
four edits). Garment layers are extracted with a perceptual (Lab ΔE) difference mask inside
a body region, cleaned with morphology, and stack correctly (sneakers + chinos + knit + open
jacket composite looked coherent). This is the production method for the Dress Up wardrobe.

## Production generations

(appended below as assets are generated)

### Food sheet (Lunch Time) — 2026-09-27
- Job `81012145-57d9-4c76-b26c-590e632dad75` · seedream_v4_5 · 1:1 (2048×2048) · seed 802481
- Prompt: 16 cute Korean lunch foods in a 4×4 grid on flat white, glossy mid-2000s Korean web-game icon style, NOT pixel art.
- Result: accepted first try (clean grid, no text/logos). Background removed locally
  (`tools/art/whitebg_alpha.py`, border flood-fill) and sliced with `tools/art/slice_sheet.py`
  → `assets/food/food-*.webp` (256×256). Raw: `art-source/food/food_sheet_v1.png`.

### Item sheets & backgrounds (non-character) — 2026-09-27
All seedream_v4_5. Sheets are sliced with `tools/art/slice_sheet.py`; alpha from
`tools/art/whitebg_alpha.py` (flat-color flood fill) or Higgsfield `remove_background`
(`image_background_remover`) when items are white-on-white (plush, fur, clock faces).

| Job | Asset | Outcome |
|---|---|---|
| `8dc3fbde-0302-4f77-9646-1dc1bba3610e` | sticker sheet A (16) | accepted except cell 2 (drew cherries instead of a red heart) |
| `8b2bbc28-f1f6-47d8-9349-9fa026ee2cdb` | sticker sheet B (16) | accepted |
| `c0117b8e-dc11-4aa9-a120-5c3f4a83911b` | sticker sheet C (9) | accepted; had white grid lines → erased in slicer |
| `e7e84765-3f39-498f-9d3f-158d38805baa` | sticker fix (red heart, cherries, rainbow, lollipop) | accepted |
| `56fb8e78-3c05-44d6-83c4-64a6552c6403` | room sheet A (16) | accepted; floor shadows glued row 2 → HF matting `f858972b-…` |
| `bbc0c819-f750-4b03-96ea-62623b20f675` | room sheet B (16) | partial: merged cells, pseudo-text on comic covers → 10 items used |
| `54814e12-4147-40e1-8c9a-8786c047bdb6` | room sheet C (6) | partial: trophy sneaker had a swoosh-like brand mark → **rejected** |
| `19bbf8e2-79cd-4582-8e91-b5be15a4bb1a` | room fix (books, comics w/o text, monstera, vase, sheep plush, logo-free trophy, clock, yarn, globe) | accepted; HF matting `a7145cb0-…` |
| `94078776-8b05-44bb-ad44-bf3d28eae27d` | runner obstacles / collectibles / power-ups (16) | accepted |
| `cd904ca1-c150-47c4-875a-154c78694bb8` | puppy sheet v1 | **rejected**: came out pixel-art ("sprite sheet" wording) |
| `bcf80d3f-fdc8-431d-9ef0-23c16526ecfc` | puppy sheet v2 ("smooth vector-style illustration sheet") | accepted; HF matting `5dd04542-…`; left-facing frames mirrored, all frames one scale |
| `bf02d04f-a36f-4066-9557-05fd8ea7620d` | bg-bedroom v1 | plush resembled a franchise character + CD cover art → shelf patched from edit `1a10ea1a-…`, CD cover repainted locally |
| `00a0f641-…`, `ad0a4468-…`, `86ce0f3f-…`, `97cc2f47-…`, `aca90bdb-…`, `5064970f-…` | bg-practice, bg-street, bg-stage, bg-starry, bg-cafeteria, bg-park (3:4) | accepted |
| `e5d05971-…`, `e56aae0e-…` | runner bg-park, bg-river (21:9) | accepted |
| `fc593cad-…`, `008d4114-…`, `71636d88-…` | runner school / city / festival v1 | **rejected**: receding perspective, can't tile |
| `d8a706b8-8ed5-4c83-a50c-0dfba4af61a9` | runner bg-city v2 (flat side view) | accepted |
| `256da661-…`, `71b4598d-…` | runner school / festival v2 | **rejected**: still perspective |
| `df6ffb34-…` | food/bg-lunch (16:9) | accepted |
| `5817c8e9-…` | rhythm/bg-practice-room (16:9) | accepted |
| `ea381968-…` | room/bg-room (16:9 → cropped 16:10) | accepted |
| `aff9b438-…` | ui/banner-event (21:9) | accepted |
| `a3d15b5c-ea10-4f3c-8e4d-3195bca13ba4` | runner bg-school v3 ("classic 2D platformer layer, flat theater backdrop") | accepted |
| `f7301106-30f3-4ff6-b711-b878a1e3ec15` | runner bg-festival v3 (same wording) | accepted |

### Character asset pack (6 art agents, seedream_v4_5, edits of canonical base 38a8b081 / refs 25c155da) — 2026-09-27
| Job | Asset | Status | Note |
|---|---|---|---|
| `651dbfd3-c0fc-45ba-af25-e530fd4e46a6` | head-era-a-smile | accepted | clear gentle smile, era-a hair kept |
| `0f93244d-d50d-4c5b-8efb-02297b7495ff` | head-era-a-big | accepted | clear big smile; minor strand variation vs neutral |
| `56a97698-a60c-463e-aeb8-dca92a50a50a` | head-stage-smile | accepted | subtle but readable smile, stage hair kept |
| `b8c3e76f-5aa3-4ce2-8ee7-a3be8b4b29e7` | head-stage-big | accepted | clear big smile |
| `7770c355-9cda-4f00-9858-3c754d879ebf` | head-era-c-neutral | accepted | fluffy airy hair, same face; pale wispy strand tips faded in post (clean_head --fade-light |
| `b94eaa86-2bbe-4899-ac13-3b56fb541ec9` | head-era-b-sheep | accepted | crescent eyes, big open smile, rosy cheeks |
| `cdc94da4-20d0-40e9-b1d7-43c5e61f41b2` | head-era-b-surprised | accepted | wide eyes, small round mouth, cute |
| `9b0a76c8-6150-4a8b-bd0b-4fd8a85bff14` | head-era-b-focused | rejected | expression too subtle, reads as neutral |
| `c9da9ce4-8646-44a9-bc5e-ab53394c3580` | head-era-b-wink | accepted | his left eye (image right) winks, small smile |
| `ffffcb3f-b712-4321-bbff-6023d0f30c52` | head-era-b-pout | rejected | pout too subtle, brows hidden by fringe |
| `fa3b718c-2c99-4962-8863-c49f9fc222a7` | head-era-b-eating | rejected | puffed cheeks but frowning mouth and neutral eyes (not happy/content) |
| `0559e32b-0987-45a2-afb6-b0662fba75aa` | head-era-c-smile | accepted | gentle smile, era-c hair kept |
| `dd3e776e-32a4-41ed-ad49-93acab222778` | head-era-c-big | accepted | clear big smile, era-c hair kept |
| `300e4169-6428-43a1-94fb-efd54e46b05e` | head-era-b-focused | rejected | framing changed (zoomed extreme close-up of the face), breaks layering |
| `4a4e999b-a746-400b-8b34-872c0a5aed8b` | head-era-b-pout | rejected | puckered lips read as a kiss face rather than a disappointed pout |
| `5588aee0-af1b-4708-b5a0-803f396312e6` | head-era-b-eating | rejected | food piece visible sticking out of the mouth; cheeks not puffed |
| `31f357df-d516-41e0-bf20-5f9817ac9dbd` | head-era-b-focused | accepted | best of 3 (final retry); still subtle: narrowed eyes + straight pressed lips, brows hidden |
| `3ae9637f-d952-4479-9b9b-60aff27d25f9` | head-era-b-pout | accepted | final retry: down-turned lips, slightly downcast eyes; mild but readable |
| `dc850ca1-de29-4238-859b-13656b9f7707` | head-era-b-eating | accepted | final retry: hamster cheeks, happy crescent eyes, closed smile; puffed jaw extends below c |
| `53dbf0b1-545f-42c4-91ea-495dfa0e9201` | assets/collection/mem-001.webp | accepted | QA pass: identity, hands, no text/logos [spec: art-source/memories-thumbs/specs.json#mem-0 |
| `5d1a3278-5740-452f-9ba5-cfa9970035f9` | assets/collection/mem-002.webp | accepted | QA pass: identity, hands, no text/logos [spec: art-source/memories-thumbs/specs.json#mem-0 |
| `8448837a-9f28-4a38-868c-a2d36d01d00b` | assets/collection/mem-003.webp | accepted | QA pass: identity, hands, no text/logos [spec: art-source/memories-thumbs/specs.json#mem-0 |
| `a851187f-9861-4647-b38a-e9aef8f8944d` | assets/collection/mem-004.webp | accepted | QA pass: identity, hands, no text/logos [spec: art-source/memories-thumbs/specs.json#mem-0 |
| `e79c28c9-071e-4c70-940a-d29b690f5475` | assets/collection/mem-005.webp | accepted | QA pass: identity, hands, no text/logos [spec: art-source/memories-thumbs/specs.json#mem-0 |
| `ac11912d-d28b-4b5d-a8a3-7fe4889336b3` | assets/collection/mem-006.webp | accepted | QA pass: identity, hands, no text/logos [spec: art-source/memories-thumbs/specs.json#mem-0 |
| `ce558f48-c5aa-49bb-b74c-c5009cd913c3` | assets/collection/mem-007.webp | accepted | QA pass: identity, hands, no text/logos [spec: art-source/memories-thumbs/specs.json#mem-0 |
| `dc988008-9919-42a9-8131-0f056cbe1168` | assets/collection/mem-008.webp | accepted | QA pass: identity, hands, no text/logos [spec: art-source/memories-thumbs/specs.json#mem-0 |
| `75d768fc-eef5-45fc-bf1e-740a9e3b4508` | assets/collection/mem-009.webp | accepted | QA pass: identity, hands, no text/logos [spec: art-source/memories-thumbs/specs.json#mem-0 |
| `7f1d93bd-9a20-4bd9-9c87-c0d8e8be21d1` | assets/collection/mem-010.webp | accepted | QA pass: identity, hands, no text/logos [spec: art-source/memories-thumbs/specs.json#mem-0 |
| `aac5e2be-d9e5-442e-89bf-939c66be8f5c` | assets/collection/mem-011.webp | accepted | QA pass: identity, hands, no text/logos [spec: art-source/memories-thumbs/specs.json#mem-0 |
| `7a189487-31ba-485a-8d63-3b59d7f37885` | assets/collection/mem-012.webp | accepted | accepted with local fix: logo-like square patch on the pink cap removed by directional inp |
| `5c49de15-c04c-4efd-a75e-ec5b6ea7038e` | assets/collection/mem-013.webp | accepted | accepted, cropped to the inner photo area of the polaroid frame (legs overlapped the frame |
| `af3404f4-a113-4563-b14a-0cd4dda96efc` | assets/collection/mem-014.webp | accepted | QA pass: identity, hands, no text/logos [spec: art-source/memories-thumbs/specs.json#mem-0 |
| `c6ed2c24-ed98-4ed1-8a20-51acc786f379` | assets/collection/mem-015.webp | accepted | QA pass: identity, hands, no text/logos [spec: art-source/memories-thumbs/specs.json#mem-0 |
| `1bbaefe5-ea9d-40c5-b207-e702271207cb` | assets/collection/mem-016.webp | accepted | QA pass: identity, hands, no text/logos [spec: art-source/memories-thumbs/specs.json#mem-0 |
| `f8302770-d8cc-46c0-8e36-2edf92804505` | assets/collection/mem-017.webp | accepted | QA pass: identity, hands, no text/logos [spec: art-source/memories-thumbs/specs.json#mem-0 |
| `33c01c21-0841-4d64-8787-700d8ad288fc` | assets/collection/mem-018.webp | accepted | QA pass: identity, hands, no text/logos [spec: art-source/memories-thumbs/specs.json#mem-0 |
| `3e0ef11f-8e66-43ed-8d49-f10fc19616fb` | assets/ui/thumbs/dress-up.webp | rejected | duplicate character: large cropped face card on the left plus full figure [spec: art-sourc |
| `b285770d-bd6a-4029-a374-61b916c8d215` | assets/ui/thumbs/photo-booth.webp | accepted | QA pass: identity, hands, no text/logos [spec: art-source/memories-thumbs/specs.json#thumb |
| `c1a6f9cd-0093-4e2f-87fd-d5364eeea4d4` | assets/ui/thumbs/run-hamin.webp | accepted | QA pass: identity, hands, no text/logos [spec: art-source/memories-thumbs/specs.json#thumb |
| `a719241a-fa6d-4a4e-a4a9-859aecccf157` | assets/ui/thumbs/lunch-time.webp | rejected | Hangul text printed on the milk carton [spec: art-source/memories-thumbs/specs.json#thumb- |
| `e5e71f9c-6755-4fd6-826f-4ba2b37570cb` | assets/ui/thumbs/practice-room.webp | rejected | duplicate character: inset portrait card on the left [spec: art-source/memories-thumbs/spe |
| `efc163f9-a11e-40aa-afe4-1c70c6fc9032` | assets/ui/thumbs/my-room.webp | rejected | duplicate character: inset portrait card on the right [spec: art-source/memories-thumbs/sp |
| `0efe30ce-ed7a-460b-b673-b6074171492e` | assets/ui/og.webp | accepted | accepted with local fix: stray "Y2" letter sticker removed by harmonic inpainting (work/fi |
| `e3024235-7c3a-488d-8491-6746aec44fb7` | assets/ui/thumbs/dress-up.webp | accepted | QA pass: identity, hands, no text/logos [spec: art-source/memories-thumbs/specs.json#thumb |
| `a436f263-d60e-42d1-b29e-5b15de49c26e` | assets/ui/thumbs/practice-room.webp | accepted | QA pass: identity, hands, no text/logos [spec: art-source/memories-thumbs/specs.json#thumb |
| `c1409860-2342-4c88-8698-e12a724daa07` | assets/ui/thumbs/my-room.webp | accepted | QA pass: identity, hands, no text/logos [spec: art-source/memories-thumbs/specs.json#thumb |
| `887625b8-75a7-4acc-bca3-fb07a678fdc2` | assets/ui/thumbs/lunch-time.webp | accepted | QA pass: identity, hands, no text/logos [spec: art-source/memories-thumbs/specs.json#thumb |
| `a440facf-8d40-4048-956c-575a8875828a` | assets/ui/og.webp | rejected | no empty top band for the logo (head reaches the top edge); original og kept with local fi |
| `ef772862-e3d5-4f25-8cb3-f91a1f380495` | assets/collection/mem-013-r1.webp | rejected | added a small inset photocard with a second face; original mem-013 kept (cropped) [spec: a |
| `61afa59b-6380-4392-8529-98926132b03d` | assets/photobooth/poses/pose-vsign.webp | accepted | identity/hands/outfit OK |
| `0bfc46af-1372-4eb9-b981-b307dd994a84` | assets/photobooth/poses/pose-vsign.webp (alpha) | accepted | clean matte, holes open |
| `356e2900-61dd-4001-88d8-fdac72635780` | assets/photobooth/poses/pose-heart.webp | accepted | identity/hands/outfit OK |
| `65d0a8cd-ca5f-491a-b972-8e0be6bc7614` | assets/photobooth/poses/pose-heart.webp (alpha) | accepted | clean matte, holes open |
| `74fa8b49-f28f-41a7-acd0-efe08b4ff78f` | assets/photobooth/poses/pose-wave.webp | accepted | identity/hands/outfit OK |
| `da44e233-ed62-461c-9970-33c86c796774` | assets/photobooth/poses/pose-wave.webp (alpha) | accepted | clean matte, holes open |
| `ca834c98-064d-436e-83b9-0315e32f1aa4` | assets/photobooth/poses/pose-dance.webp | accepted | identity/hands/outfit OK |
| `762f466f-0eff-44ed-aea1-997359e199ca` | assets/photobooth/poses/pose-dance.webp (alpha) | accepted | clean matte, holes open |
| `761e7f97-3747-4391-a061-2baa405867a7` | assets/photobooth/poses/pose-sheep-smile.webp | accepted | identity/hands/outfit OK |
| `df316c79-fd39-4d13-9664-aa5432aea645` | assets/photobooth/poses/pose-sheep-smile.webp (alpha) | accepted | clean matte, holes open |
| `f5578930-eca8-42aa-9d9e-c61f2c543584` | assets/photobooth/poses/pose-run.webp | accepted | identity/hands/outfit OK |
| `3e6ff350-c528-4de5-9e54-4b8b309bda92` | assets/photobooth/poses/pose-run.webp (alpha) | accepted | clean matte, holes open |
| `3c97a3f3-65a6-45a2-bf93-0315e32d14e5` | assets/photobooth/poses/pose-stage.webp | accepted | identity/hands/outfit OK |
| `e6937c5d-490e-4be1-a891-07bd6bb3ff19` | assets/photobooth/poses/pose-stage.webp (alpha) | accepted | clean matte, holes open |
| `c6d4a82d-1b87-4cb4-9ac9-0b00d1e8fe5f` | assets/photobooth/poses/pose-cozy.webp | accepted | identity/hands/outfit OK |
| `a3e5316c-4671-4e88-a0c0-b7f56c3e6265` | assets/photobooth/poses/pose-cozy.webp (alpha) | accepted | clean matte, holes open |
| `ad022d9d-a0bf-475d-9495-0e826ab51328` | assets/runner/hamin-run-*,jump,duck (sheet v1) | accepted | used frames 1,3 (1,3,1,3 pattern), jump, duck; frames 1/2/4 near-identical |
| `6dddb34d-31ca-4c7d-85be-35484d3fa079` | runner sheet v1 (alpha) | accepted | clean matte |
| `978d76e1-49b9-4591-9fa5-282cca25d4b7` | runner sheet v2 | rejected | run cycle reads as walk/skip, jump drawn front-facing, duck head down |
| `ad3c77de-6a16-4b62-930b-d39c792a75db` | assets/runner/hamin-startled.webp | accepted | side-right, looking back, cute surprised |
| `5031ad77-908c-46a5-9731-63ef94a58584` | startled (alpha) | accepted | clean matte |
| `fe744104-7dfe-43aa-98b7-1451a1b809c9` | startled v2 | rejected | body turned to the left, expression not surprised |
| `20afa5d5-cb65-4a54-abef-8f96c5c69865` | assets/rhythm/hamin-dance-* | accepted | 5 distinct front poses, consistent identity/outfit |
| `4dbd44b4-92eb-48a4-a1fa-c2b9c233f83a` | dance sheet (alpha) | accepted | clean matte |
| `04544207-c2dc-460b-b7eb-3304939f134d` | shoes-sporty-runner | accepted | clean edit, align 0.989 dx0 dy0; ankle skin shows above low-cut runners (by design) |
| `4510211e-06b9-4b12-ae07-7d0fefbd843e` | shoes-doodle-slippers | rejected | drawn as vented clogs (reads like a branded clog) instead of strap slides; scribbly doodle |
| `ea849799-ad63-4a68-aa35-334aff7945c6` | shoes-black-stage-boots | accepted | clean edit, align 0.989; thumb cut above boot shafts (jogger cuff hidden) |
| `b01af18b-45a8-47cd-9b25-774c07a58ac6` | shoes-penny-loafers | accepted | clean edit, align 0.982 |
| `41b94ef8-7517-457d-8f92-b0c1800a7453` | shoes-lined-winter-boots | accepted | clean edit, align 0.990; cool floor-shadow pixels flood-cleaned |
| `f09635f1-f899-4195-809d-80dd84257eb9` | acc-sticker-headphones | rejected | framing changed to head close-up (align score 0.094) and headphones worn as a headband |
| `55484c0d-77e9-49e2-ae73-ee1bb81134ba` | acc-striped-school-tie | accepted | clean edit, align 0.991; model added a white shirt collar under the tie (kept as part of t |
| `5a04c12a-f025-4ba6-83d6-b63fa2316185` | acc-cream-knit-muffler | accepted | align 0.983; layer rebuilt with --thresh 6 (cream vs white tee) + tee-shadow flood clean |
| `e52c64aa-533f-48ce-8c37-3d090ea4de2c` | acc-silver-chain | accepted | clean edit, align 0.989 |
| `b45082bb-c105-4cb6-93bf-a291313f9968` | acc-phone-lanyard | accepted | align 0.987; plain phone, no logo (generic multi-lens camera bump) |
| `23895a28-4671-4eeb-9cfa-113c72b164ee` | acc-mint-wristband | accepted | align 0.988; on his right wrist; skin fragments dropped |
| `295c493b-a3bf-4c88-a53f-f85165283600` | acc-dot-tie | accepted | align 0.990; loosened tie around the tee neckline (no separate shirt collar drawn) |
| `d3991784-9fc0-4219-89cf-92ef5831953b` | bag-cream-canvas-tote | accepted | align 0.987; arm stays in front of the bag (base arm shows through); --thresh 6 + flood cl |
| `d18286cb-062f-4edc-af6e-3df0679a6db4` | bag-black-trainee-backpack | accepted | align 0.987; model drew it front-carried on both shoulders (all described details visible) |
| `9e9925b6-aa21-4c07-9dfa-2c713b46c812` | bag-lavender-crossbody | accepted | align 0.988; tee-shadow flood clean |
| `7d27c54c-27aa-4005-b13d-5f5e16b54587` | hat-powder-ball-cap | accepted | align 0.966; best of 3 (both retries broke framing); brim angled to his right instead of s |
| `38bdc301-f144-4aee-97d7-0ec44584f153` | hat-lavender-beanie | rejected | superseded by retry 24e4012a (near-identical, slightly less base hair exposed) |
| `26b77bad-32aa-48eb-9a4e-3b0725b92ef0` | hat-special-star | rejected | superseded by retry 650ab60a (cleaner, wider brim) |
| `c439497d-563b-453d-88c3-10e6e984bc0e` | acc-sticker-headphones | rejected | retry 1: headband drawn as a giant horizontal ring around the neck |
| `3d4e89d7-adfa-4ca2-90d3-55c116270188` | shoes-doodle-slippers | accepted | retry 1 (asked for flat strap slides, no holes, simple doodle shapes, no writing): align 0 |
| `9d19aa52-dee9-482a-b0fc-6b0966f1c0a8` | bag-black-trainee-backpack | rejected | retry 1 (asked for back-worn view): only harness-like zip straps visible, front pocket not |
| `f5795131-9c25-4a41-81e5-72c035aa9935` | hat-powder-ball-cap | rejected | retry 1 (coverage clarification): framing changed to extreme close-up of the cap |
| `24e4012a-3662-4740-b7e7-09d6162474dc` | hat-lavender-beanie | accepted | retry 1 (coverage clarification): align 0.963; small base-hair tufts still visible at uppe |
| `650ab60a-aeba-4131-90fd-24d4a8d40b87` | hat-special-star | accepted | retry 1 (coverage clarification): align 0.958; small base-hair tufts at upper sides |
| `c808ea21-fb6d-4f0c-ac1a-6c61f59b44be` | acc-sticker-headphones | accepted | retry 2 (realistic size, cups on collarbones, band behind neck, stickers on cups): align 0 |
| `79142716-82a7-43ee-afd0-2c0115c7f170` | hat-powder-ball-cap | rejected | retry 2 (brim straight forward + keep full-body framing): framing changed to close-up agai |
| `ee42e1b9-54a1-4997-8466-cc644e66a194` | hoodie-heather-spirit | accepted | score 0.990; make_layer.py (align dx=dy=0) + art-source/wardrobe/refine_wob.py (base-garme |
| `e39d6902-0559-4743-9725-037e523f0d58` | hoodie-mint-crewneck | accepted | score 0.987; make_layer.py (align dx=dy=0) + art-source/wardrobe/refine_wob.py (base-garme |
| `fe5d5d64-f63d-42df-899a-6984858bf981` | hoodie-charcoal-zip | accepted | score 0.986; make_layer.py (align dx=dy=0) + art-source/wardrobe/refine_wob.py (base-garme |
| `1f0545d7-b9c9-46a5-8e68-c1367444e862` | outer-midnight-panel-jacket | accepted | score 0.988; make_layer.py (align dx=dy=0) + art-source/wardrobe/refine_wob.py (base-garme |
| `038feb5f-8290-41d4-8b4f-a4eefcaeec47` | outer-cream-puffer | rejected | cream puffer ~ white tee and light-grey background (dE < thresh): layer full of holes, rig |
| `d44ead04-a7c6-42db-9a6d-0a4495e38124` | outer-cream-puffer | accepted | retry 1 (warmer cream for contrast); score 0.984; make_layer.py (align dx=dy=0) + art-sour |
| `f4696ab8-3e53-4200-a650-90cc781f437b` | outer-charcoal-long-coat | accepted | score 0.986; make_layer.py (align dx=dy=0) + art-source/wardrobe/refine_wob.py (base-garme |
| `eb1d58ba-e8f0-482a-9621-435dd8fc3112` | outer-navy-blazer | rejected | slim sleeves: base tee sleeves stuck out at both shoulders; covering them gave puffed leg- |
| `740aead2-eca4-432f-b7bd-df6ea822a9ab` | outer-navy-blazer | accepted | retry 1 (roomy upper sleeves); score 0.990; make_layer.py (align dx=dy=0) + art-source/war |
| `c65185cb-ba40-4cec-9f61-5945435ccc3b` | bottom-slim-school-slacks | accepted | score 0.984; make_layer.py (align dx=dy=0) + art-source/wardrobe/refine_wob.py (base-garme |
| `e55a7cda-48dc-4b22-9de1-9eb8b5310bb6` | bottom-track-pants | accepted | score 0.988; make_layer.py (align dx=dy=0) + art-source/wardrobe/refine_wob.py (base-garme |
| `1b3659f0-6f49-45d8-b88a-34d1e8e151f9` | bottom-oatmeal-sweatpants | accepted | score 0.985; make_layer.py (align dx=dy=0) + art-source/wardrobe/refine_wob.py (base-garme |
| `aac7eed5-81d9-4224-9d22-6bd85c1ad470` | bottom-light-straight-jeans | accepted | score 0.987; make_layer.py (align dx=dy=0) + art-source/wardrobe/refine_wob.py (base-garme |
| `12cb494f-d647-4c51-a5d4-ad2f383531ff` | bottom-black-stage-pants | accepted | score 0.985; make_layer.py (align dx=dy=0) + art-source/wardrobe/refine_wob.py (base-garme |
| `83b0aca5-c9cd-4a31-bb30-5ece2d9e36fc` | assets/clothes/top/top-bicycle-pocket-tee.webp | accepted | align score>=0.977 dx=0 dy=0; pose/arms unchanged; mask: refine_upper.py replace --no-jogg |
| `aece77ac-683a-4376-94d1-f630b0e74225` | assets/clothes/top/top-practice-tee.webp | accepted | align score>=0.977 dx=0 dy=0; pose/arms unchanged; mask: refine_upper.py replace --no-jogg |
| `7c733c43-67c0-48a1-bb81-6766602579b0` | assets/clothes/top/top-spirit-ringer-tee.webp | accepted | align score>=0.977 dx=0 dy=0; pose/arms unchanged; mask: refine_upper.py replace --extend  |
| `e619d268-5305-4204-b6e0-e0429aa39e12` | assets/clothes/top/top-mono-mockneck.webp | accepted | align score>=0.977 dx=0 dy=0; pose/arms unchanged; mask: refine_upper.py replace --no-jogg |
| `fbf1b3b3-e6d9-4b87-bc36-edb04da09205` | assets/clothes/top/top-pastel-stripe-longsleeve.webp | accepted | align score>=0.977 dx=0 dy=0; pose/arms unchanged; mask: refine_upper.py replace --extend  |
| `59b6fc04-5b37-43e8-ba21-174930bcb110` | assets/clothes/shirt/shirt-oxford-white.webp | accepted | align score>=0.977 dx=0 dy=0; pose/arms unchanged; mask: refine_upper.py replace --no-pock |
| `0b79d5a8-92ca-4146-9e16-17db3500bf4a` | assets/clothes/shirt/shirt-powder-stripe-overshirt.webp | accepted | align score>=0.977 dx=0 dy=0; pose/arms unchanged; mask: refine_upper.py over --core-hue 2 |
| `a115e985-d122-4703-b286-55fbd394c954` | assets/clothes/shirt/shirt-midnight-stage.webp | accepted | align score>=0.977 dx=0 dy=0; pose/arms unchanged; mask: refine_upper.py replace --no-jogg |
| `6bc321f5-b3dd-4d8e-b8af-563af88c3bb7` | assets/clothes/knit/knit-cream-cable-cardigan.webp | accepted | align score>=0.977 dx=0 dy=0; pose/arms unchanged; mask: refine_upper.py over --cream --co |
| `97db1d38-77b3-4c04-a641-c27f96ea31e5` | assets/clothes/knit/knit-open-stitch-stage.webp | accepted | align score>=0.977 dx=0 dy=0; pose/arms unchanged; mask: refine_upper.py replace --no-jogg |
| `58192aa0-e6f3-4950-8d27-d065345b42a7` | assets/clothes/knit/knit-lavender-sweater-vest.webp | accepted | align score>=0.977 dx=0 dy=0; pose/arms unchanged; mask: refine_upper.py over --core-hue 2 |
| `50dcbc3f-2097-42e0-b478-349b6ef6ec98` | assets/clothes/knit/knit-stripe-polo.webp | accepted | align score>=0.977 dx=0 dy=0; pose/arms unchanged; mask: refine_upper.py replace --no-jogg |

# ★ HAMIN GAMES ★

An unofficial, non-commercial, fan-made retro Korean web-game portal about Hamin (SMTR25),
built like a lost 2005–2008 Flash-game site. **Not affiliated with SM Entertainment.**
Plain static files (HTML / CSS / vanilla JS / Canvas / WebP) — made for **Neocities**.

Games: **Dress Up** · **Photo Booth** · **Run, Hamin!** · **Lunch Time** · **Practice Room** ·
**My Room** · **Collection** (+ H-POINT exchange). Four languages: 한국어 · 中文 · 日本語 · English.
No accounts, no personal data — progress lives only in the browser (`localStorage['haminGamesSave']`).

## Open it locally
- Double-click `index.html` — everything works except Photo Booth PNG export (browser file:// rule).
- Full test: `python3 -m http.server 8765` in this folder → http://localhost:8765/

## Upload to Neocities
`bash tools/build-deploy.sh` → upload the contents of `neocities-deploy/`. Details: **NEOCITIES_DEPLOY.md**.
Upload: the 9 `.html` pages, `css/`, `js/`, `data/`, `assets/`.
Never upload: `research/` (private reference photos), `art-source/`, `tools/`, `docs/`, `.claude/`.

## Architecture
```
index.html  dress-up.html  photo-booth.html  run-hamin.html  lunch-time.html
practice-room.html  my-room.html  collection.html  not_found.html   ← one page per game
css/   reset · base (design tokens + retro UI kit) · games (game shell) · responsive · <page>.css
js/    save.js     versioned save + migrations + export/import/reset
       i18n.js     HG.t(), language detection, data-i18n DOM binding
       audio.js    synthesized SFX + original chiptune BGM (Web Audio, no files)
       unlocks.js  H-POINT, central rules engine, achievements, collection %
       main.js     header/nav/footer, popups, modals, settings, game shell, easter eggs
       look.js     renders the player's Dress Up outfit anywhere (HG.look)
       <page>.js   each game
data/  catalogs (wardrobe, stickers/frames/poses/backgrounds, room-items, collectibles,
       achievements, games), unlock-rules.js, songs.js, translations*.js
assets/ character · clothes · backgrounds · photobooth · stickers · food · runner · rhythm · room · collection · ui
```
Classic scripts in IIFEs on `window.HG`; relative URLs only; no frameworks, modules or network calls.
The binding engineering contract is **docs/CONTRACT.md** (APIs, save schema, stat keys, script order).

Cross-game design: games only *report* scores/stats/flags through `HG.unlocks.finishGame / track /
secret`. `data/unlock-rules.js` decides what unlocks (e.g. Lunch ≥1500 → strawberry stickers,
Run 1000 m → sporty sneakers, Practice S rank → dance pose, Photo Booth → room photo board,
Collection 25 % → starry background).

## How to…
**Add a game** — copy a game page (e.g. `lunch-time.html`), keep the script order from CONTRACT §2,
mount `HG.ui.mountGameShell`, add `data/translations-<page>.js`, add an entry in `data/games.js`,
report results with `HG.unlocks.finishGame('<id>', {score, stats, flags})`.

**Add translations** — every string exists in `en`, `ko`, `zh-CN`, `ja` inside
`HG.addStrings({...})`. Run `node tools/check-i18n.js` (must be 0 errors).

**Add clothes** — add the 1200×1600 layer + 200×200 thumb (ASSET_GUIDE.md §2), an entry in
`data/wardrobe.js` (slot, tags, stats, unlock), and `wardrobe.<id>.name` in `data/translations-wardrobe.js`.

**Add achievements** — entry in `data/achievements.js` (`when` uses the rule condition language) +
`achievement.<id>.name/desc` in `data/translations-items.js`.

**Add collectibles / unlock conditions** — memory card in `data/collectibles.js` + art in
`assets/collection/`, then a rule in `data/unlock-rules.js`: `{id, when:{stat|best|flag|memories|collectionPct|all|any}, grant:[{kind,id}]}`.

## QA tools
`node tools/check-site.js` (missing assets / links / absolute URLs) · `node tools/check-i18n.js` ·
`node tools/smoke-core.js` (save/unlock engine tests) · `?debug=1` exposes `HG.debug` in the console.

## Docs
ASSET_GUIDE.md · NEOCITIES_DEPLOY.md · research/HAMIN_VISUAL_BIBLE.md · research/HAMIN_GENERATION_BIBLE.md ·
research/HAMIN_WARDROBE_MAP.md · research/REFERENCE_MANIFEST.md · research/GENERATION_LOG.md

All character art is original fan illustration generated with Seedream 4.5 (Higgsfield) from the
generation bible; no official photos, logos or SM music are used in the site.

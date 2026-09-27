# HAMIN GAMES — Engineering Contract (internal)

This is the binding contract every page/game in HAMIN GAMES follows. It exists so
several people (or agents) can build pages in parallel without stepping on each
other. If something here conflicts with code, the code in `js/` wins — but update
this file.

## 0. Hard constraints

- Static site for **Neocities**. HTML5 + CSS3 + vanilla JS + Canvas + optional SVG.
  No frameworks, no bundler, no Node at runtime, no backend, no network APIs.
- **Classic scripts only** (`<script src>`, no `type="module"`, no `fetch()` of local
  JSON). Everything must also work when `index.html` is double-clicked (file://),
  except canvas PNG export (browsers taint canvases on file://; works on Neocities /
  any http server). Data lives in `data/*.js` files that register into `HG.data`.
- **Relative URLs only** (`css/base.css`, `assets/…`, `dress-up.html`). Never a
  leading `/`, never `localhost`.
- **No accounts, no personal data.** No login, email, username, nickname fields.
  Progress is only `localStorage['haminGamesSave']`.
- **No real money**: no purchases, lootboxes, gambling/random paid rewards. H-POINT
  is earned by playing and spent only on cosmetics at fixed prices.
- Every visible string comes from translations (`HG.t(key)`), in exactly four
  languages: `ko`, `zh-CN`, `ja`, `en` (fallback `en`). The brand "HAMIN GAMES"
  and the name "Hamin" are not translated (Korean UI may write 하민 in prose).
- Fan-made disclaimer visible in the footer of every page. No SM Entertainment
  logos, no official photos, no SM music.
- Respect `prefers-reduced-motion` and the in-game Reduced Motion setting.
- Keep pages light: each page loads only its own game script/CSS/assets.

## 1. File structure

```
index.html            portal home (NEW GAME / HOT GAME / TODAY'S HAMIN / …)
dress-up.html         Hamin Dress Up
lunch-time.html       Hamin's Lunch Time
photo-booth.html      Hamin Photo Booth
run-hamin.html        Run, Hamin!
practice-room.html    Hamin Practice Room
my-room.html          Hamin's Room
collection.html       Collection album (+ H-POINT exchange)
not_found.html        Neocities 404 page
css/  reset.css base.css portal.css games.css responsive.css + one css per page
js/   save.js i18n.js audio.js unlocks.js main.js + one js per page
data/ translations.js (common strings) + translations-<page>.js (page strings)
      catalog.js (shared helpers) wardrobe.js achievements.js collectibles.js
      room-items.js stickers.js unlock-rules.js games.js
assets/ character/ clothes/ food/ runner/ rhythm/ room/ photobooth/ stickers/
        backgrounds/ ui/ collection/
```
Not deployed: `research/`, `art-source/`, `tools/`, `docs/`, `neocities-deploy/`.

## 2. Page template & script order

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>HAMIN GAMES ★</title>
  <meta name="description" content="Fan-made retro Hamin mini-game portal (unofficial, non-commercial)">
  <link rel="icon" href="assets/ui/favicon.png">
  <link rel="stylesheet" href="css/reset.css">
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/games.css">      <!-- game pages only -->
  <link rel="stylesheet" href="css/dress-up.css">   <!-- the page's own css -->
  <link rel="stylesheet" href="css/responsive.css">
</head>
<body data-page="dress-up">
  <div id="hg-header"></div>
  <main id="hg-main" class="hg-wrap"> …page markup… </main>
  <div id="hg-footer"></div>
  <script src="data/translations.js"></script>
  <script src="data/translations-items.js"></script>
  <script src="data/translations-wardrobe.js"></script>
  <script src="data/translations-dress-up.js"></script>
  <script src="data/catalog.js"></script>
  <script src="data/games.js"></script>
  <script src="data/wardrobe.js"></script>
  <script src="data/stickers.js"></script>
  <script src="data/room-items.js"></script>
  <script src="data/collectibles.js"></script>
  <script src="data/achievements.js"></script>
  <script src="data/unlock-rules.js"></script>
  <script src="js/save.js"></script>
  <script src="js/i18n.js"></script>
  <script src="js/audio.js"></script>
  <script src="js/unlocks.js"></script>
  <script src="js/main.js"></script>
  <script src="js/look.js"></script>      <!-- pages that show Hamin's outfit -->
  <script src="js/dress-up.js"></script>
</body>
</html>
```
All data files are loaded on every page (they are small metadata) because unlock
popups and the collection % can reference any catalog.

`main.js` builds header/nav/footer/popups on `DOMContentLoaded`, then fires
`document.dispatchEvent(new CustomEvent('hg:ready'))`. Page scripts start in a
`HG.onReady(fn)` callback (runs immediately if already ready).

## 3. Global namespace `window.HG`

All code lives in IIFEs that attach to `window.HG`. No other globals.

### 3.1 `HG.data` (registered by data files)
- `HG.data.games` — array, portal game registry (see §6.1)
- `HG.data.wardrobe` — `{ slots: [...], items: [...] }` (§6.2)
- `HG.data.stickers`, `HG.data.frames`, `HG.data.poses`, `HG.data.backgrounds` (§6.3)
- `HG.data.roomItems` (§6.4)
- `HG.data.memories` (§6.5)
- `HG.data.achievements` (§6.6)
- `HG.data.unlockRules` (§7)
- `HG.catalog.get(kind, id)` / `HG.catalog.all(kind)` / `HG.catalog.kinds` — lookups.
  Kinds: `wardrobe`, `sticker`, `frame`, `pose`, `background`, `room`, `memory`, `achievement`.

### 3.2 `HG.save` (js/save.js)
```
HG.save.data                 // live save object (mutate only through helpers below)
HG.save.get('a.b.c', def)    // path getter
HG.save.set('a.b.c', value)  // path setter + persist + emit 'hg:save'
HG.save.update(fn)           // fn(data) mutates; then persist + emit
HG.save.persist()            // writes localStorage (debounced 150ms; flush on pagehide)
HG.save.reset()              // wipes key, re-creates defaults (caller reloads page)
HG.save.exportJSON()         // returns pretty JSON string
HG.save.downloadExport()     // triggers "hamin-games-save-YYYYMMDD.json" download
HG.save.importJSON(str)      // validate+migrate; returns {ok, error}
HG.save.VERSION, HG.save.KEY // 'haminGamesSave'
```
Storage failures (private mode, quota) must never crash pages: fall back to an
in-memory save and show a one-time small notice.

Save schema (version 1):
```js
{
  version: 1, createdAt: ISO, updatedAt: ISO,
  lang: null,                       // 'ko'|'zh-CN'|'ja'|'en'
  hpoint: 0, hpointEarned: 0,       // current / lifetime earned
  visitorNo: 1528,                  // decorative, random at first visit
  visitDays: [],                    // 'YYYY-MM-DD' strings (max 60 kept)
  settings: { music: 0.5, sfx: 0.7, muted: false, reducedMotion: 'auto', sparkles: true },
  unlocked: { wardrobe: [], sticker: [], frame: [], pose: [], background: [], room: [], memory: [] },
  achievements: {},                 // id -> ISO time
  rules: {},                        // unlock rule id -> ISO time (fired once)
  stats: {},                        // flat counters, e.g. 'lunch.rounds': 12 (§7.2)
  best: {},                         // gameKey -> best score (higher is better)
  flags: {},                        // 'secret.logoStars': true, 'lang.seen.ko': true …
  seen: {},                         // tutorials / NEW badges dismissed: id -> true
  dressUp: { outfit: {}, looks: [], challengeStars: {} },
  photoBooth: { transferLook: null, count: 0 },
  room: { layout: [] },             // [{uid, id, x, y, z, flip}]  x,y in 0..1 of room box
  practice: { ranks: {} }           // 'songId:difficulty' -> 'S'|'A'|'B'|'C'
}
```
Defaults are deep-merged into loaded data so new fields appear automatically.
Migrations: `MIGRATIONS[n]` upgrades version n-1 → n (a save with no/0 `version` is v0 and
goes through `MIGRATIONS[1]`). Unknown future version →
keep a backup copy under `haminGamesSave.backup` and start fresh.

### 3.3 `HG.i18n` / `HG.t` (js/i18n.js)
```
HG.addStrings({ en:{…}, ko:{…}, 'zh-CN':{…}, ja:{…} })   // deep-merge, any file
HG.t('nav.home')                  // current lang → en → key itself (console.warn once)
HG.t('run.distance', {m: 120})    // {m} placeholders
HG.i18n.lang                      // current
HG.i18n.set('ja')                 // saves, re-applies DOM, emits 'hg:lang'
HG.i18n.apply(root?)              // fills [data-i18n], [data-i18n-attr]
HG.i18n.itemName(kind, id)        // HG.t(`${kind}.${id}.name`)
```
DOM: `<span data-i18n="nav.home"></span>`; attributes:
`data-i18n-attr="aria-label:common.close;title:common.close"`.
First visit: `navigator.languages` → first match of ko / zh(-CN|-Hans|zh) / ja / en,
else `en`. `<html lang>` is updated (`zh-CN` → `zh-Hans`).
Key namespaces: `common.* nav.* footer.* settings.* popup.* home.* games.* collection.*`
`wardrobe.<id>.name`, `sticker.<id>.name`, `frame.<id>.name`, `pose.<id>.name`,
`background.<id>.name`, `room.<id>.name`, `memory.<id>.name|desc`,
`achievement.<id>.name|desc`, `slot.<slotId>`, `challenge.<id>.name|desc`,
and one namespace per page: `dressUp.* lunch.* photo.* run.* practice.* myRoom.*`.
Common UI strings live in `data/translations.js`; catalog names/descriptions
(items, memories, achievements, hints, categories) in `data/translations-items.js`;
page strings in `data/translations-<page>.js` (same 4-language object shape).
Both common files are loaded on every page.

### 3.4 `HG.audio` (js/audio.js) — Web Audio, no files required
```
HG.audio.sfx(name)   // 'click','hover','sparkle','unlock','popup','score','success',
                     // 'error','jump','coin','powerup','perfect','good','miss',
                     // 'whoosh','bark','pop','shutter','tick','countdown'
HG.audio.bgm(name)   // 'portal','dressup','lunch','run','practiceMenu','room','collection'
HG.audio.stopBgm()
HG.audio.ctx         // AudioContext (lazy, unlocked on first pointer/key)
HG.audio.musicBus / HG.audio.sfxBus   // GainNodes for game-owned sources
HG.audio.setVolumes() // re-read settings
```
All sounds are synthesized (original chiptune motifs). Muted → nothing plays.
BGM starts only after a user gesture.

### 3.5 `HG.unlocks` (js/unlocks.js) — rewards + rules engine
```
HG.unlocks.finishGame(gameKey, {score, stats, flags, bestKey})
   // +50 H-POINT for finishing; if score > save.best[bestKey||gameKey]: store,
   // +100 and 'NEW RECORD' popup. Applies stats (see below), sets flags,
   // bumps 'games.played' and `games.played.${gameKey}`, evaluates rules and
   // achievements. Returns {earned, newBest, prevBest, unlocked:[…]}.
HG.unlocks.track({inc:{…}, max:{…}, set:{…}, flags:[…]})  // mid-game progress
HG.unlocks.secret(id)        // once per id: flag 'secret.<id>', +200, popup, evaluate
HG.unlocks.earn(n, reasonKey)
HG.unlocks.spend(n) -> bool
HG.unlocks.buy(kind, id) -> {ok, reason}  // cosmetic exchange using item.cost
HG.unlocks.grant(kind, id, {silent}) -> bool (false if already owned)
HG.unlocks.has(kind, id)     // owned? (items with unlock.type 'default' are always owned)
HG.unlocks.status(kind, id)  // {owned, cost?, hintKey?, locked}
HG.unlocks.evaluate()        // run rules + achievements; queue popups
HG.unlocks.collectionProgress({includeDefaults}) -> {owned, total, pct, byKind:{kind:{owned,total}}}
   // counts memory, wardrobe, pose, sticker, room, achievement; starter ('default')
   // items are excluded unless includeDefaults — the {collectionPct} rules use the default
```
`stats` argument shape: `{inc:{'lunch.rounds':3}, max:{'lunch.bestCombo':7}, set:{…}}`.
Popups are queued through `HG.ui.popup(...)` and shown one at a time.

### 3.6 `HG.ui` (js/main.js)
```
HG.onReady(fn)
HG.ui.popup({type:'achievement'|'unlock'|'hpoint'|'record'|'secret'|'memory', title, text, icon, kind, id})
HG.ui.toast(text)                        // small status line
HG.ui.modal({titleKey|title, body:Node|string, buttons:[{labelKey, primary, onClick}], onClose})
HG.ui.confirm({titleKey, textKey}) -> Promise<boolean>
HG.ui.mountGameShell(el, {game, titleKey, helpKey})  // top bar: ◀ back, title, H-POINT,
                                                     // ? help, ♪ sound, ⛶ fullscreen
HG.ui.itemIcon(kind, id) -> <img> with graceful fallback (see §8)
HG.ui.reducedMotion() -> bool            // setting 'on' | ('auto' && media query)
HG.ui.formatNum(n)
HG.ui.sparkleBurst(x, y)                 // decorative, skipped when reduced motion
```
Header (injected into #hg-header): logo `★ HAMIN GAMES ★`, nav
HOME(index) · GAME(index.html#games) · PHOTO(photo-booth) · COLLECTION · MY ROOM,
`LANGUAGE ♡ 한국어 | 中文 | 日本語 | EN`, H-POINT badge, settings ⚙, sound ♪.
Footer: disclaimer (fan-made · unofficial · non-commercial · not affiliated with SM
Entertainment), `BEST VIEWED WITH LOVE ♡`, tiny clock, visitor counter.
Mobile (<720px): compact header + fixed bottom tab bar (5 nav items, ≥44px targets).
Settings modal: language, music/sfx sliders, mute, reduced motion (auto/on/off),
cursor sparkles, EXPORT SAVE, IMPORT SAVE, RESET PROGRESS (confirm dialog).

## 4. Design tokens (css/base.css `:root`)

Never hard-code colors in page CSS; use tokens (add new tokens in base.css only).
```
--c-powder: #bfe3ff; --c-powder-deep: #7fbef0; --c-sky: #e8f5ff;
--c-pink: #ffc9de; --c-pink-deep: #ff8fb8; --c-blush: #fff0f6;
--c-cream: #fff8e7; --c-lavender: #e5dcff; --c-lavender-deep: #b9a6f2;
--c-mint: #cff5e4; --c-mint-deep: #7fd8b2; --c-cherry: #ff4f7b; --c-cherry-dark: #d42a59;
--c-silver: #e6e9f0; --c-silver-deep: #aab2c3; --c-ink: #4a3a55; --c-ink-soft: #7b6a86;
--c-white: #ffffff; --c-gold: #ffd76a; --c-focus: #3d7cff;
--bevel-light, --bevel-dark, --shadow-pop, --radius-s: 4px, --radius-m: 8px, --radius-l: 14px
--font-ui: "Dotum","돋움","Gulim","굴림","Apple SD Gothic Neo","Malgun Gothic",
           "PingFang SC","Microsoft YaHei","Hiragino Sans","Meiryo",Tahoma,Verdana,sans-serif;
--font-title: "Trebuchet MS","Arial Rounded MT Bold",var(--font-ui);
--fs-xs: 11px; --fs-s: 12px; --fs-m: 14px; --fs-l: 18px; --fs-xl: 26px;
--wrap: 1000px;
```
(The research palette in research/HAMIN_VISUAL_BIBLE.md may refine these values.)

Shared component classes (base.css): `.hg-window` (+`.hg-window__title` gradient
title bar with tiny ♡ ✕ decorations), `.hg-btn` (`--pink`, `--blue`, `--mint`,
`--big`), `.hg-badge--new` (blinking), `.hg-badge--hot`, `.hg-tabs`/`.hg-tab`,
`.hg-panel-header`, `.hg-ticker`, `.hg-hpoint`, `.hg-modal`, `.hg-tooltip`,
`.hg-sticker-btn`, `.hg-card` (game card), `.hg-grid`, `.hg-locked`,
`.hg-pixel-border`, `.hg-dots-bg`, `.hg-checker-bg`, `.hg-sr-only`.
Focus: every interactive element shows `outline: 3px solid var(--c-focus)` on
`:focus-visible`. Touch targets ≥ 44×44 px on touch layouts.

## 5. Game page shell

Every game page has `<section class="hg-gameshell" id="game">` mounted with
`HG.ui.mountGameShell`. Inside, the game owns `.hg-gameshell__stage`. Help text
opens in `HG.ui.modal`. Fullscreen uses the Fullscreen API on the shell element
(hide the button when unsupported, e.g. iOS Safari).

## 6. Catalog schemas (data/*.js)

### 6.1 games.js
```js
{ id:'dress-up', href:'dress-up.html', titleKey:'games.dressUp.title',
  descKey:'games.dressUp.desc', thumb:'assets/ui/thumbs/dress-up.webp',
  icon:'👗', badges:['new'], bestKey:null, bestFormat:null, comingSoon:false }
```
Order: dress-up, photo-booth, run-hamin, lunch-time, practice-room, my-room, then
3 `comingSoon:true` cards.

### 6.2 wardrobe.js
```js
HG.data.wardrobe = {
  canvas: { w: 1200, h: 1600 },
  // draw order bottom → top
  slots: ['background','body','shoes','bottom','top','shirt','knit','hoodie','outer',
          'head','accessory','bag','hat'],
  // UI categories (tabs) map to slots
  categories: [ {id:'hair', slot:'head'}, {id:'top', slot:'top'}, {id:'shirt', slot:'shirt'},
    {id:'knit', slot:'knit'}, {id:'hoodie', slot:'hoodie'}, {id:'jacket', slot:'outer'},
    {id:'bottom', slot:'bottom'}, {id:'shoes', slot:'shoes'}, {id:'accessory', slot:'accessory'},
    {id:'bag', slot:'bag'}, {id:'hat', slot:'hat'}, {id:'background', slot:'background'} ],
  items: [ {
    id:'knit-navy-vneck', slot:'knit', src:'assets/clothes/knit/knit-navy-vneck.webp',
    thumb:'assets/clothes/knit/thumbs/knit-navy-vneck.webp',
    tags:['preppy','soft','cozy'], rarity:'common'|'rare'|'special',
    stats:{cute:2, cool:2, cozy:4, stage:0}, group:'preppy',
    unlock:{type:'default'} | {type:'hpoint', cost:300} | {type:'rule', hintKey:'hint.runShoes'},
    optional: true   // slot may be empty (all except body/head/background)
  } ]
}
```
Heads: `slot:'head'` items are whole-head layers (hair + face) at the canonical
canvas: `assets/character/dressup/head-<style>-<expr>.webp`. Hair items list
`exprs:{neutral:src, smile:src, big:src}`; `src` = neutral. The body layer is
`assets/character/dressup/body.webp` (neck-down, wearing the plain base outfit:
white tee, slim grey joggers, white socks — never shown undressed).

### 6.3 stickers.js
```js
HG.data.stickers = [{id:'st-heart-pink', cat:'hearts', src:'assets/stickers/st-heart-pink.webp', unlock:{…}}]
  // cats: hearts, stars, flowers, ribbons, cds, music, smiley, food, sheep, pixel, sparkles, special
HG.data.frames = [{id:'fr-4cut-pink', type:'4cut'|'polaroid'|'photocard'|'square'|'webcam', color:'pink', unlock:{…}}]
HG.data.poses  = [{id:'pose-look', type:'look'}, {id:'pose-vsign', type:'image', src:'assets/photobooth/poses/pose-vsign.webp', unlock:{…}}]
HG.data.backgrounds = [{id:'bg-bedroom', src:'assets/backgrounds/bg-bedroom.webp', thumb:'…', use:['dressup','photo'], unlock:{…}},
                       {id:'bg-dots-pink', pattern:'dots', colors:['--c-blush','--c-pink'], use:['photo'], unlock:{…}}]
```

### 6.4 room-items.js
```js
{ id:'room-cd-player', cat:'desk'|'furniture'|'lighting'|'wall'|'cds'|'books'|'plants'|'plushies'|'frames'|'food'|'collectibles',
  src:'assets/room/items/room-cd-player.webp', w:0.14,  // width as fraction of room width
  zone:'floor'|'wall'|'any', interactive:'cdplayer'|'lamp'|'window'|'camera'|'photoboard'|null,
  unlock:{…} }
```

### 6.5 collectibles.js (memories)
```js
{ id:'mem-001', no:1, src:'assets/collection/mem-001.webp', unlock:{type:'rule'} , secret:false }
```
Names/descriptions: `memory.mem-001.name` etc. Locked cards show a silhouette + ???.

### 6.6 achievements.js
```js
{ id:'first-game', icon:'★', when:{stat:'games.played', gte:1}, reward:150, secret:false }
```

## 7. Unlock rules language (data/unlock-rules.js)

```js
HG.data.unlockRules = [
  { id:'lunch-champion', when:{best:'lunch-time', gte:1200},
    grant:[{kind:'sticker', id:'st-strawberry-milk'}, {kind:'memory', id:'mem-003'}] },
]
```
Conditions: `{stat:'k', gte:n}` · `{best:'gameKey', gte:n}` · `{flag:'k'}` ·
`{achievement:'id'}` · `{owned:'kind:id'}` · `{memories:n}` · `{collectionPct:n}` ·
`{all:[…]}` · `{any:[…]}`. Grants: `{kind, id}` or `{kind:'hpoint', amount}`.
Rules fire once (recorded in `save.rules`). Achievements are evaluated with the
same condition language and give `reward` H-POINT (default 150).

### 7.1 H-POINT economy
finish game +50 · new high score +100 · achievement +150 · secret +200 ·
extra per-game performance bonuses are allowed but modest (≤ +100 per play).
Cosmetic prices: common 100–300, rare 400–800, special 1000–1500.

### 7.2 Stat keys (use exactly these)
```
games.played, games.played.<gameKey>
dressup.looksSaved, dressup.challengesCleared, dressup.fiveStars, dressup.categoriesTried,
dressup.randomUsed, dressup.sentToPhoto
lunch.rounds, lunch.perfects, lunch.sheepSmiles, lunch.bestCombo, lunch.desserts
run.totalDistance, run.bestDistance, run.snacks, run.stars, run.caught, run.powerups
practice.clears, practice.maxCombo, practice.perfects, practice.rankS, practice.hardClears
photo.created, photo.stickersPlaced
room.placed, room.cdClicks, room.interactions
portal.langsTried, portal.days
hpoint.earned            (lifetime H-POINT; kept by unlocks.js, conditions also read save.hpointEarned)
```
Flags: `secret.<id>`, `practice.rank.S`, `dressup.challenge.<id>` (cleared),
`photo.exported`, `run.stage.<id>` (reached).

## 8. Assets

- Paths: `assets/<area>/…`, lowercase kebab-case, `.webp` for illustrations
  (alpha where needed), `.png` only when alpha edges need it.
- Canonical character canvas: **1200×1600**, all dress-up layers share it exactly.
- Every `<img>`/canvas image load must tolerate a missing file: `HG.ui.itemIcon`
  and page code show a soft fallback (tinted rounded box with the item's emoji /
  first letter) and log once. The site must still be fully playable.
- `alt` text comes from translations (item names) or `alt=""` for decoration.
- Lazy: `loading="lazy"` for grids; game scripts preload only their own assets.

## 9. Accessibility & motion

Keyboard: every control reachable; games document keys in Help. Visible focus.
`aria-live="polite"` region for score/unlock announcements.
Reduced motion: disable cursor sparkles, blinking, marquee/ticker scrolling
(show static), falling stars, screen shake, and large parallax motion.

## 10. Debug

`?debug=1` exposes `HG.debug = { give(n), grantAll(), unlockAll(kind), resetSeen() }`
in the console only; no visible UI.

## 11. Shared look renderer (js/look.js)

`HG.look` renders the player's Dress Up outfit anywhere (Dress Up, Photo Booth, My Room, Lunch Time
reactions, portal). See the header comment in js/look.js. Outfit objects live in
`save.dressUp.outfit`; `save.photoBooth.transferLook` holds a look sent from Dress Up to the booth.
Expressions: neutral, smile, big for every hairstyle; the default hairstyle (hair-era-b) additionally
has sheep, surprised, focused, wink, pout, eating (others fall back automatically).
Wardrobe item names live in `data/translations-wardrobe.js` (`wardrobe.<id>.name`), loaded on every page.

/* HAMIN GAMES — js/dress-up.js
   HAMIN DRESS UP (dress-up.html) — the flagship game.

   Layout: closet drawers (category tabs + FACE) · MIRROR stage · item grid · action strip
   (a sticky bottom bar on phones, plus a mini mirror while the stage is scrolled away).

   The stage is a 3:4 box of stacked <img> layers in HG.data.wardrobe.slots order
   (HG.look.layers → srcs); only layers whose src changed are touched, and a new src is
   swapped in only after HG.look.loadImage() has it, so nothing flickers. Missing art
   degrades: head → neutral face of the same hair, body → placeholder, bg → dots.

   Modes
     FREE DRESS-UP   — click to wear, click again to take off (optional slots).
     STYLE CHALLENGE — pick one of HG.data.wardrobe.challenges, dress, press DONE ♡.

   Challenge scoring (see the comment in data/wardrobe.js)
     item      = 2 × target tags + 1 × bonus tags + item.stats[keyStat]
     outfit    = hair + bottom + shoes + accessory + bag + hat + the best UPPER_MAX (3) upper
                 layers (top / shirt / knit / hoodie / jacket — piling on more adds nothing)
                 + BG_BONUS when the suggested background is used
     reference = best reachable outfit score using ALL catalog items (same rules), so the
                 bar does not move when the player owns more; ★5 needs good picks.
     stars     = score / reference ≥ .85 ★5 · ≥ .70 ★4 · ≥ .55 ★3 · ≥ .35 ★2 · else ★1
                 a missing must-have (challenge.require) caps the result at ★2; ★3+ clears.
     With starter + ≤300 H-POINT items ★5 is reachable in 5 of the 7 challenges
     (OFF-DUTY and TRIP DAY even with starter items only).

   Rewards — only through HG.unlocks with the CONTRACT §7.2 keys:
     DONE ♡      finishGame('dress-up', {score: stars, bestKey: 'dressup.stars',
                   stats: {inc: {'dressup.challengesCleared': firstClear ? 1 : 0,
                                 'dressup.fiveStars': stars === 5 ? 1 : 0}},
                   flags: stars >= 3 ? ['dressup.challenge.<id>'] : []})
                 (re-submitting the very same look for the same challenge shows the result
                 again without paying out, so DONE can't be farmed)
     SAVE LOOK   first reward of the page visit → finishGame('dress-up', {score: 0, …});
                 afterwards track({inc: {'dressup.looksSaved': 1}})
     RANDOM      track dressup.randomUsed · PHOTO BOOTH ♡ track dressup.sentToPhoto
     closet      every category equipped once in a session → secret('closet'),
                 max dressup.categoriesTried
   Best stars per challenge: save.dressUp.challengeStars[id]. Saved looks:
   save.dressUp.looks (max 12, each with a ≤120×160 JPEG thumbnail).

   Outfits always carry every optional slot explicitly (null = empty): HG.look.normalize()
   fills a MISSING key from defaultOutfit, so an absent key would put the default item back. */
(function (HG, win, doc) {
  'use strict';

  /* ═══════════ 0. Constants ═══════════ */
  var UPPER = ['top', 'shirt', 'knit', 'hoodie', 'outer'];
  var UPPER_MAX = 3;
  var SCORE_SLOTS = ['head', 'top', 'shirt', 'knit', 'hoodie', 'outer', 'bottom', 'shoes', 'accessory', 'bag', 'hat'];
  var SIG_KEYS = ['head', 'expr', 'background'].concat(SCORE_SLOTS.slice(1));
  var STATS = ['cute', 'cool', 'cozy', 'stage'];
  var BASE_EXPRS = ['neutral', 'smile', 'big'];
  var EXTRA_EXPRS = ['sheep', 'surprised', 'wink', 'focused', 'pout', 'eating'];
  var EXPR_NEAR = { sheep: 'big', wink: 'smile', eating: 'smile', surprised: 'neutral', focused: 'neutral', pout: 'neutral' };
  var EXTRA_HAIR = 'hair-era-b';
  var BG_BONUS = 3;
  var STAR_AT = [0.85, 0.7, 0.55, 0.35];          // ratio needed for ★5, ★4, ★3, ★2
  var LOOKS_MAX = 12;
  var THUMB_W = 120, THUMB_H = 160;               // saved-look thumbnails stay tiny (localStorage)
  var SAVE_DELAY = 400;
  var TRIED_KEY = 'hg.dressup.tried';
  var SEEN_PREFIX = 'dressup.';
  var TAGS = ['cute', 'cool', 'cozy', 'preppy', 'casual', 'stage', 'sporty', 'soft'];

  var CAT_ICON = { hair: '💇', face: '😊', top: '👕', shirt: '👔', knit: '🧶', hoodie: '👚', jacket: '🧥',
    bottom: '👖', shoes: '👟', accessory: '🎀', bag: '👜', hat: '🧢', background: '🌈' };
  var EXPR_ICON = { neutral: '🙂', smile: '😊', big: '😆', sheep: '🐑', surprised: '😮', wink: '😉', focused: '😤', pout: '😗', eating: '😋' };
  var BUBBLES = ['♡', '♪', '✌', '!?', '☆', '♡♡'];
  // crops (1200×1600 canvas units) used when a thumbnail is missing: a square around the layer
  var FACE_CROP = { x: 470, y: 60, w: 270, h: 270 };
  var SLOT_CROP = {
    head: { x: 430, y: 30, w: 340, h: 340 }, hat: { x: 430, y: 20, w: 340, h: 340 },
    top: { x: 330, y: 250, w: 540, h: 540 }, shirt: { x: 330, y: 250, w: 540, h: 540 },
    knit: { x: 330, y: 250, w: 540, h: 540 }, hoodie: { x: 330, y: 250, w: 540, h: 540 },
    outer: { x: 300, y: 250, w: 600, h: 600 }, bottom: { x: 225, y: 640, w: 760, h: 760 },
    shoes: { x: 330, y: 1150, w: 540, h: 540 }, accessory: { x: 330, y: 190, w: 540, h: 540 },
    bag: { x: 300, y: 280, w: 620, h: 620 }
  };

  /* ═══════════ 1. Small helpers ═══════════ */
  var hasOwn = Object.prototype.hasOwnProperty;
  function t(k, p) { return HG.t ? HG.t(k, p) : String(k); }
  function sfx(n, o) { try { if (HG.audio) HG.audio.sfx(n, o); } catch (e) { /* sound never breaks the game */ } }
  function $(id) { return doc.getElementById(id); }
  function h(tag, props, kids) { return HG.ui.el(tag, props, kids); }
  function sd() { return (HG.save && HG.save.data) || {}; }
  function num(v) { v = Number(v); return isFinite(v) ? v : 0; }
  function reduced() { return !!(HG.ui && HG.ui.reducedMotion && HG.ui.reducedMotion()); }
  function fmt(n) { return HG.ui && HG.ui.formatNum ? HG.ui.formatNum(n) : String(n); }
  function toast(s) { if (HG.ui && HG.ui.toast) HG.ui.toast(s); }
  function announce(s) { if (HG.ui && HG.ui.announce) HG.ui.announce(s); }
  function clear(el) { while (el && el.firstChild) el.removeChild(el.firstChild); }
  function copy(o) { var r = {}; if (o) for (var k in o) if (hasOwn.call(o, k)) r[k] = o[k]; return r; }
  function pick(a) { return a && a.length ? a[Math.floor(Math.random() * a.length)] : null; }
  function hp() { return num(sd().hpoint); }
  function flag(k) { var f = sd().flags; return !!(f && f[k]); }
  function stat(k) { var s = sd().stats; return s ? num(s[k]) : 0; }
  function seen(k) { var s = sd().seen; return !!(s && s[k]); }
  function mq(q) { return win.matchMedia ? win.matchMedia(q) : { matches: false }; }
  function sparkleAt(el, n) {
    if (!el || !HG.ui || !HG.ui.sparkleBurst) return;
    var r = el.getBoundingClientRect();
    HG.ui.sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, n || 8);
  }
  function replay(el, cls) {
    if (!el || reduced()) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }
  function dayNo() { var d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function dateStr(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '.' + pad2(d.getMonth() + 1) + '.' + pad2(d.getDate());
  }

  /* ═══════════ 2. Catalog ═══════════ */
  var W = null, CATS = [], BEST = {}, STAT_MAX = {};
  var itemIndex = {};

  function item(id) { return (id && itemIndex[id]) || null; }
  function bgDef(id) { return HG.catalog ? HG.catalog.get('background', id) : null; }
  function owned(kind, id) { return HG.unlocks ? HG.unlocks.has(kind, id) : true; }
  function status(kind, id) { return HG.unlocks ? HG.unlocks.status(kind, id) : { owned: true, locked: false, type: 'default' }; }
  function nameOf(kind, id) { return HG.i18n ? HG.i18n.itemName(kind, id) : String(id); }
  function isOptional(slot) { return (W.optional || []).indexOf(slot) >= 0; }
  function isUpper(slot) { return UPPER.indexOf(slot) >= 0; }
  function dressBgs() {
    return ((HG.data && HG.data.backgrounds) || []).filter(function (b) { return b && b.use && b.use.indexOf('dressup') >= 0; });
  }
  function isDressBg(id) { return dressBgs().some(function (b) { return b.id === id; }); }
  function challenge(id) {
    var list = W.challenges || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function catDef(id) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i];
    return CATS[0];
  }
  function catItems(cat) {
    if (cat.id === 'background') return dressBgs();
    if (cat.id === 'face' || !cat.slot) return [];
    return W.items.filter(function (it) { return it.slot === cat.slot; });
  }
  function kindOf(cat) { return cat.id === 'background' ? 'background' : 'wardrobe'; }
  function catLabel(cat) { return cat.id === 'face' ? t('dressUp.cats.face') : t('category.' + cat.id); }
  function catOfSlot(slot) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].slot === slot) return CATS[i];
    return null;
  }
  function hintText(st) { return t(st && st.hintKey ? st.hintKey : 'hint.default'); }
  function seenKey(kind, id) { return SEEN_PREFIX + kind + '.' + id; }
  function isNewItem(kind, it, st) {
    st = st || status(kind, it.id);
    return st.owned && st.type !== 'default' && !seen(seenKey(kind, it.id));
  }
  function markSeen(list) {
    var todo = (list || []).filter(function (x) { return !seen(seenKey(x.kind, x.id)); });
    if (!todo.length || !HG.save) return;
    HG.save.update(function (d) {
      if (!d.seen || typeof d.seen !== 'object') d.seen = {};
      todo.forEach(function (x) { d.seen[seenKey(x.kind, x.id)] = true; });
    });
  }
  function sortedItems(cat) {
    var kind = kindOf(cat);
    return catItems(cat).map(function (it, i) {
      var st = status(kind, it.id);
      var rank = st.owned ? 0 : (st.type === 'hpoint' ? 1 : 2);
      return { it: it, st: st, key: rank * 1e7 + (rank === 1 ? num(st.cost) * 100 : 0) + i };
    }).sort(function (a, b) { return a.key - b.key; });
  }

  /* ═══════════ 3. Scoring ═══════════ */
  function itemScore(it, ch) {
    var s = 0;
    (it.tags || []).forEach(function (tg) {
      if ((ch.target || []).indexOf(tg) >= 0) s += 2;
      else if ((ch.bonus || []).indexOf(tg) >= 0) s += 1;
    });
    return s + num(it.stats && it.stats[ch.keyStat]);
  }
  function statTotal(it) { var s = 0; STATS.forEach(function (k) { s += num(it.stats && it.stats[k]); }); return s; }

  // Best reachable total of valueFn over the whole catalog (upper layers capped at UPPER_MAX).
  function bestOf(valueFn) {
    var tot = 0, ups = [];
    SCORE_SLOTS.forEach(function (slot) {
      var m = 0;
      W.items.forEach(function (it) { if (it.slot === slot) m = Math.max(m, valueFn(it)); });
      if (isUpper(slot)) ups.push(m); else tot += m;
    });
    ups.sort(function (a, b) { return b - a; });
    for (var i = 0; i < UPPER_MAX && i < ups.length; i++) tot += ups[i];
    return tot;
  }
  function precompute() {
    (W.challenges || []).forEach(function (ch) {
      BEST[ch.id] = bestOf(function (it) { return itemScore(it, ch); }) + (ch.bg ? BG_BONUS : 0);
    });
    STATS.forEach(function (k) { STAT_MAX[k] = Math.max(1, bestOf(function (it) { return num(it.stats && it.stats[k]); })); });
  }

  // Items that count: every non-upper slot + the best UPPER_MAX upper layers (ranked by rankFn).
  function counted(o, rankFn) {
    var list = [], ups = [];
    SCORE_SLOTS.forEach(function (slot) {
      var it = item(o[slot]);
      if (!it || it.slot !== slot) return;
      (isUpper(slot) ? ups : list).push(it);
    });
    ups.sort(function (a, b) { return rankFn(b) - rankFn(a); });
    return list.concat(ups.slice(0, UPPER_MAX));
  }
  function outfitStats(o, ch) {
    var items = counted(o, ch ? function (it) { return itemScore(it, ch); } : statTotal);
    var out = {};
    STATS.forEach(function (k) {
      var s = 0;
      items.forEach(function (it) { s += num(it.stats && it.stats[k]); });
      out[k] = Math.max(0, Math.min(100, Math.round(s / STAT_MAX[k] * 100)));
    });
    return out;
  }

  /* Must-haves: text + live test */
  function slotNames(slots) { return slots.map(function (s) { return t('slot.' + s); }).join(t('dressUp.req.sep')); }
  function reqText(r) {
    if (r.anyOf) {
      return r.orItem ? t('dressUp.req.anyOfOr', { slots: slotNames(r.anyOf), item: nameOf('wardrobe', r.orItem) })
                      : t('dressUp.req.anyOf', { slots: slotNames(r.anyOf) });
    }
    if (r.anyOfTagged) return t('dressUp.req.tagged', { slots: slotNames(r.anyOfTagged), tag: t('tag.' + r.tag) });
    if (r.slot) {
      return r.tag ? t('dressUp.req.tagged', { slots: slotNames([r.slot]), tag: t('tag.' + r.tag) })
                   : t('dressUp.req.anyOf', { slots: slotNames([r.slot]) });
    }
    return '';
  }
  function reqTest(r, o) {
    function wears(slot, tag) {
      var it = item(o[slot]);
      if (!it) return false;
      return !tag || (it.tags || []).indexOf(tag) >= 0;
    }
    function wearsItem(id) { return SCORE_SLOTS.some(function (s) { return o[s] === id; }); }
    if (r.anyOf) return r.anyOf.some(function (s) { return wears(s); }) || (r.orItem ? wearsItem(r.orItem) : false);
    if (r.anyOfTagged) return r.anyOfTagged.some(function (s) { return wears(s, r.tag); });
    if (r.slot) return wears(r.slot, r.tag);
    return true;
  }
  function reqStatus(o, ch) {
    return (ch.require || []).map(function (r) { return { text: reqText(r), ok: reqTest(r, o) }; });
  }
  function matchesTheme(it, ch) {
    return (it.tags || []).some(function (tg) { return (ch.target || []).indexOf(tg) >= 0; });
  }

  function judge(o, ch) {
    var items = counted(o, function (it) { return itemScore(it, ch); });
    var score = 0;
    items.forEach(function (it) { score += itemScore(it, ch); });
    if (ch.bg && o.background === ch.bg) score += BG_BONUS;
    var best = BEST[ch.id] || 1;
    var ratio = score / best;
    var stars = 1;
    for (var i = 0; i < STAR_AT.length; i++) if (ratio >= STAR_AT[i]) { stars = 5 - i; break; }
    var req = reqStatus(o, ch);
    var reqOk = req.every(function (q) { return q.ok; });
    if (!reqOk) stars = Math.min(stars, 2);
    return { score: score, best: best, ratio: ratio, stars: stars, req: req, reqOk: reqOk,
             match: Math.min(100, Math.round(ratio * 100)), stats: outfitStats(o, ch) };
  }

  /* ═══════════ 4. Outfit model ═══════════ */
  var S = {
    outfit: null, cat: 'top', mode: 'free', ch: null,
    preview: null, tempExpr: null, zoom: false,
    played: false, submitted: {}, tried: [],
    extraOk: [], extraProbed: false,
    view: null, miniView: null,
    saveTimer: null, pokeTimer: null, bubbleTimer: null, shuffleTimer: null, refreshTimer: null,
    shuffling: false, shownNew: []
  };
  var el = {};

  function fullOutfit(o) {
    var n = HG.look ? HG.look.normalize(o || {}) : copy(o || W.defaultOutfit);
    (W.optional || []).forEach(function (slot) { if (n[slot] === undefined) n[slot] = null; });
    return n;
  }

  /* Keep only what the player owns (old saves, imported saves, looks saved before a reset). */
  function sanitize(o) {
    var n = fullOutfit(o);
    var def = W.defaultOutfit || {};
    SCORE_SLOTS.forEach(function (slot) {
      var id = n[slot];
      if (id == null) return;
      if (!owned('wardrobe', id)) n[slot] = slot === 'head' ? (def.head || EXTRA_HAIR) : null;
    });
    if (!n.head || !item(n.head)) n.head = def.head || EXTRA_HAIR;
    if (!n.background || !isDressBg(n.background) || !owned('background', n.background)) n.background = def.background || 'bg-bedroom';
    if (BASE_EXPRS.concat(EXTRA_EXPRS).indexOf(n.expr) < 0) n.expr = 'neutral';
    if (n.head !== EXTRA_HAIR && BASE_EXPRS.indexOf(n.expr) < 0) n.expr = EXPR_NEAR[n.expr] || 'neutral';
    return n;
  }

  function sig(o) { return SIG_KEYS.map(function (k) { return (o && o[k]) || '-'; }).join('|'); }

  function change(patch, opts) {
    var o = copy(S.outfit);
    for (var k in patch) if (hasOwn.call(patch, k)) o[k] = patch[k];
    setOutfit(o, opts);
  }

  function setOutfit(o, opts) {
    var prevHead = S.outfit && S.outfit.head;
    S.outfit = fullOutfit(o);
    renderStage();
    renderMeter();
    updateBriefLive();
    updateCatMarks();
    if (S.cat === 'face' && prevHead !== S.outfit.head) renderGrid();
    else refreshTiles();
    if (!(opts && opts.noSave)) scheduleSave();
  }

  function scheduleSave() {
    clearTimeout(S.saveTimer);
    S.saveTimer = setTimeout(saveNow, SAVE_DELAY);
  }
  function saveNow() {
    clearTimeout(S.saveTimer);
    S.saveTimer = null;
    if (HG.save && S.outfit) HG.save.set('dressUp.outfit', copy(S.outfit));
  }
  function flushAll() {
    if (S.saveTimer) saveNow();
    if (HG.save && HG.save.flush) HG.save.flush();
  }

  /* Categories tried this session (sessionStorage; in-memory when blocked). */
  function loadTried() {
    try {
      var raw = win.sessionStorage.getItem(TRIED_KEY);
      var a = raw ? JSON.parse(raw) : [];
      return Array.isArray(a) ? a.filter(function (x) { return typeof x === 'string'; }) : [];
    } catch (e) { return []; }
  }
  function markTried(catId) {
    if (S.tried.indexOf(catId) >= 0) return;
    S.tried.push(catId);
    try { win.sessionStorage.setItem(TRIED_KEY, JSON.stringify(S.tried)); } catch (e) { /* ignore */ }
    var ids = (W.categories || []).map(function (c) { return c.id; });
    var n = S.tried.filter(function (c) { return ids.indexOf(c) >= 0; }).length;
    if (!HG.unlocks) return;
    if (n > stat('dressup.categoriesTried')) HG.unlocks.track({ max: { 'dressup.categoriesTried': n } });
    if (ids.length && n >= ids.length) HG.unlocks.secret('closet');
  }

  /* ═══════════ 5. Stage (stacked <img> layers) ═══════════ */
  function loadImg(src) {
    if (HG.look && HG.look.loadImage) return HG.look.loadImage(src).then(function (img) { return !!img; });
    return new Promise(function (res) {
      var i = new Image();
      i.onload = function () { res(true); };
      i.onerror = function () { res(false); };
      i.src = src;
    });
  }

  function makeView(root, figHost) {
    var v = { root: root, imgs: {}, want: {} };
    W.slots.forEach(function (slot) {
      var img = doc.createElement('img');
      img.className = 'du-layer du-layer--' + slot;
      img.alt = '';
      img.decoding = 'sync';          // paint all layers together (no half-dressed frames)
      img.draggable = false;
      img.hidden = true;
      if (slot === 'background') root.insertBefore(img, root.firstChild);
      else figHost.appendChild(img);
      v.imgs[slot] = img;
    });
    return v;
  }

  function layerMap(o) {
    var map = {};
    var list = HG.look ? HG.look.layers(o, { background: true }) : [];
    list.forEach(function (l) {
      if (l.bg) { var b = bgDef(l.id); map.background = b && b.src ? b.src : null; }
      else map[l.slot] = l.src || null;
    });
    return map;
  }

  function flagMissing(v, slot, on) {
    if (slot === 'body') v.root.classList.toggle('is-body-missing', on);
    if (slot === 'background') v.root.classList.toggle('is-bg-missing', on);
  }

  function setLayer(v, slot, src, o) {
    var img = v.imgs[slot];
    if (!img) return;
    if (!src) {
      v.want[slot] = null;
      img.hidden = true;
      flagMissing(v, slot, false);
      return;
    }
    if (v.want[slot] === src) return;
    v.want[slot] = src;
    loadImg(src).then(function (ok) {
      if (v.want[slot] !== src) return;
      if (ok) {
        if (img.getAttribute('src') !== src) img.src = src;
        img.hidden = false;
        flagMissing(v, slot, false);
        return;
      }
      if (slot === 'head') {                   // missing expression → neutral face of the same hair
        var hi = item(o.head);
        var alt = hi ? ((hi.exprs && hi.exprs.neutral) || hi.src) : null;
        if (alt && alt !== src) { v.want[slot] = null; setLayer(v, slot, alt, o); return; }
      }
      img.hidden = true;
      flagMissing(v, slot, true);
    });
  }

  function paintView(v, o) {
    if (!v) return;
    var map = layerMap(o);
    W.slots.forEach(function (slot) { setLayer(v, slot, map[slot] || null, o); });
  }

  function viewOutfit() {
    var o = S.preview || S.outfit;
    if (S.tempExpr) { o = copy(o); o.expr = S.tempExpr; }
    return o;
  }

  function stageLabel(o) {
    var names = [];
    SCORE_SLOTS.forEach(function (slot) { if (o[slot] && item(o[slot])) names.push(nameOf('wardrobe', o[slot])); });
    var s = t('dressUp.mirror.label', { items: names.join(', ') });
    if (o.background) s += ' ' + t('dressUp.mirror.labelBg', { bg: nameOf('background', o.background) });
    return s;
  }

  function renderStage() {
    var o = viewOutfit();
    paintView(S.view, o);
    paintView(S.miniView, o);
    el.view.setAttribute('aria-label', stageLabel(S.outfit));
  }

  function renderDecor() {
    el.todayTag.textContent = '♡ ' + t('tag.' + TAGS[dayNo() % TAGS.length]);
    var d = new Date();
    el.datestamp.textContent = '’' + String(d.getFullYear()).slice(2) + ' ' + pad2(d.getMonth() + 1) + ' ' + pad2(d.getDate());
    if (S.mode === 'challenge' && S.ch) {
      el.ribbon.hidden = false;
      el.ribbon.textContent = '♡ ' + t('challenge.' + S.ch.id + '.name') + ' ♡';
    } else {
      el.ribbon.hidden = true;
      el.ribbon.textContent = '';
    }
    var zk = S.zoom ? 'dressUp.mirror.zoomOut' : 'dressUp.mirror.zoomIn';
    el.zoom.setAttribute('data-i18n-attr', 'aria-label:' + zk + ';title:' + zk);
    el.zoom.setAttribute('aria-label', t(zk));
    el.zoom.title = t(zk);
  }

  /* Poke Hamin: a quick expression + bubble (never saved). */
  function poke(e) {
    if (S.preview || S.shuffling) return;
    var choices = ['smile', 'big'];
    if (S.outfit.head === EXTRA_HAIR) {
      S.extraOk.forEach(function (x) { if (['wink', 'sheep', 'surprised'].indexOf(x) >= 0) choices.push(x); });
    }
    choices = choices.filter(function (x) { return x !== S.outfit.expr; });
    S.tempExpr = pick(choices) || 'smile';
    renderStage();
    sfx('pop', { rate: 1.15 + Math.random() * 0.3 });
    replay(el.figure, 'is-hop');
    el.bubble.textContent = pick(BUBBLES);
    el.bubble.hidden = false;
    replay(el.bubble, 'is-pop');
    if (e && e.clientX && HG.ui.sparkleBurst) HG.ui.sparkleBurst(e.clientX, e.clientY, 6);
    else sparkleAt(el.view, 6);
    clearTimeout(S.pokeTimer);
    S.pokeTimer = setTimeout(function () {
      S.tempExpr = null;
      el.bubble.hidden = true;
      renderStage();
    }, 1300);
  }

  function probeExtras() {
    if (S.extraProbed || !HG.look) return;
    S.extraProbed = true;
    EXTRA_EXPRS.forEach(function (ex) {
      var src = HG.look.headSrc({ head: EXTRA_HAIR, expr: ex });
      loadImg(src).then(function (ok) { if (ok && S.extraOk.indexOf(ex) < 0) S.extraOk.push(ex); });
    });
  }

  /* ═══════════ 6. Style meter ═══════════ */
  var meterRows = {};
  function buildMeter() {
    clear(el.meter);
    STATS.forEach(function (k) {
      var fill = h('span', { class: 'hg-meter__fill du-meter__fill' });
      var val = h('span', { class: 'du-meter__val', 'aria-hidden': 'true' }, '0');
      var row = h('div', { class: 'du-meter__row du-meter__row--' + k, role: 'meter', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0' }, [
        h('span', { class: 'du-meter__label', 'aria-hidden': 'true' }, t('dressUp.meter.' + k)),
        h('span', { class: 'hg-meter du-meter__bar', 'aria-hidden': 'true' }, fill),
        val
      ]);
      meterRows[k] = { row: row, fill: fill, val: val, label: row.firstChild };
      el.meter.appendChild(row);
    });
  }
  function renderMeter() {
    var st = outfitStats(S.outfit, S.ch);
    STATS.forEach(function (k) {
      var r = meterRows[k];
      if (!r) return;
      var n = st[k];
      r.fill.style.setProperty('--pct', n + '%');
      r.val.textContent = String(n);
      r.label.textContent = t('dressUp.meter.' + k);
      r.row.setAttribute('aria-valuenow', String(n));
      r.row.setAttribute('aria-label', t('dressUp.meter.' + k));
      r.row.classList.toggle('is-key', !!(S.ch && S.ch.keyStat === k));
    });
  }

  /* ═══════════ 7. Mode switch + brief ═══════════ */
  function challengeStars() {
    var du = sd().dressUp;
    return (du && du.challengeStars && typeof du.challengeStars === 'object') ? du.challengeStars : {};
  }
  function starRow(n, cls) {
    var box = h('span', { class: 'du-stars' + (cls ? ' ' + cls : '') }, [
      h('span', { class: 'hg-sr-only' }, t('dressUp.challenge.stars', { n: n }))
    ]);
    var vis = h('span', { 'aria-hidden': 'true' });
    for (var i = 0; i < 5; i++) vis.appendChild(h('span', { class: 'du-star' + (i < n ? ' is-on' : '') }, i < n ? '★' : '☆'));
    box.appendChild(vis);
    return box;
  }
  function tagChips(ch, withKey) {
    var box = h('span', { class: 'du-chips' });
    (ch.target || []).forEach(function (tg) { box.appendChild(h('span', { class: 'du-chip du-chip--target' }, '♡ ' + t('tag.' + tg))); });
    (ch.bonus || []).forEach(function (tg) { box.appendChild(h('span', { class: 'du-chip du-chip--bonus' }, '+ ' + t('tag.' + tg))); });
    if (withKey && ch.keyStat) box.appendChild(h('span', { class: 'du-chip du-chip--key' }, '★ ' + t('dressUp.meter.' + ch.keyStat)));
    return box;
  }

  function renderModes() {
    var chOn = S.mode === 'challenge';
    el.modeFree.classList.toggle('is-on', !chOn);
    el.modeFree.setAttribute('aria-pressed', String(!chOn));
    el.modeCh.classList.toggle('is-on', chOn);
    el.modeCh.setAttribute('aria-pressed', String(chOn));
    el.game.classList.toggle('is-challenge', chOn);
    el.done.hidden = !chOn;
  }

  var briefReq = [];
  function renderBrief() {
    clear(el.brief);
    briefReq = [];
    if (S.mode !== 'challenge' || !S.ch) {
      el.brief.className = 'du-brief du-brief--free';
      var anyClear = (W.challenges || []).some(function (c) { return flag('dressup.challenge.' + c.id); });
      el.brief.appendChild(h('p', { class: 'du-brief__lead' }, [
        h('b', { class: 'du-brief__name' }, t('dressUp.brief.freeTitle')), ' ',
        h('span', {}, t('dressUp.brief.free'))
      ]));
      el.brief.appendChild(h('p', { class: 'du-brief__tip' }, t(anyClear ? 'dressUp.brief.freeTip2' : 'dressUp.brief.freeTip')));
      return;
    }
    var ch = S.ch;
    el.brief.className = 'du-brief du-brief--challenge';
    var change = h('button', { type: 'button', class: 'hg-btn hg-btn--small du-brief__change', 'data-sfx': 'click' }, t('dressUp.brief.change'));
    change.addEventListener('click', openPicker);
    el.brief.appendChild(h('div', { class: 'du-brief__row' }, [
      h('span', { class: 'hg-badge du-brief__now' }, t('dressUp.brief.now')),
      h('b', { class: 'du-brief__name' }, t('challenge.' + ch.id + '.name')),
      h('span', { class: 'du-brief__best' }, [h('span', { class: 'du-brief__bestlabel' }, t('dressUp.brief.best')), starRow(num(challengeStars()[ch.id]))]),
      change
    ]));
    el.brief.appendChild(h('p', { class: 'du-brief__desc' }, t('challenge.' + ch.id + '.desc')));
    var must = h('span', { class: 'du-brief__must' }, [h('span', { class: 'du-brief__mustlabel' }, t('dressUp.brief.must'))]);
    var reqs = reqStatus(S.outfit, ch);
    if (!reqs.length) must.appendChild(h('span', { class: 'du-req is-ok' }, t('dressUp.brief.noMust')));
    reqs.forEach(function (q) {
      var mark = h('span', { class: 'du-req__mark', 'aria-hidden': 'true' });
      var state = h('span', { class: 'hg-sr-only' });
      var chip = h('span', { class: 'du-req' }, [mark, q.text, state]);
      briefReq.push({ chip: chip, mark: mark, state: state });
      must.appendChild(chip);
    });
    el.brief.appendChild(h('div', { class: 'du-brief__row du-brief__row--tags' }, [tagChips(ch, true), must]));
    el.brief.appendChild(h('p', { class: 'du-brief__tip' }, t('dressUp.brief.matchTip')));
    updateBriefLive();
  }
  function updateBriefLive() {
    if (!S.ch || !briefReq.length) return;
    reqStatus(S.outfit, S.ch).forEach(function (q, i) {
      var r = briefReq[i];
      if (!r) return;
      r.chip.classList.toggle('is-ok', q.ok);
      r.chip.classList.toggle('is-miss', !q.ok);
      r.mark.textContent = q.ok ? '✓' : '✗';
      r.state.textContent = ' — ' + t(q.ok ? 'dressUp.req.ok' : 'dressUp.req.miss');
    });
  }

  function setFree() {
    if (S.mode === 'free' && !S.ch) return;
    S.mode = 'free';
    S.ch = null;
    sfx('click');
    renderModes(); renderBrief(); renderDecor(); renderMeter(); refreshTiles();
    announce(t('dressUp.mode.free'));
  }

  /* ═══════════ 8. Category tabs ═══════════ */
  function renderCats() {
    clear(el.cats);
    CATS.forEach(function (c) {
      var on = c.id === S.cat;
      var b = h('button', {
        type: 'button', role: 'tab', class: 'du-cat du-cat--' + c.id + (on ? ' is-on' : ''), id: 'du-cat-' + c.id,
        'aria-selected': String(on), 'aria-controls': 'du-grid', tabindex: on ? '0' : '-1', 'data-cat': c.id, 'data-sfx': 'click'
      }, [
        h('span', { class: 'du-cat__icon', 'aria-hidden': 'true' }, CAT_ICON[c.id] || '♡'),
        h('span', { class: 'du-cat__label' }, catLabel(c)),
        h('span', { class: 'du-cat__worn', 'aria-hidden': 'true' }, '♡'),
        h('span', { class: 'du-cat__new', 'aria-hidden': 'true' }, 'N')
      ]);
      el.cats.appendChild(b);
    });
    el.cats.setAttribute('aria-orientation', mq('(max-width: 960px)').matches ? 'horizontal' : 'vertical');
    updateCatMarks();
  }
  function updateCatMarks() {
    CATS.forEach(function (c) {
      var b = $('du-cat-' + c.id);
      if (!b) return;
      var worn = !!(c.slot && isOptional(c.slot) && S.outfit[c.slot]);
      b.classList.toggle('is-worn', worn);
      var kind = kindOf(c);
      b.classList.toggle('has-new', catItems(c).some(function (it) { return isNewItem(kind, it); }));
    });
  }
  function selectCat(id, focus) {
    if (!catDef(id) || catDef(id).id !== id) return;
    if (S.shownNew.length) { markSeen(S.shownNew); S.shownNew = []; }
    S.cat = id;
    Array.prototype.forEach.call(el.cats.querySelectorAll('.du-cat'), function (b) {
      var on = b.getAttribute('data-cat') === id;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
      if (on && b.scrollIntoView && el.cats.scrollWidth > el.cats.clientWidth + 4) {
        try { b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { /* old browsers */ }
      }
    });
    if (id === 'face') probeExtras();
    renderGrid();
    updateCatMarks();
  }
  function onCatsKey(e) {
    var keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'];
    if (keys.indexOf(e.key) < 0) return;
    e.preventDefault();
    var i = 0;
    for (var k = 0; k < CATS.length; k++) if (CATS[k].id === S.cat) i = k;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') i = (i + 1) % CATS.length;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') i = (i - 1 + CATS.length) % CATS.length;
    else if (e.key === 'Home') i = 0;
    else i = CATS.length - 1;
    sfx('tick');
    selectCat(CATS[i].id, true);
  }

  /* ═══════════ 9. Item grid ═══════════ */
  function cropStyle(img, c) {
    img.style.width = (1200 / c.w * 100) + '%';
    img.style.left = (-c.x / c.w * 100) + '%';
    img.style.top = (-c.y / c.h * 100) + '%';
  }

  // Picture with a fallback chain: thumbnail → crop of the full layer → emoji tile.
  function tryPic(box, chain, kind, it) {
    var step = chain.shift();
    if (!step) {
      var fb = HG.ui.img(null, { alt: '', emoji: HG.catalog ? HG.catalog.emoji(kind, it) : '♡', kind: kind, className: 'du-pic du-pic--fallback' });
      box.appendChild(fb);
      return;
    }
    var img = doc.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    img.loading = 'lazy';
    img.draggable = false;
    img.className = 'du-pic' + (step.crop ? ' du-pic--crop' : '') + (step.cover ? ' du-pic--cover' : '');
    if (step.crop) cropStyle(img, step.crop);
    img.onerror = function () {
      img.onerror = null;
      if (img.parentNode) img.parentNode.removeChild(img);
      tryPic(box, chain, kind, it);
    };
    img.src = step.src;
    box.appendChild(img);
  }
  function picFor(kind, it) {
    var box = h('span', { class: 'du-item__pic' });
    var chain = [];
    if (it.thumb) chain.push({ src: it.thumb });
    if (kind === 'wardrobe' && it.src && SLOT_CROP[it.slot]) chain.push({ src: it.src, crop: SLOT_CROP[it.slot] });
    if (kind === 'background' && it.src) chain.push({ src: it.src, cover: true });
    tryPic(box, chain, kind, it);
    return box;
  }

  function isWorn(kind, it) {
    if (kind === 'background') return S.outfit.background === it.id;
    return S.outfit[it.slot] === it.id;
  }

  function itemAria(kind, it, st, worn) {
    var nm = nameOf(kind, it.id);
    var state;
    if (!st.owned) state = st.type === 'hpoint' ? t('dressUp.info.price', { cost: fmt(st.cost) }) : t('dressUp.info.howTo', { hint: hintText(st) });
    else state = t(worn ? 'dressUp.item.on' : 'dressUp.item.off');
    var extra = '';
    if (S.ch && kind === 'wardrobe' && matchesTheme(it, S.ch)) extra = ' ' + t('dressUp.closet.match');
    return nm + ' — ' + state + extra;
  }

  function tile(cat, kind, it, st) {
    var worn = isWorn(kind, it);
    var match = !!(S.ch && kind === 'wardrobe' && matchesTheme(it, S.ch));
    var cls = 'du-item' + (worn ? ' is-on' : '') + (st.owned ? '' : ' is-locked hg-locked') + (match ? ' is-match' : '');
    var b = h('button', { type: 'button', class: cls, 'data-id': it.id, 'data-kind': kind, 'aria-pressed': String(worn), tabindex: '-1' });
    b.appendChild(picFor(kind, it));
    var badges = h('span', { class: 'du-item__badges', 'aria-hidden': 'true' });
    if (it.rarity === 'rare') badges.appendChild(h('span', { class: 'hg-badge hg-badge--hot du-badge' }, t('dressUp.closet.rare')));
    if (it.rarity === 'special') badges.appendChild(h('span', { class: 'hg-badge hg-badge--lavender du-badge' }, t('dressUp.closet.special')));
    if (isNewItem(kind, it, st)) {
      badges.appendChild(h('span', { class: 'hg-badge hg-badge--new du-badge du-badge--new' }, t('dressUp.closet.new')));
      S.shownNew.push({ kind: kind, id: it.id });
    }
    if (badges.firstChild) b.appendChild(badges);
    if (!st.owned) {
      b.appendChild(h('span', { class: 'du-item__lock du-item__lock--' + (st.type === 'hpoint' ? 'cost' : 'hint'), 'aria-hidden': 'true' },
        st.type === 'hpoint' ? fmt(st.cost) : '?'));
    }
    b.appendChild(h('span', { class: 'du-item__on', 'aria-hidden': 'true' }, '✓'));
    if (match) b.appendChild(h('span', { class: 'du-item__match', 'aria-hidden': 'true' }, '♡'));
    b.setAttribute('aria-label', itemAria(kind, it, st, worn));
    return b;
  }

  function noneTile(cat) {
    var worn = !S.outfit[cat.slot];
    return h('button', {
      type: 'button', class: 'du-item du-item--none' + (worn ? ' is-on' : ''), 'data-none': cat.slot, 'aria-pressed': String(worn), tabindex: '-1',
      'aria-label': t('dressUp.closet.noneLabel', { slot: t('slot.' + cat.slot) })
    }, [
      h('span', { class: 'du-item__pic du-item__pic--none', 'aria-hidden': 'true' }, [h('span', { class: 'du-none__x' }, '✕'), h('span', { class: 'du-none__txt' }, t('dressUp.closet.none'))]),
      h('span', { class: 'du-item__on', 'aria-hidden': 'true' }, '✓')
    ]);
  }

  function faceTiles() {
    var list = BASE_EXPRS.slice();
    if (S.outfit.head === EXTRA_HAIR) list = list.concat(EXTRA_EXPRS);
    list.forEach(function (ex) {
      var o = copy(S.outfit); o.expr = ex;
      var src = HG.look ? HG.look.headSrc(o) : null;
      var on = S.outfit.expr === ex;
      var b = h('button', {
        type: 'button', class: 'du-item du-item--face' + (on ? ' is-on' : ''), 'data-expr': ex, 'aria-pressed': String(on), tabindex: '-1',
        'aria-label': t('dressUp.expr.' + ex)
      });
      var box = h('span', { class: 'du-item__pic du-item__pic--face' });
      if (src) {
        var img = doc.createElement('img');
        img.alt = ''; img.decoding = 'async'; img.draggable = false;
        img.className = 'du-pic du-pic--crop';
        cropStyle(img, FACE_CROP);
        img.onerror = function () {
          img.onerror = null;
          if (img.parentNode) img.parentNode.removeChild(img);
          if (BASE_EXPRS.indexOf(ex) < 0) { b.hidden = true; ensureRoving(); return; }   // extra face not drawn yet
          box.appendChild(h('span', { class: 'du-face-emoji' }, EXPR_ICON[ex] || '🙂'));
        };
        img.src = src;
        box.appendChild(img);
      } else {
        box.appendChild(h('span', { class: 'du-face-emoji' }, EXPR_ICON[ex] || '🙂'));
      }
      b.appendChild(box);
      b.appendChild(h('span', { class: 'du-item__cap', 'aria-hidden': 'true' }, [h('span', { class: 'du-item__capicon' }, EXPR_ICON[ex] || ''), ' ', t('dressUp.expr.' + ex)]));
      b.appendChild(h('span', { class: 'du-item__on', 'aria-hidden': 'true' }, '✓'));
      el.grid.appendChild(b);
    });
    if (S.outfit.head !== EXTRA_HAIR) {
      el.grid.appendChild(h('p', { class: 'du-grid__note' }, t('dressUp.closet.faceNote', { hair: nameOf('wardrobe', EXTRA_HAIR) })));
    }
  }

  function renderGrid() {
    hideTip();
    var cat = catDef(S.cat);
    var kind = kindOf(cat);
    el.closetIcon.textContent = CAT_ICON[cat.id] || '♡';
    el.closetTitle.textContent = catLabel(cat);
    el.grid.setAttribute('aria-labelledby', 'du-cat-' + cat.id);
    clear(el.grid);
    el.grid.className = 'du-grid du-grid--' + cat.id;
    if (cat.id === 'face') {
      el.closetCount.textContent = '';
      faceTiles();
    } else {
      var list = sortedItems(cat);
      var n = 0;
      list.forEach(function (x) { if (x.st.owned) n++; });
      el.closetCount.textContent = t('dressUp.closet.count', { owned: n, total: list.length });
      el.closetCount.setAttribute('aria-label', t('dressUp.closet.countLabel', { owned: n, total: list.length }));
      if (cat.slot && isOptional(cat.slot)) el.grid.appendChild(noneTile(cat));
      list.forEach(function (x) { el.grid.appendChild(tile(cat, kind, x.it, x.st)); });
    }
    ensureRoving();
    renderInfo();
  }

  function tiles() { return Array.prototype.filter.call(el.grid.querySelectorAll('.du-item'), function (b) { return !b.hidden; }); }
  function ensureRoving(prefer) {
    var list = tiles();
    if (!list.length) return;
    var cur = prefer || el.grid.querySelector('.du-item[tabindex="0"]:not([hidden])') ||
              el.grid.querySelector('.du-item.is-on:not([hidden])') || list[0];
    list.forEach(function (b) { b.tabIndex = b === cur ? 0 : -1; });
  }

  // Update pressed/worn state in place (keeps keyboard focus).
  function refreshTiles() {
    var cat = catDef(S.cat);
    tiles().forEach(function (b) {
      var on, match = false;
      if (b.hasAttribute('data-expr')) on = S.outfit.expr === b.getAttribute('data-expr');
      else if (b.hasAttribute('data-none')) on = !S.outfit[b.getAttribute('data-none')];
      else {
        var kind = b.getAttribute('data-kind'), id = b.getAttribute('data-id');
        var it = kind === 'background' ? bgDef(id) : item(id);
        if (!it) return;
        on = isWorn(kind, it);
        match = !!(S.ch && kind === 'wardrobe' && matchesTheme(it, S.ch));
        b.classList.toggle('is-match', match);
        var m = b.querySelector('.du-item__match');
        if (match && !m) b.appendChild(h('span', { class: 'du-item__match', 'aria-hidden': 'true' }, '♡'));
        if (!match && m) m.parentNode.removeChild(m);
        b.setAttribute('aria-label', itemAria(kind, it, status(kind, id), on));
      }
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    if (cat) renderInfo();
  }

  function scheduleRefresh() {
    clearTimeout(S.refreshTimer);
    S.refreshTimer = setTimeout(function () {
      var focusedId = doc.activeElement && el.grid.contains(doc.activeElement) ? doc.activeElement.getAttribute('data-id') : null;
      renderGrid();
      updateCatMarks();
      if (focusedId) focusTile(focusedId);
    }, 30);
  }
  function focusTile(id) {
    var b = el.grid.querySelector('.du-item[data-id="' + String(id).replace(/"/g, '') + '"]');
    if (b) { ensureRoving(b); b.focus(); }
  }

  function onGridKey(e) {
    var keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (keys.indexOf(e.key) < 0) return;
    var list = tiles();
    var i = list.indexOf(doc.activeElement);
    if (i < 0) return;
    e.preventDefault();
    var cols = 1;
    var top0 = list[0].offsetTop;
    for (var c = 1; c < list.length; c++) { if (list[c].offsetTop !== top0) break; cols++; }
    var j = i;
    if (e.key === 'ArrowRight') j = Math.min(list.length - 1, i + 1);
    else if (e.key === 'ArrowLeft') j = Math.max(0, i - 1);
    else if (e.key === 'ArrowDown') j = Math.min(list.length - 1, i + cols);
    else if (e.key === 'ArrowUp') j = Math.max(0, i - cols);
    else if (e.key === 'Home') j = 0;
    else j = list.length - 1;
    if (j !== i) { sfx('tick'); ensureRoving(list[j]); list[j].focus(); }
  }

  function onGridClick(e) {
    var b = e.target && e.target.closest ? e.target.closest('.du-item') : null;
    if (!b || !el.grid.contains(b) || b.hidden) return;
    ensureRoving(b);
    if (b.hasAttribute('data-expr')) { setExpr(b.getAttribute('data-expr'), b); return; }
    if (b.hasAttribute('data-none')) { takeOff(b.getAttribute('data-none'), b); return; }
    var kind = b.getAttribute('data-kind'), id = b.getAttribute('data-id');
    var it = kind === 'background' ? bgDef(id) : item(id);
    if (!it) return;
    var st = status(kind, id);
    showInfo(kind, it);
    if (!st.owned) {
      if (st.type === 'hpoint') buyFlow(kind, it, b);
      else {
        sfx('tick');
        replay(b, 'is-nope');
        toast(t('dressUp.info.howTo', { hint: hintText(st) }));
      }
      return;
    }
    wear(kind, it, b);
  }

  /* ═══════════ 10. Wearing ═══════════ */
  function wear(kind, it, tileEl) {
    var nm = nameOf(kind, it.id);
    var cat = kind === 'background' ? catDef('background') : catOfSlot(it.slot);
    if (kind === 'background') {
      if (S.outfit.background !== it.id) {
        change({ background: it.id });
        sfx('whoosh');
        announce(t('dressUp.equip.bg', { name: nm }));
      } else replay(tileEl, 'is-nope');
    } else if (it.slot === 'head') {
      if (S.outfit.head !== it.id) {
        var patch = { head: it.id };
        if (it.id !== EXTRA_HAIR && BASE_EXPRS.indexOf(S.outfit.expr) < 0) patch.expr = EXPR_NEAR[S.outfit.expr] || 'neutral';
        change(patch);
        sfx('pop', { rate: 1.1 });
        announce(t('dressUp.equip.on', { name: nm }));
        if (tileEl) sparkleAt(tileEl, 5);
      } else replay(tileEl, 'is-nope');
    } else if (S.outfit[it.slot] === it.id) {
      if (isOptional(it.slot)) {
        var p = {}; p[it.slot] = null;
        change(p);
        sfx('tick');
        announce(t('dressUp.equip.off', { name: nm }));
      }
      if (cat) markTried(cat.id);        // it was on already: this drawer still counts as tried
      markSeen([{ kind: kind, id: it.id }]);
      return;
    } else {
      var q = {}; q[it.slot] = it.id;
      change(q);
      sfx('pop', { rate: 0.95 + Math.random() * 0.25 });
      announce(t('dressUp.equip.on', { name: nm }));
      if (tileEl) sparkleAt(tileEl, 5);
    }
    if (cat) markTried(cat.id);
    markSeen([{ kind: kind, id: it.id }]);
    var nb = tileEl && tileEl.querySelector('.du-badge--new');
    if (nb) nb.parentNode.removeChild(nb);
    updateCatMarks();
  }

  function takeOff(slot, tileEl) {
    if (!S.outfit[slot]) { replay(tileEl, 'is-nope'); return; }
    var nm = nameOf('wardrobe', S.outfit[slot]);
    var p = {}; p[slot] = null;
    change(p);
    sfx('tick');
    announce(t('dressUp.equip.off', { name: nm }));
  }

  function setExpr(ex, tileEl) {
    if (S.outfit.expr === ex) { replay(tileEl, 'is-nope'); return; }
    change({ expr: ex });
    sfx('sparkle');
    if (tileEl) sparkleAt(tileEl, 4);
    announce(t('dressUp.equip.face', { name: t('dressUp.expr.' + ex) }));
  }

  function buyFlow(kind, it, tileEl) {
    var st = status(kind, it.id);
    var nm = nameOf(kind, it.id);
    if (!st.affordable) {
      sfx('error');
      replay(tileEl, 'is-nope');
      toast(t('dressUp.buy.notEnough', { n: fmt(Math.max(0, num(st.cost) - hp())), cost: fmt(st.cost) }));
      return;
    }
    // Try it on while the dialog is open.
    var pv = copy(S.outfit);
    if (kind === 'background') pv.background = it.id; else pv[it.slot] = it.id;
    S.preview = fullOutfit(pv);
    renderStage();
    HG.ui.confirm({
      title: t('dressUp.buy.title'),
      text: t('dressUp.buy.text', { name: nm, cost: fmt(st.cost) }),
      okKey: 'dressUp.buy.ok'
    }).then(function (yes) {
      S.preview = null;
      if (!yes) { renderStage(); return; }
      var r = HG.unlocks.buy(kind, it.id);
      if (!r || !r.ok) {
        renderStage();
        sfx('error');
        toast(r && r.reason === 'owned' ? t('hpoint.owned') : t('dressUp.buy.notEnough', { n: fmt(Math.max(0, num(st.cost) - hp())), cost: fmt(st.cost) }));
        return;
      }
      clearTimeout(S.refreshTimer);
      renderGrid();
      var fresh = el.grid.querySelector('.du-item[data-id="' + it.id + '"]');
      wear(kind, it, fresh);
      if (fresh) { ensureRoving(fresh); fresh.focus(); }
      sfx('unlock');
      sparkleAt(el.view, 12);
      toast(t('dressUp.buy.done', { name: nm }));
    });
  }

  /* ═══════════ 11. Info strip + tooltip ═══════════ */
  function tagList(it) { return (it.tags || []).map(function (tg) { return '#' + t('tag.' + tg); }).join(' '); }

  function showInfo(kind, it) {
    clear(el.info);
    if (!it) return renderInfo();
    var st = status(kind, it.id);
    var worn = isWorn(kind, it);
    var line;
    if (!st.owned) line = st.type === 'hpoint' ? t('dressUp.info.price', { cost: fmt(st.cost) }) : t('dressUp.info.howTo', { hint: hintText(st) });
    else if (worn) line = t(kind === 'wardrobe' && isOptional(it.slot) ? 'dressUp.info.wearing' : 'dressUp.info.wearingFixed');
    else line = t('dressUp.info.owned');
    var pic = h('span', { class: 'du-info__pic' + (st.owned ? '' : ' hg-locked') }, picFor(kind, it));
    var tags = kind === 'wardrobe' ? tagList(it) : '';
    el.info.appendChild(pic);
    el.info.appendChild(h('span', { class: 'du-info__text' }, [
      h('b', { class: 'du-info__name' }, nameOf(kind, it.id)),
      it.rarity && it.rarity !== 'common' ? h('span', { class: 'du-info__rarity' }, ' · ' + t('rarity.' + it.rarity)) : null,
      tags ? h('span', { class: 'du-info__tags' }, tags) : null,
      h('span', { class: 'du-info__state' + (st.owned ? '' : ' is-locked') }, line)
    ]));
  }

  function renderInfo() {
    var cat = catDef(S.cat);
    if (cat.id === 'face') {
      clear(el.info);
      el.info.appendChild(h('span', { class: 'du-info__text' }, [
        h('b', { class: 'du-info__name' }, (EXPR_ICON[S.outfit.expr] || '') + ' ' + t('dressUp.expr.' + S.outfit.expr)),
        h('span', { class: 'du-info__state' }, t('dressUp.info.face'))
      ]));
      return;
    }
    var kind = kindOf(cat);
    var cur = kind === 'background' ? bgDef(S.outfit.background) : item(S.outfit[cat.slot]);
    if (cur) { showInfo(kind, cur); return; }
    clear(el.info);
    el.info.appendChild(h('span', { class: 'du-info__text' }, h('span', { class: 'du-info__state' }, t('dressUp.info.idle'))));
  }

  var tipFor = null;
  function showTip(b) {
    if (!b || b.hidden || b === tipFor) return;
    var text = b.getAttribute('data-id') ? tipText(b) : (b.getAttribute('aria-label') || '');
    if (!text) return hideTip();
    tipFor = b;
    clear(el.tip);
    text.forEach ? text.forEach(function (line, i) { el.tip.appendChild(h(i ? 'span' : 'b', { class: 'du-tip__line' }, line)); })
                 : el.tip.appendChild(h('b', { class: 'du-tip__line' }, text));
    el.tip.hidden = false;
    var box = el.closet.getBoundingClientRect(), r = b.getBoundingClientRect(), tr = el.tip.getBoundingClientRect();
    var x = r.left - box.left + r.width / 2 - tr.width / 2;
    x = Math.max(4, Math.min(box.width - tr.width - 4, x));
    var y = r.top - box.top - tr.height - 8;
    if (y < 30) y = r.bottom - box.top + 8;
    el.tip.style.left = Math.round(x) + 'px';
    el.tip.style.top = Math.round(y) + 'px';
  }
  function tipText(b) {
    var kind = b.getAttribute('data-kind'), id = b.getAttribute('data-id');
    var it = kind === 'background' ? bgDef(id) : item(id);
    if (!it) return null;
    var st = status(kind, id);
    var lines = [nameOf(kind, id)];
    if (kind === 'wardrobe') lines.push(tagList(it));
    if (!st.owned) lines.push(st.type === 'hpoint' ? t('dressUp.info.price', { cost: fmt(st.cost) }) : t('dressUp.info.howTo', { hint: hintText(st) }));
    return lines;
  }
  function hideTip() {
    tipFor = null;
    if (el.tip) el.tip.hidden = true;
  }

  /* ═══════════ 12. RANDOM · RESET ═══════════ */
  function ownedIds(slot) {
    return W.items.filter(function (it) { return it.slot === slot && owned('wardrobe', it.id); }).map(function (it) { return it.id; });
  }
  function randomOutfit() {
    function maybe(p, slot) { return Math.random() < p ? pick(ownedIds(slot)) : null; }
    var o = { head: pick(ownedIds('head')) || S.outfit.head };
    var ex = BASE_EXPRS.slice();
    if (o.head === EXTRA_HAIR) ex = ex.concat(S.extraOk);
    o.expr = pick(ex);
    o.bottom = pick(ownedIds('bottom'));
    o.shoes = pick(ownedIds('shoes'));
    var shirtBase = Math.random() < 0.4 && ownedIds('shirt').length;
    o.top = shirtBase ? maybe(0.35, 'top') : pick(ownedIds('top'));
    o.shirt = shirtBase ? pick(ownedIds('shirt')) : null;
    var mid = Math.random();
    o.knit = mid < 0.3 ? pick(ownedIds('knit')) : null;
    o.hoodie = !o.knit && mid < 0.55 ? pick(ownedIds('hoodie')) : null;
    o.outer = maybe(0.5, 'outer');
    o.accessory = maybe(0.5, 'accessory');
    o.bag = maybe(0.4, 'bag');
    o.hat = maybe(0.35, 'hat');
    o.background = pick(dressBgs().filter(function (b) { return owned('background', b.id); }).map(function (b) { return b.id; })) || S.outfit.background;
    return o;
  }
  function doRandom() {
    if (S.shuffling) return;
    probeExtras();
    S.shuffling = true;
    el.random.setAttribute('aria-busy', 'true');
    sfx('whoosh');
    var steps = reduced() ? 0 : 4, i = 0;
    (function step() {
      var o = randomOutfit();
      if (i < steps) {
        i++;
        S.preview = fullOutfit(o);
        renderStage();
        sfx('tick', { rate: 1 + i * 0.12 });
        S.shuffleTimer = setTimeout(step, 110);
        return;
      }
      S.preview = null;
      S.shuffling = false;
      el.random.removeAttribute('aria-busy');
      setOutfit(o);
      sfx('sparkle');
      sparkleAt(el.view, 10);
      replay(el.figure, 'is-hop');
      toast(t('dressUp.random.done'));
      announce(stageLabel(S.outfit));
      if (HG.unlocks) HG.unlocks.track({ inc: { 'dressup.randomUsed': 1 } });
    })();
  }

  function doReset() {
    var def = sanitize(W.defaultOutfit || {});
    if (sig(def) === sig(S.outfit)) { sfx('tick'); toast(t('dressUp.reset.done')); return; }
    HG.ui.confirm({ title: t('dressUp.reset.title'), text: t('dressUp.reset.text'), okKey: 'dressUp.reset.ok' }).then(function (yes) {
      if (!yes) return;
      setOutfit(def);
      sfx('whoosh');
      replay(el.figure, 'is-hop');
      toast(t('dressUp.reset.done'));
      announce(stageLabel(S.outfit));
    });
  }

  /* ═══════════ 13. Looks (save / list / load / delete) ═══════════ */
  function looks() {
    var du = sd().dressUp;
    return du && Array.isArray(du.looks) ? du.looks : [];
  }
  function updateLooksCount() {
    var n = looks().length;
    el.looksCount.textContent = n ? String(n) : '';
    el.looksCount.hidden = !n;
  }
  function makeThumb(o) {
    if (!HG.look || !HG.look.render) return Promise.resolve(null);
    return HG.look.render(o, { w: THUMB_W, h: THUMB_H, background: true }).then(function (c) {
      try { return c.toDataURL('image/jpeg', 0.82); } catch (e) { return null; }   // file:// taints canvases
    }, function () { return null; });
  }
  function rewardPlay(statKey) {
    if (!HG.unlocks) return 0;
    var inc = {}; inc[statKey] = 1;
    if (!S.played) {
      S.played = true;
      var res = HG.unlocks.finishGame('dress-up', { score: 0, bestKey: 'dressup.stars', stats: { inc: inc } });
      return res ? res.earned : 0;
    }
    HG.unlocks.track({ inc: inc });
    return 0;
  }
  function doSave() {
    var o = copy(S.outfit);
    var s = sig(o);
    var list = looks();
    for (var i = 0; i < list.length; i++) {
      if (list[i] && sig(fullOutfit(list[i].outfit)) === s) { sfx('tick'); toast(t('dressUp.looks.same')); return; }
    }
    function go() {
      el.save.disabled = true;
      makeThumb(o).then(function (thumb) {
        var no = 0;
        looks().forEach(function (l) { no = Math.max(no, num(l && l.no)); });
        var look = { id: 'lk' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36), no: no + 1,
                     at: new Date().toISOString(), outfit: o, thumb: thumb };
        HG.save.update(function (d) {
          if (!d.dressUp || typeof d.dressUp !== 'object') d.dressUp = { outfit: {}, looks: [], challengeStars: {} };
          if (!Array.isArray(d.dressUp.looks)) d.dressUp.looks = [];
          while (d.dressUp.looks.length >= LOOKS_MAX) d.dressUp.looks.shift();
          d.dressUp.looks.push(look);
        });
        saveNow();
        var earned = rewardPlay('dressup.looksSaved');
        el.save.disabled = false;
        sfx('shutter');
        replay(el.frame, 'is-flash');
        sparkleAt(el.view, 12);
        updateLooksCount();
        var msg = t('dressUp.looks.saved', { n: looks().length, max: LOOKS_MAX });
        if (earned) msg += ' ' + t('hpoint.earned', { n: earned });
        toast(msg);
        announce(msg);
      });
    }
    if (list.length >= LOOKS_MAX) {
      HG.ui.confirm({ title: t('dressUp.looks.fullTitle'), text: t('dressUp.looks.fullText', { max: LOOKS_MAX }), okKey: 'dressUp.looks.replace' })
        .then(function (yes) { if (yes) go(); });
    } else go();
  }

  function makeMini(host) {
    var root = h('span', { class: 'du-minilook' });
    var fig = h('span', { class: 'du-minilook__fig' });
    root.appendChild(fig);
    host.appendChild(root);
    return makeView(root, fig);
  }

  function wearLook(lk) {
    var o = sanitize(lk.outfit);
    setOutfit(o);
    sfx('sparkle');
    replay(el.figure, 'is-hop');
    var msg = t('dressUp.looks.loaded', { n: lk.no || '?' });
    toast(msg);
    announce(msg);
  }

  function openLooks() {
    var body = h('div', { class: 'du-looks' });
    var m = null;
    function draw() {
      clear(body);
      var list = looks().slice().reverse();
      body.appendChild(h('p', { class: 'du-looks__count' }, [
        h('span', { class: 'du-looks__heart', 'aria-hidden': 'true' }, '📒 '),
        t('dressUp.looks.count', { n: list.length, max: LOOKS_MAX })
      ]));
      if (!list.length) {
        body.appendChild(h('p', { class: 'du-looks__empty' }, t('dressUp.looks.empty')));
        return;
      }
      var ul = h('ul', { class: 'du-looks__list' });
      list.forEach(function (lk) {
        if (!lk || !lk.outfit) return;
        var label = t('dressUp.looks.lookNo', { n: lk.no || '?' });
        var pic = h('span', { class: 'du-look__pic' });
        if (typeof lk.thumb === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(lk.thumb)) {
          pic.appendChild(h('img', { src: lk.thumb, alt: '', class: 'du-look__img' }));
        } else {
          paintView(makeMini(pic), sanitize(lk.outfit));
        }
        var wearBtn = h('button', { type: 'button', class: 'hg-btn hg-btn--pink hg-btn--small du-look__btn',
          'aria-label': t('dressUp.looks.wearLabel', { look: label }) }, t('dressUp.looks.wear'));
        wearBtn.addEventListener('click', function () { if (m) m.close('wear'); wearLook(lk); });
        var photoBtn = h('button', { type: 'button', class: 'hg-btn hg-btn--gold hg-btn--small du-look__btn du-look__btn--icon',
          'aria-label': t('dressUp.looks.photoLabel', { look: label }), title: t('dressUp.looks.photoLabel', { look: label }) },
          h('span', { 'aria-hidden': 'true' }, '📸'));
        photoBtn.addEventListener('click', function () { if (m) m.close('photo'); sendToPhoto(sanitize(lk.outfit)); });
        var delBtn = h('button', { type: 'button', class: 'hg-btn hg-btn--small du-look__btn du-look__btn--icon',
          'aria-label': t('dressUp.looks.delLabel', { look: label }), title: t('dressUp.looks.delLabel', { look: label }) },
          h('span', { 'aria-hidden': 'true' }, '🗑'));
        delBtn.addEventListener('click', function () { del(lk); });
        ul.appendChild(h('li', { class: 'du-look' }, [
          pic,
          h('span', { class: 'du-look__name' }, label),
          h('span', { class: 'du-look__date' }, dateStr(lk.at)),
          h('span', { class: 'du-look__btns' }, [wearBtn, photoBtn, delBtn])
        ]));
      });
      body.appendChild(ul);
    }
    function del(lk) {
      HG.ui.confirm({ title: t('dressUp.looks.delTitle'), text: t('dressUp.looks.delText'), okKey: 'dressUp.looks.del', danger: true })
        .then(function (yes) {
          if (!yes) return;
          HG.save.update(function (d) {
            if (d.dressUp && Array.isArray(d.dressUp.looks)) d.dressUp.looks = d.dressUp.looks.filter(function (x) { return x && x.id !== lk.id; });
          });
          sfx('pop');
          toast(t('dressUp.looks.deleted'));
          draw();
          updateLooksCount();
          var first = body.querySelector('button');
          if (first) first.focus();
        });
    }
    draw();
    m = HG.ui.modal({ title: t('dressUp.looks.title'), body: body, className: 'du-modal du-modal--looks' });
  }

  function sendToPhoto(o) {
    saveNow();
    if (HG.save) HG.save.set('photoBooth.transferLook', copy(fullOutfit(o)));
    if (HG.unlocks) HG.unlocks.track({ inc: { 'dressup.sentToPhoto': 1 } });
    flushAll();
    sfx('shutter');
    replay(el.frame, 'is-flash');
    toast(t('dressUp.photo.sending'));
    setTimeout(function () { win.location.href = 'photo-booth.html'; }, reduced() ? 200 : 650);
  }

  /* ═══════════ 14. STYLE CHALLENGE ═══════════ */
  function openPicker() {
    var picked = false;
    var m = null;
    var stars = challengeStars();
    var list = h('ul', { class: 'du-chs' });
    (W.challenges || []).forEach(function (ch) {
      var cleared = flag('dressup.challenge.' + ch.id);
      var bgOk = ch.bg ? owned('background', ch.bg) : true;
      var bgPic = h('span', { class: 'du-ch__bg' + (bgOk ? '' : ' hg-locked') });
      var bgItem = bgDef(ch.bg);
      if (bgItem) bgPic.appendChild(picFor('background', bgItem));
      var must = (ch.require || []).map(reqText).join(' · ') || t('dressUp.brief.noMust');
      var card = h('button', {
        type: 'button', class: 'du-ch' + (S.ch && S.ch.id === ch.id ? ' is-active' : '') + (cleared ? ' is-clear' : ''),
        'data-ch': ch.id
      }, [
        bgPic,
        h('span', { class: 'du-ch__body' }, [
          h('span', { class: 'du-ch__name' }, t('challenge.' + ch.id + '.name')),
          h('span', { class: 'du-ch__desc' }, t('challenge.' + ch.id + '.desc')),
          tagChips(ch, true),
          h('span', { class: 'du-ch__must' }, [h('b', {}, t('dressUp.brief.must') + ': '), must]),
          h('span', { class: 'du-ch__meta' }, [
            h('span', { class: 'du-ch__bgname' }, t('dressUp.challenge.bg', { name: nameOf('background', ch.bg) }) + (bgOk ? '' : ' 🔒')),
            num(stars[ch.id]) ? starRow(num(stars[ch.id]), 'du-ch__stars') : h('span', { class: 'du-ch__new' }, t('dressUp.challenge.notYet'))
          ])
        ]),
        cleared ? h('span', { class: 'du-ch__stamp', 'aria-hidden': 'true' }, t('dressUp.challenge.cleared')) : null
      ]);
      card.addEventListener('click', function () {
        picked = true;
        if (m) m.close('pick');
        startChallenge(ch.id);
      });
      list.appendChild(h('li', { class: 'du-chs__item' }, card));
    });
    var body = h('div', { class: 'du-picker' }, [h('p', { class: 'du-picker__intro' }, t('dressUp.challenge.intro')), list]);
    m = HG.ui.modal({
      title: t('dressUp.challenge.title'), body: body, className: 'du-modal du-modal--picker',
      initialFocus: list.querySelector('.du-ch.is-active') || list.querySelector('.du-ch'),
      onClose: function () { if (!picked && !S.ch) { S.mode = 'free'; renderModes(); } }
    });
  }

  function startChallenge(id) {
    var ch = challenge(id);
    if (!ch) return;
    S.mode = 'challenge';
    S.ch = ch;
    renderModes();
    renderBrief();
    renderDecor();
    renderMeter();
    refreshTiles();
    sfx('powerup');
    if (ch.bg && owned('background', ch.bg) && S.outfit.background !== ch.bg) {
      change({ background: ch.bg });
      toast(t('dressUp.challenge.started', { name: t('challenge.' + id + '.name') }) + ' ' + t('dressUp.challenge.bgSet', { name: nameOf('background', ch.bg) }));
    } else {
      toast(t('dressUp.challenge.started', { name: t('challenge.' + id + '.name') }));
    }
    announce(t('dressUp.challenge.started', { name: t('challenge.' + id + '.name') }) + ' ' + t('challenge.' + id + '.desc'));
  }

  function doDone() {
    if (!S.ch) { openPicker(); return; }
    var ch = S.ch;
    var o = copy(S.outfit);
    var r = judge(o, ch);
    var flagKey = 'dressup.challenge.' + ch.id;
    var prevStars = num(challengeStars()[ch.id]);
    var firstClear = r.stars >= 3 && !flag(flagKey);
    var repeat = S.submitted[ch.id] === sig(o);
    var res = null;
    if (!repeat && HG.unlocks) {
      S.submitted[ch.id] = sig(o);
      S.played = true;
      res = HG.unlocks.finishGame('dress-up', {
        score: r.stars, bestKey: 'dressup.stars',
        stats: { inc: { 'dressup.challengesCleared': firstClear ? 1 : 0, 'dressup.fiveStars': r.stars === 5 ? 1 : 0 } },
        flags: r.stars >= 3 ? [flagKey] : []
      });
      if (r.stars > prevStars) {
        HG.save.update(function (d) {
          if (!d.dressUp || typeof d.dressUp !== 'object') d.dressUp = { outfit: {}, looks: [], challengeStars: {} };
          if (!d.dressUp.challengeStars || typeof d.dressUp.challengeStars !== 'object') d.dressUp.challengeStars = {};
          d.dressUp.challengeStars[ch.id] = r.stars;
        });
      }
    }
    saveNow();
    showResult(ch, o, r, res, { repeat: repeat, newBest: !repeat && r.stars > prevStars, firstClear: !repeat && firstClear });
    renderBrief();
  }

  function showResult(ch, o, r, res, info) {
    var title = t('dressUp.result.t' + r.stars);
    var stars = h('p', { class: 'hg-result__stars du-result__stars', role: 'img', 'aria-label': t('dressUp.result.stars', { n: r.stars }) });
    for (var i = 0; i < 5; i++) stars.appendChild(h('span', { class: 'hg-star' + (i < r.stars ? ' is-on' : ''), 'aria-hidden': 'true' }, '★'));
    var head = h('div', { class: 'hg-result__head du-result__head' + (r.stars >= 3 ? ' is-clear' : '') }, [
      h('p', { class: 'du-result__ch' }, '♡ ' + t('challenge.' + ch.id + '.name') + ' ♡'),
      h('p', { class: 'hg-result__title du-result__title' }, title),
      stars,
      info.newBest ? h('span', { class: 'hg-result__record du-result__record' }, t('dressUp.result.newBest')) : null,
      info.firstClear ? h('span', { class: 'du-result__clear' }, t('dressUp.result.clear')) : null
    ]);

    var look = h('span', { class: 'du-result__look', 'aria-hidden': 'true' });
    paintView(makeMini(look), o);
    var bars = h('ul', { class: 'du-result__bars' });
    var fills = [];
    STATS.concat(['match']).forEach(function (k, idx) {
      var n = k === 'match' ? r.match : r.stats[k];
      var fill = h('span', { class: 'du-rbar__fill', style: '--pct:0%;--d:' + (idx * 0.12).toFixed(2) + 's' });
      fills.push({ fill: fill, n: n });
      bars.appendChild(h('li', { class: 'du-rbar du-rbar--' + k + (ch.keyStat === k ? ' is-key' : '') }, [
        h('span', { class: 'du-rbar__label' }, t(k === 'match' ? 'dressUp.meter.match' : 'dressUp.meter.' + k)),
        h('span', { class: 'du-rbar__track', role: 'img', 'aria-label': t('dressUp.meter.aria', { name: t(k === 'match' ? 'dressUp.meter.match' : 'dressUp.meter.' + k), n: n }) }, fill),
        h('span', { class: 'du-rbar__val', 'aria-hidden': 'true' }, n + '%')
      ]));
    });
    var mid = h('div', { class: 'du-result__mid' }, [look, bars]);

    var reqs = r.req.map(function (q) {
      return h('p', { class: 'du-result__req ' + (q.ok ? 'is-ok' : 'is-miss') },
        t(q.ok ? 'dressUp.result.mustOk' : 'dressUp.result.mustMiss', { req: q.text }));
    });
    var lineKey = 'dressUp.result.l' + r.stars;
    var tip = null;
    if (r.stars < 5 && r.reqOk) tip = h('p', { class: 'du-result__tip' }, t('dressUp.result.tip', { tags: (ch.target || []).map(function (x) { return t('tag.' + x); }).join(' · ') }));

    var unl = null;
    if (res && res.unlocked && res.unlocked.length) {
      unl = h('div', { class: 'hg-result__unlocks' });
      res.unlocked.forEach(function (u) {
        if (u.kind === 'achievement') return;
        unl.appendChild(h('span', { class: 'hg-result__unlock', title: nameOf(u.kind, u.id) }, HG.ui.itemIcon(u.kind, u.id, { lazy: false })));
      });
      if (!unl.firstChild) unl = null;
    }

    var body = h('div', { class: 'hg-result du-result' + (r.stars >= 3 ? '' : ' hg-result--fail') }, [
      head,
      mid,
      h('div', { class: 'du-result__foot' }, [
        h('p', { class: 'du-result__line' }, t(lineKey)),
        tip
      ].concat(reqs).concat([
        res ? h('p', { class: 'hg-result__earned' }, t('dressUp.result.earned', { n: fmt(res.earned) }))
            : h('p', { class: 'du-result__again' }, t('dressUp.result.again')),
        unl
      ]))
    ]);

    HG.ui.modal({
      title: t('dressUp.result.windowTitle'), body: body, className: 'du-modal du-modal--result',
      buttons: [
        { labelKey: 'dressUp.result.other', onClick: function () { setTimeout(openPicker, 0); } },
        { labelKey: 'dressUp.result.save', className: 'hg-btn--mint', onClick: function () { setTimeout(doSave, 0); } },
        { labelKey: 'dressUp.result.keep', primary: true }
      ]
    });

    var apply = function () { fills.forEach(function (f) { f.fill.style.setProperty('--pct', f.n + '%'); }); };
    if (reduced() || !win.requestAnimationFrame) apply();
    else win.requestAnimationFrame(function () { win.requestAnimationFrame(apply); });

    sfx(r.stars === 5 ? 'perfect' : r.stars === 4 ? 'success' : r.stars === 3 ? 'good' : 'pop');
    if (r.stars >= 4 && !reduced()) {
      setTimeout(function () {
        var st = body.querySelector('.du-result__stars');
        sparkleAt(st, r.stars === 5 ? 18 : 10);
        if (r.stars === 5) sparkleAt(el.view, 14);
      }, 380);
    }
    announce(t('dressUp.result.announce', { title: title, n: r.stars, m: r.match }));
  }

  /* ═══════════ 15. Mini mirror (phones) ═══════════ */
  function initMini() {
    if (!('IntersectionObserver' in win)) return;
    var phone = mq('(max-width: 720px)');
    var ratio = 1, gameIn = true;
    var host = el.miniView;
    S.miniView = makeView(host, host.appendChild(h('span', { class: 'du-mini__fig' })));
    paintView(S.miniView, viewOutfit());
    function update() {
      var show = !!phone.matches && ratio < 0.3 && gameIn && !(HG.ui.isModalOpen && HG.ui.isModalOpen());
      if (el.mini.hidden === show) el.mini.hidden = !show;
    }
    var io = new win.IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.target === el.view) ratio = en.intersectionRatio;
        else gameIn = en.isIntersecting;
      });
      update();
    }, { threshold: [0, 0.15, 0.3, 0.5, 0.8] });
    io.observe(el.view);
    io.observe(el.game);
    if (phone.addEventListener) phone.addEventListener('change', update);
    else if (phone.addListener) phone.addListener(update);
    doc.addEventListener('hg:modal', update);
    el.mini.addEventListener('click', function () {
      sfx('click');
      try { el.frame.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { el.frame.scrollIntoView(); }
    });
  }

  /* ═══════════ 16. Boot ═══════════ */
  function renderAll() {
    renderModes();
    renderBrief();
    renderCats();
    renderGrid();
    renderMeter();
    renderDecor();
    renderStage();
    updateLooksCount();
  }

  function onAction(e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-act]') : null;
    if (!b || b.disabled) return;
    var act = b.getAttribute('data-act');
    if (act === 'random') doRandom();
    else if (act === 'reset') { sfx('click'); doReset(); }
    else if (act === 'save') doSave();
    else if (act === 'looks') { sfx('click'); openLooks(); }
    else if (act === 'photo') sendToPhoto(S.outfit);
    else if (act === 'done') doDone();
  }

  function readHash() {
    var hsh = '';
    try { hsh = decodeURIComponent((win.location.hash || '').replace(/^#/, '')); } catch (e) { return; }
    var m = /^challenge=([a-z0-9-]+)$/.exec(hsh);
    if (m && challenge(m[1])) { startChallenge(m[1]); return; }
    if (hsh === 'challenge' || hsh === 'challenges') { S.mode = 'challenge'; renderModes(); openPicker(); }
  }

  function wire() {
    el.modeFree.addEventListener('click', setFree);
    el.modeCh.addEventListener('click', function () { sfx('click'); S.mode = 'challenge'; renderModes(); openPicker(); });

    el.cats.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('.du-cat') : null;
      if (b) selectCat(b.getAttribute('data-cat'));
    });
    el.cats.addEventListener('keydown', onCatsKey);

    el.grid.addEventListener('click', onGridClick);
    el.grid.addEventListener('keydown', onGridKey);
    el.grid.addEventListener('focusin', function (e) {
      var b = e.target.closest ? e.target.closest('.du-item') : null;
      if (!b) return;
      ensureRoving(b);
      var kind = b.getAttribute('data-kind'), id = b.getAttribute('data-id');
      if (id) showInfo(kind, kind === 'background' ? bgDef(id) : item(id));
      var fv = false;
      try { fv = b.matches(':focus-visible'); } catch (err) { fv = false; }
      if (fv) showTip(b);
    });
    el.grid.addEventListener('focusout', hideTip);
    el.grid.addEventListener('pointerover', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var b = e.target.closest ? e.target.closest('.du-item') : null;
      if (!b) return;
      showTip(b);
      var kind = b.getAttribute('data-kind'), id = b.getAttribute('data-id');
      if (id) showInfo(kind, kind === 'background' ? bgDef(id) : item(id));
    });
    el.grid.addEventListener('pointerleave', function () { hideTip(); renderInfo(); });
    el.grid.addEventListener('scroll', hideTip, { passive: true });

    el.actions.addEventListener('click', onAction);
    el.poke.addEventListener('click', poke);
    el.zoom.addEventListener('click', function () {
      S.zoom = !S.zoom;
      el.view.classList.toggle('is-zoom', S.zoom);
      el.zoom.setAttribute('aria-pressed', String(S.zoom));
      sfx('click');
      renderDecor();
    });

    doc.addEventListener('hg:lang', function () {
      renderAll();
      if (HG.i18n) HG.i18n.apply(el.game);
    });
    doc.addEventListener('hg:unlock', function () { scheduleRefresh(); });
    doc.addEventListener('hg:save', function (e) {
      var d = e.detail || {};
      if (d.path === '*' && (d.external || d.reset || d.imported)) {
        S.outfit = sanitize(HG.look ? HG.look.current() : W.defaultOutfit);
        renderAll();
      }
    });
    var wide = mq('(max-width: 960px)');
    var syncOrient = function () { el.cats.setAttribute('aria-orientation', wide.matches ? 'horizontal' : 'vertical'); };
    if (wide.addEventListener) wide.addEventListener('change', syncOrient);
    else if (wide.addListener) wide.addListener(syncOrient);

    win.addEventListener('pagehide', function () {
      if (S.shownNew.length) markSeen(S.shownNew);
      flushAll();
    });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) flushAll(); });
  }

  function init() {
    W = HG.data && HG.data.wardrobe;
    var root = $('game');
    if (!W || !root || !HG.ui || !HG.ui.el) return;
    (W.items || []).forEach(function (it) { if (it && it.id) itemIndex[it.id] = it; });
    CATS = [];
    (W.categories || []).forEach(function (c) {
      CATS.push({ id: c.id, slot: c.slot });
      if (c.id === 'hair') CATS.push({ id: 'face', slot: null });
    });
    precompute();

    HG.ui.mountGameShell(root, { game: 'dress-up', titleKey: 'games.dressUp.title', helpKey: 'dressUp.help' });

    el = {
      game: $('du-game'), modeFree: $('du-mode-free'), modeCh: $('du-mode-challenge'), brief: $('du-brief'),
      cats: $('du-cats'), view: $('du-view'), zoomer: $('du-zoomer'), figure: $('du-figure'), frame: $('du-frame'),
      poke: $('du-poke'), zoom: $('du-zoom'), ribbon: $('du-ribbon'), todayTag: $('du-today-tag'), datestamp: $('du-datestamp'),
      meter: $('du-meter'), closet: $('du-closet'), closetIcon: $('du-closet-icon'), closetTitle: $('du-closet-h'),
      closetCount: $('du-closet-count'), grid: $('du-grid'), info: $('du-info'), tip: $('du-tip'),
      actions: $('du-actions'), random: $('du-random'), save: $('du-save'), looksCount: $('du-looks-count'), done: $('du-done'),
      mini: $('du-mini'), miniView: $('du-mini-view')
    };
    el.bubble = h('span', { class: 'du-bubble', 'aria-hidden': 'true', hidden: true });
    el.view.appendChild(el.bubble);

    S.outfit = sanitize(HG.look ? HG.look.current() : W.defaultOutfit);
    S.tried = loadTried();
    S.view = makeView(el.zoomer, el.figure);
    buildMeter();
    // Show Hamin only once the first set of layers is ready (no half-dressed flash on slow loads).
    el.zoomer.classList.add('is-loading');
    var firstSrcs = [], fm = layerMap(viewOutfit());
    Object.keys(fm).forEach(function (k) { if (fm[k] && k !== 'background') firstSrcs.push(fm[k]); });
    var reveal = function () { el.zoomer.classList.remove('is-loading'); };
    Promise.all(firstSrcs.map(loadImg)).then(function () { setTimeout(reveal, 30); }, reveal);
    setTimeout(reveal, 4000);
    renderAll();
    wire();
    initMini();
    readHash();

    if (!seen(SEEN_PREFIX + 'welcome')) {
      HG.save.set('seen.' + SEEN_PREFIX + 'welcome', true);
      setTimeout(function () { toast(t('dressUp.welcome')); }, 700);
    }
    setTimeout(probeExtras, 1500);
  }

  HG.onReady(init);
})(window.HG = window.HG || {}, window, document);

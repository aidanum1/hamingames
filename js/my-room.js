/* HAMIN GAMES — js/my-room.js
   HAMIN'S ROOM (my-room.html): a Cyworld-style mini-room you decorate with the room items
   you collect everywhere else on the site.

     room      assets/room/bg-room.webp in a 16:10 window. Items are absolutely positioned
               <button>s (x,y = item centre in 0..1, width = item.w of the room width).
               Depth: sort by z band, then by bottom edge (feet) → saved in render order, so the
               portal preview (js/home.js: zIndex = z, ties = array order) matches exactly.
     EDIT      pointer drag & drop (mouse + touch), zone rules (floor / wall / any) with a soft
               bounce back, selection toolbar FLIP · FRONT · BACK · PUT AWAY, keyboard
               (Tab, arrows, Shift+arrows, F, [ ], Delete, Esc), drag back onto MY ITEMS to put away.
     MY ITEMS  category tabs (HG.data.roomCats) + ALL; owned tiles (tap or drag in; small items
               can be placed several times), locked tiles (silhouette + hint, or H-POINT exchange
               through HG.unlocks.buy). Desktop: side panel · <720px: bottom sheet.
     VIEW      click things: lamp glow, CD player jingle (10 plays → secret 'cdDj'), window
               day ↔ night, camera flash, photo board (save.photoBooth.lastPhoto), clock, neon,
               fairy lights, plushies, star jar, laptop (tiny retro browser window).
     Hamin     the player's Dress Up look (HG.look) as a draggable figure with an idle bob;
               click → random line + a smile. Saved in save.room.hamin {x, y, show, z, flip}.

   Rewards only through HG.unlocks: track({inc:{'room.placed':1}}) per new placement,
   track({inc:{'room.interactions':1}}) per VIEW interaction (+ 'room.cdClicks' for the CD
   player), secret('cdDj'), buy('room', id), and finishGame('my-room', {score:0}) on the
   first save of a page visit. Save: save.room {layout, hamin, night, edited} — auto-saved
   (debounced) + SAVE ROOM ♡. BGM 'room' is started by main.js from data-page="my-room". */
(function (HG, win, doc) {
  'use strict';

  /* ═══════════ Config ═══════════ */
  var RATIO = 1.6;              // room is 16:10 → height fraction = width fraction × art aspect × RATIO
  var MAX_ITEMS = 48;
  var SMALL_W = 0.10;           // items this narrow (or narrower) may be placed several times
  var MAX_COPIES = 6;
  var FLOOR_LINE = 0.72;        // floor things keep their bottom edge between this line and the room bottom
  var FLOOR_MIN_C = 0.45;       // …and their centre in the lower 55 % (see data/room-items.js)
  var WALL_MAX_C = 0.60;        // wall things keep their centre in the upper 60 %
  var WALL_MAX_B = 0.84;        // …and their bottom edge above the floor boards
  var HAMIN_W = 0.2, HAMIN_ASPECT = 4 / 3;
  var HAMIN_DEF = { x: 0.44, y: 0.72, show: true, z: 2, flip: false };
  var Z_MIN = 0, Z_MAX = 9;
  var SAVE_DELAY = 800;
  var FLAT = { 'room-rug-round': 1 };   // lies flat on the floor → behind the furniture
  var CAT_ICON = { all: '♡', furniture: '🛋️', lighting: '💡', wall: '🪟', desk: '💻', cds: '💿', books: '📚',
                   plants: '🪴', plushies: '🧸', frames: '🖼️', food: '🍓', collectibles: '🏆' };
  var TALK_N = 12, MOOD_N = 6;
  var LOOK_CROP = { x: 200, y: 10, w: 800, h: 1067 };     // waist-up 3:4 crop for the framed look
  var GLOW = { lamp: { k: 'warm', s: 4.6, dy: -0.18 }, window: { k: 'moon', s: 1.5, dy: -0.05 },
               neon: { k: 'pink', s: 2.2, dy: 0 }, lights: { k: 'gold', s: 1.25, dy: 0.05 } };
  // original little CD-player tunes (MIDI notes, D major like the room waltz)
  var JINGLES = [
    { key: 'track1', step: 0.14, notes: [86, 90, 93, 90, 91, 88, 85, 88, 86, null, 93, 98] },
    { key: 'track2', step: 0.2, notes: [81, 86, 90, 88, 86, 83, 81, null, 78, 81, 86] },
    { key: 'track3', step: 0.16, notes: [90, 93, 98, 97, 95, 93, 95, 91, 88, 86, null, 86] }
  ];

  /* ═══════════ Helpers ═══════════ */
  function t(k, p) { return HG.t ? HG.t(k, p) : k; }
  function sfx(name, opts) { try { if (HG.audio) HG.audio.sfx(name, opts); } catch (e) { /* sound never breaks the room */ } }
  function S() { return (HG.save && HG.save.data) || {}; }
  function num(v, d) { v = Number(v); return isFinite(v) ? v : d; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function r4(v) { return Math.round(v * 10000) / 10000; }
  function $(id) { return doc.getElementById(id); }
  function el(tag, props, kids) { return HG.ui.el(tag, props, kids); }
  function reduced() { return !!(HG.ui && HG.ui.reducedMotion && HG.ui.reducedMotion()); }
  function now() { return (win.performance && win.performance.now) ? win.performance.now() : Date.now(); }
  function itemOf(id) { return HG.catalog ? HG.catalog.get('room', id) : null; }
  function nameOf(id) { return HG.i18n ? HG.i18n.itemName('room', id) : id; }
  function owns(id) { return !!(HG.unlocks && HG.unlocks.has('room', id)); }
  function announce(txt) { if (HG.ui && HG.ui.announce) HG.ui.announce(txt); }
  function toast(txt, ms) { if (HG.ui && HG.ui.toast) HG.ui.toast(txt, ms ? { ms: ms } : null); }
  function isMobile() { return !!(win.matchMedia && win.matchMedia('(max-width: 720px)').matches); }
  function pad(n, len) { var s = String(Math.max(0, Math.floor(n))); while (s.length < len) s = '0' + s; return s; }

  var uidSeq = 0;
  function newUid() { uidSeq++; return 'r' + Date.now().toString(36) + uidSeq.toString(36); }

  /* ═══════════ State ═══════════ */
  var st = {
    mode: 'edit',
    layout: [],          // [{uid, id, x, y, z, flip}] in render order
    hamin: null,         // {x, y, show, z, flip}
    night: false,
    cat: 'all',
    sel: null,           // uid | 'hamin' | null
    dirty: false, saveTimer: null, finished: false,
    aspect: {},          // item id → art height / width
    lit: {}, neonOff: {}, twinkle: {},
    clicks: 0,           // interactions this visit (TODAY counter)
    sheetOpen: false,
    lookCanvas: null,
    talkLast: 0,
    mood: 1 + Math.floor(Math.random() * MOOD_N)
  };
  var nodes = {};        // uid → {el, fx, art, img, look, bubble}
  var hNode = null;      // Hamin node {el, fx, art, canvases, bubble}
  var dom = {};
  var drag = null, tdrag = null, rafId = 0, suppressUntil = 0, exprTimer = 0, savedTimer = 0;

  /* ═══════════ Geometry ═══════════ */
  function isHamin(p) { return p === st.hamin; }
  function sizeOf(p) {
    if (isHamin(p)) return { w: HAMIN_W, h: HAMIN_W * HAMIN_ASPECT * RATIO };
    var it = itemOf(p.id);
    var w = it ? it.w : 0.1;
    return { w: w, h: w * (st.aspect[p.id] || 1) * RATIO };
  }
  function zoneOf(p) { if (isHamin(p)) return 'floor'; var it = itemOf(p.id); return (it && it.zone) || 'any'; }
  function bottomOf(p) { return p.y + sizeOf(p).h / 2; }
  function defaultZ(it) {
    if (!it) return 3;
    if (FLAT[it.id] || it.zone === 'wall') return 1;
    if (it.zone === 'floor') return 2;
    return 3;
  }
  function maxCopies(it) { return it && it.w <= SMALL_W ? MAX_COPIES : 1; }
  function countOf(id) { var n = 0; for (var i = 0; i < st.layout.length; i++) if (st.layout[i].id === id) n++; return n; }

  /* Allowed rectangle for the item's centre. */
  function range(p) {
    var s = sizeOf(p), zone = zoneOf(p);
    var hw = Math.min(s.w / 2, 0.5), hh = Math.min(s.h / 2, 0.5);
    var r = { x0: hw, x1: 1 - hw, y0: hh, y1: 1 - hh, sy0: hh, sy1: 1 - hh };
    if (zone === 'floor') r.y0 = Math.max(r.y0, FLOOR_MIN_C, FLOOR_LINE - hh);
    else if (zone === 'wall') r.y1 = Math.min(r.y1, WALL_MAX_C, WALL_MAX_B - hh);
    if (r.y0 > r.y1) { var m = zone === 'floor' ? r.y1 : r.y0; r.y0 = r.y1 = m; }
    return r;
  }
  /* → {x, y, zoneBad}: zoneBad = the spot was inside the room but on the wrong surface. */
  function fit(p, x, y) {
    var r = range(p);
    var fx = clamp(x, r.x0, r.x1), fy = clamp(y, r.y0, r.y1);
    var inRoom = y >= r.sy0 - 0.02 && y <= r.sy1 + 0.02;
    return { x: fx, y: fy, zoneBad: inRoom && Math.abs(fy - clamp(y, r.sy0, r.sy1)) > 0.03 };
  }

  /* ═══════════ Model load / save ═══════════ */
  function normalizeEntry(p) {
    if (!p || typeof p !== 'object') return null;
    var it = itemOf(p.id);
    if (!it || !owns(p.id)) return null;
    var z = Number(p.z);
    return {
      uid: (typeof p.uid === 'string' && /^[\w-]{1,40}$/.test(p.uid)) ? p.uid : newUid(),
      id: p.id,
      x: clamp(num(p.x, 0.5), 0, 1), y: clamp(num(p.y, 0.5), 0, 1),
      z: isFinite(z) ? clamp(Math.round(z), Z_MIN, Z_MAX) : defaultZ(it),
      flip: !!p.flip
    };
  }

  function layoutFrom(raw) {
    var out = [], seen = {};
    (raw || []).forEach(function (p) {
      if (out.length >= MAX_ITEMS) return;
      var e = normalizeEntry(p);
      if (!e) return;
      if (seen[e.uid]) e.uid = newUid();
      seen[e.uid] = 1;
      out.push(e);
    });
    // respect copy limits (old / imported saves)
    var counts = {};
    return out.filter(function (e) {
      counts[e.id] = (counts[e.id] || 0) + 1;
      return counts[e.id] <= maxCopies(itemOf(e.id));
    });
  }

  function defaultLayout() { return layoutFrom((HG.data && HG.data.roomDefaultLayout) || []); }

  function loadModel() {
    var r = (S().room && typeof S().room === 'object') ? S().room : {};
    var raw = Array.isArray(r.layout) ? r.layout : [];
    st.layout = (!raw.length && !r.edited) ? defaultLayout() : layoutFrom(raw);
    var h = (r.hamin && typeof r.hamin === 'object') ? r.hamin : {};
    var z = Number(h.z);
    st.hamin = {
      x: clamp(num(h.x, HAMIN_DEF.x), 0, 1), y: clamp(num(h.y, HAMIN_DEF.y), 0, 1),
      show: h.show !== false, z: isFinite(z) ? clamp(Math.round(z), Z_MIN, Z_MAX) : HAMIN_DEF.z, flip: !!h.flip
    };
    st.night = !!r.night;
  }

  function writeSave() {
    if (!HG.save) return;
    var layout = st.layout.map(function (p) {
      return { uid: p.uid, id: p.id, x: r4(p.x), y: r4(p.y), z: p.z, flip: !!p.flip };
    });
    var h = st.hamin;
    HG.save.update(function (d) {
      if (!d.room || typeof d.room !== 'object') d.room = {};
      d.room.layout = layout;
      d.room.hamin = { x: r4(h.x), y: r4(h.y), show: !!h.show, z: h.z, flip: !!h.flip };
      d.room.night = !!st.night;
      d.room.edited = true;
    });
    st.dirty = false;
  }

  function markDirty() {
    st.dirty = true;
    clearTimeout(st.saveTimer);
    st.saveTimer = setTimeout(function () { commit(false); }, SAVE_DELAY);
  }

  /* One save. The first one of this page visit counts as "playing" My Room. */
  function commit(manual) {
    clearTimeout(st.saveTimer);
    st.saveTimer = null;
    writeSave();
    var earned = 0;
    if (!st.finished && HG.unlocks) {
      st.finished = true;
      var res = HG.unlocks.finishGame('my-room', { score: 0 });
      earned = (res && res.earned) || 0;
    }
    if (manual) {
      if (HG.save && HG.save.flush) HG.save.flush();
      sfx('success');
      toast(earned ? t('myRoom.savedBonus', { n: earned }) : t('myRoom.saved'));
      var r = dom.saveBtn.getBoundingClientRect();
      if (HG.ui.sparkleBurst) HG.ui.sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 10);
    } else {
      if (earned) toast(t('myRoom.savedBonus', { n: earned }));
      flashSaved();
    }
    updateStatus();
  }

  function flashSaved() {
    var s = dom.statusSaved;
    if (!s) return;
    s.textContent = t('myRoom.saved');
    s.classList.add('is-on');
    clearTimeout(savedTimer);
    savedTimer = setTimeout(function () { s.classList.remove('is-on'); }, 1600);
  }

  function flushIfDirty() {
    if (!st.dirty) return;
    commit(false);
    if (HG.save && HG.save.flush) HG.save.flush();
  }

  /* ═══════════ Rendering: items ═══════════ */
  function photoSrc() {
    var pb = S().photoBooth;
    var p = pb && pb.lastPhoto;
    var src = typeof p === 'string' ? p : (p && typeof p === 'object' ? (p.thumb || p.src || p.dataUrl || p.dataURL || p.url || p.image) : null);
    if (typeof src !== 'string') return null;
    if (/^data:image\/(png|jpe?g|webp|gif);/i.test(src) || /^assets\/[\w\/.-]+$/.test(src)) return src;
    return null;
  }

  function nodeOf(p) { return !p ? null : isHamin(p) ? hNode : nodes[p.uid]; }
  function modelOf(key) {
    if (key === 'hamin') return st.hamin;
    for (var i = 0; i < st.layout.length; i++) if (st.layout[i].uid === key) return st.layout[i];
    return null;
  }
  function keyOf(p) { return isHamin(p) ? 'hamin' : p.uid; }

  function placeEl(n, x, y) {
    n.el.style.left = (x * 100).toFixed(3) + '%';
    n.el.style.top = (y * 100).toFixed(3) + '%';
  }

  function createItemNode(p) {
    var it = itemOf(p.id);
    var act = it.interactive || null;
    var btn = el('button', {
      type: 'button', class: 'mr-item' + (act ? ' mr-item--act' : '') + (p.flip ? ' is-flip' : ''),
      'data-uid': p.uid, 'data-id': p.id, 'data-act': act, 'data-zone': it.zone
    });
    var fx = el('span', { class: 'mr-item__fx' });
    var art = el('span', { class: 'mr-item__art' });
    var img = HG.ui.img(it.src, { alt: '', emoji: it.emoji, kind: 'room', className: 'mr-item__img' });
    img.addEventListener('load', function () {
      if (!img.naturalWidth) return;
      var a = img.naturalHeight / img.naturalWidth;
      if (st.aspect[p.id] !== a) {
        st.aspect[p.id] = a;
        sortDepth();
        if (st.sel) positionTools();
        updateGlows();
      }
    });
    art.appendChild(img);
    var n = { el: btn, fx: fx, art: art, img: img };

    if (p.id === 'room-framed-look') {
      n.look = el('canvas', { class: 'mr-item__look', width: '180', height: '240', role: 'img', 'aria-label': t('myRoom.look.alt') });
      art.appendChild(n.look);
      paintLook(n);
    }
    if (act === 'photoboard') {
      var src = photoSrc();
      if (src) {
        art.appendChild(el('span', { class: 'mr-item__photo' },
          HG.ui.img(src, { alt: t('myRoom.photo.alt'), emoji: '📸', kind: 'sticker', className: 'mr-item__photoimg' })));
      }
    }
    if (act === 'cdplayer') art.appendChild(el('span', { class: 'mr-item__disc', 'aria-hidden': 'true' }, el('span', { class: 'mr-item__discspin' })));

    fx.appendChild(art);
    btn.appendChild(fx);
    btn.style.width = (it.w * 100).toFixed(3) + '%';
    placeEl(n, p.x, p.y);
    nodes[p.uid] = n;
    dom.items.appendChild(btn);
    syncItemState(p);
    a11yItem(p);
    return n;
  }

  function syncItemState(p) {
    var n = nodes[p.uid];
    if (!n) return;
    n.el.classList.toggle('is-flip', !!p.flip);
    n.el.classList.toggle('is-lit', !!st.lit[p.uid]);
    n.el.classList.toggle('is-off', !!st.neonOff[p.uid]);
    n.el.classList.toggle('is-twinkle', !!st.twinkle[p.uid]);
  }

  function a11yItem(p) {
    var n = nodeOf(p);
    if (!n) return;
    var edit = st.mode === 'edit';
    if (isHamin(p)) {
      n.el.setAttribute('aria-label', t(edit ? 'myRoom.hamin.ariaEdit' : 'myRoom.hamin.aria'));
      n.el.tabIndex = 0;
    } else {
      var it = itemOf(p.id);
      var name = nameOf(p.id);
      var play = !edit && it && it.interactive;
      n.el.setAttribute('aria-label', edit ? t('myRoom.item.ariaEdit', { name: name }) : play ? t('myRoom.item.ariaPlay', { name: name }) : name);
      n.el.tabIndex = (edit || play) ? 0 : -1;
    }
    if (edit) n.el.setAttribute('aria-pressed', String(st.sel === keyOf(p)));
    else n.el.removeAttribute('aria-pressed');
  }
  function a11yAll() { st.layout.forEach(a11yItem); if (hNode) a11yItem(st.hamin); }

  /* Depth: z band, then feet (bottom edge), then previous order. Saved in this order. */
  function sortDepth() {
    var arr = st.layout.slice();
    if (st.hamin.show) arr.push(st.hamin);
    var order = arr.map(function (p, i) { return { p: p, i: i, b: bottomOf(p) }; });
    order.sort(function (a, b) { return (a.p.z - b.p.z) || (a.b - b.b) || (a.i - b.i); });
    order.forEach(function (o, k) {
      var n = nodeOf(o.p);
      if (n && !(drag && drag.p === o.p && drag.moved)) n.el.style.zIndex = String(10 + k);
    });
    st.layout = order.map(function (o) { return o.p; }).filter(function (p) { return !isHamin(p); });
  }

  function renderAllItems() {
    Object.keys(nodes).forEach(function (k) { removeNodeEl(nodes[k]); });
    nodes = {};
    st.layout.forEach(createItemNode);
    syncHamin();
    sortDepth();
    updateGlows();
  }

  function removeNodeEl(n) {
    if (!n) return;
    if (n.bubble) killBubble(n);
    if (n.el.parentNode) n.el.parentNode.removeChild(n.el);
  }

  /* ═══════════ Hamin ═══════════ */
  function buildHamin() {
    var btn = el('button', { type: 'button', class: 'mr-hamin', 'data-key': 'hamin' });
    var bob = el('span', { class: 'mr-hamin__bob' });
    var fx = el('span', { class: 'mr-hamin__fx' });
    var art = el('span', { class: 'mr-hamin__art' }, el('span', { class: 'mr-hamin__ph', 'aria-hidden': 'true' }, '🧑'));
    fx.appendChild(art); bob.appendChild(fx); btn.appendChild(bob);
    btn.style.width = (HAMIN_W * 100) + '%';
    hNode = { el: btn, fx: fx, art: art, canvases: null, expr: 0 };
    dom.items.appendChild(btn);
    syncHamin();
  }

  function syncHamin() {
    if (!hNode) return;
    var h = st.hamin;
    hNode.el.hidden = !h.show;
    hNode.el.classList.toggle('is-flip', !!h.flip);
    placeEl(hNode, h.x, h.y);
    a11yItem(h);
  }

  function showExpr(i) {
    if (!hNode || !hNode.canvases) return;
    var c = hNode.canvases[i] || hNode.canvases[0];
    if (c.parentNode === hNode.art) return;
    hNode.art.textContent = '';
    hNode.art.appendChild(c);
    hNode.expr = i;
  }

  function renderLooks() {
    if (!HG.look) return;
    var base = HG.look.current();
    var srcs = HG.look.layers(base).map(function (l) { return l.src; });
    Promise.all(srcs.map(HG.look.loadImage)).then(function (imgs) {
      var ok = imgs.filter(Boolean).length;
      if (!ok) return;                          // art missing → keep the 🧑 placeholder
      var W = (win.devicePixelRatio || 1) > 1.2 ? 450 : 300;
      var make = function (expr) {
        var o = {}; for (var k in base) if (Object.prototype.hasOwnProperty.call(base, k)) o[k] = base[k];
        if (expr) o.expr = expr;
        return HG.look.render(o, { w: W, h: Math.round(W * 4 / 3) });
      };
      return Promise.all([make(null), make('smile'), make('big')]).then(function (cs) {
        cs.forEach(function (c) { c.className = 'mr-hamin__canvas'; c.setAttribute('aria-hidden', 'true'); });
        hNode.canvases = cs;
        showExpr(0);
      });
    }).catch(function (e) { if (win.console) console.warn('[my-room] look render failed', e); });

    // framed look + profile picture (with the outfit background)
    HG.look.render(base, { w: 180, h: 240, crop: LOOK_CROP, background: true }).then(function (c) {
      st.lookCanvas = c;
      Object.keys(nodes).forEach(function (k) { if (nodes[k].look) paintLook(nodes[k]); });
    }).catch(function () { /* keep the empty frame */ });
    HG.look.render(base, { w: 160, h: 160, crop: HG.look.CROPS.bust, background: true }).then(function (c) {
      c.className = 'mr-info__canvas';
      dom.infoPic.textContent = '';
      dom.infoPic.appendChild(c);
    }).catch(function () { /* keep the emoji */ });
  }

  function paintLook(n) {
    if (!n.look || !st.lookCanvas) return;
    var ctx = n.look.getContext('2d');
    ctx.clearRect(0, 0, n.look.width, n.look.height);
    ctx.drawImage(st.lookCanvas, 0, 0, n.look.width, n.look.height);
  }

  function haminTalk() {
    var i;
    do { i = 1 + Math.floor(Math.random() * TALK_N); } while (i === st.talkLast && TALK_N > 1);
    st.talkLast = i;
    bubble(st.hamin, t('myRoom.talk.t' + i), { cls: 'mr-bubble--talk', ms: 2800 });
    showExpr(Math.random() < 0.5 ? 1 : 2);
    clearTimeout(exprTimer);
    exprTimer = setTimeout(function () { showExpr(0); }, 1900);
    replay(hNode.fx, 'is-hop', 520);
    sfx('pop', { rate: 1.25 });
    countInteraction();
  }

  /* ═══════════ Selection + mini toolbar ═══════════ */
  function buildTools() {
    var tools = el('div', { class: 'mr-tools', role: 'group', i18nAttr: 'aria-label:myRoom.tools.label', hidden: true });
    [['flip', '⇋'], ['front', '▲'], ['back', '▼'], ['remove', '✕']].forEach(function (b) {
      var btn = el('button', { type: 'button', class: 'mr-tools__btn mr-tools__btn--' + b[0], 'data-tool': b[0] }, [
        el('span', { class: 'mr-tools__icon', 'aria-hidden': 'true' }, b[1]),
        el('span', { class: 'mr-tools__label', i18n: 'myRoom.tools.' + b[0] })
      ]);
      tools.appendChild(btn);
    });
    tools.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tool]');
      if (!b) return;
      var p = modelOf(st.sel);
      if (!p) return;
      var tool = b.getAttribute('data-tool');
      if (tool === 'flip') doFlip(p);
      else if (tool === 'front') doLayer(p, 1);
      else if (tool === 'back') doLayer(p, -1);
      else if (tool === 'remove') {
        if (isHamin(p)) { setHaminShown(false); focusAfterRemoval(null); }
        else removeItem(p, true);
      }
    });
    tools.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    dom.tools = tools;
    return tools;
  }

  function select(key) {
    if (st.mode !== 'edit') key = null;
    var prev = st.sel ? modelOf(st.sel) : null;
    if (prev && keyOf(prev) !== key) {
      var pn = nodeOf(prev);
      if (pn) pn.el.classList.remove('is-selected');
    }
    st.sel = key && modelOf(key) ? key : null;
    if (prev) a11yItem(prev);
    if (!st.sel) { hideTools(); return; }
    var p = modelOf(st.sel);
    var n = nodeOf(p);
    n.el.classList.add('is-selected');
    a11yItem(p);
    showTools();
  }

  function showTools() {
    var p = modelOf(st.sel);
    var n = nodeOf(p);
    if (!n || !dom.tools) return;
    var rm = dom.tools.querySelector('[data-tool="remove"] .mr-tools__label');
    var want = isHamin(p) ? 'myRoom.tools.hide' : 'myRoom.tools.remove';
    if (rm.getAttribute('data-i18n') !== want) { rm.setAttribute('data-i18n', want); rm.textContent = t(want); }
    // keep the toolbar right after the item in tab order
    if (n.el.nextSibling !== dom.tools) dom.items.insertBefore(dom.tools, n.el.nextSibling);
    dom.tools.hidden = false;
    positionTools();
  }

  function hideTools() { if (dom.tools) dom.tools.hidden = true; }

  function positionTools() {
    if (!dom.tools || dom.tools.hidden || !st.sel) return;
    var n = nodeOf(modelOf(st.sel));
    if (!n) return;
    var rr = dom.room.getBoundingClientRect(), r = n.el.getBoundingClientRect();
    var tw = dom.tools.offsetWidth, th = dom.tools.offsetHeight;
    var left = clamp(r.left - rr.left + r.width / 2 - tw / 2, 4, Math.max(4, rr.width - tw - 4));
    var top = r.top - rr.top - th - 8;
    if (top < 4) top = r.bottom - rr.top + 8;
    if (top + th > rr.height - 4) top = clamp(r.top - rr.top + 6, 4, Math.max(4, rr.height - th - 4));
    dom.tools.style.left = Math.round(left) + 'px';
    dom.tools.style.top = Math.round(top) + 'px';
  }

  function doFlip(p) {
    p.flip = !p.flip;
    if (isHamin(p)) syncHamin(); else syncItemState(p);
    sfx('whoosh', { rate: 1.4 });
    announce(t('myRoom.msg.flipped'));
    markDirty();
  }

  function doLayer(p, dir) {
    var z = clamp(p.z + dir, Z_MIN, Z_MAX);
    if (z === p.z) { sfx('error'); return; }
    p.z = z;
    sortDepth();
    sfx('tick', { rate: dir > 0 ? 1.2 : 0.85 });
    announce(t(dir > 0 ? 'myRoom.msg.front' : 'myRoom.msg.back'));
    markDirty();
  }

  /* ═══════════ Add / move / remove ═══════════ */
  function autoSpot(p) {
    var s = sizeOf(p), zone = zoneOf(p);
    var y = zone === 'wall' ? 0.3 : 0.92 - s.h / 2;
    var xs = [0.5, 0.32, 0.68, 0.18, 0.82, 0.42, 0.58, 0.25, 0.75];
    for (var i = 0; i < xs.length; i++) {
      var x = xs[i], free = true;
      for (var j = 0; j < st.layout.length && free; j++) {
        var q = st.layout[j];
        if (q === p) continue;
        var qs = sizeOf(q);
        var vOverlap = Math.abs(q.y - y) < (qs.h + s.h) / 2 * 0.8;
        if (vOverlap && Math.abs(q.x - x) < (qs.w + s.w) / 2 * 0.75) free = false;
      }
      if (free) return { x: x, y: y };
    }
    return { x: 0.35 + Math.random() * 0.3, y: y };
  }

  function addItem(id, x, y, opts) {
    opts = opts || {};
    var it = itemOf(id);
    if (!it || !owns(id)) return null;
    var have = countOf(id), max = maxCopies(it);
    if (have >= max) {
      if (max === 1) {
        var ex = null;
        st.layout.forEach(function (q) { if (q.id === id) ex = q; });
        if (ex) { if (st.mode === 'edit') select(ex.uid); bubble(ex, t('myRoom.msg.already', { name: nameOf(id) })); }
      } else {
        toast(t('myRoom.msg.maxCopies', { name: nameOf(id) }));
      }
      sfx('error');
      return null;
    }
    if (st.layout.length >= MAX_ITEMS) { toast(t('myRoom.msg.full')); sfx('error'); return null; }
    var p = { uid: newUid(), id: id, x: 0.5, y: 0.5, z: defaultZ(it), flip: false };
    var spot = (x == null || y == null) ? autoSpot(p) : { x: x, y: y };
    p.x = clamp(spot.x, 0, 1); p.y = clamp(spot.y, 0, 1);
    st.layout.push(p);
    var n = createItemNode(p);
    if (!reduced()) replay(n.fx, 'is-new', 420);
    settle(p, p.x, p.y, true);
    if (st.mode === 'edit') select(p.uid);
    if (opts.focus) { try { n.el.focus({ preventScroll: true }); } catch (e) { n.el.focus(); } }
    sfx('pop');
    announce(t('myRoom.msg.placed', { name: nameOf(id) }));
    if (HG.unlocks) HG.unlocks.track({ inc: { 'room.placed': 1 } });
    renderTiles();
    updateStatus();
    renderInfo();
    markDirty();
    return p;
  }

  /* Put p at (x, y); if that is not allowed, spring back into the nearest allowed spot. */
  function settle(p, x, y, quietZone) {
    var f = fit(p, x, y);
    var n = nodeOf(p);
    var moved = Math.abs(f.x - x) > 0.0005 || Math.abs(f.y - y) > 0.0005;
    if (n && moved && !reduced()) {
      n.el.classList.add('is-snap');
      clearTimeout(n.snapTimer);
      n.snapTimer = setTimeout(function () { n.el.classList.remove('is-snap'); positionTools(); }, 460);
    }
    p.x = f.x; p.y = f.y;
    if (n) placeEl(n, p.x, p.y);
    if (f.zoneBad && !quietZone) {
      var z = zoneOf(p);
      if (z === 'floor' || z === 'wall') {
        setTimeout(function () { bubble(p, t('myRoom.msg.' + z), { ms: 1800 }); }, reduced() ? 0 : 380);
        sfx('tick', { rate: 0.7 });
      }
    }
    sortDepth();
    updateGlows();
    positionTools();
    return f;
  }

  function nudge(p, dx, dy) {
    var f = fit(p, p.x + dx, p.y + dy);
    p.x = f.x; p.y = f.y;
    placeEl(nodeOf(p), p.x, p.y);
    sortDepth();
    updateGlows();
    positionTools();
    markDirty();
  }

  function removeItem(p, viaKeyboardOrTool) {
    var n = nodes[p.uid];
    var idx = st.layout.indexOf(p);
    if (idx < 0) return;
    var hadFocus = n && (n.el === doc.activeElement || (dom.tools && dom.tools.contains(doc.activeElement)));
    if (st.sel === p.uid) select(null);
    st.layout.splice(idx, 1);
    delete st.lit[p.uid]; delete st.neonOff[p.uid]; delete st.twinkle[p.uid];
    removeNodeEl(n);
    delete nodes[p.uid];
    sortDepth();
    updateGlows();
    sfx('whoosh');
    announce(t('myRoom.msg.removed', { name: nameOf(p.id) }));
    if (hadFocus || viaKeyboardOrTool) focusAfterRemoval(n);
    renderTiles();
    updateStatus();
    renderInfo();
    markDirty();
  }

  function focusAfterRemoval() {
    var list = dom.items.querySelectorAll('.mr-item, .mr-hamin:not([hidden])');
    var target = list.length ? list[0] : dom.room;
    try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
  }

  function setHaminShown(show) {
    if (st.hamin.show === !!show) return;
    st.hamin.show = !!show;
    if (!show && st.sel === 'hamin') select(null);
    if (show) st.hamin.x = fit(st.hamin, st.hamin.x, st.hamin.y).x;
    syncHamin();
    sortDepth();
    dom.haminBtn.setAttribute('aria-pressed', String(!!show));
    toast(t(show ? 'myRoom.hamin.back' : 'myRoom.hamin.hidden'));
    sfx(show ? 'pop' : 'whoosh');
    markDirty();
  }

  /* ═══════════ Bubbles, glows, little effects ═══════════ */
  function replay(node, cls, ms) {
    if (!node || reduced()) return;
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
    clearTimeout(node['_t' + cls]);
    node['_t' + cls] = setTimeout(function () { node.classList.remove(cls); }, ms);
  }

  function killBubble(n) {
    if (!n || !n.bubble) return;
    clearTimeout(n.bubble._timer);
    if (n.bubble.parentNode) n.bubble.parentNode.removeChild(n.bubble);
    n.bubble = null;
  }

  function bubble(p, text, opts) {
    opts = opts || {};
    var n = nodeOf(p);
    if (!n || n.el.hidden) { announce(text); return; }
    killBubble(n);
    var b = el('div', { class: 'mr-bubble' + (opts.cls ? ' ' + opts.cls : ''), 'aria-hidden': 'true' }, text);
    dom.pop.appendChild(b);
    var rr = dom.room.getBoundingClientRect(), r = n.el.getBoundingClientRect();
    var bw = b.offsetWidth, bh = b.offsetHeight;
    var ax = r.left - rr.left + r.width / 2;
    var left = clamp(ax - bw / 2, 4, Math.max(4, rr.width - bw - 4));
    var top = r.top - rr.top - bh - 10;
    if (top < 4) { top = Math.min(r.bottom - rr.top + 10, rr.height - bh - 4); b.classList.add('is-below'); }
    b.style.left = Math.round(left) + 'px';
    b.style.top = Math.round(top) + 'px';
    b.style.setProperty('--tail', Math.round(clamp(ax - left, 12, bw - 12)) + 'px');
    announce(text);
    n.bubble = b;
    b._timer = setTimeout(function () { if (n.bubble === b) killBubble(n); }, opts.ms || 2400);
  }

  function glowKind(p) {
    var it = itemOf(p.id);
    var a = it && it.interactive;
    if (a === 'lamp') return st.lit[p.uid] ? GLOW.lamp : null;
    if (a === 'window') return st.night ? GLOW.window : null;
    if (a === 'neon') return (st.night && !st.neonOff[p.uid]) ? GLOW.neon : null;
    if (a === 'lights') return st.twinkle[p.uid] ? GLOW.lights : null;
    return null;
  }

  function updateGlows() {
    if (!dom.fx) return;
    dom.fx.textContent = '';
    st.layout.forEach(function (p) {
      var g = glowKind(p);
      if (!g) return;
      var s = sizeOf(p);
      var d = el('span', { class: 'mr-glow mr-glow--' + g.k });
      d.style.left = (p.x * 100).toFixed(2) + '%';
      d.style.top = ((p.y + s.h * g.dy) * 100).toFixed(2) + '%';
      d.style.width = (s.w * g.s * 100).toFixed(2) + '%';
      dom.fx.appendChild(d);
    });
  }

  function floatNotes(p) {
    if (reduced()) return;
    var n = nodeOf(p);
    if (!n) return;
    var rr = dom.room.getBoundingClientRect(), r = n.el.getBoundingClientRect();
    ['♪', '♫', '♪'].forEach(function (g, i) {
      var s = el('span', { class: 'mr-note mr-note--' + i, 'aria-hidden': 'true' }, g);
      s.style.left = Math.round(r.left - rr.left + r.width * (0.3 + i * 0.22)) + 'px';
      s.style.top = Math.round(r.top - rr.top + r.height * 0.2) + 'px';
      s.style.animationDelay = (i * 0.28) + 's';
      dom.pop.appendChild(s);
      setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 2200);
    });
  }

  function playJingle(j) {
    var A = HG.audio;
    if (!A || !A.note || (A.isMuted && A.isMuted())) return;
    var ctx;
    try { ctx = A.ctx; } catch (e) { return; }
    if (!ctx) return;
    var t0 = ctx.currentTime + 0.04;
    j.notes.forEach(function (m, i) {
      if (m == null) return;
      A.note({ midi: m, dur: j.step * 1.6, wave: 'triangle', vol: 0.085, when: t0 + i * j.step });
      A.note({ midi: m - 12, dur: j.step * 0.8, wave: 'sine', vol: 0.05, when: t0 + i * j.step });
    });
  }

  /* ═══════════ VIEW-mode interactions ═══════════ */
  function countInteraction(extra) {
    st.clicks++;
    var inc = { 'room.interactions': 1 };
    if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) inc[k] = extra[k];
    if (HG.unlocks) HG.unlocks.track({ inc: inc });
    updateStatus();
  }

  var ACTIONS = {
    lamp: function (p) {
      var on = st.lit[p.uid] = !st.lit[p.uid];
      syncItemState(p);
      updateGlows();
      sfx('tick', { rate: on ? 1.3 : 0.8 });
      bubble(p, t(on ? 'myRoom.act.lampOn' : 'myRoom.act.lampOff'));
    },
    cdplayer: function (p, n) {
      var i = Number(S().stats && S().stats['room.cdClicks']) || 0;
      var j = JINGLES[i % JINGLES.length];
      playJingle(j);
      n.el.classList.add('is-playing');
      clearTimeout(n.playTimer);
      n.playTimer = setTimeout(function () { n.el.classList.remove('is-playing'); }, j.notes.length * j.step * 1000 + 500);
      floatNotes(p);
      bubble(p, t('myRoom.act.nowPlaying', { title: t('myRoom.act.' + j.key) }), { ms: 2600 });
    },
    window: function (p) {
      st.night = !st.night;
      dom.room.classList.toggle('is-night', st.night);
      updateGlows();
      sfx(st.night ? 'sparkle' : 'powerup', { rate: st.night ? 0.8 : 1 });
      bubble(p, t(st.night ? 'myRoom.act.night' : 'myRoom.act.day'));
      if (HG.save) HG.save.update(function (d) { if (d.room && typeof d.room === 'object') d.room.night = st.night; });
    },
    camera: function (p) {
      sfx('shutter');
      if (!reduced()) replay(dom.flash, 'is-on', 520);
      bubble(p, t('myRoom.act.camera'));
    },
    photoboard: function (p) {
      var src = photoSrc();
      if (!src) { sfx('tick'); bubble(p, t('myRoom.photo.none'), { ms: 3000 }); return; }
      sfx('click');
      openPhoto(src);
    },
    clock: function (p) {
      var d = new Date(), txt;
      try { txt = d.toLocaleTimeString(HG.i18n ? HG.i18n.htmlLang() : 'en', { hour: 'numeric', minute: '2-digit' }); }
      catch (e) { txt = pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2); }
      sfx('tick');
      setTimeout(function () { sfx('tick', { rate: 1.2 }); }, 180);
      bubble(p, t('myRoom.act.clock', { time: txt }), { ms: 3200 });
    },
    neon: function (p, n) {
      var off = st.neonOff[p.uid] = !st.neonOff[p.uid];
      if (!off) replay(n.el, 'is-blink', 900);
      syncItemState(p);
      updateGlows();
      sfx('tick', { rate: off ? 0.7 : 1.5 });
      bubble(p, t(off ? 'myRoom.act.neonOff' : 'myRoom.act.neonOn'));
    },
    lights: function (p) {
      var on = st.twinkle[p.uid] = !st.twinkle[p.uid];
      syncItemState(p);
      updateGlows();
      sfx(on ? 'sparkle' : 'tick');
      bubble(p, t(on ? 'myRoom.act.lightsOn' : 'myRoom.act.lightsOff'));
    },
    plush: function (p, n) {
      replay(n.fx, 'is-squish', 560);
      sfx('pop', { rate: 0.8 + Math.random() * 0.5 });
      bubble(p, t('myRoom.act.plush'), { ms: 1600 });
    },
    starjar: function (p, n) {
      var r = n.el.getBoundingClientRect();
      if (HG.ui.sparkleBurst) HG.ui.sparkleBurst(r.left + r.width / 2, r.top + r.height * 0.4, 16);
      replay(n.fx, 'is-glint', 700);
      sfx('sparkle');
      bubble(p, t('myRoom.act.starjar'));
    },
    laptop: function () {
      sfx('click');
      openLaptop();
    }
  };

  function interact(p) {
    var n = nodeOf(p);
    if (!n) return;
    var it = itemOf(p.id);
    var kind = it && it.interactive;
    var fn = kind && ACTIONS[kind];
    if (!fn) { replay(n.fx, 'is-wiggle', 450); sfx('hover'); return; }
    fn(p, n);
    if (kind === 'cdplayer') {
      countInteraction({ 'room.cdClicks': 1 });
      var plays = Number(S().stats && S().stats['room.cdClicks']) || 0;
      if (plays >= 10 && HG.unlocks) HG.unlocks.secret('cdDj');
    } else {
      countInteraction();
    }
  }

  function openPhoto(src) {
    var fig = el('figure', { class: 'mr-photo' }, [
      HG.ui.img(src, { alt: t('myRoom.photo.alt'), emoji: '📸', kind: 'sticker', className: 'mr-photo__img' }),
      el('figcaption', { class: 'mr-photo__cap', i18n: 'myRoom.photo.caption' })
    ]);
    HG.ui.modal({
      titleKey: 'myRoom.photo.title', className: 'mr-photo-modal', body: fig,
      buttons: [
        { labelKey: 'myRoom.photo.go', onClick: function () { win.location.href = 'photo-booth.html'; } },
        { labelKey: 'common.close', primary: true }
      ]
    });
  }

  function openLaptop() {
    var games = ['dress-up', 'photo-booth', 'run-hamin', 'lunch-time', 'practice-room'];
    var links = games.map(function (id) {
      var g = HG.catalog && HG.catalog.game(id);
      if (!g || !g.href) return null;
      return el('li', null, el('a', { class: 'mr-pc__link', href: g.href, 'data-sfx': 'click' }, [
        el('span', { class: 'mr-pc__linkicon', 'aria-hidden': 'true' }, g.icon || '♡'),
        el('span', { i18n: g.titleKey })
      ]));
    });
    var visitor = pad((S().visitorNo) || 1528, 6);
    var body = el('div', { class: 'mr-pc' }, [
      el('div', { class: 'mr-pc__chrome' }, [
        el('span', { class: 'mr-pc__navbtns', role: 'img', i18nAttr: 'aria-label:myRoom.laptop.nav' },
          ['◀', '▶', '⟳'].map(function (g) { return el('span', { class: 'mr-pc__navbtn', 'aria-hidden': 'true' }, g); })),
        el('span', { class: 'mr-pc__addr', i18n: 'myRoom.laptop.address' })
      ]),
      el('div', { class: 'mr-pc__page' }, [
        el('p', { class: 'mr-pc__logo' }, [el('span', { 'aria-hidden': 'true' }, '★ '), el('span', { i18n: 'common.brand' }), el('span', { 'aria-hidden': 'true' }, ' ★')]),
        el('p', { class: 'mr-pc__welcome', i18n: 'myRoom.laptop.welcome' }),
        el('p', { class: 'mr-pc__construction' }, [el('span', { class: 'mr-pc__cone', 'aria-hidden': 'true' }, '🚧 '), el('span', { i18n: 'myRoom.laptop.construction' })]),
        el('div', { class: 'mr-pc__box' }, [
          el('p', { class: 'mr-pc__boxtitle', i18n: 'myRoom.laptop.news' }),
          el('ul', { class: 'mr-pc__news' }, [
            el('li', { i18n: 'myRoom.laptop.news1' }), el('li', { i18n: 'myRoom.laptop.news2' }), el('li', { i18n: 'myRoom.laptop.news3' })
          ])
        ]),
        el('p', { class: 'mr-pc__boxtitle mr-pc__boxtitle--links', i18n: 'myRoom.laptop.links' }),
        el('ul', { class: 'mr-pc__links' }, links),
        el('p', { class: 'mr-pc__counter' }, t('footer.visitor', { n: visitor }))
      ])
    ]);
    HG.ui.modal({ titleKey: 'myRoom.laptop.title', className: 'mr-laptop-modal', body: body });
  }

  /* ═══════════ Room pointer / keyboard ═══════════ */
  function keyFromEl(x) {
    if (!x) return null;
    if (x === (hNode && hNode.el)) return 'hamin';
    return x.getAttribute('data-uid');
  }

  function onRoomPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (drag || tdrag) return;
    var x = e.target.closest ? e.target.closest('.mr-item, .mr-hamin') : null;
    if (!x || !dom.items.contains(x)) {
      if (st.mode === 'edit' && !(dom.tools && dom.tools.contains(e.target))) select(null);
      return;
    }
    var key = keyFromEl(x);
    var p = modelOf(key);
    if (!p) return;
    var canDrag = st.mode === 'edit' || key === 'hamin';
    if (!canDrag) return;           // VIEW-mode items just get a normal click
    e.preventDefault();
    try { x.focus({ preventScroll: true }); } catch (err) { x.focus(); }
    if (st.mode === 'edit') select(key);
    drag = { key: key, p: p, el: x, n: nodeOf(p), id: e.pointerId, sx: e.clientX, sy: e.clientY,
             ox: p.x, oy: p.y, nx: p.x, ny: p.y, moved: false, rect: dom.room.getBoundingClientRect() };
    try { x.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    doc.addEventListener('pointermove', onDragMove);
    doc.addEventListener('pointerup', onDragEnd);
    doc.addEventListener('pointercancel', onDragCancel);
  }

  function onDragMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved) {
      if (dx * dx + dy * dy < 36) return;
      drag.moved = true;
      drag.el.classList.add('is-dragging');
      drag.n.el.style.zIndex = '450';
      hideTools();
      killBubble(drag.n);
      showZone(drag.p);
      dom.room.classList.add('is-dragging');
    }
    drag.nx = clamp(drag.ox + dx / drag.rect.width, -0.05, 1.05);
    drag.ny = clamp(drag.oy + dy / drag.rect.height, -0.05, 1.05);
    drag.cx = e.clientX; drag.cy = e.clientY;
    if (!rafId) rafId = win.requestAnimationFrame(dragFrame);
  }

  function dragFrame() {
    rafId = 0;
    if (!drag || !drag.moved) return;
    placeEl(drag.n, drag.nx, drag.ny);
    var f = fit(drag.p, drag.nx, drag.ny);
    drag.el.classList.toggle('is-bad', f.zoneBad);
    if (!isHamin(drag.p)) {
      var saved = { x: drag.p.x, y: drag.p.y };
      drag.p.x = drag.nx; drag.p.y = drag.ny;
      updateGlows();
      drag.p.x = saved.x; drag.p.y = saved.y;
    }
    setDropTarget(!isHamin(drag.p) && overInventory(drag.cx, drag.cy));
  }

  function endDragListeners() {
    doc.removeEventListener('pointermove', onDragMove);
    doc.removeEventListener('pointerup', onDragEnd);
    doc.removeEventListener('pointercancel', onDragCancel);
    if (rafId) { win.cancelAnimationFrame(rafId); rafId = 0; }
  }

  function cleanupDragVisual(d) {
    d.el.classList.remove('is-dragging', 'is-bad');
    dom.room.classList.remove('is-dragging');
    hideZone();
    setDropTarget(false);
  }

  function onDragEnd(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag;
    drag = null;
    endDragListeners();
    if (!d.moved) return;        // a plain click → the click handler takes over
    suppressUntil = now() + 400;
    cleanupDragVisual(d);
    if (!isHamin(d.p) && overInventory(e.clientX, e.clientY)) { removeItem(d.p); return; }
    placeEl(d.n, d.nx, d.ny);
    settle(d.p, d.nx, d.ny);
    if (st.mode === 'edit' && st.sel === d.key) showTools();
    sfx('pop', { rate: 0.9 });
    markDirty();
  }

  function onDragCancel(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag;
    drag = null;
    endDragListeners();
    if (!d.moved) return;
    cleanupDragVisual(d);
    placeEl(d.n, d.ox, d.oy);
    sortDepth();
    updateGlows();
    if (st.sel === d.key) showTools();
  }

  function onRoomClick(e) {
    var x = e.target.closest ? e.target.closest('.mr-item, .mr-hamin') : null;
    if (!x || !dom.items.contains(x)) return;
    if (now() < suppressUntil) return;
    var key = keyFromEl(x);
    var p = modelOf(key);
    if (!p) return;
    if (key === 'hamin') { if (st.mode === 'edit') select('hamin'); haminTalk(); return; }
    if (st.mode === 'edit') { select(key); return; }
    interact(p);
  }

  function onRoomKey(e) {
    var x = e.target.closest ? e.target.closest('.mr-item, .mr-hamin') : null;
    if (!x || !dom.items.contains(x)) {
      if ((e.key === 'Escape' || e.key === 'Esc') && st.sel && dom.tools && dom.tools.contains(e.target)) {
        var back = nodeOf(modelOf(st.sel));
        if (back) back.el.focus();
      }
      return;
    }
    var key = keyFromEl(x);
    var p = modelOf(key);
    if (!p) return;
    var edit = st.mode === 'edit';
    var movable = edit || key === 'hamin';
    var step = e.shiftKey ? 0.05 : 0.01;
    var k = e.key;
    if (movable && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown')) {
      e.preventDefault();
      if (edit && st.sel !== key) select(key);
      nudge(p, k === 'ArrowLeft' ? -step : k === 'ArrowRight' ? step : 0,
               k === 'ArrowUp' ? -step * RATIO : k === 'ArrowDown' ? step * RATIO : 0);
      return;
    }
    if (!edit) return;
    if (k === 'f' || k === 'F') { e.preventDefault(); doFlip(p); }
    else if (k === ']' || k === 'PageUp') { e.preventDefault(); doLayer(p, 1); }
    else if (k === '[' || k === 'PageDown') { e.preventDefault(); doLayer(p, -1); }
    else if (k === 'Delete' || k === 'Backspace') {
      e.preventDefault();
      if (key === 'hamin') { setHaminShown(false); focusAfterRemoval(); }
      else removeItem(p, true);
    } else if (k === 'Escape' || k === 'Esc') {
      if (st.sel) { e.preventDefault(); select(null); }
    } else if (k === 'Enter' && key !== 'hamin' && dom.tools && !dom.tools.hidden) {
      e.preventDefault();
      var first = dom.tools.querySelector('button');
      if (first) first.focus();
    }
  }

  function onRoomFocus(e) {
    if (st.mode !== 'edit') return;
    var x = e.target.closest ? e.target.closest('.mr-item, .mr-hamin') : null;
    if (x && dom.items.contains(x)) select(keyFromEl(x));
  }

  /* zone guide while dragging */
  function showZone(p) {
    var z = zoneOf(p);
    dom.zone.setAttribute('data-zone', z === 'floor' || z === 'wall' ? z : 'any');
    dom.zone.classList.add('is-on');
  }
  function hideZone() { dom.zone.classList.remove('is-on'); }

  function overInventory(x, y) {
    if (st.mode !== 'edit' || dom.inv.hidden) return false;
    var r = dom.inv.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }
  function setDropTarget(on) { dom.inv.classList.toggle('is-drop', !!on); }

  /* ═══════════ Inventory ═══════════ */
  function cats() { return ['all'].concat((HG.data && HG.data.roomCats) || []); }
  function catLabel(c) { return c === 'all' ? t('myRoom.inv.all') : t('roomCat.' + c); }
  function roomItems() { return (HG.data && HG.data.roomItems) || []; }

  function renderCats() {
    var box = dom.cats;
    box.textContent = '';
    cats().forEach(function (c) {
      var sel = c === st.cat;
      var b = el('button', {
        type: 'button', role: 'tab', class: 'mr-cat', id: 'mr-cat-' + c, 'data-cat': c,
        'aria-selected': String(sel), tabindex: sel ? '0' : '-1', 'aria-controls': 'mr-inv-panel',
        'aria-label': catLabel(c), title: catLabel(c)
      }, el('span', { class: 'mr-cat__icon', 'aria-hidden': 'true' }, CAT_ICON[c] || '♡'));
      box.appendChild(b);
    });
  }

  function setCat(c, focus) {
    if (cats().indexOf(c) < 0) c = 'all';
    st.cat = c;
    Array.prototype.forEach.call(dom.cats.querySelectorAll('.mr-cat'), function (b) {
      var on = b.getAttribute('data-cat') === c;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    dom.tilesPanel.scrollTop = 0;
    renderTiles();
  }

  function tileState(it) {
    var s = HG.unlocks ? HG.unlocks.status('room', it.id) : { owned: true, type: 'default' };
    if (s.owned) {
      var n = countOf(it.id), max = maxCopies(it);
      return { s: s, n: n, state: n >= max ? (max === 1 ? 'placed' : 'max') : (n ? 'copies' : 'owned') };
    }
    return { s: s, n: 0, state: s.type === 'hpoint' ? 'buy' : 'rule' };
  }

  function tileFor(it) {
    var ts = tileState(it), s = ts.s, name = nameOf(it.id);
    var label, chip = null;
    switch (ts.state) {
      case 'owned': label = t('myRoom.inv.tileOwned', { name: name }); break;
      case 'copies':
        label = t('myRoom.inv.tileCopies', { name: name, n: ts.n });
        chip = el('span', { class: 'mr-tile__chip mr-tile__chip--count' }, t('myRoom.inv.copies', { n: ts.n }));
        break;
      case 'max':
        label = t('myRoom.inv.tileMax', { name: name, n: ts.n });
        chip = el('span', { class: 'mr-tile__chip mr-tile__chip--count' }, t('myRoom.inv.copies', { n: ts.n }));
        break;
      case 'placed':
        label = t('myRoom.inv.tilePlaced', { name: name });
        chip = el('span', { class: 'mr-tile__chip mr-tile__chip--placed' }, '✓ ' + t('myRoom.inv.placed'));
        break;
      case 'buy':
        label = t('myRoom.inv.tileBuy', { name: name, cost: HG.ui.formatNum(s.cost) });
        chip = el('span', { class: 'mr-tile__chip mr-tile__chip--cost' + (s.affordable ? ' is-affordable' : '') }, HG.ui.formatNum(s.cost));
        break;
      default:
        label = t('myRoom.inv.tileRule', { name: name, hint: t(s.hintKey || (it.unlock && it.unlock.hintKey) || 'hint.default') });
        chip = el('span', { class: 'mr-tile__chip mr-tile__chip--rule', 'aria-hidden': 'true' }, '?');
    }
    var locked = ts.state === 'buy' || ts.state === 'rule';
    var btn = el('button', {
      type: 'button', class: 'mr-tile mr-tile--' + ts.state + (locked ? ' hg-locked' : ''),
      'data-id': it.id, 'data-state': ts.state, 'aria-label': label
    }, [
      el('span', { class: 'mr-tile__pic' }, HG.ui.itemIcon('room', it.id, { alt: '' })),
      el('span', { class: 'mr-tile__name', 'aria-hidden': 'true' }, ts.state === 'rule' ? '???' : name),
      chip
    ]);
    return el('li', { class: 'mr-tiles__cell' }, btn);
  }

  var STATE_ORDER = { owned: 0, copies: 0, max: 1, placed: 1, buy: 2, rule: 3 };
  function renderTiles() {
    if (!dom.tiles) return;
    var focusedId = null;
    var ae = doc.activeElement;
    if (ae && dom.tiles.contains(ae) && ae.classList.contains('mr-tile')) focusedId = ae.getAttribute('data-id');
    var all = roomItems();
    var list = all.filter(function (it) { return st.cat === 'all' || it.cat === st.cat; });
    var decorated = list.map(function (it, i) {
      var ts = tileState(it);
      return { it: it, i: i, o: STATE_ORDER[ts.state], c: ts.s.cost || 0 };
    });
    decorated.sort(function (a, b) { return (a.o - b.o) || (a.o === 2 ? a.c - b.c : 0) || (a.i - b.i); });
    dom.tiles.textContent = '';
    var frag = doc.createDocumentFragment();
    decorated.forEach(function (d) { frag.appendChild(tileFor(d.it)); });
    dom.tiles.appendChild(frag);
    var again = focusedId ? dom.tiles.querySelector('.mr-tile[data-id="' + focusedId + '"]') : null;
    if (again) { again.focus({ preventScroll: true }); setHint(again); }
    else setHint(null);
    var ownedHere = list.filter(function (it) { return owns(it.id); }).length;
    var ownedAll = all.filter(function (it) { return owns(it.id); }).length;
    dom.invCat.textContent = (CAT_ICON[st.cat] || '♡') + ' ' + catLabel(st.cat);
    dom.invCount.textContent = t('myRoom.inv.count', { owned: ownedHere, total: list.length });
    dom.sheetCount.textContent = t('myRoom.inv.count', { owned: ownedAll, total: all.length });
  }

  function hintText(id) {
    var it = itemOf(id);
    var s = HG.unlocks ? HG.unlocks.status('room', id) : {};
    return t(s.hintKey || (it && it.unlock && it.unlock.hintKey) || 'hint.default');
  }

  /* The little line under the grid explains whatever tile is hovered / focused. */
  function setHint(tile) {
    var h = dom.invHint;
    if (!h) return;
    var state = tile && tile.getAttribute('data-state');
    var id = tile && tile.getAttribute('data-id');
    var lock = state === 'rule' || state === 'buy';
    if (!tile) h.textContent = t('myRoom.inv.hint');
    else if (state === 'rule') h.textContent = '🔒 ' + nameOf(id) + ' — ' + hintText(id);
    else if (state === 'buy') h.textContent = '🔒 ' + nameOf(id) + ' — ' + t('unlock.hpoint', { cost: HG.ui.formatNum(HG.unlocks.status('room', id).cost) });
    else h.textContent = '♡ ' + nameOf(id) + ' — ' + t('myRoom.inv.hint');
    h.classList.toggle('is-lock', !!lock);
  }

  function onTileClick(e) {
    var b = e.target.closest ? e.target.closest('.mr-tile') : null;
    if (!b) return;
    if (now() < suppressUntil) return;
    var id = b.getAttribute('data-id');
    var state = b.getAttribute('data-state');
    if (state === 'owned' || state === 'copies') { addItem(id, null, null, { focus: e.detail === 0 }); return; }
    if (state === 'placed') { addItem(id); return; }          // selects + "already in the room" bubble
    if (state === 'max') { toast(t('myRoom.msg.maxCopies', { name: nameOf(id) })); sfx('error'); return; }
    if (state === 'buy') { buyFlow(id, b); return; }
    sfx('tick');
    setHint(b);
    toast('🔒 ' + hintText(id), 4200);
  }

  function buyFlow(id, tile) {
    var s = HG.unlocks.status('room', id);
    var name = nameOf(id);
    if (!s.affordable) {
      sfx('error');
      var have = Number(S().hpoint) || 0;
      toast(t('hpoint.notEnough') + ' ' + t('myRoom.buy.need', { n: HG.ui.formatNum(Math.max(0, s.cost - have)) }), 3600);
      return;
    }
    HG.ui.confirm({
      titleKey: 'myRoom.buy.title',
      text: t('unlock.confirm', { name: name, cost: HG.ui.formatNum(s.cost) }),
      okKey: 'unlock.buy'
    }).then(function (yes) {
      if (!yes) return;
      var r = HG.unlocks.buy('room', id);
      if (r && r.ok) {
        sfx('unlock');
        toast(t('myRoom.buy.done', { name: name }));
        renderTiles();
        renderInfo();
        var again = dom.tiles.querySelector('.mr-tile[data-id="' + id + '"]');
        if (again) {
          var rr = again.getBoundingClientRect();
          if (HG.ui.sparkleBurst) HG.ui.sparkleBurst(rr.left + rr.width / 2, rr.top + rr.height / 2, 12);
          again.focus({ preventScroll: true });
        }
      } else {
        sfx('error');
        toast(r && r.reason === 'notEnough' ? t('hpoint.notEnough') : r && r.reason === 'owned' ? t('hpoint.owned') : t('unlock.notEnough'));
        renderTiles();
      }
    });
  }

  function onCatsClick(e) {
    var b = e.target.closest ? e.target.closest('.mr-cat') : null;
    if (!b) return;
    sfx('click');
    setCat(b.getAttribute('data-cat'), false);
  }
  function onCatsKey(e) {
    var list = cats();
    var i = list.indexOf(st.cat);
    var k = e.key, j = -1;
    if (k === 'ArrowRight' || k === 'ArrowDown') j = (i + 1) % list.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') j = (i - 1 + list.length) % list.length;
    else if (k === 'Home') j = 0;
    else if (k === 'End') j = list.length - 1;
    if (j < 0) return;
    e.preventDefault();
    sfx('tick');
    setCat(list[j], true);
  }

  /* Drag a tile into the room: mouse → after a small move; touch/pen → after a long press. */
  function onTileDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (drag || tdrag || st.mode !== 'edit') return;
    var b = e.target.closest ? e.target.closest('.mr-tile') : null;
    if (!b) return;
    var state = b.getAttribute('data-state');
    if (state !== 'owned' && state !== 'copies') return;
    tdrag = { id: b.getAttribute('data-id'), tile: b, pid: e.pointerId, sx: e.clientX, sy: e.clientY, cx: e.clientX, cy: e.clientY,
              mouse: e.pointerType === 'mouse', started: false, timer: 0 };
    if (!tdrag.mouse) {
      tdrag.timer = setTimeout(function () { if (tdrag && !tdrag.started) startTileDrag(); }, 280);
    }
    doc.addEventListener('pointermove', onTileMove);
    doc.addEventListener('pointerup', onTileUp);
    doc.addEventListener('pointercancel', onTileCancel);
  }

  function startTileDrag() {
    var it = itemOf(tdrag.id);
    if (!it) return;
    tdrag.started = true;
    var rr = dom.room.getBoundingClientRect();
    var w = Math.max(40, it.w * rr.width);
    var ghost = el('div', { class: 'mr-ghost', 'aria-hidden': 'true' },
      HG.ui.img(it.src, { alt: '', emoji: it.emoji, kind: 'room', className: 'mr-ghost__img' }));
    ghost.style.width = Math.round(w) + 'px';
    doc.body.appendChild(ghost);
    tdrag.ghost = ghost;
    tdrag.tile.classList.add('is-lifting');
    showZone({ id: tdrag.id });
    moveGhost();
    sfx('pop', { rate: 1.3 });
    if (win.navigator && win.navigator.vibrate && !tdrag.mouse) { try { win.navigator.vibrate(12); } catch (e) { /* ignore */ } }
  }

  function moveGhost() {
    if (!tdrag || !tdrag.ghost) return;
    tdrag.ghost.style.transform = 'translate(' + Math.round(tdrag.cx) + 'px,' + Math.round(tdrag.cy) + 'px) translate(-50%,-50%)';
    dom.room.classList.toggle('is-target', overRoom(tdrag.cx, tdrag.cy));
  }

  function overRoom(x, y) {
    var r = dom.room.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  function onTileMove(e) {
    if (!tdrag || e.pointerId !== tdrag.pid) return;
    tdrag.cx = e.clientX; tdrag.cy = e.clientY;
    var dx = e.clientX - tdrag.sx, dy = e.clientY - tdrag.sy, d2 = dx * dx + dy * dy;
    if (!tdrag.started) {
      if (tdrag.mouse) { if (d2 > 25) startTileDrag(); }
      else if (d2 > 64) { cancelTileDrag(); }         // finger is scrolling the list
      return;
    }
    if (!rafId) rafId = win.requestAnimationFrame(function () { rafId = 0; moveGhost(); });
  }

  function onTileUp(e) {
    if (!tdrag || e.pointerId !== tdrag.pid) return;
    var d = tdrag;
    finishTileDrag();
    if (!d.started) return;                            // click → onTileClick
    suppressUntil = now() + 400;
    if (overRoom(e.clientX, e.clientY)) {
      var r = dom.room.getBoundingClientRect();
      addItem(d.id, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    } else {
      sfx('whoosh', { rate: 0.7 });
    }
  }

  function onTileCancel(e) { if (tdrag && e.pointerId === tdrag.pid) cancelTileDrag(); }

  function finishTileDrag() {
    var d = tdrag;
    tdrag = null;
    if (!d) return;
    clearTimeout(d.timer);
    doc.removeEventListener('pointermove', onTileMove);
    doc.removeEventListener('pointerup', onTileUp);
    doc.removeEventListener('pointercancel', onTileCancel);
    if (rafId) { win.cancelAnimationFrame(rafId); rafId = 0; }
    if (d.ghost && d.ghost.parentNode) d.ghost.parentNode.removeChild(d.ghost);
    if (d.tile) d.tile.classList.remove('is-lifting');
    dom.room.classList.remove('is-target');
    hideZone();
  }
  function cancelTileDrag() { finishTileDrag(); }

  /* ═══════════ Sheet (mobile) ═══════════ */
  function setSheet(open) {
    st.sheetOpen = !!open;
    dom.inv.classList.toggle('is-open', st.sheetOpen);
    dom.sheetToggle.setAttribute('aria-expanded', String(st.sheetOpen));
    syncBodyClasses();
    if (st.sheetOpen && isMobile()) {
      var r = dom.room.getBoundingClientRect();
      if (r.top < 0 || r.top > 40) {
        try { win.scrollBy({ top: r.top - 8, behavior: reduced() ? 'auto' : 'smooth' }); }
        catch (e) { win.scrollBy(0, r.top - 8); }
      }
    }
  }
  function syncBodyClasses() {
    doc.body.classList.toggle('mr-edit', st.mode === 'edit');
    doc.body.classList.toggle('mr-sheet-open', st.mode === 'edit' && st.sheetOpen);
  }

  /* ═══════════ Mode / status / info ═══════════ */
  function setMode(m, silent) {
    if (m !== 'edit' && m !== 'view') m = 'edit';
    if (drag || tdrag) return;
    st.mode = m;
    var edit = m === 'edit';
    select(null);
    dom.room.classList.toggle('is-edit', edit);
    dom.room.classList.toggle('is-view', !edit);
    dom.modeEdit.setAttribute('aria-pressed', String(edit));
    dom.modeView.setAttribute('aria-pressed', String(!edit));
    dom.layout.classList.toggle('is-view', !edit);
    dom.inv.hidden = !edit;
    dom.info.hidden = edit;
    syncBodyClasses();
    a11yAll();
    dom.help.textContent = t(edit ? 'myRoom.helpEdit' : 'myRoom.helpView');
    updateStatus();
    if (!edit) renderInfo();
    if (!silent) {
      sfx('click');
      toast(t(edit ? 'myRoom.mode.editOn' : 'myRoom.mode.viewOn'), 1800);
    }
  }

  function updateStatus() {
    if (!dom.statusMode) return;
    dom.statusMode.textContent = t(st.mode === 'edit' ? 'myRoom.status.edit' : 'myRoom.status.view');
    dom.statusItems.textContent = t('myRoom.status.items', { n: st.layout.length, max: MAX_ITEMS });
    var total = Number(S().stats && S().stats['room.interactions']) || 0;
    dom.statusCounter.textContent = t('myRoom.status.counter', { a: HG.ui.formatNum(st.clicks), b: HG.ui.formatNum(total) });
    dom.statusCounter.setAttribute('aria-label', t('myRoom.status.counterLabel', { a: st.clicks, b: total }));
  }

  function renderInfo() {
    if (!dom.info) return;
    var all = roomItems();
    var owned = all.filter(function (it) { return owns(it.id); }).length;
    dom.infoMood.textContent = t('myRoom.info.m' + st.mood);
    dom.infoOwned.textContent = t('myRoom.info.owned', { owned: owned, total: all.length });
    dom.infoPlaced.textContent = t('myRoom.info.placed', { n: st.layout.length });
    dom.infoMeter.style.setProperty('--pct', (all.length ? Math.round(owned * 100 / all.length) : 0) + '%');
  }

  /* ═══════════ Reset ═══════════ */
  function resetRoom() {
    HG.ui.confirm({ titleKey: 'myRoom.resetTitle', textKey: 'myRoom.resetText', okKey: 'myRoom.reset', danger: true }).then(function (yes) {
      if (!yes) return;
      select(null);
      st.layout = defaultLayout();
      st.hamin = { x: HAMIN_DEF.x, y: HAMIN_DEF.y, show: true, z: HAMIN_DEF.z, flip: false };
      st.night = false; st.lit = {}; st.neonOff = {}; st.twinkle = {};
      dom.room.classList.remove('is-night');
      dom.haminBtn.setAttribute('aria-pressed', 'true');
      renderAllItems();
      a11yAll();
      renderTiles();
      renderInfo();
      updateStatus();
      sfx('whoosh');
      toast(t('myRoom.resetDone'));
      markDirty();
    });
  }

  /* ═══════════ Wiring ═══════════ */
  function wire() {
    var room = dom.room;
    room.addEventListener('pointerdown', onRoomPointerDown);
    room.addEventListener('click', onRoomClick);
    room.addEventListener('keydown', onRoomKey);
    room.addEventListener('focusin', onRoomFocus);
    room.addEventListener('contextmenu', function (e) { if (st.mode === 'edit' || e.target.closest('.mr-hamin')) e.preventDefault(); });
    room.addEventListener('dragstart', function (e) { e.preventDefault(); });

    dom.cats.addEventListener('click', onCatsClick);
    dom.cats.addEventListener('keydown', onCatsKey);
    dom.tiles.addEventListener('click', onTileClick);
    dom.tiles.addEventListener('pointerdown', onTileDown);
    dom.tiles.addEventListener('contextmenu', function (e) { if (e.target.closest('.mr-tile')) e.preventDefault(); });
    dom.tiles.addEventListener('pointerover', function (e) {
      if (e.pointerType !== 'mouse') return;
      var b = e.target.closest('.mr-tile');
      if (b) setHint(b);
    });
    dom.tiles.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'mouse' && !dom.tiles.contains(doc.activeElement)) setHint(null);
    });
    dom.tiles.addEventListener('focusin', function (e) { var b = e.target.closest('.mr-tile'); if (b) setHint(b); });
    dom.tiles.addEventListener('focusout', function (e) { if (!dom.tiles.contains(e.relatedTarget)) setHint(null); });
    // once a long-press drag started, keep the finger from scrolling the list
    dom.tiles.addEventListener('touchmove', function (e) { if (tdrag && tdrag.started && e.cancelable) e.preventDefault(); }, { passive: false });

    dom.modeEdit.addEventListener('click', function () { if (st.mode !== 'edit') setMode('edit'); });
    dom.modeView.addEventListener('click', function () { if (st.mode !== 'view') setMode('view'); });
    dom.decorate.addEventListener('click', function () { setMode('edit'); dom.modeEdit.focus(); });
    dom.saveBtn.addEventListener('click', function () { commit(true); });
    dom.resetBtn.addEventListener('click', function () { sfx('click'); resetRoom(); });
    dom.haminBtn.addEventListener('click', function () { setHaminShown(!st.hamin.show); });
    dom.sheetToggle.addEventListener('click', function () { sfx('click'); setSheet(!st.sheetOpen); });

    if (win.ResizeObserver) {
      new win.ResizeObserver(function () { positionTools(); }).observe(room);
    } else {
      win.addEventListener('resize', positionTools);
    }
    win.addEventListener('resize', function () { syncBodyClasses(); });

    doc.addEventListener('hg:lang', function () {
      renderCats();
      renderTiles();
      a11yAll();
      updateStatus();
      renderInfo();
      dom.help.textContent = t(st.mode === 'edit' ? 'myRoom.helpEdit' : 'myRoom.helpView');
      doc.title = t('myRoom.docTitle');
      Object.keys(nodes).forEach(function (k) { if (nodes[k].look) nodes[k].look.setAttribute('aria-label', t('myRoom.look.alt')); });
    });
    var lastHp = Number(S().hpoint) || 0;
    doc.addEventListener('hg:unlock', function () { renderTiles(); renderInfo(); });
    doc.addEventListener('hg:save', function () {
      var hp = Number(S().hpoint) || 0;
      if (hp !== lastHp) { lastHp = hp; renderTiles(); }
    });
    win.addEventListener('pagehide', flushIfDirty);
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) flushIfDirty(); });
  }

  /* ═══════════ Init ═══════════ */
  function init() {
    var game = $('game');
    if (!game || !HG.ui || !HG.catalog) return;
    HG.ui.mountGameShell(game, { game: 'my-room', helpKey: 'myRoom.help' });
    dom = {
      game: game, layout: $('mr-layout'), room: $('mr-room'), items: $('mr-items'), zone: $('mr-zone'),
      fx: $('mr-fx'), flash: $('mr-flash'), help: $('mr-room-help'), bg: $('mr-room-bg'),
      modeEdit: $('mr-mode-edit'), modeView: $('mr-mode-view'), saveBtn: $('mr-save-btn'),
      resetBtn: $('mr-reset-btn'), haminBtn: $('mr-hamin-btn'),
      statusMode: $('mr-status-mode'), statusItems: $('mr-status-items'), statusCounter: $('mr-status-counter'),
      inv: $('mr-inv'), cats: $('mr-cats'), tiles: $('mr-tiles'), tilesPanel: $('mr-inv-panel'),
      invCat: $('mr-inv-cat'), invCount: $('mr-inv-count'), invHint: $('mr-inv-hint'), sheetToggle: $('mr-sheet-toggle'), sheetCount: $('mr-sheet-count'),
      info: $('mr-info'), infoPic: $('mr-info-pic'), infoMood: $('mr-info-mood'), infoOwned: $('mr-info-owned'),
      infoPlaced: $('mr-info-placed'), infoMeter: $('mr-info-meter'), decorate: $('mr-decorate-btn')
    };
    dom.room.tabIndex = -1;
    dom.pop = el('div', { class: 'mr-pop', 'aria-hidden': 'true' });
    dom.room.appendChild(dom.pop);
    dom.statusSaved = el('span', { class: 'mr-status__saved', 'aria-hidden': 'true' });
    dom.statusCounter.parentNode.insertBefore(dom.statusSaved, dom.statusCounter);
    dom.infoPic.textContent = '🧑';
    dom.bg.addEventListener('error', function () { dom.bg.hidden = true; dom.room.classList.add('no-bg'); });
    if (dom.bg.complete && !dom.bg.naturalWidth) { dom.bg.hidden = true; dom.room.classList.add('no-bg'); }

    loadModel();
    buildTools();
    dom.items.appendChild(dom.tools);
    buildHamin();
    renderAllItems();
    dom.room.classList.toggle('is-night', st.night);
    dom.haminBtn.setAttribute('aria-pressed', String(st.hamin.show));

    renderCats();
    renderTiles();
    wire();
    var edited = !!(S().room && S().room.edited);
    setMode(edited ? 'view' : 'edit', true);
    renderInfo();
    renderLooks();
    doc.title = t('myRoom.docTitle');

    var seen = S().seen || {};
    if (!seen['myRoom.tip'] && HG.save) {
      setTimeout(function () { toast(t('myRoom.msg.tip'), 6000); }, 900);
      HG.save.set('seen.myRoom.tip', true);
    }
  }

  HG.onReady(init);
})(window.HG = window.HG || {}, window, document);

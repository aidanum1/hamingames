/* HAMIN GAMES — js/lunch-time.js
   HAMIN'S LUNCH TIME: Hamin shows an ORDER (2–4 foods); the player picks exactly those
   foods from the lunch counter (click / tap, drag onto the tray, or keys 1–9 · 0) before
   the timer empties. Every served round speeds up; from round 6 the counter becomes a
   moving conveyor (RUSH!). Wrong food or TIME UP costs a heart; 3 hearts per lunch.
   5 PERFECT rounds in a row → SHEEP SMILE ♡ (HAMIN GAMES' own name for the happiest
   reaction — a game term, not a claim about the real person).

   Engine use only (docs/CONTRACT.md): HG.ui.mountGameShell / el / img / announce /
   reducedMotion / sparkleBurst / formatNum, HG.look.draw (player's Dress Up outfit, bust
   crop) for Hamin's reactions, HG.audio.sfx (BGM 'lunch' is started by main.js), and
   HG.unlocks.finishGame at game over — the game never grants items itself.

   Timing runs on a pausable game clock driven by one requestAnimationFrame loop; the loop
   stops while paused, while a modal is open, while the tab is hidden and between games.
   Debug / tests: HG.lunchTime.state() · HG.lunchTime.start() · HG.lunchTime.pause(). */
(function (HG, win, doc) {
  'use strict';

  /* ═══════════ Config ═══════════ */
  var GAME = 'lunch-time';
  var SLOTS = 10;
  var KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  var MAX_HEARTS = 3;
  var PERFECT_FRAC = 0.45;    // served with ≥45% of the timer left → PERFECT
  var SHEEP_STREAK = 5;       // PERFECT rounds in a row → SHEEP SMILE ♡
  var SHEEP_BONUS = 100;
  var ITEM_PTS = 10;
  var RUSH_ROUND = 6;         // conveyor starts moving
  var FACE_PX = 360;          // offscreen render size of each expression
  var LOW_FRAC = 0.3, MID_FRAC = 0.6;

  var FOODS = [
    { id: 'ramen', emoji: '🍜' }, { id: 'dumplings', emoji: '🥟' }, { id: 'rice-bowl', emoji: '🍚' },
    { id: 'kimbap', emoji: '🍙' }, { id: 'tteokbokki', emoji: '🍢' }, { id: 'fried-chicken', emoji: '🍗' },
    { id: 'strawberry', emoji: '🍓', dessert: true }, { id: 'strawberry-cake', emoji: '🍰', dessert: true },
    { id: 'tangerine', emoji: '🍊', dessert: true }, { id: 'watermelon', emoji: '🍉', dessert: true },
    { id: 'banana-milk', emoji: '🍌' }, { id: 'strawberry-milk', emoji: '🥛' },
    { id: 'fish-bread', emoji: '🐟', dessert: true }, { id: 'ice-cream', emoji: '🍦', dessert: true },
    { id: 'cookie', emoji: '🍪', dessert: true }, { id: 'egg-toast', emoji: '🍞' }
  ];
  var FOOD = {};
  FOODS.forEach(function (f) { f.src = 'assets/food/food-' + f.id + '.webp'; FOOD[f.id] = f; });

  // Foods that are easy to mix up — used as tricky decoys from round 4.
  var LOOKALIKES = [
    ['strawberry', 'strawberry-cake', 'strawberry-milk'], ['banana-milk', 'strawberry-milk'],
    ['ramen', 'tteokbokki'], ['kimbap', 'rice-bowl'], ['tangerine', 'watermelon'],
    ['fish-bread', 'egg-toast', 'cookie'], ['ice-cream', 'strawberry-cake'], ['fried-chicken', 'dumplings']
  ];
  var LOOK = {};
  LOOKALIKES.forEach(function (g) {
    g.forEach(function (a) { LOOK[a] = LOOK[a] || {}; g.forEach(function (b) { if (a !== b) LOOK[a][b] = true; }); });
  });

  var FALLBACK_EXPR = {
    neutral: [], smile: ['neutral'], big: ['smile', 'neutral'], sheep: ['big', 'smile', 'neutral'],
    eating: ['smile', 'neutral'], surprised: ['neutral'], pout: ['neutral']
  };
  var FACE_EMOJI = { neutral: '🙂', smile: '😊', big: '😆', sheep: '🐑', eating: '😋', surprised: '😮', pout: '😣' };
  var PREWARM = ['neutral', 'smile', 'big', 'eating', 'surprised', 'pout', 'sheep'];

  /* ═══════════ Helpers ═══════════ */
  function t(k, p) { return HG.t ? HG.t(k, p) : String(k); }
  function h(tag, props, kids) { return HG.ui.el(tag, props, kids); }
  function sfx(name, opts) { try { if (HG.audio) HG.audio.sfx(name, opts); } catch (e) { /* never break the game for sound */ } }
  function reduced() { return !!(HG.ui && HG.ui.reducedMotion && HG.ui.reducedMotion()); }
  function fmt(n) { return HG.ui && HG.ui.formatNum ? HG.ui.formatNum(n) : String(n); }
  function announce(s) { if (HG.ui && HG.ui.announce) HG.ui.announce(s); }
  function rand(n) { return Math.floor(Math.random() * n); }
  function pickOne(a) { return a[rand(a.length)]; }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = rand(i + 1); var x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }
  function pad3(n) { n = String(n); while (n.length < 3) n = '0' + n; return n; }
  // HG.ui.el's i18n prop does not interpolate params → set text + data-i18n(-params) ourselves
  function tp(tag, cls, key, params) {
    var el = h(tag, { class: cls, 'data-i18n': key, 'data-i18n-params': JSON.stringify(params) });
    el.textContent = t(key, params);
    return el;
  }
  function foodName(f) { return t('lunch.food.' + f.id); }
  function foodImg(f, cls) { return HG.ui.img(f.src, { alt: '', emoji: f.emoji, className: cls, kind: 'sticker' }); }
  function removeEl(el) { if (el && el.parentNode) el.parentNode.removeChild(el); }
  function copy(o) { var r = {}; for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) r[k] = o[k]; return r; }
  function restart(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  function focusEl(el) { if (!el) return; try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (e2) { /* ignore */ } } }
  function bestNow() {
    var b = HG.save && HG.save.data && HG.save.data.best ? Number(HG.save.data.best[GAME]) : 0;
    return isFinite(b) && b > 0 ? b : 0;
  }
  function cssVar(name, fallback) {
    try { return getComputedStyle(doc.documentElement).getPropertyValue(name).trim() || fallback; } catch (e) { return fallback; }
  }
  var canAnimate = !!(win.Element && win.Element.prototype.animate);

  /* ═══════════ State ═══════════ */
  var S = {
    mode: 'title',            // title · countdown · play · between · over
    paused: false,
    running: false, raf: 0, last: 0, clock: 0, tasks: [],
    score: 0, hearts: MAX_HEARTS, round: 0, served: 0, fails: 0, perfects: 0, streak: 0,
    combo: 0, bestCombo: 0, sheep: 0, desserts: 0,
    lines: [], cells: [], picks: 0,
    roundActive: false, roundStart: 0, roundDur: 1, beltMs: 0, nextBelt: 0, lastSec: -1, timerBand: '',
    slots: [], uid: 0, roundId: 0, finished: false, rushShown: false, prevOrderKey: ''
  };
  var E = {};                 // elements
  var shell = null;
  var overlay = null, pauseEl = null, cdEl = null;
  var drag = null, suppressClick = false;

  /* ═══════════ Game clock (pausable) ═══════════ */
  function later(ms, fn) { S.tasks.push({ at: S.clock + ms, fn: fn }); }

  function runTasks() {
    for (var guard = 0; guard < 50; guard++) {
      var best = -1;
      for (var i = 0; i < S.tasks.length; i++) {
        if (S.tasks[i].at <= S.clock && (best < 0 || S.tasks[i].at < S.tasks[best].at)) best = i;
      }
      if (best < 0) return;
      var task = S.tasks.splice(best, 1)[0];
      try { task.fn(); } catch (e) { if (win.console) console.error('[lunch]', e); }
      if (!S.running) return;
    }
  }

  function frame(ts) {
    S.raf = 0;
    if (!S.running) return;
    var dt = ts - S.last;
    S.last = ts;
    if (!(dt > 0)) dt = 0;
    if (dt > 100) dt = 100;            // a hitch never eats the timer
    S.clock += dt;
    runTasks();
    if (S.running && S.mode === 'play' && S.roundActive) tickRound();
    if (S.running) S.raf = win.requestAnimationFrame(frame);
  }

  function startLoop() {
    if (S.running) return;
    S.running = true;
    S.last = win.performance && performance.now ? performance.now() : Date.now();
    S.raf = win.requestAnimationFrame(frame);
  }
  function stopLoop() {
    S.running = false;
    if (S.raf) win.cancelAnimationFrame(S.raf);
    S.raf = 0;
  }

  function inGame() { return S.mode === 'countdown' || S.mode === 'play' || S.mode === 'between'; }
  function canPick() { return S.mode === 'play' && S.roundActive && !S.paused; }

  /* ═══════════ Hamin (HG.look bust, player's outfit) ═══════════ */
  var face = { cache: {}, pending: {}, expr: 'neutral', token: 0, outfit: null, ctx: null };

  function initFace() {
    face.ctx = E.face.getContext('2d');
    try { face.outfit = HG.look && HG.look.current ? HG.look.current() : null; } catch (e) { face.outfit = null; }
    sizeFace();
    if (win.ResizeObserver) new win.ResizeObserver(sizeFace).observe(E.faceFrame);
    else win.addEventListener('resize', sizeFace);
    // warm every expression in the background so reactions switch instantly
    PREWARM.reduce(function (p, ex) { return p.then(function () { return renderExpr(ex); }); }, Promise.resolve());
  }

  function sizeFace() {
    var w = E.faceFrame.clientWidth || 160;
    var dpr = Math.min(2, win.devicePixelRatio || 1);
    var px = Math.max(64, Math.round(w * dpr));
    if (E.face.width !== px) { E.face.width = px; E.face.height = px; paintFace(); }
  }

  function headOk(ex) {
    if (!HG.look || !face.outfit || !HG.look.headSrc) return Promise.resolve(false);
    var o = copy(face.outfit);
    o.expr = ex;
    return HG.look.loadImage(HG.look.headSrc(o)).then(function (img) { return !!img; }, function () { return false; });
  }

  // Extra expressions may not exist for every hairstyle yet → nearest one that loads.
  function resolveExpr(ex) {
    var chain = [ex].concat(FALLBACK_EXPR[ex] || ['neutral']);
    var i = 0;
    function next() {
      if (i >= chain.length) return Promise.resolve(null);
      var e = chain[i++];
      return headOk(e).then(function (ok) { return ok ? e : next(); });
    }
    return next();
  }

  function drawFallbackFace(ctx, ex) {
    var s = FACE_PX;
    ctx.clearRect(0, 0, s, s);
    ctx.fillStyle = cssVar('--c-pink', '#ffc9de');
    ctx.beginPath(); ctx.arc(s / 2, s * 0.54, s * 0.34, 0, Math.PI * 2); ctx.fill();
    ctx.font = Math.round(s * 0.4) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(FACE_EMOJI[ex] || '🙂', s / 2, s * 0.56);
  }

  function renderExpr(ex) {
    if (face.cache[ex]) return Promise.resolve(face.cache[ex]);
    if (face.pending[ex]) return face.pending[ex];
    var c = doc.createElement('canvas');
    c.width = c.height = FACE_PX;
    var cx = c.getContext('2d');
    var p = resolveExpr(ex).then(function (real) {
      if (!real || !HG.look || !HG.look.draw) { drawFallbackFace(cx, ex); return c; }
      var o = copy(face.outfit);
      o.expr = real;
      var crop = (HG.look.CROPS && HG.look.CROPS.bust) || { x: 300, y: 20, w: 600, h: 600 };
      return HG.look.draw(cx, o, { x: 0, y: 0, w: FACE_PX, h: FACE_PX, crop: crop }).then(function () { return c; });
    }).then(null, function () { drawFallbackFace(cx, ex); return c; }).then(function (cv) {
      face.cache[ex] = cv;
      delete face.pending[ex];
      return cv;
    });
    face.pending[ex] = p;
    return p;
  }

  function paintFace() {
    var c = face.cache[face.expr];
    if (!c || !face.ctx) return;
    face.ctx.clearRect(0, 0, E.face.width, E.face.height);
    if ('imageSmoothingQuality' in face.ctx) face.ctx.imageSmoothingQuality = 'high';
    face.ctx.drawImage(c, 0, 0, E.face.width, E.face.height);
  }

  function setFace(ex) {
    face.expr = ex;
    E.hamin.setAttribute('data-expr', ex);
    E.face.setAttribute('aria-label', t('lunch.face.' + ex));
    var tk = ++face.token;
    if (face.cache[ex]) { paintFace(); return; }
    renderExpr(ex).then(function () { if (tk === face.token) paintFace(); });
  }

  function say(key) {
    E.say.setAttribute('data-i18n', key);
    E.say.textContent = t(key);
    if (!reduced()) restart(E.say, 'is-new');
  }
  function sayOne(prefix, n) { say(prefix + (1 + rand(n))); }

  function sheepParticles() {
    if (reduced()) return;
    var glyphs = ['🐑', '✦', '♡', '🐑', '✧', '🐑', '★'];
    for (var i = 0; i < 12; i++) {
      E.fx.appendChild(h('span', {
        class: 'lt-sheep',
        style: '--x:' + (6 + rand(86)) + '%;--d:' + (i * 85) + 'ms;--r:' + (rand(50) - 25) + 'deg'
      }, glyphs[i % glyphs.length]));
    }
    setTimeout(function () { E.fx.textContent = ''; }, 2600);
    var r = E.faceFrame.getBoundingClientRect();
    if (HG.ui.sparkleBurst) HG.ui.sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 16);
  }

  /* ═══════════ HUD ═══════════ */
  function bump(el) { if (el && !reduced()) restart(el, 'is-bump'); }

  function updateHud() {
    E.score.textContent = fmt(S.score);
    E.combo.textContent = String(S.combo);
    E.round.textContent = String(S.round);
    var best = bestNow();
    E.best.textContent = fmt(Math.max(best, S.score));
    E.bestPill.classList.toggle('is-record', S.score > best && best > 0);
    E.comboPill.classList.toggle('is-hot', S.combo >= 3);
  }

  function renderHearts(breakIdx) {
    E.lives.textContent = '';
    for (var i = 0; i < MAX_HEARTS; i++) {
      var on = i < S.hearts;
      E.lives.appendChild(h('i', {
        class: 'lt-heart' + (on ? '' : ' is-lost') + (i === breakIdx && !reduced() ? ' is-breaking' : '')
      }, on ? '♥' : '♡'));
    }
    E.lives.setAttribute('aria-label', t('lunch.hud.livesAria', { n: S.hearts, max: MAX_HEARTS }));
  }

  function renderStreak(n) {
    if (n == null) n = S.streak;
    E.streak.textContent = '';
    for (var i = 0; i < SHEEP_STREAK; i++) E.streak.appendChild(h('i', { class: 'lt-streak__dot' + (i < n ? ' is-on' : '') }));
    E.streak.setAttribute('aria-label', t('lunch.hud.streak', { n: n, max: SHEEP_STREAK }));
  }

  function setTimerFrac(f) {
    E.timerFill.style.width = (Math.max(0, Math.min(1, f)) * 100).toFixed(2) + '%';
    var band = f < LOW_FRAC ? 'low' : f < MID_FRAC ? 'mid' : 'ok';
    if (band !== S.timerBand) {
      S.timerBand = band;
      E.timer.classList.toggle('is-low', band === 'low');
      E.timer.classList.toggle('is-mid', band === 'mid');
    }
  }

  function setPlaying(on) { E.play.classList.toggle('is-playing', !!on); }

  /* ═══════════ Pop texts ═══════════ */
  function pop(text, variant, opts) {
    opts = opts || {};
    var el = h('span', { class: 'lt-pop lt-pop--' + variant }, text);
    if (opts.at) { el.style.left = opts.at.x + 'px'; el.style.top = opts.at.y + 'px'; }
    if (opts.delay) el.style.animationDelay = opts.delay + 'ms';
    E.pops.appendChild(el);
    while (E.pops.childElementCount > 10) E.pops.removeChild(E.pops.firstChild);
    setTimeout(function () { removeEl(el); }, (opts.ms || 1100) + (opts.delay || 0));
    return el;
  }
  function stagePoint(el) {
    var r = el.getBoundingClientRect(), s = E.stage.getBoundingClientRect();
    return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 };
  }

  /* ═══════════ Order ticket + tray ═══════════ */
  function totalItems() { var n = 0; S.lines.forEach(function (l) { n += l.count; }); return n; }

  function orderSize(r) {
    if (r <= 3) return 2;
    if (r <= 6) return Math.random() < 0.7 ? 3 : 2;
    if (r <= 10) return 3;
    if (r <= 14) return Math.random() < 0.55 ? 4 : 3;
    return 4;
  }

  function makeOrder() {
    var n = orderSize(S.round);
    var dup = S.round >= 9 && n >= 3 && Math.random() < 0.3;
    var kinds = dup ? n - 1 : n;
    var foods, key, tries = 0;
    do {
      foods = shuffle(FOODS.slice()).slice(0, kinds);
      key = foods.map(function (f) { return f.id; }).sort().join(',');
    } while (key === S.prevOrderKey && ++tries < 6);
    S.prevOrderKey = key;
    S.lines = foods.map(function (f) { return { food: f, count: 1, got: 0, el: null }; });
    if (dup) S.lines[rand(S.lines.length)].count = 2;
    S.cells = [];
    S.lines.forEach(function (l) { for (var i = 0; i < l.count; i++) S.cells.push({ food: l.food, filled: false }); });
  }

  function orderNames() {
    return S.lines.map(function (l) { return (l.count > 1 ? l.count + ' × ' : '') + foodName(l.food); }).join(', ');
  }

  function renderOrder() {
    E.orderNo.textContent = '#' + pad3(S.round);
    E.orderList.textContent = '';
    S.lines.forEach(function (l, i) {
      var li = h('li', { class: 'lt-order__item', style: '--i:' + i });
      li.appendChild(h('span', { class: 'lt-order__pic' }, foodImg(l.food, 'lt-order__img')));
      li.appendChild(h('span', { class: 'lt-order__name', i18n: 'lunch.food.' + l.food.id }));
      if (l.count > 1) {
        li.appendChild(tp('span', 'hg-badge lt-order__count', 'lunch.order.count', { n: l.count }));
        var pips = h('span', { class: 'lt-order__pips', 'aria-hidden': 'true' });
        for (var k = 0; k < l.count; k++) pips.appendChild(h('i', { class: 'lt-order__pip' }));
        li.appendChild(pips);
      }
      li.appendChild(h('span', { class: 'lt-order__done hg-sr-only', i18n: 'lunch.order.done', hidden: true }));
      l.el = li;
      E.orderList.appendChild(li);
    });
    // retrigger the "new ticket" wiggle
    if (!reduced()) restart(E.order, 'is-new');
  }

  function renderIdleOrder() {
    E.orderNo.textContent = '';
    E.orderList.textContent = '';
    E.orderList.appendChild(h('li', { class: 'lt-order__wait', i18n: 'lunch.order.waiting' }));
  }

  function updateOrderLine(l) {
    if (!l.el) return;
    var pips = l.el.querySelectorAll('.lt-order__pip');
    for (var i = 0; i < pips.length; i++) pips[i].classList.toggle('is-on', i < l.got);
    if (l.got >= l.count) {
      l.el.classList.add('is-done');
      var d = l.el.querySelector('.lt-order__done');
      if (d) d.hidden = false;
    }
  }

  function renderTray() {
    E.tray.classList.remove('is-served', 'is-fail', 'is-over');
    E.trayCells.textContent = '';
    var cells = S.cells.length ? S.cells : [null, null, null];
    E.trayCells.style.setProperty('--n', String(cells.length));
    cells.forEach(function (c) {
      var cell = h('span', { class: 'lt-tray__cell' });
      if (c) cell.appendChild(foodImg(c.food, 'lt-tray__ghost'));
      E.trayCells.appendChild(cell);
    });
  }

  function fillCell(i, rid) {
    if (rid !== S.roundId) return;
    var cell = E.trayCells.children[i];
    var c = S.cells[i];
    if (!cell || !c || cell.classList.contains('is-full')) return;
    cell.textContent = '';
    cell.appendChild(foodImg(c.food, 'lt-tray__food'));
    cell.classList.add('is-full');
  }

  function visible(el) { return !!(el && el.getClientRects().length && el.offsetParent !== null); }

  // Fly target: the tray cell (desktop / tablet) or the order ticket line (phones hide the tray).
  function dropTarget(cellIdx, food) {
    var cell = E.trayCells.children[cellIdx];
    if (visible(cell)) return cell;
    for (var i = 0; i < S.lines.length; i++) if (S.lines[i].food === food && S.lines[i].el) return S.lines[i].el;
    return E.order;
  }

  /* ═══════════ Counter / conveyor ═══════════ */
  function buildSlots() {
    E.belt.textContent = '';
    E.slotEls = [];
    for (var i = 0; i < SLOTS; i++) {
      var slot = h('div', { class: 'lt-slot', 'data-slot': String(i) }, [
        h('span', { class: 'lt-slot__plate', 'aria-hidden': 'true' }),
        h('span', { class: 'lt-slot__key hg-key', 'aria-hidden': 'true' }, KEYS[i])
      ]);
      E.slotEls.push(slot);
      E.belt.appendChild(slot);
    }
    S.slots = new Array(SLOTS);
    for (i = 0; i < SLOTS; i++) S.slots[i] = null;
  }

  function newItem(f) {
    var it = { uid: ++S.uid, food: f, gone: false, el: null };
    it.el = h('button', { type: 'button', class: 'lt-food', 'data-uid': String(it.uid) }, foodImg(f, 'lt-food__img'));
    return it;
  }

  function itemByUid(uid) {
    for (var i = 0; i < S.slots.length; i++) if (S.slots[i] && S.slots[i].uid === uid) return S.slots[i];
    return null;
  }

  function clearCounter() {
    for (var i = 0; i < S.slots.length; i++) if (S.slots[i]) { S.slots[i].gone = true; removeEl(S.slots[i].el); }
    for (i = 0; i < SLOTS; i++) S.slots[i] = null;
    Array.prototype.slice.call(E.belt.querySelectorAll('.lt-food')).forEach(removeEl);
  }

  function updateSlotLabels() {
    for (var i = 0; i < SLOTS; i++) {
      var it = S.slots[i];
      E.slotEls[i].classList.toggle('is-empty', !it);
      if (!it) continue;
      var name = foodName(it.food);
      it.el.setAttribute('aria-label', t('lunch.counter.slot', { key: KEYS[i], name: name }));
      it.el.title = name;
    }
  }

  function inOrder(f) { for (var i = 0; i < S.lines.length; i++) if (S.lines[i].food === f) return true; return false; }

  // A decoy is never a food from the order, so every copy of an ordered food on the counter is needed.
  function pickDecoy(current) {
    var counts = {};
    current.forEach(function (f) { counts[f.id] = (counts[f.id] || 0) + 1; });
    var pool = [];
    FOODS.forEach(function (f) {
      if (inOrder(f)) return;
      var c = counts[f.id] || 0;
      if (c >= 2) return;
      var w = c ? 1 : 3;
      if (S.round >= 4) {
        for (var i = 0; i < S.lines.length; i++) if (LOOK[S.lines[i].food.id] && LOOK[S.lines[i].food.id][f.id]) { w += 3; break; }
      }
      for (var k = 0; k < w; k++) pool.push(f);
    });
    if (!pool.length) pool = FOODS.filter(function (f) { return !inOrder(f); });
    return pickOne(pool);
  }

  // Keyboard (Tab + Enter) players keep their place when the focused food leaves the counter.
  function focusNextFood(from) {
    for (var k = 1; k <= SLOTS; k++) {
      var it = S.slots[((from < 0 ? 0 : from) + k) % SLOTS];
      if (it && !it.gone) { focusEl(it.el); return; }
    }
    focusEl(E.play);
  }

  function fillCounter() {
    var hadFocus = !!(doc.activeElement && E.belt.contains(doc.activeElement)) || doc.activeElement === doc.body;
    clearCounter();
    var list = [];
    S.lines.forEach(function (l) { for (var i = 0; i < l.count; i++) list.push(l.food); });
    while (list.length < SLOTS) list.push(pickDecoy(list));
    shuffle(list);
    var anim = !reduced();
    list.forEach(function (f, i) {
      var it = newItem(f);
      S.slots[i] = it;
      if (anim) { it.el.classList.add('is-enter'); it.el.style.setProperty('--d', (i * 30) + 'ms'); }
      E.slotEls[i].appendChild(it.el);
    });
    if (anim) restart(E.belt, 'is-rolling');
    updateSlotLabels();
    if (hadFocus && !(overlay || pauseEl)) focusEl(E.play);
  }

  // Next food to enter the moving belt: a still-needed food that is not on the belt, else a decoy.
  function supplyFood(staying) {
    for (var i = 0; i < S.lines.length; i++) {
      var l = S.lines[i];
      var need = l.count - l.got;
      if (need <= 0) continue;
      var vis = 0;
      staying.forEach(function (it) { if (it && it.food === l.food) vis++; });
      if (vis < need) return l.food;
    }
    return pickDecoy(staying.filter(Boolean).map(function (it) { return it.food; }));
  }

  function leave(it) {
    var el = it.el;
    it.gone = true;
    el.setAttribute('tabindex', '-1');
    el.setAttribute('aria-hidden', 'true');
    if (reduced() || !el.parentNode) { removeEl(el); return; }
    el.classList.remove('is-enter');
    el.classList.add('is-leaving');
    setTimeout(function () { removeEl(el); }, 280);
  }

  // RUSH: every item moves one slot along the belt (FLIP animation); the last one leaves.
  function beltTick() {
    var old = S.slots.slice();
    var rects = old.map(function (it) { return it ? it.el.getBoundingClientRect() : null; });
    var exiting = old[SLOTS - 1];
    var staying = old.slice(0, SLOTS - 1);
    var fresh = newItem(supplyFood(staying));
    S.slots = [fresh].concat(staying);
    if (exiting) leave(exiting);
    for (var i = 1; i < SLOTS; i++) if (S.slots[i]) E.slotEls[i].appendChild(S.slots[i].el);
    E.slotEls[0].appendChild(fresh.el);
    fresh.el.classList.add('is-enter');
    fresh.el.style.setProperty('--d', '0ms');
    var moved = [];
    for (i = 1; i < SLOTS; i++) {
      var it = S.slots[i], r0 = rects[i - 1];
      if (!it || !r0) continue;
      var r1 = it.el.getBoundingClientRect();
      var dx = r0.left - r1.left, dy = r0.top - r1.top;
      if (!dx && !dy) continue;
      it.el.style.transition = 'none';
      it.el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      moved.push(it.el);
    }
    if (moved.length) {
      void E.belt.offsetWidth;
      moved.forEach(function (el) { el.style.transition = ''; el.style.transform = ''; });
    }
    restart(E.belt, 'is-rolling');
    updateSlotLabels();
  }

  function flashSlot(i) {
    var s = E.slotEls[i];
    if (!s) return;
    restart(s, 'is-hit');
    setTimeout(function () { s.classList.remove('is-hit'); }, 260);
  }

  /* ═══════════ Fly to tray ═══════════ */
  function fly(rect, target, f, done) {
    if (reduced() || !canAnimate || !rect || !target) { done(); return; }
    var b = target.getBoundingClientRect();
    if (!b.width || !rect.width) { done(); return; }
    var size = Math.min(rect.width, rect.height) * 0.86;
    var g = foodImg(f, 'lt-fly');
    var x0 = rect.left + rect.width / 2 - size / 2, y0 = rect.top + rect.height / 2 - size / 2;
    g.style.width = g.style.height = size.toFixed(1) + 'px';
    g.style.left = x0.toFixed(1) + 'px';
    g.style.top = y0.toFixed(1) + 'px';
    doc.body.appendChild(g);
    var dx = b.left + b.width / 2 - (x0 + size / 2), dy = b.top + b.height / 2 - (y0 + size / 2);
    var sc = Math.max(0.4, Math.min(1.2, (Math.min(b.width, b.height) * 0.8) / size));
    var fin = false;
    function end() { if (fin) return; fin = true; removeEl(g); done(); }
    try {
      var a = g.animate([
        { transform: 'translate(0,0) scale(1) rotate(0deg)' },
        { transform: 'translate(' + (dx * 0.5).toFixed(1) + 'px,' + (dy * 0.5 - 46).toFixed(1) + 'px) scale(1.18) rotate(-12deg)', offset: 0.5 },
        { transform: 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + sc.toFixed(3) + ') rotate(0deg)' }
      ], { duration: 320, easing: 'ease-in-out', fill: 'forwards' });
      a.onfinish = end;
      a.oncancel = end;
    } catch (e) { end(); return; }
    setTimeout(end, 800);
  }

  /* ═══════════ Round flow ═══════════ */
  function roundDuration() {
    var speed = Math.max(0.56, 1 - 0.028 * (S.round - 1));
    return Math.round((3400 + 1600 * totalItems()) * speed + 350);
  }
  function beltInterval() {
    if (reduced() || S.round < RUSH_ROUND) return 0;      // reduced motion: no sliding conveyor
    return Math.max(950, 2300 - 90 * (S.round - RUSH_ROUND));
  }
  function remainingFrac() { return Math.max(0, 1 - (S.clock - S.roundStart) / S.roundDur); }

  function nextRound() {
    if (S.mode === 'over' || S.finished) return;
    S.round++;
    S.roundId++;
    S.picks = 0;
    E.hamin.classList.remove('is-sheep', 'is-eating');
    makeOrder();
    renderOrder();
    renderTray();
    fillCounter();
    S.roundDur = roundDuration();
    S.beltMs = beltInterval();
    S.roundStart = S.clock;
    S.nextBelt = S.clock + S.beltMs + 500;
    S.lastSec = -1;
    S.mode = 'play';
    S.roundActive = true;
    setPlaying(true);
    setTimerFrac(1);
    setFace('neutral');
    if (S.round === 1) say('lunch.say.hello'); else sayOne('lunch.say.order', 3);
    E.rush.hidden = !S.beltMs;
    if (S.beltMs && !S.rushShown) {
      S.rushShown = true;
      pop(t('lunch.pop.rush'), 'rush', { ms: 1300 });
      say('lunch.say.rush');
      sfx('whoosh');
    }
    updateHud();
    announce(t('lunch.announce.round', { n: S.round, items: orderNames() }) +
             (S.beltMs && S.round === RUSH_ROUND ? ' ' + t('lunch.announce.rush') : ''));
  }

  function tickRound() {
    var frac = remainingFrac();
    setTimerFrac(frac);
    var sec = Math.ceil(S.roundDur * frac / 1000);
    if (sec !== S.lastSec) {
      S.lastSec = sec;
      E.timer.setAttribute('aria-valuenow', String(Math.round(frac * 100)));
      if (frac < LOW_FRAC && sec > 0 && sec <= 3) sfx('tick');
    }
    if (S.beltMs && S.clock >= S.nextBelt) {
      S.nextBelt = S.clock + S.beltMs;
      beltTick();
    }
    if (frac <= 0) failRound('timeup', null);
  }

  function pick(it, via) {
    if (!canPick() || !it || it.gone) return;
    var line = null;
    for (var i = 0; i < S.lines.length; i++) {
      if (S.lines[i].food === it.food && S.lines[i].got < S.lines[i].count) { line = S.lines[i]; break; }
    }
    if (!line) { failRound('wrong', it); return; }

    line.got++;
    S.picks++;
    var cellIdx = -1;
    for (i = 0; i < S.cells.length; i++) if (S.cells[i].food === it.food && !S.cells[i].filled) { cellIdx = i; break; }
    if (cellIdx >= 0) S.cells[cellIdx].filled = true;

    var rect = it.el.getBoundingClientRect();
    var idx = S.slots.indexOf(it);
    var hadFocus = doc.activeElement === it.el;
    if (idx >= 0) S.slots[idx] = null;
    it.gone = true;
    removeEl(it.el);
    updateSlotLabels();
    if (hadFocus) focusNextFood(idx);

    S.score += ITEM_PTS;
    updateHud();
    bump(E.scorePill);
    sfx('pop', { rate: 1 + 0.14 * (S.picks - 1) });
    var target = dropTarget(cellIdx, it.food);
    var rid = S.roundId;
    if (via === 'drag') fillCell(cellIdx, rid);
    else fly(rect, target, it.food, function () { fillCell(cellIdx, rid); });
    pop('+' + ITEM_PTS, 'pts', { at: stagePoint(target), ms: 800 });
    updateOrderLine(line);
    if (face.expr !== 'smile') setFace('smile');
    if (S.picks === 1 && Math.random() < 0.5) sayOne('lunch.say.good', 2);

    var done = S.lines.every(function (l) { return l.got >= l.count; });
    if (done) roundComplete();
  }

  function roundComplete() {
    S.roundActive = false;
    S.mode = 'between';
    setPlaying(false);
    var frac = remainingFrac();
    var perfect = frac >= PERFECT_FRAC;
    var n = totalItems();
    S.served++;
    S.combo++;
    if (S.combo > S.bestCombo) S.bestCombo = S.combo;
    S.lines.forEach(function (l) { if (l.food.dessert) S.desserts += l.count; });
    if (perfect) { S.perfects++; S.streak++; } else S.streak = 0;
    var mult = 1 + Math.min(S.combo - 1, 10) * 0.05;
    var pts = Math.round((10 + 10 * n + Math.round(30 * frac) + (perfect ? 20 : 0)) * mult);
    S.score += pts;
    var sheep = S.streak >= SHEEP_STREAK;
    if (sheep) { S.sheep++; S.score += SHEEP_BONUS; }
    renderStreak(sheep ? SHEEP_STREAK : S.streak);
    if (sheep) S.streak = 0;
    updateHud();
    bump(E.scorePill);
    if (S.combo >= 2) bump(E.comboPill);

    var judgeKey = perfect ? 'lunch.pop.perfect' : 'lunch.pop.yummy';
    sfx(perfect ? 'perfect' : 'success');
    pop(t(judgeKey), perfect ? 'perfect' : 'yummy');
    pop('+' + fmt(pts), 'bonus', { delay: 120 });
    if (S.combo >= 2) pop(t('lunch.pop.combo', { n: S.combo }), 'combo', { delay: 260 });
    if (!reduced()) E.tray.classList.add('is-served');

    E.hamin.classList.add('is-eating');
    setFace('eating');
    say('lunch.say.eat');
    later(760, function () {
      E.hamin.classList.remove('is-eating');
      if (sheep) { sheepSmile(); return; }
      setFace(perfect ? 'big' : 'smile');
      if (perfect) sayOne('lunch.say.perfect', 2); else sayOne('lunch.say.yum', 3);
    });
    announce(t('lunch.announce.served', { judge: t(judgeKey), pts: fmt(pts), score: fmt(S.score) }));
    later(sheep ? 2900 : (S.round >= 10 ? 1250 : 1450), nextRound);
  }

  function sheepSmile() {
    setFace('sheep');
    say('lunch.say.sheep');
    E.hamin.classList.add('is-sheep');
    pop(t('lunch.pop.sheep'), 'sheep', { ms: 1900 });
    pop('+' + SHEEP_BONUS, 'bonus', { delay: 300, ms: 1300 });
    sfx('powerup');
    setTimeout(function () { sfx('sparkle'); }, 280);
    sheepParticles();
    renderStreak(0);
    announce(t('lunch.announce.sheep', { pts: SHEEP_BONUS }));
  }

  function failRound(kind, it) {
    S.roundActive = false;
    S.mode = 'between';
    setPlaying(false);
    S.fails++;
    S.hearts = Math.max(0, S.hearts - 1);
    S.combo = 0;
    S.streak = 0;
    renderHearts(S.hearts);
    renderStreak(0);
    updateHud();
    E.tray.classList.add('is-fail');
    if (kind === 'wrong') {
      if (it && it.el) it.el.classList.add('is-wrong');
      sfx('error');
      pop(t('lunch.pop.wrong'), 'wrong');
      setFace('surprised');
      sayOne('lunch.say.wrong', 2);
      announce(t('lunch.announce.wrong', { n: S.hearts }));
    } else {
      setTimerFrac(0);
      sfx('miss');
      pop(t('lunch.pop.timeUp'), 'timeup');
      setFace('pout');
      sayOne('lunch.say.timeUp', 2);
      announce(t('lunch.announce.timeUp', { n: S.hearts }));
    }
    if (!reduced()) {
      restart(E.scene, 'hg-shake');
      setTimeout(function () { E.scene.classList.remove('hg-shake'); }, 400);
    }
    later(1500, S.hearts <= 0 ? gameOver : nextRound);
  }

  /* ═══════════ Game lifecycle ═══════════ */
  function resetState() {
    stopLoop();
    S.tasks = [];
    cancelDrag();
    closePause();
    removeCountdown();
    closeOverlay();
    E.pops.textContent = '';
    E.fx.textContent = '';
    clearCounter();
    S.score = 0; S.hearts = MAX_HEARTS; S.round = 0; S.served = 0; S.fails = 0; S.perfects = 0;
    S.streak = 0; S.combo = 0; S.bestCombo = 0; S.sheep = 0; S.desserts = 0; S.picks = 0;
    S.lines = []; S.cells = []; S.roundActive = false; S.clock = 0; S.paused = false; S.finished = false;
    S.rushShown = false; S.prevOrderKey = ''; S.beltMs = 0; S.roundId++;
    E.hamin.classList.remove('is-eating', 'is-sheep');
    E.play.classList.remove('is-paused');
    E.pauseBtn.setAttribute('aria-pressed', 'false');
    E.rush.hidden = true;
    setPlaying(false);
    renderHearts();
    renderStreak(0);
    updateHud();
    renderIdleOrder();
    renderTray();
    setTimerFrac(1);
  }

  function startGame() {
    resetState();
    S.mode = 'countdown';
    try { if (HG.audio) HG.audio.bgm('lunch'); } catch (e) { /* ignore */ }
    if (win.matchMedia && win.matchMedia('(max-width: 720px)').matches && shell && shell.el.scrollIntoView) {
      try { shell.el.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { /* ignore */ }
    }
    focusEl(E.play);
    setFace('neutral');
    say('lunch.say.hello');
    countdown(nextRound);
    startLoop();
    if (doc.hidden) pause();          // rAF would be frozen anyway — show the pause window
  }

  function countdown(done) {
    var steps = ['3', '2', '1', 'go'];
    var i = 0;
    cdEl = h('div', { class: 'hg-countdown lt-countdown', 'aria-hidden': 'true' });
    E.stage.appendChild(cdEl);
    announce(t('lunch.announce.ready'));
    function step() {
      if (S.mode !== 'countdown' || !cdEl) return;
      var s = steps[i++];
      cdEl.textContent = '';
      if (!s) { removeCountdown(); done(); return; }
      var go = s === 'go';
      cdEl.appendChild(h('span', { class: 'hg-countdown__num' + (go ? ' hg-countdown__num--go' : '') }, go ? t('shell.go') : s));
      sfx(go ? 'go' : 'countdown');
      later(go ? 520 : 640, step);
    }
    step();
  }
  function removeCountdown() { removeEl(cdEl); cdEl = null; }

  function gameOver() {
    if (S.finished) return;
    S.finished = true;
    S.mode = 'over';
    S.roundActive = false;
    stopLoop();
    S.tasks = [];
    cancelDrag();
    setPlaying(false);
    E.rush.hidden = true;
    var prevBest = bestNow();
    var res = null;
    if (S.served + S.fails > 0 && HG.unlocks && HG.unlocks.finishGame) {
      res = HG.unlocks.finishGame(GAME, {
        score: S.score,
        stats: {
          inc: { 'lunch.rounds': S.served, 'lunch.perfects': S.perfects, 'lunch.sheepSmiles': S.sheep, 'lunch.desserts': S.desserts },
          max: { 'lunch.bestCombo': S.bestCombo }
        },
        bonus: Math.min(50, Math.floor(S.score / 500) * 10)     // modest performance bonus (≤ +50)
      });
    }
    setFace(S.sheep ? 'sheep' : S.served ? 'big' : 'pout');
    say('lunch.say.bye');
    sfx(res && res.newBest ? 'success' : 'score');
    showResults(res, prevBest);
    announce(t('lunch.announce.over', { score: fmt(S.score) }) + (res && res.newBest ? ' ' + t('shell.newRecord') : ''));
    updateHud();
  }

  function quit() {
    if (S.served + S.fails > 0) { gameOver(); return; }
    resetState();
    showTitle(true);
  }

  /* ═══════════ Overlays ═══════════ */
  function showOverlay(node, dim) {
    closeOverlay();
    overlay = h('div', { class: 'hg-overlay lt-overlay' + (dim ? ' hg-overlay--dim' : '') }, node);
    E.stage.appendChild(overlay);
    return overlay;
  }
  function closeOverlay() { removeEl(overlay); overlay = null; }

  function showTitle(focus) {
    S.mode = 'title';
    var art = h('div', { class: 'hg-start__art lt-start__art', 'aria-hidden': 'true' },
      ['ramen', 'strawberry-milk', 'dumplings'].map(function (id, i) { return foodImg(FOOD[id], 'lt-start__food lt-start__food--' + i); }));
    var startBtn = h('button', { type: 'button', class: 'hg-btn hg-btn--pink hg-btn--big lt-start__play', i18n: 'lunch.start.play' });
    startBtn.addEventListener('click', function () { sfx('click'); startGame(); });
    var howBtn = h('button', { type: 'button', class: 'hg-btn hg-btn--blue', i18n: 'lunch.start.how', 'data-sfx': 'click' });
    howBtn.addEventListener('click', function () { if (shell) shell.openHelp(); });
    var best = bestNow();
    function step(icon, key) {
      return h('li', { class: 'lt-steps__item' }, [h('span', { class: 'lt-steps__icon', 'aria-hidden': 'true' }, icon), h('span', { i18n: key })]);
    }
    var card = h('div', { class: 'hg-start lt-start', role: 'group', 'aria-labelledby': 'lt-start-t' }, [
      art,
      h('h2', { class: 'hg-start__title', id: 'lt-start-t', i18n: 'games.lunchTime.title' }),
      h('p', { class: 'hg-start__desc', i18n: 'lunch.start.desc' }),
      h('ol', { class: 'lt-steps' }, [step('📋', 'lunch.start.step1'), step('👆', 'lunch.start.step2'), step('🍱', 'lunch.start.step3')]),
      best > 0 ? h('p', { class: 'lt-start__best' }, [h('span', { class: 'lt-start__best-label', i18n: 'lunch.hud.best' }), ' ', h('b', null, fmt(best))]) : null,
      h('div', { class: 'hg-start__actions' }, [startBtn, howBtn]),
      h('p', { class: 'lt-start__keys', i18n: 'lunch.start.keys' }),
      h('p', { class: 'lt-start__look' }, [
        h('span', { i18n: 'lunch.start.look' }), ' ',
        h('a', { href: 'dress-up.html', class: 'lt-start__link', i18n: 'lunch.start.lookLink', 'data-sfx': 'click' })
      ])
    ]);
    showOverlay(card, false);
    if (focus) focusEl(startBtn);
  }

  function showResults(res, prevBest) {
    var best = res && res.best != null ? res.best : Math.max(prevBest, S.score);
    var newBest = !!(res && res.newBest);
    var rank = S.score >= 2500 ? 'S' : S.score >= 1500 ? 'A' : S.score >= 700 ? 'B' : 'C';

    var mini = h('canvas', { class: 'lt-result__face', width: '144', height: '144', 'aria-hidden': 'true' });
    var src = face.cache[face.expr] || face.cache.big || face.cache.neutral;
    if (src) { try { mini.getContext('2d').drawImage(src, 0, 0, 144, 144); } catch (e) { /* ignore */ } }
    else renderExpr(face.expr).then(function (c) { try { mini.getContext('2d').drawImage(c, 0, 0, 144, 144); } catch (e) { /* ignore */ } });

    function row(key, val, cls) {
      return h('div', { class: 'hg-result__row' + (cls ? ' ' + cls : '') }, [
        h('dt', { class: 'hg-result__label', i18n: key }),
        h('dd', { class: 'hg-result__value' }, String(val))
      ]);
    }
    var rows = h('dl', { class: 'hg-result__rows lt-result__rows' }, [
      row('lunch.result.rounds', fmt(S.served)),
      row('lunch.result.perfects', fmt(S.perfects)),
      row('lunch.result.bestCombo', fmt(S.bestCombo)),
      row('lunch.result.desserts', fmt(S.desserts)),
      S.sheep ? row('lunch.result.sheep', '🐑 ×' + S.sheep, 'lt-result__row--sheep') : null,
      row('lunch.result.score', fmt(S.score), 'lt-result__row--big'),
      row('lunch.result.best', fmt(best), 'lt-result__row--big')
    ]);

    var unlocks = null;
    if (res && res.unlocked && res.unlocked.length) {
      unlocks = h('div', { class: 'lt-result__unlocks' }, [
        h('p', { class: 'lt-result__unlocks-title', i18n: 'lunch.result.unlocked' }),
        h('div', { class: 'hg-result__unlocks' }, res.unlocked.slice(0, 8).map(function (u) {
          var name = HG.i18n ? HG.i18n.itemName(u.kind, u.id) : u.id;
          return h('span', { class: 'hg-result__unlock', title: name }, HG.ui.itemIcon(u.kind, u.id, { alt: name, lazy: false }));
        }))
      ]);
    }

    var retry = h('button', { type: 'button', class: 'hg-btn hg-btn--pink hg-btn--big', i18n: 'lunch.result.retry' });
    retry.addEventListener('click', function () { sfx('click'); startGame(); });
    var back = h('a', { class: 'hg-btn hg-btn--blue hg-btn--big', href: 'index.html', i18n: 'lunch.result.back', 'data-sfx': 'click' });

    var panel = h('div', { class: 'hg-result lt-result', role: 'dialog', 'aria-labelledby': 'lt-result-t' }, [
      h('div', { class: 'hg-result__head lt-result__head' }, [
        h('div', { class: 'lt-result__top' }, [
          h('span', { class: 'lt-result__frame' }, mini),
          h('span', { class: 'hg-result__rank hg-rank--' + rank, role: 'img', 'aria-label': t('lunch.result.rank', { r: rank }) }, rank)
        ]),
        h('h2', { class: 'hg-result__title', id: 'lt-result-t', i18n: 'lunch.result.title' }),
        newBest ? h('p', { class: 'hg-result__record', i18n: 'shell.newRecord' }) : null
      ]),
      rows,
      res && res.earned ? tp('p', 'hg-result__earned', 'shell.earned', { n: res.earned }) : null,
      unlocks,
      h('div', { class: 'hg-result__actions' }, [retry, back])
    ]);
    showOverlay(panel, true);
    focusEl(retry);
    if (newBest && HG.ui.sparkleBurst) {
      var r = panel.getBoundingClientRect();
      HG.ui.sparkleBurst(r.left + r.width / 2, r.top + 40, 14);
    }
  }

  /* ═══════════ Pause ═══════════ */
  function pause() {
    if (S.paused || !inGame()) return;
    S.paused = true;
    stopLoop();
    cancelDrag();
    E.play.classList.add('is-paused');
    E.pauseBtn.setAttribute('aria-pressed', 'true');
    var resumeBtn = h('button', { type: 'button', class: 'hg-btn hg-btn--pink hg-btn--big', i18n: 'shell.resume' });
    resumeBtn.addEventListener('click', function () { sfx('click'); resume(); });
    var restartBtn = h('button', { type: 'button', class: 'hg-btn hg-btn--blue', i18n: 'shell.restart', 'data-sfx': 'click' });
    restartBtn.addEventListener('click', function () { startGame(); });
    var quitBtn = h('button', { type: 'button', class: 'hg-btn', i18n: 'shell.quit', 'data-sfx': 'click' });
    quitBtn.addEventListener('click', function () { closePause(); S.paused = false; E.play.classList.remove('is-paused'); quit(); });
    pauseEl = h('div', { class: 'hg-overlay hg-overlay--dim lt-overlay lt-pause-layer' },
      h('div', { class: 'hg-window hg-window--pink hg-pause lt-pause', role: 'dialog', 'aria-labelledby': 'lt-pause-t' }, [
        h('div', { class: 'hg-window__title' }, h('span', { class: 'hg-window__label', i18n: 'games.lunchTime.title' })),
        h('p', { class: 'hg-pause__title', id: 'lt-pause-t', i18n: 'shell.paused' }),
        h('div', { class: 'hg-pause__actions' }, [resumeBtn, restartBtn, quitBtn]),
        h('p', { class: 'lt-pause__hint', i18n: 'shell.pauseHint' })
      ]));
    E.stage.appendChild(pauseEl);
    focusEl(resumeBtn);
    announce(t('shell.paused'));
  }

  function closePause() { removeEl(pauseEl); pauseEl = null; }

  function resume() {
    if (!S.paused) return;
    closePause();
    S.paused = false;
    E.play.classList.remove('is-paused');
    E.pauseBtn.setAttribute('aria-pressed', 'false');
    focusEl(E.play);
    startLoop();
  }

  function togglePause() { if (S.paused) resume(); else pause(); }

  /* ═══════════ Input ═══════════ */
  function onBeltClick(e) {
    var btn = e.target && e.target.closest ? e.target.closest('.lt-food') : null;
    if (!btn || suppressClick) return;
    var it = itemByUid(Number(btn.getAttribute('data-uid')));
    if (it) pick(it, 'click');
  }

  function dropZoneAt(x, y) {
    var zones = [E.tray, E.order, E.faceFrame];
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i];
      if (!visible(z)) continue;
      var r = z.getBoundingClientRect();
      if (x >= r.left - 8 && x <= r.right + 8 && y >= r.top - 8 && y <= r.bottom + 8) return z;
    }
    return null;
  }

  function onPointerDown(e) {
    var btn = e.target && e.target.closest ? e.target.closest('.lt-food') : null;
    if (!btn || !canPick() || btn.classList.contains('is-leaving')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    cancelDrag();
    drag = { uid: Number(btn.getAttribute('data-uid')), id: e.pointerId, x0: e.clientX, y0: e.clientY, on: false, ghost: null, item: null, zone: null };
  }

  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.on) {
      var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
      if (dx * dx + dy * dy < 110) return;
      var it = itemByUid(drag.uid);
      if (!it || !canPick()) { drag = null; return; }
      drag.on = true;
      drag.item = it;
      drag.ghost = foodImg(it.food, 'lt-ghost');
      doc.body.appendChild(drag.ghost);
      it.el.classList.add('is-dragging');
      E.play.classList.add('is-dragging');
    }
    drag.ghost.style.left = e.clientX + 'px';
    drag.ghost.style.top = e.clientY + 'px';
    var z = dropZoneAt(e.clientX, e.clientY);
    if (z !== drag.zone) {
      if (drag.zone) drag.zone.classList.remove('is-over');
      if (z) z.classList.add('is-over');
      drag.zone = z;
    }
    if (e.cancelable) e.preventDefault();
  }

  function endDrag(e, drop) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    var d = drag;
    drag = null;
    if (!d.on) return;                              // a plain tap → the click handler picks it
    removeEl(d.ghost);
    if (d.zone) d.zone.classList.remove('is-over');
    if (d.item && d.item.el) d.item.el.classList.remove('is-dragging');
    E.play.classList.remove('is-dragging');
    suppressClick = true;
    setTimeout(function () { suppressClick = false; }, 80);
    if (drop && e && dropZoneAt(e.clientX, e.clientY) && d.item && !d.item.gone) pick(d.item, 'drag');
  }
  function cancelDrag() {
    if (!drag) return;
    var d = drag;
    drag = null;
    removeEl(d.ghost);
    if (d.zone) d.zone.classList.remove('is-over');
    if (d.item && d.item.el) d.item.el.classList.remove('is-dragging');
    E.play.classList.remove('is-dragging');
  }

  function onKey(e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (HG.ui.isModalOpen && HG.ui.isModalOpen()) return;
    var tg = e.target, tag = tg && tg.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (tg && tg.isContentEditable)) return;
    var k = e.key;
    if (k === 'p' || k === 'P' || e.code === 'KeyP' || k === 'Escape' || k === 'Esc') {
      if (S.paused) { e.preventDefault(); resume(); }
      else if (inGame()) { e.preventDefault(); pause(); }
      return;
    }
    if (S.paused || S.mode !== 'play' || e.repeat) return;
    var idx = KEYS.indexOf(k);
    if (idx === -1 && e.code && /^(Digit|Numpad)\d$/.test(e.code)) idx = KEYS.indexOf(e.code.slice(-1));
    if (idx === -1) return;
    e.preventDefault();
    flashSlot(idx);
    if (S.slots[idx]) pick(S.slots[idx], 'key');
  }

  function autoPause() { if (inGame() && !S.paused) pause(); }

  function refreshLang() {
    doc.title = t('lunch.docTitle');
    updateSlotLabels();
    renderHearts();
    renderStreak(S.streak);
    E.face.setAttribute('aria-label', t('lunch.face.' + face.expr));
  }

  /* ═══════════ Init ═══════════ */
  function preload() {
    FOODS.forEach(function (f) { var i = new Image(); i.decoding = 'async'; i.src = f.src; });
  }

  function init() {
    var shellEl = doc.getElementById('game');
    if (!shellEl || !HG.ui || !HG.ui.el) return;
    shell = HG.ui.mountGameShell(shellEl, { game: GAME, titleKey: 'games.lunchTime.title', helpKey: 'lunch.help' });

    ['stage', 'play', 'score', 'combo', 'round', 'best', 'streak', 'lives', 'pause', 'scene', 'hamin', 'face', 'fx', 'say',
     'order', 'tray', 'timer', 'belt', 'rush', 'pops'].forEach(function (id) { E[id] = doc.getElementById('lt-' + id); });
    E.pauseBtn = E.pause;
    E.scorePill = doc.getElementById('lt-score-pill');
    E.comboPill = doc.getElementById('lt-combo-pill');
    E.bestPill = doc.getElementById('lt-best-pill');
    E.faceFrame = doc.getElementById('lt-face-frame');
    E.orderNo = doc.getElementById('lt-order-no');
    E.orderList = doc.getElementById('lt-order-list');
    E.trayCells = doc.getElementById('lt-tray-cells');
    E.timerFill = doc.getElementById('lt-timer-fill');

    buildSlots();
    preload();
    initFace();

    E.belt.addEventListener('click', onBeltClick);
    E.belt.addEventListener('pointerdown', onPointerDown);
    E.belt.addEventListener('animationend', function (e) {
      var el = e.target;
      if (el && el.classList && el.classList.contains('is-enter')) { el.classList.remove('is-enter'); el.style.removeProperty('--d'); }
      if (el === E.belt) E.belt.classList.remove('is-rolling');
    });
    doc.addEventListener('pointermove', onPointerMove, { passive: false });
    doc.addEventListener('pointerup', function (e) { endDrag(e, true); });
    doc.addEventListener('pointercancel', function (e) { endDrag(e, false); });
    doc.addEventListener('keydown', onKey);
    E.pauseBtn.addEventListener('click', function () { sfx('click'); togglePause(); });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) autoPause(); });
    win.addEventListener('blur', function () { if (drag) cancelDrag(); });
    doc.addEventListener('hg:modal', function (e) { if (e.detail && e.detail.open) autoPause(); });
    doc.addEventListener('hg:lang', refreshLang);

    resetState();
    doc.title = t('lunch.docTitle');
    setFace('neutral');
    say('lunch.say.hello');
    showTitle(false);

    HG.lunchTime = {
      start: startGame,
      pause: pause,
      resume: resume,
      state: function () {
        return {
          mode: S.mode, paused: S.paused, running: S.running, round: S.round, score: S.score, hearts: S.hearts,
          served: S.served, fails: S.fails, perfects: S.perfects, streak: S.streak, combo: S.combo,
          bestCombo: S.bestCombo, sheep: S.sheep, desserts: S.desserts, beltMs: S.beltMs,
          roundDur: S.roundDur, remaining: S.roundActive ? remainingFrac() : null, tasks: S.tasks.length,
          order: S.lines.map(function (l) { return { id: l.food.id, count: l.count, got: l.got }; }),
          slots: S.slots.map(function (it) { return it ? it.food.id : null; })
        };
      }
    };
  }

  HG.onReady(init);
})(window.HG = window.HG || {}, window, document);

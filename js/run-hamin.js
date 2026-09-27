/* HAMIN GAMES — js/run-hamin.js
   RUN, HAMIN! — comedic endless runner on Canvas 2D (docs/CONTRACT.md §5, §7.2).

   Hamin meets an overly enthusiastic (and completely harmless) puppy and runs.
   Obstacles make him stumble and the puppy gets closer; hearts and snacks push
   the puppy back (he stops to sniff!). Gap 0 = caught → cute game over, the
   puppy just wanted to play ♡.

   Loop     requestAnimationFrame + fixed 1/240 s update step (dt clamped to 0.1 s).
            Stops while paused / hidden; auto-pauses on blur, hidden tab, open modal.
   Canvas   logical 960×540 (16:9), backing store = CSS width × devicePixelRatio (≤ 2).
   Art      assets/runner/* (docs/ASSET_PLAN.md). Every image has a code-drawn fallback.
   Rewards  only HG.unlocks.finishGame(...) at the end of a run (stat keys §7.2).
   Strings  data/translations-run-hamin.js (run.*) + common shell.* / games.* keys.
   Debug    ?debug=1 → HG.runHamin (console only). */
(function (HG, win, doc) {
  'use strict';

  if (!doc.getElementById('rh-canvas')) return;

  /* ═══════════ 0. Constants ═══════════ */
  var GAME = 'run-hamin';
  var W = 960, H = 540;                    // logical canvas size
  var GY = 452;                            // feet line
  var BAND_TOP = GY - 34;                  // top of the code-drawn ground band
  var LOW_TOP = GY + 36;                   // near verge strip
  var HAM_X = 330;                         // Hamin's screen x
  var PX_PER_M = 40;
  var STAGE_M = 400;
  var STAGES = ['school', 'park', 'city', 'river', 'festival'];
  var ART = 'assets/runner/';
  var BG_H = 470, BG_TOP = GY + 8 - BG_H, BG_TILE = Math.round(2100 * BG_H / 900);
  var HAM_W = 134, HAM_H = 168;            // 320×400 sprite × 0.42
  var DOG_W = 126, DOG_H = 109;            // 300×260 sprite × 0.42
  var STEP = 1 / 240;
  var EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",';

  var PHYS = {
    v0: 380, accel: 5, vmax: 820,
    jumpV: 820, gHold: 1500, gFall: 4000, holdMax: 0.26, holdMin: 0.06,
    superMul: 1.2, fastFall: 1900, coyote: 0.09, buffer: 0.14
  };
  var GAPC = {
    start: 62, hit: 22, stumble: 11, drain0: 0.9, drain1: 2.2,
    heart: 14, snack: 6, sniffRate: 10, sniffT: 1.3, burstRate: 8, warn: 25, rearm: 38
  };
  var GAP_PX = 2.5, DOG_NEAR = 74;         // dog screen x = HAM_X - DOG_NEAR - gap * GAP_PX
  var POW_T = { speed: 3.2, jump: 10, snack: 3.8 };

  /* Obstacles: art aspect (w/h from docs/ASSET_PLAN.md), drawn height, hitbox fractions [x0,x1,y0,y1]. */
  var OBS = {
    box:       { h: 70, aspect: 254 / 256, hb: [0.12, 0.88, 0, 0.88], emoji: '📦' },
    cone:      { h: 72, aspect: 217 / 256, hb: [0.24, 0.76, 0, 0.9], emoji: '🚧' },
    hydrant:   { h: 80, aspect: 173 / 256, hb: [0.2, 0.8, 0, 0.9], emoji: '🧯' },
    flowerpot: { h: 66, aspect: 224 / 256, hb: [0.18, 0.82, 0, 0.78], emoji: '🪴' },
    bag:       { h: 54, aspect: 256 / 227, hb: [0.14, 0.86, 0, 0.84], emoji: '🎒' },
    sign:      { h: 88, aspect: 218 / 256, hb: [0.16, 0.84, 0, 0.92], emoji: '🪧' },
    bench:     { h: 74, aspect: 256 / 245, hb: [0.1, 0.9, 0, 0.7], emoji: '🪑' },
    puddle:    { h: 50, aspect: 256 / 136, hb: [0.16, 0.84, 0, 0.26], sink: 12, emoji: '💧' },
    bunting:   { overhead: true, w: 176, bottom: 98 },
    lanterns:  { overhead: true, w: 176, bottom: 98 }
  };
  var POOLS = {
    school:   ['box', 'bag', 'cone', 'sign', 'puddle', 'box'],
    park:     ['flowerpot', 'bench', 'puddle', 'bag', 'cone'],
    city:     ['cone', 'hydrant', 'sign', 'box', 'bag'],
    river:    ['puddle', 'bench', 'flowerpot', 'bag', 'cone'],
    festival: ['sign', 'box', 'flowerpot', 'bag', 'hydrant']
  };
  var SMALL = { box: 1, bag: 1, puddle: 1, flowerpot: 1, cone: 1 };
  var ITEMS = {
    star:  { size: 40, img: 'col-star', glyph: '★', tone: 'gold' },
    heart: { size: 42, img: 'col-heart', glyph: '♥', tone: 'pinkDeep' },
    snack: { size: 46, img: 'col-snack', glyph: '🍪', tone: 'orange' },
    note:  { size: 40, img: 'col-note', glyph: '♪', tone: 'lavenderDark' }
  };
  var POWS = {
    speed:  { img: 'pow-speed', glyph: '⚡' },
    jump:   { img: 'pow-jump', glyph: '⤴' },
    shield: { img: 'pow-shield', glyph: '★' },
    snack:  { img: 'pow-snack', glyph: '🍪' }
  };
  var GROUND = {
    school:   { style: 'tiles', tile: 72 },
    park:     { style: 'pebbles', tile: 90 },
    city:     { style: 'tiles', tile: 104 },
    river:    { style: 'track', tile: 120 },
    festival: { style: 'bricks', tile: 56 }
  };
  var CORE = ['hamin-run-1', 'hamin-run-2', 'hamin-run-3', 'hamin-run-4', 'hamin-jump', 'hamin-duck', 'hamin-startled',
    'dog-run-1', 'dog-run-2', 'dog-run-3', 'dog-run-4', 'dog-happy', 'dog-hop',
    'obs-box', 'obs-puddle', 'obs-bench', 'obs-cone', 'obs-bag', 'obs-sign', 'obs-hydrant', 'obs-flowerpot',
    'col-star', 'col-heart', 'col-snack', 'col-note', 'pow-speed', 'pow-jump', 'pow-shield', 'pow-snack', 'bg-school'];

  /* ═══════════ 1. Helpers ═══════════ */
  function $(id) { return doc.getElementById(id); }
  function t(k, p) { return HG.t ? HG.t(k, p) : String(k); }
  function sfx(n, o) { try { if (HG.audio) HG.audio.sfx(n, o); } catch (e) { /* sound never breaks the game */ } }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function weighted(list) {
    var sum = 0, i;
    for (i = 0; i < list.length; i++) sum += Math.max(0, list[i][1]);
    var r = Math.random() * sum;
    for (i = 0; i < list.length; i++) {
      if (list[i][1] <= 0) continue;
      r -= list[i][1];
      if (r <= 0) return list[i][0];
    }
    return list[0][0];
  }
  function motionReduced() { return !!(HG.ui && HG.ui.reducedMotion && HG.ui.reducedMotion()); }
  function fmtM(m) { return HG.ui && HG.ui.formatScore ? HG.ui.formatScore(m, 'meters') : m + ' m'; }
  function h(tag, props, kids) { return HG.ui.el(tag, props, kids); }
  function focusEl(node) { if (!node) return; try { node.focus({ preventScroll: true }); } catch (e) { try { node.focus(); } catch (e2) { /* ignore */ } } }
  function bestNow() {
    var b = HG.save && HG.save.get ? HG.save.get('best.' + GAME, 0) : 0;
    b = Number(b);
    return isFinite(b) ? b : 0;
  }
  function playedCount() {
    var n = HG.save && HG.save.get ? Number(HG.save.get('stats.games.played.' + GAME, 0)) : 0;
    return isFinite(n) ? n : 0;
  }

  var timers = [];
  function later(fn, ms) {
    var id = setTimeout(function () {
      var i = timers.indexOf(id);
      if (i >= 0) timers.splice(i, 1);
      fn();
    }, ms);
    timers.push(id);
    return id;
  }
  function clearTimers() { for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers.length = 0; }

  var lastSay = 0;
  function say(key, params, force) {
    if (!HG.ui || !HG.ui.announce) return;
    var now = Date.now();
    if (!force && now - lastSay < 1500) return;
    lastSay = now;
    HG.ui.announce(t(key, params));
  }

  /* ═══════════ 2. Images (lazy, own assets only, graceful fallback) ═══════════ */
  var IM = {}, coreTotal = CORE.length, coreDone = 0, renderQueued = false;
  var HRUN = [], DRUN = [];

  function load(key, core) {
    if (IM[key]) return IM[key];
    var rec = IM[key] = { img: new Image(), ok: false, bad: false };
    rec.img.decoding = 'async';
    rec.img.onload = function () {
      rec.ok = rec.img.naturalWidth > 0;
      if (!rec.ok) rec.bad = true;
      imgSettled(core);
    };
    rec.img.onerror = function () {
      rec.bad = true;
      if (win.console) console.info('[RUN, HAMIN!] image not found yet, drawing a fallback: ' + ART + key + '.webp');
      imgSettled(core);
    };
    rec.img.src = ART + key + '.webp';
    return rec;
  }
  function I(key) { var r = IM[key]; return r && r.ok ? r.img : null; }

  function imgSettled(core) {
    if (core) coreDone++;
    HRUN = ['hamin-run-1', 'hamin-run-2', 'hamin-run-3', 'hamin-run-4'].filter(I);
    DRUN = ['dog-run-1', 'dog-run-2', 'dog-run-3', 'dog-run-4'].filter(I);
    updateLoadLine();
    queueRender();
  }
  function loadCore() { CORE.forEach(function (k) { load(k, true); }); }
  function loadAllBgs() { STAGES.forEach(function (id) { load('bg-' + id, false); }); }

  /* ═══════════ 3. Colors (read from CSS tokens; see css/run-hamin.css) ═══════════ */
  var C = {};
  var TOKENS = {
    ink: '--c-ink', inkSoft: '--c-ink-soft', white: '--c-white', pink: '--c-pink', pinkDeep: '--c-pink-deep',
    blush: '--c-blush', cherry: '--c-cherry', cherryDark: '--c-cherry-dark', cream: '--c-cream', gold: '--c-gold',
    goldDeep: '--c-gold-deep', orange: '--c-orange', orangeDark: '--c-orange-dark', powder: '--c-powder',
    powderDeep: '--c-powder-deep', sky: '--c-sky', blueDeep: '--c-blue-deep', mint: '--c-mint', mintDeep: '--c-mint-deep',
    mintDark: '--c-mint-dark', lavender: '--c-lavender', lavenderDeep: '--c-lavender-deep', lavenderDark: '--c-lavender-dark',
    silver: '--c-silver', silverDeep: '--c-silver-deep', shade: '--c-shade', shadeDeep: '--c-shade-deep',
    hair: '--rh-hair', skin: '--rh-skin', cheek: '--rh-cheek', shirt: '--rh-shirt', pants: '--rh-pants', shoe: '--rh-shoe',
    fur: '--rh-fur', furShade: '--rh-fur-shade', collar: '--rh-collar', water: '--rh-water', night: '--rh-night'
  };
  function readColors(host) {
    var cs = null;
    try { cs = win.getComputedStyle(host); } catch (e) { /* ignore */ }
    var k;
    for (k in TOKENS) {
      if (!Object.prototype.hasOwnProperty.call(TOKENS, k)) continue;
      C[k] = (cs && cs.getPropertyValue(TOKENS[k]).trim()) || 'gray';
    }
    STAGES.forEach(function (id) {
      ['', '-line', '-low'].forEach(function (suf) {
        C['g-' + id + suf] = (cs && cs.getPropertyValue('--rh-g-' + id + suf).trim()) || 'gray';
      });
    });
    C.font = (cs && cs.getPropertyValue('--font-title').trim()) || 'sans-serif';
  }

  /* ═══════════ 4. State ═══════════ */
  var G = {
    state: 'boot', clock: 0, t: 0, cam: 0, speed: 0, baseSpeed: PHYS.v0, speedMul: 1,
    gap: GAPC.start, closeArmed: true,
    ham: { y: 0, vy: 0, ground: true, hold: 0, holding: false, coyote: 0, buffer: 0, duckT: 0,
           stumble: 0, inv: 0, phase: 0, dustT: 0, wasDuck: false, jumpT: 0 },
    dog: { x: 0, y: 0, vy: 0, phase: 0, barkT: 2 },
    obs: [], items: [], parts: [], floats: [], lines: [],
    nextX: 0, powNextX: 0, snackNextX: 0, firstObs: true,
    stars: 0, snacks: 0, notes: 0, powerups: 0, combo: 0, maxCombo: 0, mult: 1, hits: 0,
    pow: { speed: 0, jump: 0, shield: false, sniff: 0 },
    stageAbs: 0, prevStageAbs: 0, stageFade: 1, reached: {},
    prevBest: 0, recordShown: false, hintJump: false, hintDuck: false,
    shake: 0, cd: 0, cdStep: 0.8, cdLast: 0, cdMode: 'start',
    caughtT: 0, caughtSpeed: 0, sat: false, heartT: 0, resultT: 0, lastM: 0
  };
  var input = { jumpHeld: false, duckHeld: false };
  var reduced = false;

  /* ═══════════ 5. DOM ═══════════ */
  var el = {}, shell = null, canvas = null, ctx = null, scale = 1;

  function cacheDom() {
    ['rh-stage', 'rh-frame', 'rh-canvas', 'rh-hud', 'rh-dist', 'rh-stars', 'rh-snacks', 'rh-combo', 'rh-combo-pill', 'rh-gap',
     'rh-pause-btn', 'rh-pows', 'rh-alerts', 'rh-banner', 'rh-banner-no', 'rh-banner-name', 'rh-deck', 'rh-btn-duck',
     'rh-btn-jump', 'rh-start', 'rh-start-btn', 'rh-help-btn', 'rh-start-best', 'rh-start-load', 'rh-start-dog',
     'rh-start-ham', 'rh-countdown', 'rh-pause', 'rh-resume-btn', 'rh-restart-btn', 'rh-quit-btn', 'rh-result',
     'rh-result-pup', 'rh-result-title', 'rh-result-line', 'rh-result-record', 'rh-r-dist', 'rh-r-stars', 'rh-r-snacks',
     'rh-r-stage', 'rh-r-best', 'rh-r-earned', 'rh-r-unlockbox', 'rh-r-unlocks', 'rh-retry-btn'
    ].forEach(function (id) { el[id.replace(/^rh-/, '').replace(/-([a-z])/g, function (m, c) { return c.toUpperCase(); })] = $(id); });
  }

  function resize() {
    if (!canvas) return;
    var w = el.frame.clientWidth || W;
    var dpr = Math.min(2, win.devicePixelRatio || 1);
    var bw = Math.max(1, Math.round(w * dpr));
    var bh = Math.max(1, Math.round(w * 9 / 16 * dpr));
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    scale = bw / W;
    if (!rafId) render();
  }

  /* ═══════════ 6. Run lifecycle ═══════════ */
  function resetRun() {
    clearTimers();
    G.t = 0; G.cam = 0; G.baseSpeed = PHYS.v0; G.speed = 0; G.speedMul = 1;
    G.gap = GAPC.start; G.closeArmed = true;
    var hm = G.ham;
    hm.y = 0; hm.vy = 0; hm.ground = true; hm.hold = 0; hm.holding = false; hm.coyote = 0; hm.buffer = 0;
    hm.duckT = 0; hm.stumble = 0; hm.inv = 0; hm.phase = 0; hm.dustT = 0; hm.wasDuck = false; hm.jumpT = 0;
    var d = G.dog;
    d.x = HAM_X - DOG_NEAR - G.gap * GAP_PX - 70; d.y = 0; d.vy = 0; d.phase = 0; d.barkT = 2;
    G.obs.length = 0; G.items.length = 0; G.parts.length = 0; G.floats.length = 0;
    G.nextX = 880; G.powNextX = PHYS.v0 * 13; G.snackNextX = PHYS.v0 * 7; G.firstObs = true;
    G.stars = 0; G.snacks = 0; G.notes = 0; G.powerups = 0; G.combo = 0; G.maxCombo = 0; G.mult = 1; G.hits = 0;
    G.pow.speed = 0; G.pow.jump = 0; G.pow.shield = false; G.pow.sniff = 0;
    G.stageAbs = 0; G.prevStageAbs = 0; G.stageFade = 1; G.reached = { school: true };
    G.prevBest = bestNow(); G.recordShown = false;
    G.hintJump = G.hintDuck = playedCount() < 3;
    G.shake = 0; G.caughtT = 0; G.sat = false; G.heartT = 0; G.resultT = 0; G.lastM = 0;
    input.jumpHeld = false; input.duckHeld = false;
    ptr = null;
    releaseDeck();
    if (el.alerts) el.alerts.textContent = '';
    if (el.banner) el.banner.hidden = true;
    hidePowChips();
    initLines();
    updateHud(true);
  }

  function showTitle(focus) {
    hideCountdown();
    el.pause.hidden = true;
    el.result.hidden = true;
    resetRun();
    G.state = 'title';
    updateBestLine();
    el.start.hidden = false;
    if (focus) focusEl(el.startBtn);
    queueRender();
    startLoop();
  }

  function startRun() {
    if (HG.audio) HG.audio.bgm('run');
    el.start.hidden = true;
    el.result.hidden = true;
    el.pause.hidden = true;
    resetRun();
    loadAllBgs();
    beginCountdown('start');
    focusEl(canvas);
    ensureVisible();
    startLoop();
  }

  function ensureVisible() {
    var sh = shell ? shell.el : el.stage;
    if (!sh || !sh.getBoundingClientRect) return;
    var r = sh.getBoundingClientRect();
    var tab = doc.querySelector('.hg-tabbar');
    var bottomSafe = win.innerHeight - (tab && tab.offsetHeight && win.getComputedStyle(tab).display !== 'none' ? tab.offsetHeight : 0);
    if (r.top < 0 || r.bottom > bottomSafe) {
      try { win.scrollTo({ top: Math.max(0, win.pageYOffset + r.top - 6), behavior: reduced ? 'auto' : 'smooth' }); }
      catch (e) { win.scrollTo(0, Math.max(0, win.pageYOffset + r.top - 6)); }
    }
  }

  function beginCountdown(mode) {
    G.state = 'countdown';
    G.cdMode = mode;
    G.cdStep = mode === 'start' ? 0.8 : 0.55;
    G.cd = G.cdStep * 3;
    G.cdLast = 0;
    input.jumpHeld = false; input.duckHeld = false;
    el.countdown.textContent = '';
    el.countdown.hidden = false;
  }

  function showCount(n) {
    el.countdown.hidden = false;
    el.countdown.textContent = '';
    el.countdown.appendChild(h('span', { class: 'hg-countdown__num' + (n === 0 ? ' hg-countdown__num--go' : '') },
      n === 0 ? t('shell.go') : String(n)));
  }
  function hideCountdown() { el.countdown.hidden = true; el.countdown.textContent = ''; }

  function updateCountdown(dt) {
    G.cd -= dt;
    var n = Math.ceil(G.cd / G.cdStep - 1e-6);
    if (G.cd > 0 && n !== G.cdLast) { G.cdLast = n; showCount(n); sfx('countdown'); }
    if (G.cd <= 0) go();
  }

  function go() {
    G.state = 'play';
    showCount(0);
    sfx('go');
    later(function () { if (G.state !== 'countdown') hideCountdown(); }, 650);
    if (G.cdMode === 'start') {
      alertPop('run.alert.go', 'pink');
      say('run.say.start', null, true);
    } else {
      say('run.say.resumed', null, true);
    }
  }

  function pause(reason) {
    if (G.state !== 'play' && G.state !== 'countdown') return;
    G.state = 'paused';
    input.jumpHeld = false; input.duckHeld = false;
    ptr = null;
    releaseDeck();
    hideCountdown();
    el.pause.hidden = false;
    stopLoop();
    render();
    if (HG.audio) HG.audio.stopBgm();
    if (reason !== 'modal') focusEl(el.resumeBtn);
    say('run.say.paused', null, true);
  }

  function resume() {
    if (G.state !== 'paused') return;
    el.pause.hidden = true;
    if (HG.audio) HG.audio.bgm('run');
    beginCountdown('resume');
    focusEl(canvas);
    startLoop();
  }

  function caught() {
    if (G.state !== 'play') return;
    G.state = 'caught';
    G.caughtT = 0;
    G.caughtSpeed = G.speed;
    G.sat = false;
    G.heartT = 0;
    G.ham.inv = 0; G.ham.duckT = 0; G.ham.stumble = 0;
    input.jumpHeld = false; input.duckHeld = false;
    releaseDeck();
    hidePowChips();
    sfx('bark');
    alertPop('run.alert.caught', 'love');
    say('run.say.caught', null, true);
  }

  function showResult() {
    if (G.state !== 'caught') return;
    G.state = 'result';
    G.resultT = 0;
    var m = Math.max(0, Math.floor(G.cam / PX_PER_M));
    var reachedIds = STAGES.filter(function (id) { return G.reached[id]; });
    var bonus = Math.min(60, Math.floor(G.stars / 5));
    var res = null;
    try {
      if (HG.unlocks && HG.unlocks.finishGame) {
        res = HG.unlocks.finishGame(GAME, {
          score: m,
          stats: {
            inc: { 'run.totalDistance': m, 'run.snacks': G.snacks, 'run.stars': G.stars, 'run.caught': 1, 'run.powerups': G.powerups },
            max: { 'run.bestDistance': m }
          },
          flags: reachedIds.map(function (id) { return 'run.stage.' + id; }),
          bonus: bonus
        });
      }
    } catch (e) { if (win.console) console.error('[RUN, HAMIN!] finishGame failed', e); }
    res = res || { earned: 0, newBest: false, best: Math.max(m, G.prevBest), unlocked: [] };
    G.lastResult = { m: m, res: res };

    // Fill the result window
    var line = 'run.over.line' + (1 + ((Math.random() * 3) | 0));
    if (Math.random() < 0.5) line = 'run.over.line1';           // the classic line shows most often
    el.resultLine.setAttribute('data-i18n', line);
    el.rStage.setAttribute('data-i18n', 'run.stage.' + STAGES[G.stageAbs % STAGES.length]);
    el.rEarned.setAttribute('data-i18n', 'shell.earned');
    el.rEarned.setAttribute('data-i18n-params', JSON.stringify({ n: res.earned || 0 }));
    fillResultNumbers();
    el.resultRecord.hidden = !(res.newBest && m > 0);
    el.rUnlocks.textContent = '';
    var got = (res.unlocked || []).slice(0, 8);
    got.forEach(function (u) {
      var name = HG.i18n ? HG.i18n.itemName(u.kind, u.id) : u.id;
      var icon = HG.ui.itemIcon(u.kind, u.id, { className: 'hg-result__unlock', lazy: false, alt: name });
      icon.title = name;
      el.rUnlocks.appendChild(icon);
    });
    el.rUnlockbox.hidden = !got.length;
    if (HG.i18n) HG.i18n.apply(el.result);

    el.result.hidden = false;
    focusEl(el.retryBtn);
    say('run.say.result', { d: fmtM(m), s: G.stars, k: G.snacks }, true);
    if (res.newBest && m > 0 && HG.ui.sparkleBurst) {
      later(function () {
        var b = el.resultRecord.getBoundingClientRect();
        HG.ui.sparkleBurst(b.left + b.width / 2, b.top + b.height / 2, 12);
      }, 420);
    }
  }

  function fillResultNumbers() {
    var lr = G.lastResult;
    if (!lr) return;
    el.rDist.textContent = fmtM(lr.m);
    el.rStars.textContent = HG.ui.formatNum(G.stars);
    el.rSnacks.textContent = HG.ui.formatNum(G.snacks);
    var best = lr.res && lr.res.best != null ? lr.res.best : Math.max(lr.m, G.prevBest);
    el.rBest.textContent = fmtM(best);
  }

  function updateBestLine() {
    var b = bestNow();
    el.startBest.textContent = b > 0 ? t('games.best', { v: fmtM(b) }) : t('games.noBest');
  }

  function updateLoadLine() {
    if (!el.startLoad) return;
    if (coreDone >= coreTotal) { el.startLoad.hidden = true; return; }
    el.startLoad.hidden = false;
    el.startLoad.textContent = t('run.start.loading', { n: Math.round(coreDone * 100 / coreTotal) });
  }

  /* ═══════════ 7. Input ═══════════ */
  var ptr = null;

  function isDuck() { return G.ham.ground && G.state === 'play' && (input.duckHeld || G.ham.duckT > 0); }

  function pressJump() {
    input.jumpHeld = true;
    if (G.state === 'caught') { if (G.caughtT > 1) showResult(); return; }
    if (G.state !== 'play') return;
    G.ham.buffer = PHYS.buffer;
  }
  function releaseJump() { input.jumpHeld = false; }

  function pressDuck(timed) {
    if (timed) G.ham.duckT = 0.7; else input.duckHeld = true;
    if (G.state !== 'play') return;
    var hm = G.ham;
    if (!hm.ground) {                       // in the air: drop down fast
      hm.vy = Math.min(hm.vy, -PHYS.fastFall);
      hm.holding = false;
      hm.buffer = 0;
    }
  }
  function releaseDuck() { input.duckHeld = false; }

  function releaseDeck() {
    [el.btnJump, el.btnDuck].forEach(function (b) { if (b) b.classList.remove('is-down'); });
  }

  var JUMP_KEYS = { ' ': 1, Spacebar: 1, ArrowUp: 1, Up: 1, w: 1, W: 1 };
  var DUCK_KEYS = { ArrowDown: 1, Down: 1, s: 1, S: 1 };
  var PAUSE_KEYS = { p: 1, P: 1, Escape: 1, Esc: 1 };
  function typingTarget(n) {
    return !!(n && (n.tagName === 'INPUT' || n.tagName === 'TEXTAREA' || n.tagName === 'SELECT' || n.isContentEditable));
  }
  function modalOpen() { return !!(HG.ui && HG.ui.isModalOpen && HG.ui.isModalOpen()); }

  function onKeyDown(e) {
    if (modalOpen() || typingTarget(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
    var k = e.key;
    var active = G.state === 'play' || G.state === 'countdown';
    if (active) {
      if (JUMP_KEYS[k]) { e.preventDefault(); if (!e.repeat) pressJump(); return; }
      if (DUCK_KEYS[k]) { e.preventDefault(); if (!e.repeat) pressDuck(false); return; }
      if (PAUSE_KEYS[k]) { e.preventDefault(); pause('key'); }
      return;
    }
    if (G.state === 'paused' && PAUSE_KEYS[k]) { e.preventDefault(); resume(); return; }
    if (G.state === 'caught' && (JUMP_KEYS[k] || k === 'Enter')) { e.preventDefault(); pressJump(); return; }
    if (G.state === 'title' && e.target === canvas && (k === 'Enter' || k === ' ')) { e.preventDefault(); startRun(); }
  }
  function onKeyUp(e) {
    var k = e.key;
    if (JUMP_KEYS[k]) {
      releaseJump();
      if (G.state === 'play' || G.state === 'countdown') e.preventDefault();
    } else if (DUCK_KEYS[k]) {
      releaseDuck();
    }
  }

  function wireCanvasPointer() {
    canvas.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button > 0) return;
      focusEl(canvas);
      if (G.state === 'play' || G.state === 'countdown') {
        e.preventDefault();
        try { canvas.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
        ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, swiped: false };
        pressJump();
      } else if (G.state === 'caught') {
        pressJump();
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!ptr || ptr.id !== e.pointerId || ptr.swiped) return;
      var dy = e.clientY - ptr.y, dx = Math.abs(e.clientX - ptr.x);
      if (dy > 26 && dy > dx) {               // swipe down → duck / slide
        ptr.swiped = true;
        releaseJump();
        var hm = G.ham;
        if (!hm.ground && hm.jumpT < 0.12 && hm.y < 40) { hm.y = 0; hm.vy = 0; hm.ground = true; hm.holding = false; }
        pressDuck(true);
        if (G.state === 'play' && G.ham.ground) sfx('whoosh');
      }
    });
    function end(e) {
      if (ptr && ptr.id === e.pointerId) { ptr = null; releaseJump(); }
    }
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('lostpointercapture', end);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  function holdButton(btn, down, up) {
    if (!btn) return;
    btn.setAttribute('tabindex', '-1');      // keyboard players use the real keys
    btn.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      try { btn.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
      btn.classList.add('is-down');
      down();
    });
    function lift() { if (btn.classList.contains('is-down')) { btn.classList.remove('is-down'); up(); } }
    btn.addEventListener('pointerup', lift);
    btn.addEventListener('pointercancel', lift);
    btn.addEventListener('lostpointercapture', lift);
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  /* ═══════════ 8. Spawning ═══════════ */
  function stageId(abs) { return STAGES[((abs % STAGES.length) + STAGES.length) % STAGES.length]; }
  function stageAt(wx) { return stageId(Math.floor(wx / PX_PER_M / STAGE_M)); }
  function sxOf(wx) { return wx - G.cam + HAM_X; }

  function addObs(type, x) {
    var def = OBS[type];
    var o = {
      type: type, def: def, x: x, hit: false, wob: 0, fly: null, hinted: false,
      w: def.overhead ? def.w : Math.round(def.h * def.aspect), h: def.overhead ? 0 : def.h,
      seed: Math.random()
    };
    G.obs.push(o);
    return o;
  }
  function addItem(kind, x, y, pow) {
    var it = { kind: kind, x: x, y: y, pow: pow || null, ph: Math.random() * 6.283 };
    G.items.push(it);
    return it;
  }
  function smallPool(st) {
    var p = POOLS[st].filter(function (k) { return SMALL[k]; });
    return p.length ? p : ['box'];
  }

  function spawnAhead() {
    var guard = 0;
    while (G.nextX < G.cam + (W - HAM_X) + 260 && guard++ < 8) spawnChunk();
  }

  function spawnChunk() {
    var x = G.nextX;
    var v = Math.max(PHYS.v0, G.baseSpeed);
    var m = x / PX_PER_M, d = clamp(m / 1400, 0, 1);
    var st = stageAt(x);
    var len, calm = false, kind;
    if (G.firstObs) {
      G.firstObs = false;
      len = addObs('box', x).w;
    } else if (x >= G.powNextX) {
      len = chunkPow(x); calm = true;
      G.powNextX = x + v * rand(15, 22);
    } else if (x >= G.snackNextX) {
      len = chunkSnack(x); calm = true;
      G.snackNextX = x + v * rand(8, 12);
    } else {
      kind = weighted([
        ['obs', 5], ['arc', 3.2], ['double', m > 220 ? 0.8 + 2.4 * d : 0], ['overhead', m > 60 ? 1.7 : 0],
        ['stars', 1.8], ['notes', 1.2], ['heart', G.gap < 40 ? 2.4 : (G.gap < 70 ? 0.9 : 0.25)]
      ]);
      switch (kind) {
        case 'arc': len = chunkArc(x, st, v); break;
        case 'double': len = chunkDouble(x, st, v); break;
        case 'overhead': len = chunkOverhead(x, st); break;
        case 'stars': len = chunkStars(x); calm = true; break;
        case 'notes': len = chunkNotes(x); calm = true; break;
        case 'heart': len = chunkHeart(x); calm = true; break;
        default: len = addObs(pick(POOLS[st]), x).w;
      }
    }
    var space = calm ? v * 0.45 + 60
                     : v * lerp(0.95, 0.6, d) + 70 + Math.random() * v * lerp(0.55, 0.35, d);
    G.nextX = x + len + space;
  }

  function chunkArc(x, st, v) {
    var o = addObs(pick(POOLS[st]), x);
    var cx = x + o.w / 2, half = v * 0.11;
    for (var i = -2; i <= 2; i++) addItem('star', cx + i * half, o.h + 14 + 58 * (1 - (i * i) / 4));
    return o.w;
  }
  function chunkDouble(x, st, v) {
    var pool = smallPool(st);
    var a = addObs(pick(pool), x);
    var gapPx = v * 0.8 + 30;
    var b = addObs(pick(pool), x + a.w + gapPx);
    addItem('star', x + a.w + gapPx / 2, 26);
    return a.w + gapPx + b.w;
  }
  function chunkOverhead(x, st) {
    var o = addObs(st === 'festival' ? 'lanterns' : 'bunting', x);
    for (var i = 0; i < 3; i++) addItem('star', x + 30 + i * 58, 28);
    return o.w;
  }
  function chunkStars(x) {
    var n = 5 + ((Math.random() * 2) | 0), wave = Math.random() < 0.5;
    for (var i = 0; i < n; i++) addItem('star', x + i * 52, wave ? 28 + 64 * Math.sin((i / (n - 1)) * Math.PI) : 26);
    return n * 52;
  }
  function chunkNotes(x) {
    for (var i = 0; i < 3; i++) addItem('note', x + i * 64, 48 + i * 40);
    return 3 * 64;
  }
  function chunkHeart(x) { addItem('heart', x + 20, rand(30, 95)); return 60; }
  function chunkSnack(x) {
    addItem('snack', x + 20, Math.random() < 0.6 ? 28 : 88);
    if (Math.random() < 0.5) { addItem('star', x - 36, 26); addItem('star', x + 76, 26); }
    return 80;
  }
  function chunkPow(x) {
    var kind = weighted([
      ['speed', 1], ['jump', G.pow.jump > 0 ? 0.3 : 1], ['shield', G.pow.shield ? 0.2 : 1.1], ['snack', G.gap < 50 ? 2.2 : 0.8]
    ]);
    addItem('pow', x + 30, kind === 'snack' && G.gap < 30 ? 44 : 104, kind);
    addItem('star', x - 30, 26);
    addItem('star', x + 90, 26);
    return 100;
  }

  /* ═══════════ 9. Update ═══════════ */
  var HB = { x0: 0, x1: 0, y0: 0, y1: 0 }, OB = { x0: 0, x1: 0, y0: 0, y1: 0 };

  function haminBox() {
    var hm = G.ham, duck = isDuck();
    var hw = duck ? 28 : 20;
    var top = duck ? 64 : (hm.ground ? 132 : 124);
    var bot = duck || hm.ground ? 0 : 8;
    HB.x0 = G.cam - hw; HB.x1 = G.cam + hw + 4;
    HB.y0 = hm.y + bot; HB.y1 = hm.y + top;
    return HB;
  }
  function obsBox(o) {
    var d = o.def;
    if (d.overhead) { OB.x0 = o.x + 6; OB.x1 = o.x + o.w - 6; OB.y0 = d.bottom; OB.y1 = 99999; }
    else {
      OB.x0 = o.x + o.w * d.hb[0]; OB.x1 = o.x + o.w * d.hb[1];
      OB.y0 = o.h * d.hb[2]; OB.y1 = o.h * d.hb[3] - (d.sink || 0) * 0.5;
    }
    return OB;
  }
  function overlap(a, b) { return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0; }

  function update(dt) {
    switch (G.state) {
      case 'title': updateIdle(dt); break;
      case 'countdown': updateCountdown(dt); updateIdle(dt); break;
      case 'play': updatePlay(dt); break;
      case 'caught': updateCaught(dt); break;
      case 'result': updateResultIdle(dt); break;
    }
    updateParticles(dt);
  }

  function updateIdle(dt) {
    G.ham.phase += dt * 1.2;
    G.dog.phase += dt * 6;
    var tx = G.state === 'countdown' ? HAM_X - DOG_NEAR - G.gap * GAP_PX : HAM_X - 190;
    G.dog.x += (tx - G.dog.x) * Math.min(1, dt * 3);
    if (G.state === 'title' && !reduced) {
      G.heartT -= dt;
      if (G.heartT <= 0) { G.heartT = rand(0.9, 1.6); part('heart', G.dog.x + 20, GY - 96, rand(-10, 10), -40, 1.4, 16, C.pinkDeep, '♥'); }
    }
  }

  function updatePlay(dt) {
    G.t += dt;
    G.baseSpeed = Math.min(PHYS.vmax, PHYS.v0 + PHYS.accel * G.t);
    if (G.speedMul < 1) G.speedMul = Math.min(1, G.speedMul + dt * 0.55);
    if (G.pow.speed > 0) G.pow.speed = Math.max(0, G.pow.speed - dt);
    if (G.pow.jump > 0) G.pow.jump = Math.max(0, G.pow.jump - dt);
    G.speed = G.baseSpeed * G.speedMul * (G.pow.speed > 0 ? 1.45 : 1);
    G.cam += G.speed * dt;

    updateHamin(dt);
    updateGap(dt);
    if (G.state !== 'play') return;
    updateDog(dt);
    spawnAhead();
    updateEntities(dt);
    if (G.state !== 'play') return;
    updateStage(dt);
    updateMilestones();
    updateLines(dt);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt);
  }

  function updateHamin(dt) {
    var hm = G.ham;
    if (hm.buffer > 0) hm.buffer -= dt;
    if (hm.ground) hm.coyote = PHYS.coyote; else hm.coyote -= dt;
    if (hm.stumble > 0) hm.stumble = Math.max(0, hm.stumble - dt);
    if (hm.inv > 0) hm.inv = Math.max(0, hm.inv - dt);
    if (hm.duckT > 0) hm.duckT = Math.max(0, hm.duckT - dt);

    // start a jump (buffered + coyote time)
    if (hm.buffer > 0 && hm.coyote > 0) {
      var sup = G.pow.jump > 0;
      hm.buffer = 0; hm.coyote = 0; hm.ground = false;
      hm.vy = PHYS.jumpV * (sup ? PHYS.superMul : 1);
      hm.hold = 0; hm.holding = true; hm.duckT = 0; hm.jumpT = 0;
      sfx('jump', { rate: sup ? 1.18 : 1 });
      if (!reduced) for (var i = 0; i < 3; i++) part('dust', HAM_X - 10 + i * 8, GY - 2, -G.speed * 0.3 - rand(10, 50), -rand(10, 40), 0.4, 6, C.white);
      if (sup && !reduced) part('spark', HAM_X, GY - 10, 0, -60, 0.5, 16, C.gold, '✦');
    }

    if (!hm.ground) {
      hm.jumpT += dt;
      var g = PHYS.gFall;
      if (hm.holding && hm.vy > 0) {
        hm.hold += dt;
        var maxHold = PHYS.holdMax * (G.pow.jump > 0 ? 1.2 : 1);
        if ((input.jumpHeld || hm.hold < PHYS.holdMin) && hm.hold < maxHold) g = PHYS.gHold;
        else hm.holding = false;
      }
      hm.vy -= g * dt;
      hm.y += hm.vy * dt;
      if (hm.y <= 0) {
        hm.y = 0; hm.vy = 0; hm.ground = true; hm.holding = false;
        if (!reduced) for (var j = 0; j < 4; j++) part('dust', HAM_X - 14 + j * 9, GY - 2, rand(-80, 40) - G.speed * 0.25, -rand(10, 50), 0.45, 7, C.white);
      }
    }

    // running animation + dust
    var duck = isDuck();
    if (duck && !hm.wasDuck) { sfx('whoosh', { rate: 1.3 }); }
    hm.wasDuck = duck;
    if (hm.ground) {
      hm.phase += dt * Math.min(17, 9 * G.speed / PHYS.v0) * (hm.stumble > 0 ? 0.6 : 1);
      hm.dustT -= dt;
      if (hm.dustT <= 0 && !reduced) {
        hm.dustT = duck ? 0.05 : 0.12;
        part('dust', HAM_X - (duck ? 24 : 16), GY - 2, -G.speed * 0.35 - 30, -rand(8, 30), duck ? 0.35 : 0.45, duck ? 8 : 6, C.white);
      }
    }
  }

  function updateGap(dt) {
    var d = clamp(G.t / 90, 0, 1), rate;
    if (G.pow.sniff > 0) { G.pow.sniff = Math.max(0, G.pow.sniff - dt); rate = GAPC.sniffRate; }
    else if (G.pow.speed > 0) rate = GAPC.burstRate;
    else rate = -lerp(GAPC.drain0, GAPC.drain1, d);
    if (G.ham.stumble > 0) rate -= GAPC.stumble;
    G.gap = clamp(G.gap + rate * dt, 0, 100);
    if (G.gap < GAPC.warn && G.closeArmed) {
      G.closeArmed = false;
      alertPop('run.alert.close', 'warn');
      sfx('bark');
      G.dog.barkT = rand(2.5, 4);
      say('run.say.close', null, true);
    } else if (G.gap > GAPC.rearm) {
      G.closeArmed = true;
    }
    if (G.gap <= 0) caught();
  }

  function dogTarget() { return HAM_X - DOG_NEAR - G.gap * GAP_PX; }

  function updateDog(dt) {
    var d = G.dog;
    var sniffing = G.pow.sniff > 0;
    if (sniffing) {
      d.x = Math.max(-30, d.x - G.speed * dt);        // he stops… the world keeps going
    } else {
      var dx = dogTarget() - d.x, maxStep = 330 * dt;
      d.x += clamp(dx * Math.min(1, 5 * dt), -maxStep, maxStep);
    }
    if (d.y <= 0 && !sniffing) {                      // happy hops over everything
      for (var i = 0; i < G.obs.length; i++) {
        var o = G.obs[i];
        if (o.def.overhead || o.fly) continue;
        var sx = sxOf(o.x);
        if (sx + o.w > d.x - 50 && sx < d.x + 56 + G.speed * 0.06) { d.vy = 720; d.y = 0.01; break; }
      }
    }
    if (d.y > 0) {
      d.vy -= 2600 * dt;
      d.y += d.vy * dt;
      if (d.y <= 0) { d.y = 0; d.vy = 0; }
    }
    d.phase += dt * Math.min(17, 10 * G.speed / PHYS.v0);
    d.barkT -= dt;
    if (G.gap < GAPC.warn && d.barkT <= 0) {
      sfx('bark', { rate: rand(1, 1.2) });
      d.barkT = rand(2.6, 4.2);
      part('heart', d.x + 30, GY - d.y - 100, rand(-10, 20), -50, 1, 16, C.pinkDeep, '♥');
    }
    if (sniffing && !reduced && Math.random() < dt * 3) {
      part('heart', Math.max(20, d.x + 40), GY - 90, rand(-5, 15), -40, 0.9, 14, C.pinkDeep, '♪');
    }
  }

  function updateEntities(dt) {
    var hb = haminBox();
    var i, o, sx;
    for (i = G.obs.length - 1; i >= 0; i--) {
      o = G.obs[i];
      sx = sxOf(o.x);
      if (o.wob > 0) o.wob = Math.max(0, o.wob - dt * 1.4);
      if (o.fly) {
        var f = o.fly;
        f.x += f.vx * dt; f.y += f.vy * dt; f.vy -= 1900 * dt; f.r += f.vr * dt;
        if (f.y < -300) { G.obs.splice(i, 1); continue; }
      }
      if (sx + o.w < -240) { G.obs.splice(i, 1); continue; }
      if (o.hit || o.fly) continue;
      if (!o.hinted && sx < HAM_X + 360) {
        o.hinted = true;
        if (o.def.overhead && G.hintDuck) { G.hintDuck = false; alertPop('run.alert.duckHint', 'blue'); }
        else if (!o.def.overhead && G.hintJump) { G.hintJump = false; alertPop('run.alert.jumpHint', 'blue'); }
      }
      if (overlap(hb, obsBox(o))) {
        onHit(o);
        if (G.state !== 'play') return;
      }
    }
    for (i = G.items.length - 1; i >= 0; i--) {
      var it = G.items[i];
      sx = sxOf(it.x);
      if (sx < -80) { G.items.splice(i, 1); continue; }
      if (sx > W + 80) continue;
      var r = (it.kind === 'pow' ? 28 : ITEMS[it.kind].size * 0.42) + 6;
      var cx = it.x, cy = it.y;
      var nx = clamp(cx, hb.x0, hb.x1), ny = clamp(cy, hb.y0, hb.y1);
      if ((cx - nx) * (cx - nx) + (cy - ny) * (cy - ny) < r * r) {
        G.items.splice(i, 1);
        collect(it, sx, GY - it.y);
      }
    }
  }

  function knock(o) {
    o.hit = true;
    o.fly = { x: 0, y: 0, vx: 280 + Math.random() * 120, vy: 560 + Math.random() * 160, r: 0, vr: (Math.random() < 0.5 ? -1 : 1) * 8 };
  }

  function onHit(o) {
    var hm = G.ham;
    var sx = sxOf(o.x) + o.w / 2;
    if (hm.inv > 0) return;
    if (G.pow.speed > 0) {                              // dash straight through
      knock(o);
      sfx('pop', { rate: 1.3 });
      floatText('★', sx, GY - o.h - 10, C.gold, 26);
      sparkle(sx, GY - o.h / 2, 4);
      return;
    }
    if (G.pow.shield) {                                 // the shield takes the bump
      G.pow.shield = false;
      knock(o);
      hm.inv = 0.8;
      sfx('sparkle');
      alertPop('run.alert.shieldSave', 'gold');
      sparkle(HAM_X, GY - hm.y - 70, 8);
      return;
    }
    o.hit = true;
    o.wob = 1;
    G.gap = Math.max(0, G.gap - GAPC.hit);
    hm.stumble = 0.8;
    hm.inv = 1.2;
    G.speedMul = 0.55;
    G.combo = 0; G.mult = 1;
    G.hits++;
    sfx('miss');
    if (o.type === 'puddle') {
      for (var i = 0; i < 8; i++) part('drop', sx + rand(-20, 20), GY - 4, rand(-160, 160), -rand(180, 380), 0.7, rand(3, 6), C.water);
    } else {
      sparkle(HAM_X + 16, GY - hm.y - 150, 3);
    }
    alertPop('run.alert.oops', 'warn');
    if (!reduced) G.shake = 0.25;
    if (G.gap <= 0) caught();
  }

  function collect(it, sx, sy) {
    switch (it.kind) {
      case 'star': {
        G.combo++;
        var v = G.mult;
        G.stars += v;
        sfx('coin', { rate: 1 + Math.min(0.4, G.combo * 0.015) });
        floatText('+' + v + '★', sx, sy - 18, C.goldDeep, 20);
        sparkle(sx, sy, 4, C.gold);
        break;
      }
      case 'heart': {
        G.combo++;
        var was = G.gap;
        G.gap = Math.min(100, G.gap + GAPC.heart);
        sfx('sparkle');
        for (var i = 0; i < (reduced ? 2 : 5); i++) part('heart', sx + rand(-14, 14), sy, rand(-40, 40), -rand(60, 120), 0.9, rand(14, 20), C.pinkDeep, '♥');
        if (was < 50) alertPop('run.alert.safe', 'good');
        else floatText('♡', sx, sy - 20, C.pinkDeep, 24);
        break;
      }
      case 'snack':
        G.combo++;
        G.snacks++;
        G.gap = Math.min(100, G.gap + GAPC.snack);
        G.pow.sniff = Math.max(G.pow.sniff, GAPC.sniffT);
        sfx('pop');
        floatText('+1 🍪', sx, sy - 18, C.orangeDark, 18);
        if (G.snacks % 3 === 1) alertPop('run.alert.sniff', 'love');
        break;
      case 'note':
        G.combo += 2;
        G.notes++;
        sfx('score', { rate: 1 + (G.notes % 5) * 0.08 });
        floatText('♪', sx, sy - 16, C.lavenderDark, 26);
        sparkle(sx, sy, 3, C.lavenderDeep);
        break;
      case 'pow':
        applyPow(it.pow, sx, sy);
        break;
    }
    updateMult();
  }

  function updateMult() {
    G.maxCombo = Math.max(G.maxCombo, G.combo);
    var m = 1 + Math.min(4, Math.floor(G.combo / 6));
    if (m > G.mult) {
      floatText(t('shell.combo') + ' ×' + m, HAM_X + 10, GY - G.ham.y - 200, C.lavenderDark, 22);
      sfx('good');
    }
    G.mult = m;
  }

  function applyPow(kind, sx, sy) {
    G.powerups++;
    G.combo++;
    sfx('powerup');
    sparkle(sx, sy, 8);
    switch (kind) {
      case 'speed':
        G.pow.speed = POW_T.speed;
        alertPop('run.alert.speed', 'gold');
        sfx('whoosh');
        break;
      case 'jump':
        G.pow.jump = POW_T.jump;
        alertPop('run.alert.superJump', 'blue');
        break;
      case 'shield':
        G.pow.shield = true;
        alertPop('run.alert.shield', 'gold');
        break;
      default:            // snack boost
        G.snacks++;
        G.pow.sniff = Math.max(G.pow.sniff, POW_T.snack);
        G.gap = Math.min(100, G.gap + 6);
        alertPop('run.alert.snack', 'love');
        break;
    }
  }

  function updateStage(dt) {
    var abs = Math.floor(G.cam / PX_PER_M / STAGE_M);
    if (abs > G.stageAbs) {
      G.prevStageAbs = G.stageAbs;
      G.stageAbs = abs;
      G.stageFade = 0;
      var id = stageId(abs);
      G.reached[id] = true;
      showBanner(abs + 1, id);
      alertPop('run.alert.speed', 'gold');
      sfx('success');
      say('run.say.stage', { n: abs + 1, name: t('run.stage.' + id) }, true);
      load('bg-' + stageId(abs + 1), false);
    }
    if (G.stageFade < 1) G.stageFade = Math.min(1, G.stageFade + dt / 1.4);
  }

  function updateMilestones() {
    var m = Math.floor(G.cam / PX_PER_M);
    if (!G.recordShown && G.prevBest > 0 && m > G.prevBest) {
      G.recordShown = true;
      alertPop('run.alert.record', 'gold');
      sfx('success');
      sparkle(HAM_X, GY - 100, 10);
      say('run.say.record', { d: fmtM(m) }, true);
    }
    G.lastM = m;
  }

  function updateCaught(dt) {
    G.caughtT += dt;
    G.speed = Math.max(0, G.speed - G.caughtSpeed * dt * 2.4);
    G.cam += G.speed * dt;
    var hm = G.ham;
    if (!hm.ground) {
      hm.vy -= PHYS.gFall * dt; hm.y += hm.vy * dt;
      if (hm.y <= 0) { hm.y = 0; hm.vy = 0; hm.ground = true; }
    }
    var d = G.dog, tx = HAM_X - 64;
    if (d.x < tx) d.x = Math.min(tx, d.x + 460 * dt);
    else d.x += (tx - d.x) * Math.min(1, dt * 4);
    if (d.y > 0) { d.vy -= 2600 * dt; d.y += d.vy * dt; if (d.y <= 0) { d.y = 0; d.vy = 0; } }
    d.phase += dt * 10;
    if (!G.sat && G.caughtT > 0.55 && d.y <= 0) {
      G.sat = true;
      sfx('sparkle');
      for (var i = 0; i < (reduced ? 3 : 8); i++) part('heart', d.x + rand(-20, 30), GY - 80, rand(-60, 60), -rand(60, 140), 1.3, rand(14, 22), C.pinkDeep, '♥');
    }
    heartsTrickle(dt);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt);
    if (G.caughtT > 2.6) showResult();
  }

  function heartsTrickle(dt) {
    if (!G.sat) return;
    G.heartT -= dt;
    if (G.heartT <= 0) {
      G.heartT = reduced ? 0.9 : 0.35;
      part('heart', G.dog.x + rand(-10, 30), GY - 90, rand(-20, 20), -rand(50, 90), 1.4, rand(14, 20), C.pinkDeep, '♥');
    }
  }

  function updateResultIdle(dt) {
    G.resultT += dt;
    G.dog.phase += dt * 6;
    heartsTrickle(dt);
  }

  /* ═══════════ 10. Particles, floating texts, speed lines ═══════════ */
  function part(kind, x, y, vx, vy, life, size, color, ch) {
    if (G.parts.length >= 160) G.parts.shift();
    G.parts.push({ k: kind, x: x, y: y, vx: vx, vy: vy, life: life, max: life, s: size, c: color, ch: ch || '', r: Math.random() * 6 });
  }
  function sparkle(x, y, n, color) {
    n = reduced ? Math.min(2, n) : n;
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2 + Math.random() * 0.5, sp = reduced ? 0 : rand(60, 150);
      part('spark', x, y, Math.cos(a) * sp, Math.sin(a) * sp, reduced ? 0.5 : rand(0.45, 0.7), rand(12, 18),
        color || (i % 2 ? C.gold : C.pinkDeep), i % 3 === 0 ? '★' : '✦');
    }
  }
  function floatText(text, x, y, color, size) {
    if (G.floats.length > 10) G.floats.shift();
    G.floats.push({ text: text, x: x, y: y, life: 0.9, max: 0.9, c: color, s: size || 20 });
  }
  function updateParticles(dt) {
    var i, p;
    for (i = G.parts.length - 1; i >= 0; i--) {
      p = G.parts[i];
      p.life -= dt;
      if (p.life <= 0) { G.parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.k === 'drop') p.vy += 1100 * dt;
      else if (p.k === 'dust') p.s += dt * 22;
      else if (p.k === 'heart') p.vx *= (1 - dt * 1.5);
      else if (p.k === 'spark') { p.vx *= (1 - dt * 3); p.vy *= (1 - dt * 3); }
      p.r += dt * 4;
    }
    for (i = G.floats.length - 1; i >= 0; i--) {
      p = G.floats[i];
      p.life -= dt;
      if (p.life <= 0) { G.floats.splice(i, 1); continue; }
      p.y -= dt * (reduced ? 12 : 46);
    }
  }
  function initLines() {
    G.lines.length = 0;
    for (var i = 0; i < 9; i++) G.lines.push({ x: rand(0, W), y: rand(30, BAND_TOP - 30), len: rand(50, 140) });
  }
  function linesOn() { return !reduced && G.state === 'play' && (G.pow.speed > 0 || G.speed > 690); }
  function updateLines(dt) {
    if (!linesOn()) return;
    for (var i = 0; i < G.lines.length; i++) {
      var l = G.lines[i];
      l.x -= (G.speed * 1.9 + 260) * dt;
      if (l.x + l.len < 0) { l.x = W + rand(0, 240); l.y = rand(30, BAND_TOP - 30); l.len = rand(50, 140); }
    }
  }

  /* ═══════════ 11. Rendering ═══════════ */
  function rr(x, y, w, hh, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + hh, r);
    ctx.arcTo(x + w, y + hh, x, y + hh, r);
    ctx.arcTo(x, y + hh, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function oval(x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2); }
  function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); }
  function glyph(ch, x, y, size, fill, stroke, emoji) {
    ctx.font = 'bold ' + Math.round(size) + 'px ' + (emoji ? EMOJI_FONT : '') + C.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (stroke) { ctx.lineWidth = Math.max(2, size / 7); ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.strokeText(ch, x, y); }
    ctx.fillStyle = fill;
    ctx.fillText(ch, x, y);
  }
  function shadow(x, y, rx, a) {
    ctx.globalAlpha = a == null ? 1 : a;
    ctx.fillStyle = C.shadeDeep;
    oval(x, y, rx, rx * 0.2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  var renderRaf = 0;
  function queueRender() {
    if (rafId || renderRaf) return;
    renderRaf = win.requestAnimationFrame(function () { renderRaf = 0; if (!rafId) render(); });
  }

  function render() {
    if (!ctx) return;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.sky;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (G.shake > 0 && !reduced) {
      var a = (G.shake / 0.25) * 5;
      ctx.translate((Math.random() - 0.5) * a, (Math.random() - 0.5) * a * 0.6);
    }
    if (G.stageFade < 1) {
      drawStageBg(G.prevStageAbs, 1); drawGround(G.prevStageAbs, 1);
      drawStageBg(G.stageAbs, G.stageFade); drawGround(G.stageAbs, G.stageFade);
    } else {
      drawStageBg(G.stageAbs, 1); drawGround(G.stageAbs, 1);
    }
    drawSpeedLines();
    var i;
    for (i = 0; i < G.obs.length; i++) if (!G.obs[i].def.overhead) drawObstacle(G.obs[i]);
    for (i = 0; i < G.items.length; i++) drawItem(G.items[i]);
    drawDog();
    drawHamin();
    for (i = 0; i < G.obs.length; i++) if (G.obs[i].def.overhead) drawOverhead(G.obs[i]);
    drawParticles();
    drawFloats();
    ctx.restore();
    drawDanger();
  }

  /* Backgrounds: slow parallax, mirror-tiled (normal / flipped copies alternate so the seams match). */
  function drawStageBg(abs, alpha) {
    var id = stageId(abs);
    var img = I('bg-' + id) || fallbackBg(id);
    var par = reduced ? 0.06 : 0.2;
    var scroll = G.cam * par;
    var tw = BG_TILE, period = tw * 2;
    var off = ((scroll % period) + period) % period;
    var k = Math.floor(off / tw);
    var x = -(off - k * tw);
    ctx.globalAlpha = alpha;
    for (; x < W; x += tw, k++) {
      if (k % 2 === 0) ctx.drawImage(img, x, BG_TOP, tw + 1, BG_H);
      else {
        ctx.save();
        ctx.translate(x + tw, BG_TOP);
        ctx.scale(-1, 1);
        ctx.drawImage(img, -1, 0, tw + 1, BG_H);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  var fbBg = {};
  function fallbackBg(id) {
    if (fbBg[id]) return fbBg[id];
    var c = doc.createElement('canvas');
    c.width = BG_TILE; c.height = BG_H;
    var g = c.getContext('2d');
    var P = {
      school: ['powder', 'sky', 'cream', 'pink'], park: ['powder', 'mint', 'mintDeep', 'mint'],
      city: ['lavender', 'sky', 'powder', 'pink'], river: ['pink', 'cream', 'powder', 'gold'],
      festival: ['night', 'lavenderDark', 'pink', 'gold']
    }[id] || ['powder', 'sky', 'cream', 'pink'];
    var sky = g.createLinearGradient(0, 0, 0, BG_H);
    sky.addColorStop(0, C[P[0]]); sky.addColorStop(1, C[P[1]]);
    g.fillStyle = sky; g.fillRect(0, 0, c.width, c.height);
    var i, x;
    g.fillStyle = C.white; g.globalAlpha = id === 'festival' ? 0.8 : 0.7;
    for (i = 0; i < 7; i++) {                           // clouds (stars at night)
      x = (i + 0.5) * c.width / 7; var y = 40 + (i % 3) * 34;
      g.beginPath();
      if (id === 'festival') g.arc(x, y, 2.5, 0, 6.283);
      else { g.ellipse(x, y, 46, 16, 0, 0, 6.283); g.ellipse(x + 26, y - 10, 26, 16, 0, 0, 6.283); }
      g.fill();
    }
    g.globalAlpha = 1;
    var base = BG_H - 70;
    if (id === 'school') {
      g.fillStyle = C.cream; g.fillRect(0, 120, c.width, base - 120);
      g.fillStyle = C.powder;
      for (x = 20; x < c.width; x += 70) for (var r = 0; r < 3; r++) g.fillRect(x, 150 + r * 70, 44, 40);
      g.fillStyle = C.pink;
      for (x = 60; x < c.width; x += 240) { g.beginPath(); g.arc(x, base - 60, 48, 0, 6.283); g.fill(); }
    } else if (id === 'park') {
      g.fillStyle = C.mintDeep;
      g.beginPath(); g.moveTo(0, base);
      for (x = 0; x <= c.width; x += 40) g.lineTo(x, base - 80 - Math.sin(x / 160) * 40);
      g.lineTo(c.width, base); g.fill();
      g.fillStyle = C.mint;
      for (x = 80; x < c.width; x += 260) { g.beginPath(); g.arc(x, base - 110, 56, 0, 6.283); g.fill(); }
    } else if (id === 'city') {
      var cols = [C.lavenderDeep, C.pink, C.powder, C.lavender];
      for (x = 0, i = 0; x < c.width; x += 90, i++) {
        var bh = 160 + ((i * 53) % 150);
        g.fillStyle = cols[i % cols.length]; g.fillRect(x, base - bh, 80, bh);
        g.fillStyle = C.white; g.globalAlpha = 0.6;
        for (var wy = base - bh + 14; wy < base - 20; wy += 26) { g.fillRect(x + 12, wy, 18, 12); g.fillRect(x + 48, wy, 18, 12); }
        g.globalAlpha = 1;
      }
    } else if (id === 'river') {
      g.fillStyle = C.powder; g.fillRect(0, base - 110, c.width, 110);
      g.strokeStyle = C.white; g.lineWidth = 3; g.globalAlpha = 0.7;
      for (x = 20; x < c.width; x += 90) { g.beginPath(); g.moveTo(x, base - 60 + (x % 3) * 12); g.lineTo(x + 40, base - 60 + (x % 3) * 12); g.stroke(); }
      g.globalAlpha = 1;
      g.fillStyle = C.gold; g.fillRect(0, base - 130, c.width, 8);
    } else {
      g.strokeStyle = C.gold; g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, 90);
      for (x = 0; x <= c.width; x += 120) g.quadraticCurveTo(x + 60, 140, x + 120, 90);
      g.stroke();
      g.fillStyle = C.gold;
      for (x = 60; x < c.width; x += 120) { g.beginPath(); g.arc(x, 118, 12, 0, 6.283); g.fill(); }
      for (x = 0, i = 0; x < c.width; x += 150, i++) {
        g.fillStyle = C.white; g.fillRect(x + 10, base - 130, 130, 130);
        g.fillStyle = i % 2 ? C.pink : C.powder;
        for (var s = 0; s < 130; s += 26) g.fillRect(x + 10 + s, base - 150, 13, 34);
      }
    }
    fbBg[id] = c;
    return c;
  }

  function drawGround(abs, alpha) {
    var id = stageId(abs), g = GROUND[id];
    var base = C['g-' + id], line = C['g-' + id + '-line'], low = C['g-' + id + '-low'];
    var top = BAND_TOP, tile = g.tile, off = ((G.cam % tile) + tile) % tile, x;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = base;
    ctx.fillRect(0, top, W, LOW_TOP - top);
    ctx.strokeStyle = line;
    ctx.fillStyle = line;
    ctx.lineWidth = 2;
    if (g.style === 'tiles') {
      ctx.beginPath();
      for (x = -off; x < W + tile; x += tile) { ctx.moveTo(x, top + 8); ctx.lineTo(x - 16, LOW_TOP); }
      ctx.moveTo(0, (top + LOW_TOP) / 2 + 2); ctx.lineTo(W, (top + LOW_TOP) / 2 + 2);
      ctx.stroke();
    } else if (g.style === 'bricks') {
      var mid = (top + 8 + LOW_TOP) / 2;
      ctx.beginPath();
      ctx.moveTo(0, mid); ctx.lineTo(W, mid);
      for (x = -off; x < W + tile; x += tile) {
        ctx.moveTo(x, top + 8); ctx.lineTo(x - 6, mid);
        ctx.moveTo(x + tile / 2 - 6, mid); ctx.lineTo(x + tile / 2 - 12, LOW_TOP);
      }
      ctx.stroke();
    } else if (g.style === 'track') {
      ctx.globalAlpha = alpha * 0.9;
      ctx.fillRect(0, top + 22, W, 3);
      ctx.fillRect(0, top + 52, W, 3);
      var dash = 60;
      for (x = -(((G.cam * 1) % (dash * 2)) + dash * 2) % (dash * 2); x < W; x += dash * 2) ctx.fillRect(x, top + 37, dash, 2);
      ctx.globalAlpha = alpha;
    } else {                                            // pebbles
      for (x = -off; x < W + tile; x += tile) {
        var n = Math.floor((G.cam + x) / tile + 0.5);
        for (var p = 0; p < 3; p++) {
          var hsh = Math.abs(Math.sin(n * 12.9898 + p * 78.233) * 43758.5453) % 1;
          circle(x + hsh * tile, top + 16 + ((hsh * 7 + p) % 1) * 50, 2 + hsh * 3);
          ctx.fill();
        }
      }
    }
    // curb: bright edge + thin line
    ctx.fillStyle = C.white;
    ctx.globalAlpha = alpha * 0.85;
    ctx.fillRect(0, top, W, 6);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = line;
    ctx.fillRect(0, top + 6, W, 2);
    // near verge strip with tiny dotted pattern (moves a bit faster = depth)
    ctx.fillStyle = low;
    ctx.fillRect(0, LOW_TOP, W, H - LOW_TOP);
    ctx.fillStyle = C.shade;
    ctx.fillRect(0, LOW_TOP, W, 4);
    ctx.fillStyle = C.white;
    ctx.globalAlpha = alpha * 0.45;
    var step = 28, o2 = ((G.cam * 1.12) % step + step) % step;
    for (x = -o2; x < W + step; x += step) {
      circle(x, LOW_TOP + 18, 2.4); ctx.fill();
      circle(x + step / 2, LOW_TOP + 36, 2.4); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawSpeedLines() {
    if (!linesOn()) return;
    ctx.strokeStyle = C.white;
    ctx.lineCap = 'round';
    ctx.lineWidth = 3;
    ctx.globalAlpha = G.pow.speed > 0 ? 0.75 : 0.45;
    ctx.beginPath();
    for (var i = 0; i < G.lines.length; i++) {
      var l = G.lines[i];
      ctx.moveTo(l.x, l.y); ctx.lineTo(l.x + l.len, l.y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawObstacle(o) {
    var sx = sxOf(o.x);
    if (sx > W + 40 || sx + o.w < -80) return;
    var d = o.def, img = I('obs-' + o.type);
    var bottom = GY + 4 + (d.sink || 0);
    var cx = sx + o.w / 2;
    if (!o.fly) shadow(cx, bottom - (d.sink ? d.sink - 2 : 0), o.w * 0.42, 0.6);
    ctx.save();
    ctx.translate(cx, bottom);
    if (o.fly) { ctx.translate(o.fly.x, -o.fly.y); ctx.rotate(o.fly.r); ctx.translate(0, o.h / 2); }
    else if (o.wob > 0 && !reduced) ctx.rotate(Math.sin(o.wob * 22) * 0.14 * o.wob);
    var oy = o.fly ? -o.h / 2 : 0;
    if (img) ctx.drawImage(img, -o.w / 2, oy - o.h - (o.fly ? -o.h / 2 : 0), o.w, o.h);
    else drawObsFallback(o, oy + (o.fly ? o.h / 2 : 0));
    ctx.restore();
  }

  function drawObsFallback(o, oy) {
    var w = o.w, hh = o.h;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = C.ink;
    if (o.type === 'puddle') {
      ctx.fillStyle = C.water;
      oval(0, oy - hh * 0.3, w / 2, hh * 0.28);
      ctx.fill(); ctx.stroke();
      return;
    }
    if (o.type === 'cone') {
      ctx.fillStyle = C.orange;
      ctx.beginPath(); ctx.moveTo(-w / 2, oy); ctx.lineTo(w / 2, oy); ctx.lineTo(4, oy - hh); ctx.lineTo(-4, oy - hh); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.white; ctx.fillRect(-w * 0.28, oy - hh * 0.55, w * 0.56, hh * 0.12);
      return;
    }
    ctx.fillStyle = { box: C.cream, hydrant: C.cherry, flowerpot: C.pink, bag: C.powder, sign: C.cream, bench: C.mint }[o.type] || C.silver;
    rr(-w / 2, oy - hh, w, hh, 10);
    ctx.fill(); ctx.stroke();
    glyph(o.def.emoji, 0, oy - hh / 2, Math.min(w, hh) * 0.55, C.ink, null, true);
  }

  function drawOverhead(o) {
    var sx = sxOf(o.x);
    if (sx > W + 60 || sx + o.w < -60) return;
    var d = o.def, tip = GY - d.bottom, ropeY = tip - 34, lant = o.type === 'lanterns';
    var x0 = sx, x1 = sx + o.w, i, n = 7;
    // soft warning shadow on the ground
    shadow(sx + o.w / 2, GY + 2, o.w * 0.5, 0.35);
    ctx.strokeStyle = C.inkSoft;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();                                    // hanging strings + sagging rope
    ctx.moveTo(x0, -10); ctx.lineTo(x0, ropeY);
    ctx.quadraticCurveTo((x0 + x1) / 2, ropeY + 16, x1, ropeY);
    ctx.lineTo(x1, -10);
    ctx.stroke();
    var cols = lant ? [C.cherry, C.gold, C.pinkDeep] : [C.pinkDeep, C.mintDeep, C.gold, C.powderDeep, C.lavenderDeep];
    var sway = reduced ? 0 : Math.sin(G.clock * 3 + o.seed * 6) * 0.08;
    for (i = 0; i < n; i++) {
      var k = (i + 0.5) / n;
      var fx = x0 + k * o.w;
      var fy = ropeY + 16 * 2 * k * (1 - k) * 2 * 0.5 + 8 * 4 * k * (1 - k);
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(sway);
      ctx.fillStyle = cols[i % cols.length];
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      if (lant) {
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 6); ctx.stroke();
        oval(0, 20, 12, 15); ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.gold; ctx.globalAlpha = 0.5; oval(0, 20, 6, 9); ctx.fill(); ctx.globalAlpha = 1;
      } else {
        ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(11, 0); ctx.lineTo(0, tip - fy); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.white; ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.moveTo(-6, 2); ctx.lineTo(-1, 2); ctx.lineTo(-3, 10); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
  }

  function drawItem(it) {
    var sx = sxOf(it.x);
    if (sx < -60 || sx > W + 60) return;
    var bob = reduced ? 0 : Math.sin(G.clock * 4 + it.ph) * 4;
    var cy = GY - it.y + bob;
    if (it.kind === 'pow') {
      var pw = POWS[it.pow], img = I(pw.img), pulse = reduced ? 0 : Math.sin(G.clock * 5 + it.ph) * 3;
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = C.gold;
      circle(sx, cy, 36 + pulse); ctx.fill();
      ctx.globalAlpha = 1;
      if (img) { var s = 62; ctx.drawImage(img, sx - s / 2, cy - s / 2, s, s * img.naturalHeight / img.naturalWidth); }
      else {
        ctx.fillStyle = C.white; ctx.strokeStyle = C.powderDeep; ctx.lineWidth = 3;
        circle(sx, cy, 28); ctx.fill(); ctx.stroke();
        glyph(pw.glyph, sx, cy + 1, 28, C.orangeDark, null, true);
      }
      if (!reduced) glyph('✦', sx + Math.cos(G.clock * 3) * 36, cy + Math.sin(G.clock * 3) * 36, 14, C.white, C.goldDeep);
      return;
    }
    var def = ITEMS[it.kind], im = I(def.img), size = def.size;
    if (im) {
      var ar = im.naturalWidth / im.naturalHeight, w = ar >= 1 ? size : size * ar, hh = ar >= 1 ? size / ar : size;
      ctx.drawImage(im, sx - w / 2, cy - hh / 2, w, hh);
    } else {
      glyph(def.glyph, sx, cy, size, C[def.tone], C.white, it.kind === 'snack');
    }
  }

  function drawDog() {
    var d = G.dog, fy = GY - d.y, st = G.state, pose;
    if (st === 'title') pose = 'happy';
    else if (st === 'caught' || st === 'result') pose = G.sat ? 'happy' : 'run';
    else if (st === 'play' && G.pow.sniff > 0) pose = 'sniff';
    else if (d.y > 0) pose = 'hop';
    else if (st === 'countdown' || st === 'paused' && G.t === 0) pose = 'ready';
    else pose = 'run';
    if (d.x < -90) return;
    shadow(d.x, GY + 2, 40 * clamp(1 - d.y / 300, 0.4, 1), 0.7);
    var key = null;
    if (pose === 'run') key = DRUN.length ? DRUN[(d.phase | 0) % DRUN.length] : null;
    else if (pose === 'ready') key = DRUN.length ? DRUN[0] : null;
    else if (pose === 'hop') key = I('dog-hop') ? 'dog-hop' : (DRUN.length ? DRUN[1 % DRUN.length] : null);
    else key = I('dog-happy') ? 'dog-happy' : null;
    if (pose === 'sniff') drawSnackProp(d.x + 64, GY);
    ctx.save();
    ctx.translate(d.x, fy);
    if (!reduced) {
      if (pose === 'sniff') { ctx.translate(20, 0); ctx.rotate(0.07 + Math.sin(G.clock * 16) * 0.03); ctx.translate(-20, 0); }
      else if (pose === 'happy' && st !== 'title') ctx.translate(0, -Math.abs(Math.sin(G.clock * 7)) * 4);
      else if (pose === 'ready') ctx.translate(0, -Math.abs(Math.sin(G.clock * 9)) * 3);
    }
    if (key) ctx.drawImage(I(key), -DOG_W / 2, -DOG_H + 1, DOG_W, DOG_H);
    else drawDogFallback(pose, d.phase);
    ctx.restore();
  }

  function drawSnackProp(x, y) {
    var im = I('col-snack');
    if (im) ctx.drawImage(im, x - 15, y - 30, 28, 30);
    else glyph('🍪', x, y - 14, 24, C.orange, null, true);
  }

  function drawHamin() {
    var hm = G.ham, st = G.state, pose;
    if (st === 'caught' || st === 'result') pose = 'startled';
    else if (st === 'title' || st === 'countdown' || (st === 'paused' && G.t === 0)) pose = 'idle';
    else if (!hm.ground) pose = 'jump';
    else if (isDuck() || (st === 'paused' && (input.duckHeld || hm.duckT > 0))) pose = 'duck';
    else pose = 'run';
    var fy = GY - hm.y;
    shadow(HAM_X, GY + 2, 36 * clamp(1 - hm.y / 260, 0.35, 1), 0.8);
    var alpha = 1;
    if (st === 'play' && hm.inv > 0) alpha = reduced ? 0.55 : ((G.clock * 14) | 0) % 2 ? 0.3 : 1;
    if (st === 'play' && G.pow.speed > 0 && !reduced) {
      drawHaminPose(pose, HAM_X - 36, fy, 0.22);
      drawHaminPose(pose, HAM_X - 68, fy, 0.1);
    }
    drawHaminPose(pose, HAM_X, fy, alpha);
    if (G.pow.shield && (st === 'play' || st === 'countdown' || st === 'paused')) drawShield(HAM_X, fy - (pose === 'duck' ? 38 : 76), pose === 'duck' ? 56 : 88);
    if (pose === 'startled' && G.caughtT < 2.2 && st === 'caught') {
      var pop = reduced ? 1 : Math.min(1, G.caughtT * 5);
      glyph('!', HAM_X + 38, fy - HAM_H - 4, 34 * pop, C.cherry, C.white);
    }
    if (st === 'play' && hm.stumble > 0) {
      for (var i = 0; i < 3; i++) {
        var a = (reduced ? 0 : G.clock * 8) + i * 2.09;
        glyph('★', HAM_X + 8 + Math.cos(a) * 26, fy - 158 + Math.sin(a) * 7, 14, C.gold, C.white);
      }
    }
  }

  function drawShield(x, y, r) {
    var pulse = reduced ? 0 : Math.sin(G.clock * 6) * 3;
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = C.powder;
    circle(x, y, r + pulse); ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 3;
    circle(x, y, r + pulse); ctx.stroke();
    ctx.globalAlpha = 1;
    for (var i = 0; i < 3; i++) {
      var a = (reduced ? 0.6 : G.clock * 2) + i * 2.09;
      glyph('★', x + Math.cos(a) * (r + pulse), y + Math.sin(a) * (r + pulse), 13, C.gold, C.white);
    }
  }

  var FK = { k: null, squash: false, tilt: 0 };
  function haminFrame(pose) {
    FK.k = null; FK.squash = false; FK.tilt = 0;
    var any = HRUN.length ? HRUN : null;
    switch (pose) {
      case 'run': if (any) FK.k = any[(G.ham.phase | 0) % any.length]; break;
      case 'idle': if (any) FK.k = any[0]; break;
      case 'jump':
        if (I('hamin-jump')) FK.k = 'hamin-jump';
        else if (any) { FK.k = any[1 % any.length]; FK.tilt = -0.08; }
        break;
      case 'duck':
        if (I('hamin-duck')) FK.k = 'hamin-duck';
        else if (any) { FK.k = any[0]; FK.squash = true; }
        break;
      default:
        if (I('hamin-startled')) FK.k = 'hamin-startled';
        else if (any) FK.k = any[0];
    }
    return FK.k ? FK : null;
  }

  function drawHaminPose(pose, x, fy, alpha) {
    var fr = haminFrame(pose);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, fy);
    if (pose === 'idle' && !reduced) ctx.scale(1, 1 + Math.sin(G.clock * 2.4) * 0.012);
    if (fr) {
      if (fr.squash) ctx.scale(1.14, 0.56);
      if (fr.tilt) ctx.rotate(fr.tilt);
      ctx.drawImage(I(fr.k), -HAM_W / 2, -HAM_H, HAM_W, HAM_H);
    } else {
      drawHaminFallback(pose, G.ham.phase);
    }
    ctx.restore();
  }

  /* Code-drawn chibi Hamin (used while the runner sprites are missing). Origin = feet. */
  function drawHaminFallback(pose, ph) {
    var run = pose === 'run', duck = pose === 'duck', jump = pose === 'jump', st = pose === 'startled';
    var sw = run ? Math.sin(ph * Math.PI / 2) : 0;
    var bob = run ? -Math.abs(Math.cos(ph * Math.PI / 2)) * 5 : 0;
    var O = C.ink;
    if (duck) { ctx.scale(1.12, 0.62); ctx.rotate(-0.12); }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    function limb(ox, oy, ang, len, col, w) {
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(ang);
      ctx.strokeStyle = O; ctx.lineWidth = w + 5;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, len); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, len); ctx.stroke();
      ctx.restore();
    }
    function shoe(ox, oy, ang, len) {
      ctx.save();
      ctx.translate(ox, oy); ctx.rotate(ang); ctx.translate(0, len);
      ctx.rotate(-ang * 0.6);
      ctx.fillStyle = C.shoe; ctx.strokeStyle = O; ctx.lineWidth = 2.5;
      rr(-7, -4, 21, 10, 4); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    var hipY = -44 + bob;
    var la = jump ? 0.55 : st ? 0.18 : duck ? -1.1 : sw * 0.75;
    var lb = jump ? -0.4 : st ? -0.18 : duck ? -1.3 : -sw * 0.75;
    limb(-2, hipY, lb, 38, C.pants, 10); shoe(-2, hipY, lb, 38);
    // back arm
    var shY = -80 + bob;
    var aa = st ? 2.7 : jump ? -2.4 : duck ? 1.2 : -sw * 0.9;
    var ab = st ? -2.7 : jump ? 2.3 : duck ? 0.6 : sw * 0.9;
    limb(-6, shY, aa, 26, C.shirt, 8);
    // body (tee)
    ctx.fillStyle = C.shirt; ctx.strokeStyle = O; ctx.lineWidth = 3;
    rr(-17, -88 + bob, 34, 48, 11); ctx.fill(); ctx.stroke();
    glyph('♥', 5, -64 + bob, 13, C.pinkDeep);
    limb(2, hipY, la, 38, C.pants, 10); shoe(2, hipY, la, 38);
    limb(8, shY, ab, 26, C.shirt, 8);
    // hands
    ctx.fillStyle = C.skin; ctx.strokeStyle = O; ctx.lineWidth = 2;
    [[-6, aa], [8, ab]].forEach(function (a) {
      circle(a[0] - Math.sin(a[1]) * 28, shY + Math.cos(a[1]) * 28, 5.5); ctx.fill(); ctx.stroke();
    });
    // head
    var hx = 4, hy = -118 + bob, r = 31;
    ctx.fillStyle = C.skin; ctx.strokeStyle = O; ctx.lineWidth = 3;
    circle(hx, hy, r); ctx.fill(); ctx.stroke();
    circle(hx - 16, hy + 6, 7); ctx.fill(); ctx.stroke();       // ear (he faces right)
    // hair: cap + fringe
    ctx.fillStyle = C.hair;
    ctx.beginPath();
    ctx.moveTo(hx - r - 3, hy + 10);
    ctx.arc(hx, hy - 3, r + 4, Math.PI * 0.93, Math.PI * 2.03, false);
    ctx.lineTo(hx + r - 2, hy - 1);
    ctx.lineTo(hx + r - 9, hy - 11);
    ctx.lineTo(hx + r - 15, hy - 1);
    ctx.lineTo(hx + r - 23, hy - 13);
    ctx.lineTo(hx + r - 31, hy - 2);
    ctx.lineTo(hx + r - 39, hy - 12);
    ctx.lineTo(hx - 12, hy - 4);
    ctx.lineTo(hx - 24, hy + 2);
    ctx.lineTo(hx - r + 1, hy + 18);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 2; ctx.stroke();
    // face
    var ex1 = hx + 11, ex2 = hx + 25, ey = hy + 6;
    ctx.fillStyle = C.cheek; ctx.globalAlpha *= 0.75;
    oval(hx + 7, hy + 17, 5, 3); ctx.fill();
    oval(hx + 29, hy + 17, 5, 3); ctx.fill();
    ctx.globalAlpha /= 0.75;
    ctx.strokeStyle = O; ctx.fillStyle = O; ctx.lineWidth = 2.5;
    if (st) {
      ctx.fillStyle = C.white;
      circle(ex1, ey, 5.5); ctx.fill(); ctx.stroke();
      circle(ex2, ey, 5.5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = O; circle(ex1 + 1, ey, 2.4); ctx.fill(); circle(ex2 + 1, ey, 2.4); ctx.fill();
      oval(hx + 19, hy + 20, 3.5, 4.5); ctx.stroke();
    } else if (jump) {
      ctx.beginPath(); ctx.moveTo(ex1 - 4, ey + 1); ctx.lineTo(ex1, ey - 3); ctx.lineTo(ex1 + 4, ey + 1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ex2 - 4, ey + 1); ctx.lineTo(ex2, ey - 3); ctx.lineTo(ex2 + 4, ey + 1); ctx.stroke();
      ctx.beginPath(); ctx.arc(hx + 19, hy + 16, 5, 0.1, Math.PI - 0.1); ctx.stroke();
    } else {
      oval(ex1, ey, 3, 4.2); ctx.fill();
      oval(ex2, ey, 3, 4.2); ctx.fill();
      ctx.fillStyle = C.white; circle(ex1 + 1, ey - 1.5, 1.2); ctx.fill(); circle(ex2 + 1, ey - 1.5, 1.2); ctx.fill();
      ctx.beginPath(); ctx.arc(hx + 19, hy + 15, 4, 0.2, Math.PI - 0.2); ctx.stroke();
    }
  }

  /* Code-drawn fluffy puppy (fallback). Origin = paws, facing right. */
  function drawDogFallback(pose, ph) {
    var sit = pose === 'happy' || pose === 'sniff', hop = pose === 'hop';
    var sw = Math.sin(ph * Math.PI / 2);
    var wag = reduced ? 0.3 : Math.sin(G.clock * 18) * 0.5;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = C.furShade; ctx.lineWidth = 2.5;
    if (!sit) {
      ctx.fillStyle = C.fur;
      var legs = [[-26, -sw], [-14, sw], [16, sw], [28, -sw]];
      legs.forEach(function (l) {
        ctx.save(); ctx.translate(l[0], -18); ctx.rotate(hop ? (l[0] < 0 ? 0.7 : -0.7) : l[1] * 0.55);
        rr(-5, 0, 10, 19, 5); ctx.fill(); ctx.stroke(); ctx.restore();
      });
      circle(-42, -48 + wag * 6, 11); ctx.fill(); ctx.stroke();          // tail puff
      oval(0, -34, 40, 22); ctx.fill(); ctx.stroke();                    // body
      circle(34, -56, 23); ctx.fill(); ctx.stroke();                     // head
      ctx.fillStyle = C.furShade;
      ctx.save(); ctx.translate(22, -54); ctx.rotate(0.35 + wag * 0.1); oval(0, 6, 8, 14); ctx.fill(); ctx.restore();
      ctx.strokeStyle = C.collar; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(30, -54, 20, 1.9, 2.9); ctx.stroke();
      glyph('♥', 22, -35, 10, C.gold);
      ctx.fillStyle = C.ink;
      circle(42, -60, 3.2); ctx.fill();
      circle(56, -52, 3.8); ctx.fill();
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(50, -47, 4, 0.2, Math.PI - 0.4); ctx.stroke();
      ctx.fillStyle = C.cheek; circle(44, -48, 3.5); ctx.fill();
    } else {
      ctx.fillStyle = C.fur;
      circle(-24, -14 + wag * 5, 10); ctx.fill(); ctx.stroke();          // tail
      oval(0, -34, 27, 32); ctx.fill(); ctx.stroke();                    // sitting body
      rr(8, -26, 10, 26, 5); ctx.fill(); ctx.stroke();                   // front legs
      rr(-6, -26, 10, 26, 5); ctx.fill(); ctx.stroke();
      var hx = pose === 'sniff' ? 24 : 8, hy = pose === 'sniff' ? -40 : -74;
      circle(hx, hy, 24); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.furShade;
      oval(hx - 16, hy + 4, 8, 15); ctx.fill();
      oval(hx + 16, hy + 4, 8, 15); ctx.fill();
      ctx.strokeStyle = C.collar; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(hx, hy + 2, 21, 1.1, 2.1); ctx.stroke();
      glyph('♥', hx, hy + 24, 10, C.gold);
      ctx.strokeStyle = C.ink; ctx.fillStyle = C.ink; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(hx - 8, hy - 2, 4, Math.PI + 0.3, -0.3); ctx.stroke();
      ctx.beginPath(); ctx.arc(hx + 8, hy - 2, 4, Math.PI + 0.3, -0.3); ctx.stroke();
      circle(hx, hy + 6, 3.5); ctx.fill();
      ctx.fillStyle = C.cheek; oval(hx, hy + 14, 4, 5); ctx.fill();      // tongue
    }
  }

  function drawParticles() {
    for (var i = 0; i < G.parts.length; i++) {
      var p = G.parts[i], a = clamp(p.life / p.max, 0, 1);
      if (p.k === 'dust') {
        ctx.globalAlpha = a * 0.75;
        ctx.fillStyle = p.c;
        circle(p.x, p.y, p.s); ctx.fill();
        ctx.globalAlpha = a * 0.3;
        ctx.strokeStyle = C.silverDeep; ctx.lineWidth = 1.5; ctx.stroke();
      } else if (p.k === 'drop') {
        ctx.globalAlpha = a;
        ctx.fillStyle = p.c;
        circle(p.x, p.y, p.s); ctx.fill();
      } else {
        ctx.globalAlpha = Math.min(1, a * 1.4);
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.k === 'spark' && !reduced) ctx.rotate(p.r);
        glyph(p.ch, 0, 0, p.s, p.c, C.white);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawFloats() {
    for (var i = 0; i < G.floats.length; i++) {
      var f = G.floats[i];
      ctx.globalAlpha = clamp(f.life / 0.3, 0, 1);
      ctx.font = '900 ' + f.s + 'px ' + EMOJI_FONT + C.font;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeStyle = C.white;
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.c;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  /* Soft pink edge glow while the puppy is too close (static when motion is reduced). */
  function drawDanger() {
    if (G.state !== 'play' || G.gap >= GAPC.warn) return;
    var k = 1 - G.gap / GAPC.warn;
    var pulse = reduced ? 1 : 0.75 + Math.sin(G.clock * 7) * 0.25;
    var grd = ctx.createLinearGradient(0, 0, 220, 0);
    grd.addColorStop(0, C.pinkDeep);
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = 0.45 * k * pulse;
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 220, H);
    ctx.globalAlpha = 1;
  }

  /* ═══════════ 12. HUD, alerts, banner, power-up chips ═══════════ */
  var hudCache = {};
  function setText(node, key, val) {
    if (hudCache[key] === val || !node) return;
    hudCache[key] = val;
    node.textContent = val;
  }
  function bump(node) {
    if (!node || reduced) return;
    node.classList.remove('is-bump');
    void node.offsetWidth;
    node.classList.add('is-bump');
  }
  function updateHud(force) {
    if (force) hudCache = {};
    setText(el.dist, 'd', fmtM(Math.floor(G.cam / PX_PER_M)));
    setText(el.stars, 's', HG.ui.formatNum(G.stars));
    setText(el.snacks, 'k', HG.ui.formatNum(G.snacks));
    if (hudCache.c !== G.mult) {
      var up = hudCache.c != null && G.mult > hudCache.c;
      setText(el.combo, 'c', '×' + G.mult);
      el.comboPill.classList.toggle('is-hot', G.mult > 1);
      if (up) bump(el.comboPill);
    }
    var g = Math.round(G.gap);
    if (hudCache.g !== g) {
      hudCache.g = g;
      el.gap.style.setProperty('--rh-pos', (100 - g) + '%');
      el.gap.setAttribute('aria-valuenow', String(g));
      el.gap.setAttribute('aria-valuetext', t('run.hud.gapText', { n: g }));
      el.gap.classList.toggle('is-warn', g < GAPC.warn && G.state === 'play');
      el.gap.classList.toggle('is-mid', g >= GAPC.warn && g < 50);
    }
    if (G.state === 'play' || G.state === 'countdown' || G.state === 'paused') {
      chip('speed', G.pow.speed > 0, G.pow.speed / POW_T.speed * 100);
      chip('jump', G.pow.jump > 0, G.pow.jump / POW_T.jump * 100);
      chip('shield', G.pow.shield, null);
      chip('snack', G.pow.sniff > 0, G.pow.sniff / POW_T.snack * 100);
    }
  }

  var chips = {};
  var CHIP_NAME = { speed: 'run.pow.speed', jump: 'run.pow.jump', shield: 'run.pow.shield', snack: 'run.pow.sniff' };
  function chip(kind, on, pct) {
    var c = chips[kind];
    if (!on) { if (c && !c.el.hidden) c.el.hidden = true; return; }
    if (!c) {
      var bar = h('i', { class: 'rh-pow__fill' });
      var node = h('span', { class: 'rh-pow rh-pow--' + kind }, [
        HG.ui.img(ART + POWS[kind].img + '.webp', { alt: '', emoji: POWS[kind].glyph, className: 'rh-pow__icon', kind: 'game' }),
        h('span', { class: 'rh-pow__name', i18n: CHIP_NAME[kind] }),
        pct == null ? null : h('span', { class: 'rh-pow__bar' }, bar)
      ]);
      el.pows.appendChild(node);
      c = chips[kind] = { el: node, bar: bar, pct: -1 };
    }
    if (c.el.hidden) c.el.hidden = false;
    if (pct != null) {
      pct = Math.round(clamp(pct, 0, 100));
      if (Math.abs(pct - c.pct) >= 2) { c.pct = pct; c.bar.style.width = pct + '%'; }
    }
  }
  function hidePowChips() { for (var k in chips) if (Object.prototype.hasOwnProperty.call(chips, k)) chips[k].el.hidden = true; }

  function alertPop(key, tone, params) {
    if (!el.alerts) return;
    var box = h('div', { class: 'rh-alert rh-alert--' + (tone || 'pink') }, [
      h('span', { class: 'rh-alert__bar' }, h('span', { class: 'rh-alert__dots' }, '● ● ●')),
      h('span', { class: 'rh-alert__text' }, t(key, params))
    ]);
    el.alerts.appendChild(box);
    while (el.alerts.childElementCount > 2) el.alerts.removeChild(el.alerts.firstChild);
    later(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 1400);
  }

  function showBanner(no, id) {
    el.bannerNo.textContent = t('run.stage.label', { n: no });
    el.bannerName.textContent = t('run.stage.' + id);
    el.banner.hidden = false;
    el.banner.classList.remove('is-on');
    void el.banner.offsetWidth;
    el.banner.classList.add('is-on');
    later(function () { el.banner.hidden = true; }, 2300);
  }

  /* ═══════════ 13. Loop ═══════════ */
  var rafId = 0, lastTs = 0, acc = 0, lastRender = 0;

  function loopWanted() {
    if (doc.hidden) return false;
    var s = G.state;
    if (s === 'countdown' || s === 'play' || s === 'caught') return true;
    if (s === 'title') return !motionReduced();
    if (s === 'result') return !motionReduced() && G.resultT < 8;
    return false;
  }
  function startLoop() {
    if (rafId || !loopWanted()) return;
    lastTs = 0; acc = 0;
    rafId = win.requestAnimationFrame(frame);
  }
  function stopLoop() {
    if (rafId) win.cancelAnimationFrame(rafId);
    rafId = 0;
  }
  function frame(ts) {
    rafId = 0;
    reduced = motionReduced();
    var dt = lastTs ? (ts - lastTs) / 1000 : 1 / 60;
    lastTs = ts;
    if (!(dt > 0)) dt = 0;
    if (dt > 0.1) dt = 0.1;
    G.clock += dt;
    acc += dt;
    var n = 0;
    while (acc >= STEP && n < 30) { update(STEP); acc -= STEP; n++; }
    if (n >= 30) acc = 0;
    var lazy = G.state === 'title' || G.state === 'result';
    if (!lazy || ts - lastRender > 32) { render(); lastRender = ts; }
    updateHud(false);
    if (loopWanted()) rafId = win.requestAnimationFrame(frame);
    else render();
  }

  /* ═══════════ 14. Init ═══════════ */
  function init() {
    if (!HG.ui || !HG.ui.mountGameShell) return;
    cacheDom();
    shell = HG.ui.mountGameShell(doc.getElementById('game'), { game: GAME, titleKey: 'games.runHamin.title', helpKey: 'run.help' });
    canvas = el.canvas;
    try { ctx = canvas.getContext('2d', { alpha: false }); } catch (e) { ctx = canvas.getContext('2d'); }
    if (!ctx) return;
    reduced = motionReduced();
    readColors(el.stage);
    doc.title = t('run.docTitle');

    // start-screen art (lazy, falls back to emoji tiles)
    el.startDog.appendChild(HG.ui.img(ART + 'dog-happy.webp', { alt: '', emoji: '🐶', kind: 'game', className: 'rh-start__img' }));
    el.startHam.appendChild(HG.ui.img(ART + 'hamin-run-1.webp', { alt: '', emoji: '🏃', kind: 'game', className: 'rh-start__img' }));
    el.resultPup.appendChild(HG.ui.img(ART + 'dog-happy.webp', { alt: '', emoji: '🐶', kind: 'game', className: 'rh-result__pupimg' }));

    loadCore();
    later(loadAllBgs, 2500);

    // buttons
    el.startBtn.addEventListener('click', function () { sfx('click'); startRun(); });
    el.helpBtn.addEventListener('click', function () { if (shell) shell.openHelp(); });
    el.pauseBtn.addEventListener('click', function () {
      if (G.state === 'paused') resume(); else pause('button');
    });
    el.resumeBtn.addEventListener('click', function () { sfx('click'); resume(); });
    el.restartBtn.addEventListener('click', function () { startRun(); });
    el.quitBtn.addEventListener('click', function () { showTitle(true); });
    el.retryBtn.addEventListener('click', function () { sfx('click'); startRun(); });
    holdButton(el.btnJump, function () { pressJump(); }, releaseJump);
    holdButton(el.btnDuck, function () {
      pressDuck(false);
      if (G.state === 'play' && G.ham.ground) sfx('whoosh', { rate: 1.3 });
    }, releaseDuck);
    wireCanvasPointer();
    el.stage.addEventListener('contextmenu', function (e) { if (e.target !== el.startBtn) e.preventDefault(); });

    // keyboard
    doc.addEventListener('keydown', onKeyDown);
    doc.addEventListener('keyup', onKeyUp);

    // auto-pause: hidden tab, window blur, help / settings modals
    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) {
        if (G.state === 'play' || G.state === 'countdown') pause('hidden');
        stopLoop();
      } else {
        startLoop();
      }
    });
    win.addEventListener('blur', function () { if (G.state === 'play' || G.state === 'countdown') pause('blur'); });
    doc.addEventListener('hg:modal', function (e) { if (e.detail && e.detail.open) pause('modal'); });
    if (shell && shell.el) shell.el.addEventListener('hg:help', function (e) { if (e.detail && e.detail.open) pause('modal'); });

    // language / settings changes
    doc.addEventListener('hg:lang', function () {
      doc.title = t('run.docTitle');
      updateHud(true);
      updateBestLine();
      updateLoadLine();
      fillResultNumbers();
      queueRender();
    });
    doc.addEventListener('hg:save', function (e) {
      var p = e.detail && e.detail.path;
      if (!p || p === '*' || String(p).indexOf('settings') === 0) {
        var r = motionReduced();
        if (r !== reduced) { reduced = r; queueRender(); }
        startLoop();
      }
    });

    // sizing
    if (win.ResizeObserver) new win.ResizeObserver(function () { resize(); }).observe(el.frame);
    win.addEventListener('resize', resize);
    doc.addEventListener('fullscreenchange', function () { setTimeout(resize, 60); });
    resize();

    showTitle(false);
    updateLoadLine();

    if (/[?&]debug=1(?:&|$)/.test(win.location.search || '')) {
      HG.runHamin = {
        G: G, input: input, start: startRun, pause: pause, resume: resume,
        jump: pressJump, release: releaseJump, duck: pressDuck, unduck: releaseDuck,
        catchNow: function () { G.gap = 0; }, setGap: function (n) { G.gap = n; },
        // advance the simulation synchronously (tests in a background tab where rAF is frozen)
        step: function (sec, each) {
          var n = Math.round((sec || 1) / STEP);
          for (var i = 0; i < n; i++) { if (each) each(G); G.clock += STEP; update(STEP); }
          render(); updateHud(false);
          return G.state;
        }
      };
      if (win.console) console.info('[RUN, HAMIN!] debug: HG.runHamin');
    }
  }

  HG.onReady(init);
})(window.HG = window.HG || {}, window, document);

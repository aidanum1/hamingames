/* HAMIN GAMES — js/photo-booth.js
   HAMIN PHOTO BOOTH: a Korean sticker-photo (purikura / 4-cut) booth drawn on Canvas.
   Steps: 1 LOOK → 2 POSE → 3 BACKGROUND → 4 FRAME → 5 STICKERS → 6 DOODLE → 7 TEXT/DATE → 8 SAVE

   Model (resolution independent, so switching frames keeps every decoration):
     look / pose / background / frame  → BASE canvas at the frame's output size, re-rendered
                                          (async) only when one of those choices changes
     stickers  [{uid, sid, x, y, s, r}] x,y ∈ 0..1 of the output, s = size ÷ min(W,H), r = rad
     strokes   [{tool:'pen'|'glow'|'eraser', color, w, pts:[x0,y0,x1,y1…]}] → DOODLE canvas
     text      {str ≤16 chars, color, x, y, s, r} + date stamp 'off' | 'film' | 'cute'
   The visible canvas redraws on demand (one rAF per change) — nothing runs while idle.
   Export: compose at full size → canvas.toBlob → PNG link "hamin-photo-YYYYMMDD-HHMM.png".
   Rewards (only through HG.unlocks): finishGame('photo-booth', {score:0, stats:{inc:
     {'photo.created':1, 'photo.stickersPlaced':n}}, flags:['photo.exported']}) once per
   changed photo; save.photoBooth.lastPhoto (≤240px JPEG) + save.photoBooth.count for My Room. */
(function (HG, win, doc) {
  'use strict';

  /* ═══════════ 0. Small helpers ═══════════ */
  var h = null;                                   // HG.ui.el (set on ready)
  function t(k, p) { return HG.t ? HG.t(k, p) : String(k); }
  function sfx(n, o) { try { if (HG.audio) HG.audio.sfx(n, o); } catch (e) { /* never break for sound */ } }
  function rm() { return !!(HG.ui && HG.ui.reducedMotion && HG.ui.reducedMotion()); }
  function announce(s) { if (HG.ui && HG.ui.announce) HG.ui.announce(s); }
  function toast(s, o) { if (HG.ui && HG.ui.toast) HG.ui.toast(s, o); }
  function fmt(n) { return HG.ui && HG.ui.formatNum ? HG.ui.formatNum(n) : String(n); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function name(kind, id) { return HG.i18n ? HG.i18n.itemName(kind, id) : String(id); }
  function nowMs() { return win.performance && win.performance.now ? win.performance.now() : Date.now(); }
  function dpr() { return Math.min(2, Math.max(1, win.devicePixelRatio || 1)); }
  function copy(o) { var r = {}; for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) r[k] = o[k]; return r; }
  function uniq(a) { var s = {}, out = []; a.forEach(function (x) { if (x && !s[x]) { s[x] = 1; out.push(x); } }); return out; }
  function chars(str) { return Array.from ? Array.from(String(str)) : String(str).split(''); }
  function log(e) { if (win.console) console.error('[photo-booth]', e); }
  function isTouch() { return doc.documentElement.classList.contains('hg-touch'); }

  var TODAY = new Date();
  function dateStr() { return TODAY.getFullYear() + '.' + pad2(TODAY.getMonth() + 1) + '.' + pad2(TODAY.getDate()); }
  function fileName() {
    var d = new Date();
    return 'hamin-photo-' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '-' + pad2(d.getHours()) + pad2(d.getMinutes()) + '.png';
  }

  /* ═══════════ 1. Constants ═══════════ */
  var STEPS = ['look', 'pose', 'bg', 'frame', 'stickers', 'doodle', 'text', 'save'];
  var STEP_ICON = { look: '👕', pose: '🙆', bg: '🌈', frame: '🖼️', stickers: '💖', doodle: '✏️', text: '🔤', save: '🖨️' };
  var CROPS = ['full', 'upper', 'bust'];
  var EXPR_NEAR = { wink: 'smile', sheep: 'big', eating: 'smile', surprised: 'big', focused: 'neutral', pout: 'neutral', big: 'smile', smile: 'neutral' };
  var PENS = [
    { id: 'pink', tok: 'cherry' }, { id: 'blue', tok: 'blueDeep' }, { id: 'mint', tok: 'mintDark' },
    { id: 'orange', tok: 'orange' }, { id: 'purple', tok: 'lavenderDark' }, { id: 'ink', tok: 'ink' }
  ];
  var TEXT_COLORS = PENS.concat([{ id: 'white', tok: 'white' }]);
  var PEN_SIZES = [0.008, 0.016, 0.03];
  var MAX_TEXT = 16;
  var MAX_STICKERS = 60;
  var FONT_TITLE = '"Trebuchet MS", "Arial Rounded MT Bold", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  var FONT_CUTE = '"Arial Rounded MT Bold", "Hiragino Maru Gothic ProN", "Apple SD Gothic Neo", "Malgun Gothic", ' +
                  '"PingFang SC", "Microsoft YaHei", "Hiragino Sans", "Meiryo", "Comic Sans MS", "Chalkboard SE", sans-serif';
  var FONT_DIGIT = '"Courier New", "Lucida Console", monospace';
  var FONT_EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  var TAU = Math.PI * 2;

  /* ═══════════ 2. Palette (read from css/base.css tokens) ═══════════ */
  var TOKENS = {
    white: ['--c-white', '#ffffff'], ink: ['--c-ink', '#4a3a55'], inkSoft: ['--c-ink-soft', '#7b6a86'],
    pink: ['--c-pink', '#ffc9de'], pinkDeep: ['--c-pink-deep', '#ff8fb8'], blush: ['--c-blush', '#fff0f6'],
    cherry: ['--c-cherry', '#ff4f7b'], cherryDark: ['--c-cherry-dark', '#d42a59'],
    powder: ['--c-powder', '#bfe3ff'], powderDeep: ['--c-powder-deep', '#7fbef0'], sky: ['--c-sky', '#e8f5ff'],
    blueDeep: ['--c-blue-deep', '#4f93d6'], mint: ['--c-mint', '#cff5e4'], mintDeep: ['--c-mint-deep', '#7fd8b2'],
    mintDark: ['--c-mint-dark', '#3f9e7a'], lavender: ['--c-lavender', '#e5dcff'], lavenderDeep: ['--c-lavender-deep', '#b9a6f2'],
    lavenderDark: ['--c-lavender-dark', '#7d67c9'], gold: ['--c-gold', '#ffd76a'], goldDeep: ['--c-gold-deep', '#e0a93a'],
    cream: ['--c-cream', '#fff8e7'], orange: ['--c-orange', '#ff9a4d'], orangeDark: ['--c-orange-dark', '#d9531f'],
    silver: ['--c-silver', '#e6e9f0'], silverDeep: ['--c-silver-deep', '#aab2c3'], checker: ['--c-checker', '#d9eeff']
  };
  var C = {};
  function readTokens() {
    var cs = null;
    try { cs = win.getComputedStyle(doc.documentElement); } catch (e) { /* ignore */ }
    Object.keys(TOKENS).forEach(function (k) {
      var v = cs ? cs.getPropertyValue(TOKENS[k][0]).trim() : '';
      C[k] = v || TOKENS[k][1];
    });
  }
  function penColor(id) {
    for (var i = 0; i < TEXT_COLORS.length; i++) if (TEXT_COLORS[i].id === id) return C[TEXT_COLORS[i].tok];
    return C.cherry;
  }
  function penToken(id) {
    for (var i = 0; i < TEXT_COLORS.length; i++) if (TEXT_COLORS[i].id === id) return TOKENS[TEXT_COLORS[i].tok][0];
    return '--c-cherry';
  }

  /* ═══════════ 3. State ═══════════ */
  var S = {
    step: 0, maxStep: 0,
    lookSrc: 'current', sent: null, outfit: null,
    pose: 'pose-look', crop: 'upper', expr: 'smile', mirror: false,
    bg: 'bg-pat-dots', frame: 'fr-4cut-pink',
    stickers: [], strokes: [],
    text: { str: '', color: 'pink', x: 0.5, y: 0.9, s: 0.075, r: 0, placed: false },
    date: 'film',
    sel: null,                          // {kind:'sticker', uid} | {kind:'text'}
    cat: null,
    pen: { tool: 'pen', color: 'pink', size: 1 },
    rev: 1, result: null, printing: false, error: null
  };
  var uidSeq = 0;
  var R = {};                           // DOM refs
  var base = { canvas: null, sig: '', token: 0, pending: null, W: 0, H: 0 };
  var doodle = { canvas: null, ctx: null, W: 0, H: 0 };
  var drawing = null;                   // in-progress stroke
  var DK = 1;                           // device px per output unit of the ctx being drawn (for shadowBlur)
  var poseMissingNoted = false;

  /* ═══════════ 4. Catalog helpers ═══════════ */
  function all(kind) { return HG.catalog ? HG.catalog.all(kind) : []; }
  function get(kind, id) { return HG.catalog ? HG.catalog.get(kind, id) : null; }
  function owned(kind, id) { return !HG.unlocks || HG.unlocks.has(kind, id); }
  function status(kind, id) { return HG.unlocks ? HG.unlocks.status(kind, id) : { owned: true, locked: false, type: 'default' }; }
  function poseDef() { return get('pose', S.pose) || { id: 'pose-look', type: 'look' }; }
  function frameDef() { return get('frame', S.frame) || all('frame')[0] || { id: 'fr-4cut-pink', type: '4cut', color: 'pink' }; }
  function photoBgs() { return all('background').filter(function (b) { return !b.use || b.use.indexOf('photo') >= 0; }); }
  function normOutfit(o) { return HG.look ? HG.look.normalize(o || null) : (o || {}); }

  /* ═══════════ 5. Layouts (output sizes are fixed per frame type) ═══════════ */
  function layoutOf(fr) {
    var type = (fr && fr.type) || '4cut';
    var W, H, cuts = [];
    switch (type) {
      case 'polaroid': W = 900; H = 1100; cuts.push({ x: 56, y: 56, w: 788, h: 800, r: 4 }); break;
      case 'photocard': W = 750; H = 1150; cuts.push({ x: 30, y: 30, w: 690, h: 1090, r: 34 }); break;
      case 'square': W = 1000; H = 1000; cuts.push({ x: 84, y: 84, w: 832, h: 832, r: 14 }); break;
      case 'webcam': W = 1200; H = 900; cuts.push({ x: 30, y: 88, w: 1140, h: 714, r: 0 }); break;
      default:
        type = '4cut'; W = 600; H = 1800;
        for (var i = 0; i < 4; i++) cuts.push({ x: 40, y: 44 + i * 400, w: 520, h: 380, r: 6 });
    }
    return { type: type, W: W, H: H, B: Math.min(W, H), cuts: cuts, color: (fr && fr.color) || 'pink', id: fr && fr.id };
  }
  function curL() { return layoutOf(frameDef()); }

  /* ═══════════ 6. Drawing primitives ═══════════ */
  function rr(ctx, x, y, w, hh, r) {
    r = Math.max(0, Math.min(r || 0, w / 2, hh / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + hh - r); ctx.arcTo(x + w, y + hh, x + w - r, y + hh, r);
    ctx.lineTo(x + r, y + hh); ctx.arcTo(x, y + hh, x, y + hh - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
  function heart(ctx, x, y, s, fill, stroke, lw) {
    var r = s / 2;
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.9);
    ctx.bezierCurveTo(x - r * 1.35, y + r * 0.05, x - r * 0.8, y - r * 1.05, x, y - r * 0.38);
    ctx.bezierCurveTo(x + r * 0.8, y - r * 1.05, x + r * 1.35, y + r * 0.05, x, y + r * 0.9);
    ctx.closePath();
    if (stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = lw || 2; ctx.strokeStyle = stroke; ctx.stroke(); }
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  }
  function star(ctx, x, y, R0, r0, fill, stroke, lw) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r0 : R0;
      ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    ctx.closePath();
    if (stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = lw || 2; ctx.strokeStyle = stroke; ctx.stroke(); }
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  }
  function sparkle(ctx, x, y, R0, fill) {
    ctx.beginPath();
    ctx.moveTo(x, y - R0);
    ctx.quadraticCurveTo(x, y, x + R0, y); ctx.quadraticCurveTo(x, y, x, y + R0);
    ctx.quadraticCurveTo(x, y, x - R0, y); ctx.quadraticCurveTo(x, y, x, y - R0);
    ctx.fillStyle = fill; ctx.fill();
  }
  function dots(ctx, x, y, w, hh, gap, r, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (var j = 0, yy = y + gap / 2; yy < y + hh; j++, yy += gap) {
      for (var xx = x + gap / 2 + (j % 2 ? gap / 2 : 0); xx < x + w; xx += gap) { ctx.moveTo(xx + r, yy); ctx.arc(xx, yy, r, 0, TAU); }
    }
    ctx.fill();
    ctx.restore();
  }
  function checker(ctx, x, y, w, hh, s, a, b) {
    ctx.fillStyle = a; ctx.fillRect(x, y, w, hh);
    ctx.fillStyle = b;
    for (var j = 0; j * s < hh; j++) for (var i = 0; i * s < w; i++) if ((i + j) % 2) ctx.fillRect(x + i * s, y + j * s, s, s);
  }
  function otext(ctx, str, x, y, font, fill, outline, lw, align) {
    ctx.save();
    ctx.font = font; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    if (outline) { ctx.lineWidth = lw || 4; ctx.strokeStyle = outline; ctx.strokeText(str, x, y); }
    ctx.fillStyle = fill; ctx.fillText(str, x, y);
    ctx.restore();
  }
  function holoGrad(ctx, x, y, w, hh) {
    var g = ctx.createLinearGradient(x, y, x + w, y + hh);
    var cs = [C.pink, C.lavender, C.powder, C.mint, C.gold, C.pink];
    cs.forEach(function (c, i) { g.addColorStop(i / (cs.length - 1), c); });
    return g;
  }

  /* 3×5 pixel font for the webcam clock */
  var PIX = {
    '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111',
    '4': '101101111001001', '5': '111100111001111', '6': '111100111101111', '7': '111001010010010',
    '8': '111101111101111', '9': '111101111001111', ':': '0,1,0,1,0', '.': '0,0,0,0,1'
  };
  function pixW(ch) { return (ch === ':' || ch === '.') ? 1 : 3; }
  function pixText(ctx, str, x, y, px, fill, outline, align) {
    var w = 0, i;
    for (i = 0; i < str.length; i++) w += (pixW(str[i]) + 1) * px;
    w -= px;
    var x0 = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
    function pass(color, grow) {
      ctx.fillStyle = color;
      var cx = x0;
      for (var n = 0; n < str.length; n++) {
        var ch = str[n], g = PIX[ch], cw = pixW(ch);
        if (g) {
          var bits = g.replace(/,/g, '');
          for (var row = 0; row < 5; row++) for (var col = 0; col < cw; col++) {
            if (bits[row * cw + col] === '1') ctx.fillRect(cx + col * px - grow, y + row * px - grow, px + grow * 2, px + grow * 2);
          }
        }
        cx += (cw + 1) * px;
      }
    }
    if (outline) pass(outline, Math.max(1, px * 0.35));
    pass(fill, 0);
  }

  function silhouette(ctx, c, color) {
    var cx = c.x + c.w / 2, r = Math.min(c.w, c.h) * 0.17;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cx, c.y + c.h * 0.36, r, 0, TAU); ctx.fill();
    rr(ctx, cx - r * 1.55, c.y + c.h * 0.36 + r * 1.15, r * 3.1, c.h, r * 1.2); ctx.fill();
    ctx.globalAlpha = 1;
    heart(ctx, cx, c.y + c.h * 0.36 + r * 2.1, r * 0.7, C.white);
    ctx.restore();
  }

  /* ═══════════ 7. Frame chrome (drawn in code; colours from tokens) ═══════════ */
  function stripTheme(color) {
    if (color === 'blue') return { bg: C.powder, dot: C.white, mat: C.white, line: C.powderDeep, text: C.blueDeep, outline: C.white, sub: C.blueDeep, accent: C.white, accent2: C.gold };
    if (color === 'black') return { bg: C.ink, dot: C.inkSoft, mat: C.inkSoft, line: C.white, text: C.white, outline: C.ink, sub: C.pink, accent: C.pinkDeep, accent2: C.gold };
    return { bg: C.pink, dot: C.white, mat: C.white, line: C.pinkDeep, text: C.cherryDark, outline: C.white, sub: C.cherryDark, accent: C.cherry, accent2: C.gold };
  }
  function camTheme(color) {
    if (color === 'y2k') return { body: C.lavender, bar1: C.pinkDeep, bar2: C.lavenderDark, title: 'HAMIN CAM ✦ 2000', round: true, well: C.lavenderDark };
    return { body: C.silver, bar1: C.blueDeep, bar2: C.powderDeep, title: 'HAMIN_CAM.exe', round: false, well: C.ink };
  }

  function drawUnder(ctx, L) {
    var W = L.W, H = L.H, i, c, g, th;
    ctx.save();
    if (L.type === '4cut') {
      th = stripTheme(L.color);
      ctx.fillStyle = th.bg; ctx.fillRect(0, 0, W, H);
      dots(ctx, 0, 0, W, H, 30, 3, th.dot, 0.55);
      for (i = 0; i < L.cuts.length; i++) { c = L.cuts[i]; ctx.fillStyle = th.mat; rr(ctx, c.x - 8, c.y - 8, c.w + 16, c.h + 16, 12); ctx.fill(); }
    } else if (L.type === 'polaroid') {
      if (L.color === 'pastel') {
        g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, C.blush); g.addColorStop(0.5, C.lavender); g.addColorStop(1, C.sky);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        dots(ctx, 0, 0, W, H, 36, 3.5, C.white, 0.7);
      } else {
        ctx.fillStyle = C.white; ctx.fillRect(0, 0, W, H);
      }
      ctx.globalAlpha = 0.6; ctx.strokeStyle = C.silverDeep; ctx.lineWidth = 3; ctx.strokeRect(1.5, 1.5, W - 3, H - 3); ctx.globalAlpha = 1;
    } else if (L.type === 'photocard') {
      rr(ctx, 0, 0, W, H, 46); ctx.clip();
      if (L.color === 'holo') ctx.fillStyle = holoGrad(ctx, 0, 0, W, H);
      else { g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.pinkDeep); g.addColorStop(1, C.pink); ctx.fillStyle = g; }
      ctx.fillRect(0, 0, W, H);
      dots(ctx, 0, 0, W, H, 26, 2.5, C.white, 0.5);
    } else if (L.type === 'square') {
      if (L.color === 'checker') checker(ctx, 0, 0, W, H, 42, C.white, C.pink);
      else {
        ctx.fillStyle = C.blush; ctx.fillRect(0, 0, W, H);
        var n = 13, step = W / n;
        for (i = 0; i < n; i++) {
          var col = i % 2 ? C.cherry : C.pinkDeep, p = step * (i + 0.5);
          heart(ctx, p, 42, 40, col); heart(ctx, p, H - 42, 40, col);
          if (i > 0 && i < n - 1) { heart(ctx, 42, p, 40, col); heart(ctx, W - 42, p, 40, col); }
        }
      }
    } else if (L.type === 'webcam') {
      th = camTheme(L.color);
      c = L.cuts[0];
      ctx.fillStyle = th.body; ctx.fillRect(0, 0, W, H);
      if (th.round) dots(ctx, 0, 0, W, H, 34, 3, C.white, 0.7);
      ctx.fillStyle = C.white; ctx.fillRect(0, 0, W, 5); ctx.fillRect(0, 0, 5, H);
      ctx.fillStyle = C.silverDeep; ctx.fillRect(0, H - 5, W, 5); ctx.fillRect(W - 5, 0, 5, H);
      g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, th.bar1); g.addColorStop(1, th.bar2);
      ctx.fillStyle = g; rr(ctx, 14, 14, W - 28, 60, th.round ? 26 : 3); ctx.fill();
      if (th.round) { ctx.globalAlpha = 0.35; ctx.fillStyle = C.white; rr(ctx, 26, 18, W - 52, 24, 12); ctx.fill(); ctx.globalAlpha = 1; }
      otext(ctx, th.title, 36, 45, 'bold 30px ' + FONT_TITLE, C.white, th.bar1, 6, 'left');
      var glyphs = ['✕', '□', '_'];
      for (i = 0; i < 3; i++) {
        var bx = W - 30 - 46 - i * 54;
        ctx.fillStyle = C.silver; rr(ctx, bx, 24, 46, 40, th.round ? 20 : 4); ctx.fill();
        ctx.strokeStyle = C.silverDeep; ctx.lineWidth = 2; ctx.stroke();
        otext(ctx, glyphs[i], bx + 23, 44, 'bold 24px ' + FONT_TITLE, C.ink);
      }
      ctx.fillStyle = th.well; ctx.fillRect(c.x - 5, c.y - 5, c.w + 10, c.h + 10);
      var sy = c.y + c.h + 16, sh = H - 18 - sy;
      ctx.fillStyle = C.white; rr(ctx, 20, sy, W - 40, sh, th.round ? 22 : 3); ctx.fill();
      ctx.strokeStyle = C.silverDeep; ctx.lineWidth = 3; ctx.stroke();
      var my = sy + sh / 2;
      ctx.beginPath(); ctx.arc(52, my, 11, 0, TAU); ctx.fillStyle = C.cherry; ctx.fill();
      otext(ctx, 'REC  00:05:24', 74, my + 1, 'bold 26px ' + FONT_DIGIT, C.ink, null, 0, 'left');
      otext(ctx, '640×480  ♡ ONLINE', W - 46, my + 1, 'bold 26px ' + FONT_DIGIT, C.ink, null, 0, 'right');
    }
    ctx.restore();
  }

  function drawOver(ctx, L) {
    var W = L.W, H = L.H, c = L.cuts[0], i, th;
    ctx.save();
    if (L.type === '4cut') {
      th = stripTheme(L.color);
      ctx.lineWidth = 4; ctx.strokeStyle = th.line;
      for (i = 0; i < L.cuts.length; i++) { c = L.cuts[i]; rr(ctx, c.x, c.y, c.w, c.h, c.r); ctx.stroke(); }
      var fy = c.y + c.h, mid = (fy + H) / 2;
      otext(ctx, 'HAMIN GAMES', W / 2, mid - 20, '900 52px ' + FONT_TITLE, th.text, th.outline, 12);
      otext(ctx, dateStr(), W / 2, mid + 36, 'bold 30px ' + FONT_DIGIT, th.sub, th.outline, 6);
      heart(ctx, 58, mid - 20, 38, th.accent, th.outline, 5);
      heart(ctx, W - 58, mid - 20, 38, th.accent, th.outline, 5);
      star(ctx, 60, mid + 36, 15, 7, th.accent2, th.outline, 3);
      star(ctx, W - 60, mid + 36, 15, 7, th.accent2, th.outline, 3);
    } else if (L.type === 'polaroid') {
      ctx.globalAlpha = 0.2; ctx.strokeStyle = C.ink; ctx.lineWidth = 4;
      rr(ctx, c.x, c.y, c.w, c.h, c.r); ctx.stroke(); ctx.globalAlpha = 1;
      otext(ctx, '♡ HAMIN GAMES', W - 60, H - 46, 'bold 24px ' + FONT_TITLE, L.color === 'pastel' ? C.lavenderDark : C.inkSoft, null, 0, 'right');
      if (L.color === 'pastel') {
        star(ctx, 70, H - 60, 18, 8, C.gold, C.white, 4);
        heart(ctx, 118, H - 58, 26, C.pinkDeep, C.white, 4);
        sparkle(ctx, 160, H - 64, 14, C.white);
      }
    } else if (L.type === 'photocard') {
      ctx.lineWidth = 8; ctx.strokeStyle = C.white; rr(ctx, c.x, c.y, c.w, c.h, c.r); ctx.stroke();
      if (L.color === 'holo') {
        ctx.save();
        rr(ctx, 0, 0, W, H, 46); ctx.clip();
        ctx.globalAlpha = 0.2; ctx.fillStyle = holoGrad(ctx, W, 0, -W, H); ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 0.16; ctx.fillStyle = C.white;
        for (i = -2; i < 5; i++) { ctx.beginPath(); ctx.moveTo(i * 260, 0); ctx.lineTo(i * 260 + 90, 0); ctx.lineTo(i * 260 + 90 - 520, H); ctx.lineTo(i * 260 - 520, H); ctx.closePath(); ctx.fill(); }
        ctx.restore();
        sparkle(ctx, c.x + c.w - 60, c.y + 70, 26, C.white);
        sparkle(ctx, c.x + c.w - 104, c.y + 112, 14, C.white);
        sparkle(ctx, c.x + 56, c.y + 60, 16, C.white);
      } else {
        heart(ctx, c.x + c.w - 58, c.y + 62, 46, C.pinkDeep, C.white, 6);
        heart(ctx, c.x + c.w - 104, c.y + 104, 26, C.cherry, C.white, 4);
      }
      otext(ctx, 'HAMIN GAMES ✦ PHOTOCARD', W / 2, 16, 'bold 17px ' + FONT_TITLE, L.color === 'holo' ? C.lavenderDark : C.white);
      ctx.globalAlpha = 0.92; ctx.fillStyle = C.white;
      rr(ctx, c.x + 26, c.y + c.h - 26 - 62, 214, 62, 31); ctx.fill(); ctx.globalAlpha = 1;
      otext(ctx, 'HAMIN ♡', c.x + 26 + 107, c.y + c.h - 26 - 30, 'bold 32px ' + FONT_TITLE, L.color === 'holo' ? C.lavenderDark : C.cherryDark);
    } else if (L.type === 'square') {
      ctx.lineWidth = 12; ctx.strokeStyle = C.white; rr(ctx, c.x, c.y, c.w, c.h, c.r); ctx.stroke();
      var pts = [[c.x, c.y], [c.x + c.w, c.y], [c.x, c.y + c.h], [c.x + c.w, c.y + c.h]];
      pts.forEach(function (p, n) {
        if (L.color === 'checker') star(ctx, p[0], p[1], 50, 22, n % 2 ? C.gold : C.pinkDeep, C.white, 8);
        else heart(ctx, p[0], p[1], 92, n % 2 ? C.cherry : C.pinkDeep, C.white, 8);
      });
    } else if (L.type === 'webcam') {
      th = camTheme(L.color);
      ctx.save();
      ctx.beginPath(); ctx.rect(c.x, c.y, c.w, c.h); ctx.clip();
      ctx.globalAlpha = 0.06; ctx.fillStyle = C.ink;
      for (var y = c.y; y < c.y + c.h; y += 6) ctx.fillRect(c.x, y, c.w, 2);
      ctx.restore();
      var ins = 34, len = 64;
      [[c.x + ins, c.y + ins, 1, 1], [c.x + c.w - ins, c.y + ins, -1, 1], [c.x + ins, c.y + c.h - ins, 1, -1], [c.x + c.w - ins, c.y + c.h - ins, -1, -1]].forEach(function (q) {
        [[C.ink, 12, 0.35], [C.white, 6, 1]].forEach(function (pass) {
          ctx.globalAlpha = pass[2]; ctx.strokeStyle = pass[0]; ctx.lineWidth = pass[1]; ctx.lineCap = 'square';
          ctx.beginPath(); ctx.moveTo(q[0], q[1] + len * q[3]); ctx.lineTo(q[0], q[1]); ctx.lineTo(q[0] + len * q[2], q[1]); ctx.stroke();
        });
      });
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(c.x + 74, c.y + 76, 15, 0, TAU); ctx.fillStyle = C.cherry; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = C.white; ctx.stroke();
      otext(ctx, 'REC', c.x + 100, c.y + 78, 'bold 36px ' + FONT_DIGIT, C.white, C.ink, 6, 'left');
      var d = new Date();
      pixText(ctx, pad2(d.getHours()) + ':' + pad2(d.getMinutes()), c.x + c.w - 70, c.y + 60, 7, C.white, C.ink, 'right');
      var bx = c.x + c.w - 70 - 64, by = c.y + 116;
      ctx.lineWidth = 5; ctx.strokeStyle = C.white; ctx.strokeRect(bx, by, 56, 26); ctx.fillStyle = C.white; ctx.fillRect(bx + 56, by + 8, 6, 10);
      ctx.fillStyle = C.mintDeep; ctx.fillRect(bx + 6, by + 6, 30, 14);
      if (th.round) {
        sparkle(ctx, c.x + 60, c.y + c.h - 70, 22, C.gold);
        sparkle(ctx, c.x + 100, c.y + c.h - 110, 12, C.white);
        star(ctx, W - 250, 44, 16, 7, C.gold, C.white, 3);
      }
    }
    ctx.restore();
  }

  /* ═══════════ 8. Figures (Hamin: the Dress Up look or a pose card) ═══════════ */
  var imgCache = {};
  var missingLogged = {};
  function loadImg(src) {
    if (!src) return Promise.resolve(null);
    if (imgCache[src]) return imgCache[src].p;
    var rec = imgCache[src] = { img: null, done: false };
    rec.p = new Promise(function (resolve) {
      var im = new Image();
      im.decoding = 'async';
      im.onload = function () { rec.img = im; rec.done = true; resolve(im); };
      im.onerror = function () {
        rec.done = true;
        if (!missingLogged[src]) { missingLogged[src] = 1; if (win.console) console.info('[photo-booth] image not found yet, using fallback: ' + src); }
        resolve(null);
      };
      im.src = src;
    });
    return rec.p;
  }

  function fitCrop(c, A, center) {
    var ca = c.w / c.h, w, hh, y;
    if (A >= ca) { w = c.h * A; return { x: c.x + c.w / 2 - w / 2, y: c.y, w: w, h: c.h }; }
    hh = c.w / A;
    y = center ? c.y + c.h / 2 - hh / 2 : c.y;
    if (!center && y + hh > 1600) y = Math.max(-80, 1600 - hh);
    return { x: c.x, y: y, w: c.w, h: hh };
  }

  var figCache = {}, figCount = 0;
  function lookFigure(outfit, expr) {
    var key = 'L|' + expr + '|' + JSON.stringify(outfit);
    if (figCache[key]) return figCache[key];
    if (++figCount > 60) { figCache = {}; figCount = 0; }
    var chain = uniq([expr, EXPR_NEAR[expr], 'smile', 'neutral']);
    var i = 0;
    function tryNext() {
      var o = copy(outfit); o.expr = chain[i++];
      return HG.look.loadImage(HG.look.headSrc(o)).then(function (img) {
        if (img || i >= chain.length) return o;
        return tryNext();
      });
    }
    figCache[key] = tryNext().then(function (o) {
      var layers = HG.look.layers(o, { background: false });
      return Promise.all(layers.map(function (l) { return HG.look.loadImage(l.src); }));
    }).then(function (imgs) { return { imgs: imgs.filter(Boolean) }; }, function () { return { imgs: [] }; });
    return figCache[key];
  }
  function figureFor(pose, expr) {
    if (!HG.look) return Promise.resolve({ imgs: [] });
    if (pose && pose.type === 'image') {
      return loadImg(pose.src).then(function (img) {
        if (img) return { imgs: [img] };
        if (!poseMissingNoted) { poseMissingNoted = true; toast(t('photo.pose.missing')); }
        return lookFigure(S.outfit, expr);
      });
    }
    return lookFigure(S.outfit, expr);
  }

  function drawFigure(ctx, fig, cut, v) {
    if (!fig || !fig.imgs.length) { silhouette(ctx, cut, C.lavenderDeep); return; }
    var CR = (HG.look && HG.look.CROPS) || {};
    var c = fitCrop(CR[v.crop] || CR.full || { x: 0, y: 0, w: 1200, h: 1600 }, cut.w / cut.h, v.crop === 'full');
    var s = cut.w / c.w;
    ctx.save();
    if (v.mirror) { var mx = cut.x + cut.w / 2; ctx.translate(mx, 0); ctx.scale(-1, 1); ctx.translate(-mx, 0); }
    fig.imgs.forEach(function (img) {
      try { ctx.drawImage(img, cut.x - c.x * s, cut.y - c.y * s, 1200 * s, 1600 * s); } catch (e) { /* broken image */ }
    });
    ctx.restore();
  }

  /* Each cut of a 4-cut strip gets its own face + framing automatically. */
  function variants(L) {
    if (L.cuts.length === 1) return [{ expr: S.expr, crop: S.crop, mirror: S.mirror }];
    var ex = uniq([S.expr, 'smile', 'big', 'wink', 'neutral', 'sheep']);
    var cr = uniq([S.crop, 'bust', 'upper', 'full']);
    return [
      { expr: ex[0], crop: cr[0], mirror: S.mirror },
      { expr: ex[1], crop: cr[1], mirror: S.mirror },
      { expr: ex[2], crop: cr[0], mirror: !S.mirror },
      { expr: ex[3], crop: cr[2] === 'full' ? cr[1] : cr[2], mirror: S.mirror }
    ];
  }

  function baseSig() {
    return JSON.stringify([S.frame, S.pose, S.outfit, S.crop, S.expr, S.mirror, S.bg]);
  }

  function renderBase() {
    var sig = baseSig();
    if (sig === base.sig && base.canvas) return Promise.resolve(base.canvas);
    if (sig === base.pendingSig && base.pending) return base.pending;
    var token = ++base.token;
    var L = curL(), vs = variants(L), pose = poseDef();
    setLoading(true);
    base.pendingSig = sig;
    base.pending = Promise.all(vs.map(function (v) { return figureFor(pose, v.expr); })).then(function (figs) {
      if (token !== base.token) return null;
      var cv = doc.createElement('canvas');
      cv.width = L.W; cv.height = L.H;
      var ctx = cv.getContext('2d');
      DK = 1;
      drawUnder(ctx, L);
      var chain = Promise.resolve();
      L.cuts.forEach(function (cut, i) {
        chain = chain.then(function () {
          ctx.save();
          rr(ctx, cut.x, cut.y, cut.w, cut.h, cut.r); ctx.clip();
          ctx.fillStyle = C.white; ctx.fillRect(cut.x, cut.y, cut.w, cut.h);
          return Promise.resolve(HG.look ? HG.look.drawBackground(ctx, S.bg, cut.x, cut.y, cut.w, cut.h) : null)
            .catch(function () { /* missing background → white */ })
            .then(function () { drawFigure(ctx, figs[i], cut, vs[i]); ctx.restore(); });
        });
      });
      return chain.then(function () {
        DK = 1;
        drawOver(ctx, L);
        if (token !== base.token) return null;
        base.canvas = cv; base.sig = sig; base.W = L.W; base.H = L.H;
        base.pending = null; base.pendingSig = '';
        setLoading(false);
        requestDraw();
        return cv;
      });
    }).catch(function (e) {
      log(e);
      if (token === base.token) { base.pending = null; base.pendingSig = ''; setLoading(false); }
      return base.canvas;
    });
    return base.pending;
  }

  function setLoading(on) { if (R.loading) R.loading.hidden = !on; }

  /* ═══════════ 9. Doodle layer ═══════════ */
  function ensureDoodle(L) {
    if (!doodle.canvas) { doodle.canvas = doc.createElement('canvas'); doodle.ctx = doodle.canvas.getContext('2d'); }
    if (doodle.W !== L.W || doodle.H !== L.H) {
      doodle.canvas.width = doodle.W = L.W;
      doodle.canvas.height = doodle.H = L.H;
      replayDoodle();
    }
  }
  function replayDoodle() {
    if (!doodle.ctx) return;
    var L = curL();
    doodle.ctx.clearRect(0, 0, doodle.W, doodle.H);
    DK = 1;
    S.strokes.forEach(function (st) { drawStroke(doodle.ctx, st, L, 1); });
  }
  function tracePath(ctx, pts, W, H) {
    ctx.beginPath();
    var n = pts.length / 2;
    ctx.moveTo(pts[0] * W, pts[1] * H);
    if (n === 1) { ctx.lineTo(pts[0] * W + 0.01, pts[1] * H + 0.01); return; }
    if (n === 2) { ctx.lineTo(pts[2] * W, pts[3] * H); return; }
    for (var i = 1; i < n - 1; i++) {
      var x = pts[i * 2] * W, y = pts[i * 2 + 1] * H;
      var nx = pts[i * 2 + 2] * W, ny = pts[i * 2 + 3] * H;
      ctx.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2);
    }
    ctx.lineTo(pts[pts.length - 2] * W, pts[pts.length - 1] * H);
  }
  function drawStroke(ctx, st, L, k) {
    if (!st || st.pts.length < 2) return;
    var lw = st.w * L.B;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = lw;
    tracePath(ctx, st.pts, L.W, L.H);
    if (st.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = C.ink; ctx.stroke();
    } else if (st.tool === 'glow') {
      var col = penColor(st.color);
      ctx.shadowColor = col; ctx.shadowBlur = lw * 1.3 * k;
      ctx.strokeStyle = col; ctx.stroke(); ctx.stroke();
      ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
      ctx.strokeStyle = C.white; ctx.lineWidth = lw * 0.55; ctx.stroke();
    } else {
      ctx.strokeStyle = penColor(st.color); ctx.stroke();
    }
    ctx.restore();
  }

  /* ═══════════ 10. Stickers, text, date ═══════════ */
  function stickerDef(sid) { return get('sticker', sid); }
  function stickerImg(sid) {
    var def = stickerDef(sid);
    if (!def || !def.src) return null;
    var rec = imgCache[def.src];
    if (!rec) { loadImg(def.src).then(function () { requestDraw(); }); return null; }
    return rec.img;
  }
  function popScale(o, now) {
    if (!o.pop) return 1;
    var p = (now - o.pop) / 280;
    if (p >= 1 || p < 0) { o.pop = 0; return 1; }
    var c1 = 1.70158, c3 = c1 + 1, q = p - 1;
    return 0.35 + 0.65 * (1 + c3 * q * q * q + c1 * q * q);
  }
  function drawSticker(ctx, o, L, now) {
    var size = o.s * L.B, sc = popScale(o, now || 0);
    ctx.save();
    ctx.translate(o.x * L.W, o.y * L.H);
    ctx.rotate(o.r);
    if (sc !== 1) ctx.scale(sc, sc);
    var img = stickerImg(o.sid);
    if (img) {
      try { ctx.drawImage(img, -size / 2, -size / 2, size, size); } catch (e) { /* ignore */ }
    } else {
      ctx.beginPath(); ctx.arc(0, 0, size * 0.44, 0, TAU);
      ctx.fillStyle = C.white; ctx.fill();
      ctx.lineWidth = size * 0.05; ctx.strokeStyle = C.pinkDeep; ctx.stroke();
      var def = stickerDef(o.sid);
      ctx.font = Math.round(size * 0.5) + 'px ' + FONT_EMOJI;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = C.ink;
      ctx.fillText((def && def.emoji) || '♡', 0, size * 0.03);
    }
    ctx.restore();
  }
  function textFont(px) { return 'bold ' + Math.round(px) + 'px ' + FONT_CUTE; }
  function measureText(L) {
    var o = S.text, px = Math.max(8, o.s * L.B);
    if (!R.measure) R.measure = doc.createElement('canvas').getContext('2d');
    R.measure.font = textFont(px);
    o._w = R.measure.measureText(o.str || ' ').width + px * 0.5;
    o._h = px * 1.3;
    return px;
  }
  function drawText(ctx, L) {
    var o = S.text;
    if (!o.str) return;
    var px = measureText(L);
    var col = penColor(o.color), out = o.color === 'white' ? C.pinkDeep : C.white;
    ctx.save();
    ctx.translate(o.x * L.W, o.y * L.H); ctx.rotate(o.r);
    ctx.font = textFont(px); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    ctx.globalAlpha = 0.28; ctx.lineWidth = px * 0.26; ctx.strokeStyle = C.ink; ctx.strokeText(o.str, 0, px * 0.07);
    ctx.globalAlpha = 1; ctx.strokeStyle = out; ctx.strokeText(o.str, 0, 0);
    ctx.fillStyle = col; ctx.fillText(o.str, 0, 0);
    ctx.restore();
  }
  function drawDate(ctx, L) {
    if (S.date === 'off') return;
    var c = L.cuts[L.cuts.length - 1], str = dateStr(), px;
    ctx.save();
    ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    if (S.date === 'film') {
      px = Math.round(L.B * 0.046);
      ctx.font = 'bold ' + px + 'px ' + FONT_DIGIT;
      ctx.shadowColor = C.orangeDark; ctx.shadowBlur = px * 0.45 * DK;
      ctx.fillStyle = C.orange;
      ctx.fillText(str, c.x + c.w - px * 0.7, c.y + c.h - px * 0.6);
      ctx.shadowBlur = 0;
      ctx.fillText(str, c.x + c.w - px * 0.7, c.y + c.h - px * 0.6);
    } else {
      px = Math.round(L.B * 0.05);
      ctx.font = textFont(px);
      ctx.lineJoin = 'round'; ctx.lineWidth = px * 0.28; ctx.strokeStyle = C.white;
      var s2 = '♡ ' + str;
      ctx.strokeText(s2, c.x + c.w - px * 0.6, c.y + c.h - px * 0.55);
      ctx.fillStyle = C.cherry;
      ctx.fillText(s2, c.x + c.w - px * 0.6, c.y + c.h - px * 0.55);
    }
    ctx.restore();
  }

  /* ═══════════ 11. Compose (display + export share this) ═══════════ */
  function drawPlaceholder(ctx, L) {
    drawUnder(ctx, L);
    L.cuts.forEach(function (c) {
      ctx.save(); rr(ctx, c.x, c.y, c.w, c.h, c.r); ctx.clip();
      ctx.fillStyle = C.sky; ctx.fillRect(c.x, c.y, c.w, c.h);
      silhouette(ctx, c, C.powderDeep);
      ctx.restore();
    });
    drawOver(ctx, L);
  }
  function compose(ctx, L, k, live, now) {
    DK = k;
    if (base.canvas && base.W === L.W && base.H === L.H) ctx.drawImage(base.canvas, 0, 0, L.W, L.H);
    else drawPlaceholder(ctx, L);
    for (var i = 0; i < S.stickers.length; i++) drawSticker(ctx, S.stickers[i], L, now);
    ensureDoodle(L);
    ctx.drawImage(doodle.canvas, 0, 0, L.W, L.H);
    if (live && drawing && drawing.tool !== 'eraser') { DK = k; drawStroke(ctx, drawing, L, k); }
    drawText(ctx, L);
    DK = k;
    drawDate(ctx, L);
    if (live && objStep() && S.sel && !S.printing) drawSelection(ctx, L, k);
  }

  /* ═══════════ 12. Selection model ═══════════ */
  function selObj() {
    if (!S.sel) return null;
    if (S.sel.kind === 'text') return S.text.str ? S.text : null;
    for (var i = 0; i < S.stickers.length; i++) if (S.stickers[i].uid === S.sel.uid) return S.stickers[i];
    return null;
  }
  function selIndex() {
    if (!S.sel || S.sel.kind !== 'sticker') return -1;
    for (var i = 0; i < S.stickers.length; i++) if (S.stickers[i].uid === S.sel.uid) return i;
    return -1;
  }
  function boxOf(kind, o, L) {
    if (kind === 'text') { measureText(L); return { cx: o.x * L.W, cy: o.y * L.H, w: o._w, h: o._h, r: o.r }; }
    var s = o.s * L.B;
    return { cx: o.x * L.W, cy: o.y * L.H, w: s * 0.92, h: s * 0.92, r: o.r };
  }
  function selBox(L) { var o = selObj(); return o ? boxOf(S.sel.kind, o, L) : null; }
  function toLocal(p, b) {
    var dx = p.x - b.cx, dy = p.y - b.cy, c = Math.cos(-b.r), s = Math.sin(-b.r);
    return { x: dx * c - dy * s, y: dx * s + dy * c };
  }
  function inBox(p, b, pad) { var q = toLocal(p, b); return Math.abs(q.x) <= b.w / 2 + pad && Math.abs(q.y) <= b.h / 2 + pad; }
  function handleR(sc) { return (isTouch() ? 17 : 12) * sc; }       // sc = output units per CSS px
  function hitHandle(p, b, sc) {
    var q = toLocal(p, b), r = handleR(sc) * 1.35;
    if (Math.hypot(q.x - b.w / 2, q.y - b.h / 2) <= r) return 'xform';
    if (Math.hypot(q.x + b.w / 2, q.y + b.h / 2) <= r) return 'del';
    return null;
  }
  function hitObj(p, L) {
    if (S.text.str && inBox(p, boxOf('text', S.text, L), 0)) return { kind: 'text' };
    for (var i = S.stickers.length - 1; i >= 0; i--) {
      if (inBox(p, boxOf('sticker', S.stickers[i], L), 0)) return { kind: 'sticker', uid: S.stickers[i].uid };
    }
    return null;
  }
  function drawSelection(ctx, L, k) {
    var b = selBox(L);
    if (!b) return;
    var u = dpr() / k;                         // output units per CSS px
    var hr = handleR(u);
    ctx.save();
    ctx.translate(b.cx, b.cy); ctx.rotate(b.r);
    ctx.lineWidth = 4 * u; ctx.strokeStyle = C.white; ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.setLineDash([6 * u, 4 * u]); ctx.lineWidth = 2 * u; ctx.strokeStyle = C.cherry; ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.setLineDash([]);
    // ◢ size + turn handle
    ctx.beginPath(); ctx.arc(b.w / 2, b.h / 2, hr, 0, TAU);
    ctx.fillStyle = C.white; ctx.fill(); ctx.lineWidth = 2.5 * u; ctx.strokeStyle = C.cherry; ctx.stroke();
    ctx.beginPath(); ctx.arc(b.w / 2, b.h / 2, hr * 0.5, -Math.PI * 0.9, Math.PI * 0.35);
    ctx.lineWidth = 2.2 * u; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(b.w / 2 + hr * 0.1, b.h / 2 + hr * 0.62); ctx.lineTo(b.w / 2 + hr * 0.36, b.h / 2 + hr * 0.3); ctx.lineTo(b.w / 2 + hr * 0.55, b.h / 2 + hr * 0.62); ctx.stroke();
    // ✕ delete handle
    ctx.beginPath(); ctx.arc(-b.w / 2, -b.h / 2, hr, 0, TAU);
    ctx.fillStyle = C.cherry; ctx.fill(); ctx.lineWidth = 2 * u; ctx.strokeStyle = C.white; ctx.stroke();
    var e = hr * 0.38;
    ctx.beginPath(); ctx.moveTo(-b.w / 2 - e, -b.h / 2 - e); ctx.lineTo(-b.w / 2 + e, -b.h / 2 + e);
    ctx.moveTo(-b.w / 2 + e, -b.h / 2 - e); ctx.lineTo(-b.w / 2 - e, -b.h / 2 + e);
    ctx.lineWidth = 2.6 * u; ctx.stroke();
    ctx.restore();
  }

  /* ═══════════ 13. Display canvas ═══════════ */
  var rafId = 0, fitSize = { w: 0, h: 0, L: '' };
  function requestDraw() { if (!rafId) rafId = win.requestAnimationFrame(tick); }
  function tick(now) {
    rafId = 0;
    try { draw(now); } catch (e) { log(e); }
    var anim = false;
    for (var i = 0; i < S.stickers.length; i++) if (S.stickers[i].pop) { anim = true; break; }
    if (anim && !doc.hidden) requestDraw();
  }
  function measureFit() {
    if (!R.fit) return;
    fitSize.bw = R.fit.clientWidth; fitSize.bh = R.fit.clientHeight; fitSize.L = '';
  }
  function fitCanvas(L) {
    var key = L.W + 'x' + L.H + '@' + fitSize.bw + 'x' + fitSize.bh + '@' + dpr();
    if (fitSize.L === key) return;
    fitSize.L = key;
    var bw = Math.max(80, fitSize.bw || 300), bh = Math.max(80, fitSize.bh || 400);
    var s = Math.min(bw / L.W, bh / L.H);
    var cw = Math.max(40, Math.floor(L.W * s)), ch = Math.max(40, Math.floor(L.H * s));
    var cv = R.canvas, d = dpr();
    cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
    var pw = Math.round(cw * d), ph = Math.round(ch * d);
    if (cv.width !== pw) cv.width = pw;
    if (cv.height !== ph) cv.height = ph;
  }
  function draw(now) {
    if (!R.canvas) return;
    var L = curL();
    fitCanvas(L);
    var ctx = R.canvas.getContext('2d');
    var k = R.canvas.width / L.W;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, R.canvas.width, R.canvas.height);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.imageSmoothingEnabled = true;
    compose(ctx, L, k, true, now || nowMs());
  }
  function canvasLabel() {
    var L = curL();
    var parts = [t('photo.canvas.summary', { frame: name('frame', S.frame), n: S.stickers.length })];
    var o = selObj();
    if (o && objStep()) parts.push(t('photo.sticker.selected', { name: S.sel.kind === 'text' ? S.text.str : name('sticker', o.sid) }));
    R.canvas.setAttribute('aria-label', parts.join(' · ') + ' (' + L.W + '×' + L.H + ')');
  }

  /* ═══════════ 14. Canvas pointer + keyboard ═══════════ */
  var ptrs = {}, drag = null;
  function objStep() { var s = STEPS[S.step]; return s === 'stickers' || s === 'text'; }
  function interactive() { return objStep() || STEPS[S.step] === 'doodle'; }
  function toOut(e) {
    var r = R.canvas.getBoundingClientRect(), L = curL();
    return { x: (e.clientX - r.left) / r.width * L.W, y: (e.clientY - r.top) / r.height * L.H, sc: L.W / r.width };
  }
  function ptrCount() { return Object.keys(ptrs).length; }
  function angle(a, b) { return Math.atan2(b.y - a.y, b.x - a.x); }
  function dist(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }

  function onDown(e) {
    if (S.printing || !interactive()) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    var p = toOut(e), L = curL();
    ptrs[e.pointerId] = p;
    try { R.canvas.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
    e.preventDefault();
    try { R.canvas.focus({ preventScroll: true }); } catch (x2) { /* ignore */ }
    if (STEPS[S.step] === 'doodle') {
      if (drag) return;
      startStroke(p, L);
      drag = { mode: 'draw', id: e.pointerId };
      requestDraw();
      return;
    }
    if (ptrCount() === 2 && selObj()) { startPinch(); return; }
    if (ptrCount() > 2) return;
    var b = selBox(L);
    if (b) {
      var hh = hitHandle(p, b, p.sc);
      if (hh === 'del') { removeSel(); drag = null; return; }
      if (hh === 'xform') {
        var o = selObj(), c = { x: b.cx, y: b.cy };
        drag = { mode: 'xform', id: e.pointerId, c: c, d0: Math.max(1, dist(c, p)), a0: angle(c, p), s0: o.s, r0: o.r, moved: false };
        return;
      }
    }
    var hit = hitObj(p, L);
    if (hit) {
      select(hit, false);
      var so = selObj();
      drag = { mode: 'move', id: e.pointerId, p0: p, x0: so.x, y0: so.y, moved: false };
      requestDraw();
    } else {
      drag = null;
      if (S.sel) { S.sel = null; afterSelChange(); }
    }
  }
  function startPinch() {
    var ids = Object.keys(ptrs), a = ptrs[ids[0]], b = ptrs[ids[1]], o = selObj();
    if (!o) return;
    drag = { mode: 'pinch', ids: ids, d0: Math.max(1, dist(a, b)), a0: angle(a, b), m0: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
             s0: o.s, r0: o.r, x0: o.x, y0: o.y, moved: false };
  }
  function limitS(o) { return S.sel && S.sel.kind === 'text' ? [0.03, 0.3] : [0.05, 1.2]; }
  function onMove(e) {
    if (!(e.pointerId in ptrs)) return;
    var p = toOut(e), L = curL(), o, lim;
    ptrs[e.pointerId] = p;
    if (!drag) return;
    if (drag.mode === 'draw') {
      if (drag.id !== e.pointerId) return;
      var list = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
      if (!list.length) list = [e];
      for (var i = 0; i < list.length; i++) addPoint(toOut(list[i]), L);
      requestDraw();
      return;
    }
    o = selObj();
    if (!o) return;
    if (drag.mode === 'move' && drag.id === e.pointerId) {
      o.x = clamp(drag.x0 + (p.x - drag.p0.x) / L.W, 0, 1);
      o.y = clamp(drag.y0 + (p.y - drag.p0.y) / L.H, 0, 1);
      drag.moved = true;
    } else if (drag.mode === 'xform' && drag.id === e.pointerId) {
      lim = limitS(o);
      o.s = clamp(drag.s0 * dist(drag.c, p) / drag.d0, lim[0], lim[1]);
      o.r = snapAngle(drag.r0 + angle(drag.c, p) - drag.a0);
      drag.moved = true;
    } else if (drag.mode === 'pinch') {
      var a = ptrs[drag.ids[0]], b = ptrs[drag.ids[1]];
      if (!a || !b) return;
      lim = limitS(o);
      o.s = clamp(drag.s0 * dist(a, b) / drag.d0, lim[0], lim[1]);
      o.r = snapAngle(drag.r0 + angle(a, b) - drag.a0);
      o.x = clamp(drag.x0 + ((a.x + b.x) / 2 - drag.m0.x) / L.W, 0, 1);
      o.y = clamp(drag.y0 + ((a.y + b.y) / 2 - drag.m0.y) / L.H, 0, 1);
      drag.moved = true;
    }
    requestDraw();
  }
  function snapAngle(r) {
    var n = Math.round(r / (Math.PI / 2)) * (Math.PI / 2);
    return Math.abs(r - n) < 0.06 ? n : r;
  }
  function onUp(e) {
    if (!(e.pointerId in ptrs)) return;
    delete ptrs[e.pointerId];
    try { R.canvas.releasePointerCapture(e.pointerId); } catch (x) { /* ignore */ }
    if (!drag) return;
    if (drag.mode === 'draw') { if (drag.id === e.pointerId) { endStroke(); drag = null; } return; }
    if (drag.mode === 'pinch') {
      if (drag.moved) bump();
      var rest = Object.keys(ptrs);
      var o = selObj();
      if (rest.length === 1 && o) { var p = ptrs[rest[0]]; drag = { mode: 'move', id: Number(rest[0]), p0: p, x0: o.x, y0: o.y, moved: false }; }
      else drag = null;
      return;
    }
    if (drag.id === e.pointerId) { if (drag.moved) bump(); drag = null; }
  }

  function onKey(e) {
    var step = STEPS[S.step];
    if (S.printing) return;
    if (step === 'doodle') {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); undo(); }
      return;
    }
    if (!objStep()) return;
    var o = selObj(), L = curL(), big = e.shiftKey;
    var key = e.key;
    if (key === 'Enter' || key === ' ') {
      e.preventDefault();
      cycleSelection();
      return;
    }
    if (key === 'Escape' || key === 'Esc') { if (S.sel) { e.preventDefault(); S.sel = null; afterSelChange(); } return; }
    if (!o) {
      if (/^Arrow/.test(key)) { e.preventDefault(); cycleSelection(); }
      return;
    }
    var step1 = big ? 0.05 : 0.01, used = true, lim = limitS(o);
    switch (key) {
      case 'ArrowLeft': o.x = clamp(o.x - step1 * L.B / L.W, 0, 1); break;
      case 'ArrowRight': o.x = clamp(o.x + step1 * L.B / L.W, 0, 1); break;
      case 'ArrowUp': o.y = clamp(o.y - step1 * L.B / L.H, 0, 1); break;
      case 'ArrowDown': o.y = clamp(o.y + step1 * L.B / L.H, 0, 1); break;
      case '+': case '=': case 'Add': o.s = clamp(o.s * (big ? 1.25 : 1.08), lim[0], lim[1]); break;
      case '-': case '_': case 'Subtract': o.s = clamp(o.s / (big ? 1.25 : 1.08), lim[0], lim[1]); break;
      case '[': case '{': o.r -= (big ? 15 : 5) * Math.PI / 180; break;
      case ']': case '}': o.r += (big ? 15 : 5) * Math.PI / 180; break;
      case 'Delete': case 'Backspace': removeSel(); return;
      default: used = false;
    }
    if (used) { e.preventDefault(); bump(); requestDraw(); }
  }
  function cycleSelection() {
    var list = S.stickers.map(function (s) { return { kind: 'sticker', uid: s.uid }; });
    if (S.text.str) list.push({ kind: 'text' });
    if (!list.length) { announce(t('photo.tools.nothing')); return; }
    var i = -1;
    if (S.sel) for (var n = 0; n < list.length; n++) if (list[n].kind === S.sel.kind && list[n].uid === S.sel.uid) i = n;
    select(list[(i + 1) % list.length], true);
  }
  function select(sel, speak) {
    S.sel = sel;
    afterSelChange();
    if (speak) {
      var o = selObj();
      if (o) announce(t('photo.sticker.selected', { name: sel.kind === 'text' ? S.text.str : name('sticker', o.sid) }));
    }
  }
  function afterSelChange() { renderTools(); canvasLabel(); requestDraw(); }
  function bump() { S.rev++; }

  /* ═══════════ 15. Sticker + text actions ═══════════ */
  function addSticker(sid) {
    if (S.stickers.length >= MAX_STICKERS) { sfx('error'); toast(t('photo.sticker.full', { n: MAX_STICKERS })); return; }
    var L = curL(), cut = L.cuts[S.stickers.length % L.cuts.length];
    var o = {
      uid: ++uidSeq, sid: sid,
      x: (cut.x + cut.w * (0.25 + Math.random() * 0.5)) / L.W,
      y: (cut.y + cut.h * (0.22 + Math.random() * 0.56)) / L.H,
      s: L.type === '4cut' ? 0.24 : 0.2,
      r: (Math.random() - 0.5) * 0.5,
      pop: rm() ? 0 : nowMs()
    };
    S.stickers.push(o);
    loadImg((stickerDef(sid) || {}).src).then(function () { requestDraw(); });
    sfx('pop', { rate: 0.9 + Math.random() * 0.4 });
    S.sel = { kind: 'sticker', uid: o.uid };
    bump();
    afterSelChange();
    updateCount();
    announce(t('photo.sticker.added', { name: name('sticker', sid) }));
    revealCanvas();
  }
  function removeSel() {
    var o = selObj();
    if (!o) return;
    if (S.sel.kind === 'text') {
      S.text.str = ''; S.text.placed = false;
      if (R.textInput) R.textInput.value = '';
      updateTextCount();
      announce(t('photo.text.removed'));
    } else {
      var i = selIndex();
      if (i >= 0) S.stickers.splice(i, 1);
      announce(t('photo.sticker.removed', { name: name('sticker', o.sid) }));
      updateCount();
    }
    sfx('whoosh');
    S.sel = null;
    bump();
    afterSelChange();
  }
  function reorder(dir) {
    var i = selIndex();
    if (i < 0) return;
    var j = clamp(i + dir, 0, S.stickers.length - 1);
    if (j === i) { announce(t(dir > 0 ? 'photo.tools.isFront' : 'photo.tools.isBack')); return; }
    var o = S.stickers.splice(i, 1)[0];
    S.stickers.splice(j, 0, o);
    sfx('click'); bump(); requestDraw();
    announce(t(dir > 0 ? 'photo.tools.movedForward' : 'photo.tools.movedBack'));
  }
  function nudge(kind) {
    var o = selObj();
    if (!o) return;
    var lim = limitS(o);
    if (kind === 'bigger') o.s = clamp(o.s * 1.12, lim[0], lim[1]);
    else if (kind === 'smaller') o.s = clamp(o.s / 1.12, lim[0], lim[1]);
    else if (kind === 'rotL') o.r -= Math.PI / 12;
    else if (kind === 'rotR') o.r += Math.PI / 12;
    sfx('tick'); bump(); requestDraw();
  }
  function clearStickers() {
    if (!S.stickers.length) return;
    HG.ui.confirm({ titleKey: 'photo.sticker.clearTitle', textKey: 'photo.sticker.clearText', danger: true, okKey: 'photo.sticker.clear' }).then(function (yes) {
      if (!yes) return;
      S.stickers = []; if (S.sel && S.sel.kind === 'sticker') S.sel = null;
      sfx('whoosh'); bump(); afterSelChange(); updateCount();
      announce(t('photo.sticker.cleared'));
    });
  }
  function textDefaults(L) {
    var c = L.cuts[L.cuts.length - 1], y;
    if (L.type === 'polaroid') y = (c.y + c.h + (L.H - c.y - c.h) / 2) / L.H;
    else if (L.type === '4cut') y = (c.y + c.h * 0.8) / L.H;
    else y = (c.y + c.h * 0.82) / L.H;
    S.text.x = 0.5; S.text.y = y; S.text.r = 0;
    S.text.s = L.type === '4cut' ? 0.085 : 0.075;
  }
  function setText(str) {
    var v = chars(str).slice(0, MAX_TEXT).join('');
    var had = !!S.text.str;
    S.text.str = v;
    if (v && !S.text.placed) { textDefaults(curL()); S.text.placed = true; }
    if (v && !had) S.sel = { kind: 'text' };
    if (!v && S.sel && S.sel.kind === 'text') S.sel = null;
    bump(); renderTools(); canvasLabel(); requestDraw();
    updateTextCount();
  }

  /* ═══════════ 16. Doodle actions ═══════════ */
  function startStroke(p, L) {
    var tool = S.pen.tool;
    drawing = { tool: tool, color: S.pen.color, w: PEN_SIZES[S.pen.size] * (tool === 'eraser' ? 2 : 1), pts: [p.x / L.W, p.y / L.H] };
    if (tool === 'eraser') { ensureDoodle(L); eraseSeg(L); }
  }
  function addPoint(p, L) {
    if (!drawing) return;
    var n = drawing.pts.length;
    var lx = drawing.pts[n - 2] * L.W, ly = drawing.pts[n - 1] * L.H;
    if (Math.hypot(p.x - lx, p.y - ly) < 1.2) return;
    drawing.pts.push(clamp(p.x / L.W, -0.02, 1.02), clamp(p.y / L.H, -0.02, 1.02));
    if (drawing.tool === 'eraser') eraseSeg(L);
    if (drawing.pts.length > 4000) { endStroke(); startStroke(p, L); }
  }
  function eraseSeg(L) {
    var pts = drawing.pts, n = pts.length;
    var seg = { tool: 'eraser', w: drawing.w, pts: n >= 4 ? pts.slice(n - 4) : pts.slice(0, 2).concat(pts.slice(0, 2)) };
    drawStroke(doodle.ctx, seg, L, 1);
  }
  function endStroke() {
    if (!drawing) return;
    var L = curL(), st = drawing;
    drawing = null;
    if (st.pts.length === 2) st.pts.push(st.pts[0] + 0.0005, st.pts[1]);
    ensureDoodle(L);
    if (st.tool !== 'eraser') drawStroke(doodle.ctx, st, L, 1);
    S.strokes.push(st);
    if (S.strokes.length > 300) { S.strokes.shift(); replayDoodle(); }
    bump();
    requestDraw();
    renderTools();
    updateDoodleButtons();
  }
  function undo() {
    if (drawing) endStroke();
    if (!S.strokes.length) return;
    S.strokes.pop();
    replayDoodle();
    bump(); sfx('pop', { rate: 0.8 }); requestDraw();
    renderTools(); updateDoodleButtons();
    announce(t('photo.doodle.undone'));
  }
  function clearDoodle() {
    if (!S.strokes.length) return;
    HG.ui.confirm({ titleKey: 'photo.doodle.clearTitle', textKey: 'photo.doodle.clearText', danger: true, okKey: 'photo.doodle.clear' }).then(function (yes) {
      if (!yes) return;
      S.strokes = []; replayDoodle(); bump(); sfx('whoosh'); requestDraw(); renderTools(); updateDoodleButtons();
      announce(t('photo.doodle.cleared'));
    });
  }

  /* ═══════════ 17. Choices (look, pose, bg, frame) ═══════════ */
  function changedBase() { bump(); renderBase(); requestDraw(); canvasLabel(); }
  function lookEntries() {
    var out = [];
    if (S.sent) out.push({ key: 'sent', outfit: S.sent, label: t('photo.look.sent'), badge: true });
    out.push({ key: 'current', outfit: normOutfit(HG.look ? HG.look.current() : null), label: t('photo.look.current') });
    var looks = (HG.save && HG.save.get('dressUp.looks', [])) || [];
    if (!Array.isArray(looks)) looks = [];
    var n = 0;
    for (var i = looks.length - 1; i >= 0 && n < 12; i--) {
      var e = looks[i];
      if (!e || typeof e !== 'object') continue;
      var of = e.outfit || e.look || e;
      if (!of || typeof of !== 'object' || !Object.keys(of).length) continue;
      out.push({ key: 'saved:' + i, outfit: normOutfit(of),
                 label: (typeof e.name === 'string' && e.name.trim()) ? e.name.trim().slice(0, 20) : t('photo.look.saved', { n: i + 1 }) });
      n++;
    }
    return out;
  }
  function pickLook(entry) {
    S.lookSrc = entry.key;
    S.outfit = entry.outfit;
    var bgId = S.outfit.background;
    if (S.maxStep < 2 && bgId && get('background', bgId) && owned('background', bgId) && photoBgs().some(function (b) { return b.id === bgId; })) S.bg = bgId;
    sfx('click');
    changedBase();
    markPressed(R.body, 'look:' + entry.key);
    announce(t('photo.chosen', { name: entry.label }));
  }
  function pickPose(id) {
    S.pose = id;
    sfx('click'); changedBase();
    markPressed(R.body, 'pose:' + id);
    var isLook = poseDef().type !== 'image';
    if (R.faceSet) R.faceSet.disabled = !isLook;
    if (R.faceNote) R.faceNote.hidden = isLook;
    announce(t('photo.chosen', { name: name('pose', id) }));
  }
  function pickBg(id) {
    S.bg = id;
    sfx('click'); changedBase();
    markPressed(R.body, 'bg:' + id);
    announce(t('photo.chosen', { name: name('background', id) }));
  }
  function pickFrame(id) {
    if (S.frame === id) return;
    S.frame = id;
    S.sel = null;
    var L = curL();
    ensureDoodle(L);
    if (S.text.str) {                                   // keep text readable on the new layout
      S.text.x = clamp(S.text.x, 0.05, 0.95); S.text.y = clamp(S.text.y, 0.03, 0.97);
    }
    sfx('click'); changedBase();
    fitSize.L = '';
    markPressed(R.body, 'frame:' + id);
    renderTools();
    if (R.fourNote) R.fourNote.hidden = L.type !== '4cut';
    announce(t('photo.chosen', { name: name('frame', id) }));
  }

  /* ═══════════ 18. Locked items (hint or fixed H-POINT price) ═══════════ */
  function tryPick(kind, id, apply) {
    if (owned(kind, id)) { apply(); return; }
    openLock(kind, id, apply);
  }
  function openLock(kind, id, apply) {
    var st = status(kind, id), nm = name(kind, id), hp = (HG.save && HG.save.data && HG.save.data.hpoint) || 0;
    sfx('popup');
    var info = [h('p', { class: 'pb-lock__name' }, nm)];
    if (st.type === 'hpoint') {
      info.push(h('p', { class: 'pb-lock__how' }, t('unlock.hpoint', { cost: fmt(st.cost) })));
      info.push(h('p', { class: 'pb-lock__wallet' }, t('photo.lock.wallet', { n: fmt(hp) })));
      if (!st.affordable) info.push(h('p', { class: 'pb-lock__need' }, t('photo.lock.need', { n: fmt(Math.max(0, st.cost - hp)) })));
      info.push(h('p', { class: 'pb-lock__note' }, t('photo.lock.notMoney')));
    } else {
      info.push(h('p', { class: 'pb-lock__label' }, t('unlock.howTo')));
      info.push(h('p', { class: 'pb-lock__how' }, t(st.hintKey || 'hint.default')));
    }
    var body = h('div', { class: 'pb-lock' }, [
      h('div', { class: 'pb-lock__icon hg-locked' }, HG.ui.itemIcon(kind, id, { alt: '', lazy: false })),
      h('div', { class: 'pb-lock__info' }, info)
    ]);
    var buttons = [{ labelKey: 'common.close', primary: st.type !== 'hpoint' || !st.affordable }];
    if (st.type === 'hpoint' && st.affordable) {
      buttons = [{ labelKey: 'common.cancel' },
        { label: t('photo.lock.exchange', { cost: fmt(st.cost) }), primary: true, onClick: function () { doBuy(kind, id, apply); } }];
    }
    HG.ui.modal({ title: t('photo.lock.title'), body: body, buttons: buttons, className: 'pb-lock-modal' });
  }
  function doBuy(kind, id, apply) {
    var r = HG.unlocks.buy(kind, id);
    if (r && r.ok) {
      HG.ui.popup({ type: 'unlock', title: t('popup.unlock.title'), text: name(kind, id) + '\n' + t('hpoint.spent', { n: fmt(r.cost) }), kind: kind, id: id });
      rerenderPanel();
      if (apply) apply();
    } else if (r && r.reason === 'notEnough') { sfx('error'); toast(t('hpoint.notEnough')); }
    else if (r && r.reason === 'owned') { toast(t('hpoint.owned')); if (apply) apply(); }
    else { sfx('error'); toast(t('photo.lock.failed')); }
  }

  /* ═══════════ 19. Print + export ═══════════ */
  function countdown() {
    return new Promise(function (resolve) {
      var el = R.count, n = 3;
      el.hidden = false;
      announce(t('photo.save.smile'));
      function step() {
        if (n === 0) {
          el.textContent = t('photo.save.cheese');
          el.classList.remove('is-pop'); void el.offsetWidth; el.classList.add('is-pop');
          setTimeout(function () { el.hidden = true; el.textContent = ''; resolve(); }, 420);
          return;
        }
        el.textContent = String(n);
        el.classList.remove('is-pop'); void el.offsetWidth; el.classList.add('is-pop');
        sfx('countdown');
        n--;
        setTimeout(step, 560);
      }
      step();
    });
  }
  function flash() {
    if (rm() || !R.flash) return;
    R.flash.classList.remove('is-on'); void R.flash.offsetWidth; R.flash.classList.add('is-on');
    setTimeout(function () { R.flash.classList.remove('is-on'); }, 520);
  }
  function progress(ms) {
    var box = R.print, fill = R.printFill, pct = R.printPct;
    box.hidden = false;
    var segs = 20, t0 = nowMs();
    return new Promise(function (resolve) {
      function stepP() {
        var p = clamp((nowMs() - t0) / ms, 0, 1);
        var n = Math.floor(p * segs);
        fill.style.width = (n / segs * 100) + '%';
        pct.textContent = Math.round(p * 100) + '%';
        if (p >= 1) { resolve(); return; }
        setTimeout(stepP, 70);
      }
      stepP();
    });
  }
  function hidePrint() { if (R.print) R.print.hidden = true; if (R.count) { R.count.hidden = true; R.count.textContent = ''; } }

  function exportCanvas() {
    var L = curL(), cv = doc.createElement('canvas');
    cv.width = L.W; cv.height = L.H;
    var ctx = cv.getContext('2d');
    compose(ctx, L, 1, false, 0);
    return cv;
  }
  function toBlob(cv) {
    return new Promise(function (resolve, reject) {
      try {
        if (cv.toBlob) {
          cv.toBlob(function (b) { if (b) resolve(b); else reject(new Error('empty')); }, 'image/png');
        } else {
          var url = cv.toDataURL('image/png');
          var bin = atob(url.split(',')[1]), arr = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          resolve(new Blob([arr], { type: 'image/png' }));
        }
      } catch (e) { reject(e); }
    });
  }
  function thumbOf(cv) {
    var k = Math.min(1, 240 / Math.max(cv.width, cv.height));
    var tc = doc.createElement('canvas');
    tc.width = Math.max(1, Math.round(cv.width * k)); tc.height = Math.max(1, Math.round(cv.height * k));
    var x = tc.getContext('2d');
    x.fillStyle = C.white; x.fillRect(0, 0, tc.width, tc.height);
    x.imageSmoothingEnabled = true;
    try { x.imageSmoothingQuality = 'high'; } catch (e) { /* ignore */ }
    x.drawImage(cv, 0, 0, tc.width, tc.height);
    return tc.toDataURL('image/jpeg', 0.8);
  }
  function isTaint(e) {
    return (e && (e.name === 'SecurityError' || e.code === 18)) || (win.location && win.location.protocol === 'file:');
  }

  function print() {
    if (S.printing) return;
    if (S.result && S.result.rev === S.rev) {
      toast(t('photo.save.same'));
      var a = R.body && R.body.querySelector('.pb-result__download');
      if (a) a.focus();
      return;
    }
    S.printing = true; S.error = null; S.sel = null;
    if (drawing) endStroke();
    renderTools(); renderPanel(); requestDraw(); updateLock();
    var pBase = renderBase();
    countdown().then(function () {
      sfx('shutter');
      flash();
      return Promise.all([pBase, progress(rm() ? 700 : 1600)]);
    }).then(function () {
      var cv = exportCanvas();
      return toBlob(cv).then(function (blob) { return { cv: cv, blob: blob }; });
    }).then(function (out) {
      var thumb = null;
      try { thumb = thumbOf(out.cv); } catch (e) { thumb = null; }
      if (S.result && S.result.url) { try { (win.URL || win.webkitURL).revokeObjectURL(S.result.url); } catch (e) { /* ignore */ } }
      var url = (win.URL || win.webkitURL).createObjectURL(out.blob);
      var n = S.stickers.length;
      if (thumb) {
        HG.save.update(function (d) {
          if (!d.photoBooth || typeof d.photoBooth !== 'object') d.photoBooth = { transferLook: null, count: 0 };
          d.photoBooth.lastPhoto = thumb;
          d.photoBooth.count = (Number(d.photoBooth.count) || 0) + 1;
        });
      } else {
        HG.save.update(function (d) { d.photoBooth.count = (Number(d.photoBooth.count) || 0) + 1; });
      }
      var res = HG.unlocks.finishGame('photo-booth', {
        score: 0,
        stats: { inc: { 'photo.created': 1, 'photo.stickersPlaced': n } },
        flags: ['photo.exported']
      }) || { earned: 0, unlocked: [] };
      S.result = { url: url, file: fileName(), rev: S.rev, earned: res.earned || 0, unlocked: res.unlocked || [], w: out.cv.width, h: out.cv.height, fresh: true };
      sfx('success');
      announce(t('photo.save.done', { n: fmt(S.result.earned) }));
    }).catch(function (e) {
      if (win.console) console.warn('[photo-booth] export failed', e);
      S.error = isTaint(e) ? 'taint' : 'error';
      sfx('error');
      announce(t(S.error === 'taint' ? 'photo.save.taint' : 'photo.save.error'));
    }).then(function () {
      S.printing = false;
      hidePrint();
      updateLock();
      renderPanel();
      renderTools();
      requestDraw();
      var target = R.body && (R.body.querySelector('.pb-result__download') || R.body.querySelector('.pb-msg--error'));
      if (target) { try { target.focus({ preventScroll: false }); } catch (e) { /* ignore */ } }
      if (S.result && S.result.fresh && R.body) {
        var ph = R.body.querySelector('.pb-result__photo');
        if (ph) { var r = ph.getBoundingClientRect(); HG.ui.sparkleBurst(r.left + r.width / 2, r.top + 20, 14); }
        S.result.fresh = false;
      }
    });
  }
  function updateLock() {
    if (R.shell) R.shell.classList.toggle('is-printing', S.printing);
    if (R.steps) Array.prototype.forEach.call(R.steps.querySelectorAll('button'), function (b) { b.disabled = S.printing; });
    if (R.prev) R.prev.disabled = S.printing || S.step === 0;
    if (R.next) R.next.disabled = S.printing || S.step === STEPS.length - 1;
  }
  function newPhoto() {
    function go() {
      S.stickers = []; S.strokes = []; replayDoodle();
      S.text.str = ''; S.text.placed = false; S.sel = null; drawing = null;
      S.error = null;
      bump();
      if (R.textInput) R.textInput.value = '';
      goStep(0);
      requestDraw();
      announce(t('photo.new.done'));
    }
    var saved = S.result && S.result.rev === S.rev;
    if (!saved && (S.stickers.length || S.strokes.length || S.text.str)) {
      HG.ui.confirm({ titleKey: 'photo.new.title', textKey: 'photo.new.text', okKey: 'photo.new.ok' }).then(function (yes) { if (yes) go(); });
    } else go();
  }

  /* ═══════════ 20. UI: step bar, panel, tools ═══════════ */
  function markPressed(root, key) {
    if (!root) return;
    var prefix = key.split(':')[0] + ':';
    Array.prototype.forEach.call(root.querySelectorAll('[data-k^="' + prefix + '"]'), function (el) {
      if (el.hasAttribute('aria-pressed')) el.setAttribute('aria-pressed', String(el.getAttribute('data-k') === key));
    });
  }
  function button(cls, kids, attrs, onClick) {
    var a = { type: 'button', class: cls };
    if (attrs) for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) a[k] = attrs[k];
    var b = h('button', a, kids);
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }

  function buildSteps() {
    R.steps.textContent = '';
    R.tabs = STEPS.map(function (key, i) {
      var tab = button('pb-step', [
        h('span', { class: 'pb-step__num', 'aria-hidden': 'true' }, String(i + 1)),
        h('span', { class: 'pb-step__label', i18n: 'photo.step.' + key })
      ], { role: 'tab', id: 'pb-tab-' + key, 'aria-controls': 'pb-panel', 'aria-selected': 'false', tabindex: '-1', 'data-sfx-hover': 'hover' }, function () {
        if (S.step !== i) { sfx('click'); goStep(i); }
      });
      tab.addEventListener('keydown', function (e) {
        var j = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % STEPS.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + STEPS.length) % STEPS.length;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = STEPS.length - 1;
        if (j == null) return;
        e.preventDefault();
        sfx('click');
        goStep(j, true);
      });
      R.steps.appendChild(tab);
      return tab;
    });
    syncSteps();
  }
  function syncSteps() {
    R.tabs.forEach(function (tab, i) {
      var on = i === S.step;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      tab.classList.toggle('is-done', i < S.step || (i <= S.maxStep && i !== S.step));
    });
    var active = R.tabs[S.step];
    R.panel.setAttribute('aria-labelledby', active.id);
    var sc = R.steps;
    if (sc.scrollWidth > sc.clientWidth + 2) {
      var left = active.offsetLeft - (sc.clientWidth - active.offsetWidth) / 2;
      try { sc.scrollTo({ left: Math.max(0, left), behavior: rm() ? 'auto' : 'smooth' }); } catch (e) { sc.scrollLeft = Math.max(0, left); }
    }
  }

  function goStep(i, focusTab) {
    i = clamp(i, 0, STEPS.length - 1);
    if (S.printing) return;
    if (drawing) endStroke();
    drag = null; ptrs = {};
    S.step = i;
    S.maxStep = Math.max(S.maxStep, i);
    var key = STEPS[i];
    if (key === 'text') S.sel = S.text.str ? { kind: 'text' } : null;
    else if (key !== 'stickers') S.sel = null;
    else if (S.sel && S.sel.kind === 'text') S.sel = null;
    syncSteps();
    renderPanel();
    renderTools();
    syncInteractive();
    canvasLabel();
    requestDraw();
    if (focusTab) R.tabs[i].focus();
  }
  function syncInteractive() {
    var key = STEPS[S.step];
    R.canvas.classList.toggle('is-interactive', interactive());
    R.canvas.classList.toggle('is-doodle', key === 'doodle');
    R.canvas.classList.toggle('is-objects', objStep());
    R.canvas.tabIndex = interactive() ? 0 : -1;
  }

  function rerenderPanel() {
    if (!R.body) return;
    var a = doc.activeElement, k = a && R.body.contains(a) ? a.getAttribute('data-k') : null;
    var st = R.body.scrollTop;
    var chips = R.body.querySelector('.pb-chips'), cl = chips ? chips.scrollLeft : 0;
    renderPanel();
    R.body.scrollTop = st;
    var chips2 = R.body.querySelector('.pb-chips');
    if (chips2) chips2.scrollLeft = cl;
    if (k) {
      var el = R.body.querySelector('[data-k="' + k.replace(/"/g, '') + '"]');
      if (el) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
    }
  }

  function renderPanel() {
    var key = STEPS[S.step];
    R.title.textContent = t('photo.stepTitle', { n: S.step + 1, title: t('photo.title.' + key) });
    R.titleIcon.textContent = STEP_ICON[key];
    R.body.textContent = '';
    R.faceSet = R.faceNote = R.fourNote = R.textInput = R.textCount = R.countEl = R.undoBtn = null;
    var fn = { look: buildLook, pose: buildPose, bg: buildBg, frame: buildFrame, stickers: buildStickers,
               doodle: buildDoodle, text: buildText, save: buildSave }[key];
    try { fn(R.body); } catch (e) { log(e); }
    R.pos.textContent = t('photo.nav.pos', { n: S.step + 1, total: STEPS.length });
    R.prev.disabled = S.step === 0 || S.printing;
    var last = S.step === STEPS.length - 1;
    R.next.classList.toggle('is-gone', last);
    R.next.disabled = S.printing || last;
    if (last) R.next.setAttribute('aria-hidden', 'true'); else R.next.removeAttribute('aria-hidden');
    R.nextLabel.textContent = S.step === STEPS.length - 2 ? t('photo.nav.toSave') : t('photo.nav.next');
  }

  function lead(key, params) { return h('p', { class: 'pb-lead' }, t(key, params)); }
  function note(key, params, cls) { return h('p', { class: 'pb-note' + (cls ? ' ' + cls : '') }, t(key, params)); }
  function legend(key) { return h('legend', { class: 'pb-opt__legend' }, t(key)); }

  function priceTag(kind, id) {
    var st = status(kind, id);
    if (st.owned) return null;
    if (st.type === 'hpoint') return h('span', { class: 'pb-card__price' + (st.affordable ? ' is-ok' : '') }, [h('span', { class: 'pb-coin', 'aria-hidden': 'true' }, 'H'), fmt(st.cost)]);
    return h('span', { class: 'pb-card__price pb-card__price--play' }, t('photo.lock.play'));
  }
  function lockLabel(kind, id) {
    var st = status(kind, id);
    if (st.owned) return '';
    if (st.type === 'hpoint') return t('photo.lock.priceLabel', { cost: fmt(st.cost) });
    return t('photo.lock.hintLabel', { hint: t(st.hintKey || 'hint.default') });
  }
  function itemCard(kind, id, key, selected, media, onPick, extra) {
    var st = status(kind, id), nm = name(kind, id);
    var lbl = nm + (st.owned ? '' : ' — ' + lockLabel(kind, id));
    var card = button('pb-card' + (st.owned ? '' : ' is-locked'), [
      h('span', { class: 'pb-card__img' + (st.owned ? '' : ' hg-locked') }, media),
      h('span', { class: 'pb-card__name' }, nm),
      extra || null,
      priceTag(kind, id)
    ], { 'data-k': key, 'aria-pressed': String(!!selected), 'aria-label': lbl, title: st.owned ? nm : lockLabel(kind, id), 'data-sfx-hover': 'hover' },
    function () { tryPick(kind, id, onPick); });
    return card;
  }

  /* ── Step 1: LOOK ── */
  var thumbCache = {};
  function lookThumb(outfit) {
    var wrap = h('span', { class: 'pb-card__img pb-card__img--look', 'aria-hidden': 'true' }, h('span', { class: 'pb-card__emoji' }, '👕'));
    if (!HG.look) return wrap;
    var key = JSON.stringify(outfit);
    var CR = HG.look.CROPS;
    if (!thumbCache[key]) thumbCache[key] = HG.look.render(outfit, { w: 180, h: 240, crop: fitCrop(CR.upper, 0.75, false) }).catch(function () { return null; });
    thumbCache[key].then(function (src) {
      if (!src) return;
      var c = doc.createElement('canvas');
      c.width = src.width; c.height = src.height;
      c.getContext('2d').drawImage(src, 0, 0);
      c.className = 'pb-card__canvas';
      wrap.appendChild(c);
    });
    return wrap;
  }
  function buildLook(body) {
    body.appendChild(lead('photo.look.lead'));
    var grid = h('div', { class: 'pb-grid pb-grid--looks' });
    lookEntries().forEach(function (e) {
      var card = button('pb-card pb-card--look', [
        lookThumb(e.outfit),
        h('span', { class: 'pb-card__name' }, e.label),
        e.badge ? h('span', { class: 'hg-badge hg-badge--new pb-card__badge' }, t('common.new')) : null
      ], { 'data-k': 'look:' + e.key, 'aria-pressed': String(S.lookSrc === e.key), 'data-sfx-hover': 'hover' }, function () { pickLook(e); });
      grid.appendChild(card);
    });
    body.appendChild(grid);
    var looks = HG.save ? HG.save.get('dressUp.looks', []) : [];
    if (!Array.isArray(looks) || !looks.length) body.appendChild(note('photo.look.noSaved'));
    body.appendChild(h('p', { class: 'pb-note' }, h('a', { href: 'dress-up.html', class: 'pb-link', 'data-sfx': 'click' }, t('photo.look.toDressUp'))));
  }

  /* ── Step 2: POSE ── */
  function segRow(group, options, current, onPick) {
    var row = h('div', { class: 'hg-seg pb-seg' });
    options.forEach(function (o) {
      var id = 'pb-' + group + '-' + o.value;
      var input = h('input', { type: 'radio', class: 'hg-seg__input', name: 'pb-' + group, id: id, value: o.value, 'data-k': group + ':' + o.value });
      input.checked = o.value === current;
      input.addEventListener('change', function () { if (input.checked) onPick(o.value); });
      row.appendChild(input);
      row.appendChild(h('label', { class: 'hg-seg__btn', for: id }, o.label));
    });
    return row;
  }
  function buildPose(body) {
    body.appendChild(lead('photo.pose.lead'));
    var grid = h('div', { class: 'pb-grid pb-grid--poses' });
    all('pose').forEach(function (p) {
      var media = p.type === 'image' ? HG.ui.itemIcon('pose', p.id, { alt: '' }) : lookThumb(S.outfit);
      grid.appendChild(itemCard('pose', p.id, 'pose:' + p.id, S.pose === p.id, media, function () { pickPose(p.id); }));
    });
    body.appendChild(grid);

    var fr = h('fieldset', { class: 'pb-opt' }, [legend('photo.pose.framing'),
      segRow('crop', CROPS.map(function (c) { return { value: c, label: t('photo.crop.' + c) }; }), S.crop, function (v) {
        S.crop = v; sfx('click'); changedBase();
      })]);
    body.appendChild(fr);

    var isLook = poseDef().type !== 'image';
    var exprs = (HG.look && HG.look.EXPRS) || ['neutral', 'smile', 'big'];
    R.faceSet = h('fieldset', { class: 'pb-opt pb-opt--face' }, [legend('photo.pose.face'),
      segRow('expr', exprs.map(function (x) { return { value: x, label: t('photo.expr.' + x) }; }), S.expr, function (v) {
        S.expr = v; sfx('click'); changedBase();
      })]);
    R.faceSet.disabled = !isLook;
    body.appendChild(R.faceSet);
    R.faceNote = note('photo.pose.faceNote');
    R.faceNote.hidden = isLook;
    body.appendChild(R.faceNote);

    var mirror = button('hg-btn hg-btn--blue pb-mirror', [h('span', { 'aria-hidden': 'true' }, '⇆ '), t('photo.pose.mirror')],
      { 'aria-pressed': String(S.mirror), 'data-k': 'mirror' }, function () {
        S.mirror = !S.mirror; mirror.setAttribute('aria-pressed', String(S.mirror)); sfx('whoosh'); changedBase();
      });
    body.appendChild(h('div', { class: 'pb-opt pb-opt--row' }, mirror));
    R.fourNote = note('photo.pose.fourCut');
    R.fourNote.hidden = curL().type !== '4cut';
    body.appendChild(R.fourNote);
  }

  /* ── Step 3: BACKGROUND ── */
  function buildBg(body) {
    body.appendChild(lead('photo.bg.lead'));
    var grid = h('div', { class: 'pb-grid pb-grid--bgs' });
    photoBgs().forEach(function (b) {
      grid.appendChild(itemCard('background', b.id, 'bg:' + b.id, S.bg === b.id, HG.ui.itemIcon('background', b.id, { alt: '' }), function () { pickBg(b.id); }));
    });
    body.appendChild(grid);
  }

  /* ── Step 4: FRAME ── */
  var frameThumbs = {};
  function frameThumb(fr) {
    if (!frameThumbs[fr.id]) {
      var L = layoutOf(fr), box = 96, d = 2;
      var k = Math.min(box / L.W, box / L.H);
      var cv = doc.createElement('canvas');
      cv.width = Math.round(L.W * k * d); cv.height = Math.round(L.H * k * d);
      var ctx = cv.getContext('2d');
      ctx.scale(k * d, k * d);
      DK = k * d;
      drawPlaceholder(ctx, L);
      try { frameThumbs[fr.id] = cv.toDataURL('image/png'); } catch (e) { frameThumbs[fr.id] = ''; }
    }
    var img = h('img', { class: 'pb-card__frame', alt: '', src: frameThumbs[fr.id] || '', draggable: 'false' });
    return img;
  }
  function buildFrame(body) {
    body.appendChild(lead('photo.frame.lead'));
    var grid = h('div', { class: 'pb-grid pb-grid--frames' });
    all('frame').forEach(function (fr) {
      var L = layoutOf(fr);
      grid.appendChild(itemCard('frame', fr.id, 'frame:' + fr.id, S.frame === fr.id, frameThumb(fr), function () { pickFrame(fr.id); },
        h('span', { class: 'pb-card__size' }, L.W + '×' + L.H)));
    });
    body.appendChild(grid);
  }

  /* ── Step 5: STICKERS ── */
  function buildStickers(body) {
    body.appendChild(lead('photo.sticker.lead'));
    var cats = (HG.data && HG.data.stickerCats) || [];
    var list = all('sticker');
    if (!S.cat || cats.indexOf(S.cat) < 0) S.cat = cats[0] || null;
    var chips = h('div', { class: 'pb-chips', role: 'group', 'aria-label': t('photo.sticker.cats') });
    var grid = h('div', { class: 'pb-stickers', role: 'group', 'aria-label': t('photo.sticker.palette') });
    function fillGrid() {
      grid.textContent = '';
      list.filter(function (s) { return s.cat === S.cat; }).forEach(function (s) {
        var st = status('sticker', s.id), nm = name('sticker', s.id);
        var b = button('hg-sticker-btn pb-sticker' + (st.owned ? '' : ' hg-locked'), [
          HG.ui.itemIcon('sticker', s.id, { alt: '' }),
          st.owned ? null : priceTag('sticker', s.id)
        ], { 'data-k': 'st:' + s.id, 'aria-label': st.owned ? t('photo.sticker.add', { name: nm }) : nm + ' — ' + lockLabel('sticker', s.id),
             title: st.owned ? nm : lockLabel('sticker', s.id) }, function () {
          tryPick('sticker', s.id, function () { addSticker(s.id); });
        });
        grid.appendChild(b);
      });
    }
    cats.forEach(function (c) {
      var have = list.filter(function (s) { return s.cat === c && owned('sticker', s.id); }).length;
      var tot = list.filter(function (s) { return s.cat === c; }).length;
      if (!tot) return;
      var chip = button('pb-chip', [t('stickerCat.' + c), h('small', { class: 'pb-chip__n' }, have + '/' + tot)],
        { 'data-k': 'cat:' + c, 'aria-pressed': String(S.cat === c) }, function () {
          S.cat = c; sfx('click'); markPressed(chips, 'cat:' + c); fillGrid();
        });
      chips.appendChild(chip);
    });
    fillGrid();
    body.appendChild(chips);
    body.appendChild(grid);
    R.countEl = h('span', { class: 'pb-count-label', 'aria-live': 'off' });
    body.appendChild(h('div', { class: 'pb-row' }, [
      R.countEl,
      button('hg-btn hg-btn--small pb-clear', t('photo.sticker.clear'), { 'data-k': 'st-clear' }, clearStickers)
    ]));
    updateCount();
    body.appendChild(note('photo.sticker.howto'));
  }
  function updateCount() { if (R.countEl) R.countEl.textContent = t('photo.sticker.count', { n: S.stickers.length }); canvasLabel(); }

  /* ── Step 6: DOODLE ── */
  function swatch(id, pressed, extraCls, label, onPick, key) {
    var b = button('pb-swatch' + (extraCls ? ' ' + extraCls : ''), h('span', { class: 'hg-sr-only' }, label),
      { 'aria-pressed': String(pressed), 'data-k': key, title: label }, onPick);
    b.style.setProperty('--sw', 'var(' + penToken(id) + ')');
    return b;
  }
  function buildDoodle(body) {
    body.appendChild(lead('photo.doodle.lead'));
    var pens = h('div', { class: 'pb-swatches' });
    function pick(tool, color) {
      S.pen.tool = tool; if (color) S.pen.color = color;
      sfx('click');
      var k = tool === 'eraser' ? 'pen:eraser' : tool === 'glow' ? 'pen:glow' : 'pen:' + S.pen.color;
      markPressed(body, k);
      if (tool === 'glow') { R.glowBtn.style.setProperty('--sw', 'var(' + penToken(S.pen.color) + ')'); }
      renderTools();
    }
    PENS.forEach(function (p) {
      pens.appendChild(swatch(p.id, S.pen.tool === 'pen' && S.pen.color === p.id, '', t('photo.color.' + p.id), function () { pick('pen', p.id); }, 'pen:' + p.id));
    });
    R.glowBtn = button('pb-swatch pb-swatch--glow', [h('span', { 'aria-hidden': 'true', class: 'pb-swatch__txt' }, t('photo.doodle.glow'))],
      { 'aria-pressed': String(S.pen.tool === 'glow'), 'data-k': 'pen:glow', title: t('photo.doodle.glowHint') }, function () { pick('glow'); });
    R.glowBtn.setAttribute('aria-label', t('photo.doodle.glowHint'));
    R.glowBtn.style.setProperty('--sw', 'var(' + penToken(S.pen.color) + ')');
    pens.appendChild(R.glowBtn);
    body.appendChild(h('fieldset', { class: 'pb-opt' }, [legend('photo.doodle.pens'), pens]));

    body.appendChild(h('fieldset', { class: 'pb-opt' }, [legend('photo.doodle.size'),
      segRow('size', [0, 1, 2].map(function (i) { return { value: String(i), label: t('photo.doodle.size' + 'SML'[i]) }; }), String(S.pen.size), function (v) {
        S.pen.size = Number(v) || 0; sfx('click');
      })]));

    var eraser = button('hg-btn hg-btn--lavender pb-eraser', [h('span', { 'aria-hidden': 'true' }, '🧽 '), t('photo.doodle.eraser')],
      { 'aria-pressed': String(S.pen.tool === 'eraser'), 'data-k': 'pen:eraser' }, function () {
        if (S.pen.tool === 'eraser') pick('pen'); else pick('eraser');
      });
    R.undoBtn = button('hg-btn hg-btn--blue', [h('span', { 'aria-hidden': 'true' }, '↶ '), t('photo.doodle.undo')], { 'data-k': 'undo' }, undo);
    R.clearBtn = button('hg-btn hg-btn--small', t('photo.doodle.clear'), { 'data-k': 'doodle-clear' }, clearDoodle);
    body.appendChild(h('div', { class: 'pb-row pb-row--tools' }, [eraser, R.undoBtn, R.clearBtn]));
    updateDoodleButtons();
    body.appendChild(note('photo.doodle.howto'));
  }
  function updateDoodleButtons() {
    if (R.undoBtn) R.undoBtn.disabled = !S.strokes.length;
    if (R.clearBtn) R.clearBtn.disabled = !S.strokes.length;
  }

  /* ── Step 7: TEXT / DATE ── */
  function buildText(body) {
    body.appendChild(lead('photo.text.lead'));
    var inp = R.textInput = h('input', { type: 'text', id: 'pb-text', class: 'pb-input', maxlength: String(MAX_TEXT * 2), autocomplete: 'off',
      spellcheck: 'false', placeholder: t('photo.text.placeholder'), 'data-k': 'text-input', 'aria-describedby': 'pb-text-count' });
    inp.value = S.text.str;
    var composing = false;
    inp.addEventListener('compositionstart', function () { composing = true; });
    inp.addEventListener('compositionend', function () { composing = false; commit(); });
    inp.addEventListener('input', function () { if (!composing) commit(); });
    function commit() {
      var v = chars(inp.value).slice(0, MAX_TEXT).join('');
      if (v !== inp.value) inp.value = v;
      setText(v);
    }
    R.textCount = h('span', { class: 'pb-input__count', id: 'pb-text-count' });
    body.appendChild(h('div', { class: 'pb-opt' }, [
      h('label', { class: 'pb-opt__legend', for: 'pb-text' }, t('photo.text.label')),
      h('div', { class: 'pb-input-row' }, [inp, R.textCount])
    ]));
    updateTextCount();

    var sw = h('div', { class: 'pb-swatches' });
    TEXT_COLORS.forEach(function (c) {
      sw.appendChild(swatch(c.id, S.text.color === c.id, c.id === 'white' ? 'pb-swatch--white' : '', t('photo.color.' + c.id), function () {
        S.text.color = c.id; sfx('click'); markPressed(sw, 'tc:' + c.id); bump(); requestDraw();
      }, 'tc:' + c.id));
    });
    body.appendChild(h('fieldset', { class: 'pb-opt' }, [legend('photo.text.color'), sw]));

    body.appendChild(h('fieldset', { class: 'pb-opt' }, [legend('photo.text.date'),
      segRow('date', ['off', 'film', 'cute'].map(function (v) { return { value: v, label: t('photo.text.date' + v.charAt(0).toUpperCase() + v.slice(1)) }; }), S.date, function (v) {
        S.date = v; sfx('click'); bump(); requestDraw();
      }),
      h('p', { class: 'pb-note pb-date-preview' }, [h('span', { class: 'pb-date-chip', 'aria-hidden': 'true' }, dateStr()), ' ', t('photo.text.dateNote')])
    ]));
    body.appendChild(note('photo.text.howto'));
  }
  function updateTextCount() {
    if (!R.textCount) return;
    R.textCount.textContent = t('photo.text.count', { n: chars(S.text.str).length, max: MAX_TEXT });
  }

  /* ── Step 8: SAVE ── */
  function lookLabel() {
    var list = lookEntries();
    for (var i = 0; i < list.length; i++) if (list[i].key === S.lookSrc) return list[i].label;
    return t('photo.look.current');
  }
  function buildSave(body) {
    var L = curL();
    body.appendChild(lead('photo.save.lead'));
    var rows = [
      ['photo.summary.look', poseDef().type === 'image' ? '—' : lookLabel()],
      ['photo.summary.pose', name('pose', S.pose)],
      ['photo.summary.bg', name('background', S.bg)],
      ['photo.summary.frame', name('frame', S.frame)],
      ['photo.summary.stickers', String(S.stickers.length)],
      ['photo.summary.size', L.W + '×' + L.H + ' PNG']
    ];
    body.appendChild(h('dl', { class: 'pb-summary' }, rows.map(function (r) {
      return h('div', { class: 'pb-summary__row' }, [h('dt', null, t(r[0])), h('dd', null, r[1])]);
    })));
    var same = S.result && S.result.rev === S.rev;
    var printBtn = button('hg-btn hg-btn--pink hg-btn--big pb-print-btn', [
      h('span', { class: 'pb-print-btn__icon', 'aria-hidden': 'true' }, '📸'),
      h('span', null, S.printing ? t('photo.save.printing') : t(same ? 'photo.save.printAgain' : 'photo.save.print'))
    ], { 'data-k': 'print', disabled: S.printing }, print);
    body.appendChild(h('div', { class: 'pb-print-row' }, printBtn));

    if (S.error) {
      body.appendChild(h('p', { class: 'pb-msg pb-msg--error', role: 'alert', tabindex: '-1' }, t(S.error === 'taint' ? 'photo.save.taint' : 'photo.save.error')));
    }
    if (S.result) body.appendChild(resultNode(same));
    body.appendChild(note('photo.save.note'));
  }
  function resultNode(same) {
    var r = S.result;
    var photo = h('div', { class: 'pb-result__photo' + (r.fresh && !rm() ? ' is-new' : '') },
      h('img', { src: r.url, alt: t('photo.save.alt'), class: 'pb-result__img', draggable: 'true' }));
    var unl = null;
    if (r.unlocked && r.unlocked.length) {
      unl = h('div', { class: 'pb-result__unlocks' }, [h('p', { class: 'pb-result__unlabel' }, t('photo.save.unlocked'))].concat(
        r.unlocked.slice(0, 8).map(function (u) {
          return h('span', { class: 'pb-result__unlock', title: name(u.kind, u.id) }, HG.ui.itemIcon(u.kind, u.id, { alt: name(u.kind, u.id), lazy: false }));
        })));
    }
    var dl = h('a', { class: 'hg-btn hg-btn--pink pb-result__download', href: r.url, download: r.file, 'data-k': 'download' },
      [h('span', { 'aria-hidden': 'true' }, '⬇ '), t('photo.save.download')]);
    dl.addEventListener('click', function () { sfx('coin'); toast(t('photo.save.downloading')); });
    return h('div', { class: 'pb-result', role: 'group', 'aria-label': t('photo.save.title') }, [
      h('p', { class: 'pb-result__title' }, t('photo.save.title')),
      photo,
      r.earned ? h('p', { class: 'pb-result__earned' }, t('photo.save.earned', { n: fmt(r.earned) })) : null,
      unl,
      h('p', { class: 'pb-result__file' }, r.file + ' · ' + r.w + '×' + r.h),
      h('div', { class: 'pb-result__actions' }, [
        dl,
        button('hg-btn hg-btn--mint', [h('span', { 'aria-hidden': 'true' }, '✏️ '), t('photo.save.edit')], { 'data-k': 'edit' }, function () { sfx('click'); goStep(4); }),
        button('hg-btn hg-btn--blue', [h('span', { 'aria-hidden': 'true' }, '✨ '), t('photo.save.newPhoto')], { 'data-k': 'new' }, newPhoto)
      ]),
      h('p', { class: 'pb-note' }, t('photo.save.mobileTip'))
    ]);
  }

  /* ── Tools under the canvas ── */
  function toolBtn(glyph, labelKey, onClick, extra) {
    return button('pb-tool' + (extra ? ' ' + extra : ''), [
      h('span', { class: 'pb-tool__glyph', 'aria-hidden': 'true' }, glyph),
      h('span', { class: 'pb-tool__label' }, t(labelKey))
    ], { title: t(labelKey), 'aria-label': t(labelKey) }, onClick);
  }
  function renderTools() {
    var el = R.tools;
    if (!el) return;
    el.textContent = '';
    var key = STEPS[S.step], o = objStep() ? selObj() : null;
    if (S.printing) {
      el.appendChild(h('p', { class: 'pb-tools__hint' }, t('photo.save.printing')));
      return;
    }
    if (o) {
      var isText = S.sel.kind === 'text';
      el.appendChild(h('span', { class: 'pb-tools__name' }, isText ? '🔤 ' + S.text.str : name('sticker', o.sid)));
      var g = h('div', { class: 'pb-tools__group' });
      if (!isText) {
        g.appendChild(toolBtn('⤒', 'photo.tools.forward', function () { reorder(1); }));
        g.appendChild(toolBtn('⤓', 'photo.tools.back', function () { reorder(-1); }));
      }
      g.appendChild(toolBtn('－', 'photo.tools.smaller', function () { nudge('smaller'); }));
      g.appendChild(toolBtn('＋', 'photo.tools.bigger', function () { nudge('bigger'); }));
      g.appendChild(toolBtn('⟲', 'photo.tools.rotL', function () { nudge('rotL'); }));
      g.appendChild(toolBtn('⟳', 'photo.tools.rotR', function () { nudge('rotR'); }));
      g.appendChild(toolBtn('✕', 'photo.tools.delete', removeSel, 'pb-tool--danger'));
      el.appendChild(g);
      return;
    }
    if (key === 'doodle') {
      var cur = S.pen.tool === 'eraser' ? t('photo.doodle.eraser') : S.pen.tool === 'glow' ? t('photo.doodle.glow') : t('photo.color.' + S.pen.color);
      var dot = h('span', { class: 'pb-tools__pen' + (S.pen.tool === 'eraser' ? ' is-eraser' : S.pen.tool === 'glow' ? ' is-glow' : ''), 'aria-hidden': 'true' });
      dot.style.setProperty('--sw', 'var(' + penToken(S.pen.color) + ')');
      el.appendChild(h('span', { class: 'pb-tools__name' }, [dot, cur]));
      var u = toolBtn('↶', 'photo.doodle.undo', undo);
      u.disabled = !S.strokes.length;
      el.appendChild(h('div', { class: 'pb-tools__group' }, u));
      return;
    }
    var hints = { stickers: 'photo.tools.hintStickers', text: 'photo.tools.hintText', save: 'photo.tools.hintSave' };
    el.appendChild(h('p', { class: 'pb-tools__hint' }, t(hints[key] || 'photo.tools.hintView')));
  }

  function revealCanvas() {
    if (!R.canvas) return;
    var r = R.canvas.getBoundingClientRect();
    var vh = win.innerHeight || doc.documentElement.clientHeight;
    if (r.bottom < 80 || r.top > vh - 80) {
      try { R.canvas.scrollIntoView({ block: 'nearest', behavior: rm() ? 'auto' : 'smooth' }); } catch (e) { /* ignore */ }
    }
  }

  /* ═══════════ 21. Boot ═══════════ */
  function initState() {
    var tl = HG.save ? HG.save.get('photoBooth.transferLook', null) : null;
    if (tl && typeof tl === 'object') {
      S.sent = normOutfit(tl.outfit && typeof tl.outfit === 'object' ? tl.outfit : tl);
      S.lookSrc = 'sent';
      S.outfit = S.sent;
      HG.save.set('photoBooth.transferLook', null);        // consumed: the booth owns it now
      setTimeout(function () { toast(t('photo.look.sentToast')); }, 600);
    } else {
      S.outfit = normOutfit(HG.look ? HG.look.current() : null);
    }
    var ex = S.outfit && S.outfit.expr;
    S.expr = ex && ex !== 'neutral' ? ex : 'smile';
    var bgId = S.outfit && S.outfit.background;
    if (bgId && owned('background', bgId) && photoBgs().some(function (b) { return b.id === bgId; })) S.bg = bgId;
    else if (!get('background', S.bg)) S.bg = (photoBgs()[0] || {}).id || S.bg;
    if (!get('frame', S.frame)) S.frame = (all('frame')[0] || {}).id || S.frame;
  }

  function wire() {
    var cv = R.canvas;
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('lostpointercapture', function (e) { if (e.pointerId in ptrs) onUp(e); });
    cv.addEventListener('keydown', onKey);
    cv.addEventListener('contextmenu', function (e) { if (interactive()) e.preventDefault(); });
    doc.addEventListener('keydown', function (e) {
      if (STEPS[S.step] !== 'doodle' || !(e.ctrlKey || e.metaKey) || (e.key !== 'z' && e.key !== 'Z')) return;
      var tg = e.target, tag = tg && tg.tagName;
      if (tg === cv || tag === 'INPUT' || tag === 'TEXTAREA' || (HG.ui.isModalOpen && HG.ui.isModalOpen())) return;
      e.preventDefault(); undo();
    });
    R.prev.addEventListener('click', function () { if (S.step > 0) { sfx('click'); goStep(S.step - 1); } });
    R.next.addEventListener('click', function () { if (S.step < STEPS.length - 1) { sfx('click'); goStep(S.step + 1); } });

    var onResize = function () { measureFit(); requestDraw(); };
    if (win.ResizeObserver) { new win.ResizeObserver(onResize).observe(R.fit); }
    else win.addEventListener('resize', onResize);
    win.addEventListener('orientationchange', onResize);

    doc.addEventListener('hg:lang', function () {
      rerenderPanel(); renderTools(); canvasLabel(); requestDraw();
      doc.title = t('photo.docTitle');
    });
    doc.addEventListener('hg:unlock', function () { if (!S.printing) rerenderPanel(); });
    doc.addEventListener('visibilitychange', function () { if (!doc.hidden) requestDraw(); });
    win.addEventListener('pagehide', function () {
      if (S.result && S.result.url) { try { (win.URL || win.webkitURL).revokeObjectURL(S.result.url); } catch (e) { /* ignore */ } }
    });
  }

  function start() {
    h = HG.ui.el;
    readTokens();
    R.shell = doc.getElementById('game');
    R.canvas = doc.getElementById('pb-canvas');
    R.fit = doc.getElementById('pb-fit');
    R.loading = doc.getElementById('pb-loading');
    R.count = doc.getElementById('pb-count');
    R.flash = doc.getElementById('pb-flash');
    R.print = doc.getElementById('pb-print');
    R.printFill = doc.getElementById('pb-print-fill');
    R.printPct = doc.getElementById('pb-print-pct');
    R.tools = doc.getElementById('pb-tools');
    R.steps = doc.getElementById('pb-steps');
    R.panel = doc.getElementById('pb-panel');
    R.title = doc.getElementById('pb-panel-title');
    R.titleIcon = doc.getElementById('pb-panel-icon');
    R.body = doc.getElementById('pb-panel-body');
    R.prev = doc.getElementById('pb-prev');
    R.next = doc.getElementById('pb-next');
    R.nextLabel = doc.getElementById('pb-next-label');
    R.pos = doc.getElementById('pb-pos');
    if (!R.shell || !R.canvas || !R.body) { log('photo-booth markup missing'); return; }

    HG.ui.mountGameShell(R.shell, { game: 'photo-booth', titleKey: 'games.photoBooth.title', helpKey: 'photo.help' });
    doc.title = t('photo.docTitle');

    initState();
    ensureDoodle(curL());
    buildSteps();
    wire();
    measureFit();
    goStep(0);
    renderBase();
    // warm the sticker palette of the first category in the background
    setTimeout(function () {
      all('sticker').slice(0, 12).forEach(function (s) { if (owned('sticker', s.id)) loadImg(s.src); });
    }, 1200);
  }

  if (HG.onReady) HG.onReady(start);
  else doc.addEventListener('hg:ready', start);
})(window.HG = window.HG || {}, window, document);

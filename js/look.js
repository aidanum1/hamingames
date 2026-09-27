/* HAMIN GAMES — js/look.js
   Shared Dress Up "look" renderer used by Dress Up, Photo Booth, My Room (and anything else
   that wants to show the player's current Hamin outfit).

   An outfit is a plain object:
     { head: 'hair-era-b', expr: 'neutral', top: 'top-…', shirt: …, knit: …, hoodie: …, outer: …,
       bottom: …, shoes: …, accessory: …, bag: …, hat: …, background: 'bg-bedroom' }
   Missing optional slots are simply not drawn. Every layer is a 1200×1600 transparent image
   (docs/ASSET_PLAN.md), so drawing is just stacking in HG.data.wardrobe.slots order.

   HG.look.current()                       → the saved outfit (save.dressUp.outfit) merged over defaults
   HG.look.normalize(outfit)                → copy with defaults filled + unknown ids dropped
   HG.look.layers(outfit, {background})     → ordered [{slot, src, id}]
   HG.look.headSrc(outfit)                  → src of the head layer for outfit.head / outfit.expr
   HG.look.loadImage(src)                   → Promise<HTMLImageElement|null> (cached; null if missing)
   HG.look.draw(ctx, outfit, {x, y, w, h, background, crop}) → Promise
        draws the look into the rect (fit 3:4, centered). crop = {x, y, w, h} in canvas units
        (1200×1600 space) to draw only part (e.g. a bust). background: true draws the outfit bg.
   HG.look.render(outfit, {w, h, background, crop}) → Promise<HTMLCanvasElement>
   HG.look.drawBackground(ctx, bgId, x, y, w, h) → Promise  (image or code-drawn pattern backgrounds)
*/
(function (HG, win, doc) {
  'use strict';
  var look = HG.look = HG.look || {};
  var CW = 1200, CH = 1600;
  var cache = {};

  function wardrobe() { return (HG.data && HG.data.wardrobe) || { slots: [], items: [] }; }
  function item(id) {
    var items = wardrobe().items || [];
    for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i];
    return null;
  }
  function bgDef(id) {
    var list = (HG.data && HG.data.backgrounds) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  look.normalize = function (outfit) {
    var w = wardrobe();
    var def = w.defaultOutfit || { head: 'hair-era-b', expr: 'neutral' };
    var o = {};
    var k;
    for (k in def) if (Object.prototype.hasOwnProperty.call(def, k)) o[k] = def[k];
    if (outfit) for (k in outfit) if (Object.prototype.hasOwnProperty.call(outfit, k)) o[k] = outfit[k];
    // drop ids that do not exist / sit in the wrong slot (old saves)
    (w.slots || []).forEach(function (slot) {
      if (slot === 'body' || slot === 'background') return;
      if (o[slot] == null) return;
      var it = item(o[slot]);
      if (!it || it.slot !== slot) delete o[slot];
    });
    if (!o.head || !item(o.head)) o.head = def.head || 'hair-era-b';
    if (!o.expr) o.expr = 'neutral';
    if (o.background && !bgDef(o.background)) o.background = def.background;
    return o;
  };

  look.current = function () {
    var saved = HG.save && HG.save.data && HG.save.data.dressUp && HG.save.data.dressUp.outfit;
    return look.normalize(saved && Object.keys(saved).length ? saved : null);
  };

  look.headSrc = function (outfit) {
    var h = item(outfit.head);
    if (!h) return null;
    var ex = outfit.expr || 'neutral';
    if (h.exprs && h.exprs[ex]) return h.exprs[ex];
    // extra expressions only exist for the default hair (head-era-b-<expr>.webp)
    if (ex !== 'neutral' && outfit.head === 'hair-era-b') return 'assets/character/dressup/head-era-b-' + ex + '.webp';
    // other hairstyles: map extra expressions to the closest one they have
    var near = { sheep: 'big', wink: 'smile', eating: 'smile', surprised: 'neutral', focused: 'neutral', pout: 'neutral' }[ex];
    if (near && h.exprs && h.exprs[near]) return h.exprs[near];
    return h.src;
  };

  look.layers = function (outfit, opts) {
    opts = opts || {};
    var o = look.normalize(outfit);
    var w = wardrobe();
    var out = [];
    (w.slots || []).forEach(function (slot) {
      if (slot === 'background') {
        if (opts.background && o.background) out.push({ slot: slot, id: o.background, bg: true });
        return;
      }
      if (slot === 'body') { out.push({ slot: slot, id: 'body', src: w.body || 'assets/character/dressup/body.webp' }); return; }
      if (slot === 'head') { out.push({ slot: slot, id: o.head, src: look.headSrc(o) }); return; }
      if (o[slot]) { var it = item(o[slot]); if (it) out.push({ slot: slot, id: it.id, src: it.src }); }
    });
    return out;
  };

  look.loadImage = function (src) {
    if (!src) return Promise.resolve(null);
    if (cache[src]) return cache[src];
    cache[src] = new Promise(function (resolve) {
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () { resolve(img); };
      img.onerror = function () {
        if (win.console) console.warn('[HG.look] missing layer', src);
        resolve(null);
      };
      img.src = src;
    });
    return cache[src];
  };

  function cssVar(name, fallback) {
    try {
      var v = getComputedStyle(doc.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }

  function drawPattern(ctx, def, x, y, w, h) {
    var c1 = cssVar(def.colors && def.colors[0], '#fff0f6');
    var c2 = cssVar(def.colors && def.colors[1], '#ffc9de');
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = c1; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = c2; ctx.strokeStyle = c2;
    var s = Math.max(12, Math.round(w / 14));
    var i, j;
    if (def.pattern === 'checker') {
      for (j = 0; j * s < h; j++) for (i = 0; i * s < w; i++) if ((i + j) % 2) ctx.fillRect(x + i * s, y + j * s, s, s);
    } else if (def.pattern === 'grid') {
      ctx.lineWidth = Math.max(1, s / 12);
      for (i = 0; i * s <= w; i++) { ctx.beginPath(); ctx.moveTo(x + i * s, y); ctx.lineTo(x + i * s, y + h); ctx.stroke(); }
      for (j = 0; j * s <= h; j++) { ctx.beginPath(); ctx.moveTo(x, y + j * s); ctx.lineTo(x + w, y + j * s); ctx.stroke(); }
    } else {
      var glyph = def.pattern === 'hearts' ? '♥' : def.pattern === 'stars' ? '★' : null;
      ctx.font = Math.round(s * 0.55) + 'px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (j = 0; j * s < h + s; j++) for (i = 0; i * s < w + s; i++) {
        var cx = x + i * s + (j % 2 ? s / 2 : 0), cy = y + j * s;
        if (glyph) ctx.fillText(glyph, cx, cy);
        else { ctx.beginPath(); ctx.arc(cx, cy, s * 0.14, 0, Math.PI * 2); ctx.fill(); }
      }
    }
    ctx.restore();
  }

  look.drawBackground = function (ctx, bgId, x, y, w, h) {
    var def = bgDef(bgId);
    if (!def) return Promise.resolve();
    if (def.pattern) { drawPattern(ctx, def, x, y, w, h); return Promise.resolve(); }
    return look.loadImage(def.src).then(function (img) {
      if (!img) { drawPattern(ctx, { pattern: 'dots', colors: ['--c-blush', '--c-pink'] }, x, y, w, h); return; }
      // cover
      var s = Math.max(w / img.width, h / img.height);
      var dw = img.width * s, dh = img.height * s;
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
      ctx.restore();
    });
  };

  look.draw = function (ctx, outfit, opts) {
    opts = opts || {};
    var crop = opts.crop || { x: 0, y: 0, w: CW, h: CH };
    var x = opts.x || 0, y = opts.y || 0;
    var w = opts.w || ctx.canvas.width, h = opts.h || ctx.canvas.height;
    // fit crop rect into target rect (contain), centered
    var s = Math.min(w / crop.w, h / crop.h);
    var dx = x + (w - crop.w * s) / 2, dy = y + (h - crop.h * s) / 2;
    var o = look.normalize(outfit);
    var list = look.layers(o, { background: false });
    var bgP = opts.background && o.background ? look.drawBackground(ctx, o.background, x, y, w, h) : Promise.resolve();
    return bgP.then(function () {
      return Promise.all(list.map(function (l) { return look.loadImage(l.src); }));
    }).then(function (imgs) {
      imgs.forEach(function (img) {
        if (!img) return;
        var k = img.width / CW; // layers may be exported at another size; keep proportions
        ctx.drawImage(img, crop.x * k, crop.y * k, crop.w * k, crop.h * k, dx, dy, crop.w * s, crop.h * s);
      });
    });
  };

  look.render = function (outfit, opts) {
    opts = opts || {};
    var c = doc.createElement('canvas');
    c.width = opts.w || 600; c.height = opts.h || 800;
    return look.draw(c.getContext('2d'), outfit, {
      x: 0, y: 0, w: c.width, h: c.height, background: opts.background, crop: opts.crop
    }).then(function () { return c; });
  };

  // Handy crops (canvas units)
  // all expressions a head can be asked for (era-b has every one; others fall back)
  look.EXPRS = ['neutral', 'smile', 'big', 'sheep', 'surprised', 'focused', 'wink', 'pout', 'eating'];

  look.CROPS = {
    full: { x: 0, y: 0, w: 1200, h: 1600 },
    upper: { x: 150, y: 20, w: 900, h: 900 },     // waist-up
    bust: { x: 300, y: 20, w: 600, h: 600 },      // head & shoulders
    face: { x: 410, y: 40, w: 380, h: 380 }
  };
})(window.HG = window.HG || {}, window, document);

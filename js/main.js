/* HAMIN GAMES — js/main.js
   Shared chrome + UI kit (docs/CONTRACT.md §2, §3.6, §5, §9, §10).

   On DOMContentLoaded it builds the header / nav / footer / mobile tab bar, the
   popup queue, toast line and aria-live region, applies translations, tracks the
   visit, then dispatches 'hg:ready' and runs HG.onReady callbacks.

   HG.onReady(fn)
   HG.ui.popup({type, title, text, icon, kind, id})   one at a time, auto-dismiss ~3.5 s
   HG.ui.toast(text, {ms})
   HG.ui.modal({titleKey|title, body, bodyKey, buttons:[{labelKey|label, primary, danger, onClick}], onClose,
                className, dismissible, initialFocus}) → {el, body, foot, close()}
   HG.ui.confirm({titleKey, textKey, title, text, okKey, cancelKey, danger}) → Promise<boolean>
   HG.ui.mountGameShell(el, {game, titleKey, helpKey}) → {el, stage, bar, setHelp(key), openHelp()}
   HG.ui.itemIcon(kind, id, {alt, className, lazy}) → <img> (falls back to a tinted emoji tile)
   HG.ui.reducedMotion() / HG.ui.formatNum(n) / HG.ui.sparkleBurst(x, y, n)
   extras: HG.ui.formatScore(n, fmt) · HG.ui.img(src, {alt, emoji, kind}) · HG.ui.announce(text)
           HG.ui.openSettings() · HG.ui.isModalOpen() · HG.ui.el(tag, props, kids)
   Events: 'hg:ready' · 'hg:modal' {open,count} · shell element 'hg:help' {open}
   Page hooks: <body data-page="…"> marks the nav; <body data-bgm="none|portal|…"> overrides auto BGM. */
(function (HG, win, doc) {
  'use strict';

  var ui = HG.ui = HG.ui || {};
  var root = doc.documentElement;
  var hasOwn = Object.prototype.hasOwnProperty;

  /* ═══════════ 1. Helpers ═══════════ */
  function t(key, params) { return HG.t ? HG.t(key, params) : String(key); }
  function sfx(name, opts) { try { if (HG.audio) HG.audio.sfx(name, opts); } catch (e) { /* never break UI for sound */ } }
  function settings() { return (HG.save && HG.save.data && HG.save.data.settings) || {}; }
  function hpNow() { return (HG.save && HG.save.data && Number(HG.save.data.hpoint)) || 0; }
  function log(e) { if (win.console) console.error('[HG]', e); }
  function safe(fn) { try { return fn(); } catch (e) { log(e); } }
  function pad(n, len) { var s = String(Math.max(0, Math.floor(n))); while (s.length < len) s = '0' + s; return s; }
  function emit(name, detail, target) {
    var ev;
    try { ev = new CustomEvent(name, { detail: detail }); }
    catch (e) { ev = doc.createEvent('CustomEvent'); ev.initCustomEvent(name, false, false, detail); }
    (target || doc).dispatchEvent(ev);
  }

  /* Tiny element builder.
     props: class, text, i18n (key → data-i18n + text), i18nAttr, on:{event:fn}, anything else → attribute */
  function h(tag, props, kids) {
    var el = doc.createElement(tag);
    if (props) {
      for (var k in props) {
        if (!hasOwn.call(props, k)) continue;
        var v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'i18n') { el.setAttribute('data-i18n', v); el.textContent = t(v); }
        else if (k === 'i18nAttr') el.setAttribute('data-i18n-attr', v);
        else if (k === 'on') { for (var ev in v) if (hasOwn.call(v, ev)) el.addEventListener(ev, v[ev]); }
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    append(el, kids);
    if (props && props.i18nAttr && HG.i18n) HG.i18n.apply(el);
    return el;
  }
  function append(el, kids) {
    if (kids == null) return;
    if (!Array.isArray(kids)) kids = [kids];
    for (var i = 0; i < kids.length; i++) {
      var c = kids[i];
      if (c == null || c === false) continue;
      el.appendChild(typeof c === 'object' ? c : doc.createTextNode(String(c)));
    }
  }
  ui.el = h;

  function currentPage() {
    var p = doc.body && doc.body.getAttribute('data-page');
    if (p) return p;
    var m = /([^\/?#]+)\.html?$/i.exec((win.location && win.location.pathname) || '');
    var f = m ? m[1] : 'index';
    return f === 'index' ? 'home' : f;
  }
  function isHome(p) { return p === 'home' || p === 'index' || p === 'portal'; }

  /* ═══════════ 2. Ready queue ═══════════ */
  var isReady = false;
  var readyQ = [];
  HG.onReady = function (fn) {
    if (typeof fn !== 'function') return;
    if (isReady) safe(fn);
    else readyQ.push(fn);
  };

  /* ═══════════ 3. Motion ═══════════ */
  var mqReduce = win.matchMedia ? win.matchMedia('(prefers-reduced-motion: reduce)') : null;
  ui.reducedMotion = function () {
    var m = settings().reducedMotion;
    if (m === 'on') return true;
    if (m === 'off') return false;
    return !!(mqReduce && mqReduce.matches);
  };
  function applyMotionClass() { root.classList.toggle('hg-reduced-motion', ui.reducedMotion()); }
  if (mqReduce) {
    if (mqReduce.addEventListener) mqReduce.addEventListener('change', applyMotionClass);
    else if (mqReduce.addListener) mqReduce.addListener(applyMotionClass);
  }
  applyMotionClass();   // as early as possible so CSS animations never start by mistake

  /* ═══════════ 4. Formatting ═══════════ */
  ui.formatNum = function (n) {
    n = Number(n);
    if (!isFinite(n)) n = 0;
    var neg = n < 0;
    var s = String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '-' : '') + s;
  };
  ui.formatScore = function (n, fmt) {
    var v = ui.formatNum(n);
    if (fmt === 'meters') return t('games.fmt.meters', { n: v });
    if (fmt === 'points') return t('games.fmt.points', { n: v });
    if (fmt === 'stars') return t('games.fmt.stars', { n: v });
    return v;
  };

  /* ═══════════ 5. Images with graceful fallback (§8) ═══════════ */
  var tokenCache = {};
  function token(name, fallback) {
    if (tokenCache[name]) return tokenCache[name];
    var v = '';
    try { v = win.getComputedStyle(root).getPropertyValue(name).trim(); } catch (e) { /* ignore */ }
    if (v) tokenCache[name] = v;
    return v || fallback;
  }
  var TINT = {
    wardrobe: ['--c-sky', '--c-powder', '--c-powder-deep'],
    sticker: ['--c-blush', '--c-pink', '--c-pink-deep'],
    frame: ['--c-cream', '--c-gold', '--c-pink-deep'],
    pose: ['--c-lavender', '--c-lavender-deep', '--c-lavender-deep'],
    background: ['--c-mint', '--c-sky', '--c-mint-deep'],
    room: ['--c-cream', '--c-pink', '--c-pink-deep'],
    memory: ['--c-lavender', '--c-pink', '--c-lavender-deep'],
    achievement: ['--c-cream', '--c-gold', '--c-pink-deep'],
    game: ['--c-sky', '--c-pink', '--c-powder-deep']
  };
  var TINT_FALLBACK = { '--c-sky': '#e8f5ff', '--c-powder': '#bfe3ff', '--c-powder-deep': '#7fbef0', '--c-blush': '#fff0f6',
    '--c-pink': '#ffc9de', '--c-pink-deep': '#ff8fb8', '--c-cream': '#fff8e7', '--c-gold': '#ffd76a',
    '--c-lavender': '#e5dcff', '--c-lavender-deep': '#b9a6f2', '--c-mint': '#cff5e4', '--c-mint-deep': '#7fd8b2',
    '--c-white': '#ffffff', '--c-cherry': '#ff4f7b', '--c-ink': '#4a3a55' };
  function col(name) { return token(name, TINT_FALLBACK[name] || '#ffc9de'); }
  function xmlEsc(s) { return String(s).replace(/[<>&"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function svgURI(svg) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }

  function patternTile(item) {
    var c = item.colors || [];
    var a = col(c[0] || '--c-blush'), b = col(c[1] || '--c-pink');
    var body = '';
    var x, y;
    switch (item.pattern) {
      case 'checker':
        for (y = 0; y < 4; y++) for (x = 0; x < 4; x++) if ((x + y) % 2) body += '<rect x="' + x * 16 + '" y="' + y * 16 + '" width="16" height="16" fill="' + b + '"/>';
        break;
      case 'hearts': case 'stars':
        for (y = 0; y < 3; y++) for (x = 0; x < 3; x++) body += '<text x="' + (11 + x * 21) + '" y="' + (18 + y * 21) + '" font-size="13" text-anchor="middle" fill="' + b + '">' + (item.pattern === 'hearts' ? '♥' : '★') + '</text>';
        break;
      case 'grid':
        for (x = 8; x < 64; x += 12) body += '<path d="M' + x + ' 0V64M0 ' + x + 'H64" stroke="' + b + '" stroke-width="2"/>';
        break;
      default: // dots
        for (y = 0; y < 4; y++) for (x = 0; x < 4; x++) body += '<circle cx="' + (8 + x * 16 + (y % 2) * 8) + '" cy="' + (8 + y * 16) + '" r="3.5" fill="' + b + '"/>';
    }
    return svgURI('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><clipPath id="r"><rect width="64" height="64" rx="10"/></clipPath><g clip-path="url(#r)"><rect width="64" height="64" fill="' + a + '"/>' + body + '</g></svg>');
  }

  /* A tinted rounded tile with a big emoji / letter — used whenever art is missing. */
  function fallbackTile(glyph, kind) {
    var tint = TINT[kind] || TINT.sticker;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col(tint[0]) + '"/>' +
      '<stop offset="1" stop-color="' + col(tint[1]) + '"/></linearGradient></defs>' +
      '<rect x="2" y="2" width="60" height="60" rx="12" fill="url(#g)" stroke="' + col(tint[2]) + '" stroke-width="2" stroke-dasharray="4 3"/>' +
      '<text x="32" y="33" font-size="30" text-anchor="middle" dominant-baseline="central" ' +
      'font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif" fill="' + col('--c-ink') + '">' + xmlEsc(glyph) + '</text></svg>';
    return svgURI(svg);
  }
  ui.fallbackTile = fallbackTile;

  var missing = {};
  function markMissing(src) {
    if (missing[src]) return;
    missing[src] = true;
    if (win.console) console.info('[HG] image not found yet, using fallback: ' + src);
  }

  function withFallback(img, src, fb) {
    if (!src || missing[src]) { img.src = fb(); img.classList.add('is-fallback'); return img; }
    img.onerror = function () {
      img.onerror = null;
      markMissing(src);
      img.src = fb();
      img.classList.add('is-fallback');
    };
    img.src = src;
    return img;
  }

  ui.itemIcon = function (kind, id, opts) {
    opts = opts || {};
    var c = HG.catalog;
    var item = c ? c.get(kind, id) : null;
    var img = doc.createElement('img');
    img.className = 'hg-item-icon' + (opts.className ? ' ' + opts.className : '');
    img.alt = opts.alt != null ? opts.alt : (HG.i18n ? HG.i18n.itemName(kind, id) : String(id));
    img.decoding = 'async';
    img.draggable = false;
    if (opts.lazy !== false) img.loading = 'lazy';
    img.setAttribute('data-kind', kind);
    img.setAttribute('data-id', id);
    if (kind === 'background' && item && item.pattern) { img.src = patternTile(item); return img; }
    var glyph = c ? c.emoji(kind, item || id) : '♡';
    return withFallback(img, c ? c.iconSrc(kind, item) : null, function () { return fallbackTile(glyph, kind); });
  };

  /* Generic image for page code: HG.ui.img('assets/…', {alt:'', emoji:'🍜', kind:'room', className, lazy}) */
  ui.img = function (src, opts) {
    opts = opts || {};
    var img = doc.createElement('img');
    img.alt = opts.alt != null ? opts.alt : '';
    img.decoding = 'async';
    img.draggable = false;
    if (opts.className) img.className = opts.className;
    if (opts.lazy) img.loading = 'lazy';
    var glyph = opts.emoji || (opts.alt ? String(opts.alt).charAt(0) : '♡');
    return withFallback(img, src, function () { return fallbackTile(glyph, opts.kind); });
  };

  /* ═══════════ 6. Live region + toast ═══════════ */
  var liveEl = null, toastEl = null, toastTimer = null, pendingToasts = [];

  ui.announce = function (text) {
    if (!liveEl || !text) return;
    liveEl.textContent = '';
    setTimeout(function () { liveEl.textContent = String(text); }, 60);
  };

  ui.toast = function (text, opts) {
    if (!text) return;
    if (!toastEl) { pendingToasts.push([text, opts]); return; }
    toastEl.textContent = String(text);
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, (opts && opts.ms) || 2800);
  };

  /* ═══════════ 7. Popup queue ═══════════ */
  var popLayer = null, popQ = [], popShowing = false, popOverflow = 0;
  var POP_MAX = 6, POP_MS = 3500;
  var POP_SFX = { unlock: 'unlock', memory: 'unlock', achievement: 'success', record: 'success', secret: 'sparkle', hpoint: 'coin', more: 'popup' };
  var POP_GLYPH = { unlock: '🎁', memory: '💌', achievement: '🏆', record: '👑', secret: '✨', hpoint: '💰', more: '♡' };

  ui.popup = function (p) {
    if (!p) return;
    if (popQ.length >= POP_MAX) { popOverflow++; return; }
    popQ.push(p);
    pumpPopups();
  };

  function pumpPopups() {
    if (popShowing || !popLayer || !isReady) return;
    var p = popQ.shift();
    if (!p && popOverflow) {
      p = { type: 'more', title: t('popup.unlock.title'), text: t('popup.more', { n: popOverflow }) };
      popOverflow = 0;
    }
    if (p) showPopup(p);
  }

  function showPopup(p) {
    popShowing = true;
    var type = p.type || 'unlock';
    var title = p.title || t('popup.' + type + '.title');
    var text = p.text || '';
    var icon;
    if (p.kind && p.id && p.kind !== 'achievement') {
      icon = h('span', { class: 'hg-popup__icon' }, ui.itemIcon(p.kind, p.id, { alt: '', lazy: false }));
    } else {
      icon = h('span', { class: 'hg-popup__icon hg-popup__icon--glyph', 'aria-hidden': 'true' }, p.icon || POP_GLYPH[type] || '♡');
    }
    // The whole popup is the (keyboard-focusable) dismiss control; the ✕ is decoration.
    var closeBtn = h('span', { class: 'hg-window__close', 'aria-hidden': 'true' }, '✕');
    var box = h('div', {
      class: 'hg-popup hg-window hg-popup--' + type, tabindex: '0', role: 'button',
      'aria-label': title + '. ' + String(text).replace(/\n/g, ' ') + '. ' + t('popup.close')
    }, [
      h('div', { class: 'hg-window__title hg-window__title--closable' }, [
        h('span', { class: 'hg-window__deco', 'aria-hidden': 'true' }, '♡'),
        h('span', { class: 'hg-window__label' }, title),
        closeBtn
      ]),
      h('div', { class: 'hg-popup__body' }, [icon, h('p', { class: 'hg-popup__text' }, text)])
    ]);

    var done = false, timer = null, returnTo = null;
    function arm(ms) { clearTimeout(timer); timer = setTimeout(dismiss, ms); }
    function dismiss() {
      if (done) return;
      done = true;
      clearTimeout(timer);
      var hadFocus = box.contains(doc.activeElement);
      box.classList.add('is-leaving');
      setTimeout(function () {
        if (box.parentNode) box.parentNode.removeChild(box);
        if (hadFocus && returnTo && doc.contains(returnTo)) { try { returnTo.focus(); } catch (e) { /* ignore */ } }
        popShowing = false;
        setTimeout(pumpPopups, 160);
      }, ui.reducedMotion() ? 0 : 220);
    }
    box.addEventListener('click', dismiss);
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); e.stopPropagation(); dismiss(); }
    });
    box.addEventListener('focusin', function (e) { if (!returnTo) returnTo = e.relatedTarget; clearTimeout(timer); });
    box.addEventListener('focusout', function () { if (!done) arm(1600); });
    box.addEventListener('mouseenter', function () { clearTimeout(timer); });
    box.addEventListener('mouseleave', function () { if (!done) arm(1400); });

    popLayer.appendChild(box);
    ui.announce(title + ' — ' + String(text).replace(/\n/g, ' '));
    sfx(POP_SFX[type] || 'popup');
    if (type === 'secret' || type === 'achievement') {
      var r = box.getBoundingClientRect();
      ui.sparkleBurst(r.left + 24, r.top + 30, 8);
    }
    arm(p.duration || POP_MS);
  }

  /* ═══════════ 8. Modals ═══════════ */
  var modalStack = [], modalSeq = 0;
  var FOCUSABLE = 'a[href],area[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),' +
    'select:not([disabled]),textarea:not([disabled]),iframe,[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';

  function focusables(box) {
    return Array.prototype.filter.call(box.querySelectorAll(FOCUSABLE), function (el) {
      return el.getAttribute('tabindex') !== '-1' && el.getClientRects().length > 0;
    });
  }

  function paragraphs(text) {
    var frag = doc.createDocumentFragment();
    String(text == null ? '' : text).split(/\n{2,}|\n/).forEach(function (line) {
      if (line.trim()) frag.appendChild(h('p', { class: 'hg-modal__p' }, line));
    });
    return frag;
  }

  ui.isModalOpen = function () { return modalStack.length > 0; };

  ui.modal = function (opts) {
    opts = opts || {};
    var id = 'hg-modal-' + (++modalSeq);
    var prev = doc.activeElement;
    var api = { closed: false };

    var titleEl = h('h2', { class: 'hg-window__label', id: id + '-t' });
    if (opts.title != null) titleEl.textContent = opts.title;
    else { titleEl.setAttribute('data-i18n', opts.titleKey || 'common.brand'); titleEl.textContent = t(opts.titleKey || 'common.brand'); }

    var closeBtn = h('button', { type: 'button', class: 'hg-window__close', 'data-sfx': 'click',
      i18nAttr: 'aria-label:common.close;title:common.close' }, h('span', { 'aria-hidden': 'true' }, '✕'));
    var bar = h('div', { class: 'hg-window__title hg-window__title--closable' }, [
      h('span', { class: 'hg-window__deco', 'aria-hidden': 'true' }, '♡'), titleEl, closeBtn
    ]);

    var body = h('div', { class: 'hg-modal__body', id: id + '-b' });
    if (opts.body != null && typeof opts.body === 'object') body.appendChild(opts.body);
    else if (opts.body != null) body.appendChild(paragraphs(opts.body));
    else if (opts.bodyKey) body.appendChild(paragraphs(t(opts.bodyKey)));

    var foot = h('div', { class: 'hg-modal__foot' });
    var buttons = opts.buttons || [{ labelKey: 'common.close', primary: true }];
    var firstPrimary = null;
    buttons.forEach(function (b) {
      var cls = 'hg-btn' + (b.primary ? ' hg-btn--pink' : '') + (b.danger ? ' hg-btn--danger' : '') + (b.className ? ' ' + b.className : '');
      var btn = h('button', { type: 'button', class: cls });
      if (b.label != null) btn.textContent = b.label;
      else { btn.setAttribute('data-i18n', b.labelKey || 'common.ok'); btn.textContent = t(b.labelKey || 'common.ok'); }
      btn.addEventListener('click', function () {
        sfx('click');
        var r = b.onClick ? safe(function () { return b.onClick(api, btn); }) : undefined;
        if (r !== false && b.close !== false) close('button');
      });
      if (b.primary && !firstPrimary) firstPrimary = btn;
      if (b.focus) api._focusBtn = btn;
      foot.appendChild(btn);
    });

    var box = h('div', {
      class: 'hg-modal hg-window' + (opts.className ? ' ' + opts.className : ''),
      role: opts.role || 'dialog', 'aria-modal': 'true', 'aria-labelledby': id + '-t', tabindex: '-1'
    }, [bar, body, foot]);
    if (opts.describe !== false && typeof opts.body === 'string') box.setAttribute('aria-describedby', id + '-b');
    var backdrop = h('div', { class: 'hg-modal-backdrop' }, box);

    function close(reason) {
      if (api.closed) return;
      api.closed = true;
      var i = modalStack.indexOf(api);
      if (i >= 0) modalStack.splice(i, 1);
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      if (!modalStack.length) root.classList.remove('hg-modal-open');
      if (prev && prev.focus && doc.contains(prev)) { try { prev.focus(); } catch (e) { /* ignore */ } }
      emit('hg:modal', { open: modalStack.length > 0, count: modalStack.length });
      if (opts.onClose) safe(function () { opts.onClose(reason || 'close'); });
    }

    closeBtn.addEventListener('click', function () { close('close'); });
    backdrop.addEventListener('mousedown', function (e) {
      if (e.target === backdrop && opts.dismissible !== false) close('backdrop');
    });

    api.el = box; api.body = body; api.foot = foot; api.backdrop = backdrop; api.close = close; api._opts = opts;
    modalStack.push(api);
    doc.body.appendChild(backdrop);
    root.classList.add('hg-modal-open');
    if (HG.i18n) HG.i18n.apply(box);
    emit('hg:modal', { open: true, count: modalStack.length });
    sfx('popup');

    var target = opts.initialFocus || api._focusBtn || body.querySelector('[autofocus]') || focusables(body)[0] || firstPrimary || closeBtn;
    try { target.focus(); } catch (e) { box.focus(); }
    return api;
  };

  // Esc closes the top modal; Tab / Shift+Tab stay inside it (capture phase).
  doc.addEventListener('keydown', function (e) {
    var top = modalStack[modalStack.length - 1];
    if (!top) return;
    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault(); e.stopPropagation();
      if (top._opts.dismissible !== false) top.close('esc');
      return;
    }
    if (e.key !== 'Tab') return;
    var f = focusables(top.el);
    if (!f.length) { e.preventDefault(); top.el.focus(); return; }
    var first = f[0], last = f[f.length - 1], active = doc.activeElement;
    if (!top.el.contains(active)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && (active === first || active === top.el)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  }, true);

  ui.confirm = function (o) {
    o = o || {};
    return new Promise(function (resolve) {
      var settled = false;
      function fin(v) { if (!settled) { settled = true; resolve(v); } }
      var btns = [
        { labelKey: o.cancelKey || 'common.cancel', onClick: function () { fin(false); }, focus: !!o.danger },
        { labelKey: o.okKey || 'common.ok', primary: !o.danger, danger: !!o.danger, onClick: function () { fin(true); }, focus: !o.danger }
      ];
      ui.modal({
        titleKey: o.titleKey || 'common.confirm', title: o.title,
        body: o.text != null ? o.text : (o.textKey ? t(o.textKey) : ''),
        className: 'hg-modal--confirm', role: 'alertdialog', buttons: btns,
        onClose: function () { fin(false); }
      });
    });
  };

  /* ═══════════ 9. Shared little widgets ═══════════ */
  function hpointBadge(extraClass) {
    var n = hpNow();
    var a = h('a', {
      class: 'hg-hpoint' + (extraClass ? ' ' + extraClass : ''), href: 'collection.html#exchange',
      'data-hg-hpoint-badge': '', 'aria-label': t('hpoint.aria', { n: ui.formatNum(n) }), i18nAttr: 'title:hpoint.what'
    }, [
      h('span', { class: 'hg-hpoint__label', i18n: 'hpoint.label', 'aria-hidden': 'true' }),
      h('span', { class: 'hg-hpoint__value', 'data-hg-hpoint': '', 'aria-hidden': 'true' }, ui.formatNum(n))
    ]);
    a.setAttribute('data-value', String(n));
    return a;
  }

  var lastHp = null;
  function syncHpoint() {
    var n = hpNow();
    var up = lastHp != null && n > lastHp;
    lastHp = n;
    var txt = ui.formatNum(n);
    Array.prototype.forEach.call(doc.querySelectorAll('[data-hg-hpoint-badge]'), function (b) {
      var v = b.querySelector('[data-hg-hpoint]');
      if (v && v.textContent !== txt) v.textContent = txt;
      b.setAttribute('aria-label', t('hpoint.aria', { n: txt }));
      if (up && !ui.reducedMotion()) {
        b.classList.remove('is-bump');
        void b.offsetWidth;
        b.classList.add('is-bump');
      }
    });
  }

  function soundButton(extraClass) {
    var b = h('button', { type: 'button', class: 'hg-iconbtn hg-iconbtn--sound' + (extraClass ? ' ' + extraClass : ''), 'data-hg-sound': '' },
      h('span', { class: 'hg-iconbtn__glyph', 'aria-hidden': 'true' }, '♪'));
    b.addEventListener('click', function () {
      var muted;
      if (HG.audio) muted = HG.audio.toggleMute();
      else { muted = !settings().muted; if (HG.save) HG.save.set('settings.muted', muted); }
      if (!muted) sfx('click');
      syncSoundButtons();
    });
    syncSoundButton(b);
    return b;
  }
  function syncSoundButton(b) {
    var muted = !!settings().muted;
    b.setAttribute('aria-pressed', String(!muted));
    b.setAttribute('aria-label', t('common.sound'));
    b.title = t(muted ? 'common.soundOff' : 'common.soundOn');
    b.classList.toggle('is-muted', muted);
  }
  function syncSoundButtons() {
    Array.prototype.forEach.call(doc.querySelectorAll('[data-hg-sound]'), syncSoundButton);
  }

  /* ═══════════ 10. Settings modal ═══════════ */
  function clamp01(v) { v = Number(v); return isFinite(v) ? Math.max(0, Math.min(1, v)) : 0; }

  function group(titleKey, kids, cls) {
    return h('fieldset', { class: 'hg-settings__group' + (cls ? ' ' + cls : '') },
      [h('legend', { class: 'hg-settings__legend', i18n: titleKey })].concat(kids));
  }

  function radioRow(name, options, current, onPick) {
    var row = h('div', { class: 'hg-seg' });
    options.forEach(function (o) {
      var id = 'hg-set-' + name + '-' + String(o.value).replace(/[^a-z0-9]/gi, '');
      var input = h('input', { type: 'radio', class: 'hg-seg__input', name: 'hg-set-' + name, id: id, value: o.value });
      input.checked = o.value === current;
      input.addEventListener('change', function () { if (input.checked) { sfx('click'); onPick(o.value); } });
      var label = h('label', { class: 'hg-seg__btn', for: id, lang: o.lang || null });
      if (o.labelKey) { label.setAttribute('data-i18n', o.labelKey); label.textContent = t(o.labelKey); }
      else label.textContent = o.label;
      row.appendChild(input);
      row.appendChild(label);
    });
    return row;
  }

  function rangeRow(key, labelKey) {
    var id = 'hg-set-' + key;
    var val = Math.round(clamp01(settings()[key]) * 100);
    var out = h('output', { class: 'hg-range__out', for: id }, t('settings.volume', { n: val }));
    var input = h('input', { type: 'range', class: 'hg-range', id: id, min: '0', max: '100', step: '5', value: String(val) });
    input.addEventListener('input', function () {
      var v = Number(input.value);
      out.textContent = t('settings.volume', { n: v });
      if (HG.save) HG.save.set('settings.' + key, v / 100);
      if (HG.audio) HG.audio.setVolumes();
    });
    input.addEventListener('change', function () { sfx(key === 'sfx' ? 'coin' : 'tick'); });
    return h('div', { class: 'hg-settings__row hg-settings__row--range' }, [
      h('label', { class: 'hg-settings__label', for: id, i18n: labelKey }), input, out
    ]);
  }

  function checkRow(id, labelKey, checked, onChange) {
    var input = h('input', { type: 'checkbox', class: 'hg-check__input', id: id });
    input.checked = !!checked;
    input.addEventListener('change', function () { onChange(input.checked); sfx('click'); });
    return h('div', { class: 'hg-settings__row hg-check' }, [input, h('label', { class: 'hg-check__label', for: id, i18n: labelKey })]);
  }

  function importFile(file) {
    if (!file || !HG.save) return;
    if (file.size > 1024 * 1024) { sfx('error'); ui.toast(t('settings.importError.size')); return; }
    var reader = new FileReader();
    reader.onerror = function () { sfx('error'); ui.toast(t('settings.importError.read')); };
    reader.onload = function () {
      var text = String(reader.result || '');
      var chk = HG.save.checkImport(text);
      if (!chk.ok) { sfx('error'); ui.toast(t('settings.importError.' + (chk.error || 'invalid'))); return; }
      ui.confirm({ titleKey: 'settings.importConfirmTitle', textKey: 'settings.importConfirmText' }).then(function (yes) {
        if (!yes) return;
        var r = HG.save.importJSON(text);
        if (!r.ok) { sfx('error'); ui.toast(t('settings.importError.' + (r.error || 'invalid'))); return; }
        sfx('success');
        if (HG.save.memoryOnly) { ui.toast(t('settings.importOkMemory')); syncHpoint(); return; }
        ui.toast(t('settings.importOk'));
        setTimeout(function () { win.location.reload(); }, 900);
      });
    };
    reader.readAsText(file);
  }

  ui.openSettings = function () {
    var s = settings();
    var i18n = HG.i18n;
    var langs = i18n ? i18n.langs : ['ko', 'zh-CN', 'ja', 'en'];

    var langGroup = group('settings.language', [
      radioRow('lang', langs.map(function (l) {
        return { value: l, label: i18n ? i18n.names[l] : l, lang: i18n ? i18n.htmlLang(l) : l };
      }), i18n ? i18n.lang : 'en', function (l) { if (i18n) i18n.set(l); })
    ]);

    var soundGroup = group('settings.sound', [
      rangeRow('music', 'settings.music'),
      rangeRow('sfx', 'settings.sfx'),
      checkRow('hg-set-mute', 'settings.mute', s.muted, function (v) {
        if (HG.audio) HG.audio.setMuted(v); else if (HG.save) HG.save.set('settings.muted', v);
        syncSoundButtons();
      })
    ]);

    var displayGroup = group('settings.display', [
      h('p', { class: 'hg-settings__sub', i18n: 'settings.motion' }),
      radioRow('motion', [
        { value: 'auto', labelKey: 'settings.motionAuto' },
        { value: 'on', labelKey: 'settings.motionOn' },
        { value: 'off', labelKey: 'settings.motionOff' }
      ], s.reducedMotion || 'auto', function (v) { if (HG.save) HG.save.set('settings.reducedMotion', v); applyMotionClass(); }),
      h('p', { class: 'hg-settings__hint', i18n: 'settings.motionHint' }),
      checkRow('hg-set-sparkles', 'settings.sparkles', s.sparkles !== false, function (v) {
        if (HG.save) HG.save.set('settings.sparkles', v);
      })
    ]);

    var fileInput = h('input', { type: 'file', accept: 'application/json,.json', class: 'hg-sr-only', tabindex: '-1', 'aria-hidden': 'true' });
    fileInput.addEventListener('change', function () {
      var f = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      importFile(f);
    });
    var saveGroup = group('settings.saveData', [
      h('p', { class: 'hg-settings__hint', i18n: 'settings.saveNote' }),
      h('div', { class: 'hg-settings__buttons' }, [
        h('button', { type: 'button', class: 'hg-btn hg-btn--blue', i18n: 'settings.export', on: { click: function () {
          sfx('click');
          var ok = HG.save && HG.save.downloadExport();
          ui.toast(t(ok ? 'settings.exportOk' : 'settings.exportFail'));
        } } }),
        h('button', { type: 'button', class: 'hg-btn hg-btn--mint', i18n: 'settings.import', on: { click: function () { sfx('click'); fileInput.click(); } } }),
        h('button', { type: 'button', class: 'hg-btn hg-btn--danger', i18n: 'settings.reset', on: { click: function () {
          sfx('click');
          ui.confirm({ titleKey: 'settings.resetConfirmTitle', textKey: 'settings.resetConfirmText', okKey: 'settings.reset', danger: true })
            .then(function (yes) {
              if (!yes || !HG.save) return;
              HG.save.reset({ keepPrefs: true });
              ui.toast(t('settings.resetOk'));
              setTimeout(function () { win.location.reload(); }, 800);
            });
        } } }),
        fileInput
      ])
    ]);

    var body = h('div', { class: 'hg-settings' }, [langGroup, soundGroup, displayGroup, saveGroup]);
    return ui.modal({ titleKey: 'settings.title', body: body, className: 'hg-modal--settings' });
  };

  /* ═══════════ 11. Header / nav / tab bar / footer ═══════════ */
  var NAV = [
    { id: 'home', href: 'index.html', key: 'nav.home', icon: '🏠' },
    { id: 'game', href: 'index.html#games', key: 'nav.game', icon: '🎮' },
    { id: 'photo', href: 'photo-booth.html', key: 'nav.photo', icon: '📸' },
    { id: 'collection', href: 'collection.html', key: 'nav.collection', icon: '📒' },
    { id: 'myroom', href: 'my-room.html', key: 'nav.myRoom', icon: '🛏️' }
  ];
  var GAME_PAGES = ['dress-up', 'lunch-time', 'run-hamin', 'practice-room'];

  function navSection(p) {
    if (isHome(p)) return 'home';
    if (p === 'photo-booth') return 'photo';
    if (p === 'collection') return 'collection';
    if (p === 'my-room') return 'myroom';
    if (GAME_PAGES.indexOf(p) >= 0 || (HG.catalog && HG.catalog.game(p))) return 'game';
    return null;
  }

  function navList(page, prefix, withHover) {
    var sec = navSection(page);
    var ul = h('ul', { class: prefix + '__list' });
    NAV.forEach(function (n) {
      var current = n.id === sec;
      var a = h('a', {
        class: prefix + '__link' + (current ? ' is-current' : ''), href: n.href, 'data-nav': n.id,
        'aria-current': current ? 'page' : null, 'data-sfx': 'click', 'data-sfx-hover': withHover ? 'hover' : null
      }, [
        h('span', { class: prefix + '__icon', 'aria-hidden': 'true' }, n.icon),
        h('span', { class: prefix + '__label', i18n: n.key })
      ]);
      ul.appendChild(h('li', { class: prefix + '__item' }, a));
    });
    return ul;
  }

  function langStrip() {
    var i18n = HG.i18n;
    var langs = i18n ? i18n.langs : ['ko', 'zh-CN', 'ja', 'en'];
    var box = h('div', { class: 'hg-lang', role: 'group', i18nAttr: 'aria-label:common.languageGroup' }, [
      h('span', { class: 'hg-lang__label', 'aria-hidden': 'true' }, [h('span', { i18n: 'common.language' }), ' ', h('span', { class: 'hg-lang__heart' }, '♡')])
    ]);
    langs.forEach(function (l, i) {
      if (i) box.appendChild(h('span', { class: 'hg-lang__sep', 'aria-hidden': 'true' }, '|'));
      var b = h('button', { type: 'button', class: 'hg-lang__btn', lang: i18n ? i18n.htmlLang(l) : l, 'data-lang': l,
        'aria-pressed': String(i18n && i18n.lang === l), 'data-sfx': 'click' }, i18n ? i18n.names[l] : l);
      b.addEventListener('click', function () { if (i18n) i18n.set(l); });
      box.appendChild(b);
    });
    return box;
  }
  function syncLangButtons() {
    var cur = HG.i18n ? HG.i18n.lang : 'en';
    Array.prototype.forEach.call(doc.querySelectorAll('.hg-lang__btn'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === cur));
    });
  }

  function buildHeader(page) {
    var host = doc.getElementById('hg-header');
    if (!host) { host = h('div', { id: 'hg-header' }); doc.body.insertBefore(host, doc.body.firstChild); }
    host.textContent = '';

    var logo = h('a', { class: 'hg-logo', href: 'index.html', 'aria-label': 'HAMIN GAMES' }, [
      h('span', { class: 'hg-logo__star hg-logo__star--l', 'aria-hidden': 'true' }, '★'),
      h('span', { class: 'hg-logo__text', 'aria-hidden': 'true', 'data-text': 'HAMIN GAMES' }, 'HAMIN GAMES'),
      h('span', { class: 'hg-logo__star hg-logo__star--r', 'aria-hidden': 'true' }, '★')
    ]);
    wireLogo(logo, isHome(page));

    var settingsBtn = h('button', { type: 'button', class: 'hg-iconbtn hg-iconbtn--settings', 'data-sfx': 'click',
      i18nAttr: 'aria-label:settings.open;title:settings.open' }, h('span', { class: 'hg-iconbtn__glyph', 'aria-hidden': 'true' }, '⚙'));
    settingsBtn.addEventListener('click', function () { ui.openSettings(); });

    var header = h('header', { class: 'hg-header' }, [
      h('div', { class: 'hg-header__banner' }, [
        h('div', { class: 'hg-header__brand' }, [logo, h('p', { class: 'hg-header__tagline', i18n: 'common.tagline' })]),
        h('div', { class: 'hg-header__tools' }, [
          langStrip(),
          h('div', { class: 'hg-header__row' }, [hpointBadge(), settingsBtn, soundButton()])
        ])
      ]),
      h('nav', { class: 'hg-nav', i18nAttr: 'aria-label:nav.label' }, navList(page, 'hg-nav', true))
    ]);

    host.appendChild(h('a', { class: 'hg-skip', href: '#hg-main', i18n: 'common.skip' }));
    host.appendChild(header);
  }

  function buildTabbar(page) {
    var old = doc.querySelector('.hg-tabbar');
    if (old) old.parentNode.removeChild(old);
    doc.body.appendChild(h('nav', { class: 'hg-tabbar', i18nAttr: 'aria-label:nav.tabbar' }, navList(page, 'hg-tabbar', false)));
  }

  /* Visitor counter: save.visitorNo, or the lucky 000524 on ~1 in 12 loads and always on May 24. */
  var visitor = { lucky: false, str: '000000', btn: null };

  function renderVisitor() {
    var btn = visitor.btn;
    if (!btn) return;
    btn.textContent = '';
    var parts = String(t('footer.visitor')).split('{n}');
    var digits = h('span', { class: 'hg-visitor__digits', 'aria-hidden': 'true' });
    visitor.str.split('').forEach(function (d) { digits.appendChild(h('span', { class: 'hg-visitor__digit' }, d)); });
    btn.appendChild(h('span', { 'aria-hidden': 'true' }, parts[0] || ''));
    btn.appendChild(digits);
    btn.appendChild(h('span', { 'aria-hidden': 'true' }, parts.slice(1).join('{n}')));
    var label = t('footer.visitor', { n: visitor.str }) + (visitor.lucky ? ' ' + t('footer.visitorLucky') : '');
    btn.setAttribute('aria-label', label);
    btn.title = visitor.lucky ? t('footer.visitorLucky') : '';
  }

  function buildFooter() {
    var host = doc.getElementById('hg-footer');
    if (!host) { host = h('div', { id: 'hg-footer' }); doc.body.appendChild(host); }
    host.textContent = '';

    var now = new Date();
    var no = (HG.save && HG.save.data && HG.save.data.visitorNo) || 1528;
    visitor.lucky = (now.getMonth() === 4 && now.getDate() === 24) || Math.random() < 1 / 12 || no === 524;
    visitor.str = visitor.lucky ? '000524' : pad(no, 6);
    visitor.btn = h('button', { type: 'button', class: 'hg-visitor' + (visitor.lucky ? ' hg-visitor--lucky' : '') });
    renderVisitor();
    visitor.btn.addEventListener('click', function () {
      var r = visitor.btn.getBoundingClientRect();
      if (visitor.lucky) {
        sfx('sparkle');
        ui.sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 12);
        if (HG.unlocks) HG.unlocks.secret('visitor0524');
      } else {
        sfx('tick');
      }
    });

    var clockTime = h('span', { class: 'hg-clock__time' }, '--:--:--');
    var sheep = h('button', { type: 'button', class: 'hg-hidden-sheep', i18nAttr: 'aria-label:footer.sheep;title:footer.sheep' },
      h('span', { 'aria-hidden': 'true' }, '🐑'));
    sheep.addEventListener('click', function () {
      sfx('pop', { rate: 1.3 });
      if (!ui.reducedMotion()) { sheep.classList.remove('is-hop'); void sheep.offsetWidth; sheep.classList.add('is-hop'); }
      var r = sheep.getBoundingClientRect();
      ui.sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 8);
      if (HG.unlocks) HG.unlocks.secret('hiddenSheep');
    });

    host.appendChild(h('footer', { class: 'hg-footer' }, h('div', { class: 'hg-footer__box' }, [
      h('p', { class: 'hg-footer__disclaimer' }, [h('span', { class: 'hg-footer__warn', 'aria-hidden': 'true' }, '♡'), ' ', h('span', { i18n: 'footer.disclaimer' })]),
      h('p', { class: 'hg-footer__love', i18n: 'footer.love' }),
      h('div', { class: 'hg-footer__meta' }, [
        h('span', { class: 'hg-clock', 'aria-hidden': 'true' }, [h('span', { class: 'hg-clock__icon' }, '⏰'), ' ', clockTime]),
        visitor.btn,
        sheep
      ]),
      h('p', { class: 'hg-footer__note', i18n: 'footer.note' }),
      h('p', { class: 'hg-footer__art', i18n: 'footer.art' })
    ])));

    startClock(clockTime);
  }

  function startClock(el) {
    function tick() {
      var d = new Date();
      el.textContent = pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2) + ':' + pad(d.getSeconds(), 2);
    }
    tick();
    setInterval(function () { if (!doc.hidden) tick(); }, 1000);
  }

  function buildLayers() {
    if (!doc.querySelector('.hg-popups')) {
      popLayer = h('div', { class: 'hg-popups', i18nAttr: 'aria-label:popup.region', role: 'region' });
      doc.body.appendChild(popLayer);
    }
    liveEl = h('div', { class: 'hg-sr-only', 'aria-live': 'polite', 'aria-atomic': 'true', id: 'hg-live' });
    toastEl = h('div', { class: 'hg-toast', role: 'status', 'aria-live': 'polite' });
    doc.body.appendChild(liveEl);
    doc.body.appendChild(toastEl);
  }

  /* ═══════════ 12. Game shell (§5) ═══════════ */
  function fsElement() { return doc.fullscreenElement || doc.webkitFullscreenElement || null; }

  ui.mountGameShell = function (el, opts) {
    if (typeof el === 'string') el = doc.querySelector(el);
    if (!el) el = doc.getElementById('game');
    opts = opts || {};
    if (!el) { log('mountGameShell: no element'); return null; }
    el.classList.add('hg-gameshell');
    doc.body.classList.add('hg-has-gameshell');   // lets responsive.css slim the chrome around games
    if (opts.game) el.setAttribute('data-game', opts.game);

    var stage = el.querySelector('.hg-gameshell__stage');
    if (!stage) {
      stage = h('div', { class: 'hg-gameshell__stage' });
      while (el.firstChild) stage.appendChild(el.firstChild);
      el.appendChild(stage);
    }
    var oldBar = el.querySelector('.hg-gameshell__bar');
    if (oldBar) oldBar.parentNode.removeChild(oldBar);

    var helpKey = opts.helpKey || null;
    var entry = HG.catalog && opts.game ? HG.catalog.game(opts.game) : null;

    var back = h('a', { class: 'hg-btn hg-btn--small hg-gameshell__back', href: 'index.html', 'data-sfx': 'click',
      i18nAttr: 'aria-label:shell.backLabel' }, [
      h('span', { class: 'hg-gameshell__back-arrow', 'aria-hidden': 'true' }, '◀'),
      h('span', { class: 'hg-gameshell__back-label', i18n: 'shell.back', 'aria-hidden': 'true' })
    ]);
    var title = h('h1', { class: 'hg-gameshell__title' }, [
      entry && entry.icon ? h('span', { class: 'hg-gameshell__icon', 'aria-hidden': 'true' }, entry.icon) : null,
      h('span', { class: 'hg-gameshell__name', i18n: opts.titleKey || (entry && entry.titleKey) || 'common.brand' })
    ]);

    var helpBtn = h('button', { type: 'button', class: 'hg-iconbtn hg-iconbtn--help', 'data-sfx': 'click',
      i18nAttr: 'aria-label:shell.help;title:shell.help' }, h('span', { class: 'hg-iconbtn__glyph', 'aria-hidden': 'true' }, '?'));
    var tools = h('div', { class: 'hg-gameshell__tools' }, [hpointBadge('hg-hpoint--mini'), helpBtn, soundButton('hg-iconbtn--shell')]);

    var fsSupported = !!(doc.fullscreenEnabled || doc.webkitFullscreenEnabled) && !!(el.requestFullscreen || el.webkitRequestFullscreen);
    var fsBtn = null;
    if (fsSupported) {
      fsBtn = h('button', { type: 'button', class: 'hg-iconbtn hg-iconbtn--fs', 'data-sfx': 'click', 'aria-pressed': 'false',
        i18nAttr: 'aria-label:shell.fullscreen;title:shell.fullscreen' }, h('span', { class: 'hg-iconbtn__glyph', 'aria-hidden': 'true' }, '⛶'));
      fsBtn.addEventListener('click', function () {
        try {
          if (fsElement() === el) {
            var ex = doc.exitFullscreen || doc.webkitExitFullscreen;
            if (ex) ex.call(doc);
          } else {
            var req = el.requestFullscreen || el.webkitRequestFullscreen;
            var p = req.call(el);
            if (p && p.catch) p.catch(function () { /* user/browser refused */ });
          }
        } catch (e) { /* ignore */ }
      });
      var onFs = function () {
        var on = fsElement() === el;
        el.classList.toggle('is-fullscreen', on);
        fsBtn.setAttribute('aria-pressed', String(on));
        fsBtn.setAttribute('data-i18n-attr', on ? 'aria-label:shell.exitFullscreen;title:shell.exitFullscreen' : 'aria-label:shell.fullscreen;title:shell.fullscreen');
        if (HG.i18n) HG.i18n.apply(fsBtn);
      };
      doc.addEventListener('fullscreenchange', onFs);
      doc.addEventListener('webkitfullscreenchange', onFs);
      tools.appendChild(fsBtn);
    }

    var bar = h('div', { class: 'hg-gameshell__bar' }, [back, title, tools]);
    el.insertBefore(bar, el.firstChild);
    if (HG.i18n) HG.i18n.apply(bar);

    function openHelp() {
      emit('hg:help', { open: true }, el);
      ui.modal({
        titleKey: 'shell.helpTitle', className: 'hg-modal--help',
        body: helpKey ? t(helpKey) : t('shell.noHelp'),
        onClose: function () { emit('hg:help', { open: false }, el); }
      });
    }
    helpBtn.addEventListener('click', openHelp);

    return {
      el: el, stage: stage, bar: bar,
      setHelp: function (key) { helpKey = key; },
      openHelp: openHelp
    };
  };

  /* ═══════════ 13. Sparkles & star shower ═══════════ */
  var fxLayer = null;
  var GLYPHS = ['✦', '✧', '♡', '⋆', '★'];
  function fx() {
    if (!fxLayer) { fxLayer = h('div', { class: 'hg-fx-layer', 'aria-hidden': 'true' }); doc.body.appendChild(fxLayer); }
    return fxLayer;
  }
  var canAnimate = !!(win.Element && win.Element.prototype.animate);

  ui.sparkleBurst = function (x, y, n) {
    if (ui.reducedMotion() || !canAnimate || !doc.body) return;
    var layer = fx();
    if (layer.childElementCount > 90) return;
    n = Math.max(1, Math.min(24, n || 10));
    for (var i = 0; i < n; i++) {
      var s = h('span', { class: 'hg-spark hg-spark--c' + (i % 4) }, GLYPHS[i % GLYPHS.length]);
      layer.appendChild(s);
      var ang = (i / n) * Math.PI * 2 + Math.random() * 0.6;
      var dist = 22 + Math.random() * 34;
      var anim = s.animate([
        { transform: 'translate(' + (x - 6) + 'px,' + (y - 8) + 'px) scale(.5)', opacity: 1 },
        { transform: 'translate(' + (x - 6 + Math.cos(ang) * dist) + 'px,' + (y - 8 + Math.sin(ang) * dist) + 'px) scale(1.1) rotate(140deg)', opacity: 0 }
      ], { duration: 560 + Math.random() * 320, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' });
      anim.onfinish = (function (el) { return function () { if (el.parentNode) el.parentNode.removeChild(el); }; })(s);
    }
  };

  function initCursorSparkles() {
    if (!canAnimate || !win.matchMedia || !win.matchMedia('(pointer: fine)').matches) return;
    var pool = [], idx = 0, last = 0, lx = -99, ly = -99, MAX = 20;
    doc.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      if (settings().sparkles === false || ui.reducedMotion()) return;
      var now = win.performance ? win.performance.now() : Date.now();
      if (now - last < 45) return;
      var dx = e.clientX - lx, dy = e.clientY - ly;
      if (dx * dx + dy * dy < 81) return;
      last = now; lx = e.clientX; ly = e.clientY;
      var s;
      if (pool.length < MAX) { s = h('span', { class: 'hg-spark hg-spark--trail' }); fx().appendChild(s); pool.push(s); }
      else { s = pool[idx % MAX]; if (s._a) s._a.cancel(); }
      idx++;
      s.textContent = GLYPHS[idx % GLYPHS.length];
      s.className = 'hg-spark hg-spark--trail hg-spark--c' + (idx % 4);
      var x = e.clientX + 6, y = e.clientY + 4;
      var rx = (Math.random() - 0.5) * 18, ry = 10 + Math.random() * 16;
      s._a = s.animate([
        { transform: 'translate(' + x + 'px,' + y + 'px) scale(1)', opacity: 0.95 },
        { transform: 'translate(' + (x + rx) + 'px,' + (y + ry) + 'px) scale(.2) rotate(90deg)', opacity: 0 }
      ], { duration: 650 + Math.random() * 250, easing: 'ease-out', fill: 'forwards' });
    }, { passive: true });
  }

  function starShower() {
    if (ui.reducedMotion() || !doc.body) return;
    var layer = h('div', { class: 'hg-starfall', 'aria-hidden': 'true' });
    for (var i = 0; i < 36; i++) {
      var size = 12 + Math.random() * 20;
      layer.appendChild(h('span', {
        class: 'hg-starfall__star hg-starfall__star--c' + (i % 4),
        style: 'left:' + (Math.random() * 100).toFixed(2) + '%;font-size:' + size.toFixed(0) + 'px;' +
               'animation-duration:' + (2.2 + Math.random() * 2).toFixed(2) + 's;animation-delay:' + (Math.random() * 1.2).toFixed(2) + 's'
      }, i % 5 === 0 ? '✦' : '★'));
    }
    doc.body.appendChild(layer);
    setTimeout(function () { if (layer.parentNode) layer.parentNode.removeChild(layer); }, 5200);
  }

  /* ═══════════ 14. Easter eggs ═══════════ */
  function wireLogo(logo, home) {
    var clicks = [];
    logo.addEventListener('click', function (e) {
      if (!home) return;                     // on other pages the logo simply goes home
      e.preventDefault();
      var now = Date.now();
      clicks = clicks.filter(function (c) { return now - c < 3000; });
      clicks.push(now);
      sfx('pop', { rate: 1 + clicks.length * 0.14 });
      var r = logo.getBoundingClientRect();
      ui.sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 4 + clicks.length);
      if (clicks.length >= 5) {
        clicks = [];
        sfx('powerup');
        starShower();
        if (HG.unlocks) HG.unlocks.secret('logoStars');
      }
    });
  }

  /* ═══════════ 15. Visit + language tracking ═══════════ */
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2); }
  function countLangs(d) {
    var langs = HG.i18n ? HG.i18n.langs : ['ko', 'zh-CN', 'ja', 'en'];
    return langs.filter(function (l) { return d.flags['lang.seen.' + l]; }).length;
  }
  function markLang(d) {
    var l = HG.i18n ? HG.i18n.lang : 'en';
    d.flags['lang.seen.' + l] = true;
    d.stats['portal.langsTried'] = Math.max(Number(d.stats['portal.langsTried']) || 0, countLangs(d));
  }

  function trackVisit() {
    if (!HG.save || !HG.save.data) return;
    var today = ymd(new Date());
    HG.save.update(function (d) {
      if (!d.flags || typeof d.flags !== 'object') d.flags = {};
      if (!d.stats || typeof d.stats !== 'object') d.stats = {};
      var days = Array.isArray(d.visitDays) ? d.visitDays.slice() : [];
      var isNewDay = days.indexOf(today) === -1;
      if (isNewDay) days.push(today);
      days.sort();
      if (days.length > 60) days = days.slice(-60);
      d.visitDays = days;
      var prev = Number(d.stats['portal.days']) || 0;
      d.stats['portal.days'] = Math.max(isNewDay ? prev + 1 : prev, days.length);
      if (!(d.visitorNo >= 1)) d.visitorNo = 1000 + Math.floor(Math.random() * 9000);
      markLang(d);
    });
    if (HG.unlocks) HG.unlocks.evaluate();
  }

  function trackLang() {
    if (!HG.save || !HG.save.data) return;
    HG.save.update(markLang);
    if (HG.unlocks) HG.unlocks.evaluate();
  }

  function storageNotice() {
    var map = { memory: 'common.storageMemory', corrupt: 'common.storageCorrupt', future: 'common.storageFuture', full: 'common.storageFull' };
    var st = HG.save && HG.save.status;
    if (!map[st]) return;
    var shown = false;
    try { shown = win.sessionStorage.getItem('hg.storageNotice') === st; win.sessionStorage.setItem('hg.storageNotice', st); } catch (e) { /* ignore */ }
    if (!shown) ui.toast(t(map[st]), { ms: 6500 });
  }

  /* ═══════════ 16. Auto BGM ═══════════ */
  var BGM_BY_PAGE = {
    home: 'portal', index: 'portal', portal: 'portal', 'not-found': 'portal', 'not_found': 'portal',
    collection: 'collection', 'my-room': 'room', 'dress-up': 'dressup', 'photo-booth': 'collection',
    'lunch-time': 'lunch', 'run-hamin': 'run', 'practice-room': 'practiceMenu'
  };
  function autoBgm(page) {
    if (!HG.audio) return;
    var pick = doc.body.getAttribute('data-bgm');
    if (pick === 'none') return;
    var name = pick || BGM_BY_PAGE[page];
    if (name) HG.audio.bgm(name);     // actually starts after the first user gesture
  }

  /* ═══════════ 17. Debug (?debug=1, console only) ═══════════ */
  function initDebug() {
    var q = '';
    try { q = win.location.search || ''; } catch (e) { /* ignore */ }
    if (!/[?&]debug=1(?:&|$)/.test(q)) return;
    var U = HG.unlocks;
    HG.debug = {
      give: function (n) { U.earn(Number(n) || 1000, 'hpoint.reason.gift'); return HG.save.data.hpoint; },
      unlockAll: function (kind) {
        var n = 0;
        (HG.catalog ? HG.catalog.all(kind) : []).forEach(function (it) { if (U.grant(kind, it.id, { silent: true })) n++; });
        U.evaluate();
        return n;
      },
      grantAll: function () {
        var n = 0;
        (HG.catalog ? HG.catalog.kinds : []).forEach(function (k) { n += HG.debug.unlockAll(k); });
        return n;
      },
      resetSeen: function () { HG.save.set('seen', {}); return true; },
      secret: function (id) { return U.secret(id); },
      popup: function (type) { ui.popup({ type: type || 'unlock', title: t('popup.' + (type || 'unlock') + '.title'), text: 'debug ♡' }); },
      progress: function () { return U.collectionProgress(); }
    };
    if (win.console) console.info('[HG] debug helpers ready: HG.debug.' + Object.keys(HG.debug).join(', HG.debug.'));
  }

  /* ═══════════ 18. Global listeners ═══════════ */
  function wireGlobal() {
    doc.addEventListener('hg:save', function (e) {
      syncHpoint();
      var p = e.detail && e.detail.path;
      if (!p || p === '*' || String(p).indexOf('settings') === 0) { syncSoundButtons(); applyMotionClass(); }
    });
    doc.addEventListener('hg:audio', syncSoundButtons);
    doc.addEventListener('hg:lang', function () {
      syncLangButtons();
      syncSoundButtons();
      syncHpoint();
      renderVisitor();
      Array.prototype.forEach.call(doc.querySelectorAll('.hg-range'), function (r) {
        var out = r.parentNode && r.parentNode.querySelector('.hg-range__out');
        if (out) out.textContent = t('settings.volume', { n: r.value });
      });
      safe(trackLang);
    });
    doc.addEventListener('hg:storage', function (e) {
      var st = e.detail && e.detail.status;
      if (st === 'full') ui.toast(t('common.storageFull'), { ms: 6500 });
    });
    // Opt-in sound hooks: data-sfx="click" / data-sfx-hover="hover" on any element.
    doc.addEventListener('click', function (e) {
      var el = e.target && e.target.closest ? e.target.closest('[data-sfx]') : null;
      if (el && !el.disabled) sfx(el.getAttribute('data-sfx'));
    });
    var lastHover = 0;
    doc.addEventListener('pointerover', function (e) {
      if (e.pointerType !== 'mouse') return;
      var el = e.target && e.target.closest ? e.target.closest('[data-sfx-hover]') : null;
      if (!el || (e.relatedTarget && el.contains(e.relatedTarget))) return;
      var now = Date.now();
      if (now - lastHover < 90) return;
      lastHover = now;
      sfx(el.getAttribute('data-sfx-hover'));
    });
  }

  /* ═══════════ 19. Init ═══════════ */
  var inited = false;
  function init() {
    if (inited) return;
    inited = true;
    root.classList.add('hg-js');
    if (win.matchMedia && win.matchMedia('(pointer: coarse)').matches) root.classList.add('hg-touch');
    applyMotionClass();

    var page = currentPage();
    safe(function () { buildHeader(page); });
    safe(buildFooter);
    safe(function () { buildTabbar(page); });
    safe(buildLayers);
    if (HG.i18n) safe(function () { HG.i18n.apply(doc); });
    lastHp = hpNow();
    wireGlobal();

    // Popups queued by unlocks.js before this file loaded.
    var early = HG._popupQueue || [];
    HG._popupQueue = null;
    early.forEach(ui.popup);

    safe(trackVisit);
    safe(storageNotice);
    safe(initCursorSparkles);
    safe(initDebug);
    safe(function () { autoBgm(page); });

    isReady = true;
    HG.ready = true;
    emit('hg:ready');
    var q = readyQ.slice();
    readyQ.length = 0;
    q.forEach(function (fn) { safe(fn); });

    pendingToasts.forEach(function (a) { ui.toast(a[0], a[1]); });
    pendingToasts = [];
    setTimeout(pumpPopups, 450);
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})(window.HG = window.HG || {}, window, document);

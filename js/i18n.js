/* HAMIN GAMES — js/i18n.js
   Four languages, exactly: ko · zh-CN · ja · en (fallback en). docs/CONTRACT.md §3.3

   HG.addStrings({en:{…}, ko:{…}, 'zh-CN':{…}, ja:{…}})  deep-merge (nested or dotted keys)
   HG.t('nav.home')                  current lang → en → key itself (console.warn once per key)
   HG.t('run.distance', {m: 120})    {m} placeholders
   HG.i18n.lang                      current language (read-only)
   HG.i18n.set('ja')                 saves, re-applies the DOM, emits 'hg:lang'
   HG.i18n.apply(root?)              fills [data-i18n] and [data-i18n-attr]
   HG.i18n.itemName(kind, id)        HG.t(`${kind}.${id}.name`) (prettified id if missing)
   HG.i18n.has(key, lang?)           key exists (no warning)
   HG.i18n.langs / HG.i18n.names     ['ko','zh-CN','ja','en'] / names in their own script
   HG.i18n.htmlLang(lang)            BCP-47 tag for <html lang> ('zh-CN' → 'zh-Hans')

   DOM: <span data-i18n="nav.home"></span>
        <b data-i18n="run.distance" data-i18n-params='{"m":120}'></b>
        <button data-i18n-attr="aria-label:common.close;title:common.close">✕</button>
   First visit: ?lang= override → save.lang → navigator.languages → 'en'. */
(function (HG, win, doc) {
  'use strict';

  var LANGS = ['ko', 'zh-CN', 'ja', 'en'];
  var NAMES = { ko: '한국어', 'zh-CN': '中文', ja: '日本語', en: 'EN' };
  var HTML_LANG = { ko: 'ko', 'zh-CN': 'zh-Hans', ja: 'ja', en: 'en' };
  var table = { ko: {}, 'zh-CN': {}, ja: {}, en: {} };
  var warned = {};
  var cur = 'en';
  var applied = false;
  var reapplyTimer = null;

  /* 'zh', 'zh_CN', 'zh-Hans-CN', 'ZH-tw' … → 'zh-CN'; 'ko-KR' → 'ko'; else null */
  function normalizeLang(l) {
    if (!l) return null;
    var s = String(l).toLowerCase().replace('_', '-');
    if (s.indexOf('ko') === 0) return 'ko';
    if (s.indexOf('zh') === 0) return 'zh-CN';
    if (s.indexOf('ja') === 0) return 'ja';
    if (s.indexOf('en') === 0) return 'en';
    return null;
  }

  function isPlainObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

  /* Nested objects become dotted keys; arrays and strings are stored as values. */
  function flatten(obj, prefix, out) {
    for (var k in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
      var key = prefix ? prefix + '.' + k : k;
      var v = obj[k];
      if (isPlainObj(v)) flatten(v, key, out);
      else out[key] = v;
    }
  }

  function addStrings(bundle) {
    if (!isPlainObj(bundle)) return;
    Object.keys(bundle).forEach(function (l) {
      var lang = LANGS.indexOf(l) >= 0 ? l : normalizeLang(l);
      if (!lang) { warnOnce('lang:' + l, 'unknown language block "' + l + '" ignored'); return; }
      if (isPlainObj(bundle[l])) flatten(bundle[l], '', table[lang]);
    });
    // Strings registered after the first DOM pass (late page bundles) → refresh once.
    if (applied && !reapplyTimer) {
      reapplyTimer = setTimeout(function () { reapplyTimer = null; apply(doc); }, 0);
    }
  }

  function warnOnce(id, msg) {
    if (warned[id]) return;
    warned[id] = true;
    if (win.console) console.warn('[HG.i18n] ' + msg);
  }

  function interpolate(str, params) {
    return str.replace(/\{(\w+)\}/g, function (m, name) {
      return Object.prototype.hasOwnProperty.call(params, name) && params[name] != null ? String(params[name]) : m;
    });
  }

  function t(key, params) {
    if (key == null) return '';
    key = String(key);
    var v = table[cur][key];
    if (v === undefined) {
      v = table.en[key];
      if (v === undefined) {
        warnOnce('missing:' + key, 'missing key "' + key + '"');
        return key;
      }
      if (cur !== 'en') warnOnce(cur + ':' + key, 'no ' + cur + ' text for "' + key + '", using en');
    }
    if (typeof v !== 'string') return v;
    return params ? interpolate(v, params) : v;
  }

  function has(key, lang) {
    var l = lang ? (LANGS.indexOf(lang) >= 0 ? lang : normalizeLang(lang)) : null;
    if (l) return table[l][key] !== undefined;
    return table[cur][key] !== undefined || table.en[key] !== undefined;
  }

  function prettifyId(id) {
    return String(id).replace(/^(st|fr|bg|pose|room|mem)-/, '').replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function itemName(kind, id) {
    var key = kind + '.' + id + '.name';
    if (has(key)) return t(key);
    warnOnce('missing:' + key, 'missing key "' + key + '"');
    return prettifyId(id);
  }

  /* ── DOM ─────────────────────────────────────────────────── */
  function applyEl(el) {
    var key = el.getAttribute('data-i18n');
    if (key) {
      var params = null;
      var raw = el.getAttribute('data-i18n-params');
      if (raw) { try { params = JSON.parse(raw); } catch (e) { params = null; } }
      var txt = t(key, params);
      if (typeof txt === 'string' && el.textContent !== txt) el.textContent = txt;
    }
    var attrs = el.getAttribute('data-i18n-attr');
    if (attrs) {
      attrs.split(';').forEach(function (pair) {
        var i = pair.indexOf(':');
        if (i < 1) return;
        var name = pair.slice(0, i).trim();
        var k = pair.slice(i + 1).trim();
        if (name && k) el.setAttribute(name, t(k));
      });
    }
  }

  function apply(root) {
    root = root || doc;
    if (root === doc) applied = true;
    if (root.nodeType === 1 && (root.hasAttribute('data-i18n') || root.hasAttribute('data-i18n-attr'))) applyEl(root);
    if (!root.querySelectorAll) return;
    var list = root.querySelectorAll('[data-i18n],[data-i18n-attr]');
    for (var i = 0; i < list.length; i++) applyEl(list[i]);
  }

  function setHtmlLang() {
    var html = doc.documentElement;
    html.setAttribute('lang', HTML_LANG[cur] || 'en');
    html.setAttribute('data-lang', cur);
  }

  function emit(name, detail) {
    var ev;
    try { ev = new CustomEvent(name, { detail: detail }); }
    catch (e) { ev = doc.createEvent('CustomEvent'); ev.initCustomEvent(name, false, false, detail); }
    doc.dispatchEvent(ev);
  }

  function set(lang) {
    var l = LANGS.indexOf(lang) >= 0 ? lang : normalizeLang(lang);
    if (!l) return false;
    var changed = l !== cur;
    cur = l;
    if (HG.save && HG.save.data && HG.save.data.lang !== l) HG.save.set('lang', l);
    setHtmlLang();
    apply(doc);
    if (changed) emit('hg:lang', { lang: l });
    return true;
  }

  function detect() {
    var list = [];
    try {
      var nav = win.navigator || {};
      if (nav.languages && nav.languages.length) list = Array.prototype.slice.call(nav.languages);
      else if (nav.language) list = [nav.language];
    } catch (e) { /* ignore */ }
    for (var i = 0; i < list.length; i++) {
      var l = normalizeLang(list[i]);
      if (l) return l;
    }
    return 'en';
  }

  function urlLang() {
    try {
      var m = /[?&]lang=([^&#]+)/.exec(win.location.search || '');
      return m ? normalizeLang(decodeURIComponent(m[1])) : null;
    } catch (e) { return null; }
  }

  /* ── Boot ────────────────────────────────────────────────── */
  var queued = HG._pendingStrings || [];
  HG.addStrings = addStrings;
  // Late bundles that still push onto the queue are merged immediately.
  HG._pendingStrings = { push: function (b) { addStrings(b); return 0; } };
  for (var qi = 0; qi < queued.length; qi++) addStrings(queued[qi]);

  (function init() {
    var saved = HG.save && HG.save.data ? HG.save.data.lang : null;
    var chosen = urlLang() || (LANGS.indexOf(saved) >= 0 ? saved : null) || detect();
    cur = chosen;
    if (HG.save && HG.save.data && HG.save.data.lang !== chosen) HG.save.set('lang', chosen);
    setHtmlLang();
  })();

  HG.t = t;
  HG.i18n = {
    langs: LANGS.slice(),
    names: NAMES,
    set: set,
    apply: apply,
    itemName: itemName,
    has: has,
    detect: detect,
    normalize: normalizeLang,
    htmlLang: function (l) { return HTML_LANG[l || cur] || 'en'; },
    _table: table   // debugging / tests only
  };
  Object.defineProperty(HG.i18n, 'lang', { get: function () { return cur; }, enumerable: true });
})(window.HG = window.HG || {}, window, document);

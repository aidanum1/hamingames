/* HAMIN GAMES — js/save.js
   The one and only save file: localStorage['haminGamesSave'] (docs/CONTRACT.md §3.2).

   HG.save.data                 live save object (mutate through the helpers)
   HG.save.get('a.b.c', def)    path getter
   HG.save.set('a.b.c', value)  path setter + persist + emit 'hg:save'
   HG.save.update(fn)           fn(data) mutates; then persist + emit
   HG.save.persist()            debounced write (150 ms); flushed on pagehide / hidden
   HG.save.flush()              write now
   HG.save.reset(opts)          wipe + defaults ({keepPrefs:true} keeps lang + settings)
   HG.save.exportJSON()         pretty JSON string
   HG.save.downloadExport()     "hamin-games-save-YYYYMMDD.json"
   HG.save.checkImport(str)     validate + migrate without applying → {ok, error, data}
   HG.save.importJSON(str)      validate + migrate + apply → {ok, error}
   HG.save.VERSION, HG.save.KEY
   HG.save.status               'ok' | 'memory' | 'corrupt' | 'future' | 'full'
   HG.save.memoryOnly           true when nothing can be written to storage
   HG.save.isNew                true when this page load created a brand-new save

   Flat maps: stats, best, flags, seen, rules, achievements use dotted keys
   ('lunch.rounds'). Paths understand that: get('stats.lunch.rounds') and
   set('flags.secret.logoStars', true) address the literal key inside the map.

   Storage never crashes the page: private mode / quota / corrupted JSON fall back
   to an in-memory save; 'hg:storage' is dispatched so main.js can show one toast. */
(function (HG, win, doc) {
  'use strict';

  var KEY = 'haminGamesSave';
  var BACKUP_KEY = KEY + '.backup';
  var VERSION = 1;
  var MAX_IMPORT = 1024 * 1024;           // 1 MB is far beyond any real save
  var LANGS = ['ko', 'zh-CN', 'ja', 'en'];
  var FLAT = { stats: 1, best: 1, flags: 1, seen: 1, rules: 1, achievements: 1 };
  // Null-prototype map: `{__proto__: 1}` in a literal would set the prototype instead of a
  // key, and inherited names ('toString', …) must not count as "bad".
  var BAD_KEYS = Object.create(null);
  BAD_KEYS['__proto__'] = 1; BAD_KEYS.constructor = 1; BAD_KEYS.prototype = 1;
  var hasOwn = Object.prototype.hasOwnProperty;

  /* ── Defaults (schema version 1) ─────────────────────────── */
  function randomVisitor() { return 1000 + Math.floor(Math.random() * 9000); }
  function nowISO() { return new Date().toISOString(); }

  function defaults() {
    var now = nowISO();
    return {
      version: VERSION, createdAt: now, updatedAt: now,
      lang: null,
      hpoint: 0, hpointEarned: 0,
      visitorNo: randomVisitor(),
      visitDays: [],
      settings: { music: 0.5, sfx: 0.7, muted: false, reducedMotion: 'auto', sparkles: true },
      unlocked: { wardrobe: [], sticker: [], frame: [], pose: [], background: [], room: [], memory: [] },
      achievements: {},
      rules: {},
      stats: {},
      best: {},
      flags: {},
      seen: {},
      dressUp: { outfit: {}, looks: [], challengeStars: {} },
      photoBooth: { transferLook: null, count: 0 },
      room: { layout: [] },
      practice: { ranks: {} }
    };
  }

  /* ── Helpers ─────────────────────────────────────────────── */
  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

  /* {lunch:{rounds:3}} → {'lunch.rounds':3} (already-flat maps come back unchanged). */
  function flattenMap(obj, prefix, out) {
    out = out || {};
    for (var k in obj) {
      if (!hasOwn.call(obj, k) || BAD_KEYS[k]) continue;
      var key = prefix ? prefix + '.' + k : k;
      if (isObj(obj[k])) flattenMap(obj[k], key, out);
      else out[key] = obj[k];
    }
    return out;
  }

  /* Upgrades: MIGRATIONS[n] turns a version n-1 save into version n.
     Version 0 = pre-release/test saves (no or 0 `version`). They may use
     `points`/`pointsEarned`/`language`, nested stat maps ({lunch:{rounds:3}}),
     unlocked lists as {id:true} maps, achievements as an id array and a boolean
     reducedMotion. Every step is defensive: fields already in v1 shape are kept. */
  var MIGRATIONS = {
    1: function (d) {
      if (d.hpoint == null && d.points != null) d.hpoint = d.points;
      if (d.hpointEarned == null && d.pointsEarned != null) d.hpointEarned = d.pointsEarned;
      if (d.lang == null && typeof d.language === 'string') d.lang = d.language;
      delete d.points; delete d.pointsEarned; delete d.language;
      if (Array.isArray(d.achievements)) {
        var when = typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString();
        var am = {};
        d.achievements.forEach(function (id) { if (typeof id === 'string' && !BAD_KEYS[id]) am[id] = when; });
        d.achievements = am;
      }
      Object.keys(FLAT).forEach(function (k) { if (isObj(d[k])) d[k] = flattenMap(d[k], '', {}); });
      if (isObj(d.unlocked)) {
        Object.keys(d.unlocked).forEach(function (kind) {
          var v = d.unlocked[kind];
          if (isObj(v)) d.unlocked[kind] = Object.keys(v).filter(function (id) { return v[id] && !BAD_KEYS[id]; });
        });
      }
      if (isObj(d.settings) && typeof d.settings.reducedMotion === 'boolean') {
        d.settings.reducedMotion = d.settings.reducedMotion ? 'on' : 'auto';
      }
      return d;
    }
    // 2: function (d) { … return d; }
  };

  function clone(v) {
    if (Array.isArray(v)) return v.map(clone);
    if (isObj(v)) {
      var o = {};
      for (var k in v) if (hasOwn.call(v, k) && !BAD_KEYS[k]) o[k] = clone(v[k]);
      return o;
    }
    return v;
  }

  /* Shape `val` like `def`: keep valid values, fill missing ones, keep unknown
     extra keys (forward-compatible page data). Empty default objects are open maps. */
  function shape(def, val) {
    if (Array.isArray(def)) return Array.isArray(val) ? clone(val) : clone(def);
    if (isObj(def)) {
      var keys = Object.keys(def);
      if (!keys.length) return isObj(val) ? clone(val) : {};
      var src = isObj(val) ? val : {};
      var out = {};
      keys.forEach(function (k) { out[k] = shape(def[k], src[k]); });
      for (var k in src) {
        if (hasOwn.call(src, k) && !hasOwn.call(def, k) && !BAD_KEYS[k]) out[k] = clone(src[k]);
      }
      return out;
    }
    if (typeof def === 'number') return (typeof val === 'number' && isFinite(val)) ? val : def;
    if (typeof def === 'boolean') return typeof val === 'boolean' ? val : def;
    if (typeof def === 'string') return typeof val === 'string' ? val : def;
    if (def === null) return val === undefined ? null : clone(val);
    return def;
  }

  function numMap(m) {
    var out = {};
    for (var k in m) {
      if (hasOwn.call(m, k) && !BAD_KEYS[k] && typeof m[k] === 'number' && isFinite(m[k])) out[k] = m[k];
    }
    return out;
  }
  function uniqStrings(a) {
    var seen = {}, out = [];
    (Array.isArray(a) ? a : []).forEach(function (s) {
      if (typeof s === 'string' && !seen[s]) { seen[s] = 1; out.push(s); }
    });
    return out;
  }
  function clamp(v, lo, hi, def) {
    v = Number(v);
    return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : def;
  }

  /* Full normalisation: shape + value sanity. Always returns a valid v1 save. */
  function normalize(raw) {
    var def = defaults();
    var d = shape(def, raw);
    d.version = VERSION;
    if (LANGS.indexOf(d.lang) < 0) d.lang = null;
    d.hpoint = Math.max(0, Math.floor(clamp(d.hpoint, 0, 1e9, 0)));
    d.hpointEarned = Math.max(d.hpoint, Math.floor(clamp(d.hpointEarned, 0, 1e9, 0)));
    d.visitorNo = Math.floor(clamp(d.visitorNo, 1, 999999, 0)) || randomVisitor();
    d.visitDays = uniqStrings(d.visitDays).filter(function (s) { return /^\d{4}-\d{2}-\d{2}$/.test(s); })
      .sort().slice(-60);
    var s = d.settings;
    s.music = clamp(s.music, 0, 1, def.settings.music);
    s.sfx = clamp(s.sfx, 0, 1, def.settings.sfx);
    if (['auto', 'on', 'off'].indexOf(s.reducedMotion) < 0) s.reducedMotion = 'auto';
    Object.keys(d.unlocked).forEach(function (k) { d.unlocked[k] = uniqStrings(d.unlocked[k]); });
    d.stats = numMap(d.stats);
    d.best = numMap(d.best);
    if (typeof d.createdAt !== 'string') d.createdAt = nowISO();
    return d;
  }

  /* A save without a numeric version predates v1 → treated as version 0. */
  function migrate(raw) {
    var v = (typeof raw.version === 'number' && isFinite(raw.version)) ? Math.floor(raw.version) : 0;
    if (v < 0) v = 0;
    while (v < VERSION) {
      v++;
      if (typeof MIGRATIONS[v] === 'function') {
        try { raw = MIGRATIONS[v](raw) || raw; } catch (e) { warn('migration ' + v + ' failed', e); }
      }
      raw.version = v;
    }
    return raw;
  }

  /* Replace the contents of `target` with `src`, keeping the same object so any
     code holding a reference to HG.save.data stays valid. */
  function replaceInPlace(target, src) {
    Object.keys(target).forEach(function (k) { delete target[k]; });
    Object.keys(src).forEach(function (k) { target[k] = src[k]; });
    return target;
  }

  function warn(msg, e) { if (win.console) console.warn('[HG.save] ' + msg, e || ''); }

  function emit(name, detail) {
    var ev;
    try { ev = new CustomEvent(name, { detail: detail }); }
    catch (e) { ev = doc.createEvent('CustomEvent'); ev.initCustomEvent(name, false, false, detail); }
    doc.dispatchEvent(ev);
  }

  /* ── Storage probe + initial load ───────────────────────── */
  var store = null, status = 'ok', memoryOnly = false, isNew = false;

  try {
    store = win.localStorage;
    var probe = KEY + '.__probe';
    store.setItem(probe, '1');
    store.removeItem(probe);
  } catch (e) {
    store = null; memoryOnly = true; status = 'memory';
  }

  function backup(raw) {
    if (!store || raw == null) return;
    try { store.setItem(BACKUP_KEY, String(raw)); } catch (e) { /* quota — nothing more we can do */ }
  }

  var data = (function load() {
    if (!store) { isNew = true; return normalize({}); }
    var raw = null;
    try { raw = store.getItem(KEY); } catch (e) { memoryOnly = true; status = 'memory'; }
    if (raw == null) { isNew = true; return normalize({}); }
    var parsed;
    try { parsed = JSON.parse(raw); } catch (e) { parsed = undefined; }
    if (!isObj(parsed)) {
      backup(raw); status = 'corrupt'; isNew = true;
      warn('save data was unreadable; started fresh (backup kept in ' + BACKUP_KEY + ')');
      return normalize({});
    }
    if (typeof parsed.version === 'number' && parsed.version > VERSION) {
      backup(raw); status = 'future'; isNew = true;
      warn('save data is from a newer version; started fresh (backup kept in ' + BACKUP_KEY + ')');
      return normalize({});
    }
    try { return normalize(migrate(parsed)); }
    catch (e) { backup(raw); status = 'corrupt'; isNew = true; return normalize({}); }
  })();

  /* ── Persistence ─────────────────────────────────────────── */
  var timer = null;

  function flush() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (memoryOnly || !store) return false;
    data.updatedAt = nowISO();
    try {
      store.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      memoryOnly = true;
      status = 'full';
      api.memoryOnly = true;
      api.status = status;
      warn('could not write to localStorage; continuing in memory', e);
      emit('hg:storage', { status: status });
      return false;
    }
  }

  function persist() {
    if (memoryOnly) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, 150);
  }

  win.addEventListener('pagehide', function () { if (timer) flush(); });
  doc.addEventListener('visibilitychange', function () { if (doc.hidden && timer) flush(); });

  /* Keep several open tabs in sync (only when this tab has nothing pending). */
  win.addEventListener('storage', function (e) {
    if (e.key !== KEY || e.newValue == null || timer) return;
    try {
      var p = JSON.parse(e.newValue);
      if (!isObj(p) || (typeof p.version === 'number' && p.version > VERSION)) return;
      replaceInPlace(data, normalize(migrate(p)));
      emit('hg:save', { path: '*', external: true });
    } catch (err) { /* ignore foreign / partial writes */ }
  });

  /* ── Paths ───────────────────────────────────────────────── */
  function lookup(path) {
    if (path == null || path === '') return data;
    var parts = String(path).split('.');
    var cur = data;
    for (var i = 0; i < parts.length; i++) {
      if (cur === null || typeof cur !== 'object') return undefined;
      if (i > 0) {
        var rest = parts.slice(i).join('.');
        if (hasOwn.call(cur, rest)) return cur[rest];   // dotted key inside a flat map
      }
      if (BAD_KEYS[parts[i]]) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function assign(path, value) {
    var parts = String(path).split('.');
    for (var j = 0; j < parts.length; j++) if (BAD_KEYS[parts[j]]) return false;
    if (parts.length > 1 && FLAT[parts[0]]) {
      if (!isObj(data[parts[0]])) data[parts[0]] = {};
      data[parts[0]][parts.slice(1).join('.')] = value;
      return true;
    }
    var cur = data;
    for (var i = 0; i < parts.length - 1; i++) {
      // An existing dotted key at this level (e.g. practice.ranks['a.b']) wins.
      var rest = parts.slice(i).join('.');
      if (i > 0 && hasOwn.call(cur, rest)) { cur[rest] = value; return true; }
      var next = cur[parts[i]];
      if (next === null || typeof next !== 'object') cur[parts[i]] = next = {};
      cur = next;
    }
    cur[parts[parts.length - 1]] = value;
    return true;
  }

  /* ── Import / export ─────────────────────────────────────── */
  function ymd(d) {
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
  }

  function checkImport(str) {
    if (typeof str !== 'string') return { ok: false, error: 'parse' };
    if (str.length > MAX_IMPORT) return { ok: false, error: 'size' };
    var parsed;
    try { parsed = JSON.parse(str.replace(/^﻿/, '')); } catch (e) { return { ok: false, error: 'parse' }; }
    if (!isObj(parsed)) return { ok: false, error: 'invalid' };
    var looksRight = ('hpoint' in parsed || 'unlocked' in parsed || 'settings' in parsed || 'points' in parsed) &&
      (parsed.version === undefined || typeof parsed.version === 'number');
    if (!looksRight) return { ok: false, error: 'invalid' };
    if (typeof parsed.version === 'number' && parsed.version > VERSION) return { ok: false, error: 'newer' };
    try { return { ok: true, data: normalize(migrate(parsed)) }; }
    catch (e) { return { ok: false, error: 'invalid' }; }
  }

  /* ── Public API ──────────────────────────────────────────── */
  var api = HG.save = {
    KEY: KEY,
    VERSION: VERSION,
    MIGRATIONS: MIGRATIONS,
    data: data,
    status: status,
    memoryOnly: memoryOnly,
    isNew: isNew,

    get: function (path, def) {
      var v = lookup(path);
      return v === undefined ? def : v;
    },

    set: function (path, value) {
      if (!assign(path, value)) return;
      persist();
      emit('hg:save', { path: String(path) });
    },

    update: function (fn) {
      try { if (typeof fn === 'function') fn(data); }
      catch (e) { if (win.console) console.error('[HG.save] update failed', e); }
      persist();
      emit('hg:save', { path: '*' });
    },

    persist: persist,
    flush: flush,

    /* Convenience readers for the flat maps (not in the contract, just sugar). */
    stat: function (k) { var v = data.stats[k]; return typeof v === 'number' ? v : 0; },
    flag: function (k) { return !!data.flags[k]; },

    reset: function (opts) {
      var keep = opts && opts.keepPrefs ? { lang: data.lang, settings: clone(data.settings) } : null;
      backup(JSON.stringify(data));          // one safety copy of what is being erased
      if (store) { try { store.removeItem(KEY); } catch (e) { /* ignore */ } }
      var fresh = normalize({});
      if (keep) { fresh.lang = keep.lang; fresh.settings = normalize({ settings: keep.settings }).settings; }
      replaceInPlace(data, fresh);
      api.isNew = true;
      flush();
      emit('hg:save', { path: '*', reset: true });
      return true;
    },

    exportJSON: function () { return JSON.stringify(data, null, 2); },

    downloadExport: function () {
      try {
        var blob = new Blob([api.exportJSON()], { type: 'application/json' });
        var url = (win.URL || win.webkitURL).createObjectURL(blob);
        var a = doc.createElement('a');
        a.href = url;
        a.download = 'hamin-games-save-' + ymd(new Date()) + '.json';
        a.rel = 'noopener';
        a.style.display = 'none';
        doc.body.appendChild(a);
        a.click();
        setTimeout(function () {
          if (a.parentNode) a.parentNode.removeChild(a);
          try { (win.URL || win.webkitURL).revokeObjectURL(url); } catch (e) { /* ignore */ }
        }, 1500);
        return true;
      } catch (e) {
        warn('export failed', e);
        return false;
      }
    },

    checkImport: function (str) {
      var r = checkImport(str);
      return r.ok ? { ok: true } : r;
    },

    importJSON: function (str) {
      var r = checkImport(str);
      if (!r.ok) return { ok: false, error: r.error };
      backup(JSON.stringify(data));          // keep the replaced progress as a backup
      replaceInPlace(data, r.data);
      flush();
      emit('hg:save', { path: '*', imported: true });
      return { ok: true };
    }
  };
})(window.HG = window.HG || {}, window, document);

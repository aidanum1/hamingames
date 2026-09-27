#!/usr/bin/env node
/* HAMIN GAMES — translation & catalog consistency check (dev tool, not deployed).

   Loads every data/*.js file in a Node vm sandbox with a fake `window`/`HG`
   (the same way the browser runs them: classic scripts sharing one global),
   collects every string bundle registered through HG.addStrings(...) or queued
   on HG._pendingStrings, and reports:

     1. bundle shape      — each bundle has exactly ko / zh-CN / ja / en
     2. key parity        — keys missing in any language vs the union
                            (per bundle and merged), empty strings,
                            non-string values, {placeholder} mismatches,
                            leaf/branch conflicts, cross-file overrides
     3. catalog names     — catalog ids in HG.data lacking their name/desc keys
     4. referenced keys   — hintKey / titleKey / descKey / … values in HG.data
                            that have no string
     5. data sanity       — unlock-rule grants pointing at unknown ids,
                            rule-locked items without a hintKey, etc.

   Both registration paths are exercised: every file is loaded once with
   HG.addStrings missing (queue path — the normal page order, because
   js/i18n.js loads after data/*.js) and once with HG.addStrings present
   (direct path); a file that registers different content in the two runs
   is reported.

   Usage:
     node tools/check-i18n.js                 full report, exit 1 on errors
     node tools/check-i18n.js --file=translations-items.js
                                              only report key issues for strings
                                              that bundle defines + catalog
                                              checks for namespaces it owns
     node tools/check-i18n.js --only=sticker,hint
                                              only report keys in these namespaces
     node tools/check-i18n.js --lengths       also warn about long names
                                              (> 18 chars EN, > 10 chars CJK)
     node tools/check-i18n.js --warn-only     always exit 0
*/
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const LANGS = ['en', 'ko', 'zh-CN', 'ja'];
const FALLBACK = 'en';

// Script order from docs/CONTRACT.md §2. Files not listed here (e.g. the
// per-page translations-<page>.js) load after the common translation files.
const CONTRACT_ORDER = [
  'translations.js', 'translations-items.js', '*translations', 'catalog.js', 'games.js',
  'wardrobe.js', 'stickers.js', 'room-items.js', 'collectibles.js', 'achievements.js',
  'unlock-rules.js'
];

// Properties inside HG.data whose string values are translation keys.
// (bestKey is a save/score key, not a translation key — deliberately absent.)
const REF_PROPS = ['hintKey', 'titleKey', 'descKey', 'nameKey', 'labelKey', 'textKey', 'helpKey'];

// Namespaces owned by data/translations-items.js (used by --file scoping).
const ITEM_NAMESPACES = ['sticker', 'stickerCat', 'frame', 'pose', 'background', 'room', 'roomCat',
  'memory', 'memoryLocked', 'achievement', 'achievementLocked', 'hint', 'slot', 'category',
  'rarity', 'tag', 'unlock', 'kind', 'challenge', 'wardrobe'];

/* ───────────────────────── CLI ───────────────────────── */
const args = process.argv.slice(2);
function opt(name) {
  const hit = args.find((a) => a === '--' + name || a.startsWith('--' + name + '='));
  if (!hit) return null;
  const eq = hit.indexOf('=');
  return eq === -1 ? true : hit.slice(eq + 1);
}
const OPT_ONLY = typeof opt('only') === 'string' ? opt('only').split(',').map((s) => s.trim()).filter(Boolean) : null;
const OPT_FILE = typeof opt('file') === 'string' ? path.basename(opt('file')) : null;
const OPT_LENGTHS = !!opt('lengths');
const OPT_WARN_ONLY = !!opt('warn-only');

/* ───────────────────────── report helpers ───────────────────────── */
let errorCount = 0;
let warnCount = 0;
const out = [];
function line(s) { out.push(s == null ? '' : s); }
function section(title) { line(''); line('── ' + title + ' ' + '─'.repeat(Math.max(3, 66 - title.length))); }
function err(s) { errorCount++; line('  ✗ ' + s); }
function warn(s) { warnCount++; line('  ! ' + s); }
function ok(s) { line('  ✓ ' + s); }
function info(s) { line('  · ' + s); }

/* ───────────────────────── loading ───────────────────────── */
function listDataFiles() {
  if (!fs.existsSync(DATA_DIR)) return [];
  const files = fs.readdirSync(DATA_DIR).filter((f) => /\.js$/.test(f)).sort();
  const rank = (f) => {
    const i = CONTRACT_ORDER.indexOf(f);
    if (i !== -1) return i;
    if (/^translations-.+\.js$/.test(f)) return CONTRACT_ORDER.indexOf('*translations');
    return CONTRACT_ORDER.length; // unknown files last, alphabetical
  };
  return files.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

function makeSandbox() {
  const noop = function () {};
  const el = () => ({ style: {}, setAttribute: noop, getAttribute: () => null, appendChild: noop,
    addEventListener: noop, removeEventListener: noop, classList: { add: noop, remove: noop, toggle: noop, contains: () => false } });
  const store = {};
  const sandbox = {
    console: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
    navigator: { languages: ['en'], language: 'en', userAgent: 'node-check' },
    location: { href: 'file:///index.html', search: '', hash: '', pathname: '/index.html' },
    document: {
      readyState: 'loading', documentElement: el(), body: el(), head: el(),
      addEventListener: noop, removeEventListener: noop, dispatchEvent: noop,
      querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, createElement: el
    },
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
    matchMedia: () => ({ matches: false, addEventListener: noop, addListener: noop }),
    addEventListener: noop, removeEventListener: noop, dispatchEvent: noop,
    setTimeout: () => 0, clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
    requestAnimationFrame: () => 0, cancelAnimationFrame: noop,
    CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init && init.detail; }
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  return sandbox;
}

/* Load all data files. mode 'queue': HG.addStrings absent (normal page order).
   mode 'direct': HG.addStrings present from the start. Either way, any
   HG.addStrings a data file installs itself is wrapped so calls are seen. */
function loadAll(files, mode) {
  const sandbox = makeSandbox();
  const HG = {};
  const bundles = [];        // {file, via, obj}
  const seenObjs = new Set();
  const loadErrors = [];
  let current = null;
  let installed = mode === 'direct' ? function () {} : undefined;

  function record(obj, via) {
    if (!obj || seenObjs.has(obj)) return;
    seenObjs.add(obj);
    bundles.push({ file: current, via, obj });
  }
  function wrapper(obj) {
    record(obj, 'addStrings');
    return installed.apply(this, arguments);
  }
  Object.defineProperty(HG, 'addStrings', {
    configurable: true, enumerable: true,
    get() { return typeof installed === 'function' ? wrapper : undefined; },
    set(fn) { installed = fn; }
  });
  sandbox.HG = HG;
  const ctx = vm.createContext(sandbox);

  for (const f of files) {
    current = f;
    const full = path.join(DATA_DIR, f);
    try {
      vm.runInContext(fs.readFileSync(full, 'utf8'), ctx, { filename: 'data/' + f });
    } catch (e) {
      loadErrors.push({ file: f, error: e });
    }
    // Anything newly queued during this file belongs to it.
    const q = sandbox.HG && sandbox.HG._pendingStrings;
    if (Array.isArray(q)) q.forEach((obj) => record(obj, 'queue'));
  }
  return { HG: sandbox.HG, bundles, loadErrors };
}

/* ───────────────────────── flattening ───────────────────────── */
function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

// Nested ({a:{b:'x'}}) and flat ({'a.b':'x'}) shapes both flatten to 'a.b'.
function flatten(obj, prefix, map, problems) {
  for (const k of Object.keys(obj)) {
    const key = prefix ? prefix + '.' + k : k;
    const v = obj[k];
    if (isPlainObject(v)) flatten(v, key, map, problems);
    else if (typeof v === 'string') map.set(key, v);
    else if (Array.isArray(v) && v.every((x) => typeof x === 'string')) map.set(key, v);
    else problems.push(key + ' has a non-string value (' + (Array.isArray(v) ? 'array' : typeof v) + ')');
  }
  return map;
}

function placeholders(v) {
  const s = Array.isArray(v) ? v.join('\n') : v;
  const set = new Set();
  s.replace(/\{(\w+)\}/g, (_, n) => { set.add(n); return _; });
  return [...set].sort().join(',');
}

/* ───────────────────────── main ───────────────────────── */
const files = listDataFiles();
const runQ = loadAll(files, 'queue');
const runD = loadAll(files, 'direct');
const HG = runQ.HG;
const D = (HG && HG.data) || {};

line('HAMIN GAMES · i18n / catalog check');
line('root: ' + ROOT);
if (OPT_FILE) line('scope: --file=' + OPT_FILE);
if (OPT_ONLY) line('scope: --only=' + OPT_ONLY.join(','));

/* 0. files ─────────────────────────────────────────────── */
section('0. data files');
if (!files.length) err('no data/*.js files found');
for (const f of files) {
  const e = runQ.loadErrors.find((x) => x.file === f);
  const n = runQ.bundles.filter((b) => b.file === f).length;
  if (e) err('data/' + f + ' threw: ' + (e.error && e.error.message));
  else info('data/' + f + (n ? '  → ' + n + ' string bundle' + (n > 1 ? 's' : '') + ' (' + runQ.bundles.filter((b) => b.file === f).map((b) => b.via).join(', ') + ')' : ''));
}
['translations.js', 'translations-items.js'].forEach((f) => {
  if (!files.includes(f)) warn('data/' + f + ' not present yet (contract: loaded on every page)');
});

/* registration-path parity: queue run vs direct run must register the same content */
(function () {
  const sig = (run, f) => JSON.stringify(run.bundles.filter((b) => b.file === f).map((b) => b.obj));
  const bad = files.filter((f) => sig(runQ, f) !== sig(runD, f));
  if (bad.length) bad.forEach((f) => err('data/' + f + ' registers different strings with vs. without HG.addStrings'));
  else if (runQ.bundles.length) ok('queue path (HG._pendingStrings) and direct HG.addStrings path register identical strings');
})();

/* 1. bundle shape + flatten ───────────────────────────── */
section('1. bundle shape');
const bundles = runQ.bundles.map((b, i) => ({ ...b, idx: i, flat: {} }));
for (const b of bundles) {
  const label = 'data/' + b.file + (bundles.filter((x) => x.file === b.file).length > 1 ? ' #' + b.idx : '');
  if (!isPlainObject(b.obj)) { err(label + ': bundle is not an object'); continue; }
  const langs = Object.keys(b.obj);
  const missing = LANGS.filter((l) => !langs.includes(l));
  const extra = langs.filter((l) => !LANGS.includes(l));
  if (missing.length) err(label + ': missing language block(s): ' + missing.join(', '));
  if (extra.length) err(label + ': unexpected language key(s): ' + extra.join(', ') + ' (allowed: ' + LANGS.join(', ') + ')');
  const problems = [];
  for (const l of LANGS) {
    const block = b.obj[l];
    if (block === undefined) { b.flat[l] = new Map(); continue; }
    if (!isPlainObject(block)) { err(label + ' [' + l + ']: language block is not an object'); b.flat[l] = new Map(); continue; }
    const p = [];
    b.flat[l] = flatten(block, '', new Map(), p);
    p.forEach((x) => problems.push('[' + l + '] ' + x));
  }
  problems.forEach((p) => err(label + ' ' + p));
  if (!missing.length && !extra.length && !problems.length) {
    ok(label + ': ' + LANGS.map((l) => l + ' ' + b.flat[l].size).join(' · ') + ' keys');
  }
}
if (!bundles.length) warn('no string bundles registered at all');

/* scope helpers */
function inScope(key) {
  if (!OPT_ONLY) return true;
  return OPT_ONLY.some((p) => key === p || key.startsWith(p + '.'));
}
const scopedBundles = OPT_FILE ? bundles.filter((b) => b.file === OPT_FILE) : bundles;
if (OPT_FILE && !scopedBundles.length) err('--file=' + OPT_FILE + ': that file registered no string bundles');

/* 2. key parity ───────────────────────────────────────── */
section('2. key parity');
for (const b of scopedBundles) {
  const union = new Set();
  LANGS.forEach((l) => b.flat[l].forEach((_, k) => union.add(k)));
  let issues = 0;
  const label = 'data/' + b.file;
  for (const l of LANGS) {
    const miss = [...union].filter((k) => !b.flat[l].has(k) && inScope(k));
    if (miss.length) { issues++; err(label + ' [' + l + '] missing ' + miss.length + ' key(s): ' + miss.slice(0, 40).join(', ') + (miss.length > 40 ? ' …' : '')); }
  }
  for (const k of union) {
    if (!inScope(k)) continue;
    const vals = LANGS.filter((l) => b.flat[l].has(k)).map((l) => [l, b.flat[l].get(k)]);
    vals.forEach(([l, v]) => {
      const s = Array.isArray(v) ? v.join('') : v;
      if (!s.trim()) { issues++; err(label + ' [' + l + '] ' + k + ' is empty'); }
    });
    const ph = new Set(vals.map(([, v]) => placeholders(v)));
    if (ph.size > 1) { issues++; err(label + ' ' + k + ' placeholder mismatch: ' + vals.map(([l, v]) => l + '{' + placeholders(v) + '}').join(' ')); }
    const arrLens = new Set(vals.filter(([, v]) => Array.isArray(v)).map(([, v]) => v.length));
    if (arrLens.size > 1) { issues++; warn(label + ' ' + k + ' list length differs between languages'); }
  }
  if (!issues) ok(label + ': all ' + union.size + ' keys present in ' + LANGS.join(' / ') + ', placeholders match');
}

// Merge all bundles in load order (later wins), noting overrides + conflicts.
const merged = {};
LANGS.forEach((l) => { merged[l] = new Map(); });
const definedBy = new Map(); // key -> Set(file)
const overrides = [];
for (const b of bundles) {
  for (const l of LANGS) {
    b.flat[l].forEach((v, k) => {
      const prev = merged[l].get(k);
      if (prev !== undefined && JSON.stringify(prev) !== JSON.stringify(v)) {
        overrides.push({ key: k, lang: l, from: [...(definedBy.get(k) || [])].join(','), by: b.file });
      }
      merged[l].set(k, v);
      if (!definedBy.has(k)) definedBy.set(k, new Set());
      definedBy.get(k).add(b.file);
    });
  }
}
function mergedUnion() {
  const u = new Set();
  LANGS.forEach((l) => merged[l].forEach((_, k) => u.add(k)));
  return u;
}
const ownedByScope = (k) => !OPT_FILE || (definedBy.get(k) && definedBy.get(k).has(OPT_FILE));

(function () {
  const u = mergedUnion();
  let issues = 0;
  for (const l of LANGS) {
    const miss = [...u].filter((k) => !merged[l].has(k) && inScope(k) && ownedByScope(k));
    if (miss.length) { issues++; err('merged [' + l + '] missing ' + miss.length + ' key(s) (fallback: ' + FALLBACK + '): ' + miss.slice(0, 40).join(', ') + (miss.length > 40 ? ' …' : '')); }
  }
  // A key cannot be both a string and a namespace (breaks deep-merge / path lookup).
  const keys = [...u].sort();
  for (let i = 0; i < keys.length - 1; i++) {
    if (keys[i + 1].startsWith(keys[i] + '.') && inScope(keys[i]) && ownedByScope(keys[i])) {
      issues++; err('"' + keys[i] + '" is both a string and a parent of "' + keys[i + 1] + '"');
    }
  }
  const ov = overrides.filter((o) => inScope(o.key) && (!OPT_FILE || o.by === OPT_FILE || o.from.includes(OPT_FILE)));
  if (ov.length) {
    const byKey = {};
    ov.forEach((o) => { (byKey[o.key] = byKey[o.key] || []).push(o.lang); });
    Object.keys(byKey).slice(0, 30).forEach((k) => warn('"' + k + '" redefined across files (' + byKey[k].join(',') + '): ' + [...definedBy.get(k)].join(' → ')));
    if (Object.keys(byKey).length > 30) warn('… and ' + (Object.keys(byKey).length - 30) + ' more redefinitions');
  }
  if (!issues) ok('merged: ' + u.size + ' keys, identical key sets in all languages');
})();

/* 3. catalog names ────────────────────────────────────── */
section('3. catalog names');
function has(key) { return LANGS.filter((l) => !merged[l].has(key)); }   // -> missing langs
function checkKeys(label, keys, ns) {
  if (OPT_FILE && OPT_FILE === 'translations-items.js' && ns && !ITEM_NAMESPACES.includes(ns)) return;
  const scoped = keys.filter(inScope);
  if (!scoped.length) return;
  const missing = scoped.map((k) => [k, has(k)]).filter(([, m]) => m.length);
  if (!missing.length) { ok(label + ': ' + scoped.length + ' keys ok'); return; }
  missing.forEach(([k, m]) => err(label + ': ' + k + (m.length === LANGS.length ? ' (missing everywhere)' : ' (missing: ' + m.join(', ') + ')')));
}
function arr(v) { return Array.isArray(v) ? v : []; }
function skipped(label, what) { info(label + ': skipped (' + what + ' not loaded)'); }

const W = D.wardrobe;
if (W && Array.isArray(W.items)) {
  checkKeys('wardrobe items', W.items.map((it) => 'wardrobe.' + it.id + '.name'), 'wardrobe');
  checkKeys('wardrobe slots', arr(W.slots).map((s) => 'slot.' + s), 'slot');
  checkKeys('wardrobe categories', arr(W.categories).map((c) => 'category.' + (c && c.id)), 'category');
  const tags = new Set(); const rar = new Set();
  W.items.forEach((it) => { arr(it.tags).forEach((t) => tags.add(t)); if (it.rarity) rar.add(it.rarity); });
  checkKeys('wardrobe tags', [...tags].map((t) => 'tag.' + t), 'tag');
  checkKeys('wardrobe rarities', [...rar].map((r) => 'rarity.' + r), 'rarity');
} else skipped('wardrobe', 'HG.data.wardrobe');
checkKeys('stickers', arr(D.stickers).map((s) => 'sticker.' + s.id + '.name'), 'sticker');
checkKeys('sticker categories', [...new Set(arr(D.stickerCats).concat(arr(D.stickers).map((s) => s.cat)))].map((c) => 'stickerCat.' + c), 'stickerCat');
checkKeys('frames', arr(D.frames).map((x) => 'frame.' + x.id + '.name'), 'frame');
checkKeys('poses', arr(D.poses).map((x) => 'pose.' + x.id + '.name'), 'pose');
checkKeys('backgrounds', arr(D.backgrounds).map((x) => 'background.' + x.id + '.name'), 'background');
checkKeys('room items', arr(D.roomItems).map((x) => 'room.' + x.id + '.name'), 'room');
checkKeys('room categories', [...new Set(arr(D.roomCats).concat(arr(D.roomItems).map((x) => x.cat)))].map((c) => 'roomCat.' + c), 'roomCat');
checkKeys('memories', [].concat(...arr(D.memories).map((m) => ['memory.' + m.id + '.name', 'memory.' + m.id + '.desc'])), 'memory');
checkKeys('achievements', [].concat(...arr(D.achievements).map((a) => ['achievement.' + a.id + '.name', 'achievement.' + a.id + '.desc'])), 'achievement');
const challenges = arr(D.challenges).length ? D.challenges : arr(W && W.challenges).length ? W.challenges : arr(D.dressUpChallenges);
if (challenges.length) checkKeys('style challenges', [].concat(...challenges.map((c) => ['challenge.' + c.id + '.name', 'challenge.' + c.id + '.desc'])), 'challenge');
else skipped('style challenges', 'HG.data.challenges / wardrobe.challenges');
if (HG.catalog && Array.isArray(HG.catalog.kinds)) checkKeys('catalog kinds', HG.catalog.kinds.map((k) => 'kind.' + k), 'kind');
if (!arr(D.stickers).length) skipped('stickers', 'HG.data.stickers');
if (!arr(D.roomItems).length) skipped('room items', 'HG.data.roomItems');
if (!arr(D.memories).length) skipped('memories', 'HG.data.memories');
if (!arr(D.achievements).length) skipped('achievements', 'HG.data.achievements');

/* 4. referenced keys ──────────────────────────────────── */
section('4. referenced keys (' + REF_PROPS.join(', ') + ')');
const refs = new Map(); // key -> [paths]
(function walk(v, p, depth) {
  if (depth > 12 || v == null) return;
  if (Array.isArray(v)) { v.forEach((x, i) => walk(x, p + '[' + i + ']', depth + 1)); return; }
  if (typeof v !== 'object') return;
  for (const k of Object.keys(v)) {
    if (REF_PROPS.includes(k) && typeof v[k] === 'string') {
      if (!refs.has(v[k])) refs.set(v[k], []);
      refs.get(v[k]).push(p + '.' + k);
    } else walk(v[k], p + '.' + k, depth + 1);
  }
})(D, 'HG.data', 0);
(function () {
  const keys = [...refs.keys()].filter(inScope).filter((k) => {
    if (OPT_FILE !== 'translations-items.js') return true;
    return ITEM_NAMESPACES.includes(k.split('.')[0]);
  }).sort();
  let bad = 0;
  const byNs = {};
  keys.forEach((k) => {
    const m = has(k);
    if (m.length) {
      bad++;
      const where = refs.get(k);
      err(k + (m.length === LANGS.length ? '' : ' (missing: ' + m.join(', ') + ')') + '  ← ' + where.slice(0, 3).join(', ') + (where.length > 3 ? ' +' + (where.length - 3) : ''));
    } else {
      const ns = k.split('.')[0];
      byNs[ns] = (byNs[ns] || 0) + 1;
    }
  });
  const okList = Object.keys(byNs).map((ns) => ns + '.* ' + byNs[ns]).join(', ');
  if (okList) ok('resolved: ' + okList);
  if (!keys.length) info('no referenced keys in scope');
  else if (!bad) ok('all ' + keys.length + ' referenced keys resolve in every language');
})();

/* 5. data sanity ──────────────────────────────────────── */
section('5. data sanity');
(function () {
  const idsByKind = {
    wardrobe: W && Array.isArray(W.items) ? W.items.map((x) => x.id) : null,
    sticker: arr(D.stickers).map((x) => x.id), frame: arr(D.frames).map((x) => x.id),
    pose: arr(D.poses).map((x) => x.id), background: arr(D.backgrounds).map((x) => x.id),
    room: arr(D.roomItems).map((x) => x.id), memory: arr(D.memories).map((x) => x.id),
    achievement: arr(D.achievements).map((x) => x.id)
  };
  let issues = 0;
  // duplicate ids per kind
  Object.keys(idsByKind).forEach((kind) => {
    const ids = idsByKind[kind]; if (!ids) return;
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dup.length) { issues++; err(kind + ': duplicate id(s) ' + [...new Set(dup)].join(', ')); }
  });
  // unlock-rule grants must point at existing catalog ids
  arr(D.unlockRules).forEach((r) => arr(r.grant).forEach((g) => {
    if (!g || g.kind === 'hpoint') return;
    const ids = idsByKind[g.kind];
    if (ids === undefined) { issues++; err('rule "' + r.id + '" grants unknown kind "' + g.kind + '"'); }
    else if (ids === null) { /* catalog not loaded yet (e.g. wardrobe.js) */ }
    else if (!ids.includes(g.id)) { issues++; err('rule "' + r.id + '" grants ' + g.kind + ':' + g.id + ' which is not in the catalog'); }
  }));
  if (idsByKind.wardrobe === null) {
    const pending = [];
    arr(D.unlockRules).forEach((r) => arr(r.grant).forEach((g) => { if (g && g.kind === 'wardrobe') pending.push(g.id); }));
    if (pending.length) info('wardrobe grants not verifiable yet (wardrobe.js absent): ' + pending.join(', '));
  }
  // rule-locked, non-memory items should explain themselves with a hintKey
  const kinds = { sticker: D.stickers, frame: D.frames, pose: D.poses, background: D.backgrounds, room: D.roomItems, wardrobe: W && W.items };
  Object.keys(kinds).forEach((kind) => arr(kinds[kind]).forEach((it) => {
    if (it && it.unlock && it.unlock.type === 'rule' && !it.unlock.hintKey) { issues++; warn(kind + ':' + it.id + ' is rule-locked but has no unlock.hintKey'); }
    if (it && it.unlock && it.unlock.type === 'hpoint' && !(it.unlock.cost > 0)) { issues++; warn(kind + ':' + it.id + ' has an hpoint unlock without a positive cost'); }
  }));
  // every rule-granted item should actually be granted by some rule
  const granted = new Set();
  arr(D.unlockRules).forEach((r) => arr(r.grant).forEach((g) => g && granted.add(g.kind + ':' + g.id)));
  Object.keys(kinds).forEach((kind) => arr(kinds[kind]).forEach((it) => {
    if (it && it.unlock && it.unlock.type === 'rule' && !granted.has(kind + ':' + it.id)) { issues++; warn(kind + ':' + it.id + ' is rule-locked but no unlock rule grants it'); }
  }));
  arr(D.memories).forEach((m) => { if (!granted.has('memory:' + m.id)) { issues++; warn('memory:' + m.id + ' is never granted by an unlock rule'); } });
  if (!issues) ok('ids unique, rule grants resolve, rule-locked items have hints');
})();

/* 6. optional length check ─────────────────────────────── */
if (OPT_LENGTHS) {
  section('6. label lengths (EN ≤ 18, CJK ≤ 10)');
  const shortNs = ['stickerCat', 'roomCat', 'slot', 'category', 'rarity', 'tag', 'kind'];
  let n = 0;
  mergedUnion().forEach((k) => {
    if (!inScope(k) || !ownedByScope(k)) return;
    if (!/\.name$/.test(k) && !shortNs.includes(k.split('.')[0])) return;
    LANGS.forEach((l) => {
      const v = merged[l].get(k); if (typeof v !== 'string') return;
      const len = [...v].length; const lim = l === 'en' ? 18 : 10;
      if (len > lim) { n++; warn(l + ' ' + k + ' = "' + v + '" (' + len + ' > ' + lim + ')'); }
    });
  });
  if (!n) ok('all names fit');
}

/* summary ──────────────────────────────────────────────── */
line('');
line('summary: ' + errorCount + ' error(s), ' + warnCount + ' warning(s)' + (errorCount ? '' : '  ♡'));
console.log(out.join('\n'));
process.exitCode = errorCount && !OPT_WARN_ONLY ? 1 : 0;

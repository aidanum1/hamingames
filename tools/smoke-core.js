#!/usr/bin/env node
/* HAMIN GAMES — tools/smoke-core.js
   Offline smoke test for the core engine (no browser, no DOM, no server).

   Loads data/*.js + js/save.js + js/i18n.js + js/unlocks.js into fresh Node `vm`
   contexts with a tiny fake window/document/localStorage/navigator (only what those
   scripts touch) and exercises the public API from docs/CONTRACT.md §3.2, §3.3, §3.5, §7:

     save     default creation · path helpers · v0 → v1 migration · future / corrupt /
              private-mode storage · export → import round trip · bad imports · reset
     i18n     language detection · ?lang= · set() · placeholders · fallback · key parity
     unlocks  finishGame (+50, new best +100, bonus cap) · rules (incl. wardrobe grant with
              NO wardrobe catalog) · achievements (+150 / custom reward, once) ·
              secret (+200, once) · buy / spend / earn · grant / has / status ·
              collectionProgress + % milestones · 'hpoint.earned' stat mapping

   Usage:  node tools/smoke-core.js          (exit code 1 when anything fails)
           node tools/smoke-core.js -v       (also list passing checks) */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const VERBOSE = process.argv.includes('-v') || process.argv.includes('--verbose');

/* Page script order (docs/CONTRACT.md §2) — every string bundle (common first, then
   every data/translations-*.js present), the catalog data, then the engine. */
const STRING_FILES = ['data/translations.js'].concat(
  fs.readdirSync(path.join(ROOT, 'data')).filter(f => /^translations-.+\.js$/.test(f)).sort().map(f => 'data/' + f));
const DATA_FILES = STRING_FILES.concat([
  'data/catalog.js', 'data/games.js', 'data/wardrobe.js', 'data/stickers.js', 'data/room-items.js',
  'data/collectibles.js', 'data/achievements.js', 'data/unlock-rules.js'
]);
/* Files whose literal translation keys must all resolve (the shared engine + portal pages).
   Other pages are reported as notes only, so games still under construction do not fail this. */
const CORE_CODE = ['js/save.js', 'js/i18n.js', 'js/audio.js', 'js/unlocks.js', 'js/main.js', 'js/look.js',
  'js/home.js', 'js/collection.js', 'index.html', 'collection.html', 'not_found.html'];
const ENGINE_FILES = ['js/save.js', 'js/i18n.js', 'js/unlocks.js'];
const KEY = 'haminGamesSave';

/* ═══════════ tiny test harness ═══════════ */
let passed = 0, failed = 0, section = '';
function group(name) { section = name; console.log('\n── ' + name + ' ' + '─'.repeat(Math.max(3, 64 - name.length))); }
function ok(cond, msg, extra) {
  if (cond) { passed++; if (VERBOSE) console.log('  ✓ ' + msg); return true; }
  failed++;
  console.log('  ✗ ' + msg + (extra !== undefined ? '  → ' + JSON.stringify(extra) : ''));
  return false;
}
function eq(actual, expected, msg) { return ok(actual === expected, msg + ' (expected ' + JSON.stringify(expected) + ')', actual); }
function sorted(v) {
  if (Array.isArray(v)) return v.map(sorted);
  if (v && typeof v === 'object') { const o = {}; Object.keys(v).sort().forEach(k => { o[k] = sorted(v[k]); }); return o; }
  return v;
}
function same(a, b) { return JSON.stringify(sorted(a)) === JSON.stringify(sorted(b)); }
function throwsNot(fn, msg) {
  try { const r = fn(); ok(true, msg); return r; }
  catch (e) { ok(false, msg + ' — threw ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e)); return undefined; }
}
/* Data crossing the vm boundary has foreign prototypes; normalise through JSON. */
function plain(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }

/* ═══════════ fake browser ═══════════ */
function makeStorage(initial, opts) {
  opts = opts || {};
  const m = new Map(Object.entries(initial || {}));
  return {
    _map: m,
    getItem(k) { if (opts.throwGet) throw new Error('SecurityError'); return m.has(k) ? m.get(k) : null; },
    setItem(k, v) { if (opts.throwSet) throw new Error('QuotaExceededError'); m.set(k, String(v)); },
    removeItem(k) { m.delete(k); },
    key(i) { return Array.from(m.keys())[i] || null; },
    get length() { return m.size; }
  };
}

function makeElement() {
  const attrs = {};
  return {
    nodeType: 1,
    setAttribute(k, v) { attrs[k] = String(v); },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(attrs, k) ? attrs[k] : null; },
    hasAttribute(k) { return Object.prototype.hasOwnProperty.call(attrs, k); },
    querySelectorAll() { return []; }
  };
}

/* Build a fresh "page": opts.storage (object of initial localStorage values), opts.throwSet /
   opts.throwGet (private mode), opts.languages, opts.search, opts.skip (files not to load). */
function makePage(opts) {
  opts = opts || {};
  const listeners = {};
  const events = [];
  const logs = { warn: [], error: [], info: [] };
  const doc = {
    nodeType: 9, readyState: 'complete', hidden: false,
    documentElement: makeElement(),
    addEventListener(n, f) { (listeners[n] = listeners[n] || []).push(f); },
    removeEventListener(n, f) { listeners[n] = (listeners[n] || []).filter(x => x !== f); },
    dispatchEvent(ev) { events.push({ type: ev.type, detail: ev.detail }); (listeners[ev.type] || []).slice().forEach(f => f(ev)); return true; },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    getElementById() { return null; },
    createEvent() {
      return { initCustomEvent(type, b, c, detail) { this.type = type; this.detail = detail; } };
    }
  };
  class CustomEvent { constructor(type, init) { this.type = type; this.detail = init ? init.detail : undefined; } }
  const winListeners = {};
  const storage = makeStorage(opts.storage, opts);
  const win = {
    document: doc,
    navigator: { languages: opts.languages || ['en-US'], language: (opts.languages || ['en-US'])[0] },
    location: { search: opts.search || '', hash: '', pathname: '/index.html', href: 'https://example.invalid/index.html' },
    get localStorage() { if (opts.noStorage) throw new Error('SecurityError'); return storage; },
    addEventListener(n, f) { (winListeners[n] = winListeners[n] || []).push(f); },
    removeEventListener() {},
    dispatchEvent() { return true; },
    CustomEvent,
    setTimeout, clearTimeout, setInterval, clearInterval,
    Promise, JSON, Math, Date, Object, Array, String, Number, Boolean, Error, RegExp, Map, Set,
    console: {
      log() {}, info(...a) { logs.info.push(a.join(' ')); },
      warn(...a) { logs.warn.push(a.join(' ')); }, error(...a) { logs.error.push(a.join(' ')); }
    }
  };
  win.window = win;
  win.self = win;
  const ctx = vm.createContext(win);
  const skip = new Set(opts.skip || []);
  const files = DATA_FILES.concat(ENGINE_FILES).filter(f => !skip.has(f));
  for (const f of files) {
    const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
    vm.runInContext(code, ctx, { filename: f });
  }
  return {
    win, doc, HG: win.HG, storage, events, logs,
    fireWin(name, ev) { (winListeners[name] || []).forEach(f => f(ev || { type: name })); },
    evCount(type) { return events.filter(e => e.type === type).length; }
  };
}

function achReward(page, id) {
  const a = (page.HG.data.achievements || []).find(x => x.id === id);
  if (!a) return 0;
  return a.reward != null ? a.reward : page.HG.unlocks.REWARD.achievement;
}
function newAchievements(items) { return (items || []).filter(i => i.kind === 'achievement').map(i => i.id); }
function hasItem(items, kind, id) { return (items || []).some(i => i.kind === kind && i.id === id); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ═══════════ tests ═══════════ */
async function main() {
  console.log('HAMIN GAMES · core smoke test');
  console.log('root: ' + ROOT);

  /* ── 1. load + default save ───────────────────────────── */
  group('1. load + default save creation');
  const P = throwsNot(() => makePage({ languages: ['ja-JP', 'en'] }), 'all data + save/i18n/unlocks load without throwing');
  if (!P) { console.log('\ncannot continue'); process.exit(1); }
  const { HG } = P;
  ok(HG.save && HG.i18n && HG.unlocks && HG.catalog && typeof HG.t === 'function' && typeof HG.addStrings === 'function',
    'HG.save / HG.i18n / HG.t / HG.addStrings / HG.unlocks / HG.catalog exist');
  ['get', 'set', 'update', 'persist', 'reset', 'exportJSON', 'downloadExport', 'importJSON'].forEach(m =>
    ok(typeof HG.save[m] === 'function', 'HG.save.' + m + '() exists'));
  ['finishGame', 'track', 'secret', 'earn', 'spend', 'buy', 'grant', 'has', 'status', 'evaluate', 'collectionProgress'].forEach(m =>
    ok(typeof HG.unlocks[m] === 'function', 'HG.unlocks.' + m + '() exists'));
  ['get', 'all'].forEach(m => ok(typeof HG.catalog[m] === 'function', 'HG.catalog.' + m + '() exists'));
  ok(same(plain(HG.catalog.kinds), ['wardrobe', 'sticker', 'frame', 'pose', 'background', 'room', 'memory', 'achievement']), 'HG.catalog.kinds matches §3.1');
  eq(HG.save.KEY, KEY, 'HG.save.KEY');
  eq(HG.save.VERSION, 1, 'HG.save.VERSION');
  eq(HG.save.isNew, true, 'fresh storage → isNew');
  eq(HG.save.status, 'ok', 'fresh storage → status ok');
  const d = HG.save.data;
  eq(d.version, 1, 'default save version 1');
  eq(d.hpoint, 0, 'default hpoint 0');
  eq(d.hpointEarned, 0, 'default hpointEarned 0');
  ok(d.visitorNo >= 1000 && d.visitorNo <= 9999, 'visitorNo is a random 4-digit number', d.visitorNo);
  ok(same(plain(d.settings), { music: 0.5, sfx: 0.7, muted: false, reducedMotion: 'auto', sparkles: true }), 'default settings match §3.2', plain(d.settings));
  ok(same(Object.keys(d.unlocked).sort(), ['background', 'frame', 'memory', 'pose', 'room', 'sticker', 'wardrobe']), 'unlocked has the 7 kinds');
  ok(Object.values(d.unlocked).every(a => Array.isArray(a) && a.length === 0), 'unlocked lists start empty');
  ['achievements', 'rules', 'stats', 'best', 'flags', 'seen'].forEach(k => ok(d[k] && typeof d[k] === 'object' && !Array.isArray(d[k]), 'default ' + k + ' is a map'));
  ok(same(plain(d.dressUp), { outfit: {}, looks: [], challengeStars: {} }), 'default dressUp');
  ok(same(plain(d.photoBooth), { transferLook: null, count: 0 }), 'default photoBooth');
  ok(same(plain(d.room), { layout: [] }) && same(plain(d.practice), { ranks: {} }), 'default room / practice');
  eq(HG.i18n.lang, 'ja', 'navigator.languages ja-JP → ja');
  eq(d.lang, 'ja', 'detected language stored in save.lang');
  eq(P.doc.documentElement.getAttribute('lang'), 'ja', '<html lang> updated');
  ok(HG.save.flush() === true, 'flush() writes to localStorage');
  const stored = JSON.parse(P.storage.getItem(KEY));
  ok(stored && stored.version === 1 && stored.lang === 'ja', 'stored JSON is a v1 save');

  /* ── 2. path helpers ──────────────────────────────────── */
  group('2. path helpers (dotted keys in flat maps)');
  const saveEvents0 = P.evCount('hg:save');
  HG.save.set('stats.lunch.rounds', 3);
  eq(HG.save.data.stats['lunch.rounds'], 3, "set('stats.lunch.rounds') writes the flat key");
  eq(HG.save.get('stats.lunch.rounds'), 3, "get('stats.lunch.rounds') reads it back");
  HG.save.set('flags.secret.test', true);
  eq(HG.save.data.flags['secret.test'], true, "set('flags.secret.test') writes the flat flag");
  HG.save.set('settings.muted', true);
  eq(HG.save.data.settings.muted, true, "set('settings.muted') writes nested settings");
  HG.save.set('settings.muted', false);
  eq(HG.save.get('nothing.here', 'def'), 'def', 'get() returns the default for missing paths');
  ok(P.evCount('hg:save') > saveEvents0, "set() emits 'hg:save'");
  HG.save.set('__proto__.polluted', 1);
  HG.save.set('stats.__proto__', 1);
  ok(({}).polluted === undefined && P.win.Object.prototype.polluted === undefined, 'no prototype pollution through set()');
  HG.save.update(dd => { delete dd.stats['lunch.rounds']; delete dd.flags['secret.test']; });

  /* ── 3. unlocks: finishGame ───────────────────────────── */
  group('3. finishGame (+50 finish, +100 new best, stats, rules, achievements)');
  let r = throwsNot(() => HG.unlocks.finishGame('lunch-time', { score: 800, stats: { inc: { 'lunch.rounds': 1 }, max: { 'lunch.bestCombo': 4 } } }),
    'finishGame(lunch-time, 800) runs');
  eq(r.earned, 150, 'first play with a score: earned = 50 + 100');
  eq(r.newBest, true, 'first play → newBest');
  eq(r.prevBest, null, 'prevBest null on first play');
  eq(HG.save.data.best['lunch-time'], 800, 'best stored under the gameKey');
  eq(HG.save.data.stats['games.played'], 1, "stat 'games.played' bumped");
  eq(HG.save.data.stats['games.played.lunch-time'], 1, "stat 'games.played.lunch-time' bumped");
  eq(HG.save.data.stats['lunch.rounds'], 1, 'stats.inc applied');
  eq(HG.save.data.stats['lunch.bestCombo'], 4, 'stats.max applied');
  ok(hasItem(r.unlocked, 'achievement', 'first-game'), "achievement 'first-game' awarded", plain(r.unlocked));
  ok(hasItem(r.unlocked, 'background', 'bg-cafeteria'), "rule 'lunch-play' granted bg-cafeteria", plain(r.unlocked));
  let expected = 150 + newAchievements(r.unlocked).reduce((s, id) => s + achReward(P, id), 0);
  eq(HG.save.data.hpoint, expected, 'hpoint = finish + best + achievement rewards');
  eq(HG.save.data.hpointEarned, expected, 'hpointEarned tracks lifetime points');
  ok((HG._popupQueue || []).some(p => p.type === 'record'), "a 'record' popup was queued (HG.ui absent → HG._popupQueue)");
  ok((HG._popupQueue || []).some(p => p.type === 'achievement' && p.id === 'first-game'), "an 'achievement' popup was queued");

  let hp = HG.save.data.hpoint;
  r = HG.unlocks.finishGame('lunch-time', { score: 500 });
  eq(r.earned, 50, 'lower score: only +50');
  eq(r.newBest, false, 'lower score → not a new best');
  eq(r.prevBest, 800, 'prevBest reported');
  eq(HG.save.data.best['lunch-time'], 800, 'best unchanged');
  eq(HG.save.data.hpoint, hp + 50 + newAchievements(r.unlocked).reduce((s, id) => s + achReward(P, id), 0), 'hpoint +50');

  hp = HG.save.data.hpoint;
  r = HG.unlocks.finishGame('lunch-time', { score: 1600 });
  eq(r.newBest, true, 'higher score → new best');
  eq(r.earned, 150, 'new best: +50 +100');
  ok(hasItem(r.unlocked, 'sticker', 'st-strawberry') && hasItem(r.unlocked, 'sticker', 'st-strawberry-milk') && hasItem(r.unlocked, 'memory', 'mem-003'),
    "best ≥ 1500 fires 'lunch-champion' (stickers + memory)", plain(r.unlocked));
  eq(HG.save.data.hpoint, hp + 150 + newAchievements(r.unlocked).reduce((s, id) => s + achReward(P, id), 0), 'hpoint +150');

  hp = HG.save.data.hpoint;
  r = HG.unlocks.finishGame('dress-up', { bonus: 999, bestKey: 'dressup.stars', score: 0 });
  eq(r.earned, 150, 'bonus is capped at +100 (50 + 100)');
  eq(r.newBest, false, 'score 0 is not a new best');
  r = HG.unlocks.finishGame('dress-up', { bestKey: 'dressup.stars', score: 4 });
  eq(HG.save.data.best['dressup.stars'], 4, 'bestKey overrides the gameKey for the record');
  eq(HG.save.data.stats['games.played.dress-up'], 2, 'games.played.<gameKey> uses the gameKey, not bestKey');
  const rNo = HG.unlocks.finishGame('', {});
  eq(rNo.earned, 0, 'finishGame without a gameKey does nothing');

  /* ── 4. rules with NO wardrobe catalog ────────────────── */
  group('4. rules fire even when data/wardrobe.js is missing');
  const Q = throwsNot(() => makePage({ skip: ['data/wardrobe.js'] }), 'page without data/wardrobe.js loads');
  if (Q) {
    eq(Q.HG.catalog.all('wardrobe').length, 0, 'wardrobe catalog is empty');
    const rq = throwsNot(() => Q.HG.unlocks.finishGame('run-hamin', { score: 1200, stats: { max: { 'run.bestDistance': 1200 }, inc: { 'run.totalDistance': 1200 } } }),
      'finishGame(run-hamin, 1200 m) does not crash');
    if (rq) {
      ok(Q.HG.unlocks.has('wardrobe', 'shoes-sporty-runner'), "run.bestDistance ≥ 1000 grants 'shoes-sporty-runner'");
      ok(plain(Q.HG.save.data.unlocked.wardrobe).indexOf('shoes-sporty-runner') >= 0, 'wardrobe id recorded in save.unlocked.wardrobe');
      ok(hasItem(rq.unlocked, 'room', 'room-trophy-run') && hasItem(rq.unlocked, 'sticker', 'st-trophy') && hasItem(rq.unlocked, 'pose', 'pose-run'),
        "'run-1000' also grants trophy / sticker / pose", plain(rq.unlocked));
      ok(hasItem(rq.unlocked, 'memory', 'mem-006'), "'run-500' grants mem-006");
      ok(hasItem(rq.unlocked, 'background', 'bg-park'), "'run-play' grants bg-park");
      ok(hasItem(rq.unlocked, 'achievement', 'run-hamin-run'), "achievement 'run-hamin-run' awarded");
      ok(Q.HG.save.data.rules['run-1000'] && Q.HG.save.data.rules['run-500'], 'fired rules recorded in save.rules');
      const pq = throwsNot(() => Q.HG.unlocks.collectionProgress(), 'collectionProgress() works without wardrobe data');
      ok(pq && pq.byKind.wardrobe && pq.byKind.wardrobe.total === 0, 'byKind.wardrobe.total is 0', pq && plain(pq.byKind.wardrobe));
      const st = Q.HG.unlocks.status('wardrobe', 'shoes-sporty-runner');
      eq(st.owned, true, 'status() of an uncatalogued but granted wardrobe item → owned');
    }
  }
  // …and the same rule with the real catalog
  const R = makePage();
  const rr = R.HG.unlocks.finishGame('run-hamin', { score: 1000, stats: { max: { 'run.bestDistance': 1000 } } });
  ok(hasItem(rr.unlocked, 'wardrobe', 'shoes-sporty-runner'), 'with the catalog: shoes-sporty-runner granted at exactly 1000 m');
  eq(R.HG.unlocks.status('wardrobe', 'shoes-sporty-runner').owned, true, 'status().owned after the grant');
  ok((R.HG._popupQueue || []).some(p => p.kind === 'wardrobe' && p.id === 'shoes-sporty-runner' && p.text && p.text !== 'wardrobe.shoes-sporty-runner.name'),
    'unlock popup for the shoes uses the translated item name');

  /* ── 5. achievements ──────────────────────────────────── */
  group('5. achievements (+150 default, custom reward, once only)');
  const A = makePage();
  let before = A.HG.save.data.hpoint;
  let fresh = A.HG.unlocks.track({ inc: { 'lunch.rounds': 10 } });
  ok(hasItem(fresh, 'achievement', 'lunch-master'), "track(lunch.rounds 10) → 'lunch-master'", plain(fresh));
  ok(hasItem(fresh, 'room', 'room-lunchbox'), "track(lunch.rounds 10) → rule 'lunch-rounds' grants room-lunchbox");
  eq(A.HG.save.data.hpoint - before, 150, 'default achievement reward +150');
  ok(typeof A.HG.save.data.achievements['lunch-master'] === 'string', 'achievement time stored as ISO string');
  before = A.HG.save.data.hpoint;
  fresh = A.HG.unlocks.track({ inc: { 'practice.hardClears': 1 } });
  ok(hasItem(fresh, 'achievement', 'hard-mode') && hasItem(fresh, 'wardrobe', 'bottom-track-pants'), "hard clear → 'hard-mode' + track pants", plain(fresh));
  eq(A.HG.save.data.hpoint - before, 200, "custom achievement reward ('hard-mode' +200)");
  before = A.HG.save.data.hpoint;
  fresh = A.HG.unlocks.track({ inc: { 'lunch.rounds': 5 } });
  eq(fresh.length, 0, 'already-awarded achievements do not fire again');
  eq(A.HG.save.data.hpoint, before, 'no points on repeat');
  eq(A.HG.unlocks.evaluate().length, 0, 'evaluate() is idempotent');
  fresh = A.HG.unlocks.track({ flags: ['practice.rank.S'] });
  ok(hasItem(fresh, 'achievement', 'rank-s') && hasItem(fresh, 'pose', 'pose-dance'), "flag condition: practice.rank.S → 'rank-s' + dance pose", plain(fresh));
  ok(A.evCount('hg:unlock') > 0, "'hg:unlock' events dispatched");

  /* ── 6. secrets ───────────────────────────────────────── */
  group('6. secret (+200, once per id)');
  before = A.HG.save.data.hpoint;
  const unlockEvents = A.events.length;
  eq(A.HG.unlocks.secret('hiddenSheep'), true, "secret('hiddenSheep') → true the first time");
  eq(A.HG.save.data.flags['secret.hiddenSheep'], true, "flag 'secret.hiddenSheep' set");
  const secretItems = A.events.slice(unlockEvents).filter(e => e.type === 'hg:unlock').reduce((a, e) => a.concat(e.detail.items), []);
  const secretAch = newAchievements(secretItems).reduce((s, id) => s + achReward(A, id), 0);
  ok(newAchievements(secretItems).indexOf('secret-sheep') >= 0, "secret → achievement 'secret-sheep'", plain(secretItems));
  ok(A.HG.unlocks.has('sticker', 'st-sheep-tiny'), "secret → rule 'secret-sheep' grants st-sheep-tiny");
  eq(A.HG.save.data.hpoint - before - secretAch, 200, 'secret itself gives exactly +200 (achievement rewards aside)');
  before = A.HG.save.data.hpoint;
  eq(A.HG.unlocks.secret('hiddenSheep'), false, 'second call → false');
  eq(A.HG.save.data.hpoint, before, 'second call gives no points');
  eq(A.HG.unlocks.secret(''), false, 'empty id → false');

  /* ── 7. buy / spend / earn ────────────────────────────── */
  group('7. exchange: buy() / spend() / earn()');
  const B = makePage();
  const U = B.HG.unlocks;
  eq(B.HG.save.data.hpoint, 0, 'fresh wallet is 0');
  let b = U.buy('sticker', 'st-heart-glossy');
  ok(b.ok === false && b.reason === 'notEnough' && b.cost === 120, 'insufficient points → {ok:false, reason:notEnough, cost}', plain(b));
  eq(U.has('sticker', 'st-heart-glossy'), false, 'item still locked');
  eq(U.buy('sticker', 'st-heart-pink').reason, 'owned', "default item → reason 'owned'");
  eq(U.buy('sticker', 'st-strawberry').reason, 'notForSale', "rule item → reason 'notForSale'");
  eq(U.buy('sticker', 'st-does-not-exist').reason, 'missing', "unknown id → reason 'missing'");
  const st0 = U.status('sticker', 'st-heart-glossy');
  ok(st0.locked && st0.type === 'hpoint' && st0.cost === 120 && st0.affordable === false, 'status() of a shop item', plain(st0));
  const stRule = U.status('sticker', 'st-strawberry');
  ok(stRule.locked && stRule.hintKey === 'hint.lunchScore' && stRule.ruleId === 'lunch-champion', 'status() of a rule item has hintKey + ruleId', plain(stRule));
  eq(U.earn(500), 500, 'earn(500) → 500');
  eq(B.HG.save.data.hpoint, 500, 'wallet 500');
  b = U.buy('sticker', 'st-heart-glossy');
  ok(b.ok === true && b.cost === 120, 'enough points → {ok:true, cost:120}', plain(b));
  eq(B.HG.save.data.hpoint, 380, 'cost deducted');
  eq(U.has('sticker', 'st-heart-glossy'), true, 'bought item owned');
  eq(U.buy('sticker', 'st-heart-glossy').reason, 'owned', 'buying twice → owned');
  eq(B.HG.save.data.hpointEarned, 500, 'spending does not lower hpointEarned');
  eq(U.spend(1000), false, 'spend() more than the wallet → false');
  eq(B.HG.save.data.hpoint, 380, 'wallet unchanged after failed spend');
  eq(U.spend(80), true, 'spend(80) → true');
  eq(B.HG.save.data.hpoint, 300, 'wallet 300');
  eq(U.grant('room', 'room-bookshelf'), true, 'grant() new item → true');
  eq(U.grant('room', 'room-bookshelf'), false, 'grant() owned item → false');
  eq(U.grant('room', 'room-bed'), false, 'grant() default item → false (always owned)');
  eq(U.has('room', 'room-bed'), true, "has() is true for unlock.type 'default'");

  /* ── 8. collection progress + milestones ──────────────── */
  group('8. collectionProgress + % milestone rules');
  const C = makePage();
  const p0 = C.HG.unlocks.collectionProgress();
  ok(p0 && typeof p0.owned === 'number' && typeof p0.total === 'number' && typeof p0.pct === 'number' && p0.byKind, 'shape {owned,total,pct,byKind}', plain(p0));
  const sumTot = Object.values(p0.byKind).reduce((s, k) => s + k.total, 0);
  const sumOwn = Object.values(p0.byKind).reduce((s, k) => s + k.owned, 0);
  eq(sumTot, p0.total, 'byKind totals add up to total');
  eq(sumOwn, p0.owned, 'byKind owned add up to owned');
  eq(p0.pct, p0.total ? Math.floor(p0.owned * 100 / p0.total) : 0, 'pct = floor(owned / total)');
  eq(p0.owned, 0, 'fresh save owns 0 counted items (starters excluded)');
  const pAll = C.HG.unlocks.collectionProgress({ includeDefaults: true });
  ok(pAll.total > p0.total && pAll.owned > 0, 'includeDefaults counts starter items too', plain({ total: pAll.total, owned: pAll.owned }));
  ok(['memory', 'wardrobe', 'pose', 'sticker', 'room', 'achievement'].every(k => p0.byKind[k] && p0.byKind[k].total > 0), 'byKind covers memory/wardrobe/pose/sticker/room/achievement');
  // grant counted items one by one until 25 % → rule 'collection-25' must fire by itself
  const pool = [];
  ['sticker', 'room', 'pose', 'wardrobe'].forEach(kind => C.HG.catalog.all(kind).forEach(it => {
    if (!C.HG.catalog.isDefault(kind, it) && it.slot !== 'body') pool.push([kind, it.id]);
  }));
  let guard = 0;
  while (!C.HG.save.data.rules['collection-25'] && pool.length && guard++ < 500) {
    const [kind, id] = pool.shift();
    C.HG.unlocks.grant(kind, id, { silent: true });
  }
  const p25 = C.HG.unlocks.collectionProgress();
  ok(!!C.HG.save.data.rules['collection-25'], "rule 'collection-25' fired on its own", plain({ pct: p25.pct }));
  ok(p25.pct >= 25, 'pct ≥ 25 when it fired', p25.pct);
  ok(C.HG.unlocks.has('background', 'bg-starry') && C.HG.unlocks.has('frame', 'fr-webcam-y2k'), 'collection-25 grants bg-starry + fr-webcam-y2k');

  /* ── 9. hpoint.earned stat ────────────────────────────── */
  group("9. 'hpoint.earned' condition follows save.hpointEarned");
  const E = makePage({ storage: { [KEY]: JSON.stringify({ version: 1, hpoint: 10, hpointEarned: 5200 }) } });
  const fe = E.HG.unlocks.evaluate();
  ok(!!E.HG.save.data.achievements.rich, "imported save with hpointEarned 5200 → achievement 'rich'", plain(fe));
  ok(!!E.HG.save.data.rules['hpoint-collector'] && E.HG.unlocks.has('memory', 'mem-018'), "rule 'hpoint-collector' → mem-018");
  const F = makePage();
  F.HG.unlocks.earn(3000);
  ok(F.HG.unlocks.has('memory', 'mem-018'), 'earning 3000 H-POINT live grants mem-018');

  /* ── 10. migration ────────────────────────────────────── */
  group('10. migration v0 → v1 (localStorage + import)');
  const v0 = {
    version: 0, points: 420, pointsEarned: 900, language: 'ko',
    stats: { lunch: { rounds: 12, bestCombo: 7 }, games: { played: 3 } },
    best: { 'lunch-time': 1300 },
    flags: { secret: { logoStars: true } },
    unlocked: { sticker: { 'st-heart-glossy': true, 'st-ramen': false }, room: ['room-bookshelf'] },
    achievements: ['first-game'],
    settings: { music: 2, sfx: 0.3, reducedMotion: true },
    extraOldField: 'kept'
  };
  const M = throwsNot(() => makePage({ storage: { [KEY]: JSON.stringify(v0) }, languages: ['en-US'] }), 'page loads with a v0 save in storage');
  if (M) {
    const md = M.HG.save.data;
    eq(M.HG.save.isNew, false, 'migrated save is not "new"');
    eq(md.version, 1, 'version → 1');
    eq(md.hpoint, 420, 'points → hpoint');
    eq(md.hpointEarned, 900, 'pointsEarned → hpointEarned');
    eq(md.lang, 'ko', 'language → lang');
    eq(M.HG.i18n.lang, 'ko', 'saved language wins over navigator.languages');
    eq(md.stats['lunch.rounds'], 12, 'nested stats flattened (lunch.rounds)');
    eq(md.stats['games.played'], 3, 'nested stats flattened (games.played)');
    eq(md.best['lunch-time'], 1300, 'best kept');
    eq(md.flags['secret.logoStars'], true, 'nested flags flattened');
    ok(same(plain(md.unlocked.sticker), ['st-heart-glossy']), '{id:true} unlocked map → array (false entries dropped)', plain(md.unlocked.sticker));
    ok(same(plain(md.unlocked.room), ['room-bookshelf']), 'unlocked arrays kept');
    ok(typeof md.achievements['first-game'] === 'string', 'achievement id array → {id: ISO}');
    eq(md.settings.music, 1, 'out-of-range volume clamped');
    eq(md.settings.reducedMotion, 'on', 'boolean reducedMotion → "on"');
    ok(same(plain(md.dressUp), { outfit: {}, looks: [], challengeStars: {} }), 'missing sections filled with defaults');
    eq(md.extraOldField, 'kept', 'unknown extra fields are kept (forward compatible)');
    ok(!('points' in md) && !('language' in md), 'old field names removed');
    ok(M.HG.unlocks.has('sticker', 'st-heart-glossy'), 'migrated unlocks are owned');
    M.HG.save.flush();
    eq(JSON.parse(M.storage.getItem(KEY)).version, 1, 'migrated save written back as v1');
  }
  const noVer = makePage({ storage: { [KEY]: JSON.stringify({ hpoint: 5, stats: { run: { caught: 2 } } }) } });
  eq(noVer.HG.save.data.stats['run.caught'], 2, 'save without a version is treated as v0 and flattened');
  eq(noVer.HG.save.data.hpoint, 5, '…and keeps its v1 fields');
  const v1 = makePage({ storage: { [KEY]: JSON.stringify({ version: 1, hpoint: 7, stats: { 'lunch.rounds': 2 }, seen: { 'col.sticker:st-mic': true } }) } });
  eq(v1.HG.save.data.stats['lunch.rounds'], 2, 'v1 dotted keys untouched');
  eq(v1.HG.save.data.seen['col.sticker:st-mic'], true, 'v1 seen map untouched');

  /* ── 11. broken storage ───────────────────────────────── */
  group('11. future / corrupt / private-mode storage never crash');
  const fut = makePage({ storage: { [KEY]: JSON.stringify({ version: 99, hpoint: 12345 }) } });
  eq(fut.HG.save.status, 'future', 'newer save → status future');
  eq(fut.HG.save.data.hpoint, 0, 'newer save → fresh start');
  ok(JSON.parse(fut.storage.getItem(KEY + '.backup')).version === 99, 'newer save kept in haminGamesSave.backup');
  const bad = makePage({ storage: { [KEY]: '{not json' } });
  eq(bad.HG.save.status, 'corrupt', 'corrupt JSON → status corrupt');
  eq(bad.storage.getItem(KEY + '.backup'), '{not json', 'corrupt raw text kept in backup');
  const priv = throwsNot(() => makePage({ throwSet: true }), 'setItem throwing (private mode / quota) → page still loads');
  if (priv) {
    eq(priv.HG.save.memoryOnly, true, 'memoryOnly = true');
    eq(priv.HG.save.status, 'memory', "status 'memory'");
    const pr = throwsNot(() => priv.HG.unlocks.finishGame('run-hamin', { score: 300 }), 'finishGame works in memory-only mode');
    ok(pr && pr.earned === 150 && priv.HG.save.data.hpoint >= 150, 'points still counted in memory', pr && plain(pr));
    eq(priv.HG.save.flush(), false, 'flush() reports false instead of throwing');
  }
  const blocked = throwsNot(() => makePage({ noStorage: true }), 'window.localStorage getter throwing → page still loads');
  if (blocked) eq(blocked.HG.save.memoryOnly, true, 'blocked storage → memoryOnly');

  /* ── 12. export / import ──────────────────────────────── */
  group('12. export → import round trip + validation');
  const X = makePage();
  X.HG.unlocks.finishGame('photo-booth', { stats: { inc: { 'photo.created': 5 } } });
  X.HG.unlocks.secret('logoStars');
  X.HG.save.set('dressUp.outfit', { head: 'hair-era-a', top: 'top-mono-mockneck' });
  const dataRef = X.HG.save.data;
  const exported = X.HG.save.exportJSON();
  ok(typeof exported === 'string' && exported.indexOf('\n  ') > 0, 'exportJSON() returns pretty JSON');
  const snapshot = JSON.parse(exported);
  X.HG.unlocks.earn(999);
  X.HG.save.set('lang', 'en');
  const imp = X.HG.save.importJSON(exported);
  eq(imp.ok, true, 'importJSON(exported) → ok');
  const after = plain(X.HG.save.data);
  delete after.updatedAt; delete snapshot.updatedAt;
  ok(same(after, snapshot), 'imported data equals the export (except updatedAt)');
  ok(X.HG.save.data === dataRef, 'HG.save.data keeps the same object identity after import');
  ok(X.storage.getItem(KEY + '.backup') != null, 'replaced progress kept in the backup key');
  eq(JSON.parse(X.storage.getItem(KEY)).hpoint, snapshot.hpoint, 'import is written to localStorage immediately');
  eq(X.HG.save.importJSON('nope').error, 'parse', "garbage → error 'parse'");
  eq(X.HG.save.importJSON('[1,2]').error, 'invalid', "array → error 'invalid'");
  eq(X.HG.save.importJSON('{"foo":1}').error, 'invalid', "unrelated JSON → error 'invalid'");
  eq(X.HG.save.importJSON(JSON.stringify({ version: 99, hpoint: 1 })).error, 'newer', "newer version → error 'newer'");
  eq(X.HG.save.importJSON(123).error, 'parse', "non-string → error 'parse'");
  eq(X.HG.save.data.hpoint, snapshot.hpoint, 'failed imports leave the save untouched');
  const impV0 = X.HG.save.importJSON(JSON.stringify({ version: 0, points: 77, stats: { run: { snacks: 4 } } }));
  eq(impV0.ok, true, 'importing a v0 file works');
  eq(X.HG.save.data.hpoint, 77, 'v0 import migrated (points → hpoint)');
  eq(X.HG.save.data.stats['run.snacks'], 4, 'v0 import migrated (nested stats)');
  const evil = X.HG.save.importJSON('{"hpoint":5,"__proto__":{"polluted":1},"stats":{"__proto__":{"x":1},"ok.stat":2}}');
  eq(evil.ok, true, 'import with __proto__ keys is accepted but sanitised');
  ok(X.win.Object.prototype.polluted === undefined && ({}).polluted === undefined, 'no prototype pollution through import');
  eq(X.HG.save.data.stats['ok.stat'], 2, 'normal keys next to __proto__ survive');
  eq(X.HG.save.checkImport('{"hpoint":1}').ok, true, 'checkImport() validates without applying');

  /* ── 13. reset ────────────────────────────────────────── */
  group('13. reset()');
  X.HG.save.set('lang', 'ja');
  X.HG.save.set('settings.music', 0.2);
  X.HG.unlocks.earn(50);
  X.HG.save.reset({ keepPrefs: true });
  eq(X.HG.save.data.hpoint, 0, 'reset wipes progress');
  eq(X.HG.save.data.lang, 'ja', 'reset({keepPrefs:true}) keeps the language');
  eq(X.HG.save.data.settings.music, 0.2, 'reset({keepPrefs:true}) keeps settings');
  X.HG.save.reset();
  eq(X.HG.save.data.lang, null, 'reset() wipes everything');
  eq(JSON.parse(X.storage.getItem(KEY)).hpoint, 0, 'reset written to storage');

  /* ── 14. i18n ─────────────────────────────────────────── */
  group('14. i18n');
  const L = makePage({ languages: ['fr-FR', 'de'] });
  eq(L.HG.i18n.lang, 'en', 'unsupported navigator languages → en');
  const tbl = L.HG.i18n._table;
  const langs = ['en', 'ko', 'zh-CN', 'ja'];
  ok(same(plain(L.HG.i18n.langs), langs.slice().sort((a, b) => ['ko', 'zh-CN', 'ja', 'en'].indexOf(a) - ['ko', 'zh-CN', 'ja', 'en'].indexOf(b))), 'exactly ko / zh-CN / ja / en');
  const enKeys = Object.keys(tbl.en).sort();
  langs.forEach(l => {
    const ks = Object.keys(tbl[l]).sort();
    const miss = enKeys.filter(k => !(k in tbl[l]));
    const extra = ks.filter(k => !(k in tbl.en));
    ok(!miss.length && !extra.length, l + ': same ' + enKeys.length + ' keys as en', { missing: miss.slice(0, 5), extra: extra.slice(0, 5) });
  });
  ok(L.HG.t('nav.home') && L.HG.t('nav.home') !== 'nav.home', "t('nav.home') resolves");
  ok(String(L.HG.t('popup.reward', { n: 150 })).indexOf('150') >= 0, 'placeholders are filled');
  eq(L.HG.t('no.such.key'), 'no.such.key', 'missing key → the key itself');
  ok(L.logs.warn.some(w => w.indexOf('no.such.key') >= 0), 'missing key warns once');
  eq(L.HG.i18n.set('zh'), true, "set('zh') accepted");
  eq(L.HG.i18n.lang, 'zh-CN', "'zh' → zh-CN");
  eq(L.doc.documentElement.getAttribute('lang'), 'zh-Hans', '<html lang> zh-Hans for zh-CN');
  eq(L.HG.save.data.lang, 'zh-CN', 'set() saves the language');
  ok(L.evCount('hg:lang') === 1, "set() emits 'hg:lang'");
  eq(L.HG.i18n.set('xx'), false, 'unknown language rejected');
  L.HG.i18n.set('ja');
  const wname = L.HG.i18n.itemName('wardrobe', 'shoes-sporty-runner');
  eq(wname, tbl.ja['wardrobe.shoes-sporty-runner.name'], 'itemName(wardrobe, id) uses translations-wardrobe.js');
  ok(L.HG.i18n.itemName('sticker', 'st-heart-pink') !== 'sticker.st-heart-pink.name', 'itemName(sticker, id) resolves');
  eq(L.HG.i18n.itemName('room', 'room-unknown-thing'), 'Unknown Thing', 'itemName() prettifies unknown ids instead of showing the key');
  const Z = makePage({ search: '?lang=ko', languages: ['ja'] });
  eq(Z.HG.i18n.lang, 'ko', '?lang=ko overrides navigator.languages');
  // Every catalog item has a name in every language (what the collection/popup show).
  const namesMissing = [];
  ['wardrobe', 'sticker', 'frame', 'pose', 'background', 'room', 'memory', 'achievement'].forEach(kind => {
    L.HG.catalog.all(kind).forEach(it => langs.forEach(l => {
      if (!(kind + '.' + it.id + '.name' in tbl[l])) namesMissing.push(l + ':' + kind + '.' + it.id);
    }));
  });
  ok(!namesMissing.length, 'every catalog item has a name in all 4 languages', namesMissing.slice(0, 8));
  const gamesMissing = [];
  L.HG.data.games.forEach(g => [g.titleKey, g.descKey].forEach(k => langs.forEach(l => { if (k && !(k in tbl[l])) gamesMissing.push(l + ':' + k); })));
  ok(!gamesMissing.length, 'every game title/desc key exists in all 4 languages', gamesMissing.slice(0, 8));

  /* Literal keys used by page code / markup must exist in all 4 languages:
     t('k') · HG.t('k') · i18n: 'k' · labelKey/titleKey/textKey/okKey/cancelKey/helpKey: 'k'
     · data-i18n="k" · data-i18n-attr="attr:k;…" · i18nAttr: 'attr:k;…' */
  const codeFiles = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f)
    .concat(fs.readdirSync(ROOT).filter(f => f.endsWith('.html')));
  const codeMissing = [];
  let codeKeys = 0;
  codeFiles.forEach(f => {
    let s = fs.readFileSync(path.join(ROOT, f), 'utf8');
    if (f.endsWith('.js')) s = s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');   // skip doc comments
    const found = new Set();
    // a literal directly followed by "+" is a prefix completed at runtime ('home.today.l' + n)
    for (const m of s.matchAll(/\b(?:HG\.)?t\(\s*'([A-Za-z][\w.-]*)'(?!\s*\+)/g)) found.add(m[1]);
    for (const m of s.matchAll(/\b(?:i18n|labelKey|titleKey|textKey|okKey|cancelKey|helpKey|bodyKey|reasonKey)\s*:\s*'([A-Za-z][\w.-]*)'(?!\s*\+)/g)) found.add(m[1]);
    for (const m of s.matchAll(/data-i18n="([^"]+)"/g)) found.add(m[1]);
    for (const m of s.matchAll(/(?:data-i18n-attr="|i18nAttr:\s*')([^"']+)["']/g)) {
      m[1].split(';').forEach(p => { const k = p.split(':')[1]; if (k && k.trim()) found.add(k.trim()); });
    }
    found.forEach(k => {
      if (/\.$/.test(k) || k.indexOf('.') < 0) return;           // prefixes completed at runtime ('kind.' + k)
      codeKeys++;
      langs.forEach(l => { if (!(k in tbl[l])) codeMissing.push(f + ' ' + l + ':' + k); });
    });
  });
  const coreMissing = codeMissing.filter(x => CORE_CODE.indexOf(x.split(' ')[0]) >= 0);
  const otherMissing = codeMissing.filter(x => CORE_CODE.indexOf(x.split(' ')[0]) < 0);
  ok(!coreMissing.length, 'literal keys used by the engine + portal pages exist in all 4 languages (' + codeKeys + ' keys scanned)', coreMissing.slice(0, 10));
  if (otherMissing.length) {
    const byFile = {};
    otherMissing.forEach(x => { const f = x.split(' ')[0]; byFile[f] = (byFile[f] || 0) + 1; });
    console.log('  · note: other pages reference keys not (yet) translated: ' + JSON.stringify(byFile) + '  (run with -v to list)');
    if (VERBOSE) otherMissing.forEach(x => console.log('      ' + x));
  }

  /* ── 15. debounced persistence ────────────────────────── */
  group('15. debounced persist()');
  const D2 = makePage();
  D2.HG.unlocks.earn(321);
  ok(JSON.parse(D2.storage.getItem(KEY) || '{"hpoint":0}').hpoint !== 321, 'not written synchronously (debounced)');
  await sleep(220);
  eq(JSON.parse(D2.storage.getItem(KEY)).hpoint, 321, 'written after ~150 ms');
  D2.HG.unlocks.earn(1);
  D2.fireWin('pagehide');
  eq(JSON.parse(D2.storage.getItem(KEY)).hpoint, 322, "flushed immediately on 'pagehide'");

  console.log('\n' + (failed ? '✗' : '✓') + ' ' + passed + ' passed, ' + failed + ' failed');
  process.exitCode = failed ? 1 : 0;
}

main().catch(e => { console.error(e); process.exitCode = 1; });

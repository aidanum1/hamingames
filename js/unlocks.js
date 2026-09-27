/* HAMIN GAMES — js/unlocks.js
   Rewards + cross-game unlock rules engine (docs/CONTRACT.md §3.5, §7).
   Games only REPORT what happened (scores, stats, flags); data/unlock-rules.js
   and data/achievements.js decide what that unlocks.

   HG.unlocks.finishGame(gameKey, {score, stats, flags, bestKey, bonus})
       → {earned, newBest, prevBest, best, unlocked:[{kind,id}]}
   HG.unlocks.track({inc, max, set, flags})       mid-game progress (+ evaluate)
   HG.unlocks.secret(id)       once per id: flag 'secret.<id>', +200, popup → bool
   HG.unlocks.earn(n, reasonKey?)   → points added (popup only when reasonKey is given)
   HG.unlocks.spend(n)         → bool
   HG.unlocks.buy(kind, id)    → {ok, reason?, cost?}  reason: missing|owned|notForSale|notEnough
   HG.unlocks.grant(kind, id, {silent}) → bool (false if already owned)
   HG.unlocks.has(kind, id)    → owned? ('default' items are always owned)
   HG.unlocks.status(kind, id) → {owned, locked, type, cost?, affordable?, hintKey?, ruleId?, secret?}
   HG.unlocks.evaluate()       → newly unlocked [{kind,id}] (achievements use kind 'achievement')
   HG.unlocks.collectionProgress({includeDefaults}) → {owned, total, pct, byKind:{kind:{owned,total}}}

   H-POINT: finish +50 · new best +100 · achievement +150 (or its `reward`) · secret +200.
   Optional per-game `bonus` in finishGame is capped at +100.
   Collection % counts memory, wardrobe (except slot 'body'), pose, sticker, room and
   achievement. Starter ('default') items are left out of the % by default, so the
   25 / 30 / 50 % milestones measure what the player actually earned.
   Every batch dispatches document event 'hg:unlock' {items:[{kind,id}]}. */
(function (HG, win, doc) {
  'use strict';

  var U = HG.unlocks = HG.unlocks || {};
  var REWARD = { finish: 50, newBest: 100, achievement: 150, secret: 200, maxBonus: 100 };
  var PROGRESS_KINDS = ['memory', 'wardrobe', 'pose', 'sticker', 'room', 'achievement'];

  function S() { return HG.save && HG.save.data; }
  function t(k, p) { return HG.t ? HG.t(k, p) : k; }
  function num(v) { v = Number(v); return isFinite(v) ? v : 0; }
  function nowISO() { return new Date().toISOString(); }
  function cat() { return HG.catalog; }
  function emit(name, detail) {
    var ev;
    try { ev = new CustomEvent(name, { detail: detail }); }
    catch (e) { ev = doc.createEvent('CustomEvent'); ev.initCustomEvent(name, false, false, detail); }
    doc.dispatchEvent(ev);
  }

  /* Popups go through HG.ui.popup (main.js). Before main.js exists they wait
     on HG._popupQueue, which main.js drains on init. */
  function queue(p) {
    if (HG.ui && typeof HG.ui.popup === 'function') HG.ui.popup(p);
    else (HG._popupQueue = HG._popupQueue || []).push(p);
  }

  /* All save mutations happen inside one HG.save.update() → one persist + one event. */
  function mutate(fn) {
    var r;
    if (!S()) return r;
    HG.save.update(function (d) {
      ['stats', 'best', 'flags', 'rules', 'achievements', 'unlocked'].forEach(function (k) {
        if (!d[k] || typeof d[k] !== 'object') d[k] = {};
      });
      r = fn(d);
    });
    return r;
  }

  function announce(items) { if (items && items.length) emit('hg:unlock', { items: items }); }

  /* ── Ownership ───────────────────────────────────────────── */
  function hasIn(d, kind, id) {
    if (!d || !kind || id == null) return false;
    if (kind === 'achievement') return !!(d.achievements && d.achievements[id]);
    var c = cat();
    var item = c ? c.get(kind, id) : null;
    if (item && c.isDefault(kind, item)) return true;
    var arr = d.unlocked && d.unlocked[kind];
    return !!(arr && arr.indexOf(id) !== -1);
  }

  function grantInto(d, kind, id, silent) {
    if (!kind || id == null) return false;
    if (kind === 'achievement') {
      if (d.achievements[id]) return false;
      d.achievements[id] = nowISO();
      return true;
    }
    if (hasIn(d, kind, id)) return false;
    if (!Array.isArray(d.unlocked[kind])) d.unlocked[kind] = [];
    d.unlocked[kind].push(id);
    if (!silent) popupItem(kind, id);
    return true;
  }

  function popupItem(kind, id) {
    var c = cat();
    var known = !!(c && c.get(kind, id));
    var hasName = !!(HG.i18n && HG.i18n.has(kind + '.' + id + '.name'));
    if (!known && !hasName) return;             // unknown id (catalog not loaded) → stay quiet
    var name = HG.i18n ? HG.i18n.itemName(kind, id) : id;
    var isMem = kind === 'memory';
    queue({ type: isMem ? 'memory' : 'unlock', title: t(isMem ? 'popup.memory.title' : 'popup.unlock.title'),
            text: name, kind: kind, id: id });
  }

  function addPoints(d, n) {
    n = Math.max(0, Math.round(num(n)));
    if (!n) return 0;
    d.hpoint = num(d.hpoint) + n;
    d.hpointEarned = num(d.hpointEarned) + n;
    d.stats['hpoint.earned'] = num(d.stats['hpoint.earned']) + n;
    return n;
  }

  /* ── Collection progress ─────────────────────────────────── */
  function progressIn(d, includeDefaults) {
    var c = cat();
    var byKind = {}, owned = 0, total = 0;
    PROGRESS_KINDS.forEach(function (kind) {
      var o = 0, tot = 0;
      var list = c ? c.all(kind) : [];
      for (var i = 0; i < list.length; i++) {
        var it = list[i];
        if (!it || it.id == null) continue;
        if (kind === 'wardrobe' && it.slot === 'body') continue;
        var def = c.isDefault(kind, it);
        if (def && !includeDefaults) continue;
        tot++;
        if (def || hasIn(d, kind, it.id)) o++;
      }
      byKind[kind] = { owned: o, total: tot };
      owned += o; total += tot;
    });
    return { owned: owned, total: total, pct: total ? Math.floor(owned * 100 / total) : 0, byKind: byKind };
  }

  function memoriesOwned(d) {
    var list = cat() ? cat().all('memory') : [];
    if (!list.length) return (d.unlocked.memory || []).length;
    var n = 0;
    for (var i = 0; i < list.length; i++) if (hasIn(d, 'memory', list[i].id)) n++;
    return n;
  }

  /* ── Condition language (§7) ─────────────────────────────── */
  function gte(c) { return c.gte != null ? num(c.gte) : 1; }

  /* Stat value for conditions. 'hpoint.earned' (used by achievements.js and
     unlock-rules.js) mirrors the save's lifetime counter `hpointEarned` (§3.2):
     take the larger so imported / migrated saves without the stat still count. */
  function statOf(d, k) {
    var v = num(d.stats[k]);
    return k === 'hpoint.earned' ? Math.max(v, num(d.hpointEarned)) : v;
  }

  function test(c, d, cache) {
    if (!c || typeof c !== 'object') return false;
    if (Array.isArray(c.all)) { for (var i = 0; i < c.all.length; i++) if (!test(c.all[i], d, cache)) return false; return true; }
    if (Array.isArray(c.any)) { for (var j = 0; j < c.any.length; j++) if (test(c.any[j], d, cache)) return true; return false; }
    if (c.not) return !test(c.not, d, cache);
    if (c.stat != null) return statOf(d, c.stat) >= gte(c);
    if (c.best != null) return d.best[c.best] != null && num(d.best[c.best]) >= gte(c);
    if (c.flag != null) return !!d.flags[c.flag];
    if (c.achievement != null) return !!d.achievements[c.achievement];
    if (c.owned != null) {
      var ref = cat() ? cat().parseRef(c.owned) : { kind: String(c.owned).split(':')[0], id: String(c.owned).split(':')[1] };
      return hasIn(d, ref.kind, ref.id);
    }
    if (c.memories != null) return memoriesOwned(d) >= num(c.memories);
    if (c.collectionPct != null) {
      if (cache.pct == null) cache.pct = progressIn(d, false).pct;
      return cache.pct >= num(c.collectionPct);
    }
    if (c.hpoint != null) return num(d.hpoint) >= num(c.hpoint);
    return false;
  }

  /* Run rules + achievements until nothing changes (grants can chain, e.g.
     collection % or H-POINT totals). Returns the newly unlocked items. */
  function evaluateInto(d) {
    var out = [];
    var rules = (HG.data && HG.data.unlockRules) || [];
    var achs = (HG.data && HG.data.achievements) || [];
    for (var pass = 0; pass < 12; pass++) {
      var changed = false;
      var cache = {};
      for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        if (!r || !r.id || d.rules[r.id]) continue;
        if (!test(r.when, d, cache)) continue;
        d.rules[r.id] = nowISO();
        changed = true;
        (r.grant || []).forEach(function (g) {
          if (!g) return;
          if (g.kind === 'hpoint') {
            var got = addPoints(d, g.amount);
            if (got) queue({ type: 'hpoint', title: t('popup.hpoint.title'), text: t('popup.reward', { n: got }), icon: '💰' });
          } else if (grantInto(d, g.kind, g.id, false)) {
            out.push({ kind: g.kind, id: g.id });
          }
        });
        cache = {};
      }
      for (var k = 0; k < achs.length; k++) {
        var a = achs[k];
        if (!a || !a.id || d.achievements[a.id]) continue;
        if (!test(a.when, d, cache)) continue;
        d.achievements[a.id] = nowISO();
        var reward = addPoints(d, a.reward != null ? a.reward : REWARD.achievement);
        var name = HG.i18n ? HG.i18n.itemName('achievement', a.id) : a.id;
        queue({ type: 'achievement', title: t('popup.achievement.title'),
                text: name + (reward ? '\n' + t('popup.reward', { n: reward }) : ''),
                icon: a.icon || '★', kind: 'achievement', id: a.id });
        out.push({ kind: 'achievement', id: a.id });
        changed = true;
        cache = {};
      }
      if (!changed) break;
    }
    return out;
  }

  function applyStats(d, s) {
    if (!s || typeof s !== 'object') return;
    var k;
    if (s.inc) for (k in s.inc) if (Object.prototype.hasOwnProperty.call(s.inc, k)) d.stats[k] = num(d.stats[k]) + num(s.inc[k]);
    if (s.max) for (k in s.max) if (Object.prototype.hasOwnProperty.call(s.max, k)) d.stats[k] = Math.max(num(d.stats[k]), num(s.max[k]));
    if (s.set) for (k in s.set) if (Object.prototype.hasOwnProperty.call(s.set, k)) d.stats[k] = num(s.set[k]);
  }

  function applyFlags(d, f) {
    if (!f) return;
    if (typeof f === 'string') f = [f];
    if (Array.isArray(f)) f.forEach(function (x) { if (x) d.flags[x] = true; });
    else if (typeof f === 'object') for (var k in f) if (Object.prototype.hasOwnProperty.call(f, k)) d.flags[k] = f[k];
  }

  function gameEntry(gameKey, bestKey) {
    var games = (HG.data && HG.data.games) || [];
    for (var i = 0; i < games.length; i++) if (games[i].id === gameKey) return games[i];
    for (var j = 0; j < games.length; j++) if (games[j].bestKey && games[j].bestKey === bestKey) return games[j];
    return null;
  }

  function formatScore(score, fmt) {
    if (HG.ui && HG.ui.formatScore) return HG.ui.formatScore(score, fmt);
    return String(score);
  }

  /* ── Public API ──────────────────────────────────────────── */
  U.REWARD = REWARD;

  U.finishGame = function (gameKey, o) {
    o = o || {};
    var res = { earned: 0, newBest: false, prevBest: null, best: null, unlocked: [] };
    if (!S() || !gameKey) return res;
    var key = o.bestKey || gameKey;
    mutate(function (d) {
      applyStats(d, o.stats);
      applyFlags(d, o.flags);
      d.stats['games.played'] = num(d.stats['games.played']) + 1;
      d.stats['games.played.' + gameKey] = num(d.stats['games.played.' + gameKey]) + 1;

      var earned = addPoints(d, REWARD.finish);
      if (o.bonus) earned += addPoints(d, Math.min(REWARD.maxBonus, Math.max(0, num(o.bonus))));

      var prev = d.best[key];
      res.prevBest = (typeof prev === 'number' && isFinite(prev)) ? prev : null;
      var score = Number(o.score);
      if (o.score != null && isFinite(score) && score > (res.prevBest == null ? 0 : res.prevBest)) {
        d.best[key] = score;
        res.newBest = true;
        var bonus = addPoints(d, REWARD.newBest);
        earned += bonus;
        var g = gameEntry(gameKey, key);
        queue({ type: 'record', title: t('popup.record.title'),
                text: t('popup.record.text', { game: g ? t(g.titleKey) : gameKey, score: formatScore(score, g && g.bestFormat) }) +
                      '\n' + t('popup.reward', { n: bonus }),
                icon: (g && g.icon) || '🏆' });
      }
      res.best = (typeof d.best[key] === 'number') ? d.best[key] : null;
      res.earned = earned;
      res.unlocked = evaluateInto(d);
    });
    announce(res.unlocked);
    return res;
  };

  U.track = function (o) {
    o = o || {};
    var fresh = mutate(function (d) {
      applyStats(d, o);
      applyFlags(d, o.flags);
      return evaluateInto(d);
    }) || [];
    announce(fresh);
    return fresh;
  };

  U.secret = function (id) {
    var d0 = S();
    if (!d0 || !id) return false;
    var key = 'secret.' + id;
    if (d0.flags && d0.flags[key]) return false;
    var fresh = mutate(function (d) {
      d.flags[key] = true;
      var got = addPoints(d, REWARD.secret);
      queue({ type: 'secret', title: t('popup.secret.title'), text: t('popup.secret.text', { n: got }), icon: '✨' });
      return evaluateInto(d);
    }) || [];
    announce(fresh);
    return true;
  };

  U.earn = function (n, reasonKey) {
    var got = 0;
    var fresh = mutate(function (d) {
      got = addPoints(d, n);
      if (got && reasonKey) {
        queue({ type: 'hpoint', title: t('popup.hpoint.title'),
                text: t(reasonKey) + '\n' + t('popup.reward', { n: got }), icon: '💰' });
      }
      return evaluateInto(d);
    }) || [];
    announce(fresh);
    return got;
  };

  U.spend = function (n) {
    var d0 = S();
    n = Math.max(0, Math.round(num(n)));
    if (!d0 || num(d0.hpoint) < n) return false;
    if (!n) return true;
    mutate(function (d) { d.hpoint = num(d.hpoint) - n; });
    return true;
  };

  U.buy = function (kind, id) {
    var d0 = S();
    var c = cat();
    var item = c ? c.get(kind, id) : null;
    if (!d0 || !item) return { ok: false, reason: 'missing' };
    if (hasIn(d0, kind, id)) return { ok: false, reason: 'owned' };
    var u = c.unlockOf(kind, item);
    if (u.type !== 'hpoint') return { ok: false, reason: 'notForSale' };
    var cost = Math.max(0, Math.round(num(u.cost)));
    if (num(d0.hpoint) < cost) return { ok: false, reason: 'notEnough', cost: cost, need: cost - num(d0.hpoint) };
    var fresh = mutate(function (d) {
      d.hpoint = num(d.hpoint) - cost;
      grantInto(d, kind, id, true);
      return evaluateInto(d);
    }) || [];
    announce([{ kind: kind, id: id }].concat(fresh));
    return { ok: true, cost: cost };
  };

  U.grant = function (kind, id, opts) {
    var silent = !!(opts && opts.silent);
    var ok = false;
    var fresh = mutate(function (d) {
      ok = grantInto(d, kind, id, silent);
      return ok ? evaluateInto(d) : [];
    }) || [];
    if (ok) announce([{ kind: kind, id: id }].concat(fresh));
    return ok;
  };

  U.has = function (kind, id) { return hasIn(S(), kind, id); };

  var ruleIndex = null;
  function ruleFor(kind, id) {
    var rules = (HG.data && HG.data.unlockRules) || [];
    if (!ruleIndex || ruleIndex.len !== rules.length) {
      var map = {};
      rules.forEach(function (r) {
        (r.grant || []).forEach(function (g) { if (g && g.kind !== 'hpoint') map[g.kind + ':' + g.id] = map[g.kind + ':' + g.id] || r.id; });
      });
      ruleIndex = { len: rules.length, map: map };
    }
    return ruleIndex.map[kind + ':' + id] || null;
  }

  U.status = function (kind, id) {
    var d = S();
    var c = cat();
    var item = c ? c.get(kind, id) : null;
    var owned = hasIn(d, kind, id);
    var u = c ? c.unlockOf(kind, item || id) : { type: 'default' };
    var st = { owned: owned, locked: !owned, type: u.type };
    if (u.type === 'hpoint') {
      st.cost = Math.max(0, Math.round(num(u.cost)));
      st.affordable = !!d && num(d.hpoint) >= st.cost;
    }
    if (u.hintKey) st.hintKey = u.hintKey;
    var rid = ruleFor(kind, id);
    if (rid) st.ruleId = rid;
    if (item && item.secret) st.secret = true;
    return st;
  };

  U.evaluate = function () {
    var fresh = mutate(function (d) { return evaluateInto(d); }) || [];
    announce(fresh);
    return fresh;
  };

  U.collectionProgress = function (opts) {
    return progressIn(S() || { unlocked: {}, achievements: {} }, !!(opts && opts.includeDefaults));
  };
})(window.HG = window.HG || {}, window, document);

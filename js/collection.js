/* HAMIN GAMES — js/collection.js
   The COLLECTION album (collection.html):

     cover   COLLECTION  42 / 100  42%  + animated bar with milestone stars (rules that
             use {collectionPct}) + "NEXT ♡ 50%: …" + MY H-POINT wallet
     tabs    MEMORIES · OUTFITS · POSES · STICKERS · ROOM ITEMS · ACHIEVEMENTS · H-POINT EXCHANGE
             (roving tabindex, ←/→/Home/End, deep links: collection.html#exchange etc.)
     cards   owned → art + name (details in HG.ui.modal) · rule-locked → silhouette / ? + hint
             exchange-locked → dimmed art + price · memories "Memory #001" · secret → ???
     shop    every locked item with unlock.type 'hpoint' (wardrobe, pose, sticker, frame,
             background, room), sorted by price → HG.ui.confirm → HG.unlocks.buy → popup

   Counting follows HG.unlocks.collectionProgress(): starter ('default') items are gifts and
   are left out of every count / %, so the tab numbers always add up to the cover total and
   match the 25 / 30 / 50 % milestone rules. Frames and backgrounds appear as bonus sections.

   Small extras: NEW! on items you have not looked at yet (save.seen['col.<kind>:<id>']),
   a one-time sparkle when a category reaches 100% (save.seen['col.complete.<kind>']).
   Works with no wardrobe data at all (OUTFITS shows a friendly empty state).
   BGM 'collection' is started by main.js from <body data-page="collection">. */
(function (HG, win, doc) {
  'use strict';

  /* ═══════════ Config ═══════════ */
  var TABS = [
    { id: 'memories', kind: 'memory', icon: '💌' },
    { id: 'outfits', kind: 'wardrobe', icon: '👕' },
    { id: 'poses', kind: 'pose', icon: '🙆' },
    { id: 'stickers', kind: 'sticker', icon: '⭐' },
    { id: 'room', kind: 'room', icon: '🛏️' },
    { id: 'achievements', kind: 'achievement', icon: '🏆' },
    { id: 'exchange', kind: null, icon: '💰' }
  ];
  var SHOP_KINDS = ['wardrobe', 'pose', 'sticker', 'frame', 'background', 'room'];
  var KIND_ICON = { wardrobe: '👕', pose: '🙆', sticker: '⭐', frame: '🖼️', background: '🌈', room: '🛏️', memory: '💌', achievement: '🏆' };
  var USE_HREF = {
    wardrobe: 'dress-up.html', sticker: 'photo-booth.html', frame: 'photo-booth.html',
    pose: 'photo-booth.html', background: 'photo-booth.html', room: 'my-room.html'
  };
  /* Memories (and anything else without its own hintKey) borrow the hint of the
     unlock rule that grants them (data/unlock-rules.js id → hint.* key). */
  var RULE_HINT = {
    'first-visit': 'hint.firstVisit', 'dressup-first-look': 'hint.lookSaved',
    'dressup-first-challenge': 'hint.challengeFirst', 'dressup-stage-ready': 'hint.challengeStage',
    'dressup-winter-day': 'hint.challengeWinter', 'dressup-trip-day': 'hint.challengeTrip',
    'dressup-closet': 'hint.secretCloset', 'lunch-play': 'hint.lunchPlay', 'lunch-champion': 'hint.lunchScore',
    'lunch-sheep-smile': 'hint.sheepSmile', 'lunch-sheep-plush': 'hint.sheepSmile3', 'lunch-rounds': 'hint.lunchRounds',
    'lunch-desserts': 'hint.lunchDesserts', 'run-play': 'hint.runPlay', 'run-500': 'hint.run500',
    'run-1000': 'hint.runDistance', 'run-caught-1': 'hint.runCaught', 'run-caught-5': 'hint.runCaught5',
    'run-snacks': 'hint.runSnacks', 'practice-first-clear': 'hint.practiceClear', 'practice-rank-s': 'hint.practiceS',
    'practice-hard': 'hint.practiceHard', 'photo-first': 'hint.photoFirst', 'photo-many': 'hint.photoMany',
    'room-cozy': 'hint.roomCozy', 'collection-25': 'hint.collection25', 'collection-30': 'hint.collection30',
    'collection-50': 'hint.collection50', 'memories-10': 'hint.memories10', 'hpoint-collector': 'hint.hpoint3000',
    'secret-logo': 'hint.secretLogo', 'secret-sheep': 'hint.secretSheep', 'secret-0524': 'hint.secret0524'
  };

  var state = {
    tab: 'memories',
    filter: 'all',        // exchange kind filter
    shownPct: 0,          // number currently shown on the cover (for the count-up)
    sig: '',              // save signature last rendered
    writing: false,       // true while this script writes to the save (ignore our own 'hg:save')
    pendingSeen: {}       // seen keys to store after the current tab was looked at
  };

  /* ═══════════ Helpers ═══════════ */
  function t(k, p) { return HG.t ? HG.t(k, p) : k; }
  function $(id) { return doc.getElementById(id); }
  function S() { return (HG.save && HG.save.data) || {}; }
  function num(v) { v = Number(v); return isFinite(v) ? v : 0; }
  function fmt(n) { return HG.ui && HG.ui.formatNum ? HG.ui.formatNum(n) : String(n); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function pad3(n) { return ('00' + Math.max(0, Math.floor(num(n)))).slice(-3); }
  function sfx(name, o) { try { if (HG.audio) HG.audio.sfx(name, o); } catch (e) { /* never break UI for sound */ } }
  function reduced() { return !!(HG.ui && HG.ui.reducedMotion && HG.ui.reducedMotion()); }
  function clear(el) { while (el && el.firstChild) el.removeChild(el.firstChild); }
  function all(kind) { return HG.catalog ? HG.catalog.all(kind) : []; }
  function itemName(kind, id) { return HG.i18n ? HG.i18n.itemName(kind, id) : String(id); }
  function has(key) { return !!(HG.i18n && HG.i18n.has(key)); }
  function isStarter(kind, item) { return !!(HG.catalog && HG.catalog.isDefault(kind, item)); }
  function owns(kind, id) { return !!(HG.unlocks && HG.unlocks.has(kind, id)); }
  function progress() {
    return HG.unlocks ? HG.unlocks.collectionProgress() : { owned: 0, total: 0, pct: 0, byKind: {} };
  }
  function tabById(id) { for (var i = 0; i < TABS.length; i++) if (TABS[i].id === id) return TABS[i]; return TABS[0]; }
  function tabLabel(tab) { return t('collection.tabs.' + tab.id); }

  function h(tag, cls, kids, attrs) {
    var el = doc.createElement(tag);
    if (cls) el.className = cls;
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k) && attrs[k] != null && attrs[k] !== false) {
          el.setAttribute(k, attrs[k] === true ? '' : String(attrs[k]));
        }
      }
    }
    if (kids != null) {
      (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
        if (c == null || c === false) return;
        el.appendChild(typeof c === 'object' ? c : doc.createTextNode(String(c)));
      });
    }
    return el;
  }

  function coin() { return h('span', 'cl-coin cl-coin--s', 'H', { 'aria-hidden': 'true' }); }

  /* Wardrobe pieces that count (the base body layer is not a collectible). */
  function wardrobeItems() {
    return all('wardrobe').filter(function (it) { return it && it.id != null && it.slot !== 'body'; });
  }
  function itemsOf(kind) {
    if (kind === 'wardrobe') return wardrobeItems();
    return all(kind).filter(function (it) { return it && it.id != null; });
  }

  /* Owned / total like HG.unlocks.collectionProgress (starters excluded), or with
     starters when `withStarters` (bonus sections that are not part of the %). */
  function countOf(kind, items, withStarters) {
    var o = 0, tot = 0;
    items.forEach(function (it) {
      var st = isStarter(kind, it);
      if (st && !withStarters) return;
      tot++;
      if (st || owns(kind, it.id)) o++;
    });
    return { owned: o, total: tot };
  }

  function hintKey(kind, item, st) {
    if (item && item.secret) return 'hint.secret';
    var k = (item && item.unlock && item.unlock.hintKey) || (st && st.ruleId && RULE_HINT[st.ruleId]) || null;
    return k && has(k) ? k : 'hint.default';
  }

  function dateText(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return t('collection.date', { y: d.getFullYear(), m: pad2(d.getMonth() + 1), d: pad2(d.getDate()) });
  }

  /* Keep keyboard focus on the "same" control across a re-render (data-key). */
  function withFocusKept(fn) {
    var a = doc.activeElement;
    var key = a && a.closest && a.closest('#hg-main') ? a.getAttribute('data-key') : null;
    var inPanel = !!(a && a.closest && a.closest('#cl-panel'));
    fn();
    if (!key && !inPanel) return;
    var again = key ? doc.querySelector('#hg-main [data-key="' + key.replace(/"/g, '') + '"]') : null;
    if (!again && inPanel) again = $('cl-panel');     // e.g. the exchanged item left the list
    if (again && again !== doc.activeElement) { try { again.focus({ preventScroll: true }); } catch (e) { again.focus(); } }
  }

  /* Writes by this page (seen marks) must not trigger our own re-render. */
  function write(fn) {
    if (!HG.save) return;
    state.writing = true;
    try { HG.save.update(fn); } finally { state.writing = false; }
  }

  /* ═══════════ NEW! marks (save.seen) ═══════════ */
  function seenKey(kind, id) { return 'col.' + kind + ':' + id; }
  function isSeen(kind, id) { var s = S().seen; return !!(s && s[seenKey(kind, id)]); }
  function freshFor(kind, id, owned, starter) {
    if (!owned || starter || isSeen(kind, id)) return false;
    state.pendingSeen[seenKey(kind, id)] = true;
    return true;
  }
  var seenTimer = 0;
  function flushSeenLater() {
    clearTimeout(seenTimer);
    seenTimer = setTimeout(function () {
      var keys = Object.keys(state.pendingSeen);
      if (!keys.length) return;
      state.pendingSeen = {};
      write(function (d) {
        if (!d.seen || typeof d.seen !== 'object') d.seen = {};
        keys.forEach(function (k) { d.seen[k] = true; });
      });
      withFocusKept(function () { renderTabs(progress()); });   // drop the tab's NEW dot
    }, 1400);
  }
  function tabHasNew(tab) {
    if (!tab.kind) return false;
    if (tab.kind === 'achievement') {
      var got = S().achievements || {};
      return Object.keys(got).some(function (id) { return !isSeen('achievement', id); });
    }
    return itemsOf(tab.kind).some(function (it) {
      return !isStarter(tab.kind, it) && owns(tab.kind, it.id) && !isSeen(tab.kind, it.id);
    });
  }

  /* ═══════════ Shared bits ═══════════ */

  /* Art box: item art via HG.ui.itemIcon (soft fallback tile). When the item is locked
     and has no art yet, CSS hides the tile and shows a big "?" instead. */
  function artBox(kind, item, cls, locked) {
    var box = h('span', cls + ' cl-art');
    var img = HG.ui.itemIcon(kind, item.id, { alt: '', lazy: true });
    var missing = function () { box.classList.add('is-missing'); };
    if (img.classList.contains('is-fallback')) missing();
    else img.addEventListener('error', missing);
    box.appendChild(img);
    if (locked) box.appendChild(h('span', 'cl-art__q', '?', { 'aria-hidden': 'true' }));
    return box;
  }

  function miniBar(o, cls) {
    var pct = o.total ? Math.round(o.owned * 100 / o.total) : 0;
    var fill = h('span', 'cl-mini__fill');
    fill.style.width = pct + '%';
    return h('span', 'cl-mini' + (cls ? ' ' + cls : ''), fill, { 'aria-hidden': 'true' });
  }

  function panelHead(tab, o) {
    var complete = !!(o && o.total && o.owned >= o.total);
    return h('div', 'cl-panel__head' + (complete ? ' is-complete' : ''), [
      h('h2', 'cl-panel__title', [h('span', 'cl-panel__icon', tab.icon, { 'aria-hidden': 'true' }), ' ', tabLabel(tab)]),
      o && o.total ? h('span', 'cl-panel__count', t('collection.tabCount', { owned: o.owned, total: o.total })) : null,
      o && o.total ? miniBar(o, 'cl-mini--head') : null,
      complete ? h('span', 'cl-complete', t('collection.complete')) : null
    ]);
  }

  function section(title, count, cards, opts) {
    opts = opts || {};
    return h('section', 'cl-sec' + (opts.cls ? ' ' + opts.cls : ''), [
      h('h3', 'cl-sec__head', [
        h('span', 'cl-sec__title', title),
        count ? h('span', 'cl-sec__count', count.total ? t('collection.tabCount', { owned: count.owned, total: count.total }) : '♡') : null,
        opts.note ? h('span', 'cl-sec__note', opts.note) : null
      ]),
      h('ul', 'cl-grid' + (opts.gridCls ? ' ' + opts.gridCls : ''), cards)
    ]);
  }

  function emptyBox(text, icon) {
    return h('div', 'cl-empty', [h('span', 'cl-empty__icon', icon || '♡', { 'aria-hidden': 'true' }), h('p', 'cl-empty__text', text)]);
  }

  /* ═══════════ Item cards (outfits · poses · stickers · room) ═══════════ */
  function itemCard(kind, item) {
    var st = HG.unlocks.status(kind, item.id);
    var starter = isStarter(kind, item);
    var owned = st.owned;
    var shop = !owned && st.type === 'hpoint';
    var nm = itemName(kind, item.id);
    var fresh = freshFor(kind, item.id, owned, starter);
    var hk = hintKey(kind, item, st);

    var label, sub;
    if (owned) {
      label = nm + ', ' + t(starter ? 'collection.starter' : 'collection.detail.owned');
      if (starter) sub = h('span', 'cl-tag cl-tag--starter', t('collection.starter'));
      else if (item.rarity && item.rarity !== 'common') sub = h('span', 'cl-tag cl-tag--' + item.rarity, t('rarity.' + item.rarity));
      else sub = h('span', 'cl-tag cl-tag--owned', '♡', { 'aria-hidden': 'true' });
    } else if (shop) {
      label = nm + ', ' + t('hpoint.cost', { n: fmt(st.cost) });
      sub = h('span', 'cl-price' + (st.affordable ? ' is-ok' : ''), [coin(), fmt(st.cost)]);
    } else {
      label = t('collection.locked') + ', ' + t('unlock.locked') + ': ' + t(hk);
      sub = h('span', 'cl-card__hint', t(hk));
    }

    var btn = h('button', 'cl-card ' + (owned ? 'is-owned' : 'is-locked') + (shop ? ' is-shop' : '') + (starter ? ' is-starter' : ''), [
      artBox(kind, item, 'cl-card__art', !owned),
      h('span', 'cl-card__name', owned || shop ? nm : t('collection.locked')),
      sub,
      fresh ? h('span', 'hg-badge hg-badge--new cl-card__new', t('common.new'), { 'aria-hidden': 'true' }) : null,
      owned ? null : h('span', 'cl-card__lock', shop ? '💰' : '🔒', { 'aria-hidden': 'true' })
    ], { type: 'button', 'aria-label': label + (fresh ? ' (' + t('common.new') + ')' : ''), 'data-key': kind + ':' + item.id });
    btn.addEventListener('click', function () { sfx('click'); openDetail(kind, item); });
    return h('li', 'cl-grid__item', btn);
  }

  /* ═══════════ Detail modal ═══════════ */
  function kindLine(kind, item) {
    var parts = [t('kind.' + kind)];
    if (kind === 'sticker' && item.cat) parts.push(t('stickerCat.' + item.cat));
    if (kind === 'room' && item.cat) parts.push(t('roomCat.' + item.cat));
    if (kind === 'wardrobe') {
      var cat = wardrobeCategoryOf(item);
      if (cat) parts.push(t('category.' + cat.id));
      if (item.rarity) parts.push(t('rarity.' + item.rarity));
    }
    return parts.join(' · ');
  }

  function openDetail(kind, item) {
    var st = HG.unlocks.status(kind, item.id);
    var owned = st.owned;
    var starter = isStarter(kind, item);
    var shop = !owned && st.type === 'hpoint';
    var isMem = kind === 'memory';
    var nm = itemName(kind, item.id);
    var title = owned || shop ? nm : (isMem ? t('memoryLocked.name') : t('collection.locked'));
    var hp = num(S().hpoint);

    var info = [h('p', 'cl-detail__kind', [h('span', null, KIND_ICON[kind] || '♡', { 'aria-hidden': 'true' }), ' ', kindLine(kind, item)])];
    if (isMem) info.push(h('p', 'cl-detail__no', t('collection.memoryNo', { no: pad3(item.no) })));
    info.push(h('p', 'cl-detail__name', title));
    if (isMem) {
      info.push(h('p', 'cl-detail__desc', owned ? t('memory.' + item.id + '.desc') : t('memoryLocked.desc')));
    }
    if (owned) {
      info.push(h('p', 'cl-detail__status is-owned', t(starter ? 'collection.detail.starter' : 'collection.detail.owned')));
    } else if (shop) {
      info.push(h('p', 'cl-detail__status is-shop', [coin(), ' ', t('collection.detail.exchange', { n: fmt(st.cost) })]));
      if (!st.affordable) info.push(h('p', 'cl-detail__need', t('collection.exchange.need', { n: fmt(st.cost - hp) })));
    } else {
      info.push(h('div', 'cl-detail__hint', [
        h('b', 'cl-detail__hint-title', ['🔒 ', t('collection.detail.howTo')]),
        h('p', null, t(hintKey(kind, item, st)))
      ]));
    }

    var body = h('div', 'cl-detail cl-detail--' + kind + (owned ? ' is-owned' : ' is-locked') + (shop ? ' is-shop' : ''), [
      artBox(kind, item, 'cl-detail__art', !owned),
      h('div', 'cl-detail__info', info)
    ]);

    var buttons = [];
    if (shop && st.affordable) {
      buttons.push({ label: t('collection.exchange.ok'), primary: true, onClick: function () {
        setTimeout(function () { exchange(kind, item.id); }, 30);   // after this modal closed
      } });
    } else if (owned && USE_HREF[kind]) {
      buttons.push({ labelKey: 'collection.detail.use', primary: true, onClick: function () { win.location.href = USE_HREF[kind]; } });
    }
    buttons.push({ labelKey: 'common.close', primary: !buttons.length });
    HG.ui.modal({ title: title, body: body, buttons: buttons, className: 'cl-modal' });
  }

  /* ═══════════ H-POINT exchange ═══════════ */
  function shopItems() {
    var out = [];
    if (!HG.catalog || !HG.unlocks) return out;
    SHOP_KINDS.forEach(function (kind) {
      itemsOf(kind).forEach(function (item) {
        var u = HG.catalog.unlockOf(kind, item);
        if (u.type !== 'hpoint' || owns(kind, item.id)) return;
        out.push({ kind: kind, item: item, cost: Math.max(0, Math.round(num(u.cost))) });
      });
    });
    out.sort(function (a, b) {
      return (a.cost - b.cost) || (SHOP_KINDS.indexOf(a.kind) - SHOP_KINDS.indexOf(b.kind)) ||
        String(itemName(a.kind, a.item.id)).localeCompare(String(itemName(b.kind, b.item.id)));
    });
    return out;
  }

  function exchange(kind, id) {
    var st = HG.unlocks.status(kind, id);
    var nm = itemName(kind, id);
    if (st.owned) { HG.ui.toast(t('hpoint.owned')); return; }
    if (st.type !== 'hpoint') { HG.ui.toast(t('collection.exchange.failed')); return; }
    if (!st.affordable) { sfx('error'); HG.ui.toast(t('hpoint.notEnough')); return; }
    var after = num(S().hpoint) - st.cost;
    HG.ui.confirm({
      title: t('collection.exchange.confirmTitle'),
      text: t('unlock.confirm', { name: nm, cost: fmt(st.cost) }) + '\n' + t('collection.exchange.after', { n: fmt(after) }),
      okKey: 'collection.exchange.ok'
    }).then(function (yes) {
      if (!yes) return;
      var r = HG.unlocks.buy(kind, id);
      if (r && r.ok) {
        HG.ui.popup({ type: 'unlock', title: t('popup.unlock.title'), text: nm + '\n' + t('hpoint.spent', { n: fmt(r.cost) }), kind: kind, id: id });
      } else if (r && r.reason === 'notEnough') {
        sfx('error'); HG.ui.toast(t('hpoint.notEnough'));
      } else if (r && r.reason === 'owned') {
        HG.ui.toast(t('hpoint.owned'));
      } else {
        sfx('error'); HG.ui.toast(t('collection.exchange.failed'));
      }
    });
  }

  function shopRow(x, hp) {
    var nm = itemName(x.kind, x.item.id);
    var ok = x.cost <= hp;
    var key = x.kind + ':' + x.item.id;
    var infoId = 'cl-shop-' + x.kind + '-' + x.item.id;
    var details = h('button', 'cl-shop__look', [
      artBox(x.kind, x.item, 'cl-shop__art', false),
      h('span', 'cl-shop__info', [
        h('b', 'cl-shop__name', nm, { id: infoId }),
        h('small', 'cl-shop__kind', [h('span', null, KIND_ICON[x.kind], { 'aria-hidden': 'true' }), ' ', kindLine(x.kind, x.item)])
      ])
    ], { type: 'button', 'data-key': key, 'aria-label': t('collection.detail.open', { name: nm }) });
    details.addEventListener('click', function () { sfx('click'); openDetail(x.kind, x.item); });

    var buy = h('button', 'hg-btn hg-btn--pink hg-btn--small cl-shop__buy', t('collection.exchange.button'), {
      type: 'button', 'data-key': 'buy:' + key, disabled: !ok, 'aria-describedby': infoId + ' ' + infoId + '-price'
    });
    buy.addEventListener('click', function () { exchange(x.kind, x.item.id); });

    return h('li', 'cl-shop__item' + (ok ? ' is-ok' : ''), [
      details,
      h('span', 'cl-shop__deal', [
        h('span', 'cl-price' + (ok ? ' is-ok' : ''), [coin(), fmt(x.cost)], { id: infoId + '-price' }),
        buy,
        ok ? null : h('small', 'cl-shop__need', t('collection.exchange.need', { n: fmt(x.cost - hp) }))
      ])
    ]);
  }

  function renderExchange(panel) {
    var hp = num(S().hpoint);
    var list = shopItems();
    var kinds = SHOP_KINDS.filter(function (k) { return list.some(function (x) { return x.kind === k; }); });
    if (state.filter !== 'all' && kinds.indexOf(state.filter) === -1) state.filter = 'all';
    var shown = state.filter === 'all' ? list : list.filter(function (x) { return x.kind === state.filter; });
    var afford = list.filter(function (x) { return x.cost <= hp; }).length;

    panel.appendChild(h('div', 'cl-panel__head cl-shop__head', [
      h('h2', 'cl-panel__title', [h('span', 'cl-panel__icon', '💰', { 'aria-hidden': 'true' }), ' ', t('collection.tabs.exchange')]),
      h('span', 'cl-shop__wallet', [coin(), h('b', null, fmt(hp)), ' ', h('small', null, t('hpoint.label'))])
    ]));
    panel.appendChild(h('p', 'cl-shop__intro', [h('span', null, '♡ ', { 'aria-hidden': 'true' }), t('collection.exchange.intro')]));

    if (!list.length) { panel.appendChild(emptyBox(t('collection.exchange.empty'), '🏆')); return; }

    var chips = h('div', 'cl-filters', null, { role: 'group', 'aria-label': t('collection.exchange.filter') });
    ['all'].concat(kinds).forEach(function (k) {
      var n = k === 'all' ? list.length : list.filter(function (x) { return x.kind === k; }).length;
      var on = state.filter === k;
      var chip = h('button', 'cl-chip' + (on ? ' is-on' : ''), [
        k === 'all' ? null : h('span', null, KIND_ICON[k], { 'aria-hidden': 'true' }),
        ' ', k === 'all' ? t('collection.exchange.all') : t('kind.' + k), ' ',
        h('span', 'cl-chip__n', String(n))
      ], { type: 'button', 'aria-pressed': String(on), 'data-key': 'filter:' + k });
      chip.addEventListener('click', function () {
        if (state.filter === k) return;
        sfx('click');
        state.filter = k;
        withFocusKept(function () { renderPanel(progress()); });
      });
      chips.appendChild(chip);
    });
    panel.appendChild(chips);

    panel.appendChild(h('p', 'cl-shop__status', [
      h('span', afford ? 'is-ok' : null, afford ? t('collection.exchange.affordable', { n: afford }) : t('collection.exchange.none')),
      h('span', 'cl-shop__sorted', t('collection.exchange.sorted'))
    ]));

    if (!shown.length) { panel.appendChild(emptyBox(t('collection.exchange.emptyFilter'), '♡')); return; }
    panel.appendChild(h('ul', 'cl-shop', shown.map(function (x) { return shopRow(x, hp); })));
  }

  /* ═══════════ Tab panels ═══════════ */
  function renderMemories(panel, p) {
    var tab = tabById('memories');
    panel.appendChild(panelHead(tab, p.byKind.memory));
    var list = itemsOf('memory').slice().sort(function (a, b) { return num(a.no) - num(b.no); });
    if (!list.length) { panel.appendChild(emptyBox(t('collection.empty.generic'), '💌')); return; }
    panel.appendChild(h('ul', 'cl-mems', list.map(function (m) {
      var st = HG.unlocks.status('memory', m.id);
      var owned = st.owned;
      var no = t('collection.memoryNo', { no: pad3(m.no) });
      var nm = owned ? itemName('memory', m.id) : t('memoryLocked.name');
      var hk = hintKey('memory', m, st);
      var fresh = freshFor('memory', m.id, owned, false);
      var btn = h('button', 'cl-mem ' + (owned ? 'is-owned' : 'is-locked') + (m.secret ? ' is-secret' : ''), [
        h('span', 'cl-mem__no', no),
        artBox('memory', m, 'cl-mem__art', !owned),
        h('span', 'cl-mem__name', nm),
        owned ? null : h('span', 'cl-mem__hint', t(hk)),
        m.secret && !owned ? h('span', 'cl-mem__secret', t('collection.secret'), { 'aria-hidden': 'true' }) : null,
        fresh ? h('span', 'hg-badge hg-badge--new cl-card__new', t('common.new'), { 'aria-hidden': 'true' }) : null
      ], {
        type: 'button', 'data-key': 'memory:' + m.id,
        'aria-label': no + ', ' + (owned ? nm : t('unlock.locked') + ': ' + t(hk)) + (fresh ? ' (' + t('common.new') + ')' : '')
      });
      btn.addEventListener('click', function () { sfx('click'); openDetail('memory', m); });
      return h('li', 'cl-mems__item', btn);
    })));
  }

  function wardrobeCategoryOf(item) {
    var cats = (HG.data && HG.data.wardrobe && HG.data.wardrobe.categories) || [];
    for (var i = 0; i < cats.length; i++) if (cats[i] && cats[i].slot === item.slot) return cats[i];
    return null;
  }

  function renderOutfits(panel, p) {
    var tab = tabById('outfits');
    var items = wardrobeItems();
    panel.appendChild(panelHead(tab, p.byKind.wardrobe));
    if (!items.length) { panel.appendChild(emptyBox(t('collection.empty.outfits'), '👕')); return; }
    var cats = (HG.data.wardrobe && HG.data.wardrobe.categories) || [];
    var used = {};
    cats.forEach(function (c) {
      var group = items.filter(function (it) { return it.slot === c.slot; });
      if (!group.length || used[c.slot]) return;
      used[c.slot] = true;
      panel.appendChild(section(t('category.' + c.id), countOf('wardrobe', group), group.map(function (it) { return itemCard('wardrobe', it); })));
    });
    var rest = items.filter(function (it) { return !used[it.slot]; });
    if (rest.length) panel.appendChild(section(t('collection.section.other'), countOf('wardrobe', rest), rest.map(function (it) { return itemCard('wardrobe', it); })));
  }

  function renderPoses(panel, p) {
    var tab = tabById('poses');
    var items = itemsOf('pose');
    panel.appendChild(panelHead(tab, p.byKind.pose));
    if (!items.length) { panel.appendChild(emptyBox(t('collection.empty.generic'), '🙆')); return; }
    panel.appendChild(h('ul', 'cl-grid cl-grid--poses', items.map(function (it) { return itemCard('pose', it); })));
  }

  function groupedSections(panel, kind, cats, catKey) {
    var items = itemsOf(kind);
    var order = (cats || []).slice();
    items.forEach(function (it) { if (it.cat && order.indexOf(it.cat) === -1) order.push(it.cat); });
    order.forEach(function (cat) {
      var group = items.filter(function (it) { return it.cat === cat; });
      if (!group.length) return;
      panel.appendChild(section(t(catKey + '.' + cat), countOf(kind, group), group.map(function (it) { return itemCard(kind, it); })));
    });
    var rest = items.filter(function (it) { return !it.cat; });
    if (rest.length) panel.appendChild(section(t('collection.section.other'), countOf(kind, rest), rest.map(function (it) { return itemCard(kind, it); })));
    return items.length;
  }

  function renderStickers(panel, p) {
    var tab = tabById('stickers');
    panel.appendChild(panelHead(tab, p.byKind.sticker));
    var n = groupedSections(panel, 'sticker', HG.data && HG.data.stickerCats, 'stickerCat');
    if (!n) panel.appendChild(emptyBox(t('collection.empty.generic'), '⭐'));
    // Bonus: Photo Booth frames + backgrounds (not part of the collection %).
    [['frame', 'collection.section.frames'], ['background', 'collection.section.backgrounds']].forEach(function (pair) {
      var list = itemsOf(pair[0]);
      if (!list.length) return;
      panel.appendChild(section(t(pair[1]), countOf(pair[0], list, true), list.map(function (it) { return itemCard(pair[0], it); }),
        { note: t('collection.bonus'), cls: 'cl-sec--bonus' }));
    });
  }

  function renderRoom(panel, p) {
    var tab = tabById('room');
    panel.appendChild(panelHead(tab, p.byKind.room));
    var n = groupedSections(panel, 'room', HG.data && HG.data.roomCats, 'roomCat');
    if (!n) panel.appendChild(emptyBox(t('collection.empty.generic'), '🛏️'));
  }

  function renderAchievements(panel, p) {
    var tab = tabById('achievements');
    panel.appendChild(panelHead(tab, p.byKind.achievement));
    var list = itemsOf('achievement');
    if (!list.length) { panel.appendChild(emptyBox(t('collection.empty.generic'), '🏆')); return; }
    var got = S().achievements || {};
    var base = (HG.unlocks && HG.unlocks.REWARD && HG.unlocks.REWARD.achievement) || 150;
    panel.appendChild(h('ul', 'cl-achvs', list.map(function (a) {
      var owned = !!got[a.id];
      var hidden = !!a.secret && !owned;
      var fresh = freshFor('achievement', a.id, owned, false);
      var reward = a.reward != null ? a.reward : base;
      return h('li', 'cl-achv ' + (owned ? 'is-owned' : 'is-locked') + (a.secret ? ' is-secret' : ''), [
        h('span', 'cl-achv__medal', hidden ? '?' : (a.icon || '★'), { 'aria-hidden': 'true' }),
        h('span', 'cl-achv__info', [
          h('b', 'cl-achv__name', hidden ? t('achievementLocked.name') : itemName('achievement', a.id)),
          h('span', 'cl-achv__desc', hidden ? t('achievementLocked.desc') : t('achievement.' + a.id + '.desc'))
        ]),
        h('span', 'cl-achv__side', [
          a.secret ? h('span', 'cl-achv__secret', t('collection.secret')) : null,
          h('span', 'cl-achv__reward', t('hpoint.earned', { n: fmt(reward) })),
          h('span', 'cl-achv__when', owned ? t('collection.detail.got', { date: dateText(got[a.id]) }) : t('collection.achv.notYet'))
        ]),
        fresh ? h('span', 'hg-badge hg-badge--new cl-achv__new', t('common.new')) : null
      ]);
    })));
  }

  function renderPanel(p) {
    var panel = $('cl-panel');
    if (!panel) return;
    clear(panel);
    panel.className = 'cl-panel cl-panel--' + state.tab;
    panel.setAttribute('aria-labelledby', 'cl-tab-' + state.tab);
    switch (state.tab) {
      case 'outfits': renderOutfits(panel, p); break;
      case 'poses': renderPoses(panel, p); break;
      case 'stickers': renderStickers(panel, p); break;
      case 'room': renderRoom(panel, p); break;
      case 'achievements': renderAchievements(panel, p); break;
      case 'exchange': renderExchange(panel, p); break;
      default: renderMemories(panel, p);
    }
    flushSeenLater();
  }

  /* ═══════════ Tabs ═══════════ */
  function renderTabs(p) {
    var bar = $('cl-tabs');
    if (!bar) return;
    clear(bar);
    var shopCount = shopItems().length;
    TABS.forEach(function (tab) {
      var sel = tab.id === state.tab;
      var o = tab.kind ? (p.byKind[tab.kind] || { owned: 0, total: 0 }) : null;
      var complete = !!(o && o.total && o.owned >= o.total);
      var count = tab.kind ? (o.total ? t('collection.tabCount', { owned: o.owned, total: o.total }) : null) : String(shopCount);
      var fresh = tabHasNew(tab);
      var btn = h('button', 'hg-tab cl-tab cl-tab--' + tab.id + (sel ? ' is-active' : '') + (complete ? ' is-complete' : ''), [
        h('span', 'cl-tab__icon', tab.icon, { 'aria-hidden': 'true' }),
        h('span', 'cl-tab__label', tabLabel(tab)),
        count != null ? h('span', 'cl-tab__count', count) : null,
        complete ? h('span', 'cl-tab__star', '★', { 'aria-hidden': 'true' }) : null,
        fresh ? h('span', 'cl-tab__dot', null, { title: t('collection.tabs.hasNew') }) : null,
        fresh ? h('span', 'hg-sr-only', ' — ' + t('collection.tabs.hasNew')) : null
      ], {
        type: 'button', role: 'tab', id: 'cl-tab-' + tab.id, 'aria-selected': String(sel),
        'aria-controls': 'cl-panel', tabindex: sel ? '0' : '-1', 'data-key': 'tab:' + tab.id
      });
      btn.addEventListener('click', function () {
        if (tab.id === state.tab) return;
        sfx('click');
        select(tab.id, { focusTab: true });
      });
      bar.appendChild(btn);
    });
  }

  function select(id, opts) {
    state.tab = tabById(id).id;
    var p = progress();
    renderTabs(p);
    renderPanel(p);
    setHash(state.tab);
    if (opts && opts.focusTab) {
      var b = $('cl-tab-' + state.tab);
      if (b) { try { b.focus({ preventScroll: true }); } catch (e) { b.focus(); } }
    }
  }

  function wireTabKeys() {
    var bar = $('cl-tabs');
    if (!bar) return;
    bar.addEventListener('keydown', function (e) {
      var i = TABS.indexOf(tabById(state.tab));
      var n = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % TABS.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + TABS.length) % TABS.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = TABS.length - 1;
      if (n < 0) return;
      e.preventDefault();
      sfx('tick');
      select(TABS[n].id, { focusTab: true });
    });
  }

  function tabFromHash() {
    var id = '';
    try { id = decodeURIComponent((win.location.hash || '').replace(/^#/, '')); } catch (e) { id = ''; }
    for (var i = 0; i < TABS.length; i++) if (TABS[i].id === id) return id;
    return null;
  }
  function setHash(id) {
    if (tabFromHash() === id) return;
    try {
      if (win.history && win.history.replaceState) win.history.replaceState(null, '', '#' + id);
    } catch (e) { /* file:// or sandboxed — the tab still works, only the link does not update */ }
  }

  /* ═══════════ Cover (count, bar, milestones, wallet) ═══════════ */
  var pctRaf = 0;
  function animatePct(target) {
    var el = $('cl-pct');
    var fill = $('cl-bar-fill');
    var from = state.shownPct;
    state.shownPct = target;
    if (fill) { void fill.offsetWidth; fill.style.width = target + '%'; }
    if (!el) return;
    if (reduced() || from === target || !win.requestAnimationFrame) { el.textContent = String(target); return; }
    if (pctRaf) win.cancelAnimationFrame(pctRaf);
    var t0 = null;
    var dur = 900;
    function step(ts) {
      if (t0 == null) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      el.textContent = String(Math.round(from + (target - from) * e));
      pctRaf = k < 1 ? win.requestAnimationFrame(step) : 0;
    }
    pctRaf = win.requestAnimationFrame(step);
  }

  function milestones() {
    return ((HG.data && HG.data.unlockRules) || []).filter(function (r) {
      return r && r.id && r.when && r.when.collectionPct != null;
    }).map(function (r) {
      return { id: r.id, pct: num(r.when.collectionPct), grant: (r.grant || []).filter(function (g) { return g && g.kind !== 'hpoint'; }) };
    }).sort(function (a, b) { return a.pct - b.pct; });
  }
  function grantNames(ms) {
    return ms.grant.map(function (g) { return itemName(g.kind, g.id); }).join(' + ');
  }

  function renderHead(p) {
    var d = S();
    var count = $('cl-count');
    if (count) count.textContent = t('collection.count', { owned: fmt(p.owned), total: fmt(p.total) });
    var bar = $('cl-bar');
    if (bar) {
      bar.setAttribute('aria-valuenow', String(p.pct));
      bar.setAttribute('aria-label', t('collection.aria', { owned: fmt(p.owned), total: fmt(p.total), n: p.pct }));
    }
    animatePct(p.pct);

    var rules = d.rules || {};
    var marks = $('cl-marks');
    var next = null;
    if (marks) clear(marks);
    milestones().forEach(function (ms) {
      var reached = p.pct >= ms.pct || !!rules[ms.id];
      if (!reached && !next) next = ms;
      if (!marks) return;
      var m = h('span', 'cl-mark' + (reached ? ' is-reached' : ''), [
        h('span', 'cl-mark__star', reached ? '★' : '☆'),
        h('span', 'cl-mark__pct', ms.pct + '%')
      ], { title: t('collection.milestone', { n: ms.pct, items: grantNames(ms) }) });
      m.style.left = Math.max(0, Math.min(100, ms.pct)) + '%';
      marks.appendChild(m);
    });
    var nextEl = $('cl-next');
    if (nextEl) {
      nextEl.classList.toggle('is-done', !next);
      nextEl.textContent = next ? t('collection.next', { n: next.pct, items: grantNames(next) }) : t('collection.allRewards');
    }

    var hpEl = $('cl-hp');
    if (hpEl) hpEl.textContent = fmt(num(d.hpoint));
    var earned = $('cl-hp-earned');
    if (earned) earned.textContent = t('hpoint.total', { n: fmt(num(d.hpointEarned)) });
  }

  /* ═══════════ 100% celebration (once per category) ═══════════ */
  function checkComplete(p) {
    TABS.forEach(function (tab) {
      if (!tab.kind) return;
      var o = p.byKind[tab.kind];
      if (!o || !o.total || o.owned < o.total) return;
      var key = 'col.complete.' + tab.kind;
      var seen = S().seen || {};
      if (seen[key]) return;
      write(function (d) { if (!d.seen || typeof d.seen !== 'object') d.seen = {}; d.seen[key] = true; });
      celebrate(tab);
    });
  }

  function celebrate(tab) {
    var btn = $('cl-tab-' + tab.id);
    sfx('success');
    if (HG.ui.toast) HG.ui.toast(t('collection.completeToast', { name: tabLabel(tab) }));
    if (!btn) return;
    btn.classList.add('is-celebrating');
    setTimeout(function () { btn.classList.remove('is-celebrating'); }, 2600);
    var r = btn.getBoundingClientRect();
    if (HG.ui.sparkleBurst) HG.ui.sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 16);
  }

  /* ═══════════ Refresh ═══════════ */
  function signature() {
    var d = S();
    var u = d.unlocked || {};
    return [
      d.hpoint, d.hpointEarned,
      Object.keys(d.achievements || {}).length, Object.keys(d.rules || {}).length,
      Object.keys(u).map(function (k) { return k + ':' + (u[k] || []).length; }).join(',')
    ].join('|');
  }

  function renderAll() {
    var p = progress();
    state.sig = signature();
    withFocusKept(function () {
      renderHead(p);
      renderTabs(p);
      renderPanel(p);
    });
    checkComplete(p);
  }

  var saveTimer = 0;
  function onSave() {
    if (state.writing) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      if (signature() !== state.sig) renderAll();
    }, 80);
  }

  /* ═══════════ Init ═══════════ */
  function init() {
    if (!$('cl-panel') || !HG.unlocks || !HG.catalog) return;
    state.tab = tabFromHash() || 'memories';
    doc.title = t('collection.docTitle');
    wireTabKeys();
    renderAll();

    // Album BGM (main.js maps data-page="collection" → 'collection' too); starts after a gesture.
    if (HG.audio && HG.audio.bgm && doc.body.getAttribute('data-bgm') !== 'none' && HG.audio.current !== 'collection') {
      HG.audio.bgm('collection');
    }

    doc.addEventListener('hg:save', onSave);
    doc.addEventListener('hg:lang', function () {
      doc.title = t('collection.docTitle');
      renderAll();
    });
    // Header H-POINT badge (collection.html#exchange) or any other in-page tab link.
    win.addEventListener('hashchange', function () {
      var id = tabFromHash();
      if (!id || id === state.tab) return;
      select(id);
      var album = doc.querySelector('.cl-album');
      if (album && album.scrollIntoView) album.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
    });
  }

  if (HG.onReady) HG.onReady(init);
  else doc.addEventListener('hg:ready', init);
})(window.HG = window.HG || {}, window, document);

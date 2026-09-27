/* HAMIN GAMES — js/home.js
   Portal home page (index.html). Fills the static skeleton with live content:

     UPDATE ticker · TODAY'S HAMIN (daily bust + line) · WEEKLY EVENT (by ISO week)
     NEW GAME cards · HOT GAME ranking · ALL GAMES grid (#games)
     MY STATUS (H-POINT) · COLLECTION % · GAME MENU · latest ACHIEVEMENTS
     HAMIN'S ROOM preview · NOTICE BOARD (read-only, fake cute notices)

   Rules followed (docs/CONTRACT.md):
   - every visible string comes from HG.t() (data/translations-home.js + common files)
   - every image degrades to a soft fallback (HG.ui.img / emoji) and never blocks anything
   - reduced motion: CSS handles it globally (html.hg-reduced-motion); the ticker turns
     into a static list and the pause button hides
   - BGM 'portal' is started by main.js from <body data-page="home"> after the first gesture
   - the extra hidden sheep only calls HG.unlocks.secret('hiddenSheep')

   Re-rendering: everything on 'hg:lang'; live panels on 'hg:save' (debounced and
   skipped when nothing they show has changed). Focus is kept across re-renders. */
(function (HG, win, doc) {
  'use strict';

  /* ═══════════ Config ═══════════ */
  var EXPRS = ['neutral', 'smile', 'big-smile', 'sheep-smile', 'surprised', 'focused', 'wink'];
  var EXPR_EMOJI = { neutral: '🙂', smile: '😊', 'big-smile': '😄', 'sheep-smile': '🐑', surprised: '😮', focused: '🧐', wink: '😉' };
  var BUST_DIR = 'assets/character/bust/hamin-';
  var ROOM_BG = 'assets/room/bg-room.webp';
  var TODAY_LINES = 10;        // home.today.l1 … l10
  var TICKER_LINES = 7;        // home.ticker.l1 … l7
  var WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  var HOT_SHOWN = 5;
  var ACHV_SHOWN = 4;
  var KIND_ICON = { memory: '💌', wardrobe: '👕', pose: '🙆', sticker: '⭐', room: '🛏️', achievement: '🏆' };

  /* Read-only notice board. `ago` = days before today; `fixed` = [y, m, d]. */
  var NOTICES = [
    { key: 'n1', tag: 'notice', ago: 0 },
    { key: 'n2', tag: 'event', ago: 1 },
    { key: 'n3', tag: 'tip', ago: 3 },
    { key: 'n4', tag: 'update', ago: 6 },
    { key: 'n5', tag: 'tip', ago: 11 },
    { key: 'n6', tag: 'notice', fixed: [2006, 5, 24] }
  ];

  /* Faux weekly events, one per ISO week. `done()` only decorates the card with a
     CLEAR! stamp — there are no prizes (contract: no random/paid rewards). */
  var EVENTS = [
    { id: 'style-preppy', game: 'dress-up', challenge: 'preppy-day', icon: '👔' },
    { id: 'lunch', game: 'lunch-time', key: 'lunch', icon: '🍱', done: function () { return bestNum('lunch-time') >= 1500; } },
    { id: 'run', game: 'run-hamin', key: 'run', icon: '🐶', done: function () { return stat('run.bestDistance') >= 1000; } },
    { id: 'style-cozy', game: 'dress-up', challenge: 'soft-cozy', icon: '🧶' },
    { id: 'photo', game: 'photo-booth', key: 'photo', icon: '📸', done: function () { return stat('photo.created') >= 5; } },
    { id: 'rhythm', game: 'practice-room', key: 'rhythm', icon: '🎵', done: function () { return flag('practice.rank.S'); } },
    { id: 'style-stage', game: 'dress-up', challenge: 'stage-ready', icon: '🌟' },
    { id: 'room', game: 'my-room', key: 'room', icon: '🛏️', done: function () { return stat('room.placed') >= 5; } },
    { id: 'style-trip', game: 'dress-up', challenge: 'trip-day', icon: '🎒' }
  ];

  /* ═══════════ Small helpers ═══════════ */
  function t(k, p) { return HG.t ? HG.t(k, p) : k; }
  function $(id) { return doc.getElementById(id); }
  function S() { return (HG.save && HG.save.data) || {}; }
  function num(v) { v = Number(v); return isFinite(v) ? v : 0; }
  function mod(a, n) { return ((a % n) + n) % n; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmt(n) { return HG.ui && HG.ui.formatNum ? HG.ui.formatNum(n) : String(n); }
  function stat(k) { var s = S().stats; return s ? num(s[k]) : 0; }
  function flag(k) { var f = S().flags; return !!(f && f[k]); }
  function bestNum(k) { var b = S().best; return b && typeof b[k] === 'number' ? b[k] : 0; }
  function sfx(name, o) { try { if (HG.audio) HG.audio.sfx(name, o); } catch (e) { /* sound never breaks UI */ } }
  function reduced() { return !!(HG.ui && HG.ui.reducedMotion && HG.ui.reducedMotion()); }
  function clear(el) { while (el && el.firstChild) el.removeChild(el.firstChild); }

  /* h('div', 'class', 'text' | [children], {attr: value}) */
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

  function games() { return (HG.data && HG.data.games) || []; }
  function playable(g) { return !!(g && !g.comingSoon && g.href); }
  function hasBadge(g, b) { return !!(g && g.badges && g.badges.indexOf(b) !== -1); }
  function gameTitle(id) {
    var g = HG.catalog ? HG.catalog.game(id) : null;
    return g ? t(g.titleKey) : id;
  }

  /* Local calendar helpers */
  function dayNumber(d) { return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); }
  function ymdDots(d) { return d.getFullYear() + '.' + pad2(d.getMonth() + 1) + '.' + pad2(d.getDate()); }
  function ymdISO(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function addDays(d, n) { var c = new Date(d.getFullYear(), d.getMonth(), d.getDate()); c.setDate(c.getDate() + n); return c; }
  function isoWeek(date) {
    var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    var dow = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dow);
    var yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
    return { year: d.getUTCFullYear(), week: Math.ceil(((d - yearStart) / 864e5 + 1) / 7) };
  }
  function weekday(d) { return t('home.weekday.' + WEEKDAYS[d.getDay()]); }

  /* Game thumbnail with emoji fallback (coming-soon cards have no art → fallback tile). */
  function gameThumb(g, cls) {
    if (HG.ui && HG.ui.img) return HG.ui.img(g.thumb || null, { alt: '', emoji: g.icon || '🎮', kind: 'game', lazy: true, className: cls });
    return h('span', cls, g.icon || '🎮');
  }

  /* Plain <img> that calls onMissing instead of showing a tile (room art, backgrounds). */
  function softImg(src, cls, onMissing) {
    var img = doc.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    img.draggable = false;
    if (cls) img.className = cls;
    img.addEventListener('error', function onErr() {
      img.removeEventListener('error', onErr);
      if (onMissing) onMissing(img);
    });
    img.src = src;
    return img;
  }

  function badgeEls(g) {
    var out = [];
    if (hasBadge(g, 'new')) out.push(h('span', 'hg-badge hg-badge--new', t('common.new')));
    if (hasBadge(g, 'hot')) out.push(h('span', 'hg-badge hg-badge--hot', t('common.hot')));
    return out;
  }

  /* BEST line: best score for scored games, else how often you played. */
  function bestValue(g) {
    var d = S();
    var keys = [g.bestKey, g.id];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (k && d.best && typeof d.best[k] === 'number' && d.best[k] > 0) return d.best[k];
    }
    if (g.bestKey && d.stats && typeof d.stats[g.bestKey] === 'number' && d.stats[g.bestKey] > 0) return d.stats[g.bestKey];
    return null;
  }
  function bestText(g) {
    if (g.bestFormat) {
      var v = bestValue(g);
      return v != null ? t('games.best', { v: HG.ui.formatScore(v, g.bestFormat) }) : t('games.noBest');
    }
    var n = stat('games.played.' + g.id);
    return n ? t('home.hot.plays', { n: fmt(n) }) : t('home.hot.first');
  }

  /* Keep keyboard focus on the "same" control across a re-render (data-key). */
  function withFocusKept(fn) {
    var a = doc.activeElement;
    var key = a && a.getAttribute && a.closest && a.closest('#hg-main') ? a.getAttribute('data-key') : null;
    fn();
    if (key) {
      var again = doc.querySelector('#hg-main [data-key="' + key.replace(/"/g, '') + '"]');
      if (again && again !== doc.activeElement) { try { again.focus({ preventScroll: true }); } catch (e) { again.focus(); } }
    }
  }

  /* ═══════════ UPDATE ticker ═══════════ */
  var tickerPaused = false;

  function renderTicker() {
    var ul = $('hp-ticker');
    if (!ul) return;
    clear(ul);
    var params = { game: gameTitle('run-hamin'), room: gameTitle('my-room') };
    var chars = 0;
    for (var i = 1; i <= TICKER_LINES; i++) {
      var txt = t('home.ticker.l' + i, params);
      chars += String(txt).length + 6;
      ul.appendChild(h('li', 'hp-ticker__item', [h('span', 'hp-ticker__heart', '♡', { 'aria-hidden': 'true' }), ' ', txt]));
    }
    // Constant, readable speed whatever the language / line length.
    ul.style.animationDuration = Math.max(28, Math.round(chars * 0.19)) + 's';
    syncTickerPause();
  }

  function syncTickerPause() {
    var btn = $('hp-ticker-pause');
    var box = btn && btn.closest('.hp-ticker');
    if (!btn || !box) return;
    box.classList.toggle('is-paused', tickerPaused);
    btn.setAttribute('aria-pressed', String(tickerPaused));
    var key = tickerPaused ? 'home.ticker.play' : 'home.ticker.pause';
    btn.setAttribute('data-i18n-attr', 'aria-label:' + key + ';title:' + key);
    btn.firstElementChild.textContent = tickerPaused ? '▶' : '❚❚';
    if (HG.i18n) HG.i18n.apply(btn);
  }

  function wireTicker() {
    var btn = $('hp-ticker-pause');
    if (!btn) return;
    btn.addEventListener('click', function () {
      tickerPaused = !tickerPaused;
      sfx('click');
      syncTickerPause();
    });
  }

  /* ═══════════ TODAY'S HAMIN ═══════════ */
  var todayLine = null;

  function todayText(i) { return t('home.today.l' + (i + 1), { game: gameTitle('run-hamin') }); }

  function renderToday() {
    var box = $('hp-today');
    if (!box) return;
    clear(box);
    var now = new Date();
    var day = dayNumber(now);
    // Same pick all day; the weekly shift (+3) keeps e.g. every Sunday from looking alike.
    var expr = EXPRS[mod(day + Math.floor(day / 7) * 3, EXPRS.length)];
    if (todayLine == null) todayLine = mod(day * 3 + 1, TODAY_LINES);
    var mood = t('home.today.moods.' + expr);

    var img = HG.ui.img(BUST_DIR + expr + '.webp', { alt: '', emoji: EXPR_EMOJI[expr], kind: 'memory', className: 'hp-today__img' });
    img.setAttribute('width', '800');
    img.setAttribute('height', '800');
    var bob = h('span', 'hp-today__bob', img);
    var stage = h('button', 'hp-today__stage', [
      h('span', 'hp-today__halo', null, { 'aria-hidden': 'true' }),
      bob
    ], { type: 'button', 'aria-label': t('home.today.tap'), 'aria-describedby': 'hp-today-bubble', 'data-key': 'today-stage' });

    var bubble = h('p', 'hp-today__bubble', todayText(todayLine), { id: 'hp-today-bubble', 'aria-live': 'polite' });

    stage.addEventListener('click', function () {
      todayLine = mod(todayLine + 1 + Math.floor(Math.random() * 3), TODAY_LINES);
      bubble.textContent = todayText(todayLine);
      sfx('pop', { rate: 1.1 + Math.random() * 0.3 });
      if (!reduced()) {
        bob.classList.remove('is-hop');
        void bob.offsetWidth;
        bob.classList.add('is-hop');
        bubble.classList.remove('is-pop');
        void bubble.offsetWidth;
        bubble.classList.add('is-pop');
      }
    });

    // The second hidden sheep of the site (the first lives in the footer).
    var sheep = h('button', 'hp-sheep', h('span', null, '🐑', { 'aria-hidden': 'true' }),
      { type: 'button', 'aria-label': t('home.sheep'), title: t('home.sheep'), 'data-key': 'today-sheep' });
    sheep.addEventListener('click', function () {
      sfx('pop', { rate: 1.35 });
      if (!reduced()) { sheep.classList.remove('is-hop'); void sheep.offsetWidth; sheep.classList.add('is-hop'); }
      var r = sheep.getBoundingClientRect();
      if (HG.ui.sparkleBurst) HG.ui.sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 8);
      if (HG.unlocks) HG.unlocks.secret('hiddenSheep');
    });

    box.appendChild(h('div', 'hp-today__art', [stage, sheep,
      h('span', 'hp-today__badge', t('home.today.badge'), { 'aria-hidden': 'true' })]));
    box.appendChild(h('div', 'hp-today__side', [
      h('p', 'hp-today__date', [
        h('span', 'hp-today__cal', '📅', { 'aria-hidden': 'true' }), ' ',
        h('time', null, t('home.today.date', { y: now.getFullYear(), m: pad2(now.getMonth() + 1), d: pad2(now.getDate()), w: weekday(now) }), { datetime: ymdISO(now) })
      ]),
      bubble,
      h('p', 'hp-today__mood', t('home.today.moodLabel', { m: mood })),
      h('p', 'hp-today__tip', t('home.today.hint'))
    ]));
  }

  /* ═══════════ WEEKLY EVENT ═══════════ */
  function currentEvent(now) {
    var wk = isoWeek(now);
    return EVENTS[mod(wk.year * 53 + wk.week, EVENTS.length)];
  }

  function renderEvent() {
    var box = $('hp-event');
    if (!box) return;
    clear(box);
    var now = new Date();
    var ev = currentEvent(now);
    var g = HG.catalog ? HG.catalog.game(ev.game) : null;
    var gameName = g ? t(g.titleKey) : '';
    var title, text, done;
    if (ev.challenge) {
      var cname = t('challenge.' + ev.challenge + '.name');
      title = t('home.event.styleTitle', { name: cname });
      text = t('home.event.styleText', { name: cname, game: gameName });
      done = flag('dressup.challenge.' + ev.challenge);
    } else {
      title = t('home.event.' + ev.key + 'Title');
      text = t('home.event.' + ev.key + 'Text', { game: gameName });
      done = !!(ev.done && ev.done());
    }
    var dow = now.getDay() || 7;                  // ISO: Monday = 1 … Sunday = 7
    var mon = addDays(now, 1 - dow);
    var sun = addDays(mon, 6);
    var md = function (d) { return pad2(d.getMonth() + 1) + '.' + pad2(d.getDate()) + ' ' + weekday(d); };

    var banner = h('div', 'hp-event__banner' + (done ? ' is-done' : ''), [
      h('span', 'hp-event__label', t('home.event.label')),
      h('span', 'hp-event__icon', ev.icon, { 'aria-hidden': 'true' }),
      h('p', 'hp-event__title', title, { id: 'hp-event-title' }),
      done ? h('span', 'hp-event__stamp', t('home.event.clear')) : null
    ]);
    box.appendChild(banner);
    box.appendChild(h('p', 'hp-event__text', text));
    box.appendChild(h('p', 'hp-event__period', [
      h('span', null, '⏳', { 'aria-hidden': 'true' }), ' ',
      t('home.event.period', { from: md(mon), to: md(sun) })
    ]));
    box.appendChild(h('div', 'hp-event__foot', [
      g && g.href ? h('a', 'hg-btn hg-btn--pink hg-btn--small hp-event__go', t('home.event.go'),
        { href: g.href, 'data-sfx': 'click', 'data-key': 'event-go', 'aria-describedby': 'hp-event-title' }) : null,
      h('p', 'hp-event__note', t(done ? 'home.event.done' : 'home.event.note'))
    ]));
  }

  /* ═══════════ NEW GAME ═══════════ */
  function renderNew() {
    var ul = $('hp-new');
    if (!ul) return;
    clear(ul);
    games().filter(function (g) { return playable(g) && hasBadge(g, 'new'); }).forEach(function (g) {
      var tid = 'hp-new-t-' + g.id;
      ul.appendChild(h('li', 'hp-new__item', h('a', 'hp-newcard', [
        h('span', 'hp-newcard__thumb', [
          gameThumb(g, 'hp-newcard__img'),
          h('span', 'hp-newcard__ribbon', t('common.new'), { 'aria-hidden': 'true' })
        ]),
        h('span', 'hp-newcard__title', [h('span', 'hp-newcard__icon', g.icon, { 'aria-hidden': 'true' }), ' ', h('span', null, t(g.titleKey), { id: tid })]),
        h('span', 'hg-btn hg-btn--pink hg-btn--small hp-newcard__play', t('home.card.play'), { 'aria-hidden': 'true' })
      ], { href: g.href, 'aria-labelledby': tid, 'data-sfx': 'click', 'data-sfx-hover': 'hover', 'data-key': 'new:' + g.id })));
    });
  }

  /* ═══════════ HOT GAME ranking ═══════════ */
  function renderHot() {
    var ol = $('hp-hot');
    if (!ol) return;
    clear(ol);
    var list = games().filter(playable).map(function (g, i) {
      return { g: g, i: i, hot: hasBadge(g, 'hot') ? 1 : 0, plays: stat('games.played.' + g.id) };
    });
    // HOT-badged first, then the ones you play most, then registry order (stable).
    list.sort(function (a, b) { return (b.hot - a.hot) || (b.plays - a.plays) || (a.i - b.i); });
    list.slice(0, HOT_SHOWN).forEach(function (row, idx) {
      var g = row.g;
      var rank = idx + 1;
      var tid = 'hp-hot-t-' + g.id;
      ol.appendChild(h('li', 'hp-rank__item', h('a', 'hp-rank__link', [
        h('span', 'hp-rank__no hp-rank__no--' + rank, String(rank), { 'aria-hidden': 'true' }),
        h('span', 'hp-rank__thumb', gameThumb(g, 'hp-rank__img')),
        h('span', 'hp-rank__info', [
          h('b', 'hp-rank__title', [h('span', 'hp-rank__icon', g.icon, { 'aria-hidden': 'true' }), ' ', h('span', null, t(g.titleKey), { id: tid })]),
          h('small', 'hp-rank__meta', row.plays ? t('home.hot.plays', { n: fmt(row.plays) }) : t('home.hot.first'))
        ]),
        row.hot ? h('span', 'hg-badge hg-badge--hot hp-rank__hot', t('common.hot')) : null,
        h('span', 'hp-rank__go', '▶', { 'aria-hidden': 'true' })
      ], { href: g.href, 'aria-labelledby': tid, 'data-sfx': 'click', 'data-sfx-hover': 'hover', 'data-key': 'hot:' + g.id })));
    });
  }

  /* ═══════════ ALL GAMES grid ═══════════ */
  function renderAllGames() {
    var ul = $('hp-all');
    if (!ul) return;
    clear(ul);
    var nPlay = 0, nSoon = 0;
    games().forEach(function (g) {
      var id = 'hp-all-' + g.id;
      var soon = !playable(g);
      if (soon) nSoon++; else nPlay++;
      var kids = [
        h('div', 'hg-card__badges', badgeEls(g), { 'aria-hidden': 'true' }),
        h('div', 'hg-card__thumb hp-game__thumb', [
          gameThumb(g, 'hp-game__img'),
          soon ? h('span', 'hp-stamp', t('games.comingSoon')) : null
        ]),
        h('h3', 'hg-card__title hp-game__title', [h('span', 'hp-game__icon', g.icon, { 'aria-hidden': 'true' }), ' ', h('span', null, t(g.titleKey), { id: id + '-t' })]),
        h('p', 'hg-card__desc hp-game__desc', t(g.descKey), { id: id + '-d' }),
        h('div', 'hg-card__meta hp-game__meta', soon ? [
          h('span', 'hp-game__best', '♡ ♡ ♡', { 'aria-hidden': 'true' }),
          h('span', 'hg-btn hg-btn--small hp-game__play', t('common.soon'), { 'aria-disabled': 'true' })
        ] : [
          h('span', 'hp-game__best', bestText(g), { id: id + '-b' }),
          h('span', 'hg-btn hg-btn--pink hg-btn--small hp-game__play', t('home.card.play'), { 'aria-hidden': 'true' })
        ])
      ];
      var card = soon
        ? h('div', 'hg-card hg-card--soon hp-game is-soon', kids, { 'aria-disabled': 'true' })
        : h('a', 'hg-card hp-game', kids, {
          href: g.href, 'aria-labelledby': id + '-t', 'aria-describedby': id + '-d ' + id + '-b',
          'data-sfx': 'click', 'data-sfx-hover': 'hover', 'data-key': 'all:' + g.id
        });
      ul.appendChild(h('li', 'hp-all__item', card));
    });
    var count = $('hp-all-count');
    if (count) count.textContent = t('home.all.count', { n: nPlay, m: nSoon });
  }

  /* ═══════════ MY STATUS ═══════════ */
  function renderStatus() {
    var box = $('hp-status');
    if (!box) return;
    clear(box);
    var d = S();
    function row(labelKey, value) {
      return [h('dt', 'hp-stats__k', t(labelKey)), h('dd', 'hp-stats__v', value)];
    }
    box.appendChild(h('p', 'hp-status__top', [
      h('span', 'hp-coin', 'H', { 'aria-hidden': 'true' }),
      h('span', 'hp-status__label', t('hpoint.label')),
      h('b', 'hp-status__num', fmt(num(d.hpoint)))
    ]));
    box.appendChild(h('dl', 'hp-stats', [].concat(
      row('home.status.earned', fmt(num(d.hpointEarned))),
      row('home.status.played', fmt(stat('games.played'))),
      row('home.status.days', fmt(Math.max(stat('portal.days'), (d.visitDays || []).length)))
    )));
    box.appendChild(h('p', 'hp-side__note', t('home.status.note')));
    box.appendChild(h('a', 'hg-btn hg-btn--gold hg-btn--small hg-btn--block', t('home.status.exchange'),
      { href: 'collection.html#exchange', 'data-sfx': 'click', 'data-key': 'status-exchange' }));
  }

  /* ═══════════ COLLECTION % ═══════════ */
  function renderCollect() {
    var box = $('hp-collect');
    if (!box || !HG.unlocks) return;
    clear(box);
    var p = HG.unlocks.collectionProgress();
    var pct = Math.max(0, Math.min(100, p.pct || 0));
    box.appendChild(h('p', 'hp-collect__top', [
      h('b', 'hp-collect__pct', [String(pct), h('small', null, '%')]),
      h('span', 'hp-collect__count', t('home.collect.owned', { owned: fmt(p.owned), total: fmt(p.total) }))
    ]));
    var fill = h('span', 'hp-bar__fill');
    fill.style.width = pct + '%';
    box.appendChild(h('div', 'hp-bar', fill, {
      role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct),
      'aria-label': t('home.collect.aria', { n: pct })
    }));
    var kinds = h('ul', 'hp-collect__kinds');
    Object.keys(KIND_ICON).forEach(function (k) {
      var bk = p.byKind && p.byKind[k];
      if (!bk || !bk.total) return;
      kinds.appendChild(h('li', 'hp-collect__kind' + (bk.owned >= bk.total ? ' is-full' : ''), [
        h('span', 'hp-collect__kicon', KIND_ICON[k], { 'aria-hidden': 'true' }),
        h('span', 'hp-collect__klabel', t('kind.' + k)),
        h('b', 'hp-collect__kval', bk.owned + '/' + bk.total)
      ]));
    });
    box.appendChild(kinds);
    box.appendChild(h('p', 'hp-side__note', t('home.collect.note')));
    box.appendChild(h('a', 'hg-btn hg-btn--lavender hg-btn--small hg-btn--block', t('home.collect.open'),
      { href: 'collection.html', 'data-sfx': 'click', 'data-key': 'collect-open' }));
  }

  /* ═══════════ GAME MENU ═══════════ */
  function renderMenu() {
    var ul = $('hp-menu');
    if (!ul) return;
    clear(ul);
    games().filter(playable).forEach(function (g) {
      ul.appendChild(h('li', 'hp-menu__item', h('a', 'hp-menu__link', [
        h('span', 'hp-menu__icon', g.icon, { 'aria-hidden': 'true' }),
        h('span', 'hp-menu__name', t(g.titleKey)),
        hasBadge(g, 'new') ? h('span', 'hp-menu__flag hp-menu__flag--new', 'N', { 'aria-hidden': 'true', title: t('common.new') }) : null
      ], { href: g.href, 'data-sfx': 'click', 'data-sfx-hover': 'hover', 'data-key': 'menu:' + g.id })));
    });
  }

  /* ═══════════ latest ACHIEVEMENTS ═══════════ */
  function renderAchv() {
    var box = $('hp-achv');
    if (!box) return;
    clear(box);
    var all = (HG.data && HG.data.achievements) || [];
    var got = S().achievements || {};
    var ids = Object.keys(got).filter(function (id) { return HG.catalog && HG.catalog.get('achievement', id); });
    ids.sort(function (a, b) { return String(got[b]).localeCompare(String(got[a])); });
    box.appendChild(h('p', 'hp-achv__count', [
      h('span', null, '🏆', { 'aria-hidden': 'true' }), ' ',
      t('home.achv.count', { n: ids.length, total: all.length })
    ]));
    if (!ids.length) {
      box.appendChild(h('p', 'hp-achv__empty', t('home.achv.empty')));
    } else {
      var ul = h('ul', 'hp-achv__list');
      ids.slice(0, ACHV_SHOWN).forEach(function (id) {
        var a = HG.catalog.get('achievement', id);
        var when = new Date(got[id]);
        var ok = !isNaN(when.getTime());
        ul.appendChild(h('li', 'hp-achv__item', [
          h('span', 'hp-achv__medal', a.icon || '★', { 'aria-hidden': 'true' }),
          h('span', 'hp-achv__name', HG.i18n ? HG.i18n.itemName('achievement', id) : id),
          ok ? h('time', 'hp-achv__date', pad2(when.getMonth() + 1) + '.' + pad2(when.getDate()), { datetime: ymdISO(when) }) : null
        ]));
      });
      box.appendChild(ul);
    }
    box.appendChild(h('a', 'hg-btn hg-btn--pink hg-btn--small hg-btn--block', t('home.achv.all'),
      { href: 'collection.html#achievements', 'data-sfx': 'click', 'data-key': 'achv-all' }));
  }

  /* ═══════════ HAMIN'S ROOM preview ═══════════ */
  function roomLayout() {
    var r = S().room;
    var saved = r && Array.isArray(r.layout) ? r.layout : [];
    return saved.length ? saved : ((HG.data && HG.data.roomDefaultLayout) || []);
  }
  function clamp(v, lo, hi) { v = Number(v); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo; }

  function renderRoom() {
    var box = $('hp-room');
    if (!box) return;
    clear(box);
    var layout = roomLayout();
    var stage = h('span', 'hp-room__stage');
    stage.appendChild(softImg(ROOM_BG, 'hp-room__bg', function (img) { img.hidden = true; }));
    var placed = 0;
    layout.forEach(function (it, i) {
      var item = it && HG.catalog ? HG.catalog.get('room', it.id) : null;
      if (!item) return;
      placed++;
      var w = clamp(item.w || 0.1, 0.03, 0.6);
      var z = isFinite(Number(it.z)) ? clamp(it.z, 0, 500) : i;
      var wrap = h('span', 'hp-room__item' + (it.flip ? ' is-flip' : ''));
      wrap.style.left = (clamp(it.x, 0, 1) * 100).toFixed(2) + '%';
      wrap.style.top = (clamp(it.y, 0, 1) * 100).toFixed(2) + '%';
      wrap.style.width = (w * 100).toFixed(2) + '%';
      wrap.style.zIndex = String(1 + Math.round(z));
      wrap.style.setProperty('--w', String(w));
      wrap.appendChild(softImg(item.src, 'hp-room__img', function (img) {
        // Missing art → a little emoji in the same spot.
        var e = h('span', 'hp-room__emoji', item.emoji || '♡');
        if (img.parentNode) img.parentNode.replaceChild(e, img);
      }));
      stage.appendChild(wrap);
    });
    box.appendChild(h('a', 'hp-room__link', stage, { href: 'my-room.html', tabindex: '-1', 'aria-hidden': 'true' }));
    box.appendChild(h('p', 'hg-sr-only', t('home.room.aria')));
    box.appendChild(h('p', 'hp-room__count', [h('span', null, '🧸', { 'aria-hidden': 'true' }), ' ', t('home.room.count', { n: placed })]));
    box.appendChild(h('a', 'hg-btn hg-btn--mint hg-btn--small hg-btn--block', t('home.room.visit'),
      { href: 'my-room.html', 'data-sfx': 'click', 'data-key': 'room-visit' }));
  }

  /* ═══════════ NOTICE BOARD ═══════════ */
  function renderNotice() {
    var ol = $('hp-notice');
    if (!ol) return;
    clear(ol);
    var today = new Date();
    NOTICES.forEach(function (n, i) {
      var d = n.fixed ? new Date(n.fixed[0], n.fixed[1] - 1, n.fixed[2]) : addDays(today, -n.ago);
      var fresh = !n.fixed && n.ago <= 1;
      ol.appendChild(h('li', 'hp-notice__item', [
        h('span', 'hp-notice__no', t('home.notice.no', { n: NOTICES.length - i })),
        h('span', 'hp-notice__tag hp-notice__tag--' + n.tag, t('home.notice.tags.' + n.tag)),
        h('span', 'hp-notice__text', [t('home.notice.' + n.key), fresh ? h('span', 'hp-notice__new', 'N', { 'aria-hidden': 'true' }) : null]),
        h('time', 'hp-notice__date', ymdDots(d), { datetime: ymdISO(d) })
      ]));
    });
  }

  /* ═══════════ Refresh logic ═══════════ */
  function renderEverything() {
    withFocusKept(function () {
      renderTicker();
      renderToday();
      renderEvent();
      renderNew();
      renderHot();
      renderAllGames();
      renderStatus();
      renderCollect();
      renderMenu();
      renderAchv();
      renderRoom();
      renderNotice();
    });
    liveSig = liveSignature();
    roomSig = JSON.stringify(roomLayout());
  }

  /* Everything the live panels display, as one comparable string. */
  function liveSignature() {
    var d = S();
    var st = d.stats || {};
    var played = Object.keys(st).filter(function (k) { return k.indexOf('games.played') === 0; }).map(function (k) { return k + '=' + st[k]; });
    var unl = d.unlocked || {};
    return JSON.stringify([
      d.hpoint, d.hpointEarned, st['portal.days'], (d.visitDays || []).length, played.join(','),
      d.best || {}, Object.keys(d.achievements || {}).length,
      Object.keys(unl).map(function (k) { return k + ':' + (unl[k] || []).length; }).join(','),
      st['run.bestDistance'], st['photo.created'], st['room.placed'], d.flags || {}
    ]);
  }

  var liveSig = '', roomSig = '', saveTimer = 0;

  function refreshLive() {
    var sig = liveSignature();
    var rs = JSON.stringify(roomLayout());
    if (sig === liveSig && rs === roomSig) return;
    withFocusKept(function () {
      if (sig !== liveSig) {
        renderStatus();
        renderCollect();
        renderAchv();
        renderHot();
        renderAllGames();
        renderEvent();
      }
      if (rs !== roomSig) renderRoom();
    });
    liveSig = sig;
    roomSig = rs;
  }

  /* ═══════════ Init ═══════════ */
  function init() {
    if (!$('hp-today')) return;          // not the home page
    wireTicker();
    renderEverything();

    // Portal BGM (main.js also maps data-page="home" → 'portal'; this keeps it explicit).
    // HG.audio only starts it after the first user gesture.
    if (HG.audio && HG.audio.bgm && doc.body.getAttribute('data-bgm') !== 'none' && HG.audio.current !== 'portal') {
      HG.audio.bgm('portal');
    }

    doc.addEventListener('hg:lang', renderEverything);
    doc.addEventListener('hg:save', function () {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(refreshLive, 90);
    });

    // index.html#games from another page: land on the list with focus for keyboard users.
    if (win.location && win.location.hash === '#games') {
      var sec = $('games');
      if (sec) setTimeout(function () { try { sec.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 0);
    }
  }

  if (HG.onReady) HG.onReady(init);
  else doc.addEventListener('hg:ready', init);
})(window.HG = window.HG || {}, window, document);

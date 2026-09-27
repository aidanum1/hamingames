/* HAMIN GAMES — shared catalog helpers (docs/CONTRACT.md §3.1)

   Loaded BEFORE the catalog data files (games.js, wardrobe.js, stickers.js …),
   so every lookup reads HG.data lazily at call time. Lookups are cached per
   kind and re-indexed automatically when a data array is replaced or grows.

   HG.catalog.kinds                → ['wardrobe','sticker','frame','pose','background','room','memory','achievement']
   HG.catalog.all(kind)            → array (never null; [] when the data file is missing)
   HG.catalog.get(kind, id)        → item or null
   HG.catalog.exists(kind, id)     → bool
   HG.catalog.unlockOf(kind, item) → item.unlock, or {type:'default'} / {type:'achievement'}
   HG.catalog.isDefault(kind, item)→ owned from the start?
   HG.catalog.price(kind, id)      → H-POINT cost for unlock.type 'hpoint', else null
   HG.catalog.iconSrc(kind, item)  → best small image path for an icon, or null
   HG.catalog.emoji(kind, item|id) → fallback glyph for missing art
   HG.catalog.parseRef('kind:id')  → {kind, id}
   HG.catalog.nameKey(kind, id)    → 'kind.id.name'
   HG.catalog.game(id)             → entry of HG.data.games or null */
(function (HG) {
  'use strict';
  HG.data = HG.data || {};

  var KINDS = ['wardrobe', 'sticker', 'frame', 'pose', 'background', 'room', 'memory', 'achievement'];

  /* Where each kind lives in HG.data. */
  function source(kind) {
    var d = HG.data;
    switch (kind) {
      case 'wardrobe': return (d.wardrobe && Array.isArray(d.wardrobe.items)) ? d.wardrobe.items : [];
      case 'sticker': return d.stickers || [];
      case 'frame': return d.frames || [];
      case 'pose': return d.poses || [];
      case 'background': return d.backgrounds || [];
      case 'room': return d.roomItems || [];
      case 'memory': return d.memories || [];
      case 'achievement': return d.achievements || [];
      case 'game': return d.games || [];
      default: return [];
    }
  }

  var cache = {};  // kind -> {arr, len, map}

  function index(kind) {
    var arr = source(kind);
    var c = cache[kind];
    if (!c || c.arr !== arr || c.len !== arr.length) {
      var map = Object.create(null);
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] && arr[i].id != null) map[arr[i].id] = arr[i];
      }
      c = cache[kind] = { arr: arr, len: arr.length, map: map };
    }
    return c;
  }

  function all(kind) { return source(kind); }

  function get(kind, id) {
    if (id == null) return null;
    return index(kind).map[id] || null;
  }

  function resolve(kind, itemOrId) {
    return (itemOrId && typeof itemOrId === 'object') ? itemOrId : get(kind, itemOrId);
  }

  function unlockOf(kind, itemOrId) {
    if (kind === 'achievement') return { type: 'achievement' };
    var item = resolve(kind, itemOrId);
    return (item && item.unlock) ? item.unlock : { type: 'default' };
  }

  function isDefault(kind, itemOrId) {
    if (kind === 'achievement') return false;
    var item = resolve(kind, itemOrId);
    if (!item) return false;
    return unlockOf(kind, item).type === 'default';
  }

  function price(kind, id) {
    var u = unlockOf(kind, id);
    return (u.type === 'hpoint' && isFinite(u.cost)) ? Number(u.cost) : null;
  }

  function iconSrc(kind, itemOrId) {
    var item = resolve(kind, itemOrId);
    if (!item) return null;
    if (kind === 'wardrobe' || kind === 'background') return item.thumb || item.src || null;
    return item.src || item.thumb || null;
  }

  var KIND_EMOJI = {
    wardrobe: '👕', sticker: '⭐', frame: '🖼️', pose: '🙆', background: '🌈',
    room: '🏠', memory: '💌', achievement: '🏆', game: '🎮'
  };
  var SLOT_EMOJI = {
    background: '🌈', body: '🧍', shoes: '👟', bottom: '👖', top: '👕', shirt: '👔',
    knit: '🧶', hoodie: '🧥', outer: '🧥', head: '💇', accessory: '💍', bag: '👜', hat: '🧢'
  };

  function emoji(kind, itemOrId) {
    var item = resolve(kind, itemOrId);
    if (item) {
      if (item.emoji) return item.emoji;
      if (item.icon) return item.icon;
      if (kind === 'wardrobe' && SLOT_EMOJI[item.slot]) return SLOT_EMOJI[item.slot];
    }
    return KIND_EMOJI[kind] || '♡';
  }

  function parseRef(ref) {
    var s = String(ref || '');
    var i = s.indexOf(':');
    return i < 0 ? { kind: s, id: '' } : { kind: s.slice(0, i), id: s.slice(i + 1) };
  }

  HG.catalog = {
    kinds: KINDS.slice(),
    all: all,
    get: get,
    exists: function (kind, id) { return !!get(kind, id); },
    unlockOf: unlockOf,
    isDefault: isDefault,
    price: price,
    iconSrc: iconSrc,
    emoji: emoji,
    parseRef: parseRef,
    nameKey: function (kind, id) { return kind + '.' + id + '.name'; },
    games: function () { return source('game'); },
    game: function (id) { return get('game', id); }
  };
})(window.HG = window.HG || {});

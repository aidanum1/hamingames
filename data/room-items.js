/* HAMIN GAMES — My Room decorations (see docs/CONTRACT.md §6.4)
   w = display width as a fraction of the room stage width.
   zone: where it may be placed ('floor' lower 55%, 'wall' upper 60%, 'any').
   interactive: tiny click animation id handled by js/my-room.js. */
(function (HG) {
  HG.data = HG.data || {};
  var D = { type: 'default' };
  function hp(cost) { return { type: 'hpoint', cost: cost }; }
  function rule(hintKey) { return { type: 'rule', hintKey: hintKey }; }
  function it(id, cat, w, zone, unlock, emoji, interactive) {
    return { id: id, cat: cat, src: 'assets/room/items/' + id + '.webp', w: w, zone: zone,
             unlock: unlock, emoji: emoji, interactive: interactive || null };
  }

  HG.data.roomCats = ['furniture', 'lighting', 'wall', 'desk', 'cds', 'books', 'plants', 'plushies', 'frames', 'food', 'collectibles'];

  HG.data.roomItems = [
    it('room-bed', 'furniture', 0.36, 'floor', D, '🛏️'),
    it('room-desk', 'furniture', 0.26, 'floor', D, '🪑'),
    it('room-chair', 'furniture', 0.11, 'floor', D, '🪑'),
    it('room-rug-round', 'furniture', 0.30, 'floor', D, '⭕'),
    it('room-bookshelf', 'furniture', 0.16, 'floor', hp(200), '📚'),
    it('room-beanbag', 'furniture', 0.14, 'floor', hp(250), '🛋️'),
    it('room-mirror', 'furniture', 0.10, 'any', hp(300), '🪞'),
    it('room-lamp', 'lighting', 0.08, 'any', D, '💡', 'lamp'),
    it('room-fairy-lights', 'lighting', 0.30, 'wall', hp(250), '✨', 'lights'),
    it('room-neon-heart', 'lighting', 0.12, 'wall', rule('hint.collection50'), '💗', 'neon'),
    it('room-window', 'wall', 0.20, 'wall', D, '🪟', 'window'),
    it('room-clock', 'wall', 0.07, 'wall', D, '🕐', 'clock'),
    it('room-poster-stars', 'wall', 0.12, 'wall', hp(150), '🌟'),
    it('room-calendar-0524', 'wall', 0.09, 'wall', rule('hint.secret0524'), '📅'),
    it('room-cd-player', 'desk', 0.10, 'any', D, '💿', 'cdplayer'),
    it('room-laptop', 'desk', 0.10, 'any', hp(300), '💻', 'laptop'),
    it('room-camera', 'desk', 0.07, 'any', rule('hint.photoMany'), '📷', 'camera'),
    it('room-photo-board', 'wall', 0.16, 'wall', rule('hint.photoFirst'), '🖼️', 'photoboard'),
    it('room-cd-rack', 'cds', 0.08, 'any', hp(200), '📀'),
    it('room-cd-stack', 'cds', 0.06, 'any', hp(100), '💿'),
    it('room-books-stack', 'books', 0.07, 'any', D, '📖'),
    it('room-comic-pile', 'books', 0.07, 'any', hp(100), '📚'),
    it('room-plant-monstera', 'plants', 0.11, 'floor', D, '🪴'),
    it('room-plant-cactus', 'plants', 0.05, 'any', hp(100), '🌵'),
    it('room-flower-vase', 'plants', 0.06, 'any', hp(150), '💐'),
    it('room-plush-sheep', 'plushies', 0.08, 'any', rule('hint.sheepSmile3'), '🐑', 'plush'),
    it('room-plush-puppy', 'plushies', 0.08, 'any', rule('hint.runCaught5'), '🐶', 'plush'),
    it('room-plush-bear', 'plushies', 0.08, 'any', hp(300), '🧸', 'plush'),
    it('room-framed-look', 'frames', 0.10, 'wall', rule('hint.challengeFirst'), '🖼️'),
    it('room-frame-polaroids', 'frames', 0.12, 'wall', hp(150), '📸'),
    it('room-lunchbox', 'food', 0.07, 'any', rule('hint.lunchRounds'), '🍱'),
    it('room-strawberry-milk', 'food', 0.04, 'any', hp(100), '🥛'),
    it('room-snack-basket', 'food', 0.08, 'any', rule('hint.runSnacks'), '🧺'),
    it('room-trophy-run', 'collectibles', 0.06, 'any', rule('hint.runDistance'), '🏆'),
    it('room-dance-shoes', 'collectibles', 0.07, 'any', rule('hint.practiceClear'), '👟'),
    it('room-mic-stand', 'collectibles', 0.07, 'floor', rule('hint.practiceS'), '🎤'),
    it('room-star-jar', 'collectibles', 0.05, 'any', rule('hint.memories10'), '🫙', 'starjar')
  ];

  // Default layout for a brand-new room (x,y = item center in 0..1 of the stage).
  HG.data.roomDefaultLayout = [
    { id: 'room-window', x: 0.50, y: 0.24 },
    { id: 'room-clock', x: 0.80, y: 0.16 },
    { id: 'room-rug-round', x: 0.52, y: 0.86 },
    { id: 'room-bed', x: 0.24, y: 0.70 },
    { id: 'room-desk', x: 0.78, y: 0.66 },
    { id: 'room-chair', x: 0.70, y: 0.78 },
    { id: 'room-lamp', x: 0.86, y: 0.50 },
    { id: 'room-cd-player', x: 0.74, y: 0.50 },
    { id: 'room-plant-monstera', x: 0.94, y: 0.78 }
  ];
})(window.HG = window.HG || {});

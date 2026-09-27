/* HAMIN GAMES — Photo Booth catalogs: stickers, frames, poses, backgrounds
   (see docs/CONTRACT.md §6.3). Names come from translations:
   sticker.<id>.name, frame.<id>.name, pose.<id>.name, background.<id>.name */
(function (HG) {
  HG.data = HG.data || {};
  var D = { type: 'default' };
  function hp(cost) { return { type: 'hpoint', cost: cost }; }
  function rule(hintKey) { return { type: 'rule', hintKey: hintKey }; }
  function st(id, cat, unlock, emoji) {
    return { id: id, cat: cat, src: 'assets/stickers/' + id + '.webp', unlock: unlock, emoji: emoji };
  }

  HG.data.stickerCats = ['hearts', 'stars', 'flowers', 'ribbons', 'cds', 'music', 'smiley', 'food', 'sheep', 'pixel', 'sparkles', 'special'];

  HG.data.stickers = [
    st('st-heart-pink', 'hearts', D, '💗'),
    st('st-heart-red', 'hearts', D, '❤️'),
    st('st-heart-glossy', 'hearts', hp(120), '💖'),
    st('st-heart-wings', 'hearts', hp(200), '💕'),
    st('st-star-gold', 'stars', D, '⭐'),
    st('st-star-blue', 'stars', D, '🌟'),
    st('st-star-twinkle', 'stars', hp(120), '✨'),
    st('st-shooting-star', 'stars', rule('hint.secretLogo'), '🌠'),
    st('st-flower-daisy', 'flowers', D, '🌼'),
    st('st-flower-cherry', 'flowers', D, '🌸'),
    st('st-flower-tulip', 'flowers', hp(100), '🌷'),
    st('st-ribbon-pink', 'ribbons', D, '🎀'),
    st('st-ribbon-blue', 'ribbons', hp(100), '🎀'),
    st('st-cd-rainbow', 'cds', D, '💿'),
    st('st-cd-case', 'cds', hp(150), '📀'),
    st('st-note-single', 'music', D, '🎵'),
    st('st-note-double', 'music', D, '🎶'),
    st('st-headphones', 'music', hp(200), '🎧'),
    st('st-smiley-yellow', 'smiley', D, '😊'),
    st('st-smiley-wink', 'smiley', hp(100), '😉'),
    st('st-strawberry', 'food', rule('hint.lunchScore'), '🍓'),
    st('st-strawberry-milk', 'food', rule('hint.lunchScore'), '🥛'),
    st('st-dumpling', 'food', hp(120), '🥟'),
    st('st-ramen', 'food', hp(120), '🍜'),
    st('st-cake-slice', 'food', rule('hint.lunchDesserts'), '🍰'),
    st('st-rice-ball', 'food', D, '🍙'),
    st('st-sheep-cloud', 'sheep', rule('hint.sheepSmile'), '🐑'),
    st('st-sheep-tiny', 'sheep', rule('hint.secretSheep'), '🐏'),
    st('st-pixel-cursor', 'pixel', D, '🖱️'),
    st('st-pixel-floppy', 'pixel', hp(150), '💾'),
    st('st-pixel-window', 'pixel', hp(150), '🪟'),
    st('st-pixel-heart', 'pixel', D, '💟'),
    st('st-sparkle-white', 'sparkles', D, '✨'),
    st('st-sparkle-pink', 'sparkles', D, '💫'),
    st('st-sparkle-cluster', 'sparkles', hp(100), '🌟'),
    st('st-puppy', 'special', rule('hint.runCaught'), '🐶'),
    st('st-trophy', 'special', rule('hint.runDistance'), '🏆'),
    st('st-mic', 'special', rule('hint.practiceClear'), '🎤'),
    st('st-camera', 'special', rule('hint.photoMany'), '📷'),
    st('st-lucky-0524', 'special', rule('hint.secret0524'), '🍀')
  ];

  // Frames are drawn in code (photo-booth.js). type decides layout.
  HG.data.frames = [
    { id: 'fr-4cut-pink', type: '4cut', color: 'pink', unlock: D },
    { id: 'fr-4cut-blue', type: '4cut', color: 'blue', unlock: D },
    { id: 'fr-4cut-black', type: '4cut', color: 'black', unlock: hp(200) },
    { id: 'fr-polaroid-white', type: 'polaroid', color: 'white', unlock: D },
    { id: 'fr-polaroid-pastel', type: 'polaroid', color: 'pastel', unlock: hp(150) },
    { id: 'fr-photocard-pink', type: 'photocard', color: 'pink', unlock: D },
    { id: 'fr-photocard-holo', type: 'photocard', color: 'holo', unlock: rule('hint.photoMany') },
    { id: 'fr-square-heart', type: 'square', color: 'heart', unlock: D },
    { id: 'fr-square-checker', type: 'square', color: 'checker', unlock: hp(150) },
    { id: 'fr-webcam-retro', type: 'webcam', color: 'retro', unlock: D },
    { id: 'fr-webcam-y2k', type: 'webcam', color: 'y2k', unlock: rule('hint.collection25') }
  ];

  // Poses: 'look' = the player's Dress Up look (layered). 'image' = fixed pose card.
  HG.data.poses = [
    { id: 'pose-look', type: 'look', unlock: D },
    { id: 'pose-vsign', type: 'image', src: 'assets/photobooth/poses/pose-vsign.webp', unlock: D },
    { id: 'pose-heart', type: 'image', src: 'assets/photobooth/poses/pose-heart.webp', unlock: D },
    { id: 'pose-wave', type: 'image', src: 'assets/photobooth/poses/pose-wave.webp', unlock: D },
    { id: 'pose-dance', type: 'image', src: 'assets/photobooth/poses/pose-dance.webp', unlock: rule('hint.practiceS') },
    { id: 'pose-sheep-smile', type: 'image', src: 'assets/photobooth/poses/pose-sheep-smile.webp', unlock: rule('hint.sheepSmile') },
    { id: 'pose-run', type: 'image', src: 'assets/photobooth/poses/pose-run.webp', unlock: rule('hint.runDistance') },
    { id: 'pose-stage', type: 'image', src: 'assets/photobooth/poses/pose-stage.webp', unlock: rule('hint.challengeStage') },
    { id: 'pose-cozy', type: 'image', src: 'assets/photobooth/poses/pose-cozy.webp', unlock: hp(400) }
  ];

  // Backgrounds shared by Dress Up and Photo Booth (1200x1600 illustrations) plus
  // code-drawn pattern backgrounds for the Photo Booth.
  function bg(id, use, unlock) {
    return { id: id, src: 'assets/backgrounds/' + id + '.webp', thumb: 'assets/backgrounds/thumbs/' + id + '.webp', use: use, unlock: unlock };
  }
  function pat(id, pattern, colors, unlock) {
    return { id: id, pattern: pattern, colors: colors, use: ['photo'], unlock: unlock };
  }
  HG.data.backgrounds = [
    bg('bg-bedroom', ['dressup', 'photo'], D),
    bg('bg-practice', ['dressup', 'photo'], D),
    bg('bg-street', ['dressup', 'photo'], D),
    bg('bg-stage', ['dressup', 'photo'], hp(300)),
    bg('bg-starry', ['dressup', 'photo'], rule('hint.collection25')),
    bg('bg-cafeteria', ['dressup', 'photo'], rule('hint.lunchPlay')),
    bg('bg-park', ['dressup', 'photo'], rule('hint.runPlay')),
    pat('bg-pat-dots', 'dots', ['--c-blush', '--c-pink'], D),
    pat('bg-pat-checker', 'checker', ['--c-sky', '--c-powder'], D),
    pat('bg-pat-hearts', 'hearts', ['--c-blush', '--c-cherry'], D),
    pat('bg-pat-stars', 'stars', ['--c-lavender', '--c-gold'], hp(100)),
    pat('bg-pat-grid', 'grid', ['--c-mint', '--c-white'], hp(100))
  ];
})(window.HG = window.HG || {});

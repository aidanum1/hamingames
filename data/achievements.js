/* HAMIN GAMES — achievements (see docs/CONTRACT.md §6.6, §7)
   Names/descriptions: achievement.<id>.name / achievement.<id>.desc
   secret:true → shown as "???" until unlocked. reward defaults to 150 H-POINT. */
(function (HG) {
  HG.data = HG.data || {};
  HG.data.achievements = [
    { id: 'first-game', icon: '★', when: { stat: 'games.played', gte: 1 } },
    { id: 'all-rounder', icon: '🎮', when: { all: [
      { stat: 'games.played.dress-up', gte: 1 }, { stat: 'games.played.lunch-time', gte: 1 },
      { stat: 'games.played.photo-booth', gte: 1 }, { stat: 'games.played.run-hamin', gte: 1 },
      { stat: 'games.played.practice-room', gte: 1 }, { stat: 'games.played.my-room', gte: 1 } ] }, reward: 300 },
    { id: 'stylist', icon: '👕', when: { stat: 'dressup.looksSaved', gte: 1 } },
    { id: 'fashion-star', icon: '🌟', when: { stat: 'dressup.fiveStars', gte: 1 } },
    { id: 'challenge-master', icon: '🎀', when: { stat: 'dressup.challengesCleared', gte: 7 }, reward: 300 },
    { id: 'lunch-master', icon: '🍱', when: { stat: 'lunch.rounds', gte: 10 } },
    { id: 'combo-chef', icon: '🍜', when: { stat: 'lunch.bestCombo', gte: 10 } },
    { id: 'run-hamin-run', icon: '🏃', when: { stat: 'run.bestDistance', gte: 1000 } },
    { id: 'marathon', icon: '🏅', when: { stat: 'run.totalDistance', gte: 10000 }, reward: 300 },
    { id: 'snack-lover', icon: '🍪', when: { stat: 'run.snacks', gte: 100 } },
    { id: 'photo-addict', icon: '📸', when: { stat: 'photo.created', gte: 10 } },
    { id: 'sticker-artist', icon: '💖', when: { stat: 'photo.stickersPlaced', gte: 50 } },
    { id: 'perfect-combo', icon: '🎵', when: { stat: 'practice.maxCombo', gte: 50 } },
    { id: 'rank-s', icon: '🅢', when: { flag: 'practice.rank.S' } },
    { id: 'hard-mode', icon: '🔥', when: { stat: 'practice.hardClears', gte: 1 }, reward: 200 },
    { id: 'room-designer', icon: '🏠', when: { stat: 'room.placed', gte: 20 } },
    { id: 'collector', icon: '📒', when: { memories: 10 }, reward: 300 },
    { id: 'globetrotter', icon: '🌏', when: { stat: 'portal.langsTried', gte: 4 } },
    { id: 'regular', icon: '📅', when: { stat: 'portal.days', gte: 5 } },
    { id: 'rich', icon: '💰', when: { stat: 'hpoint.earned', gte: 5000 } },
    { id: 'secret-star-shower', icon: '🌠', when: { flag: 'secret.logoStars' }, secret: true },
    { id: 'secret-0524', icon: '🍀', when: { flag: 'secret.visitor0524' }, secret: true },
    { id: 'secret-sheep', icon: '🐑', when: { flag: 'secret.hiddenSheep' }, secret: true },
    { id: 'secret-dj', icon: '💿', when: { flag: 'secret.cdDj' }, secret: true },
    { id: 'secret-closet', icon: '🧥', when: { flag: 'secret.closet' }, secret: true }
  ];
})(window.HG = window.HG || {});

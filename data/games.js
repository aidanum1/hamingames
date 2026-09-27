/* HAMIN GAMES — portal game registry (see docs/CONTRACT.md §6.1) */
(function (HG) {
  HG.data = HG.data || {};
  HG.data.games = [
    { id: 'dress-up', href: 'dress-up.html', titleKey: 'games.dressUp.title', descKey: 'games.dressUp.desc',
      thumb: 'assets/ui/thumbs/dress-up.webp', icon: '👕', badges: ['new', 'hot'], bestKey: 'dressup.stars', bestFormat: 'stars' },
    { id: 'photo-booth', href: 'photo-booth.html', titleKey: 'games.photoBooth.title', descKey: 'games.photoBooth.desc',
      thumb: 'assets/ui/thumbs/photo-booth.webp', icon: '📸', badges: ['hot'], bestKey: null, bestFormat: null },
    { id: 'run-hamin', href: 'run-hamin.html', titleKey: 'games.runHamin.title', descKey: 'games.runHamin.desc',
      thumb: 'assets/ui/thumbs/run-hamin.webp', icon: '🐶', badges: ['new'], bestKey: 'run-hamin', bestFormat: 'meters' },
    { id: 'lunch-time', href: 'lunch-time.html', titleKey: 'games.lunchTime.title', descKey: 'games.lunchTime.desc',
      thumb: 'assets/ui/thumbs/lunch-time.webp', icon: '🍜', badges: [], bestKey: 'lunch-time', bestFormat: 'points' },
    { id: 'practice-room', href: 'practice-room.html', titleKey: 'games.practiceRoom.title', descKey: 'games.practiceRoom.desc',
      thumb: 'assets/ui/thumbs/practice-room.webp', icon: '🎵', badges: ['new'], bestKey: 'practice-room', bestFormat: 'points' },
    { id: 'my-room', href: 'my-room.html', titleKey: 'games.myRoom.title', descKey: 'games.myRoom.desc',
      thumb: 'assets/ui/thumbs/my-room.webp', icon: '🏠', badges: [], bestKey: null, bestFormat: null },
    { id: 'soon-picnic', comingSoon: true, titleKey: 'games.soonPicnic.title', descKey: 'games.soon.desc', icon: '🧺', badges: [] },
    { id: 'soon-band', comingSoon: true, titleKey: 'games.soonBand.title', descKey: 'games.soon.desc', icon: '🎸', badges: [] },
    { id: 'soon-snow', comingSoon: true, titleKey: 'games.soonSnow.title', descKey: 'games.soon.desc', icon: '⛄', badges: [] }
  ];
})(window.HG = window.HG || {});

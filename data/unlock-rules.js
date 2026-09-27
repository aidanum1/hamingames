/* HAMIN GAMES — central cross-game unlock rules (see docs/CONTRACT.md §7)
   Games only report stats/flags/scores; this file decides what unlocks.
   Every rule fires once. hint.* keys (translations) explain locked items. */
(function (HG) {
  HG.data = HG.data || {};
  function g(kind, id) { return { kind: kind, id: id }; }

  HG.data.unlockRules = [
    // ── Portal ───────────────────────────────────────────────
    { id: 'first-visit', when: { stat: 'portal.days', gte: 1 }, grant: [g('memory', 'mem-001')] },

    // ── Dress Up ────────────────────────────────────────────
    { id: 'dressup-first-look', when: { stat: 'dressup.looksSaved', gte: 1 }, grant: [g('memory', 'mem-002')] },
    { id: 'dressup-first-challenge', when: { stat: 'dressup.challengesCleared', gte: 1 },
      grant: [g('room', 'room-framed-look')] },            // Dress Up challenge → framed photo for My Room
    { id: 'dressup-stage-ready', when: { flag: 'dressup.challenge.stage-ready' },
      grant: [g('memory', 'mem-009'), g('pose', 'pose-stage')] },
    { id: 'dressup-winter-day', when: { flag: 'dressup.challenge.winter-day' }, grant: [g('memory', 'mem-015')] },
    { id: 'dressup-trip-day', when: { flag: 'dressup.challenge.trip-day' }, grant: [g('memory', 'mem-016')] },
    { id: 'dressup-closet', when: { flag: 'secret.closet' }, grant: [g('memory', 'mem-012')] },

    // ── Lunch Time ──────────────────────────────────────────
    { id: 'lunch-play', when: { stat: 'games.played.lunch-time', gte: 1 }, grant: [g('background', 'bg-cafeteria')] },
    { id: 'lunch-champion', when: { best: 'lunch-time', gte: 1500 },   // Lunch high score → strawberry stickers
      grant: [g('sticker', 'st-strawberry'), g('sticker', 'st-strawberry-milk'), g('memory', 'mem-003')] },
    { id: 'lunch-sheep-smile', when: { stat: 'lunch.sheepSmiles', gte: 1 },
      grant: [g('memory', 'mem-004'), g('sticker', 'st-sheep-cloud'), g('pose', 'pose-sheep-smile')] },
    { id: 'lunch-sheep-plush', when: { stat: 'lunch.sheepSmiles', gte: 3 }, grant: [g('room', 'room-plush-sheep')] },
    { id: 'lunch-rounds', when: { stat: 'lunch.rounds', gte: 10 }, grant: [g('room', 'room-lunchbox')] },
    { id: 'lunch-desserts', when: { stat: 'lunch.desserts', gte: 20 },
      grant: [g('memory', 'mem-014'), g('sticker', 'st-cake-slice')] },

    // ── Run, Hamin! ─────────────────────────────────────────
    { id: 'run-play', when: { stat: 'games.played.run-hamin', gte: 1 }, grant: [g('background', 'bg-park')] },
    { id: 'run-500', when: { stat: 'run.bestDistance', gte: 500 }, grant: [g('memory', 'mem-006')] },
    { id: 'run-1000', when: { stat: 'run.bestDistance', gte: 1000 },   // Run distance → sporty sneakers
      grant: [g('wardrobe', 'shoes-sporty-runner'), g('room', 'room-trophy-run'), g('sticker', 'st-trophy'), g('pose', 'pose-run')] },
    { id: 'run-caught-1', when: { stat: 'run.caught', gte: 1 }, grant: [g('sticker', 'st-puppy')] },
    { id: 'run-caught-5', when: { stat: 'run.caught', gte: 5 }, grant: [g('memory', 'mem-010'), g('room', 'room-plush-puppy')] },
    { id: 'run-snacks', when: { stat: 'run.snacks', gte: 50 }, grant: [g('room', 'room-snack-basket')] },

    // ── Practice Room ───────────────────────────────────────
    { id: 'practice-first-clear', when: { stat: 'practice.clears', gte: 1 },
      grant: [g('memory', 'mem-005'), g('wardrobe', 'top-practice-tee'), g('room', 'room-dance-shoes'), g('sticker', 'st-mic')] },
    { id: 'practice-rank-s', when: { flag: 'practice.rank.S' },          // S rank → dance pose
      grant: [g('pose', 'pose-dance'), g('memory', 'mem-011'), g('room', 'room-mic-stand')] },
    { id: 'practice-hard', when: { stat: 'practice.hardClears', gte: 1 }, grant: [g('wardrobe', 'bottom-track-pants')] },

    // ── Photo Booth ─────────────────────────────────────────
    { id: 'photo-first', when: { stat: 'photo.created', gte: 1 },        // Photo Booth → room photo board
      grant: [g('room', 'room-photo-board'), g('memory', 'mem-007')] },
    { id: 'photo-many', when: { stat: 'photo.created', gte: 5 },
      grant: [g('room', 'room-camera'), g('frame', 'fr-photocard-holo'), g('sticker', 'st-camera')] },

    // ── My Room ─────────────────────────────────────────────
    { id: 'room-cozy', when: { stat: 'room.placed', gte: 5 }, grant: [g('memory', 'mem-008')] },

    // ── Collection milestones ──────────────────────────────
    { id: 'collection-25', when: { collectionPct: 25 },                  // Collection → special background
      grant: [g('background', 'bg-starry'), g('frame', 'fr-webcam-y2k')] },
    { id: 'collection-30', when: { collectionPct: 30 }, grant: [g('memory', 'mem-013')] },
    { id: 'collection-50', when: { collectionPct: 50 }, grant: [g('room', 'room-neon-heart'), g('wardrobe', 'hat-special-star')] },
    { id: 'memories-10', when: { memories: 10 }, grant: [g('room', 'room-star-jar')] },
    { id: 'hpoint-collector', when: { stat: 'hpoint.earned', gte: 3000 }, grant: [g('memory', 'mem-018')] },

    // ── Secrets ─────────────────────────────────────────────
    { id: 'secret-logo', when: { flag: 'secret.logoStars' }, grant: [g('sticker', 'st-shooting-star')] },
    { id: 'secret-sheep', when: { flag: 'secret.hiddenSheep' }, grant: [g('sticker', 'st-sheep-tiny')] },
    { id: 'secret-0524', when: { flag: 'secret.visitor0524' },
      grant: [g('memory', 'mem-017'), g('room', 'room-calendar-0524'), g('sticker', 'st-lucky-0524')] }
  ];
})(window.HG = window.HG || {});

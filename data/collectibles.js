/* HAMIN GAMES — collectible memory cards (see docs/CONTRACT.md §6.5)
   Names/descriptions: memory.<id>.name / memory.<id>.desc
   Memories are granted by data/unlock-rules.js. */
(function (HG) {
  HG.data = HG.data || {};
  function mem(no, secret) {
    var id = 'mem-' + ('00' + no).slice(-3);
    return { id: id, no: no, src: 'assets/collection/' + id + '.webp', unlock: { type: 'rule' }, secret: !!secret };
  }
  HG.data.memories = [
    mem(1),   // FIRST VISIT
    mem(2),   // DRESS UP DAY
    mem(3),   // LUNCH CHAMPION
    mem(4),   // SHEEP SMILE
    mem(5),   // PRACTICE ROOM
    mem(6),   // RUN, HAMIN!
    mem(7),   // PHOTO BOOTH
    mem(8),   // COZY DAY
    mem(9),   // STAGE READY
    mem(10),  // PUPPY FRIEND
    mem(11),  // RHYTHM STAR
    mem(12, true), // CLOSET EXPLORER (secret)
    mem(13),  // STARRY NIGHT
    mem(14),  // SWEET TOOTH
    mem(15),  // WINTER DAY
    mem(16),  // TRIP DAY
    mem(17, true), // LUCKY 0524 (secret)
    mem(18)   // H-POINT COLLECTOR
  ];
})(window.HG = window.HG || {});

/* HAMIN GAMES — js/practice-room.js
   HAMIN PRACTICE ROOM: a 4-lane rhythm game (← ↓ ↑ →) drawn on one Canvas.

   Music   data/songs.js holds three ORIGINAL chiptune songs as pattern data. They are compiled
           to a beat timeline (HG.data.songTools.compile) and played here with Web Audio through
           HG.audio.ctx → our song bus → HG.audio.musicBus (so volume + mute follow the settings).
           A song with `audioSrc` plays that file instead (HTMLAudioElement), placed by bpm/offset.
   Timing  Everything is derived from AudioContext time, never from frame counts:
             songPos = ctxTime − anchor − outputLatency − userOffset
           anchor = the context time at which song time 0 is scheduled. Key/touch events are
           mapped from event.timeStamp to context time, so judging is frame-rate independent.
           Windows: PERFECT ±50 ms · GOOD ±110 ms · pressing up to 150 ms early = MISS ·
           a note passing the line by more than 110 ms = MISS.
   Pause   Esc / P / ❚❚ / tab hidden / any modal. The scheduled audio is cut (its gain node is
           dropped), and RESUME replays the last 3 beats (3 · 2 · 1) from the paused position, so
           audio and arrows stay locked together.
   Score   PERFECT 300 · GOOD 150, × combo multiplier (+0.1 per 10 combo, max ×2.0).
           Accuracy = (PERFECT + GOOD/2) / notes. Rank S: ≥95 % and no MISS · A ≥85 % · B ≥70 % ·
           C ≥50 % (C and up = clear). Ranks per chart in save.practice.ranks['songId:diff'],
           per-chart bests in save.practice.best, timing offset in save.practice.offset (ms).
   Rewards only via HG.unlocks.finishGame('practice-room', …) — stats practice.clears /
           perfects / hardClears / rankS / maxCombo and flag practice.rank.S (docs/CONTRACT.md §7.2).
   Motion  HG.ui.reducedMotion(): no sparkles, bounces, beat pulses or dancer bob. */
(function (HG, win, doc) {
  'use strict';

  var GAME = 'practice-room';
  var DIFFS = ['easy', 'normal', 'hard'];
  var KEYMAP = { ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3, KeyD: 0, KeyF: 1, KeyJ: 2, KeyK: 3 };
  var KEYMAP_LEGACY = { left: 0, down: 1, up: 2, right: 3, arrowleft: 0, arrowdown: 1, arrowup: 2, arrowright: 3, d: 0, f: 1, j: 2, k: 3 };
  var LANE_IDS = ['left', 'down', 'up', 'right'];
  var LANE_ROT = [-Math.PI / 2, Math.PI, 0, Math.PI / 2];
  var LANE_TOK = [                      // light, main, dark
    ['--c-pink', '--c-pink-deep', '--c-cherry-dark'],
    ['--c-sky', '--c-powder-deep', '--c-blue-deep'],
    ['--c-mint', '--c-mint-deep', '--c-mint-dark'],
    ['--c-lavender', '--c-lavender-deep', '--c-lavender-dark']
  ];
  var WIN = { perfect: 0.050, good: 0.110, early: 0.150 };
  var TRAVEL = { easy: 1.9, normal: 1.5, hard: 1.15 };   // seconds from the top to the line
  var BASE = { perfect: 300, good: 150 };
  var RANK_ORDER = { C: 1, B: 2, A: 3, S: 4 };
  var COUNT_IN = 4;          // beats of count-in clicks before beat 0
  var REWIND = 3;            // beats replayed after a pause
  var OFFSET_LIMIT = 250;    // ms
  var DANCE_IDS = ['idle', '1', '2', '3', '4'];
  var SRC_BG = 'assets/rhythm/bg-practice-room.webp';
  function danceSrc(id) { return 'assets/rhythm/hamin-dance-' + id + '.webp'; }

  /* ═════════════ 1. Small helpers ═════════════ */
  function t(k, p) { return HG.t ? HG.t(k, p) : k; }
  function el(tag, props, kids) { return HG.ui.el(tag, props, kids); }
  function $(id) { return doc.getElementById(id); }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function perfNow() { return win.performance && win.performance.now ? win.performance.now() : Date.now(); }
  function reduced() { return !!(HG.ui && HG.ui.reducedMotion && HG.ui.reducedMotion()); }
  function sfx(name, o) { try { if (HG.audio) HG.audio.sfx(name, o); } catch (e) { /* sound never breaks the game */ } }
  function announce(s) { if (HG.ui && HG.ui.announce) HG.ui.announce(s); }
  function fmt(n) { return HG.ui && HG.ui.formatNum ? HG.ui.formatNum(n) : String(Math.round(n)); }
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function songs() { return (HG.data && HG.data.songs) || []; }
  function findSong(id) { var l = songs(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function songById(id) { return findSong(id) || songs()[0] || null; }
  function tools() { return (HG.data && HG.data.songTools) || null; }
  function pct1(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function signed(n) { return (n > 0 ? '+' : n < 0 ? '−' : '±') + Math.abs(n); }

  /* Design tokens → canvas colours (read from css/base.css; tiny fallback so a missing
     stylesheet never leaves the canvas blank). */
  var FALLBACK = {
    '--c-white': '#ffffff', '--c-ink': '#4a3a55', '--c-ink-soft': '#7b6a86', '--c-pink': '#ffc9de',
    '--c-pink-deep': '#ff8fb8', '--c-cherry': '#ff4f7b', '--c-cherry-dark': '#d42a59', '--c-sky': '#e8f5ff',
    '--c-powder': '#bfe3ff', '--c-powder-deep': '#7fbef0', '--c-blue-deep': '#4f93d6', '--c-mint': '#cff5e4',
    '--c-mint-deep': '#7fd8b2', '--c-mint-dark': '#3f9e7a', '--c-lavender': '#e5dcff', '--c-lavender-deep': '#b9a6f2',
    '--c-lavender-dark': '#7d67c9', '--c-gold': '#ffd76a', '--c-gold-deep': '#e0a93a', '--c-orange': '#ff9a4d',
    '--c-orange-dark': '#d9531f', '--c-cream': '#fff8e7', '--c-blush': '#fff0f6', '--c-silver': '#e6e9f0',
    '--c-silver-deep': '#aab2c3'
  };
  var COL = {};
  var FONT = '"Trebuchet MS", sans-serif';
  function readTokens() {
    var cs = null;
    try { cs = win.getComputedStyle(doc.documentElement); } catch (e) { /* ignore */ }
    Object.keys(FALLBACK).forEach(function (k) {
      var v = cs ? cs.getPropertyValue(k).trim() : '';
      COL[k] = v || FALLBACK[k];
    });
    var f = cs ? cs.getPropertyValue('--font-title').trim() : '';
    if (f) FONT = f;
  }
  function C(k) { return COL[k] || FALLBACK[k] || '#ffffff'; }

  /* ═════════════ 2. Save helpers (save.practice) ═════════════ */
  function P() {
    var d = HG.save && HG.save.data;
    if (!d) return { ranks: {}, best: {} };
    var p = d.practice && typeof d.practice === 'object' ? d.practice : {};
    return { ranks: p.ranks && typeof p.ranks === 'object' ? p.ranks : {}, best: p.best && typeof p.best === 'object' ? p.best : {},
             offset: p.offset, last: p.last };
  }
  function chartKey(songId, diff) { return songId + ':' + diff; }
  function savedRank(key) { var r = P().ranks[key]; return RANK_ORDER[r] ? r : null; }
  function savedBest(key) { var b = P().best[key]; return b && typeof b === 'object' && isFinite(b.score) ? b : null; }
  function savedOffset() { var v = Number(P().offset); return isFinite(v) ? clamp(Math.round(v), -OFFSET_LIMIT, OFFSET_LIMIT) : 0; }
  function setOffset(v) { if (HG.save) HG.save.set('practice.offset', clamp(Math.round(v), -OFFSET_LIMIT, OFFSET_LIMIT)); }
  function practiceObj(d) {
    if (!d.practice || typeof d.practice !== 'object') d.practice = { ranks: {} };
    if (!d.practice.ranks || typeof d.practice.ranks !== 'object') d.practice.ranks = {};
    if (!d.practice.best || typeof d.practice.best !== 'object') d.practice.best = {};
    return d.practice;
  }
  function rankFor(acc, miss) {
    if (acc >= 95 && miss === 0) return 'S';
    if (acc >= 85) return 'A';
    if (acc >= 70) return 'B';
    if (acc >= 50) return 'C';
    return null;
  }

  /* ═════════════ 3. Audio: song bus, voices, players ═════════════ */
  var A = { ctx: null, bus: null, noise: null, waves: {} };

  function audioCtx() {
    try { return (HG.audio && HG.audio.ctx) || null; } catch (e) { return null; }
  }
  function graph() {
    var ctx = audioCtx();
    if (!ctx) return null;
    if (A.ctx !== ctx) { A.ctx = ctx; A.bus = null; A.noise = null; A.waves = {}; }
    try {
      if (!A.bus) { A.bus = ctx.createGain(); A.bus.gain.value = 0.9; A.bus.connect(HG.audio.musicBus); }
      if (!A.noise) {
        A.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        var ch = A.noise.getChannelData(0);
        for (var i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
      }
    } catch (e) { return null; }
    return ctx;
  }
  function pulseWave(duty) {
    var k = 'p' + duty;
    if (A.waves[k]) return A.waves[k];
    var n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (var i = 1; i < n; i++) re[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
    A.waves[k] = A.ctx.createPeriodicWave(re, im);
    return A.waves[k];
  }
  function setWave(osc, w) {
    if (w === 'pulse12') osc.setPeriodicWave(pulseWave(0.125));
    else if (w === 'pulse25') osc.setPeriodicWave(pulseWave(0.25));
    else osc.type = w || 'square';
  }
  function cleanup(src, nodes) {
    src.onended = function () { for (var i = 0; i < nodes.length; i++) { try { nodes[i].disconnect(); } catch (e) { /* ignore */ } } };
  }
  /* One enveloped note. o: {t, freq, freqEnd, dur, vol, wave, a, decay, sus, rel, vib, send} */
  function tone(out, o) {
    var ctx = A.ctx, t0 = o.t, dur = Math.max(0.015, o.dur), end = t0 + dur;
    var osc = ctx.createOscillator(), g = ctx.createGain();
    setWave(osc, o.wave);
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.freqEnd), end);
    var a = o.a || 0.004, peak = Math.max(0.0002, o.vol);
    var sus = Math.max(0.0001, peak * (o.sus == null ? 0.6 : o.sus));
    var rel = o.rel || 0.04;
    var dEnd = Math.min(end, t0 + a + (o.decay || 0.08));
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(sus, Math.max(dEnd, t0 + a + 0.001));
    if (end > dEnd) g.gain.setValueAtTime(sus, end);
    g.gain.exponentialRampToValueAtTime(0.0001, end + rel);
    osc.connect(g); g.connect(out);
    if (o.send) g.connect(o.send);
    var nodes = [osc, g];
    if (o.vib && dur > 0.3) {
      var lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = 5.6;
      lg.gain.setValueAtTime(0, t0);
      lg.gain.linearRampToValueAtTime(o.freq * 0.011, t0 + 0.25);
      lfo.connect(lg); lg.connect(osc.frequency);
      lfo.start(t0); lfo.stop(end + rel);
      nodes.push(lfo, lg);
    }
    osc.start(t0); osc.stop(end + rel + 0.02);
    cleanup(osc, nodes);
  }
  /* Filtered noise burst. o: {t, dur, vol, type, freq, freqEnd, q} */
  function noise(out, o) {
    var ctx = A.ctx, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = A.noise;
    f.type = o.type || 'highpass';
    f.frequency.setValueAtTime(o.freq || 1000, o.t);
    if (o.freqEnd) f.frequency.exponentialRampToValueAtTime(o.freqEnd, o.t + o.dur);
    if (o.q) f.Q.value = o.q;
    g.gain.setValueAtTime(Math.max(0.0002, o.vol), o.t);
    g.gain.exponentialRampToValueAtTime(0.0001, o.t + o.dur);
    src.connect(f); f.connect(g); g.connect(out);
    src.start(o.t, Math.random() * 0.4, o.dur + 0.05);
    cleanup(src, [src, f, g]);
  }
  function kick(out, t0, v) {
    var ctx = A.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t0);
    o.frequency.exponentialRampToValueAtTime(45, t0 + 0.12);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.55 * v, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.17);
    o.connect(g); g.connect(out);
    o.start(t0); o.stop(t0 + 0.2);
    cleanup(o, [o, g]);
  }
  function countClick(out, t0, accent) {
    tone(out, { t: t0, wave: 'triangle', freq: accent ? 1760 : 1320, freqEnd: accent ? 1500 : 1100, dur: 0.035, vol: 0.2, sus: 0.2, decay: 0.03 });
    noise(out, { t: t0, dur: 0.015, vol: 0.06, type: 'highpass', freq: 3500 });
  }

  var LEAD = {
    square: { vol: 0.062, sus: 0.55, decay: 0.09 },
    pulse25: { vol: 0.078, sus: 0.6, decay: 0.1 },
    pulse12: { vol: 0.072, sus: 0.5, decay: 0.08 },
    triangle: { vol: 0.18, sus: 0.7, decay: 0.1 }
  };

  /* A "segment" is one uninterrupted stretch of playback. Pausing drops its gain node, which
     silences every note already scheduled into it; resuming creates a fresh segment. */
  function Segment(spb) {
    var ctx = A.ctx;
    this.gain = ctx.createGain();
    this.gain.gain.value = 1;
    this.gain.connect(A.bus);
    this.nodes = [this.gain];
    this.spb = spb;
    this.echoNode = null;
  }
  Segment.prototype.echo = function () {
    if (this.echoNode) return this.echoNode;
    var ctx = A.ctx;
    var inp = ctx.createGain(), d = ctx.createDelay(1.5), lp = ctx.createBiquadFilter(), fb = ctx.createGain(), wet = ctx.createGain();
    d.delayTime.value = Math.min(1.4, this.spb * 0.75);
    lp.type = 'lowpass'; lp.frequency.value = 2300;
    fb.gain.value = 0.28; wet.gain.value = 0.24;
    inp.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(wet); wet.connect(this.gain);
    this.nodes.push(inp, d, lp, fb, wet);
    this.echoNode = inp;
    return inp;
  };
  Segment.prototype.close = function (fade) {
    var nodes = this.nodes, g = this.gain.gain, ctx = A.ctx;
    try {
      var now = ctx.currentTime;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(0.0001, now + Math.max(0.005, fade || 0.01));
    } catch (e) { /* ignore */ }
    setTimeout(function () { nodes.forEach(function (n) { try { n.disconnect(); } catch (e) { /* ignore */ } }); }, Math.max(60, (fade || 0.01) * 1000 + 80));
  };

  function lowerBound(arr, fn) {   // first index where fn(item) is true (arr sorted)
    var lo = 0, hi = arr.length;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (fn(arr[mid])) hi = mid; else lo = mid + 1; }
    return lo;
  }

  /* Synth player: schedules the compiled song ~180 ms ahead on a 25 ms timer. */
  function SynthPlayer(song) {
    this.song = song;
    this.spb = 60 / song.bpm;
    this.offset = song.offset || 0;
    this.events = tools().compile(song).events;
    this.lead = (song.synth && song.synth.lead) || {};
    this.seg = null; this.timer = null; this.idx = 0; this.click = 0; this.anchor = 0;
  }
  SynthPlayer.prototype.timeOf = function (beat) { return this.offset + beat * this.spb; };
  SynthPlayer.prototype.start = function (from, anchor) {
    this.stop(0.005);
    this.anchor = anchor;
    if (!A.ctx) return;
    this.seg = new Segment(this.spb);
    var self = this;
    this.idx = lowerBound(this.events, function (e) { return self.timeOf(e.beat) >= from - 0.001; });
    this.click = 0;
    while (this.click < COUNT_IN && this.timeOf(this.click - COUNT_IN) < from - 0.001) this.click++;
    this.tick();
    this.timer = setInterval(function () { self.tick(); }, 25);
  };
  SynthPlayer.prototype.tick = function () {
    var ctx = A.ctx, seg = this.seg;
    if (!ctx || !seg) return;
    var now = ctx.currentTime, horizon = now + 0.18, ta;
    try {
      while (this.click < COUNT_IN) {
        ta = this.anchor + this.timeOf(this.click - COUNT_IN);
        if (ta > horizon) break;
        if (ta >= now - 0.02) countClick(seg.gain, Math.max(ta, now), this.click === 0);
        this.click++;
      }
      while (this.idx < this.events.length) {
        var e = this.events[this.idx];
        ta = this.anchor + this.timeOf(e.beat);
        if (ta > horizon) break;
        if (ta >= now - 0.02) this.play(e, Math.max(ta, now));
        this.idx++;
      }
    } catch (err) { if (win.console) console.warn('[practice] audio step failed', err); }
  };
  SynthPlayer.prototype.play = function (e, t0) {
    var out = this.seg.gain, sd = this.spb, i;
    switch (e.kind) {
      case 'lead': {
        var w = this.lead.wave || 'square', L = LEAD[w] || LEAD.square, dur = Math.max(0.06, e.len * sd * 0.9);
        tone(out, { t: t0, wave: w, freq: mtof(e.midi), dur: dur, vol: L.vol * (this.lead.vol || 1), sus: L.sus, decay: L.decay,
                    vib: true, send: this.lead.echo ? this.seg.echo() : null });
        break;
      }
      case 'bass': tone(out, { t: t0, wave: 'triangle', freq: mtof(e.midi), dur: e.len * sd, vol: 0.2, sus: 0.7, decay: 0.08 }); break;
      case 'arp': tone(out, { t: t0, wave: 'pulse12', freq: mtof(e.midi), dur: e.len * sd * 0.8, vol: 0.024, sus: 0.4, decay: 0.05 }); break;
      case 'box':
        for (i = 0; i < e.midis.length; i++) tone(out, { t: t0 + i * 0.014, wave: 'triangle', freq: mtof(e.midis[i]), dur: 0.45, vol: 0.034, sus: 0.05, decay: 0.32, rel: 0.1 });
        break;
      case 'stab':
        for (i = 0; i < e.midis.length; i++) tone(out, { t: t0, wave: 'pulse25', freq: mtof(e.midis[i]), dur: Math.min(0.14, e.len * sd), vol: 0.022, sus: 0.3, decay: 0.05 });
        break;
      case 'pad':
        for (i = 0; i < e.midis.length; i++) tone(out, { t: t0, wave: 'triangle', freq: mtof(e.midis[i]), dur: e.len * sd * 0.95, vol: 0.028, a: 0.08, sus: 0.8, decay: 0.2, rel: 0.25 });
        break;
      case 'k': kick(out, t0, e.vel); break;
      case 's':
        noise(out, { t: t0, dur: 0.11, vol: 0.15 * e.vel, type: 'highpass', freq: 1300 });
        tone(out, { t: t0, wave: 'triangle', freq: 190, freqEnd: 150, dur: 0.06, vol: 0.09 * e.vel, sus: 0.3 });
        break;
      case 'c':
        for (i = 0; i < 3; i++) noise(out, { t: t0 + i * 0.011, dur: i === 2 ? 0.12 : 0.02, vol: 0.12 * e.vel, type: 'bandpass', freq: 1400, q: 0.9 });
        break;
      case 'h': noise(out, { t: t0, dur: 0.035, vol: 0.05 * e.vel, type: 'highpass', freq: 7000 }); break;
      case 'o': noise(out, { t: t0, dur: 0.16, vol: 0.045 * e.vel, type: 'highpass', freq: 6200 }); break;
      case 'x': noise(out, { t: t0, dur: 1.1, vol: 0.085 * e.vel, type: 'highpass', freq: 3600 }); break;
    }
  };
  SynthPlayer.prototype.stop = function (fade) {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.seg) { this.seg.close(fade); this.seg = null; }
  };

  /* File player (song.audioSrc): the <audio> element is the music; the anchor follows it. */
  function FilePlayer(song) {
    this.song = song;
    this.spb = 60 / song.bpm;
    this.offset = song.offset || 0;
    this.anchor = 0; this.seg = null; this.timer = null; this.startTimer = null; this.click = 0;
    this.audio = null; this.routed = false; this.failed = false;
  }
  FilePlayer.prototype.timeOf = SynthPlayer.prototype.timeOf;
  FilePlayer.prototype.load = function (cb) {
    var self = this, done = false;
    function fin(ok) { if (done) return; done = true; if (!ok) self.failed = true; cb(ok); }
    try {
      var a = this.audio = new win.Audio();
      a.preload = 'auto';
      a.addEventListener('canplaythrough', function () { fin(true); });
      a.addEventListener('error', function () { fin(false); });
      a.src = this.song.audioSrc;
      if (A.ctx && win.location.protocol !== 'file:') {    // file:// media is CORS-silenced in Web Audio
        try { A.ctx.createMediaElementSource(a).connect(A.bus); this.routed = true; } catch (e) { this.routed = false; }
      }
      a.load();
      setTimeout(function () { fin(false); }, 10000);
    } catch (e) { fin(false); }
  };
  FilePlayer.prototype.start = function (from, anchor) {
    this.stop(0.005);
    var self = this, a = this.audio;
    this.anchor = anchor;
    if (A.ctx) this.seg = new Segment(this.spb);
    this.click = 0;
    while (this.click < COUNT_IN && this.timeOf(this.click - COUNT_IN) < from - 0.001) this.click++;
    if (!this.routed) {
      var s = (HG.save && HG.save.data && HG.save.data.settings) || {};
      a.volume = s.muted ? 0 : clamp(Number(s.music) || 0, 0, 1);
    }
    var begin = function () {
      var now = A.ctx ? A.ctx.currentTime : perfNow() / 1000;
      var pos = now - self.anchor;
      try { a.currentTime = Math.max(0, pos); } catch (e) { /* ignore */ }
      var p = a.play();
      if (p && p.catch) p.catch(function () { /* autoplay refused: visuals keep going */ });
    };
    var wait = (anchor + Math.max(0, from)) - (A.ctx ? A.ctx.currentTime : perfNow() / 1000);
    if (wait > 0.005) this.startTimer = setTimeout(begin, wait * 1000); else begin();
    this.timer = setInterval(function () { self.tick(); }, 25);
    this.tick();
  };
  FilePlayer.prototype.tick = function () {
    var ctx = A.ctx, a = this.audio;
    if (ctx && this.seg) {
      var now = ctx.currentTime, ta;
      while (this.click < COUNT_IN) {
        ta = this.anchor + this.timeOf(this.click - COUNT_IN);
        if (ta > now + 0.18) break;
        if (ta >= now - 0.02) countClick(this.seg.gain, Math.max(ta, now), this.click === 0);
        this.click++;
      }
    }
    if (a && !a.paused && a.currentTime > 0.05) {
      // Follow the media clock: re-anchor when the element drifts more than 30 ms.
      var n = ctx ? ctx.currentTime : perfNow() / 1000;
      var drift = (n - this.anchor) - a.currentTime;
      if (Math.abs(drift) > 0.03) this.anchor += drift;
    }
  };
  FilePlayer.prototype.stop = function (fade) {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.startTimer) { clearTimeout(this.startTimer); this.startTimer = null; }
    if (this.audio) { try { this.audio.pause(); } catch (e) { /* ignore */ } }
    if (this.seg) { this.seg.close(fade); this.seg = null; }
  };

  /* Silent player: no Web Audio at all → the performance clock drives the arrows. */
  function SilentPlayer(song) { this.song = song; this.spb = 60 / song.bpm; this.offset = song.offset || 0; this.anchor = 0; }
  SilentPlayer.prototype.timeOf = SynthPlayer.prototype.timeOf;
  SilentPlayer.prototype.start = function (from, anchor) { this.anchor = anchor; };
  SilentPlayer.prototype.tick = function () {};
  SilentPlayer.prototype.stop = function () {};

  /* Hit / miss ticks (quiet, on the sfx bus so the sound-effects slider controls them). */
  function hitTick(kind) {
    var ctx = A.ctx;
    if (!ctx || ctx.state !== 'running') return;
    try {
      var out = HG.audio.sfxBus, t0 = ctx.currentTime + 0.002;
      if (kind === 'miss') { tone(out, { t: t0, wave: 'sine', freq: 240, freqEnd: 130, dur: 0.07, vol: 0.07, sus: 0.4 }); return; }
      tone(out, { t: t0, wave: 'triangle', freq: kind === 'perfect' ? 2349 : 1760, freqEnd: kind === 'perfect' ? 2093 : 1568, dur: 0.03, vol: 0.05, sus: 0.2, decay: 0.02 });
      noise(out, { t: t0, dur: 0.02, vol: 0.035, type: 'highpass', freq: 6000 });
    } catch (e) { /* ignore */ }
  }

  /* ═════════════ 4. Clock (AudioContext time, smoothed for drawing) ═════════════ */
  var clock = {
    mode: 'perf', ctx: null, c: 0, p: 0, ready: false,
    real: function () { return this.mode === 'audio' && this.ctx ? this.ctx.currentTime : perfNow() / 1000; },
    use: function (ctx) { this.ctx = ctx; this.mode = ctx ? 'audio' : 'perf'; this.ready = false; this.frame(); },
    frame: function () {
      var p = perfNow() / 1000, r = this.real();
      if (!this.ready) { this.c = r; this.p = p; this.ready = true; return; }
      var err = r - (this.c + (p - this.p));
      if (Math.abs(err) > 0.04) { this.c = r; this.p = p; }       // jump (stall / resume)
      else this.c += err * 0.12;                                   // gently follow the audio clock
    },
    at: function (ms) { if (!this.ready) this.frame(); return this.c + (ms / 1000 - this.p); },
    now: function () { return this.at(perfNow()); }
  };

  /* ═════════════ 5. Game state ═════════════ */
  var G = {
    state: 'boot',          // menu | starting | playing | paused | results
    sel: { song: null, diff: 'normal' },
    song: null, diff: 'normal', player: null, spb: 0.5,
    notes: [], lanes: [[], [], [], []], laneIdx: [0, 0, 0, 0],
    lat: 0, offset: 0, travel: 1.5, endTime: 0, pausedAt: 0, holdUntil: -1e9, lastPos: -1e9,
    score: 0, combo: 0, maxCombo: 0, perfect: 0, good: 0, miss: 0, judged: 0,
    keyDown: [false, false, false, false], pointerLane: {},
    raf: 0, lastFrame: 0, countLabel: '', runId: 0
  };
  var FX = {
    flash: [-1e9, -1e9, -1e9, -1e9],          // perf ms of the last press per lane
    ring: [{ t: -1e9, kind: '' }, { t: -1e9, kind: '' }, { t: -1e9, kind: '' }, { t: -1e9, kind: '' }],
    judge: { kind: '', t: -1e9, early: false, late: false },
    comboT: -1e9,
    pose: { id: 'idle', t: -1e9, until: -1e9 },
    parts: []
  };
  for (var pi = 0; pi < 56; pi++) FX.parts.push({ life: 0, max: 1, x: 0, y: 0, vx: 0, vy: 0, size: 4, col: '', rot: 0 });

  function comboMult(combo) { return 1 + Math.min(10, Math.floor(combo / 10)) * 0.1; }
  function accuracy() { return G.judged ? (G.perfect + G.good * 0.5) / G.judged * 100 : 100; }
  function finalAccuracy() { var n = G.notes.length; return n ? (G.perfect + G.good * 0.5) / n * 100 : 0; }
  function songPos() { return clock.now() - G.player.anchor - G.lat - G.offset / 1000; }
  function songPosAt(ms) { return clock.at(ms) - G.player.anchor - G.lat - G.offset / 1000; }
  function timeOfBeat(beat) { return (G.song.offset || 0) + beat * G.spb; }

  /* ═════════════ 6. DOM refs ═════════════ */
  var D = {};
  var shell = null;

  /* ═════════════ 7. Assets (only this page's own) ═════════════ */
  var IMG = { bg: null, dance: {} };
  function loadImg(src, onDone) {
    var im = new win.Image();
    im.decoding = 'async';
    im.onload = function () { onDone(im); };
    im.onerror = function () { if (win.console) console.info('[HG] image not found yet, using fallback: ' + src); onDone(null); };
    im.src = src;
  }
  function loadAssets() {
    loadImg(SRC_BG, function (im) { IMG.bg = im; buildStatic(); redraw(); });
    DANCE_IDS.forEach(function (id) {
      loadImg(danceSrc(id), function (im) { IMG.dance[id] = im; redraw(); });
    });
  }

  /* ═════════════ 8. Canvas: size, layout, static layers, sprites ═════════════ */
  var cv = null, g2 = null, dpr = 1, W = 0, H = 0;
  var L = { narrow: false, laneW: 60, blockX: 0, blockW: 240, judgeY: 400, note: 48, dancer: { cx: 0, feet: 0, h: 0, behind: false } };
  var layerBg = null, layerLanes = null, spriteNote = [], spriteRecep = [];

  function mkCanvas(w, h) {
    var c = doc.createElement('canvas');
    c.width = Math.max(1, Math.round(w * dpr)); c.height = Math.max(1, Math.round(h * dpr));
    var x = c.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    return c;
  }

  function computeLayout() {
    L.narrow = W < 620;
    L.judgeY = Math.round(H - clamp(H * 0.13, 48, 78));
    if (!L.narrow) {
      L.laneW = Math.round(clamp(W * 0.088, 58, 84));
      L.blockW = L.laneW * 4;
      L.blockX = Math.round(clamp(W * 0.41 - L.blockW / 2, 14, W - L.blockW - 14));
      var dh = Math.min(H * 0.92, (W - (L.blockX + L.blockW) - 20) / 0.75);
      L.dancer = { h: dh, cx: Math.round((L.blockX + L.blockW + W) / 2 + 6), feet: H - 4, behind: false };
    } else {
      L.blockX = 10;
      L.blockW = W - 20;
      L.laneW = L.blockW / 4;
      var nh = Math.min(H * 0.66, W * 0.95 * 4 / 3);
      L.dancer = { h: nh, cx: Math.round(W / 2), feet: Math.round(L.judgeY - 8), behind: true };
    }
    L.note = Math.round(Math.min(L.laneW * 0.84, 66));
  }

  function resize() {
    if (!cv || !D.field) return;
    var r = D.field.getBoundingClientRect();
    var w = Math.max(200, Math.round(r.width)), h = Math.max(200, Math.round(r.height));
    var nd = Math.min(2, win.devicePixelRatio || 1);
    if (w === W && h === H && nd === dpr && layerBg) return;
    W = w; H = h; dpr = nd;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    g2 = cv.getContext('2d');
    computeLayout();
    buildStatic();
    buildSprites();
    placePads();
    redraw();
  }

  function roundRect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function drawCover(c, img, w, h) {
    var s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    var iw = img.naturalWidth * s, ih = img.naturalHeight * s;
    c.drawImage(img, (w - iw) / 2, (h - ih) * 0.55, iw, ih);
  }

  function drawRoomFallback(c, w, h) {   // painted practice room while the art is missing
    var wall = c.createLinearGradient(0, 0, 0, h * 0.62);
    wall.addColorStop(0, C('--c-lavender')); wall.addColorStop(1, C('--c-blush'));
    c.fillStyle = wall; c.fillRect(0, 0, w, h * 0.62);
    var floor = c.createLinearGradient(0, h * 0.62, 0, h);
    floor.addColorStop(0, C('--c-cream')); floor.addColorStop(1, C('--c-gold'));
    c.fillStyle = floor; c.fillRect(0, h * 0.62, w, h * 0.38);
    c.globalAlpha = 0.35; c.strokeStyle = C('--c-gold-deep'); c.lineWidth = 1;
    for (var x = -w; x < w * 2; x += 48) { c.beginPath(); c.moveTo(w / 2 + (x - w / 2) * 0.35, h * 0.62); c.lineTo(x, h); c.stroke(); }
    c.globalAlpha = 0.8; c.fillStyle = C('--c-sky');
    var mw = w * 0.2;
    for (var m = 0; m < 4; m++) roundRectFill(c, w * 0.1 + m * (mw + 6), h * 0.18, mw, h * 0.4, 4);
    c.globalAlpha = 0.6; c.strokeStyle = C('--c-white'); c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, h * 0.5); c.lineTo(w, h * 0.5); c.stroke();
    c.globalAlpha = 1;
  }
  function roundRectFill(c, x, y, w, h, r) { roundRect(c, x, y, w, h, r); c.fill(); }

  function buildStatic() {
    if (!W) return;
    // Background layer
    layerBg = mkCanvas(W, H);
    var b = layerBg.getContext('2d');
    if (IMG.bg) drawCover(b, IMG.bg, W, H); else drawRoomFallback(b, W, H);
    b.fillStyle = C('--c-white'); b.globalAlpha = 0.1; b.fillRect(0, 0, W, H); b.globalAlpha = 1;

    // Lanes layer (panel, lane tints, separators, judge line)
    layerLanes = mkCanvas(W, H);
    var c = layerLanes.getContext('2d');
    var x = L.blockX, w = L.blockW, jy = L.judgeY;
    c.save();
    roundRect(c, x - 5, -12, w + 10, H + 6, 14);
    var panel = c.createLinearGradient(0, 0, 0, H);
    panel.addColorStop(0, C('--c-white')); panel.addColorStop(1, C('--c-sky'));
    c.globalAlpha = L.narrow ? 0.42 : 0.55;
    c.fillStyle = panel; c.fill();
    c.globalAlpha = 0.95; c.lineWidth = 2; c.strokeStyle = C('--c-white'); c.stroke();
    c.globalAlpha = 0.7; c.setLineDash([2, 4]); c.lineWidth = 1.5; c.strokeStyle = C('--c-pink-deep');
    roundRect(c, x - 1, -8, w + 2, H - 2, 11); c.stroke();
    c.setLineDash([]);
    for (var i = 0; i < 4; i++) {
      var lx = x + i * L.laneW;
      var tint = c.createLinearGradient(0, 0, 0, jy);
      tint.addColorStop(0, C(LANE_TOK[i][0])); tint.addColorStop(1, C(LANE_TOK[i][1]));
      c.globalAlpha = 0.14; c.fillStyle = tint; c.fillRect(lx + 2, 0, L.laneW - 4, jy);
      if (i) {
        c.globalAlpha = 0.55; c.strokeStyle = C('--c-lavender-deep'); c.lineWidth = 1; c.setLineDash([3, 5]);
        c.beginPath(); c.moveTo(lx + 0.5, 0); c.lineTo(lx + 0.5, H); c.stroke(); c.setLineDash([]);
      }
    }
    // judge line: glossy candy bar with tiny hearts
    c.globalAlpha = 1;
    var bar = c.createLinearGradient(0, jy - 4, 0, jy + 4);
    bar.addColorStop(0, C('--c-white')); bar.addColorStop(0.5, C('--c-pink')); bar.addColorStop(1, C('--c-pink-deep'));
    c.fillStyle = bar;
    roundRect(c, x - 3, jy - 4, w + 6, 8, 4); c.fill();
    c.strokeStyle = C('--c-cherry-dark'); c.globalAlpha = 0.45; c.lineWidth = 1; c.stroke();
    c.globalAlpha = 1; c.fillStyle = C('--c-cherry');
    c.font = 'bold 13px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('♥', x - 1, jy); c.fillText('♥', x + w + 1, jy);
    // area under the line
    c.globalAlpha = 0.18; c.fillStyle = C('--c-lavender-deep'); c.fillRect(x - 4, jy + 6, w + 8, H - jy);
    c.restore();
  }

  function arrowPath(c, s) {   // chunky arrow pointing up, centred on 0,0, size s
    c.beginPath();
    c.moveTo(0, -0.44 * s);
    c.lineTo(0.42 * s, -0.02 * s);
    c.lineTo(0.17 * s, -0.02 * s);
    c.lineTo(0.17 * s, 0.4 * s);
    c.lineTo(-0.17 * s, 0.4 * s);
    c.lineTo(-0.17 * s, -0.02 * s);
    c.lineTo(-0.42 * s, -0.02 * s);
    c.closePath();
  }

  function buildSprites() {
    var s = L.note, pad = 8, size = s + pad * 2;
    spriteNote = []; spriteRecep = [];
    for (var i = 0; i < 4; i++) {
      var n = mkCanvas(size, size), c = n.getContext('2d');
      c.translate(size / 2, size / 2); c.rotate(LANE_ROT[i]);
      c.lineJoin = 'round'; c.lineCap = 'round';
      arrowPath(c, s);
      c.lineWidth = 7; c.strokeStyle = C(LANE_TOK[i][2]); c.stroke();
      c.lineWidth = 4.5; c.strokeStyle = C('--c-white'); c.stroke();
      var gr = c.createLinearGradient(0, -0.44 * s, 0, 0.4 * s);
      gr.addColorStop(0, C(LANE_TOK[i][0])); gr.addColorStop(1, C(LANE_TOK[i][1]));
      c.fillStyle = gr; c.fill();
      c.save(); c.clip();
      c.globalAlpha = 0.55; c.fillStyle = C('--c-white');
      c.beginPath(); c.ellipse(-0.08 * s, -0.16 * s, 0.22 * s, 0.1 * s, -0.5, 0, Math.PI * 2); c.fill();
      c.restore();
      spriteNote.push(n);

      var r = mkCanvas(size, size), rc = r.getContext('2d');
      rc.translate(size / 2, size / 2); rc.rotate(LANE_ROT[i]);
      rc.lineJoin = 'round';
      arrowPath(rc, s * 0.96);
      rc.globalAlpha = 0.5; rc.fillStyle = C('--c-white'); rc.fill();
      rc.globalAlpha = 0.9; rc.lineWidth = 3; rc.strokeStyle = C(LANE_TOK[i][1]); rc.stroke();
      rc.globalAlpha = 1; rc.lineWidth = 1; rc.strokeStyle = C('--c-white');
      arrowPath(rc, s * 0.8); rc.stroke();
      spriteRecep.push(r);
    }
  }

  /* ── Fallback dancer: a soft charcoal silhouette in the practice outfit, one shape per pose ──
     Angles in degrees from straight down, positive = away from the body. [upper, lower] */
  var POSES = {
    idle: { tilt: 0, la: [12, 6], ra: [12, 6], ll: [4, 1], rl: [4, 1] },
    1: { tilt: 0, la: [148, 160], ra: [148, 160], ll: [11, 3], rl: [11, 3] },       // arms up in a V
    2: { tilt: -4, la: [30, -25], ra: [92, 94], ll: [6, 1], rl: [72, -8] },         // point + knee lift
    3: { tilt: 7, la: [-16, -100], ra: [-16, -100], ll: [12, 2], rl: [3, 1] },      // lean, arms crossed
    4: { tilt: 0, la: [52, -68], ra: [172, 178], ll: [8, 2], rl: [8, 2] }           // one arm up, hand on hip
  };
  function limb(c, x, y, side, ang, l1, l2) {
    var r1 = ang[0] * Math.PI / 180, r2 = ang[1] * Math.PI / 180;
    var ex = x + side * Math.sin(r1) * l1, ey = y + Math.cos(r1) * l1;
    var hx = ex + side * Math.sin(r2) * l2, hy = ey + Math.cos(r2) * l2;
    c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();
    return [hx, hy];
  }
  function drawSilhouette(c, poseId, cx, feet, h) {
    var p = POSES[poseId] || POSES.idle, u = h / 7.5;
    var hipY = -3.8 * u, shY = -5.9 * u, headY = -6.85 * u;
    c.save();
    c.translate(cx, feet);
    c.rotate(p.tilt * Math.PI / 180);
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (var pass = 0; pass < 2; pass++) {
      var outline = pass === 0, grow = outline ? 0.34 * u : 0;
      c.strokeStyle = outline ? C('--c-white') : C('--c-ink');
      c.fillStyle = outline ? C('--c-white') : C('--c-ink-soft');
      c.globalAlpha = outline ? 0.9 : 0.92;
      c.lineWidth = 0.62 * u + grow;
      limb(c, -0.36 * u, hipY, -1, p.ll, 1.95 * u, 1.85 * u);
      limb(c, 0.36 * u, hipY, 1, p.rl, 1.95 * u, 1.85 * u);
      c.lineWidth = 0.44 * u + grow;
      var hl = limb(c, -0.82 * u, shY + 0.25 * u, -1, p.la, 1.3 * u, 1.2 * u);
      var hr = limb(c, 0.82 * u, shY + 0.25 * u, 1, p.ra, 1.3 * u, 1.2 * u);
      c.beginPath();                                   // torso (tee)
      c.moveTo(-0.95 * u, shY); c.lineTo(0.95 * u, shY);
      c.lineTo(0.62 * u, hipY + 0.35 * u); c.lineTo(-0.62 * u, hipY + 0.35 * u); c.closePath();
      if (outline) { c.lineWidth = grow * 2; c.stroke(); }
      c.fill();
      c.beginPath(); c.arc(0, headY, 0.58 * u + grow, 0, Math.PI * 2); c.fill();   // head
      if (!outline) {
        c.fillStyle = C('--c-ink'); c.globalAlpha = 0.95;                       // fringe
        c.beginPath(); c.arc(0, headY - 0.08 * u, 0.62 * u, Math.PI * 1.02, Math.PI * 1.98); c.fill();
        c.strokeStyle = C('--c-mint-deep'); c.lineWidth = 0.12 * u; c.globalAlpha = 1;   // mint shoulder stripes
        c.beginPath(); c.moveTo(-0.9 * u, shY + 0.1 * u); c.lineTo(-0.35 * u, shY + 0.1 * u);
        c.moveTo(0.35 * u, shY + 0.1 * u); c.lineTo(0.9 * u, shY + 0.1 * u); c.stroke();
        c.fillStyle = C('--c-mint-deep');                                        // wristband
        c.beginPath(); c.arc(hr[0], hr[1], 0.2 * u, 0, Math.PI * 2); c.fill();
        c.fillStyle = C('--c-pink'); c.globalAlpha = 0.9;                         // blush
        c.beginPath(); c.arc(-0.3 * u, headY + 0.18 * u, 0.1 * u, 0, Math.PI * 2); c.arc(0.3 * u, headY + 0.18 * u, 0.1 * u, 0, Math.PI * 2); c.fill();
        void hl;
      }
    }
    c.restore();
  }

  function drawDancer(c, pos, now) {
    var d = L.dancer;
    if (!d.h) return;
    var active = now < FX.pose.until;
    var id = active ? FX.pose.id : 'idle';
    var img = IMG.dance[id] || (id !== 'idle' ? null : null);
    var rm = reduced();
    var bob = 0, pop = 1;
    if (!rm) {
      if (G.state === 'playing' && !active && G.spb) {
        var ph = ((pos - (G.song.offset || 0)) / G.spb) % 1;
        if (ph < 0) ph += 1;
        bob = -Math.abs(Math.sin(ph * Math.PI)) * d.h * 0.012;
      }
      pop = 1 + 0.05 * Math.max(0, 1 - (now - FX.pose.t) / 140);
    }
    // soft floor shadow
    c.save();
    c.globalAlpha = 0.22; c.fillStyle = C('--c-ink');
    c.beginPath(); c.ellipse(d.cx, d.feet - 2, d.h * 0.17, d.h * 0.025, 0, 0, Math.PI * 2); c.fill();
    c.restore();
    c.save();
    c.translate(d.cx, d.feet + bob);
    c.scale(pop, pop);
    if (img) {
      var w = d.h * 0.75;
      c.drawImage(img, -w / 2, -d.h, w, d.h);
    } else if (IMG.dance.idle && id !== 'idle') {
      var w2 = d.h * 0.75;           // this pose is missing: keep the real idle art
      c.drawImage(IMG.dance.idle, -w2 / 2, -d.h, w2, d.h);
    } else {
      drawSilhouette(c, id, 0, 0, d.h * 0.96);
    }
    c.restore();
  }

  /* ═════════════ 9. Frame rendering ═════════════ */
  function redraw() {
    if (!g2 || !layerBg) return;
    if (G.state === 'playing') return;         // the loop draws
    var pos = G.player && G.song ? (G.state === 'paused' ? G.pausedAt : G.lastPos) : -1e9;
    render(pos, perfNow());
  }

  function star(c, x, y, r, rot) {
    c.beginPath();
    for (var i = 0; i < 8; i++) {
      var a = rot + i * Math.PI / 4, rr = i % 2 ? r * 0.38 : r;
      c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath(); c.fill();
  }

  function render(pos, now) {
    var c = g2;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    c.drawImage(layerBg, 0, 0, W, H);
    drawDancer(c, pos, now);
    c.drawImage(layerLanes, 0, 0, W, H);

    var rm = reduced();
    var inGame = !!(G.song && G.player) && (G.state === 'playing' || G.state === 'paused' || G.state === 'starting');
    var jy = L.judgeY, lw = L.laneW, ns = L.note, spr = ns + 16;
    var i, x;

    // lane flashes (press glow)
    for (i = 0; i < 4; i++) {
      var fa = 1 - (now - FX.flash[i]) / 170;
      if (G.keyDown[i]) fa = Math.max(fa, 0.55);
      if (fa > 0) {
        x = L.blockX + i * lw;
        var gr = c.createLinearGradient(0, jy - H * 0.55, 0, jy);
        gr.addColorStop(0, C(LANE_TOK[i][0])); gr.addColorStop(1, C(LANE_TOK[i][1]));
        c.globalAlpha = 0.45 * fa; c.fillStyle = gr;
        c.fillRect(x + 2, jy - H * 0.55, lw - 4, H * 0.55);
      }
    }
    c.globalAlpha = 1;

    // beat pulse on the receptors (not in reduced motion)
    var pulse = 0;
    if (inGame && !rm && G.spb) {
      var ph = ((pos - (G.song.offset || 0)) / G.spb) % 1;
      if (ph < 0) ph += 1;
      pulse = Math.pow(1 - ph, 3) * 0.07;
    }
    for (i = 0; i < 4; i++) {
      x = L.blockX + (i + 0.5) * lw;
      var sc = (G.keyDown[i] ? 0.9 : 1) + pulse;
      var rs = spr * sc;
      c.drawImage(spriteRecep[i], x - rs / 2, jy - rs / 2, rs, rs);
    }

    // hit rings
    for (i = 0; i < 4; i++) {
      var rr = FX.ring[i], k = (now - rr.t) / 240;
      if (k >= 0 && k < 1) {
        x = L.blockX + (i + 0.5) * lw;
        c.globalAlpha = 1 - k;
        c.strokeStyle = rr.kind === 'perfect' ? C('--c-gold') : C(LANE_TOK[i][1]);
        c.lineWidth = rm ? 4 : 5 * (1 - k) + 1;
        c.beginPath(); c.arc(x, jy, ns * (rm ? 0.55 : 0.45 + 0.4 * k), 0, Math.PI * 2); c.stroke();
      }
    }
    c.globalAlpha = 1;

    // notes
    if (inGame) {
      var speed = (jy + ns) / G.travel;
      var lookAhead = G.travel + 0.1;
      for (var ln = 0; ln < 4; ln++) {
        var list = G.lanes[ln];
        x = L.blockX + (ln + 0.5) * lw;
        for (var j = G.laneIdx[ln] > 2 ? G.laneIdx[ln] - 2 : 0; j < list.length; j++) {
          var n = list[j];
          var dt = n.t - pos;
          if (dt > lookAhead) break;
          if (n.judged && n.result !== 'miss') continue;
          var y = jy - dt * speed;
          if (y > H + ns) continue;
          var alpha = 1;
          if (n.result === 'miss') alpha = Math.max(0, 0.45 - (pos - n.t) * 0.8);
          else if (dt < -WIN.good) alpha = 0.5;
          if (alpha <= 0) continue;
          c.globalAlpha = alpha;
          c.drawImage(spriteNote[ln], x - spr / 2, y - spr / 2, spr, spr);
        }
      }
      c.globalAlpha = 1;
    }

    // sparkles
    if (!rm) {
      var dtf = Math.min(0.05, Math.max(0, (now - (G.lastFrame || now)) / 1000));
      for (i = 0; i < FX.parts.length; i++) {
        var p = FX.parts[i];
        if (p.life <= 0) continue;
        p.life -= dtf;
        p.x += p.vx * dtf; p.y += p.vy * dtf; p.vy += 260 * dtf; p.rot += 4 * dtf;
        c.globalAlpha = Math.max(0, p.life / p.max);
        c.fillStyle = p.col;
        star(c, p.x, p.y, p.size, p.rot);
      }
      c.globalAlpha = 1;
    }
    G.lastFrame = now;

    if (inGame) {
      var cx = L.blockX + L.blockW / 2;
      // combo
      if (G.combo >= 3) {
        var cb = rm ? 1 : 1 + 0.18 * Math.max(0, 1 - (now - FX.comboT) / 160);
        var cy = Math.round(jy * 0.4);
        c.save();
        c.translate(cx, cy); c.scale(cb, cb);
        c.textAlign = 'center'; c.textBaseline = 'alphabetic';
        c.font = '900 ' + Math.round(clamp(L.blockW * 0.16, 30, 50)) + 'px ' + FONT;
        c.lineJoin = 'round';
        c.lineWidth = 6; c.strokeStyle = C('--c-white'); c.strokeText(String(G.combo), 0, 0);
        c.fillStyle = C('--c-cherry'); c.fillText(String(G.combo), 0, 0);
        c.font = 'bold 12px ' + FONT;
        c.lineWidth = 4; c.strokeText(t('shell.combo') + '  ×' + comboMult(G.combo).toFixed(1), 0, 17);
        c.fillStyle = C('--c-ink'); c.fillText(t('shell.combo') + '  ×' + comboMult(G.combo).toFixed(1), 0, 17);
        c.restore();
      }
      // judgement text
      var ja = (now - FX.judge.t) / 520;
      if (FX.judge.kind && ja < 1) {
        var js = rm ? 1 : (ja < 0.2 ? 0.7 + ja * 2.4 : 1.18 - Math.min(0.18, (ja - 0.2) * 0.9));
        var jyText = Math.round(jy * 0.62);
        var fill = FX.judge.kind === 'perfect' ? C('--c-gold') : FX.judge.kind === 'good' ? C('--c-mint') : C('--c-silver');
        var edge = FX.judge.kind === 'perfect' ? C('--c-orange-dark') : FX.judge.kind === 'good' ? C('--c-mint-dark') : C('--c-ink-soft');
        c.save();
        c.globalAlpha = ja > 0.7 ? (1 - ja) / 0.3 : 1;
        c.translate(cx, jyText); c.scale(js, js);
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
        c.font = '900 ' + Math.round(clamp(L.blockW * 0.1, 22, 32)) + 'px ' + FONT;
        var word = t('shell.' + FX.judge.kind);
        c.lineWidth = 7; c.strokeStyle = C('--c-white'); c.strokeText(word, 0, 0);
        c.lineWidth = 3; c.strokeStyle = edge; c.strokeText(word, 0, 0);
        c.fillStyle = fill; c.fillText(word, 0, 0);
        if (FX.judge.early || FX.judge.late) {
          c.font = 'bold 11px ' + FONT;
          var fs = t(FX.judge.early ? 'practice.judge.fast' : 'practice.judge.slow');
          c.lineWidth = 3; c.strokeStyle = C('--c-white'); c.strokeText(fs, 0, 22);
          c.fillStyle = FX.judge.early ? C('--c-blue-deep') : C('--c-orange-dark'); c.fillText(fs, 0, 22);
        }
        c.restore();
      }
      // song progress (top edge)
      var total = G.endTime > 0 ? G.endTime : 1;
      var prog = clamp(pos / total, 0, 1);
      c.globalAlpha = 0.7; c.fillStyle = C('--c-white'); c.fillRect(0, 0, W, 5);
      c.globalAlpha = 1;
      var pg = c.createLinearGradient(0, 0, W, 0);
      pg.addColorStop(0, C('--c-pink-deep')); pg.addColorStop(1, C('--c-lavender-deep'));
      c.fillStyle = pg; c.fillRect(0, 0, W * prog, 5);
    }
  }

  function burst(lane, kind) {
    if (reduced() || HG.save && HG.save.data && HG.save.data.settings && HG.save.data.settings.sparkles === false) return;
    var x = L.blockX + (lane + 0.5) * L.laneW, y = L.judgeY;
    var n = kind === 'perfect' ? 7 : 4, made = 0;
    var cols = [C('--c-gold'), C(LANE_TOK[lane][1]), C('--c-white'), C('--c-pink-deep')];
    for (var i = 0; i < FX.parts.length && made < n; i++) {
      var p = FX.parts[i];
      if (p.life > 0) continue;
      var a = -Math.PI / 2 + (made / (n - 1 || 1) - 0.5) * 2.2;
      var sp = 150 + (made % 3) * 55;
      p.x = x; p.y = y; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
      p.max = p.life = 0.45 + (made % 2) * 0.15;
      p.size = 4 + (made % 3) * 1.5; p.rot = made; p.col = cols[made % cols.length];
      made++;
    }
  }

  /* ═════════════ 10. Judging ═════════════ */
  function setPose(id, now) {
    FX.pose.id = id; FX.pose.t = now; FX.pose.until = now + 420;
  }

  function judge(note, kind, delta, now) {
    note.judged = true;
    note.result = kind;
    G.judged++;
    FX.judge.kind = kind; FX.judge.t = now;
    FX.judge.early = kind === 'good' && delta < 0;
    FX.judge.late = kind === 'good' && delta > 0;
    if (kind === 'miss') {
      G.miss++;
      G.combo = 0;
      FX.pose.until = now;         // back to idle
      hitTick('miss');
    } else {
      G[kind]++;
      G.combo++;
      if (G.combo > G.maxCombo) G.maxCombo = G.combo;
      G.score += Math.round(BASE[kind] * comboMult(G.combo));
      FX.ring[note.lane].t = now; FX.ring[note.lane].kind = kind;
      FX.comboT = now;
      burst(note.lane, kind);
      setPose(String(note.lane + 1), now);
      hitTick(kind);
      if (G.combo % 50 === 0) announce(t('practice.announce.combo', { n: G.combo }));
    }
    hud();
  }

  function press(lane, stamp) {
    var now = perfNow();
    FX.flash[lane] = now;
    G.keyDown[lane] = true;
    setPadDown(lane, true);
    if (G.state !== 'playing') return;
    var ms = (stamp && stamp > 0 && stamp <= now && now - stamp < 250) ? stamp : now;
    var pos = songPosAt(ms);
    var list = G.lanes[lane];
    for (var i = G.laneIdx[lane]; i < list.length; i++) {
      var n = list[i];
      if (n.judged) continue;
      var delta = pos - n.t;                 // + late, − early
      if (delta > WIN.good) continue;        // about to be a miss; the update pass takes it
      if (delta < -WIN.early) break;         // nothing close yet: a free tap
      var ad = Math.abs(delta);
      judge(n, ad <= WIN.perfect ? 'perfect' : ad <= WIN.good ? 'good' : 'miss', delta, now);
      return;
    }
  }
  function release(lane) {
    G.keyDown[lane] = false;
    setPadDown(lane, false);
  }

  function update(pos, now) {
    for (var ln = 0; ln < 4; ln++) {
      var list = G.lanes[ln];
      var idx = G.laneIdx[ln];
      while (idx < list.length) {
        var n = list[idx];
        if (!n.judged && pos - n.t > WIN.good) judge(n, 'miss', pos - n.t, now);
        if (n.judged) idx++; else break;
      }
      G.laneIdx[ln] = idx;
    }
    // 3 · 2 · 1 · GO (count-in) and 3 · 2 · 1 (after a pause)
    var label = '';
    var zero = timeOfBeat(0);
    if (pos < G.holdUntil) {
      label = String(clamp(Math.ceil((G.holdUntil - pos) / G.spb - 0.001), 1, REWIND));
    } else if (pos < zero) {
      var b = Math.floor((pos - zero) / G.spb);           // −4 … −1
      label = b <= -COUNT_IN ? '3' : b === -3 ? '2' : b === -2 ? '1' : t('shell.go');
      if (b < -COUNT_IN) label = '';
    }
    setCount(label);
    G.lastPos = pos;
    if (pos > G.endTime) finish();
  }

  /* ═════════════ 11. Game flow ═════════════ */
  function buildChart(song, diff) {
    var chart = (song.charts && song.charts[diff]) || [];
    G.notes = []; G.lanes = [[], [], [], []]; G.laneIdx = [0, 0, 0, 0];
    chart.forEach(function (c, i) {
      var lane = c.lane | 0;
      if (lane < 0 || lane > 3 || !isFinite(c.beat)) return;
      var n = { i: i, beat: c.beat, lane: lane, t: timeOfBeat(c.beat), judged: false, result: '' };
      G.notes.push(n);
      G.lanes[lane].push(n);
    });
    G.lanes.forEach(function (l) { l.sort(function (a, b) { return a.t - b.t; }); });
    var lastT = G.notes.reduce(function (m, n) { return Math.max(m, n.t); }, 0);
    G.endTime = Math.max(timeOfBeat(song.lengthBeats || 0), lastT + 0.6) + 0.9;
  }

  function resetRun() {
    G.score = 0; G.combo = 0; G.maxCombo = 0; G.perfect = 0; G.good = 0; G.miss = 0; G.judged = 0;
    G.holdUntil = -1e9; G.pausedAt = 0; G.countLabel = '';
    G.keyDown = [false, false, false, false];
    FX.judge.kind = ''; FX.comboT = -1e9; FX.pose.until = -1e9;
    FX.flash = [-1e9, -1e9, -1e9, -1e9];
    FX.ring.forEach(function (r) { r.t = -1e9; });
    FX.parts.forEach(function (p) { p.life = 0; });
  }

  function waitForAudio(cb) {
    var ctx = graph();
    if (!ctx) { cb(null); return; }
    if (ctx.state === 'running') { cb(ctx); return; }
    var done = false;
    function fin() { if (done) return; done = true; cb(ctx.state === 'running' ? ctx : null); }
    try { var p = ctx.resume(); if (p && p.then) p.then(fin, fin); } catch (e) { /* ignore */ }
    setTimeout(fin, 900);
  }

  function startGame() {
    if (G.state === 'starting' || G.state === 'playing') return;
    var song = songById(G.sel.song), diff = G.sel.diff;
    if (!song || !tools()) return;
    stopPlayer(0.05);
    G.state = 'starting';
    G.runId++;
    var run = G.runId;
    G.song = song; G.diff = diff; G.spb = 60 / song.bpm; G.travel = TRAVEL[diff] || 1.5;
    rememberSelection();
    resetRun();
    buildChart(song, diff);
    hideOverlays();
    setPlayingClass(true);
    lcdSong();
    hud();
    scrollShellIntoView();
    if (HG.audio) HG.audio.stopBgm();

    waitForAudio(function (ctx) {
      if (run !== G.runId || G.state !== 'starting') return;
      var begin = function (player) {
        if (run !== G.runId || G.state !== 'starting') { if (player) player.stop(0.01); return; }
        G.player = player;
        clock.use(ctx && ctx.state === 'running' ? ctx : null);
        G.lat = ctx ? clamp((ctx.baseLatency || 0) + (ctx.outputLatency || 0), 0, 0.2) : 0;
        G.offset = savedOffset();
        var from = timeOfBeat(-COUNT_IN);
        var anchor = clock.real() + 0.3 - from;
        G.player.start(from, anchor);
        G.state = 'playing';
        G.lastPos = from - 0.3;
        try { D.field.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
        D.pauseBtn.disabled = false;
        announce(t('practice.announce.start', { song: t(song.titleKey), diff: t('practice.diff.' + diff) }));
        loop();
      };
      if (!ctx) {
        HG.ui.toast(t('practice.noAudio'));
        begin(new SilentPlayer(song));
      } else if (song.audioSrc) {
        HG.ui.toast(t('practice.loading'), { ms: 1600 });
        var fp = new FilePlayer(song);
        fp.load(function (ok) {
          if (ok) begin(fp);
          else if (song.synth) begin(new SynthPlayer(song));
          else { HG.ui.toast(t('practice.noAudio')); begin(new SilentPlayer(song)); }
        });
      } else {
        begin(new SynthPlayer(song));
      }
    });
  }

  function loop() {
    if (G.raf) return;
    var step = function () {
      G.raf = 0;
      if (G.state !== 'playing') return;
      clock.frame();
      if (clock.mode === 'audio' && A.ctx && A.ctx.state !== 'running') { pauseGame('system'); return; }
      if (G.player.tick) G.player.tick();
      var now = perfNow();
      var pos = songPos();
      update(pos, now);
      if (G.state !== 'playing') return;
      render(pos, now);
      G.raf = win.requestAnimationFrame(step);
    };
    G.raf = win.requestAnimationFrame(step);
  }
  function stopLoop() { if (G.raf) { win.cancelAnimationFrame(G.raf); G.raf = 0; } }
  function stopPlayer(fade) { if (G.player) { G.player.stop(fade); } }

  function pauseGame(reason) {
    if (G.state !== 'playing') return;
    clock.frame();
    G.pausedAt = songPos();
    G.state = 'paused';
    stopLoop();
    stopPlayer(0.03);
    releaseAll();
    setCount('');
    D.pause.hidden = false;
    D.pauseBtn.disabled = true;
    render(G.pausedAt, perfNow());
    if (reason !== 'hidden') { try { $('pr-resume').focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
    announce(t('practice.announce.paused'));
  }

  function resumeGame() {
    if (G.state !== 'paused' || HG.ui.isModalOpen()) return;
    var ctx = G.player instanceof SilentPlayer ? null : graph();
    var go = function () {
      if (G.state !== 'paused') return;
      D.pause.hidden = true;
      clock.use(ctx && ctx.state === 'running' ? ctx : null);
      var from = Math.max(timeOfBeat(-COUNT_IN), G.pausedAt - REWIND * G.spb);
      G.holdUntil = G.pausedAt;
      var anchor = clock.real() + 0.12 - from;
      G.player.start(from, anchor);
      G.state = 'playing';
      D.pauseBtn.disabled = false;
      try { D.field.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
      announce(t('practice.announce.resumed'));
      loop();
    };
    if (ctx && ctx.state !== 'running') {
      try { var p = ctx.resume(); if (p && p.then) { p.then(go, go); return; } } catch (e) { /* ignore */ }
    }
    go();
  }

  function quitToMenu() {
    G.runId++;
    stopLoop();
    stopPlayer(0.12);
    releaseAll();
    setCount('');
    G.state = 'menu';
    G.player = null;
    setPlayingClass(false);
    hideOverlays();
    showMenu(true);
    if (HG.audio) HG.audio.bgm('practiceMenu');
  }

  function restartGame() {
    G.runId++;
    stopLoop();
    stopPlayer(0.05);
    G.state = 'menu';
    G.player = null;
    startGame();
  }

  function releaseAll() { for (var i = 0; i < 4; i++) release(i); G.pointerLane = {}; }

  /* ── Results + rewards ── */
  function finish() {
    if (G.state !== 'playing') return;
    G.state = 'results';
    stopLoop();
    var player = G.player;
    setTimeout(function () { if (player && G.player !== player) player.stop(0.3); else if (player && G.state !== 'playing') player.stop(0.3); }, 1800);
    setCount('');
    releaseAll();
    setPlayingClass(false);
    D.pauseBtn.disabled = true;

    var song = G.song, diff = G.diff, key = chartKey(song.id, diff);
    var acc = Math.round(finalAccuracy() * 10) / 10;
    var rank = rankFor(acc, G.miss);
    var cleared = !!rank;
    var prevRank = savedRank(key), prevBest = savedBest(key);
    var chartRecord = G.score > 0 && (!prevBest || G.score > prevBest.score);
    var rankUp = cleared && (!prevRank || RANK_ORDER[rank] > RANK_ORDER[prevRank]);
    if (HG.save) {
      HG.save.update(function (d) {
        var pr = practiceObj(d);
        if (rankUp) pr.ranks[key] = rank;
        var b = pr.best[key] && typeof pr.best[key] === 'object' ? pr.best[key] : null;
        if (!b || G.score > (Number(b.score) || 0)) pr.best[key] = { score: G.score, acc: acc, combo: G.maxCombo };
        else if (acc > (Number(b.acc) || 0)) b.acc = acc;
      });
    }
    var res = { earned: 0, newBest: false, unlocked: [] };
    if (HG.unlocks) {
      res = HG.unlocks.finishGame(GAME, {
        score: G.score,
        bestKey: GAME,
        stats: {
          inc: {
            'practice.clears': cleared ? 1 : 0,
            'practice.perfects': G.perfect,
            'practice.hardClears': (cleared && diff === 'hard') ? 1 : 0,
            'practice.rankS': rank === 'S' ? 1 : 0
          },
          max: { 'practice.maxCombo': G.maxCombo }
        },
        flags: rank === 'S' ? ['practice.rank.S'] : []
      }) || res;
    }
    if (cleared) sfx(rank === 'S' ? 'powerup' : 'success'); else sfx('pop');
    if (rank === 'S') setPose('1', perfNow() + 600);
    showResults({ song: song, diff: diff, acc: acc, rank: rank, cleared: cleared, chartRecord: chartRecord, res: res });
    renderLog();
    announce(cleared
      ? t('practice.announce.result', { rank: rank, score: fmt(G.score), acc: pct1(acc) })
      : t('practice.announce.fail', { score: fmt(G.score), acc: pct1(acc) }));
  }

  /* ═════════════ 12. UI: HUD, overlays, menu, results ═════════════ */
  var hudCache = { score: null, acc: null };
  function hud() {
    var s = fmt(G.score);
    if (s !== hudCache.score) { D.score.textContent = s; hudCache.score = s; }
    var a = pct1(accuracy()) + '%';
    if (a !== hudCache.acc) { D.acc.textContent = a; hudCache.acc = a; }
  }
  function lcdSong() {
    if (G.song && G.state !== 'menu') {
      D.lcdTitle.textContent = t(G.song.titleKey);
      D.lcdDiff.textContent = t('practice.diff.' + G.diff);
      D.lcdDiff.setAttribute('data-diff', G.diff);
    } else {
      var s = songById(G.sel.song);
      D.lcdTitle.textContent = s ? t(s.titleKey) : '—';
      D.lcdDiff.textContent = t('practice.diff.' + G.sel.diff);
      D.lcdDiff.setAttribute('data-diff', G.sel.diff);
    }
  }
  function setCount(label) {
    if (label === G.countLabel) return;
    G.countLabel = label;
    D.count.textContent = '';
    if (!label) return;
    var go = label === t('shell.go');
    D.count.appendChild(el('span', { class: 'hg-countdown__num' + (go ? ' hg-countdown__num--go' : '') }, label));
  }
  function setPadDown(lane, on) {
    var b = D.pads[lane];
    if (b) b.classList.toggle('is-down', !!on);
  }
  function placePads() {
    if (!D.padsRow) return;
    D.padsRow.style.marginLeft = L.blockX + 'px';
    D.padsRow.style.width = L.blockW + 'px';
  }
  function setPlayingClass(on) {
    doc.body.classList.toggle('pr-is-playing', !!on);
    shell.el.classList.toggle('is-playing', !!on);
  }
  function hideOverlays() {
    D.menu.hidden = true;
    D.pause.hidden = true;
    D.result.hidden = true;
  }
  function scrollShellIntoView() {
    try {
      var r = shell.el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > (win.innerHeight || doc.documentElement.clientHeight)) {
        shell.el.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
      }
    } catch (e) { /* ignore */ }
  }

  /* ── Menu ── */
  function rememberSelection() {
    if (HG.save) HG.save.update(function (d) { practiceObj(d).last = { song: G.sel.song, diff: G.sel.diff }; });
  }
  function starsText(n) { var s = ''; for (var i = 1; i <= 5; i++) s += i <= n ? '★' : '☆'; return s; }
  function durText(song) {
    var sec = Math.round(((song.lengthBeats || 0) * 60) / song.bpm);
    return Math.floor(sec / 60) + ':' + (sec % 60 < 10 ? '0' : '') + (sec % 60);
  }

  function renderDiffTabs() {
    Array.prototype.forEach.call(D.diffs.querySelectorAll('[data-diff]'), function (b) {
      var on = b.getAttribute('data-diff') === G.sel.diff;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      b.classList.toggle('is-active', on);
    });
  }

  function renderSongs() {
    var list = D.songs;
    var focusedId = doc.activeElement && list.contains(doc.activeElement) ? doc.activeElement.getAttribute('data-song') : null;
    list.textContent = '';
    songs().forEach(function (song) {
      var on = song.id === G.sel.song;
      var lvl = (song.level && song.level[G.sel.diff]) || 1;
      var best = savedBest(chartKey(song.id, G.sel.diff));
      var ranks = el('span', { class: 'pr-song__ranks' });
      var anyRank = false;
      DIFFS.forEach(function (d) {
        var r = savedRank(chartKey(song.id, d));
        if (r) anyRank = true;
        ranks.appendChild(el('span', { class: 'pr-rankbox' + (d === G.sel.diff ? ' is-current' : '') }, [
          el('span', { class: 'pr-rankbox__diff pr-rankbox__diff--' + d, 'aria-hidden': 'true' }, t('practice.diffShort.' + d)),
          el('span', { class: 'pr-rank pr-rank--' + (r || 'none'), 'aria-hidden': 'true' }, r || '—'),
          el('span', { class: 'hg-sr-only' }, t('practice.menu.rankFor', { diff: t('practice.diff.' + d), rank: r || t('practice.menu.rankNone') }))
        ]));
      });
      var card = el('button', {
        type: 'button', class: 'pr-song pr-song--' + (song.color || 'pink') + (on ? ' is-selected' : ''),
        role: 'radio', 'aria-checked': String(on), 'data-song': song.id, tabindex: on ? '0' : '-1'
      }, [
        el('span', { class: 'pr-song__cd', 'aria-hidden': 'true' }, el('span', { class: 'pr-song__icon' }, song.icon || '♪')),
        el('span', { class: 'pr-song__main' }, [
          el('span', { class: 'pr-song__title' }, [
            t(song.titleKey),
            !anyRank ? el('span', { class: 'hg-badge hg-badge--new pr-song__new' }, t('common.new')) : null
          ]),
          el('span', { class: 'pr-song__desc' }, t(song.descKey)),
          el('span', { class: 'pr-song__meta' }, [
            el('span', { class: 'pr-song__bpm' }, t('practice.menu.bpm', { n: song.bpm })),
            el('span', { class: 'pr-song__len' }, durText(song)),
            el('span', { class: 'pr-song__stars', 'aria-hidden': 'true' }, starsText(lvl)),
            el('span', { class: 'hg-sr-only' }, t('practice.menu.level', { n: lvl }))
          ]),
          el('span', { class: 'pr-song__best' }, best ? t('practice.menu.best', { n: fmt(best.score) }) : t('practice.menu.noBest'))
        ]),
        ranks
      ]);
      list.appendChild(card);
    });
    if (focusedId) {
      var f = list.querySelector('[data-song="' + focusedId + '"]');
      if (f) f.focus();
    }
    lcdSong();
  }

  function renderTiming() {
    var v = savedOffset();
    D.timingLabel.textContent = t('practice.menu.timing', { n: signed(v) });
  }

  function showMenu(focus) {
    G.state = 'menu';
    D.menu.hidden = false;
    D.result.hidden = true;
    D.pause.hidden = true;
    D.pauseBtn.disabled = true;
    renderDiffTabs();
    renderSongs();
    renderTiming();
    G.song = null;
    hudCache.score = hudCache.acc = null;
    G.score = 0; G.judged = 0;
    hud();
    lcdSong();
    FX.pose.until = -1e9;
    redraw();
    if (focus) { try { D.start.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
  }

  function selectSong(id, focus) {
    if (!findSong(id)) return;
    G.sel.song = id;
    renderSongs();
    if (focus) { var b = D.songs.querySelector('[data-song="' + id + '"]'); if (b) b.focus(); }
  }
  function selectDiff(diff, focus) {
    if (DIFFS.indexOf(diff) < 0) return;
    G.sel.diff = diff;
    renderDiffTabs();
    renderSongs();
    if (focus) { var b = D.diffs.querySelector('[data-diff="' + diff + '"]'); if (b) b.focus(); }
  }

  /* ── Results window ── */
  function showResults(o) {
    var box = D.result;
    box.textContent = '';
    var rankEl = o.rank
      ? el('div', { class: 'hg-result__rank hg-rank--' + o.rank, role: 'img', 'aria-label': t('practice.result.rankLabel', { rank: o.rank }) }, o.rank)
      : el('div', { class: 'hg-result__rank pr-rank-none', role: 'img', 'aria-label': t('practice.result.noRank') }, '—');
    var head = el('div', { class: 'hg-result__head' }, [
      el('p', { class: 'pr-result__song' }, '♪ ' + t(o.song.titleKey) + ' · ' + t('practice.diff.' + o.diff)),
      el('h2', { class: 'hg-result__title', id: 'pr-res-title' }, o.cleared ? t('practice.result.clear') : t('practice.result.fail')),
      rankEl,
      el('div', { class: 'pr-result__badges' }, [
        o.chartRecord ? el('span', { class: 'hg-result__record' }, t('practice.result.newRecord')) : null,
        o.cleared && G.miss === 0 ? el('span', { class: 'pr-result__fc' }, t('practice.result.fullCombo')) : null
      ]),
      !o.cleared ? el('p', { class: 'pr-result__note' }, t('practice.result.failNote')) : null
    ]);
    function row(labelKey, value) {
      return el('div', { class: 'hg-result__row' }, [el('dt', { class: 'hg-result__label' }, t(labelKey)), el('dd', { class: 'hg-result__value' }, value)]);
    }
    var rows = el('dl', { class: 'hg-result__rows' }, [
      row('practice.result.score', fmt(G.score)),
      row('practice.result.acc', pct1(o.acc) + '%'),
      row('practice.result.maxCombo', fmt(G.maxCombo))
    ]);
    var counts = el('ul', { class: 'pr-result__counts' }, [
      el('li', { class: 'pr-tally pr-tally--perfect' }, [el('span', { class: 'pr-tally__label' }, t('practice.result.perfect')), el('b', { class: 'pr-tally__num' }, fmt(G.perfect))]),
      el('li', { class: 'pr-tally pr-tally--good' }, [el('span', { class: 'pr-tally__label' }, t('practice.result.good')), el('b', { class: 'pr-tally__num' }, fmt(G.good))]),
      el('li', { class: 'pr-tally pr-tally--miss' }, [el('span', { class: 'pr-tally__label' }, t('practice.result.miss')), el('b', { class: 'pr-tally__num' }, fmt(G.miss))])
    ]);
    var unlocks = (o.res.unlocked || []).filter(function (u) { return u && u.kind !== 'achievement'; });
    var unlockBox = unlocks.length ? el('div', { class: 'pr-result__unlocks' }, [
      el('p', { class: 'pr-result__unlocks-title' }, t('practice.result.unlocked')),
      el('div', { class: 'hg-result__unlocks' }, unlocks.slice(0, 8).map(function (u) {
        return el('span', { class: 'hg-result__unlock', title: HG.i18n ? HG.i18n.itemName(u.kind, u.id) : u.id }, HG.ui.itemIcon(u.kind, u.id, { lazy: false }));
      }))
    ]) : null;
    var retry = el('button', { type: 'button', class: 'hg-btn hg-btn--pink hg-btn--big', 'data-sfx': 'click' }, t('practice.result.retry'));
    var menu = el('button', { type: 'button', class: 'hg-btn hg-btn--blue', 'data-sfx': 'click' }, t('practice.result.menu'));
    retry.addEventListener('click', function () { restartGame(); });
    menu.addEventListener('click', function () { quitToMenu(); });
    var card = el('section', { class: 'hg-result pr-result' + (o.cleared ? '' : ' hg-result--fail'), role: 'dialog', 'aria-labelledby': 'pr-res-title' }, [
      head, rows, counts,
      o.res.earned ? el('p', { class: 'hg-result__earned' }, t('practice.result.earned', { n: fmt(o.res.earned) })) : null,
      unlockBox,
      el('div', { class: 'hg-result__actions' }, [retry, menu])
    ]);
    box.appendChild(card);
    box.hidden = false;
    D.menu.hidden = true;
    D.pause.hidden = true;
    try { retry.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    render(G.lastPos, perfNow());
  }

  /* ── Practice log + language ── */
  function renderLog() {
    if (!D.log) return;
    var d = HG.save && HG.save.data;
    var st = (d && d.stats) || {};
    var ranks = P().ranks, s = 0;
    Object.keys(ranks).forEach(function (k) { if (ranks[k] === 'S') s++; });
    var rows = [
      ['practice.log.clears', st['practice.clears'] || 0],
      ['practice.log.ranksS', s],
      ['practice.log.maxCombo', st['practice.maxCombo'] || 0],
      ['practice.log.perfects', st['practice.perfects'] || 0]
    ];
    D.log.textContent = '';
    rows.forEach(function (r) {
      D.log.appendChild(el('div', { class: 'pr-log__row' }, [el('dt', { class: 'pr-log__label' }, t(r[0])), el('dd', { class: 'pr-log__value' }, fmt(r[1]))]));
    });
  }

  function onLang() {
    doc.title = t('practice.docTitle');
    lcdSong();
    renderTiming();
    renderLog();
    if (G.state === 'menu') renderSongs();
    hudCache.score = hudCache.acc = null;
    hud();
    buildStatic();
    redraw();
  }

  /* ═════════════ 13. Timing calibration (tap test + ± buttons) ═════════════ */
  function openCalibration() {
    if (G.state !== 'menu') return;
    var cur = savedOffset();
    var testing = null;          // {clicks:[ctxTimes], taps:[], raf, timer}
    var valueEl = el('output', { class: 'pr-calib__value', 'aria-live': 'polite' }, t('practice.calib.value', { n: signed(cur) }));
    var status = el('p', { class: 'pr-calib__status', 'aria-live': 'polite' }, '');
    var dots = el('div', { class: 'pr-calib__dots', 'aria-hidden': 'true' });
    for (var i = 0; i < 8; i++) dots.appendChild(el('span', { class: 'pr-calib__dot' }));
    function setVal(v) {
      cur = clamp(Math.round(v), -OFFSET_LIMIT, OFFSET_LIMIT);
      setOffset(cur);
      valueEl.textContent = t('practice.calib.value', { n: signed(cur) });
      renderTiming();
    }
    function stepBtn(label, aria, delta) {
      var b = el('button', { type: 'button', class: 'hg-btn hg-btn--small pr-calib__step', 'aria-label': aria, 'data-sfx': 'tick' }, label);
      b.addEventListener('click', function () { setVal(cur + delta); });
      return b;
    }
    var tapBtn = el('button', { type: 'button', class: 'hg-btn hg-btn--pink hg-btn--big pr-calib__tap', disabled: true }, t('practice.calib.tap'));
    var startBtn = el('button', { type: 'button', class: 'hg-btn hg-btn--mint', 'data-sfx': 'click' }, t('practice.calib.testStart'));

    function stopTest() {
      if (!testing) return;
      if (testing.raf) win.cancelAnimationFrame(testing.raf);
      if (testing.timer) clearTimeout(testing.timer);
      if (testing.seg) testing.seg.close(0.02);
      testing = null;
      tapBtn.disabled = true;
      startBtn.disabled = false;
      Array.prototype.forEach.call(dots.children, function (d) { d.classList.remove('is-on', 'is-tap'); });
    }
    function finishTest() {
      if (!testing) return;
      var ds = testing.taps.slice().sort(function (a, b) { return a - b; });
      stopTest();
      if (ds.length < 4) { status.textContent = t('practice.calib.tooFew'); sfx('error'); }
      else {
        var med = ds[Math.floor(ds.length / 2)];
        setVal(med * 1000);
        status.textContent = t('practice.calib.result', { n: signed(Math.round(med * 1000)) });
        sfx('success');
      }
      if (HG.audio) HG.audio.bgm('practiceMenu');
    }
    function tap(stamp) {
      if (!testing) return;
      var ctx = A.ctx;
      var now = perfNow();
      var ms = (stamp && stamp > 0 && stamp <= now && now - stamp < 250) ? stamp : now;
      var at = ctx.currentTime - (now - ms) / 1000;
      var best = null, bi = -1;
      testing.clicks.forEach(function (c, k) {
        var d = at - (c + testing.lat);
        if (best === null || Math.abs(d) < Math.abs(best)) { best = d; bi = k; }
      });
      if (best !== null && Math.abs(best) < 0.3 && bi >= 1 && testing.used.indexOf(bi) < 0) {
        testing.used.push(bi);
        testing.taps.push(best);
        var dot = dots.children[bi];
        if (dot) dot.classList.add('is-tap');
      }
    }
    function startTest() {
      if (testing) return;
      waitForAudio(function (ctx) {
        if (!ctx) { status.textContent = t('practice.calib.noAudio'); sfx('error'); return; }
        if (HG.audio) HG.audio.stopBgm();
        var spacing = 0.6, first = ctx.currentTime + 0.8;
        var seg = new Segment(spacing);
        testing = { clicks: [], taps: [], used: [], seg: seg, raf: 0, timer: 0, lat: clamp((ctx.baseLatency || 0) + (ctx.outputLatency || 0), 0, 0.2) };
        for (var k = 0; k < 8; k++) {
          var tt = first + k * spacing;
          testing.clicks.push(tt);
          countClick(seg.gain, tt, k % 4 === 0);
        }
        tapBtn.disabled = false;
        startBtn.disabled = true;
        status.textContent = t('practice.calib.listening');
        try { tapBtn.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
        var tick = function () {
          if (!testing) return;
          var now = ctx.currentTime - testing.lat;
          testing.clicks.forEach(function (c, k) { var d = dots.children[k]; if (d) d.classList.toggle('is-on', now >= c); });
          testing.raf = win.requestAnimationFrame(tick);
        };
        tick();
        testing.timer = setTimeout(finishTest, (first - ctx.currentTime + 8 * spacing + 0.3) * 1000);
      });
    }
    tapBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); tap(e.timeStamp); });
    tapBtn.addEventListener('click', function (e) { if (e.detail === 0) tap(0); });
    startBtn.addEventListener('click', startTest);
    var body = el('div', { class: 'pr-calib' }, [
      el('p', { class: 'pr-calib__desc' }, t('practice.calib.desc')),
      el('div', { class: 'pr-calib__row' }, [
        stepBtn('−10', t('practice.calib.minus', { n: 10 }), -10),
        stepBtn('−1', t('practice.calib.minus', { n: 1 }), -1),
        valueEl,
        stepBtn('+1', t('practice.calib.plus', { n: 1 }), 1),
        stepBtn('+10', t('practice.calib.plus', { n: 10 }), 10)
      ]),
      el('p', { class: 'pr-calib__hint' }, t('practice.calib.hint')),
      el('fieldset', { class: 'pr-calib__test' }, [
        el('legend', { class: 'pr-calib__legend' }, t('practice.calib.testTitle')),
        el('p', { class: 'pr-calib__desc' }, t('practice.calib.testDesc')),
        dots,
        el('div', { class: 'pr-calib__buttons' }, [startBtn, tapBtn]),
        status
      ])
    ]);
    body.addEventListener('keydown', function (e) {
      if (testing && (e.code === 'Space' || e.key === ' ') && !e.repeat) { e.preventDefault(); tap(e.timeStamp); }
    });
    HG.ui.modal({
      titleKey: 'practice.calib.title', body: body, className: 'pr-calib-modal',
      buttons: [
        { labelKey: 'practice.calib.reset', onClick: function () { setVal(0); status.textContent = ''; return false; } },
        { labelKey: 'practice.calib.done', primary: true }
      ],
      onClose: function () {
        var was = !!testing;
        stopTest();
        if (was && HG.audio) HG.audio.bgm('practiceMenu');
        renderTiming();
      }
    });
  }

  /* ═════════════ 14. Input wiring ═════════════ */
  function laneFromKey(e) {
    if (e.code && KEYMAP.hasOwnProperty(e.code)) return KEYMAP[e.code];
    var k = String(e.key || '').toLowerCase();
    return KEYMAP_LEGACY.hasOwnProperty(k) ? KEYMAP_LEGACY[k] : -1;
  }
  function onKeyDown(e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (HG.ui.isModalOpen && HG.ui.isModalOpen()) return;
    var st = G.state;
    var isPause = e.code === 'KeyP' || e.key === 'Escape' || e.key === 'Esc' || String(e.key).toLowerCase() === 'p';
    if (isPause) {
      if (st === 'playing') { e.preventDefault(); pauseGame('key'); }
      else if (st === 'paused') { e.preventDefault(); resumeGame(); }
      return;
    }
    if (st !== 'playing') return;
    var lane = laneFromKey(e);
    if (lane < 0) {
      if (e.code === 'Space' || e.key === ' ') e.preventDefault();   // never scroll mid-song
      return;
    }
    e.preventDefault();
    if (e.repeat) return;
    press(lane, e.timeStamp);
  }
  function onKeyUp(e) {
    var lane = laneFromKey(e);
    if (lane >= 0) release(lane);
  }

  function wireInput() {
    doc.addEventListener('keydown', onKeyDown);
    doc.addEventListener('keyup', onKeyUp);
    win.addEventListener('blur', releaseAll);

    D.pads.forEach(function (b, lane) {
      b.addEventListener('pointerdown', function (e) {
        if (e.button > 0) return;
        e.preventDefault();
        G.pointerLane[e.pointerId] = lane;
        press(lane, e.timeStamp);
      });
      var up = function (e) { if (G.pointerLane[e.pointerId] === lane) { delete G.pointerLane[e.pointerId]; release(lane); } };
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', up);
      b.addEventListener('pointerleave', up);
      b.addEventListener('click', function (e) { if (e.detail === 0) { press(lane, 0); setTimeout(function () { release(lane); }, 90); } });
      b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    });

    // Tapping inside a lane on the canvas works too.
    cv.addEventListener('pointerdown', function (e) {
      if (G.state !== 'playing' || e.button > 0) return;
      var r = cv.getBoundingClientRect();
      var x = e.clientX - r.left;
      var lane = Math.floor((x - L.blockX) / L.laneW);
      if (lane < 0 || lane > 3) return;
      e.preventDefault();
      G.pointerLane[e.pointerId] = lane;
      press(lane, e.timeStamp);
    });
    var cvUp = function (e) { var l = G.pointerLane[e.pointerId]; if (l != null) { delete G.pointerLane[e.pointerId]; release(l); } };
    cv.addEventListener('pointerup', cvUp);
    cv.addEventListener('pointercancel', cvUp);
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    // Menu: difficulty tabs (roving tabindex) + song radio cards
    D.diffs.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-diff]') : null;
      if (b) { sfx('click'); selectDiff(b.getAttribute('data-diff')); }
    });
    D.diffs.addEventListener('keydown', function (e) {
      var i = DIFFS.indexOf(G.sel.diff), n = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % 3;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i + 2) % 3;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = 2;
      if (n >= 0) { e.preventDefault(); sfx('tick'); selectDiff(DIFFS[n], true); }
    });
    D.songs.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-song]') : null;
      if (!b) return;
      var id = b.getAttribute('data-song');
      if (e.detail === 0 && id === G.sel.song) { startGame(); return; }   // Enter / Space on the chosen song
      sfx('click');
      selectSong(id, true);
    });
    D.songs.addEventListener('dblclick', function (e) {
      var b = e.target.closest ? e.target.closest('[data-song]') : null;
      if (b && b.getAttribute('data-song') === G.sel.song) startGame();
    });
    D.songs.addEventListener('keydown', function (e) {
      var l = songs(), i = -1, n = -1;
      for (var k = 0; k < l.length; k++) if (l[k].id === G.sel.song) i = k;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % l.length;
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + l.length) % l.length;
      if (n >= 0) { e.preventDefault(); sfx('tick'); selectSong(l[n].id, true); }
    });
    D.start.addEventListener('click', function () { startGame(); });
    $('pr-timing').addEventListener('click', openCalibration);
    $('pr-howto').addEventListener('click', function () { shell.openHelp(); });
    D.pauseBtn.addEventListener('click', function () { pauseGame('button'); });
    $('pr-resume').addEventListener('click', resumeGame);
    $('pr-restart').addEventListener('click', restartGame);
    $('pr-quit').addEventListener('click', quitToMenu);

    // Auto-pause: hidden tab, any modal (help / settings), page leaving.
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) pauseGame('hidden'); });
    doc.addEventListener('hg:modal', function (e) { if (e.detail && e.detail.open) pauseGame('modal'); });
    win.addEventListener('pagehide', function () { stopLoop(); stopPlayer(0.01); });
    doc.addEventListener('hg:lang', onLang);
    doc.addEventListener('hg:save', function (e) {
      if (e.detail && e.detail.external && G.state === 'menu') { renderSongs(); renderTiming(); renderLog(); }
    });

    // Canvas size follows the field box.
    if (win.ResizeObserver) { new win.ResizeObserver(function () { resize(); }).observe(D.field); }
    win.addEventListener('resize', resize);
    win.addEventListener('orientationchange', function () { setTimeout(resize, 200); });
  }

  /* ═════════════ 15. Boot ═════════════ */
  function init() {
    shell = HG.ui.mountGameShell($('game'), { game: GAME, titleKey: 'games.practiceRoom.title', helpKey: 'practice.help' });
    if (!shell) return;
    D = {
      stage: shell.stage, field: $('pr-field'), count: $('pr-count'),
      lcdTitle: $('pr-lcd-title'), lcdDiff: $('pr-lcd-diff'), score: $('pr-score'), acc: $('pr-acc'), pauseBtn: $('pr-pause-btn'),
      padsRow: $('pr-pads-row'), pads: Array.prototype.slice.call(doc.querySelectorAll('#pr-pads-row [data-lane]')),
      menu: $('pr-menu'), pause: $('pr-pause'), result: $('pr-result'),
      diffs: $('pr-diffs'), songs: $('pr-songs'), start: $('pr-start'), timingLabel: $('pr-timing-label'),
      log: $('pr-log')
    };
    cv = $('pr-canvas');
    g2 = cv.getContext('2d');
    if (!g2 || !tools() || !songs().length) {
      HG.ui.toast(t('practice.noSongs'));
      return;
    }
    readTokens();
    doc.title = t('practice.docTitle');

    var last = P().last || {};
    G.sel.song = findSong(last.song) ? last.song : songs()[0].id;
    G.sel.diff = DIFFS.indexOf(last.diff) >= 0 ? last.diff : 'easy';

    wireInput();
    resize();
    loadAssets();
    renderLog();
    showMenu(false);
    // ?debug=1 → console-only test hook (docs/CONTRACT.md §10)
    if (HG.debug) HG.debug.practice = { state: G, fx: FX, songPos: function () { return G.player ? songPos() : null; }, press: press, release: release };
    // Fonts / late CSS can change sizes after boot.
    setTimeout(function () { readTokens(); W = 0; resize(); }, 400);
  }

  HG.onReady(init);
})(window.HG = window.HG || {}, window, document);

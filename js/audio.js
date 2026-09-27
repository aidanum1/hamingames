/* HAMIN GAMES — js/audio.js
   Everything is synthesized with Web Audio: no audio files, no network.
   docs/CONTRACT.md §3.4

   HG.audio.sfx(name, {rate})  'click','hover','sparkle','unlock','popup','score','success',
                               'error','jump','coin','powerup','perfect','good','miss',
                               'whoosh','bark','pop','shutter','tick','countdown' (+ 'go')
   HG.audio.bgm(name)          'portal','dressup','lunch','run','practiceMenu','room','collection'
   HG.audio.stopBgm()
   HG.audio.ctx                AudioContext (created lazily; resumed on the first pointer/key)
   HG.audio.musicBus / sfxBus  GainNodes for game-owned sources (volume + mute applied)
   HG.audio.setVolumes()       re-read HG.save.data.settings
   extras: HG.audio.setMuted(bool) / toggleMute() / isMuted() / ensure() / note({...})
           HG.audio.unlocked (bool) / HG.audio.current (bgm name) / HG.audio.songs (names)
           document event 'hg:audio' {muted} whenever mute changes.

   BGM: seven short ORIGINAL chiptune loops (square / pulse / triangle / noise),
   played by a lookahead scheduler. BGM only starts after a user gesture, stops
   while muted, and the whole context is suspended while the page is hidden. */
(function (HG, win, doc) {
  'use strict';

  var A = HG.audio = HG.audio || {};
  var AC = win.AudioContext || win.webkitAudioContext || null;

  var ctx = null, master = null, musicBus = null, sfxBus = null, echoIn = null, noiseBuf = null;
  var waves = {};
  var unlocked = false, unlocking = false, hiddenSuspended = false;
  var want = null;          // requested BGM (kept while muted / before unlock)
  var player = null;        // running scheduler state
  var timer = null;
  var compiled = {};
  var lastSfx = {};
  var warned = {};

  var LOOKAHEAD = 0.12;     // seconds scheduled ahead
  var TICK_MS = 25;

  function st() {
    var d = HG.save && HG.save.data;
    return (d && d.settings) || { music: 0.5, sfx: 0.7, muted: false };
  }
  function clamp01(v) { v = Number(v); return isFinite(v) ? Math.max(0, Math.min(1, v)) : 0; }
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function warnOnce(k, msg) { if (!warned[k]) { warned[k] = 1; if (win.console) console.warn('[HG.audio] ' + msg); } }
  function emit(name, detail) {
    var ev;
    try { ev = new CustomEvent(name, { detail: detail }); }
    catch (e) { ev = doc.createEvent('CustomEvent'); ev.initCustomEvent(name, false, false, detail); }
    doc.dispatchEvent(ev);
  }

  /* ── Graph ─────────────────────────────────────────────────
     voices → musicBus ─┐
     voices → sfxBus ───┼→ master → compressor → destination
     lead  → echo (delay+lowpass feedback) → musicBus            */
  function build() {
    if (ctx || !AC) return ctx;
    try { ctx = new AC({ latencyHint: 'interactive' }); }
    catch (e) { try { ctx = new AC(); } catch (e2) { AC = null; ctx = null; return null; } }

    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4;
    comp.attack.value = 0.003; comp.release.value = 0.2;
    master = ctx.createGain(); master.gain.value = 0.9;
    master.connect(comp); comp.connect(ctx.destination);

    musicBus = ctx.createGain(); musicBus.gain.value = 0;
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0;
    musicBus.connect(master); sfxBus.connect(master);

    // Tiny "music box" echo used by the softer songs.
    echoIn = ctx.createGain();
    var delay = ctx.createDelay(1); delay.delayTime.value = 0.27;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    var fb = ctx.createGain(); fb.gain.value = 0.3;
    var wet = ctx.createGain(); wet.gain.value = 0.25;
    echoIn.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay); lp.connect(wet); wet.connect(musicBus);

    // One second of white noise for drums and effects.
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var ch = noiseBuf.getChannelData(0);
    for (var i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;

    applyVolumes(true);
    return ctx;
  }

  function applyVolumes(instant) {
    if (!ctx) return;
    var s = st();
    var m = s.muted ? 0 : clamp01(s.music) * 0.55;
    var f = s.muted ? 0 : clamp01(s.sfx) * 0.85;
    var t = ctx.currentTime;
    if (instant) { musicBus.gain.value = m; sfxBus.gain.value = f; return; }
    musicBus.gain.cancelScheduledValues(t); musicBus.gain.setTargetAtTime(m, t, 0.03);
    sfxBus.gain.cancelScheduledValues(t); sfxBus.gain.setTargetAtTime(f, t, 0.02);
  }

  function musicAllowed() { var s = st(); return !s.muted && clamp01(s.music) > 0; }

  /* ── Unlock on the first user gesture ─────────────────────── */
  var GESTURES = ['pointerdown', 'mousedown', 'touchend', 'keydown', 'click'];

  function detachGestures() {
    GESTURES.forEach(function (n) { win.removeEventListener(n, onGesture, true); });
  }

  function afterUnlock() {
    if (!ctx || ctx.state !== 'running') { unlocking = false; return; }
    unlocked = true; unlocking = false;
    detachGestures();
    applyVolumes(true);
    startIfWanted();
    emit('hg:audio', { unlocked: true, muted: !!st().muted });
  }

  function onGesture(e) {
    if (e && e.type === 'keydown' && (e.key === 'Escape' || e.key === 'Tab' || e.key === 'Shift')) return;
    if (!build()) { detachGestures(); return; }
    unlocking = true;
    try {   // iOS: a silent one-sample buffer inside the gesture unlocks output
      var b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource();
      s.buffer = b; s.connect(ctx.destination); s.start(0);
    } catch (err) { /* ignore */ }
    if (ctx.state !== 'running') {
      var p = ctx.resume();
      if (p && p.then) p.then(afterUnlock, function () { unlocking = false; });
      else setTimeout(afterUnlock, 0);
    } else {
      afterUnlock();
    }
  }
  GESTURES.forEach(function (n) { win.addEventListener(n, onGesture, true); });

  doc.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (doc.hidden) {
      if (ctx.state === 'running') { hiddenSuspended = true; ctx.suspend(); }
    } else if (hiddenSuspended) {
      hiddenSuspended = false;
      if (unlocked) {
        var p = ctx.resume();
        if (player) player.nextTime = ctx.currentTime + 0.05;
        if (p && p.catch) p.catch(function () { /* ignore */ });
      }
    }
  });

  /* ── Waveforms ─────────────────────────────────────────── */
  function pulseWave(duty) {
    var key = 'p' + duty;
    if (waves[key]) return waves[key];
    var n = 40, re = new Float32Array(n), im = new Float32Array(n);
    for (var i = 1; i < n; i++) re[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
    waves[key] = ctx.createPeriodicWave(re, im);
    return waves[key];
  }
  function setWave(osc, w) {
    if (w === 'pulse12') osc.setPeriodicWave(pulseWave(0.125));
    else if (w === 'pulse25') osc.setPeriodicWave(pulseWave(0.25));
    else osc.type = (w === 'bell') ? 'triangle' : (w || 'square');
  }

  /* ── Voices ────────────────────────────────────────────── */
  function cleanup(src, nodes) {
    src.onended = function () {
      for (var i = 0; i < nodes.length; i++) { try { nodes[i].disconnect(); } catch (e) { /* ignore */ } }
    };
  }

  /* One enveloped oscillator note.
     o: {freq, freqEnd, t, dur, vol, wave, a, decay, sus, rel, vib, echo, out} */
  function tone(o) {
    var t = o.t, dur = Math.max(0.015, o.dur), end = t + dur;
    var osc = ctx.createOscillator();
    setWave(osc, o.wave);
    osc.frequency.setValueAtTime(o.freq, t);
    if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.freqEnd), end);
    var g = ctx.createGain();
    var a = o.a || 0.004;
    var peak = Math.max(0.0002, o.vol);
    var sus = Math.max(0.0001, peak * (o.sus == null ? 0.6 : o.sus));
    var rel = o.rel || 0.035;
    var dEnd = Math.min(end, t + a + (o.decay || 0.08));
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(sus, Math.max(dEnd, t + a + 0.001));
    if (end > dEnd) g.gain.setValueAtTime(sus, end);
    g.gain.exponentialRampToValueAtTime(0.0001, end + rel);
    osc.connect(g); g.connect(o.out || sfxBus);
    if (o.echo && echoIn) g.connect(echoIn);
    var nodes = [osc, g];
    if (o.vib && dur > 0.3) {
      var lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = 5.5;
      lg.gain.setValueAtTime(0, t);
      lg.gain.linearRampToValueAtTime(o.freq * 0.012, t + 0.28);
      lfo.connect(lg); lg.connect(osc.frequency);
      lfo.start(t); lfo.stop(end + rel);
      nodes.push(lfo, lg);
    }
    osc.start(t); osc.stop(end + rel + 0.02);
    cleanup(osc, nodes);
  }

  /* Filtered noise burst. o: {t, dur, vol, type, freq, freqEnd, q, out} */
  function noise(o) {
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    var f = ctx.createBiquadFilter();
    f.type = o.type || 'highpass';
    f.frequency.setValueAtTime(o.freq || 1000, o.t);
    if (o.freqEnd) f.frequency.exponentialRampToValueAtTime(o.freqEnd, o.t + o.dur);
    if (o.q) f.Q.value = o.q;
    var g = ctx.createGain();
    g.gain.setValueAtTime(Math.max(0.0002, o.vol), o.t);
    g.gain.exponentialRampToValueAtTime(0.0001, o.t + o.dur);
    src.connect(f); f.connect(g); g.connect(o.out || sfxBus);
    src.start(o.t, Math.random() * 0.5, o.dur + 0.05);
    cleanup(src, [src, f, g]);
  }

  function seq(t, wave, midis, step, dur, vol, R, extra) {
    for (var i = 0; i < midis.length; i++) {
      var o = { t: t + i * step, wave: wave, freq: mtof(midis[i]) * R, dur: dur, vol: vol, sus: 0.5, decay: dur * 0.6 };
      if (extra) for (var k in extra) o[k] = extra[k];
      tone(o);
    }
  }
  function chord(t, wave, midis, dur, vol, R) {
    for (var i = 0; i < midis.length; i++) tone({ t: t, wave: wave, freq: mtof(midis[i]) * R, dur: dur, vol: vol, sus: 0.35, decay: dur * 0.5, rel: 0.12 });
  }

  /* ── Sound effects ─────────────────────────────────────── */
  var SFX = {
    click: function (t, R) { tone({ t: t, wave: 'square', freq: 1250 * R, freqEnd: 900 * R, dur: 0.04, vol: 0.11, sus: 0.3, decay: 0.03 }); },
    hover: function (t, R) { tone({ t: t, wave: 'sine', freq: 2100 * R, dur: 0.025, vol: 0.035, sus: 0.3 }); },
    sparkle: function (t, R) {
      seq(t, 'triangle', [88, 91, 95, 100], 0.045, 0.12, 0.075, R);
      tone({ t: t + 0.02, wave: 'sine', freq: 3000 * R, freqEnd: 4200 * R, dur: 0.22, vol: 0.02, sus: 0.4 });
    },
    unlock: function (t, R) {
      seq(t, 'pulse25', [72, 76, 79, 84], 0.07, 0.09, 0.09, R);
      tone({ t: t + 0.28, wave: 'triangle', freq: mtof(88) * R, dur: 0.35, vol: 0.12, sus: 0.3, decay: 0.2, rel: 0.2 });
      SFX.sparkle(t + 0.3, R);
    },
    popup: function (t, R) { seq(t, 'triangle', [79, 84], 0.07, 0.1, 0.13, R); },
    score: function (t, R) { seq(t, 'square', [83, 88], 0.05, 0.07, 0.07, R); },
    success: function (t, R) {
      seq(t, 'pulse25', [72, 76, 79], 0.08, 0.1, 0.09, R);
      chord(t + 0.24, 'triangle', [84, 88, 91], 0.5, 0.075, R);
      SFX.sparkle(t + 0.3, R);
    },
    error: function (t, R) { seq(t, 'square', [57, 53], 0.12, 0.14, 0.09, R); },
    jump: function (t, R) { tone({ t: t, wave: 'square', freq: 320 * R, freqEnd: 820 * R, dur: 0.15, vol: 0.085, sus: 0.6, decay: 0.1 }); },
    coin: function (t, R) {
      tone({ t: t, wave: 'square', freq: mtof(83) * R, dur: 0.06, vol: 0.08, sus: 0.9 });
      tone({ t: t + 0.06, wave: 'square', freq: mtof(88) * R, dur: 0.24, vol: 0.08, sus: 0.2, decay: 0.2, rel: 0.08 });
    },
    powerup: function (t, R) { seq(t, 'pulse25', [60, 64, 67, 72, 76, 79, 84, 88], 0.035, 0.06, 0.075, R); },
    perfect: function (t, R) {
      chord(t, 'triangle', [84, 88, 91], 0.2, 0.065, R);
      tone({ t: t + 0.05, wave: 'sine', freq: mtof(96) * R, dur: 0.15, vol: 0.04, sus: 0.3 });
    },
    good: function (t, R) { seq(t, 'triangle', [76, 81], 0.05, 0.09, 0.1, R); },
    miss: function (t, R) {
      noise({ t: t, dur: 0.12, vol: 0.12, type: 'lowpass', freq: 500 });
      tone({ t: t, wave: 'sine', freq: 200 * R, freqEnd: 90 * R, dur: 0.15, vol: 0.12, sus: 0.5 });
    },
    whoosh: function (t, R) { noise({ t: t, dur: 0.28, vol: 0.16, type: 'bandpass', freq: 500 * R, freqEnd: 2600 * R, q: 1.2 }); },
    bark: function (t, R) {
      [[0, 760, 420], [0.15, 840, 470]].forEach(function (b) {
        var osc = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), s = t + b[0];
        osc.type = 'square';
        osc.frequency.setValueAtTime(b[1] * R, s);
        osc.frequency.exponentialRampToValueAtTime(b[2] * R, s + 0.09);
        f.type = 'bandpass'; f.frequency.value = 1150; f.Q.value = 2;
        g.gain.setValueAtTime(0.0001, s);
        g.gain.linearRampToValueAtTime(0.28, s + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, s + 0.11);
        osc.connect(f); f.connect(g); g.connect(sfxBus);
        osc.start(s); osc.stop(s + 0.13);
        cleanup(osc, [osc, f, g]);
      });
    },
    pop: function (t, R) { tone({ t: t, wave: 'sine', freq: 900 * R, freqEnd: 180 * R, dur: 0.08, vol: 0.2, sus: 0.6, decay: 0.05 }); },
    shutter: function (t) {
      noise({ t: t, dur: 0.03, vol: 0.2, type: 'highpass', freq: 2500 });
      noise({ t: t + 0.07, dur: 0.06, vol: 0.15, type: 'highpass', freq: 1500 });
      tone({ t: t, wave: 'square', freq: 2000, dur: 0.01, vol: 0.05 });
    },
    tick: function (t, R) { tone({ t: t, wave: 'triangle', freq: 1900 * R, freqEnd: 1700 * R, dur: 0.025, vol: 0.08, sus: 0.3 }); },
    countdown: function (t, R) { tone({ t: t, wave: 'square', freq: 880 * R, dur: 0.15, vol: 0.09, sus: 0.7 }); },
    go: function (t, R) {
      tone({ t: t, wave: 'square', freq: 1320 * R, dur: 0.35, vol: 0.08, sus: 0.6, decay: 0.1 });
      tone({ t: t, wave: 'triangle', freq: 660 * R, dur: 0.35, vol: 0.12, sus: 0.6 });
    }
  };

  /* ── Songs (original compositions) ─────────────────────────
     lead: "Note/len" tokens, len in 16th-note steps, '-' = rest, '|' = bar line.
     chords: one symbol per bar ("C G" splits the bar in half).
     bass: root8 | oom | drive | walk | waltz        arp: up8 | up16 | stab | pad | box
     drums: pop | swing | polka | run | soft | twinkle | waltz                  */
  var SONGS = {
    // Portal — sunny, bouncy C major "welcome to the site" theme.
    portal: {
      bpm: 118, wave: 'pulse25', bass: 'root8', arp: 'up8', drums: 'pop',
      chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G', 'Am', 'Em', 'F', 'C', 'Dm', 'G', 'C', 'C G'],
      lead: 'E5/2 G5/2 C6/4 B5/2 G5/2 E5/4 | D5/2 G5/2 B5/4 A5/2 G5/2 D5/4 | C5/2 E5/2 A5/4 G5/2 E5/2 C5/2 E5/2 | F5/4 A5/2 G5/2 F5/4 -/4 |' +
            'E5/2 E5/2 G5/2 E5/2 C6/4 G5/4 | B5/2 A5/2 G5/2 A5/2 B5/4 D6/4 | C6/2 A5/2 F5/2 A5/2 G5/2 F5/2 E5/2 D5/2 | D5/4 B4/2 D5/2 G5/8 |' +
            'A5/2 G5/2 E5/4 A5/2 G5/2 E5/4 | G5/2 E5/2 B4/4 E5/2 G5/2 B5/4 | A5/4 C6/4 A5/2 G5/2 F5/4 | G5/6 E5/2 C5/4 -/4 |' +
            'D5/2 F5/2 A5/4 C6/2 A5/2 F5/4 | G5/2 B5/2 D6/4 C6/2 B5/2 A5/2 B5/2 | C6/4 G5/2 E5/2 G5/2 C6/2 E6/4 | C6/6 -/2 G5/2 A5/2 B5/2 D6/2'
    },
    // Dress Up — swingy runway strut in F with offbeat "pah" stabs.
    dressup: {
      bpm: 112, wave: 'pulse12', bass: 'oom', arp: 'stab', drums: 'swing', swing: 0.18,
      chords: ['F', 'Dm', 'Gm', 'C', 'F', 'Dm', 'Bb', 'C', 'Bb', 'C', 'Am', 'Dm', 'Gm', 'C', 'F', 'F'],
      lead: 'C5/2 F5/2 A5/2 -/2 G5/2 A5/2 F5/4 | D5/2 F5/2 A5/2 -/2 G5/2 F5/2 D5/4 | Bb4/2 D5/2 G5/2 -/2 A5/2 Bb5/2 G5/4 | C6/4 Bb5/2 A5/2 G5/4 E5/4 |' +
            'C5/2 F5/2 A5/2 -/2 C6/2 A5/2 F5/4 | A5/2 F5/2 D5/2 F5/2 A5/4 D6/4 | D6/2 C6/2 Bb5/2 A5/2 G5/4 Bb5/4 | A5/2 G5/2 E5/2 G5/2 C6/8 |' +
            'F5/4 D5/2 F5/2 Bb5/4 A5/4 | G5/4 E5/2 G5/2 C6/4 Bb5/4 | A5/2 C6/2 E6/4 D6/2 C6/2 A5/4 | F5/2 A5/2 D6/4 C6/2 A5/2 F5/4 |' +
            'G5/2 Bb5/2 D6/2 Bb5/2 A5/2 G5/2 F5/2 E5/2 | E5/4 G5/4 C6/4 E6/4 | F6/4 C6/2 A5/2 F5/4 -/4 | C5/2 D5/2 E5/2 F5/2 G5/2 A5/2 Bb5/2 C6/2'
    },
    // Lunch Time — busy cafeteria polka in G, lots of quick 16ths.
    lunch: {
      bpm: 128, wave: 'square', bass: 'oom', arp: 'stab', drums: 'polka',
      chords: ['G', 'D', 'G', 'C', 'G', 'D', 'C', 'D', 'Em', 'C', 'G', 'D', 'C', 'D', 'G', 'G'],
      lead: 'G5/1 A5/1 B5/2 G5/2 D5/2 G5/2 B5/2 D6/4 | C6/2 A5/2 F#5/2 A5/2 D6/4 A5/4 | B5/2 G5/2 D5/2 G5/2 B5/1 C6/1 D6/2 B5/4 | C6/2 E6/2 C6/2 G5/2 E5/4 G5/4 |' +
            'D6/2 B5/2 G5/2 B5/2 D6/2 G6/2 D6/4 | C6/2 A5/2 F#5/2 D5/2 E5/2 F#5/2 A5/4 | G5/2 E5/2 C5/2 E5/2 G5/2 C6/2 E6/4 | D6/4 C6/2 A5/2 F#5/4 D5/4 |' +
            'E5/2 G5/2 B5/2 E6/2 D6/2 B5/2 G5/4 | E5/2 G5/2 C6/2 E6/2 D6/2 C6/2 G5/4 | B5/2 D6/2 G6/4 F#6/2 E6/2 D6/4 | A5/2 F#5/2 D5/2 F#5/2 A5/2 D6/2 C6/4 |' +
            'E6/3 D6/1 C6/2 G5/2 E6/3 D6/1 C6/4 | D6/3 C6/1 A5/2 F#5/2 D6/3 C6/1 A5/4 | B5/2 G5/2 B5/2 D6/2 G6/4 D6/4 | G6/2 -/2 D6/2 -/2 G5/2 -/6'
    },
    // Run, Hamin! — driving A minor chase with octave bass.
    run: {
      bpm: 132, wave: 'square', bass: 'drive', arp: 'up16', drums: 'run',
      chords: ['Am', 'F', 'G', 'Am', 'Am', 'F', 'G', 'E', 'F', 'G', 'Em', 'Am', 'Dm', 'E', 'Am', 'Am E'],
      lead: 'A5/2 A5/2 C6/2 A5/2 E6/4 D6/2 C6/2 | C6/2 A5/2 F5/2 A5/2 C6/4 A5/4 | B5/2 G5/2 D5/2 G5/2 B5/2 D6/2 G6/4 | E6/4 C6/2 A5/2 E5/4 -/4 |' +
            'A5/1 B5/1 C6/2 E6/2 A6/2 G6/2 E6/2 C6/4 | F6/2 E6/2 C6/2 A5/2 F5/4 A5/4 | G5/2 B5/2 D6/2 G6/2 F6/2 D6/2 B5/4 | G#5/4 B5/4 E6/4 G#5/4 |' +
            'A5/2 C6/2 F6/4 E6/2 C6/2 A5/4 | B5/2 D6/2 G6/4 F6/2 D6/2 B5/4 | G5/2 B5/2 E6/4 D6/2 B5/2 G5/4 | A5/2 C6/2 E6/2 A6/2 G6/4 E6/4 |' +
            'F6/2 E6/2 D6/2 A5/2 F5/4 D5/4 | E5/2 G#5/2 B5/2 E6/2 G#6/4 E6/4 | A6/4 E6/2 C6/2 A5/4 C6/4 | B5/2 C6/2 B5/2 G#5/2 E5/4 -/4'
    },
    // Practice Room menu — laid-back jazzy 7th chords, soft swing.
    practiceMenu: {
      bpm: 100, wave: 'pulse25', bass: 'walk', arp: 'pad', drums: 'soft', swing: 0.14, echo: true,
      chords: ['Ebmaj7', 'Cm7', 'Abmaj7', 'Bb7', 'Ebmaj7', 'Cm7', 'Abmaj7', 'Bb7', 'Fm7', 'Bb7', 'Gm7', 'Cm7', 'Abmaj7', 'Bb7', 'Ebmaj7', 'Ebmaj7'],
      lead: 'G5/4 Bb5/4 D6/6 -/2 | Eb6/2 D6/2 C6/2 Bb5/2 G5/8 | C6/4 Eb6/4 G5/6 -/2 | F5/2 G5/2 Ab5/2 Bb5/2 D6/8 |' +
            'Bb5/4 G5/2 Bb5/2 D6/4 Eb6/4 | G6/4 F6/2 Eb6/2 C6/8 | Eb6/2 C6/2 Ab5/4 G5/2 Ab5/2 C6/4 | D6/6 C6/2 Bb5/8 |' +
            'Ab5/2 C6/2 Eb6/4 F6/4 Eb6/4 | D6/2 Bb5/2 F5/4 Ab5/4 -/4 | Bb5/2 D6/2 F6/4 D6/2 Bb5/2 G5/4 | C6/4 Eb6/4 G6/8 |' +
            'G6/2 Eb6/2 C6/4 Ab5/2 C6/2 Eb6/4 | D6/4 F6/4 Ab5/4 Bb5/4 | G5/4 Bb5/2 D6/2 Eb6/8 | -/8 Bb5/2 C6/2 D6/4'
    },
    // My Room — cozy 3/4 music-box waltz in D.
    room: {
      bpm: 96, spb: 12, wave: 'bell', bass: 'waltz', arp: 'box', drums: 'waltz', echo: true,
      chords: ['D', 'A', 'Bm', 'G', 'D', 'A', 'D', 'D', 'G', 'A', 'F#m', 'Bm', 'G', 'A', 'D', 'D'],
      lead: 'F#5/4 A5/4 D6/4 | E6/4 C#6/4 A5/4 | D6/6 B5/2 F#5/4 | G5/4 B5/4 D6/4 |' +
            'A5/4 F#5/4 A5/4 | G5/2 F#5/2 E5/4 C#5/4 | D5/4 F#5/4 A5/4 | D6/8 -/4 |' +
            'B5/4 D6/4 G6/4 | E6/4 C#6/4 A5/4 | A5/4 C#6/4 F#6/4 | F#6/6 E6/2 D6/4 |' +
            'D6/4 B5/4 G5/4 | E6/4 C#6/2 B5/2 A5/4 | F#5/4 A5/4 D6/4 | D6/8 -/4'
    },
    // Collection — twinkly E major sparkle with 16th arpeggios.
    collection: {
      bpm: 110, wave: 'pulse25', bass: 'root8', arp: 'up16', drums: 'twinkle', echo: true,
      chords: ['E', 'C#m', 'A', 'B', 'E', 'G#m', 'A', 'B', 'C#m', 'G#m', 'A', 'E', 'F#m', 'B', 'E', 'E B'],
      lead: 'B5/2 E6/2 G#6/4 F#6/2 E6/2 B5/4 | C#6/2 E6/2 G#6/4 E6/4 C#6/4 | A5/2 C#6/2 E6/4 F#6/2 E6/2 C#6/4 | D#6/4 F#6/4 B5/8 |' +
            'G#5/2 B5/2 E6/2 G#6/2 B6/4 G#6/4 | G#6/2 F#6/2 D#6/2 B5/2 D#6/4 G#5/4 | A5/4 E6/4 C#6/2 B5/2 A5/4 | B5/2 C#6/2 D#6/2 F#6/2 B6/8 |' +
            'E6/4 G#6/2 E6/2 C#6/4 -/4 | D#6/4 B5/2 D#6/2 G#6/4 -/4 | C#6/2 E6/2 A6/4 G#6/2 F#6/2 E6/4 | B5/2 G#5/2 E5/4 G#5/2 B5/2 E6/4 |' +
            'F#6/2 E6/2 C#6/2 A5/2 C#6/4 F#6/4 | D#6/4 F#6/4 A6/2 G#6/2 F#6/4 | G#6/6 E6/2 B5/8 | E6/4 -/4 B5/2 C#6/2 D#6/4'
    }
  };

  var DRUMS = {
    pop: { k: 'x.....x.x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', fill: true },
    swing: { k: 'x.........x.....', s: '....x.......x...', h: 'x.o.x.o.x.o.x.o.' },
    polka: { k: 'x.......x.......', s: '....x.......x...', h: '..x...x...x...x.', fill: true },
    run: { k: 'x...x...x...x...', s: '....x.......x...', h: 'xoxoxoxoxoxoxoxo', fill: true },
    soft: { k: 'x.........x.....', s: '....o.......o...', h: 'o.o.o.o.o.o.o.o.' },
    twinkle: { k: 'x.......x.......', s: '....o.......o...', h: 'o.o.o.o.o.o.o.o.' },
    waltz: { k: 'x...........', s: '............', h: '....o...o...' }
  };

  var NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  var QUAL = {
    '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10],
    sus4: [0, 5, 7], dim: [0, 3, 6], add9: [0, 4, 7, 14]
  };

  function noteMidi(name) {
    var m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
    if (!m) return null;
    var pc = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 12 * (Number(m[3]) + 1) + pc;
  }

  function parseLine(str) {
    var out = [];
    String(str || '').replace(/\|/g, ' ').trim().split(/\s+/).forEach(function (tok) {
      if (!tok) return;
      var i = tok.indexOf('/');
      var name = i < 0 ? tok : tok.slice(0, i);
      var d = i < 0 ? 1 : Number(tok.slice(i + 1)) || 1;
      out.push({ m: name === '-' ? null : noteMidi(name), d: d });
    });
    return out;
  }

  function parseChord(sym) {
    var m = /^([A-G])([#b]?)(.*)$/.exec(sym);
    if (!m) return { pc: 0, iv: QUAL[''] };
    var pc = (NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
    return { pc: pc, iv: QUAL[m[3]] || QUAL[''] };
  }

  /* Pre-compute every step's events once per song. */
  function compile(name) {
    if (compiled[name]) return compiled[name];
    var def = SONGS[name];
    var spb = def.spb || 16;
    var bars = def.chords.length;
    var steps = spb * bars;
    var ev = [];
    for (var i = 0; i < steps; i++) ev.push([]);
    function put(step, e) { ev[((step % steps) + steps) % steps].push(e); }

    var pos = 0;
    parseLine(def.lead).forEach(function (n) {
      if (n.m != null) put(pos, { i: 'lead', m: n.m, d: n.d });
      pos += n.d;
    });

    var dr = DRUMS[def.drums] || null;
    for (var b = 0; b < bars; b++) {
      var syms = def.chords[b].split(/\s+/);
      var per = spb / syms.length;
      syms.forEach(function (sym, k) {
        var ch = parseChord(sym);
        var base = b * spb + k * per;
        var bassRoot = 40 + ((ch.pc - 4 + 12) % 12);            // E2..D#3
        var mid = 60 + ((ch.pc - 7 + 12) % 12);                 // G4..F#5 for stabs/pads
        var hi = 76 + ((ch.pc - 4 + 12) % 12);                  // E5..D#6 for arps
        var tones = ch.iv.slice(0, 4);
        var s, j;
        // Bass
        switch (def.bass) {
          case 'root8': for (s = 0; s < per; s += 2) put(base + s, { i: 'bass', m: bassRoot, d: 2 }); break;
          case 'drive': for (s = 0, j = 0; s < per; s += 2, j++) put(base + s, { i: 'bass', m: bassRoot + (j % 2 ? 12 : 0), d: 2 }); break;
          case 'oom': for (s = 0, j = 0; s < per; s += 4, j++) put(base + s, { i: 'bass', m: bassRoot + (j % 2 ? 7 : 0), d: 3 }); break;
          case 'walk':
            for (s = 0, j = 0; s < per; s += 4, j++) {
              var wv = [0, tones[1], 7, 9][j % 4];   // root, 3rd, 5th, 6th
              put(base + s, { i: 'bass', m: bassRoot + wv, d: 4 });
            }
            break;
          case 'waltz': put(base, { i: 'bass', m: bassRoot, d: 6 }); break;
        }
        // Harmony / arpeggio
        switch (def.arp) {
          case 'up8': for (s = 0, j = 0; s < per; s += 2, j++) put(base + s, { i: 'arp', m: hi + tones[j % 3] + (j % 6 >= 3 ? 12 : 0) - 12, d: 2 }); break;
          case 'up16': for (s = 0; s < per; s++) put(base + s, { i: 'arp', m: hi + tones[s % 3] + (Math.floor(s / 3) % 2 ? 12 : 0) - 12, d: 1 }); break;
          case 'stab': for (s = 2; s < per; s += 4) put(base + s, { i: 'stab', ms: tones.slice(0, 3).map(function (x) { return mid + x; }), d: 1 }); break;
          case 'pad': put(base, { i: 'pad', ms: tones.map(function (x) { return mid + x; }), d: per }); break;
          case 'box': for (s = 4; s < per; s += 4) put(base + s, { i: 'box', ms: tones.slice(0, 3).map(function (x) { return hi + x; }), d: 2 }); break;
        }
      });
      // Drums
      if (dr) {
        for (var d = 0; d < spb; d++) {
          ['k', 's', 'h'].forEach(function (kind) {
            var c = (dr[kind] || '').charAt(d);
            if (c === 'x' || c === 'o') put(b * spb + d, { i: kind, v: c === 'x' ? 1 : 0.55 });
          });
        }
        if (dr.fill && b === bars - 1) {
          for (var f = spb - 4; f < spb; f++) put(b * spb + f, { i: 's', v: 0.45 + (f - spb + 4) * 0.15 });
        }
      }
    }

    compiled[name] = {
      name: name, steps: steps, spb: spb, ev: ev, swing: def.swing || 0,
      stepDur: 60 / def.bpm / 4, wave: def.wave, echo: !!def.echo
    };
    return compiled[name];
  }

  var LEAD = {
    square: { vol: 0.07, sus: 0.55, decay: 0.09 },
    pulse25: { vol: 0.085, sus: 0.6, decay: 0.1 },
    pulse12: { vol: 0.085, sus: 0.5, decay: 0.08 },
    triangle: { vol: 0.2, sus: 0.7, decay: 0.1 },
    bell: { vol: 0.16, sus: 0.05, decay: 0.6 }
  };

  function playStep(p, step, t) {
    var song = p.song, sd = song.stepDur, out = p.gain;
    var list = song.ev[step];
    if (!list.length) return;
    if (song.swing && step % 4 === 2) t += song.swing * sd;
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      switch (e.i) {
        case 'lead':
          var L = LEAD[song.wave] || LEAD.square;
          var ld = song.wave === 'bell' ? e.d * sd * 1.1 : e.d * sd * 0.88;
          tone({ out: out, t: t, wave: song.wave, freq: mtof(e.m), dur: ld, vol: L.vol, sus: L.sus, decay: L.decay,
                 vib: song.wave !== 'bell', echo: song.echo });
          if (song.wave === 'bell') tone({ out: out, t: t, wave: 'sine', freq: mtof(e.m + 12), dur: ld * 0.5, vol: 0.04, sus: 0.05, decay: 0.3 });
          break;
        case 'bass':
          tone({ out: out, t: t, wave: 'triangle', freq: mtof(e.m), dur: e.d * sd * 0.8, vol: 0.2, sus: 0.7, decay: 0.08 });
          break;
        case 'arp':
          tone({ out: out, t: t, wave: 'pulse12', freq: mtof(e.m), dur: e.d * sd * 0.7, vol: 0.028, sus: 0.4, decay: 0.05 });
          break;
        case 'stab':
          for (var a = 0; a < e.ms.length; a++) tone({ out: out, t: t, wave: 'pulse25', freq: mtof(e.ms[a]), dur: sd * 0.8, vol: 0.022, sus: 0.3, decay: 0.05 });
          break;
        case 'pad':
          for (var q = 0; q < e.ms.length; q++) tone({ out: out, t: t, wave: 'triangle', freq: mtof(e.ms[q]), dur: e.d * sd * 0.95, vol: 0.03, a: 0.08, sus: 0.8, decay: 0.2, rel: 0.2 });
          break;
        case 'box':
          for (var r = 0; r < e.ms.length; r++) tone({ out: out, t: t + r * 0.012, wave: 'triangle', freq: mtof(e.ms[r]), dur: e.d * sd, vol: 0.03, sus: 0.05, decay: 0.3 });
          break;
        case 'k':
          var o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(140, t);
          o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(0.5 * e.v, t + 0.004);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
          o.connect(g); g.connect(out);
          o.start(t); o.stop(t + 0.18);
          cleanup(o, [o, g]);
          break;
        case 's':
          noise({ out: out, t: t, dur: 0.11, vol: 0.16 * e.v, type: 'highpass', freq: 1300 });
          tone({ out: out, t: t, wave: 'triangle', freq: 190, freqEnd: 150, dur: 0.06, vol: 0.09 * e.v, sus: 0.3 });
          break;
        case 'h':
          noise({ out: out, t: t, dur: 0.035, vol: 0.055 * e.v, type: 'highpass', freq: 7000 });
          break;
      }
    }
  }

  /* ── Scheduler ─────────────────────────────────────────── */
  function loop() {
    timer = null;
    if (!player || !ctx) return;
    var p = player, now = ctx.currentTime;
    if (p.nextTime < now - 0.1) p.nextTime = now + 0.03;     // recover from a stall without a burst
    while (p.nextTime < now + LOOKAHEAD) {
      try { playStep(p, p.step, p.nextTime); } catch (e) { warnOnce('step', 'bgm step failed: ' + e); }
      p.nextTime += p.song.stepDur;
      p.step = (p.step + 1) % p.song.steps;
    }
    timer = setTimeout(loop, TICK_MS);
  }

  function startIfWanted() {
    if (!want || player || !ctx || !unlocked || !musicAllowed()) return;
    var song = compile(want);
    var g = ctx.createGain();
    var t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(1, t + 0.35);
    g.connect(musicBus);
    player = { name: want, song: song, step: 0, nextTime: t + 0.06, gain: g };
    loop();
  }

  function stopPlayer() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!player) return;
    var g = player.gain;
    player = null;
    try {
      var t = ctx.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0.0001, t + 0.25);
      setTimeout(function () { try { g.disconnect(); } catch (e) { /* ignore */ } }, 600);
    } catch (e) { /* ignore */ }
  }

  /* ── Public API ────────────────────────────────────────── */
  A.sfx = function (name, opts) {
    var s = st();
    if (s.muted || clamp01(s.sfx) === 0) return;
    if (!ctx || !(unlocked || unlocking) || ctx.state === 'closed') return;
    var fn = SFX[name];
    if (!fn) { warnOnce('sfx:' + name, 'unknown sfx "' + name + '"'); return; }
    var now = ctx.currentTime;
    if (lastSfx[name] != null && now - lastSfx[name] < 0.015) return;   // de-dupe same-frame spam
    lastSfx[name] = now;
    var R = opts && opts.rate > 0 ? Number(opts.rate) : 1;
    try { fn(now + 0.005, R); } catch (e) { warnOnce('sfxerr:' + name, 'sfx "' + name + '" failed: ' + e); }
  };

  A.bgm = function (name) {
    if (!SONGS[name]) { warnOnce('bgm:' + name, 'unknown bgm "' + name + '"'); return; }
    if (want === name && player && player.name === name) return;
    want = name;
    stopPlayer();
    startIfWanted();
  };

  A.stopBgm = function () { want = null; stopPlayer(); };

  A.setVolumes = function () {
    applyVolumes(false);
    if (!musicAllowed()) stopPlayer();
    else startIfWanted();
  };

  A.isMuted = function () { return !!st().muted; };
  A.setMuted = function (m) {
    m = !!m;
    if (HG.save) HG.save.set('settings.muted', m);
    A.setVolumes();
    emit('hg:audio', { muted: m });
    return m;
  };
  A.toggleMute = function () { return A.setMuted(!A.isMuted()); };

  A.ensure = function () { return build(); };

  /* Play one note for game-owned music/sfx. o: {midi|freq, dur, wave, vol, when, bus:'music'|'sfx'} */
  A.note = function (o) {
    if (!ctx || !(unlocked || unlocking) || !o) return;
    var freq = o.freq || (o.midi != null ? mtof(o.midi) : 440);
    tone({ out: o.bus === 'music' ? musicBus : sfxBus, t: o.when || ctx.currentTime + 0.005, wave: o.wave || 'square',
           freq: freq, dur: o.dur || 0.15, vol: o.vol == null ? 0.08 : o.vol, sus: o.sus, decay: o.decay });
  };

  A.songs = Object.keys(SONGS);
  A._songs = SONGS;         // exposed for tests
  A._compile = compile;
  A._parseLine = parseLine;

  Object.defineProperty(A, 'ctx', { get: function () { return build(); }, enumerable: true });
  Object.defineProperty(A, 'musicBus', { get: function () { build(); return musicBus; }, enumerable: true });
  Object.defineProperty(A, 'sfxBus', { get: function () { build(); return sfxBus; }, enumerable: true });
  Object.defineProperty(A, 'unlocked', { get: function () { return unlocked; }, enumerable: true });
  Object.defineProperty(A, 'current', { get: function () { return want; }, enumerable: true });

  // Settings changed anywhere (settings modal, other tab, import) → re-apply.
  doc.addEventListener('hg:save', function (e) {
    var p = e.detail && e.detail.path;
    if (!ctx) return;
    if (!p || p === '*' || String(p).indexOf('settings') === 0) A.setVolumes();
  });
})(window.HG = window.HG || {}, window, document);

// Музыка и звуки: синтезируются на лету, файлов не нужно
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const Music = {
  ctx: null, on: false, step: 0, timer: null, t: null, next: 0,
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = S.mute ? 0 : .5; this.master.connect(this.ctx.destination);
      const n = this.ctx.sampleRate * .1, b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      this.noise = b;
    } catch (e) { this.ctx = null; }
  },
  note(f, t, d, type, vol) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + d + .02);
  },
  start(theme) {
    this.init(); if (!this.ctx) return;
    this.ctx.resume(); this.t = theme; this.step = 0;
    this.motif = Array.from({ length: 8 }, () => pick(theme.scale) + (Math.random() < .3 ? 12 : 0));
    this.next = this.ctx.currentTime + .1; this.on = true;
    clearInterval(this.timer); this.timer = setInterval(() => this.tick(), 30);
  },
  tick() {
    if (!this.on) return;
    const sl = 60 / this.t.tempo / 2;
    while (this.next < this.ctx.currentTime + .2) { this.play(this.step, this.next, sl); this.next += sl; this.step++; }
  },
  play(s, tm, sl) {
    const T = this.t, bar = Math.floor(s / 16) % 4, st = s % 16, root = T.root + [0, -4, -2, -5][bar], c = this.ctx;
    if (st % 4 === 0) {
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(150, tm); o.frequency.exponentialRampToValueAtTime(45, tm + .12);
      g.gain.setValueAtTime(.7, tm); g.gain.exponentialRampToValueAtTime(.001, tm + .15);
      o.connect(g); g.connect(this.master); o.start(tm); o.stop(tm + .2);
    }
    if (st % 2 === 1) {
      const n = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
      n.buffer = this.noise; f.type = 'highpass'; f.frequency.value = 7000;
      g.gain.setValueAtTime(.12, tm); g.gain.exponentialRampToValueAtTime(.001, tm + .05);
      n.connect(f); f.connect(g); g.connect(this.master); n.start(tm); n.stop(tm + .06);
    }
    if ([0, 3, 6, 8, 10, 13].includes(st)) this.note(mtof(root - 12), tm, sl * 1.8, 'triangle', .35);
    if (st % 2 === 0) this.note(mtof(root + 12 + this.motif[(st / 2 + (bar === 3 ? 3 : 0)) % 8]), tm, sl * 1.6, 'square', .06);
    if (st % 4 === 2) this.note(mtof(root + 7), tm, sl, 'sine', .08);
  },
  pause() { if (this.ctx) this.ctx.suspend(); },
  resume() { if (this.ctx && this.on) this.ctx.resume(); },
  stop() { this.on = false; clearInterval(this.timer); },
  toggle() { S.mute = !S.mute; save(); this.init(); if (this.master) this.master.gain.value = S.mute ? 0 : .5; },
  sfx(k) {
    this.init(); if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (k === 'coin') { this.note(988, t, .08, 'square', .12); this.note(1319, t + .07, .14, 'square', .12); }
    if (k === 'boost') [523, 659, 784, 1047].forEach((f, i) => this.note(f, t + i * .06, .12, 'triangle', .2));
    if (k === 'hit') { this.note(120, t, .3, 'sawtooth', .35); this.note(80, t + .05, .3, 'square', .25); }
    if (k === 'over') [440, 370, 311, 233].forEach((f, i) => this.note(f, t + i * .18, .3, 'triangle', .3));
  }
};

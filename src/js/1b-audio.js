/* ================= Listening: pitch-class energy (chroma) + chord matching ================= */
function chromaOf(db, sr, fftSize) {
  const out = new Float32Array(12);
  const binHz = sr / fftSize;
  const lo = Math.floor(70 / binHz), hi = Math.min(db.length - 2, Math.ceil(1500 / binHz));
  let peak = -Infinity;
  for (let i = lo; i <= hi; i++) if (db[i] > peak) peak = db[i];
  if (peak < -78) return null; // silence
  const floor = peak - 38;
  for (let i = lo + 1; i < hi; i++) {
    const v = db[i];
    if (v < floor || v < db[i - 1] || v < db[i + 1]) continue; // local spectral peaks only
    const f = i * binHz;
    const midi = 69 + 12 * Math.log2(f / 440);
    const pc = mod(Math.round(midi), 12);
    const mag = Math.pow(10, (v - peak) / 20);
    out[pc] += mag / (1 + f / 900);
  }
  let mx = 0; for (let i = 0; i < 12; i++) mx = Math.max(mx, out[i]);
  if (!mx) return null;
  for (let i = 0; i < 12; i++) out[i] /= mx;
  return out;
}
const MATCH_TYPES = ['maj', 'min', '7', 'maj7', 'm7', 'sus2', 'sus4', 'dim', '5'];
function matchChord(chroma) {
  if (!chroma) return null;
  let best = null;
  const norm = Math.sqrt(chroma.reduce((a, b) => a + b * b, 0)) || 1;
  for (let r = 0; r < 12; r++) for (const id of MATCH_TYPES) {
    const t = chordType(id); const pcs = new Set(t.iv.map((i) => mod(r + i, 12)));
    let dot = 0, tn = 0;
    for (let pc = 0; pc < 12; pc++) { const w = pcs.has(pc) ? (pc === r ? 1.25 : 1) : 0; dot += w * chroma[pc]; tn += w * w; }
    let score = dot / (norm * Math.sqrt(tn));
    if (id === '5') score -= 0.04; if (t.iv.length > 3) score -= 0.02; // prefer simple names on ties
    if (!best || score > best.score) best = { root: r, id, score };
  }
  return best;
}
// how well a heard chroma matches an expected set of pitch classes
function checkChord(chroma, pcs) {
  if (!chroma) return null;
  const missing = pcs.filter((pc) => chroma[pc] < 0.22);
  const extra = [];
  for (let pc = 0; pc < 12; pc++) if (!pcs.includes(pc) && chroma[pc] > 0.55) extra.push(pc);
  return { ok: !missing.length && extra.length <= 1, missing, extra };
}

/* ================= More sounds: clicks, drums, bass ================= */
Object.assign(Sound, {
  noise: null,
  noiseBuf() {
    if (this.noise) return this.noise;
    const ctx = this.ctx, len = ctx.sampleRate; const b = ctx.createBuffer(1, len, ctx.sampleRate); const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return (this.noise = b);
  },
  env(g, t, peak, decay) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + decay); },
  click(t, accent) {
    if (!S.settings.sound) return; const ctx = this.ensure(); if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.value = accent ? 1760 : 1175;
    this.env(g, t, accent ? 0.22 : 0.13, 0.05); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.07);
  },
  kick(t, v = 1) {
    if (!S.settings.sound) return; const ctx = this.ctx; const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    this.env(g, t, 0.9 * v, 0.32); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.35);
  },
  snare(t, v = 1) {
    if (!S.settings.sound) return; const ctx = this.ctx; const n = ctx.createBufferSource(); n.buffer = this.noiseBuf();
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1400;
    const g = ctx.createGain(); this.env(g, t, 0.42 * v, 0.17); n.connect(hp); hp.connect(g); g.connect(this.master); n.start(t); n.stop(t + 0.2);
    const o = ctx.createOscillator(), g2 = ctx.createGain(); o.frequency.value = 190; this.env(g2, t, 0.25 * v, 0.08); o.connect(g2); g2.connect(this.master); o.start(t); o.stop(t + 0.1);
  },
  hat(t, v = 1, open) {
    if (!S.settings.sound) return; const ctx = this.ctx; const n = ctx.createBufferSource(); n.buffer = this.noiseBuf();
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7500;
    const g = ctx.createGain(); this.env(g, t, 0.13 * v, open ? 0.22 : 0.045); n.connect(hp); hp.connect(g); g.connect(this.master); n.start(t); n.stop(t + 0.25);
  },
  bass(midi, t, dur) {
    if (!S.settings.sound) return; const ctx = this.ctx; const o = ctx.createOscillator(), o2 = ctx.createOscillator();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(240, t + 0.25);
    const g = ctx.createGain(); o.type = 'triangle'; o2.type = 'sawtooth'; o.frequency.value = o2.frequency.value = freqOf(midi);
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.42, t + 0.01); g.gain.setValueAtTime(0.42, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(this.master);
    o.start(t); o2.start(t); o.stop(t + dur + 0.02); o2.stop(t + dur + 0.02);
  },
  // strum a voicing at an absolute audio time without touching the neck
  strumAt(frets, t, up, gain = 0.3, dur = 0, spread = 0.018) {
    const order = frets.map((f, s) => ({ f, s })).filter((x) => x.f >= 0); if (up) order.reverse();
    const base = this.ctx.currentTime;
    order.forEach((x, i) => this.play(strings()[x.s] + x.f, Math.max(0, t - base + i * spread), gain, dur));
  },
});

/* ================= Metronome (global) with speed trainer ================= */
const Metro = {
  on: false, bpm: 90, beats: 4, beat: 0, next: 0, timer: null, listeners: new Set(),
  trainer: { on: false, step: 4, every: 2, target: 140, bars: 0 },
  start() {
    const ctx = Sound.ensure(); if (!ctx) return;
    this.on = true; this.beat = 0; this.next = ctx.currentTime + 0.08; this.trainer.bars = 0;
    clearInterval(this.timer); this.timer = setInterval(() => this.tick(), 25); renderMetro();
  },
  stop() { this.on = false; clearInterval(this.timer); renderMetro(); },
  toggle() { this.on ? this.stop() : this.start(); },
  setBpm(v) { this.bpm = clamp(Math.round(v), 30, 260); renderMetro(); },
  tick() {
    const ctx = Sound.ctx;
    while (this.next < ctx.currentTime + 0.12) {
      const b = this.beat, t = this.next;
      Sound.click(t, b === 0);
      const delay = Math.max(0, (t - ctx.currentTime) * 1000);
      setTimeout(() => { pulseMetro(b === 0); this.listeners.forEach((fn) => fn(b)); }, delay);
      this.next += 60 / this.bpm;
      this.beat = (this.beat + 1) % this.beats;
      if (this.beat === 0 && this.trainer.on) {
        this.trainer.bars++;
        if (this.trainer.bars % this.trainer.every === 0 && this.bpm < this.trainer.target) {
          this.bpm = Math.min(this.trainer.target, this.bpm + this.trainer.step);
          setTimeout(() => { renderMetro(); toast(`Tempo up: ${this.bpm} bpm`, 1100); }, delay);
        }
      }
    }
  },
};
function renderMetro() {
  const box = $('#metro'); if (!box) return;
  box.querySelector('.m-bpm').textContent = Metro.bpm;
  box.querySelector('.m-play').innerHTML = Metro.on ? ICONS.stop : ICONS.play;
  box.querySelector('.m-play').setAttribute('aria-label', Metro.on ? 'Stop metronome' : 'Start metronome');
  box.classList.toggle('running', Metro.on);
  const pop = $('#metro-pop'); if (pop && pop.open) syncMetroPop();
}
function pulseMetro(accent) {
  const d = $('#metro .m-dot'); if (!d) return;
  d.classList.remove('beat', 'accent'); void d.offsetWidth; d.classList.add('beat'); if (accent) d.classList.add('accent');
}
function syncMetroPop() {
  const p = $('#metro-pop');
  $('#mp-bpm', p).value = Metro.bpm; $('#mp-bpm-o', p).textContent = Metro.bpm + ' bpm';
  $('#mp-train', p).checked = Metro.trainer.on;
  $('#mp-target', p).value = Metro.trainer.target; $('#mp-target-o', p).textContent = Metro.trainer.target + ' bpm';
}
function initMetro() {
  const box = $('#metro');
  box.innerHTML = `<span class="m-dot" aria-hidden="true"></span><button class="m-play" type="button" aria-label="Start metronome">${ICONS.play}</button><button class="m-open" type="button" aria-label="Metronome settings"><b class="m-bpm">${Metro.bpm}</b><small>bpm</small></button>`;
  $('.m-play', box).addEventListener('click', () => Metro.toggle());
  const pop = $('#metro-pop');
  pop.innerHTML = `<h3>Metronome</h3>
    <div class="slider"><input type="range" min="30" max="260" id="mp-bpm" aria-label="Tempo"><output id="mp-bpm-o"></output></div>
    <div class="wrap"><button class="btn" data-d="-5">−5</button><button class="btn" data-d="-1">−1</button><button class="btn" data-d="1">+1</button><button class="btn" data-d="5">+5</button><button class="btn" id="mp-tap">Tap tempo</button></div>
    <div>${seg('mp-beats', [['2', '2/4'], ['3', '3/4'], ['4', '4/4'], ['6', '6/8']], Metro.beats)}</div>
    <label class="switch"><input type="checkbox" id="mp-train">Speed trainer: speed up as I go</label>
    <div class="slider"><span class="muted" style="font-size:13px">Up to</span><input type="range" min="60" max="260" id="mp-target" aria-label="Target tempo"><output id="mp-target-o"></output></div>
    <p class="muted" style="font-size:13px;margin:0">Adds 4 bpm every 2 bars until it reaches your target. Great for scales and chord changes.</p>`;
  $('.m-open', box).addEventListener('click', (e) => { if (pop.open) pop.close(); else { syncMetroPop(); pop.show(); } e.stopPropagation(); });
  document.addEventListener('pointerdown', (e) => { if (pop.open && !pop.contains(e.target) && !box.contains(e.target)) pop.close(); });
  $('#mp-bpm', pop).addEventListener('input', (e) => Metro.setBpm(+e.target.value));
  $$('[data-d]', pop).forEach((b) => b.addEventListener('click', () => Metro.setBpm(Metro.bpm + +b.dataset.d)));
  let taps = [];
  $('#mp-tap', pop).addEventListener('click', () => {
    const now = performance.now(); taps = taps.filter((t) => now - t < 2500); taps.push(now);
    if (taps.length >= 2) { const iv = (taps[taps.length - 1] - taps[0]) / (taps.length - 1); Metro.setBpm(60000 / iv); }
  });
  wireSeg(pop, 'mp-beats', (v) => { Metro.beats = +v; Metro.beat = 0; });
  $('#mp-train', pop).addEventListener('change', (e) => { Metro.trainer.on = e.target.checked; Metro.trainer.bars = 0; if (Metro.trainer.on && Metro.trainer.target <= Metro.bpm) Metro.trainer.target = Math.min(260, Metro.bpm + 40); syncMetroPop(); });
  $('#mp-target', pop).addEventListener('input', (e) => { Metro.trainer.target = +e.target.value; $('#mp-target-o', pop).textContent = Metro.trainer.target + ' bpm'; });
  renderMetro();
}

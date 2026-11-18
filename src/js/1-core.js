'use strict';
/* ================= Utilities ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const mod = (n, m) => ((n % m) + m) % m;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SVGNS = 'http://www.w3.org/2000/svg';
function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function toast(msg, ms = 2600) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), ms);
}
const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================= Music theory ================= */
const SHARPS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const FLATS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const IS_NATURAL = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1];
const noteName = (pc) => (S.settings.accidentals === 'flat' ? FLATS : SHARPS)[mod(pc, 12)];
const spoken = (pc) => noteName(pc).replace('♯', ' sharp').replace('♭', ' flat');
const octaveOf = (midi) => Math.floor(midi / 12) - 1;
const freqOf = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const noteColor = (pc) => `hsl(${(mod(pc, 12) * 30 + 352) % 360} 82% 66%)`;
const noteGlow = (pc) => `hsl(${(mod(pc, 12) * 30 + 352) % 360} 90% 60%)`;

const INSTRUMENTS = {
  guitar: {
    name: 'Guitar', wound: 3, gauge: [3.8, 3.1, 2.6, 2.0, 1.55, 1.2], nylon: false,
    tunings: {
      standard: { name: 'Standard (E A D G B E)', midi: [40, 45, 50, 55, 59, 64] },
      dropD: { name: 'Drop D (D A D G B E)', midi: [38, 45, 50, 55, 59, 64] },
      halfDown: { name: 'Half step down (E♭)', midi: [39, 44, 49, 54, 58, 63] },
      dadgad: { name: 'DADGAD', midi: [38, 45, 50, 55, 57, 62] },
      openG: { name: 'Open G (D G D G B D)', midi: [38, 43, 50, 55, 59, 62] },
      openD: { name: 'Open D (D A D F♯ A D)', midi: [38, 45, 50, 54, 57, 62] },
    },
  },
  bass: {
    name: 'Bass', wound: 4, gauge: [5.2, 4.4, 3.7, 3.0], nylon: false,
    tunings: {
      standard: { name: 'Standard (E A D G)', midi: [28, 33, 38, 43] },
      dropD: { name: 'Drop D (D A D G)', midi: [26, 33, 38, 43] },
    },
  },
  ukulele: {
    name: 'Ukulele', wound: 0, gauge: [2.2, 2.6, 2.4, 2.0], nylon: true,
    tunings: {
      standard: { name: 'Standard (G C E A)', midi: [67, 60, 64, 69] },
      lowG: { name: 'Low G (G C E A)', midi: [55, 60, 64, 69] },
    },
  },
};

const CHORD_TYPES = [
  { id: 'maj', name: 'Major', sym: '', iv: [0, 4, 7] },
  { id: 'min', name: 'Minor', sym: 'm', iv: [0, 3, 7] },
  { id: '7', name: 'Dominant 7', sym: '7', iv: [0, 4, 7, 10] },
  { id: 'maj7', name: 'Major 7', sym: 'maj7', iv: [0, 4, 7, 11] },
  { id: 'm7', name: 'Minor 7', sym: 'm7', iv: [0, 3, 7, 10] },
  { id: 'sus2', name: 'Sus 2', sym: 'sus2', iv: [0, 2, 7] },
  { id: 'sus4', name: 'Sus 4', sym: 'sus4', iv: [0, 5, 7] },
  { id: '6', name: 'Major 6', sym: '6', iv: [0, 4, 7, 9] },
  { id: 'add9', name: 'Add 9', sym: 'add9', iv: [0, 4, 7, 14] },
  { id: 'dim', name: 'Diminished', sym: 'dim', iv: [0, 3, 6] },
  { id: 'aug', name: 'Augmented', sym: 'aug', iv: [0, 4, 8] },
  { id: 'm7b5', name: 'Half-diminished', sym: 'm7♭5', iv: [0, 3, 6, 10] },
  { id: '5', name: 'Power chord', sym: '5', iv: [0, 7] },
];
const SCALES = [
  { id: 'major', name: 'Major', iv: [0, 2, 4, 5, 7, 9, 11], feel: 'Bright and settled. The do-re-mi scale.' },
  { id: 'minor', name: 'Natural minor', iv: [0, 2, 3, 5, 7, 8, 10], feel: 'Darker and wistful.' },
  { id: 'majpent', name: 'Major pentatonic', iv: [0, 2, 4, 7, 9], feel: 'Five notes, no wrong turns. Country and pop melodies.' },
  { id: 'minpent', name: 'Minor pentatonic', iv: [0, 3, 5, 7, 10], feel: 'The rock and blues workhorse. Start soloing here.' },
  { id: 'blues', name: 'Blues', iv: [0, 3, 5, 6, 7, 10], feel: 'Minor pentatonic plus the gritty ♭5 "blue note".' },
  { id: 'dorian', name: 'Dorian', iv: [0, 2, 3, 5, 7, 9, 10], feel: 'Minor with a hopeful raised 6th. Funk and jazz.' },
  { id: 'mixolydian', name: 'Mixolydian', iv: [0, 2, 4, 5, 7, 9, 10], feel: 'Major with a bluesy ♭7. Classic rock riffs.' },
  { id: 'lydian', name: 'Lydian', iv: [0, 2, 4, 6, 7, 9, 11], feel: 'Major with a floating ♯4. Film-score dreamy.' },
  { id: 'phrygian', name: 'Phrygian', iv: [0, 1, 3, 5, 7, 8, 10], feel: 'Minor with a tense ♭2. Flamenco and metal.' },
  { id: 'harmonic', name: 'Harmonic minor', iv: [0, 2, 3, 5, 7, 8, 11], feel: 'Minor with a leading-tone 7th. Exotic and dramatic.' },
];
const DEGREE_COLORS = { 1: '#ff7b54', 2: '#8be0a4', 3: '#ffd166', 4: '#6fe0d6', 5: '#5aa9ff', 6: '#f59bdc', 7: '#c69cff' };
// semitone -> [label, degree]
function intervalInfo(semi, context = []) {
  const s = mod(semi, 12);
  const ctx = context.map((x) => mod(x, 12));
  switch (s) {
    case 0: return ['R', 1];
    case 1: return ['♭2', 2];
    case 2: return [semi >= 12 || context.includes(14) ? '9' : '2', 2];
    case 3: return ['♭3', 3];
    case 4: return ['3', 3];
    case 5: return ['4', 4];
    case 6: return ctx.includes(5) || ctx.includes(3) || !ctx.includes(7) ? ['♭5', 5] : ['♯4', 4];
    case 7: return ['5', 5];
    case 8: return ctx.includes(4) && !ctx.includes(7) ? ['♯5', 5] : ['♭6', 6];
    case 9: return ['6', 6];
    case 10: return ['♭7', 7];
    case 11: return ['7', 7];
  }
}
const intervalColor = (semi, ctx) => DEGREE_COLORS[intervalInfo(semi, ctx)[1]];
const INTERVALS = [
  { semi: 1, short: 'm2', name: 'Minor 2nd', song: 'Jaws theme' },
  { semi: 2, short: 'M2', name: 'Major 2nd', song: 'Happy Birthday' },
  { semi: 3, short: 'm3', name: 'Minor 3rd', song: 'Greensleeves' },
  { semi: 4, short: 'M3', name: 'Major 3rd', song: 'When the Saints' },
  { semi: 5, short: 'P4', name: 'Perfect 4th', song: 'Here Comes the Bride' },
  { semi: 6, short: 'TT', name: 'Tritone', song: 'The Simpsons theme' },
  { semi: 7, short: 'P5', name: 'Perfect 5th', song: 'Star Wars theme' },
  { semi: 8, short: 'm6', name: 'Minor 6th', song: 'The Entertainer' },
  { semi: 9, short: 'M6', name: 'Major 6th', song: 'My Bonnie' },
  { semi: 10, short: 'm7', name: 'Minor 7th', song: 'Star Trek theme' },
  { semi: 11, short: 'M7', name: 'Major 7th', song: 'Take On Me chorus' },
  { semi: 12, short: 'P8', name: 'Octave', song: 'Somewhere Over the Rainbow' },
];
const ordinal = (n) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

/* ================= State + storage ================= */
const KEY = 'fretwave.v1';
const store = {
  load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } },
  save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* storage unavailable */ } },
};
const DEFAULTS = {
  instrument: 'guitar', tuning: 'standard', frets: 15, lefty: false, accidentals: 'sharp',
  speak: true, sound: true, volume: 0.8, goal: 40,
  drill: { strings: null, range: '0-12', naturals: true, smart: true, input: 'screen', kind: 'string', promptSound: true },
};
const saved = store.load();
const S = {
  settings: Object.assign({}, DEFAULTS, saved.settings || {}),
  stats: saved.stats || {},
  daily: saved.daily || { date: '', count: 0, streak: 0, last: '' },
  learn: Object.assign({ done: {}, last: null, open: {} }, saved.learn || {}),
  history: saved.history || {},
  mode: 'path',
};
S.settings.drill = Object.assign({}, DEFAULTS.drill, S.settings.drill || {});
function persist() {
  const st = typeof Tunings !== 'undefined' && typeof current !== 'undefined' && current === Tunings && Tunings.real ? Object.assign({}, S.settings, { tuning: Tunings.real }) : S.settings;
  store.save({ settings: st, stats: S.stats, daily: S.daily, learn: S.learn, history: S.history });
  if (typeof Sync !== 'undefined') Sync.queue();
  clearTimeout(persist._t);
  persist._t = setTimeout(() => { try { if ('caches' in window) caches.open('fretwave-state').then((c) => c.put('state.json', new Response(JSON.stringify({ last: S.daily.last, streak: S.daily.streak, reminder: S.settings.reminder || null })))).catch(() => {}); } catch (e) { /* no cache storage */ } }, 1500);
}
const inst = () => INSTRUMENTS[S.settings.instrument] || INSTRUMENTS.guitar;
function tuning() {
  const t = inst().tunings;
  if (!t[S.settings.tuning]) S.settings.tuning = Object.keys(t)[0];
  return t[S.settings.tuning];
}
const strings = () => tuning().midi;
const midiAt = (s, f) => strings()[s] + f;
const stringNumber = (s) => strings().length - s; // 1 = highest string
function stringLabel(s) {
  const open = strings()[s];
  return `${noteName(open % 12)} string`;
}
function allCells(pred = () => true, maxF = S.settings.frets) {
  const out = [];
  strings().forEach((open, s) => { for (let f = 0; f <= maxF; f++) { const m = open + f; if (pred(m, s, f)) out.push({ s, f, midi: m, pc: m % 12 }); } });
  return out;
}

const dateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function today() { return dateStr(new Date()); }
function yesterday() { const d = new Date(); d.setDate(d.getDate() - 1); return dateStr(d); }
const statKey = (s, f) => `${S.settings.instrument}:${S.settings.tuning}:${s}:${f}`;
function cellStat(s, f) { return S.stats[statKey(s, f)] || { n: 0, ok: 0, ms: 0 }; }
function recordAnswer(s, f, correct, ms) {
  const k = statKey(s, f);
  const st = S.stats[k] || { n: 0, ok: 0, ms: 0 };
  st.n++; if (correct) { st.ok++; st.ms += Math.min(ms, 15000); }
  S.stats[k] = st;
  const t = today();
  if (S.daily.date !== t) { S.daily.date = t; S.daily.count = 0; }
  if (S.daily.last !== t) { S.daily.streak = S.daily.last === yesterday() ? S.daily.streak + 1 : 1; S.daily.last = t; }
  S.daily.count++;
  logActivity('a');
  persist(); renderDaily();
}
function logActivity(kind) {
  const t = today(); const h = S.history[t] || { a: 0, l: 0 }; h[kind] = (h[kind] || 0) + 1; S.history[t] = h;
  const keys = Object.keys(S.history).sort(); while (keys.length > 120) delete S.history[keys.shift()];
}
function currentStreak() { return (S.daily.last === today() || S.daily.last === yesterday()) ? S.daily.streak : 0; }

/* ================= Audio: Karplus-Strong plucked strings ================= */
const Sound = {
  ctx: null, master: null, cache: new Map(), lastPlay: 0, drone: null,
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 3;
      const body = this.ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 180; body.Q.value = 0.9; body.gain.value = 3;
      const air = this.ctx.createBiquadFilter(); air.type = 'highshelf'; air.frequency.value = 4500; air.gain.value = -5;
      this.master = this.ctx.createGain(); this.master.gain.value = S.settings.volume;
      this.master.connect(body); body.connect(air); air.connect(comp); comp.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  setVolume(v) { if (this.master) this.master.gain.value = v; },
  buffer(midi) {
    const key = midi + ':' + S.settings.instrument;
    if (this.cache.has(key)) return this.cache.get(key);
    const ctx = this.ctx, sr = ctx.sampleRate, f = freqOf(midi);
    const nylon = inst().nylon, bass = S.settings.instrument === 'bass';
    const t60 = clamp((nylon ? 2.2 : 4.2) - (midi - 40) * 0.035, 1.1, 5);
    const seconds = Math.min(t60 * 0.9, 3.4);
    const len = Math.floor(sr * seconds);
    const out = new Float32Array(len);
    const D = sr / f;
    const N = Math.max(2, Math.floor(D - 0.5 - 0.1));
    const frac = D - 0.5 - N;
    const C = (1 - frac) / (1 + frac);
    const rho = Math.pow(10, -3 / (t60 * f));
    const line = new Float32Array(N);
    // excitation: shaped noise burst with a pluck-position comb
    let lp = 0; const bright = nylon ? 0.35 : bass ? 0.3 : 0.55;
    for (let i = 0; i < N; i++) { lp += bright * ((Math.random() * 2 - 1) - lp); line[i] = lp; }
    const p = Math.max(1, Math.floor(N * 0.13)); const tmp = line.slice();
    for (let i = 0; i < N; i++) line[i] = tmp[i] - (i >= p ? tmp[i - p] : 0) * 0.85;
    let mx = 0; for (let i = 0; i < N; i++) mx = Math.max(mx, Math.abs(line[i]));
    for (let i = 0; i < N; i++) line[i] /= (mx || 1);
    let idx = 0, prev = 0, apIn = 0, apOut = 0;
    const S2 = nylon ? 0.46 : 0.5;
    for (let n = 0; n < len; n++) {
      const x = line[idx];
      const lpo = rho * ((1 - S2) * x + S2 * prev); prev = x;
      const ap = C * lpo + apIn - C * apOut; apIn = lpo; apOut = ap;
      line[idx] = ap; out[n] = x; idx++; if (idx >= N) idx = 0;
    }
    const fade = Math.floor(sr * 0.25);
    for (let n = 0; n < fade; n++) out[len - 1 - n] *= n / fade;
    const atk = Math.floor(sr * 0.002);
    for (let n = 0; n < atk; n++) out[n] *= n / atk;
    const buf = ctx.createBuffer(1, len, sr); buf.copyToChannel(out, 0);
    this.cache.set(key, buf);
    return buf;
  },
  play(midi, when = 0, gain = 0.55, dur = 0, soft = false) {
    if (!S.settings.sound) return null;
    const ctx = this.ensure(); if (!ctx) return null;
    const src = ctx.createBufferSource(); src.buffer = this.buffer(midi);
    const g = ctx.createGain(); const t = ctx.currentTime + when; const peak = gain * (midi < 40 ? 1.25 : 1);
    if (soft) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.012); } else g.gain.value = peak;
    if (dur) { g.gain.setValueAtTime(peak, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05); }
    src.connect(g); g.connect(this.master);
    src.start(t, soft ? 0.006 : 0);
    if (dur) src.stop(t + dur + 0.08);
    this.live.add(src); src.onended = () => this.live.delete(src);
    this.lastPlay = performance.now() + when * 1000;
    return { src, g, t };
  },
  live: new Set(),
  stopAll() {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    this.live.forEach((src) => { try { src.stop(t + 0.02); } catch (e) { /* already stopped */ } });
    this.live.clear();
  },
  droneOn(midi) {
    const ctx = this.ensure(); if (!ctx) return; this.droneOff();
    const g = ctx.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.8);
    const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 700;
    const oscs = [0, 12, 7].map((iv, i) => { const o = ctx.createOscillator(); o.type = i === 2 ? 'triangle' : 'sawtooth'; o.frequency.value = freqOf(midi + iv - 12); o.detune.value = (i - 1) * 6; o.connect(lpf); o.start(); return o; });
    lpf.connect(g); g.connect(this.master);
    this.drone = { g, oscs };
  },
  droneOff() {
    if (!this.drone) return; const { g, oscs } = this.drone; const t = this.ctx.currentTime;
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 0.4);
    oscs.forEach((o) => o.stop(t + 0.45)); this.drone = null;
  },
};

const Voice = {
  say(text) {
    if (!S.settings.speak || !('speechSynthesis' in window)) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 1.05; u.pitch = 1; u.volume = 0.9; speechSynthesis.speak(u); } catch (e) { /* no speech */ }
  },
  busy() { return 'speechSynthesis' in window && speechSynthesis.speaking; },
};

/* ================= Microphone pitch detection (YIN) ================= */
function yin(buf, sr) {
  let rms = 0; for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / buf.length);
  if (rms < 0.012) return { f: -1, rms };
  const W = 1536, maxTau = Math.min(buf.length - W - 1, Math.floor(sr / 38)), minTau = Math.floor(sr / 1500);
  const d = new Float32Array(maxTau + 1);
  for (let tau = minTau; tau <= maxTau; tau++) { let sum = 0; for (let i = 0; i < W; i++) { const v = buf[i] - buf[i + tau]; sum += v * v; } d[tau] = sum; }
  let run = 0; const cm = new Float32Array(maxTau + 1); cm[minTau] = 1;
  for (let tau = minTau; tau <= maxTau; tau++) { run += d[tau]; cm[tau] = run ? d[tau] * (tau - minTau + 1) / run : 1; }
  let tau = -1;
  for (let t = minTau + 1; t < maxTau; t++) { if (cm[t] < 0.13) { while (t + 1 < maxTau && cm[t + 1] < cm[t]) t++; tau = t; break; } }
  if (tau < 0) return { f: -1, rms };
  const a = d[tau - 1], b = d[tau], c = d[tau + 1]; const den = a + c - 2 * b;
  const shift = den ? (a - c) / (2 * den) : 0;
  return { f: sr / (tau + shift), rms };
}
const Mic = {
  stream: null, an: null, buf: null, timer: null, cb: null, active: false,
  async start(cb) {
    if (this.active) { this.cb = cb; return; }
    const ctx = Sound.ensure();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('nomic');
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const src = ctx.createMediaStreamSource(this.stream);
    this.an = ctx.createAnalyser(); this.an.fftSize = 16384; this.an.smoothingTimeConstant = 0.5; src.connect(this.an);
    this.buf = new Float32Array(this.an.fftSize); this.freq = new Float32Array(this.an.frequencyBinCount);
    this.cb = cb; this.active = true; this.chromaCb = null;
    this.timer = setInterval(() => this.tick(), 50);
  },
  listen(cb) { this.cb = cb; },
  stop() {
    clearInterval(this.timer); this.timer = null; this.active = false; this.chromaCb = null; this.ignoreOwn = false;
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    this.stream = null;
  },
  tick() {
    if (!this.an) return;
    this.an.getFloatTimeDomainData(this.buf);
    const r = yin(this.buf.subarray(this.buf.length - 4096), Sound.ctx.sampleRate);
    const quiet = (performance.now() - Sound.lastPlay < 1300 && !this.ignoreOwn) || Voice.busy();
    if (this.cb) this.cb(quiet ? -1 : r.f, r.rms);
    if (this.chromaCb) { this.an.getFloatFrequencyData(this.freq); this.chromaCb(quiet ? null : chromaOf(this.freq, Sound.ctx.sampleRate, this.an.fftSize), r.rms); }
  },
};
function micError(e) {
  const msg = e && e.name === 'NotAllowedError'
    ? 'Microphone access was blocked. Allow it in your browser’s site settings, then try again.'
    : 'The microphone is blocked on this page. Open Fretwave from its own site (your GitHub Pages link) to play along on your real guitar.';
  toast(msg, 4200);
}

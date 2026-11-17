/* ================= CAGED map ================= */
const CAGED_SHAPES = [
  { name: 'C', rootStr: 1, off: [null, 0, -1, -3, -2, -3], color: '#ff7b54' },
  { name: 'A', rootStr: 1, off: [null, 0, 2, 2, 2, 0], color: '#ffd166' },
  { name: 'G', rootStr: 0, off: [0, -1, -3, -3, -3, 0], color: '#8be0a4' },
  { name: 'E', rootStr: 0, off: [0, 2, 2, 1, 0, 0], color: '#5aa9ff' },
  { name: 'D', rootStr: 2, off: [null, null, 0, 2, 3, 2], color: '#c69cff' },
];
const isStdGuitar = () => S.settings.instrument === 'guitar' && S.settings.tuning === 'standard';
function cagedShapes(root) {
  const tun = strings();
  return CAGED_SHAPES.map((sh) => {
    const rf = mod(root - tun[sh.rootStr], 12);
    let frets = sh.off.map((o) => (o == null ? null : rf + o));
    if (Math.min(...frets.filter((f) => f != null)) < 0) frets = frets.map((f) => (f == null ? null : f + 12));
    frets = frets.map((f) => (f == null ? -1 : f));
    return Object.assign({}, sh, { frets, lo: Math.min(...frets.filter((f) => f >= 0)), hi: Math.max(...frets) });
  }).sort((a, b) => a.lo - b.lo);
}
Neck.caged = function (root, o = {}) {
  if (!isStdGuitar()) { toast('The CAGED map is drawn for a standard-tuned guitar.'); return []; }
  this.clear();
  const shapes = cagedShapes(root);
  const iv = [0, 4, 7];
  shapes.forEach((sh) => {
    if (o.only && sh.name !== o.only) return;
    if (sh.hi > this.g.F) return;
    const x0 = sh.lo === 0 ? this.g.nutX - 80 : this.g.xs[sh.lo - 1] + 2, x1 = this.g.xs[Math.min(sh.hi, this.g.F)] - 2;
    const used = sh.frets.map((f, s) => (f >= 0 ? s : null)).filter((s) => s != null);
    const yTop = this.y(Math.max(...used)) - 22, yBot = this.y(Math.min(...used)) + 22;
    this.rect(x0, x1 - x0, { y: yTop, height: yBot - yTop, rx: 16, fill: sh.color, opacity: 0.13, stroke: sh.color, 'stroke-width': 2, 'stroke-opacity': 0.6 }, this.fxBelow);
    const t = el('text', { x: this.X((x0 + x1) / 2), y: this.g.boardBot + 12, class: 'caged-label', fill: sh.color, 'text-anchor': 'middle' }, this.fx); t.textContent = sh.name + ' shape';
    sh.frets.forEach((f, s) => {
      if (f < 0) return;
      const semi = mod(midiAt(s, f) - root, 12);
      if (o.rootsOnly && semi !== 0) { this.mark(s, f, { label: intervalInfo(semi, iv)[0], color: intervalColor(semi, iv), cls: 'ghost' }); return; }
      this.mark(s, f, { label: intervalInfo(semi, iv)[0], color: intervalColor(semi, iv), ring: semi === 0, ringColor: '#fff' });
    });
  });
  return shapes;
};

/* ================= Jam room ================= */
const JAM_STYLES = {
  pop: { name: 'Pop', feel: 'I–V–vi–IV', bars: [[0, 'maj'], [7, 'maj'], [9, 'min'], [5, 'maj']], scale: 'majpent', swing: 0, bpm: 96 },
  rock: { name: 'Rock', feel: 'I–IV–V–IV', bars: [[0, 'maj'], [5, 'maj'], [7, 'maj'], [5, 'maj']], scale: 'majpent', swing: 0, bpm: 118 },
  blues: { name: '12-bar blues', feel: 'I7–IV7–V7', bars: [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7].map((x) => [x, '7']), scale: 'blues', swing: 0.62, bpm: 92 },
  minor: { name: 'Minor ballad', feel: 'i–VI–III–VII', bars: [[0, 'min'], [8, 'maj'], [3, 'maj'], [10, 'maj']], scale: 'minpent', swing: 0, bpm: 76 },
};
const Jam = {
  id: 'jam', nav: 'Jam', title: 'Jam room',
  help: 'Pick a style and key. A band plays, and the neck shows the scale with the current chord’s notes lit up, so you always know where to land.',
  style: 'blues', key: 9, bpm: null, layers: { drums: true, bass: true, chords: true }, scaleMode: 'auto', playing: false, listen: false,
  mount(p) {
    this.p = p; this.bar = 0; this.step = 0;
    const st = JAM_STYLES[this.style]; if (!this.bpm) this.bpm = st.bpm;
    p.innerHTML = `<div class="panel-grid">
      <div class="controls">
        <div class="jam-now">
          <div><small class="muted">Now</small><div class="jam-chord" id="jm-now">–</div></div>
          <div><small class="muted">Next</small><div class="jam-next" id="jm-next">–</div></div>
          <div class="beats" id="jm-beats">${'<i></i>'.repeat(4)}</div>
        </div>
        <div class="prog" id="jm-bars"></div>
        <div class="wrap"><button class="btn btn-primary btn-big" id="jm-play">${ICONS.play}Start the band</button>
          <button class="btn" id="jm-listen">${ICONS.mic}Show what I play</button></div>
        <div id="jm-score" class="muted" style="font-size:14px"></div>
        <div class="legend"><span><i style="background:#ffc857"></i>Notes of the current chord</span><span><i style="background:rgba(241,233,218,.4)"></i>Rest of the scale</span><span>Use headphones so the mic hears only you</span></div>
      </div>
      <div class="controls">
        <div class="row row-wide"><span class="lbl">Style</span>${seg('jm-style', Object.entries(JAM_STYLES).map(([k, v]) => [k, v.name]), this.style)}</div>
        <div class="row row-wide"><span class="lbl">Key</span><div class="wrap" id="jm-key">${noteChips(this.key)}</div></div>
        <div class="row"><span class="lbl">Tempo</span><div class="slider"><input type="range" min="50" max="180" value="${this.bpm}" id="jm-bpm" aria-label="Tempo"><output id="jm-bpm-o">${this.bpm} bpm</output></div></div>
        <div class="row"><span class="lbl">Scale shown</span>${seg('jm-sc', [['auto', 'Best fit'], ['pent', 'Pentatonic'], ['full', 'Full scale'], ['none', 'Chord tones only']], this.scaleMode)}</div>
        <div class="row"><span class="lbl">Band</span><div class="wrap">${['drums', 'bass', 'chords'].map((k) => `<button class="chip" data-l="${k}" aria-pressed="${this.layers[k]}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div></div>
      </div></div>`;
    wireSeg(p, 'jm-style', (v) => { this.style = v; this.bpm = JAM_STYLES[v].bpm; $('#jm-bpm', p).value = this.bpm; $('#jm-bpm-o', p).textContent = this.bpm + ' bpm'; this.bar = 0; this.renderBars(); this.drawChord(0); });
    $('#jm-key', p).addEventListener('click', (e) => { const b = e.target.closest('.note-chip'); if (!b) return; this.key = +b.dataset.pc; $$('#jm-key .note-chip', p).forEach((x) => x.setAttribute('aria-pressed', x === b)); this.renderBars(); this.drawChord(this.bar); });
    $('#jm-bpm', p).addEventListener('input', (e) => { this.bpm = +e.target.value; $('#jm-bpm-o', p).textContent = this.bpm + ' bpm'; });
    wireSeg(p, 'jm-sc', (v) => { this.scaleMode = v; this.drawChord(this.bar); });
    $$('[data-l]', p).forEach((b) => b.addEventListener('click', () => { const k = b.dataset.l; this.layers[k] = !this.layers[k]; b.setAttribute('aria-pressed', this.layers[k]); }));
    $('#jm-play', p).addEventListener('click', () => (this.playing ? this.stop() : this.start()));
    $('#jm-listen', p).addEventListener('click', () => this.toggleListen());
    this.renderBars(); this.drawChord(0);
  },
  unmount() { this.stop(); if (Mic.active) Mic.stop(); this.listen = false; },
  chordAt(i) { const st = JAM_STYLES[this.style]; const [d, id] = st.bars[i % st.bars.length]; return { root: mod(this.key + d, 12), id }; },
  scaleIv() {
    const st = JAM_STYLES[this.style];
    const auto = st.scale;
    if (this.scaleMode === 'none') return [];
    if (this.scaleMode === 'full') return auto === 'majpent' ? MAJ : auto === 'blues' ? BLUES : [0, 2, 3, 5, 7, 8, 10];
    if (this.scaleMode === 'pent') return auto === 'majpent' ? [0, 2, 4, 7, 9] : MINPENT;
    return SCALES.find((x) => x.id === auto).iv;
  },
  renderBars() {
    const st = JAM_STYLES[this.style];
    $('#jm-bars', this.p).innerHTML = st.bars.map((_, i) => { const c = this.chordAt(i); return `<div class="prog-card${i === this.bar % st.bars.length ? ' on' : ''}"><small>${i + 1}</small><b style="color:${noteColor(c.root)}">${esc(noteName(c.root) + chordType(c.id).sym)}</b></div>`; }).join('');
  },
  drawChord(i) {
    const c = this.chordAt(i), n = this.chordAt(i + 1), t = chordType(c.id);
    const now = $('#jm-now', this.p), nx = $('#jm-next', this.p); if (!now) return;
    now.textContent = noteName(c.root) + t.sym; now.style.color = noteColor(c.root);
    nx.textContent = noteName(n.root) + chordType(n.id).sym;
    $$('#jm-bars .prog-card', this.p).forEach((b, k) => b.classList.toggle('on', k === i % JAM_STYLES[this.style].bars.length));
    Neck.clear();
    const sIv = this.scaleIv(); const sPcs = sIv.map((x) => mod(this.key + x, 12)); const cPcs = t.iv.map((x) => mod(c.root + x, 12));
    allCells().forEach(({ s, f, midi, pc }) => {
      if (cPcs.includes(pc)) { const semi = mod(pc - c.root, 12); Neck.mark(s, f, { label: intervalInfo(semi, t.iv)[0], color: intervalColor(semi, t.iv), ring: semi === 0, ringColor: '#fff' }); }
      else if (sPcs.includes(pc)) Neck.mark(s, f, { label: noteName(pc), color: 'rgba(241,233,218,.32)', textColor: '#f1e9da', cls: 'dim' });
    });
  },
  start() {
    const ctx = Sound.ensure(); if (!ctx) return;
    this.playing = true; this.bar = 0; this.step = 0; this.next = ctx.currentTime + 0.12; this.inKey = { n: 0, ok: 0 };
    $('#jm-play', this.p).innerHTML = `${ICONS.stop}Stop the band`;
    clearInterval(this.timer); this.timer = setInterval(() => this.tick(), 25);
  },
  stop() {
    this.playing = false; clearInterval(this.timer);
    const b = this.p && $('#jm-play', this.p); if (b) b.innerHTML = `${ICONS.play}Start the band`;
    Sound.stopAll();
  },
  tick() {
    const ctx = Sound.ctx, st = JAM_STYLES[this.style];
    const eighth = 30 / this.bpm;
    while (this.next < ctx.currentTime + 0.15) {
      const k = this.step % 8, bar = Math.floor(this.step / 8);
      let t = this.next + (k % 2 === 1 ? eighth * (st.swing ? (st.swing * 2 - 1) : 0) : 0);
      const c = this.chordAt(bar);
      this.schedule(k, t, c, st, eighth, bar);
      if (k === 0) { const delay = Math.max(0, (t - ctx.currentTime) * 1000); setTimeout(() => { if (!this.playing) return; this.bar = bar; this.drawChord(bar); }, delay); }
      if (k % 2 === 0) { const delay = Math.max(0, (t - ctx.currentTime) * 1000); const beat = k / 2; setTimeout(() => { if (!this.playing) return; $$('#jm-beats i', this.p).forEach((d, j) => d.classList.toggle('on', j === beat)); }, delay); }
      this.next += eighth; this.step++;
    }
  },
  schedule(k, t, c, st, eighth, bar) {
    const L = this.layers, beat = k / 2;
    if (L.drums) {
      if (this.style === 'minor') { if (k === 0) Sound.kick(t); if (k === 4) Sound.snare(t, 0.8); if (k % 2 === 0) Sound.hat(t, 0.6); }
      else { if (k === 0 || k === 4 || (this.style === 'rock' && k === 5)) Sound.kick(t); if (k === 2 || k === 6) Sound.snare(t); Sound.hat(t, k % 2 ? 0.55 : 0.85, this.style === 'blues' && k === 7); }
    }
    const r = c.root, bassRoot = 33 + mod(r - 9, 12);
    if (L.bass) {
      if (this.style === 'blues') { const walk = [0, 4, 7, 9, 10, 9, 7, 4]; Sound.bass(bassRoot + walk[k], t, eighth * 0.95); }
      else if (this.style === 'rock') Sound.bass(bassRoot, t, eighth * 0.9);
      else if (this.style === 'pop') { if (k === 0 || k === 3 || k === 4 || k === 6) Sound.bass(bassRoot + (k === 6 ? 7 : 0), t, eighth * 1.6); }
      else if (k === 0 || k === 4) Sound.bass(bassRoot + (k === 4 ? 7 : 0), t, eighth * 3.6);
    }
    if (L.chords) {
      const v = this.voicing(c); if (!v) return;
      const pat = this.style === 'pop' ? { 0: 'D', 2: 'D', 3: 'U', 5: 'U', 6: 'D', 7: 'U' } : this.style === 'rock' ? { 0: 'D', 2: 'D', 4: 'D', 6: 'D' } : this.style === 'blues' ? { 1: 'D', 5: 'D' } : { 0: 'D', 4: 'D' };
      const dir = pat[k]; if (dir) Sound.strumAt(v.frets, t, dir === 'U', dir === 'U' ? 0.16 : 0.22);
    }
  },
  vcache: {},
  voicing(c) { const k = c.root + c.id; if (!this.vcache[k]) this.vcache[k] = voicingOf(c.root, c.id); return this.vcache[k]; },
  async toggleListen() {
    if (this.listen) { Mic.stop(); this.listen = false; $('#jm-listen', this.p).innerHTML = `${ICONS.mic}Show what I play`; $('#jm-score', this.p).textContent = ''; return; }
    try { await Mic.start((f) => this.onPitch(f)); Mic.ignoreOwn = true; this.listen = true; this.inKey = { n: 0, ok: 0 }; $('#jm-listen', this.p).innerHTML = `${ICONS.stop}Stop listening`; } catch (e) { micError(e); }
  },
  onPitch(fr) {
    if (fr <= 0) { this._st = 0; return; }
    const m = Math.round(69 + 12 * Math.log2(fr / 440));
    if (m === this._last) this._st++; else { this._st = 1; this._last = m; }
    if (this._st !== 3) return;
    const pc = m % 12, c = this.chordAt(this.bar), t = chordType(c.id);
    const inChord = t.iv.map((x) => mod(c.root + x, 12)).includes(pc), inScale = this.scaleIv().map((x) => mod(this.key + x, 12)).includes(pc) || inChord;
    this.inKey.n++; if (inScale) this.inKey.ok++;
    const pos = allCells((x) => x === m); pos.forEach((p) => Neck.pluck(p.s, p.f, inChord ? '#5ee6a8' : inScale ? '#ffc857' : '#ff6b7a'));
    $('#jm-score', this.p).innerHTML = `You played <b style="color:${noteColor(pc)}">${noteName(pc)}</b>: ${inChord ? 'a chord tone, perfect landing' : inScale ? 'in the scale' : 'outside the scale'}. ${Math.round(100 * this.inKey.ok / this.inKey.n)}% of your notes fit.`;
  },
  onCell(s, f) { Neck.play(s, f); },
  onKey(e) { if (e.code === 'Space') { e.preventDefault(); this.playing ? this.stop() : this.start(); } },
};

/* ================= Tab player ================= */
function tabFrom(cols, n = 6) {
  // cols: array of arrays of [s, f]; null = bar line
  const lines = Array.from({ length: n }, () => []);
  cols.forEach((col) => {
    if (col === null) { lines.forEach((l) => l.push('|')); return; }
    const w = Math.max(...col.map(([, f]) => String(f).length), 1);
    for (let i = 0; i < n; i++) { const s = n - 1 - i; const hit = col.find(([cs]) => cs === s); lines[i].push((hit ? String(hit[1]) : '').padEnd(w, '-') + '--'); }
  });
  const names = n === 6 ? ['e', 'B', 'G', 'D', 'A', 'E'] : ['G', 'D', 'A', 'E'];
  return lines.map((l, i) => names[i] + '|--' + l.join('') + '|').join('\n');
}
function placeMelody(midis, pos) {
  const tun = [40, 45, 50, 55, 59, 64]; let last = pos;
  return midis.map((m) => {
    let best = null;
    tun.forEach((o, s) => { const f = m - o; if (f < 0 || f > 15) return; const cost = Math.abs(f - last) + (f < pos - 1 || f > pos + 4 ? 6 : 0); if (!best || cost < best.cost) best = { s, f, cost }; });
    last = best.f; return [[best.s, best.f]];
  });
}
const TAB_EXAMPLES = {
  ode: { name: 'Ode to Joy (Beethoven)', bpm: 100, tab: () => tabFrom(placeMelody([64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62], 0)) },
  green: { name: 'Greensleeves (traditional)', bpm: 110, tab: () => tabFrom(placeMelody([57, 60, 62, 64, 65, 64, 62, 59, 55, 57, 59, 60, 57, 57, 56, 57, 59, 56, 52], 2)) },
  riff: { name: 'Pentatonic riff (exercise)', bpm: 120, tab: () => tabFrom([[[0, 5]], [[0, 8]], [[1, 5]], [[1, 7]], [[2, 5]], [[2, 7]], [[1, 7]], [[1, 5]], null, [[0, 8]], [[0, 5]], [[1, 7]], [[0, 5]]]) },
  spider: { name: 'Spider walk (finger warm-up)', bpm: 90, tab: () => tabFrom([0, 1, 2, 3, 4, 5].flatMap((s) => [1, 2, 3, 4].map((f) => [[s, f]]))) },
  chords: { name: 'G–C–D strummed', bpm: 80, tab: () => tabFrom([[[0, 3], [1, 2], [2, 0], [3, 0], [4, 0], [5, 3]], null, [[1, 3], [2, 2], [3, 0], [4, 1], [5, 0]], null, [[2, 0], [3, 2], [4, 3], [5, 2]], null, [[0, 3], [1, 2], [2, 0], [3, 0], [4, 0], [5, 3]]]) },
};
function parseTab(text) {
  const raw = text.split(/\r?\n/);
  const isTabLine = (l) => /^[\sA-Ga-g#b]*\|?[-0-9hpbr\/\\~x|().\s]*-[-0-9hpbr\/\\~x|().\s]*$/.test(l.trim()) && /-/.test(l);
  const blocks = []; let cur = [];
  raw.forEach((l) => { if (isTabLine(l)) cur.push(l); else { if (cur.length) blocks.push(cur); cur = []; } });
  if (cur.length) blocks.push(cur);
  const events = []; let lines = 6;
  blocks.forEach((b) => {
    const n = b.length >= 6 ? 6 : b.length; if (n < 4) return; lines = n;
    const body = b.slice(0, n).map((l) => { const i = l.indexOf('|'); return i >= 0 && i < 4 ? l.slice(i + 1) : l.replace(/^\s*[A-Ga-g#b]\s*/, ''); });
    const width = Math.max(...body.map((l) => l.length));
    const byCol = new Map();
    body.forEach((l, li) => {
      for (let c = 0; c < l.length; c++) {
        if (/\d/.test(l[c]) && !(c > 0 && /\d/.test(l[c - 1]))) {
          let num = l[c]; if (/\d/.test(l[c + 1] || '') && +(l[c] + l[c + 1]) <= 24) num += l[c + 1];
          const s = n - 1 - li; if (!byCol.has(c)) byCol.set(c, []); byCol.get(c).push({ s, f: +num, line: li, col: c, len: num.length });
        }
      }
    });
    const cols = [...byCol.keys()].sort((a, b) => a - b);
    // merge columns 1 apart (two-digit numbers on other lines)
    const merged = []; cols.forEach((c) => { const last = merged[merged.length - 1]; if (last && c - last.col <= 1) last.notes.push(...byCol.get(c)); else merged.push({ col: c, notes: byCol.get(c).slice() }); });
    merged.forEach((m, i) => events.push({ notes: m.notes, gap: i ? m.col - merged[i - 1].col : 3, block: blocks.indexOf(b) }));
    if (width) events.push({ notes: [], gap: 0, blockEnd: true });
  });
  return { events: events.filter((e) => e.notes.length), lines, blocks };
}
const Tabs = {
  id: 'tabs', nav: 'Tab player', title: 'Tab player',
  help: 'Paste any guitar tab, or pick an example. Fretwave plays it on the neck, at any speed, and shows the next note before you need it.',
  example: 'ode', speed: 1, loop: true, timing: 'even', idx: -1, playing: false,
  mount(p) {
    this.p = p; this.idx = -1;
    const ex = TAB_EXAMPLES[this.example];
    p.innerHTML = `<div class="panel-grid">
      <div class="controls">
        <div class="tab-view" id="tb-view" aria-live="off"></div>
        <div class="wrap">
          <button class="btn btn-primary" id="tb-play">${ICONS.play}Play</button>
          <button class="btn" id="tb-prev" aria-label="Previous note">◀ Step</button>
          <button class="btn" id="tb-next" aria-label="Next note">Step ▶</button>
          <button class="btn" id="tb-restart">${ICONS.replay}From the top</button>
        </div>
        <div class="row"><span class="lbl">Speed</span><div class="slider"><input type="range" min="0.25" max="1.5" step="0.05" value="${this.speed}" id="tb-speed" aria-label="Speed"><output id="tb-speed-o">${Math.round(this.speed * 100)}%</output></div></div>
        <div class="row"><span class="lbl">Options</span><div class="wrap" style="gap:20px"><label class="switch"><input type="checkbox" id="tb-loop" ${this.loop ? 'checked' : ''}>Loop</label>${seg('tb-timing', [['even', 'Even timing'], ['space', 'Follow tab spacing']], this.timing)}</div></div>
      </div>
      <div class="controls">
        <div class="row row-wide"><span class="lbl">Examples</span><div class="wrap" id="tb-ex">${Object.entries(TAB_EXAMPLES).map(([k, v]) => `<button class="chip" data-k="${k}" aria-pressed="${k === this.example}">${v.name}</button>`).join('')}</div></div>
        <div class="row row-wide"><span class="lbl">Or paste your own tab</span><textarea id="tb-text" spellcheck="false" rows="8" aria-label="Tab text">${esc(this.text || ex.tab())}</textarea></div>
        <div class="wrap"><button class="btn" id="tb-load">Load this tab</button><span class="muted" id="tb-msg" style="font-size:13px"></span></div>
      </div></div>`;
    $('#tb-play', p).addEventListener('click', () => (this.playing ? this.pause() : this.play()));
    $('#tb-next', p).addEventListener('click', () => { this.pause(); this.goto(this.idx + 1, true); });
    $('#tb-prev', p).addEventListener('click', () => { this.pause(); this.goto(this.idx - 1, true); });
    $('#tb-restart', p).addEventListener('click', () => { this.pause(); this.goto(0, true); });
    $('#tb-speed', p).addEventListener('input', (e) => { this.speed = +e.target.value; $('#tb-speed-o', p).textContent = Math.round(this.speed * 100) + '%'; });
    $('#tb-loop', p).addEventListener('change', (e) => (this.loop = e.target.checked));
    wireSeg(p, 'tb-timing', (v) => (this.timing = v));
    $('#tb-ex', p).addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; this.example = b.dataset.k; $$('#tb-ex .chip', p).forEach((x) => x.setAttribute('aria-pressed', x === b)); this.text = TAB_EXAMPLES[this.example].tab(); $('#tb-text', p).value = this.text; this.load(); Metro.setBpm(TAB_EXAMPLES[this.example].bpm); });
    $('#tb-load', p).addEventListener('click', () => { this.text = $('#tb-text', p).value; this.load(); });
    this.text = $('#tb-text', p).value; this.load();
  },
  unmount() { this.pause(); },
  load() {
    this.pause();
    const r = parseTab(this.text); this.ev = r.events; this.idx = -1;
    const msg = $('#tb-msg', this.p);
    if (!this.ev.length) { msg.textContent = 'No tab found. Paste lines that look like e|--0--3--|, one per string.'; $('#tb-view', this.p).innerHTML = ''; return; }
    msg.textContent = `${this.ev.length} notes or chords loaded.${r.lines === 4 && S.settings.instrument !== 'bass' ? ' This looks like a 4-string tab: switch to bass in settings.' : ''}`;
    this.renderView(r);
    this.preview(0);
  },
  renderView(r) {
    // rebuild the tab text with a span around each event's digits
    const html = r.blocks.map((b, bi) => {
      const n = b.length >= 6 ? 6 : b.length;
      return b.slice(0, n).map((l, li) => {
        const off = (() => { const i = l.indexOf('|'); return i >= 0 && i < 4 ? i + 1 : 0; })();
        const marks = [];
        this.ev.forEach((e, ei) => { if (e.block !== bi) return; e.notes.forEach((nt) => { if (nt.line === li) marks.push({ start: off + nt.col, len: nt.len, ei }); }); });
        marks.sort((a, b2) => a.start - b2.start);
        let out = '', pos = 0;
        marks.forEach((m) => { out += esc(l.slice(pos, m.start)) + `<span data-e="${m.ei}">${esc(l.slice(m.start, m.start + m.len))}</span>`; pos = m.start + m.len; });
        return out + esc(l.slice(pos));
      }).join('\n');
    }).join('\n\n');
    $('#tb-view', this.p).innerHTML = `<pre>${html}</pre>`;
  },
  preview(i) {
    Neck.clear();
    const nx = this.ev[i]; if (!nx) return;
    nx.notes.forEach((n) => { if (n.s < strings().length) Neck.mark(n.s, n.f, { label: n.f, color: 'rgba(241,233,218,.18)', textColor: '#f1e9da', cls: 'seqhint', ring: true, ringColor: 'rgba(241,233,218,.5)' }); });
  },
  goto(i, sound) {
    if (!this.ev || !this.ev.length) return;
    if (i >= this.ev.length) { if (this.loop) i = 0; else { this.pause(); return; } }
    if (i < 0) i = 0;
    this.idx = i; const e = this.ev[i];
    Neck.clear();
    e.notes.forEach((n, k) => { if (n.s >= strings().length || n.f > S.settings.frets) return; Neck.noteMark(n.s, n.f, { ring: true }); if (sound) Neck.play(n.s, n.f, k * 0.012, e.notes.length > 2 ? 0.3 : 0.5); });
    const nx = this.ev[i + 1] || (this.loop ? this.ev[0] : null);
    if (nx) nx.notes.forEach((n) => { if (n.s < strings().length && n.f <= S.settings.frets && !Neck.has(n.s, n.f)) Neck.mark(n.s, n.f, { label: n.f, color: 'rgba(241,233,218,.18)', textColor: '#f1e9da', cls: 'seqhint' }); });
    $$('#tb-view span.on', this.p).forEach((x) => x.classList.remove('on'));
    $$(`#tb-view span[data-e="${i}"]`, this.p).forEach((x) => { x.classList.add('on'); });
    const first = $(`#tb-view span[data-e="${i}"]`, this.p); if (first) { const v = $('#tb-view', this.p); const r = first.getBoundingClientRect(), vr = v.getBoundingClientRect(); if (r.left < vr.left || r.right > vr.right) v.scrollLeft += r.left - vr.left - vr.width / 3; }
    if (e.notes[0]) Neck.scrollTo(e.notes[0].f);
  },
  play() {
    if (!this.ev || !this.ev.length) return; Sound.ensure();
    this.playing = true; $('#tb-play', this.p).innerHTML = `${ICONS.stop}Pause`;
    const stepFn = () => {
      if (!this.playing) return;
      this.goto(this.idx + 1, true);
      if (!this.playing) return;
      const nx = this.ev[this.idx + 1];
      const beat = 60 / (Metro.bpm || 100) / this.speed;
      const dt = this.timing === 'space' && nx ? clamp(nx.gap / 3, 0.25, 4) * beat * 0.5 : beat * 0.5;
      this.t = setTimeout(stepFn, dt * 1000);
    };
    stepFn();
  },
  pause() { this.playing = false; clearTimeout(this.t); const b = this.p && $('#tb-play', this.p); if (b) b.innerHTML = `${ICONS.play}Play`; },
  onCell(s, f) { Neck.play(s, f); },
  onKey(e) { if (e.code === 'Space') { e.preventDefault(); this.playing ? this.pause() : this.play(); } else if (e.code === 'ArrowRight') { this.pause(); this.goto(this.idx + 1, true); } else if (e.code === 'ArrowLeft') { this.pause(); this.goto(this.idx - 1, true); } },
};

/* ================= Live view: see what you play ================= */
const KS_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KS_MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
function guessKey(hist) {
  const tot = hist.reduce((a, b) => a + b, 0); if (tot < 8) return null;
  let best = null;
  const corr = (prof, r) => { const xm = hist.reduce((a, b) => a + b, 0) / 12, ym = prof.reduce((a, b) => a + b, 0) / 12; let n = 0, dx = 0, dy = 0; for (let i = 0; i < 12; i++) { const x = hist[mod(i + r, 12)] - xm, y = prof[i] - ym; n += x * y; dx += x * x; dy += y * y; } return n / Math.sqrt(dx * dy || 1); };
  for (let r = 0; r < 12; r++) { [['major', KS_MAJOR], ['minor', KS_MINOR]].forEach(([q, prof]) => { const c = corr(prof, r); if (!best || c > best.c) best = { r, q, c }; }); }
  return best;
}
const Live = {
  id: 'live', nav: 'Live view', title: 'Live view',
  help: 'Play anything on your guitar. Notes light up where they live on the neck, chords get named, and Fretwave works out which key you are playing in.',
  on: false, trail: [], hist: new Array(12).fill(0),
  mount(p) {
    this.p = p; this.trail = []; this.hist = new Array(12).fill(0);
    p.innerHTML = `<div class="panel-grid">
      <div class="controls">
        <div class="live-top">
          <div class="big-note" id="lv-note" style="--c:#403b78">–</div>
          <div><div class="facts" style="margin-top:0">
            <div><b id="lv-hz">–</b><span>Pitch</span></div><div><b id="lv-chord">–</b><span>Chord heard</span></div><div><b id="lv-key">–</b><span>Key you seem to be in</span></div></div>
            <div class="history" id="lv-hist" aria-label="Recent notes"></div></div>
        </div>
        <div class="wrap"><button class="btn btn-primary btn-big" id="lv-go">${ICONS.mic}Start listening</button><button class="btn" id="lv-clear">Clear</button></div>
        <p class="muted" style="font-size:13.5px;margin:0">Tune with the Tuner first for the best results. Single notes are shown exactly; strummed chords are named from the blend of notes the mic hears.</p>
      </div>
      <div class="controls">
        <div class="row"><span class="lbl">Show</span>${seg('lv-show', [['all', 'Every place it lives'], ['near', 'Most likely spot']], this.show || 'near')}</div>
        <div class="row"><span class="lbl">Key overlay</span>${seg('lv-ov', [['auto', 'Detected key'], ['off', 'Off']], this.ov || 'auto')}</div>
        <div class="chroma" id="lv-chroma">${Array.from({ length: 12 }, (_, pc) => `<div class="cb"><i style="--c:${noteColor(pc)}"></i><span>${noteName(pc)}</span></div>`).join('')}</div>
      </div></div>`;
    this.show = this.show || 'near'; this.ov = this.ov || 'auto';
    wireSeg(p, 'lv-show', (v) => (this.show = v));
    wireSeg(p, 'lv-ov', (v) => { this.ov = v; this.drawKey(); });
    $('#lv-go', p).addEventListener('click', () => this.toggle());
    $('#lv-clear', p).addEventListener('click', () => { this.trail = []; this.hist.fill(0); this.key = null; $('#lv-hist', p).innerHTML = ''; $('#lv-key', p).textContent = '–'; Neck.clear(); });
  },
  unmount() { if (Mic.active) Mic.stop(); this.on = false; },
  async toggle() {
    if (this.on) { Mic.stop(); this.on = false; $('#lv-go', this.p).innerHTML = `${ICONS.mic}Start listening`; return; }
    try { await Mic.start((f, rms) => this.onPitch(f, rms)); Mic.chromaCb = (c) => this.onChroma(c); this.on = true; $('#lv-go', this.p).innerHTML = `${ICONS.stop}Stop listening`; } catch (e) { micError(e); }
  },
  onChroma(c) {
    $$('#lv-chroma .cb i', this.p).forEach((b, pc) => (b.style.height = c ? Math.round(6 + c[pc] * 94) + '%' : '6%'));
    if (!c) return;
    const strong = c.filter((x) => x > 0.45).length;
    if (strong >= 3) { const m = matchChord(c); if (m && m.score > 0.82) { const el = $('#lv-chord', this.p); el.textContent = noteName(m.root) + chordType(m.id).sym; el.style.color = noteColor(m.root); } }
  },
  onPitch(fr) {
    if (fr <= 0) { this._st = 0; return; }
    const mf = 69 + 12 * Math.log2(fr / 440), m = Math.round(mf);
    if (m === this._last) this._st++; else { this._st = 1; this._last = m; }
    if (this._st !== 2) return;
    const pc = m % 12;
    const n = $('#lv-note', this.p); n.textContent = noteName(pc); n.style.setProperty('--c', noteColor(pc));
    $('#lv-hz', this.p).textContent = fr.toFixed(1) + ' Hz';
    this.hist[pc] += 1;
    const cands = allCells((x) => x === m); if (!cands.length) return;
    const prev = this.trail[this.trail.length - 1];
    const pick = prev ? cands.reduce((a, b) => (Math.abs(b.f - prev.f) + Math.abs(b.s - prev.s) * 0.5 < Math.abs(a.f - prev.f) + Math.abs(a.s - prev.s) * 0.5 ? b : a)) : cands.reduce((a, b) => (b.f < a.f ? b : a));
    this.trail.push(pick); if (this.trail.length > 8) this.trail.shift();
    const h = $('#lv-hist', this.p); h.insertAdjacentHTML('beforeend', `<span class="note-chip" style="--c:${noteColor(pc)}">${noteName(pc)}</span>`); while (h.children.length > 14) h.firstChild.remove();
    const k = guessKey(this.hist); if (k && k.c > 0.55) { this.key = k; $('#lv-key', this.p).textContent = `${noteName(k.r)} ${k.q}`; }
    this.drawKey();
    if (this.show === 'all') cands.forEach((c) => Neck.noteMark(c.s, c.f, { ring: c === pick }));
    this.trail.forEach((c, i) => { const age = this.trail.length - 1 - i; Neck.noteMark(c.s, c.f, { ring: age === 0, cls: age > 2 ? 'dim' : '' }); });
    Neck.pluck(pick.s, pick.f);
  },
  drawKey() {
    Neck.clear();
    if (this.ov === 'auto' && this.key) { const iv = this.key.q === 'major' ? MAJ : [0, 2, 3, 5, 7, 8, 10]; const pcs = iv.map((x) => mod(this.key.r + x, 12)); allCells((m) => pcs.includes(m % 12)).forEach(({ s, f, pc }) => Neck.mark(s, f, { color: pc === this.key.r ? noteColor(pc) : 'rgba(241,233,218,.3)', cls: 'small dim', r: 17 })); }
  },
  onCell(s, f) { Neck.play(s, f); },
};

/* ================= Chord check + one-minute changes ================= */
const Check = {
  id: 'check', nav: 'Chord check', title: 'Chord check',
  help: 'Strum a chord and Fretwave tells you if every note rang out, and which string to fix. Then race the clock with one-minute changes.',
  root: 7, type: 'maj', mode: 'check', a: [7, 'maj'], b: [0, 'maj'],
  mount(p) {
    this.p = p; this.good = 0;
    p.innerHTML = `<div class="panel-grid">
      <div class="controls">
        <div class="row"><span class="lbl">Mode</span>${seg('cc-mode', [['check', 'Check one chord'], ['changes', 'One-minute changes'], ['name', 'Name what I play']], this.mode)}</div>
        <div id="cc-body" class="controls"></div>
      </div>
      <div class="controls">
        <div class="chroma big" id="cc-chroma">${Array.from({ length: 12 }, (_, pc) => `<div class="cb"><i style="--c:${noteColor(pc)}"></i><span>${noteName(pc)}</span></div>`).join('')}</div>
        <p class="muted" style="font-size:13.5px;margin:0">Bars show the notes the mic hears right now. Outlined bars are the notes the chord needs.</p>
      </div></div>`;
    wireSeg(p, 'cc-mode', (v) => { this.mode = v; this.stopAll(); this.renderBody(); });
    this.renderBody();
  },
  unmount() { this.stopAll(); },
  stopAll() { clearInterval(this.clock); this.running = false; if (Mic.active) Mic.stop(); },
  pcs(r, id) { return [...new Set(chordType(id).iv.map((i) => mod(r + i, 12)))]; },
  markWant(pcs) { $$('#cc-chroma .cb', this.p).forEach((b, pc) => b.classList.toggle('want', pcs.includes(pc))); },
  draw(r, id) { const v = voicingOf(r, id); Neck.clear(); if (v) drawVoicing(v, r, chordType(id).iv, { stagger: true }); return v; },
  chordPicker(id, val) { return `<div class="wrap">${seg(id + '-r', Array.from({ length: 12 }, (_, pc) => [pc, noteName(pc)]), val[0])}${seg(id + '-t', [['maj', 'Major'], ['min', 'Minor'], ['7', '7']], val[1])}</div>`; },
  renderBody() {
    const b = $('#cc-body', this.p);
    if (this.mode === 'check') {
      b.innerHTML = `<div class="row row-wide"><span class="lbl">Chord</span>${this.chordPicker('cc1', [this.root, this.type])}</div>
        <div class="verdict" id="cc-v">Strum and let it ring.</div><p class="check-why" id="cc-msg"></p>
        <div class="wrap"><button class="btn btn-primary btn-big" id="cc-go">${ICONS.mic}Listen</button><button class="btn" id="cc-hear">${ICONS.strum}Hear it</button></div>`;
      const upd = () => { this.v = this.draw(this.root, this.type); this.markWant(this.pcs(this.root, this.type)); $('#cc-v', this.p).textContent = `Strum ${noteName(this.root)}${chordType(this.type).sym} and let it ring.`; $('#cc-v', this.p).className = 'verdict'; this.good = 0; };
      wireSeg(b, 'cc1-r', (v) => { this.root = +v; upd(); }); wireSeg(b, 'cc1-t', (v) => { this.type = v; upd(); });
      $('#cc-hear', b).addEventListener('click', () => this.v && strum(this.v.frets));
      $('#cc-go', b).addEventListener('click', () => this.listen((c) => this.onCheck(c)));
      upd();
    } else if (this.mode === 'changes') {
      b.innerHTML = `<div class="row row-wide"><span class="lbl">First chord</span>${this.chordPicker('cca', this.a)}</div>
        <div class="row row-wide"><span class="lbl">Second chord</span>${this.chordPicker('ccb', this.b)}</div>
        <div class="changes"><div><b id="cc-count">0</b><span>clean changes</span></div><div><b id="cc-time">60</b><span>seconds</span></div><div><b id="cc-best">${(S.settings.bestChanges || {})[this.pairKey()] || 0}</b><span>your best</span></div></div>
        <div class="wrap"><button class="btn btn-primary btn-big" id="cc-start">${ICONS.play}Start 60 seconds</button><button class="btn" id="cc-tap">Count a change by hand</button></div>
        <p class="muted" style="font-size:13.5px;margin:0">Switch back and forth between the two chords as many times as you can. The mic counts each clean change; or tap the button if it’s noisy.</p>`;
      wireSeg(b, 'cca-r', (v) => { this.a[0] = +v; this.showPair(); }); wireSeg(b, 'cca-t', (v) => { this.a[1] = v; this.showPair(); });
      wireSeg(b, 'ccb-r', (v) => { this.b[0] = +v; this.showPair(); }); wireSeg(b, 'ccb-t', (v) => { this.b[1] = v; this.showPair(); });
      $('#cc-start', b).addEventListener('click', () => this.startChanges());
      $('#cc-tap', b).addEventListener('click', () => this.countChange());
      this.showPair();
    } else {
      b.innerHTML = `<div class="jam-chord" id="cc-name" style="font-size:96px">–</div><p class="muted" id="cc-conf"></p>
        <div class="wrap"><button class="btn btn-primary btn-big" id="cc-go">${ICONS.mic}Listen</button></div>`;
      this.markWant([]); Neck.clear();
      $('#cc-go', b).addEventListener('click', () => this.listen((c) => this.onName(c)));
    }
  },
  pairKey() { return this.a.join('') + '-' + this.b.join(''); },
  showPair() {
    Neck.clear(); const va = voicingOf(this.a[0], this.a[1]), vb = voicingOf(this.b[0], this.b[1]);
    if (va) drawVoicing(va, this.a[0], chordType(this.a[1]).iv);
    if (vb) vb.frets.forEach((f, s) => { if (f >= 0 && !Neck.has(s, f)) Neck.mark(s, f, { label: '2', color: 'rgba(241,233,218,.25)', textColor: '#f1e9da', cls: 'seqhint' }); });
    this.markWant(this.pcs(...this.a));
    const best = $('#cc-best', this.p); if (best) best.textContent = (S.settings.bestChanges || {})[this.pairKey()] || 0;
  },
  async listen(fn) {
    const btn = $('#cc-go', this.p);
    if (Mic.active) { Mic.stop(); if (btn) btn.innerHTML = `${ICONS.mic}Listen`; return; }
    try { await Mic.start(() => {}); Mic.chromaCb = (c) => { this.bars(c); fn(c); }; if (btn) btn.innerHTML = `${ICONS.stop}Stop`; } catch (e) { micError(e); }
  },
  bars(c) { $$('#cc-chroma .cb i', this.p).forEach((b, pc) => (b.style.height = c ? Math.round(6 + c[pc] * 94) + '%' : '6%')); },
  onCheck(c) {
    if (!c) return;
    const pcs = this.pcs(this.root, this.type), r = checkChord(c, pcs), v = $('#cc-v', this.p), msg = $('#cc-msg', this.p);
    if (r.ok) { this.good++; if (this.good === 4) { v.textContent = 'Clean! Every note rang.'; v.className = 'verdict good'; msg.textContent = ''; Sound.play(84, 0, 0.2); } }
    else {
      this.good = 0;
      if (r.missing.length && this.v) {
        const strs = this.v.frets.map((f, s) => ({ f, s })).filter((x) => x.f >= 0 && r.missing.includes(midiAt(x.s, x.f) % 12));
        v.textContent = `Missing ${r.missing.map(noteName).join(', ')}`; v.className = 'verdict bad';
        msg.textContent = strs.length ? `Check the ${strs.map((x) => ordinal(stringNumber(x.s))).join(' and ')} string: press right behind the fret and keep other fingers off it.` : '';
        strs.forEach((x) => Neck.pluck(x.s, x.f, '#ff6b7a'));
      } else if (r.extra.length) { v.textContent = `Extra note: ${r.extra.map(noteName).join(', ')}. Mute strings marked ×.`; v.className = 'verdict bad'; }
    }
  },
  onName(c) {
    if (!c) return; const m = matchChord(c); if (!m || m.score < 0.8) return;
    const el = $('#cc-name', this.p); el.textContent = noteName(m.root) + chordType(m.id).sym; el.style.color = noteColor(m.root);
    $('#cc-conf', this.p).textContent = `${chordType(m.id).name}, ${Math.round(m.score * 100)}% match`;
    this.markWant(this.pcs(m.root, m.id));
  },
  async startChanges() {
    if (this.running) { this.endChanges(); return; }
    this.count = 0; this.left = 60; this.side = 'a'; this.running = true; this.good = 0;
    $('#cc-count', this.p).textContent = 0; $('#cc-start', this.p).innerHTML = `${ICONS.stop}Stop`;
    try { await Mic.start(() => {}); Mic.chromaCb = (c) => { this.bars(c); this.onChange(c); }; } catch (e) { /* manual counting still works */ }
    this.clock = setInterval(() => { this.left--; $('#cc-time', this.p).textContent = this.left; if (this.left <= 0) this.endChanges(); }, 1000);
  },
  onChange(c) {
    if (!c || !this.running) return;
    const want = this.side === 'a' ? this.b : this.a; // waiting for the other chord
    const r = checkChord(c, this.pcs(want[0], want[1]));
    if (r.ok) { this.good++; if (this.good >= 3) { this.good = 0; this.countChange(); } } else this.good = 0;
  },
  countChange() {
    if (!this.running) { toast('Press Start first.'); return; }
    this.count++; this.side = this.side === 'a' ? 'b' : 'a'; $('#cc-count', this.p).textContent = this.count;
    this.markWant(this.side === 'a' ? this.pcs(...this.b) : this.pcs(...this.a));
  },
  endChanges() {
    clearInterval(this.clock); this.running = false; if (Mic.active) Mic.stop();
    const k = this.pairKey(); S.settings.bestChanges = S.settings.bestChanges || {};
    const prev = S.settings.bestChanges[k] || 0;
    if (this.count > prev) { S.settings.bestChanges[k] = this.count; persist(); toast(`New best: ${this.count} changes!`); }
    $('#cc-best', this.p).textContent = S.settings.bestChanges[k] || 0;
    $('#cc-start', this.p).innerHTML = `${ICONS.play}Start 60 seconds`;
  },
  onCell(s, f) { Neck.play(s, f); },
};

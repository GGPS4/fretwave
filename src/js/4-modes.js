/* ================= Chords ================= */
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
const DIATONIC = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];
const NUMERALS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const PROGRESSIONS = { 'I V vi IV': [0, 4, 5, 3], 'I vi IV V': [0, 5, 3, 4], 'ii V I': [1, 4, 0], 'I IV V IV': [0, 3, 4, 3], 'vi IV I V': [5, 3, 0, 4] };
const chordType = (id) => CHORD_TYPES.find((c) => c.id === id) || CHORD_TYPES[0];
function strum(frets, opts = {}) {
  const order = frets.map((f, s) => ({ f, s })).filter((x) => x.f >= 0);
  if (opts.up) order.reverse();
  const gap = opts.arp ? 0.24 : opts.up ? 0.022 : 0.032;
  order.forEach((x, i) => Neck.play(x.s, x.f, (opts.at || 0) + i * gap, (opts.up ? 0.32 : 0.42) * (opts.arp ? 1.25 : 1)));
}
function drawVoicing(v, rootPc, iv, extra = {}) {
  v.frets.forEach((f, s) => {
    if (f < 0) { Neck.mark(s, 0, { label: '×', muted: true, cls: 'muted' }); return; }
    const semi = mod(strings()[s] + f - rootPc, 12);
    const [lab] = intervalInfo(semi, iv);
    Neck.mark(s, f, { label: lab, color: intervalColor(semi, iv), ring: semi === 0, ringColor: '#fff', delay: extra.stagger ? s * 40 : 0 });
  });
}
const Chords = {
  id: 'chords', nav: 'Chords', title: 'Chord explorer',
  help: 'Pick a root and a chord type. See the shapes, hear them strummed, and spot every chord tone by its color across the whole neck.',
  root: 0, type: 'maj', vi: 0, showAll: true, prog: 'I V vi IV', bpm: 90, loop: null,
  mount(p) {
    this.p = p; this.vi = 0;
    p.innerHTML = `<div class="panel-grid">
      <div class="controls">
        <div><h2 class="chord-name" id="ch-name"></h2><div class="tones" id="ch-tones"></div></div>
        <div class="voicings" id="ch-voicings"></div>
        <div class="wrap">
          <button class="btn btn-primary" id="ch-strum">${ICONS.strum}Strum</button>
          <button class="btn" id="ch-arp">${ICONS.play}One string at a time</button>
          <label class="switch" style="margin-left:6px"><input type="checkbox" id="ch-all" ${this.showAll ? 'checked' : ''}>Show chord tones on the whole neck</label>
        </div>
        <div class="wrap"><label class="switch"><input type="checkbox" id="ch-hand" ${S.settings.hand !== false ? 'checked' : ''}>Show my fretting hand</label><label class="switch"><input type="checkbox" id="ch-caged" ${this.caged ? 'checked' : ''}>CAGED map (major chords)</label><span id="ch-cagedbtns" class="wrap"></span></div>
        <div class="legend" id="ch-legend"></div>
      </div>
      <div class="controls">
        <div class="row row-wide"><span class="lbl">Root</span><div class="wrap" id="ch-roots">${noteChips(this.root)}</div></div>
        <div class="row row-wide"><span class="lbl">Chord type</span><div class="wrap" id="ch-types">${CHORD_TYPES.map((c) => `<button type="button" class="chip" data-t="${c.id}" aria-pressed="${c.id === this.type}">${c.name}</button>`).join('')}</div></div>
        <div class="surface" style="padding:18px">
          <div class="row row-wide" style="margin-bottom:12px"><span class="lbl">Hear it in a progression, key of <b id="ch-key"></b> major</span>${seg('ch-prog', Object.keys(PROGRESSIONS).map((k) => [k, k.replace(/ /g, ' – ')]), this.prog)}</div>
          <div class="prog" id="ch-cards"></div>
          <div class="wrap" style="margin-top:14px"><button class="btn" id="ch-loop">${ICONS.play}Play the progression</button>
          <div class="slider"><input type="range" min="60" max="160" value="${this.bpm}" id="ch-bpm" aria-label="Tempo"><output id="ch-bpm-o">${this.bpm} bpm</output></div></div>
        </div>
      </div></div>`;
    $('#ch-roots', p).addEventListener('click', (e) => { const b = e.target.closest('.note-chip'); if (!b) return; this.root = +b.dataset.pc; $$('#ch-roots .note-chip', p).forEach((x) => x.setAttribute('aria-pressed', x === b)); this.vi = 0; this.update(true); });
    $('#ch-types', p).addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; this.type = b.dataset.t; $$('#ch-types .chip', p).forEach((x) => x.setAttribute('aria-pressed', x === b)); this.vi = 0; this.update(true); });
    $('#ch-voicings', p).addEventListener('click', (e) => { const b = e.target.closest('.voicing'); if (!b) return; this.vi = +b.dataset.i; this.update(true); });
    $('#ch-strum', p).addEventListener('click', () => this.v && strum(this.v.frets));
    $('#ch-arp', p).addEventListener('click', () => this.v && strum(this.v.frets, { arp: true }));
    $('#ch-all', p).addEventListener('change', (e) => { this.showAll = e.target.checked; this.draw(); });
    $('#ch-hand', p).addEventListener('change', (e) => { S.settings.hand = e.target.checked; persist(); this.draw(); });
    $('#ch-caged', p).addEventListener('change', (e) => { this.caged = e.target.checked; if (this.caged && this.type !== 'maj') { this.type = 'maj'; $$('#ch-types .chip', p).forEach((x) => x.setAttribute('aria-pressed', x.dataset.t === 'maj')); this.update(false); } else this.draw(); });
    wireSeg(p, 'ch-prog', (v) => { this.prog = v; this.stopLoop(); this.renderProg(); });
    $('#ch-loop', p).addEventListener('click', () => (this.loop ? this.stopLoop() : this.startLoop()));
    $('#ch-bpm', p).addEventListener('input', (e) => { this.bpm = +e.target.value; $('#ch-bpm-o', p).textContent = this.bpm + ' bpm'; });
    this.update(false);
  },
  unmount() { this.stopLoop(); },
  update(sound) {
    const ct = chordType(this.type);
    this.voicings = findVoicings(this.root, ct.iv, Math.min(15, S.settings.frets));
    this.v = this.voicings[this.vi] || this.voicings[0];
    $('#ch-name', this.p).innerHTML = `<span style="color:${noteColor(this.root)}">${esc(noteName(this.root))}</span>${esc(ct.sym)}`;
    $('#ch-tones', this.p).innerHTML = ct.iv.map((iv) => {
      const [lab] = intervalInfo(iv, ct.iv);
      return `<span class="tone"><i style="background:${intervalColor(iv, ct.iv)}">${lab}</i><b>${esc(noteName(this.root + iv))}</b></span>`;
    }).join('');
    $('#ch-voicings', this.p).innerHTML = this.voicings.length ? this.voicings.map((v, i) =>
      `<button type="button" class="voicing" data-i="${i}" aria-pressed="${v === this.v}" aria-label="Shape ${i + 1}">${chordDiagram(v, this.root, ct.iv)}<span>${v.base <= 1 ? 'Open position' : 'Around fret ' + v.base}</span></button>`).join('')
      : '<p class="empty">No comfortable shape for this chord on this tuning. The neck still shows every chord tone.</p>';
    const degs = [...new Set(ct.iv.map((iv) => intervalInfo(iv, ct.iv)))];
    $('#ch-legend', this.p).innerHTML = degs.map(([lab, d]) => `<span><i style="background:${DEGREE_COLORS[d]}"></i>${lab === 'R' ? 'Root' : lab}</span>`).join('') + '<span>Tap any dot on the neck to hear it</span>';
    $('#ch-key', this.p).textContent = noteName(this.root);
    this.renderProg();
    this.draw();
    if (sound && this.v) strum(this.v.frets);
    if (this.v) Neck.scrollTo(Math.max(0, this.v.base + 1));
  },
  draw(v = this.v, root = this.root, iv = chordType(this.type).iv) {
    const cb = this.p && $('#ch-cagedbtns', this.p); if (cb) cb.innerHTML = '';
    if (this.caged && this.type === 'maj' && root === this.root && v === this.v) {
      const shapes = Neck.caged(root);
      if (cb && shapes.length) { cb.innerHTML = shapes.filter((sh) => sh.hi <= S.settings.frets).map((sh) => `<button class="chip" data-sh="${sh.name}" style="border-color:${sh.color}">${sh.name} shape</button>`).join(''); $$('[data-sh]', cb).forEach((b) => b.addEventListener('click', () => { const sh = shapes.find((x) => x.name === b.dataset.sh); Neck.caged(root, { only: sh.name }); strum(sh.frets); Neck.scrollTo(sh.lo + 1); })); }
      Neck.handOff(); return;
    }
    Neck.clear();
    if (this.showAll) {
      const pcs = iv.map((i) => mod(root + i, 12));
      allCells((m) => pcs.includes(m % 12)).forEach(({ s, f, midi }) => {
        const semi = mod(midi - root, 12);
        Neck.mark(s, f, { label: intervalInfo(semi, iv)[0], color: intervalColor(semi, iv), cls: 'ghost' });
      });
    }
    if (v) drawVoicing(v, root, iv, { stagger: true });
    if (v && S.settings.hand !== false && v.frets.some((f) => f > 0)) Neck.hand(v.frets); else Neck.handOff();
  },
  renderProg() {
    const box = $('#ch-cards', this.p); if (!box) return;
    box.innerHTML = PROGRESSIONS[this.prog].map((d, i) => {
      const pc = mod(this.root + MAJOR_STEPS[d], 12), t = chordType(DIATONIC[d]);
      return `<button type="button" class="prog-card" data-i="${i}"><small>${NUMERALS[d]}</small><b style="color:${noteColor(pc)}">${esc(noteName(pc))}${esc(t.sym)}</b></button>`;
    }).join('');
    $$('.prog-card', box).forEach((b) => b.addEventListener('click', () => this.playStep(+b.dataset.i)));
  },
  playStep(i, at = 0) {
    const d = PROGRESSIONS[this.prog][i]; const pc = mod(this.root + MAJOR_STEPS[d], 12); const t = chordType(DIATONIC[d]);
    const v = findVoicings(pc, t.iv, 12)[0]; if (!v) return;
    $$('#ch-cards .prog-card', this.p).forEach((b) => b.classList.toggle('on', +b.dataset.i === i));
    this.draw(v, pc, t.iv);
    strum(v.frets, { at });
    return v;
  },
  startLoop() {
    Sound.ensure();
    const btn = $('#ch-loop', this.p); btn.innerHTML = `${ICONS.stop}Stop`;
    let i = 0;
    const step = () => {
      const beat = 60 / this.bpm;
      const v = this.playStep(i);
      if (v) { strum(v.frets, { at: beat, up: false }); strum(v.frets, { at: beat * 1.5, up: true }); }
      i = (i + 1) % PROGRESSIONS[this.prog].length;
      this.loop = setTimeout(step, beat * 2 * 1000);
    };
    step();
  },
  stopLoop() {
    clearTimeout(this.loop); this.loop = null;
    const btn = this.p && $('#ch-loop', this.p); if (btn) btn.innerHTML = `${ICONS.play}Play the progression`;
    $$('.prog-card', this.p || document).forEach((b) => b.classList.remove('on'));
  },
  onCell(s, f) { Neck.play(s, f); },
  explain(s, f) { const t = chordType(this.type); return roleExplain(s, f, this.root, t.iv, `${noteName(this.root)}${t.sym}`); },
  onKey(e) { if (e.code === 'Space' && this.v) { e.preventDefault(); strum(this.v.frets); } },
};

/* ================= Scales ================= */
const Scales = {
  id: 'scales', nav: 'Scales', title: 'Scale map',
  help: 'Every scale tone is colored by its job in the scale. Pick a position to zoom into one hand shape, then press play and follow the lights.',
  root: 9, scale: 'minpent', pos: 1, bpm: 120, labels: 'role', drone: false, playing: null, view: 'map',
  sc() { return SCALES.find((x) => x.id === this.scale) || SCALES[0]; },
  mount(p) {
    p.innerHTML = `<div class="row view-row"><span class="lbl">View</span>${seg('sc-view', [['map', 'Scale map'], ['fit', 'What fits over a chord?']], this.view)}</div><div id="sc-body"></div>`;
    wireSeg(p, 'sc-view', (v) => { this.stop(); Sound.droneOff(); this.drone = false; this.view = v; this.mount(p); });
    const body = $('#sc-body', p);
    if (this.view === 'fit') { this.p = body; ChordFit.mount(body); return; }
    this.mountMap(body);
  },
  explain(s, f) { if (this.view === 'fit') return ChordFit.explain(s, f); const sc = this.sc(); return roleExplain(s, f, this.root, sc.iv, `${noteName(this.root)} ${sc.name.toLowerCase()}`); },
  mountMap(p) {
    this.p = p;
    p.innerHTML = `<div class="panel-grid">
      <div class="controls">
        <div><h2 class="chord-name" id="sc-name" style="font-size:clamp(40px,5vw,64px)"></h2><p class="muted" id="sc-feel" style="margin:6px 0 0"></p><div class="tones" id="sc-tones"></div></div>
        <div class="row"><span class="lbl">Position</span><div id="sc-pos"></div></div>
        <div class="wrap">
          <button class="btn btn-primary" id="sc-play">${ICONS.play}Play this shape</button>
          <div class="slider"><input type="range" min="50" max="220" value="${this.bpm}" id="sc-bpm" aria-label="Tempo"><output id="sc-bpm-o">${this.bpm} bpm</output></div>
        </div>
        <div class="wrap" style="gap:22px">
          <label class="switch"><input type="checkbox" id="sc-drone" ${this.drone ? 'checked' : ''}>Root drone (hear the home note)</label>
          <label class="switch"><input type="checkbox" id="sc-train" ${this.train ? 'checked' : ''}>Loop and speed up (+4 bpm each time)</label>
        </div>
        <div class="row"><span class="lbl">Dots show</span>${seg('sc-lab', [['role', 'Role in the scale'], ['name', 'Note names']], this.labels)}</div>
      </div>
      <div class="controls">
        <div class="row row-wide"><span class="lbl">Root</span><div class="wrap" id="sc-roots">${noteChips(this.root)}</div></div>
        <div class="row row-wide"><span class="lbl">Scale</span><div class="wrap" id="sc-types">${SCALES.map((c) => `<button type="button" class="chip" data-t="${c.id}" aria-pressed="${c.id === this.scale}">${c.name}</button>`).join('')}</div></div>
      </div></div>`;
    $('#sc-roots', p).addEventListener('click', (e) => { const b = e.target.closest('.note-chip'); if (!b) return; this.root = +b.dataset.pc; $$('#sc-roots .note-chip', p).forEach((x) => x.setAttribute('aria-pressed', x === b)); this.update(); });
    $('#sc-types', p).addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; this.scale = b.dataset.t; $$('#sc-types .chip', p).forEach((x) => x.setAttribute('aria-pressed', x === b)); this.pos = 1; this.update(); });
    $('#sc-play', p).addEventListener('click', () => (this.playing ? this.stop() : this.play()));
    $('#sc-bpm', p).addEventListener('input', (e) => { this.bpm = +e.target.value; $('#sc-bpm-o', p).textContent = this.bpm + ' bpm'; });
    $('#sc-train', p).addEventListener('change', (e) => { this.train = e.target.checked; });
    $('#sc-drone', p).addEventListener('change', (e) => { this.drone = e.target.checked; this.drone ? Sound.droneOn(48 + this.root) : Sound.droneOff(); });
    wireSeg(p, 'sc-lab', (v) => { this.labels = v; this.draw(); });
    this.update();
  },
  unmount() { this.stop(); Sound.droneOff(); this.drone = false; },
  positions() {
    const sc = this.sc(), tun = strings(), low = tun[0];
    const pcs = sc.iv.map((i) => mod(this.root + i, 12));
    const anchors = [];
    for (let f = 0; f < 12; f++) if (pcs.includes((low + f) % 12)) anchors.push(f);
    const blue = this.scale === 'blues' ? mod(this.root + 6, 12) : -1;
    const nps = sc.iv.length >= 7 ? 3 : 2;
    return anchors.map((a) => {
      // ascending scale tones from the anchor
      const seq = []; let m = low + a;
      while (seq.length < 60) { if (pcs.includes(m % 12)) seq.push(m); m++; }
      const cells = []; let k = 0;
      for (let s = 0; s < tun.length; s++) {
        let count = 0;
        while (k < seq.length) {
          const mm = seq[k]; const isBlue = mm % 12 === blue;
          const nextOpen = tun[s + 1];
          if (count >= nps && !isBlue && (s === tun.length - 1 || mm >= nextOpen)) break;
          if (mm < tun[s]) { k++; continue; }
          cells.push({ s, f: mm - tun[s], midi: mm }); k++; if (!isBlue) count++;
          if (s === tun.length - 1 && count >= nps) { if (k < seq.length && seq[k] % 12 === blue) { cells.push({ s, f: seq[k] - tun[s], midi: seq[k] }); } break; }
        }
      }
      return { anchor: a, cells: cells.filter((c) => c.f <= S.settings.frets) };
    });
  },
  update() {
    const sc = this.sc();
    $('#sc-name', this.p).innerHTML = `<span style="color:${noteColor(this.root)}">${esc(noteName(this.root))}</span> ${esc(sc.name.toLowerCase())}`;
    $('#sc-feel', this.p).textContent = sc.feel;
    $('#sc-tones', this.p).innerHTML = sc.iv.map((iv) => { const [lab] = intervalInfo(iv, sc.iv); return `<span class="tone"><i style="background:${intervalColor(iv, sc.iv)}">${lab}</i><b>${esc(noteName(this.root + iv))}</b></span>`; }).join('');
    this.shapes = this.positions();
    if (this.pos > this.shapes.length) this.pos = 1;
    $('#sc-pos', this.p).innerHTML = seg('sc-posseg', [['0', 'Whole neck'], ...this.shapes.map((sh, i) => [String(i + 1), String(i + 1)])], this.pos);
    wireSeg(this.p, 'sc-posseg', (v) => { this.pos = +v; this.stop(); this.draw(); const sh = this.shapes[this.pos - 1]; if (sh) Neck.scrollTo(sh.anchor + 2); });
    if (this.drone) Sound.droneOn(48 + this.root);
    this.stop(); this.draw();
  },
  draw() {
    Neck.clear();
    const sc = this.sc();
    const pcs = sc.iv.map((i) => mod(this.root + i, 12));
    const shape = this.pos ? this.shapes[this.pos - 1] : null;
    const inShape = (s, f) => !shape || shape.cells.some((c) => c.s === s && c.f === f);
    allCells((m) => pcs.includes(m % 12)).forEach(({ s, f, midi }) => {
      const semi = mod(midi - this.root, 12);
      const role = this.labels === 'role';
      Neck.mark(s, f, {
        label: role ? intervalInfo(semi, sc.iv)[0] : noteName(midi % 12),
        color: role ? intervalColor(semi, sc.iv) : noteColor(midi % 12),
        ring: semi === 0 && inShape(s, f), ringColor: '#fff',
        cls: inShape(s, f) ? '' : 'ghost', delay: shape && inShape(s, f) ? s * 30 : 0,
      });
    });
  },
  play() {
    Sound.ensure();
    const shape = this.shapes[(this.pos || 1) - 1]; if (!shape) return;
    const up = shape.cells.slice().sort((a, b) => a.midi - b.midi || a.s - b.s);
    const seq = up.concat(up.slice(0, -1).reverse());
    const step = 60 / this.bpm / 2; // eighth notes
    seq.forEach((c, i) => Neck.play(c.s, c.f, i * step, 0.5));
    const btn = $('#sc-play', this.p); btn.innerHTML = `${ICONS.stop}Stop`;
    this.playing = setTimeout(() => {
      this.playing = null;
      if (this.train && current === this) { this.bpm = Math.min(240, this.bpm + 4); const sl = $('#sc-bpm', this.p); if (sl) { sl.value = this.bpm; $('#sc-bpm-o', this.p).textContent = this.bpm + ' bpm'; } this.play(); return; }
      this.stop();
    }, seq.length * step * 1000 + 300);
  },
  stop() {
    if (this.playing) { Sound.stopAll(); Neck.cancelPending(); }
    clearTimeout(this.playing); this.playing = null;
    const btn = this.p && $('#sc-play', this.p); if (btn) btn.innerHTML = `${ICONS.play}Play this shape`;
  },
  onCell(s, f) { Neck.play(s, f); },
  onKey(e) { if (this.view !== 'map') return; if (e.code === 'Space') { e.preventDefault(); this.playing ? this.stop() : this.play(); } },
};

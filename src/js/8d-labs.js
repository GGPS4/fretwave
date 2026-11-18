/* ================= What each note is doing: shared explanations ================= */
const ROLE_TEXT = {
  R: 'the root: the home note the chord or scale is named after.',
  '♭2': 'a half step above the root: dark and tense, the Phrygian flavour.',
  '2': 'a whole step above the root: adds an open, shimmering colour.',
  '9': 'the 9th (a 2nd an octave up): adds shimmer without changing major or minor.',
  '♭3': 'the minor 3rd: the single note that makes it sound minor.',
  '3': 'the major 3rd: the single note that makes it sound major and bright.',
  '4': 'the 4th: a strong note that likes to fall to the 3rd.',
  '♯4': 'the raised 4th: the floating, dreamy Lydian sound.',
  '♭5': 'the ♭5: the gritty blue note, or the tense diminished 5th.',
  '5': 'the 5th: strong and stable. It adds power without changing the mood.',
  '♯5': 'the raised 5th: augmented, restless and eerie.',
  '♭6': 'the ♭6: dark and dramatic.',
  '6': 'the 6th: sweet and bright. It gives Dorian its hopeful sound.',
  '♭7': 'the ♭7: bluesy tension, the sound of dominant 7 chords and Mixolydian.',
  '7': 'the major 7th: a half step below the root, it leans strongly back home.',
};
const roleText = (lab) => ROLE_TEXT[lab] || 'a colour note.';
function landmarkText(s, f) {
  const marks = [0, 3, 5, 7, 9, 12, 15, 17, 19, 21, 24].filter((x) => x <= S.settings.frets);
  const near = marks.reduce((a, b) => (Math.abs(b - f) < Math.abs(a - f) ? b : a));
  if (near === f) return f === 0 ? 'It is the open string.' : `It sits right on the ${ordinal(f)}-fret dot, an easy landmark.`;
  const d = f - near;
  return `Find it from the ${near === 0 ? 'open string' : ordinal(near) + '-fret dot'} (${noteName(midiAt(s, near) % 12)}): ${Math.abs(d)} fret${Math.abs(d) > 1 ? 's' : ''} ${d > 0 ? 'higher' : 'lower'}.`;
}
function genericExplain(s, f) {
  const m = midiAt(s, f), pc = m % 12; const twins = allCells((x) => x === m).filter((c) => !(c.s === s && c.f === f));
  return { title: `${noteName(pc)}${octaveOf(m)}`, pc, text: `${ordinal(stringNumber(s))} string, ${f ? 'fret ' + f : 'open'}. ${landmarkText(s, f)} ${twins.length ? `The same pitch also lives at ${twins.slice(0, 3).map((c) => `${ordinal(stringNumber(c.s))} string fret ${c.f}`).join(', ')}.` : ''}` };
}
function roleExplain(s, f, root, ctxIv, ctxName) {
  const pc = midiAt(s, f) % 12, semi = mod(pc - root, 12);
  const inSet = ctxIv.map((x) => mod(x, 12)).includes(semi);
  const lab = intervalInfo(semi, ctxIv)[0];
  return { title: noteName(pc), pc, text: inSet ? `${noteName(pc)} is ${lab === 'R' ? '' : 'the ' + lab + ' of ' + ctxName + ': '}${roleText(lab)} ${lab !== 'R' ? `It is ${semi} half step${semi > 1 ? 's' : ''} above ${noteName(root)}.` : ''}` : `${noteName(pc)} is not part of ${ctxName}. Against ${noteName(root)} it would be the ${lab}, ${roleText(lab)}` };
}
const Why = {
  on: false,
  toggle() { this.on = !this.on; $('#btn-why').setAttribute('aria-pressed', this.on); if (!this.on) this.hide(); else toast('Tap any spot on the neck to see why it’s there.', 2200); },
  show(s, f) {
    let r = null;
    if (Player.active) r = genericExplain(s, f);
    else if (current && current.explain) r = current.explain(s, f);
    if (r === false) { toast('“Why?” is paused during a round so it doesn’t give answers away.'); return; }
    if (!r) r = genericExplain(s, f);
    Neck.pluck(s, f); Sound.play(midiAt(s, f), 0, 0.45);
    let card = $('#why-card');
    if (!card) { card = document.createElement('div'); card.id = 'why-card'; card.className = 'why-card'; $('#stage').appendChild(card); }
    card.innerHTML = `<span class="why-dot" style="background:${noteColor(r.pc ?? midiAt(s, f) % 12)}">${esc(r.title)}</span><p>${r.text}</p><button class="icon-btn" aria-label="Close" id="why-x">${ICONS.close}</button>`;
    $('#why-x', card).addEventListener('click', () => this.hide());
    card.hidden = false;
    if (S.settings.narrate !== false) Voice.sayLong(r.text.replace(/<[^>]+>/g, '').replace(/♯/g, ' sharp').replace(/♭/g, ' flat'));
  },
  hide() { const c = $('#why-card'); if (c) c.hidden = true; },
};

/* ================= Interval constellation ================= */
const IV_GROUPS = { all: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], thirds: [3, 4], fifths: [5, 7], octaves: [12], seconds: [1, 2, 10, 11], sixths: [8, 9] };
const IntervalLab = {
  root: null, group: 'all',
  mount(box, host) {
    this.host = host; this.box = box;
    box.innerHTML = `<div class="panel-grid">
      <div class="controls">
        <div class="row"><span class="lbl">Show</span>${seg('il-g', [['all', 'Everything'], ['thirds', '3rds'], ['fifths', '4ths and 5ths'], ['octaves', 'Octaves'], ['sixths', '6ths'], ['seconds', '2nds and 7ths']], this.group)}</div>
        <div class="surface info" id="il-info"></div>
        <div class="wrap"><button class="btn" id="il-run" ${this.root ? '' : 'disabled'}>${ICONS.play}Play every interval up from the root</button></div>
      </div>
      <div class="controls"><div class="legend" id="il-legend"></div><p class="muted" style="font-size:13.5px;margin:0">Each interval keeps the same shape wherever you start, except across the B string, where shapes stretch by one fret. Learn the shapes once and you can build any chord or scale from them.</p></div></div>`;
    wireSeg(box, 'il-g', (v) => { this.group = v; this.draw(); });
    $('#il-run', box).addEventListener('click', () => this.run());
    $('#il-legend', box).innerHTML = INTERVALS.map((iv) => `<span><i style="background:${intervalColor(iv.semi % 12 || 0, [])}"></i>${iv.short} = ${iv.semi}</span>`).join('');
    this.draw();
  },
  cells() {
    const r = this.root; if (!r) return [];
    const want = IV_GROUPS[this.group];
    const rm = midiAt(r.s, r.f);
    return allCells((m, s, f) => Math.abs(f - r.f) <= 5 && want.includes(m - rm) && !(s === r.s && f === r.f));
  },
  draw() {
    Neck.clear();
    const info = $('#il-info', this.box);
    if (!this.root) { info.innerHTML = '<div><h2>Tap any fret to make it the root</h2><p>Every interval above it lights up as a shape you can see and hear.</p></div>'; return; }
    const r = this.root, rm = midiAt(r.s, r.f);
    Neck.noteMark(r.s, r.f, { label: 'R', ring: true, ringColor: '#fff', color: noteColor(rm % 12) });
    this.cells().forEach((c) => { const iv = INTERVALS.find((x) => x.semi === c.midi - rm); Neck.mark(c.s, c.f, { label: iv.short, color: intervalColor(iv.semi % 12, []), fontSize: 12 }); });
    info.innerHTML = `<div class="big-note" style="--c:${noteColor(rm % 12)}">${noteName(rm % 12)}</div><div><h2>Root: ${noteName(rm % 12)}${octaveOf(rm)}</h2><p>Tap any coloured dot to hear the interval and see its shape.</p></div>`;
  },
  onCell(s, f) {
    const r = this.root; const m = midiAt(s, f);
    if (r) {
      const rm = midiAt(r.s, r.f); const iv = INTERVALS.find((x) => x.semi === m - rm);
      if (iv && Neck.has(s, f) && !(s === r.s && f === r.f)) {
        this.draw(); Neck.link(r, { s, f }, iv.short, intervalColor(iv.semi % 12, []));
        Neck.play(r.s, r.f, 0); Neck.play(s, f, 0.55); setTimeout(() => Sound.play(rm, 0, 0.4), 1300); setTimeout(() => Sound.play(m, 0, 0.4), 1310);
        $('#il-info', this.box).innerHTML = `<div class="big-note" style="--c:${intervalColor(iv.semi % 12, [])}">${iv.short}</div><div><h2>${iv.name}</h2><p>${iv.semi} half steps: ${noteName(rm % 12)} up to ${noteName(m % 12)}. Think “${iv.song}”. ${s === r.s ? 'On one string it’s ' + iv.semi + ' frets.' : `Shape: ${Math.abs(s - r.s)} string${Math.abs(s - r.s) > 1 ? 's' : ''} ${s > r.s ? 'up' : 'down'}, ${f - r.f === 0 ? 'same fret' : Math.abs(f - r.f) + ' fret' + (Math.abs(f - r.f) > 1 ? 's' : '') + (f > r.f ? ' higher' : ' lower')}.`}</p></div>`;
        return;
      }
    }
    this.root = { s, f }; Neck.play(s, f); this.draw(); const b = $('#il-run', this.box); if (b) b.disabled = false;
  },
  run() {
    const r = this.root; if (!r) return; const rm = midiAt(r.s, r.f);
    INTERVALS.forEach((iv, i) => { const c = allCells((m, s, f) => m === rm + iv.semi && Math.abs(f - r.f) <= 5)[0]; setTimeout(() => { if (!c) return; this.draw(); Neck.link(r, c, iv.short, intervalColor(iv.semi % 12, [])); Neck.play(r.s, r.f, 0, 0.4); Neck.play(c.s, c.f, 0.3, 0.45); }, i * 1100); });
  },
  explain(s, f) {
    const r = this.root; if (!r) return null;
    const rm = midiAt(r.s, r.f), m = midiAt(s, f), iv = INTERVALS.find((x) => x.semi === m - rm);
    return iv ? { title: iv.short, pc: m % 12, text: `${noteName(m % 12)} is a ${iv.name.toLowerCase()} (${iv.semi} half steps) above ${noteName(rm % 12)}. ${roleText(intervalInfo(iv.semi, [])[0])}` } : null;
  },
};

/* ================= Harmonics and string physics ================= */
function harmonicNodes() {
  const out = []; const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  for (let n = 2; n <= 6; n++) for (let k = 1; k < n; k++) { if (gcd(k, n) !== 1) continue; const fret = -12 * Math.log2(1 - k / n); if (fret <= S.settings.frets + 0.05) out.push({ n, k, fret }); }
  return out;
}
const HARM_NAMES = { 2: 'octave', 3: 'octave + 5th', 4: '2 octaves', 5: '2 octaves + major 3rd', 6: '2 octaves + 5th' };
Sound.harmonic = function (freq, when = 0) {
  if (!S.settings.sound) return; const ctx = this.ensure(); if (!ctx) return; const t = ctx.currentTime + when;
  [[1, 0.5], [2, 0.08], [3, 0.03]].forEach(([mul, amp]) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = freq * mul; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(amp, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6 / mul); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 2.7); });
  this.lastPlay = performance.now() + when * 1000;
};
const HarmonicLab = {
  sel: { n: 2, k: 1 }, raf: 0,
  mount(box) {
    this.box = box;
    box.innerHTML = `<div class="panel-grid">
      <div class="controls">
        <svg class="wave" id="hm-wave" viewBox="0 0 600 150" aria-label="Vibrating string"></svg>
        <div class="surface info" id="hm-info"></div>
        <div class="wrap"><button class="btn" id="hm-cmp">${ICONS.play}Fretted note vs harmonic</button><button class="btn" id="hm-all">${ICONS.play}Play the harmonic series</button></div>
      </div>
      <div class="controls">
        <div class="row row-wide"><span class="lbl">Where the harmonics live (tap a dot on the neck, or here)</span><div class="harm-table" id="hm-table"></div></div>
        <div class="surface"><b>Why fret 12 is the octave</b><p class="muted" style="margin:6px 0 0;font-size:14px">A string’s pitch is inversely proportional to its vibrating length. Each fret shortens the string by a factor of 2<sup>1/12</sup>, so 12 frets later the string is exactly half as long and the pitch doubles: one octave. Fret <i>n</i> sits at L × (1 − 2<sup>−n/12</sup>) from the nut. Touching (not pressing) at 1/2, 1/3 or 1/4 of the length forces a node there, so the string can only vibrate in 2, 3 or 4 pieces.</p></div>
      </div></div>`;
    $('#hm-cmp', box).addEventListener('click', () => { const s = Math.min(1, strings().length - 1); Neck.play(s, 12, 0); Sound.harmonic(freqOf(strings()[s]) * 2, 0.9); });
    $('#hm-all', box).addEventListener('click', () => { const open = freqOf(strings()[0]); [1, 2, 3, 4, 5, 6].forEach((n, i) => setTimeout(() => { if (n > 1) this.pick(n, 1, 0); else Sound.harmonic(open, 0); }, i * 700)); });
    $('#hm-table', box).innerHTML = [2, 3, 4, 5, 6].map((n) => `<button class="harm-row" data-n="${n}"><b>×${n}</b><span>${HARM_NAMES[n]}</span><small>${harmonicNodes().filter((h) => h.n === n).map((h) => 'fret ' + (Math.abs(h.fret - Math.round(h.fret)) < 0.06 ? Math.round(h.fret) : h.fret.toFixed(1))).join(', ') || 'beyond these frets'}</small></button>`).join('');
    $$('#hm-table .harm-row', box).forEach((b) => b.addEventListener('click', () => this.pick(+b.dataset.n, 1, 0)));
    this.draw(); this.animate();
  },
  unmount() { cancelAnimationFrame(this.raf); },
  fretX(fr) { const g = Neck.g; const a = Math.floor(fr), b = Math.min(g.F, a + 1); const xa = g.xs[a], xb = g.xs[b]; return Neck.X(xa + (xb - xa) * (fr - a)); },
  draw() {
    Neck.clear();
    harmonicNodes().forEach((h) => strings().forEach((open, s) => {
      const g = el('g', { class: 'mk harm' + (h.n === this.sel.n ? '' : ' dim'), transform: `translate(${this.fretX(h.fret)},${Neck.y(s)})` }, Neck.mLayer);
      const inner = el('g', { class: 'in' }, g);
      el('rect', { x: -11, y: -11, width: 22, height: 22, rx: 6, transform: 'rotate(45)', fill: ['', '', '#ffd166', '#5aa9ff', '#8be0a4', '#f59bdc', '#c69cff'][h.n], stroke: 'rgba(0,0,0,.3)' }, inner);
      const t = el('text', { y: 1, 'font-size': 11, fill: '#1d1a3b' }, inner); t.textContent = '×' + h.n;
    }));
    const n = this.sel.n, freq0 = freqOf(strings()[0]);
    $('#hm-info', this.box).innerHTML = `<div class="big-note" style="--c:${['', '', '#ffd166', '#5aa9ff', '#8be0a4', '#f59bdc', '#c69cff'][n]}">×${n}</div><div><h2>${ordinal(n)} harmonic: ${HARM_NAMES[n]}</h2><p>Touch lightly right above the fret wire. The string vibrates in ${n} equal parts, so the pitch is ${n}× the open string. On the low E (${freq0.toFixed(1)} Hz) that is ${(freq0 * n).toFixed(1)} Hz.</p></div>`;
  },
  pick(n, k, s) {
    this.sel = { n, k }; this.draw();
    const sIdx = s ?? 0; Sound.harmonic(freqOf(strings()[sIdx]) * n, 0);
    const h = harmonicNodes().find((x) => x.n === n && x.k === k) || harmonicNodes().find((x) => x.n === n);
    if (h) { const c = el('circle', { cx: this.fretX(h.fret), cy: Neck.y(sIdx), r: 15, fill: 'none', stroke: '#fff', 'stroke-width': 3, class: 'ripple' }, Neck.fx); setTimeout(() => c.remove(), 750); }
    this.t0 = performance.now();
  },
  animate() {
    const svg = $('#hm-wave', this.box); if (!svg) return;
    const draw = (now) => {
      if (!svg.isConnected) return;
      const n = this.sel.n, ph = (now / 1000) * 6, amp = 34 * Math.max(0.15, Math.exp(-((now - (this.t0 || now - 2000)) / 1600)));
      let d1 = '', d2 = '';
      for (let i = 0; i <= 120; i++) { const x = 30 + i * 4.5, u = i / 120, y = Math.sin(Math.PI * n * u) * amp * Math.cos(ph); d1 += (i ? 'L' : 'M') + x + ',' + (75 + y); d2 += (i ? 'L' : 'M') + x + ',' + (75 - y); }
      let nodes = ''; for (let j = 0; j <= n; j++) nodes += `<circle cx="${30 + (540 * j) / n}" cy="75" r="${j === 0 || j === n ? 6 : 5}" fill="${j === 0 || j === n ? '#f1e9da' : '#ffc857'}"/>`;
      svg.innerHTML = `<line x1="30" x2="570" y1="75" y2="75" stroke="rgba(255,255,255,.12)"/><path d="${d2}" fill="none" stroke="rgba(90,169,255,.35)" stroke-width="2"/><path d="${d1}" fill="none" stroke="#5aa9ff" stroke-width="3"/>${nodes}<text x="30" y="140" fill="#b8b1cc" font-size="12">nut</text><text x="570" y="140" fill="#b8b1cc" font-size="12" text-anchor="end">bridge</text><text x="300" y="20" fill="#ffc857" font-size="13" text-anchor="middle">${n} loops, ${n - 1} touch point${n > 2 ? 's' : ''} (gold)</text>`;
      this.raf = requestAnimationFrame(draw);
    };
    cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(draw);
  },
  onCell(s, f) {
    const hs = harmonicNodes(); let best = null;
    hs.forEach((h) => { const d = Math.abs(h.fret - (f - 0.5)); if (d < 0.75 && (!best || d < best.d)) best = { h, d }; });
    if (best) this.pick(best.h.n, best.h.k, s); else Neck.play(s, f);
  },
  explain(s, f) {
    const hs = harmonicNodes(); const h = hs.find((x) => Math.abs(x.fret - (f - 0.5)) < 0.75);
    return h ? { title: '×' + h.n, pc: midiAt(s, 0) % 12, text: `A node at ${h.k}/${h.n} of the string length. Touching here leaves ${h.n} vibrating sections, so you hear the ${ordinal(h.n)} harmonic: ${HARM_NAMES[h.n]} above the open ${noteName(midiAt(s, 0) % 12)}.` } : null;
  },
};

/* ================= Chord–scale matcher ================= */
const FIT_PREFS = { maj: ['majpent', 'major', 'lydian'], min: ['minpent', 'dorian', 'minor', 'phrygian'], '7': ['mixolydian', 'majpent'], maj7: ['major', 'lydian', 'majpent'], m7: ['dorian', 'minpent', 'minor', 'phrygian'], m7b5: ['locrian'], dim: ['dimwh', 'locrian'], sus4: ['mixolydian', 'majpent', 'dorian'], sus2: ['majpent', 'major', 'mixolydian'], '6': ['majpent', 'major'], add9: ['major', 'majpent', 'lydian'], aug: ['wholetone'], '5': ['minpent', 'majpent', 'blues'] };
if (!SCALES.find((x) => x.id === 'locrian')) SCALES.push({ id: 'locrian', name: 'Locrian', iv: [0, 1, 3, 5, 6, 8, 10], feel: 'The darkest mode, built for half-diminished chords.' });
if (!SCALES.find((x) => x.id === 'dimwh')) SCALES.push({ id: 'dimwh', name: 'Diminished (whole-half)', iv: [0, 2, 3, 5, 6, 8, 9, 11], feel: 'Symmetrical and spooky. Repeats every 3 frets.' });
if (!SCALES.find((x) => x.id === 'wholetone')) SCALES.push({ id: 'wholetone', name: 'Whole tone', iv: [0, 2, 4, 6, 8, 10], feel: 'All whole steps: dreamy and unresolved.' });
function scalesForChord(root, id) {
  const civ = chordType(id).iv.map((x) => mod(x, 12));
  const out = [];
  SCALES.forEach((sc) => {
    const siv = sc.iv; if (!civ.every((x) => siv.includes(x))) return;
    const avoid = siv.filter((x) => !civ.includes(x) && civ.some((c) => mod(x - c, 12) === 1));
    const pref = (FIT_PREFS[id] || []).indexOf(sc.id);
    out.push({ sc, avoid, score: (pref < 0 ? 10 : pref) + avoid.length * 1.5 + (siv.length === 5 ? -0.5 : 0) });
  });
  out.sort((a, b) => a.score - b.score);
  if (id === '7') out.push({ sc: SCALES.find((x) => x.id === 'blues'), avoid: [], rule: true, score: 99 });
  return out;
}
const ChordFit = {
  root: 9, id: '7', pick: 0,
  mount(box) {
    this.box = box;
    const types = ['maj', 'min', '7', 'maj7', 'm7', 'm7b5', 'dim', 'sus4', '6', 'aug'];
    box.innerHTML = `<div class="panel-grid">
      <div class="controls">
        <div><small class="muted">Scales that fit over</small><h2 class="chord-name" id="fit-name" style="font-size:clamp(48px,6vw,80px)"></h2></div>
        <div class="fit-list" id="fit-list"></div>
        <div class="legend"><span><i style="background:#ffc857"></i>Chord tones: safest landing notes</span><span><i style="background:rgba(241,233,218,.45)"></i>Scale notes: good passing notes</span><span><i style="background:transparent;border:2px solid #ff6b7a"></i>Avoid notes: clash if you sit on them</span></div>
      </div>
      <div class="controls">
        <div class="row row-wide"><span class="lbl">Chord root</span><div class="wrap" id="fit-root">${noteChips(this.root)}</div></div>
        <div class="row row-wide"><span class="lbl">Chord type</span><div class="wrap" id="fit-type">${types.map((t) => `<button class="chip" data-t="${t}" aria-pressed="${t === this.id}">${chordType(t).name}</button>`).join('')}</div></div>
        <div class="wrap"><button class="btn btn-primary" id="fit-hear">${ICONS.play}Hear the scale over the chord</button></div>
      </div></div>`;
    $('#fit-root', box).addEventListener('click', (e) => { const b = e.target.closest('.note-chip'); if (!b) return; this.root = +b.dataset.pc; $$('#fit-root .note-chip', box).forEach((x) => x.setAttribute('aria-pressed', x === b)); this.pick = 0; this.render(); });
    $('#fit-type', box).addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; this.id = b.dataset.t; $$('#fit-type .chip', box).forEach((x) => x.setAttribute('aria-pressed', x === b)); this.pick = 0; this.render(); });
    $('#fit-hear', box).addEventListener('click', () => this.hear());
    this.render();
  },
  render() {
    const t = chordType(this.id); this.list = scalesForChord(this.root, this.id);
    $('#fit-name', this.box).innerHTML = `<span style="color:${noteColor(this.root)}">${esc(noteName(this.root))}</span>${esc(t.sym)}`;
    $('#fit-list', this.box).innerHTML = this.list.length ? this.list.map((x, i) => `<button class="fit-card${i === this.pick ? ' on' : ''}" data-i="${i}"><b>${noteName(this.root)} ${esc(x.sc.name.toLowerCase())}</b><small>${x.rule ? 'Rule-breaker: its ♭3 rubs against the chord’s 3rd. That rub is the blues sound.' : esc(x.sc.feel)}</small>${x.avoid.length ? `<span class="avoid">Avoid: ${x.avoid.map((iv) => noteName(this.root + iv)).join(', ')}</span>` : '<span class="ok">No avoid notes</span>'}${i === 0 ? '<em>Best fit</em>' : ''}</button>`).join('') : '<p class="empty">No scale in the library contains every note of this chord.</p>';
    $$('#fit-list .fit-card', this.box).forEach((b) => b.addEventListener('click', () => { this.pick = +b.dataset.i; this.render(); }));
    this.draw();
  },
  draw() {
    Neck.clear(); const x = this.list[this.pick]; if (!x) return;
    const civ = chordType(this.id).iv.map((v) => mod(v, 12));
    allCells().forEach(({ s, f, pc }) => {
      const semi = mod(pc - this.root, 12);
      if (civ.includes(semi)) Neck.mark(s, f, { label: intervalInfo(semi, x.sc.iv)[0], color: intervalColor(semi, x.sc.iv), ring: semi === 0, ringColor: '#fff' });
      else if (x.sc.iv.includes(semi)) Neck.mark(s, f, { label: intervalInfo(semi, x.sc.iv)[0], color: 'rgba(241,233,218,.32)', textColor: '#f1e9da', cls: 'dim', ring: x.avoid.includes(semi), ringColor: '#ff6b7a' });
    });
  },
  hear() {
    const x = this.list[this.pick]; if (!x) return; const v = voicingOf(this.root, this.id); const ctx = Sound.ensure();
    if (v) { Sound.strumAt(v.frets, ctx.currentTime + 0.05, false, 0.3); Sound.strumAt(v.frets, ctx.currentTime + 2.6, false, 0.25); }
    const base = 57 + mod(this.root - 9, 12); [...x.sc.iv, 12].forEach((iv, i) => Sound.play(base + iv, 0.4 + i * 0.28, 0.45));
  },
  explain(s, f) { const x = this.list && this.list[this.pick]; if (!x) return null; const r = roleExplain(s, f, this.root, x.sc.iv, `${noteName(this.root)} ${x.sc.name.toLowerCase()}`); const semi = mod(midiAt(s, f) - this.root, 12); if (chordType(this.id).iv.map((v) => mod(v, 12)).includes(semi)) r.text += ' It’s also in the chord, so it’s a safe note to land on.'; else if (x.avoid.includes(semi)) r.text += ' Careful: it’s a half step above a chord tone, so it clashes if you hold it. Use it in passing.'; return r; },
};

/* ================= Progression analyzer ================= */
const QUAL_MAP = [['m7b5', 'm7b5'], ['m7♭5', 'm7b5'], ['ø', 'm7b5'], ['maj7', 'maj7'], ['M7', 'maj7'], ['Δ', 'maj7'], ['min7', 'm7'], ['m7', 'm7'], ['dim7', 'dim'], ['dim', 'dim'], ['°', 'dim'], ['aug', 'aug'], ['+', 'aug'], ['sus2', 'sus2'], ['sus4', 'sus4'], ['sus', 'sus4'], ['add9', 'add9'], ['min', 'min'], ['m', 'min'], ['13', '7'], ['11', '7'], ['9', '7'], ['7', '7'], ['6', '6'], ['5', '5'], ['', 'maj']];
function parseChord(tok) {
  const m = tok.trim().replace(/\/.*$/, '').match(/^([A-Ga-g])([#♯b♭]?)(.*)$/); if (!m) return null;
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1].toUpperCase()];
  const acc = m[2] === '#' || m[2] === '♯' ? 1 : m[2] === 'b' || m[2] === '♭' ? -1 : 0;
  const rest = m[3]; const q = QUAL_MAP.find(([k]) => rest === k) || QUAL_MAP.find(([k]) => k && rest.startsWith(k));
  if (!q) return null;
  return { root: mod(base + acc, 12), id: q[1], text: tok.trim() };
}
const FAMILY = (id) => (['min', 'm7'].includes(id) ? 'min' : ['dim', 'm7b5'].includes(id) ? 'dim' : id === 'aug' ? 'aug' : 'maj');
const MAJ_FAM = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'], MIN_STEPS = [0, 2, 3, 5, 7, 8, 10], MIN_FAM = ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
function analyzeProgression(chords) {
  let best = null;
  for (let k = 0; k < 12; k++) for (const minor of [false, true]) {
    const steps = minor ? MIN_STEPS : MAJ, fam = minor ? MIN_FAM : MAJ_FAM; let score = 0;
    chords.forEach((c, i) => {
      const d = steps.indexOf(mod(c.root - k, 12));
      if (d >= 0 && (fam[d] === FAMILY(c.id) || c.id === '5')) score += 2;
      else if (d === 4 && FAMILY(c.id) === 'maj') score += minor ? 1.8 : 0.5; // V major in minor keys
      else if (d >= 0) score += 0.4;
      if (i === 0 && mod(c.root - k, 12) === 0) score += 1.4;
      if (i === chords.length - 1 && mod(c.root - k, 12) === 0) score += 0.8;
    });
    if (minor) score -= 0.3;
    if (!best || score > best.score) best = { key: k, minor, score };
  }
  const { key, minor } = best; const steps = minor ? MIN_STEPS : MAJ, fam = minor ? MIN_FAM : MAJ_FAM;
  const rows = chords.map((c, i) => {
    const semi = mod(c.root - key, 12), d = steps.indexOf(semi), F = FAMILY(c.id);
    const sfx = { '7': '7', maj7: 'maj7', m7: '7', m7b5: 'ø7', dim: '°', aug: '+', sus4: 'sus4', sus2: 'sus2', '6': '6', add9: 'add9', '5': '5' }[c.id] || '';
    let num, note = '', diatonic = d >= 0 && (fam[d] === F || c.id === '5');
    if (d >= 0) num = ROMAN[d];
    else { const chrom = { 1: '♭II', 3: '♭III', 6: '♭V', 8: '♭VI', 10: '♭VII', 4: 'III', 9: 'VI', 11: 'VII', 2: 'II' }[semi] || '?'; num = chrom; }
    num = F === 'min' || F === 'dim' ? num.replace(/[IV]+/, (r) => r.toLowerCase()) : num;
    num += sfx;
    let fn = '';
    const deg = d >= 0 ? d : -1;
    if (diatonic) fn = [0, 2, 5].includes(deg) ? (minor && deg === 5 ? 'subdominant' : 'tonic') : [1, 3].includes(deg) ? 'subdominant' : 'dominant';
    if (minor && diatonic) fn = deg === 0 || deg === 2 ? 'tonic' : deg === 3 || deg === 5 || deg === 1 ? 'subdominant' : 'dominant';
    if (!diatonic) {
      const nx = chords[i + 1];
      if (F === 'maj' && nx && mod(c.root - nx.root, 12) === 7) { note = `Secondary dominant: the V of ${nx.text}. It borrows tension to lead there.`; fn = 'dominant'; num = 'V/' + (() => { const dd = steps.indexOf(mod(nx.root - key, 12)); return dd >= 0 ? (FAMILY(nx.id) === 'maj' ? ROMAN[dd] : ROMAN[dd].toLowerCase()) : nx.text; })(); }
      else if (!minor && [3, 8, 10].includes(semi) && F === 'maj') { note = 'Borrowed from the parallel minor key: a classic rock and film sound.'; fn = 'borrowed'; }
      else if (!minor && semi === 5 && F === 'min') { note = 'Borrowed minor iv: bittersweet, very common before going home to I.'; fn = 'borrowed'; }
      else if (minor && semi === 7 && F === 'maj') { note = 'Major V in a minor key (from harmonic minor): it pulls hard back to i.'; fn = 'dominant'; diatonic = true; }
      else { note = 'Outside the key: a colour chord.'; fn = 'outside'; }
    }
    return Object.assign({}, c, { num, fn, note, diatonic });
  });
  const fits = rows.filter((r) => r.diatonic).length;
  return { key, minor, rows, fits };
}
function keyLabel(k, minor) { const i = CIRCLE_PC.indexOf(minor ? mod(k + 3, 12) : k); return minor ? CIRCLE_MIN[i].replace('m', '') : CIRCLE_MAJ[i]; }
const Analyzer = {
  id: 'analyzer', nav: 'Analyzer', title: 'Progression analyzer',
  help: 'Type the chords of any song. Fretwave finds the key, labels each chord’s job, plays it back on the neck, and shows you which scale to solo with.',
  text: 'G D Em C', bpm: 90, playing: null,
  mount(p) {
    this.p = p;
    p.innerHTML = `<div class="panel-grid">
      <div class="controls">
        <div class="row row-wide"><span class="lbl">Chords (separate with spaces)</span><div class="an-input"><input id="an-text" type="text" value="${esc(this.text)}" spellcheck="false" aria-label="Chords"><button class="btn btn-primary" id="an-go">Analyze</button></div></div>
        <div class="wrap" id="an-ex">${['G D Em C', 'C Am F G', 'Am F C G', 'Dm7 G7 Cmaj7', 'A D E', 'C E7 Am F', 'E D A E', 'C G Am F Fm C'].map((x) => `<button class="chip" data-x="${x}">${x}</button>`).join('')}</div>
        <div id="an-out"></div>
      </div>
      <div class="controls" id="an-side"></div></div>`;
    $('#an-go', p).addEventListener('click', () => this.run());
    $('#an-text', p).addEventListener('keydown', (e) => { if (e.key === 'Enter') this.run(); });
    $('#an-ex', p).addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; $('#an-text', p).value = b.dataset.x; this.run(); });
    this.run(true);
  },
  unmount() { this.stop(); },
  run(silent) {
    this.stop();
    this.text = $('#an-text', this.p).value;
    const toks = this.text.split(/[\s,|–—-]+/).filter(Boolean);
    const chords = toks.map(parseChord); const bad = toks.filter((t, i) => !chords[i]);
    const out = $('#an-out', this.p), side = $('#an-side', this.p);
    if (!chords.filter(Boolean).length) { out.innerHTML = '<p class="empty">Type chord names like G, Em, D7, Cmaj7 or F#m.</p>'; side.innerHTML = ''; return; }
    const A = this.A = analyzeProgression(chords.filter(Boolean));
    const keyName = keyLabel(A.key, A.minor) + (A.minor ? ' minor' : ' major');
    const FN = { tonic: ['Home (tonic)', '#5ee6a8'], subdominant: ['Moving away (subdominant)', '#5aa9ff'], dominant: ['Tension (dominant)', '#ff7b54'], borrowed: ['Borrowed', '#c69cff'], outside: ['Outside the key', '#ff6b7a'] };
    out.innerHTML = `<div class="an-key"><small class="muted">Key</small><b style="color:${noteColor(A.key)}">${esc(keyName)}</b><span class="muted">${A.fits} of ${A.rows.length} chords belong to the key${bad.length ? `. Skipped: ${bad.map(esc).join(', ')}` : ''}</span></div>
      <div class="an-rows">${A.rows.map((r, i) => `<button class="an-chord" data-i="${i}" style="--f:${FN[r.fn] ? FN[r.fn][1] : '#b8b1cc'}"><small>${esc(r.num)}</small><b style="color:${noteColor(r.root)}">${esc(r.text)}</b><span>${FN[r.fn] ? FN[r.fn][0] : ''}</span></button>`).join('')}</div>
      <div id="an-note" class="muted" style="font-size:14px"></div>
      <div class="wrap"><button class="btn btn-primary" id="an-play">${ICONS.play}Play it</button><button class="btn" id="an-jam">${ICONS.jam}Jam over it</button><div class="slider"><input type="range" min="50" max="160" value="${this.bpm}" id="an-bpm" aria-label="Tempo"><output id="an-bpm-o">${this.bpm} bpm</output></div></div>`;
    const relMinor = mod(A.key + 9, 12), relMajor = mod(A.key + 3, 12);
    side.innerHTML = `<div class="surface"><b>Solo with</b><p style="margin:6px 0 10px">${A.minor ? `${keyLabel(A.key, true)} minor pentatonic, or ${keyLabel(A.key, true)} natural minor. Same notes as ${keyLabel(relMajor, false)} major.` : `${keyLabel(A.key, false)} major pentatonic for a sweet sound, or ${keyLabel(relMinor, true)} minor pentatonic (same notes) for a bluesier feel.`}</p><div class="wrap">${seg('an-sc', [['pent', 'Pentatonic'], ['full', 'Full scale']], 'pent')}</div></div>
      <div class="surface"><b>How to read this</b><p class="muted" style="margin:6px 0 0;font-size:14px">Roman numerals count chords from the key note: capitals are major, lowercase minor. <span style="color:#5ee6a8">Home</span> chords feel settled, <span style="color:#5aa9ff">moving away</span> chords lead outward, and <span style="color:#ff7b54">tension</span> chords pull back home. Tap a chord for details.</p></div>`;
    this.scaleMode = 'pent';
    wireSeg(side, 'an-sc', (v) => { this.scaleMode = v; this.drawScale(); });
    $$('.an-chord', out).forEach((b) => b.addEventListener('click', () => this.showChord(+b.dataset.i)));
    $('#an-play', out).addEventListener('click', () => (this.playing ? this.stop() : this.play()));
    $('#an-jam', out).addEventListener('click', () => this.jam());
    $('#an-bpm', out).addEventListener('input', (e) => { this.bpm = +e.target.value; $('#an-bpm-o', out).textContent = this.bpm + ' bpm'; });
    this.drawScale();
    if (!silent) hearChords([[A.rows[0].root, A.rows[0].id]]);
  },
  scaleIv() { const A = this.A; return this.scaleMode === 'full' ? (A.minor ? [0, 2, 3, 5, 7, 8, 10] : MAJ) : A.minor ? MINPENT : [0, 2, 4, 7, 9]; },
  drawScale() { Neck.clear(); Neck.handOff(); const A = this.A, iv = this.scaleIv(); allCells((m) => iv.map((x) => mod(A.key + x, 12)).includes(m % 12)).forEach(({ s, f, pc }) => { const semi = mod(pc - A.key, 12); Neck.mark(s, f, { label: intervalInfo(semi, iv)[0], color: intervalColor(semi, iv), ring: semi === 0, ringColor: '#fff', cls: semi === 0 ? '' : 'dim' }); }); },
  showChord(i, at = 0) {
    const r = this.A.rows[i]; const v = voicingOf(r.root, r.id); if (!v) return;
    $$('.an-chord', this.p).forEach((b) => b.classList.toggle('on', +b.dataset.i === i));
    Neck.clear(); drawVoicing(v, r.root, chordType(r.id).iv, { stagger: true }); if (S.settings.hand !== false) Neck.hand(v.frets);
    strum(v.frets, { at });
    const n = $('#an-note', this.p); if (n) n.innerHTML = `<b>${esc(r.text)}</b> is the <b>${esc(r.num)}</b> chord. ${r.note || ({ tonic: 'A home chord: it feels settled.', subdominant: 'It moves away from home and sets up tension.', dominant: 'It creates tension that wants to resolve home.' }[r.fn] || '')}`;
  },
  play() {
    const rows = this.A.rows; let i = 0; const btn = $('#an-play', this.p); btn.innerHTML = `${ICONS.stop}Stop`;
    const step = () => { if (!this.playing) return; this.showChord(i); i = (i + 1) % rows.length; this.playing = setTimeout(step, (60 / this.bpm) * 4 * 1000 * 0.5); };
    this.playing = true; step();
  },
  stop() { clearTimeout(this.playing); this.playing = null; const b = this.p && $('#an-play', this.p); if (b) b.innerHTML = `${ICONS.play}Play it`; },
  jam() {
    const A = this.A;
    JAM_STYLES.custom = Object.assign({}, JAM_STYLES.pop, { name: 'Your progression', bars: A.rows.map((r) => [mod(r.root - A.key, 12), r.id]), scale: A.minor ? 'minpent' : 'majpent', bpm: this.bpm });
    Jam.style = 'custom'; Jam.key = A.key; Jam.bpm = this.bpm; setMode('jam');
  },
  explain(s, f) {
    const A = this.A; if (!A) return null; const pc = midiAt(s, f) % 12; const semi = mod(pc - A.key, 12); const iv = A.minor ? [0, 2, 3, 5, 7, 8, 10] : MAJ;
    const r = roleExplain(s, f, A.key, iv, `${noteName(A.key)} ${A.minor ? 'minor' : 'major'}`);
    const inCh = A.rows.filter((c) => chordType(c.id).iv.map((x) => mod(c.root + x, 12)).includes(pc)).map((c) => c.text);
    if (inCh.length) r.text += ` In this progression it belongs to ${[...new Set(inCh)].join(', ')}.`;
    return r;
  },
  onCell(s, f) { Neck.play(s, f); },
};

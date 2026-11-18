/* ================= Interactive circle of fifths ================= */
const CIRCLE_MAJ = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'D♭', 'A♭', 'E♭', 'B♭', 'F'];
const CIRCLE_MIN = ['Am', 'Em', 'Bm', 'F♯m', 'C♯m', 'G♯m', 'D♯m', 'B♭m', 'Fm', 'Cm', 'Gm', 'Dm'];
const CIRCLE_PC = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
const SHARP_ORDER = ['F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'E♯'], FLAT_ORDER = ['B♭', 'E♭', 'A♭', 'D♭', 'G♭', 'C♭'];
function keySignature(i) { return i === 0 ? [] : i <= 6 ? SHARP_ORDER.slice(0, i) : FLAT_ORDER.slice(0, 12 - i); }
function spellScale(i, minor) {
  // spell the major scale of circle index i with correct letters
  const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'], nat = [0, 2, 4, 5, 7, 9, 11];
  const tonic = CIRCLE_MAJ[i]; const L0 = letters.indexOf(tonic[0]); const pc0 = CIRCLE_PC[i];
  const out = MAJ.map((iv, k) => { const L = letters[(L0 + k) % 7]; const want = mod(pc0 + iv, 12); const diff = mod(want - nat[letters.indexOf(L)] + 6, 12) - 6; return L + (diff === 1 ? '♯' : diff === -1 ? '♭' : diff === 2 ? '𝄪' : diff === -2 ? '𝄫' : ''); });
  return minor ? out.slice(5).concat(out.slice(0, 5)) : out;
}
const Circle = {
  id: 'circle', nav: 'Circle of fifths', title: 'Circle of fifths',
  help: 'Every key on one wheel. Tap a key and the wheel turns it to the top: the six chords that sound good together light up around it.',
  idx: 0, minor: false, rot: 0,
  mount(p) {
    this.p = p;
    p.innerHTML = `<div class="panel-grid">
      <div class="circle-wrap"><svg id="cf-svg" class="cf" viewBox="-210 -210 420 420" role="img" aria-label="Circle of fifths"></svg></div>
      <div class="controls">
        <div><small class="muted" id="cf-kind">Key of</small><h2 class="chord-name" id="cf-name" style="font-size:clamp(54px,6vw,84px)"></h2><p class="muted" id="cf-sig" style="margin:6px 0 0"></p></div>
        <div class="row row-wide"><span class="lbl">Scale</span><div class="tones" id="cf-scale"></div></div>
        <div class="row row-wide"><span class="lbl">Chords in this key (tap to hear)</span><div class="prog" id="cf-chords"></div></div>
        <div class="wrap"><button class="btn btn-primary" id="cf-145">${ICONS.play}Hear ${'I–IV–V–I'}</button><button class="btn" id="cf-scale-btn">${ICONS.play}Hear the scale</button><button class="btn" id="cf-walk">${ICONS.replay}Walk the circle</button>${seg('cf-mode', [['maj', 'Major'], ['min', 'Relative minor']], this.minor ? 'min' : 'maj')}</div>
        <p class="muted" style="font-size:13.5px;margin:0">Clockwise each key adds a sharp; counter-clockwise adds a flat. Neighbours share six of seven notes, which is why songs move between them so easily.</p>
      </div></div>`;
    $('#cf-svg', p).addEventListener('click', (e) => { const g = e.target.closest('[data-i]'); if (!g) return; this.minor = g.dataset.ring === 'min'; $$('#cf-mode button', p).forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === (this.minor ? 'min' : 'maj'))); this.select(+g.dataset.i, true); });
    $('#cf-145', p).addEventListener('click', () => this.cadence());
    $('#cf-scale-btn', p).addEventListener('click', () => this.playScale());
    $('#cf-walk', p).addEventListener('click', () => this.walk());
    wireSeg(p, 'cf-mode', (v) => { this.minor = v === 'min'; this.select(this.idx, true); });
    this.rot = -this.idx * 30; this.draw(); this.select(this.idx, false);
  },
  unmount() { clearTimeout(this.walkT); cancelAnimationFrame(this.raf); },
  draw() {
    const svg = $('#cf-svg', this.p); if (!svg) return;
    const sel = this.idx, R1 = 168, R2 = 110;
    const arc = (r0, r1, d0, d1) => { const p = (r, d) => [r * Math.cos((d - 90) * Math.PI / 180), r * Math.sin((d - 90) * Math.PI / 180)]; const [a, b] = p(r1, d0), [c, d] = p(r1, d1), [e, f] = p(r0, d1), [g, h] = p(r0, d0); return `M${a},${b} A${r1},${r1} 0 0 1 ${c},${d} L${e},${f} A${r0},${r0} 0 0 0 ${g},${h}Z`; };
    let html = `<path d="${arc(78, 200, -45, 45)}" fill="rgba(255,200,87,.1)" stroke="rgba(255,200,87,.45)" stroke-width="1.5"/>`;
    html += `<circle r="${R1}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="58"/><circle r="${R2}" fill="none" stroke="rgba(255,255,255,.05)" stroke-width="44"/>`;
    for (let i = 0; i < 12; i++) {
      const ang = (i * 30 + this.rot) * Math.PI / 180;
      const near = Math.abs(mod(i - sel + 6, 12) - 6) <= 1;
      const x1 = R1 * Math.sin(ang), y1 = -R1 * Math.cos(ang), x2 = R2 * Math.sin(ang), y2 = -R2 * Math.cos(ang);
      const pc = CIRCLE_PC[i], mpc = mod(pc + 9, 12);
      html += `<g data-i="${i}" data-ring="maj" class="cf-node${i === sel && !this.minor ? ' sel' : ''}${near ? ' near' : ''}" transform="translate(${x1},${y1})"><circle r="27" fill="${noteColor(pc)}"/><text dominant-baseline="central">${CIRCLE_MAJ[i]}</text></g>`;
      html += `<g data-i="${i}" data-ring="min" class="cf-node minor${i === sel && this.minor ? ' sel' : ''}${near ? ' near' : ''}" transform="translate(${x2},${y2})"><circle r="21" fill="${noteColor(mpc)}"/><text dominant-baseline="central">${CIRCLE_MIN[i]}</text></g>`;
      const xs = 202 * Math.sin(ang), ys = -202 * Math.cos(ang); const sig = i === 0 ? '0' : i <= 6 ? i + '♯' : (12 - i) + '♭';
      html += `<text class="cf-sig" x="${xs}" y="${ys}" dominant-baseline="central">${sig}</text>`;
    }
    html += `<text class="cf-center" y="-6" dominant-baseline="central">${this.minor ? CIRCLE_MIN[sel] : CIRCLE_MAJ[sel]}</text><text class="cf-center-sub" y="22">${keySignature(sel).length ? keySignature(sel).length + (sel <= 6 ? ' sharps' : ' flats').replace(/^1 (\w+)s$/, '1 $1') : 'no sharps or flats'}</text>`;
    svg.innerHTML = html;
  },
  select(i, sound) {
    this.idx = i; const target = -i * 30;
    let from = this.rot; const diff = mod(target - from + 180, 360) - 180; const to = from + diff;
    cancelAnimationFrame(this.raf); const t0 = performance.now(), dur = reduceMotion() ? 1 : 600;
    const tick = (now) => { const k = Math.min(1, (now - t0) / dur); this.rot = from + (to - from) * (1 - Math.pow(1 - k, 3)); this.draw(); if (k < 1) this.raf = requestAnimationFrame(tick); };
    this.raf = requestAnimationFrame(tick);
    const sig = keySignature(i), notes = spellScale(i, this.minor), pc = CIRCLE_PC[i], tonic = this.minor ? mod(pc + 9, 12) : pc;
    $('#cf-kind', this.p).textContent = this.minor ? 'Key of (relative minor)' : 'Key of';
    $('#cf-name', this.p).innerHTML = `<span style="color:${noteColor(tonic)}">${this.minor ? CIRCLE_MIN[i] : CIRCLE_MAJ[i]}</span>${this.minor ? '' : ' major'}`;
    $('#cf-sig', this.p).textContent = sig.length ? `Key signature: ${sig.join(' ')}. Relative ${this.minor ? 'major: ' + CIRCLE_MAJ[i] : 'minor: ' + CIRCLE_MIN[i]}.` : `No sharps or flats. Relative ${this.minor ? 'major: C' : 'minor: Am'}.`;
    const ivs = this.minor ? [0, 2, 3, 5, 7, 8, 10] : MAJ;
    $('#cf-scale', this.p).innerHTML = notes.map((n, k) => `<span class="tone"><i style="background:${noteColor(tonic + ivs[k])}">${k + 1}</i><b>${n}</b></span>`).join('');
    const quals = this.minor ? ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'] : DIATONIC;
    const nums = this.minor ? ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'] : NUMERALS;
    this.chords = ivs.map((iv, k) => ({ root: mod(tonic + iv, 12), id: quals[k], name: notes[k] + chordType(quals[k]).sym, num: nums[k] }));
    $('#cf-chords', this.p).innerHTML = this.chords.map((c, k) => `<button class="prog-card" data-k="${k}"><small>${c.num}</small><b style="color:${noteColor(c.root)}">${esc(c.name)}</b></button>`).join('');
    $$('#cf-chords .prog-card', this.p).forEach((b) => b.addEventListener('click', () => this.showChord(+b.dataset.k)));
    Neck.clear(); Neck.handOff();
    allCells((m) => ivs.map((x) => mod(tonic + x, 12)).includes(m % 12)).forEach(({ s, f, pc: npc }) => Neck.mark(s, f, { label: noteName(npc), color: noteColor(npc), ring: npc === tonic, ringColor: '#fff', cls: npc === tonic ? '' : 'dim' }));
    if (sound) hearChords([[tonic, this.minor ? 'min' : 'maj']]);
  },
  showChord(k, at = 0) {
    const c = this.chords[k]; const v = voicingOf(c.root, c.id); if (!v) return;
    $$('#cf-chords .prog-card', this.p).forEach((b) => b.classList.toggle('on', +b.dataset.k === k));
    Neck.clear(); drawVoicing(v, c.root, chordType(c.id).iv, { stagger: true }); if (S.settings.hand !== false) Neck.hand(v.frets);
    strum(v.frets, { at });
  },
  cadence() { [0, 3, 4, 0].forEach((k, i) => setTimeout(() => { if (current === this) this.showChord(k); }, i * 1100)); },
  playScale() { const tonic = this.chords[0].root; const base = 48 + tonic; const ivs = this.minor ? [0, 2, 3, 5, 7, 8, 10, 12] : [...MAJ, 12]; ivs.forEach((iv, i) => Sound.play(base + iv, i * 0.3, 0.5)); },
  explain(s, f) { const tonic = this.chords[0].root; const iv = this.minor ? [0, 2, 3, 5, 7, 8, 10] : MAJ; const r = roleExplain(s, f, tonic, iv, `the key of ${this.minor ? CIRCLE_MIN[this.idx] : CIRCLE_MAJ[this.idx] + ' major'}`); const pc = midiAt(s, f) % 12; const inCh = this.chords.filter((c) => chordType(c.id).iv.map((x) => mod(c.root + x, 12)).includes(pc)).map((c) => c.name); if (inCh.length) r.text += ` It appears in these chords of the key: ${inCh.join(', ')}.`; return r; },
  walk() {
    clearTimeout(this.walkT); let n = 0;
    const step = () => { if (current !== this || n > 12) return; this.select((this.idx + (n ? 1 : 0)) % 12, true); n++; this.walkT = setTimeout(step, 1100); };
    step();
  },
  onCell(s, f) { Neck.play(s, f); },
};

/* ================= Alternate tunings explorer + tuning wizard ================= */
Object.assign(INSTRUMENTS.guitar.tunings, {
  dStandard: { name: 'D standard (D G C F A D)', midi: [38, 43, 48, 53, 57, 62] },
  dropC: { name: 'Drop C (C G C F A D)', midi: [36, 43, 48, 53, 57, 62] },
  openE: { name: 'Open E (E B E G♯ B E)', midi: [40, 47, 52, 56, 59, 64] },
  openC: { name: 'Open C (C G C G C E)', midi: [36, 43, 48, 55, 60, 64] },
});
const TUNING_INFO = {
  standard: { use: 'Where everything starts. Nearly all lessons, chord charts and tabs assume it.', chord: null },
  dropD: { use: 'Heavy riffs and big low notes. Power chords on the bottom three strings become a one-finger barre.', chord: null },
  halfDown: { use: 'Every string a half step lower: slightly darker, easier bends. Common in blues and classic rock.', chord: null },
  dStandard: { use: 'A whole step down: deeper and heavier, and kinder to singers with lower voices.', chord: null },
  dropC: { use: 'Drop D, a whole step lower. A favourite for modern rock and metal riffs.', chord: null },
  dadgad: { use: 'Open and ringing, neither major nor minor. Loved for Celtic and acoustic folk playing.', chord: [2, 'sus4'] },
  openG: { use: 'Strum the open strings and you hear G major. Great for slide guitar and chunky rock rhythm.', chord: [7, 'maj'] },
  openD: { use: 'Open strings ring as D major. A rich, resonant sound for slide and fingerstyle.', chord: [2, 'maj'] },
  openE: { use: 'Open strings ring as E major. Bright and punchy, a classic slide tuning.', chord: [4, 'maj'] },
  openC: { use: 'Huge low C major chord on the open strings. Lush for fingerstyle and ambient playing.', chord: [0, 'maj'] },
};
const Tunings = {
  id: 'tunings', nav: 'Tunings', title: 'Alternate tunings',
  help: 'See how each tuning changes the neck, hear it, then let the wizard walk you through retuning your guitar string by string.',
  sel: 'dropD', from: null,
  mount(p) {
    this.p = p; this.wiz = null;
    if (S.settings.instrument !== 'guitar') { p.innerHTML = `<div class="surface"><p style="margin:0">The tunings explorer is for 6-string guitar. Switch your instrument to guitar in settings to use it.</p><div class="wrap" style="margin-top:12px"><button class="btn" id="tn-set">Open settings</button></div></div>`; $('#tn-set', p).addEventListener('click', () => openSettings('instrument')); return; }
    this.real = S.settings.tuning; // what the user's guitar is set to now
    if (!this.from) this.from = this.real;
    this.render();
  },
  unmount() { this.restore(); if (Mic.active) Mic.stop(); clearInterval(this.loop); },
  restore() { if (this.real && S.settings.tuning !== this.real) { S.settings.tuning = this.real; Sound.cache.clear(); Neck.build(); } },
  preview(id) { if (S.settings.tuning !== id) { S.settings.tuning = id; Sound.cache.clear(); Neck.build(); Neck.onCell = (s, f) => Neck.play(s, f); } },
  render() {
    const T = INSTRUMENTS.guitar.tunings, from = T[this.from].midi, to = T[this.sel].midi, info = TUNING_INFO[this.sel] || {};
    this.preview(this.sel);
    const rows = to.map((m, s) => ({ s, a: from[s], b: m })).reverse();
    this.p.innerHTML = `<div class="panel-grid">
      <div class="controls">
        <div><small class="muted">Selected tuning</small><h2 class="chord-name" style="font-size:clamp(40px,5vw,64px)">${esc(T[this.sel].name.replace(/ \(.*/, ''))}</h2><p class="muted" style="margin:6px 0 0">${esc(info.use || '')}</p></div>
        <div class="tune-table">${rows.map((r) => { const d = r.b - r.a; return `<div class="tt-row${d ? ' change' : ''}"><span class="tt-str">${ordinal(stringNumber(r.s))}</span><span class="tt-note" style="--c:${noteColor(r.a % 12)}">${noteName(r.a % 12)}</span><span class="tt-arrow">${d ? (d > 0 ? '↑' : '↓') : '='}</span><span class="tt-note" style="--c:${noteColor(r.b % 12)}">${noteName(r.b % 12)}</span><span class="tt-what">${d === 0 ? 'No change' : `${d > 0 ? 'Tighten' : 'Loosen'} ${Math.abs(d)} half step${Math.abs(d) > 1 ? 's' : ''}`}</span></div>`; }).join('')}</div>
        <div class="wrap"><button class="btn" id="tu-hear-a">${ICONS.strum}Hear ${esc(T[this.from].name.replace(/ \(.*/, ''))}</button><button class="btn" id="tu-hear-b">${ICONS.strum}Hear ${esc(T[this.sel].name.replace(/ \(.*/, ''))}</button></div>
        <div class="wrap"><button class="btn btn-primary btn-big" id="tu-wiz" ${this.sel === this.from ? 'disabled' : ''}>${ICONS.tuner}Retune my guitar, step by step</button><button class="btn btn-big" id="tu-use">Use this tuning in Fretwave</button></div>
        <div id="tu-wizard"></div>
      </div>
      <div class="controls">
        <div class="row row-wide"><span class="lbl">Try a tuning</span><div class="wrap" id="tu-list">${Object.entries(T).map(([k, v]) => `<button class="chip" data-k="${k}" aria-pressed="${k === this.sel}">${esc(v.name.replace(/ \(.*/, ''))}</button>`).join('')}</div></div>
        <div class="row row-wide"><span class="lbl">My guitar is tuned to</span><select id="tu-from" aria-label="Current tuning">${Object.entries(T).map(([k, v]) => `<option value="${k}" ${k === this.from ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select></div>
        <p class="muted" style="font-size:13.5px;margin:0">The neck above is showing the selected tuning, so every note has moved to where it really sits. Leaving this page puts Fretwave back to ${esc(T[this.real].name.replace(/ \(.*/, ''))} unless you choose “Use this tuning”.</p>
      </div></div>`;
    Neck.clear();
    to.forEach((m, s) => Neck.noteMark(s, 0, { ring: m !== from[s], ringColor: '#ffc857' }));
    if (info.chord) { const [r, id] = info.chord; to.forEach((m, s) => { const semi = mod(m - r, 12); Neck.mark(s, 0, { label: intervalInfo(semi, chordType(id).iv)[0], color: intervalColor(semi, chordType(id).iv), ring: m !== from[s], ringColor: '#ffc857' }); }); }
    $('#tu-list', this.p).addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; this.sel = b.dataset.k; this.render(); });
    $('#tu-from', this.p).addEventListener('change', (e) => { this.from = e.target.value; this.render(); });
    $('#tu-hear-a', this.p).addEventListener('click', () => from.forEach((m, i) => Sound.play(m, i * 0.09, 0.4)));
    $('#tu-hear-b', this.p).addEventListener('click', () => { to.forEach((m, i) => Sound.play(m, i * 0.09, 0.4)); strings().forEach((_, s) => setTimeout(() => Neck.pluck(s, 0), s * 90)); });
    $('#tu-use', this.p).addEventListener('click', () => { this.real = this.sel; S.settings.tuning = this.sel; S.settings.drill.strings = null; persist(); toast(`Fretwave is now in ${T[this.sel].name.replace(/ \(.*/, '')}. Change it back any time in settings.`); });
    $('#tu-wiz', this.p).addEventListener('click', () => this.wizard());
  },
  wizard() {
    const T = INSTRUMENTS.guitar.tunings, from = T[this.from].midi, to = T[this.sel].midi;
    const todo = to.map((m, s) => ({ s, a: from[s], b: m })).filter((x) => x.a !== x.b);
    if (!todo.length) return;
    this.wiz = { todo, i: 0, good: 0, mic: false };
    this.wizStep();
  },
  wizStep() {
    const w = this.wiz, box = $('#tu-wizard', this.p); if (!box) return;
    clearInterval(this.loop);
    if (w.i >= w.todo.length) {
      if (Mic.active) Mic.stop();
      box.innerHTML = `<div class="wizard done">${ICONS.check}<div><b>All strings retuned.</b><p class="muted" style="margin:2px 0 0">Strum the open strings: it should sound like the “Hear” button.</p></div><button class="btn btn-primary" id="wz-use">Use this tuning in Fretwave</button></div>`;
      $('#wz-use', box).addEventListener('click', () => $('#tu-use', this.p).click());
      return;
    }
    const t = w.todo[w.i], d = t.b - t.a;
    box.innerHTML = `<div class="wizard">
      <div class="wz-head"><span class="muted">String ${w.i + 1} of ${w.todo.length}</span><b>${ordinal(stringNumber(t.s))} string: ${noteName(t.a % 12)} → <span style="color:${noteColor(t.b % 12)}">${noteName(t.b % 12)}</span></b><span>${d > 0 ? 'Tighten the peg until the note rises' : 'Loosen the peg until the note drops'} ${Math.abs(d)} half step${Math.abs(d) > 1 ? 's' : ''}.</span></div>
      <div class="wz-meter"><i id="wz-needle"></i><span class="wz-zone"></span></div>
      <div class="wz-read" id="wz-read">Play the reference, then pluck your string.</div>
      <div class="wrap"><button class="btn" id="wz-ref">${ICONS.play}Reference note</button><label class="switch"><input type="checkbox" id="wz-loop">Repeat it</label><button class="btn btn-primary" id="wz-mic">${ICONS.mic}${Mic.active ? 'Listening…' : 'Check with my mic'}</button><button class="btn" id="wz-next">${w.i === w.todo.length - 1 ? 'Finish' : 'Next string'}</button></div></div>`;
    Neck.clear(); strings().forEach((m, s) => Neck.noteMark(s, 0, s === t.s ? { ring: true, ringColor: '#ffc857', cls: 'pulse' } : { cls: 'dim' }));
    const ref = () => { Sound.play(t.b, 0, 0.5); Neck.pluck(t.s, 0); };
    $('#wz-ref', box).addEventListener('click', ref);
    $('#wz-loop', box).addEventListener('change', (e) => { clearInterval(this.loop); if (e.target.checked) { ref(); this.loop = setInterval(ref, 2400); } });
    $('#wz-next', box).addEventListener('click', () => { w.i++; w.good = 0; this.wizStep(); });
    $('#wz-mic', box).addEventListener('click', async () => {
      try { await Mic.start(() => {}); } catch (e) { micError(e); return; }
      $('#wz-mic', box).innerHTML = `${ICONS.mic}Listening…`;
      Mic.listen((f) => this.wizPitch(f));
    });
    if (Mic.active) Mic.listen((f) => this.wizPitch(f));
    ref();
  },
  wizPitch(f) {
    const w = this.wiz; if (!w || f <= 0 || w.i >= w.todo.length) return;
    const t = w.todo[w.i]; const mf = 69 + 12 * Math.log2(f / 440);
    const cents = Math.round((mf - t.b) * 100);
    const read = $('#wz-read', this.p), nd = $('#wz-needle', this.p); if (!read) return;
    if (Math.abs(cents) > 350) { read.textContent = `Hearing ${noteName(Math.round(mf) % 12)}: ${cents < 0 ? 'keep tightening' : 'keep loosening'}${Math.abs(cents) > 1200 ? ' (or check you are on the right string)' : ''}.`; nd.style.left = (cents < 0 ? 0 : 100) + '%'; w.good = 0; return; }
    nd.style.left = clamp(50 + cents / 2, 0, 100) + '%';
    if (Math.abs(cents) <= 6) { read.textContent = 'In tune ✓'; read.style.color = 'var(--good)'; if (++w.good >= 6) { toast(`${ordinal(stringNumber(t.s))} string done`, 1200); w.i++; w.good = 0; setTimeout(() => this.wizStep(), 500); } }
    else { read.textContent = `${Math.abs(cents)} cents ${cents < 0 ? 'flat: tighten' : 'sharp: loosen'}`; read.style.color = ''; w.good = 0; }
  },
  onCell(s, f) { Neck.play(s, f); },
};

/* ================= Printable cheat sheets ================= */
const PRINT_TUNING = [40, 45, 50, 55, 59, 64];
function printNeckSVG(cells, o = {}) {
  const a = o.from ?? 0, b = o.to ?? 12, n = 6, W = o.w || 900, gap = 26, top = 18, left = a === 0 ? 46 : 22;
  const fw = (W - left - 14) / (b - a + (a === 0 ? 0 : 1)), H = top + gap * (n - 1) + 34;
  const fx = (f) => (a === 0 ? left + (f - 0.5) * fw : left + (f - a + 0.5) * fw);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%">`;
  for (let f = a; f <= b; f++) { const x = a === 0 ? left + f * fw : left + (f - a + 1) * fw; if (f > 0 || a > 0) s += `<line x1="${x}" x2="${x}" y1="${top}" y2="${top + gap * (n - 1)}" stroke="#999" stroke-width="1.2"/>`; }
  if (a === 0) s += `<rect x="${left - 4}" y="${top - 2}" width="5" height="${gap * (n - 1) + 4}" fill="#333"/>`;
  [3, 5, 7, 9, 12, 15, 17].forEach((f) => { if (f >= Math.max(a, 1) && f <= b) s += `<circle cx="${fx(f)}" cy="${top + gap * (n - 1) / 2}" r="5" fill="#ddd"/>`; });
  for (let i = 0; i < n; i++) s += `<line x1="${left - 4}" x2="${W - 14}" y1="${top + i * gap}" y2="${top + i * gap}" stroke="#555" stroke-width="${0.6 + (i) * 0.25}"/>`;
  for (let f = a; f <= b; f++) if (f > 0) s += `<text x="${fx(f)}" y="${H - 6}" font-size="10" text-anchor="middle" fill="#666">${f}</text>`;
  cells.forEach((c) => { const y = top + (n - 1 - c.s) * gap, x = c.f === 0 ? (a === 0 ? left - 22 : null) : fx(c.f); if (x == null || c.f > b || (c.f < a && c.f !== 0)) return; s += `<circle cx="${x}" cy="${y}" r="10.5" fill="${c.color}" stroke="#333" stroke-width="${c.ring ? 2.4 : 0.8}"/><text x="${x}" y="${y + 3.6}" font-size="${String(c.label).length > 1 ? 8.5 : 10}" font-weight="700" text-anchor="middle" fill="#111">${c.label}</text>`; });
  ['E', 'A', 'D', 'G', 'B', 'e'].forEach((nm, i) => { if (a === 0) return; s += `<text x="8" y="${top + (n - 1 - i) * gap + 4}" font-size="10" fill="#666">${nm}</text>`; });
  return s + '</svg>';
}
function printChordSVG(frets, root, iv, name) {
  const fg = fingering(frets).fingers; const fretted = frets.filter((f) => f > 0); const mx = fretted.length ? Math.max(...fretted) : 0; const base = mx <= 4 ? 1 : Math.min(...fretted);
  const W = 120, H = 156, L0 = 20, top = 36, cw = 16, rh = 22;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="120"><text x="${W / 2}" y="16" font-size="15" font-weight="800" text-anchor="middle" fill="#111">${name}</text>`;
  if (base === 1) s += `<rect x="${L0}" y="${top - 4}" width="${cw * 5}" height="4" fill="#111"/>`; else s += `<text x="${L0 - 6}" y="${top + 14}" font-size="10" text-anchor="end" fill="#444">${base}fr</text>`;
  for (let r = 0; r <= 4; r++) s += `<line x1="${L0}" x2="${L0 + cw * 5}" y1="${top + r * rh}" y2="${top + r * rh}" stroke="#555"/>`;
  for (let i = 0; i < 6; i++) s += `<line x1="${L0 + i * cw}" x2="${L0 + i * cw}" y1="${top}" y2="${top + 4 * rh}" stroke="#333" stroke-width="${0.8 + (5 - i) * 0.2}"/>`;
  frets.forEach((f, i) => {
    const x = L0 + i * cw;
    if (f < 0) s += `<text x="${x}" y="${top - 9}" font-size="11" text-anchor="middle" fill="#333">×</text>`;
    else if (f === 0) s += `<circle cx="${x}" cy="${top - 12}" r="4" fill="none" stroke="#333"/>`;
    else { const y = top + (f - base + 0.5) * rh; const semi = mod(PRINT_TUNING[i] + f - root, 12); const fi = fg.find((q) => q.s === i && q.f === f) || fg.find((q) => q.barre && q.f === f); s += `<circle cx="${x}" cy="${y}" r="7.5" fill="${intervalColor(semi, iv)}" stroke="#222" stroke-width=".8"/><text x="${x}" y="${y + 3.4}" font-size="9" font-weight="800" text-anchor="middle" fill="#111">${fi ? fi.finger : ''}</text>`; }
  });
  const ivRow = frets.map((f, i) => (f < 0 ? '' : intervalInfo(mod(PRINT_TUNING[i] + f - root, 12), iv)[0]));
  ivRow.forEach((t, i) => (s += `<text x="${L0 + i * cw}" y="${H - 8}" font-size="8.5" text-anchor="middle" fill="#555">${t}</text>`));
  return s + '</svg>';
}
const PRINTABLES = {
  notes: { name: 'Fretboard note map', make: () => { const saveT = S.settings.tuning; const cells = []; PRINT_TUNING.forEach((o, s) => { for (let f = 0; f <= 15; f++) { const pc = (o + f) % 12; cells.push({ s, f, label: noteName(pc), color: IS_NATURAL[pc] ? noteColor(pc) : '#eeeeee', ring: pc === 0 }); } }); return `<h1>Every note on the neck</h1><p>Standard tuning. Natural notes in color; sharps and flats in grey. Circled: every C.</p>${printNeckSVG(cells, { from: 0, to: 15, w: 1000 })}<h2>Landmarks</h2><ul><li>Low E string: G at 3, A at 5, B at 7, E at 12.</li><li>A string: C at 3, D at 5, E at 7, A at 12.</li><li>Octaves: up two strings and two frets (three frets when you cross to the B string).</li><li>Fret 12 repeats the open strings an octave higher.</li></ul>`; } },
  chords: { name: 'Open chord chart', make: () => { const list = [[0, 'maj', 'C'], [9, 'maj', 'A'], [7, 'maj', 'G'], [4, 'maj', 'E'], [2, 'maj', 'D'], [9, 'min', 'Am'], [4, 'min', 'Em'], [2, 'min', 'Dm'], [4, '7', 'E7'], [9, '7', 'A7'], [2, '7', 'D7'], [7, '7', 'G7'], [11, '7', 'B7'], [0, 'maj7', 'Cmaj7'], [5, 'maj', 'F'], [11, 'min', 'Bm']]; const saveI = S.settings.instrument, saveT = S.settings.tuning; S.settings.instrument = 'guitar'; S.settings.tuning = 'standard'; const html = list.map(([r, id, nm]) => { const v = findVoicings(r, chordType(id).iv, 12).find((x) => x.base <= 2) || findVoicings(r, chordType(id).iv, 12)[0]; return v ? printChordSVG(v.frets, r, chordType(id).iv, nm) : ''; }).join(''); S.settings.instrument = saveI; S.settings.tuning = saveT; return `<h1>Open chord chart</h1><p>Numbers in the dots are fingers (1 = index … 4 = pinky). × = don’t play, ○ = open string. Under each chart: the job of each note (R = root).</p><div class="grid">${html}</div>${legendHTML()}`; } },
  pent: { name: 'Pentatonic shapes (A minor)', make: () => { const save = [S.settings.instrument, S.settings.tuning, S.settings.frets]; Object.assign(S.settings, { instrument: 'guitar', tuning: 'standard', frets: 17 }); const out = [1, 2, 3, 4, 5].map((n) => { const cells = pentShape(9, n); const lo = Math.min(...cells.map((c) => c.f)), hi = Math.max(...cells.map((c) => c.f)); return `<h3>Shape ${n}</h3>${printNeckSVG(cells.map((c) => { const semi = mod(c.midi - 9, 12); return { s: c.s, f: c.f, label: intervalInfo(semi, MINPENT)[0], color: intervalColor(semi, MINPENT), ring: semi === 0 }; }), { from: Math.max(0, lo - 1), to: hi + 1, w: 520 })}`; }).join(''); [S.settings.instrument, S.settings.tuning, S.settings.frets] = save; return `<h1>Minor pentatonic: the five shapes</h1><p>In A. Move every shape so the R dots land on a new note to change key. Shapes link end to end along the neck.</p><div class="grid2">${out}</div>${legendHTML()}`; } },
  caged: { name: 'CAGED shapes (C major)', make: () => { const save = [S.settings.instrument, S.settings.tuning, S.settings.frets]; Object.assign(S.settings, { instrument: 'guitar', tuning: 'standard', frets: 17 }); const shapes = cagedShapes(0); [S.settings.instrument, S.settings.tuning, S.settings.frets] = save; return `<h1>CAGED: one chord, five shapes</h1><p>C major everywhere on the neck. Learn where the root sits in each shape.</p><div class="grid2">${shapes.map((sh) => `<div><h3>${sh.name} shape</h3>${printNeckSVG(sh.frets.map((f, s) => ({ s, f })).filter((c) => c.f >= 0).map((c) => { const semi = mod(PRINT_TUNING[c.s] + c.f, 12); return { s: c.s, f: c.f, label: intervalInfo(semi, [0, 4, 7])[0], color: intervalColor(semi, [0, 4, 7]), ring: semi === 0 }; }), { from: Math.max(0, sh.lo - 1), to: sh.hi + 1, w: 520 })}</div>`).join('')}</div>${legendHTML()}`; } },
  circle: { name: 'Circle of fifths and keys', make: () => `<h1>Circle of fifths</h1><div style="text-align:center">${circleSVG().replace(/#b8b1cc/g, '#555')}</div><h2>Major keys</h2><table><tr><th>Key</th><th>Signature</th><th>Chords: I ii iii IV V vi vii°</th></tr>${CIRCLE_MAJ.map((k, i) => { const sp = spellScale(i); return `<tr><td><b>${k}</b></td><td>${keySignature(i).join(' ') || 'none'}</td><td>${sp.map((n, j) => n + ['', 'm', 'm', '', '', 'm', '°'][j]).join('  ')}</td></tr>`; }).join('')}</table>` },
};
function legendHTML() { return `<p class="legend">${[['R', 1], ['2', 2], ['3', 3], ['4', 4], ['5', 5], ['6', 6], ['7', 7]].map(([l, d]) => `<span><i style="background:${DEGREE_COLORS[d]}"></i>${l === 'R' ? 'Root' : l}</span>`).join('')}</p>`; }
function printSheet(title, body) {
  const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}: Fretwave</title><style>
    @page { margin: 14mm; } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: "Atkinson Hyperlegible", "Segoe UI", Arial, sans-serif; color: #111; margin: 0; }
    h1 { font-size: 26px; margin: 0 0 4px; } h2 { font-size: 17px; margin: 18px 0 6px; } h3 { font-size: 13px; margin: 8px 0 2px; } p, li, td, th { font-size: 12.5px; line-height: 1.45; }
    .brand { font-size: 11px; color: #666; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 12px; }
    .grid { display: flex; flex-wrap: wrap; gap: 6px 10px; } .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 22px; }
    .legend span { display: inline-flex; align-items: center; gap: 4px; margin-right: 12px; } .legend i { width: 11px; height: 11px; border-radius: 50%; border: 1px solid #333; display: inline-block; }
    table { border-collapse: collapse; width: 100%; } td, th { border-bottom: 1px solid #ddd; text-align: left; padding: 4px 6px; } .g-item { break-inside: avoid; margin-bottom: 10px; } .g-item h4 { margin: 0 0 2px; font-size: 14px; } svg { break-inside: avoid; }
  </style></head><body><div class="brand">Fretwave cheat sheet</div>${body}</body></html>`;
  let fr = $('#print-frame'); if (fr) fr.remove();
  fr = document.createElement('iframe'); fr.id = 'print-frame'; fr.setAttribute('aria-hidden', 'true');
  fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(fr);
  const d = fr.contentDocument; d.open(); d.write(doc); d.close();
  setTimeout(() => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { toast('Printing is blocked here. Open Fretwave from its own site to print.'); } }, 250);
}
function printablesHTML() {
  return `<div class="printables"><div><b>Printable cheat sheets</b><small>Opens your print dialog. Choose “Save as PDF” to keep a copy.</small></div><div class="wrap">${Object.entries(PRINTABLES).map(([k, v]) => `<button class="chip" data-print="${k}">${ICONS.download}${v.name}</button>`).join('')}</div></div>`;
}
function wirePrintables(root) {
  $$('[data-print]', root).forEach((b) => b.addEventListener('click', () => { const pr = PRINTABLES[b.dataset.print]; printSheet(pr.name, pr.make()); }));
  $$('[data-print-level]', root).forEach((b) => b.addEventListener('click', () => { const lv = CURRICULUM[+b.dataset.printLevel]; printSheet(lv.title, `<h1>Level ${+b.dataset.printLevel + 1}: ${esc(lv.title)}</h1><p>${esc(lv.blurb)}</p>${lv.guide.map(([h, body]) => `<div class="g-item"><h4>${h}</h4><div>${body}</div></div>`).join('')}`); }));
}

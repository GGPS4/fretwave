/* ================= Icons ================= */
const ic = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const ICONS = {
  explore: ic('<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M8 6v12M13 6v12M17.5 6v12M2.5 10h19M2.5 14h19"/><circle cx="10.5" cy="12" r="1.6" fill="currentColor"/>'),
  find: ic('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2"/><path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4"/>'),
  name: ic('<path d="M4 5.5h16v10H10l-4.5 3.5V15.5H4z"/><path d="M10 9a2 2 0 1 1 2.6 1.9c-.4.2-.6.5-.6 1v.3M12 13.6v.1"/>'),
  chords: ic('<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M5 8h14M5 13h14M9.7 3v18M14.3 3v18"/><circle cx="9.7" cy="10.5" r="1.6" fill="currentColor"/><circle cx="14.3" cy="15.5" r="1.6" fill="currentColor"/>'),
  scales: ic('<path d="M3 19h4v-4h4v-4h4V7h4V3"/><circle cx="5" cy="17" r="1" fill="currentColor"/><circle cx="9" cy="13" r="1" fill="currentColor"/><circle cx="13" cy="9" r="1" fill="currentColor"/><circle cx="17" cy="5" r="1" fill="currentColor"/>'),
  ear: ic('<path d="M7 9.5a5 5 0 0 1 10 0c0 3-2.5 3.6-3 6a3 3 0 0 1-5.6 1"/><path d="M10 9.8a2 2 0 0 1 4 0c0 1-1 1.4-1.4 2"/><path d="M19.5 5.5c1 1.2 1.6 2.6 1.6 4.2M3.9 5.5A7 7 0 0 0 2.4 9.7"/>'),
  tuner: ic('<path d="M3.5 16a8.5 8.5 0 1 1 17 0"/><path d="M12 16l3.5-5.5"/><circle cx="12" cy="16" r="1.4" fill="currentColor"/><path d="M6 11.3l1 .8M12 7.5v1.3M18 11.3l-1 .8"/>'),
  progress: ic('<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>'),
  play: ic('<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none"/>'),
  stop: ic('<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>'),
  strum: ic('<path d="M6 3v18M10 3v18M14 3v18M18 3v18"/><path d="M3 8l18 8" stroke-width="2.4"/>'),
  sound: ic('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
  voice: ic('<circle cx="9" cy="8" r="3.5"/><path d="M3 20c.6-3.6 3-5.5 6-5.5s5.4 1.9 6 5.5"/><path d="M17 6.5a4 4 0 0 1 0 5M19.5 4a7.5 7.5 0 0 1 0 10"/>'),
  settings: ic('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
  mic: ic('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>'),
  flame: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.5 1.2-3.9 2.2-5 .3 1.8 1 2.8 2.1 3.2C10.6 8.5 11 5 12 2z" fill="currentColor"/></svg>',
  replay: ic('<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 3.5v4.5h4.5"/>'),
};
const seg = (id, opts, val) => `<div class="seg" id="${id}" role="group">${opts.map(([v, t]) => `<button type="button" data-v="${v}" aria-pressed="${String(v) === String(val)}">${t}</button>`).join('')}</div>`;
function wireSeg(root, id, cb) {
  const g = $('#' + id, root); if (!g) return;
  g.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', g).forEach((x) => x.setAttribute('aria-pressed', x === b));
    cb(b.dataset.v);
  });
}
function noteChips(selected, opts = {}) {
  return Array.from({ length: 12 }, (_, pc) => (opts.naturalsOnly && !IS_NATURAL[pc]) ? '' :
    `<button type="button" class="note-chip" data-pc="${pc}" style="--c:${noteColor(pc)}" aria-pressed="${pc === selected}" aria-label="${spoken(pc)}">${noteName(pc)}</button>`).join('');
}
function hudStats(items) {
  return `<div class="hud-stats">${items.map(([v, l, hot]) => `<div class="hud-stat${hot ? ' hot' : ''}"><b>${v}</b><span>${l}</span></div>`).join('')}</div>`;
}

/* ================= Explore ================= */
const Explore = {
  id: 'explore', nav: 'Explore', title: 'Explore the neck',
  help: 'Tap any fret to hear it. Switch views to see interval shapes, or how harmonics and string physics work.',
  show: 'all', focus: 0, sel: null, revealed: new Set(), view: 'notes',
  mount(p) {
    p.innerHTML = `<div class="row view-row"><span class="lbl">View</span>${seg('ex-view', [['notes', 'Notes'], ['intervals', 'Interval shapes'], ['harmonics', 'Harmonics and physics']], this.view)}</div><div id="ex-body"></div>`;
    wireSeg(p, 'ex-view', (v) => { if (HarmonicLab.unmount) HarmonicLab.unmount(); this.view = v; Neck.clear(); this.mount(p); });
    const body = $('#ex-body', p);
    if (this.view === 'intervals') { this.p = body; IntervalLab.mount(body, this); return; }
    if (this.view === 'harmonics') { this.p = body; HarmonicLab.mount(body); return; }
    this.mountNotes(body);
  },
  unmount() { HarmonicLab.unmount(); },
  explain(s, f) { if (this.view === 'intervals') return IntervalLab.explain(s, f); if (this.view === 'harmonics') return HarmonicLab.explain(s, f); return null; },
  mountNotes(p) {
    this.p = p; this.sel = null;
    p.innerHTML = `<div class="panel-grid">
      <div class="controls">
        <div class="row"><span class="lbl">Show</span>${seg('ex-show', [['all', 'All notes'], ['nat', 'Naturals only'], ['one', 'One note'], ['none', 'Blank neck']], this.show)}</div>
        <div class="row"><span class="lbl">Pick a note</span><div class="wrap" id="ex-notes">${noteChips(this.show === 'one' ? this.focus : -1)}</div></div>
        <div class="row"><span class="lbl">Listen</span><div class="wrap">
          <button class="btn" id="ex-run">${ICONS.play}<span>Play every <span id="ex-run-n">${noteName(this.focus)}</span></span></button>
          <button class="btn" id="ex-open">${ICONS.strum}Strum the open strings</button></div></div>
      </div>
      <div class="surface info" id="ex-info"></div>
    </div>`;
    wireSeg(p, 'ex-show', (v) => { this.show = v; this.revealed.clear(); this.syncChips(); this.redraw(); });
    $('#ex-notes', p).addEventListener('click', (e) => {
      const b = e.target.closest('.note-chip'); if (!b) return;
      this.focus = +b.dataset.pc; this.show = 'one';
      $$('#ex-show button', p).forEach((x) => x.setAttribute('aria-pressed', x.dataset.v === 'one'));
      this.syncChips(); this.redraw();
      Sound.play(48 + this.focus + (this.focus < 4 ? 12 : 0)); Voice.say(spoken(this.focus));
    });
    $('#ex-run', p).addEventListener('click', () => this.runAll());
    $('#ex-open', p).addEventListener('click', () => strings().forEach((_, s) => Neck.play(s, 0, s * 0.07)));
    this.renderInfo(); this.redraw();
  },
  syncChips() {
    $$('#ex-notes .note-chip', this.p).forEach((b) => b.setAttribute('aria-pressed', this.show === 'one' && +b.dataset.pc === this.focus));
    const n = $('#ex-run-n', this.p); if (n) n.textContent = noteName(this.focus);
  },
  redraw() {
    Neck.clear();
    const twins = this.sel ? allCells((m) => m === midiAt(this.sel.s, this.sel.f)) : [];
    allCells().forEach(({ s, f, pc }) => {
      const isSel = this.sel && this.sel.s === s && this.sel.f === f;
      const isTwin = twins.some((t) => t.s === s && t.f === f);
      let visible = this.show === 'all' || (this.show === 'nat' && IS_NATURAL[pc]) || (this.show === 'one' && pc === this.focus) || this.revealed.has(s + ':' + f);
      if (isSel || isTwin) visible = true;
      if (!visible) return;
      Neck.noteMark(s, f, { ring: isSel || isTwin, ringColor: isSel ? '#fff' : noteColor(pc), cls: isTwin && !isSel ? 'pulse' : '', delay: this._stagger ? f * 18 : 0 });
    });
    this._stagger = false;
  },
  onCell(s, f) {
    if (this.view === 'intervals') return IntervalLab.onCell(s, f);
    if (this.view === 'harmonics') return HarmonicLab.onCell(s, f);
    this.sel = { s, f };
    if (this.show === 'none') this.revealed.add(s + ':' + f);
    Neck.play(s, f);
    Voice.say(spoken(midiAt(s, f) % 12));
    this.redraw(); this.renderInfo();
  },
  renderInfo() {
    const box = $('#ex-info', this.p); if (!box) return;
    if (!this.sel) {
      box.innerHTML = `<div><h2>Tap any fret</h2><p>You will hear it, see its name, and see every other spot on the neck that plays the exact same pitch.</p>
      <p style="margin-top:10px">Quiz yourself: choose <b>Blank neck</b>, guess a note in your head, then tap to check.</p></div>`;
      return;
    }
    const { s, f } = this.sel, m = midiAt(s, f), pc = m % 12;
    const twins = allCells((x) => x === m).length - 1;
    box.innerHTML = `<div class="big-note" style="--c:${noteColor(pc)}">${noteName(pc)}</div>
      <div><h2>${esc(noteName(pc))}${octaveOf(m)}</h2>
      <p>${ordinal(stringNumber(s))} string (${noteName(strings()[s] % 12)}), ${f === 0 ? 'played open' : ordinal(f) + ' fret'}</p>
      <div class="facts">
        <div><b>${freqOf(m).toFixed(1)} Hz</b><span>Pitch</span></div>
        <div><b>${twins}</b><span>Other places, same pitch</span></div>
        <div><b>${allCells((x) => x % 12 === pc).length}</b><span>${esc(noteName(pc))}s on this neck</span></div>
      </div></div>`;
  },
  runAll() {
    this.show = 'one'; this.syncChips();
    $$('#ex-show button', this.p).forEach((x) => x.setAttribute('aria-pressed', x.dataset.v === 'one'));
    this._stagger = true; this.redraw();
    const cells = allCells((m) => m % 12 === this.focus).sort((a, b) => a.midi - b.midi || a.s - b.s);
    cells.forEach((c, i) => Neck.play(c.s, c.f, 0.3 + i * 0.32, 0.45));
  },
};

/* ================= Drill config shared by Find + Name ================= */
const Drill = {
  cfg() { return S.settings.drill; },
  selStrings() {
    const n = strings().length; let a = this.cfg().strings;
    if (!Array.isArray(a) || a.length !== n) a = this.cfg().strings = new Array(n).fill(true);
    return a;
  },
  range() {
    const F = S.settings.frets, r = this.cfg().range;
    return r === '0-5' ? [0, 5] : r === '0-12' ? [0, Math.min(12, F)] : r === '5-12' ? [5, Math.min(12, F)] : r === '12+' ? [12, F] : [0, F];
  },
  pool() {
    const [a, b] = this.range(), ss = this.selStrings(), nat = this.cfg().naturals;
    return allCells((m, s, f) => ss[s] && f >= a && f <= b && (!nat || IS_NATURAL[m % 12]));
  },
  inPool(s, f) { return this.pool().some((c) => c.s === s && c.f === f); },
  pick(pool, last) {
    let cand = pool.filter((x) => !last || x.pc !== last.pc || x.s !== last.s);
    if (!cand.length) cand = pool;
    if (!this.cfg().smart) return rand(cand);
    const w = cand.map((x) => {
      const st = cellStat(x.s, x.f); if (!st.n) return 3;
      const acc = st.ok / st.n, avg = st.ok ? st.ms / st.ok : 6000;
      return 0.5 + (1 - acc) * 5 + clamp(avg / 2500, 0, 2.5);
    });
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < cand.length; i++) { r -= w[i]; if (r <= 0) return cand[i]; }
    return cand[cand.length - 1];
  },
  html(forFind) {
    const c = this.cfg(), ss = this.selStrings();
    const ranges = [['0-5', 'Open to 5'], ['0-12', 'Open to 12'], ['5-12', '5 to 12']];
    if (S.settings.frets > 12) ranges.push(['12+', `12 to ${S.settings.frets}`]);
    ranges.push(['all', 'Whole neck']);
    const strChips = strings().map((open, s) => ({ s, open })).reverse().map(({ s, open }) =>
      `<button type="button" class="chip" data-s="${s}" aria-pressed="${ss[s]}"><span class="sw" style="background:${noteColor(open % 12)}"></span>${ordinal(stringNumber(s))} <span class="muted">${noteName(open % 12)}</span></button>`).join('');
    return `
      <div class="row"><span class="lbl">Strings</span><div class="wrap" id="dr-strings">${strChips}</div></div>
      <div class="row"><span class="lbl">Frets</span>${seg('dr-range', ranges, c.range)}</div>
      <div class="row"><span class="lbl">Notes</span>${seg('dr-nat', [['1', 'Naturals (A to G)'], ['0', 'All 12 with sharps and flats']], c.naturals ? '1' : '0')}</div>
      ${forFind ? `<div class="row"><span class="lbl">Prompt</span>${seg('dr-kind', [['string', 'Note on one string'], ['all', 'Every spot for a note']], c.kind)}</div>
      <div class="row"><span class="lbl">Answer with</span>${seg('dr-input', [['screen', 'Tap the screen'], ['mic', 'My real guitar (mic)']], c.input)}</div>` : ''}
      <div class="row"><span class="lbl">Options</span><div class="wrap" style="gap:22px">
        <label class="switch"><input type="checkbox" id="dr-smart" ${c.smart ? 'checked' : ''}>Smart order (repeat weak spots)</label>
        ${forFind ? `<label class="switch"><input type="checkbox" id="dr-ps" ${c.promptSound ? 'checked' : ''}>Play the note when asked</label>` : ''}
      </div></div>`;
  },
  wire(p, onChange) {
    const c = this.cfg();
    $('#dr-strings', p).addEventListener('click', (e) => {
      const b = e.target.closest('.chip'); if (!b) return;
      const ss = this.selStrings(); const s = +b.dataset.s;
      if (ss[s] && ss.filter(Boolean).length === 1) { toast('Keep at least one string selected.'); return; }
      ss[s] = !ss[s]; b.setAttribute('aria-pressed', ss[s]); persist(); onChange();
    });
    wireSeg(p, 'dr-range', (v) => { c.range = v; persist(); onChange(); });
    wireSeg(p, 'dr-nat', (v) => { c.naturals = v === '1'; persist(); onChange(); });
    wireSeg(p, 'dr-kind', (v) => { c.kind = v; persist(); onChange(); });
    wireSeg(p, 'dr-input', (v) => { c.input = v; persist(); onChange(); });
    const sm = $('#dr-smart', p); if (sm) sm.addEventListener('change', () => { c.smart = sm.checked; persist(); });
    const ps = $('#dr-ps', p); if (ps) ps.addEventListener('change', () => { c.promptSound = ps.checked; persist(); });
  },
  preview() {
    Neck.clear(); Neck.shade(this.range(), this.selStrings());
    this.pool().forEach(({ s, f, pc }) => Neck.mark(s, f, { color: noteColor(pc), cls: 'small dim', r: 17 }));
  },
  summary(p, round, again, title) {
    const acc = round.total ? Math.round(100 * round.ok / round.total) : 0;
    const avg = round.times.length ? (round.times.reduce((a, b) => a + b, 0) / round.times.length / 1000).toFixed(1) : '–';
    const misses = [...new Set(round.misses)];
    const verdict = acc >= 90 ? 'Superb. Try a wider fret range next.' : acc >= 70 ? 'Solid round. Smart order will keep drilling the misses.' : 'Every miss is now on your practice list. Go again while it is fresh.';
    p.innerHTML = `<div class="surface summary">
      <div class="summary-top">
        <div class="big-stat"><b style="color:${acc >= 70 ? 'var(--good)' : 'var(--amber)'}">${acc}%</b><span>First-try accuracy</span></div>
        <div class="big-stat"><b>${avg}s</b><span>Average time</span></div>
        <div class="big-stat"><b>${round.best}</b><span>Best streak</span></div>
      </div>
      <p style="margin:0">${title} ${verdict}</p>
      ${misses.length ? `<div><p class="muted" style="margin:0 0 8px">Notes that tripped you up</p><div class="wrap">${misses.map((pc) => `<span class="note-chip" style="--c:${noteColor(pc)};display:inline-grid;place-items:center;cursor:default">${noteName(pc)}</span>`).join('')}</div></div>` : ''}
      <div class="wrap"><button class="btn btn-primary btn-big" id="sum-again">${ICONS.play}Play again</button><button class="btn btn-big" id="sum-setup">Change setup</button></div>
    </div>`;
    $('#sum-again', p).addEventListener('click', again.play);
    $('#sum-setup', p).addEventListener('click', again.setup);
  },
};
const ROUND = 20;

/* ================= Find the note ================= */
const Find = {
  id: 'find', nav: 'Find it', title: 'Find the note',
  help: 'You get a note and a string. Tap where it lives, or play it on your own guitar. Smart order keeps bringing back the spots you miss.',
  phase: 'setup',
  mount(p) { this.p = p; this.setup(); },
  unmount() { this.stopMic(); clearTimeout(this.t); },
  setup() {
    this.phase = 'setup'; this.stopMic(); clearTimeout(this.t);
    $('#hud').innerHTML = '';
    this.p.innerHTML = `<div class="controls">${Drill.html(true)}
      <div class="row"><span></span><div class="wrap"><button class="btn btn-primary btn-big" id="fd-start">${ICONS.play}Start a ${ROUND}-note round</button>
      <span class="muted">Press <span class="kbd">Space</span> to hear the note again.</span></div></div></div>`;
    Drill.wire(this.p, () => { Drill.preview(); });
    $('#fd-start', this.p).addEventListener('click', () => this.start());
    Drill.preview();
  },
  async start() {
    const c = Drill.cfg();
    if (!Drill.pool().length) { toast('That setup has no notes. Add strings or widen the frets.'); return; }
    this.round = { i: 0, total: ROUND, ok: 0, streak: 0, best: 0, times: [], misses: [] };
    this.kind = c.input === 'mic' ? 'string' : c.kind;
    if (c.input === 'mic') {
      try { await Mic.start((f) => this.onPitch(f)); } catch (e) { micError(e); return; }
    }
    this.phase = 'play';
    this.p.innerHTML = `<div class="wrap"><button class="btn" id="fd-replay">${ICONS.replay}Hear it again</button><button class="btn" id="fd-stop">${ICONS.stop}End round</button>
      ${c.input === 'mic' ? '<span class="muted">Listening. Play the note on your guitar, one string at a time.</span>' : ''}</div>`;
    $('#fd-replay', this.p).addEventListener('click', () => this.prompt(true));
    $('#fd-stop', this.p).addEventListener('click', () => this.finish());
    this.next();
  },
  next() {
    const r = this.round;
    if (r.i >= r.total) return this.finish();
    r.i++;
    const pool = Drill.pool();
    const t = Drill.pick(pool, this.q);
    const need = this.kind === 'all' ? pool.filter((c) => c.pc === t.pc) : pool.filter((c) => c.pc === t.pc && c.s === t.s);
    this.q = Object.assign({}, t, { tries: 0, t0: performance.now(), found: new Set(), need, lastFound: performance.now() });
    this.lock = false;
    Neck.clear();
    Neck.shade(Drill.range(), Drill.selStrings());
    if (this.kind === 'string') {
      const y = Neck.y(t.s);
      Neck.rect(Neck.g.nutX - 92, Neck.g.endX - Neck.g.nutX + 100, { y: y - 16, height: 32, rx: 16, fill: '#ffc857', opacity: 0.2 }, Neck.fxBelow);
    }
    Neck.scrollTo(Math.round(Drill.range().reduce((a, b) => a + b) / 2));
    this.renderHud(); this.prompt(false);
  },
  prompt(force) {
    const q = this.q; if (!q || this.phase !== 'play') return;
    if (Drill.cfg().input !== 'mic' && (Drill.cfg().promptSound || force)) Sound.play(q.midi, 0.05);
    const where = this.kind === 'string' ? `on the ${ordinal(stringNumber(q.s))} string` : 'everywhere';
    if (!force || !Drill.cfg().promptSound) Voice.say(`${spoken(q.pc)}, ${where}`);
  },
  renderHud() {
    const q = this.q, r = this.round, pc = q.pc;
    const pill = `<span class="note-pill" style="background:${noteColor(pc)};--glow:${noteGlow(pc)}">${noteName(pc)}</span>`;
    const promptTxt = this.kind === 'string'
      ? `Find ${pill} on the ${ordinal(stringNumber(q.s))} string <span class="muted" style="font-weight:500">(${noteName(strings()[q.s] % 12)})</span>`
      : `Find every ${pill} <span class="muted" style="font-weight:500">${q.found.size} of ${q.need.length}</span>`;
    $('#hud').innerHTML = `<div class="prompt">${promptTxt}</div>
      ${Drill.cfg().input === 'mic' ? '<div class="hearing" id="hearing">Hearing <b>–</b></div>' : ''}
      ${hudStats([[`${r.i}/${r.total}`, 'Note'], [r.ok, 'Correct'], [r.streak, 'Streak', r.streak >= 5]])}
      <div class="round-bar"><i style="width:${100 * (r.i - 1) / r.total}%"></i></div>`;
  },
  onCell(s, f) {
    if (this.phase !== 'play' || this.lock) { Neck.play(s, f); return; }
    if (Drill.cfg().input === 'mic') { Neck.play(s, f); return; }
    const q = this.q, m = midiAt(s, f), pc = m % 12;
    Neck.play(s, f);
    const hit = q.need.find((c) => c.s === s && c.f === f);
    if (hit && pc === q.pc) {
      if (this.kind === 'string') return this.correct(s, f);
      const k = s + ':' + f; if (q.found.has(k)) return;
      q.found.add(k);
      const now = performance.now(); recordAnswer(s, f, q.tries === 0, now - q.lastFound); q.lastFound = now;
      Neck.noteMark(s, f, { ring: true, cls: 'pulse' });
      if (q.found.size >= q.need.length) this.correct(null, null); else this.renderHud();
    } else this.wrong(s, f, pc);
  },
  correct(s, f) {
    const q = this.q, r = this.round, ms = performance.now() - q.t0;
    if (s != null) { recordAnswer(s, f, q.tries === 0, ms); Neck.noteMark(s, f, { ring: true, cls: 'pulse' }); }
    if (q.tries === 0) { r.ok++; r.streak++; r.best = Math.max(r.best, r.streak); r.times.push(ms); } else r.misses.push(q.pc);
    this.lock = true; this.renderHud();
    if (r.streak && r.streak % 5 === 0) toast(`${r.streak} in a row!`, 1200);
    this.t = setTimeout(() => this.next(), this.kind === 'all' ? 900 : 650);
  },
  wrong(s, f, pc) {
    const q = this.q, r = this.round;
    q.tries++; r.streak = 0;
    Neck.flashBad(s, f, noteName(pc));
    if (q.tries >= 2) {
      this.lock = true; r.misses.push(q.pc);
      q.need.forEach((c) => { if (!q.found.has(c.s + ':' + c.f)) { Neck.noteMark(c.s, c.f, { ring: true, cls: 'pulse target' }); recordAnswer(c.s, c.f, false, 0); } });
      const c0 = q.need[0]; if (c0) setTimeout(() => Neck.play(c0.s, c0.f), 350);
      this.renderHud();
      this.t = setTimeout(() => this.next(), 1800);
    }
  },
  onPitch(freq) {
    const h = $('#hearing b');
    if (freq <= 0 || this.phase !== 'play') { this._stable = 0; return; }
    const midi = Math.round(69 + 12 * Math.log2(freq / 440));
    if (h) { h.textContent = noteName(midi % 12); h.style.color = noteColor(midi % 12); }
    if (midi === this._last) this._stable = (this._stable || 0) + 1; else { this._stable = 1; this._last = midi; }
    if (this._stable === 3 && !this.lock && midi % 12 === this.q.pc) {
      const c = this.q.need.find((x) => x.midi === midi) || this.q.need[0] || this.q;
      Neck.pluck(c.s, c.f); this.correct(c.s, c.f);
    }
  },
  stopMic() { if (Mic.active) Mic.stop(); },
  finish() {
    clearTimeout(this.t); this.stopMic(); this.phase = 'done';
    const r = this.round; r.total = Math.max(1, r.i);
    $('#hud').innerHTML = `<div class="prompt">Round complete</div>`;
    Drill.summary(this.p, r, { play: () => this.start(), setup: () => this.setup() }, `You found ${r.ok} of ${r.total} on the first try.`);
  },
  explain() { return this.phase === 'play' ? false : null; },
  onKey(e) { if (e.code === 'Space' && this.phase === 'play') { e.preventDefault(); this.prompt(true); } },
};

/* ================= Name that note ================= */
const NameIt = {
  id: 'name', nav: 'Name it', title: 'Name that note',
  help: 'A fret lights up and plays. Name it on the color keys, or press A to G on your keyboard. Hearing and seeing it together is what makes it stick.',
  phase: 'setup',
  mount(p) { this.p = p; this.setup(); },
  unmount() { clearTimeout(this.t); },
  setup() {
    this.phase = 'setup'; clearTimeout(this.t); $('#hud').innerHTML = '';
    this.p.innerHTML = `<div class="controls">${Drill.html(false)}
      <div class="row"><span></span><div class="wrap"><button class="btn btn-primary btn-big" id="nm-start">${ICONS.play}Start a ${ROUND}-note round</button></div></div></div>`;
    Drill.wire(this.p, () => Drill.preview());
    $('#nm-start', this.p).addEventListener('click', () => this.start());
    Drill.preview();
  },
  keysHTML() {
    const nat = Drill.cfg().naturals;
    const pos = { 0: [1, 2], 2: [3, 2], 4: [5, 2], 5: [7, 2], 7: [9, 2], 9: [11, 2], 11: [13, 2], 1: [2, 1], 3: [4, 1], 6: [8, 1], 8: [10, 1], 10: [12, 1] };
    return `<div class="keys" id="nm-keys" style="${nat ? 'grid-template-rows:72px' : ''}">${Array.from({ length: 12 }, (_, pc) => {
      if (nat && !IS_NATURAL[pc]) return '';
      const [col, row] = pos[pc];
      return `<button type="button" class="key${IS_NATURAL[pc] ? '' : ' sharp'}" data-pc="${pc}" style="--c:${noteColor(pc)};grid-column:${col}/span 2;grid-row:${nat ? 1 : row}" aria-label="${spoken(pc)}">${noteName(pc)}</button>`;
    }).join('')}</div>`;
  },
  start() {
    if (!Drill.pool().length) { toast('That setup has no notes. Add strings or widen the frets.'); return; }
    this.round = { i: 0, total: ROUND, ok: 0, streak: 0, best: 0, times: [], misses: [] };
    this.phase = 'play';
    this.p.innerHTML = `${this.keysHTML()}<div class="wrap"><button class="btn" id="nm-replay">${ICONS.replay}Hear it again</button><button class="btn" id="nm-stop">${ICONS.stop}End round</button><span class="muted">Keys <span class="kbd">A</span> to <span class="kbd">G</span> answer, <span class="kbd">Space</span> replays.</span></div>`;
    $('#nm-keys', this.p).addEventListener('click', (e) => { const b = e.target.closest('.key'); if (b && !b.disabled) this.answer(+b.dataset.pc, b); });
    $('#nm-replay', this.p).addEventListener('click', () => this.q && Neck.play(this.q.s, this.q.f));
    $('#nm-stop', this.p).addEventListener('click', () => this.finish());
    this.next();
  },
  next() {
    const r = this.round; if (r.i >= r.total) return this.finish();
    r.i++;
    this.q = Object.assign({}, Drill.pick(Drill.pool(), this.q), { tries: 0, t0: performance.now() });
    this.lock = false;
    $$('#nm-keys .key', this.p).forEach((k) => { k.classList.remove('right', 'wrong'); k.disabled = false; });
    Neck.clear();
    Neck.mark(this.q.s, this.q.f, { label: '?', color: '#f1e9da', cls: 'target pulse', ring: true, ringColor: '#ffc857' });
    Neck.scrollTo(this.q.f);
    setTimeout(() => Neck.play(this.q.s, this.q.f), 120);
    this.renderHud();
  },
  renderHud() {
    const r = this.round, q = this.q;
    $('#hud').innerHTML = `<div class="prompt">What note is on the ${ordinal(stringNumber(q.s))} string, ${q.f === 0 ? 'open' : ordinal(q.f) + ' fret'}?</div>
      ${hudStats([[`${r.i}/${r.total}`, 'Note'], [r.ok, 'Correct'], [r.streak, 'Streak', r.streak >= 5]])}
      <div class="round-bar"><i style="width:${100 * (r.i - 1) / r.total}%"></i></div>`;
  },
  answer(pc, btn) {
    if (this.phase !== 'play' || this.lock) return;
    const q = this.q, r = this.round;
    btn = btn || $(`#nm-keys .key[data-pc="${pc}"]`, this.p);
    if (pc === q.pc) {
      const ms = performance.now() - q.t0;
      recordAnswer(q.s, q.f, q.tries === 0, ms);
      if (q.tries === 0) { r.ok++; r.streak++; r.best = Math.max(r.best, r.streak); r.times.push(ms); } else r.misses.push(q.pc);
      if (btn) btn.classList.add('right');
      Neck.noteMark(q.s, q.f, { ring: true, cls: 'pulse' }); Neck.pluck(q.s, q.f);
      Voice.say(spoken(pc));
      this.lock = true; this.renderHud();
      if (r.streak && r.streak % 5 === 0) toast(`${r.streak} in a row!`, 1200);
      this.t = setTimeout(() => this.next(), 900);
    } else {
      q.tries++; r.streak = 0;
      if (btn) { btn.classList.add('wrong'); btn.disabled = true; }
      // let the ear compare: play the wrong guess near the real pitch
      const guess = q.midi + ((mod(pc - q.pc + 6, 12)) - 6);
      Sound.play(guess);
      if (q.tries >= 2) {
        r.misses.push(q.pc); recordAnswer(q.s, q.f, false, 0); this.lock = true;
        const right = $(`#nm-keys .key[data-pc="${q.pc}"]`, this.p); if (right) right.classList.add('right');
        Neck.noteMark(q.s, q.f, { ring: true, cls: 'pulse' });
        setTimeout(() => { Neck.play(q.s, q.f); Voice.say(`That was ${spoken(q.pc)}`); }, 500);
        this.renderHud();
        this.t = setTimeout(() => this.next(), 2100);
      }
    }
  },
  finish() {
    clearTimeout(this.t); this.phase = 'done';
    const r = this.round; r.total = Math.max(1, r.i);
    $('#hud').innerHTML = `<div class="prompt">Round complete</div>`;
    Drill.summary(this.p, r, { play: () => this.start(), setup: () => this.setup() }, `You named ${r.ok} of ${r.total} on the first try.`);
  },
  onCell(s, f) { Neck.play(s, f); },
  explain() { return this.phase === 'play' ? false : null; },
  onKey(e) {
    if (this.phase !== 'play') return;
    if (e.code === 'Space') { e.preventDefault(); Neck.play(this.q.s, this.q.f); return; }
    const map = { a: 9, b: 11, c: 0, d: 2, e: 4, f: 5, g: 7 };
    const k = e.key.toLowerCase();
    if (map[k] != null) {
      let pc = map[k];
      if (!Drill.cfg().naturals && e.shiftKey) pc = mod(pc + 1, 12);
      this.answer(pc);
    }
  },
};

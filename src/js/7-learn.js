/* ================= Learning path: lesson engine ================= */
// S.learn = { done: { lessonId: stars }, last: lessonId, open: {levelIndex: bool} }
if (!S.learn) S.learn = saved.learn || { done: {}, last: null, open: {} };

const LEVEL_NAMES = ['First steps', 'Beginner', 'Improver', 'Developing', 'Intermediate', 'Fluent'];
const BOX_DAYS = [1, 3, 7, 16, 35, 90];
function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return dateStr(d); }
function dueReviews() { const r = S.learn.review || {}; const t = today(); return Object.keys(r).filter((id) => lessonById(id) && r[id].due <= t).sort((a, b) => (r[a].due < r[b].due ? -1 : 1)); }
function scheduleReview(id, passed) { S.learn.review = S.learn.review || {}; const cur = S.learn.review[id] || { box: 0 }; const box = passed ? Math.min(BOX_DAYS.length - 1, cur.box + 1) : 0; S.learn.review[id] = { box, due: addDays(BOX_DAYS[box]) }; }
function allLessons() { const out = []; CURRICULUM.forEach((lv, li) => lv.lessons.forEach((ls, i) => out.push({ lv, li, ls, i }))); return out; }
function lessonById(id) { return allLessons().find((x) => x.ls.id === id); }
function levelProgress(lv) { const d = lv.lessons.filter((l) => S.learn.done[l.id]).length; return { done: d, total: lv.lessons.length, pct: d / lv.lessons.length }; }
function nextLesson() { return allLessons().find((x) => !S.learn.done[x.ls.id]) || null; }
function currentLevelIndex() { const n = nextLesson(); return n ? n.li : CURRICULUM.length - 1; }
function pathPct() { const all = allLessons(); return all.filter((x) => S.learn.done[x.ls.id]).length / all.length; }

/* Helpers the lesson scripts use to draw and play on the neck */
const L = {
  timers: [],
  later(ms, fn) { const t = setTimeout(fn, ms); this.timers.push(t); return t; },
  reset() { this.timers.forEach(clearTimeout); this.timers = []; Tech.stop(); Sound.stopAll(); Neck.cancelPending(); Neck.clear(); Neck.handOff(); Sound.droneOff(); },
  cell(s, f) { return { s, f, midi: midiAt(s, f), pc: midiAt(s, f) % 12 }; },
  note(s, f, o = {}) { return Neck.noteMark(s, f, o); },
  label(s, f, label, color, o = {}) { return Neck.mark(s, f, Object.assign({ label, color }, o)); },
  iv(s, f, root, ctx = [], o = {}) { const semi = mod(midiAt(s, f) - root, 12); return Neck.mark(s, f, Object.assign({ label: intervalInfo(semi, ctx)[0], color: intervalColor(semi, ctx), ring: semi === 0, ringColor: '#fff' }, o)); },
  notes(cells, o = {}) { cells.forEach((c, i) => this.note(c.s, c.f, Object.assign({ delay: (o.stagger || 0) * i }, o))); },
  seq(cells, gap = 0.42, o = {}) {
    cells.forEach((c, i) => {
      this.later(i * gap * 1000 + (o.at || 0) * 1000, () => {
        if (o.iv != null) this.iv(c.s, c.f, o.iv, o.ctx || [], { ring: o.ring }); else if (o.label) this.label(c.s, c.f, typeof o.label === 'function' ? o.label(c, i) : o.label, o.color || noteColor(midiAt(c.s, c.f) % 12)); else this.note(c.s, c.f, { ring: o.ring });
        Neck.play(c.s, c.f, 0, 0.5);
      });
    });
    return cells.length * gap;
  },
  all(pc, o = {}, maxF = S.settings.frets) { allCells((m) => m % 12 === pc, maxF).forEach((c) => this.note(c.s, c.f, o)); },
  onString(s, a, b, pred = () => true) { const out = []; for (let f = a; f <= b; f++) { const c = this.cell(s, f); if (pred(c)) out.push(c); } return out; },
  naturals(s, a = 0, b = 12) { return this.onString(s, a, b, (c) => IS_NATURAL[c.pc]); },
  voicing(frets, root, iv, at = 0, o = {}) {
    drawVoicing({ frets }, root, iv, { stagger: true });
    if (S.settings.hand !== false && !o.noHand && frets.filter((f) => f > 0).length) Neck.hand(frets); else Neck.handOff();
    if (!o.silent) strum(frets, { at });
  },
  chord(root, id, at = 0.2, o = {}) {
    const t = chordType(id);
    const v = o.frets ? { frets: o.frets } : (findVoicings(root, t.iv, 12).find((x) => x.base <= (o.maxBase ?? 7)) || findVoicings(root, t.iv, 12)[0]);
    if (!v) return null;
    if (o.clear !== false) Neck.clear();
    this.voicing(v.frets, root, t.iv, at, o);
    return v;
  },
  progression(chords, gap = 1.3, at = 0.2) {
    chords.forEach(([root, id], i) => this.later((at + i * gap) * 1000, () => this.chord(root, id, 0, { maxBase: 5 })));
  },
  link(a, b, label, color) { Neck.link(a, b, label, color); },
  band(s, color = '#ffc857') { const y = Neck.y(s); Neck.rect(Neck.g.nutX - 92, Neck.g.endX - Neck.g.nutX + 100, { y: y - 16, height: 32, rx: 16, fill: color, opacity: 0.16 }, Neck.fxBelow); },
  shade(range) { Neck.shade(range, strings().map(() => true)); },
  play(midis, gap = 0.4, at = 0) { midis.forEach((m, i) => Sound.play(m, at + i * gap, 0.5)); return midis.length * gap; },
  together(midis, at = 0) { midis.forEach((m, i) => Sound.play(m, at + i * 0.012, 0.42)); },
  scale(root, ivs, [a, b] = [0, 12], o = {}) {
    const pcs = ivs.map((i) => mod(root + i, 12));
    allCells((m, s, f) => f >= a && f <= b && pcs.includes(m % 12)).forEach(({ s, f }) => {
      if (o.names) this.note(s, f, { cls: o.cls || '' }); else this.iv(s, f, root, ivs, { cls: o.cls || '' });
    });
  },
  shape(cells, root, ivs, o = {}) { cells.forEach((c, i) => this.iv(c.s, c.f, root, ivs, { delay: (o.stagger ?? 25) * i, cls: o.cls || '' })); },
  scroll(f) { Neck.scrollTo(f); },
};

/* Pentatonic / scale shapes reused by lessons (standard tuning) */
function boxCells(root, ivs, a, b) {
  const pcs = ivs.map((i) => mod(root + i, 12));
  return allCells((m, s, f) => f >= a && f <= b && pcs.includes(m % 12)).sort((x, y) => x.midi - y.midi);
}
function pentShape(root, n) {
  // n = 1..5, built with the same per-string rule as the Scales page
  const save = Scales.root, saveS = Scales.scale;
  Scales.root = root; Scales.scale = 'minpent';
  const shapes = Scales.positions();
  Scales.root = save; Scales.scale = saveS;
  // shape 1 = the one whose low-E root is the minor root
  const idx = shapes.findIndex((sh) => mod(strings()[0] + sh.anchor, 12) === root);
  const sh = shapes[(idx + n - 1) % shapes.length];
  let cells = sh.cells;
  if (cells.length && Math.min(...cells.map((c) => c.f)) === 0 && n > 1 && cells.every((c) => c.f + 12 <= S.settings.frets)) cells = cells.map((c) => ({ s: c.s, f: c.f + 12, midi: c.midi + 12 }));
  return cells.map((c) => ({ s: c.s, f: c.f, midi: midiAt(c.s, c.f), pc: midiAt(c.s, c.f) % 12 }));
}

/* ---------- Lesson player ---------- */
const Player = {
  active: false,
  open(steps, opts) {
    this.steps = steps; this.opts = opts; this.i = 0; this.mistakes = 0; this.passed = new Set(); this.stepMiss = [];
    this.active = true; this.saveInst = null;
    const st = S.settings;
    if (st.instrument !== 'guitar' || st.tuning !== 'standard' || st.frets < 15) {
      this.saveInst = { instrument: st.instrument, tuning: st.tuning, frets: st.frets };
      st.instrument = 'guitar'; st.tuning = 'standard'; st.frets = Math.max(15, st.frets); Sound.cache.clear();
      Neck.build();
    }
    setStage(true);
    Neck.onCell = (s, f) => this.onCell(s, f);
    this.render();
  },
  close(done) {
    L.reset(); this.active = false; if (Mic.active) Mic.stop();
    if (this.saveInst) { Object.assign(S.settings, this.saveInst); this.saveInst = null; Sound.cache.clear(); Neck.build(); }
    if (speechSynthesis && speechSynthesis.cancel) try { speechSynthesis.cancel(); } catch (e) { /* none */ }
    $('#hud').innerHTML = '';
    if (!done) Path.show();
  },
  step() { return this.steps[this.i]; },
  hasCheck(st = this.step()) { return !!st.check; },
  render() {
    const st = this.step(), n = this.steps.length, p = $('#panel');
    this.check = null;
    $('#hud').innerHTML = `<div class="lesson-hud">
      <button class="icon-btn" id="lp-close" aria-label="Leave lesson" title="Leave lesson">${ICONS.close}</button>
      <div class="lesson-title"><small>${esc(this.opts.kicker || '')}</small><b>${esc(this.opts.title)}</b></div>
      <div class="lp-dots" aria-label="Step ${this.i + 1} of ${n}">${this.steps.map((s, k) => `<i class="${k < this.i ? 'done' : k === this.i ? 'now' : ''}${s.check ? ' chk' : ''}"></i>`).join('')}</div>
      <button class="icon-btn" id="lp-narr" aria-pressed="${S.settings.narrate !== false}" title="Read steps aloud" aria-label="Read steps aloud">${ICONS.voice}</button>
    </div>`;
    $('#lp-close').addEventListener('click', () => this.close());
    $('#lp-narr').addEventListener('click', (e) => { S.settings.narrate = S.settings.narrate === false; persist(); e.currentTarget.setAttribute('aria-pressed', S.settings.narrate !== false); if (S.settings.narrate === false) try { speechSynthesis.cancel(); } catch (x) { /* */ } });
    p.innerHTML = `<div class="lesson-card">
      <p class="lesson-text">${st.t}</p>
      ${st.html ? `<div class="lesson-extra">${typeof st.html === 'function' ? st.html() : st.html}</div>` : ''}
      <div class="lesson-check" id="lp-check"></div>
      <div class="lesson-nav">
        <button class="btn" id="lp-back" ${this.i === 0 ? 'disabled' : ''}>Back</button>
        <button class="btn" id="lp-replay">${ICONS.replay}Show me again</button>
        <span class="lesson-spacer"></span>
        ${st.check ? `<button class="btn btn-quiet" id="lp-skip">Skip this check</button>` : ''}
        <button class="btn btn-primary" id="lp-next" ${st.check && !this.passed.has(this.i) ? 'disabled' : ''}>${this.i === n - 1 ? 'Finish' : 'Next'}</button>
      </div></div>`;
    $('#lp-back').addEventListener('click', () => this.go(this.i - 1));
    $('#lp-next').addEventListener('click', () => this.next());
    $('#lp-replay').addEventListener('click', () => this.show(true));
    const sk = $('#lp-skip'); if (sk) sk.addEventListener('click', () => { this.mistakes += 2; this.stepMiss[this.i] = (this.stepMiss[this.i] || 0) + 2; this.passed.add(this.i); this.next(); });
    $$('[data-goto]', p).forEach((b) => b.addEventListener('click', () => { this.close(true); setMode(b.dataset.goto); }));
    this.show(false);
    if (st.check) Checks.start(st.check, $('#lp-check'), () => { this.passed.add(this.i); const nb = $('#lp-next'); nb.disabled = false; nb.focus({ preventScroll: true }); });
  },
  show(again) {
    const st = this.step(); L.reset();
    if (st.show) st.show(L);
    if (Checks.cur && Checks.cur.redraw) Checks.cur.redraw();
    if (S.settings.narrate !== false) { const txt = st.t.replace(/<[^>]+>/g, '').replace(/♯/g, ' sharp').replace(/♭/g, ' flat').replace(/°/g, ' diminished'); Voice.sayLong(txt); }
  },
  go(i) { if (i < 0 || i >= this.steps.length) return; Checks.stop(); this.i = i; this.render(); },
  next() { if (this.i < this.steps.length - 1) this.go(this.i + 1); else this.finish(); },
  onCell(s, f) { if (Checks.cur && Checks.cur.onCell) Checks.cur.onCell(s, f); else Neck.play(s, f); },
  onKey(e) {
    if (e.code === 'ArrowRight' && !$('#lp-next').disabled) { e.preventDefault(); this.next(); }
    else if (e.code === 'ArrowLeft') { e.preventDefault(); this.go(this.i - 1); }
    else if (Checks.cur && Checks.cur.onKey) Checks.cur.onKey(e);
  },
  finish() {
    Checks.stop();
    const stars = this.mistakes === 0 ? 3 : this.mistakes <= 2 ? 2 : 1;
    const r = this.opts.onDone ? this.opts.onDone(stars, this.mistakes) : null;
    L.reset(); if (Mic.active) Mic.stop();
    $('#hud').innerHTML = '';
    const nx = nextLesson();
    $('#panel').innerHTML = `<div class="lesson-card done-card">
      <div class="stars big" aria-label="${stars} of 3 stars">${[1, 2, 3].map((k) => `<span class="${k <= stars ? 'on' : ''}">${ICONS.star}</span>`).join('')}</div>
      <h2>${esc((r && r.headline) || 'Lesson complete')}</h2>
      <p class="muted">${esc((r && r.sub) || (stars === 3 ? 'No mistakes. Clean work.' : stars === 2 ? 'Nearly perfect. Replay it any time for three stars.' : 'Done. Run it again later and it will feel easier.'))}</p>
      <div class="wrap">${nx ? `<button class="btn btn-primary btn-big" id="dn-next">${ICONS.play}Next: ${esc(nx.ls.title)}</button>` : ''}<button class="btn btn-big" id="dn-path">Back to the path</button></div>
    </div>`;
    const back = () => { this.close(true); Path.show(); };
    $('#dn-path').addEventListener('click', back);
    const nb = $('#dn-next'); if (nb) nb.addEventListener('click', () => { this.close(true); Path.startLesson(nx.ls.id); });
    if (stars === 3) celebrate();
  },
};

/* ---------- Checks (interactive questions inside lessons) ---------- */
const Checks = {
  cur: null,
  stop() { if (this.cur && this.cur.stop) this.cur.stop(); this.cur = null; if (Mic.active) Mic.stop(); },
  start(spec, box, pass) {
    this.stop();
    const items = spec.items ? spec.items.slice() : spec.gen ? Array.from({ length: spec.n || 3 }, () => spec.gen()) : [spec];
    const kind = spec.type;
    const run = { idx: 0, items, kind, box, spec };
    const fail = () => { Player.mistakes++; Player.stepMiss[Player.i] = (Player.stepMiss[Player.i] || 0) + 1; };
    const advance = () => {
      run.idx++;
      if (run.idx >= items.length) { box.innerHTML = `<div class="check-ok">${ICONS.check}<span>${esc(spec.doneText || 'Nice. Check passed.')}</span></div>`; this.cur = null; Neck.onCell = (s, f) => Player.onCell(s, f); pass(); return; }
      L.later(spec.type === 'quiz' ? 0 : 650, () => renderItem());
    };
    const counter = () => items.length > 1 ? `<span class="check-count">${run.idx + 1} of ${items.length}</span>` : '';
    const renderItem = () => {
      const it = items[run.idx];
      const T = CheckTypes[kind];
      this.cur = T(it, { box, counter, fail, done: advance, spec });
    };
    renderItem();
  },
};
const CheckTypes = {
  tap(it, k) {
    const targets = allCells((m, s, f) => it.target(s, f, m));
    const found = new Set(); let tries = 0;
    const draw = () => { if (it.show) it.show(L); };
    L.reset(); draw();
    k.box.innerHTML = `<div class="check-q">${ICONS.find}<div><b>${it.prompt}</b>${k.counter()}<small>${it.all ? `Find all ${targets.length}.` : 'Tap it on the neck.'}</small></div></div>`;
    return {
      redraw: draw,
      onCell(s, f) {
        const m = midiAt(s, f);
        Neck.play(s, f);
        if (it.target(s, f, m)) {
          found.add(s + ':' + f); Neck.noteMark(s, f, { ring: true, cls: 'pulse' });
          if (!it.all || found.size >= targets.length) { this.onCell = null; k.done(); }
        } else {
          tries++; k.fail(); Neck.flashBad(s, f, noteName(m % 12));
          if (tries >= 2) { targets.forEach((c) => Neck.noteMark(c.s, c.f, { ring: true, cls: 'pulse target' })); this.onCell = null; L.later(1500, () => k.done()); }
        }
      },
    };
  },
  quiz(it, k) {
    k.box.innerHTML = `<div class="check-q">${ICONS.name}<div><b>${it.q}</b>${k.counter()}</div></div>
      <div class="answers quiz">${it.options.map((o, i) => `<button class="answer" data-i="${i}"><b>${o}</b></button>`).join('')}</div><p class="check-why" hidden></p>`;
    let missed = false;
    $$('.answer', k.box).forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      if (i === it.answer) {
        b.classList.add('right'); $$('.answer', k.box).forEach((x) => (x.disabled = true));
        if (it.why) { const w = $('.check-why', k.box); w.hidden = false; w.textContent = it.why; }
        if (it.after) { L.reset(); it.after(L); }
        L.later(it.why ? 1600 : 700, () => k.done());
      } else { b.classList.add('wrong'); b.disabled = true; if (!missed) k.fail(); missed = true; }
    }));
    return {};
  },
  ear(it, k) {
    k.box.innerHTML = `<div class="check-q">${ICONS.ear}<div><b>${it.q}</b>${k.counter()}<small>Press play, then answer.</small></div></div>
      <div class="wrap"><button class="btn btn-primary" id="ck-play">${ICONS.play}Play</button></div>
      <div class="answers quiz">${it.options.map((o, i) => `<button class="answer" data-i="${i}"><b>${o}</b></button>`).join('')}</div><p class="check-why" hidden></p>`;
    const play = () => { Sound.stopAll(); Neck.cancelPending(); it.play(L); };
    $('#ck-play', k.box).addEventListener('click', play);
    L.later(300, play);
    let missed = false;
    $$('.answer', k.box).forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      if (i === it.answer) {
        b.classList.add('right'); $$('.answer', k.box).forEach((x) => (x.disabled = true));
        if (it.why) { const w = $('.check-why', k.box); w.hidden = false; w.textContent = it.why; }
        if (it.after) { L.reset(); it.after(L); }
        L.later(1500, () => k.done());
      } else { b.classList.add('wrong'); b.disabled = true; if (!missed) k.fail(); missed = true; play(); }
    }));
    return { onKey(e) { if (e.code === 'Space') { e.preventDefault(); play(); } } };
  },
  drill(it, k) {
    // it: { s, pc, a, b } generated by drillGen
    const pc = it.pc;
    L.reset(); L.band(it.s); L.shade([it.a, it.b]);
    Neck.scrollTo(Math.round((it.a + it.b) / 2));
    k.box.innerHTML = `<div class="check-q">${ICONS.find}<div><b>Find <span class="inline-note" style="background:${noteColor(pc)}">${noteName(pc)}</span> on the ${ordinal(stringNumber(it.s))} string</b>${k.counter()}<small>Frets ${it.a} to ${it.b}.</small></div></div>`;
    Sound.play(strings()[it.s] + it.f, 0.05);
    let tries = 0;
    return {
      redraw() { L.band(it.s); L.shade([it.a, it.b]); },
      onCell(s, f) {
        const m = midiAt(s, f); Neck.play(s, f);
        if (s === it.s && m % 12 === pc && f >= it.a && f <= it.b) { recordAnswer(s, f, tries === 0, 3000); Neck.noteMark(s, f, { ring: true, cls: 'pulse' }); this.onCell = null; k.done(); }
        else {
          tries++; k.fail(); Neck.flashBad(s, f, noteName(m % 12));
          if (tries >= 2) { recordAnswer(it.s, it.f, false, 0); Neck.noteMark(it.s, it.f, { ring: true, cls: 'pulse target' }); this.onCell = null; L.later(1400, () => k.done()); }
        }
      },
    };
  },
  seq(it, k) {
    let pos = 0, tries = 0, micOn = false;
    const cells = typeof it.cells === 'function' ? it.cells() : it.cells;
    const draw = () => { if (it.show) it.show(L); else cells.forEach((c, i) => Neck.mark(c.s, c.f, { label: i + 1, color: 'rgba(241,233,218,.25)', textColor: '#f1e9da', fontSize: 12, cls: 'seqhint' })); };
    L.reset(); draw();
    const dots = () => `<div class="seq-dots">${cells.map((c, i) => `<i class="${i < pos ? 'done' : i === pos ? 'now' : ''}" style="${i < pos ? `background:${noteColor(midiAt(c.s, c.f) % 12)}` : ''}"></i>`).join('')}</div>`;
    const paint = () => {
      k.box.innerHTML = `<div class="check-q">${ICONS.play}<div><b>${it.prompt}</b>${k.counter()}<small>${micOn ? 'Listening: play each note on your guitar.' : 'Tap each note in order, or play them on your guitar.'}</small></div></div>${dots()}
      <div class="wrap"><button class="btn" id="sq-hear">${ICONS.replay}Hear it</button><button class="btn" id="sq-mic">${ICONS.mic}${micOn ? 'Stop listening' : 'Use my guitar'}</button></div>`;
      $('#sq-hear', k.box).addEventListener('click', () => { Sound.stopAll(); cells.forEach((c, i) => Neck.play(c.s, c.f, i * 0.32, 0.45)); });
      $('#sq-mic', k.box).addEventListener('click', async () => {
        if (micOn) { Mic.stop(); micOn = false; paint(); return; }
        try { await Mic.start(onPitch); micOn = true; paint(); } catch (e) { micError(e); }
      });
    };
    const hit = () => {
      const c = cells[pos]; Neck.noteMark(c.s, c.f, { ring: true }); pos++;
      if (pos >= cells.length) { if (Mic.active) Mic.stop(); api.onCell = null; k.done(); } else paint();
    };
    let last = -1, stable = 0;
    const onPitch = (fr) => {
      if (fr <= 0 || pos >= cells.length) { stable = 0; return; }
      const m = Math.round(69 + 12 * Math.log2(fr / 440));
      if (m === last) stable++; else { stable = 1; last = m; }
      if (stable === 3) { const want = midiAt(cells[pos].s, cells[pos].f); if (m === want || m % 12 === want % 12) { last = -99; Neck.pluck(cells[pos].s, cells[pos].f); hit(); } }
    };
    paint();
    const api = {
      redraw: draw,
      stop() { if (Mic.active) Mic.stop(); },
      onCell(s, f) {
        const c = cells[pos]; const m = midiAt(s, f); Neck.play(s, f);
        const ok = (s === c.s && f === c.f) || (!it.exact && m === midiAt(c.s, c.f));
        if (ok) hit(); else { tries++; if (tries <= 3) k.fail(); Neck.flashBad(s, f, noteName(m % 12)); }
      },
    };
    return api;
  },
  chord(it, k) {
    const t = chordType(it.id); const pcs = [...new Set(t.iv.map((i) => mod(it.root + i, 12)))];
    const v = it.frets ? { frets: it.frets } : findVoicings(it.root, t.iv, 12)[0];
    const draw = () => { Neck.clear(); drawVoicing(v, it.root, t.iv); };
    L.reset(); draw();
    const name = noteName(it.root) + t.sym;
    let good = 0, micOn = false;
    const paint = (res) => {
      k.box.innerHTML = `<div class="check-q">${ICONS.chords}<div><b>Play ${esc(name)} on your guitar</b>${k.counter()}<small>${micOn ? 'Strum it and let it ring.' : 'Turn on listening and strum, or check it by ear.'}</small></div></div>
        <div class="chroma" id="ck-chroma">${Array.from({ length: 12 }, (_, pc) => `<div class="cb${pcs.includes(pc) ? ' want' : ''}"><i style="--c:${noteColor(pc)}"></i><span>${noteName(pc)}</span></div>`).join('')}</div>
        <p class="check-why" id="ck-msg">${res || ''}</p>
        <div class="wrap"><button class="btn btn-primary" id="ck-mic">${ICONS.mic}${micOn ? 'Stop listening' : 'Listen to my guitar'}</button><button class="btn" id="ck-hear">${ICONS.strum}Hear it</button><button class="btn" id="ck-self">I played it cleanly</button></div>`;
      $('#ck-hear', k.box).addEventListener('click', () => strum(v.frets));
      $('#ck-self', k.box).addEventListener('click', () => finish());
      $('#ck-mic', k.box).addEventListener('click', async () => {
        if (micOn) { Mic.stop(); micOn = false; paint(); return; }
        try { await Mic.start(() => {}); Mic.chromaCb = onChroma; micOn = true; paint('Listening…'); } catch (e) { micError(e); }
      });
    };
    let lastMsg = 0;
    const onChroma = (c) => {
      const bars = $$('#ck-chroma .cb i', k.box);
      bars.forEach((b, pc) => (b.style.height = c ? Math.round(6 + c[pc] * 94) + '%' : '6%'));
      if (!c) { good = Math.max(0, good - 1); return; }
      const r = checkChord(c, pcs);
      if (r.ok) { good++; if (good >= 4) finish(true); }
      else {
        good = 0;
        if (performance.now() - lastMsg > 1200 && r.missing.length) {
          lastMsg = performance.now();
          const strs = v.frets.map((f, s) => ({ f, s })).filter((x) => x.f >= 0 && r.missing.includes(midiAt(x.s, x.f) % 12)).map((x) => ordinal(stringNumber(x.s)));
          const msg = $('#ck-msg', k.box); if (msg) msg.textContent = `Not hearing ${r.missing.map(noteName).join(', ')} yet${strs.length ? `. Check the ${strs.join(' and ')} string${strs.length > 1 ? 's' : ''}: press closer to the fret and let it ring.` : '.'}`;
          v.frets.forEach((f, s) => { if (f >= 0 && r.missing.includes(midiAt(s, f) % 12)) Neck.pluck(s, f, '#ff6b7a'); });
        }
      }
    };
    const finish = (heard) => { if (Mic.active) Mic.stop(); micOn = false; if (heard) toast(`Heard a clean ${name}`, 1400); api.onCell = null; k.done(); };
    paint();
    const api = { redraw: draw, stop() { if (Mic.active) Mic.stop(); }, onCell(s, f) { Neck.play(s, f); } };
    return api;
  },
};
// generators used by the curriculum
function drillGen(stringsList, a, b, naturals = true) {
  return () => {
    const s = rand(stringsList);
    let f; do { f = a + Math.floor(Math.random() * (b - a + 1)); } while (naturals && !IS_NATURAL[midiAt(s, f) % 12]);
    return { s, f, pc: midiAt(s, f) % 12, a, b };
  };
}
function celebrate() {
  if (reduceMotion()) return;
  const cells = allCells((m, s, f) => f > 0 && f <= 12).sort(() => Math.random() - 0.5).slice(0, 18);
  cells.forEach((c, i) => setTimeout(() => { Neck.pluck(c.s, c.f, noteGlow(c.pc)); }, i * 45));
  [0, 4, 7, 12].forEach((iv, i) => Sound.play(60 + iv, 0.05 + i * 0.09, 0.35));
}

/* ================= Path (Learn home) ================= */
const Path = {
  id: 'path', nav: 'Path', title: 'Your learning path',
  help: 'Six levels, from your first string names to seeing the whole neck. Follow the glowing lesson, or jump to anything that interests you.',
  noNeck: true,
  mount(p) { this.p = p; if (Player.active) Player.close(true); this.show(); },
  unmount() { if (Player.active) Player.close(true); },
  show() {
    if (current !== this) { setMode('path'); return; }
    setStage(false); Neck.onCell = (s, f) => Neck.play(s, f);
    $('#mode-title').textContent = this.title; $('#mode-help').textContent = this.help;
    const p = this.p; const nx = nextLesson(); const cur = currentLevelIndex();
    const all = allLessons(); const doneN = all.filter((x) => S.learn.done[x.ls.id]).length;
    const pct = Math.round(100 * doneN / all.length);
    const C = 2 * Math.PI * 34;
    p.innerHTML = `
      <div class="roadmap">
        <div class="rm-ring"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="7"/><circle cx="40" cy="40" r="34" fill="none" stroke="#ffc857" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - doneN / all.length)}" transform="rotate(-90 40 40)"/></svg><div><b>${pct}%</b><small>${doneN}/${all.length}</small></div></div>
        <div class="rm-track">
          ${CURRICULUM.map((lv, li) => { const pr = levelProgress(lv); return `<button class="rm-seg${li === cur ? ' here' : ''}${pr.done === pr.total ? ' full' : ''}" data-lv="${li}" title="${esc(lv.title)}: ${pr.done} of ${pr.total}">
            <span class="rm-bar"><i style="width:${pr.pct * 100}%"></i></span>
            <span class="rm-name"><b>${li + 1}</b> ${esc(lv.title)}</span>
            <span class="rm-rank">${LEVEL_NAMES[li]}</span>
            ${li === cur ? '<span class="rm-pin">You are here</span>' : ''}</button>`; }).join('')}
        </div>
      </div>
      ${this.welcomeHTML()}${this.reviewHTML()}
      ${nx && !this.showWelcome() ? `<div class="next-card" style="--c:${KIND_COLORS[nx.ls.kind]}">
        <div class="nc-icon">${ICONS[KIND_ICONS[nx.ls.kind]]}</div>
        <div class="nc-txt"><small>Up next: level ${nx.li + 1}, lesson ${nx.i + 1}</small><h2>${esc(nx.ls.title)}</h2><p>${esc(nx.ls.blurb)}</p></div>
        <button class="btn btn-primary btn-big" id="pt-go">${ICONS.play}Start lesson</button></div>`
        : this.showWelcome() ? '' : `<div class="next-card" style="--c:#5ee6a8"><div class="nc-icon">${ICONS.star}</div><div class="nc-txt"><small>Path complete</small><h2>You finished every lesson</h2><p>Keep your streak alive in Practice, or jam over a backing track in Play.</p></div><button class="btn btn-primary btn-big" data-goto="jam">${ICONS.play}Open Jam</button></div>`}
      <div class="levels">${CURRICULUM.map((lv, li) => this.levelHTML(lv, li, cur)).join('')}</div>
      <p class="path-foot muted">Already play a bit? <button class="linkish" id="pt-place">Retake the placement quiz</button> to jump ahead.</p>`;
    const go = $('#pt-go', p); if (go) go.addEventListener('click', () => this.startLesson(nx.ls.id));
    const wn = $('#wl-new', p); if (wn) wn.addEventListener('click', () => { S.learn.welcomed = true; persist(); this.startLesson(nx.ls.id); });
    const wp = $('#wl-place', p); if (wp) wp.addEventListener('click', () => this.placement());
    const rv = $('#rv-go', p); if (rv) rv.addEventListener('click', () => this.review());
    const pl = $('#pt-place', p); if (pl) pl.addEventListener('click', () => this.placement());
    $$('[data-goto]', p).forEach((b) => b.addEventListener('click', () => setMode(b.dataset.goto)));
    $$('.rm-seg', p).forEach((b) => b.addEventListener('click', () => { const li = +b.dataset.lv; S.learn.open[li] = true; persist(); this.show(); const el = $(`#lv-${li}`); if (el) el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' }); }));
    $$('.lv-toggle', p).forEach((b) => b.addEventListener('click', () => { const li = +b.dataset.lv; S.learn.open[li] = !this.isOpen(li, cur); persist(); this.show(); }));
    $$('.node', p).forEach((b) => b.addEventListener('click', () => this.startLesson(b.dataset.id)));
    $$('.lv-guide', p).forEach((b) => b.addEventListener('click', () => { Theory.focus = +b.dataset.lv; setMode('theory'); }));
    $$('.lv-test', p).forEach((b) => b.addEventListener('click', () => this.testOut(+b.dataset.lv)));
  },
  isOpen(li, cur) { return S.learn.open[li] != null ? S.learn.open[li] : li === cur; },
  levelHTML(lv, li, cur) {
    const pr = levelProgress(lv); const open = this.isOpen(li, cur); const nx = nextLesson(); const dueSet = new Set(dueReviews());
    return `<section class="level${open ? ' open' : ''}${li === cur ? ' current' : ''}" id="lv-${li}">
      <header class="lv-head">
        <div class="lv-num">${pr.done === pr.total ? ICONS.check : li + 1}</div>
        <div class="lv-txt"><small>Level ${li + 1}, ${LEVEL_NAMES[li]}</small><h3>${esc(lv.title)}</h3><p>${esc(lv.blurb)}</p></div>
        <div class="lv-meta"><span class="lv-count">${pr.done} of ${pr.total}</span>
          <div class="lv-actions"><button class="chip lv-guide" data-lv="${li}">${ICONS.book}Guidebook</button>
          ${pr.done < pr.total ? `<button class="chip lv-test" data-lv="${li}">Already know this? Test out</button>` : ''}
          <button class="chip lv-toggle" data-lv="${li}" aria-expanded="${open}">${open ? 'Hide lessons' : 'Show lessons'}</button></div></div>
      </header>
      ${open ? `<div class="nodes">${lv.lessons.map((ls, i) => {
        const st = S.learn.done[ls.id] || 0; const isNext = nx && nx.ls.id === ls.id;
        const off = [0, 1, 2, 1, 0, -1, -2, -1][i % 8];
        return `<div class="node-row" style="--off:${off}"><button class="node${st ? ' done' : ''}${isNext ? ' next' : ''}" data-id="${ls.id}" style="--c:${KIND_COLORS[ls.kind]}" aria-label="${esc(ls.title)}${st ? `, ${st} stars` : ''}">${ICONS[KIND_ICONS[ls.kind]]}${isNext ? '<span class="node-go">Start</span>' : ''}</button>
          <div class="node-label"><b>${esc(ls.title)}</b><span>${KIND_NAMES[ls.kind]}, ${ls.mins} min${dueSet.has(ls.id) ? ' <em class="due">Review due</em>' : ''}</span>${st ? ((S.learn.skip || {})[ls.id] ? '<span class="placed">Placed out</span>' : `<span class="stars">${[1, 2, 3].map((k) => `<i class="${k <= st ? 'on' : ''}">${ICONS.star}</i>`).join('')}</span>`) : ''}</div></div>`;
      }).join('')}</div>` : ''}
    </section>`;
  },
  showWelcome() { return !S.learn.welcomed && !Object.keys(S.learn.done).length; },
  welcomeHTML() {
    if (!this.showWelcome()) return '';
    return `<div class="welcome">
      <div><h2>Welcome to Fretwave</h2><p>Where should you start? Brand new players begin at lesson 1. If you already play, a 3-minute placement quiz skips what you know.</p></div>
      <div class="welcome-btns"><button class="btn btn-primary btn-big" id="wl-new">${ICONS.play}I'm new: start lesson 1</button><button class="btn btn-big" id="wl-place">${ICONS.find}I already play: find my level</button></div></div>`;
  },
  reviewHTML() {
    const due = dueReviews(); if (!due.length || this.showWelcome()) return '';
    const names = due.slice(0, 3).map((id) => lessonById(id).ls.title);
    return `<div class="review-card"><div class="rv-icon">${ICONS.replay}</div><div class="nc-txt"><small>Spaced review</small><h3>${due.length} lesson${due.length > 1 ? 's' : ''} ready for a quick refresh</h3><p>${esc(names.join(', '))}${due.length > 3 ? ' and more' : ''}. About ${Math.min(5, due.length) * 30} seconds.</p></div><button class="btn btn-big" id="rv-go">Start review</button></div>`;
  },
  review() {
    const ids = dueReviews().slice(0, 5); if (!ids.length) return;
    const steps = [{ t: `Quick review: one question from each of ${ids.length} lesson${ids.length > 1 ? 's' : ''}. Things you remember come back less often; things you miss come back tomorrow.` }];
    ids.forEach((id) => { const x = lessonById(id); const st = x.ls.steps.find((s) => s.check); if (!st) return; const c = st.check; steps.push({ t: `From “${x.ls.title}”: ${st.t}`, show: st.show, rid: id, check: c.gen ? Object.assign({}, c, { n: 1 }) : c.items ? Object.assign({}, c, { items: [rand(c.items)] }) : c }); });
    if (current !== this) setMode('path');
    $('#mode-title').textContent = 'Review';
    Player.open(steps, { title: 'Spaced review', kicker: `${ids.length} lessons`, onDone: () => {
      let ok = 0; steps.forEach((s, i) => { if (!s.rid) return; const pass = !(Player.stepMiss[i] > 0); if (pass) ok++; scheduleReview(s.rid, pass); }); persist();
      return { headline: `${ok} of ${steps.length - 1} remembered`, sub: ok === steps.length - 1 ? 'Solid. These will come back in a few days.' : 'The ones you missed come back tomorrow. That is how they stick.' };
    } });
  },
  placement() {
    const Q = (lv, check, t) => ({ t: t || `Question about level ${lv + 1}`, lv, check });
    const steps = [
      { t: 'Answer what you can and press “Skip this check” for anything you don’t know. Fretwave will start you at the first level with something new for you.' },
      Q(0, { type: 'tap', items: [{ prompt: 'Tap the open <b>G</b> string.', target: (s, f) => s === 3 && f === 0 }] }),
      Q(0, { type: 'tap', items: [{ prompt: 'Tap <b>A</b> on the 6th string (frets 1 to 12).', target: (s, f) => s === 0 && f === 5 }] }),
      Q(1, { type: 'quiz', items: [{ q: 'A major chord is built from…', options: ['Root, 3rd and 5th', 'Root, 4th and 6th', 'Root, 2nd and 7th'], answer: 0 }] }),
      Q(1, { type: 'ear', n: 1, gen: () => { const k = Math.random() < 0.5 ? 0 : 1; const r = rand([0, 2, 7, 9]); return { q: 'Major or minor?', options: ['Major', 'Minor'], answer: k, play: () => hearChords([[r, k ? 'min' : 'maj']]) }; } }),
      Q(2, { type: 'quiz', items: [{ q: 'How many sharps are in D major?', options: ['One', 'Two', 'Three'], answer: 1 }] }),
      Q(2, { type: 'quiz', items: [{ q: 'In the key of G, the IV chord is…', options: ['C', 'D', 'Am'], answer: 0 }] }),
      Q(3, { type: 'quiz', items: [{ q: 'A pull-off means…', options: ['Picking the same note twice', 'Pulling a finger off so a lower note rings', 'Bending the string down'], answer: 1 }] }),
      Q(3, { type: 'ear', n: 1, gen: () => { const k = Math.random() < 0.5 ? 0 : 1; return { q: 'Bend or slide?', options: ['Bend', 'Slide'], answer: k, play: () => (k ? Tech.slide(3, 7, 9, 0.1, 0.42, true) : Tech.bend(3, 7, 2, 0.1, { quiet: true })) }; } }),
      Q(4, { type: 'quiz', items: [{ q: 'Which degrees make the minor pentatonic?', options: ['1 ♭3 4 5 ♭7', '1 2 3 5 6', '1 2 ♭3 5 ♭6'], answer: 0 }] }),
      Q(4, { type: 'tap', items: [{ prompt: 'Tap any <b>A</b> between frets 5 and 8.', target: (s, f, m) => m % 12 === 9 && f >= 5 && f <= 8, show: (L) => L.shade([5, 8]) }] }),
      Q(5, { type: 'quiz', items: [{ q: 'D Dorian uses the same notes as…', options: ['C major', 'D major', 'G major'], answer: 0 }] }),
      Q(5, { type: 'quiz', items: [{ q: 'In CAGED, which shape comes after A?', options: ['G', 'E', 'D'], answer: 0 }] }),
    ];
    if (current !== this) setMode('path');
    $('#mode-title').textContent = 'Placement quiz';
    Player.open(steps, { title: 'Placement quiz', kicker: '12 quick questions', onDone: () => {
      let placed = CURRICULUM.length;
      for (let lv = 0; lv < CURRICULUM.length; lv++) { if (steps.some((s, i) => s.lv === lv && Player.stepMiss[i] > 0)) { placed = lv; break; } }
      S.learn.skip = S.learn.skip || {};
      CURRICULUM.forEach((lv, li) => { if (li < placed) lv.lessons.forEach((ls) => { if (!S.learn.done[ls.id]) { S.learn.done[ls.id] = 1; S.learn.skip[ls.id] = true; } }); });
      S.learn.welcomed = true; S.learn.placed = placed; persist(); renderDaily();
      if (placed >= CURRICULUM.length) return { headline: 'You know it all', sub: 'Every level is marked done. Lessons are still there whenever you want a refresher.' };
      return { headline: placed === 0 ? 'Start at level 1' : `You start at level ${placed + 1}`, sub: `“${CURRICULUM[placed].title}” is where the new material begins.${placed ? ' Earlier levels are marked as placed out; open any of them for a refresher.' : ''}` };
    } });
  },
  startLesson(id) {
    const x = lessonById(id); if (!x) return;
    if (current !== this) setMode('path');
    S.learn.last = id; persist();
    $('#mode-title').textContent = x.ls.title; $('#mode-help').textContent = x.ls.blurb;
    Player.open(x.ls.steps, {
      title: x.ls.title, kicker: `Level ${x.li + 1}, lesson ${x.i + 1}`,
      onDone: (stars) => { logActivity('l'); { const t = today(); if (S.daily.last !== t) { S.daily.streak = S.daily.last === yesterday() ? S.daily.streak + 1 : 1; S.daily.last = t; } } S.learn.done[id] = Math.max(S.learn.done[id] || 0, stars); if (S.learn.skip) delete S.learn.skip[id]; if (!(S.learn.review || {})[id]) scheduleReview(id, stars === 3); persist(); renderDaily(); const lp = levelProgress(x.lv); if (lp.done === lp.total) return { headline: `Level ${x.li + 1} complete!`, sub: `You finished “${x.lv.title}”. On to ${CURRICULUM[x.li + 1] ? '“' + CURRICULUM[x.li + 1].title + '”' : 'the Jam room'}.` }; return null; },
    });
  },
  testOut(li) {
    const lv = CURRICULUM[li];
    const steps = lv.lessons.map((ls) => ls.steps.find((s) => s.check)).filter(Boolean).map((s) => ({ t: s.t, show: s.show, html: s.html, check: s.check.gen ? Object.assign({}, s.check, { n: 1 }) : s.check.items ? Object.assign({}, s.check, { items: s.check.items.slice(0, 1) }) : s.check }));
    steps.unshift({ t: `Test out of level ${li + 1}: one quick question from each lesson. Make two mistakes or fewer and the whole level is marked complete.` });
    if (current !== this) setMode('path');
    $('#mode-title').textContent = `Test out: ${lv.title}`;
    Player.open(steps, {
      title: `Test out: ${lv.title}`, kicker: `Level ${li + 1}`,
      onDone: (stars, mistakes) => {
        if (mistakes <= 2) { lv.lessons.forEach((ls) => { S.learn.done[ls.id] = Math.max(S.learn.done[ls.id] || 0, 2); }); persist(); return { headline: `Level ${li + 1} unlocked`, sub: 'Every lesson in this level is marked done. Replay any of them for three stars.' }; }
        return { headline: 'Not quite yet', sub: `${mistakes} mistakes. Work through the lessons first, they're short.` };
      },
    });
  },
  onKey(e) { if (Player.active) Player.onKey(e); },
};
const KIND_ICONS = { neck: 'explore', theory: 'book', ear: 'ear', chord: 'chords', play: 'jam' };
const KIND_NAMES = { neck: 'On the neck', theory: 'Theory', ear: 'Ear', chord: 'Chords', play: 'Play along' };
const KIND_COLORS = { neck: '#5aa9ff', theory: '#c69cff', ear: '#6fe0d6', chord: '#ffd166', play: '#ff7b54' };

/* ================= Theory notes (guidebooks) ================= */
const Theory = {
  id: 'theory', nav: 'Theory notes', title: 'Theory notes',
  help: 'The cheat sheet for every level: the facts worth remembering, in one place. Tap a lesson title to see it animated on the neck.',
  noNeck: true, focus: null,
  mount(p) {
    setStage(false);
    const cur = currentLevelIndex();
    p.innerHTML = `${printablesHTML()}<div class="guides">${CURRICULUM.map((lv, li) => `<details class="guide" id="gd-${li}" ${(this.focus ?? cur) === li ? 'open' : ''}>
      <summary><span class="lv-num small">${li + 1}</span><span><b>${esc(lv.title)}</b><small>${esc(lv.blurb)}</small></span></summary>
      <div class="guide-body">${lv.guide.map(([h, body]) => `<div class="g-item"><h4>${h}</h4><div>${body}</div></div>`).join('')}
      <div class="g-lessons"><span class="muted">Lessons:</span>${lv.lessons.map((ls) => `<button class="chip" data-id="${ls.id}">${S.learn.done[ls.id] ? ICONS.check : ''}${esc(ls.title)}</button>`).join('')}<button class="chip" data-print-level="${li}">${ICONS.download}Print this guidebook</button></div></div></details>`).join('')}</div>`;
    wirePrintables(p);
    $$('.g-lessons .chip', p).forEach((b) => b.addEventListener('click', () => { setMode('path'); Path.startLesson(b.dataset.id); }));
    if (this.focus != null) { const el = $(`#gd-${this.focus}`); if (el) setTimeout(() => el.scrollIntoView({ block: 'start' }), 50); this.focus = null; }
  },
};

/* ================= Ear training ================= */
const Ear = {
  id: 'ear', nav: 'Ear', title: 'Ear training',
  help: 'Listen first, then answer. After each answer the neck draws the shape you just heard, so the sound and the picture lock together.',
  ex: 'intervals', set: [3, 4, 5, 7, 12], dir: 'up', chordSet: ['maj', 'min', '7', 'dim'], q: null, score: { ok: 0, n: 0, streak: 0 },
  mount(p) {
    this.p = p; this.q = null;
    p.innerHTML = `<div class="panel-grid">
      <div class="controls">
        <div class="ear-top">
          <button class="play-orb" id="ear-play" aria-label="Play the sound">${ICONS.play}</button>
          <div><div class="verdict" id="ear-verdict">Press play and listen.</div><p class="muted" id="ear-sub" style="margin:4px 0 0">Then pick what you heard below.</p>
          <div class="wrap" style="margin-top:12px"><button class="btn" id="ear-next" hidden>Next sound</button></div></div>
        </div>
        <div class="answers" id="ear-answers"></div>
      </div>
      <div class="controls">
        <div class="row"><span class="lbl">Practice</span>${seg('ear-ex', [['intervals', 'Intervals'], ['chords', 'Chord quality']], this.ex)}</div>
        <div id="ear-opts" class="controls"></div>
      </div></div>`;
    wireSeg(p, 'ear-ex', (v) => { this.ex = v; this.q = null; this.renderOpts(); this.renderAnswers(); this.reset(); });
    $('#ear-play', p).addEventListener('click', () => (this.q && !this.q.done ? this.hear() : this.newQ()));
    $('#ear-next', p).addEventListener('click', () => this.newQ());
    this.renderOpts(); this.renderAnswers(); this.reset();
  },
  reset() { Neck.clear(); $('#hud').innerHTML = this.hudHTML(); $('#ear-verdict', this.p).textContent = 'Press play and listen.'; $('#ear-verdict', this.p).className = 'verdict'; $('#ear-next', this.p).hidden = true; },
  hudHTML() { const s = this.score; return `<div class="prompt muted" style="font-weight:500;font-size:20px">${this.ex === 'intervals' ? 'How far apart are the two notes?' : 'What kind of chord is that?'}</div>${hudStats([[s.n ? Math.round(100 * s.ok / s.n) + '%' : '–', 'Accuracy'], [s.ok, 'Correct'], [s.streak, 'Streak', s.streak >= 5]])}`; },
  renderOpts() {
    const box = $('#ear-opts', this.p);
    if (this.ex === 'intervals') {
      box.innerHTML = `<div class="row row-wide"><span class="lbl">Intervals in the mix</span><div class="wrap" id="ear-set">${INTERVALS.map((iv) => `<button type="button" class="chip" data-v="${iv.semi}" aria-pressed="${this.set.includes(iv.semi)}">${iv.short}</button>`).join('')}</div></div>
        <div class="row"><span class="lbl">Direction</span>${seg('ear-dir', [['up', 'Rising'], ['down', 'Falling'], ['both', 'Together']], this.dir)}</div>`;
      $('#ear-set', box).addEventListener('click', (e) => {
        const b = e.target.closest('.chip'); if (!b) return; const v = +b.dataset.v;
        if (this.set.includes(v)) { if (this.set.length <= 2) { toast('Keep at least two intervals to choose from.'); return; } this.set = this.set.filter((x) => x !== v); } else this.set.push(v);
        b.setAttribute('aria-pressed', this.set.includes(v)); this.q = null; this.renderAnswers(); this.reset();
      });
      wireSeg(box, 'ear-dir', (v) => { this.dir = v; });
    } else {
      box.innerHTML = `<div class="row row-wide"><span class="lbl">Chord types in the mix</span><div class="wrap" id="ear-cset">${CHORD_TYPES.filter((c) => c.id !== '5').map((c) => `<button type="button" class="chip" data-v="${c.id}" aria-pressed="${this.chordSet.includes(c.id)}">${c.name}</button>`).join('')}</div></div>`;
      $('#ear-cset', box).addEventListener('click', (e) => {
        const b = e.target.closest('.chip'); if (!b) return; const v = b.dataset.v;
        if (this.chordSet.includes(v)) { if (this.chordSet.length <= 2) { toast('Keep at least two chord types to choose from.'); return; } this.chordSet = this.chordSet.filter((x) => x !== v); } else this.chordSet.push(v);
        b.setAttribute('aria-pressed', this.chordSet.includes(v)); this.q = null; this.renderAnswers(); this.reset();
      });
    }
  },
  renderAnswers() {
    const box = $('#ear-answers', this.p);
    if (this.ex === 'intervals') {
      box.innerHTML = INTERVALS.filter((iv) => this.set.includes(iv.semi)).map((iv) => `<button type="button" class="answer" data-v="${iv.semi}"><b>${iv.name}</b><small>${iv.song}</small></button>`).join('');
    } else {
      const feel = { maj: 'Bright, stable', min: 'Sad, soft', '7': 'Bluesy, wants to move', maj7: 'Dreamy, jazzy', m7: 'Mellow, smooth', sus2: 'Open, airy', sus4: 'Suspended, unresolved', '6': 'Sweet, vintage', add9: 'Shimmering', dim: 'Tense, spooky', aug: 'Eerie, rising', m7b5: 'Dark, jazzy tension' };
      box.innerHTML = CHORD_TYPES.filter((c) => this.chordSet.includes(c.id)).map((c) => `<button type="button" class="answer" data-v="${c.id}"><b>${c.name}</b><small>${feel[c.id] || ''}</small></button>`).join('');
    }
    $$('.answer', box).forEach((b) => b.addEventListener('click', () => this.answer(b.dataset.v, b)));
  },
  newQ() {
    Sound.ensure(); Neck.clear();
    $$('#ear-answers .answer', this.p).forEach((b) => { b.classList.remove('right', 'wrong'); b.disabled = false; });
    $('#ear-next', this.p).hidden = true;
    $('#ear-verdict', this.p).textContent = 'Listen…'; $('#ear-verdict', this.p).className = 'verdict';
    $('#ear-sub', this.p).textContent = 'Press the orb to hear it again.';
    if (this.ex === 'intervals') {
      const semi = rand(this.set);
      const n = strings().length, F = Math.min(S.settings.frets, 12);
      // place the lower note so the upper one fits nearby on the neck
      const lowCells = allCells((m, s, f) => s < n - 1 && f <= 7 && f >= 0, F);
      let a, b, tries = 0;
      do {
        a = rand(lowCells);
        const target = a.midi + semi;
        const cands = allCells((m) => m === target, F).filter((c) => !(c.s === a.s && c.f === a.f));
        b = cands.sort((x, y) => (Math.abs(x.f - a.f) + Math.abs(x.s - a.s) * 0.6) - (Math.abs(y.f - a.f) + Math.abs(y.s - a.s) * 0.6))[0];
      } while (!b && ++tries < 40);
      if (!b) { toast('Could not place that interval on this neck. Try another.'); return; }
      const dir = this.dir;
      this.q = { kind: 'iv', semi, a, b, dir };
    } else {
      const id = rand(this.chordSet), t = chordType(id);
      const root = Math.floor(Math.random() * 12);
      const vs = findVoicings(root, t.iv, 12);
      const v = vs.find((x) => x.base <= 7) || vs[0];
      if (!v) return this.newQ();
      this.q = { kind: 'ch', id, root, v };
    }
    this.hear();
  },
  hear() {
    const q = this.q; if (!q) return;
    const orb = $('#ear-play', this.p); orb.classList.add('playing'); setTimeout(() => orb.classList.remove('playing'), 1300);
    if (q.kind === 'iv') {
      const [first, second] = q.dir === 'down' ? [q.b, q.a] : [q.a, q.b];
      if (q.dir === 'both') { Sound.play(first.midi, 0.02); Sound.play(second.midi, 0.02); }
      else { Sound.play(first.midi, 0.02); Sound.play(second.midi, 0.75); }
    } else {
      const order = q.v.frets.map((f, s) => ({ f, s })).filter((x) => x.f >= 0);
      order.forEach((x, i) => Sound.play(strings()[x.s] + x.f, 0.02 + i * 0.035, 0.42));
    }
  },
  answer(v, btn) {
    const q = this.q;
    if (!q || q.done) { if (!q) toast('Press play first.'); return; }
    const right = q.kind === 'iv' ? +v === q.semi : v === q.id;
    if (right) {
      q.done = true; btn.classList.add('right');
      if (!q.missed) { this.score.ok++; this.score.streak++; } else this.score.streak = 0;
      this.score.n++;
      this.reveal(true);
    } else {
      btn.classList.add('wrong'); btn.disabled = true; q.missed = true;
      $('#ear-verdict', this.p).textContent = 'Not that one. Listen again.'; $('#ear-verdict', this.p).className = 'verdict bad';
      this.hear();
      if ($$('#ear-answers .answer:not([disabled])', this.p).length <= 1) { q.done = true; this.score.n++; this.score.streak = 0; this.reveal(false); }
    }
    $('#hud').innerHTML = this.hudHTML();
  },
  reveal(good) {
    const q = this.q;
    $$('#ear-answers .answer', this.p).forEach((b) => { if ((q.kind === 'iv' ? +b.dataset.v === q.semi : b.dataset.v === q.id)) b.classList.add('right'); });
    const vd = $('#ear-verdict', this.p);
    if (q.kind === 'iv') {
      const iv = INTERVALS.find((x) => x.semi === q.semi);
      vd.textContent = (good ? (q.missed ? 'Got it: ' : 'Yes! ') : 'It was a ') + iv.name;
      $('#ear-sub', this.p).textContent = `${q.dir === 'down' ? noteName(q.b.pc) + ' down to ' + noteName(q.a.pc) : q.dir === 'both' ? noteName(q.a.pc) + ' with ' + noteName(q.b.pc) : noteName(q.a.pc) + ' up to ' + noteName(q.b.pc)}. Remember the shape on the neck, and think “${iv.song}”.`;
      Neck.clear();
      Neck.link(q.a, q.b, iv.short, '#ffc857');
      Neck.noteMark(q.a.s, q.a.f, { ring: true }); Neck.noteMark(q.b.s, q.b.f, { ring: true, delay: 200 });
      Neck.play(q.a.s, q.a.f, 0.3); Neck.play(q.b.s, q.b.f, 0.9);
      Neck.scrollTo(Math.round((q.a.f + q.b.f) / 2));
    } else {
      const t = chordType(q.id);
      vd.textContent = (good ? (q.missed ? 'Got it: ' : 'Yes! ') : 'It was ') + `${noteName(q.root)}${t.sym}, a ${t.name.toLowerCase()} chord`;
      $('#ear-sub', this.p).textContent = 'The neck shows the shape. Colors mark the root, 3rd, 5th and 7th.';
      Neck.clear(); drawVoicing(q.v, q.root, t.iv, { stagger: true }); strum(q.v.frets, { at: 0.3 });
      Neck.scrollTo(q.v.base + 1);
    }
    vd.className = 'verdict ' + (good && !q.missed ? 'good' : good ? '' : 'bad');
    $('#ear-next', this.p).hidden = false;
    $('#ear-next', this.p).focus({ preventScroll: true });
  },
  onCell(s, f) { Neck.play(s, f); },
  onKey(e) { if (e.code === 'Space') { e.preventDefault(); this.q && !this.q.done ? this.hear() : this.newQ(); } },
};

/* ================= Tuner ================= */
const Tuner = {
  id: 'tuner', nav: 'Tuner', title: 'Tuner',
  help: 'Tap a string to hear its target pitch, or turn on the mic and tune until the needle sits in the green.',
  repeat: null, smooth: null,
  mount(p) {
    this.p = p; this.smooth = null;
    const ticks = Array.from({ length: 21 }, (_, i) => { const a = (-45 + i * 4.5) * Math.PI / 180; const r1 = i % 5 === 0 ? 140 : 150; return `<line x1="${200 + Math.sin(a) * r1}" y1="${200 - Math.cos(a) * r1}" x2="${200 + Math.sin(a) * 166}" y2="${200 - Math.cos(a) * 166}" stroke="${i === 10 ? '#5ee6a8' : '#8c86a8'}" stroke-width="${i % 5 === 0 ? 3 : 1.5}" stroke-linecap="round"/>`; }).join('');
    p.innerHTML = `<div class="tuner">
      <div>
        <svg class="dial" viewBox="0 0 400 225" aria-hidden="true">
          <path d="M ${200 - 170 * Math.sin(Math.PI / 4)} ${200 - 170 * Math.cos(Math.PI / 4)} A 170 170 0 0 1 ${200 + 170 * Math.sin(Math.PI / 4)} ${200 - 170 * Math.cos(Math.PI / 4)}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="34"/>
          <path d="M ${200 - 170 * Math.sin(Math.PI / 60)} ${200 - 170 * Math.cos(Math.PI / 60)} A 170 170 0 0 1 ${200 + 170 * Math.sin(Math.PI / 60)} ${200 - 170 * Math.cos(Math.PI / 60)}" fill="none" stroke="rgba(94,230,168,.35)" stroke-width="34"/>
          ${ticks}
          <text x="${200 - 180 * Math.sin(Math.PI / 4) - 6}" y="${200 - 180 * Math.cos(Math.PI / 4) - 6}" fill="#b8b1cc" font-size="14" text-anchor="middle">flat</text>
          <text x="${200 + 180 * Math.sin(Math.PI / 4) + 6}" y="${200 - 180 * Math.cos(Math.PI / 4) - 6}" fill="#b8b1cc" font-size="14" text-anchor="middle">sharp</text>
          <g class="needle" id="tn-needle"><line x1="200" y1="200" x2="200" y2="48" stroke="#ffc857" stroke-width="4" stroke-linecap="round"/></g>
          <circle cx="200" cy="200" r="10" fill="#ffc857"/>
        </svg>
        <div class="tuner-read"><b id="tn-note">–</b><div id="tn-cents">Turn on the mic to start</div></div>
      </div>
      <div class="controls">
        <div><p class="muted" style="margin:0 0 10px">Tap a string to hear the pitch it should be. Turn on repeat to loop it while you tune by ear.</p>
          <div class="ref-strings" id="tn-refs">${strings().map((m, s) => ({ m, s })).map(({ m, s }) => `<button type="button" class="ref-btn" data-s="${s}" style="--c:${noteColor(m % 12)}"><span>${noteName(m % 12)}<br><small>${ordinal(stringNumber(s))}</small></span></button>`).join('')}</div></div>
        <div class="wrap"><label class="switch"><input type="checkbox" id="tn-rep">Repeat the reference note</label></div>
        <div class="wrap"><button class="btn btn-primary btn-big" id="tn-mic">${ICONS.mic}Turn on the mic</button></div>
      </div></div>`;
    $('#tn-refs', p).addEventListener('click', (e) => {
      const b = e.target.closest('.ref-btn'); if (!b) return; const s = +b.dataset.s;
      clearInterval(this.repeat); Neck.play(s, 0);
      Neck.clear(); Neck.noteMark(s, 0, { ring: true, cls: 'pulse' });
      if ($('#tn-rep', p).checked) this.repeat = setInterval(() => Neck.play(s, 0), 2400);
    });
    $('#tn-rep', p).addEventListener('change', (e) => { if (!e.target.checked) clearInterval(this.repeat); });
    $('#tn-mic', p).addEventListener('click', async () => {
      if (Mic.active) { Mic.stop(); $('#tn-mic', p).innerHTML = `${ICONS.mic}Turn on the mic`; $('#tn-cents', p).textContent = 'Mic is off'; return; }
      try { await Mic.start((f) => this.onPitch(f)); $('#tn-mic', p).innerHTML = `${ICONS.stop}Turn off the mic`; $('#tn-cents', p).textContent = 'Play one string at a time'; } catch (err) { micError(err); }
    });
    strings().forEach((m, s) => Neck.noteMark(s, 0, {}));
  },
  unmount() { clearInterval(this.repeat); if (Mic.active) Mic.stop(); },
  onPitch(f) {
    if (f <= 0) return;
    const mf = 69 + 12 * Math.log2(f / 440);
    this.smooth = this.smooth == null || Math.abs(this.smooth - mf) > 0.7 ? mf : this.smooth * 0.65 + mf * 0.35;
    const near = Math.round(this.smooth), cents = Math.round((this.smooth - near) * 100);
    const inTune = Math.abs(cents) <= 5;
    const noteEl = $('#tn-note', this.p); if (!noteEl) return;
    noteEl.textContent = noteName(near % 12) + octaveOf(near); noteEl.style.color = inTune ? 'var(--good)' : noteColor(near % 12);
    $('#tn-cents', this.p).textContent = inTune ? 'In tune' : `${Math.abs(cents)} cents ${cents < 0 ? 'flat, tighten' : 'sharp, loosen'}`;
    $('#tn-needle', this.p).style.transform = `rotate(${clamp(cents, -50, 50) * 0.9}deg)`;
    let best = 0; strings().forEach((m, s) => { if (Math.abs(m - this.smooth) < Math.abs(strings()[best] - this.smooth)) best = s; });
    if (Math.abs(strings()[best] - this.smooth) < 2.5 && this._lastBest !== best + ':' + inTune) {
      this._lastBest = best + ':' + inTune;
      Neck.clear(); strings().forEach((m, s) => Neck.noteMark(s, 0, { cls: s === best ? '' : 'dim', ring: s === best, ringColor: inTune ? '#5ee6a8' : '#ffc857' }));
    }
  },
  onCell(s, f) { Neck.play(s, f); },
};

/* ================= Progress ================= */
const Progress = {
  id: 'progress', nav: 'Progress', title: 'Your progress',
  help: 'The neck becomes a heat map of what you know. Green spots are solid, red spots need work. Smart order in the games already targets the red.',
  mount(p) {
    this.p = p; const t = today();
    const cells = allCells().map((c) => Object.assign(c, cellStat(c.s, c.f)));
    const seen = cells.filter((c) => c.n);
    const n = seen.reduce((a, c) => a + c.n, 0), ok = seen.reduce((a, c) => a + c.ok, 0), ms = seen.reduce((a, c) => a + c.ms, 0);
    const byPc = Array.from({ length: 12 }, (_, pc) => { const xs = seen.filter((c) => c.pc === pc); const nn = xs.reduce((a, c) => a + c.n, 0); return { pc, n: nn, acc: nn ? xs.reduce((a, c) => a + c.ok, 0) / nn : 0 }; });
    const todayCount = S.daily.date === t ? S.daily.count : 0;
    p.innerHTML = `<div class="stats-grid">
        <div class="stat"><b style="color:var(--amber)">${currentStreak()}</b><span>Day streak</span></div>
        <div class="stat"><b>${todayCount}<span class="muted" style="font-size:18px">/${S.settings.goal}</span></b><span>Notes practiced today</span></div>
        <div class="stat"><b>${n ? Math.round(100 * ok / n) + '%' : '–'}</b><span>First-try accuracy</span></div>
        <div class="stat"><b>${ok ? (ms / ok / 1000).toFixed(1) + 's' : '–'}</b><span>Average time to answer</span></div>
        <div class="stat"><b>${seen.length}<span class="muted" style="font-size:18px">/${cells.length}</span></b><span>Fret spots practiced</span></div>
      </div>
      <div class="panel-grid">
        <div class="surface"><p style="margin:0 0 14px"><b>Accuracy by note</b> <span class="muted">(bar height shows how often you get it right)</span></p>
          <div class="bars">${byPc.map((b) => `<div class="bar" title="${noteName(b.pc)}: ${b.n} answers"><small>${b.n ? Math.round(b.acc * 100) + '%' : ''}</small><i style="--c:${noteColor(b.pc)};height:${b.n ? Math.max(6, b.acc * 100) : 3}%;opacity:${b.n ? 1 : 0.25}"></i><span>${noteName(b.pc)}</span></div>`).join('')}</div>
        </div>
        <div class="controls">
          <div class="heat-legend"><span>Needs work</span><i></i><span>Solid</span></div>
          <p class="muted" style="margin:0">Numbers on the neck are your accuracy at each spot. Unmarked spots have not come up yet.</p>
          <div class="wrap"><button class="btn btn-primary btn-big" id="pg-drill">${ICONS.find}Drill my weak spots</button><button class="btn" id="pg-reset">Reset progress</button></div>
        </div>
      </div>`;
    seen.forEach((c) => {
      const acc = c.ok / c.n;
      const col = acc < 0.5 ? `hsl(${352 + acc * 2 * 40} 90% 68%)` : `hsl(${42 + (acc - 0.5) * 2 * 110} 80% 62%)`;
      Neck.mark(c.s, c.f, { label: Math.round(acc * 100), color: col, fontSize: 12, cls: c.n < 2 ? 'dim' : '' });
    });
    $('#pg-drill', p).addEventListener('click', () => { S.settings.drill.smart = true; S.settings.drill.range = 'all'; persist(); setMode('find'); Find.start(); });
    const rb = $('#pg-reset', p);
    rb.addEventListener('click', () => {
      if (!rb.dataset.armed) { rb.dataset.armed = '1'; rb.textContent = 'Tap again to erase all progress'; rb.style.borderColor = 'var(--bad)'; setTimeout(() => { if (rb.isConnected) { delete rb.dataset.armed; rb.textContent = 'Reset progress'; rb.style.borderColor = ''; } }, 3500); return; }
      S.stats = {}; S.daily = { date: '', count: 0, streak: 0, last: '' }; persist(); renderDaily(); Neck.clear(); this.mount(p); toast('Progress erased.');
    });
  },
  onCell(s, f) {
    Neck.play(s, f);
    const st = cellStat(s, f);
    toast(st.n ? `${noteName(midiAt(s, f) % 12)} here: ${st.ok} of ${st.n} right` : `${noteName(midiAt(s, f) % 12)} here: not practiced yet`, 1800);
  },
};

/* ================= Settings ================= */
function openSettings() {
  const st = S.settings, body = $('#settings-body');
  body.innerHTML = `
    <div class="row"><span class="lbl">Instrument</span>${seg('st-inst', Object.entries(INSTRUMENTS).map(([k, v]) => [k, v.name]), st.instrument)}</div>
    <div class="row"><span class="lbl">Tuning</span><select id="st-tun" aria-label="Tuning">${Object.entries(inst().tunings).map(([k, v]) => `<option value="${k}" ${k === st.tuning ? 'selected' : ''}>${v.name}</option>`).join('')}</select></div>
    <div class="row"><span class="lbl">Frets shown</span>${seg('st-frets', [['12', '12'], ['15', '15'], ['19', '19'], ['22', '22'], ['24', '24']], st.frets)}</div>
    <div class="row"><span class="lbl">Accidentals</span>${seg('st-acc', [['sharp', 'Sharps (C♯)'], ['flat', 'Flats (D♭)']], st.accidentals)}</div>
    <div class="row"><span class="lbl">Hand</span>${seg('st-hand', [['0', 'Right-handed'], ['1', 'Left-handed']], st.lefty ? '1' : '0')}</div>
    <div class="row"><span class="lbl">Volume</span><div class="slider"><input type="range" min="0" max="1" step="0.05" value="${st.volume}" id="st-vol" aria-label="Volume"><output id="st-vol-o">${Math.round(st.volume * 100)}%</output></div></div>
    <div class="row"><span class="lbl">Daily goal</span>${seg('st-goal', [['20', '20 notes'], ['40', '40 notes'], ['80', '80 notes'], ['150', '150 notes']], st.goal)}</div>
    <div class="row"><span class="lbl">Voice</span><label class="switch"><input type="checkbox" id="st-speak" ${st.speak ? 'checked' : ''}>Say note names aloud</label></div>`;
  const rebuild = () => { persist(); Neck.build(); remount(); };
  wireSeg(body, 'st-inst', (v) => {
    st.instrument = v; st.tuning = Object.keys(INSTRUMENTS[v].tunings)[0]; st.drill.strings = null; Sound.cache.clear();
    $('#st-tun').innerHTML = Object.entries(inst().tunings).map(([k, t]) => `<option value="${k}">${t.name}</option>`).join('');
    rebuild();
  });
  $('#st-tun').addEventListener('change', (e) => { st.tuning = e.target.value; rebuild(); });
  wireSeg(body, 'st-frets', (v) => { st.frets = +v; rebuild(); });
  wireSeg(body, 'st-acc', (v) => { st.accidentals = v; rebuild(); });
  wireSeg(body, 'st-hand', (v) => { st.lefty = v === '1'; rebuild(); });
  wireSeg(body, 'st-goal', (v) => { st.goal = +v; persist(); renderDaily(); });
  $('#st-vol').addEventListener('input', (e) => { st.volume = +e.target.value; $('#st-vol-o').textContent = Math.round(st.volume * 100) + '%'; Sound.setVolume(st.volume); persist(); });
  $('#st-vol').addEventListener('change', () => Sound.play(57));
  $('#st-speak').addEventListener('change', (e) => { st.speak = e.target.checked; persist(); syncTopButtons(); });
  $('#settings').showModal();
}

/* ================= App shell ================= */
const MODES = [Explore, Find, NameIt, Chords, Scales, Ear, Tuner, Progress];
let current = null;
function setMode(id) {
  const m = MODES.find((x) => x.id === id) || Explore;
  if (current && current.unmount) current.unmount();
  Sound.stopAll(); Neck.cancelPending();
  current = m; S.mode = m.id; S.settings.lastMode = m.id; persist();
  $$('#nav .nav-btn').forEach((b) => b.setAttribute('aria-current', b.dataset.m === m.id ? 'page' : 'false'));
  $('#mode-title').textContent = m.title; $('#mode-help').textContent = m.help;
  $('#hud').innerHTML = '';
  Neck.clear(); Neck.onCell = (s, f, e) => (m.onCell ? m.onCell(s, f, e) : Neck.play(s, f));
  m.mount($('#panel'));
  document.title = `${m.title}: Fretwave`;
}
function remount() { setMode(S.mode); }
function renderDaily() {
  const goal = S.settings.goal, count = S.daily.date === today() ? S.daily.count : 0;
  const C = 2 * Math.PI * 26, pct = Math.min(1, count / goal);
  $('#daily').innerHTML = `<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="5"/><circle cx="30" cy="30" r="26" fill="none" stroke="${pct >= 1 ? '#5ee6a8' : '#ffc857'}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}" style="transition:stroke-dashoffset .5s"/></svg><div class="daily-inner"><b>${count}</b><small>of ${goal}</small></div>`;
  $('#daily').title = `${count} of ${goal} notes practiced today`;
  const st = currentStreak();
  $('#streak').innerHTML = st ? `${ICONS.flame}${st} day${st === 1 ? '' : 's'}` : '<span class="muted" style="font-size:11px">No streak yet</span>';
}
function syncTopButtons() {
  $('#btn-sound').setAttribute('aria-pressed', S.settings.sound);
  $('#btn-voice').setAttribute('aria-pressed', S.settings.speak);
}
function init() {
  $('#nav').innerHTML = MODES.map((m) => `<button type="button" class="nav-btn" data-m="${m.id}">${ICONS[m.id === 'name' ? 'name' : m.id]}<span>${m.nav}</span></button>`).join('');
  $('#nav').addEventListener('click', (e) => { const b = e.target.closest('.nav-btn'); if (b) setMode(b.dataset.m); });
  $('#btn-sound').innerHTML = ICONS.sound; $('#btn-voice').innerHTML = ICONS.voice; $('#btn-settings').innerHTML = ICONS.settings;
  $('#btn-sound').addEventListener('click', () => { S.settings.sound = !S.settings.sound; persist(); syncTopButtons(); if (S.settings.sound) Sound.play(57); else Sound.stopAll(); toast(S.settings.sound ? 'Sound on' : 'Sound off', 1000); });
  $('#btn-voice').addEventListener('click', () => { S.settings.speak = !S.settings.speak; persist(); syncTopButtons(); if (S.settings.speak) Voice.say('Note names on'); toast(S.settings.speak ? 'Note names will be spoken' : 'Spoken note names off', 1200); });
  $('#btn-settings').addEventListener('click', openSettings);
  $('#settings-done').addEventListener('click', () => $('#settings').close());
  document.addEventListener('keydown', (e) => {
    if ($('#settings').open || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest('input, select, textarea')) return;
    if (e.code === 'Space' && e.target.closest('button')) return;
    if (current && current.onKey) current.onKey(e);
  });
  document.addEventListener('pointerdown', () => Sound.ensure(), { once: true });
  syncTopButtons(); renderDaily();
  Neck.init($('#neck'));
  setMode(S.settings.lastMode || 'explore');
}
init();

/* ================= Ear training ================= */
const DEGREE_NAMES = [['do', 'Home. Fully at rest.'], ['re', 'Just above home, wants to step down.'], ['mi', 'Bright and stable.'], ['fa', 'Leans down to mi.'], ['sol', 'Strong, open, stable.'], ['la', 'Sweet, a little wistful.'], ['ti', 'Tense: pulls up to do.']];
const PROG_HINTS = { 'I V vi IV': 'Pop anthem: minor chord third', 'I vi IV V': '50s doo-wop: minor chord second', 'ii V I': 'Jazz: starts minor, lands home', 'I IV V IV': 'Rock: all major, never resolves', 'vi IV I V': 'Starts minor, feels moody', 'I IV V I': 'All major, ends home' };
const Ear = {
  id: 'ear', nav: 'Ear', title: 'Ear training',
  help: 'Listen first, then answer. After each answer the neck draws the shape you just heard, so the sound and the picture lock together.',
  ex: 'intervals', set: [3, 4, 5, 7, 12], dir: 'up', chordSet: ['maj', 'min', '7', 'dim'], q: null, score: { ok: 0, n: 0, streak: 0 }, echoLen: 3, echoSet: 'major', echoHint: true, progSet: ['I V vi IV', 'I IV V I', 'ii V I', 'vi IV I V'], degSet: [0, 2, 4],
  mount(p) {
    this.p = p; this.q = null;
    p.innerHTML = `<div class="panel-grid">
      <div class="controls">
        <div class="ear-top">
          <button class="play-orb" id="ear-play" aria-label="Play the sound">${ICONS.play}</button>
          <div><div class="verdict" id="ear-verdict">Press play and listen.</div><p class="muted" id="ear-sub" style="margin:4px 0 0">Then pick what you heard below.</p>
          <div class="wrap" style="margin-top:12px"><button class="btn" id="ear-next" hidden>Next sound</button><button class="btn btn-primary" id="ear-back" hidden>${ICONS.mic}Now play it on your guitar</button></div></div>
        </div>
        <div class="answers" id="ear-answers"></div>
      </div>
      <div class="controls">
        <div class="row"><span class="lbl">Practice</span>${seg('ear-ex', [['intervals', 'Intervals'], ['chords', 'Chord quality'], ['prog', 'Progressions'], ['degree', 'Scale degrees'], ['echo', 'Play it back']], this.ex)}</div>
        <div id="ear-opts" class="controls"></div>
      </div></div>`;
    wireSeg(p, 'ear-ex', (v) => { this.ex = v; this.q = null; this.renderOpts(); this.renderAnswers(); this.reset(); });
    $('#ear-play', p).addEventListener('click', () => (this.q && !this.q.done ? this.hear() : this.newQ()));
    $('#ear-next', p).addEventListener('click', () => this.newQ());
    $('#ear-back', p).addEventListener('click', () => this.playBack());
    this.renderOpts(); this.renderAnswers(); this.reset();
  },
  unmount() { if (Mic.active) Mic.stop(); },
  reset() { if (Mic.active) Mic.stop(); Neck.clear(); const bk = $('#ear-back', this.p); if (bk) bk.hidden = true; $('#hud').innerHTML = this.hudHTML(); $('#ear-verdict', this.p).textContent = 'Press play and listen.'; $('#ear-verdict', this.p).className = 'verdict'; $('#ear-next', this.p).hidden = true; },
  hudHTML() { const s = this.score; return `<div class="prompt muted" style="font-weight:500;font-size:20px">${this.ex === 'intervals' ? 'How far apart are the two notes?' : this.ex === 'echo' ? 'Listen, then play the phrase back' : this.ex === 'prog' ? 'Which progression is that?' : this.ex === 'degree' ? 'After the chords, which step of the key is the last note?' : 'What kind of chord is that?'}</div>${hudStats([[s.n ? Math.round(100 * s.ok / s.n) + '%' : '–', 'Accuracy'], [s.ok, 'Correct'], [s.streak, 'Streak', s.streak >= 5]])}`; },
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
    } else if (this.ex === 'prog') {
      const all = Object.keys(PROGRESSIONS).concat(['I IV V I']);
      box.innerHTML = `<div class="row row-wide"><span class="lbl">Progressions in the mix</span><div class="wrap" id="pg-set">${all.map((k) => `<button class="chip" data-v="${k}" aria-pressed="${this.progSet.includes(k)}">${k.replace(/ /g, '–')}</button>`).join('')}</div></div>
        <p class="muted" style="font-size:13.5px;margin:0">Listen for where the minor chords fall and whether it ends on home (I). After you answer, play it back on your guitar and Fretwave checks each chord.</p>`;
      $('#pg-set', box).addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; const v = b.dataset.v; if (this.progSet.includes(v)) { if (this.progSet.length <= 2) { toast('Keep at least two progressions to choose from.'); return; } this.progSet = this.progSet.filter((x) => x !== v); } else this.progSet.push(v); b.setAttribute('aria-pressed', this.progSet.includes(v)); this.q = null; this.renderAnswers(); this.reset(); });
    } else if (this.ex === 'degree') {
      box.innerHTML = `<div class="row row-wide"><span class="lbl">Steps in the mix</span><div class="wrap" id="dg-set">${DEGREE_NAMES.map((d, i) => `<button class="chip" data-v="${i}" aria-pressed="${this.degSet.includes(i)}">${i + 1} (${d[0]})</button>`).join('')}</div></div>
        <p class="muted" style="font-size:13.5px;margin:0">Chords set up the key; then one note plays. Name its step in the key. This is how musicians hear melodies: by their role, not their letter. Start with 1, 3 and 5, then add more.</p>`;
      $('#dg-set', box).addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; const v = +b.dataset.v; if (this.degSet.includes(v)) { if (this.degSet.length <= 2) { toast('Keep at least two steps to choose from.'); return; } this.degSet = this.degSet.filter((x) => x !== v); } else this.degSet.push(v); b.setAttribute('aria-pressed', this.degSet.includes(v)); this.q = null; this.renderAnswers(); this.reset(); });
    } else if (this.ex === 'echo') {
      box.innerHTML = `<div class="row"><span class="lbl">Notes</span>${seg('ec-set', [['major', 'C major, open position'], ['pent', 'A minor pentatonic, frets 5–8'], ['string', 'One string only']], this.echoSet)}</div>
        <div class="row"><span class="lbl">Phrase length</span>${seg('ec-len', [['2', '2 notes'], ['3', '3 notes'], ['4', '4 notes'], ['5', '5 notes']], this.echoLen)}</div>
        <div class="row"><span class="lbl">Help</span><label class="switch"><input type="checkbox" id="ec-hint" ${this.echoHint ? 'checked' : ''}>Show the notes you can choose from</label></div>
        <p class="muted" style="font-size:13.5px;margin:0">The first note is shown for you. Answer by tapping the neck, or turn on listening and play it on your guitar.</p>`;
      wireSeg(box, 'ec-set', (v) => { this.echoSet = v; this.q = null; this.reset(); });
      wireSeg(box, 'ec-len', (v) => { this.echoLen = +v; });
      $('#ec-hint', box).addEventListener('change', (e) => { this.echoHint = e.target.checked; if (this.q && this.q.kind === 'echo') this.drawEcho(); });
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
    if (this.ex === 'echo') {
      box.innerHTML = `<div class="echo"><div class="seq-dots big" id="ec-dots"></div><div class="wrap"><button class="btn" id="ec-mic">${ICONS.mic}Listen to my guitar</button></div></div>`;
      $('#ec-mic', box).addEventListener('click', () => this.echoMic());
      return;
    }
    if (this.ex === 'prog') {
      box.innerHTML = this.progSet.map((k) => `<button type="button" class="answer" data-v="${k}"><b>${k.replace(/ /g, '–')}</b><small>${PROG_HINTS[k] || ''}</small></button>`).join('');
    } else if (this.ex === 'degree') {
      box.innerHTML = this.degSet.slice().sort().map((i) => `<button type="button" class="answer" data-v="${i}"><b>${i + 1}: ${DEGREE_NAMES[i][0]}</b><small>${DEGREE_NAMES[i][1]}</small></button>`).join('');
    } else if (this.ex === 'intervals') {
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
    if (this.ex === 'echo') { this.newEcho(); return; }
    if (this.ex === 'prog') {
      const name = rand(this.progSet), key = rand([0, 2, 4, 7, 9, 5]);
      const degs = name === 'I IV V I' ? [0, 3, 4, 0] : PROGRESSIONS[name];
      this.q = { kind: 'prog', name, key, chords: degs.map((d) => [mod(key + MAJOR_STEPS[d], 12), DIATONIC[d]]) };
      this.hear(); return;
    }
    if (this.ex === 'degree') {
      const key = rand([0, 2, 4, 5, 7, 9]), deg = rand(this.degSet);
      this.q = { kind: 'deg', key, deg, midi: 52 + mod(key - 4, 12) + MAJ[deg] };
      this.hear(); return;
    }
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
    if (q.kind === 'echo') { q.cells.forEach((c, i) => Sound.play(c.midi, 0.05 + i * 0.5, 0.5)); return; }
    if (q.kind === 'prog') { hearChords(q.chords, 1.05); return; }
    if (q.kind === 'deg') { hearChords([[q.key, 'maj'], [mod(q.key + 5, 12), 'maj'], [mod(q.key + 7, 12), 'maj'], [q.key, 'maj']], 0.75); Sound.play(q.midi, 3.4, 0.6); return; }
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
    const right = this.isRight(v);
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
  isRight(v) { const q = this.q; return q.kind === 'iv' ? +v === q.semi : q.kind === 'prog' ? v === q.name : q.kind === 'deg' ? +v === q.deg : v === q.id; },
  reveal(good) {
    const q = this.q;
    $$('#ear-answers .answer', this.p).forEach((b) => { if (this.isRight(b.dataset.v)) b.classList.add('right'); });
    const vd = $('#ear-verdict', this.p);
    if (q.kind === 'prog') {
      const names = q.chords.map(([r, id]) => noteName(r) + chordType(id).sym);
      vd.textContent = (good ? (q.missed ? 'Got it: ' : 'Yes! ') : 'It was ') + q.name.replace(/ /g, '–');
      $('#ear-sub', this.p).textContent = `In ${noteName(q.key)} major: ${names.join(' – ')}. Watch the shapes, then play it back.`;
      q.chords.forEach(([r, id], i) => setTimeout(() => { if (this.q !== q || current !== this) return; const v = voicingOf(r, id); if (!v) return; Neck.clear(); drawVoicing(v, r, chordType(id).iv, { stagger: true }); if (S.settings.hand !== false) Neck.hand(v.frets); strum(v.frets); }, 300 + i * 1300));
    } else if (q.kind === 'deg') {
      const tonicName = noteName(q.key), pc = mod(q.key + MAJ[q.deg], 12);
      vd.textContent = (good ? (q.missed ? 'Got it: ' : 'Yes! ') : 'It was ') + `step ${q.deg + 1} (${DEGREE_NAMES[q.deg][0]})`;
      $('#ear-sub', this.p).textContent = `In ${tonicName} major that is ${noteName(pc)}. Hear how it resolves home.`;
      Neck.clear(); allCells((m, s, f) => f <= 12 && MAJ.map((x) => mod(q.key + x, 12)).includes(m % 12)).forEach((c) => { const semi = mod(c.pc - q.key, 12); Neck.mark(c.s, c.f, { label: String(MAJ.indexOf(semi) + 1), color: c.pc === pc ? noteColor(pc) : 'rgba(241,233,218,.3)', textColor: c.pc === pc ? undefined : '#f1e9da', ring: c.pc === pc, cls: c.pc === pc ? '' : 'dim' }); });
      const path = [[0], [1, 0], [2, 1, 0], [3, 2], [4, 5, 6, 7], [5, 6, 7], [6, 7]][q.deg];
      path.forEach((d, i) => Sound.play(52 + mod(q.key - 4, 12) + (d === 7 ? 12 : MAJ[d]), 0.4 + i * 0.42, 0.5));
    } else if (q.kind === 'iv') {
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
    $('#ear-next', this.p).hidden = false; $('#ear-back', this.p).hidden = false;
    $('#ear-next', this.p).focus({ preventScroll: true });
  },
  /* ---- play it back on a real guitar ---- */
  async playBack() {
    const q = this.q; if (!q) return;
    const btn = $('#ear-back', this.p), sub = $('#ear-sub', this.p), vd = $('#ear-verdict', this.p);
    if (Mic.active) { Mic.stop(); btn.innerHTML = `${ICONS.mic}Now play it on your guitar`; return; }
    try { await Mic.start(() => {}); } catch (e) { micError(e); return; }
    btn.innerHTML = `${ICONS.stop}Stop listening`;
    if (q.kind === 'iv') {
      const order = q.dir === 'down' ? [q.b.pc, q.a.pc] : [q.a.pc, q.b.pc];
      let got = 0, last = -1, st = 0;
      sub.textContent = `Play ${noteName(order[0])}, then ${noteName(order[1])}, anywhere on the neck.`;
      Mic.listen((f) => {
        if (f <= 0) { st = 0; return; } const m = Math.round(69 + 12 * Math.log2(f / 440));
        if (m === last) st++; else { st = 1; last = m; } if (st !== 3) return;
        if (m % 12 === order[got] || (q.dir === 'both' && order.includes(m % 12) && got === 0)) { allCells((x) => x === m).forEach((c) => Neck.pluck(c.s, c.f, '#5ee6a8')); got++; sub.textContent = got === 1 ? `Good: ${noteName(m % 12)}. Now the second note.` : ''; }
        if (got >= 2) { Mic.stop(); btn.innerHTML = `${ICONS.mic}Now play it on your guitar`; vd.textContent = 'You played it back!'; vd.className = 'verdict good'; sub.textContent = 'Hearing it, naming it and playing it is how intervals stick.'; }
      });
    } else if (q.kind === 'prog') {
      let i = 0, good = 0;
      const show = () => { const [r, id] = q.chords[i]; const v = voicingOf(r, id); Neck.clear(); if (v) { drawVoicing(v, r, chordType(id).iv); if (S.settings.hand !== false) Neck.hand(v.frets); } sub.textContent = `Play ${noteName(r)}${chordType(id).sym} (${i + 1} of ${q.chords.length}). Let it ring.`; };
      show();
      Mic.chromaCb = (c) => { const [r, id] = q.chords[i]; const res = checkChord(c, [...new Set(chordType(id).iv.map((x) => mod(r + x, 12)))]); if (res && res.ok) { if (++good >= 4) { good = 0; i++; if (i >= q.chords.length) { Mic.stop(); btn.innerHTML = `${ICONS.mic}Now play it on your guitar`; vd.textContent = 'You played the whole progression!'; vd.className = 'verdict good'; sub.textContent = 'Hearing it, naming it and playing it: that is how progressions stick.'; return; } show(); } } else good = 0; };
    } else if (q.kind === 'deg') {
      const pc = mod(q.key + MAJ[q.deg], 12); let last = -1, st = 0;
      sub.textContent = `Find step ${q.deg + 1} of ${noteName(q.key)} major on your guitar.`;
      Mic.listen((f) => { if (f <= 0) { st = 0; return; } const m = Math.round(69 + 12 * Math.log2(f / 440)); if (m === last) st++; else { st = 1; last = m; } if (st === 3 && m % 12 === pc) { Mic.stop(); btn.innerHTML = `${ICONS.mic}Now play it on your guitar`; vd.textContent = `Found it: ${noteName(pc)}!`; vd.className = 'verdict good'; allCells((x) => x === m).forEach((c) => Neck.pluck(c.s, c.f, '#5ee6a8')); } });
    } else if (q.kind === 'ch') {
      const pcs = [...new Set(chordType(q.id).iv.map((i) => mod(q.root + i, 12)))]; let good = 0;
      sub.textContent = 'Strum the chord shown on the neck and let it ring.';
      Mic.chromaCb = (c) => { const r = checkChord(c, pcs); if (r && r.ok) { if (++good >= 4) { Mic.stop(); btn.innerHTML = `${ICONS.mic}Now play it on your guitar`; vd.textContent = 'Clean! You played it back.'; vd.className = 'verdict good'; } } else good = 0; };
    }
  },
  /* ---- melody echo ---- */
  echoPool() {
    if (this.echoSet === 'pent') return allCells((m, s, f) => f >= 5 && f <= 8 && MINPENT.map((x) => mod(9 + x, 12)).includes(m % 12));
    if (this.echoSet === 'string') return allCells((m, s, f) => s === Math.min(2, strings().length - 1) && f <= 7);
    return allCells((m, s, f) => f <= 3 && MAJ.includes(m % 12) && m >= strings()[0] + 3);
  },
  newEcho() {
    const pool = this.echoPool().sort((a, b) => a.midi - b.midi || a.s - b.s);
    const uniq = []; pool.forEach((c) => { if (!uniq.some((u) => u.midi === c.midi)) uniq.push(c); });
    let i = Math.floor(uniq.length * (0.25 + Math.random() * 0.4)); const cells = [uniq[i]];
    for (let k = 1; k < this.echoLen; k++) { const step = rand([-2, -1, -1, 1, 1, 2, 3]); i = clamp(i + step, 0, uniq.length - 1); if (uniq[i].midi === cells[cells.length - 1].midi) i = clamp(i + (i ? -1 : 1), 0, uniq.length - 1); cells.push(uniq[i]); }
    this.q = { kind: 'echo', cells, pos: 1, tries: 0, missed: false };
    this.drawEcho(); this.hear();
    $('#ear-verdict', this.p).textContent = 'Play it back'; $('#ear-sub', this.p).textContent = 'The first note is given. Tap or play the rest.';
  },
  drawEcho() {
    const q = this.q; Neck.clear();
    if (this.echoHint) this.echoPool().forEach((c) => Neck.mark(c.s, c.f, { color: 'rgba(241,233,218,.35)', cls: 'small dim', r: 17 }));
    q.cells.slice(0, q.pos).forEach((c, i) => Neck.noteMark(c.s, c.f, { label: i === 0 ? noteName(c.pc) : i + 1, ring: i === 0 }));
    Neck.scrollTo(q.cells[0].f);
    const dots = $('#ec-dots', this.p); if (dots) dots.innerHTML = q.cells.map((c, i) => `<i class="${i < q.pos ? 'done' : i === q.pos ? 'now' : ''}" style="${i < q.pos ? `background:${noteColor(c.pc)}` : ''}"></i>`).join('');
  },
  echoAnswer(m, s, f) {
    const q = this.q; if (!q || q.kind !== 'echo' || q.done) return;
    const want = q.cells[q.pos];
    if (m === want.midi || (s == null && m % 12 === want.pc)) {
      q.pos++; this.drawEcho();
      if (q.pos >= q.cells.length) {
        q.done = true; this.score.n++; if (!q.missed) { this.score.ok++; this.score.streak++; } else this.score.streak = 0;
        $('#hud').innerHTML = this.hudHTML();
        $('#ear-verdict', this.p).textContent = q.missed ? 'Got there!' : 'Perfect echo!'; $('#ear-verdict', this.p).className = 'verdict ' + (q.missed ? '' : 'good');
        $('#ear-sub', this.p).textContent = q.cells.map((c) => noteName(c.pc)).join(' – ');
        q.cells.forEach((c, i) => Neck.play(c.s, c.f, 0.4 + i * 0.4));
        if (Mic.active) Mic.stop();
        $('#ear-next', this.p).hidden = false;
      }
    } else {
      q.tries++; q.missed = true; if (s != null) Neck.flashBad(s, f, noteName(m % 12));
      if (q.tries % 2 === 0) { Neck.noteMark(want.s, want.f, { ring: true, cls: 'pulse target' }); Sound.play(want.midi, 0.3); }
    }
  },
  async echoMic() {
    const b = $('#ec-mic', this.p);
    if (Mic.active) { Mic.stop(); b.innerHTML = `${ICONS.mic}Listen to my guitar`; return; }
    try { await Mic.start(() => {}); } catch (e) { micError(e); return; }
    b.innerHTML = `${ICONS.stop}Stop listening`;
    let last = -1, st = 0;
    Mic.listen((fq) => { if (fq <= 0) { st = 0; return; } const m = Math.round(69 + 12 * Math.log2(fq / 440)); if (m === last) st++; else { st = 1; last = m; } if (st === 3) { allCells((x) => x === m).forEach((c) => Neck.pluck(c.s, c.f)); this.echoAnswer(m, null, null); } });
  },
  onCell(s, f) { Neck.play(s, f); if (this.q && this.q.kind === 'echo' && !this.q.done) this.echoAnswer(midiAt(s, f), s, f); },
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
        <div class="stat"><b>${Object.keys(S.learn.done).length}<span class="muted" style="font-size:18px">/${allLessons().length}</span></b><span>Lessons finished</span></div>
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


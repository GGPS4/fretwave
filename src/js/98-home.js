/* ================= Home dashboard ================= */
Object.assign(ICONS, {
  home: ic('<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>'),
  bolt: ic('<path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z"/>'),
  target: ic('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'),
  chevron: ic('<path d="M9 5.5 15.5 12 9 18.5"/>'),
});
function weakNotes() {
  const byPc = Array.from({ length: 12 }, (_, pc) => ({ pc, n: 0, ok: 0 }));
  Object.entries(S.stats).forEach(([k, st]) => {
    const [ins, tun, s, f] = k.split(':'); const t = INSTRUMENTS[ins] && INSTRUMENTS[ins].tunings[tun]; if (!t) return;
    const pc = (t.midi[+s] + +f) % 12; byPc[pc].n += st.n; byPc[pc].ok += st.ok;
  });
  return byPc.filter((x) => x.n >= 3).map((x) => Object.assign(x, { acc: x.ok / x.n })).sort((a, b) => a.acc - b.acc);
}
function totals() {
  let n = 0, ok = 0, ms = 0, spots = 0;
  Object.values(S.stats).forEach((st) => { n += st.n; ok += st.ok; ms += st.ms; if (st.n >= 3 && st.ok / st.n >= 0.8) spots++; });
  return { n, ok, acc: n ? ok / n : null, avg: ok ? ms / ok / 1000 : null, spots };
}
const Home = {
  id: 'home', nav: 'Home', title: 'Home', help: '', noNeck: true,
  greeting() {
    const h = new Date().getHours(); const g = h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    return S.settings.name ? `${g}, ${S.settings.name}` : g;
  },
  mount(p) {
    this.p = p;
    $('#mode-title').textContent = this.greeting();
    const d = new Date();
    $('#mode-help').textContent = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    const nx = nextLesson(), due = dueReviews(), T = totals(), weak = weakNotes().slice(0, 3);
    const goal = S.settings.goal, count = S.daily.date === today() ? S.daily.count : 0, st = currentStreak();
    const li = currentLevelIndex(), lv = CURRICULUM[li], lp = levelProgress(lv);
    const C = 2 * Math.PI * 44, pct = Math.min(1, count / goal);
    const doneAll = allLessons().filter((x) => S.learn.done[x.ls.id]).length;
    // last 7 days
    const days = Array.from({ length: 7 }, (_, i) => { const dd = new Date(); dd.setDate(dd.getDate() - (6 - i)); const k = dateStr(dd); const h = S.history[k] || { a: 0, l: 0 }; return { k, label: dd.toLocaleDateString(undefined, { weekday: 'narrow' }), v: (h.a || 0) + (h.l || 0) * 10, today: i === 6 }; });
    const maxV = Math.max(10, ...days.map((x) => x.v));
    const weekTotal = days.reduce((a, b) => a + b.v, 0);
    const hero = this.showWelcome() ? `
      <button class="dash-card hero welcome-hero" id="db-start" style="--c:#ffc857">
        <div class="hero-top"><span class="hero-kicker">Welcome to Fretwave</span></div>
        <h2>Let’s find your starting point</h2>
        <p>New to guitar? Start lesson 1. Already play? A 3-minute quiz skips what you know.</p>
        <div class="hero-actions"><span class="pill-btn primary" data-act="new">${ICONS.play}Start lesson 1</span><span class="pill-btn" data-act="place">Find my level</span></div>
      </button>` : nx ? `
      <button class="dash-card hero" id="db-continue" style="--c:${KIND_COLORS[nx.ls.kind]}">
        <div class="hero-top"><span class="hero-icon">${ICONS[KIND_ICONS[nx.ls.kind]]}</span><span class="hero-kicker">Continue learning</span><span class="hero-mins">${nx.ls.mins} min</span></div>
        <h2>${esc(nx.ls.title)}</h2>
        <p>Level ${nx.li + 1}: ${esc(CURRICULUM[nx.li].title)}, lesson ${nx.i + 1} of ${CURRICULUM[nx.li].lessons.length}</p>
        <div class="hero-bar"><i style="width:${Math.round(levelProgress(CURRICULUM[nx.li]).pct * 100)}%"></i></div>
        <div class="hero-actions"><span class="pill-btn primary">${ICONS.play}Start lesson</span></div>
      </button>` : `
      <button class="dash-card hero" data-go="jam" style="--c:#5ee6a8">
        <div class="hero-top"><span class="hero-icon">${ICONS.star}</span><span class="hero-kicker">Path complete</span></div>
        <h2>Every lesson done</h2><p>Keep it fresh with reviews, or jam over a backing track.</p>
        <div class="hero-actions"><span class="pill-btn primary">${ICONS.jam}Open the Jam room</span></div>
      </button>`;
    p.innerHTML = `<div class="dash">
      ${hero}
      <div class="dash-card today">
        <div class="ring-wrap"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="9"/><circle cx="50" cy="50" r="44" fill="none" stroke="${pct >= 1 ? '#5ee6a8' : '#ffc857'}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}" transform="rotate(-90 50 50)" class="ring-anim"/></svg><div><b>${count}</b><small>of ${goal}</small></div></div>
        <div class="today-txt"><small>Today</small><b>${pct >= 1 ? 'Goal reached' : `${goal - count} notes to go`}</b><span class="flame">${ICONS.flame}${st ? `${st}-day streak` : 'Start a streak today'}</span></div>
        <button class="pill-btn primary small" data-act="practice">${ICONS.bolt}Practice</button>
      </div>
      ${due.length ? `<button class="dash-card review" data-act="review"><span class="tile-icon" style="--c:#6fe0d6">${ICONS.replay}</span><div><b>${due.length} review${due.length > 1 ? 's' : ''} due</b><small>${esc(due.slice(0, 2).map((id) => lessonById(id).ls.title).join(', '))}${due.length > 2 ? '…' : ''}</small></div><span class="chev">${ICONS.chevron}</span></button>` : ''}
      <div class="dash-card stats">
        <div><b>${T.acc == null ? '–' : Math.round(T.acc * 100) + '%'}</b><small>Accuracy</small></div>
        <div><b>${doneAll}</b><small>Lessons</small></div>
        <div><b>${T.spots}</b><small>Spots mastered</small></div>
        <div><b>${T.avg == null ? '–' : T.avg.toFixed(1) + 's'}</b><small>Avg. answer</small></div>
      </div>
      <div class="dash-card week">
        <div class="card-head"><b>This week</b><small>${weekTotal ? `${weekTotal} points` : 'Nothing yet: one round gets you going'}</small></div>
        <div class="week-bars">${days.map((x) => `<div class="wb${x.today ? ' today' : ''}"><i style="height:${Math.max(4, (x.v / maxV) * 100)}%;${x.v ? '' : 'opacity:.25'}"></i><span>${x.label}</span></div>`).join('')}</div>
      </div>
      <button class="dash-card level" data-go="path">
        <div class="card-head"><b>Level ${li + 1}: ${esc(lv.title)}</b><small>${lp.done} of ${lp.total} lessons, ${LEVEL_NAMES[li]}</small></div>
        <div class="mini-road">${CURRICULUM.map((L, i) => { const pr = levelProgress(L); return `<span class="${i === li ? 'here' : ''}${pr.done === pr.total ? ' full' : ''}"><i style="width:${Math.round(pr.pct * 100)}%"></i></span>`; }).join('')}</div>
        <span class="chev">${ICONS.chevron}</span>
      </button>
      <div class="dash-card weak">
        <div class="card-head"><b>Notes to work on</b><small>${weak.length ? 'From your Find it and Name it rounds' : 'Play a round of Find it and your weak spots show up here'}</small></div>
        <div class="weak-row">${weak.length ? weak.map((w) => `<span class="weak-note"><span class="note-chip" style="--c:${noteColor(w.pc)}">${noteName(w.pc)}</span><small>${Math.round(w.acc * 100)}%</small></span>`).join('') + `<button class="pill-btn small" data-act="drill">${ICONS.target}Drill these</button>` : `<button class="pill-btn small" data-go="find">${ICONS.target}Play Find it</button>`}</div>
      </div>
      <div class="dash-card quick">
        <div class="card-head"><b>Quick start</b></div>
        <div class="tiles">${[['tuner', 'Tuner', 'tuner', '#6fe0d6'], ['jam', 'Jam room', 'jam', '#ff7b54'], ['check', 'Chord check', 'chords', '#ffd166'], ['ear', 'Ear training', 'ear', '#c69cff'], ['analyzer', 'Analyzer', 'scales', '#5aa9ff'], ['circle', 'Circle of fifths', 'sync', '#8be0a4'], ['live', 'Live view', 'mic', '#f59bdc'], ['metro', 'Metronome', 'play', '#b8b1cc']].map(([id, name, icon, c]) => `<button class="tile" ${id === 'metro' ? 'data-act="metro"' : `data-go="${id}"`}><span class="tile-icon" style="--c:${c}">${ICONS[icon]}</span><span>${name}</span></button>`).join('')}</div>
      </div>
    </div>`;
    $$('[data-go]', p).forEach((b) => b.addEventListener('click', () => setMode(b.dataset.go)));
    const cont = $('#db-continue', p); if (cont) cont.addEventListener('click', () => { setMode('path'); Path.startLesson(nx.ls.id); });
    const ws = $('#db-start', p); if (ws) ws.addEventListener('click', (e) => { const a = e.target.closest('[data-act]'); setMode('path'); if (a && a.dataset.act === 'place') Path.placement(); else { S.learn.welcomed = true; persist(); Path.startLesson(nx.ls.id); } });
    $$('[data-act]', p).forEach((b) => { if (b.closest('#db-start')) return; b.addEventListener('click', (e) => {
      e.stopPropagation(); const a = b.dataset.act;
      if (a === 'practice') { setMode('find'); Find.start(); }
      else if (a === 'review') { setMode('path'); Path.review(); }
      else if (a === 'drill') { S.settings.drill.smart = true; S.settings.drill.range = 'all'; if (weak.some((w) => !IS_NATURAL[w.pc])) S.settings.drill.naturals = false; persist(); setMode('find'); Find.start(); }
      else if (a === 'metro') { Metro.toggle(); toast(Metro.on ? `Metronome on: ${Metro.bpm} bpm` : 'Metronome off', 1200); }
    }); });
  },
  showWelcome() { return !S.learn.welcomed && !Object.keys(S.learn.done).length; },
};

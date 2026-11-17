/* ================= App shell: four sections, each with a few sub-pages ================= */
const GROUPS = [
  { id: 'learn', name: 'Learn', icon: 'learn', modes: ['path', 'theory', 'progress'], hint: 'Lessons and your roadmap' },
  { id: 'practice', name: 'Practice', icon: 'find', modes: ['find', 'name', 'ear'], hint: 'Quick drills' },
  { id: 'play', name: 'Play', icon: 'jam', modes: ['jam', 'tabs', 'live', 'check'], hint: 'Play your real guitar' },
  { id: 'tools', name: 'Tools', icon: 'tools', modes: ['explore', 'chords', 'scales', 'tuner'], hint: 'Reference and tuner' },
];
const MODES = [Path, Theory, Progress, Find, NameIt, Ear, Jam, Tabs, Live, Check, Explore, Chords, Scales, Tuner];
const SUB_LABELS = { path: 'Path', theory: 'Theory notes', progress: 'Progress', find: 'Find it', name: 'Name it', ear: 'Ear training', jam: 'Jam room', tabs: 'Tab player', live: 'Live view', check: 'Chord check', explore: 'Neck', chords: 'Chords', scales: 'Scales', tuner: 'Tuner' };
let current = null;
const groupOf = (id) => GROUPS.find((g) => g.modes.includes(id)) || GROUPS[0];
function setStage(on) { $('#stage').hidden = !on; }
function setMode(id) {
  const m = MODES.find((x) => x.id === id) || Path;
  if (current && current.unmount) current.unmount();
  Sound.stopAll(); Neck.cancelPending(); Checks.stop();
  current = m; S.mode = m.id; S.settings.lastMode = m.id;
  const g = groupOf(m.id); S.settings.lastIn = S.settings.lastIn || {}; S.settings.lastIn[g.id] = m.id; persist();
  $$('#nav .nav-btn').forEach((b) => b.setAttribute('aria-current', b.dataset.g === g.id ? 'page' : 'false'));
  $('#subtabs').innerHTML = g.modes.map((mid) => `<button type="button" role="tab" class="subtab" data-m="${mid}" aria-selected="${mid === m.id}">${SUB_LABELS[mid]}</button>`).join('');
  $('#mode-title').textContent = m.title; $('#mode-help').textContent = m.help;
  $('#hud').innerHTML = '';
  setStage(!m.noNeck);
  Neck.clear(); Neck.onCell = (s, f, e) => (m.onCell ? m.onCell(s, f, e) : Neck.play(s, f));
  m.mount($('#panel'));
  document.title = `${SUB_LABELS[m.id]}: Fretwave`;
  window.scrollTo({ top: 0 });
}
function remount() { setMode(S.mode); }
function renderDaily() {
  const goal = S.settings.goal, count = S.daily.date === today() ? S.daily.count : 0;
  const C = 2 * Math.PI * 26, pct = Math.min(1, count / goal);
  $('#daily').innerHTML = `<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="5"/><circle cx="30" cy="30" r="26" fill="none" stroke="${pct >= 1 ? '#5ee6a8' : '#ffc857'}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}" style="transition:stroke-dashoffset .5s"/></svg><div class="daily-inner"><b>${count}</b><small>of ${goal}</small></div>`;
  $('#daily').title = `${count} of ${goal} notes practiced today`;
  const st = currentStreak();
  $('#streak').innerHTML = st ? `${ICONS.flame}${st} day${st === 1 ? '' : 's'}` : '<span class="muted" style="font-size:11px">No streak yet</span>';
  const lv = $('#rail-level');
  if (lv) { const li = currentLevelIndex(); const pr = levelProgress(CURRICULUM[li]); lv.innerHTML = `<small>Level ${li + 1}</small><span class="rl-bar"><i style="width:${Math.round(pr.pct * 100)}%"></i></span>`; lv.title = `Level ${li + 1}: ${CURRICULUM[li].title}, ${pr.done} of ${pr.total} lessons`; }
}
function syncTopButtons() {
  $('#btn-sound').setAttribute('aria-pressed', S.settings.sound);
  $('#btn-voice').setAttribute('aria-pressed', S.settings.speak);
}
function init() {
  $('#nav').innerHTML = GROUPS.map((g) => `<button type="button" class="nav-btn" data-g="${g.id}" title="${g.hint}">${ICONS[g.icon]}<span>${g.name}</span></button>`).join('');
  $('#nav').addEventListener('click', (e) => { const b = e.target.closest('.nav-btn'); if (!b) return; const g = GROUPS.find((x) => x.id === b.dataset.g); setMode((S.settings.lastIn || {})[g.id] || g.modes[0]); });
  $('#subtabs').addEventListener('click', (e) => { const b = e.target.closest('.subtab'); if (b) setMode(b.dataset.m); });
  $('#rail-level').addEventListener('click', () => setMode('path'));
  $('#btn-sound').innerHTML = ICONS.sound; $('#btn-voice').innerHTML = ICONS.voice; $('#btn-settings').innerHTML = ICONS.settings;
  $('#btn-sound').addEventListener('click', () => { S.settings.sound = !S.settings.sound; persist(); syncTopButtons(); if (S.settings.sound) Sound.play(57); else { Sound.stopAll(); Metro.stop(); } toast(S.settings.sound ? 'Sound on' : 'Sound off', 1000); });
  $('#btn-voice').addEventListener('click', () => { S.settings.speak = !S.settings.speak; persist(); syncTopButtons(); if (S.settings.speak) Voice.say('Note names on'); toast(S.settings.speak ? 'Note names will be spoken' : 'Spoken note names off', 1200); });
  $('#btn-settings').addEventListener('click', () => openSettings());
  $('#settings-done').addEventListener('click', () => $('#settings').close());
  document.addEventListener('keydown', (e) => {
    if ($('#settings').open || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest('input, select, textarea')) return;
    if (e.code === 'Space' && e.target.closest('button')) return;
    if (current && current.onKey) current.onKey(e);
  });
  document.addEventListener('pointerdown', () => Sound.ensure(), { once: true });
  syncTopButtons(); initMetro();
  Neck.init($('#neck'));
  renderDaily();
  AppShell.init();
  if (Sync.cfg()) Sync.init();
  const first = S.settings.lastMode && MODES.some((m) => m.id === S.settings.lastMode) ? S.settings.lastMode : 'path';
  setMode(first);
}
init();

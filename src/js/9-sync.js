/* ================= Icons used by the newer screens ================= */
Object.assign(ICONS, {
  close: ic('<path d="M6 6l12 12M18 6L6 18"/>'),
  check: ic('<path d="M4.5 12.5l5 5L19.5 7"/>'),
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.1l-5.7 3.2 1.2-6.4-4.7-4.4 6.4-.8z" fill="currentColor"/></svg>',
  book: ic('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/>'),
  jam: ic('<path d="M3 12h2l2-6 3 12 3-9 2 5 2-2h4"/>'),
  learn: ic('<path d="M5 20c0-4 3-4 3-8s-3-4-3-8"/><circle cx="5" cy="4" r="1.6" fill="currentColor"/><circle cx="8" cy="12" r="1.6" fill="currentColor"/><circle cx="5" cy="20" r="1.6" fill="currentColor"/><path d="M12 6h8M12 12h8M12 18h8"/>'),
  tools: ic('<path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L3.5 17.5l3 3 5.7-5.7a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.4-.6-.6-2.4z"/>'),
  download: ic('<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>'),
  sync: ic('<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/>'),
  bell: ic('<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
  copy: ic('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>'),
});
Voice.sayLong = function (text) {
  if (!('speechSynthesis' in window)) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 1.02; u.volume = 0.9; speechSynthesis.speak(u); } catch (e) { /* no speech */ }
};

/* ================= Progress transfer + merge ================= */
function snapshot() { return { v: 1, stats: S.stats, daily: S.daily, learn: S.learn, best: S.settings.bestChanges || {} }; }
function mergeIn(o) {
  if (!o || typeof o !== 'object') return false;
  for (const k in o.stats || {}) { const a = S.stats[k], b = o.stats[k]; if (!a || (b && b.n > a.n)) S.stats[k] = b; }
  if (o.learn && o.learn.done) for (const id in o.learn.done) S.learn.done[id] = Math.max(S.learn.done[id] || 0, o.learn.done[id]);
  if (o.daily) {
    const a = S.daily, b = o.daily;
    if (b.date === a.date) a.count = Math.max(a.count || 0, b.count || 0); else if ((b.date || '') > (a.date || '')) { a.date = b.date; a.count = b.count; }
    if ((b.last || '') > (a.last || '')) { a.last = b.last; a.streak = b.streak; } else if (b.last === a.last) a.streak = Math.max(a.streak || 0, b.streak || 0);
  }
  if (o.best) { S.settings.bestChanges = S.settings.bestChanges || {}; for (const k in o.best) S.settings.bestChanges[k] = Math.max(S.settings.bestChanges[k] || 0, o.best[k]); }
  return true;
}
const b64e = (str) => btoa(unescape(encodeURIComponent(str)));
const b64d = (str) => decodeURIComponent(escape(atob(str.trim())));

/* ================= Google sign-in sync (Firebase, optional) ================= */
const Sync = {
  user: null, ready: false, t: null, status: '',
  cfg() { return window.FRETWAVE_FIREBASE || null; },
  async init() {
    const cfg = this.cfg(); if (!cfg || this.fb) return;
    try {
      const v = '10.12.2', base = `https://www.gstatic.com/firebasejs/${v}/`;
      const [appM, authM, fsM] = await Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')]);
      const app = appM.initializeApp(cfg);
      this.fb = { authM, fsM, auth: authM.getAuth(app), db: fsM.getFirestore(app) };
      authM.onAuthStateChanged(this.fb.auth, async (u) => { this.user = u; if (u) await this.pull(); renderSyncStatus(); });
      this.ready = true;
    } catch (e) { this.status = 'Sync could not load. Check your Firebase settings.'; renderSyncStatus(); }
  },
  async signIn() {
    if (!this.cfg()) { toast('Sign-in needs a Firebase project. See the README to switch it on.', 4000); return; }
    await this.init(); if (!this.fb) return;
    try { await this.fb.authM.signInWithPopup(this.fb.auth, new this.fb.authM.GoogleAuthProvider()); } catch (e) { toast('Sign-in was cancelled or blocked by the browser.'); }
  },
  async signOut() { if (this.fb) await this.fb.authM.signOut(this.fb.auth); this.user = null; renderSyncStatus(); },
  ref() { const { fsM, db } = this.fb; return fsM.doc(db, 'users', this.user.uid); },
  async pull() {
    try { const d = await this.fb.fsM.getDoc(this.ref()); if (d.exists()) { mergeIn(JSON.parse(d.data().state)); store.save({ settings: S.settings, stats: S.stats, daily: S.daily, learn: S.learn }); renderDaily(); if (current && current.id !== 'path') remount(); else if (current) Path.show(); } await this.push(); this.status = 'Synced just now'; } catch (e) { this.status = 'Could not reach the sync server.'; }
    renderSyncStatus();
  },
  async push() { if (!this.user || !this.fb) return; await this.fb.fsM.setDoc(this.ref(), { state: JSON.stringify(snapshot()), updated: Date.now() }); this.status = 'Synced'; renderSyncStatus(); },
  queue() { if (!this.user) return; clearTimeout(this.t); this.t = setTimeout(() => this.push().catch(() => { this.status = 'Offline: will sync later'; renderSyncStatus(); }), 2500); },
};
function renderSyncStatus() {
  const el = $('#sync-status'); if (!el) return;
  if (Sync.user) el.innerHTML = `Signed in as <b>${esc(Sync.user.displayName || Sync.user.email || 'you')}</b>. ${esc(Sync.status)} <button class="btn" id="sy-out">Sign out</button>`;
  else el.innerHTML = Sync.cfg() ? `<button class="btn btn-primary" id="sy-in">${ICONS.sync}Sign in with Google to sync</button> <span class="muted">${esc(Sync.status)}</span>` : '<span class="muted">Google sign-in is ready to switch on: add a free Firebase project (steps in the README). Until then, use a progress code below.</span>';
  const i = $('#sy-in'); if (i) i.addEventListener('click', () => Sync.signIn());
  const o = $('#sy-out'); if (o) o.addEventListener('click', () => Sync.signOut());
}

/* ================= Installable app + reminders ================= */
const AppShell = {
  deferred: null,
  init() {
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); this.deferred = e; const b = $('#ap-install'); if (b) b.disabled = false; });
    try {
      if ('serviceWorker' in navigator && /^https:|^http:\/\/localhost/.test(location.href) && window.top === window.self) {
        navigator.serviceWorker.register('sw.js').then((reg) => { this.reg = reg; }).catch(() => {});
      }
    } catch (e) { /* sandboxed preview */ }
    setInterval(() => this.maybeRemind(), 60000); setTimeout(() => this.maybeRemind(), 4000);
  },
  installed() { return window.matchMedia && matchMedia('(display-mode: standalone)').matches; },
  async install() {
    if (this.deferred) { this.deferred.prompt(); await this.deferred.userChoice; this.deferred = null; return; }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    toast(ios ? 'On iPhone: tap Share, then “Add to Home Screen”.' : 'Use your browser menu: “Install app” or “Add to Home screen”.', 5000);
  },
  async enableReminder(on) {
    S.settings.reminder = on ? (S.settings.reminder || '19:00') : null; persist();
    if (!on) return;
    if ('Notification' in window && Notification.permission === 'default') { try { await Notification.requestPermission(); } catch (e) { /* ignore */ } }
    try { const reg = this.reg || (navigator.serviceWorker && await navigator.serviceWorker.ready); if (reg && reg.periodicSync) await reg.periodicSync.register('fretwave-reminder', { minInterval: 12 * 3600 * 1000 }); } catch (e) { /* not supported: falls back to in-app and calendar reminders */ }
  },
  maybeRemind() {
    const r = S.settings.reminder; if (!r || S.daily.last === today()) return;
    const [h, m] = r.split(':').map(Number); const now = new Date();
    if (now.getHours() * 60 + now.getMinutes() < h * 60 + m || S.settings.remindedOn === today()) return;
    S.settings.remindedOn = today(); persist();
    const st = currentStreak();
    const body = st ? `Keep your ${st}-day streak going: one quick lesson does it.` : 'Five minutes on the fretboard today?';
    try { if ('Notification' in window && Notification.permission === 'granted') { if (this.reg) this.reg.showNotification('Fretwave', { body, icon: 'icons/icon-192.png', tag: 'fretwave-daily' }); else new Notification('Fretwave', { body }); return; } } catch (e) { /* fall through */ }
    toast(body, 5000);
  },
  calendarFile() {
    const [h, m] = (S.settings.reminder || '19:00').split(':');
    const d = new Date(); const ds = dateStr(d).replace(/-/g, '');
    const url = location.href.split('#')[0];
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fretwave//EN', 'BEGIN:VEVENT', `UID:fretwave-daily-${Date.now()}@fretwave`, `DTSTAMP:${ds}T000000Z`, `DTSTART:${ds}T${h}${m}00`, 'DURATION:PT10M', 'RRULE:FREQ=DAILY', 'SUMMARY:Guitar practice (Fretwave)', `DESCRIPTION:Ten minutes on the fretboard. Open ${url}`, `URL:${url}`, 'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:Time to practice', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'fretwave-practice.ics'; document.body.appendChild(a); a.click(); a.remove();
  },
};

/* ================= Settings dialog (tabs keep it short) ================= */
let settingsTab = 'instrument';
function openSettings(tab) {
  if (tab) settingsTab = tab;
  const st = S.settings, body = $('#settings-body');
  const tabs = seg('st-tabs', [['instrument', 'Instrument'], ['sound', 'Sound and goals'], ['sync', 'Sync and app']], settingsTab);
  let html = '';
  if (settingsTab === 'instrument') html = `
    <div class="row"><span class="lbl">Instrument</span>${seg('st-inst', Object.entries(INSTRUMENTS).map(([k, v]) => [k, v.name]), st.instrument)}</div>
    <div class="row"><span class="lbl">Tuning</span><select id="st-tun" aria-label="Tuning">${Object.entries(inst().tunings).map(([k, v]) => `<option value="${k}" ${k === st.tuning ? 'selected' : ''}>${v.name}</option>`).join('')}</select></div>
    <div class="row"><span class="lbl">Frets shown</span>${seg('st-frets', [['12', '12'], ['15', '15'], ['19', '19'], ['22', '22'], ['24', '24']], st.frets)}</div>
    <div class="row"><span class="lbl">Accidentals</span>${seg('st-acc', [['sharp', 'Sharps (C♯)'], ['flat', 'Flats (D♭)']], st.accidentals)}</div>
    <div class="row"><span class="lbl">Hand</span>${seg('st-hand', [['0', 'Right-handed'], ['1', 'Left-handed']], st.lefty ? '1' : '0')}</div>
    <p class="muted" style="font-size:13px;margin:0">Lessons always use a standard-tuned guitar; everything else follows these settings.</p>`;
  else if (settingsTab === 'sound') html = `
    <div class="row"><span class="lbl">Volume</span><div class="slider"><input type="range" min="0" max="1" step="0.05" value="${st.volume}" id="st-vol" aria-label="Volume"><output id="st-vol-o">${Math.round(st.volume * 100)}%</output></div></div>
    <div class="row"><span class="lbl">Voice</span><div class="wrap" style="gap:18px"><label class="switch"><input type="checkbox" id="st-speak" ${st.speak ? 'checked' : ''}>Say note names aloud</label><label class="switch"><input type="checkbox" id="st-narr" ${st.narrate !== false ? 'checked' : ''}>Read lessons aloud</label></div></div>
    <div class="row"><span class="lbl">Daily goal</span>${seg('st-goal', [['20', '20 notes'], ['40', '40 notes'], ['80', '80 notes'], ['150', '150 notes']], st.goal)}</div>`;
  else html = `
    <div class="row row-wide"><span class="lbl">Sync across devices</span><div id="sync-status"></div></div>
    <div class="row row-wide"><span class="lbl">Progress code (works without an account)</span>
      <div class="wrap"><button class="btn" id="st-copy">${ICONS.copy}Copy my progress code</button><span class="muted" style="font-size:13px">Paste it on your other device below.</span></div>
      <textarea id="st-code" rows="2" placeholder="Paste a progress code here" aria-label="Progress code"></textarea>
      <div class="wrap"><button class="btn" id="st-import">Add this progress</button></div></div>
    <div class="row row-wide"><span class="lbl">Install as an app</span><div class="wrap"><button class="btn btn-primary" id="ap-install" ${AppShell.installed() ? 'disabled' : ''}>${ICONS.download}${AppShell.installed() ? 'Installed' : 'Install Fretwave'}</button><span class="muted" style="font-size:13px">Works offline once installed.</span></div></div>
    <div class="row row-wide"><span class="lbl">Daily reminder</span><div class="wrap" style="gap:14px"><label class="switch"><input type="checkbox" id="st-rem" ${st.reminder ? 'checked' : ''}>Remind me at</label><input type="time" id="st-remt" value="${st.reminder || '19:00'}" aria-label="Reminder time"><button class="btn" id="st-ics">${ICONS.bell}Add to my calendar instead</button></div>
      <p class="muted" style="font-size:13px;margin:0">Notifications work best with the app installed (Chrome, Edge and Android). The calendar option works on every phone, including iPhone.</p></div>`;
  body.innerHTML = `<div>${tabs}</div>${html}`;
  wireSeg(body, 'st-tabs', (v) => openSettings(v));
  const rebuild = () => { persist(); Neck.build(); remount(); };
  if (settingsTab === 'instrument') {
    wireSeg(body, 'st-inst', (v) => { st.instrument = v; st.tuning = Object.keys(INSTRUMENTS[v].tunings)[0]; st.drill.strings = null; Sound.cache.clear(); $('#st-tun').innerHTML = Object.entries(inst().tunings).map(([k, t]) => `<option value="${k}">${t.name}</option>`).join(''); rebuild(); });
    $('#st-tun').addEventListener('change', (e) => { st.tuning = e.target.value; rebuild(); });
    wireSeg(body, 'st-frets', (v) => { st.frets = +v; rebuild(); });
    wireSeg(body, 'st-acc', (v) => { st.accidentals = v; rebuild(); });
    wireSeg(body, 'st-hand', (v) => { st.lefty = v === '1'; rebuild(); });
  } else if (settingsTab === 'sound') {
    $('#st-vol').addEventListener('input', (e) => { st.volume = +e.target.value; $('#st-vol-o').textContent = Math.round(st.volume * 100) + '%'; Sound.setVolume(st.volume); persist(); });
    $('#st-vol').addEventListener('change', () => Sound.play(57));
    $('#st-speak').addEventListener('change', (e) => { st.speak = e.target.checked; persist(); syncTopButtons(); });
    $('#st-narr').addEventListener('change', (e) => { st.narrate = e.target.checked; persist(); });
    wireSeg(body, 'st-goal', (v) => { st.goal = +v; persist(); renderDaily(); });
  } else {
    renderSyncStatus();
    $('#st-copy').addEventListener('click', async () => { const code = b64e(JSON.stringify(snapshot())); try { await navigator.clipboard.writeText(code); toast('Progress code copied.'); } catch (e) { $('#st-code').value = code; $('#st-code').select(); toast('Copy the code from the box.'); } });
    $('#st-import').addEventListener('click', () => { try { const o = JSON.parse(b64d($('#st-code').value)); if (mergeIn(o)) { persist(); renderDaily(); toast('Progress added. Nothing was overwritten: the best of both is kept.'); $('#st-code').value = ''; } } catch (e) { toast('That code didn’t work. Copy the whole thing and try again.'); } });
    $('#ap-install').addEventListener('click', () => AppShell.install());
    $('#st-rem').addEventListener('change', (e) => AppShell.enableReminder(e.target.checked));
    $('#st-remt').addEventListener('change', (e) => { st.reminder = e.target.value; $('#st-rem').checked = true; persist(); AppShell.enableReminder(true); });
    $('#st-ics').addEventListener('click', () => { if (!st.reminder) st.reminder = $('#st-remt').value; AppShell.calendarFile(); });
  }
  if (!$('#settings').open) $('#settings').showModal();
}

/* Fretwave service worker: offline app shell + daily practice reminder */
const CACHE = 'fretwave-v4';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'firebase-config.js', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('fretwave-v') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Network first for the page (so updates arrive), cache first for everything else.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('index.html', copy)); return res; }).catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })));
});

const dayStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
async function remind() {
  const c = await caches.open('fretwave-state'); const r = await c.match('state.json'); if (!r) return;
  const st = await r.json(); if (!st.reminder) return;
  const now = new Date(); if (st.last === dayStr(now)) return;
  const [h, m] = st.reminder.split(':').map(Number); if (now.getHours() * 60 + now.getMinutes() < h * 60 + m) return;
  const body = st.streak ? `Keep your ${st.streak}-day streak going: one quick lesson does it.` : 'Five minutes on the fretboard today?';
  await self.registration.showNotification('Fretwave', { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'fretwave-daily' });
}
self.addEventListener('periodicsync', (e) => { if (e.tag === 'fretwave-reminder') e.waitUntil(remind()); });
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((list) => (list.length ? list[0].focus() : self.clients.openWindow('./'))));
});

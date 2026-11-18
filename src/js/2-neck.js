/* ================= The fretboard ================= */
const INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];
const Neck = {
  svg: null, g: null, markers: new Map(), strEls: [], onCell: null,
  init(svgEl) {
    this.svg = svgEl;
    svgEl.addEventListener('pointerdown', (e) => {
      const t = e.target.closest('.hit'); if (!t) return;
      e.preventDefault();
      const s = +t.dataset.s, f = +t.dataset.f;
      Sound.ensure();
      if (this.onCell) this.onCell(s, f, e);
    });
    this.build();
  },
  geometry() {
    const n = strings().length, F = S.settings.frets, W = 1400;
    const gap = n <= 4 ? 56 : 46, top = 40;
    const nutX = 104, endX = W - 18;
    const xs = [nutX];
    const real = (k) => 1 - Math.pow(2, -k / 12);
    for (let k = 1; k <= F; k++) xs.push(nutX + (endX - nutX) * (0.62 * real(k) / real(F) + 0.38 * k / F));
    const boardTop = top - 24, boardBot = top + (n - 1) * gap + 24;
    return { W, H: boardBot + 40, n, F, gap, top, nutX, endX, xs, boardTop, boardBot };
  },
  X(x) { return S.settings.lefty ? this.g.W - x : x; },
  y(s) { return this.g.top + (this.g.n - 1 - s) * this.g.gap; },
  cx(f) { return f === 0 ? this.g.nutX - 46 : (this.g.xs[f - 1] + this.g.xs[f]) / 2; },
  rect(x, w, attrs, parent) { const xx = S.settings.lefty ? this.g.W - x - w : x; return el('rect', Object.assign({ x: xx, width: w }, attrs), parent); },
  build() {
    const g = this.g = this.geometry();
    const svg = this.svg; svg.innerHTML = '';
    svg.setAttribute('viewBox', `0 0 ${g.W} ${g.H}`);
    const I = inst();
    svg.insertAdjacentHTML('beforeend', `<defs>
      <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5e3727"/><stop offset=".45" stop-color="#4a2a1d"/><stop offset="1" stop-color="#341b12"/></linearGradient>
      <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.0032 0.24" numOctaves="3" seed="11"/><feColorMatrix values="0 0 0 0 0.10  0 0 0 0 0.05  0 0 0 0 0.02  0 0 0 0.7 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
      <radialGradient id="pearl" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#fffdf6"/><stop offset=".45" stop-color="#e9e1d2"/><stop offset=".8" stop-color="#c7d3dc"/><stop offset="1" stop-color="#d9c9e4"/></radialGradient>
      <linearGradient id="fret" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7d848d"/><stop offset=".45" stop-color="#f4f6f9"/><stop offset="1" stop-color="#8c939c"/></linearGradient>
      <linearGradient id="nut" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9cfb9"/><stop offset=".5" stop-color="#f7f1e3"/><stop offset="1" stop-color="#cfc4ad"/></linearGradient>
      <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#868c94"/><stop offset=".4" stop-color="#f3f5f7"/><stop offset="1" stop-color="#7a8088"/></linearGradient>
      <linearGradient id="bronze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6a3c"/><stop offset=".4" stop-color="#f1d7a2"/><stop offset="1" stop-color="#7c5c30"/></linearGradient>
      <linearGradient id="nylonG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9b3a6"/><stop offset=".45" stop-color="#fbf8f0"/><stop offset="1" stop-color="#aaa497"/></linearGradient>
      <filter id="strGlow" x="-5%" y="-400%" width="110%" height="900%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="mkShadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#000" flood-opacity=".45"/></filter>
    </defs>`);
    // headstock hint
    this.rect(0, g.nutX, { y: g.boardTop - 6, height: g.boardBot - g.boardTop + 12, rx: 14, fill: '#221c42', opacity: 0.9 }, svg);
    // fingerboard
    const bw = g.endX - g.nutX + 8;
    this.rect(g.nutX, bw, { y: g.boardTop, height: g.boardBot - g.boardTop, rx: 6, fill: 'url(#wood)' }, svg);
    this.rect(g.nutX, bw, { y: g.boardTop, height: g.boardBot - g.boardTop, rx: 6, fill: '#fff', filter: 'url(#grain)' }, svg);
    this.rect(g.nutX, bw, { y: g.boardTop, height: 3, fill: '#ffffff', opacity: 0.08 }, svg);
    // inlays
    const midY = (g.boardTop + g.boardBot) / 2;
    const ir = g.n <= 4 ? 10 : 9;
    for (let f = 1; f <= g.F; f++) {
      const x = this.X(this.cx(f));
      if (f % 12 === 0) {
        const off = (g.boardBot - g.boardTop) * 0.24;
        el('circle', { cx: x, cy: midY - off, r: ir, fill: 'url(#pearl)', opacity: 0.92 }, svg);
        el('circle', { cx: x, cy: midY + off, r: ir, fill: 'url(#pearl)', opacity: 0.92 }, svg);
      } else if (INLAYS.includes(f)) el('circle', { cx: x, cy: midY, r: ir, fill: 'url(#pearl)', opacity: 0.92 }, svg);
    }
    // frets
    for (let f = 1; f <= g.F; f++) {
      this.rect(g.xs[f] - 2.5, 5, { y: g.boardTop, height: g.boardBot - g.boardTop, fill: 'url(#fret)', rx: 1.5 }, svg);
    }
    // nut
    this.rect(g.nutX - 10, 12, { y: g.boardTop - 2, height: g.boardBot - g.boardTop + 4, fill: 'url(#nut)', rx: 3 }, svg);
    // strings
    this.strEls = [];
    strings().forEach((open, s) => {
      const y = this.y(s), th = I.gauge[s] || 2;
      const sg = el('g', { class: 'str' }, svg);
      this.rect(g.nutX - 4, g.endX - g.nutX + 12, { y: y + th * 0.9, height: th * 0.9, fill: '#000', opacity: 0.35 }, sg);
      const grad = I.nylon ? 'url(#nylonG)' : (s < I.wound && S.settings.instrument === 'guitar' ? 'url(#bronze)' : 'url(#steel)');
      this.rect(g.nutX - 4, g.endX - g.nutX + 12, { y: y - th / 2, height: th, fill: grad, class: 'core' }, sg);
      if (s < I.wound) {
        const x1 = this.X(g.nutX - 4), x2 = this.X(g.endX + 8);
        el('line', { x1, x2, y1: y, y2: y, stroke: '#2a2a2a', 'stroke-width': th * 0.9, 'stroke-dasharray': '1.1 1.6', opacity: 0.35 }, sg);
      }
      this.strEls[s] = sg;
      // open-string name
      el('text', { x: this.X(16), y, class: 'strname' }, svg).textContent = noteName(open % 12);
    });
    // fret numbers
    for (let f = 0; f <= g.F; f++) {
      const t = el('text', { x: this.X(this.cx(f)), y: g.boardBot + 26, class: 'fretnum' + (INLAYS.includes(f) || (f && f % 12 === 0) ? ' dot' : '') }, svg);
      t.textContent = f === 0 ? 'open' : f;
    }
    this.fxBelow = el('g', {}, svg);
    this.handL = el('g', { class: 'hand' }, svg); this.handPos = null;
    this.mLayer = el('g', {}, svg);
    this.handTop = el('g', { class: 'hand' }, svg);
    this.fx = el('g', {}, svg);
    this.hits = el('g', {}, svg);
    strings().forEach((open, s) => {
      for (let f = 0; f <= g.F; f++) {
        const x0 = f === 0 ? g.nutX - 92 : g.xs[f - 1], w = f === 0 ? 92 : g.xs[f] - g.xs[f - 1];
        const r = this.rect(x0, w, { y: this.y(s) - g.gap / 2, height: g.gap, class: 'hit', 'data-s': s, 'data-f': f }, this.hits);
        const t = el('title', {}, r); t.textContent = `${ordinal(stringNumber(s))} string, ${f === 0 ? 'open' : 'fret ' + f}`;
      }
    });
    this.markers = new Map();
    const wrap = svg.parentElement; if (wrap) { const k = window.innerWidth < 760 ? 0.78 : 1; wrap.style.minWidth = Math.round((g.F > 15 ? 1180 : g.F > 12 ? 960 : 860) * k) + 'px'; }
  },
  key: (s, f) => s + ':' + f,
  mark(s, f, o = {}) {
    if (f > this.g.F || s >= this.g.n) return null;
    this.unmark(s, f);
    const r = o.r || (this.g.n <= 4 ? 19 : 17);
    const gg = el('g', { class: 'mk ' + (o.cls || ''), transform: `translate(${this.X(this.cx(f))},${this.y(s)})` }, this.mLayer);
    const inner = el('g', { class: 'in' }, gg);
    if (o.delay) inner.style.animationDelay = o.delay + 'ms';
    if (o.ring) el('circle', { r: r + 6, class: 'ring', stroke: o.ringColor || o.color || '#fff' }, inner);
    if (!o.muted) el('circle', { r, class: 'body', fill: o.color || '#fff', stroke: 'rgba(0,0,0,.28)', 'stroke-width': 1.5, filter: 'url(#mkShadow)' }, inner);
    if (o.label != null) {
      const t = el('text', { y: 1, 'font-size': o.fontSize || (String(o.label).length > 2 ? 12 : String(o.label).length > 1 ? 15 : 18) }, inner);
      if (o.textColor) t.setAttribute('fill', o.textColor);
      t.textContent = o.label;
    }
    this.markers.set(this.key(s, f), gg);
    return gg;
  },
  unmark(s, f) { const k = this.key(s, f); const m = this.markers.get(k); if (m) { m.remove(); this.markers.delete(k); } },
  has(s, f) { return this.markers.has(this.key(s, f)); },
  clear() { this.mLayer.innerHTML = ''; this.fx.innerHTML = ''; this.fxBelow.innerHTML = ''; this.markers.clear(); this.strEls.forEach((sg) => sg && (sg.style.opacity = '')); },
  noteMark(s, f, extra = {}) {
    const pc = midiAt(s, f) % 12;
    return this.mark(s, f, Object.assign({ label: noteName(pc), color: noteColor(pc) }, extra));
  },
  pluck(s, f, color) {
    const sg = this.strEls[s];
    if (sg) { sg.classList.remove('twang', 'glow'); void sg.getBBox(); sg.classList.add('twang', 'glow'); clearTimeout(sg._t); sg._t = setTimeout(() => sg.classList.remove('twang', 'glow'), 800); }
    if (f != null && f <= this.g.F && !reduceMotion()) {
      const c = el('circle', { cx: this.X(this.cx(f)), cy: this.y(s), r: 17, fill: 'none', stroke: color || noteGlow(midiAt(s, f)), 'stroke-width': 4, class: 'ripple' }, this.fx);
      setTimeout(() => c.remove(), 750);
    }
  },
  play(s, f, when = 0, gain) {
    const m = midiAt(s, f);
    Sound.play(m, when, gain);
    if (when > 0) { const t = setTimeout(() => { this.pending.delete(t); this.pluck(s, f); }, when * 1000); this.pending.add(t); } else this.pluck(s, f);
  },
  pending: new Set(),
  cancelPending() { this.pending.forEach((t) => clearTimeout(t)); this.pending.clear(); },
  flashBad(s, f, label) {
    const m = this.mark(s, f, { label, color: '#ff6b7a', cls: 'bad', textColor: '#2a0b10' });
    if (m) setTimeout(() => { m.classList.add('fade'); setTimeout(() => { if (this.markers.get(this.key(s, f)) === m) this.unmark(s, f); }, 600); }, 1100);
  },
  link(a, b, label, color) {
    const x1 = this.X(this.cx(a.f)), y1 = this.y(a.s), x2 = this.X(this.cx(b.f)), y2 = this.y(b.s);
    el('line', { x1, y1, x2, y2, class: 'link-line', stroke: color || '#ffc857' }, this.fxBelow);
    const t = el('text', { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 22, class: 'link-label' }, this.fx); t.textContent = label;
  },
  shade([a, b], sel) {
    const g = this.g, fill = 'rgba(22,18,46,.62)', top = g.boardTop - 2, h = g.boardBot - g.boardTop + 4;
    const x0 = (f) => (f === 0 ? g.nutX - 92 : g.xs[f - 1]), x1 = (f) => (f === 0 ? g.nutX - 6 : g.xs[f]);
    if (a > 0) this.rect(g.nutX - 92, x1(a - 1) - (g.nutX - 92), { y: top, height: h, fill }, this.fxBelow);
    if (b < g.F) this.rect(x0(b + 1), g.endX + 8 - x0(b + 1), { y: top, height: h, fill }, this.fxBelow);
    sel.forEach((on, s) => { if (!on) this.rect(x0(a), x1(b) - x0(a), { y: this.y(s) - g.gap / 2, height: g.gap, fill }, this.fxBelow); });
  },
  scrollTo(f) {
    const sc = $('.neck-scroll'); if (!sc || sc.scrollWidth <= sc.clientWidth) return;
    const frac = this.cx(f) / this.g.W; const x = frac * sc.scrollWidth;
    const target = S.settings.lefty ? sc.scrollWidth - x : x;
    sc.scrollTo({ left: clamp(target - sc.clientWidth / 2, 0, sc.scrollWidth), behavior: reduceMotion() ? 'auto' : 'smooth' });
  },
};

/* ================= Chord voicings ================= */
function findVoicings(rootPc, iv, maxFret = 12) {
  const tun = strings(); const n = tun.length;
  const pcs = [...new Set(iv.map((i) => mod(rootPc + i, 12)))];
  const fifth = mod(rootPc + 7, 12);
  const required = pcs.length >= 4 ? pcs.filter((p) => p !== fifth) : pcs;
  const isUke = S.settings.instrument === 'ukulele';
  const minSound = pcs.length <= 2 ? 2 : Math.min(n, isUke ? 4 : 4);
  const found = new Map();
  for (let start = 0; start <= maxFret - 3; start++) {
    const opts = tun.map((open) => {
      const o = [-1];
      if (start <= 2 && pcs.includes(open % 12)) o.push(0);
      for (let f = Math.max(1, start); f <= start + 3; f++) if (pcs.includes((open + f) % 12)) o.push(f);
      return o;
    });
    const cur = new Array(n);
    const rec = (i) => {
      if (i === n) { evaluate(cur.slice()); return; }
      for (const f of opts[i]) { cur[i] = f; rec(i + 1); }
    };
    const evaluate = (v) => {
      const sounding = v.map((f, s) => (f >= 0 ? { s, f, m: tun[s] + f } : null)).filter(Boolean);
      if (sounding.length < minSound) return;
      const firstSound = v.findIndex((f) => f >= 0);
      if (pcs.length <= 2) {
        // power chords: one compact block of 2-3 neighbouring strings
        const lastSound = n - 1 - [...v].reverse().findIndex((f) => f >= 0);
        if (lastSound - firstSound + 1 !== sounding.length || sounding.length > 3 || firstSound > Math.max(0, n - 4)) return;
      } else {
        // muted strings only allowed as a block on the bass side
        for (let s = firstSound; s < n; s++) if (v[s] < 0) return;
      }
      if (isUke && v.some((f) => f < 0)) return;
      const have = new Set(sounding.map((x) => x.m % 12));
      for (const p of required) if (!have.has(p)) return;
      if (!isUke) { const low = sounding.reduce((a, b) => (b.m < a.m ? b : a)); if (low.m % 12 !== rootPc) return; }
      const fretted = sounding.filter((x) => x.f > 0);
      if (fretted.length) {
        const mn = Math.min(...fretted.map((x) => x.f)), mx = Math.max(...fretted.map((x) => x.f));
        if (mx - mn > 3) return;
        const atMin = fretted.filter((x) => x.f === mn).length;
        // a barre can't sit across a ringing open string, so then each note needs its own finger
        const minStr = Math.min(...fretted.filter((x) => x.f === mn).map((x) => x.s));
        const canBarre = atMin > 1 && !sounding.some((x) => x.f === 0 && x.s > minStr);
        const fingers = canBarre ? fretted.length - atMin + 1 : fretted.length;
        const barre = canBarre && fretted.length > 4;
        if (fingers > 4) return;
        if (sounding.some((x) => x.f === 0) && mx > 5) return;
        const score = mn * 0.9 + (n - sounding.length) * 1.6 + fingers * 0.5 + (mx - mn) * 0.9 + (barre ? 0.8 : 0) + (mx >= 4 && sounding.some((x) => x.f === 0) ? 1.5 : 0);
        const sig = v.join(',');
        if (!found.has(sig)) found.set(sig, { frets: v, score, base: mn });
      } else {
        const sig = v.join(',');
        if (!found.has(sig)) found.set(sig, { frets: v, score: (n - sounding.length) * 1.6, base: 0 });
      }
    };
    rec(0);
  }
  const all = [...found.values()].sort((a, b) => a.score - b.score);
  const picked = [];
  for (const v of all) {
    if (picked.length >= 4) break;
    if (picked.some((p) => Math.abs(p.base - v.base) < 2)) continue;
    picked.push(v);
  }
  return picked.sort((a, b) => a.base - b.base);
}

function chordDiagram(v, rootPc, iv) {
  const tun = strings(), n = tun.length;
  const fretted = v.frets.filter((f) => f > 0);
  const mx = fretted.length ? Math.max(...fretted) : 0;
  const base = mx <= 4 ? 1 : Math.min(...fretted);
  const rows = 4, W = 120, H = 150, padL = 22, padR = 14, top = 32, cw = (W - padL - padR) / (n - 1), rh = 26;
  let s = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">`;
  if (base === 1) s += `<rect x="${padL - 2}" y="${top - 5}" width="${(n - 1) * cw + 4}" height="5" rx="2" fill="#f1e9da"/>`;
  else s += `<text x="${padL - 8}" y="${top + rh / 2 + 4}" font-size="11" fill="#b8b1cc" text-anchor="end" font-family="var(--display)">${base}</text>`;
  for (let r = 0; r <= rows; r++) s += `<line x1="${padL}" x2="${padL + (n - 1) * cw}" y1="${top + r * rh}" y2="${top + r * rh}" stroke="#8c86a8" stroke-width="1.2"/>`;
  for (let i = 0; i < n; i++) s += `<line x1="${padL + i * cw}" x2="${padL + i * cw}" y1="${top}" y2="${top + rows * rh}" stroke="#c9ced6" stroke-width="${1 + (n - 1 - i) * 0.2}"/>`;
  v.frets.forEach((f, si) => {
    const x = padL + si * cw;
    if (f < 0) s += `<text x="${x}" y="${top - 12}" font-size="13" fill="#b8b1cc" text-anchor="middle" font-family="var(--display)" font-weight="700">×</text>`;
    else if (f === 0) { const c = intervalColor(mod(tun[si] - rootPc, 12), iv); s += `<circle cx="${x}" cy="${top - 15}" r="5.5" fill="none" stroke="${c}" stroke-width="2"/>`; }
    else {
      const semi = mod(tun[si] + f - rootPc, 12); const c = intervalColor(semi, iv);
      const y = top + (f - base + 0.5) * rh;
      s += `<circle cx="${x}" cy="${y}" r="9" fill="${c}"/><text x="${x}" y="${y + 3.5}" font-size="${intervalInfo(semi, iv)[0].length > 1 ? 8.5 : 10}" text-anchor="middle" fill="#1d1a3b" font-weight="800" font-family="var(--display)">${intervalInfo(semi, iv)[0]}</text>`;
    }
  });
  return s + '</svg>';
}

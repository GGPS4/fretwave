/* ================= Fingering + animated fretting hand ================= */
// One finger per fret where possible; a barre with finger 1 when the shape needs it.
function fingering(frets) {
  const fr = frets.map((f, s) => ({ s, f })).filter((x) => x.f > 0);
  if (!fr.length) return { fingers: [], barre: null };
  const mn = Math.min(...fr.map((x) => x.f));
  const atMin = fr.filter((x) => x.f === mn);
  const minStr = Math.min(...atMin.map((x) => x.s));
  const opensAbove = frets.some((f, s) => f === 0 && s > minStr);
  const out = []; let barre = null, rest = fr, prev = 0;
  if (atMin.length > 1 && !opensAbove && fr.length > 4) {
    const top = Math.max(...frets.map((f, s) => (f >= 0 ? s : -1)));
    barre = { f: mn, from: minStr, to: top };
    out.push({ finger: 1, s: minStr, f: mn, barre: true });
    rest = fr.filter((x) => x.f !== mn); prev = 1;
  }
  rest.sort((a, b) => a.f - b.f || a.s - b.s).forEach((x) => {
    const finger = Math.min(4, Math.max(prev + 1, x.f - mn + 1));
    out.push({ finger, s: x.s, f: x.f }); prev = finger;
  });
  return { fingers: out, barre };
}
const FINGER_COLORS = { 1: '#5aa9ff', 2: '#8be0a4', 3: '#ffd166', 4: '#f59bdc' };
Object.assign(Neck, {
  handPos: null, handRaf: 0,
  handTips(frets) {
    const g = this.g, { fingers, barre } = fingering(frets);
    const tips = {};
    fingers.forEach((x) => {
      const w = g.xs[x.f] - g.xs[x.f - 1];
      tips[x.finger] = { x: g.xs[x.f] - w * 0.3, y: this.y(x.s), s: x.s, f: x.f, barre: x.barre ? barre : null };
    });
    const used = Object.values(tips);
    const cx = used.length ? used.reduce((a, b) => a + b.x, 0) / used.length : (this.handPos ? Object.values(this.handPos)[0].bx : g.nutX + 200);
    const spread = Math.min(46, Math.max(30, (g.xs[Math.min(g.F, 5)] - g.xs[Math.min(g.F, 4)]) * 0.6));
    const out = {};
    [1, 2, 3, 4].forEach((k) => {
      const bx = cx + (k - 2.5) * spread, by = g.H + 6;
      out[k] = tips[k] ? Object.assign({ bx, by, on: 1 }, tips[k]) : { bx, by, x: bx + (k - 2.5) * 4, y: g.boardBot + 8, on: 0, barre: null };
    });
    return out;
  },
  hand(frets) {
    if (!this.handL) return;
    const target = this.handTips(frets);
    const from = this.handPos || Object.fromEntries(Object.entries(target).map(([k, v]) => [k, Object.assign({}, v, { x: v.bx, y: v.by, on: 0 })]));
    cancelAnimationFrame(this.handRaf);
    const t0 = performance.now(), dur = reduceMotion() ? 1 : 340;
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = ease(k);
      const cur = {};
      for (const f of [1, 2, 3, 4]) {
        const a = from[f], b = target[f];
        cur[f] = { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, bx: a.bx + (b.bx - a.bx) * e, by: b.by, on: a.on + (b.on - a.on) * e, barre: b.barre, s: b.s };
      }
      this.drawHand(cur);
      if (k < 1) this.handRaf = requestAnimationFrame(step); else this.handPos = target;
    };
    this.handL.style.display = '';
    this.handRaf = requestAnimationFrame(step);
  },
  drawHand(p) {
    const L = this.handL; L.innerHTML = ''; const T = this.handTop; if (T) T.innerHTML = '';
    const X = (x) => this.X(x);
    // palm
    const xs = [1, 2, 3, 4].map((k) => p[k].bx);
    el('ellipse', { cx: X((Math.min(...xs) + Math.max(...xs)) / 2), cy: this.g.H + 34, rx: (Math.max(...xs) - Math.min(...xs)) / 2 + 40, ry: 40, fill: '#e9b998', opacity: 0.5 }, L);
    [4, 3, 2, 1].forEach((k) => {
      const f = p[k];
      const midX = (f.bx + f.x) / 2 - 10, midY = (f.by + f.y) / 2 + 14;
      const d = `M${X(f.bx)},${f.by} Q${X(midX)},${midY} ${X(f.x)},${f.y + 6}`;
      el('path', { d, stroke: '#b98563', 'stroke-width': 25, 'stroke-linecap': 'round', fill: 'none', opacity: 0.32 + 0.2 * f.on }, L);
      el('path', { d, stroke: '#f2c7a5', 'stroke-width': 21, 'stroke-linecap': 'round', fill: 'none', opacity: 0.38 + 0.22 * f.on }, L);
      if (f.barre && f.on > 0.5) {
        const y1 = this.y(f.barre.to), y2 = this.y(f.barre.from);
        el('line', { x1: X(f.x), x2: X(f.x), y1: y1 - 10, y2: y2 + 8, stroke: '#f2c7a5', 'stroke-width': 18, 'stroke-linecap': 'round', opacity: 0.75 }, L);
      }
      if (f.on > 0.6) {
        const bx = f.x + 6, by = f.y - 18;
        el('circle', { cx: X(bx), cy: by, r: 9.5, fill: FINGER_COLORS[k], stroke: '#1d1a3b', 'stroke-width': 2 }, T || L);
        const t = el('text', { x: X(bx), y: by + 1, class: 'finger-num' }, T || L); t.textContent = k;
      }
    });
  },
  handOff() { cancelAnimationFrame(this.handRaf); if (this.handL) { this.handL.innerHTML = ''; } if (this.handTop) this.handTop.innerHTML = ''; this.handPos = null; },
});

/* ================= Playing techniques: sound + animation ================= */
const Tech = {
  timers: [],
  later(ms, fn) { const t = setTimeout(fn, ms); this.timers.push(t); if (typeof L !== 'undefined' && L.timers) L.timers.push(t); return t; },
  anim(dur, fn, done) { const t0 = performance.now(); const tick = (now) => { const k = Math.min(1, (now - t0) / (dur * 1000)); fn(k); if (k < 1) requestAnimationFrame(tick); else if (done) done(); }; requestAnimationFrame(tick); },
  arc(s, f1, f2, label) {
    const x1 = Neck.X(Neck.cx(f1)), x2 = Neck.X(Neck.cx(f2)), y = Neck.y(s) - 22;
    el('path', { d: `M${x1},${y} Q${(x1 + x2) / 2},${y - 26} ${x2},${y}`, class: 'tech-arc' }, Neck.fx);
    const t = el('text', { x: (x1 + x2) / 2, y: y - 18, class: 'link-label' }, Neck.fx); t.textContent = label;
  },
  hammer(s, f1, f2, at = 0, label = 'h') {
    this.later(at * 1000, () => { Neck.noteMark(s, f1); Neck.play(s, f1, 0, 0.5); });
    this.later(at * 1000 + 380, () => { Neck.noteMark(s, f2, { ring: true }); Sound.play(midiAt(s, f2), 0, 0.36, 0, true); Neck.pluck(s, f2); this.arc(s, f1, f2, label); });
    return at + 0.9;
  },
  pull(s, f2, f1, at = 0) {
    this.later(at * 1000, () => { Neck.noteMark(s, f2); Neck.noteMark(s, f1, { cls: 'dim' }); Neck.play(s, f2, 0, 0.5); });
    this.later(at * 1000 + 380, () => { Neck.unmark(s, f2); Neck.noteMark(s, f1, { ring: true }); Sound.play(midiAt(s, f1), 0, 0.34, 0, true); Neck.pluck(s, f1); this.arc(s, f2, f1, 'p'); });
    return at + 0.9;
  },
  slide(s, f1, f2, at = 0, dur = 0.42, quiet = false) {
    this.later(at * 1000, () => {
      const n = Sound.play(midiAt(s, f1), 0, 0.5);
      const steps = Math.abs(f2 - f1), dir = Math.sign(f2 - f1);
      if (n) for (let i = 1; i <= steps; i++) n.src.playbackRate.setValueAtTime(Math.pow(2, (i * dir) / 12), n.t + (i / steps) * dur);
      if (quiet) return;
      Neck.pluck(s, f1);
      const m = Neck.noteMark(s, f1, { ring: true });
      const x1 = Neck.X(Neck.cx(f1)), x2 = Neck.X(Neck.cx(f2)), y = Neck.y(s);
      el('line', { x1, x2, y1: y, y2: y, class: 'slide-trail', stroke: noteColor(midiAt(s, f2) % 12) }, Neck.fxBelow);
      this.anim(dur, (k) => {
        const fret = Math.round(f1 + (f2 - f1) * k);
        if (m) { m.setAttribute('transform', `translate(${x1 + (x2 - x1) * k},${y})`); const t = m.querySelector('text'); if (t) t.textContent = noteName(midiAt(s, fret) % 12); const c = m.querySelector('.body'); if (c) c.setAttribute('fill', noteColor(midiAt(s, fret) % 12)); }
      }, () => { Neck.unmark(s, f1); Neck.noteMark(s, f2, { ring: true }); const t = el('text', { x: (x1 + x2) / 2, y: y - 22, class: 'link-label' }, Neck.fx); t.textContent = f2 > f1 ? 'slide /' : 'slide \\'; });
    });
    return at + dur + 0.6;
  },
  bend(s, f, semis = 2, at = 0, o = {}) {
    const up = o.up || 0.32, hold = o.hold ?? 0.5;
    this.later(at * 1000, () => {
      const n = Sound.play(midiAt(s, f), 0, 0.5);
      const r = Math.pow(2, semis / 12);
      if (n) { const p = n.src.playbackRate; p.setValueAtTime(1, n.t + 0.05); p.linearRampToValueAtTime(r, n.t + 0.05 + up); if (o.release) { p.setValueAtTime(r, n.t + 0.05 + up + hold); p.linearRampToValueAtTime(1, n.t + 0.05 + up + hold + up); } }
      if (o.quiet) return;
      const sg = Neck.strEls[s]; if (sg) sg.style.opacity = 0;
      const g = Neck.g, y = Neck.y(s), x = Neck.X(Neck.cx(f));
      const off = Math.min(g.gap * 0.95, g.gap * 0.42 * semis) * (s === 0 ? -1 : 1);
      const path = el('path', { class: 'bent-string', 'stroke-width': Math.max(1.4, (inst().gauge[s] || 2)) }, Neck.fx);
      const m = Neck.noteMark(s, f, { ring: true });
      const target = mod(midiAt(s, f) + semis, 12);
      const set = (k) => { const yy = y + off * k; path.setAttribute('d', `M${Neck.X(g.nutX)},${y} L${x},${yy} L${Neck.X(g.endX)},${y}`); if (m) m.setAttribute('transform', `translate(${x},${yy})`); };
      set(0);
      this.later(50, () => this.anim(up, set, () => {
        if (m) { const t = m.querySelector('text'); if (t) t.textContent = noteName(target); const c = m.querySelector('.body'); if (c) c.setAttribute('fill', noteColor(target)); }
        const lab = el('text', { x, y: y + off - 26 * Math.sign(off || 1), class: 'link-label' }, Neck.fx); lab.textContent = semis === 2 ? 'full bend' : semis === 1 ? '½ bend' : `${semis / 2} bend`;
        if (o.release) this.later(hold * 1000, () => this.anim(up, (k) => set(1 - k), () => { if (sg) sg.style.opacity = ''; path.remove(); }));
        else this.later(hold * 1000 + 700, () => { if (sg) sg.style.opacity = ''; path.remove(); });
      }));
    });
    return at + up + hold + (o.release ? up : 0) + 0.5;
  },
  vibrato(s, f, at = 0, dur = 1.8, depth = 0.014, quiet = false) {
    this.later(at * 1000, () => {
      const n = Sound.play(midiAt(s, f), 0, 0.5);
      if (n) { const ctx = Sound.ctx, lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.5; lg.gain.setValueAtTime(0, n.t); lg.gain.linearRampToValueAtTime(depth, n.t + 0.35); lfo.connect(lg); lg.connect(n.src.playbackRate); lfo.start(n.t); lfo.stop(n.t + dur); }
      if (quiet) return;
      Neck.pluck(s, f);
      const m = Neck.noteMark(s, f, { ring: true, cls: 'vib' });
      const t = el('text', { x: Neck.X(Neck.cx(f)), y: Neck.y(s) - 28, class: 'link-label' }, Neck.fx); t.textContent = 'vibrato ~~~';
      this.later(dur * 1000, () => { if (m) m.classList.remove('vib'); });
    });
    return at + dur;
  },
  stop() { this.timers.forEach(clearTimeout); this.timers = []; },
};

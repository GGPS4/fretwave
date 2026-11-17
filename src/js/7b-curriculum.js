/* ================= Curriculum: guitar + music theory in 5 levels =================
   Lessons are written for standard-tuned guitar; the player switches to it while a lesson runs.
   String index: 0 = low E (6th string) ... 5 = high e (1st string). */
const at = (s, f) => ({ s, f });
const run = (s, frets) => frets.map((f) => at(s, f));
const MAJ = [0, 2, 4, 5, 7, 9, 11], MINPENT = [0, 3, 5, 7, 10], BLUES = [0, 3, 5, 6, 7, 10];
function voicingOf(root, id) { const t = chordType(id); return (findVoicings(root, t.iv, 12).find((v) => v.base <= 5) || findVoicings(root, t.iv, 12)[0]); }
function hearChords(list, gap = 1.1) {
  const ctx = Sound.ensure(); if (!ctx) return;
  list.forEach(([r, id], i) => { const v = voicingOf(r, id); if (v) Sound.strumAt(v.frets, ctx.currentTime + 0.1 + i * gap, false, 0.32); });
}
function randRoot(lo = 0, hi = 11) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
function shuffleOpts(opts, answer) { const o = opts.map((t, i) => ({ t, ok: i === answer })).sort(() => Math.random() - 0.5); return { options: o.map((x) => x.t), answer: o.findIndex((x) => x.ok) }; }
function circleSVG() {
  const keys = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'D♭', 'A♭', 'E♭', 'B♭', 'F'], acc = ['0', '1♯', '2♯', '3♯', '4♯', '5♯', '6♯', '5♭', '4♭', '3♭', '2♭', '1♭'];
  const pcs = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
  return `<svg class="circle5" viewBox="0 0 260 260" role="img" aria-label="Circle of fifths">${keys.map((k, i) => { const a = (i / 12) * Math.PI * 2 - Math.PI / 2, x = 130 + Math.cos(a) * 100, y = 130 + Math.sin(a) * 100; return `<g><circle cx="${x}" cy="${y}" r="21" fill="${noteColor(pcs[i])}"/><text x="${x}" y="${y + 1}" text-anchor="middle" dominant-baseline="central" font-size="15" font-weight="800" fill="#1d1a3b">${k}</text><text x="${130 + Math.cos(a) * 58}" y="${130 + Math.sin(a) * 58}" text-anchor="middle" dominant-baseline="central" font-size="11" fill="#b8b1cc">${acc[i]}</text></g>`; }).join('')}<text x="130" y="130" text-anchor="middle" dominant-baseline="central" font-size="12" fill="#b8b1cc">clockwise = up a 5th</text></svg>`;
}
const tabBlock = (lines) => `<pre class="tab">${lines.map(esc).join('\n')}</pre>`;
const chips = (arr) => `<div class="tone-row">${arr.map(([lab, txt, col]) => `<span class="tone"><i style="background:${col}">${lab}</i><b>${txt}</b></span>`).join('')}</div>`;

const G3NPS = [[0, 3], [0, 5], [0, 7], [1, 3], [1, 5], [1, 7], [2, 4], [2, 5], [2, 7], [3, 4], [3, 5], [3, 7], [4, 5], [4, 7], [4, 8], [5, 5], [5, 7], [5, 8]].map(([s, f]) => ({ s, f, midi: [40, 45, 50, 55, 59, 64][s] + f, pc: ([40, 45, 50, 55, 59, 64][s] + f) % 12 }));

const CURRICULUM = [
  /* ------------------------------ LEVEL 1 ------------------------------ */
  {
    title: 'Meet the neck', blurb: 'String names, the musical alphabet, and your first fretboard landmarks.',
    guide: [
      ['Strings', 'From thickest to thinnest: <b>E A D G B E</b>. The thick E is the 6th string, the thin e is the 1st. Memory trick: <i>Eddie Ate Dynamite, Good Bye Eddie</i>.'],
      ['The musical alphabet', 'Seven letters, <b>A B C D E F G</b>, then it repeats. Sharps (♯) and flats (♭) sit between letters: A♯ and B♭ are the same note.'],
      ['The no-gap pairs', '<b>B–C</b> and <b>E–F</b> have nothing between them. Everywhere else, letters are two frets apart.'],
      ['Half and whole steps', 'One fret = one <b>half step</b>. Two frets = one <b>whole step</b>. There are 12 different notes before they repeat.'],
      ['Landmarks', 'Low E string: G at 3, A at 5, B at 7, E at 12. A string: C at 3, D at 5, E at 7, A at 12.'],
      ['Octaves', 'From the 6th or 5th string: up two strings, up two frets. From the 4th or 3rd string: up two strings, up <b>three</b> frets (the B string is tuned differently).'],
      ['The 12th fret', 'Everything starts over at fret 12, one octave higher. Learn frets 0 to 12 and you know the whole neck.'],
    ],
    lessons: [
      {
        id: 'strings', title: 'Six strings, six names', kind: 'neck', mins: 2, blurb: 'Learn the open strings by sight and sound.',
        steps: [
          { t: 'Your guitar has six strings. From the thickest to the thinnest they are <b>E, A, D, G, B and E</b>.', show: (L) => { L.seq([0, 1, 2, 3, 4, 5].map((s) => at(s, 0)), 0.55); } },
          { t: 'A memory trick: <b>E</b>ddie <b>A</b>te <b>D</b>ynamite, <b>G</b>ood <b>B</b>ye <b>E</b>ddie. The thick E is called the 6th string; the thin e is the 1st.', show: (L) => { [0, 1, 2, 3, 4, 5].forEach((s) => L.note(s, 0, { delay: s * 60 })); L.band(0); L.band(5); } },
          { t: 'Thick strings sound low, thin strings sound high. Listen to the low E, then the high e: same letter, two octaves apart.', show: (L) => { L.note(0, 0); L.note(5, 0); L.link(at(0, 0), at(5, 0), '2 octaves'); Neck.play(0, 0, 0.2); Neck.play(5, 0, 1.0); } },
          { t: 'Your turn. Tap the strings I name.', check: { type: 'tap', items: [
            { prompt: 'Tap the open <b>D</b> string.', target: (s, f) => s === 2 && f === 0 },
            { prompt: 'Tap the open <b>B</b> string.', target: (s, f) => s === 4 && f === 0 },
            { prompt: 'Tap the open <b>A</b> string.', target: (s, f) => s === 1 && f === 0 },
          ] } },
        ],
      },
      {
        id: 'alphabet', title: 'The musical alphabet', kind: 'theory', mins: 3, blurb: 'Seven letters, twelve notes, and the two pairs with no gap.',
        steps: [
          { t: 'Music uses just seven letters: <b>A B C D E F G</b>. After G, it starts again at A.', show: (L) => L.seq(L.naturals(1, 0, 12), 0.45) },
          { t: 'Between most letters there is an extra note. A♯ (“A sharp”) sits between A and B. It is the same note as B♭ (“B flat”): one note, two names.', show: (L) => { L.seq(run(1, [0, 1, 2]), 0.6); L.later(1900, () => L.link(at(1, 0), at(1, 2), 'A♯ sits between')); } },
          { t: 'Two pairs have <b>no</b> note between them: <b>B–C</b> and <b>E–F</b>. Here they are on the A and D strings, sitting right next to each other.', show: (L) => { L.seq([at(1, 2), at(1, 3)], 0.5, { ring: true }); L.later(1200, () => L.seq([at(2, 2), at(2, 3)], 0.5, { ring: true })); } },
          { t: 'Count every note, sharps included, and you get <b>12</b>. After 12 the pattern repeats one octave higher. That is why fret 12 looks like the open strings.', show: (L) => L.seq(run(1, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), 0.28) },
          { t: 'Quick check.', check: { type: 'quiz', items: [
            { q: 'Which letter comes after G?', options: ['H', 'A', 'F'], answer: 1, why: 'The alphabet loops: …E, F, G, A, B…' },
            { q: 'Which pair has no sharp between them?', options: ['A and B', 'E and F', 'C and D'], answer: 1, why: 'E–F and B–C are the two no-gap pairs.' },
            { q: 'A♯ is the same note as…', options: ['B♭', 'A♭', 'B♯'], answer: 0, why: 'One fret above A, one fret below B: two names, same sound.' },
          ] } },
        ],
      },
      {
        id: 'steps', title: 'Half steps and whole steps', kind: 'theory', mins: 2, blurb: 'The two step sizes everything in music is built from.',
        steps: [
          { t: 'Each fret is one <b>half step</b>, the smallest move in Western music. Fret by fret, the low E string climbs in half steps.', show: (L) => L.seq(run(0, [0, 1, 2, 3, 4]), 0.45) },
          { t: 'Two frets make a <b>whole step</b>. C to D is a whole step. E to F is only a half step, because E–F is a no-gap pair.', show: (L) => { L.note(1, 3); L.note(1, 5); L.link(at(1, 3), at(1, 5), 'whole'); L.note(2, 2); L.note(2, 3); L.link(at(2, 2), at(2, 3), 'half'); Neck.play(1, 3, 0.2); Neck.play(1, 5, 0.7); Neck.play(2, 2, 1.4); Neck.play(2, 3, 1.9); } },
          { t: 'So to walk up the letters on one string, skip a fret each time, except between B–C and E–F.', show: (L) => L.seq(L.naturals(1, 0, 12), 0.4) },
          { t: 'Try it.', check: { type: 'tap', items: [
            { prompt: 'C is at fret 3 on the A string. Tap <b>D</b>, a whole step higher on the same string.', target: (s, f) => s === 1 && f === 5, show: (L) => { L.note(1, 3, { ring: true }); L.band(1); } },
            { prompt: 'E is at fret 2 on the D string. Tap <b>F</b>, a half step higher.', target: (s, f) => s === 2 && f === 3, show: (L) => { L.note(2, 2, { ring: true }); L.band(2); } },
          ] } },
        ],
      },
      {
        id: 'lowE', title: 'Notes on the low E string', kind: 'neck', mins: 3, blurb: 'Learn the 6th string through landmarks, not counting.',
        steps: [
          { t: 'Start with landmarks on the 6th string: open <b>E</b>, <b>G</b> at fret 3, <b>A</b> at 5, <b>B</b> at 7, and <b>E</b> again at 12.', show: (L) => { L.band(0); L.seq(run(0, [0, 3, 5, 7, 12]), 0.6, { ring: true }); } },
          { t: 'The dots on your guitar line up with these landmarks: frets 3, 5, 7 and the double dot at 12. Use them instead of counting.', show: (L) => { L.band(0); L.notes(run(0, [0, 3, 5, 7, 12]), { stagger: 80 }); } },
          { t: 'Fill in the gaps by stepping. F is one fret after E. C sits between B and D. Every natural note on the string:', show: (L) => { L.band(0); L.seq(L.naturals(0, 0, 12), 0.38); } },
          { t: 'Find each note on the 6th string. Landmarks first, then step.', check: { type: 'drill', gen: drillGen([0], 0, 12), n: 6, doneText: 'Low E string: done.' } },
        ],
      },
      {
        id: 'aString', title: 'Notes on the A string', kind: 'neck', mins: 3, blurb: 'Same idea on the 5th string, with a shortcut.',
        steps: [
          { t: 'A string landmarks: open <b>A</b>, <b>C</b> at 3, <b>D</b> at 5, <b>E</b> at 7, and <b>A</b> at 12.', show: (L) => { L.band(1); L.seq(run(1, [0, 3, 5, 7, 12]), 0.6, { ring: true }); } },
          { t: 'Shortcut: the 5th fret of the low E string is A, the same note as the open A string. That is how you tune by ear, and it means the two strings share one pattern, shifted five frets.', show: (L) => { L.note(0, 5, { ring: true }); L.note(1, 0, { ring: true }); L.link(at(0, 5), at(1, 0), 'same A'); Neck.play(0, 5, 0.2); Neck.play(1, 0, 0.9); } },
          { t: 'Every natural note on the A string:', show: (L) => { L.band(1); L.seq(L.naturals(1, 0, 12), 0.38); } },
          { t: 'Find each note on the 5th string.', check: { type: 'drill', gen: drillGen([1], 0, 12), n: 6, doneText: 'A string: done.' } },
        ],
      },
      {
        id: 'octaves', title: 'Octave shapes', kind: 'neck', mins: 3, blurb: 'Find any note again, higher up, with one shape.',
        steps: [
          { t: 'An <b>octave</b> is the same note, higher. From a note on the 6th or 5th string: go <b>up two strings and up two frets</b>.', show: (L) => { L.note(0, 3, { ring: true }); L.note(2, 5, { ring: true }); L.link(at(0, 3), at(2, 5), 'octave'); L.note(1, 3, { ring: true }); L.note(3, 5, { ring: true }); L.link(at(1, 3), at(3, 5), 'octave'); Neck.play(0, 3, 0.2); Neck.play(2, 5, 0.8); Neck.play(1, 3, 1.6); Neck.play(3, 5, 2.2); } },
          { t: 'The B string is tuned differently, so when you cross it the shape stretches: from the 4th or 3rd string, go <b>up two strings and up three frets</b>.', show: (L) => { L.note(2, 5, { ring: true }); L.note(4, 8, { ring: true }); L.link(at(2, 5), at(4, 8), '+3 frets'); L.note(3, 5, { ring: true }); L.note(5, 8, { ring: true }); L.link(at(3, 5), at(5, 8), '+3 frets'); Neck.play(2, 5, 0.2); Neck.play(4, 8, 0.8); } },
          { t: 'Chain the shapes and one note shows up all over the neck. Here is every G.', show: (L) => L.seq(allCells((m) => m % 12 === 7, 15).sort((a, b) => a.midi - b.midi), 0.3) },
          { t: 'Your turn.', check: { type: 'tap', items: [
            { prompt: 'This is A on the 6th string. Tap its octave, two strings up.', target: (s, f, m) => m === 57, show: (L) => L.note(0, 5, { ring: true }) },
            { prompt: 'This is C on the 4th string. Tap its octave, crossing the B string.', target: (s, f, m) => m === 72, show: (L) => L.note(2, 10, { ring: true }) },
          ] } },
        ],
      },
      {
        id: 'twelve', title: 'The 12th fret reset', kind: 'neck', mins: 2, blurb: 'Why learning frets 0 to 12 is enough.',
        steps: [
          { t: 'At the 12th fret every string starts over. The notes there match the open strings, just one octave higher.', show: (L) => { [0, 1, 2, 3, 4, 5].forEach((s) => { L.note(s, 0); L.note(s, 12, { ring: true, delay: 200 }); }); L.link(at(0, 0), at(0, 12), 'same E'); strum([0, 0, 0, 0, 0, 0], { at: 0.2 }); strum([12, 12, 12, 12, 12, 12], { at: 1.4 }); } },
          { t: 'So the neck above fret 12 is a copy of the neck below it. Fret 15 is fret 3 again; fret 17 is fret 5 again.', show: (L) => { L.note(0, 3); L.note(0, 15, { ring: true }); L.link(at(0, 3), at(0, 15), 'both G'); L.note(1, 5); L.note(1, 17 > S.settings.frets ? 5 : 17); } },
          { t: 'Check.', check: { type: 'quiz', items: [{ q: 'What note is at the 12th fret of the A string?', options: ['G♯', 'A', 'B'], answer: 1, why: 'Fret 12 always matches the open string.' }], doneText: 'Level 1 knowledge: locked in.' } },
          { t: 'One more.', check: { type: 'tap', items: [{ prompt: 'Tap <b>E</b> at the 12th fret of the 1st (thinnest) string.', target: (s, f) => s === 5 && f === 12 }] } },
        ],
      },
    ],
  },
  /* ------------------------------ LEVEL 2 ------------------------------ */
  {
    title: 'Chords from scratch', blurb: 'Intervals, how chords are built, and your first open chords.',
    guide: [
      ['Intervals', 'The distance between two notes, counted in half steps. <b>Minor 3rd</b> = 3, <b>major 3rd</b> = 4, <b>perfect 5th</b> = 7, <b>octave</b> = 12.'],
      ['Triads', 'Three notes stacked in 3rds: <b>root, 3rd, 5th</b>. Major = root + 4 + 3 half steps. Minor = root + 3 + 4.'],
      ['Major vs minor', 'Only the 3rd changes. Lower it one half step and major becomes minor. Major sounds bright; minor sounds darker.'],
      ['Reading the colors', 'In chord shapes, <span style="color:#ff7b54">coral = root</span>, <span style="color:#ffd166">yellow = 3rd</span>, <span style="color:#5aa9ff">blue = 5th</span>, <span style="color:#c69cff">violet = 7th</span>.'],
      ['First chords', 'E, A, D, then G, C, Em, Am. Change slowly and cleanly; speed comes later.'],
      ['Power chords', 'Root + 5th, no 3rd. Movable: slide the shape and the chord takes the name of the root note.'],
      ['Seventh chords', 'Add a 7th to a triad. <b>Dominant 7</b> (♭7, 10 half steps) sounds bluesy and restless. <b>Major 7</b> (11 half steps) sounds dreamy.'],
    ],
    lessons: [
      {
        id: 'intervals', title: 'Intervals: distance between notes', kind: 'ear', mins: 3, blurb: 'Hear the difference between a major 3rd, a minor 3rd and a 5th.',
        steps: [
          { t: 'An <b>interval</b> is the distance between two notes, counted in half steps (frets). C to E is 4 half steps.', show: (L) => { L.band(1); L.seq(run(1, [3, 4, 5, 6, 7]), 0.35, { label: (c, i) => i, color: '#f1e9da' }); L.later(2000, () => { L.note(1, 3, { ring: true }); L.note(1, 7, { ring: true }); L.link(at(1, 3), at(1, 7), '4 half steps'); }); } },
          { t: 'Four half steps is a <b>major 3rd</b>. It sounds bright and happy.', show: (L) => { L.note(1, 3); L.note(1, 7); L.link(at(1, 3), at(1, 7), 'major 3rd'); L.play([48, 52], 0.5, 0.2); L.later(1300, () => L.together([48, 52])); } },
          { t: 'Three half steps is a <b>minor 3rd</b>. One fret less, and it sounds darker.', show: (L) => { L.note(1, 3); L.note(1, 6); L.link(at(1, 3), at(1, 6), 'minor 3rd'); L.play([48, 51], 0.5, 0.2); L.later(1300, () => L.together([48, 51])); } },
          { t: 'Seven half steps is a <b>perfect 5th</b>: strong and open. On guitar it sits one string up and two frets up.', show: (L) => { L.note(1, 3); L.note(2, 5); L.link(at(1, 3), at(2, 5), 'perfect 5th'); L.play([48, 55], 0.5, 0.2); L.later(1300, () => L.together([48, 55])); } },
          { t: 'Listen and decide.', check: { type: 'ear', n: 4, gen: () => { const r = 45 + Math.floor(Math.random() * 10); const k = Math.floor(Math.random() * 3); const semi = [4, 3, 7][k]; return { q: 'Which interval is this?', options: ['Major 3rd', 'Minor 3rd', 'Perfect 5th'], answer: k, play: (L) => { L.play([r, r + semi], 0.55, 0.05); L.later(1300, () => L.together([r, r + semi])); } }; } } },
        ],
      },
      {
        id: 'triads', title: 'How a major chord is built', kind: 'theory', mins: 3, blurb: 'Root, 3rd and 5th: the recipe behind every major chord.',
        steps: [
          { t: 'A <b>chord</b> is three or more notes played together. The simplest is a <b>triad</b>: a root, a 3rd and a 5th.', show: (L) => { L.seq([at(1, 3), at(2, 2), at(3, 0)], 0.5, { iv: 0, ctx: [0, 4, 7] }); L.later(1700, () => L.together([48, 52, 55])); } },
          { t: 'Start from C. Count up <b>4</b> half steps to E (the major 3rd), then <b>3</b> more to G (the 5th). C, E, G is C major.', show: (L) => { L.band(1); L.seq(run(1, [3, 7, 10]), 0.6, { iv: 0, ctx: [0, 4, 7] }); L.later(1900, () => { L.link(at(1, 3), at(1, 7), '+4'); L.link(at(1, 7), at(1, 10), '+3'); }); } },
          { t: 'The recipe works from any note. G + 4 = B, + 3 = D. G, B, D is G major.', show: (L) => { L.band(0); L.seq(run(0, [3, 7, 10]), 0.6, { iv: 7, ctx: [0, 4, 7] }); L.later(1900, () => L.together([43, 47, 50])); } },
          { t: 'On guitar, chord shapes just spread those three notes across the strings. In this C chord, the colors show each note’s job.', show: (L) => L.chord(0, 'maj') },
          { t: 'Find the chord tones.', check: { type: 'tap', items: [
            { prompt: 'Tap any <b>3rd</b> of C major (an E).', target: (s, f, m) => m % 12 === 4, show: (L) => L.chord(0, 'maj', 0, { silent: true }) },
            { prompt: 'Tap any <b>5th</b> of C major (a G).', target: (s, f, m) => m % 12 === 7, show: (L) => L.chord(0, 'maj', 0, { silent: true }) },
          ] } },
        ],
      },
      {
        id: 'minor', title: 'Major vs minor', kind: 'ear', mins: 2, blurb: 'One note moves, and the mood flips.',
        steps: [
          { t: 'Lower the 3rd by one half step and a major chord becomes <b>minor</b>. C major is C–E–G. C minor is C–E♭–G.', show: (L) => { L.band(1); L.seq(run(1, [3, 7, 10]), 0.45, { iv: 0, ctx: [0, 4, 7] }); L.later(1700, () => { Neck.clear(); L.band(1); L.seq(run(1, [3, 6, 10]), 0.45, { iv: 0, ctx: [0, 3, 7] }); }); } },
          { t: 'Hear it on real chord shapes: <b>E major</b>, then <b>E minor</b>. Only one finger moves.', show: (L) => { L.chord(4, 'maj', 0.2); L.later(1800, () => L.chord(4, 'min', 0)); } },
          { t: 'Major tends to sound bright and settled. Minor sounds sad, serious, or moody. Here is A major, then A minor.', show: (L) => { L.chord(9, 'maj', 0.2); L.later(1800, () => L.chord(9, 'min', 0)); } },
          { t: 'Major or minor?', check: { type: 'ear', n: 4, gen: () => { const r = rand([0, 2, 4, 7, 9]); const k = Math.random() < 0.5 ? 0 : 1; return { q: 'Is this chord major or minor?', options: ['Major', 'Minor'], answer: k, play: () => hearChords([[r, k ? 'min' : 'maj']]), after: (L) => L.chord(r, k ? 'min' : 'maj', 0.1) }; } } },
        ],
      },
      {
        id: 'firstchords', title: 'Your first chords: E, A and D', kind: 'chord', mins: 4, blurb: 'Three chords that unlock hundreds of songs.',
        steps: [
          { t: '<b>E major</b>. The dots show where your fingers go; the colors show each note’s job. All six strings ring.', show: (L) => L.chord(4, 'maj') },
          { t: '<b>A major</b>. Three fingers side by side at the 2nd fret. Skip the low E string (×).', show: (L) => L.chord(9, 'maj') },
          { t: '<b>D major</b>. A small triangle on the top three strings. Play only the top four strings.', show: (L) => L.chord(2, 'maj') },
          { t: 'Switch slowly: A, D, E, A. Clean changes first, speed later. Tip: switch the moment you strum the last beat.', show: (L) => L.progression([[9, 'maj'], [2, 'maj'], [4, 'maj'], [9, 'maj']], 1.5) },
          { t: 'Play each chord on your guitar. Fretwave listens and tells you which string needs work.', check: { type: 'chord', items: [{ root: 4, id: 'maj' }, { root: 9, id: 'maj' }, { root: 2, id: 'maj' }] } },
        ],
      },
      {
        id: 'morechords', title: 'G, C, Em and Am', kind: 'chord', mins: 4, blurb: 'Four more open chords, and how they connect.',
        steps: [
          { t: '<b>G major</b>: a wide shape with notes on both outer strings.', show: (L) => L.chord(7, 'maj') },
          { t: '<b>C major</b>: a diagonal staircase. Skip the low E string.', show: (L) => L.chord(0, 'maj') },
          { t: '<b>E minor</b>: the easiest chord on guitar. Two fingers, all six strings.', show: (L) => L.chord(4, 'min') },
          { t: '<b>A minor</b> looks like C with one finger moved: the ring finger drops from the A string to the G string.', show: (L) => { L.chord(0, 'maj', 0.2); L.later(1900, () => L.chord(9, 'min', 0)); } },
          { t: 'Now play them on your guitar.', check: { type: 'chord', items: [{ root: 7, id: 'maj' }, { root: 0, id: 'maj' }, { root: 9, id: 'min' }] } },
        ],
      },
      {
        id: 'power', title: 'Power chords', kind: 'neck', mins: 3, blurb: 'One movable shape for every rock chord.',
        steps: [
          { t: 'A <b>power chord</b> is just a root and a 5th. No 3rd, so it is neither major nor minor, which is why it sounds huge with distortion.', show: (L) => L.voicing([3, 5, 5, -1, -1, -1], 7, [0, 7], 0.2) },
          { t: 'The shape is <b>movable</b>. Slide it so the root sits on any note of the low E string, and the chord takes that note’s name: G5, A5, B5, C5.', show: (L) => { [[3, 7], [5, 9], [7, 11], [8, 0]].forEach(([f, r], i) => L.later(i * 1100 + 100, () => { Neck.clear(); L.voicing([f, f + 2, f + 2, -1, -1, -1], r, [0, 7], 0); })); } },
          { t: 'The same shape works with the root on the A string. Here is C5 and D5.', show: (L) => { L.voicing([-1, 3, 5, 5, -1, -1], 0, [0, 7], 0.2); L.later(1300, () => { Neck.clear(); L.voicing([-1, 5, 7, 7, -1, -1], 2, [0, 7], 0); }); } },
          { t: 'Build one.', check: { type: 'tap', items: [
            { prompt: 'Tap the <b>root</b> of an A5 power chord on the 6th string.', target: (s, f) => s === 0 && f === 5 },
            { prompt: 'Now tap where its <b>5th</b> goes (one string up, two frets up).', target: (s, f) => s === 1 && f === 7, show: (L) => L.note(0, 5, { ring: true }) },
          ] } },
        ],
      },
      {
        id: 'sevenths', title: 'Seventh chords', kind: 'ear', mins: 3, blurb: 'Add one note for blues, jazz and tension.',
        steps: [
          { t: 'Add one more note to a triad and you get a <b>seventh chord</b>. A <b>dominant 7</b> adds the ♭7: 10 half steps above the root. Here is G7.', show: (L) => L.chord(7, '7') },
          { t: 'Hear it: G major, then G7. The ♭7 adds tension that wants to move somewhere, usually to C.', show: (L) => { L.chord(7, 'maj', 0.2); L.later(1800, () => L.chord(7, '7', 0)); L.later(3600, () => L.chord(0, 'maj', 0)); } },
          { t: 'A <b>major 7</b> uses the natural 7th (11 half steps). It sounds soft and dreamy. Compare C, then Cmaj7.', show: (L) => { L.chord(0, 'maj', 0.2); L.later(1800, () => L.chord(0, 'maj7', 0)); } },
          { t: 'Which kind of chord?', check: { type: 'ear', n: 4, gen: () => { const r = rand([0, 2, 7, 9, 4]); const ids = ['maj', '7', 'maj7']; const k = Math.floor(Math.random() * 3); return { q: 'Plain major, dominant 7 or major 7?', options: ['Major', 'Dominant 7', 'Major 7'], answer: k, play: () => hearChords([[r, ids[k]]]), after: (L) => L.chord(r, ids[k], 0.1) }; } } },
        ],
      },
    ],
  },
  /* ------------------------------ LEVEL 3 ------------------------------ */
  {
    title: 'Keys and progressions', blurb: 'The major scale, keys, and why certain chords sound right together.',
    guide: [
      ['The major scale', 'Steps: <b>W W H W W W H</b> (whole, whole, half, whole, whole, whole, half). Start on any note to build its major scale.'],
      ['Keys', 'A key is a home note plus the scale built on it. C major has no sharps or flats. G has 1♯ (F♯), D has 2♯, A has 3♯, E has 4♯. F has 1♭ (B♭), B♭ has 2♭.'],
      ['Chords in a key', 'Build a triad on each scale note: <b>I ii iii IV V vi vii°</b>. Major, minor, minor, major, major, minor, diminished. In C: C Dm Em F G Am B°.'],
      ['Famous progressions', '<b>I–V–vi–IV</b> (pop), <b>I–IV–V</b> (blues and rock), <b>ii–V–I</b> (jazz), <b>vi–IV–I–V</b> (moody pop).'],
      ['Circle of fifths', 'Each step clockwise goes up a 5th and adds one sharp. Neighbours on the circle share six of their seven notes.'],
      ['Relative minor', 'Every major key shares its notes with a minor key that starts on its 6th note. C major ↔ A minor, G major ↔ E minor. On the neck: 3 frets below the major root.'],
    ],
    lessons: [
      {
        id: 'majorscale', title: 'The major scale', kind: 'theory', mins: 3, blurb: 'The do-re-mi pattern, and how to build it from any note.',
        steps: [
          { t: 'The major scale is the do-re-mi you already know. It follows one step pattern: <b>whole, whole, half, whole, whole, whole, half</b>.', show: (L) => { L.band(1); L.seq(run(1, [3, 5, 7, 8, 10, 12, 14, 15]), 0.42, { iv: 0, ctx: MAJ }); } },
          { t: 'Start that pattern on any note and you get its major scale. Here is <b>G major</b> on the low E string.', show: (L) => { L.band(0); L.seq(run(0, [3, 5, 7, 8, 10, 12, 14, 15]), 0.42, { iv: 7, ctx: MAJ }); } },
          { t: 'To keep the pattern, G major needs <b>F♯</b> instead of F. That one sharp is why we say G major “has one sharp”.', show: (L) => { L.band(0); run(0, [3, 5, 7, 8, 10, 12, 14, 15]).forEach((c) => L.note(c.s, c.f, { ring: c.f === 14 })); Neck.play(0, 14, 0.3); } },
          { t: 'Build <b>D major</b> on the D string: start on the open string and tap each note going up, following W W H W W W H.', check: { type: 'seq', exact: true, prompt: 'D major on the D string, open to fret 12', cells: run(2, [0, 2, 4, 5, 7, 9, 11, 12]), show: (L) => L.band(2) } },
        ],
      },
      {
        id: 'keys', title: 'Keys and key signatures', kind: 'theory', mins: 3, blurb: 'What “the key of G” actually means.',
        steps: [
          { t: 'A <b>key</b> is a home base: a set of notes a song mostly uses, with one note that feels like home. In the key of G, everything wants to land on G.', show: (L) => { L.scale(7, MAJ, [2, 5]); L.later(200, () => L.play([43, 45, 47, 48, 50, 52, 54, 55], 0.3)); L.later(2800, () => strum([3, 2, 0, 0, 0, 3])); } },
          { t: 'Each major key has its own count of sharps or flats. <b>C</b>: none. <b>G</b>: 1 (F♯). <b>D</b>: 2 (F♯ C♯). <b>A</b>: 3. <b>E</b>: 4.', html: chips([['0', 'C', '#ff7b54'], ['1♯', 'G', '#5aa9ff'], ['2♯', 'D', '#ffd166'], ['3♯', 'A', '#c69cff'], ['4♯', 'E', '#8be0a4']]), show: (L) => L.scale(2, MAJ, [0, 5], { names: true }) },
          { t: 'Flat keys go the other way. <b>F</b> has one flat (B♭). <b>B♭</b> has two (B♭ E♭).', show: (L) => L.scale(5, MAJ, [0, 5], { names: true }) },
          { t: 'Check.', check: { type: 'quiz', items: [
            { q: 'How many sharps are in D major?', options: ['None', 'One', 'Two', 'Three'], answer: 2, why: 'D major uses F♯ and C♯.' },
            { q: 'Which key has no sharps or flats?', options: ['G major', 'C major', 'F major'], answer: 1 },
          ] } },
        ],
      },
      {
        id: 'diatonic', title: 'Chords in a key', kind: 'theory', mins: 4, blurb: 'The seven chords that belong together, and their numbers.',
        steps: [
          { t: 'Build a triad on each note of the major scale using only notes from that key. You get seven chords that naturally sound good together. In C:', html: chips(['C', 'Dm', 'Em', 'F', 'G', 'Am', 'B°'].map((c, i) => [['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'][i], c, noteColor([0, 2, 4, 5, 7, 9, 11][i])])), show: () => hearChords([[0, 'maj'], [2, 'min'], [4, 'min'], [5, 'maj'], [7, 'maj'], [9, 'min'], [11, 'dim']], 0.75) },
          { t: 'The pattern never changes: <b>major, minor, minor, major, major, minor, diminished</b>. Musicians number them with Roman numerals: capitals for major, lowercase for minor.' },
          { t: 'Same pattern in G major: G, Am, Bm, C, D, Em, F♯°. Learn the numbers and you can play any song in any key.', html: chips(['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F♯°'].map((c, i) => [['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'][i], c, noteColor([7, 9, 11, 0, 2, 4, 6][i])])), show: () => hearChords([[7, 'maj'], [9, 'min'], [11, 'min'], [0, 'maj'], [2, 'maj'], [4, 'min']], 0.75) },
          { t: 'Check.', check: { type: 'quiz', items: [
            { q: 'In the key of C, which chord is the V?', options: ['F', 'G', 'Am'], answer: 1, why: 'C D E F G: the 5th note is G, and V is major.' },
            { q: 'Is the ii chord major or minor?', options: ['Major', 'Minor'], answer: 1, why: 'Lowercase numerals are minor: ii, iii and vi.' },
            { q: 'In G major, what is the vi chord?', options: ['Em', 'E', 'Am'], answer: 0 },
          ] } },
        ],
      },
      {
        id: 'progressions', title: 'Progressions that power songs', kind: 'play', mins: 3, blurb: 'I–V–vi–IV, the 12-bar blues, and how to hear them.',
        steps: [
          { t: '<b>I–V–vi–IV</b> is one of the most used progressions in pop music. In G that is G, D, Em, C. Watch the shapes change.', show: (L) => L.progression([[7, 'maj'], [2, 'maj'], [4, 'min'], [0, 'maj']], 1.4) },
          { t: '<b>I–IV–V</b> powers blues and rock and roll. In A that is A, D and E.', show: (L) => L.progression([[9, 'maj'], [2, 'maj'], [4, 'maj'], [9, 'maj']], 1.2) },
          { t: 'The Jam room plays these with a full band and lights up the notes that fit each chord.', html: '<button class="btn" data-goto="jam">Open the Jam room after this lesson</button>' },
          { t: 'Name that progression.', check: { type: 'ear', n: 3, gen: () => { const r = rand([0, 2, 7, 9]); const k = Math.random() < 0.5 ? 0 : 1; const prog = k === 0 ? [[r, 'maj'], [(r + 7) % 12, 'maj'], [(r + 9) % 12, 'min'], [(r + 5) % 12, 'maj']] : [[r, 'maj'], [(r + 5) % 12, 'maj'], [(r + 7) % 12, 'maj'], [r, 'maj']]; return { q: 'Which progression did you hear?', options: ['I–V–vi–IV (has a minor chord)', 'I–IV–V–I (all major)'], answer: k, play: () => hearChords(prog, 1) }; } } },
        ],
      },
      {
        id: 'circle', title: 'The circle of fifths', kind: 'theory', mins: 3, blurb: 'One picture that maps every key.',
        steps: [
          { t: 'Go up a perfect 5th from C and you land on G. Keep going: D, A, E, B… Each step adds one sharp to the key.', show: (L) => { L.seq([at(1, 3), at(2, 5), at(3, 7), at(4, 10), at(5, 12)], 0.7, { ring: true }); L.later(3600, () => { L.link(at(1, 3), at(2, 5), '5th'); L.link(at(2, 5), at(3, 7), '5th'); }); } },
          { t: 'Arrange all twelve keys that way and you get the <b>circle of fifths</b>. Clockwise adds sharps; counter-clockwise adds flats.', html: () => circleSVG() },
          { t: 'Keys next to each other share six of their seven notes, which is why songs move between neighbours so smoothly. On guitar, a 5th is always one string up and two frets up (three when crossing to the B string).', show: (L) => L.voicing([3, 5, -1, -1, -1, -1], 7, [0, 7], 0.2) },
          { t: 'Check.', check: { type: 'quiz', items: [
            { q: 'What is a perfect 5th above D?', options: ['G', 'A', 'B'], answer: 1, why: 'D, E, F♯, G, A: five letters up.' },
            { q: 'Moving clockwise on the circle adds…', options: ['a sharp', 'a flat', 'nothing'], answer: 0 },
          ] } },
        ],
      },
      {
        id: 'relative', title: 'The relative minor', kind: 'theory', mins: 3, blurb: 'Every major key has a minor twin with the same notes.',
        steps: [
          { t: 'Every major key has a <b>relative minor</b> that uses exactly the same notes. It starts on the 6th note of the major scale. For C major, that is A.', show: (L) => { L.scale(0, MAJ, [0, 5], { names: true }); L.later(300, () => { L.all(9, { ring: true }, 5); }); } },
          { t: 'C major and A minor share every note. What changes is which note feels like home. Listen: C to C, then A to A.', show: (L) => { L.play([48, 50, 52, 53, 55, 57, 59, 60], 0.28, 0.1); L.play([45, 47, 48, 50, 52, 53, 55, 57], 0.28, 2.6); } },
          { t: 'Quick finder: the relative minor root is <b>3 frets below</b> the major root. G major (fret 3) → E minor (open).', show: (L) => { L.note(0, 3, { ring: true }); L.note(0, 0, { ring: true }); L.link(at(0, 3), at(0, 0), '3 frets down'); L.later(400, () => L.chord(7, 'maj', 0.2, { clear: false })); } },
          { t: 'Check.', check: { type: 'quiz', items: [{ q: 'What is the relative minor of G major?', options: ['Am', 'Em', 'Bm'], answer: 1 }] } },
          { t: 'One more.', check: { type: 'tap', items: [{ prompt: 'C major’s root is at fret 8 on the 6th string. Tap its relative minor root on the same string.', target: (s, f) => s === 0 && f === 5, show: (L) => L.note(0, 8, { ring: true }) }] } },
        ],
      },
    ],
  },
  /* ------------------------------ LEVEL 4 ------------------------------ */
  {
    title: 'Scales for soloing', blurb: 'Pentatonic shapes, the blues scale, and landing on the right notes.',
    guide: [
      ['Minor pentatonic', 'Five notes: <b>1, ♭3, 4, 5, ♭7</b>. In A: A C D E G. Shape 1 sits between frets 5 and 8.'],
      ['Five shapes', 'Shapes 1 to 5 link end to end and cover the whole neck. Each shares notes with its neighbours.'],
      ['Changing key', 'Move every shape so its root lands on the new key note. The shapes never change, only where they sit.'],
      ['Blues scale', 'Minor pentatonic plus the <b>♭5</b> “blue note”. Slide through it; don’t park on it.'],
      ['Chord tones', 'Over each chord, its root, 3rd and 5th are the strongest notes to land on. Jam mode lights them up live.'],
      ['Major scale shapes', 'Three notes per string covers the major scale in one hand position and makes speed practice easy.'],
    ],
    lessons: [
      {
        id: 'pent1', title: 'Minor pentatonic: shape 1', kind: 'neck', mins: 3, blurb: 'The scale behind most rock and blues solos.',
        steps: [
          { t: 'The <b>minor pentatonic</b> has five notes: 1, ♭3, 4, 5 and ♭7. It is the scale behind most rock and blues solos. Here it is in A.', show: (L) => { L.shape(pentShape(9, 1), 9, MINPENT); L.scroll(6); } },
          { t: 'Shape 1 in A sits between frets 5 and 8: two notes on every string. First finger at fret 5, pinky at fret 8. Listen to it going up.', show: (L) => { L.shade([4, 9]); L.seq(pentShape(9, 1), 0.3, { iv: 9, ctx: MINPENT }); } },
          { t: 'The roots (A) are your home base: fret 5 on the 6th string, fret 7 on the 4th, fret 5 on the 1st.', show: (L) => { L.shape(pentShape(9, 1), 9, MINPENT, { cls: 'dim' }); allCells((m, s, f) => m % 12 === 9 && f >= 5 && f <= 8).forEach((c) => L.iv(c.s, c.f, 9, MINPENT)); } },
          { t: 'Play shape 1 going up, from the 6th string to the 1st.', check: { type: 'seq', exact: false, prompt: 'A minor pentatonic, shape 1, ascending', cells: () => pentShape(9, 1).map((c) => at(c.s, c.f)) } },
        ],
      },
      {
        id: 'pentall', title: 'All five pentatonic shapes', kind: 'neck', mins: 3, blurb: 'Link the shapes and the whole neck opens up.',
        steps: [
          { t: 'Shape 1 is one piece of a bigger puzzle. Five shapes link end to end and cover the entire neck. Watch them light up in order.', show: (L) => { L.scale(9, MINPENT, [0, 15], { cls: 'ghost' }); [1, 2, 3, 4, 5].forEach((n, i) => L.later(i * 1300, () => { Neck.clear(); L.scale(9, MINPENT, [0, 15], { cls: 'ghost' }); L.shape(pentShape(9, n), 9, MINPENT, { stagger: 8 }); })); } },
          { t: 'Neighbouring shapes share notes: the right edge of shape 1 is the left edge of shape 2. Learn shapes 1 and 2 first; they cover the most common solo spots.', show: (L) => { L.shape(pentShape(9, 1), 9, MINPENT); L.later(500, () => pentShape(9, 2).forEach((c) => { if (!Neck.has(c.s, c.f)) L.iv(c.s, c.f, 9, MINPENT, { cls: 'dim' }); })); L.scroll(8); } },
          { t: 'To change key, move everything. Slide shape 1 up three frets and you are in C minor.', show: (L) => { L.shape(pentShape(0, 1), 0, MINPENT); L.scroll(9); } },
          { t: 'Check.', check: { type: 'tap', items: [{ prompt: 'Tap any <b>A root</b> inside shape 2 (frets 7 to 10).', target: (s, f, m) => m % 12 === 9 && f >= 7 && f <= 10, show: (L) => L.shape(pentShape(9, 2), 9, MINPENT, { cls: 'dim' }) }] } },
        ],
      },
      {
        id: 'blues', title: 'The blues scale', kind: 'ear', mins: 3, blurb: 'One extra note: the blue note.',
        steps: [
          { t: 'Add one note to the minor pentatonic, the <b>♭5</b>, and you get the blues scale. That extra note is called the <b>blue note</b>.', show: (L) => { boxCells(9, BLUES, 5, 8).forEach((c) => L.iv(c.s, c.f, 9, BLUES, { ring: c.pc === 3 })); L.scroll(6); } },
          { t: 'Use it as a passing note: slide through it on the way to the 5th. Listen.', show: (L) => { boxCells(9, BLUES, 5, 8).forEach((c) => L.iv(c.s, c.f, 9, BLUES, { cls: 'dim' })); L.seq([at(1, 5), at(1, 6), at(1, 7), at(2, 5), at(2, 7)], 0.26, { iv: 9, ctx: BLUES }); } },
          { t: 'Which one used the blue note?', check: { type: 'ear', n: 3, gen: () => { const k = Math.random() < 0.5 ? 0 : 1; const a = [57, 60, 62, 64, 62, 60, 57], b = [57, 60, 62, 63, 64, 62, 57]; return { q: 'Which phrase used the blue note?', options: ['First phrase', 'Second phrase'], answer: k, play: (L) => { L.play(k === 0 ? b : a, 0.22, 0.05); L.play(k === 0 ? a : b, 0.22, 2.0); } }; } } },
        ],
      },
      {
        id: 'targets', title: 'Target the chord tones', kind: 'play', mins: 3, blurb: 'Why some notes sound better at the chord change.',
        steps: [
          { t: 'The scale tells you which notes are safe. The <b>chord tones</b> tell you which notes sound best right now. Over A7, aim for A, C♯, E and G.', show: (L) => { L.scale(9, MINPENT, [4, 9], { cls: 'ghost' }); allCells((m, s, f) => f >= 4 && f <= 9 && [9, 1, 4, 7].includes(m % 12)).forEach((c) => L.iv(c.s, c.f, 9, [0, 4, 7, 10])); hearChords([[9, '7']]); } },
          { t: 'When the band moves to D7, the targets move too: D, F♯, A and C.', show: (L) => { L.scale(9, MINPENT, [4, 9], { cls: 'ghost' }); allCells((m, s, f) => f >= 4 && f <= 9 && [2, 6, 9, 0].includes(m % 12)).forEach((c) => L.iv(c.s, c.f, 2, [0, 4, 7, 10])); hearChords([[2, '7']]); } },
          { t: 'Landing on a chord tone right at the change makes a solo sound intentional. In the Jam room, these light up for you as the chords change.', html: '<button class="btn" data-goto="jam">Try it in the Jam room</button>' },
          { t: 'Check.', check: { type: 'tap', items: [{ prompt: 'The chord is D major. Tap its <b>3rd</b> (F♯) between frets 4 and 9.', target: (s, f, m) => m % 12 === 6 && f >= 4 && f <= 9, show: (L) => L.shade([4, 9]) }] } },
        ],
      },
      {
        id: 'major3nps', title: 'The major scale, three notes per string', kind: 'neck', mins: 3, blurb: 'A whole major scale under one hand.',
        steps: [
          { t: 'The major scale has shapes too. A handy one puts <b>three notes on every string</b>. Here is G major starting at fret 3.', show: (L) => { L.shape(G3NPS, 7, MAJ); L.scroll(5); } },
          { t: 'Play it slowly with an even pulse. Turn on the metronome (top right) and its speed trainer to push the tempo a little each time.', show: (L) => { L.seq(G3NPS, 0.3, { iv: 7, ctx: MAJ }); } },
          { t: 'Play the first two strings of the shape.', check: { type: 'seq', exact: false, prompt: 'G major, three notes per string: first six notes', cells: G3NPS.slice(0, 6) } },
        ],
      },
    ],
  },
  /* ------------------------------ LEVEL 5 ------------------------------ */
  {
    title: 'See the whole neck', blurb: 'CAGED, triads, modes and reading tab: the big picture.',
    guide: [
      ['CAGED', 'The five open chord shapes, <b>C A G E D</b>, can be moved up the neck. For any chord they appear in that order, linked end to end.'],
      ['Finding roots', 'Each CAGED shape has its root on a known string. Find the root, drop the shape around it.'],
      ['Triads on top strings', 'Three-note shapes on the G, B and high e strings. One chord appears in three stacks (inversions) as you move up.'],
      ['Modes', 'Start the major scale on a different note and you get a mode. <b>Dorian</b> = minor with a bright 6th. <b>Mixolydian</b> = major with a ♭7. <b>Aeolian</b> = natural minor.'],
      ['Reading tab', 'Six lines = six strings, high e on top. Numbers are frets. Read left to right; stacked numbers are played together.'],
    ],
    lessons: [
      {
        id: 'caged', title: 'The CAGED system', kind: 'neck', mins: 4, blurb: 'Five shapes that connect every chord across the neck.',
        steps: [
          { t: 'There are five open chord shapes: <b>C, A, G, E and D</b>. Spell them out and you get CAGED.', show: (L) => { [[0], [9], [7], [4], [2]].forEach(([r], i) => L.later(i * 1300 + 100, () => L.chord(r, 'maj', 0, { maxBase: 0 }))); } },
          { t: 'Each shape can slide up the neck to play any chord. Here are all five shapes for <b>C major</b>, linked end to end.', show: (L) => { Neck.caged(0); } },
          { t: 'Learn where the root sits in each shape and you can find any chord anywhere. White rings mark the roots.', show: (L) => { Neck.caged(0, { rootsOnly: true }); } },
          { t: 'Check.', check: { type: 'tap', items: [{ prompt: 'In the <b>E shape</b> of C major (around fret 8), tap the root on the 6th string.', target: (s, f) => s === 0 && f === 8, show: () => Neck.caged(0, { only: 'E', quiet: true }) }] } },
        ],
      },
      {
        id: 'toptriads', title: 'Triads on the top strings', kind: 'neck', mins: 3, blurb: 'Small, bright chord shapes for rhythm parts.',
        steps: [
          { t: 'Strip a chord to three notes on the top three strings and you get small, bright shapes. Great for rhythm parts and for seeing chords inside scales.', show: (L) => L.voicing([-1, -1, -1, 4, 3, 3], 7, [0, 4, 7], 0.2) },
          { t: 'The same three notes of G major appear in three stacks as you move up the neck. Each has a different note on top.', show: (L) => { [[-1, -1, -1, 4, 3, 3], [-1, -1, -1, 7, 8, 7], [-1, -1, -1, 12, 12, 10]].forEach((fr, i) => L.later(i * 1400 + 100, () => { Neck.clear(); L.voicing(fr, 7, [0, 4, 7], 0); })); L.scroll(8); } },
          { t: 'Check.', check: { type: 'tap', items: [{ prompt: 'In the G triad at frets 7 to 8, tap the <b>3rd</b> (B).', target: (s, f) => s === 5 && f === 7, show: (L) => L.voicing([-1, -1, -1, 7, 8, 7], 7, [0, 4, 7], 0, { silent: true }) }] } },
        ],
      },
      {
        id: 'modes', title: 'Modes in one picture', kind: 'theory', mins: 4, blurb: 'Same notes, different home, different mood.',
        steps: [
          { t: 'Play the notes of C major, but treat <b>D</b> as home, and you get <b>D Dorian</b>. Same notes, new center, new mood.', show: (L) => { L.scale(0, MAJ, [0, 5], { names: true, cls: 'dim' }); L.later(300, () => L.all(2, { ring: true }, 5)); } },
          { t: 'Each mode is the major scale started from a different note.', html: chips([['1', 'Ionian (major)', '#ff7b54'], ['2', 'Dorian', '#8be0a4'], ['3', 'Phrygian', '#ffd166'], ['4', 'Lydian', '#6fe0d6'], ['5', 'Mixolydian', '#5aa9ff'], ['6', 'Aeolian (minor)', '#f59bdc'], ['7', 'Locrian', '#c69cff']]) },
          { t: 'Listen to the moods. <b>Dorian</b> is minor with a brighter 6th. <b>Mixolydian</b> is major with a bluesy ♭7.', show: (L) => { L.play([50, 52, 53, 55, 57, 59, 60, 62], 0.26, 0.1); L.play([43, 45, 47, 48, 50, 52, 53, 55], 0.26, 2.6); } },
          { t: 'Check.', check: { type: 'quiz', items: [
            { q: 'D Dorian uses the same notes as which major scale?', options: ['C major', 'D major', 'G major'], answer: 0 },
            { q: 'Which mode is the natural minor scale?', options: ['Lydian', 'Aeolian', 'Ionian'], answer: 1 },
          ] } },
        ],
      },
      {
        id: 'tab', title: 'Reading tab', kind: 'play', mins: 3, blurb: 'Read guitar music in five minutes.',
        steps: [
          { t: '<b>Tab</b> is guitar music made simple. Six lines are the six strings, with the high e on top. Numbers tell you which fret to play.', html: tabBlock(['e|--0--0--1--3--3--1--0-----|', 'B|-------------------------3-|', 'G|---------------------------|', 'D|---------------------------|', 'A|---------------------------|', 'E|---------------------------|']), show: (L) => L.seq([at(5, 0), at(5, 0), at(5, 1), at(5, 3), at(5, 3), at(5, 1), at(5, 0), at(4, 3)], 0.4) },
          { t: 'Read left to right. Numbers stacked on top of each other are played together, like a chord.', html: tabBlock(['e|--0--|', 'B|--1--|', 'G|--0--|', 'D|--2--|', 'A|--3--|', 'E|-----|']), show: (L) => L.chord(0, 'maj') },
          { t: 'The Tab player can play any tab you paste, at any speed, right on the neck.', html: '<button class="btn" data-goto="tabs">Open the Tab player after this lesson</button>' },
          { t: 'Play the first line of tab from step 1.', check: { type: 'seq', exact: true, prompt: 'Follow the tab: e string 0, 0, 1, 3', cells: [at(5, 0), at(5, 0), at(5, 1), at(5, 3)] } },
        ],
      },
    ],
  },
];

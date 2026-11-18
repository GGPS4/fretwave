# Fretwave

Learn the guitar fretboard by **seeing** and **hearing** it. Fretwave is a free, single-page web app built for visual and auditory learners: every note has its own color everywhere on the neck, every tap plays a real plucked-string sound, strings vibrate when they ring, and note names can be spoken aloud.

No sign-up, no install, no build step. It's one `index.html` you can host on GitHub Pages.

## What's inside

The app has four sections, each with a few pages, so there's never a wall of menus.

### Learn
| Page | What it does |
|---|---|
| **Path** | A guided course in 6 levels and 33 short lessons, from string names to the CAGED system. A placement quiz on first launch starts you at the right level. One "Up next" card always shows the next lesson, a roadmap bar shows where you are, and **spaced review** brings finished lessons back for a quick refresh 1, 3, 7, 16, 35 and 90 days later (sooner if you miss). The path is never locked, and every level has a "test out" quiz. |
| **Theory notes** | A guidebook for each level, plus **printable cheat sheets**: fretboard note map, open chord chart with fingerings, pentatonic shapes, CAGED shapes, circle of fifths and key table, and each level's guidebook. Print or save as PDF. |
| **Progress** | The neck as a heat map of your accuracy, accuracy per note, streaks and lessons finished. |

Lessons are animated on the neck and read aloud (you can switch narration off). Each one ends with a check: tap the right fret, answer a quick question, name what you hear, play a sequence, or play a chord into the mic and get told which string needs work.

The curriculum: **1 Meet the neck** (strings, musical alphabet, half and whole steps, notes on the low E and A strings, octave shapes, the 12th fret) · **2 Chords from scratch** (intervals, triads, major vs minor, E A D, G C Em Am, power chords, seventh chords) · **3 Keys and progressions** (major scale, keys, chords in a key, common progressions, circle of fifths, relative minor) · **4 Techniques** (hammer-ons and pull-offs, slides, bends, vibrato, each animated with real pitch changes) · **5 Scales for soloing** (pentatonic shapes, blues scale, targeting chord tones, 3-notes-per-string major) · **6 See the whole neck** (CAGED, triads, modes, reading tab).

### Practice
**Find it** (find a named note on the neck, or play it on your guitar), **Name it** (name the lit-up fret), **Ear training** (intervals and chord qualities, then play what you heard back on your guitar; plus a **Play it back** melody-echo exercise). Smart order keeps bringing back your weak spots.

### Play (with your real guitar)
| Page | What it does |
|---|---|
| **Jam room** | A synthesized band (drums, bass, chords) in pop, rock, 12-bar blues, minor ballad, funk, reggae, jazz ii–V–I, metal or country, in any key and tempo. The neck shows the scale with the current chord's notes lit up, and previews the next chord. Turn on the mic and it tells you whether each note you play fits. |
| **Tab player** | Paste any ASCII guitar tab (or pick an example) and watch it play on the neck at 25%–150% speed, with looping, stepping, and the next note shown ahead of time. |
| **Live view** | Play anything: notes light up where they live on the neck, chords get named, and it works out which key you seem to be playing in. |
| **Chord check** | Strum a chord and see which notes rang out and which string to fix. Includes "one-minute changes" (switch between two chords as many times as you can, with your best score saved) and "name what I play". |

### Tools
**Neck** explorer, **Chords** (13 types, generated shapes, progressions, a **CAGED map**, and an animated **fretting hand** showing which finger goes where), **Scales** (10 scales by position, with a loop-and-speed-up trainer), **Circle of fifths** (interactive: tap a key and it rotates to the top with its chords lit up), **Tunings** (10 guitar tunings compared string by string, plus a step-by-step **retuning wizard** with a mic tuner), **Tuner**. A **metronome** with tap tempo and a **speed trainer** lives in the top bar on every page.

### Everywhere
Guitar, bass and ukulele; six guitar tunings; 12–24 frets; left-handed mode; sharps or flats; spoken note names; keyboard shortcuts; phone layout with a bottom tab bar.

## Install it as an app

Fretwave is a Progressive Web App. On GitHub Pages, open **Settings → Sync and app → Install Fretwave** (or use your browser's "Install app" / "Add to Home Screen"). Once installed it works offline.

**Daily reminders:** turn them on in the same tab. Notifications work best with the app installed in Chrome, Edge or on Android. For iPhone (and everyone else), **Add to my calendar** downloads a repeating daily practice event.

## Sync across devices

Two ways:

1. **Progress code (no account):** Settings → Sync and app → *Copy my progress code*, then paste it on your other device. Progress is merged, never overwritten.
2. **Google sign-in (optional):** create a free Firebase project and paste its config into `firebase-config.js`. The file has step-by-step instructions, including the Firestore security rules. Once that's filled in, a *Sign in with Google* button appears and progress syncs automatically.

## How the sound works

There are no audio files. Notes are synthesized in the browser with the Karplus–Strong plucked-string algorithm (with fractional-delay tuning so every pitch is accurate), so it sounds like a string, not a beep. Spoken note names use the browser's built-in speech. Pitch detection for the mic modes uses the YIN algorithm.

Progress is saved in your browser (localStorage), so it stays on the device you practice on.

## Run it

Open `index.html` in a browser. That's it.

### Put it on GitHub Pages

1. Push this folder to a GitHub repo.
2. In the repo go to **Settings → Pages**.
3. Under **Build and deployment**, pick **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
4. After a minute your app is live at `https://<your-username>.github.io/<repo-name>/`.

The mic features (Find it with your real guitar, and the Tuner) need the page to be served over HTTPS, which GitHub Pages does for you.

## Editing the code

The source is split for readability:

```
src/index.html     page shell
src/styles.css     all styles
src/js/1-core.js        music theory, state, audio engine, mic pitch detection
src/js/1b-audio.js      chord listening (chroma), drums/bass synth, metronome
src/js/2-neck.js        the fretboard renderer and chord-shape finder
src/js/2b-hand.js       fingering, animated fretting hand, bend/slide/hammer/vibrato animations
src/js/3-modes.js       Explore, Find it, Name it
src/js/4-modes.js       Chords, Scales
src/js/5-app.js         Ear, Tuner, Progress
src/js/7-learn.js       learning path, lesson player, checks, theory notes
src/js/7b-curriculum.js the 29 lessons and level guidebooks
src/js/8-play.js        CAGED map, Jam room, Tab player, Live view, Chord check
src/js/8c-tools.js      circle of fifths, tunings explorer + wizard, printable cheat sheets
src/js/9-sync.js        settings, progress codes, Google sync, install, reminders
src/js/99-boot.js       app shell and navigation
sw.js, manifest.webmanifest, icons/   installable app files
```

After editing, rebuild the single-file `index.html`:

```
python3 tools/build.py
```

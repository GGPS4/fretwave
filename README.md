# Fretwave

Learn the guitar fretboard by **seeing** and **hearing** it. Fretwave is a free, single-page web app built for visual and auditory learners: every note has its own color everywhere on the neck, every tap plays a real plucked-string sound, strings vibrate when they ring, and note names can be spoken aloud.

No sign-up, no install, no build step. It's one `index.html` you can host on GitHub Pages.

## What's inside

| Mode | What it does |
|---|---|
| **Explore** | A realistic rosewood neck. Tap any fret to hear it and see every other spot with the exact same pitch. Show all notes, naturals only, one note at a time, or a blank neck to quiz yourself. |
| **Find it** | The core fretboard drill: "Find C on the 5th string" or "Find every C". Choose strings, fret range and naturals vs. all 12 notes. Answer by tapping, or **play it on your real guitar** and the mic detects the pitch. |
| **Name it** | A fret lights up and plays; name it on a color keyboard (or press A–G). Wrong guesses play your guess so you hear the difference. |
| **Chords** | 13 chord types in every key. Shapes are generated for the current tuning, with tones colored by role (root, 3rd, 5th, 7th) across the whole neck. Strum, arpeggiate, and loop common progressions (I–V–vi–IV, ii–V–I…). |
| **Scales** | 10 scales and modes, colored by scale degree, split into playable positions. Press play and follow the lights, with an optional root drone. |
| **Ear** | Interval and chord-quality ear training. After each answer the neck draws the shape you just heard. Each interval comes with a song to remember it by. |
| **Tuner** | Reference tones for each string plus a mic-based tuner with a needle dial. |
| **Progress** | The neck turns into a heat map of your accuracy. Per-note accuracy bars, daily goal ring and day streak. "Smart order" in the games keeps bringing back your weak spots. |

Also: guitar, bass and ukulele; standard, drop D, half-step down, DADGAD, open G and open D tunings; 12–24 frets; left-handed mode; sharps or flats; keyboard shortcuts; works on phones (bottom tab bar, swipeable neck).

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
src/js/1-core.js   music theory, state, audio engine, mic pitch detection
src/js/2-neck.js   the fretboard renderer and chord-shape finder
src/js/3-modes.js  Explore, Find it, Name it
src/js/4-modes.js  Chords, Scales
src/js/5-app.js    Ear, Tuner, Progress, Settings, app shell
```

After editing, rebuild the single-file `index.html`:

```
python3 tools/build.py
```

# Aural Lab

**Listen. Sing. Read. Write.** — the ear-training / sight-singing (시창청음)
site of Mia Music Studio, alongside Theory Lab (music-fundamentals-v2) and
Piano Lab. Static site, no build step; publish pattern: own repo
(`mia-aural-lab`) + GitHub Pages.

## Course

4 units · 44 lessons, integrated (rhythm, pitch, solfège, singing, dictation,
harmony, error detection — NOT separate labs). Lesson ids are permanent:
`aural-u1-l1` … `aural-u4-l11`; student-facing numbering is `1-1`, `2-14`, …
All structure lives in `js/curriculum.js` (single source of truth — the LMS
seed and every page render from it).

- **Ready:** 1-1 Meter and Rhythm Foundations (`lessons/aural-u1-l1.html`)
- **Planned:** all other lessons — `lesson.html?id=…` shows honest
  placeholders with the real metadata (never presented as finished lessons).

## Shared engines (js/)

| file | role |
|---|---|
| `audio.js` | THE audio engine — piano-like tones, accented pulse, count-in, melodic/harmonic playback; one playback at a time; mobile unlock; beat times exported in `performance.now()` domain for tap grading |
| `rhythm-input.js` | F=LH / J=RH capture (keydown/keyup, key-repeat guarded) + touch pads + scoring: correct/early/late/wrong-hand/extra/missed, chord window for F+J together, steadiness, best streak. Node-testable: `tests/rhythm-score.test.js` |
| `solfege.js` | course-wide solfège setting: movable/fixed do, scale degrees, letters; do-based / la-based minor; full chromatic syllable maps. Default: scale degrees + movable do, combined "7/ti" display |
| `curriculum.js` | units, lessons, header fields (Description / Mia's Tip / Let's Try), skill tags, Music-Major-Track flags, permanent LMS item ids |
| `progress.js` | on-device attempts/best/mastery (`al-progress-v1`) |
| `lms.js` | Supabase sync, course `aural-lab`, offline queue — same RPC protocol as Piano Lab |
| `mia.js` | Mia character (same SVG as the rest of the studio) + speech bubbles |
| `i18n.js` + `locales/en.js` | UI strings; ko/es mirror later |

## Dev notes

- Cache-busting: bump `?v=NNN` on script/css tags when files change.
- No node needed to run the site. For the tests / seed generator without a
  node install, use the Electron-as-node trick:
  `ELECTRON_RUN_AS_NODE=1 "%LOCALAPPDATA%\Programs\moises-desktop\Moises.exe" tests\rhythm-score.test.js`
- LMS: run `supabase/01-course-seed.sql` once (see `supabase/SETUP.md`).

## Roadmap (per course spec)

- Phone-connected singing: computer shows score/plays reference; phone is the
  microphone (getUserMedia + autocorrelation), QR/session-code pairing,
  listen-then-sing turn-taking, no raw recordings saved by default.
- Notation-input engine for dictation Build-Your-Answer mode (1-7 … 1-10),
  with overfill/incomplete-measure detection and Play-My-Answer.
- Dictation Mode A (choose among plausible notated distractors) + Mode B.

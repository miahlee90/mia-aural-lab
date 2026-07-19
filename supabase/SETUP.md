# Aural Lab — LMS setup (one-time, owner)

Aural Lab uses the SAME shared Supabase project as Music Fundamentals and
Piano Lab (multi-course schema). Nothing new to create — just register the
course:

1. Open the Supabase SQL editor for the shared project.
2. Run `01-course-seed.sql` (generated from `js/curriculum.js` by
   `tools/gen-lms-seed.js`). It is additive and touches only the
   `aural-lab` course.
3. Done. Teachers approved for the studio can create Aural Lab classes from
   `teacher.html`; students sign in with the same two-code system.

Re-run the seed any time the curriculum changes (lesson ids are permanent, so
re-running is always safe).

Until the seed is run, the site works fully — student progress just stays
on-device (localStorage) and the sync chip does not appear.

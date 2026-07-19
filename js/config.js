/* Aural Lab — app configuration.
   APP_NAME is the site brand; nothing else in the codebase hardcodes it —
   always read it from here. */
const AL_CONFIG={
  APP_NAME:"Aural Lab",
  TAGLINE:"Listen. Sing. Read. Write.",
  VERSION:"0.1.0",
  LANG:"en"            /* future: "ko", "es" — add locales/<lang>.js */
};

/* LMS — the SAME shared Supabase project as Music Fundamentals and Piano Lab
   (multi-course). Only the URL + publishable (anon) key belong here; both are
   public and protected by row-level security. Leave blank to run with the LMS
   disabled (progress then stays on-device only). Aural Lab is registered as
   the 'aural-lab' course; run supabase/01-course-seed.sql once to add it. */
const LMS_CONFIG={
  SUPABASE_URL:"https://aeojiauqujttnqhmvurh.supabase.co",
  SUPABASE_ANON_KEY:"sb_publishable_hWzCbNlPsqD2UHr9RGID6Q_Nj_lCAqT"
};
if(typeof module!=="undefined") module.exports=AL_CONFIG;

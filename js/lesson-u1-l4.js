/* Aural Lab — UNIT 1 · LESSON 1-4 "Long and Short Sounds".
   Data + wiring only. Uses the shared engine + ALDur provider
   (js/duration-activities.js). One pitch/volume/timbre everywhere — the
   answer lives in DURATION alone. Short = 1 pulse, Long = 2, Silence = 1
   for these activities (the terms note says real music is freer). Echo
   input is press-and-hold (Spacebar or the touch pad); no microphone. */
ALLessonEngine.run({
  id:"aural-u1-l4",
  provider:ALDur,
  categoryKey:"skill.Rhythm",
  minutes:"25–30",
  summaryKey:"l14.summary",
  welcomeKey:"ms.welcome.dur",
  goals:["l14.goal1","l14.goal2","l14.goal3","l14.goal4"],

  /* five key terms — tiny bar visual + a generated audio example each */
  terms:[
    {id:"duration",  nameKey:"term.duration",  defKey:"term.duration.def",
     vis:{html:ALDur.termBar(["S","L"])},      tones:[{midi:60,beat:0,dur:.85},{midi:60,beat:1.6,dur:1.85}]},
    {id:"longSound", nameKey:"term.long",      defKey:"term.long.def",
     vis:{html:ALDur.termBar(["L"])},          tones:[{midi:60,beat:0,dur:1.85}]},
    {id:"shortSound",nameKey:"term.short",     defKey:"term.short.def",
     vis:{html:ALDur.termBar(["S"])},          tones:[{midi:60,beat:0,dur:.85}]},
    {id:"silence",   nameKey:"term.silence",   defKey:"term.silence.def",
     vis:{html:ALDur.termBar(["S","R","S"])},  tones:[{midi:60,beat:0,dur:.85},{midi:60,beat:2,dur:.85}]},
    {id:"durPattern",nameKey:"term.durPattern",defKey:"term.durPattern.def",
     vis:{html:ALDur.termBar(["S","L","S"])},  tones:[{midi:60,beat:0,dur:.85},{midi:60,beat:1,dur:1.85},{midi:60,beat:3,dur:.85}]}
  ],
  /* "1 pulse / 2 pulses / 1 pulse" applies to THESE activities only */
  termsNoteKey:"d4.termsNote",

  /* four guided activities — Learn records completion only (no score) */
  activities:[
    {id:"a1",titleKey:"d4.act1.title",instrKey:"d4.act1.help",build:ALDur.guidedLS},
    {id:"a2",titleKey:"d4.act2.title",instrKey:"d4.act2.help",build:ALDur.guidedCmp},
    {id:"a3",titleKey:"d4.act3.title",instrKey:"d4.act3.help",build:ALDur.guidedPat},
    {id:"a4",titleKey:"d4.act4.title",instrKey:"d4.act4.help",build:ALDur.guidedEcho}
  ],

  /* teacher report: quiz results only — the four skills of this quiz
     (long_short / duration_comparison / duration_pattern_matching /
      duration_reproduction) */
  resultMetrics:[
    {labelKey:"res.ls",   cats:[1],mode:"count"},
    {labelKey:"res.cmp",  cats:[2],mode:"count"},
    {labelKey:"res.patm", cats:[3],mode:"count"},
    {labelKey:"res.repro",cats:[4],mode:"count"}
  ],

  /* foundational lesson: exactly 20 quiz questions in 4 ordered sections of
     5 (ALDur.pickQuiz). Practice stays open-ended with Go-to-Quiz always. */
  quizCount:20,
  quizBank:[],   /* provider.pickQuiz builds the ordered set */
  /* practice shows the question + choices BEFORE the sound and waits for a
     Play press, so the student can prepare (durations are easy to miss) */
  manualPlay:true,
  /* fixed compact reservation (same standard as 1-3) — measured: tallest
     states (echo pad+slots 226, model-vs-you reveal 238) + quiz dots + a
     wrapped feedback line stay under 300 */
  arenaMin:300,

  nextId:"aural-u1-l5",
  nextBlurbKey:"l14.next.blurb"
});

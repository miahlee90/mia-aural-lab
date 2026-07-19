/* Aural Lab — UNIT 1 · LESSON 1-3 "Steps, Skips, and Repeated Notes".
   Data + wiring only. Uses the shared engine + ALPitch3 provider (js/
   pitch3-activities.js) which reuses the pitch ladder / draw grid (ALGrid).
   Movable-Do, five levels Do–Sol; no note names, staves, clefs, keys, or
   intervals. Singing is modeled and prompted, never microphone-scored;
   drawing grades pitch order only. */
ALLessonEngine.run({
  id:"aural-u1-l3",
  provider:ALPitch3,
  categoryKey:"skill.Pitch",
  minutes:"25–30",
  summaryKey:"l13.summary",
  welcomeKey:"ms.welcome.p3",
  goals:["l13.goal1","l13.goal2","l13.goal3","l13.goal4"],

  /* five key terms with a short generated audio + visual example */
  terms:[
    {id:"refDo",  nameKey:"term.refDo",  defKey:"term.refDo.def",   vis:{n:1}, melody:[60]},
    {id:"step",   nameKey:"term.step",   defKey:"term.step.def",    vis:{n:2}, melody:[60,62]},
    {id:"skip",   nameKey:"term.skip",   defKey:"term.skip.def",    vis:{n:2}, melody:[60,64]},
    {id:"repeat", nameKey:"term.repeat", defKey:"term.repeat.def",  vis:{n:2}, melody:[64,64]},
    {id:"pattern",nameKey:"term.pattern",defKey:"term.pattern.def", vis:{n:5}, melody:[60,62,64,62,60]}
  ],

  /* four guided activities — Learn records completion only (no score) */
  activities:[
    {id:"a1",titleKey:"p3.act1.title",instrKey:"p3.act1.help",build:ALPitch3.guidedLadder},
    {id:"a2",titleKey:"p3.act2.title",instrKey:"p3.act2.help",build:ALPitch3.guidedSSR},
    {id:"a3",titleKey:"p3.act3.title",instrKey:"p3.act3.help",build:ALPitch3.guidedShape},
    {id:"a4",titleKey:"p3.act4.title",instrKey:"p3.act4.help",build:ALPitch3.guidedSingDraw}
  ],

  /* teacher report: quiz results only, one count metric per section */
  resultMetrics:[
    {labelKey:"res.ssr",  cats:[1],mode:"count"},
    {labelKey:"res.match",cats:[2],mode:"count"},
    {labelKey:"res.draw", cats:[3],mode:"count"}
  ],

  /* open-ended practice; quiz is exactly 10, ordered sections (ALPitch3
     .pickQuiz supplies 3 step/skip/repeat + 3 pattern-match + 4 draw) */
  quizCount:10,
  quizBank:[],   /* provider.pickQuiz builds the ordered set */
  /* reserve a fixed content height so the Next/Continue row never jumps as
     draw grids and choice questions of differing heights swap in */
  /* practice and quiz share the same compact reservation (instructor loved the
     quiz layout): the tallest state anywhere is one 460×196 grid + a line of
     text, because answered choices give way to the reveal instead of stacking */
  arenaMin:300,

  nextId:"aural-u1-l4",
  nextBlurbKey:"l13.next.blurb"
});

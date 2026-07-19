/* Aural Lab — UNIT 1 · LESSON 1-2 "Pitch Foundations".
   Data + wiring only. The lesson experience is the shared js/lesson-engine.js;
   the pitch interactions are js/pitch-activities.js (ALPitch), plugged in as
   the engine's `provider`. No note names, clefs, staves, or intervals appear —
   only high/low, same/different, direction, and dot-contour shapes. */
ALLessonEngine.run({
  id:"aural-u1-l2",
  provider:ALPitch,
  categoryKey:"skill.Pitch",
  minutes:"25–30",
  summaryKey:"l12.summary",
  welcomeKey:"ms.welcome.pitch",
  goals:["l12.goal1","l12.goal2","l12.goal3","l12.goal4"],

  /* five key terms, each with a short generated melody example */
  terms:[
    {id:"pitch",    nameKey:"term.pitch",    defKey:"term.pitch.def",     vis:{n:1}, melody:[60,64,67]},
    {id:"higher",   nameKey:"term.higher",   defKey:"term.higher.def",    vis:{n:2}, melody:[60,69]},
    {id:"lower",    nameKey:"term.lower",    defKey:"term.lower.def",     vis:{n:2}, melody:[69,60]},
    {id:"samePitch",nameKey:"term.samePitch",defKey:"term.samePitch.def", vis:{n:2}, melody:[64,64]},
    {id:"pitchDir", nameKey:"term.pitchDir", defKey:"term.pitchDir.def",  vis:{n:3}, melody:[60,64,67]}
  ],

  /* four guided listening activities (spec order) */
  activities:[
    {id:"a1",titleKey:"p.act1.title",instrKey:"p.act1.help",build:ALPitch.guidedHigherLower},
    {id:"a2",titleKey:"p.act2.title",instrKey:"p.act2.help",build:ALPitch.guidedSameDiff},
    {id:"a3",titleKey:"p.act3.title",instrKey:"p.act3.help",build:ALPitch.guidedDirection},
    {id:"a4",titleKey:"p.act4.title",instrKey:"p.act4.help",build:ALPitch.guidedShapeMatch}
  ],

  /* results dashboard — one metric per pitch category (no beat/timing) */
  resultMetrics:[
    {labelKey:"res.hl", cats:[1]},
    {labelKey:"res.sd", cats:[2]},
    {labelKey:"res.dir",cats:[3]},
    {labelKey:"res.shape",cats:[4]}
  ],

  /* open-ended practice; quiz spread evenly across the 4 categories.
     (The 1-2 spec lists 20 = 5 per category; kept to the instructor's
     10–15 preference — 12 = 3 per category. Change quizCount to adjust.) */
  quizCount:12,
  quizBank:ALPitch.buildQuizBank(),
  /* reserve a fixed content height so the Play/Continue row never jumps as the
     pitch-dot reveal and the (taller) shape-match choices swap in */
  arenaMin:280,

  nextId:"aural-u1-l3",
  nextBlurbKey:"l12.next.blurb"
});

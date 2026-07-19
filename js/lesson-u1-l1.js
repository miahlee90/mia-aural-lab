/* Aural Lab — UNIT 1 · LESSON 1-1 "Meter and Rhythm Foundations".
   This file is DATA + wiring only: the lesson experience (roadmap, sound
   check, sections, practice, quiz, results, saving, localization) lives in
   js/lesson-engine.js, and the rhythm interactions live in
   js/rhythm-activities.js. Future lessons are created the same way —
   a schema like this one plus any new activity builders. */
ALLessonEngine.run({
  id:"aural-u1-l1",
  categoryKey:"skill.Rhythm",
  minutes:"25–30",
  summaryKey:"l11.summary",
  goals:["ms.goal1","ms.goal2","ms.goal3","ms.goal4"],

  /* five key terms, each with a mini pulse visual + generated audio */
  terms:[
    {id:"beat",   nameKey:"term.beat",   defKey:"term.beat.def",
     vis:{n:4},               audio:{beats:8,bpm:80}},
    {id:"meter",  nameKey:"term.meter",  defKey:"term.meter.def",
     vis:{n:6,strongEvery:3}, audio:{beats:6,bpm:88,m:3}},
    {id:"measure",nameKey:"term.measure",defKey:"term.measure.def",
     vis:{n:4,strongEvery:4}, audio:{beats:8,bpm:88,m:4}},
    {id:"strong", nameKey:"term.strong", defKey:"term.strong.def",
     vis:{n:3,strongEvery:3}, audio:{beats:6,bpm:80,m:3}},
    {id:"weak",   nameKey:"term.weak",   defKey:"term.weak.def",
     vis:{n:4,strongEvery:4}, audio:{beats:8,bpm:80,m:4}}
  ],

  /* the four guided activities (builders from the rhythm library) */
  activities:[
    {id:"a1",titleKey:"act1.title",instrKey:"act1.help",pads:true,
     build:ALRhythm.guidedFindBeat},
    {id:"a2",titleKey:"act2.title",instrKey:"act2.help",
     build:ALRhythm.guidedGrouping},
    {id:"a3",titleKey:"act3.title",instrKey:"act3.help",
     build:ALRhythm.guidedStrongWeak},
    {id:"a4",titleKey:"act4.title",instrKey:"act4.help",pads:true,
     build:ALRhythm.guidedTapMeasure}
  ],

  /* Practice is open-ended (ear training benefits from unlimited fresh
     items — leave practiceCount unset). The graded quiz is 10 questions,
     drawn from a 52-item bank spread across the 4 categories. */
  quizCount:10,
  quizBank:ALRhythm.buildQuizBank(),

  nextId:"aural-u1-l2",
  nextBlurbKey:"l11.next.blurb"
});

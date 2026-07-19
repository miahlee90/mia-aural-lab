/* Node smoke test for the shared rhythm scorer (js/rhythm-input.js).
   Run:  node tests/rhythm-score.test.js  — exits non-zero on failure. */
const ALTap=require("../js/rhythm-input.js");
let fails=0;
function check(name,cond){ console.log((cond?"  ok  ":"  FAIL")+" — "+name); if(!cond) fails++; }

const beats=[0,500,1000,1500,2000,2500,3000,3500].map(at=>({at:at+10000,hand:"any"}));
const tap=(atOffset,hand,dur)=>({hand:hand||"R",downAt:10000+atOffset,upAt:10000+atOffset+(dur||120)});

/* 1. perfect taps → all correct, streak = 8, no early/late/missed */
let r=ALTap.score(beats.map(b=>tap(b.at-10000)),beats,{window:120,earlyLate:60});
check("perfect: 8 correct",r.correct===8);
check("perfect: accuracy 100",r.accuracy===100);
check("perfect: streak 8",r.bestStreak===8);
check("perfect: steadiness high",r.steadiness>=95);

/* 2. consistently early by 90ms → flagged early, not missed */
r=ALTap.score(beats.map(b=>tap(b.at-10000-90)),beats,{window:120,earlyLate:60});
check("early: 8 early",r.early===8&&r.missed===0);
check("early: partial credit",r.accuracy===50);

/* 3. a missed beat and an extra tap are both counted */
const taps3=beats.slice(0,7).map(b=>tap(b.at-10000)); taps3.push(tap(3750));
r=ALTap.score(taps3,beats,{window:120,earlyLate:60});
check("missed: 1 missed",r.missed===1);
check("extra: 1 extra",r.extraCount===1);

/* 4. F+J within the chord window merge to a both-hands hit */
r=ALTap.score([tap(0,"L"),tap(30,"R")],[{at:10000,hand:"B"}],{window:120,earlyLate:60,chordWindow:80});
check("chord: merged to Both",r.events[0].hand==="B"&&r.events[0].handOk===true);

/* 5. wrong hand detected */
r=ALTap.score([tap(0,"L")],[{at:10000,hand:"R"}],{window:120,earlyLate:60});
check("wrong hand flagged",r.wrongHand===1);

/* 6. key-repeat storm (many taps at ~30ms apart) doesn't inflate correct count */
const storm=[]; for(let i=0;i<40;i++) storm.push(tap(i*30));
r=ALTap.score(storm,beats,{window:120,earlyLate:60});
check("storm: correct ≤ targets",r.correct<=beats.length);
check("storm: extras counted",r.extraCount>0);

process.exit(fails?1:0);

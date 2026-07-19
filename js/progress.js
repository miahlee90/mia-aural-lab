/* Aural Lab — student progress store (localStorage on this device; the LMS
   layer in js/lms.js syncs completion to the shared Supabase project when a
   student is signed in — same pattern as Piano Lab).

   Per attempt we keep what the course spec asks for: lesson id, mode
   (learn/practice/test), accuracy, response stats, replays, hint use, and the
   skill-specific accuracies that apply (singing/dictation pitch & rhythm are
   null until those lesson types exist). Mastery: a lesson is "completed" once
   a Practice or Test run finishes with accuracy ≥ the lesson's bar (default
   70). Best score and last-practiced are tracked per lesson+mode. */
const ALProgress=(()=>{
  const KEY="al-progress-v1";
  /* Shared-computer / no-login safe: on-device progress is only kept for a
     SIGNED-IN student (who also has the LMS server as the durable record).
     Anonymous visitors keep progress in memory only — nothing is written to
     or read from localStorage, so a fresh page load shows a clean slate and
     one student's completions never greet the next person. */
  const persist=()=> typeof ALTrack!=="undefined" && ALTrack.enabled && !!ALTrack.session();
  let mem={attempts:[],best:{},seen:{}};
  function all(){
    if(!persist()) return mem;
    try{
      const d=JSON.parse(localStorage.getItem(KEY))||{};
      return {attempts:d.attempts||[],best:d.best||{},seen:d.seen||{}};
    }catch(e){ return {attempts:[],best:{},seen:{}}; }
  }
  function save(d){
    if(!persist()){ mem=d; return; }
    try{ localStorage.setItem(KEY,JSON.stringify(d)); }catch(e){}
  }
  const kk=(lesson,mode)=>lesson+"|"+(mode||"all");

  function touch(lesson,mode){
    const d=all();
    d.seen[kk(lesson,mode)]=d.seen[kk(lesson)]=new Date().toISOString();
    save(d);
  }
  /* a={lesson,mode,accuracy,completed, stats:{...anything lesson-specific},
       replays,hints,responseMs, pitchAcc,rhythmAcc,dictPitchAcc,dictRhythmAcc} */
  function record(a){
    const d=all();
    a.at=new Date().toISOString();
    d.attempts.push(a);
    if(d.attempts.length>400) d.attempts=d.attempts.slice(-400);
    d.seen[kk(a.lesson,a.mode)]=d.seen[kk(a.lesson)]=a.at;
    if(a.completed){
      const k=kk(a.lesson,a.mode), b=d.best[k]||{};
      if(!b.completedAt) b.completedAt=a.at;
      if(!(b.accuracy>=a.accuracy)){ b.accuracy=a.accuracy; b.stats=a.stats; b.at=a.at; }
      d.best[k]=b;
      const kb=kk(a.lesson), bb=d.best[kb]||{};
      if(!bb.completedAt) bb.completedAt=a.at;
      if(!(bb.accuracy>=a.accuracy)) bb.accuracy=a.accuracy;
      d.best[kb]=bb;
    }
    save(d);
  }
  function best(lesson,mode){ return all().best[kk(lesson,mode)]||null; }
  function lastPracticed(lesson){ return all().seen[kk(lesson)]||null; }
  function status(lesson){
    const d=all();
    if((d.best[kk(lesson)]||{}).completedAt) return "completed";
    if(d.seen[kk(lesson)]) return "progress";
    return "none";
  }
  function recent(n){ return all().attempts.slice(-(n||5)).reverse(); }
  return {record,touch,best,status,lastPracticed,recent,all};
})();
if(typeof module!=="undefined") module.exports=ALProgress;

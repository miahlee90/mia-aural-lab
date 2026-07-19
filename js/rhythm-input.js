/* Aural Lab — shared rhythm input + scoring.

   INPUT. Computer: F = Left Hand, J = Right Hand, F+J together = Both Hands.
   keydown/keyup timestamps are captured (performance.now()); the OS key-repeat
   is ignored (e.repeat + a held-keys set — acceptance test #3). Mobile: two
   large touch pads (LEFT HAND / RIGHT HAND) wired with pointerdown/up.

   SCORING. score(taps,targets,opts) matches tap onsets to target beats and
   classifies every event: correct / early / late / wrongHand / extra /
   missed, plus held duration, simultaneous-hands detection (a chord window
   groups F and J pressed "together"), inter-tap steadiness and best streak.
   Lessons choose the timing windows; nothing here silently corrects input. */
const ALTap=(()=>{

  /* ---------- capture ---------- */
  /* attach({onTap({hand,downAt}),onRelease({hand,downAt,upAt,duration}),
              leftPad,rightPad}) → {detach,taps} */
  function attach(opts){
    const taps=[];               /* {hand:'L'|'R',downAt,upAt|null} */
    const open={};               /* hand → open tap (for keyup pairing) */
    const held=new Set();        /* physical guard beyond e.repeat */
    const padOf=hand=>hand==="L"?opts.leftPad:opts.rightPad;
    function down(hand){
      const tp={hand,downAt:performance.now(),upAt:null};
      taps.push(tp); open[hand]=tp;
      const pad=padOf(hand); if(pad) pad.classList.add("tp-active");  /* keys light the pads too */
      if(opts.onTap) opts.onTap(tp);
    }
    function up(hand){
      const pad=padOf(hand); if(pad) pad.classList.remove("tp-active");
      const tp=open[hand]; if(!tp) return;
      tp.upAt=performance.now(); open[hand]=null;
      if(opts.onRelease) opts.onRelease(tp);
    }
    function kd(e){
      if(e.repeat) return;                       /* key-repeat guard */
      const k=e.key.toLowerCase();
      if(k!=="f"&&k!=="j") return;
      if(held.has(k)) return;                    /* belt & suspenders */
      held.add(k); e.preventDefault();
      down(k==="f"?"L":"R");
    }
    function ku(e){
      const k=e.key.toLowerCase();
      if(k!=="f"&&k!=="j") return;
      held.delete(k);
      up(k==="f"?"L":"R");
    }
    window.addEventListener("keydown",kd);
    window.addEventListener("keyup",ku);
    const pads=[];
    function bindPad(el,hand){
      if(!el) return;
      const pd=e=>{ e.preventDefault(); down(hand); };
      const pu=e=>{ e.preventDefault(); up(hand); };
      el.addEventListener("pointerdown",pd);
      el.addEventListener("pointerup",pu);
      el.addEventListener("pointercancel",pu);
      el.addEventListener("pointerleave",pu);
      pads.push({el,pd,pu});
    }
    bindPad(opts.leftPad,"L"); bindPad(opts.rightPad,"R");
    function detach(){
      window.removeEventListener("keydown",kd);
      window.removeEventListener("keyup",ku);
      pads.forEach(p=>{ p.el.removeEventListener("pointerdown",p.pd);
        p.el.removeEventListener("pointerup",p.pu);
        p.el.removeEventListener("pointercancel",p.pu);
        p.el.removeEventListener("pointerleave",p.pu); });
      held.clear();
    }
    return {detach,taps};
  }

  /* ---------- scoring ---------- */
  /* taps:    [{hand,downAt,upAt}]
     targets: [{at, hand:'L'|'R'|'B'|'any'}]  (at = perf-ms)
     opts:    {window:120, earlyLate:60, chordWindow:80}
       window     — |dt| ≤ window counts as on the beat
       earlyLate  — |dt| ≤ earlyLate is "on time"; between earlyLate and
                    window it is scored correct but flagged early/late
       chordWindow— F & J within this many ms count as played together
     Returns {events:[per-target {status,hand,dt,duration,handOk}],
              extra:[unmatched taps], correct,early,late,missed,extraCount,
              wrongHand,accuracy,steadiness,bestStreak} */
  function score(taps,targets,opts){
    const W=(opts&&opts.window)||120;
    const EL=(opts&&opts.earlyLate)||60;
    const CW=(opts&&opts.chordWindow)||80;

    /* group taps into "hits": merge an L and an R tap within the chord
       window into one both-hands hit */
    const sorted=[...taps].sort((a,b)=>a.downAt-b.downAt);
    const hits=[]; const used=new Set();
    for(let i=0;i<sorted.length;i++){
      if(used.has(i)) continue;
      const a=sorted[i];
      let both=null;
      for(let j=i+1;j<sorted.length;j++){
        if(used.has(j)) continue;
        if(sorted[j].downAt-a.downAt>CW) break;
        if(sorted[j].hand!==a.hand){ both=j; break; }
      }
      if(both!=null){ used.add(i); used.add(both);
        hits.push({hand:"B",at:(a.downAt+sorted[both].downAt)/2,
          dur:avgDur(a,sorted[both])}); }
      else { used.add(i);
        hits.push({hand:a.hand,at:a.downAt,
          dur:a.upAt?a.upAt-a.downAt:null}); }
    }
    function avgDur(a,b){
      const da=a.upAt?a.upAt-a.downAt:null, db=b.upAt?b.upAt-b.downAt:null;
      return da!=null&&db!=null?(da+db)/2:(da??db);
    }

    /* greedy nearest matching: each target takes the closest unused hit
       within the window */
    const events=targets.map(tg=>({target:tg,status:"missed",dt:null,hand:null,duration:null,handOk:null}));
    const takenHit=new Set();
    /* pass 1: strict window */
    events.forEach(ev=>{
      let best=-1,bestDt=1e9;
      hits.forEach((h,hi)=>{
        if(takenHit.has(hi)) return;
        const dt=h.at-ev.target.at;
        if(Math.abs(dt)<=W&&Math.abs(dt)<Math.abs(bestDt)){ best=hi; bestDt=dt; }
      });
      if(best>=0){
        takenHit.add(best);
        const h=hits[best];
        ev.dt=bestDt; ev.hand=h.hand; ev.duration=h.dur;
        ev.handOk=ev.target.hand==="any"||ev.target.hand===h.hand;
        ev.status=Math.abs(bestDt)<=EL?"correct":(bestDt<0?"early":"late");
      }
    });
    const extra=hits.filter((h,i)=>!takenHit.has(i));

    let correct=0,early=0,late=0,missed=0,wrongHand=0,streak=0,bestStreak=0;
    events.forEach(ev=>{
      if(ev.status==="missed"){ missed++; streak=0; return; }
      if(!ev.handOk) wrongHand++;
      if(ev.status==="correct"&&ev.handOk){ correct++; streak++; bestStreak=Math.max(bestStreak,streak); }
      else { streak=0; if(ev.status==="early") early++; if(ev.status==="late") late++; }
    });
    /* early/late still landed within the window — count them as hit for
       accuracy, but full credit only for on-time + right hand */
    const hit=events.filter(e=>e.status!=="missed").length;
    const accuracy=targets.length?
      Math.round(100*(correct+.5*(hit-correct))/targets.length):0;

    /* steadiness: consistency of inter-hit intervals vs the target period.
       100 = metronomic; falls with the coefficient of variation. */
    let steadiness=null;
    if(hits.length>=3&&targets.length>=2){
      const per=(targets[targets.length-1].at-targets[0].at)/(targets.length-1);
      const iv=[]; for(let i=1;i<hits.length;i++) iv.push(hits[i].at-hits[i-1].at);
      const mean=iv.reduce((a,b)=>a+b,0)/iv.length;
      const sd=Math.sqrt(iv.reduce((a,b)=>a+(b-mean)*(b-mean),0)/iv.length);
      steadiness=Math.max(0,Math.round(100*(1-sd/per)));
    }
    return {events,extra,correct,early,late,missed,wrongHand,
            extraCount:extra.length,accuracy,steadiness,bestStreak};
  }

  return {attach,score};
})();
if(typeof module!=="undefined") module.exports=ALTap;

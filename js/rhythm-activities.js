/* Aural Lab — reusable rhythm interaction library.
   Everything rhythm-flavored that future lessons reuse lives here:
   - TIMING: the ONE place timing thresholds are configured
   - beatTrack: horizontal animated track; markers ride toward a fixed
     judgment line, synchronized with ALAudio's scheduled beat times
     (both live in the performance.now() clock — no drift)
   - runTap: core tap exercise runner (beat-follow or measure-tap)
   - groupingQ / swQ / tapBeatQ / tapMeasureQ: question factories used by
     the guided activities, the practice generator and the quiz engine
   - guided*: the four Learn-by-Doing activities for Lesson 1-1
   All student-facing text goes through t(); F and J stay F and J. */
const ALRhythm=((()=>{

  /* ---------- central timing config (ms) ---------- */
  const TIMING={
    perfect:50, good:115, chordWindow:80,
    modes:{ learn:{window:160}, practice:{window:140}, quiz:{window:115} }
  };
  const scoreOpts=mode=>({window:(TIMING.modes[mode]||TIMING.modes.learn).window,
    earlyLate:TIMING.good,chordWindow:TIMING.chordWindow});
  function tapLabel(ev){
    if(ev.status==="missed") return "miss";
    const a=Math.abs(ev.dt);
    if(a<=TIMING.perfect) return "perfect";
    if(a<=TIMING.good) return "good";
    return ev.dt<0?"early":"late";
  }
  const labelText=l=>t(l==="early"?"fb.earlyLbl":l==="late"?"fb.lateLbl":"fb."+l);

  /* ---------- beat track ---------- */
  function beatTrack(st){
    st.dotsEl.innerHTML='<div class="beat-track" aria-hidden="true"><div class="bt-line"></div></div>';
    const tr=st.dotsEl.firstChild;
    const JUDGE=.16, LEAD=2200;
    /* positions are computed from the shared performance.now() clock every
       frame, so animation and scheduled audio cannot drift apart. A 30 ms
       interval drives the loop (requestAnimationFrame throttles to zero in
       background/headless contexts; the interval is equally accurate here
       because position depends only on time, not on frame count). */
    let markers=[], timer=0;
    function mk(cls,txt){ const d=document.createElement("div");
      d.className="bt-marker"+(cls?" "+cls:""); d.textContent=txt||"";
      d.style.left="110%"; tr.appendChild(d); return d; }
    function setBeats(list){ /* list: [{at,cls,txt}] — perf-ms times */
      markers=list.map(x=>({at:x.at,el:mk(x.cls,x.txt)}));
      clearInterval(timer);
      const step=()=>{
        const w=tr.clientWidth||600, now=performance.now();
        let alive=false;
        markers.forEach(m=>{
          const dt=m.at-now;
          if(dt<-450){ if(m.el.parentNode) m.el.remove(); return; }
          alive=true;
          if(dt>LEAD){ /* not travelling yet — wait visibly at the right edge */
            m.el.style.left=(w-26)+"px"; m.el.style.opacity=".4";
          }else{
            m.el.style.left=(w*JUDGE+(dt/LEAD)*w*(1-JUDGE))+"px";
            m.el.style.opacity=dt<0?String(Math.max(0,1+dt/450)):"1";
          }
        });
        if(!alive) clearInterval(timer);
      };
      timer=setInterval(step,30); step();
    }
    function pop(label){
      const d=document.createElement("div");
      d.className="bt-pop p-"+label; d.textContent=labelText(label);
      tr.appendChild(d); setTimeout(()=>d.remove(),650);
    }
    function stop(){ clearInterval(timer); markers.forEach(m=>m.el.remove()); markers=[]; }
    return {setBeats,pop,stop};
  }

  /* ---------- core tap runner ----------
     opts={st,mode,kind:"beat"|"measure",bpm,m,beats,free,track,numbers,
           visible:true|false,onDone(result)}
     result={accuracy,timingAcc,steadiness,counts:{perfect,good,early,late,miss},
             early,late,missed,extra,bestStreak} */
  function runTap(opts){
    const st=opts.st, mode=opts.mode||"learn";
    const isMeasure=opts.kind==="measure";
    const m=opts.m||0;
    const beats=opts.beats||(isMeasure?m:16);
    const free=isMeasure?0:(opts.free!=null?opts.free:4);
    const countIn=isMeasure?m:0;
    let bt=null, ds=null;
    if(opts.track){ bt=beatTrack(st); }
    else if(opts.visible!==false){ ds=st.dots(beats,{strongEvery:m||0,numbers:opts.numbers}); }
    else st.dotsEl.innerHTML="";
    let sched=null;
    const cap=ALTap.attach({leftPad:st.padL,rightPad:st.padR,
      onTap:tp=>{ /* live label pop at the judgment line */
        if(!bt||!sched) return;
        const scored=sched.beatTimes.slice(free);
        let best=1e9; scored.forEach(at=>{ const d=tp.downAt-at; if(Math.abs(d)<Math.abs(best)) best=d; });
        if(Math.abs(best)<=scoreOpts(mode).window)
          bt.pop(Math.abs(best)<=TIMING.perfect?"perfect":Math.abs(best)<=TIMING.good?"good":best<0?"early":"late");
      }});
    sched=ALAudio.pulse({bpm:opts.bpm,beats,beatsPerBar:m,accent:!!m,countIn,tickSound:true,
      onCount:countIn?(i)=>{ if(i===countIn-2) st.cue(t("cue.ready")); if(i===countIn-1) st.cue(t("cue.go"),true); }:null,
      onBeat:(i)=>{
        if(ds&&opts.visible!==false){ const d=ds[i]; if(d){ d.classList.add("lit");
          setTimeout(()=>d.classList.remove("lit"),180); } }
        if(!isMeasure){ if(i===free-2) st.cue(t("cue.ready")); if(i===free-1) st.cue(t("cue.go"),true); }
      },
      onDone:()=>{
        cap.detach();
        const targets=sched.beatTimes.slice(free).map(at=>({at,hand:"any"}));
        const taps=cap.taps.filter(tp=>tp.downAt>sched.beatTimes[Math.max(0,free-1)]-sched.period/2||free===0);
        const r=ALTap.score(free?taps:cap.taps,targets,scoreOpts(mode));
        const counts={perfect:0,good:0,early:0,late:0,miss:0};
        r.events.forEach(ev=>counts[tapLabel(ev)]++);
        counts.extra=r.extraCount;
        const timingAcc=targets.length?Math.round(100*(counts.perfect+counts.good)/targets.length):0;
        if(ds) paintDots(ds.slice(free),r);
        if(bt) setTimeout(()=>bt.stop(),400);
        opts.onDone({accuracy:r.accuracy,timingAcc,steadiness:r.steadiness,
          counts,early:r.early,late:r.late,missed:r.missed,extra:r.extraCount,
          bestStreak:r.bestStreak});
      }});
    if(bt){
      const marks=[];
      (sched.countTimes||[]).forEach((at,i)=>marks.push({at,cls:"count",txt:String(i+1)}));
      sched.beatTimes.forEach((at,i)=>{
        if(i<free) marks.push({at,cls:"count",txt:String(i+1)});
        else marks.push({at,cls:(m&&(i%m===0))?"strong":"",
          txt:opts.numbers&&m?String(i%m+1):""});
      });
      bt.setBeats(marks);
    }
    return {stop(){ cap.detach(); if(bt) bt.stop(); ALAudio.stopAll(); }};
  }
  function paintDots(ds,r){
    r.events.forEach((ev,i)=>{ if(!ds[i]) return;
      ds[i].classList.add(ev.status!=="missed"&&Math.abs(ev.dt)<=TIMING.good?"good":"bad");
      ds[i].title=labelText(tapLabel(ev)); });
  }
  const tapSummary=res=>t("fb.tapResult",{acc:res.accuracy,st:res.steadiness??"—",
    e:res.early,l:res.late,mi:res.missed});
  function miaReact(res){
    if(res.accuracy>=85) return t("mia.great");
    if(res.early>res.late+1) return t("mia.earlyTip");
    if(res.late>res.early+1) return t("mia.lateTip");
    if(res.bestStreak>=4) return t("mia.recover");
    return t("mia.keepGoing");
  }

  /* ---------- listening playback ---------- */
  function playGrouping(st,m,bpm,vis,onDone){
    const beats=m*3;
    let ds=null;
    if(vis==="full") ds=st.dots(beats,{strongEvery:m});
    else if(vis==="pulse") ds=st.dots(1,{});
    else st.dotsEl.innerHTML="";
    return ALAudio.pulse({bpm,beats,beatsPerBar:m,accent:true,tickSound:true,
      onBeat:vis==="full"?(i)=>{ const d=ds[i]; if(d){ d.classList.add("lit");
          setTimeout(()=>d.classList.remove("lit"),180);} }
        :vis==="pulse"?()=>{ const d=ds[0]; d.classList.add("lit");
          setTimeout(()=>d.classList.remove("lit"),180); }:null,
      onDone});
  }
  function playSW(st,q,vis,onDone){
    const ds=st.dots(q.m,{strongEvery:vis==="full"?q.m:0,numbers:true});
    ds[q.beat].classList.add("picked");
    return ALAudio.pulse({bpm:q.bpm||84,beats:q.m,beatsPerBar:q.m,accent:true,tickSound:true,
      onBeat:vis!=="none"?(i)=>{ const d=ds[i]; if(d){ d.classList.add("lit");
        setTimeout(()=>d.classList.remove("lit"),180);} }:null,
      onDone});
  }

  /* ---------- question factories (practice + quiz) ---------- */
  function groupingQ(p){
    return {cat:2,type:"choice",correct:p.m,
      choices:[{label:t("meter.duple"),value:2},{label:t("meter.triple"),value:3},
               {label:t("meter.quadruple"),value:4}],
      play:(st,vis,onDone)=>playGrouping(st,p.m,p.bpm||88,vis,onDone),
      reveal:st=>st.dots(p.m*3,{strongEvery:p.m,numbers:true}),
      explain:()=>t("expl.groupShort",{n:p.m}),
      hint:()=>t("mia.listenStrong")};
  }
  function swQ(p){
    const strong=p.beat===0;
    return {cat:3,type:"choice",correct:strong,
      choices:[{label:t("beat.strong"),value:true},{label:t("beat.weak"),value:false}],
      play:(st,vis,onDone)=>playSW(st,p,vis,onDone),
      reveal:st=>{ const ds=st.dots(p.m,{strongEvery:p.m,numbers:true}); ds[p.beat].classList.add("picked"); },
      explain:()=>t(strong?"expl.swShortStrong":"expl.swShortWeak",{b:p.beat+1,m:p.m}),
      hint:()=>t("mia.listenStrong")};
  }
  function tapBeatQ(p){ return {cat:1,type:"tap",kind:"beat",p}; }
  function tapMeasureQ(p){ return {cat:4,type:"tap",kind:"measure",p}; }
  function fromBank(item){
    return item.cat===1?tapBeatQ(item.p):item.cat===2?groupingQ(item.p):
           item.cat===3?swQ(item.p):tapMeasureQ(item.p);
  }

  /* ---------- quiz bank (52 items ≥ 40 required) ---------- */
  function buildQuizBank(){
    const bank=[];
    [66,72,78,84,88,90,94,96,102,74].forEach(bpm=>bank.push({cat:1,p:{bpm}}));
    [2,3,4].forEach(m=>[72,84,96,108].forEach(bpm=>bank.push({cat:2,p:{m,bpm}})));
    [2,3,4].forEach(m=>{ for(let b=0;b<m;b++) [80,92].forEach(bpm=>bank.push({cat:3,p:{m,beat:b,bpm}})); });
    [2,3,4].forEach(m=>[68,76,84,92].forEach(bpm=>bank.push({cat:4,p:{m,bpm}})));
    return bank;
  }

  /* ---------- practice generator ---------- */
  const rnd=a=>a[Math.floor(Math.random()*a.length)];
  function practiceNext(prevCat,tempo){
    let cat; do{ cat=rnd([1,2,3,4]); }while(cat===prevCat);
    if(cat===1) return tapBeatQ({bpm:tempo});
    if(cat===2) return groupingQ({m:rnd([2,3,4]),bpm:rnd([76,88,100])});
    if(cat===3){ const m=rnd([2,3,4]); return swQ({m,beat:Math.floor(Math.random()*m),bpm:rnd([80,92])}); }
    return tapMeasureQ({m:rnd([2,3,4]),bpm:tempo});
  }

  /* ---------- guided activities (Learn by Doing, Lesson 1-1) ---------- */
  function guidedFindBeat(st,api,done){
    let bpm=api.tempo();
    st.ctl.innerHTML=`<label>${t("ui.tempo")}
      <input type="range" min="60" max="100" step="4" value="${bpm}" aria-label="${t("ui.tempo")}">
      <b>♩=<span>${bpm}</span></b></label>`;
    const rng=st.ctl.querySelector("input"), tv=st.ctl.querySelector("b span");
    rng.oninput=e=>{ bpm=+e.target.value; tv.textContent=bpm; api.setTempo(bpm); };
    st.showPads(true);
    st.transport([{label:"▶ "+t("ui.start"),onClick:()=>{
      api.stopAll();
      api.hold(runTap({st,mode:"learn",kind:"beat",bpm,beats:16,free:4,track:true,
        onDone:res=>{ st.fb(tapSummary(res)+" "+miaReact(res));
          done(res,res.accuracy+"%"); }}));
    }},{label:"⏹ "+t("ui.stop"),ghost:true,onClick:api.stopAll}]);
  }
  function guidedGrouping(st,api,done){
    const seq=[{m:2,bpm:80},{m:3,bpm:92},{m:4,bpm:100}];
    let i=0, ok=0;
    const round=()=>{
      const q=groupingQ(seq[i]);
      st.choicesEl.innerHTML=""; st.fb("");
      st.transport([{label:"▶ "+t("ui.play"),onClick:()=>{ api.stopAll();
        q.play(st,"full",()=>{ st.fb(t("fb.chooseAnswer")); ask(q); }); }}]);
    };
    const ask=q=>{
      st.choices(q.choices,(v,b,el)=>{
        [...el.children].forEach(c=>c.disabled=true);
        const good=v===q.correct; if(good) ok++;
        b.classList.add(good?"good":"bad");
        q.reveal(st);
        st.fb((good?`<b>${t("fb.correct")}</b> `:`${t("fb.wrong")} `)+q.explain());
        st.transport([]);
        i++;
        if(i<seq.length) api.flow(round,1800);       /* auto-advance */
        else done({ok,total:seq.length},ok+"/"+seq.length);
      });
    };
    round();
  }
  function guidedStrongWeak(st,api,done){
    const ms=[2,3,4]; let i=0, ok=0;
    st.fb(t("act3.note"));
    const round=()=>{
      const m=ms[i], q=swQ({m,beat:Math.floor(Math.random()*m),bpm:84});
      st.choicesEl.innerHTML="";
      st.transport([{label:"▶ "+t("ui.play"),onClick:()=>{ api.stopAll();
        q.play(st,"full",()=>{ st.fb(t("fb.chooseAnswer")); ask(q); }); }}]);
    };
    const ask=q=>{
      st.choices(q.choices,(v,b,el)=>{
        [...el.children].forEach(c=>c.disabled=true);
        const good=v===q.correct; if(good) ok++;
        b.classList.add(good?"good":"bad");
        st.fb((good?`<b>${t("fb.correct")}</b> `:`${t("fb.wrong")} `)+q.explain());
        st.transport([]);
        i++;
        if(i<ms.length) api.flow(round,1800);        /* auto-advance */
        else done({ok,total:ms.length},ok+"/"+ms.length);
      });
    };
    round();
  }
  function guidedTapMeasure(st,api,done){
    const rounds=[rnd([2,3]),4]; let i=0; const accs=[];
    st.showPads(true);
    const round=()=>{
      const m=rounds[i], bpm=76;
      st.fb("");
      st.transport([{label:"▶ "+t("ui.start")+" — "+m+"/4",onClick:()=>{
        api.stopAll();
        api.hold(runTap({st,mode:"learn",kind:"measure",m,bpm,beats:m*2,numbers:true,
          onDone:res=>{ accs.push(res.accuracy);
            st.fb(tapSummary(res)+" "+miaReact(res));
            i++;
            if(i<rounds.length) api.flow(round,2000); /* auto-advance to round 2 */
            else { const avg=Math.round(accs.reduce((a,b)=>a+b,0)/accs.length);
              done({accuracy:avg},avg+"%"); }
          }}));
      }},{label:"⏹ "+t("ui.stop"),ghost:true,onClick:api.stopAll}]);
    };
    round();
  }

  return {TIMING,scoreOpts,tapLabel,labelText,beatTrack,runTap,tapSummary,miaReact,
          playGrouping,playSW,groupingQ,swQ,tapBeatQ,tapMeasureQ,fromBank,
          buildQuizBank,practiceNext,
          guidedFindBeat,guidedGrouping,guidedStrongWeak,guidedTapMeasure};
})());
if(typeof module!=="undefined") module.exports=ALRhythm;

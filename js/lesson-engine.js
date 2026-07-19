/* Aural Lab — reusable, data-driven lesson engine.
   A lesson page provides a SCHEMA (header data, mission goals, key terms,
   guided activities, a practice generator, a quiz bank) and calls
   ALLessonEngine.run(schema). The engine renders the ONE navigation system:

     1 Today's Mission · 2 Key Terms · 3 Learn by Doing · 4 Practice ·
     5 Quiz · 6 Lesson Complete

   Sequential unlock on first attempt; free navigation after completion.
   One expanded section at a time; completed sections collapse into compact
   summary cards with a Review button. Progress (section, activities,
   practice history, quiz state incl. mid-quiz refresh recovery, results,
   preferred tempo) persists in localStorage and syncs to the LMS. */
const ALLessonEngine=(()=>{
  const SECS=["mission","terms","learn","practice","quiz","complete"];
  const $=id=>document.getElementById(id);
  let SC=null;          /* schema */
  let S=null;           /* saved lesson state */
  let LESSON=null;
  let hosts=[], expanded=-1;
  let liveRun=null;     /* current runTap handle for cleanup */

  /* ---------- persistence (Theory Lab model) ----------
     The lesson keeps NO mid-lesson working state. Every page load is a fresh
     walk-through from the top — so a shared, no-login computer never shows
     one student's checkmarks to the next person. The only thing recorded is
     the FINAL quiz result (accuracy + done), written to the on-device
     progress store and, for signed-in students, the LMS server — exactly how
     Theory Lab remembers only the best score. (Device sound settings are
     separate and stay remembered.) `save()` holds the in-memory object
     together during a single visit but never touches storage. */
  function load(){ return {}; }
  function save(){ /* in-memory only — intentionally no persistence */ }
  function soundCfg(){ try{ return JSON.parse(localStorage.getItem("al-sound-v1"))||{}; }catch(e){ return {}; } }
  function saveSound(patch){
    const s=Object.assign(soundCfg(),patch);
    try{ localStorage.setItem("al-sound-v1",JSON.stringify(s)); }catch(e){}
  }

  /* ---------- shared cleanup ---------- */
  let flowTimer=null;
  function stopAll(){
    ALAudio.stopAll();
    clearTimeout(flowTimer); flowTimer=null;
    if(liveRun){ liveRun.stop(); liveRun=null; }
  }
  const api={
    stopAll,
    hold:h=>{ liveRun=h; },
    /* auto-advance helper: the natural "next screen appears by itself" flow */
    flow:(fn,ms)=>{ clearTimeout(flowTimer); flowTimer=setTimeout(fn,ms); },
    tempo:()=>S.tempo||80,
    setTempo:v=>{ S.tempo=v; save(); }
  };

  /* ---------- stage factory (shared visual unit) ---------- */
  function makeStage(host,opts){
    const root=document.createElement("section");
    root.className="card act-card";
    root.innerHTML=
      (opts.title?`<h3 class="act-head">${opts.title}</h3>`:"")+
      (opts.help?`<p class="act-help">${opts.help}</p>`:"")+
      `<div class="act-body">
        <div class="st-arena">
          <div class="ctl-row st-ctl"></div>
          <div class="ready-go" aria-live="polite"></div>
          <div class="beat-dots"></div>
          <div class="q-dots"></div>
          <div class="choices"></div>
          <div class="st-fb" aria-live="polite"></div>
        </div>
        <div class="ctl-row st-transport"></div>`+
      (opts.pads?`<div class="tap-pads">
          <div class="tap-pad tp-left" role="button" aria-label="${t("tap.left")}"><span>${t("tap.left")}</span><small>${t("tap.leftSmall")}</small></div>
          <div class="tap-pad tp-right" role="button" aria-label="${t("tap.right")}"><span>${t("tap.right")}</span><small>${t("tap.rightSmall")}</small></div>
        </div>
        <p class="tap-hint">${t("tap.hint")}</p>`:"")+
      `</div>`;
    host.appendChild(root);
    const q=s=>root.querySelector(s);
    const st={root,arenaEl:q(".st-arena"),ctl:q(".st-ctl"),readyGo:q(".ready-go"),dotsEl:q(".beat-dots"),
      qDotsEl:q(".q-dots"),choicesEl:q(".choices"),fbEl:q(".st-fb"),
      transportEl:q(".st-transport"),
      padL:q(".tp-left"),padR:q(".tp-right"),padsEl:q(".tap-pads"),hintEl:q(".tap-hint"),
      cueTimer:null};
    /* Reserve a fixed content height so the Play/Next/Continue row below never
       jumps up and down as questions of different heights swap in (eye-strain
       fix; standard for every lesson — pass opts.arenaMin). */
    if(opts.arenaMin) st.arenaEl.style.minHeight=opts.arenaMin+"px";
    st.dots=(n,o)=>{ o=o||{}; st.dotsEl.innerHTML="";
      for(let i=0;i<n;i++){
        const d=document.createElement("div");
        d.className="beat-dot"+((o.strongEvery&&i%o.strongEvery===0)?" strong":"");
        if(o.numbers) d.textContent=(i%(o.strongEvery||n))+1;
        st.dotsEl.appendChild(d);
      } return [...st.dotsEl.children]; };
    st.choices=(items,cb)=>{ st.choicesEl.innerHTML="";
      items.forEach(it=>{
        const b=document.createElement("button");
        b.className="choice"+(it.html?" choice-visual":"");
        if(it.html){ b.innerHTML=it.html; if(it.aria) b.setAttribute("aria-label",it.aria); }
        else b.textContent=it.label;
        b.onclick=()=>cb(it.value,b,st.choicesEl);
        st.choicesEl.appendChild(b);
      }); return st.choicesEl; };
    st.transport=btns=>{ st.transportEl.innerHTML="";
      btns.forEach(bd=>{
        const b=document.createElement("button");
        /* Theory-Lab convention: audio Play/Start buttons (label starts with
           ▶) are deep navy; Continue / Submit / navigation stay violet */
        const isPlay=!bd.ghost&&/^▶/.test(bd.label||"");
        b.className="btn"+(bd.ghost?" ghost":"")+((bd.dark||isPlay)?" dark":"")+(bd.sm?" sm":"");
        b.textContent=bd.label; b.onclick=bd.onClick; if(bd.id) b.id=bd.id;
        if(bd.disabled) b.disabled=true;
        st.transportEl.appendChild(b);
      }); };
    st.qDots=(n,i,marks)=>{ st.qDotsEl.innerHTML="";
      for(let k=0;k<n;k++){
        const d=document.createElement("div");
        d.className="q-dot"+(k===i?" q-now":"")+(marks[k]===true?" q-good":marks[k]===false?" q-bad":"");
        st.qDotsEl.appendChild(d);
      } };
    st.cue=(text,isGo)=>{ const el=st.readyGo;
      el.textContent=text; el.classList.toggle("go",!!isGo);
      el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
      clearTimeout(st.cueTimer);
      st.cueTimer=setTimeout(()=>{ el.textContent=""; },900); };
    st.fb=h=>{ st.fbEl.innerHTML=h||""; };
    st.showPads=v=>{ if(st.padsEl){ st.padsEl.style.display=v?"":"none";
      st.hintEl.style.display=v?"":"none"; } };
    st.showPads(false);
    return st;
  }
  function compactCard(hostDiv,titleHtml,markHtml,scoreHtml,onReview){
    hostDiv.innerHTML="";
    const d=document.createElement("section");
    d.className="card act-sum"; hostDiv.appendChild(d);
    const mk=document.createElement("span"); mk.innerHTML=markHtml; d.appendChild(mk);
    const tt=document.createElement("span"); tt.className="sum-ttl"; tt.innerHTML=titleHtml; d.appendChild(tt);
    if(scoreHtml){ const sc=document.createElement("span"); sc.className="sum-score"; sc.innerHTML=scoreHtml; d.appendChild(sc); }
    if(onReview){
      const b=document.createElement("button");
      b.className="btn ghost sm"; b.textContent=t("act.review");
      b.onclick=onReview; d.appendChild(b);
    }
    return d;
  }
  const scrollToEl=el=>setTimeout(()=>el.scrollIntoView({behavior:"smooth",block:"start"}),80);

  /* ---------- section state ----------
     No top roadmap: the lesson reads as a single downward flow (Theory Lab
     style). Completed sections stay as compact ✓ summary cards the student
     can glance at or Review; the current section is expanded; sections not
     yet reached are simply not shown. A Continue button inside each section
     moves to the next one. */
  const secDone=i=>!!S.done[SECS[i]];
  function firstOpenSec(){ const i=SECS.findIndex(s=>!S.done[s]); return i===-1?5:i; }

  /* ---------- section switching ---------- */
  const RENDER={};
  function summarize(i){
    /* collapsed = a plain ✓ card with a Review button, no score numbers
       (progress details live on the student's My Progress page, not here) */
    const s=SECS[i], host=hosts[i];
    if(!secDone(i)&&i!==expanded){ host.innerHTML=""; return; }
    if(secDone(i))
      compactCard(host,t("road."+s),'<span class="sum-ok">✓</span>',"",()=>openSec(i,true));
    else compactCard(host,t("road."+s),"⏸","",()=>openSec(i,true));
  }
  function openSec(i,scroll){
    if(expanded===i){ if(scroll) scrollToEl(hosts[i]); return; }
    stopAll();
    if(expanded>=0) summarize(expanded);
    hosts.forEach((h,k)=>{ if(k!==i&&!secDone(k)&&k!==expanded) h.innerHTML=""; });
    expanded=i;
    S.sec=i; save();
    hosts[i].innerHTML="";
    RENDER[SECS[i]](hosts[i]);
    if(scroll) scrollToEl(hosts[i]);
  }
  function completeSec(name){
    if(!S.done[name]){ S.done[name]=true; save(); }
    const i=SECS.indexOf(name);
    summarize(i); expanded=-1;
    openSec(Math.min(i+1,5),true);
  }

  /* ---------- sound check ---------- */
  function needSoundCheck(){ return !soundCfg().checked; }
  function renderSoundCheck(host,onDone){
    host.innerHTML="";
    const d=document.createElement("section");
    d.className="card sound-check"; host.appendChild(d);
    d.innerHTML=`<h3 class="act-head">🔊 ${t("sc.title")}</h3>
      <p class="act-help">${t("sc.body")}</p>
      <div class="ctl-row">
        <button class="btn dark" id="scPlay">${t("sc.play")}</button>
        <label>${t("sc.vol")}
          <input type="range" id="scVol" min="0" max="100" value="${Math.round((ALAudio.volume())*100)}"
            aria-label="${t("sc.vol")}"></label>
        <button class="btn" id="scOk">✓ ${t("sc.ok")}</button>
      </div>`;
    d.querySelector("#scPlay").onclick=()=>{ ALAudio.ensure();
      ALAudio.play([{midi:72,beat:0,dur:.5},{midi:76,beat:.5,dur:.5},{midi:79,beat:1,dur:1}],{bpm:120}); };
    d.querySelector("#scVol").oninput=e=>ALAudio.setVolume(e.target.value/100);
    d.querySelector("#scOk").onclick=()=>{ saveSound({checked:true}); host.innerHTML=""; if(onDone) onDone(); };
  }

  /* ---------- 1 · Today's Mission ---------- */
  RENDER.mission=host=>{
    const st=makeStage(host,{title:t("road.mission")});
    st.ctl.innerHTML=ALMia.strip("miaMission","mia-strip-sm");
    ALMia.say("miaMission","“"+t(SC.welcomeKey||"ms.welcome")+"”");
    st.fbEl.innerHTML=`<p style="font-weight:600;color:var(--ink)">${t("ms.canDo")}</p>
      <ul class="ms-goals">${SC.goals.map(g=>`<li>${t(g)}</li>`).join("")}</ul>`;
    st.transport([{label:t("ms.start"),onClick:()=>completeSec("mission")}]);
  };

  /* ---------- 2 · Key Terms ---------- */
  RENDER.terms=host=>{
    const st=makeStage(host,{title:t("road.terms"),help:t("terms.help")});
    S.termsHeard=S.termsHeard||{};
    const wrap=st.fbEl;
    /* "heard" is credited the moment the student starts the example —
       switching to another term mid-playback must never lose credit.
       Continue is NEVER blocked: students may skim and move on. */
    const updateContinue=()=>{
      st.transport([{label:t("terms.continue"),
        onClick:()=>completeSec("terms")}]);
    };
    const paint=()=>{
      wrap.innerHTML="";
      SC.terms.forEach(tm=>{
        const row=document.createElement("div");
        row.className="term-row"+(S.termsHeard[tm.id]?" heard":"");
        row.innerHTML=`<span class="term-name">${t(tm.nameKey)}</span>
          <span class="term-def">“${t(tm.defKey)}”</span>
          <span class="term-vis">${vis(tm.vis)}</span>`;
        const b=document.createElement("button");
        /* play = navy; once heard it becomes a muted ghost ✓ */
        b.className=S.termsHeard[tm.id]?"btn ghost sm":"btn dark sm";
        b.textContent=S.termsHeard[tm.id]?t("term.heard"):t("term.hear");
        b.onclick=()=>{
          stopAll();
          S.termsHeard[tm.id]=true; save();
          row.classList.add("heard");
          b.className="btn ghost sm";
          b.textContent=t("term.heard");
          updateContinue();
          const dots=[...row.querySelectorAll(".beat-dot")];
          const lit=i=>{ const d=dots[i%(dots.length||1)]; if(d){ d.classList.add("lit");
            setTimeout(()=>d.classList.remove("lit"),160);} };
          if(tm.tones){          /* duration term: sustained tones (audible length) */
            ALAudio.play(tm.tones,{bpm:tm.bpm||80,sustain:true,onEvent:i=>lit(i)});
          }else if(tm.melody){  /* pitch term: play the notes as a melody */
            ALAudio.play(tm.melody.map((m,i)=>({midi:m,beat:i,dur:.9})),
              {bpm:96,onEvent:i=>lit(i)});
          }else{                /* rhythm term: play the pulse */
            ALAudio.pulse({bpm:tm.audio.bpm,beats:tm.audio.beats,
              beatsPerBar:tm.audio.m||0,accent:!!tm.audio.m,tickSound:true,onBeat:lit});
          }
        };
        row.appendChild(b);
        wrap.appendChild(row);
      });
      updateContinue();
    };
    const vis=v=>{
      if(v&&v.html) return v.html;   /* provider-supplied graphic (e.g. duration bars) */
      let h="";
      for(let i=0;i<v.n;i++) h+=`<span class="beat-dot${v.strongEvery&&i%v.strongEvery===0?" strong":""}"></span>`;
      return h; };
    paint();
    /* optional per-lesson footnote under the terms (e.g. "these durations
       apply to the current activities — not to all music") */
    if(SC.termsNoteKey){
      const p=document.createElement("p");
      p.className="terms-note"; p.innerHTML=t(SC.termsNoteKey);
      st.fbEl.appendChild(p);
    }
  };

  /* ---------- 3 · Learn by Doing ---------- */
  RENDER.learn=host=>{
    const head=document.createElement("section");
    head.className="card";
    head.innerHTML=`<h3 class="act-head">${t("road.learn")}</h3>
      ${ALMia.strip("miaTipL","mia-strip-sm")}`;
    host.appendChild(head);
    ALMia.say("miaTipL","<b>"+t("learn.tipTitle")+":</b> “"+AL_CURRICULUM.text(LESSON,"tip")+"”");
    const actsHost=document.createElement("div"); host.appendChild(actsHost);
    const slots=SC.activities.map(()=>{ const d=document.createElement("div");
      actsHost.appendChild(d); return d; });
    let open=-1;
    const summarizeA=i=>compactCard(slots[i],
      t("act.card",{n:i+1,t:t(SC.activities[i].titleKey)}),
      '<span class="sum-ok">✓</span>',"",()=>expandA(i,true));
    const inProgA=i=>compactCard(slots[i],
      t("act.card",{n:i+1,t:t(SC.activities[i].titleKey)}),"⏸","",
      ()=>expandA(i,true));
    function expandA(i,scroll){
      if(open===i) return;
      stopAll();
      if(open>=0){ if(S.acts[open]) summarizeA(open); else inProgA(open); }
      slots[i].innerHTML="";
      const a=SC.activities[i];
      /* Learn-by-Doing needs NO reserved height: each activity repeats a single
         question type, so nothing swaps to a different height — reserving would
         only add a big empty gap. (Practice/Quiz mix types, so they keep it.) */
      const st=makeStage(slots[i],{title:t("act.card",{n:i+1,t:t(a.titleKey)}),
        help:t(a.instrKey),pads:!!a.pads});
      open=i;
      /* the way forward is ALWAYS visible — students may skip an activity
         without completing it (no ✓ is awarded for skipping) */
      const skipRow=document.createElement("div");
      skipRow.className="ctl-row";
      const sb=document.createElement("button");
      sb.className="btn";     /* violet — "Continue"/proceed (navy is for audio/actions) */
      sb.textContent=t("unit.continue")+" →";
      sb.onclick=()=>{ if(i<SC.activities.length-1) expandA(i+1,true);
        else completeSec("learn"); };
      skipRow.appendChild(sb);
      st.root.appendChild(skipRow);
      a.build(st,api,(res,summary)=>{
        S.actSum[i]=summary; const first=!S.acts[i];
        S.acts[i]=true; save();
        if(!first) return;
        setTimeout(()=>{
          if(open!==i) return;
          summarizeA(i); open=-1;
          const next=S.acts.findIndex(x=>!x);
          if(next>=0){ expandA(next,true); }
          else{
            const doneRow=document.createElement("div");
            doneRow.className="ctl-row";
            const b=document.createElement("button");
            b.className="btn"; b.textContent=t("learn.continue");
            b.onclick=()=>completeSec("learn");
            doneRow.appendChild(b);
            actsHost.appendChild(doneRow);
            scrollToEl(doneRow);
          }
        },1800);
      });
      if(scroll) scrollToEl(slots[i]);
    }
    S.acts.forEach((d,i)=>{ if(d) summarizeA(i); });
    const firstA=S.acts.findIndex(x=>!x);
    if(firstA>=0) expandA(firstA,false);
    else{
      const doneRow=document.createElement("div");
      doneRow.className="ctl-row";
      const b=document.createElement("button");
      b.className="btn"; b.textContent=t("learn.continue");
      b.onclick=()=>completeSec("learn");
      doneRow.appendChild(b);
      actsHost.appendChild(doneRow);
    }
  };

  /* ---------- 4 · Practice ---------- */
  RENDER.practice=host=>{
    S.prac=S.prac||{ok:0,total:0};
    const head=document.createElement("section");
    head.className="card";
    head.innerHTML=`<h3 class="act-head">${t("road.practice")}</h3>
      <p class="act-help">${t("prac.help")}</p>
      <div class="prac-bar">
        <label style="display:flex;align-items:center;gap:8px;font-size:13.5px;color:var(--muted)">${t("ui.tempo")}
          <input type="range" id="pracTempo" min="60" max="100" step="4" value="${api.tempo()}" aria-label="${t("ui.tempo")}">
          <b>♩=<span id="pracTv">${api.tempo()}</span></b></label>
        <span class="prac-acc" id="pracAcc"></span>
      </div>`;
    host.appendChild(head);
    head.querySelector("#pracTempo").oninput=e=>{ api.setTempo(+e.target.value);
      head.querySelector("#pracTv").textContent=e.target.value; };
    const paintAcc=()=>{ head.querySelector("#pracAcc").textContent=
      t("prac.acc",{p:S.prac.total?Math.round(100*S.prac.ok/S.prac.total):0}); };
    paintAcc();
    /* ONE fixed practice card: questions update IN PLACE — the student stays
       put and the exercise changes under them (natural for interval / chord
       listening), instead of a downward-scrolling trail of cards. Open-ended
       by default; a lesson MAY cap it with SC.practiceCount. Every question
       carries a "Go to the Quiz →" so they can leave whenever ready. */
    const arena=document.createElement("div"); host.appendChild(arena);
    const st=makeStage(arena,{title:"#1",pads:true,arenaMin:SC.arenaMin});
    const headEl=st.root.querySelector(".act-head");
    const N=SC.practiceCount||0;      /* 0 = unlimited */
    let prevCat=0, qNo=0;
    const record=(good)=>{ S.prac.total++; if(good) S.prac.ok++; save(); paintAcc();
      const p=SC.provider; if(p&&p.onResult) p.onResult(good); };   /* adaptive difficulty */
    const toQuizBtn={label:t("prac.toQuiz"),onClick:()=>{ stopAll(); completeSec("practice"); }};
    /* practice: this advances to the NEXT question (not a section "Continue") —
       navy "Next →". Violet Continue is reserved for real section proceeds. */
    const skipBtn={label:t("ui.nextArrow"),dark:true,onClick:()=>{ stopAll(); nextQ(); }};
    function resetStage(){
      st.dotsEl.innerHTML=""; st.choicesEl.innerHTML=""; st.qDotsEl.innerHTML="";
      st.choicesEl.style.display="";   /* restore after an answered question hid it */
      st.fb(""); st.transportEl.innerHTML=""; st.readyGo.textContent=""; st.showPads(false);
    }
    function practiceDone(){
      stopAll(); resetStage(); headEl.textContent=t("road.practice");
      st.fb("✅ "+t("prac.done"));
      st.transport([
        {label:t("prac.toQuiz"),onClick:()=>completeSec("practice")},
        {label:t("prac.more"),ghost:true,dark:true,onClick:()=>{ qNo=0; nextQ(); }}]);
    }
    const advance=()=>{ stopAll(); nextQ(); };
    function nextQ(){
      stopAll();
      if(N&&qNo>=N) return practiceDone();
      resetStage();
      const q=(SC.provider||ALRhythm).practiceNext(prevCat,api.tempo());
      prevCat=q.cat; qNo++;
      headEl.textContent="#"+qNo;
      if(q.type==="tap"){
        st.fb(q.kind==="beat"?t("act1.help"):t("act4.help"));
        st.showPads(true);
        st.transport([{label:"▶ "+t("ui.start"),onClick:()=>{
          stopAll();
          api.hold(ALRhythm.runTap({st,mode:"practice",kind:q.kind,bpm:api.tempo(),
            m:q.p.m,beats:q.kind==="measure"?q.p.m*2:12,free:q.kind==="beat"?4:0,
            track:false,numbers:true,
            onDone:res=>{ record(res.accuracy>=70);
              st.fb(ALRhythm.tapSummary(res)+" "+ALRhythm.miaReact(res));
              api.flow(advance,2200);   /* show result, then next in place */
            }}));
        }},skipBtn,toQuizBtn]);
        return;
      }
      if(q.type==="custom"){         /* self-contained question (e.g. draw) */
        q.run(st,{mode:"practice",
          skip:()=>{ stopAll(); nextQ(); },
          toQuiz:()=>{ stopAll(); completeSec("practice"); },
          done:score=>{ record(score>=70);
            st.transport([{label:t("ui.nextArrow"),dark:true,onClick:()=>{ stopAll(); nextQ(); }},toQuizBtn]); }});
        return;
      }
      const vis=q.cat===2?"pulse":"uniform";
      const play=()=>{ stopAll(); q.play(st,vis,()=>st.fb(t(q.ask||"fb.chooseAnswer"))); };
      /* Show the QUESTION and the CHOICES up front so the student can read and
         prepare before the sound. SC.manualPlay lessons wait for a Play press
         (no auto-play); others auto-play as before. */
      st.fb(t(q.ask||"fb.chooseAnswer"));
      st.choices(q.choices,(v,b,el)=>{
        stopAll();                     /* answering stops the example at once */
        [...el.children].forEach(c=>c.disabled=true);
        const good=v===q.correct;
        b.classList.add(good?"good":"bad");
        /* quiz-style compact result: the answered choices give way to the
           reveal graphic + explanation, so the card stays low and the button
           strip never drifts (the graphic and choices never stack) */
        st.choicesEl.style.display="none";
        q.reveal(st);
        st.fb((good?`<b>${t("fb.correct")}</b> `:`${t("fb.wrong")} `)+q.explain());
        record(good);
        /* disable in place — clearing would collapse the button strip */
        [...st.transportEl.querySelectorAll("button")].forEach(x=>x.disabled=true);
        /* a question whose reveal replays audio declares revealMs so the
           next question never cuts the replay short */
        api.flow(advance,q.revealMs||1800);
      });
      if(SC.manualPlay){
        st.transport([
          {label:"▶ "+t("ui.play"),onClick:play},
          {label:t("prac.hint"),ghost:true,dark:true,onClick:()=>st.fb("💡 "+q.hint())},
          skipBtn,toQuizBtn]);
      }else{
        play();                        /* auto-play (legacy behavior) */
        st.transport([
          {label:t("prac.hear"),ghost:true,dark:true,onClick:play},
          {label:t("prac.hint"),ghost:true,dark:true,onClick:()=>st.fb("💡 "+q.hint())},
          skipBtn,toQuizBtn]);
      }
    }
    nextQ();
  };

  /* ---------- 5 · Quiz ---------- */
  /* quiz length is per-lesson (SC.quizCount, default 10; instructor prefers
     10–15). The total is spread as evenly as possible across the 4 skill
     categories and drawn fresh from the ≥40-item bank each attempt. */
  const quizTotal=()=>Math.max(4,SC.quizCount||10);
  function pickQuiz(){
    const total=quizTotal();
    const perCat={1:[],2:[],3:[],4:[]};
    SC.quizBank.forEach(it=>perCat[it.cat].push(it));
    const counts=[0,1,2,3].map(i=>Math.floor(total/4)+(i<(total%4)?1:0));
    const items=[];
    [1,2,3,4].forEach((cat,ci)=>{
      const pool=[...perCat[cat]];
      for(let k=0;k<counts[ci]&&pool.length;k++)
        items.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
    });
    return items;
  }
  RENDER.quiz=host=>{
    const head=document.createElement("section");
    head.className="card";
    const attempt=(S.quizAttempts||0)+((S.quiz&&S.quiz.active)?0:1);
    head.innerHTML=`<h3 class="act-head">${t("road.quiz")}</h3>
      <p class="act-help">${t("quiz.help",{n:quizTotal()})}</p>
      <div class="ctl-row" id="quizIntro" style="justify-content:space-between">
        <span class="quiz-meta">${t("quiz.attemptN",{n:attempt})}</span>
        <span id="quizStartRow"></span></div>`;
    host.appendChild(head);
    /* ONE fixed quiz card: questions update IN PLACE (same as Practice); the
       progress dots at the top show how far along the set is */
    const arena=document.createElement("div"); host.appendChild(arena);
    const start=()=>{
      head.querySelector("#quizIntro").style.display="none";
      /* quiz questions show no reveal graphics, so their tallest state is much
         shorter than practice's — a separate (smaller) reservation keeps the
         buttons close while still never moving between questions */
      const st=makeStage(arena,{title:t("fb.qOf",{i:1,n:quizTotal()}),pads:true,
        arenaMin:SC.quizArenaMin||SC.arenaMin});
      quizQ(st); scrollToEl(st.root);
    };
    const row=head.querySelector("#quizStartRow");
    const b=document.createElement("button");
    b.className="btn";
    if(S.quiz&&S.quiz.active){
      b.textContent=t("quiz.resume",{i:S.quiz.i+1,n:quizTotal()});
      b.onclick=start;
    }else{
      b.textContent=t("quiz.start");
      b.onclick=()=>{
        const items=(SC.provider&&SC.provider.pickQuiz)?SC.provider.pickQuiz():pickQuiz();
        S.quiz={items,i:0,answers:[],active:true,
          attempt,startedAt:new Date().toISOString()};
        S.quizAttempts=attempt; save(); start(); };
    }
    row.appendChild(b);
  };
  function quizQ(st){
    stopAll();                         /* no audio carries into the next question */
    const Q=S.quiz;
    if(Q.i>=Q.items.length) return finishQuiz();
    const item=Q.items[Q.i], q=(SC.provider||ALRhythm).fromBank(item);
    /* reset the single card and repaint progress in place */
    st.dotsEl.innerHTML=""; st.choicesEl.innerHTML=""; st.fb("");
    st.transportEl.innerHTML=""; st.readyGo.textContent=""; st.showPads(false);
    st.root.querySelector(".act-head").textContent=t("fb.qOf",{i:Q.i+1,n:Q.items.length});
    st.qDots(Q.items.length,Q.i,Q.answers.map(a=>a?a.score>=70:undefined));
    const submit=(score,detail)=>{
      stopAll();
      Q.answers[Q.i]={cat:item.cat,score,detail,at:Date.now()};
      Q.i++; save();
      quizQ(st);                       /* next question, same card */
    };
    if(q.type==="tap"){
      st.fb(t("quiz.tapStart"));
      st.showPads(true);
      st.transport([{label:"▶ "+t("ui.start"),onClick:()=>{
        stopAll();
        api.hold(ALRhythm.runTap({st,mode:"quiz",kind:q.kind,bpm:q.p.bpm,
          m:q.p.m,beats:q.kind==="measure"?q.p.m:12,free:q.kind==="beat"?4:0,
          track:false,visible:false,numbers:false,
          onDone:res=>{ st.fb(t("quiz.recorded"));
            api.flow(()=>submit(res.accuracy,{timingAcc:res.timingAcc,counts:res.counts}),900);
          }}));
      }}]);
      return;
    }
    if(q.type==="custom"){           /* self-contained (draw) — grade on submit */
      q.run(st,{mode:"quiz",done:(score,detail)=>api.flow(()=>submit(score,detail),700)});
      return;
    }
    /* listening question: play once + ONE replay; select then Submit;
       the next question replaces this one in place */
    let replays=1, picked=null;
    const play=()=>{ stopAll(); q.play(st,"none",()=>st.fb(q.ask?t(q.ask):"")); };
    play();
    const paintTransport=()=>{
      st.transport([
        {label:t("ui.replayN",{n:replays}),ghost:true,dark:true,disabled:replays<=0,id:"qRep",
          onClick:()=>{ if(replays<=0) return; replays--; paintTransport(); play(); }},
        {label:t("quiz.submit"),dark:true,disabled:picked==null,id:"qSub",
          onClick:()=>{ if(picked==null) return;
            stopAll();                 /* stop the example the moment they submit */
            const good=picked===q.correct;
            st.fb(good?"✓":"✗");
            /* disable in place — clearing would collapse the button strip */
            [...st.transportEl.querySelectorAll("button")].forEach(x=>x.disabled=true);
            api.flow(()=>submit(good?100:0,{answer:picked}),900);
          }}]);
    };
    st.choices(q.choices,(v,b,el)=>{
      picked=v;
      [...el.children].forEach(c=>c.classList.remove("picked"));
      b.classList.add("picked");
      paintTransport();
    });
    paintTransport();
  }
  function finishQuiz(){
    const Q=S.quiz;
    const catScores=c=>{ const a=Q.answers.filter(x=>x.cat===c);
      return a.length?Math.round(a.reduce((s,x)=>s+x.score,0)/a.length):0; };
    const catN=c=>{ const a=Q.answers.filter(x=>x.cat===c);
      return {correct:a.filter(x=>x.score>=70).length,total:a.length}; };
    const overall=Math.round(Q.answers.reduce((s,x)=>s+x.score,0)/Q.answers.length);
    const tapAns=Q.answers.filter(x=>x.detail&&x.detail.timingAcc!=null);
    const timingAcc=tapAns.length?
      Math.round(tapAns.reduce((s,x)=>s+x.detail.timingAcc,0)/tapAns.length):null;
    /* generic, lesson-agnostic result data: per-category accuracy + timing.
       Each lesson labels/groups these via SC.resultMetrics (see below). */
    S.results={overall,
      cats:{1:catScores(1),2:catScores(2),3:catScores(3),4:catScores(4)},
      catN:{1:catN(1),2:catN(2),3:catN(3),4:catN(4)},
      timingAcc,attempt:Q.attempt,date:new Date().toISOString()};
    S.quiz={active:false,attempt:Q.attempt};
    S.done.quiz=true; S.freeNav=true;
    if(!S.completedAt) S.completedAt=S.results.date;
    save();
    const completed=overall>=70;
    ALProgress.record({lesson:SC.id,mode:"quiz",accuracy:overall,completed:true,
      replays:0,hints:0,stats:S.results});
    if(completed) ALTrack.practice(LESSON.item,"quiz");
    summarize(4); expanded=-1;
    openSec(5,true);
  }

  /* ---------- 6 · Lesson Complete ---------- */
  RENDER.complete=host=>{
    const r=S.results;
    const st=makeStage(host,{title:t("road.complete")});
    if(!r){ st.fb(t("act.lockedMsg")); return; }
    const msg=r.overall>=90?"done.msg90":r.overall>=80?"done.msg80":
              r.overall>=70?"done.msg70":"done.msg0";
    const fmt=d=>new Date(d).toLocaleDateString(ALI18N.lang(),{year:"numeric",month:"long",day:"numeric"});
    const stat=(label,val,cls)=>`<div class="res-stat ${cls||""}"><b>${val}</b><span>${label}</span></div>`;
    /* result metrics are declared per lesson so the dashboard always matches
       what was practiced (rhythm → beat/timing/meter; pitch → higher-lower/
       same-different/direction/shape; future singing → its own). A metric is
       {labelKey, cats:[...]} (mean of those category scores) or
       {labelKey, kind:"timing"}. Cats absent from the quiz score null → shown
       as "—". Default falls back to the Lesson 1-1 rhythm set. */
    const cats=r.cats||{}, catN=r.catN||{};
    /* a metric renders as {display,ok}. Percent metrics average category
       scores (or timing); count metrics show correct/total (e.g. "2/3"). */
    const metricVal=m=>{
      if(m.kind==="timing") return r.timingAcc==null?null:{display:r.timingAcc+"%",ok:r.timingAcc>=70};
      if(m.mode==="count"){ const cs=(m.cats||[]).map(c=>catN[c]||{correct:0,total:0});
        const cor=cs.reduce((a,x)=>a+x.correct,0),tot=cs.reduce((a,x)=>a+x.total,0);
        return tot?{display:cor+"/"+tot,ok:cor/tot>=0.7}:null; }
      const cs=(m.cats||[]).map(c=>cats[c]).filter(v=>v!=null);
      if(!cs.length) return null;
      const v=Math.round(cs.reduce((a,b)=>a+b,0)/cs.length);
      return {display:v+"%",ok:v>=70};
    };
    const metrics=SC.resultMetrics||[
      {labelKey:"res.beatAcc",cats:[1,4]},{labelKey:"done.timing",kind:"timing"},
      {labelKey:"res.meterAcc",cats:[2]},{labelKey:"done.sw",cats:[3]}];
    st.fbEl.innerHTML=`
      <div class="done-msg"><span class="pct">${r.overall}%</span> — ${t(msg)}</div>
      <div class="done-meta">${t("done.attempt")} ${r.attempt} · ${t("done.date")}: ${fmt(r.date)}</div>
      <div class="res-grid" style="margin-top:14px">
        ${stat(t("done.overall"),r.overall+"%",r.overall>=70?"res-good":"res-warn")}
        ${metrics.map(m=>{ const v=metricVal(m);
          return stat(t(m.labelKey),v?v.display:"—",v?(v.ok?"res-good":"res-warn"):""); }).join("")}
      </div>`;
    const next=AL_CURRICULUM.byId[SC.nextId];
    if(next){
      const un=document.createElement("div");
      un.className="up-next";
      un.innerHTML=`<div class="un-label">${t("done.upNext")}</div>
        <div class="un-title">${next.num} · ${AL_CURRICULUM.text(next,"title")}</div>
        <p>“${t(SC.nextBlurbKey)}”</p>`;
      st.fbEl.appendChild(un);
    }
    st.transport([
      {label:t("done.review"),ghost:true,onClick:()=>openSec(2,true)},
      {label:t("done.practice"),ghost:true,onClick:()=>openSec(3,true)},
      {label:t("done.retake"),ghost:true,onClick:()=>{ S.done.quiz=false; save();
        openSec(4,true); }},
      ...(next?[{label:t("done.continue",{n:next.num}),onClick:()=>{ location.href="../"+next.route; }}]:[])
    ]);
    if(!S.done.complete){ S.done.complete=true; save(); }
  };

  /* ---------- boot ---------- */
  function run(schema){
    SC=schema;
    LESSON=AL_CURRICULUM.byId[SC.id];
    S=Object.assign({sec:0,done:{},termsHeard:{},
      tempo:80,quiz:null,results:null,freeNav:false,quizAttempts:0},load());
    if(!Array.isArray(S.acts)||S.acts.length!==schema.activities.length)
      S.acts=schema.activities.map(()=>false);
    if(!Array.isArray(S.actSum)||S.actSum.length!==schema.activities.length)
      S.actSum=schema.activities.map(()=>"");
    /* header */
    const LTx=f=>AL_CURRICULUM.text(LESSON,f);
    document.title=LESSON.num+" "+LTx("title")+" · "+AL_CONFIG.APP_NAME;
    $("lessonCrumb").textContent=t("lesson.crumb",{u:LESSON.unit,n:LESSON.num});
    $("lessonTitle").textContent=LTx("title");
    $("lessonSummary").textContent="“"+t(SC.summaryKey)+"”";
    $("hdrMeta").innerHTML=`${t("hdr.category")} <b>${t(SC.categoryKey)}</b>`;
    /* sound settings button (reopens the sound check any time) */
    const scBtn=$("btnSound");
    scBtn.textContent=t("sc.settings");
    scBtn.onclick=()=>renderSoundCheck($("soundHost"));
    /* sections */
    const secHost=$("sections"); secHost.innerHTML=""; hosts=[];
    SECS.forEach(()=>{ const d=document.createElement("div");
      secHost.appendChild(d); hosts.push(d); });
    const begin=()=>{
      /* re-entry reads from the top: completed sections show as ✓ summaries,
         the first unfinished one is expanded. No jump deep into the lesson —
         a returning student glances at what they did and continues. (An
         unfinished quiz still keeps its place: its section shows a Resume
         button.) */
      SECS.forEach((s,i)=>{ if(secDone(i)) summarize(i); });
      openSec(Math.min(firstOpenSec(),5),false);
    };
    if(needSoundCheck()) renderSoundCheck($("soundHost"),begin);
    else begin();
    ALLessonNav.mount("lessonNav",SC.id,"../");
    window.addEventListener("beforeunload",stopAll);
    /* audio unlock on first interaction + F/J flash on every visible pad
       (capture layers add the same class during runs; double-add is safe) */
    const unlock=()=>{ ALAudio.ensure(); window.removeEventListener("pointerdown",unlock); };
    window.addEventListener("pointerdown",unlock);
    const flash=(hand,on)=>document.querySelectorAll(hand==="L"?".tap-pad.tp-left":".tap-pad.tp-right")
      .forEach(p=>p.classList.toggle("tp-active",on));
    window.addEventListener("keydown",e=>{ if(e.repeat) return; const k=e.key.toLowerCase();
      if(k==="f") flash("L",true); if(k==="j") flash("R",true); });
    window.addEventListener("keyup",e=>{ const k=e.key.toLowerCase();
      if(k==="f") flash("L",false); if(k==="j") flash("R",false); });
  }
  return {run,makeStage,compactCard,stopAll};
})();
if(typeof module!=="undefined") module.exports=ALLessonEngine;

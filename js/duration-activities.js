/* Aural Lab — UNIT 1 · LESSON 1-4 content module (ALDur), plugged into the
   generic lesson engine as its `provider`. Long and short sounds:
     cat 1 long_short             — one sound: short (1 pulse) or long (2)?
     cat 2 duration_comparison    — two sounds: which lasts longer?
     cat 3 duration_pattern_matching — hear a pattern, pick the bar graphic
     cat 4 duration_reproduction  — echo the pattern with press-and-hold
   Every sound uses ONE pitch, volume, and timbre (the answer must live in
   duration alone). Tokens: "S" short = 1 pulse, "L" long = 2 pulses,
   "R" silence = 1 pulse — true for THESE activities only (the lesson text
   says so; real music is freer). Grading judges order + relative duration
   with the configurable thresholds in TIMING. */
const ALDur=(()=>{
  /* ---------- configurable timing (course-spec requirement) ---------- */
  const TIMING={
    bpm:80,            /* pulse = 750 ms */
    tone:60,           /* the ONE pitch every duration sound uses */
    art:.18,           /* articulation gap between sounds, in pulses */
    durBoundary:1.5,   /* press <1.5 pulses → Short, else Long (live gauge) */
    restGap:.9,        /* a wait longer than this (pulses) → a Silence */
    minPressMs:80,     /* shorter presses are accidental taps — ignored */
    relRatio:1.3       /* grading is RELATIVE: your longs just need to be
                          1.3× your shorts (the spec judges order and
                          relative duration, not stopwatch precision) */
  };
  const pulseMs=()=>60000/TIMING.bpm;

  const rndi=n=>Math.floor(Math.random()*n);
  const rnd=a=>a[rndi(a.length)];
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=rndi(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  const UNITS=t=>t==="L"?2:1;                    /* pulses a token occupies */
  const spanOf=tokens=>tokens.reduce((s,t)=>s+UNITS(t),0);
  const differ=(a,b)=>a.length!==b.length||a.some((v,i)=>v!==b[i]);

  /* ---------- audio ---------- */
  /* tokens → tone events (rests are simply skipped time). Each sound is a
     hair shorter than its slot so back-to-back sounds stay separable. */
  function tokenEvents(tokens){
    const ev=[]; let beat=0;
    tokens.forEach(tk=>{ const u=UNITS(tk);
      if(tk!=="R") ev.push({midi:TIMING.tone,beat,dur:u-TIMING.art,part:ev.length});
      beat+=u; });
    return ev;
  }
  /* all duration playback uses the SUSTAINED voice so a long sound audibly
     holds twice as long as a short one (a decaying piano tone would fade
     either way and make "which is longer?" unanswerable) */
  function playTokens(tokens,opts){ opts=opts||{};
    return ALAudio.play(tokenEvents(tokens),
      {bpm:TIMING.bpm,sustain:true,countIn:opts.countIn||0,onEvent:opts.onEvent,onDone:opts.onDone});
  }
  /* one sound of `p` pulses, after a 4-beat reference pulse */
  function playOne(p,onDone){ return ALAudio.play([{midi:TIMING.tone,beat:0,dur:p-TIMING.art}],
    {bpm:TIMING.bpm,sustain:true,countIn:4,onDone}); }
  /* two sounds with a clear pause between them */
  function playTwo(a,b,onDone){
    return ALAudio.play([
      {midi:TIMING.tone,beat:0,dur:a-TIMING.art},
      {midi:TIMING.tone,beat:a+1,dur:b-TIMING.art}],
      {bpm:TIMING.bpm,sustain:true,onDone});
  }

  /* ---------- visuals: duration bars on a FIXED canvas ---------- */
  /* Constant canvas + constant unit width (6 pulse slots) so every bar
     graphic in the lesson renders the same size — a 1-pulse bar is always
     exactly half a 2-pulse bar, on every question. */
  const BW=460,BH=90,BPAD=14,BUNITS=6;
  const unitW=(BW-2*BPAD)/BUNITS;
  function barSVG(tokens,cls){
    const y=34,h=26;
    let s=`<div class="pg-draw"><svg viewBox="0 0 ${BW} ${BH}" width="100%" style="max-width:${BW}px" aria-hidden="true">`;
    for(let u=0;u<=BUNITS;u++){ const x=BPAD+u*unitW;
      s+=`<line x1="${x}" y1="24" x2="${x}" y2="${y+h+6}" class="db-tick"/>`; }
    let u=0;
    tokens.forEach((tk,i)=>{
      const w=UNITS(tk)*unitW, x=BPAD+u*unitW;
      s+=`<text x="${(x+w/2).toFixed(1)}" y="14" class="pg-colnum">${i+1}</text>`;
      /* silence = an EMPTY box the width of its pulse (outline only) */
      if(tk==="R")
        s+=`<rect x="${(x+3).toFixed(1)}" y="${y}" width="${(w-6).toFixed(1)}" height="${h}" rx="7" class="db-rest"/>`;
      else
        s+=`<rect x="${(x+3).toFixed(1)}" y="${y}" width="${(w-6).toFixed(1)}" height="${h}" rx="7" class="db-bar${cls?" "+cls:""}"/>`;
      u+=UNITS(tk);
    });
    return s+`</svg></div>`;
  }
  /* labelled pair for model-vs-you echo reveals */
  function barPair(lbl1,tokens1,cls1,lbl2,tokens2,cls2){
    return `<div class="db-pair"><div class="db-row"><span class="db-lbl">${lbl1}</span>${barSVG(tokens1,cls1)}</div>`+
           `<div class="db-row"><span class="db-lbl">${lbl2}</span>${barSVG(tokens2,cls2)}</div></div>`;
  }
  /* one plain bar of `units` pulses (comparison reveals: durations may be
     1, 2 or 3 pulses) — same fixed canvas and unit width as barSVG */
  function lenBarSVG(units,cls){
    const h=54,y=20,bh=24;
    let s=`<div class="pg-draw"><svg viewBox="0 0 ${BW} ${h}" width="100%" style="max-width:${BW}px" aria-hidden="true">`;
    for(let u=0;u<=BUNITS;u++){ const x=BPAD+u*unitW;
      s+=`<line x1="${x}" y1="10" x2="${x}" y2="${y+bh+6}" class="db-tick"/>`; }
    s+=`<rect x="${BPAD+3}" y="${y}" width="${(units*unitW-6).toFixed(1)}" height="${bh}" rx="7" class="db-bar${cls?" "+cls:""}"/>`;
    return s+`</svg></div>`;
  }
  function cmpBars(a,b){
    /* the longer bar is highlighted; equal durations highlight both */
    return `<div class="db-pair"><div class="db-row"><span class="db-lbl">1</span>${lenBarSVG(a,a>=b?"db-target":"")}</div>`+
           `<div class="db-row"><span class="db-lbl">2</span>${lenBarSVG(b,b>=a?"db-target":"")}</div></div>`;
  }
  /* small bar graphic for answer choices (same 6-unit proportions) */
  function choiceSVG(tokens){
    const w=150,h=44,pad=8,uw=(w-2*pad)/BUNITS,y=12,bh=20;
    let s=`<svg class="db-choice" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">`,u=0;
    tokens.forEach(tk=>{
      const bw=UNITS(tk)*uw,x=pad+u*uw;
      if(tk==="R")   /* silence = empty outlined box */
        s+=`<rect x="${(x+2).toFixed(1)}" y="${y}" width="${(bw-4).toFixed(1)}" height="${bh}" rx="5" class="db-rest"/>`;
      else
        s+=`<rect x="${(x+2).toFixed(1)}" y="${y}" width="${(bw-4).toFixed(1)}" height="${bh}" rx="5" class="db-bar"/>`;
      u+=UNITS(tk);
    });
    return s+`</svg>`;
  }
  /* tiny inline bar for the Key Terms column — pulse tick marks make it read
     as a length on a time ruler, not just a blue box */
  function termBar(tokens){
    const w=104,h=26,pad=4,uw=(w-2*pad)/BUNITS;
    let s=`<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">`,u=0;
    for(let k=0;k<=BUNITS;k++){ const x=pad+k*uw;
      s+=`<line x1="${x.toFixed(1)}" y1="2" x2="${x.toFixed(1)}" y2="24" class="db-tick"/>`; }
    tokens.forEach(tk=>{
      const bw=UNITS(tk)*uw,x=pad+u*uw;
      if(tk==="R")   /* silence = empty outlined box on the ruler */
        s+=`<rect x="${x+1}" y="5" width="${(bw-2).toFixed(1)}" height="16" rx="4" class="db-rest"/>`;
      else
        s+=`<rect x="${x+1}" y="5" width="${(bw-2).toFixed(1)}" height="16" rx="4" class="db-bar"/>`;
      u+=UNITS(tk);
    });
    return s+`</svg>`;
  }
  const tokName=tk=>t(tk==="S"?"tok.short":tk==="L"?"tok.long":"tok.silence");
  const describe=tokens=>tokens.map(tokName).join(", ");

  /* ---------- pattern generators ---------- */
  const STARTERS=[["S","S","L"],["L","S","S"],["S","L","S"],["L","L","S"],
    ["S","R","L"],["L","R","S"],["S","S","R","L"]];
  /* random 3–5-part pattern: sounds only or one mid-pattern silence; never
     starts or ends with silence (inaudible at the edges). Total span is
     capped at the 6-pulse canvas so bars NEVER run off the graphic. */
  function randPattern(minLen,maxLen){
    for(let g=0;g<40;g++){
      const len=minLen+rndi(maxLen-minLen+1);
      const p=Array.from({length:len},()=>rnd(["S","S","L"]));
      if(p.every(x=>x===p[0])) p[1+rndi(len-1)]=p[0]==="S"?"L":"S";
      if(len>=3&&Math.random()<.4) p[1+rndi(len-2)]="R";
      if(spanOf(p)<=BUNITS) return p;
    }
    return ["S","S","L"];   /* safe fallback (span 4) */
  }
  function distinctPatterns(count,base){
    const set=[base]; let guard=0;
    while(set.length<count&&guard++<60){
      const c=randPattern(base.length,base.length);
      if(set.every(q=>differ(c,q))) set.push(c);
    }
    while(set.length<count) set.push(randPattern(3,5));
    return set;
  }

  /* ---------- adaptive difficulty (practice comparisons) ---------- */
  let cmpClose=0;   /* 0 = clearly different (1:2,1:3), grows toward 2:3 */
  function onResult(good){ cmpClose=good?Math.min(1,cmpClose+.15):Math.max(0,cmpClose-.25); }

  /* ---------- question factories ---------- */
  function lsQ(p){
    const long=!!p.long, tokens=[long?"L":"S"];
    return {cat:1,type:"choice",correct:long?"long":"short",ask:"d4.ask.ls",
      choices:[{label:t("dc.short"),value:"short"},{label:t("dc.long"),value:"long"}],
      play:(st,vis,onDone)=>playOne(long?2:1,onDone),
      reveal:st=>{ st.dotsEl.innerHTML=barSVG(tokens,"db-target"); playTokens(tokens); },
      /* the reveal REPLAYS the sound — auto-advance must wait for it to end */
      revealMs:(long?2:1)*pulseMs()+1900,
      explain:()=>t(long?"expl.ls.long":"expl.ls.short"),
      hint:()=>t("d4.hint.ls")};
  }
  function cmpQ(p){
    const {a,b}=p, correct=a>b?"first":b>a?"second":"same";
    return {cat:2,type:"choice",correct,ask:"d4.ask.cmp",
      choices:[{label:t("dc.first"),value:"first"},{label:t("dc.second"),value:"second"},
               {label:t("dc.same"),value:"same"}],
      play:(st,vis,onDone)=>playTwo(a,b,onDone),
      reveal:st=>{ st.dotsEl.innerHTML=cmpBars(a,b); playTwo(a,b); },
      revealMs:(a+1+b)*pulseMs()+1900,
      explain:()=>t("expl.cmp."+correct,{a,b}),
      hint:()=>t("d4.hint.cmp")};
  }
  function patQ(p){
    const pats=p.pats, ci=p.correct;
    const order=p.order||shuffle(pats.map((_,i)=>i));
    p.order=order;
    return {cat:3,type:"choice",correct:ci,ask:"d4.ask.pat",
      choices:order.map(i=>({value:i,html:choiceSVG(pats[i]),aria:describe(pats[i])})),
      play:(st,vis,onDone)=>playTokens(pats[ci],{onDone}),
      reveal:st=>{ st.dotsEl.innerHTML=barSVG(pats[ci],"db-target"); playTokens(pats[ci]); },
      revealMs:spanOf(pats[ci])*pulseMs()+1900,
      explain:()=>t("expl.patm",{s:describe(pats[ci])}),
      hint:()=>t("d4.hint.pat")};
  }
  function echoQ(p){
    return {cat:4,type:"custom",tokens:p.tokens,
      run:(st,ctx)=>runEcho(st,ctx,p.tokens)};
  }
  function fromBank(item){
    return item.cat===1?lsQ(item.p):item.cat===2?cmpQ(item.p):
           item.cat===3?patQ(item.p):echoQ(item.p);
  }

  /* ---------- params ---------- */
  const lsParams=()=>({long:Math.random()<.5});
  function cmpParams(){
    const easy=[[1,2],[2,1],[1,3],[3,1],[2,2],[1,1],[3,3]];
    const close=[[2,3],[3,2]];
    const pool=(cmpClose>.6&&Math.random()<.5)?close:easy;
    const [a,b]=rnd(pool); return {a,b};
  }
  function patParams(){
    const base=Math.random()<.5?rnd(STARTERS).slice():randPattern(3,5);
    return {pats:distinctPatterns(3,base),correct:0};
  }
  const echoParams=(maxLen)=>({tokens:randPattern(3,maxLen||4)});

  /* ---------- press-and-hold ECHO (type:custom) ---------- */
  function tokensFromPresses(segs){
    /* segs=[{dur,gap}] — gap is the silence BEFORE this press (ms). Pure so
       it can be unit-tested. */
    const out=[], P=pulseMs();
    segs.forEach((s,i)=>{
      if(i>0&&s.gap>TIMING.restGap*P) out.push("R");
      out.push(s.dur<TIMING.durBoundary*P?"S":"L");
    });
    return out;
  }
  function runEcho(st,ctx,tokens){
    const n=tokens.length, quiz=ctx.mode==="quiz";
    let replays=quiz?1:Infinity;
    st.showPads(false);
    st.dotsEl.innerHTML=
      `<div class="echo-wrap">
        <div class="echo-slots">${tokens.map((tk,i)=>
          `<div class="echo-slot" data-i="${i}"><span class="es-num">${i+1}</span><span class="es-fill"></span></div>`).join("")}</div>
        <div class="echo-pad" tabindex="0" role="button" aria-label="${t("echo.padAria")}">
          <span>${t("echo.pad")}</span><small>${t("echo.padSmall")}</small>
          <div class="pad-track"><div class="pad-mark"></div><div class="pad-fill"></div></div></div>
      </div>`;
    const pad=st.dotsEl.querySelector(".echo-pad");
    const fill=pad.querySelector(".pad-fill");
    /* the gauge spans 2 pulses (a full Long); the mark sits at the S/L boundary */
    pad.querySelector(".pad-mark").style.left=(TIMING.durBoundary/2*100)+"%";
    const slots=[...st.dotsEl.querySelectorAll(".echo-slot")];
    let phase="listen";           /* listen → record → done */
    let resp=[], durs=[], pressAt=0, lastRel=0, holding=false, spaceHeld=false;
    let gaugeTimer=null, restTimer=null;

    const slotFill=(i,tk)=>{ const s=slots[i]; if(!s) return;
      s.classList.remove("preview");
      s.classList.add("filled","es-"+tk.toLowerCase());
      s.querySelector(".es-fill").textContent=tk==="R"?t("tok.silence"):tokName(tk); };
    const slotPreview=(i,tk)=>{ const s=slots[i]; if(!s) return;
      s.classList.add("preview");
      s.querySelector(".es-fill").textContent=tokName(tk)+"…"; };
    const slotLight=i=>{ const s=slots[i]; if(!s) return;
      s.classList.add("lit"); setTimeout(()=>s.classList.remove("lit"),260); };
    const clearSlots=()=>slots.forEach(s=>{ s.classList.remove("filled","lit","preview","es-s","es-l","es-r");
      s.querySelector(".es-fill").textContent=""; });
    const clearTimers=()=>{ clearInterval(gaugeTimer); gaugeTimer=null;
      clearTimeout(restTimer); restTimer=null; fill.style.width="0%"; };

    /* map sound-event index → token index (rests shift positions) */
    const soundIdx=[]; tokens.forEach((tk,i)=>{ if(tk!=="R") soundIdx.push(i); });

    /* steady pulse keeps ticking while the student responds — it's the ruler
       they measure "one pulse / two pulses" against */
    const startTicks=()=>ALAudio.pulse({bpm:TIMING.bpm,beats:96,tickSound:true});

    function begin(){ /* first listen — the way onward stays visible */
      st.fb(t("echo.intro",{n}));
      const btns=[{label:"▶ "+t("echo.play"),onClick:()=>startModel()}];
      if(ctx.skip) btns.push({label:t("ui.nextArrow"),dark:true,onClick:ctx.skip});
      if(ctx.toQuiz) btns.push({label:t("prac.toQuiz"),onClick:ctx.toQuiz});
      st.transport(btns);
    }
    function startModel(){
      ALAudio.stopAll(); ALAudio.holdStop(); clearTimers();
      clearSlots(); resp=[]; durs=[]; holding=false; lastRel=0;
      st.fb(t("echo.countIn"));
      playTokens(tokens,{countIn:4,
        onEvent:i=>slotLight(soundIdx[i]),
        onDone:()=>{ phase="record"; st.fb("🎤 "+t("echo.yourTurn",{n}));
          startTicks(); paint(); }});
    }
    function armRestTimer(){
      /* after a release, waiting past the gap = a silence slot fills itself —
         the student SEES the wait being counted */
      clearTimeout(restTimer);
      restTimer=setTimeout(()=>{
        if(phase!=="record"||holding||resp.length===0||resp.length>=n) return;
        resp.push("R"); slotFill(resp.length-1,"R");
        if(resp.length>=n){ phase="done"; st.fb(t("echo.filled"));
          clearTimers(); ALAudio.stopAll(); }   /* all recorded → the pulse stops */
        paint();
      },TIMING.restGap*pulseMs()+40);
    }
    function press(){
      if(phase!=="record"||holding||resp.length>=n) return;
      holding=true; pad.classList.add("held");
      clearTimeout(restTimer);
      ALAudio.holdStart(TIMING.tone);          /* pressing BEGINS a sound */
      pressAt=performance.now();
      /* live gauge: watch the hold grow from short into long */
      clearInterval(gaugeTimer);
      gaugeTimer=setInterval(()=>{
        const el=performance.now()-pressAt, P=pulseMs();
        fill.style.width=Math.min(100,el/(2*P)*100)+"%";
        if(resp.length<n) slotPreview(resp.length,el<TIMING.durBoundary*P?"S":"L");
      },50);
    }
    function release(){
      if(!holding) return;
      holding=false; pad.classList.remove("held");
      ALAudio.holdStop();                      /* releasing ENDS the sound */
      clearInterval(gaugeTimer); gaugeTimer=null; fill.style.width="0%";
      const now=performance.now(), dur=now-pressAt;
      lastRel=now;
      if(dur<TIMING.minPressMs||resp.length>=n){    /* accidental tap */
        if(resp.length<n&&slots[resp.length]){ slots[resp.length].classList.remove("preview");
          slots[resp.length].querySelector(".es-fill").textContent=""; }
        armRestTimer(); return;
      }
      const tk=dur<TIMING.durBoundary*pulseMs()?"S":"L";
      resp.push(tk); durs.push(dur); slotFill(resp.length-1,tk);
      if(resp.length>=n){ phase="done"; st.fb(t("echo.filled"));
        clearTimers(); ALAudio.stopAll(); }   /* all recorded → the pulse stops */
      else armRestTimer();
      paint();
    }
    /* pointer input — capture so releasing OUTSIDE the pad still ends the
       sound safely */
    pad.addEventListener("pointerdown",e=>{ e.preventDefault();
      try{ pad.setPointerCapture(e.pointerId); }catch(_){}
      press(); });
    pad.addEventListener("pointerup",()=>release());
    pad.addEventListener("pointercancel",()=>release());
    /* keyboard: Spacebar; auto-repeat while held is ignored */
    const kd=e=>{ if(!pad.isConnected){ document.removeEventListener("keydown",kd); return; }
      if(e.code!=="Space"&&e.key!==" ") return;
      e.preventDefault();
      if(e.repeat||spaceHeld) return;
      spaceHeld=true; press(); };
    const ku=e=>{ if(!pad.isConnected){ document.removeEventListener("keyup",ku); return; }
      if(e.code!=="Space"&&e.key!==" ") return;
      spaceHeld=false; release(); };
    document.addEventListener("keydown",kd);
    document.addEventListener("keyup",ku);

    function paint(){
      const full=resp.length>=n;
      const btns=[];
      if(replays>0) btns.push({label:t("prac.hear"),ghost:true,dark:true,onClick:()=>{
        if(quiz){ replays--; } phase="listen"; startModel(); }});
      btns.push({label:t("echo.tryAgain"),ghost:true,dark:true,onClick:()=>{
        ALAudio.stopAll(); ALAudio.holdStop(); clearTimers();
        clearSlots(); resp=[]; durs=[]; lastRel=0; holding=false; phase="record";
        st.fb("🎤 "+t("echo.yourTurn",{n})); startTicks(); paint(); }});
      btns.push({label:t("draw.submit"),dark:true,disabled:!full,onClick:submit});
      if(ctx.skip) btns.push({label:t("ui.nextArrow"),dark:true,onClick:ctx.skip});
      if(ctx.toQuiz) btns.push({label:t("prac.toQuiz"),onClick:ctx.toQuiz});
      st.transport(btns);
    }
    /* RELATIVE grading fallback: rests must sit in the right places, and the
       presses meant to be Long must simply be relRatio× the presses meant to
       be Short — the student's own tempo sets the scale. */
    function relativeOK(){
      if(resp.length!==tokens.length) return false;
      for(let i=0;i<tokens.length;i++) if((tokens[i]==="R")!==(resp[i]==="R")) return false;
      const sD=[],lD=[]; let di=0;
      tokens.forEach(tk=>{ if(tk==="R") return; const d=durs[di++];
        if(d==null) return; (tk==="L"?lD:sD).push(d); });
      const P=pulseMs();
      if(sD.length&&lD.length) return Math.min(...lD)>=Math.max(...sD)*TIMING.relRatio;
      if(sD.length) return sD.every(d=>d<TIMING.durBoundary*P*1.25);   /* only shorts expected */
      return lD.every(d=>d>TIMING.durBoundary*P*.75);                  /* only longs expected */
    }
    function submit(){
      if(resp.length<n) return;
      ALAudio.stopAll(); ALAudio.holdStop(); clearTimers(); phase="graded";
      const exact=resp.length===tokens.length&&resp.every((tk,i)=>tk===tokens[i]);
      const correct=exact||relativeOK();
      if(correct&&!exact) resp=tokens.slice();   /* relative pass: show it as matched */
      if(quiz){ st.fb(t("quiz.recorded")); ctx.done(correct?100:0,{resp,target:tokens}); return; }
      /* learn / practice: model vs your response, replay the model */
      st.dotsEl.innerHTML=barPair(t("echo.model"),tokens,"db-target",t("echo.you"),resp,correct?"":"db-you");
      st.fb((correct?`<b>${t("fb.correct")}</b> `:`${t("fb.wrong")} `)+t("echo.reveal"));
      playTokens(tokens);
      ctx.done(correct?100:0,{resp,target:tokens});
    }
    begin();
    /* quiz auto-plays the model once so every question starts the same way */
    if(quiz){ st.transport([{label:"⏳",disabled:true}]); startModel(); }
  }

  /* ---------- guided Learn activities (completion only) ---------- */
  function guidedChoiceD(genQ,rounds){
    return (st,api,done)=>{
      rounds=rounds||3; let i=0;
      const ask=q=>{
        st.choices(q.choices,(v,b,el)=>{
          [...el.children].forEach(c=>c.disabled=true);
          const good=v===q.correct;
          b.classList.add(good?"good":"bad");
          st.choicesEl.style.display="none";        /* compact result, like practice */
          q.reveal(st);
          st.fb((good?`<b>${t("fb.correct")}</b> `:`${t("fb.wrong")} `)+q.explain());
          [...st.transportEl.querySelectorAll("button")].forEach(x=>x.disabled=true);
          i++; if(i<rounds) api.flow(round,q.revealMs||2100); else done({},"");
        });
      };
      function round(){ const q=genQ();
        st.dotsEl.innerHTML=""; st.choicesEl.style.display=""; st.choicesEl.innerHTML=""; st.fb("");
        st.transport([{label:"▶ "+t("ui.play"),onClick:()=>{ api.stopAll();
          q.play(st,"none",()=>{ st.fb(t(q.ask||"fb.chooseAnswer")); ask(q); }); }}]);
      }
      round();
    };
  }
  const guidedLS =guidedChoiceD(()=>lsQ(lsParams()));
  const guidedCmp=guidedChoiceD(()=>cmpQ(cmpParams()));
  const guidedPat=guidedChoiceD(()=>patQ(patParams()));
  /* Activity 4 — echo three fixed patterns, attempt each once */
  function guidedEcho(st,api,done){
    const seq=[["S","S","L"],["S","R","L"],["S","L","S","S"]];
    let idx=0;
    function one(){
      st.choicesEl.innerHTML=""; st.fb("");
      runEcho(st,{mode:"learn",done:()=>{
        idx++;
        st.transport([{label:(idx<seq.length?t("ui.nextPattern"):"✓ "+t("echo.done")),dark:true,
          onClick:()=>{ api.stopAll(); if(idx<seq.length) one(); else done({},""); }}]);
      }},seq[idx]);
    }
    one();
  }

  /* ---------- practice ---------- */
  function practiceNext(prevCat){
    let cat; do{ cat=1+rndi(4); }while(cat===prevCat);
    return cat===1?lsQ(lsParams()):cat===2?cmpQ(cmpParams()):
           cat===3?patQ(patParams()):echoQ(echoParams(4));
  }

  /* ---------- quiz: exactly 20, four ordered sections of five ---------- */
  function pickQuiz(){
    const items=[];
    for(let k=0;k<5;k++) items.push({cat:1,p:lsParams()});
    for(let k=0;k<5;k++) items.push({cat:2,p:cmpParams()});
    for(let k=0;k<5;k++) items.push({cat:3,p:patParams()});
    for(let k=0;k<5;k++) items.push({cat:4,p:echoParams(4)});
    return items;
  }

  return {TIMING,lsQ,cmpQ,patQ,echoQ,fromBank,practiceNext,pickQuiz,onResult,
          barSVG,barPair,choiceSVG,termBar,describe,tokensFromPresses,
          guidedLS,guidedCmp,guidedPat,guidedEcho};
})();
if(typeof module!=="undefined") module.exports=ALDur;

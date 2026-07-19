/* Aural Lab — UNIT 1 · LESSON 1-3 content module (ALPitch3), plugged into the
   generic lesson engine as its `provider`. Reuses ALGrid (pitch ladder + draw
   grid), ALPitch.shapeSVG (contour graphics) and ALAudio. Movable-Do, five
   levels Do–Re–Mi–Fa–Sol; students never see key names, staves, or intervals.
   Singing is modeled + prompted but never microphone-scored; drawing grades
   pitch ORDER only. */
const ALPitch3=(()=>{
  const SF=ALGrid.SOLFEGE, MD=ALGrid.MIDI;
  const rndi=n=>Math.floor(Math.random()*n);
  const rnd=a=>a[rndi(a.length)];
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=rndi(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  const clamp=l=>Math.max(0,Math.min(4,l));

  /* ---------- playback ---------- */
  function playSeq(levels,opts){ opts=opts||{}; ALAudio.stopAll();
    return ALAudio.play(levels.map((lv,i)=>({midi:MD[lv],beat:i,dur:.9})),
      {bpm:100,onEvent:opts.onEvent,onDone:opts.onDone}); }
  function playRef(onDone){ ALAudio.stopAll();
    return ALAudio.play([{midi:MD[0],beat:0,dur:1}],{bpm:120,onDone}); }
  /* Reference Do, a short gap, then the pattern (optionally lighting a ladder) */
  /* Reference Do first, a clear pause, then the pattern. onPatternStart fires
     with the pattern's first note so callers can tell the student "the pattern
     starts NOW" — without it the reference Do is easily counted as note 1
     (every pattern is anchored on Do, so they'd hear Do twice in a row). */
  function playModel(levels,lad,onDone,onPatternStart){
    playRef(()=>setTimeout(()=>playSeq(levels,{
      onEvent:i=>{ if(i===0&&onPatternStart) onPatternStart();
        if(lad) lad.highlight(levels[i]); },onDone}),600));
  }
  /* Grid questions play the pattern ONLY — no Reference Do in front. The
     pattern's first note IS the given Do (numbered 1 on the grid), so a
     separate reference would add an extra sound and break the count the
     student sees (instructor: "heard one more note than the numbers"). The
     orange playhead traces each note on the grid. */
  function playPatternOnGrid(levels,grid,onDone){
    ALAudio.stopAll();
    playSeq(levels,{
      onEvent:i=>{ if(grid&&grid.playAt) grid.playAt(i,levels[i]); },
      onDone:()=>{ if(grid&&grid.hidePlay) setTimeout(()=>grid.hidePlay(),320); if(onDone) onDone(); }});
  }

  /* ---------- descriptions (accessible + explanations) ---------- */
  function describeShape(levels){
    const m=[];
    for(let i=1;i<levels.length;i++){ const d=levels[i]-levels[i-1];
      m.push(d>0?t("mv.up"):d<0?t("mv.down"):t("mv.same")); }
    return m.join(", ");
  }

  /* ---------- pattern generators ---------- */
  function randWalk(len,start){
    const out=[start==null?0:start];
    for(let i=1;i<len;i++){ let step=rnd([-2,-1,-1,0,1,1,2]); let nx=clamp(out[i-1]+step);
      if(nx===out[i-1]&&Math.random()<.6) nx=clamp(out[i-1]+(step>=0?1:-1)); out.push(nx); }
    if(out.every(v=>v===out[0])) out[1]=clamp(out[0]+1);   /* never all-same */
    return out;
  }
  const differ=(a,b)=>a.length!==b.length||a.some((v,i)=>v!==b[i]);
  function distinctPatterns(count,len,start){
    const set=[]; let guard=0;
    while(set.length<count&&guard++<80){ const p=randWalk(len,start);
      if(set.every(q=>differ(p,q))) set.push(p); }
    while(set.length<count) set.push(randWalk(len,start));
    return set;
  }

  /* ---------- question factories ---------- */
  function ssrQ(p){
    const rel=Math.abs(p.a-p.b), kind=rel===0?"repeat":rel===1?"step":"skip";
    return {cat:1,type:"choice",correct:kind,
      choices:[{label:t("pc.step"),value:"step"},{label:t("pc.skip"),value:"skip"},
               {label:t("pc.repeat"),value:"repeat"}],
      play:(st,vis,onDone)=>playSeq([p.a,p.b],{onDone}),
      reveal:st=>ALGrid.show(st.dotsEl,[p.a,p.b]),
      explain:()=>t("expl.ssr."+kind,{a:SF[p.a],b:SF[p.b]}),
      hint:()=>t("p3.hint.compare")};
  }
  function shapeQ(p){
    const pats=p.pats, ci=p.correct;
    return {cat:2,type:"choice",correct:ci,
      choices:pats.map((lv,i)=>({value:i,html:ALPitch.shapeSVG(lv),aria:describeShape(lv)})),
      play:(st,vis,onDone)=>playSeq(pats[ci],{onDone}),
      reveal:st=>{ ALGrid.show(st.dotsEl,pats[ci],"pg-target"); },
      explain:()=>t("expl.shape",{s:describeShape(pats[ci])}),
      hint:()=>t("p3.hint.trace")};
  }
  /* interactive DRAW question (type:custom — the engine hands it the stage) */
  function drawQ(p){
    const levels=p.levels, n=levels.length;
    return {cat:3,type:"custom",levels,
      run:(st,ctx)=>runDraw(st,ctx,levels)};
  }
  function runDraw(st,ctx,levels){
    const n=levels.length, quiz=ctx.mode==="quiz";
    st.showPads(false);
    st.dotsEl.innerHTML='<div class="pg-slot"></div>';   /* reserve space up front */
    const slot=st.dotsEl.querySelector(".pg-slot")||st.dotsEl;
    const grid=ALGrid.draw(slot,{n,fixed:{0:0},anchorLabel:t("draw.anchor"),onChange:paint});   /* first Do given */
    /* learn/practice: the orange ball traces the melody; quiz stays audio-only */
    const guide=quiz?null:grid;
    function hear(then){ st.fb(t("draw.listenPat",{n}));
      playPatternOnGrid(levels,guide,()=>{ st.fb(t("draw.build")); if(then)then(); }); }
    function paint(){
      const ready=grid.placed()>=n-1;
      const btns=[
        {label:t("prac.hear"),ghost:true,dark:true,onClick:()=>hear()},
        {label:t("draw.undo"),ghost:true,dark:true,onClick:()=>{ grid.undo(); paint(); }},
        {label:t("draw.clear"),ghost:true,dark:true,onClick:()=>{ grid.clear(); paint(); }},
        {label:t("draw.submit"),dark:true,disabled:!ready,onClick:submit}];
      if(ctx.skip) btns.push({label:t("ui.nextArrow"),dark:true,onClick:ctx.skip});   /* navy — next question */
      if(ctx.toQuiz) btns.push({label:t("prac.toQuiz"),onClick:ctx.toQuiz});           /* violet — to quiz */
      st.transport(btns);
    }
    function submit(){
      if(grid.placed()<n-1) return;
      ALAudio.stopAll(); grid.lock();
      const seq=grid.seq();
      const correct=seq.length===levels.length&&seq.every((lv,i)=>lv===levels[i]);
      if(quiz){ st.fb(t("quiz.recorded")); ctx.done(correct?100:0,{seq,target:levels}); return; }
      /* practice / learn: reveal + replay the correct path */
      st.fb((correct?`<b>${t("fb.correct")}</b> `:`${t("fb.wrong")} `)+t("draw.reveal"));
      ALGrid.show(st.dotsEl,levels,"pg-target");
      playPatternOnGrid(levels,null,null);   /* pattern only — no reference Do */
      ctx.done(correct?100:0,{seq,target:levels});
    }
    /* listen first (the pattern starts on the given Do), then draw */
    st.fb(t("draw.listenPat",{n}));
    st.transport([{label:"⏳",disabled:true}]);
    playPatternOnGrid(levels,guide,()=>{ st.fb(t("draw.build")); paint(); });
  }

  function fromBank(item){
    return item.cat===1?ssrQ(item.p):item.cat===2?shapeQ(item.p):drawQ(item.p);
  }

  /* ---------- params ---------- */
  function ssrParams(){
    const kind=rnd(["step","skip","repeat"]);
    let a=1+rndi(3), b;
    if(kind==="repeat") b=a;
    else{ const d=kind==="step"?1:(2+rndi(2)); b=clamp(Math.random()<.5?a+d:a-d);
      if(Math.abs(b-a)!==(kind==="step"?1:Math.abs(b-a))) {} }
    return {a,b};
  }
  function shapeParams(){
    const len=3+rndi(3);                 /* 3–5 */
    const pats=distinctPatterns(3,len,null);
    return {pats,correct:rndi(3)};
  }
  function drawParams(){ return {levels:randWalk(3+rndi(3),0)}; }

  /* ---------- practice ---------- */
  function practiceNext(prevCat){
    let cat; do{ cat=1+rndi(3); }while(cat===prevCat);
    return cat===1?ssrQ(ssrParams()):cat===2?shapeQ(shapeParams()):drawQ(drawParams());
  }

  /* ---------- quiz (exactly 10, 3 ordered sections) ---------- */
  function pickQuiz(){
    const items=[];
    for(let k=0;k<3;k++) items.push({cat:1,p:ssrParams()});
    for(let k=0;k<3;k++) items.push({cat:2,p:shapeParams()});
    for(let k=0;k<4;k++) items.push({cat:3,p:drawParams()});
    return items;   /* order preserved: ssr ×3, shape ×3, draw ×4 */
  }

  /* ---------- guided Learn activities ---------- */
  /* Activity 1 — Hear and Sing the Pitch Ladder (completion only) */
  function guidedLadder(st,api,done){
    const lad=ALGrid.ladder(st.dotsEl);
    const patterns=[[0,1,0],[0,1,2],[0,2,0],[0,1,2,1,0]];
    let stage=0;   /* 0: ladder up/down; 1..N: sing-back patterns */
    function showLadderIntro(){
      st.fb(t("p3.ladderIntro"));
      const afterLadder=()=>st.transport([
        {label:t("ui.nextArrow"),dark:true,onClick:()=>{ stage=1; singBack(); }},
        {label:t("prac.hear"),ghost:true,onClick:showLadderIntro}]);
      const playDown=()=>playSeq([4,3,2,1,0],{onEvent:i=>lad.highlight(4-i),onDone:afterLadder});
      st.transport([{label:"▶ "+t("p3.playLadder"),onClick:()=>{ api.stopAll();
        playSeq([0,1,2,3,4],{onEvent:i=>lad.highlight(i),onDone:()=>setTimeout(playDown,420)}); }}]);
    }
    const hearPat=(pat,onDone)=>{ api.stopAll(); st.fb(t("draw.listen",{n:pat.length}));
      playModel(pat,lad,onDone,()=>st.fb(t("draw.pattern",{n:pat.length}))); };
    function singBack(){
      const pat=patterns[stage-1];
      st.fb(t("p3.listenModel"));
      st.transport([{label:"▶ "+t("p3.hearModel"),onClick:()=>hearPat(pat,()=>{ st.fb("🎤 "+t("p3.yourTurn")); yourTurn(); })}]);
    }
    function yourTurn(){
      st.transport([
        {label:"↻ "+t("p3.hearModelAgain"),dark:true,onClick:()=>hearPat(patterns[stage-1],()=>st.fb("🎤 "+t("p3.yourTurn")))},
        {label:"✓ "+t("p3.iSangIt"),dark:true,onClick:()=>{ api.stopAll(); stage++;
          if(stage-1<patterns.length){ singBack(); } else { st.fb("✅ "+t("p3.ladderDone")); done({},""); } }}]);
    }
    showLadderIntro();
  }
  /* Activity 2 & 3 use the shared choice-guided pattern */
  function guidedChoice(genQ,rounds){
    return (st,api,done)=>{
      rounds=rounds||3; let i=0;
      const ask=q=>{
        st.choices(q.choices,(v,b,el)=>{
          [...el.children].forEach(c=>c.disabled=true);
          const good=v===q.correct;
          b.classList.add(good?"good":"bad");
          q.reveal(st);
          st.fb((good?`<b>${t("fb.correct")}</b> `:`${t("fb.wrong")} `)+q.explain());
          [...st.transportEl.querySelectorAll("button")].forEach(x=>x.disabled=true);
          i++; if(i<rounds) api.flow(round,1900); else done({},"");
        });
      };
      function round(){ const q=genQ();
        st.dotsEl.innerHTML='<div class="pg-slot"></div>'; st.choicesEl.innerHTML=""; st.fb("");
        st.transport([{label:"▶ "+t("ui.play"),onClick:()=>{ api.stopAll();
          q.play(st,"none",()=>{ st.fb(t("fb.chooseAnswer")); ask(q); }); }}]);
      }
      round();
    };
  }
  const guidedSSR=guidedChoice(()=>ssrQ(ssrParams()));
  const guidedShape=guidedChoice(()=>shapeQ(shapeParams()));
  /* Activity 4 — Sing and Draw (a couple of patterns, completion only).
     The grid is shown FROM THE START so the student can preview the canvas
     before the model plays (and watch the ball move on it); it stays locked
     until they've listened + sung, then becomes drawable. */
  function guidedSingDraw(st,api,done){
    const patterns=[[0,1,0],[0,2,0],[0,1,2,1,0]];
    let idx=0;
    function one(){
      const levels=patterns[idx], n=levels.length;
      let drawing=false;
      st.dotsEl.innerHTML='<div class="pg-slot"></div>';
      const grid=ALGrid.draw(st.dotsEl.firstChild,{n,fixed:{0:0},anchorLabel:t("draw.anchor"),
        onChange:()=>{ if(drawing) paint(); }});
      grid.lock();                                  /* preview only until the sing step is done */
      st.fb(t("draw.preview"));
      listen();
      const hearModel=onDone=>{ api.stopAll(); st.fb(t("draw.listenPat",{n}));
        playPatternOnGrid(levels,grid,onDone); };
      function listen(){
        st.transport([{label:"▶ "+t("p3.hearModel"),onClick:()=>hearModel(()=>{ st.fb("🎤 "+t("p3.yourTurn")); sing(); })}]);
      }
      function sing(){
        st.transport([
          {label:"↻ "+t("p3.hearModelAgain"),dark:true,onClick:()=>hearModel(()=>st.fb("🎤 "+t("p3.yourTurn")))},
          {label:"✓ "+t("p3.iSangIt"),dark:true,onClick:()=>{ drawing=true; grid.lock(false); st.fb(t("draw.build")); paint(); }}]);
      }
      function paint(){ const ready=grid.placed()>=n-1;
        st.transport([
          {label:t("prac.hear"),ghost:true,dark:true,onClick:()=>hearModel(()=>st.fb(t("draw.build")))},
          {label:t("draw.undo"),ghost:true,dark:true,onClick:()=>{ grid.undo(); paint(); }},
          {label:t("draw.clear"),ghost:true,dark:true,onClick:()=>{ grid.clear(); paint(); }},
          {label:t("draw.submit"),dark:true,disabled:!ready,onClick:()=>{
            if(grid.placed()<n-1) return; api.stopAll(); grid.lock();
            const seq=grid.seq(), correct=seq.every((lv,i)=>lv===levels[i]);
            st.fb((correct?`<b>${t("fb.correct")}</b> `:`${t("fb.wrong")} `)+t("draw.reveal"));
            ALGrid.show(st.dotsEl,levels,"pg-target"); playPatternOnGrid(levels,null,null);
            /* in-card advance = NEXT pattern (navy). The violet "Continue"
               below the card is the section proceed (skip the activity). */
            st.transport([{label:(idx+1<patterns.length?t("ui.nextArrow"):"✓ "+t("p3.ladderDone")),dark:true,
              onClick:()=>{ api.stopAll(); idx++; if(idx<patterns.length) one(); else done({},""); }}]);
          }}]);
      }
    }
    one();
  }

  return {ssrQ,shapeQ,drawQ,fromBank,practiceNext,pickQuiz,describeShape,
          guidedLadder,guidedSSR,guidedShape,guidedSingDraw};
})();
if(typeof module!=="undefined") module.exports=ALPitch3;

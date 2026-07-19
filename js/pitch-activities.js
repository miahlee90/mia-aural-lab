/* Aural Lab — reusable PITCH interaction library (Lesson 1-2 and beyond).
   Same shape as js/rhythm-activities.js so the generic lesson engine uses it
   as a `provider`. Lesson 1-2 categories:
     1 Higher/Lower · 2 Same/Different · 3 Direction (up/down/same) ·
     4 Match the Pitch Shape (audio → pick the dot-contour that matches)
   No note names, clefs, staves, or interval names are ever shown. Material
   sits in a comfortable C3–C6 register; contour, not exact distance, is what
   the student judges. Practice adapts: bigger pitch gaps when a student
   struggles, closer gaps as they succeed (onResult hook). */
const ALPitch=(()=>{
  /* C-major scale across C3…C6 (indices are scale steps) */
  const SCALE=[48,50,52,53,55,57,59,60,62,64,65,67,69,71,72,74,76,77,79,81,83,84];
  const MID=11;                                   /* ~C5 area, comfortable */
  const rnd=a=>a[Math.floor(Math.random()*a.length)];
  const ri=n=>Math.floor(Math.random()*n);
  const clampIdx=i=>Math.max(0,Math.min(SCALE.length-1,i));
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=ri(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; }

  /* ---------- adaptive difficulty (practice only) ---------- */
  let diff=.15;                                   /* 0 easy(large gaps) … 1 hard(close) */
  function onResult(good){ diff=good?Math.min(1,diff+.12):Math.max(0,diff-.2); }
  const gapSteps=()=>Math.max(1,Math.round(6-diff*5));   /* 6 → 1 scale steps */

  /* ---------- playback ---------- */
  function playNotes(midis,onDone){
    ALAudio.stopAll();
    return ALAudio.play(midis.map((m,i)=>({midi:m,beat:i,dur:.9})),{bpm:92,onDone});
  }

  /* ---------- visuals ---------- */
  /* The reveal graphic shares a FIXED-height row that is reserved from the
     moment a question appears (invisible when empty). Filling it on answer
     therefore never pushes the Play/Continue buttons down and back up — no
     jarring vertical jump. */
  function ensureRow(st){
    let row=st.dotsEl.querySelector(".pitch-row");
    if(!row){ st.dotsEl.innerHTML='<div class="pitch-row"></div>'; row=st.dotsEl.firstChild; }
    return row;
  }
  function pitchDots(st,midis){
    const lo=Math.min(...midis),hi=Math.max(...midis),span=Math.max(2,hi-lo);
    const row=ensureRow(st); row.innerHTML=""; const H=64, DS=22;
    midis.forEach((m,i)=>{
      const d=document.createElement("div"); d.className="beat-dot pitch-dot";
      d.style.left=(18+i*52)+"px";
      d.style.top=((H-DS)*(1-(m-lo)/span))+"px";   /* keep dots within the row */
      row.appendChild(d);
    });
  }
  /* a small dot-contour graphic (higher sound = higher dot, time L→R,
     dots joined by a subtle line) — used for the shape choices */
  function shapeSVG(levels){
    const w=104,h=58,pad=13,n=levels.length;
    const mx=Math.max(...levels),mn=Math.min(...levels),span=Math.max(1,mx-mn);
    const xs=levels.map((_,i)=>pad+(n>1?i*(w-2*pad)/(n-1):0));
    const ys=levels.map(l=>h-pad-((l-mn)/span)*(h-2*pad));
    let s=`<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">`;
    s+=`<polyline points="${xs.map((x,i)=>x+","+ys[i]).join(" ")}" fill="none" stroke="var(--hairline-input)" stroke-width="2"/>`;
    xs.forEach((x,i)=>s+=`<circle cx="${x.toFixed(1)}" cy="${ys[i].toFixed(1)}" r="6.5" fill="var(--primary)"/>`);
    return s+`</svg>`;
  }

  /* ---------- shape vocabulary ---------- */
  const SHAPES3={up:[0,1,2],down:[2,1,0],same:[1,1,1],upDown:[0,2,0],
    downUp:[2,0,2],repUp:[0,0,2],repDown:[2,2,0]};
  const SHAPES4={up:[0,1,2,3],down:[3,2,1,0],same:[1,1,1,1],upDown:[0,2,3,1],
    downUp:[3,1,0,2],repUp:[0,0,2,3],repDown:[3,3,1,0]};
  const SHAPE_KEYS=["up","down","same","upDown","downUp","repUp","repDown"];
  const levelsToNotes=(levels,base)=>levels.map(l=>SCALE[clampIdx(base+l*2)]);

  /* ---------- question factories ---------- */
  function higherLowerQ(p){
    const {a,b}=p,higher=b>a;
    return {cat:1,type:"choice",correct:higher?"higher":"lower",
      choices:[{label:t("pc.higher"),value:"higher"},{label:t("pc.lower"),value:"lower"}],
      play:(st,vis,onDone)=>{ ensureRow(st); return playNotes([a,b],onDone); },
      reveal:st=>pitchDots(st,[a,b]),
      explain:()=>t(higher?"expl.higher":"expl.lower"),
      hint:()=>t("p.hint.hold")};
  }
  function sameDiffQ(p){
    const same=p.a===p.b;
    return {cat:2,type:"choice",correct:same?"same":"different",
      choices:[{label:t("pc.same2"),value:"same"},{label:t("pc.different"),value:"different"}],
      play:(st,vis,onDone)=>{ ensureRow(st); return playNotes([p.a,p.b],onDone); },
      reveal:st=>pitchDots(st,[p.a,p.b]),
      explain:()=>t(same?"expl.sameNote":"expl.diffNote"),
      hint:()=>t("p.hint.match")};
  }
  function directionQ(p){
    const dir=p.dir;
    return {cat:3,type:"choice",correct:dir,
      choices:[{label:t("pc.up"),value:"up"},{label:t("pc.down"),value:"down"},
               {label:t("pc.same"),value:"same"}],
      play:(st,vis,onDone)=>{ ensureRow(st); return playNotes(p.notes,onDone); },
      reveal:st=>pitchDots(st,p.notes),
      explain:()=>t(dir==="up"?"expl.up":dir==="down"?"expl.down":"expl.dirSame"),
      hint:()=>t("p.hint.trace")};
  }
  function shapeMatchQ(p){
    const len=p.len,set=len===4?SHAPES4:SHAPES3;
    const notes=levelsToNotes(set[p.key],p.base);
    const opts=[p.key,...p.distractors];
    /* answer positions randomized once, stored on the item for stable replays */
    const order=p.order||shuffle(opts.slice());
    p.order=order;
    return {cat:4,type:"choice",correct:p.key,
      choices:order.map(k=>({value:k,html:shapeSVG(set[k]),aria:t("shape."+k)})),
      play:(st,vis,onDone)=>{ ensureRow(st); return playNotes(notes,onDone); },
      reveal:st=>pitchDots(st,notes),
      explain:()=>t("shape."+p.key)+".",
      hint:()=>t("p.hint.trace")};
  }
  function fromBank(item){
    return item.cat===1?higherLowerQ(item.p):item.cat===2?sameDiffQ(item.p):
           item.cat===3?directionQ(item.p):shapeMatchQ(item.p);
  }

  /* ---------- parameter generators ---------- */
  function hlParams(gap){
    gap=gap||(2+ri(6));
    let i=MID-3+ri(7), j=(Math.random()<.5)?i+gap:i-gap;
    j=clampIdx(j); if(j===i) j=clampIdx(i+gap);
    return {a:SCALE[clampIdx(i)],b:SCALE[j]};
  }
  function sdParams(gap){
    if(Math.random()<.45){ const m=SCALE[clampIdx(MID-3+ri(7))]; return {a:m,b:m}; }
    return hlParams(gap);
  }
  function dirParams(){
    const dir=rnd(["up","down","same"]), len=3+ri(2);   /* 3 or 4 notes */
    let notes;
    if(dir==="same"){ const m=SCALE[clampIdx(MID-2+ri(5))]; notes=Array(len).fill(m); }
    else{ let base=clampIdx(MID-3+ri(4)), asc=Array.from({length:len},(_,k)=>SCALE[clampIdx(base+k*2)]);
      notes=dir==="down"?asc.slice().reverse():asc; }
    return {dir,notes};
  }
  function shapeParams(){
    const len=3+ri(2), key=rnd(SHAPE_KEYS);
    const others=SHAPE_KEYS.filter(k=>k!==key); shuffle(others);
    return {len,key,distractors:others.slice(0,2),base:clampIdx(MID-4+ri(4))};
  }

  /* ---------- practice generator (adaptive gaps) ---------- */
  function practiceNext(prevCat){
    let cat; do{ cat=1+ri(4); }while(cat===prevCat);
    if(cat===1) return higherLowerQ(hlParams(gapSteps()));
    if(cat===2) return sameDiffQ(sdParams(gapSteps()));
    if(cat===3) return directionQ(dirParams());
    return shapeMatchQ(shapeParams());
  }

  /* ---------- quiz bank (≥40; fixed moderate gaps, not adaptive) ---------- */
  function buildQuizBank(){
    const bank=[];
    for(let k=0;k<12;k++) bank.push({cat:1,p:hlParams(2+ri(6))});
    for(let k=0;k<12;k++) bank.push({cat:2,p:sdParams(2+ri(5))});
    for(let k=0;k<12;k++) bank.push({cat:3,p:dirParams()});
    for(let k=0;k<12;k++) bank.push({cat:4,p:shapeParams()});
    return bank;   /* 48 items */
  }

  /* ---------- guided Learn activities ---------- */
  function guided(genQ,rounds){
    return (st,api,done)=>{
      rounds=rounds||3; let i=0, ok=0;
      const ask=q=>{
        st.choices(q.choices,(v,b,el)=>{
          [...el.children].forEach(c=>c.disabled=true);
          const good=v===q.correct; if(good) ok++;
          b.classList.add(good?"good":"bad");
          q.reveal(st);
          st.fb((good?`<b>${t("fb.correct")}</b> `:`${t("fb.wrong")} `)+q.explain());
          /* keep the transport row in place (disabled) — clearing it would
             collapse the row and bounce the Continue button */
          [...st.transportEl.querySelectorAll("button")].forEach(x=>x.disabled=true);
          i++;
          if(i<rounds) api.flow(round,1900);
          else done({ok,total:rounds},ok+"/"+rounds);
        });
      };
      function round(){
        const q=genQ();
        st.dotsEl.innerHTML=""; ensureRow(st);   /* reserve the reveal space up front */
        st.choicesEl.innerHTML=""; st.fb("");
        st.transport([{label:"▶ "+t("ui.play"),onClick:()=>{ api.stopAll();
          q.play(st,"none",()=>{ st.fb(t("fb.chooseAnswer")); ask(q); }); }}]);
      }
      round();
    };
  }
  /* guided rounds start clearer (larger gaps) regardless of practice diff */
  const guidedHigherLower=guided(()=>higherLowerQ(hlParams(3+ri(4))));
  const guidedSameDiff   =guided(()=>sameDiffQ(sdParams(3+ri(4))));
  const guidedDirection  =guided(()=>directionQ(dirParams()));
  const guidedShapeMatch =guided(()=>shapeMatchQ(shapeParams()));

  return {higherLowerQ,sameDiffQ,directionQ,shapeMatchQ,fromBank,
          practiceNext,buildQuizBank,onResult,pitchDots,shapeSVG,
          guidedHigherLower,guidedSameDiff,guidedDirection,guidedShapeMatch};
})();
if(typeof module!=="undefined") module.exports=ALPitch;

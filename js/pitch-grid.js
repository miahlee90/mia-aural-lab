/* Aural Lab — pitch grid & ladder (Lesson 1-3 and beyond).
   Movable-Do, five levels Do–Re–Mi–Fa–Sol (internally C-based; students never
   see key names). Two reusable views:
     ladder(host)        — a labelled 5-level ladder that highlights a level in
                           sync with playback (hear/sing activities)
     draw(host,opts)     — an interactive grid: click/tap a level in each column
                           to place a note; dots join left→right; undo/clear;
                           returns the level sequence for grading.
   Grading is pitch ORDER only (relative contour), never rhythm or key. */
const ALGrid=(()=>{
  const SOLFEGE=["Do","Re","Mi","Fa","Sol"];   /* index 0..4, low→high */
  const MIDI=[60,62,64,65,67];                 /* C D E F G (movable Do base) */
  const midiOf=lv=>MIDI[Math.max(0,Math.min(4,lv))];

  /* ---------- ladder (display + highlight) ---------- */
  function ladder(host){
    host.innerHTML="";
    const el=document.createElement("div"); el.className="pg-ladder"; host.appendChild(el);
    for(let lv=4;lv>=0;lv--){
      const row=document.createElement("div"); row.className="pg-row"; row.dataset.lv=lv;
      row.innerHTML=`<span class="pg-lbl">${SOLFEGE[lv]}</span><span class="pg-cell"></span>`;
      el.appendChild(row);
    }
    const cell=lv=>el.querySelector('.pg-row[data-lv="'+lv+'"] .pg-cell');
    return {
      el,
      highlight(lv){ const c=cell(lv); if(!c) return; c.classList.add("lit");
        setTimeout(()=>c.classList.remove("lit"),Math.max(160,300)); },
      clear(){ el.querySelectorAll(".pg-cell").forEach(c=>c.classList.remove("lit")); }
    };
  }

  /* ---------- interactive drawing grid ----------
     opts={n, fixed:{col:level}, onChange(seq)} → controller.
     seq: array length n of level|null (fixed columns are pre-filled). */
  function draw(host,opts){
    const n=opts.n, fixed=opts.fixed||{};
    const seq=Array.from({length:n},(_,c)=>c in fixed?fixed[c]:null);
    /* CONSTANT canvas size regardless of note count — grids must never grow or
       shrink between questions (instructor: varying sizes strain the eyes) */
    const W=460, H=196, labelW=38, pad=22;
    const rowH=(H-2*pad)/4;
    const colX=c=>labelW+(W-labelW)*(c+0.5)/n;
    const lvY=lv=>H-pad-lv*rowH;
    const clampC=c=>Math.max(0,Math.min(n-1,c));
    let redoStack=[];
    host.innerHTML="";
    const wrap=document.createElement("div"); wrap.className="pg-draw"; host.appendChild(wrap);
    function render(){
      let s=`<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px" role="group" aria-label="Pitch grid">`;
      /* level guide lines + labels */
      for(let lv=0;lv<5;lv++){
        s+=`<line x1="${labelW}" y1="${lvY(lv).toFixed(1)}" x2="${W}" y2="${lvY(lv).toFixed(1)}" class="pg-line"/>`;
        s+=`<text x="6" y="${(lvY(lv)+4).toFixed(1)}" class="pg-slbl">${SOLFEGE[lv]}</text>`;
      }
      /* note numbers above each column — the student always sees exactly how
         many notes the pattern has and where each one goes */
      for(let c=0;c<n;c++)
        s+=`<text x="${colX(c).toFixed(1)}" y="13" class="pg-colnum${c in fixed?" pg-colnum-fixed":""}">${c+1}</text>`;
      /* clickable cells (skip fixed columns) */
      for(let c=0;c<n;c++){
        if(c in fixed) continue;
        for(let lv=0;lv<5;lv++)
          s+=`<rect class="pg-hit" x="${(colX(c)-26).toFixed(1)}" y="${(lvY(lv)-rowH/2).toFixed(1)}" width="52" height="${rowH.toFixed(1)}" data-c="${c}" data-lv="${lv}" tabindex="0" role="button" aria-label="${SOLFEGE[lv]}, note ${c+1}"/>`;
      }
      /* connecting line through placed notes */
      const pts=seq.map((lv,c)=>lv==null?null:`${colX(c).toFixed(1)},${lvY(lv).toFixed(1)}`).filter(Boolean);
      if(pts.length>1) s+=`<polyline points="${pts.join(" ")}" class="pg-path" fill="none"/>`;
      /* given anchor notes: ring + caption so students read them as "already
         placed" and draw only what follows (they can't click fixed columns) */
      if(opts.anchorLabel) for(const c in fixed){
        const ax=colX(+c), ay=lvY(fixed[c]);
        /* caption sits above the dot (below would fall outside the viewBox for
           the bottom Do anchor); flips below only for the very top level */
        const ly=fixed[c]>=4?ay+22:ay-19;
        s+=`<circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="13" class="pg-anchor-ring"/>`;
        s+=`<text x="${ax.toFixed(1)}" y="${ly.toFixed(1)}" class="pg-anchor-lbl">${opts.anchorLabel}</text>`;
      }
      /* dots */
      seq.forEach((lv,c)=>{ if(lv==null) return;
        s+=`<circle cx="${colX(c).toFixed(1)}" cy="${lvY(lv).toFixed(1)}" r="8" class="pg-dot${c in fixed?" pg-dot-fixed":""}"/>`; });
      /* moving playhead (hidden until playback drives it) */
      s+=`<circle class="pg-play" cx="${colX(0).toFixed(1)}" cy="${lvY(fixed[0]||0).toFixed(1)}" r="9" style="opacity:0"/>`;
      s+=`</svg>`;
      wrap.innerHTML=s;
      wrap.querySelectorAll(".pg-hit").forEach(r=>{
        const place=()=>{ const c=+r.dataset.c, lv=+r.dataset.lv;
          redoStack=[]; seq[c]=lv; render(); if(opts.onChange) opts.onChange(seq.slice()); };
        r.onclick=place;
        r.onkeydown=e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); place(); } };
      });
    }
    render();
    return {
      seq:()=>seq.slice(),
      /* count of student-placed (non-fixed) notes */
      placed:()=>seq.filter((lv,c)=>lv!=null&&!(c in fixed)).length,
      undo(){ for(let c=n-1;c>=0;c--){ if(!(c in fixed)&&seq[c]!=null){ seq[c]=null; break; } }
        render(); if(opts.onChange) opts.onChange(seq.slice()); },
      clear(){ for(let c=0;c<n;c++) if(!(c in fixed)) seq[c]=null;
        render(); if(opts.onChange) opts.onChange(seq.slice()); },
      /* lock/unlock input — lock() after Submit, or lock(false) to enable a
         grid that was shown early as a preview */
      lock(on){ const off=on===false; wrap.querySelectorAll(".pg-hit").forEach(r=>{
        r.style.pointerEvents=off?"":"none"; if(off) r.setAttribute("tabindex","0"); else r.removeAttribute("tabindex"); }); },
      /* move the orange playhead to a level as each note sounds (transient guide) */
      playAt(c,lv){ const cir=wrap.querySelector(".pg-play"); if(!cir) return;
        cir.setAttribute("cx",colX(clampC(c)).toFixed(1));
        cir.setAttribute("cy",lvY(Math.max(0,Math.min(4,lv))).toFixed(1));
        cir.style.opacity="1";
        cir.classList.remove("pg-play-pulse"); void cir.getBoundingClientRect(); cir.classList.add("pg-play-pulse"); },
      hidePlay(){ const cir=wrap.querySelector(".pg-play"); if(cir) cir.style.opacity="0"; }
    };
  }

  /* ---------- static display of a level sequence (reveal the answer) ---------- */
  function show(host,levels,cls){
    /* same CONSTANT canvas as draw() so reveals line up pixel-for-pixel */
    const n=levels.length, W=460, H=196, labelW=38, pad=22, rowH=(H-2*pad)/4;
    const colX=c=>labelW+(W-labelW)*(c+0.5)/n, lvY=lv=>H-pad-lv*rowH;
    let s=`<div class="pg-draw"><svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px" aria-hidden="true">`;
    for(let lv=0;lv<5;lv++){
      s+=`<line x1="${labelW}" y1="${lvY(lv).toFixed(1)}" x2="${W}" y2="${lvY(lv).toFixed(1)}" class="pg-line"/>`;
      s+=`<text x="6" y="${(lvY(lv)+4).toFixed(1)}" class="pg-slbl">${SOLFEGE[lv]}</text>`;
    }
    for(let c=0;c<n;c++)
      s+=`<text x="${colX(c).toFixed(1)}" y="13" class="pg-colnum">${c+1}</text>`;
    const pc="pg-path"+(cls?" "+cls:""), dc="pg-dot"+(cls?" "+cls:"");
    if(levels.length>1) s+=`<polyline points="${levels.map((lv,c)=>colX(c).toFixed(1)+","+lvY(lv).toFixed(1)).join(" ")}" class="${pc}" fill="none"/>`;
    levels.forEach((lv,c)=>s+=`<circle cx="${colX(c).toFixed(1)}" cy="${lvY(lv).toFixed(1)}" r="8" class="${dc}"/>`);
    host.innerHTML=s+`</svg></div>`;
  }

  return {SOLFEGE,MIDI,midiOf,ladder,draw,show};
})();
if(typeof module!=="undefined") module.exports=ALGrid;

/* Aural Lab — bottom-of-lesson navigation (Theory Lab style):
   three pills (← prev lesson · All lessons · next lesson →) plus a
   full-width jump <select> listing every lesson ("1-2 · Title").
   Localized: labels via i18n keys, titles via AL_CURRICULUM.text().
   mount(hostElOrId, lessonId, prefix) — prefix is "../" from lessons/. */
const ALLessonNav=(()=>{
  function mount(host,lessonId,prefix){
    prefix=prefix||"";
    const el=typeof host==="string"?document.getElementById(host):host;
    if(!el) return;
    const ls=AL_CURRICULUM.lessons, i=ls.findIndex(x=>x.id===lessonId);
    const prev=i>0?ls[i-1]:null, next=i<ls.length-1?ls[i+1]:null;
    const TT=x=>AL_CURRICULUM.text(x,"title");
    el.innerHTML=`
      <div class="lesson-nav">
        ${prev?`<a class="lnav-pill" href="${prefix}${prev.route}">← ${t("nav.lessonN",{n:prev.num})}</a>`
              :`<span class="lnav-pill lnav-off" aria-hidden="true"></span>`}
        <a class="lnav-pill" href="${prefix}lessons.html">${t("nav.allLessons")}</a>
        ${next?`<a class="lnav-pill" href="${prefix}${next.route}">${t("nav.lessonN",{n:next.num})} →</a>`
              :`<span class="lnav-pill lnav-off" aria-hidden="true"></span>`}
      </div>
      <select class="lesson-jump" aria-label="${t("nav.allLessons")}"></select>`;
    const sel=el.querySelector("select");
    ls.forEach(x=>{
      const o=document.createElement("option");
      o.value=prefix+x.route;
      o.textContent=x.num+" · "+TT(x);
      if(x.id===lessonId) o.selected=true;
      sel.appendChild(o);
    });
    sel.onchange=()=>{ location.href=sel.value; };
  }
  return {mount};
})();
if(typeof module!=="undefined") module.exports=ALLessonNav;

/* Aural Lab — Mia guide character (shared studio identity; SVG identical to
   Piano Lab's). ALMia.defs() injects the reusable <defs> once per page;
   ALMia.strip(id,cls) returns avatar+bubble markup; ALMia.say(el,msg) fills a
   bubble. Mia never sits on top of notation or interactive controls — she
   lives in her own strip. */
const ALMia=(()=>{
  const SVG=`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><g id="miaShape">
  <g class="armL"><line x1="42" y1="86" x2="26" y2="100" stroke="#EFCB4F" stroke-width="9" stroke-linecap="round"/></g>
  <path d="M34 92 Q28 60 32 40 Q38 14 60 14 Q82 14 88 40 Q92 60 86 92 Q82 98 78 94 L76 60 Q74 42 60 42 Q46 42 44 60 L42 94 Q38 98 34 92 Z" fill="#3A2B24"/>
  <path d="M32 130 Q30 82 60 78 Q90 82 88 130 Z" fill="#EFCB4F"/>
  <rect x="50" y="72" width="20" height="9" rx="4" fill="#e0ba3e"/>
  <path d="M46 100 Q60 106 74 100 M44 114 Q60 120 76 114" fill="none" stroke="#e0ba3e" stroke-width="2"/>
  <g><rect x="14" y="96" width="21" height="27" rx="2.5" fill="#6D55B8"/><rect x="14" y="96" width="4" height="27" rx="2" fill="#57448f"/><text x="19" y="116" font-size="15" fill="#fff" font-family="serif">&#119070;</text></g>
  <circle cx="60" cy="50" r="23" fill="#FFDCB8"/>
  <path d="M38 52 Q34 20 60 18 Q86 20 82 52 Q80 34 66 30 Q56 28 48 34 Q40 40 38 52 Z" fill="#3A2B24"/>
  <path class="browL" d="M44 38 Q50 35.5 55 38" fill="none" stroke="#4a382e" stroke-width="2.2" stroke-linecap="round"/>
  <path class="browR" d="M65 38 Q70 35.5 76 38" fill="none" stroke="#4a382e" stroke-width="2.2" stroke-linecap="round"/>
  <circle cx="51" cy="49" r="3" fill="#2B2B2B"/><circle cx="69" cy="49" r="3" fill="#2B2B2B"/>
  <circle cx="52.2" cy="47.9" r="1" fill="#fff"/><circle cx="70.2" cy="47.9" r="1" fill="#fff"/>
  <circle cx="51" cy="49" r="8.5" fill="none" stroke="#6b5340" stroke-width="2"/>
  <circle cx="69" cy="49" r="8.5" fill="none" stroke="#6b5340" stroke-width="2"/>
  <line x1="59.5" y1="49" x2="60.5" y2="49" stroke="#6b5340" stroke-width="2"/>
  <line x1="42.5" y1="48" x2="38" y2="46" stroke="#6b5340" stroke-width="2"/>
  <line x1="77.5" y1="48" x2="82" y2="46" stroke="#6b5340" stroke-width="2"/>
  <circle cx="45" cy="58" r="3" fill="#f6b8a0" opacity=".55"/><circle cx="75" cy="58" r="3" fill="#f6b8a0" opacity=".55"/>
  <path class="mouth-smile" d="M53 61 Q60 67 67 61" fill="none" stroke="#a3542f" stroke-width="2.6" stroke-linecap="round"/>
  <g class="armR"><line x1="78" y1="86" x2="97" y2="98" stroke="#EFCB4F" stroke-width="9" stroke-linecap="round"/><circle cx="99" cy="99" r="4.5" fill="#FFDCB8"/></g>
</g></defs></svg>`;
  function defs(){
    if(document.getElementById("miaShape")) return;
    const d=document.createElement("div"); d.innerHTML=SVG;
    document.body.insertBefore(d.firstChild,document.body.firstChild);
  }
  function strip(bubbleId,cls){
    return `<div class="mia-strip ${cls||""}">
      <svg class="mia-avatar" viewBox="10 8 100 126" aria-hidden="true"><use href="#miaShape"/></svg>
      <div class="mia-bubble" id="${bubbleId}" aria-live="polite"></div></div>`;
  }
  function say(elOrId,html){
    const el=typeof elOrId==="string"?document.getElementById(elOrId):elOrId;
    if(el) el.innerHTML=html;
  }
  return {defs,strip,say};
})();
if(typeof module!=="undefined") module.exports=ALMia;

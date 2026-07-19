/* Aural Lab — solfège systems. One place defines every syllable system the
   course supports; lessons ask AL_SOLFEGE.label(degree,alter) and get the
   student's configured system. The system is a COURSE SETTING (teacher can
   change it later) — it never switches randomly inside one assignment.

   Initial prototype default: Scale Degrees with Movable Do, C major, combined
   display when helpful ("7/ti"). */
const AL_SOLFEGE=(()=>{
  const KEY="al-solfege-v1";
  /* diatonic syllables, movable do (major). Index = scale degree 1-7. */
  const DO=["","do","re","mi","fa","sol","la","ti"];
  /* chromatic alterations, movable do:
     raised: do–di, re–ri, fa–fi, sol–si, la–li
     lowered: re–ra, mi–me, sol–se, la–le, ti–te */
  const RAISED ={1:"di",2:"ri",4:"fi",5:"si",6:"li"};
  const LOWERED={2:"ra",3:"me",5:"se",6:"le",7:"te"};
  /* la-based minor: degree of the MINOR scale → syllable */
  const LA_MINOR=["","la","ti","do","re","mi","fa","sol"];
  const LETTERS_CMAJ=["","C","D","E","F","G","A","B"];

  const DEFAULTS={
    system:"degrees-movable",  /* degrees-movable | movable-do | fixed-do | letters */
    minor:"do-based",          /* do-based | la-based */
    combined:true              /* show "7/ti" style combined labels when helpful */
  };
  function get(){
    try{ return Object.assign({},DEFAULTS,JSON.parse(localStorage.getItem(KEY))||{}); }
    catch(e){ return Object.assign({},DEFAULTS); }
  }
  function set(patch){
    const s=Object.assign(get(),patch);
    try{ localStorage.setItem(KEY,JSON.stringify(s)); }catch(e){}
    return s;
  }
  /* syllable for a (major-key) scale degree with alteration -1/0/+1 */
  function syllable(degree,alter){
    if(alter===1)  return RAISED[degree] ||DO[degree]+"#";
    if(alter===-1) return LOWERED[degree]||DO[degree]+"b";
    return DO[degree];
  }
  /* main label under the current setting; degree is 1-7 in the major key */
  function label(degree,alter){
    const s=get();
    const alt=alter===1?"♯":alter===-1?"♭":"";
    if(s.system==="movable-do") return syllable(degree,alter||0);
    if(s.system==="letters")    return alt+LETTERS_CMAJ[degree];   /* C-major prototype */
    if(s.system==="fixed-do")   return alt+DO[degree];             /* C-major prototype: same syllables */
    /* degrees-movable (default): "2" or combined "2/re" */
    const deg=alt+degree;
    return s.combined?deg+"/"+syllable(degree,alter||0):deg;
  }
  function minorLabel(minorDegree,alter){
    const s=get();
    if(s.minor==="la-based") return LA_MINOR[minorDegree]||"";
    /* do-based minor: 3,6,7 are me/le/te */
    const map={1:"do",2:"re",3:"me",4:"fa",5:"sol",6:"le",7:"te"};
    if(alter===1&&minorDegree===7) return "ti";  /* raised leading tone */
    return map[minorDegree]||"";
  }
  return {get,set,label,syllable,minorLabel,RAISED,LOWERED};
})();
if(typeof module!=="undefined") module.exports=AL_SOLFEGE;

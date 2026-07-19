/* Aural Lab — the ONE shared audio engine. Every sound in the app comes from
   here: single pitches, melodic patterns, harmonic intervals & chords,
   rhythm/pulse ticks, count-ins, and student-answer playback.

   Design rules (from the course spec):
   - one playback at a time — starting a new sequence stops the old one
     (stopAll() is called inside play()/pulse());
   - consistent volume, tone color and register: answers must never be
     revealed by unintended loudness/timbre changes, so every pitch uses the
     same piano-like voice and per-note gain curve (adapted from Piano Lab);
   - mobile audio unlock: the AudioContext is created/resumed inside the first
     user gesture (ensure() is safe to call from any click/keydown handler);
   - scheduling uses the AudioContext clock, and each scheduled beat exposes a
     performance.now()-domain timestamp so tap grading and visuals line up
     with what the ear hears. */
const ALAudio=(()=>{
  let ctx=null, master=null, on=true, vol=1;
  try{ const s=JSON.parse(localStorage.getItem("al-sound-v1")); if(s&&s.vol!=null) vol=s.vol; }catch(e){}
  const active=new Map();
  let timers=[];            /* pending setTimeout ids for the current playback */
  let playing=false;

  function ensure(){
    if(!ctx){
      ctx=new (window.AudioContext||window.webkitAudioContext)();
      master=ctx.createGain(); master.gain.value=.8*vol;
      const hp=ctx.createBiquadFilter();
      hp.type="highpass"; hp.frequency.value=70; hp.Q.value=.5;
      const comp=ctx.createDynamicsCompressor();
      comp.threshold.value=-18; comp.knee.value=24; comp.ratio.value=4;
      comp.attack.value=.005; comp.release.value=.12;
      master.connect(hp); hp.connect(comp); comp.connect(ctx.destination);
    }
    if(ctx.state==="suspended") ctx.resume();
  }
  const freq=m=>440*Math.pow(2,(m-69)/12);

  /* ---- piano-like tone (same voice as Piano Lab — decaying envelope) ---- */
  function toneAt(m,when,durSec,vel){
    const t=when, f=freq(m);
    const v=Math.min(1,(vel||90)/127)*.34*(f<180?.72:1);
    const att=f<200?.014:.005;
    const g=ctx.createGain();
    const lp=ctx.createBiquadFilter(); lp.type="lowpass";
    lp.frequency.value=Math.min(6000,Math.max(800,f*5)); lp.Q.value=.4;
    const o1=ctx.createOscillator(); o1.type="sine";     o1.frequency.value=f;
    const o2=ctx.createOscillator(); o2.type="triangle"; o2.frequency.value=f*2;
    const o3=ctx.createOscillator(); o3.type="sine";     o3.frequency.value=f*3;
    const g2=ctx.createGain(); g2.gain.value=f<180?.34:.14;
    const g3=ctx.createGain(); g3.gain.value=f<400?.09:.05;
    const rel=Math.max(.15,Math.min(durSec||.5,3.4));
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(v,t+att);
    g.gain.exponentialRampToValueAtTime(v*.28,t+Math.min(.7,rel));
    g.gain.setValueAtTime(v*.28*Math.pow(.0029,Math.max(0,rel-.7)/2.9)||v*.28,t+rel);
    g.gain.exponentialRampToValueAtTime(.0006,t+rel+.12);
    o1.connect(g); o2.connect(g2); g2.connect(g); o3.connect(g3); g3.connect(g);
    g.connect(lp); lp.connect(master);
    o1.start(t); o2.start(t); o3.start(t);
    o1.stop(t+rel+.25); o2.stop(t+rel+.25); o3.stop(t+rel+.25);
    register([o1,o2,o3],g);
  }

  /* ---- SUSTAINED tone (duration activities) ----------------------------
     A piano-like tone DECAYS, so a long and a short note fade to near-silence
     alike — no good for "which lasts longer?". This voice attacks fast, HOLDS
     at constant volume for the whole duration, then releases crisply, so the
     length is unmistakable. Same voice family as the press-and-hold tone. */
  function susAt(m,when,durSec){
    const t=when, f=freq(m), hold=Math.max(.1,durSec||.5);
    const v=Math.min(1,90/127)*.26*(f<180?.72:1), att=.012, rel=.05;
    const g=ctx.createGain();
    const o1=ctx.createOscillator(); o1.type="sine";     o1.frequency.value=f;
    const o2=ctx.createOscillator(); o2.type="triangle"; o2.frequency.value=f*2;
    const g2=ctx.createGain(); g2.gain.value=.1;
    const holdEnd=Math.max(t+att+.02,t+hold-rel);
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(v,t+att);
    g.gain.setValueAtTime(v,holdEnd);
    g.gain.linearRampToValueAtTime(.0008,t+hold);
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(master);
    o1.start(t); o2.start(t); o1.stop(t+hold+.04); o2.stop(t+hold+.04);
    register([o1,o2],g);
  }

  /* immediate single note (on-screen keyboards, answer previews) */
  function note(m,ms,vel){ if(!on) return; ensure(); toneAt(m,ctx.currentTime,(ms||500)/1000,vel); }
  function chord(ms_,ms,vel){ if(!on) return; ensure();
    (ms_||[]).forEach(m=>toneAt(m,ctx.currentTime,(ms||700)/1000,vel)); }

  /* ---- metronome / pulse tick (woodblock-ish; accent = higher + louder,
     clear but not exaggerated) ---- */
  function tickAt(when,accent){
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type="triangle"; o.frequency.value=accent?2093:1568;
    g.gain.setValueAtTime(accent?.62:.4,when);
    g.gain.exponentialRampToValueAtTime(.001,when+.07);
    o.connect(g); g.connect(master); o.start(when); o.stop(when+.08);
    register([o],g);
  }
  function tick(accent){ if(!on) return; ensure(); tickAt(ctx.currentTime,accent); }

  /* every scheduled sound source is tracked so stopAll() can actually SILENCE
     it — a pulse/melody schedules all its notes on the audio timeline up
     front, and clearing JS timers alone would leave those notes ringing into
     the next question. killVoices() fades each fast (~12ms, click-free) then
     stops the oscillators. */
  let voices=[];
  function register(oscs,gain){ voices.push({oscs,gain}); }
  function killVoices(){
    if(!ctx){ voices=[]; return; }
    const t=ctx.currentTime;
    voices.forEach(v=>{
      try{ const gp=v.gain.gain;
        if(gp.cancelAndHoldAtTime) gp.cancelAndHoldAtTime(t); else gp.cancelScheduledValues(t);
        gp.linearRampToValueAtTime(.0001,t+.012);
      }catch(e){}
      v.oscs.forEach(o=>{ try{ o.stop(t+.02); }catch(e){} });
    });
    voices=[];
  }
  function stopAll(){
    playing=false;
    timers.forEach(clearTimeout); timers=[];
    [...active.keys()].forEach(k=>active.delete(k));
    killVoices();
  }
  function later(fn,ms){ timers.push(setTimeout(fn,Math.max(0,ms))); }

  /* map an AudioContext time to the performance.now() clock */
  function perfTime(ctxTime){ return performance.now()+(ctxTime-ctx.currentTime)*1000; }

  /* ---- pulse: steady (optionally accented) beats ----------------------
     opts={bpm, beats, beatsPerBar, accent:bool, countIn:int(beats),
           tickSound:bool, onBeat(i,perfT), onDone()}
     Returns {beatTimes:[perfMs per sounded main beat], countTimes:[...]} —
     grading compares taps against beatTimes. */
  function pulse(opts){
    ensure(); stopAll(); playing=true;
    const bpm=opts.bpm||80, per=60/bpm;
    const nCount=opts.countIn||0, n=opts.beats;
    const bpb=opts.beatsPerBar||0;
    const t0=ctx.currentTime+.18;
    const beatTimes=[], countTimes=[];
    for(let i=0;i<nCount;i++){
      const tc=t0+i*per;
      if(on) tickAt(tc,i===0);
      countTimes.push(perfTime(tc));
      if(opts.onCount){ const idx=i;
        later(()=>{ if(playing) opts.onCount(idx,countTimes[idx]); },countTimes[i]-performance.now()); }
    }
    const tMain=t0+nCount*per;
    for(let i=0;i<n;i++){
      const tb=tMain+i*per;
      const accent=opts.accent&&bpb?(i%bpb===0):false;
      if(on&&opts.tickSound!==false) tickAt(tb,accent);
      beatTimes.push(perfTime(tb));
      if(opts.onBeat){ const idx=i; later(()=>{ if(playing) opts.onBeat(idx,beatTimes[idx]); },beatTimes[i]-performance.now()); }
    }
    if(opts.onDone){
      const endMs=(tMain+n*per+.15-ctx.currentTime)*1000;
      later(()=>{ if(playing){ playing=false; opts.onDone(); } },endMs);
    }
    return {beatTimes,countTimes,period:per*1000};
  }

  /* ---- sequence: melodic/harmonic playback ----------------------------
     events=[{midi:60 | midis:[60,64,67], beat:0, dur:1, vel}] with beat/dur
     in beats; opts={bpm, countIn, onEvent(i,perfT), onDone}. */
  function play(events,opts){
    ensure(); stopAll(); playing=true;
    const bpm=(opts&&opts.bpm)||80, per=60/bpm;
    const nCount=(opts&&opts.countIn)||0;
    const t0=ctx.currentTime+.18;
    for(let i=0;i<nCount;i++) if(on) tickAt(t0+i*per,i===0);
    const tMain=t0+nCount*per;
    let end=tMain;
    const sustain=opts&&opts.sustain;
    events.forEach((ev,i)=>{
      const tb=tMain+ev.beat*per, durS=(ev.dur||1)*per;
      const ms=ev.midis||[ev.midi];
      if(on) ms.forEach(m=>sustain?susAt(m,tb,durS):toneAt(m,tb,durS,ev.vel));
      end=Math.max(end,tb+durS);
      if(opts&&opts.onEvent){ const idx=i, pt=perfTime(tb);
        later(()=>{ if(playing) opts.onEvent(idx,pt); },pt-performance.now()); }
    });
    if(opts&&opts.onDone){
      later(()=>{ if(playing){ playing=false; opts.onDone(); } },(end+.15-ctx.currentTime)*1000);
    }
    return {endsInMs:(end-ctx.currentTime)*1000};
  }

  /* ---- press-and-hold sustained tone (echo activities) ----------------
     holdStart() begins a tone NOW; holdStop() ends it. Registered with the
     voice list so stopAll() also silences it. Same pitch family as the
     piano voice but a plain sustained sine — the student must clearly hear
     their own sound begin and end. */
  let holdV=null;
  function holdStart(m){
    if(!on) return; ensure(); holdStop();
    const t=ctx.currentTime, f=freq(m||60);
    const o=ctx.createOscillator(), o2=ctx.createOscillator(), g=ctx.createGain(), g2=ctx.createGain();
    o.type="sine"; o.frequency.value=f;
    o2.type="triangle"; o2.frequency.value=f*2; g2.gain.value=.08;
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.22,t+.015);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(master);
    o.start(t); o2.start(t);
    holdV={oscs:[o,o2],gain:g};
    register([o,o2],g);
  }
  function holdStop(){
    if(!holdV||!ctx) return;
    const t=ctx.currentTime;
    try{ const gp=holdV.gain.gain;
      if(gp.cancelAndHoldAtTime) gp.cancelAndHoldAtTime(t); else gp.cancelScheduledValues(t);
      gp.linearRampToValueAtTime(.0005,t+.045);
      holdV.oscs.forEach(o=>{ try{ o.stop(t+.08); }catch(e){} });
    }catch(e){}
    holdV=null;
  }
  function setSound(v){ on=!!v; }
  /* master volume 0..1, persisted (sound-check / sound-settings UI) */
  function setVolume(v){
    vol=Math.max(0,Math.min(1,+v||0));
    if(master) master.gain.value=.8*vol;
    try{ const s=JSON.parse(localStorage.getItem("al-sound-v1"))||{};
      s.vol=vol; localStorage.setItem("al-sound-v1",JSON.stringify(s)); }catch(e){}
  }
  return {ensure,note,chord,tick,pulse,play,holdStart,holdStop,stopAll,setSound,setVolume,
          volume:()=>vol,isOn:()=>on,isPlaying:()=>playing};
})();
if(typeof module!=="undefined") module.exports=ALAudio;

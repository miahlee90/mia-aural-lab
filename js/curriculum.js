/* Aural Lab — course structure: 4 units, 44 lessons.

   Every lesson has a PERMANENT internal id (aural-u<unit>-l<n>) that never
   changes even if lessons are inserted later; `num` is the student-facing
   "1-1" label. `item` is the integer LMS item_id (also permanent).
   status: "ready"   — fully implemented, has its own page in lessons/
           "planned" — metadata only; lesson.html renders it as an honest
                       placeholder (never presented as a finished lesson).
   track: "general" (everyone) | "major" (Music Major Track — teacher can
   assign or skip; the lesson always stays in the curriculum).
   skills: Rhythm, Pitch, Solfège, Singing, Dictation, Harmony, Error
   Detection, Transcription — shown as tags on the lesson cards.

   Header fields (Description / Mia's Tip / Let's Try) are deliberately short:
   1–2 sentences, one strategy, one action. */
const AL_CURRICULUM=(()=>{
  const units=[
    {unit:1,title:"Rhythm, Pitch & Notation Foundations",
     desc:"Steady beat, meter, pitch direction, first solfège, and writing what you hear."},
    {unit:2,title:"Major, Minor, Intervals & Transcription",
     desc:"Key signatures, intervals, compound meter, the minor mode, and real transcription."},
    {unit:3,title:"Functional Solfège & Advanced Rhythm",
     desc:"Dominant and subdominant patterns, leaps, pentatonic melodies, and syncopation."},
    {unit:4,title:"Harmonic Singing, Listening & Dictation",
     desc:"Sing against other voices, hear chord qualities and inversions, write bass lines."}
  ];

  /* L(unit, n, title, skills, desc, tip, letsTry, extra) */
  const L=(u,n,title,skills,desc,tip,letsTry,extra)=>Object.assign(
    {id:`aural-u${u}-l${n}`,unit:u,n,num:`${u}-${n}`,title,skills,desc,tip,letsTry,
     status:"planned",track:"general"},extra||{});

  const lessons=[
    /* ---------------- UNIT 1 ---------------- */
    L(1,1,"Meter and Rhythm Foundations",["Rhythm"],
      "Learn how steady beats are grouped into measures.",
      "Keep the pulse even. A steady beat does not suddenly speed up or slow down.",
      "Listen, find the beat, and tap it with F and J.",
      {status:"ready",route:"lessons/aural-u1-l1.html",
       goal:"Maintain a steady beat and recognize basic groups of two, three, and four beats."}),
    L(1,2,"Pitch Foundations",["Pitch"],
      "Hear whether sounds move higher, lower, or stay the same, and connect what you hear with vertical position.",
      "Listen to pitch, not volume. A higher sound is not necessarily a louder sound.",
      "Listen to two sounds and tell which one is higher.",
      {status:"ready",route:"lessons/aural-u1-l2.html",
       goal:"Compare pitches as higher or lower, hear pitch direction, and match a pattern to its shape."}),
    L(1,3,"Steps, Skips, and Repeated Notes",["Pitch","Singing"],
      "Hear, sing, and draw steps, skips, and repeated notes.",
      "Keep the first Do in your mind. Compare each new sound with the sound before it.",
      "Listen to two notes and tell if the second stepped, skipped, or repeated.",
      {status:"ready",route:"lessons/aural-u1-l3.html",
       goal:"Distinguish steps, skips, and repeated notes; sing and draw short pitch patterns."}),
    L(1,4,"Long and Short Sounds",["Rhythm"],
      "Learn to recognize, compare, and reproduce long and short sounds.",
      "Listen for when the sound begins and when it ends.",
      "Listen to two sounds and tell which one lasts longer.",
      {status:"ready",route:"lessons/aural-u1-l4.html",
       goal:"Distinguish and compare sound durations, recognize silence, and reproduce short duration patterns."}),
    L(1,5,"Short Pattern Memory",["Rhythm","Pitch"],
      "Listen, remember, and reproduce short musical patterns.",
      "Hold the whole pattern in your mind before you answer.",
      "Listen to a short pattern, then reproduce it from memory."),
    L(1,6,"Expanding Pitch Skills",["Pitch","Solfège","Singing"],
      "Sing and identify steps and skips within the first five notes of the scale.",
      "Steps move to the next-door note; skips jump over one.",
      "Listen and choose: step, skip, or repeat?"),
    L(1,7,"Writing Rhythm and Meter",["Rhythm","Dictation"],
      "Write down short rhythms you hear using note and rest values.",
      "Find the beat first, then fill in how each beat divides.",
      "Build the rhythm you heard, one beat at a time."),
    L(1,8,"Writing Pitches on the Staff",["Pitch","Dictation"],
      "Notate the pitches you hear on the staff.",
      "Anchor on do — every other note is measured from home.",
      "Click the staff to write the notes you heard."),
    L(1,9,"Writing Pitch and Rhythm Together",["Pitch","Rhythm","Dictation"],
      "Take short melodic dictation: pitch and rhythm in one answer.",
      "Catch the rhythm skeleton first, then hang the pitches on it.",
      "Listen, then build the melody on the staff."),
    L(1,10,"Dictation in Longer Phrases",["Dictation"],
      "Hold longer phrases in memory and write them down.",
      "Memorize in chunks — sing the phrase back to yourself before writing.",
      "Listen to a longer phrase and write it down."),

    /* ---------------- UNIT 2 ---------------- */
    L(2,1,"The Major Keys and Key Signatures",["Pitch","Solfège"],
      "Learn all 15 written major key signatures and hear how the tonic feels.",
      "You READ a key signature; you HEAR tonal function. Enharmonic keys can sound identical.",
      "Name the major key from its signature."),
    L(2,2,"Ties and the Dotted Beat",["Rhythm","Dictation"],
      "Hear and write rhythms with ties and dotted notes.",
      "A dot and a tie can sound the same — the beat tells you how to write it.",
      "Tap rhythms that hold across the beat."),
    L(2,3,"Interval Number and Quality",["Pitch"],
      "Measure the distance between two notes by number and quality.",
      "Count letter names for the number first — quality comes second.",
      "Listen to two notes and name the interval."),
    L(2,4,"Solfège Neighbors — ti and re",["Solfège","Singing"],
      "Sing do's neighbors above and below and hear how they pull home.",
      "ti leans up to do; re steps back down to do.",
      "Sing do–ti–do and do–re–do with the syllables."),
    L(2,5,"Tempo",["Rhythm"],
      "Recognize common tempo markings and keep a tempo steady.",
      "Tempo is the speed of the beat, not of the notes.",
      "Match the pulse you hear to a tempo marking."),
    L(2,6,"Compound Meter",["Rhythm"],
      "Feel beats that divide into three, as in 6/8.",
      "Feel the big beat first; the three inside come along for the ride.",
      "Choose: does the beat split in two or in three?"),
    L(2,7,"Introduction to the Minor Mode",["Pitch","Solfège","Singing"],
      "Hear the difference between major and minor and sing minor patterns.",
      "me is the note that darkens the scale — listen for it.",
      "Listen and choose: major or minor?"),
    L(2,8,"Lower Chromatic Neighbors",["Solfège","Singing"],
      "Sing and hear lowered neighbor tones that decorate a melody.",
      "A chromatic neighbor always leans back to the note it came from.",
      "Sing the pattern with its chromatic neighbor."),
    L(2,9,"Minor Solfège and Modal Borrowing",["Solfège","Singing"],
      "Use minor-mode syllables and hear notes borrowed between modes.",
      "Use one minor system — do-based or la-based — and stay with it.",
      "Sing the minor scale with your solfège system."),
    L(2,10,"Triplets and Duplets",["Rhythm"],
      "Fit three notes where two belong, and two where three belong.",
      "Keep every note of the triplet even — no note gets extra time.",
      "Tap triplets against a steady beat."),
    L(2,11,"Introduction to Transcription",["Transcription","Dictation"],
      "Write down a short real performance — pitch, rhythm, and meter.",
      "Loop small sections; transcribe a little at a time.",
      "Transcribe a two-measure phrase."),
    L(2,12,"Four-Part Beat Division in Simple Meter",["Rhythm"],
      "Hear and tap sixteenth-note divisions of the beat.",
      "Keep the beat big and steady — the sixteenths live inside it.",
      "Tap the sixteenth-note patterns you hear."),
    L(2,13,"Conducting Different Pulse Levels",["Rhythm"],
      "Feel the measure, the beat, and the division as different pulse levels.",
      "They are all pulses of the same music — choose your level and stay there.",
      "Tap along at the pulse level Mia asks for."),
    L(2,14,"Performance Indications",["Rhythm","Error Detection"],
      "Read dynamics, articulation, and expression marks — then hear them in performance.",
      "Every mark is an instruction for sound; connect each one to what you hear.",
      "Match what you hear to the written marking."),

    /* ---------------- UNIT 3 ---------------- */
    L(3,1,"The Dominant Triad — sol, ti and re",["Solfège","Singing","Harmony"],
      "Sing and recognize melodies built on the dominant triad.",
      "sol–ti–re points home to do — feel the pull.",
      "Sing the dominant triad starting from the tonic."),
    L(3,2,"Alto and Tenor Clefs",["Pitch","Singing"],
      "Read and sing from the alto and tenor clefs.",
      "Find middle C on the new clef first — everything hangs from it.",
      "Name and sing notes in alto clef.",
      {track:"major"}),
    L(3,3,"Solfège Leaps to fa and la/le",["Solfège","Singing"],
      "Sing leaps to fa and la (le) accurately from any scale degree.",
      "Hear the target note inside the scale before you leap.",
      "Sing the leap, then check it against the piano."),
    L(3,4,"Pentatonicism",["Pitch","Singing"],
      "Sing and recognize five-note scales in melodies.",
      "No half steps — that open sound is the pentatonic fingerprint.",
      "Listen and decide: pentatonic or not?"),
    L(3,5,"Six-Part Beat Division in Compound Meter",["Rhythm"],
      "Hear and tap six-part divisions of the compound beat.",
      "Keep the dotted-quarter beat steady — six small notes fit inside it.",
      "Tap the compound-beat patterns you hear."),
    L(3,6,"Repeat Signs in Performance",["Rhythm","Error Detection"],
      "Follow repeats, endings, D.C. and D.S. by ear and by eye.",
      "Map the road before you travel — mark every jump in advance.",
      "Follow the score and click where the music goes next."),
    L(3,7,"The Subdominant Triad — fa, la and do",["Solfège","Singing","Harmony"],
      "Sing and recognize melodies built on the subdominant triad.",
      "fa–la–do sits one step from home — hear its gentle lift.",
      "Sing the subdominant triad starting from the tonic."),
    L(3,8,"Syncopation",["Rhythm"],
      "Feel accents that land off the beat, and tap them precisely.",
      "Keep the beat rock-steady — syncopation only works against a steady grid.",
      "Tap the syncopated rhythms you hear."),
    L(3,9,"The Dominant Seventh in Melodic Context",["Solfège","Singing","Harmony"],
      "Hear and sing the dominant seventh — sol, ti, re and fa — inside melodies.",
      "fa is the new note: it leans down to mi.",
      "Sing sol–ti–re–fa and resolve it."),

    /* ---------------- UNIT 4 ---------------- */
    L(4,1,"Introduction to Harmonic Singing",["Singing","Harmony"],
      "Sing one line while another voice sounds — and hold your part.",
      "Listen to the other voice without following it.",
      "Sing your line against Mia's held drone."),
    L(4,2,"Harmonic Rhythm and Cadences",["Harmony"],
      "Hear how fast chords change and where phrases come to rest.",
      "Cadences are punctuation — listen for the comma or the period.",
      "Listen and mark where the chords change."),
    L(4,3,"Two-Voice Music",["Singing","Harmony","Dictation"],
      "Follow and sing either voice of a two-part texture.",
      "Practice both parts — the other voice makes yours make sense.",
      "Sing the top line, then the bottom line."),
    L(4,4,"Bass-Line Dictation",["Dictation","Harmony"],
      "Write down the lowest voice of what you hear.",
      "The bass moves more by leap — anchor on do and sol.",
      "Listen to the progression and write the bass."),
    /* Triad Qualities comes BEFORE inversions on purpose: students must know
       Major/Minor/Augmented/Diminished before being tested on inversions. */
    L(4,5,"Triad Qualities",["Harmony","Pitch"],
      "Tell major, minor, augmented and diminished triads apart by ear.",
      "Major and minor differ by one note — the third. Listen there first.",
      "Listen and name the triad quality."),
    L(4,6,"Root Position and First-Inversion Triads",["Harmony"],
      "Hear whether the root or the third is in the bass.",
      "Inversion changes the bottom of the chord, not its color.",
      "Listen and choose: root position or first inversion?"),
    L(4,7,"Introduction to Voice Leading",["Harmony","Singing"],
      "Follow how each voice moves as chords change.",
      "Good voice leading moves the smallest possible distance.",
      "Watch and hear each voice move between two chords."),
    L(4,8,"The Leading-Tone Triad — ti, re and fa",["Harmony","Solfège","Singing"],
      "Sing and hear the diminished triad on ti and its pull toward resolution.",
      "All three notes want to move — ti up to do, fa down to mi.",
      "Sing ti–re–fa and resolve each note."),
    L(4,9,"The Supertonic Triad — re, fa and la/le",["Harmony","Solfège","Singing"],
      "Sing and recognize the supertonic triad and its motion to the dominant.",
      "re–fa–la loves to hand off to the dominant — listen for the handoff.",
      "Sing the supertonic triad, then the dominant."),
    L(4,10,"The Submediant Triad — la/le, do and mi/me",["Harmony","Solfège","Singing"],
      "Sing and recognize the submediant triad in major and minor.",
      "After V, la can be a surprise landing — the deceptive move.",
      "Sing the submediant triad in both modes."),
    L(4,11,"The Mediant Triad — mi/me, sol and ti/te",["Harmony","Solfège","Singing"],
      "Sing and recognize the mediant triad in major and minor.",
      "The mediant shares two notes with tonic AND dominant — that is why it hides.",
      "Sing the mediant triad and find its shared notes.")
  ];

  /* permanent integer LMS item ids, assigned once in curriculum order */
  lessons.forEach((l,i)=>{ l.item=i+1; });
  /* default placeholder route */
  lessons.forEach(l=>{ if(!l.route) l.route="lesson.html?id="+l.id; });

  const byId={}; lessons.forEach(l=>{ byId[l.id]=l; });

  /* ---- localization overlay ----
     Lesson/unit content supports en (canonical, stored above), es, and
     future ko. Translations live in locales/curriculum.<lang>.js which
     register under window.AL_L10N.curriculum.<lang> = {units:{1:{title,
     desc}},lessons:{"aural-u1-l1":{title,desc,tip,letsTry,goal}}}.
     Lookup happens at call time: missing language/field falls back to
     English automatically. Scoring, ids, routes, skills and progress are
     language-independent. */
  function overlay(){
    if(typeof window==="undefined"||typeof ALI18N==="undefined") return null;
    const g=window.AL_L10N;
    return (g&&g.curriculum&&g.curriculum[ALI18N.lang()])||null;
  }
  function text(lesson,field){
    const ov=overlay();
    const o=ov&&ov.lessons&&ov.lessons[lesson.id];
    return (o&&o[field])||lesson[field];
  }
  function unitText(u,field){
    const ov=overlay();
    const o=ov&&ov.units&&ov.units[u.unit];
    return (o&&o[field])||u[field];
  }

  return {courseTitle:"Aural Lab",units,lessons,byId,text,unitText,
          unitLessons:u=>lessons.filter(l=>l.unit===u)};
})();
if(typeof module!=="undefined") module.exports=AL_CURRICULUM;

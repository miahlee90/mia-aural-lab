/* Aural Lab — Spanish curriculum content overlay.
   Registers under AL_L10N.curriculum.es; AL_CURRICULUM.text()/unitText()
   read it at call time and fall back to English for any missing field, so
   partial translation is always safe. ids, routes, item numbers, skills,
   scoring and progress never vary by language.
   Terminology per the shared glossary (music-education usage). */
window.AL_L10N=window.AL_L10N||{};
AL_L10N.curriculum=AL_L10N.curriculum||{};
AL_L10N.curriculum.es={
  units:{
    1:{title:"Fundamentos de ritmo, altura y notación",
       desc:"Pulso estable, compás, dirección melódica, primer solfeo y escribir lo que escuchas."},
    2:{title:"Mayor, menor, intervalos y transcripción",
       desc:"Armaduras, intervalos, compás compuesto, el modo menor y transcripción real."},
    3:{title:"Solfeo funcional y ritmo avanzado",
       desc:"Patrones de dominante y subdominante, saltos, melodías pentatónicas y síncopa."},
    4:{title:"Canto armónico, escucha y dictado",
       desc:"Canta contra otras voces, reconoce calidades e inversiones de acordes, escribe líneas de bajo."}
  },
  lessons:{
    /* ---------- UNIDAD 1 (completa) ---------- */
    "aural-u1-l1":{title:"Fundamentos de compás y ritmo",
      desc:"Aprende cómo los tiempos estables se agrupan en compases.",
      tip:"Mantén el pulso parejo. Un pulso estable no se acelera ni se frena de repente.",
      letsTry:"Escucha, encuentra el pulso y márcalo con F y J.",
      goal:"Mantener un pulso estable y reconocer grupos básicos de dos, tres y cuatro tiempos."},
    "aural-u1-l2":{title:"Fundamentos de la altura",
      desc:"Escucha si los sonidos suben, bajan o se quedan igual, y conecta lo que oyes con la posición vertical.",
      tip:"Escucha la altura, no el volumen. Un sonido más agudo no es necesariamente un sonido más fuerte.",
      letsTry:"Escucha dos sonidos y di cuál es más agudo.",
      goal:"Comparar alturas como más aguda o más grave, escuchar la dirección de la altura y emparejar un patrón con su forma."},
    "aural-u1-l3":{title:"Grados conjuntos, saltos y notas repetidas",
      desc:"Escucha, canta y dibuja grados conjuntos, saltos y notas repetidas.",
      tip:"Mantén el primer Do en tu mente. Compara cada sonido nuevo con el anterior.",
      letsTry:"Escucha dos notas y di si la segunda avanzó por grado conjunto, saltó o se repitió.",
      goal:"Distinguir grados conjuntos, saltos y notas repetidas; cantar y dibujar patrones cortos de altura."},
    "aural-u1-l4":{title:"Sonidos largos y cortos",
      desc:"Aprende a reconocer, comparar y reproducir sonidos largos y cortos.",
      tip:"Escucha cuándo empieza el sonido y cuándo termina.",
      letsTry:"Escucha dos sonidos y di cuál dura más.",
      goal:"Distinguir y comparar duraciones, reconocer el silencio y reproducir patrones cortos de duración."},
    "aural-u1-l5":{title:"Memoria de patrones cortos",
      desc:"Escucha, recuerda y reproduce patrones musicales cortos.",
      tip:"Guarda el patrón completo en tu mente antes de responder.",
      letsTry:"Escucha un patrón corto y reprodúcelo de memoria."},
    "aural-u1-l6":{title:"Ampliar las destrezas de altura",
      desc:"Canta e identifica grados conjuntos y saltos dentro de las primeras cinco notas de la escala.",
      tip:"El grado conjunto va a la nota vecina; el salto se brinca una.",
      letsTry:"Escucha y elige: ¿grado conjunto, salto o repetición?"},
    "aural-u1-l7":{title:"Escribir ritmo y compás",
      desc:"Escribe ritmos cortos que escuchas usando figuras y silencios.",
      tip:"Encuentra el pulso primero y luego completa cómo se divide cada tiempo.",
      letsTry:"Construye el ritmo que escuchaste, tiempo por tiempo."},
    "aural-u1-l8":{title:"Escribir alturas en el pentagrama",
      desc:"Anota en el pentagrama las alturas que escuchas.",
      tip:"Ánclate en do — cada nota se mide desde casa.",
      letsTry:"Haz clic en el pentagrama para escribir las notas que oíste."},
    "aural-u1-l9":{title:"Escribir altura y ritmo juntos",
      desc:"Toma dictados melódicos cortos: altura y ritmo en una sola respuesta.",
      tip:"Capta primero el esqueleto rítmico y luego cuélgale las alturas.",
      letsTry:"Escucha y construye la melodía en el pentagrama."},
    "aural-u1-l10":{title:"Dictado en frases más largas",
      desc:"Retén frases más largas en la memoria y escríbelas.",
      tip:"Memoriza por fragmentos — cántate la frase antes de escribir.",
      letsTry:"Escucha una frase más larga y escríbela."},

    /* ---------- UNIDAD 2 (títulos; el resto usa el inglés de reserva) ---------- */
    "aural-u2-l1":{title:"Las tonalidades mayores y sus armaduras"},
    "aural-u2-l2":{title:"Ligaduras y el puntillo"},
    "aural-u2-l3":{title:"Número y calidad de los intervalos"},
    "aural-u2-l4":{title:"Vecinos del solfeo — ti y re"},
    "aural-u2-l5":{title:"Tempo"},
    "aural-u2-l6":{title:"Compás compuesto"},
    "aural-u2-l7":{title:"Introducción al modo menor"},
    "aural-u2-l8":{title:"Vecinos cromáticos inferiores"},
    "aural-u2-l9":{title:"Solfeo en menor y préstamo modal"},
    "aural-u2-l10":{title:"Tresillos y dosillos"},
    "aural-u2-l11":{title:"Introducción a la transcripción"},
    "aural-u2-l12":{title:"División del tiempo en cuatro partes (compás simple)"},
    "aural-u2-l13":{title:"Dirigir distintos niveles de pulso"},
    "aural-u2-l14":{title:"Indicaciones de interpretación"},

    /* ---------- UNIDAD 3 (títulos) ---------- */
    "aural-u3-l1":{title:"La tríada de dominante — sol, ti y re"},
    "aural-u3-l2":{title:"Claves de do en tercera y cuarta"},
    "aural-u3-l3":{title:"Saltos de solfeo a fa y la/le"},
    "aural-u3-l4":{title:"Pentatonismo"},
    "aural-u3-l5":{title:"División del tiempo en seis partes (compás compuesto)"},
    "aural-u3-l6":{title:"Signos de repetición en la interpretación"},
    "aural-u3-l7":{title:"La tríada de subdominante — fa, la y do"},
    "aural-u3-l8":{title:"Síncopa"},
    "aural-u3-l9":{title:"La séptima de dominante en contexto melódico"},

    /* ---------- UNIDAD 4 (títulos) ---------- */
    "aural-u4-l1":{title:"Introducción al canto armónico"},
    "aural-u4-l2":{title:"Ritmo armónico y cadencias"},
    "aural-u4-l3":{title:"Música a dos voces"},
    "aural-u4-l4":{title:"Dictado de la línea del bajo"},
    "aural-u4-l5":{title:"Calidades de las tríadas"},
    "aural-u4-l6":{title:"Tríadas en estado fundamental y primera inversión"},
    "aural-u4-l7":{title:"Introducción a la conducción de voces"},
    "aural-u4-l8":{title:"La tríada de sensible — ti, re y fa"},
    "aural-u4-l9":{title:"La tríada de supertónica — re, fa y la/le"},
    "aural-u4-l10":{title:"La tríada de submediante — la/le, do y mi/me"},
    "aural-u4-l11":{title:"La tríada de mediante — mi/me, sol y ti/te"}
  }
};

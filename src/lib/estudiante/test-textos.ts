import type { SeccionTest, Tipologia } from "./types";

/*
  Textos oficiales del instrumento — VERBATIM del Excel de Liliana
  ("CUESTIONARIO TIPOLOGÍA HOLLAND.xlsx", hojas 1–4, celdas compartidas
  0/1/2 · 99/100 · 191/192 · 253/254). Aquí NO se corrige ni resume nada:
  las adapta Liliana si quiere; el front solo presenta.

  ⚠️ Bandera para Liliana ya communicated:
    · La instrucción de PERSONALIDAD (254) es copia textual de la de
      ACTIVIDADES ("pon 1/0…") aunque sus ítems son declaraciones de
      primera persona con escala de 3 niveles.
    · La pregunta 234 ("Mi habilidad en francés es:") sigue verbatim en BD.
    · Título oficial: "PRUEBA RIASEC - Typologia de Holland" (sic).

  El tipo de respuesta por ítem viene de la BD (tipo_respuesta): si algún
  día se decide personalidad en binario, el front se adapta sin cambios.
*/

export const TITULO_INSTRUMENTO = "PRUEBA RIASEC - Typologia de Holland" as const;

export const TITULO_SECCION: Record<SeccionTest, string> = {
  intereses_actividades: "INTERESES Y ACTIVIDADES",
  intereses_ocupaciones: "INTERESES Y OCUPACIONES",
  aptitudes: "APTITUDES",
  personalidad: "PERSONALIDAD",
};

export const INSTRUCCION_SECCION: Record<SeccionTest, string> = {  intereses_actividades:
    "Aquí hay una lista de actividades. Pon el número 1 (uno) en las casillas " +
    "que se refieren a las actividades que te gustan o te gustaría hacer. " +
    "Es importante no poner un 0 (cero) si NO te gusta o no te interesa la " +
    "actividad. Al rellenar este apartado, considera que tienes las " +
    "habilidades, los conocimientos y la formación necesarios para realizar " +
    "estas actividades. Ten en cuenta sólo tus gustos.",
  intereses_ocupaciones:
    "Aquí hay una lista de actividades. Pon el número 1 (uno) en las casillas " +
    "que se refieren a las actividades que te gustan o te gustaría hacer. " +
    "Es importante no poner un 0 (cero) si NO te gusta o no te interesa la " +
    "actividad. Al rellenar este apartado, considera que tienes las " +
    "habilidades, los conocimientos y la formación necesarios para realizar " +
    "estas actividades. Ten en cuenta sólo tus gustos.",
  aptitudes:
    "Esta es una lista de habilidades, destrezas y talentos que están " +
    "relacionados con las ocupaciones. Evalúese lo más objetivamente posible " +
    "escribiendo en la columna de la derecha el número que corresponde al " +
    "nivel de aptitud que cree poseer: Débil = 1, Medio = 2, Fuerte = 3. " +
    "No te subestimes ni te sobreestimes. Sé sincero contigo mismo y evalúa " +
    "tu capacidad real.",
  // verbatim del Excel — es la copia de actividades; la mencionamos igual
  // y el desajuste visual ya está en la bandera para Liliana.
  personalidad:
    "Aquí hay una lista de actividades. Pon el número 1 (uno) en las casillas " +
    "que se refieren a las actividades que te gustan o te gustaría hacer. " +
    "Es importante no poner un 0 (cero) si NO te gusta o no te interesa la " +
    "actividad. Al rellenar este apartado, considera que tienes las " +
    "habilidades, los conocimientos y la formación necesarios para realizar " +
    "estas actividades. Ten en cuenta sólo tus gustos.",
};

/*
  Resumen corto de cada sección (lo que ve la estudiante al entrar a la etapa).
  Lenguaje llano para jóvenes; la instrucción oficial verbatim del Excel queda
  arriba en INSTRUCCION_SECCION por si Liliana prefiere mostrarla.
*/
export const RESUMEN_SECCION: Record<SeccionTest, string> = {
  intereses_actividades:
    "Pon «Me gusta» en las actividades que te gustaría hacer y «No me gusta» en las que no. Piensa solo en tus gustos.",
  intereses_ocupaciones:
    "Pon «Me gusta» en los trabajos que te llaman la atención y «No me gusta» en los que no. Imagina que sí podrías hacerlos.",
  aptitudes:
    "Califica qué tan bien crees que lo haces: Débil, Medio o Fuerte. Sé sincero contigo mismo.",
  personalidad:
    "Lee cada frase y marca cuánto se parece a ti: Como yo, Algo como yo o No es como yo.",
};

/** Opciones visuales por tipo de respuesta (el valor va a respuestas_test_holland). */
export const OPCIONES_BINARIO: Array<{ valor: number; texto: string }> = [
  { valor: 1, texto: "Me gusta" },
  { valor: 0, texto: "No me gusta" },
];

/** Escala de aptitudes — verbatim "Débil = 1, Medio = 2, Fuerte = 3". */
export const OPCIONES_APTITUD: Array<{ valor: number; texto: string }> = [
  { valor: 1, texto: "Débil" },
  { valor: 2, texto: "Medio" },
  { valor: 3, texto: "Fuerte" },
];

/**
 * Escala de personalidad: el Excel no trae etiquetas propias (su instrucción
 * es una copia de actividades). Usamos la formulación estándar de la versión
 * francesa del instrumento ("Comme moi") en su equivalente en español.
 */
export const OPCIONES_PERSONALIDAD: Array<{ valor: number; texto: string }> = [
  { valor: 3, texto: "Como yo" },
  { valor: 2, texto: "Algo como yo" },
  { valor: 1, texto: "No es como yo" },
];

export const ORDEN_SECCIONES: SeccionTest[] = [
  "intereses_actividades",
  "intereses_ocupaciones",
  "aptitudes",
  "personalidad",
];

/** Nombres largos de cada tipología (para la pantalla de resultado). */
export const NOMBRE_TIPOLOGIA: Record<Tipologia, string> = {
  R: "Realista",
  I: "Investigativo",
  A: "Artístico",
  S: "Social",
  E: "Emprendedor",
  C: "Convencional",
};

/*
  Resúmenes de los perfiles de "Descripción general de los perfiles",
  presentados en segunda persona para facilitar la reflexión.
*/
export const DESCRIPCION_TIPOLOGIA: Record<Tipologia, string> = {
  R: "Eres una persona práctica, estable y tenaz. Prefieres actuar y resolver problemas concretos; te interesa aprender y trabajar con máquinas, materiales y herramientas, y puedes disfrutar las actividades al aire libre. Te motiva crear cosas útiles y tangibles, y aportas estabilidad y experiencia práctica. Sueles preferir instrucciones claras, métodos conocidos y trabajar de manera independiente. En ocasiones, puede costarte comunicar lo que esperas, adaptarte a cambios o compartir tus problemas; practicar la comunicación y considerar nuevas formas de hacer las cosas puede ayudarte.",
  I: "Eres una persona curiosa, reservada e independiente, que disfruta hacer preguntas, analizar y entender el porqué y el cómo de las cosas. Te atraen los retos intelectuales y buscar soluciones; puedes aportar ideas, nuevas perspectivas y pensamiento estratégico. Valoras la autonomía y la flexibilidad, y te motivan el aprendizaje y los descubrimientos. A veces puedes quedarte en las ideas sin llevarlas a la práctica, pasar por alto detalles o comunicar tus propuestas de forma poco clara. Definir objetivos, colaborar y explicar tus ideas puede ayudarte a convertirlas en resultados.",
  A: "Eres una persona intuitiva, expresiva y espontánea, que disfruta usar sus ideas y habilidades visuales o verbales para crear algo original. Aportas creatividad, entusiasmo y nuevas maneras de ver las cosas; valoras la libertad y que se reconozca tu aporte. Te sientes más a gusto en ambientes flexibles y puedes preferir crear por tu cuenta. A veces las tareas rutinarias, los detalles o los proyectos largos pueden impacientarte. Organizar tus ideas, planificar y comunicar tu trabajo con claridad puede ayudarte a llevar tus creaciones hasta el final.",
  S: "Eres una persona amable, generosa e idealista, atenta a los sentimientos y necesidades de quienes te rodean. Te gusta escuchar, enseñar, ayudar a otros a mejorar y colaborar para resolver problemas o conflictos. Aportas empatía y facilidad para comprender a las personas; te motiva que todos participen y trabajen en equipo. A veces puedes poner las necesidades de los demás por encima de las tuyas o evitar decisiones difíciles. Practicar la asertividad, cuidar tus propios límites y considerar también las tareas y objetivos del grupo puede ayudarte.",
  E: "Eres una persona enérgica, ambiciosa y decidida, con facilidad para tomar la iniciativa, persuadir y organizar. Te motivan los retos, la competencia y la posibilidad de liderar proyectos; puedes aportar dinamismo, optimismo y determinación para alcanzar resultados. Sueles preferir analizar rápidamente y pasar a la acción, y te atraen los ambientes dinámicos donde puedes asumir responsabilidades. A veces puedes actuar con prisa, impacientarte o dejar de lado los detalles y las opiniones de otros. Escuchar, pensar en las consecuencias y planificar antes de decidir puede fortalecer tu liderazgo.",
  C: "Eres una persona constante, organizada y precisa, que valora el orden, la claridad y la estabilidad. Te sientes a gusto con los datos, las tareas bien definidas, los métodos probados y las instrucciones concretas. Aportas eficacia, atención al detalle y confiabilidad; las demás personas pueden contar contigo para completar las tareas a tiempo. Los cambios o las formas nuevas de hacer las cosas pueden tomarte tiempo, especialmente si no tienes orientación suficiente. Mantenerte abierto a nuevas ideas y darte espacio para adaptarte puede complementar tus fortalezas.",
};

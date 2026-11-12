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
  Descripciones de cada tipología para la pantalla de resultado (el estudiante
  lee la de cada una de sus 3 tipologías y luego responde si se reconoce).

  ⚠️ BORRADOR propio (es-CO, para jóvenes) mientras Liliana entrega las
  descripciones oficiales del instrumento. Están redactadas en segunda
  persona a propósito: el estudiante debe poder decir "sí, me reconozco".
  Para cambiarlas solo se edita este archivo (viajan con el front, no con la BD).
*/
export const DESCRIPCION_TIPOLOGIA: Record<Tipologia, string> = {
  R: "Eres práctico y de manos a la obra: prefieres hacer y construir antes que solo hablar o mirar. Te va bien con herramientas, máquinas, plantas, animales o el deporte, y disfrutas cuando ves un resultado concreto de lo que hiciste. Aprendes mejor experimentando y te sientes cómodo con actividades físicas y retos que se tocan con las manos.",
  I: "Eres curioso y analítico: te gusta preguntar el porqué de las cosas, observar, investigar y resolver misterios. Disfrutas los retos mentales, la ciencia y entender cómo funciona el mundo que te rodea. Prefieres pensar por tu cuenta y te va bien trabajar con ideas, datos y pruebas antes que con mucha gente alrededor.",
  A: "Eres creativo y con imaginación: tienes tu propio estilo y te gusta expresarte con formas nuevas, ya sea con arte, música, escritura, video o diseño. Disfrutas los espacios libres donde puedes inventar, y prefieres pocas reglas: las ideas diferentes te fascinan y las tareas repetitivas te aburren.",
  S: "Eres una persona que se preocupa por los demás: te gusta acompañar, escuchar, enseñar y ayudar a que otros crezcan. Disfrutas trabajando con personas, en equipo, y te mueve sentir que lo que haces le sirve a alguien. Te identifican la empatía, la paciencia y la capacidad de ponerte en el lugar del otro.",
  E: "Te gusta liderar, proponer y convencer: disfrutas organizar proyectos, tomar decisiones y hacerte oír. Los retos y las metas te motivan, y sueñas con crear cosas propias como negocios, proyectos o equipos. Eres seguro de ti, te mueves bien con la gente y no te asusta hablar en público.",
  C: "Eres ordenado y detallista: te gustan las cosas claras, organizadas y bien hechas. Manejas bien los datos, los números, los planes y las reglas, y disfrutas cuando todo funciona con estructura. Tu constancia y tu cuidado con el detalle son tu superpoder: la gente confía en ti porque cumples.",
};

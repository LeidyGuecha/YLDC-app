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

export const INSTRUCCION_SECCION: Record<SeccionTest, string> = {
  intereses_actividades:
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

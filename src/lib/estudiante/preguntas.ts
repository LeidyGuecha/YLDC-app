import type { FaseSesion } from "./types";

/*
  Batería piloto de preguntas (coincide 1:1 con supabase/seed.sql §5).
  Los IDs son los UUID fijos del seed: guardar contra la BD real funciona
  sin configuración adicional. Cuando llegue el calendario de talleres de
  Liliana, este catálogo se migra a lectura dinámica de preguntas_actividad.
*/

export type TipoPreguntaFase =
  | "seleccion"
  | "texto"
  | "checklist"
  | "frase_a_completar";

export interface PreguntaOpcion {
  id: string;
  texto: string;
  icono?: "soleado" | "nublado" | "lluvioso" | "tormenta";
}

export interface PreguntaFase {
  id: string;
  tipo: TipoPreguntaFase;
  enunciado: string;
  minCaracteres?: number;
  opciones?: PreguntaOpcion[];
  /** Frase base que el estudiante completa (tipo frase_a_completar). */
  frase?: { antes: string; despues: string };
}

const OPCIONES_CLIMA: PreguntaOpcion[] = [
  { id: "soleado", texto: "Soleado", icono: "soleado" },
  { id: "nublado", texto: "Nublado", icono: "nublado" },
  { id: "lluvioso", texto: "Lluvioso", icono: "lluvioso" },
  { id: "tormenta", texto: "Tormenta", icono: "tormenta" },
];

export const BATERIA_FASES: Record<FaseSesion, PreguntaFase[]> = {
  como_vengo: [
    {
      id: "22222222-0000-0000-0000-000000000001",
      tipo: "seleccion",
      enunciado: "¿Cómo vienes hoy?",
      opciones: OPCIONES_CLIMA,
    },
    {
      id: "22222222-0000-0000-0000-000000000002",
      tipo: "texto",
      enunciado:
        "Escribe sobre cómo vienes: ¿qué está pasando en tu vida en este momento?",
      minCaracteres: 200,
    },
  ],
  actividad: [
    {
      id: "22222222-0000-0000-0000-000000000003",
      tipo: "checklist",
      enunciado: "Marca las actividades que hiciste en la sesión",
      opciones: [
        { id: "clima", texto: "Marcar mi clima" },
        { id: "historia", texto: "Escuchar la historia de otro compañero" },
        { id: "reflexion", texto: "Escribir mi reflexión" },
        { id: "consejo", texto: "Enviar o recibir un consejo" },
      ],
    },
    {
      id: "22222222-0000-0000-0000-000000000004",
      tipo: "frase_a_completar",
      enunciado: "Completa la frase",
      frase: { antes: "Hoy me sorprendió que", despues: "" },
    },
  ],
  como_voy: [
    {
      id: "22222222-0000-0000-0000-000000000005",
      tipo: "texto",
      enunciado: "¿Cómo voy? ¿Qué te llevaste de la sesión?",
      minCaracteres: 200,
    },
  ],
};

export const ETIQUETA_FASE: Record<FaseSesion, string> = {
  como_vengo: "Cómo vengo",
  actividad: "Actividad",
  como_voy: "¿Cómo voy?",
};

export const ORDEN_FASES: FaseSesion[] = ["como_vengo", "actividad", "como_voy"];

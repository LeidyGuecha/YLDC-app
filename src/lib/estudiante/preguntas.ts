import type { FaseSesion } from "./types";

/*
  Batería de la sesión 4 — Tipología de Holland (flujo narrado por Leidy,
  validado con el PDF "INFORMACIÓN TALLERES"). Coincide con supabase/seed.sql §5
  y con la migración 2026-11-12-sesion-4-holland.sql.

  Los IDs son UUID fijos del seed: guardar contra la BD real funciona sin
  configuración adicional. Los ids 0006/0007 ya pertenecen al taller YC-01
  (Sesión 1), así que las preguntas nuevas de YC-04 van de 0008 a 000d.

  Cuando llegue el calendario completo de talleres, este catálogo se migra
  a lectura dinámica de preguntas_actividad.
*/

export type TipoPreguntaFase =
  | "seleccion"
  | "texto"
  | "checklist"
  | "frase_a_completar";

export interface PreguntaOpcion {
  id: string;
  texto: string;
  icono?: "soleado" | "parcial" | "nublado" | "lluvioso" | "tormenta";
}

export interface PreguntaFase {
  id: string;
  tipo: TipoPreguntaFase;
  enunciado: string;
  minCaracteres?: number;
  /** La pregunta se puede dejar vacía (ej. el porqué del clima). */
  opcional?: boolean;
  opciones?: PreguntaOpcion[];
  /** Frase base que el estudiante completa (tipo frase_a_completar). */
  frase?: { antes: string; despues: string };
}

// 5 climas del PDF de Liliana ("soleado, nublado, lluvioso, tormenta,
// parcialmente soleado").
const OPCIONES_CLIMA: PreguntaOpcion[] = [
  { id: "soleado", texto: "Soleado", icono: "soleado" },
  { id: "parcial", texto: "Parcialmente soleado", icono: "parcial" },
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
      enunciado: "¿Por qué escogiste este clima?",
      opcional: true,
    },
  ],
  actividad: [
    {
      id: "22222222-0000-0000-0000-000000000008",
      tipo: "texto",
      enunciado:
        "Cuando lees la descripción del perfil de tu personalidad, ¿te reconoces en ella? ¿Por qué?",
      minCaracteres: 30,
    },
    {
      id: "22222222-0000-0000-0000-000000000009",
      tipo: "texto",
      enunciado: "¿Con qué puntos de la descripción estás de acuerdo?",
      minCaracteres: 30,
    },
    {
      id: "22222222-0000-0000-0000-00000000000a",
      tipo: "texto",
      enunciado: "¿Con qué puntos no estás de acuerdo?",
      minCaracteres: 30,
    },
    {
      id: "22222222-0000-0000-0000-00000000000b",
      tipo: "texto",
      enunciado:
        "¿Coincide la descripción de tu perfil con la carrera que quieres estudiar? ¿Por qué?",
      minCaracteres: 30,
    },
  ],
  como_voy: [
    {
      id: "22222222-0000-0000-0000-00000000000c",
      tipo: "texto",
      enunciado:
        "Escribe una característica personal asociada a tu tipología que quieras potenciar.",
      minCaracteres: 30,
    },
    {
      id: "22222222-0000-0000-0000-00000000000d",
      tipo: "texto",
      enunciado:
        "Escribe una característica que quieras cambiar o mejorar para tu desarrollo personal y vocacional.",
      minCaracteres: 30,
    },
  ],
};

export const ETIQUETA_FASE: Record<FaseSesion, string> = {
  como_vengo: "Cómo vengo",
  actividad: "Actividad",
  como_voy: "¿Cómo voy?",
};

export const ORDEN_FASES: FaseSesion[] = ["como_vengo", "actividad", "como_voy"];

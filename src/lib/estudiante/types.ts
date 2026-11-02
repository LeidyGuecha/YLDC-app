/* Tipos compartidos del flujo del estudiante (pantallas 1.1–1.10). */

export type FaseSesion = "como_vengo" | "actividad" | "como_voy";
export type EstadoSesion = "abierta" | "cerrada_pendiente" | "completada";

export interface InfoSesion {
  sesionId: string;
  estado: EstadoSesion;
  faseActual: FaseSesion;
  taller: string;
  numeroSesion: number;
  curso: string;
}

/** Contexto que vive en localStorage entre /estudiante y /estudiante/sesion. */
export interface ContextoEstudiante {
  pin: string;
  estudianteId: string;
  sesionId: string;
  yaRegistrado: boolean;
  nombre: string;
  taller: string;
  numeroSesion: number;
  curso: string;
}

/** Fila de la tabla `respuestas` (lo que devuelve fn_listar_mis_respuestas). */
export interface FilaRespuesta {
  tipo: FaseSesion;
  pregunta_id: string | null;
  contenido_texto: string | null;
  contenido_seleccion_json: string | null;
  contenido_checklist_json: string | null;
  fecha_envio: string;
}

export type CodigoErrorEstudiante =
  | "SIN_CONFIGURACION"
  | "PIN_INVALIDO"
  | "SESION_NO_ABIERTA"
  | "NOMBRE_AMBIGUO"
  | "FALTAN_PREGUNTAS"
  | "RED"
  | "OTRO";

/** Error con código conocido de dominio (la UI lo mapea a mensaje amable). */
export class ErrorEstudiante extends Error {
  code: CodigoErrorEstudiante;
  constructor(code: CodigoErrorEstudiante, mensaje?: string) {
    super(mensaje ?? code);
    this.code = code;
  }
}

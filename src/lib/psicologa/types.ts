/* Tipos del panel de la psicóloga (mockups 3.x). */

export interface PerfilPsicologa {
  /** ROW id de psicologas (lo que espera comentarios_individuales_psicologa). */
  id: string;
  nombreCompleto: string;
  correo: string;
  /** null = sirve en todos los colegios (caso piloto). */
  colegioId: string | null;
  colegioNombre: string | null;
  activa: boolean;
}

export interface CursoPsicologa {
  id: string;
  colegioId: string | null;
  etiqueta: string; // "11°-001"
  anio: number;
  colegioNombre: string;
  activo: boolean;
}

export interface EstudiantePsicologa {
  id: string;
  nombreCompleto: string;
  ti: string | null;
  consentimiento: boolean;
  activo: boolean;
  origen: "excel" | "registro_directo";
}

export interface SesionPsicologa {
  id: string;
  tallerTitulo: string;
  numeroSesion: number;
  pin: string;
  estado: "abierta" | "cerrada_pendiente" | "completada";
  faseActual: "como_vengo" | "actividad" | "como_voy";
  creadoEn: string;
}

export interface ResultadoPsicologa {
  estudianteId: string;
  codigo: string;
  tipologias: [string, string, string];
  puntajes: Record<"R" | "I" | "A" | "S" | "E" | "C", number>;
  fechaCalculo: string;
}

export interface ComentarioIndividualPsicologa {
  id: string;
  estudianteId: string;
  psicologaId: string;
  /** Nombre de la autora (embed de la consulta; para reportes). */
  psicologaNombre: string | null;
  comentario: string;
  fecha: string;
  editadoEn: string | null;
}

/** Comentario grupal del facilitador en una sesión (historial/reportes). */
export interface ComentarioGrupalPsicologa {
  sesionId: string;
  facilitadorNombre: string;
  comentario: string;
  fecha: string;
}

/** Una respuesta de fase del estudiante (historial). */
export interface RespuestaPsicologa {
  sesionId: string;
  tipo: "como_vengo" | "actividad" | "como_voy";
  preguntaId: string | null;
  texto: string | null;
  seleccion: string | null;
  checklist: string[] | null;
  fecha: string;
}

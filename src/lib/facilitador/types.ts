/* Tipos del panel del facilitador (pantallas 2.x). */

export interface PerfilFacilitador {
  /** ROW id de facilitadores (lo que esperan sesiones/comentarios). */
  id: string;
  nombreCompleto: string;
  correo: string;
  activo: boolean;
}

export type EstadoSesionPanel = "abierta" | "cerrada_pendiente" | "completada";
export type FaseSesionPanel = "como_vengo" | "actividad" | "como_voy";

export interface SesionPanel {
  id: string;
  tallerId: string;
  cursoId: string;
  tallerCodigo: string;
  tallerTitulo: string;
  numeroSesion: number;
  cursoEtiqueta: string;
  colegioNombre: string;
  leadId: string;
  coFacilitadoresIds: string[];
  pin: string;
  estado: EstadoSesionPanel;
  faseActual: FaseSesionPanel;
  fechaInicio: string | null;
  fechaCierre: string | null;
  creadoEn: string;
}

export interface FacilitadorBreve {
  id: string;
  nombreCompleto: string;
}

export interface TallerBreve {
  id: string;
  codigo: string;
  titulo: string;
  numeroSesion: number;
}

export interface CursoBreve {
  id: string;
  etiqueta: string; // "11°-001"
  colegioNombre: string;
}

export interface EstudiantePanel {
  id: string;
  nombreCompleto: string;
  ti: string;
  activo: boolean;
}

export interface FilaRespuestaPanel {
  id: string;
  estudianteId: string;
  tipo: FaseSesionPanel;
  preguntaId: string | null;
  contenidoTexto: string | null;
  seleccionJson: string | null;
  checklistJson: string | null;
  fechaEnvio: string;
}

export interface ProgresoTestPanel {
  estudianteId: string;
  respondidas: number;
}

export interface ResultadoPanel {
  estudianteId: string;
  codigoHolland: string;
}

export interface ComentarioGrupalPanel {
  id: string;
  facilitadorId: string;
  comentario: string;
  fecha: string;
  editadoEn: string | null;
}

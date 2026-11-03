/* Tipos del panel del admin (mockups 4.x). */

export interface PerfilAdmin {
  /** ROW id de admins. */
  id: string;
  nombreCompleto: string;
  correo: string;
  activo: boolean;
}

export interface CuentaFacilitadora {
  id: string;
  nombreCompleto: string;
  correo: string;
  activo: boolean;
  autovinculada: boolean; // auth_id definido (paso 5 del README)
}

export interface CuentaPsicologa {
  id: string;
  nombreCompleto: string;
  correo: string;
  colegioNombre: string | null;
  activa: boolean;
  autovinculada: boolean;
}

export interface CuentaAdmin {
  id: string;
  nombreCompleto: string;
  correo: string;
  activo: boolean;
  autovinculada: boolean;
}

export interface ColegioAdmin {
  id: string;
  nombre: string;
  localidad: string;
}

export interface CursoAdmin {
  id: string;
  etiqueta: string; // "11°-001"
  anio: number;
  activo: boolean;
  colegioNombre: string;
}

export interface EstudianteDeCurso {
  id: string;
  nombreCompleto: string;
  ti: string | null;
  activo: boolean;
  origen: "excel" | "registro_directo";
}

export interface RegistroAudit {
  id: string;
  fecha: string;
  accion: string;
  entidad: string;
  entidadId: string | null;
  detalles: string | null; // jsonb serializado (descripción amable)
  adminNombre: string;
}

export interface ResultadoCarga {
  creados: number;
  omitidos: number;
}

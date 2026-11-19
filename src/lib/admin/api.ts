import { getSupabase, type SupabaseClient } from "@/lib/supabase/client";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { ErrorPanelo } from "@/lib/facilitador/auth"; // vocabulario de error compartido
import type {
  CuentaAdmin,
  CuentaFacilitadora,
  CuentaPsicologa,
  ColegioAdmin,
  CursoAdmin,
  EstudianteDeCurso,
  RegistroAudit,
  ResultadoCarga,
} from "./types";

/*
  Datos del panel del admin. Todo corre contra la BD real vía el cliente
  autenticado: la RLS solo deja al admin tocar cuentas, cursos y audit_log.
  Cada acción relevante se registra en audit_log (pantalla 4.8).
*/

function asegurarSB(): SupabaseClient {
  if (!supabaseConfigurado) throw new ErrorPanelo("SIN_CONFIGURACION");
  return getSupabase()!;
}

function etiquetaCurso(grado: number, id: string): string {
  return `${grado}°-${id.slice(-3)}`; // igual que fn_sesion_por_pin
}

/* ───────────────── cuentas (activar / desactivar, sin eliminar) ───────────────── */

export async function listarFacilitadoras(): Promise<CuentaFacilitadora[]> {
  const sb = asegurarSB();
  const { data, error } = await sb
    .from("facilitadores")
    .select("id,nombre_completo,correo,activo,auth_id")
    .order("nombre_completo");
  if (error) throw new ErrorPanelo("OTRO", error.message);
  return (data ?? []).map((f) => {
    const r = f as unknown as {
      id: string;
      nombre_completo: string;
      correo: string;
      activo: boolean;
      auth_id: string | null;
    };
    return {
      id: r.id,
      nombreCompleto: r.nombre_completo,
      correo: r.correo,
      activo: r.activo,
      autovinculada: r.auth_id !== null,
    };
  });
}

export async function listarPsicologas(): Promise<CuentaPsicologa[]> {
  const sb = asegurarSB();
  const { data, error } = await sb
    .from("psicologas")
    .select("id,nombre_completo,correo,activa,auth_id,colegio:colegios(nombre)")
    .order("nombre_completo");
  if (error) throw new ErrorPanelo("OTRO", error.message);
  return (data ?? []).map((p) => {
    const r = p as unknown as {
      id: string;
      nombre_completo: string;
      correo: string;
      activa: boolean;
      auth_id: string | null;
      colegio: { nombre?: string } | null;
    };
    return {
      id: r.id,
      nombreCompleto: r.nombre_completo,
      correo: r.correo,
      colegioNombre: r.colegio?.nombre ?? null,
      activa: r.activa,
      autovinculada: r.auth_id !== null,
    };
  });
}

export async function listarAdmins(): Promise<CuentaAdmin[]> {
  const sb = asegurarSB();
  const { data, error } = await sb
    .from("admins")
    .select("id,nombre_completo,correo,activo,auth_id")
    .order("nombre_completo");
  if (error) throw new ErrorPanelo("OTRO", error.message);
  return (data ?? []).map((a) => {
    const r = a as unknown as {
      id: string;
      nombre_completo: string;
      correo: string;
      activo: boolean;
      auth_id: string | null;
    };
    return {
      id: r.id,
      nombreCompleto: r.nombre_completo,
      correo: r.correo,
      activo: r.activo,
      autovinculada: r.auth_id !== null,
    };
  });
}

export async function cambiarCuenta(
  entidad: "facilitadores" | "psicologas" | "admins",
  id: string,
  activo: boolean,
): Promise<void> {
  const sb = asegurarSB();
  // psicologas usa `activa`, facilitadores/admins `activo`
  const parche =
    entidad === "psicologas" ? { activa: activo } : { activo: activo };
  const { error } = await sb.from(entidad).update(parche).eq("id", id);
  if (error) throw new ErrorPanelo("OTRO", error.message);

  await registrarAccion(
    await adminFilaId(),
    activo ? "activar" : "desactivar",
    entidad,
    id,
  );
}

export async function crearCuenta(
  entidad: "facilitadores" | "psicologas" | "admins",
  nombreCompleto: string,
  correo: string,
): Promise<void> {
  const sb = asegurarSB();
  const fila: Record<string, string> = {
    nombre_completo: nombreCompleto.trim(),
    correo: correo.trim().toLowerCase(),
  };
  const { error } = await sb.from(entidad).insert(fila);
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("duplicate key") && m.includes("correo")) {
      throw new ErrorPanelo(
        "OTRO",
        "Ya existe una cuenta con ese correo.",
      );
    }
    throw new ErrorPanelo("OTRO", error.message);
  }
  await registrarAccion(await adminFilaId(), "crear", entidad, null);
}

/* ───────────────── cursos y carga de estudiantes (Excel) ───────────────── */

export async function listarColegios(): Promise<ColegioAdmin[]> {
  const sb = asegurarSB();
  const { data, error } = await sb
    .from("colegios")
    .select("id,nombre,localidad")
    .order("nombre");
  if (error) throw new ErrorPanelo("OTRO", error.message);
  return data ?? [];
}

export async function listarCursosAdmin(): Promise<CursoAdmin[]> {
  const sb = asegurarSB();
  const { data, error } = await sb
    .from("cursos")
    .select("id,grado,anio,activo,colegio:colegios(nombre)")
    .order("anio", { ascending: false })
    .order("grado");
  if (error) throw new ErrorPanelo("OTRO", error.message);
  return (data ?? []).map((c) => {
    const r = c as unknown as {
      id: string;
      grado: number;
      anio: number;
      activo: boolean;
      colegio: { nombre?: string } | null;
    };
    return {
      id: r.id,
      etiqueta: etiquetaCurso(r.grado, r.id),
      anio: r.anio,
      activo: r.activo,
      colegioNombre: r.colegio?.nombre ?? "",
    };
  });
}

/** Estudiantes ya cargados en el curso (verificación tras la carga del lote). */
export async function listarEstudiantesDeCurso(
  cursoId: string,
): Promise<EstudianteDeCurso[]> {
  const sb = asegurarSB();
  const { data, error } = await sb
    .from("estudiantes")
    .select("id,nombre_completo,ti,activo,origen")
    .eq("curso_id", cursoId)
    .order("nombre_completo");
  if (error) throw new ErrorPanelo("OTRO", error.message);
  return (data ?? []).map((e) => {
    const r = e as unknown as {
      id: string;
      nombre_completo: string;
      ti: string | null;
      activo: boolean;
      origen: "excel" | "registro_directo";
    };
    return {
      id: r.id,
      nombreCompleto: r.nombre_completo,
      ti: r.ti,
      activo: r.activo,
      origen: r.origen,
    };
  });
}

export async function crearCurso(opciones: {
  colegioId: string;
  grado: number;
  anio: number;
}): Promise<CursoAdmin> {
  const sb = asegurarSB();
  const { data, error } = await sb
    .from("cursos")
    .insert({
      colegio_id: opciones.colegioId,
      grado: opciones.grado,
      anio: opciones.anio,
    })
    .select("id,grado,anio,activo,colegio:colegios(nombre)")
    .single();
  if (error) throw new ErrorPanelo("OTRO", error.message);
  const r = data as unknown as {
    id: string;
    grado: number;
    anio: number;
    activo: boolean;
    colegio: { nombre?: string } | null;
  };
  await registrarAccion(await adminFilaId(), "crear", "cursos", r.id);
  return {
    id: r.id,
    etiqueta: etiquetaCurso(r.grado, r.id),
    anio: r.anio,
    activo: r.activo,
    colegioNombre: r.colegio?.nombre ?? "",
  };
}

/**
 * Carga masiva de estudiantes (equivalente a la carga del Excel, brief §13):
 * filas = [{nombreCompleto, ti}]. Omite duplicados dentro del propio lote
 * y los que ya existan en el curso con el mismo TI o nombre.
 */
export async function cargarEstudiantes(
  cursoId: string,
  filas: { nombreCompleto: string; ti: string | null }[],
): Promise<ResultadoCarga> {
  const sb = asegurarSB();
  const { data: existentes, error: errorLista } = await sb
    .from("estudiantes")
    .select("nombre_completo,ti")
    .eq("curso_id", cursoId);
  if (errorLista) throw new ErrorPanelo("OTRO", errorLista.message);
  const yaEstan = new Set<string>(
    (existentes ?? []).map((e) => {
      const r = e as unknown as { nombre_completo: string; ti: string | null };
      return `${r.nombre_completo.trim().toLowerCase()}|${(r.ti ?? "").trim()}`;
    }),
  );

  const porInsertar = new Map<string, { nombreCompleto: string; ti: string | null }>();
  let omitidos = 0;
  for (const f of filas) {
    const clave = `${f.nombreCompleto.trim().toLowerCase()}|${(f.ti ?? "").trim()}`;
    if (yaEstan.has(clave) || porInsertar.has(clave)) {
      omitidos++;
      continue;
    }
    porInsertar.set(clave, f);
  }

  if (porInsertar.size > 0) {
    const { error } = await sb.from("estudiantes").insert(
      [...porInsertar.values()].map((f) => ({
        curso_id: cursoId,
        nombre_completo: f.nombreCompleto.trim(),
        ti: f.ti && f.ti.trim() !== "" ? f.ti.trim() : null,
        origen: "excel",
      })),
    );
    if (error) throw new ErrorPanelo("OTRO", error.message);
  }

  await registrarAccion(
    await adminFilaId(),
    "cargar_excel",
    "estudiantes",
    cursoId,
    `${porInsertar.size} estudiantes nuevos, ${omitidos} duplicados omitidos`,
  );
  return { creados: porInsertar.size, omitidos };
}

/* ───────────────── historial de actividad (pantalla 4.8) ───────────────── */

export async function listarAudit(limite = 120): Promise<RegistroAudit[]> {
  const sb = asegurarSB();
  const { data, error } = await sb
    .from("audit_log")
    .select("id,fecha,accion,entidad,entidad_id,detalles,admin:admins(nombre_completo)")
    .order("fecha", { ascending: false })
    .limit(limite);
  if (error) throw new ErrorPanelo("OTRO", error.message);
  return (data ?? []).map((a) => {
    const r = a as unknown as {
      id: string;
      fecha: string;
      accion: string;
      entidad: string;
      entidad_id: string | null;
      detalles: unknown;
      admin: { nombre_completo?: string } | null;
    };
    return {
      id: r.id,
      fecha: r.fecha,
      accion: r.accion,
      entidad: r.entidad,
      entidadId: r.entidad_id,
      detalles: describirDetalles(r.detalles),
      adminNombre: r.admin?.nombre_completo ?? "Admin",
    };
  });
}

/** Etiquetas legibles para las claves que aparecen en audit_log.detalles. */
const ETIQUETA_CAMPO: Record<string, string> = {
  nombre: "nombre",
  nombre_completo: "nombre",
  localidad: "localidad",
  archivo: "archivo",
  creados: "creados",
  omitidos: "omitidos",
  coincidencias: "coincidencias",
  correo: "correo",
  grado: "grado",
  anio: "año",
  activo: "activo",
  activa: "activa",
};

/** Valor de un campo como texto corto (sin UUIDs ni objetos crudos). */
function valorLegible(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "boolean") return v ? "sí" : "no";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") {
    // un UUID suelto no le dice nada al admin
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v))
      return null;
    return v;
  }
  if (Array.isArray(v)) {
    const partes = v.map(valorLegible).filter(Boolean);
    return partes.length ? partes.join(", ") : null;
  }
  if (typeof v === "object") return describirCampos(v as Record<string, unknown>);
  return null;
}

/** "nombre: X · localidad: Y" a partir de un objeto plano. */
function describirCampos(obj: Record<string, unknown>): string | null {
  const partes: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (k.endsWith("_id") || k === "id") continue;
    const val = valorLegible(v);
    if (val === null) continue;
    partes.push(`${ETIQUETA_CAMPO[k] ?? k.replace(/_/g, " ")}: ${val}`);
  }
  return partes.length ? partes.join(" · ") : null;
}

/**
 * Convierte el jsonb de audit_log.detalles en una frase legible.
 * Formatos conocidos: {texto} (escrito por la app) y {antes, despues}
 * (seed / cambios). Antes se hacía String(obj) → "[object Object]".
 */
function describirDetalles(d: unknown): string | null {
  if (d === null || d === undefined) return null;
  if (typeof d !== "object" || Array.isArray(d)) return valorLegible(d);
  const o = d as Record<string, unknown>;
  if (typeof o.texto === "string") return o.texto || null;
  const antes =
    o.antes && typeof o.antes === "object"
      ? describirCampos(o.antes as Record<string, unknown>)
      : null;
  const despues =
    o.despues && typeof o.despues === "object"
      ? describirCampos(o.despues as Record<string, unknown>)
      : null;
  if (antes && despues) return `antes: ${antes} → ahora: ${despues}`;
  if (despues) return despues;
  if (antes) return `antes: ${antes}`;
  return describirCampos(o);
}

/** Registra la acción del admin en el audit_log (pantalla 4.8). */
export async function registrarAccion(
  adminId: string,
  accion: string,
  entidad: string,
  entidadId: string | null,
  detalles?: string,
): Promise<void> {
  const sb = asegurarSB();
  const { error } = await sb.from("audit_log").insert({
    admin_id: adminId,
    accion,
    entidad,
    entidad_id: entidadId,
    detalles: detalles ? { texto: detalles } : null,
  });
  if (error) throw new ErrorPanelo("OTRO", error.message);
}

/** Fila admins del admin autenticado (para audit_log.admin_id). */
export async function adminFilaId(): Promise<string> {
  const sb = asegurarSB();
  const { data } = await sb.auth.getSession();
  const uid = data.session?.user.id;
  const { data: fila } = await sb
    .from("admins")
    .select("id")
    .eq("auth_id", uid)
    .maybeSingle();
  const r = fila as unknown as { id: string } | null;
  if (!r) throw new ErrorPanelo("SIN_ROL_VINCULADO");
  return r.id;
}

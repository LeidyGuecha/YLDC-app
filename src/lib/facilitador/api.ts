import { getSupabase, type SupabaseClient } from "@/lib/supabase/client";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { ErrorPanelo } from "./auth";
import type {
  ComentarioGrupalPanel,
  CursoBreve,
  EstudiantePanel,
  FacilitadorBreve,
  FaseSesionPanel,
  EstadoSesionPanel,
  FilaRespuestaPanel,
  ProgresoTestPanel,
  ResultadoPanel,
  SesionPanel,
  TallerBreve,
} from "./types";

/*
  Datos del panel del facilitador. TODO corre contra la BD real vía el
  cliente autenticado: la RLS (sesiones/estudiantes/respuestas/test/comentarios)
  decide qué puede ver cada cuenta. No hay modo demo aquí — el login es la
  credencial (adicional al flujo anónimo del estudiante).
*/

function asegurarSB(): SupabaseClient {
  if (!supabaseConfigurado) throw new ErrorPanelo("SIN_CONFIGURACION");
  return getSupabase()!;
}

function etiquetaCurso(grado: number, id: string): string {
  return `${grado}°-${id.slice(-3)}`; // igual que fn_sesion_por_pin
}

/* ───────────────── catálogos para crear sesiones ───────────────── */

export async function listarTalleres(): Promise<TallerBreve[]> {
  const sb = asegurarSB();
  const { data, error } = await sb
    .from("talleres")
    .select("id,codigo,titulo,numero_sesion")
    .eq("activo", true)
    .order("numero_sesion");
  if (error) throw new ErrorPanelo("OTRO", error.message);
  return (data ?? []).map((t) => ({
    id: t.id,
    codigo: t.codigo,
    titulo: t.titulo,
    numeroSesion: t.numero_sesion,
  }));
}

export async function listarCursos(): Promise<CursoBreve[]> {
  const sb = asegurarSB();
  const { data, error } = await sb
    .from("cursos")
    .select("id,grado,colegio:colegios(nombre)")
    .eq("activo", true)
    .order("grado");
  if (error) throw new ErrorPanelo("OTRO", error.message);
  return (data ?? []).map((c) => {
    const colegio = (c as { colegio?: { nombre?: string } | null }).colegio;
    return {
      id: c.id,
      etiqueta: etiquetaCurso(c.grado, c.id),
      colegioNombre: colegio?.nombre ?? "",
    };
  });
}

export async function listarCoFacilitadores(
  miId: string,
): Promise<FacilitadorBreve[]> {
  const sb = asegurarSB();
  const { data, error } = await sb
    .from("facilitadores")
    .select("id,nombre_completo")
    .eq("activo", true)
    .neq("id", miId)
    .order("nombre_completo");
  if (error) throw new ErrorPanelo("OTRO", error.message);
  return (data ?? []).map((f) => ({ id: f.id, nombreCompleto: f.nombre_completo }));
}

/* ───────────────── sesiones ───────────────── */

export async function listarMisSesiones(): Promise<SesionPanel[]> {
  const sb = asegurarSB();
  // la RLS ya acota a las sesiones donde soy lead o co-facilitador
  const { data, error } = await sb
    .from("sesiones")
    .select(
      "id,taller_id,curso_id,facilitador_lead_id,co_facilitadores_ids,pin_acceso,estado,fase_actual,fecha_inicio,fecha_cierre,creado_en," +
        "taller:talleres(codigo,titulo,numero_sesion)," +
        "curso:cursos(grado,colegio:colegios(nombre))",
    )
    .order("creado_en", { ascending: false });
  if (error) throw new ErrorPanelo("OTRO", error.message);
  return (data ?? []).map((f) => {
    const r = f as unknown as {
      id: string;
      taller_id: string;
      curso_id: string;
      facilitador_lead_id: string;
      co_facilitadores_ids: string[];
      pin_acceso: string;
      estado: EstadoSesionPanel;
      fase_actual: FaseSesionPanel;
      fecha_inicio: string | null;
      fecha_cierre: string | null;
      creado_en: string;
      taller: { codigo: string; titulo: string; numero_sesion: number };
      curso: { grado: number; colegio: { nombre?: string } | null };
    };
    return {
      id: r.id,
      tallerId: r.taller_id,
      cursoId: r.curso_id,
      tallerCodigo: r.taller?.codigo ?? "",
      tallerTitulo: r.taller?.titulo ?? "",
      numeroSesion: r.taller?.numero_sesion ?? 0,
      cursoEtiqueta: etiquetaCurso(r.curso?.grado ?? 0, r.curso_id),
      colegioNombre: r.curso?.colegio?.nombre ?? "",
      leadId: r.facilitador_lead_id,
      coFacilitadoresIds: r.co_facilitadores_ids ?? [],
      pin: r.pin_acceso,
      estado: r.estado,
      faseActual: r.fase_actual,
      fechaInicio: r.fecha_inicio,
      fechaCierre: r.fecha_cierre,
      creadoEn: r.creado_en,
    };
  });
}

export async function crearSesion(opciones: {
  tallerId: string;
  cursoId: string;
  leadId: string;
  coFacilitadoresIds: string[];
}): Promise<SesionPanel> {
  const sb = asegurarSB();
  // PIN único (check unique en pin_acceso): se randomiza y reintenta
  for (let intento = 0; intento < 6; intento++) {
    const pin = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
    const { data, error } = await sb
      .from("sesiones")
      .insert({
        taller_id: opciones.tallerId,
        curso_id: opciones.cursoId,
        facilitador_lead_id: opciones.leadId,
        co_facilitadores_ids: opciones.coFacilitadoresIds,
        pin_acceso: pin,
        estado: "abierta",
        fase_actual: "como_vengo",
      })
      .select("*")
      .single();

    if (!error) {
      const r = data as {
        id: string;
        taller_id: string;
        curso_id: string;
        facilitador_lead_id: string;
        co_facilitadores_ids: string[];
        pin_acceso: string;
        estado: EstadoSesionPanel;
        fase_actual: FaseSesionPanel;
        fecha_inicio: string | null;
        fecha_cierre: string | null;
        creado_en: string;
      };
      // títulos/etiquetas se resuelven con una relectura embebida
      const sesiones = await listarMisSesiones();
      return (
        sesiones.find((s) => s.id === r.id) ?? {
          id: r.id,
          tallerId: r.taller_id,
          cursoId: r.curso_id,
          tallerCodigo: "",
          tallerTitulo: "",
          numeroSesion: 0,
          cursoEtiqueta: etiquetaCurso(0, r.curso_id),
          colegioNombre: "",
          leadId: r.facilitador_lead_id,
          coFacilitadoresIds: r.co_facilitadores_ids ?? [],
          pin: r.pin_acceso,
          estado: r.estado,
          faseActual: r.fase_actual,
          fechaInicio: r.fecha_inicio,
          fechaCierre: r.fecha_cierre,
          creadoEn: r.creado_en,
        }
      );
    }

    const duplicado = error.message.toLowerCase().includes("duplicate key");
    if (!duplicado || intento === 5) throw new ErrorPanelo("OTRO", error.message);
  }
  throw new ErrorPanelo("OTRO", "No se pudo generar un PIN único");
}

export async function cambiarFase(
  sesionId: string,
  fase: FaseSesionPanel,
): Promise<void> {
  const sb = asegurarSB();
  const { error } = await sb
    .from("sesiones")
    .update({ fase_actual: fase })
    .eq("id", sesionId);
  if (error) throw new ErrorPanelo("OTRO", error.message);
}

export async function cambiarEstado(
  sesionId: string,
  estado: EstadoSesionPanel,
): Promise<void> {
  const sb = asegurarSB();
  const parche: { estado: EstadoSesionPanel; fecha_cierre: string | null } = {
    estado,
    fecha_cierre: estado === "abierta" ? null : new Date().toISOString(),
  };
  const { error } = await sb
    .from("sesiones")
    .update(parche)
    .eq("id", sesionId);
  if (error) throw new ErrorPanelo("OTRO", error.message);
}

/* ───────────────── monitoreo en vivo ───────────────── */

export async function listarEstudiantesDeCurso(
  cursoId: string,
): Promise<EstudiantePanel[]> {
  const sb = asegurarSB();
  const { data, error } = await sb
    .from("estudiantes")
    .select("id,nombre_completo,ti,activo")
    .eq("curso_id", cursoId)
    .order("nombre_completo");
  if (error) throw new ErrorPanelo("OTRO", error.message);
  return (data ?? []).map((e) => ({
    id: e.id,
    nombreCompleto: e.nombre_completo,
    ti: e.ti,
    activo: e.activo,
  }));
}

export async function listarRespuestasDeSesion(
  sesionId: string,
): Promise<FilaRespuestaPanel[]> {
  const sb = asegurarSB();
  const { data, error } = await sb
    .from("respuestas")
    .select(
      "id,estudiante_id,tipo,pregunta_id,contenido_texto,contenido_seleccion_json,contenido_checklist_json,fecha_envio",
    )
    .eq("sesion_id", sesionId)
    .order("fecha_envio");
  if (error) throw new ErrorPanelo("OTRO", error.message);
  return (data ?? []).map((r) => {
    const f = r as {
      id: string;
      estudiante_id: string;
      tipo: FaseSesionPanel;
      pregunta_id: string | null;
      contenido_texto: string | null;
      contenido_seleccion_json: string | null;
      contenido_checklist_json: string | null;
      fecha_envio: string;
    };
    return {
      id: f.id,
      estudianteId: f.estudiante_id,
      tipo: f.tipo,
      preguntaId: f.pregunta_id,
      contenidoTexto: f.contenido_texto,
      seleccionJson: f.contenido_seleccion_json,
      checklistJson: f.contenido_checklist_json,
      fechaEnvio: f.fecha_envio,
    };
  });
}

export async function listarProgresoTest(
  sesionId: string,
): Promise<ProgresoTestPanel[]> {
  const sb = asegurarSB();
  const { data, error } = await sb
    .from("respuestas_test_holland")
    .select("estudiante_id")
    .eq("sesion_id", sesionId);
  if (error) throw new ErrorPanelo("OTRO", error.message);
  const conteo = new Map<string, number>();
  for (const r of data ?? []) {
    const id = r.estudiante_id;
    conteo.set(id, (conteo.get(id) ?? 0) + 1);
  }
  return [...conteo].map(([estudianteId, respondidas]) => ({
    estudianteId,
    respondidas,
  }));
}

export async function listarResultadosHolland(
  sesionId: string,
): Promise<ResultadoPanel[]> {
  const sb = asegurarSB();
  const { data, error } = await sb
    .from("resultados_test_holland")
    .select("estudiante_id,codigo_holland")
    .eq("sesion_id", sesionId);
  if (error) throw new ErrorPanelo("OTRO", error.message);
  return (data ?? []).map((r) => ({
    estudianteId: r.estudiante_id,
    codigoHolland: r.codigo_holland,
  }));
}

/* ───────────────── comentario grupal (1 por facilitador) ───────────────── */

export async function listarComentariosGrupales(
  sesionId: string,
): Promise<ComentarioGrupalPanel[]> {
  const sb = asegurarSB();
  const { data, error } = await sb
    .from("comentarios_grupales")
    .select("id,facilitador_id,comentario,fecha,editado_en")
    .eq("sesion_id", sesionId)
    .order("fecha");
  if (error) throw new ErrorPanelo("OTRO", error.message);
  return (data ?? []).map((c) => ({
    id: c.id,
    facilitadorId: c.facilitador_id,
    comentario: c.comentario,
    fecha: c.fecha,
    editadoEn: c.editado_en,
  }));
}

/** Guarda el comentario grupal del facilitador (máx. 1 por sesión: si ya
 *  existe su fila lo actualiza — Patron de edicion del autor). */
export async function guardarComentarioGrupal(
  sesionId: string,
  facilitadorId: string,
  comentario: string,
): Promise<void> {
  const sb = asegurarSB();
  const { data: mios } = await sb
    .from("comentarios_grupales")
    .select("id")
    .eq("sesion_id", sesionId)
    .eq("facilitador_id", facilitadorId)
    .maybeSingle();

  if (mios) {
    const { error } = await sb
      .from("comentarios_grupales")
      .update({ comentario, editado_en: new Date().toISOString() })
      .eq("id", (mios as { id: string }).id);
    if (error) throw new ErrorPanelo("OTRO", error.message);
    return;
  }
  const { error } = await sb.from("comentarios_grupales").insert({
    sesion_id: sesionId,
    facilitador_id: facilitadorId,
    comentario,
  });
  if (error) throw new ErrorPanelo("OTRO", error.message);
}

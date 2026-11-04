import { getSupabase, type SupabaseClient } from "@/lib/supabase/client";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { ErrorPanelo } from "@/lib/facilitador/auth"; // vocabulario de error compartido
import type {
  ComentarioIndividualPsicologa,
  ComentarioGrupalPsicologa,
  CursoPsicologa,
  EstudiantePsicologa,
  PerfilPsicologa,
  RespuestaPsicologa,
  ResultadoPsicologa,
  SesionPsicologa,
} from "./types";

/*
  Datos del panel de la psicóloga. Todo corre contra la BD real vía el
  cliente autenticado: la RLS decide qué ve (estudiantes y respuestas de
  SU colegio, o todos si su fila tiene colegio_id nulo).
*/

function asegurarSB(): SupabaseClient {
  if (!supabaseConfigurado) throw new ErrorPanelo("SIN_CONFIGURACION");
  return getSupabase()!;
}

function etiquetaCurso(grado: number, id: string): string {
  return `${grado}°-${id.slice(-3)}`; // igual que fn_sesion_por_pin
}

/* ───────────────── navegador por cursos ───────────────── */

export async function listarCursosPsicologa(
  perfil: PerfilPsicologa,
): Promise<CursoPsicologa[]> {
  const sb = asegurarSB();
  const { data, error } = await sb
    .from("cursos")
    .select("id,grado,anio,activo,colegio:colegios(id,nombre)")
    .order("anio", { ascending: false });
  if (error) throw new ErrorPanelo("OTRO", error.message);
  return (data ?? [])
    .map((c) => {
      const r = c as unknown as {
        id: string;
        grado: number;
        anio: number;
        activo: boolean;
        colegio: { id: string; nombre: string } | null;
      };
      return {
        id: r.id,
        colegioId: r.colegio?.id ?? null,
        etiqueta: etiquetaCurso(r.grado, r.id),
        anio: r.anio,
        colegioNombre: r.colegio?.nombre ?? "",
        activo: r.activo,
      };
    })
    // RLS no acota cursos (catálogo público): se recorta por SU colegio,
    // salvo que su fila tenga colegio_id nulo (sirve en todos).
    .filter(
      (c) => perfil.colegioId === null || c.colegioId === perfil.colegioId,
    );
}

/* ───────────────── estudiantes y sesiones del curso ───────────────── */

export async function listarEstudiantesDeCurso(
  cursoId: string,
): Promise<EstudiantePsicologa[]> {
  const sb = asegurarSB();
  const { data, error } = await sb
    .from("estudiantes")
    .select("id,nombre_completo,ti,consentimiento_aceptado,activo,origen")
    .eq("curso_id", cursoId)
    .order("nombre_completo");
  if (error) throw new ErrorPanelo("OTRO", error.message);
  return (data ?? []).map((e) => {
    const r = e as unknown as {
      id: string;
      nombre_completo: string;
      ti: string | null;
      consentimiento_aceptado: boolean;
      activo: boolean;
      origen: "excel" | "registro_directo";
    };
    return {
      id: r.id,
      nombreCompleto: r.nombre_completo,
      ti: r.ti,
      consentimiento: r.consentimiento_aceptado,
      activo: r.activo,
      origen: r.origen,
    };
  });
}

export async function listarSesionesDeCurso(
  cursoId: string,
): Promise<SesionPsicologa[]> {
  const sb = asegurarSB();
  const { data, error } = await sb
    .from("sesiones")
    .select(
      "id,pin_acceso,estado,fase_actual,creado_en,taller:talleres(titulo,numero_sesion)",
    )
    .eq("curso_id", cursoId)
    .order("creado_en", { ascending: false });
  if (error) throw new ErrorPanelo("OTRO", error.message);
  return (data ?? []).map((s) => {
    const r = s as unknown as {
      id: string;
      pin_acceso: string;
      estado: "abierta" | "cerrada_pendiente" | "completada";
      fase_actual: "como_vengo" | "actividad" | "como_voy";
      creado_en: string;
      taller: { titulo: string; numero_sesion: number } | null;
    };
    return {
      id: r.id,
      tallerTitulo: r.taller?.titulo ?? "",
      numeroSesion: r.taller?.numero_sesion ?? 0,
      pin: r.pin_acceso,
      estado: r.estado,
      faseActual: r.fase_actual,
      creadoEn: r.creado_en,
    };
  });
}

/* ───────────────── historial del estudiante ───────────────── */

type RespuestaBruta = {
  sesion_id: string;
  tipo: RespuestaPsicologa["tipo"];
  pregunta_id: string | null;
  contenido_texto: string | null;
  contenido_seleccion_json: string | null;
  contenido_checklist_json: string | null;
  fecha_envio: string;
};

function mapearRespuesta(r: unknown, sesionId: string): RespuestaPsicologa {
  const f = r as unknown as RespuestaBruta;
  let checklist: string[] | null = null;
  if (f.contenido_checklist_json) {
    try {
      checklist = (JSON.parse(f.contenido_checklist_json) as { opciones?: string[] })
        .opciones ?? null;
    } catch {
      checklist = null;
    }
  }
  let seleccion: string | null = null;
  if (f.contenido_seleccion_json) {
    try {
      seleccion =
        (JSON.parse(f.contenido_seleccion_json) as { seleccion?: string })
          .seleccion ?? null;
    } catch {
      seleccion = null;
    }
  }
  return {
    sesionId,
    tipo: f.tipo,
    preguntaId: f.pregunta_id,
    texto: f.contenido_texto,
    seleccion,
    checklist,
    fecha: f.fecha_envio,
  };
}

/** Respuestas de fases del estudiante en TODAS las sesiones del curso. */
export async function listarHistorialEstudiante(
  sesiones: SesionPsicologa[],
  estudianteId: string,
): Promise<RespuestaPsicologa[]> {
  const sb = asegurarSB();
  if (sesiones.length === 0) return [];
  // la RLS recorta a las sesiones de su colegio; el filtro por estudiante es local
  const { data, error } = await sb
    .from("respuestas")
    .select(
      "estudiante_id,sesion_id,tipo,pregunta_id,contenido_texto,contenido_seleccion_json,contenido_checklist_json,fecha_envio",
    )
    .in("sesion_id", sesiones.map((s) => s.id))
    .order("fecha_envio");
  if (error) throw new ErrorPanelo("OTRO", error.message);
  return (data ?? [])
    .filter((r) => {
      const f = r as unknown as RespuestaBruta & {
        estudiante_id: string;
      };
      return f.estudiante_id === estudianteId;
    })
    .map((r) => {
      const f = r as unknown as RespuestaBruta & { estudiante_id: string };
      return mapearRespuesta(f, f.sesion_id);
    });
}

export async function listarComentariosIndividuales(
  estudianteIds: string[],
): Promise<ComentarioIndividualPsicologa[]> {
  const sb = asegurarSB();
  if (estudianteIds.length === 0) return [];
  const { data, error } = await sb
    .from("comentarios_individuales_psicologa")
    .select(
      "id,estudiante_id,psicologa_id,comentario,fecha,editado_en,psicologa:psicologas(nombre_completo)",
    )
    .in("estudiante_id", estudianteIds);
  if (error) throw new ErrorPanelo("OTRO", error.message);
  return (data ?? []).map((c) => {
    const r = c as unknown as {
      id: string;
      estudiante_id: string;
      psicologa_id: string;
      comentario: string;
      fecha: string;
      editado_en: string | null;
      psicologa: { nombre_completo?: string } | null;
    };
    return {
      id: r.id,
      estudianteId: r.estudiante_id,
      psicologaId: r.psicologa_id,
      psicologaNombre: r.psicologa?.nombre_completo ?? null,
      comentario: r.comentario,
      fecha: r.fecha,
      editadoEn: r.editado_en,
    };
  });
}

/** Comentarios grupales de TODAS las sesiones dadas (para el PDF/ZIP). */
export async function listarComentariosGrupalesPsicologa(
  sesionIds: string[],
): Promise<ComentarioGrupalPsicologa[]> {
  const sb = asegurarSB();
  if (sesionIds.length === 0) return [];
  const { data, error } = await sb
    .from("comentarios_grupales")
    .select(
      "sesion_id,comentario,fecha,facilitador:facilitadores(nombre_completo)",
    )
    .in("sesion_id", sesionIds);
  if (error) throw new ErrorPanelo("OTRO", error.message);
  return (data ?? []).map((c) => {
    const r = c as unknown as {
      sesion_id: string;
      comentario: string;
      fecha: string;
      facilitador: { nombre_completo?: string } | null;
    };
    return {
      sesionId: r.sesion_id,
      facilitadorNombre: r.facilitador?.nombre_completo ?? "Facilitador",
      comentario: r.comentario,
      fecha: r.fecha,
    };
  });
}

/** Guarda el comentario individual de la psicóloga (UNIQUE por estudiante:
 *  si ya existe de ESTA psicóloga se actualiza; si existe de OTRA, error). */
export async function guardarComentarioIndividual(
  estudianteId: string,
  psicologaId: string,
  comentario: string,
): Promise<void> {
  const sb = asegurarSB();
  const { data: fila } = await sb
    .from("comentarios_individuales_psicologa")
    .select("id,psicologa_id")
    .eq("estudiante_id", estudianteId)
    .maybeSingle();
  const existente = fila as unknown as
    | { id: string; psicologa_id: string }
    | null;

  if (existente && existente.psicologa_id !== psicologaId) {
    throw new ErrorPanelo(
      "CUENTA_DESACTIVADA",
      "Esta estudiante ya tiene un comentario de otra psicóloga.",
    );
  }

  if (existente) {
    const { error } = await sb
      .from("comentarios_individuales_psicologa")
      .update({ comentario, editado_en: new Date().toISOString() })
      .eq("id", existente.id);
    if (error) throw new ErrorPanelo("OTRO", error.message);
    return;
  }

  const { error } = await sb
    .from("comentarios_individuales_psicologa")
    .insert({
      estudiante_id: estudianteId,
      psicologa_id: psicologaId,
      comentario,
    });
  if (error) throw new ErrorPanelo("OTRO", error.message);
}

/* ───────────────── resultados del test ───────────────── */

export async function listarResultadosEstudiantes(
  estudianteIds: string[],
): Promise<ResultadoPsicologa[]> {
  const sb = asegurarSB();
  if (estudianteIds.length === 0) return [];
  const { data, error } = await sb
    .from("resultados_test_holland")
    .select(
      "estudiante_id,codigo_holland,tipologia_primaria,tipologia_secundaria,tipologia_terciaria,puntaje_r,puntaje_i,puntaje_a,puntaje_s,puntaje_e,puntaje_c,fecha_calculo",
    )
    .in("estudiante_id", estudianteIds);
  if (error) throw new ErrorPanelo("OTRO", error.message);
  return (data ?? []).map((r) => {
    const f = r as unknown as {
      estudiante_id: string;
      codigo_holland: string;
      tipologia_primaria: string;
      tipologia_secundaria: string;
      tipologia_terciaria: string;
      puntaje_r: number;
      puntaje_i: number;
      puntaje_a: number;
      puntaje_s: number;
      puntaje_e: number;
      puntaje_c: number;
      fecha_calculo: string;
    };
    return {
      estudianteId: f.estudiante_id,
      codigo: f.codigo_holland,
      tipologias: [f.tipologia_primaria, f.tipologia_secundaria, f.tipologia_terciaria],
      puntajes: {
        R: f.puntaje_r,
        I: f.puntaje_i,
        A: f.puntaje_a,
        S: f.puntaje_s,
        E: f.puntaje_e,
        C: f.puntaje_c,
      },
      fechaCalculo: f.fecha_calculo,
    };
  });
}

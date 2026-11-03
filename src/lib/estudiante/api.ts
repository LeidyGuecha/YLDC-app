import { getSupabase } from "@/lib/supabase/client";
import { supabaseConfigurado } from "@/lib/supabase/config";
import * as demo from "./mock";
import {
  ErrorEstudiante,
  type EstadoSesion,
  type FaseSesion,
  type FilaRespuesta,
  type InfoSesion,
  type PreguntaTest,
  type RespuestaTestGuardada,
  type ResultadoHolland,
} from "./types";

/*
  API única del flujo del estudiante — delega a Supabase RPC si hay
  credenciales, o al modo demo (localStorage) si no. Las pantallas jamás
  tocan Supabase directamente: montar sobre estas funciones.

  Todo lo del estudiante pasa por RPC SECURITY DEFINER del schema.sql
  (el PIN es la credencial; ningún anon puede leer la tabla sesiones).
*/

export { supabaseConfigurado } from "@/lib/supabase/config";

/* ───────────────── Mapeo de mensajes de PostgreSQL → códigos ───────────────── */

function mapearErrorPg(mensaje: string): never {
  const m = mensaje.toLowerCase();
  if (m.includes("pin")) throw new ErrorEstudiante("PIN_INVALIDO");
  if (m.includes("no está abierta") || m.includes("no esta abierta")) {
    throw new ErrorEstudiante("SESION_NO_ABIERTA");
  }
  if (m.includes("nombre_ambiguo")) throw new ErrorEstudiante("NOMBRE_AMBIGUO");
  if (m.includes("faltan") && m.includes("pregunta")) {
    throw new ErrorEstudiante("FALTAN_PREGUNTAS");
  }
  throw new ErrorEstudiante("OTRO", mensaje);
}

/* ───────────────── Sesión por PIN ───────────────── */

export async function mostrarSesionInfo(pin: string): Promise<InfoSesion> {
  if (!supabaseConfigurado) return demo.mockInfoSesionPorPin(pin);

  const sb = getSupabase()!;
  const { data, error } = await sb.rpc("fn_sesion_por_pin", { p_pin: pin });
  if (error) return mapearErrorPg(error.message);
  if (!data) throw new ErrorEstudiante("PIN_INVALIDO");
  const d = data as {
    sesion_id: string;
    estado: EstadoSesion;
    fase_actual: FaseSesion;
    taller: string;
    numero_sesion: number;
    curso: string;
  };
  return {
    sesionId: d.sesion_id as string,
    estado: d.estado,
    faseActual: d.fase_actual,
    taller: d.taller,
    numeroSesion: d.numero_sesion,
    curso: d.curso,
  } satisfies InfoSesion;
}

/* ───────────────── Unirse (pantalla 1.2 · identificación) ───────────────── */

export async function unirseASesion(opciones: {
  pin: string;
  nombre: string;
  ti: string | null;
  consentimiento: boolean;
}): Promise<{ estudianteId: string; sesionId: string; yaRegistrado: boolean }> {
  if (!supabaseConfigurado) {
    const sesion = await demo.mockInfoSesionPorPin(opciones.pin);
    const r = await demo.mockUnirseSesion(
      opciones.pin,
      opciones.nombre,
      opciones.ti,
    );
    return {
      estudianteId: r.estudianteId,
      sesionId: sesion.sesionId,
      yaRegistrado: r.yaRegistrado,
    };
  }

  const sb = getSupabase()!;
  const { data, error } = await sb.rpc("fn_unirse_sesion", {
    p_pin: opciones.pin,
    p_nombre: opciones.nombre.trim(),
    p_ti: opciones.ti?.trim() || null,
    p_consentimiento: opciones.consentimiento,
  });
  if (error) return mapearErrorPg(error.message);
  const d = data as {
    estudiante_id: string;
    sesion_id: string;
    ya_registrado: boolean;
  };
  return {
    estudianteId: d.estudiante_id,
    sesionId: d.sesion_id,
    yaRegistrado: d.ya_registrado,
  };
}

/* ───────────────── Autoguardado de las fases ───────────────── */

export interface CuerpoRespuesta {
  pin: string;
  estudianteId: string;
  tipo: FaseSesion;
  preguntaId: string | null;
  texto?: string | null;
  seleccion?: string | null; // id de opción única (clima)
  checklist?: string[] | null; // ids marcados
}

export async function guardarRespuestaFase(c: CuerpoRespuesta): Promise<void> {
  const seleccion = c.seleccion ? { seleccion: c.seleccion } : null;
  const checklist =
    c.checklist && c.checklist.length > 0 ? { opciones: c.checklist } : null;

  if (!supabaseConfigurado) {
    return demo.mockGuardarRespuesta(
      c.pin,
      c.estudianteId,
      c.tipo,
      c.preguntaId,
      c.texto ?? null,
      seleccion,
      checklist,
    );
  }

  const sb = getSupabase()!;
  const { error } = await sb.rpc("fn_guardar_respuesta", {
    p_pin: c.pin,
    p_estudiante_id: c.estudianteId,
    p_tipo: c.tipo,
    p_pregunta_id: c.preguntaId,
    p_texto: c.texto ?? null,
    p_seleccion: seleccion ? JSON.parse(JSON.stringify(seleccion)) : null,
    p_checklist: checklist ? JSON.parse(JSON.stringify(checklist)) : null,
  });
  if (error) return mapearErrorPg(error.message);
}

/* ───────────────── Relectura propia (pantallas 1.6b / 1.8) ───────────────── */

export async function listarMisRespuestas(opciones: {
  pin: string;
  estudianteId: string;
}): Promise<FilaRespuesta[]> {
  if (!supabaseConfigurado) {
    return demo.mockListarMisRespuestas(opciones.pin, opciones.estudianteId);
  }

  const sb = getSupabase()!;
  const { data, error } = await sb.rpc("fn_listar_mis_respuestas", {
    p_pin: opciones.pin,
    p_estudiante_id: opciones.estudianteId,
  });
  if (error) return mapearErrorPg(error.message);
  return (data ?? []) as unknown as FilaRespuesta[];
}

/* ───────────────── Test de Holland (motor en supabase/schema.sql) ─────────── */

export async function listarPreguntasTest(): Promise<PreguntaTest[]> {
  if (!supabaseConfigurado) return demo.mockPreguntasTest();

  const sb = getSupabase()!;
  const { data, error } = await sb
    .from("preguntas_test_holland")
    .select("id,seccion,tipologia,orden,enunciado,tipo_respuesta")
    .eq("activa", true)
    .order("id");
  if (error) return mapearErrorPg(error.message);
  return (data ?? []).map((f) => {
    const d = f as {
      id: number;
      seccion: PreguntaTest["seccion"];
      tipologia: PreguntaTest["tipologia"];
      orden: number;
      enunciado: string;
      tipo_respuesta: PreguntaTest["tipoRespuesta"];
    };
    return {
      id: d.id,
      seccion: d.seccion,
      tipologia: d.tipologia,
      orden: d.orden,
      enunciado: d.enunciado,
      tipoRespuesta: d.tipo_respuesta,
    };
  });
}

export async function guardarLoteTest(
  pin: string,
  estudianteId: string,
  pares: Array<{ preguntaId: number; respuesta: number }>,
): Promise<void> {
  if (!supabaseConfigurado) {
    return demo.mockGuardarLoteTest(pin, estudianteId, pares);
  }
  const sb = getSupabase()!;
  const { error } = await sb.rpc("fn_guardar_respuestas_test", {
    p_pin: pin,
    p_estudiante_id: estudianteId,
    p_lote: pares.map((p) => ({ pregunta_id: p.preguntaId, respuesta: p.respuesta })),
  });
  if (error) return mapearErrorPg(error.message);
}

export async function listarMisRespuestasTest(opciones: {
  pin: string;
  estudianteId: string;
}): Promise<RespuestaTestGuardada[]> {
  if (!supabaseConfigurado) {
    return demo.mockListarMisRespuestasTest(opciones.pin, opciones.estudianteId);
  }
  const sb = getSupabase()!;
  const { data, error } = await sb.rpc("fn_listar_mis_respuestas_test", {
    p_pin: opciones.pin,
    p_estudiante_id: opciones.estudianteId,
  });
  if (error) return mapearErrorPg(error.message);
  return (data ?? []) as unknown as RespuestaTestGuardada[];
}

/** NULL (ningún cálculo aún) o el resultado del estudiante. */
export async function calcularHolland(
  pin: string,
  estudianteId: string,
): Promise<ResultadoHolland | null> {
  if (!supabaseConfigurado) {
    return demo.mockCalcularHolland(pin, estudianteId);
  }
  const sb = getSupabase()!;
  const { data, error } = await sb.rpc("fn_calcular_holland", {
    p_pin: pin,
    p_estudiante_id: estudianteId,
  });
  if (error) return mapearErrorPg(error.message);
  return data ? parsearResultado(data) : null;
}

export async function verResultadoPropio(
  pin: string,
  estudianteId: string,
): Promise<ResultadoHolland | null> {
  if (!supabaseConfigurado) {
    return demo.mockVerResultadoPropio(pin, estudianteId);
  }
  const sb = getSupabase()!;
  const { data, error } = await sb.rpc("fn_ver_resultado_propio", {
    p_pin: pin,
    p_estudiante_id: estudianteId,
  });
  if (error) return mapearErrorPg(error.message);
  return data ? parsearResultado(data) : null;
}

function parsearResultado(data: unknown): ResultadoHolland {
  const d = data as {
    codigo_holland: string;
    tipologias: string[];
    puntajes: Record<string, number>;
    ranked_completo?: string;
  };
  return {
    codigoHolland: d.codigo_holland,
    tipologias: [d.tipologias[0], d.tipologias[1], d.tipologias[2]] as ResultadoHolland["tipologias"],
    puntajes: {
      R: d.puntajes.R, I: d.puntajes.I, A: d.puntajes.A,
      S: d.puntajes.S, E: d.puntajes.E, C: d.puntajes.C,
    },
    rankedCompleto: d.ranked_completo,
  };
}

/* ───────────────── Mensajes amables para la UI ───────────────── */

export function mensajeAmable(error: unknown): string {
  if (error instanceof ErrorEstudiante) {
    switch (error.code) {
      case "SIN_CONFIGURACION":
        return "Falta configurar las credenciales de Supabase en .env.local.";
      case "PIN_INVALIDO":
        return "Ese PIN no existe o ya se usó en otra sesión. Pídele el PIN actual a tu facilitador.";
      case "SESION_NO_ABIERTA":
        return "Esta sesión ya se cerró. Pídele el PIN nuevo a tu facilitador.";
      case "NOMBRE_AMBIGUO":
        return "Hay más de un estudiante con ese nombre. Escribe tu documento para confirmar que eres tú.";
      case "FALTAN_PREGUNTAS":
        return "Aún faltan preguntas del test por responder.";
      case "RED":
        return "No pudimos conectar. Revisa tu internet e intenta otra vez.";
      default:
        return error.message || "Algo salió mal. Intenta de nuevo.";
    }
  }
  return "Algo salió mal. Intenta de nuevo.";
}

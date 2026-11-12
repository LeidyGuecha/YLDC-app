"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Books,
  ChatCircleDots,
  SignOut,
  SpinnerGap,
} from "@phosphor-icons/react";
import { Badge, Logo, ModalConfirmar, Vacio } from "@/components/ui";
import { MarcoStaff } from "@/components/marco-staff";
import { cerrarSesion, miPerfil } from "@/lib/psicologa/auth";
import {
  listarCursosPsicologa,
  listarEstudiantesDeCurso,
  listarHistorialEstudiante,
  listarComentariosIndividuales,
  listarComentariosGrupalesPsicologa,
  listarResultadosEstudiantes,
  listarSesionesDeCurso,
  guardarComentarioIndividual,
} from "@/lib/psicologa/api";
import type {
  CursoPsicologa,
  EstudiantePsicologa,
  PerfilPsicologa,
  RespuestaPsicologa,
  ResultadoPsicologa,
  SesionPsicologa,
  ComentarioIndividualPsicologa,
  ComentarioGrupalPsicologa,
} from "@/lib/psicologa/types";
import {
  bytesPdfEstudiante,
  descargarBytes,
  descargarPdfEstudiante,
  nombreArchivoEstudiante,
  type ReporteComentarioGrupal,
  type ReporteRespuesta,
} from "@/lib/pdf/reporte";
import { mensajeAmable } from "@/lib/estudiante/api";
import { BATERIA_FASES } from "@/lib/estudiante/preguntas";
import { supabaseConfigurado } from "@/lib/supabase/config";

const ETIQUETA_FASE: Record<RespuestaPsicologa["tipo"], string> = {
  como_vengo: "Cómo vengo",
  actividad: "Actividad",
  como_voy: "Cómo voy",
};

/** pregunta_id → enunciado (del catálogo de fases; hoy es la sesión 4). */
const ENUNCIADO_DE: Record<string, string> = Object.fromEntries(
  Object.values(BATERIA_FASES).flatMap((lista) =>
    lista.map((p) => [p.id, p.enunciado]),
  ),
);

const ETIQUETA_ESTADO_SESION: Record<
  SesionPsicologa["estado"],
  { texto: string; variante: "yellow" | "pinkSoft" | "teal" }
> = {
  abierta: { texto: "Abierta", variante: "yellow" },
  cerrada_pendiente: { texto: "Cerrada · pendiente de comentario", variante: "pinkSoft" },
  completada: { texto: "Completada", variante: "teal" },
};

function fechaCorta(valor: string | null): string {
  if (!valor) return "—";
  return new Date(valor).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
  });
}

/** Resumen legible de una respuesta (texto / selección única / checklist). */
function resumenFila(r: RespuestaPsicologa): string {
  const piezas: string[] = [];
  if (r.texto) piezas.push(r.texto);
  if (r.seleccion) piezas.push(`Elección: ${r.seleccion}`);
  if (r.checklist?.length) piezas.push(`Opciones: ${r.checklist.join(", ")}`);
  return piezas.length > 0 ? piezas.join(" · ") : "(sin contenido)";
}

/** Encabezado uniforme de una sesión (para el panel y para los reportes). */
function tituloSesionPanel(s: SesionPsicologa): string {
  const taller = s.tallerTitulo || `Sesión ${s.numeroSesion}`;
  return `${taller} · PIN ${s.pin}`;
}

function BarraPuntaje({ tip, valor }: { tip: string; valor: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-4 text-xs font-bold text-navy">{tip}</span>
      <div className="flex-1 max-w-44 h-2 bg-platinum rounded-full overflow-hidden">
        <div
          className="h-full bg-teal"
          style={{ width: `${Math.min(100, (valor / 90) * 100)}%` }}
        />
      </div>
      <span className="text-[10px] text-ink-2 w-10">{valor}/90</span>
    </div>
  );
}

export function PantallaPanelPsicologa() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilPsicologa | null>(null);
  const [cursos, setCursos] = useState<CursoPsicologa[]>([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  const [cursoSel, setCursoSel] = useState<string | null>(null);
  const [preguntarSalida, setPreguntarSalida] = useState(false);

  useEffect(() => {
    if (!supabaseConfigurado) return;
    (async () => {
      try {
        const p = await miPerfil();
        if (!p) {
          router.replace("/psicologa");
          return;
        }
        setPerfil(p);
        setCursos(await listarCursosPsicologa(p));
      } catch (e) {
        setError(mensajeAmable(e));
      } finally {
        setCargando(false);
      }
    })();
  }, [router]);

  async function alSalir() {
    await cerrarSesion();
    router.replace("/psicologa");
  }

  if (!supabaseConfigurado) {
    return (
      <main className="flex-1 grid place-items-center px-6 py-10">
        <div className="max-w-sm text-center flex flex-col gap-3">
          <Logo variant="color" height={40} />
          <p className="text-sm text-ink-2">
            El panel de la psicóloga trabaja contra la base de datos real.
            Configura <span className="font-mono text-navy">.env.local</span>{" "}
            con las credenciales de Supabase para usarlo.
          </p>
        </div>
      </main>
    );
  }

  if (cargando) {
    return (
      <main className="flex-1 grid place-items-center text-sm text-ink-2">
        Cargando tu panel…
      </main>
    );
  }

  if (!perfil) return null; // ya redirigió a /psicologa

  const curso = cursos.find((c) => c.id === cursoSel) ?? null;

  return (
    <MarcoStaff
      rol="Panel de la psicóloga"
      acento="pink"
      nombre={perfil.nombreCompleto}
      alSalir={() => setPreguntarSalida(true)}
      nav={[
        {
          etiqueta: "Mis cursos",
          icono: <Books size={16} />,
          activo: !cursoSel,
          onClick: () => setCursoSel(null),
        },
        {
          etiqueta: "Cerrar sesión",
          icono: <SignOut size={16} />,
          salida: true,
          onClick: () => setPreguntarSalida(true),
        },
      ]}
    >
      {/* Confirmación de salida (¿Salimos del panel?) */}
      <ModalConfirmar
        abierto={preguntarSalida}
        titulo="¿Salir del panel?"
        texto="Cierra tu sesión aquí. Para volver necesitarás tu correo y contraseña."
        etiquetaNo="Me quedo"
        etiquetaSi="Sí, salir"
        peligro
        alConfirmar={() => {
          setPreguntarSalida(false);
          void alSalir();
        }}
        alCancelar={() => setPreguntarSalida(false)}
      />

      {error && (
        <p className="text-xs text-pink bg-tint-pink rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {curso ? (
        <DetalleCurso
          perfil={perfil}
          curso={curso}
          alVolver={() => setCursoSel(null)}
          alError={(m) => setError(m)}
        />
      ) : (
        <section className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-bold text-navy">Tus cursos</h1>
            <p className="text-xs text-ink-2">
              {perfil.colegioNombre
                ? `Cursos de ${perfil.colegioNombre}`
                : "Ves todos los colegios (tu cuenta cubre toda la zona)"}{" "}
              — {cursos.length} en total
            </p>
          </div>

          {cursos.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-card p-8 text-center">
              <Vacio
                titulo="Nada acá todavía"
                texto="Cuando el colegio registre los cursos y el equipo te conecte, aparecerán aquí para que follows tu acompañamiento."
                etiquetaAccion="Volver a cargar"
                alAccion={() => window.location.reload()}
              />
            </div>
          ) : (
            <div className="grid gap-3">
              {cursos.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCursoSel(c.id)}
                  className="text-left bg-white rounded-2xl shadow-card p-4 flex items-center justify-between gap-3 hover:ring-2 hover:ring-pink cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-bold text-navy">
                      {c.etiqueta} — {c.colegioNombre}
                    </p>
                    <p className="text-[11px] text-ink-2 mt-0.5">
                      Año {c.anio}
                    </p>
                  </div>
                  <Badge variant={c.activo ? "teal" : "neutral"}>
                    {c.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </MarcoStaff>
  );
}

/* ───────────────── Detalle de un curso ───────────────── */

function DetalleCurso({
  perfil,
  curso,
  alVolver,
  alError,
}: {
  perfil: PerfilPsicologa;
  curso: CursoPsicologa;
  alVolver: () => void;
  alError: (mensaje: string) => void;
}) {
  const [estudiantes, setEstudiantes] = useState<EstudiantePsicologa[]>([]);
  const [sesiones, setSesiones] = useState<SesionPsicologa[]>([]);
  const [comentarios, setComentarios] = useState<
    ComentarioIndividualPsicologa[]
  >([]);
  const [comentariosGrupales, setComentariosGrupales] = useState<
    ComentarioGrupalPsicologa[]
  >([]);
  const [resultados, setResultados] = useState<ResultadoPsicologa[]>([]);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [generandoZip, setGenerandoZip] = useState(false);
  const [zipAvance, setZipAvance] = useState<string | null>(null);
  const [detalleDe, setDetalleDe] = useState<string | null>(null);
  const [historialDe, setHistorialDe] = useState<
    Record<string, RespuestaPsicologa[]>
  >({});
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [textoEditar, setTextoEditar] = useState<string | null>(null);
  const [estadoGuardado, setEstadoGuardado] = useState<
    "idle" | "saving" | "ok" | "error"
  >("idle");

  const idsEstudiantes = useMemo(
    () => estudiantes.map((e) => e.id),
    [estudiantes],
  );
  const claveEstudiantes = idsEstudiantes.join(",");
  const mapaResultados = useMemo(
    () => new Map(resultados.map((r) => [r.estudianteId, r])),
    [resultados],
  );
  const mapaComentarios = useMemo(
    () => new Map(comentarios.map((c) => [c.estudianteId, c])),
    [comentarios],
  );

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const [es, ses] = await Promise.all([
          listarEstudiantesDeCurso(curso.id),
          listarSesionesDeCurso(curso.id),
        ]);
        if (!vivo) return;
        setEstudiantes(es);
        setSesiones(ses);
        // comentarios grupales de las sesiones del curso (para el PDF/ZIP)
        const gr =
          ses.length > 0
            ? await listarComentariosGrupalesPsicologa(ses.map((s) => s.id))
            : [];
        if (!vivo) return;
        setComentariosGrupales(gr);
      } catch (e) {
        alError(mensajeAmable(e));
      }
    })();
    return () => {
      vivo = false;
    };
  }, [curso.id, alError]);

  // comentarios + resultados dependen de la lista de estudiantes cargada
  useEffect(() => {
    const ids = claveEstudiantes ? claveEstudiantes.split(",") : [];
    if (ids.length === 0) return;
    let vivo = true;
    (async () => {
      try {
        const [co, re] = await Promise.all([
          listarComentariosIndividuales(ids),
          listarResultadosEstudiantes(ids),
        ]);
        if (!vivo) return;
        setComentarios(co);
        setResultados(re);
      } catch (e) {
        alError(mensajeAmable(e));
      }
    })();
    return () => {
      vivo = false;
    };
  }, [claveEstudiantes, alError]);

  async function abrirDetalle(estudianteId: string) {
    const nuevo = detalleDe === estudianteId ? null : estudianteId;
    setDetalleDe(nuevo);
    setTextoEditar(null);
    setEstadoGuardado("idle");
    if (!nuevo || historialDe[nuevo]) return;
    setCargandoDetalle(true);
    try {
      const historial = await listarHistorialEstudiante(sesiones, nuevo);
      setHistorialDe((prev) => ({ ...prev, [nuevo]: historial }));
    } catch (e) {
      alError(mensajeAmable(e));
    } finally {
      setCargandoDetalle(false);
    }
  }

  async function alGuardarComentario(estudianteId: string) {
    const texto = (textoEditar ?? "").trim();
    if (!texto) return;
    setEstadoGuardado("saving");
    try {
      await guardarComentarioIndividual(estudianteId, perfil.id, texto);
      setComentarios(
        await listarComentariosIndividuales(
          estudiantes.map((e) => e.id),
        ),
      );
      setEstadoGuardado("ok");
    } catch (e) {
      alError(mensajeAmable(e));
      setEstadoGuardado("error");
    }
  }

  const estudianteDetalle =
    estudiantes.find((e) => e.id === detalleDe) ?? null;
  const resultadoDetalle =
    estudianteDetalle ? mapaResultados.get(estudianteDetalle.id) ?? null : null;
  const comentarioDetalle =
    estudianteDetalle ? mapaComentarios.get(estudianteDetalle.id) ?? null : null;
  const esComentarioDeOtra =
    comentarioDetalle !== null && comentarioDetalle.psicologaId !== perfil.id;
  const historialDetalle = useMemo(
    () => (estudianteDetalle ? historialDe[estudianteDetalle.id] ?? [] : []),
    [estudianteDetalle, historialDe],
  );

  const sesionesConHistorial = useMemo(() => {
    const ids = new Set(historialDetalle.map((r) => r.sesionId));
    return sesiones.filter((s) => ids.has(s.id));
  }, [historialDetalle, sesiones]);

  /* ── datos para el reporte PDF (RF-012) y el ZIP del curso (RF-013) ── */

  function datosReporte(
    estudiante: EstudiantePsicologa,
    historial: RespuestaPsicologa[],
  ) {
    const mapaSesiones = new Map(sesiones.map((s) => [s.id, s]));
    const fases: ReporteRespuesta[] = historial.map((r) => ({
      sesionTitulo: tituloSesionPanel(
        mapaSesiones.get(r.sesionId) ?? {
          id: r.sesionId,
          tallerTitulo: "Sesión",
          numeroSesion: 0,
          pin: "—",
          estado: "abierta",
          faseActual: "como_vengo",
          creadoEn: "",
        },
      ),
      fase: r.tipo,
      fecha: r.fecha,
      resumen: resumenFila(r),
    }));
    const comentarioFila = mapaComentarios.get(estudiante.id);
    const comentarioIndividual = comentarioFila
      ? {
          autor:
            comentarioFila.psicologaId === perfil.id
              ? perfil.nombreCompleto
              : comentarioFila.psicologaNombre ?? "Otra psicóloga",
          fecha: comentarioFila.fecha,
          editado: comentarioFila.editadoEn,
          texto: comentarioFila.comentario,
        }
      : null;
    const grupales: ReporteComentarioGrupal[] = comentariosGrupales
      .filter((g) => mapaSesiones.has(g.sesionId))
      .map((g) => ({
        sesionTitulo: tituloSesionPanel(mapaSesiones.get(g.sesionId)!),
        fecha: g.fecha,
        autor: g.facilitadorNombre,
        texto: g.comentario,
      }));
    const resultado = mapaResultados.get(estudiante.id) ?? null;

    return {
      colegio: curso.colegioNombre,
      curso: curso.etiqueta,
      nombre: estudiante.nombreCompleto,
      ti: estudiante.ti,
      consentimiento: estudiante.consentimiento,
      generadoPor: `${perfil.nombreCompleto} (psicóloga)`,
      resultado: resultado
        ? {
            codigo: resultado.codigo,
            tipologias: resultado.tipologias,
            fecha: resultado.fechaCalculo,
            puntajes: resultado.puntajes,
          }
        : null,
      comentarioIndividual,
      comentariosGrupales: grupales,
      fases,
    };
  }

  async function alPdfDetalle() {
    if (!estudianteDetalle) return;
    setGenerandoPdf(true);
    try {
      await descargarPdfEstudiante(
        datosReporte(estudianteDetalle, historialDetalle),
      );
    } catch (e) {
      alError(mensajeAmable(e));
    } finally {
      setGenerandoPdf(false);
    }
  }

  async function alZipCurso() {
    setGenerandoZip(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      let i = 0;
      for (const est of estudiantes) {
        i++;
        setZipAvance(`${i}/${estudiantes.length}`);
        // reutiliza el historial en caché; el resto se trae una vez
        let historial = historialDe[est.id];
        if (!historial) {
          historial = await listarHistorialEstudiante(sesiones, est.id);
          setHistorialDe((prev) => ({ ...prev, [est.id]: historial }));
        }
        const bytes = await bytesPdfEstudiante(datosReporte(est, historial));
        zip.file(nombreArchivoEstudiante(est.nombreCompleto, i), bytes);
      }
      const zipBytes = await zip.generateAsync({ type: "uint8array" });
      const nombreCurso = curso.etiqueta.replace(/[°^\W]+/g, "");
      descargarBytes(
        zipBytes,
        `curso_${nombreCurso}_${curso.anio}.zip`,
        "application/zip",
      );
      setZipAvance(null);
    } catch (e) {
      alError(mensajeAmable(e));
    } finally {
      setGenerandoZip(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <button
        onClick={alVolver}
        className="self-start inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-navy cursor-pointer"
      >
        <ArrowLeft size={15} /> Todos los cursos
      </button>

      <section className="bg-white rounded-2xl shadow-card p-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-navy">
              {curso.etiqueta} — {curso.colegioNombre}
            </h2>
            <p className="text-xs text-ink-2">
              {estudiantes.length} estudiantes · {sesiones.length} sesiones
            </p>
          </div>
          {sesiones.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {sesiones.slice(0, 4).map((s) => {
                const et = ETIQUETA_ESTADO_SESION[s.estado];
                return (
                  <Badge key={s.id} variant={et.variante} dot>
                    Sesión {s.numeroSesion}: {et.texto}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={alZipCurso}
            disabled={generandoZip || estudiantes.length === 0}
            className="h-8 px-3 rounded-lg border border-teal text-teal text-xs font-medium inline-flex items-center gap-1.5 hover:bg-tint-teal disabled:opacity-40 cursor-pointer"
          >
            {generandoZip ? (
              <SpinnerGap size={12} className="animate-spin" />
            ) : null}
            {generandoZip
              ? `Generando ${zipAvance ?? ""}…`
              : `Descargar ZIP del curso (${estudiantes.length} PDF)`}
          </button>
        </div>

        {estudiantes.length === 0 ? (
          <p className="text-xs text-ink-2">
            Este curso aún no tiene estudiantes cargados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[560px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-ink-2">
                  <th className="py-2 pr-3 font-medium">Estudiante</th>
                  <th className="py-2 pr-3 font-medium">TI</th>
                  <th className="py-2 pr-3 font-medium">Código Holland</th>
                  <th className="py-2 font-medium">Comentario psicológico</th>
                </tr>
              </thead>
              <tbody>
                {estudiantes.map((est) => {
                  const resultado = mapaResultados.get(est.id);
                  const comentario = mapaComentarios.get(est.id);
                  const abierto = detalleDe === est.id;
                  return (
                    <tr
                      key={est.id}
                      onClick={() => abrirDetalle(est.id)}
                      className={`border-t border-stroke cursor-pointer ${
                        abierto ? "bg-tint-navy" : "hover:bg-tint-navy"
                      }`}
                    >
                      <td className="py-2.5 pr-3 text-sm text-ink">
                        {est.nombreCompleto}
                        {!est.activo && (
                          <Badge variant="neutral" className="ml-2">
                            inactivo
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-ink-2">
                        {est.ti ?? "—"}
                      </td>
                      <td className="py-2.5 pr-3">
                        {resultado ? (
                          <Badge variant="pinkSoft" dot>{resultado.codigo}</Badge>
                        ) : (
                          <span className="text-xs text-ink-2">—</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <Badge variant={comentario ? "teal" : "neutral"}>
                          {comentario ? "Con comentario" : "Sin comentario"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[11px] text-ink-2">
          Toca a una estudiante para ver su resultado, su historial y dejar tu
          comentario individual.
        </p>
      </section>

      {/* Detalle de la estudiante seleccionada */}
      {estudianteDetalle && (
        <section className="bg-white rounded-2xl shadow-card p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-navy">
              {estudianteDetalle.nombreCompleto}
            </h3>
            <button
              onClick={alPdfDetalle}
              disabled={generandoPdf}
              className="h-8 px-3 rounded-lg border border-teal text-teal text-xs font-medium inline-flex items-center gap-1.5 hover:bg-tint-teal disabled:opacity-40 cursor-pointer"
            >
              {generandoPdf ? (
                <SpinnerGap size={12} className="animate-spin" />
              ) : null}
              Descargar PDF individual
            </button>
          </div>

          {resultadoDetalle ? (
            <div className="rounded-xl bg-tint-teal p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-widest text-navy">
                  {resultadoDetalle.codigo}
                </span>
                <span className="text-xs text-ink-2">
                  Predominante: {resultadoDetalle.tipologias[0]} ·{" "}
                  {fechaCorta(resultadoDetalle.fechaCalculo)}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 mt-1">
                {(["R", "I", "A", "S", "E", "C"] as const).map((tip) => (
                  <BarraPuntaje
                    key={tip}
                    tip={tip}
                    valor={resultadoDetalle.puntajes[tip]}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-ink-2">
              Aún no tiene resultado del test de Holland.
            </p>
          )}

          {/* Historial de fases por sesión */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-ink-2">
              Historial de sesiones
            </h4>
            {cargandoDetalle ? (
              <p className="text-xs text-ink-2 inline-flex items-center gap-2">
                <SpinnerGap size={13} className="animate-spin" /> Cargando
                historial…
              </p>
            ) : sesionesConHistorial.length === 0 ? (
              <p className="text-xs text-ink-2">
                Aún no envía respuestas en las sesiones de este curso.
              </p>
            ) : (
              sesionesConHistorial.map((s) => {
                const et = ETIQUETA_ESTADO_SESION[s.estado];
                return (
                  <div
                    key={s.id}
                    className="border border-stroke rounded-xl p-3 flex flex-col gap-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold text-navy">
                        {s.tallerTitulo || `Sesión ${s.numeroSesion}`} · PIN{" "}
                        {s.pin}
                      </p>
                      <Badge variant={et.variante} dot>{et.texto}</Badge>
                    </div>
                    <ul className="flex flex-col gap-1.5">
                      {historialDetalle
                        .filter((r) => r.sesionId === s.id)
                        .map((r, i) => (
                          <li
                            key={`${r.sesionId}-${r.tipo}-${i}`}
                            className="text-xs text-ink flex flex-col gap-0.5"
                          >
                            <span className="text-[11px] font-medium text-navy">
                              {ETIQUETA_FASE[r.tipo]}
                              {r.preguntaId && ENUNCIADO_DE[r.preguntaId] && (
                                <> · {ENUNCIADO_DE[r.preguntaId]}</>
                              )}
                            </span>
                            <span className="flex-1 pl-2 text-ink-2">
                              {resumenFila(r)}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                );
              })
            )}
          </div>

          {/* Comentario individual */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ChatCircleDots size={16} className="text-pink" />
              <h4 className="text-sm font-bold text-navy">
                Comentario psicológico
              </h4>
            </div>

            {esComentarioDeOtra && (
              <p className="text-[11px] text-ink-2">
                Escrito por otra psicóloga · {fechaCorta(comentarioDetalle?.fecha ?? null)}
                {comentarioDetalle?.editadoEn &&
                  ` · editado ${fechaCorta(comentarioDetalle.editadoEn)}`}
              </p>
            )}

            <textarea
              value={
                textoEditar ??
                comentarioDetalle?.comentario ??
                ""
              }
              onChange={(e) => setTextoEditar(e.target.value)}
              disabled={esComentarioDeOtra}
              rows={3}
              placeholder="Escribe tu observación sobre esta estudiante…"
              className="w-full rounded-xl border border-stroke p-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-pink disabled:opacity-60"
            />

            {estadoGuardado === "ok" && (
              <p className="text-xs text-teal">Comentario guardado.</p>
            )}
            {estadoGuardado === "error" && (
              <p className="text-xs text-pink">No se pudo guardar.</p>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => alGuardarComentario(estudianteDetalle.id)}
                disabled={
                  estadoGuardado === "saving" ||
                  !(textoEditar ?? "").trim() ||
                  esComentarioDeOtra
                }
                className="h-9 px-4 rounded-xl bg-navy text-white text-sm inline-flex items-center gap-2 disabled:opacity-40 cursor-pointer"
              >
                {estadoGuardado === "saving" ? (
                  <SpinnerGap size={14} className="animate-spin" />
                ) : null}
                Guardar comentario
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

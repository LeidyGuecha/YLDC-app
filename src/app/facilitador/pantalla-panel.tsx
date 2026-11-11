"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChatCircleText,
  Copy,
  Plus,
  SignOut,
  SpinnerGap,
  Stack,
  X,
} from "@phosphor-icons/react";
import { Badge, Logo, ModalConfirmar, Vacio } from "@/components/ui";
import { MarcoStaff } from "@/components/marco-staff";
import { cerrarSesion, miPerfil } from "@/lib/facilitador/auth";
import {
  cambiarEstado,
  cambiarFase,
  crearSesion,
  listarCoFacilitadores,
  listarComentariosGrupales,
  listarCursos,
  listarEstudiantesDeCurso,
  listarMisSesiones,
  listarResultadosHolland,
  listarProgresoTest,
  listarRespuestasDeSesion,
  listarTalleres,
  guardarComentarioGrupal,
} from "@/lib/facilitador/api";
import type {
  ComentarioGrupalPanel,
  CursoBreve,
  EstadoSesionPanel,
  EstudiantePanel,
  FacilitadorBreve,
  FaseSesionPanel,
  FilaRespuestaPanel,
  PerfilFacilitador,
  ProgresoTestPanel,
  ResultadoPanel,
  SesionPanel,
  TallerBreve,
} from "@/lib/facilitador/types";
import { mensajeAmable } from "@/lib/estudiante/api";
import { getSupabase } from "@/lib/supabase/client";
import { supabaseConfigurado } from "@/lib/supabase/config";

const ETIQUETA_FASE: Record<FaseSesionPanel, string> = {
  como_vengo: "Cómo vengo",
  actividad: "Actividad",
  como_voy: "Cómo voy",
};

const ETIQUETA_ESTADO: Record<EstadoSesionPanel, string> = {
  abierta: "Abierta",
  cerrada_pendiente: "Cerrada · pendiente de comentario",
  completada: "Completada",
};

function BadgeEstado({ estado }: { estado: EstadoSesionPanel }) {
  const variante =
    estado === "abierta" ? "yellow" : estado === "completada" ? "teal" : "pinkSoft";
  return <Badge variant={variante} dot>{ETIQUETA_ESTADO[estado]}</Badge>;
}

function fechaCorta(valor: string | null): string {
  if (!valor) return "—";
  return new Date(valor).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
  });
}

/** Resumen legible de una respuesta (texto / selección única / checklist). */
function resumenFila(r: FilaRespuestaPanel): string {
  const piezas: string[] = [];
  if (r.contenidoTexto) piezas.push(r.contenidoTexto);
  if (r.seleccionJson) {
    try {
      const s = JSON.parse(r.seleccionJson) as { seleccion?: string };
      if (s.seleccion) piezas.push(`Elección: ${s.seleccion}`);
    } catch {
      /* JSON malformado: se ignora esa parte */
    }
  }
  if (r.checklistJson) {
    try {
      const c = JSON.parse(r.checklistJson) as { opciones?: string[] };
      if (c.opciones?.length) piezas.push(`Opciones: ${c.opciones.join(", ")}`);
    } catch {
      /* ídem */
    }
  }
  return piezas.length > 0 ? piezas.join(" · ") : "(sin contenido)";
}

export function PantallaPanelFacilitador() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilFacilitador | null>(null);
  const [sesiones, setSesiones] = useState<SesionPanel[]>([]);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  const [talleres, setTalleres] = useState<TallerBreve[]>([]);
  const [cursos, setCursos] = useState<CursoBreve[]>([]);
  const [coFacilitadores, setCoFacilitadores] = useState<FacilitadorBreve[]>([]);

  const [formAbierto, setFormAbierto] = useState(false);
  const [tallerSel, setTallerSel] = useState("");
  const [cursoSel, setCursoSel] = useState("");
  const [coSel, setCoSel] = useState<string[]>([]);
  const [creando, setCreando] = useState(false);
  const [preguntarSalida, setPreguntarSalida] = useState(false);

  // Perfil + primera carga de datos (mockups 2.2–2.6, datos reales vía RLS)
  useEffect(() => {
    if (!supabaseConfigurado) return;
    (async () => {
      try {
        const p = await miPerfil();
        if (!p) {
          router.replace("/facilitador");
          return;
        }
        const [ss, ts, cs, cos] = await Promise.all([
          listarMisSesiones(),
          listarTalleres(),
          listarCursos(),
          listarCoFacilitadores(p.id),
        ]);
        setPerfil(p);
        setSesiones(ss);
        setTalleres(ts);
        setCursos(cs);
        setCoFacilitadores(cos);
      } catch (e) {
        setError(mensajeAmable(e));
      } finally {
        setCargando(false);
      }
    })();
  }, [router]);

  // Realtime de la lista: cambios de fase/estado hechos por la co-facilitadora
  // en otro dispositivo (el CREATE/UPDATE de sesiones llega por RLS Filter).
  useEffect(() => {
    if (!perfil || !supabaseConfigurado) return;
    const sb = getSupabase();
    if (!sb) return;
    const canal = sb
      .channel("panel-sesiones")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sesiones" },
        () => {
          void listarMisSesiones()
            .then((ss) => setSesiones(ss))
            .catch(() => {});
        },
      )
      .subscribe();
    return () => {
      void sb.removeChannel(canal);
    };
  }, [perfil]);

  async function alCrear() {
    if (!perfil || !tallerSel || !cursoSel) return;
    setCreando(true);
    setError("");
    try {
      const nueva = await crearSesion({
        tallerId: tallerSel,
        cursoId: cursoSel,
        coFacilitadoresIds: coSel,
      });
      setSesiones(await listarMisSesiones());
      setSeleccion(nueva.id);
      setFormAbierto(false);
      setTallerSel("");
      setCursoSel("");
      setCoSel([]);
    } catch (e) {
      setError(mensajeAmable(e));
    } finally {
      setCreando(false);
    }
  }

  function alternarCo(id: string) {
    setCoSel((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function alSalir() {
    await cerrarSesion();
    router.replace("/facilitador");
  }

  if (!supabaseConfigurado) {
    return (
      <main className="flex-1 grid place-items-center px-6 py-10">
        <div className="max-w-sm text-center flex flex-col gap-3">
          <Logo variant="color" height={40} />
          <p className="text-sm text-ink-2">
            El panel del facilitador trabaja contra la base de datos real.
            Configura <span className="font-mono text-navy">.env.local</span> con
            las credenciales de Supabase para usarlo.
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

  if (!perfil) return null; // ya redirigió a /facilitador

  const sesion = sesiones.find((s) => s.id === seleccion) ?? null;

  return (
    <MarcoStaff
      rol="Panel del facilitador"
      nombre={perfil.nombreCompleto}
      alSalir={() => setPreguntarSalida(true)}
      nav={[
        {
          etiqueta: "Nueva sesión",
          icono: <Plus size={16} />,
          activo: formAbierto && !seleccion,
          onClick: () => {
            setSeleccion(null);
            setFormAbierto(true);
          },
        },
        {
          etiqueta: "Mis sesiones",
          icono: <Stack size={16} />,
          activo: !formAbierto && !seleccion,
          onClick: () => {
            setSeleccion(null);
            setFormAbierto(false);
          },
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

      {sesion ? (
        <DetalleSesion
          sesion={sesion}
          perfil={perfil}
          alVolver={() => setSeleccion(null)}
          alActualizarLista={() => {
            void listarMisSesiones()
              .then((ss) => setSesiones(ss))
              .catch(() => {});
          }}
        />
      ) : (
        <section className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-navy">Tus sesiones</h1>
              <p className="text-xs text-ink-2">
                Como lead o co-facilitadora — {sesiones.length} en total
              </p>
            </div>
            <button
              onClick={() => setFormAbierto((v) => !v)}
              className="h-9 px-3 rounded-xl bg-navy text-white text-sm inline-flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
            >
              {formAbierto ? <X size={13} /> : <Plus size={13} />}
              {formAbierto ? "Cancelar" : "Nueva sesión"}
            </button>
          </div>

          {formAbierto && (
            <div className="bg-white rounded-2xl shadow-card p-5 flex flex-col gap-3">
              <p className="text-sm font-bold text-navy">
                Crear sesión (mockup 2.2)
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-navy">Taller</span>
                  <select
                    value={tallerSel}
                    onChange={(e) => setTallerSel(e.target.value)}
                    className="h-10 rounded-lg border border-stroke px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal"
                  >
                    <option value="">Elige el taller…</option>
                    {talleres.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.codigo} · Sesión {t.numeroSesion} — {t.titulo}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-navy">Curso</span>
                  <select
                    value={cursoSel}
                    onChange={(e) => setCursoSel(e.target.value)}
                    className="h-10 rounded-lg border border-stroke px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal"
                  >
                    <option value="">Elige el curso…</option>
                    {cursos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.etiqueta} — {c.colegioNombre}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-navy">
                  Co-facilitadoras (opcional)
                </span>
                {coFacilitadores.length === 0 ? (
                  <p className="text-xs text-ink-2">
                    Aún no hay otras facilitadoras activas — se crea solo
                    contigo como lead.
                  </p>
                ) : (
                  coFacilitadores.map((f) => (
                    <label
                      key={f.id}
                      className="flex items-center gap-2 text-xs text-ink cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={coSel.includes(f.id)}
                        onChange={() => alternarCo(f.id)}
                        className="accent-navy w-3.5 h-3.5 cursor-pointer"
                      />
                      {f.nombreCompleto}
                    </label>
                  ))
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={alCrear}
                  disabled={!tallerSel || !cursoSel || creando}
                  className="h-9 px-4 rounded-xl bg-navy text-white text-sm inline-flex items-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  {creando ? (
                    <SpinnerGap size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  Crear sesión
                </button>
              </div>
            </div>
          )}

          {sesiones.length === 0 && !formAbierto ? (
            <div className="bg-white rounded-2xl shadow-card p-8 text-center">
              <Vacio
                titulo="Nada acá todavía"
                texto="Crea la primera sesión de este taller: se genera su PIN para que las estudiantes entren."
                etiquetaAccion="Nueva sesión"
                alAccion={() => setFormAbierto(true)}
              />
            </div>
          ) : (
            <div className="grid gap-3">
              {sesiones.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSeleccion(s.id)}
                  className="text-left bg-white rounded-2xl shadow-card p-4 flex flex-col gap-2 hover:ring-2 hover:ring-teal cursor-pointer"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-navy">
                      {s.tallerTitulo || s.tallerCodigo || "Sesión"}
                    </p>
                    <BadgeEstado estado={s.estado} />
                  </div>
                  <p className="text-xs text-ink-2">
                    Taller {s.tallerCodigo} · Sesión {s.numeroSesion} ·{" "}
                    {s.cursoEtiqueta} · {s.colegioNombre}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="neutral">{ETIQUETA_FASE[s.faseActual]}</Badge>
                    <Badge variant="pinkSolid">PIN {s.pin}</Badge>
                    <Badge variant={s.leadId === perfil.id ? "pinkSoft" : "neutral"}>
                      {s.leadId === perfil.id ? "Lead" : "Co-facilitadora"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-ink-2">
                    {s.fechaCierre
                      ? `Cierre: ${fechaCorta(s.fechaCierre)}`
                      : `Creada: ${fechaCorta(s.creadoEn)}`}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </MarcoStaff>
  );
}

/* ───────────────── Detalle de una sesión ───────────────── */

function DetalleSesion({
  sesion,
  perfil,
  alVolver,
  alActualizarLista,
}: {
  sesion: SesionPanel;
  perfil: PerfilFacilitador;
  alVolver: () => void;
  alActualizarLista: () => void;
}) {
  const [estudiantes, setEstudiantes] = useState<EstudiantePanel[]>([]);
  const [respuestas, setRespuestas] = useState<FilaRespuestaPanel[]>([]);
  const [progreso, setProgreso] = useState<ProgresoTestPanel[]>([]);
  const [resultados, setResultados] = useState<ResultadoPanel[]>([]);
  const [comentarios, setComentarios] = useState<ComentarioGrupalPanel[]>([]);
  const [texto, setTexto] = useState("");
  const [estadoGuardado, setEstadoGuardado] = useState<
    "idle" | "saving" | "ok" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [accionando, setAccionando] = useState(false);
  const [detalleDe, setDetalleDe] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [enLinea, setEnLinea] = useState<{ id: string; nombre: string }[]>([]);
  const [preguntarCierre, setPreguntarCierre] = useState(false);

  // Carga (y recarga) del monitoreo + comentarios al entrar a la sesión
  useEffect(() => {
    let vivo = true;
    const id = sesion.id;
    (async () => {
      try {
        const [es, rs, pr, re, co] = await Promise.all([
          listarEstudiantesDeCurso(sesion.cursoId),
          listarRespuestasDeSesion(id),
          listarProgresoTest(id),
          listarResultadosHolland(id),
          listarComentariosGrupales(id),
        ]);
        if (!vivo) return;
        setEstudiantes(es);
        setRespuestas(rs);
        setProgreso(pr);
        setResultados(re);
        setComentarios(co);
        setDetalleDe(null);
        setEstadoGuardado("idle");
        setTexto(co.find((c) => c.facilitadorId === perfil.id)?.comentario ?? "");
      } catch (e) {
        if (vivo) setError(mensajeAmable(e));
      }
    })();
    return () => {
      vivo = false;
    };
  }, [sesion.id, sesion.cursoId, perfil.id]);

  // Realtime del monitoreo: respuestas de fase, test, resultados y comentarios
  // de ESTA sesión (la publication supabase_realtime filtra por RLS por cuenta).
  useEffect(() => {
    if (!supabaseConfigurado) return;
    const sb = getSupabase();
    if (!sb) return;
    const id = sesion.id;
    const refrescarMonitoreo = () => {
      void listarRespuestasDeSesion(id)
        .then((rs) => setRespuestas(rs))
        .catch(() => {});
      void listarProgresoTest(id)
        .then((pr) => setProgreso(pr))
        .catch(() => {});
      void listarResultadosHolland(id)
        .then((re) => setResultados(re))
        .catch(() => {});
    };
    const refrescarComentarios = () => {
      void listarComentariosGrupales(id)
        .then((co) => setComentarios(co))
        .catch(() => {});
    };
    const refrescarEstudiantes = () => {
      void listarEstudiantesDeCurso(sesion.cursoId)
        .then((es) => setEstudiantes(es))
        .catch(() => {});
    };
    const canal = sb
      .channel(`panel-sesion-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "respuestas", filter: `sesion_id=eq.${id}` },
        refrescarMonitoreo,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "respuestas_test_holland", filter: `sesion_id=eq.${id}` },
        refrescarMonitoreo,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "resultados_test_holland", filter: `sesion_id=eq.${id}` },
        refrescarMonitoreo,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comentarios_grupales", filter: `sesion_id=eq.${id}` },
        refrescarComentarios,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "estudiantes", filter: `curso_id=eq.${sesion.cursoId}` },
        refrescarEstudiantes,
      )
      .subscribe();
    return () => {
      void sb.removeChannel(canal);
    };
  }, [sesion.id, sesion.cursoId]);

  // PRESENCIA: quiénes tienen la pantalla del estudiante abierta ahora mismo.
  // La estudiante se registra con canal.track (key = su id) y decae al cerrar.
  useEffect(() => {
    if (!supabaseConfigurado) return;
    const sb = getSupabase();
    if (!sb) return;
    const id = sesion.id;
    const canal = sb.channel(`sesion:${id}`);
    canal.on("presence", { event: "sync" }, () => {
      const estado = canal.presenceState() as unknown as Record<
        string,
        { nombre: string; estudiante_id: string }[]
      >;
      const lista = Object.values(estado).flatMap((presencias) =>
        presencias.map((p) => ({ id: p.estudiante_id, nombre: p.nombre })),
      );
      setEnLinea(lista);
    });
    canal.subscribe();
    return () => {
      void sb.removeChannel(canal);
    };
  }, [sesion.id]);

  async function alFase(fase: FaseSesionPanel) {
    if (fase === sesion.faseActual) return;
    setError("");
    try {
      await cambiarFase(sesion.id, fase);
      alActualizarLista();
    } catch (e) {
      setError(mensajeAmable(e));
    }
  }

  async function alEstado(nuevo: EstadoSesionPanel) {
    if (nuevo === "cerrada_pendiente") {
      setPreguntarCierre(true); // la confirmación va por el modal del diseño
      return;
    }
    await ejecutarCambio(nuevo);
  }

  async function ejecutarCambio(nuevo: EstadoSesionPanel) {
    setAccionando(true);
    setError("");
    try {
      await cambiarEstado(sesion.id, nuevo);
      alActualizarLista();
    } catch (e) {
      setError(mensajeAmable(e));
    } finally {
      setAccionando(false);
    }
  }

  async function alGuardarComentario() {
    if (!texto.trim()) return;
    setEstadoGuardado("saving");
    setError("");
    try {
      await guardarComentarioGrupal(sesion.id, perfil.id, texto.trim());
      setComentarios(await listarComentariosGrupales(sesion.id));
      setEstadoGuardado("ok");
    } catch (e) {
      setError(mensajeAmable(e));
      setEstadoGuardado("error");
    }
  }

  function alCopiarPin() {
    void navigator.clipboard
      .writeText(sesion.pin)
      .then(() => setCopiado(true))
      .catch(() => {});
  }

  const porEstudiante = useMemo(() => {
    const mapa = new Map<
      string,
      { como_vengo: number; actividad: number; como_voy: number }
    >();
    for (const r of respuestas) {
      const e =
        mapa.get(r.estudianteId) ?? { como_vengo: 0, actividad: 0, como_voy: 0 };
      e[r.tipo] = (e[r.tipo] ?? 0) + 1;
      mapa.set(r.estudianteId, e);
    }
    return mapa;
  }, [respuestas]);

  const progresoMap = useMemo(
    () => new Map(progreso.map((p) => [p.estudianteId, p.respondidas])),
    [progreso],
  );
  const resultadoMap = useMemo(
    () => new Map(resultados.map((r) => [r.estudianteId, r.codigoHolland])),
    [resultados],
  );

  const otros = comentarios.filter((c) => c.facilitadorId !== perfil.id);

  return (
    <div className="flex flex-col gap-5">
      <button
        onClick={alVolver}
        className="self-start inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-navy cursor-pointer"
      >
        <ArrowLeft size={15} /> Todas las sesiones
      </button>

      {/* Encabezado + controles */}
      <section className="bg-white rounded-2xl shadow-card p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-navy">
              {sesion.tallerTitulo || sesion.tallerCodigo || "Sesión"}
            </h2>
            <p className="text-xs text-ink-2">
              Taller {sesion.tallerCodigo} · Sesión {sesion.numeroSesion} ·{" "}
              {sesion.cursoEtiqueta} · {sesion.colegioNombre}
            </p>
            <p className="text-[11px] text-ink-2 mt-1">
              {sesion.fechaCierre
                ? `Cierre: ${fechaCorta(sesion.fechaCierre)}`
                : `Creada: ${fechaCorta(sesion.creadoEn)}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BadgeEstado estado={sesion.estado} />
            <button
              onClick={alCopiarPin}
              title="Copiar el PIN para compartirlo"
              className="cursor-pointer"
            >
              <Badge variant="pinkSolid">
                PIN {sesion.pin} <Copy size={11} /> {copiado ? "Copiado" : ""}
              </Badge>
            </button>
          </div>
        </div>

        {sesion.estado === "abierta" && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-widest text-ink-2 mr-1">
                Fase actual
              </span>
              {(Object.keys(ETIQUETA_FASE) as FaseSesionPanel[]).map((f) => (
                <button
                  key={f}
                  onClick={() => alFase(f)}
                  disabled={f === sesion.faseActual}
                  className={`h-8 px-3 rounded-lg text-xs cursor-pointer ${
                    f === sesion.faseActual
                      ? "bg-navy text-white"
                      : "bg-platinum text-ink hover:ring-2 hover:ring-teal"
                  }`}
                >
                  {ETIQUETA_FASE[f]}
                </button>
              ))}
            </div>
            <div className="pt-3 border-t border-stroke flex flex-wrap gap-2">
              <button
                onClick={() => alEstado("cerrada_pendiente")}
                disabled={accionando}
                className="h-9 px-4 rounded-xl border border-pink text-pink text-sm hover:bg-tint-pink disabled:opacity-40 cursor-pointer"
              >
                {accionando ? (
                  <SpinnerGap size={14} className="animate-spin" />
                ) : null}
                Finalizar sesión
              </button>
            </div>
          </>
        )}

        {/* Confirmación del cierre de taller (modal del diseño) */}
        <ModalConfirmar
          abierto={preguntarCierre}
          titulo="¿Cerrar la sesión?"
          texto="Las estudiantes dejarán de poder entrar con el PIN. Si te equivocas, la puedes reabrir aquí mismo."
          etiquetaNo="No, aún no"
          etiquetaSi="Sí, cerrar sesión"
          peligro
          cargando={accionando}
          alConfirmar={() => {
            setPreguntarCierre(false);
            void ejecutarCambio("cerrada_pendiente");
          }}
          alCancelar={() => setPreguntarCierre(false)}
        />

        {sesion.estado === "cerrada_pendiente" && (
          <div className="pt-3 border-t border-stroke flex flex-wrap gap-2">
            <p className="w-full text-xs text-ink-2">
              La sesión está cerrada para estudiantes. Deja tu comentario
              grupal y márcala completada cuando el equipo termine.
            </p>
            <button
              onClick={() => alEstado("completada")}
              disabled={accionando}
              className="h-9 px-4 rounded-xl bg-teal text-white text-sm hover:opacity-90 disabled:opacity-40 cursor-pointer"
            >
              Marcar completada
            </button>
            <button
              onClick={() => alEstado("abierta")}
              disabled={accionando}
              className="h-9 px-4 rounded-xl bg-platinum text-ink text-sm hover:ring-2 hover:ring-teal disabled:opacity-40 cursor-pointer"
            >
              Reabrir
            </button>
          </div>
        )}

        {sesion.estado === "completada" && (
          <div className="pt-3 border-t border-stroke">
            <button
              onClick={() => alEstado("abierta")}
              disabled={accionando}
              className="h-9 px-4 rounded-xl bg-platinum text-ink text-sm hover:ring-2 hover:ring-teal disabled:opacity-40 cursor-pointer"
            >
              Reabrir sesión
            </button>
          </div>
        )}
      </section>

      {/* Monitoreo en vivo */}
      <section className="bg-white rounded-2xl shadow-card p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-navy">
            Monitoreo en vivo ({
              estudiantes.filter((e) => e.activo).length
            }{" "}
            estudiantes activos)
          </h3>
          <Badge variant="pinkSoft" dot>tiempo real</Badge>
        </div>

        {enLinea.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-widest text-teal">
              Conectadas ahora:
            </span>
            {enLinea.map((e) => (
              <Badge key={e.id} variant="teal" dot>{e.nombre}</Badge>
            ))}
          </div>
        )}

        {estudiantes.length === 0 ? (
          <p className="text-xs text-ink-2">
            Este curso aún no tiene estudiantes cargados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-ink-2">
                  <th className="py-2 pr-3 font-medium">Estudiante</th>
                  <th className="py-2 pr-3 font-medium text-center">Cómo vengo</th>
                  <th className="py-2 pr-3 font-medium text-center">Actividad</th>
                  <th className="py-2 pr-3 font-medium text-center">Cómo voy</th>
                  <th className="py-2 pr-3 font-medium">Test de Holland</th>
                  <th className="py-2 font-medium">Código</th>
                </tr>
              </thead>
              <tbody>
                {estudiantes.map((est) => {
                  const grupos = porEstudiante.get(est.id);
                  const respondidas = progresoMap.get(est.id) ?? 0;
                  const codigo = resultadoMap.get(est.id);
                  const abierto = detalleDe === est.id;
                  return (
                    <Fragment key={est.id}>
                      <tr
                        onClick={() => setDetalleDe(abierto ? null : est.id)}
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
                        {(["como_vengo", "actividad", "como_voy"] as FaseSesionPanel[]).map(
                          (f) => {
                            const n = grupos?.[f] ?? 0;
                            return (
                              <td key={f} className="py-2.5 pr-3 text-center">
                                <span
                                  className={
                                    n > 0
                                      ? "text-xs font-medium text-teal"
                                      : "text-xs text-ink-2"
                                  }
                                >
                                  {n > 0 ? `${n} ✓` : "—"}
                                </span>
                              </td>
                            );
                          },
                        )}
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-platinum rounded-full overflow-hidden">
                              <div
                                className="h-full bg-teal"
                                style={{
                                  width: `${Math.min(100, (respondidas / 300) * 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-ink-2">
                              {respondidas}/300
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5">
                          {codigo ? (
                            <Badge variant="teal">{codigo}</Badge>
                          ) : (
                            <span className="text-xs text-ink-2">—</span>
                          )}
                        </td>
                      </tr>
                      {abierto && (
                        <tr>
                          <td colSpan={6} className="bg-tint-navy px-4 pb-3">
                            {respuestas.filter(
                              (r) => r.estudianteId === est.id,
                            ).length === 0 ? (
                              <p className="text-xs text-ink-2 py-2">
                                Aún no envía respuestas en esta sesión.
                              </p>
                            ) : (
                              <ul className="flex flex-col gap-1.5 py-1">
                                {respuestas
                                  .filter((r) => r.estudianteId === est.id)
                                  .map((r) => (
                                    <li
                                      key={r.id}
                                      className="text-xs text-ink flex gap-2"
                                    >
                                      <span className="font-medium text-navy min-w-24">
                                        {ETIQUETA_FASE[r.tipo]}
                                      </span>
                                      <span className="flex-1">
                                        {resumenFila(r)}
                                      </span>
                                    </li>
                                  ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[11px] text-ink-2">
          Toca a un estudiante para ver sus respuestas. La tabla se actualiza
          sola cuando el curso envía (mockup 2.4).
        </p>
      </section>

      {/* Comentario grupal */}
      <section className="bg-white rounded-2xl shadow-card p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ChatCircleText size={16} className="text-teal" />
          <h3 className="text-sm font-bold text-navy">Comentario grupal</h3>
        </div>

        {otros.map((c) => (
          <div
            key={c.id}
            className="bg-tint-teal rounded-xl px-3 py-2 text-xs text-ink"
          >
            <span className="font-medium text-navy">
              {c.facilitadorId === perfil.id
                ? "Tú"
                : "Otra facilitadora"}{" "}
            </span>
            <span className="text-ink-2">· {fechaCorta(c.fecha)}</span>
            <p className="mt-1 whitespace-pre-wrap">{c.comentario}</p>
          </div>
        ))}
        {otros.length > 0 && (
          <p className="text-[11px] text-ink-2">
            Comentario(s) de otra(s) facilitadora(s) de esta sesión — solo
            lectura.
          </p>
        )}

        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          placeholder="Escribe tu comentario grupal para el cierre de la sesión…"
          className="w-full rounded-xl border border-stroke p-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal"
        />

        {estadoGuardado === "ok" && (
          <p className="text-xs text-teal">Comentario guardado.</p>
        )}
        {estadoGuardado === "error" && (
          <p className="text-xs text-pink">
            {error || "No se pudo guardar el comentario."}
          </p>
        )}

        <div className="flex justify-end">
          <button
            onClick={alGuardarComentario}
            disabled={estadoGuardado === "saving" || !texto.trim()}
            className="h-9 px-4 rounded-xl bg-navy text-white text-sm inline-flex items-center gap-2 disabled:opacity-40 cursor-pointer"
          >
            {estadoGuardado === "saving" ? (
              <SpinnerGap size={14} className="animate-spin" />
            ) : null}
            Guardar comentario
          </button>
        </div>
        <p className="text-[11px] text-ink-2">
          Hay un comentario tuyo por sesión — puedes editarlo cuantas veces
          necesites (mockup 2.5–2.6).
        </p>
      </section>

      {error && (
        <p className="text-xs text-pink bg-tint-pink rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}

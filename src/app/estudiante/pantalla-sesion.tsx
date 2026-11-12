"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CloudLightning,
  CloudSun,
  Sun,
  Cloud,
  CloudRain,
  Check,
  SpinnerGap,
  Lightning,
} from "@phosphor-icons/react";
import { Badge, Stepper } from "@/components/ui";
import { MarcoEstudiante } from "@/components/marco-estudiante";
import {
  listarMisRespuestas,
  mensajeAmable,
  guardarRespuestaFase,
  mostrarSesionInfo,
  supabaseConfigurado,
  verResultadoPropio,
} from "@/lib/estudiante/api";
import {
  alSimularCambio,
  mockCerrarSesion,
  mockPonerFase,
  mockResetearSesion,
} from "@/lib/estudiante/mock";
import { borrarContexto, leerContexto } from "@/lib/estudiante/sesion-local";
import { getSupabase } from "@/lib/supabase/client";
import {
  BATERIA_FASES,
  ETIQUETA_FASE,
  ORDEN_FASES,
  type PreguntaFase,
} from "@/lib/estudiante/preguntas";
import {
  ErrorEstudiante,
  type ContextoEstudiante,
  type FaseSesion,
  type FilaRespuesta,
  type InfoSesion,
  type ResultadoHolland,
} from "@/lib/estudiante/types";

/*
  Sesión en vivo del estudiante (pantallas 1.3–1.10), flujo de la sesión 4:
   · fase como_vengo → clima (5 opciones) + porqué del clima (voluntaria) (1.4)
   · fase actividad  → primero el test de Holland (tarjeta-puerta) y luego las
     4 preguntas de reflexión sobre la descripción de su perfil (1.5)
   · fase como_voy   → 1 característica a potenciar + 1 a cambiar/mejorar (1.6)
   · sus respuestas se AUTOguardan por pregunta (fn_guardar_respuesta es upsert)
   · el estado/fase se sondea cada 10 s (en real) o lo mueve el simulador (demo)
   · al cerrar la sesión: pantalla de gracias + resumen propio (1.9/1.10)
*/

type EstadoGuardado = "idle" | "saving" | "saved" | "error";

export function PantallaSesion() {
  const router = useRouter();
  const [contexto, setContexto] = useState<ContextoEstudiante | null>(null);

  // 1) contexto del navegador (una sola pasada en el cliente)
  useEffect(() => {
    const ctx = leerContexto();
    if (!ctx) {
      router.replace("/estudiante");
      return;
    }
    // lectura única de localStorage tras hidratar
    setContexto(ctx);
  }, [router]);

  if (!contexto) {
    return (
      <MarcoEstudiante>
        <div className="grid flex-1 place-items-center text-sm text-ink-2">
          Cargando tu sesión…
        </div>
      </MarcoEstudiante>
    );
  }

  return (
    <CuerpoSesion
      contexto={contexto}
      alSalir={() => {
        borrarContexto();
        router.push("/estudiante");
      }}
    />
  );
}

/* ───────────────── Estados de la sesión ───────────────── */

function CuerpoSesion({
  contexto,
  alSalir,
}: {
  contexto: ContextoEstudiante;
  alSalir: () => void;
}) {
  const [sesion, setSesion] = useState<InfoSesion | null>(null);
  const [errorConexion, setErrorConexion] = useState("");
  const [mias, setMias] = useState<FilaRespuesta[]>([]);
  const temporizador = useRef<ReturnType<typeof setInterval> | null>(null);

  const refrescar = useCallback(async () => {
    try {
      const info = await mostrarSesionInfo(contexto.pin);
      setSesion(info);
      setErrorConexion("");
    } catch (error) {
      if (error instanceof ErrorEstudiante && error.code === "PIN_INVALIDO") {
        alSalir(); // el contexto quedó obsoleto — identícate otra vez
        return;
      }
      setErrorConexion(mensajeAmable(error));
    }
  }, [contexto.pin, alSalir]);

  // real: sondeo cada 10 s (RLS cerrada ⇒ realtime de sesiones no llega a anon)
  // demo: el simulador mueve la sesión y avisa por evento
  useEffect(() => {
    // primer sondeo de estado tras montar
    void refrescar();
    let quitarSimulador: (() => void) | null = null;
    if (supabaseConfigurado) {
      temporizador.current = setInterval(refrescar, 10_000);
    } else {
      quitarSimulador = alSimularCambio(() => refrescar());
    }
    return () => {
      if (temporizador.current) clearInterval(temporizador.current);
      quitarSimulador?.();
    };
  }, [refrescar]);

  // PRESENCIA: la estudiante se marca en el canal de la sesión para que el
  // monitor del facilitador la muestre como conectada (mockup 2.4).
  // La key de presencia es su id: dos pestañas de la misma estudiante no duplican.
  useEffect(() => {
    if (!supabaseConfigurado) return;
    const sb = getSupabase();
    if (!sb) return;
    const canal = sb.channel(`sesion:${contexto.sesionId}`, {
      config: { presence: { key: contexto.estudianteId } },
    });
    canal.subscribe((estado) => {
      if (estado === "SUBSCRIBED") {
        void canal.track({
          nombre: contexto.nombre,
          estudiante_id: contexto.estudianteId,
        });
      }
    });
    return () => {
      void canal.untrack();
      void sb.removeChannel(canal);
    };
  }, [contexto.sesionId, contexto.estudianteId, contexto.nombre]);

  // respuestas propias (al unirse y cuando cambia la fase)
  useEffect(() => {
    void listarMisRespuestas({
      pin: contexto.pin,
      estudianteId: contexto.estudianteId,
    })
      .then(setMias)
      .catch(() => setMias([]));
  }, [contexto.pin, contexto.estudianteId, sesion?.faseActual]);

  if (!sesion) {
    return (
      <MarcoEstudiante>
        <div className="grid flex-1 place-items-center text-sm text-ink-2">
          {errorConexion || "Conectando con la sesión…"}
        </div>
      </MarcoEstudiante>
    );
  }

  const cerrada = sesion.estado !== "abierta";

  return (
    <MarcoEstudiante
      acciones={<BadgeEstado estado={sesion.estado} />}
      pie={
        <Link
          href="/"
          className="hover:text-white underline underline-offset-2"
        >
          ← Volver al inicio
        </Link>
      }
    >
      <EncabezadoSesion sesion={sesion} nombre={contexto.nombre} />

      {errorConexion && (
        <p className="text-xs text-pink bg-tint-pink rounded-lg px-4 py-2">
          {errorConexion} — reintentando automáticamente.
        </p>
      )}

      {cerrada ? (
        <PantallaCerrada alSalir={alSalir} />
      ) : (
        <>
          <FaseActiva contexto={contexto} sesion={sesion} mias={mias} />
          {!supabaseConfigurado && <SimuladorFases pin={contexto.pin} />}
        </>
      )}
    </MarcoEstudiante>
  );
}

/* ───────────────── Encabezado ───────────────── */

const ETIQUETA_ESTADO: Record<InfoSesion["estado"], string> = {
  abierta: "Sesión en curso",
  cerrada_pendiente: "Cerrando…",
  completada: "Sesión terminada",
};

function EncabezadoSesion({
  sesion,
  nombre,
}: {
  sesion: InfoSesion;
  nombre: string;
}) {
  return (
    <header className="flex flex-col gap-2">
      <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-teal">
        YLDC · Sesión {sesion.numeroSesion} · {sesion.curso}
      </p>
      <h1 className="text-xl font-bold text-navy lg:text-[28px]">
        {sesion.taller}
      </h1>
      <p className="text-xs text-ink-2">
        Hola, {nombre.split(" ")[0]} — estás respondiendo como{" "}
        <span className="font-medium text-navy">{nombre}</span>
      </p>
    </header>
  );
}

function BadgeEstado({ estado }: { estado: InfoSesion["estado"] }) {
  // variantes del design system: yellow=activo · pinkSoft=pendiente · teal=terminada
  const variante =
    estado === "abierta"
      ? "yellow"
      : estado === "completada"
      ? "teal"
      : "pinkSoft";
  return (
    <Badge variant={variante} dot>
      {ETIQUETA_ESTADO[estado]}
    </Badge>
  );
}

/* ───────────────── Fases ───────────────── */

function FaseActiva({
  contexto,
  sesion,
  mias,
}: {
  contexto: ContextoEstudiante;
  sesion: InfoSesion;
  mias: FilaRespuesta[];
}) {
  const fase = sesion.faseActual;
  const preguntas = BATERIA_FASES[fase];
  const indice = ORDEN_FASES.indexOf(fase);

  // Puerta del test (flujo sesión 4): en la fase de actividad las preguntas
  // se activan cuando la estudiante ya calculó su código de Holland.
  const [resultado, setResultado] = useState<ResultadoHolland | null>(null);
  useEffect(() => {
    if (fase !== "actividad") {
      setResultado(null);
      return;
    }
    let vigente = true;
    verResultadoPropio(contexto.pin, contexto.estudianteId)
      .then((r) => {
        if (vigente) setResultado(r);
      })
      .catch(() => {
        if (vigente) setResultado(null);
      });
    return () => {
      vigente = false;
    };
  }, [fase, contexto.pin, contexto.estudianteId]);
  const testListo = resultado !== null;

  return (
    <section className="flex flex-col gap-5">
      {/* progresión de fases — barrita del diseño (dots + labels) */}
      <Stepper current={indice as 0 | 1 | 2} className="max-w-sm" />

      {/* paso 1 de la actividad: el test de Holland (tal cual el flujo de la sesión 4) */}
      {fase === "actividad" && <PuertaTest resultado={resultado} />}

      {/* las tarjetas de la fase en fila en escritorio (mockup 1.4 / 1.6) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(360px,1fr))]">
        {preguntas.map((p) => (
          <PreguntaPiloto
            key={p.id}
            pregunta={p}
            fase={fase}
            contexto={contexto}
            filaPrevio={mias.find((m) => m.tipo === fase && m.pregunta_id === p.id)}
            bloqueada={fase === "actividad" && !testListo}
          />
        ))}
      </div>
    </section>
  );
}

/* ───────────────── Puerta del test (fase actividad — sesión 4) ───────────────── */

function PuertaTest({ resultado }: { resultado: ResultadoHolland | null }) {
  return (
    <article className="bg-white rounded-2xl shadow-card p-6 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-tint-teal grid place-items-center">
          <Lightning size={18} className="text-teal" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-navy">
            Paso 1 — Responde el test de Tipología Holland
          </p>
          <p className="text-xs text-ink-2">
            Al terminarlo se calcula tu código y ves la descripción de cada
            tipología. Respóndelo con honestidad: no hay resultados buenos ni
            malos.
          </p>
        </div>
      </div>

      {resultado ? (
        <div className="rounded-xl bg-tint-teal px-4 py-3 flex items-center gap-3 flex-wrap">
          <p className="text-sm text-navy flex-1 min-w-[14rem]">
            ¡Listo! Tu código es{" "}
            <span className="font-bold tracking-[0.15em]">
              {resultado.codigoHolland}
            </span>
          </p>
          <Link
            href="/estudiante/test"
            className="h-9 px-4 inline-flex items-center text-sm rounded-xl border border-navy text-navy bg-white hover:bg-tint-navy transition-colors"
          >
            Ver mi resultado
          </Link>
        </div>
      ) : (
        <Link
          href="/estudiante/test"
          className="self-start h-10 px-5 inline-flex items-center text-sm rounded-xl bg-navy text-white hover:opacity-90 transition-opacity"
        >
          Ir al test
        </Link>
      )}

      <p className="text-xs text-ink-2">
        Después del test viene la actividad en grupo: el cartel de tu tipología
        es presencial, con tus facilitadores.
      </p>
    </article>
  );
}

/* ───────────────── Pregunta individual con autoguardado ───────────────── */

interface ValorPregunta {
  texto: string;
  seleccion: string | null;
  checklist: string[];
}

function valorInicial(p: PreguntaFase, fila?: FilaRespuesta): ValorPregunta {
  const vacio = { texto: "", seleccion: null, checklist: [] };
  if (!fila) return vacio;
  try {
    return {
      texto: fila.contenido_texto ?? "",
      seleccion: fila.contenido_seleccion_json
        ? ((JSON.parse(fila.contenido_seleccion_json) as { seleccion?: string })
            .seleccion ?? null)
        : null,
      checklist: fila.contenido_checklist_json
        ? ((JSON.parse(fila.contenido_checklist_json) as { opciones?: string[] })
            .opciones ?? [])
        : [],
    };
  } catch {
    return vacio;
  }
}

function PreguntaPiloto({
  pregunta,
  fase,
  contexto,
  filaPrevio,
  bloqueada = false,
}: {
  pregunta: PreguntaFase;
  fase: FaseSesion;
  contexto: ContextoEstudiante;
  filaPrevio?: FilaRespuesta;
  /** En la sesión 4: preguntas de actividad cerradas hasta terminar el test. */
  bloqueada?: boolean;
}) {
  // useMemo innecesario: el initializer perezoso del useState basta
  const [valor, setValor] = useState<ValorPregunta>(() =>
    valorInicial(pregunta, filaPrevio),
  );
  const [guardado, setGuardar] = useState<EstadoGuardado>("idle");

  // upsert idempotente (uq_respuesta_unica): reenviar sobrescribe — seguro
  const enviar = useCallback(
    async (v: ValorPregunta) => {
      setGuardar("saving");
      try {
        await guardarRespuestaFase({
          pin: contexto.pin,
          estudianteId: contexto.estudianteId,
          tipo: fase,
          preguntaId: pregunta.id,
          texto: pregunta.tipo === "seleccion" ? null : v.texto || null,
          seleccion: pregunta.tipo === "seleccion" ? v.seleccion : null,
          checklist: pregunta.tipo === "checklist" ? v.checklist : null,
        });
        setGuardar("saved");
      } catch {
        setGuardar("error");
      }
    },
    [contexto.estudianteId, contexto.pin, fase, pregunta.id, pregunta.tipo],
  );

  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const programar = useCallback(
    (v: ValorPregunta) => {
      if (temporizador.current) clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => enviar(v), 700);
    },
    [enviar],
  );

  // selección: guardar de inmediato. texto/checklist: con retraso (autoguardado)
  function actualizar(parcial: Partial<ValorPregunta>, inmediato = false) {
    setValueAndSchedule({ ...valor, ...parcial }, inmediato);
  }
  function setValueAndSchedule(v: ValorPregunta, inmediato: boolean) {
    setValor(v);
    if (inmediato) void enviar(v);
    else programar(v);
  }

  return (
    <article
      className={`bg-white rounded-2xl shadow-card p-6 flex flex-col gap-4 ${
        bloqueada ? "opacity-60" : ""
      }`}
    >
      <header className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-navy">{pregunta.enunciado}</p>
        {pregunta.opcional && (
          <span className="text-[11px] font-medium text-teal shrink-0 pt-0.5">
            Voluntaria
          </span>
        )}
        <MarcaGuardado estado={guardado} />
      </header>

      {/* — select única: los climas (mockup 1.4) — */}
      {pregunta.tipo === "seleccion" && pregunta.opciones && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {pregunta.opciones.map((o) => {
            const activo = valor.seleccion === o.id;
            return (
              <button
                key={o.id}
                type="button"
                disabled={bloqueada}
                onClick={() => actualizar({ seleccion: o.id }, true)}
                aria-pressed={activo}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 text-sm transition-colors ${
                  bloqueada
                    ? "border-stroke text-ink cursor-not-allowed"
                    : activo
                    ? "border-navy bg-tint-navy text-navy font-medium cursor-pointer"
                    : "border-stroke text-ink hover:border-navy/60 hover:bg-tint-pink cursor-pointer"
                }`}
              >
                <IconoClima icono={o.icono} activo={activo} />
                {o.texto}
              </button>
            );
          })}
        </div>
      )}

      {/* — checklist (actividad) — */}
      {pregunta.tipo === "checklist" && pregunta.opciones && (
        <div className="flex flex-col gap-2">
          {pregunta.opciones.map((o) => {
            const activo = valor.checklist.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                role="checkbox"
                aria-checked={activo}
                onClick={() =>
                  actualizar(
                    {
                      checklist: activo
                        ? valor.checklist.filter((x) => x !== o.id)
                        : [...valor.checklist, o.id],
                    },
                    false,
                  )
                }
                className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm text-left transition-colors cursor-pointer ${
                  activo
                    ? "border-navy bg-tint-navy text-navy font-medium"
                    : "border-stroke text-ink hover:border-navy/60"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                    activo ? "border-yellow bg-yellow" : "border-stroke bg-white"
                  }`}
                >
                  {activo && <Check size={12} weight="bold" className="text-navy" />}
                </span>
                {o.texto}
              </button>
            );
          })}
        </div>
      )}

      {/* — texto libre (con mínimo si lo trae la pregunta) — */}
      {pregunta.tipo === "texto" && (
        <div className="flex flex-col gap-1.5">
          <textarea
            rows={5}
            value={valor.texto}
            disabled={bloqueada}
            placeholder={
              pregunta.opcional
                ? "Si quieres, cuéntanoslo — es voluntaria."
                : "Tómate tu tiempo — lo que escribas ayuda a tu facilitador y a tu psicóloga a acompañarte."
            }
            onChange={(e) => actualizar({ texto: e.target.value })}
            className={`w-full px-4 text-sm rounded-lg border border-stroke bg-white text-ink placeholder:text-ink-disabled focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal ${
              bloqueada ? "cursor-not-allowed" : ""
            }`}
          />
          {pregunta.minCaracteres ? (
            <span
              className={`text-xs ${
                valor.texto.length >= pregunta.minCaracteres
                  ? "text-teal"
                  : "text-ink-2"
              }`}
            >
              {valor.texto.length} / {pregunta.minCaracteres} mínimo — se guarda
              solo mientras escribes
            </span>
          ) : (
            <span className="text-xs text-ink-2">
              Voluntaria — puedes dejarla vacía; si escribes, se guarda mientras
              lo haces
            </span>
          )}
        </div>
      )}

      {/* — frase a completar — */}
      {pregunta.tipo === "frase_a_completar" && pregunta.frase && (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-ink">
            <span className="font-medium text-navy">“{pregunta.frase.antes}</span>{" "}
            <input
              value={valor.texto}
              onChange={(e) => actualizar({ texto: e.target.value })}
              placeholder="…"
              className="inline-block border-b-2 border-b-teal focus:border-b-navy outline-none text-sm text-navy bg-transparent min-w-[14rem] px-1"
            />
            <span className="font-medium text-navy">…”</span>
          </p>
        </div>
      )}
    </article>
  );
}

function IconoClima({
  icono,
  activo,
}: {
  icono?: "soleado" | "parcial" | "nublado" | "lluvioso" | "tormenta";
  activo: boolean;
}) {
  const tamano = 28;
  const color = activo ? "#2c2453" : "#6b6f76";
  switch (icono) {
    case "soleado":
      return <Sun size={tamano} color={color} weight="fill" />;
    case "parcial":
      return <CloudSun size={tamano} color={color} />;
    case "nublado":
      return <Cloud size={tamano} color={color} />;
    case "lluvioso":
      return <CloudRain size={tamano} color={color} />;
    case "tormenta":
      return <CloudLightning size={tamano} color={color} />;
    default:
      return null;
  }
}

function MarcaGuardado({ estado }: { estado: EstadoGuardado }) {
  if (estado === "idle") return null;
  const mapa: Record<Exclude<EstadoGuardado, "idle">, { texto: string; clase: string; hora?: boolean }> = {
    saving: { texto: "", clase: "text-ink-2" },
    saved: { texto: "Guardado", clase: "text-teal" },
    error: { texto: "Sin guardar", clase: "text-pink" },
  };
  const m = mapa[estado];
  return (
    <span className={`text-xs shrink-0 inline-flex items-center gap-1 ${m.clase}`}>
      {estado === "saving" ? (
        <SpinnerGap size={14} className="animate-spin" />
      ) : estado === "saved" ? (
        <Check size={14} weight="bold" />
      ) : null}
      {m.texto}
    </span>
  );
}

/* ───────────────── Sesión cerrada (1.9 / 1.10) ───────────────── */

function PantallaCerrada({
  alSalir,
}: {
  alSalir: () => void;
}) {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <article className="bg-white rounded-2xl shadow-card p-8 text-center flex flex-col items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-tint-teal grid place-items-center">
          <Check size={24} weight="bold" className="text-teal" />
        </div>
        <h2 className="text-lg font-bold text-navy">
          ¡Gracias por tu sesión!
        </h2>
        <p className="text-sm text-ink-2 max-w-sm">
          El facilitador revisa en breve tus respuestas junto con las de todo
          el curso. Sin comentarios de nadie más: solo tú, tu facilitadora y
          tu psicóloga.
        </p>
      </article>

      <button
        type="button"
        onClick={alSalir}
        className="self-center h-10 px-5 text-sm rounded-xl border border-navy text-navy bg-white hover:bg-tint-navy transition-colors cursor-pointer"
      >
        Salir (borra tu registro en este navegador)
      </button>
    </section>
  );
}

/* ───────────────── Simulador (solo modo demo) ───────────────── */

function SimuladorFases({ pin }: { pin: string }) {
  return (
    <article className="rounded-2xl border-2 border-dashed border-teal bg-tint-teal/40 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-navy">
          Simulador demo — actúa como el facilitador
        </p>
        <span className="text-[10px] text-ink-2">solo visible en modo demo</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["como_vengo", "actividad", "como_voy"] as FaseSesion[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => mockPonerFase(pin, f)}
            className="h-8 px-3 text-xs rounded-lg border border-navy text-navy bg-white hover:bg-tint-navy cursor-pointer"
          >
            Ir a {ETIQUETA_FASE[f]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => mockCerrarSesion(pin)}
          className="h-8 px-3 text-xs rounded-lg border border-pink text-pink bg-white hover:bg-tint-pink cursor-pointer"
        >
          Cerrar sesión
        </button>
        <button
          type="button"
          onClick={() => mockResetearSesion(pin)}
          className="h-8 px-3 text-xs rounded-lg border border-stroke text-ink-2 bg-white hover:bg-platinum cursor-pointer"
        >
          Reiniciar demo
        </button>
      </div>
    </article>
  );
}

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  SpinnerGap,
  WarningCircle,
  ArrowLeft,
  ArrowRight,
  Lightning,
  Medal,
} from "@phosphor-icons/react";
import { Badge, Logo } from "@/components/ui";
import {
  calcularHolland,
  guardarLoteTest,
  listarMisRespuestasTest,
  listarPreguntasTest,
  mensajeAmable,
  verResultadoPropio,
} from "@/lib/estudiante/api";
import {
  INSTRUCCION_SECCION,
  NOMBRE_TIPOLOGIA,
  OPCIONES_APTITUD,
  OPCIONES_BINARIO,
  OPCIONES_PERSONALIDAD,
  ORDEN_SECCIONES,
  TITULO_INSTRUMENTO,
  TITULO_SECCION,
} from "@/lib/estudiante/test-textos";
import { borrarContexto, leerContexto } from "@/lib/estudiante/sesion-local";
import {
  ErrorEstudiante,
  type ContextoEstudiante,
  type PreguntaTest,
  type ResultadoHolland,
  type SeccionTest,
} from "@/lib/estudiante/types";

/*
  Test de Holland — PRUEBA RIASEC (pantalla del estudiante, fuera de las fases):
   · 300 preguntas leídas de la BD (catálogo público; enunciados verbatim del Excel)
   · 4 secciones: actividades 90 (Sí/No) · ocupaciones 90 (Sí/No) ·
     aptitudes 60 (Débil/Medio/Fuerte) · personalidad 60 (escala)
   · AUTOguardado por lotes (fn_guardar_respuestas_test, upsert idempotente):
     con retraso de ~0.9 s, al cambiar de sección y al salir — se puede
     cerrar el navegador y regresar a mitad de test (fn_listar_mis_respuestas_test)
   · al completar las 300: fn_calcular_holland → pantalla de resultado propio
     (código de 3 letras + puntajes; ver pantalla placeholder del brief §6)
*/

type EstadoLote = "idle" | "saving" | "saved" | "error";

export function PantallaTest() {
  const router = useRouter();
  const [contexto, setContexto] = useState<ContextoEstudiante | null>(null);

  useEffect(() => {
    const ctx = leerContexto();
    if (!ctx) {
      router.replace("/estudiante");
      return;
    }
    setContexto(ctx);
  }, [router]);

  if (!contexto) {
    return (
      <main className="flex-1 grid place-items-center text-sm text-ink-2">
        Preparando tu test…
      </main>
    );
  }

  return (
    <CuerpoTest
      contexto={contexto}
      alSalir={() => {
        borrarContexto();
        router.push("/estudiante");
      }}
    />
  );
}

/* ───────────────── Orquestador del test ───────────────── */

function CuerpoTest({
  contexto,
  alSalir,
}: {
  contexto: ContextoEstudiante;
  alSalir: () => void;
}) {
  const [preguntas, setPreguntas] = useState<PreguntaTest[] | null>(null);
  const [respuestas, setRespuestas] = useState<Record<number, number>>({});
  const [resultado, setResultado] = useState<ResultadoHolland | null>(null);
  const [estadoLote, setEstadoLote] = useState<EstadoLote>("idle");
  const [aviso, setAviso] = useState(""); // mensaje amable de error no crítico
  const [trabajando, setTrabajando] = useState(false); // calculando / animación

  const queFaltan = useRef<Set<number>>(new Set()); // ids sucios sin confirmar
  const guardabultos = useRef<ReturnType<typeof setTimeout> | null>(null);

  const claves = useMemo(
    () => ({ pin: contexto.pin, estudianteId: contexto.estudianteId }),
    [contexto.pin, contexto.estudianteId],
  );

  /* — carga inicial: catálogo + lo ya guardado + resultado previo — */
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const [preguntas, guardadas, previo] = await Promise.all([
          listarPreguntasTest(),
          listarMisRespuestasTest(claves).catch(() => []),
          verResultadoPropio(claves.pin, claves.estudianteId).catch(() => null),
        ]);
        if (!vivo) return;
        setPreguntas(preguntas);
        const iniciales: Record<number, number> = {};
        for (const r of guardadas) iniciales[r.pregunta_id] = r.respuesta;
        setRespuestas(iniciales);
        if (previo) setResultado(previo);
      } catch (error) {
        if (vivo) setAviso(mensajeAmable(error));
      }
    })();
    return () => {
      vivo = false;
    };
  }, [claves]);

  /* — envío de lote (los ids que quedan sucios) — */
  const vaciar = useCallback(
    async (alGuardar?: () => void) => {
      const ids = [...queFaltan.current];
      if (ids.length === 0) {
        if (estadoLote === "saving") setEstadoLote("saved");
        return;
      }
      setEstadoLote("saving");
      const pares = ids
        .filter((id) => respuestas[id] !== undefined)
        .map((id) => ({ preguntaId: id, respuesta: respuestas[id] }));
      try {
        await guardarLoteTest(claves.pin, claves.estudianteId, pares);
        queFaltan.current = new Set();
        setEstadoLote("saved");
        alGuardar?.();
      } catch (error) {
        // el lote queda sucio (queFaltan) — el efecto de reintento abajo lo devuelve a la cola
        setEstadoLote("error");
        setAviso(mensajeAmable(error));
      }
    },
    [claves.estudianteId, claves.pin, respuestas, estadoLote],
  );

  // reintento suave: en error, vuelve a intentar cada 2.5 s mientras halla sucios
  useEffect(() => {
    if (estadoLote !== "error") return;
    const t = setTimeout(() => void vaciar(), 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoLote]);

  /* — programación del autoguardado — */
  const registrar = useCallback(
    (id: number, valor: number) => {
      setRespuestas((prev) => {
        if (prev[id] === valor) return prev; // sin cambio → sin suciedad
        return { ...prev, [id]: valor };
      });
      queFaltan.current.add(id);
      setEstadoLote("saving");
      if (guardabultos.current) clearTimeout(guardabultos.current);
      guardabultos.current = setTimeout(() => void vaciar(), 900);
    },
    [vaciar],
  );

  // al desmontar: intento final de vaciado (best-effort)
  useEffect(() => {
    return () => {
      if (guardabultos.current) clearTimeout(guardabultos.current);
    };
  }, []);

  /* — calcular el código al completar — */
  const calcular = useCallback(async () => {
    setTrabajando(true);
    try {
      // si quedó algo sucio, vacía primero — el motor requiere 300 completas
      await vaciar();
      const r = await calcularHolland(claves.pin, claves.estudianteId);
      setResultado(r);
    } catch (error) {
      if (error instanceof ErrorEstudiante && error.code === "FALTAN_PREGUNTAS") {
        setAviso("Aún faltan preguntas por responder — vamos a la sección que queda pendiente.");
      } else {
        setAviso(mensajeAmable(error));
      }
    } finally {
      setTrabajando(false);
    }
  }, [claves.estudianteId, claves.pin, vaciar]);

  const respondidas = Object.keys(respuestas).length;
  const total = preguntas?.length ?? 300;
  const completo = preguntas !== null && respondidas >= total;

  if (preguntas === null) {
    return (
      <main className="flex-1 grid place-items-center text-sm text-ink-2">
        {aviso || "Cargando el test…"}
      </main>
    );
  }

  const porSeccion = agruparSecciones(preguntas);

  if (resultado) {
    return (
      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">
        <EncabezadoTest contexto={contexto} />
        <VistaResultado
          resultado={resultado}
          respondidas={respondidas}
          total={total}
          alSesion={alSalir}
        />
      </main>
    );
  }

  /* — Estructura por navegador, y por moda de Test ya se verá; el estado de la UI — */
  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">
      <EncabezadoTest contexto={contexto} />
      <IntroInstrumento respondidas={respondidas} total={total} completo={completo} />
      {aviso && (
        <p className="text-xs text-pink bg-tint-pink rounded-lg px-4 py-2">{aviso}</p>
      )}
      <NavegadorSecciones
        porSeccion={porSeccion}
        respuestas={respuestas}
        registrar={registrar}
        estadoLote={estadoLote}
        respondidas={respondidas}
        total={total}
        completo={completo}
        trabajando={trabajando}
        alCalcular={() => void calcular()}
        alAvanzar={() => void vaciar()}
      />
    </main>
  );
}

/* ───────────────── helpers del catálogo ───────────────── */

function agruparSecciones(preguntas: PreguntaTest[]) {
  const mapa: Record<SeccionTest, PreguntaTest[]> = {
    intereses_actividades: [],
    intereses_ocupaciones: [],
    aptitudes: [],
    personalidad: [],
  };
  for (const p of preguntas) mapa[p.seccion].push(p);
  return ORDEN_SECCIONES.map((s) => ({ seccion: s, items: mapa[s] }));
}

/* ───────────────── Encabezado ───────────────── */

function EncabezadoTest({ contexto }: { contexto: ContextoEstudiante }) {
  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Logo variant="color" height={36} />
        <Badge variant="yellow" dot>
          <Link href="/estudiante/sesion" className="flex items-center gap-1.5">
            ← Volver a la sesión
          </Link>
        </Badge>
      </div>
      <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-teal">
        YLDC · {TITULO_INSTRUMENTO}
      </p>
      <h1 className="text-xl font-bold text-navy">
        Tu prueba de intereses Holland
      </h1>
      <p className="text-xs text-ink-2">
        {contexto.nombre.split(" ")[0]}, sin respuestas correctas: se trata de
        marcar lo que SÍ va contigo. Nadie más ve esto; solo tu psicóloga lo
        leerá más adelante.
      </p>
    </header>
  );
}

/* ───────────────── Intro con instrucciones por sección ───────────────── */

function IntroInstrumento({
  respondidas,
  total,
  completo,
}: {
  respondidas: number;
  total: number;
  completo: boolean;
}) {
  return (
    <article className="bg-white rounded-2xl shadow-card p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-tint-teal grid place-items-center">
          <Lightning size={20} className="text-teal" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-navy">Tu test de Holland</h2>
          <p className="text-xs text-ink-2">
            {respondidas}/{total} respondidas {completo && "— ¡todas listas! 🎉"}
          </p>
        </div>
      </div>
      <div className="grid gap-3">
        {ORDEN_SECCIONES.map((s) => (
          <div key={s} className="rounded-xl border border-stroke p-4">
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-teal">
              {TITULO_SECCION[s]}
            </p>
            <p className="mt-1 text-xs text-ink">{INSTRUCCION_SECCION[s]}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-ink-2">
        Se guarda solo mientras avanzas — puedes salir y regresar otro día.
      </p>
    </article>
  );
}

/* ───────────────── Secciones navegables ───────────────── */

interface GrupoSeccion {
  seccion: SeccionTest;
  items: PreguntaTest[];
}

function NavegadorSecciones({
  porSeccion,
  respuestas,
  registrar,
  estadoLote,
  respondidas,
  total,
  completo,
  trabajando,
  alCalcular,
  alAvanzar,
}: {
  porSeccion: GrupoSeccion[];
  respuestas: Record<number, number>;
  registrar: (id: number, valor: number) => void;
  estadoLote: EstadoLote;
  respondidas: number;
  total: number;
  completo: boolean;
  trabajando: boolean;
  alCalcular: () => void;
  /** vacía el lote sucio al pasar de sección (los pendientes no se pierden). */
  alAvanzar: () => void;
}) {
  const [indice, setIndice] = useState(0);
  const grupo = porSeccion[indice];
  const respondidasSeccion = grupo.items.filter((q) => respuestas[q.id] !== undefined).length;

  // primera sección con pendientes (para saltar al volver de un error)
  const saltarHacia = useCallback(
    (porFaltas: boolean) => {
      if (!porFaltas) return;
      const faltante = porSeccion.findIndex(
        (g) => g.items.some((q) => respuestas[q.id] === undefined),
      );
      if (faltante >= 0) setIndice(faltante);
    },
    [porSeccion, respuestas],
  );

  return (
    <section className="flex flex-col gap-4">
      {/* progreso global — misma progresión silenciosa de las fases */}
      <div className="flex items-center gap-2" aria-label={`${respondidas} de ${total}`}>
        {porSeccion.map((g, i) => {
          const pal = g.items.filter((q) => respuestas[q.id] !== undefined).length;
          const p = g.items.length === 0 ? 0 : pal / g.items.length;
          return (
            <button
              key={g.seccion}
              type="button"
              onClick={() => setIndice(i)}
              className={`h-1.5 flex-1 rounded-full cursor-pointer transition-colors overflow-hidden ${
                i === indice ? "bg-teal" : p === 1 ? "bg-teal" : "bg-platinum"
              }`}
              aria-label={TITULO_SECCION[g.seccion]}
            />
          );
        })}
        <span className="text-xs text-ink-2 whitespace-nowrap ml-2">
          {respondidas}/{total}
        </span>
        <MarcaLote estado={estadoLote} />
      </div>

      <article className="bg-white rounded-2xl shadow-card p-6 flex flex-col gap-5">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-teal">
              {TITULO_SECCION[grupo.seccion]} · Sección {indice + 1}/4
            </p>
            <span className="text-xs text-ink-2">
              {respondidasSeccion}/{grupo.items.length}
            </span>
          </div>
          <p className="text-xs text-ink">{INSTRUCCION_SECCION[grupo.seccion]}</p>
          {/* barra de la sección */}
          <div className="h-1 rounded-full bg-platinum overflow-hidden">
            <div
              className="h-full bg-teal transition-all"
              style={{ width: `${(respondidasSeccion / grupo.items.length) * 100}%` }}
            />
          </div>
        </header>

        <div className="flex flex-col gap-3">
          {grupo.items.map((q, i) => (
            <PreguntaTestCard
              key={q.id}
              pregunta={q}
              numero={i + 1}
              valor={respuestas[q.id]}
              alMarcar={(v) => registrar(q.id, v)}
            />
          ))}
        </div>

        <footer className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            disabled={indice === 0}
            onClick={() => setIndice((i) => Math.max(0, i - 1))}
            className="h-10 px-4 text-sm rounded-xl border border-stroke text-ink bg-white hover:bg-platinum disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={14} /> Anterior
          </button>

          {indice < porSeccion.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                void alAvanzar();
                setIndice((i) => i + 1);
              }}
              className="h-10 px-5 text-sm rounded-xl bg-navy text-white hover:opacity-90 inline-flex items-center gap-1.5 cursor-pointer"
            >
              Siguiente sección <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              disabled={!completo || trabajando}
              onClick={() => {
                saltarHacia(!completo);
                if (completo) alCalcular();
              }}
              className="h-10 px-5 text-sm rounded-xl bg-yellow text-navy font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 cursor-pointer"
            >
              {trabajando ? (
                <SpinnerGap size={15} className="animate-spin" />
              ) : (
                <Medal size={15} />
              )}
              {completo ? "Calcular mi código" : `Te faltan ${total - respondidas}`}
            </button>
          )}
        </footer>
      </article>
    </section>
  );
}

/* ───────────────── Ítem del test ───────────────── */

function PreguntaTestCard({
  pregunta,
  numero,
  valor,
  alMarcar,
}: {
  pregunta: PreguntaTest;
  numero: number;
  valor: number | undefined;
  alMarcar: (v: number) => void;
}) {
  const opciones =
    pregunta.tipoRespuesta === "binario"
      ? OPCIONES_BINARIO
      : pregunta.seccion === "aptitudes"
        ? OPCIONES_APTITUD
        : OPCIONES_PERSONALIDAD;

  return (
    <div
      className="rounded-xl border border-stroke px-4 py-3 flex items-center gap-4 hover:border-navy/40 transition-colors"
      role="radiogroup"
      aria-label={pregunta.enunciado}
    >
      <span className="text-[11px] text-ink-2 tabular-nums w-7 shrink-0">
        {numero}.
      </span>
      <p className="text-sm text-ink flex-1">{pregunta.enunciado}</p>
      <div className="flex gap-1.5 shrink-0">
        {opciones.map((o) => {
          const activo = valor === o.valor;
          return (
            <button
              key={o.valor}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => alMarcar(o.valor)}
              className={`px-3 h-8 rounded-lg border-2 text-xs whitespace-nowrap transition-colors cursor-pointer ${
                activo
                  ? "border-navy bg-tint-navy text-navy font-medium"
                  : "border-stroke text-ink hover:border-navy/60 hover:bg-tint-pink"
              }`}
            >
              {o.texto}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────── Marca del lote ───────────────── */

function MarcaLote({ estado }: { estado: EstadoLote }) {
  if (estado === "idle") return null;
  const mapa: Record<Exclude<EstadoLote, "idle">, { texto: string; clase: string }> = {
    saving: { texto: "Guardando…", clase: "text-ink-2" },
    saved: { texto: "Guardado", clase: "text-teal" },
    error: { texto: "Sin guardar", clase: "text-pink" },
  };
  const m = mapa[estado];
  return (
    <span className={`text-xs shrink-0 inline-flex items-center gap-1 ${m.clase}`}>
      {estado === "saving" ? (
        <SpinnerGap size={13} className="animate-spin" />
      ) : estado === "saved" ? (
        <Check size={13} weight="bold" />
      ) : (
        <WarningCircle size={13} weight="bold" />
      )}
      {m.texto}
    </span>
  );
}

/* ───────────────── Resultado propio ───────────────── */

function VistaResultado({
  resultado,
  respondidas,
  total,
  alSesion,
}: {
  resultado: ResultadoHolland;
  respondidas: number;
  total: number;
  alSesion: () => void;
}) {
  const maximo = Math.max(...Object.values(resultado.puntajes), 1);
  const orden: Array<keyof ResultadoHolland["puntajes"]> = ["R", "I", "A", "S", "E", "C"];

  return (
    <section className="flex flex-col gap-5">
      <article className="bg-white rounded-2xl shadow-card p-8 text-center flex flex-col items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-tint-teal grid place-items-center">
          <Medal size={24} className="text-teal" />
        </div>
        <h2 className="text-lg font-bold text-navy">¡Completaste el test!</h2>
        <p className="text-sm text-ink-2 max-w-sm">
          Este es tu código de intereses según Holland. En tu próxima sesión
          conocerás qué significa para tu proyecto de vida.
        </p>
        <p className="text-4xl font-bold text-navy tracking-[0.15em] pt-2">
          {resultado.codigoHolland}
        </p>
        <div className="flex flex-col gap-1 text-xs">
          {resultado.tipologias.map((t, i) => (
            <span key={t} className={i === 0 ? "font-semibold text-navy" : "text-ink"}>
              {i + 1}. {t} · {NOMBRE_TIPOLOGIA[t]}
            </span>
          ))}
        </div>
      </article>

      <article className="bg-white rounded-2xl shadow-card p-6 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-navy">Tus puntajes</h3>
        {orden.map((t) => (
          <div key={t} className="flex items-center gap-3">
            <span className="text-xs font-medium text-navy w-28 shrink-0">
              {t} · {NOMBRE_TIPOLOGIA[t]}
            </span>
            <div className="h-3 flex-1 rounded-full bg-platinum overflow-hidden">
              <div
                className="h-full bg-teal"
                style={{ width: `${(resultado.puntajes[t] / maximo) * 100}%` }}
              />
            </div>
            <span className="text-xs text-ink-2 tabular-nums w-8 text-right">
              {resultado.puntajes[t]}
            </span>
          </div>
        ))}
        <p className="text-[11px] text-ink-2 pt-1">
          Respondiste {respondidas}/{total} preguntas. Si tu psicóloga lo pide,
          puedes rehacerlo más adelante.
        </p>
      </article>

      <button
        type="button"
        onClick={alSesion}
        className="self-center h-10 px-5 text-sm rounded-xl border border-navy text-navy bg-white hover:bg-tint-navy transition-colors cursor-pointer"
      >
        Volver a mi sesión
      </button>
    </section>
  );
}

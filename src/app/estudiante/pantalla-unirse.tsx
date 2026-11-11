"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRef, useState } from "react";
import { Logo } from "@/components/ui";
import { PanelMarca } from "@/components/panel-marca";
import {
  mostrarSesionInfo,
  mensajeAmable,
  supabaseConfigurado,
  unirseASesion,
} from "@/lib/estudiante/api";
import { guardarContexto } from "@/lib/estudiante/sesion-local";
import { ErrorEstudiante, type InfoSesion } from "@/lib/estudiante/types";

/*
  Pantalla 1.1 (PIN) + 1.2 (identificación + consentimiento informado),
  versión escritorio del mockup: panel navy a la izquierda (PanelMarca) y
  formulario a la derecha. El PIN se escribe en 6 casillas con salto
  automático, como en el mockup. Una sola página con dos pasos para no
  perder al joven en navegación.
*/

type Paso = "pin" | "identificar";

export function PantallaUnirse() {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>("pin");
  const [sesion, setSesion] = useState<InfoSesion | null>(null);

  /* paso 1: PIN — 6 casillas con salto automático */
  const [digitos, setDigitos] = useState<string[]>(["", "", "", "", "", ""]);
  const casillas = useRef<(HTMLInputElement | null)[]>([]);
  const pin = digitos.join("");
  const [errorPin, setErrorPin] = useState("");
  const [buscando, setBuscando] = useState(false);

  /* paso 2: identificación */
  const [nombre, setNombre] = useState("");
  const [ti, setTi] = useState("");
  const [pedirTi, setPedirTi] = useState(false); // se activa con NOMBRE_AMBIGUO
  const [consentimiento, setConsentimiento] = useState(false);
  const [errorForm, setErrorForm] = useState("");
  const [enviando, setEnviando] = useState(false);

  /** guarda un dígito y salta a la casilla siguiente */
  function guardaDigito(i: number, valor: string) {
    const d = valor.replace(/\D/g, "").slice(-1);
    setDigitos((prev) => {
      const nuevo = [...prev];
      nuevo[i] = d;
      return nuevo;
    });
    if (d && i < 5) casillas.current[i + 1]?.focus();
  }

  /** Backspace en una casilla vacía → vuelve a la anterior */
  function retroceso(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digitos[i] && i > 0) {
      casillas.current[i - 1]?.focus();
    }
  }

  /** pegar el PIN completo reparte los dígitos desde la casilla i */
  function pega(i: number, e: React.ClipboardEvent<HTMLInputElement>) {
    const d = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6 - i);
    if (!d) return;
    e.preventDefault();
    setDigitos((prev) => {
      const nuevo = [...prev];
      for (let k = 0; k < d.length && i + k < 6; k++) nuevo[i + k] = d[k];
      return nuevo;
    });
    casillas.current[Math.min(i + d.length, 5)]?.focus();
  }

  async function validarPin(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length !== 6) {
      setErrorPin("El PIN tiene 6 dígitos.");
      return;
    }
    setBuscando(true);
    setErrorPin("");
    try {
      const info = await mostrarSesionInfo(pin);
      setSesion(info);
      setPaso("identificar");
    } catch (error) {
      setErrorPin(mensajeAmable(error));
    } finally {
      setBuscando(false);
    }
  }

  async function identificarme(e: React.FormEvent) {
    e.preventDefault();
    if (!sesion) return;
    if (nombre.trim().length < 4) {
      setErrorForm("Escribe tu nombre completo.");
      return;
    }
    if (pedirTi && ti.trim().length === 0) {
      setErrorForm("Necesitamos tu documento completo para distinguirte.");
      return;
    }
    if (!consentimiento) {
      setErrorForm("Necesitamos tu consentimiento para guardar tus respuestas.");
      return;
    }
    setEnviando(true);
    setErrorForm("");
    try {
      const r = await unirseASesion({
        pin,
        nombre,
        ti: pedirTi || ti.trim() ? ti : null,
        consentimiento,
      });
      guardarContexto({
        pin,
        estudianteId: r.estudianteId,
        sesionId: r.sesionId,
        yaRegistrado: r.yaRegistrado,
        nombre: nombre.trim(),
        taller: sesion.taller,
        numeroSesion: sesion.numeroSesion,
        curso: sesion.curso,
      });
      router.push("/estudiante/sesion");
    } catch (error) {
      if (error instanceof ErrorEstudiante && error.code === "NOMBRE_AMBIGUO") {
        setPedirTi(true);
        setErrorForm(mensajeAmable(error));
      } else {
        setErrorForm(mensajeAmable(error));
      }
      setEnviando(false);
    }
  }

  return (
    <main className="flex-1 grid lg:grid-cols-2 bg-white">
      <PanelMarca />

      <section className="flex flex-col justify-center px-6 py-10">
        <div className="mx-auto flex w-full max-w-md flex-col gap-5">
          {/* En móvil el panel navy se oculta: el logo acompaña al formulario */}
          <div className="flex flex-col items-center text-center lg:hidden">
            <Logo variant="color" height={48} />
          </div>

          {/* Estado de conexión — documenta el entorno sin estorbar el flujo */}
          {!supabaseConfigurado && (
            <p className="text-xs text-ink-2 bg-tint-navy rounded-lg px-3 py-2 text-center">
              Modo demo — los datos de este flujo viven solo en tu navegador.
            </p>
          )}

          <header className="flex flex-col gap-3">
            <h1 className="text-[44px] leading-tight font-bold text-navy">
              {paso === "pin" ? "Bienvenido" : "¿Quién eres hoy?"}
            </h1>
            <div className="h-[5px] w-11 rounded-full bg-yellow" aria-hidden="true" />
            <p className="text-sm text-ink-2">
              {paso === "pin"
                ? "Escribe el código de 6 dígitos que te dio tu facilitador."
                : "Te lo preguntamos una vez. Tus respuestas quedan asociadas a ti."}
            </p>
          </header>

          {paso === "pin" ? (
            <form
              onSubmit={validarPin}
              className="flex flex-col gap-5"
              autoComplete="off"
            >
              <div className="flex justify-between gap-2">
                {digitos.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      casillas.current[i] = el;
                    }}
                    value={d}
                    onChange={(e) => guardaDigito(i, e.target.value)}
                    onKeyDown={(e) => retroceso(i, e)}
                    onPaste={(e) => pega(i, e)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    autoFocus={i === 0}
                    aria-label={`Dígito ${i + 1} del código`}
                    aria-invalid={!!errorPin}
                    className={`h-16 w-14 rounded-lg border-[1.5px] bg-white text-center text-2xl font-semibold text-navy focus:outline-none focus:ring-2 ${
                      errorPin
                        ? "border-pink ring-2 ring-pink"
                        : "border-[#dcd7e8] focus:border-teal focus:ring-teal"
                    }`}
                  />
                ))}
              </div>
              {errorPin ? (
                <p className="text-xs text-pink text-center">{errorPin}</p>
              ) : null}
              <button
                type="submit"
                disabled={buscando}
                className="h-12 rounded-full bg-yellow text-navy text-base font-medium hover:bg-[#e3c900] active:bg-[#d4bd00] disabled:bg-platinum disabled:text-ink-disabled transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed"
              >
                {buscando ? "Buscando la sesión…" : "Entrar"}
              </button>
              <p className="text-xs text-ink-2 text-center">
                ¿No tienes PIN? Pídeselo a tu facilitador de sesión.
              </p>
            </form>
          ) : (
            <form onSubmit={identificarme} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-navy">
                  Nombre completo
                </span>
                <input
                  autoFocus
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    setErrorForm("");
                  }}
                  placeholder="Como aparece en tu lista del colegio"
                  className="h-12 w-full px-4 text-sm rounded-[10px] border border-stroke bg-white text-ink placeholder:text-ink-disabled focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-navy">
                  Documento (TI)
                  <span className="font-normal text-ink-2">
                    {" "}
                    {pedirTi ? "— requerido" : "— opcional"}
                  </span>
                </span>
                <input
                  value={ti}
                  onChange={(e) => {
                    setTi(e.target.value);
                    setErrorForm("");
                  }}
                  placeholder={
                    pedirTi
                      ? "Ej. 1.025.690.228 — distingue tu registro"
                      : "Solo si tu facilitador lo pide"
                  }
                  className="h-12 w-full px-4 text-sm rounded-[10px] border border-stroke bg-white text-ink placeholder:text-ink-disabled focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
                />
                {pedirTi && (
                  <span className="text-xs text-pink">
                    Hay más de un estudiante con ese nombre en tu curso.
                  </span>
                )}
              </label>

              {/* Consentimiento informado (mockup 1.2) */}
              <label className="flex gap-2.5 items-start select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentimiento}
                  onChange={(e) => {
                    setConsentimiento(e.target.checked);
                    setErrorForm("");
                  }}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 border-stroke accent-[#f8db01]"
                />
                <span className="text-xs text-ink-2 leading-relaxed">
                  Acepto que mis respuestas de la sesión y mi test se usen solo
                  para mi acompañamiento socioemocional, con trazabilidad para
                  el psicólogo del programa (YCC). Ninguna respuesta es visible
                  para otros estudiantes.
                </span>
              </label>

              {errorForm ? (
                <p className="text-xs text-pink font-medium">{errorForm}</p>
              ) : null}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPaso("pin");
                    setPedirTi(false);
                    setErrorForm("");
                  }}
                  className="h-10 px-5 text-sm rounded-xl border border-navy text-navy bg-white hover:bg-tint-navy transition-colors cursor-pointer"
                >
                  ← Volver
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="flex-1 h-10 rounded-xl bg-yellow text-navy text-sm font-medium hover:bg-[#e3c900] active:bg-[#d4bd00] disabled:bg-platinum disabled:text-ink-disabled transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {enviando ? "Entrando…" : "Entrar a la sesión"}
                </button>
              </div>
            </form>
          )}

          <footer className="text-xs text-ink-2">
            <Link href="/" className="hover:text-navy underline underline-offset-2">
              ← Volver al inicio
            </Link>
          </footer>
        </div>
      </section>
    </main>
  );
}

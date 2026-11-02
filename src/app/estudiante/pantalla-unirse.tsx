"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/ui";
import {
  mostrarSesionInfo,
  mensajeAmable,
  supabaseConfigurado,
  unirseASesion,
} from "@/lib/estudiante/api";
import { guardarContexto } from "@/lib/estudiante/sesion-local";
import { ErrorEstudiante, type InfoSesion } from "@/lib/estudiante/types";

/*
  Pantalla 1.1 (PIN) + 1.2 (identificación + consentimiento informado).
  Una sola página con dos pasos para no perder al joven en navegación.
*/

type Paso = "pin" | "identificar";

export function PantallaUnirse() {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>("pin");
  const [sesion, setSesion] = useState<InfoSesion | null>(null);

  /* paso 1: PIN */
  const [pin, setPin] = useState("");
  const [errorPin, setErrorPin] = useState("");
  const [buscando, setBuscando] = useState(false);

  /* paso 2: identificación */
  const [nombre, setNombre] = useState("");
  const [ti, setTi] = useState("");
  const [pedirTi, setPedirTi] = useState(false); // se activa con NOMBRE_AMBIGUO
  const [consentimiento, setConsentimiento] = useState(false);
  const [errorForm, setErrorForm] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function validarPin(e: React.FormEvent) {
    e.preventDefault();
    const limpio = pin.replace(/\D/g, "");
    if (limpio.length !== 6) {
      setErrorPin("El PIN tiene 6 dígitos.");
      return;
    }
    setBuscando(true);
    setErrorPin("");
    try {
      const info = await mostrarSesionInfo(limpio);
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
        pin: pin.replace(/\D/g, ""),
        nombre,
        ti: pedirTi || ti.trim() ? ti : null,
        consentimiento,
      });
      guardarContexto({
        pin: pin.replace(/\D/g, ""),
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
    <main className="flex-1 flex flex-col items-center px-6 py-10">
      {/* Estado de conexión — documenta el entorno sin estorbar el flujo */}
      <div
        className={`w-full max-w-4xl mb-6 text-center text-xs px-4 py-2 rounded-lg ${
          supabaseConfigurado
            ? "text-ink-2"
            : "bg-tint-yellow text-navy font-medium"
        }`}
      >
        {supabaseConfigurado
          ? null
          : "Modo demo — los datos de este flujo viven solo en tu navegador."}
      </div>

      <div className="w-full max-w-md flex flex-col gap-6 flex-1">
        <header className="flex flex-col items-center gap-2 text-center">
          <Logo variant="color" height={48} />
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-teal">
            Young Leaders Development Cycle
          </p>
          <h1 className="text-2xl font-bold text-navy">
            {paso === "pin" ? "Entrar a tu sesión" : "¿Quién eres hoy?"}
          </h1>
          <p className="text-sm text-ink-2">
            {paso === "pin"
              ? "Escribe el PIN que te dio tu facilitador."
              : "Te lo preguntamos una vez. Tus respuestas quedan asociadas a ti."}
          </p>
          <p className="text-[10px] text-ink-disabled">
            Mockup 1.1 / 1.2 — pantalla 1 de 2
          </p>
        </header>

        {paso === "pin" ? (
          <form
            onSubmit={validarPin}
            className="flex flex-col gap-4"
            autoComplete="off"
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="pin"
                className="text-sm font-medium text-navy text-center"
              >
                PIN de 6 dígitos
              </label>
              <input
                id="pin"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoFocus
                placeholder="••••••"
                aria-invalid={!!errorPin}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setErrorPin("");
                }}
                className={`h-14 w-full text-center text-2xl tracking-[0.55em] font-semibold rounded-xl border bg-white placeholder:text-ink-disabled focus:outline-none focus:ring-2 ${
                  errorPin
                    ? "border-pink ring-2 ring-pink"
                    : "border-stroke focus:ring-teal focus:border-teal"
                }`}
              />
              {errorPin ? (
                <p className="text-xs text-pink text-center">{errorPin}</p>
              ) : null}
            </div>
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
                className="h-11 w-full px-4 text-sm rounded-lg border border-stroke bg-white text-ink placeholder:text-ink-disabled focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
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
                className="h-11 w-full px-4 text-sm rounded-lg border border-stroke bg-white text-ink placeholder:text-ink-disabled focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
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
      </div>

      <footer className="mt-8 text-xs text-ink-2">
        <Link href="/" className="hover:text-navy underline underline-offset-2">
          ← Volver al inicio
        </Link>
      </footer>
    </main>
  );
}

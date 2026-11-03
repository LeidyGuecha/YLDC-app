"use client";

import { useEffect, useRef } from "react";
import { SpinnerGap, X } from "@phosphor-icons/react";

interface ModalConfirmarProps {
  abierto: boolean;
  titulo: string;
  texto: string;
  etiquetaSi?: string;
  etiquetaNo?: string;
  /** true = botón principal rosa (acción no deshacible de verdad). */
  peligro?: boolean;
  cargando?: boolean;
  alConfirmar: () => void;
  alCancelar: () => void;
}

/*
  Modal de confirmación del diseño (reemplaza el window.confirm del cierre
  de taller y aporta el «¿Salimos?» de los paneles adultos).
- Escape y el botón X cancelan; el foco entra al botón principal al abrir.
- El botón de confirmar deshabilitado mientras carga evita el doble clic.
*/
export function ModalConfirmar({
  abierto,
  titulo,
  texto,
  etiquetaSi = "Sí, continuar",
  etiquetaNo = "Cancelar",
  peligro = true,
  cargando = false,
  alConfirmar,
  alCancelar,
}: ModalConfirmarProps) {
  const refSi = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function alTecla(e: KeyboardEvent) {
      if (e.key === "Escape") alCancelar();
    }
    window.addEventListener("keydown", alTecla);
    refSi.current?.focus();
    return () => {
      window.removeEventListener("keydown", alTecla);
    };
  }, [abierto, alCancelar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center px-4 bg-navy/50"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-modal p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-bold text-navy">{titulo}</h2>
          <button
            onClick={alCancelar}
            disabled={cargando}
            aria-label="Cerrar"
            className="text-ink-2 hover:text-navy cursor-pointer disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-ink-2">{texto}</p>

        <div className="flex gap-2.5 justify-end">
          <button
            onClick={alCancelar}
            disabled={cargando}
            className="h-10 px-4 rounded-xl border border-stroke text-sm text-ink-2 hover:border-navy hover:text-navy cursor-pointer disabled:opacity-40"
          >
            {etiquetaNo}
          </button>
          <button
            ref={refSi}
            onClick={alConfirmar}
            disabled={cargando}
            className={`h-10 px-4 rounded-xl text-sm text-white inline-flex items-center gap-2 cursor-pointer disabled:opacity-60 ${
              peligro ? "bg-pink hover:opacity-90" : "bg-navy hover:opacity-90"
            }`}
          >
            {cargando ? (
              <SpinnerGap size={14} className="animate-spin" />
            ) : null}
            {etiquetaSi}
          </button>
        </div>
      </div>
    </div>
  );
}

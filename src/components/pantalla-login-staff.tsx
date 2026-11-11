"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  EnvelopeSimple,
  Eye,
  EyeSlash,
  Key,
  SpinnerGap,
} from "@phosphor-icons/react";
import { Logo } from "@/components/ui";
import { mensajeAmable } from "@/lib/estudiante/api";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { PanelMarca } from "./panel-marca";

/*
  Login staff compartido (mockup 2.1): la misma pantalla sirve para
  facilitador, psicóloga y admin — cada ruta pasa su acento, su cuenta de
  ejemplo y sus funciones de Supabase Auth. Panel navy a la izquierda
  (PanelMarca) y formulario de correo + contraseña a la derecha.
*/

type Acento = "teal" | "pink";

interface PantallaLoginStaffProps {
  acento: Acento;
  placeholderCorreo: string;
  rutaPanel: string;
  iniciarSesion: (correo: string, contrasena: string) => Promise<unknown>;
  /** true si ya hay sesión válida de este rol (para ir directo al panel) */
  yaDentro: () => Promise<boolean>;
}

/* Clases completas por acento: Tailwind necesita verlas literales. */
const ANILLO: Record<Acento, string> = {
  teal: "focus-within:border-teal focus-within:ring-teal",
  pink: "focus-within:border-pink focus-within:ring-pink",
};

export function PantallaLoginStaff({
  acento,
  placeholderCorreo,
  rutaPanel,
  iniciarSesion,
  yaDentro,
}: PantallaLoginStaffProps) {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [ver, setVer] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // yaDentro llega como closure nueva en cada render del padre: el ref
  // mantiene estable el efecto (corre solo al montar).
  const yaDentroRef = useRef(yaDentro);
  yaDentroRef.current = yaDentro;

  // ya con sesión válida dentro → directo al panel
  useEffect(() => {
    if (!supabaseConfigurado) return;
    void yaDentroRef.current().then((dentro) => {
      if (dentro) router.replace(rutaPanel);
    });
  }, [router, rutaPanel]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      await iniciarSesion(correo, contrasena);
      router.replace(rutaPanel);
    } catch (err) {
      setError(mensajeAmable(err));
    } finally {
      setCargando(false);
    }
  }

  const anillo = ANILLO[acento];

  return (
    <main className="flex-1 grid lg:grid-cols-2 bg-white">
      <PanelMarca />

      <section className="flex flex-col justify-center px-6 py-10">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
          {/* En móvil el panel navy se oculta: el logo acompaña al formulario */}
          <div className="flex flex-col items-center text-center lg:hidden">
            <Logo variant="color" height={44} />
          </div>

          <h1 className="text-[36px] leading-tight font-bold text-navy">
            Hola de nuevo
          </h1>

          <form onSubmit={entrar} className="flex flex-col gap-4">
            {!supabaseConfigurado && (
              <p className="text-xs text-pink bg-tint-pink rounded-lg px-3 py-2">
                Falta .env.local con las credenciales — el panel se activa al
                configurarlas.
              </p>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-navy">
                Correo electrónico
              </span>
              <div
                className={`flex items-center gap-2 rounded-[10px] border border-stroke bg-white px-4 h-12 focus-within:ring-2 ${anillo}`}
              >
                <EnvelopeSimple size={16} className="text-ink-2 shrink-0" />
                <input
                  type="email"
                  required
                  value={correo}
                  onChange={(e2) => setCorreo(e2.target.value)}
                  placeholder={placeholderCorreo}
                  className="flex-1 min-w-0 text-sm text-ink placeholder:text-ink-disabled bg-transparent focus:outline-none"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-navy">Contraseña</span>
              <div
                className={`flex items-center gap-2 rounded-[10px] border border-stroke bg-white px-4 h-12 focus-within:ring-2 ${anillo}`}
              >
                <Key size={16} className="text-ink-2 shrink-0" />
                <input
                  type={ver ? "text" : "password"}
                  required
                  value={contrasena}
                  onChange={(e2) => setContrasena(e2.target.value)}
                  className="flex-1 min-w-0 text-sm text-ink bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setVer((v) => !v)}
                  aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="text-xs font-medium text-teal hover:text-navy cursor-pointer shrink-0"
                >
                  {ver ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </label>

            {error && (
              <p className="text-xs text-pink bg-tint-pink rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando || !supabaseConfigurado}
              className="h-10 rounded-[10px] bg-yellow text-navy text-sm font-semibold hover:bg-[#e3c900] active:bg-[#d4bd00] disabled:bg-platinum disabled:text-ink-disabled transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {cargando ? <SpinnerGap size={15} className="animate-spin" /> : null}
              Entrar
            </button>
          </form>

          <p className="text-[11px] text-ink-2 text-center">
            ¿No tienes cuenta? Contacta al administrador YLDC.
          </p>
        </div>
      </section>
    </main>
  );
}

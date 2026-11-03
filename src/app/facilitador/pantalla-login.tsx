"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EnvelopeSimple, Key, SpinnerGap, Eye, EyeSlash } from "@phosphor-icons/react";
import { Logo } from "@/components/ui";
import { iniciarSesion, miPerfil } from "@/lib/facilitador/auth";
import { mensajeAmable } from "@/lib/estudiante/api";
import { supabaseConfigurado } from "@/lib/supabase/config";

/*
  Login del facilitador (mockup 2.1): correo + contraseña de Supabase Auth.
  La cuenta debe estar vinculada a la tabla facilitadores.auth_id
  (paso 5 del README de supabase) y con activo = true.
*/

export function PantallaLoginFacilitador() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [ver, setVer] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // ya con sesión válida dentro → directo al panel
  useEffect(() => {
    if (!supabaseConfigurado) return;
    void miPerfil().then((p) => {
      if (p?.activo) router.replace("/facilitador/panel");
    });
  }, [router]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      await iniciarSesion(correo, contrasena);
      router.replace("/facilitador/panel");
    } catch (err) {
      setError(mensajeAmable(err));
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex-1 grid place-items-center px-6 py-10">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo variant="color" height={44} />
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-teal">
            YLDC · Equipo acompañante
          </p>
          <h1 className="text-xl font-bold text-navy">Panel del facilitador</h1>
          <p className="text-xs text-ink-2 max-w-xs">
            Crea sesiones, acompaña el avance del curso y deja tu comentario
            grupal al cierre.
          </p>
        </div>

        <form
          onSubmit={entrar}
          className="bg-white rounded-2xl shadow-card p-6 flex flex-col gap-4"
        >
          {!supabaseConfigurado && (
            <p className="text-xs text-pink bg-tint-pink rounded-lg px-3 py-2">
              Falta .env.local con las credenciales — el panel se activa al
              configurarlas.
            </p>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-navy">Correo</span>
            <div className="flex items-center gap-2 rounded-lg border border-stroke px-3 h-10 focus-within:ring-2 focus-within:ring-teal">
              <EnvelopeSimple size={15} className="text-ink-2" />
              <input
                type="email"
                required
                value={correo}
                onChange={(e2) => setCorreo(e2.target.value)}
                placeholder="maria.torres@yldc.app"
                className="flex-1 text-sm text-ink focus:outline-none"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-navy">Contraseña</span>
            <div className="flex items-center gap-2 rounded-lg border border-stroke px-3 h-10 focus-within:ring-2 focus-within:ring-teal">
              <Key size={15} className="text-ink-2" />
              <input
                type={ver ? "text" : "password"}
                required
                value={contrasena}
                onChange={(e2) => setContrasena(e2.target.value)}
                className="flex-1 text-sm text-ink focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setVer((v) => !v)}
                aria-label={ver ? "Ocultar" : "Mostrar"}
                className="text-ink-2 hover:text-navy cursor-pointer"
              >
                {ver ? <EyeSlash size={15} /> : <Eye size={15} />}
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
            className="h-10 rounded-xl bg-navy text-white text-sm hover:opacity-90 disabled:opacity-40 inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {cargando ? <SpinnerGap size={15} className="animate-spin" /> : null}
            Entrar
          </button>
        </form>

        <p className="text-[11px] text-ink-2 text-center">
          ¿Problemas para entrar? Tu facilitadora gestiona las cuentas con la
          psicóloga / administración — nadie elimina cuentas: se
          activan/desactivan.
        </p>
      </div>
    </main>
  );
}

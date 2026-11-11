import type { ReactNode } from "react";
import { SignOut } from "@phosphor-icons/react";
import { Logo } from "@/components/ui";

/*
  Marco de los paneles del equipo — facilitador, psicóloga y admin
  (mockup 2.2 en escritorio): barra lateral navy con el logo y la
  navegación (ítem activo teal con borde amarillo a la izquierda),
  contenido gris claro (platinum) con el saludo «Hola, {nombre}» y el
  botón «Cerrar sesión» arriba a la derecha. En el celular la barra
  lateral se oculta y queda una barra navy compacta arriba.
*/

export interface ItemNavStaff {
  etiqueta: string;
  icono: ReactNode;
  activo?: boolean;
  onClick?: () => void;
  /** true = «Cerrar sesión» (hover rosa en la barra lateral). */
  salida?: boolean;
}

export function MarcoStaff({
  rol,
  acento = "teal",
  nombre,
  nav,
  alSalir,
  children,
}: {
  /** Texto del eyebrow, p. ej. «Panel del facilitador». */
  rol: string;
  /** Color del eyebrow: teal (facilitador / admin) o pink (psicóloga). */
  acento?: "teal" | "pink";
  /** Nombre para el saludo «Hola, {nombre}». */
  nombre: string;
  /** Navegación de la barra lateral. */
  nav: ItemNavStaff[];
  /** Abre la confirmación de salida (barra del celular y botón superior). */
  alSalir: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col bg-white lg:flex-row lg:bg-platinum">
      {/* Barra lateral navy (solo escritorio) */}
      <aside className="hidden w-[200px] shrink-0 flex-col bg-navy px-4 py-6 lg:flex">
        <span className="px-2">
          <Logo variant="dark" height={56} priority />
        </span>
        <nav className="-mx-4 mt-8 flex flex-col gap-1">
          {nav.map((item) => {
            const base =
              "relative flex h-11 items-center gap-2.5 px-5 text-sm cursor-pointer transition-colors text-left";
            const estado = item.activo
              ? "bg-teal font-medium text-white"
              : item.salida
                ? "text-white/70 hover:bg-white/10 hover:text-pink"
                : "text-white/70 hover:bg-white/10 hover:text-white";
            return (
              <button key={item.etiqueta} onClick={item.onClick} className={`${base} ${estado}`}>
                {item.activo && (
                  <span className="absolute inset-y-0 left-0 w-1 bg-yellow" />
                )}
                {item.icono}
                {item.etiqueta}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Columna de contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra compacta para el celular */}
        <header className="flex items-center justify-between gap-3 bg-navy px-6 py-3 lg:hidden">
          <Logo variant="dark" height={34} priority />
          <button
            onClick={alSalir}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/25 px-2.5 text-xs text-white/80 cursor-pointer"
          >
            <SignOut size={13} /> Salir
          </button>
        </header>

        <main className="flex w-full flex-1 flex-col gap-6 px-6 py-8 lg:mx-auto lg:max-w-[1280px] lg:px-10">
          {/* Encabezado de bienvenida */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p
                className={`text-[11px] font-medium uppercase tracking-[0.18em] ${
                  acento === "pink" ? "text-pink" : "text-teal"
                }`}
              >
                {rol}
              </p>
              <h1 className="text-2xl font-bold text-navy lg:text-[28px]">
                Hola, {nombre}
              </h1>
            </div>
            <button
              onClick={alSalir}
              className="hidden h-10 items-center gap-1.5 rounded-xl border border-navy/20 bg-white px-4 text-xs font-medium text-navy hover:border-pink hover:text-pink cursor-pointer lg:inline-flex"
            >
              <SignOut size={14} /> Cerrar sesión
            </button>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}

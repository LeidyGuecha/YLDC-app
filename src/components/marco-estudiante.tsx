import type { ReactNode } from "react";
import { Logo } from "@/components/ui";

/*
  Marco de las pantallas del estudiante (mockups 1.3–1.10 en escritorio):
  barra navy a todo lo ancho con el logo y el lema «Acompañamos tu decisión»,
  cuerpo lavanda y contenido centrado en un contenedor de 1200px.
  En el celular la barra es compacta y el cuerpo queda blanco.
*/
export function MarcoEstudiante({
  acciones,
  pie,
  children,
}: {
  /** Contenido a la derecha de la barra (p. ej. el estado de la sesión). */
  acciones?: ReactNode;
  /** Contenido de la barra inferior (enlaces de salida). */
  pie?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col bg-white lg:bg-tint-navy">
      <header className="bg-navy">
        <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between gap-4 px-6 lg:h-[132px]">
          <span className="lg:hidden">
            <Logo variant="dark" height={40} priority />
          </span>
          <span className="hidden lg:block">
            <Logo variant="dark" height={56} priority />
          </span>
          <div className="flex items-center gap-6">
            {acciones}
            <span className="hidden text-[11px] font-medium tracking-[0.25em] text-white/70 uppercase lg:block">
              Acompañamos tu decisión
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-6 py-8 lg:py-10">
        {children}
      </main>

      <footer className="bg-navy">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-3 text-[11px] text-white/60">
          {pie}
        </div>
      </footer>
    </div>
  );
}

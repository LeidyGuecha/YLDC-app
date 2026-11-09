import Link from "next/link";
import {
  ArrowRight,
  Brain,
  ChalkboardTeacher,
  GearSix,
  GraduationCap,
  type Icon,
} from "@phosphor-icons/react";
import { Logo } from "@/components/ui";

/*
  Pantalla inicial (entry) — Young Lives Development Cycle × Fondacio.
  Cada rol entra por su propia puerta; la carta completa es el enlace.
  Pensada primero para escritorio (2×2) y ajustable en el celular (1 col).
*/

interface Rol {
  href: string;
  titulo: string;
  texto: string;
  entrada: string;
  icono: Icon;
  /** clases de la carta según el color de marca del rol */
  carta: string;
  tituloCls: string;
  textoCls: string;
  entradaCls: string;
}

const ROLES: Rol[] = [
  {
    href: "/estudiante",
    titulo: "Estudiante",
    texto: "Entra con el PIN de tu sesión y participa en el taller del día.",
    entrada: "Entrar con mi PIN",
    icono: GraduationCap,
    carta: "bg-navy hover:ring-white/60",
    tituloCls: "text-white",
    textoCls: "text-tint-navy",
    entradaCls: "bg-yellow text-navy",
  },
  {
    href: "/facilitador",
    titulo: "Facilitador",
    texto: "Crea sesiones, acompaña en vivo y deja el comentario grupal.",
    entrada: "Abrir mi panel",
    icono: ChalkboardTeacher,
    carta: "bg-teal hover:ring-white/60",
    tituloCls: "text-white",
    textoCls: "text-tint-teal",
    entradaCls: "bg-navy text-white",
  },
  {
    href: "/psicologa",
    titulo: "Psicóloga",
    texto: "Revisa el test de Holland, el historial y escribe tu comentario.",
    entrada: "Abrir mi panel",
    icono: Brain,
    carta: "bg-pink hover:ring-white/60",
    tituloCls: "text-white",
    textoCls: "text-tint-pink",
    entradaCls: "bg-navy text-white",
  },
  {
    href: "/admin",
    titulo: "Admin",
    texto: "Gestiona cuentas, carga los estudiantes y consulta el historial.",
    entrada: "Abrir mi panel",
    icono: GearSix,
    carta: "bg-yellow hover:ring-white/70",
    tituloCls: "text-navy",
    textoCls: "text-navy/70",
    entradaCls: "bg-navy text-white",
  },
];

export default function EntradaPage() {
  return (
    <main className="relative flex-1 overflow-hidden">
      {/* manchas suaves de la paleta — marca en el fondo, sin ruido */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-tint-yellow opacity-80 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -right-20 h-96 w-96 rounded-full bg-tint-teal opacity-80 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 right-8 h-40 w-40 rounded-full bg-tint-pink opacity-70 blur-2xl"
      />

      <div className="relative z-10 flex min-h-full flex-col items-center justify-center gap-8 px-5 py-12">
        <header className="flex flex-col items-center gap-2.5 text-center">
          <Logo variant="color" height={52} />
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-teal">
            Young Lives Development Cycle
          </p>
          <p className="text-xs text-ink-2">
            Fondacio Colombia · Ciudad Bolívar
          </p>
          <h1 className="pt-1 text-2xl font-bold text-navy sm:text-3xl">
            ¿Quién entra hoy?
          </h1>
          <p className="max-w-md text-sm text-ink-2">
            Elige tu rol: cada uno tiene su propio panel de trabajo.
          </p>
        </header>

        <div className="w-full max-w-3xl grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          {ROLES.map((rol) => {
            const Icono = rol.icono;
            return (
              <Link
                key={rol.href}
                href={rol.href}
                className={`group flex items-center justify-between gap-4 rounded-2xl p-5 sm:p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-modal hover:ring-2 ${rol.carta} cursor-pointer`}
              >
                <div className="flex flex-col gap-1.5 min-w-0">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/25">
                    <Icono size={22} className="text-white" weight="duotone" />
                  </span>
                  <p className={`pt-1 text-base font-bold ${rol.tituloCls}`}>
                    {rol.titulo}
                  </p>
                  <p className={`text-xs leading-relaxed ${rol.textoCls}`}>
                    {rol.texto}
                  </p>
                  <span
                    className={`mt-2 inline-flex h-8 w-fit items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all group-hover:gap-2.5 ${rol.entradaCls}`}
                  >
                    {rol.entrada}
                    <ArrowRight
                      size={12}
                      weight="bold"
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <footer className="flex flex-col items-center gap-1 text-center">
          <p className="text-[11px] text-ink-2">
            Acompañamiento socio-ocupacional para las y los jóvenes del ciclo
            YLDC
          </p>
          <Link
            href="/diseno"
            className="text-[10px] text-ink-disabled hover:text-navy underline-offset-2 hover:underline"
          >
            Sistema de diseño (equipo)
          </Link>
        </footer>
      </div>
    </main>
  );
}

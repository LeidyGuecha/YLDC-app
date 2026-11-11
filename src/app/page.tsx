"use client";

import Image from "next/image";
import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";
import { Logo } from "@/components/ui";

/*
  Pantalla 0.1 — Entrada · ¿Quién entra hoy? (mockup escritorio):
  marca arriba, ilustración de bienvenida a la izquierda y cartas de rol
  2×2 a la derecha con el personaje ilustrado de cada rol. Fondo blanco
  limpio, sin formas decorativas. En el celular se apila en una columna.
*/

interface Rol {
  href: string;
  titulo: string;
  /** Clases de fondo de la carta (gradiente o color sólido del mockup) */
  fondo: string;
  personaje: { src: string; alt: string; ancho: number; alto: number };
}

const ROLES: Rol[] = [
  {
    href: "/estudiante",
    titulo: "Estudiante",
    fondo: "bg-[linear-gradient(155.7deg,#ffffff,#d6eef7)]",
    personaje: {
      src: "/ilustraciones/rol-estudiante.png",
      alt: "Estudiante con su morral y libros",
      ancho: 242,
      alto: 372,
    },
  },
  {
    href: "/facilitador",
    titulo: "Facilitador",
    fondo: "bg-teal",
    personaje: {
      src: "/ilustraciones/rol-facilitador.png",
      alt: "Facilitadora con tableta en mano",
      ancho: 278,
      alto: 348,
    },
  },
  {
    href: "/psicologa",
    titulo: "Psicóloga",
    fondo: "bg-pink",
    personaje: {
      src: "/ilustraciones/rol-psicologa.png",
      alt: "Psicóloga con bata blanca",
      ancho: 236,
      alto: 388,
    },
  },
  {
    href: "/admin",
    titulo: "Admin",
    fondo: "bg-yellow",
    personaje: {
      src: "/ilustraciones/rol-admin.png",
      alt: "Administrador con traje y corbata",
      ancho: 248,
      alto: 365,
    },
  },
];

function CartaRol({ rol }: { rol: Rol }) {
  return (
    <Link
      href={rol.href}
      className={`group relative flex h-24 items-center overflow-hidden rounded-[24px] pl-[70px] pr-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-modal sm:h-[155px] sm:pl-[100px] cursor-pointer ${rol.fondo}`}
    >
      {/* personaje asomado a la izquierda (134×127 en el mockup) */}
      <Image
        src={rol.personaje.src}
        alt={rol.personaje.alt}
        width={rol.personaje.ancho}
        height={rol.personaje.alto}
        className="absolute left-0 top-1/2 h-[84px] w-[92px] -translate-y-1/2 object-contain sm:top-[10px] sm:h-[127px] sm:w-[134px] sm:translate-y-0"
      />
      <span className="text-lg font-semibold text-navy sm:text-2xl">
        {rol.titulo}
      </span>
      <span className="relative ml-auto grid h-8 w-8 place-items-center rounded-full bg-navy transition-transform duration-200 group-hover:scale-105 sm:h-9 sm:w-9">
        <CaretRight size={16} weight="bold" className="text-white" />
      </span>
    </Link>
  );
}

export default function EntradaPage() {
  return (
    <main className="flex-1 bg-white">
      <div className="flex min-h-full flex-col items-center px-6 pt-16 pb-8 sm:pt-20">
        {/* marca */}
        <header className="flex flex-col items-center text-center">
          <Logo variant="color" height={67} priority />
          <h1 className="mt-10 text-[26px] font-semibold text-navy sm:text-[32px]">
            ¿Quién entra hoy?
          </h1>
          <p className="mt-1.5 text-sm text-ink-2">
            Elige tu rol: cada uno tiene su propio panel de trabajo.
          </p>
        </header>

        {/* cuerpo: ilustración de bienvenida + cartas de rol */}
        <div className="mt-8 flex w-full max-w-[1306px] flex-1 flex-col items-center justify-center gap-8 py-6 lg:flex-row lg:gap-12">
          <Image
            src="/ilustraciones/bienvenida.png"
            alt="Jóvenes estudiando con laptops y un birrete en pantalla"
            width={906}
            height={917}
            priority
            className="h-auto w-64 shrink-0 sm:w-80 lg:w-[545px]"
          />

          <div className="grid w-full max-w-[710px] grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-[38px]">
            {ROLES.map((rol) => (
              <CartaRol key={rol.href} rol={rol} />
            ))}
          </div>
        </div>

        <footer className="text-center">
          <p className="text-[11px] text-ink-2">
            Acompañamiento socio-ocupacional para las y los jóvenes del ciclo
            YLDC · Fondacio Colombia
          </p>
        </footer>
      </div>
    </main>
  );
}

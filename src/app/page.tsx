"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { Logo } from "@/components/ui";

/*
  Pantalla inicial (entry) — Young Lives Development Center × Fondacio.
  Estilo del mockup aprobado: ilustración a la izquierda y cartas-píldora
  de roles con personaje + flecha circular a la derecha.
  Escritorio primero (fila); en el celular se apila 1 columna.
*/

const PELES = {
  navy: "#2C2453",
  cafe: "#4A3422",
  negro: "#231F20",
};
const PIEL_1 = "#F6C9A0";
const PIEL_2 = "#EDB88F";
const PIEL_3 = "#D9A385";

/* ───────────────── Personaje (busto plano peek-and-lean) ───────────────── */

function PersonaBusto({
  piel,
  pelo,
  camisa,
  acento,
  className = "",
}: {
  piel: string;
  pelo: string;
  camisa: string;
  acento?: "mochila" | "gafas" | "corbata";
  className?: string;
}) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden fill="none">
      {/* torso */}
      <path d="M11 64 Q13 45 32 42.5 Q51 45 53 64 Z" fill={camisa} />
      {acento === "corbata" && (
        <>
          {/* camisa blanca en V del traje */}
          <path d="M24 44.5 L32 56 L40 44.5 Z" fill="#FFFFFF" />
          <path
            d="M32 46.5 l3.2 3.6 -3.2 8 -3.2 -8 z"
            fill="#EF4C6A"
          />
        </>
      )}
      {acento === "mochila" && (
        <>
          <rect x="19" y="46" width="5.5" height="18" rx="2.75" fill="#F8DB01" />
          <rect x="39.5" y="46" width="5.5" height="18" rx="2.75" fill="#F8DB01" />
        </>
      )}
      {/* cuello */}
      <rect x="28" y="34.5" width="8" height="9" rx="3" fill={piel} />
      {/* cabeza */}
      <circle cx="32" cy="24" r="11" fill={piel} />
      {/* pelo (media luna superior) */}
      <path
        d="M20.5 25 Q19.5 10 32 10 Q44.5 10 43.5 25 Q43.5 15.5 32 14.5 Q20.5 15.5 20.5 25 Z"
        fill={pelo}
      />
      {/* cara */}
      <circle cx="27.6" cy="25.5" r="1.5" fill={PELES.navy} />
      <circle cx="36.4" cy="25.5" r="1.5" fill={PELES.navy} />
      <path
        d="M28.5 30.5 Q32 33.5 35.5 30.5"
        stroke={PELES.navy}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {acento === "gafas" && (
        <g stroke={PELES.navy} strokeWidth="1.6" fill="none">
          <circle cx="27.4" cy="25.3" r="3.6" />
          <circle cx="36.6" cy="25.3" r="3.6" />
          <path d="M31 25.3 h2" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

/* ───────────────── Ilustración de bienvenida (izquierda) ───────────────── */

function IlustracionBienvenida({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 460 380" className={className} aria-hidden fill="none">
      {/* blob orgánico de fondo */}
      <path
        d="M30 220 Q14 96 158 74 Q306 52 336 152 Q366 252 254 292 Q96 334 30 220 Z"
        fill="#D6EEF7"
      />
      {/* pizarra/escritorio base suave */}
      <path
        d="M34 322 Q150 284 268 304 Q364 320 442 292 L442 342 Q300 372 34 344 Z"
        fill="#F0EEF7"
      />

      {/* laptop */}
      <g>
        <rect x="146" y="136" width="178" height="126" rx="12" fill="#2C2453" />
        <rect x="156" y="146" width="158" height="106" rx="7" fill="#F0EEF7" />
        <path
          d="M112 262 h246 l18 22 q5 7 -8 7 H102 q-13 0 -8 -7 Z"
          fill="#2C2453"
        />
        <rect x="216" y="268" width="38" height="6" rx="3" fill="#D6EEF7" />
      </g>

      {/* birrete de graduación dentro de la pantalla */}
      <g transform="translate(235 176)">
        <path d="M0 14 L54 30 L0 46 L-54 30 Z" fill="#2C2453" />
        <rect x="-7" y="42" width="14" height="9" rx="3" fill="#2C2453" />
        <path d="M56 30 v22" stroke="#F8DB01" strokeWidth="3.5" />
        <circle cx="56" cy="57" r="4.5" fill="#F8DB01" />
      </g>

      {/* planta izquierda */}
      <g>
        <ellipse cx="112" cy="238" rx="13" ry="34" fill="#2CAEC1" transform="rotate(-18 112 238)" />
        <ellipse cx="130" cy="230" rx="10" ry="27" fill="#7FD3DE" transform="rotate(9 130 230)" />
        <path d="M112 282 h26 l-5 26 q-1 6 -8 6 q-7 0 -8 -6 Z" fill="#FFFFFF" />
      </g>

      {/* planta derecha */}
      <g>
        <ellipse cx="356" cy="228" rx="12" ry="32" fill="#2CAEC1" transform="rotate(14 356 228)" />
        <ellipse cx="338" cy="238" rx="9" ry="24" fill="#7FD3DE" transform="rotate(-10 338 238)" />
        <path d="M336 286 h26 l-5 24 q-1 6 -8 6 q-7 0 -8 -6 Z" fill="#FFFFFF" />
      </g>

      {/* chispa de energía */}
      <path
        d="M120 96 l5 12 12 5 -12 5 -5 12 -5 -12 -12 -5 12 -5 z"
        fill="#F8DB01"
      />
      <path
        d="M348 66 l3.5 8.5 8.5 3.5 -8.5 3.5 -3.5 8.5 -3.5 -8.5 -8.5 -3.5 8.5 -3.5 z"
        fill="#EF4C6A"
      />
      <circle cx="94" cy="140" r="5" fill="#FDE7EB" />
      <circle cx="392" cy="140" r="6" fill="#FDF7C6" />
    </svg>
  );
}

/* ───────────────── carta-píldora de rol ───────────────── */

interface Rol {
  href: string;
  titulo: string;
  fondo: string;
  texto: "claro" | "marino";
  flecha: string; // clases del círculo
  flechaIcono: string; // color del icono
  persona: {
    piel: string;
    pelo: string;
    camisa: string;
    acento?: PersonaBustoPropsAcento;
  };
}

type PersonaBustoPropsAcento = "mochila" | "gafas" | "corbata";

const ROLES: Rol[] = [
  {
    href: "/estudiante",
    titulo: "Estudiante",
    fondo: "bg-gradient-to-br from-white via-tint-blue to-tint-blue",
    texto: "marino",
    flecha: "bg-navy",
    flechaIcono: "white",
    persona: { piel: PIEL_1, pelo: PELES.negro, camisa: "#5B79E3", acento: "mochila" },
  },
  {
    href: "/facilitador",
    titulo: "Facilitador",
    fondo: "bg-teal",
    texto: "marino",
    flecha: "bg-white",
    flechaIcono: "text-teal",
    persona: { piel: PIEL_2, pelo: PELES.cafe, camisa: "#F0EEF7" },
  },
  {
    href: "/psicologa",
    titulo: "Psicóloga",
    fondo: "bg-pink",
    texto: "marino",
    flecha: "bg-navy",
    flechaIcono: "white",
    persona: { piel: PIEL_1, pelo: PELES.navy, camisa: "#FFFFFF", acento: "gafas" },
  },
  {
    href: "/admin",
    titulo: "Admin",
    fondo: "bg-yellow",
    texto: "marino",
    flecha: "bg-navy",
    flechaIcono: "white",
    persona: { piel: PIEL_3, pelo: PELES.negro, camisa: "#2C2453", acento: "corbata" },
  },
];

function CartaRol({ rol }: { rol: Rol }) {
  const colorTexto = rol.texto === "marino" ? "text-navy" : "text-white";
  return (
    <Link
      href={rol.href}
      className={`group relative flex h-20 items-center overflow-hidden rounded-3xl pl-[62px] pr-3 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-modal sm:h-24 sm:pl-[70px] cursor-pointer ${rol.fondo}`}
    >
      {/* personaje asomado a la izquierda */}
      <PersonaBusto
        {...rol.persona}
        className="absolute bottom-[-6px] left-2 h-[74px] w-[74px] sm:bottom-[-4px] sm:left-2.5 sm:h-[84px] sm:w-[84px]"
      />
      <span className={`text-sm font-bold sm:text-base ${colorTexto}`}>
        {rol.titulo}
      </span>
      <span
        className={`relative ml-auto grid h-8 w-8 place-items-center rounded-full transition-transform duration-200 group-hover:scale-105 sm:h-9 sm:w-9 ${rol.flecha}`}
      >
        <ArrowRight
          size={15}
          weight="bold"
          className={rol.flechaIcono === "white" ? "text-white" : rol.flechaIcono}
        />
      </span>
    </Link>
  );
}

/* ───────────────── pantalla ───────────────── */

export default function EntradaPage() {
  return (
    <main className="relative flex-1 overflow-hidden">
      {/* formas orgánicas de marca en las esquinas */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-14 -top-16 h-64 w-64 rotate-12 rounded-[46%_54%_58%_42%/52%_44%_56%_48%] bg-yellow opacity-95"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 top-6 h-36 w-36 rounded-full border-[14px] border-tint-blue opacity-80"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-14 left-[-40px] h-40 w-72 rounded-[60%_40%_55%_45%/55%_60%_40%_45%] bg-tint-blue opacity-90 blur-[2px]"
      />

      {/* ola marina inferior derecha (como el mockup) */}
      <svg
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-44 w-[420px]"
        viewBox="0 0 420 176"
        fill="none"
      >
        <path
          d="M420 0 Q330 40 300 92 Q266 150 420 176 L420 0 Z"
          fill="#2C2453"
        />
        <path
          d="M420 176 Q270 168 226 120 Q196 88 226 62 Q260 34 420 96 Z"
          fill="#2CAEC1"
          opacity="0.35"
        />
      </svg>

      <div className="relative z-10 flex min-h-full flex-col items-center justify-center gap-8 px-5 py-12 lg:gap-10">
        {/* marca */}
        <header className="flex flex-col items-center gap-2 text-center">
          <Logo variant="color" height={60} />
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal">
            Young Lives Development Center · by fundación
          </p>
          <h1 className="pt-1 text-2xl font-bold text-navy sm:text-3xl">
            ¿Quién entra hoy?
          </h1>
          <p className="max-w-md text-sm text-ink-2">
            Elige tu rol: cada uno tiene su propio panel de trabajo.
          </p>
        </header>

        {/* cuerpo: ilustración + cartas */}
        <div className="flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-center lg:gap-14">
          <IlustracionBienvenida className="order-2 w-64 shrink-0 sm:w-80 lg:order-1 lg:w-[27rem]" />

          <div className="order-1 grid w-full max-w-xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:order-2">
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

interface VacioProps {
  titulo: string;
  texto?: string;
  /** Texto del botón de llamada a la acción. Omitir = solo ilustración. */
  etiquetaAccion?: string;
  alAccion?: () => void;
  compacto?: boolean;
}

/*
  Estado vacío del diseño: ilustración con la paleta YLDC + título + texto
  + CTA opcional. Se usa en los 4 paneles cuando no hay datos todavía.
*/
export function Vacio({
  titulo,
  texto,
  etiquetaAccion,
  alAccion,
  compacto = false,
}: VacioProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center gap-3 ${
        compacto ? "py-6" : "py-10"
      }`}
    >
      <IlustracionVacia compacto={compacto} />
      <p className={`font-bold text-navy ${compacto ? "text-sm" : "text-base"}`}>
        {titulo}
      </p>
      {texto && (
        <p className="text-xs text-ink-2 max-w-xs">{texto}</p>
      )}
      {etiquetaAccion && alAccion && (
        <button
          onClick={alAccion}
          className="mt-1 h-9 px-4 rounded-xl bg-navy text-white text-sm hover:opacity-90 cursor-pointer"
        >
          {etiquetaAccion}
        </button>
      )}
    </div>
  );
}

/** Doodle de marca: círculos de paleta + esterilla (spark) central. */
function IlustracionVacia({ compacto }: { compacto: boolean }) {
  const s = compacto ? 88 : 120;
  return (
    <svg
      width={s}
      height={(s * 76) / 120}
      viewBox="0 0 120 76"
      fill="none"
      aria-hidden
      className="mb-1"
    >
      {/* hilo de base */}
      <line
        x1="8" y1="60" x2="112" y2="60"
        stroke="#E6E7E8" strokeWidth="3" strokeLinecap="round"
      />
      {/* nodo teal */}
      <circle cx="26" cy="60" r="9" fill="#2CAEC1" />
      {/* nodo amarillo con borde */}
      <circle cx="52" cy="60" r="7" fill="#F8DB01" stroke="#2C2453" strokeWidth="2" />
      {/* esterilla rosa — el protagonista */}
      <path
        d="M79 42 l4.5 11 11 4.5 -11 4.5 -4.5 11 -4.5 -11 -11 -4.5 11 -4.5 z"
        fill="#EF4C6A"
      />
      {/* mini chispa navy */}
      <path
        d="M104 24 l2.4 5.6 5.6 2.4 -5.6 2.4 -2.4 5.6 -2.4 -5.6 -5.6 -2.4 5.6 -2.4 z"
        fill="#2C2453"
      />
      {/* motas suaves */}
      <circle cx="16" cy="24" r="3.5" fill="#DFF4F8" />
      <circle cx="96" cy="52" r="2.5" fill="#FDE7EB" />
    </svg>
  );
}

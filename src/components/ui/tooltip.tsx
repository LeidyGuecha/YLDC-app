type Side = "top" | "bottom";

interface TooltipProps {
  text: string;
  side?: Side;
  className?: string;
}

/** Tooltip navy con flecha — se posiciona sobre su wrapper `relative` más cercano. */
export function Tooltip({ text, side = "top", className = "" }: TooltipProps) {
  const position =
    side === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
      : "top-full left-1/2 -translate-x-1/2 mt-2";
  const arrow =
    side === "top"
      ? "top-full left-1/2 -translate-x-1/2 -mt-1 rotate-45"
      : "bottom-full left-1/2 -translate-x-1/2 -mb-1 rotate-45";

  return (
    <span
      role="tooltip"
      className={`absolute z-10 ${position} inline-flex items-center rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white whitespace-nowrap shadow-modal ${className}`}
    >
      {text}
      <span aria-hidden className={`absolute h-2 w-2 bg-navy ${arrow}`} />
    </span>
  );
}

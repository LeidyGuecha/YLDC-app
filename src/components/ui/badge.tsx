type Variant = "teal" | "pinkSolid" | "pinkSoft" | "yellow" | "neutral";

const variantClasses: Record<Variant, { badge: string; dot: string }> = {
  // "Completada" / "Con comentario" — tint teal + dot teal (Figma 9:42)
  teal: { badge: "bg-tint-teal text-navy", dot: "bg-teal" },
  // "Sin comentario" — pink sólido, texto blanco (Figma 9:44)
  pinkSolid: { badge: "bg-pink text-white", dot: "" },
  // estados suaves con texto rosa
  pinkSoft: { badge: "bg-tint-pink text-pink", dot: "bg-pink" },
  // "En curso" — tint yellow + dot amarillo (Figma 9:46)
  yellow: { badge: "bg-tint-yellow text-navy", dot: "bg-yellow" },
  neutral: { badge: "bg-platinum text-ink-2", dot: "" },
};

interface BadgeProps {
  variant?: Variant;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = "teal",
  dot = false,
  children,
  className = "",
}: BadgeProps) {
  const v = variantClasses[variant];
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-6 px-3 rounded-full text-xs font-medium whitespace-nowrap ${v.badge} ${className}`}
    >
      {dot && (
        <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${v.dot}`} />
      )}
      {children}
    </span>
  );
}

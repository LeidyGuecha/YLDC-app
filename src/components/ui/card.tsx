interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/** Card blanca base — rounded-2xl + sombra suave (Figma 9:40 / 9:41). */
export function Card({ children, className = "" }: CardProps) {
  // Si className trae su propio fondo (bg-*), no duplicamos el bg-white base:
  // dos clases bg-* competirían y ganaría el orden del stylesheet, no el del atributo.
  const hasBg = /(^|\s)bg-/.test(className);
  return (
    <div
      className={`rounded-2xl shadow-card ${hasBg ? "" : "bg-white"} ${className}`}
    >
      {children}
    </div>
  );
}

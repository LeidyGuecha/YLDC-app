interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/** Card blanca base — rounded-2xl + sombra suave (Figma 9:40 / 9:41). */
export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

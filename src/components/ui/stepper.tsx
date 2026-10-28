type StepState = "done" | "current" | "upcoming";

const SESSION_STEPS = ["Cómo vengo", "Actividad", "Cómo voy"] as const;

const dotClasses: Record<StepState, string> = {
  done: "border-teal bg-teal",
  current: "border-navy bg-navy",
  upcoming: "border-stroke bg-white",
};

const labelClasses: Record<StepState, string> = {
  done: "text-ink-2",
  current: "text-navy font-semibold",
  upcoming: "text-ink-disabled",
};

interface StepperProps {
  /** Índice de la fase actual: 0 = Cómo vengo, 1 = Actividad, 2 = Cómo voy. */
  current: 0 | 1 | 2;
  className?: string;
}

/** Barra de progreso de sesión — dots teal (hecho) · navy (actual) · outline (pendiente). */
export function Stepper({ current, className = "" }: StepperProps) {
  return (
    <ol className={`flex items-start gap-2 ${className}`}>
      {SESSION_STEPS.map((label, i) => {
        const state: StepState =
          i < current ? "done" : i === current ? "current" : "upcoming";
        const isLast = i === SESSION_STEPS.length - 1;
        return (
          <li
            key={label}
            className="flex items-center gap-2 flex-1 last:flex-none"
          >
            <div className="flex flex-col items-center gap-1.5">
              <span
                aria-current={state === "current" ? "step" : undefined}
                className={`h-2.5 w-2.5 rounded-full border-2 ${dotClasses[state]}`}
              />
              <span className={`text-[11px] leading-tight ${labelClasses[state]}`}>
                {label}
              </span>
            </div>
            {!isLast && (
              <span
                aria-hidden
                className={`h-0.5 flex-1 rounded-full mt-1 ${
                  i < current ? "bg-teal" : "bg-platinum"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

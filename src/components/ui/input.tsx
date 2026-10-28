import { useId } from "react";
import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({
  label,
  error,
  hint,
  className = "",
  id,
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-navy"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={!!error}
        className={`h-11 w-full px-4 text-sm rounded-lg border bg-white text-ink placeholder:text-ink-disabled transition-colors focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal ${
          error ? "border-pink ring-2 ring-pink" : "border-stroke"
        } ${className}`}
        {...rest}
      />
      {error ? (
        <p className="text-xs text-pink">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-2">{hint}</p>
      ) : null}
    </div>
  );
}

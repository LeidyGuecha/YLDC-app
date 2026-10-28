import { useId } from "react";
import type { SelectHTMLAttributes } from "react";
import { CaretDown } from "@phosphor-icons/react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({
  label,
  error,
  className = "",
  id,
  children,
  ...rest
}: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-navy">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={!!error}
          className={`h-11 w-full pl-4 pr-10 text-sm rounded-lg border bg-white text-ink appearance-none transition-colors focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal ${
            error ? "border-pink ring-2 ring-pink" : "border-stroke"
          } ${className}`}
          {...rest}
        >
          {children}
        </select>
        <CaretDown
          aria-hidden
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy pointer-events-none"
          size={16}
        />
      </div>
      {error && <p className="text-xs text-pink">{error}</p>}
    </div>
  );
}

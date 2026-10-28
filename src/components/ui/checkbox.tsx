"use client";

import { Check } from "@phosphor-icons/react";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

/** Checkbox YLDC — marcado: fondo amarillo + check navy; libre: borde #C9C9CE. */
export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  className = "",
  id,
}: CheckboxProps) {
  return (
    <label
      className={`inline-flex items-center gap-2.5 select-none ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
    >
      <input
        id={id}
        type="checkbox"
        role="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 bg-white transition-colors ${
          checked ? "border-yellow bg-yellow" : "border-stroke"
        }`}
      >
        {checked && <Check size={12} weight="bold" className="text-navy" />}
      </span>
      {label && <span className="text-sm text-ink">{label}</span>}
    </label>
  );
}

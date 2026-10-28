import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "outlineRosa";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-yellow text-navy hover:bg-[#e3c900] active:bg-[#d4bd00] disabled:bg-platinum disabled:text-ink-disabled",
  outline:
    "bg-white text-navy border border-navy hover:bg-tint-navy active:bg-tint-navy/70 disabled:border-platinum disabled:text-ink-disabled disabled:bg-white",
  outlineRosa:
    "bg-white text-pink border border-pink hover:bg-tint-pink active:bg-tint-pink/70 disabled:border-platinum disabled:text-ink-disabled disabled:bg-white",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px] rounded-lg",
  md: "h-10 px-5 text-sm rounded-xl", // h41 desktop (Figma 9:2)
  lg: "h-12 px-8 text-base rounded-full", // CTA grande móvil (Figma 9:12)
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

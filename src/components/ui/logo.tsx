import Image from "next/image";

/**
 * Logo oficial de Young Lives Development Center by Fondacio.
 * Extraído del brandboard oficial (Brandboard (2).jpg) con transparencia.
 *
 * Variantes y uso según fondo:
 *  - color:  multicolor (isotipo teal/rosa/amarillo + Space Cadet) → fondos claros. **Principal (default)**.
 *  - dark:   tinta blanca     → fondos oscuros (navy, rosa)
 *  - light:  Space Cadet      → fondos claros (versión monocroma p/ tamaños pequeños)
 *  - yellow: Sizzling Sunrise → fondos Space Cadet (como el bloque navy del brandboard)
 *  - rose:   Infra Red        → decorativa
 *  - teal:   Blue Green       → decorativa
 */

export type LogoVariant =
  | "color"
  | "dark"
  | "light"
  | "yellow"
  | "rose"
  | "teal";

const LOGO_DIMS = { width: 449, height: 290 };
const ISOTIPO_DIMS = { width: 245, height: 251 };

interface LogoProps {
  variant?: LogoVariant;
  /** true = solo el ícono (figura sobre los círculos), sin texto */
  isotipo?: boolean;
  /** Altura en px. Default: 36 (logo) / 30 (isotipo). El ancho es automático. */
  height?: number;
  priority?: boolean;
  className?: string;
}

export function Logo({
  variant = "color",
  isotipo = false,
  height,
  priority = false,
  className = "",
}: LogoProps) {
  const dims = isotipo ? ISOTIPO_DIMS : LOGO_DIMS;
  const h = height ?? (isotipo ? 30 : 36);
  return (
    <Image
      src={isotipo ? `/logo/isotipo-${variant}.png` : `/logo/logo-yldc-${variant}.png`}
      alt="Young Lives Development Center · by Fondacio"
      width={dims.width}
      height={dims.height}
      style={{ height: h, width: "auto" }}
      priority={priority}
      className={className}
    />
  );
}

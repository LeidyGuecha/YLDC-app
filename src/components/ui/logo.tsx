import Image from "next/image";

/**
 * Logo oficial de Young Lives Development Center by Fondacio.
 * Extraído del brandboard oficial (Brandboard (2).jpg) con transparencia.
 *
 * Variantes y uso según fondo:
 *  - dark:   tinta blanca   → fondos oscuros (navy, rosa, teal, fotos)
 *  - light:  Space Cadet    → fondos claros (blanco, platinum, amarillo)
 *  - yellow: amarillo       → fondos Space Cadet (como en el brandboard)
 *  - rose:   Infra Red      → decorativa
 *  - teal:   Blue Green     → decorativa
 */

export type LogoVariant = "dark" | "light" | "yellow" | "rose" | "teal";

const LOGO_DIMS = { width: 428, height: 280 };
const ISOTIPO_DIMS = { width: 184, height: 256 };

interface LogoProps {
  variant?: LogoVariant;
  /** true = solo el ícono (figura), sin texto */
  isotipo?: boolean;
  /** Altura en px. Default: 36 (logo) / 30 (isotipo). El ancho es automático. */
  height?: number;
  priority?: boolean;
  className?: string;
}

export function Logo({
  variant = "light",
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

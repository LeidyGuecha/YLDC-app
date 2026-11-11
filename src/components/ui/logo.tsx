import Image from "next/image";

/**
 * Logo oficial de Young Lives Development Center by Fondacio.
 * Generado desde «00_Young_Lives_logo_sin_fondo.png»: figura blanca opaca
 * con fondo transparente — correcta sobre navy y sobre fondos claros.
 *
 * La variante solo cambia el color del texto:
 *  - color:  navy → fondos claros. **Principal (default)**.
 *  - dark:   blanco → fondos navy (paneles de los logins).
 *  - light:  navy → versión monocroma p/ tamaños pequeños.
 *  - yellow / rose / teal: texto en el color del token (decorativas).
 */

export type LogoVariant =
  | "color"
  | "dark"
  | "light"
  | "yellow"
  | "rose"
  | "teal";

const LOGO_DIMS = { width: 953, height: 600 };
const ISOTIPO_DIMS = { width: 640, height: 687 };

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

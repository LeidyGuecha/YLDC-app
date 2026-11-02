import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // pantalla-sesion.tsx: el contexto vive en localStorage y el estado de la
    // sesión se sondea por RPC cada 10 s — ambos son lecturas de sistemas
    // externos que por legítimo diseño actualizan setState dentro de useEffect.
    files: ["src/app/estudiante/pantalla-sesion.tsx"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
]);

export default eslintConfig;

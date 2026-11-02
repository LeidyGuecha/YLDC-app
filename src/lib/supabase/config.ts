/*
  Configuración pública de Supabase (cliente).
  Las credenciales van en .env.local (ver .env.local.spec):
    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_ANON_KEY=
  Mientras no existan, la app corre en MODO DEMO con datos en el navegador
  (src/lib/estudiante/mock.ts) sin romper nada.
*/

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigurado: boolean = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY,
);

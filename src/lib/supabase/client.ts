import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigurado } from "./config";

/*
  Cliente de navegador (singleton).
  El estudiante NO tiene cuenta de Auth: toda su escritura pasa por las RPC
  SECURITY DEFINER del schema (fn_unirse_sesion, fn_guardar_respuesta, …),
  que validan el PIN internamente — el anon key solo puede usarlas.
*/

let cliente: SupabaseClient | null = null;

/** Devuelve el cliente de Supabase, o null si aún no se configuró .env.local. */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigurado) return null;
  if (!cliente) {
    cliente = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false }, // el flujo del estudiante es anónimo
      realtime: { params: { eventsPerSecond: 4 } }, // lo usará el facilitador
    });
  }
  return cliente;
}

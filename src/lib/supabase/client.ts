import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigurado } from "./config";

/*
  Cliente de navegador (singleton).
  · El estudiante NO tiene cuenta de Auth: toda su escritura pasa por las RPC
    SECURITY DEFINER del schema (fn_unirse_sesion, fn_guardar_respuesta, …),
    que validan el PIN internamente — el anon key solo puede usarlas.
  · Los roles adulto (facilitadora/psicóloga/admin) SÍ inician sesión con
    Supabase Auth en el mismo cliente: persistSession guarda su sesión para
    que los paneles sobrevivan a recargas (la RLS la alimenta).
*/

let cliente: SupabaseClient | null = null;

/** Devuelve el cliente de Supabase, o null si aún no se configuró .env.local. */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigurado) return null;
  if (!cliente) {
    cliente = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      // ON para los paneles (facilitadora/psicóloga/admin); al estudiante le
      // es transparente: su flujo sigue siendo anónimo vía RPC con PIN.
      auth: { persistSession: true },
      realtime: { params: { eventsPerSecond: 4 } }, // monitor del facilitador
    });
  }
  return cliente;
}

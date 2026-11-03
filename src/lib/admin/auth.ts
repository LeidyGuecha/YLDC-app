import { getSupabase } from "@/lib/supabase/client";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { ErrorPanelo } from "@/lib/facilitador/auth"; // vocabulario de error compartido
import type { PerfilAdmin } from "./types";

/*
  Autenticación del admin sobre Supabase Auth (email + password).
  El vínculo cuenta↔rol vive en admins.auth_id (paso 5 del README de
  supabase) con activo = true. Máximo 3 cuentas (brief §13).
*/

export { ErrorPanelo };

/** Login del admin: valida credenciales + vínculo + cuenta activa. */
export async function iniciarSesion(
  correo: string,
  contrasena: string,
): Promise<PerfilAdmin> {
  if (!supabaseConfigurado) throw new ErrorPanelo("SIN_CONFIGURACION");
  const sb = getSupabase()!;

  const { error } = await sb.auth.signInWithPassword({
    email: correo.trim().toLowerCase(),
    password: contrasena,
  });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("invalid login") || m.includes("invalid credentials")) {
      throw new ErrorPanelo("CREDENCIALES_INVALIDAS");
    }
    throw new ErrorPanelo("RED", error.message);
  }

  const perfil = await miPerfil();
  if (!perfil) {
    await sb.auth.signOut();
    throw new ErrorPanelo("SIN_ROL_VINCULADO");
  }
  if (!perfil.activo) {
    await sb.auth.signOut();
    throw new ErrorPanelo("CUENTA_DESACTIVADA");
  }
  return perfil;
}

/** Perfil del admin autenticado (ROW admins). null si no hay sesión o no es admin. */
export async function miPerfil(): Promise<PerfilAdmin | null> {
  const sb = getSupabase()!;
  const { data } = await sb.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return null;

  // RLS: solo admin ve la tabla admins (policy admins_admin_todo)
  const { data: fila, error } = await sb
    .from("admins")
    .select("id,nombre_completo,correo,activo")
    .eq("auth_id", uid)
    .maybeSingle();
  if (error || !fila) return null;
  const r = fila as unknown as {
    id: string;
    nombre_completo: string;
    correo: string;
    activo: boolean;
  };
  return {
    id: r.id,
    nombreCompleto: r.nombre_completo,
    correo: r.correo,
    activo: r.activo,
  };
}

export async function cerrarSesion(): Promise<void> {
  const sb = getSupabase()!;
  await sb.auth.signOut();
}

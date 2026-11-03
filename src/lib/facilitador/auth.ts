import { getSupabase } from "@/lib/supabase/client";
import { supabaseConfigurado } from "@/lib/supabase/config";
import type { CodigoErrorEstudiante } from "@/lib/estudiante/types";
import type { PerfilFacilitador } from "./types";

/*
  Autenticación de los roles adulto sobre Supabase Auth (email + password).
  El vínculo cuenta↔rol vive en facilitadores.auth_id (paso 5 del README
  de supabase): sin ese UPDATE la cuenta entra pero el panel la rechaza.
*/

export class ErrorPanelo extends Error {
  code: CodigoErrorEstudiante | "CREDENCIALES_INVALIDAS" | "SIN_ROL_VINCULADO" | "CUENTA_DESACTIVADA";
  constructor(
    code:
      | CodigoErrorEstudiante
      | "CREDENCIALES_INVALIDAS"
      | "SIN_ROL_VINCULADO"
      | "CUENTA_DESACTIVADA",
    mensaje?: string,
  ) {
    super(mensaje ?? code);
    this.code = code;
  }
}

/** Login del facilitador: valida credenciales + vínculo + cuenta activa. */
export async function iniciarSesion(
  correo: string,
  contrasena: string,
): Promise<PerfilFacilitador> {
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

/** Perfil del facilitador autenticado (ROW facilitadores). null si no hay sesión o no es facilitador. */
export async function miPerfil(): Promise<PerfilFacilitador | null> {
  const sb = getSupabase()!;
  const { data } = await sb.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return null;

  // RLS: lee su propia fila por auth_id (policy facilitadores_admin_psico_lectura)
  const { data: fila, error } = await sb
    .from("facilitadores")
    .select("id,nombre_completo,correo,activo")
    .eq("auth_id", uid)
    .maybeSingle();
  if (error || !fila) return null;
  return {
    id: fila.id,
    nombreCompleto: fila.nombre_completo,
    correo: fila.correo,
    activo: fila.activo,
  };
}

export async function cerrarSesion(): Promise<void> {
  const sb = getSupabase()!;
  await sb.auth.signOut();
}

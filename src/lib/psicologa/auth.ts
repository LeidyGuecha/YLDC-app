import { getSupabase } from "@/lib/supabase/client";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { ErrorPanelo } from "@/lib/facilitador/auth"; // vocabulario de error compartido
import type { PerfilPsicologa } from "./types";

/*
  Autenticación de la psicóloga sobre Supabase Auth (email + password).
  El vínculo cuenta↔rol vive en psicologas.auth_id (paso 5 del README de
  supabase) con activa = true. Sin vínculo, el login devuelve SIN_ROL_VINCULADO.
*/

export { ErrorPanelo };

/** Login de la psicóloga: valida credenciales + vínculo + cuenta activa. */
export async function iniciarSesion(
  correo: string,
  contrasena: string,
): Promise<PerfilPsicologa> {
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
  if (!perfil.activa) {
    await sb.auth.signOut();
    throw new ErrorPanelo("CUENTA_DESACTIVADA");
  }
  return perfil;
}

/** Perfil de la psicóloga autenticada (ROW psicologas). null si no hay sesión o no es psicóloga. */
export async function miPerfil(): Promise<PerfilPsicologa | null> {
  const sb = getSupabase()!;
  const { data } = await sb.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return null;

  // RLS: lee su propia fila por auth_id (policy psicologas_admin_lectura)
  const { data: fila, error } = await sb
    .from("psicologas")
    .select("id,nombre_completo,correo,activa,colegio_id,colegio:colegios(nombre)")
    .eq("auth_id", uid)
    .maybeSingle();
  if (error || !fila) return null;
  const r = fila as unknown as {
    id: string;
    nombre_completo: string;
    correo: string;
    activa: boolean;
    colegio_id: string | null;
    colegio: { nombre?: string } | null;
  };
  return {
    id: r.id,
    nombreCompleto: r.nombre_completo,
    correo: r.correo,
    colegioId: r.colegio_id,
    colegioNombre: r.colegio?.nombre ?? null,
    activa: r.activa,
  };
}

export async function cerrarSesion(): Promise<void> {
  const sb = getSupabase()!;
  await sb.auth.signOut();
}

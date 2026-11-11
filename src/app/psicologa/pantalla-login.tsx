"use client";

import { PantallaLoginStaff } from "@/components/pantalla-login-staff";
import { iniciarSesion, miPerfil } from "@/lib/psicologa/auth";

/*
  Login de la psicóloga (mockup 2.1 — la misma pantalla sirve para
  facilitador, psicóloga y admin): correo + contraseña de Supabase Auth.
  La cuenta debe estar vinculada a psicologas.auth_id (paso 5 del README de
  supabase) y con activa = true. Si la fila tiene colegio_id nulo, ve todos
  los colegios (caso piloto).
*/

export function PantallaLoginPsicologa() {
  return (
    <PantallaLoginStaff
      acento="pink"
      placeholderCorreo="sara.marquez@yldc.app"
      rutaPanel="/psicologa/panel"
      iniciarSesion={iniciarSesion}
      yaDentro={async () => Boolean((await miPerfil())?.activa)}
    />
  );
}

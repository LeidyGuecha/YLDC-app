"use client";

import { PantallaLoginStaff } from "@/components/pantalla-login-staff";
import { iniciarSesion, miPerfil } from "@/lib/facilitador/auth";

/*
  Login del facilitador (mockup 2.1 — la misma pantalla sirve para
  facilitador, psicóloga y admin): correo + contraseña de Supabase Auth.
  La cuenta debe estar vinculada a facilitadores.auth_id (paso 5 del README
  de supabase) y con activo = true.
*/

export function PantallaLoginFacilitador() {
  return (
    <PantallaLoginStaff
      acento="teal"
      placeholderCorreo="maria.torres@yldc.app"
      rutaPanel="/facilitador/panel"
      iniciarSesion={iniciarSesion}
      yaDentro={async () => Boolean((await miPerfil())?.activo)}
    />
  );
}

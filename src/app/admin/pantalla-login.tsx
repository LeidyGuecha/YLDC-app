"use client";

import { PantallaLoginStaff } from "@/components/pantalla-login-staff";
import { iniciarSesion, miPerfil } from "@/lib/admin/auth";

/*
  Login del admin (mockup 2.1 — la misma pantalla sirve para facilitador,
  psicóloga y admin): correo + contraseña de Supabase Auth. La cuenta debe
  estar vinculada a admins.auth_id (paso 5 del README de supabase) y con
  activo = true. Máximo 3 cuentas (brief §13).
*/

export function PantallaLoginAdmin() {
  return (
    <PantallaLoginStaff
      acento="teal"
      placeholderCorreo="admin2@yldc.app"
      rutaPanel="/admin/panel"
      iniciarSesion={iniciarSesion}
      yaDentro={async () => Boolean((await miPerfil())?.activo)}
    />
  );
}

import { PantallaPanelAdmin } from "./pantalla-panel";

/*
  Ruta /admin/panel — el panel en sí (mockups 4.x).
  Server Component mínimo; todo el panel vive en pantalla-panel (client).
  Sin sesión de Auth válida, pantalla-panel redirige a /admin.
*/
export const metadata = { title: "Panel · Admin · YLDC" };

export default function PanelAdminPage() {
  return <PantallaPanelAdmin />;
}

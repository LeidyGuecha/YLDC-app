import { PantallaPanelFacilitador } from "../pantalla-panel";

/*
  Ruta /facilitador/panel — el panel en sí (mockups 2.2–2.6).
  Server Component mínimo; todo el panel vive en pantalla-panel (client).
  Sin sesión de Auth válida, pantalla-panel redirige a /facilitador.
*/
export const metadata = { title: "Panel · Facilitador · YLDC" };

export default function PanelFacilitadorPage() {
  return <PantallaPanelFacilitador />;
}

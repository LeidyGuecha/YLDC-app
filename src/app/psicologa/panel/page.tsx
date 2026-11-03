import { PantallaPanelPsicologa } from "../pantalla-panel";

/*
  Ruta /psicologa/panel — el panel en sí (mockups 3.x).
  Server Component mínimo; todo el panel vive en pantalla-panel (client).
  Sin sesión de Auth válida, pantalla-panel redirige a /psicologa.
*/
export const metadata = { title: "Panel · Psicóloga · YLDC" };

export default function PanelPsicologaPage() {
  return <PantallaPanelPsicologa />;
}

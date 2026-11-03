import { PantallaLoginPsicologa } from "./pantalla-login";

/*
  Ruta /psicologa — login del panel (mockups 3.x).
  Server Component mínimo; toda la interactividad vive en pantalla-login.
*/
export const metadata = { title: "Psicóloga · YLDC" };

export default function PsicologaPage() {
  return <PantallaLoginPsicologa />;
}

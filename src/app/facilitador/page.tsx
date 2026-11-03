import { PantallaLoginFacilitador } from "./pantalla-login";

/*
  Ruta /facilitador — login del panel (mockups 2.1).
  Server Component mínimo; toda la interactividad vive en pantalla-login.
*/
export const metadata = { title: "Facilitador · YLDC" };

export default function FacilitadorPage() {
  return <PantallaLoginFacilitador />;
}

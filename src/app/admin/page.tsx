import { PantallaLoginAdmin } from "./pantalla-login";

/*
  Ruta /admin — login del panel del admin (mockups 4.x).
  Server Component mínimo; toda la interactividad vive en pantalla-login.
*/
export const metadata = { title: "Admin · YLDC" };

export default function AdminPage() {
  return <PantallaLoginAdmin />;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Estudiante · YLDC",
  description: "Únete a tu sesión con el PIN de tu facilitador",
};

export default function EstudianteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* Contenedor flex: los <main flex-1> de las pantallas estiran hasta el borde
     inferior (sin él, el panel navy del login no llega hasta abajo). */
  return <div className="flex flex-1 flex-col">{children}</div>;
}

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
  return <div className="flex-1">{children}</div>;
}

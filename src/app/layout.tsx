import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YLDC by Fondacio",
  description:
    "Plataforma de acompañamiento socioemocional para jóvenes — Young Leaders Development Cycle",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

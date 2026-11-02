import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

/* Poppins por next/font: se autohospeda, cero peticiones externas y
   sin layout shift — activa la var --font-poppins que ya espera globals.css. */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "YLDC by Fondacio",
  description:
    "Plataforma de acompañamiento socioemocional para jóvenes — Young Leaders Development Cycle",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" className={`h-full antialiased ${poppins.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

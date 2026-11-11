import Image from "next/image";
import { Logo } from "@/components/ui";

/*
  Panel navy del lado izquierdo de los logins (mockups 2.1 y 1.1 escritorio):
  acento + lockup arriba, ilustración de bienvenida al centro y tagline abajo.
  Es el mismo panel para todos los roles: el login 2.1 sirve para facilitador,
  psicóloga y admin. En pantallas pequeñas se oculta (hidden lg:flex).
*/
export function PanelMarca() {
  return (
    <aside className="hidden lg:flex relative overflow-hidden bg-navy flex-col items-center justify-between pt-14 pb-11 px-16 text-center">
      <div className="flex flex-col items-center gap-[15px]">
        <div className="h-[5px] w-11 rounded-full bg-yellow" aria-hidden="true" />
        <Logo variant="dark" height={86} priority />
      </div>

      <Image
        src="/ilustraciones/iniciar-sesion.png"
        alt="Estudiantes acompañando su proceso vocacional alrededor de un computador"
        width={440}
        height={293}
        priority
        className="h-auto w-[440px] max-w-full"
      />

      <p className="max-w-[430px] text-base leading-relaxed text-[#d1cfd9]">
        Talleres de Orientación Socio-Ocupacional
        <br />
        Ciudad Bolívar · YLDC by Fondacio
      </p>
    </aside>
  );
}

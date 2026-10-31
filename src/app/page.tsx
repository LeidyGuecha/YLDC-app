"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Select,
  Badge,
  Card,
  Checkbox,
  Tooltip,
  Stepper,
  Logo,
} from "@/components/ui";

const PALETTE = [
  { name: "navy", hex: "#2C2453", cls: "bg-navy" },
  { name: "yellow", hex: "#F8DB01", cls: "bg-yellow" },
  { name: "pink", hex: "#EF4C6A", cls: "bg-pink" },
  { name: "teal", hex: "#2CAEC1", cls: "bg-teal" },
  { name: "platinum", hex: "#E6E7E8", cls: "bg-platinum" },
  { name: "tint-teal", hex: "#DFF4F8", cls: "bg-tint-teal" },
  { name: "tint-pink", hex: "#FDE7EB", cls: "bg-tint-pink" },
  { name: "tint-yellow", hex: "#FDF7C6", cls: "bg-tint-yellow" },
  { name: "tint-blue", hex: "#D6EEF7", cls: "bg-tint-blue" },
  { name: "tint-navy", hex: "#F0EEF7", cls: "bg-tint-navy" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-navy border-b border-platinum pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function Home() {
  const [checkedDemo, setCheckedDemo] = useState(true);
  const [checkedDemo2, setCheckedDemo2] = useState(false);

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 flex flex-col gap-12">
      <header className="flex flex-col gap-4">
        <Logo variant="light" height={48} />
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-teal">
          Young Leaders Development Cycle
        </p>
        <h1 className="text-3xl font-bold text-navy">
          Sistema de diseño YLDC
        </h1>
        <p className="text-sm text-ink-2">
          Componentes base — espejo de los mockups de Figma. Tipografía Poppins
          (pendiente de instalar) con fallback Segoe UI.
        </p>
      </header>

      <Section title="Logo de marca (brandboard oficial)">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card className="p-5 bg-navy flex items-center justify-center min-h-32">
            <Logo variant="dark" height={40} />
          </Card>
          <Card className="p-5 border border-platinum shadow-none flex items-center justify-center min-h-32">
            <Logo variant="light" height={40} />
          </Card>
          <Card className="p-5 bg-navy flex items-center justify-center min-h-32">
            <Logo variant="yellow" height={40} />
          </Card>
          <Card className="p-5 border border-platinum shadow-none flex items-center justify-center min-h-32">
            <Logo variant="rose" height={40} />
          </Card>
          <Card className="p-5 border border-platinum shadow-none flex items-center justify-center min-h-32">
            <Logo variant="teal" height={40} />
          </Card>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-xs text-ink-2">Isotipos:</span>
          <Card className="p-3 bg-navy flex items-center justify-center">
            <Logo variant="dark" isotipo height={28} />
          </Card>
          <Card className="p-3 border border-platinum shadow-none flex items-center justify-center">
            <Logo variant="light" isotipo height={28} />
          </Card>
          <Card className="p-3 bg-navy flex items-center justify-center">
            <Logo variant="yellow" isotipo height={28} />
          </Card>
          <Card className="p-3 border border-platinum shadow-none flex items-center justify-center">
            <Logo variant="rose" isotipo height={28} />
          </Card>
          <Card className="p-3 border border-platinum shadow-none flex items-center justify-center">
            <Logo variant="teal" isotipo height={28} />
          </Card>
        </div>
        <p className="text-xs text-ink-2">
          Uso: <code className="text-navy">&lt;Logo variant="dark" /&gt;</code> en
          fondos oscuros (navy, rosa) · <code className="text-navy">variant="light"</code>{" "}
          en claros (blanco, amarillo) · <code className="text-navy">variant="yellow"</code>{" "}
          sobre Space Cadet · rose/teal decorativas ·{" "}
          <code className="text-navy">isotipo</code> para el ícono solo.
        </p>
      </Section>

      <Section title="Paleta">
        <div className="grid grid-cols-5 gap-3">
          {PALETTE.map((c) => (
            <div key={c.name} className="flex flex-col gap-1.5 items-start">
              <span
                className={`h-14 w-full rounded-lg border border-platinum ${c.cls}`}
              />
              <span className="text-xs font-medium text-navy">{c.name}</span>
              <span className="text-[11px] text-ink-2">{c.hex}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Botones">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Continuar</Button>
          <Button variant="outline">Cancelar</Button>
          <Button variant="outlineRosa">Sí, cerrar sesión</Button>
          <Button disabled>Deshabilitado</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Pequeño</Button>
          <Button size="md">Medio (h41)</Button>
          <Button size="lg">Continuar (móvil)</Button>
        </div>
      </Section>

      <Section title="Inputs y Select">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
          <Input
            label="Nombre de la sesión"
            placeholder="Ej. Sesión 4 — ¿Cómo vengo?"
            hint="Máximo 60 caracteres"
          />
          <Input
            label="PIN de sesión"
            placeholder="841279"
            defaultValue="8412"
            error="Escribe al menos 200 caracteres"
          />
          <Select label="Curso" defaultValue="11a">
            <option value="11a">11°-A</option>
            <option value="11b">11°-B</option>
            <option value="10a">10°-A</option>
          </Select>
          <Input label="Enfocado (teal 2px)" placeholder="Estoy escribiendo…" />
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="teal" dot>
            Completada
          </Badge>
          <Badge variant="teal" dot>
            Con comentario
          </Badge>
          <Badge variant="yellow" dot>
            En curso
          </Badge>
          <Badge variant="pinkSolid">Sin comentario</Badge>
          <Badge variant="pinkSoft" dot>
            3 pendientes
          </Badge>
          <Badge variant="neutral">Borrador</Badge>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card className="p-5">
            <p className="text-sm font-semibold text-navy">Card base 9:40</p>
            <p className="text-sm text-ink-2 mt-1">
              Superficie blanca, rounded-2xl, sombra suave.
            </p>
          </Card>
          <Card className="p-5 bg-tint-blue">
            <p className="text-sm font-semibold text-navy">Clima · Lluvioso</p>
            <p className="text-sm text-ink-2 mt-1">
              Variante tint azul #D6EEF7.
            </p>
          </Card>
          <Card className="p-5 bg-navy">
            <p className="text-sm font-semibold text-white">Clima · Tormenta</p>
            <p className="text-sm text-white/70 mt-1">
              Variante navy, texto claro.
            </p>
          </Card>
        </div>
      </Section>

      <Section title="Checkbox, Tooltip y Stepper">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-6">
            <Checkbox
              checked={checkedDemo}
              onChange={setCheckedDemo}
              label="Opción seleccionada (amarillo + check navy)"
            />
            <Checkbox
              checked={checkedDemo2}
              onChange={setCheckedDemo2}
              label="Opción libre (borde #C9C9CE)"
            />
          </div>
          <div>
            <span className="relative inline-flex">
              <span className="underline decoration-dotted text-sm text-navy cursor-help">
                Pasa el mouse (tooltip 4.2)
              </span>
              <Tooltip text="Editar estudiante" />
            </span>
          </div>
          <div className="flex flex-col gap-6 max-w-md">
            <Stepper current={0} />
            <Stepper current={1} />
            <Stepper current={2} />
          </div>
        </div>
      </Section>
    </main>
  );
}

# YLDC by Fondacio — Plataforma

Plataforma de acompañamiento socioemocional para jóvenes (Young Leaders Development Cycle).
**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase (PostgreSQL, Auth, Realtime, Storage).

## Puesta en marcha

```bash
npm install
npm run dev        # http://localhost:3000
```

Página raíz (`/`) = **selector de acceso por rol** («¿Quién entra hoy?»). El
showcase del sistema de diseño (paleta YLDC, botones, inputs, badges, cards,
checkbox, tooltip, stepper) vive en `/diseno`.

## Variables de entorno

1. Copia `.env.example` → `.env.local`
2. Pega `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` desde *Project Settings → API* en Supabase.

## Estructura (planeada por fases)

```
src/
  app/
    (estudiante)/    # flujo PIN → identificación → sesión en vivo (1.1–1.10)
    (facilitador)/   # login → sesiones → monitor en vivo (2.1–2.8)
    (psicologa)/     # cursos → comentarios (3.1–3.4)
    (admin)/         # colegios, cursos, estudiantes, reportes (4.1–4.7)
  components/
    ui/              # ✅ kit base (Button, Input, Select, Badge, Card, Checkbox, Tooltip, Stepper)
    layout/          # sidebars, headers (por construir)
  lib/               # cliente Supabase, helpers, tipos
supabase/            # schema.sql + seed.sql (pegar en el SQL Editor)
```

## Despliegue

**Producción:** https://yldc-app.vercel.app

La app está desplegada en Vercel (equipo `YLDC-Talleres`, proyecto `yldc-app`)
conectada al repositorio `LeidyGuecha/YLDC-app`. Cada push a `main` publica en
producción; las ramas generan *previews*.

Las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` se
configuran en Vercel (Settings → Environment Variables) y nunca se versionan.
El detalle completo está en [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md).

## Roles y acceso

| Rol | Acceso | Pantallas |
|---|---|---|
| Estudiante | **PIN de sesión** (sin cuenta) | 1.1–1.10 |
| Facilitador | Email + password (Supabase Auth) | 2.1–2.8 |
| Psicóloga | Email + password (Supabase Auth) | 3.1–3.4 |
| Admin | Email + password (Supabase Auth) | 4.1–4.7 |

## Convenciones de diseño

- Paleta YLDC como tokens Tailwind (`bg-navy`, `text-pink`, `bg-tint-teal`, …) — ver `globals.css`.
- **Logo:** componente `<Logo variant="color|dark|light|yellow|rose|teal" isotipo? />` (`src/components/ui/logo.tsx`). Archivos en `public/logo/` extraídos del brandboard oficial. **Principal = `color`** (multicolor, fondos claros — es el default) · `dark` (blanca) en fondos oscuros · `light` (Space Cadet mono) en claros · `yellow` sobre navy · rose/teal decorativas.
- Grid 8pt (espaciados múltiplos de 4px/8px), esquinas: botones `rounded-xl`, cards `rounded-2xl`, CTA móvil `rounded-full`.
- Español colombiano, fechas `19/03/2026`, horas `10:05 a.m.`

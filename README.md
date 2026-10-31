# YLDC by Fondacio — Plataforma

Plataforma de acompañamiento socioemocional para jóvenes (Young Leaders Development Cycle).
**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase (PostgreSQL, Auth, Realtime, Storage).

## Puesta en marcha

```bash
npm install
npm run dev        # http://localhost:3000
```

Página raíz (`/`) = **showcase del sistema de diseño** (paleta YLDC, botones, inputs, badges, cards, checkbox, tooltip, stepper). Valídala contra los mockups de `../mockups/png/`.

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

## Pendientes de setup externo

- **Poppins:** copiar `Poppins-Regular/Medium/SemiBold/Bold.ttf` a `src/fonts/` y montar `next/font/local` en `layout.tsx` (el CSS ya referencia `var(--font-poppins)`).
- **Supabase:** crear proyecto `yldc-fondacio` (región São Paulo) y pegar `supabase/schema.sql` + `seed.sql` en el SQL Editor.
- **GitHub:** repo remoto `yldc-app` + primer push.

## Roles y acceso

| Rol | Acceso | Pantallas |
|---|---|---|
| Estudiante | **PIN de sesión** (sin cuenta) | 1.1–1.10 |
| Facilitador | Email + password (Supabase Auth) | 2.1–2.8 |
| Psicóloga | Email + password (Supabase Auth) | 3.1–3.4 |
| Admin | Email + password (Supabase Auth) | 4.1–4.7 |

## Convenciones de diseño

- Paleta YLDC como tokens Tailwind (`bg-navy`, `text-pink`, `bg-tint-teal`, …) — ver `globals.css`.
- **Logo:** componente `<Logo variant="dark|light|yellow|rose|teal" isotipo? />` (`src/components/ui/logo.tsx`). Archivos en `public/logo/` extraídos del brandboard oficial. `dark` (blanca) en fondos oscuros · `light` (Space Cadet) en claros · `yellow` sobre navy · rose/teal decorativas.
- Grid 8pt (espaciados múltiplos de 4px/8px), esquinas: botones `rounded-xl`, cards `rounded-2xl`, CTA móvil `rounded-full`.
- Español colombiano, fechas `19/03/2026`, horas `10:05 a.m.`

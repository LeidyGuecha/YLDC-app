# Despliegue en producción — YLDC

**URL de producción:** https://yldc-app.vercel.app

| Dato | Valor |
|---|---|
| Plataforma | Vercel · plan Hobby |
| Equipo (team) | `YLDC-Talleres` |
| Proyecto | `yldc-app` |
| Repositorio | `LeidyGuecha/YLDC-app` (rama `main`) |
| Directorio raíz | La raíz del repo (sin *Root Directory* personalizado) |
| Framework | Next.js (detectado automáticamente) |
| Build | `npm run build` · ~40 s |
| Base de datos | Supabase `nfmphbdberpvsmeqsxit.supabase.co` |

## Variables de entorno (Vercel → Settings → Environment Variables)

| Variable | Origen |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → **publishable** key |

Se cargaron con la opción **Importar .env** usando el `.env.local` de la app.
El archivo `.env.local` **no** se versiona (está en `.gitignore`).

> ⚠️ La app desplegada debe apuntar al proyecto Supabase central
> (`nfmphbdberpvsmeqsxit`). Si se cambia a otro proyecto, los paneles mostrarán
> otra base de datos. Esto fue justo lo que ocurrió con el piloto del 18-nov:
> el servidor local de una compañera apuntaba al proyecto
> `nulklbvhsmtwqwvvtksb`, por eso sus datos no aparecían en producción.
> El piloto ya fue migrado al proyecto central (sesión PIN **334609**).

## Cómo se publica

- Cada **push a `main`** genera un despliegue automático a producción.
- Las **ramas y pull requests** generan *previews* con su propia URL.
- Para revertir: Vercel → Deployments → elegir un despliegue anterior →
  **Promote to Production**.
- Para volver a desplegar sin cambiar código: Deployments → ⋯ → **Redeploy**.

## Verificación mínima después de cada despliegue

1. Abrir la URL de producción y confirmar que cargan los 4 accesos por rol.
2. Iniciar sesión como facilitadora, psicóloga y admin (cuentas demo del equipo).
3. Confirmar que se ven cursos y estudiantes reales (no datos de demostración).
4. Entrar a una ruta profunda y recargar (F5): `/facilitador/panel`,
   `/psicologa/panel`, `/admin/panel`, `/estudiante/test` sin 404.
5. Revisar la consola del navegador: sin errores rojos.

## Notas

- **Plan Hobby:** suficiente para el piloto, pero el uso institucional sostenido
  requiere plan **Pro** (límites de uso comercial y soporte).
- Los datos viven en **Supabase**, no en Vercel: desplegar o re-desplegar nunca
  borra estudiantes, respuestas ni resultados.
- El límite por defecto de Supabase es de **1.000 filas por consulta**; las
  consultas que puedan superarlo deben paginar (ver `listarProgresoTest` en
  `src/lib/facilitador/api.ts`).

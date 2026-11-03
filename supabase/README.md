# Supabase — puesta a punto (SQL Editor, sin CLI)

Pegar en este orden en **Supabase → Project → SQL Editor → New query → Run**.

## 1. Esquema

1. Abrir `schema.sql`, copiar TODO el contenido y ejecutarlo.
2. Resultado esperado: "Success. No rows returned" y 4 pestañas de notice por la
   publicación realtime (`duplicate_object` ignorado silenciosamente si ya existía).

## 2. Seed

1. Abrir `seed.sql`, copiar TODO y ejecutarlo.
2. Crea: colegio piloto, 2 cursos, 16 estudiantes, 2 facilitadores, 2 psicólogas,
   2 admins, 3 talleres, preguntas de actividad, 3 sesiones (1 abierta con PIN
   `841279`), comentarios de ejemplo, 3 filas de audit_log y las **300 preguntas
   del test de Holland** (borrador balanceado — ver warning en el encabezado).
3. Verificación rápida:
   ```sql
   select estado, fase_actual, pin_acceso from sesiones order by estado;
   select seccion, count(*) from preguntas_test_holland group by seccion order by seccion;
   -- esperado: aptitudes 60 · intereses_actividades 90 · intereses_ocupaciones 90 · personalidad 60
   ```

## 3. Enunciados oficiales del test (Excel de Liliana)

1. Ejecutar `seed_holland_excel.sql` — reemplaza los 300 enunciados del
 borrador por los **textos verbatim del Excel oficial**
 (*CUESTIONARIO TIPOLOGÍA HOLLAND.xlsx*), por id.
 No toca secciones, tipologías, órdenes ni escalas; es idempotente.
2. El archivo se regenera con
 `node supabase/tools/generar-seed-holland-excel.mjs`
 (documentado en la cabecera del script — requiere el xlsx descomprimido
 en `%TEMP%/hollandxlsx`).
3. ⚠️ La pregunta 234 apunta a Liliana: "Mi habilidad en francés es:"
 (probable residuo de la versión francesa del instrumento). Se conserva
 verbatim hasta confirmación de ella.

## 4. Crear los usuarios de Supabase Auth

El estudiante NO tiene cuenta (entra por PIN). Los demás roles sí:

| Correo | Rol |
|---|---|
| `maria.torres@yldc.app` | Facilitadora (lead) |
| `daniela.restrepo@yldc.app` | Facilitadora (co) |
| `diana.rios@yldc.app` | Psicóloga |
| `sara.marquez@yldc.app` | Psicóloga (segunda cuenta demo) |
| `admin1@yldc.app` | Admin |
| `admin2@yldc.app` | Admin |

Son correos PROVISIONALES de demo (nadie está usando ese buzón): con
**Auto Confirm User ON, Supabase no envía correo alguno** — la cuenta nace
ya verificada y el buzón ni siquiera necesita existir. El email funciona
solo como identificador de login, junto a la contraseña que tú definas.

Cuando sepas los correos reales del equipo: se cambian en Auth (Update
user → email) y aquí en las tablas (`update facilitadores set correo =
'...' where id = ...`) — o avísale al desarrollador para regenerar el
seed completo. Para producción se reemplazan por los reales sí o sí.

### Cómo crearlos (interfaz de Supabase, sin SQL)

1. Menú izquierdo → **Authentication** (icono de llave) → pestaña **Users**.
2. Botón arriba a la derecha **Add user** → opción **Create new user**.
3. En la ventana que abre:
   - *Email*: escribir el correo de la tabla (ej. `maria.torres@yldc.app`).
   - *Password*: desmarca **Auto-generate password** (si viene marcada) y
    escribe tú mismo una contraseña que recuerdes (ej. `YldcDemo2026!`).
   - Deja **encendido** el interruptor **Auto Confirm User**.
4. Pincha **Create**. Al terminar verás 6 filas en la lista con la etiqueta
  verde **Confirmed**.
5. Si por descuido alguna aparece como *Waiting for confirmation* es porque
  quedó con Auto Confirm apagado: elimínala y créala de nuevo con el
  interruptor encendido.

## 5. Vincular las cuentas Auth con las tablas de rol

**¿Por qué existen este paso?** Las tablas `facilitadores`, `psicologas` y
`admins` aún no saben a qué cuenta de Auth pertenece cada fila. La app
(for RLS) identifica a cada usuario comparando su UUID de Auth con la
columna `auth_id`. Este paso copia esos UUID — y los empareja SOLO por el
correo, no hay que copiar nada a mano.

### Cómo ejecutarlo (SQL Editor)

1. Menú izquierdo → **SQL Editor** → botón **New query**.
2. Pega estas 3 líneas y pincha **Run**:

```sql
update facilitadores f set auth_id = u.id from auth.users u where u.email = f.correo;
update psicologas    p set auth_id = u.id from auth.users u where u.email = p.correo;
update admins        a set auth_id = u.id from auth.users u where u.email = a.correo;
```

3. Resultado esperado: **Success. No rows returned**.
4. Verificación (pega en otra New query y Run). Deben salir **6 filas,
  cada una con su UUID** en auth_id (nunca vacío):

```sql
select 'facilitador' rol, correo, auth_id from facilitadores
union all select 'psicologa', correo, auth_id from psicologas
union all select 'admin', correo, auth_id from admins;
```

5. Si alguna fila sale con `auth_id` vacío, el correo de la tabla difiere del
  de Auth (una letra de más/menos): corrige el `correo` de la tabla o el
  Email del usuario en Auth y vuelve a correr el update.

## 6. Variables para el frontend

**Settings → API**: copiar *Project URL* y *anon public key* a `yldc-app/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

(Ver `.env.example` — no compartir la service role key.)

## 7. Desactivar una cuenta sin eliminarla (activar/desactivar)

```sql
update facilitadores set activo = false where correo = 'daniela.restrepo@yldc.app';
update psicologas    set activa = false where correo = 'sara.marquez@yldc.app';
update admins        set activo = false where correo = 'admin2@yldc.app';
```

(El panel admin hará esto con botón Activar/Desactivar y lo registrará en `audit_log`.)

## Cómo protege los datos esta base (repaso rápido)

- Estudiante: escribe solo por RPC (`fn_unirse_sesion`, `fn_guardar_respuesta`,
  `fn_guardar_respuestas_test`, `fn_calcular_holland`, `fn_ver_resultado_propio`),
  que validan el **PIN** de sesión y que el estudiante pertenezca al curso de esa sesión.
- Facilitador: ve sesiones donde es **lead o co**; nunca elimina, solo cierra y comenta.
- Psicóloga: ve estudiantes/cursos **de su colegio** (o de todos si `colegio_id` es null);
  1 comentario individual por estudiante (UNIQUE).
- Admin: dueño de los catálogos y del `audit_log`. Máximo 3 cuentas.

-- ============================================================================
-- YLDC by Fondacio — SCHEMA COMPLETO
-- Base: brief §13 · Actualizado: reunión con Liliana (docs/contexto/post-reunion-liliana.md)
--
-- CÓMO USAR: pegar TODO este archivo en Supabase → SQL Editor → Run.
-- Es idempotente por bloques (puede re-ejecutarse sin duplicar objetos).
--
-- Modelo de acceso:
--   · Estudiante: SIN cuenta de Auth. Escribe SOLO vía RPC SECURITY DEFINER
--     que validan el PIN de sesión (fn_unirse_sesion, fn_guardar_respuesta,
--     fn_guardar_respuestas_test, fn_calcular_holland, fn_ver_resultado_propio).
--   · Facilitador/Psicóloga/Admin: Supabase Auth (email+password). Tras crear
--     cada usuario en el dashboard, copiar su UUID Auth en auth_id de su fila
--     (facilitadores/psicologas/admins) — paso 5 del README de supabase/.
--
-- algebra de puntajes del test: binario 0/1 (intereses) · escala_3 1/2/3
-- (aptitudes y personalidad). Máx por tipología: 15+15+10*3+10*3 = 90.
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- 1. HELPERS DE ROL (SECURITY DEFINER — sin recursión de RLS)
-- ============================================================================

create or replace function fn_rol_actual()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select case
    when exists (select 1 from admins a      where a.auth_id = auth.uid() and a.activo)  then 'admin'
    when exists (select 1 from psicologas p  where p.auth_id = auth.uid() and p.activa)  then 'psicologa'
    when exists (select 1 from facilitadores f where f.auth_id = auth.uid() and f.activo) then 'facilitador'
    else 'anon'
  end;
$$;

-- ¿auth.uid() es lead o co-facilitador de la sesión p_sesion?
create or replace function fn_facilitador_de_sesion(p_sesion uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from sesiones s
    where s.id = p_sesion
      and (
        s.facilitador_lead_id = auth.uid()
        or auth.uid() = any (s.co_facilitadores_ids)
      )
  );
$$;

-- ¿auth.uid() es psicóloga (activa) del colegio del curso p_curso?
-- (colegio_id null = sirve en todos los colegios, caso piloto)
create or replace function fn_psicologa_de_curso(p_curso uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from psicologas p
    where p.auth_id = auth.uid()
      and p.activa
      and (
        p.colegio_id is null
        or p.colegio_id = (select c.colegio_id from cursos c where c.id = p_curso)
      )
  );
$$;

-- ============================================================================
-- 2. TABLAS BASE (brief §13)
-- ============================================================================

create table if not exists colegios (
  id       uuid primary key default gen_random_uuid(),
  nombre   text not null,
  localidad text not null,
  activo   boolean not null default true
);

create table if not exists cursos (
  id        uuid primary key default gen_random_uuid(),
  colegio_id uuid not null references colegios(id),
  grado     int  not null check (grado in (9, 10, 11)),
  anio      int  not null,
  activo    boolean not null default true
);

create table if not exists estudiantes (
  id        uuid primary key default gen_random_uuid(),
  curso_id  uuid not null references cursos(id),
  nombre_completo text not null,
  ti        text,
  consentimiento_aceptado boolean not null default false,
  fecha_consentimiento    timestamptz,
  activo    boolean not null default true,
  -- "creado por el sistema" cuando el match falla en la identificación (brief §13)
  origen    text not null default 'excel' check (origen in ('excel', 'registro_directo')),
  creado_en timestamptz not null default now()
);

create table if not exists facilitadores (
  id        uuid primary key default gen_random_uuid(),
  nombre_completo text not null,
  correo    text not null unique,
  password_hash text,                -- legacy §13; la gestión real vive en Supabase Auth
  auth_id   uuid,                    -- ⇐ UUID del usuario Supabase Auth (paso 5 del README)
  activo    boolean not null default true
);

create table if not exists psicologas (
  id        uuid primary key default gen_random_uuid(),
  nombre_completo text not null,
  correo    text not null unique,
  password_hash text,
  auth_id   uuid,
  colegio_id uuid references colegios(id),  -- null = todos los colegios
  activa    boolean not null default true
);

create table if not exists admins (
  id        uuid primary key default gen_random_uuid(),
  nombre_completo text not null,
  correo    text not null unique,
  password_hash text,
  auth_id   uuid,
  activo    boolean not null default true
); -- máximo 3 cuentas (brief §13)

create table if not exists talleres (
  id        uuid primary key default gen_random_uuid(),
  codigo    text not null unique,          -- ej. YC-04
  titulo    text not null,
  grado     int  not null check (grado in (9, 10, 11)),
  numero_sesion int not null,
  objetivo  text not null,
  activo    boolean not null default true
);

create table if not exists preguntas_actividad (
  id        uuid primary key default gen_random_uuid(),
  taller_id uuid not null references talleres(id),
  orden     int  not null,
  enunciado text not null,
  tipo      text not null check (tipo in ('texto', 'seleccion', 'checklist', 'frase_a_completar')),
  configuracion_json jsonb,
  activa    boolean not null default true
);

create table if not exists sesiones (
  id       uuid primary key default gen_random_uuid(),
  taller_id uuid not null references talleres(id),
  curso_id  uuid not null references cursos(id),
  facilitador_lead_id uuid not null references facilitadores(id),
  co_facilitadores_ids uuid[] not null default '{}',
  pin_acceso text not null unique check (pin_acceso ~ '^[0-9]{6}$'),
  estado    text not null default 'abierta'
            check (estado in ('abierta', 'cerrada_pendiente', 'completada')),
  fase_actual text not null default 'como_vengo'
            check (fase_actual in ('como_vengo', 'actividad', 'como_voy')),
  fecha_inicio timestamptz,
  fecha_cierre timestamptz,
  creado_en timestamptz not null default now()
);

-- Respuesta unificada de las 3 fases (brief §13). INSERT solo vía RPC con PIN.
create table if not exists respuestas (
  id        uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references estudiantes(id),
  sesion_id uuid not null references sesiones(id),
  tipo      text not null check (tipo in ('como_vengo', 'actividad', 'como_voy')),
  pregunta_id uuid references preguntas_actividad(id),
  contenido_texto text,
  contenido_seleccion_json text,
  contenido_checklist_json text,
  fecha_envio timestamptz not null default now()
);

-- autoguardado idempotente (1 fila por estudiante+sesión+fase+pregunta)
create unique index if not exists uq_respuesta_unica
  on respuestas (estudiante_id, sesion_id, tipo, coalesce(pregunta_id::text, '-'));

create table if not exists comentarios_grupales (
  id        uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones(id),
  facilitador_id uuid not null references facilitadores(id),
  comentario text not null,
  fecha     timestamptz not null default now()
);

create table if not exists comentarios_individuales_psicologa (
  id        uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references estudiantes(id) unique,
  psicologa_id  uuid not null references psicologas(id),
  comentario text not null,
  fecha     timestamptz not null default now(),
  editado_en timestamptz
);

-- ============================================================================
-- 3. TABLAS NUEVAS — TEST DE HOLLAND (reunión con Liliana)
-- ============================================================================

-- Catálogo de las 300 preguntas (seed estático → supabase/seed.sql)
create table if not exists preguntas_test_holland (
  id        integer primary key,  -- 1..300
  seccion   text not null check (seccion in
            ('intereses_actividades', 'intereses_ocupaciones', 'aptitudes', 'personalidad')),
  tipologia text not null check (tipologia in ('R', 'I', 'A', 'S', 'E', 'C')),
  orden     integer not null,     -- orden dentro de la sección y tipología
  enunciado text not null,
  tipo_respuesta text not null check (tipo_respuesta in ('binario', 'escala_3')),
  activa    boolean not null default true,
  creado_en timestamptz not null default now()
);

-- Respuestas del estudiante (autoguardado; escritura SOLO vía RPC con PIN)
create table if not exists respuestas_test_holland (
  id         uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references estudiantes(id),
  sesion_id  uuid not null references sesiones(id),
  pregunta_id integer not null references preguntas_test_holland(id),
  respuesta  integer not null check (respuesta between 0 and 3),
  fecha_envio timestamptz not null default now()
);

create unique index if not exists uq_respuesta_test
  on respuestas_test_holland (estudiante_id, pregunta_id);
create index if not exists idx_respuestas_test_sesion
  on respuestas_test_holland (sesion_id);

-- Resultado consolidado (1 por estudiante; regenerable al re-calcula)
create table if not exists resultados_test_holland (
  id            uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references estudiantes(id) unique,
  sesion_id     uuid not null references sesiones(id),
  codigo_holland  text not null,       -- ej. "EIA"
  tipologia_primaria  text not null check (tipologia_primaria  in ('R','I','A','S','E','C')),
  tipologia_secundaria text not null check (tipologia_secundaria in ('R','I','A','S','E','C')),
  tipologia_terciaria  text not null check (tipologia_terciaria  in ('R','I','A','S','E','C')),
  puntaje_r int not null,
  puntaje_i int not null,
  puntaje_a int not null,
  puntaje_s int not null,
  puntaje_e int not null,
  puntaje_c int not null,
  fecha_calculo timestamptz not null default now()
);

-- ============================================================================
-- 4. AUDIT LOG — pantalla 4.8 (admin 1 ve lo que hizo admin 2)
-- ============================================================================

create table if not exists audit_log (
  id      uuid primary key default gen_random_uuid(),
  admin_id uuid not null references admins(id),
  accion  text not null check (accion in
          ('crear', 'editar', 'desactivar', 'activar', 'cargar_excel',
           'asignar', 'desasignar', 'generar_reporte', 'generar_zip')),
  entidad text not null,
  entidad_id uuid,
  detalles jsonb,                      -- {antes: {...}, despues: {...}}
  fecha   timestamptz not null default now()
);

create index if not exists idx_audit_log_admin_id on audit_log (admin_id);
create index if not exists idx_audit_log_fecha    on audit_log (fecha desc);
create index if not exists idx_audit_log_entidad  on audit_log (entidad);

-- ============================================================================
-- 5. COMPATIBILIDAD con SQL previo (por si se corrió un schema parcial)
-- ============================================================================

alter table facilitadores add column if not exists activo  boolean not null default true;
alter table psicologas    add column if not exists activa  boolean not null default true;
alter table admins        add column if not exists activo  boolean not null default true;
alter table colegios      add column if not exists activo  boolean not null default true;
alter table cursos        add column if not exists activo  boolean not null default true;
alter table estudiantes   add column if not exists activo  boolean not null default true;

-- ============================================================================
-- 6. RPC DEL ESTUDIANTE (SECURITY DEFINER — validan el PIN internamente)
-- ============================================================================

-- Info pública de la sesión por PIN (pantalla 1.3 "Esperando…" y headers)
create or replace function fn_sesion_por_pin(p_pin text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare v json;
begin
  select json_build_object(
    'sesion_id', s.id,
    'estado', s.estado,
    'fase_actual', s.fase_actual,
    'taller', t.titulo,
    'numero_sesion', t.numero_sesion,
    'curso', c.grado || '°-' || right(c.id::text, 3)  -- simplificado; el curso real va en la respuesta de unirse
  )
  into v
  from sesiones s
  join talleres t on t.id = s.taller_id
  join cursos c   on c.id = s.curso_id
  where s.pin_acceso = p_pin;
  return v;
end;
$$;

-- Identificación (pantalla 1.2): match por nombre (+ TI para desambiguar)
create or replace function fn_unirse_sesion(p_pin text, p_nombre text, p_ti text default null, p_consentimiento boolean default false)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sesion sesiones%rowtype;
  v_match  estudiantes%rowtype;
  v_cantidad int;
  v_estudiante_id uuid;
  v_creado boolean := false;
begin
  select * into v_sesion from sesiones where pin_acceso = p_pin;
  if not found then
    raise exception 'PIN inválido';
  end if;
  if v_sesion.estado <> 'abierta' then
    raise exception 'La sesión no está abierta';
  end if;

  -- 1) match exacto nombre + TI (si TI viene) o solo nombre
  select * into v_match
    from estudiantes
    where curso_id = v_sesion.curso_id
      and activo
      and lower(btrim(nombre_completo)) = lower(btrim(p_nombre))
      and (p_ti is null or ti = btrim(p_ti))
    order by consentimiento_aceptado desc
    limit 1;

  if found then
    v_estudiante_id := v_match.id;
  else
    -- 2) sin TI: ¿cuántos candidatos por nombre?
    select count(*) into v_cantidad
      from estudiantes
      where curso_id = v_sesion.curso_id
        and activo
        and lower(btrim(nombre_completo)) = lower(btrim(p_nombre));

    if v_cantidad = 0 then
      insert into estudiantes (curso_id, nombre_completo, ti, origen)
      values (v_sesion.curso_id, btrim(p_nombre), nullif(btrim(p_ti), ''), 'registro_directo')
      returning id into v_estudiante_id;
      v_creado := true;
    elsif v_cantidad > 1 then
      -- desambiguar: pedir TI completo (el frontend vuelve a llamar con p_ti)
      raise exception 'NOMBRE_AMBIGUO';
    else
      -- 1 candidato por nombre y sin TI: asociar directo
      select e.id into v_estudiante_id
        from estudiantes e
        where e.curso_id = v_sesion.curso_id
          and e.activo
          and lower(btrim(e.nombre_completo)) = lower(btrim(p_nombre));
    end if;
  end if;

  -- consentimiento informado desde la pantalla de identificación (mockup 1.2)
  if p_consentimiento then
    update estudiantes
       set consentimiento_aceptado = true,
           fecha_consentimiento = now()
     where id = v_estudiante_id
       and not consentimiento_aceptado;
  end if;

  return json_build_object(
    'estudiante_id', v_estudiante_id,
    'sesion_id', v_sesion.id,
    'ya_registrado', not v_creado
  );
end;
$$;

-- Guardar 1 respuesta de las fases Cómo vengo/Actividad/Cómo voy (autoguardado)
create or replace function fn_guardar_respuesta(
  p_pin text,
  p_estudiante_id uuid,
  p_tipo text,
  p_pregunta_id uuid default null,
  p_texto text default null,
  p_seleccion jsonb default null,
  p_checklist jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_sesion uuid; v_curso uuid;
begin
  select s.id, s.curso_id into v_sesion, v_curso
    from sesiones s where s.pin_acceso = p_pin and s.estado = 'abierta';
  if not found then raise exception 'PIN inválido o sesión no abierta'; end if;

  if not exists (select 1 from estudiantes e
                  where e.id = p_estudiante_id and e.curso_id = v_curso and e.activo) then
    raise exception 'El estudiante no pertenece a esta sesión';
  end if;

  insert into respuestas (estudiante_id, sesion_id, tipo, pregunta_id,
                          contenido_texto, contenido_seleccion_json, contenido_checklist_json)
  values (p_estudiante_id, v_sesion, p_tipo, p_pregunta_id,
          p_texto,
          case when p_seleccion  is null then null else p_seleccion::text  end,
          case when p_checklist  is null then null else p_checklist::text end)
  on conflict (estudiante_id, sesion_id, tipo, coalesce(pregunta_id::text, '-'))
  do update set
    contenido_texto           = excluded.contenido_texto,
    contenido_seleccion_json  = excluded.contenido_seleccion_json,
    contenido_checklist_json  = excluded.contenido_checklist_json,
    fecha_envio               = now();
end;
$$;

-- El estudiante re-lee sus respuestas (pantallas 1.6b/1.8 revisión)
create or replace function fn_listar_mis_respuestas(p_pin text, p_estudiante_id uuid)
returns setof respuestas
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select r.* from respuestas r
    join sesiones s on s.id = r.sesion_id
    where s.pin_acceso = p_pin
      and r.estudiante_id = p_estudiante_id
      and r.sesion_id in (select id from sesiones where pin_acceso = p_pin);
end;
$$;

-- AUTOGUARDADO del test: lote [{pregunta_id, respuesta}] (pantalla del test)
create or replace function fn_guardar_respuestas_test(
  p_pin text,
  p_estudiante_id uuid,
  p_lote jsonb   -- [{"pregunta_id": 1, "respuesta": 1}, ...]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_sesion uuid; v_curso uuid;
        v_item jsonb;
begin
  select s.id, s.curso_id into v_sesion, v_curso
    from sesiones s where s.pin_acceso = p_pin and s.estado = 'abierta';
  if not found then raise exception 'PIN inválido o sesión no abierta'; end if;

  if not exists (select 1 from estudiantes e
                  where e.id = p_estudiante_id and e.curso_id = v_curso and e.activo) then
    raise exception 'El estudiante no pertenece a esta sesión';
  end if;

  for v_item in select * from jsonb_array_elements(p_lote) loop
    insert into respuestas_test_holland
      (estudiante_id, sesion_id, pregunta_id, respuesta)
    values
      (p_estudiante_id, v_sesion, (v_item->>'pregunta_id')::int, (v_item->>'respuesta')::int)
    on conflict (estudiante_id, pregunta_id)
    do update set respuesta = excluded.respuesta,
                  sesion_id = excluded.sesion_id,
                  fecha_envio = now();
  end loop;
end;
$$;

-- Calificación automática: código de 3 letras + puntajes (los llama el
-- frontend al terminar; equivalente al trigger que se descartó por simplicidad)
create or replace function fn_calcular_holland(p_pin text, p_estudiante_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sesion uuid; v_total int;
  v_r int; v_i int; v_a int; v_s int; v_e int; v_c int;
  v_ranked text; v_json json;
begin
  -- sesión asociada a las respuestas del estudiante
  select distinct r.sesion_id into v_sesion
    from respuestas_test_holland r where r.estudiante_id = p_estudiante_id
    limit 1;
  if v_sesion is null then
    raise exception 'El estudiante no tiene respuestas del test';
  end if;
  if not exists (select 1 from sesiones s where s.id = v_sesion and s.pin_acceso = p_pin) then
    raise exception 'PIN inválido';
  end if;

  select count(*) into v_total
    from respuestas_test_holland where estudiante_id = p_estudiante_id;
  if v_total < 300 then
    raise exception 'Faltan % preguntas por responder', 300 - v_total;
  end if;

  -- puntaje por tipología = suma de respuestas (binario 0/1 · escala 1/2/3)
  select
    coalesce(sum(case when q.tipologia = 'R' then r.respuesta end), 0),
    coalesce(sum(case when q.tipologia = 'I' then r.respuesta end), 0),
    coalesce(sum(case when q.tipologia = 'A' then r.respuesta end), 0),
    coalesce(sum(case when q.tipologia = 'S' then r.respuesta end), 0),
    coalesce(sum(case when q.tipologia = 'E' then r.respuesta end), 0),
    coalesce(sum(case when q.tipologia = 'C' then r.respuesta end), 0)
  into v_r, v_i, v_a, v_s, v_e, v_c
  from respuestas_test_holland r
  join preguntas_test_holland q on q.id = r.pregunta_id
  where r.estudiante_id = p_estudiante_id;

  -- ranking con desempate FIJO en orden RIASEC (docs/contexto)
  select string_agg(t.tip, '' order by t.punt desc, t.ord)
    into v_ranked
    from (values ('R', v_r, 1), ('I', v_i, 2), ('A', v_a, 3),
                 ('S', v_s, 4), ('E', v_e, 5), ('C', v_c, 6)
         ) as t(tip, punt, ord);

  insert into resultados_test_holland (
    estudiante_id, sesion_id, codigo_holland,
    tipologia_primaria, tipologia_secundaria, tipologia_terciaria,
    puntaje_r, puntaje_i, puntaje_a, puntaje_s, puntaje_e, puntaje_c
  ) values (
    p_estudiante_id, v_sesion, substring(v_ranked from 1 for 3),
    substring(v_ranked from 1 for 1), substring(v_ranked from 2 for 1), substring(v_ranked from 3 for 1),
    v_r, v_i, v_a, v_s, v_e, v_c
  )
  on conflict (estudiante_id) do update set
    sesion_id            = excluded.sesion_id,
    codigo_holland       = excluded.codigo_holland,
    tipologia_primaria   = excluded.tipologia_primaria,
    tipologia_secundaria = excluded.tipologia_secundaria,
    tipologia_terciaria  = excluded.tipologia_terciaria,
    puntaje_r = excluded.puntaje_r, puntaje_i = excluded.puntaje_i,
    puntaje_a = excluded.puntaje_a, puntaje_s = excluded.puntaje_s,
    puntaje_e = excluded.puntaje_e, puntaje_c = excluded.puntaje_c,
    fecha_calculo = now();

  select json_build_object(
    'codigo_holland', substring(v_ranked from 1 for 3),
    'tipologias', json_build_array(substring(v_ranked from 1 for 1),
                                   substring(v_ranked from 2 for 1),
                                   substring(v_ranked from 3 for 1)),
    'puntajes', json_build_object('R', v_r, 'I', v_i, 'A', v_a,
                                  'S', v_s, 'E', v_e, 'C', v_c),
    'ranked_completo', v_ranked
  ) into v_json;
  return v_json;
end;
$$;

-- El estudiante ve SU resultado (pantalla placeholder con código, sin descripciones)
create or replace function fn_ver_resultado_propio(p_pin text, p_estudiante_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare v json;
begin
  select json_build_object(
    'codigo_holland', r.codigo_holland,
    'tipologia_primaria', r.tipologia_primaria,
    'tipologia_secundaria', r.tipologia_secundaria,
    'tipologia_terciaria', r.tipologia_terciaria,
    'puntajes', json_build_object('R', r.puntaje_r, 'I', r.puntaje_i, 'A', r.puntaje_a,
                                  'S', r.puntaje_s, 'E', r.puntaje_e, 'C', r.puntaje_c)
  ) into v
  from resultados_test_holland r
  where r.estudiante_id = p_estudiante_id
    and exists (select 1 from sesiones s
                 where s.id = r.sesion_id and s.pin_acceso = p_pin);
  return v;
end;
$$;

-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================

alter table colegios                         enable row level security;
alter table cursos                           enable row level security;
alter table estudiantes                      enable row level security;
alter table facilitadores                    enable row level security;
alter table psicologas                       enable row level security;
alter table admins                           enable row level security;
alter table talleres                         enable row level security;
alter table preguntas_actividad              enable row level security;
alter table sesiones                         enable row level security;
alter table respuestas                       enable row level security;
alter table comentarios_grupales             enable row level security;
alter table comentarios_individuales_psicologa enable row level security;
alter table preguntas_test_holland           enable row level security;
alter table respuestas_test_holland          enable row level security;
alter table resultados_test_holland          enable row level security;
alter table audit_log                        enable row level security;

-- ── catálogos públicos (lectura para todos: el flujo por PIN los necesita)
drop policy if exists catalogo_lectura_publica on colegios;
create policy catalogo_lectura_publica on colegios
  for select to anon, authenticated using (true);

drop policy if exists catalogo_lectura_publica on cursos;
create policy catalogo_lectura_publica on cursos
  for select to anon, authenticated using (true);

drop policy if exists catalogo_lectura_publica on talleres;
create policy catalogo_lectura_publica on talleres
  for select to anon, authenticated using (true);

drop policy if exists catalogo_lectura_publica on preguntas_actividad;
create policy catalogo_lectura_publica on preguntas_actividad
  for select to anon, authenticated using (true);

drop policy if exists lectura_preguntas_test on preguntas_test_holland;
create policy lectura_preguntas_test on preguntas_test_holland
  for select to anon, authenticated using (true);

-- ── usuarios por rol: ver/editar con patrón activar-desactivar (sin eliminar)
-- facilitadores: psicólogas y admin gestionan (opción A del panel); sí mismo se lee
drop policy if exists facilitadores_admin_psico_lectura on facilitadores;
create policy facilitadores_admin_psico_lectura on facilitadores
  for select to authenticated
  using (
    fn_rol_actual() in ('admin', 'psicologa')
    or auth_id = auth.uid()
  );

drop policy if exists facilitadores_insert_admin on facilitadores;
create policy facilitadores_insert_admin on facilitadores
  for insert to authenticated
  with check (fn_rol_actual() = 'admin');

drop policy if exists facilitadores_admin_psico_update on facilitadores;
create policy facilitadores_admin_psico_update on facilitadores
  for update to authenticated
  using (fn_rol_actual() in ('admin', 'psicologa'))
  with check (fn_rol_actual() in ('admin', 'psicologa'));

-- psicólogas: admin las gestiona; psicóloga se lee a sí misma
drop policy if exists psicologas_admin_lectura on psicologas;
create policy psicologas_admin_lectura on psicologas
  for select to authenticated
  using (
    fn_rol_actual() in ('admin', 'psicologa')
    or auth_id = auth.uid()
  );

drop policy if exists psicologas_insert_admin on psicologas;
create policy psicologas_insert_admin on psicologas
  for insert to authenticated
  with check (fn_rol_actual() = 'admin');

drop policy if exists psicologas_admin_update on psicologas;
create policy psicologas_admin_update on psicologas
  for update to authenticated
  using (fn_rol_actual() = 'admin')
  with check (fn_rol_actual() = 'admin');

-- admins: solo admin (historial 4.8 / gestión de la otra cuenta)
drop policy if exists admins_admin_todo on admins;
create policy admins_admin_todo on admins
  for all to authenticated
  using (fn_rol_actual() = 'admin')
  with check (fn_rol_actual() = 'admin');

-- ── estudiantes
drop policy if exists estudiantes_rol_lectura on estudiantes;
create policy estudiantes_rol_lectura on estudiantes
  for select to authenticated
  using (
    fn_rol_actual() = 'admin'
    or fn_psicologa_de_curso(curso_id)
    or exists (
      select 1 from sesiones s
      where s.curso_id = estudiantes.curso_id
        and (s.facilitador_lead_id = auth.uid()
             or auth.uid() = any (s.co_facilitadores_ids))
    )
  );

drop policy if exists estudiantes_insert_admin on estudiantes;
create policy estudiantes_insert_admin on estudiantes
  for insert to authenticated
  with check (fn_rol_actual() = 'admin');   -- carga masiva por Excel + registro directo admin

drop policy if exists estudiantes_update_admin on estudiantes;
create policy estudiantes_update_admin on estudiantes
  for update to authenticated
  using (fn_rol_actual() = 'admin')
  with check (fn_rol_actual() = 'admin');

-- ── sesiones
drop policy if exists sesiones_lectura_roles on sesiones;
create policy sesiones_lectura_roles on sesiones
  for select to authenticated
  using (
    fn_facilitador_de_sesion(id)
    or fn_psicologa_de_curso(curso_id)
    or fn_rol_actual() = 'admin'
  );

drop policy if exists sesiones_crear_facilitador on sesiones;
create policy sesiones_crear_facilitador on sesiones
  for insert to authenticated
  with check (
    fn_rol_actual() = 'facilitador'
    and facilitador_lead_id = auth.uid()
  );

drop policy if exists sesiones_actualizar_participes on sesiones;
create policy sesiones_actualizar_participes on sesiones
  for update to authenticated
  using (
    fn_facilitador_de_sesion(id) or fn_rol_actual() = 'admin'
  )
  with check (
    fn_facilitador_de_sesion(id) or fn_rol_actual() = 'admin'
  );

-- ── respuestas (fases): lectura roles; escritura SOLO por RPC con PIN
drop policy if exists respuestas_lectura_roles on respuestas;
create policy respuestas_lectura_roles on respuestas
  for select to authenticated
  using (
    fn_facilitador_de_sesion(sesion_id)
    or fn_psicologa_de_curso((select curso_id from sesiones s where s.id = sesion_id))
    or fn_rol_actual() = 'admin'
  );

-- (sin policy INSERT/UPDATE en anon ni authenticated: cerrado; RPC SECURITY DEFINER escribe)

-- ── comentarios grupales
drop policy if exists comentarios_grupales_lectura on comentarios_grupales;
create policy comentarios_grupales_lectura on comentarios_grupales
  for select to authenticated
  using (
    fn_facilitador_de_sesion(sesion_id)
    or fn_psicologa_de_curso((select curso_id from sesiones s where s.id = sesion_id))
    or fn_rol_actual() = 'admin'
  );

drop policy if exists comentarios_grupales_facilitador on comentarios_grupales;
create policy comentarios_grupales_facilitador on comentarios_grupales
  for insert to authenticated
  with check (
    facilitador_id = auth.uid()
    and fn_facilitador_de_sesion(sesion_id)
  );

drop policy if exists comentarios_grupales_edita_autor on comentarios_grupales;
create policy comentarios_grupales_edita_autor on comentarios_grupales
  for update to authenticated
  using (facilitador_id = auth.uid())
  with check (facilitador_id = auth.uid());

-- ── comentarios individuales de psicóloga
drop policy if exists comentarios_psicologa_lectura on comentarios_individuales_psicologa;
create policy comentarios_psicologa_lectura on comentarios_individuales_psicologa
  for select to authenticated
  using (
    psicologa_id = auth.uid()
    or fn_rol_actual() = 'admin'
    or (fn_rol_actual() = 'psicologa' and fn_psicologa_de_curso(
          (select e.curso_id from estudiantes e where e.id = estudiante_id)))
  );

drop policy if exists comentarios_psicologa_edita on comentarios_individuales_psicologa;
create policy comentarios_psicologa_edita on comentarios_individuales_psicologa
  for all to authenticated
  using (
    psicologa_id = auth.uid()
    or fn_rol_actual() = 'admin'
  )
  with check (
    psicologa_id = auth.uid()
    or fn_rol_actual() = 'admin'
  );

-- ── test de Holland: escritura cerrada (RPC); lectura por roles
drop policy if exists respuestas_test_lectura_roles on respuestas_test_holland;
create policy respuestas_test_lectura_roles on respuestas_test_holland
  for select to authenticated
  using (
    fn_facilitador_de_sesion(sesion_id)
    or fn_psicologa_de_curso((select curso_id from sesiones s where s.id = sesion_id))
    or fn_rol_actual() = 'admin'
  );

drop policy if exists resultados_test_lectura_roles on resultados_test_holland;
create policy resultados_test_lectura_roles on resultados_test_holland
  for select to authenticated
  using (
    fn_facilitador_de_sesion(sesion_id)
    or fn_psicologa_de_curso((select curso_id from sesiones s where s.id = sesion_id))
    or fn_rol_actual() = 'admin'
  );

-- (el propio resultado del estudiante va por fn_ver_resultado_propio)

-- ── audit_log: solo admin (pantalla 4.8)
drop policy if exists audit_log_solo_admin on audit_log;
create policy audit_log_solo_admin on audit_log
  for select to authenticated
  using (fn_rol_actual() = 'admin');

drop policy if exists audit_log_insert_admin on audit_log;
create policy audit_log_insert_admin on audit_log
  for insert to authenticated
  with check (fn_rol_actual() = 'admin');

-- ============================================================================
-- 8. REALTIME (monitor del facilitador + test en vivo)
-- ============================================================================

do $$
begin
  alter publication supabase_realtime add table respuestas;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table respuestas_test_holland;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table sesiones;
exception when duplicate_object then null;
end $$;

-- ============================================================================
-- FIN DEL SCHEMA — ejecutar después supabase/seed.sql
-- ============================================================================

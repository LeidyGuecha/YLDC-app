-- ─────────────────────────────────────────────────────────────────────────────
-- Matching más tolerante al identificar a un estudiante (fn_unirse_sesion)
--
-- Problema: hoy el registro matchea por nombre EXACTO (minúsculas, sin
-- espacios a los costados) + TI EXACTO (tal cual). Si la misma persona
-- escribe su nombre con variantes ("pepito alejandro perez" vs
-- "Peppito Perez") o la cédula con puntos vs sin puntos, el sistema crea
-- OTRA fila y sus respuestas quedan partidas en dos identidades.
--
-- Con esta versión:
--  1) match por nombre normalizado (minúsculas, espacios dobles colapsados)
--     + TI normalizado (sin puntos, espacios ni guiones) si viene;
--  2) si trae TI y no matcheó por nombre: match por TI aunque el nombre
--     venga con variantes — misma cédula, misma persona;
--  3) si nadie matchea: crea la fila nueva con el TI normalizado;
--  el aviso NOMBRE_AMBIGUO (varias con el mismo nombre y sin TI) se mantiene.
--
-- Además normaliza los TI ya guardados en la tabla.
-- Correr UNA vez por proyecto. Es idempotente (re-crear la función no daña).
-- ─────────────────────────────────────────────────────────────────────────────

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
  -- nombre limpio: sin espacios a los costados y con espacios dobles colapsados
  v_nombre text := regexp_replace(btrim(p_nombre), '\s+', ' ', 'g');
  -- TI limpio: solo letras y números ("1.015.997.845" = "1015997845")
  v_ti text := nullif(regexp_replace(coalesce(p_ti, ''), '[^0-9A-Za-z]', '', 'g'), '');
begin
  select * into v_sesion from sesiones where pin_acceso = p_pin;
  if not found then
    raise exception 'PIN inválido';
  end if;
  if v_sesion.estado <> 'abierta' then
    raise exception 'La sesión no está abierta';
  end if;

  -- 1) match por nombre normalizado (+ TI normalizado si viene)
  select * into v_match
    from estudiantes
    where curso_id = v_sesion.curso_id
      and activo
      and lower(regexp_replace(btrim(nombre_completo), '\s+', ' ', 'g')) = lower(v_nombre)
      and (v_ti is null or regexp_replace(btrim(coalesce(ti, '')), '[^0-9A-Za-z]', '', 'g') = v_ti)
    order by consentimiento_aceptado desc
    limit 1;

  if found then
    v_estudiante_id := v_match.id;
  elsif v_ti is not null then
    -- 2) mismo TI, nombre con variantes: es la misma persona
    select * into v_match
      from estudiantes
      where curso_id = v_sesion.curso_id
        and activo
        and regexp_replace(btrim(coalesce(ti, '')), '[^0-9A-Za-z]', '', 'g') = v_ti
      order by consentimiento_aceptado desc
      limit 1;
    if found then
      v_estudiante_id := v_match.id;
    else
      -- 3) nadie con ese TI: crear la fila nueva (TI queda normalizado)
      insert into estudiantes (curso_id, nombre_completo, ti, origen)
      values (v_sesion.curso_id, v_nombre, v_ti, 'registro_directo')
      returning id into v_estudiante_id;
      v_creado := true;
    end if;
  else
    -- sin TI: ¿cuántos candidatos por nombre?
    select count(*) into v_cantidad
      from estudiantes
      where curso_id = v_sesion.curso_id
        and activo
        and lower(regexp_replace(btrim(nombre_completo), '\s+', ' ', 'g')) = lower(v_nombre);

    if v_cantidad = 0 then
      insert into estudiantes (curso_id, nombre_completo, ti, origen)
      values (v_sesion.curso_id, v_nombre, null, 'registro_directo')
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
          and lower(regexp_replace(btrim(e.nombre_completo), '\s+', ' ', 'g')) = lower(v_nombre);
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

-- Normaliza los TI ya guardados (quita puntos, espacios y guiones)
update estudiantes
  set ti = regexp_replace(btrim(ti), '[^0-9A-Za-z]', '', 'g')
  where ti is not null
    and ti <> regexp_replace(btrim(ti), '[^0-9A-Za-z]', '', 'g');

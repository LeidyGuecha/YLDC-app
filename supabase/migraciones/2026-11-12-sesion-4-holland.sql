-- ============================================================================
-- YLDC — Migración 2026-11-12: Sesión 4 "Tipología de Holland"
--   Flujo narrado por Leidy (tal cual la sesión real):
--     · ¿Cómo vengo hoy?  → clima con 5 opciones + porqué del clima (voluntaria)
--     · Actividad         → PRIMERO el test de Holland (en plataforma), luego
--                           4 preguntas de reflexión sobre la descripción del
--                           perfil; el cartel en grupo es presencial (fuera)
--     · ¿Cómo voy?        → 1 característica a potenciar + 1 a cambiar/mejorar
--
--   Qué toca en la BD:
--     1. Título y objetivo del taller YC-04 (del PDF "INFORMACIÓN TALLERES").
--     2. Pregunta 1: clima con la opción nueva "Parcialmente soleado".
--     3. Pregunta 2: reemplaza la reflexión de 200 caracteres por el porqué
--        del clima (voluntaria, sin mínimo).
--     4. Elimina checklist, frase a completar y el cierre viejo de la sesión 4
--        (y sus respuestas de prueba, para liberar la llave foránea).
--     5. Inserta las 6 preguntas nuevas (ids fijos 0008–000d que usa el front;
--        0006/0007 ya pertenecen al taller YC-01 de la sesión 1).
--     6. Alinea el clima de YC-01 con las mismas 5 opciones (la batería del
--        front es compartida durante el piloto).
--
--   Idempotente: se puede correr más de una vez sin duplicar filas.
--   Cómo: Supabase → SQL Editor → pegar todo → Run.
-- ============================================================================

begin;

-- 1) taller YC-04 — título y objetivo oficiales --------------------------------
update talleres
   set titulo   = 'Sesión 4 — Tipología de Holland',
       objetivo = 'Acompañar a los estudiantes en el reconocimiento de sus intereses, preferencias y características personales, a través de la Tipología de Holland, como una herramienta de apoyo para la orientación socio-ocupacional y la toma de decisiones sobre su futuro académico y laboral.'
 where codigo = 'YC-04';

-- 2) libera las respuestas de prueba de las preguntas que cambian o se van -----
delete from respuestas
 where pregunta_id in (
   '22222222-0000-0000-0000-000000000002', -- reflexión vieja de 200 caracteres
   '22222222-0000-0000-0000-000000000003', -- checklist viejo
   '22222222-0000-0000-0000-000000000004', -- frase a completar vieja
   '22222222-0000-0000-0000-000000000005'  -- cierre viejo "¿qué te llevaste?"
 );

-- 3) elimina del flujo las 3 preguntas que ya no van ---------------------------
delete from preguntas_actividad
 where id in (
   '22222222-0000-0000-0000-000000000003',
   '22222222-0000-0000-0000-000000000004',
   '22222222-0000-0000-0000-000000000005'
 );

-- 4) pregunta 1 — clima con las 5 opciones del PDF -----------------------------
update preguntas_actividad
   set enunciado         = '¿Cómo vienes hoy?',
       configuracion_json =
         '{"opciones":[{"id":"soleado","texto":"Soleado"},{"id":"parcial","texto":"Parcialmente soleado"},{"id":"nublado","texto":"Nublado"},{"id":"lluvioso","texto":"Lluvioso"},{"id":"tormenta","texto":"Tormenta"}]}'::jsonb
 where id = '22222222-0000-0000-0000-000000000001';

-- 5) pregunta 2 — el porqué del clima (voluntaria, sin mínimo) -----------------
update preguntas_actividad
   set enunciado         = '¿Por qué escogiste este clima?',
       tipo              = 'texto',
       configuracion_json = '{"opcional":true}'::jsonb
 where id = '22222222-0000-0000-0000-000000000002';

-- 6) preguntas nuevas de YC-04 (orden 3–8) -------------------------------------
insert into preguntas_actividad
  (id, taller_id, orden, enunciado, tipo, configuracion_json)
values
  ('22222222-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000004', 3,
   'Cuando lees la descripción del perfil de tu personalidad, ¿te reconoces en ella? ¿Por qué?',
   'texto', '{"min_caracteres":30}'),
  ('22222222-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000004', 4,
   '¿Con qué puntos de la descripción estás de acuerdo?',
   'texto', '{"min_caracteres":30}'),
  ('22222222-0000-0000-0000-00000000000a', '11111111-0000-0000-0000-000000000004', 5,
   '¿Con qué puntos no estás de acuerdo?',
   'texto', '{"min_caracteres":30}'),
  ('22222222-0000-0000-0000-00000000000b', '11111111-0000-0000-0000-000000000004', 6,
   '¿Coincide la descripción de tu perfil con la carrera que quieres estudiar? ¿Por qué?',
   'texto', '{"min_caracteres":30}'),
  ('22222222-0000-0000-0000-00000000000c', '11111111-0000-0000-0000-000000000004', 7,
   'Escribe una característica personal asociada a tu tipología que quieras potenciar.',
   'texto', '{"min_caracteres":30}'),
  ('22222222-0000-0000-0000-00000000000d', '11111111-0000-0000-0000-000000000004', 8,
   'Escribe una característica que quieras cambiar o mejorar para tu desarrollo personal y vocacional.',
   'texto', '{"min_caracteres":30}')
on conflict (id) do update
   set taller_id         = excluded.taller_id,
       orden             = excluded.orden,
       enunciado         = excluded.enunciado,
       tipo              = excluded.tipo,
       configuracion_json = excluded.configuracion_json,
       activa            = true;

-- 7) YC-01: mismo catálogo de climas (la batería del front es compartida) ------
update preguntas_actividad
   set configuracion_json =
         '{"opciones":[{"id":"soleado","texto":"Soleado"},{"id":"parcial","texto":"Parcialmente soleado"},{"id":"nublado","texto":"Nublado"},{"id":"lluvioso","texto":"Lluvioso"},{"id":"tormenta","texto":"Tormenta"}]}'::jsonb
 where id = '22222222-0000-0000-0000-000000000006';

commit;

-- Verificación rápida (opcional, corre aparte):
--   select orden, enunciado, tipo, configuracion_json
--     from preguntas_actividad
--    where taller_id = '11111111-0000-0000-0000-000000000004'
--    order by orden;
-- Debe devolver 8 filas (1 clima · 2 porqué · 3–6 actividad · 7–8 cierre).

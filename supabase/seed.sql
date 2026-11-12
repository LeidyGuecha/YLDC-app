-- ============================================================================
-- YLDC by Fondacio — SEED (correr DESPUÉS del schema.sql)
--   · Piloto: colegio, cursos, estudiantes, usuarios, talleres,
--     3 sesiones (abierta / cerrada_pendiente / completada), comentarios, audit
--   · Test de Holland: las 300 preguntas (intereses 90+90, aptitudes 60, personalidad 60)
--
-- Idempotente: las filas usan UUIDs fijos y ON CONFLICT DO NOTHING.
-- ⚠️ Las 300 preguntas son BORRADOR balanceado fiel a la estructura del Excel
--    RIASEC (docs/contexto/post-reunion-liliana.md). Cuando Liliana entregue el
--    Excel se reemplazan los ENUNCIADOS por id, sin tocar la estructura.
-- ============================================================================

-- ============================================================================
-- 1. INSTITUCIÓN
-- ============================================================================
insert into colegios (id, nombre, localidad) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'IED La Isabelita', 'Bogotá D.C. — San Cristóbal')
on conflict (id) do nothing;

insert into cursos (id, colegio_id, grado, anio) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 11, 2026),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 11, 2026)
on conflict (id) do nothing;

-- ============================================================================
-- 2. USUARIOS (auth_id se completa tras crearlos en Supabase Auth — paso 5 del README)
-- ============================================================================
insert into facilitadores (id, nombre_completo, correo) values
  ('ffffffff-0000-0000-0000-000000000001', 'María Fernanda Torres', 'maria.torres@yldc.app'),
  ('ffffffff-0000-0000-0000-000000000002', 'Daniela Restrepo',        'daniela.restrepo@yldc.app')
on conflict (id) do nothing;

insert into psicologas (id, nombre_completo, correo) values
  ('cccccccc-0000-0000-0000-000000000001', 'Diana Marcela Ríos', 'diana.rios@yldc.app'),
  ('cccccccc-0000-0000-0000-000000000002', 'Sara Lucía Márquez', 'sara.marquez@yldc.app')
on conflict (id) do nothing;

insert into admins (id, nombre_completo, correo) values
  ('dddddddd-0000-0000-0000-000000000001', 'Andrés Camilo León', 'admin1@yldc.app'),
  ('dddddddd-0000-0000-0000-000000000002', 'Paula Andrea Suárez', 'admin2@yldc.app')
on conflict (id) do nothing;

-- ============================================================================
-- 3. ESTUDIANTES (8 por curso, cargados por Excel según brief §13)
-- ============================================================================
insert into estudiantes (id, curso_id, nombre_completo, ti, consentimiento_aceptado, fecha_consentimiento) values
  ('eeeeeeee-0000-0000-0000-000000000011', 'bbbbbbbb-0000-0000-0000-000000000001', 'Laura Sofía Ramírez Peña',   '1.025.682.477', true, now()),
  ('eeeeeeee-0000-0000-0000-000000000012', 'bbbbbbbb-0000-0000-0000-000000000001', 'Juan David Ospina Vélez',    '1.025.683.914', true, now()),
  ('eeeeeeee-0000-0000-0000-000000000013', 'bbbbbbbb-0000-0000-0000-000000000001', 'Valentina Mejía Suaza',      '1.025.690.228', true, now()),
  ('eeeeeeee-0000-0000-0000-000000000014', 'bbbbbbbb-0000-0000-0000-000000000001', 'Sebastián Restrepo Quintero','1.025.691.003', true, now()),
  ('eeeeeeee-0000-0000-0000-000000000015', 'bbbbbbbb-0000-0000-0000-000000000001', 'Camila Andrea Guzmán Ríos',  '1.025.695.779', true, now()),
  ('eeeeeeee-0000-0000-0000-000000000016', 'bbbbbbbb-0000-0000-0000-000000000001', 'Daniel Felipe Cárdenas Ortiz','1.025.698.401', true, now()),
  ('eeeeeeee-0000-0000-0000-000000000017', 'bbbbbbbb-0000-0000-0000-000000000001', 'Juliana Pardo Bermúdez',     '1.025.701.856', true, now()),
  ('eeeeeeee-0000-0000-0000-000000000018', 'bbbbbbbb-0000-0000-0000-000000000001', 'Santiago Vélez Hoyos',       '1.025.704.232', true, now()),
  ('eeeeeeee-0000-0000-0000-000000000021', 'bbbbbbbb-0000-0000-0000-000000000002', 'Ana María Ochoa Ruiz',       '1.040.551.260', true, now()),
  ('eeeeeeee-0000-0000-0000-000000000022', 'bbbbbbbb-0000-0000-0000-000000000002', 'Kevin Julián Zapata Iniesta','1.040.553.114', true, now()),
  ('eeeeeeee-0000-0000-0000-000000000023', 'bbbbbbbb-0000-0000-0000-000000000002', 'Isabella Vargas Cruz',       '1.040.558.907', true, now()),
  ('eeeeeeee-0000-0000-0000-000000000024', 'bbbbbbbb-0000-0000-0000-000000000002', 'Nicolás Gaviria Torres',     '1.040.560.373', true, now()),
  ('eeeeeeee-0000-0000-0000-000000000025', 'bbbbbbbb-0000-0000-0000-000000000002', 'Laura Jimena Álvarez Ruiz',  '1.040.562.850', true, now()),
  ('eeeeeeee-0000-0000-0000-000000000026', 'bbbbbbbb-0000-0000-0000-000000000002', 'Mateo Arboleda Franco',      '1.040.566.119', true, now()),
  ('eeeeeeee-0000-0000-0000-000000000027', 'bbbbbbbb-0000-0000-0000-000000000002', 'Sara Bustamante Molina',     '1.040.570.486', true, now()),
  ('eeeeeeee-0000-0000-0000-000000000028', 'bbbbbbbb-0000-0000-0000-000000000002', 'Jerónimo Ortiz Baena',       '1.040.573.902', true, now())
on conflict (id) do nothing;

-- ============================================================================
-- 4. TALLERES (Proyecto de vida — grado 11, sesiones 1/4/5)
-- ============================================================================
insert into talleres (id, codigo, titulo, grado, numero_sesion, objetivo) values
  ('11111111-0000-0000-0000-000000000001', 'YC-01',
   'Sesión 1 — Descubriendo mi proyecto de vida', 11, 1,
   'Abrir el ciclo: los jóvenes identifican sueños, expectativas y punto de partida.'),
  ('11111111-0000-0000-0000-000000000004', 'YC-04',
   'Sesión 4 — Tipología de Holland', 11, 4,
   'Acompañar a los estudiantes en el reconocimiento de sus intereses, preferencias y características personales, a través de la Tipología de Holland, como una herramienta de apoyo para la orientación socio-ocupacional y la toma de decisiones sobre su futuro académico y laboral.'),
  ('11111111-0000-0000-0000-000000000005', 'YC-05',
   'Sesión 5 — ¿Cómo voy? Revisando mis avances', 11, 5,
   'Reconocer avances y tropiezos desde la actividad trabajada y redactar el estado de ruta.')
on conflict (id) do nothing;

-- ============================================================================
-- 5. PREGUNTAS DE ACTIVIDAD (sesión 4 = flujo narrado por Leidy; ids fijos
--    usados por el front. 0006/0007 son del taller YC-01; las nuevas de
--    YC-04 van de 0008 a 000d)
-- ============================================================================
insert into preguntas_actividad (id, taller_id, orden, enunciado, tipo, configuracion_json) values
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004', 1,
   '¿Cómo vienes hoy?', 'seleccion',
   '{"opciones":[{"id":"soleado","texto":"Soleado"},{"id":"parcial","texto":"Parcialmente soleado"},{"id":"nublado","texto":"Nublado"},{"id":"lluvioso","texto":"Lluvioso"},{"id":"tormenta","texto":"Tormenta"}]}'),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000004', 2,
   '¿Por qué escogiste este clima?', 'texto',
   '{"opcional":true}'),
  ('22222222-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000004', 3,
   'Cuando lees la descripción del perfil de tu personalidad, ¿te reconoces en ella? ¿Por qué?', 'texto',
   '{"min_caracteres":30}'),
  ('22222222-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000004', 4,
   '¿Con qué puntos de la descripción estás de acuerdo?', 'texto',
   '{"min_caracteres":30}'),
  ('22222222-0000-0000-0000-00000000000a', '11111111-0000-0000-0000-000000000004', 5,
   '¿Con qué puntos no estás de acuerdo?', 'texto',
   '{"min_caracteres":30}'),
  ('22222222-0000-0000-0000-00000000000b', '11111111-0000-0000-0000-000000000004', 6,
   '¿Coincide la descripción de tu perfil con la carrera que quieres estudiar? ¿Por qué?', 'texto',
   '{"min_caracteres":30}'),
  ('22222222-0000-0000-0000-00000000000c', '11111111-0000-0000-0000-000000000004', 7,
   'Escribe una característica personal asociada a tu tipología que quieras potenciar.', 'texto',
   '{"min_caracteres":30}'),
  ('22222222-0000-0000-0000-00000000000d', '11111111-0000-0000-0000-000000000004', 8,
   'Escribe una característica que quieras cambiar o mejorar para tu desarrollo personal y vocacional.', 'texto',
   '{"min_caracteres":30}'),
  ('22222222-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000001', 1,
   '¿Cómo vienes hoy?', 'seleccion',
   '{"opciones":[{"id":"soleado","texto":"Soleado"},{"id":"parcial","texto":"Parcialmente soleado"},{"id":"nublado","texto":"Nublado"},{"id":"lluvioso","texto":"Lluvioso"},{"id":"tormenta","texto":"Tormenta"}]}'),
  ('22222222-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000001', 2,
   'Describe un sueño que tengas para tu vida.', 'texto', '{"min_caracteres":200}')
on conflict (id) do nothing;

-- ============================================================================
-- 6. SESIONES PILOTO (los 3 estados definidos en el brief §13)
-- ============================================================================
insert into sesiones (id, taller_id, curso_id, facilitador_lead_id, co_facilitadores_ids, pin_acceso, estado, fase_actual) values
  -- 11°-A · Sesión 4 · abierta y en cómo_vengo (la sesión del flujo PIN 1.1–1.10)
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004',
   'bbbbbbbb-0000-0000-0000-000000000001', 'ffffffff-0000-0000-0000-000000000001',
   array['ffffffff-0000-0000-0000-000000000002'::uuid], '841279', 'abierta', 'como_vengo'),
  -- 11°-A · Sesión 1 · cerrada_pendiente (falta el comentario de Daniela)
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001',
   'bbbbbbbb-0000-0000-0000-000000000001', 'ffffffff-0000-0000-0000-000000000001',
   array['ffffffff-0000-0000-0000-000000000002'::uuid], '240517', 'cerrada_pendiente', 'como_voy'),
  -- 11°-B · Sesión 4 · completada (lead + co comentaron)
  ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000004',
   'bbbbbbbb-0000-0000-0000-000000000002', 'ffffffff-0000-0000-0000-000000000001',
   array['ffffffff-0000-0000-0000-000000000002'::uuid], '931126', 'completada', 'como_voy')
on conflict (id) do nothing;

update sesiones set fecha_inicio = now() - interval '1 day' where id = '33333333-0000-0000-0000-000000000002';
update sesiones set fecha_inicio = now() - interval '2 day', fecha_cierre = now() - interval '1 day'
  where id = '33333333-0000-0000-0000-000000000003';

-- ============================================================================
-- 7. RESPUESTAS DE EJEMPLO (sesión completada de 11°-B)
-- ============================================================================
insert into respuestas (id, estudiante_id, sesion_id, tipo, pregunta_id, contenido_seleccion_json) values
  ('44444444-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000021', '33333333-0000-0000-0000-000000000003',
   'como_vengo', '22222222-0000-0000-0000-000000000001', '{"seleccion":"lluvioso"}'),
  ('44444444-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000022', '33333333-0000-0000-0000-000000000003',
   'como_vengo', '22222222-0000-0000-0000-000000000001', '{"seleccion":"soleado"}'),
  ('44444444-0000-0000-0000-000000000003', 'eeeeeeee-0000-0000-0000-000000000023', '33333333-0000-0000-0000-000000000003',
   'como_vengo', '22222222-0000-0000-0000-000000000001', '{"seleccion":"tormenta"}')
on conflict (id) do nothing;

insert into respuestas (id, estudiante_id, sesion_id, tipo, pregunta_id, contenido_texto) values
  ('44444444-0000-0000-0000-000000000011', 'eeeeeeee-0000-0000-0000-000000000021', '33333333-0000-0000-0000-000000000003',
   'como_vengo', '22222222-0000-0000-0000-000000000002',
   'Vengo tranquila pero con muchas preguntas sobre lo que viene después del colegio. A veces siento que todos van con más claridad que yo, y me cuesta apurar ese cambio, pero sigo feliz.'),
  ('44444444-0000-0000-0000-000000000012', 'eeeeeeee-0000-0000-0000-000000000022', '33333333-0000-0000-0000-000000000003',
   'como_vengo', '22222222-0000-0000-0000-000000000002',
   'Vengo motivado porque este año quiero dejar huella en el once. Aunque en casa las cosas están tensas, el fútbol me despeja la cabeza y los amigos me acompañan. Quiero tener claro un plan.')
on conflict (id) do nothing;

-- ============================================================================
-- 8. COMENTARIOS (consistentes con el estado de cada sesión)
-- ============================================================================
-- cerrada_pendiente: comentó solo el lead (falta Daniela)
insert into comentarios_grupales (id, sesion_id, facilitador_id, comentario) values
  ('55555555-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000002', 'ffffffff-0000-0000-0000-000000000001',
   'El grupo arrancó con buen clima: varios soñaron en voz alta y los papeles quedaron en la muralla del aula. Falta el punto de vista de mi co-facilitadora para cerrar el panorama.')
on conflict (id) do nothing;

-- completada: comentaron lead y co
insert into comentarios_grupales (id, sesion_id, facilitador_id, comentario) values
  ('55555555-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000003', 'ffffffff-0000-0000-0000-000000000001',
   'Lluvia, sol y tormenta en la misma aula: el grupo está pasando por capítulos distintos del mismo año. La reflexión escrita mostró honestidad y varios ya nombraron sus miedos.'),
  ('55555555-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000003', 'ffffffff-0000-0000-0000-000000000002',
   'Como co-facilitadora acompañé a los que quedaron callados en la ronda. Recomiendo a la psicóloga mirar de cerca los dos climas de tormenta: hay historias de casa que conviene abrir en conversación individual.')
on conflict (id) do nothing;

-- comentario individual de la psicóloga (1 por estudiante, UNIQUE)
insert into comentarios_individuales_psicologa (id, estudiante_id, psicologa_id, comentario) values
  ('66666666-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000021', 'cccccccc-0000-0000-0000-000000000001',
   'Ana está procesando la transición del once con expectativa y algo de ansiedad por compararse. Recomendado: mandato suave de autocuidado y seguirla en la próxima sesión.')
on conflict (estudiante_id) do nothing;

-- ============================================================================
-- 9. AUDIT LOG (muestras para la 4.8)
-- ============================================================================
insert into audit_log (id, admin_id, accion, entidad, entidad_id, detalles) values
  ('dddddddd-0000-0000-0000-0000000000a1', 'dddddddd-0000-0000-0000-000000000001', 'crear', 'colegios',
   'aaaaaaaa-0000-0000-0000-000000000001', '{"despues":{"nombre":"IED La Isabelita","localidad":"Bogotá D.C. — San Cristóbal"}}'),
  ('dddddddd-0000-0000-0000-0000000000a2', 'dddddddd-0000-0000-0000-000000000001', 'cargar_excel', 'estudiantes',
   null, '{"despues":{"archivo":"11A_11B_2026.xlsx","creados":16,"coincidencias":16}}'),
  ('dddddddd-0000-0000-0000-0000000000a3', 'dddddddd-0000-0000-0000-000000000002', 'asignar', 'psicologas',
   'cccccccc-0000-0000-0000-000000000001', '{"despues":{"colegio_id":"aaaaaaaa-0000-0000-0000-000000000001"}}')
on conflict (id) do nothing;

-- ============================================================================
-- 10. TEST DE HOLLAND — 300 PREGUNTAS (borrador balanceado RIASEC)
--      ids 1..90   intereses_actividades (15 × R,I,A,S,E,C)            binario
--      ids 91..180 intereses_ocupaciones  (15 × R,I,A,S,E,C)            binario
--      ids 181..240 aptitudes           (10 × R,I,A,S,E,C)            escala_3
--      ids 241..300 personalidad        (10 × R,I,A,S,E,C)            escala_3
-- ============================================================================

insert into preguntas_test_holland (id, seccion, tipologia, orden, enunciado, tipo_respuesta) values
-- ─── intereses_actividades · R (1-15) ───
( 1, 'intereses_actividades', 'R',  1, 'Arreglar aparatos eléctricos o computadores de la casa.', 'binario'),
( 2, 'intereses_actividades', 'R',  2, 'Poner a punto la moto, la bici o el carro de la familia.', 'binario'),
( 3, 'intereses_actividades', 'R',  3, 'Construir cosas de madera: repisas, cajas o muebles.', 'binario'),
( 4, 'intereses_actividades', 'R',  4, 'Ayudar en obras de construcción o mejoras de la casa.', 'binario'),
( 5, 'intereses_actividades', 'R',  5, 'Operar máquinas o equipos en talleres o tiendas.', 'binario'),
( 6, 'intereses_actividades', 'R',  6, 'Cuidar plantas y hacer la jardinería del barrio.', 'binario'),
( 7, 'intereses_actividades', 'R',  7, 'Usar herramientas eléctricas o de carpintería.', 'binario'),
( 8, 'intereses_actividades', 'R',  8, 'Participar en actividades de campo o de granja.', 'binario'),
( 9, 'intereses_actividades', 'R',  9, 'Montar campamentos y planes al aire libre.', 'binario'),
(10, 'intereses_actividades', 'R', 10, 'Desarmar juguetes o equipos para saber cómo funcionan.', 'binario'),
(11, 'intereses_actividades', 'R', 11, 'Instalar cables, redes o equipos en la casa.', 'binario'),
(12, 'intereses_actividades', 'R', 12, 'Sembrar y mantener una huerta casera.', 'binario'),
(13, 'intereses_actividades', 'R', 13, 'Trabajar la tierra o ayudar en fincas de mi familia.', 'binario'),
(14, 'intereses_actividades', 'R', 14, 'Participar en brigadas para arreglar el barrio o el colegio.', 'binario'),
(15, 'intereses_actividades', 'R', 15, 'Jugar deportes de alto esfuerzo (fútbol, baloncesto, artes marciales).', 'binario'),
-- ─── intereses_actividades · I (16-30) ───
(16, 'intereses_actividades', 'I',  1, 'Hacer experimentos en un laboratorio.', 'binario'),
(17, 'intereses_actividades', 'I',  2, 'Leer revistas o libros de ciencia.', 'binario'),
(18, 'intereses_actividades', 'I',  3, 'Investigar a fondo cómo funcionan las cosas.', 'binario'),
(19, 'intereses_actividades', 'I',  4, 'Resolver acertijos, crucigramas o retos de lógica.', 'binario'),
(20, 'intereses_actividades', 'I',  5, 'Hacer cálculos para resolver problemas.', 'binario'),
(21, 'intereses_actividades', 'I',  6, 'Usar el computador para programar o investigar a fondo.', 'binario'),
(22, 'intereses_actividades', 'I',  7, 'Pertenecer a un club de ciencias.', 'binario'),
(23, 'intereses_actividades', 'I',  8, 'Indagar sobre el cuerpo humano y la salud.', 'binario'),
(24, 'intereses_actividades', 'I',  9, 'Analizar resultados o datos que yo mismo recojo.', 'binario'),
(25, 'intereses_actividades', 'I', 10, 'Estudiar la naturaleza y los animales.', 'binario'),
(26, 'intereses_actividades', 'I', 11, 'Manejar microscopios e instrumentos de medición.', 'binario'),
(27, 'intereses_actividades', 'I', 12, 'Seguir un proyecto de investigación durante meses.', 'binario'),
(28, 'intereses_actividades', 'I', 13, 'Buscar material especializado para un trabajo de clase.', 'binario'),
(29, 'intereses_actividades', 'I', 14, 'Seguir los nuevos descubrimientos de ciencia y tecnología.', 'binario'),
(30, 'intereses_actividades', 'I', 15, 'Organizar información suelta hasta que tenga sentido.', 'binario'),
-- ─── intereses_actividades · A (31-45) ───
(31, 'intereses_actividades', 'A',  1, 'Dibujar o pintar cuadros.', 'binario'),
(32, 'intereses_actividades', 'A',  2, 'Ir a conciertos, teatro o exposiciones.', 'binario'),
(33, 'intereses_actividades', 'A',  3, 'Hacer artesanías: bordar, tejer o decorar.', 'binario'),
(34, 'intereses_actividades', 'A',  4, 'Actuar en una obra de teatro o improvisar papeles.', 'binario'),
(35, 'intereses_actividades', 'A',  5, 'Pertenecer a un grupo de danza.', 'binario'),
(36, 'intereses_actividades', 'A',  6, 'Tocar un instrumento o cantar en un grupo.', 'binario'),
(37, 'intereses_actividades', 'A',  7, 'Escribir historias, poemas o letras de canciones.', 'binario'),
(38, 'intereses_actividades', 'A',  8, 'Diseñar afiches, logos o carteleras.', 'binario'),
(39, 'intereses_actividades', 'A',  9, 'Decorar espacios para fiestas o eventos.', 'binario'),
(40, 'intereses_actividades', 'A', 10, 'Participar en el montaje artístico del curso.', 'binario'),
(41, 'intereses_actividades', 'A', 11, 'Contar historias por escrito o en video.', 'binario'),
(42, 'intereses_actividades', 'A', 12, 'Tomar y editar fotografías con intención estética.', 'binario'),
(43, 'intereses_actividades', 'A', 13, 'Crear contenido para redes: memes, edición, tendencias.', 'binario'),
(44, 'intereses_actividades', 'A', 14, 'Diseñar vestuarios o accesorios.', 'binario'),
(45, 'intereses_actividades', 'A', 15, 'Grabar un podcast o un canal de video propio.', 'binario'),
-- ─── intereses_actividades · S (46-60) ───
(46, 'intereses_actividades', 'S',  1, 'Ayudar a mis compañeros con las materias que se les dificultan.', 'binario'),
(47, 'intereses_actividades', 'S',  2, 'Explicar a otros algo que yo sé hacer bien.', 'binario'),
(48, 'intereses_actividades', 'S',  3, 'Cuidar niños o adultos mayores.', 'binario'),
(49, 'intereses_actividades', 'S',  4, 'Participar en servicios comunitarios o de voluntariado.', 'binario'),
(50, 'intereses_actividades', 'S',  5, 'Ir a las competencias y alentar al equipo.', 'binario'),
(51, 'intereses_actividades', 'S',  6, 'Estar pendiente de cómo se sienten los amigos cercanos.', 'binario'),
(52, 'intereses_actividades', 'S',  7, 'Acompañar a personas con discapacidad o vulnerables.', 'binario'),
(53, 'intereses_actividades', 'S',  8, 'Hacer voluntariado en hogares o fundaciones.', 'binario'),
(54, 'intereses_actividades', 'S',  9, 'Organizar juegos para divertir a los niños pequeños.', 'binario'),
(55, 'intereses_actividades', 'S', 10, 'Animar a alguien que está pasando un mal rato.', 'binario'),
(56, 'intereses_actividades', 'S', 11, 'Colaborar en acciones de barrio o de curso (murales, cuidado de espacios).', 'binario'),
(57, 'intereses_actividades', 'S', 12, 'Mediar en una discusión hasta que lleguen a un acuerdo.', 'binario'),
(58, 'intereses_actividades', 'S', 13, 'Acompañar a alguien que enfrenta algo difícil por primera vez.', 'binario'),
(59, 'intereses_actividades', 'S', 14, 'Responder preguntas de otros con claridad y buena disposición.', 'binario'),
(60, 'intereses_actividades', 'S', 15, 'Ser monitor o parte de un grupo de apoyo del colegio.', 'binario'),
-- ─── intereses_actividades · E (61-75) ───
(61, 'intereses_actividades', 'E',  1, 'Encabezar un proyecto o un equipo.', 'binario'),
(62, 'intereses_actividades', 'E',  2, 'Participar en el gobierno estudiantil o representar al curso.', 'binario'),
(63, 'intereses_actividades', 'E',  3, 'Iniciar emprendimientos para generar ingresos.', 'binario'),
(64, 'intereses_actividades', 'E',  4, 'Montar campañas o publicidad para vender o promocionar.', 'binario'),
(65, 'intereses_actividades', 'E',  5, 'Pertenecer a un club de debate o de Modelos ONU.', 'binario'),
(66, 'intereses_actividades', 'E',  6, 'Convencer al grupo de apoyar la idea que yo propongo.', 'binario'),
(67, 'intereses_actividades', 'E',  7, 'Dirigir organizaciones o clubes.', 'binario'),
(68, 'intereses_actividades', 'E',  8, 'Organizar eventos, conferencias o encuentros del curso.', 'binario'),
(69, 'intereses_actividades', 'E',  9, 'Ir a reuniones para conocer gente nueva e influyente.', 'binario'),
(70, 'intereses_actividades', 'E', 10, 'Dirigir el programa radial o de TV escolar.', 'binario'),
(71, 'intereses_actividades', 'E', 11, 'Vender productos o difundir ideas frente al público.', 'binario'),
(72, 'intereses_actividades', 'E', 12, 'Participar en competencias deportivas con sed de ganar.', 'binario'),
(73, 'intereses_actividades', 'E', 13, 'Presentar proyectos frente a maestros o directivos.', 'binario'),
(74, 'intereses_actividades', 'E', 14, 'Liderar recaudaciones: rifas, bazares, ferias.', 'binario'),
(75, 'intereses_actividades', 'E', 15, 'Defender el presupuesto de un evento ante el colegio.', 'binario'),
-- ─── intereses_actividades · C (76-90) ───
(76, 'intereses_actividades', 'C',  1, 'Organizar papeles, tareas y notas clasificadas.', 'binario'),
(77, 'intereses_actividades', 'C',  2, 'Hacer cuentas detalladas de mis gastos o de un grupo.', 'binario'),
(78, 'intereses_actividades', 'C',  3, 'Llevar registro de entradas y salidas de dinero.', 'binario'),
(79, 'intereses_actividades', 'C',  4, 'Colaborar en diligencias de oficina (listas, papelería).', 'binario'),
(80, 'intereses_actividades', 'C',  5, 'Llenar tablas y planillas en el computador.', 'binario'),
(81, 'intereses_actividades', 'C',  6, 'Hacer listas de pendientes y tachar lo cumplido.', 'binario'),
(82, 'intereses_actividades', 'C',  7, 'Transcribir o digitar rápido la información.', 'binario'),
(83, 'intereses_actividades', 'C',  8, 'Archivar documentos para encontrarlos rápido.', 'binario'),
(84, 'intereses_actividades', 'C',  9, 'Revisar los trabajos del grupo para cazar errores.', 'binario'),
(85, 'intereses_actividades', 'C', 10, 'Ordenar objetos o espacios por categorías.', 'binario'),
(86, 'intereses_actividades', 'C', 11, 'Manejar la caja de un grupo: recoger y registrar el dinero.', 'binario'),
(87, 'intereses_actividades', 'C', 12, 'Seguir instrucciones detalladas paso a paso.', 'binario'),
(88, 'intereses_actividades', 'C', 13, 'Elaborar horarios y calendarios de actividades.', 'binario'),
(89, 'intereses_actividades', 'C', 14, 'Revisar recibos o cuentas para encontrar equivocaciones.', 'binario'),
(90, 'intereses_actividades', 'C', 15, 'Organizar la biblioteca o el estante de materiales del curso.', 'binario'),
-- ─── intereses_ocupaciones · R (91-105) ───
( 91, 'intereses_ocupaciones', 'R',  1, 'Mecánico de carros o motos.', 'binario'),
( 92, 'intereses_ocupaciones', 'R',  2, 'Electricista de construcción o mantenimiento.', 'binario'),
( 93, 'intereses_ocupaciones', 'R',  3, 'Carpintero o ebanista.', 'binario'),
( 94, 'intereses_ocupaciones', 'R',  4, 'Trabajador agrícola o ganadero.', 'binario'),
( 95, 'intereses_ocupaciones', 'R',  5, 'Soldador o artesano en metal.', 'binario'),
( 96, 'intereses_ocupaciones', 'R',  6, 'Operador de maquinaria pesada.', 'binario'),
( 97, 'intereses_ocupaciones', 'R',  7, 'Bombero o rescatista.', 'binario'),
( 98, 'intereses_ocupaciones', 'R',  8, 'Operario de planta de producción o empaque.', 'binario'),
( 99, 'intereses_ocupaciones', 'R',  9, 'Jardinero o paisajista.', 'binario'),
(100, 'intereses_ocupaciones', 'R', 10, 'Entrenador deportivo o preparador físico.', 'binario'),
(101, 'intereses_ocupaciones', 'R', 11, 'Cocinero en un restaurante o de comida callejera.', 'binario'),
(102, 'intereses_ocupaciones', 'R', 12, 'Militar o conductor de vehículos de emergencia.', 'binario'),
(103, 'intereses_ocupaciones', 'R', 13, 'Instalador de tuberías o redes hidráulicas.', 'binario'),
(104, 'intereses_ocupaciones', 'R', 14, 'Técnico en refrigeración o electrodomésticos.', 'binario'),
(105, 'intereses_ocupaciones', 'R', 15, 'Conductor de busetas o camiones.', 'binario'),
-- ─── intereses_ocupaciones · I (106-120) ───
(106, 'intereses_ocupaciones', 'I',  1, 'Científico de laboratorio.', 'binario'),
(107, 'intereses_ocupaciones', 'I',  2, 'Médico o cirujano.', 'binario'),
(108, 'intereses_ocupaciones', 'I',  3, 'Ingeniero civil o mecánico.', 'binario'),
(109, 'intereses_ocupaciones', 'I',  4, 'Ingeniero de sistemas o programador.', 'binario'),
(110, 'intereses_ocupaciones', 'I',  5, 'Físico o matemático.', 'binario'),
(111, 'intereses_ocupaciones', 'I',  6, 'Biólogo que investiga plantas o animales.', 'binario'),
(112, 'intereses_ocupaciones', 'I',  7, 'Analista de inteligencia o investigador privado.', 'binario'),
(113, 'intereses_ocupaciones', 'I',  8, 'Químico o farmacéutico.', 'binario'),
(114, 'intereses_ocupaciones', 'I',  9, 'Consultor en tecnología o en datos.', 'binario'),
(115, 'intereses_ocupaciones', 'I', 10, 'Veterinario.', 'binario'),
(116, 'intereses_ocupaciones', 'I', 11, 'Odontólogo.', 'binario'),
(117, 'intereses_ocupaciones', 'I', 12, 'Investigador en salud mental.', 'binario'),
(118, 'intereses_ocupaciones', 'I', 13, 'Geólogo o estudioso de la tierra.', 'binario'),
(119, 'intereses_ocupaciones', 'I', 14, 'Meteorólogo o astrónomo.', 'binario'),
(120, 'intereses_ocupaciones', 'I', 15, 'Estadístico o científico de datos.', 'binario'),
-- ─── intereses_ocupaciones · A (121-135) ───
(121, 'intereses_ocupaciones', 'A',  1, 'Diseñador gráfico o ilustrador.', 'binario'),
(122, 'intereses_ocupaciones', 'A',  2, 'Arquitecto.', 'binario'),
(123, 'intereses_ocupaciones', 'A',  3, 'Músico profesional o cantautor.', 'binario'),
(124, 'intereses_ocupaciones', 'A',  4, 'Actor o actriz.', 'binario'),
(125, 'intereses_ocupaciones', 'A',  5, 'Escritor o periodista cultural.', 'binario'),
(126, 'intereses_ocupaciones', 'A',  6, 'Fotógrafo profesional.', 'binario'),
(127, 'intereses_ocupaciones', 'A',  7, 'Bailarín o coreógrafo.', 'binario'),
(128, 'intereses_ocupaciones', 'A',  8, 'Diseñador de modas.', 'binario'),
(129, 'intereses_ocupaciones', 'A',  9, 'Decorador de interiores o escenógrafo.', 'binario'),
(130, 'intereses_ocupaciones', 'A', 10, 'Editor de cine o documentales.', 'binario'),
(131, 'intereses_ocupaciones', 'A', 11, 'Cantante de banda o solista.', 'binario'),
(132, 'intereses_ocupaciones', 'A', 12, 'Director de cine o de teatro.', 'binario'),
(133, 'intereses_ocupaciones', 'A', 13, 'Locutor de radio o voz en off.', 'binario'),
(134, 'intereses_ocupaciones', 'A', 14, 'Tatuador o artesano creativo.', 'binario'),
(135, 'intereses_ocupaciones', 'A', 15, 'Creador de contenidos digitales.', 'binario'),
-- ─── intereses_ocupaciones · S (136-150) ───
(136, 'intereses_ocupaciones', 'S',  1, 'Profesor de colegio.', 'binario'),
(137, 'intereses_ocupaciones', 'S',  2, 'Consejero u orientador juvenil.', 'binario'),
(138, 'intereses_ocupaciones', 'S',  3, 'Enfermero o auxiliar de enfermería.', 'binario'),
(139, 'intereses_ocupaciones', 'S',  4, 'Trabajador social.', 'binario'),
(140, 'intereses_ocupaciones', 'S',  5, 'Psicólogo educativo.', 'binario'),
(141, 'intereses_ocupaciones', 'S',  6, 'Nutricionista.', 'binario'),
(142, 'intereses_ocupaciones', 'S',  7, 'Coordinador de programas para jóvenes.', 'binario'),
(143, 'intereses_ocupaciones', 'S',  8, 'Paramédico o socorrista.', 'binario'),
(144, 'intereses_ocupaciones', 'S',  9, 'Voluntario de emergencias o cooperación.', 'binario'),
(145, 'intereses_ocupaciones', 'S', 10, 'Animador de fiestas infantiles.', 'binario'),
(146, 'intereses_ocupaciones', 'S', 11, 'Asistente de vuelo o atención al pasajero.', 'binario'),
(147, 'intereses_ocupaciones', 'S', 12, 'Monitor de campamentos o colonias.', 'binario'),
(148, 'intereses_ocupaciones', 'S', 13, 'Guía o mediador de museos.', 'binario'),
(149, 'intereses_ocupaciones', 'S', 14, 'Terapeuta ocupacional.', 'binario'),
(150, 'intereses_ocupaciones', 'S', 15, 'Instructor de primeros auxilios.', 'binario'),
-- ─── intereses_ocupaciones · E (151-165) ───
(151, 'intereses_ocupaciones', 'E',  1, 'Empresario o gerente.', 'binario'),
(152, 'intereses_ocupaciones', 'E',  2, 'Vendedor profesional.', 'binario'),
(153, 'intereses_ocupaciones', 'E',  3, 'Gerente de ventas o de mercadeo.', 'binario'),
(154, 'intereses_ocupaciones', 'E',  4, 'Abogado litigante.', 'binario'),
(155, 'intereses_ocupaciones', 'E',  5, 'Político o líder cívico.', 'binario'),
(156, 'intereses_ocupaciones', 'E',  6, 'Agente de bolsa o asesor de inversiones.', 'binario'),
(157, 'intereses_ocupaciones', 'E',  7, 'Publicista o creativo de campañas.', 'binario'),
(158, 'intereses_ocupaciones', 'E',  8, 'Agente inmobiliario.', 'binario'),
(159, 'intereses_ocupaciones', 'E',  9, 'Productor de eventos y conciertos.', 'binario'),
(160, 'intereses_ocupaciones', 'E', 10, 'Director comercial de una tienda.', 'binario'),
(161, 'intereses_ocupaciones', 'E', 11, 'Emprendedor digital.', 'binario'),
(162, 'intereses_ocupaciones', 'E', 12, 'Presentador de televisión.', 'binario'),
(163, 'intereses_ocupaciones', 'E', 13, 'Mánager de artistas o deportistas.', 'binario'),
(164, 'intereses_ocupaciones', 'E', 14, 'Gerente de restaurante.', 'binario'),
(165, 'intereses_ocupaciones', 'E', 15, 'Consultor de negocios.', 'binario'),
-- ─── intereses_ocupaciones · C (166-180) ───
(166, 'intereses_ocupaciones', 'C',  1, 'Contador público.', 'binario'),
(167, 'intereses_ocupaciones', 'C',  2, 'Auditor o revisor fiscal.', 'binario'),
(168, 'intereses_ocupaciones', 'C',  3, 'Secretario(a) ejecutivo(a).', 'binario'),
(169, 'intereses_ocupaciones', 'C',  4, 'Cajero de banco o de tienda.', 'binario'),
(170, 'intereses_ocupaciones', 'C',  5, 'Archivista o bibliotecario.', 'binario'),
(171, 'intereses_ocupaciones', 'C',  6, 'Tesorero de una empresa o un grupo.', 'binario'),
(172, 'intereses_ocupaciones', 'C',  7, 'Administrador de nómina.', 'binario'),
(173, 'intereses_ocupaciones', 'C',  8, 'Analista de inventarios.', 'binario'),
(174, 'intereses_ocupaciones', 'C',  9, 'Inspector o verificador de calidad.', 'binario'),
(175, 'intereses_ocupaciones', 'C', 10, 'Auxiliar de compras o de aduanas.', 'binario'),
(176, 'intereses_ocupaciones', 'C', 11, 'Auxiliar administrativo de aseguradora.', 'binario'),
(177, 'intereses_ocupaciones', 'C', 12, 'Digitador de datos.', 'binario'),
(178, 'intereses_ocupaciones', 'C', 13, 'Analista de créditos o de cobranzas.', 'binario'),
(179, 'intereses_ocupaciones', 'C', 14, 'Agente de reservas y agendas.', 'binario'),
(180, 'intereses_ocupaciones', 'C', 15, 'Encargado de compras de una empresa.', 'binario'),
-- ─── aptitudes · R (181-190) ───
(181, 'aptitudes', 'R',  1, 'Armar y desarmar equipos, juguetes o bicicletas.', 'escala_3'),
(182, 'aptitudes', 'R',  2, 'Usar herramientas manuales o eléctricas con destreza.', 'escala_3'),
(183, 'aptitudes', 'R',  3, 'Hacer esfuerzos físicos y aguantar el cansancio.', 'escala_3'),
(184, 'aptitudes', 'R',  4, 'Tener buena coordinación para el deporte.', 'escala_3'),
(185, 'aptitudes', 'R',  5, 'Reparar fallas comunes de la casa.', 'escala_3'),
(186, 'aptitudes', 'R',  6, 'Entender cómo funciona un aparato con solo verlo.', 'escala_3'),
(187, 'aptitudes', 'R',  7, 'Manejar con destreza la bici o otros vehículos.', 'escala_3'),
(188, 'aptitudes', 'R',  8, 'Medir y trazar con exactitud para construir.', 'escala_3'),
(189, 'aptitudes', 'R',  9, 'Cuidar plantas o animales con buenos resultados.', 'escala_3'),
(190, 'aptitudes', 'R', 10, 'Trabajar con las manos: soldar, pegar o ensamblar.', 'escala_3'),
-- ─── aptitudes · I (191-200) ───
(191, 'aptitudes', 'I',  1, 'Resolver problemas de matemáticas con rapidez.', 'escala_3'),
(192, 'aptitudes', 'I',  2, 'Entender explicaciones científicas a la primera.', 'escala_3'),
(193, 'aptitudes', 'I',  3, 'Encontrar errores en una información antes que otros.', 'escala_3'),
(194, 'aptitudes', 'I',  4, 'Memorizar datos, fechas o fórmulas sin esfuerzo.', 'escala_3'),
(195, 'aptitudes', 'I',  5, 'Analizar un problema y proponerle varias soluciones.', 'escala_3'),
(196, 'aptitudes', 'I',  6, 'Buscar información y separar lo importante de lo que no.', 'escala_3'),
(197, 'aptitudes', 'I',  7, 'Detectar patrones en números, textos o imágenes.', 'escala_3'),
(198, 'aptitudes', 'I',  8, 'Entender gráficas, tablas y porcentajes.', 'escala_3'),
(199, 'aptitudes', 'I',  9, 'Planear un experimento paso a paso.', 'escala_3'),
(200, 'aptitudes', 'I', 10, 'Explicar un tema complicado con palabras sencillas.', 'escala_3'),
-- ─── aptitudes · A (201-210) ───
(201, 'aptitudes', 'A',  1, 'Dibujar retratos, paisajes o cómics.', 'escala_3'),
(202, 'aptitudes', 'A',  2, 'Cantar afinado o tocar un instrumento.', 'escala_3'),
(203, 'aptitudes', 'A',  3, 'Escribir cuentos, poemas o letras de canciones.', 'escala_3'),
(204, 'aptitudes', 'A',  4, 'Bailar y aprender coreografías rápido.', 'escala_3'),
(205, 'aptitudes', 'A',  5, 'Combinar colores y estilos con buen ojo.', 'escala_3'),
(206, 'aptitudes', 'A',  6, 'Actuar o improvisar papeles sin pena.', 'escala_3'),
(207, 'aptitudes', 'A',  7, 'Inventar mundos, historias o juegos imaginarios.', 'escala_3'),
(208, 'aptitudes', 'A',  8, 'Editar fotos o videos con efectos llamativos.', 'escala_3'),
(209, 'aptitudes', 'A',  9, 'Hacer caras, voces y humor frente a la gente.', 'escala_3'),
(210, 'aptitudes', 'A', 10, 'Diseñar logos, carteles o publicaciones atractivas.', 'escala_3'),
-- ─── aptitudes · S (211-220) ───
(211, 'aptitudes', 'S',  1, 'Escuchar con atención lo que la gente cuenta.', 'escala_3'),
(212, 'aptitudes', 'S',  2, 'Entender lo que sienten los demás aunque no lo digan.', 'escala_3'),
(213, 'aptitudes', 'S',  3, 'Ayudar a solucionar peleas entre amigos.', 'escala_3'),
(214, 'aptitudes', 'S',  4, 'Tratar con niños con paciencia y buen toque.', 'escala_3'),
(215, 'aptitudes', 'S',  5, 'Cuidar a alguien enfermo o que lo necesita.', 'escala_3'),
(216, 'aptitudes', 'S',  6, 'Hacer sentir cómodos a los que están por primera vez.', 'escala_3'),
(217, 'aptitudes', 'S',  7, 'Explicar algo que sé y esperar a que sea entendido.', 'escala_3'),
(218, 'aptitudes', 'S',  8, 'Trabajar en equipo apoyando a todos sin pelear.', 'escala_3'),
(219, 'aptitudes', 'S',  9, 'Motivar a otros con palabras que animan de verdad.', 'escala_3'),
(220, 'aptitudes', 'S', 10, 'Organizar a un grupo en favor de alguien que lo necesita.', 'escala_3'),
-- ─── aptitudes · E (221-230) ───
(221, 'aptitudes', 'E',  1, 'Hablar frente al público sin ponerme nervioso.', 'escala_3'),
(222, 'aptitudes', 'E',  2, 'Convencer a la gente de apoyar mis ideas.', 'escala_3'),
(223, 'aptitudes', 'E',  3, 'Liderar equipos y repartir responsabilidades.', 'escala_3'),
(224, 'aptitudes', 'E',  4, 'Vender cosas o recaudar fondos con éxito.', 'escala_3'),
(225, 'aptitudes', 'E',  5, 'Tomar decisiones rápido cuando hay duda.', 'escala_3'),
(226, 'aptitudes', 'E',  6, 'Competir y quedar entre los primeros.', 'escala_3'),
(227, 'aptitudes', 'E',  7, 'Montar un evento de cero: plan, invitados y presupuesto.', 'escala_3'),
(228, 'aptitudes', 'E',  8, 'Negociar acuerdos con otras personas.', 'escala_3'),
(229, 'aptitudes', 'E',  9, 'Presentar proyectos con seguridad y en el momento justo.', 'escala_3'),
(230, 'aptitudes', 'E', 10, 'Asumir riesgos para alcanzar metas grandes.', 'escala_3'),
-- ─── aptitudes · C (231-240) ───
(231, 'aptitudes', 'C',  1, 'Organizar papeles o archivos en orden exacto.', 'escala_3'),
(232, 'aptitudes', 'C',  2, 'Hacer sumas y restas sin equivocarme.', 'escala_3'),
(233, 'aptitudes', 'C',  3, 'Seguir instrucciones escritas paso a paso con exactitud.', 'escala_3'),
(234, 'aptitudes', 'C',  4, 'Revisar mis trabajos varias veces hasta corregir los errores.', 'escala_3'),
(235, 'aptitudes', 'C',  5, 'Digitar rápido y sin errores.', 'escala_3'),
(236, 'aptitudes', 'C',  6, 'Mantener registros o agendas siempre al día.', 'escala_3'),
(237, 'aptitudes', 'C',  7, 'Cuidar detalles: fechas, números, nombres y horas.', 'escala_3'),
(238, 'aptitudes', 'C',  8, 'Manejar un presupuesto sin pasarme de él.', 'escala_3'),
(239, 'aptitudes', 'C',  9, 'Cumplir las tareas antes de la fecha límite.', 'escala_3'),
(240, 'aptitudes', 'C', 10, 'Clasificar y ordenar información de varias fuentes.', 'escala_3'),
-- ─── personalidad · R (241-250) ───
(241, 'personalidad', 'R',  1, 'Me considero una persona práctica y concreta.', 'escala_3'),
(242, 'personalidad', 'R',  2, 'Prefiero hacer antes que hablar mucho para explicar.', 'escala_3'),
(243, 'personalidad', 'R',  3, 'Disfruto más manejar cosas que discutir palabras.', 'escala_3'),
(244, 'personalidad', 'R',  4, 'Soy directo: digo las cosas como son.', 'escala_3'),
(245, 'personalidad', 'R',  5, 'Me gusta más trabajar afuera que en una oficina.', 'escala_3'),
(246, 'personalidad', 'R',  6, 'Prefiero planes concretos a ideas abstractas.', 'escala_3'),
(247, 'personalidad', 'R',  7, 'Tengo paciencia para tareas manuales largas y repetitivas.', 'escala_3'),
(248, 'personalidad', 'R',  8, 'No me importa ensuciarme las manos por un buen resultado.', 'escala_3'),
(249, 'personalidad', 'R',  9, 'Me siento cómodo con rutinas físicas y horarios estables.', 'escala_3'),
(250, 'personalidad', 'R', 10, 'Manejo la calma cuando algo se daña o se rompe.', 'escala_3'),
-- ─── personalidad · I (251-260) ───
(251, 'personalidad', 'I',  1, 'Me considero analítico y pregunto por todo.', 'escala_3'),
(252, 'personalidad', 'I',  2, 'Prefiero trabajar solo o en grupo pequeño que en grupos grandes.', 'escala_3'),
(253, 'personalidad', 'I',  3, 'Soy curioso: siempre quiero saber el porqué de las cosas.', 'escala_3'),
(254, 'personalidad', 'I',  4, 'Me atraen más las ideas que los hechos concretos.', 'escala_3'),
(255, 'personalidad', 'I',  5, 'Soy reservado a la hora de mostrar mis emociones.', 'escala_3'),
(256, 'personalidad', 'I',  6, 'Confío en mi capacidad para resolver cosas difíciles.', 'escala_3'),
(257, 'personalidad', 'I',  7, 'Antes que socializar en fiestas, prefiero leer o investigar.', 'escala_3'),
(258, 'personalidad', 'I',  8, 'Me incomoda hacer algo sin entender su lógica.', 'escala_3'),
(259, 'personalidad', 'I',  9, 'Soy independiente: no necesito que me aprueben para avanzar.', 'escala_3'),
(260, 'personalidad', 'I', 10, 'Prefiero tener datos antes de opinar.', 'escala_3'),
-- ─── personalidad · A (261-270) ───
(261, 'personalidad', 'A',  1, 'Me considero imaginativo y original.', 'escala_3'),
(262, 'personalidad', 'A',  2, 'Me expreso mejor con arte, música o letras.', 'escala_3'),
(263, 'personalidad', 'A',  3, 'Prefiero el desorden creativo antes que el orden rígido.', 'escala_3'),
(264, 'personalidad', 'A',  4, 'Soy espontáneo y evito las rutinas.', 'escala_3'),
(265, 'personalidad', 'A',  5, 'Siento las emociones intensamente y las plasmo en lo que hago.', 'escala_3'),
(266, 'personalidad', 'A',  6, 'Me aburren las tareas repetitivas.', 'escala_3'),
(267, 'personalidad', 'A',  7, 'Valoro las ideas nuevas más que la tradición.', 'escala_3'),
(268, 'personalidad', 'A',  8, 'Trabajo mejor sin reglas que encierran mi creación.', 'escala_3'),
(269, 'personalidad', 'A',  9, 'Distingo la belleza y los detalles en todo lo que me rodea.', 'escala_3'),
(270, 'personalidad', 'A', 10, 'Disfruto sorprender y hacer cosas distintas.', 'escala_3'),
-- ─── personalidad · S (271-280) ───
(271, 'personalidad', 'S',  1, 'Me considero sociable y de trato fácil.', 'escala_3'),
(272, 'personalidad', 'S',  2, 'Prefiero estar acompañado que solo.', 'escala_3'),
(273, 'personalidad', 'S',  3, 'Los demás me cuentan sus problemas con confianza.', 'escala_3'),
(274, 'personalidad', 'S',  4, 'Me importan las causas sociales y ayudar a otros.', 'escala_3'),
(275, 'personalidad', 'S',  5, 'Soy paciente con la gente aunque otros se desesperen.', 'escala_3'),
(276, 'personalidad', 'S',  6, 'Disfruto enseñando o explicando.', 'escala_3'),
(277, 'personalidad', 'S',  7, 'Evito los conflictos y busco armonía.', 'escala_3'),
(278, 'personalidad', 'S',  8, 'Me conmueven las historias de gente o animales necesitados.', 'escala_3'),
(279, 'personalidad', 'S',  9, 'Soy idealista: sueño con un mundo mejor.', 'escala_3'),
(280, 'personalidad', 'S', 10, 'Trabajo mejor sirviendo a alguien que compitiendo contra alguien.', 'escala_3'),
-- ─── personalidad · E (281-290) ───
(281, 'personalidad', 'E',  1, 'Me considero enérgico y entusiasta.', 'escala_3'),
(282, 'personalidad', 'E',  2, 'Me gusta liderar y que sigan mis planes.', 'escala_3'),
(283, 'personalidad', 'E',  3, 'Disfruto convencer a otros de mis ideas.', 'escala_3'),
(284, 'personalidad', 'E',  4, 'Soy competitivo y me gustan los desafíos.', 'escala_3'),
(285, 'personalidad', 'E',  5, 'Tomo la palabra sin miedo en cualquier grupo.', 'escala_3'),
(286, 'personalidad', 'E',  6, 'Me motivan las metas económicas o de prestigio.', 'escala_3'),
(287, 'personalidad', 'E',  7, 'Ante los fracasos me recupero rápido y vuelvo a intentar.', 'escala_3'),
(288, 'personalidad', 'E',  8, 'Se me hace pesado el trabajo tranquilo y sin acción.', 'escala_3'),
(289, 'personalidad', 'E',  9, 'Soy audaz: intento lo más nuevo sin esperar a los demás.', 'escala_3'),
(290, 'personalidad', 'E', 10, 'Me gusta reunir gente para lograr algo grande juntos.', 'escala_3'),
-- ─── personalidad · C (291-300) ───
(291, 'personalidad', 'C',  1, 'Me considero ordenado y organizado.', 'escala_3'),
(292, 'personalidad', 'C',  2, 'Termino lo que empiezo, aunque sea tedioso.', 'escala_3'),
(293, 'personalidad', 'C',  3, 'Sigo las reglas y los procedimientos establecidos.', 'escala_3'),
(294, 'personalidad', 'C',  4, 'Soy cuidadoso con los detalles y evito equivocaciones.', 'escala_3'),
(295, 'personalidad', 'C',  5, 'Me siento cómodo con estructuras: listas o plantillas.', 'escala_3'),
(296, 'personalidad', 'C',  6, 'Prefiero instrucciones claras antes de improvisar.', 'escala_3'),
(297, 'personalidad', 'C',  7, 'Tengo paciencia para trámites y papelería.', 'escala_3'),
(298, 'personalidad', 'C',  8, 'Cumplo mis compromisos sin que me lo recuerden.', 'escala_3'),
(299, 'personalidad', 'C',  9, 'Guardo bien la información confidencial.', 'escala_3'),
(300, 'personalidad', 'C', 10, 'Planifico todo y evito las sorpresas de última hora.', 'escala_3')
on conflict (id) do nothing;

-- ============================================================================
-- FIN DEL SEED
-- ============================================================================

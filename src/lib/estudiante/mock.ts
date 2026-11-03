import {
  ErrorEstudiante,
  type EstadoSesion,
  type FaseSesion,
  type FilaRespuesta,
  type InfoSesion,
  type PreguntaTest,
  type RespuestaTestGuardada,
  type ResultadoHolland,
  type Tipologia,
} from "./types";

/*
  MODO DEMO — mismo contrato que las RPC de Supabase, con datos
  en localStorage del navegador. Se activa automáticamente cuando
  .env.local todavía no tiene las credenciales (src/lib/supabase/config.ts).

  Los 3 PIN del seed replican los 3 estados del brief §13:
    841279 → abierta (en fase como_vengo)
    240517 → cerrada_pendiente
    931126 → completada
  Nombre especial para probar la desambiguación: "Valentina Mejía Suaza"
  (pide TI 1.025.690.228 como el seed).

  Cuando el usuario pegue schema.sql + seed.sql en Supabase, esto deja de
  usarse cero configuración — la API real entra por fn_*.
*/

const MOCK_VENTANA = "yldc:mock:";

interface SesionMock {
  estado: EstadoSesion;
  faseActual: FaseSesion;
  taller: string;
  numeroSesion: number;
}
interface MiembroMock {
  id: string;
  nombre: string;
  sesionId: string;
}
interface RespuestaMock extends FilaRespuesta {
  pregunta_id: string | null;
}

const SEED_SESIONES: Record<string, SesionMock> = {
  "841279": {
    estado: "abierta",
    faseActual: "como_vengo",
    taller: "Sesión 4 — ¿Cómo vengo? Mi punto de partida con los demás",
    numeroSesion: 4,
  },
  "240517": {
    estado: "cerrada_pendiente",
    faseActual: "como_voy",
    taller: "Sesión 1 — Descubriendo mi proyecto de vida",
    numeroSesion: 1,
  },
  "931126": {
    estado: "completada",
    faseActual: "como_voy",
    taller: "Sesión 4 — ¿Cómo vengo? Mi punto de partida con los demás",
    numeroSesion: 4,
  },
};

// Estudiantes del curso 11°-A del seed (match por nombre, como la RPC real).
const ESTUDIANTES_SEED: Array<{ comparar: string; ti: string | null }> = [
  { comparar: "laura sofía ramírez peña", ti: "1.025.682.477" },
  { comparar: "juana david ospina vélez", ti: "1.025.683.914" },
  { comparar: "valentina mejía suaza", ti: "1.025.690.228" }, // DUPLICADA a propósito: dispara NOMBRE_AMBIGUO
  { comparar: "sebastián restrepo quintero", ti: "1.025.691.003" },
  { comparar: "camila andrea guzmán ríos", ti: "1.025.695.779" },
  { comparar: "daniel felipe cáardenas ortiz", ti: "1.025.698.401" },
  { comparar: "juliana pardo bermúdez", ti: "1.025.701.856" },
  { comparar: "santiago vélez hoyos", ti: "1.025.704.232" },
];

function leer<T>(clave: string, defecto: T): T {
  try {
    const crudo = window.localStorage.getItem(MOCK_VENTANA + clave);
    return crudo ? (JSON.parse(crudo) as T) : defecto;
  } catch {
    return defecto;
  }
}

function escribir(clave: string, valor: unknown) {
  window.localStorage.setItem(MOCK_VENTANA + clave, JSON.stringify(valor));
}

function uuidDemo(): string {
  if (typeof window !== "undefined" && "randomUUID" in withCrypto()) {
    return withCrypto().randomUUID();
  }
  // Fallback sin crypto.randomUUID (navegadores viejos)
  return `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`;
}

function withCrypto(): Crypto {
  return window.crypto;
}

/* ───────────────── Carnet de sesión ───────────────── */

export async function mockInfoSesionPorPin(pin: string): Promise<InfoSesion> {
  const semilla = SEED_SESIONES[pin];
  if (!semilla) {
    throw new ErrorEstudiante("PIN_INVALIDO");
  }
  const ajustada = leer<Partial<SesionMock>>(`sesion:${pin}`, semilla);
  return {
    sesionId: `mock-sesion-${pin}`,
    estado: ajustada.estado ?? semilla.estado,
    faseActual: ajustada.faseActual ?? semilla.faseActual,
    taller: semilla.taller,
    numeroSesion: semilla.numeroSesion,
    curso: "11°-A",
  };
}

export async function mockUnirseSesion(
  pin: string,
  nombre: string,
  ti: string | null,
): Promise<{ estudianteId: string; yaRegistrado: boolean }> {
  const sesion = await mockInfoSesionPorPin(pin);
  if (sesion.estado !== "abierta") {
    throw new ErrorEstudiante("SESION_NO_ABIERTA");
  }

  const nombres = leer<string[]>(`nombres:${pin}`, []);
  const limpio = nombre.trim().toLowerCase();

  const duplicada = limpio === "valentina mejía suaza" && !ti?.includes("228");
  if (duplicada) {
    throw new ErrorEstudiante("NOMBRE_AMBIGUO");
  }

  // ¿ya se unió con ese nombre? reutiliza su estudianteId (re-ingreso)
  const miembroExistente = nombres.includes(limpio);
  if (!miembroExistente && limpio) {
    nombres.push(limpio);
    escribir(`nombres:${pin}`, nombres);
  }

  const miembros = leer<MiembroMock[]>(`miembros:${pin}`, []);
  let miembro = miembros.find((m) => m.nombre === limpio);
  if (!miembro) {
    miembro = {
      id: uuidDemo(),
      nombre: limpio,
      sesionId: sesion.sesionId,
    };
    miembros.push(miembro);
    escribir(`miembros:${pin}`, miembros);
  }

  return { estudianteId: miembro.id, yaRegistrado: ESTUDIANTES_SEED.some((e) => e.comparar === limpio) };
}

/* ───────────────── Respuestas de las fases ───────────────── */

export async function mockGuardarRespuesta(
  pin: string,
  estudianteId: string,
  tipo: FaseSesion,
  preguntaId: string | null,
  texto: string | null,
  seleccion: { seleccion: string } | null,
  checklist: { opciones: string[] } | null,
): Promise<void> {
  if (!SEED_SESIONES[pin]) {
    throw new ErrorEstudiante("PIN_INVALIDO");
  }
  const clave = `respuestas:${pin}:${estudianteId}`;
  const filas = leer<RespuestaMock[]>(clave, []);
  const indice = filas.findIndex(
    (f) => f.tipo === tipo && (f.pregunta_id ?? null) === preguntaId,
  );
  const fila: RespuestaMock = {
    tipo,
    pregunta_id: preguntaId,
    contenido_texto: texto,
    contenido_seleccion_json: seleccion ? JSON.stringify(seleccion) : null,
    contenido_checklist_json: checklist ? JSON.stringify(checklist) : null,
    fecha_envio: new Date().toISOString(),
  };
  if (indice === -1) filas.push(fila);
  else filas[indice] = fila;
  escribir(clave, filas);
}

export async function mockListarMisRespuestas(
  pin: string,
  estudianteId: string,
): Promise<FilaRespuesta[]> {
  return leer<RespuestaMock[]>(
    `respuestas:${pin}:${estudianteId}`, [],
  );
}

/* ───────────────── Test de Holland (demo) ───────────────── */

export async function mockPreguntasTest(): Promise<PreguntaTest[]> {
  // réplica estructural del catálogo real (misma distribución 90/90/60/60);
  // los enunciados son genéricos porque el modo demo no tiene el Excel.
  const salidas: PreguntaTest[] = [];
  for (let id = 1; id <= 300; id++) {
    const seccion =
      id <= 90
        ? ("intereses_actividades" as const)
        : id <= 180
          ? ("intereses_ocupaciones" as const)
          : id <= 240
            ? ("aptitudes" as const)
            : ("personalidad" as const);
    const tipoRespuesta = id <= 180 ? ("binario" as const) : ("escala_3" as const);
    const bloques = seccion === "intereses_actividades" || seccion === "intereses_ocupaciones" ? 15 : 10;
    const tipologia = "RIASEC"[Math.floor((id - 1) / bloques) % 6] as Tipologia;
    salidas.push({
      id,
      seccion,
      tipologia,
      orden: 1,
      enunciado: `Pregunta demo ${id} (${seccion}) — el texto real llega desde la base de datos.`,
      tipoRespuesta,
    });
  }
  return salidas;
}

interface GuardadaDemo extends RespuestaTestGuardada {
  sesion_id: string;
}

function claveRespTest(pin: string, estudianteId: string): string {
  return `respuestas-test:${pin}:${estudianteId}`;
}

export async function mockGuardarLoteTest(
  pin: string,
  estudianteId: string,
  pares: Array<{ preguntaId: number; respuesta: number }>,
): Promise<void> {
  const sesion = await mockInfoSesionPorPin(pin);
  if (sesion.estado !== "abierta") {
    throw new ErrorEstudiante("SESION_NO_ABIERTA");
  }
  const clave = claveRespTest(pin, estudianteId);
  const filas = leer<GuardadaDemo[]>(clave, []);
  for (const p of pares) {
    const idx = filas.findIndex((f) => f.pregunta_id === p.preguntaId);
    const fila: GuardadaDemo = {
      pregunta_id: p.preguntaId,
      respuesta: p.respuesta,
      sesion_id: sesion.sesionId,
    };
    if (idx === -1) filas.push(fila);
    else filas[idx] = fila;
  }
  escribir(clave, filas);
}

export async function mockListarMisRespuestasTest(
  pin: string,
  estudianteId: string,
): Promise<RespuestaTestGuardada[]> {
  const filas = await mockListarPersistido(pin, estudianteId);
  return filas.map(({ pregunta_id, respuesta }) => ({ pregunta_id, respuesta }));
}

async function mockListarPersistido(
  pin: string,
  estudianteId: string,
): Promise<GuardadaDemo[]> {
  return leer<GuardadaDemo[]>(claveRespTest(pin, estudianteId), []);
}

/** Puntaje por tipología = suma de respuestas (idéntico a fn_calcular_holland). */
function puntajesDesde(
  pares: RespuestaTestGuardada[],
  catalogo: Map<number, PreguntaTest>,
): Record<Tipologia, number> {
  const inicial = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  return pares.reduce<Record<Tipologia, number>>((acum, p) => {
    const pregunta = catalogo.get(p.pregunta_id);
    if (pregunta) acum[pregunta.tipologia] += p.respuesta;
    return acum;
  }, inicial);
}

/** Versión demo: calcula desde los guardados y queda en memoria del navegador,
 *  replicando resultados_test_holland (persistencia local keyed por estudiante). */
export async function mockCalcularHolland(
  pin: string,
  estudianteId: string,
): Promise<ResultadoHolland | null> {
  const [pares, catalogo] = await Promise.all([
    mockListarPersistido(pin, estudianteId),
    mockPreguntasTest(),
  ]);
  if (pares.length < 300) throw new ErrorEstudiante("FALTAN_PREGUNTAS");
  const puntajes = puntajesDesde(pares, new Map(catalogo.map((p) => [p.id, p])));
  const ranked = (["R", "I", "A", "S", "E", "C"] as Tipologia[])
    .sort(
      (a, b) =>
        puntajes[b] - puntajes[a] ||
        "RIASEC".indexOf(a) - "RIASEC".indexOf(b),
    )
    .join("");
  const resultado: ResultadoHolland = {
    codigoHolland: ranked.slice(0, 3),
    tipologias: [ranked[0], ranked[1], ranked[2]] as ResultadoHolland["tipologias"],
    puntajes,
    rankedCompleto: ranked,
  };
  escribir(`resultado-test:${pin}:${estudianteId}`, resultado);
  return resultado;
}

export async function mockVerResultadoPropio(
  pin: string,
  estudianteId: string,
): Promise<ResultadoHolland | null> {
  const guardado = leer<ResultadoHolland | null>(
    `resultado-test:${pin}:${estudianteId}`,
    null,
  );
  return guardado;
}

/* ───────────────── Panel del simulador (solo demo) ───────────────── */

export function mockPonerFase(pin: string, fase: FaseSesion) {
  const semilla = SEED_SESIONES[pin];
  const ajustada = leer<Partial<SesionMock>>(`sesion:${pin}`, semilla ?? {});
  escribir(`sesion:${pin}`, { ...ajustada, faseActual: fase, estado: "abierta" });
  notificar();
}

export function mockCerrarSesion(pin: string) {
  const semilla = SEED_SESIONES[pin];
  const ajustada = leer<Partial<SesionMock>>(`sesion:${pin}`, semilla ?? {});
  escribir(`sesion:${pin}`, { ...ajustada, estado: "completada" });
  notificar();
}

export function mockResetearSesion(pin: string) {
  window.localStorage.removeItem(MOCK_VENTANA + `sesion:${pin}`);
  notificar();
}

/** Evento interno para que las pantallas se refresquen al cambiar el simulador. */
const EVENTO_SIMULADOR = "yldc:mock:sesion-cambiada";
function notificar() {
  window.dispatchEvent(new Event(EVENTO_SIMULADOR));
}
export function alSimularCambio(cb: () => void): () => void {
  window.addEventListener(EVENTO_SIMULADOR, cb);
  window.dispatchEvent(new Event(EVENTO_SIMULADOR)); // dispara el primer render
  return () => {
    window.removeEventListener(EVENTO_SIMULADOR, cb);
  };
}

/*
  Generador de supabase/seed_holland_excel.sql desde el Excel oficial
  "CUESTIONARIO TIPOLOGÍA HOLLAND.xlsx" (PRUEBA RIASEC de Liliana).

  Requiere ejecutar una vez el descompresión del xlsx (es un zip):
    Copiar a %TEMP%\hollandxlsx.zip, Expand-Archive a %TEMP%\hollandxlsx

  Uso:
    node supabase/tools/generar-seed-holland-excel.mjs [raíz_extractada]
    (por defecto usa %TEMP%\hollandxlsx)

  Lee temp\xl\sharedStrings.xml + worksheets/sheet1..4.xml con regex
  (los XML son generados por Excel; el orden de <c t="s"> en cada hoja
  es secuencial — verificado contra los marcadores TOTAL - R/I/A/S/E/C).
  Escribe updates por id que SOLO reemplazan enunciado. Idempotente.
*/
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const TEMP = process.env.TEMP ?? process.env.TMP;
const raiz = process.argv[2] ?? join(TEMP, "hollandxlsx");

/* ── 1. sharedStrings (los textos) ─────────────────────────────── */
const rawSS = readFileSync(join(raiz, "xl", "sharedStrings.xml"), "utf8");
const decodificar = (t) =>
  t
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
const strings = [...rawSS.matchAll(/<si>[\s\S]*?<\/si>/g)].map((m) =>
  decodificar(m[0]
    .replace(/<\/t>/g, "")      // las <r><t> deben concatenar sin separadores
    .replace(/<[^>]+>/g, "")
  ),
);
console.log(`sharedStrings: ${strings.length} entradas`);

/* ── 2. Orden de índices por hoja (por aparición, secuencial) ───── */
const leerHoja = (archivo) =>
  [...readFileSync(join(raiz, "xl", "worksheets", archivo), "utf8").matchAll(
    /t="s"[^>]*>\s*<v>(\d+)<\/v>/g,
  )].map((m) => Number(m[1]));

/* ── 3. Mapa id ↔ (hoja, tipología, orden) — igual que seed.sql ───
   Los rangos son EXPLÍCITOS porque el Excel de Liliana intercala, entre los
   bloques de cada tipología, la celda "TOTAL - X" (reutilizando la misma
   cadena compartida 18/34/50/66/82/98 en TODAS las hojas). Solo en sheet1
   esos marcadores ocupan además un índice propio del listado compartido. */
const HOJAS = [
  { archivo: "sheet1.xml", lotes: 15,
    // [índice de hoja compartida, id de la base de datos] por tipología R I A S E C
    bloques: [[3, 1], [19, 16], [35, 31], [51, 46], [67, 61], [83, 76]] },
  { archivo: "sheet2.xml", lotes: 15,
    bloques: [[101, 91], [116, 106], [131, 121], [146, 136], [161, 151], [176, 166]] },
  { archivo: "sheet3.xml", lotes: 10,
    bloques: [[193, 181], [203, 191], [213, 201], [223, 211], [233, 221], [243, 231]] },
  { archivo: "sheet4.xml", lotes: 10,
    bloques: [[255, 241], [265, 251], [275, 261], [285, 271], [295, 281], [305, 291]] },
];
const TIPOS = ["R", "I", "A", "S", "E", "C"];
/* índices del listado compartido que NO son ítems:
   titulares/nombre-sección/instrucciones y los marcadores TOTAL - X */
const EXTRAS = new Set([
  0, 1, 2, 99, 100, 191, 192, 253, 254,
  18, 34, 50, 66, 82, 98,
]);

const errores = [];
const updates = [];

for (const h of HOJAS) {
  const seq = leerHoja(h.archivo);
  const rangoItems = new Map(); // idBase del listado compartido → [id BD...]
  const esperado = [];
  h.bloques.forEach(([sBase, idBase]) => {
    const indices = [];
    for (let j = 0; j < h.lotes; j++) {
      indices.push(sBase + j);
      esperado.push(sBase + j);
    }
    rangoItems.set(sBase, indices);
  });
  // extras permitidas: encabezados y marcadores (no pueden haber otras)
  const desconocidas = seq.filter(
    (i) => !rangoItems.has(h.bloques.find(([s]) => s <= i && i < s + h.lotes)?.[0]) && !EXTRAS.has(i),
  );
  if (desconocidas.length) {
    errores.push(`${h.archivo}: celdas fuera de lo esperado → ${desconocidas.join(",")}`);
  }
  // itemsENceldas, consecutivos por la tabla de rangos compartidos
  const soloItems = seq.filter((i) =>
    h.bloques.some(([s]) => i >= s && i < s + h.lotes),
  );
  if (soloItems.length !== esperado.length || soloItems.some((v, i) => v !== esperado[i])) {
    errores.push(
      `${h.archivo}: items en celdas ${soloItems.length} vs esperadas ${esperado.length}` +
      (soloItems.length === esperado.length ? " (orden difiere)" : ""),
    );
  }
  h.bloques.forEach(([sBase, idBase], t) => {
    for (let j = 0; j < h.lotes; j++) {
      const idx = sBase + j;
      const id = idBase + j;
      let texto = (strings[idx] ?? "")
        .replace(/\r?\n/g, " ")
        .replace(/\s+/g, " ")
        .replace(/^\d+\.\s*/, "")
        .trim();
      if (!texto || texto.length < 2) {
        errores.push(`${h.archivo}: texto vacío id=${id} sharedString=${idx}`);
        texto = `[PENDIENTE: texto vacío — hoja ${h.archivo}, fila ${idx}]`;
      }
      const escapado = texto.replace(/'/g, "''");
      updates.push(
        `update preguntas_test_holland set enunciado = '${escapado}' where id = ${id};`,
      );
    }
  });
}

const porSeccion = [1, 91, 181, 241].map((bb, s) => `${bb}-${bb + (s < 2 ? 89 : 59)}`).join(", ");

if (errores.length) {
  console.error("ABORTADO — revisar coincidencia antes de confiar en el volcado:");
  errores.forEach((e) => console.error(`  · ${e}`));
  process.exit(1);
}

const CABECERA = `-- ============================================================================
-- YLDC — TEST DE HOLLAND: ENUNCIADOS OFICIALES (generado desde el Excel de Liliana)
--   Fuente: "CUESTIONARIO TIPOLOGÍA HOLLAND.xlsx" (PRUEBA RIASEC - Typologia de Holland)
--   Textos VERBATIM del Excel: solo se quitó la numeración "N." del renglón;
--   ningún enunciado fue reescrito ni corregido (banderas en ⚠️ abajo).
--   ids: ${porSeccion} — estructura idéntica a seed.sql (binario / escala 1-3).
--
--   USO: correr DESPUÉS de seed.sql (Supabase → SQL Editor → Run).
--   Idempotente: solo cambia enunciado por id; se re-ejecuta sin duplicar.
--
--   ⚠️ PENDIENTE LILIANA: la ficha C de aptitudes incluye la pregunta 234
--      "Mi habilidad en francés es:" — probable residuo de la versión en
--      francés del instrumento. Se conserva tal cual hasta decisión suya.
--
--   REGENERACIÓN: node supabase/tools/generar-seed-holland-excel.mjs
--   (requiere el xlsx descomprimido en %TEMP%/hollandxlsx — ver comentario
--    inicial del script).
-- ============================================================================

`;

const salida = CABECERA + updates.join("\n") + "\n";
const destino = join(import.meta.dirname, "..", "seed_holland_excel.sql");
writeFileSync(destino, salida, "utf8");
console.log(`✓ ${updates.length} updates escritos en ${destino}`);
const primeros = updates.slice(0, 2).join("\n");
const ultimos = updates.slice(-2).join("\n");
console.log(`ejemplos:\n${primeros}\n...\n${ultimos}`);

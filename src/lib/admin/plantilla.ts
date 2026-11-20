/*
  RF-014 — plantilla Excel descargable para la carga de estudiantes.
  Dos hojas:
  · «Estudiantes»: encabezado congelado + validación de DR entero (TI).
  · «Guía»: instrucciones cortas para quemar en el colegio.
  Se genera en el navegador con exceljs (import dinámico, no va al bundle
  inicial) y se descarga como .xlsx.
*/

const N_FILAS = 60;

export async function descargarPlantillaEstudiantes(): Promise<void> {
  const { Workbook } = await import("exceljs");
  const wb = new Workbook();
  wb.creator = "YLDC × Fondacio Colombia";
  wb.created = new Date();

  /* ── hoja Estudiantes ── */
  const hoja = wb.addWorksheet("Estudiantes");
  hoja.columns = [
    { header: "Nombre completo", key: "nombre", width: 34 },
    { header: "Documento (TI)", key: "ti", width: 22 },
  ];

  const filaEncabezado = hoja.getRow(1);
  filaEncabezado.font = {
    bold: true,
    size: 12,
    color: { argb: "FF2C2453" }, // navy de marca
  };
  filaEncabezado.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFDF7C6" }, // tint yellow de marca
  };
  filaEncabezado.height = 22;
  hoja.views = [{ state: "frozen", ySplit: 1 }];

  // filas listas para llenar: formato de TI como número sin puntos +
  // validación por celda: TI entero positivo (con aviso, no bloqueo duro)
  for (let r = 2; r <= N_FILAS + 1; r++) {
    const celda = hoja.getCell(`B${r}`);
    celda.numFmt = "0";
    celda.dataValidation = {
      type: "whole",
      operator: "greaterThanOrEqual",
      formulae: [1],
      allowBlank: true,
      errorStyle: "warning",
      errorTitle: "Documento (TI)",
      error:
        "El TI debe ser un número entero, sin puntos ni letras. Déjalo vacío si no lo tienes a mano.",
      showErrorMessage: true,
    };
  }

  /* ── hoja Guía ── */
  const guia = wb.addWorksheet("Guía");
  guia.columns = [{ width: 96 }];
  const lineas = [
    "YLDC — Guía rápida para cargar estudiantes",
    "",
    "1. En la hoja «Estudiantes», escribe UNA estudiante por fila:",
    "   · Columna A: nombre completo (cómo aparece en el informe académico).",
    "   · Columna B: documento (TI) — número entero, sin puntos ni letras.",
    "2. No cambies ni borres la primera fila (los encabezados).",
    "",
    "Cuando vuelvas al panel del admin (pestaña «Estudiantes»):",
    "· Elige el curso y pulsa «Subir Excel» para cargar este mismo archivo:",
    "  el sistema lee la lista, la muestra en el cuadro para revisarla y",
    "  luego pulsas «Cargar lote».",
    "· Si es una sola estudiante, también puedes escribirla a mano con el",
    "  formato  Nombre;TI  por línea (o pegar celdas copiadas del Excel).",
    "· Los duplicados (en el curso o dentro del propio lote) se omiten solos.",
    "",
    "Nada se elimina: solo se agrega. Si una estudiante quedó mal creada,",
    "solicita la corrección al administrador del sistema.",
  ];
  for (const linea of lineas) guia.addRow([linea]);
  guia.getRow(1).font = { bold: true, size: 14, color: { argb: "FF2C2453" } };

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "plantilla_estudiantes_yldc.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

/* ── lectura del Excel subido (carga masiva) ── */

export type FilaEstudianteExcel = { nombreCompleto: string; ti: string | null };

/** Convierte el valor de una celda de exceljs a texto plano
 *  (números, texto enriquecido, fórmulas, hipervínculos, fechas). */
function textoDeCelda(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "number") {
    // TI grandes: sin notación científica ni decimales
    return Number.isInteger(valor) ? valor.toFixed(0) : String(valor);
  }
  if (typeof valor === "string") return valor;
  if (typeof valor === "boolean") return valor ? "1" : "";
  if (valor instanceof Date) return valor.toLocaleDateString("es-CO");
  if (typeof valor === "object") {
    const v = valor as {
      richText?: { text: string }[];
      result?: unknown;
      text?: unknown;
    };
    if (Array.isArray(v.richText))
      return v.richText.map((p) => p.text).join("");
    if ("result" in v) return textoDeCelda(v.result);
    if ("text" in v) return textoDeCelda(v.text);
  }
  return String(valor);
}

/**
 * Lee un .xlsx (idealmente la plantilla descargada) y devuelve las filas
 * de estudiantes. Usa la hoja «Estudiantes» o, si no existe, la primera.
 * Ubica las columnas por encabezado («nombre» / «documento|TI»); si no
 * hay encabezado reconocible, asume A = nombre y B = TI.
 */
export async function leerExcelEstudiantes(
  archivo: File,
): Promise<FilaEstudianteExcel[]> {
  if (!/\.xlsx$/i.test(archivo.name)) {
    throw new Error(
      "El archivo debe ser .xlsx (si lo tienes en .xls o .csv, ábrelo en Excel y guárdalo como .xlsx).",
    );
  }
  const { Workbook } = await import("exceljs");
  const wb = new Workbook();
  try {
    await wb.xlsx.load(await archivo.arrayBuffer());
  } catch {
    throw new Error(
      "No se pudo leer el archivo. Verifica que sea un Excel (.xlsx) válido.",
    );
  }

  const hoja =
    wb.worksheets.find((h) => h.name.trim().toLowerCase() === "estudiantes") ??
    wb.worksheets[0];
  if (!hoja) return [];

  const normalizar = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

  // ¿la primera fila es encabezado?
  let colNombre = 1;
  let colTi = 2;
  let filaInicio = 1;
  const encabezado = hoja.getRow(1);
  let hayEncabezado = false;
  encabezado.eachCell((celda, col) => {
    const t = normalizar(textoDeCelda(celda.value));
    if (t.includes("nombre")) {
      colNombre = col;
      hayEncabezado = true;
    } else if (
      t.includes("documento") ||
      /\bti\b/.test(t) ||
      t.includes("identidad")
    ) {
      colTi = col;
      hayEncabezado = true;
    }
  });
  if (hayEncabezado) filaInicio = 2;

  const filas: FilaEstudianteExcel[] = [];
  for (let r = filaInicio; r <= hoja.rowCount; r++) {
    const fila = hoja.getRow(r);
    const nombre = textoDeCelda(fila.getCell(colNombre).value)
      .replace(/[;\t\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!nombre) continue;
    const ti = textoDeCelda(fila.getCell(colTi).value)
      .replace(/[.\s;,]/g, "")
      .trim();
    filas.push({ nombreCompleto: nombre, ti: ti || null });
  }
  return filas;
}

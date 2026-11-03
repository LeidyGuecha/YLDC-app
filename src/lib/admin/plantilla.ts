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
    "· Elige el curso y pega tu lista en el cuadro de texto.",
    "· En Excel: selecciona las celdas desde A2 hasta la B de tu última fila,",
    "  cópialas y pégalas directo — el sistema entiende el pegado de Excel.",
    "  También sirve escribir a mano con el formato  Nombre;TI  por línea.",
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

/*
  RF-012/013 — reporte PDF individual del estudiante (RF-012) y base del
  ZIP del curso (RF-013). Se genera en el navegador con jsPDF mediante
  import dinámico (no agranda el bundle inicial).
  Estilo: paleta YLDC (navy #2C2453, teal #2CAEC1, pink #EF4C6A),
  helvetica, A4, pie en TODAS las páginas.
*/

export interface ReporteRespuesta {
  /** Encabezado de la sesión, ej: «Sesión 1 · PIN 841279 · Abierta». */
  sesionTitulo: string;
  fase: "como_vengo" | "actividad" | "como_voy";
  fecha: string;
  /** Resumen legible de la fila (texto / elección / opciones). */
  resumen: string;
}

export interface ReporteComentarioGrupal {
  sesionTitulo: string;
  fecha: string;
  autor: string;
  texto: string;
}

export interface ReporteDatos {
  colegio: string;
  curso: string;
  nombre: string;
  ti: string | null;
  consentimiento: boolean;
  generadoPor: string;
  resultado: {
    codigo: string;
    tipologias: [string, string, string];
    fecha: string;
    puntajes: Record<"R" | "I" | "A" | "S" | "E" | "C", number>;
  } | null;
  comentarioIndividual: {
    autor: string;
    fecha: string;
    editado: string | null;
    texto: string;
  } | null;
  comentariosGrupales: ReporteComentarioGrupal[];
  fases: ReporteRespuesta[];
}

const ETIQUETA_FASE: Record<ReporteRespuesta["fase"], string> = {
  como_vengo: "Cómo vengo",
  actividad: "Actividad",
  como_voy: "Cómo voy",
};

const NAVY = { r: 44, g: 36, b: 83 };
const TEAL = { r: 44, g: 174, b: 193 };
const GRIS = { r: 230, g: 231, b: 232 };
const INK = { r: 52, g: 53, b: 54 };
const INK2 = { r: 105, g: 107, b: 110 };

const ANCHO = 210; // mm (A4)
const MARGEN = 18;
const PAGA_HASTA = 278; // y máxima útil
const ANCHO_BARRA = 70;

export function nombreArchivoEstudiante(nombre: string, indice?: number): string {
  const limpio = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .trim()
    .replace(/\s+/g, "_");
  const pref = indice !== undefined ? `${String(indice).padStart(2, "0")}_` : "";
  return `${pref}reporte_${limpio || "estudiante"}.pdf`;
}

/** Construye el documento completo y devuelve los bytes (para descarga o ZIP). */
export async function bytesPdfEstudiante(
  d: ReporteDatos,
): Promise<Uint8Array> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = 0;

  function setColor(c: typeof NAVY | typeof INK | typeof INK2) {
    doc.setTextColor(c.r, c.g, c.b);
  }
  function banda(c: { r: number; g: number; b: number }, h: number) {
    doc.setFillColor(c.r, c.g, c.b);
    doc.rect(0, 0, ANCHO, h, "F");
  }

  /* ── encabezado de marca ── */
  banda(NAVY, 22);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("YLDC", MARGEN, 12.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Sistema de diseño YLDC — UCatólica × Fondacio Colombia", MARGEN, 17.5);
  doc.text("Reporte individual del estudiante", ANCHO - MARGEN, 12.5, {
    align: "right",
  });
  doc.setFontSize(7.5);
  doc.text(
    new Date().toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    ANCHO - MARGEN,
    17.5,
    { align: "right" },
  );
  y = 30;

  /* ── datos básicos ── */
  doc.setFont("helvetica", "bold");
  setColor(NAVY);
  doc.setFontSize(13);
  doc.text(d.nombre, MARGEN, y);
  y += 6.5;
  doc.setFont("helvetica", "normal");
  setColor(INK2);
  doc.setFontSize(9);
  const filaDatos = [
    `Colegio: ${d.colegio}`,
    `Curso: ${d.curso}`,
    d.ti ? `TI: ${d.ti}` : "TI: —",
    `Consentimiento: ${d.consentimiento ? "Aceptado" : "Pendiente"}`,
  ].join("    ·    ");
  doc.text(filaDatos, MARGEN, y);

  /* ── helpers de secciones ── */
  function seccion(titulo: string) {
    if (y > PAGA_HASTA - 26) {
      doc.addPage();
      y = 20;
    }
    y += 8;
    doc.setFont("helvetica", "bold");
    setColor(NAVY);
    doc.setFontSize(10.5);
    doc.text(titulo, MARGEN, y);
    y += 2;
    doc.setDrawColor(GRIS.r, GRIS.g, GRIS.b);
    doc.setLineWidth(0.4);
    doc.line(MARGEN, y, ANCHO - MARGEN, y);
    y += 5.5;
  }

  function parrafo(
    texto: string,
    opciones: { normal?: boolean; gris?: boolean } = {},
  ) {
    doc.setFont("helvetica", opciones.normal ? "normal" : "bold");
    setColor(opciones.gris ? INK2 : INK);
    doc.setFontSize(9);
    const ancho = ANCHO - MARGEN * 2;
    const lineas = doc.splitTextToSize(texto, ancho) as string[];
    for (const l of lineas) {
      if (y > PAGA_HASTA) {
        doc.addPage();
        y = 20;
      }
      doc.text(l, MARGEN, y);
      y += 5;
    }
    y += 1.5;
  }

  /* ── resultado del test (RF: consolidado) ── */
  if (d.resultado) {
    seccion("Resultado del test de Holland");
    doc.setFont("helvetica", "bold");
    setColor(NAVY);
    doc.setFontSize(22);
    doc.text(d.resultado.codigo, MARGEN, y + 4);
    doc.setFont("helvetica", "normal");
    setColor(INK2);
    doc.setFontSize(8.5);
    doc.text(
      `Predominante: ${d.resultado.tipologias.join(" · ")}   —   ${new Date(
        d.resultado.fecha,
      ).toLocaleDateString("es-CO")}`,
      MARGEN + 22,
      y + 3.5,
    );
    y += 9;

    for (const tip of ["R", "I", "A", "S", "E", "C"] as const) {
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      setColor(INK);
      doc.text(tip, MARGEN, y);
      const valor = d.resultado.puntajes[tip];
      // pista (fondo gris) + barra teal a escala /90
      doc.setFillColor(GRIS.r, GRIS.g, GRIS.b);
      doc.rect(MARGEN + 6, y - 2.6, ANCHO_BARRA, 3.2, "F");
      doc.setFillColor(TEAL.r, TEAL.g, TEAL.b);
      doc.rect(
        MARGEN + 6,
        y - 2.6,
        Math.max(0.8, (valor / 90) * ANCHO_BARRA),
        3.2,
        "F",
      );
      doc.setFont("helvetica", "normal");
      setColor(INK2);
      doc.setFontSize(7.5);
      doc.text(`${valor}/90`, MARGEN + 6 + ANCHO_BARRA + 3, y);
    }
  }

  /* ── comentario psicológico individual ── */
  if (d.comentarioIndividual) {
    seccion("Comentario psicológico");
    setColor(INK2);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${d.comentarioIndividual.autor} · ${new Date(
        d.comentarioIndividual.fecha,
      ).toLocaleDateString("es-CO")}${
        d.comentarioIndividual.editado
          ? ` · editado ${new Date(d.comentarioIndividual.editado).toLocaleDateString("es-CO")}`
          : ""
      }`,
      MARGEN,
      y,
    );
    y += 1.5;
    parrafo(d.comentarioIndividual.texto, { gris: false });
  }

  /* ── comentarios grupales por sesión ── */
  if (d.comentariosGrupales.length > 0) {
    seccion("Comentarios grupales del taller");
    for (const c of d.comentariosGrupales) {
      const encabezado = `${c.sesionTitulo} — ${c.autor} · ${new Date(c.fecha).toLocaleDateString("es-CO")}`;
      parrafo(encabezado, { normal: false });
      parrafo(c.texto, { gris: true });
    }
  }

  /* ── historial de fases ── */
  if (d.fases.length > 0) {
    seccion("Historial de respuestas");
    let sesionActual = "";
    for (const r of d.fases) {
      if (r.sesionTitulo !== sesionActual) {
        sesionActual = r.sesionTitulo;
        y += 2;
        parrafo(sesionActual, { normal: false });
      }
      // «Fase — resumen» en una viñeta
      parrafo(
        `• ${ETIQUETA_FASE[r.fase]}: ${r.resumen}`,
        { gris: true },
      );
    }
  } else if (!d.resultado) {
    parrafo("Esta estudiante aún no tiene registro de sesiones ni del test.", {
      gris: true,
    });
  }

  /* ── pie en todas las páginas ── */
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setColor(INK2);
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.text(
      `Generado por ${d.generadoPor} vía YLDC · ${new Date().toLocaleString(
        "es-CO",
        {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        },
      )}`,
      MARGEN,
      291,
    );
    doc.setDrawColor(GRIS.r, GRIS.g, GRIS.b);
    doc.setLineWidth(0.3);
    doc.line(MARGEN, 286, ANCHO - MARGEN, 286);
    doc.text(`Página ${i} de ${total}`, ANCHO - MARGEN, 291, {
      align: "right",
    });
  }

  return new Uint8Array(doc.output("arraybuffer"));
}

/** Genera y dispara la descarga del PDF en el navegador. */
export async function descargarPdfEstudiante(d: ReporteDatos): Promise<void> {
  const bytes = await bytesPdfEstudiante(d);
  const blob = new Blob([bytes as unknown as ArrayBuffer], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivoEstudiante(d.nombre);
  a.click();
  URL.revokeObjectURL(url);
}

/** Descarga arbitraria de bytes con nombre (usada por el ZIP del curso). */
export function descargarBytes(
  bytes: Uint8Array,
  nombre: string,
  mime: string,
): void {
  const blob = new Blob([bytes as unknown as ArrayBuffer], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

import type { ContextoEstudiante } from "./types";

/* Contexto del estudiante entre pantallas: /estudiante → /estudiante/sesion.
   Deshabilitar AUTH del estudiante por diseño ⇒ su identidad viva en
   localStorage en el navegador (se pierde al limpiar el navegador: en
   tal caso vuelve a pedir PIN + nombre, que es exactamente fn_unirse). */

const CLAVE = "yldc:estudiante";

export function leerContexto(): ContextoEstudiante | null {
  if (typeof window === "undefined") return null;
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const datos = JSON.parse(crudo) as ContextoEstudiante;
    return datos?.pin && datos?.estudianteId && datos?.sesionId ? datos : null;
  } catch {
    return null;
  }
}

export function guardarContexto(contexto: ContextoEstudiante) {
  window.localStorage.setItem(CLAVE, JSON.stringify(contexto));
}

export function borrarContexto() {
  window.localStorage.removeItem(CLAVE);
}

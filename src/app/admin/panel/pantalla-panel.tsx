"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, SignOut, SpinnerGap } from "@phosphor-icons/react";
import { Badge, Logo } from "@/components/ui";
import { cerrarSesion, miPerfil } from "@/lib/admin/auth";
import {
  cambiarCuenta,
  cargarEstudiantes,
  crearCuenta,
  crearCurso,
  listarAdmins,
  listarAudit,
  listarColegios,
  listarCursosAdmin,
  listarEstudiantesDeCurso,
  listarFacilitadoras,
  listarPsicologas,
} from "@/lib/admin/api";
import type {
  CuentaAdmin,
  CuentaFacilitadora,
  CuentaPsicologa,
  ColegioAdmin,
  CursoAdmin,
  EstudianteDeCurso,
  PerfilAdmin,
  RegistroAudit,
} from "@/lib/admin/types";
import { mensajeAmable } from "@/lib/estudiante/api";
import { supabaseConfigurado } from "@/lib/supabase/config";

type Tab = "cuentas" | "estudiantes" | "historial";

const COLOR_ACCION: Record<
  string,
  "teal" | "pinkSoft" | "yellow" | "neutral"
> = {
  crear: "teal",
  activar: "teal",
  desactivar: "pinkSoft",
  editar: "neutral",
  asignar: "teal",
  desasignar: "pinkSoft",
  cargar_excel: "yellow",
  generar_reporte: "yellow",
  generar_zip: "yellow",
};

const ETIQUETA_ENTIDAD: Record<string, string> = {
  facilitadores: "Facilitadora",
  psicologas: "Psicóloga",
  admins: "Admin",
  cursos: "Curso",
  estudiantes: "Estudiantes",
};

function fechaLarga(valor: string): string {
  return new Date(valor).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PantallaPanelAdmin() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilAdmin | null>(null);
  const [tab, setTab] = useState<Tab>("cuentas");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabaseConfigurado) return;
    (async () => {
      try {
        const p = await miPerfil();
        if (!p) {
          router.replace("/admin");
          return;
        }
        setPerfil(p);
      } catch (e) {
        setError(mensajeAmable(e));
      } finally {
        setCargando(false);
      }
    })();
  }, [router]);

  async function alSalir() {
    await cerrarSesion();
    router.replace("/admin");
  }

  if (!supabaseConfigurado) {
    return (
      <main className="flex-1 grid place-items-center px-6 py-10">
        <div className="max-w-sm text-center flex flex-col gap-3">
          <Logo variant="color" height={40} />
          <p className="text-sm text-ink-2">
            El panel del admin trabaja contra la base de datos real. Configura{" "}
            <span className="font-mono text-navy">.env.local</span> con las
            credenciales de Supabase para usarlo.
          </p>
        </div>
      </main>
    );
  }

  if (cargando) {
    return (
      <main className="flex-1 grid place-items-center text-sm text-ink-2">
        Cargando tu panel…
      </main>
    );
  }

  if (!perfil) return null; // ya redirigió a /admin

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Logo variant="color" height={28} />
          <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-teal">
            Panel del administrador
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-ink-2">{perfil.nombreCompleto}</p>
          <button
            onClick={alSalir}
            className="h-8 px-3 rounded-lg border border-stroke text-xs text-ink-2 inline-flex items-center gap-1.5 hover:border-pink hover:text-pink cursor-pointer"
          >
            <SignOut size={13} /> Salir
          </button>
        </div>
      </header>

      {error && (
        <p className="text-xs text-pink bg-tint-pink rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <nav className="flex flex-wrap gap-2">
        {(
          [
            ["cuentas", "Cuentas"],
            ["estudiantes", "Estudiantes"],
            ["historial", "Historial"],
          ] as const
        ).map(([clave, texto]) => (
          <button
            key={clave}
            onClick={() => setTab(clave)}
            className={`h-9 px-4 rounded-full text-sm font-medium border cursor-pointer ${
              tab === clave
                ? "bg-navy text-white border-navy"
                : "bg-white text-ink-2 border-stroke hover:border-navy"
            }`}
          >
            {texto}
          </button>
        ))}
      </nav>

      {tab === "cuentas" && (
        <PanelCuentas
          perfilPropioId={perfil.id}
          alError={(m) => setError(m)}
        />
      )}
      {tab === "estudiantes" && (
        <PanelEstudiantes alError={(m) => setError(m)} />
      )}
      {tab === "historial" && <PanelHistorial alError={(m) => setError(m)} />}
    </main>
  );
}

/* ───────────────── Pestaña Cuentas ───────────────── */

type Entidad = "facilitadores" | "psicologas" | "admins";

function PanelCuentas({
  perfilPropioId,
  alError,
}: {
  perfilPropioId: string;
  alError: (mensaje: string) => void;
}) {
  const [facilitadoras, setFacilitadoras] = useState<CuentaFacilitadora[]>([]);
  const [psicologas, setPsicologas] = useState<CuentaPsicologa[]>([]);
  const [admins, setAdmins] = useState<CuentaAdmin[]>([]);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [refresco, setRefresco] = useState(0);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const [f, p, a] = await Promise.all([
          listarFacilitadoras(),
          listarPsicologas(),
          listarAdmins(),
        ]);
        if (!vivo) return;
        setFacilitadoras(f);
        setPsicologas(p);
        setAdmins(a);
      } catch (e) {
        alError(mensajeAmable(e));
      }
    })();
    return () => {
      vivo = false;
    };
  }, [refresco, alError]);

  async function alAlternar(entidad: Entidad, id: string, nuevo: boolean) {
    const clave = `${entidad}:${id}`;
    setOcupado(clave);
    try {
      await cambiarCuenta(entidad, id, nuevo);
      setRefresco((n) => n + 1); // recarga las tres listas
    } catch (e) {
      alError(mensajeAmable(e));
    } finally {
      setOcupado(null);
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <p className="text-xs text-ink-2">
        Las cuentas se activan y desactivan (nunca se eliminan). El badge
        «Sin vínculo» indica que la fila de rol todavía no tiene cuenta de
        acceso de Supabase — se conecta con el paso 5 del README.
      </p>

      <BloqueCuentas
        titulo="Facilitadoras"
        entidad="facilitadores"
        filas={facilitadoras.map((c) => ({
          id: c.id,
          nombreCompleto: c.nombreCompleto,
          correo: c.correo,
          activo: c.activo,
          autovinculada: c.autovinculada,
          extra: null as string | null,
        }))}
        ocupado={ocupado}
        alAlternar={alAlternar}
        alError={alError}
        alCreada={() => setRefresco((n) => n + 1)}
      />

      <BloqueCuentas
        titulo="Psicólogas"
        entidad="psicologas"
        filas={psicologas.map((c) => ({
          id: c.id,
          nombreCompleto: c.nombreCompleto,
          correo: c.correo,
          activo: c.activa,
          autovinculada: c.autovinculada,
          extra: c.colegioNombre
            ? `Colegio: ${c.colegioNombre}`
            : "Todos los colegios",
        }))}
        ocupado={ocupado}
        alAlternar={alAlternar}
        alError={alError}
        alCreada={() => setRefresco((n) => n + 1)}
      />

      <BloqueCuentas
        titulo="Admins"
        entidad="admins"
        filas={admins.map((c) => ({
          id: c.id,
          nombreCompleto: c.nombreCompleto,
          correo: c.correo,
          activo: c.activo,
          autovinculada: c.autovinculada,
          // el admin no puede desactivarse a sí mismo
          bloqueada: c.id === perfilPropioId,
          extra: c.id === perfilPropioId ? "Tu cuenta" : null,
        }))}
        ocupado={ocupado}
        alAlternar={alAlternar}
        alError={alError}
        alCreada={() => setRefresco((n) => n + 1)}
      />
    </section>
  );
}

function BloqueCuentas({
  titulo,
  entidad,
  filas,
  ocupado,
  alAlternar,
  alError,
  alCreada,
}: {
  titulo: string;
  entidad: Entidad;
  filas: {
    id: string;
    nombreCompleto: string;
    correo: string;
    activo: boolean;
    autovinculada: boolean;
    bloqueada?: boolean;
    extra: string | null;
  }[];
  ocupado: string | null;
  alAlternar: (entidad: Entidad, id: string, nuevo: boolean) => void;
  alError: (mensaje: string) => void;
  alCreada: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-navy">{titulo}</h2>
        <span className="text-[11px] text-ink-2">{filas.length} cuentas</span>
      </div>

      {filas.length === 0 ? (
        <p className="text-xs text-ink-2">Ninguna cuenta aún.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[560px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-ink-2">
                <th className="py-2 pr-3 font-medium">Cuenta</th>
                <th className="py-2 pr-3 font-medium">Correo</th>
                <th className="py-2 pr-3 font-medium">Vínculo</th>
                <th className="py-2 pr-3 font-medium">Estado</th>
                <th className="py-2 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => {
                const clave = `${entidad}:${f.id}`;
                const ocupada = ocupado === clave;
                return (
                  <tr key={f.id} className="border-t border-stroke">
                    <td className="py-2.5 pr-3 text-sm text-ink">
                      {f.nombreCompleto}
                      {f.bloqueada && (
                        <Badge variant="neutral" className="ml-2">
                          tú
                        </Badge>
                      )}
                      {f.extra && (
                        <p className="text-[11px] text-ink-2">{f.extra}</p>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-ink-2">
                      {f.correo}
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge variant={f.autovinculada ? "teal" : "yellow"} dot>
                        {f.autovinculada ? "Vinculada" : "Sin vínculo"}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge variant={f.activo ? "teal" : "neutral"}>
                        {f.activo ? "Activa" : "Inactiva"}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => alAlternar(entidad, f.id, !f.activo)}
                        disabled={ocupada || f.bloqueada}
                        title={
                          f.bloqueada
                            ? "No puedes desactivar tu propia cuenta"
                            : undefined
                        }
                        className={`text-xs font-medium cursor-pointer disabled:opacity-40 ${
                          f.activo ? "text-pink hover:underline" : "text-teal hover:underline"
                        }`}
                      >
                        {ocupada ? (
                          <SpinnerGap size={13} className="animate-spin" />
                        ) : f.activo ? (
                          "Desactivar"
                        ) : (
                          "Activar"
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <FormularioCrear
        entidad={entidad}
        titulo={titulo}
        alError={alError}
        alCreada={alCreada}
      />
    </div>
  );
}

function FormularioCrear({
  entidad,
  titulo,
  alError,
  alCreada,
}: {
  entidad: Entidad;
  titulo: string;
  alError: (mensaje: string) => void;
  alCreada: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [cargando, setCargando] = useState(false);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    try {
      await crearCuenta(entidad, nombre, correo);
      setNombre("");
      setCorreo("");
      setAbierto(false);
      alCreada();
    } catch (err) {
      alError(mensajeAmable(err));
    } finally {
      setCargando(false);
    }
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="self-start inline-flex items-center gap-1.5 text-xs font-medium text-navy hover:text-teal cursor-pointer"
      >
        <Plus size={13} /> Crear {titulo.toLowerCase().replace(/s$/, "")}
      </button>
    );
  }

  return (
    <form
      onSubmit={crear}
      className="rounded-xl bg-tint-navy p-3 flex flex-col gap-2.5"
    >
      <div className="grid sm:grid-cols-2 gap-2.5">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre completo"
          required
          className="h-9 rounded-lg border border-stroke bg-white px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal"
        />
        <input
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          placeholder="correo@yldc.app"
          required
          className="h-9 rounded-lg border border-stroke bg-white px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal"
        />
      </div>
      <p className="text-[11px] text-ink-2">
        La cuenta de acceso se crea en Supabase Auth con este mismo correo; la
        fila de rol queda «Sin vínculo» hasta conectarla (paso 5 del README).
      </p>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="h-8 px-3 rounded-lg text-xs text-ink-2 hover:text-navy cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={cargando}
          className="h-8 px-3 rounded-lg bg-navy text-white text-xs inline-flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
        >
          {cargando ? (
            <SpinnerGap size={12} className="animate-spin" />
          ) : (
            <Plus size={12} />
          )}
          Crear cuenta
        </button>
      </div>
    </form>
  );
}

/* ───────────────── Pestaña Estudiantes ───────────────── */

/** Parsea el lote pegado: una línea por estudiante «Nombre;TI» (o con coma). */
function parsearLote(texto: string): {
  nombreCompleto: string;
  ti: string | null;
}[] {
  const filas: { nombreCompleto: string; ti: string | null }[] = [];
  for (const linea of texto.split(/\r?\n/)) {
    const t = linea.trim();
    if (!t) continue;
    const partes = t.includes(";") ? t.split(";") : t.split(",");
    const nombre = (partes[0] ?? "").trim();
    if (!nombre) continue;
    const ti = (partes[1] ?? "").trim() || null;
    filas.push({ nombreCompleto: nombre, ti });
  }
  return filas;
}

function PanelEstudiantes({
  alError,
}: {
  alError: (mensaje: string) => void;
}) {
  const [cursos, setCursos] = useState<CursoAdmin[]>([]);
  const [cursoSel, setCursoSel] = useState<string | null>(null);
  const [estudiantes, setEstudiantes] = useState<EstudianteDeCurso[]>([]);
  const [colegios, setColegios] = useState<ColegioAdmin[]>([]);

  // curso nuevo
  const [colegioNuevo, setColegioNuevo] = useState("");
  const [gradoNuevo, setGradoNuevo] = useState("9");
  const [anioNuevo, setAnioNuevo] = useState("2027");
  const [creandoCurso, setCreandoCurso] = useState(false);

  // carga del lote
  const [lote, setLote] = useState("");
  const [cargandoLote, setCargandoLote] = useState(false);
  const [resultado, setResultado] = useState<{
    creados: number;
    omitidos: number;
  } | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const [cc, cols] = await Promise.all([
          listarCursosAdmin(),
          listarColegios(),
        ]);
        if (!vivo) return;
        setCursos(cc);
        setColegios(cols);
      } catch (e) {
        alError(mensajeAmable(e));
      }
    })();
    return () => {
      vivo = false;
    };
  }, [alError]);

  useEffect(() => {
    if (!cursoSel) return;
    let vivo = true;
    (async () => {
      try {
        const lista = await listarEstudiantesDeCurso(cursoSel);
        if (!vivo) return;
        setEstudiantes(lista);
      } catch (e) {
        alError(mensajeAmable(e));
      }
    })();
    return () => {
      vivo = false;
    };
  }, [cursoSel, alError]);

  async function alCrearCurso(e: React.FormEvent) {
    e.preventDefault();
    if (!colegioNuevo) return;
    setCreandoCurso(true);
    try {
      const nuevo = await crearCurso({
        colegioId: colegioNuevo,
        grado: Number(gradoNuevo),
        anio: Number(anioNuevo),
      });
      setCursos(await listarCursosAdmin());
      setCursoSel(nuevo.id);
    } catch (err) {
      alError(mensajeAmable(err));
    } finally {
      setCreandoCurso(false);
    }
  }

  async function alCargarLote() {
    if (!cursoSel) return;
    const filas = parsearLote(lote);
    if (filas.length === 0) return;
    setCargandoLote(true);
    try {
      const r = await cargarEstudiantes(cursoSel, filas);
      setResultado(r);
      setEstudiantes(await listarEstudiantesDeCurso(cursoSel));
    } catch (err) {
      alError(mensajeAmable(err));
    } finally {
      setCargandoLote(false);
    }
  }

  const curso = cursos.find((c) => c.id === cursoSel) ?? null;

  return (
    <section className="flex flex-col gap-5">
      {/* Curso nuevo */}
      <form
        onSubmit={alCrearCurso}
        className="bg-white rounded-2xl shadow-card p-5 flex flex-col gap-3"
      >
        <div>
          <h2 className="text-sm font-bold text-navy">Curso nuevo</h2>
          <p className="text-[11px] text-ink-2">
            Crea el curso (colegio + grado + año) y luego cárgale estudiantes.
          </p>
        </div>
        <div className="grid sm:grid-cols-[1fr_auto_auto_auto] gap-2.5 items-end">
          <select
            value={colegioNuevo}
            onChange={(e) => setColegioNuevo(e.target.value)}
            required
            className="h-10 rounded-lg border border-stroke bg-white px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal cursor-pointer"
          >
            <option value="">Colegio…</option>
            {colegios.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} — {c.localidad}
              </option>
            ))}
          </select>
          <select
            value={gradoNuevo}
            onChange={(e) => setGradoNuevo(e.target.value)}
            className="h-10 rounded-lg border border-stroke bg-white px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal cursor-pointer"
          >
            <option value="9">9°</option>
            <option value="10">10°</option>
            <option value="11">11°</option>
          </select>
          <input
            type="number"
            value={anioNuevo}
            onChange={(e) => setAnioNuevo(e.target.value)}
            min={2026}
            max={2100}
            required
            className="h-10 w-24 rounded-lg border border-stroke px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <button
            type="submit"
            disabled={creandoCurso || !colegioNuevo}
            className="h-10 px-4 rounded-xl bg-navy text-white text-sm inline-flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
          >
            {creandoCurso ? (
              <SpinnerGap size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            Crear
          </button>
        </div>
      </form>

      {/* Selector de curso */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-2">
          Cursos
        </p>
        <div className="flex flex-wrap gap-2">
          {cursos.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCursoSel(c.id);
                setResultado(null);
              }}
              className={`h-8 px-3 rounded-full text-xs font-medium border cursor-pointer ${
                cursoSel === c.id
                  ? "bg-navy text-white border-navy"
                  : "bg-white text-ink-2 border-stroke hover:border-navy"
              }`}
            >
              {c.etiqueta} · {c.colegioNombre}
            </button>
          ))}
          {cursos.length === 0 && (
            <p className="text-xs text-ink-2">
              Aún no hay cursos. Crea el primero arriba.
            </p>
          )}
        </div>
      </div>

      {/* Carga del lote + lista del curso */}
      {curso && (
        <>
          <div className="bg-white rounded-2xl shadow-card p-5 flex flex-col gap-3">
            <div>
              <h2 className="text-sm font-bold text-navy">
                Cargar estudiantes — {curso.etiqueta} · {curso.colegioNombre}
              </h2>
              <p className="text-[11px] text-ink-2">
                Pega la lista del Excel: una línea por estudiante con{" "}
                <span className="font-mono text-navy">Nombre;TI</span> (el TI
                es opcional; también acepta coma como separador). Los
                duplicados del curso o del lote se omiten solos.
              </p>
            </div>

            <textarea
              value={lote}
              onChange={(e) => setLote(e.target.value)}
              rows={6}
              placeholder={"María Pérez;1020304050\nAna Rodríguez\n…"}
              className="w-full rounded-xl border border-stroke p-3 text-sm text-ink font-mono focus:outline-none focus:ring-2 focus:ring-teal"
            />

            <div className="flex items-center gap-3 justify-end">
              {resultado && (
                <p className="text-xs">
                  <span className="font-bold text-teal">
                    {resultado.creados} creados
                  </span>
                  {" · "}
                  <span className="text-ink-2">
                    {resultado.omitidos} omitidos
                  </span>
                </p>
              )}
              <button
                onClick={alCargarLote}
                disabled={cargandoLote || parsearLote(lote).length === 0}
                className="h-9 px-4 rounded-xl bg-navy text-white text-sm inline-flex items-center gap-2 disabled:opacity-40 cursor-pointer"
              >
                {cargandoLote ? (
                  <SpinnerGap size={14} className="animate-spin" />
                ) : null}
                Cargar lote ({parsearLote(lote).length})
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy">
                Estudiantes del curso
              </h3>
              <span className="text-[11px] text-ink-2">
                {estudiantes.length} en total
              </span>
            </div>
            {estudiantes.length === 0 ? (
              <p className="text-xs text-ink-2">
                Este curso aún no tiene estudiantes cargados.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-stroke">
                {estudiantes.map((e) => (
                  <li
                    key={e.id}
                    className="py-2 flex items-center justify-between gap-3"
                  >
                    <span className="text-sm text-ink">
                      {e.nombreCompleto}
                      {!e.activo && (
                        <Badge variant="neutral" className="ml-2">
                          inactiva
                        </Badge>
                      )}
                    </span>
                    <span className="text-xs text-ink-2 flex items-center gap-2">
                      {e.ti ?? "—"}
                      <Badge variant={e.origen === "excel" ? "yellow" : "neutral"}>
                        {e.origen === "excel" ? "Excel" : "Directo"}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}

/* ───────────────── Pestaña Historial (4.8) ───────────────── */

function PanelHistorial({
  alError,
}: {
  alError: (mensaje: string) => void;
}) {
  const [entradas, setEntradas] = useState<RegistroAudit[] | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const lista = await listarAudit();
        if (!vivo) return;
        setEntradas(lista);
      } catch (e) {
        alError(mensajeAmable(e));
      }
    })();
    return () => {
      vivo = false;
    };
  }, [alError]);

  return (
    <section className="flex flex-col gap-3">
      <p className="text-xs text-ink-2">
        Pantalla 4.8 — aquí queda el rastro de lo que hacen los admins (todas
        las acciones de este panel se registran solas).
      </p>

      {entradas === null ? (
        <p className="text-xs text-ink-2 inline-flex items-center gap-2">
          <SpinnerGap size={13} className="animate-spin" /> Cargando
          historial…
        </p>
      ) : entradas.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-8 text-center">
          <p className="text-sm text-ink-2">Aún no hay actividad registrada.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card p-5 flex flex-col">
          {entradas.map((a, i) => (
            <div
              key={a.id}
              className={`py-3 flex flex-col gap-1 ${
                i > 0 ? "border-t border-stroke" : ""
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={COLOR_ACCION[a.accion] ?? "neutral"} dot>
                    {a.accion}
                  </Badge>
                  <span className="text-xs text-ink-2">
                    {ETIQUETA_ENTIDAD[a.entidad] ?? a.entidad}
                  </span>
                </div>
                <span className="text-[11px] text-ink-2">
                  {fechaLarga(a.fecha)}
                </span>
              </div>
              <p className="text-xs text-ink">
                {a.adminNombre}
                {a.detalles ? ` — ${a.detalles}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

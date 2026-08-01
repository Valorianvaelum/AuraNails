import { useEffect, useState } from "react";
import { Link, Route, Routes, useSearchParams } from "react-router-dom";

import { listarTurnos } from "../api/turnos.js";
import AppHeader from "../components/AppHeader.jsx";
import TurnoDetailPage from "./TurnoDetailPage.jsx";
import TurnoFormPage from "./TurnoFormPage.jsx";
import TurnoReprogramarPage from "./TurnoReprogramarPage.jsx";

const hoy = () => new Date().toLocaleDateString("en-CA");
const hora = (value) => new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
const fechaLegible = (value) => new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00`));
const dinero = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
const claseEstado = (estado) => ({
  pendiente: "ui-badge ui-badge-pending",
  confirmado: "ui-badge ui-badge-confirmed",
  reprogramado: "ui-badge ui-badge-rescheduled",
  realizado: "ui-badge ui-badge-success",
  cancelado: "ui-badge ui-badge-neutral",
  no_vino: "ui-badge ui-badge-no-show",
}[estado] || "ui-badge ui-badge-neutral");

function ListaTurnos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [fecha, setFecha] = useState(searchParams.get("fecha") || "");
  const [estado, setEstado] = useState(searchParams.get("estado") || "");
  const [busqueda, setBusqueda] = useState(searchParams.get("search") || "");
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const tieneFiltros = Boolean(fecha || estado || busqueda.trim());

  useEffect(() => {
    const params = {};
    if (fecha) params.fecha = fecha;
    if (estado) params.estado = estado;
    if (busqueda.trim()) params.search = busqueda.trim();
    setSearchParams(params, { replace: true });
  }, [busqueda, estado, fecha, setSearchParams]);

  useEffect(() => {
    let vigente = true;
    const parametros = {};
    if (fecha) parametros.fecha = fecha;
    if (estado) parametros.estado = estado;
    if (busqueda.trim()) parametros.search = busqueda.trim();

    setCargando(true);
    setError("");
    listarTurnos(parametros)
      .then((data) => {
        if (vigente) setTurnos(data);
      })
      .catch(() => {
        if (vigente) {
          setTurnos([]);
          setError("No pudimos cargar tus turnos. Intentá nuevamente.");
        }
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [busqueda, estado, fecha]);

  const moverDia = (cantidad) => {
    const base = fecha || hoy();
    const proximaFecha = new Date(`${base}T12:00:00`);
    proximaFecha.setDate(proximaFecha.getDate() + cantidad);
    setFecha(proximaFecha.toLocaleDateString("en-CA"));
  };

  const limpiarFiltros = () => {
    setFecha("");
    setEstado("");
    setBusqueda("");
  };

  return (
    <main className="min-h-screen bg-[#fff4f7] text-[#3d2f32]">
      <AppHeader />
      <section className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Consulta e historial</p>
            <h1 className="mt-2 text-3xl font-semibold">Todos los turnos</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Buscá turnos por fecha, estado o clienta. Para organizar visualmente el día o la semana, usá la Agenda.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="ui-button ui-button-secondary min-h-11" to="/agenda">Abrir agenda</Link>
            <Link className="ui-button ui-button-primary min-h-11" to="nuevo">Nuevo turno</Link>
          </div>
        </div>

        <section className="ui-section mt-6" aria-label="Filtros de turnos">
          <div className="flex flex-wrap items-center gap-2">
            <button className="ui-button ui-button-secondary min-h-11" type="button" onClick={() => moverDia(-1)}>Día anterior</button>
            <button className="ui-button ui-button-secondary min-h-11" type="button" onClick={() => setFecha(hoy())}>Hoy</button>
            <button className="ui-button ui-button-secondary min-h-11" type="button" onClick={() => moverDia(1)}>Día siguiente</button>
            {tieneFiltros && <button className="ui-button ui-button-ghost min-h-11" type="button" onClick={limpiarFiltros}>Limpiar filtros</button>}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="grid gap-1 text-sm font-medium text-foreground">
              Fecha
              <input type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-foreground">
              Estado
              <select value={estado} onChange={(event) => setEstado(event.target.value)}>
                <option value="">Todos</option>
                <option value="pendiente">Pendientes</option>
                <option value="confirmado">Confirmados</option>
                <option value="reprogramado">Reprogramados</option>
                <option value="cancelado">Cancelados</option>
                <option value="realizado">Realizados</option>
                <option value="no_vino">No vinieron</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-foreground">
              Buscar clienta
              <input
                placeholder="Nombre o teléfono"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
              />
            </label>
          </div>
        </section>

        {fecha && <p className="mt-5 text-sm font-medium capitalize text-muted-foreground">Mostrando turnos del {fechaLegible(fecha)}</p>}
        {cargando && <p className="mt-5 text-muted-foreground">Cargando turnos...</p>}
        {error && <p className="mt-5 rounded-lg bg-[var(--color-danger-soft)] px-4 py-3 text-destructive">{error}</p>}
        {!cargando && !error && (
          <div className="mt-5 grid gap-3">
            {turnos.map((turno) => (
              <article className="ui-card" key={turno.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{hora(turno.inicio)} – {hora(turno.fin)}</p>
                    <h2 className="mt-1 text-lg font-semibold">{turno.clienta.nombre_completo}</h2>
                  </div>
                  <span className={claseEstado(turno.estado)}>{turno.estado_display}</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{turno.servicios.map((servicio) => servicio.nombre).join(", ")}</p>
                <p className="mt-2 text-sm">{turno.duracion_legible} · <strong>{dinero(turno.precio_estimado)}</strong></p>
                <div className="mt-4">
                  <Link className="ui-button ui-button-primary min-h-11" to={`${turno.id}`}>Ver turno</Link>
                </div>
              </article>
            ))}
            {!turnos.length && (
              <div className="ui-card-muted text-center">
                <p>{tieneFiltros ? "No encontramos turnos con los filtros seleccionados." : "Todavía no tenés turnos registrados."}</p>
                {!tieneFiltros && <Link className="mt-3 ui-button ui-button-secondary min-h-11" to="nuevo">Crear primer turno</Link>}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default function TurnosPage() {
  return (
    <Routes>
      <Route index element={<ListaTurnos />} />
      <Route path="nuevo" element={<TurnoFormPage />} />
      <Route path=":id/editar" element={<TurnoFormPage />} />
      <Route path=":id/reprogramar" element={<TurnoReprogramarPage />} />
      <Route path=":id" element={<TurnoDetailPage />} />
    </Routes>
  );
}

import { useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";

import { listarTurnos } from "../api/turnos.js";
import AppHeader from "../components/AppHeader.jsx";
import TurnoDetailPage from "./TurnoDetailPage.jsx";
import TurnoFormPage from "./TurnoFormPage.jsx";
import TurnoReprogramarPage from "./TurnoReprogramarPage.jsx";

const hoy = () => new Date().toLocaleDateString("en-CA");
const hora = (value) => new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
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
  const [fecha, setFecha] = useState("");
  const [estado, setEstado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const tieneFiltros = Boolean(fecha || estado || busqueda.trim());

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
      <section className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold">Mis turnos</h1>
          <Link className="ui-button ui-button-primary" to="nuevo">
            Nuevo turno
          </Link>
        </div>

        <div className="ui-section mt-5 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-wrap items-end gap-2">
            <button type="button" onClick={() => moverDia(-1)}>Día anterior</button>
            <button type="button" onClick={() => setFecha(hoy())}>Hoy</button>
            <button type="button" onClick={() => moverDia(1)}>Día siguiente</button>
            {tieneFiltros && <button type="button" onClick={limpiarFiltros}>Limpiar filtros</button>}
          </div>
          <label className="grid gap-1 text-sm font-medium text-[#4e3b3f]">
            Fecha
            <input type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[#4e3b3f]">
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
          <label className="grid gap-1 text-sm font-medium text-[#4e3b3f]">
            Buscar clienta
            <input
              placeholder="Nombre o teléfono"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </label>
        </div>

        {cargando && <p className="mt-5">Cargando turnos...</p>}
        {error && <p className="mt-5 text-[#8b3f4c]">{error}</p>}
        {!cargando && !error && (
          <div className="mt-5 grid gap-3">
            {turnos.map((turno) => (
              <Link className="ui-card" to={`${turno.id}`} key={turno.id}>
                <div className="flex flex-wrap items-start justify-between gap-3"><b>{hora(turno.inicio)} – {hora(turno.fin)} · {turno.clienta.nombre_completo}</b><span className={claseEstado(turno.estado)}>{turno.estado_display}</span></div>
                <p className="mt-2 text-sm text-[#6f5b60]">{turno.servicios.map((servicio) => servicio.nombre).join(", ")}</p>
                <p className="mt-2 text-sm">{turno.duracion_legible} · <strong>{dinero(turno.precio_estimado)}</strong></p>
              </Link>
            ))}
            {!turnos.length && <div className="ui-card-muted text-center"><p>{tieneFiltros ? "No encontramos turnos con los filtros seleccionados." : "Todavía no tenés turnos registrados."}</p>{!tieneFiltros && <Link className="mt-3 ui-button ui-button-secondary" to="nuevo">Crear primer turno</Link>}</div>}
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

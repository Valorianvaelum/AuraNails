import { useEffect, useState } from "react";
import { Link, Route, Routes, useSearchParams } from "react-router-dom";

import { listarTurnos } from "../api/turnos.js";
import TurnoDetailPage from "./TurnoDetailPage.jsx";
import TurnoFormPage from "./TurnoFormPage.jsx";
import TurnoReprogramarPage from "./TurnoReprogramarPage.jsx";
import { AuraEmptyState, AuraHero, AuraPage, AuraPanel, AuraPanelHeader, AuraRecordCard } from "../components/visual";

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
    <AuraPage width="content">
      <div className="grid gap-5">
        <AuraHero
          eyebrow="Consulta e historial"
          title="Todos los turnos"
          description="Buscá turnos por fecha, estado o clienta. Para organizar visualmente el día o la semana, usá la Agenda."
          actions={(
            <>
              <Link className="aura-button aura-button-secondary" to="/agenda">Abrir agenda</Link>
              <Link className="aura-button aura-button-primary" to="nuevo">Nuevo turno</Link>
            </>
          )}
        />

        <AuraPanel aria-label="Filtros de turnos">
          <AuraPanelHeader title="Filtrar turnos" description="Navegá por fecha o combiná estado y búsqueda de clienta." />
          <div className="flex flex-wrap items-center gap-2">
            <button className="aura-button aura-button-secondary" type="button" onClick={() => moverDia(-1)}>Día anterior</button>
            <button className="aura-button aura-button-secondary" type="button" onClick={() => setFecha(hoy())}>Hoy</button>
            <button className="aura-button aura-button-secondary" type="button" onClick={() => moverDia(1)}>Día siguiente</button>
            {tieneFiltros && <button className="aura-button aura-button-ghost" type="button" onClick={limpiarFiltros}>Limpiar filtros</button>}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="aura-field">
              <label className="aura-field-label mb-2 block" htmlFor="turnos-fecha">Fecha</label>
              <input id="turnos-fecha" className="aura-control" type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} />
            </div>
            <div className="aura-field">
              <label className="aura-field-label mb-2 block" htmlFor="turnos-estado">Estado</label>
              <select id="turnos-estado" className="aura-control" value={estado} onChange={(event) => setEstado(event.target.value)}>
                <option value="">Todos</option>
                <option value="pendiente">Pendientes</option>
                <option value="confirmado">Confirmados</option>
                <option value="reprogramado">Reprogramados</option>
                <option value="cancelado">Cancelados</option>
                <option value="realizado">Realizados</option>
                <option value="no_vino">No vinieron</option>
              </select>
            </div>
            <div className="aura-field">
              <label className="aura-field-label mb-2 block" htmlFor="turnos-busqueda">Buscar clienta</label>
              <input id="turnos-busqueda" className="aura-control" placeholder="Nombre o teléfono" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} />
            </div>
          </div>
        </AuraPanel>

        <AuraPanel>
          <AuraPanelHeader
            title="Resultados"
            description={fecha ? `Mostrando turnos del ${fechaLegible(fecha)}` : "Listado completo según los filtros seleccionados."}
          />
          {cargando && <p className="aura-form-status">Cargando turnos...</p>}
          {error && <p className="rounded-lg bg-[var(--color-danger-soft)] px-4 py-3 text-destructive">{error}</p>}
          {!cargando && !error && (
            <div className="grid gap-3">
              {turnos.map((turno) => (
                <AuraRecordCard as="article" className="p-5" key={turno.id}>
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
                    <Link className="aura-button aura-button-primary" to={`${turno.id}`}>Ver turno</Link>
                  </div>
                </AuraRecordCard>
              ))}
              {!turnos.length && (
                <AuraEmptyState
                  title={tieneFiltros ? "No encontramos turnos con los filtros seleccionados." : "Todavía no tenés turnos registrados."}
                  action={!tieneFiltros ? <Link className="aura-button aura-button-secondary" to="nuevo">Crear primer turno</Link> : null}
                />
              )}
            </div>
          )}
        </AuraPanel>
      </div>
    </AuraPage>
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

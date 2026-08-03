import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { listarCobros } from "../api/cobros.js";
import { FinancialAmount, FinancialStatus } from "../components/Financial.jsx";
import { AuraEmptyState, AuraHero, AuraPage, AuraPanel, AuraPanelHeader, AuraRecordCard } from "../components/visual";

const dinero = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(value);
const fechaHora = (value) => new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

function mensajeDeError(error, predeterminado) {
  const data = error.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  return predeterminado;
}

export default function CobrosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [fecha, setFecha] = useState(searchParams.get("fecha") || "");
  const [metodoPago, setMetodoPago] = useState(searchParams.get("metodo_pago") || "");
  const [estado, setEstado] = useState(searchParams.get("estado") || "");
  const [busqueda, setBusqueda] = useState(searchParams.get("search") || "");
  const [busquedaAplicada, setBusquedaAplicada] = useState(searchParams.get("search") || "");
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(() => !window.matchMedia("(max-width: 767px)").matches);
  const [cobros, setCobros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const tieneFiltros = Boolean(fecha || metodoPago || estado || busqueda.trim());
  const totalActivo = useMemo(
    () => cobros.reduce((total, cobro) => cobro.estado === "anulado" ? total : total + Number(cobro.importe || 0), 0),
    [cobros],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setBusquedaAplicada(busqueda.trim()), 300);
    return () => window.clearTimeout(timeoutId);
  }, [busqueda]);

  useEffect(() => {
    const params = {};
    if (fecha) params.fecha = fecha;
    if (metodoPago) params.metodo_pago = metodoPago;
    if (estado) params.estado = estado;
    if (busquedaAplicada) params.search = busquedaAplicada;
    setSearchParams(params, { replace: true });
  }, [busquedaAplicada, estado, fecha, metodoPago, setSearchParams]);

  const cargarCobros = useCallback(async () => {
    const params = {};
    if (fecha) params.fecha = fecha;
    if (metodoPago) params.metodo_pago = metodoPago;
    if (estado) params.estado = estado;
    if (busquedaAplicada) params.search = busquedaAplicada;

    setCargando(true);
    setError("");
    try {
      setCobros(await listarCobros(params));
    } catch (requestError) {
      setCobros([]);
      setError(mensajeDeError(requestError, "No pudimos cargar tus cobros. Intentá nuevamente."));
    } finally {
      setCargando(false);
    }
  }, [busquedaAplicada, estado, fecha, metodoPago]);

  useEffect(() => { cargarCobros(); }, [cargarCobros]);

  const limpiarFiltros = () => {
    setFecha("");
    setMetodoPago("");
    setEstado("");
    setBusqueda("");
    setBusquedaAplicada("");
  };

  return (
    <AuraPage width="wide" className="finance-page">
      <div className="finance-stack">
        <AuraHero
          eyebrow="Registro financiero"
          title="Cobros"
          description="Consultá los cobros registrados desde turnos realizados y accedé a cada comprobante."
          actions={<Link className="aura-button aura-button-secondary" to="/caja">Ir a Caja</Link>}
        >
          <div className="finance-hero-summary" aria-label="Resumen de cobros visibles">
            <div><span>Resultados visibles</span><strong>{cobros.length}</strong></div>
            <div><span>Total activo visible</span><strong>{dinero(totalActivo)}</strong></div>
          </div>
        </AuraHero>

        <AuraPanel className="finance-filter-panel" aria-label="Filtros de cobros">
          <AuraPanelHeader
            title="Buscar y filtrar"
            description="Combiná clienta, fecha, método de pago y estado."
            action={(
              <button
                aria-expanded={filtrosAbiertos}
                className="aura-button aura-button-secondary finance-filter-toggle"
                type="button"
                onClick={() => setFiltrosAbiertos((current) => !current)}
              >
                {filtrosAbiertos ? "Ocultar filtros" : "Filtros"}
              </button>
            )}
          />
          <div className={`finance-filter-body ${filtrosAbiertos ? "is-open" : ""}`}>
            <div className="finance-filter-grid">
              <div className="aura-field">
                <label className="aura-field-label" htmlFor="cobros-busqueda">Buscar clienta</label>
                <input id="cobros-busqueda" className="aura-control" placeholder="Nombre de clienta" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} />
              </div>
              <div className="aura-field">
                <label className="aura-field-label" htmlFor="cobros-fecha">Fecha de cobro</label>
                <input id="cobros-fecha" className="aura-control" type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} />
              </div>
              <div className="aura-field">
                <label className="aura-field-label" htmlFor="cobros-metodo">Método de pago</label>
                <select id="cobros-metodo" className="aura-control" value={metodoPago} onChange={(event) => setMetodoPago(event.target.value)}>
                  <option value="">Todos</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="aura-field">
                <label className="aura-field-label" htmlFor="cobros-estado">Estado</label>
                <select id="cobros-estado" className="aura-control" value={estado} onChange={(event) => setEstado(event.target.value)}>
                  <option value="">Todos</option>
                  <option value="registrado">Registrados</option>
                  <option value="anulado">Anulados</option>
                </select>
              </div>
            </div>
            {tieneFiltros ? <button className="aura-button aura-button-ghost finance-clear-filters" type="button" onClick={limpiarFiltros}>Limpiar filtros</button> : null}
          </div>
        </AuraPanel>

        <AuraPanel className="finance-ledger-panel">
          <AuraPanelHeader
            title="Registro de cobros"
            description={cargando ? "Actualizando resultados…" : `${cobros.length} ${cobros.length === 1 ? "cobro visible" : "cobros visibles"}.`}
          />

          {cargando ? (
            <div className="finance-loading-list" aria-label="Cargando cobros">
              {[0, 1, 2].map((item) => <div className="finance-skeleton" key={item} />)}
            </div>
          ) : null}

          {error ? (
            <div className="finance-error" role="alert">
              <div><strong>No pudimos cargar los cobros.</strong><p>{error}</p></div>
              <button className="aura-button aura-button-secondary" type="button" onClick={cargarCobros}>Reintentar</button>
            </div>
          ) : null}

          {!cargando && !error && cobros.length ? (
            <div className="finance-ledger" role="list">
              {cobros.map((cobro) => (
                <AuraRecordCard as="article" className={`finance-cobro-row ${cobro.estado === "anulado" ? "is-cancelled" : ""}`} key={cobro.id} role="listitem">
                  <div className="finance-cobro-main">
                    <div className="finance-cobro-client">
                      <span className="finance-cobro-kicker">Clienta</span>
                      <h2>{cobro.clienta_nombre_historica}</h2>
                      <p>Turno #{cobro.turno.id} · {fechaHora(cobro.creado_en)}</p>
                    </div>
                    <FinancialAmount amount={cobro.importe} className="finance-cobro-amount" size="md" tone={cobro.estado === "anulado" ? "muted" : "positive"} />
                    <div className="finance-cobro-method">
                      <span>Método</span>
                      <strong>{cobro.metodo_pago_display}</strong>
                      {cobro.detalle_metodo ? <small>{cobro.detalle_metodo}</small> : null}
                    </div>
                    <FinancialStatus label={cobro.estado_display} status={cobro.estado} />
                  </div>
                  <div className="finance-cobro-actions">
                    <Link className="aura-button aura-button-primary" to={`/cobros/${cobro.id}`}>Ver detalle</Link>
                    <Link className="aura-glass-link" to={`/turnos/${cobro.turno.id}`}>Ver turno</Link>
                  </div>
                </AuraRecordCard>
              ))}
            </div>
          ) : null}

          {!cargando && !error && !cobros.length ? (
            <AuraEmptyState
              title={tieneFiltros ? "No encontramos cobros con los filtros seleccionados." : "Todavía no tenés cobros registrados."}
              description={tieneFiltros ? "Probá modificando o limpiando los filtros." : "Los cobros se registran desde un turno marcado como realizado."}
              action={tieneFiltros
                ? <button className="aura-button aura-button-secondary" type="button" onClick={limpiarFiltros}>Limpiar filtros</button>
                : <Link className="aura-button aura-button-secondary" to="/turnos">Ver turnos</Link>}
            />
          ) : null}
        </AuraPanel>
      </div>
    </AuraPage>
  );
}

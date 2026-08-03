import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listarCajas } from "../api/caja.js";
import { dinero, fechaHora } from "../components/CajaResumen.jsx";
import { FinancialStatus } from "../components/Financial.jsx";
import { AuraEmptyState, AuraHero, AuraPage, AuraPanel, AuraPanelHeader, AuraRecordCard } from "../components/visual";

function diferenciaTone(value) {
  const number = Number(value || 0);
  if (number === 0) return "is-balanced";
  return number > 0 ? "is-surplus" : "is-shortage";
}

export default function CajasHistorialPage() {
  const [fecha, setFecha] = useState("");
  const [estado, setEstado] = useState("");
  const [conDiferencia, setConDiferencia] = useState(false);
  const [cajas, setCajas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const tieneFiltros = Boolean(fecha || estado || conDiferencia);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const params = {};
      if (fecha) params.fecha = fecha;
      if (estado) params.estado = estado;
      setCajas(await listarCajas(params));
    } catch {
      setCajas([]);
      setError("No pudimos cargar el historial de cajas. Intentá nuevamente.");
    } finally {
      setCargando(false);
    }
  }, [estado, fecha]);

  useEffect(() => { cargar(); }, [cargar]);

  const visibles = conDiferencia
    ? cajas.filter((caja) => caja.diferencia !== null && Number(caja.diferencia || 0) !== 0)
    : cajas;
  const limpiar = () => { setFecha(""); setEstado(""); setConDiferencia(false); };

  return (
    <AuraPage className="cash-page" width="content">
      <div className="cash-stack">
        <AuraHero
          eyebrow="Control y conciliación"
          title="Historial de cajas"
          description="Consultá aperturas, cierres y diferencias registradas en jornadas anteriores."
          back={<Link className="aura-glass-link" to="/caja">Volver a Caja</Link>}
        />

        <AuraPanel className="cash-filter-panel">
          <AuraPanelHeader title="Filtrar historial" description="Buscá por fecha, estado o jornadas con diferencia." />
          <div className="cash-filter-grid">
            <div className="aura-field">
              <label className="aura-field-label" htmlFor="caja-historial-fecha">Fecha</label>
              <input id="caja-historial-fecha" className="aura-control" type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} />
            </div>
            <div className="aura-field">
              <label className="aura-field-label" htmlFor="caja-historial-estado">Estado</label>
              <select id="caja-historial-estado" className="aura-control" value={estado} onChange={(event) => setEstado(event.target.value)}>
                <option value="">Todos</option>
                <option value="abierta">Abiertas</option>
                <option value="cerrada">Cerradas</option>
              </select>
            </div>
            <label className="cash-checkbox-card">
              <input checked={conDiferencia} type="checkbox" onChange={(event) => setConDiferencia(event.target.checked)} />
              <span><strong>Con diferencia</strong><small>Mostrar solo cierres con sobrante o faltante.</small></span>
            </label>
          </div>
          {tieneFiltros ? <button className="aura-button aura-button-ghost cash-clear-filters" type="button" onClick={limpiar}>Limpiar filtros</button> : null}
        </AuraPanel>

        <AuraPanel>
          <AuraPanelHeader title="Jornadas registradas" description={`${visibles.length} ${visibles.length === 1 ? "caja visible" : "cajas visibles"}.`} />
          {cargando ? <div className="cash-loading"><span /><span /><span /></div> : null}
          {error ? (
            <div className="cash-error">
              <div><strong>No pudimos cargar el historial.</strong><p>{error}</p></div>
              <button className="aura-button aura-button-secondary" type="button" onClick={cargar}>Reintentar</button>
            </div>
          ) : null}
          {!cargando && !error && visibles.length ? (
            <div className="cash-history-list">
              {visibles.map((caja) => (
                <AuraRecordCard className="cash-history-card" key={caja.id}>
                  <div className="cash-history-heading">
                    <div>
                      <p className="cash-kicker">Caja #{caja.id}</p>
                      <h2>{fechaHora(caja.abierta_en)}</h2>
                      <p>Cierre: {fechaHora(caja.cerrada_en)}</p>
                    </div>
                    <FinancialStatus label={caja.estado_display} status={caja.estado} />
                  </div>
                  <div className="cash-history-metrics">
                    <div><span>Inicial</span><strong>{dinero(caja.saldo_inicial)}</strong></div>
                    <div><span>Esperado</span><strong>{dinero(caja.resumen?.saldo_teorico ?? caja.saldo_teorico_cierre)}</strong></div>
                    <div><span>Contado</span><strong>{caja.saldo_contado === null ? "Pendiente" : dinero(caja.saldo_contado)}</strong></div>
                    <div className={caja.diferencia === null ? "" : diferenciaTone(caja.diferencia)}><span>Diferencia</span><strong>{caja.diferencia === null ? "Pendiente" : dinero(caja.diferencia)}</strong></div>
                  </div>
                  <div className="cash-history-footer">
                    <Link className="aura-button aura-button-secondary" to={`/caja/${caja.id}`}>Ver detalle</Link>
                  </div>
                </AuraRecordCard>
              ))}
            </div>
          ) : null}
          {!cargando && !error && !visibles.length ? (
            <AuraEmptyState
              title={tieneFiltros ? "No encontramos cajas con estos filtros." : "Todavía no tenés cajas registradas."}
              description={tieneFiltros ? "Probá modificando o limpiando los filtros." : "Las jornadas aparecerán aquí después de abrir una caja."}
              action={tieneFiltros ? <button className="aura-button aura-button-secondary" type="button" onClick={limpiar}>Limpiar filtros</button> : null}
            />
          ) : null}
        </AuraPanel>
      </div>
    </AuraPage>
  );
}

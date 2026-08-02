import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { obtenerCaja } from "../api/caja.js";
import CajaMovimientos from "../components/CajaMovimientos.jsx";
import CajaResumen, { dinero, fechaHora } from "../components/CajaResumen.jsx";
import { FinancialAmount, FinancialStatus } from "../components/Financial.jsx";
import { AuraHero, AuraPage, AuraPanel, AuraPanelHeader, AuraRecordCard } from "../components/visual";

function diferenciaClase(value) {
  const number = Number(value || 0);
  if (number === 0) return "is-balanced";
  return number > 0 ? "is-surplus" : "is-shortage";
}

export default function CajaDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [caja, setCaja] = useState(null);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setError("");
    try {
      setCaja(await obtenerCaja(id));
    } catch (requestError) {
      setError(requestError.response?.status === 404 ? "No encontramos esta caja." : "No pudimos cargar esta caja.");
    }
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  if (!caja) {
    return (
      <AuraPage className="cash-page" width="content">
        <AuraPanel>
          {error ? (
            <div className="cash-error">
              <div><strong>No pudimos cargar esta caja.</strong><p>{error}</p></div>
              <Link className="aura-button aura-button-secondary" to="/caja/historial">Volver al historial</Link>
            </div>
          ) : <p className="aura-form-status">Cargando caja...</p>}
        </AuraPanel>
      </AuraPage>
    );
  }

  const cerrada = caja.estado === "cerrada";
  const diferencia = Number(caja.diferencia || 0);

  return (
    <AuraPage className="cash-page" width="content">
      <div className="cash-stack">
        <AuraHero
          eyebrow="Detalle de jornada"
          title={`Caja #${caja.id}`}
          description={`Apertura: ${fechaHora(caja.abierta_en)}${cerrada ? ` · Cierre: ${fechaHora(caja.cerrada_en)}` : " · Jornada en curso"}`}
          back={<Link className="aura-glass-link" to="/caja/historial">Volver al historial</Link>}
          actions={!cerrada ? <Link className="aura-button aura-button-primary" to="/caja">Ir a acciones de caja</Link> : null}
        />

        {location.state?.message ? <p className="cash-feedback is-success" role="status">{location.state.message}</p> : null}

        <AuraPanel>
          <AuraPanelHeader
            title="Apertura y cierre"
            description="Responsables, horarios y observaciones registradas."
            action={<FinancialStatus label={caja.estado_display} status={caja.estado} />}
          />
          <div className="cash-detail-grid">
            <AuraRecordCard className="cash-detail-card">
              <p className="cash-kicker">Apertura</p>
              <h3>{fechaHora(caja.abierta_en)}</h3>
              <FinancialAmount amount={caja.saldo_inicial} label="Saldo inicial" size="md" />
              {caja.observacion_apertura ? <p className="cash-detail-note">{caja.observacion_apertura}</p> : null}
            </AuraRecordCard>
            <AuraRecordCard className="cash-detail-card">
              <p className="cash-kicker">Cierre</p>
              <h3>{fechaHora(caja.cerrada_en)}</h3>
              {caja.cerrada_por ? <p>Responsable: {caja.cerrada_por.nombre}</p> : <p>Sin responsable registrado.</p>}
              {caja.observacion_cierre ? <p className="cash-detail-note">{caja.observacion_cierre}</p> : null}
            </AuraRecordCard>
          </div>
        </AuraPanel>

        <AuraPanel>
          <AuraPanelHeader title="Resumen financiero" description="Composición del saldo esperado de esta jornada." />
          <CajaResumen caja={caja} compacto={cerrada} />
        </AuraPanel>

        {cerrada ? (
          <AuraPanel className="cash-reconciliation-panel">
            <AuraPanelHeader title="Conciliación" description="Comparación entre el saldo esperado y el efectivo contado." />
            <div className="cash-reconciliation-grid">
              <FinancialAmount amount={caja.resumen?.saldo_teorico ?? caja.saldo_teorico_cierre} label="Saldo esperado" size="lg" />
              <FinancialAmount amount={caja.saldo_contado} label="Efectivo contado" size="lg" />
              <div className={`cash-difference-card ${diferenciaClase(caja.diferencia)}`}>
                <span>Diferencia</span>
                <strong>{dinero(caja.diferencia)}</strong>
                <small>{diferencia === 0 ? "Caja conciliada" : diferencia > 0 ? "Sobrante" : "Faltante"}</small>
              </div>
            </div>
          </AuraPanel>
        ) : (
          <AuraPanel className="cash-open-notice">
            <div>
              <p className="cash-kicker">Caja abierta</p>
              <h2>Esta jornada todavía admite operaciones.</h2>
              <p>Usá la pantalla principal para registrar movimientos o cerrar la caja.</p>
            </div>
            <Link className="aura-button aura-button-primary" to="/caja">Ir a Caja</Link>
          </AuraPanel>
        )}

        <CajaMovimientos caja={caja} />
      </div>
    </AuraPage>
  );
}

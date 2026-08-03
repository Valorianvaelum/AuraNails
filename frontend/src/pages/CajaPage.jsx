import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { obtenerCaja, obtenerCajaAbierta } from "../api/caja.js";
import CajaDialog from "../components/CajaDialog.jsx";
import CajaMovimientos from "../components/CajaMovimientos.jsx";
import CajaResumen, { dinero, fechaHora } from "../components/CajaResumen.jsx";
import { FinancialAmount, FinancialStatus } from "../components/Financial.jsx";
import { AuraEmptyState, AuraHero, AuraPage, AuraPanel, AuraPanelHeader } from "../components/visual";

function mensajeDeError(error) {
  return error.response?.status === 404
    ? "No encontramos esta caja."
    : "No pudimos cargar tu caja. Intentá nuevamente.";
}

export default function CajaPage() {
  const navigate = useNavigate();
  const [caja, setCaja] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [dialogo, setDialogo] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const cargarCaja = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const abierta = await obtenerCajaAbierta();
      setCaja(abierta ? await obtenerCaja(abierta.id) : null);
    } catch (requestError) {
      setCaja(null);
      setError(mensajeDeError(requestError));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarCaja(); }, [cargarCaja]);

  const operacionExitosa = async (texto) => {
    const tipo = dialogo?.tipo;
    setDialogo(null);
    setMensaje(texto);
    if (tipo === "cerrar" && caja) {
      navigate(`/caja/${caja.id}`, { state: { message: texto } });
      return;
    }
    await cargarCaja();
  };

  return (
    <AuraPage className="cash-page" width="content">
      <div className="cash-stack">
        <AuraHero
          eyebrow="Control de jornada"
          title="Caja"
          description="Controlá el efectivo, registrá movimientos y conciliá la jornada desde un único lugar."
          actions={<Link className="aura-button aura-button-secondary" to="/caja/historial">Ver historial</Link>}
        />

        {mensaje ? <p className="cash-feedback is-success" role="status">{mensaje}</p> : null}

        {cargando ? (
          <AuraPanel>
            <div className="cash-loading" aria-label="Cargando caja">
              <span />
              <span />
              <span />
            </div>
          </AuraPanel>
        ) : null}

        {error ? (
          <AuraPanel>
            <div className="cash-error">
              <div>
                <strong>No pudimos cargar la caja.</strong>
                <p>{error}</p>
              </div>
              <button className="aura-button aura-button-secondary" type="button" onClick={cargarCaja}>Reintentar</button>
            </div>
          </AuraPanel>
        ) : null}

        {!cargando && !error && !caja ? (
          <AuraPanel className="cash-closed-panel">
            <AuraEmptyState
              title="Caja cerrada"
              description="Abrila para registrar cobros y movimientos de efectivo durante la jornada."
              action={(
                <div className="cash-empty-actions">
                  <button className="aura-button aura-button-primary" type="button" onClick={() => setDialogo({ tipo: "abrir" })}>Abrir caja</button>
                  <Link className="aura-button aura-button-secondary" to="/caja/historial">Ver historial</Link>
                </div>
              )}
            >
              <p className="cash-closed-note">No se pueden registrar cobros mientras la caja permanezca cerrada.</p>
            </AuraEmptyState>
          </AuraPanel>
        ) : null}

        {!cargando && !error && caja ? (
          <>
            <AuraPanel className="cash-open-panel">
              <div className="cash-open-header">
                <div>
                  <FinancialStatus label="Caja abierta" status="abierta" />
                  <h2>Jornada en curso</h2>
                  <p>Abierta el {fechaHora(caja.abierta_en)}</p>
                </div>
                <div className="cash-open-header-actions">
                  <FinancialAmount amount={caja.saldo_inicial} label="Saldo inicial" size="md" />
                  <Link className="aura-button aura-button-secondary" to={`/caja/${caja.id}`}>Ver detalle</Link>
                </div>
              </div>
              <CajaResumen caja={caja} />
            </AuraPanel>

            <AuraPanel className="cash-operations-panel">
              <AuraPanelHeader
                title="Operaciones de efectivo"
                description="Registrá entradas y salidas que no corresponden a cobros de servicios."
              />
              <div className="cash-operation-grid">
                <button className="cash-operation-card is-expense" type="button" onClick={() => setDialogo({ tipo: "gasto" })}>
                  <span className="cash-operation-symbol">−</span>
                  <span><strong>Registrar gasto</strong><small>Compra o egreso operativo.</small></span>
                </button>
                <button className="cash-operation-card is-contribution" type="button" onClick={() => setDialogo({ tipo: "aporte" })}>
                  <span className="cash-operation-symbol">+</span>
                  <span><strong>Registrar aporte</strong><small>Agregar efectivo sin registrar un cobro.</small></span>
                </button>
                <button className="cash-operation-card is-withdrawal" type="button" onClick={() => setDialogo({ tipo: "retiro" })}>
                  <span className="cash-operation-symbol">↗</span>
                  <span><strong>Registrar retiro</strong><small>Quitar efectivo sin registrar un gasto.</small></span>
                </button>
              </div>
            </AuraPanel>

            <AuraPanel className="cash-close-panel">
              <div className="cash-close-copy">
                <p className="cash-kicker">Cierre de jornada</p>
                <h2>Conciliá el efectivo antes de cerrar</h2>
                <p>El saldo esperado es {dinero(caja.resumen?.saldo_teorico)}. Contá el dinero físico y registrá cualquier diferencia.</p>
              </div>
              <button className="cash-close-button" type="button" onClick={() => setDialogo({ tipo: "cerrar" })}>Cerrar caja</button>
            </AuraPanel>

            <CajaMovimientos
              caja={caja}
              onAnularGasto={(registro) => setDialogo({ tipo: "anularGasto", registro })}
              onAnularMovimiento={(registro) => setDialogo({ tipo: "anularMovimiento", registro })}
            />
          </>
        ) : null}
      </div>

      {dialogo ? (
        <CajaDialog
          tipo={dialogo.tipo}
          caja={caja}
          registro={dialogo.registro}
          onClose={() => setDialogo(null)}
          onSuccess={operacionExitosa}
        />
      ) : null}
    </AuraPage>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { anularCobro, obtenerCobro } from "../api/cobros.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import FieldError from "../components/FieldError.jsx";
import { FinancialAmount, FinancialStatus } from "../components/Financial.jsx";
import { AuraHero, AuraPage, AuraPanel, AuraPanelHeader, AuraRecordCard } from "../components/visual";

const dinero = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(value);
const fechaHora = (value) => new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));

function mensajeDeError(error, predeterminado) {
  const data = error.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  for (const value of Object.values(data || {})) if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return predeterminado;
}

export default function CobroDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const motivoRef = useRef(null);
  const [cobro, setCobro] = useState(null);
  const [error, setError] = useState("");
  const [errorMotivo, setErrorMotivo] = useState("");
  const [mostrarAnulacion, setMostrarAnulacion] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [anulando, setAnulando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(location.state?.message || "");
  const [confirmacion, setConfirmacion] = useState(null);

  const cargarCobro = useCallback(async () => {
    setError("");
    try { setCobro(await obtenerCobro(id)); }
    catch (requestError) { setError(requestError.response?.status === 404 ? "No encontramos este cobro." : "No pudimos cargar el cobro."); }
  }, [id]);

  useEffect(() => { cargarCobro(); }, [cargarCobro]);

  const validarMotivo = () => {
    const normalizado = motivo.trim();
    if (!normalizado) return "Ingresá el motivo de anulación.";
    if (normalizado.length < 5) return "El motivo debe tener al menos 5 caracteres.";
    if (normalizado.length > 250) return "El motivo no puede superar los 250 caracteres.";
    return "";
  };

  const solicitarAnulacion = (event) => {
    event.preventDefault();
    setError("");
    const validacion = validarMotivo();
    setErrorMotivo(validacion);
    if (validacion) { motivoRef.current?.focus(); return; }
    setConfirmacion("anular");
  };

  const ejecutarAnulacion = async () => {
    if (anulando) return;
    setAnulando(true);
    setError("");
    try {
      setCobro(await anularCobro(id, { motivo: motivo.trim() }));
      setMostrarAnulacion(false);
      setMotivo("");
      setErrorMotivo("");
      setMensajeExito("Cobro anulado correctamente.");
    } catch (requestError) {
      setError(mensajeDeError(requestError, "No pudimos anular el cobro. Intentá nuevamente."));
    } finally {
      setAnulando(false);
    }
  };

  const cancelarFormulario = () => {
    if (motivo.trim()) { setConfirmacion("descartar"); return; }
    setMostrarAnulacion(false);
    setErrorMotivo("");
  };

  if (!cobro) {
    return (
      <AuraPage width="form" className="finance-page">
        <AuraPanel>
          <div className={error ? "finance-error" : "aura-form-status"}>
            <div><strong>{error ? "No se pudo abrir el comprobante." : "Cargando cobro…"}</strong>{error ? <p>{error}</p> : null}</div>
            {error ? <Link className="aura-button aura-button-secondary" to="/cobros">Volver a Cobros</Link> : null}
          </div>
        </AuraPanel>
      </AuraPage>
    );
  }

  return (
    <AuraPage width="form" className="finance-page">
      <div className="finance-stack">
        <AuraHero
          eyebrow={`Comprobante #${cobro.id}`}
          title={cobro.estado === "anulado" ? "Cobro anulado" : "Cobro registrado"}
          description={`${cobro.metodo_pago_display}${cobro.detalle_metodo ? ` · ${cobro.detalle_metodo}` : ""} · ${fechaHora(cobro.creado_en)}`}
          back={<Link className="aura-glass-link" to="/cobros">Volver a Cobros</Link>}
          actions={<FinancialStatus label={cobro.estado_display} status={cobro.estado} />}
        >
          <FinancialAmount amount={cobro.importe} className="finance-receipt-hero-amount" size="xl" tone={cobro.estado === "anulado" ? "muted" : "positive"} />
        </AuraHero>

        {mensajeExito ? <p className="finance-success-message" role="status">{mensajeExito}</p> : null}

        <AuraPanel>
          <AuraPanelHeader title="Información del cobro" description="Importe, método y turno que originó el comprobante." />
          <div className="finance-receipt-grid">
            <AuraRecordCard className="finance-receipt-primary">
              <span className="finance-record-label">Clienta</span>
              <h2>{cobro.clienta_nombre_historica}</h2>
              <FinancialAmount amount={cobro.importe} label="Importe" size="lg" tone={cobro.estado === "anulado" ? "muted" : "positive"} />
            </AuraRecordCard>
            <AuraRecordCard className="finance-receipt-meta">
              <div><span>Método de pago</span><strong>{cobro.metodo_pago_display}</strong>{cobro.detalle_metodo ? <small>{cobro.detalle_metodo}</small> : null}</div>
              <div><span>Registrado</span><strong>{fechaHora(cobro.creado_en)}</strong></div>
            </AuraRecordCard>
          </div>

          <AuraRecordCard className="finance-related-turn">
            <div>
              <span className="finance-record-label">Turno relacionado</span>
              <h3>{fechaHora(cobro.turno.inicio)}</h3>
              <p>{cobro.servicios.map((servicio) => servicio.nombre).join(", ")} · {cobro.turno.duracion_total_minutos} min</p>
            </div>
            <Link className="aura-button aura-button-secondary" to={`/turnos/${cobro.turno.id}`}>Ver turno</Link>
          </AuraRecordCard>

          {cobro.estado === "anulado" ? (
            <div className="finance-cancelled-note">
              <FinancialStatus label="Anulado" status="anulado" />
              <div><strong>Motivo de anulación</strong><p>{cobro.motivo_anulacion}</p><small>{fechaHora(cobro.anulado_en)}</small></div>
            </div>
          ) : null}

          {error ? <p className="finance-inline-error" role="alert">{error}</p> : null}
        </AuraPanel>

        <AuraPanel className="finance-actions-panel">
          <AuraPanelHeader title="Acciones" description="Consultá el turno relacionado o anulá el comprobante cuando corresponda." />
          {!mostrarAnulacion ? (
            <div className="finance-standard-actions">
              <Link className="aura-button aura-button-secondary" to={`/turnos/${cobro.turno.id}`}>Ver turno relacionado</Link>
              {cobro.puede_anularse ? <button className="finance-destructive-trigger" type="button" onClick={() => { setMostrarAnulacion(true); setError(""); }}>Anular cobro</button> : null}
            </div>
          ) : null}

          {cobro.puede_anularse && mostrarAnulacion ? (
            <form className="finance-irreversible" onSubmit={solicitarAnulacion} noValidate>
              <div className="finance-irreversible-heading">
                <span>Acción irreversible</span>
                <h3>Anular este cobro</h3>
                <p>El turno volverá a quedar disponible para registrar otro cobro según las reglas actuales.</p>
              </div>
              <div className="aura-field">
                <label className="aura-field-label" htmlFor="motivo-anulacion">Motivo de anulación</label>
                <textarea
                  id="motivo-anulacion"
                  ref={motivoRef}
                  required
                  maxLength={250}
                  aria-invalid={Boolean(errorMotivo)}
                  aria-describedby={errorMotivo ? "motivo-anulacion-error" : "motivo-anulacion-ayuda"}
                  className={`aura-control ${errorMotivo ? "field-invalid" : ""}`}
                  value={motivo}
                  disabled={anulando}
                  onChange={(event) => { setMotivo(event.target.value); setErrorMotivo(""); }}
                />
                <div className="finance-field-meta"><span id="motivo-anulacion-ayuda">Entre 5 y 250 caracteres.</span><span>{motivo.length}/250</span></div>
                <FieldError id="motivo-anulacion-error" message={errorMotivo} />
              </div>
              <div className="finance-irreversible-actions">
                <button aria-busy={anulando || undefined} disabled={anulando} className="aura-button aura-button-danger finance-destructive-button" type="submit">Anular cobro</button>
                <button disabled={anulando} className="aura-button aura-button-secondary" type="button" onClick={cancelarFormulario}>Cancelar</button>
              </div>
            </form>
          ) : null}
        </AuraPanel>
      </div>

      <ConfirmDialog
        open={confirmacion === "anular"}
        title="¿Anular este cobro?"
        description="El cobro dejará de considerarse activo. El turno volverá a quedar disponible para registrar un cobro, según las reglas actuales del sistema."
        details={`${cobro.clienta_nombre_historica} · ${dinero(cobro.importe)} · Motivo: ${motivo.trim()}`}
        confirmLabel="Anular cobro"
        destructive
        isProcessing={anulando}
        onClose={() => setConfirmacion(null)}
        onConfirm={async () => { setConfirmacion(null); await ejecutarAnulacion(); }}
      />
      <ConfirmDialog
        open={confirmacion === "descartar"}
        title="¿Descartar el motivo escrito?"
        description="El texto ingresado para la anulación se perderá. El cobro permanecerá activo."
        confirmLabel="Descartar"
        destructive
        onClose={() => setConfirmacion(null)}
        onConfirm={() => { setConfirmacion(null); setMostrarAnulacion(false); setMotivo(""); setErrorMotivo(""); }}
      />
    </AuraPage>
  );
}

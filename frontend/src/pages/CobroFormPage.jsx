import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { registrarCobro } from "../api/cobros.js";
import { obtenerCajaAbierta } from "../api/caja.js";
import { obtenerTurno } from "../api/turnos.js";
import FieldError from "../components/FieldError.jsx";
import { FinancialAmount, FinancialStatus } from "../components/Financial.jsx";
import FormActions from "../components/FormActions.jsx";
import { AuraHero, AuraPage, AuraPanel, AuraPanelHeader, AuraRecordCard } from "../components/visual";
import { focusFirstError, normalizeApiError } from "../utils/apiErrors.js";

const fechaHora = (value) => new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
const metodos = [
  { value: "efectivo", label: "Efectivo", description: "Se incorpora al saldo físico de la caja." },
  { value: "transferencia", label: "Transferencia", description: "Pago recibido mediante transferencia bancaria." },
  { value: "tarjeta", label: "Tarjeta", description: "Pago realizado con tarjeta de débito o crédito." },
  { value: "otro", label: "Otro", description: "Usá esta opción e indicá el método utilizado." },
];
const metodosPermitidos = metodos.map((metodo) => metodo.value);

function mensajeDeError(error, predeterminado) {
  const data = error.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  for (const value of Object.values(data || {})) {
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  }
  return predeterminado;
}

export default function CobroFormPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const turnoId = searchParams.get("turno");
  const [turno, setTurno] = useState(null);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [detalleMetodo, setDetalleMetodo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [cajaAbierta, setCajaAbierta] = useState(undefined);
  const [erroresCampos, setErroresCampos] = useState({});
  const refs = { metodo_pago: useRef(null), detalle_metodo: useRef(null) };

  useEffect(() => {
    if (!turnoId) {
      setError("Necesitás indicar un turno para registrar el cobro.");
      setCargando(false);
      return;
    }

    let vigente = true;
    Promise.all([obtenerTurno(turnoId), obtenerCajaAbierta()])
      .then(([turnoData, caja]) => {
        if (!vigente) return;
        setTurno(turnoData);
        setCajaAbierta(caja);
      })
      .catch((requestError) => {
        if (!vigente) return;
        setError(requestError.response?.status === 404 ? "No encontramos este turno." : "No pudimos cargar la información necesaria para el cobro.");
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => { vigente = false; };
  }, [turnoId]);

  const puedeRegistrar = turno?.estado === "realizado" && turno?.puede_registrar_cobro && Boolean(cajaAbierta);
  const cancelTo = turnoId ? `/turnos/${turnoId}` : "/turnos";
  const isDirty = metodoPago !== "efectivo" || detalleMetodo.trim() !== "";

  const cambiarMetodo = (value) => {
    setMetodoPago(value);
    if (value !== "otro") setDetalleMetodo("");
    setErroresCampos({});
    setError("");
  };

  const guardar = async (event) => {
    event.preventDefault();
    if (guardando) return;

    setError("");
    setErroresCampos({});

    if (!puedeRegistrar) {
      setError("Este turno no está disponible para registrar un cobro.");
      return;
    }

    const errors = {};
    if (!metodosPermitidos.includes(metodoPago)) errors.metodo_pago = "Elegí un método de pago válido.";
    if (metodoPago === "otro" && !detalleMetodo.trim()) errors.detalle_metodo = "Ingresá un detalle para el método de pago Otro.";
    if (detalleMetodo.trim().length > 120) errors.detalle_metodo = "El detalle no puede superar los 120 caracteres.";

    if (Object.keys(errors).length) {
      setErroresCampos(errors);
      focusFirstError(refs, errors);
      return;
    }

    setGuardando(true);
    try {
      const cobro = await registrarCobro({
        turno_id: Number(turnoId),
        metodo_pago: metodoPago,
        detalle_metodo: metodoPago === "otro" ? detalleMetodo.trim() : "",
      });
      navigate(`/cobros/${cobro.id}`, { state: { message: "Cobro registrado correctamente." } });
    } catch (requestError) {
      const parsed = normalizeApiError(requestError, mensajeDeError(requestError, "No pudimos registrar el cobro. Intentá nuevamente."));
      setErroresCampos(parsed.fields);
      setError(parsed.formError);
      focusFirstError(refs, parsed.fields);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <AuraPage width="form" className="finance-page">
      <div className="finance-stack">
        <AuraHero
          eyebrow="Cobros"
          title="Registrar cobro"
          description="Confirmá el turno, elegí el método de pago y registrá el ingreso en la caja abierta."
          back={<Link className="aura-glass-link" to={cancelTo}>Volver al turno</Link>}
        />

        {cargando ? <AuraPanel><p className="aura-form-status">Cargando información del turno…</p></AuraPanel> : null}

        {!cargando && error && !turno ? (
          <AuraPanel>
            <div className="finance-error" role="alert">
              <div><strong>No se puede iniciar el cobro.</strong><p>{error}</p></div>
              <Link className="aura-button aura-button-secondary" to={cancelTo}>Volver</Link>
            </div>
          </AuraPanel>
        ) : null}

        {!cargando && turno && !puedeRegistrar ? (
          <AuraPanel>
            <AuraPanelHeader title="Cobro no disponible" description="Revisá el estado del turno y de la caja antes de continuar." />
            <div className="finance-warning">
              <div>
                <strong>{!cajaAbierta && turno.estado === "realizado" && turno.puede_registrar_cobro ? "La caja está cerrada." : "Este turno no admite un nuevo cobro."}</strong>
                <p>{!cajaAbierta && turno.estado === "realizado" && turno.puede_registrar_cobro
                  ? "Debés abrir la caja para registrar el ingreso."
                  : "El cobro solo está disponible para un turno realizado sin cobro activo."}</p>
              </div>
              <div className="finance-warning-actions">
                {!cajaAbierta && turno.estado === "realizado" && turno.puede_registrar_cobro ? <Link className="aura-button aura-button-primary" to="/caja">Ir a Caja</Link> : null}
                {turno.cobro_activo ? <Link className="aura-button aura-button-secondary" to={`/cobros/${turno.cobro_activo.id}`}>Ver cobro activo</Link> : null}
              </div>
            </div>
          </AuraPanel>
        ) : null}

        {!cargando && turno && puedeRegistrar ? (
          <form className="finance-payment-form" onSubmit={guardar} noValidate>
            <AuraPanel>
              <AuraPanelHeader title="Turno a cobrar" description="Verificá los datos antes de registrar el pago." action={<FinancialStatus label="Caja abierta" status="registrado" />} />
              <AuraRecordCard className="finance-turn-summary">
                <div>
                  <span className="finance-record-label">Clienta</span>
                  <h2>{turno.clienta.nombre_completo}</h2>
                  <p>{fechaHora(turno.inicio)} · {turno.duracion_legible}</p>
                  <p>{turno.servicios.map((servicio) => servicio.nombre).join(", ")}</p>
                </div>
                <FinancialAmount amount={turno.precio_estimado} label="Importe a registrar" size="lg" tone="positive" />
              </AuraRecordCard>
            </AuraPanel>

            <AuraPanel className="aura-form-panel">
              <AuraPanelHeader title="Método de pago" description="Elegí cómo se recibió el importe." />
              <fieldset className={`finance-method-fieldset ${erroresCampos.metodo_pago ? "field-invalid" : ""}`}>
                <legend className="sr-only">Método de pago</legend>
                <div className="finance-method-grid">
                  {metodos.map((metodo, index) => (
                    <label className={`finance-method-option ${metodoPago === metodo.value ? "is-selected" : ""}`} key={metodo.value}>
                      <input
                        aria-describedby={erroresCampos.metodo_pago ? "metodo-error" : undefined}
                        aria-invalid={Boolean(erroresCampos.metodo_pago)}
                        checked={metodoPago === metodo.value}
                        disabled={guardando}
                        name="metodo_pago"
                        ref={index === 0 ? refs.metodo_pago : undefined}
                        type="radio"
                        value={metodo.value}
                        onChange={() => cambiarMetodo(metodo.value)}
                      />
                      <span><strong>{metodo.label}</strong><small>{metodo.description}</small></span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <FieldError id="metodo-error" message={erroresCampos.metodo_pago} />

              {metodoPago === "otro" ? (
                <div className="aura-field">
                  <label className="aura-field-label" htmlFor="detalle-metodo">Detalle del método</label>
                  <input
                    id="detalle-metodo"
                    aria-describedby={erroresCampos.detalle_metodo ? "detalle-error" : "detalle-help"}
                    aria-invalid={Boolean(erroresCampos.detalle_metodo)}
                    className={`aura-control ${erroresCampos.detalle_metodo ? "field-invalid" : ""}`}
                    disabled={guardando}
                    maxLength={120}
                    ref={refs.detalle_metodo}
                    required
                    value={detalleMetodo}
                    onChange={(event) => {
                      setDetalleMetodo(event.target.value);
                      setErroresCampos((current) => ({ ...current, detalle_metodo: undefined }));
                      setError("");
                    }}
                  />
                  <div className="finance-field-meta"><span id="detalle-help">Indicá cómo se realizó el pago.</span><span>{detalleMetodo.length}/120</span></div>
                  <FieldError id="detalle-error" message={erroresCampos.detalle_metodo} />
                </div>
              ) : null}

              {error ? <p className="finance-inline-error" role="alert">{error}</p> : null}
              <FormActions cancelTo={cancelTo} isDirty={isDirty} isSubmitting={guardando} submitLabel="Registrar cobro" submittingLabel="Registrando…" />
            </AuraPanel>
          </form>
        ) : null}
      </div>
    </AuraPage>
  );
}

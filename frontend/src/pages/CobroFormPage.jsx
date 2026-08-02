import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { registrarCobro } from "../api/cobros.js";
import { obtenerCajaAbierta } from "../api/caja.js";
import { obtenerTurno } from "../api/turnos.js";
import AppHeader from "../components/AppHeader.jsx";
import FieldError from "../components/FieldError.jsx";
import FormActions from "../components/FormActions.jsx";
import { focusFirstError, normalizeApiError } from "../utils/apiErrors.js";

const dinero = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(value);
const fechaHora = (value) => new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
const metodosPermitidos = ["efectivo", "transferencia", "tarjeta", "otro"];

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
        if (vigente) {
          setTurno(turnoData);
          setCajaAbierta(caja);
        }
      })
      .catch((requestError) => {
        if (vigente) {
          setError(requestError.response?.status === 404 ? "No encontramos este turno." : "No pudimos cargar la información necesaria para el cobro.");
        }
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
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
    if (!metodosPermitidos.includes(metodoPago)) {
      errors.metodo_pago = "Elegí un método de pago válido.";
    }
    if (metodoPago === "otro" && !detalleMetodo.trim()) {
      errors.detalle_metodo = "Ingresá un detalle para el método de pago Otro.";
    }
    if (detalleMetodo.trim().length > 120) {
      errors.detalle_metodo = "El detalle no puede superar los 120 caracteres.";
    }

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
    <main className="min-h-screen text-foreground">
      <AppHeader />
      <section className="mx-auto max-w-3xl px-5 py-8">
        <Link className="text-sm font-semibold text-primary underline underline-offset-4" to={cancelTo}>Volver al turno</Link>
        <h1 className="mt-4 text-3xl font-semibold">Registrar cobro</h1>
        {cargando && <p className="mt-5 text-muted-foreground">Cargando información del turno...</p>}
        {!cargando && error && !turno && <p className="mt-5 text-destructive">{error}</p>}
        {!cargando && turno && !puedeRegistrar && (
          <div className="mt-5 rounded-xl border border-border bg-card p-6">
            {!cajaAbierta && turno.estado === "realizado" && turno.puede_registrar_cobro ? (
              <>
                <p>Debés abrir la caja antes de registrar un cobro.</p>
                <Link className="mt-3 inline-block font-semibold underline" to="/caja">Ir a Caja</Link>
              </>
            ) : (
              <p>El cobro solo está disponible para un turno realizado sin cobro activo.</p>
            )}
            {turno.cobro_activo && <Link className="mt-3 inline-block font-semibold underline" to={`/cobros/${turno.cobro_activo.id}`}>Ver cobro activo</Link>}
          </div>
        )}
        {!cargando && turno && puedeRegistrar && (
          <form className="mt-5 space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm" onSubmit={guardar} noValidate>
            <div className="rounded-lg border border-border bg-secondary p-4">
              <p className="font-semibold">{turno.clienta.nombre_completo}</p>
              <p>{fechaHora(turno.inicio)} · {turno.duracion_legible}</p>
              <p>{turno.servicios.map((servicio) => servicio.nombre).join(", ")}</p>
              <p className="mt-2 text-lg font-semibold">Importe: {dinero(turno.precio_estimado)}</p>
            </div>
            <label className="grid gap-1">
              Método de pago
              <select
                aria-describedby={erroresCampos.metodo_pago ? "metodo-error" : undefined}
                aria-invalid={Boolean(erroresCampos.metodo_pago)}
                className={erroresCampos.metodo_pago ? "field-invalid" : ""}
                disabled={guardando}
                ref={refs.metodo_pago}
                value={metodoPago}
                onChange={(event) => cambiarMetodo(event.target.value)}
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="otro">Otro</option>
              </select>
            </label>
            <FieldError id="metodo-error" message={erroresCampos.metodo_pago} />
            {metodoPago === "otro" && (
              <label className="grid gap-1">
                Detalle del método
                <input
                  aria-describedby={erroresCampos.detalle_metodo ? "detalle-error" : undefined}
                  aria-invalid={Boolean(erroresCampos.detalle_metodo)}
                  className={erroresCampos.detalle_metodo ? "field-invalid" : ""}
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
                <span className="text-xs text-muted-foreground">{detalleMetodo.length}/120 caracteres</span>
                <FieldError id="detalle-error" message={erroresCampos.detalle_metodo} />
              </label>
            )}
            {error && <p className="text-destructive" role="alert">{error}</p>}
            <FormActions cancelTo={cancelTo} isDirty={isDirty} isSubmitting={guardando} submitLabel="Registrar cobro" submittingLabel="Registrando..." />
          </form>
        )}
      </section>
    </main>
  );
}

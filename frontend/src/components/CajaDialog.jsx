import { useMemo, useRef, useState } from "react";

import {
  abrirCaja,
  anularGasto,
  anularMovimiento,
  cerrarCaja,
  registrarAporte,
  registrarGasto,
  registrarRetiro,
} from "../api/caja.js";
import { focusFirstError } from "../utils/apiErrors.js";
import { validNumber } from "../utils/validators.js";
import ConfirmDialog from "./ConfirmDialog.jsx";
import useDialogAccessibility from "../hooks/useDialogAccessibility.js";
import FieldError from "./FieldError.jsx";
import { dinero } from "./CajaResumen.jsx";

function mensajeDeError(error, predeterminado) {
  const data = error.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  for (const value of Object.values(data || {})) {
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  }
  return predeterminado;
}

const titulos = {
  abrir: "Abrir caja",
  gasto: "Registrar gasto",
  aporte: "Registrar aporte",
  retiro: "Registrar retiro",
  cerrar: "Cerrar caja",
  anularGasto: "Anular gasto",
  anularMovimiento: "Anular movimiento",
};

export default function CajaDialog({ tipo, caja, registro, onClose, onSuccess }) {
  const [importe, setImporte] = useState("");
  const [concepto, setConcepto] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [observacion, setObservacion] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [erroresCampos, setErroresCampos] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [confirmandoSalida, setConfirmandoSalida] = useState(false);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  const refs = {
    importe: useRef(null),
    concepto: useRef(null),
    observacion: useRef(null),
    motivo: useRef(null),
  };

  const esAnulacion = tipo === "anularGasto" || tipo === "anularMovimiento";
  const esMovimiento = tipo === "aporte" || tipo === "retiro";
  const tieneCambios = Boolean(importe || concepto.trim() || observacion.trim() || motivo.trim() || metodoPago !== "efectivo");

  const diferenciaEstimada = useMemo(() => {
    if (tipo !== "cerrar" || importe === "") return null;
    return Number(importe) - Number(caja?.resumen?.saldo_teorico || 0);
  }, [caja, importe, tipo]);

  const limpiarError = (campo) => {
    setErroresCampos((actual) => ({ ...actual, [campo]: undefined }));
    setError("");
  };

  const solicitarCierre = () => {
    if (guardando) return;
    if (tieneCambios) {
      setConfirmandoSalida(true);
      return;
    }
    onClose();
  };

  const ejecutar = async () => {
    if (guardando) return;
    setGuardando(true);
    setError("");
    try {
      if (tipo === "abrir") await abrirCaja({ saldo_inicial: importe, observacion_apertura: observacion.trim() });
      if (tipo === "gasto") await registrarGasto(caja.id, { concepto: concepto.trim(), importe, metodo_pago: metodoPago, observacion: observacion.trim() });
      if (tipo === "aporte") await registrarAporte(caja.id, { importe, motivo: motivo.trim() });
      if (tipo === "retiro") await registrarRetiro(caja.id, { importe, motivo: motivo.trim() });
      if (tipo === "cerrar") await cerrarCaja(caja.id, { saldo_contado: importe, observacion_cierre: observacion.trim() });
      if (tipo === "anularGasto") await anularGasto(caja.id, registro.id, { motivo: motivo.trim() });
      if (tipo === "anularMovimiento") await anularMovimiento(caja.id, registro.id, { motivo: motivo.trim() });
      onSuccess(tipo === "cerrar" ? "Caja cerrada correctamente." : "Operación registrada correctamente.");
    } catch (requestError) {
      setError(mensajeDeError(requestError, "No pudimos completar la operación. Intentá nuevamente."));
    } finally {
      setGuardando(false);
    }
  };

  const validar = () => {
    const errores = {};

    if (!esAnulacion) {
      errores.importe = validNumber(importe, {
        label: tipo === "cerrar" ? "El dinero contado" : tipo === "abrir" ? "El saldo inicial" : "El importe",
        min: 0,
        allowZero: tipo === "abrir" || tipo === "cerrar",
      });
    }

    if (tipo === "gasto" && !concepto.trim()) errores.concepto = "Ingresá el concepto del gasto.";
    if (esMovimiento && motivo.trim().length < 5) errores.motivo = "Ingresá un motivo de al menos 5 caracteres.";
    if (esAnulacion && motivo.trim().length < 5) errores.motivo = "Ingresá un motivo de anulación de al menos 5 caracteres.";
    if (tipo === "gasto" && metodoPago === "otro" && !observacion.trim()) errores.observacion = "Ingresá una observación para el método de pago Otro.";
    if (tipo === "cerrar" && diferenciaEstimada !== null && diferenciaEstimada !== 0 && !observacion.trim()) errores.observacion = "Explicá la diferencia entre el saldo esperado y el dinero contado.";

    setErroresCampos(errores);
    if (Object.values(errores).some(Boolean)) {
      focusFirstError(refs, errores);
      return false;
    }
    return true;
  };

  const guardar = async (event) => {
    event.preventDefault();
    if (guardando) return;
    setError("");
    if (!validar()) return;
    if (["cerrar", "retiro", "anularGasto", "anularMovimiento"].includes(tipo)) {
      setConfirmando(true);
      return;
    }
    await ejecutar();
  };

  const confirmTitle = tipo === "cerrar" ? "¿Cerrar la caja?" : tipo === "retiro" ? "¿Registrar este retiro?" : "¿Anular este movimiento?";
  const confirmDescription = tipo === "cerrar"
    ? "Se registrará el cierre de la jornada con el efectivo contado y la diferencia calculada."
    : tipo === "retiro"
      ? "El importe se descontará del efectivo disponible en la caja."
      : "El movimiento dejará de considerarse activo y la anulación quedará registrada.";


  useDialogAccessibility({
    active: true,
    suspended: confirmando || confirmandoSalida,
    containerRef: dialogRef,
    initialFocusRef: esAnulacion ? refs.motivo : refs.importe,
    onEscape: solicitarCierre,
  });

  const campoImporte = (label, options = {}) => (
    <div className="cash-dialog-field">
      <label htmlFor="caja-dialog-importe">{label}</label>
      <input
        id="caja-dialog-importe"
        ref={refs.importe}
        autoFocus={options.autoFocus}
        aria-describedby={erroresCampos.importe ? "caja-importe-error" : undefined}
        aria-invalid={Boolean(erroresCampos.importe)}
        className={`aura-control ${erroresCampos.importe ? "field-invalid" : ""}`}
        min={options.min ?? "0"}
        step="0.01"
        type="number"
        value={importe}
        onChange={(event) => { setImporte(event.target.value); limpiarError("importe"); }}
      />
      <FieldError id="caja-importe-error" message={erroresCampos.importe} />
    </div>
  );

  return (
    <div className="cash-dialog-backdrop" role="presentation">
      <form
        ref={dialogRef}
        aria-describedby="caja-dialog-descripcion"
        aria-labelledby="caja-dialog-titulo"
        aria-modal="true"
        className="cash-dialog"
        noValidate
        onSubmit={guardar}
        role="dialog"
        tabIndex="-1"
      >
        <header className="cash-dialog-header">
          <div>
            <p className="cash-kicker">Operación de caja</p>
            <h2 id="caja-dialog-titulo">{titulos[tipo]}</h2>
            <p className="aura-sr-only" id="caja-dialog-descripcion">Completá los datos de la operación y confirmá para registrarla.</p>
          </div>
          <button ref={closeRef} aria-label="Cerrar diálogo" className="cash-dialog-close" disabled={guardando} type="button" onClick={solicitarCierre}>×</button>
        </header>

        <div className="cash-dialog-body">
          {tipo === "abrir" ? (
            <>
              <p className="cash-dialog-intro">Definí el efectivo inicial antes de comenzar a registrar cobros y movimientos.</p>
              {campoImporte("Saldo inicial", { autoFocus: true })}
              <div className="cash-dialog-field">
                <label htmlFor="caja-dialog-observacion">Observación opcional</label>
                <textarea id="caja-dialog-observacion" ref={refs.observacion} className="aura-control" value={observacion} onChange={(event) => { setObservacion(event.target.value); limpiarError("observacion"); }} />
              </div>
            </>
          ) : null}

          {tipo === "gasto" ? (
            <>
              <p className="cash-dialog-intro">Solo los gastos en efectivo reducen el saldo físico esperado.</p>
              <div className="cash-dialog-field">
                <label htmlFor="caja-dialog-concepto">Concepto</label>
                <input id="caja-dialog-concepto" ref={refs.concepto} autoFocus aria-describedby={erroresCampos.concepto ? "caja-concepto-error" : undefined} aria-invalid={Boolean(erroresCampos.concepto)} className={`aura-control ${erroresCampos.concepto ? "field-invalid" : ""}`} value={concepto} onChange={(event) => { setConcepto(event.target.value); limpiarError("concepto"); }} />
                <FieldError id="caja-concepto-error" message={erroresCampos.concepto} />
              </div>
              {campoImporte("Importe", { min: "0.01" })}
              <div className="cash-dialog-field">
                <label htmlFor="caja-dialog-metodo">Método de pago</label>
                <select id="caja-dialog-metodo" className="aura-control" value={metodoPago} onChange={(event) => { setMetodoPago(event.target.value); if (event.target.value !== "otro") limpiarError("observacion"); }}>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="cash-dialog-field">
                <label htmlFor="caja-dialog-observacion">Observación{metodoPago === "otro" ? " obligatoria" : " opcional"}</label>
                <textarea id="caja-dialog-observacion" ref={refs.observacion} aria-describedby={erroresCampos.observacion ? "caja-observacion-error" : undefined} aria-invalid={Boolean(erroresCampos.observacion)} className={`aura-control ${erroresCampos.observacion ? "field-invalid" : ""}`} value={observacion} onChange={(event) => { setObservacion(event.target.value); limpiarError("observacion"); }} />
                <FieldError id="caja-observacion-error" message={erroresCampos.observacion} />
              </div>
            </>
          ) : null}

          {esMovimiento ? (
            <>
              <p className="cash-dialog-intro">{tipo === "aporte" ? "Un aporte agrega efectivo sin representar un cobro." : "Un retiro quita efectivo sin representar un gasto."}</p>
              {campoImporte("Importe", { autoFocus: true, min: "0.01" })}
              <div className="cash-dialog-field">
                <label htmlFor="caja-dialog-motivo">Motivo</label>
                <textarea id="caja-dialog-motivo" ref={refs.motivo} aria-describedby={erroresCampos.motivo ? "caja-motivo-error" : undefined} aria-invalid={Boolean(erroresCampos.motivo)} className={`aura-control ${erroresCampos.motivo ? "field-invalid" : ""}`} value={motivo} onChange={(event) => { setMotivo(event.target.value); limpiarError("motivo"); }} />
                <FieldError id="caja-motivo-error" message={erroresCampos.motivo} />
              </div>
            </>
          ) : null}

          {tipo === "cerrar" ? (
            <>
              <div className="cash-dialog-summary">
                <div><span>Saldo esperado</span><strong>{dinero(caja?.resumen?.saldo_teorico)}</strong></div>
                <div><span>Efectivo ingresado</span><strong>{dinero(caja?.resumen?.cobros_por_metodo?.efectivo)}</strong></div>
                <div><span>Gastos en efectivo</span><strong>{dinero(caja?.resumen?.gastos_por_metodo?.efectivo)}</strong></div>
                <div><span>Aportes / Retiros</span><strong>{dinero(Number(caja?.resumen?.aportes || 0) - Number(caja?.resumen?.retiros || 0))}</strong></div>
              </div>
              {campoImporte("Dinero contado", { autoFocus: true })}
              {diferenciaEstimada !== null ? (
                <div className={`cash-dialog-difference ${diferenciaEstimada === 0 ? "is-balanced" : diferenciaEstimada > 0 ? "is-surplus" : "is-shortage"}`}>
                  <span>Diferencia estimada</span>
                  <strong>{dinero(diferenciaEstimada)}</strong>
                  <small>{diferenciaEstimada === 0 ? "Caja equilibrada" : diferenciaEstimada > 0 ? "Sobrante" : "Faltante"}</small>
                </div>
              ) : null}
              <div className="cash-dialog-field">
                <label htmlFor="caja-dialog-observacion">Observación{diferenciaEstimada !== null && diferenciaEstimada !== 0 ? " obligatoria" : " opcional"}</label>
                <textarea id="caja-dialog-observacion" ref={refs.observacion} aria-describedby={erroresCampos.observacion ? "caja-observacion-error" : undefined} aria-invalid={Boolean(erroresCampos.observacion)} className={`aura-control ${erroresCampos.observacion ? "field-invalid" : ""}`} value={observacion} onChange={(event) => { setObservacion(event.target.value); limpiarError("observacion"); }} />
                <FieldError id="caja-observacion-error" message={erroresCampos.observacion} />
              </div>
            </>
          ) : null}

          {esAnulacion ? (
            <>
              <div className="cash-dialog-record">
                <span>{registro?.concepto || registro?.tipo_display}</span>
                <strong>{dinero(registro?.importe)}</strong>
              </div>
              <div className="cash-dialog-field">
                <label htmlFor="caja-dialog-motivo">Motivo de anulación</label>
                <textarea id="caja-dialog-motivo" ref={refs.motivo} autoFocus aria-describedby={erroresCampos.motivo ? "caja-motivo-error" : undefined} aria-invalid={Boolean(erroresCampos.motivo)} className={`aura-control ${erroresCampos.motivo ? "field-invalid" : ""}`} value={motivo} onChange={(event) => { setMotivo(event.target.value); limpiarError("motivo"); }} />
                <FieldError id="caja-motivo-error" message={erroresCampos.motivo} />
              </div>
            </>
          ) : null}

          {error ? <p className="cash-feedback is-error" role="alert">{error}</p> : null}
        </div>

        <footer className="cash-dialog-footer">
          <button className="aura-button aura-button-secondary" disabled={guardando} type="button" onClick={solicitarCierre}>Cancelar</button>
          <button aria-busy={guardando || undefined} className={`aura-button ${tipo === "cerrar" || esAnulacion ? "aura-button-danger cash-destructive-button" : "aura-button-primary"}`} disabled={guardando} type="submit">
            {guardando ? "Guardando..." : esAnulacion ? "Confirmar anulación" : tipo === "cerrar" ? "Confirmar cierre" : tipo === "abrir" ? "Confirmar apertura" : "Confirmar"}
          </button>
        </footer>
      </form>

      <ConfirmDialog
        open={confirmando}
        title={confirmTitle}
        description={confirmDescription}
        details={tipo === "cerrar" ? `Efectivo contado: ${dinero(importe)}` : `${registro?.concepto || registro?.tipo_display || "Retiro"} · ${dinero(tipo === "retiro" ? importe : registro?.importe)}`}
        confirmLabel={tipo === "cerrar" ? "Cerrar caja" : tipo === "retiro" ? "Registrar retiro" : "Anular movimiento"}
        destructive={tipo !== "retiro"}
        isProcessing={guardando}
        onClose={() => setConfirmando(false)}
        onConfirm={async () => { setConfirmando(false); await ejecutar(); }}
      />

      <ConfirmDialog
        open={confirmandoSalida}
        title="¿Descartar los datos ingresados?"
        description="La operación no se registrará y la información escrita se perderá."
        confirmLabel="Descartar y cerrar"
        destructive
        onClose={() => setConfirmandoSalida(false)}
        onConfirm={onClose}
      />
    </div>
  );
}

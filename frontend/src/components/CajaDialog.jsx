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

  return (
    <div aria-modal="true" className="fixed inset-0 z-20 flex items-end bg-[#2f2528]/40 p-4 sm:items-center sm:justify-center" role="dialog" aria-labelledby="caja-dialog-titulo">
      <form className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onSubmit={guardar} noValidate>
        <header className="aura-dialog-header"><h2 className="text-2xl font-semibold" id="caja-dialog-titulo">{titulos[tipo]}</h2></header>
        <div className="space-y-4 py-5">
          {tipo === "abrir" && <><p className="text-sm text-[#6f5b60]">Abrí la caja antes de registrar cobros.</p><label className="grid gap-1">Saldo inicial<input ref={refs.importe} autoFocus aria-invalid={Boolean(erroresCampos.importe)} className={erroresCampos.importe ? "field-invalid" : ""} min="0" step="0.01" type="number" value={importe} onChange={(event) => { setImporte(event.target.value); limpiarError("importe"); }} /></label><FieldError id="caja-importe-error" message={erroresCampos.importe} /><label className="grid gap-1">Observación opcional<textarea ref={refs.observacion} value={observacion} onChange={(event) => { setObservacion(event.target.value); limpiarError("observacion"); }} /></label></>}

          {tipo === "gasto" && <><p className="text-sm text-[#6f5b60]">Solo los gastos en efectivo reducen el dinero físico esperado.</p><label className="grid gap-1">Concepto<input ref={refs.concepto} autoFocus aria-invalid={Boolean(erroresCampos.concepto)} className={erroresCampos.concepto ? "field-invalid" : ""} value={concepto} onChange={(event) => { setConcepto(event.target.value); limpiarError("concepto"); }} /></label><FieldError id="caja-concepto-error" message={erroresCampos.concepto} /><label className="grid gap-1">Importe<input ref={refs.importe} aria-invalid={Boolean(erroresCampos.importe)} className={erroresCampos.importe ? "field-invalid" : ""} min="0.01" step="0.01" type="number" value={importe} onChange={(event) => { setImporte(event.target.value); limpiarError("importe"); }} /></label><FieldError id="caja-importe-error" message={erroresCampos.importe} /><label className="grid gap-1">Método de pago<select value={metodoPago} onChange={(event) => { setMetodoPago(event.target.value); if (event.target.value !== "otro") limpiarError("observacion"); }}><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="tarjeta">Tarjeta</option><option value="otro">Otro</option></select></label><label className="grid gap-1">Observación{metodoPago === "otro" ? " (obligatoria)" : " opcional"}<textarea ref={refs.observacion} aria-invalid={Boolean(erroresCampos.observacion)} className={erroresCampos.observacion ? "field-invalid" : ""} value={observacion} onChange={(event) => { setObservacion(event.target.value); limpiarError("observacion"); }} /></label><FieldError id="caja-observacion-error" message={erroresCampos.observacion} /></>}

          {esMovimiento && <><p className="text-sm text-[#6f5b60]">{tipo === "aporte" ? "Un aporte agrega dinero físico a la caja sin representar un cobro." : "Un retiro quita dinero físico de la caja sin representar un gasto."}</p><label className="grid gap-1">Importe<input ref={refs.importe} autoFocus aria-invalid={Boolean(erroresCampos.importe)} className={erroresCampos.importe ? "field-invalid" : ""} min="0.01" step="0.01" type="number" value={importe} onChange={(event) => { setImporte(event.target.value); limpiarError("importe"); }} /></label><FieldError id="caja-importe-error" message={erroresCampos.importe} /><label className="grid gap-1">Motivo<textarea ref={refs.motivo} aria-invalid={Boolean(erroresCampos.motivo)} className={erroresCampos.motivo ? "field-invalid" : ""} value={motivo} onChange={(event) => { setMotivo(event.target.value); limpiarError("motivo"); }} /></label><FieldError id="caja-motivo-error" message={erroresCampos.motivo} /></>}

          {tipo === "cerrar" && <><div className="rounded-xl bg-[#f4eff0] p-4 text-sm"><p>Saldo esperado: <strong>{dinero(caja?.resumen?.saldo_teorico)}</strong></p><p>Efectivo ingresado: <strong>{dinero(caja?.resumen?.cobros_por_metodo?.efectivo)}</strong></p><p>Gastos en efectivo: <strong>{dinero(caja?.resumen?.gastos_por_metodo?.efectivo)}</strong></p><p>Aportes: <strong>{dinero(caja?.resumen?.aportes)}</strong></p><p>Retiros: <strong>{dinero(caja?.resumen?.retiros)}</strong></p></div><label className="grid gap-1">Dinero contado<input ref={refs.importe} autoFocus aria-invalid={Boolean(erroresCampos.importe)} className={erroresCampos.importe ? "field-invalid" : ""} min="0" step="0.01" type="number" value={importe} onChange={(event) => { setImporte(event.target.value); limpiarError("importe"); }} /></label><FieldError id="caja-importe-error" message={erroresCampos.importe} />{diferenciaEstimada !== null && <p className="rounded-xl bg-[#f4eff0] p-3 text-sm">Diferencia estimada: <strong>{dinero(diferenciaEstimada)}</strong>{diferenciaEstimada === 0 ? " · Caja equilibrada" : diferenciaEstimada > 0 ? " · Sobrante" : " · Faltante"}</p>}<label className="grid gap-1">Observación{diferenciaEstimada !== null && diferenciaEstimada !== 0 ? " (obligatoria)" : " opcional"}<textarea ref={refs.observacion} aria-invalid={Boolean(erroresCampos.observacion)} className={erroresCampos.observacion ? "field-invalid" : ""} value={observacion} onChange={(event) => { setObservacion(event.target.value); limpiarError("observacion"); }} /></label><FieldError id="caja-observacion-error" message={erroresCampos.observacion} /></>}

          {esAnulacion && <><p className="text-sm text-[#6f5b60]">{registro?.concepto || registro?.tipo_display} · {dinero(registro?.importe)}</p><label className="grid gap-1">Motivo de anulación<textarea ref={refs.motivo} autoFocus aria-invalid={Boolean(erroresCampos.motivo)} className={erroresCampos.motivo ? "field-invalid" : ""} value={motivo} onChange={(event) => { setMotivo(event.target.value); limpiarError("motivo"); }} /></label><FieldError id="caja-motivo-error" message={erroresCampos.motivo} /></>}

          {error && <p className="rounded-xl bg-[#fff4f5] p-3 text-sm text-[#8b3f4c]" role="alert">{error}</p>}
        </div>
        <footer className="aura-dialog-footer"><button className="aura-action aura-action-secondary" disabled={guardando} type="button" onClick={solicitarCierre}>Cancelar</button><button className={`aura-action ${tipo === "cerrar" || esAnulacion ? "aura-action-destructive" : "aura-action-primary"}`} disabled={guardando} type="submit">{guardando ? "Guardando..." : esAnulacion ? "Confirmar anulación" : tipo === "cerrar" ? "Confirmar cierre" : tipo === "abrir" ? "Confirmar apertura" : "Confirmar"}</button></footer>
      </form>

      <ConfirmDialog open={confirmando} title={confirmTitle} description={confirmDescription} details={tipo === "cerrar" ? `Efectivo contado: ${dinero(importe)}` : `${registro?.concepto || registro?.tipo_display || "Retiro"} · ${dinero(tipo === "retiro" ? importe : registro?.importe)}`} confirmLabel={tipo === "cerrar" ? "Cerrar caja" : tipo === "retiro" ? "Registrar retiro" : "Anular movimiento"} destructive={tipo !== "retiro"} isProcessing={guardando} onClose={() => setConfirmando(false)} onConfirm={async () => { setConfirmando(false); await ejecutar(); }} />

      <ConfirmDialog open={confirmandoSalida} title="¿Descartar los datos ingresados?" description="La operación no se registrará y la información escrita se perderá." confirmLabel="Descartar y cerrar" destructive onClose={() => setConfirmandoSalida(false)} onConfirm={onClose} />
    </div>
  );
}

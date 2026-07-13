import { useMemo, useState } from "react";

import {
  abrirCaja,
  anularGasto,
  anularMovimiento,
  cerrarCaja,
  registrarAporte,
  registrarGasto,
  registrarRetiro,
} from "../api/caja.js";
import { dinero } from "./CajaResumen.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

function mensajeDeError(error, predeterminado) {
  const data = error.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  for (const value of Object.values(data || {})) {
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  }
  return predeterminado;
}

const titulos = { abrir: "Abrir caja", gasto: "Registrar gasto", aporte: "Registrar aporte", retiro: "Registrar retiro", cerrar: "Cerrar caja", anularGasto: "Anular gasto", anularMovimiento: "Anular movimiento" };

export default function CajaDialog({ tipo, caja, registro, onClose, onSuccess }) {
  const [importe, setImporte] = useState("");
  const [concepto, setConcepto] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [observacion, setObservacion] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const esAnulacion = tipo === "anularGasto" || tipo === "anularMovimiento";
  const esMovimiento = tipo === "aporte" || tipo === "retiro";
  const diferenciaEstimada = useMemo(() => {
    if (tipo !== "cerrar" || importe === "") return null;
    return Number(importe) - Number(caja?.resumen?.saldo_teorico || 0);
  }, [caja, importe, tipo]);

  const ejecutar = async () => {
    setGuardando(true);
    try {
      if (tipo === "abrir") await abrirCaja({ saldo_inicial: importe, observacion_apertura: observacion.trim() });
      if (tipo === "gasto") await registrarGasto(caja.id, { concepto: concepto.trim(), importe, metodo_pago: metodoPago, observacion: observacion.trim() });
      if (tipo === "aporte") await registrarAporte(caja.id, { importe, motivo: motivo.trim() });
      if (tipo === "retiro") await registrarRetiro(caja.id, { importe, motivo: motivo.trim() });
      if (tipo === "cerrar") await cerrarCaja(caja.id, { saldo_contado: importe, observacion_cierre: observacion.trim() });
      if (tipo === "anularGasto") await anularGasto(caja.id, registro.id, { motivo: motivo.trim() });
      if (tipo === "anularMovimiento") await anularMovimiento(caja.id, registro.id, { motivo: motivo.trim() });
      onSuccess(tipo === "cerrar" ? "Caja cerrada correctamente." : "Operación registrada correctamente.");
    } catch (requestError) { setError(mensajeDeError(requestError, "No pudimos completar la operación. Intentá nuevamente.")); } finally { setGuardando(false); }
  };

  const guardar = async (event) => {
    event.preventDefault();
    setError("");
    const valor = Number(importe);
    if (!esAnulacion && (!importe || Number.isNaN(valor) || valor < 0 || (tipo !== "abrir" && tipo !== "cerrar" && valor <= 0))) { setError(tipo === "abrir" || tipo === "cerrar" ? "Ingresá un importe válido que no sea negativo." : "El importe debe ser mayor que cero."); return; }
    if ((tipo === "gasto" && !concepto.trim()) || (esMovimiento && !motivo.trim()) || (esAnulacion && !motivo.trim())) { setError(esMovimiento || esAnulacion ? "Ingresá el motivo." : "Ingresá el concepto del gasto."); return; }
    if (tipo === "gasto" && metodoPago === "otro" && !observacion.trim()) { setError("Ingresá una observación para el método de pago Otro."); return; }
    if (tipo === "cerrar" && diferenciaEstimada !== null && diferenciaEstimada !== 0 && !observacion.trim()) { setError("Ingresá una observación cuando existe diferencia."); return; }
    if (["cerrar", "retiro", "anularGasto", "anularMovimiento"].includes(tipo)) { setConfirmando(true); return; }
    await ejecutar();
  };

  return (
    <div aria-modal="true" className="fixed inset-0 z-20 flex items-end bg-[#2f2528]/40 p-4 sm:items-center sm:justify-center" role="dialog" aria-labelledby="caja-dialog-titulo">
      <form className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onSubmit={guardar}>
        <header className="aura-dialog-header"><h2 className="text-2xl font-semibold" id="caja-dialog-titulo">{titulos[tipo]}</h2></header>
        <div className="space-y-4 py-5">
          {tipo === "abrir" && <><p className="text-sm text-[#6f5b60]">Abrí la caja antes de registrar cobros.</p><label className="grid gap-1">Saldo inicial<input autoFocus min="0" required step="0.01" type="number" value={importe} onChange={(event) => setImporte(event.target.value)} /></label><label className="grid gap-1">Observación opcional<textarea value={observacion} onChange={(event) => setObservacion(event.target.value)} /></label></>}
          {tipo === "gasto" && <><p className="text-sm text-[#6f5b60]">Solo los gastos en efectivo reducen el dinero físico esperado.</p><label className="grid gap-1">Concepto<input autoFocus required value={concepto} onChange={(event) => setConcepto(event.target.value)} /></label><label className="grid gap-1">Importe<input min="0.01" required step="0.01" type="number" value={importe} onChange={(event) => setImporte(event.target.value)} /></label><label className="grid gap-1">Método de pago<select value={metodoPago} onChange={(event) => setMetodoPago(event.target.value)}><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="tarjeta">Tarjeta</option><option value="otro">Otro</option></select></label><label className="grid gap-1">Observación{metodoPago === "otro" ? " (obligatoria)" : " opcional"}<textarea required={metodoPago === "otro"} value={observacion} onChange={(event) => setObservacion(event.target.value)} /></label></>}
          {esMovimiento && <><p className="text-sm text-[#6f5b60]">{tipo === "aporte" ? "Un aporte agrega dinero físico a la caja sin representar un cobro." : "Un retiro quita dinero físico de la caja sin representar un gasto."}</p><label className="grid gap-1">Importe<input autoFocus min="0.01" required step="0.01" type="number" value={importe} onChange={(event) => setImporte(event.target.value)} /></label><label className="grid gap-1">Motivo<textarea required value={motivo} onChange={(event) => setMotivo(event.target.value)} /></label></>}
          {tipo === "cerrar" && <><div className="rounded-xl bg-[#f4eff0] p-4 text-sm"><p>Saldo esperado: <strong>{dinero(caja?.resumen?.saldo_teorico)}</strong></p><p>Efectivo ingresado: <strong>{dinero(caja?.resumen?.cobros_por_metodo?.efectivo)}</strong></p><p>Gastos en efectivo: <strong>{dinero(caja?.resumen?.gastos_por_metodo?.efectivo)}</strong></p><p>Aportes: <strong>{dinero(caja?.resumen?.aportes)}</strong></p><p>Retiros: <strong>{dinero(caja?.resumen?.retiros)}</strong></p></div><label className="grid gap-1">Dinero contado<input autoFocus min="0" required step="0.01" type="number" value={importe} onChange={(event) => setImporte(event.target.value)} /></label>{diferenciaEstimada !== null && <p className="rounded-xl bg-[#f4eff0] p-3 text-sm">Diferencia estimada: <strong>{dinero(diferenciaEstimada)}</strong>{diferenciaEstimada === 0 ? " · Caja equilibrada" : diferenciaEstimada > 0 ? " · Sobrante" : " · Faltante"}</p>}<label className="grid gap-1">Observación{diferenciaEstimada !== null && diferenciaEstimada !== 0 ? " (obligatoria)" : " opcional"}<textarea required={diferenciaEstimada !== null && diferenciaEstimada !== 0} value={observacion} onChange={(event) => setObservacion(event.target.value)} /></label></>}
          {esAnulacion && <><p className="text-sm text-[#6f5b60]">{registro?.concepto || registro?.tipo_display} · {dinero(registro?.importe)}</p><label className="grid gap-1">Motivo de anulación<textarea autoFocus required value={motivo} onChange={(event) => setMotivo(event.target.value)} /></label></>}
          {error && <p className="rounded-xl bg-[#fff4f5] p-3 text-sm text-[#8b3f4c]">{error}</p>}
        </div>
        <footer className="aura-dialog-footer"><button className="aura-action aura-action-secondary" disabled={guardando} type="button" onClick={onClose}>Cancelar</button><button className={`aura-action ${tipo === "cerrar" || esAnulacion ? "aura-action-destructive" : "aura-action-primary"}`} disabled={guardando} type="submit">{guardando ? "Guardando..." : esAnulacion ? "Confirmar anulación" : tipo === "cerrar" ? "Confirmar cierre" : tipo === "abrir" ? "Confirmar apertura" : "Confirmar"}</button></footer>
      </form>
      <ConfirmDialog open={confirmando} title={tipo === "cerrar" ? "¿Cerrar la caja?" : tipo === "retiro" ? "¿Registrar este retiro?" : "¿Anular este movimiento?"} description={tipo === "cerrar" ? "Se registrará el cierre de la jornada con el efectivo contado y la diferencia calculada." : tipo === "retiro" ? "El importe se descontará del efectivo disponible en la caja." : "El movimiento dejará de considerarse activo y la anulación quedará registrada."} details={tipo === "cerrar" ? `Efectivo contado: ${dinero(importe)}` : `${registro?.concepto || registro?.tipo_display || "Retiro"} · ${dinero(tipo === "retiro" ? importe : registro?.importe)}`} confirmLabel={tipo === "cerrar" ? "Cerrar caja" : tipo === "retiro" ? "Registrar retiro" : "Anular movimiento"} destructive={tipo !== "retiro"} isProcessing={guardando} onClose={() => setConfirmando(false)} onConfirm={async () => { setConfirmando(false); await ejecutar(); }} />
    </div>
  );
}

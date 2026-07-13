import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { anularCobro, obtenerCobro } from "../api/cobros.js";
import AppHeader from "../components/AppHeader.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

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
  const [cobro, setCobro] = useState(null);
  const [error, setError] = useState("");
  const [mostrarAnulacion, setMostrarAnulacion] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [anulando, setAnulando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(location.state?.message || "");
  const [confirmingAnulacion, setConfirmingAnulacion] = useState(false);

  const cargarCobro = useCallback(async () => {
    setError("");
    try { setCobro(await obtenerCobro(id)); } catch (requestError) { setError(requestError.response?.status === 404 ? "No encontramos este cobro." : "No pudimos cargar el cobro."); }
  }, [id]);
  useEffect(() => { cargarCobro(); }, [cargarCobro]);

  const confirmarAnulacion = async (event) => {
    event.preventDefault();
    setError("");
    if (!motivo.trim()) { setError("Ingresá el motivo de anulación."); return; }
    setAnulando(true);
    try { setCobro(await anularCobro(id, { motivo: motivo.trim() })); setMostrarAnulacion(false); setMotivo(""); setMensajeExito("Cobro anulado correctamente."); } catch (requestError) { setError(mensajeDeError(requestError, "No pudimos anular el cobro. Intentá nuevamente.")); } finally { setAnulando(false); }
  };

  if (!cobro) return <main className="min-h-screen bg-[#fff8f7]"><AppHeader /><section className="p-8"><p>{error || "Cargando cobro..."}</p>{error && <Link className="mt-3 aura-action aura-action-contextual" to="/cobros">Volver a mis cobros</Link>}</section></main>;

  return (
    <main className="min-h-screen bg-[#fff8f7] text-[#3d2f32]">
      <AppHeader />
      <section className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <Link className="aura-action aura-action-contextual" to="/cobros">← Volver a mis cobros</Link>
        {mensajeExito && <p className="mt-4 rounded-xl bg-[#eef8f0] p-3 text-[#356640]">{mensajeExito}</p>}
        <article className="mt-5 rounded-2xl border border-[#f1dce4] bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-[#6f5b60]">Comprobante #{cobro.id}</p><h1 className="mt-1 text-3xl font-semibold">Cobro de {cobro.clienta_nombre_historica}</h1></div><span className={cobro.estado === "anulado" ? "rounded-full bg-[#f1e4e6] px-3 py-1 font-semibold text-[#8b3f4c]" : "rounded-full bg-[#e7f5ea] px-3 py-1 font-semibold text-[#356640]"}>{cobro.estado_display}</span></div>
          <section className="mt-6 grid gap-4 sm:grid-cols-[1.35fr_1fr]"><div className="aura-financial-summary aura-financial-featured"><p className="text-sm font-semibold text-[#654552]">Importe</p><p className="mt-2 aura-amount-primary">{dinero(cobro.importe)}</p></div><div className="aura-financial-summary"><p className="text-sm text-[#6f5b60]">Método de pago</p><p className="mt-1 font-semibold">{cobro.metodo_pago_display}{cobro.detalle_metodo ? ` · ${cobro.detalle_metodo}` : ""}</p><p className="mt-3 text-sm text-[#6f5b60]">Registrado: {fechaHora(cobro.creado_en)}</p></div></section>
          <section className="mt-6 rounded-xl border border-[#e5dce2] bg-[#fbf9f8] p-5"><p className="text-sm font-semibold text-[#654552]">Turno relacionado</p><p className="mt-2 font-semibold">{fechaHora(cobro.turno.inicio)} · {cobro.turno.duracion_total_minutos} min</p><p className="mt-2 text-sm">{cobro.servicios.map((servicio) => servicio.nombre).join(", ")}</p></section>
          {cobro.estado === "anulado" && <div className="mt-5 rounded-xl bg-[#fff4f5] p-4"><p className="font-semibold">Cobro anulado</p><p>{cobro.motivo_anulacion}</p><p className="mt-2 text-sm">{fechaHora(cobro.anulado_en)}</p></div>}
          {error && <p className="mt-4 text-[#8b3f4c]">{error}</p>}
          <section className="aura-financial-section mt-7"><h2 className="text-lg font-semibold">Acciones</h2><div className="mt-4 flex flex-wrap gap-3"><Link className="aura-action aura-action-secondary" to={`/turnos/${cobro.turno.id}`}>Ver turno relacionado</Link>{cobro.puede_anularse && !mostrarAnulacion && <button className="aura-action aura-action-destructive" type="button" onClick={() => setMostrarAnulacion(true)}>Anular cobro</button>}</div></section>
          {cobro.puede_anularse && mostrarAnulacion && <form className="mt-5 rounded-xl border border-[#e7c5ca] p-4" onSubmit={(event) => { event.preventDefault(); if (!motivo.trim()) { setError("Ingresá el motivo de anulación."); return; } setConfirmingAnulacion(true); }}><label className="grid gap-1">Motivo de anulación<textarea required value={motivo} onChange={(event) => setMotivo(event.target.value)} /></label><div className="mt-4 flex flex-wrap gap-3"><button disabled={anulando} className="aura-action aura-action-destructive" type="submit">Confirmar anulación</button><button disabled={anulando} className="aura-action aura-action-secondary" type="button" onClick={() => setMostrarAnulacion(false)}>Cancelar</button></div></form>}
        </article>
      </section>
      <ConfirmDialog open={confirmingAnulacion} title="¿Anular este cobro?" description="El cobro dejará de considerarse activo y la anulación quedará registrada." confirmLabel="Anular cobro" destructive isProcessing={anulando} onClose={() => setConfirmingAnulacion(false)} onConfirm={async () => { setConfirmingAnulacion(false); await confirmarAnulacion({ preventDefault() {} }); }} />
    </main>
  );
}

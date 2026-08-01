import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { anularCobro, obtenerCobro } from "../api/cobros.js";
import AppHeader from "../components/AppHeader.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import FieldError from "../components/FieldError.jsx";

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
          {error && <p className="mt-4 text-[#8b3f4c]" role="alert">{error}</p>}
          <section className="aura-financial-section mt-7"><h2 className="text-lg font-semibold">Acciones</h2><div className="mt-4 flex flex-wrap gap-3"><Link className="aura-action aura-action-secondary" to={`/turnos/${cobro.turno.id}`}>Ver turno relacionado</Link>{cobro.puede_anularse && !mostrarAnulacion && <button className="aura-action aura-action-destructive" type="button" onClick={() => { setMostrarAnulacion(true); setError(""); }}>Anular cobro</button>}</div></section>
          {cobro.puede_anularse && mostrarAnulacion && (
            <form className="mt-5 rounded-xl border border-[#e7c5ca] p-4" onSubmit={solicitarAnulacion} noValidate>
              <label className="grid gap-1" htmlFor="motivo-anulacion">Motivo de anulación</label>
              <textarea id="motivo-anulacion" ref={motivoRef} required maxLength={250} aria-invalid={Boolean(errorMotivo)} aria-describedby={errorMotivo ? "motivo-anulacion-error" : "motivo-anulacion-ayuda"} className={errorMotivo ? "field-invalid" : ""} value={motivo} disabled={anulando} onChange={(event) => { setMotivo(event.target.value); setErrorMotivo(""); }} />
              <p id="motivo-anulacion-ayuda" className="mt-1 text-xs text-muted-foreground">Explicá brevemente por qué se anula. Entre 5 y 250 caracteres.</p>
              <FieldError id="motivo-anulacion-error" message={errorMotivo} />
              <div className="mt-4 flex flex-wrap gap-3"><button disabled={anulando} className="aura-action aura-action-destructive" type="submit">Anular cobro</button><button disabled={anulando} className="aura-action aura-action-secondary" type="button" onClick={cancelarFormulario}>Cancelar</button></div>
            </form>
          )}
        </article>
      </section>
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
    </main>
  );
}

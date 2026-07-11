import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { anularCobro, obtenerCobro } from "../api/cobros.js";
import AppHeader from "../components/AppHeader.jsx";

const dinero = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(value);
const fechaHora = (value) => new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));

function mensajeDeError(error, predeterminado) {
  const data = error.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  for (const value of Object.values(data || {})) {
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  }
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

  const cargarCobro = useCallback(async () => {
    setError("");
    try {
      setCobro(await obtenerCobro(id));
    } catch (requestError) {
      setError(requestError.response?.status === 404 ? "No encontramos este cobro." : "No pudimos cargar el cobro.");
    }
  }, [id]);

  useEffect(() => {
    cargarCobro();
  }, [cargarCobro]);

  const confirmarAnulacion = async (event) => {
    event.preventDefault();
    setError("");
    if (!motivo.trim()) {
      setError("Ingresá el motivo de anulación.");
      return;
    }
    if (!window.confirm("El cobro quedará anulado y se conservará en el historial.")) return;

    setAnulando(true);
    try {
      setCobro(await anularCobro(id, { motivo: motivo.trim() }));
      setMostrarAnulacion(false);
      setMotivo("");
      setMensajeExito("Cobro anulado correctamente.");
    } catch (requestError) {
      setError(mensajeDeError(requestError, "No pudimos anular el cobro. Intentá nuevamente."));
    } finally {
      setAnulando(false);
    }
  };

  if (!cobro) {
    return <main className="min-h-screen bg-[#fff8f7]"><AppHeader /><section className="p-8"><p>{error || "Cargando cobro..."}</p>{error && <Link className="mt-3 inline-block" to="/cobros">Volver a mis cobros</Link>}</section></main>;
  }

  return (
    <main className="min-h-screen bg-[#fff8f7] text-[#3d2f32]">
      <AppHeader />
      <section className="mx-auto max-w-3xl px-5 py-8">
        <Link to="/cobros">Volver a mis cobros</Link>
        {mensajeExito && <p className="mt-4 rounded-xl bg-[#eef8f0] p-3 text-[#356640]">{mensajeExito}</p>}
        <article className="mt-5 rounded-2xl border bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h1 className="text-3xl font-semibold">Cobro de {cobro.clienta_nombre_historica}</h1><p>#{cobro.id}</p></div>
            <span className={cobro.estado === "anulado" ? "rounded-full bg-[#f1e4e6] px-3 py-1 font-semibold text-[#8b3f4c]" : "rounded-full bg-[#e7f5ea] px-3 py-1 font-semibold text-[#356640]"}>{cobro.estado_display}</span>
          </div>
          <p className="mt-5 text-2xl font-semibold">{dinero(cobro.importe)}</p>
          <p>{cobro.metodo_pago_display}{cobro.detalle_metodo ? ` · ${cobro.detalle_metodo}` : ""}</p>
          <p className="mt-4">Registrado: {fechaHora(cobro.creado_en)}</p>
          <p>Turno: {fechaHora(cobro.turno.inicio)} · {cobro.turno.duracion_total_minutos} min</p>
          <p>{cobro.servicios.map((servicio) => servicio.nombre).join(", ")}</p>
          {cobro.estado === "anulado" && <div className="mt-5 rounded-xl bg-[#fff4f5] p-4"><p className="font-semibold">Cobro anulado</p><p>{cobro.motivo_anulacion}</p><p className="text-sm">{fechaHora(cobro.anulado_en)}</p></div>}
          {error && <p className="mt-4 text-[#8b3f4c]">{error}</p>}
          <div className="mt-6 flex flex-wrap gap-3"><Link className="font-semibold underline" to={`/turnos/${cobro.turno.id}`}>Ver turno relacionado</Link>{cobro.puede_anularse && !mostrarAnulacion && <button type="button" onClick={() => setMostrarAnulacion(true)}>Anular cobro</button>}</div>
          {cobro.puede_anularse && mostrarAnulacion && <form className="mt-5 space-y-3 rounded-xl border border-[#e7c5ca] p-4" onSubmit={confirmarAnulacion}><label className="grid gap-1">Motivo de anulación<textarea required value={motivo} onChange={(event) => setMotivo(event.target.value)} /></label><div className="flex gap-3"><button disabled={anulando} className="bg-[#8b3f4c] text-white" type="submit">{anulando ? "Anulando..." : "Confirmar anulación"}</button><button disabled={anulando} type="button" onClick={() => setMostrarAnulacion(false)}>Cancelar</button></div></form>}
        </article>
      </section>
    </main>
  );
}

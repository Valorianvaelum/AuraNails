import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listarCobros } from "../api/cobros.js";
import AppHeader from "../components/AppHeader.jsx";

const dinero = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(value);
const fechaHora = (value) => new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const claseEstado = (estado) => estado === "anulado"
  ? "rounded-full bg-[#f1e4e6] px-2 py-1 text-xs font-semibold text-[#8b3f4c]"
  : "rounded-full bg-[#e7f5ea] px-2 py-1 text-xs font-semibold text-[#356640]";

function mensajeDeError(error, predeterminado) {
  const data = error.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  return predeterminado;
}

export default function CobrosPage() {
  const [fecha, setFecha] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [estado, setEstado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [cobros, setCobros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const tieneFiltros = Boolean(fecha || metodoPago || estado || busqueda.trim());

  const cargarCobros = useCallback(async () => {
    const params = {};
    if (fecha) params.fecha = fecha;
    if (metodoPago) params.metodo_pago = metodoPago;
    if (estado) params.estado = estado;
    if (busqueda.trim()) params.search = busqueda.trim();

    setCargando(true);
    setError("");
    try {
      setCobros(await listarCobros(params));
    } catch (requestError) {
      setCobros([]);
      setError(mensajeDeError(requestError, "No pudimos cargar tus cobros. Intentá nuevamente."));
    } finally {
      setCargando(false);
    }
  }, [busqueda, estado, fecha, metodoPago]);

  useEffect(() => {
    cargarCobros();
  }, [cargarCobros]);

  const limpiarFiltros = () => {
    setFecha("");
    setMetodoPago("");
    setEstado("");
    setBusqueda("");
  };

  return (
    <main className="min-h-screen bg-[#fff4f7] text-[#3d2f32]">
      <AppHeader />
      <section className="mx-auto max-w-4xl px-5 py-8">
        <h1 className="text-3xl font-semibold">Mis cobros</h1>
        <div className="mt-5 grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium">
            Buscar clienta
            <input placeholder="Nombre de clienta" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Fecha de cobro
            <input type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Método de pago
            <select value={metodoPago} onChange={(event) => setMetodoPago(event.target.value)}>
              <option value="">Todos</option>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="otro">Otro</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Estado
            <select value={estado} onChange={(event) => setEstado(event.target.value)}>
              <option value="">Todos</option>
              <option value="registrado">Registrados</option>
              <option value="anulado">Anulados</option>
            </select>
          </label>
          {tieneFiltros && <button className="justify-self-start" type="button" onClick={limpiarFiltros}>Limpiar filtros</button>}
        </div>

        {cargando && <p className="mt-5">Cargando cobros...</p>}
        {error && <div className="mt-5 rounded-xl border border-[#e7c5ca] bg-white p-4"><p className="text-[#8b3f4c]">{error}</p><button className="mt-3" type="button" onClick={cargarCobros}>Reintentar</button></div>}
        {!cargando && !error && (
          <div className="mt-5 grid gap-3">
            {cobros.map((cobro) => (
              <article className="rounded-2xl border bg-white p-5" key={cobro.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{cobro.clienta_nombre_historica}</h2>
                    <p>{dinero(cobro.importe)} · {cobro.metodo_pago_display}</p>
                    <p className="text-sm text-[#6f5b60]">Cobrado: {fechaHora(cobro.creado_en)} · Turno #{cobro.turno.id}</p>
                  </div>
                  <span className={claseEstado(cobro.estado)}>{cobro.estado_display}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link className="font-semibold underline" to={`/cobros/${cobro.id}`}>Ver detalle</Link>
                  <Link className="font-semibold underline" to={`/turnos/${cobro.turno.id}`}>Ver turno</Link>
                </div>
              </article>
            ))}
            {!cobros.length && <div className="rounded-2xl border border-dashed border-[#f1dce4] bg-white p-6 text-center"><p>{tieneFiltros ? "No encontramos cobros con los filtros seleccionados." : "Todavía no tenés cobros registrados."}</p>{!tieneFiltros && <><p className="mt-2 text-sm text-[#6f5b60]">Los cobros se registran desde un turno marcado como realizado.</p><Link className="mt-3 inline-block font-semibold underline" to="/turnos">Ver turnos</Link></>}</div>}
          </div>
        )}
      </section>
    </main>
  );
}

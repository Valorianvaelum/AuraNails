import { useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";

import { listarTurnos } from "../api/turnos.js";
import AppHeader from "../components/AppHeader.jsx";
import TurnoDetailPage from "./TurnoDetailPage.jsx";
import TurnoFormPage from "./TurnoFormPage.jsx";
import TurnoReprogramarPage from "./TurnoReprogramarPage.jsx";

const hoy = () => new Date().toLocaleDateString("en-CA");
const hora = (value) => new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
const dinero = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
const claseEstado = (estado) => estado === "no_vino"
  ? "rounded-full bg-[#f9e5b8] px-2 py-1 text-xs font-semibold text-[#74520d]"
  : "text-sm";

function ListaTurnos() {
  const [fecha, setFecha] = useState(hoy());
  const [estado, setEstado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError("");

    listarTurnos({ fecha, estado, search: busqueda.trim() })
      .then((data) => {
        if (vigente) setTurnos(data);
      })
      .catch(() => {
        if (vigente) {
          setTurnos([]);
          setError("No pudimos cargar tus turnos. Intentá nuevamente.");
        }
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [busqueda, estado, fecha]);

  const moverDia = (cantidad) => {
    const proximaFecha = new Date(`${fecha}T12:00:00`);
    proximaFecha.setDate(proximaFecha.getDate() + cantidad);
    setFecha(proximaFecha.toLocaleDateString("en-CA"));
  };

  return (
    <main className="min-h-screen bg-[#fff8f7] text-[#3d2f32]">
      <AppHeader />
      <section className="mx-auto max-w-4xl px-5 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold">Mis turnos</h1>
          <Link className="rounded-xl bg-[#b76e79] px-4 py-2 font-semibold text-white" to="nuevo">
            Nuevo turno
          </Link>
        </div>

        <div className="mt-5 grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => moverDia(-1)}>Día anterior</button>
            <button type="button" onClick={() => setFecha(hoy())}>Hoy</button>
            <button type="button" onClick={() => moverDia(1)}>Día siguiente</button>
          </div>
          <label className="grid gap-1 text-sm font-medium">
            Día
            <input type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Estado
            <select value={estado} onChange={(event) => setEstado(event.target.value)}>
              <option value="">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="confirmado">Confirmados</option>
              <option value="reprogramado">Reprogramados</option>
              <option value="cancelado">Cancelados</option>
              <option value="realizado">Realizados</option>
              <option value="no_vino">No vinieron</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Buscar clienta
            <input
              placeholder="Nombre o teléfono"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </label>
        </div>

        {cargando && <p className="mt-5">Cargando turnos...</p>}
        {error && <p className="mt-5 text-[#8b3f4c]">{error}</p>}
        {!cargando && !error && (
          <div className="mt-5 grid gap-3">
            {turnos.map((turno) => (
              <Link className="rounded-xl border bg-white p-4" to={`${turno.id}`} key={turno.id}>
                <b>{hora(turno.inicio)} – {hora(turno.fin)} · {turno.clienta.nombre_completo}</b>
                <p>{turno.servicios.map((servicio) => servicio.nombre).join(", ")}</p>
                <p>{turno.duracion_legible} · {dinero(turno.precio_estimado)} · <span className={claseEstado(turno.estado)}>{turno.estado_display}</span></p>
              </Link>
            ))}
            {!turnos.length && (
              <p>
                {busqueda
                  ? "No encontramos turnos para esa búsqueda."
                  : estado
                    ? "No encontramos turnos con ese estado."
                    : "No tenés turnos para este día."}
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default function TurnosPage() {
  return (
    <Routes>
      <Route index element={<ListaTurnos />} />
      <Route path="nuevo" element={<TurnoFormPage />} />
      <Route path=":id/editar" element={<TurnoFormPage />} />
      <Route path=":id/reprogramar" element={<TurnoReprogramarPage />} />
      <Route path=":id" element={<TurnoDetailPage />} />
    </Routes>
  );
}

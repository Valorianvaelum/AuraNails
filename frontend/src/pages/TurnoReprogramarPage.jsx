import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { obtenerTurno, reprogramarTurno } from "../api/turnos.js";
import AppHeader from "../components/AppHeader.jsx";

function mensajeDeError(error, predeterminado) {
  const data = error.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.inicio?.[0] === "string") return data.inicio[0];
  return predeterminado;
}

export default function TurnoReprogramarPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [turno, setTurno] = useState(null);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vigente = true;
    obtenerTurno(id)
      .then((data) => {
        if (!vigente) return;
        setTurno(data);
        setFecha(data.inicio.slice(0, 10));
        setHora(data.inicio.slice(11, 16));
      })
      .catch((requestError) => {
        if (vigente) setError(mensajeDeError(requestError, "No encontramos este turno."));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [id]);

  const guardar = async (event) => {
    event.preventDefault();
    setError("");
    setGuardando(true);
    try {
      await reprogramarTurno(id, { inicio: `${fecha}T${hora}:00-03:00` });
      navigate(`/turnos/${id}`, { state: { message: "Turno reprogramado." } });
    } catch (requestError) {
      setError(mensajeDeError(requestError, "No pudimos reprogramar el turno."));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fff8f7] text-[#3d2f32]">
      <AppHeader />
      <section className="mx-auto max-w-xl px-5 py-8">
        <Link to={`/turnos/${id}`}>Volver</Link>
        <h1 className="mt-4 text-3xl font-semibold">Reprogramar turno</h1>
        {cargando && <p className="mt-5">Cargando turno...</p>}
        {!cargando && error && <p className="mt-5 text-[#8b3f4c]">{error}</p>}
        {!cargando && turno && ["cancelado", "realizado", "no_vino"].includes(turno.estado) && (
          <p className="mt-5">Este turno ya no puede reprogramarse.</p>
        )}
        {!cargando && turno && !["cancelado", "realizado", "no_vino"].includes(turno.estado) && (
          <form className="mt-5 space-y-4 rounded-2xl border bg-white p-6" onSubmit={guardar}>
            <p>{turno.clienta.nombre_completo} · {turno.servicios.map((servicio) => servicio.nombre).join(", ")}</p>
            <p>Duración: {turno.duracion_legible}</p>
            <label className="grid gap-1">
              Nueva fecha
              <input className="w-full rounded-xl border p-3" required type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} />
            </label>
            <label className="grid gap-1">
              Nueva hora
              <input className="w-full rounded-xl border p-3" required type="time" value={hora} onChange={(event) => setHora(event.target.value)} />
            </label>
            {error && <p className="text-[#8b3f4c]">{error}</p>}
            <button disabled={guardando} className="rounded-xl bg-[#b76e79] px-5 py-3 text-white">
              {guardando ? "Reprogramando..." : "Guardar nueva fecha"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

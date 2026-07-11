import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { cancelarTurno, confirmarTurno, marcarNoVino, obtenerTurno, realizarTurno } from "../api/turnos.js";
import AppHeader from "../components/AppHeader.jsx";

const dinero = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
const hora = (value) => new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
const claseEstado = (estado) => estado === "no_vino"
  ? "inline-block rounded-full bg-[#f9e5b8] px-2 py-1 text-sm font-semibold text-[#74520d]"
  : "inline-block text-sm";

function mensajeDeError(error, predeterminado) {
  const data = error.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.inicio?.[0] === "string") return data.inicio[0];
  return predeterminado;
}

export default function TurnoDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [turno, setTurno] = useState(null);
  const [error, setError] = useState("");
  const [accion, setAccion] = useState("");

  const cargarTurno = useCallback(async () => {
    setTurno(null);
    setError("");
    try {
      setTurno(await obtenerTurno(id));
    } catch (requestError) {
      setError(requestError.response?.status === 404 ? "No encontramos este turno." : "No pudimos cargar el turno.");
    }
  }, [id]);

  useEffect(() => {
    cargarTurno();
  }, [cargarTurno]);

  const ejecutarAccion = async (nombre, accionApi, confirmacion) => {
    if (confirmacion && !window.confirm(confirmacion)) return;
    setAccion(nombre);
    setError("");
    try {
      await accionApi(id);
      await cargarTurno();
    } catch (requestError) {
      setError(mensajeDeError(requestError, "No pudimos actualizar el turno. Intentá nuevamente."));
    } finally {
      setAccion("");
    }
  };

  if (!turno) {
    return (
      <main className="min-h-screen bg-[#fff8f7]">
        <AppHeader />
        <section className="p-8">
          <p>{error || "Cargando turno..."}</p>
          {error && <Link className="mt-3 inline-block" to="/turnos">Volver a mis turnos</Link>}
        </section>
      </main>
    );
  }

  const sePuedeEditar = ["pendiente", "confirmado", "reprogramado"].includes(turno.estado);
  const turnoYaInicio = new Date(turno.inicio) <= new Date();
  const noVinoPendienteDeHorario = sePuedeEditar && !turnoYaInicio;
  const avisoExito = location.state?.message;

  return (
    <main className="min-h-screen bg-[#fff8f7] text-[#3d2f32]">
      <AppHeader />
      <section className="mx-auto max-w-3xl px-5 py-8">
        <Link to="/turnos">Volver a mis turnos</Link>
        {avisoExito && <p className="mt-4 rounded-xl bg-[#eef8f0] p-3 text-[#356640]">{avisoExito}</p>}
        <article className="mt-5 rounded-2xl border bg-white p-6">
          <h1 className="text-3xl font-semibold">{turno.clienta.nombre_completo}</h1>
          <p><span className={claseEstado(turno.estado)}>{turno.estado_display}</span></p>
          <p>{turno.clienta.telefono || "Sin teléfono"}</p>
          <p>{new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(new Date(`${turno.inicio.slice(0, 10)}T12:00:00`))}</p>
          <p>{hora(turno.inicio)} – {hora(turno.fin)}</p>
          <p>{turno.servicios.map((servicio) => servicio.nombre).join(", ")}</p>
          <p>{turno.duracion_legible} · {dinero(turno.precio_estimado)}</p>
          <p>{turno.notas || "Sin notas."}</p>
          <p className="text-sm">Creado: {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(turno.creado_en))}</p>
          {error && <p className="mt-3 text-[#8b3f4c]">{error}</p>}
          {noVinoPendienteDeHorario && (
            <p className="mt-3 text-sm text-[#6f5b60]">
              La opción “No vino” estará disponible después del horario de inicio.
            </p>
          )}
          {sePuedeEditar && (
            <div className="mt-5 flex flex-wrap gap-3">
              {turno.estado !== "confirmado" && (
                <button disabled={Boolean(accion)} onClick={() => ejecutarAccion("confirmar", confirmarTurno)}>
                  {accion === "confirmar" ? "Confirmando..." : "Confirmar"}
                </button>
              )}
              <Link to={`/turnos/${id}/editar`}>Editar</Link>
              <Link to={`/turnos/${id}/reprogramar`}>Reprogramar</Link>
              <button disabled={Boolean(accion)} onClick={() => ejecutarAccion("cancelar", cancelarTurno, "El turno quedará cancelado, pero conservarás toda su información.")}>
                {accion === "cancelar" ? "Cancelando..." : "Cancelar"}
              </button>
              {turnoYaInicio && (
                <button disabled={Boolean(accion)} onClick={() => ejecutarAccion("no-vino", marcarNoVino, "Marcá este turno como no vino solo si la clienta no se presentó.")}>
                  {accion === "no-vino" ? "Guardando..." : "Marcar como no vino"}
                </button>
              )}
              {turnoYaInicio && ["confirmado", "reprogramado"].includes(turno.estado) && (
                <button disabled={Boolean(accion)} onClick={() => ejecutarAccion("realizar", realizarTurno, "Marcá el turno como realizado cuando el trabajo haya finalizado.")}>
                  {accion === "realizar" ? "Marcando como realizado..." : "Marcar como realizado"}
                </button>
              )}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

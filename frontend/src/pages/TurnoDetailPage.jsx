import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { obtenerCajaAbierta } from "../api/caja.js";
import { cancelarTurno, confirmarTurno, marcarNoVino, obtenerTurno, realizarTurno } from "../api/turnos.js";
import AppHeader from "../components/AppHeader.jsx";

const dinero = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
const hora = (value) => new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
const claseEstado = (estado) => estado === "no_vino" ? "inline-block rounded-full bg-[#f9e5b8] px-2 py-1 text-sm font-semibold text-[#74520d]" : "inline-block text-sm";

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
  const [cajaAbierta, setCajaAbierta] = useState(undefined);
  const [error, setError] = useState("");
  const [accion, setAccion] = useState("");

  const cargarTurno = useCallback(async () => {
    setTurno(null);
    setError("");
    try {
      const turnoActual = await obtenerTurno(id);
      setTurno(turnoActual);
      if (turnoActual.estado === "realizado" && turnoActual.puede_registrar_cobro) {
        setCajaAbierta(await obtenerCajaAbierta());
      } else {
        setCajaAbierta(null);
      }
    } catch (requestError) {
      setError(requestError.response?.status === 404 ? "No encontramos este turno." : "No pudimos cargar el turno.");
    }
  }, [id]);

  useEffect(() => { cargarTurno(); }, [cargarTurno]);

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

  if (!turno) return <main className="min-h-screen bg-[#fff4f7]"><AppHeader /><section className="p-8"><p>{error || "Cargando turno..."}</p>{error && <Link className="mt-3 inline-block" to="/turnos">Volver a mis turnos</Link>}</section></main>;

  const estadoAbierto = ["pendiente", "confirmado", "reprogramado"].includes(turno.estado);
  const turnoYaInicio = new Date(turno.inicio) <= new Date();
  const puedeConfirmar = ["pendiente", "reprogramado"].includes(turno.estado);
  const puedeRealizar = turnoYaInicio && ["confirmado", "reprogramado"].includes(turno.estado);
  const puedeNoVino = turnoYaInicio && estadoAbierto;
  const puedeCobrar = turno.estado === "realizado" && turno.puede_registrar_cobro;
  const cobroActivo = turno.cobro_activo;

  return <main className="min-h-screen bg-[#fff4f7] text-[#3d2f32]"><AppHeader /><section className="mx-auto max-w-3xl px-5 py-8"><Link to="/turnos">Volver a mis turnos</Link>{location.state?.message && <p className="mt-4 rounded-xl bg-[#eef8f0] p-3 text-[#356640]">{location.state.message}</p>}<article className="mt-5 rounded-2xl border border-[#f1dce4] bg-white p-6"><h1 className="text-3xl font-semibold">{turno.clienta.nombre_completo}</h1><p><span className={claseEstado(turno.estado)}>{turno.estado_display}</span></p><p>{turno.clienta.telefono || "Sin teléfono"}</p><p>{new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(new Date(`${turno.inicio.slice(0, 10)}T12:00:00`))}</p><p>{hora(turno.inicio)} – {hora(turno.fin)}</p><p>{turno.servicios.map((servicio) => servicio.nombre).join(", ")}</p><p>{turno.duracion_legible} · {dinero(turno.precio_estimado)}</p><p>{turno.notas || "Sin notas."}</p><p className="text-sm">Creado: {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(turno.creado_en))}</p>{error && <p className="mt-3 text-[#8b3f4c]">{error}</p>}<section className="mt-6 rounded-2xl bg-[#fff4f7] p-5"><h2 className="text-xl font-semibold">Acciones del turno</h2>{!estadoAbierto && turno.estado !== "realizado" && <p className="mt-2 text-sm text-[#6f5b60]">Este turno está cerrado y no admite más acciones.</p>}{estadoAbierto && <><div className="mt-4 flex flex-wrap gap-3">{puedeConfirmar && <button disabled={Boolean(accion)} onClick={() => ejecutarAccion("confirmar", confirmarTurno)}>{accion === "confirmar" ? "Confirmando..." : "Confirmar"}</button>}<Link to={`/turnos/${id}/editar`}>Editar datos</Link><Link to={`/turnos/${id}/reprogramar`}>Reprogramar</Link><button disabled={Boolean(accion)} onClick={() => ejecutarAccion("cancelar", cancelarTurno, "El turno quedará cancelado, pero conservarás toda su información.")}>{accion === "cancelar" ? "Cancelando..." : "Cancelar"}</button>{puedeNoVino && <button disabled={Boolean(accion)} onClick={() => ejecutarAccion("no-vino", marcarNoVino, "Marcá este turno como no vino solo si la clienta no se presentó.")}>{accion === "no-vino" ? "Guardando..." : "Marcar como no vino"}</button>}{puedeRealizar && <button className="bg-[#b76e79] text-white" disabled={Boolean(accion)} onClick={() => ejecutarAccion("realizar", realizarTurno, "Marcá el turno como realizado cuando el trabajo haya finalizado.")}>{accion === "realizar" ? "Marcando como realizado..." : "Marcar como realizado"}</button>}</div>{!turnoYaInicio && <p className="mt-4 text-sm text-[#6f5b60]">Podrás marcar este turno como realizado o no vino después de su horario de inicio.</p>}</>}{turno.estado === "realizado" && <div className="mt-4 rounded-xl bg-white p-4">{cobroActivo ? <><p className="font-semibold text-[#356640]">Cobrado</p><p className="text-sm">{dinero(cobroActivo.importe)}</p><Link className="mt-2 inline-block font-semibold underline" to={`/cobros/${cobroActivo.id}`}>Ver cobro</Link></> : puedeCobrar && cajaAbierta === undefined ? <p className="text-sm text-[#6f5b60]">Comprobando la caja para registrar el cobro...</p> : puedeCobrar && !cajaAbierta ? <><p className="font-semibold">Debés abrir la caja antes de registrar un cobro.</p><Link className="mt-2 inline-block font-semibold underline" to="/caja">Ir a Caja</Link></> : puedeCobrar ? <><p className="font-semibold">El servicio fue realizado. Ahora podés registrar el cobro.</p><Link className="mt-3 inline-block rounded-xl bg-[#b76e79] px-4 py-2 font-semibold text-white" to={`/cobros/nuevo?turno=${id}`}>Registrar cobro</Link></> : <p>No pudimos determinar la disponibilidad de cobro.</p>}</div>}</section></article></section></main>;
}

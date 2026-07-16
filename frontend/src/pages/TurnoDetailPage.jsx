import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { obtenerCajaAbierta } from "../api/caja.js";
import { cancelarTurno, confirmarTurno, marcarNoVino, obtenerTurno, realizarTurno } from "../api/turnos.js";
import AppHeader from "../components/AppHeader.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const dinero = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
const hora = (value) => new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
const claseEstado = (estado) => ({ pendiente: "ui-badge ui-badge-pending", confirmado: "ui-badge ui-badge-confirmed", reprogramado: "ui-badge ui-badge-rescheduled", realizado: "ui-badge ui-badge-success", cancelado: "ui-badge ui-badge-neutral", no_vino: "ui-badge ui-badge-no-show" }[estado] || "ui-badge ui-badge-neutral");

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
  const [confirmacion, setConfirmacion] = useState(null);
  const cargarTurno = useCallback(async () => {
    setTurno(null); setError("");
    try { const turnoActual = await obtenerTurno(id); setTurno(turnoActual); setCajaAbierta(turnoActual.estado === "realizado" && turnoActual.puede_registrar_cobro ? await obtenerCajaAbierta() : null); } catch (requestError) { setError(requestError.response?.status === 404 ? "No encontramos este turno." : "No pudimos cargar el turno."); }
  }, [id]);
  useEffect(() => { cargarTurno(); }, [cargarTurno]);
  const ejecutarAccion = async (nombre, accionApi) => { setAccion(nombre); setError(""); try { await accionApi(id); await cargarTurno(); } catch (requestError) { setError(mensajeDeError(requestError, "No pudimos actualizar el turno. Intentá nuevamente.")); } finally { setAccion(""); } };
  const solicitarAccion = (nombre, accionApi, dialogo) => setConfirmacion({ nombre, accionApi, ...dialogo });

  if (!turno) return <main className="min-h-screen bg-[#fff4f7]"><AppHeader /><section className="p-8"><p>{error || "Cargando turno..."}</p>{error && <Link className="ui-button ui-button-ghost mt-3" to="/turnos">Volver a mis turnos</Link>}</section></main>;
  const estadoAbierto = ["pendiente", "confirmado", "reprogramado"].includes(turno.estado);
  const turnoYaInicio = new Date(turno.inicio) <= new Date();
  const puedeConfirmar = ["pendiente", "reprogramado"].includes(turno.estado);
  const puedeRealizar = turnoYaInicio && ["confirmado", "reprogramado"].includes(turno.estado);
  const puedeNoVino = turnoYaInicio && estadoAbierto;
  const puedeCobrar = turno.estado === "realizado" && turno.puede_registrar_cobro;
  const cobroActivo = turno.cobro_activo;

  return <main className="min-h-screen bg-[#fff4f7] text-[#3d2f32]"><AppHeader /><section className="mx-auto max-w-3xl px-5 py-8"><Link className="ui-button ui-button-ghost" to="/turnos">Volver a mis turnos</Link>{location.state?.message && <p className="mt-4 rounded-xl bg-[#eef8f0] p-3 text-[#356640]">{location.state.message}</p>}<article className="ui-surface mt-5 p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-3xl font-semibold">{turno.clienta.nombre_completo}</h1><p className="mt-2">{turno.clienta.telefono || "Sin teléfono"}</p></div><span className={claseEstado(turno.estado)}>{turno.estado_display}</span></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><section className="ui-section"><p className="ui-label">Horario</p><p className="mt-1 ui-value">{new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(new Date(`${turno.inicio.slice(0, 10)}T12:00:00`))}</p><p className="mt-1">{hora(turno.inicio)} – {hora(turno.fin)}</p></section><section className="ui-section"><p className="ui-label">Servicio e importe</p><p className="mt-1 font-semibold">{turno.servicios.map((servicio) => servicio.nombre).join(", ")}</p><p className="mt-1">{turno.duracion_legible} · <strong>{dinero(turno.precio_estimado)}</strong></p></section></div><section className="mt-4 ui-section"><p className="ui-label">Notas</p><p className="mt-1">{turno.notas || "Sin notas."}</p><p className="mt-3 text-sm text-[#6f5b60]">Creado: {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(turno.creado_en))}</p></section>{error && <p className="mt-4 text-[#8b3f4c]">{error}</p>}<section className="mt-6 ui-section"><h2 className="text-xl font-semibold">Acciones del turno</h2>{!estadoAbierto && turno.estado !== "realizado" && <p className="mt-2 text-sm text-[#6f5b60]">Este turno está cerrado y no admite más acciones.</p>}{estadoAbierto && <><div className="mt-4 flex flex-wrap gap-3">{puedeConfirmar && <button className="ui-button ui-button-primary" disabled={Boolean(accion)} onClick={() => ejecutarAccion("confirmar", confirmarTurno)}>{accion === "confirmar" ? "Confirmando..." : "Confirmar"}</button>}{puedeRealizar && <button className="ui-button ui-button-primary" disabled={Boolean(accion)} onClick={() => ejecutarAccion("realizar", realizarTurno)}>{accion === "realizar" ? "Marcando como realizado..." : "Marcar como realizado"}</button>}</div><div className="mt-3 flex flex-wrap gap-3"><Link className="ui-button ui-button-secondary" to={`/turnos/${id}/editar`}>Editar datos</Link><Link className="ui-button ui-button-secondary" to={`/turnos/${id}/reprogramar`}>Reprogramar</Link></div><div className="mt-3 flex flex-wrap gap-3">{puedeNoVino && <button className="ui-button ui-button-warning" disabled={Boolean(accion)} onClick={() => solicitarAccion("no-vino", marcarNoVino, { title: "¿Marcar como no vino?", description: "El turno quedará registrado como una ausencia y no podrá continuar normalmente.", confirmLabel: "Marcar no vino", destructive: true })}>{accion === "no-vino" ? "Guardando..." : "Marcar como no vino"}</button>}<button className="ui-button ui-button-danger" disabled={Boolean(accion)} onClick={() => solicitarAccion("cancelar", cancelarTurno, { title: "¿Cancelar este turno?", description: "El turno quedará cancelado y no podrá continuar con su flujo habitual.", confirmLabel: "Cancelar turno", destructive: true })}>{accion === "cancelar" ? "Cancelando..." : "Cancelar"}</button></div>{!turnoYaInicio && <p className="mt-4 text-sm text-[#6f5b60]">Podrás marcar este turno como realizado o no vino después de su horario de inicio.</p>}</>}{turno.estado === "realizado" && <div className="mt-4 ui-card-muted">{cobroActivo ? <><p className="font-semibold text-[#356640]">Cobrado</p><p className="text-sm">{dinero(cobroActivo.importe)}</p><Link className="mt-2 ui-button ui-button-secondary" to={`/cobros/${cobroActivo.id}`}>Ver cobro</Link></> : puedeCobrar && cajaAbierta === undefined ? <p className="text-sm text-[#6f5b60]">Comprobando la caja para registrar el cobro...</p> : puedeCobrar && !cajaAbierta ? <><p className="font-semibold">Debés abrir la caja antes de registrar un cobro.</p><Link className="mt-2 ui-button ui-button-secondary" to="/caja">Ir a Caja</Link></> : puedeCobrar ? <><p className="font-semibold">El servicio fue realizado. Ahora podés registrar el cobro.</p><Link className="mt-3 ui-button ui-button-primary" to={`/cobros/nuevo?turno=${id}`}>Registrar cobro</Link></> : <p>No pudimos determinar la disponibilidad de cobro.</p>}</div>}</section></article></section><ConfirmDialog open={Boolean(confirmacion)} title={confirmacion?.title} description={confirmacion?.description} confirmLabel={confirmacion?.confirmLabel} destructive={confirmacion?.destructive} isProcessing={Boolean(accion)} onClose={() => setConfirmacion(null)} onConfirm={async () => { const actual = confirmacion; setConfirmacion(null); await ejecutarAccion(actual.nombre, actual.accionApi); }} /></main>;
}

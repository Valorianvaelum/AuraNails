import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { obtenerCajaAbierta } from "../api/caja.js";
import { cancelarTurno, confirmarTurno, marcarNoVino, obtenerTurno, realizarTurno } from "../api/turnos.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { AuraHero, AuraPage, AuraPanel, AuraPanelHeader, AuraRecordCard } from "../components/visual";

const dinero = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
const hora = (value) => new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
const claseEstado = (estado) => ({
  pendiente: "ui-badge ui-badge-pending",
  confirmado: "ui-badge ui-badge-confirmed",
  reprogramado: "ui-badge ui-badge-rescheduled",
  realizado: "ui-badge ui-badge-success",
  cancelado: "ui-badge ui-badge-neutral",
  no_vino: "ui-badge ui-badge-no-show",
}[estado] || "ui-badge ui-badge-neutral");

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
    setTurno(null);
    setError("");
    try {
      const turnoActual = await obtenerTurno(id);
      setTurno(turnoActual);
      setCajaAbierta(turnoActual.estado === "realizado" && turnoActual.puede_registrar_cobro ? await obtenerCajaAbierta() : null);
    } catch (requestError) {
      setError(requestError.response?.status === 404 ? "No encontramos este turno." : "No pudimos cargar el turno.");
    }
  }, [id]);

  useEffect(() => { cargarTurno(); }, [cargarTurno]);

  const ejecutarAccion = async (nombre, accionApi) => {
    if (accion) return;
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

  const solicitarAccion = (nombre, accionApi, dialogo) => setConfirmacion({ nombre, accionApi, ...dialogo });

  if (!turno) {
    return (
      <AuraPage width="form">
        <AuraPanel>
          <p>{error || "Cargando turno..."}</p>
          {error && <Link className="aura-button aura-button-secondary mt-3" to="/turnos">Volver a Todos los turnos</Link>}
        </AuraPanel>
      </AuraPage>
    );
  }

  const estadoAbierto = ["pendiente", "confirmado", "reprogramado"].includes(turno.estado);
  const turnoYaInicio = new Date(turno.inicio) <= new Date();
  const puedeConfirmar = ["pendiente", "reprogramado"].includes(turno.estado);
  const puedeRealizar = turnoYaInicio && ["confirmado", "reprogramado"].includes(turno.estado);
  const puedeNoVino = turnoYaInicio && estadoAbierto;
  const puedeCobrar = turno.estado === "realizado" && turno.puede_registrar_cobro;
  const cobroActivo = turno.cobro_activo;

  return (
    <AuraPage width="form">
      <div className="grid gap-5">
        <AuraHero
          eyebrow="Detalle del turno"
          title={turno.clienta.nombre_completo}
          description={`${turno.clienta.telefono || "Sin teléfono"} · ${turno.estado_display}`}
          back={(
            <div className="flex flex-wrap gap-3">
              <Link className="aura-glass-link" to="/agenda">Volver a Agenda</Link>
              <Link className="aura-glass-link" to="/turnos">Todos los turnos</Link>
            </div>
          )}
        />

        {location.state?.message && <p className="rounded-xl bg-[#eef8f0] p-3 text-[#356640]">{location.state.message}</p>}

        <AuraPanel>
          <AuraPanelHeader title="Información del turno" description="Horario, servicios, importe y notas registradas." action={<span className={`${claseEstado(turno.estado)} px-3 py-1.5 text-sm`}>{turno.estado_display}</span>} />
          <div className="grid gap-4 sm:grid-cols-2">
            <AuraRecordCard as="section" className="p-4">
              <p className="text-sm text-muted-foreground">Horario</p>
              <p className="mt-1 font-semibold">{new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(new Date(`${turno.inicio.slice(0, 10)}T12:00:00`))}</p>
              <p className="mt-1 text-lg font-semibold">{hora(turno.inicio)} – {hora(turno.fin)}</p>
            </AuraRecordCard>
            <AuraRecordCard as="section" className="p-4">
              <p className="text-sm text-muted-foreground">Servicio e importe</p>
              <p className="mt-1 font-semibold">{turno.servicios.map((servicio) => servicio.nombre).join(", ")}</p>
              <p className="mt-1">{turno.duracion_legible} · <strong>{dinero(turno.precio_estimado)}</strong></p>
            </AuraRecordCard>
          </div>
          <section className="aura-inset mt-4">
            <p className="font-semibold">Notas</p>
            <p className="mt-1">{turno.notas || "Sin notas."}</p>
            <p className="mt-3 text-sm">Creado: {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(turno.creado_en))}</p>
          </section>
          {error && <p className="mt-4 rounded-lg bg-[var(--color-danger-soft)] px-4 py-3 text-destructive" role="alert">{error}</p>}
        </AuraPanel>

        <AuraPanel>
          <AuraPanelHeader title="Acciones del turno" description="Continuá el flujo, corregí datos o cerrá el turno según corresponda." />

          {!estadoAbierto && turno.estado !== "realizado" && (
            <AuraRecordCard className="p-4">
              <p className="font-semibold">Turno cerrado</p>
              <p className="mt-1 text-sm text-muted-foreground">Este turno ya no admite modificaciones ni cambios de estado.</p>
            </AuraRecordCard>
          )}

          {estadoAbierto && (
            <div className="grid gap-4">
              <section className="aura-inset">
                <p className="aura-eyebrow">Siguiente paso</p>
                <p className="mt-2 text-sm">
                  {puedeConfirmar
                    ? "Confirmá la asistencia para dejar el turno listo para la atención."
                    : puedeRealizar
                      ? "El horario ya comenzó. Marcá el servicio como realizado al finalizar."
                      : "El turno está confirmado. Las acciones de cierre estarán disponibles después del horario de inicio."}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {puedeConfirmar && (
                    <button aria-busy={accion === "confirmar" || undefined} className="aura-button aura-button-primary" disabled={Boolean(accion)} type="button" onClick={() => ejecutarAccion("confirmar", confirmarTurno)}>
                      {accion === "confirmar" ? "Confirmando..." : "Confirmar asistencia"}
                    </button>
                  )}
                  {puedeRealizar && (
                    <button aria-busy={accion === "realizar" || undefined} className="aura-button aura-button-primary" disabled={Boolean(accion)} type="button" onClick={() => ejecutarAccion("realizar", realizarTurno)}>
                      {accion === "realizar" ? "Marcando como realizado..." : "Marcar como realizado"}
                    </button>
                  )}
                </div>
              </section>

              <AuraRecordCard as="section" className="p-4">
                <h3 className="font-semibold">Modificar turno</h3>
                <p className="mt-1 text-sm text-muted-foreground">Corregí los datos o elegí una nueva fecha y hora.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link className="aura-button aura-button-secondary" to={`/turnos/${id}/editar`}>Editar datos</Link>
                  <Link className="aura-button aura-button-secondary" to={`/turnos/${id}/reprogramar`}>Reprogramar</Link>
                </div>
              </AuraRecordCard>

              <section className="rounded-xl border border-[var(--color-danger)]/40 bg-[var(--color-danger-soft)] p-4 text-[var(--color-text)]">
                <h3 className="font-semibold text-destructive">Cerrar sin completar</h3>
                <p className="mt-1 text-sm text-muted-foreground">Usá estas opciones solamente cuando el servicio no vaya a realizarse.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {puedeNoVino && (
                    <button aria-busy={accion === "no-vino" || undefined} className="aura-button aura-button-warning ui-button ui-button-warning min-h-11" disabled={Boolean(accion)} type="button" onClick={() => solicitarAccion("no-vino", marcarNoVino, { title: "¿Marcar como no vino?", description: "El turno quedará registrado como una ausencia y no podrá continuar normalmente.", confirmLabel: "Marcar no vino", destructive: true })}>
                      {accion === "no-vino" ? "Guardando..." : "Marcar como no vino"}
                    </button>
                  )}
                  <button aria-busy={accion === "cancelar" || undefined} className="aura-button aura-button-danger ui-button ui-button-danger min-h-11" disabled={Boolean(accion)} type="button" onClick={() => solicitarAccion("cancelar", cancelarTurno, { title: "¿Cancelar este turno?", description: "El turno quedará cancelado y no podrá continuar con su flujo habitual.", confirmLabel: "Cancelar turno", destructive: true })}>
                    {accion === "cancelar" ? "Cancelando..." : "Cancelar turno"}
                  </button>
                </div>
              </section>

              {!turnoYaInicio && <p className="text-sm text-[var(--aura-text-on-glass-muted)]">Las opciones “Marcar como realizado” y “No vino” se habilitan después del horario de inicio.</p>}
            </div>
          )}

          {turno.estado === "realizado" && (
            <AuraRecordCard as="section" className="p-4">
              <h3 className="font-semibold">Cobro del servicio</h3>
              {cobroActivo ? (
                <div className="mt-3">
                  <p className="font-semibold text-[#bfe5c8]">Cobrado · {dinero(cobroActivo.importe)}</p>
                  <Link className="aura-button aura-button-secondary mt-3" to={`/cobros/${cobroActivo.id}`}>Ver cobro</Link>
                </div>
              ) : puedeCobrar && cajaAbierta === undefined ? (
                <p className="mt-2 text-sm text-muted-foreground">Comprobando la caja para registrar el cobro...</p>
              ) : puedeCobrar && !cajaAbierta ? (
                <div className="mt-3">
                  <p className="font-semibold">Debés abrir la caja antes de registrar un cobro.</p>
                  <Link className="aura-button aura-button-secondary mt-3" to="/caja">Ir a Caja</Link>
                </div>
              ) : puedeCobrar ? (
                <div className="mt-3">
                  <p className="font-semibold">El servicio fue realizado y está pendiente de cobro.</p>
                  <Link className="aura-button aura-button-primary mt-3" to={`/cobros/nuevo?turno=${id}`}>Registrar cobro</Link>
                </div>
              ) : (
                <p className="mt-2">No pudimos determinar la disponibilidad de cobro.</p>
              )}
            </AuraRecordCard>
          )}
        </AuraPanel>
      </div>

      <ConfirmDialog
        open={Boolean(confirmacion)}
        title={confirmacion?.title}
        description={confirmacion?.description}
        confirmLabel={confirmacion?.confirmLabel}
        destructive={confirmacion?.destructive}
        isProcessing={Boolean(accion)}
        onClose={() => setConfirmacion(null)}
        onConfirm={async () => {
          const actual = confirmacion;
          setConfirmacion(null);
          if (actual) await ejecutarAccion(actual.nombre, actual.accionApi);
        }}
      />
    </AuraPage>
  );
}

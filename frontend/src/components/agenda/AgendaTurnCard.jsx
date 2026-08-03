import { Link } from "react-router-dom";

const dinero = (valor) => new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
}).format(valor);

const hora = (valor) => new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
}).format(new Date(valor));

function AgendaStatusBadge({ estado, label }) {
  return (
    <span className="aura-agenda-status" data-state={estado}>
      {label}
    </span>
  );
}

function AgendaDayTurnCard({ turno }) {
  const servicios = turno.servicios.map((servicio) => servicio.nombre).join(", ");

  return (
    <article className="aura-agenda-day-turn" data-state={turno.estado}>
      <div className="aura-agenda-time-rail" aria-label={`De ${hora(turno.inicio)} a ${hora(turno.fin)}`}>
        <strong>{hora(turno.inicio)}</strong>
        <span>{hora(turno.fin)}</span>
      </div>

      <div className="aura-agenda-day-turn-body">
        <div className="aura-agenda-turn-heading">
          <div>
            <h3>{turno.clienta.nombre_completo}</h3>
            <p>{servicios || "Sin servicios informados"}</p>
          </div>
          <AgendaStatusBadge estado={turno.estado} label={turno.estado_display} />
        </div>

        <div className="aura-agenda-turn-meta">
          <span>{turno.duracion_legible}</span>
          <span>{dinero(turno.precio_estimado)}</span>
          {turno.estado === "realizado" ? (
            <span className="aura-agenda-payment" data-paid={Boolean(turno.cobro_activo)}>
              {turno.cobro_activo ? "Cobrado" : turno.puede_registrar_cobro ? "Pendiente de cobro" : "Cobro no disponible"}
            </span>
          ) : null}
        </div>

        <div className="aura-agenda-turn-actions">
          <Link className="aura-button aura-button-secondary" to={`/turnos/${turno.id}`}>Ver turno</Link>
        </div>
      </div>
    </article>
  );
}

function AgendaWeekTurnCard({ turno }) {
  return (
    <Link className="aura-agenda-week-turn" data-state={turno.estado} to={`/turnos/${turno.id}`}>
      <div className="aura-agenda-week-turn-time">
        <strong>{hora(turno.inicio)}</strong>
        <span>{hora(turno.fin)}</span>
      </div>
      <div className="aura-agenda-week-turn-copy">
        <strong>{turno.clienta.nombre_completo}</strong>
        <span>{turno.servicios.map((servicio) => servicio.nombre).join(", ") || "Sin servicio"}</span>
      </div>
      <AgendaStatusBadge estado={turno.estado} label={turno.estado_display} />
    </Link>
  );
}

export { AgendaDayTurnCard, AgendaWeekTurnCard };

import { Link } from "react-router-dom";

import { AuraEmptyState, AuraPanel, AuraPanelHeader } from "../visual";
import { AgendaDayTurnCard, AgendaWeekTurnCard } from "./AgendaTurnCard.jsx";

const fechaCorta = (valor) => new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "numeric",
  month: "short",
}).format(new Date(`${valor}T12:00:00`));

const diaNumero = (valor) => new Intl.DateTimeFormat("es-AR", { day: "2-digit" }).format(new Date(`${valor}T12:00:00`));
const diaNombre = (valor) => new Intl.DateTimeFormat("es-AR", { weekday: "short" }).format(new Date(`${valor}T12:00:00`));
const mesCorto = (valor) => new Intl.DateTimeFormat("es-AR", { month: "short" }).format(new Date(`${valor}T12:00:00`));
const hoy = () => new Date().toLocaleDateString("en-CA");

function AgendaLoadingState({ vista }) {
  const cantidad = vista === "dia" ? 3 : 7;
  return (
    <AuraPanel className="aura-agenda-loading" aria-live="polite" aria-label="Cargando agenda">
      <div className={vista === "dia" ? "aura-agenda-skeleton-list" : "aura-agenda-skeleton-week"}>
        {Array.from({ length: cantidad }, (_, index) => (
          <div className="aura-agenda-skeleton" key={index} />
        ))}
      </div>
    </AuraPanel>
  );
}

function AgendaErrorState({ message, onRetry }) {
  return (
    <AuraPanel className="aura-agenda-error" role="alert">
      <AuraPanelHeader title="No pudimos cargar la agenda" description={message} />
      <button className="aura-button aura-button-secondary" type="button" onClick={onRetry}>Reintentar</button>
    </AuraPanel>
  );
}

function AgendaDayView({ fecha, nuevoTurno, tieneFiltros, turnos, onClearFilters }) {
  return (
    <AuraPanel className="aura-agenda-day-panel">
      <AuraPanelHeader
        title="Jornada"
        description={fechaCorta(fecha)}
        action={<span className="aura-agenda-count">{turnos.length} {turnos.length === 1 ? "turno" : "turnos"}</span>}
      />

      {turnos.length ? (
        <div className="aura-agenda-day-list">
          {turnos.map((turno) => <AgendaDayTurnCard turno={turno} key={turno.id} />)}
        </div>
      ) : (
        <AuraEmptyState
          title={tieneFiltros ? "No encontramos turnos con estos filtros." : "No hay turnos para este día."}
          description={tieneFiltros ? "Probá con otros criterios o limpiá los filtros." : "Tenés la jornada libre o podés agregar un nuevo turno."}
          action={tieneFiltros
            ? <button className="aura-button aura-button-secondary" type="button" onClick={onClearFilters}>Limpiar filtros</button>
            : <Link className="aura-button aura-button-primary" to={nuevoTurno}>Crear turno</Link>}
        />
      )}
    </AuraPanel>
  );
}

function AgendaWeekView({ dias, tieneFiltros, turnosPorDia, onClearFilters }) {
  const total = dias.reduce((sum, dia) => sum + (turnosPorDia[dia]?.length || 0), 0);

  return (
    <AuraPanel className="aura-agenda-week-panel">
      <AuraPanelHeader
        title="Semana"
        description="Revisá los siete días y accedé a cada jornada."
        action={<span className="aura-agenda-count">{total} {total === 1 ? "turno" : "turnos"}</span>}
      />

      {!total && tieneFiltros ? (
        <div className="aura-agenda-week-notice" role="status">
          <div>
            <p className="aura-agenda-week-notice-title">No encontramos turnos con estos filtros.</p>
            <p className="aura-agenda-week-notice-description">La semana sigue disponible para revisar cada jornada.</p>
          </div>
          <button className="aura-button aura-button-secondary" type="button" onClick={onClearFilters}>Limpiar filtros</button>
        </div>
      ) : null}

      <div className="aura-agenda-week-scroll" tabIndex="0" aria-label="Agenda semanal">
        <div className="aura-agenda-week-grid">
          {dias.map((dia) => {
            const turnos = turnosPorDia[dia] || [];
            const esHoy = dia === hoy();
            return (
              <section className="aura-agenda-week-day" data-today={esHoy} key={dia}>
                <header className="aura-agenda-week-day-header">
                  <div>
                    <span>{diaNombre(dia)}</span>
                    <strong>{diaNumero(dia)}</strong>
                    <small>{mesCorto(dia)}</small>
                  </div>
                  <span className="aura-agenda-day-count">{turnos.length}</span>
                </header>
                <div className="aura-agenda-week-day-body">
                  {turnos.length
                    ? turnos.map((turno) => <AgendaWeekTurnCard turno={turno} key={turno.id} />)
                    : (
                      <div className="aura-agenda-week-empty">
                        <span>Sin turnos</span>
                        <Link to={`/turnos/nuevo?fecha=${encodeURIComponent(dia)}`}>Agregar</Link>
                      </div>
                    )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </AuraPanel>
  );
}

export { AgendaDayView, AgendaErrorState, AgendaLoadingState, AgendaWeekView };

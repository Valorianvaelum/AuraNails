function AgendaViewToggle({ value, onChange }) {
  return (
    <div className="aura-agenda-view-toggle" role="group" aria-label="Vista de agenda">
      <button
        aria-pressed={value === "dia"}
        className="aura-agenda-segment"
        data-active={value === "dia"}
        type="button"
        onClick={() => onChange("dia")}
      >
        Día
      </button>
      <button
        aria-pressed={value === "semana"}
        className="aura-agenda-segment"
        data-active={value === "semana"}
        type="button"
        onClick={() => onChange("semana")}
      >
        Semana
      </button>
    </div>
  );
}

function AgendaControls({
  busqueda,
  clientaId,
  clientas,
  errorClientas,
  estado,
  fecha,
  filtrosAbiertos,
  tieneFiltros,
  vista,
  onBusquedaChange,
  onClientaChange,
  onEstadoChange,
  onFechaChange,
  onLimpiarFiltros,
  onMover,
  onToggleFiltros,
  onVistaChange,
}) {
  return (
    <section className="aura-glass aura-panel aura-agenda-controls" aria-label="Controles de agenda">
      <div className="aura-agenda-controls-primary">
        <AgendaViewToggle value={vista} onChange={onVistaChange} />

        <div className="aura-agenda-date-navigation" aria-label="Navegación temporal">
          <button className="aura-button aura-button-secondary" type="button" onClick={() => onMover(-1)}>
            Anterior
          </button>
          <button className="aura-button aura-button-secondary" type="button" onClick={() => onFechaChange(new Date().toLocaleDateString("en-CA"))}>
            Hoy
          </button>
          <button className="aura-button aura-button-secondary" type="button" onClick={() => onMover(1)}>
            Siguiente
          </button>
        </div>

        <label className="aura-agenda-date-field">
          <span>Fecha</span>
          <input className="aura-agenda-control" type="date" value={fecha} onChange={(event) => onFechaChange(event.target.value)} />
        </label>

        <button
          aria-expanded={filtrosAbiertos}
          className="aura-button aura-button-secondary aura-agenda-filter-toggle"
          type="button"
          onClick={onToggleFiltros}
        >
          Filtros{tieneFiltros ? " activos" : ""}
        </button>
      </div>

      <div className="aura-agenda-filters" data-open={filtrosAbiertos}>
        <label className="aura-agenda-field">
          <span>Estado</span>
          <select className="aura-agenda-control" value={estado} onChange={(event) => onEstadoChange(event.target.value)}>
            <option value="">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="confirmado">Confirmados</option>
            <option value="reprogramado">Reprogramados</option>
            <option value="realizado">Realizados</option>
            <option value="cancelado">Cancelados</option>
            <option value="no_vino">No vino</option>
          </select>
        </label>

        <label className="aura-agenda-field">
          <span>Clienta</span>
          <select className="aura-agenda-control" value={clientaId} onChange={(event) => onClientaChange(event.target.value)}>
            <option value="">Todas las clientas</option>
            {clientas.map((clienta) => (
              <option value={clienta.id} key={clienta.id}>{clienta.nombre_completo}</option>
            ))}
          </select>
          {errorClientas ? <small className="aura-agenda-field-error">{errorClientas}</small> : null}
        </label>

        <label className="aura-agenda-field">
          <span>Buscar clienta</span>
          <input
            className="aura-agenda-control"
            placeholder="Nombre o teléfono"
            type="search"
            value={busqueda}
            onChange={(event) => onBusquedaChange(event.target.value)}
          />
        </label>

        <div className="aura-agenda-filter-actions">
          {tieneFiltros ? (
            <button className="aura-button aura-button-ghost" type="button" onClick={onLimpiarFiltros}>
              Limpiar filtros
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default AgendaControls;

import { Link } from "react-router-dom";

import { AuraEmptyState, AuraPanel, AuraPanelHeader } from "./visual";
import { dinero, fechaHora } from "./CajaResumen.jsx";

function normalizar(caja) {
  const cobros = (caja?.cobros || []).map((registro) => ({
    id: `cobro-${registro.id}`,
    original: registro,
    tipo: "cobro",
    titulo: registro.clienta_nombre_historica || "Cobro",
    detalle: registro.metodo_pago_display,
    fecha: registro.creado_en,
    importe: Number(registro.importe || 0),
    estado: registro.estado,
    estadoDisplay: registro.estado_display,
    anulacion: registro.motivo_anulacion,
  }));
  const gastos = (caja?.gastos || []).map((registro) => ({
    id: `gasto-${registro.id}`,
    original: registro,
    tipo: "gasto",
    titulo: registro.concepto,
    detalle: registro.metodo_pago_display,
    fecha: registro.registrado_en,
    importe: -Number(registro.importe || 0),
    estado: registro.estado,
    estadoDisplay: registro.estado_display,
    anulacion: registro.motivo_anulacion,
  }));
  const movimientos = (caja?.movimientos || []).map((registro) => ({
    id: `movimiento-${registro.id}`,
    original: registro,
    tipo: registro.tipo,
    titulo: registro.tipo === "aporte" ? "Aporte de efectivo" : "Retiro de efectivo",
    detalle: registro.motivo,
    fecha: registro.registrado_en,
    importe: (registro.tipo === "aporte" ? 1 : -1) * Number(registro.importe || 0),
    estado: registro.estado,
    estadoDisplay: registro.estado_display,
    anulacion: registro.motivo_anulacion,
  }));

  return [...cobros, ...gastos, ...movimientos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

function etiquetaTipo(tipo) {
  return ({ cobro: "Cobro", gasto: "Gasto", aporte: "Aporte", retiro: "Retiro" })[tipo] || tipo;
}

function Movimiento({ item, onAnularGasto, onAnularMovimiento }) {
  const anulado = item.estado === "anulado";
  const positivo = item.importe >= 0;
  const puedeAnular = item.original?.puede_anularse;
  const anular = item.tipo === "gasto"
    ? onAnularGasto
    : ["aporte", "retiro"].includes(item.tipo)
      ? onAnularMovimiento
      : null;

  return (
    <article className={`cash-movement-row cash-movement-${item.tipo} ${anulado ? "is-cancelled" : ""}`}>
      <time className="cash-movement-time" dateTime={item.fecha}>{fechaHora(item.fecha)}</time>
      <div className="cash-movement-copy">
        <div className="cash-movement-heading">
          <span className="cash-movement-type">{etiquetaTipo(item.tipo)}</span>
          <span className={`cash-movement-status ${anulado ? "is-cancelled" : "is-active"}`}>{item.estadoDisplay || (anulado ? "Anulado" : "Activo")}</span>
        </div>
        <h3>{item.titulo}</h3>
        {item.detalle ? <p>{item.detalle}</p> : null}
        {anulado ? <p className="cash-cancel-reason">Anulado: {item.anulacion || "Sin motivo"}</p> : null}
      </div>
      <strong className={`cash-movement-amount ${positivo ? "is-positive" : "is-negative"}`}>
        {positivo ? "+ " : "− "}{dinero(Math.abs(item.importe))}
      </strong>
      <div className="cash-movement-actions">
        {item.tipo === "cobro" ? <Link className="aura-button aura-button-secondary" to={`/cobros/${item.original.id}`}>Ver cobro</Link> : null}
        {puedeAnular && anular ? (
          <button className="cash-text-action" type="button" onClick={() => anular(item.original)}>
            Anular
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default function CajaMovimientos({ caja, onAnularGasto, onAnularMovimiento }) {
  const registros = normalizar(caja);

  return (
    <AuraPanel className="cash-movements-panel" aria-label="Movimientos de caja">
      <AuraPanelHeader
        title="Movimientos"
        description="Cobros, gastos, aportes y retiros ordenados desde el más reciente."
        action={<span className="cash-count-badge">{registros.length} {registros.length === 1 ? "movimiento" : "movimientos"}</span>}
      />
      {registros.length ? (
        <div className="cash-movement-list">
          {registros.map((item) => (
            <Movimiento
              item={item}
              key={item.id}
              onAnularGasto={onAnularGasto}
              onAnularMovimiento={onAnularMovimiento}
            />
          ))}
        </div>
      ) : (
        <AuraEmptyState
          title="Todavía no hay movimientos en esta caja."
          description="Los cobros y las operaciones de efectivo aparecerán aquí."
        />
      )}
    </AuraPanel>
  );
}

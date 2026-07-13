import { Link } from "react-router-dom";

import { dinero, fechaHora } from "./CajaResumen.jsx";

const estadoClass = (estado) => estado === "anulado" ? "bg-[#f1e4e6] text-[#8b3f4c]" : "bg-[#e7f5ea] text-[#356640]";

function Registro({ children, estado, estadoDisplay, fecha, anulacion, accion }) {
  return <article className={`aura-financial-card ${estado === "anulado" ? "border-l-[#bd7b88] bg-[#fcf8f9]" : ""}`}><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1">{children}<p className="mt-2 text-sm text-[#6f5b60]">{fechaHora(fecha)}</p>{estado === "anulado" && <p className="mt-2 text-sm text-[#8b3f4c]">Anulado: {anulacion || "Sin motivo"}</p>}</div><div className="flex shrink-0 flex-col items-end gap-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${estadoClass(estado)}`}>{estadoDisplay}</span>{accion}</div></div></article>;
}

function SeccionFinanciera({ titulo, registros, vacio, render }) {
  return <section className="aura-financial-section"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">{titulo}</h2><span className="rounded-full bg-[#f4eff0] px-2.5 py-1 text-sm font-semibold text-[#654552]">{registros.length}</span></div><div className="mt-3 grid gap-3">{registros.length ? registros.map(render) : <p className="aura-financial-empty text-sm">{vacio}</p>}</div></section>;
}

export default function CajaMovimientos({ caja, onAnularGasto, onAnularMovimiento }) {
  const cobros = caja?.cobros || [];
  const gastos = caja?.gastos || [];
  const movimientos = caja?.movimientos || [];
  const aportes = movimientos.filter((movimiento) => movimiento.tipo === "aporte");
  const retiros = movimientos.filter((movimiento) => movimiento.tipo === "retiro");

  return <section className="mt-8 space-y-7" aria-label="Movimientos de caja">
    <SeccionFinanciera titulo="Cobros" registros={cobros} vacio="Todavía no hay cobros registrados en esta caja." render={(cobro) => <Registro key={cobro.id} estado={cobro.estado} estadoDisplay={cobro.estado_display} fecha={cobro.creado_en} anulacion={cobro.motivo_anulacion}><p className="font-semibold">{cobro.clienta_nombre_historica}</p><p className="mt-1 aura-amount">{dinero(cobro.importe)}</p><p className="mt-1 text-sm text-[#6f5b60]">{cobro.metodo_pago_display}</p><Link className="mt-3 aura-action aura-action-contextual" to={`/cobros/${cobro.id}`}>Ver cobro</Link></Registro>} />
    <SeccionFinanciera titulo="Gastos" registros={gastos} vacio="Todavía no hay gastos registrados en esta caja." render={(gasto) => <Registro key={gasto.id} estado={gasto.estado} estadoDisplay={gasto.estado_display} fecha={gasto.registrado_en} anulacion={gasto.motivo_anulacion} accion={gasto.puede_anularse && onAnularGasto && <button className="aura-action aura-action-contextual text-[#8b3f4c]" type="button" onClick={() => onAnularGasto(gasto)}>Anular gasto</button>}><p className="font-semibold">{gasto.concepto}</p><p className="mt-1 aura-amount">{dinero(gasto.importe)}</p><p className="mt-1 text-sm text-[#6f5b60]">{gasto.metodo_pago_display}</p></Registro>} />
    <SeccionFinanciera titulo="Aportes" registros={aportes} vacio="Todavía no hay aportes registrados en esta caja." render={(movimiento) => <Registro key={movimiento.id} estado={movimiento.estado} estadoDisplay={movimiento.estado_display} fecha={movimiento.registrado_en} anulacion={movimiento.motivo_anulacion} accion={movimiento.puede_anularse && onAnularMovimiento && <button className="aura-action aura-action-contextual text-[#8b3f4c]" type="button" onClick={() => onAnularMovimiento(movimiento)}>Anular aporte</button>}><p className="font-semibold">Aporte de efectivo</p><p className="mt-1 aura-amount">{dinero(movimiento.importe)}</p><p className="mt-1 text-sm text-[#6f5b60]">{movimiento.motivo}</p></Registro>} />
    <SeccionFinanciera titulo="Retiros" registros={retiros} vacio="Todavía no hay retiros registrados en esta caja." render={(movimiento) => <Registro key={movimiento.id} estado={movimiento.estado} estadoDisplay={movimiento.estado_display} fecha={movimiento.registrado_en} anulacion={movimiento.motivo_anulacion} accion={movimiento.puede_anularse && onAnularMovimiento && <button className="aura-action aura-action-contextual text-[#8b3f4c]" type="button" onClick={() => onAnularMovimiento(movimiento)}>Anular retiro</button>}><p className="font-semibold">Retiro de efectivo</p><p className="mt-1 aura-amount">{dinero(movimiento.importe)}</p><p className="mt-1 text-sm text-[#6f5b60]">{movimiento.motivo}</p></Registro>} />
  </section>;
}

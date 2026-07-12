import { Link } from "react-router-dom";

import { dinero, fechaHora } from "./CajaResumen.jsx";

const estadoClass = (estado) => estado === "anulado" ? "bg-[#fff1f2] text-[#8b3f4c]" : "bg-[#e7f5ea] text-[#356640]";

function Registro({ children, estado, estadoDisplay, fecha, anulacion, accion }) {
  return <article className={`rounded-xl border p-4 ${estado === "anulado" ? "border-[#e7c5ca] bg-[#fffafb]" : "border-[#efdadd] bg-white"}`}><div className="flex flex-wrap items-start justify-between gap-3"><div>{children}<p className="mt-1 text-sm text-[#6f5b60]">{fechaHora(fecha)}</p>{estado === "anulado" && <p className="mt-2 text-sm text-[#8b3f4c]">Anulado: {anulacion || "Sin motivo"}</p>}</div><div className="text-right"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${estadoClass(estado)}`}>{estadoDisplay}</span>{accion}</div></div></article>;
}

export default function CajaMovimientos({ caja, onAnularGasto, onAnularMovimiento }) {
  const cobros = caja?.cobros || [];
  const gastos = caja?.gastos || [];
  const movimientos = caja?.movimientos || [];
  const aportes = movimientos.filter((movimiento) => movimiento.tipo === "aporte");
  const retiros = movimientos.filter((movimiento) => movimiento.tipo === "retiro");
  const secciones = [
    ["Cobros", cobros, (cobro) => <Registro key={cobro.id} estado={cobro.estado} estadoDisplay={cobro.estado_display} fecha={cobro.creado_en} anulacion={cobro.motivo_anulacion}><p className="font-semibold">{cobro.clienta_nombre_historica} · {dinero(cobro.importe)}</p><p className="text-sm">{cobro.metodo_pago_display} · <Link className="underline" to={`/cobros/${cobro.id}`}>Ver cobro</Link></p></Registro>],
    ["Gastos", gastos, (gasto) => <Registro key={gasto.id} estado={gasto.estado} estadoDisplay={gasto.estado_display} fecha={gasto.registrado_en} anulacion={gasto.motivo_anulacion} accion={gasto.puede_anularse && onAnularGasto && <button className="mt-3 text-sm text-[#8b3f4c] underline" type="button" onClick={() => onAnularGasto(gasto)}>Anular gasto</button>}><p className="font-semibold">{gasto.concepto} · {dinero(gasto.importe)}</p><p className="text-sm">{gasto.metodo_pago_display}</p></Registro>],
    ["Aportes", aportes, (movimiento) => <Registro key={movimiento.id} estado={movimiento.estado} estadoDisplay={movimiento.estado_display} fecha={movimiento.registrado_en} anulacion={movimiento.motivo_anulacion} accion={movimiento.puede_anularse && onAnularMovimiento && <button className="mt-3 text-sm text-[#8b3f4c] underline" type="button" onClick={() => onAnularMovimiento(movimiento)}>Anular aporte</button>}><p className="font-semibold">{dinero(movimiento.importe)}</p><p className="text-sm">{movimiento.motivo}</p></Registro>],
    ["Retiros", retiros, (movimiento) => <Registro key={movimiento.id} estado={movimiento.estado} estadoDisplay={movimiento.estado_display} fecha={movimiento.registrado_en} anulacion={movimiento.motivo_anulacion} accion={movimiento.puede_anularse && onAnularMovimiento && <button className="mt-3 text-sm text-[#8b3f4c] underline" type="button" onClick={() => onAnularMovimiento(movimiento)}>Anular retiro</button>}><p className="font-semibold">{dinero(movimiento.importe)}</p><p className="text-sm">{movimiento.motivo}</p></Registro>],
  ];
  return <section className="mt-8 space-y-7">{secciones.map(([titulo, registros, render]) => <div key={titulo}><h2 className="text-xl font-semibold">{titulo}</h2><div className="mt-3 grid gap-3">{registros.length ? registros.map(render) : <p className="text-sm text-[#6f5b60]">Todavía no hay {titulo.toLowerCase()} registrados.</p>}</div></div>)}</section>;
}

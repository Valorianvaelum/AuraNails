import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listarCajas } from "../api/caja.js";
import { dinero, fechaHora } from "../components/CajaResumen.jsx";
import AppHeader from "../components/AppHeader.jsx";

export default function CajasHistorialPage() {
  const [fecha, setFecha] = useState("");
  const [estado, setEstado] = useState("");
  const [conDiferencia, setConDiferencia] = useState(false);
  const [cajas, setCajas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const tieneFiltros = Boolean(fecha || estado || conDiferencia);
  const cargar = useCallback(async () => { setCargando(true); setError(""); try { const params = {}; if (fecha) params.fecha = fecha; if (estado) params.estado = estado; setCajas(await listarCajas(params)); } catch { setCajas([]); setError("No pudimos cargar el historial de cajas. Intentá nuevamente."); } finally { setCargando(false); } }, [estado, fecha]);
  useEffect(() => { cargar(); }, [cargar]);
  const visibles = conDiferencia ? cajas.filter((caja) => Number(caja.diferencia || 0) !== 0) : cajas;
  const limpiar = () => { setFecha(""); setEstado(""); setConDiferencia(false); };

  return <main className="min-h-screen bg-[#fff8f7] text-[#3d2f32]"><AppHeader /><section className="mx-auto max-w-5xl px-5 py-8 sm:px-8"><div className="flex flex-wrap justify-between gap-3"><div><Link to="/caja">Volver a Caja</Link><h1 className="mt-4 text-3xl font-semibold">Historial de cajas</h1></div></div><div className="mt-5 grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-3"><label className="grid gap-1 text-sm font-medium">Fecha<input type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} /></label><label className="grid gap-1 text-sm font-medium">Estado<select value={estado} onChange={(event) => setEstado(event.target.value)}><option value="">Todos</option><option value="abierta">Abiertas</option><option value="cerrada">Cerradas</option></select></label><label className="flex items-center gap-2 text-sm font-medium"><input checked={conDiferencia} type="checkbox" onChange={(event) => setConDiferencia(event.target.checked)} />Con diferencia</label>{tieneFiltros && <button className="justify-self-start" type="button" onClick={limpiar}>Limpiar filtros</button>}</div>{cargando && <p className="mt-5">Cargando historial...</p>}{error && <div className="mt-5 rounded-xl border border-[#e7c5ca] bg-white p-4"><p className="text-[#8b3f4c]">{error}</p><button className="mt-3" type="button" onClick={cargar}>Reintentar</button></div>}{!cargando && !error && <div className="mt-5 grid gap-4">{visibles.map((caja) => <article className="rounded-2xl border bg-white p-5" key={caja.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Caja #{caja.id}</h2><p className="text-sm text-[#6f5b60]">Apertura: {fechaHora(caja.abierta_en)}</p><p className="text-sm text-[#6f5b60]">Cierre: {fechaHora(caja.cerrada_en)}</p></div><span className={caja.estado === "cerrada" ? "rounded-full bg-[#f1e4e6] px-2 py-1 text-sm font-semibold text-[#8b3f4c]" : "rounded-full bg-[#e7f5ea] px-2 py-1 text-sm font-semibold text-[#356640]"}>{caja.estado_display}</span></div><div className="mt-4 grid gap-2 text-sm sm:grid-cols-4"><p>Inicial: <strong>{dinero(caja.saldo_inicial)}</strong></p><p>Esperado: <strong>{dinero(caja.resumen?.saldo_teorico ?? caja.saldo_teorico_cierre)}</strong></p><p>Contado: <strong>{caja.saldo_contado === null ? "Pendiente" : dinero(caja.saldo_contado)}</strong></p><p>Diferencia: <strong>{caja.diferencia === null ? "Pendiente" : dinero(caja.diferencia)}</strong></p></div><Link className="mt-4 inline-block font-semibold underline" to={`/caja/${caja.id}`}>Ver detalle</Link></article>)}{!visibles.length && <p>{tieneFiltros ? "No encontramos cajas con los filtros seleccionados." : "Todavía no tenés cajas registradas."}</p>}</div>}</section></main>;
}

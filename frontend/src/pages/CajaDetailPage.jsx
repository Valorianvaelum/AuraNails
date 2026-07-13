import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { obtenerCaja } from "../api/caja.js";
import CajaMovimientos from "../components/CajaMovimientos.jsx";
import CajaResumen, { dinero, fechaHora } from "../components/CajaResumen.jsx";
import AppHeader from "../components/AppHeader.jsx";

export default function CajaDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [caja, setCaja] = useState(null);
  const [error, setError] = useState("");
  const cargar = useCallback(async () => { setError(""); try { setCaja(await obtenerCaja(id)); } catch (requestError) { setError(requestError.response?.status === 404 ? "No encontramos esta caja." : "No pudimos cargar esta caja."); } }, [id]);
  useEffect(() => { cargar(); }, [cargar]);
  if (!caja) return <main className="min-h-screen bg-[#fff8f7]"><AppHeader /><section className="p-8"><p>{error || "Cargando caja..."}</p>{error && <Link className="mt-3 aura-action aura-action-contextual" to="/caja/historial">Volver al historial</Link>}</section></main>;
  const cerrada = caja.estado === "cerrada";
  return <main className="min-h-screen bg-[#fff8f7] text-[#3d2f32]"><AppHeader /><section className="mx-auto max-w-5xl px-5 py-8 sm:px-8"><Link className="aura-action aura-action-contextual" to="/caja/historial">Volver al historial</Link>{location.state?.message && <p className="mt-4 rounded-xl bg-[#eef8f0] p-3 text-[#356640]">{location.state.message}</p>}<article className="mt-5 rounded-3xl border border-[#efdadd] bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-3xl font-semibold">Caja #{caja.id}</h1><p className="mt-2 text-sm">Apertura: {fechaHora(caja.abierta_en)}</p><p className="text-sm">Cierre: {fechaHora(caja.cerrada_en)}</p>{caja.cerrada_por && <p className="text-sm">Responsable del cierre: {caja.cerrada_por.nombre}</p>}</div><span className={cerrada ? "rounded-full bg-[#f1e4e6] px-3 py-1 font-semibold text-[#8b3f4c]" : "rounded-full bg-[#e7f5ea] px-3 py-1 font-semibold text-[#356640]"}>{caja.estado_display}</span></div>{caja.observacion_apertura && <p className="mt-4 text-sm">Observación de apertura: {caja.observacion_apertura}</p>}{cerrada && <div className="mt-5 aura-financial-summary text-sm"><p>Dinero contado: <strong>{dinero(caja.saldo_contado)}</strong></p><p>Diferencia: <strong>{dinero(caja.diferencia)}</strong></p>{caja.observacion_cierre && <p className="mt-2">Observación de cierre: {caja.observacion_cierre}</p>}</div>}{!cerrada && <div className="mt-5 aura-financial-summary"><p>Esta caja sigue abierta.</p><Link className="mt-2 aura-action aura-action-contextual" to="/caja">Ir a acciones de caja</Link></div>}<div className="mt-6"><CajaResumen caja={caja} /></div></article><CajaMovimientos caja={caja} /></section></main>;
}

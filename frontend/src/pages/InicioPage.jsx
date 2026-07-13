import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { obtenerCajaAbierta } from "../api/caja.js";
import { listarCobros } from "../api/cobros.js";
import { listarTurnos } from "../api/turnos.js";
import { useAuth } from "../auth/AuthContext.jsx";
import AppHeader from "../components/AppHeader.jsx";
import { dinero } from "../components/CajaResumen.jsx";

const hoy = () => new Date().toLocaleDateString("en-CA");
const hora = (value) => new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));

function InicioPage() {
  const { user } = useAuth();
  const nombre = typeof user?.nombre === "string" && user.nombre.trim()
    ? user.nombre.trim()
    : typeof user?.apellido === "string" ? user.apellido.trim() : "";
  const [resumen, setResumen] = useState({ caja: undefined, turnos: [], cobros: [], error: "" });

  useEffect(() => {
    let vigente = true;
    Promise.all([obtenerCajaAbierta(), listarTurnos({ fecha: hoy() }), listarCobros({ fecha: hoy() })])
      .then(([caja, turnos, cobros]) => { if (vigente) setResumen({ caja, turnos, cobros, error: "" }); })
      .catch(() => { if (vigente) setResumen((actual) => ({ ...actual, caja: null, error: "No pudimos cargar el resumen de hoy." })); });
    return () => { vigente = false; };
  }, []);

  return <main className="min-h-screen bg-[#fff4f7] text-[#3d2f32]"><AppHeader /><section className="mx-auto max-w-5xl px-5 py-10 sm:px-8"><div className="rounded-3xl border border-[#f1dce4] bg-white p-8 shadow-sm sm:p-10"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b76e79]">AuraNails</p><h1 className="mt-4 text-4xl font-semibold text-[#2f2528]">{nombre ? `Hola, ${nombre}` : "Hola"}</h1><p className="mt-3 text-lg text-[#6f5b60]">Tu resumen simple para organizar el día.</p>{resumen.error && <p className="mt-4 text-sm text-[#8b3f4c]">{resumen.error}</p>}<div className="mt-7 grid gap-4 md:grid-cols-3"><article className="rounded-2xl bg-[#fff4f7] p-5"><p className="font-semibold">{resumen.caja ? "Caja abierta" : "Caja cerrada"}</p>{resumen.caja ? <p className="mt-2 text-sm">Saldo esperado: {dinero(resumen.caja.resumen?.saldo_teorico)}</p> : <p className="mt-2 text-sm">Abrí la caja antes de registrar cobros.</p>}<Link className="mt-3 inline-block font-semibold underline" to="/caja">{resumen.caja ? "Ver caja" : "Abrir caja"}</Link></article><article className="rounded-2xl bg-[#fff4f7] p-5"><p className="font-semibold">Turnos de hoy</p><p className="mt-2 text-2xl font-semibold">{resumen.turnos.length}</p><Link className="mt-3 inline-block font-semibold underline" to={`/turnos?fecha=${hoy()}`}>Ver turnos</Link></article><article className="rounded-2xl bg-[#fff4f7] p-5"><p className="font-semibold">Cobros de hoy</p><p className="mt-2 text-2xl font-semibold">{resumen.cobros.length}</p><Link className="mt-3 inline-block font-semibold underline" to={`/cobros?fecha=${hoy()}`}>Ver cobros</Link></article></div><div className="mt-7"><h2 className="text-xl font-semibold">Próximos turnos de hoy</h2>{resumen.turnos.length ? <div className="mt-3 grid gap-2">{resumen.turnos.slice(0, 3).map((turno) => <Link className="rounded-xl border border-[#f1dce4] p-4 transition hover:bg-[#fff4f7]" key={turno.id} to={`/turnos/${turno.id}`}><strong>{hora(turno.inicio)} · {turno.clienta.nombre_completo}</strong><span className="ml-2 text-sm text-[#6f5b60]">{turno.estado_display}</span></Link>)}</div> : <p className="mt-3 text-sm text-[#6f5b60]">No tenés turnos para hoy.</p>}</div><div className="mt-7 flex flex-wrap gap-3"><Link className="rounded-xl bg-[#b76e79] px-4 py-2 font-semibold text-white" to="/turnos/nuevo">Nuevo turno</Link><Link className="rounded-xl border border-[#f1dce4] px-4 py-2 font-semibold" to="/clientas/nueva">Nueva clienta</Link><Link className="rounded-xl border border-[#f1dce4] px-4 py-2 font-semibold" to="/caja">Ver caja</Link><Link className="rounded-xl border border-[#f1dce4] px-4 py-2 font-semibold" to="/cobros">Ver cobros</Link></div></div></section></main>;
}

export default InicioPage;

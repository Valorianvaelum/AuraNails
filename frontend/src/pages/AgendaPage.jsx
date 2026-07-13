import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listClientas } from "../api/clientas.js";
import { consultarAgenda } from "../api/turnos.js";
import AppHeader from "../components/AppHeader.jsx";

const ESTADOS = [
  ["pendiente", "Pendientes"], ["confirmado", "Confirmados"],
  ["reprogramado", "Reprogramados"], ["realizado", "Realizados"],
  ["cancelado", "Cancelados"], ["no_vino", "No vino"],
];

const CLASES_ESTADO = {
  pendiente: "bg-[#f5ead7] text-[#76552e]", confirmado: "bg-[#e4eef9] text-[#365f8c]",
  reprogramado: "bg-[#eee7f8] text-[#674a88]", realizado: "bg-[#e7f5ea] text-[#356640]",
  cancelado: "bg-[#ece9ea] text-[#685d60]", no_vino: "bg-[#f5e2e4] text-[#8b3f4c]",
};

const hoy = () => new Date().toLocaleDateString("en-CA");
const fechaLocal = (valor) => new Date(`${valor}T12:00:00`);
const fechaParametro = (fecha) => fecha.toLocaleDateString("en-CA");
const sumarDias = (valor, dias) => {
  const fecha = fechaLocal(valor);
  fecha.setDate(fecha.getDate() + dias);
  return fechaParametro(fecha);
};
const inicioSemana = (valor) => {
  const fecha = fechaLocal(valor);
  fecha.setDate(fecha.getDate() - ((fecha.getDay() + 6) % 7));
  return fechaParametro(fecha);
};
const hora = (valor) => new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date(valor));
const dinero = (valor) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(valor);
const fechaLarga = (valor) => new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(fechaLocal(valor));
const fechaCorta = (valor) => new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short" }).format(fechaLocal(valor));

function mensajeError(error) {
  const data = error.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  if (Array.isArray(data?.non_field_errors)) return data.non_field_errors[0];
  return "Hubo un problema al cargar la agenda.";
}

function TarjetaTurno({ turno, resumida = false }) {
  const abierto = ["pendiente", "confirmado", "reprogramado"].includes(turno.estado);
  return <article className="rounded-2xl border border-[#f1dce4] bg-white p-4 transition-all duration-200 hover:border-[#c9aabd] hover:shadow-md">
    <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{hora(turno.inicio)} – {hora(turno.fin)}</p><h3 className="mt-1 text-lg font-semibold">{turno.clienta.nombre_completo}</h3></div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${CLASES_ESTADO[turno.estado]}`}>{turno.estado_display}</span></div>
    {!resumida && <><p className="mt-3 text-sm text-[#6f5b60]">{turno.servicios.map((servicio) => servicio.nombre).join(", ")}</p><p className="mt-2 text-sm">{turno.duracion_legible} · {dinero(turno.precio_estimado)}</p>{turno.estado === "realizado" && <p className={`mt-2 text-sm font-semibold ${turno.cobro_activo ? "text-[#356640]" : "text-[#76552e]"}`}>{turno.cobro_activo ? "Cobrado" : turno.puede_registrar_cobro ? "Pendiente de cobro" : "Estado de cobro no disponible"}</p>}</>}
    <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold"><Link className="underline" to={`/turnos/${turno.id}`}>Ver detalle</Link>{abierto && <Link className="underline" to={`/turnos/${turno.id}/editar`}>Editar</Link>}{abierto && <Link className="underline" to={`/turnos/${turno.id}/reprogramar`}>Reprogramar</Link>}</div>
  </article>;
}

export default function AgendaPage() {
  const [vista, setVista] = useState("dia");
  const [fecha, setFecha] = useState(hoy);
  const [estado, setEstado] = useState("");
  const [clientaId, setClientaId] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [clientas, setClientas] = useState([]);
  const [errorClientas, setErrorClientas] = useState("");
  const [agenda, setAgenda] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [reintentos, setReintentos] = useState(0);

  useEffect(() => {
    let vigente = true;
    listClientas({ estado: "todas" }).then((datos) => { if (vigente) setClientas(datos); }).catch(() => { if (vigente) setErrorClientas("No pudimos cargar las clientas para filtrar."); });
    return () => { vigente = false; };
  }, []);

  useEffect(() => {
    let vigente = true;
    const params = vista === "dia" ? { fecha } : { semana: fecha };
    if (estado) params.estado = estado;
    if (clientaId) params.clienta_id = clientaId;
    if (busqueda.trim()) params.search = busqueda.trim();
    setCargando(true); setError("");
    consultarAgenda(params).then((datos) => { if (vigente) setAgenda(datos); }).catch((requestError) => { if (vigente) { setAgenda(null); setError(mensajeError(requestError)); } }).finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [busqueda, clientaId, estado, fecha, reintentos, vista]);

  const tieneFiltros = Boolean(estado || clientaId || busqueda.trim());
  const desde = agenda?.desde || (vista === "dia" ? fecha : inicioSemana(fecha));
  const hasta = agenda?.hasta || (vista === "dia" ? fecha : sumarDias(inicioSemana(fecha), 6));
  const dias = Array.from({ length: 7 }, (_, indice) => sumarDias(desde, indice));
  const turnosPorDia = agenda?.turnos.reduce((resultado, turno) => ({ ...resultado, [turno.inicio.slice(0, 10)]: [...(resultado[turno.inicio.slice(0, 10)] || []), turno] }), {}) || {};
  const nuevoTurno = `/turnos/nuevo?fecha=${encodeURIComponent(fecha)}`;
  const mover = (cantidad) => setFecha((actual) => sumarDias(actual, vista === "dia" ? cantidad : cantidad * 7));

  return <main className="min-h-screen bg-[#fff4f7] text-[#3d2f32]"><AppHeader /><section className="mx-auto max-w-7xl px-5 py-8 sm:px-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b76e79]">Organización de turnos</p><h1 className="mt-2 text-3xl font-semibold">Agenda</h1><p className="mt-1 capitalize text-[#6f5b60]">{vista === "dia" ? fechaLarga(desde) : `${fechaLarga(desde)} al ${fechaLarga(hasta)}`}</p></div><Link className="rounded-xl bg-[#b76e79] px-4 py-2 font-semibold text-white" to={nuevoTurno}>Nuevo turno</Link></div>
    <section className="mt-6 rounded-2xl border border-[#f1dce4] bg-white p-5" aria-label="Controles de agenda"><div className="flex flex-wrap items-end gap-2.5"><div className="flex rounded-xl bg-[#fff4f7] p-1" role="group" aria-label="Vista de agenda"><button className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${vista === "dia" ? "bg-white text-[#563947] shadow-sm" : "text-[#6f5b60] hover:bg-white/70"}`} type="button" onClick={() => setVista("dia")}>Día</button><button className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${vista === "semana" ? "bg-white text-[#563947] shadow-sm" : "text-[#6f5b60] hover:bg-white/70"}`} type="button" onClick={() => setVista("semana")}>Semana</button></div><button className="rounded-xl border border-[#f1dce4] px-3 py-2 text-sm font-semibold transition hover:bg-[#faf6f8]" type="button" onClick={() => mover(-1)}>Anterior</button><button className="rounded-xl border border-[#f1dce4] px-3 py-2 text-sm font-semibold transition hover:bg-[#faf6f8]" type="button" onClick={() => setFecha(hoy())}>Hoy</button><button className="rounded-xl border border-[#f1dce4] px-3 py-2 text-sm font-semibold transition hover:bg-[#faf6f8]" type="button" onClick={() => mover(1)}>Siguiente</button><label className="ml-auto grid gap-1 text-sm font-medium">Fecha<input className="rounded-xl border border-[#f1dce4] px-3 py-2" type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} /></label></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><label className="grid gap-1 text-sm font-medium">Estado<select className="rounded-xl border border-[#f1dce4] px-3 py-2" value={estado} onChange={(event) => setEstado(event.target.value)}><option value="">Todos</option>{ESTADOS.map(([valor, etiqueta]) => <option value={valor} key={valor}>{etiqueta}</option>)}</select></label><label className="grid gap-1 text-sm font-medium">Clienta<select className="rounded-xl border border-[#f1dce4] px-3 py-2" value={clientaId} onChange={(event) => setClientaId(event.target.value)}><option value="">Todas las clientas</option>{clientas.map((clienta) => <option value={clienta.id} key={clienta.id}>{clienta.nombre_completo}</option>)}</select>{errorClientas && <span className="text-xs text-[#8b3f4c]">{errorClientas}</span>}</label><label className="grid gap-1 text-sm font-medium">Buscar clienta<input className="rounded-xl border border-[#f1dce4] px-3 py-2" placeholder="Nombre o teléfono" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} /></label></div>{tieneFiltros && <button className="mt-4 text-sm font-semibold underline underline-offset-4" type="button" onClick={() => { setEstado(""); setClientaId(""); setBusqueda(""); }}>Limpiar filtros</button>}</section>
    {cargando && <p className="mt-6">Cargando agenda...</p>}{error && <section className="mt-6 rounded-2xl border border-[#e7c5ca] bg-white p-5"><p className="text-[#8b3f4c]">{error}</p><button className="mt-3 font-semibold underline" type="button" onClick={() => setReintentos((actual) => actual + 1)}>Reintentar</button></section>}
    {!cargando && !error && agenda && vista === "dia" && <section className="mt-6 grid gap-3">{agenda.turnos.map((turno) => <TarjetaTurno turno={turno} key={turno.id} />)}{!agenda.turnos.length && <div className="rounded-3xl border border-dashed border-[#f1dce4] bg-white p-8 text-center"><p>{tieneFiltros ? "No encontramos turnos con los filtros seleccionados." : "Todavía no hay turnos para este día."}</p>{!tieneFiltros && <Link className="mt-3 inline-block font-semibold underline" to={nuevoTurno}>Crear turno</Link>}</div>}</section>}
    {!cargando && !error && agenda && vista === "semana" && <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-7">{dias.map((dia) => { const turnos = turnosPorDia[dia] || []; return <article className="min-w-0 rounded-2xl border border-[#f1dce4] bg-[#fffafa] p-3" key={dia}><div className="flex items-start justify-between gap-2"><h2 className="font-semibold capitalize">{fechaCorta(dia)}</h2><span className="rounded-full bg-white px-2 py-1 text-xs font-semibold">{turnos.length}</span></div><div className="mt-3 grid gap-2">{turnos.map((turno) => <TarjetaTurno turno={turno} resumida key={turno.id} />)}{!turnos.length && <p className="py-3 text-sm text-[#6f5b60]">Sin turnos.</p>}</div></article>; })}</section>}
  </section></main>;
}

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
  pendiente: "ui-badge ui-badge-pending", confirmado: "ui-badge ui-badge-confirmed",
  reprogramado: "ui-badge ui-badge-rescheduled", realizado: "ui-badge ui-badge-success",
  cancelado: "ui-badge ui-badge-neutral", no_vino: "ui-badge ui-badge-no-show",
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
  return (
    <article className="ui-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">{hora(turno.inicio)} – {hora(turno.fin)}</p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">{turno.clienta.nombre_completo}</h3>
        </div>
        <span className={CLASES_ESTADO[turno.estado]}>{turno.estado_display}</span>
      </div>

      {!resumida && (
        <div className="mt-4 rounded-lg border border-border bg-secondary p-3">
          <p className="text-sm text-muted-foreground">{turno.servicios.map((servicio) => servicio.nombre).join(", ")}</p>
          <p className="mt-2 text-sm font-medium text-foreground">{turno.duracion_legible} · {dinero(turno.precio_estimado)}</p>
          {turno.estado === "realizado" && (
            <p className={`mt-2 text-sm font-semibold ${turno.cobro_activo ? "text-[#356640]" : "text-[#76552e]"}`}>
              {turno.cobro_activo ? "Cobrado" : turno.puede_registrar_cobro ? "Pendiente de cobro" : "Estado de cobro no disponible"}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link className="ui-button ui-button-primary min-h-11" to={`/turnos/${turno.id}`}>Ver turno</Link>
        {abierto && !resumida && <Link className="ui-button ui-button-secondary min-h-11" to={`/turnos/${turno.id}/editar`}>Editar datos</Link>}
        {abierto && <Link className="ui-button ui-button-secondary min-h-11" to={`/turnos/${turno.id}/reprogramar`}>Reprogramar</Link>}
      </div>
    </article>
  );
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

  return (
    <main className="min-h-screen bg-[#fff4f7] text-[#3d2f32]">
      <AppHeader />
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Organización diaria y semanal</p>
            <h1 className="mt-2 text-3xl font-semibold">Agenda</h1>
            <p className="mt-1 capitalize text-muted-foreground">{vista === "dia" ? fechaLarga(desde) : `${fechaLarga(desde)} al ${fechaLarga(hasta)}`}</p>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Usá Agenda para organizar la jornada. Para buscar turnos históricos o revisar todos los estados, entrá en Todos los turnos.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="ui-button ui-button-secondary min-h-11" to="/turnos">Todos los turnos</Link>
            <Link className="ui-button ui-button-primary min-h-11" to={nuevoTurno}>Nuevo turno</Link>
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-card p-5" aria-label="Controles de agenda">
          <div className="flex flex-wrap items-end gap-2.5">
            <div className="flex rounded-xl bg-secondary p-1" role="group" aria-label="Vista de agenda">
              <button className={`min-h-11 rounded-lg px-4 text-sm font-semibold transition ${vista === "dia" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-card/70"}`} type="button" onClick={() => setVista("dia")}>Día</button>
              <button className={`min-h-11 rounded-lg px-4 text-sm font-semibold transition ${vista === "semana" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-card/70"}`} type="button" onClick={() => setVista("semana")}>Semana</button>
            </div>
            <button className="ui-button ui-button-secondary min-h-11" type="button" onClick={() => mover(-1)}>Anterior</button>
            <button className="ui-button ui-button-secondary min-h-11" type="button" onClick={() => setFecha(hoy())}>Hoy</button>
            <button className="ui-button ui-button-secondary min-h-11" type="button" onClick={() => mover(1)}>Siguiente</button>
            <label className="ml-auto grid gap-1 text-sm font-medium">Fecha<input type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} /></label>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm font-medium">Estado<select value={estado} onChange={(event) => setEstado(event.target.value)}><option value="">Todos</option>{ESTADOS.map(([valor, etiqueta]) => <option value={valor} key={valor}>{etiqueta}</option>)}</select></label>
            <label className="grid gap-1 text-sm font-medium">Clienta<select value={clientaId} onChange={(event) => setClientaId(event.target.value)}><option value="">Todas las clientas</option>{clientas.map((clienta) => <option value={clienta.id} key={clienta.id}>{clienta.nombre_completo}</option>)}</select>{errorClientas && <span className="text-xs text-destructive">{errorClientas}</span>}</label>
            <label className="grid gap-1 text-sm font-medium">Buscar clienta<input placeholder="Nombre o teléfono" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} /></label>
          </div>
          {tieneFiltros && <button className="mt-4 min-h-11 text-sm font-semibold text-primary underline underline-offset-4" type="button" onClick={() => { setEstado(""); setClientaId(""); setBusqueda(""); }}>Limpiar filtros</button>}
        </section>

        {cargando && <p className="mt-6">Cargando agenda...</p>}
        {error && <section className="mt-6 rounded-2xl border border-border bg-card p-5"><p className="text-destructive">{error}</p><button className="mt-3 min-h-11 font-semibold text-primary underline" type="button" onClick={() => setReintentos((actual) => actual + 1)}>Reintentar</button></section>}

        {!cargando && !error && agenda && vista === "dia" && (
          <section className="mt-6 grid gap-3">
            {agenda.turnos.map((turno) => <TarjetaTurno turno={turno} key={turno.id} />)}
            {!agenda.turnos.length && <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center"><p>{tieneFiltros ? "No encontramos turnos con los filtros seleccionados." : "Todavía no hay turnos para este día."}</p>{!tieneFiltros && <Link className="mt-3 ui-button ui-button-primary" to={nuevoTurno}>Crear turno</Link>}</div>}
          </section>
        )}

        {!cargando && !error && agenda && vista === "semana" && (
          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-7">
            {dias.map((dia) => {
              const turnos = turnosPorDia[dia] || [];
              return <article className="min-w-0 rounded-2xl border border-border bg-card p-3" key={dia}><div className="flex items-start justify-between gap-2"><h2 className="font-semibold capitalize">{fechaCorta(dia)}</h2><span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold">{turnos.length}</span></div><div className="mt-3 grid gap-2">{turnos.map((turno) => <TarjetaTurno turno={turno} resumida key={turno.id} />)}{!turnos.length && <p className="py-3 text-sm text-muted-foreground">Sin turnos.</p>}</div></article>;
            })}
          </section>
        )}
      </section>
    </main>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { listClientas } from "../api/clientas.js";
import { consultarAgenda } from "../api/turnos.js";
import AgendaControls from "../components/agenda/AgendaControls.jsx";
import { AgendaDayView, AgendaErrorState, AgendaLoadingState, AgendaWeekView } from "../components/agenda/AgendaViews.jsx";
import { AuraHero, AuraPage } from "../components/visual";

const ESTADOS_VALIDOS = new Set(["pendiente", "confirmado", "reprogramado", "realizado", "cancelado", "no_vino"]);
const VISTAS_VALIDAS = new Set(["dia", "semana"]);

const hoy = () => new Date().toLocaleDateString("en-CA");
const fechaValida = (valor) => /^\d{4}-\d{2}-\d{2}$/.test(valor || "") && !Number.isNaN(Date.parse(`${valor}T12:00:00`));
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
const fechaLarga = (valor) => new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(fechaLocal(valor));

function mensajeError(error) {
  const data = error.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  if (Array.isArray(data?.non_field_errors)) return data.non_field_errors[0];
  return "Hubo un problema al cargar la agenda.";
}

export default function AgendaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const vistaInicial = VISTAS_VALIDAS.has(searchParams.get("vista")) ? searchParams.get("vista") : "dia";
  const fechaInicial = fechaValida(searchParams.get("fecha")) ? searchParams.get("fecha") : hoy();
  const estadoInicial = ESTADOS_VALIDOS.has(searchParams.get("estado")) ? searchParams.get("estado") : "";
  const clientaInicial = searchParams.get("clienta") || "";
  const busquedaInicial = searchParams.get("search") || "";

  const [vista, setVista] = useState(vistaInicial);
  const [fecha, setFecha] = useState(fechaInicial);
  const [estado, setEstado] = useState(estadoInicial);
  const [clientaId, setClientaId] = useState(clientaInicial);
  const [busqueda, setBusqueda] = useState(busquedaInicial);
  const [busquedaAplicada, setBusquedaAplicada] = useState(busquedaInicial.trim());
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(Boolean(estadoInicial || clientaInicial || busquedaInicial));
  const [clientas, setClientas] = useState([]);
  const [errorClientas, setErrorClientas] = useState("");
  const [agenda, setAgenda] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [reintentos, setReintentos] = useState(0);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setBusquedaAplicada(busqueda.trim()), 300);
    return () => window.clearTimeout(timeoutId);
  }, [busqueda]);

  useEffect(() => {
    const params = {};
    if (vista !== "dia") params.vista = vista;
    if (fecha !== hoy()) params.fecha = fecha;
    if (estado) params.estado = estado;
    if (clientaId) params.clienta = clientaId;
    if (busqueda.trim()) params.search = busqueda.trim();
    setSearchParams(params, { replace: true });
  }, [busqueda, clientaId, estado, fecha, setSearchParams, vista]);

  useEffect(() => {
    let vigente = true;
    setErrorClientas("");
    listClientas({ estado: "todas" })
      .then((datos) => {
        if (vigente) setClientas(datos);
      })
      .catch(() => {
        if (vigente) setErrorClientas("No pudimos cargar las clientas para filtrar.");
      });
    return () => { vigente = false; };
  }, []);

  useEffect(() => {
    let vigente = true;
    const params = vista === "dia" ? { fecha } : { semana: fecha };
    if (estado) params.estado = estado;
    if (clientaId) params.clienta_id = clientaId;
    if (busquedaAplicada) params.search = busquedaAplicada;

    setCargando(true);
    setError("");
    consultarAgenda(params)
      .then((datos) => {
        if (vigente) setAgenda(datos);
      })
      .catch((requestError) => {
        if (vigente) {
          setAgenda(null);
          setError(mensajeError(requestError));
        }
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => { vigente = false; };
  }, [busquedaAplicada, clientaId, estado, fecha, reintentos, vista]);

  const tieneFiltros = Boolean(estado || clientaId || busqueda.trim());
  const desde = agenda?.desde || (vista === "dia" ? fecha : inicioSemana(fecha));
  const hasta = agenda?.hasta || (vista === "dia" ? fecha : sumarDias(inicioSemana(fecha), 6));
  const dias = useMemo(() => Array.from({ length: 7 }, (_, indice) => sumarDias(desde, indice)), [desde]);
  const turnos = useMemo(
    () => [...(agenda?.turnos || [])].sort((a, b) => new Date(a.inicio) - new Date(b.inicio)),
    [agenda],
  );
  const turnosPorDia = useMemo(() => turnos.reduce((resultado, turno) => {
    const dia = turno.inicio.slice(0, 10);
    resultado[dia] = [...(resultado[dia] || []), turno];
    return resultado;
  }, {}), [turnos]);
  const nuevoTurno = `/turnos/nuevo?fecha=${encodeURIComponent(fecha)}`;
  const rangoVisible = vista === "dia" ? fechaLarga(desde) : `${fechaLarga(desde)} al ${fechaLarga(hasta)}`;

  const cambiarFecha = (valor) => {
    if (fechaValida(valor)) setFecha(valor);
  };

  const limpiarFiltros = () => {
    setEstado("");
    setClientaId("");
    setBusqueda("");
  };

  const mover = (cantidad) => {
    setFecha((actual) => sumarDias(actual, vista === "dia" ? cantidad : cantidad * 7));
  };

  return (
    <AuraPage width="wide" className="aura-agenda-page">
      <div className="aura-agenda-stack">
        <AuraHero
          className="aura-agenda-hero"
          eyebrow="Organización diaria y semanal"
          title="Agenda"
          description={rangoVisible}
          actions={(
            <>
              <Link className="aura-button aura-button-secondary" to="/turnos">Todos los turnos</Link>
              <Link className="aura-button aura-button-primary" to={nuevoTurno}>Nuevo turno</Link>
            </>
          )}
        >
          <p className="aura-agenda-hero-note">Organizá la jornada, revisá disponibilidad y accedé al detalle de cada turno.</p>
        </AuraHero>

        <AgendaControls
          busqueda={busqueda}
          clientaId={clientaId}
          clientas={clientas}
          errorClientas={errorClientas}
          estado={estado}
          fecha={fecha}
          filtrosAbiertos={filtrosAbiertos}
          tieneFiltros={tieneFiltros}
          vista={vista}
          onBusquedaChange={setBusqueda}
          onClientaChange={setClientaId}
          onEstadoChange={setEstado}
          onFechaChange={cambiarFecha}
          onLimpiarFiltros={limpiarFiltros}
          onMover={mover}
          onToggleFiltros={() => setFiltrosAbiertos((actual) => !actual)}
          onVistaChange={setVista}
        />

        {cargando ? <AgendaLoadingState vista={vista} /> : null}
        {!cargando && error ? <AgendaErrorState message={error} onRetry={() => setReintentos((actual) => actual + 1)} /> : null}
        {!cargando && !error && agenda && vista === "dia" ? (
          <AgendaDayView
            fecha={desde}
            tieneFiltros={tieneFiltros}
            turnos={turnos}
            onClearFilters={limpiarFiltros}
          />
        ) : null}
        {!cargando && !error && agenda && vista === "semana" ? (
          <AgendaWeekView
            dias={dias}
            tieneFiltros={tieneFiltros}
            turnosPorDia={turnosPorDia}
            onClearFilters={limpiarFiltros}
          />
        ) : null}
      </div>
    </AuraPage>
  );
}

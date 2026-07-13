import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { listClientas } from "../api/clientas.js";
import { listServicios } from "../api/servicios.js";
import { actualizarTurno, crearTurno, obtenerTurno } from "../api/turnos.js";
import AppHeader from "../components/AppHeader.jsx";
import FieldError from "../components/FieldError.jsx";
import { focusFirstError, normalizeApiError } from "../utils/apiErrors.js";

const dinero = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
const hoy = () => new Date().toLocaleDateString("en-CA");

function mensajeDeError(error, predeterminado) {
  const data = error.response?.data;
  if (!error.response) return "No pudimos comunicarnos con el servidor.";
  if (typeof data?.detail === "string") return data.detail;
  for (const campo of ["inicio", "clienta_id", "servicios_ids", "non_field_errors"]) {
    const value = data?.[campo];
    if (typeof value === "string") return value;
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  }
  return predeterminado || "Ocurrió un error inesperado.";
}

export default function TurnoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editando = Boolean(id);
  const fechaAgenda = searchParams.get("fecha");
  const horaAgenda = searchParams.get("hora");
  const [clientas, setClientas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [error, setError] = useState("");
  const [erroresCampos, setErroresCampos] = useState({});
  const refs = {
    clienta_id: useRef(null),
    inicio: useRef(null),
    servicios_ids: useRef(null),
  };
  const [estadoTurno, setEstadoTurno] = useState("");
  const [valores, setValores] = useState({
    clienta_id: "",
    fecha: !editando && /^\d{4}-\d{2}-\d{2}$/.test(fechaAgenda || "") ? fechaAgenda : hoy(),
    hora: !editando && /^\d{2}:\d{2}$/.test(horaAgenda || "") ? horaAgenda : "09:00",
    servicios_ids: [],
    notas: "",
  });

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setErrorCarga("");
    setError("");

    const cargaTurno = editando ? obtenerTurno(id) : Promise.resolve(null);
    Promise.all([
      listClientas({ estado: editando ? "todas" : "activas" }),
      listServicios({ estado: editando ? "todos" : "activos" }),
      cargaTurno,
    ])
      .then(([clientasData, serviciosData, turno]) => {
        if (!vigente) return;
        setClientas(clientasData);
        setServicios(serviciosData);
        if (turno) {
          setEstadoTurno(turno.estado);
          setValores({
            clienta_id: String(turno.clienta.id),
            fecha: turno.inicio.slice(0, 10),
            hora: turno.inicio.slice(11, 16),
            servicios_ids: turno.servicios.map((servicio) => servicio.servicio_id),
            notas: turno.notas || "",
          });
        }
      })
      .catch((requestError) => {
        if (vigente) setErrorCarga(mensajeDeError(requestError, "No pudimos cargar los datos necesarios para este turno."));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [editando, id]);

  const serviciosSeleccionados = servicios.filter((servicio) => valores.servicios_ids.includes(servicio.id));
  const minutos = serviciosSeleccionados.reduce((total, servicio) => total + servicio.duracion_minutos, 0);
  const precio = serviciosSeleccionados.reduce((total, servicio) => total + Number(servicio.precio), 0);
  const turnoNoEditable = ["cancelado", "realizado", "no_vino"].includes(estadoTurno);

  const guardar = async (event) => {
    event.preventDefault();
    setError("");
    setErroresCampos({});
    const erroresLocales = {};
    if (!valores.clienta_id) erroresLocales.clienta_id = "Elegí una clienta.";
    if (!valores.fecha || !valores.hora) erroresLocales.inicio = "Indicá la fecha y la hora del turno.";
    if (!valores.servicios_ids.length) erroresLocales.servicios_ids = "Elegí al menos un servicio.";
    if (Object.keys(erroresLocales).length) {
      setErroresCampos(erroresLocales);
      focusFirstError(refs, erroresLocales);
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        clienta_id: Number(valores.clienta_id),
        inicio: `${valores.fecha}T${valores.hora}:00-03:00`,
        servicios_ids: valores.servicios_ids,
        notas: valores.notas,
      };
      const turno = editando
        ? await actualizarTurno(id, payload)
        : await crearTurno(payload);
      navigate(`/turnos/${turno.id}`);
    } catch (requestError) {
      const errorApi = normalizeApiError(requestError, "No pudimos guardar el turno. Intentá nuevamente.");
      const errores = {
        clienta_id: errorApi.fields.clienta_id,
        inicio: errorApi.fields.inicio,
        servicios_ids: errorApi.fields.servicios_ids,
      };
      const hayErroresDeCampo = Object.values(errores).some(Boolean);
      const mensajeInicio = errores.inicio || (!hayErroresDeCampo ? errorApi.formError : "");
      const erroresFinales = { ...errores, inicio: mensajeInicio };
      setErroresCampos(erroresFinales);
      setError(mensajeInicio ? "" : errorApi.formError);
      focusFirstError(refs, erroresFinales);
    } finally {
      setGuardando(false);
    }
  };

  const cambiarServicio = (servicioId) => {
    setValores((actual) => ({
      ...actual,
      servicios_ids: actual.servicios_ids.includes(servicioId)
        ? actual.servicios_ids.filter((idServicio) => idServicio !== servicioId)
        : [...actual.servicios_ids, servicioId],
    }));
  };

  return (
    <main className="min-h-screen bg-[#fff4f7] text-[#3d2f32]">
      <AppHeader />
      <section className="mx-auto max-w-3xl px-5 py-8">
        <Link to="/turnos">Volver</Link>
        <h1 className="mt-4 text-3xl font-semibold">{editando ? "Editar turno" : "Nuevo turno"}</h1>
        {cargando ? (
          <p className="mt-6">Cargando datos del turno...</p>
        ) : !errorCarga && !turnoNoEditable ? (
          <form className="mt-6 space-y-5 rounded-2xl border bg-white p-6" onSubmit={guardar}>
            <label className="grid gap-1">
              Clienta
              <select
                ref={refs.clienta_id}
                className={`w-full rounded-xl border p-3 ${erroresCampos.clienta_id ? "field-invalid" : ""}`}
                aria-invalid={Boolean(erroresCampos.clienta_id)}
                aria-describedby={erroresCampos.clienta_id ? "turno-clienta-error" : undefined}
                required
                value={valores.clienta_id}
                onChange={(event) => { setValores({ ...valores, clienta_id: event.target.value }); setErroresCampos((actual) => ({ ...actual, clienta_id: undefined })); }}
              >
                <option value="">Elegí una clienta</option>
                {clientas.map((clienta) => (
                  <option value={clienta.id} key={clienta.id}>
                    {clienta.nombre_completo}{clienta.telefono ? ` · ${clienta.telefono}` : ""}{!clienta.activa ? " (inactiva)" : ""}
                  </option>
                ))}
              </select>
              <FieldError id="turno-clienta-error" message={erroresCampos.clienta_id} />
            </label>
            {!clientas.length && (
              <p>Primero necesitás agregar una clienta. <Link to="/clientas/nueva">Agregar clienta</Link></p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                Fecha
                <input ref={refs.inicio} className={`rounded-xl border p-3 ${erroresCampos.inicio ? "field-invalid" : ""}`} aria-invalid={Boolean(erroresCampos.inicio)} aria-describedby={erroresCampos.inicio ? "turno-inicio-error" : undefined} required type="date" value={valores.fecha} onChange={(event) => { setValores({ ...valores, fecha: event.target.value }); setErroresCampos((actual) => ({ ...actual, inicio: undefined })); }} />
              </label>
              <label className="grid gap-1">
                Hora
                <input className={`rounded-xl border p-3 ${erroresCampos.inicio ? "field-invalid" : ""}`} aria-invalid={Boolean(erroresCampos.inicio)} aria-describedby={erroresCampos.inicio ? "turno-inicio-error" : undefined} required type="time" value={valores.hora} onChange={(event) => { setValores({ ...valores, hora: event.target.value }); setErroresCampos((actual) => ({ ...actual, inicio: undefined })); }} />
              </label>
            </div>
            <FieldError id="turno-inicio-error" message={erroresCampos.inicio} />
            <fieldset ref={refs.servicios_ids} tabIndex="-1" className={erroresCampos.servicios_ids ? "field-invalid" : ""} aria-invalid={Boolean(erroresCampos.servicios_ids)} aria-describedby={erroresCampos.servicios_ids ? "turno-servicios-error" : undefined}>
              <legend>Servicios</legend>
              {!servicios.length && <p className="mt-2">No hay servicios disponibles para este turno.</p>}
              {servicios.map((servicio) => (
                <label className="mt-2 flex gap-3 rounded-xl border p-3" key={servicio.id}>
                  <input type="checkbox" checked={valores.servicios_ids.includes(servicio.id)} onChange={() => cambiarServicio(servicio.id)} />
                  <span>
                    {servicio.nombre} · {servicio.duracion_legible} · {dinero(servicio.precio)} {!servicio.activo ? "(pausado)" : ""}
                  </span>
                </label>
              ))}
            </fieldset>
            <FieldError id="turno-servicios-error" message={erroresCampos.servicios_ids} />
            <div className="rounded-xl bg-[#fff8f7] p-4">
              Duración estimada: {minutos} min<br />
              Precio estimado: {dinero(precio)}
            </div>
            <label className="grid gap-1">
              Notas
              <textarea className="w-full rounded-xl border p-3" value={valores.notas} onChange={(event) => setValores({ ...valores, notas: event.target.value })} />
            </label>
            {error && <p className="text-[#8b3f4c]">{error}</p>}
            <button disabled={guardando} className="rounded-xl bg-[#b76e79] px-5 py-3 text-white">
              {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Guardar turno"}
            </button>
          </form>
        ) : null}
        {!cargando && errorCarga && <p className="mt-4 text-[#8b3f4c]">{errorCarga}</p>}
        {!cargando && !errorCarga && turnoNoEditable && <p className="mt-4">Este turno ya no puede editarse.</p>}
      </section>
    </main>
  );
}

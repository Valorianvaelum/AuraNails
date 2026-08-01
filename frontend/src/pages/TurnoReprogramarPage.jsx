import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { obtenerTurno, reprogramarTurno } from "../api/turnos.js";
import AppHeader from "../components/AppHeader.jsx";
import FieldError from "../components/FieldError.jsx";
import FormActions from "../components/FormActions.jsx";
import { focusFirstError, normalizeApiError } from "../utils/apiErrors.js";

function mensajeDeError(error, predeterminado) {
  const data = error.response?.data;
  if (!error.response) return "No pudimos comunicarnos con el servidor.";
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.inicio === "string") return data.inicio;
  if (typeof data?.inicio?.[0] === "string") return data.inicio[0];
  return predeterminado || "Ocurrió un error inesperado.";
}

export default function TurnoReprogramarPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [turno, setTurno] = useState(null);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [erroresCampos, setErroresCampos] = useState({});
  const refs = { inicio: useRef(null) };

  useEffect(() => {
    let vigente = true;
    obtenerTurno(id)
      .then((data) => { if (!vigente) return; setTurno(data); setFecha(data.inicio.slice(0, 10)); setHora(data.inicio.slice(11, 16)); })
      .catch((requestError) => { if (vigente) setError(mensajeDeError(requestError, "No encontramos este turno.")); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [id]);

  const guardar = async (event) => {
    event.preventDefault(); setError(""); setErroresCampos({}); setGuardando(true);
    try { await reprogramarTurno(id, { inicio: `${fecha}T${hora}:00-03:00` }); navigate(`/turnos/${id}`, { state: { message: "Turno reprogramado." } }); }
    catch (requestError) { const parsed = normalizeApiError(requestError, mensajeDeError(requestError, "No pudimos reprogramar el turno.")); const inicio = parsed.fields.inicio || parsed.formError; setErroresCampos({ inicio }); setError(parsed.fields.inicio ? "" : parsed.formError); focusFirstError(refs, { inicio }); }
    finally { setGuardando(false); }
  };

  const cancelTo = `/turnos/${id}`;

  return (
    <main className="min-h-screen text-foreground">
      <AppHeader />
      <section className="mx-auto max-w-xl px-5 py-8">
        <Link className="text-sm font-semibold text-primary underline underline-offset-4" to={cancelTo}>Volver</Link>
        <h1 className="mt-4 text-3xl font-semibold">Reprogramar turno</h1>
        {cargando && <p className="mt-5 text-muted-foreground">Cargando turno...</p>}
        {!cargando && error && <p className="mt-5 text-destructive">{error}</p>}
        {!cargando && turno && ["cancelado", "realizado", "no_vino"].includes(turno.estado) && <p className="mt-5">Este turno ya no puede reprogramarse.</p>}
        {!cargando && turno && !["cancelado", "realizado", "no_vino"].includes(turno.estado) && (
          <form className="mt-5 space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm" onSubmit={guardar}>
            <div className="rounded-lg bg-secondary p-4"><p className="font-semibold">{turno.clienta.nombre_completo}</p><p className="mt-1 text-sm text-muted-foreground">{turno.servicios.map((servicio) => servicio.nombre).join(", ")} · {turno.duracion_legible}</p></div>
            <label className="grid gap-1">Nueva fecha<input aria-describedby={erroresCampos.inicio ? "inicio-error" : undefined} aria-invalid={Boolean(erroresCampos.inicio)} className={erroresCampos.inicio ? "field-invalid" : ""} required type="date" ref={refs.inicio} value={fecha} onChange={(event) => setFecha(event.target.value)} /></label>
            <label className="grid gap-1">Nueva hora<input aria-describedby={erroresCampos.inicio ? "inicio-error" : undefined} aria-invalid={Boolean(erroresCampos.inicio)} className={erroresCampos.inicio ? "field-invalid" : ""} required type="time" value={hora} onChange={(event) => setHora(event.target.value)} /></label>
            <FieldError id="inicio-error" message={erroresCampos.inicio} />
            {error && <p className="text-destructive">{error}</p>}
            <FormActions cancelTo={cancelTo} isSubmitting={guardando} submitLabel="Guardar nueva fecha" submittingLabel="Reprogramando..." />
          </form>
        )}
      </section>
    </main>
  );
}

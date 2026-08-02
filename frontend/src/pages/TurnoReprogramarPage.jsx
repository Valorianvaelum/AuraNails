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

function fechaValida(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function horaValida(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export default function TurnoReprogramarPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [turno, setTurno] = useState(null);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [valoresIniciales, setValoresIniciales] = useState({ fecha: "", hora: "" });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [erroresCampos, setErroresCampos] = useState({});
  const refs = { inicio: useRef(null) };

  useEffect(() => {
    let vigente = true;
    obtenerTurno(id)
      .then((data) => {
        if (!vigente) return;
        const nuevaFecha = data.inicio.slice(0, 10);
        const nuevaHora = data.inicio.slice(11, 16);
        setTurno(data);
        setFecha(nuevaFecha);
        setHora(nuevaHora);
        setValoresIniciales({ fecha: nuevaFecha, hora: nuevaHora });
      })
      .catch((requestError) => {
        if (vigente) setError(mensajeDeError(requestError, "No encontramos este turno."));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [id]);

  const isDirty = fecha !== valoresIniciales.fecha || hora !== valoresIniciales.hora;

  const guardar = async (event) => {
    event.preventDefault();
    if (guardando) return;

    setError("");
    setErroresCampos({});

    if (!fechaValida(fecha) || !horaValida(hora)) {
      const errors = { inicio: "Indicá una fecha y una hora válidas." };
      setErroresCampos(errors);
      focusFirstError(refs, errors);
      return;
    }

    if (!isDirty) {
      setError("La fecha y la hora son iguales a las actuales. Modificá al menos uno de los dos valores.");
      refs.inicio.current?.focus();
      return;
    }

    setGuardando(true);
    try {
      await reprogramarTurno(id, { inicio: `${fecha}T${hora}:00-03:00` });
      navigate(`/turnos/${id}`, { state: { message: "Turno reprogramado." } });
    } catch (requestError) {
      const parsed = normalizeApiError(requestError, mensajeDeError(requestError, "No pudimos reprogramar el turno."));
      const inicio = parsed.fields.inicio || parsed.formError;
      setErroresCampos({ inicio });
      setError(parsed.fields.inicio ? "" : parsed.formError);
      focusFirstError(refs, { inicio });
    } finally {
      setGuardando(false);
    }
  };

  const cancelTo = `/turnos/${id}`;
  const turnoNoEditable = turno && ["cancelado", "realizado", "no_vino"].includes(turno.estado);

  return (
    <main className="min-h-screen text-foreground">
      <AppHeader />
      <section className="mx-auto max-w-xl px-5 py-8">
        <Link className="text-sm font-semibold text-primary underline underline-offset-4" to={cancelTo}>Volver</Link>
        <h1 className="mt-4 text-3xl font-semibold">Reprogramar turno</h1>
        {cargando && <p className="mt-5 text-muted-foreground">Cargando turno...</p>}
        {!cargando && error && !turno && <p className="mt-5 text-destructive">{error}</p>}
        {!cargando && turnoNoEditable && <p className="mt-5">Este turno ya no puede reprogramarse.</p>}
        {!cargando && turno && !turnoNoEditable && (
          <form className="mt-5 space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm" onSubmit={guardar} noValidate>
            <div className="rounded-lg bg-secondary p-4">
              <p className="font-semibold">{turno.clienta.nombre_completo}</p>
              <p className="mt-1 text-sm text-muted-foreground">{turno.servicios.map((servicio) => servicio.nombre).join(", ")} · {turno.duracion_legible}</p>
            </div>
            <label className="grid gap-1">
              Nueva fecha
              <input
                aria-describedby={erroresCampos.inicio ? "inicio-error" : undefined}
                aria-invalid={Boolean(erroresCampos.inicio)}
                className={erroresCampos.inicio ? "field-invalid" : ""}
                disabled={guardando}
                required
                type="date"
                ref={refs.inicio}
                value={fecha}
                onChange={(event) => {
                  setFecha(event.target.value);
                  setErroresCampos({});
                  setError("");
                }}
              />
            </label>
            <label className="grid gap-1">
              Nueva hora
              <input
                aria-describedby={erroresCampos.inicio ? "inicio-error" : undefined}
                aria-invalid={Boolean(erroresCampos.inicio)}
                className={erroresCampos.inicio ? "field-invalid" : ""}
                disabled={guardando}
                required
                type="time"
                value={hora}
                onChange={(event) => {
                  setHora(event.target.value);
                  setErroresCampos({});
                  setError("");
                }}
              />
            </label>
            <FieldError id="inicio-error" message={erroresCampos.inicio} />
            {error && <p className="text-destructive" role="alert">{error}</p>}
            <FormActions cancelTo={cancelTo} isDirty={isDirty} isSubmitting={guardando} submitLabel="Guardar nueva fecha" submittingLabel="Reprogramando..." />
          </form>
        )}
      </section>
    </main>
  );
}

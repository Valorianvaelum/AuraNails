import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { obtenerTurno, reprogramarTurno } from "../api/turnos.js";
import FieldError from "../components/FieldError.jsx";
import FormActions from "../components/FormActions.jsx";
import { AuraHero, AuraPage, AuraPanel } from "../components/visual";
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
    <AuraPage width="compact">
      <div className="grid gap-5">
        <AuraHero
          eyebrow="Turnos"
          title="Reprogramar turno"
          description="Modificá la fecha y la hora sin perder el resto de la información del turno."
          back={<Link className="aura-glass-link" to={cancelTo}>Volver al turno</Link>}
        />
        {cargando && <AuraPanel><p className="aura-form-status">Cargando turno...</p></AuraPanel>}
        {!cargando && error && !turno && <AuraPanel><p className="text-destructive">{error}</p></AuraPanel>}
        {!cargando && turnoNoEditable && <AuraPanel><p>Este turno ya no puede reprogramarse.</p></AuraPanel>}
        {!cargando && turno && !turnoNoEditable && (
          <AuraPanel as="form" className="aura-form-panel" onSubmit={guardar} noValidate>
            <div className="aura-inset">
              <p className="font-semibold">{turno.clienta.nombre_completo}</p>
              <p className="mt-1 text-sm">{turno.servicios.map((servicio) => servicio.nombre).join(", ")} · {turno.duracion_legible}</p>
            </div>
            <div className="aura-field">
              <label className="aura-field-label mb-2 block" htmlFor="reprogramar-fecha">Nueva fecha</label>
              <input
                id="reprogramar-fecha"
                aria-describedby={erroresCampos.inicio ? "inicio-error" : undefined}
                aria-invalid={Boolean(erroresCampos.inicio)}
                className={`aura-control ${erroresCampos.inicio ? "field-invalid" : ""}`}
                disabled={guardando}
                required
                type="date"
                ref={refs.inicio}
                value={fecha}
                onChange={(event) => { setFecha(event.target.value); setErroresCampos({}); setError(""); }}
              />
            </div>
            <div className="aura-field">
              <label className="aura-field-label mb-2 block" htmlFor="reprogramar-hora">Nueva hora</label>
              <input
                id="reprogramar-hora"
                aria-describedby={erroresCampos.inicio ? "inicio-error" : undefined}
                aria-invalid={Boolean(erroresCampos.inicio)}
                className={`aura-control ${erroresCampos.inicio ? "field-invalid" : ""}`}
                disabled={guardando}
                required
                type="time"
                value={hora}
                onChange={(event) => { setHora(event.target.value); setErroresCampos({}); setError(""); }}
              />
            </div>
            <FieldError id="inicio-error" message={erroresCampos.inicio} />
            {error && <p className="text-destructive" role="alert">{error}</p>}
            <FormActions cancelTo={cancelTo} isDirty={isDirty} isSubmitting={guardando} submitLabel="Guardar nueva fecha" submittingLabel="Reprogramando..." />
          </AuraPanel>
        )}
      </div>
    </AuraPage>
  );
}

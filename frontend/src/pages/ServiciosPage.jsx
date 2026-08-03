import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";

import { estadoServicio, getServicio, listServicios, saveServicio } from "../api/servicios.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import FieldError from "../components/FieldError.jsx";
import FormActions from "../components/FormActions.jsx";
import { AuraEmptyState, AuraHero, AuraPage, AuraPanel, AuraPanelHeader, AuraRecordCard } from "../components/visual";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges.js";
import { focusFirstError, normalizeApiError } from "../utils/apiErrors.js";
import { requiredText, validNumber } from "../utils/validators.js";

const money = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
const initial = { nombre: "", descripcion: "", duracion_minutos: "60", precio: "", orden: "0" };

function List() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("activos");
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    listServicios({ search, estado }).then(setItems).catch(() => setError("No pudimos cargar tus servicios."));
  }, [search, estado]);

  const empty = search ? "No encontramos servicios con esa búsqueda." : estado === "pausados" ? "No tenés servicios pausados." : "Todavía no agregaste ningún servicio.";

  return (
    <AuraPage width="content">
      <div className="grid gap-5">
        <AuraHero
          eyebrow="Configuración"
          title="Mis servicios"
          description="Administrá los tratamientos, su duración y el precio que se utilizará al crear turnos."
          actions={<Link className="aura-button aura-button-primary" to="nuevo">Nuevo servicio</Link>}
        />

        <AuraPanel>
          <AuraPanelHeader title="Buscar y filtrar" description="Encontrá un servicio por nombre o revisá los que están pausados." />
          <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
            <input className="aura-control" placeholder="Buscar servicios" value={search} onChange={(event) => setSearch(event.target.value)} />
            <select className="aura-control" value={estado} onChange={(event) => setEstado(event.target.value)}>
              <option value="activos">Activos</option>
              <option value="pausados">Pausados</option>
              <option value="todos">Todos</option>
            </select>
          </div>
        </AuraPanel>

        {error && <p className="rounded-lg bg-[var(--color-danger-soft)] px-4 py-3 text-destructive">{error}</p>}

        <AuraPanel>
          <AuraPanelHeader title="Servicios disponibles" description="Cada tarjeta resume duración, precio y estado." />
          <div className="grid gap-3">
            {items.map((servicio) => (
              <AuraRecordCard as={Link} className="aura-service-card p-5" to={`${servicio.id}`} key={servicio.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <strong className="text-base">{servicio.nombre}</strong>
                    <p className="mt-2 text-sm text-muted-foreground">{servicio.duracion_legible}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{money(servicio.precio)}</p>
                    <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${servicio.activo ? "ui-badge-success" : "ui-badge-brand"}`}>{servicio.activo ? "Activo" : "Pausado"}</span>
                  </div>
                </div>
              </AuraRecordCard>
            ))}
            {!error && !items.length && <AuraEmptyState title={empty} />}
          </div>
        </AuraPanel>
      </div>
    </AuraPage>
  );
}

function validateServicio(values) {
  return {
    nombre: requiredText(values.nombre, "El nombre"),
    duracion_minutos: validNumber(values.duracion_minutos, { label: "La duración", min: 1, max: 1440, allowZero: false }),
    precio: validNumber(values.precio, { label: "El precio", min: 0, max: 999999999 }),
    orden: validNumber(values.orden, { label: "La posición", min: 0, max: 9999 }),
  };
}

function Form() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [valores, setValores] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [guardando, setGuardando] = useState(false);
  const refs = { nombre: useRef(null), duracion_minutos: useRef(null), precio: useRef(null), orden: useRef(null) };
  const campos = [["nombre", "Nombre", "text"], ["descripcion", "Descripción", "text"], ["duracion_minutos", "Duración estimada (minutos)", "number"], ["precio", "Precio en pesos argentinos", "number"], ["orden", "Posición en la lista", "number"]];

  useEffect(() => {
    if (!id) return;
    getServicio(id)
      .then((servicio) => {
        const normalized = {
          nombre: servicio.nombre ?? "",
          descripcion: servicio.descripcion ?? "",
          duracion_minutos: String(servicio.duracion_minutos ?? "60"),
          precio: String(servicio.precio ?? ""),
          orden: String(servicio.orden ?? "0"),
        };
        setValores(normalized);
        setBaseline(normalized);
      })
      .catch(() => setError("No encontramos este servicio."));
  }, [id]);

  const isDirty = useMemo(() => JSON.stringify(valores) !== JSON.stringify(baseline), [baseline, valores]);
  const unsaved = useUnsavedChanges({ isDirty, isSubmitting: guardando });

  const validateField = (name, value = valores[name]) => {
    const errors = validateServicio({ ...valores, [name]: value });
    setFieldErrors((current) => ({ ...current, [name]: errors[name] || undefined }));
    return errors[name];
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValores((current) => ({ ...current, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((current) => ({ ...current, [name]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (guardando) return;
    setError("");
    const errors = validateServicio(valores);
    const visibleErrors = Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
    if (Object.keys(visibleErrors).length) {
      setFieldErrors(visibleErrors);
      focusFirstError(refs, visibleErrors);
      return;
    }

    setFieldErrors({});
    setGuardando(true);
    try {
      const payload = {
        nombre: valores.nombre.trim(),
        descripcion: valores.descripcion.trim(),
        duracion_minutos: Number(valores.duracion_minutos),
        precio: Number(valores.precio),
        orden: Number(valores.orden),
      };
      const servicio = await saveServicio(id, payload);
      setBaseline(valores);
      navigate(`/servicios/${servicio.id}`);
    } catch (requestError) {
      const parsed = normalizeApiError(requestError, "No pudimos guardar el servicio. Intentá nuevamente.");
      setFieldErrors(parsed.fields);
      setError(parsed.formError);
      focusFirstError(refs, parsed.fields);
    } finally {
      setGuardando(false);
    }
  };

  const cancelTo = id ? `/servicios/${id}` : "/servicios";

  return (
    <AuraPage width="form">
      <div className="grid gap-5">
        <AuraHero
          eyebrow="Servicios"
          title={id ? "Editar servicio" : "Nuevo servicio"}
          description="Definí la duración, el importe y el orden para que crear turnos sea más rápido y consistente."
          back={<button className="aura-glass-link" type="button" onClick={() => unsaved.requestNavigation(cancelTo)}>Volver a servicios</button>}
        />

        <AuraPanel as="form" className="aura-form-panel" onSubmit={submit} noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            {campos.map(([nombre, etiqueta, tipo]) => (
              <div className={`aura-field ${nombre === "descripcion" ? "sm:col-span-2" : ""}`} key={nombre}>
                <label className="aura-field-label mb-2 block" htmlFor={`servicio-${nombre}`}>{etiqueta}{nombre !== "descripcion" ? " *" : ""}</label>
                {nombre === "orden" && <p className="aura-field-help mb-2 text-sm">Los números más bajos se muestran primero.</p>}
                <input
                  aria-describedby={fieldErrors[nombre] ? `${nombre}-error` : undefined}
                  aria-invalid={Boolean(fieldErrors[nombre])}
                  className={`aura-control ${fieldErrors[nombre] ? "field-invalid" : ""}`}
                  disabled={guardando}
                  id={`servicio-${nombre}`}
                  max={nombre === "duracion_minutos" ? "1440" : nombre === "orden" ? "9999" : undefined}
                  min={tipo === "number" ? (nombre === "duracion_minutos" ? "1" : "0") : undefined}
                  name={nombre}
                  onBlur={() => validateField(nombre)}
                  onChange={handleChange}
                  ref={refs[nombre]}
                  required={nombre !== "descripcion"}
                  step={nombre === "precio" ? "0.01" : "1"}
                  type={tipo}
                  value={valores[nombre] ?? ""}
                />
                <FieldError id={`${nombre}-error`} message={fieldErrors[nombre]} />
              </div>
            ))}
          </div>
          <p className="aura-field-help text-sm">Ejemplo: 90 minutos equivale a 1 h 30 min.</p>
          {error && <p className="rounded-lg bg-[var(--color-danger-soft)] px-4 py-3 text-destructive" role="alert">{error}</p>}
          <FormActions isDirty={isDirty} isSubmitting={guardando} onCancel={() => unsaved.requestNavigation(cancelTo)} submitLabel={id ? "Guardar cambios" : "Guardar servicio"} />
        </AuraPanel>
      </div>

      <ConfirmDialog
        open={unsaved.confirmOpen}
        title="¿Descartar los cambios?"
        description="Los datos modificados en este servicio no se guardarán."
        confirmLabel="Descartar cambios"
        destructive
        onClose={unsaved.stay}
        onConfirm={unsaved.discardAndLeave}
      />
    </AuraPage>
  );
}

function Detail() {
  const { id } = useParams();
  const [servicio, setServicio] = useState(null);
  const [error, setError] = useState("");
  const [confirmingPause, setConfirmingPause] = useState(false);

  useEffect(() => { getServicio(id).then(setServicio).catch(() => setError("No encontramos este servicio.")); }, [id]);
  const cambiarEstado = async () => {
    if (servicio.activo) { setConfirmingPause(true); return; }
    try { setServicio(await estadoServicio(id, !servicio.activo)); } catch { setError("No pudimos actualizar el servicio."); }
  };

  if (error) return <AuraPage width="content"><AuraPanel><p className="text-destructive">{error}</p></AuraPanel></AuraPage>;
  if (!servicio) return <AuraPage width="content"><AuraPanel><p>Cargando servicio...</p></AuraPanel></AuraPage>;

  return (
    <AuraPage width="content">
      <div className="grid gap-5">
        <AuraHero
          eyebrow={servicio.activo ? "Servicio activo" : "Servicio pausado"}
          title={servicio.nombre}
          description="Consultá sus datos y ajustá la configuración cuando sea necesario."
          back={<Link className="aura-glass-link" to="/servicios">Volver a servicios</Link>}
          actions={<Link className="aura-button aura-button-secondary" to="editar">Editar</Link>}
        />

        <AuraPanel>
          <dl className="grid gap-4 sm:grid-cols-2">
            <AuraRecordCard className="p-4"><dt className="text-sm text-muted-foreground">Duración estimada</dt><dd className="mt-1 font-semibold">{servicio.duracion_legible}</dd></AuraRecordCard>
            <AuraRecordCard className="p-4"><dt className="text-sm text-muted-foreground">Precio</dt><dd className="mt-1 text-lg font-semibold">{money(servicio.precio)}</dd></AuraRecordCard>
          </dl>
          <div className="aura-inset mt-4">
            <h2 className="font-semibold">Descripción</h2>
            <p className="mt-2">{servicio.descripcion || "Sin descripción."}</p>
            <p className="mt-3 text-sm">Posición en la lista: {servicio.orden}</p>
          </div>
          <div className="aura-form-footer mt-5">
            <button className="aura-button aura-button-secondary" onClick={cambiarEstado}>{servicio.activo ? "Pausar" : "Reactivar"}</button>
          </div>
        </AuraPanel>
      </div>

      <ConfirmDialog open={confirmingPause} title="¿Pausar este servicio?" description="No podrá seleccionarse en nuevos turnos hasta que vuelva a activarse." confirmLabel="Pausar servicio" destructive onClose={() => setConfirmingPause(false)} onConfirm={async () => { setConfirmingPause(false); try { setServicio(await estadoServicio(id, false)); } catch { setError("No pudimos actualizar el servicio."); } }} />
    </AuraPage>
  );
}

export default function ServiciosPage() {
  return <Routes><Route index element={<List />} /><Route path="nuevo" element={<Form />} /><Route path=":id" element={<Detail />} /><Route path=":id/editar" element={<Form />} /></Routes>;
}

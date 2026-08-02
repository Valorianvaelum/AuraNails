import { useMemo, useRef, useState } from "react";

import FieldError from "./FieldError.jsx";
import FormActions from "./FormActions.jsx";
import { focusFirstError, normalizeApiError } from "../utils/apiErrors.js";
import { requiredText, validEmail, validPhone } from "../utils/validators.js";

const initialValues = {
  nombre: "",
  apellido: "",
  telefono: "",
  email: "",
  fecha_nacimiento: "",
  color_favorito: "",
  estilo_favorito: "",
  notas: "",
};

function firstError(errors, field) {
  const value = errors[field];
  return Array.isArray(value) ? value[0] : value;
}

function normalizeValues(values) {
  return {
    ...values,
    nombre: String(values.nombre ?? "").trim(),
    apellido: String(values.apellido ?? "").trim(),
    telefono: String(values.telefono ?? "").trim(),
    email: String(values.email ?? "").trim(),
    color_favorito: String(values.color_favorito ?? "").trim(),
    estilo_favorito: String(values.estilo_favorito ?? "").trim(),
    notas: String(values.notas ?? "").trim(),
    fecha_nacimiento: values.fecha_nacimiento || "",
  };
}

function validateField(name, value) {
  if (name === "nombre") return requiredText(value, "El nombre");
  if (name === "telefono") return validPhone(value);
  if (name === "email") return validEmail(value);
  return "";
}

function ClientaForm({ cancelTo, clienta, onSubmit, submitLabel }) {
  const baseline = useMemo(() => normalizeValues({ ...initialValues, ...clienta }), [clienta]);
  const [values, setValues] = useState({ ...initialValues, ...clienta });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const refs = { nombre: useRef(null), telefono: useRef(null), email: useRef(null) };
  const isDirty = JSON.stringify(normalizeValues(values)) !== JSON.stringify(baseline);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleBlur(event) {
    const { name, value } = event.target;
    const message = validateField(name, value);
    setFieldErrors((current) => ({ ...current, [name]: message || undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const errors = {
      nombre: validateField("nombre", values.nombre) || undefined,
      telefono: validateField("telefono", values.telefono) || undefined,
      email: validateField("email", values.email) || undefined,
    };
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      focusFirstError(refs, errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const normalized = normalizeValues(values);
      await onSubmit({ ...normalized, fecha_nacimiento: normalized.fecha_nacimiento || null });
    } catch (error) {
      const parsed = normalizeApiError(error, "No pudimos guardar a la clienta. Intentá nuevamente.");
      setFieldErrors(parsed.fields);
      setFormError(parsed.formError);
      focusFirstError(refs, parsed.fields);
    } finally {
      setIsSubmitting(false);
    }
  }

  const fields = [
    ["nombre", "Nombre", "text", true],
    ["apellido", "Apellido", "text", false],
    ["telefono", "Teléfono", "tel", false],
    ["email", "Email", "email", false],
    ["fecha_nacimiento", "Fecha de nacimiento", "date", false],
    ["color_favorito", "Color favorito", "text", false],
    ["estilo_favorito", "Estilo favorito", "text", false],
  ];

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map(([name, label, type, required]) => (
          <div key={name} className={name === "email" || name === "fecha_nacimiento" ? "sm:col-span-2" : ""}>
            <label className="mb-2 block text-sm font-medium text-foreground" htmlFor={name}>{label}{required ? " *" : ""}</label>
            <input
              className={firstError(fieldErrors, name) ? "field-invalid" : ""}
              aria-invalid={Boolean(firstError(fieldErrors, name))}
              aria-describedby={firstError(fieldErrors, name) ? `${name}-error` : undefined}
              id={name}
              name={name}
              type={type}
              value={values[name] || ""}
              onBlur={handleBlur}
              onChange={handleChange}
              disabled={isSubmitting}
              required={required}
              maxLength={name === "telefono" ? 30 : undefined}
              ref={refs[name]}
            />
            {name === "telefono" && <p className="mt-1 text-xs text-muted-foreground">Podés usar +, espacios, guiones y paréntesis. Debe contener entre 7 y 15 dígitos.</p>}
            <FieldError id={`${name}-error`} message={firstError(fieldErrors, name)} />
          </div>
        ))}
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="notas">Notas</label>
        <textarea id="notas" name="notas" value={values.notas || ""} onChange={handleChange} disabled={isSubmitting} />
        {firstError(fieldErrors, "notas") && <p className="mt-2 text-sm text-destructive">{firstError(fieldErrors, "notas")}</p>}
      </div>
      {formError && <p className="rounded-lg border border-destructive bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-destructive" role="alert">{formError}</p>}
      <FormActions cancelTo={cancelTo} isDirty={isDirty} isSubmitting={isSubmitting} submitLabel={submitLabel} />
    </form>
  );
}

export default ClientaForm;

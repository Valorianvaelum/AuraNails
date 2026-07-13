import { useRef, useState } from "react";
import FieldError from "./FieldError.jsx";
import { focusFirstError, normalizeApiError } from "../utils/apiErrors.js";

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

function validarTelefono(telefono) {
  const valor = telefono.trim();
  if (!valor) return "";
  if (!/^\+?[\d\s()-]+$/.test(valor)) {
    return "El teléfono solo puede contener números, espacios, guiones, paréntesis y un + inicial.";
  }
  const digitos = valor.replace(/\D/g, "").length;
  return digitos < 7 || digitos > 15 ? "El teléfono debe contener entre 7 y 15 dígitos." : "";
}

function validarEmail(email) {
  const valor = email.trim();
  return valor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor) ? "Ingresá un correo válido." : "";
}

function ClientaForm({ clienta, onSubmit, submitLabel }) {
  const [values, setValues] = useState({ ...initialValues, ...clienta });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const refs = { nombre: useRef(null), telefono: useRef(null), email: useRef(null) };

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setFieldErrors({});

    if (!values.nombre.trim()) {
      const errors = { nombre: "Ingresá el nombre de la clienta." }; setFieldErrors(errors); focusFirstError(refs, errors);
      return;
    }
    const errorTelefono = validarTelefono(values.telefono);
    const errorEmail = validarEmail(values.email);
    if (errorTelefono || errorEmail) {
      const errors = { telefono: errorTelefono || undefined, email: errorEmail || undefined }; setFieldErrors(errors); focusFirstError(refs, errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ ...values, telefono: values.telefono.trim(), email: values.email.trim(), fecha_nacimiento: values.fecha_nacimiento || null });
    } catch (error) {
      const parsed = normalizeApiError(error, "No pudimos guardar a la clienta. Intentá nuevamente."); setFieldErrors(parsed.fields); setFormError(parsed.formError); focusFirstError(refs, parsed.fields);
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
            <label className="mb-2 block text-sm font-medium text-[#3d2f32]" htmlFor={name}>
              {label}{required ? " *" : ""}
            </label>
            <input
              className={`w-full rounded-xl border border-[#dcbfc5] bg-white px-4 py-3 text-[#2f2528] outline-none transition focus:border-[#b76e79] focus:ring-4 focus:ring-[#f4dce0] ${firstError(fieldErrors, name) ? "field-invalid" : ""}`}
              aria-invalid={Boolean(firstError(fieldErrors, name))}
              aria-describedby={firstError(fieldErrors, name) ? `${name}-error` : undefined}
              id={name}
              name={name}
              type={type}
              value={values[name] || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              required={required}
              maxLength={name === "telefono" ? 30 : undefined}
              ref={refs[name]}
            />
            {name === "telefono" && <p className="mt-1 text-xs text-[#6f5b60]">Podés usar +, espacios, guiones y paréntesis. Debe contener entre 7 y 15 dígitos.</p>}
            <FieldError id={`${name}-error`} message={firstError(fieldErrors, name)} />
          </div>
        ))}
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[#3d2f32]" htmlFor="notas">Notas</label>
        <textarea
          className="min-h-32 w-full rounded-xl border border-[#dcbfc5] bg-white px-4 py-3 text-[#2f2528] outline-none transition focus:border-[#b76e79] focus:ring-4 focus:ring-[#f4dce0]"
          id="notas"
          name="notas"
          value={values.notas || ""}
          onChange={handleChange}
          disabled={isSubmitting}
        />
        {firstError(fieldErrors, "notas") && <p className="mt-2 text-sm text-[#8b3f4c]">{firstError(fieldErrors, "notas")}</p>}
      </div>
      {formError && <p className="rounded-xl bg-[#fff0f1] px-4 py-3 text-sm text-[#8b3f4c]" role="alert">{formError}</p>}
      <button
        className="rounded-xl bg-[#b76e79] px-5 py-3 font-semibold text-white transition hover:bg-[#9e5e68] focus:outline-none focus:ring-4 focus:ring-[#e8c8ce] disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}

export default ClientaForm;

export function requiredText(value, label) {
  return String(value ?? "").trim() ? "" : `${label} es obligatorio.`;
}

export function validEmail(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? "" : "Ingresá un correo válido.";
}

export function validPhone(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  if (!/^\+?[\d\s()-]+$/.test(normalized)) {
    return "El teléfono solo puede contener números, espacios, guiones, paréntesis y un + inicial.";
  }
  const digits = normalized.replace(/\D/g, "").length;
  return digits >= 7 && digits <= 15 ? "" : "El teléfono debe contener entre 7 y 15 dígitos.";
}

export function validNumber(value, { label = "El valor", min = null, max = null, allowZero = true } = {}) {
  if (value === "" || value === null || value === undefined) return `${label} es obligatorio.`;
  const number = Number(value);
  if (!Number.isFinite(number)) return `${label} debe ser un número válido.`;
  if (!allowZero && number === 0) return `${label} debe ser mayor que cero.`;
  if (min !== null && number < min) return `${label} no puede ser menor que ${min}.`;
  if (max !== null && number > max) return `${label} no puede ser mayor que ${max}.`;
  return "";
}

export function firstValidationError(errors) {
  return Object.values(errors).find(Boolean) || "";
}

export function firstMessage(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return "";
}

export function normalizeApiError(error, fallback = "No pudimos completar la acción. Intentá nuevamente.") {
  if (!error?.response) return { formError: "No pudimos comunicarnos con el servidor. Intentá nuevamente.", fields: {} };
  const data = error.response.data;
  if (!data || typeof data !== "object") return { formError: fallback, fields: {} };
  const fields = {};
  for (const [key, value] of Object.entries(data)) {
    const message = firstMessage(value);
    if (message && !["detail", "non_field_errors"].includes(key)) fields[key] = message;
  }
  return { formError: firstMessage(data.detail) || firstMessage(data.non_field_errors) || (Object.keys(fields).length ? "Revisá los campos marcados." : fallback), fields };
}

export function focusFirstError(refs, fields) {
  const name = Object.keys(fields || {}).find((key) => fields[key]);
  if (name) window.setTimeout(() => refs?.[name]?.current?.focus?.(), 0);
}

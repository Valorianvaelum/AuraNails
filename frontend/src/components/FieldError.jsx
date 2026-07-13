export default function FieldError({ id, message }) {
  return message ? <p className="field-error" id={id} role="alert">{message}</p> : null;
}

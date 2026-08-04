import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { requestPasswordReset } from "../api/passwordReset.js";


function PasswordResetRequestPage() {
  const emailRef = useRef(null);
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setFieldError("");
    setRequestError("");

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setFieldError("Ingresá tu correo electrónico.");
      emailRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await requestPasswordReset(normalizedEmail);
      setSuccessMessage(data.detail);
    } catch (error) {
      setRequestError(
        error.response
          ? "No pudimos procesar la solicitud. Revisá el correo e intentá nuevamente."
          : "No pudimos conectar con AuraNails. Intentá nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="aura-login-page">
      <section className="aura-login-stage" aria-labelledby="password-reset-title">
        <div className="aura-login-card aura-glass">
          <div className="aura-login-brand" aria-label="AuraNails, gestión del estudio">
            <span className="aura-login-brand-mark" aria-hidden="true">
              <img className="aura-login-brand-logo" src="/logo-favicon.png" alt="" width="512" height="512" decoding="async" />
            </span>
            <span>
              <span className="aura-login-brand-title">AuraNails</span>
              <span className="aura-login-brand-subtitle">Gestión del estudio</span>
            </span>
          </div>

          <div className="aura-login-copy">
            <p className="aura-eyebrow">Recuperar acceso</p>
            <h1 id="password-reset-title" className="aura-login-title">Restablecé tu contraseña</h1>
            <p className="aura-login-description">
              Ingresá el correo de tu cuenta y te enviaremos un enlace de recuperación.
            </p>
          </div>

          {successMessage ? (
            <div className="aura-auth-status" role="status">
              <h2>Revisá tu correo</h2>
              <p>{successMessage}</p>
              <p className="aura-auth-note">El mensaje puede tardar unos minutos. Revisá también correo no deseado.</p>
              <Link className="aura-button aura-button-primary aura-auth-button-link" to="/login">
                Volver al ingreso
              </Link>
            </div>
          ) : (
            <form className="aura-login-form" onSubmit={handleSubmit} noValidate>
              <div className="aura-login-field">
                <label htmlFor="reset-email">Correo electrónico</label>
                <input
                  aria-describedby={fieldError ? "reset-email-error" : undefined}
                  aria-invalid={Boolean(fieldError)}
                  autoComplete="email"
                  className={`aura-login-control ${fieldError ? "field-invalid" : ""}`}
                  disabled={isSubmitting}
                  id="reset-email"
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (fieldError) setFieldError("");
                    if (requestError) setRequestError("");
                  }}
                />
                {fieldError && <p className="field-error" id="reset-email-error">{fieldError}</p>}
              </div>

              {requestError && <p className="aura-login-error" role="alert">{requestError}</p>}

              <button
                aria-busy={isSubmitting || undefined}
                className="aura-button aura-button-primary aura-login-submit"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Enviando…" : "Enviar enlace"}
              </button>

              <div className="aura-auth-secondary-action">
                <Link className="aura-auth-link" to="/login">Volver al ingreso</Link>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

export default PasswordResetRequestPage;

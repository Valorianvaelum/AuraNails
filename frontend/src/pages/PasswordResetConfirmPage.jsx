import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { confirmPasswordReset } from "../api/passwordReset.js";


function firstMessage(value) {
  if (Array.isArray(value)) return value[0] || "";
  return typeof value === "string" ? value : "";
}


function PasswordResetConfirmPage() {
  const [searchParams] = useSearchParams();
  const passwordRef = useRef(null);
  const uid = searchParams.get("uid") || "";
  const token = searchParams.get("token") || "";
  const hasCredentials = useMemo(() => Boolean(uid && token), [token, uid]);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (hasCredentials) passwordRef.current?.focus();
  }, [hasCredentials]);

  async function handleSubmit(event) {
    event.preventDefault();
    setFieldErrors({});
    setRequestError("");

    const errors = {
      ...(password ? {} : { newPassword: "Ingresá una nueva contraseña." }),
      ...(confirmation ? {} : { confirmation: "Repetí la nueva contraseña." }),
      ...(password && confirmation && password !== confirmation
        ? { confirmation: "Las contraseñas no coinciden." }
        : {}),
    };

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await confirmPasswordReset({
        uid,
        token,
        newPassword: password,
        newPasswordConfirm: confirmation,
      });
      setPassword("");
      setConfirmation("");
      setSuccessMessage(data.detail);
    } catch (error) {
      const responseData = error.response?.data || {};
      const passwordError = firstMessage(responseData.new_password);
      const confirmationError = firstMessage(responseData.new_password_confirm);
      const tokenError = firstMessage(responseData.token);

      setFieldErrors({
        ...(passwordError ? { newPassword: passwordError } : {}),
        ...(confirmationError ? { confirmation: confirmationError } : {}),
      });
      setRequestError(
        tokenError ||
          (error.response
            ? "No pudimos actualizar la contraseña. Revisá los datos e intentá nuevamente."
            : "No pudimos conectar con AuraNails. Intentá nuevamente."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="aura-login-page">
      <section className="aura-login-stage" aria-labelledby="password-confirm-title">
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
            <p className="aura-eyebrow">Nueva contraseña</p>
            <h1 id="password-confirm-title" className="aura-login-title">Elegí una contraseña segura</h1>
            <p className="aura-login-description">
              Usá una clave difícil de adivinar y distinta de las que utilizás en otros servicios.
            </p>
          </div>

          {!hasCredentials ? (
            <div className="aura-auth-status aura-auth-status-error" role="alert">
              <h2>El enlace no es válido</h2>
              <p>Faltan los datos necesarios para restablecer la contraseña.</p>
              <Link className="aura-button aura-button-primary aura-auth-button-link" to="/recuperar-contrasena">
                Solicitar otro enlace
              </Link>
            </div>
          ) : successMessage ? (
            <div className="aura-auth-status" role="status">
              <h2>Contraseña actualizada</h2>
              <p>{successMessage}</p>
              <Link className="aura-button aura-button-primary aura-auth-button-link" to="/login">
                Iniciar sesión
              </Link>
            </div>
          ) : (
            <form className="aura-login-form" onSubmit={handleSubmit} noValidate>
              <div className="aura-login-field">
                <label htmlFor="new-password">Nueva contraseña</label>
                <div className={`aura-login-password ${fieldErrors.newPassword ? "field-invalid" : ""}`}>
                  <input
                    aria-describedby={fieldErrors.newPassword ? "new-password-error" : "password-help"}
                    aria-invalid={Boolean(fieldErrors.newPassword)}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    id="new-password"
                    ref={passwordRef}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (fieldErrors.newPassword) setFieldErrors((current) => ({ ...current, newPassword: undefined }));
                      if (requestError) setRequestError("");
                    }}
                  />
                  <button
                    aria-label={showPassword ? "Ocultar contraseñas" : "Mostrar contraseñas"}
                    disabled={isSubmitting}
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                {fieldErrors.newPassword && <p className="field-error" id="new-password-error">{fieldErrors.newPassword}</p>}
                <p className="aura-login-hint" id="password-help">Mínimo 8 caracteres. Evitá claves comunes o completamente numéricas.</p>
              </div>

              <div className="aura-login-field">
                <label htmlFor="new-password-confirm">Repetir contraseña</label>
                <input
                  aria-describedby={fieldErrors.confirmation ? "new-password-confirm-error" : undefined}
                  aria-invalid={Boolean(fieldErrors.confirmation)}
                  autoComplete="new-password"
                  className={`aura-login-control ${fieldErrors.confirmation ? "field-invalid" : ""}`}
                  disabled={isSubmitting}
                  id="new-password-confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirmation}
                  onChange={(event) => {
                    setConfirmation(event.target.value);
                    if (fieldErrors.confirmation) setFieldErrors((current) => ({ ...current, confirmation: undefined }));
                    if (requestError) setRequestError("");
                  }}
                />
                {fieldErrors.confirmation && <p className="field-error" id="new-password-confirm-error">{fieldErrors.confirmation}</p>}
              </div>

              {requestError && <p className="aura-login-error" role="alert">{requestError}</p>}

              <button
                aria-busy={isSubmitting || undefined}
                className="aura-button aura-button-primary aura-login-submit"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Actualizando…" : "Guardar nueva contraseña"}
              </button>

              <div className="aura-auth-secondary-action">
                <Link className="aura-auth-link" to="/recuperar-contrasena">Solicitar otro enlace</Link>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

export default PasswordResetConfirmPage;

import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext.jsx";
import AuraLoadingScreen from "../components/AuraLoadingScreen.jsx";

function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setPassword("");
    setError("");
    emailRef.current?.focus();
  }, []);

  if (isLoading) return <AuraLoadingScreen label="Comprobando tu sesión..." />;
  if (isAuthenticated) return <Navigate to="/inicio" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    const errors = {
      ...(email.trim() ? {} : { email: "Ingresá tu correo electrónico." }),
      ...(password ? {} : { password: "Ingresá tu contraseña." }),
    };

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      window.setTimeout(() => (errors.email ? emailRef : passwordRef).current?.focus(), 0);
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      setPassword("");
      const destination = location.state?.from?.pathname || "/inicio";
      navigate(destination, { replace: true });
    } catch (requestError) {
      setPassword("");
      setError(
        requestError.response
          ? "No pudimos iniciar sesión con esos datos. Revisalos e intentá nuevamente."
          : "No pudimos conectar con AuraNails. Intentá nuevamente.",
      );
      window.setTimeout(() => passwordRef.current?.focus(), 0);
    } finally {
      setIsSubmitting(false);
    }
  }

  const invalid = Boolean(error);

  return (
    <main className="aura-login-page">
      <section className="aura-login-stage" aria-labelledby="login-title">
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
            <p className="aura-eyebrow">Acceso al estudio</p>
            <h1 id="login-title" className="aura-login-title">Qué lindo verte de nuevo</h1>
            <p className="aura-login-description">Ingresá para volver a organizar tus turnos, clientas y cobros.</p>
          </div>

          <form className="aura-login-form" onSubmit={handleSubmit} noValidate>
            <div className="aura-login-field">
              <label htmlFor="email">Correo electrónico</label>
              <input
                aria-describedby={fieldErrors.email ? "email-error" : invalid ? "login-error" : undefined}
                aria-invalid={Boolean(fieldErrors.email) || invalid}
                autoComplete="username"
                className={`aura-login-control ${fieldErrors.email ? "field-invalid" : ""}`}
                disabled={isSubmitting}
                id="email"
                ref={emailRef}
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (fieldErrors.email) setFieldErrors((current) => ({ ...current, email: undefined }));
                  if (error) setError("");
                }}
              />
              {fieldErrors.email && <p className="field-error" id="email-error">{fieldErrors.email}</p>}
            </div>

            <div className="aura-login-field">
              <label htmlFor="password">Contraseña</label>
              <div className={`aura-login-password ${fieldErrors.password ? "field-invalid" : ""}`}>
                <input
                  aria-describedby={fieldErrors.password ? "password-error" : capsLock ? "caps-lock" : invalid ? "login-error" : undefined}
                  aria-invalid={Boolean(fieldErrors.password) || invalid}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  id="password"
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: undefined }));
                    if (error) setError("");
                  }}
                  onKeyDown={(event) => setCapsLock(event.getModifierState("CapsLock"))}
                  onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))}
                />
                <button
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  disabled={isSubmitting}
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              {fieldErrors.password && <p className="field-error" id="password-error">{fieldErrors.password}</p>}
              {capsLock && <p className="aura-login-hint" id="caps-lock">Bloq Mayús está activado.</p>}
            </div>

            {error && <p className="aura-login-error" id="login-error" role="alert">{error}</p>}

            <button aria-busy={isSubmitting || undefined} className="aura-button aura-button-primary aura-login-submit" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Ingresando…" : "Ingresar"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;

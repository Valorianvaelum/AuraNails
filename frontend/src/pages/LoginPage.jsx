import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext.jsx";

function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef(null); const passwordRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setPassword(""); setError(""); emailRef.current?.focus(); }, []);
  if (isLoading) return <main className="min-h-screen bg-[#fff4f7]" aria-label="Cargando sesión" />;
  if (isAuthenticated) return <Navigate to="/inicio" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError(""); setFieldErrors({});
    const errors = { ...(email.trim() ? {} : { email: "Ingresá tu correo electrónico." }), ...(password ? {} : { password: "Ingresá tu contraseña." }) };
    if (Object.keys(errors).length) { setFieldErrors(errors); window.setTimeout(() => (errors.email ? emailRef : passwordRef).current?.focus(), 0); return; }
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      setPassword("");
      navigate("/inicio", { replace: true });
    } catch (requestError) {
      setPassword("");
      setError(requestError.response ? "No pudimos iniciar sesión con esos datos. Revisalos e intentá nuevamente." : "No pudimos conectar con AuraNails. Intentá nuevamente.");
    } finally { setIsSubmitting(false); }
  }

  const invalid = Boolean(error);
  return <main className="min-h-screen bg-[#fff4f7] px-5 py-10 text-[#3d2f32] sm:px-8"><section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center"><div className="w-full rounded-3xl border border-[#efdadd] bg-white p-7 shadow-sm sm:p-9"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b76e79]">AuraNails</p><h1 className="mt-3 text-3xl font-semibold text-[#2f2528]">Qué lindo verte de nuevo</h1><p className="mt-3 leading-6 text-[#6f5b60]">Ingresá para volver a tu espacio.</p><form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate><div><label className="mb-2 block text-sm font-medium" htmlFor="email">Correo electrónico</label><input aria-describedby={fieldErrors.email ? "email-error" : invalid ? "login-error" : undefined} aria-invalid={Boolean(fieldErrors.email) || invalid} autoComplete="username" className={`w-full rounded-xl border border-[#dcbfc5] bg-white px-4 py-3 text-[#2f2528] outline-none transition focus:border-[#b76e79] focus:ring-4 focus:ring-[#f4dce0] ${fieldErrors.email ? "field-invalid" : ""}`} disabled={isSubmitting} id="email" ref={emailRef} type="email" value={email} onChange={(event) => setEmail(event.target.value)} />{fieldErrors.email && <p className="field-error" id="email-error">{fieldErrors.email}</p>}</div><div><label className="mb-2 block text-sm font-medium" htmlFor="password">Contraseña</label><div className={`flex rounded-xl border border-[#dcbfc5] bg-white focus-within:border-[#b76e79] focus-within:ring-4 focus-within:ring-[#f4dce0] ${fieldErrors.password ? "field-invalid" : ""}`}><input aria-describedby={fieldErrors.password ? "password-error" : capsLock ? "caps-lock" : invalid ? "login-error" : undefined} aria-invalid={Boolean(fieldErrors.password) || invalid} autoComplete="current-password" className="min-w-0 flex-1 rounded-l-xl bg-transparent px-4 py-3 text-[#2f2528] outline-none" disabled={isSubmitting} id="password" ref={passwordRef} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => setCapsLock(event.getModifierState("CapsLock"))} onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))} /><button aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="rounded-r-xl px-4 text-sm font-semibold text-[#765367]" disabled={isSubmitting} type="button" onClick={() => setShowPassword((current) => !current)}>{showPassword ? "Ocultar" : "Mostrar"}</button></div>{fieldErrors.password && <p className="field-error" id="password-error">{fieldErrors.password}</p>}{capsLock && <p className="mt-2 text-sm text-[#765367]" id="caps-lock">Bloq Mayús está activado.</p>}</div>{error && <p className="rounded-xl bg-[#fff0f1] px-4 py-3 text-sm text-[#8b3f4c]" id="login-error" role="alert">{error}</p>}<button className="w-full rounded-xl bg-[#b76e79] px-5 py-3 font-semibold text-white transition hover:bg-[#9e5e68] focus:outline-none focus:ring-4 focus:ring-[#e8c8ce] disabled:cursor-not-allowed disabled:opacity-70" disabled={isSubmitting} type="submit">{isSubmitting ? "Ingresando…" : "Ingresar"}</button></form></div></section></main>;
}

export default LoginPage;

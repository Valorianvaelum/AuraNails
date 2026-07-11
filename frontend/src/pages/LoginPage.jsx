import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext.jsx";

function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return <main className="min-h-screen bg-[#fff8f7]" aria-label="Cargando sesión" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/inicio" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Completá tu correo y contraseña.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate("/inicio", { replace: true });
    } catch (requestError) {
      setError(
        requestError.response
          ? "Revisá tu correo y contraseña."
          : "No pudimos conectar con AuraNails. Intentá nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fff8f7] px-5 py-10 text-[#3d2f32] sm:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div className="w-full rounded-3xl border border-[#efdadd] bg-white p-7 shadow-sm sm:p-9">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b76e79]">AuraNails</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#2f2528]">Qué lindo verte de nuevo</h1>
          <p className="mt-3 leading-6 text-[#6f5b60]">Ingresá para volver a tu espacio.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="email">Correo electrónico</label>
              <input
                className="w-full rounded-xl border border-[#dcbfc5] bg-white px-4 py-3 text-[#2f2528] outline-none transition focus:border-[#b76e79] focus:ring-4 focus:ring-[#f4dce0]"
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="password">Contraseña</label>
              <input
                className="w-full rounded-xl border border-[#dcbfc5] bg-white px-4 py-3 text-[#2f2528] outline-none transition focus:border-[#b76e79] focus:ring-4 focus:ring-[#f4dce0]"
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            {error && (
              <p className="rounded-xl bg-[#fff0f1] px-4 py-3 text-sm text-[#8b3f4c]" role="alert">
                {error}
              </p>
            )}
            <button
              className="w-full rounded-xl bg-[#b76e79] px-5 py-3 font-semibold text-white transition hover:bg-[#9e5e68] focus:outline-none focus:ring-4 focus:ring-[#e8c8ce] disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;

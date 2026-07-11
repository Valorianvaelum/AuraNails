import { useAuth } from "../auth/AuthContext.jsx";

function InicioPage() {
  const { logout, user } = useAuth();
  const nombre = user?.nombre || "bienvenida";

  return (
    <main className="min-h-screen bg-[#fff8f7] px-5 py-10 text-[#3d2f32] sm:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl items-center">
        <div className="w-full rounded-3xl border border-[#efdadd] bg-white p-8 shadow-sm sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b76e79]">AuraNails</p>
          <h1 className="mt-4 text-4xl font-semibold text-[#2f2528]">Hola, {nombre}</h1>
          <p className="mt-4 max-w-lg text-lg leading-8 text-[#6f5b60]">
            Ingresaste correctamente a tu espacio de AuraNails.
          </p>
          <button
            className="mt-8 rounded-xl border border-[#dcbfc5] px-5 py-3 font-semibold text-[#7d4e57] transition hover:bg-[#fff0f1] focus:outline-none focus:ring-4 focus:ring-[#f4dce0]"
            type="button"
            onClick={logout}
          >
            Cerrar sesión
          </button>
        </div>
      </section>
    </main>
  );
}

export default InicioPage;

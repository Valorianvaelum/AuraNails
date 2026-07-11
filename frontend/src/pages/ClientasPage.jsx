import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listClientas } from "../api/clientas.js";
import AppHeader from "../components/AppHeader.jsx";

function ClientasPage() {
  const [clientas, setClientas] = useState([]);
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("activas");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadClientas() {
      setIsLoading(true);
      setError("");
      setClientas([]);

      try {
        const data = await listClientas({ search, estado });
        if (isMounted) setClientas(data);
      } catch {
        if (isMounted) setError("No pudimos cargar tus clientas. Intentá nuevamente.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadClientas();
    return () => {
      isMounted = false;
    };
  }, [estado, search]);

  const isSearching = Boolean(search.trim());

  return (
    <main className="min-h-screen bg-[#fff8f7] text-[#3d2f32]">
      <AppHeader />
      <section className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b76e79]">AuraNails</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#2f2528]">Mis clientas</h1>
          </div>
          <Link
            className="rounded-xl bg-[#b76e79] px-5 py-3 text-center font-semibold text-white transition hover:bg-[#9e5e68] focus:outline-none focus:ring-4 focus:ring-[#e8c8ce]"
            to="/clientas/nueva"
          >
            Nueva clienta
          </Link>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_11rem]">
          <label className="sr-only" htmlFor="buscar-clientas">Buscar clientas</label>
          <input
            className="w-full rounded-xl border border-[#dcbfc5] bg-white px-4 py-3 outline-none transition focus:border-[#b76e79] focus:ring-4 focus:ring-[#f4dce0]"
            id="buscar-clientas"
            placeholder="Buscar por nombre, teléfono o email"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <label className="sr-only" htmlFor="estado-clientas">Mostrar</label>
          <select
            className="rounded-xl border border-[#dcbfc5] bg-white px-4 py-3 outline-none transition focus:border-[#b76e79] focus:ring-4 focus:ring-[#f4dce0]"
            id="estado-clientas"
            value={estado}
            onChange={(event) => setEstado(event.target.value)}
          >
            <option value="activas">Activas</option>
            <option value="inactivas">Inactivas</option>
            <option value="todas">Todas</option>
          </select>
        </div>

        <div className="mt-7">
          {isLoading && <p className="text-[#6f5b60]">Cargando clientas...</p>}
          {error && <p className="rounded-xl bg-[#fff0f1] px-4 py-3 text-[#8b3f4c]" role="alert">{error}</p>}
          {!isLoading && !error && clientas.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#dcbfc5] bg-white px-6 py-10 text-center">
              <p className="text-lg text-[#6f5b60]">
                {isSearching ? "No encontramos clientas con esa búsqueda." : "Todavía no agregaste ninguna clienta."}
              </p>
              {!isSearching && estado === "activas" && (
                <Link className="mt-5 inline-block font-semibold text-[#a85f6c] underline underline-offset-4" to="/clientas/nueva">
                  Agregar mi primera clienta
                </Link>
              )}
            </div>
          )}
          {!isLoading && !error && clientas.length > 0 && (
            <ul className="grid gap-3" aria-label="Listado de clientas">
              {clientas.map((clienta) => (
                <li key={clienta.id}>
                  <Link
                    className="block rounded-2xl border border-[#efdadd] bg-white p-5 transition hover:border-[#dcbfc5] focus:outline-none focus:ring-4 focus:ring-[#f4dce0]"
                    to={`/clientas/${clienta.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-semibold text-[#2f2528]">{clienta.nombre_completo}</h2>
                        <p className="mt-1 text-sm text-[#6f5b60]">{clienta.telefono || clienta.email || "Sin datos de contacto"}</p>
                      </div>
                      {!clienta.activa && <span className="rounded-full bg-[#fff0f1] px-3 py-1 text-xs font-semibold text-[#8b3f4c]">Inactiva</span>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

export default ClientasPage;

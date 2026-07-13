import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { changeClientaStatus, getClienta } from "../api/clientas.js";
import AppHeader from "../components/AppHeader.jsx";

function formatDate(value) {
  if (!value) return "Sin datos";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(new Date(`${value}T12:00:00`));
}

function ClientaDetailPage() {
  const { id } = useParams();
  const [clienta, setClienta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadClienta() {
      setIsLoading(true);
      setError("");
      setClienta(null);

      try {
        const data = await getClienta(id);
        if (isMounted) setClienta(data);
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.status === 404 ? "No encontramos esta clienta." : "No pudimos cargar los datos de la clienta.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadClienta();
    return () => {
      isMounted = false;
    };
  }, [id]);

  async function handleStatusChange() {
    if (!clienta.activa) {
      await updateStatus(true);
      return;
    }

    const confirmed = window.confirm(
      "La clienta dejará de aparecer entre las activas, pero conservarás toda su información.",
    );
    if (confirmed) await updateStatus(false);
  }

  async function updateStatus(activa) {
    setActionError("");
    setIsChangingStatus(true);
    try {
      const updatedClienta = await changeClientaStatus(id, activa);
      setClienta(updatedClienta);
    } catch {
      setActionError("No pudimos actualizar el estado de la clienta. Intentá nuevamente.");
    } finally {
      setIsChangingStatus(false);
    }
  }

  const details = clienta && [
    ["Teléfono", clienta.telefono || "Sin datos"],
    ["Email", clienta.email || "Sin datos"],
    ["Fecha de nacimiento", formatDate(clienta.fecha_nacimiento)],
    ["Color favorito", clienta.color_favorito || "Sin datos"],
    ["Estilo favorito", clienta.estilo_favorito || "Sin datos"],
    ["Notas", clienta.notas || "Sin notas todavía"],
    ["Agregada el", formatDate(clienta.creada_en?.slice(0, 10))],
  ];

  return (
    <main className="min-h-screen bg-[#fff4f7] text-[#3d2f32]">
      <AppHeader />
      <section className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
        <Link className="text-sm font-semibold text-[#a85f6c] underline underline-offset-4" to="/clientas">← Volver a mis clientas</Link>
        {isLoading && <p className="mt-7 text-[#6f5b60]">Cargando datos...</p>}
        {error && <p className="mt-7 rounded-xl bg-[#fff0f1] px-4 py-3 text-[#8b3f4c]" role="alert">{error}</p>}
        {clienta && (
          <div className="mt-5 rounded-2xl border border-[#efdadd] bg-white p-5 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-semibold text-[#2f2528]">{clienta.nombre_completo}</h1>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${clienta.activa ? "bg-[#f3e8e9] text-[#7d4e57]" : "bg-[#fff0f1] text-[#8b3f4c]"}`}>
                    {clienta.activa ? "Activa" : "Inactiva"}
                  </span>
                </div>
                <p className="mt-2 text-[#6f5b60]">Información y preferencias para sus próximas visitas.</p>
              </div>
              <Link className="rounded-xl border border-[#dcbfc5] px-4 py-2 text-center font-semibold text-[#7d4e57] transition hover:bg-[#fff0f1] focus:outline-none focus:ring-4 focus:ring-[#f4dce0]" to={`/clientas/${clienta.id}/editar`}>
                Editar
              </Link>
            </div>
            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label} className={`rounded-xl bg-[#faf6f8] p-4 ${label === "Notas" ? "sm:col-span-2" : ""}`}>
                  <dt className="text-sm font-medium text-[#7d4e57]">{label}</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-[#3d2f32]">{value}</dd>
                </div>
              ))}
            </dl>
            {actionError && <p className="mt-6 rounded-xl bg-[#fff0f1] px-4 py-3 text-sm text-[#8b3f4c]" role="alert">{actionError}</p>}
            <section className="mt-8 border-t border-[#e5dce2] pt-5"><h2 className="text-sm font-semibold text-[#765367]">Acciones</h2><button
              className="mt-3 rounded-xl border border-[#dcbfc5] px-5 py-3 font-semibold text-[#7d4e57] transition hover:bg-[#fff0f1] focus:outline-none focus:ring-4 focus:ring-[#f4dce0] disabled:cursor-not-allowed disabled:opacity-70"
              type="button"
              disabled={isChangingStatus}
              onClick={handleStatusChange}
            >
              {isChangingStatus ? "Guardando..." : clienta.activa ? "Desactivar" : "Reactivar"}
            </button></section>
          </div>
        )}
      </section>
    </main>
  );
}

export default ClientaDetailPage;

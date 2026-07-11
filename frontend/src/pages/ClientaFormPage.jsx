import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { createClienta, getClienta, updateClienta } from "../api/clientas.js";
import AppHeader from "../components/AppHeader.jsx";
import ClientaForm from "../components/ClientaForm.jsx";

function ClientaFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [clienta, setClienta] = useState(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEditing) return undefined;
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
  }, [id, isEditing]);

  async function saveClienta(payload) {
    const savedClienta = isEditing ? await updateClienta(id, payload) : await createClienta(payload);
    navigate(`/clientas/${savedClienta.id}`, { replace: true });
  }

  return (
    <main className="min-h-screen bg-[#fff8f7] text-[#3d2f32]">
      <AppHeader />
      <section className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
        <Link className="text-sm font-semibold text-[#a85f6c] underline underline-offset-4" to={isEditing ? `/clientas/${id}` : "/clientas"}>
          Volver
        </Link>
        <h1 className="mt-4 text-3xl font-semibold text-[#2f2528]">{isEditing ? "Editar clienta" : "Nueva clienta"}</h1>
        <p className="mt-2 text-[#6f5b60]">Guardá los datos que te resulten útiles para atenderla mejor.</p>
        <div className="mt-7 rounded-2xl border border-[#efdadd] bg-white p-5 sm:p-7">
          {isLoading && <p className="text-[#6f5b60]">Cargando datos...</p>}
          {error && <p className="rounded-xl bg-[#fff0f1] px-4 py-3 text-[#8b3f4c]" role="alert">{error}</p>}
          {!isLoading && !error && (
            <ClientaForm clienta={clienta || undefined} onSubmit={saveClienta} submitLabel={isEditing ? "Guardar cambios" : "Guardar clienta"} />
          )}
        </div>
      </section>
    </main>
  );
}

export default ClientaFormPage;

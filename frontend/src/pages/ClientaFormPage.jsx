import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { createClienta, getClienta, updateClienta } from "../api/clientas.js";
import ClientaForm from "../components/ClientaForm.jsx";
import { AuraHero, AuraPage, AuraPanel } from "../components/visual";

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
      setIsLoading(true); setError(""); setClienta(null);
      try { const data = await getClienta(id); if (isMounted) setClienta(data); }
      catch (requestError) { if (isMounted) setError(requestError.response?.status === 404 ? "No encontramos esta clienta." : "No pudimos cargar los datos de la clienta."); }
      finally { if (isMounted) setIsLoading(false); }
    }
    loadClienta();
    return () => { isMounted = false; };
  }, [id, isEditing]);

  async function saveClienta(payload) {
    const savedClienta = isEditing ? await updateClienta(id, payload) : await createClienta(payload);
    navigate(`/clientas/${savedClienta.id}`, { replace: true });
  }

  const cancelTo = isEditing ? `/clientas/${id}` : "/clientas";

  return (
    <AuraPage width="form">
      <div className="grid gap-5">
        <AuraHero
          eyebrow="Clientas"
          title={isEditing ? "Editar clienta" : "Nueva clienta"}
          description="Guardá los datos que te resulten útiles para atenderla mejor y personalizar sus próximas visitas."
          back={<Link className="aura-glass-link" to={cancelTo}>Volver a clientas</Link>}
        />

        <AuraPanel className="aura-form-shell">
          {isLoading && <p className="aura-form-status">Cargando datos...</p>}
          {error && <p className="rounded-lg border border-destructive bg-[var(--color-danger-soft)] px-4 py-3 text-destructive" role="alert">{error}</p>}
          {!isLoading && !error && (
            <ClientaForm
              cancelTo={cancelTo}
              clienta={clienta || undefined}
              onSubmit={saveClienta}
              submitLabel={isEditing ? "Guardar cambios" : "Guardar clienta"}
            />
          )}
        </AuraPanel>
      </div>
    </AuraPage>
  );
}

export default ClientaFormPage;

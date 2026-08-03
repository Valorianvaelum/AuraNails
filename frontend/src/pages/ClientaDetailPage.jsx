import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { changeClientaStatus, getClienta } from "../api/clientas.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { AuraHero, AuraPage, AuraPanel, AuraRecordCard } from "../components/visual";

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
  const [confirmingStatus, setConfirmingStatus] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadClienta() {
      setIsLoading(true); setError(""); setClienta(null);
      try { const data = await getClienta(id); if (isMounted) setClienta(data); }
      catch (requestError) { if (isMounted) setError(requestError.response?.status === 404 ? "No encontramos esta clienta." : "No pudimos cargar los datos de la clienta."); }
      finally { if (isMounted) setIsLoading(false); }
    }
    loadClienta();
    return () => { isMounted = false; };
  }, [id]);

  async function handleStatusChange() { if (!clienta.activa) await updateStatus(true); else setConfirmingStatus(true); }

  async function updateStatus(activa) {
    setActionError(""); setIsChangingStatus(true);
    try { setClienta(await changeClientaStatus(id, activa)); }
    catch { setActionError("No pudimos actualizar el estado de la clienta. Intentá nuevamente."); }
    finally { setIsChangingStatus(false); }
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
    <AuraPage width="form">
      <div className="grid gap-5">
        {isLoading && <AuraPanel><p className="aura-form-status">Cargando datos...</p></AuraPanel>}
        {error && <AuraPanel><p className="text-destructive" role="alert">{error}</p></AuraPanel>}
        {clienta && (
          <>
            <AuraHero
              eyebrow={clienta.activa ? "Clienta activa" : "Clienta inactiva"}
              title={clienta.nombre_completo}
              description="Información y preferencias para sus próximas visitas."
              back={<Link className="aura-glass-link" to="/clientas">Volver a mis clientas</Link>}
              actions={<Link className="aura-button aura-button-secondary" to={`/clientas/${clienta.id}/editar`}>Editar</Link>}
            />
            <AuraPanel>
              <dl className="grid gap-4 sm:grid-cols-2">
                {details.map(([label, value]) => (
                  <AuraRecordCard key={label} className={`p-4 ${label === "Notas" ? "sm:col-span-2" : ""}`}>
                    <dt className="text-sm font-medium text-primary">{label}</dt>
                    <dd className="mt-1 whitespace-pre-wrap">{value}</dd>
                  </AuraRecordCard>
                ))}
              </dl>
              {actionError && <p className="mt-5 rounded-xl bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-destructive" role="alert">{actionError}</p>}
              <div className="aura-form-footer mt-5">
                <button className="aura-button aura-button-secondary" type="button" disabled={isChangingStatus} onClick={handleStatusChange}>
                  {isChangingStatus ? "Guardando..." : clienta.activa ? "Desactivar" : "Reactivar"}
                </button>
              </div>
            </AuraPanel>
          </>
        )}
      </div>
      <ConfirmDialog open={confirmingStatus} title="¿Desactivar esta clienta?" description="Dejará de aparecer entre las clientas activas, pero se conservará su historial." confirmLabel="Desactivar clienta" destructive isProcessing={isChangingStatus} onClose={() => setConfirmingStatus(false)} onConfirm={async () => { await updateStatus(false); setConfirmingStatus(false); }} />
    </AuraPage>
  );
}

export default ClientaDetailPage;

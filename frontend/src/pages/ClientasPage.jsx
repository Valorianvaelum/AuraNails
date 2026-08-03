import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listClientas } from "../api/clientas.js";
import { AuraEmptyState, AuraHero, AuraPage, AuraPanel, AuraPanelHeader, AuraRecordCard } from "../components/visual";

function ClientasPage() {
  const [clientas, setClientas] = useState([]);
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("activas");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadClientas() {
      setIsLoading(true); setError(""); setClientas([]);
      try { const data = await listClientas({ search, estado }); if (isMounted) setClientas(data); }
      catch { if (isMounted) setError("No pudimos cargar tus clientas. Intentá nuevamente."); }
      finally { if (isMounted) setIsLoading(false); }
    }
    loadClientas();
    return () => { isMounted = false; };
  }, [estado, search]);

  const isSearching = Boolean(search.trim());

  return (
    <AuraPage width="content">
      <div className="grid gap-5">
        <AuraHero
          eyebrow="Clientas"
          title="Mis clientas"
          description="Consultá sus datos, preferencias y estado antes de crear o revisar un turno."
          actions={<Link className="aura-button aura-button-primary" to="/clientas/nueva">Nueva clienta</Link>}
        />

        <AuraPanel>
          <AuraPanelHeader title="Buscar clientas" description="Filtrá por nombre, teléfono, email o estado." />
          <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
            <label className="sr-only" htmlFor="buscar-clientas">Buscar clientas</label>
            <input className="aura-control" id="buscar-clientas" placeholder="Buscar por nombre, teléfono o email" type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
            <label className="sr-only" htmlFor="estado-clientas">Mostrar</label>
            <select className="aura-control" id="estado-clientas" value={estado} onChange={(event) => setEstado(event.target.value)}>
              <option value="activas">Activas</option>
              <option value="inactivas">Inactivas</option>
              <option value="todas">Todas</option>
            </select>
          </div>
        </AuraPanel>

        <AuraPanel>
          <AuraPanelHeader title="Listado" description="Abrí una tarjeta para consultar o editar la información." />
          {isLoading && <p className="aura-form-status">Cargando clientas...</p>}
          {error && <p className="rounded-xl bg-[var(--color-danger-soft)] px-4 py-3 text-destructive" role="alert">{error}</p>}
          {!isLoading && !error && clientas.length === 0 && (
            <AuraEmptyState
              title={isSearching ? "No encontramos clientas con esa búsqueda." : "Todavía no agregaste ninguna clienta."}
              action={!isSearching && estado === "activas" ? <Link className="aura-button aura-button-secondary" to="/clientas/nueva">Agregar mi primera clienta</Link> : null}
            />
          )}
          {!isLoading && !error && clientas.length > 0 && (
            <ul className="grid gap-3" aria-label="Listado de clientas">
              {clientas.map((clienta) => (
                <li key={clienta.id}>
                  <AuraRecordCard as={Link} className="aura-service-card block p-5" to={`/clientas/${clienta.id}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-semibold">{clienta.nombre_completo}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{clienta.telefono || clienta.email || "Sin datos de contacto"}</p>
                      </div>
                      {!clienta.activa && <span className="ui-badge ui-badge-danger">Inactiva</span>}
                    </div>
                  </AuraRecordCard>
                </li>
              ))}
            </ul>
          )}
        </AuraPanel>
      </div>
    </AuraPage>
  );
}

export default ClientasPage;

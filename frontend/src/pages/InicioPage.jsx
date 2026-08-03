import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { obtenerCajaAbierta } from "@/api/caja.js";
import { listarCobros } from "@/api/cobros.js";
import { listarTurnos } from "@/api/turnos.js";
import { useAuth } from "@/auth/AuthContext.jsx";
import { dinero } from "@/components/CajaResumen.jsx";
import { Badge, Skeleton } from "@/components/ui";
import { AuraEmptyState, AuraHero, AuraPage, AuraPanel, AuraPanelHeader, AuraRecordCard } from "@/components/visual";

const hoy = () => new Date().toLocaleDateString("en-CA");
const hora = (value) => new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));

const statusVariant = {
  confirmado: "success",
  reprogramado: "warning",
  pendiente: "secondary",
};

function MetricCard({ title, value, description, actionLabel, to, loading = false, badge }) {
  return (
    <article className="aura-home-metric">
      <div className="aura-home-metric-body">
        <div className="aura-home-metric-heading">
          <p className="aura-home-metric-label">{title}</p>
          {badge}
        </div>
        {loading ? <Skeleton className="mt-3 h-9 w-24" /> : <p className="aura-home-metric-value">{value}</p>}
        <p className="aura-home-metric-description">{description}</p>
      </div>
      <Link className="aura-home-metric-action" to={to}>{actionLabel}</Link>
    </article>
  );
}

function InicioPage() {
  const { user } = useAuth();
  const nombre = typeof user?.nombre === "string" && user.nombre.trim()
    ? user.nombre.trim()
    : typeof user?.apellido === "string" ? user.apellido.trim() : "";
  const [resumen, setResumen] = useState({ caja: undefined, turnos: [], cobros: [], error: "" });

  useEffect(() => {
    let vigente = true;
    Promise.all([obtenerCajaAbierta(), listarTurnos({ fecha: hoy() }), listarCobros({ fecha: hoy() })])
      .then(([caja, turnos, cobros]) => { if (vigente) setResumen({ caja, turnos, cobros, error: "" }); })
      .catch(() => { if (vigente) setResumen((actual) => ({ ...actual, caja: null, error: "No pudimos cargar el resumen de hoy." })); });
    return () => { vigente = false; };
  }, []);

  const cargando = resumen.caja === undefined;
  const proximosTurnos = resumen.turnos
    .filter((turno) => ["pendiente", "confirmado", "reprogramado"].includes(turno.estado) && new Date(turno.inicio) > new Date())
    .sort((a, b) => new Date(a.inicio) - new Date(b.inicio));

  return (
    <AuraPage width="wide">
      <div className="aura-home-stack grid">
        <AuraHero
          eyebrow="Resumen diario"
          title={nombre ? `Hola, ${nombre}` : "Hola"}
          description="Organizá el día, revisá la caja y accedé rápido a las tareas principales."
          actions={(
            <>
              <Link className="aura-button aura-button-primary" to="/turnos/nuevo">Nuevo turno</Link>
              <Link className="aura-button aura-button-secondary" to="/clientas/nueva">Nueva clienta</Link>
            </>
          )}
        />

        {resumen.error && (
          <div className="rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-destructive" role="alert">
            {resumen.error}
          </div>
        )}

        <AuraPanel className="aura-home-section" aria-labelledby="estado-hoy">
          <AuraPanelHeader
            title="Estado de hoy"
            description="Información operativa principal del estudio."
            action={<Link to="/agenda">Abrir agenda</Link>}
          />
          <div className="aura-home-metrics grid gap-3 md:grid-cols-3">
            <MetricCard
              title="Caja"
              value={resumen.caja ? dinero(resumen.caja.resumen?.saldo_teorico) : "Cerrada"}
              description={resumen.caja ? "Saldo esperado de la caja abierta actualmente." : "Abrí la caja antes de registrar nuevos cobros."}
              actionLabel={resumen.caja ? "Ver caja" : "Abrir caja"}
              to="/caja"
              loading={cargando}
              badge={!cargando && <Badge variant={resumen.caja ? "success" : "warning"}>{resumen.caja ? "Abierta" : "Cerrada"}</Badge>}
            />
            <MetricCard
              title="Turnos de hoy"
              value={resumen.turnos.length}
              description="Todos los turnos registrados para la fecha actual."
              actionLabel="Ver turnos"
              to={`/turnos?fecha=${hoy()}`}
              loading={cargando}
            />
            <MetricCard
              title="Cobros de hoy"
              value={resumen.cobros.length}
              description="Cobros registrados durante la jornada actual."
              actionLabel="Ver cobros"
              to={`/cobros?fecha=${hoy()}`}
              loading={cargando}
            />
          </div>
        </AuraPanel>

        <AuraPanel className="aura-home-section" aria-labelledby="proximos-turnos">
          <AuraPanelHeader
            title="Próximos turnos"
            description="Los siguientes compromisos abiertos de hoy."
            action={<Link to={`/turnos?fecha=${hoy()}`}>Ver todos los turnos</Link>}
          />

          {cargando ? (
            <div className="grid gap-3">
              {[0, 1, 2].map((item) => <Skeleton className="h-20 w-full rounded-lg" key={item} />)}
            </div>
          ) : proximosTurnos.length ? (
            <div className="grid gap-3">
              {proximosTurnos.slice(0, 3).map((turno) => (
                <AuraRecordCard
                  as={Link}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  key={turno.id}
                  to={`/turnos/${turno.id}`}
                >
                  <div>
                    <p className="text-sm font-semibold">{hora(turno.inicio)} · {turno.clienta.nombre_completo}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Abrir detalle del turno</p>
                  </div>
                  <Badge variant={statusVariant[turno.estado] || "outline"}>{turno.estado_display}</Badge>
                </AuraRecordCard>
              ))}
            </div>
          ) : (
            <AuraEmptyState
              title="No tenés próximos turnos para hoy."
              description="Podés crear uno nuevo desde el acceso principal."
            />
          )}
        </AuraPanel>

        <AuraPanel className="aura-home-section aura-quick-access-panel" aria-labelledby="accesos-rapidos">
          <AuraPanelHeader title="Accesos rápidos" description="Atajos a las tareas más frecuentes del estudio." />
          <nav className="aura-quick-actions" aria-label="Accesos rápidos">
            <Link className="aura-quick-action" to="/agenda"><span>Agenda</span><span aria-hidden="true">→</span></Link>
            <Link className="aura-quick-action" to="/caja"><span>Caja</span><span aria-hidden="true">→</span></Link>
            <Link className="aura-quick-action" to="/cobros"><span>Cobros</span><span aria-hidden="true">→</span></Link>
            <Link className="aura-quick-action" to="/servicios"><span>Servicios</span><span aria-hidden="true">→</span></Link>
          </nav>
        </AuraPanel>
      </div>
    </AuraPage>
  );
}

export default InicioPage;

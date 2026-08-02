import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { obtenerCajaAbierta } from "@/api/caja.js";
import { listarCobros } from "@/api/cobros.js";
import { listarTurnos } from "@/api/turnos.js";
import { useAuth } from "@/auth/AuthContext.jsx";
import AppHeader from "@/components/AppHeader.jsx";
import { dinero } from "@/components/CajaResumen.jsx";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

const hoy = () => new Date().toLocaleDateString("en-CA");
const hora = (value) => new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));

const actionClassName = cn(
  "inline-flex h-11 items-center justify-center rounded-md border px-4 text-sm font-semibold transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

const primaryActionClassName = cn(actionClassName, "border-primary bg-primary text-primary-foreground hover:bg-[var(--color-brand-hover)]");
const secondaryActionClassName = cn(actionClassName, "border-border bg-card text-foreground hover:border-[var(--color-border-strong)] hover:bg-secondary");
const linkActionClassName = "inline-flex items-center text-sm font-semibold text-primary underline-offset-4 hover:underline";

const statusVariant = {
  confirmado: "success",
  reprogramado: "warning",
  pendiente: "secondary",
};

function MetricCard({ title, value, description, actionLabel, to, loading = false, badge }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardDescription>{title}</CardDescription>
          {badge}
        </div>
        {loading ? <Skeleton className="mt-2 h-9 w-24" /> : <CardTitle className="text-3xl">{value}</CardTitle>}
      </CardHeader>
      <CardContent className="flex h-full flex-col justify-between gap-4">
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        <Link className={linkActionClassName} to={to}>{actionLabel}</Link>
      </CardContent>
    </Card>
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
    <main className="min-h-screen text-foreground">
      <AppHeader />
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="space-y-8">
          <header className="flex flex-col gap-5 border-b border-border pb-7 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Resumen diario</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{nombre ? `Hola, ${nombre}` : "Hola"}</h1>
              <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">Organizá el día, revisá la caja y accedé rápido a las tareas principales.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className={primaryActionClassName} to="/turnos/nuevo">Nuevo turno</Link>
              <Link className={secondaryActionClassName} to="/clientas/nueva">Nueva clienta</Link>
            </div>
          </header>

          {resumen.error && (
            <div className="rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-destructive" role="alert">
              {resumen.error}
            </div>
          )}

          <section aria-labelledby="estado-hoy">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold" id="estado-hoy">Estado de hoy</h2>
                <p className="mt-1 text-sm text-muted-foreground">Información operativa principal del estudio.</p>
              </div>
              <Link className={linkActionClassName} to="/agenda">Abrir agenda</Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
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
          </section>

          <Separator />

          <section aria-labelledby="proximos-turnos">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold" id="proximos-turnos">Próximos turnos</h2>
                <p className="mt-1 text-sm text-muted-foreground">Los siguientes compromisos abiertos de hoy.</p>
              </div>
              <Link className={linkActionClassName} to={`/turnos?fecha=${hoy()}`}>Ver todos los turnos</Link>
            </div>

            {cargando ? (
              <div className="mt-4 grid gap-3">
                {[0, 1, 2].map((item) => <Skeleton className="h-20 w-full rounded-lg" key={item} />)}
              </div>
            ) : proximosTurnos.length ? (
              <div className="mt-4 grid gap-3">
                {proximosTurnos.slice(0, 3).map((turno) => (
                  <Link
                    className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-[var(--color-border-strong)] hover:bg-secondary sm:flex-row sm:items-center sm:justify-between"
                    key={turno.id}
                    to={`/turnos/${turno.id}`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{hora(turno.inicio)} · {turno.clienta.nombre_completo}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Abrir detalle del turno</p>
                    </div>
                    <Badge variant={statusVariant[turno.estado] || "outline"}>{turno.estado_display}</Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="mt-4 border-dashed bg-secondary shadow-none">
                <CardContent className="py-8 text-center">
                  <p className="font-medium">No tenés próximos turnos para hoy.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Podés crear uno nuevo desde el acceso principal.</p>
                </CardContent>
              </Card>
            )}
          </section>

          <Separator />

          <section aria-labelledby="accesos-rapidos">
            <h2 className="text-xl font-semibold" id="accesos-rapidos">Accesos rápidos</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link className={secondaryActionClassName} to="/agenda">Agenda</Link>
              <Link className={secondaryActionClassName} to="/caja">Caja</Link>
              <Link className={secondaryActionClassName} to="/cobros">Cobros</Link>
              <Link className={secondaryActionClassName} to="/servicios">Servicios</Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default InicioPage;

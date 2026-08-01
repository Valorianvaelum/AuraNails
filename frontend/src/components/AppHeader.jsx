import { NavLink } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext.jsx";
import { Button } from "@/components/ui/button.jsx";
import { cn } from "@/lib/utils";

const links = [
  ["Inicio", "/inicio"],
  ["Agenda", "/agenda"],
  ["Turnos", "/turnos"],
  ["Clientas", "/clientas"],
  ["Servicios", "/servicios"],
  ["Cobros", "/cobros"],
  ["Caja", "/caja"],
];

const linkClassName = ({ isActive }) =>
  cn(
    "inline-flex h-9 shrink-0 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors",
    "hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    isActive && "bg-[var(--color-brand-soft)] text-primary",
  );

function AppHeader() {
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:px-8">
        <NavLink
          className="flex shrink-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          to="/inicio"
          aria-label="Ir al inicio de AuraNails"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-brand-soft)] text-sm font-bold text-primary" aria-hidden="true">
            AN
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-wide text-foreground">AuraNails</span>
            <span className="block text-xs text-muted-foreground">Gestión del estudio</span>
          </span>
        </NavLink>

        <nav className="order-3 flex min-w-0 flex-1 gap-1 overflow-x-auto pb-1 lg:order-none lg:justify-center lg:overflow-visible lg:pb-0" aria-label="Navegación principal">
          {links.map(([label, to]) => (
            <NavLink className={linkClassName} key={to} to={to}>
              {label}
            </NavLink>
          ))}
        </nav>

        <Button className="ml-auto h-9 px-3" variant="ghost" size="sm" type="button" onClick={logout}>
          Salir
        </Button>
      </div>
    </header>
  );
}

export default AppHeader;

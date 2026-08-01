import { useState } from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext.jsx";
import { Button } from "@/components/ui/button.jsx";
import { cn } from "@/lib/utils";

const links = [
  ["Inicio", "/inicio"],
  ["Agenda", "/agenda"],
  ["Todos los turnos", "/turnos"],
  ["Clientas", "/clientas"],
  ["Servicios", "/servicios"],
  ["Cobros", "/cobros"],
  ["Caja", "/caja"],
];

const desktopLinkClassName = ({ isActive }) =>
  cn(
    "inline-flex h-10 shrink-0 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors",
    "hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    isActive && "bg-[var(--color-brand-soft)] text-primary",
  );

const mobileLinkClassName = ({ isActive }) =>
  cn(
    "flex min-h-11 items-center rounded-lg px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors",
    "hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    isActive && "bg-[var(--color-brand-soft)] text-primary",
  );

function AppHeader() {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
      <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <NavLink
            className="flex shrink-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            to="/inicio"
            aria-label="Ir al inicio de AuraNails"
            onClick={closeMenu}
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-brand-soft)] text-sm font-bold text-primary" aria-hidden="true">
              AN
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold tracking-wide text-foreground">AuraNails</span>
              <span className="block text-xs text-muted-foreground">Gestión del estudio</span>
            </span>
          </NavLink>

          <nav className="hidden min-w-0 flex-1 justify-center gap-1 lg:flex" aria-label="Navegación principal">
            {links.map(([label, to]) => (
              <NavLink className={desktopLinkClassName} key={to} to={to}>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button
              className="h-10 px-3 lg:hidden"
              variant="secondary"
              size="sm"
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((current) => !current)}
            >
              {menuOpen ? "Cerrar" : "Menú"}
            </Button>
            <Button className="h-10 px-3" variant="ghost" size="sm" type="button" onClick={logout}>
              Salir
            </Button>
          </div>
        </div>

        {menuOpen && (
          <nav id="mobile-navigation" className="mt-3 grid gap-1 border-t border-border pt-3 lg:hidden" aria-label="Navegación principal móvil">
            {links.map(([label, to]) => (
              <NavLink className={mobileLinkClassName} key={to} to={to} onClick={closeMenu}>
                {label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

export default AppHeader;

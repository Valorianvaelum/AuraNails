import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext.jsx";
import { cn } from "@/lib/utils";
import { preloadRoute } from "@/routes/routeModules.js";

const links = [
  ["Inicio", "/inicio"],
  ["Agenda", "/agenda"],
  ["Todos los turnos", "/turnos"],
  ["Clientas", "/clientas"],
  ["Servicios", "/servicios"],
  ["Cobros", "/cobros"],
  ["Caja", "/caja"],
];

const desktopLinkClassName = ({ isActive }) => cn("aura-nav-link", isActive && "is-active");
const mobileLinkClassName = ({ isActive }) => cn("aura-mobile-nav-link", isActive && "is-active");

function AppHeader() {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const menuButtonRef = useRef(null);

  const closeMenu = () => setMenuOpen(false);
  const warmRoute = (to) => {
    void preloadRoute(to);
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return undefined;

    const updateHeaderHeight = () => {
      document.documentElement.style.setProperty("--aura-header-height", `${header.getBoundingClientRect().height}px`);
    };

    updateHeaderHeight();
    const observer = typeof window.ResizeObserver === "function" ? new window.ResizeObserver(updateHeaderHeight) : null;
    observer?.observe(header);
    window.addEventListener("resize", updateHeaderHeight);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateHeaderHeight);
      document.documentElement.style.removeProperty("--aura-header-height");
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };

    const handlePointerDown = (event) => {
      if (headerRef.current?.contains(event.target)) return;
      setMenuOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [menuOpen]);

  return (
    <header ref={headerRef} className="aura-app-header sticky top-0 z-40">
      <div className="aura-app-header-inner mx-auto w-full max-w-7xl px-3 py-2 sm:px-6 lg:px-8">
        <div className="aura-app-header-shell aura-glass">
          <div className="flex items-center gap-3">
            <NavLink
              className="aura-brand flex shrink-0 items-center gap-3"
              to="/inicio"
              aria-label="Ir al inicio de AuraNails"
              onClick={closeMenu}
              onFocus={() => warmRoute("/inicio")}
              onPointerEnter={() => warmRoute("/inicio")}
            >
              <span className="aura-brand-mark" aria-hidden="true">
                <img className="aura-brand-logo" src="/logo-favicon.png" alt="" width="512" height="512" decoding="async" />
              </span>
              <span className="leading-tight">
                <span className="aura-brand-title block">AuraNails</span>
                <span className="aura-brand-subtitle block">Gestión del estudio</span>
              </span>
            </NavLink>

            <nav className="hidden min-w-0 flex-1 justify-center gap-1 lg:flex" aria-label="Navegación principal">
              {links.map(([label, to]) => (
                <NavLink
                  className={desktopLinkClassName}
                  key={to}
                  to={to}
                  onFocus={() => warmRoute(to)}
                  onPointerEnter={() => warmRoute(to)}
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <button
                ref={menuButtonRef}
                className="aura-header-action aura-header-menu lg:hidden"
                type="button"
                aria-expanded={menuOpen}
                aria-controls="mobile-navigation"
                aria-haspopup="true"
                aria-label={menuOpen ? "Cerrar menú principal" : "Abrir menú principal"}
                onClick={() => setMenuOpen((current) => !current)}
              >
                {menuOpen ? "Cerrar" : "Menú"}
              </button>
              <button className="aura-header-action aura-header-logout" type="button" onClick={logout} aria-label="Cerrar sesión de AuraNails">
                Salir
              </button>
            </div>
          </div>

          {menuOpen && (
            <nav id="mobile-navigation" className="aura-mobile-nav lg:hidden" aria-label="Navegación principal móvil">
              {links.map(([label, to]) => (
                <NavLink
                  className={mobileLinkClassName}
                  key={to}
                  to={to}
                  onClick={closeMenu}
                  onFocus={() => warmRoute(to)}
                  onPointerEnter={() => warmRoute(to)}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}

export default AppHeader;

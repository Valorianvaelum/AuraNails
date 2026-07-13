import { NavLink } from "react-router-dom";

import { useAuth } from "../auth/AuthContext.jsx";

const linkClassName = ({ isActive }) =>
  `rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-200 ease-out focus:outline-none focus:ring-4 focus:ring-[#e1cad7] ${
    isActive ? "border-[#c9aabd] bg-[#f3ebf0] text-[#563947] shadow-sm" : "border-transparent text-[#6f5b60] hover:border-[#e5dce2] hover:bg-[#faf6f8] hover:text-[#563947]"
  }`;

function AppHeader() {
  const { logout } = useAuth();

  return (
    <header className="border-b border-[#e5dce2] bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-5 py-3 lg:flex-row sm:px-8">
        <NavLink className="group flex items-center gap-2 rounded-lg px-1 py-1 text-[#3f303a] transition hover:text-[#765367]" to="/inicio">
          <span aria-hidden="true" className="h-6 w-1 rounded-full bg-[#765367] shadow-[0_0_0_3px_rgba(201,170,189,0.3)]" />
          <span className="font-semibold tracking-[0.04em]">Aura<span className="font-medium text-[#765367]">Nails</span></span>
          <span className="hidden border-l border-[#e5dce2] pl-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#8b6b7d] sm:inline">Agenda</span>
        </NavLink>
        <nav className="flex max-w-full flex-wrap items-center justify-center gap-1.5" aria-label="Navegación principal">
          <NavLink className={linkClassName} to="/inicio">Inicio</NavLink>
          <NavLink className={linkClassName} to="/clientas">Clientas</NavLink>
          <NavLink className={linkClassName} to="/servicios">Servicios</NavLink>
          <NavLink className={linkClassName} to="/turnos">Turnos</NavLink>
          <NavLink className={linkClassName} to="/agenda">Agenda</NavLink>
          <NavLink className={linkClassName} to="/cobros">Cobros</NavLink>
          <NavLink className={linkClassName} to="/caja">Caja</NavLink>
          <button
            className="rounded-xl border border-transparent px-3 py-2 text-sm font-semibold text-[#8b6b7d] transition-all duration-200 hover:border-[#eadfe5] hover:bg-[#faf6f8] hover:text-[#765367] focus:outline-none focus:ring-4 focus:ring-[#e1cad7]"
            type="button"
            onClick={logout}
          >
            Salir
          </button>
        </nav>
      </div>
    </header>
  );
}

export default AppHeader;

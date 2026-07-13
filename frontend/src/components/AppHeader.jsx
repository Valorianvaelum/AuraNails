import { NavLink } from "react-router-dom";

import { useAuth } from "../auth/AuthContext.jsx";

const linkClassName = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-[#f4dce0] ${
    isActive ? "bg-[#fff0f1] text-[#7d4e57]" : "text-[#6f5b60] hover:bg-[#fff8f7]"
  }`;

function AppHeader() {
  const { logout } = useAuth();

  return (
    <header className="border-b border-[#efdadd] bg-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-3 px-5 py-3 sm:flex-row sm:px-8">
        <NavLink className="text-lg font-semibold tracking-tight text-[#2f2528]" to="/inicio">
          AuraNails
        </NavLink>
        <nav className="flex flex-wrap items-center justify-center gap-1" aria-label="Navegación principal">
          <NavLink className={linkClassName} to="/inicio">Inicio</NavLink>
          <NavLink className={linkClassName} to="/clientas">Clientas</NavLink>
          <NavLink className={linkClassName} to="/servicios">Servicios</NavLink>
          <NavLink className={linkClassName} to="/turnos">Turnos</NavLink>
          <NavLink className={linkClassName} to="/cobros">Cobros</NavLink>
          <NavLink className={linkClassName} to="/caja">Caja</NavLink>
          <button
            className="rounded-lg px-3 py-2 text-sm font-semibold text-[#7d4e57] transition hover:bg-[#fff0f1] focus:outline-none focus:ring-4 focus:ring-[#f4dce0]"
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

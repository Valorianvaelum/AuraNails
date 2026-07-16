import { NavLink } from "react-router-dom";

import { useAuth } from "../auth/AuthContext.jsx";

const linkClassName = ({ isActive }) => `ui-nav-link ${isActive ? "ui-nav-link-active" : ""}`;

function AppHeader() {
  const { logout } = useAuth();

  return (
    <header className="ui-header">
      <div className="ui-header-inner">
        <NavLink className="ui-brand" to="/inicio"><span aria-hidden="true" className="ui-brand-mark" /><span className="ui-brand-name">Aura<span>Nails</span></span><span className="ui-brand-caption">Estudio</span></NavLink>
        <nav className="ui-nav" aria-label="Navegación principal">
          <NavLink className={linkClassName} to="/inicio">Inicio</NavLink><NavLink className={linkClassName} to="/clientas">Clientas</NavLink><NavLink className={linkClassName} to="/servicios">Servicios</NavLink><NavLink className={linkClassName} to="/turnos">Turnos</NavLink><NavLink className={linkClassName} to="/agenda">Agenda</NavLink><NavLink className={linkClassName} to="/cobros">Cobros</NavLink><NavLink className={linkClassName} to="/caja">Caja</NavLink><button className="ui-nav-exit" type="button" onClick={logout}>Salir</button>
        </nav>
      </div>
    </header>
  );
}

export default AppHeader;

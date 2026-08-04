import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import AuraGalaxyBackground from "./components/AuraGalaxyBackground.jsx";
import AuraLoadingScreen from "./components/AuraLoadingScreen.jsx";
import { NotificationsProvider } from "./components/Notifications.jsx";
import { RoutePages } from "./routes/routeModules.js";


const {
  AgendaPage,
  CajaDetailPage,
  CajaPage,
  CajasHistorialPage,
  ClientaDetailPage,
  ClientaFormPage,
  ClientasPage,
  CobroDetailPage,
  CobroFormPage,
  CobrosPage,
  InicioPage,
  LoginPage,
  PasswordResetConfirmPage,
  PasswordResetRequestPage,
  ServiciosPage,
  TurnosPage,
} = RoutePages;

const MODULE_LABELS = {
  login: "Iniciar sesión",
  inicio: "Inicio",
  agenda: "Agenda",
  turnos: "Turnos",
  clientas: "Clientas",
  servicios: "Servicios",
  cobros: "Cobros",
  caja: "Caja",
  general: "AuraNails",
};

function getModuleName(pathname) {
  if (["/login", "/recuperar-contrasena", "/restablecer-contrasena"].includes(pathname)) return "login";
  if (pathname === "/inicio") return "inicio";
  if (pathname.startsWith("/agenda")) return "agenda";
  if (pathname.startsWith("/turnos")) return "turnos";
  if (pathname.startsWith("/clientas")) return "clientas";
  if (pathname.startsWith("/servicios")) return "servicios";
  if (pathname.startsWith("/cobros")) return "cobros";
  if (pathname.startsWith("/caja")) return "caja";
  return "general";
}

function getRouteLabel(pathname, moduleName) {
  if (pathname === "/recuperar-contrasena") return "Recuperar contraseña";
  if (pathname === "/restablecer-contrasena") return "Restablecer contraseña";
  if (pathname === "/turnos/nuevo") return "Nuevo turno";
  if (pathname.endsWith("/reprogramar")) return "Reprogramar turno";
  if (pathname === "/clientas/nueva") return "Nueva clienta";
  if (pathname.endsWith("/editar") && pathname.startsWith("/clientas/")) return "Editar clienta";
  if (pathname === "/cobros/nuevo") return "Registrar cobro";
  if (pathname === "/caja/historial") return "Historial de cajas";
  return MODULE_LABELS[moduleName] || MODULE_LABELS.general;
}

function AuraRouteScope({ children }) {
  const { pathname } = useLocation();
  const moduleName = getModuleName(pathname);
  const routeLabel = useMemo(() => getRouteLabel(pathname, moduleName), [moduleName, pathname]);
  const contentRef = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.auraModule = moduleName;
    document.title = routeLabel === "AuraNails" ? "AuraNails" : `${routeLabel} | AuraNails`;

    return () => {
      delete document.documentElement.dataset.auraModule;
    };
  }, [moduleName, routeLabel]);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    const frameId = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      const content = contentRef.current;
      const activeElement = document.activeElement;
      if (content && !content.contains(activeElement)) {
        content.focus({ preventScroll: true });
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [pathname]);

  return (
    <div
      id="aura-main-content"
      ref={contentRef}
      className={`aura-module aura-module-${moduleName}`}
      tabIndex="-1"
    >
      <p className="aura-route-announcer" aria-live="polite" aria-atomic="true">
        {routeLabel}
      </p>
      {children}
    </div>
  );
}

function RedirectBySession() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AuraLoadingScreen label="Comprobando tu sesión..." />;
  }

  return <Navigate to={isAuthenticated ? "/inicio" : "/login"} replace />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<AuraLoadingScreen label="Cargando módulo..." />}>
      <Routes>
        <Route path="/" element={<RedirectBySession />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recuperar-contrasena" element={<PasswordResetRequestPage />} />
        <Route path="/restablecer-contrasena" element={<PasswordResetConfirmPage />} />
        <Route path="/inicio" element={<ProtectedRoute><InicioPage /></ProtectedRoute>} />
        <Route path="/servicios/*" element={<ProtectedRoute><ServiciosPage /></ProtectedRoute>} />
        <Route path="/turnos/*" element={<ProtectedRoute><TurnosPage /></ProtectedRoute>} />
        <Route path="/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
        <Route path="/cobros" element={<ProtectedRoute><CobrosPage /></ProtectedRoute>} />
        <Route path="/cobros/nuevo" element={<ProtectedRoute><CobroFormPage /></ProtectedRoute>} />
        <Route path="/cobros/:id" element={<ProtectedRoute><CobroDetailPage /></ProtectedRoute>} />
        <Route path="/caja" element={<ProtectedRoute><CajaPage /></ProtectedRoute>} />
        <Route path="/caja/historial" element={<ProtectedRoute><CajasHistorialPage /></ProtectedRoute>} />
        <Route path="/caja/:id" element={<ProtectedRoute><CajaDetailPage /></ProtectedRoute>} />
        <Route path="/clientas" element={<ProtectedRoute><ClientasPage /></ProtectedRoute>} />
        <Route path="/clientas/nueva" element={<ProtectedRoute><ClientaFormPage /></ProtectedRoute>} />
        <Route path="/clientas/:id" element={<ProtectedRoute><ClientaDetailPage /></ProtectedRoute>} />
        <Route path="/clientas/:id/editar" element={<ProtectedRoute><ClientaFormPage /></ProtectedRoute>} />
        <Route path="*" element={<RedirectBySession />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <>
      <AuraGalaxyBackground />
      <div className="aura-app-layer">
        <a className="aura-skip-link" href="#aura-main-content">Saltar al contenido principal</a>
        <NotificationsProvider>
          <AuthProvider>
            <AuraRouteScope>
              <AppRoutes />
            </AuraRouteScope>
          </AuthProvider>
        </NotificationsProvider>
      </div>
    </>
  );
}

export default App;

import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import { NotificationsProvider } from "./components/Notifications.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import AgendaPage from "./pages/AgendaPage.jsx";
import InicioPage from "./pages/InicioPage.jsx";
import ClientaDetailPage from "./pages/ClientaDetailPage.jsx";
import ClientaFormPage from "./pages/ClientaFormPage.jsx";
import ClientasPage from "./pages/ClientasPage.jsx";
import CobroDetailPage from "./pages/CobroDetailPage.jsx";
import CobroFormPage from "./pages/CobroFormPage.jsx";
import CobrosPage from "./pages/CobrosPage.jsx";
import CajaDetailPage from "./pages/CajaDetailPage.jsx";
import CajaPage from "./pages/CajaPage.jsx";
import CajasHistorialPage from "./pages/CajasHistorialPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ServiciosPage from "./pages/ServiciosPage.jsx";
import TurnosPage from "./pages/TurnosPage.jsx";

function RedirectBySession() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <main className="min-h-screen bg-[#fff4f7]" aria-label="Cargando sesión" />;
  }

  return <Navigate to={isAuthenticated ? "/inicio" : "/login"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RedirectBySession />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/inicio"
        element={
          <ProtectedRoute>
            <InicioPage />
          </ProtectedRoute>
        }
      />
      <Route path="/servicios/*" element={<ProtectedRoute><ServiciosPage /></ProtectedRoute>} />
      <Route path="/turnos/*" element={<ProtectedRoute><TurnosPage /></ProtectedRoute>} />
      <Route path="/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
      <Route path="/cobros" element={<ProtectedRoute><CobrosPage /></ProtectedRoute>} />
      <Route path="/cobros/nuevo" element={<ProtectedRoute><CobroFormPage /></ProtectedRoute>} />
      <Route path="/cobros/:id" element={<ProtectedRoute><CobroDetailPage /></ProtectedRoute>} />
      <Route path="/caja" element={<ProtectedRoute><CajaPage /></ProtectedRoute>} />
      <Route path="/caja/historial" element={<ProtectedRoute><CajasHistorialPage /></ProtectedRoute>} />
      <Route path="/caja/:id" element={<ProtectedRoute><CajaDetailPage /></ProtectedRoute>} />
      <Route
        path="/clientas"
        element={
          <ProtectedRoute>
            <ClientasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientas/nueva"
        element={
          <ProtectedRoute>
            <ClientaFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientas/:id"
        element={
          <ProtectedRoute>
            <ClientaDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientas/:id/editar"
        element={
          <ProtectedRoute>
            <ClientaFormPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<RedirectBySession />} />
    </Routes>
  );
}

function App() {
  return (
    <NotificationsProvider><AuthProvider><AppRoutes /></AuthProvider></NotificationsProvider>
  );
}

export default App;

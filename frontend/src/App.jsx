import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import InicioPage from "./pages/InicioPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";

function RedirectBySession() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <main className="min-h-screen bg-[#fff8f7]" aria-label="Cargando sesión" />;
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
      <Route path="*" element={<RedirectBySession />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;

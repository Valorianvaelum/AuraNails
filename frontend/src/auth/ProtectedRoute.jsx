import { Navigate, useLocation } from "react-router-dom";

import AuraLoadingScreen from "../components/AuraLoadingScreen.jsx";
import { useAuth } from "./AuthContext.jsx";

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuraLoadingScreen label="Cargando tu espacio..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;

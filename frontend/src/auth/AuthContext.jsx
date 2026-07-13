import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { getCurrentUser, loginRequest } from "../api/auth.js";
import { setSessionExpiredHandler } from "../api/client.js";
import { clearSession, hasSession, saveSession } from "../api/session.js";
import { useNotifications } from "../components/Notifications.jsx";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { notify } = useNotifications();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionExpiredNotified = useRef(false);

  const logout = useCallback(({ expired = false } = {}) => {
    clearSession();
    setUser(null);
    if (expired && !sessionExpiredNotified.current) {
      sessionExpiredNotified.current = true;
      notify("Tu sesión venció. Iniciá sesión nuevamente.", "warning");
    }
  }, [notify]);

  const login = useCallback(async (email, password) => {
    const data = await loginRequest(email, password);
    saveSession(data);
    sessionExpiredNotified.current = false;
    setUser(data.user);
    notify("Sesión iniciada.", "info");
    return data.user;
  }, [notify]);

  useEffect(() => setSessionExpiredHandler(() => logout({ expired: true })), [logout]);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      if (!hasSession()) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (isMounted) setUser(currentUser);
      } catch {
        clearSession();
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), isLoading, login, logout }),
    [isLoading, login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  }

  return context;
}

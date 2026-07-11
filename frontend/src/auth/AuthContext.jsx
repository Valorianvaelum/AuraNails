import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getCurrentUser, loginRequest } from "../api/auth.js";
import { setSessionExpiredHandler } from "../api/client.js";
import { clearSession, hasSession, saveSession } from "../api/session.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await loginRequest(email, password);
    saveSession(data);
    setUser(data.user);
    return data.user;
  }, []);

  useEffect(() => setSessionExpiredHandler(logout), [logout]);

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

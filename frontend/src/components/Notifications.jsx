import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const NotificationsContext = createContext(null);
const DURATIONS = { success: 3500, info: 4000, warning: 5500, error: 7000 };
const LABELS = { success: "Correcto", info: "Información", warning: "Atención", error: "Error" };

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const ids = useRef(0);

  const dismiss = useCallback((id) => setNotifications((current) => current.filter((item) => item.id !== id)), []);
  const notify = useCallback((message, type = "info") => {
    if (!message) return;
    const created = { id: ++ids.current, message, type };
    let accepted = false;
    setNotifications((current) => {
      if (current.some((item) => item.message === message && item.type === type)) return current;
      accepted = true;
      return [...current, created].slice(-3);
    });
    window.setTimeout(() => { if (accepted && DURATIONS[type]) dismiss(created.id); }, DURATIONS[type] || 4000);
  }, [dismiss]);

  const value = useMemo(() => ({ notify, dismiss }), [dismiss, notify]);
  return <NotificationsContext.Provider value={value}>{children}<section className="pointer-events-none fixed inset-x-4 top-4 z-50 mx-auto grid max-w-md gap-3 sm:left-auto sm:right-6 sm:mx-0" aria-label="Avisos" aria-live="polite">{notifications.map((item) => <div className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg ${item.type === "error" ? "border-[#d8b8c1] bg-[#f8edef] text-[#6f3443]" : item.type === "warning" ? "border-[#e7d4b0] bg-[#fbf6e9] text-[#6b5023]" : item.type === "success" ? "border-[#c9ddce] bg-[#f0f8f1] text-[#315e3a]" : "border-[#d8ced4] bg-[#fbf9f8] text-[#563947]"}`} key={item.id} role={item.type === "error" ? "alert" : "status"}><div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-[0.12em]">{LABELS[item.type]}</p><p className="mt-1 text-sm">{item.message}</p></div><button aria-label="Cerrar aviso" className="shrink-0 rounded-lg px-2 py-1 text-sm" type="button" onClick={() => dismiss(item.id)}>Cerrar</button></div>)}</section></NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useNotifications debe utilizarse dentro de NotificationsProvider.");
  return context;
}

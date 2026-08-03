import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const NotificationsContext = createContext(null);
const DURATIONS = { success: 6000, info: 6500, warning: 8500, error: 10000 };
const LABELS = { success: "Correcto", info: "Información", warning: "Atención", error: "Error" };

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const ids = useRef(0);
  const timers = useRef(new Map());
  const signatures = useRef(new Map());

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    signatures.current.delete(id);
    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback((message, type = "info") => {
    if (!message) return;

    const signature = `${type}:${message}`;
    if ([...signatures.current.values()].includes(signature)) return;

    const id = ++ids.current;
    const created = { id, message, type };
    signatures.current.set(id, signature);
    setNotifications((current) => {
      const next = [...current, created];
      const dropped = next.slice(0, Math.max(0, next.length - 3));
      dropped.forEach((item) => {
        const oldTimer = timers.current.get(item.id);
        if (oldTimer) window.clearTimeout(oldTimer);
        timers.current.delete(item.id);
        signatures.current.delete(item.id);
      });
      return next.slice(-3);
    });

    const timer = window.setTimeout(() => dismiss(id), DURATIONS[type] || DURATIONS.info);
    timers.current.set(id, timer);
  }, [dismiss]);

  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current.clear();
    signatures.current.clear();
  }, []);

  const value = useMemo(() => ({ notify, dismiss }), [dismiss, notify]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <section className="aura-notification-stack" aria-label="Avisos">
        {notifications.map((item) => (
          <div
            aria-atomic="true"
            aria-live={item.type === "error" ? "assertive" : "polite"}
            className={`aura-notification is-${item.type}`}
            key={item.id}
            role={item.type === "error" ? "alert" : "status"}
          >
            <span className="aura-notification-indicator" aria-hidden="true" />
            <div className="aura-notification-copy">
              <p className="aura-notification-label">{LABELS[item.type]}</p>
              <p className="aura-notification-message">{item.message}</p>
            </div>
            <button
              aria-label={`Cerrar aviso: ${LABELS[item.type]}`}
              className="aura-notification-close"
              type="button"
              onClick={() => dismiss(item.id)}
            >
              Cerrar
            </button>
          </div>
        ))}
      </section>
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useNotifications debe utilizarse dentro de NotificationsProvider.");
  return context;
}

import { lazy } from "react";

const loaders = {
  agenda: () => import("../pages/AgendaPage.jsx"),
  caja: () => import("../pages/CajaPage.jsx"),
  cajaDetail: () => import("../pages/CajaDetailPage.jsx"),
  cajasHistorial: () => import("../pages/CajasHistorialPage.jsx"),
  clientaDetail: () => import("../pages/ClientaDetailPage.jsx"),
  clientaForm: () => import("../pages/ClientaFormPage.jsx"),
  clientas: () => import("../pages/ClientasPage.jsx"),
  cobroDetail: () => import("../pages/CobroDetailPage.jsx"),
  cobroForm: () => import("../pages/CobroFormPage.jsx"),
  cobros: () => import("../pages/CobrosPage.jsx"),
  inicio: () => import("../pages/InicioPage.jsx"),
  login: () => import("../pages/LoginPage.jsx"),
  passwordResetConfirm: () => import("../pages/PasswordResetConfirmPage.jsx"),
  passwordResetRequest: () => import("../pages/PasswordResetRequestPage.jsx"),
  servicios: () => import("../pages/ServiciosPage.jsx"),
  turnos: () => import("../pages/TurnosPage.jsx"),
};

export const RoutePages = {
  AgendaPage: lazy(loaders.agenda),
  CajaDetailPage: lazy(loaders.cajaDetail),
  CajaPage: lazy(loaders.caja),
  CajasHistorialPage: lazy(loaders.cajasHistorial),
  ClientaDetailPage: lazy(loaders.clientaDetail),
  ClientaFormPage: lazy(loaders.clientaForm),
  ClientasPage: lazy(loaders.clientas),
  CobroDetailPage: lazy(loaders.cobroDetail),
  CobroFormPage: lazy(loaders.cobroForm),
  CobrosPage: lazy(loaders.cobros),
  InicioPage: lazy(loaders.inicio),
  LoginPage: lazy(loaders.login),
  PasswordResetConfirmPage: lazy(loaders.passwordResetConfirm),
  PasswordResetRequestPage: lazy(loaders.passwordResetRequest),
  ServiciosPage: lazy(loaders.servicios),
  TurnosPage: lazy(loaders.turnos),
};

function getLoader(pathname) {
  if (pathname === "/login") return loaders.login;
  if (pathname === "/recuperar-contrasena") return loaders.passwordResetRequest;
  if (pathname === "/restablecer-contrasena") return loaders.passwordResetConfirm;
  if (pathname === "/inicio" || pathname === "/") return loaders.inicio;
  if (pathname.startsWith("/agenda")) return loaders.agenda;
  if (pathname.startsWith("/turnos")) return loaders.turnos;
  if (pathname === "/clientas/nueva" || /^\/clientas\/[^/]+\/editar\/?$/.test(pathname)) return loaders.clientaForm;
  if (/^\/clientas\/[^/]+\/?$/.test(pathname)) return loaders.clientaDetail;
  if (pathname.startsWith("/clientas")) return loaders.clientas;
  if (pathname.startsWith("/servicios")) return loaders.servicios;
  if (pathname === "/cobros/nuevo") return loaders.cobroForm;
  if (/^\/cobros\/[^/]+\/?$/.test(pathname)) return loaders.cobroDetail;
  if (pathname.startsWith("/cobros")) return loaders.cobros;
  if (pathname === "/caja/historial") return loaders.cajasHistorial;
  if (/^\/caja\/[^/]+\/?$/.test(pathname)) return loaders.cajaDetail;
  if (pathname.startsWith("/caja")) return loaders.caja;
  return null;
}

export function preloadRoute(pathname) {
  const loader = getLoader(pathname);
  if (!loader) return Promise.resolve();
  return loader().catch(() => undefined);
}

import { apiClient } from "./client.js";

export const listarCajas = async (params) => (await apiClient.get("/cajas/", { params })).data;
export const obtenerCaja = async (id) => (await apiClient.get(`/cajas/${id}/`)).data;
export const obtenerCajaAbierta = async () => (await listarCajas({ estado: "abierta" }))[0] || null;
export const abrirCaja = async (payload) => (await apiClient.post("/cajas/", payload)).data;
export const cerrarCaja = async (id, payload) => (await apiClient.post(`/cajas/${id}/cerrar/`, payload)).data;
export const registrarGasto = async (id, payload) => (await apiClient.post(`/cajas/${id}/gastos/`, payload)).data;
export const anularGasto = async (id, gastoId, payload) => (await apiClient.post(`/cajas/${id}/gastos/${gastoId}/anular/`, payload)).data;
export const registrarAporte = async (id, payload) => (await apiClient.post(`/cajas/${id}/aportes/`, payload)).data;
export const registrarRetiro = async (id, payload) => (await apiClient.post(`/cajas/${id}/retiros/`, payload)).data;
export const anularMovimiento = async (id, movimientoId, payload) => (await apiClient.post(`/cajas/${id}/movimientos/${movimientoId}/anular/`, payload)).data;

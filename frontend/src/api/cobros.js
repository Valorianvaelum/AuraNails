import { apiClient } from "./client.js";

export const listarCobros = async (params) => (await apiClient.get("/cobros/", { params })).data;
export const obtenerCobro = async (id) => (await apiClient.get(`/cobros/${id}/`)).data;
export const registrarCobro = async (payload) => (await apiClient.post("/cobros/", payload)).data;
export const anularCobro = async (id, payload) => (await apiClient.post(`/cobros/${id}/anular/`, payload)).data;

import { apiClient } from "./client.js";
export const listServicios = async (params) => (await apiClient.get("/servicios/", { params })).data;
export const getServicio = async (id) => (await apiClient.get(`/servicios/${id}/`)).data;
export const saveServicio = async (id, payload) => id ? (await apiClient.patch(`/servicios/${id}/`, payload)).data : (await apiClient.post("/servicios/", payload)).data;
export const estadoServicio = async (id, activo) => (await apiClient.post(`/servicios/${id}/${activo ? "reactivar" : "pausar"}/`)).data;

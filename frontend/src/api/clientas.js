import { apiClient } from "./client.js";

export async function listClientas({ search = "", estado = "activas" } = {}) {
  const { data } = await apiClient.get("/clientas/", { params: { search, estado } });
  return data;
}

export async function getClienta(id) {
  const { data } = await apiClient.get(`/clientas/${id}/`);
  return data;
}

export async function createClienta(payload) {
  const { data } = await apiClient.post("/clientas/", payload);
  return data;
}

export async function updateClienta(id, payload) {
  const { data } = await apiClient.patch(`/clientas/${id}/`, payload);
  return data;
}

export async function changeClientaStatus(id, activa) {
  const action = activa ? "reactivar" : "desactivar";
  const { data } = await apiClient.post(`/clientas/${id}/${action}/`);
  return data;
}

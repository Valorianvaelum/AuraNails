import { apiClient } from "./client.js";

export async function loginRequest(email, password) {
  const { data } = await apiClient.post("/auth/login/", { email, password });
  return data;
}

export async function getCurrentUser() {
  const { data } = await apiClient.get("/auth/me/");
  return data;
}

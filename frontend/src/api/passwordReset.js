import { apiClient } from "./client.js";


export async function requestPasswordReset(email) {
  const { data } = await apiClient.post("/auth/password-reset/request/", { email });
  return data;
}


export async function confirmPasswordReset({ uid, token, newPassword, newPasswordConfirm }) {
  const { data } = await apiClient.post("/auth/password-reset/confirm/", {
    uid,
    token,
    new_password: newPassword,
    new_password_confirm: newPasswordConfirm,
  });
  return data;
}

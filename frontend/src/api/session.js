const ACCESS_TOKEN_KEY = "auranails.accessToken";
const REFRESH_TOKEN_KEY = "auranails.refreshToken";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function hasSession() {
  return Boolean(getAccessToken() || getRefreshToken());
}

export function saveSession({ access, refresh }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function saveAccessToken(access) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

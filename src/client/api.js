const TOKEN_STORAGE_KEY = 'dbv_gestao_token_v1';
const TEST_TOKEN_STORAGE_KEY = 'dbv_gestao_token_teste_v1';

// Base URL do backend na VM Oracle ou vazio em desenvolvimento local
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export function isTestMode() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('teste') === '1';
}

export function getTestModeUrl(enable) {
  if (typeof window === 'undefined') return '/';
  const url = new URL(window.location.href);
  if (enable) {
    url.searchParams.set('teste', '1');
  } else {
    url.searchParams.delete('teste');
  }
  return url.toString();
}

export function getAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
}

export function getStoredToken() {
  const key = isTestMode() ? TEST_TOKEN_STORAGE_KEY : TOKEN_STORAGE_KEY;
  return localStorage.getItem(key);
}

export function setStoredToken(token) {
  const key = isTestMode() ? TEST_TOKEN_STORAGE_KEY : TOKEN_STORAGE_KEY;
  if (token) {
    localStorage.setItem(key, token);
  } else {
    localStorage.removeItem(key);
  }
}

export async function apiRequest(path, options = {}) {
  const token = getStoredToken();
  const testMode = isTestMode();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(testMode ? { 'X-Test-Mode': 'true' } : {}),
    ...(options.headers || {}),
  };

  const url = path.startsWith('http://') || path.startsWith('https://')
    ? path
    : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Erro na requisição (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

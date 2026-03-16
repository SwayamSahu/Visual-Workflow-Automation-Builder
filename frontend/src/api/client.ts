import axios from 'axios';

// In development Vite proxies /api → http://localhost:3000 (see vite.config.ts).
// In production set VITE_API_BASE_URL to the backend origin.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

// Normalise error messages so callers just catch Error
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const message: string =
      err.response?.data?.error?.message ?? err.message ?? 'Unknown error';
    return Promise.reject(new Error(message));
  }
);

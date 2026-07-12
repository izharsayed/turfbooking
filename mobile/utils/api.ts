import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';

const getBaseUrl = () => {
  // Constants.expoConfig?.hostUri contains Metro host IP (e.g., "192.168.1.10:8081") in development
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000/api/v1`;
  }
  return 'http://localhost:5000/api/v1';
};

export const API_BASE_URL = getBaseUrl();
console.log(`🔌 Mobile API Base URL resolved to: ${API_BASE_URL}`);

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiOptions extends RequestInit {
  body?: any;
  _retry?: boolean;
}

export async function apiFetch<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, logout } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const doFetch = async (): Promise<T> => {
    const response = await fetch(url, config);
    const text = await response.text();

    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    // Auto-logout on expired / invalid token
    if (response.status === 401) {
      console.warn(`🔐 401 Unauthorized on ${path} — clearing session`);
      logout();
      throw new ApiError(401, 'Session expired. Please log in again.');
    }

    if (!response.ok) {
      const errorMsg = data.message || `API error: ${response.status}`;
      throw new ApiError(response.status, errorMsg);
    }

    // TurfBook backend wraps responses: { success, message, data }
    return data;
  };

  try {
    return await doFetch();
  } catch (error: any) {
    // Retry once on transient network errors (not 401/4xx/5xx)
    if (!options._retry && error.name !== 'ApiError') {
      console.warn(`⚠️ Network error on [${options.method || 'GET'} ${path}], retrying in 1s...`);
      await new Promise((r) => setTimeout(r, 1000));
      try {
        return await apiFetch(path, { ...options, _retry: true });
      } catch (retryErr) {
        console.error(`❌ API call failed after retry [${options.method || 'GET'} ${path}]:`, retryErr);
        throw retryErr;
      }
    }
    if (error instanceof ApiError && error.statusCode === 401) {
      console.warn(`🔐 API call unauthorized [${options.method || 'GET'} ${path}]: ${error.message}`);
    } else {
      console.error(`❌ API call failed [${options.method || 'GET'} ${path}]:`, error);
    }
    throw error;
  }
}

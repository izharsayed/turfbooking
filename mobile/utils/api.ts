import { useAuthStore } from '../store/authStore';
import { CONFIG } from './config';

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const API_BASE_URL = CONFIG.API_URL;

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

export async function apiFetch<T = any>(path: string, options: RequestInit & { body?: any } = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as any),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${path}`;
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (response.status === 401 && !path.startsWith('/auth/')) {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            });

            if (refreshRes.ok) {
              const refreshJson = await refreshRes.json();
              if (refreshJson.success && refreshJson.data) {
                const newAccess = refreshJson.data.accessToken;
                const newRefresh = refreshJson.data.refreshToken;
                const user = refreshJson.data.user;
                
                useAuthStore.getState().login(user, newAccess, newRefresh);
                isRefreshing = false;
                onRefreshed(newAccess);
              } else {
                throw new Error('Refresh failed');
              }
            } else {
              throw new Error('Refresh response not ok');
            }
          } catch {
            isRefreshing = false;
            useAuthStore.getState().logout();
            throw new ApiError(401, 'Session expired. Please log in again.');
          }
        }

        return new Promise<T>((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            const updatedHeaders = {
              ...headers,
              'Authorization': `Bearer ${newToken}`,
            };
            const updatedOptions = {
              ...fetchOptions,
              headers: updatedHeaders,
            };
            fetch(url, updatedOptions)
              .then((res) => {
                if (res.ok) return res.json();
                throw new ApiError(res.status, 'Session validation failed');
              })
              .then((json) => resolve(json as T))
              .catch((err) => reject(err));
          });
        });
      } else {
        useAuthStore.getState().logout();
        throw new ApiError(401, 'Session expired. Please log in again.');
      }
    }

    if (!response.ok) {
      let errMsg = 'Something went wrong';
      try {
        const errorJson = await response.json();
        errMsg = errorJson.message || errMsg;
      } catch {}
      throw new ApiError(response.status, errMsg);
    }

    const data = await response.json();
    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(500, err.message || 'Network error');
  }
}

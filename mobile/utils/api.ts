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

interface ApiOptions extends RequestInit {
  body?: any;
}

export async function apiFetch<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  
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
  
  try {
    const response = await fetch(url, config);
    const text = await response.text();
    
    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!response.ok) {
      const errorMsg = data.message || `API error: ${response.status}`;
      throw new Error(errorMsg);
    }

    // In TurfBook backend, responses are wrapped: { success: boolean, message: string, data: any }
    return data;
  } catch (error) {
    console.error(`❌ API call failed [${config.method || 'GET'} ${path}]:`, error);
    throw error;
  }
}

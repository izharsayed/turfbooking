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

const handleMockFetch = (path: string, options: ApiOptions): any => {
  const cleanPath = path.split('?')[0];
  const { user } = useAuthStore.getState();

  const mockUser = user || {
    id: 'dev-google-customer',
    email: 'google.mock@turfbook.com',
    name: 'Google Mock User',
    phone: '+919999988888',
    role: 'CUSTOMER',
  };

  if (cleanPath === '/profile') {
    const nameParts = mockUser.name.split(' ');
    return {
      success: true,
      data: {
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          phone: mockUser.phone || '+919999988888',
          role: mockUser.role,
          avatarUrl: mockUser.avatarUrl || null,
        },
        profile: {
          firstName: nameParts[0] || 'Google',
          lastName: nameParts.slice(1).join(' ') || 'Mock User',
        }
      }
    };
  }

  if (cleanPath === '/bookings') {
    return {
      success: true,
      data: [
        {
          id: 'mock-booking-1',
          turfId: 'mock-turf-1',
          date: new Date().toISOString().split('T')[0],
          timeSlot: '17:00 - 18:00',
          status: 'UPCOMING',
          totalPrice: 1200,
          turf: {
            name: 'Arena Turf Dome',
            location: 'Kothrud, Pune',
            images: ['https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=500'],
          }
        }
      ]
    };
  }

  if (cleanPath === '/turfs') {
    return {
      success: true,
      data: [
        {
          id: 'mock-turf-1',
          name: 'Arena Turf Dome',
          location: 'Kothrud, Pune',
          pricePerHour: 1200,
          images: ['https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=500'],
          rating: 4.8,
        }
      ]
    };
  }

  if (cleanPath.startsWith('/owner/')) {
    if (cleanPath === '/owner/profile') {
      return {
        success: true,
        data: {
          user: {
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            phone: mockUser.phone || '9999988888',
            role: 'TURF_OWNER',
          },
          ownerProfile: {
            businessName: mockUser.name || 'Ahmednagar Sports Arena',
          }
        }
      };
    }
    if (cleanPath === '/owner/dashboard') {
      return {
        success: true,
        data: {
          totalRevenue: 24000,
          totalBookings: 20,
          occupancyRate: 75,
        }
      };
    }
    if (cleanPath === '/owner/bookings') {
      return {
        success: true,
        data: []
      };
    }
    if (cleanPath === '/owner/bookings/offline') {
      return {
        success: true,
        message: 'Offline booking created successfully (Mock)',
        data: {
          id: `mock-offline-booking-${Date.now()}`,
          ...(options.body as any)
        }
      };
    }
    if (cleanPath === '/owner/turfs') {
      return {
        success: true,
        data: []
      };
    }
  }

  if (cleanPath.startsWith('/admin/')) {
    if (cleanPath === '/admin/dashboard') {
      return {
        success: true,
        data: {
          occupancy: 65,
          revenue: 150000,
          pendingOwners: 2,
          activeUsers: 120,
        }
      };
    }
    return {
      success: true,
      data: []
    };
  }

  return null;
};

export async function apiFetch<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, logout } = useAuthStore.getState();

  if (token === 'dev-token-bypass') {
    const mockRes = handleMockFetch(path, options);
    if (mockRes) {
      console.log(`🤖 [Mock API] Intercepted ${options.method || 'GET'} ${path}`);
      return mockRes as T;
    }
  }

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
      let errorMsg = data.message || `API error: ${response.status}`;
      if (data.errors && Array.isArray(data.errors)) {
        const details = data.errors.map((e: any) => `${e.path || e.field || 'field'}: ${e.message}`).join(', ');
        errorMsg += ` (${details})`;
      }
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
        console.warn(`❌ API call failed after retry [${options.method || 'GET'} ${path}]:`, retryErr);
        throw retryErr;
      }
    }
    if (error instanceof ApiError && error.statusCode === 401) {
      console.warn(`🔐 API call unauthorized [${options.method || 'GET'} ${path}]: ${error.message}`);
    } else {
      console.warn(`❌ API call failed [${options.method || 'GET'} ${path}]:`, error.message || error);
    }
    throw error;
  }
}

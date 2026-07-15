import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';
import { useBookingStore } from '../store/bookingStore';

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

  if (cleanPath === '/auth/register' && options.method === 'POST') {
    return {
      success: true,
      message: 'User registered successfully (Mock)',
      data: {
        user: {
          id: `mock-user-${Date.now()}`,
          email: (options.body as any)?.email || 'mock@turfbook.com',
          phone: (options.body as any)?.phone || '9999999999',
          role: 'CUSTOMER',
        }
      }
    };
  }

  if (cleanPath === '/auth/register-owner' && options.method === 'POST') {
    return {
      success: true,
      message: 'Owner registered successfully (Mock). Account is pending admin approval.',
      data: {
        user: {
          id: `mock-owner-${Date.now()}`,
          email: (options.body as any)?.email || 'owner@turfbook.com',
          phone: (options.body as any)?.phone || '9999999999',
          role: 'TURF_OWNER',
          isActive: false,
        }
      }
    };
  }

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
    if (options.method === 'POST') {
      return {
        success: true,
        data: {
          booking: {
            id: `B-MOCK-${Date.now()}`,
          },
          razorpayOrderId: `order_mock_${Date.now()}`,
        },
      };
    }
    
    const { bookings: storeBookings } = useBookingStore.getState();
    const mapped = storeBookings.map((b) => ({
      id: b.id,
      turfId: b.turfId,
      turfName: b.turfName,
      area: b.area,
      date: b.date,
      time: b.time,
      amount: b.amount,
      status: b.status === 'UPCOMING' ? 'active' : b.status === 'CANCELLED' ? 'cancelled' : 'completed',
    }));

    if (mapped.length === 0) {
      mapped.push({
        id: 'mock-booking-1',
        turfId: 'mock-turf-1',
        turfName: 'Arena Turf Dome',
        area: 'Kothrud, Pune',
        date: new Date().toISOString().split('T')[0],
        time: '17:00 - 18:00',
        amount: 1200,
        status: 'active',
      });
    }

    return {
      success: true,
      data: mapped,
    };
  }

  if (cleanPath === '/bookings/verify' && options.method === 'POST') {
    return {
      success: true,
      message: 'Payment verified successfully (Mock)',
    };
  }

  if (cleanPath === '/turfs') {
    // Return ALL local turfs so the explore screen has full data with slots
    const { turfs: localTurfs } = require('../data/turfs');
    return {
      success: true,
      data: localTurfs.map((t: any) => ({
        id: t.id,
        name: t.name,
        sport: t.sport,
        pricePerHour: t.price,
        area: t.area,
        location: { address: t.area },
        images: [t.image],
        rating: t.rating,
        description: t.description,
        amenities: t.amenities,
        slots: t.slots,
      }))
    };
  }

  if (cleanPath.startsWith('/turfs/')) {
    const turfId = cleanPath.split('/')[2];
    if (cleanPath.endsWith('/bookings')) {
      const { bookings: storeBookings } = useBookingStore.getState();
      const turfBookings = storeBookings.filter(b => b.turfId === turfId && b.status === 'UPCOMING');
      return {
        success: true,
        data: turfBookings.map(b => ({
          id: b.id,
          date: b.date,
          time: b.time,
        }))
      };
    }

    // Return matching turf from local data
    const { getTurfById } = require('../data/turfs');
    const localTurf = getTurfById(turfId);
    if (localTurf) {
      return {
        success: true,
        data: {
          id: localTurf.id,
          name: localTurf.name,
          sport: localTurf.sport,
          location: { address: localTurf.area, latitude: localTurf.latitude, longitude: localTurf.longitude },
          pricePerHour: localTurf.price,
          images: [localTurf.image],
          rating: localTurf.rating,
          description: localTurf.description,
          amenities: localTurf.amenities,
          slots: localTurf.slots,
        }
      };
    }

    return {
      success: true,
      data: {
        id: turfId,
        name: 'Unknown Turf',
        location: { address: 'Ahmednagar' },
        pricePerHour: 1200,
        images: [],
        rating: 4.5,
        description: '',
        amenities: [],
        slots: ['17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00', '20:00 - 21:00'],
      }
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
      const { bookings: storeBookings } = useBookingStore.getState();
      const mapped = storeBookings.map((b) => ({
        id: b.id,
        userId: 'dev-google-customer',
        turfId: b.turfId || 'mock-turf-1',
        turfName: b.turfName || 'Arena Turf Dome',
        customerName: 'Google Mock User',
        customerPhone: '+919999988888',
        date: b.date,
        time: b.time,
        amount: b.amount,
        status: b.status === 'UPCOMING' ? 'CONFIRMED' : b.status === 'CANCELLED' ? 'CANCELLED' : 'COMPLETED',
      }));

      // Add a fallback default mock booking if the store is empty
      if (mapped.length === 0) {
        mapped.push({
          id: 'mock-booking-1',
          userId: 'dev-google-customer',
          turfId: 'mock-turf-1',
          turfName: 'Arena Turf Dome',
          customerName: 'Google Mock User',
          customerPhone: '+919999988888',
          date: new Date().toISOString().split('T')[0],
          time: '17:00 - 18:00',
          amount: 1200,
          status: 'CONFIRMED',
        });
      }

      return {
        success: true,
        data: mapped,
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
        data: [
          {
            id: 'mock-turf-1',
            name: 'Arena Turf Dome',
            pricePerHour: 1200,
            sport: 'Football',
            isActive: true,
          }
        ]
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

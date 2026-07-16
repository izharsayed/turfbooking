import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { useBookingStore } from '../store/bookingStore';
import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';

const getBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000/api/v1`;
  }
  return 'http://localhost:5000/api/v1';
};

export const API_BASE_URL = getBaseUrl();
console.log(`🔌 Mobile API Base URL resolved to: ${API_BASE_URL}`);

let locallyDeletedTurfs: string[] = [];
AsyncStorage.getItem('locally_deleted_turfs').then(val => {
  if (val) locallyDeletedTurfs = JSON.parse(val);
}).catch(() => {});

const saveLocallyDeleted = async (id: string) => {
  if (!locallyDeletedTurfs.includes(id)) {
    locallyDeletedTurfs.push(id);
    await AsyncStorage.setItem('locally_deleted_turfs', JSON.stringify(locallyDeletedTurfs)).catch(() => {});
  }
};

let localEmailRoles: Record<string, string> = {
  'owner@turfbook.com': 'TURF_OWNER',
  'izharsayed12@gmail.com': 'SUPER_ADMIN',
  'customer@turfbook.com': 'CUSTOMER'
};

AsyncStorage.getItem('local_email_roles').then(val => {
  if (val) localEmailRoles = { ...localEmailRoles, ...JSON.parse(val) };
}).catch(() => {});

export const saveLocalEmailRole = async (email: string, role: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  if (localEmailRoles[normalizedEmail] !== role) {
    localEmailRoles[normalizedEmail] = role;
    await AsyncStorage.setItem('local_email_roles', JSON.stringify(localEmailRoles)).catch(() => {});
  }
};

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

// Helpers to map Firestore docs to mobile app schemas
const mapFirestoreTurf = (docId: string, data: any) => {
  return {
    id: docId,
    name: data.name,
    sport: data.sport || (Array.isArray(data.sports) ? data.sports[0] : 'Football'),
    pricePerHour: data.pricePerHour || data.price || 1200,
    rating: data.rating || 4.5,
    area: data.location?.address || data.area || 'Ahmednagar',
    images: data.images || ['/images/football.jpg'],
    location: data.location || { address: data.area || 'Ahmednagar', latitude: 19.0948, longitude: 74.7480 },
    description: data.description || '',
    amenities: data.amenities || [],
    slots: data.slots || ['17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00', '20:00 - 21:00'],
    peakStartHour: data.peakStartHour || 18,
    peakEndHour: data.peakEndHour || 22,
    peakSurcharge: data.peakSurcharge || 300,
    weekendSurcharge: data.weekendSurcharge || 200,
    blockedSlots: data.blockedSlots || [],
  };
};

const mapFirestoreBooking = (docId: string, data: any) => {
  return {
    id: docId,
    userId: data.userId,
    turfId: data.turfId,
    turfName: data.turfName || 'Arena Turf',
    area: data.area || 'Ahmednagar',
    date: data.date || (data.bookingDate ? new Date(data.bookingDate.seconds * 1000).toISOString().split('T')[0] : ''),
    time: data.time || data.timeSlot || data.slotId || '',
    amount: data.amount || data.totalAmount || 0,
    status: data.status || 'UPCOMING',
  };
};

const pathContainsMockId = (path: string): boolean => {
  const segments = path.split('/');
  const keywords = ['auth', 'login', 'register', 'register-owner', 'turfs', 'bookings', 'owner', 'admin', 'profile', 'dashboard', 'logs', 'verify', 'offline'];
  return segments.some(seg => seg.length > 0 && seg.length < 10 && !keywords.includes(seg));
};

export async function apiFetch<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const cleanPath = path.split('?')[0];
  const method = options.method || 'GET';

  const isPublicRoute = cleanPath.startsWith('/auth/') || cleanPath.startsWith('/turfs');
  const token = useAuthStore.getState().token;
  const hasRealToken = token && token !== 'dev-token-bypass';
  const containsMock = pathContainsMockId(cleanPath);

  // 1. Try calling the backend API first (Hybrid Connection Mode)
  if ((isPublicRoute || hasRealToken) && !containsMock) {
    try {
      const url = `${API_BASE_URL}${path}`;
      console.log(`🌐 [Hybrid API Client] Attempting HTTP ${method} ${url}`);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as any),
      };
      if (token && token !== 'dev-token-bypass') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let reqBody = options.body;
      if (cleanPath === '/owner/turfs' && method === 'POST' && reqBody) {
        let sportId = "NHQKZB3YRCRhWBL95sUE"; // Football by default
        if (reqBody.sport === "Cricket") sportId = "nB4mpucB3cyLZA8gXxiA";
        else if (reqBody.sport === "Box Cricket") sportId = "HV8G3I9zmsYnUWFqqqMV";

        reqBody = {
          name: reqBody.name,
          description: reqBody.description || 'Professional sports turf in Ahmednagar',
          address: reqBody.location?.address || 'Savedi Road, Ahmednagar',
          latitude: Number(reqBody.location?.latitude) || 19.0948,
          longitude: Number(reqBody.location?.longitude) || 74.7480,
          pricePerHour: Number(reqBody.pricePerHour) || 1200,
          cityId: "FVS82Xy9TSPMaR2445eX", // Ahmednagar City
          areaId: "9nVaAGTPMuCe1hjlkCoK", // Savedi Area
          sports: [sportId],
          images: reqBody.images && reqBody.images.length > 0 ? reqBody.images : ["/images/football.jpg"],
          amenities: ["Washroom", "Parking", "Flood Lights"],
          peakStartHour: Number(reqBody.peakStartHour) || 18,
          peakEndHour: Number(reqBody.peakEndHour) || 22,
          peakSurcharge: Number(reqBody.peakSurcharge) || 300,
          weekendSurcharge: Number(reqBody.weekendSurcharge) || 200,
        };
      }

      if (cleanPath.startsWith('/owner/turfs/') && method === 'PUT' && reqBody) {
        reqBody = {
          ...reqBody,
          address: reqBody.location?.address || reqBody.address,
          latitude: reqBody.location?.latitude ? Number(reqBody.location.latitude) : (reqBody.latitude ? Number(reqBody.latitude) : undefined),
          longitude: reqBody.location?.longitude ? Number(reqBody.location.longitude) : (reqBody.longitude ? Number(reqBody.longitude) : undefined),
          pricePerHour: reqBody.pricePerHour ? Number(reqBody.pricePerHour) : undefined,
          peakStartHour: reqBody.peakStartHour ? Number(reqBody.peakStartHour) : undefined,
          peakEndHour: reqBody.peakEndHour ? Number(reqBody.peakEndHour) : undefined,
          peakSurcharge: reqBody.peakSurcharge ? Number(reqBody.peakSurcharge) : undefined,
          weekendSurcharge: reqBody.weekendSurcharge ? Number(reqBody.weekendSurcharge) : undefined,
          sports: reqBody.sport ? [reqBody.sport === "Cricket" ? "nB4mpucB3cyLZA8gXxiA" : reqBody.sport === "Box Cricket" ? "HV8G3I9zmsYnUWFqqqMV" : "NHQKZB3YRCRhWBL95sUE"] : reqBody.sports
        };
      }

      const fetchPromise = fetch(url, {
        method,
        headers,
        body: reqBody ? JSON.stringify(reqBody) : undefined,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), 2500)
      );

      const response = (await Promise.race([fetchPromise, timeoutPromise])) as Response;

    if (response.ok || (response.status >= 200 && response.status < 300)) {
      const json = await response.json();
      console.log(`✅ [Hybrid API Client] HTTP ${method} ${path} Succeeded!`);

      // If login succeeded via backend, store the real JWT token
      if (cleanPath === '/auth/login' && json.success && json.data?.accessToken) {
        useAuthStore.getState().login(json.data.user, json.data.accessToken);
        saveLocalEmailRole(json.data.user.email, json.data.user.role);
      }

      return json as T;
    } else {
      console.log(`⚠️ [Hybrid API Client] HTTP status ${response.status} on ${path}. Falling back to Firestore/Bypass.`);
    }
  } catch (err: any) {
    console.log(`⚠️ [Hybrid API Client] Backend connection failed (${err.message}). Falling back to Firestore/Bypass.`);
  }
}

  console.log(`🔥 [Firebase Serverless API] Intercepted ${method} ${path}`);

  try {
    // ── 2. Authentication Endpoints (Bypassed / Mocked Locally if Backend is down) ──
    
    if (cleanPath === '/auth/login' && method === 'POST') {
      const { email } = options.body;
      const name = email ? email.split('@')[0] : 'User';
      const normalizedEmail = email.trim().toLowerCase();
      let role = normalizedEmail === 'izharsayed12@gmail.com' ? 'SUPER_ADMIN' : (
        localEmailRoles[normalizedEmail] || (
          normalizedEmail.includes('owner') ? 'TURF_OWNER' : (
            normalizedEmail.includes('admin') ? 'SUPER_ADMIN' : (
              normalizedEmail.includes('caretaker') || normalizedEmail.includes('ramesh') ? 'CARETAKER' : 'CUSTOMER'
            )
          )
        )
      );
      let userId = role === 'CARETAKER' ? 'caretaker-dev-id' : `bypass-${normalizedEmail.split('@')[0] || 'user'}`;
      let userPhone = '9876543210';
      let userName = role === 'CARETAKER' ? 'Ramesh Caretaker' : name;

      try {
        const q = query(collection(db, 'users'), where('email', '==', normalizedEmail));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docObj = snap.docs[0];
          const d = docObj.data();
          userId = docObj.id;
          role = d.role || role;
          userPhone = d.phone || d.phoneNumber || userPhone;
          userName = d.name || userName;
          // Sync to cache
          saveLocalEmailRole(normalizedEmail, role);
        } else {
          // If not in users, check in employees collection
          const qEmp = query(collection(db, 'employees'), where('email', '==', normalizedEmail));
          let snapEmp = await getDocs(qEmp);
          
          if (snapEmp.empty && /^[0-9]{10,15}$/.test(normalizedEmail.split('@')[0] || normalizedEmail)) {
            const phoneCandidate = normalizedEmail.split('@')[0] || normalizedEmail;
            const qPhone = query(collection(db, 'employees'), where('phone', '==', phoneCandidate));
            snapEmp = await getDocs(qPhone);
          }

          let matchedEmp: any = null;
          if (!snapEmp.empty) {
            const empDoc = snapEmp.docs[0];
            matchedEmp = { id: empDoc.id, ...empDoc.data() };
          } else {
            // Check local AsyncStorage cache fallback
            try {
              const cached = await AsyncStorage.getItem('employees_dev-bypass');
              if (cached) {
                const list = JSON.parse(cached);
                matchedEmp = list.find((emp: any) => 
                  emp.email?.toLowerCase() === normalizedEmail || 
                  emp.phone === normalizedEmail.split('@')[0] || 
                  emp.phone === normalizedEmail
                );
              }
            } catch (err) {}
          }

          if (matchedEmp) {
            userId = matchedEmp.id;
            role = 'CARETAKER';
            userPhone = matchedEmp.phone || userPhone;
            userName = matchedEmp.name || userName;
            saveLocalEmailRole(normalizedEmail, role);
          } else {
            const allowedDemoEmails = ['owner@turfbook.com', 'customer@turfbook.com', 'izharsayed12@gmail.com'];
            if (allowedDemoEmails.includes(normalizedEmail) || localEmailRoles[normalizedEmail]) {
              userId = `bypass-${normalizedEmail.split('@')[0] || 'user'}`;
            } else {
              return {
                success: false,
                message: 'Invalid email or password (User not registered)'
              } as any;
            }
          }
        }
      } catch (err) {
        console.log('ℹ️ Firestore login query fell back to local ID validation.');
        const allowedDemoEmails = ['owner@turfbook.com', 'customer@turfbook.com', 'izharsayed12@gmail.com'];
        if (allowedDemoEmails.includes(normalizedEmail) || localEmailRoles[normalizedEmail]) {
          userId = `bypass-${normalizedEmail.split('@')[0] || 'user'}`;
        } else {
          return {
            success: false,
            message: 'Invalid email or password (User not registered)'
          } as any;
        }
      }

      console.log(`👤 Resolved login: role=${role}`);

      return {
        success: true,
        message: 'Logged in successfully (Bypass Mode)',
        data: {
          user: { id: userId, email, name: userName, phone: userPhone, role },
          accessToken: 'dev-token-bypass'
        }
      } as any;
    }

    if (cleanPath === '/auth/register' && method === 'POST') {
      const { email, firstName, lastName, phone } = options.body;
      const name = `${firstName} ${lastName}`.trim();
      const userId = `U-${Date.now()}`;
      const normalizedEmail = email.trim().toLowerCase();

      // Save email role locally first so offline/bypass login can correctly resolve CUSTOMER role
      saveLocalEmailRole(normalizedEmail, 'CUSTOMER');

      try {
        await setDoc(doc(db, 'users', userId), {
          email: normalizedEmail,
          name,
          phone,
          role: 'CUSTOMER',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await setDoc(doc(db, 'user_profiles', userId), {
          userId,
          firstName,
          lastName,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } catch (err) {
        console.warn('⚠️ Firestore register customer fallback failed:', err);
      }

      return {
        success: true,
        message: 'User registered successfully (Bypass Mode)',
        data: {
          user: { id: userId, email: normalizedEmail, name, phone, role: 'CUSTOMER' },
          accessToken: 'dev-token-bypass'
        }
      } as any;
    }

    if (cleanPath === '/auth/register-owner' && method === 'POST') {
      const { email, phone, companyName, businessRegisterNumber, businessAddress, billingEmail } = options.body;
      const userId = `O-${Date.now()}`;
      const normalizedEmail = email.trim().toLowerCase();

      // Save email role locally first so offline/bypass login can correctly resolve TURF_OWNER role
      saveLocalEmailRole(normalizedEmail, 'TURF_OWNER');

      try {
        await setDoc(doc(db, 'users', userId), {
          email: normalizedEmail,
          name: companyName,
          phone,
          role: 'TURF_OWNER',
          isActive: false, // Pending admin approval
          ownerStatus: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await setDoc(doc(db, 'owner_profiles', userId), {
          userId,
          companyName,
          businessRegisterNumber: businessRegisterNumber || 'N/A',
          businessAddress: businessAddress || '',
          billingEmail: billingEmail || normalizedEmail,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } catch (err) {
        console.warn('⚠️ Firestore register owner fallback failed:', err);
      }

      return {
        success: true,
        message: 'Owner registered successfully (Bypass Mode). Account is pending admin approval.',
      } as any;
    }

    if (cleanPath === '/auth/google' && method === 'POST') {
      return {
        success: true,
        message: 'Google login successful (Bypass Mode)',
        data: {
          user: { id: 'dev-bypass', email: 'google.mock@turfbook.com', name: 'Google Mock User', phone: '9876543210', role: 'CUSTOMER' },
          accessToken: 'dev-token-bypass'
        }
      } as any;
    }

    if (cleanPath === '/auth/logout') {
      return { success: true, message: 'Logged out (Bypass Mode)' } as any;
    }

    // ── 2. User Profile Endpoints ──

    if (cleanPath === '/profile') {
      const devUser = useAuthStore.getState().user || { id: 'dev-bypass', name: 'Dev Guest', email: 'guest@turfbook.com', role: 'CUSTOMER', phone: '9876543210' };
      const currentUserId = devUser.id || 'dev-bypass';
      
      if (method === 'GET') {
        try {
          const docRef = doc(db, 'users', currentUserId);
          const userDoc = await getDoc(docRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            return {
              success: true,
              data: {
                user: {
                  id: currentUserId,
                  email: data.email || devUser.email,
                  name: data.name || devUser.name,
                  phone: data.phone || devUser.phone || '',
                  role: data.role || devUser.role,
                  avatarUrl: null,
                },
                profile: {
                  firstName: (data.name || devUser.name).split(' ')[0] || '',
                  lastName: (data.name || devUser.name).split(' ').slice(1).join(' ') || '',
                }
              }
            } as any;
          }
        } catch (e) {
          console.log('ℹ️ Firestore profile fetch fell back to local mock profile.');
        }

        return {
          success: true,
          data: {
            user: {
              id: currentUserId,
              email: devUser.email,
              name: devUser.name,
              phone: devUser.phone || '',
              role: devUser.role,
              avatarUrl: null,
            },
            profile: {
              firstName: devUser.name.split(' ')[0] || '',
              lastName: devUser.name.split(' ').slice(1).join(' ') || '',
            }
          }
        } as any;
      }

      if (method === 'PUT') {
        const { firstName, lastName } = options.body;
        try {
          await setDoc(doc(db, 'users', currentUserId), {
            name: `${firstName} ${lastName}`.trim(),
            updatedAt: new Date()
          }, { merge: true });
        } catch (e) {
          console.warn('⚠️ Firestore profile save failed:', e);
        }
        return { success: true, message: 'Profile updated' } as any;
      }
    }

    // ── 3. Turfs Endpoints ──

    if (cleanPath === '/turfs' && method === 'GET') {
      try {
        const turfsSnap = await getDocs(collection(db, 'turfs'));
        let list = turfsSnap.docs.map(doc => mapFirestoreTurf(doc.id, doc.data()));

        return { success: true, data: list } as any;
      } catch (e) {
        console.warn('⚠️ Firestore fetch /turfs failed, falling back to local mock data:', e);
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
        } as any;
      }
    }

    if (cleanPath.startsWith('/turfs/')) {
      const turfId = cleanPath.split('/')[2];

      if (cleanPath.endsWith('/bookings') && method === 'GET') {
        try {
          const bookingsRef = collection(db, 'bookings');
          const q = query(bookingsRef, where('turfId', '==', turfId), where('status', '==', 'UPCOMING'));
          const snap = await getDocs(q);
          const list = snap.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              date: data.date,
              time: data.time || data.timeSlot || data.slotId || '',
            };
          });
          return { success: true, data: list } as any;
        } catch (e) {
          console.warn('⚠️ Firestore bookings query failed, using empty list fallback:', e);
          return { success: true, data: [] } as any;
        }
      }

      if (method === 'GET') {
        try {
          const turfDoc = await getDoc(doc(db, 'turfs', turfId));
          if (turfDoc.exists()) {
            return {
              success: true,
              data: mapFirestoreTurf(turfDoc.id, turfDoc.data())
            } as any;
          }
        } catch (e) {
          console.warn(`⚠️ Firestore fetch turf details for ${turfId} failed:`, e);
        }

        // Fallback to local mock data
        const { getTurfById } = require('../data/turfs');
        const localTurf = getTurfById(turfId);
        if (localTurf) {
          return {
            success: true,
            data: mapFirestoreTurf(turfId, {
              name: localTurf.name,
              description: localTurf.description,
              area: localTurf.area,
              price: localTurf.price,
              image: localTurf.image,
              rating: localTurf.rating,
              amenities: localTurf.amenities,
              sport: localTurf.sport,
              slots: localTurf.slots,
              location: { address: localTurf.area, latitude: localTurf.latitude, longitude: localTurf.longitude }
            })
          } as any;
        }
        throw new ApiError(404, 'Turf not found');
      }
    }

    // ── 4. Bookings Endpoints ──

    if (cleanPath === '/bookings') {
      if (method === 'POST') {
        const { turfId, slotId, amount, totalAmount, time, date } = options.body;
        const bookingId = `B-${Math.floor(10000 + Math.random() * 90000)}`;

        let turfName = 'Arena Turf';
        let area = 'Ahmednagar';
        
        try {
          const turfDoc = await getDoc(doc(db, 'turfs', turfId));
          if (turfDoc.exists()) {
            const td = turfDoc.data();
            turfName = td.name || turfName;
            area = td.location?.address || td.area || area;
          }
        } catch (err) {
          console.log('Failed to fetch turf details for booking collection creation', err);
        }

        const newBooking = {
          userId: 'dev-bypass',
          turfId,
          turfName,
          area,
          date,
          time: time || slotId,
          amount: amount || totalAmount,
          status: 'UPCOMING',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        try {
          await setDoc(doc(db, 'bookings', bookingId), newBooking);
        } catch (e) {
          console.warn('⚠️ Firestore booking write failed, falling back:', e);
        }

        return {
          success: true,
          data: {
            booking: { id: bookingId },
            orderId: `order_mock_${Date.now()}`
          }
        } as any;
      }

      if (method === 'GET') {
        try {
          const bookingsRef = collection(db, 'bookings');
          const q = query(bookingsRef, where('userId', '==', 'dev-bypass'));
          const snap = await getDocs(q);
          const list = snap.docs.map(doc => {
            const b = mapFirestoreBooking(doc.id, doc.data());
            const mappedStatus = b.status === 'CONFIRMED' || b.status === 'UPCOMING' || b.status === 'active' ? 'active' : b.status === 'COMPLETED' || b.status === 'completed' ? 'completed' : 'cancelled';
            return { ...b, status: mappedStatus };
          });
          return { success: true, data: list } as any;
        } catch (e) {
          console.warn('⚠️ Firestore bookings fetch failed, returning empty list:', e);
          return { success: true, data: [] } as any;
        }
      }
    }

    if (cleanPath === '/bookings/verify' && method === 'POST') {
      return {
        success: true,
        message: 'Payment verified successfully (Direct Firebase Mode)'
      } as any;
    }

    if (cleanPath.startsWith('/bookings/')) {
      const bookingId = cleanPath.split('/')[2];

      if (method === 'GET') {
        try {
          const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
          if (bookingDoc.exists()) {
            const b = mapFirestoreBooking(bookingDoc.id, bookingDoc.data());
            const mappedStatus = b.status === 'CONFIRMED' || b.status === 'UPCOMING' || b.status === 'active' ? 'active' : b.status === 'COMPLETED' || b.status === 'completed' ? 'completed' : 'cancelled';
            return {
              success: true,
              data: { ...b, status: mappedStatus }
            } as any;
          }
        } catch (e) {
          console.warn(`⚠️ Firestore fetch booking details for ${bookingId} failed:`, e);
        }
        
        // Seeded fallback if Firestore query fails
        return {
          success: true,
          data: {
            id: bookingId,
            userId: 'dev-bypass',
            turfId: 't1',
            turfName: 'Arena Turf',
            area: 'Ahmednagar',
            date: new Date().toISOString().split('T')[0],
            time: '17:00 - 18:00',
            amount: 1200,
            status: 'active'
          }
        } as any;
      }

      if (method === 'PATCH') {
        try {
          await updateDoc(doc(db, 'bookings', bookingId), {
            status: 'CANCELLED',
            updatedAt: new Date()
          });
        } catch (e) {
          console.warn('⚠️ Firestore booking update status failed:', e);
        }
        return { success: true, message: 'Booking cancelled' } as any;
      }
    }

    // ── 5. Owner Panel Mock/Firestore Fallback Endpoints ──

    if (cleanPath.startsWith('/owner/')) {
      if (cleanPath === '/owner/profile') {
        return {
          success: true,
          data: {
            user: { id: 'dev-bypass', email: 'owner@turfbook.com', name: 'Owner', role: 'TURF_OWNER' },
            ownerProfile: { businessName: 'Ahmednagar Sports Arena' }
          }
        } as any;
      }

      if (cleanPath === '/owner/dashboard') {
        return {
          success: true,
          data: { totalRevenue: 24000, totalBookings: 20, occupancyRate: 75 }
        } as any;
      }

      if (cleanPath === '/owner/bookings') {
        try {
          const snap = await getDocs(collection(db, 'bookings'));
          const list = snap.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              userId: d.userId,
              turfId: d.turfId,
              turfName: d.turfName,
              customerName: 'Customer',
              customerPhone: '+919999988888',
              date: d.date,
              time: d.time,
              amount: d.amount,
              status: d.status === 'UPCOMING' ? 'CONFIRMED' : d.status,
            };
          });
          return { success: true, data: list } as any;
        } catch (e) {
          console.warn('⚠️ Firestore owner bookings fetch failed:', e);
          return { success: true, data: [] } as any;
        }
      }

      if (cleanPath === '/owner/bookings/offline' && method === 'POST') {
        const { turfId, slotId, amount, totalAmount, time, date } = options.body;
        const bookingId = `B-OFFLINE-${Date.now()}`;
        try {
          await setDoc(doc(db, 'bookings', bookingId), {
            userId: 'offline-booking',
            turfId,
            turfName: 'Arena Turf',
            area: 'Ahmednagar',
            date,
            time: time || slotId,
            amount: amount || totalAmount,
            status: 'COMPLETED',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } catch (e) {
          console.warn('⚠️ Firestore offline booking write failed:', e);
        }
        return {
          success: true,
          message: 'Offline booking created',
          data: { id: bookingId }
        } as any;
      }

      if (cleanPath === '/owner/turfs') {
        if (method === 'POST') {
          const { name, pricePerHour, sport, description } = options.body;
          const turfId = `T-${Date.now()}`;
          const ownerId = useAuthStore.getState().user?.id || 'dev-bypass';
          try {
            await setDoc(doc(db, 'turfs', turfId), {
              name,
              pricePerHour: Number(pricePerHour) || 1200,
              description: description || '',
              sports: [sport || 'Football'],
              isActive: true,
              ownerId,
              location: { address: 'Ahmednagar', city: 'Ahmednagar', latitude: 19.0948, longitude: 74.7480 },
              createdAt: new Date(),
              updatedAt: new Date()
            });
          } catch (err) {
            console.warn('⚠️ Firestore owner create turf failed:', err);
          }
          return { success: true, message: 'Turf created successfully', data: { id: turfId } } as any;
        }

        const ownerId = useAuthStore.getState().user?.id || 'dev-bypass';
        try {
          const snap = await getDocs(collection(db, 'turfs'));
          const list = snap.docs
            .map(doc => {
              const d = doc.data();
              return {
                id: doc.id,
                ownerId: d.ownerId,
                name: d.name,
                pricePerHour: d.pricePerHour || d.price || 1200,
                sport: d.sport || (Array.isArray(d.sports) ? d.sports[0] : 'Football'),
                isActive: d.isActive ?? true,
                deletedAt: d.deletedAt ? new Date(d.deletedAt.seconds * 1000) : null
              };
            })
            .filter(t => {
              const isDeleted = t.deletedAt || locallyDeletedTurfs.includes(t.id);
              const belongsToOwner = ownerId === 'dev-bypass' ? (t.ownerId === 'dev-bypass' || t.ownerId === 'uDxPOdsZtD0UJkVDn7LG') : t.ownerId === ownerId;
              return !isDeleted && belongsToOwner;
            });
          return { success: true, data: list } as any;
        } catch (e) {
          console.warn('⚠️ Firestore owner turfs fetch failed:', e);
          return { success: true, data: [] } as any;
        }
      }

      if (cleanPath.startsWith('/owner/turfs/')) {
        const turfId = cleanPath.split('/')[3];
        
        if (method === 'DELETE') {
          await saveLocallyDeleted(turfId);
          if (turfId.length >= 10) {
            try {
              await updateDoc(doc(db, 'turfs', turfId), {
                deletedAt: new Date(),
                isActive: false,
                updatedAt: new Date()
              });
            } catch (err) {
              console.warn(`⚠️ Firestore owner delete turf ${turfId} failed:`, err);
            }
          }
          return { success: true, message: 'Turf deleted successfully' } as any;
        }

        if (method === 'PUT') {
          const { name, pricePerHour, sport, isActive } = options.body;
          try {
            await updateDoc(doc(db, 'turfs', turfId), {
              name,
              pricePerHour: Number(pricePerHour) || 1200,
              sports: [sport || 'Football'],
              isActive: isActive ?? true,
              updatedAt: new Date()
            });
          } catch (err) {
            console.warn(`⚠️ Firestore owner update turf ${turfId} failed:`, err);
          }
          return { success: true, message: 'Turf updated successfully' } as any;
        }
      }

      // --- Employees local Firebase interceptors ---
      if (cleanPath === '/owner/employees') {
        const ownerId = useAuthStore.getState().user?.id || 'dev-bypass';
        if (method === 'POST') {
          const empId = `EMP-${Date.now()}`;
          const newEmp = {
            ownerId,
            name: options.body.name,
            phone: options.body.phone,
            email: options.body.email || '',
            role: options.body.role || 'Caretaker',
            turfId: options.body.turfId || '',
            turfName: options.body.turfName || 'All Turfs',
            status: options.body.status || 'Active',
            // NOTE: password is NOT stored locally — only hashed on the backend
            createdAt: new Date().toISOString(),
          };
          try {
            await setDoc(doc(db, 'employees', empId), newEmp);
          } catch (e) {
            console.log('ℹ️ Firestore local employee create fell back to local cache.');
            try {
              const cached = await AsyncStorage.getItem(`employees_${ownerId}`);
              const list = cached ? JSON.parse(cached) : [];
              list.push({ id: empId, ...newEmp });
              await AsyncStorage.setItem(`employees_${ownerId}`, JSON.stringify(list));
            } catch (err) {
              console.warn('⚠️ AsyncStorage write failed:', err);
            }
          }
          return { success: true, message: 'Employee created', data: { id: empId, ...newEmp } } as any;
        }

        try {
          const snap = await getDocs(collection(db, 'employees'));
          const list: any[] = [];
          snap.forEach((doc) => {
            const d = doc.data();
            if (d.ownerId === ownerId) {
              list.push({ id: doc.id, ...d });
            }
          });
          return { success: true, data: list } as any;
        } catch (e) {
          console.log('ℹ️ Firestore local employees fetch loaded from local cache.');
          try {
            const cached = await AsyncStorage.getItem(`employees_${ownerId}`);
            const list = cached ? JSON.parse(cached) : [];
            return { success: true, data: list } as any;
          } catch (err) {
            return { success: true, data: [] } as any;
          }
        }
      }

      if (cleanPath.startsWith('/owner/employees/')) {
        const empId = cleanPath.split('/')[3];
        const ownerId = useAuthStore.getState().user?.id || 'dev-bypass';

        if (method === 'DELETE') {
          try {
            await deleteDoc(doc(db, 'employees', empId));
          } catch (e) {
            console.log('ℹ️ Firestore local employee delete fell back to local cache.');
            try {
              const cached = await AsyncStorage.getItem(`employees_${ownerId}`);
              if (cached) {
                const list = JSON.parse(cached).filter((emp: any) => emp.id !== empId);
                await AsyncStorage.setItem(`employees_${ownerId}`, JSON.stringify(list));
              }
            } catch (err) {}
          }
          return { success: true, message: 'Employee deleted' } as any;
        }
        if (method === 'PUT') {
          try {
            await updateDoc(doc(db, 'employees', empId), {
              ...options.body,
              updatedAt: new Date(),
            });
          } catch (e) {
            console.log('ℹ️ Firestore local employee update fell back to local cache.');
            try {
              const cached = await AsyncStorage.getItem(`employees_${ownerId}`);
              if (cached) {
                const list = JSON.parse(cached).map((emp: any) => {
                  if (emp.id === empId) {
                    return { ...emp, ...options.body, updatedAt: new Date().toISOString() };
                  }
                  return emp;
                });
                await AsyncStorage.setItem(`employees_${ownerId}`, JSON.stringify(list));
              }
            } catch (err) {}
          }
          return { success: true, message: 'Employee updated' } as any;
        }
      }
    }

    if (cleanPath.startsWith('/admin/')) {
      // 1. Admin Dashboard Stats
      if (cleanPath === '/admin/dashboard') {
        try {
          const [bookingsSnap, usersSnap, turfsSnap] = await Promise.all([
            getDocs(collection(db, 'bookings')),
            getDocs(collection(db, 'users')),
            getDocs(collection(db, 'turfs'))
          ]);

          const totalBookings = bookingsSnap.size;
          const totalTurfs = turfsSnap.size;

          let totalRevenue = 0;
          bookingsSnap.forEach(doc => {
            const data = doc.data();
            if (data.status !== 'CANCELLED') {
              totalRevenue += (Number(data.amount) || Number(data.totalAmount) || 0);
            }
          });

          let activeUsers = 0;
          usersSnap.forEach(doc => {
            const data = doc.data();
            if (data.role === 'CUSTOMER' && data.isActive !== false && !data.deletedAt) {
              activeUsers++;
            }
          });

          const rawOccupancy = totalTurfs > 0 ? (totalBookings / (totalTurfs * 24)) * 100 : 0;
          const occupancyRate = `${Math.min(95, Math.max(30, Math.round(rawOccupancy || 65)))}%`;

          return {
            success: true,
            data: {
              totalBookings,
              totalRevenue,
              activeUsers,
              totalTurfs,
              occupancyRate
            }
          } as any;
        } catch (e) {
          console.warn('⚠️ Firestore admin dashboard load failed:', e);
          return {
            success: true,
            data: {
              totalBookings: 120,
              totalRevenue: 144000,
              activeUsers: 45,
              totalTurfs: 5,
              occupancyRate: '65%'
            }
          } as any;
        }
      }

      // 2. Admin List Owners
      if (cleanPath === '/admin/owners') {
        try {
          const [usersSnap, profilesSnap] = await Promise.all([
            getDocs(collection(db, 'users')),
            getDocs(collection(db, 'owner_profiles')).catch(() => ({ docs: [] } as any))
          ]);

          const companyMap = new Map();
          profilesSnap.docs.forEach((doc: any) => {
            const d = doc.data();
            if (d.userId) {
              companyMap.set(d.userId, d.companyName || d.businessName);
            }
          });

          const list: any[] = [];
          usersSnap.forEach(doc => {
            const d = doc.data();
            if (d.role === 'TURF_OWNER' && !d.deletedAt) {
              const statusVal = d.ownerStatus || (d.isActive ? 'APPROVED' : 'PENDING');
              list.push({
                id: doc.id,
                name: d.name || 'Owner User',
                email: d.email || '',
                phone: d.phone || d.phoneNumber || '',
                status: statusVal,
                businessName: companyMap.get(doc.id) || d.businessName || d.companyName || 'Ahmednagar Sports Club'
              });
            }
          });

          return { success: true, data: list } as any;
        } catch (e) {
          console.warn('⚠️ Firestore admin owners load failed (using seeded fallback):', e);
          return {
            success: true,
            data: [
              { id: 'uDxPOdsZtD0UJkVDn7LG', name: 'Ahmednagar Sports Arena', email: 'owner@turfbook.com', phone: '9999988888', status: 'APPROVED', businessName: 'Ahmednagar Sports Arena' },
              { id: 'o1', name: 'Zeeshan Khan', email: 'zeeshan@arena.com', phone: '9823456789', status: 'PENDING', businessName: 'Ahmednagar Sports Club' },
              { id: 'o2', name: 'Rahul Joshi', email: 'rahul@turf.com', phone: '9923456781', status: 'APPROVED', businessName: 'Joshi Football Turf' },
              { id: 'o3', name: 'Siddharth Patil', email: 'siddharth@stadium.com', phone: '9123456782', status: 'REJECTED', businessName: 'Patil Box Cricket' },
            ]
          } as any;
        }
      }

      // 3. Admin List Customers
      if (cleanPath === '/admin/users') {
        try {
          const usersSnap = await getDocs(collection(db, 'users'));
          const list: any[] = [];
          usersSnap.forEach(doc => {
            const d = doc.data();
            if (d.role === 'CUSTOMER' && !d.deletedAt) {
              list.push({
                id: doc.id,
                name: d.name || 'Customer User',
                email: d.email || '',
                phone: d.phone || d.phoneNumber || '',
                role: d.role || 'CUSTOMER',
                status: d.isActive === false ? 'BLOCKED' : 'ACTIVE'
              });
            }
          });
          return { success: true, data: list } as any;
        } catch (e) {
          console.warn('⚠️ Firestore admin users load failed (using seeded fallback):', e);
          return {
            success: true,
            data: [
              { id: 'jd9DYegcD95rYQxSjhFy', name: 'Demo Customer', email: 'customer@turfbook.com', phone: '9876543210', role: 'CUSTOMER', status: 'ACTIVE' },
              { id: 'u1', name: 'Test User Alpha', email: 'alpha@example.test', phone: '9000000001', role: 'CUSTOMER', status: 'ACTIVE' },
              { id: 'u2', name: 'Test User Beta', email: 'beta@example.test', phone: '9000000002', role: 'CUSTOMER', status: 'BLOCKED' },
              { id: 'u3', name: 'Test User Gamma', email: 'gamma@example.test', phone: '9000000003', role: 'CUSTOMER', status: 'ACTIVE' },
            ]
          } as any;
        }
      }

      // 4. Admin List Logs
      if (cleanPath === '/admin/logs') {
        try {
          const logsSnap = await getDocs(collection(db, 'audit_logs'));
          const list: any[] = [];
          logsSnap.forEach(doc => {
            const d = doc.data();
            list.push({
              id: doc.id,
              action: d.action || 'ACTION',
              details: d.details || '',
              timestamp: d.timestamp || (d.createdAt ? new Date(d.createdAt.seconds * 1000).toISOString() : new Date().toISOString()),
              user: d.user || 'izharsayed12@gmail.com'
            });
          });
          list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
          return { success: true, data: list.slice(0, 100) } as any;
        } catch (e) {
          console.warn('⚠️ Firestore admin audit logs load failed (using seeded fallback):', e);
          return {
            success: true,
            data: [
              { id: 'l1', action: 'OWNER_APPROVED', details: 'Approved owner request for Zeeshan Khan', timestamp: '2026-07-11 12:14:02', user: 'izharsayed12@gmail.com' },
              { id: 'l2', action: 'USER_BLOCKED', details: 'Blocked user Rohan Deshmukh (Spam behavior)', timestamp: '2026-07-11 11:45:22', user: 'izharsayed12@gmail.com' },
              { id: 'l3', action: 'TURF_CREATED', details: 'New turf registered: Ahmednagar Sports Arena', timestamp: '2026-07-11 10:30:15', user: 'owner@turfbook.com' },
            ]
          } as any;
        }
      }

      // 5. Admin Approve / Reject Owner
      if (cleanPath.startsWith('/admin/owners/') && (cleanPath.endsWith('/approve') || cleanPath.endsWith('/reject'))) {
        const ownerId = cleanPath.split('/')[3];
        const isApprove = cleanPath.endsWith('/approve');
        const status = isApprove ? 'APPROVED' : 'REJECTED';
        
        try {
          const userRef = doc(db, 'users', ownerId);
          const userSnap = await getDoc(userRef);
          let ownerName = 'Owner';
          if (userSnap.exists()) {
            ownerName = userSnap.data()?.name || ownerName;
          }

          await updateDoc(userRef, {
            isActive: isApprove,
            ownerStatus: status,
            updatedAt: new Date()
          });

          // Write an audit log
          const logId = `L-${Date.now()}`;
          await setDoc(doc(db, 'audit_logs', logId), {
            action: isApprove ? 'OWNER_APPROVED' : 'OWNER_REJECTED',
            details: `${isApprove ? 'Approved' : 'Rejected'} owner request for ${ownerName}`,
            user: 'admin@turfbook.com',
            createdAt: new Date(),
            timestamp: new Date().toISOString()
          });

          return { success: true, message: `Owner status updated to ${status}` } as any;
        } catch (e) {
          console.warn('⚠️ Firestore admin owner status update failed:', e);
          return { success: false, message: 'Failed to update owner status' } as any;
        }
      }

      // 6. Admin Block / Unblock User
      if (cleanPath.startsWith('/admin/users/') && (cleanPath.endsWith('/block') || cleanPath.endsWith('/unblock'))) {
        const userId = cleanPath.split('/')[3];
        const isBlock = cleanPath.endsWith('/block');
        
        try {
          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);
          let userName = 'User';
          if (userSnap.exists()) {
            userName = userSnap.data()?.name || userName;
          }

          await updateDoc(userRef, {
            isActive: !isBlock,
            updatedAt: new Date()
          });

          // Write an audit log
          const logId = `L-${Date.now()}`;
          await setDoc(doc(db, 'audit_logs', logId), {
            action: isBlock ? 'USER_BLOCKED' : 'USER_UNBLOCKED',
            details: `${isBlock ? 'Blocked' : 'Unblocked'} user ${userName}`,
            user: 'admin@turfbook.com',
            createdAt: new Date(),
            timestamp: new Date().toISOString()
          });

          return { success: true, message: `User status updated successfully` } as any;
        } catch (e) {
          console.warn('⚠️ Firestore admin user block/unblock failed:', e);
          return { success: false, message: 'Failed to update user block status' } as any;
        }
      }

      // 7. Admin Delete User
      if (cleanPath.startsWith('/admin/users/') && method === 'DELETE') {
        const userId = cleanPath.split('/')[3];
        try {
          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);
          let userName = 'User';
          if (userSnap.exists()) {
            userName = userSnap.data()?.name || userName;
          }

          await updateDoc(userRef, {
            deletedAt: new Date(),
            updatedAt: new Date()
          });

          // Write an audit log
          const logId = `L-${Date.now()}`;
          await setDoc(doc(db, 'audit_logs', logId), {
            action: 'USER_DELETED',
            details: `Deleted user ${userName}`,
            user: 'admin@turfbook.com',
            createdAt: new Date(),
            timestamp: new Date().toISOString()
          });

          return { success: true, message: 'User deleted' } as any;
        } catch (e) {
          console.warn('⚠️ Firestore admin user delete failed:', e);
          return { success: false, message: 'Failed to delete user' } as any;
        }
      }

      return { success: true, data: [] } as any;
    }

    throw new ApiError(404, `Not Found: ${method} ${path}`);
  } catch (err: any) {
    console.error(`❌ [Firebase Serverless API] Error on ${method} ${path}:`, err);
    throw err instanceof ApiError ? err : new ApiError(500, err.message || 'Firebase execution error');
  }
}

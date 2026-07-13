import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import NearbyMap from './NearbyMap';
import api from '../../services/api';

// Inlined from @turf-booking/ui
function Button({ children, onClick, className = '', variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) {
  const baseStyle = "transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-center flex items-center justify-center";
  const variants: Record<string, string> = {
    primary: "bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl px-6 py-3",
    secondary: "bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl px-6 py-3",
    outline: "border border-slate-300 hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:hover:bg-slate-900/60 dark:text-slate-300 rounded-xl px-6 py-3",
  };
  return (
    <button
      onClick={onClick}
      className={`${baseStyle} ${variants[variant] ?? variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Inlined from @turf-booking/utils
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  LogOut,
  Moon,
  Sun,
  CheckCircle,
  Trophy,
  Shield,
  Zap,
  Sparkles,
  HelpCircle,
  MessageSquare,
  X,
  Smartphone,
  Landmark,
  CreditCard,
  ShieldAlert,
  Wallet,
  Star,
  Flame,
  Loader2
} from 'lucide-react';

interface Turf {
  id: string;
  name: string;
  description: string;
  city: string;
  area: string;
  price: number;
  sport: string;
  rating: number;
  image: string;
  amenities: string[];
  lat: number;
  lng: number;
}

const sampleTurfs: Turf[] = [
  {
    id: '1',
    name: 'Old Trafford Arena',
    description: 'Premier indoor turf with professional lighting, FIFA-grade grass pitch, and standard changing rooms.',
    city: 'Ahmednagar',
    area: 'Savedi',
    price: 1200,
    sport: 'Football',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&auto=format&fit=crop&q=60',
    amenities: ['Washroom', 'Parking', 'Flood Lights', 'Changing Room'],
    lat: 19.1158,
    lng: 74.7420
  },
  {
    id: '2',
    name: 'Lords Cricket Club',
    description: 'Elite net facility equipped with bowling machine, turf pitch, and expert coach analysis.',
    city: 'Ahmednagar',
    area: 'Pipeline Road',
    price: 1500,
    sport: 'Cricket',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1607734834519-d8576ae60ea6?w=600&auto=format&fit=crop&q=60',
    amenities: ['Drinking Water', 'Equipment Rental', 'Locker'],
    lat: 19.1035,
    lng: 74.7562
  },
  {
    id: '3',
    name: 'Wembley Futsal Dome',
    description: 'Indoor box cricket and football field with state-of-the-art turf structure.',
    city: 'Ahmednagar',
    area: 'Kedgaon',
    price: 1000,
    sport: 'Box Cricket',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1531415080290-bc98513989fe?w=600&auto=format&fit=crop&q=60',
    amenities: ['Washroom', 'WiFi', 'Parking'],
    lat: 19.0745,
    lng: 74.7335
  },
  {
    id: '4',
    name: 'Camp Nou Arena',
    description: 'Elite turf with professional coaching, premium synthetic grass, and fully featured changing zones.',
    city: 'Ahmednagar',
    area: 'Gulmohar Road',
    price: 1800,
    sport: 'Football',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&auto=format&fit=crop&q=60',
    amenities: ['Washroom', 'Parking', 'Flood Lights', 'Locker Room'],
    lat: 19.1235,
    lng: 74.7485
  }
];

const formatHour12 = (hour: number): string => {
  const h = hour % 12;
  const displayHour = h === 0 ? 12 : h;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${String(displayHour).padStart(2, '0')}:00 ${ampm}`;
};

const timeSlots24 = Array.from({ length: 24 }, (_, i) => {
  const start = formatHour12(i);
  const end = formatHour12((i + 1) % 24);
  return `${start} - ${end}`;
});

export default function App() {
  const navigate = useNavigate();
  const { isAuthenticated, user, login, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  const [role, setRole] = useState<'customer' | 'owner' | 'admin'>('customer');
  const [activeTab, setActiveTab] = useState<'explore' | 'bookings' | 'support' | 'nearby'>('explore');
  const [selectedTurf, setSelectedTurf] = useState<Turf | null>(null);
  const [bookingStep, setBookingStep] = useState<'details' | 'checkout' | 'success'>('details');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'gpay' | 'phonepe' | 'paytm'>('paytm');
  const [showQRCode, setShowQRCode] = useState(false);
  const [isOpeningApp, setIsOpeningApp] = useState(false);
  
  // Simulated Payment Gateway State
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [gatewayUpiId, setGatewayUpiId] = useState('');
  const [gatewayPhoneNumber, setGatewayPhoneNumber] = useState('');
  const [gatewayCardNumber, setGatewayCardNumber] = useState('');
  const [gatewayCardExpiry, setGatewayCardExpiry] = useState('');
  const [gatewayCardCvv, setGatewayCardCvv] = useState('');
  const [gatewayStatus, setGatewayStatus] = useState<'idle' | 'processing' | 'verify_action' | 'success' | 'failed'>('idle');
  const [gatewaySelectedMethod, setGatewaySelectedMethod] = useState<'upi' | 'card' | 'netbanking' | 'wallet'>('upi');
  const [gatewayErrorMessage, setGatewayErrorMessage] = useState('');
  const [qrVerifyStatus, setQrVerifyStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('password');
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');

  // Backend Turfs list state
  const [turfs, setTurfs] = useState<Turf[]>([]);

  // Booking details
  const [bookings, setBookings] = useState<any[]>([]);

  // Load Turfs from Backend
  useEffect(() => {
    const fetchTurfs = async () => {
      try {
        const res = await api.get('/turfs');
        const backendTurfs = res.data?.data || [];
        
        const getSportName = (sportId: string): string => {
          const map: Record<string, string> = {
            'NHQKZB3YRCRhWBL95sUE': 'Football',
            'nB4mpucB3cyLZA8gXxiA': 'Cricket',
            'HV8G3I9zmsYnUWFqqqMV': 'Box Cricket'
          };
          return map[sportId] || 'Football';
        };

        const mapped: Turf[] = backendTurfs.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description || '',
          city: t.location?.city || 'Ahmednagar',
          area: t.location?.area || 'Savedi',
          price: t.pricePerHour || 1200,
          sport: getSportName(t.sports?.[0] || ''),
          rating: t.rating || 5.0,
          image: t.images?.[0] || 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&auto=format&fit=crop&q=60',
          amenities: t.amenities || ['Washroom', 'Parking', 'Flood Lights'],
          lat: t.location?.latitude || 19.0948,
          lng: t.location?.longitude || 74.7480
        }));
        setTurfs(mapped);
      } catch (err) {
        console.error('Error fetching turfs:', err);
      }
    };
    fetchTurfs();
  }, []);

  // Turf Bookings state (active bookings of the selected turf)
  const [turfBookings, setTurfBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Load bookings for selected turf
  useEffect(() => {
    if (!selectedTurf) {
      setTurfBookings([]);
      return;
    }

    const fetchTurfBookings = async () => {
      setLoadingBookings(true);
      try {
        const res = await api.get(`/turfs/${selectedTurf.id}/bookings`);
        setTurfBookings(res.data?.data || []);
      } catch (err) {
        console.error('Error fetching turf bookings:', err);
      } finally {
        setLoadingBookings(false);
      }
    };
    fetchTurfBookings();
  }, [selectedTurf]);

  // Helper to normalize any time slot (24h or 12h AM/PM) into a standardized format for matching
  const normalizeSlot = (slotStr: string): string => {
    if (!slotStr) return '';
    const clean = slotStr.toUpperCase().trim();
    
    const toMinutes = (timeStr: string): number => {
      const t = timeStr.trim();
      if (t.includes('AM') || t.includes('PM')) {
        const parts = t.replace('AM', '').replace('PM', '').split(':');
        let hour = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1] || '0', 10);
        if (t.includes('PM') && hour !== 12) hour += 12;
        if (t.includes('AM') && hour === 12) hour = 0;
        return hour * 60 + minutes;
      } else {
        const parts = t.split(':');
        const hour = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1] || '0', 10);
        return hour * 60 + minutes;
      }
    };

    const splitParts = clean.split(/[-–]/);
    if (splitParts.length !== 2) return clean;
    
    const startMin = toMinutes(splitParts[0]);
    const endMin = toMinutes(splitParts[1]);
    return `${startMin}-${endMin}`;
  };

  // Helper to check if slot is already booked on the selected date
  const isSlotBooked = (time: string) => {
    const targetNorm = normalizeSlot(time);
    return turfBookings.some((b: any) => {
      const bDateStr = b.date || (b.bookingDate ? new Date(b.bookingDate).toISOString().split('T')[0] : '');
      const bSlot = b.slotId || b.time || '';
      const slots = bSlot.split(',').map((s: string) => s.trim());
      return slots.some((s: string) => s && normalizeSlot(s) === targetNorm) && bDateStr === selectedDate;
    });
  };

  // Helper to compute the dynamic price for selected slots (incorporating surcharges)
  const getSelectedSlotPrice = () => {
    if (!selectedTurf) return 0;
    if (selectedTimes.length === 0) return 0;
    
    return selectedTimes.reduce((total, time) => {
      const startHour = parseInt(time.split(':')[0], 10);
      const isPM = time.includes('PM');
      const actualHour = isPM && startHour !== 12 ? startHour + 12 : (!isPM && startHour === 12 ? 0 : startHour);
      const isPeak = actualHour >= 16 && actualHour < 22; // Peak hours: 4 PM to 10 PM
      const price = isPeak ? selectedTurf.price + 300 : selectedTurf.price;
      return total + price;
    }, 0);
  };

  // Load Bookings from Backend
  useEffect(() => {
    if (!isAuthenticated) {
      setBookings([
        {
          id: 'B-88392',
          turfName: 'Old Trafford Arena',
          date: '2026-07-08',
          time: '18:00 - 19:00',
          sport: 'Football',
          amount: 1200,
          status: 'UPCOMING'
        }
      ]);
      return;
    }

    const fetchBookings = async () => {
      try {
        const res = await api.get('/bookings');
        const list = res.data?.data || [];
        const mapped = list.map((b: any) => ({
          id: b.id,
          turfName: b.turfName,
          date: b.date,
          time: b.time,
          sport: b.sport || 'Football',
          amount: b.amount,
          status: b.status === 'active' ? 'UPCOMING' : b.status === 'completed' ? 'COMPLETED' : 'CANCELLED'
        }));
        setBookings(mapped);
      } catch (err) {
        console.error('Error fetching bookings:', err);
      }
    };
    fetchBookings();
  }, [isAuthenticated]);

  // Support state
  const [tickets, setTickets] = useState<any[]>([
    { id: 'TKT-102', subject: 'Refund Query', status: 'RESOLVED', createdAt: '2026-07-03' }
  ]);
  const [newTicketSubject, setNewTicketSubject] = useState('');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('All');

  const handleSendOtp = () => {
    if (!phone) return;
    setOtpLoading(true);
    // Simulate API call to /auth/send-otp
    setTimeout(() => {
      setOtpLoading(false);
      setOtpSent(true);
      // Simulate SMS alert or show mock OTP code (e.g. 123456)
      alert(`[OTP Sent] SMS OTP Sent to ${phone}: [ 123456 ] (Mock OTP for testing)`);
    }, 800);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
      if (loginMethod === 'otp' && !otpSent) {
        handleSendOtp();
        return;
      }
      
      const loggedInRole = role;
      const mockName = loggedInRole === 'admin' ? 'Admin User' : loggedInRole === 'owner' ? 'Turf Owner' : (phone || 'Customer');
      
      login({ 
        id: 'USR-101', 
        email: email || `${phone.replace(/[^0-9]/g, '')}@turfbook.com`, 
        name: mockName, 
        phone, 
        role: loggedInRole 
      }, 'dummy_token');

      setAuthMode(null);
      setOtpSent(false);
      setOtp('');

      if (loggedInRole === 'owner') {
        navigate('/owner');
        return;
      } else if (loggedInRole === 'admin') {
        navigate('/admin');
        return;
      }
    } else {
      // Register
      login({ 
        id: 'USR-101', 
        email, 
        name, 
        phone, 
        role: 'customer' 
      }, 'dummy_token');
      
      setAuthMode(null);
      setOtpSent(false);
      setOtp('');
    }

    // If they were configuring slots and logged in as customer, auto-advance them to checkout
    if (selectedTurf && selectedTimes.length > 0) {
      setBookingStep('checkout');
    }
  };

  const handleBookSlot = async (paymentStatus: 'CONFIRMED' | 'FAILED' = 'CONFIRMED') => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (selectedTimes.length === 0 || !selectedTurf) return;

    try {
      const joinedSlotsStr = selectedTimes.join(', ');
      const totalPrice = getSelectedSlotPrice();

      const bookingPayload = {
        turfId: selectedTurf.id,
        slotId: joinedSlotsStr,
        amount: totalPrice,
        time: joinedSlotsStr,
        date: selectedDate,
      };
      
      // 1. Create PENDING booking
      const res = await api.post('/bookings', bookingPayload);
      const { booking, razorpayOrderId } = res.data?.data || {};

      // 2. Automatically verify payment (dev mode simulation)
      await api.post('/bookings/verify', {
        bookingId: booking.id,
        razorpayOrderId,
        razorpayPaymentId: paymentStatus === 'CONFIRMED' ? 'pay_' + Math.random().toString(36).substring(2, 10) : undefined,
        razorpaySignature: paymentStatus === 'CONFIRMED' ? 'sig_mock' : undefined,
        status: paymentStatus
      });

      if (paymentStatus === 'FAILED') {
        return;
      }

      const newBooking = {
        id: booking.id,
        turfName: selectedTurf.name,
        date: selectedDate,
        time: joinedSlotsStr,
        sport: selectedTurf.sport,
        amount: totalPrice,
        status: 'UPCOMING'
      };

      setBookings([newBooking, ...bookings]);

      // 3. Immediately refresh turf bookings in UI to block this slot
      try {
        const bookingsRes = await api.get(`/turfs/${selectedTurf.id}/bookings`);
        setTurfBookings(bookingsRes.data?.data || []);
      } catch (e) {
        console.error('Error refreshing bookings:', e);
      }

      setBookingStep('success');
    } catch (err) {
      console.error('Error creating booking:', err);
      throw err;
    }
  };

  const handleRaiseTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject) return;
    const newTkt = {
      id: `TKT-${Math.floor(100 + Math.random() * 900)}`,
      subject: newTicketSubject,
      status: 'OPEN',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTickets([newTkt, ...tickets]);
    setNewTicketSubject('');
  };

  const filteredTurfs = turfs.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSport = selectedSport === 'All' || t.sport === selectedSport;
    return matchesSearch && matchesSport;
  });

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Background Turf Image */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <img
          src="/images/turf-bg.jpg"
          alt="Sports Turf Background"
          className="w-full h-full object-cover object-center"
          style={{ opacity: isDarkMode ? 0.75 : 0.70 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: isDarkMode
              ? 'linear-gradient(to bottom, rgba(3,7,18,0.1) 0%, rgba(3,7,18,0.2) 100%)'
              : 'linear-gradient(to bottom, rgba(248,250,252,0.05) 0%, rgba(248,250,252,0.15) 100%)'
          }}
        />
      </div>

      {/* Header — clean glassmorphism pill-nav style with transparent bg */}
      <header className={`sticky top-0 z-50 px-6 py-3 flex items-center justify-between transition-all border-b backdrop-blur-md ${
        isDarkMode
          ? 'bg-transparent border-slate-800/30'
          : 'bg-transparent border-slate-200/40'
      }`}>

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 flex items-center justify-center font-black text-white text-lg shadow-md shadow-emerald-500/30">
            T
          </div>
          <span className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>TurfBook</span>
        </div>

        {/* Pill Nav */}
        <nav className={`hidden md:flex items-center gap-0.5 px-1.5 py-1.5 rounded-2xl border text-sm font-semibold ${
          isDarkMode
            ? 'bg-slate-900/40 border-slate-800'
            : 'bg-slate-100/80 border-slate-200'
        }`}>
          {(['explore', 'bookings', 'nearby', 'support'] as const).map((tab) => {
            const labels: Record<string, string> = {
              explore: 'Explore',
              bookings: 'My Bookings',
              support: 'Support Help',
              nearby: 'Nearby Turfs'
            };
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  if ((tab === 'bookings' || tab === 'support') && !isAuthenticated) {
                    navigate('/login');
                  } else {
                    setActiveTab(tab);
                    setSelectedTurf(null);
                  }
                }}
                className={`px-5 py-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? isDarkMode
                      ? 'bg-emerald-500/15 text-emerald-400 shadow-sm'
                      : 'bg-white text-emerald-600 shadow-md shadow-slate-200 border border-slate-100'
                    : isDarkMode
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="flex items-center justify-center gap-1.5 font-bold text-xs">
                  {tab === 'explore' && <Search className="h-3.5 w-3.5" />}
                  {tab === 'bookings' && <Calendar className="h-3.5 w-3.5" />}
                  {tab === 'support' && <HelpCircle className="h-3.5 w-3.5" />}
                  {tab === 'nearby' && <MapPin className="h-3.5 w-3.5" />}
                  {labels[tab]}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all duration-200 ${
              isDarkMode
                ? 'border-slate-800 text-slate-400 hover:text-white bg-slate-900/30'
                : 'border-slate-200 text-slate-500 hover:text-slate-800 bg-white shadow-sm'
            }`}
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold px-3 py-1.5 rounded-xl ${
                isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
              }`}>Hi, {user?.name}</span>
              <button onClick={logout} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/login')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-white shadow-md shadow-emerald-500/25 transition-all duration-200"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 z-10 relative">
        
        {/* Tab 1: Explore & Search */}
        {activeTab === 'explore' && !selectedTurf && (
          <div>
            {/* Hero banner */}
            <div className="text-center max-w-3xl mx-auto mt-14 mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 mb-6 border border-emerald-500/20">
                <Sparkles className="h-3 w-3" /> Live Turf Slot Bookings
              </div>
              <h1
                className={`text-4xl md:text-6xl font-black tracking-tight mb-6 leading-[1.1] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
              >
                Book Your Favorite <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Sports Turf</span> Instantly
              </h1>
              <p className={`text-lg mb-10 leading-relaxed max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Choose from verified pitches, indoor domes, and premium boxes. Filter, select slots, and confirm within seconds.
              </p>

              {/* Enhanced Search & Filters */}
              <div className={`border rounded-2xl p-4 flex flex-col md:flex-row gap-4 shadow-2xl transition-all backdrop-blur-md ${isDarkMode ? 'bg-[#0f172a]/60 border-slate-800/80' : 'bg-white/80 border-slate-200/50'}`}>
                <div className="flex-1 flex items-center gap-3 px-3">
                  <Search className="text-slate-500 h-5 w-5 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by arena name, location, or city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full bg-transparent border-0 outline-none text-sm placeholder-slate-500 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}
                  />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {['All', 'Football', 'Cricket', 'Box Cricket'].map((sport) => (
                    <button
                      key={sport}
                      onClick={() => setSelectedSport(sport)}
                      className={`text-xs px-4 py-2.5 rounded-xl font-bold transition-all duration-200 ${selectedSport === sport ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25' : isDarkMode ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      {sport}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List */}
            <section className="mb-16">
              <h2 className="text-2xl font-black mb-8 flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full bg-emerald-500 block" />
                Available Sports Arenas
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredTurfs.map((turf) => (
                  <div
                    key={turf.id}
                    className={`group border rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5 backdrop-blur-md ${
                      isDarkMode
                        ? 'bg-[#0f172a]/40 border-slate-850 hover:border-emerald-500/30 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)]'
                        : 'bg-white/80 border-slate-200/50 hover:border-emerald-500/25 shadow-[0_10px_30px_-15px_rgba(148,163,184,0.15)] hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.1)]'
                    }`}
                  >
                    <div className="h-56 overflow-hidden relative">
                      {/* Image Gradient Shade */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent z-10" />
                      <img
                        src={turf.image}
                        alt={turf.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-4 left-4 z-20 bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-md shadow-emerald-500/20">
                        {turf.sport}
                      </span>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className={`font-bold text-xl leading-snug ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{turf.name}</h3>
                          <span className="text-emerald-450 font-extrabold text-sm flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                            <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
                            {turf.rating}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 flex items-center gap-1.5 mb-6">
                          <MapPin className="h-4 w-4 text-slate-500" /> {turf.area}, {turf.city}
                        </p>
                      </div>
                      
                      <div className={`flex items-center justify-between pt-5 border-t ${isDarkMode ? 'border-slate-800/60' : 'border-slate-100'}`}>
                        <div>
                          <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Starting at</span>
                          <span className="text-xl font-black">{formatCurrency(turf.price)}<span className="text-xs text-slate-500 font-normal">/hr</span></span>
                        </div>
                        <button
                          onClick={() => { setSelectedTurf(turf); setBookingStep('details'); setSelectedTimes([]); }}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-450 text-white shadow-md shadow-emerald-500/15 transition-all duration-200 hover:scale-[1.02]"
                        >
                          Book Slot
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Pitch Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-800/60 pt-16 mb-16">
              <div className={`p-6 border rounded-2xl backdrop-blur-md ${isDarkMode ? 'bg-[#0f172a]/20 border-slate-900' : 'bg-white/80 border-slate-200/50'}`}>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                  <Trophy className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className={`font-bold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Instant Booking</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Book your slot in seconds and receive immediate booking details and push confirmations.</p>
              </div>
              <div className={`p-6 border rounded-2xl backdrop-blur-md ${isDarkMode ? 'bg-[#0f172a]/20 border-slate-900' : 'bg-white/80 border-slate-200/50'}`}>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                  <Shield className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className={`font-bold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Secure Payments</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Encrypted transactional payments powered by Razorpay. Refund options available.</p>
              </div>
              <div className={`p-6 border rounded-2xl backdrop-blur-md ${isDarkMode ? 'bg-[#0f172a]/20 border-slate-900' : 'bg-white/80 border-slate-200/50'}`}>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                  <Zap className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className={`font-bold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Live Support</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Encountered an issue with your slot or payment? Reach out to support 24/7 directly in-app.</p>
              </div>
            </div>
          </div>
        )}

        {/* Selected Turf Detail Drawer/Modal view */}
        {selectedTurf && (
          <div className={`border rounded-2xl p-8 max-w-4xl mx-auto shadow-2xl relative backdrop-blur-xl ${isDarkMode ? 'bg-[#0f172a]/80 border-slate-800' : 'bg-white/90 border-slate-200/60'}`}>
            {bookingStep !== 'success' && (
              <button onClick={() => setSelectedTurf(null)} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors mb-6 inline-flex items-center gap-1.5">
                &larr; Back to Listings
              </button>
            )}

            {bookingStep === 'details' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <img src={selectedTurf.image} alt={selectedTurf.name} className="w-full h-72 object-cover rounded-xl mb-6 shadow-md" />
                  <h2 className="text-3xl font-black mb-3">{selectedTurf.name}</h2>
                  <span className="bg-emerald-500/15 text-emerald-400 px-3.5 py-1.5 rounded-xl text-xs font-extrabold inline-block mb-6 border border-emerald-500/10">
                    {selectedTurf.sport}
                  </span>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    {selectedTurf.description}
                  </p>
                  <h4 className="font-bold text-sm mb-3">Amenities Included:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTurf.amenities.map((a) => (
                      <span key={a} className="text-xs bg-slate-800/80 px-3.5 py-2 rounded-xl text-slate-300 font-semibold border border-slate-800/40">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={`p-6 border rounded-2xl shadow-inner backdrop-blur-md ${isDarkMode ? 'bg-[#030712]/40 border-slate-900' : 'bg-white/70 border-slate-200/50 shadow-md'}`}>
                  <h3 className={`font-extrabold text-xl mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <Calendar className="h-5 w-5 text-emerald-500" />
                    Configure Slot
                  </h3>
                  
                  <div className="mb-6">
                    <label className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Pick Booking Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className={`w-full rounded-xl p-3 outline-none text-sm font-semibold border transition-all ${
                        isDarkMode
                          ? 'bg-[#0f172a] border-slate-800 text-white focus:border-emerald-500'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 shadow-sm'
                      }`}
                    />
                  </div>

                  <label className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Available Slots (24 Hours)
                  </label>
                  
                  {/* Unified Slots Selector Grid */}
                  <div className={`max-h-[350px] overflow-y-auto pr-1.5 mb-8 rounded-xl border p-3 scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent ${
                    isDarkMode ? 'border-slate-800/40 bg-slate-900/10' : 'border-slate-250 bg-slate-100/50'
                  }`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {timeSlots24.map((time) => {
                        const booked = isSlotBooked(time);
                        const isSelected = selectedTimes.includes(time);
                        
                        // Surcharge formatting
                        const startHour = parseInt(time.split(':')[0], 10);
                        const isPM = time.includes('PM');
                        const actualHour = isPM && startHour !== 12 ? startHour + 12 : (!isPM && startHour === 12 ? 0 : startHour);
                        const isPeak = actualHour >= 16 && actualHour < 22; // 4 PM to 10 PM peak
                        const price = isPeak ? selectedTurf.price + 300 : selectedTurf.price;

                        return (
                          <button
                            key={time}
                            disabled={booked}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedTimes(selectedTimes.filter(t => t !== time));
                              } else {
                                setSelectedTimes([...selectedTimes, time]);
                              }
                            }}
                            className={`px-3.5 py-2.5 rounded-xl text-left border flex flex-col justify-between min-h-[72px] transition-all hover:scale-[1.01] relative ${
                              booked
                                ? 'bg-rose-500/5 border-rose-500/20 text-rose-500/80 cursor-not-allowed opacity-75'
                                : isSelected
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-extrabold ring-1 ring-emerald-500 shadow-md shadow-emerald-500/10'
                                : isDarkMode
                                ? 'bg-slate-900/30 border-slate-850 text-slate-350 hover:border-slate-700 hover:bg-slate-800'
                                : 'bg-slate-550 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/80 shadow-sm'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className={`text-[10px] font-extrabold ${booked ? 'line-through opacity-60' : ''}`}>
                                {time}
                              </span>
                              <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${
                                booked
                                  ? 'bg-rose-500/10 text-rose-400'
                                  : isSelected
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : isDarkMode
                                  ? 'bg-slate-800 text-slate-400'
                                  : 'bg-slate-200 text-slate-600'
                              }`}>
                                {booked ? 'Booked' : isSelected ? 'Selected' : 'Open'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between w-full mt-1.5 pt-1.5 border-t border-dashed border-slate-800/40">
                              <span className="text-[8px] text-slate-500 font-medium">Hourly Rate</span>
                              <span className="text-[9px] font-black flex items-center gap-0.5">
                                {formatCurrency(price)}
                                {isPeak && !booked && (
                                  <span className="text-[8px] filter saturate-150 flex items-center" title="Peak Hour Surcharge">
                                    <Flame className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                                  </span>
                                )}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className={`flex justify-between items-center mb-6 pt-6 border-t ${isDarkMode ? 'border-slate-800/60' : 'border-slate-250'}`}>
                    <div className="flex flex-col">
                      <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Amount</span>
                      <span className="text-[9px] text-slate-500 font-medium">₹300 peak-hour surcharge applies for 4 PM - 10 PM</span>
                    </div>
                    <span className={`font-black text-2xl ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(getSelectedSlotPrice())}</span>
                  </div>

                  <Button
                    variant="primary"
                    className="w-full shadow-lg shadow-emerald-500/25 py-6 font-bold rounded-xl"
                    disabled={selectedTimes.length === 0}
                    onClick={() => {
                      if (!isAuthenticated) {
                        navigate('/login');
                      } else {
                        setBookingStep('checkout');
                      }
                    }}
                  >
                    Proceed to checkout
                  </Button>
                </div>
              </div>
            )}

            {bookingStep === 'checkout' && (
              <div className="max-w-md mx-auto py-6">
                <h3 className="font-extrabold text-3xl mb-6 text-center">Confirm & Pay</h3>
                
                <div className={`p-6 rounded-2xl border mb-8 ${isDarkMode ? 'bg-[#030712]/50 border-slate-850' : 'bg-slate-50/80 border-slate-200'}`}>
                  <div className="flex justify-between mb-4 text-sm">
                    <span className="text-slate-500 font-semibold">Arena</span>
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedTurf.name}</span>
                  </div>
                  <div className="flex justify-between mb-4 text-sm">
                    <span className="text-slate-500 font-semibold">Slot(s)</span>
                    <span className={`font-bold max-w-[220px] text-right truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`} title={selectedTimes.join(', ')}>
                      {selectedTimes.join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between mb-4 text-sm">
                    <span className="text-slate-500 font-semibold">Sport</span>
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedTurf.sport}</span>
                  </div>
                  <hr className={isDarkMode ? 'border-slate-850 my-5' : 'border-slate-200 my-5'} />
                  <div className="flex justify-between text-lg font-black">
                    <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Total Amount</span>
                    <span className="text-emerald-400">{formatCurrency(getSelectedSlotPrice())}</span>
                  </div>
                </div>

                {/* QR Code Container */}
                {showQRCode && (
                  <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 mb-6 text-center space-y-4 animate-scaleUp">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">UPI QR Code</span>
                      <button 
                        onClick={() => {
                          setShowQRCode(false);
                          setQrVerifyStatus('idle');
                        }} 
                        className="text-xs text-rose-400 hover:text-rose-350 font-bold transition-colors animate-pulse"
                      >
                        Cancel QR
                      </button>
                    </div>
                    
                    {qrVerifyStatus === 'idle' && (
                      <div className="space-y-4">
                        <div className="inline-block p-4 bg-white rounded-2xl shadow-lg relative border-4 border-emerald-500/30">
                          <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-500 -mt-1 -ml-1 rounded-tl-md"></div>
                          <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-500 -mt-1 -mr-1 rounded-tr-md"></div>
                          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-500 -mb-1 -ml-1 rounded-bl-md"></div>
                          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-500 -mb-1 -mr-1 rounded-br-md"></div>
                          
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                              `upi://pay?pa=turfbook@upi&pn=TurfBook&am=${getSelectedSlotPrice()}&cu=INR`
                            )}`} 
                            alt="UPI QR Code" 
                            className="w-44 h-44 object-contain mx-auto"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-350">
                            Scan with Google Pay, PhonePe, Paytm, or any UPI app
                          </p>
                          <div className="flex justify-center items-center gap-2 text-[10px] text-emerald-450 font-extrabold tracking-wider bg-emerald-500/10 py-1.5 px-3 rounded-full w-fit mx-auto animate-pulse">
                            <span className="flex items-center gap-1">
                              Waiting for payment confirmation...
                              <Loader2 className="h-3 w-3 animate-spin text-emerald-450" />
                            </span>
                          </div>
                          
                          <div className="pt-2">
                            <Button
                              variant="primary"
                              className="w-full py-4 shadow-lg shadow-emerald-500/20 font-bold rounded-xl flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-all text-white"
                              onClick={() => {
                                setQrVerifyStatus('verifying');
                                setTimeout(async () => {
                                  try {
                                    await handleBookSlot('CONFIRMED');
                                    setQrVerifyStatus('success');
                                  } catch (err) {
                                    setQrVerifyStatus('failed');
                                  }
                                }, 2500);
                              }}
                            >
                              Verify Mock Payment
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {qrVerifyStatus === 'verifying' && (
                      <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <div className="h-12 w-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
                        <div className="text-center">
                          <h4 className="font-extrabold text-white text-base">Verifying UPI Transaction</h4>
                          <p className="text-xs text-slate-400 mt-1.5">Checking status with bank server...</p>
                        </div>
                      </div>
                    )}

                    {qrVerifyStatus === 'success' && (
                      <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-scaleUp">
                        <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30">
                          <CheckCircle className="h-10 w-10 text-emerald-400 animate-pulse" />
                        </div>
                        <div className="text-center">
                          <h4 className="font-black text-white text-lg font-bold">Payment Confirmed</h4>
                          <p className="text-xs text-slate-400 mt-1">Generating booking ticket...</p>
                        </div>
                      </div>
                    )}

                    {qrVerifyStatus === 'failed' && (
                      <div className="flex flex-col items-center justify-center py-6 space-y-4 animate-scaleUp">
                        <div className="h-16 w-16 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/30">
                          <ShieldAlert className="h-10 w-10 text-rose-400" />
                        </div>
                        <div className="text-center">
                          <h4 className="font-extrabold text-white text-lg">Verification Failed</h4>
                          <p className="text-xs text-rose-400 mt-1">No transaction found for this QR session.</p>
                        </div>
                        <div className="flex gap-3 w-full max-w-[280px] mx-auto pt-2">
                          <Button
                            variant="primary"
                            className="flex-1 py-3 text-xs font-bold rounded-xl"
                            onClick={() => {
                              setQrVerifyStatus('verifying');
                              setTimeout(async () => {
                                try {
                                  await handleBookSlot('CONFIRMED');
                                  setQrVerifyStatus('success');
                                } catch (err) {
                                  setQrVerifyStatus('failed');
                                }
                              }, 2500);
                            }}
                          >
                            Retry Verify
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 py-3 text-xs font-bold rounded-xl border-slate-800 text-slate-400"
                            onClick={() => setQrVerifyStatus('idle')}
                          >
                            Back to QR
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* App Redirect Overlay */}
                {isOpeningApp && (
                  <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 mb-6 text-center space-y-4 animate-scaleUp">
                    <div className="flex flex-col items-center justify-center py-6 space-y-4">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-lg text-white">Opening Payment App</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Connecting to {selectedPaymentMethod === 'gpay' ? 'Google Pay' : selectedPaymentMethod === 'phonepe' ? 'PhonePe' : 'Paytm'}...
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Methods Selection Panel */}
                {!showQRCode && !isOpeningApp && (
                  <div className="space-y-4 mb-6">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Select Payment Method
                    </label>
                    <div className="w-full">
                      {[
                        { id: 'paytm', name: 'Paytm / UPI', icon: CreditCard }
                      ].map((method) => {
                        const Icon = method.icon;
                        const isSelected = selectedPaymentMethod === method.id;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setSelectedPaymentMethod(method.id as any)}
                            className={`w-full p-4 rounded-xl border flex items-center justify-center gap-3 transition-all duration-200 ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-extrabold ring-1 ring-emerald-500 shadow-md'
                                : 'border-slate-800 bg-slate-900/40 text-slate-350 hover:border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            <Icon className="h-6 w-6" />
                            <span className="text-xs font-bold">{method.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-855">
                      <Button
                        variant="outline"
                        className="py-4 border-slate-800 text-slate-400 hover:text-slate-200 font-bold rounded-xl hover:scale-[1.02] transition-all"
                        onClick={() => {
                          setQrVerifyStatus('idle');
                          setShowQRCode(true);
                        }}
                      >
                        Generate QR Code
                      </Button>
                      <Button
                        variant="primary"
                        className="py-4 shadow-lg shadow-emerald-500/20 font-bold rounded-xl flex items-center justify-center gap-1.5 hover:scale-[1.02] transition-all"
                        onClick={() => {
                          setGatewayStatus('idle');
                          setGatewaySelectedMethod('upi');
                          setGatewayUpiId('');
                          setGatewayPhoneNumber('');
                          setGatewayCardNumber('');
                          setGatewayCardExpiry('');
                          setGatewayCardCvv('');
                          setGatewayErrorMessage('');
                          setShowPaymentGateway(true);
                        }}
                      >
                        Pay ₹{getSelectedSlotPrice()}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Back Button */}
                {!showQRCode && !isOpeningApp && (
                  <Button 
                    variant="outline" 
                    className="w-full py-5 rounded-xl border-slate-800 text-slate-450 hover:text-slate-200 font-bold hover:bg-slate-900/40 transition-colors" 
                    onClick={() => setBookingStep('details')}
                  >
                    Go Back
                  </Button>
                )}
              </div>
            )}

            {bookingStep === 'success' && (
              <div className="text-center py-12 max-w-sm mx-auto">
                <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-6" />
                <h3 className="font-black text-3xl mb-4">Booking Confirmed!</h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                  Your turf booking has been successfully finalized. You can find detail reports and receipts inside the bookings tab.
                </p>
                <Button variant="primary" className="w-full shadow-lg shadow-emerald-500/20 py-6" onClick={() => { setActiveTab('bookings'); setSelectedTurf(null); setSelectedTimes([]); setShowQRCode(false); setIsOpeningApp(false); }}>
                  Go to Bookings
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Bookings History */}
        {activeTab === 'bookings' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-black mb-8 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-emerald-500 block" />
              My Booking History
            </h2>
            <div className="space-y-4">
              {bookings.map((b) => (
                <div key={b.id} className={`p-6 border rounded-2xl flex items-center justify-between transition-all hover:border-slate-800/80 backdrop-blur-md ${isDarkMode ? 'bg-[#0f172a]/45 border-slate-900' : 'bg-white/80 border-slate-200/50'}`}>
                  <div>
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-mono border ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700/30' : 'bg-slate-100 text-slate-600 border-slate-200/60'}`}>{b.id}</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider">{b.status}</span>
                    </div>
                    <h3 className={`font-bold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{b.turfName}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-500" /> {b.date} &nbsp;
                      <Clock className="h-4 w-4 text-slate-500" /> {b.time}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xl font-black block mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(b.amount)}</span>
                    <button className="text-xs font-bold text-rose-500 hover:text-rose-450 transition-colors">Cancel Booking</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Support Help */}
        {activeTab === 'support' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-black mb-8 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-emerald-500 block" />
              Customer Support
            </h2>

            <form onSubmit={handleRaiseTicket} className={`p-6 border rounded-2xl mb-8 backdrop-blur-md ${isDarkMode ? 'bg-[#0f172a]/45 border-slate-900' : 'bg-white/80 border-slate-200/50'}`}>
              <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                <HelpCircle className="h-5 w-5 text-emerald-450" />
                Raise New Ticket
              </h3>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Summarize your issue (e.g., Slot mismatch, refund status)..."
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  className={`w-full rounded-xl p-3.5 border outline-none text-sm placeholder-slate-500 font-semibold transition-all ${
                    isDarkMode
                      ? 'bg-slate-850 border-0 text-white'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                  }`}
                  required
                />
              </div>
              <Button type="submit" variant="primary" className="shadow-lg shadow-emerald-500/15">Submit Ticket</Button>
            </form>

            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-400" />
              Active Tickets
            </h3>
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className={`p-4 rounded-xl flex items-center justify-between border backdrop-blur-sm ${isDarkMode ? 'bg-slate-900/40 border-slate-900/60' : 'bg-white/70 border-slate-200/50'}`}>
                  <div>
                    <span className="text-xs text-slate-500 font-mono block mb-1">{t.id}</span>
                    <p className={`font-semibold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{t.subject}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${t.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Nearby Map Finder */}
        {activeTab === 'nearby' && (
          <NearbyMap
            turfs={turfs}
            isDarkMode={isDarkMode}
            onSelectTurf={(turf) => {
              setSelectedTurf(turf);
              setActiveTab('explore');
              setBookingStep('details');
              setSelectedTimes([]);
            }}
          />
        )}
      </main>

      {/* Auth Modal Overlay */}
      {authMode && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all ${
          isDarkMode ? 'bg-[#030712]/60 backdrop-blur-sm' : 'bg-slate-900/40 backdrop-blur-sm'
        }`}>
          <div className={`rounded-3xl p-8 max-w-md w-full relative backdrop-blur-xl transition-all duration-300 ${
            isDarkMode
              ? 'bg-[#030712]/80 border border-emerald-500/20 text-white shadow-[0_0_60px_-15px_rgba(16,185,129,0.25)]'
              : 'bg-white border border-slate-200 text-slate-900 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)]'
          }`}>
            {/* Close Button */}
            <button
              onClick={() => {
                setAuthMode(null);
                setOtpSent(false);
                setOtp('');
              }}
              className={`absolute top-4 right-4 p-1.5 rounded-xl border transition-all ${
                isDarkMode 
                  ? 'border-slate-800 text-slate-400 hover:text-white bg-slate-900/30 hover:bg-slate-800/50' 
                  : 'border-slate-200 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 shadow-sm'
              }`}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Login Method Toggle Tabs */}
            {authMode === 'login' && (
              <div className={`grid grid-cols-2 gap-1.5 p-1 rounded-2xl border mb-6 text-xs font-bold ${
                isDarkMode ? 'bg-emerald-950/20 border-emerald-500/10 text-slate-400' : 'bg-slate-100 border-slate-200/80 text-slate-500'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('password');
                    setOtpSent(false);
                    setOtp('');
                  }}
                  className={`py-2.5 rounded-xl transition-all ${
                    loginMethod === 'password'
                      ? isDarkMode
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white text-emerald-600 border border-emerald-500/20 shadow-sm'
                      : isDarkMode
                      ? 'hover:text-emerald-350 text-slate-400'
                      : 'hover:text-emerald-600 text-slate-500'
                  }`}
                >
                  Password Login
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('otp')}
                  className={`py-2.5 rounded-xl transition-all ${
                    loginMethod === 'otp'
                      ? isDarkMode
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white text-emerald-600 border border-emerald-500/20 shadow-sm'
                      : isDarkMode
                      ? 'hover:text-emerald-350 text-slate-400'
                      : 'hover:text-emerald-600 text-slate-500'
                  }`}
                >
                  OTP Login
                </button>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 mt-4">
              {/* QUICK DEMO LOGIN DROPDOWN */}
              {authMode === 'login' && (
                <div>
                  <label className={`text-xs mb-2 font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                  }`}>
                    <Zap className="h-3.5 w-3.5 fill-emerald-500/10 text-emerald-500 shrink-0" />
                    <span>Quick Demo Login</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => {
                      const val = e.target.value as 'customer' | 'owner' | 'admin';
                      setRole(val);
                      if (val === 'customer') {
                        setPhone('9876543210');
                        setPassword('password');
                      } else if (val === 'owner') {
                        setPhone('9999988888');
                        setPassword('password');
                      } else if (val === 'admin') {
                        setPhone('8888877777');
                        setPassword('password');
                      }
                    }}
                    className={`w-full px-3 py-3.5 rounded-xl border text-sm outline-none font-semibold transition-all ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-700 text-slate-300 focus:border-emerald-500/50' 
                        : 'bg-white border-slate-200 text-slate-700 focus:border-emerald-500/50 shadow-sm'
                    }`}
                  >
                    <option value="customer">Customer (9876543210)</option>
                    <option value="owner">Turf Owner (9999988888)</option>
                    <option value="admin">System Admin (8888877777)</option>
                  </select>
                </div>
              )}
              {/* REGISTER ONLY FIELDS */}
              {authMode === 'register' && (
                <div>
                  <label className={`text-xs block mb-2 font-bold uppercase tracking-wider ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full bg-white text-slate-900 placeholder-slate-400 rounded-xl p-3.5 border focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none text-sm font-semibold transition-all ${
                      isDarkMode ? 'border-slate-700/30' : 'border-slate-200'
                    }`}
                  />
                </div>
              )}

              {/* PRIMARY LOGIN/REGISTER FIELD: PHONE NUMBER (Unified Input Box) */}
              <div>
                <label className={`text-xs block mb-2 font-bold uppercase tracking-wider ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>Phone Number</label>
                <div className={`flex items-center bg-white border rounded-xl focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all overflow-hidden ${
                  isDarkMode ? 'border-slate-700/30' : 'border-slate-200'
                }`}>
                  <div className="text-slate-800 pl-4 pr-2 text-sm font-bold select-none border-r border-slate-200 py-3 shrink-0">
                    +91
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    pattern="[0-9]{10}"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-transparent text-slate-900 placeholder-slate-400 p-3.5 pl-3 outline-none text-sm font-semibold"
                  />
                </div>
              </div>

              {/* REGISTER ONLY SECONDARY FIELD: EMAIL */}
              {authMode === 'register' && (
                <div>
                  <label className={`text-xs block mb-2 font-bold uppercase tracking-wider ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full bg-white text-slate-900 placeholder-slate-400 rounded-xl p-3.5 border focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none text-sm font-semibold transition-all ${
                      isDarkMode ? 'border-slate-700/30' : 'border-slate-200'
                    }`}
                  />
                </div>
              )}

              {/* DYNAMIC FIELD: PASSWORD OR OTP */}
              {authMode === 'login' && loginMethod === 'otp' ? (
                /* OTP CODE INPUT STEP */
                otpSent && (
                  <div>
                    <label className={`text-xs block mb-2 font-bold uppercase tracking-wider ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>6-Digit OTP Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="------"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      className={`w-full bg-white text-slate-900 placeholder-slate-400 rounded-xl p-3.5 border focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none text-sm font-bold text-center tracking-[0.5em] text-lg transition-all ${
                        isDarkMode ? 'border-slate-700/30' : 'border-slate-200'
                      }`}
                    />
                    <div className="flex justify-between items-center mt-2 px-1">
                      <span className="text-[11px] text-slate-500">OTP code valid for 5 min</span>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-[11px] text-emerald-500 hover:text-emerald-600 font-bold"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                )
              ) : (
                /* PASSWORD INPUT */
                <div>
                  <label className={`text-xs block mb-2 font-bold uppercase tracking-wider ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full bg-white text-slate-900 placeholder-slate-400 rounded-xl p-3.5 border focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none text-sm font-semibold transition-all ${
                      isDarkMode ? 'border-slate-700/30' : 'border-slate-200'
                    }`}
                  />
                </div>
              )}

              {/* ACTION SUBMIT BUTTON */}
              <Button
                type="submit"
                variant="primary"
                disabled={otpLoading}
                className="w-full mt-6 py-6 shadow-lg shadow-emerald-500/25 relative overflow-hidden font-bold"
              >
                {otpLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Sending OTP...
                  </span>
                ) : authMode === 'login' ? (
                  loginMethod === 'otp' ? (
                    otpSent ? 'Verify & Login' : 'Send Verification OTP'
                  ) : 'Login'
                ) : 'Sign Up & Create Account'}
              </Button>
            </form>

            {/* TOGGLE BOTTOM LINK */}
            <p className="text-xs text-slate-500 text-center mt-6">
              {authMode === 'login' ? "Don't have an account? " : 'Already registered? '}
              <button
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setOtpSent(false);
                  setOtp('');
                }}
                className="text-emerald-500 underline font-bold transition-colors hover:text-emerald-600"
              >
                {authMode === 'login' ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      )}

      {showPaymentGateway && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-[420px] overflow-hidden shadow-2xl animate-scaleUp">
            {/* Header */}
            <div className="bg-[#1e293b] p-5 border-b border-slate-800/60 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-sm">TB</div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">TurfBook Payment</h4>
                  <p className="text-[10px] text-slate-400">Simulated Secure Gateway</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Amount to Pay</p>
                <p className="text-lg font-black text-emerald-400">{formatCurrency(getSelectedSlotPrice())}</p>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6">
              {gatewayStatus === 'idle' && (
                <div className="space-y-4">
                  {/* Tabs */}
                  <div className="flex border-b border-slate-800/80 pb-2">
                    <button
                      type="button"
                      onClick={() => setGatewaySelectedMethod('upi')}
                      className={`flex-1 pb-2 text-center text-xs font-bold transition-all border-b-2 ${
                        gatewaySelectedMethod === 'upi'
                          ? 'border-emerald-500 text-emerald-400'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      UPI / Wallet
                    </button>
                    <button
                      type="button"
                      onClick={() => setGatewaySelectedMethod('card')}
                      className={`flex-1 pb-2 text-center text-xs font-bold transition-all border-b-2 ${
                        gatewaySelectedMethod === 'card'
                          ? 'border-emerald-500 text-emerald-400'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Credit/Debit Card
                    </button>
                  </div>

                  {/* Method details */}
                  {gatewaySelectedMethod === 'upi' && (
                    <div className="space-y-4">
                      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/40 text-center">
                        <p className="text-xs text-slate-400 mb-2 font-medium">Selected App: <span className="text-white font-bold capitalize">{selectedPaymentMethod === 'paytm' ? 'Paytm Wallet / UPI' : selectedPaymentMethod === 'gpay' ? 'Google Pay' : 'PhonePe'}</span></p>
                      </div>
                      
                      {selectedPaymentMethod === 'paytm' ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Paytm Mobile Number</label>
                            <input
                              type="text"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-semibold"
                              placeholder="e.g. 9876543210"
                              value={gatewayPhoneNumber}
                              onChange={(e) => setGatewayPhoneNumber(e.target.value.replace(/\D/g, '').substring(0, 10))}
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-semibold">Or enter standard UPI ID below</span>
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">UPI ID (VPA)</label>
                            <input
                              type="text"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-semibold"
                              placeholder="e.g. name@paytm or 9876543210@paytm"
                              value={gatewayUpiId}
                              onChange={(e) => setGatewayUpiId(e.target.value)}
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Enter UPI ID (VPA)</label>
                          <input
                            type="text"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-semibold"
                            placeholder="e.g. username@upi or mobileNumber@ybl"
                            value={gatewayUpiId}
                            onChange={(e) => setGatewayUpiId(e.target.value)}
                          />
                        </div>
                      )}

                      <Button
                        variant="primary"
                        className="w-full py-4 font-bold shadow-lg shadow-emerald-500/10 mt-2 text-white"
                        disabled={selectedPaymentMethod === 'paytm' ? (!gatewayPhoneNumber && !gatewayUpiId) : !gatewayUpiId}
                        onClick={() => {
                          setGatewayStatus('processing');
                          setTimeout(() => {
                            setGatewayStatus('verify_action');
                          }, 2000);
                        }}
                      >
                        Proceed to Pay
                      </Button>
                    </div>
                  )}

                  {gatewaySelectedMethod === 'card' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Card Number</label>
                        <input
                          type="text"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono tracking-widest font-semibold"
                          placeholder="4111 2222 3333 4444"
                          value={gatewayCardNumber}
                          onChange={(e) => setGatewayCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim().substring(0, 19))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Expiry (MM/YY)</label>
                          <input
                            type="text"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-semibold"
                            placeholder="12/28"
                            value={gatewayCardExpiry}
                            onChange={(e) => setGatewayCardExpiry(e.target.value.replace(/\D/g, '').replace(/(\d{2})(\d{2})/, '$1/$2').substring(0, 5))}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">CVV</label>
                          <input
                            type="password"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-semibold"
                            placeholder="•••"
                            value={gatewayCardCvv}
                            onChange={(e) => setGatewayCardCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                          />
                        </div>
                      </div>

                      <Button
                        variant="primary"
                        className="w-full py-4 font-bold shadow-lg shadow-emerald-500/10 mt-2 text-white"
                        disabled={gatewayCardNumber.length < 19 || gatewayCardExpiry.length < 5 || gatewayCardCvv.length < 3}
                        onClick={() => {
                          setGatewayStatus('processing');
                          setTimeout(() => {
                            setGatewayStatus('verify_action');
                          }, 2000);
                        }}
                      >
                        Pay {formatCurrency(getSelectedSlotPrice())}
                      </Button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowPaymentGateway(false)}
                    className="w-full text-center text-xs font-bold text-slate-450 hover:text-slate-200 transition-colors py-2 border border-slate-800/40 rounded-xl hover:bg-slate-900"
                  >
                    Cancel Payment
                  </button>
                </div>
              )}

              {gatewayStatus === 'processing' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="h-12 w-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
                  <div className="text-center">
                    <h4 className="font-extrabold text-white text-base">Processing Transaction</h4>
                    <p className="text-xs text-slate-400 mt-1.5">Please wait, contacting your payment provider...</p>
                  </div>
                </div>
              )}

              {gatewayStatus === 'verify_action' && (
                <div className="space-y-6 text-center py-4">
                  <div>
                    <h4 className="font-extrabold text-white text-lg mb-1">Simulate Payment</h4>
                    <p className="text-xs text-slate-400">Choose the transaction outcome below to test the platform behavior.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={async () => {
                        setGatewayStatus('processing');
                        try {
                          await handleBookSlot('CONFIRMED');
                          setGatewayStatus('success');
                          setTimeout(() => {
                            setShowPaymentGateway(false);
                          }, 1500);
                        } catch (err: any) {
                          setGatewayStatus('failed');
                          setGatewayErrorMessage(err.response?.data?.message || 'Transaction was rejected by bank.');
                        }
                      }}
                      className="p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl font-bold transition-all hover:scale-[1.03] flex flex-col items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-8 w-8 text-emerald-400" />
                      <span>Simulate Success</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        setGatewayStatus('processing');
                        try {
                          await handleBookSlot('FAILED');
                          setGatewayStatus('failed');
                          setGatewayErrorMessage('Payment declined by user or bank.');
                        } catch (err) {
                          setGatewayStatus('failed');
                          setGatewayErrorMessage('Error communication with backend.');
                        }
                      }}
                      className="p-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl font-bold transition-all hover:scale-[1.03] flex flex-col items-center justify-center gap-2"
                    >
                      <ShieldAlert className="h-8 w-8 text-rose-400" />
                      <span>Simulate Failure</span>
                    </button>
                  </div>
                </div>
              )}

              {gatewayStatus === 'success' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-scaleUp">
                  <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle className="h-10 w-10 text-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <h4 className="font-black text-white text-lg">Payment Successful</h4>
                    <p className="text-xs text-slate-400 mt-1">Generating your booking receipt...</p>
                  </div>
                </div>
              )}

              {gatewayStatus === 'failed' && (
                <div className="space-y-6 text-center py-4">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="h-16 w-16 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/30">
                      <ShieldAlert className="h-10 w-10 text-rose-400" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-lg">Transaction Failed</h4>
                      <p className="text-xs text-rose-400/90 mt-1.5 font-medium">{gatewayErrorMessage || 'The payment was not processed.'}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setGatewayStatus('idle')}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Retry Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPaymentGateway(false)}
                      className="flex-1 py-3 border border-slate-800 hover:bg-slate-900 text-slate-400 rounded-xl text-xs font-bold transition-colors"
                    >
                      Close Checkout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#030712] py-12 text-center text-slate-500 text-sm z-10 relative">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
          <span className="text-white font-bold">TurfBook Systems</span>
          <div className="flex gap-6 font-semibold">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Refund Policy</a>
          </div>
        </div>
        &copy; {new Date().getFullYear()} TurfBook. All rights reserved.
      </footer>
    </div>
  );
}

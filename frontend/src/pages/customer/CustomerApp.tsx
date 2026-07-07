import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import NearbyMap from './NearbyMap';

// Inlined from @turf-booking/ui
function Button({ children, onClick, className = '', variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) {
  return <button onClick={onClick} className={className} {...props}>{children}</button>;
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
  MessageSquare
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
    image: 'https://images.unsplash.com/photo-1518605076385-7bf7b1f54411?w=600&auto=format&fit=crop&q=60',
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
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=60',
    amenities: ['Washroom', 'Parking', 'Flood Lights', 'Locker Room'],
    lat: 19.1235,
    lng: 74.7485
  }
];

export default function App() {
  const { isAuthenticated, user, login, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  const [activeTab, setActiveTab] = useState<'explore' | 'bookings' | 'support' | 'nearby'>('explore');
  const [selectedTurf, setSelectedTurf] = useState<Turf | null>(null);
  const [bookingStep, setBookingStep] = useState<'details' | 'checkout' | 'success'>('details');
  const [selectedDate, setSelectedDate] = useState('2026-07-07');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');

  // Booking details
  const [bookings, setBookings] = useState<any[]>([
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
      alert(`💬 SMS OTP Sent to ${phone}: [ 123456 ] (Mock OTP for testing)`);
    }, 800);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
      if (loginMethod === 'otp' && !otpSent) {
        handleSendOtp();
        return;
      }
      login({ 
        id: 'USR-101', 
        email: email || `${phone.replace(/[^0-9]/g, '')}@turfbook.com`, 
        name: phone, 
        phone, 
        role: 'customer' 
      }, 'dummy_token');
    } else {
      // Register
      login({ 
        id: 'USR-101', 
        email, 
        name, 
        phone, 
        role: 'customer' 
      }, 'dummy_token');
    }
    setAuthMode(null);
    setOtpSent(false);
    setOtp('');
  };

  const handleBookSlot = () => {
    if (!isAuthenticated) {
      setAuthMode('login');
      return;
    }
    if (!selectedTime) return;

    const newBooking = {
      id: `B-${Math.floor(10000 + Math.random() * 90000)}`,
      turfName: selectedTurf!.name,
      date: selectedDate,
      time: selectedTime,
      sport: selectedTurf!.sport,
      amount: selectedTurf!.price,
      status: 'UPCOMING'
    };

    setBookings([newBooking, ...bookings]);
    setBookingStep('success');
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

  const filteredTurfs = sampleTurfs.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSport = selectedSport === 'All' || t.sport === selectedSport;
    return matchesSearch && matchesSport;
  });

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Background Turf Image */}
      <div className="fixed top-0 left-0 w-full h-[600px] pointer-events-none overflow-hidden z-0">
        <img
          src="/images/turf-bg.jpg"
          alt="Sports Turf Background"
          className="w-full h-full object-cover object-center"
          style={{ opacity: isDarkMode ? 0.75 : 0.70 }}
        />
        {/* Very light fade only at the very bottom */}
        <div
          className="absolute inset-0"
          style={{
            background: isDarkMode
              ? 'linear-gradient(to bottom, rgba(3,7,18,0.05) 0%, rgba(3,7,18,0.15) 55%, rgba(3,7,18,0.95) 100%)'
              : 'linear-gradient(to bottom, rgba(248,250,252,0.0) 0%, rgba(248,250,252,0.1) 60%, rgba(248,250,252,1) 100%)'
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
              nearby: '📍 Nearby Maps'
            };
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedTurf(null); }}
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
                {labels[tab]}
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
                onClick={() => setAuthMode('login')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setAuthMode('register')}
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
              <div className={`border rounded-2xl p-4 flex flex-col md:flex-row gap-4 shadow-2xl transition-all ${isDarkMode ? 'bg-[#0f172a]/60 border-slate-800/80 backdrop-blur-xl' : 'bg-white border-slate-200'}`}>
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
                    className={`group border rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5 ${
                      isDarkMode
                        ? 'bg-[#0f172a]/40 border-slate-850 hover:border-emerald-500/30 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)]'
                        : 'bg-white/90 border-slate-200/70 hover:border-emerald-500/25 shadow-[0_10px_30px_-15px_rgba(148,163,184,0.15)] hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.1)]'
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
                          <span className="text-emerald-400 font-extrabold text-sm flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                            ★ {turf.rating}
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
                          onClick={() => { setSelectedTurf(turf); setBookingStep('details'); setSelectedTime(null); }}
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
              <div className={`p-6 border rounded-2xl ${isDarkMode ? 'bg-[#0f172a]/20 border-slate-900' : 'bg-white border-slate-200'}`}>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                  <Trophy className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="font-bold text-lg text-white mb-2">Instant Booking</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Book your slot in seconds and receive immediate booking details and push confirmations.</p>
              </div>
              <div className={`p-6 border rounded-2xl ${isDarkMode ? 'bg-[#0f172a]/20 border-slate-900' : 'bg-white border-slate-200'}`}>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                  <Shield className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="font-bold text-lg text-white mb-2">Secure Payments</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Encrypted transactional payments powered by Razorpay. Refund options available.</p>
              </div>
              <div className={`p-6 border rounded-2xl ${isDarkMode ? 'bg-[#0f172a]/20 border-slate-900' : 'bg-white border-slate-200'}`}>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                  <Zap className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="font-bold text-lg text-white mb-2">Live Support</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Encountered an issue with your slot or payment? Reach out to support 24/7 directly in-app.</p>
              </div>
            </div>
          </div>
        )}

        {/* Selected Turf Detail Drawer/Modal view */}
        {selectedTurf && (
          <div className={`border rounded-2xl p-8 max-w-4xl mx-auto shadow-2xl relative ${isDarkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'}`}>
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

                <div className={`p-6 border rounded-2xl shadow-inner ${isDarkMode ? 'bg-[#030712]/40 border-slate-900' : 'bg-slate-50 border-slate-200'}`}>
                  <h3 className="font-extrabold text-xl mb-6 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-emerald-400" />
                    Configure Slot
                  </h3>
                  
                  <div className="mb-6">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Pick Booking Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-slate-850 text-white rounded-xl p-3 border-0 outline-none text-sm font-semibold"
                    />
                  </div>

                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Available Slots</label>
                  <div className="grid grid-cols-2 gap-2 mb-8">
                    {['16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00'].map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`text-xs p-3.5 rounded-xl border transition-all duration-200 ${selectedTime === time ? 'border-emerald-400 bg-emerald-400/10 text-emerald-400 font-bold' : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mb-6 pt-6 border-t border-slate-800/60">
                    <span className="text-sm text-slate-500 font-semibold">Hourly Rate</span>
                    <span className="font-black text-2xl text-white">{formatCurrency(selectedTurf.price)}</span>
                  </div>

                  <Button
                    variant="primary"
                    className="w-full shadow-lg shadow-emerald-500/25 py-6 font-bold rounded-xl"
                    disabled={!selectedTime}
                    onClick={() => setBookingStep('checkout')}
                  >
                    Proceed to checkout
                  </Button>
                </div>
              </div>
            )}

            {bookingStep === 'checkout' && (
              <div className="max-w-md mx-auto py-6">
                <h3 className="font-extrabold text-3xl mb-6 text-center">Confirm & Pay</h3>
                
                <div className="bg-[#030712]/50 p-6 rounded-2xl border border-slate-850 mb-8">
                  <div className="flex justify-between mb-4 text-sm">
                    <span className="text-slate-500 font-semibold">Arena</span>
                    <span className="font-bold text-white">{selectedTurf.name}</span>
                  </div>
                  <div className="flex justify-between mb-4 text-sm">
                    <span className="text-slate-500 font-semibold">Slot</span>
                    <span className="font-bold text-white">{selectedDate} at {selectedTime}</span>
                  </div>
                  <div className="flex justify-between mb-4 text-sm">
                    <span className="text-slate-500 font-semibold">Sport</span>
                    <span className="font-bold text-white">{selectedTurf.sport}</span>
                  </div>
                  <hr className="border-slate-850 my-5" />
                  <div className="flex justify-between text-lg font-black">
                    <span className="text-white">Total Amount</span>
                    <span className="text-emerald-400">{formatCurrency(selectedTurf.price)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button variant="primary" className="w-full shadow-lg shadow-emerald-500/20 py-6 font-bold rounded-xl" onClick={handleBookSlot}>
                    Pay Now via Razorpay
                  </Button>
                  <Button variant="outline" className="w-full py-6 rounded-xl border-slate-800 text-slate-400 hover:text-slate-200" onClick={() => setBookingStep('details')}>
                    Go Back
                  </Button>
                </div>
              </div>
            )}

            {bookingStep === 'success' && (
              <div className="text-center py-12 max-w-sm mx-auto">
                <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-6" />
                <h3 className="font-black text-3xl mb-4">Booking Confirmed!</h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                  Your turf booking has been successfully finalized. You can find detail reports and receipts inside the bookings tab.
                </p>
                <Button variant="primary" className="w-full shadow-lg shadow-emerald-500/20 py-6" onClick={() => { setActiveTab('bookings'); setSelectedTurf(null); }}>
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
                <div key={b.id} className={`p-6 border rounded-2xl flex items-center justify-between transition-all hover:border-slate-800/80 ${isDarkMode ? 'bg-[#0f172a]/45 border-slate-900' : 'bg-white border-slate-200'}`}>
                  <div>
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-lg font-mono text-slate-400 border border-slate-700/30">{b.id}</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider">{b.status}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-white">{b.turfName}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-500" /> {b.date} &nbsp;
                      <Clock className="h-4 w-4 text-slate-500" /> {b.time}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black block mb-3 text-white">{formatCurrency(b.amount)}</span>
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

            <form onSubmit={handleRaiseTicket} className={`p-6 border rounded-2xl mb-8 ${isDarkMode ? 'bg-[#0f172a]/45 border-slate-900' : 'bg-white border-slate-200'}`}>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-emerald-400" />
                Raise New Ticket
              </h3>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Summarize your issue (e.g., Slot mismatch, refund status)..."
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  className="w-full bg-slate-850 text-white rounded-xl p-3.5 border-0 outline-none text-sm placeholder-slate-500 font-semibold"
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
                <div key={t.id} className="p-4 bg-slate-900/40 rounded-xl flex items-center justify-between border border-slate-900/60">
                  <div>
                    <span className="text-xs text-slate-500 font-mono block mb-1">{t.id}</span>
                    <p className="font-semibold text-sm text-slate-200">{t.subject}</p>
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
            turfs={sampleTurfs}
            isDarkMode={isDarkMode}
            onSelectTurf={(turf) => {
              setSelectedTurf(turf);
              setActiveTab('explore');
              setBookingStep('details');
              setSelectedTime(null);
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
              className={`absolute top-4 right-4 text-2xl transition-colors ${
                isDarkMode ? 'text-emerald-400/70 hover:text-emerald-400' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              &times;
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

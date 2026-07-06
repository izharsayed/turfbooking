import { useState } from 'react';
import { useAuthStore } from './store/authStore.js';
import { useThemeStore } from './store/themeStore.js';
import { Button } from '@turf-booking/ui';
import { formatCurrency } from '@turf-booking/utils';
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  LogOut,
  Moon,
  Sun,
  CheckCircle
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
}

const sampleTurfs: Turf[] = [
  {
    id: '1',
    name: 'Old Trafford Arena',
    description: 'Premier indoor turf with professional lighting, FIFA-grade grass pitch, and standard changing rooms.',
    city: 'Mumbai',
    area: 'Andheri West',
    price: 1200,
    sport: 'Football',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=60',
    amenities: ['Washroom', 'Parking', 'Flood Lights', 'Changing Room']
  },
  {
    id: '2',
    name: 'Lords Cricket Club',
    description: 'Elite net facility equipped with bowling machine, turf pitch, and expert coach analysis.',
    city: 'Mumbai',
    area: 'Bandra East',
    price: 1500,
    sport: 'Cricket',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1531415080290-bc9854503f37?w=600&auto=format&fit=crop&q=60',
    amenities: ['Drinking Water', 'Equipment Rental', 'Locker']
  },
  {
    id: '3',
    name: 'Wembley Futsal Dome',
    description: 'Indoor box cricket and football field with state-of-the-art turf structure.',
    city: 'Delhi',
    area: 'Dwarka Sector 10',
    price: 1000,
    sport: 'Box Cricket',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=600&auto=format&fit=crop&q=60',
    amenities: ['Washroom', 'WiFi', 'Parking']
  }
];

export default function App() {
  const { isAuthenticated, user, login, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  const [activeTab, setActiveTab] = useState<'explore' | 'bookings' | 'support'>('explore');
  const [selectedTurf, setSelectedTurf] = useState<Turf | null>(null);
  const [bookingStep, setBookingStep] = useState<'details' | 'checkout' | 'success'>('details');
  const [selectedDate, setSelectedDate] = useState('2026-07-05');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  // Booking details
  const [bookings, setBookings] = useState<any[]>([
    {
      id: 'B-88392',
      turfName: 'Old Trafford Arena',
      date: '2026-07-06',
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

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
      login({ id: 'USR-101', email, name: email.split('@')[0], role: 'CUSTOMER' }, 'dummy_token');
    } else {
      login({ id: 'USR-101', email, name, role: 'CUSTOMER' }, 'dummy_token');
    }
    setAuthMode(null);
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
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Header */}
      <header className={`border-b sticky top-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md ${isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
            T
          </div>
          <span className={`text-xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>TurfBook</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
          <button onClick={() => { setActiveTab('explore'); setSelectedTurf(null); }} className={`transition-colors ${activeTab === 'explore' ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'}`}>
            Explore
          </button>
          <button onClick={() => { setActiveTab('bookings'); setSelectedTurf(null); }} className={`transition-colors ${activeTab === 'bookings' ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'}`}>
            My Bookings
          </button>
          <button onClick={() => { setActiveTab('support'); setSelectedTurf(null); }} className={`transition-colors ${activeTab === 'support' ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'}`}>
            Support Help
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className={`p-2 rounded-lg border ${isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-emerald-400">Hi, {user?.name}</span>
              <button onClick={logout} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setAuthMode('login')}>Login</Button>
              <Button variant="primary" onClick={() => setAuthMode('register')}>Sign Up</Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        
        {/* Tab 1: Explore & Search */}
        {activeTab === 'explore' && !selectedTurf && (
          <div>
            {/* Hero banner */}
            <div className="text-center max-w-3xl mx-auto mt-12 mb-16">
              <h1 className={`text-4xl md:text-5xl font-extrabold tracking-tight mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Book Your Favorite <span className="text-emerald-400">Sports Turf</span> Instantly
              </h1>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                Choose from verified pitches, indoor domes, and premium boxes. Filter, select slots, and confirm within seconds.
              </p>

              {/* Filters */}
              <div className={`border rounded-xl p-3 flex flex-col md:flex-row gap-3 shadow-2xl ${isDarkMode ? 'bg-slate-905 border-slate-850' : 'bg-white border-slate-200'}`}>
                <div className="flex-1 flex items-center gap-2 px-3">
                  <Search className="text-slate-500 h-5 w-5 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by arena name or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-sm text-slate-100 placeholder-slate-500"
                  />
                </div>
                <div className="flex gap-2">
                  {['All', 'Football', 'Cricket', 'Box Cricket'].map((sport) => (
                    <button
                      key={sport}
                      onClick={() => setSelectedSport(sport)}
                      className={`text-xs px-3 py-2 rounded-lg font-bold transition-all ${selectedSport === sport ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25' : 'bg-slate-800 text-slate-300'}`}
                    >
                      {sport}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List */}
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-6">Available Arenas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTurfs.map((turf) => (
                  <div key={turf.id} className={`border rounded-xl overflow-hidden shadow-xl flex flex-col ${isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'} transition-all`}>
                    <div className="h-48 bg-slate-800 relative">
                      <img src={turf.image} alt={turf.name} className="w-full h-full object-cover" />
                      <span className="absolute top-3 left-3 bg-emerald-500 text-slate-950 font-bold text-xs px-2.5 py-1 rounded-lg">
                        {turf.sport}
                      </span>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-extrabold text-lg leading-tight">{turf.name}</h3>
                          <span className="text-emerald-400 font-bold text-sm flex items-center gap-1">★ {turf.rating}</span>
                        </div>
                        <p className="text-sm text-slate-400 flex items-center gap-1 mb-4">
                          <MapPin className="h-4 w-4 text-slate-500" /> {turf.area}, {turf.city}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800">
                        <div>
                          <span className="text-xs text-slate-500 block">Starting at</span>
                          <span className="text-lg font-black">{formatCurrency(turf.price)}/hr</span>
                        </div>
                        <Button variant="outline" onClick={() => { setSelectedTurf(turf); setBookingStep('details'); setSelectedTime(null); }}>
                          Book Slot
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Selected Turf Detail Drawer/Modal view */}
        {selectedTurf && (
          <div className={`border rounded-xl p-8 max-w-4xl mx-auto shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            {bookingStep !== 'success' && (
              <button onClick={() => setSelectedTurf(null)} className="text-xs text-emerald-400 hover:underline mb-4 block">
                &larr; Back to Listings
              </button>
            )}

            {bookingStep === 'details' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <img src={selectedTurf.image} alt={selectedTurf.name} className="w-full h-64 object-cover rounded-lg mb-4" />
                  <h2 className="text-3xl font-extrabold mb-2">{selectedTurf.name}</h2>
                  <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold inline-block mb-4">
                    {selectedTurf.sport}
                  </span>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    {selectedTurf.description}
                  </p>
                  <h4 className="font-bold text-sm mb-2">Amenities Included:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTurf.amenities.map((a) => (
                      <span key={a} className="text-xs bg-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={`p-6 border rounded-xl ${isDarkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-100 border-slate-200'}`}>
                  <h3 className="font-extrabold text-xl mb-4">Select Slot</h3>
                  
                  <div className="mb-4">
                    <label className="text-xs text-slate-500 block mb-2">Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-slate-800 text-white rounded-lg p-2 border-0 outline-none text-sm"
                    />
                  </div>

                  <label className="text-xs text-slate-500 block mb-2">Available Slots</label>
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {['16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00'].map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`text-xs p-3 rounded-lg border transition-all ${selectedTime === time ? 'border-emerald-400 bg-emerald-400/10 text-emerald-400 font-bold' : 'border-slate-800 bg-slate-800 hover:border-slate-700'}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mb-6">
                    <span className="text-sm text-slate-500">Hourly Rate</span>
                    <span className="font-black text-xl">{formatCurrency(selectedTurf.price)}</span>
                  </div>

                  <Button
                    variant="primary"
                    className="w-full"
                    disabled={!selectedTime}
                    onClick={() => setBookingStep('checkout')}
                  >
                    Proceed to checkout
                  </Button>
                </div>
              </div>
            )}

            {bookingStep === 'checkout' && (
              <div className="max-w-md mx-auto">
                <h3 className="font-extrabold text-2xl mb-6 text-center">Confirm & Pay</h3>
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 mb-6">
                  <div className="flex justify-between mb-3 text-sm">
                    <span className="text-slate-500">Arena</span>
                    <span className="font-semibold">{selectedTurf.name}</span>
                  </div>
                  <div className="flex justify-between mb-3 text-sm">
                    <span className="text-slate-500">Slot</span>
                    <span className="font-semibold">{selectedDate} at {selectedTime}</span>
                  </div>
                  <div className="flex justify-between mb-3 text-sm">
                    <span className="text-slate-500">Sport</span>
                    <span className="font-semibold">{selectedTurf.sport}</span>
                  </div>
                  <hr className="border-slate-800 my-4" />
                  <div className="flex justify-between text-base font-black">
                    <span>Total Amount</span>
                    <span className="text-emerald-400">{formatCurrency(selectedTurf.price)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button variant="primary" className="w-full gap-2" onClick={handleBookSlot}>
                    Pay Now via Razorpay
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setBookingStep('details')}>
                    Go Back
                  </Button>
                </div>
              </div>
            )}

            {bookingStep === 'success' && (
              <div className="text-center py-12 max-w-sm mx-auto">
                <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-6" />
                <h3 className="font-extrabold text-3xl mb-3">Booking Confirmed!</h3>
                <p className="text-slate-400 text-sm mb-8">
                  Your turf booking has been successfully finalized. You can find detail reports and receipts inside the bookings tab.
                </p>
                <Button variant="primary" className="w-full" onClick={() => { setActiveTab('bookings'); setSelectedTurf(null); }}>
                  Go to Bookings
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Bookings History */}
        {activeTab === 'bookings' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold mb-8">My Booking History</h2>
            <div className="space-y-4">
              {bookings.map((b) => (
                <div key={b.id} className={`p-6 border rounded-xl flex items-center justify-between ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-slate-800 px-2 py-1 rounded font-mono text-slate-400">{b.id}</span>
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded font-bold">{b.status}</span>
                    </div>
                    <h3 className="font-extrabold text-lg mb-1">{b.turfName}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" /> {b.date} &nbsp;
                      <Clock className="h-3.5 w-3.5 text-slate-500" /> {b.time}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black block mb-2">{formatCurrency(b.amount)}</span>
                    <button className="text-xs text-rose-500 hover:underline">Cancel Booking</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Support Help */}
        {activeTab === 'support' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold mb-8">Customer Support</h2>

            <form onSubmit={handleRaiseTicket} className={`p-6 border rounded-xl mb-8 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="font-bold text-lg mb-4">Raise New Ticket</h3>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Summarize your issue (e.g., Slot mismatch, refund status)..."
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  className="w-full bg-slate-800 text-white rounded-lg p-3 border-0 outline-none text-sm"
                  required
                />
              </div>
              <Button type="submit" variant="primary">Submit Ticket</Button>
            </form>

            <h3 className="font-bold text-lg mb-4">Active Tickets</h3>
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="p-4 bg-slate-900/50 rounded-lg flex items-center justify-between border border-slate-800">
                  <div>
                    <span className="text-xs text-slate-500 font-mono block mb-1">{t.id}</span>
                    <p className="font-semibold text-sm">{t.subject}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${t.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Auth Modal Overlay */}
      {authMode && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full relative">
            <button onClick={() => setAuthMode(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl">
              &times;
            </button>
            <h3 className="text-2xl font-extrabold mb-6 text-center">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h3>
            
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-800 text-white rounded-lg p-2.5 border-0 outline-none text-sm"
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-slate-500 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 text-white rounded-lg p-2.5 border-0 outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 text-white rounded-lg p-2.5 border-0 outline-none text-sm"
                />
              </div>
              <Button type="submit" variant="primary" className="w-full mt-4">
                {authMode === 'login' ? 'Login' : 'Sign Up'}
              </Button>
            </form>

            <p className="text-xs text-slate-500 text-center mt-6">
              {authMode === 'login' ? "Don't have an account? " : 'Already registered? '}
              <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-emerald-400 underline font-semibold">
                {authMode === 'login' ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 text-center text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
          <span className="text-white font-bold">TurfBook Systems</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Refund Policy</a>
          </div>
        </div>
        &copy; {new Date().getFullYear()} TurfBook. All rights reserved.
      </footer>
    </div>
  );
}

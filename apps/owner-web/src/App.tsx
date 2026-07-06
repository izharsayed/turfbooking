import { useState } from 'react';
import { Button } from '@turf-booking/ui';
import { formatCurrency } from '@turf-booking/utils';
import {
  LayoutDashboard,
  ShieldAlert,
  CalendarDays,
  DollarSign,
  TrendingUp,
  MapPin,
  Clock,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sliders,
  Settings,
  LogOut,
  User,
  Phone
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

interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  turfName: string;
  date: string;
  timeSlot: string;
  sport: string;
  amount: number;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}

interface Slot {
  id: string;
  time: string;
  day: string; // e.g. "Monday", "Tuesday"
  price: number;
  status: 'OPEN' | 'BOOKED' | 'BLOCKED';
  blockReason?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'turfs' | 'slots' | 'bookings'>('overview');

  // Sample Turfs under Owner Management (placed in Ahmednagar, Maharashtra)
  const [ownerTurfs, setOwnerTurfs] = useState<Turf[]>([
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
  ]);

  // Bookings list state
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 'B-1002',
      customerName: 'Rahul Shinde',
      customerPhone: '9822334455',
      turfName: 'Old Trafford Arena',
      date: '2026-07-06',
      timeSlot: '17:00 - 18:00',
      sport: 'Football',
      amount: 1200,
      status: 'CONFIRMED'
    },
    {
      id: 'B-1003',
      customerName: 'Amit Patil',
      customerPhone: '9088776655',
      turfName: 'Camp Nou Arena',
      date: '2026-07-06',
      timeSlot: '18:00 - 19:00',
      sport: 'Football',
      amount: 1800,
      status: 'COMPLETED'
    },
    {
      id: 'B-1004',
      customerName: 'Vikas Kale',
      customerPhone: '9122334455',
      turfName: 'Old Trafford Arena',
      date: '2026-07-07',
      timeSlot: '08:00 - 09:00',
      sport: 'Football',
      amount: 1200,
      status: 'CONFIRMED'
    }
  ]);

  // Slots State
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hourlySlots = ['07:00 - 08:00', '08:00 - 09:00', '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00', '20:00 - 21:00'];

  const initialSlots: Slot[] = [];
  daysOfWeek.forEach(day => {
    hourlySlots.forEach((time, index) => {
      initialSlots.push({
        id: `${day}-${index}`,
        time,
        day,
        price: 1200,
        status: index % 4 === 0 ? 'BOOKED' : index % 6 === 0 ? 'BLOCKED' : 'OPEN',
        blockReason: index % 6 === 0 ? 'Scheduled maintenance check' : undefined
      });
    });
  });

  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('Monday');

  // Add Turf Form States
  const [isAddingTurf, setIsAddingTurf] = useState(false);
  const [editingTurfId, setEditingTurfId] = useState<string | null>(null);
  const [turfName, setTurfName] = useState('');
  const [turfDesc, setTurfDesc] = useState('');
  const [turfArea, setTurfArea] = useState('Savedi');
  const [turfPrice, setTurfPrice] = useState(1200);
  const [turfSport, setTurfSport] = useState('Football');
  const [turfLat, setTurfLat] = useState(19.0948);
  const [turfLng, setTurfLng] = useState(74.7480);
  const [turfImage, setTurfImage] = useState('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=60');

  // Manual Booking States
  const [isAddingBooking, setIsAddingBooking] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualTurf, setManualTurf] = useState('Old Trafford Arena');
  const [manualDate, setManualDate] = useState('2026-07-06');
  const [manualSlot, setManualSlot] = useState('17:00 - 18:00');

  // Calculate Metrics
  const totalRevenue = bookings
    .filter(b => b.status !== 'CANCELLED')
    .reduce((sum, b) => sum + b.amount, 0);

  const bookingsToday = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED').length;
  const activeTurfsCount = ownerTurfs.length;
  const totalSlotsCount = slots.length;
  const bookedSlotsCount = slots.filter(s => s.status === 'BOOKED').length;
  const fillRate = Math.round((bookedSlotsCount / totalSlotsCount) * 100) || 0;

  // Add/Edit Turf Handlers
  const handleSaveTurf = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTurfId) {
      setOwnerTurfs(ownerTurfs.map(t => t.id === editingTurfId ? {
        ...t,
        name: turfName,
        description: turfDesc,
        area: turfArea,
        price: Number(turfPrice),
        sport: turfSport,
        lat: Number(turfLat),
        lng: Number(turfLng),
        image: turfImage
      } : t));
      setEditingTurfId(null);
    } else {
      const newTurf: Turf = {
        id: `T-${Math.floor(100 + Math.random() * 900)}`,
        name: turfName,
        description: turfDesc,
        city: 'Ahmednagar',
        area: turfArea,
        price: Number(turfPrice),
        sport: turfSport,
        rating: 5.0,
        image: turfImage,
        amenities: ['Washroom', 'Parking', 'Flood Lights'],
        lat: Number(turfLat),
        lng: Number(turfLng)
      };
      setOwnerTurfs([...ownerTurfs, newTurf]);
    }
    // Clear forms
    setTurfName('');
    setTurfDesc('');
    setIsAddingTurf(false);
  };

  const handleEditClick = (turf: Turf) => {
    setEditingTurfId(turf.id);
    setTurfName(turf.name);
    setTurfDesc(turf.description);
    setTurfArea(turf.area);
    setTurfPrice(turf.price);
    setTurfSport(turf.sport);
    setTurfLat(turf.lat);
    setTurfLng(turf.lng);
    setTurfImage(turf.image);
    setIsAddingTurf(true);
  };

  const handleDeleteTurf = (id: string) => {
    if (confirm('Are you sure you want to delete this turf listing?')) {
      setOwnerTurfs(ownerTurfs.filter(t => t.id !== id));
    }
  };

  // Toggle Slot Status Handler
  const toggleSlotStatus = (id: string) => {
    setSlots(slots.map(s => {
      if (s.id === id) {
        let nextStatus: 'OPEN' | 'BOOKED' | 'BLOCKED' = 'OPEN';
        if (s.status === 'OPEN') nextStatus = 'BLOCKED';
        else if (s.status === 'BLOCKED') nextStatus = 'OPEN';
        return {
          ...s,
          status: nextStatus,
          blockReason: nextStatus === 'BLOCKED' ? 'Closed for maintenance' : undefined
        };
      }
      return s;
    }));
  };

  // Create Manual Booking Handler
  const handleSaveManualBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const turf = ownerTurfs.find(t => t.name === manualTurf);
    const newBooking: Booking = {
      id: `B-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: manualName,
      customerPhone: manualPhone,
      turfName: manualTurf,
      date: manualDate,
      timeSlot: manualSlot,
      sport: turf?.sport || 'Football',
      amount: turf?.price || 1200,
      status: 'CONFIRMED'
    };
    setBookings([newBooking, ...bookings]);
    setIsAddingBooking(false);
    setManualName('');
    setManualPhone('');
  };

  const handleCancelBooking = (id: string) => {
    if (confirm('Cancel this confirmed booking? Refund workflow will be initialized.')) {
      setBookings(bookings.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b));
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col md:flex-row transition-colors duration-300">
      
      {/* Sidebar Navigation Panel (glassmorphism look) */}
      <aside className="w-full md:w-64 bg-[#090d1a]/85 border-b md:border-b-0 md:border-r border-slate-800/80 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          
          {/* Logo & Header */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-450 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-emerald-500/20">
              T
            </div>
            <div>
              <span className="text-lg font-black tracking-tight block">TurfBook</span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Owner Panel</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1.5">
            {[
              { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'turfs', label: 'My Turfs', icon: Sliders },
              { id: 'slots', label: 'Slot Manager', icon: Clock },
              { id: 'bookings', label: 'Bookings Log', icon: CalendarDays }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id as any); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-slate-850 mt-8 md:mt-0 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs uppercase">
              OP
            </div>
            <div>
              <span className="text-xs font-bold block text-slate-200">Owner Profile</span>
              <span className="text-[10px] text-slate-500 block">Active Manager</span>
            </div>
          </div>
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-rose-400 hover:text-rose-350 hover:bg-rose-500/5 transition-all">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 overflow-x-hidden">
        
        {/* SUBVIEW 1: OVERVIEW DASHBOARD */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-black tracking-tight">Overview Dashboard</h1>
                <p className="text-sm text-slate-400">Real-time financials and turf schedules.</p>
              </div>
              <Button onClick={() => setActiveTab('bookings')} variant="outline" className="border-slate-800 text-slate-300">View Bookings</Button>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, change: '+18.4% this week', color: 'text-emerald-400' },
                { label: 'Bookings Today', value: bookingsToday, icon: CalendarDays, change: '+12% from yesterday', color: 'text-blue-400' },
                { label: 'Manage Turfs', value: activeTurfsCount, icon: Sliders, change: 'All locations active', color: 'text-purple-400' },
                { label: 'Slot Fill Rate', value: `${fillRate}%`, icon: TrendingUp, change: '+4.2% average growth', color: 'text-amber-400' }
              ].map(stat => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-[#090d1a]/45 border border-slate-850 rounded-2xl p-6 shadow-xl flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                      <p className="text-2xl font-black">{stat.value}</p>
                      <span className="text-[10px] text-slate-500 font-semibold">{stat.change}</span>
                    </div>
                    <div className={`p-3 bg-slate-900/50 rounded-xl border border-slate-800 ${stat.color}`}>
                      <Icon className="h-5.5 w-5.5" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Layout analytics charts & tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Revenue Mock Graph card */}
              <div className="lg:col-span-2 bg-[#090d1a]/20 border border-slate-850 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <TrendingUp className="h-4.5 w-4.5 text-emerald-400" /> Hourly Fill Rate Analytics
                  </h3>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Weekly Tracker</span>
                </div>

                <div className="h-64 flex items-end justify-between pt-6 px-4">
                  {[45, 55, 30, 80, 95, 65, 85].map((val, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 w-full">
                      <div className="w-8 bg-emerald-500/10 border border-emerald-500/20 rounded-t-lg relative transition-all duration-500 hover:bg-emerald-500/20" style={{ height: `${val * 2}px` }}>
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-emerald-400">{val}%</div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Status Sidebar */}
              <div className="bg-[#090d1a]/20 border border-slate-850 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-bold text-base">Quick Status</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl">
                    <span className="text-[10px] font-bold text-emerald-400 block mb-1">ACTIVE SLOT SCHEDULER</span>
                    <p className="text-sm font-semibold">{slots.filter(s => s.status === 'OPEN').length} slots open for bookings</p>
                  </div>
                  <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl">
                    <span className="text-[10px] font-bold text-amber-400 block mb-1">MAINTENANCE BLOCKS</span>
                    <p className="text-sm font-semibold">{slots.filter(s => s.status === 'BLOCKED').length} slots blocked for cleaning</p>
                  </div>
                  <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl">
                    <span className="text-[10px] font-bold text-blue-400 block mb-1">LOCATIONS STATUS</span>
                    <p className="text-sm font-semibold">Ahmednagar: 2 active venues</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW 2: TURF MANAGEMENT */}
        {activeTab === 'turfs' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-black tracking-tight">My Turf Listings</h1>
                <p className="text-sm text-slate-400">Add, edit, or configure your physical sports pitches.</p>
              </div>
              <button
                onClick={() => {
                  setEditingTurfId(null);
                  setIsAddingTurf(!isAddingTurf);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/25"
              >
                <Plus className="h-4 w-4" /> Add New Turf
              </button>
            </div>

            {/* Add/Edit Turf Modal Drawer */}
            {isAddingTurf && (
              <form onSubmit={handleSaveTurf} className="p-6 border border-slate-850 bg-[#090d1a]/50 rounded-3xl space-y-6 shadow-xl max-w-2xl">
                <h3 className="text-lg font-bold text-emerald-400 border-b border-slate-800 pb-2">
                  {editingTurfId ? 'Modify Turf Details' : 'Register New Turf Arena'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-450 uppercase block">Turf Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Old Trafford Arena"
                      value={turfName}
                      onChange={(e) => setTurfName(e.target.value)}
                      className="w-full bg-[#030712] text-slate-100 placeholder-slate-650 rounded-xl p-3 border border-slate-800 focus:border-emerald-500/50 outline-none text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-455 uppercase block">Hourly Price Rate (₹)</label>
                    <input
                      type="number"
                      required
                      value={turfPrice}
                      onChange={(e) => setTurfPrice(Number(e.target.value))}
                      className="w-full bg-[#030712] text-slate-100 placeholder-slate-650 rounded-xl p-3 border border-slate-800 focus:border-emerald-500/50 outline-none text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-450 uppercase block">Description</label>
                  <textarea
                    required
                    placeholder="Enter specs, dimensions, lighting standard..."
                    value={turfDesc}
                    onChange={(e) => setTurfDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-[#030712] text-slate-100 placeholder-slate-650 rounded-xl p-3 border border-slate-800 focus:border-emerald-500/50 outline-none text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-450 uppercase block">Sport Category</label>
                    <select
                      value={turfSport}
                      onChange={(e) => setTurfSport(e.target.value)}
                      className="w-full bg-[#030712] text-slate-100 rounded-xl p-3 border border-slate-800 focus:border-emerald-500/50 outline-none text-sm font-semibold"
                    >
                      <option value="Football">Football</option>
                      <option value="Cricket">Cricket</option>
                      <option value="Box Cricket">Box Cricket</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-450 uppercase block">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={turfLat}
                      onChange={(e) => setTurfLat(Number(e.target.value))}
                      className="w-full bg-[#030712] text-slate-100 rounded-xl p-3 border border-slate-800 focus:border-emerald-500/50 outline-none text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-450 uppercase block">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={turfLng}
                      onChange={(e) => setTurfLng(Number(e.target.value))}
                      className="w-full bg-[#030712] text-slate-100 rounded-xl p-3 border border-slate-800 focus:border-emerald-500/50 outline-none text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-850">
                  <Button type="submit" variant="primary">Save Changes</Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddingTurf(false)} className="border-slate-800 text-slate-400">Cancel</Button>
                </div>
              </form>
            )}

            {/* Turfs List Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownerTurfs.map((turf) => (
                <div
                  key={turf.id}
                  className="bg-[#090d1a]/30 border border-slate-850 rounded-3xl overflow-hidden shadow-xl flex flex-col group hover:shadow-emerald-500/[0.05] transition-all duration-300"
                >
                  <div className="h-44 w-full overflow-hidden relative">
                    <img src={turf.image} alt={turf.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <span className="absolute top-4 left-4 text-[10px] font-black uppercase tracking-wider bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full backdrop-blur-md">
                      {turf.sport}
                    </span>
                    <span className="absolute top-4 right-4 text-[10px] font-bold bg-slate-900/80 text-amber-400 px-3 py-1 rounded-full backdrop-blur-md">
                      ★ {turf.rating}
                    </span>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-white">{turf.name}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{turf.description}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-450">
                        <MapPin className="h-3.5 w-3.5 text-emerald-450" />
                        <span>{turf.area}, {turf.city}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-850 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Hourly Rate</span>
                        <span className="text-lg font-black text-white">{formatCurrency(turf.price)}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(turf)}
                          className="p-2 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:text-emerald-400 text-slate-400 transition-colors"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTurf(turf.id)}
                          className="p-2 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBVIEW 3: SLOT MANAGEMENT */}
        {activeTab === 'slots' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Time Slot Planner</h1>
              <p className="text-sm text-slate-400">Configure booking availabilities and block periods for maintenance.</p>
            </div>

            {/* Filter by Day */}
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDayFilter(day)}
                  className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    selectedDayFilter === day
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                      : 'bg-slate-900 border border-slate-850 hover:bg-slate-850'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Slots Grid */}
            <div className="bg-[#090d1a]/20 border border-slate-850 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-850 pb-4">
                <h3 className="font-bold text-base uppercase tracking-wider text-slate-400">
                  Slots Schedule for <span className="text-emerald-400">{selectedDayFilter}</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-bold">CLICK CARD TO TOGGLE STATE</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {slots
                  .filter(s => s.day === selectedDayFilter)
                  .map(slot => (
                    <button
                      key={slot.id}
                      onClick={() => toggleSlotStatus(slot.id)}
                      className={`p-4 rounded-2xl text-left border flex flex-col justify-between h-28 transition-all hover:scale-[1.01] ${
                        slot.status === 'BOOKED'
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                          : slot.status === 'BLOCKED'
                          ? 'bg-rose-500/5 border-rose-500/20 text-rose-400'
                          : 'bg-slate-900/30 border-slate-850 text-slate-300 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm font-black">{slot.time}</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          slot.status === 'BOOKED'
                            ? 'bg-emerald-500/10'
                            : slot.status === 'BLOCKED'
                            ? 'bg-rose-500/10'
                            : 'bg-slate-800'
                        }`}>
                          {slot.status}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] block font-bold text-slate-400">{formatCurrency(slot.price)}/hr</span>
                        {slot.blockReason && (
                          <span className="text-[9px] block text-rose-300/80 truncate w-full">{slot.blockReason}</span>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW 4: BOOKINGS LOG */}
        {activeTab === 'bookings' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-black tracking-tight">Bookings Reservation Log</h1>
                <p className="text-sm text-slate-400">Track player schedules, handle cancellations, or insert manual bookings.</p>
              </div>
              <button
                onClick={() => setIsAddingBooking(!isAddingBooking)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-440 text-slate-950 font-bold rounded-xl text-sm transition-all"
              >
                <Plus className="h-4 w-4" /> Book Offline Slot
              </button>
            </div>

            {/* Offline Booking Form */}
            {isAddingBooking && (
              <form onSubmit={handleSaveManualBooking} className="p-6 border border-slate-850 bg-[#090d1a]/50 rounded-3xl space-y-6 shadow-xl max-w-xl">
                <h3 className="text-lg font-bold text-emerald-400 border-b border-slate-850 pb-2">Manual Booking Details</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block">Player Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="w-full bg-[#030712] text-slate-100 placeholder-slate-600 rounded-xl p-3.5 border border-slate-800 outline-none text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="98XXXXXXXX"
                      pattern="[0-9]{10}"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full bg-[#030712] text-slate-100 placeholder-slate-600 rounded-xl p-3.5 border border-slate-800 outline-none text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block">Turf Venue</label>
                    <select
                      value={manualTurf}
                      onChange={(e) => setManualTurf(e.target.value)}
                      className="w-full bg-[#030712] text-slate-100 rounded-xl p-3.5 border border-slate-800 outline-none text-sm font-semibold"
                    >
                      {ownerTurfs.map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block">Select Date</label>
                    <input
                      type="date"
                      required
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="w-full bg-[#030712] text-slate-100 rounded-xl p-3.5 border border-slate-800 outline-none text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block">Select Slot</label>
                    <select
                      value={manualSlot}
                      onChange={(e) => setManualSlot(e.target.value)}
                      className="w-full bg-[#030712] text-slate-100 rounded-xl p-3.5 border border-slate-800 outline-none text-sm font-semibold"
                    >
                      {hourlySlots.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-850">
                  <Button type="submit" variant="primary">Confirm Booking</Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddingBooking(false)} className="border-slate-800 text-slate-400">Cancel</Button>
                </div>
              </form>
            )}

            {/* Bookings log table */}
            <div className="bg-[#090d1a]/20 border border-slate-850 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-855 bg-slate-900/40 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <th className="p-4 pl-6">Booking ID</th>
                      <th className="p-4">Customer Details</th>
                      <th className="p-4">Turf Name / Sport</th>
                      <th className="p-4">Date / Time Slot</th>
                      <th className="p-4">Paid Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40 text-sm">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-slate-900/10 transition-colors">
                        <td className="p-4 pl-6 font-mono text-xs text-slate-500">{booking.id}</td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="font-bold block text-slate-200">{booking.customerName}</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Phone className="h-3 w-3 text-slate-500" /> {booking.customerPhone}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="font-semibold block text-slate-350">{booking.turfName}</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">{booking.sport}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="font-semibold block">{booking.date}</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-slate-500" /> {booking.timeSlot}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-200">{formatCurrency(booking.amount)}</td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                            booking.status === 'CONFIRMED'
                              ? 'bg-emerald-500/10 text-emerald-450'
                              : booking.status === 'COMPLETED'
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'bg-rose-500/10 text-rose-455'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="p-4 text-right pr-6">
                          {booking.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="text-xs font-bold text-rose-400 hover:text-rose-350 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

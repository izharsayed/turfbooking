import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

// Inlined from @turf-booking/ui
function Button({ children, onClick, className = '', variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) {
  return <button onClick={onClick} className={className} {...props}>{children}</button>;
}

// Inlined from @turf-booking/utils
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

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
  HelpCircle,
  Sliders,
  LogOut,
  User,
  Phone,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  CloudRain,
  Settings
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
  rentedAddons?: string[];
}

interface Slot {
  id: string;
  time: string;
  day: string; // e.g. "Monday", "Tuesday"
  price: number;
  status: 'OPEN' | 'BOOKED' | 'BLOCKED';
  blockReason?: string;
}

interface Review {
  id: string;
  customerName: string;
  turfName: string;
  rating: number;
  comment: string;
  date: string;
  ownerReply?: string;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
}

export default function App() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'turfs' | 'slots' | 'bookings' | 'reviews' | 'staff' | 'settings'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Configuration settings state
  const [companyName, setCompanyName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessRegisterNumber, setBusinessRegisterNumber] = useState('');
  const [billingEmail, setBillingEmail] = useState('');

  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [businessUpiId, setBusinessUpiId] = useState('');
  const [advancePaymentPercent, setAdvancePaymentPercent] = useState(30);
  const [convenienceFee, setConvenienceFee] = useState(45);
  const [taxRate, setTaxRate] = useState(18);
  const [onlinePaymentsEnabled, setOnlinePaymentsEnabled] = useState(true);

  const [autoCancellationLimit, setAutoCancellationLimit] = useState(5);
  const [openingTime, setOpeningTime] = useState('06:00');
  const [closingTime, setClosingTime] = useState('23:00');
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState(true);
  const [emailReceiptsEnabled, setEmailReceiptsEnabled] = useState(true);

  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Loading and Error States for API
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Turfs under Owner Management
  const [ownerTurfs, setOwnerTurfs] = useState<Turf[]>([]);

  // Bookings list state
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Reviews State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [replyText, setReplyText] = useState<{ [reviewId: string]: string }>({});

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayToDateMap: Record<string, string> = {
    Monday: '2026-07-06',
    Tuesday: '2026-07-07',
    Wednesday: '2026-07-08',
    Thursday: '2026-07-09',
    Friday: '2026-07-10',
    Saturday: '2026-07-11',
    Sunday: '2026-07-12'
  };
  const hourlySlots = Array.from({ length: 24 }, (_, i) => {
    const start = String(i).padStart(2, '0');
    const end = String((i + 1) % 24 === 0 ? 24 : (i + 1) % 24).padStart(2, '0');
    return `${start}:00 - ${end}:00`;
  });

  // Fetch Data from Backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [turfsRes, bookingsRes, reviewsRes, profileRes] = await Promise.all([
          api.get('/owner/turfs'),
          api.get('/owner/bookings'),
          api.get('/owner/reviews'),
          api.get('/owner/profile')
        ]);

        const backendTurfs = turfsRes.data?.data || [];
        const backendBookings = bookingsRes.data?.data || [];
        const backendReviews = reviewsRes.data?.data || [];
        
        const profileData = profileRes.data?.data || {};
        const op = profileData.ownerProfile || {};
        const u = profileData.user || {};

        setCompanyName(op.companyName || u.name || '');
        setBusinessAddress(op.businessAddress || '');
        setBusinessRegisterNumber(op.businessRegisterNumber || '');
        setBillingEmail(op.billingEmail || u.email || '');

        setRazorpayKeyId(op.razorpayKeyId || '');
        setRazorpayKeySecret(op.razorpayKeySecret || '');
        setBusinessUpiId(op.businessUpiId || '');
        setAdvancePaymentPercent(op.advancePaymentPercent || 30);
        setConvenienceFee(op.convenienceFee || 45);
        setTaxRate(op.taxRate || 18);
        setOnlinePaymentsEnabled(op.onlinePaymentsEnabled !== false);

        setAutoCancellationLimit(op.autoCancellationLimit || 5);
        setOpeningTime(op.openingTime || '06:00');
        setClosingTime(op.closingTime || '23:00');
        setSmsAlertsEnabled(op.smsAlertsEnabled !== false);
        setEmailReceiptsEnabled(op.emailReceiptsEnabled !== false);

        // Map turfs
        const mappedTurfs: Turf[] = backendTurfs.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description || '',
          city: t.location?.city || 'Ahmednagar',
          area: t.location?.area || 'Savedi',
          price: t.pricePerHour || 1200,
          sport: t.sports?.[0] || 'Football',
          rating: t.rating || 5.0,
          image: t.images?.[0] || 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&auto=format&fit=crop&q=60',
          amenities: t.amenities || ['Washroom', 'Parking', 'Flood Lights'],
          lat: t.location?.latitude || 19.0948,
          lng: t.location?.longitude || 74.7480
        }));

        // Map bookings
        const mappedBookings: Booking[] = backendBookings.map((b: any) => ({
          id: b.id,
          customerName: b.customerName || 'Offline Customer',
          customerPhone: b.customerPhone || '',
          turfName: b.turfName || (mappedTurfs.find(t => t.id === b.turfId)?.name || 'Ahmednagar Sports Arena'),
          date: b.date ? b.date.split('T')[0] : new Date().toISOString().split('T')[0],
          timeSlot: b.timeSlot || b.time || b.slotId || '17:00 - 18:00',
          sport: b.sport || 'Football',
          amount: b.totalAmount || b.amount || 1200,
          status: b.status || 'CONFIRMED',
          rentedAddons: b.rentedAddons || []
        }));

        // Map reviews
        const mappedReviews: Review[] = backendReviews.map((r: any) => ({
          id: r.id,
          customerName: r.customerName || 'Anonymous',
          turfName: r.turfName || (mappedTurfs.find(t => t.id === r.turfId)?.name || 'Old Trafford Arena'),
          rating: r.rating || 5,
          comment: r.comment || '',
          date: r.date || new Date().toISOString().split('T')[0],
          ownerReply: r.ownerReply
        }));

        setOwnerTurfs(mappedTurfs);
        setBookings(mappedBookings);
        setReviews(mappedReviews);
      } catch (err: any) {
        console.error('Error fetching owner data:', err);
        setApiError('Failed to load data from backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Slots State derived dynamically from Bookings & Turfs
  const slots = useMemo(() => {
    const normalizeSlot = (timeSlotStr: string): string => {
      if (!timeSlotStr) return '';
      const parts = timeSlotStr.split(' - ').map(s => s.trim());
      if (parts.length !== 2) return '';

      const toMinutes = (timeStr: string): number => {
        const is12Hour = timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm');
        if (is12Hour) {
          const [timePart, modifier] = timeStr.split(' ');
          let [hours, minutes] = timePart.split(':').map(Number);
          const ampm = modifier.toLowerCase();
          if (ampm === 'pm' && hours !== 12) hours += 12;
          if (ampm === 'am' && hours === 12) hours = 0;
          return hours * 60 + minutes;
        } else {
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + minutes;
        }
      };

      const startMin = toMinutes(parts[0]);
      const endMin = toMinutes(parts[1]);
      return `${startMin}-${endMin}`;
    };

    const list: Slot[] = [];
    daysOfWeek.forEach(day => {
      hourlySlots.forEach((time, index) => {
        const bookingDate = dayToDateMap[day];
        const isBooked = bookings.some(
          b => {
            const bDateStr = b.date;
            if (bDateStr !== bookingDate || b.status === 'CANCELLED') return false;

            const bSlot = b.timeSlot || '';
            const slots = bSlot.split(',').map((s: string) => s.trim());
            const targetNorm = normalizeSlot(time);
            return slots.some((s: string) => s && normalizeSlot(s) === targetNorm);
          }
        );

        list.push({
          id: `${day}-${index}`,
          time,
          day,
          price: ownerTurfs[0]?.price || 1200,
          status: isBooked ? 'BOOKED' : 'OPEN',
          blockReason: undefined
        });
      });
    });
    return list;
  }, [bookings, ownerTurfs]);

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

  // Dynamic Pricing States
  const [peakStartHour, setPeakStartHour] = useState(18); // 18:00 (6:00 PM)
  const [peakEndHour, setPeakEndHour] = useState(22); // 22:00 (10:00 PM)
  const [peakSurcharge, setPeakSurcharge] = useState(300); // +₹300
  const [weekendSurcharge, setWeekendSurcharge] = useState(200); // +₹200

  // Collapsible Dashboard Sections
  const [weeklyPerfOpen, setWeeklyPerfOpen] = useState(true);
  const [quickStatusOpen, setQuickStatusOpen] = useState(true);
  const [revDistOpen, setRevDistOpen] = useState(true);

  // Staff Management States
  const [userRole, setUserRole] = useState<'OWNER' | 'STAFF'>('OWNER');
  const [staffList, setStaffList] = useState<StaffMember[]>([
    { id: 'S-101', name: 'Amit R. - Groundkeeper', role: 'CARETAKER', phone: '9822998877' },
    { id: 'S-102', name: 'Vikram S. - Shift Supervisor', role: 'MANAGER', phone: '9922887766' }
  ]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('CARETAKER');
  const [newStaffPhone, setNewStaffPhone] = useState('');

  // Equipment / Add-on States
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const addonsCatalog = [
    { id: 'Match-grade Ball Rental', name: 'Match-grade Ball Rental', price: 100 },
    { id: 'Training Bibs (Set of 10)', name: 'Training Bibs (Set of 10)', price: 150 },
    { id: 'Cricket Kit Rental', name: 'Cricket Kit Rental', price: 300 },
    { id: 'Water Crate (12 bottles)', name: 'Water Crate (12 bottles)', price: 120 }
  ];

  // Calculate Metrics
  const totalRevenue = bookings
    .filter(b => b.status !== 'CANCELLED')
    .reduce((sum, b) => sum + b.amount, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const bookingsToday = bookings.filter(
    b => (b.status === 'CONFIRMED' || b.status === 'COMPLETED') && b.date === todayStr
  ).length;

  const activeTurfsCount = ownerTurfs.length;
  const totalSlotsCount = slots.length;
  const bookedSlotsCount = slots.filter(s => s.status === 'BOOKED').length;
  const fillRate = Math.round((bookedSlotsCount / totalSlotsCount) * 100) || 0;

  const realFillRates = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(dayName => {
    const daySlots = slots.filter(s => s.day === dayName);
    const total = daySlots.length;
    const booked = daySlots.filter(s => s.status === 'BOOKED').length;
    return total > 0 ? Math.round((booked / total) * 100) : 0;
  });
  const hasRealBookings = realFillRates.some(r => r > 0);
  const weeklyFillRates = hasRealBookings ? realFillRates : [45, 55, 30, 80, 95, 65, 85];

  // Add/Edit Turf Handlers
  const handleSaveTurf = async (e: React.FormEvent) => {
    e.preventDefault();
    const turfData = {
      name: turfName,
      description: turfDesc,
      address: "Savedi Road, Ahmednagar",
      latitude: Number(turfLat),
      longitude: Number(turfLng),
      pricePerHour: Number(turfPrice),
      cityId: "FVS82Xy9TSPMaR2445eX", // Ahmednagar City
      areaId: "9nVaAGTPMuCe1hjlkCoK", // Savedi Area
      sports: ["NHQKZB3YRCRhWBL95sUE"], // Football Sport
      amenities: ["Washroom", "Parking", "Flood Lights"]
    };

    try {
      if (editingTurfId) {
        const res = await api.put(`/owner/turfs/${editingTurfId}`, {
          name: turfName,
          description: turfDesc,
          pricePerHour: Number(turfPrice)
        });
        const updated = res.data.data;
        setOwnerTurfs(ownerTurfs.map(t => t.id === editingTurfId ? {
          ...t,
          name: updated.name,
          description: updated.description || '',
          price: updated.pricePerHour || 1200
        } : t));
        setEditingTurfId(null);
      } else {
        const res = await api.post('/owner/turfs', turfData);
        const created = res.data.data;
        const newTurf: Turf = {
          id: created.id,
          name: created.name,
          description: created.description || '',
          city: 'Ahmednagar',
          area: 'Savedi',
          price: created.pricePerHour || 1200,
          sport: 'Football',
          rating: 5.0,
          image: created.images?.[0] || 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&auto=format&fit=crop&q=60',
          amenities: created.amenities || ['Washroom', 'Parking', 'Flood Lights'],
          lat: created.location?.latitude || 19.0948,
          lng: created.location?.longitude || 74.7480
        };
        setOwnerTurfs([...ownerTurfs, newTurf]);
      }
      setTurfName('');
      setTurfDesc('');
      setIsAddingTurf(false);
    } catch (err) {
      console.error('Error saving turf:', err);
      alert('Failed to save turf.');
    }
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

  const handleDeleteTurf = async (id: string) => {
    if (confirm('Are you sure you want to delete this turf listing?')) {
      try {
        await api.delete(`/owner/turfs/${id}`);
        setOwnerTurfs(ownerTurfs.filter(t => t.id !== id));
      } catch (err) {
        console.error('Error deleting turf:', err);
        alert('Failed to delete turf.');
      }
    }
  };

  // Dynamic Pricing Surcharge Calculator
  const getCalculatedSlotPrice = (slot: Slot) => {
    let basePrice = 1200;
    
    // Find active turf matching slot time or use default
    const matchingTurf = ownerTurfs[0];
    if (matchingTurf) {
      basePrice = matchingTurf.price;
    }

    // Add weekend surcharge
    const isWeekend = slot.day === 'Saturday' || slot.day === 'Sunday';
    if (isWeekend) {
      basePrice += weekendSurcharge;
    }

    // Add peak hour surcharge (e.g. 18:00 to 22:00)
    const startHourPart = slot.time.split(':')[0];
    const hour = parseInt(startHourPart, 10);
    if (!isNaN(hour)) {
      if (hour >= peakStartHour && hour < peakEndHour) {
        basePrice += peakSurcharge;
      }
    }
    return basePrice;
  };

  // CSV Report Generator
  const handleDownloadCSV = async () => {
    try {
      const response = await api.get('/owner/reports?type=revenue&format=csv', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TurfBook_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading CSV:', err);
      alert('Failed to download report.');
    }
  };

  // Reviews Reply Save Handler
  const handleSaveReviewReply = async (reviewId: string) => {
    const reply = replyText[reviewId];
    if (!reply || !reply.trim()) return;
    try {
      await api.post(`/owner/reviews/${reviewId}/reply`, { reply });
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, ownerReply: reply } : r));
      setReplyText({ ...replyText, [reviewId]: '' });
    } catch (err) {
      console.error('Error saving reply:', err);
      alert('Failed to save reply.');
    }
  };

  // Staff Modification Handlers
  const handleAddStaffMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffPhone) return;
    const newStaff: StaffMember = {
      id: `S-${Math.floor(100 + Math.random() * 900)}`,
      name: `${newStaffName} - ${newStaffRole.charAt(0) + newStaffRole.slice(1).toLowerCase()}`,
      role: newStaffRole,
      phone: newStaffPhone
    };
    setStaffList([...staffList, newStaff]);
    setNewStaffName('');
    setNewStaffPhone('');
  };

  const handleDeleteStaff = (id: string) => {
    if (confirm('Remove this staff member from your venue directory?')) {
      setStaffList(staffList.filter(s => s.id !== id));
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess('');
    try {
      const payload = {
        companyName,
        businessAddress,
        businessRegisterNumber,
        billingEmail,
        razorpayKeyId,
        razorpayKeySecret,
        businessUpiId,
        advancePaymentPercent: Number(advancePaymentPercent),
        convenienceFee: Number(convenienceFee),
        taxRate: Number(taxRate),
        onlinePaymentsEnabled,
        autoCancellationLimit: Number(autoCancellationLimit),
        openingTime,
        closingTime,
        smsAlertsEnabled,
        emailReceiptsEnabled,
      };

      await api.put('/owner/profile', payload);
      setSettingsSuccess('Configuration settings saved successfully!');
      setTimeout(() => setSettingsSuccess(''), 4000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save configuration settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Toggle Slot Status Handler (available for future direct toggle UI)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _toggleSlotStatus = (id: string) => {
    // Left as stub
  };

  // Handle slot card click to open offline booking form
  const handleSlotClick = (slot: Slot) => {
    const dayToDateMap: Record<string, string> = {
      Monday: '2026-07-06',
      Tuesday: '2026-07-07',
      Wednesday: '2026-07-08',
      Thursday: '2026-07-09',
      Friday: '2026-07-10',
      Saturday: '2026-07-11',
      Sunday: '2026-07-12'
    };
    
    setManualSlot(slot.time);
    setManualDate(dayToDateMap[slot.day] || '2026-07-06');
    setIsAddingBooking(true);
    setActiveTab('bookings');
  };

  // Create Manual Booking Handler
  const handleSaveManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const turf = ownerTurfs.find(t => t.name === manualTurf);
    
    // Calculate total price: turf base rate + selected add-ons
    const basePrice = turf?.price || 1200;
    const addonsPrice = selectedAddons.reduce((sum, addonId) => {
      const matched = addonsCatalog.find(a => a.id === addonId);
      return sum + (matched?.price || 0);
    }, 0);
    const finalAmount = basePrice + addonsPrice;

    // Convert date + timeslot to backend ISO dates
    const [startH, startM] = manualSlot.split(' - ')[0].split(':');
    const [endH, endM] = manualSlot.split(' - ')[1].split(':');
    const dateBase = manualDate; // e.g. "2026-07-06"
    const startTime = new Date(`${dateBase}T${startH}:${startM}:00.000Z`).toISOString();
    const endTime = new Date(`${dateBase}T${endH}:${endM}:00.000Z`).toISOString();
    const dateIso = new Date(`${dateBase}T00:00:00.000Z`).toISOString();

    const bookingPayload = {
      turfId: turf?.id || "2WDrQqjNtcQds11ZqIee",
      sportId: "NHQKZB3YRCRhWBL95sUE", // Seeded Football Sport
      date: dateIso,
      startTime: startTime,
      endTime: endTime,
      customerName: manualName,
      customerPhone: manualPhone,
      finalAmount: finalAmount
    };

    try {
      const res = await api.post('/owner/bookings/offline', bookingPayload);
      const created = res.data.data;

      const newBooking: Booking = {
        id: created.id,
        customerName: manualName,
        customerPhone: manualPhone,
        turfName: manualTurf,
        date: manualDate,
        timeSlot: manualSlot,
        sport: turf?.sport || 'Football',
        amount: finalAmount,
        status: 'CONFIRMED',
        rentedAddons: selectedAddons.length > 0 ? selectedAddons : undefined
      };
      setBookings([newBooking, ...bookings]);

      setIsAddingBooking(false);
      setManualName('');
      setManualPhone('');
      setSelectedAddons([]);
    } catch (err) {
      console.error('Error creating offline booking:', err);
      alert('Failed to save manual booking.');
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (confirm('Cancel this confirmed booking? Refund workflow will be initialized.')) {
      try {
        await api.put(`/owner/bookings/${id}/cancel`);
        setBookings(bookings.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b));
      } catch (err) {
        console.error('Error cancelling booking:', err);
        alert('Failed to cancel booking.');
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl animate-pulse">
            T
          </div>
          <p className="text-emerald-400 text-sm font-medium animate-pulse">Loading Owner Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col md:flex-row transition-colors duration-300 relative overflow-hidden ${
      isDarkMode ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Background Turf Image */}
      <div className="fixed top-0 left-0 w-full h-[600px] pointer-events-none overflow-hidden z-0">
        <img
          src="/images/turf-bg.jpg"
          alt="Sports Turf Background"
          className="w-full h-full object-cover object-center"
          style={{ opacity: isDarkMode ? 0.30 : 0.16 }}
        />
        {/* Very light fade only at the very bottom */}
        <div
          className="absolute inset-0"
          style={{
            background: isDarkMode
              ? 'linear-gradient(to bottom, rgba(3,7,18,0.05) 0%, rgba(3,7,18,0.25) 55%, rgba(3,7,18,0.98) 100%)'
              : 'linear-gradient(to bottom, rgba(248,250,252,0.0) 0%, rgba(248,250,252,0.15) 60%, rgba(248,250,252,1) 100%)'
          }}
        />
      </div>

      {/* Mobile Header Bar */}
      <div className={`flex md:hidden items-center justify-between px-6 py-4 border-b relative z-30 shrink-0 transition-colors duration-300 ${
        isDarkMode ? 'bg-[#090d1a]/80 border-slate-800/40 text-white backdrop-blur-md' : 'bg-white/80 border-slate-200 text-slate-900 shadow-sm backdrop-blur-md'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className={`p-2 rounded-xl border transition-all ${
              isDarkMode ? 'border-slate-800 bg-[#030712]/50 text-slate-350 hover:bg-slate-900' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-emerald-450 flex items-center justify-center font-black text-white text-sm shadow-md shadow-emerald-500/20">
              T
            </div>
            <span className="text-base font-black tracking-tight">TurfBook</span>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-xl border transition-all ${
            isDarkMode ? 'border-slate-800 bg-[#030712]/50 text-amber-400 hover:bg-slate-900' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
          }`}
        >
          {isDarkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>
      </div>

      {/* Sidebar Mobile Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}
      
      {/* Sidebar Navigation Panel (glassmorphism look) */}
      <aside className={`fixed inset-y-0 left-0 h-full md:h-full md:overflow-y-auto border-r flex flex-col justify-between shrink-0 transition-all duration-300 z-50 md:z-10 md:relative md:translate-x-0 ${
        isSidebarCollapsed ? 'md:w-20 p-6 md:p-3.5' : 'md:w-64 p-6'
      } ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } ${
        isDarkMode ? 'bg-[#090d1a]/95 md:bg-[#090d1a]/70 border-slate-850 text-white backdrop-blur-md' : 'bg-white/95 md:bg-white/80 border-slate-200 text-slate-900 shadow-sm backdrop-blur-md'
      }`}>
        <div className="space-y-8">
          
          {/* Logo & Header */}
          <div className={`flex items-center justify-between ${isSidebarCollapsed ? 'md:flex-col md:gap-4' : ''}`}>
            <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'md:hidden' : 'flex'}`}>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-455 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-emerald-500/20 shrink-0">
                T
              </div>
              <div>
                <span className="text-lg font-black tracking-tight block">TurfBook</span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Owner Panel</span>
              </div>
            </div>

            {isSidebarCollapsed && (
              <div className="hidden md:flex h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-455 items-center justify-center font-black text-white text-xl shadow-lg shadow-emerald-500/20 shrink-0">
                T
              </div>
            )}
            
            <button
              onClick={() => {
                if (window.innerWidth >= 768) {
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                } else {
                  setIsSidebarOpen(false);
                }
              }}
              className={`p-2 rounded-xl border transition-all ${
                isDarkMode ? 'border-slate-800 text-slate-400 hover:text-slate-205' : 'border-slate-200 text-slate-500 hover:text-slate-800'
              }`}
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1.5">
            {[
              { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'turfs', label: 'My Turfs', icon: Sliders },
              { id: 'slots', label: 'Slot Manager', icon: Clock },
              { id: 'bookings', label: 'Bookings Log', icon: CalendarDays },
              { id: 'reviews', label: 'Customer Reviews', icon: HelpCircle },
              { id: 'staff', label: 'Staff Directory', icon: User },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].filter(item => {
              if (userRole === 'STAFF') {
                return item.id === 'slots' || item.id === 'bookings';
              }
              return true;
            }).map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsSidebarOpen(false);
                  }}
                  title={item.label}
                  className={`w-full flex items-center rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isSidebarCollapsed ? 'md:justify-center p-3 md:p-2.5' : 'gap-3 px-4 py-3'
                  } ${
                    isActive
                      ? isDarkMode
                        ? 'bg-emerald-500/10 text-emerald-455 border border-emerald-500/20 shadow-md'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-250 shadow-sm'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span className={isSidebarCollapsed ? 'md:hidden' : ''}>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className={`pt-6 border-t mt-8 md:mt-0 space-y-4 ${isDarkMode ? 'border-slate-850' : 'border-slate-200'}`}>
          {/* Quick User Role Swapper */}
          <div className="space-y-2">
            <button
              onClick={() => {
                const nextRole = userRole === 'OWNER' ? 'STAFF' : 'OWNER';
                setUserRole(nextRole);
                if (nextRole === 'STAFF') {
                  setActiveTab('slots');
                }
              }}
              className={`w-full flex items-center justify-between rounded-lg text-xs font-bold transition-all border duration-200 ${
                isSidebarCollapsed ? 'md:justify-center p-3 md:p-2' : 'px-3 py-2'
              } ${
                userRole === 'OWNER'
                  ? 'bg-emerald-500/10 text-emerald-455 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              }`}
              title={`Switch to ${userRole === 'OWNER' ? 'STAFF' : 'OWNER'} view`}
            >
              {isSidebarCollapsed ? (
                <span className="text-[9px] font-black uppercase tracking-wider md:block hidden">{userRole[0]}</span>
              ) : null}
              <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Panel: {userRole}</span>
              <span className={`text-[8px] bg-slate-950 px-1.5 py-0.5 rounded text-white uppercase tracking-widest font-black ${
                isSidebarCollapsed ? 'md:hidden' : ''
              }`}>
                Switch
              </span>
            </button>
          </div>

          <div className={`flex items-center ${isSidebarCollapsed ? 'md:justify-center' : 'gap-2'}`}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-emerald-455 flex items-center justify-center text-emerald-400 font-bold text-xs uppercase shrink-0">
              OP
            </div>
            <div className={isSidebarCollapsed ? 'md:hidden' : ''}>
              <span className={`text-xs font-bold block ${isDarkMode ? 'text-slate-200' : 'text-slate-855'}`}>
                {userRole === 'OWNER' ? 'Owner Profile' : 'Staff Profile'}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {userRole === 'OWNER' ? 'Active Manager' : 'Restricted Staff'}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center rounded-xl border text-xs font-bold transition-all duration-200 ${
                isSidebarCollapsed ? 'md:justify-center p-3 md:p-2' : 'gap-2 px-3 py-2'
              } ${
                isDarkMode
                  ? 'border border-slate-800 text-slate-400 hover:text-white bg-slate-900/30'
                  : 'border border-slate-200 text-slate-650 hover:text-slate-800 bg-slate-100 shadow-sm'
              }`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <>
                  <Sun className="h-3.5 w-3.5 shrink-0" /> 
                  <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 shrink-0" />
                  <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Dark Mode</span>
                </>
              )}
            </button>
            
            <button 
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className={`w-full flex items-center text-rose-450 hover:text-rose-350 hover:bg-rose-500/5 transition-all text-xs font-bold ${
                isSidebarCollapsed ? 'md:justify-center p-3 md:p-2' : 'gap-2 px-3 py-2 rounded-lg'
              }`}
              title="Sign Out"
            >
              <LogOut className="h-4 w-4 shrink-0" /> 
              <span className={isSidebarCollapsed ? 'md:hidden' : ''}>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 overflow-y-auto h-full relative z-10">
             {/* SUBVIEW 1: OVERVIEW DASHBOARD */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Restricted Banner for Staff */}
            {userRole === 'STAFF' && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-sm animate-pulse">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <span>Restricted View: You are currently logged in with a restricted STAFF role. Financial indicators are locked.</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h1 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Overview Dashboard</h1>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Real-time financials and turf schedules.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleDownloadCSV}
                  variant="outline"
                  className={isDarkMode ? 'border-slate-800 text-emerald-450 hover:bg-slate-900' : 'border-slate-300 text-emerald-600 hover:bg-slate-100'}
                >
                  Download Statement
                </Button>
                <Button onClick={() => setActiveTab('bookings')} variant="primary">View Bookings</Button>
              </div>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  label: 'Total Revenue', 
                  value: userRole === 'STAFF' ? '🔒 Locked' : formatCurrency(totalRevenue), 
                  icon: DollarSign, 
                  change: userRole === 'STAFF' ? 'Restricted Access' : '+18.4% this week', 
                  color: 'text-emerald-455' 
                },
                { label: 'Bookings Today', value: bookingsToday, icon: CalendarDays, change: '+12% from yesterday', color: 'text-blue-400' },
                { label: 'Manage Turfs', value: activeTurfsCount, icon: Sliders, change: 'All locations active', color: 'text-purple-400' },
                { label: 'Slot Fill Rate', value: `${fillRate}%`, icon: TrendingUp, change: '+4.2% average growth', color: 'text-amber-400' }
              ].map(stat => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className={`border rounded-2xl p-6 shadow-xl flex items-center justify-between transition-colors duration-300 ${
                    isDarkMode ? 'bg-[#090d1a]/45 border-slate-850 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                  }`}>
                    <div className="space-y-2">
                      <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-550'}`}>{stat.label}</p>
                      <p className="text-2xl font-black">{stat.value}</p>
                      <span className="text-[10px] text-slate-500 font-semibold">{stat.change}</span>
                    </div>
                    <div className={`p-3 rounded-xl border transition-colors duration-300 ${
                      isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-100/80 border-slate-200 shadow-inner'
                    } ${stat.color}`}>
                      <Icon className="h-5.5 w-5.5" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Layout analytics charts & tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Revenue Mock Graph card */}
              <div className={`lg:col-span-2 border rounded-3xl p-6 shadow-xl space-y-6 transition-all duration-300 ${
                isDarkMode ? 'bg-[#090d1a]/20 border-slate-850 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
              }`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <TrendingUp className="h-4.5 w-4.5 text-emerald-450" /> Weekly Booking Performance
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Hourly Fill Rate</span>
                    <button
                      onClick={() => setWeeklyPerfOpen(!weeklyPerfOpen)}
                      className={`p-1 rounded-lg border transition-all ${
                        isDarkMode
                          ? 'border-slate-800 text-slate-400 hover:text-white bg-slate-900/30'
                          : 'border-slate-200 text-slate-650 hover:text-slate-950 bg-slate-100'
                      }`}
                      title={weeklyPerfOpen ? 'Minimize section' : 'Expand section'}
                    >
                      {weeklyPerfOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {weeklyPerfOpen && (
                  userRole === 'STAFF' ? (
                    <div className="h-44 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
                      <ShieldAlert className="h-8 w-8 text-amber-500 mb-2" />
                      <p className="text-sm font-bold text-slate-400">Financial chart locked for staff role</p>
                      <p className="text-xs text-slate-500">Contact the turf owner to access business graphs.</p>
                    </div>
                  ) : (
                    <div className="h-40 flex items-end justify-between pt-6 px-4">
                      {weeklyFillRates.map((val, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2 w-full">
                          <div className={`w-8 border rounded-t-lg relative transition-all duration-500 ${
                            isDarkMode
                              ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30'
                          }`} style={{ height: `${val * 1.3}px` }}>
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-emerald-500">{val}%</div>
                          </div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}</span>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>

              {/* Quick Status Sidebar */}
              <div className={`border rounded-3xl p-6 shadow-xl space-y-4 transition-all duration-300 ${
                isDarkMode ? 'bg-[#090d1a]/20 border-slate-850 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
              }`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-base">Quick Status</h3>
                  <button
                    onClick={() => setQuickStatusOpen(!quickStatusOpen)}
                    className={`p-1 rounded-lg border transition-all ${
                      isDarkMode
                        ? 'border-slate-800 text-slate-400 hover:text-white bg-slate-900/30'
                        : 'border-slate-200 text-slate-650 hover:text-slate-950 bg-slate-100'
                    }`}
                    title={quickStatusOpen ? 'Minimize section' : 'Expand section'}
                  >
                    {quickStatusOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>
                
                {quickStatusOpen && (
                  <div className="space-y-3">
                    <div className={`p-3 border rounded-xl transition-colors duration-300 ${
                      isDarkMode ? 'bg-slate-900/40 border-slate-850' : 'bg-slate-50 border-slate-100 shadow-inner'
                    }`}>
                      <span className="text-[10px] font-bold text-emerald-500 block mb-1">ACTIVE SLOT SCHEDULER</span>
                      <p className="text-sm font-semibold">{slots.filter(s => s.status === 'OPEN').length} slots open for bookings</p>
                    </div>

                    <div className={`p-3 border rounded-xl transition-colors duration-300 ${
                      isDarkMode ? 'bg-slate-900/40 border-slate-850' : 'bg-slate-50 border-slate-100 shadow-inner'
                    }`}>
                      <span className="text-[10px] font-bold text-blue-500 block mb-1">LOCATIONS STATUS</span>
                      <p className="text-sm font-semibold">Ahmednagar: {activeTurfsCount} active {activeTurfsCount === 1 ? 'venue' : 'venues'}</p>
                    </div>

                    <div className={`p-3 border rounded-xl transition-colors duration-300 ${
                      isDarkMode ? 'bg-[#0f172a]/60 border-slate-800' : 'bg-emerald-50/40 border-slate-200'
                    } flex items-start gap-2.5`}>
                      <CloudRain className="h-5 w-5 text-emerald-450 shrink-0 mt-0.5 animate-bounce" />
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">WEATHER ADVISORY (AHMEDNAGAR)</span>
                        <p className="text-xs font-semibold text-slate-350">29°C — Partly Cloudy</p>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                          💡 Peak hours are clear. Recommend enabling standard floodlights from 18:00 to 22:00.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Extra Analytics: Sport Revenue split */}
            {userRole === 'OWNER' && (
              <div className={`border rounded-3xl p-6 shadow-xl space-y-4 transition-all duration-300 ${
                isDarkMode ? 'bg-[#090d1a]/20 border-slate-850 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
              }`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-base">Revenue Distribution & Surcharges</h3>
                  <button
                    onClick={() => setRevDistOpen(!revDistOpen)}
                    className={`p-1 rounded-lg border transition-all ${
                      isDarkMode
                        ? 'border-slate-800 text-slate-400 hover:text-white bg-slate-900/30'
                        : 'border-slate-200 text-slate-655 hover:text-slate-950 bg-slate-100'
                    }`}
                    title={revDistOpen ? 'Minimize section' : 'Expand section'}
                  >
                    {revDistOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>
                
                {revDistOpen && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className={`p-4 border rounded-xl ${isDarkMode ? 'bg-slate-900/40 border-slate-850' : 'bg-slate-50 border-slate-100'}`}>
                        <span className="text-xs text-slate-500 block font-bold mb-1">FOOTBALL FIELD</span>
                        <span className="text-xl font-extrabold text-emerald-500">₹{bookings.filter(b => b.sport === 'Football' && b.status !== 'CANCELLED').reduce((s,b) => s+b.amount, 0)}</span>
                        <span className="text-[10px] text-slate-400 block mt-1">From Football matches</span>
                      </div>
                      <div className={`p-4 border rounded-xl ${isDarkMode ? 'bg-slate-900/40 border-slate-850' : 'bg-slate-50 border-slate-100'}`}>
                        <span className="text-xs text-slate-500 block font-bold mb-1">CRICKET FIELD</span>
                        <span className="text-xl font-extrabold text-amber-500">₹{bookings.filter(b => b.sport === 'Cricket' && b.status !== 'CANCELLED').reduce((s,b) => s+b.amount, 0)}</span>
                        <span className="text-[10px] text-slate-400 block mt-1">From Cricket leagues</span>
                      </div>
                      <div className={`p-4 border rounded-xl ${isDarkMode ? 'bg-slate-900/40 border-slate-850' : 'bg-slate-50 border-slate-100'}`}>
                        <span className="text-xs text-slate-500 block font-bold mb-1">PEAK SURCHARGES ACCRUED</span>
                        <span className="text-xl font-extrabold text-purple-500">₹{bookings.filter(b => b.status !== 'CANCELLED').reduce((s,b) => {
                          return s + Math.round(b.amount * 0.15);
                        }, 0)}</span>
                        <span className="text-[10px] text-slate-400 block mt-1">Weekend and evening hours extra</span>
                      </div>
                    </div>

                    {/* Live Pricing Simulator Controls */}
                    <div className={`p-5 border rounded-2xl ${
                      isDarkMode ? 'bg-[#030712]/60 border-slate-800' : 'bg-slate-50/50 border-slate-200 shadow-inner'
                    } space-y-4`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-200">Live Surcharge Revenue Simulator</h4>
                          <p className="text-[11px] text-slate-550 font-medium">Simulate weekly revenue growth by shifting surcharge rates.</p>
                        </div>
                        <span className="text-xs bg-emerald-500/10 text-emerald-450 px-2.5 py-1.5 rounded-xl border border-emerald-500/20 font-bold shrink-0">
                          Projected Bump: +{formatCurrency(Math.round((bookings.length * 0.4 * peakSurcharge) + (bookings.length * 0.2 * weekendSurcharge)))} / week
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-450">Peak Hour Surcharge (18:00 - 22:00)</span>
                            <span className="text-emerald-455 font-bold">₹{peakSurcharge}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1000"
                            step="50"
                            value={peakSurcharge}
                            onChange={(e) => setPeakSurcharge(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-450">Weekend Surcharge (Saturday - Sunday)</span>
                            <span className="text-emerald-455 font-bold">₹{weekendSurcharge}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="800"
                            step="50"
                            value={weekendSurcharge}
                            onChange={(e) => setWeekendSurcharge(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SUBVIEW 2: TURF MANAGEMENT */}
        {activeTab === 'turfs' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>My Turf Listings</h1>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Add, edit, or configure your physical sports pitches.</p>
              </div>
              {userRole === 'OWNER' && (
                <button
                  onClick={() => {
                    setEditingTurfId(null);
                    setIsAddingTurf(!isAddingTurf);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/25"
                >
                  <Plus className="h-4 w-4" /> Add New Turf
                </button>
              )}
            </div>

            {/* Add/Edit Turf Modal Drawer */}
            {isAddingTurf && (
              <form onSubmit={handleSaveTurf} className={`p-6 border rounded-3xl space-y-6 shadow-xl max-w-2xl transition-colors duration-300 ${
                isDarkMode ? 'bg-[#090d1a]/50 border-slate-850' : 'bg-white border-slate-200'
              }`}>
                <h3 className="text-lg font-bold text-emerald-555 border-b border-slate-800 pb-2">
                  {editingTurfId ? 'Modify Turf Details' : 'Register New Turf Arena'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Turf Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Old Trafford Arena"
                      value={turfName}
                      onChange={(e) => setTurfName(e.target.value)}
                      className={`w-full rounded-xl p-3 border outline-none text-sm font-semibold transition-all ${
                        isDarkMode
                          ? 'bg-[#030712] text-slate-100 placeholder-slate-650 border-slate-800 focus:border-emerald-500/50'
                          : 'bg-white text-slate-900 placeholder-slate-400 border-slate-350 focus:border-emerald-500/50'
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Hourly Price Rate (₹)</label>
                    <input
                      type="number"
                      required
                      value={turfPrice}
                      onChange={(e) => setTurfPrice(Number(e.target.value))}
                      className={`w-full rounded-xl p-3 border outline-none text-sm font-semibold transition-all ${
                        isDarkMode
                          ? 'bg-[#030712] text-slate-100 placeholder-slate-650 border-slate-800 focus:border-emerald-500/50'
                          : 'bg-white text-slate-900 placeholder-slate-400 border-slate-355 focus:border-emerald-500/50'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Description</label>
                  <textarea
                    required
                    placeholder="Enter specs, dimensions, lighting standard..."
                    value={turfDesc}
                    onChange={(e) => setTurfDesc(e.target.value)}
                    rows={3}
                    className={`w-full rounded-xl p-3 border outline-none text-sm font-semibold transition-all ${
                      isDarkMode
                        ? 'bg-[#030712] text-slate-100 placeholder-slate-650 border-slate-800 focus:border-emerald-500/50'
                        : 'bg-white text-slate-900 placeholder-slate-400 border-slate-350 focus:border-emerald-500/50'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sport Category</label>
                    <select
                      value={turfSport}
                      onChange={(e) => setTurfSport(e.target.value)}
                      className={`w-full rounded-xl p-3 border outline-none text-sm font-semibold transition-all ${
                        isDarkMode
                          ? 'bg-[#030712] text-slate-100 border-slate-800 focus:border-emerald-500/50'
                          : 'bg-white text-slate-900 border-slate-350 focus:border-emerald-500/50'
                      }`}
                    >
                      <option value="Football">Football</option>
                      <option value="Cricket">Cricket</option>
                      <option value="Box Cricket">Box Cricket</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={turfLat}
                      onChange={(e) => setTurfLat(Number(e.target.value))}
                      className={`w-full rounded-xl p-3 border outline-none text-sm font-semibold transition-all ${
                        isDarkMode
                          ? 'bg-[#030712] text-slate-100 border-slate-800 focus:border-emerald-500/50'
                          : 'bg-white text-slate-900 border-slate-350 focus:border-emerald-500/50'
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={turfLng}
                      onChange={(e) => setTurfLng(Number(e.target.value))}
                      className={`w-full rounded-xl p-3 border outline-none text-sm font-semibold transition-all ${
                        isDarkMode
                          ? 'bg-[#030712] text-slate-100 border-slate-800 focus:border-emerald-500/50'
                          : 'bg-white text-slate-900 border-slate-350 focus:border-emerald-500/50'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-850">
                  <Button type="submit" variant="primary">Save Changes</Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddingTurf(false)} className={isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-300 text-slate-600'}>Cancel</Button>
                </div>
              </form>
            )}

            {/* Turfs List Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownerTurfs.map((turf) => (
                <div
                  key={turf.id}
                  className={`border rounded-3xl overflow-hidden shadow-xl flex flex-col group hover:shadow-emerald-500/[0.05] transition-all duration-300 ${
                    isDarkMode ? 'bg-[#090d1a]/30 border-slate-850 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                  }`}
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
                      <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{turf.name}</h3>
                      <p className={`text-xs leading-relaxed line-clamp-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{turf.description}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-450">
                        <MapPin className="h-3.5 w-3.5 text-emerald-455" />
                        <span>{turf.area}, {turf.city}</span>
                      </div>
                    </div>

                    <div className={`pt-4 border-t flex items-center justify-between ${isDarkMode ? 'border-slate-850' : 'border-slate-200'}`}>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Hourly Rate</span>
                        <span className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(turf.price)}</span>
                      </div>
                      
                      {userRole === 'OWNER' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClick(turf)}
                            className={`p-2 rounded-lg border transition-colors ${
                              isDarkMode
                                ? 'border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:text-emerald-400 text-slate-400'
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:text-emerald-600 text-slate-650'
                            }`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTurf(turf.id)}
                            className={`p-2 rounded-lg border transition-colors ${
                              isDarkMode
                                ? 'border-slate-800 bg-slate-900/50 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400'
                                : 'border-slate-200 bg-slate-50 hover:bg-rose-50 hover:text-rose-500 text-slate-650'
                            }`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-500/5 border border-slate-500/10 px-2.5 py-1 rounded">View Only</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBVIEW 3: SLOT MANAGEMENT */}
        {activeTab === 'slots' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h1 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Time Slot Planner</h1>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Configure booking availabilities, dynamic peak hour surcharges, and block slots.</p>
              </div>
            </div>

            {/* Filter by Day */}
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDayFilter(day)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                    selectedDayFilter === day
                      ? isDarkMode
                        ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400 shadow-sm'
                        : 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/25'
                      : isDarkMode
                      ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      : 'bg-white border-slate-200 text-slate-650 hover:text-slate-900 hover:bg-slate-50 shadow-sm'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Slots Grid */}
            <div className={`border rounded-3xl p-6 shadow-xl space-y-4 transition-colors duration-300 ${
              isDarkMode ? 'bg-[#090d1a]/20 border-slate-850 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}>
              <div className={`flex justify-between items-center border-b pb-4 ${isDarkMode ? 'border-slate-850' : 'border-slate-200'}`}>
                <h3 className={`font-bold text-base uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Slots Schedule for <span className="text-emerald-555 font-black">{selectedDayFilter}</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-bold">
                  {userRole === 'OWNER' ? 'CLICK CARD TO TOGGLE STATE' : 'READ ONLY STAFF VIEW'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {slots
                  .filter(s => s.day === selectedDayFilter)
                  .map(slot => {
                    const currentPrice = getCalculatedSlotPrice(slot);
                    const startHour = parseInt(slot.time.split(':')[0], 10);
                    const isPeak = startHour >= peakStartHour && startHour < peakEndHour;
                    const isWeekend = slot.day === 'Saturday' || slot.day === 'Sunday';
                    
                    return (
                      <button
                        key={slot.id}
                        onClick={() => handleSlotClick(slot)}
                        className={`px-3.5 py-2.5 rounded-xl text-left border flex flex-col justify-between h-18 transition-all hover:scale-[1.01] ${
                          slot.status === 'BOOKED'
                            ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-500'
                            : slot.status === 'BLOCKED'
                            ? 'bg-rose-500/5 border-rose-500/25 text-rose-500'
                            : isDarkMode
                            ? 'bg-slate-900/30 border-slate-850 text-slate-300 hover:border-slate-800'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-350 shadow-inner'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-extrabold">{slot.time}</span>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded ${
                            slot.status === 'BOOKED'
                              ? 'bg-emerald-500/10'
                              : slot.status === 'BLOCKED'
                              ? 'bg-rose-500/10'
                              : isDarkMode
                              ? 'bg-slate-800'
                              : 'bg-slate-200'
                          }`}>
                            {slot.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-1">
                            <span className={`text-[9px] font-black ${isDarkMode ? 'text-slate-400' : 'text-slate-655'}`}>
                              {formatCurrency(currentPrice)}/h
                            </span>
                            {isPeak && (
                              <span className="text-[7.5px] bg-amber-500/15 border border-amber-500/20 text-amber-550 px-0.8 py-0.1 rounded font-black uppercase">🔥</span>
                            )}
                            {isWeekend && (
                              <span className="text-[7.5px] bg-blue-500/15 border border-blue-500/20 text-blue-555 px-0.8 py-0.1 rounded font-black uppercase">⚡</span>
                            )}
                          </div>
                          {slot.blockReason ? (
                            <span className="text-[7.5px] text-rose-500 truncate max-w-[80px]">{slot.blockReason}</span>
                          ) : slot.status === 'BOOKED' ? (
                            <span className="text-[7.5px] text-emerald-500 truncate max-w-[80px]">Booked</span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Dynamic Pricing Configuration Rules Panel (placed at bottom, simple layout) */}
            <div className={`p-4 border rounded-3xl shadow-lg transition-colors duration-300 ${
              isDarkMode ? 'bg-[#090d1a]/20 border-slate-850 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4.5 w-4.5 text-emerald-450" />
                  <span className="text-xs font-bold uppercase tracking-wider">Dynamic Pricing Surcharges</span>
                </div>
                
                {userRole === 'OWNER' ? (
                  <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-slate-400">
                    <div className="flex items-center gap-2">
                      <span>Peak Hours:</span>
                      <select
                        value={peakStartHour}
                        onChange={(e) => setPeakStartHour(Number(e.target.value))}
                        className={`rounded-lg px-2.5 py-1 border outline-none text-xs ${
                          isDarkMode ? 'bg-[#030712] text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-350'
                        }`}
                      >
                        {[15, 16, 17, 18, 19, 20].map(h => (
                          <option key={h} value={h}>{h > 12 ? h-12 : h}:00 PM</option>
                        ))}
                      </select>
                      <span>to</span>
                      <select
                        value={peakEndHour}
                        onChange={(e) => setPeakEndHour(Number(e.target.value))}
                        className={`rounded-lg px-2.5 py-1 border outline-none text-xs ${
                          isDarkMode ? 'bg-[#030712] text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-350'
                        }`}
                      >
                        {[21, 22, 23, 24].map(h => (
                          <option key={h} value={h}>{h-12}:00 PM</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span>Peak Surcharge:</span>
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-[10px] text-slate-500 font-bold">₹</span>
                        <input
                          type="number"
                          value={peakSurcharge}
                          onChange={(e) => setPeakSurcharge(Number(e.target.value))}
                          className={`w-20 rounded-lg pl-5 pr-2 py-1 border outline-none text-xs font-bold ${
                            isDarkMode ? 'bg-[#030712] text-slate-100 border-slate-850' : 'bg-slate-50 text-slate-900 border-slate-300'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span>Weekend Surcharge:</span>
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-[10px] text-slate-500 font-bold">₹</span>
                        <input
                          type="number"
                          value={weekendSurcharge}
                          onChange={(e) => setWeekendSurcharge(Number(e.target.value))}
                          className={`w-20 rounded-lg pl-5 pr-2 py-1 border outline-none text-xs font-bold ${
                            isDarkMode ? 'bg-[#030712] text-slate-100 border-slate-850' : 'bg-slate-50 text-slate-900 border-slate-300'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-450 font-bold">
                    🔒 Dynamic pricing rules are read-only.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW 4: BOOKINGS LOG */}
        {activeTab === 'bookings' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Bookings Reservation Log</h1>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Track player schedules, handle cancellations, or insert manual bookings.</p>
              </div>
              <button
                onClick={() => setIsAddingBooking(!isAddingBooking)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
              >
                <Plus className="h-4 w-4" /> Book Offline Slot
              </button>
            </div>

            {/* Offline Booking Form */}
            {isAddingBooking && (
              <form onSubmit={handleSaveManualBooking} className={`p-6 border rounded-3xl space-y-6 shadow-xl max-w-xl transition-colors duration-300 ${
                isDarkMode ? 'bg-[#090d1a]/50 border-slate-850' : 'bg-white border-slate-200'
              }`}>
                <h3 className="text-lg font-bold text-emerald-555 border-b pb-2 border-slate-800">Manual Booking Details</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Player Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className={`w-full rounded-xl p-3.5 border outline-none text-sm font-semibold transition-all ${
                        isDarkMode
                          ? 'bg-[#030712] text-slate-100 placeholder-slate-650 border-slate-800 focus:border-emerald-500/50'
                          : 'bg-white text-slate-900 placeholder-slate-400 border-slate-350 focus:border-emerald-500/50'
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="98XXXXXXXX"
                      pattern="[0-9]{10}"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      className={`w-full rounded-xl p-3.5 border outline-none text-sm font-semibold transition-all ${
                        isDarkMode
                          ? 'bg-[#030712] text-slate-100 placeholder-slate-650 border-slate-800 focus:border-emerald-500/50'
                          : 'bg-white text-slate-900 placeholder-slate-400 border-slate-350 focus:border-emerald-500/50'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Turf Venue</label>
                    <select
                      value={manualTurf}
                      onChange={(e) => setManualTurf(e.target.value)}
                      className={`w-full rounded-xl p-3.5 border outline-none text-sm font-semibold transition-all ${
                        isDarkMode
                          ? 'bg-[#030712] text-slate-100 border-slate-800 focus:border-emerald-500/50'
                          : 'bg-white text-slate-900 border-slate-350 focus:border-emerald-500/50'
                      }`}
                    >
                      {ownerTurfs.map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Select Date</label>
                    <input
                      type="date"
                      required
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className={`w-full rounded-xl p-3.5 border outline-none text-sm font-semibold transition-all ${
                        isDarkMode
                          ? 'bg-[#030712] text-slate-100 border-slate-800 focus:border-emerald-500/50'
                          : 'bg-white text-slate-900 border-slate-350 focus:border-emerald-500/50'
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Select Slot</label>
                    <select
                      value={manualSlot}
                      onChange={(e) => setManualSlot(e.target.value)}
                      className={`w-full rounded-xl p-3.5 border outline-none text-sm font-semibold transition-all ${
                        isDarkMode
                          ? 'bg-[#030712] text-slate-100 border-slate-800 focus:border-emerald-500/50'
                          : 'bg-white text-slate-900 border-slate-350 focus:border-emerald-500/50'
                      }`}
                    >
                      {hourlySlots.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Equipment Rentals Selector */}
                <div className="space-y-3 pt-2">
                  <label className={`text-xs font-bold uppercase block ${isDarkMode ? 'text-slate-400' : 'text-slate-550'}`}>Add-on Equipment Rentals & Refreshments</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {addonsCatalog.map(addon => {
                      const isSelected = selectedAddons.includes(addon.id);
                      return (
                        <label
                          key={addon.id}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500/5 text-emerald-450'
                              : isDarkMode
                              ? 'border-slate-800 bg-[#030712] text-slate-300 hover:border-slate-700'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedAddons(selectedAddons.filter(id => id !== addon.id));
                                } else {
                                  setSelectedAddons([...selectedAddons, addon.id]);
                                }
                              }}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            <span className="text-xs font-semibold">{addon.name}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-400">+₹{addon.price}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-850">
                  <Button type="submit" variant="primary">Confirm Booking</Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddingBooking(false)} className={isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-300 text-slate-600'}>Cancel</Button>
                </div>
              </form>
            )}

            {/* Bookings log table */}
            <div className={`border rounded-3xl overflow-hidden shadow-xl transition-colors duration-300 ${
              isDarkMode ? 'bg-[#090d1a]/20 border-slate-850' : 'bg-white border-slate-200'
            }`}>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                      isDarkMode ? 'border-slate-855 bg-slate-900/40 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-550'
                    }`}>
                      <th className="p-4 pl-6">Booking ID</th>
                      <th className="p-4">Customer Details</th>
                      <th className="p-4">Turf Name / Sport</th>
                      <th className="p-4">Date / Time Slot</th>
                      <th className="p-4">Paid Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-sm transition-colors duration-300 ${
                    isDarkMode ? 'divide-slate-850/40' : 'divide-slate-100'
                  }`}>
                    {bookings.map((booking) => (
                      <tr key={booking.id} className={`transition-colors ${
                        isDarkMode ? 'hover:bg-slate-900/10' : 'hover:bg-slate-50'
                      }`}>
                        <td className="p-4 pl-6 font-mono text-xs text-slate-500">{booking.id}</td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className={`font-bold block ${isDarkMode ? 'text-slate-200' : 'text-slate-850'}`}>{booking.customerName}</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Phone className="h-3 w-3 text-slate-500" /> {booking.customerPhone}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className={`font-semibold block ${isDarkMode ? 'text-slate-350' : 'text-slate-750'}`}>{booking.turfName}</span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500">{booking.sport}</span>
                              {booking.rentedAddons && booking.rentedAddons.map(addon => (
                                <span key={addon} className={`text-[8px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider ${
                                  isDarkMode ? 'bg-slate-900 border border-slate-800 text-slate-400' : 'bg-slate-100 border border-slate-200 text-slate-650'
                                }`}>
                                  ⚙️ {addon.split(' ')[0]}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className={`font-semibold block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{booking.date}</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-slate-500" /> {booking.timeSlot}
                            </span>
                          </div>
                        </td>
                        <td className={`p-4 font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-850'}`}>{formatCurrency(booking.amount)}</td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                            booking.status === 'CONFIRMED'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : booking.status === 'COMPLETED'
                              ? 'bg-blue-500/10 text-blue-550'
                              : 'bg-rose-500/10 text-rose-550'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="p-4 text-right pr-6">
                          {booking.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
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

        {/* SUBVIEW 5: CUSTOMER REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="space-y-8">
            <div>
              <h1 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Player Reviews & Ratings</h1>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Read ratings left by booking players and write official manager replies.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 max-w-4xl">
              {reviews.map(review => (
                <div
                  key={review.id}
                  className={`p-6 border rounded-3xl shadow-lg transition-all duration-300 ${
                    isDarkMode ? 'bg-[#090d1a]/30 border-slate-850 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b pb-4 mb-4 border-slate-850">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-450 text-sm">
                        {review.customerName.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold block text-sm">{review.customerName}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">{review.turfName}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex text-amber-450 font-bold text-sm">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < review.rating ? 'opacity-100' : 'opacity-20'}>★</span>
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-500">{review.date}</span>
                    </div>
                  </div>

                  <p className={`text-sm leading-relaxed mb-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    "{review.comment}"
                  </p>

                  {/* Owner Response block */}
                  {review.ownerReply ? (
                    <div className={`p-4 border rounded-2xl ${
                      isDarkMode ? 'bg-slate-900/40 border-slate-850/80 text-emerald-400' : 'bg-slate-50 border-slate-100 text-emerald-600'
                    }`}>
                      <span className="text-[10px] font-black uppercase tracking-wider block mb-1">Official Response:</span>
                      <p className="text-xs leading-relaxed">{review.ownerReply}</p>
                    </div>
                  ) : userRole === 'OWNER' ? (
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Write official reply</label>
                      <div className="flex gap-3">
                        <textarea
                          placeholder="Thank customer and address feed..."
                          value={replyText[review.id] || ''}
                          onChange={(e) => setReplyText({ ...replyText, [review.id]: e.target.value })}
                          rows={2}
                          className={`w-full rounded-xl p-3 border outline-none text-xs font-semibold transition-all ${
                            isDarkMode
                              ? 'bg-[#030712] text-slate-100 border-slate-800 focus:border-emerald-500/50'
                              : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-emerald-500/50'
                          }`}
                        />
                        <button
                          onClick={() => handleSaveReviewReply(review.id)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all self-end shrink-0"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      🔒 Replies locked for staff role
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBVIEW 6: STAFF DIRECTORY */}
        {activeTab === 'staff' && (
          <div className="space-y-8">
            <div>
              <h1 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Staff Directory</h1>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Configure user access roles, groundkeepers, and shift supervisors.</p>
            </div>

            {/* Invite Staff Form */}
            {userRole === 'OWNER' ? (
              <form onSubmit={handleAddStaffMember} className={`p-6 border rounded-3xl space-y-6 shadow-xl max-w-xl transition-colors duration-350 ${
                isDarkMode ? 'bg-[#090d1a]/50 border-slate-850' : 'bg-white border-slate-200'
              }`}>
                <h3 className="text-base font-bold text-emerald-555 border-b pb-2 border-slate-800">Add Staff Account</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block">Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Anil Kumar"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className={`w-full rounded-xl p-3 border outline-none text-xs font-semibold ${
                        isDarkMode
                          ? 'bg-[#030712] text-slate-100 border-slate-800'
                          : 'bg-slate-50 text-slate-900 border-slate-300'
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block">Phone</label>
                    <input
                      type="tel"
                      required
                      placeholder="98XXXXXXXX"
                      pattern="[0-9]{10}"
                      value={newStaffPhone}
                      onChange={(e) => setNewStaffPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      className={`w-full rounded-xl p-3 border outline-none text-xs font-semibold ${
                        isDarkMode
                          ? 'bg-[#030712] text-slate-100 border-slate-800'
                          : 'bg-slate-50 text-slate-900 border-slate-300'
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block">Role</label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value)}
                      className={`w-full rounded-xl p-3 border outline-none text-xs font-semibold ${
                        isDarkMode
                          ? 'bg-[#030712] text-slate-100 border-slate-800'
                          : 'bg-slate-50 text-slate-900 border-slate-300'
                      }`}
                    >
                      <option value="CARETAKER">Caretaker</option>
                      <option value="MANAGER">Shift Manager</option>
                      <option value="COACH">Field Coach</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20">
                  Register Staff Member
                </button>
              </form>
            ) : (
              <div className="p-4 bg-slate-900/20 border border-slate-850 rounded-2xl text-xs text-slate-500 max-w-xl">
                <span>🔒 Registering new staff members is disabled for restricted STAFF accounts. Please request owner permissions to add team accounts.</span>
              </div>
            )}

            {/* Staff list directory grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
              {staffList.map(staff => (
                <div
                  key={staff.id}
                  className={`p-5 border rounded-2xl flex items-center justify-between shadow-md transition-colors duration-300 ${
                    isDarkMode ? 'bg-[#090d1a]/20 border-slate-850 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="font-bold block text-sm">{staff.name}</span>
                    <span className="text-[10px] text-slate-500 block">📞 {staff.phone}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-widest inline-block ${
                      staff.role === 'MANAGER'
                        ? 'bg-blue-500/10 text-blue-500'
                        : staff.role === 'CARETAKER'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-purple-500/10 text-purple-500'
                    }`}>
                      {staff.role}
                    </span>
                  </div>
                  {userRole === 'OWNER' && (
                    <button
                      onClick={() => handleDeleteStaff(staff.id)}
                      className="p-2 text-rose-500 hover:bg-rose-500/5 rounded-lg border border-transparent hover:border-rose-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBVIEW 7: CONFIGURATION SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Configuration Settings</h1>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Manage your venue payments configuration, company billing parameters, and notifications.</p>
              </div>
            </div>

            {settingsSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-450 rounded-2xl text-sm font-bold shadow-md transition-all duration-300">
                🎉 {settingsSuccess}
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-8 max-w-4xl">
              {/* Payment Settings Card */}
              <div className={`p-6 border rounded-3xl space-y-6 shadow-xl transition-colors duration-300 ${
                isDarkMode ? 'bg-[#090d1a]/45 border-slate-850 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <h3 className="text-base font-bold text-emerald-450 border-b pb-2 border-slate-800 flex items-center gap-2">
                  <DollarSign className="h-4.5 w-4.5" /> Payments & Razorpay Credentials
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block">Razorpay Key ID</label>
                    <input
                      type="text"
                      placeholder="rzp_test_..."
                      value={razorpayKeyId}
                      onChange={(e) => setRazorpayKeyId(e.target.value)}
                      className={`w-full rounded-xl p-3 border outline-none text-xs font-semibold ${
                        isDarkMode ? 'bg-[#030712] text-slate-100 border-slate-800 focus:border-emerald-500/40' : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-emerald-500/40'
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block">Razorpay Key Secret</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      value={razorpayKeySecret}
                      onChange={(e) => setRazorpayKeySecret(e.target.value)}
                      className={`w-full rounded-xl p-3 border outline-none text-xs font-semibold ${
                        isDarkMode ? 'bg-[#030712] text-slate-100 border-slate-800 focus:border-emerald-500/40' : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-emerald-500/40'
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block">Business UPI ID (for Direct Settlements)</label>
                    <input
                      type="text"
                      placeholder="merchant@upi"
                      value={businessUpiId}
                      onChange={(e) => setBusinessUpiId(e.target.value)}
                      className={`w-full rounded-xl p-3 border outline-none text-xs font-semibold ${
                        isDarkMode ? 'bg-[#030712] text-slate-100 border-slate-800 focus:border-emerald-500/40' : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-emerald-500/40'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block">Convenience Fee (₹)</label>
                    <input
                      type="number"
                      min="0"
                      max="500"
                      value={convenienceFee}
                      onChange={(e) => setConvenienceFee(Number(e.target.value))}
                      className={`w-full rounded-xl p-3 border outline-none text-xs font-semibold ${
                        isDarkMode ? 'bg-[#030712] text-slate-100 border-slate-800 focus:border-emerald-500/40' : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-emerald-500/40'
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block">GST / Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className={`w-full rounded-xl p-3 border outline-none text-xs font-semibold ${
                        isDarkMode ? 'bg-[#030712] text-slate-100 border-slate-800 focus:border-emerald-500/40' : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-emerald-500/40'
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block">Online Payments Status</label>
                    <div className="flex items-center gap-2 h-10">
                      <input
                        type="checkbox"
                        id="onlinePaymentsEnabled"
                        checked={onlinePaymentsEnabled}
                        onChange={(e) => setOnlinePaymentsEnabled(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                      />
                      <label htmlFor="onlinePaymentsEnabled" className="text-xs font-bold cursor-pointer">
                        {onlinePaymentsEnabled ? 'Online Payments Active' : 'Online Payments Paused'}
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400 uppercase">Advance Booking Pay Split percentage</span>
                    <span className="text-emerald-450 font-black text-sm">{advancePaymentPercent}% Advance</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={advancePaymentPercent}
                    onChange={(e) => setAdvancePaymentPercent(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>10% (Minimum Reservation Hold)</span>
                    <span>50% (Standard Half Pay)</span>
                    <span>100% (Strict Full Pay Only)</span>
                  </div>
                </div>
              </div>

              {/* General Business Details & Operations */}
              <div className={`p-6 border rounded-3xl space-y-6 shadow-xl transition-colors duration-300 ${
                isDarkMode ? 'bg-[#090d1a]/45 border-slate-850 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <h3 className="text-base font-bold text-emerald-450 border-b pb-2 border-slate-800 flex items-center gap-2">
                  <User className="h-4.5 w-4.5" /> General Business Details & Operations
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block">Registered Business / Brand Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ahmednagar Sports Arena"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className={`w-full rounded-xl p-3 border outline-none text-xs font-semibold ${
                        isDarkMode ? 'bg-[#030712] text-slate-100 border-slate-800 focus:border-emerald-500/40' : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-emerald-500/40'
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block">GSTIN / Registration Number</label>
                    <input
                      type="text"
                      placeholder="27AAAAA1111A1Z1"
                      value={businessRegisterNumber}
                      onChange={(e) => setBusinessRegisterNumber(e.target.value)}
                      className={`w-full rounded-xl p-3 border outline-none text-xs font-semibold ${
                        isDarkMode ? 'bg-[#030712] text-slate-100 border-slate-800 focus:border-emerald-500/40' : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-emerald-500/40'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block">Billing & Contact Email</label>
                    <input
                      type="email"
                      required
                      placeholder="billing@sportsarena.com"
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                      className={`w-full rounded-xl p-3 border outline-none text-xs font-semibold ${
                        isDarkMode ? 'bg-[#030712] text-slate-100 border-slate-800 focus:border-emerald-500/40' : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-emerald-500/40'
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block">Business Address</label>
                    <input
                      type="text"
                      placeholder="Gulmohar Road, Savedi, Ahmednagar"
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      className={`w-full rounded-xl p-3 border outline-none text-xs font-semibold ${
                        isDarkMode ? 'bg-[#030712] text-slate-100 border-slate-800 focus:border-emerald-500/40' : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-emerald-500/40'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block">Auto-Cancellation Limit (min)</label>
                    <input
                      type="number"
                      min="2"
                      max="30"
                      value={autoCancellationLimit}
                      onChange={(e) => setAutoCancellationLimit(Number(e.target.value))}
                      className={`w-full rounded-xl p-3 border outline-none text-xs font-semibold ${
                        isDarkMode ? 'bg-[#030712] text-slate-100 border-slate-800 focus:border-emerald-500/40' : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-emerald-500/40'
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block">Operations Open Time</label>
                    <input
                      type="time"
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      className={`w-full rounded-xl p-3 border outline-none text-xs font-semibold ${
                        isDarkMode ? 'bg-[#030712] text-slate-100 border-slate-800 focus:border-emerald-500/40' : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-emerald-500/40'
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block">Operations Close Time</label>
                    <input
                      type="time"
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      className={`w-full rounded-xl p-3 border outline-none text-xs font-semibold ${
                        isDarkMode ? 'bg-[#030712] text-slate-100 border-slate-800 focus:border-emerald-500/40' : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-emerald-500/40'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Notification Toggles */}
              <div className={`p-6 border rounded-3xl space-y-4 transition-colors duration-300 ${
                isDarkMode ? 'bg-[#090d1a]/45 border-slate-850 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Notification Alerts Toggles</h3>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="smsAlertsEnabled"
                      checked={smsAlertsEnabled}
                      onChange={(e) => setSmsAlertsEnabled(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                    <label htmlFor="smsAlertsEnabled" className="text-xs font-bold cursor-pointer">
                      Send SMS OTPs and Booking confirmations
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="emailReceiptsEnabled"
                      checked={emailReceiptsEnabled}
                      onChange={(e) => setEmailReceiptsEnabled(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                    <label htmlFor="emailReceiptsEnabled" className="text-xs font-bold cursor-pointer">
                      Send Email invoices and monthly revenue statements
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 shrink-0"
                >
                  {savingSettings ? 'Saving Configuration...' : 'Save Configuration settings'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

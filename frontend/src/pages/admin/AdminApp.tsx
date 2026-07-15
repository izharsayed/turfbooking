import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, CalendarDays, DollarSign, Sun, Moon, ArrowRight, Activity, MapPin, UserCheck, FileText, Settings, CheckCircle, Clock, XCircle, MoreVertical, Search, Filter, LayoutDashboard, Download, Edit3, Trash2, ShieldAlert, Plus, Menu, X } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

// --- INLINED UI COMPONENTS ---
function Button({ children, onClick, className = '', variant = 'primary', disabled = false, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) {
  const baseStyle = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary: "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 px-5 py-2.5",
    ghost: "px-4 py-2 hover:bg-slate-500/10",
    outline: "border-2 px-5 py-2 hover:-translate-y-0.5",
    danger: "bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:-translate-y-0.5 px-5 py-2.5",
  };
  return <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`} {...props}>{children}</button>;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

// --- TYPES ---
type TabType = 'dashboard' | 'owners' | 'users' | 'settings';

export default function App() {
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { logout } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // --- DATA STATES ---
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [owners, setOwners] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ commissionRate: 10, supportEmail: 'support@turfbook.com', maintenanceMode: false });

  // --- MODAL STATES ---
  const [showAddOwnerModal, setShowAddOwnerModal] = useState(false);
  const [newOwnerForm, setNewOwnerForm] = useState({ companyName: '', email: '', phone: '', password: '', businessRegisterNumber: '', businessAddress: '', billingEmail: '' });
  const [selectedOwnerForPayment, setSelectedOwnerForPayment] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', type: 'REGISTRATION_FEE', paymentMethod: 'UPI', transactionId: '' });

  // --- API CALLS ---
  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/dashboard');
      setDashboardStats(res.data.data);
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOwners = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/owners');
      setOwners(res.data.data);
    } catch (err) {
      console.error("Failed to fetch owners", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setIsLoading(false);
    }
  };



  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/settings');
      // Assume array of {key, value} 
      const settingsMap = res.data.data.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {});
      setSettings((prev: any) => ({ ...prev, ...settingsMap }));
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS ---
  const handleApproveOwner = async (id: string) => {
    try {
      await api.put(`/admin/owners/${id}/approve`);
      fetchOwners(); // Refresh
    } catch (err) {
      console.error("Failed to approve owner", err);
    }
  };

  const handleRejectOwner = async (id: string) => {
    try {
      await api.put(`/admin/owners/${id}/reject`, { rejectionReason: 'Admin decision' });
      fetchOwners(); // Refresh
    } catch (err) {
      console.error("Failed to reject owner", err);
    }
  };

  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await api.post('/auth/register-owner', newOwnerForm);
      setShowAddOwnerModal(false);
      setNewOwnerForm({ companyName: '', email: '', phone: '', password: '', businessRegisterNumber: '', businessAddress: '', billingEmail: '' });
      fetchOwners(); // Refresh
      alert('Owner added successfully and is pending approval.');
    } catch (err: any) {
      console.error("Failed to add owner", err);
      const backendErrors = err.response?.data?.errors;
      if (backendErrors && Array.isArray(backendErrors)) {
        const errorMsg = backendErrors.map(e => `• ${e.path}: ${e.message}`).join('\n');
        alert(`Validation failed:\n${errorMsg}`);
      } else {
        alert(err.response?.data?.message || 'Failed to add owner');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowPaymentHistory = (owner: any) => {
    setSelectedOwnerForPayment(owner);
    setShowPaymentModal(true);
  };

  const handleUpdatePaymentStatus = async (ownerId: string, status: 'PENDING' | 'PAID') => {
    try {
      setIsLoading(true);
      await api.put(`/admin/owners/${ownerId}/payment`, { status });
      const res = await api.get('/admin/owners');
      setOwners(res.data.data);
      if (selectedOwnerForPayment && selectedOwnerForPayment.id === ownerId) {
        const updated = res.data.data.find((o: any) => o.id === ownerId);
        setSelectedOwnerForPayment(updated);
      }
      alert(`Payment status updated to ${status}`);
    } catch (err) {
      console.error("Failed to update payment status", err);
      alert("Failed to update payment status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwnerForPayment) return;
    try {
      setIsLoading(true);
      const payload = {
        status: 'PAID',
        paymentEntry: {
          amount: Number(paymentForm.amount),
          type: paymentForm.type,
          paymentMethod: paymentForm.paymentMethod,
          transactionId: paymentForm.transactionId || `tx_${Date.now()}`
        }
      };
      await api.put(`/admin/owners/${selectedOwnerForPayment.id}/payment`, payload);
      const res = await api.get('/admin/owners');
      setOwners(res.data.data);
      const updated = res.data.data.find((o: any) => o.id === selectedOwnerForPayment.id);
      setSelectedOwnerForPayment(updated);
      setPaymentForm({ amount: '', type: 'REGISTRATION_FEE', paymentMethod: 'UPI', transactionId: '' });
      alert('Payment recorded successfully');
    } catch (err) {
      console.error("Failed to record payment", err);
      alert("Failed to record payment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBlockUser = async (id: string, isBlocked: boolean) => {
    try {
      if (isBlocked) {
        await api.put(`/admin/users/${id}/unblock`);
      } else {
        await api.put(`/admin/users/${id}/block`);
      }
      fetchUsers(); // Refresh
    } catch (err) {
      console.error("Failed to toggle block user", err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers(); // Refresh
    } catch (err) {
      console.error("Failed to delete user", err);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      // Backend expects setting one by one based on routes: PUT /admin/settings/:key
      const keys = Object.keys(settings);
      for (const key of keys) {
        await api.put(`/admin/settings/${key}`, { value: String(settings[key]) }).catch(e => console.warn(`Failed to save ${key}`));
      }
      alert('Settings saved successfully');
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboardStats();
    if (activeTab === 'owners') fetchOwners();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'settings') fetchSettings();
  }, [activeTab]);


  // --- FORMATTING HELPERS ---
  const getStatusBadge = (status: string) => {
    if (!status) return null;
    switch (status.toUpperCase()) {
      case 'SUCCESS':
      case 'ACTIVE':
      case 'APPROVED':
        return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}><CheckCircle className="h-3 w-3" /> {status}</span>;
      case 'PENDING':
        return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-700'}`}><Clock className="h-3 w-3" /> {status}</span>;
      case 'FAILED':
      case 'SUSPENDED':
      case 'BLOCKED':
      case 'REJECTED':
        return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-100 text-rose-700'}`}><XCircle className="h-3 w-3" /> {status}</span>;
      default:
        return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-500`}><Clock className="h-3 w-3" /> {status}</span>;
    }
  };

  // --- VIEW RENDERERS ---
  const renderDashboard = () => {
    const defaultStats = [
      { label: 'Active Turfs', value: dashboardStats?.activeTurfs || '0', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
      { label: 'Total Owners', value: dashboardStats?.totalTurfOwners || '0', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
      { label: 'Bookings Today', value: dashboardStats?.bookingsToday || '0', icon: CalendarDays, color: 'text-violet-500', bg: 'bg-violet-500/10' },
      { label: 'Revenue Today', value: formatCurrency(dashboardStats?.revenueToday || 0), icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ];

    const quickActions = [
      { label: 'Owner Approvals', tab: 'owners', icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-500/10', badge: dashboardStats?.pendingOwners ? `${dashboardStats.pendingOwners} Pending` : null },
      { label: 'Manage Users', tab: 'users', icon: UserCheck, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
      { label: 'System Settings', tab: 'settings', icon: Settings, color: 'text-slate-500', bg: 'bg-slate-500/10' },
    ];

    const recentActivity = dashboardStats?.recentActivity || [
       { id: '1', action: 'System running normally', target: 'API', status: 'SUCCESS', createdAt: new Date().toISOString() }
    ];

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className={`text-4xl font-black tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Dashboard Overview</h1>
            <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Real-time stats and management controls for TurfBook system.</p>
          </div>
        </div>

        {isLoading ? (
           <div className={`p-8 text-center rounded-xl backdrop-blur-md ${isDarkMode ? 'bg-slate-900/50 text-slate-400' : 'bg-white/50 text-slate-500'}`}>Loading dashboard stats...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {defaultStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className={`group border rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${
                    isDarkMode 
                      ? 'bg-slate-900/40 border-slate-800/50 hover:border-emerald-500/30 hover:bg-slate-900/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]' 
                      : 'bg-white/80 border-slate-200/50 hover:border-emerald-200 hover:bg-white shadow-lg'
                  } backdrop-blur-xl`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-semibold tracking-wide mb-1 transition-colors ${isDarkMode ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-500 group-hover:text-slate-600'}`}>{stat.label}</p>
                        <p className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{stat.value}</p>
                      </div>
                      <div className={`p-3.5 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${stat.bg} ${stat.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="col-span-1 space-y-6">
                <h3 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  <Activity className="h-5 w-5 text-emerald-500" /> Quick Actions
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button key={action.label} onClick={() => setActiveTab(action.tab as TabType)} className={`w-full group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg ${
                        isDarkMode 
                          ? 'bg-slate-900/40 border-slate-800/50 hover:bg-slate-800/60 hover:border-slate-700' 
                          : 'bg-white/80 border-slate-200/50 hover:bg-white hover:border-slate-300 shadow-sm'
                      } backdrop-blur-xl text-left`}>
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110 ${action.bg} ${action.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className={`font-semibold ${isDarkMode ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-900'}`}>
                            {action.label}
                          </span>
                        </div>
                        {action.badge ? (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                            {action.badge}
                          </span>
                        ) : (
                          <ArrowRight className={`h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 ${isDarkMode ? 'text-slate-500 group-hover:text-emerald-400' : 'text-slate-400 group-hover:text-emerald-600'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="col-span-1 lg:col-span-2 space-y-6">
                <h3 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  <Clock className="h-5 w-5 text-indigo-500" /> Recent Activity
                </h3>
                <div className={`border rounded-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 ${
                  isDarkMode ? 'bg-slate-900/40 border-slate-800/50 shadow-xl' : 'bg-white/80 border-slate-200/50 shadow-lg'
                }`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b text-sm font-semibold tracking-wide ${
                          isDarkMode ? 'border-slate-800/50 text-slate-400 bg-slate-900/50' : 'border-slate-200 text-slate-500 bg-slate-50/50'
                        }`}>
                          <th className="py-4 px-6">Event</th>
                          <th className="py-4 px-6">Target</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6">Time</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {recentActivity.map((activity: any) => (
                          <tr key={activity.id} className={`border-b last:border-0 transition-colors duration-200 ${
                            isDarkMode ? 'border-slate-800/30 hover:bg-slate-800/40 text-slate-300' : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                          }`}>
                            <td className={`py-4 px-6 font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{activity.action}</td>
                            <td className="py-4 px-6">{activity.target}</td>
                            <td className="py-4 px-6">{getStatusBadge(activity.status)}</td>
                            <td className={`py-4 px-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{new Date(activity.createdAt).toLocaleTimeString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderOwners = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h2 className={`text-3xl font-extrabold tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Owner Approvals</h2>
          <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Review and approve new turf owners on the platform.</p>
        </div>
        <Button onClick={() => setShowAddOwnerModal(true)} variant="primary" className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Owner
        </Button>
      </div>
      
      {isLoading ? (
         <div className={`p-8 text-center rounded-xl backdrop-blur-md ${isDarkMode ? 'bg-slate-900/50 text-slate-400' : 'bg-white/50 text-slate-500'}`}>Loading owners...</div>
      ) : (
        <div className={`border rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl transition-all ${
          isDarkMode ? 'bg-slate-900/60 border-slate-800/50' : 'bg-white/90 border-slate-200/50'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-sm font-semibold tracking-wide ${
                  isDarkMode ? 'border-slate-800/50 text-slate-400 bg-slate-900/50' : 'border-slate-200 text-slate-500 bg-slate-50/50'
                }`}>
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Owner Name</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Phone</th>
                  <th className="py-4 px-6">Approval</th>
                  <th className="py-4 px-6">Payment Status</th>
                  <th className="py-4 px-6">Joined</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {owners.length === 0 && (
                   <tr><td colSpan={8} className="py-8 text-center opacity-50">No owners found</td></tr>
                )}
                {owners.map((owner) => (
                  <tr key={owner.id} className={`border-b last:border-0 transition-colors duration-200 ${
                    isDarkMode ? 'border-slate-800/30 hover:bg-slate-800/40 text-slate-300' : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                  }`}>
                    <td className={`py-4 px-6 font-medium ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{owner.id.substring(0, 8)}</td>
                    <td className="py-4 px-6 font-bold">{owner.name || owner.email}</td>
                    <td className="py-4 px-6">{owner.email}</td>
                    <td className="py-4 px-6 font-semibold">{owner.phone || 'N/A'}</td>
                    <td className="py-4 px-6">{getStatusBadge(owner.ownerStatus || 'PENDING')}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(owner.paymentStatus || 'PENDING')}
                        <button 
                          onClick={() => handleShowPaymentHistory(owner)}
                          title="View Payment History"
                          className={`p-1.5 rounded-lg border transition-all ${
                            isDarkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className={`py-4 px-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{new Date(owner.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 px-6 text-right flex justify-end gap-2">
                      {owner.ownerStatus !== 'APPROVED' && (
                         <Button variant="primary" className="py-1.5 px-3 text-xs" onClick={() => handleApproveOwner(owner.id)}>Approve</Button>
                      )}
                      {owner.ownerStatus !== 'REJECTED' && (
                         <Button variant="outline" onClick={() => handleRejectOwner(owner.id)} className={`py-1.5 px-3 text-xs ${isDarkMode ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10' : 'border-rose-200 text-rose-700 hover:bg-rose-50'}`}>Reject</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddOwnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'}`}>
            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Add New Owner</h3>
            <form onSubmit={handleAddOwner} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Company Name</label>
                  <input required type="text" value={newOwnerForm.companyName} onChange={e => setNewOwnerForm({...newOwnerForm, companyName: e.target.value})} className={`w-full px-3 py-2 rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Email</label>
                  <input required type="email" value={newOwnerForm.email} onChange={e => setNewOwnerForm({...newOwnerForm, email: e.target.value})} className={`w-full px-3 py-2 rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Phone</label>
                  <input required type="text" value={newOwnerForm.phone} onChange={e => setNewOwnerForm({...newOwnerForm, phone: e.target.value})} className={`w-full px-3 py-2 rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
                  <input required type="password" value={newOwnerForm.password} onChange={e => setNewOwnerForm({...newOwnerForm, password: e.target.value})} className={`w-full px-3 py-2 rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Business Register Number</label>
                  <input required type="text" value={newOwnerForm.businessRegisterNumber} onChange={e => setNewOwnerForm({...newOwnerForm, businessRegisterNumber: e.target.value})} className={`w-full px-3 py-2 rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Billing Email</label>
                  <input required type="email" value={newOwnerForm.billingEmail} onChange={e => setNewOwnerForm({...newOwnerForm, billingEmail: e.target.value})} className={`w-full px-3 py-2 rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Business Address</label>
                  <input required type="text" value={newOwnerForm.businessAddress} onChange={e => setNewOwnerForm({...newOwnerForm, businessAddress: e.target.value})} className={`w-full px-3 py-2 rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowAddOwnerModal(false)} className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Adding...' : 'Add Owner'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && selectedOwnerForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-2xl p-6 rounded-2xl shadow-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-700 text-white' : 'bg-white border border-slate-200 text-slate-900'} max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6 border-b pb-4 border-slate-500/10">
              <div>
                <h3 className="text-xl font-bold">Payment Setup & History</h3>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{selectedOwnerForPayment.name || selectedOwnerForPayment.email}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}><X className="h-5 w-5" /></button>
            </div>

            {selectedOwnerForPayment.ownerStatus !== 'APPROVED' && (
              <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
                isDarkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-250 text-amber-800'
              }`}>
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong>Registration Pending Approval:</strong> You must approve this owner's registration first in order to manage or record subscription payments.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Status & Recording */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-3">Overall Payment Status</h4>
                  <div className={`flex items-center justify-between p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedOwnerForPayment.paymentStatus || 'PENDING')}
                    </div>
                    <div className="flex gap-2">
                      {selectedOwnerForPayment.paymentStatus !== 'PAID' ? (
                        <Button disabled={selectedOwnerForPayment.ownerStatus !== 'APPROVED'} variant="primary" className="py-1 px-3 text-xs" onClick={() => handleUpdatePaymentStatus(selectedOwnerForPayment.id, 'PAID')}>Mark Paid</Button>
                      ) : (
                        <Button disabled={selectedOwnerForPayment.ownerStatus !== 'APPROVED'} variant="outline" className={`py-1 px-3 text-xs ${isDarkMode ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10' : 'border-rose-250 text-rose-700 hover:bg-rose-50'}`} onClick={() => handleUpdatePaymentStatus(selectedOwnerForPayment.id, 'PENDING')}>Mark Pending</Button>
                      )}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleRecordPayment} className="space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 border-b pb-1 border-slate-500/10">Record New Payment</h4>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Amount (INR)</label>
                    <input disabled={selectedOwnerForPayment.ownerStatus !== 'APPROVED'} required type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} className={`w-full px-3 py-2 rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} placeholder="e.g. 5000" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Type</label>
                      <select disabled={selectedOwnerForPayment.ownerStatus !== 'APPROVED'} value={paymentForm.type} onChange={e => setPaymentForm({...paymentForm, type: e.target.value})} className={`w-full px-3 py-2 rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}>
                        <option value="REGISTRATION_FEE">Registration Fee</option>
                        <option value="SUBSCRIPTION_RENEWAL">Subscription Renewal</option>
                        <option value="COMMISSION_PAYMENT">Commission Payment</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Method</label>
                      <select disabled={selectedOwnerForPayment.ownerStatus !== 'APPROVED'} value={paymentForm.paymentMethod} onChange={e => setPaymentForm({...paymentForm, paymentMethod: e.target.value})} className={`w-full px-3 py-2 rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}>
                        <option value="UPI">UPI</option>
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="NET_BANKING">Net Banking</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Transaction ID (Optional)</label>
                    <input disabled={selectedOwnerForPayment.ownerStatus !== 'APPROVED'} type="text" value={paymentForm.transactionId} onChange={e => setPaymentForm({...paymentForm, transactionId: e.target.value})} className={`w-full px-3 py-2 rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} placeholder="e.g. txn_abc123" />
                  </div>
                  <Button disabled={selectedOwnerForPayment.ownerStatus !== 'APPROVED' || isLoading} type="submit" variant="primary" className="w-full py-2">Record Payment</Button>
                </form>
              </div>

              {/* Payment History Log */}
              <div className="flex flex-col h-full">
                <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-3">Payment History</h4>
                <div className={`flex-1 border rounded-xl p-4 overflow-y-auto ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} min-h-[300px] max-h-[350px]`}>
                  {!selectedOwnerForPayment.paymentHistory || selectedOwnerForPayment.paymentHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-10">
                      <Clock className="h-8 w-8 mb-2" />
                      <p className="text-sm">No payment history found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedOwnerForPayment.paymentHistory.map((item: any) => (
                        <div key={item.id} className={`p-3 rounded-lg border text-xs transition-all ${
                          isDarkMode ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm hover:shadow'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-emerald-500">{formatCurrency(item.amount)}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              item.type === 'REGISTRATION_FEE' ? 'bg-blue-500/10 text-blue-400' :
                              item.type === 'SUBSCRIPTION_RENEWAL' ? 'bg-purple-500/10 text-purple-400' :
                              'bg-amber-500/10 text-amber-400'
                            }`}>{item.type.replace('_', ' ')}</span>
                          </div>
                          <div className="flex justify-between text-slate-450 mt-1">
                            <span>Method: {item.paymentMethod}</span>
                            <span>{new Date(item.date).toLocaleDateString()}</span>
                          </div>
                          {item.transactionId && (
                            <div className="text-[10px] text-slate-500 mt-1 break-all">ID: {item.transactionId}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h2 className={`text-3xl font-extrabold tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>User Management</h2>
          <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Manage all customers and owners across the platform.</p>
        </div>
        <div className="flex gap-3">
          <div className={`flex items-center px-4 py-2 border rounded-xl backdrop-blur-md ${isDarkMode ? 'border-slate-700 bg-slate-900/50 text-slate-300' : 'border-slate-300 bg-white/50 text-slate-700'}`}>
            <Search className="h-4 w-4 mr-2 opacity-50" />
            <input type="text" placeholder="Search users..." className="bg-transparent outline-none w-40 text-sm" />
          </div>
          <Button variant="outline" className={isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}>
            <Filter className="h-4 w-4 mr-2" /> Filter
          </Button>
        </div>
      </div>
      
      {isLoading ? (
         <div className={`p-8 text-center rounded-xl backdrop-blur-md ${isDarkMode ? 'bg-slate-900/50 text-slate-400' : 'bg-white/50 text-slate-500'}`}>Loading users...</div>
      ) : (
        <div className={`border rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl transition-all ${
          isDarkMode ? 'bg-slate-900/60 border-slate-800/50' : 'bg-white/90 border-slate-200/50'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-sm font-semibold tracking-wide ${
                  isDarkMode ? 'border-slate-800/50 text-slate-400 bg-slate-900/50' : 'border-slate-200 text-slate-500 bg-slate-50/50'
                }`}>
                  <th className="py-4 px-6">User ID</th>
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {users.length === 0 && (
                   <tr><td colSpan={6} className="py-8 text-center opacity-50">No users found</td></tr>
                )}
                {users.map((user) => (
                  <tr key={user.id} className={`border-b last:border-0 transition-colors duration-200 ${
                    isDarkMode ? 'border-slate-800/30 hover:bg-slate-800/40 text-slate-300' : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                  }`}>
                    <td className={`py-4 px-6 font-medium ${isDarkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>{user.id.substring(0, 8)}</td>
                    <td className="py-4 px-6 font-bold">{user.name || 'No name'}</td>
                    <td className={`py-4 px-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{user.email}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        user.role === 'SUPER_ADMIN' ? 'bg-indigo-500/10 text-indigo-500' : 
                        user.role === 'OWNER' ? 'bg-emerald-500/10 text-emerald-500' : 
                        'bg-slate-500/10 text-slate-500'
                      }`}>{user.role}</span>
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(user.isBlocked ? 'BLOCKED' : 'ACTIVE')}</td>
                    <td className="py-4 px-6 text-right flex justify-end gap-2">
                      <button onClick={() => handleToggleBlockUser(user.id, user.isBlocked)} title={user.isBlocked ? 'Unblock User' : 'Block User'} className={`p-2 rounded-lg transition-colors ${
                        user.isBlocked 
                        ? (isDarkMode ? 'bg-emerald-900/50 text-emerald-400 hover:text-emerald-300' : 'bg-emerald-100 text-emerald-600 hover:text-emerald-700')
                        : (isDarkMode ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900')
                      }`}>
                        {user.isBlocked ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                      </button>
                      <button onClick={() => handleDeleteUser(user.id)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-rose-900/50 text-rose-400 hover:text-rose-300' : 'hover:bg-rose-100 text-rose-500 hover:text-rose-600'}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );



  const renderSettings = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <h2 className={`text-3xl font-extrabold tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>System Settings</h2>
        <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Global platform configurations and API keys.</p>
      </div>
      
      {isLoading && Object.keys(settings).length === 0 ? (
        <div className={`p-8 text-center rounded-xl backdrop-blur-md ${isDarkMode ? 'bg-slate-900/50 text-slate-400' : 'bg-white/50 text-slate-500'}`}>Loading settings...</div>
      ) : (
        <div className={`border rounded-2xl p-8 max-w-3xl backdrop-blur-xl shadow-xl transition-all ${
          isDarkMode ? 'bg-slate-900/40 border-slate-800/50' : 'bg-white/80 border-slate-200/50'
        }`}>
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Platform Commission Rate (%)</label>
              <input 
                type="number" 
                value={settings.commissionRate || ''} 
                onChange={e => setSettings({...settings, commissionRate: e.target.value})}
                className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                  isDarkMode ? 'bg-slate-900/50 border-slate-700 text-white focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                }`} 
              />
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Support Contact Email</label>
              <input 
                type="email" 
                value={settings.supportEmail || ''} 
                onChange={e => setSettings({...settings, supportEmail: e.target.value})}
                className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                  isDarkMode ? 'bg-slate-900/50 border-slate-700 text-white focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                }`} 
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border bg-slate-500/5 border-slate-500/20">
              <div>
                <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Maintenance Mode</h4>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Disable access for customers and owners.</p>
              </div>
              <div 
                onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                className={`w-12 h-6 rounded-full cursor-pointer relative transition-colors ${
                  settings.maintenanceMode 
                    ? 'bg-emerald-500'
                    : isDarkMode ? 'bg-slate-700' : 'bg-slate-300'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.maintenanceMode ? 'translate-x-7' : 'translate-x-1'}`}></div>
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <Button variant="primary" onClick={handleSaveSettings} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  // --- MAIN LAYOUT ---
  return (
    <div className={`min-h-screen transition-colors duration-500 flex relative overflow-hidden ${
      isDarkMode ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
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

      {/* Background Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/15 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none z-0" />

      {/* Sidebar */}
      <aside className={`border-r flex flex-col justify-between shrink-0 transition-all duration-300 z-50 md:z-20 md:relative md:translate-x-0 backdrop-blur-2xl ${
        isSidebarCollapsed ? 'w-20 p-3.5' : 'w-64 p-6'
      } ${
        isDarkMode ? 'border-slate-800/50 bg-[#030712]/80' : 'border-slate-200/50 bg-white/80'
      }`}>
        <div className="space-y-8">
          {/* Logo & Header toggler */}
          <div className={`flex items-center justify-between ${isSidebarCollapsed ? 'flex-col gap-4' : 'w-full'}`}>
            <div className={`flex items-center gap-3 cursor-pointer ${isSidebarCollapsed ? 'hidden' : 'flex'}`} onClick={() => setActiveTab('dashboard')}>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-emerald-500/20 shrink-0">
                T
              </div>
              <span className={`text-xl font-extrabold tracking-tight transition-colors duration-300 ${isDarkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300' : 'text-emerald-700'}`}>TurfBook Admin</span>
            </div>

            {isSidebarCollapsed && (
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-emerald-500/20 shrink-0 cursor-pointer" onClick={() => { setActiveTab('dashboard'); setIsSidebarCollapsed(false); }}>
                T
              </div>
            )}

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`p-2 rounded-xl border transition-all ${
                isDarkMode ? 'border-slate-800 text-slate-400 hover:text-slate-200 bg-slate-900/50' : 'border-slate-200 text-slate-500 hover:text-slate-800 bg-slate-50'
              }`}
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </button>
          </div>

          <nav className="flex flex-col gap-1.5">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'owners', label: 'Owner Approvals', icon: MapPin },
              { id: 'users', label: 'Manage Users', icon: Users },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center rounded-xl transition-all duration-300 font-semibold ${
                    isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
                  } ${
                    isActive
                      ? isDarkMode 
                        ? 'bg-emerald-500/10 text-emerald-400 shadow-sm border border-emerald-500/20' 
                        : 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200/50'
                      : isDarkMode
                        ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                        : 'text-slate-600 hover:bg-slate-100/50 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'animate-pulse' : ''}`} />
                  <span className={isSidebarCollapsed ? 'hidden' : 'block'}>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className={`border-t border-slate-800/30 ${isSidebarCollapsed ? 'pt-4' : 'p-4'}`}>
           <button
            onClick={toggleTheme}
            title={isSidebarCollapsed ? "Toggle theme" : undefined}
            className={`w-full flex items-center rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
              isSidebarCollapsed ? 'justify-center p-3' : 'justify-between p-3'
            } ${
              isDarkMode
                ? 'border-slate-700/50 text-slate-400 hover:text-emerald-400 bg-slate-800/50 hover:bg-slate-800'
                : 'border-slate-200 text-slate-500 hover:text-emerald-600 bg-white shadow-sm hover:shadow-md'
            }`}
          >
            <span className={`font-semibold text-sm ${isSidebarCollapsed ? 'hidden' : 'block'}`}>Theme</span>
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto z-10 relative">
        <header className="px-8 py-5 flex items-center justify-end sticky top-0 z-30 transition-all duration-500 bg-transparent">
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-full border text-sm font-semibold flex items-center gap-2 shadow-md backdrop-blur-md transition-colors duration-300 ${
              isDarkMode ? 'bg-slate-900/80 border-slate-700/50 text-slate-300' : 'bg-white/90 border-slate-200/80 text-slate-700'
            }`}>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              System Online
            </div>
            <button
              onClick={logout}
              className={`font-semibold text-sm px-5 py-2 rounded-full border transition-all duration-300 hover:scale-[1.02] shadow-md backdrop-blur-md ${
                isDarkMode
                  ? 'bg-slate-900/80 border-slate-700/50 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 hover:border-rose-500/30'
                  : 'bg-white/90 border-slate-200/80 text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
              }`}
            >
              Logout
            </button>
          </div>
        </header>

        <div className="px-8 pt-5 pb-16">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'owners' && renderOwners()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  );
}

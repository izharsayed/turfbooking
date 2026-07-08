import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, UserRole } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { api } from '../store/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  const [role, setRole] = useState<UserRole>('customer');
  const [phone, setPhone] = useState('9876543210');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      setError('Please fill in all fields');
      return;
    }

    let email = `${role}@turfbook.com`;
    if (phone === '9876543210') email = 'customer@turfbook.com';
    if (phone === '9999988888') email = 'owner@turfbook.com';
    if (phone === '8888877777') email = 'admin@turfbook.com';

    try {
      setError('');
      const response = await api.post('/auth/login', { email, password });
      const payload = response.data;
      if (payload && payload.success && payload.data) {
        const { accessToken, user } = payload.data;
        const userRoleMap: Record<string, UserRole> = {
          CUSTOMER: 'customer',
          TURF_OWNER: 'owner',
          SUPER_ADMIN: 'admin',
          ADMIN: 'admin',
        };
        const mappedUser = {
          id: user.id,
          email: user.email,
          role: userRoleMap[user.role] || 'customer',
          name: user.name,
          phone: user.phone,
        };

        login(mappedUser, accessToken);

        const redirects: Record<UserRole, string> = {
          customer: '/customer',
          owner: '/owner',
          admin: '/admin',
        };
        navigate(redirects[mappedUser.role]);
      } else {
        setError(payload.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative ${isDarkMode ? 'bg-[#030712]' : 'bg-slate-100'}`}>

      {/* Background image */}
      <img
        src="/images/turf-bg.jpg"
        alt="turf background"
        className="fixed inset-0 w-full h-full object-cover pointer-events-none select-none"
        style={{ opacity: isDarkMode ? 0.18 : 0.10 }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: isDarkMode
            ? 'linear-gradient(to bottom, rgba(3,7,18,0.7) 0%, rgba(3,7,18,0.5) 50%, rgba(3,7,18,0.8) 100%)'
            : 'linear-gradient(to bottom, rgba(241,245,249,0.7) 0%, rgba(241,245,249,0.5) 50%, rgba(241,245,249,0.8) 100%)',
        }}
      />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className={`fixed top-5 right-5 p-2 rounded-xl border z-50 transition-all ${
          isDarkMode ? 'border-slate-700 text-slate-400 bg-slate-900/60' : 'border-slate-200 text-slate-600 bg-white/80'
        }`}
      >
        {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* Login card */}
      <div className={`relative z-10 w-full max-w-md mx-4 rounded-3xl border p-8 shadow-2xl backdrop-blur-xl ${
        isDarkMode
          ? 'bg-[#030712]/80 border-emerald-500/20 shadow-[0_0_60px_-15px_rgba(16,185,129,0.25)]'
          : 'bg-white/90 border-slate-200'
      }`}>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl">T</div>
          <span className={`text-xl font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>TurfBook</span>
        </div>

        <h1 className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Welcome back</h1>
        <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sign in to your account</p>

        {/* Role selector */}
        <div className={`flex rounded-xl p-1 mb-4 gap-1 ${isDarkMode ? 'bg-slate-800/60' : 'bg-slate-100'}`}>
          {(['customer', 'owner', 'admin'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => {
                setRole(r);
                if (r === 'customer') {
                  setPhone('9876543210');
                  setPassword('password');
                } else if (r === 'owner') {
                  setPhone('9999988888');
                  setPassword('password');
                } else if (r === 'admin') {
                  setPhone('8888877777');
                  setPassword('password');
                }
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                role === r
                  ? 'bg-emerald-600 text-white shadow'
                  : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Quick Demo Login Dropdown */}
        <div className="mb-6">
          <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
            ⚡ Quick Demo Login
          </label>
          <select
            onChange={(e) => {
              const val = e.target.value as UserRole;
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
            value={role}
            className={`w-full px-3 py-3 rounded-xl border text-sm outline-none font-semibold transition-all ${
              isDarkMode 
                ? 'bg-[#0f172a] border-slate-700 text-slate-300 focus:border-emerald-500/50' 
                : 'bg-white border-slate-300 text-slate-700 focus:border-emerald-500/50 shadow-sm'
            }`}
          >
            <option value="customer">👤 Customer (9876543210)</option>
            <option value="owner">🏟️ Turf Owner (9999988888)</option>
            <option value="admin">🛠️ System Admin (8888877777)</option>
          </select>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Phone */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Phone Number
            </label>
            <div className={`flex rounded-xl border overflow-hidden ${isDarkMode ? 'border-slate-700' : 'border-slate-300'}`}>
              <span className={`px-3 py-3 text-sm font-medium border-r ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-300'}`}>
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className={`flex-1 px-3 py-3 text-sm outline-none ${isDarkMode ? 'bg-[#0f172a] text-white placeholder-slate-600' : 'bg-white text-slate-900 placeholder-slate-400'}`}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Password
            </label>
            <div className={`flex rounded-xl border overflow-hidden ${isDarkMode ? 'border-slate-700' : 'border-slate-300'}`}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`flex-1 px-3 py-3 text-sm outline-none ${isDarkMode ? 'bg-[#0f172a] text-white placeholder-slate-600' : 'bg-white text-slate-900 placeholder-slate-400'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`px-3 ${isDarkMode ? 'bg-[#0f172a] text-slate-500' : 'bg-white text-slate-400'}`}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-900/30 mt-2"
          >
            Sign In as {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        </form>
      </div>
    </div>
  );
}

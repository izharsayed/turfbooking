import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, UserRole } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Sun, Moon, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  const [role, setRole] = useState<UserRole>('customer');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Mock login — replace with real API call
    const mockUser = {
      id: '1',
      email: `${role}@turfbook.com`,
      role,
      name: role === 'admin' ? 'Admin User' : role === 'owner' ? 'Turf Owner' : 'Customer',
      phone,
    };

    login(mockUser, 'mock-token-' + role);

    const redirects: Record<UserRole, string> = {
      customer: '/customer',
      owner: '/owner',
      admin: '/admin',
    };
    navigate(redirects[role]);
  };

  // Dynamic theme colors based on role
  const isRoleAdmin = role === 'admin';
  const themeColors = {
    bgActive: isRoleAdmin ? 'bg-indigo-600' : 'bg-emerald-600',
    bgHover: isRoleAdmin ? 'hover:bg-indigo-500' : 'hover:bg-emerald-500',
    text: isRoleAdmin ? 'text-indigo-600' : 'text-emerald-600',
    textDark: isRoleAdmin ? 'text-indigo-400' : 'text-emerald-400',
    borderGlow: isRoleAdmin ? 'border-indigo-500/30' : 'border-emerald-500/20',
    shadowGlow: isRoleAdmin ? 'shadow-[0_0_60px_-15px_rgba(79,70,229,0.3)]' : 'shadow-[0_0_60px_-15px_rgba(16,185,129,0.25)]',
    btnShadow: isRoleAdmin ? 'shadow-indigo-900/40' : 'shadow-emerald-900/30',
    gradientDark: isRoleAdmin 
      ? 'linear-gradient(to bottom, rgba(3,7,18,0.7) 0%, rgba(31,41,55,0.4) 50%, rgba(3,7,18,0.8) 100%)' 
      : 'linear-gradient(to bottom, rgba(3,7,18,0.7) 0%, rgba(3,7,18,0.5) 50%, rgba(3,7,18,0.8) 100%)',
    gradientLight: isRoleAdmin
      ? 'linear-gradient(to bottom, rgba(241,245,249,0.7) 0%, rgba(224,231,255,0.4) 50%, rgba(241,245,249,0.8) 100%)'
      : 'linear-gradient(to bottom, rgba(241,245,249,0.7) 0%, rgba(241,245,249,0.5) 50%, rgba(241,245,249,0.8) 100%)',
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative ${isDarkMode ? 'bg-[#030712]' : 'bg-slate-100'}`}>

      {/* Background image */}
      <img
        src="/images/turf-bg.jpg"
        alt="turf background"
        className={`fixed inset-0 w-full h-full object-cover pointer-events-none select-none transition-all duration-700 ${isRoleAdmin ? 'grayscale mix-blend-luminosity' : ''}`}
        style={{ opacity: isDarkMode ? (isRoleAdmin ? 0.12 : 0.18) : 0.10 }}
      />
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: isDarkMode
            ? themeColors.gradientDark
            : themeColors.gradientLight,
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
      <div className={`relative z-10 w-full max-w-md mx-4 rounded-3xl border p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 ${
        isDarkMode
          ? `bg-[#030712]/80 ${themeColors.borderGlow} ${themeColors.shadowGlow}`
          : 'bg-white/90 border-slate-200'
      }`}>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-xl transition-colors duration-500 ${themeColors.bgActive}`}>T</div>
          <span className={`text-xl font-bold transition-colors duration-500 ${isDarkMode ? themeColors.textDark : themeColors.text}`}>TurfBook</span>
        </div>

        <h1 className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Welcome back</h1>
        <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sign in to your account</p>

        {/* Role selector */}
        <div className={`flex rounded-xl p-1 mb-6 gap-1 ${isDarkMode ? 'bg-slate-800/60' : 'bg-slate-100'}`}>
          {(['customer', 'owner', 'admin'] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-300 ${
                role === r
                  ? `${themeColors.bgActive} text-white shadow-md transform scale-[1.02]`
                  : isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              {r}
            </button>
          ))}
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
            className={`w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-300 shadow-lg mt-4 flex items-center justify-center gap-2 hover:-translate-y-0.5 ${themeColors.bgActive} ${themeColors.bgHover} ${themeColors.btnShadow}`}
          >
            {isRoleAdmin && <ShieldCheck className="h-4 w-4" />}
            Sign In as {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        </form>
      </div>
    </div>
  );
}

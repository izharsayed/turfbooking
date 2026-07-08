import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, UserRole } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Sun, Moon, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    setOtpLoading(true);
    try {
      await api.post('/auth/send-otp', { phone });
      setOtpSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Ensure number is registered.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent, directOtp?: string) => {
    if (e) e.preventDefault();
    const verificationCode = directOtp || otp;
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit OTP code');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { phone, code: verificationCode });
      const { accessToken, refreshToken, user: backendUser } = res.data.data;

      // Map backend role to frontend role
      const roleMap: Record<string, UserRole> = {
        SUPER_ADMIN: 'admin',
        TURF_OWNER: 'owner',
        CUSTOMER: 'customer',
      };
      const mappedRole: UserRole = roleMap[backendUser.role] || 'customer';

      const userProfile = {
        id: backendUser.id,
        email: backendUser.email,
        role: mappedRole,
        name: backendUser.name || backendUser.email,
        phone: backendUser.phone,
      };

      login(userProfile, accessToken, refreshToken);

      const redirects: Record<UserRole, string> = {
        customer: '/customer',
        owner: '/owner',
        admin: '/admin',
      };
      navigate(redirects[mappedRole]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoSelect = async (val: string) => {
    let targetPhone = '';
    if (val === 'customer') {
      targetPhone = '9876543210';
    } else if (val === 'owner') {
      targetPhone = '9999988888';
    } else if (val === 'admin') {
      targetPhone = '8888877777';
    }

    if (targetPhone) {
      setPhone(targetPhone);
      setOtp('123456');
      setError('');
      setIsLoading(true);
      try {
        await api.post('/auth/send-otp', { phone: targetPhone });
        setOtpSent(true);
        // Call verification immediately
        const res = await api.post('/auth/verify-otp', { phone: targetPhone, code: '123456' });
        const { accessToken, refreshToken, user: backendUser } = res.data.data;
        const roleMap: Record<string, UserRole> = {
          SUPER_ADMIN: 'admin',
          TURF_OWNER: 'owner',
          CUSTOMER: 'customer',
        };
        const mappedRole: UserRole = roleMap[backendUser.role] || 'customer';
        const userProfile = {
          id: backendUser.id,
          email: backendUser.email,
          role: mappedRole,
          name: backendUser.name || backendUser.email,
          phone: backendUser.phone,
        };
        login(userProfile, accessToken, refreshToken);
        const redirects: Record<UserRole, string> = {
          customer: '/customer',
          owner: '/owner',
          admin: '/admin',
        };
        navigate(redirects[mappedRole]);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Quick login failed');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Dynamic theme colors
  const themeColors = {
    bgActive: 'bg-emerald-600',
    bgHover: 'hover:bg-emerald-500',
    text: 'text-emerald-600',
    textDark: 'text-emerald-400',
    borderGlow: 'border-emerald-500/20',
    shadowGlow: 'shadow-[0_0_60px_-15px_rgba(16,185,129,0.25)]',
    btnShadow: 'shadow-emerald-900/30',
    gradientDark: 'linear-gradient(to bottom, rgba(3,7,18,0.7) 0%, rgba(3,7,18,0.5) 50%, rgba(3,7,18,0.8) 100%)',
    gradientLight: 'linear-gradient(to bottom, rgba(241,245,249,0.7) 0%, rgba(241,245,249,0.5) 50%, rgba(241,245,249,0.8) 100%)',
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative ${isDarkMode ? 'bg-[#030712]' : 'bg-slate-100'}`}>

      {/* Background image */}
      <img
        src="/images/turf-bg.jpg"
        alt="turf background"
        className="fixed inset-0 w-full h-full object-cover pointer-events-none select-none transition-all duration-700"
        style={{ opacity: isDarkMode ? 0.18 : 0.10 }}
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
        <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sign in to your account with mobile OTP</p>

        {/* Quick Demo Login Dropdown */}
        <div className="mb-6">
          <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? themeColors.textDark : themeColors.text}`}>
            ⚡ Quick Demo Login
          </label>
          <select
            onChange={(e) => handleQuickDemoSelect(e.target.value)}
            defaultValue=""
            className={`w-full px-3 py-3 rounded-xl border text-sm outline-none font-semibold transition-all ${
              isDarkMode 
                ? 'bg-[#0f172a] border-slate-700 text-slate-350 focus:border-emerald-500/50' 
                : 'bg-white border-slate-300 text-slate-700 focus:border-emerald-500/50 shadow-sm'
            }`}
          >
            <option value="" disabled>-- Select a Demo User --</option>
            <option value="customer">👤 Customer (9876543210)</option>
            <option value="owner">🏟️ Turf Owner (9999988888)</option>
            <option value="admin">🛠️ System Admin (8888877777)</option>
          </select>
        </div>

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {/* Phone Number */}
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter 10-digit number"
                maxLength={15}
                className={`w-full px-4 py-3 text-sm rounded-xl border outline-none transition-all ${isDarkMode ? 'bg-[#0f172a] text-white placeholder-slate-600 border-slate-700 focus:border-emerald-500' : 'bg-white text-slate-900 placeholder-slate-400 border-slate-300 focus:border-emerald-400'}`}
              />
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={otpLoading}
              className={`w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-300 shadow-lg mt-4 flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed ${themeColors.bgActive} ${themeColors.bgHover} ${themeColors.btnShadow}`}
            >
              {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {otpLoading ? 'Sending OTP...' : 'Send Verification OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={(e) => handleVerifyOtp(e)} className="space-y-4">
            {/* Verification Code */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className={`block text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Enter 6-Digit OTP
                </label>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-xs text-emerald-500 hover:underline font-semibold"
                >
                  Edit Phone
                </button>
              </div>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123456"
                maxLength={6}
                className={`w-full px-4 py-3 text-sm rounded-xl border outline-none transition-all ${isDarkMode ? 'bg-[#0f172a] text-white placeholder-slate-600 border-slate-700 focus:border-emerald-500' : 'bg-white text-slate-900 placeholder-slate-400 border-slate-300 focus:border-emerald-400'}`}
              />
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-300 shadow-lg mt-4 flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed ${themeColors.bgActive} ${themeColors.bgHover} ${themeColors.btnShadow}`}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, UserRole } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { 
  Sun, 
  Moon, 
  Loader2, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ChevronDown, 
  ShieldCheck, 
  Calendar, 
  Award,
  Sparkles
} from 'lucide-react';
import api from '../services/api';

const Logo = () => (
  <div className="flex items-center gap-3">
    <svg className="w-10 h-10" viewBox="0 0 44 44" fill="none">
      <path
        d="M22 2C12 2 4 6 4 18C4 30 16 40 22 42C28 40 40 30 40 18C40 6 32 2 22 2Z"
        fill="#10B981"
      />
      <circle cx="22" cy="22" r="11" fill="#FFFFFF" />
      <path
        d="M22 11L25 15.5H19L22 11ZM19 15.5L15 19L17.5 24H26.5L29 19L25 15.5H19ZM17.5 24L22 29L26.5 24H17.5Z"
        fill="#1F2937"
      />
    </svg>
    <span className="text-2xl font-black tracking-wide text-white">
      Turf<span className="text-[#10B981]">Book</span>
    </span>
  </div>
);

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
    <path
      fill="#EA4335"
      d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.113 4.114a5.59 5.59 0 0 1-5.59-5.59 5.59 5.59 0 0 1 5.59-5.59c2.32 0 4.17 1.34 4.88 3.12l3.86-3a9.96 9.96 0 0 0-8.74-5.12c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.77 0 9.806-4.06 9.806-9.96 0-.62-.054-1.21-.16-1.785H12.24Z"
    />
  </svg>
);

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  // Register inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [devDropdownOpen, setDevDropdownOpen] = useState(false);

  // Signup role and owner-specific fields
  const [signupRole, setSignupRole] = useState<'customer' | 'owner'>('customer');
  const [companyName, setCompanyName] = useState('');
  const [businessRegisterNumber, setBusinessRegisterNumber] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [billingEmail, setBillingEmail] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (signupRole === 'owner') {
      if (!companyName.trim()) {
        setError('Please enter your Company/Business name');
        return;
      }
      if (!businessRegisterNumber.trim()) {
        setError('Please enter your Business Register Number');
        return;
      }
      if (!businessAddress.trim()) {
        setError('Please enter your Business Address');
        return;
      }
    }
    if (!password) {
      setError('Please create a password');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    setError('');
    setIsLoading(true);

    const finalEmail = email.trim() || `${phone}@turfbook.com`;
    const [firstName, ...lastNameParts] = name.trim().split(' ');
    const lastName = lastNameParts.join(' ') || ' ';

    try {
      if (signupRole === 'owner') {
        await api.post('/auth/register-owner', {
          companyName: companyName.trim(),
          email: finalEmail,
          phone,
          password,
          businessRegisterNumber: businessRegisterNumber.trim(),
          businessAddress: businessAddress.trim(),
          billingEmail: billingEmail.trim() || finalEmail,
        });

        alert('Owner registration submitted successfully! Your account is pending Super Admin approval. Please log in once approved.');
        navigate('/login');
      } else {
        await api.post('/auth/register', {
          firstName,
          lastName,
          email: finalEmail,
          phone,
          password,
          acceptTerms: true,
        });

        const res = await api.post('/auth/login', { email: finalEmail, password });
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
          name: backendUser.name || `${firstName} ${lastName}`.trim(),
          phone: backendUser.phone,
        };

        login(userProfile, accessToken, refreshToken);
        const redirects: Record<UserRole, string> = {
          customer: '/customer',
          owner: '/owner',
          admin: '/admin',
        };
        navigate(redirects[mappedRole]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
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
      setError('');
      setIsLoading(true);
      try {
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

  return (
    <div className={`min-h-screen relative flex flex-col justify-between overflow-x-hidden ${isDarkMode ? 'bg-[#030712] text-white' : 'bg-[#f8fafc] text-[#0f172a]'}`}>
      {/* Full-bleed background turf image */}
      <img
        src="/images/turf-bg.jpg"
        alt="Turf background"
        className="absolute inset-0 w-full h-full object-cover z-0 fixed"
        style={{
          opacity: isDarkMode ? 0.35 : 0.15,
        }}
      />
      {/* Overlay gradient mask */}
      <div 
        className="absolute inset-0 z-0" 
        style={{
          background: isDarkMode 
            ? 'radial-gradient(circle at center, rgba(15, 23, 42, 0.4) 0%, rgba(3, 7, 18, 0.85) 100%)' 
            : 'radial-gradient(circle at center, rgba(255, 255, 255, 0.4) 0%, rgba(248, 250, 252, 0.9) 100%)',
        }}
      />

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Logo />

        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className={`text-xs font-bold transition-colors ${
              isDarkMode ? 'text-slate-400 hover:text-[#10B981]' : 'text-slate-500 hover:text-[#10B981]'
            }`}
          >
            Already registered? <span className="text-[#10B981] hover:underline">Log In</span>
          </button>
          <span className={`hidden md:inline ${isDarkMode ? 'text-slate-800' : 'text-slate-300'}`}>|</span>
          <a 
            href="#" 
            className={`hidden md:inline text-xs font-bold transition-colors ${
              isDarkMode ? 'text-slate-400 hover:text-[#10B981]' : 'text-slate-500 hover:text-[#10B981]'
            }`}
          >
            Need help? <span className="text-[#10B981]">Contact Us</span>
          </a>

          {/* Theme switcher pill */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 p-1 rounded-full border transition-all ${
              isDarkMode 
                ? 'border-slate-800 bg-[#0f172a] text-slate-400' 
                : 'border-slate-200 bg-white text-slate-500 shadow-sm'
            }`}
          >
            <div className={`p-1.5 rounded-full ${!isDarkMode ? 'bg-amber-100 text-amber-600' : ''}`}>
              <Sun className="h-3.5 w-3.5" />
            </div>
            <div className={`p-1.5 rounded-full ${isDarkMode ? 'bg-slate-800 text-slate-200' : ''}`}>
              <Moon className="h-3.5 w-3.5" />
            </div>
          </button>
        </div>
      </header>

      {/* Main content split grid */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 flex-1 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full items-center">
          
          {/* LEFT COLUMN: Features (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-8 text-left">
            <div className="space-y-4">
              <h2 className={`text-4xl lg:text-5xl font-black leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Book Your Turf,<br />
                <span className="text-[#10B981]">Play Your Game!</span>
              </h2>
              <p className={`text-sm leading-relaxed max-w-sm ${isDarkMode ? 'text-slate-350' : 'text-slate-600'}`}>
                Discover and book the best turfs near you. Fast booking, secure payments, and amazing experiences.
              </p>
            </div>

            {/* Features Row Blocks */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#10B981]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Secure Booking</h4>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>100% safe and reliable booking experience.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#10B981]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Real-time Availability</h4>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Live slot updates and instant confirmations.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#10B981]">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Best Prices</h4>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Affordable prices and exciting offers every day.</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sign Up card (8 cols, centered card) */}
          <div className="lg:col-span-8 w-full flex justify-center">
            <div className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl backdrop-blur-md transition-all duration-300 flex flex-col justify-between ${
              isDarkMode 
                ? 'bg-[#0f172a]/30 border-slate-700/30 shadow-black/20' 
                : 'bg-white/40 border-slate-200/50 shadow-slate-200/20'
            }`}>
              <div>
                <h3 className={`text-2xl font-black mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Create Your Account</h3>
                <p className={`text-xs mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Join TurfBook and start booking</p>

                {/* Signup Role Switcher Tabs */}
                <div className="flex border-b border-slate-200/10 dark:border-slate-800/60 mb-6">
                  <button
                    type="button"
                    onClick={() => { setSignupRole('customer'); setError(''); }}
                    className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
                      signupRole === 'customer'
                        ? 'border-[#10B981] text-[#10B981]'
                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                    }`}
                  >
                    Customer Sign Up
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSignupRole('owner'); setError(''); }}
                    className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
                      signupRole === 'owner'
                        ? 'border-[#10B981] text-[#10B981]'
                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                    }`}
                  >
                    Owner Sign Up
                  </button>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Full Name
                    </label>
                    <div className={`flex items-center border rounded-xl px-4 py-3 transition-colors ${
                      isDarkMode 
                        ? 'border-slate-700/30 bg-slate-900/40 focus-within:border-emerald-500/50' 
                        : 'border-slate-200 bg-white/50 focus-within:border-emerald-500/50'
                    }`}>
                      <User className="w-4 h-4 text-slate-400 mr-2.5" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className={`bg-transparent border-none outline-none text-sm w-full focus:ring-0 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                      />
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Mobile Number
                    </label>
                    <div className={`flex items-center border rounded-xl overflow-hidden ${
                      isDarkMode 
                        ? 'border-slate-700/30 bg-slate-900/40' 
                        : 'border-slate-200 bg-white/50'
                    }`}>
                      <div className={`flex items-center gap-1 px-3 border-r ${isDarkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
                        <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>IN +91</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </div>
                      <div className="flex items-center px-3 py-3 w-full">
                        <Phone className="w-4 h-4 text-slate-400 mr-2.5" />
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="Enter mobile number"
                          maxLength={10}
                          className={`bg-transparent border-none outline-none text-sm w-full focus:ring-0 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email Address (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Email Address (Optional)
                    </label>
                    <div className={`flex items-center border rounded-xl px-4 py-3 transition-colors ${
                      isDarkMode 
                        ? 'border-slate-700/30 bg-slate-900/40 focus-within:border-emerald-500/50' 
                        : 'border-slate-200 bg-white/50 focus-within:border-emerald-500/50'
                    }`}>
                      <Mail className="w-4 h-4 text-slate-400 mr-2.5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className={`bg-transparent border-none outline-none text-sm w-full focus:ring-0 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                      />
                    </div>
                  </div>

                  {/* Turf Owner Specific Fields */}
                  {signupRole === 'owner' && (
                    <>
                      {/* Company Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Company / Business Name
                        </label>
                        <div className={`flex items-center border rounded-xl px-4 py-3 transition-colors ${
                          isDarkMode 
                            ? 'border-slate-700/30 bg-slate-900/40 focus-within:border-emerald-500/50' 
                            : 'border-slate-200 bg-white/50 focus-within:border-emerald-500/50'
                        }`}>
                          <User className="w-4 h-4 text-slate-400 mr-2.5" />
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Enter business or company name"
                            className={`bg-transparent border-none outline-none text-sm w-full focus:ring-0 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                          />
                        </div>
                      </div>

                      {/* Business Register Number */}
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Business Register Number
                        </label>
                        <div className={`flex items-center border rounded-xl px-4 py-3 transition-colors ${
                          isDarkMode 
                            ? 'border-slate-700/30 bg-slate-900/40 focus-within:border-emerald-500/50' 
                            : 'border-slate-200 bg-white/50 focus-within:border-emerald-500/50'
                        }`}>
                          <Mail className="w-4 h-4 text-slate-400 mr-2.5" />
                          <input
                            type="text"
                            value={businessRegisterNumber}
                            onChange={(e) => setBusinessRegisterNumber(e.target.value)}
                            placeholder="Enter business registration number"
                            className={`bg-transparent border-none outline-none text-sm w-full focus:ring-0 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                          />
                        </div>
                      </div>

                      {/* Business Address */}
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Business Address
                        </label>
                        <div className={`flex items-center border rounded-xl px-4 py-3 transition-colors ${
                          isDarkMode 
                            ? 'border-slate-700/30 bg-slate-900/40 focus-within:border-emerald-500/50' 
                            : 'border-slate-200 bg-white/50 focus-within:border-emerald-500/50'
                        }`}>
                          <Mail className="w-4 h-4 text-slate-400 mr-2.5" />
                          <input
                            type="text"
                            value={businessAddress}
                            onChange={(e) => setBusinessAddress(e.target.value)}
                            placeholder="Enter registered business address"
                            className={`bg-transparent border-none outline-none text-sm w-full focus:ring-0 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                          />
                        </div>
                      </div>

                      {/* Billing Email */}
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Billing Email (Optional)
                        </label>
                        <div className={`flex items-center border rounded-xl px-4 py-3 transition-colors ${
                          isDarkMode 
                            ? 'border-slate-700/30 bg-slate-900/40 focus-within:border-emerald-500/50' 
                            : 'border-slate-200 bg-white/50 focus-within:border-emerald-500/50'
                        }`}>
                          <Mail className="w-4 h-4 text-slate-400 mr-2.5" />
                          <input
                            type="email"
                            value={billingEmail}
                            onChange={(e) => setBillingEmail(e.target.value)}
                            placeholder="Enter billing email if different"
                            className={`bg-transparent border-none outline-none text-sm w-full focus:ring-0 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Create Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Create Password
                    </label>
                    <div className={`flex items-center border rounded-xl px-4 py-3 transition-colors ${
                      isDarkMode 
                        ? 'border-slate-700/30 bg-slate-900/40 focus-within:border-emerald-500/50' 
                        : 'border-slate-200 bg-white/50 focus-within:border-emerald-500/50'
                    }`}>
                      <Lock className="w-4 h-4 text-slate-400 mr-2.5" />
                      <input
                        type={passwordVisible ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className={`bg-transparent border-none outline-none text-sm w-full focus:ring-0 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        {passwordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Confirm Password
                    </label>
                    <div className={`flex items-center border rounded-xl px-4 py-3 transition-colors ${
                      isDarkMode 
                        ? 'border-slate-700/30 bg-slate-900/40 focus-within:border-emerald-500/50' 
                        : 'border-slate-200 bg-white/50 focus-within:border-emerald-500/50'
                    }`}>
                      <Lock className="w-4 h-4 text-slate-400 mr-2.5" />
                      <input
                        type={confirmPasswordVisible ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className={`bg-transparent border-none outline-none text-sm w-full focus:ring-0 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        {confirmPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Checkbox agreement */}
                  <label className="flex items-start text-xs font-semibold cursor-pointer pt-1 leading-relaxed select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mr-2 rounded text-[#10B981] focus:ring-[#10B981]/20 w-4 h-4 mt-0.5 bg-transparent border-slate-400"
                    />
                    <span className={isDarkMode ? 'text-slate-350' : 'text-slate-655'}>
                      I agree to the <a href="#" className="text-[#10B981] hover:underline">Terms of Service</a> and <a href="#" className="text-[#10B981] hover:underline">Privacy Policy</a>
                    </span>
                  </label>

                  {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 mt-2 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white font-extrabold text-sm transition-all duration-300 flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/20 disabled:opacity-60"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign Up'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Separator */}
                <div className="flex items-center justify-center my-6 gap-3">
                  <div className={`flex-1 h-[1px] ${isDarkMode ? 'bg-slate-800/80' : 'bg-slate-200'}`} />
                  <span className="text-[10px] uppercase font-bold text-slate-400">or sign up with</span>
                  <div className={`flex-1 h-[1px] ${isDarkMode ? 'bg-slate-800/80' : 'bg-slate-200'}`} />
                </div>

                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={() => handleQuickDemoSelect('customer')}
                  className={`w-full py-3 rounded-xl border font-bold text-sm transition-all flex items-center justify-center hover:-translate-y-0.5 ${
                    isDarkMode 
                      ? 'border-slate-700/30 bg-slate-900/30 hover:bg-slate-900/60 text-white' 
                      : 'border-slate-200 bg-white/50 hover:bg-slate-50 text-slate-700 shadow-sm'
                  }`}
                >
                  <GoogleIcon />
                  Continue with Google
                </button>
              </div>

              {/* Already have an account switch on Mobile */}
              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-xs font-bold text-slate-500 hover:text-emerald-500 transition-colors"
                >
                  Already have an account? <span className="text-[#10B981] hover:underline">Log In</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-200/10 mt-8">
        <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          © 2025 TurfBook. All rights reserved.
        </p>

        {/* Quick Demo select collapsed bar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDevDropdownOpen(!devDropdownOpen)}
            className="text-xs font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 animate-pulse"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Dev Quick Login Bypass
            <ChevronDown className={`w-3 h-3 transition-transform ${devDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {devDropdownOpen && (
            <div className={`flex gap-1.5 p-1 rounded-lg border text-xs font-bold ${isDarkMode ? 'border-slate-800 bg-[#0f172a]' : 'border-slate-200 bg-white shadow-sm'}`}>
              <button type="button" onClick={() => handleQuickDemoSelect('customer')} className="px-2 py-1 hover:bg-indigo-500/10 rounded text-indigo-500">Customer</button>
              <button type="button" onClick={() => handleQuickDemoSelect('owner')} className="px-2 py-1 hover:bg-indigo-500/10 rounded text-indigo-500">Turf Owner</button>
              <button type="button" onClick={() => handleQuickDemoSelect('admin')} className="px-2 py-1 hover:bg-indigo-500/10 rounded text-indigo-500">Admin</button>
            </div>
          )}
        </div>

        <div className="flex gap-4 text-xs font-bold text-slate-500">
          <a href="#" className="hover:text-[#10B981] hover:underline transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-[#10B981] hover:underline transition-colors">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}

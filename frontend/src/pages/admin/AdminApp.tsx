import { ShieldCheck, Users, CalendarDays, DollarSign, Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

// Inlined from @turf-booking/ui
function Button({ children, onClick, className = '', variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) {
  return <button onClick={onClick} className={className} {...props}>{children}</button>;
}

// Inlined from @turf-booking/utils
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}


export default function App() {
  const { isDarkMode, toggleTheme } = useThemeStore();

  const stats = [
    { label: 'Active Turfs', value: '12', icon: ShieldCheck, color: 'text-emerald-600' },
    { label: 'Total Customers', value: '1,240', icon: Users, color: 'text-blue-600' },
    { label: 'Bookings Today', value: '42', icon: CalendarDays, color: 'text-purple-600' },
    { label: 'Revenue Today', value: formatCurrency(24500), icon: DollarSign, color: 'text-amber-600' },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col ${
      isDarkMode ? 'bg-slate-900 text-slate-105' : 'bg-slate-50 text-slate-900'
    }`}>
      <header className={`border-b px-6 py-4 flex items-center justify-between transition-colors duration-300 ${
        isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-xl">
            T
          </div>
          <span className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>TurfBook Admin</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Dark / Light Toggle Switch Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all duration-200 ${
              isDarkMode
                ? 'border-slate-800 text-slate-400 hover:text-white bg-slate-900/30'
                : 'border-slate-200 text-slate-550 hover:text-slate-800 bg-slate-100 shadow-sm'
            }`}
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Button variant="ghost" className={isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-650 hover:text-slate-900'}>Profile</Button>
          <Button variant="primary">Logout</Button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className={`text-3xl font-extrabold tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Dashboard Overview</h1>
          <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Real-time stats and management controls for TurfBook system.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`border rounded-xl p-6 shadow-xl flex items-center justify-between transition-colors duration-300 ${
                isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <div>
                  <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'} ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            );
          })}
        </div>

        <div className={`border rounded-xl p-8 text-center max-w-2xl mx-auto shadow-2xl transition-colors duration-300 ${
          isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <h2 className="text-2xl font-bold mb-4">Welcome to TurfBook Admin Platform</h2>
          <p className={`mb-6 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            This module is structured using Feature-Based Architecture under `apps/admin-web`. Start building feature modules in `src/features/` such as users, slots, reports, and system audit logs.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" className={isDarkMode ? 'border-slate-700 text-slate-350 hover:bg-slate-900' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}>Documentation</Button>
            <Button variant="primary">Go to Settings</Button>
          </div>
        </div>
      </main>

      <footer className={`border-t py-6 text-center text-sm transition-colors duration-300 ${
        isDarkMode ? 'border-slate-800 bg-slate-950 text-slate-500' : 'border-slate-200 bg-white text-slate-550 shadow-inner'
      }`}>
        &copy; {new Date().getFullYear()} TurfBook Systems Inc. All rights reserved.
      </footer>
    </div>
  );
}

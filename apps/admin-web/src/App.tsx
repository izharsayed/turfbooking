import { Button } from '@turf-booking/ui';
import { formatCurrency } from '@turf-booking/utils';
import { ShieldCheck, Users, CalendarDays, DollarSign } from 'lucide-react';

export default function App() {
  const stats = [
    { label: 'Active Turfs', value: '12', icon: ShieldCheck, color: 'text-emerald-600' },
    { label: 'Total Customers', value: '1,240', icon: Users, color: 'text-blue-600' },
    { label: 'Bookings Today', value: '42', icon: CalendarDays, color: 'text-purple-600' },
    { label: 'Revenue Today', value: formatCurrency(24500), icon: DollarSign, color: 'text-amber-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-xl">
            T
          </div>
          <span className="text-xl font-bold tracking-tight text-emerald-400">TurfBook Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-slate-300 hover:text-white">Profile</Button>
          <Button variant="primary">Logout</Button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Dashboard Overview</h1>
          <p className="text-slate-400">Real-time stats and management controls for TurfBook system.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`p-3 bg-slate-900 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center max-w-2xl mx-auto shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">Welcome to TurfBook Admin Platform</h2>
          <p className="text-slate-400 mb-6 leading-relaxed">
            This module is structured using Feature-Based Architecture under `apps/admin-web`. Start building feature modules in `src/features/` such as users, slots, reports, and system audit logs.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-900">Documentation</Button>
            <Button variant="primary">Go to Settings</Button>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} TurfBook Systems Inc. All rights reserved.
      </footer>
    </div>
  );
}

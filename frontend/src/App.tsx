import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './routes/ProtectedRoute';

// Lazy load each panel for performance
const CustomerApp = lazy(() => import('./pages/customer/CustomerApp'));
const OwnerApp = lazy(() => import('./pages/owner/OwnerApp'));
const AdminApp = lazy(() => import('./pages/admin/AdminApp'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

function RoleRedirect() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const roleRedirects = {
    customer: '/customer',
    owner: '/owner',
    admin: '/admin',
  };

  return <Navigate to={roleRedirects[user.role] ?? '/login'} replace />;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl animate-pulse">
          T
        </div>
        <p className="text-emerald-400 text-sm font-medium animate-pulse">Loading TurfBook...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root redirect */}
          <Route path="/" element={<RoleRedirect />} />

          {/* Customer Panel */}
          <Route
            path="/customer/*"
            element={
              <ProtectedRoute allowedRole="customer">
                <CustomerApp />
              </ProtectedRoute>
            }
          />

          {/* Owner Panel */}
          <Route
            path="/owner/*"
            element={
              <ProtectedRoute allowedRole="owner">
                <OwnerApp />
              </ProtectedRoute>
            }
          />

          {/* Admin Panel */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminApp />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

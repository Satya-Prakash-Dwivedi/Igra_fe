import { lazy, Suspense, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth Pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

// Dashboard Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Orders = lazy(() => import('./pages/Orders'));
const NewOrderPage = lazy(() => import('./pages/NewOrderPage'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Credits = lazy(() => import('./pages/Credits'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Messages = lazy(() => import('./pages/Messages'));
const Channels = lazy(() => import('./pages/Channels'));
const Profile = lazy(() => import('./pages/Profile'));
const Support = lazy(() => import('./pages/Support'));
const ReportBug = lazy(() => import('./pages/ReportBug'));

// Admin Pages
import AdminRoute from './components/admin/AdminRoute';
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail'));
const AdminTickets = lazy(() => import('./pages/admin/AdminTickets'));
const AdminBugReports = lazy(() => import('./pages/admin/AdminBugReports'));

// A simple Loading Spinner
const LoadingSpinner = () => (
  <div className="min-h-screen bg-bg-dark flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const context = useContext(AuthContext);
  
  if (context?.isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!context?.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Dashboard Routes */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/new" element={<NewOrderPage />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/credits" element={<Credits />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/channels" element={<Channels />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/support" element={<Support />} />
              <Route path="/report-bug" element={<ReportBug />} />
            </Route>

            {/* Admin Portal Routes */}
            <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
              <Route path="/admin/support/tickets" element={<AdminTickets />} />
              <Route path="/admin/support/bugs" element={<AdminBugReports />} />
            </Route>

            {/* Fallback */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;

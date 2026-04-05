import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Dashboard Pages
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import NewOrderPage from './pages/NewOrderPage';
import OrderDetail from './pages/OrderDetail';
import Credits from './pages/Credits';
import Invoices from './pages/Invoices';
import Messages from './pages/Messages';
import Channels from './pages/Channels';
import Profile from './pages/Profile';
import Support from './pages/Support';
import ReportBug from './pages/ReportBug';

// Admin Pages
import AdminRoute from './components/admin/AdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminTickets from './pages/admin/AdminTickets';
import AdminBugReports from './pages/admin/AdminBugReports';

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
      </Router>
    </AuthProvider>
  );
}

export default App;

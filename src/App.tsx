import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Auth Pages
import Login from './pages/Login';

// Dashboard Pages
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import NewOrderPage from './pages/NewOrderPage';
import Credits from './pages/Credits';
import Invoices from './pages/Invoices';
import Messages from './pages/Messages';
import Channels from './pages/Channels';
import Profile from './pages/Profile';
import Support from './pages/Support';
import ReportBug from './pages/ReportBug';

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
          
          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/new" element={<NewOrderPage />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/channels" element={<Channels />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/support" element={<Support />} />
            <Route path="/report-bug" element={<ReportBug />} />
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

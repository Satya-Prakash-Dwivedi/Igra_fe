import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  UserCircle,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(true);

  const stats = [
    { label: 'Active Orders', count: 0, icon: <Clock size={24} />, color: 'text-primary' },
    { label: 'In Revision', count: 0, icon: <AlertCircle size={24} />, color: 'text-yellow-500' },
    { label: 'Completed', count: 0, icon: <CheckCircle2 size={24} />, color: 'text-success' },
  ];

  return (
    <div className="flex-1 p-6 md:p-8 bg-bg-dark min-h-screen">
      {/* Onboarding Banner */}
      {showBanner && (
        <div className="bg-bg-card border border-border rounded-xl p-6 mb-8 relative animate-in slide-in-from-top duration-500">
          <button 
            onClick={() => setShowBanner(false)}
            className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="max-w-2xl">
            <h2 className="text-text-main font-bold text-xl mb-1">Finish your profile setup</h2>
            <p className="text-text-muted text-sm mb-6">
              Finish onboarding in just a minute so we know how to serve your needs best.
            </p>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 border-primary text-primary hover:bg-primary/10"
              onClick={() => navigate('/profile')}
            >
              <UserCircle size={18} />
              My Profile
            </Button>
          </div>
        </div>
      )}

      {/* Welcome Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-text-main font-bold text-2xl md:text-3xl">
            Welcome back, {user?.name || 'Creator'}!
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Here's what's happening with your orders
          </p>
        </div>
        <Button 
          className="flex items-center gap-2 px-6 py-2.5"
          onClick={() => navigate('/orders')}
        >
          <Plus size={20} />
          New order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            className="bg-bg-card border border-border rounded-xl p-6 flex items-center gap-4 hover:border-border/80 transition-all cursor-pointer"
            onClick={() => navigate('/orders')}
          >
            <div className={stat.color}>
              {stat.icon}
            </div>
            <div>
              <p className="text-text-muted text-sm font-medium">{stat.label}</p>
              <h3 className="text-text-main text-3xl font-bold mt-1">{stat.count}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders Section */}
      <div className="bg-bg-card border border-border rounded-xl p-6 min-h-[250px] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-main font-semibold text-lg">Your recent orders</h2>
          <button 
            onClick={() => navigate('/orders')}
            className="text-primary text-sm hover:underline"
          >
            View all orders
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-text-muted text-sm italic">
            Once you've placed an order, it'll appear here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

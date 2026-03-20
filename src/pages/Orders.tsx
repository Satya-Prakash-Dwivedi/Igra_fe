import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, LayoutDashboard } from 'lucide-react';
import Button, { cn } from '../components/Button';

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { label: "Add Content & Pay", color: "text-text-main" },
    { label: "Reviewing Order", color: "text-yellow-500" },
    { label: "Reviewing Order", color: "text-text-muted" },
    { label: "In Progress", color: "text-text-main" },
    { label: "Finalizing", color: "text-text-main" },
    { label: "Finalizing", color: "text-primary" },
  ];

  const progressPercentage = ((activeTab + 1) / tabs.length) * 100;

  return (
    <div className="flex-1 p-6 md:p-8 bg-bg-dark min-h-screen">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-text-main font-bold text-3xl">Your orders</h1>
        <Button 
          className="flex items-center gap-2"
          onClick={() => navigate('/orders/new')}
        >
          <Plus size={20} />
          New order
        </Button>
      </div>

      {/* Status Tab Bar */}
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden mb-8 shadow-sm">
        <div className="flex overflow-x-auto no-scrollbar">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={cn(
                "flex items-center gap-3 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap border-r border-border last:border-r-0",
                activeTab === idx 
                  ? "bg-bg-dark text-text-main border-b-2 border-primary" 
                  : "text-text-muted hover:text-text-main hover:bg-bg-dark"
              )}
            >
              <span className={tab.color}>{tab.label}</span>
            </button>
          ))}
        </div>
        {/* Progress Indicator */}
        <div className="h-1 bg-border w-full relative">
          <div 
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Orders Content Area */}
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden min-h-[400px] flex flex-col items-center justify-center text-center p-20 shadow-sm">
        <div className="w-16 h-16 bg-bg-dark border border-border rounded-full flex items-center justify-center text-text-muted mb-4">
          <LayoutDashboard size={24} />
        </div>
        <p className="text-text-muted text-sm italic">No orders found.</p>
      </div>
    </div>
  );
};

export default Orders;

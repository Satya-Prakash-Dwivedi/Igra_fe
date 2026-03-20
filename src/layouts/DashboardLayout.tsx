import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import { cn } from '../components/Button';

const DashboardLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg-dark">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Sidebar - Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="fixed inset-y-0 left-0 w-64 animate-in slide-in-from-left duration-300">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-0 transition-all duration-300 overflow-x-hidden">
        {/* Helper div to offset the fixed desktop sidebar */}
        <div className={cn(
          "transition-all duration-300",
          localStorage.getItem('sidebar-collapsed') === 'true' ? "md:pl-16" : "md:pl-64"
        )}>
          <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;

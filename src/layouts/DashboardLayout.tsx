import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import { cn } from '../components/Button';

const DashboardLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const handleToggleSidebar = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
  };

  return (
    <div className="flex min-h-screen bg-bg-dark overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={handleToggleSidebar} />
      </div>

      {/* Sidebar - Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="fixed inset-y-0 left-0 w-64 animate-in slide-in-left duration-200 transform-gpu">
            <Sidebar isCollapsed={false} onToggle={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col transition-[padding] duration-200 transform-gpu">
        {/* Helper div to offset the fixed desktop sidebar */}
        <div className={cn(
          "transition-[padding] duration-200",
          isSidebarCollapsed ? "md:pl-[72px]" : "md:pl-64"
        )}>
          <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
          <main className="flex-1 p-6 md:p-8 animate-in fade-in slide-in-up duration-200">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;

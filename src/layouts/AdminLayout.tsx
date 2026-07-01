import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from '../components/admin/AdminSidebar'
import Navbar from '../components/layout/Navbar'
import { cn } from '../components/Button'

const AdminLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-bg-dark overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      {/* Sidebar - Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="fixed inset-y-0 left-0 w-60 animate-in slide-in-left duration-200 transform-gpu z-50">
            <AdminSidebar onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col transition-[padding] duration-200 transform-gpu min-w-0">
        <div className="transition-[padding] duration-200 w-full md:pl-60 flex flex-col h-screen">
          <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
          <div className="flex-1 overflow-y-auto relative">
            <main className="min-h-full h-full">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLayout

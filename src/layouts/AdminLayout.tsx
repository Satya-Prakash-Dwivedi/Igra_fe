import React from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from '../components/admin/AdminSidebar'
import Navbar from '../components/layout/Navbar'

const AdminLayout: React.FC = () => (
  <div className="flex min-h-screen bg-bg-dark">
    <AdminSidebar />
    <main className="flex-1 ml-60 h-screen flex flex-col overflow-hidden relative">
      <Navbar onMenuClick={() => {}} />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </main>
  </div>
)

export default AdminLayout

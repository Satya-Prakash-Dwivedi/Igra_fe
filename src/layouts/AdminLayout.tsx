import React from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from '../components/admin/AdminSidebar'

const AdminLayout: React.FC = () => (
  <div className="flex min-h-screen bg-bg-dark">
    <AdminSidebar />
    <main className="flex-1 ml-60 h-screen flex flex-col overflow-hidden relative">
      <Outlet />
    </main>
  </div>
)

export default AdminLayout

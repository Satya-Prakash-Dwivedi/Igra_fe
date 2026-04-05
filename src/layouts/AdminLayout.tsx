import React from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from '../components/admin/AdminSidebar'

const AdminLayout: React.FC = () => (
  <div className="flex min-h-screen bg-bg-dark">
    <AdminSidebar />
    <main className="flex-1 pl-60 overflow-x-hidden">
      <Outlet />
    </main>
  </div>
)

export default AdminLayout

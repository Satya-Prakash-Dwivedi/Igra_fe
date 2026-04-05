import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, Ticket, Bug, LogOut, Shield } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../Button'
import { createLogger, serializeError } from '../../services/logger'

const logger = createLogger('AdminSidebar')

const navItems = [
  { to: '/admin/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/admin/orders',    icon: <ShoppingBag size={18} />,     label: 'Orders' },
  { to: '/admin/support/tickets', icon: <Ticket size={18} />,   label: 'Support Tickets' },
  { to: '/admin/support/bugs',    icon: <Bug size={18} />,       label: 'Bug Reports' },
]

const AdminSidebar: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      logger.error('admin.logout_failed', { error: serializeError(err) })
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-bg-dark border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-border">
        <img src="/favicon.png" alt="Igra" className="w-7 h-7 object-contain" />
        <div>
          <span className="font-bold text-sm tracking-tight uppercase text-text-main">Igra Studios</span>
          <div className="flex items-center gap-1 mt-0.5">
            <Shield size={10} className="text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Admin Portal</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary pl-[10px]'
                  : 'text-text-muted hover:text-text-main hover:bg-bg-card'
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
            {user?.firstName?.[0] ?? user?.name?.[0] ?? 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-text-main text-xs font-semibold truncate">{user?.name ?? 'Admin'}</p>
            <p className="text-text-muted text-[10px] capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-error hover:bg-error/10 transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  )
}

export default AdminSidebar

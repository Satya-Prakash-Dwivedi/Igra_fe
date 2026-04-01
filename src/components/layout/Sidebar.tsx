import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingBag,
  Coins,
  FileText,
  MessageSquare,
  Radio,
  UserCircle,
  LifeBuoy,
  Bug,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '../Button'
import { useAuth } from '../../hooks/useAuth'
import BugReportModal from '../modals/BugReportModal'
import { createLogger, serializeError } from '../../services/logger'

const logger = createLogger('Sidebar')

interface NavItemProps {
  to?: string
  icon: React.ReactNode
  label: string
  collapsed: boolean
  badge?: boolean
  destructive?: boolean
  onClick?: () => void
}

const NavItem: React.FC<NavItemProps> = ({
  to,
  icon,
  label,
  collapsed,
  badge,
  destructive,
  onClick,
}) => {
  const content = (
    <>
      <div className="relative">
        {icon}
        {badge && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-bg-dark"></span>
        )}
      </div>
      <span
        className={cn(
          'font-medium transition-all duration-300 overflow-hidden whitespace-nowrap',
          collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
        )}
      >
        {label}
      </span>
      {collapsed && (
        <div className="absolute left-14 px-2 py-1 bg-bg-card border border-border text-text-main text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
          {label}
        </div>
      )}
    </>
  )

  const className = ({ isActive }: { isActive?: boolean } = {}) =>
    cn(
      'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 w-full text-left',
      isActive
        ? 'bg-bg-card text-text-main border-l-2 border-primary'
        : 'text-text-muted hover:text-text-main hover:bg-bg-card',
      destructive && 'hover:text-error hover:bg-error/10'
    )

  if (to) {
    return (
      <NavLink to={to} className={className}>
        {content}
      </NavLink>
    )
  }

  return (
    <button onClick={onClick} className={className()}>
      {content}
    </button>
  )
}

const Sidebar: React.FC = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    return saved ? JSON.parse(saved) : false
  })
  const [isBugModalOpen, setIsBugModalOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
  }, [isCollapsed])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      logger.error('auth.logout_navigation_failed', {
        error: serializeError(err),
      })
    }
  }

  const topNavItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/orders', icon: <ShoppingBag size={20} />, label: 'Orders' },
    { to: '/credits', icon: <Coins size={20} />, label: 'Credits' },
    { to: '/invoices', icon: <FileText size={20} />, label: 'Invoices' },
    { to: '/messages', icon: <MessageSquare size={20} />, label: 'Messages', badge: true },
    { to: '/channels', icon: <Radio size={20} />, label: 'Channels' },
  ]

  return (
    <>
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-bg-dark border-r border-border flex flex-col transition-all duration-300 z-40',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-4 border-b border-border relative">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="Igra" className="w-8 h-8 object-contain" />
            {!isCollapsed && (
              <span className="font-bold text-lg tracking-tighter uppercase whitespace-nowrap">
                Igra Studios
              </span>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-bg-card border border-border rounded-full flex items-center justify-center text-text-muted hover:text-text-main transition-colors z-50 shadow-lg"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col p-2 overflow-y-auto overflow-x-hidden">
          <nav className="space-y-1">
            {topNavItems.map((item) => (
              <NavItem key={item.to} {...item} collapsed={isCollapsed} />
            ))}
          </nav>

          <div className="flex-1" />

          <nav className="space-y-1 pt-4 border-t border-border mt-4">
            <NavItem
              to="/profile"
              icon={<UserCircle size={20} />}
              label="My Profile"
              collapsed={isCollapsed}
            />
            <NavItem
              to="/support"
              icon={<LifeBuoy size={20} />}
              label="Support"
              collapsed={isCollapsed}
            />
            <NavItem
              onClick={() => setIsBugModalOpen(true)}
              icon={<Bug size={20} />}
              label="Report a Bug"
              collapsed={isCollapsed}
            />
            <NavItem
              onClick={handleLogout}
              icon={<LogOut size={20} />}
              label="Logout"
              collapsed={isCollapsed}
              destructive
            />
          </nav>
        </div>
      </aside>

      <BugReportModal isOpen={isBugModalOpen} onClose={() => setIsBugModalOpen(false)} />
    </>
  )
}

export default Sidebar

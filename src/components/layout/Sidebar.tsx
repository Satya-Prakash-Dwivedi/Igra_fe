import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingBag,
  Coins,
  FileText,
  MessageSquare,
  Radio,
  UserCircle,
  Bug,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react'
import { cn } from '../Button'
import { useAuth } from '../../hooks/useAuth'
import BugReportModal from '../modals/BugReportModal'
import { createLogger, serializeError } from '../../services/logger'
import LogoutModal from '../modals/LogoutModal'
import NotificationBell from '../NotificationBell'

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
      <div className="relative z-10">
        <div className={cn(
          "w-5 h-5 flex items-center justify-center transition-transform duration-200 transform-gpu",
          "group-hover:scale-110 group-active:scale-95"
        )}>
          {icon}
        </div>
        {badge && (
          <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse"></span>
        )}
      </div>
      <span
        className={cn(
          'font-bold text-[11px] uppercase tracking-wider transition-all duration-200 transform-gpu overflow-hidden whitespace-nowrap z-10',
          collapsed ? 'opacity-0 w-0 -translate-x-2' : 'opacity-100 w-auto'
        )}
      >
        {label}
      </span>
      
      {collapsed && (
              <div className="absolute left-14 px-4 py-2 bg-bg-dark border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-[opacity,transform] duration-200 z-50 whitespace-nowrap shadow-2xl translate-x-2 group-hover:translate-x-0 backdrop-blur-md italic transform-gpu">
            {label}
         </div>
      )}
    </>
  )

  const className = ({ isActive }: { isActive?: boolean } = {}) =>
    cn(
      'group relative flex items-center gap-4 px-4 py-2 rounded-xl cursor-pointer transition-[color,background-color] duration-200 w-full text-left outline-none overflow-hidden mb-1 transform-gpu',
      isActive
        ? 'text-white bg-white/[0.05] shadow-sm'
        : 'text-text-dim hover:text-white hover:bg-white/[0.02]',
      destructive && 'hover:text-red-500 hover:bg-red-500/5'
    )

  const activeGlow = (isActive: boolean) => isActive && !collapsed && (
     <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[2px_0_10px_rgba(244,63,94,0.5)] transition-opacity duration-200" />
  )

  if (to) {
    return (
      <NavLink to={to} className={({ isActive }) => cn(className({ isActive }), "relative")}>
        {({ isActive }) => (
          <>
            {activeGlow(isActive)}
            {content}
          </>
        )}
      </NavLink>
    )
  }

  return (
    <button onClick={onClick} className={cn(className(), "relative")}>
      {content}
    </button>
  )
}

interface SidebarProps {
  isCollapsed: boolean
  onToggle: (collapsed: boolean) => void
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [isBugModalOpen, setIsBugModalOpen] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      navigate('/login')
    } catch (err) {
      logger.error('auth.logout_navigation_failed', {
        error: serializeError(err),
      })
    } finally {
      setIsLoggingOut(false)
      setIsLogoutModalOpen(false)
    }
  }

  const topNavItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/orders', icon: <ShoppingBag size={18} />, label: 'Orders' },
    { to: '/credits', icon: <Coins size={18} />, label: 'Wallet' },
    { to: '/invoices', icon: <FileText size={18} />, label: 'Invoices' },
    { to: '/messages', icon: <MessageSquare size={18} />, label: 'Messages', badge: true },
    { to: '/channels', icon: <Radio size={18} />, label: 'Channels' },
  ]

  return (
    <>
    <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-bg-dark border-r border-white/5 flex flex-col transition-[width] duration-300 z-40 backdrop-blur-md transform-gpu',
          isCollapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 relative">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center p-2 shadow-lg transition-transform duration-200 group-hover:scale-105 transform-gpu">
               <Package size={20} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in slide-in-left duration-200">
                 <span className="font-bold text-xl tracking-tight uppercase text-white leading-none">
                   Igra
                 </span>
                 <span className="text-[8px] font-bold tracking-widest uppercase text-primary mt-0.5">Studios</span>
              </div>
            )}
          </div>

          <button
            onClick={() => onToggle(!isCollapsed)}
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 z-50 shadow-2xl border-4 border-bg-dark transform-gpu"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Notifications */}
        <div className="px-4 mb-6">
           <NotificationBell isCollapsed={isCollapsed} />
        </div>

        {/* Global Search Button Placeholder */}
        <div className="px-4 mb-6">
           <div className={cn(
             "w-full bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-3 transition-colors duration-200",
             isCollapsed ? "justify-center h-10" : "px-4 h-11"
           )}>
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              {!isCollapsed && <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Primary Sector</span>}
           </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col px-4 overflow-y-auto overflow-x-hidden no-scrollbar">
          <div className="space-y-8">
            <div>
              {!isCollapsed && (
                <div className="px-4 mb-4 text-[9px] font-bold uppercase tracking-widest text-text-dim/40 flex items-center gap-2 animate-in fade-in duration-300">
                   Navigation
                </div>
              )}
              <nav className="space-y-1">
                {topNavItems.map((item) => (
                  <NavItem key={item.to} {...item} collapsed={isCollapsed} />
                ))}
              </nav>
            </div>

            <div>
               {!isCollapsed && (
                <div className="px-4 mb-4 text-[9px] font-bold uppercase tracking-widest text-text-dim/40 flex items-center gap-2 animate-in fade-in duration-300">
                   Account Settings
                </div>
              )}
              <nav className="space-y-1">
                <NavItem
                  to="/profile"
                  icon={<UserCircle size={18} />}
                  label="Profile"
                  collapsed={isCollapsed}
                />
                <NavItem
                  onClick={() => setIsBugModalOpen(true)}
                  icon={<Bug size={18} />}
                  label="Report Bug"
                  collapsed={isCollapsed}
                />
              </nav>
            </div>
          </div>

          <div className="flex-1" />

          {/* Bottom Logout */}
          <div className="pt-4 pb-6 border-t border-white/5 mt-auto">
            <NavItem
              onClick={() => setIsLogoutModalOpen(true)}
              icon={<LogOut size={18} />}
              label="Logout"
              collapsed={isCollapsed}
              destructive
            />
          </div>
        </div>
      </aside>

      <BugReportModal isOpen={isBugModalOpen} onClose={() => setIsBugModalOpen(false)} />
      <LogoutModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        isLoading={isLoggingOut}
      />
    </>
  )
}

export default Sidebar

import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, Menu, User, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { createLogger, serializeError } from '../../services/logger'

const logger = createLogger('Navbar')

interface NavbarProps {
  onMenuClick: () => void
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  // Get User Initials
  const getInitials = () => {
    if (!user?.name) return '??'
    const names = user.name.split(' ')
    if (names.length >= 2) return `${names[0][0]}${names[1][0]}`.toUpperCase()
    return names[0].substring(0, 2).toUpperCase()
  }

  // Map route to Title
  const getTitle = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'Dashboard'
    if (path === '/orders' || path.startsWith('/orders/')) return 'Orders'
    if (path === '/credits') return 'Credits'
    if (path === '/invoices') return 'Invoices'
    if (path === '/messages') return 'Messages'
    if (path === '/channels') return 'Channels'
    if (path === '/profile') return 'Profile'
    if (path === '/support') return 'Support'
    if (path === '/report-bug') return 'Report Bug'
    return 'Igra'
  }

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

  return (
    <nav className="h-20 bg-bg-dark/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-30 transition-[box-shadow] duration-200 transform-gpu">
      {/* Background Cinematic Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-full bg-primary opacity-[0.03] blur-[100px] pointer-events-none" />
      
      {/* Left: Title & Mobile Menu */}
      <div className="flex items-center gap-6 relative z-10">
        <button onClick={onMenuClick} className="md:hidden text-text-dim hover:text-white transition-colors duration-200">
          <Menu size={20} />
        </button>
        <div className="flex flex-col">
           <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest leading-tight">Navigation</p>
           <h2 className="text-white font-black text-xl tracking-tight uppercase italic">{getTitle()}</h2>
        </div>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex items-center relative group z-10">
        <Search size={14} className="absolute left-4 text-text-dim group-focus-within:text-primary transition-colors duration-200" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-white/[0.02] border border-white/5 rounded-xl pl-12 pr-6 py-2.5 text-xs font-bold tracking-widest text-white w-80 focus:outline-none focus:border-primary/40 focus:bg-white/[0.04] transition-[border-color,background-color] duration-200 placeholder:text-gray-600 uppercase transform-gpu"
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-6 relative z-10">
        <button className="relative group">
          <div className="p-2.5 text-text-dim group-hover:text-white transition-all duration-200 bg-white/[0.02] border border-white/5 rounded-xl group-hover:bg-white/[0.05] transform-gpu">
            <Bell size={18} />
          </div>
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
        </button>

        <div className="hidden lg:flex flex-col items-end text-right">
           <p className="text-white font-bold text-xs tracking-tight">{user?.name || 'User'}</p>
           <p className="text-[8px] font-bold tracking-widest text-primary uppercase opacity-60">Authorized</p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="w-10 h-10 rounded-xl bg-white text-black border-2 border-bg-dark flex items-center justify-center text-xs font-black hover:scale-105 active:scale-95 transition-transform duration-200 overflow-hidden shadow-lg italic transform-gpu"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              getInitials()
            )}
          </button>

          {showUserDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserDropdown(false)}></div>
              <div className="absolute right-0 mt-4 w-56 bg-bg-dark/95 border border-white/10 rounded-2xl shadow-2xl z-50 py-3 animate-in fade-in zoom-in-98 slide-in-up duration-200 backdrop-blur-md transform-gpu">
                <div className="px-5 py-3 border-b border-white/5 mb-2">
                  <p className="text-xs font-bold text-white truncate tracking-tight uppercase">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-[9px] font-bold text-text-dim truncate tracking-widest uppercase">{user?.email || ''}</p>
                </div>
                
                <div className="px-2 space-y-1">
                  <button
                    onClick={() => {
                      navigate('/profile')
                      setShowUserDropdown(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-text-dim hover:text-white hover:bg-white/[0.03] rounded-lg transition-colors duration-200"
                  >
                    <User size={14} /> Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/5 rounded-lg transition-colors duration-200"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar

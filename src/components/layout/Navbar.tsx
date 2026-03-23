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
    if (path === '/orders') return 'My Orders'
    if (path === '/credits') return 'Credits'
    if (path === '/invoices') return 'Invoices'
    if (path === '/messages') return 'Messages'
    if (path === '/channels') return 'Channels'
    if (path === '/profile') return 'My Profile'
    if (path === '/support') return 'Support'
    if (path === '/report-bug') return 'Report a Bug'
    return 'Igra Studios'
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
    <nav className="h-16 bg-bg-dark border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: Title & Mobile Menu */}
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="md:hidden text-text-muted hover:text-text-main">
          <Menu size={20} />
        </button>
        <h2 className="text-text-main font-semibold text-lg">{getTitle()}</h2>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex items-center relative group">
        <Search
          size={16}
          className="absolute left-3 text-text-muted group-focus-within:text-primary transition-colors"
        />
        <input
          type="text"
          placeholder="Search everything..."
          className="bg-bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-main w-64 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-text-muted hover:text-text-main transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border border-bg-dark"></span>
        </button>

        <div className="w-px h-6 bg-border mx-1"></div>

        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="w-9 h-9 rounded-full bg-bg-card border border-border flex items-center justify-center text-text-main text-sm font-medium hover:border-primary transition-colors overflow-hidden"
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
              <div className="absolute right-0 mt-2 w-52 bg-bg-card border border-border rounded-xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-4 py-2 border-b border-border mb-1">
                  <p className="text-sm font-medium text-text-main truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-text-muted truncate">{user?.email || ''}</p>
                </div>
                <button
                  onClick={() => {
                    navigate('/profile')
                    setShowUserDropdown(false)
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-muted hover:text-text-main hover:bg-bg-dark transition-colors"
                >
                  <User size={16} /> My Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors mt-1"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar

import React, { useState, useEffect, useRef } from 'react'
import { Bell, MessageSquare, Package, Ticket, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { notificationService } from '../services/notificationService'
import type { StudioNotification } from '../services/notificationService'
import socketService from '../services/socketService'
import { cn } from './Button'
import { useAuth } from '../hooks/useAuth'

interface NotificationBellProps {
  isCollapsed?: boolean;
  variant?: 'sidebar' | 'navbar';
}

const NotificationBell: React.FC<NotificationBellProps> = ({ isCollapsed, variant = 'sidebar' }) => {
  const [notifications, setNotifications] = useState<StudioNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications()
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.isRead).length)
    } catch (err) {
      console.error('Failed to fetch notifications', err)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Listen for real-time notifications
    const handleNewNotification = (notification: StudioNotification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 20))
      setUnreadCount(prev => prev + 1)
      
      // Optional: Browser notification
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
        new window.Notification('Igra Studios', {
          body: notification.content,
        })
      }
    }

    const socket = socketService.getSocket()
    if (socket) {
      socket.on('new-notification', handleNewNotification)
    }
    
    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission()
    }

    return () => {
      if (socket) {
        socket.off('new-notification', handleNewNotification)
      }
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async (notification: StudioNotification) => {
    if (!notification.isRead) {
      await notificationService.markAsRead(notification._id)
      setUnreadCount(prev => Math.max(0, prev - 1))
      setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n))
    }
    
    setIsOpen(false)
    
    // Navigate based on type
    if (notification.orderId) {
      const prefix = user?.role === 'user' ? '' : '/admin'
      navigate(`${prefix}/orders/${notification.orderId}`)
    }
  }

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE': return <MessageSquare size={14} className="text-blue-500" />
      case 'ORDER_UPDATE': return <Package size={14} className="text-primary" />
      case 'TICKET_UPDATE': return <Ticket size={14} className="text-amber-500" />
      default: return <Bell size={14} className="text-text-dim" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative flex items-center justify-center rounded-xl transition-all duration-300 transform-gpu active:scale-95 group",
          variant === 'sidebar' 
            ? (isCollapsed ? "w-10 h-10 bg-white/5" : "w-full px-4 py-2.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5")
            : "p-2.5 bg-white/[0.02] border border-white/5 hover:bg-white/[0.05]",
          isOpen && "bg-white/[0.08] border-primary/20"
        )}
      >
        <div className="relative">
          <Bell size={18} className={cn("transition-colors duration-300", isOpen || unreadCount > 0 ? "text-primary" : "text-text-dim group-hover:text-white")} />
          {unreadCount > 0 && (
            <span className={cn(
              "absolute bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/40 border border-bg-dark animate-in zoom-in duration-300",
              variant === 'sidebar' 
                ? "-top-1.5 -right-1.5 min-w-[14px] h-[14px] px-1 text-[8px] font-black"
                : "-top-1 -right-1 w-2.5 h-2.5" // Navbar variant is more subtle but still clear
            )}>
              {variant === 'sidebar' ? (unreadCount > 9 ? '9+' : unreadCount) : null}
            </span>
          )}
        </div>
        {variant === 'sidebar' && !isCollapsed && (
          <span className="ml-4 font-bold text-[11px] uppercase tracking-wider text-text-dim group-hover:text-white flex-1 text-left">Notifications</span>
        )}
      </button>

      {isOpen && (
        <div className={cn(
          "absolute mt-4 w-80 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden",
          variant === 'sidebar' 
            ? (isCollapsed ? "left-14 top-0" : "left-0")
            : "right-0"
        )}>
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <h3 className="text-white font-bold text-[11px] uppercase tracking-[0.1em]">Notifications</h3>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-[9px] font-black uppercase tracking-widest text-text-dim hover:text-primary transition-colors flex items-center gap-1.5 group"
              >
                <Check size={10} className="group-hover:scale-110 transition-transform" /> Mark all read
              </button>
            )}
          </div>
          
          {/* List */}
          <div className="max-h-[320px] overflow-y-auto custom-scrollbar py-1">
            {notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 opacity-30">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                  <Bell size={20} className="text-text-dim" />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-dim">No new alerts</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    "px-5 py-3.5 flex gap-4 cursor-pointer transition-all duration-200 hover:bg-white/[0.03] relative group border-b border-white/[0.02] last:border-0",
                    !n.isRead && "bg-white/[0.01]"
                  )}
                >
                  {!n.isRead && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full" />
                  )}
                  
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-105",
                    n.isRead ? "bg-white/5 opacity-60" : "bg-white/10 shadow-lg shadow-black/20"
                  )}>
                    {getIcon(n.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className={cn(
                      "text-[11px] leading-relaxed mb-1 transition-colors",
                      n.isRead ? "text-text-dim/80" : "text-white font-medium"
                    )}>
                      {n.content}
                    </p>
                    <div className="flex items-center gap-2">
                       <span className="w-1 h-1 rounded-full bg-white/10" />
                       <p className="text-[8px] font-bold text-text-dim/40 uppercase tracking-widest">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {!n.isRead && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
          
          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02] flex items-center justify-center">
             <button 
               onClick={() => {
                 setIsOpen(false);
                 navigate(user?.role === 'admin' ? '/admin/messages' : '/messages');
               }}
               className="text-[9px] font-black uppercase tracking-[0.2em] text-text-dim hover:text-white transition-colors"
             >
               View All Activity
             </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell

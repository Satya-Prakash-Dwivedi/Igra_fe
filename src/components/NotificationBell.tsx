import React, { useState, useEffect, useRef } from 'react'
import { Bell, MessageSquare, Package, Ticket, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { notificationService } from '../services/notificationService'
import type { StudioNotification } from '../services/notificationService'
import socketService from '../services/socketService'
import { cn } from './Button'
import { useAuth } from '../hooks/useAuth'

const NotificationBell: React.FC<{ isCollapsed?: boolean }> = ({ isCollapsed }) => {
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
          isCollapsed ? "w-10 h-10 bg-white/5" : "w-full px-4 py-2.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5",
          isOpen && "bg-white/[0.08] border-primary/20"
        )}
      >
        <div className="relative">
          <Bell size={18} className={cn("transition-colors duration-300", isOpen || unreadCount > 0 ? "text-primary" : "text-text-dim group-hover:text-white")} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-1 bg-primary text-[8px] font-black text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/40 border border-bg-dark animate-in zoom-in duration-300">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        {!isCollapsed && (
          <span className="ml-4 font-bold text-[11px] uppercase tracking-wider text-text-dim group-hover:text-white flex-1 text-left">Notifications</span>
        )}
      </button>

      {isOpen && (
        <div className={cn(
          "absolute mt-4 w-80 bg-bg-card/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl z-[100] animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden",
          isCollapsed ? "left-14 top-0" : "left-0"
        )}>
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h3 className="text-white font-bold text-sm tracking-tight">Alert <span className="text-primary italic">Center</span></h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors flex items-center gap-2"
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto no-scrollbar py-2">
            {notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-4 opacity-20">
                <Bell size={32} />
                <p className="text-[10px] font-bold uppercase tracking-widest">No active alerts</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    "px-6 py-4 flex gap-4 cursor-pointer transition-all duration-200 hover:bg-white/[0.03] relative group",
                    !n.isRead && "bg-primary/[0.02]"
                  )}
                >
                  {!n.isRead && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
                  )}
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs leading-relaxed mb-1", n.isRead ? "text-text-dim" : "text-white font-semibold")}>
                      {n.content}
                    </p>
                    <p className="text-[9px] font-bold text-text-dim/40 uppercase tracking-widest">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01] text-center">
               <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-dim/40">End of recent updates</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell

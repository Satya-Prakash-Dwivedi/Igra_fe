import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Clock, Zap, CheckCircle2, ArrowRight, Loader2, AlertCircle, RefreshCw, BarChart3, Users, ShieldAlert, FileText, MessageSquare, List, Hash, User as UserIcon } from 'lucide-react'
import adminService from '../../services/adminService'
import type { DashboardStats, AdminOrder, Message } from '../../services/adminService'
import { createLogger, serializeError } from '../../services/logger'
import Button, { cn } from '../../components/Button'
import StatusBadge from '../../components/admin/StatusBadge'

import { resolveApiUrl } from '../../utils/urlUtils'

const logger = createLogger('AdminDashboard')

const StatCard: React.FC<{
  label: string
  value: number
  icon: React.ReactNode
  color: string
  onClick?: () => void
  trend?: string
}> = ({ label, value, icon, color, onClick, trend }) => (
  <div
    onClick={onClick}
    className={cn(
      "bg-bg-card/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 flex flex-col gap-6 shadow-2xl transition-all duration-500 group relative overflow-hidden",
      onClick && "cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] hover:scale-[1.02]"
    )}
  >
    <div className="flex justify-between items-start">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500", color)}>
        {icon}
      </div>
      {trend && (
        <span className="text-[10px] font-bold text-success bg-success/10 px-2.5 py-1 rounded-lg uppercase tracking-widest">
          {trend}
        </span>
      )}
    </div>

    <div className="space-y-1">
      <p className="text-text-dim text-xs font-bold uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-white text-4xl font-bold tracking-tighter">{value.toLocaleString()}</p>
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      </div>
    </div>

    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
  </div>
)

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [latestOrders, setLatestOrders] = useState<AdminOrder[]>([])
  const [recentMessages, setRecentMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const [statsData, ordersData, messagesData] = await Promise.all([
        adminService.getDashboard(),
        adminService.listOrders({ limit: 5 }),
        adminService.getRecentMessages(5)
      ])
      setStats(statsData)
      setLatestOrders(ordersData.items)
      setRecentMessages(messagesData)
      setLastRefreshed(new Date())
    } catch (err) {
      logger.error('admin_dashboard.fetch_failed', { error: serializeError(err) })
      setError('Failed to load mission critical metrics.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30_000)
    const onFocus = () => {
      if (document.visibilityState === 'visible') fetchData()
    }
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [fetchData])

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 min-h-screen space-y-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-white font-bold text-4xl tracking-tight">Mission <span className="text-primary italic">control</span></h1>
          <div className="flex items-center gap-4 text-text-dim text-sm font-medium">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Live system monitoring
            </div>
            <span className="opacity-20">•</span>
            <p className="opacity-60">Last sync: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={fetchData}
          className="flex items-center gap-2 px-6 rounded-xl bg-white/5 border-white/5 hover:bg-primary hover:border-primary transition-all duration-500"
          disabled={isLoading}
        >
          <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
          Sync metrics
        </Button>
      </div>

      {isLoading && !stats && (
        <div className="flex flex-col items-center justify-center py-48 gap-6">
          <div className="relative">
            <div className="w-20 h-20 border-2 border-primary/20 rounded-full" />
            <div className="absolute inset-0 w-20 h-20 border-t-2 border-primary rounded-full animate-spin" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-dim/40 animate-pulse">Establishing secure uplink...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="bg-error/10 border border-error/20 rounded-[2.5rem] p-12 flex items-center gap-8 text-error shadow-2xl">
          <ShieldAlert size={48} />
          <div className="space-y-2">
            <p className="font-bold text-2xl tracking-tight">Telemetry failure</p>
            <p className="text-lg opacity-60 font-medium">{error}</p>
          </div>
          <Button variant="primary" onClick={fetchData} className="ml-auto px-8 rounded-2xl">Retry sync</Button>
        </div>
      )}

      {stats && (
        <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard
              label="Total production"
              value={stats.totalOrders}
              icon={<TrendingUp size={28} className="text-primary" />}
              color="bg-primary/10"
              onClick={() => navigate('/admin/orders')}
              trend="+12% weekly"
            />
            <StatCard
              label="Awaiting review"
              value={stats.pendingReview}
              icon={<Clock size={28} className="text-amber-400" />}
              color="bg-amber-500/10"
              onClick={() => navigate('/admin/orders?status=UNDER_REVIEW')}
            />
            <StatCard
              label="In production"
              value={stats.inProgress}
              icon={<Zap size={28} className="text-blue-400" />}
              color="bg-blue-500/10"
              onClick={() => navigate('/admin/orders?status=IN_PROGRESS')}
            />
            <StatCard
              label="Deliveries"
              value={stats.completed}
              icon={<CheckCircle2 size={28} className="text-success" />}
              color="bg-success/10"
              onClick={() => navigate('/admin/orders?status=COMPLETED')}
              trend="Global"
            />
          </div>

          {/* Detailed Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Latest Orders Panel */}
            <div className="bg-bg-card/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <List size={24} />
                  </div>
                  <h2 className="text-white font-bold text-2xl tracking-tight">Latest <span className="text-primary italic">orders</span></h2>
                </div>
                <Button variant="outline" onClick={() => navigate('/admin/orders')} className="rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest border-white/5">View all queue</Button>
              </div>

              <div className="space-y-4">
                {latestOrders.length === 0 ? (
                  <div className="py-12 text-center text-text-dim/40 italic text-sm">No recent orders found</div>
                ) : (
                  latestOrders.map(order => (
                    <div
                      key={order._id}
                      onClick={() => navigate(`/admin/orders/${order._id}`)}
                      className="group flex items-center justify-between p-5 bg-black/40 border border-white/5 rounded-[2rem] hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary font-mono font-black text-xs border border-white/5 group-hover:bg-primary group-hover:text-white transition-all">
                          #{order.orderNumber.slice(-3)}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm tracking-tight">{order.title || 'Untitled Project'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">{order.userId?.name || 'Unknown Client'}</p>
                            <span className="w-1 h-1 rounded-full bg-white/10" />
                            <p className="text-[10px] font-bold text-primary italic uppercase tracking-widest">{order.totalCreditsQuoted} Cr</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <StatusBadge status={order.status} className="scale-75 origin-right" />
                        <ArrowRight size={16} className="text-text-dim/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Messages Panel */}
            <div className="bg-bg-card/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
                    <MessageSquare size={24} />
                  </div>
                  <h2 className="text-white font-bold text-2xl tracking-tight">Recent <span className="text-blue-500 italic">messages</span></h2>
                </div>
              </div>

              <div className="space-y-4">
                {recentMessages.length === 0 ? (
                  <div className="py-12 text-center text-text-dim/40 italic text-sm">No recent messages found</div>
                ) : (
                  recentMessages.map(msg => (
                    <div
                      key={msg._id}
                      onClick={() => navigate(`/admin/orders/${typeof msg.orderId === 'object' ? msg.orderId?._id : msg.orderId}`)}
                      className="group flex items-start gap-5 p-5 bg-black/40 border border-white/5 rounded-[2rem] hover:border-blue-500/40 hover:bg-blue-500/[0.02] transition-all duration-300 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-white/5 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/5">
                        {msg.senderId?.avatar ? (
                          <img src={resolveApiUrl(msg.senderId.avatar)} alt={msg.senderId.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon size={18} className="text-text-dim/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white font-bold text-sm tracking-tight">{msg.senderId?.name || 'Unknown'}</p>
                          <p className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <p className="text-text-dim text-xs font-medium line-clamp-1 mb-2 opacity-80">{msg.content}</p>
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Order #{(msg.orderId as any)?.orderNumber?.slice(-3) || '???'}</p>
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={14} className="mt-1 text-text-dim/10 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard

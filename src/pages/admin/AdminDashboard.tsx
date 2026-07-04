import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  Clock,
  Zap,
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Users,
  ShieldAlert,
  FileText,
  MessageSquare,
  List,
  Hash,
  User as UserIcon,
  LayoutDashboard,
  Star,
} from 'lucide-react'
import adminService from '../../services/adminService'
import type { DashboardStats, AdminOrder, Message } from '../../services/adminService'
import { createLogger, serializeError } from '../../services/logger'
import Button, { cn } from '../../components/Button'
import StatusBadge from '../../components/admin/StatusBadge'
import GradientAreaChart from '../../components/admin/charts/GradientAreaChart'
import StatusDonutChart from '../../components/admin/charts/StatusDonutChart'

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
      'bg-bg-card border border-white/10 rounded-xl p-6 flex flex-col gap-4 shadow-sm transition-colors',
      onClick && 'cursor-pointer hover:border-primary/50 hover:bg-white/[0.02]'
    )}
  >
    <div className="flex justify-between items-start">
      <div
        className={cn('w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0', color)}
      >
        {icon}
      </div>
      {trend && (
        <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded uppercase tracking-wider">
          {trend}
        </span>
      )}
    </div>

    <div className="space-y-1">
      <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-white text-3xl font-bold">{value.toLocaleString()}</p>
      </div>
    </div>
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
        adminService.listOrders({ limit: 7 }),
        adminService.getRecentMessages(5),
      ])
      setStats(statsData)
      setLatestOrders(ordersData.items)
      setRecentMessages(messagesData)
      setLastRefreshed(new Date())
    } catch (err) {
      logger.error('admin_dashboard.fetch_failed', { error: serializeError(err) })
      setError('Failed to load dashboard metrics.')
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
    <div className="max-w-7xl mx-auto p-6 md:p-10 min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Admin Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-text-muted text-sm font-medium">
            <p>Live system monitoring</p>
            <span>•</span>
            <p>
              Last sync:{' '}
              {lastRefreshed.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-bg-card border-white/10"
          disabled={isLoading}
        >
          <RefreshCw size={16} className={cn(isLoading && 'animate-spin')} />
          Sync metrics
        </Button>
      </div>

      {isLoading && !stats && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 size={32} className="text-primary animate-spin" />
          <p className="text-sm font-medium text-text-muted">Loading dashboard...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="bg-error/5 border border-error/20 rounded-xl p-6 flex items-center gap-4 text-error shadow-sm">
          <ShieldAlert size={32} />
          <div className="flex-1 space-y-1">
            <p className="font-semibold text-lg">Failed to load metrics</p>
            <p className="text-sm text-error/80">{error}</p>
          </div>
          <Button
            variant="outline"
            onClick={fetchData}
            className="px-4 border-error/20 text-error hover:bg-error/10"
          >
            Retry
          </Button>
        </div>
      )}

      {stats && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard
              label="Total Orders"
              value={stats.totalOrders}
              icon={<TrendingUp size={24} className="text-primary" />}
              color="bg-primary/10"
              onClick={() => navigate('/admin/orders')}
              trend="+12% weekly"
            />
            <StatCard
              label="Awaiting Review"
              value={stats.pendingReview}
              icon={<Clock size={24} className="text-amber-500" />}
              color="bg-amber-500/10"
              onClick={() => navigate('/admin/orders?status=UNDER_REVIEW')}
            />
            <StatCard
              label="In Progress"
              value={stats.inProgress}
              icon={<Zap size={24} className="text-blue-500" />}
              color="bg-blue-500/10"
              onClick={() => navigate('/admin/orders?status=IN_PROGRESS')}
            />
            <StatCard
              label="Completed"
              value={stats.completed}
              icon={<CheckCircle2 size={24} className="text-emerald-500" />}
              color="bg-emerald-500/10"
              onClick={() => navigate('/admin/orders?status=COMPLETED')}
              trend="Global"
            />
            <StatCard
              label="Avg. Rating"
              value={stats.averageRating ? parseFloat(stats.averageRating.toFixed(1)) : 0}
              icon={<Star size={24} className="text-amber-500 fill-amber-500" />}
              color="bg-amber-500/10"
            />
          </div>


          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-bg-card border border-white/10 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                  <TrendingUp size={18} />
                </div>
                <h2 className="text-white font-bold text-lg tracking-tight">Revenue (30 Days)</h2>
              </div>
              <GradientAreaChart data={stats.revenueTimeline || []} />
            </div>

            <div className="bg-bg-card border border-white/10 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <BarChart3 size={18} />
                </div>
                <h2 className="text-white font-bold text-lg tracking-tight">Order Status</h2>
              </div>
              <StatusDonutChart data={stats} />
            </div>
          </div>

          {/* Detailed Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Latest Orders Panel */}
            <div className="bg-bg-card border border-white/10 rounded-xl p-6 shadow-sm space-y-4 flex flex-col h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <List size={18} />
                  </div>
                  <h2 className="text-white font-bold text-lg tracking-tight">Recent Orders</h2>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/admin/orders')}
                  className="text-sm px-3 py-1.5 text-primary hover:bg-primary/10"
                >
                  View all
                </Button>
              </div>

              <div className="flex-1 space-y-3">
                {latestOrders.length === 0 ? (
                  <div className="py-8 text-center text-text-muted text-sm flex items-center justify-center h-full">
                    No recent orders
                  </div>
                ) : (
                  latestOrders.map((order) => (
                    <div
                      key={order._id}
                      onClick={() => navigate(`/admin/orders/${order._id}`)}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg hover:border-white/20 transition-colors cursor-pointer gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center text-primary font-semibold text-xs border border-white/5 flex-shrink-0">
                          #{order.orderNumber.slice(-3)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-semibold text-sm truncate">
                            {order.title || 'Untitled Project'}
                          </p>
                          <div className="flex items-center gap-2 mt-1 truncate">
                            <p className="text-xs text-text-muted">
                              {order.userId?.name || 'Unknown Client'}
                            </p>
                            <span className="text-text-muted text-[10px]">•</span>
                            <p className="text-xs font-semibold text-white">
                              {order.totalCreditsQuoted} Cr
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 self-start sm:self-center">
                        <StatusBadge status={order.status} />
                        <ArrowRight
                          size={16}
                          className="text-text-muted hidden sm:block group-hover:text-white transition-colors"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Messages Panel */}
            <div className="bg-bg-card border border-white/10 rounded-xl p-6 shadow-sm space-y-4 flex flex-col h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <MessageSquare size={18} />
                  </div>
                  <h2 className="text-white font-bold text-lg tracking-tight">Recent Messages</h2>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                {recentMessages.length === 0 ? (
                  <div className="py-8 text-center text-text-muted text-sm flex items-center justify-center h-full">
                    No recent messages
                  </div>
                ) : (
                  recentMessages.map((msg) => (
                    <div
                      key={msg._id}
                      onClick={() =>
                        navigate(
                          `/admin/orders/${typeof msg.orderId === 'object' ? msg.orderId?._id : msg.orderId}`
                        )
                      }
                      className="group flex items-start gap-4 p-4 bg-white/5 border border-white/5 rounded-lg hover:border-white/20 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-black/20 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/5">
                        {msg.senderId?.avatar ? (
                          <img
                            src={resolveApiUrl(msg.senderId.avatar)}
                            alt={msg.senderId.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserIcon size={18} className="text-text-muted" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white font-semibold text-sm truncate pr-2">
                            {msg.senderId?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-text-muted whitespace-nowrap">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <p className="text-text-muted text-sm line-clamp-1 mb-2">{msg.content}</p>
                        <div className="inline-flex">
                          <div className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded text-[10px] font-semibold uppercase tracking-wider">
                            Order #{(msg.orderId as any)?.orderNumber?.slice(-3) || '???'}
                          </div>
                        </div>
                      </div>
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

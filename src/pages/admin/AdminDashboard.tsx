import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Clock, Zap, CheckCircle2, ArrowRight, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import adminService from '../../services/adminService'
import type { DashboardStats } from '../../services/adminService'
import { createLogger, serializeError } from '../../services/logger'

const logger = createLogger('AdminDashboard')

const StatCard: React.FC<{
  label: string
  value: number
  icon: React.ReactNode
  color: string
  onClick?: () => void
}> = ({ label, value, icon, color, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-bg-card border border-border rounded-xl p-6 flex items-start gap-4 ${onClick ? 'cursor-pointer hover:border-primary/50 transition-all duration-200 hover:scale-[1.01]' : ''}`}
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-text-muted text-sm">{label}</p>
      <p className="text-text-main text-3xl font-bold mt-1">{value.toLocaleString()}</p>
    </div>
  </div>
)

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  const fetchStats = useCallback(async () => {
    try {
      setError(null)
      const data = await adminService.getDashboard()
      setStats(data)
      setLastRefreshed(new Date())
    } catch (err) {
      logger.error('admin_dashboard.fetch_failed', { error: serializeError(err) })
      setError('Failed to load dashboard stats.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30_000)
    // Re-fetch on tab focus
    const onFocus = () => fetchStats()
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [fetchStats])

  return (
    <div className="p-6 md:p-8 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-text-main font-bold text-2xl md:text-3xl">Dashboard</h1>
          <p className="text-text-muted text-sm mt-1">
            Last refreshed: {lastRefreshed.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 text-text-muted hover:text-primary text-sm transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Stats Grid */}
      {!isLoading && stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Orders"
              value={stats.totalOrders}
              icon={<TrendingUp size={22} className="text-primary" />}
              color="bg-primary/10"
              onClick={() => navigate('/admin/orders')}
            />
            <StatCard
              label="Pending Review"
              value={stats.pendingReview}
              icon={<Clock size={22} className="text-amber-400" />}
              color="bg-amber-500/10"
              onClick={() => navigate('/admin/orders?status=UNDER_REVIEW')}
            />
            <StatCard
              label="In Progress"
              value={stats.inProgress}
              icon={<Zap size={22} className="text-blue-400" />}
              color="bg-blue-500/10"
              onClick={() => navigate('/admin/orders?status=IN_PROGRESS')}
            />
            <StatCard
              label="Completed"
              value={stats.completed}
              icon={<CheckCircle2 size={22} className="text-success" />}
              color="bg-success/10"
              onClick={() => navigate('/admin/orders?status=COMPLETED')}
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-bg-card border border-border rounded-xl p-6">
            <h2 className="text-text-main font-semibold mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/admin/orders?status=UNDER_REVIEW')}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-500/20 transition-colors"
              >
                View Pending Orders
                <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2 py-0.5 rounded-full">
                  {stats.pendingReview}
                </span>
                <ArrowRight size={14} />
              </button>
              <button
                onClick={() => navigate('/admin/support/tickets?status=open')}
                className="flex items-center gap-2 px-4 py-2.5 bg-bg-dark border border-border text-text-muted rounded-lg text-sm font-medium hover:text-text-main hover:border-primary/50 transition-colors"
              >
                Open Tickets
                <ArrowRight size={14} />
              </button>
              <button
                onClick={() => navigate('/admin/support/bugs?status=open')}
                className="flex items-center gap-2 px-4 py-2.5 bg-bg-dark border border-border text-text-muted rounded-lg text-sm font-medium hover:text-text-main hover:border-primary/50 transition-colors"
              >
                Open Bug Reports
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminDashboard

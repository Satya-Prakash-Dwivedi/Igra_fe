import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Clock, Zap, CheckCircle2, ArrowRight, Loader2, AlertCircle, RefreshCw, BarChart3, Users, ShieldAlert, FileText } from 'lucide-react'
import adminService from '../../services/adminService'
import type { DashboardStats } from '../../services/adminService'
import { createLogger, serializeError } from '../../services/logger'
import Button, { cn } from '../../components/Button'

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
    
    {/* Decorative Gradient */}
    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
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
      setError('Failed to load mission critical metrics.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30_000)
    const onFocus = () => fetchStats()
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [fetchStats])

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
          onClick={fetchStats}
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
          <Button variant="primary" onClick={fetchStats} className="ml-auto px-8 rounded-2xl">Retry sync</Button>
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
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
             {/* Quick Actions Panel */}
             <div className="xl:col-span-2 bg-bg-card/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 shadow-2xl space-y-8">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                         <BarChart3 size={24} />
                      </div>
                      <h2 className="text-white font-bold text-2xl tracking-tight">Operational triggers</h2>
                   </div>
                   <Button variant="outline" className="px-6 rounded-xl text-xs uppercase tracking-widest border-white/5">Auto-tasking ON</Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate('/admin/orders?status=UNDER_REVIEW')}
                    className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-2xl hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                          <FileText size={18} />
                       </div>
                       <span className="text-white font-bold">Pending orders</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="bg-amber-500 text-black text-[10px] font-black px-2.5 py-1 rounded-full">{stats.pendingReview}</span>
                       <ArrowRight size={16} className="text-text-dim/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/admin/tickets')}
                    className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-2xl hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <ShieldAlert size={18} />
                       </div>
                       <span className="text-white font-bold">Support tickets</span>
                    </div>
                    <ArrowRight size={16} className="text-text-dim/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </button>
                  
                  <button
                    onClick={() => navigate('/admin/users')}
                    className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-2xl hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                          <Users size={18} />
                       </div>
                       <span className="text-white font-bold">User management</span>
                    </div>
                    <ArrowRight size={16} className="text-text-dim/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </button>
                  
                  <button
                    onClick={() => navigate('/admin/bug-reports')}
                    className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-2xl hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center text-error">
                          <ShieldAlert size={18} />
                       </div>
                       <span className="text-white font-bold">Bug reports</span>
                    </div>
                    <ArrowRight size={16} className="text-text-dim/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
             </div>
             
             {/* Secondary Metric Panel */}
             <div className="bg-primary rounded-[3rem] p-10 shadow-[0_40px_100px_rgba(225,29,72,0.3)] relative overflow-hidden group">
                <div className="relative z-10 h-full flex flex-col justify-between">
                   <div className="space-y-2">
                      <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em]">Core efficiency</p>
                      <h3 className="text-white font-bold text-3xl tracking-tight italic">98.4<span className="not-italic text-lg ml-1">%</span></h3>
                   </div>
                   
                   <div className="space-y-4">
                      <p className="text-white/80 text-sm font-medium leading-relaxed">System is performing within optimal parameters. No critical bottlenecks detected.</p>
                      <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white hover:text-primary rounded-2xl py-4 transition-all duration-500">
                         Generate report
                      </Button>
                   </div>
                </div>
                
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000" />
                <Zap className="absolute -bottom-10 -right-10 text-white/10 w-48 h-48 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard

import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { 
  Plus, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Package, 
  Zap, 
  CreditCard,
  Activity,
  ChevronRight,
  TrendingUp,
  Layout
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import authService from '../services/authService'
import * as orderApi from '../services/orderService'
import type { Order } from '../services/orderService'
import { createLogger, serializeError } from '../services/logger'
import Button, { cn } from '../components/Button'

const logger = createLogger('Dashboard')

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-text-dim/60 bg-white/5 border-white/5',
  PENDING_INPUT: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  BLOCKED: 'text-error bg-error/10 border-error/20',
  READY: 'text-primary bg-primary/10 border-primary/20',
  UNDER_REVIEW: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  IN_PROGRESS: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  DELIVERED: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  COMPLETED: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
}

const Dashboard: React.FC = () => {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const profileRes = await authService.getProfile()
        const userWithCredits = profileRes.data.user
        updateUser(userWithCredits)
        
        const res = await orderApi.listOrders(undefined, 1, 5)
        setOrders(res.orders)
      } catch (err) {
        logger.error('dashboard.load_orders_failed', {
          error: serializeError(err),
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const stats = [
    {
      label: 'Deployed units',
      count: orders.filter((o) => ['PENDING_INPUT', 'READY', 'UNDER_REVIEW', 'IN_PROGRESS'].includes(o.status)).length,
      icon: <Clock size={20} />,
      color: 'text-primary',
      description: 'Active production stream'
    },
    {
      label: 'Stalled operations',
      count: orders.filter((o) => o.status === 'BLOCKED').length,
      icon: <AlertCircle size={20} />,
      color: 'text-amber-500',
      description: 'Require immediate intervention'
    },
    {
      label: 'Archived missions',
      count: orders.filter((o) => ['COMPLETED', 'APPROVED', 'DELIVERED'].includes(o.status)).length,
      icon: <CheckCircle2 size={20} />,
      color: 'text-emerald-500',
      description: 'Successfully finalized'
    },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700 px-6 relative">
      {/* Background Textures */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-10 relative z-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Welcome back, <span className="text-primary">{user?.name?.split(' ')[0] || 'User'}</span>
          </h1>
          <p className="text-text-muted text-lg">Here is what's happening with your projects today.</p>
        </div>
        
        <Button 
          variant="primary" 
          className="h-14 px-10 rounded-2xl font-bold text-sm shadow-2xl shadow-primary/20 group"
          onClick={() => navigate('/orders/new')}
        >
          <Plus size={20} className="mr-2 group-hover:rotate-90 transition-transform duration-500" />
          Create Order
        </Button>
      </div>

      {/* Stats Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-bg-card/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl group hover:border-primary/20 transition-all duration-300 cursor-pointer shadow-xl relative overflow-hidden"
            onClick={() => navigate('/orders')}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:bg-primary/10 transition-all duration-300" />
            <div className={cn("mb-6 w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-primary group-hover:text-white transition-all duration-300", stat.color)}>
              {stat.icon}
            </div>
            <div className="space-y-1">
               <p className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">{stat.label}</p>
               <h3 className="text-3xl font-bold text-white tracking-tight">{stat.count}</h3>
               <p className="text-[10px] font-medium text-text-dim/20 uppercase tracking-wider mt-1">{stat.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Recent Orders */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-3">
                <Layout size={18} className="text-primary/40" />
                <h2 className="text-xl font-bold text-white">Recent Orders</h2>
             </div>
             <Link to="/orders" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest flex items-center gap-2 group">
                View All <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
             </Link>
          </div>
          
          <div className="bg-bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-2 space-y-2 shadow-xl relative overflow-hidden group/stream">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent opacity-50 pointer-events-none" />
            
            {loading ? (
                <div className="py-40 flex flex-col items-center justify-center gap-8 opacity-20">
                  <div className="w-12 h-12 border-2 border-primary/10 border-t-primary rounded-full animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] italic">Synchronizing satellite data...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center gap-6 opacity-30 text-center">
                   <Package size={48} className="text-text-dim/20" />
                   <p className="text-base font-bold">No active orders found.</p>
                </div>
            ) : (
                orders.map((order, i) => (
                  <div
                    key={order._id}
                    onClick={() => navigate(`/orders/${order._id}`)}
                    className="p-4 rounded-xl hover:bg-white/[0.03] transition-all duration-300 group/order cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6 border border-transparent hover:border-white/5"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-text-muted/40 group-hover/order:bg-primary group-hover/order:text-white transition-all duration-300">
                          <Package size={24} />
                       </div>
                       <div className="space-y-1">
                          <h3 className="text-lg font-bold text-white group-hover/order:text-primary transition-colors">
                             {order.title || `Order #${order.orderNumber.slice(-6)}`}
                          </h3>
                          <div className="flex items-center gap-3 text-text-muted text-xs font-bold uppercase tracking-wider">
                             <span>{order.orderNumber}</span>
                             <div className="w-1 h-1 rounded-full bg-white/20" />
                             <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-6">
                       <div className={cn("px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border transition-all duration-300", STATUS_COLORS[order.status])}>
                          {order.status.replace(/_/g, ' ')}
                       </div>
                       <ArrowRight size={18} className="text-text-muted/40 group-hover/order:text-primary group-hover/order:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
            <div 
              className="bg-bg-card/40 backdrop-blur-xl rounded-2xl p-8 border border-primary/20 flex flex-col justify-between cursor-pointer group/wallet hover:bg-bg-card/60 transition-all duration-300 shadow-xl relative overflow-hidden h-[300px]"
              onClick={() => navigate('/credits')}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[60px] -mr-24 -mt-24 group-hover/wallet:bg-primary/20 transition-all duration-500" />
              
              <div className="relative z-10 space-y-6">
                <div className="w-14 h-14 rounded-xl bg-white text-black flex items-center justify-center shadow-lg">
                   <Zap size={28} fill="currentColor" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Wallet</h3>
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Available Credits</p>
                     <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-bold text-white tracking-tight">{user?.credits?.toLocaleString() || '0'}</p>
                        <span className="text-[10px] font-bold text-text-dim/20 uppercase tracking-widest">Cr</span>
                     </div>
                  </div>
                </div>
              </div>
              
              <div className="relative z-10">
                 <Button 
                   onClick={(e) => {
                     e.stopPropagation();
                     navigate('/credits');
                   }}
                   className="w-full h-10 rounded-xl text-xs font-bold uppercase tracking-widest"
                 >
                   Recharge Now
                 </Button>
              </div>
            </div>

            <div className="bg-bg-card/20 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-xl space-y-6 relative overflow-hidden group/dossier">
              <div className="flex items-center gap-3">
                 <Activity size={18} className="text-primary/40" />
                 <h3 className="text-xs font-bold text-white uppercase tracking-wider">Account Status</h3>
              </div>
              <div className="space-y-4">
                 <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[75%] shadow-[0_0_10px_rgba(225,29,72,0.6)]" />
                 </div>
                 <div className="flex justify-between items-end">
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">Profile Progress</p>
                       <p className="text-lg font-bold text-white">Level 02 <span className="text-[10px] text-text-dim/20 ml-2 uppercase">Operator</span></p>
                    </div>
                    <span className="text-2xl font-bold text-primary animate-pulse">75%</span>
                 </div>
              </div>
              <Link to="/profile" className="w-full flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5 text-[10px] font-bold text-text-dim/40 hover:text-white hover:border-primary/20 uppercase tracking-widest transition-all group/opt">
                 Edit Profile <ChevronRight size={14} className="group-hover/opt:translate-x-1 transition-transform" />
              </Link>
            </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

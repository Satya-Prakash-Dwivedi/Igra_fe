import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Clock, AlertCircle, CheckCircle2, ArrowRight, Package, Zap } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import authService from '../services/authService'
import * as orderApi from '../services/orderService'
import type { Order } from '../services/orderService'
import { createLogger, serializeError } from '../services/logger'
import { cn } from '../components/Button'

const logger = createLogger('Dashboard')

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-gray-400 bg-white/5 border-white/5',
  PENDING_INPUT: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  BLOCKED: 'text-red-400 bg-red-400/10 border-red-400/20',
  READY: 'text-primary bg-primary/10 border-primary/20',
  UNDER_REVIEW: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  IN_PROGRESS: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  DELIVERED: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  COMPLETED: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
}

const Dashboard: React.FC = () => {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Refresh profile to get latest credits from the ledger system
        const profileRes = await authService.getProfile()
        const userWithCredits = profileRes.data.user
        updateUser(userWithCredits)
        
        const res = await orderApi.listOrders(undefined, 1, 10)
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
      label: 'Active Projects',
      count: orders.filter((o) => ['PENDING_INPUT', 'READY', 'UNDER_REVIEW', 'IN_PROGRESS'].includes(o.status)).length,
      icon: <Clock size={18} />,
      color: 'text-primary',
    },
    {
      label: 'Needs Attention',
      count: orders.filter((o) => o.status === 'BLOCKED').length,
      icon: <AlertCircle size={18} />,
      color: 'text-yellow-500',
    },
    {
      label: 'Completed',
      count: orders.filter((o) => ['COMPLETED', 'APPROVED', 'DELIVERED'].includes(o.status)).length,
      icon: <CheckCircle2 size={18} />,
      color: 'text-emerald-500',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-10 animate-in fade-in duration-200">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">
            Welcome back, <span className="text-primary italic">{user?.name?.split(' ')[0] || 'User'}</span>
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            System Status: Healthy
          </p>
        </div>
        
        <button
          onClick={() => navigate('/orders/new')}
          className="group relative px-6 py-4 bg-white text-black rounded-xl flex items-center gap-4 transition-all hover:brightness-90 active:scale-95 shadow-xl shadow-white/5"
        >
          <span className="text-xs font-bold uppercase tracking-widest">New Production</span>
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white group-hover:rotate-90 transition-transform">
             <Plus size={18} />
          </div>
        </button>
      </div>

      {/* Stats QuickView */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="premium-card p-6 rounded-3xl group hover:border-primary/30 transition-all duration-300 cursor-pointer"
            onClick={() => navigate('/orders')}
          >
            <div className={cn("mb-4 w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/5", stat.color)}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-white">{stat.count.toString().padStart(2, '0')}</h3>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
             <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Recent Projects</h2>
             <button onClick={() => navigate('/orders')} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-white transition-colors">View All</button>
          </div>
          
          <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-3 space-y-1">
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-50">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : orders.length === 0 ? (
                <div className="py-20 text-center text-gray-500 italic text-sm">No recent projects found.</div>
            ) : (
                orders.slice(0, 5).map((order) => (
                  <div
                    key={order._id}
                    onClick={() => navigate(`/orders/${order._id}`)}
                    className="p-4 rounded-2xl hover:bg-white/[0.03] transition-all group cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-primary transition-colors">
                          <Package size={20} />
                       </div>
                       <div>
                          <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">{order.title || `Order #${order.orderNumber.slice(-6)}`}</h3>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mt-1">{new Date(order.createdAt).toLocaleDateString()} · {order.orderNumber}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className={cn("px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border", STATUS_COLORS[order.status])}>
                          {order.status.replace(/_/g, ' ')}
                       </div>
                       <ArrowRight size={16} className="text-gray-700 group-hover:text-primary transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
           <div className="premium-card rounded-3xl p-8 bg-gradient-to-br from-primary/10 to-transparent border-primary/20 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center mb-6">
                   <Zap size={20} fill="currentColor" />
                </div>
                <h3 className="text-xl font-black text-white tracking-tight mb-4 uppercase italic">Wallet</h3>
                <div className="space-y-1 mb-6">
                   <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Available Credits</p>
                   <p className="text-3xl font-black text-white">{user?.credits || '0'}</p>
                </div>
              </div>
              <button className="w-full py-3.5 bg-white text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:brightness-90 transition-all">Top Up Balance</button>
           </div>

           <div className="premium-card rounded-3xl p-8 bg-white/[0.01]">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Account Status</h3>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                 <div className="h-full bg-primary w-[75%] shadow-[0_0_15px_rgba(244,63,94,0.3)]" />
              </div>
              <p className="text-xs font-bold text-white uppercase tracking-widest flex justify-between">
                 <span>Active Profile</span>
                 <span className="text-primary">75%</span>
              </p>
              <button onClick={() => navigate('/profile')} className="mt-6 text-[10px] font-bold text-primary uppercase tracking-widest hover:text-white transition-colors">Complete Profile</button>
           </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

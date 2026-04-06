import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as orderApi from '../services/orderService'
import type { Order } from '../services/orderService'
import { Plus, Clock, CheckCircle, XCircle, Eye, ArrowRight, Package, ChevronRight } from 'lucide-react'
import { createLogger, serializeError } from '../services/logger'
import { cn } from '../components/Button'

const logger = createLogger('Orders')

const STATUS_TABS = [
  { key: '', label: 'All Projects', icon: Package },
  { key: 'DRAFT', label: 'Drafts', icon: Clock },
  { key: 'UNDER_REVIEW', label: 'Reviewing', icon: Eye },
  { key: 'IN_PROGRESS', label: 'In Progress', icon: ArrowRight },
  { key: 'COMPLETED', label: 'Completed', icon: CheckCircle },
  { key: 'CANCELLED', label: 'Cancelled', icon: XCircle },
] as const

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-white/5 text-gray-400 border-white/5',
  PENDING_PAYMENT: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  UNDER_REVIEW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  IN_PROGRESS: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  DELIVERED: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function Orders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    loadOrders()
  }, [statusFilter, page])

  async function loadOrders() {
    setLoading(true)
    try {
      const result = await orderApi.listOrders(statusFilter || undefined, page)
      setOrders(result.orders)
      setTotal(result.total)
    } catch (err) {
      logger.error('orders.load_failed', {
        page,
        statusFilter: statusFilter || null,
        error: serializeError(err),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-200 px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">
            Order <span className="text-primary italic">History</span>
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            {total} Active Projects
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

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {STATUS_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setStatusFilter(key)
              setPage(1)
            }}
            className={cn(
              "flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border",
              statusFilter === key
                ? "bg-white text-black border-white shadow-lg"
                : "bg-white/[0.02] text-gray-500 border-white/5 hover:bg-white/[0.05] hover:text-white"
            )}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-50">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Archive...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="border border-dashed border-white/5 rounded-3xl p-20 text-center bg-white/[0.01]">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-inner">
             <Package size={24} className="text-gray-600" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mb-2 uppercase">No Orders Found</h2>
          <p className="text-gray-500 mb-8 max-w-xs mx-auto text-sm">You haven't started any projects yet. Ready to build something great?</p>
          <button
            onClick={() => navigate('/orders/new')}
            className="px-10 py-4 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            Create New Order
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div
              key={order._id}
              onClick={() => navigate(`/orders/${order._id}`)}
              className="premium-card rounded-3xl p-8 group cursor-pointer border border-white/5 hover:border-primary/20 hover:bg-white/[0.03] transition-all duration-200 hover:translate-y-[-4px] relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-8 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 border border-white/5 group-hover:text-primary transition-colors">
                  <Package size={20} />
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                  STATUS_COLORS[order.status] || "bg-white/5 text-gray-400 border-white/5"
                )}>
                  {order.status.replace(/_/g, ' ')}
                </div>
              </div>

              <div className="space-y-2 mb-8 relative z-10">
                <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-primary transition-colors">
                  {order.title || `Order #${order.orderNumber.slice(-6)}`}
                </h3>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  <span className="font-mono text-gray-600">{order.orderNumber}</span>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5 relative z-10 group-hover:border-primary/10">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Units</p>
                  <p className="text-xl font-black text-white">
                    {order.itemCount || 1}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Credits</p>
                  <p className="text-xl font-black text-primary">
                     {order.totalCreditsQuoted}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-200">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-primary">View Details</span>
                 <ArrowRight size={14} className="text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex justify-center items-center gap-6 pt-10">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="w-12 h-12 bg-white/5 text-white rounded-xl flex items-center justify-center hover:bg-white/10 disabled:opacity-20 transition-[background-color,opacity] duration-200 border border-white/5 transform-gpu"
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <div className="text-center min-w-[100px]">
             <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Page</p>
            <span className="text-base font-black text-white italic">
              {page} <span className="text-text-dim/40 mx-2 text-sm">/</span> {Math.max(1, Math.ceil(total / 20))}
            </span>
          </div>
          <button
            disabled={page * 20 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="w-12 h-12 bg-white/5 text-white rounded-xl flex items-center justify-center hover:bg-white/10 disabled:opacity-20 transition-[background-color,opacity] duration-200 border border-white/5 transform-gpu"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  )
}

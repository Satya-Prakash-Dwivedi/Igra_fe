import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import * as orderApi from '../services/orderService'
import type { Order } from '../services/orderService'
import { 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  ArrowRight, 
  Package, 
  ChevronRight,
  Filter,
  Layers,
  Search,
  Calendar,
  CreditCard,
  Activity
} from 'lucide-react'
import { createLogger, serializeError } from '../services/logger'
import { cn } from '../components/Button'
import { toast } from 'sonner'
import Button from '../components/Button'

const logger = createLogger('Orders')

const STATUS_TABS = [
  { key: '', label: 'All units', icon: Layers },
  { key: 'DRAFT', label: 'Drafting', icon: Clock },
  { key: 'UNDER_REVIEW', label: 'Assessing', icon: Eye },
  { key: 'IN_PROGRESS', label: 'In production', icon: Activity },
  { key: 'COMPLETED', label: 'Finalized', icon: CheckCircle },
  { key: 'CANCELLED', label: 'Aborted', icon: XCircle },
] as const

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-white/5 text-text-dim/40 border-white/5',
  PENDING_PAYMENT: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  UNDER_REVIEW: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  IN_PROGRESS: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  DELIVERED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  CANCELLED: 'bg-error/10 text-error border-error/20',
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
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700 px-6 relative">
      {/* Background Textures */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-10 relative z-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Your <span className="text-primary">Orders</span>
          </h1>
          <p className="text-text-dim/60 text-base">
             You have <span className="text-white font-bold">{total}</span> orders in your history.
          </p>
        </div>
        
        <Button
          onClick={() => navigate('/orders/new')}
          className="h-12 px-8 rounded-xl text-base"
        >
          Create Order
          <Plus size={18} className="ml-2" />
        </Button>
      </div>

      {/* Control Matrix */}
      <div className="bg-bg-card/40 backdrop-blur-xl rounded-2xl p-2 border border-white/5 shadow-xl relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-2">
          <div className="flex items-center gap-3 px-6 py-2 text-text-dim/40 border-r border-white/5 hidden md:flex">
             <Filter size={16} />
             <span className="text-xs font-bold uppercase tracking-wider">Status</span>
          </div>
          <div className="flex flex-1 gap-2 overflow-x-auto no-scrollbar w-full p-1">
            {STATUS_TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => {
                  setStatusFilter(key)
                  setPage(1)
                }}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300",
                  statusFilter === key
                    ? "bg-white text-black shadow-lg"
                    : "bg-transparent text-text-dim/40 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon size={14} className={cn("transition-colors", statusFilter === key ? "text-primary" : "text-text-dim/40")} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Stream */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-6 opacity-40 relative z-10">
          <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-bg-card/20 border border-dashed border-white/10 rounded-2xl p-20 text-center backdrop-blur-xl shadow-xl relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-xl">
             <Package size={40} className="text-text-dim/20" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">No orders found</h2>
          <p className="text-text-dim/40 mb-10 max-w-sm mx-auto text-base">You haven't placed any orders yet. Create your first order to get started.</p>
          <Button
            onClick={() => navigate('/orders/new')}
            className="px-8 h-12 rounded-xl text-base"
          >
            Create Order
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {orders.map((order, i) => (
            <div
              key={order._id}
              onClick={() => navigate(`/orders/${order._id}`)}
              className="bg-bg-card/40 backdrop-blur-xl rounded-2xl p-6 group cursor-pointer border border-white/5 hover:border-primary/40 hover:bg-bg-card/60 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden shadow-xl"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[60px] -mr-20 -mt-20 group-hover:bg-primary/10 transition-all duration-300" />
              
              <div className="flex items-start justify-between mb-8 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-text-dim/20 border border-white/5 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-lg">
                  <Package size={24} />
                </div>
                <div className={cn(
                  "px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-md transition-all duration-300",
                  STATUS_COLORS[order.status] || "bg-white/5 text-text-dim/40 border-white/5"
                )}>
                  {order.status.replace(/_/g, ' ')}
                </div>
              </div>

              <div className="space-y-2 mb-8 relative z-10">
                <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-primary transition-colors">
                  {order.title || `Order #${order.orderNumber.slice(-6)}`}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                     <Search size={12} className="text-primary/40" />
                     <span>{order.orderNumber}</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-white/5" />
                  <div className="flex items-center gap-2">
                     <Calendar size={12} className="text-primary/40" />
                     <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5 relative z-10 group-hover:border-primary/20 transition-all duration-300">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-dim/20 uppercase tracking-widest">Items</p>
                  <p className="text-xl font-bold text-white">
                    {order.itemCount || 1} <span className="text-[10px] font-normal text-text-dim/40 ml-1 uppercase">Assets</span>
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold text-text-dim/20 uppercase tracking-widest">Budget</p>
                  <p className="text-xl font-bold text-primary">
                     {order.totalCreditsQuoted.toLocaleString()} <span className="text-[10px] font-normal text-primary/40 ml-1 uppercase">Cr</span>
                  </p>
                </div>
              </div>
              
              {order.status === 'DRAFT' && (
                <Button
                  fullWidth
                  onClick={async (e) => {
                    e.stopPropagation()
                    try {
                      await orderApi.submitOrder(order._id)
                      loadOrders()
                    } catch (err: any) {
                      toast.error(err?.response?.data?.error || err.message)
                    }
                  }}
                  className="mt-6 h-10 rounded-xl bg-white text-black hover:bg-primary hover:text-white border-none shadow-lg transition-all duration-300 text-xs font-bold uppercase tracking-wider"
                >
                  Submit Order
                </Button>
              )}
              
              <div className="mt-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300">
                 <span className="text-[10px] font-bold uppercase tracking-wider text-primary">View Details</span>
                 <ArrowRight size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Matrix */}
      {total > 0 && (
        <div className="flex justify-center items-center gap-6 pt-10 relative z-10">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="w-10 h-10 bg-bg-card/40 text-white rounded-xl flex items-center justify-center hover:bg-primary disabled:opacity-30 transition-all duration-300 border border-white/5"
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>
          
          <div className="text-center min-w-[120px] bg-bg-card/20 px-4 py-2 rounded-xl border border-white/5 backdrop-blur-xl shadow-inner relative">
            <span className="text-lg font-bold text-white tracking-tight">
              {page} <span className="text-text-dim/20 mx-2">/</span> {Math.max(1, Math.ceil(total / 20))}
            </span>
          </div>

          <button
            disabled={page * 20 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="w-10 h-10 bg-bg-card/40 text-white rounded-xl flex items-center justify-center hover:bg-primary disabled:opacity-30 transition-all duration-300 border border-white/5"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  )
}

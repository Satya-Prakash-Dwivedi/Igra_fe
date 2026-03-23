import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as orderApi from '../services/orderService'
import type { Order } from '../services/orderService'
import { Plus, Clock, CheckCircle, XCircle, Eye, ArrowRight, Package } from 'lucide-react'
import { createLogger, serializeError } from '../services/logger'

const logger = createLogger('Orders')

const STATUS_TABS = [
  { key: '', label: 'All Orders', icon: Package },
  { key: 'DRAFT', label: 'Drafts', icon: Clock },
  { key: 'UNDER_REVIEW', label: 'Under Review', icon: Eye },
  { key: 'IN_PROGRESS', label: 'In Progress', icon: ArrowRight },
  { key: 'COMPLETED', label: 'Completed', icon: CheckCircle },
  { key: 'CANCELLED', label: 'Cancelled', icon: XCircle },
] as const

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-500/20 text-gray-300',
  PENDING_PAYMENT: 'bg-yellow-500/20 text-yellow-300',
  UNDER_REVIEW: 'bg-blue-500/20 text-blue-300',
  IN_PROGRESS: 'bg-purple-500/20 text-purple-300',
  FINALIZING: 'bg-indigo-500/20 text-indigo-300',
  AWAITING_APPROVAL: 'bg-amber-500/20 text-amber-300',
  COMPLETED: 'bg-green-500/20 text-green-300',
  CANCELLED: 'bg-red-500/20 text-red-300',
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-gray-400 mt-1">Manage your service requests</p>
        </div>
        <button
          onClick={() => navigate('/orders/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover rounded-lg text-white font-medium transition-colors"
        >
          <Plus size={18} />
          New Order
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {STATUS_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setStatusFilter(key)
              setPage(1)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === key
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-bg-card text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-bg-card rounded-xl border border-border-subtle p-12 text-center">
            <Package size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-white font-medium mb-2">No orders found</h3>
            <p className="text-gray-400 mb-6">
              {statusFilter ? 'No orders with this status.' : "You haven't placed any orders yet."}
            </p>
            <button
              onClick={() => navigate('/orders/new')}
              className="px-4 py-2 bg-primary rounded-lg text-white font-medium"
            >
              Create Your First Order
            </button>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              onClick={() => navigate(`/orders/${order._id}`)}
              className="bg-bg-card rounded-xl border border-border-subtle p-5 hover:border-primary/30 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Package size={18} className="text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">
                        {order.title || order.orderNumber}
                      </span>
                      <span className="text-gray-500 text-sm">{order.orderNumber}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-gray-400 text-sm">
                        {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                      </span>
                      <span className="text-gray-600">·</span>
                      <span className="text-gray-400 text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-white font-medium">{order.totalCreditsQuoted} credits</div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-500/20 text-gray-300'}`}
                  >
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  <ArrowRight
                    size={16}
                    className="text-gray-600 group-hover:text-primary transition-colors"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 bg-bg-card text-gray-400 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-400">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            disabled={page * 20 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-bg-card text-gray-400 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Clock, AlertCircle, CheckCircle2, UserCircle, X, ArrowRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/Button'
import * as orderApi from '../services/orderService'
import type { Order } from '../services/orderService'
import { createLogger, serializeError } from '../services/logger'

const logger = createLogger('Dashboard')

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-gray-400 bg-gray-500/10',
  PENDING_INPUT: 'text-yellow-400 bg-yellow-500/10',
  BLOCKED: 'text-orange-400 bg-orange-500/10',
  READY: 'text-blue-400 bg-blue-500/10',
  UNDER_REVIEW: 'text-blue-400 bg-blue-500/10',
  IN_PROGRESS: 'text-purple-400 bg-purple-500/10',
  DELIVERED: 'text-cyan-400 bg-cyan-500/10',
  APPROVED: 'text-green-400 bg-green-500/10',
  COMPLETED: 'text-green-400 bg-green-500/10',
  FAILED: 'text-red-400 bg-red-500/10',
  CANCELLED: 'text-red-400 bg-red-500/10',
}

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showBanner, setShowBanner] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
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

  const activeCount = orders.filter((o) =>
    ['PENDING_INPUT', 'READY', 'UNDER_REVIEW', 'IN_PROGRESS'].includes(o.status)
  ).length
  const revisionCount = orders.filter((o) => o.status === 'BLOCKED').length // Or logic for revision
  const completedCount = orders.filter((o) =>
    ['COMPLETED', 'APPROVED', 'DELIVERED'].includes(o.status)
  ).length

  const stats = [
    {
      label: 'Active Orders',
      count: activeCount,
      icon: <Clock size={24} />,
      color: 'text-primary',
    },
    {
      label: 'In Revision',
      count: revisionCount,
      icon: <AlertCircle size={24} />,
      color: 'text-yellow-500',
    },
    {
      label: 'Completed',
      count: completedCount,
      icon: <CheckCircle2 size={24} />,
      color: 'text-success',
    },
  ]

  return (
    <div className="flex-1 p-6 md:p-8 bg-bg-dark min-h-screen">
      {/* Onboarding Banner */}
      {showBanner && (
        <div className="bg-bg-card border border-border rounded-xl p-6 mb-8 relative animate-in slide-in-from-top duration-500">
          <button
            onClick={() => setShowBanner(false)}
            className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors"
          >
            <X size={20} />
          </button>

          <div className="max-w-2xl">
            <h2 className="text-text-main font-bold text-xl mb-1">Finish your profile setup</h2>
            <p className="text-text-muted text-sm mb-6">
              Finish onboarding in just a minute so we know how to serve your needs best.
            </p>
            <Button
              variant="outline"
              className="flex items-center gap-2 border-primary text-primary hover:bg-primary/10"
              onClick={() => navigate('/profile')}
            >
              <UserCircle size={18} />
              My Profile
            </Button>
          </div>
        </div>
      )}

      {/* Welcome Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-text-main font-bold text-2xl md:text-3xl">
            Welcome back, {user?.name || 'Creator'}!
          </h1>
          <p className="text-text-muted text-sm mt-1">Here's what's happening with your orders</p>
        </div>
        <Button className="flex items-center gap-2 px-6 py-2.5" onClick={() => navigate('/orders')}>
          <Plus size={20} />
          New order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-bg-card border border-border rounded-xl p-6 flex items-center gap-4 hover:border-border/80 transition-all cursor-pointer"
            onClick={() => navigate('/orders')}
          >
            <div className={stat.color}>{stat.icon}</div>
            <div>
              <p className="text-text-muted text-sm font-medium">{stat.label}</p>
              <h3 className="text-text-main text-3xl font-bold mt-1">{stat.count}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders Section */}
      <div className="bg-bg-card border border-border rounded-xl p-6 min-h-[250px] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-main font-semibold text-lg">Your recent orders</h2>
          <button
            onClick={() => navigate('/orders')}
            className="text-primary text-sm hover:underline"
          >
            View all orders
          </button>
        </div>
        <div className="flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent flex items-center justify-center rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-text-muted text-sm italic">
                Once you've placed an order, it'll appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order._id}
                  className="py-4 flex items-center justify-between cursor-pointer group hover:bg-bg-dark/50 -mx-6 px-6 transition-colors"
                  onClick={() => navigate(`/orders/${order._id}`)}
                >
                  <div>
                    <h3 className="text-text-main font-medium group-hover:text-primary transition-colors flex items-center gap-2">
                      {order.title || order.orderNumber}
                    </h3>
                    <p className="text-text-muted text-xs mt-1">
                      {new Date(order.createdAt).toLocaleDateString()} · {order.totalCreditsQuoted}{' '}
                      credits
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide ${STATUS_COLORS[order.status] || 'bg-gray-500/10 text-gray-400'}`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <ArrowRight
                      size={16}
                      className="text-text-muted group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

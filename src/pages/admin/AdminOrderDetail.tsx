import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle, User, Clock, RefreshCw, ChevronDown } from 'lucide-react'
import adminService from '../../services/adminService'
import type {
  AdminOrderDetailData, AdminOrderItem, AdminOrderEvent,
  AdminUser, ReviewAction, OrderItemStatus
} from '../../services/adminService'
import { ITEM_TRANSITIONS } from '../../services/adminService'
import StatusBadge from '../../components/admin/StatusBadge'
import Button from '../../components/Button'
import { cn } from '../../components/Button'
import { createLogger, serializeError } from '../../services/logger'

const logger = createLogger('AdminOrderDetail')

// ─── Item Actions Panel ───────────────────────────────────────────────────────

const ItemCard: React.FC<{ item: AdminOrderItem; orderId: string; onUpdated: (updated: AdminOrderItem) => void }> = ({
  item, orderId, onUpdated,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validTransitions = ITEM_TRANSITIONS[item.status] ?? []

  const handleTransition = async (status: OrderItemStatus) => {
    setIsLoading(true)
    setError(null)
    try {
      const updated = await adminService.transitionItemStatus(orderId, item._id, status)
      onUpdated(updated)
    } catch (err) {
      logger.error('admin_item.transition_failed', { error: serializeError(err) })
      setError('Action failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeliver = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const updated = await adminService.deliverItem(orderId, item._id)
      onUpdated(updated)
    } catch (err) {
      logger.error('admin_item.deliver_failed', { error: serializeError(err) })
      setError('Deliver failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefund = async () => {
    if (!confirm('Issue refund for this failed item?')) return
    setIsLoading(true)
    setError(null)
    try {
      await adminService.refundItem(orderId, item._id)
      setError(null)
    } catch (err) {
      logger.error('admin_item.refund_failed', { error: serializeError(err) })
      setError('Refund failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-bg-dark border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-text-main font-semibold capitalize">{item.kind.replace(/_/g, ' ')}</p>
          <p className="text-text-muted text-xs mt-0.5">
            {item.creditsQuoted} credits · Revisions: {item.usedRevisions}/{item.allowedRevisions}
          </p>
        </div>
        <StatusBadge status={item.status} />
      </div>

      {/* Transition Buttons */}
      {(validTransitions.length > 0 || item.status === 'IN_PROGRESS' || item.status === 'FAILED') && (
        <div className="flex flex-wrap gap-2 pt-1">
          {/* Deliver shortcut — shown when IN_PROGRESS */}
          {item.status === 'IN_PROGRESS' && (
            <button
              onClick={handleDeliver}
              disabled={isLoading}
              className="px-3 py-1.5 bg-teal-500/15 border border-teal-500/30 text-teal-400 rounded-lg text-xs font-semibold hover:bg-teal-500/25 transition-colors disabled:opacity-50"
            >
              Deliver
            </button>
          )}
          {/* Refund — shown when FAILED */}
          {item.status === 'FAILED' && (
            <button
              onClick={handleRefund}
              disabled={isLoading}
              className="px-3 py-1.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-lg text-xs font-semibold hover:bg-rose-500/25 transition-colors disabled:opacity-50"
            >
              Refund Client
            </button>
          )}
          {/* Status transition buttons */}
          {validTransitions.map((nextStatus) => (
            <button
              key={nextStatus}
              onClick={() => handleTransition(nextStatus)}
              disabled={isLoading}
              className="px-3 py-1.5 bg-bg-card border border-border text-text-muted rounded-lg text-xs font-semibold hover:text-text-main hover:border-primary/50 transition-colors disabled:opacity-50"
            >
              → {nextStatus.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      )}

      {isLoading && <p className="text-text-muted text-xs flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Processing…</p>}
      {error && <p className="text-error text-xs">{error}</p>}
    </div>
  )
}

// ─── Event Timeline ───────────────────────────────────────────────────────────

const Timeline: React.FC<{ events: AdminOrderEvent[] }> = ({ events }) => (
  <div className="space-y-0">
    {events.map((ev, i) => (
      <div key={i} className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className="w-3 h-3 rounded-full bg-primary mt-1 flex-shrink-0" />
          {i < events.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
        </div>
        <div className="pb-5">
          <p className="text-text-main text-sm font-semibold">{ev.type.replace(/_/g, ' ')}</p>
          <p className="text-text-muted text-xs">{new Date(ev.createdAt).toLocaleString()}</p>
        </div>
      </div>
    ))}
  </div>
)

// ─── Main Page ────────────────────────────────────────────────────────────────

const AdminOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [detail, setDetail] = useState<AdminOrderDetailData | null>(null)
  const [items, setItems] = useState<AdminOrderItem[]>([])
  const [staff, setStaff] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isReviewing, setIsReviewing] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const [detailData, staffData] = await Promise.all([
        adminService.getOrderDetail(id),
        adminService.listStaff(),
      ])
      setDetail(detailData)
      setItems(detailData.items)
      setStaff(staffData)
    } catch (err) {
      logger.error('admin_order_detail.fetch_failed', { error: serializeError(err) })
      setError('Failed to load order details.')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleReview = async (action: ReviewAction) => {
    if (!id) return
    setIsReviewing(true)
    setReviewError(null)
    try {
      const updated = await adminService.reviewOrder(id, action)
      setDetail((prev) => prev ? { ...prev, order: { ...prev.order, status: updated.status } } : prev)
    } catch (err) {
      logger.error('admin_order_detail.review_failed', { error: serializeError(err) })
      setReviewError('Review action failed.')
    } finally {
      setIsReviewing(false)
    }
  }

  const handleAssign = async (staffId: string) => {
    if (!id) return
    setAssignError(null)
    setIsAssigning(true)
    try {
      const updated = await adminService.assignOrder(id, staffId)
      setDetail((prev) => prev ? { ...prev, order: { ...prev.order, assignedTo: updated.assignedTo } } : prev)
    } catch (err) {
      logger.error('admin_order_detail.assign_failed', { error: serializeError(err) })
      setAssignError('Assignment failed.')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleItemUpdated = (updated: AdminOrderItem) => {
    setItems((prev) => prev.map((item) => (item._id === updated._id ? updated : item)))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
          <AlertCircle size={18} /> {error ?? 'Order not found.'}
        </div>
      </div>
    )
  }

  const { order, events } = detail

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/orders')}
          className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Back to Orders
        </button>
        <button onClick={fetchAll} className="flex items-center gap-1.5 text-text-muted hover:text-primary text-xs transition-colors">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Order Header Card */}
      <div className="bg-bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-text-muted text-xs font-mono mb-1">{order.orderNumber}</p>
            <h1 className="text-text-main font-bold text-xl">{order.title}</h1>
            <p className="text-text-muted text-sm mt-1">
              Created {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <StatusBadge status={order.status} className="text-sm px-3 py-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
          {/* Client */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-bg-dark border border-border flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-text-muted" />
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider font-semibold">Client</p>
              <p className="text-text-main text-sm font-medium">{order.userId?.name ?? '—'}</p>
              <p className="text-text-muted text-xs">{order.userId?.email ?? ''}</p>
            </div>
          </div>

          {/* Assign Staff */}
          <div>
            <p className="text-text-muted text-xs uppercase tracking-wider font-semibold mb-2">Assigned To</p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  defaultValue={order.assignedTo?._id ?? ''}
                  onChange={(e) => { if (e.target.value) handleAssign(e.target.value) }}
                  className={cn(
                    'w-full appearance-none bg-bg-dark border rounded-lg px-3 py-2 pr-8 text-sm text-text-main focus:outline-none focus:border-primary transition-colors',
                    assignError ? 'border-error' : 'border-border'
                  )}
                >
                  <option value="">Unassigned</option>
                  {staff.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} ({s.role})</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
              {isAssigning && <Loader2 size={14} className="animate-spin text-text-muted flex-shrink-0" />}
            </div>
            {assignError && <p className="text-error text-xs mt-1">{assignError}</p>}
          </div>
        </div>

        {/* Credits */}
        <div className="flex items-center gap-6 pt-2 border-t border-border text-sm">
          <div>
            <span className="text-text-muted">Quoted: </span>
            <span className="text-text-main font-semibold">{order.totalCreditsQuoted.toLocaleString()} cr</span>
          </div>
          <div>
            <span className="text-text-muted">Captured: </span>
            <span className="text-text-main font-semibold">{order.totalCreditsCaptured.toLocaleString()} cr</span>
          </div>
        </div>
      </div>

      {/* Review Panel — only when UNDER_REVIEW */}
      {order.status === 'UNDER_REVIEW' && (
        <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-6">
          <h2 className="text-amber-400 font-semibold mb-1">Order Review Required</h2>
          <p className="text-text-muted text-sm mb-4">This order is awaiting your review before production begins.</p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleReview('ACCEPT')}
              isLoading={isReviewing}
              className="bg-success/20 border border-success/40 text-success hover:bg-success/30 px-5"
            >
              ✓ Accept
            </Button>
            <Button
              onClick={() => handleReview('REQUEST_INFO')}
              isLoading={isReviewing}
              variant="outline"
              className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 px-5"
            >
              Request Info
            </Button>
            <Button
              onClick={() => handleReview('REJECT')}
              isLoading={isReviewing}
              variant="outline"
              className="border-error/40 text-error hover:bg-error/10 px-5"
            >
              ✗ Reject
            </Button>
          </div>
          {reviewError && <p className="text-error text-xs mt-3">{reviewError}</p>}
        </div>
      )}

      {/* Items */}
      <div className="space-y-4">
        <h2 className="text-text-main font-semibold text-lg">Order Items</h2>
        {items.length === 0 && (
          <p className="text-text-muted text-sm">No items in this order.</p>
        )}
        {items.map((item) => (
          <ItemCard key={item._id} item={item} orderId={id!} onUpdated={handleItemUpdated} />
        ))}
      </div>

      {/* Event Timeline */}
      {events.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-text-main font-semibold text-lg flex items-center gap-2">
            <Clock size={16} className="text-text-muted" /> Audit Timeline
          </h2>
          <div className="bg-bg-card border border-border rounded-xl p-6">
            <Timeline events={events} />
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrderDetail

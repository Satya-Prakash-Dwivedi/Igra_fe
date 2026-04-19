import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import adminService from '../../services/adminService'
import type { AdminOrder, OrderStatus } from '../../services/adminService'
import StatusBadge from '../../components/admin/StatusBadge'
import Pagination from '../../components/admin/Pagination'
import { createLogger, serializeError } from '../../services/logger'
import { useAuth } from '../../hooks/useAuth'

const logger = createLogger('AdminOrders')

const ORDER_STATUSES: OrderStatus[] = [
  'DRAFT', 'PENDING_PAYMENT', 'UNDER_REVIEW', 'IN_PROGRESS',
  'FINALIZING', 'AWAITING_APPROVAL', 'COMPLETED', 'CANCELLED',
]

const STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Draft', PENDING_PAYMENT: 'Pending Payment', UNDER_REVIEW: 'Under Review',
  IN_PROGRESS: 'In Progress', FINALIZING: 'Finalizing', AWAITING_APPROVAL: 'Awaiting Approval',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled',
}

const AdminOrders: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()
  const statusFilter = (searchParams.get('status') as OrderStatus) || ''
  const assignedToFilter = searchParams.get('assignedTo') || ''
  const page = parseInt(searchParams.get('page') ?? '1', 10)

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await adminService.listOrders({ 
        status: statusFilter || undefined, 
        assignedTo: assignedToFilter || undefined,
        page, 
        limit: 20 
      })
      setOrders(result.items)
      setTotal(result.total)
      setPages(result.pages)
    } catch (err) {
      logger.error('admin_orders.fetch_failed', { error: serializeError(err) })
      setError('Failed to load orders.')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, assignedToFilter, page])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const setFilter = (status: string) => {
    const params: Record<string, string> = { page: '1' }
    if (status) params.status = status
    if (assignedToFilter) params.assignedTo = assignedToFilter
    setSearchParams(params)
  }

  const toggleOnlyMine = () => {
    const params: Record<string, string> = { page: '1' }
    if (statusFilter) params.status = statusFilter
    
    if (!assignedToFilter && user?.id) {
      params.assignedTo = user.id
    }
    // if already filtering by me, removing it will set to "All"
    setSearchParams(params)
  }

  const setPage = (p: number) => {
    const params: Record<string, string> = { page: String(p) }
    if (statusFilter) params.status = statusFilter
    if (assignedToFilter) params.assignedTo = assignedToFilter
    setSearchParams(params)
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-text-main font-bold text-2xl">Orders</h1>
        <span className="text-text-muted text-sm">{total} total</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[160px]"
        >
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={!!assignedToFilter && assignedToFilter === user?.id}
            onChange={toggleOnlyMine}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-bg-card"
          />
          <span className="text-sm text-text-muted group-hover:text-text-main transition-colors">
            Show only assigned to me
          </span>
        </label>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      )}

      {!isLoading && error && (
        <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Order #', 'Client', 'Title', 'Status', 'Assigned To', 'Credits', 'Date', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-text-muted text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-text-muted text-sm">
                        No orders found.
                      </td>
                    </tr>
                  )}
                  {orders.map((order) => (
                    <tr
                      key={order._id}
                      onClick={() => navigate(`/admin/orders/${order._id}`)}
                      className="hover:bg-bg-dark cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-primary whitespace-nowrap">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-text-main font-medium">{order.userId?.name ?? '—'}</p>
                        <p className="text-text-muted text-xs">{order.userId?.email ?? ''}</p>
                      </td>
                      <td className="px-4 py-3 text-text-main max-w-[180px] truncate">{order.title}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                        {order.assignedTo?.name ?? <span className="italic opacity-50">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3 text-text-main whitespace-nowrap font-mono text-xs">
                        {order.totalCreditsQuoted.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <ArrowRight size={14} className="text-text-muted group-hover:text-primary transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}

export default AdminOrders

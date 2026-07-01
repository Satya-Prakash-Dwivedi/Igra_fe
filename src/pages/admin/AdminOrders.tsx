import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Loader2,
  AlertCircle,
  Filter,
  Users,
  User as UserIcon,
  Database,
  Package,
  Eye,
} from 'lucide-react'
import adminService from '../../services/adminService'
import type { AdminOrder, OrderStatus, AdminUser } from '../../services/adminService'
import StatusBadge from '../../components/admin/StatusBadge'
import Pagination from '../../components/admin/Pagination'
import { createLogger, serializeError } from '../../services/logger'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../components/Button'

const logger = createLogger('AdminOrders')

const ORDER_STATUSES: OrderStatus[] = [
  'DRAFT',
  'PENDING_PAYMENT',
  'UNDER_REVIEW',
  'IN_PROGRESS',
  'FINALIZING',
  'AWAITING_APPROVAL',
  'COMPLETED',
  'CANCELLED',
]

const STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Draft',
  PENDING_PAYMENT: 'Pending payment',
  UNDER_REVIEW: 'Under review',
  IN_PROGRESS: 'In progress',
  FINALIZING: 'Finalizing',
  AWAITING_APPROVAL: 'Awaiting approval',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const AdminOrders: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [staffList, setStaffList] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        limit: 20,
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

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    adminService
      .listStaff()
      .then(setStaffList)
      .catch((err) => logger.error('failed_to_load_staff', { error: serializeError(err) }))
  }, [])

  const setFilter = (key: 'status' | 'assignedTo', value: string) => {
    const params: Record<string, string> = { page: '1' }
    if (key === 'status') {
      if (value) params.status = value
      if (assignedToFilter) params.assignedTo = assignedToFilter
    } else {
      if (statusFilter) params.status = statusFilter
      if (value) params.assignedTo = value
    }
    setSearchParams(params)
  }

  const setPage = (p: number) => {
    const params: Record<string, string> = { page: String(p) }
    if (statusFilter) params.status = statusFilter
    if (assignedToFilter) params.assignedTo = assignedToFilter
    setSearchParams(params)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6 md:p-10 relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Package size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Order Management</h1>
            </div>
          </div>
          <p className="text-text-muted text-sm font-medium mt-2">
            Managing {total} total orders across the platform.
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-bg-card border border-white/10 p-4 rounded-xl shadow-sm">
        <div className="relative w-full sm:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <select
            value={statusFilter}
            onChange={(e) => setFilter('status', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer"
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="h-6 w-px bg-white/10 hidden sm:block" />

        <div className="relative w-full sm:w-64">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <select
            value={assignedToFilter}
            onChange={(e) => setFilter('assignedTo', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer"
          >
            <option value="">All Assignees</option>
            {staffList.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 size={32} className="text-primary animate-spin" />
          <p className="text-sm font-medium text-text-muted">Loading orders...</p>
        </div>
      ) : error ? (
        <div className="bg-error/5 border border-error/20 text-error px-6 py-4 rounded-lg flex items-center gap-3">
          <AlertCircle size={18} />
          <p className="font-semibold text-sm">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-bg-card border border-white/10 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Assignee
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">
                      Value
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">
                      Received
                    </th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-3 text-text-muted">
                          <Database size={32} className="opacity-50" />
                          <p className="text-sm font-medium">No orders found.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr
                        key={order._id}
                        onClick={() => navigate(`/admin/orders/${order._id}`)}
                        className="hover:bg-white/[0.02] cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-primary block">
                            #{order.orderNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4 min-w-[150px]">
                          <div className="flex flex-col">
                            <p className="text-white font-semibold text-sm truncate max-w-[150px]">
                              {order.userId?.name ?? '—'}
                            </p>
                            <p className="text-text-muted text-xs font-medium truncate max-w-[150px]">
                              {order.userId?.email ?? ''}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white text-sm font-semibold max-w-[200px] truncate">
                            {order.title}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                              <UserIcon size={12} className="text-text-muted" />
                            </div>
                            <span
                              className={cn(
                                'text-xs font-semibold',
                                order.assignedTo ? 'text-white' : 'text-text-muted italic'
                              )}
                            >
                              {order.assignedTo?.name ?? 'Unassigned'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-semibold text-white">
                              {order.totalCreditsQuoted.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                              Credits
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <span className="text-sm font-medium text-white">
                            {new Date(order.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center justify-center p-2 rounded-lg text-text-muted hover:bg-white/5 hover:text-white transition-colors">
                            <Eye size={16} />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2">
            <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrders

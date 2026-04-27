import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle, ArrowRight, Filter, Users, List, Hash, User as UserIcon, Calendar, Database, Eye } from 'lucide-react'
import adminService from '../../services/adminService'
import type { AdminOrder, OrderStatus } from '../../services/adminService'
import StatusBadge from '../../components/admin/StatusBadge'
import Pagination from '../../components/admin/Pagination'
import { createLogger, serializeError } from '../../services/logger'
import { useAuth } from '../../hooks/useAuth'
import Button, { cn } from '../../components/Button'

const logger = createLogger('AdminOrders')

const ORDER_STATUSES: OrderStatus[] = [
  'DRAFT', 'PENDING_PAYMENT', 'UNDER_REVIEW', 'IN_PROGRESS',
  'FINALIZING', 'AWAITING_APPROVAL', 'COMPLETED', 'CANCELLED',
]

const STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Draft', PENDING_PAYMENT: 'Pending payment', UNDER_REVIEW: 'Under review',
  IN_PROGRESS: 'In progress', FINALIZING: 'Finalizing', AWAITING_APPROVAL: 'Awaiting approval',
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
      setError('Failed to load production queue.')
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
    
    if (!assignedToFilter && user?._id) {
      params.assignedTo = user._id
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
    <div className="max-w-7xl mx-auto space-y-10 p-6 md:p-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-white font-bold text-4xl tracking-tight">Production <span className="text-primary italic">queue</span></h1>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-bold text-primary uppercase tracking-widest">
                <Database size={10} /> Active database
             </div>
             <p className="text-text-dim text-sm font-medium">{total} total orders found</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <Button variant="outline" className="rounded-xl border-white/5 bg-white/5 px-6">
              Export CSV
           </Button>
           <Button variant="primary" className="rounded-xl px-8 shadow-xl shadow-primary/20">
              Bulk update
           </Button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row items-center gap-6 bg-bg-card/40 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] shadow-2xl">
        <div className="flex items-center gap-4 flex-1 w-full">
           <div className="relative flex-1 group">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/40 group-focus-within:text-primary transition-colors" size={18} />
              <select
                value={statusFilter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-black/20 border border-white/5 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all appearance-none cursor-pointer"
              >
                <option value="">All production statuses</option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
           </div>
           
           <div className="h-10 w-px bg-white/5 hidden md:block" />
           
           <button
             onClick={toggleOnlyMine}
             className={cn(
               "flex items-center gap-3 px-6 py-3.5 rounded-2xl border transition-all duration-300 font-bold text-sm",
               !!assignedToFilter && assignedToFilter === user?._id
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                : "bg-black/20 border-white/5 text-text-dim hover:text-white"
             )}
           >
              <Users size={18} />
              Assigned to me
           </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-48 gap-6">
          <div className="relative">
             <div className="w-16 h-16 border-2 border-primary/20 rounded-full" />
             <div className="absolute inset-0 w-16 h-16 border-t-2 border-primary rounded-full animate-spin" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-dim/40 animate-pulse">Syncing production records...</p>
        </div>
      ) : error ? (
        <div className="bg-error/10 border border-error/20 rounded-[2rem] p-10 flex items-center gap-6 text-error">
          <AlertCircle size={32} />
          <div className="space-y-1">
             <p className="font-bold text-lg">Failed to load production queue</p>
             <p className="text-sm opacity-60">There was an error communicating with the core API. Please try again.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          <div className="bg-bg-card/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="px-8 py-6 text-[10px] font-bold text-text-dim/60 uppercase tracking-[0.2em]"><div className="flex items-center gap-2"><Hash size={14} /> Order</div></th>
                    <th className="px-8 py-6 text-[10px] font-bold text-text-dim/60 uppercase tracking-[0.2em]"><div className="flex items-center gap-2"><UserIcon size={14} /> Client</div></th>
                    <th className="px-8 py-6 text-[10px] font-bold text-text-dim/60 uppercase tracking-[0.2em]"><div className="flex items-center gap-2"><List size={14} /> Title</div></th>
                    <th className="px-8 py-6 text-[10px] font-bold text-text-dim/60 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-6 text-[10px] font-bold text-text-dim/60 uppercase tracking-[0.2em]">Assignee</th>
                    <th className="px-8 py-6 text-[10px] font-bold text-text-dim/60 uppercase tracking-[0.2em] text-right">Value</th>
                    <th className="px-8 py-6 text-[10px] font-bold text-text-dim/60 uppercase tracking-[0.2em] text-right"><div className="flex items-center justify-end gap-2"><Calendar size={14} /> Received</div></th>
                    <th className="px-8 py-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-8 py-32 text-center">
                         <div className="flex flex-col items-center gap-4 opacity-20">
                            <Database size={48} />
                            <p className="text-xl font-bold italic">No active production records</p>
                         </div>
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr
                        key={order._id}
                        onClick={() => navigate(`/admin/orders/${order._id}`)}
                        className="hover:bg-white/[0.02] cursor-pointer transition-all duration-300 group"
                      >
                        <td className="px-8 py-6">
                          <span className="text-xs font-bold text-primary font-mono tracking-tight bg-primary/5 px-2 py-1 rounded border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
                            {order.orderNumber}
                          </span>
                        </td>
                        <td className="px-8 py-6 min-w-[200px]">
                          <div className="flex flex-col gap-0.5">
                             <p className="text-white font-bold text-sm tracking-tight">{order.userId?.name ?? '—'}</p>
                             <p className="text-text-dim text-[10px] font-medium opacity-40">{order.userId?.email ?? ''}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <p className="text-white text-sm font-semibold max-w-[200px] truncate group-hover:translate-x-1 transition-transform">
                              {order.title}
                           </p>
                        </td>
                        <td className="px-8 py-6">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                                 <UserIcon size={10} className="text-text-dim/40" />
                              </div>
                              <span className={cn("text-xs font-bold", order.assignedTo ? "text-white" : "text-text-dim/40 italic")}>
                                {order.assignedTo?.name ?? 'Unassigned'}
                              </span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex flex-col items-end">
                             <span className="text-sm font-bold text-white font-mono">{order.totalCreditsQuoted.toLocaleString()}</span>
                             <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest opacity-40">Credits</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right whitespace-nowrap">
                          <span className="text-xs font-bold text-text-dim">
                            {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-dim/20 group-hover:text-primary group-hover:bg-primary/10 transition-all shadow-inner">
                             <Eye size={18} />
                           </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="pt-6">
             <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrders

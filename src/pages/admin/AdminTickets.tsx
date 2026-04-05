import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle, ChevronDown, ChevronRight, Paperclip } from 'lucide-react'
import adminService from '../../services/adminService'
import type { AdminTicket, SupportStatus, TicketCategory } from '../../services/adminService'
import Pagination from '../../components/admin/Pagination'
import { cn } from '../../components/Button'
import { createLogger, serializeError } from '../../services/logger'

const logger = createLogger('AdminTickets')

const SUPPORT_STATUSES: SupportStatus[] = ['open', 'in_progress', 'resolved', 'closed']
const TICKET_CATEGORIES: TicketCategory[] = [
  'Order Problem', 'Billing Issue', 'Technical Issue', 'Feature Request', 'Other',
]

const CATEGORY_STYLES: Record<TicketCategory, string> = {
  'Order Problem':    'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  'Billing Issue':    'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  'Technical Issue':  'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  'Feature Request':  'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  'Other':            'bg-text-muted/10 text-text-muted border border-border',
}

// ─── Inline Status Dropdown with Optimistic UI ────────────────────────────────

const StatusDropdown: React.FC<{
  ticketId: string
  current: SupportStatus
  onUpdated: (id: string, status: SupportStatus) => void
  onRevert: (id: string, status: SupportStatus) => void
}> = ({ ticketId, current, onUpdated, onRevert }) => {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as SupportStatus
    const prev = current
    onUpdated(ticketId, newStatus) // optimistic
    setIsUpdating(true)
    try {
      await adminService.updateTicketStatus(ticketId, newStatus)
    } catch (err) {
      logger.error('admin_tickets.status_update_failed', { error: serializeError(err) })
      onRevert(ticketId, prev) // revert
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="relative inline-flex items-center gap-1">
      <select
        value={current}
        onChange={handleChange}
        disabled={isUpdating}
        className="appearance-none bg-bg-dark border border-border rounded-lg pl-2 pr-6 py-1 text-xs text-text-main focus:outline-none focus:border-primary transition-colors cursor-pointer disabled:opacity-50"
      >
        {SUPPORT_STATUSES.map((s) => (
          <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
        ))}
      </select>
      {isUpdating
        ? <Loader2 size={10} className="absolute right-1 top-1/2 -translate-y-1/2 animate-spin text-text-muted pointer-events-none" />
        : <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      }
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const AdminTickets: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tickets, setTickets] = useState<AdminTicket[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const statusFilter = searchParams.get('status') ?? ''
  const categoryFilter = searchParams.get('category') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1', 10)

  const fetchTickets = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await adminService.listTickets({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        page,
        limit: 20,
      })
      setTickets(result.items)
      setTotal(result.total)
      setPages(result.pages)
    } catch (err) {
      logger.error('admin_tickets.fetch_failed', { error: serializeError(err) })
      setError('Failed to load tickets.')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, categoryFilter, page])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  const setFilter = (key: string, value: string) => {
    const params: Record<string, string> = { page: '1' }
    if (statusFilter && key !== 'status') params.status = statusFilter
    if (categoryFilter && key !== 'category') params.category = categoryFilter
    if (value) params[key] = value
    setSearchParams(params)
  }

  const setPage = (p: number) => {
    const params: Record<string, string> = { page: String(p) }
    if (statusFilter) params.status = statusFilter
    if (categoryFilter) params.category = categoryFilter
    setSearchParams(params)
  }

  const updateStatusOptimistic = (id: string, status: SupportStatus) => {
    setTickets((prev) => prev.map((t) => t._id === id ? { ...t, status } : t))
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-text-main font-bold text-2xl">Support Tickets</h1>
        <span className="text-text-muted text-sm">{total} total</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setFilter('status', e.target.value)}
          className="bg-bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary"
        >
          <option value="">All Statuses</option>
          {SUPPORT_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>)}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setFilter('category', e.target.value)}
          className="bg-bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary"
        >
          <option value="">All Categories</option>
          {TICKET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {isLoading && <div className="flex justify-center min-h-[300px] items-center"><Loader2 className="animate-spin text-primary" size={36} /></div>}
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
                    {['', 'Client', 'Category', 'Message', 'Status', 'Date'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-text-muted text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tickets.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-text-muted text-sm">No tickets found.</td></tr>
                  )}
                  {tickets.map((ticket) => (
                    <React.Fragment key={ticket._id}>
                      <tr
                        className="hover:bg-bg-dark transition-colors cursor-pointer"
                        onClick={() => setExpandedId(expandedId === ticket._id ? null : ticket._id)}
                      >
                        <td className="px-4 py-3">
                          <ChevronRight size={14} className={cn('text-text-muted transition-transform', expandedId === ticket._id && 'rotate-90')} />
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-text-main font-medium whitespace-nowrap">{ticket.userId?.name ?? '—'}</p>
                          <p className="text-text-muted text-xs">{ticket.userId?.email ?? ''}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', CATEGORY_STYLES[ticket.category])}>
                            {ticket.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[260px]">
                          <p className="text-text-muted text-xs truncate">{ticket.message}</p>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <StatusDropdown
                            ticketId={ticket._id}
                            current={ticket.status}
                            onUpdated={updateStatusOptimistic}
                            onRevert={updateStatusOptimistic}
                          />
                        </td>
                        <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                      {/* Expanded row */}
                      {expandedId === ticket._id && (
                        <tr className="bg-bg-dark">
                          <td colSpan={6} className="px-6 py-4">
                            <p className="text-text-main text-sm leading-relaxed whitespace-pre-wrap mb-3">{ticket.message}</p>
                            {ticket.attachmentAssetIds.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {ticket.attachmentAssetIds.map((id) => (
                                  <span key={id} className="flex items-center gap-1.5 bg-bg-card border border-border rounded-lg px-2 py-1 text-xs text-text-muted">
                                    <Paperclip size={10} /> {id}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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

export default AdminTickets

import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  Paperclip,
  Mail,
  ShieldAlert,
  MessageCircle,
  Filter,
  Calendar,
  User as UserIcon,
  LifeBuoy,
} from 'lucide-react'
import adminService from '../../services/adminService'
import type { AdminTicket, SupportStatus, TicketCategory } from '../../services/adminService'
import Pagination from '../../components/admin/Pagination'
import Button, { cn } from '../../components/Button'
import { createLogger, serializeError } from '../../services/logger'

const logger = createLogger('AdminTickets')

const SUPPORT_STATUSES: SupportStatus[] = ['open', 'in_progress', 'resolved', 'closed']
const TICKET_CATEGORIES: TicketCategory[] = [
  'Order Problem',
  'Billing Issue',
  'Technical Issue',
  'Feature Request',
  'Other',
]

const CATEGORY_STYLES: Record<TicketCategory, string> = {
  'Order Problem': 'bg-amber-500/10 text-amber-500',
  'Billing Issue': 'bg-error/10 text-error',
  'Technical Issue': 'bg-blue-500/10 text-blue-500',
  'Feature Request': 'bg-purple-500/10 text-purple-500',
  Other: 'bg-white/10 text-text-muted',
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
    <div className="relative inline-flex items-center group">
      <select
        value={current}
        onChange={handleChange}
        disabled={isUpdating}
        className="appearance-none bg-black/20 border border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold uppercase tracking-wider text-white focus:outline-none focus:border-primary/50 transition-colors cursor-pointer disabled:opacity-50"
      >
        {SUPPORT_STATUSES.map((s) => (
          <option key={s} value={s} className="bg-bg-dark">
            {s.replace('_', ' ')}
          </option>
        ))}
      </select>
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
        {isUpdating ? (
          <Loader2 size={12} className="animate-spin text-primary" />
        ) : (
          <ChevronDown size={12} />
        )}
      </div>
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
      setError('Failed to load support tickets.')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, categoryFilter, page])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

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
    setTickets((prev) => prev.map((t) => (t._id === id ? { ...t, status } : t)))
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <LifeBuoy size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Support Tickets</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-text-muted text-sm font-medium">
            <p>{total} total tickets active</p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-bg-card border border-white/10 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Filter
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            size={16}
          />
          <select
            value={statusFilter}
            onChange={(e) => setFilter('status', e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-8 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="">All statuses</option>
            {SUPPORT_STATUSES.map((s) => (
              <option key={s} value={s} className="bg-bg-dark capitalize">
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 w-full">
          <MessageCircle
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            size={16}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setFilter('category', e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-8 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="">All categories</option>
            {TICKET_CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-bg-dark">
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 size={32} className="text-primary animate-spin" />
          <p className="text-sm font-medium text-text-muted">Loading tickets...</p>
        </div>
      ) : error ? (
        <div className="bg-error/5 border border-error/20 rounded-xl p-6 flex items-center gap-4 text-error shadow-sm">
          <ShieldAlert size={32} />
          <div className="space-y-1">
            <p className="font-semibold text-lg">Failed to load tickets</p>
            <p className="text-sm text-error/80">{error}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-bg-card border border-white/10 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/20 border-b border-white/10">
                    <th className="px-4 py-4 w-12"></th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-24 text-center text-text-muted">
                        <p className="text-sm">No support tickets found</p>
                      </td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => (
                      <React.Fragment key={ticket._id}>
                        <tr
                          className={cn(
                            'hover:bg-white/[0.02] transition-colors cursor-pointer group',
                            expandedId === ticket._id && 'bg-white/[0.02]'
                          )}
                          onClick={() =>
                            setExpandedId(expandedId === ticket._id ? null : ticket._id)
                          }
                        >
                          <td className="px-4 py-4">
                            <div
                              className={cn(
                                'w-6 h-6 rounded flex items-center justify-center text-text-muted transition-transform',
                                expandedId === ticket._id && 'rotate-90 text-primary'
                              )}
                            >
                              <ChevronRight size={18} />
                            </div>
                          </td>
                          <td className="px-6 py-4 min-w-[200px]">
                            <div className="flex flex-col">
                              <p className="text-white font-semibold text-sm truncate">
                                {ticket.userId?.name ?? '—'}
                              </p>
                              <p className="text-text-muted text-xs truncate">
                                {ticket.userId?.email ?? ''}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={cn(
                                'px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider',
                                CATEGORY_STYLES[ticket.category]
                              )}
                            >
                              {ticket.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 max-w-[300px]">
                            <p className="text-text-muted text-sm truncate group-hover:text-white/80 transition-colors">
                              {ticket.message}
                            </p>
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <StatusDropdown
                              ticketId={ticket._id}
                              current={ticket.status}
                              onUpdated={updateStatusOptimistic}
                              onRevert={updateStatusOptimistic}
                            />
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <span className="text-sm text-text-muted">
                              {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </td>
                        </tr>
                        {/* Expanded Row */}
                        {expandedId === ticket._id && (
                          <tr className="bg-black/10">
                            <td colSpan={6} className="px-10 py-6 border-l-2 border-primary">
                              <div className="space-y-6">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-text-muted">
                                    <MessageCircle size={16} />
                                    <span className="text-xs font-semibold uppercase tracking-wider">
                                      Ticket Message
                                    </span>
                                  </div>
                                  <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                                    {ticket.message}
                                  </p>
                                </div>

                                {ticket.attachmentAssetIds.length > 0 && (
                                  <div className="pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-text-muted mb-3">
                                      <Paperclip size={16} />
                                      <span className="text-xs font-semibold uppercase tracking-wider">
                                        Attachments ({ticket.attachmentAssetIds.length})
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {ticket.attachmentAssetIds.map((id) => (
                                        <div
                                          key={id}
                                          className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 hover:border-white/30 transition-colors cursor-pointer group/asset"
                                        >
                                          <span className="text-xs font-medium text-primary">
                                            {id.slice(-8)}
                                          </span>
                                          <div className="w-px h-3 bg-white/10" />
                                          <span className="text-[10px] font-semibold text-text-muted group-hover/asset:text-white transition-colors uppercase tracking-wider">
                                            Download
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="pt-4 flex items-center justify-end gap-3">
                                  <Button variant="outline" className="text-sm px-4">
                                    Reply via Email
                                  </Button>
                                  <Button variant="primary" className="text-sm px-4">
                                    Mark Reviewed
                                  </Button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-center">
            <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminTickets

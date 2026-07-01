import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Image,
  Database,
  Filter,
  Calendar,
  User as UserIcon,
  Bug,
  ShieldAlert,
  MessageSquare,
} from 'lucide-react'
import adminService from '../../services/adminService'
import type { AdminBugReport, SupportStatus } from '../../services/adminService'
import Pagination from '../../components/admin/Pagination'
import Button, { cn } from '../../components/Button'
import { createLogger, serializeError } from '../../services/logger'

const logger = createLogger('AdminBugReports')

const SUPPORT_STATUSES: SupportStatus[] = ['open', 'in_progress', 'resolved', 'closed']

// ─── Inline Status Dropdown ───────────────────────────────────────────────────

const BugStatusDropdown: React.FC<{
  bugId: string
  current: SupportStatus
  onUpdated: (id: string, status: SupportStatus) => void
}> = ({ bugId, current, onUpdated }) => {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as SupportStatus
    const prev = current
    onUpdated(bugId, newStatus) // optimistic
    setIsUpdating(true)
    try {
      await adminService.updateBugStatus(bugId, newStatus)
    } catch (err) {
      logger.error('admin_bugs.status_update_failed', { error: serializeError(err) })
      onUpdated(bugId, prev) // revert
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

const AdminBugReports: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [bugs, setBugs] = useState<AdminBugReport[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const statusFilter = searchParams.get('status') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1', 10)

  const fetchBugs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await adminService.listBugReports({
        status: statusFilter || undefined,
        page,
        limit: 20,
      })
      setBugs(result.items)
      setTotal(result.total)
      setPages(result.pages)
    } catch (err) {
      logger.error('admin_bugs.fetch_failed', { error: serializeError(err) })
      setError('Failed to load bug reports.')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => {
    fetchBugs()
  }, [fetchBugs])

  const setFilter = (value: string) => {
    const params: Record<string, string> = { page: '1' }
    if (value) params.status = value
    setSearchParams(params)
  }

  const setPage = (p: number) => {
    const params: Record<string, string> = { page: String(p) }
    if (statusFilter) params.status = statusFilter
    setSearchParams(params)
  }

  const updateStatusOptimistic = (id: string, status: SupportStatus) => {
    setBugs((prev) => prev.map((b) => (b._id === id ? { ...b, status } : b)))
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Bug size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Bug Reports</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-text-muted text-sm font-medium">
            <p>{total} total reports cataloged</p>
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
            onChange={(e) => setFilter(e.target.value)}
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
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 size={32} className="text-primary animate-spin" />
          <p className="text-sm font-medium text-text-muted">Loading bug reports...</p>
        </div>
      ) : error ? (
        <div className="bg-error/5 border border-error/20 rounded-xl p-6 flex items-center gap-4 text-error shadow-sm">
          <ShieldAlert size={32} />
          <div className="space-y-1">
            <p className="font-semibold text-lg">Failed to load bug reports</p>
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
                      Description
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">
                      Recorded
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bugs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-24 text-center text-text-muted">
                        <p className="text-sm">No bug reports found</p>
                      </td>
                    </tr>
                  ) : (
                    bugs.map((bug) => (
                      <React.Fragment key={bug._id}>
                        <tr
                          className={cn(
                            'hover:bg-white/[0.02] transition-colors cursor-pointer group',
                            expandedId === bug._id && 'bg-white/[0.02]'
                          )}
                          onClick={() => setExpandedId(expandedId === bug._id ? null : bug._id)}
                        >
                          <td className="px-4 py-4">
                            <div
                              className={cn(
                                'w-6 h-6 rounded flex items-center justify-center text-text-muted transition-transform',
                                expandedId === bug._id && 'rotate-90 text-primary'
                              )}
                            >
                              <ChevronRight size={18} />
                            </div>
                          </td>
                          <td className="px-6 py-4 min-w-[200px]">
                            <div className="flex flex-col">
                              <p className="text-white font-semibold text-sm truncate">
                                {bug.userId?.name ?? '—'}
                              </p>
                              <p className="text-text-muted text-xs truncate">
                                {bug.userId?.email ?? ''}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 max-w-[300px]">
                            <p className="text-text-muted text-sm truncate group-hover:text-white/80 transition-colors">
                              {bug.description}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                'px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider',
                                bug.wantsFollowUp
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-white/10 text-text-muted'
                              )}
                            >
                              {bug.wantsFollowUp ? 'High' : 'Normal'}
                            </span>
                          </td>
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <BugStatusDropdown
                              bugId={bug._id}
                              current={bug.status}
                              onUpdated={updateStatusOptimistic}
                            />
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <span className="text-sm text-text-muted">
                              {new Date(bug.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </td>
                        </tr>
                        {/* Expanded Row */}
                        {expandedId === bug._id && (
                          <tr className="bg-black/10">
                            <td colSpan={6} className="px-10 py-6 border-l-2 border-primary">
                              <div className="space-y-6">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-text-muted">
                                    <MessageSquare size={16} />
                                    <span className="text-xs font-semibold uppercase tracking-wider">
                                      Bug Description
                                    </span>
                                  </div>
                                  <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                                    {bug.description}
                                  </p>
                                </div>

                                {bug.screenshotAssetIds.length > 0 && (
                                  <div className="pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-text-muted mb-3">
                                      <Image size={16} />
                                      <span className="text-xs font-semibold uppercase tracking-wider">
                                        Screenshots ({bug.screenshotAssetIds.length})
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {bug.screenshotAssetIds.map((id) => (
                                        <div
                                          key={id}
                                          className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 hover:border-white/30 transition-colors cursor-pointer group/asset"
                                        >
                                          <span className="text-xs font-medium text-primary">
                                            {id.slice(-8)}
                                          </span>
                                          <div className="w-px h-3 bg-white/10" />
                                          <span className="text-[10px] font-semibold text-text-muted group-hover/asset:text-white transition-colors uppercase tracking-wider">
                                            View
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="pt-4 flex items-center justify-end gap-3">
                                  <Button variant="outline" className="text-sm px-4">
                                    Contact User
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

export default AdminBugReports

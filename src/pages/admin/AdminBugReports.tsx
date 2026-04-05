import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle, ChevronDown, ChevronRight, Image } from 'lucide-react'
import adminService from '../../services/adminService'
import type { AdminBugReport, SupportStatus } from '../../services/adminService'
import Pagination from '../../components/admin/Pagination'
import { cn } from '../../components/Button'
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
    <div className="relative inline-flex items-center">
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

  useEffect(() => { fetchBugs() }, [fetchBugs])

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
    setBugs((prev) => prev.map((b) => b._id === id ? { ...b, status } : b))
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-text-main font-bold text-2xl">Bug Reports</h1>
        <span className="text-text-muted text-sm">{total} total</span>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary"
        >
          <option value="">All Statuses</option>
          {SUPPORT_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>)}
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
                    {['', 'Client', 'Description', 'Follow-up', 'Status', 'Date'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-text-muted text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bugs.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-text-muted text-sm">No bug reports found.</td></tr>
                  )}
                  {bugs.map((bug) => (
                    <React.Fragment key={bug._id}>
                      <tr
                        className="hover:bg-bg-dark transition-colors cursor-pointer"
                        onClick={() => setExpandedId(expandedId === bug._id ? null : bug._id)}
                      >
                        <td className="px-4 py-3">
                          <ChevronRight size={14} className={cn('text-text-muted transition-transform', expandedId === bug._id && 'rotate-90')} />
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-text-main font-medium whitespace-nowrap">{bug.userId?.name ?? '—'}</p>
                          <p className="text-text-muted text-xs">{bug.userId?.email ?? ''}</p>
                        </td>
                        <td className="px-4 py-3 max-w-[280px]">
                          <p className="text-text-muted text-xs truncate">{bug.description}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'inline-flex px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap',
                            bug.wantsFollowUp
                              ? 'bg-primary/10 text-primary border border-primary/30'
                              : 'bg-text-muted/10 text-text-muted border border-border'
                          )}>
                            {bug.wantsFollowUp ? 'Wants Follow-up' : 'No Follow-up'}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <BugStatusDropdown
                            bugId={bug._id}
                            current={bug.status}
                            onUpdated={updateStatusOptimistic}
                          />
                        </td>
                        <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                          {new Date(bug.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                      {/* Expanded row */}
                      {expandedId === bug._id && (
                        <tr className="bg-bg-dark">
                          <td colSpan={6} className="px-6 py-4">
                            <p className="text-text-main text-sm leading-relaxed whitespace-pre-wrap mb-3">{bug.description}</p>
                            {bug.screenshotAssetIds.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                <p className="text-text-muted text-xs w-full font-semibold mb-1">Screenshots:</p>
                                {bug.screenshotAssetIds.map((id) => (
                                  <span key={id} className="flex items-center gap-1.5 bg-bg-card border border-border rounded-lg px-2 py-1 text-xs text-text-muted">
                                    <Image size={10} /> {id}
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

export default AdminBugReports

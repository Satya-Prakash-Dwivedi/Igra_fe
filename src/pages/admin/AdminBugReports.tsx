import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle, ChevronDown, ChevronRight, Image, Database, Filter, Calendar, User as UserIcon, Bug, ShieldAlert, MessageSquare } from 'lucide-react'
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
        className="appearance-none bg-black/40 border border-white/10 rounded-xl pl-4 pr-10 py-2 text-[10px] font-bold uppercase tracking-widest text-white focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/40 transition-all cursor-pointer disabled:opacity-50"
      >
        {SUPPORT_STATUSES.map((s) => (
          <option key={s} value={s} className="bg-bg-dark">{s.replace('_', ' ')}</option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-dim/40 group-hover:text-primary transition-colors">
        {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <ChevronDown size={12} />}
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
      setError('Failed to sync anomaly reports.')
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
    <div className="max-w-7xl mx-auto space-y-10 p-6 md:p-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-white font-bold text-4xl tracking-tight italic">Anomaly <span className="text-primary not-italic">tracking</span></h1>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-bold text-primary uppercase tracking-widest">
                <Bug size={10} /> System anomalies
             </div>
             <p className="text-text-dim text-sm font-medium">{total} total reports cataloged</p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row items-center gap-6 bg-bg-card/40 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] shadow-2xl">
        <div className="relative flex-1 group">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/40 group-focus-within:text-primary transition-colors" size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-black/20 border border-white/5 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all appearance-none cursor-pointer"
          >
            <option value="">All statuses</option>
            {SUPPORT_STATUSES.map((s) => <option key={s} value={s} className="bg-bg-dark capitalize">{s.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-48 gap-6">
          <div className="relative">
             <div className="w-16 h-16 border-2 border-primary/20 rounded-full" />
             <div className="absolute inset-0 w-16 h-16 border-t-2 border-primary rounded-full animate-spin" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-dim/40 animate-pulse">Scanning system logs...</p>
        </div>
      ) : error ? (
        <div className="bg-error/10 border border-error/20 rounded-[2rem] p-10 flex items-center gap-6 text-error shadow-2xl">
          <ShieldAlert size={32} />
          <div className="space-y-1">
             <p className="font-bold text-lg">Diagnostics failure</p>
             <p className="text-sm opacity-60">Unable to establish a secure link with the anomaly database.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          <div className="bg-bg-card/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="px-6 py-6 w-12"></th>
                    <th className="px-8 py-6 text-[10px] font-bold text-text-dim/60 uppercase tracking-[0.2em]"><div className="flex items-center gap-2"><UserIcon size={14} /> Client</div></th>
                    <th className="px-8 py-6 text-[10px] font-bold text-text-dim/60 uppercase tracking-[0.2em]">Description</th>
                    <th className="px-8 py-6 text-[10px] font-bold text-text-dim/60 uppercase tracking-[0.2em]">Contact priority</th>
                    <th className="px-8 py-6 text-[10px] font-bold text-text-dim/60 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-6 text-[10px] font-bold text-text-dim/60 uppercase tracking-[0.2em] text-right"><div className="flex items-center justify-end gap-2"><Calendar size={14} /> Recorded</div></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bugs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-32 text-center opacity-20">
                        <p className="text-xl font-bold italic">No anomalies detected</p>
                      </td>
                    </tr>
                  ) : (
                    bugs.map((bug) => (
                      <React.Fragment key={bug._id}>
                        <tr
                          className={cn(
                            "hover:bg-white/[0.02] transition-all duration-300 cursor-pointer group",
                            expandedId === bug._id && "bg-white/[0.02]"
                          )}
                          onClick={() => setExpandedId(expandedId === bug._id ? null : bug._id)}
                        >
                          <td className="px-6 py-6">
                            <div className={cn(
                               "w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-dim transition-all duration-500",
                               expandedId === bug._id && "rotate-90 text-primary bg-primary/10 shadow-lg shadow-primary/10"
                            )}>
                               <ChevronRight size={16} />
                            </div>
                          </td>
                          <td className="px-8 py-6 min-w-[200px]">
                            <div className="flex flex-col gap-0.5">
                               <p className="text-white font-bold text-sm tracking-tight">{bug.userId?.name ?? '—'}</p>
                               <p className="text-text-dim text-[10px] font-medium opacity-40">{bug.userId?.email ?? ''}</p>
                            </div>
                          </td>
                          <td className="px-8 py-6 max-w-[300px]">
                            <p className="text-text-dim text-sm font-medium truncate opacity-60 group-hover:opacity-100 transition-opacity">{bug.description}</p>
                          </td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              'px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all duration-500',
                              bug.wantsFollowUp
                                ? 'bg-primary/10 text-primary border-primary/20 shadow-lg shadow-primary/5'
                                : 'bg-white/5 text-text-dim/40 border-white/5'
                            )}>
                              {bug.wantsFollowUp ? 'High priority' : 'General'}
                            </span>
                          </td>
                          <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                            <BugStatusDropdown
                              bugId={bug._id}
                              current={bug.status}
                              onUpdated={updateStatusOptimistic}
                            />
                          </td>
                          <td className="px-8 py-6 text-right whitespace-nowrap">
                            <span className="text-xs font-bold text-text-dim">
                              {new Date(bug.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </td>
                        </tr>
                        {/* Expanded Row */}
                        {expandedId === bug._id && (
                          <tr className="bg-black/20 animate-in slide-in-from-top-4 duration-500">
                            <td colSpan={6} className="px-20 py-10">
                               <div className="bg-bg-dark border border-white/5 rounded-3xl p-10 shadow-inner space-y-8">
                                  <div className="space-y-4">
                                     <div className="flex items-center gap-3 text-text-dim/40">
                                        <MessageSquare size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Detailed anomaly description</span>
                                     </div>
                                     <p className="text-white text-lg font-medium leading-relaxed whitespace-pre-wrap">{bug.description}</p>
                                  </div>
                                  
                                  {bug.screenshotAssetIds.length > 0 && (
                                    <div className="pt-6 border-t border-white/5">
                                       <div className="flex items-center gap-3 text-text-dim/40 mb-4">
                                          <Image size={14} />
                                          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Visual evidence ({bug.screenshotAssetIds.length})</span>
                                       </div>
                                       <div className="flex flex-wrap gap-3">
                                          {bug.screenshotAssetIds.map((id) => (
                                            <div key={id} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl px-4 py-2 hover:border-primary/40 transition-all group/asset cursor-pointer">
                                               <span className="text-xs font-mono text-primary font-bold">{id.slice(-8)}</span>
                                               <div className="w-px h-3 bg-white/10" />
                                               <span className="text-[10px] text-text-dim group-hover/asset:text-white transition-colors">View capture</span>
                                            </div>
                                          ))}
                                       </div>
                                    </div>
                                  )}

                                  <div className="pt-8 flex items-center justify-end gap-4">
                                     <Button variant="outline" className="rounded-xl px-6 border-white/5 bg-white/5">Log review</Button>
                                     <Button variant="primary" className="rounded-xl px-8 shadow-xl shadow-primary/20">Initiate patch</Button>
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
          
          <div className="pt-6">
             <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminBugReports

import React, { useState, useEffect } from 'react'
import {
  FileText,
  Search,
  Filter,
} from 'lucide-react'
import adminService, { type AdminCreditLedgerEntry } from '../../services/adminService'
import { createLogger, serializeError } from '../../services/logger'
import Button, { cn } from '../../components/Button'

const logger = createLogger('AdminLedger')

const AdminLedger: React.FC = () => {
  const [entries, setEntries] = useState<AdminCreditLedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    fetchLedger()
  }, [page, reason])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchLedger()
  }

  const fetchLedger = async () => {
    try {
      setLoading(true)
      const res = await adminService.listLedgerEntries({
        page,
        limit: 20,
        search,
        reason,
      })
      setEntries(res.items)
      setTotalPages(res.pages || 1)
    } catch (err: any) {
      setError('Failed to fetch ledger entries.')
      logger.error('failed_to_fetch_ledger', { err: serializeError(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6 md:p-10 relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Credit Ledger</h1>
            </div>
          </div>
          <p className="text-text-muted text-sm font-medium mt-2">
            Monitor credit transactions across all users
          </p>
        </div>
      </div>

      <div className="bg-bg-card border border-white/10 rounded-xl overflow-hidden shadow-sm space-y-0">
        <div className="p-4 sm:p-6 border-b border-white/10">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-4 bg-bg-card border border-white/10 p-4 rounded-xl shadow-sm">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input
                type="text"
                placeholder="Search by User Name or Email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-text-dim/40"
              />
            </div>
            
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            
            <div className="relative w-full sm:w-64">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <select
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value)
                  setPage(1)
                }}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer"
              >
                <option value="">All Reasons</option>
                <option value="PURCHASE">Purchase</option>
                <option value="ORDER_PAYMENT">Order Payment</option>
                <option value="MANUAL_GRANT">Manual Grant</option>
                <option value="REFUND">Refund</option>
              </select>
            </div>
            <Button type="submit" variant="primary" className="w-full sm:w-auto px-6 py-2 h-auto text-sm">
              Apply Filters
            </Button>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-error">
            <p>{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-text-muted">
            <FileText size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-white mb-2">No Transactions Found</h3>
            <p>No credit transactions match your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Balance After</th>
                  <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry._id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-text-muted whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{entry.walletId?.userId?.name || 'Unknown'}</span>
                        <span className="text-xs text-text-muted">{entry.walletId?.userId?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full border",
                        entry.delta > 0 ? "bg-success/10 text-success border-success/20" : "bg-error/10 text-error border-error/20"
                      )}>
                        {entry.reason.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-sm font-bold",
                        entry.delta > 0 ? "text-success" : "text-error"
                      )}>
                        {entry.delta > 0 ? '+' : ''}{entry.delta}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {entry.balanceAfter}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted max-w-[200px] truncate" title={entry.notes}>
                      {entry.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 pt-6 border-t border-white/5">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-text-muted">
              Page <strong className="text-white">{page}</strong> of{' '}
              <strong className="text-white">{totalPages}</strong>
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminLedger

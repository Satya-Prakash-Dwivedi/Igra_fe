import { useState, useEffect } from 'react'
import { 
  Receipt, 
  Calendar, 
  Hash, 
  FileText, 
  CreditCard, 
  FileDown, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react'
import * as billingApi from '../services/billingService'
import type { Invoice } from '../services/billingService'
import { createLogger, serializeError } from '../services/logger'
import Button from '../components/Button'

const logger = createLogger('Invoices')

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await billingApi.listInvoices(page, 20)
        setInvoices(res.invoices)
        setTotal(res.total)
      } catch (err) {
        logger.error('invoices.load_failed', { error: serializeError(err) })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page])

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700 px-6 relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-10 relative z-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Invoices
          </h1>
          <p className="text-sm text-text-dim/60">
            {total} transactions found in your records
          </p>
        </div>
        
        <div className="flex bg-bg-card/40 border border-white/5 p-1 rounded-xl backdrop-blur-xl">
           <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-primary text-white shadow-lg shadow-primary/20 transition-all">All</button>
           <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-text-dim/40 hover:text-white transition-all">Pending</button>
           <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-text-dim/40 hover:text-white transition-all">Paid</button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-6">
          <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim/40 animate-pulse">Loading invoices...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-bg-card/40 backdrop-blur-xl border border-dashed border-white/10 rounded-2xl p-16 text-center shadow-2xl relative z-10">
          <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
             <Receipt size={28} className="text-text-dim/20" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No invoices found</h2>
          <p className="text-text-dim/40 max-w-sm mx-auto text-sm">Your payment history will appear here once you've made a purchase.</p>
        </div>
      ) : (
        <div className="bg-bg-card/40 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden shadow-xl relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">
                    Date
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">
                    Invoice #
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">
                    Description
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-dim/40 uppercase tracking-widest text-right">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-text-dim/40 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-white/[0.02] transition-all duration-300 group">
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-white">
                        {new Date(inv.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                        {inv.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-white">
                          {inv.lineItems[0]?.description || 'Credit purchase'}
                        </span>
                        <div className="flex items-center gap-1.5">
                           <span className="w-1.5 h-1.5 rounded-full bg-success" />
                           <span className="text-[10px] font-bold text-success uppercase tracking-widest">Paid</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-bold text-white">
                          ${(inv.totalCents / 100).toFixed(2)}
                        </span>
                        <span className="text-[9px] font-bold text-text-dim/40 uppercase tracking-widest">{inv.currency}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 rounded-lg bg-white/5 text-text-dim/40 hover:text-white hover:bg-primary transition-all shadow-inner" title="Download">
                          <FileDown size={16} />
                        </button>
                        <button className="p-2 rounded-lg bg-white/5 text-text-dim/40 hover:text-white hover:bg-white/10 transition-all shadow-inner" title="View">
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex justify-center items-center gap-8 pt-8 relative z-10">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="w-10 h-10 p-0 rounded-xl"
          >
            <ChevronLeft size={20} />
          </Button>
          
          <div className="text-center min-w-[100px] space-y-1">
             <p className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">Page</p>
             <div className="text-sm font-bold text-white">
                {page} <span className="text-text-dim/20 mx-2">/</span> {Math.max(1, Math.ceil(total / 20))}
             </div>
          </div>
          
          <Button
            variant="outline"
            disabled={page * 20 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="w-10 h-10 p-0 rounded-xl"
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      )}
    </div>
  )
}

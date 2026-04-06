import { useState, useEffect } from 'react'
import * as billingApi from '../services/billingService'
import type { Invoice } from '../services/billingService'
import { Receipt, FileDown, ExternalLink, ChevronRight, ChevronLeft } from 'lucide-react'
import { createLogger, serializeError } from '../services/logger'

const logger = createLogger('Invoices')

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvoices()
  }, [page])

  async function loadInvoices() {
    setLoading(true)
    try {
      const result = await billingApi.listInvoices(page, 20)
      setInvoices(result.invoices)
      setTotal(result.total)
    } catch (err) {
      logger.error('invoices.load_failed', {
        page,
        error: serializeError(err),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-200 px-4">
      {/* Header Section */}
      <div className="pt-6">
        <h1 className="text-4xl font-black text-white tracking-tight uppercase">
          Billing <span className="text-primary italic">Ledger</span>
        </h1>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          {total} Total Transactions
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-50">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Syncing Ledger...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="border border-dashed border-white/5 rounded-3xl p-20 text-center bg-white/[0.01]">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-inner">
             <Receipt size={24} className="text-gray-600" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mb-2 uppercase">No Invoices</h2>
          <p className="text-gray-500 max-w-xs mx-auto text-sm">Your payment history will appear here once you've made a purchase.</p>
        </div>
      ) : (
        <div className="premium-card rounded-3xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Invoice #</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Amount</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-white/[0.02] transition-[background-color] duration-200 group">
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {new Date(inv.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-black text-white font-mono tracking-tighter">
                        {inv.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-white tracking-tight">
                          {inv.lineItems[0]?.description || 'Credit Purchase'}
                        </span>
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest opacity-60">Success</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-lg font-black text-white italic">
                        ${(inv.totalCents / 100).toFixed(2)}
                      </span>
                      <span className="ml-2 text-[10px] font-bold text-gray-500 uppercase">{inv.currency}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 rounded-lg bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-[color,background-color] duration-200">
                          <FileDown size={14} />
                        </button>
                        <button className="p-2 rounded-lg bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-[color,background-color] duration-200">
                          <ExternalLink size={14} />
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
        <div className="flex justify-center items-center gap-6 pt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="w-12 h-12 bg-white/5 text-white rounded-xl flex items-center justify-center hover:bg-white/10 disabled:opacity-20 transition-[background-color,opacity] duration-200 border border-white/5 transform-gpu"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center min-w-[100px]">
             <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Page</p>
            <span className="text-base font-black text-white italic">
               {page} <span className="text-text-dim/40 mx-2 text-sm">/</span> {Math.max(1, Math.ceil(total / 20))}
            </span>
          </div>
          <button
            disabled={page * 20 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="w-12 h-12 bg-white/5 text-white rounded-xl flex items-center justify-center hover:bg-white/10 disabled:opacity-20 transition-[background-color,opacity] duration-200 border border-white/5 transform-gpu"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}

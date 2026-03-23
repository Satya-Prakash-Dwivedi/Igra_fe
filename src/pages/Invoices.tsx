import { useState, useEffect } from 'react'
import * as billingApi from '../services/billingService'
import type { Invoice } from '../services/billingService'
import { Receipt } from 'lucide-react'
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Invoices</h1>
        <p className="text-gray-400 mt-1">View your payment history and download invoices</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-bg-card rounded-xl border border-border-subtle p-12 text-center">
          <Receipt size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-white font-medium mb-2">No invoices yet</h3>
          <p className="text-gray-400">
            Invoices will appear here after your first credit purchase.
          </p>
        </div>
      ) : (
        <div className="bg-bg-card rounded-xl border border-border-subtle overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Invoice #</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                  Description
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv._id}
                  className="border-b border-border-subtle last:border-0 hover:bg-bg-dark/50"
                >
                  <td className="px-4 py-3">
                    <span className="text-white text-sm font-medium">{inv.invoiceNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-400 text-sm">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-300 text-sm">
                      {inv.lineItems[0]?.description || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-white font-medium">
                      ${(inv.totalCents / 100).toFixed(2)} {inv.currency}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 bg-bg-card text-gray-400 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-400">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            disabled={page * 20 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-bg-card text-gray-400 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Download, 
  Receipt, 
  Calendar, 
  Hash, 
  CreditCard,
  FileText,
  Loader2,
  ExternalLink
} from 'lucide-react'
import * as billingApi from '../services/billingService'
import type { Invoice } from '../services/billingService'
import { createLogger, serializeError } from '../services/logger'
import Button from '../components/Button'
import { generateInvoicePDF } from '../utils/invoiceUtils'

const logger = createLogger('InvoiceDetail')

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!id) return
      setLoading(true)
      try {
        const data = await billingApi.getInvoiceDetail(id)
        setInvoice(data)
      } catch (err) {
        logger.error('invoice.load_failed', { id, error: serializeError(err) })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleDownload = () => {
    if (invoice) generateInvoicePDF(invoice, 'download')
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 animate-in fade-in duration-700">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">Loading invoice details...</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto border border-white/5 shadow-inner text-text-dim/20">
          <Receipt size={32} />
        </div>
        <h1 className="text-2xl font-bold text-white">Invoice not found</h1>
        <Button onClick={() => navigate('/invoices')} variant="outline">Back to Invoices</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pt-10 relative z-10">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/invoices')}
            className="w-10 h-10 flex items-center justify-center bg-bg-card/40 border border-white/5 rounded-xl text-primary hover:bg-white/5 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">Invoice Detail</h1>
            <p className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">
              {invoice.invoiceNumber} • {new Date(invoice.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <Button 
          onClick={handleDownload}
          className="h-10 px-6 rounded-xl text-xs gap-2"
        >
          <Download size={16} />
          Download PDF
        </Button>
      </div>

      {/* Invoice Card */}
      <div className="bg-bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative z-10">
        {/* Decorative Top Bar */}
        <div className="h-2 bg-gradient-to-r from-primary to-primary/60 w-full" />
        
        <div className="p-10 space-y-12">
          {/* Company Branding */}
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white tracking-tighter">IGRA STUDIOS</h2>
              <div className="space-y-1">
                <p className="text-sm text-text-dim/60">https://igrastudios.com</p>
                <p className="text-sm text-text-dim/60">support@igrastudios.com</p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-4 py-1.5 rounded-full bg-success/10 text-success border border-success/20 text-[10px] font-bold uppercase tracking-widest">
                Paid
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 py-10 border-y border-white/5">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">
                <FileText size={12} className="text-primary" />
                Bill To
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-white">Customer Account</p>
                <p className="text-sm text-text-dim/60">User ID: {invoice.userId.slice(-8).toUpperCase()}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">
                <Hash size={12} className="text-primary" />
                Invoice Information
              </div>
              <div className="grid grid-cols-2 gap-y-3">
                <div className="text-[10px] font-bold text-text-dim/20 uppercase">Invoice #</div>
                <div className="text-sm font-bold text-white">{invoice.invoiceNumber}</div>
                
                <div className="text-[10px] font-bold text-text-dim/20 uppercase">Issue Date</div>
                <div className="text-sm font-bold text-white">{new Date(invoice.createdAt).toLocaleDateString()}</div>

                <div className="text-[10px] font-bold text-text-dim/20 uppercase">Currency</div>
                <div className="text-sm font-bold text-white">{invoice.currency}</div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">
              <Receipt size={12} className="text-primary" />
              Line Items
            </div>
            <div className="space-y-4">
              {invoice.lineItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl group hover:bg-white/[0.04] transition-all duration-300">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{item.description}</p>
                    <p className="text-[10px] text-text-dim/40 font-bold uppercase tracking-widest">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">${(item.totalCents / 100).toFixed(2)}</p>
                    <p className="text-[9px] text-text-dim/40 font-bold uppercase tracking-widest">${(item.unitPriceCents / 100).toFixed(2)} / unit</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="flex flex-col items-end gap-3 pt-6 border-t border-white/5">
            <div className="flex items-center gap-10">
              <span className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">Subtotal</span>
              <span className="text-lg font-bold text-white">${(invoice.subtotalCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-10">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Total Amount</span>
              <span className="text-3xl font-black text-primary">${(invoice.totalCents / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="p-8 bg-white/[0.02] border-t border-white/5 text-center">
          <p className="text-[10px] font-bold text-text-dim/20 uppercase tracking-[0.2em]">
            This is a computer-generated invoice and requires no signature.
          </p>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import * as creditApi from '../services/creditService'
import * as billingApi from '../services/billingService'
import type { CreditWallet, LedgerEntry } from '../services/creditService'
import type { CreditPack, Invoice } from '../services/billingService'
import {
  Wallet,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Star,
  Sparkles,
  Zap
} from 'lucide-react'
import { createLogger, serializeError } from '../services/logger'
import { cn } from '../components/Button'
import { toast } from 'sonner'
import Button from '../components/Button'

const logger = createLogger('Credits')

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  PACK_PURCHASE: { label: 'Credit purchase', color: 'text-success' },
  ORDER_CAPTURE: { label: 'Order payment', color: 'text-error' },
  REFUND: { label: 'Refund', color: 'text-success' },
  ADJUSTMENT: { label: 'Adjustment', color: 'text-info' },
}

export default function Credits() {
  const [wallet, setWallet] = useState<CreditWallet | null>(null)
  const [packs, setPacks] = useState<CreditPack[]>([])
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'packs' | 'history' | 'invoices'>('packs')

  useEffect(() => {
    loadData()
    checkPayPalRedirect()
  }, [])

  async function checkPayPalRedirect() {
    const params = new URLSearchParams(window.location.search)
    if (params.get('paypalFlow') === 'true') {
      const token = params.get('token')
      if (token) {
        try {
          setLoading(true)
          await billingApi.capturePurchase(token)
          window.history.replaceState({}, document.title, window.location.pathname)
          await loadData()
          toast.success('Credits purchased successfully!')
        } catch (err: any) {
          logger.error('credits.capture_failed', {
            paypalToken: token,
            error: serializeError(err),
          })
        } finally {
          setLoading(false)
        }
      }
    }
  }

  async function loadData() {
    setLoading(true)
    try {
      const [w, p, l, inv] = await Promise.all([
        creditApi.getWallet(),
        billingApi.getCreditPacks(),
        creditApi.getLedger(1, 20),
        billingApi.listInvoices(1, 10),
      ])
      setWallet(w)
      setPacks(p)
      setLedger(l.entries)
      setInvoices(inv.invoices)
    } catch (err) {
      logger.error('credits.load_failed', {
        error: serializeError(err),
      })
    } finally {
      setLoading(false)
    }
  }

  async function handlePurchase(packId: string) {
    setPurchasing(packId)
    try {
      const { approveLink } = await billingApi.createPurchase(packId)
      if (approveLink) {
        window.location.href = approveLink
      }
    } catch (err: any) {
      logger.error('credits.purchase_failed', {
        packId,
        error: serializeError(err),
      })
      toast.error(err?.response?.data?.error || 'Purchase failed')
      setPurchasing(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700 px-6 relative">
      {/* Background Textures */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-10 relative z-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Your <span className="text-primary">Wallet</span>
          </h1>
          <p className="text-text-dim/60 text-base">Manage your credits and view transaction history.</p>
        </div>
        
        <div className="bg-bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl px-8 py-4 flex items-center gap-6 shadow-xl">
           <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg">
              <Zap size={24} fill="currentColor" />
           </div>
           <div>
              <p className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">Available Credits</p>
              <div className="flex items-baseline gap-2">
                 <p className="text-3xl font-bold text-white">{wallet?.balance?.toLocaleString() || '0'}</p>
                 <span className="text-[10px] font-bold text-text-dim/20 uppercase tracking-widest">Cr</span>
              </div>
           </div>
        </div>
      </div>

      {/* Tab Control */}
      <div className="bg-bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-1.5 flex gap-2 w-fit relative z-10">
        {[
          { id: 'packs', label: 'Buy Credits', icon: Zap },
          { id: 'history', label: 'History', icon: TrendingUp },
          { id: 'invoices', label: 'Invoices', icon: Receipt },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300",
                activeTab === tab.id
                  ? "bg-white text-black shadow-lg"
                  : "bg-transparent text-text-dim/40 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon size={14} className={cn("transition-colors", activeTab === tab.id ? "text-primary" : "text-text-dim/40")} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="relative z-10 min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6 opacity-40">
            <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Loading wallet data...</p>
          </div>
        ) : activeTab === 'packs' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packs.map((pack, i) => (
              <div 
                key={pack.id} 
                className={cn(
                  "bg-bg-card/40 backdrop-blur-xl border rounded-2xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 shadow-xl group/pack relative",
                  pack.popular ? "border-primary/40 ring-1 ring-primary/20" : "border-white/5"
                )}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {pack.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
                    Most Popular
                  </div>
                )}
                
                <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center mb-8 group-hover/pack:bg-primary group-hover/pack:text-white transition-all duration-300 border border-white/5 shadow-inner">
                  {pack.id === 'starter' && <Zap size={28} />}
                  {pack.id === 'professional' && <Sparkles size={28} />}
                  {pack.id === 'enterprise' && <Star size={28} />}
                </div>

                <div className="space-y-1 mb-8">
                   <h3 className="text-2xl font-bold text-white group-hover/pack:text-primary transition-colors">{pack.name}</h3>
                   <p className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">{pack.description}</p>
                </div>
                
                <div className="mb-10">
                  <div className="text-5xl font-bold text-white tracking-tight mb-2">
                    {pack.credits.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-text-dim/20 uppercase tracking-widest">Credits included</div>
                </div>

                <div className="mt-auto pt-8 border-t border-white/5 flex flex-col items-center gap-8">
                   <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">${(pack.priceCents / 100).toFixed(0)}</span>
                      <span className="text-[10px] font-bold text-text-dim/20 uppercase tracking-widest">{pack.pricePerCredit}/cr</span>
                   </div>
                   
                   <Button
                    fullWidth
                    variant={pack.popular ? "primary" : "outline"}
                    onClick={() => handlePurchase(pack.id)}
                    disabled={purchasing !== null}
                    className="h-12 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg"
                  >
                    {purchasing === pack.id ? 'Loading...' : 'Buy Pack'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'history' ? (
          <div className="bg-bg-card/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/5 shadow-xl">
            {ledger.length === 0 ? (
              <div className="py-20 text-center opacity-20 flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center">
                   <TrendingUp size={40} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest">No transaction history</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {ledger.map((entry) => {
                  const info = REASON_LABELS[entry.reason] || { label: entry.reason, color: 'text-text-dim' }
                  const isPositive = entry.delta > 0
                  return (
                    <div key={entry._id} className="flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-white/[0.03] transition-all duration-300 group/entry">
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover/entry:scale-105",
                          isPositive ? "bg-success/10 border-success/20 text-success" : "bg-error/10 border-error/20 text-error"
                        )}>
                          {isPositive ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                        </div>
                        <div className="space-y-1">
                          <div className="text-lg font-bold text-white group-hover/entry:text-primary transition-colors">{info.label}</div>
                          <div className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">
                            {new Date(entry.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right mt-4 md:mt-0 space-y-1">
                        <div className={cn("text-3xl font-bold tracking-tight", info.color)}>
                          {isPositive ? '+' : ''}{entry.delta}
                        </div>
                        <div className="text-[9px] font-bold text-text-dim/10 uppercase tracking-widest">Balance: {entry.balanceAfter} cr</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-bg-card/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/5 shadow-xl">
            {invoices.length === 0 ? (
              <div className="py-20 text-center opacity-20 flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center">
                   <Receipt size={40} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest">No invoices found</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {invoices.map((inv) => (
                  <div key={inv._id} className="flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-white/[0.03] transition-all duration-300 group/inv cursor-pointer">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-text-dim/20 border border-white/5 group-hover/inv:text-primary group-hover/inv:border-primary/20 group-hover/inv:bg-primary/5 transition-all duration-300 shadow-lg">
                          <Receipt size={24} />
                       </div>
                       <div className="space-y-1">
                          <div className="text-lg font-bold text-white group-hover/inv:text-primary transition-colors">{inv.invoiceNumber}</div>
                          <div className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">
                             {new Date(inv.createdAt).toLocaleDateString()}
                          </div>
                       </div>
                    </div>
                    <div className="text-right mt-4 md:mt-0 space-y-1">
                       <div className="text-3xl font-bold text-white tracking-tight">
                          ${(inv.totalCents / 100).toFixed(2)}
                       </div>
                       <div className="text-[9px] font-bold text-text-dim/20 uppercase tracking-widest">{inv.currency}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

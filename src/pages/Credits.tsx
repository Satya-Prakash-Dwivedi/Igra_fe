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

const logger = createLogger('Credits')

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  PACK_PURCHASE: { label: 'Credit Purchase', color: 'text-emerald-400' },
  ORDER_CAPTURE: { label: 'Order Payment', color: 'text-rose-400' },
  REFUND: { label: 'Refund', color: 'text-emerald-400' },
  ADJUSTMENT: { label: 'Adjustment', color: 'text-blue-400' },
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
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-200 px-4 relative">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-dark/20 backdrop-blur-sm transition-opacity duration-300">
           <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {/* Header & Balance Card */}
      <div className="pt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">
            Resource <span className="text-primary italic">Pool</span>
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Manage your digital assets and billing history
          </p>
        </div>

        <div className="premium-card rounded-3xl p-8 border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
               <Wallet size={24} />
            </div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Available Balance</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-white tracking-tighter italic">
              {wallet?.balance.toLocaleString() || 0}
            </span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Credits</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white/[0.02] backdrop-blur-md rounded-2xl p-2 border border-white/5 shadow-inner">
        {[
          { key: 'packs' as const, label: 'Add Credits', icon: CreditCard },
          { key: 'history' as const, label: 'Transactions', icon: TrendingUp },
          { key: 'invoices' as const, label: 'Receipts', icon: Receipt },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex-1 justify-center transition-[background-color,color,box-shadow] duration-200 group transform-gpu ${
              activeTab === key 
                ? 'bg-white text-black shadow-lg' 
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon size={14} className={activeTab === key ? "text-black" : "text-gray-600 group-hover:text-primary transition-colors"} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'packs' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {packs.map((pack) => (
              <div
                key={pack.id}
                className={cn(
                  "premium-card rounded-3xl p-8 group relative flex flex-col items-center text-center border-white/5 hover:border-primary/30 transition-all",
                  pack.popular && "border-primary/40 ring-1 ring-primary/20 scale-105 z-10 bg-primary/[0.02]"
                )}
              >
                {pack.popular && (
                  <div className="absolute -top-4 px-4 py-1.5 bg-primary rounded-full text-[10px] font-black text-white flex items-center gap-2 shadow-xl animate-pulse">
                    <Star size={12} />
                    MOST POPULAR
                  </div>
                )}
                
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-200">
                  {pack.id === 'starter' && <Zap size={32} />}
                  {pack.id === 'professional' && <Sparkles size={32} />}
                  {pack.id === 'enterprise' && <Star size={32} />}
                </div>

                <h3 className="text-xl font-bold text-white tracking-tight mb-1 uppercase">{pack.name}</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">{pack.description}</p>
                
                <div className="mb-8">
                  <div className="text-5xl font-black text-white tracking-tighter italic mb-1">
                    {pack.credits.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] opacity-60">Credits Included</div>
                </div>

                <div className="mt-auto w-full pt-8 border-t border-white/5 flex flex-col items-center gap-6">
                   <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white italic">${(pack.priceCents / 100).toFixed(0)}</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{pack.pricePerCredit}/cr</span>
                   </div>
                   
                   <button
                    onClick={() => handlePurchase(pack.id)}
                    disabled={purchasing !== null}
                    className={cn(
                      "w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-95",
                      pack.popular 
                        ? "bg-primary text-white shadow-xl shadow-primary/20 hover:brightness-110" 
                        : "bg-white text-black hover:bg-gray-200"
                    )}
                  >
                    {purchasing === pack.id ? 'Processing...' : 'Initiate Buy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="premium-card rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
            {ledger.length === 0 ? (
              <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                <TrendingUp size={40} />
                <p className="text-[10px] font-black uppercase tracking-widest">No active records</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {ledger.map((entry) => {
                  const info = REASON_LABELS[entry.reason] || { label: entry.reason, color: 'text-gray-400' }
                  const isPositive = entry.delta > 0
                  return (
                    <div key={entry._id} className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center border",
                          isPositive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        )}>
                          {isPositive ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white tracking-tight uppercase">{info.label}</div>
                          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest font-mono">
                            {new Date(entry.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn("text-xl font-black italic tracking-tighter", info.color)}>
                          {isPositive ? '+' : ''}{entry.delta}
                        </div>
                        <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Pool: {entry.balanceAfter}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="premium-card rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
            {invoices.length === 0 ? (
              <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                <Receipt size={40} />
                <p className="text-[10px] font-black uppercase tracking-widest">No active records</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {invoices.map((inv) => (
                  <div key={inv._id} className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 border border-white/5 group-hover:text-primary group-hover:border-primary/20 transition-all">
                          <Receipt size={18} />
                       </div>
                       <div>
                          <div className="text-sm font-bold text-white tracking-tight uppercase group-hover:text-primary transition-colors">{inv.invoiceNumber}</div>
                          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest font-mono">
                             {new Date(inv.createdAt).toLocaleDateString()}
                          </div>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="text-xl font-black text-white italic tracking-tighter">
                          ${(inv.totalCents / 100).toFixed(2)}
                       </div>
                       <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{inv.currency}</div>
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

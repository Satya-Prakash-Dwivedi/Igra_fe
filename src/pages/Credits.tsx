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
  Zap,
  Coins,
  X,
  ShieldCheck
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { createLogger, serializeError } from '../services/logger'
import { cn } from '../components/Button'
import { toast } from 'sonner'
import Button from '../components/Button'
import { useAuth } from '../hooks/useAuth'

const logger = createLogger('Credits')

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  PACK_PURCHASE: { label: 'Credit purchase', color: 'text-success' },
  ORDER_CAPTURE: { label: 'Order payment', color: 'text-error' },
  REFUND: { label: 'Refund', color: 'text-success' },
  ADJUSTMENT: { label: 'Adjustment', color: 'text-info' },
}

export default function Credits() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [wallet, setWallet] = useState<CreditWallet | null>(null)
  const [packs, setPacks] = useState<CreditPack[]>([])
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'packs' | 'history' | 'invoices'>('packs')
  const [customAmount, setCustomAmount] = useState<string>('5')
  const [selectedPack, setSelectedPack] = useState<{ id: string; amount?: number; name: string; priceCents: number } | null>(null)

  useEffect(() => {
    loadData()
    checkPayPalRedirect()
    // Preload Razorpay Checkout script
    if (!document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      document.body.appendChild(script)
    }
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

  function handlePurchaseClick(packId: string) {
    const amount = packId === 'custom' ? parseFloat(customAmount) : undefined
    if (packId === 'custom' && (!amount || amount < 5)) {
      toast.error('Minimum purchase is $5')
      return
    }

    let packName = 'Custom'
    let priceCents = amount ? Math.round(amount * 100) : 0

    if (packId !== 'custom') {
      const pack = packs.find(p => p.id === packId)
      if (pack) {
        packName = pack.name
        priceCents = pack.priceCents
      }
    }

    setSelectedPack({ id: packId, amount, name: packName, priceCents })
  }

  async function executeCheckout(provider: 'paypal' | 'razorpay') {
    if (!selectedPack) return
    setPurchasing(provider)
    try {
      let targetCurrency: string | undefined = undefined;
      
      // If Razorpay, detect if user is in India to show UPI/NetBanking
      if (provider === 'razorpay') {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timeZone.includes('Kolkata') || timeZone.includes('Calcutta') || timeZone.includes('Asia/Colombo') || timeZone.includes('Asia/Dhaka')) {
            targetCurrency = 'INR';
        } else {
            targetCurrency = 'USD';
        }
      }

      const { payment, approveLink, razorpayOrderId, keyId, amount, currency } = await billingApi.createPurchase(
        selectedPack.id,
        selectedPack.amount,
        provider,
        targetCurrency
      )

      if (provider === 'paypal' && approveLink) {
        window.location.href = approveLink
        return
      }

      if (provider === 'razorpay' && razorpayOrderId) {
        const rzpKey = keyId || import.meta.env.VITE_RAZORPAY_KEY_ID
        if (!rzpKey || !(window as any).Razorpay) {
          toast.error('Razorpay gateway is still loading or not configured')
          setPurchasing(null)
          return
        }

        const options = {
          key: rzpKey,
          amount: amount || payment.amountCents,
          currency: currency || 'USD',
          name: 'Igra Studios',
          description: `${selectedPack.name} Credit Pack`,
          order_id: razorpayOrderId,
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          theme: {
            color: '#6366f1',
          },
          handler: async function (response: any) {
            try {
              setLoading(true)
              setSelectedPack(null)
              await billingApi.capturePurchase(payment._id, {
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              })
              await loadData()
              toast.success('Credits purchased successfully via Razorpay!')
            } catch (err: any) {
              logger.error('credits.razorpay_capture_failed', { error: serializeError(err) })
              toast.error(err?.response?.data?.error || 'Verification failed')
            } finally {
              setLoading(false)
            }
          },
          modal: {
            ondismiss: function () {
              setPurchasing(null)
            },
          },
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.open()
      }
    } catch (err: any) {
      logger.error('credits.checkout_failed', { provider, error: serializeError(err) })
      toast.error(err?.response?.data?.error || 'Checkout failed')
      setPurchasing(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 pb-16 md:pb-20 animate-in fade-in duration-700 px-4 md:px-6 relative">
      {/* Background Textures */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 pt-6 sm:pt-10 relative z-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Your <span className="text-primary">Wallet</span>
          </h1>
          <p className="text-text-dim/60 text-base">Manage your credits and view transaction history.</p>
        </div>
        
        <div className="bg-bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl px-4 sm:px-8 py-4 flex flex-row items-center justify-between gap-4 shadow-xl w-full md:w-auto text-left">
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
      <div className="bg-bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-1.5 flex overflow-x-auto no-scrollbar gap-2 w-full sm:w-fit max-w-full relative z-10 pb-2">
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
                "flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 whitespace-nowrap flex-shrink-0",
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
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
                    onClick={() => handlePurchaseClick(pack.id)}
                    disabled={purchasing !== null}
                    className="h-12 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg"
                  >
                    {purchasing === pack.id ? 'Loading...' : 'Buy Pack'}
                  </Button>
                </div>
              </div>
            ))}

            {/* Custom Pack Card */}
            <div 
              className={cn(
                "bg-bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 shadow-xl group/pack relative"
              )}
              style={{ animationDelay: `${packs.length * 100}ms` }}
            >
              <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center mb-8 group-hover/pack:bg-primary group-hover/pack:text-white transition-all duration-300 border border-white/5 shadow-inner">
                <Coins size={28} />
              </div>

              <div className="space-y-1 mb-8">
                 <h3 className="text-2xl font-bold text-white group-hover/pack:text-primary transition-colors">Custom Pack</h3>
                 <p className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">Buy exactly what you need</p>
              </div>
              
              <div className="mb-10 space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-white/20">$</span>
                  <input 
                    type="number"
                    min="5"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-10 pr-4 text-2xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="0"
                  />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white tracking-tight">
                    {Math.floor(parseFloat(customAmount) || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-text-dim/20 uppercase tracking-widest">Credits included</div>
                </div>
              </div>

              <div className="mt-auto pt-8 border-t border-white/5 flex flex-col items-center gap-8">
                 <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">${parseFloat(customAmount || '0').toFixed(0)}</span>
                    <span className="text-[10px] font-bold text-text-dim/20 uppercase tracking-widest">Rate: $1 / Credit</span>
                 </div>
                 
                 <Button
                  fullWidth
                  variant="outline"
                  onClick={() => handlePurchaseClick('custom')}
                  disabled={purchasing !== null}
                  className="h-12 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-primary hover:text-white hover:border-primary transition-all"
                >
                  {purchasing === 'custom' ? 'Loading...' : 'Buy Credits'}
                </Button>
              </div>
            </div>
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
                    <div key={entry._id} className="flex flex-row items-center justify-between p-4 sm:p-6 hover:bg-white/[0.03] transition-all duration-300 group/entry">
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover/entry:scale-105",
                          isPositive ? "bg-success/10 border-success/20 text-success" : "bg-error/10 border-error/20 text-error"
                        )}>
                          {isPositive ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                        </div>
                        <div className="space-y-0.5 sm:space-y-1">
                          <div className="text-lg font-bold text-white group-hover/entry:text-primary transition-colors">{info.label}</div>
                          <div className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">
                            {new Date(entry.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right mt-0 space-y-0.5 sm:space-y-1">
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
                  <div 
                    key={inv._id} 
                    onClick={() => navigate(`/invoices/${inv._id}`)}
                    className="flex flex-row items-center justify-between p-4 sm:p-6 hover:bg-white/[0.03] transition-all duration-300 group/inv cursor-pointer"
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                       <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-text-dim/20 border border-white/5 group-hover/inv:text-primary group-hover/inv:border-primary/20 group-hover/inv:bg-primary/5 transition-all duration-300 shadow-lg">
                          <Receipt size={24} />
                       </div>
                       <div className="space-y-0.5 sm:space-y-1">
                          <div className="text-lg font-bold text-white group-hover/inv:text-primary transition-colors">{inv.invoiceNumber}</div>
                          <div className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">
                             {new Date(inv.createdAt).toLocaleDateString()}
                          </div>
                       </div>
                    </div>
                    <div className="text-right mt-0 space-y-0.5 sm:space-y-1">
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

        {/* Payment Gateway Selection Modal */}
        {selectedPack && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-bg-card border border-white/10 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
              <button
                onClick={() => { if (!purchasing) setSelectedPack(null) }}
                className="absolute top-6 right-6 text-text-dim hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="space-y-2 text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
                  <ShieldCheck size={12} /> Secure Checkout
                </div>
                <h3 className="text-2xl font-bold text-white">Choose Gateway</h3>
                <p className="text-xs text-text-dim/80">
                  You are purchasing the <span className="text-white font-bold">{selectedPack.name} Pack</span> for{' '}
                  <span className="text-primary font-bold">${(selectedPack.priceCents / 100).toFixed(2)} USD</span>.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => executeCheckout('paypal')}
                  disabled={purchasing !== null}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3.5 text-left">
                    <div className="w-10 h-10 rounded-xl bg-[#003087]/20 border border-[#003087]/40 flex items-center justify-center text-[#0079C1]">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">PayPal</div>
                      <div className="text-[10px] text-text-dim/60 font-semibold">Pay via PayPal Account or Cards</div>
                    </div>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-text-dim/40 group-hover:text-white transition-colors">
                    {purchasing === 'paypal' ? 'Loading...' : 'Select'}
                  </div>
                </button>

                <button
                  onClick={() => executeCheckout('razorpay')}
                  disabled={purchasing !== null}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3.5 text-left">
                    <div className="w-10 h-10 rounded-xl bg-[#0c2340]/40 border border-[#3395ff]/40 flex items-center justify-center text-[#3395ff]">
                      <Zap size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">Razorpay</div>
                      <div className="text-[10px] text-text-dim/60 font-semibold">Cards, UPI, NetBanking, Wallets</div>
                    </div>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-text-dim/40 group-hover:text-white transition-colors">
                    {purchasing === 'razorpay' ? 'Loading...' : 'Select'}
                  </div>
                </button>
              </div>

              <p className="text-[10px] text-text-dim/40 text-center font-medium">
                By continuing, you agree to our terms of service and billing policies.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

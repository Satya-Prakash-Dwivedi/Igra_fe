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
} from 'lucide-react'
import { createLogger, serializeError } from '../services/logger'

const logger = createLogger('Credits')

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  PACK_PURCHASE: { label: 'Credit Purchase', color: 'text-green-400' },
  ORDER_CAPTURE: { label: 'Order Payment', color: 'text-red-400' },
  REFUND: { label: 'Refund', color: 'text-green-400' },
  ADJUSTMENT: { label: 'Adjustment', color: 'text-blue-400' },
}

export default function Credits() {
  const [wallet, setWallet] = useState<CreditWallet | null>(null)
  const [packs, setPacks] = useState<CreditPack[]>([])
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
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
          alert('Credits purchased successfully via PayPal!')
        } catch (err: any) {
          logger.error('credits.capture_failed', {
            paypalToken: token,
            error: serializeError(err),
          })
          alert('Failed to capture payment or already processed.')
        } finally {
          setLoading(false)
        }
      }
    } else if (params.get('paypalCancel') === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname)
      alert('PayPal checkout was cancelled.')
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
      if (!new URLSearchParams(window.location.search).get('paypalFlow')) {
        setLoading(false)
      }
    }
  }

  async function handlePurchase(packId: string) {
    setPurchasing(packId)
    try {
      const { approveLink } = await billingApi.createPurchase(packId)
      if (approveLink) {
        window.location.href = approveLink
      } else {
        throw new Error('No approve link from PayPal')
      }
    } catch (err: any) {
      logger.error('credits.purchase_failed', {
        packId,
        error: serializeError(err),
      })
      alert(err?.response?.data?.error || err.message || 'Purchase failed')
      setPurchasing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Credits</h1>
        <p className="text-gray-400 mt-1">Manage your credit balance and purchases</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent rounded-2xl border border-primary/20 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
            <Wallet size={20} className="text-primary" />
          </div>
          <span className="text-gray-400 text-sm font-medium">Available Balance</span>
        </div>
        <div className="text-4xl font-bold text-white">{wallet?.balance.toLocaleString() || 0}</div>
        <div className="text-sm text-gray-400 mt-1">credits</div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-card rounded-lg p-1 border border-border-subtle">
        {[
          { key: 'packs' as const, label: 'Buy Credits', icon: CreditCard },
          { key: 'history' as const, label: 'Transaction History', icon: TrendingUp },
          { key: 'invoices' as const, label: 'Invoices', icon: Receipt },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium flex-1 justify-center transition-colors ${
              activeTab === key ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'packs' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className={`bg-bg-card rounded-xl border p-6 relative ${
                pack.popular ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border-subtle'
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary rounded-full text-xs font-bold text-white flex items-center gap-1">
                  <Star size={10} />
                  MOST POPULAR
                </div>
              )}
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  {pack.id === 'starter' && <Zap size={24} className="text-primary" />}
                  {pack.id === 'professional' && <Sparkles size={24} className="text-primary" />}
                  {pack.id === 'enterprise' && <Star size={24} className="text-primary" />}
                </div>
                <h3 className="text-lg font-bold text-white">{pack.name}</h3>
                <div className="text-3xl font-bold text-white mt-2">
                  {pack.credits.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">credits</div>
                <div className="text-2xl font-bold text-primary mt-3">
                  ${(pack.priceCents / 100).toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">{pack.pricePerCredit}/credit</div>
                <p className="text-gray-400 text-sm mt-3">{pack.description}</p>
                <button
                  onClick={() => handlePurchase(pack.id)}
                  disabled={purchasing !== null}
                  className={`w-full mt-4 py-2.5 rounded-lg font-medium transition-colors ${
                    pack.popular
                      ? 'bg-primary text-white hover:bg-primary-hover'
                      : 'bg-bg-dark text-white hover:bg-gray-700'
                  } disabled:opacity-50`}
                >
                  {purchasing === pack.id ? 'Processing...' : 'Buy Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-bg-card rounded-xl border border-border-subtle">
          {ledger.length === 0 ? (
            <div className="text-center text-gray-500 p-12">
              <TrendingUp size={32} className="mx-auto mb-2 opacity-50" />
              <p>No transactions yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {ledger.map((entry) => {
                const info = REASON_LABELS[entry.reason] || {
                  label: entry.reason,
                  color: 'text-gray-400',
                }
                const isPositive = entry.delta > 0
                return (
                  <div key={entry._id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPositive ? 'bg-green-500/10' : 'bg-red-500/10'}`}
                      >
                        {isPositive ? (
                          <ArrowUpRight size={16} className="text-green-400" />
                        ) : (
                          <ArrowDownRight size={16} className="text-red-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{info.label}</div>
                        <div className="text-gray-500 text-xs">
                          {new Date(entry.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${info.color}`}>
                        {isPositive ? '+' : ''}
                        {entry.delta} credits
                      </div>
                      <div className="text-gray-500 text-xs">Balance: {entry.balanceAfter}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="bg-bg-card rounded-xl border border-border-subtle">
          {invoices.length === 0 ? (
            <div className="text-center text-gray-500 p-12">
              <Receipt size={32} className="mx-auto mb-2 opacity-50" />
              <p>No invoices yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {invoices.map((inv) => {
                const paypalId = inv.paymentId?.paypalCaptureId || inv.paymentId?.paypalOrderId
                const link = paypalId ? `https://www.sandbox.paypal.com/myaccount/activities` : '#'

                return (
                  <a
                    key={inv._id}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 hover:bg-bg-dark transition-colors cursor-pointer group"
                    title={
                      paypalId ? `View PayPal Activities (${paypalId})` : 'No PayPal receipt linked'
                    }
                  >
                    <div>
                      <div className="text-white text-sm font-medium group-hover:text-primary transition-colors flex items-center gap-2">
                        {inv.invoiceNumber}
                        <ArrowUpRight
                          size={14}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                      <div className="text-gray-500 text-xs">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">
                        ${(inv.totalCents / 100).toFixed(2)}
                      </div>
                      <div className="text-gray-500 text-xs">{inv.currency}</div>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

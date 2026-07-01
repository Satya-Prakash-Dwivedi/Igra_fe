import api from './api'

// ─── Types ────────────────────────────────────────────────────
export interface CreditPack {
  id: string
  name: string
  credits: number
  priceCents: number
  pricePerCredit: string
  description: string
  popular: boolean
}

export interface Payment {
  _id: string
  userId: string
  provider?: string
  paypalOrderId?: string
  razorpayOrderId?: string
  amountCents: number
  creditsPurchased: number
  packId: string
  status: string
  createdAt: string
}

export interface Invoice {
  _id: string
  userId: string
  paymentId: {
    provider?: string
    paypalOrderId?: string
    paypalCaptureId?: string
    razorpayOrderId?: string
    razorpayPaymentId?: string
  }
  invoiceNumber: string
  lineItems: { description: string; quantity: number; unitPriceCents: number; totalCents: number }[]
  subtotalCents: number
  totalCents: number
  currency: string
  pdfStorageKey?: string
  createdAt: string
}

// ─── API Functions ────────────────────────────────────────────
function idempotencyHeaders() {
  return { 'X-Idempotency-Key': `${Date.now()}-${Math.random().toString(36).slice(2, 10)}` }
}

export async function getCreditPacks() {
  const res = await api.get('/billing/packs')
  return res.data.data as CreditPack[]
}

export async function createPurchase(
  packId: string,
  amountDollars?: number,
  provider: 'paypal' | 'razorpay' = 'paypal',
  targetCurrency?: string
) {
  const res = await api.post(
    '/billing/purchase',
    { packId, amountDollars, provider, targetCurrency },
    { headers: idempotencyHeaders() }
  )
  return res.data.data as {
    payment: Payment
    approveLink?: string
    razorpayOrderId?: string
    keyId?: string
    amount?: number
    currency?: string
  }
}

export async function capturePurchase(
  paymentIdOrOrderId: string,
  razorpayData?: { razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature: string }
) {
  const res = await api.post(`/billing/purchase/${paymentIdOrOrderId}/capture`, razorpayData)
  return res.data.data as Payment
}

export async function listInvoices(page = 1, limit = 20) {
  const res = await api.get('/billing/invoices', { params: { page, limit } })
  return res.data.data as { invoices: Invoice[]; total: number; page: number; limit: number }
}

export async function getInvoiceDetail(invoiceId: string) {
  const res = await api.get(`/billing/invoices/${invoiceId}`)
  return res.data.data as Invoice
}

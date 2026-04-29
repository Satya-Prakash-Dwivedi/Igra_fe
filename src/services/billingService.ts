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
  paypalOrderId: string
  amountCents: number
  creditsPurchased: number
  packId: string
  status: string
  createdAt: string
}

export interface Invoice {
  _id: string
  userId: string
  paymentId: { paypalOrderId?: string; paypalCaptureId?: string }
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

export async function createPurchase(packId: string, amountDollars?: number) {
  const res = await api.post('/billing/purchase', { packId, amountDollars }, { headers: idempotencyHeaders() })
  return res.data.data as { payment: Payment; approveLink: string }
}

export async function capturePurchase(paymentId: string) {
  const res = await api.post(`/billing/purchase/${paymentId}/capture`)
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

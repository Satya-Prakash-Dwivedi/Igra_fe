import api from './api'

// ─── Types ────────────────────────────────────────────────────
export interface CreditWallet {
  balance: number
  currency: string
}

export interface LedgerEntry {
  _id: string
  walletId: string
  delta: number
  reason: string
  refType: string
  refId: string
  balanceAfter: number
  createdAt: string
}

// ─── API Functions ────────────────────────────────────────────
export async function getWallet() {
  const res = await api.get('/credits/wallet')
  return res.data.data as CreditWallet
}

export async function getLedger(page = 1, limit = 20) {
  const res = await api.get('/credits/ledger', { params: { page, limit } })
  return res.data.data as { entries: LedgerEntry[]; total: number; page: number; limit: number }
}

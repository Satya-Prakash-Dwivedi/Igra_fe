import api from './api'
import type { AxiosResponse } from 'axios'

// ─── Types ────────────────────────────────────────────────────
export interface Order {
  _id: string
  orderNumber: string
  userId: string | { name: string; email: string; avatar: string }
  assignedTo?: string | { name: string; email: string; avatar: string }
  status: string
  idempotencyKey: string
  title: string
  totalCreditsQuoted: number
  totalCreditsCaptured: number
  submittedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
  itemCount?: number
}

export interface OrderItem {
  _id: string
  orderId: string
  kind: string
  params: Record<string, any>
  schemaVersion: number
  pricingSnapshot: {
    priceVersion: string
    inputs: Record<string, any>
    base: number
    modifiers: { label: string; delta: number }[]
    totalCredits: number
  }
  creditsQuoted: number
  status: string
  allowedRevisions: number
  usedRevisions: number
  dependsOnItemIds: string[]
  assets?: Array<{
    _id: string
    originalName: string
    mimeType: string
    sizeBytes: number
    role: string
  }>
  createdAt: string
  updatedAt: string
}

export interface OrderEvent {
  _id: string
  orderId: string
  type: string
  data: Record<string, any>
  actorId: string
  createdAt: string
}

export interface OrderDetail {
  order: Order
  items: OrderItem[]
  events: OrderEvent[]
}

// ─── API Functions ────────────────────────────────────────────
function idempotencyHeaders() {
  return { 'X-Idempotency-Key': `${Date.now()}-${Math.random().toString(36).slice(2, 10)}` }
}

export async function createOrder(title?: string) {
  const res = await api.post('/orders', { title }, { headers: idempotencyHeaders() })
  return res.data.data as Order
}

export async function listOrders(status?: string, page = 1, limit = 20) {
  const params: Record<string, any> = { page, limit }
  if (status) params.status = status
  const res = await api.get('/orders', { params })
  return res.data.data as { orders: Order[]; total: number; page: number; limit: number }
}

export async function getOrderDetail(orderId: string) {
  const res = await api.get(`/orders/${orderId}`)
  return res.data.data as OrderDetail
}

export async function addItem(
  orderId: string,
  kind: string,
  params: Record<string, any>,
  dependsOnItemIds?: string[],
  assetIds?: string[],
) {
  const res = await api.post(`/orders/${orderId}/items`, { kind, params, dependsOnItemIds, assetIds })
  return res.data.data as OrderItem
}

export async function removeItem(orderId: string, itemId: string) {
  const res = await api.delete(`/orders/${orderId}/items/${itemId}`)
  return res.data.data
}

export async function addAssetToItem(orderId: string, itemId: string, assetIds: string[]) {
  const res = await api.post(`/orders/${orderId}/items/${itemId}/assets`, { assetIds })
  return res.data.data as OrderItem
}

export async function submitOrder(orderId: string) {
  const res = await api.post(`/orders/${orderId}/submit`, {}, { headers: idempotencyHeaders() })
  return res.data.data as Order
}

export async function cancelOrder(orderId: string) {
  const res = await api.patch(`/orders/${orderId}/cancel`)
  return res.data.data as Order
}

export async function approveItem(orderId: string, itemId: string) {
  const res = await api.post(`/orders/${orderId}/items/${itemId}/approve`)
  return res.data.data as OrderItem
}

export async function requestRevision(orderId: string, itemId: string, notes?: string) {
  const res = await api.post(`/orders/${orderId}/items/${itemId}/revision`, { notes })
  return res.data.data as OrderItem
}

// ─── Messages ─────────────────────────────────────────────────
export interface Message {
  _id: string
  orderId: string
  senderId: { _id: string; name: string; email: string; avatar: string; role: string }
  senderRole: string
  content: string
  itemId?: string
  attachmentAssetIds: string[]
  isRead: boolean
  createdAt: string
}

export async function getMessages(orderId: string, page = 1, limit = 50) {
  const res = await api.get(`/orders/${orderId}/messages`, { params: { page, limit } })
  return res.data.data as { messages: Message[]; total: number }
}

export async function sendMessage(orderId: string, content: string, itemId?: string) {
  const res = await api.post(`/orders/${orderId}/messages`, { content, itemId })
  return res.data.data as Message
}

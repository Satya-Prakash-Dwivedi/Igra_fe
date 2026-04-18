import api from './api'

// ─── Shared Types ─────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'UNDER_REVIEW'
  | 'IN_PROGRESS'
  | 'FINALIZING'
  | 'AWAITING_APPROVAL'
  | 'COMPLETED'
  | 'CANCELLED'

export type OrderItemStatus =
  | 'PENDING_INPUT'
  | 'BLOCKED'
  | 'READY'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'APPROVED'
  | 'FAILED'
  | 'CANCELLED'

export type ReviewAction = 'ACCEPT' | 'REJECT' | 'REQUEST_INFO'

export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export type TicketCategory =
  | 'Order Problem'
  | 'Billing Issue'
  | 'Technical Issue'
  | 'Feature Request'
  | 'Other'

// ─── Admin Data Shapes ────────────────────────────────────────────────────────

export interface DashboardStats {
  totalOrders: number
  pendingReview: number
  inProgress: number
  completed: number
}

export interface AdminUser {
  _id: string
  name: string
  email: string
  avatar?: string
  role: string
  createdAt: string
  totalOrders?: number
}

export interface AdminOrder {
  _id: string
  orderNumber: string
  userId: AdminUser
  assignedTo: AdminUser | null
  title: string
  status: OrderStatus
  totalCreditsQuoted: number
  totalCreditsCaptured: number
  createdAt: string
}

export interface AdminOrderAsset {
  _id: string
  originalName: string
  mimeType: string
  sizeBytes: number
  role: string
}

export interface AdminOrderItem {
  _id: string
  kind: string
  status: OrderItemStatus
  creditsQuoted: number
  usedRevisions: number
  allowedRevisions: number
  params: Record<string, unknown>
  assets?: AdminOrderAsset[]
}

export interface AdminOrderEvent {
  _id?: string
  type: string
  data: Record<string, unknown>
  actorId: string
  createdAt: string
}

export interface AdminOrderDetailData {
  order: AdminOrder
  items: AdminOrderItem[]
  events: AdminOrderEvent[]
}

export interface AdminTicket {
  _id: string
  __t: string
  status: SupportStatus
  category: TicketCategory
  message: string
  attachmentAssetIds: string[]
  userId: AdminUser
  createdAt: string
}

export interface Message {
  _id: string
  orderId: string
  itemId?: string
  senderId: AdminUser
  content: string
  createdAt: string
}

export interface AdminBugReport {
  _id: string
  __t: string
  status: SupportStatus
  description: string
  screenshotAssetIds: string[]
  wantsFollowUp: boolean
  userId: AdminUser
  createdAt: string
}

// ─── Valid Item Transitions ──────────────────────────────────────────────────

export const ITEM_TRANSITIONS: Record<OrderItemStatus, OrderItemStatus[]> = {
  PENDING_INPUT: ['READY', 'BLOCKED', 'CANCELLED'],
  BLOCKED:       ['READY', 'CANCELLED'],
  READY:         ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS:   ['DELIVERED', 'FAILED', 'CANCELLED'],
  DELIVERED:     ['APPROVED', 'IN_PROGRESS'],
  APPROVED:      [],
  FAILED:        [],
  CANCELLED:     [],
}

// ─── Pagination Wrapper ────────────────────────────────────────────────────────

interface Paginated<T> {
  total: number
  page: number
  pages: number
  items: T[]
}

// ─── Service Methods ──────────────────────────────────────────────────────────

const adminService = {
  // Dashboard
  async getDashboard(): Promise<DashboardStats> {
    const { data } = await api.get<{ success: boolean; data: DashboardStats }>('/admin/dashboard')
    return data.data
  },

  // Orders
  async listOrders(params: { status?: string; assignedTo?: string; page?: number; limit?: number } = {}): Promise<Paginated<AdminOrder>> {
    const { data } = await api.get('/admin/orders', { params })
    const d = data.data
    return { total: d.total, page: d.page, pages: d.pages, items: d.orders }
  },

  async getOrderDetail(id: string): Promise<AdminOrderDetailData> {
    const { data } = await api.get(`/orders/${id}`)
    return data.data as AdminOrderDetailData
  },

  async reviewOrder(id: string, action: ReviewAction): Promise<AdminOrder> {
    const { data } = await api.patch(`/admin/orders/${id}/review`, { action })
    return data.data.order
  },

  async assignOrder(id: string, staffId: string): Promise<AdminOrder> {
    const { data } = await api.patch(`/admin/orders/${id}/assign`, { staffId })
    return data.data.order
  },

  async transitionItemStatus(oid: string, iid: string, status: OrderItemStatus): Promise<AdminOrderItem> {
    const { data } = await api.patch(`/admin/orders/${oid}/items/${iid}/status`, { status })
    return data.data.item
  },

  async deliverItem(oid: string, iid: string): Promise<AdminOrderItem> {
    const { data } = await api.post(`/admin/orders/${oid}/items/${iid}/deliver`)
    return data.data.item
  },

  async refundItem(oid: string, iid: string): Promise<void> {
    await api.post(`/admin/orders/${oid}/items/${iid}/refund`)
  },

  async addAssetToItem(oid: string, iid: string, assetIds: string[], role: string = 'INPUT'): Promise<AdminOrderItem> {
    const { data } = await api.post(`/admin/orders/${oid}/items/${iid}/assets`, { assetIds, role })
    return data.data.item
  },

  async removeAsset(oid: string, iid: string, assetId: string): Promise<void> {
    await api.delete(`/admin/orders/${oid}/items/${iid}/assets/${assetId}`)
  },

  // Messages
  async getMessages(orderId: string, page = 1, limit = 50) {
    const { data } = await api.get(`/orders/${orderId}/messages`, { params: { page, limit } })
    return data.data
  },

  async sendMessage(orderId: string, content: string, itemId?: string) {
    const { data } = await api.post(`/orders/${orderId}/messages`, { content, itemId })
    return data.data
  },

  // Staff & Users
  async listStaff(): Promise<AdminUser[]> {
    const { data } = await api.get('/admin/staff')
    return data.data.staff ?? data.data
  },

  async listUsers(params: { search?: string; page?: number; limit?: number } = {}) {
    const { data } = await api.get('/admin/users', { params })
    return data.data
  },

  async getUserDetail(userId: string) {
    const { data } = await api.get(`/admin/users/${userId}`)
    return data.data
  },

  async assignStaff(userId: string) {
    const { data } = await api.post(`/admin/staff/${userId}/assign`)
    return data.data.user
  },

  async removeStaff(userId: string) {
    const { data } = await api.post(`/admin/staff/${userId}/remove`)
    return data.data.user
  },

  // Support Tickets
  async listTickets(params: { status?: string; category?: string; page?: number; limit?: number } = {}): Promise<Paginated<AdminTicket>> {
    const { data } = await api.get('/admin/support/tickets', { params })
    const d = data.data
    return { total: d.total, page: d.page, pages: d.pages, items: d.tickets }
  },

  async updateTicketStatus(id: string, status: SupportStatus): Promise<AdminTicket> {
    const { data } = await api.patch(`/admin/support/tickets/${id}/status`, { status })
    return data.data.ticket
  },

  // Bug Reports
  async listBugReports(params: { status?: string; page?: number; limit?: number } = {}): Promise<Paginated<AdminBugReport>> {
    const { data } = await api.get('/admin/support/bugs', { params })
    const d = data.data
    return { total: d.total, page: d.page, pages: d.pages, items: d.bugReports }
  },

  async updateBugStatus(id: string, status: SupportStatus): Promise<AdminBugReport> {
    const { data } = await api.patch(`/admin/support/bugs/${id}/status`, { status })
    return data.data.bugReport
  },
}

export default adminService

import api from './api'

// ─── Types ──────────────────────────────────────────────────────────────────

export type SupportCategory =
  | 'Order Problem'
  | 'Billing Issue'
  | 'Technical Issue'
  | 'Feature Request'
  | 'Other'

export interface SupportTicket {
  _id: string
  userId: string
  category: SupportCategory
  message: string
  attachmentAssetIds: string[]
  status: 'open' | 'in_progress' | 'resolved'
  createdAt: string
}

export interface BugReport {
  _id: string
  userId: string
  description: string
  screenshotAssetIds: string[]
  wantsFollowUp: boolean
  status: 'open' | 'in_progress' | 'resolved'
  createdAt: string
}

export interface CreateTicketData {
  category: SupportCategory
  message: string
  attachmentAssetIds?: string[]
}

export interface CreateBugReportData {
  description: string
  screenshotAssetIds?: string[]
  wantsFollowUp: boolean
}

// ─── Service ─────────────────────────────────────────────────────────────────

const supportService = {
  async createTicket(payload: CreateTicketData): Promise<SupportTicket> {
    const { data } = await api.post<{ success: boolean; data: { ticket: SupportTicket } }>(
      '/support/tickets',
      payload
    )
    return data.data.ticket
  },

  async createBugReport(payload: CreateBugReportData): Promise<BugReport> {
    const { data } = await api.post<{ success: boolean; data: { bugReport: BugReport } }>(
      '/support/bugs',
      payload
    )
    return data.data.bugReport
  },

  async reportBug(payload: CreateBugReportData): Promise<BugReport> {
    return this.createBugReport(payload)
  },
}

export default supportService

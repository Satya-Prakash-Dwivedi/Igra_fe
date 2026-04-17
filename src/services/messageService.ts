import api from './api'

export interface Message {
  _id: string
  orderId?: string
  userId?: string
  isDirectMessage: boolean
  senderId: {
    _id: string
    name: string
    email: string
    avatar?: string
    role: string
  }
  senderRole: 'client' | 'admin' | 'staff'
  content: string
  attachmentAssetIds: string[]
  isRead: boolean
  readAt?: string
  createdAt: string
}

export interface DirectMessageThread {
  userId: string
  user: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  latestMessage: Message
  unreadCount: number
}

const messageService = {
  // Client Side DMs
  async getDirectMessages(params: { page?: number; limit?: number } = {}) {
    const { data } = await api.get('/direct-messages', { params })
    return data.data
  },

  async sendDirectMessage(payload: { content: string; attachmentAssetIds?: string[] }) {
    const { data } = await api.post('/direct-messages', payload)
    return data.data
  },

  // Admin Side DMs
  async listDirectMessageThreads() {
    const { data } = await api.get('/admin/messages/direct')
    return data.data as DirectMessageThread[]
  },

  async getDirectMessagesForUser(userId: string, params: { page?: number; limit?: number } = {}) {
    const { data } = await api.get(`/admin/messages/direct/${userId}`, { params })
    return data.data
  },

  async replyDirectMessage(userId: string, payload: { content: string; attachmentAssetIds?: string[] }) {
    const { data } = await api.post(`/admin/messages/direct/${userId}`, payload)
    return data.data
  }
}

export default messageService

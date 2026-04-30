import api from './api'

export type StudioNotification = {
  _id: string
  recipientId: string
  senderId: {
    _id: string
    name: string
    avatar?: string
  }
  type: 'MESSAGE' | 'ORDER_UPDATE' | 'TICKET_UPDATE'
  content: string
  orderId?: string
  messageId?: string
  isRead: boolean
  createdAt: string
}

export const notificationService = {
  async getNotifications(): Promise<StudioNotification[]> {
    const { data } = await api.get('/notifications')
    return data.data
  },

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`)
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all')
  }
}

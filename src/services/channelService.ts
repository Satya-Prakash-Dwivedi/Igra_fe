import api from './api'

// ─── Types ─────────────────────────────────────────────────────────────────

export type ChannelPace = 'Slow' | 'Normal' | 'Fast' | 'Super'
export type ChannelTone =
  | 'Funny'
  | 'Elegant'
  | 'Serious'
  | 'Casual'
  | 'Professional'
  | 'Informational'

export interface Channel {
  _id: string
  userId: string
  name: string
  channelUrl: string
  logo?: string
  brandColors: [string, string, string]
  pace: ChannelPace
  tone: ChannelTone
  description?: string
  createdAt: string
  updatedAt: string
}

export interface ChannelFormData {
  name: string
  channelUrl: string
  logo?: string
  brandColors: [string, string, string]
  pace: ChannelPace
  tone: ChannelTone
  description?: string
}

interface ChannelResponse {
  success: boolean
  data: { channel: Channel }
  message?: string
}

interface ChannelListResponse {
  success: boolean
  data: { channels: Channel[] }
}

// ─── Service ────────────────────────────────────────────────────────────────

const channelService = {
  async listChannels(): Promise<Channel[]> {
    const { data } = await api.get<ChannelListResponse>('/channels')
    return data.data.channels
  },

  async getChannel(id: string): Promise<Channel> {
    const { data } = await api.get<ChannelResponse>(`/channels/${id}`)
    return data.data.channel
  },

  async createChannel(payload: ChannelFormData): Promise<Channel> {
    const { data } = await api.post<ChannelResponse>('/channels', payload)
    return data.data.channel
  },

  async updateChannel(id: string, payload: Partial<ChannelFormData>): Promise<Channel> {
    const { data } = await api.patch<ChannelResponse>(`/channels/${id}`, payload)
    return data.data.channel
  },

  async deleteChannel(id: string): Promise<void> {
    await api.delete(`/channels/${id}`)
  },
}

export default channelService

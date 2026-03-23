import { useState, useEffect, useRef, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import { AuthContext } from '../context/AuthContext'
import * as orderApi from '../services/orderService'
import type { OrderDetail as OrderDetailType, Message } from '../services/orderService'
import {
  ArrowLeft,
  Send,
  CheckCircle,
  RotateCcw,
  Package,
  MessageSquare,
  Activity,
  ChevronDown,
  ChevronUp,
  FileText,
  UploadCloud,
  Loader2,
} from 'lucide-react'
import { createLogger, serializeError } from '../services/logger'

const logger = createLogger('OrderDetail')
import * as uploadApi from '../services/uploadService'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-500/20 text-gray-300',
  PENDING_INPUT: 'bg-yellow-500/20 text-yellow-300',
  BLOCKED: 'bg-orange-500/20 text-orange-300',
  READY: 'bg-blue-500/20 text-blue-300',
  UNDER_REVIEW: 'bg-blue-500/20 text-blue-300',
  IN_PROGRESS: 'bg-purple-500/20 text-purple-300',
  DELIVERED: 'bg-cyan-500/20 text-cyan-300',
  APPROVED: 'bg-green-500/20 text-green-300',
  COMPLETED: 'bg-green-500/20 text-green-300',
  FAILED: 'bg-red-500/20 text-red-300',
  CANCELLED: 'bg-red-500/20 text-red-300',
  FINALIZING: 'bg-indigo-500/20 text-indigo-300',
  AWAITING_APPROVAL: 'bg-amber-500/20 text-amber-300',
  PENDING_PAYMENT: 'bg-yellow-500/20 text-yellow-300',
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const auth = useContext(AuthContext)
  const [detail, setDetail] = useState<OrderDetailType | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState<'items' | 'chat' | 'timeline'>('items')
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [uploadingItem, setUploadingItem] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (id) {
      loadOrder()
      loadMessages()
      setupSocket()
    }
    return () => {
      socketRef.current?.disconnect()
    }
  }, [id])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function setupSocket() {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      withCredentials: true,
    })
    socket.on('connect', () => {
      socket.emit('join-order', id)
    })
    socket.on('new-message', (msg: Message) => {
      setMessages((prev) => [...prev, msg])
    })
    socketRef.current = socket
  }

  async function loadOrder() {
    setLoading(true)
    try {
      const data = await orderApi.getOrderDetail(id!)
      setDetail(data)
    } catch (err) {
      logger.error('order_detail.load_failed', {
        orderId: id,
        error: serializeError(err),
      })
    } finally {
      setLoading(false)
    }
  }

  async function loadMessages() {
    try {
      const data = await orderApi.getMessages(id!)
      setMessages(data.messages)
    } catch (err) {
      logger.error('order_detail.messages_load_failed', {
        orderId: id,
        error: serializeError(err),
      })
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return
    setSending(true)
    try {
      await orderApi.sendMessage(id!, newMessage.trim())
      setNewMessage('')
    } catch (err) {
      logger.error('order_detail.message_send_failed', {
        orderId: id,
        error: serializeError(err),
      })
    } finally {
      setSending(false)
    }
  }

  async function handleApproveItem(itemId: string) {
    try {
      await orderApi.approveItem(id!, itemId)
      loadOrder()
    } catch (err) {
      logger.error('order_detail.item_approve_failed', {
        orderId: id,
        itemId,
        error: serializeError(err),
      })
    }
  }

  async function handleRequestRevision(itemId: string) {
    const notes = prompt('Revision notes (optional):')
    try {
      await orderApi.requestRevision(id!, itemId, notes || undefined)
      loadOrder()
    } catch (err: any) {
      logger.warn('order_detail.item_revision_failed', {
        orderId: id,
        itemId,
        error: serializeError(err),
      })
      alert(err?.response?.data?.error || err.message)
    }
  }

  async function handleFileUpload(itemId: string, files: FileList | null) {
    if (!files || files.length === 0 || !id) return
    setUploadingItem(itemId)

    try {
      const assetIds: string[] = []
      for (const file of Array.from(files)) {
        const assetId = await uploadApi.uploadFile(file)
        assetIds.push(assetId)
      }
      if (assetIds.length > 0) {
        await orderApi.addAssetToItem(id, itemId, assetIds)
        await loadOrder()
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message)
    } finally {
      setUploadingItem(null)
    }
  }

  async function handleCancelOrder() {
    if (!confirm('Are you sure you want to cancel this order? Credits will be refunded.')) return
    try {
      await orderApi.cancelOrder(id!)
      loadOrder()
    } catch (err: any) {
      logger.warn('order_detail.cancel_failed', {
        orderId: id,
        error: serializeError(err),
      })
      alert(err?.response?.data?.error || err.message)
    }
  }

  if (loading || !detail) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const { order, items, events } = detail
  const canCancel = ['DRAFT', 'UNDER_REVIEW', 'IN_PROGRESS'].includes(order.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/orders')}
          className="p-2 hover:bg-bg-card rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{order.title || order.orderNumber}</h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-500/20 text-gray-300'}`}
            >
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-gray-400 mt-1">
            {order.orderNumber} · {items.length} items · {order.totalCreditsQuoted} credits
          </p>
        </div>
        {canCancel && (
          <button
            onClick={handleCancelOrder}
            className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            Cancel Order
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-card rounded-lg p-1 border border-border-subtle">
        {[
          { key: 'items' as const, label: 'Items', icon: Package, count: items.length },
          { key: 'chat' as const, label: 'Chat', icon: MessageSquare, count: messages.length },
          { key: 'timeline' as const, label: 'Timeline', icon: Activity, count: events.length },
        ].map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium flex-1 justify-center transition-colors ${
              activeTab === key ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon size={16} />
            {label}
            <span className="text-xs opacity-60">({count})</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'items' && (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-bg-card rounded-xl border border-border-subtle overflow-hidden"
            >
              <div
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedItem(expandedItem === item._id ? null : item._id)}
              >
                <div className="flex items-center gap-3">
                  <Package size={16} className="text-primary" />
                  <span className="text-white font-medium">{item.kind.replace(/_/g, ' ')}</span>
                  <span className="text-gray-500 text-sm">{item.creditsQuoted} credits</span>
                </div>
                <div className="flex items-center gap-3">
                  {item.status === 'DELIVERED' && (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleApproveItem(item._id)
                        }}
                        className="px-3 py-1 bg-green-500/20 text-green-300 rounded-lg text-xs font-medium hover:bg-green-500/30"
                      >
                        <CheckCircle size={12} className="inline mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRequestRevision(item._id)
                        }}
                        className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-lg text-xs font-medium hover:bg-amber-500/30"
                      >
                        <RotateCcw size={12} className="inline mr-1" />
                        Revision ({item.usedRevisions}/{item.allowedRevisions})
                      </button>
                    </div>
                  )}
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.status]}`}
                  >
                    {item.status.replace(/_/g, ' ')}
                  </span>
                  {expandedItem === item._id ? (
                    <ChevronUp size={16} className="text-gray-500" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-500" />
                  )}
                </div>
              </div>

              {expandedItem === item._id && (
                <div className="px-4 pb-4 border-t border-border-subtle pt-3 space-y-3">
                  {/* Pricing Breakdown */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Pricing Breakdown</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Base</span>
                        <span className="text-gray-300">{item.pricingSnapshot.base} credits</span>
                      </div>
                      {item.pricingSnapshot.modifiers.map((mod, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-400">{mod.label}</span>
                          <span className="text-gray-300">+{mod.delta} credits</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm pt-1 border-t border-border-subtle font-medium">
                        <span className="text-white">Total</span>
                        <span className="text-primary">
                          {item.pricingSnapshot.totalCredits} credits
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Parameters */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Parameters</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(item.params).map(([key, val]) => (
                        <div key={key} className="text-sm">
                          <span className="text-gray-500">{key}: </span>
                          <span className="text-gray-300">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Assets */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Assets</h4>

                    {item.assets && item.assets.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        {item.assets.map((asset: any) => (
                          <div
                            key={asset._id}
                            className="flex items-center gap-3 bg-bg-dark/50 border border-border-subtle p-2.5 rounded-lg"
                          >
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                              <FileText size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-200 truncate font-medium">
                                {asset.originalName}
                              </p>
                              <p className="text-[10px] text-gray-500 uppercase">
                                {(asset.sizeBytes / (1024 * 1024)).toFixed(2)} MB · {asset.role}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload New Asset Button */}
                    <label
                      className={`mt-2 flex items-center justify-center gap-2 border border-dashed border-border-subtle rounded-lg py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-bg-dark/50 transition cursor-pointer ${uploadingItem === item._id && 'opacity-50 pointer-events-none'}`}
                    >
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileUpload(item._id, e.target.files)}
                        disabled={uploadingItem === item._id}
                      />
                      {uploadingItem === item._id ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <UploadCloud size={16} /> Upload New Asset
                        </>
                      )}
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'chat' && (
        <div
          className="bg-bg-card rounded-xl border border-border-subtle flex flex-col"
          style={{ height: '500px' }}
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.senderId?._id === (auth?.user as any)?._id
                return (
                  <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                        isMine
                          ? 'bg-primary/20 text-white rounded-br-sm'
                          : 'bg-bg-dark text-gray-300 rounded-bl-sm'
                      }`}
                    >
                      {!isMine && (
                        <div className="text-xs text-primary font-medium mb-1">
                          {msg.senderId?.name || 'Unknown'}
                        </div>
                      )}
                      <p className="text-sm">{msg.content}</p>
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={chatEndRef} />
          </div>
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-border-subtle flex gap-2"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-bg-dark rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-4 py-2.5 bg-primary rounded-lg text-white disabled:opacity-50 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-bg-card rounded-xl border border-border-subtle p-4">
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Activity size={32} className="mx-auto mb-2 opacity-50" />
                <p>No events recorded yet.</p>
              </div>
            ) : (
              events.map((event, i) => (
                <div key={event._id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    {i < events.length - 1 && <div className="w-px h-full bg-border-subtle" />}
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">
                        {event.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {Object.keys(event.data).length > 0 && (
                      <div className="mt-2 space-y-1 bg-bg-dark/50 p-2.5 rounded-lg border border-border-subtle">
                        {Object.entries(event.data).map(([key, val]) => (
                          <div key={key} className="text-xs flex items-start gap-2">
                            <span className="text-gray-400 font-medium capitalize min-w-[100px]">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="text-gray-200">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

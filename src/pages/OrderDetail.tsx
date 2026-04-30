import { useState, useEffect, useRef, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import socketService from '../services/socketService'
import { AuthContext } from '../context/AuthContext'
import * as orderApi from '../services/orderService'
import type { OrderDetail as OrderDetailType, Message } from '../services/orderService'
import {
  ArrowLeft,
  Send,
  Package,
  MessageSquare,
  Activity,
  ChevronDown,
  UploadCloud,
  Loader2,
  Trash2,
  ExternalLink,
  Maximize2,
  Download,
  File as FileIcon,
  Check
} from 'lucide-react'
import Button, { cn } from '../components/Button'
import { createLogger, serializeError } from '../services/logger'
import { toast } from 'sonner'
import * as uploadApi from '../services/uploadService'
import ConfirmModal from '../components/modals/ConfirmModal'

const logger = createLogger('OrderDetail')

const STATUS_MAP: Record<string, { label: string, color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-white/5 text-text-dim border-white/5' },
  PENDING_INPUT: { label: 'Queued', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  BLOCKED: { label: 'Blocked', color: 'bg-error/10 text-error border-error/20' },
  READY: { label: 'Ready', color: 'bg-primary/10 text-primary border-primary/20' },
  UNDER_REVIEW: { label: 'Under review', color: 'bg-sky-400/10 text-sky-400 border-sky-400/20' },
  IN_PROGRESS: { label: 'In production', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  DELIVERED: { label: 'Delivered', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  APPROVED: { label: 'Approved', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  AWAITING_APPROVAL: { label: 'Awaiting approval', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  PENDING_PAYMENT: { label: 'Pending payment', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
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
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'primary' | 'error' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (id) {
      loadOrder()
      loadMessages()
      
      const socket = socketService.getSocket()
      
      const setupSocket = () => {
        socketService.joinOrder(id)
      }

      const handleNewMessage = (msg: Message) => {
        setMessages((prev) => {
          if (prev.find(m => m._id === msg._id)) return prev
          return [...prev, msg]
        })
      }

      socket.on('connect', setupSocket)
      socket.on('new-message', handleNewMessage)
      
      if (socket.connected) {
        setupSocket()
      }

      return () => {
        socket.off('connect', setupSocket)
        socket.off('new-message', handleNewMessage)
        socketService.leaveOrder(id)
      }
    }
  }, [id])
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadOrder() {
    setLoading(true)
    try {
      const data = await orderApi.getOrderDetail(id!)
      setDetail(data)
    } catch (err) {
      logger.error('order.load_failed', { orderId: id, error: serializeError(err) })
    } finally {
      setLoading(false)
    }
  }

  async function loadMessages() {
    try {
      const data = await orderApi.getMessages(id!)
      setMessages(data.messages)
    } catch (err) {
      logger.error('order.messages_failed', { orderId: id, error: serializeError(err) })
    }
  }

  async function handleConfirmAndPay() {
    if (!id || !detail) return
    setLoading(true)
    try {
      await orderApi.submitOrder(id)
      await loadOrder()
      toast.success('Order submitted successfully.')
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message
      if (msg.toLowerCase().includes('insufficient credits')) {
        if (confirm('Insufficient credits. Top up your wallet?')) {
          navigate('/credits')
        }
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
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
      logger.error('order.chat_failed', { error: serializeError(err) })
    } finally {
      setSending(false)
    }
  }

  async function handleApproveItem(itemId: string) {
    try {
      await orderApi.approveItem(id!, itemId)
      toast.success('Service approved.')
      loadOrder()
    } catch (err) {
      logger.error('order.item_approve_failed', { error: serializeError(err) })
    }
  }

  async function handleRequestRevision(itemId: string) {
    const notes = prompt('Please provide revision details:')
    if (notes === null) return;
    try {
      await orderApi.requestRevision(id!, itemId, notes || undefined)
      toast.info('Revision requested.')
      loadOrder()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message)
    }
  }

  async function handleFileUpload(itemId: string, files: FileList | null) {
    if (!files || files.length === 0 || !id) return
    setUploadingItem(itemId)
    try {
      const assetIds: string[] = []
      for (const file of Array.from(files)) {
        const { assetId } = await uploadApi.uploadFile(file)
        assetIds.push(assetId)
      }
      if (assetIds.length > 0) {
        await orderApi.addAssetToItem(id, itemId, assetIds)
        await loadOrder()
        toast.success('Files uploaded.')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message)
    } finally {
      setUploadingItem(null)
    }
  }

  async function handleCompleteReview() {
    setConfirmModal({
      isOpen: true,
      title: 'Complete Review',
      message: 'Are you done with the review? The production team will be notified to finalize and archive the order.',
      variant: 'primary',
      onConfirm: async () => {
        try {
          await orderApi.completeReview(id!)
          toast.success('Review marked as complete.')
          loadOrder()
          setConfirmModal((prev: any) => ({ ...prev, isOpen: false }))
        } catch (err: any) {
          toast.error(err?.response?.data?.error || err.message)
        }
      }
    })
  }

  async function handleCancelOrder() {
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order? Credits will be refunded to your wallet.',
      variant: 'error',
      onConfirm: async () => {
        try {
          await orderApi.cancelOrder(id!)
          toast.info('Order cancelled.')
          loadOrder()
          setConfirmModal((prev: any) => ({ ...prev, isOpen: false }))
        } catch (err: any) {
          toast.error(err?.response?.data?.error || err.message)
        }
      }
    })
  }

  async function handleRemoveAsset(itemId: string, assetId: string) {
    if (!confirm('Remove this asset?')) return
    try {
      await orderApi.removeAssetFromItem(id!, itemId, assetId)
      await loadOrder()
      toast.success('Asset removed.')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message)
    }
  }

  async function handleDownload(url: string, fileName: string) {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      logger.error('order.download_failed', { url, error: serializeError(err) })
      // Fallback to opening in new tab if fetch fails (e.g. CORS)
      window.open(url, '_blank')
    }
  }

  if (loading || !detail) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 animate-in fade-in duration-700">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">Loading order details...</p>
      </div>
    )
  }

  const { order, items, events } = detail
  const canCancel = ['DRAFT', 'UNDER_REVIEW', 'IN_PROGRESS'].includes(order.status)
  const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: 'bg-white/5 text-text-dim border-white/5' }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 px-6 animate-in fade-in duration-700 relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-10 relative z-10">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/orders')}
            className="w-10 h-10 flex items-center justify-center bg-bg-card/40 border border-white/5 rounded-xl text-primary hover:bg-white/5 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {order.title || `Order #${order.orderNumber.slice(-6)}`}
              </h1>
              <div className={cn(
                "px-3 py-1 rounded-full text-[9px] font-bold border flex items-center gap-2",
                statusInfo.color
              )}>
                <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                <span className="uppercase tracking-wider">{statusInfo.label}</span>
              </div>
            </div>
            <p className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">
              Order #{order.orderNumber} • {items.length} services • {order.totalCreditsQuoted} Credits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {order.status === 'DRAFT' && (
            <Button
              variant="primary"
              onClick={handleConfirmAndPay}
              className="h-10 px-6 rounded-xl text-xs"
            >
              Confirm & Pay
            </Button>
          )}
          {order.status === 'AWAITING_APPROVAL' && (
            <Button
              variant="primary"
              onClick={handleCompleteReview}
              className="h-10 px-6 rounded-xl text-xs"
            >
              Review Complete
              <Check size={14} className="ml-2" />
            </Button>
          )}
          {canCancel && (
            <button
              onClick={handleCancelOrder}
              className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-error/20 text-error hover:bg-error hover:text-white transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-bg-card/40 p-1 rounded-xl border border-white/5 relative z-10">
        {[
          { key: 'items' as const, label: 'Services', icon: Package },
          { key: 'chat' as const, label: 'Order Chat', icon: MessageSquare },
          { key: 'timeline' as const, label: 'History', icon: Activity },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
              activeTab === key ? "bg-white text-black shadow-lg" : "text-text-dim/40 hover:text-white hover:bg-white/5"
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="relative z-10">
        {activeTab === 'items' && (
          <div className="space-y-6">
            {items.map((item) => (
              <div key={item._id} className="bg-bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <div 
                  className="p-6 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedItem(expandedItem === item._id ? null : item._id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-dim/40">
                      <Package size={20} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-white uppercase tracking-tight">{item.kind.replace(/_/g, ' ')}</h3>
                      <p className="text-[9px] font-bold text-text-dim/40 uppercase tracking-widest">{item.creditsQuoted} Credits</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-bold border uppercase tracking-widest",
                      STATUS_MAP[item.status]?.color || "bg-white/5 text-text-dim border-white/5"
                    )}>
                      {STATUS_MAP[item.status]?.label || item.status}
                    </div>
                    <ChevronDown size={16} className={cn("text-text-dim/40 transition-transform", expandedItem === item._id && "rotate-180")} />
                  </div>
                </div>

                {expandedItem === item._id && (
                  <div className="p-6 pt-0 border-t border-white/5 bg-white/[0.01] animate-in slide-in-from-top-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-6">
                      <div className="space-y-8">
                        <div>
                          <h4 className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest mb-4">Configuration</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(item.params).map(([key, val]) => (
                              key !== 'showLinkInput' && (
                                <div key={key} className="p-3 bg-black/20 rounded-xl border border-white/5">
                                  <p className="text-[8px] text-text-dim/40 font-bold uppercase mb-1">{key}</p>
                                  <p className="text-sm text-white font-medium truncate">{String(val)}</p>
                                </div>
                              )
                            ))}
                          </div>
                        </div>

                        <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                          <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Pricing</h4>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold text-text-dim/40 uppercase">Total Credits</span>
                            <span className="text-2xl font-bold text-primary">{item.pricingSnapshot.totalCredits}</span>
                          </div>
                        </div>
                      </div>

                        <div className="space-y-6">
                          {/* Deliverables Section */}
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Deliverables</h4>
                            {((item.assets ?? []).filter(a => a.role === 'OUTPUT').length > 0 || (item.deliveryLinks?.length || 0) > 0) ? (
                              <div className="grid grid-cols-2 gap-4">
                                {(item.assets ?? []).filter(a => a.role === 'OUTPUT').map((asset: any) => (
                                  <div key={asset._id} className="group relative bg-primary/5 border border-primary/10 rounded-xl overflow-hidden p-3 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                      {asset.mimeType?.includes('image') ? <Maximize2 size={14} className="text-primary/40" /> : <FileIcon size={14} className="text-primary/40" />}
                                      <span className="text-[8px] font-bold text-primary uppercase tracking-widest">Studio Output</span>
                                    </div>
                                    <p className="text-[10px] text-white font-bold truncate">{asset.originalName}</p>
                                    <button 
                                      onClick={() => handleDownload(asset.url, asset.originalName)}
                                      className="text-[8px] text-primary font-bold uppercase tracking-widest hover:underline flex items-center gap-1 text-left"
                                    >
                                      <Download size={10} /> Download
                                    </button>
                                  </div>
                                ))}
                                {item.deliveryLinks?.map((link: string, idx: number) => (
                                  <div key={idx} className="group relative bg-primary/5 border border-primary/10 rounded-xl overflow-hidden p-3 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                      <ExternalLink size={14} className="text-primary/40" />
                                      <span className="text-[8px] font-bold text-primary uppercase tracking-widest">External Link</span>
                                    </div>
                                    <p className="text-[10px] text-white font-bold truncate">{link}</p>
                                    <a 
                                      href={link} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="text-[8px] text-primary font-bold uppercase tracking-widest hover:underline flex items-center gap-1 text-left"
                                    >
                                      <ExternalLink size={10} /> Open Link
                                    </a>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-text-dim/20 italic">No deliverables yet.</p>
                            )}
                          </div>

                          {/* Client Uploads Section */}
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">Your Uploads</h4>
                            {(item.assets ?? []).filter(a => a.role !== 'OUTPUT').length > 0 ? (
                              <div className="grid grid-cols-2 gap-4">
                                {(item.assets ?? []).filter(a => a.role !== 'OUTPUT').map((asset: any) => (
                                  <div key={asset._id} className="group relative bg-black/20 border border-white/5 rounded-xl overflow-hidden p-3 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                      {asset.mimeType?.includes('image') ? <Maximize2 size={14} className="text-primary/40" /> : <FileIcon size={14} className="text-text-dim/40" />}
                                      <button onClick={() => handleRemoveAsset(item._id, asset._id)} className="text-text-dim/20 hover:text-error transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                    <p className="text-[10px] text-white font-bold truncate">{asset.originalName}</p>
                                    <button 
                                      onClick={() => handleDownload(asset.url, asset.originalName)}
                                      className="text-[8px] text-primary font-bold uppercase tracking-widest hover:underline flex items-center gap-1 text-left"
                                    >
                                      <Download size={10} /> Download
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-text-dim/20 italic">No uploads.</p>
                            )}
                          </div>
                        </div>

                        <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/5 rounded-xl py-10 hover:border-primary/40 cursor-pointer transition-all">
                          <input type="file" multiple className="hidden" onChange={(e) => handleFileUpload(item._id, e.target.files)} disabled={uploadingItem === item._id} />
                          {uploadingItem === item._id ? <Loader2 size={24} className="animate-spin text-primary" /> : (
                            <>
                              <UploadCloud size={24} className="text-text-dim/40" />
                              <span className="text-[10px] font-bold text-text-dim/40 uppercase">Upload Files</span>
                            </>
                          )}
                        </label>
                      </div>

                    {item.status === 'DELIVERED' && (
                      <div className="mt-8 flex gap-3 border-t border-white/5 pt-6">
                        <Button onClick={() => handleApproveItem(item._id)} className="flex-1 h-10 rounded-lg text-[10px]">Approve Service</Button>
                        <Button variant="outline" onClick={() => handleRequestRevision(item._id)} className="flex-1 h-10 rounded-lg text-[10px]">Request Revision</Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-bg-card/40 backdrop-blur-xl rounded-2xl border border-white/5 flex flex-col h-[600px] overflow-hidden shadow-xl">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-20">
                  <MessageSquare size={40} className="mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">No messages yet</p>
                </div>
              ) : (
                messages.map((msg) => {
                  if (!msg) return null;
                  const senderId = msg.senderId?._id || msg.senderId;
                  const currentUserId = auth?.user?._id || (auth?.user as any)?.id;
                  const isMine = senderId === currentUserId;
                  return (
                    <div key={msg._id} className={cn("flex flex-col", isMine ? "items-end" : "items-start")}>
                      <div className={cn(
                        "px-4 py-2.5 max-w-[80%] text-sm font-medium rounded-2xl shadow-lg",
                        isMine ? "bg-primary text-white rounded-tr-none" : "bg-bg-dark border border-white/5 text-text-dim rounded-tl-none"
                      )}>
                        {msg.content}
                      </div>
                      <span className="text-[8px] font-bold text-text-dim/20 uppercase mt-1 px-1">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  )
                })
              )}
              <div ref={chatEndRef} />
            </div>
            
            <div className="p-4 bg-black/20 border-t border-white/5">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-bg-dark/40 border border-white/5 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-primary/40 transition-all"
                />
                <Button type="submit" disabled={!newMessage.trim() || sending} className="w-10 h-10 p-0 rounded-xl flex items-center justify-center">
                  <Send size={16} />
                </Button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-bg-card/40 backdrop-blur-xl rounded-2xl border border-white/5 p-8 shadow-xl">
            <div className="space-y-8 border-l border-white/5 ml-4 pl-8">
              {events.map((event) => (
                <div key={event._id} className="relative">
                  <div className="absolute -left-[41px] top-1 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(225,29,72,0.5)]" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white uppercase tracking-tight">{event.type.replace(/_/g, ' ')}</p>
                    <p className="text-[9px] font-bold text-text-dim/40 uppercase tracking-widest">
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          variant={confirmModal.variant}
          onConfirm={confirmModal.onConfirm}
          onClose={() => setConfirmModal((prev: any) => ({ ...prev, isOpen: false }))}
        />
      </div>
    </div>
  )
}

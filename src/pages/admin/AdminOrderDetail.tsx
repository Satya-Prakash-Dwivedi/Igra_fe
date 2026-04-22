import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  User as UserIcon,
  Clock,
  RefreshCw,
  ChevronDown,
  MessageSquare,
  Activity,
  Package,
  Send,
  UploadCloud,
  File as FileIcon,
  Video,
  Trash2,
  ExternalLink,
  Maximize2,
  X,
  Download,
} from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { AuthContext } from '../../context/AuthContext'
import adminService from '../../services/adminService'
import * as uploadApi from '../../services/uploadService'
import type {
  AdminOrderDetailData, AdminOrderItem, AdminOrderEvent,
  AdminUser, ReviewAction, OrderItemStatus, Message
} from '../../services/adminService'
import { ITEM_TRANSITIONS } from '../../services/adminService'
import StatusBadge from '../../components/admin/StatusBadge'
import Button from '../../components/Button'
import { cn } from '../../components/Button'
import { createLogger, serializeError } from '../../services/logger'

const logger = createLogger('AdminOrderDetail')

const Timeline: React.FC<{ events: AdminOrderEvent[] }> = ({ events }) => (
  <div className="relative border-l-2 border-white/5 pl-12 space-y-16">
    {events.map((event, i) => (
      <div key={i} className="relative group">
        <div className="absolute -left-[61px] top-0 w-6 h-6 rounded-full bg-bg-dark border-[6px] border-white/5 group-hover:border-primary transition-colors duration-200 z-10 shadow-2xl" />
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl font-black text-white italic tracking-tighter uppercase">{event.type.replace(/_/g, ' ')}</span>
            <span className="text-[10px] font-mono text-gray-600 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
              {new Date(event.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="h-[1px] w-12 bg-primary/20 mb-6" />
        </div>
        {event.data && Object.keys(event.data).length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white/[0.01] p-8 rounded-[2rem] border border-white/5 shadow-inner">
            {Object.entries(event.data).map(([key, val]) => (
              <div key={key} className="space-y-1">
                <span className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em] truncate block">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <p className="text-sm text-gray-300 font-bold">
                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    ))}
  </div>
)

const ItemCard: React.FC<{
  item: AdminOrderItem
  orderId: string
  isExpanded: boolean
  onToggle: () => void
  onUpdated: (updated: AdminOrderItem) => void
  onPreview: (asset: any) => void
}> = ({ item, orderId, isExpanded, onToggle, onUpdated, onPreview }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validTransitions = ITEM_TRANSITIONS[item.status] ?? []

  const handleTransition = async (status: OrderItemStatus) => {
    setIsLoading(true)
    setError(null)
    try {
      const updated = await adminService.transitionItemStatus(orderId, item._id, status)
      onUpdated(updated)
    } catch (err) {
      logger.error('admin_item.transition_failed', { error: serializeError(err) })
      setError('Action failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeliver = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const updated = await adminService.deliverItem(orderId, item._id)
      onUpdated(updated)
    } catch (err) {
      logger.error('admin_item.deliver_failed', { error: serializeError(err) })
      setError('Deliver failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefund = async () => {
    if (!confirm('Issue refund for this failed item?')) return
    setIsLoading(true)
    setError(null)
    try {
      await adminService.refundItem(orderId, item._id)
      setError(null)
    } catch (err) {
      logger.error('admin_item.refund_failed', { error: serializeError(err) })
      setError('Refund failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      const assetIds: string[] = []
      for (const file of Array.from(files)) {
        const assetId = await uploadApi.uploadFile(file)
        assetIds.push(assetId)
      }
      if (assetIds.length > 0) {
        const updated = await adminService.addAssetToItem(orderId, item._id, assetIds, 'OUTPUT')
        onUpdated(updated)
      }
    } catch (err) {
      logger.error('admin_item.upload_failed', { error: serializeError(err) })
      setError('Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAsset = async (assetId: string) => {
    if (!confirm('Remove this asset?')) return
    try {
      await adminService.removeAsset(orderId, item._id, assetId)
      const updated = { ...item, assets: (item.assets ?? []).filter(a => a._id !== assetId) }
      onUpdated(updated)
    } catch (err) {
      logger.error('admin_item.asset_remove_failed', { error: serializeError(err) })
      setError('Remove failed.')
    }
  }

  return (
    <div className="premium-card rounded-[2.5rem] group">
      <div className="p-8 flex items-center justify-between cursor-pointer relative z-10" onClick={onToggle}>
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-gray-400 border border-white/5 shadow-inner group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-200">
            <Package size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight mb-2 uppercase italic">{item.kind.replace(/_/g, ' ')}</h3>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">ID-{item._id.slice(-4)}</span>
              <span className="w-1 h-1 rounded-full bg-white/10" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{item.creditsQuoted} credits</span>
              <span className="w-1 h-1 rounded-full bg-white/10" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Rev: {item.usedRevisions}/{item.allowedRevisions}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <StatusBadge status={item.status} className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em]" />
          <div className={cn(
            "w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-gray-600 transition-all duration-200 group-hover:text-white group-hover:border-white/20",
            isExpanded ? "rotate-180 bg-white/10 text-white" : ""
          )}>
            <ChevronDown size={20} />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-8 pb-10 pt-4 border-t border-white/5 animate-in slide-in-from-top-4 duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-4 text-sm">
            <div className="space-y-10">
              <section>
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Workflow Control</h4>
                <div className="flex flex-wrap gap-2">
                  {item.status === 'IN_PROGRESS' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeliver(); }}
                      disabled={isLoading}
                      className="px-6 py-2.5 bg-success text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      🚀 Deliver To Client
                    </button>
                  )}
                  {item.status === 'FAILED' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRefund(); }}
                      disabled={isLoading}
                      className="px-6 py-2.5 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      💳 Refund Item
                    </button>
                  )}
                  {validTransitions.map((ns) => (
                    <button
                      key={ns}
                      onClick={(e) => { e.stopPropagation(); handleTransition(ns); }}
                      disabled={isLoading}
                      className="px-6 py-2.5 bg-white/5 border border-white/10 text-text-muted rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-primary/50 transition-all disabled:opacity-50"
                    >
                      → {ns.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
                {(isLoading || error) && (
                  <div className="mt-4">
                    {isLoading && <p className="text-text-muted text-[10px] font-black uppercase tracking-widest animate-pulse">Syncing Status...</p>}
                    {error && <p className="text-error text-[10px] font-bold mt-1 uppercase">{error}</p>}
                  </div>
                )}
              </section>

              <section>
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(item.params).map(([key, val]) => (
                    <div key={key} className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                      <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-1">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-gray-200 font-bold break-words">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Item Assets</h4>
              
              {item.assets && item.assets.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {item.assets.map((asset) => (
                    <div key={asset._id} className="group/asset relative bg-black/40 border border-white/5 rounded-3xl overflow-hidden hover:border-primary/40 transition-all duration-200">
                      <div className="aspect-[4/3] w-full bg-black/60 flex items-center justify-center relative overflow-hidden">
                        {asset.mimeType.startsWith('image/') ? (
                          <img src={(asset as any).url} className="w-full h-full object-cover group-hover/asset:scale-110 transition-transform duration-300" />
                        ) : (
                          <div className="flex flex-col items-center gap-3 text-gray-700">
                            {asset.mimeType.includes('video') ? <Video size={32} /> : <FileIcon size={32} />}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover/asset:opacity-100 transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-sm">
                          <a href={(asset as any).url} target="_blank" rel="noreferrer" className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white text-black rounded-xl transition-all"><ExternalLink size={16} /></a>
                          {asset.mimeType.startsWith('image/') && (
                             <button onClick={() => onPreview(asset)} className="w-9 h-9 flex items-center justify-center bg-primary text-white rounded-xl transition-all"><Maximize2 size={16} /></button>
                          )}
                          <button onClick={() => handleRemoveAsset(asset._id)} className="w-9 h-9 flex items-center justify-center bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      <div className="p-4 bg-white/[0.01]">
                        <p className="text-[10px] text-white font-bold truncate">{asset.originalName}</p>
                        <div className="flex items-center justify-between opacity-40 text-[8px] font-black uppercase mt-1">
                          <span>{(asset.sizeBytes / 1024 / 1024).toFixed(1)}MB</span>
                          <span className="text-primary">{asset.role}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01] flex flex-col items-center justify-center gap-4 text-gray-600">
                   <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center"><Package size={20} className="opacity-20" /></div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-center">No assets found</p>
                </div>
              )}

              <label className={cn(
                "group/up relative flex flex-col items-center justify-center gap-4 border-2 border-dashed border-white/10 rounded-[2rem] py-10 transition-all cursor-pointer overflow-hidden",
                uploading ? "opacity-50 pointer-events-none" : "hover:bg-primary/[0.02] hover:border-primary/20"
              )}>
                <input type="file" multiple className="hidden" disabled={uploading} onChange={(e) => handleFileUpload(e.target.files)} />
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={24} className="animate-spin text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">UPLOAD IN PROGRESS...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover/up:scale-110 group-hover/up:bg-primary group-hover/up:text-white transition-all">
                      <UploadCloud size={20} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Upload Deliverables</p>
                      <p className="text-[8px] font-bold text-gray-600 uppercase mt-1">Images, Video, or Documents</p>
                    </div>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const AdminOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const auth = React.useContext(AuthContext)

  const [detail, setDetail] = useState<AdminOrderDetailData | null>(null)
  const [items, setItems] = useState<AdminOrderItem[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [staff, setStaff] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<'items' | 'chat' | 'timeline'>('items')
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [previewAsset, setPreviewAsset] = useState<any | null>(null)

  const [isReviewing, setIsReviewing] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)

  const fetchAll = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const [detailData, staffData, messagesData] = await Promise.all([
        adminService.getOrderDetail(id),
        adminService.listStaff(),
        adminService.getMessages(id),
      ])
      setDetail(detailData)
      setItems(detailData.items)
      setStaff(staffData)
      setMessages(messagesData.messages)
    } catch (err) {
      logger.error('admin_order_detail.fetch_failed', { error: serializeError(err) })
      setError('Failed to load order details.')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeTab])

  useEffect(() => {
    if (id) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '') : '');
      const socket = io(socketUrl, {
        path: '/socket.io',
        withCredentials: true,
      })
      socket.on('connect', () => {
        socket.emit('join-order', id)
      })
      socket.on('new-message', (msg: Message) => {
        setMessages((prev: Message[]) => [...prev, msg])
      })
      socketRef.current = socket
      return () => { socket.disconnect() }
    }
  }, [id])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !id) return
    setSending(true)
    try {
      await adminService.sendMessage(id, newMessage.trim())
      setNewMessage('')
    } catch (err) {
      logger.error('admin_order_detail.message_send_failed', { error: serializeError(err) })
    } finally {
      setSending(false)
    }
  }

  const handleReview = async (action: ReviewAction) => {
    if (!id) return
    setIsReviewing(true)
    setReviewError(null)
    try {
      const updated = await adminService.reviewOrder(id, action)
      setDetail((prev: AdminOrderDetailData | null) => prev ? { ...prev, order: { ...prev.order, status: updated.status } } : prev)
    } catch (err) {
      logger.error('admin_order_detail.review_failed', { error: serializeError(err) })
      setReviewError('Review action failed.')
    } finally {
      setIsReviewing(false)
    }
  }

  const handleAssign = async (staffId: string) => {
    if (!id) return
    setAssignError(null)
    setIsAssigning(true)
    try {
      const updated = await adminService.assignOrder(id, staffId)
      setDetail((prev: AdminOrderDetailData | null) => prev ? { ...prev, order: { ...prev.order, assignedTo: updated.assignedTo } } : prev)
    } catch (err) {
      logger.error('admin_order_detail.assign_failed', { error: serializeError(err) })
      setAssignError('Assignment failed.')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleItemUpdated = (updated: AdminOrderItem) => {
    setItems((prev: AdminOrderItem[]) => prev.map((item: AdminOrderItem) => (item._id === updated._id ? updated : item)))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
          <AlertCircle size={18} /> {error ?? 'Order not found.'}
        </div>
      </div>
    )
  }

  const { order, events } = detail

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-10 pb-24">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/orders')}
          className="group flex items-center gap-3 text-text-muted hover:text-text-main transition-all text-sm font-bold uppercase tracking-widest"
        >
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          </div>
          Back to Terminal
        </button>
        <button onClick={fetchAll} className="flex items-center gap-2 text-text-muted hover:text-primary text-[10px] font-black uppercase tracking-[0.2em] transition-colors bg-white/5 px-4 py-2 rounded-xl">
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Sync Data
        </button>
      </div>

      <div className="premium-card p-10 space-y-8 rounded-[3rem]">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-3 py-1 rounded-lg border border-white/5">{order.orderNumber}</span>
              <StatusBadge status={order.status} className="text-[9px] px-3 py-1.5 font-black uppercase tracking-widest" />
            </div>
            <h1 className="text-4xl font-black text-white italic truncate max-w-2xl">{order.title}</h1>
            <p className="text-text-muted text-xs font-bold uppercase tracking-[0.2em] mt-3">
              Commissioned {new Date(order.createdAt).toLocaleDateString()} · {items.length} Production Units
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 text-right">
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 mb-1">Total Budget</span>
             <p className="text-4xl font-black text-primary italic leading-none">{order.totalCreditsQuoted.toLocaleString()} CR</p>
             <p className="text-[9px] font-bold text-gray-500 uppercase">Captured: {order.totalCreditsCaptured.toLocaleString()} CR</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
          <div className="flex items-center gap-5 p-6 bg-white/[0.02] rounded-3xl border border-white/5">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
              <UserIcon size={24} />
            </div>
            <div>
              <p className="text-text-muted text-[10px] uppercase tracking-[0.3em] font-black mb-1">Client Authority</p>
              <p className="text-white text-lg font-black italic">{order.userId?.name ?? 'Anonymous'}</p>
              <p className="text-text-muted text-xs font-mono">{order.userId?.email ?? 'no-email@igra.io'}</p>
            </div>
          </div>

          <div className="flex flex-col justify-center p-6 bg-white/[0.02] rounded-3xl border border-white/5">
            <p className="text-text-muted text-[10px] uppercase tracking-[0.3em] font-black mb-3">Assigned Controller</p>
            <div className="relative">
              <select
                defaultValue={order.assignedTo?._id ?? ''}
                onChange={(e) => { if (e.target.value) handleAssign(e.target.value) }}
                className={cn(
                  'w-full appearance-none bg-white/5 border rounded-2xl px-5 py-4 pr-12 text-sm text-white font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all outline-none',
                  assignError ? 'border-rose-500' : 'border-white/10'
                )}
              >
                <option value="">Unassigned</option>
                {staff.map((s: AdminUser) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.role})</option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
                 {isAssigning ? <Loader2 size={16} className="animate-spin text-primary" /> : <ChevronDown size={18} className="text-gray-500" />}
              </div>
            </div>
            {assignError && <p className="text-rose-500 text-[10px] font-bold mt-2 uppercase">{assignError}</p>}
          </div>
        </div>
      </div>

      {/* Review Panel */}
      {order.status === 'UNDER_REVIEW' && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 animate-in slide-in-from-top-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]"><Clock size={16} /></div>
               <h2 className="text-xl font-black text-amber-500 italic uppercase">Authorization Pending</h2>
            </div>
            <p className="text-text-muted text-sm font-medium">Review the order specifications and verify budget allocation before initiating production.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => handleReview('ACCEPT')}
              isLoading={isReviewing}
              className="bg-emerald-500 text-black hover:bg-emerald-400 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl"
            >
              ✓ Authorize
            </Button>
            <Button
              onClick={() => handleReview('REQUEST_INFO')}
              isLoading={isReviewing}
              variant="outline"
              className="border-amber-500/40 text-amber-500 hover:bg-amber-500/10 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest"
            >
              Request Info
            </Button>
            <Button
              onClick={() => handleReview('REJECT')}
              isLoading={isReviewing}
              variant="outline"
              className="border-rose-500/40 text-rose-500 hover:bg-rose-500/10 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest"
            >
              ✗ Terminate
            </Button>
          </div>
          {reviewError && <p className="text-rose-500 text-xs font-bold mt-2">{reviewError}</p>}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 bg-white/[0.02] backdrop-blur-md rounded-[2rem] p-2 border border-white/5 shadow-inner">
        {[
          { key: 'items' as const, label: 'Production Units', icon: Package, count: items.length },
          { key: 'chat' as const, label: 'Communication', icon: MessageSquare, count: messages.length },
          { key: 'timeline' as const, label: 'Audit Log', icon: Activity, count: events.length },
        ].map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex-1 justify-center transition-all group relative ${
              activeTab === key 
                ? 'bg-white text-black shadow-2xl scale-[1.02]' 
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="relative">
              <Icon size={16} className={activeTab === key ? "text-primary" : "text-gray-600 group-hover:text-primary transition-colors"} />
              {key === 'chat' && count > 0 && (
                <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[9px] font-bold min-w-[20px] h-[20px] rounded-full flex items-center justify-center px-1 shadow-md border-2 border-bg-dark animate-in zoom-in duration-300">
                  {count}
                </span>
              )}
            </div>
            {label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'items' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {items.map((item: AdminOrderItem) => (
              <ItemCard 
                key={item._id} 
                item={item} 
                orderId={id!} 
                isExpanded={expandedItem === item._id}
                onToggle={() => setExpandedItem(expandedItem === item._id ? null : item._id)}
                onUpdated={handleItemUpdated}
                onPreview={setPreviewAsset}
              />
            ))}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="premium-card rounded-[3rem] overflow-hidden flex flex-col h-[700px] animate-in slide-in-from-right-8 duration-300 shadow-2xl">
            <div className="bg-white/[0.02] p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white">Communication Stream</h3>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Order #{(order as any).orderNumber} · Secure Stream</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10 scroll-smooth">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-10">
                  <MessageSquare size={100} className="mb-6" />
                  <p className="text-3xl font-black uppercase tracking-[0.5em]">No Signal</p>
                </div>
              ) : (
                messages.map((msg: Message, i: number) => {
                  const isMine = msg.senderId?._id === (auth?.user as any)?.id
                  const showHeader = i === 0 || messages[i - 1].senderId?._id !== msg.senderId?._id
                  
                  return (
                    <div key={msg._id} className={cn(
                      "flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-200",
                      isMine ? "items-end" : "items-start"
                    )}>
                      {showHeader && (
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-3 mx-2">
                           {isMine ? 'Controller' : msg.senderId?.name}
                        </span>
                      )}
                      <div className={cn(
                        "group relative px-6 py-5 max-w-[70%] shadow-2xl transition-all duration-300",
                        isMine 
                          ? "bg-primary text-white rounded-[2rem] rounded-tr-[0.2rem] shadow-primary/20 hover:shadow-primary/30" 
                          : "bg-white/5 text-gray-200 rounded-[2rem] rounded-tl-[0.2rem] border border-white/5 hover:bg-white/[0.08]"
                      )}>
                        <p className="text-sm leading-relaxed font-bold italic">{msg.content}</p>
                        <span className={cn(
                          "absolute top-full mt-2 text-[8px] font-black uppercase tracking-widest opacity-20",
                          isMine ? "right-2" : "left-2"
                        )}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={chatEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="p-8 bg-white/[0.01] border-t border-white/5">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Broadcast instructions..."
                  className="w-full bg-white/5 rounded-[2.5rem] pl-10 pr-24 py-7 text-sm text-white font-bold placeholder-gray-700 outline-none border border-white/10 focus:border-primary/40 focus:ring-8 focus:ring-primary/5 transition-all shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="absolute right-4 w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:bg-primary hover:text-white disabled:opacity-20 transition-all shadow-2xl active:scale-90"
                >
                  <Send size={22} />
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="premium-card rounded-[3rem] p-16 shadow-2xl animate-in fade-in duration-300">
            <div className="max-w-4xl mx-auto">
              {events.length > 0 ? (
                <Timeline events={events} />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-20 bg-white/[0.01] rounded-[2rem]">
                   <Activity size={60} className="mb-6" />
                   <p className="text-sm font-black uppercase tracking-[0.5em]">No Log Data</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Asset Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12 animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-black/98 backdrop-blur-2xl" onClick={() => setPreviewAsset(null)} />
          <div className="relative w-full max-w-7xl h-full flex flex-col gap-10 animate-in zoom-in-95 duration-200">
            <div className="flex-1 rounded-[3.5rem] overflow-hidden border border-white/10 bg-black shadow-[0_40px_100px_rgba(0,0,0,1)] relative flex items-center justify-center ring-1 ring-white/10 ring-inset">
               <img src={previewAsset.url} alt={previewAsset.originalName} className="max-w-full max-h-full object-contain p-8 select-none drop-shadow-2xl" />
                <button onClick={() => setPreviewAsset(null)} className="absolute top-10 right-10 w-16 h-16 bg-white/5 hover:bg-white text-black backdrop-blur-md rounded-[2rem] flex items-center justify-center transition-all hover:rotate-90 active:scale-90"><X size={32} /></button>
            </div>
            <div className="premium-card p-10 rounded-[3rem] border-white/10 flex flex-col md:flex-row justify-between items-center gap-10 shadow-2xl">
              <div className="flex items-center gap-10">
                <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner"><Maximize2 size={40} /></div>
                <div>
                  <h3 className="text-4xl font-black text-white italic tracking-tighter mb-3 uppercase">{previewAsset.originalName}</h3>
                  <div className="flex items-center gap-5 text-xs font-black uppercase tracking-widest text-gray-500">
                    <span className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">{(previewAsset.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-primary">{previewAsset.mimeType}</span>
                  </div>
                </div>
              </div>
              <a href={previewAsset.url} download={previewAsset.originalName} className="flex items-center justify-center gap-4 px-16 py-6 bg-white text-black rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] transition-all shadow-glow hover:bg-primary hover:text-white hover:-translate-y-1 active:scale-95"><Download size={22} /> Download Asset</a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrderDetail

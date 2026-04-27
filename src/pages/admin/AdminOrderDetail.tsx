import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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
  ShieldCheck,
  Zap,
  Check,
  History,
  Settings,
  Image as ImageIcon,
  MoreVertical,
  CreditCard,
  ShieldAlert,
  Calendar
} from 'lucide-react'
import socketService from '../../services/socketService'
import { AuthContext } from '../../context/AuthContext'
import adminService from '../../services/adminService'
import * as uploadApi from '../../services/uploadService'
import type {
  AdminOrderDetailData, AdminOrderItem, AdminOrderEvent,
  AdminUser, ReviewAction, OrderItemStatus, Message
} from '../../services/adminService'
import { ITEM_TRANSITIONS } from '../../services/adminService'
import StatusBadge from '../../components/admin/StatusBadge'
import Button, { cn } from '../../components/Button'
import { createLogger, serializeError } from '../../services/logger'

const logger = createLogger('AdminOrderDetail')

const Timeline: React.FC<{ events: AdminOrderEvent[] }> = ({ events }) => (
  <div className="relative border-l-2 border-white/5 ml-4 pl-10 space-y-12">
    {events.map((event, i) => (
      <div key={i} className="relative group">
        <div className="absolute -left-[49px] top-1 w-4 h-4 rounded-full bg-bg-dark border-4 border-white/10 group-hover:border-primary transition-all duration-500 z-10 shadow-2xl" />
        <div className="mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
            <span className="text-xl font-bold text-white tracking-tight italic">{event.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</span>
            <span className="text-[10px] font-bold text-text-dim/40 bg-white/5 px-3 py-1 rounded-lg border border-white/5 uppercase tracking-widest">
              {new Date(event.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
        {event.data && Object.keys(event.data).length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white/[0.02] p-6 rounded-3xl border border-white/5 shadow-inner">
            {Object.entries(event.data).map(([key, val]) => (
              <div key={key} className="space-y-1">
                <span className="text-[9px] text-text-dim/40 font-bold uppercase tracking-[0.2em] block">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <p className="text-sm text-text-dim font-medium">
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
        const { assetId } = await uploadApi.uploadFile(file)
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

  const handleDownload = async (url: string, fileName: string) => {
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
      logger.error('admin_item.download_failed', { url, error: serializeError(err) })
      window.open(url, '_blank')
    }
  }

  return (
    <div className={cn(
      "bg-bg-card/40 backdrop-blur-3xl border rounded-[2rem] overflow-hidden transition-all duration-500 group",
      isExpanded ? "border-primary/20 shadow-2xl shadow-primary/5" : "border-white/5 hover:border-white/10"
    )}>
      <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer relative z-10" onClick={onToggle}>
        <div className="flex items-center gap-6">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border shadow-2xl",
            isExpanded ? "bg-primary/10 text-primary border-primary/20" : "bg-white/5 text-text-dim/40 border-white/5 group-hover:scale-110 group-hover:border-white/10"
          )}>
            <Package size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight italic mb-1">
              {item.kind.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">ID-{item._id.slice(-4)}</span>
              <span className="w-1 h-1 rounded-full bg-white/10" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim/40">{item.creditsQuoted} credits</span>
              <span className="w-1 h-1 rounded-full bg-white/10" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim/40">Revision {item.usedRevisions} of {item.allowedRevisions}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <StatusBadge status={item.status} className="px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-[0.2em]" />
          <div className={cn(
            "w-10 h-10 rounded-xl border border-white/5 flex items-center justify-center text-text-dim/40 transition-all duration-500 group-hover:text-white group-hover:border-white/20",
            isExpanded ? "rotate-180 bg-primary/10 text-primary border-primary/20" : ""
          )}>
            <ChevronDown size={18} />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-8 pb-10 pt-4 border-t border-white/5 animate-in slide-in-from-top-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-4 text-sm">
            <div className="space-y-10">
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                   <Settings size={14} className="text-primary/40" />
                   <h4 className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">Workflow protocol</h4>
                </div>
                <div className="flex flex-wrap gap-3">
                  {item.status === 'IN_PROGRESS' && (
                    <Button
                      onClick={(e) => { e.stopPropagation(); handleDeliver(); }}
                      isLoading={isLoading}
                      className="rounded-xl px-6 shadow-xl shadow-success/10 bg-success text-black border-none"
                    >
                      Deliver to client
                    </Button>
                  )}
                  {item.status === 'FAILED' && (
                    <Button
                      onClick={(e) => { e.stopPropagation(); handleRefund(); }}
                      isLoading={isLoading}
                      className="rounded-xl px-6 shadow-xl shadow-error/10 bg-error text-white border-none"
                    >
                      Issue refund
                    </Button>
                  )}
                  {validTransitions.map((ns) => (
                    <Button
                      key={ns}
                      onClick={(e) => { e.stopPropagation(); handleTransition(ns); }}
                      isLoading={isLoading}
                      variant="outline"
                      className="rounded-xl px-6 border-white/5 bg-white/5 text-text-dim hover:text-white"
                    >
                      Set to {ns.replace(/_/g, ' ').toLowerCase()}
                    </Button>
                  ))}
                </div>
                {(isLoading || error) && (
                  <div className="flex items-center gap-3">
                    {isLoading && <p className="text-[10px] font-bold uppercase tracking-widest text-primary animate-pulse">Synchronizing status...</p>}
                    {error && <p className="text-error text-[10px] font-bold uppercase tracking-widest">{error}</p>}
                  </div>
                )}
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3">
                   <Activity size={14} className="text-primary/40" />
                   <h4 className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">Configuration parameters</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(item.params).map(([key, val]) => {
                    if (key === 'showLinkInput') return null;
                    return (
                      <div key={key} className="p-5 bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                        <p className="text-[9px] text-text-dim/20 uppercase font-bold tracking-widest mb-1.5">{key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}</p>
                        {Array.isArray(val) ? (
                          <div className="space-y-2 mt-2">
                            {val.map((v, i) => (
                              <div key={i} className="flex items-center gap-3 text-sm text-white font-medium">
                                <span className="text-[10px] font-mono text-primary/40">0{i + 1}</span>
                                <a href={String(v)} target="_blank" rel="noreferrer" className="truncate hover:text-primary transition-all flex items-center gap-1.5 underline decoration-primary/20 underline-offset-4">
                                  Source Link <ExternalLink size={10} />
                                </a>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-white font-medium break-words leading-relaxed">{String(val)}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <div className="space-y-10">
                {/* Deliverables Section */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <ImageIcon size={14} className="text-primary/40" />
                    <h4 className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">Output deliverables ({(item.assets ?? []).filter(a => a.role === 'OUTPUT').length})</h4>
                  </div>
                  {(item.assets ?? []).filter(a => a.role === 'OUTPUT').length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {(item.assets ?? []).filter(a => a.role === 'OUTPUT').map((asset) => (
                        <div key={asset._id} className="group/asset relative bg-primary/5 border border-primary/10 rounded-3xl overflow-hidden hover:border-primary/40 transition-all duration-500 shadow-xl">
                          <div className="aspect-[4/3] w-full bg-black/60 flex items-center justify-center relative overflow-hidden">
                            {asset.mimeType.startsWith('image/') ? (
                              <img src={(asset as any).url} className="w-full h-full object-cover group-hover/asset:scale-110 transition-all duration-700" alt="deliverable" />
                            ) : (
                              <div className="flex flex-col items-center gap-3 text-text-dim/20">
                                {asset.mimeType.includes('video') ? <Video size={32} /> : <FileIcon size={32} />}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover/asset:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-md">
                              <button onClick={() => handleDownload((asset as any).url, asset.originalName)} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white text-text-dim hover:text-black rounded-xl transition-all shadow-xl">
                                 <Download size={18} />
                              </button>
                              {asset.mimeType.startsWith('image/') && (
                                 <button onClick={() => onPreview(asset)} className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl transition-all shadow-xl shadow-primary/20 scale-110">
                                    <Maximize2 size={18} />
                                 </button>
                              )}
                              <button onClick={() => handleRemoveAsset(asset._id)} className="w-10 h-10 flex items-center justify-center bg-error/10 text-error rounded-xl hover:bg-error hover:text-white transition-all shadow-xl shadow-error/10">
                                 <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                          <div className="p-4 bg-white/[0.02]">
                            <p className="text-[10px] text-white font-bold truncate tracking-tight">{asset.originalName}</p>
                            <div className="flex items-center justify-between opacity-40 text-[8px] font-bold uppercase tracking-widest mt-1.5">
                              <span>{(asset.sizeBytes / 1024 / 1024).toFixed(1)}MB</span>
                              <span className="text-primary">{asset.role}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 border border-dashed border-white/5 rounded-3xl bg-white/[0.01] flex flex-col items-center justify-center gap-3 text-text-dim/20">
                       <Package size={24} className="opacity-20" />
                       <p className="text-[9px] font-bold uppercase tracking-widest text-center">No deliverables yet</p>
                    </div>
                  )}
                </section>

                {/* Input Assets Section */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <FileIcon size={14} className="text-text-dim/40" />
                    <h4 className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">Client uploads ({(item.assets ?? []).filter(a => a.role !== 'OUTPUT').length})</h4>
                  </div>
                  {(item.assets ?? []).filter(a => a.role !== 'OUTPUT').length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {(item.assets ?? []).filter(a => a.role !== 'OUTPUT').map((asset) => (
                        <div key={asset._id} className="group/asset relative bg-black/40 border border-white/5 rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-500 shadow-xl">
                          <div className="aspect-[4/3] w-full bg-black/60 flex items-center justify-center relative overflow-hidden">
                            {asset.mimeType.startsWith('image/') ? (
                              <img src={(asset as any).url} className="w-full h-full object-cover group-hover/asset:scale-110 transition-all duration-700" alt="input asset" />
                            ) : (
                              <div className="flex flex-col items-center gap-3 text-text-dim/20">
                                {asset.mimeType.includes('video') ? <Video size={32} /> : <FileIcon size={32} />}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover/asset:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-md">
                              <button onClick={() => handleDownload((asset as any).url, asset.originalName)} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white text-text-dim hover:text-black rounded-xl transition-all shadow-xl">
                                 <Download size={18} />
                              </button>
                              <button onClick={() => handleRemoveAsset(asset._id)} className="w-10 h-10 flex items-center justify-center bg-error/10 text-error rounded-xl hover:bg-error hover:text-white transition-all shadow-xl shadow-error/10">
                                 <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                          <div className="p-4 bg-white/[0.02]">
                            <p className="text-[10px] text-white font-bold truncate tracking-tight">{asset.originalName}</p>
                            <div className="flex items-center justify-between opacity-40 text-[8px] font-bold uppercase tracking-widest mt-1.5">
                              <span>{(asset.sizeBytes / 1024 / 1024).toFixed(1)}MB</span>
                              <span className="text-text-dim">{asset.role}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 border border-dashed border-white/5 rounded-3xl bg-white/[0.01] flex flex-col items-center justify-center gap-3 text-text-dim/20">
                       <p className="text-[9px] font-bold uppercase tracking-widest text-center">No client uploads</p>
                    </div>
                  )}
                </section>
              </div>

              <label className={cn(
                "group/up relative flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-[2.5rem] py-14 transition-all duration-500 cursor-pointer overflow-hidden",
                uploading ? "opacity-50 pointer-events-none border-primary/20" : "border-white/5 bg-black/20 hover:bg-primary/5 hover:border-primary/20"
              )}>
                <input type="file" multiple className="hidden" disabled={uploading} onChange={(e) => handleFileUpload(e.target.files)} />
                {uploading ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 size={32} className="animate-spin text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary animate-pulse">Uploading to studio...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-text-dim/40 group-hover/up:scale-110 group-hover/up:bg-primary group-hover/up:text-white group-hover/up:rotate-12 transition-all duration-500 shadow-2xl">
                      <UploadCloud size={24} />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-[11px] font-bold text-white uppercase tracking-[0.2em]">Add production deliverables</p>
                      <p className="text-[9px] font-medium text-text-dim/20 uppercase tracking-widest">Images, videos, or design assets</p>
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
      setError('Failed to establish connection with order database.')
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
      socketService.connect()
      socketService.joinOrder(id)

      const socket = socketService.getSocket()
      socket.on('new-message', (msg: Message) => {
        setMessages((prev: Message[]) => {
          if (prev.find(m => m._id === msg._id)) return prev
          return [...prev, msg]
        })
      })

      return () => {
        socket.off('new-message')
        socketService.leaveOrder(id)
      }
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
      setReviewError('Authorization action failed.')
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
      setAssignError('Personnel assignment failed.')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleItemUpdated = (updated: AdminOrderItem) => {
    setItems((prev: AdminOrderItem[]) => prev.map((item: AdminOrderItem) => (item._id === updated._id ? updated : item)))
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in duration-700">
        <div className="relative">
           <div className="w-16 h-16 border-2 border-primary/20 rounded-full" />
           <div className="absolute inset-0 w-16 h-16 border-t-2 border-primary rounded-full animate-spin" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim/40 animate-pulse">Syncing production command center...</p>
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="p-12">
        <div className="bg-error/10 border border-error/20 rounded-[2rem] p-10 flex items-center gap-6 text-error shadow-2xl animate-in shake duration-300">
          <ShieldAlert size={32} />
          <div className="space-y-1">
             <p className="font-bold text-lg">Transmission failure</p>
             <p className="text-sm opacity-60">{error ?? 'Identity record not located.'}</p>
          </div>
        </div>
      </div>
    )
  }

  const { order, events } = detail

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-10 pb-32 animate-in fade-in duration-1000">
      {/* Navigation & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <Link to="/admin/orders" className="group inline-flex items-center gap-4 text-text-dim/60 hover:text-white text-xs font-bold uppercase tracking-widest transition-all">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:rotate-[-8deg] transition-all duration-500">
            <ArrowLeft size={18} />
          </div>
          Return to terminal
        </Link>
        <button onClick={fetchAll} className="flex items-center gap-3 text-text-dim/40 hover:text-primary text-[10px] font-bold uppercase tracking-[0.2em] transition-all bg-white/5 hover:bg-primary/10 px-6 py-3 rounded-2xl border border-white/5 group">
          <RefreshCw size={14} className={cn("transition-transform duration-700", isLoading ? "animate-spin" : "group-hover:rotate-180")} /> Refresh system data
        </button>
      </div>

      {/* Hero Dossier */}
      <div className="bg-bg-card/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10 md:p-14 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -mr-80 -mt-80 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between gap-12 relative z-10">
          <div className="space-y-8 flex-1">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] font-mono font-bold text-text-dim/60 uppercase tracking-widest">
                <Zap size={10} className="text-primary" /> {order.orderNumber}
              </div>
              <StatusBadge status={order.status} className="text-[9px] px-4 py-1.5 font-bold uppercase tracking-[0.2em] rounded-xl shadow-xl" />
            </div>
            
            <div className="space-y-4">
               <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight italic leading-tight">
                  {order.title.split(' ')[0]} <span className="text-primary not-italic">{order.title.split(' ').slice(1).join(' ')}</span>
               </h1>
               <div className="flex flex-wrap items-center gap-6 text-text-dim/40">
                  <div className="flex items-center gap-2">
                     <Calendar size={14} className="text-primary/40" />
                     <p className="text-[10px] font-bold uppercase tracking-widest">Commissioned {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                  <div className="flex items-center gap-2">
                     <Package size={14} className="text-primary/40" />
                     <p className="text-[10px] font-bold uppercase tracking-widest">{items.length} Production units</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end justify-center md:justify-start gap-4 text-center md:text-right bg-white/5 backdrop-blur-xl border border-white/5 p-10 rounded-[2.5rem] shadow-2xl min-w-[300px]">
             <div className="flex items-center gap-3 text-text-dim/40">
                <CreditCard size={14} />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Total budget</span>
             </div>
             <p className="text-5xl font-bold text-primary italic tracking-tighter leading-none">{order.totalCreditsQuoted.toLocaleString()}</p>
             <div className="space-y-1">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Credits Captured</p>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-primary shadow-[0_0_10px_rgba(225,29,72,0.5)] transition-all duration-1000" style={{ width: `${(order.totalCreditsCaptured / order.totalCreditsQuoted) * 100}%` }} />
                </div>
                <p className="text-[9px] font-bold text-primary uppercase">{order.totalCreditsCaptured.toLocaleString()} CR</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 mt-12 border-t border-white/5 relative z-10">
          <Link to={`/admin/users/${order.userId?._id}`} className="group/user flex items-center gap-6 p-8 bg-black/20 rounded-[2.5rem] border border-white/5 hover:border-primary/20 transition-all duration-500 shadow-xl">
            <div className="relative">
               <img 
                 src={order.userId?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                 alt="client" 
                 className="w-16 h-16 rounded-2xl border-2 border-white/10 object-cover shadow-2xl group-hover/user:scale-110 transition-all duration-500"
               />
               <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-success border-4 border-bg-dark flex items-center justify-center shadow-lg">
                  <Check size={10} className="text-white" />
               </div>
            </div>
            <div>
              <p className="text-text-dim/20 text-[10px] uppercase tracking-[0.3em] font-bold mb-1">Client authority</p>
              <p className="text-white text-xl font-bold tracking-tight group-hover/user:text-primary transition-colors">{order.userId?.name ?? 'Unknown Identity'}</p>
              <p className="text-text-dim/40 text-xs font-mono group-hover/user:text-text-dim transition-colors">{order.userId?.email}</p>
            </div>
          </Link>

          <div className="flex flex-col justify-center p-8 bg-black/20 rounded-[2.5rem] border border-white/5 shadow-xl relative group/assign">
            <div className="flex items-center gap-3 mb-4 text-text-dim/20 group-focus-within/assign:text-primary transition-colors">
               <UserIcon size={14} />
               <p className="text-[10px] uppercase tracking-[0.3em] font-bold">Assigned controller</p>
            </div>
            <div className="relative">
              <select
                defaultValue={order.assignedTo?._id ?? ''}
                onChange={(e) => { if (e.target.value) handleAssign(e.target.value) }}
                className={cn(
                  'w-full appearance-none bg-bg-dark/40 border rounded-2xl px-6 py-4 pr-14 text-sm text-white font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/40 transition-all outline-none shadow-inner',
                  assignError ? 'border-error/40 ring-error/5' : 'border-white/5'
                )}
              >
                <option value="">Unassigned</option>
                {staff.map((s: AdminUser) => (
                  <option key={s._id} value={s._id} className="bg-bg-dark">{s.name} — {s.role.toLowerCase()}</option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2 transition-all duration-500">
                 {isAssigning ? <Loader2 size={16} className="animate-spin text-primary" /> : <ChevronDown size={20} className="text-text-dim/20 group-hover/assign:text-white" />}
              </div>
            </div>
            {assignError && <p className="text-error text-[10px] font-bold mt-2 uppercase tracking-widest">{assignError}</p>}
          </div>
        </div>
      </div>

      {/* Review Authorization Control */}
      {order.status === 'UNDER_REVIEW' && (
        <div className="bg-primary/5 border border-primary/10 rounded-[3rem] p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-10 animate-in slide-in-from-top-4 duration-700 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/10 to-transparent opacity-20" />
          <div className="space-y-3 relative z-10 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4">
               <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/40 animate-pulse"><Clock size={24} /></div>
               <h2 className="text-2xl font-bold text-white tracking-tight italic">Authorization <span className="text-primary not-italic">pending</span></h2>
            </div>
            <p className="text-text-dim/60 text-sm font-medium max-w-xl">Audit the production request and verify credit allocation. Once authorized, the studio will begin fulfillment protocol.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
            <Button
              onClick={() => handleReview('ACCEPT')}
              isLoading={isReviewing}
              className="bg-white text-black hover:bg-primary hover:text-white px-10 py-5 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-2xl shadow-white/5 active:scale-95 border-none"
            >
              Confirm Authorization
            </Button>
            <Button
              onClick={() => handleReview('REQUEST_INFO')}
              isLoading={isReviewing}
              variant="outline"
              className="border-white/5 bg-white/5 text-text-dim hover:text-white hover:border-white/10 px-10 py-5 rounded-2xl text-[10px] font-bold uppercase tracking-widest"
            >
              Request intelligence
            </Button>
            <Button
              onClick={() => handleReview('REJECT')}
              isLoading={isReviewing}
              variant="outline"
              className="border-error/20 bg-error/5 text-error hover:bg-error hover:text-white px-10 py-5 rounded-2xl text-[10px] font-bold uppercase tracking-widest"
            >
              Terminate request
            </Button>
          </div>
          {reviewError && <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-error text-[10px] font-bold uppercase tracking-widest">{reviewError}</p>}
        </div>
      )}

      {/* Navigation Matrix */}
      <div className="flex flex-wrap gap-3 bg-white/[0.02] backdrop-blur-3xl rounded-[2.5rem] p-3 border border-white/5 shadow-2xl">
        {[
          { key: 'items' as const, label: 'Production Units', icon: Package, count: items.length },
          { key: 'chat' as const, label: 'Secure Stream', icon: MessageSquare, count: messages.length },
          { key: 'timeline' as const, label: 'Audit Logs', icon: History, count: events.length },
        ].map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-4 px-10 py-5 rounded-3xl text-[10px] font-bold uppercase tracking-[0.2em] flex-1 justify-center transition-all duration-500 group relative",
              activeTab === key 
                ? 'bg-white text-black shadow-2xl scale-[1.02] rotate-[-1deg]' 
                : 'text-text-dim/20 hover:text-white hover:bg-white/5'
            )}
          >
            <div className="relative">
              <Icon size={18} className={cn("transition-colors duration-500", activeTab === key ? "text-primary" : "text-text-dim/20 group-hover:text-primary")} />
              {key === 'chat' && count > 0 && (
                <span className="absolute -top-3 -right-4 bg-primary text-white text-[9px] font-black min-w-[22px] h-[22px] rounded-lg flex items-center justify-center px-1 shadow-xl shadow-primary/20 border-2 border-bg-dark animate-bounce">
                  {count}
                </span>
              )}
            </div>
            {label}
          </button>
        ))}
      </div>

      {/* Core Operational Area */}
      <div className="min-h-[600px] relative">
        {activeTab === 'items' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
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
            {items.length === 0 && (
              <div className="py-40 bg-bg-card/20 border border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center gap-6 opacity-40">
                 <Package size={64} className="text-text-dim/10" />
                 <p className="text-xl font-bold italic">No production units discovered</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-bg-card/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] overflow-hidden flex flex-col h-[850px] animate-in slide-in-from-right-12 duration-700 shadow-2xl relative">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
            
            <div className="bg-white/[0.02] px-12 py-8 border-b border-white/5 flex items-center justify-between z-10 backdrop-blur-xl">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-xl shadow-primary/5">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight italic">Studio <span className="text-primary not-italic">connect</span></h3>
                  <div className="flex items-center gap-2 opacity-40">
                     <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                     <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">End-to-End Encrypted Link</p>
                  </div>
                </div>
              </div>
              <button className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-text-dim/20 hover:text-white hover:bg-white/10 transition-all">
                 <MoreVertical size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-12 space-y-12 scroll-smooth relative z-10">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-8 opacity-5">
                  <div className="w-32 h-32 rounded-[3rem] border-2 border-dashed border-white/20 flex items-center justify-center">
                    <Zap size={64} />
                  </div>
                  <p className="text-4xl font-bold italic tracking-tighter uppercase">Silence established</p>
                </div>
              ) : (
                <div className="space-y-12">
                   <div className="flex flex-col items-center gap-4 opacity-10 py-4">
                      <div className="h-px w-32 bg-gradient-to-r from-transparent via-text-dim to-transparent" />
                      <p className="text-[9px] font-black uppercase tracking-[0.4em]">Protocol Initiated</p>
                      <div className="h-px w-32 bg-gradient-to-r from-transparent via-text-dim to-transparent" />
                   </div>
                   
                   {messages.map((msg: Message, i: number) => {
                     if (!msg) return null;
                     const currentUserId = (auth?.user as any)?.id || (auth?.user as any)?._id
                     const senderId = msg.senderId?._id || msg.senderId
                     const isMine = senderId === currentUserId
                     const prevSenderId = i > 0 ? (messages[i - 1].senderId?._id || messages[i - 1].senderId) : null
                     const showHeader = i === 0 || prevSenderId !== senderId
                     
                     return (
                       <div key={msg._id} className={cn(
                         "flex flex-col animate-in slide-in-from-bottom-4 duration-500",
                         isMine ? "items-end" : "items-start"
                       )} style={{ animationDelay: `${i * 30}ms` }}>
                         {showHeader && (
                           <div className={cn("flex items-center gap-3 mb-3 mx-4 opacity-40", isMine && "flex-row-reverse")}>
                              <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                                 <UserIcon size={12} />
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
                                 {isMine ? 'Lead Controller' : msg.senderId?.name || 'System'}
                              </span>
                           </div>
                         )}
                         <div className={cn(
                           "group relative px-8 py-6 max-w-[75%] shadow-[0_20px_60px_rgba(0,0,0,0.3)] transition-all duration-500",
                           isMine 
                             ? "bg-primary text-white rounded-[2.5rem] rounded-tr-[0.5rem] shadow-primary/10 hover:shadow-primary/20" 
                             : "bg-white/5 text-white rounded-[2.5rem] rounded-tl-[0.5rem] border border-white/5 hover:bg-white/[0.08] backdrop-blur-xl"
                         )}>
                           <p className="text-base leading-relaxed font-medium">{msg.content}</p>
                           <div className={cn(
                             "absolute top-full mt-3 flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest text-text-dim/20 opacity-0 group-hover:opacity-100 transition-all duration-500",
                             isMine ? "right-4 flex-row-reverse" : "left-4"
                           )}>
                             {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                             {isMine && <Check size={10} className="text-white" />}
                           </div>
                         </div>
                       </div>
                     )
                   })}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="p-10 bg-bg-dark/40 backdrop-blur-3xl border-t border-white/5 z-20">
              <div className="max-w-5xl mx-auto relative flex items-center group/input">
                <div className="absolute left-6 text-text-dim/10 group-focus-within/input:text-primary transition-colors">
                   <MessageSquare size={20} />
                </div>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Draft tactical instruction..."
                  className="w-full bg-black/40 rounded-[2.5rem] pl-16 pr-32 py-7 text-base text-white font-medium placeholder-text-dim/10 outline-none border border-white/5 focus:border-primary/40 focus:ring-[12px] focus:ring-primary/5 transition-all shadow-[0_15px_40px_rgba(0,0,0,0.4)]"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="absolute right-3 w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:bg-primary hover:text-white disabled:opacity-5 transition-all shadow-2xl active:scale-95 group/btn overflow-hidden"
                >
                   <div className="absolute inset-0 bg-primary opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                   <Send size={22} className="relative z-10 group-hover/btn:rotate-12 transition-transform" />
                </button>
              </div>
              <p className="text-center text-[9px] font-bold text-text-dim/10 uppercase tracking-[0.4em] mt-8">Studio Encrypted Terminal — Tactical Command Only</p>
            </form>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-bg-card/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-12 md:p-20 shadow-2xl animate-in fade-in zoom-in-95 duration-1000 relative">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] pointer-events-none" />
            <div className="max-w-4xl mx-auto relative z-10">
              <div className="flex items-center gap-5 mb-16 px-4">
                 <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-text-dim shadow-xl border border-white/5">
                    <History size={24} />
                 </div>
                 <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight italic">Audit <span className="text-primary not-italic">history</span></h3>
                    <p className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">Complete production lifecycle log</p>
                 </div>
              </div>
              
              {events.length > 0 ? (
                <Timeline events={events} />
              ) : (
                <div className="flex flex-col items-center justify-center py-32 gap-6 opacity-10">
                   <Activity size={80} strokeWidth={1} />
                   <p className="text-xl font-bold italic uppercase tracking-[0.5em]">Log stream empty</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cinematic Asset Preview */}
      {previewAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12 animate-in fade-in duration-500">
          <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setPreviewAsset(null)} />
          <div className="relative w-full max-w-7xl h-full flex flex-col gap-8 animate-in zoom-in-95 duration-700">
            <div className="flex-1 rounded-[4rem] overflow-hidden border border-white/10 bg-black shadow-[0_0_100px_rgba(0,0,0,1)] relative flex items-center justify-center group/modal">
               <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-20 pointer-events-none" />
               <img src={previewAsset.url} alt={previewAsset.originalName} className="max-w-full max-h-full object-contain p-12 select-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-all duration-1000" />
               
               <div className="absolute top-10 right-10 flex gap-4">
                  <button onClick={() => setPreviewAsset(null)} className="w-16 h-16 bg-white/5 hover:bg-white text-white hover:text-black backdrop-blur-2xl rounded-[1.5rem] flex items-center justify-center border border-white/10 transition-all hover:rotate-90 shadow-2xl active:scale-90">
                     <X size={32} />
                  </button>
               </div>
            </div>
            
            <div className="bg-bg-card/60 backdrop-blur-3xl border border-white/10 p-10 md:p-14 rounded-[3.5rem] flex flex-col md:flex-row justify-between items-center gap-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48" />
              
              <div className="flex items-center gap-10 relative z-10">
                <div className="w-24 h-24 rounded-[2rem] bg-primary flex items-center justify-center text-white shadow-[0_0_40px_rgba(225,29,72,0.4)] animate-pulse">
                   <Maximize2 size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl md:text-4xl font-bold text-white italic tracking-tight">{previewAsset.originalName}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim/40">
                    <span className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 shadow-xl">{(previewAsset.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-primary">{previewAsset.mimeType}</span>
                    <div className="w-2 h-2 rounded-full bg-white/5" />
                    <span>Captured output</span>
                  </div>
                </div>
              </div>
              
              <a 
                href={previewAsset.url} 
                download={previewAsset.originalName} 
                className="group relative flex items-center justify-center gap-4 px-20 py-7 bg-white text-black rounded-[2.5rem] text-xs font-black uppercase tracking-[0.4em] transition-all duration-500 shadow-[0_0_50px_rgba(255,255,255,0.1)] hover:bg-primary hover:text-white hover:shadow-primary/40 hover:-translate-y-2 active:scale-95 overflow-hidden"
              >
                 <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                 <Download size={24} className="relative z-10 group-hover:rotate-[-12deg] transition-transform" /> 
                 <span className="relative z-10">Acquire deliverable</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrderDetail

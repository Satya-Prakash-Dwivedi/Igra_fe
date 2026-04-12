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
  Package,
  MessageSquare,
  Activity,
  ChevronDown,
  UploadCloud,
  Loader2,
  Trash2,
  ExternalLink,
  Video,
  File as FileIcon,
  X,
  Maximize2,
  Download,
} from 'lucide-react'
import { cn } from '../components/Button'
import { createLogger, serializeError } from '../services/logger'

const logger = createLogger('OrderDetail')
import * as uploadApi from '../services/uploadService'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-white/5 text-gray-400 border-white/5',
  PENDING_INPUT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  BLOCKED: 'bg-red-500/10 text-red-400 border-red-500/20',
  READY: 'bg-primary/10 text-primary border-primary/20',
  UNDER_REVIEW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  IN_PROGRESS: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  DELIVERED: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  AWAITING_APPROVAL: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PENDING_PAYMENT: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
}

const ORDER_STEPS = [
  { id: 'DRAFT', label: 'Draft' },
  { id: 'PENDING_INPUT', label: 'Queued' },
  { id: 'IN_PROGRESS', label: 'Production' },
  { id: 'DELIVERED', label: 'Review' },
  { id: 'COMPLETED', label: 'Final' }
]

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
  const [previewAsset, setPreviewAsset] = useState<any | null>(null)
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
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'https://dev.api.igrastudios.com', {
      path: '/socket.io',
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

  async function handleConfirmAndPay() {
    if (!id || !detail) return
    setLoading(true)
    try {
      await orderApi.submitOrder(id)
      await loadOrder()
    } catch (err: any) {
      logger.error('order_detail.confirm_and_pay_failed', {
        orderId: id,
        error: serializeError(err),
      })
      alert(err?.response?.data?.error || err.message)
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

  async function handleRemoveAsset(itemId: string, assetId: string) {
    if (!confirm('Are you sure you want to remove this asset? This action cannot be undone.')) return
    try {
      await orderApi.removeAssetFromItem(id!, itemId, assetId)
      await loadOrder()
    } catch (err: any) {
      logger.error('order_detail.asset_remove_failed', {
        orderId: id,
        itemId,
        assetId,
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
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4">
      {/* Header & Meta */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4">
        <div className="flex items-start gap-6">
          <button
            onClick={() => navigate('/orders')}
            className="mt-1 w-12 h-12 flex items-center justify-center bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl text-gray-400 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all shadow-2xl group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-4xl font-black text-white tracking-tight leading-none">
                {order.title || `Order #${order.orderNumber.slice(-6)}`}
              </h1>
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border flex items-center gap-2 shadow-2xl",
                STATUS_COLORS[order.status] || "bg-white/5 text-gray-400 border-white/5"
              )}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shadow-[0_0_8px_currentColor]" />
                {order.status.replace(/_/g, ' ')}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-gray-400">
              <span className="font-mono text-gray-500">{order.orderNumber}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
              <span>{items.length} Items</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
              <span className="text-primary/70">{order.totalCreditsQuoted} Credits Total</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {order.status === 'DRAFT' && (
            <button
              onClick={handleConfirmAndPay}
              className="px-6 py-3 bg-primary text-white hover:bg-blue-600 shadow-[0_10px_30px_rgba(59,130,246,0.3)] text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95"
            >
              Complete & Pay
            </button>
          )}
          {canCancel && (
            <button
              onClick={handleCancelOrder}
              className="px-6 py-3 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-[0.2em] rounded-2xl border border-red-500/10 transition-all hover:border-red-500/30 active:scale-95"
            >
              Terminate Order
            </button>
          )}
          <button className="px-6 py-3 bg-white text-black hover:bg-gray-200 text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95">
            Support Ticket
          </button>
        </div>
      </div>

      {/* Production Roadmap */}
      <div className="premium-card p-6 rounded-3xl border-primary/5 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Order Progress</h2>
           <span className="text-[10px] font-bold text-primary animate-pulse">EST. COMPLETION: 48h</span>
        </div>
        <div className="relative flex justify-between">
           {/* Line */}
           <div className="absolute top-[18px] left-0 right-0 h-[2px] bg-white/5 z-0" />
           <div 
             className="absolute top-[18px] left-0 h-[2px] bg-primary z-0 transition-all duration-200" 
             style={{ width: `${(ORDER_STEPS.findIndex(s => s.id === order.status) + 1) / ORDER_STEPS.length * 100}%` }}
           />
           
           {ORDER_STEPS.map((step, idx) => {
             const isActive = order.status === step.id;
             const isCompleted = ORDER_STEPS.findIndex(s => s.id === order.status) >= idx;
             
             return (
               <div key={step.id} className="relative z-10 flex flex-col items-center gap-4">
                 <div className={cn(
                   "w-9 h-9 rounded-full border-4 bg-bg-dark flex items-center justify-center transition-all duration-200 shadow-2xl",
                   isCompleted ? "border-primary text-primary" : "border-white/5 text-gray-700",
                   isActive && "scale-125 border-primary shadow-[0_0_20px_rgba(244,63,94,0.3)] bg-primary text-white"
                 )}>
                    {isCompleted && !isActive ? <CheckCircle size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                 </div>
                 <span className={cn(
                   "text-[9px] font-black uppercase tracking-widest transition-colors",
                   isCompleted ? "text-white" : "text-gray-700"
                 )}>{step.label}</span>
               </div>
             )
           })}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 bg-white/[0.02] backdrop-blur-md rounded-[2rem] p-2 border border-white/5 shadow-inner">
        {[
          { key: 'items' as const, label: 'Line Items', icon: Package, count: items.length },
          { key: 'chat' as const, label: 'Messages', icon: MessageSquare, count: messages.length },
          { key: 'timeline' as const, label: 'Activity', icon: Activity, count: events.length },
        ].map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex-1 justify-center transition-all group ${
              activeTab === key 
                ? 'bg-white text-black shadow-lg' 
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon size={14} className={activeTab === key ? "text-black" : "text-gray-600 group-hover:text-primary transition-colors"} />
            {label}
            <span className={`px-2 py-0.5 rounded-full text-[9px] ${activeTab === key ? 'bg-black/5 text-black' : 'bg-white/5 text-gray-500'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content Panels */}
      <div className="min-h-[600px]">
        {activeTab === 'items' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {items.map((item) => (
              <div
                key={item._id}
                className="premium-card rounded-[2.5rem] group"
              >
                {/* Item Header */}
                <div
                  className="p-8 flex items-center justify-between cursor-pointer relative z-10"
                  onClick={() => setExpandedItem(expandedItem === item._id ? null : item._id)}
                >
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-gray-400 border border-white/5 shadow-inner group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-200">
                      <Package size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight leading-none mb-2">{item.kind.replace(/_/g, ' ')}</h3>
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">PRD-UNIT-{item._id.slice(-4)}</span>
                         <span className="w-1 h-1 rounded-full bg-white/10" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{item.creditsQuoted} Units Allocated</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {item.status === 'DELIVERED' && (
                      <div className="flex gap-2 mr-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleApproveItem(item._id); }}
                          className="px-6 py-2 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_10px_20px_rgba(16,185,129,0.2)] active:scale-95"
                        >
                          Accept
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRequestRevision(item._id); }}
                          className="px-6 py-2 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95"
                        >
                          Revise
                        </button>
                      </div>
                    )}
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-lg",
                      STATUS_COLORS[item.status]
                    )}>
                      {item.status.replace(/_/g, ' ')}
                    </span>
                    <div className={cn(
                      "w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-gray-600 transition-all duration-200 group-hover:text-white group-hover:border-white/20",
                      expandedItem === item._id ? "rotate-180 bg-white/10 text-white" : ""
                    )}>
                      <ChevronDown size={20} />
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedItem === item._id && (
                  <div className="px-8 pb-8 pt-0 border-t border-white/5 animate-in slide-in-from-top-4 duration-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8">
                      {/* Left Side: Parameters & Pricing */}
                      <div className="space-y-10">
                        <section>
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Configuration</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.entries(item.params).map(([key, val]) => (
                              <div key={key} className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-1">{key}</p>
                                <p className="text-sm text-gray-200 font-bold">{String(val)}</p>
                              </div>
                            ))}
                          </div>
                        </section>

                        <section className="p-6 bg-primary/[0.02] border border-primary/10 rounded-2xl shadow-inner">
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Pricing</h4>
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between items-end">
                              <span className="text-[11px] font-black uppercase text-gray-500 tracking-widest">Base Rate</span>
                              <span className="text-xl font-black font-mono text-white leading-none">{item.pricingSnapshot.base} <span className="text-[10px] text-gray-600 ml-1">UNITS</span></span>
                            </div>
                            {item.pricingSnapshot.modifiers.map((mod, i) => (
                              <div key={i} className="flex justify-between items-end">
                                <span className="text-[11px] font-black uppercase text-gray-600 tracking-widest">{mod.label}</span>
                                <span className="text-lg font-black font-mono text-primary/80 leading-none">+{mod.delta}</span>
                              </div>
                            ))}
                            <div className="h-[1px] bg-white/5 my-4" />
                            <div className="flex justify-between items-end">
                              <span className="text-[12px] font-black uppercase text-white tracking-[0.2em]">Net Final</span>
                              <span className="text-4xl font-black font-mono text-primary leading-none shadow-[0_0_30px_rgba(244,63,94,0.15)]">
                                {item.pricingSnapshot.totalCredits}
                              </span>
                            </div>
                          </div>
                        </section>
                      </div>

                      {/* Right Side: Assets Gallery */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                          <div>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Deliverables</h4>
                            <p className="text-[9px] text-gray-500 font-bold uppercase">{item.assets?.length || 0} Files Attached</p>
                          </div>
                          <div className="flex -space-x-2">
                             {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-bg-dark bg-white/5" />)}
                          </div>
                        </div>

                        {item.assets && item.assets.length > 0 ? (
                          <div className="grid grid-cols-2 gap-4">
                            {item.assets.map((asset: any) => {
                              const isImage = asset.mimeType?.startsWith('image/')
                              const isLarge = asset.sizeBytes > 150 * 1024 * 1024

                              return (
                                <div
                                  key={asset._id}
                                  className="group relative bg-black/40 border border-white/5 rounded-3xl overflow-hidden hover:border-primary/40 transition-all duration-200"
                                >
                                  <div className="aspect-[4/3] w-full bg-black/60 flex items-center justify-center relative">
                                    {isImage && !isLarge && asset.url ? (
                                      <img
                                        src={asset.url}
                                        alt={asset.originalName}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                      />
                                    ) : (
                                      <div className="flex flex-col items-center gap-3 text-gray-700 group-hover:text-primary/40 transition-colors">
                                        {asset.mimeType?.includes('video') ? <Video size={32} /> : <FileIcon size={32} />}
                                      </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-3 backdrop-blur-sm">
                                      <a
                                        href={asset.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white text-black rounded-xl transition-all"
                                      >
                                        <ExternalLink size={18} />
                                      </a>
                                      {isImage && !isLarge && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setPreviewAsset(asset); }}
                                          className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl transition-all"
                                        >
                                          <Maximize2 size={18} />
                                        </button>
                                      )}
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleRemoveAsset(item._id, asset._id); }}
                                        className="w-10 h-10 flex items-center justify-center bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500 transition-all"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="p-4 bg-white/[0.01]">
                                    <p className="text-[11px] text-white font-bold truncate mb-1">{asset.originalName}</p>
                                    <div className="flex items-center justify-between opacity-40 text-[9px] font-black uppercase tracking-tighter">
                                      <span>{(asset.sizeBytes / (1024 * 1024)).toFixed(1)}MB</span>
                                      <span className="text-primary">{asset.role}</span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="py-20 border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01] flex flex-col items-center justify-center gap-4 text-gray-600">
                             <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                               <Package size={24} className="opacity-20" />
                             </div>
                             <p className="text-[10px] font-black uppercase tracking-widest">Waiting for fulfillment</p>
                          </div>
                        )}

                        <label className={cn(
                          "group relative flex flex-col items-center justify-center gap-4 border-2 border-dashed border-white/10 rounded-[2rem] py-12 transition-all cursor-pointer overflow-hidden",
                          uploadingItem === item._id ? "opacity-50 pointer-events-none" : "hover:bg-primary/[0.02] hover:border-primary/20"
                        )}>
                          <input type="file" multiple className="hidden" onChange={(e) => handleFileUpload(item._id, e.target.files)} disabled={uploadingItem === item._id} />
                          {uploadingItem === item._id ? (
                            <div className="flex flex-col items-center gap-4">
                               <Loader2 size={32} className="animate-spin text-primary" />
                               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">ENCRYPTING & SYNCING...</span>
                            </div>
                          ) : (
                            <>
                               <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all shadow-2xl">
                                  <UploadCloud size={24} />
                               </div>
                               <div className="text-center">
                                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white mb-1">Upload New Asset</p>
                                  <p className="text-[9px] font-bold text-gray-600 uppercase">Max 2GB per file · PDF, MOV, MP4, PNG</p>
                               </div>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="premium-card rounded-[3rem] overflow-hidden flex flex-col h-[700px] animate-in slide-in-from-right-8 duration-200 shadow-2xl">
            <div className="bg-white/[0.02] p-6 border-b border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                     <MessageSquare size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white">Project Messages</h3>
                    <p className="text-[9px] font-bold text-gray-500 uppercase">Discussion related to this order</p>
                  </div>
               </div>
               <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-4 border-bg-dark bg-white/5 shadow-2xl" />
                  ))}
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-10">
                   <MessageSquare size={80} className="mb-6" />
                   <p className="text-2xl font-black uppercase tracking-[0.5em]">No Signal</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = msg.senderId?._id === (auth?.user as any)?._id
                  const showHeader = i === 0 || messages[i - 1].senderId?._id !== msg.senderId?._id
                  
                  return (
                    <div key={msg._id} className={cn(
                      "flex flex-col group animate-in fade-in duration-200",
                      isMine ? "items-end" : "items-start"
                    )}>
                      {!isMine && showHeader && (
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-2 ml-4">
                           {msg.senderId?.name}
                        </span>
                      )}
                      <div className={cn(
                        "group relative px-6 py-4 max-w-[65%] shadow-2xl transition-all duration-300",
                        isMine 
                          ? "bg-primary text-white rounded-[1.5rem] rounded-tr-[0.2rem] shadow-primary/10 hover:shadow-primary/20" 
                          : "bg-white/5 text-gray-200 rounded-[1.5rem] rounded-tl-[0.2rem] border border-white/5"
                      )}>
                        <p className="text-sm leading-relaxed font-semibold">{msg.content}</p>
                        <span className={cn(
                          "absolute top-full mt-2 text-[8px] font-black uppercase tracking-widest opacity-30",
                          isMine ? "right-0" : "left-0"
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
            
            <form onSubmit={handleSendMessage} className="p-6 bg-white/[0.01] border-t border-white/5">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Communicate mission objectives..."
                  className="w-full bg-white/5 rounded-[2rem] pl-8 pr-20 py-6 text-sm text-white placeholder-gray-700 outline-none border border-white/10 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="absolute right-3 w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 disabled:opacity-20 transition-all shadow-2xl active:scale-90"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="premium-card rounded-[3rem] p-12 shadow-2xl animate-in slide-in-from-left-8 duration-200">
            <div className="max-w-3xl mx-auto">
              {events && events.length > 0 ? (
                <div className="relative border-l-2 border-white/5 pl-12 space-y-16">
                  {events.map((event) => (
                    <div key={event._id} className="relative group">
                      <div className="absolute -left-[61px] top-0 w-6 h-6 rounded-full bg-bg-dark border-[6px] border-white/5 group-hover:border-primary transition-colors duration-200 z-10 shadow-2xl" />
                      
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xl font-black text-white italic tracking-tighter uppercase">{event.type?.replace(/_/g, ' ') || 'EVENT'}</span>
                          <span className="text-[10px] font-mono text-gray-600 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                            {event.createdAt ? new Date(event.createdAt).toLocaleString() : 'Date Unknown'}
                          </span>
                        </div>
                        <div className="h-[1px] w-12 bg-primary/20 mb-6" />
                      </div>

                      {event.data && Object.keys(event.data).length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white/[0.01] p-8 rounded-[2rem] border border-white/5 shadow-inner">
                          {Object.entries(event.data).map(([key, val]) => (
                            <div key={key} className="space-y-1">
                              <span className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
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
              ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                   <Activity size={48} className="mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-[0.5em]">No Activity Logged</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cinematic Asset Preview */}
      {previewAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12 animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-black/95 backdrop-blur-lg" onClick={() => setPreviewAsset(null)} />
          
          <div className="relative w-full max-w-7xl h-full flex flex-col gap-8 animate-in zoom-in-95 duration-200">
            <div className="flex-1 rounded-[3rem] overflow-hidden border border-white/10 bg-black shadow-[0_0_120px_rgba(0,0,0,1)] relative flex items-center justify-center ring-1 ring-white/10 ring-inset">
               <img
                  src={previewAsset.url}
                  alt={previewAsset.originalName}
                  className="max-w-full max-h-full object-contain p-4 select-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                />
                
                <button
                  onClick={() => setPreviewAsset(null)}
                  className="absolute top-8 right-8 w-14 h-14 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-white transition-all hover:rotate-90 active:scale-90"
                >
                  <X size={28} />
                </button>
            </div>

            <div className="premium-card p-8 rounded-[2.5rem] border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 translate-y-0 shadow-2xl">
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                  <Maximize2 size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white tracking-tighter mb-2">{previewAsset.originalName}</h3>
                  <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-gray-500">
                    <span className="bg-white/5 px-3 py-1 rounded-lg border border-white/5">{(previewAsset.sizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-primary">{previewAsset.mimeType}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <a
                  href={previewAsset.url}
                  download={previewAsset.originalName}
                  className="flex-1 md:flex-none flex items-center justify-center gap-4 px-12 py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:bg-gray-200 hover:translate-y-[-2px] active:translate-y-0 active:scale-95"
                >
                  <Download size={18} />
                  Secure Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as orderApi from '../services/orderService'
import * as creditApi from '../services/creditService'
import * as uploadApi from '../services/uploadService'
import {
  ArrowLeft, ArrowRight, PlaySquare, Image, PlayCircle, StopCircle, Mic,
  FileText, Search, Layout, PenTool, LayoutGrid, Phone, Eye, MessageSquare,
  Plus, X, Info, Link as LinkIcon, Loader2
} from 'lucide-react'

// ─── Constants & Types ──────────────────────────────────────────

const SERVICE_CATALOG = [
  { kind: 'VIDEO_EDIT', label: 'Video', icon: PlaySquare, desc: '20 credits per minute of raw footage (min. 100 credits)', minCredits: 100 },
  { kind: 'THUMBNAIL', label: 'Thumbnail Design', icon: Image, desc: '50 credits per thumbnail', minCredits: 50 },
  { kind: 'INTRO', label: 'Custom Intro', icon: PlayCircle, desc: 'Starting at 100 credits', minCredits: 100 },
  { kind: 'OUTRO', label: 'Custom Outro', icon: StopCircle, desc: 'Starting at 100 credits', minCredits: 100 },
  { kind: 'VOICEOVER', label: 'AI Voiceover', icon: Mic, desc: '10 credits per minute (min. 50 credits)', minCredits: 50 },
  { kind: 'SCRIPT', label: 'Script Writing', icon: FileText, desc: '100 credits per 500 words', minCredits: 100 },
  { kind: 'SEO', label: 'Video SEO', icon: Search, desc: '100 credits per video', minCredits: 100 },
  { kind: 'CHANNEL_BANNER', label: 'Channel Banner', icon: Layout, desc: '150 credits', minCredits: 150 },
  { kind: 'LOGO_DESIGN', label: 'Logo Design', icon: PenTool, desc: '100 credits', minCredits: 100 },
  { kind: 'IMAGE_RETOUCHING', label: 'Image Retouching', icon: LayoutGrid, desc: '100 credits', minCredits: 100 },
  { kind: 'CONSULTATION', label: 'Consultation Call', icon: Phone, desc: '100 credits per 15 minutes', minCredits: 100 },
  { kind: 'FOOTAGE_REVIEW', label: 'Footage Review', icon: Eye, desc: '10 credits per minute (min. 50 credits)', minCredits: 50 },
  { kind: 'CUSTOM', label: 'Custom Request', icon: MessageSquare, desc: 'Let us know what you need', minCredits: 0 },
]

type DraftItem = {
  tempId: string
  kind: string
  params: any
  files: File[]
}

const STEPS = [
  { id: 'start', label: 'Start your order' },
  { id: 'packages', label: 'Select packages' },
  { id: 'details', label: 'Finalize details' },
  { id: 'confirm', label: 'Confirm order' },
]

// ─── Frontend Pricing Estimator ────────────────────────────────

function estimateCredits(item: DraftItem): number {
  const params = item.params || {}
  const cat = SERVICE_CATALOG.find(s => s.kind === item.kind)
  let base = cat?.minCredits || 0

  if (item.kind === 'VIDEO_EDIT') {
    base = Math.max(100, (params.rawFootageLength || 0) * 20)
    if (params.hasRawFootage === false) base += 100
    if (params.addBroll === true) base += 100
  } else if (item.kind === 'VOICEOVER') {
    base = Math.max(50, (params.scriptLength || 0) * 10)
  } else if (item.kind === 'SCRIPT') {
    const words = params.wordCount || 0
    base = Math.max(100, Math.ceil(words / 500) * 100)
  } else if (item.kind === 'CONSULTATION') {
    const mins = params.duration || 15
    base = Math.max(100, Math.ceil(mins / 15) * 100)
  } else if (item.kind === 'FOOTAGE_REVIEW') {
    base = Math.max(50, (params.footageLength || 0) * 10)
  }
  return base
}

// ─── Main Component ──────────────────────────────────────────────

export default function NewOrderPage() {
  const navigate = useNavigate()
  
  // View State
  const [stepIndex, setStepIndex] = useState(0)

  // Order State
  const [title, setTitle] = useState('')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [draftItems, setDraftItems] = useState<DraftItem[]>([])
  
  // Wallet / Server State
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [, setUploadProgress] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  
  // After API creation
  const [confirmedTotal, setConfirmedTotal] = useState(0)

  useEffect(() => {
    creditApi.getWallet().then((w) => setBalance(w.balance))
  }, [])

  const getItemCountByKind = (kind: string) => {
    return draftItems.filter(i => i.kind === kind).length
  }

  const handleNext = async () => {
    setError(null)
    
    // Step 0 -> 1 (Create Order)
    if (stepIndex === 0) {
      if (!title.trim()) {
        setError('Please enter an order title')
        return
      }
      if (!orderId) {
        setLoading(true)
        try {
          const order = await orderApi.createOrder(title)
          setOrderId(order._id)
          setStepIndex(1)
        } catch (err: any) {
          setError(err?.response?.data?.error || err.message)
        } finally {
          setLoading(false)
        }
      } else {
        setStepIndex(1)
      }
      return
    }

    // Step 1 -> 2 (Select -> Finalize)
    if (stepIndex === 1) {
      if (draftItems.length === 0) {
        setError('Please select at least one package.')
        return
      }
      setStepIndex(2)
      return
    }

    // Step 2 -> 3 (Finalize -> Create Items on Server -> Confirm)
    if (stepIndex === 2) {
      if (!orderId) return
      setLoading(true)
      try {
        let cumulativeCredits = 0
        for (const draft of draftItems) {
          const assetIds: string[] = []
          
          // Upload files if any
          if (draft.files.length > 0) {
            setUploading(true)
            for (const file of draft.files) {
              const assetId = await uploadApi.uploadFile(file, (pct) => {
                setUploadProgress(prev => ({ ...prev, [file.name]: pct }))
              })
              assetIds.push(assetId)
            }
            setUploading(false)
          }

          const added = await orderApi.addItem(orderId, draft.kind, draft.params, [], assetIds)
          cumulativeCredits += added.creditsQuoted
        }
        setConfirmedTotal(cumulativeCredits)
        setStepIndex(3)
      } catch (err: any) {
        let msg = err?.response?.data?.error || err.message
        if (typeof msg === 'object') msg = JSON.stringify(msg)
        setError(`Failed to save items or upload files: ${msg}`)
      } finally {
        setLoading(false)
        setUploading(false)
      }
      return
    }

    // Step 3 (Confirm -> Submit)
    if (stepIndex === 3) {
      if (!orderId) return
      setLoading(true)
      try {
        await orderApi.submitOrder(orderId)
        navigate(`/orders/${orderId}`)
      } catch (err: any) {
        setError(err?.response?.data?.error || err.message)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleAddPackage = (kind: string) => {
    const initialParams: any = {}
    
    // Default form values based on design
    if (kind === 'VIDEO_EDIT') {
      initialParams.hasRawFootage = true
      initialParams.outputRatio = '16:9'
      initialParams.rawFootageLength = 30
      initialParams.desiredLength = 5
      initialParams.addBroll = false
      initialParams.tone = ''
      initialParams.pace = ''
    } else if (kind === 'CONSULTATION') {
      initialParams.duration = 15
    }
    
    setDraftItems([...draftItems, {
      tempId: Math.random().toString(36).substr(2, 9),
      kind,
      params: initialParams,
      files: []
    }])
  }

  const handleRemovePackage = (tempId: string) => {
    setDraftItems(draftItems.filter(i => i.tempId !== tempId))
  }

  const updateDraftParam = (tempId: string, key: string, value: any) => {
    setDraftItems(draftItems.map(item => {
      if (item.tempId === tempId) {
        return { ...item, params: { ...item.params, [key]: value } }
      }
      return item
    }))
  }

  const totalEstimatedCredits = draftItems.reduce((sum, item) => sum + estimateCredits(item), 0)
  const canAfford = balance >= (stepIndex === 3 ? confirmedTotal : totalEstimatedCredits)

  return (
    <div className="bg-bg-dark min-h-screen -m-6 p-6 text-white relative overflow-hidden">
      {/* Premium Background Textures */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-6 relative z-10">
        
        {/* Top Header / Back Button */}
        <div className="flex items-center gap-2 mb-8 animate-in fade-in slide-in-from-top-4 duration-200">
          <button onClick={() => {
            if (stepIndex > 0 && stepIndex < 3) setStepIndex(stepIndex - 1)
            else navigate('/orders')
          }} className="p-2.5 bg-bg-card/40 border border-white/5 hover:bg-white/5 rounded-xl text-primary transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="ml-2">
            <h1 className="text-2xl font-bold tracking-tight">New Order</h1>
            <p className="text-sm text-gray-400">Step {stepIndex + 1} of {STEPS.length}</p>
          </div>
        </div>

        {/* Wizard Progress Bar */}
        <div className="bg-bg-card/40 backdrop-blur-lg rounded-2xl border border-white/5 p-5 shadow-2xl">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-8 right-8 top-1 h-[1px] bg-white/5 -z-10"></div>
            {STEPS.map((s, idx) => (
              <div key={s.id} className="flex-1 text-center relative z-10">
                <div className={`mx-auto w-12 h-1.5 rounded-full transition-all duration-200 ${stepIndex >= idx ? 'bg-primary shadow-[0_0_12px_rgba(59,130,246,0.5)]' : 'bg-white/10'}`}></div>
                <div className={`mt-3 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${stepIndex >= idx ? 'text-white' : 'text-gray-500'}`}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 flex items-center gap-3 animate-in shake duration-200">
            <Info size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* ─── STEP 0: START ──────────────────────────────────────────── */}
        {stepIndex === 0 && (
          <div className="bg-bg-card/40 backdrop-blur-lg rounded-2xl border border-white/5 p-10 space-y-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">What should we call this order?</h2>
              <p className="text-gray-400">Give your project a name to keep things organized.</p>
            </div>
            <div className="relative group">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Spring Campaign Video, MrBeast Style Edit..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white text-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-gray-500"
                autoFocus
              />
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={handleNext}
                disabled={loading || !title.trim()}
                className="bg-primary hover:bg-blue-600 active:scale-95 text-white disabled:opacity-50 disabled:active:scale-100 px-10 py-4 rounded-xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-primary/20"
              >
                {loading ? 'Creating...' : <>Continue <ArrowRight size={20} /></>}
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 1: SELECT PACKAGES ─────────────────────────────────── */}
        {stepIndex === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight">Choose your services</h2>
                <p className="text-gray-400">Select one or more packages to add to your order.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {SERVICE_CATALOG.map((pkg, i) => {
                const Icon = pkg.icon
                const count = getItemCountByKind(pkg.kind)
                return (
                  <div 
                    key={pkg.kind} 
                    className="premium-card bg-bg-card/40 group relative overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-200"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-200">
                          <Icon size={24} />
                        </div>
                        {count > 0 && (
                          <div className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded-full border border-primary/30 animate-pulse">
                            {count} {count === 1 ? 'Item' : 'Items'}
                          </div>
                        )}
                      </div>
                      
                      <h3 className="font-bold text-lg mb-2">{pkg.label}</h3>
                      <p className="text-sm text-gray-400 mb-8 line-clamp-2">{pkg.desc}</p>
                      
                      <button
                        onClick={() => handleAddPackage(pkg.kind)}
                        className="mt-auto w-full py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-primary hover:border-primary text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <Plus size={18} /> {count > 0 ? `Add ${pkg.label} (${count})` : `Add ${pkg.label}`}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── STEP 2: FINALIZE DETAILS ────────────────────────────────── */}
        {stepIndex === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h2 className="text-3xl font-bold tracking-tight">Configure details</h2>
            
            {draftItems.map((item, idx) => {
              const cat = SERVICE_CATALOG.find(c => c.kind === item.kind)!
              return (
                <div key={item.tempId} className="bg-bg-card/40 backdrop-blur-lg rounded-2xl border border-white/5 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 duration-200" style={{ animationDelay: `${idx * 100}ms` }}>
                  
                  {/* Card Header */}
                  <div className="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <cat.icon size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{cat.label}</h3>
                        <p className="text-xs text-gray-400 font-medium">#{item.tempId.toUpperCase()}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemovePackage(item.tempId)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="p-8 space-y-10">
                    
                    {/* VIDEO EDIT SPECIFIC FORM */}
                    {item.kind === 'VIDEO_EDIT' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          {/* Raw Footage */}
                          <div className="space-y-4">
                            <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider block">Raw Footage</label>
                            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                              <button
                                onClick={() => updateDraftParam(item.tempId, 'hasRawFootage', true)}
                                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${item.params.hasRawFootage ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:text-white'}`}
                              >
                                I have it
                              </button>
                              <button
                                onClick={() => updateDraftParam(item.tempId, 'hasRawFootage', false)}
                                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${item.params.hasRawFootage === false ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:text-white'}`}
                              >
                                Need it (+100)
                              </button>
                            </div>
                          </div>

                          {/* Output Ratio */}
                          <div className="space-y-4">
                            <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider block">Aspect Ratio</label>
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                { id: '16:9', label: '16:9', icon: PlaySquare },
                                { id: '9:16', label: '9:16', icon: Layout },
                                { id: '1:1', label: '1:1', icon: LayoutGrid },
                                { id: 'Other', label: '??', icon: Plus },
                              ].map(ratio => (
                                <button
                                  key={ratio.id}
                                  onClick={() => updateDraftParam(item.tempId, 'outputRatio', ratio.id)}
                                  className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${item.params.outputRatio === ratio.id ? 'bg-primary/20 border-primary text-white' : 'bg-black/20 border-white/10 text-gray-500 hover:bg-white/5 hover:border-white/20'}`}
                                >
                                  <ratio.icon size={18} />
                                  <span className="text-[10px] font-bold">{ratio.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Lengths */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Raw Length (mins)</label>
                            <input
                              type="number" min={1}
                              value={item.params.rawFootageLength || ''}
                              onChange={e => updateDraftParam(item.tempId, 'rawFootageLength', Number(e.target.value))}
                              className="w-full bg-transparent border-b border-white/10 py-3 text-xl font-bold focus:border-primary focus:outline-none transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Final Length (mins)</label>
                            <input
                              type="number" min={1}
                              value={item.params.desiredLength || ''}
                              onChange={e => updateDraftParam(item.tempId, 'desiredLength', Number(e.target.value))}
                              className="w-full bg-transparent border-b border-white/10 py-3 text-xl font-bold focus:border-primary focus:outline-none transition-colors"
                            />
                          </div>
                        </div>

                        {/* Tone & Pace Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                           {/* Visual Tone */}
                           <div className="space-y-4">
                              <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider block">Visual Tone</label>
                              <div className="grid grid-cols-3 gap-2">
                                {['Funny', 'Serious', 'Professional', 'Elegant', 'Casual', 'Informational'].map(t => (
                                  <button 
                                    key={t} 
                                    onClick={() => updateDraftParam(item.tempId, 'tone', t)}
                                    className={`px-2 py-3 rounded-xl text-[11px] font-bold border transition-all ${item.params.tone === t ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10'}`}
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                           </div>

                           {/* Edit Pace */}
                           <div className="space-y-4">
                              <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider block">Edit Pace</label>
                              <div className="grid grid-cols-4 gap-2">
                                {[
                                  { id: 'Slow', label: 'Slow', icon: '🐢' },
                                  { id: 'Normal', label: 'Medium', icon: '⚡️' },
                                  { id: 'Fast', label: 'Fast', icon: '🔥' },
                                  { id: 'Super', label: 'Super', icon: '🚀' },
                                ].map(p => (
                                  <button 
                                    key={p.id} 
                                    onClick={() => updateDraftParam(item.tempId, 'pace', p.id)}
                                    className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${item.params.pace === p.id ? 'bg-primary/20 border-primary text-white' : 'bg-black/20 border-white/10 text-gray-500 hover:bg-white/5 hover:border-white/20'}`}
                                  >
                                    <span className="text-lg">{p.icon}</span>
                                    <span className="text-[10px] font-bold uppercase">{p.label}</span>
                                  </button>
                                ))}
                              </div>
                           </div>
                        </div>
                      </>
                    )}

                    {/* THUMBNAIL DESIGN */}
                    {item.kind === 'THUMBNAIL' && (
                      <div className="space-y-6">
                        <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider block">Design Style</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                          {['Exaggerated', 'Headshot', 'Quote', 'Statement', 'Before & After', 'Versus', 'Process', 'No Text', 'Other'].map(style => (
                            <button key={style} onClick={() => updateDraftParam(item.tempId, 'style', style)}
                              className={`p-1.5 rounded-xl border flex flex-col gap-2 transition-all group ${item.params.style === style ? 'bg-primary/20 border-primary' : 'bg-black/40 border-white/5 hover:border-white/20'}`}>
                              <div className="aspect-video bg-white/5 rounded-lg flex items-center justify-center text-white/20 group-hover:bg-white/10 transition-colors">
                                <Image size={24} />
                              </div>
                              <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-center">{style}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SHARED UPLOAD SECTION */}
                    <div className="space-y-6 pt-4 border-t border-white/5">
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider block">Assets & Resources</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <label className="relative flex flex-col items-center justify-center p-8 bg-black/40 border-2 border-dashed border-white/5 rounded-2xl hover:bg-white/[0.02] hover:border-primary/50 transition-all cursor-pointer group">
                             <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                               const selectedFiles = e.target.files;
                               if (selectedFiles) {
                                 const newFiles = Array.from(selectedFiles)
                                 setDraftItems(draftItems.map(di => di.tempId === item.tempId ? { ...di, files: [...di.files, ...newFiles] } : di))
                               }
                             }} />
                             <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
                               <Plus size={24} />
                             </div>
                             <span className="font-bold text-sm">Upload Files</span>
                             <span className="text-xs text-gray-500 mt-1">Raw, music, references</span>
                           </label>

                           <button onClick={() => updateDraftParam(item.tempId, 'showLinkInput', !item.params.showLinkInput)} 
                             className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all ${item.params.showLinkInput ? 'bg-primary/10 border-primary/50 text-white' : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/10'}`}>
                             <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                               <LinkIcon size={24} />
                             </div>
                             <span className="font-bold text-sm">External Link</span>
                             <span className="text-xs opacity-70 mt-1">Drive, Dropbox, etc.</span>
                           </button>
                        </div>
                      </div>

                      {item.params.showLinkInput && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                          <input type="url" placeholder="https://..." value={item.params.uploadLink || ''} onChange={e => updateDraftParam(item.tempId, 'uploadLink', e.target.value)} 
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-gray-500" />
                        </div>
                      )}

                      {/* File Queue */}
                      {item.files?.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                           {item.files.map((file, i) => (
                             <div key={i} className="flex items-center gap-3 bg-white/[0.03] border border-white/5 p-3 rounded-xl animate-in fade-in zoom-in-95">
                               <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-gray-500">
                                 <FileText size={18} />
                               </div>
                               <div className="flex-1 min-w-0">
                                 <div className="text-[13px] font-bold truncate">{file.name}</div>
                                 <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
                               </div>
                               <button onClick={() => setDraftItems(draftItems.map(di => di.tempId === item.tempId ? { ...di, files: di.files.filter((_, idx) => idx !== i) } : di))}
                                 className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                                 <X size={14} />
                               </button>
                             </div>
                           ))}
                        </div>
                      )}

                      <textarea rows={3} placeholder="Add any special instructions..." value={item.params.notes || ''} onChange={e => updateDraftParam(item.tempId, 'notes', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition resize-none placeholder:text-gray-600" />
                    </div>
                  </div>

                  {/* Pricing Footer */}
                  <div className="bg-bg-dark/40 border-t border-white/5 p-8 flex items-center justify-between">
                     <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Subtotal</span>
                        <div className="text-2xl font-bold text-white flex items-center gap-2">
                           {estimateCredits(item)} <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">Credits</span>
                        </div>
                     </div>
                     <div className="text-xs text-gray-500 max-w-[200px] text-right">
                        This is an automated estimate. Final credit total will be confirmed in the next step.
                     </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ─── STEP 3: CONFIRM ──────────────────────────────────────────── */}
        {stepIndex === 3 && (
          <div className="bg-bg-card/40 backdrop-blur-lg rounded-2xl border border-white/10 p-10 space-y-10 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(59,130,246,0.15)] animate-bounce">
                <Plus size={40} />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Review & Submit</h2>
              <p className="text-gray-400 font-medium">Almost there! Your project is ready for lift-off.</p>
            </div>

            <div className="bg-black/20 rounded-2xl border border-white/5 p-6 space-y-4">
              {draftItems.map(item => (
                <div key={item.tempId} className="flex justify-between items-center py-3 border-b border-white/[0.02] last:border-0 uppercase tracking-widest text-[11px] font-bold">
                  <span className="text-gray-400">{SERVICE_CATALOG.find(c => c.kind === item.kind)?.label}</span>
                  <span className="text-white">{estimateCredits(item)} Credits</span>
                </div>
              ))}
              <div className="pt-4 flex justify-between items-center border-t border-white/10">
                 <span className="text-sm font-bold">TO PAY</span>
                 <span className="text-3xl font-black text-primary">{confirmedTotal} <span className="text-xs font-bold opacity-50">CREDITS</span></span>
              </div>
            </div>

            <div className={`p-5 rounded-2xl flex items-center gap-4 border transition-all ${canAfford ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${canAfford ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                 <Info size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black uppercase">{canAfford ? 'Balance Sufficient' : 'Insufficient Balance'}</p>
                <p className="text-[11px] font-bold opacity-70 tracking-widest uppercase">Wallet: {balance} • Required: {confirmedTotal}</p>
              </div>
              {!canAfford && (
                <button onClick={() => navigate('/wallet')} className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase px-4 py-2 rounded-lg transition-all">Top Up</button>
              )}
            </div>
          </div>
        )}


        {/* ─── FLOATING BOTTOM BAR ────────────────────────────────────── */}
        {stepIndex > 0 && (
          <div className="sticky bottom-6 mt-8 bg-bg-card/40 backdrop-blur-lg border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-2xl p-4 pl-8 flex items-center justify-between animate-in slide-in-from-bottom-10 duration-200">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Estimated Total</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">
                  {stepIndex === 3 ? confirmedTotal : totalEstimatedCredits}
                </span>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Credits</span>
              </div>
            </div>
            
            <button
              onClick={handleNext}
              disabled={loading || uploading || (stepIndex === 1 && draftItems.length === 0) || (stepIndex === 3 && !canAfford)}
              className="group relative bg-primary hover:bg-blue-600 text-white disabled:opacity-20 disabled:grayscale disabled:scale-100 px-10 py-4 rounded-xl font-black uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95 shadow-xl shadow-primary/20"
            >
              <div className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-xl" />
              <span className="relative">
                {uploading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 size={18} className="animate-spin" />
                    <span>Syncing Assets</span>
                  </div>
                ) : loading ? (
                   <div className="flex items-center gap-3">
                    <Loader2 size={18} className="animate-spin" />
                    <span>Processing</span>
                  </div>
                ) : stepIndex === 3 ? (
                  `Submit Order`
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Next Step</span>
                    <ArrowRight size={18} />
                  </div>
                )}
              </span>
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

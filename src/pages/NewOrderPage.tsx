import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as orderApi from '../services/orderService'
import * as creditApi from '../services/creditService'
import * as uploadApi from '../services/uploadService'
import {
  ArrowLeft, ArrowRight, PlaySquare, Image, PlayCircle, StopCircle, Mic,
  FileText, Search, Layout, PenTool, LayoutGrid, Phone, Eye, MessageSquare,
  Plus, X, Info, UploadCloud, Link as LinkIcon, Loader2
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
  const currentStep = STEPS[stepIndex]

  // Order State
  const [title, setTitle] = useState('')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [draftItems, setDraftItems] = useState<DraftItem[]>([])
  
  // Wallet / Server State
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  
  // After API creation
  const [confirmedTotal, setConfirmedTotal] = useState(0)

  useEffect(() => {
    creditApi.getWallet().then((w) => setBalance(w.balance))
  }, [])

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
    const cat = SERVICE_CATALOG.find(c => c.kind === kind)
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
    <div className="bg-[#f8f9fa] min-h-screen -m-6 p-6 text-gray-800">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Header / Back Button */}
        <div className="flex items-center gap-2 mb-8">
          <button onClick={() => {
            if (stepIndex > 0 && stepIndex < 3) setStepIndex(stepIndex - 1)
            else navigate('/orders')
          }} className="p-2 hover:bg-gray-200 rounded-lg text-primary transition">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">New Order</h1>
        </div>

        {/* Wizard Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between relative">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-100 -z-10 -translate-y-1/2"></div>
            {STEPS.map((s, idx) => (
              <div key={s.id} className="flex-1 text-center relative z-10 transition-all">
                <div className={`mx-auto w-full h-1 ${stepIndex >= idx ? 'bg-primary' : 'bg-transparent'}`}></div>
                <div className={`mt-2 text-sm font-medium ${stepIndex >= idx ? 'text-primary' : 'text-gray-400'}`}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 flex items-center gap-3">
            <Info size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* ─── STEP 0: START ──────────────────────────────────────────── */}
        {stepIndex === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-6">
            <h2 className="text-xl font-bold text-gray-900">What should we call this order?</h2>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Spring Campaign Video, MrBeast Style Edit..."
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              autoFocus
            />
          </div>
        )}

        {/* ─── STEP 1: SELECT PACKAGES ─────────────────────────────────── */}
        {stepIndex === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">What can we do for you?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {SERVICE_CATALOG.map((pkg) => {
                const Icon = pkg.icon
                return (
                  <div key={pkg.kind} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                        <Icon size={20} />
                      </div>
                      <Info size={16} className="text-gray-400 cursor-pointer" />
                    </div>
                    
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{pkg.label}</h3>
                    <p className="text-sm text-gray-500 mb-6 flex-1">{pkg.desc}</p>
                    
                    <button
                      onClick={() => handleAddPackage(pkg.kind)}
                      className="w-full py-2.5 rounded-lg border border-primary text-primary hover:bg-primary/5 font-medium flex items-center justify-center gap-2 transition"
                    >
                      <Plus size={16} /> Add {pkg.label}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── STEP 2: FINALIZE DETAILS ────────────────────────────────── */}
        {stepIndex === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Configure your packages</h2>
            
            {draftItems.map((item, idx) => {
              const cat = SERVICE_CATALOG.find(c => c.kind === item.kind)!
              return (
                <div key={item.tempId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  
                  {/* Card Header */}
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{cat.label}</h3>
                      <p className="text-sm text-gray-500">{cat.desc}</p>
                    </div>
                    <button 
                      onClick={() => handleRemovePackage(item.tempId)}
                      className="text-gray-400 hover:text-red-500 flex items-center gap-1 text-sm font-medium transition"
                    >
                      <X size={16} /> Remove
                    </button>
                  </div>

                  {/* Card Body - Dynamically Rendered Form */}
                  <div className="p-6 space-y-8">
                    
                    {/* VIDEO EDIT SPECIFIC FORM */}
                    {item.kind === 'VIDEO_EDIT' && (
                      <>
                        {/* Raw Footage Toggle */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
                            Do you have raw footage? <Info size={14} className="text-gray-400"/>
                          </label>
                          <div className="flex gap-3">
                            <button
                              onClick={() => updateDraftParam(item.tempId, 'hasRawFootage', true)}
                              className={`px-4 py-2 rounded-full text-sm font-medium border transition ${item.params.hasRawFootage ? 'bg-primary/10 border-primary text-primary' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}
                            >
                              Yes, I have raw footage
                            </button>
                            <button
                              onClick={() => updateDraftParam(item.tempId, 'hasRawFootage', false)}
                              className={`px-4 py-2 rounded-full text-sm font-medium border transition ${item.params.hasRawFootage === false ? 'bg-primary/10 border-primary text-primary' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}
                            >
                              No, need footage (+100 credits)
                            </button>
                          </div>
                        </div>

                        {/* Output Ratio */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
                            Desired output ratio <Info size={14} className="text-gray-400"/>
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                              { id: '16:9', label: 'Horizontal (16:9)', icon: PlaySquare },
                              { id: '9:16', label: 'Vertical (9:16)', icon: Layout },
                              { id: '1:1', label: 'Square (1:1)', icon: LayoutGrid },
                              { id: 'Other', label: 'Other', icon: Plus },
                            ].map(ratio => (
                              <button
                                key={ratio.id}
                                onClick={() => updateDraftParam(item.tempId, 'outputRatio', ratio.id)}
                                className={`p-4 rounded-xl border text-left transition ${item.params.outputRatio === ratio.id ? 'border-primary ring-1 ring-primary' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                              >
                                <ratio.icon size={24} className={item.params.outputRatio === ratio.id ? 'text-primary' : 'text-primary'} />
                                <div className={`mt-3 font-medium ${item.params.outputRatio === ratio.id ? 'text-primary' : 'text-gray-900'}`}>{ratio.label}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Lengths */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Raw footage length (minutes)</label>
                            <input
                              type="number" min={1}
                              value={item.params.rawFootageLength || ''}
                              onChange={e => updateDraftParam(item.tempId, 'rawFootageLength', Number(e.target.value))}
                              className="w-full border-b border-gray-300 py-2 focus:border-primary outline-none transition bg-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Desired final video length (minutes)</label>
                            <input
                              type="number" min={1}
                              value={item.params.desiredLength || ''}
                              onChange={e => updateDraftParam(item.tempId, 'desiredLength', Number(e.target.value))}
                              className="w-full border-b border-gray-300 py-2 focus:border-primary outline-none transition bg-transparent"
                            />
                          </div>
                        </div>

                        {/* B-Roll */}
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={item.params.addBroll || false}
                            onChange={e => updateDraftParam(item.tempId, 'addBroll', e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-gray-700 font-medium">Add additional B-roll footage (+100 credits)</span>
                        </label>

                        {/* Tone & Pace */}
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-3">Tone & pace</label>
                          <div className="flex flex-wrap gap-3">
                            {['Funny', 'Serious', 'Professional', 'Elegant', 'Casual', 'Informational'].map(t => (
                              <button key={t} onClick={() => updateDraftParam(item.tempId, 'tone', t)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border transition ${item.params.tone === t ? 'bg-blue-50 border-blue-200 text-primary' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                {t}
                              </button>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-3 mt-3">
                            {['Slow', 'Normal', 'Fast', 'Super'].map(p => (
                              <button key={p} onClick={() => updateDraftParam(item.tempId, 'pace', p)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border transition ${item.params.pace === p ? 'bg-blue-50 border-blue-200 text-primary' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* THUMBNAIL DESIGN SPECIFIC FORM */}
                    {item.kind === 'THUMBNAIL' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">Thumbnail Style</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {['MrBeast Exaggerated', 'Headshot', 'Quote', 'Statement / Fact', 'Before & After', 'Versus / Comparison', 'Process Shot', 'No Text', 'Other'].map(style => (
                            <button key={style} onClick={() => updateDraftParam(item.tempId, 'style', style)}
                              className={`p-1 rounded-xl border text-center transition overflow-hidden group ${item.params.style === style ? 'border-primary ring-2 ring-primary' : 'border-gray-200 hover:border-gray-300'}`}>
                              <div className="h-28 bg-gray-100 mb-2 flex flex-col items-center justify-center text-gray-400 rounded-lg group-hover:bg-gray-200 transition">
                                <Image size={32} />
                                <span className="text-xs mt-2">Placeholder</span>
                              </div>
                              <div className="py-2 px-1 text-sm font-medium text-gray-900 truncate">{style}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SCRIPT WRITING */}
                    {item.kind === 'SCRIPT' && (
                      <div className="grid grid-cols-1 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">Word Count</label>
                          <input type="number" min={50} value={item.params.wordCount || ''} onChange={e => updateDraftParam(item.tempId, 'wordCount', Number(e.target.value))} className="w-full border-b border-gray-300 py-2 focus:border-primary outline-none transition bg-transparent" />
                        </div>
                      </div>
                    )}

                    {/* VOICEOVER & FOOTAGE_REVIEW */}
                    {(item.kind === 'VOICEOVER' || item.kind === 'FOOTAGE_REVIEW') && (
                      <div className="grid grid-cols-1 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">Length (minutes)</label>
                          <input type="number" min={1} value={item.params.scriptLength || item.params.footageLength || ''} onChange={e => updateDraftParam(item.tempId, item.kind === 'VOICEOVER' ? 'scriptLength' : 'footageLength', Number(e.target.value))} className="w-full border-b border-gray-300 py-2 focus:border-primary outline-none transition bg-transparent" />
                        </div>
                      </div>
                    )}

                    {/* CONSULTATION */}
                    {item.kind === 'CONSULTATION' && (
                      <div className="grid grid-cols-1 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">Duration (minutes)</label>
                          <select value={item.params.duration || 15} onChange={e => updateDraftParam(item.tempId, 'duration', Number(e.target.value))} className="w-full border-b border-gray-300 py-2 focus:border-primary outline-none transition bg-transparent">
                            <option value={15}>15 Minutes</option>
                            <option value={30}>30 Minutes</option>
                            <option value={45}>45 Minutes</option>
                            <option value={60}>60 Minutes</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* ALWAYS SHOW UPLOAD ASSETS SECTION */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-3">Upload assets & additional notes</label>
                      <label className="border border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition cursor-pointer mb-2 relative">
                        <input 
                          type="file" 
                          multiple 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const selectedFiles = e.target.files;
                            if (selectedFiles && selectedFiles.length > 0) {
                              const newFiles = Array.from(selectedFiles)
                              setDraftItems(draftItems.map(di => 
                                di.tempId === item.tempId 
                                  ? { ...di, files: [...di.files, ...newFiles] }
                                  : di
                              ))
                            }
                          }}
                        />
                        <UploadCloud size={32} className="text-gray-400 mb-3" />
                        <span className="text-gray-600">Drag & drop your files or <span className="text-primary font-medium">browse</span></span>
                      </label>
                      
                      {/* Show Selected Files List */}
                      {item.files && item.files.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {item.files.map((file: File, i: number) => (
                            <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText size={16} className="text-gray-400 shrink-0" />
                                <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                <span className="text-xs text-gray-400 shrink-0">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.preventDefault()
                                  setDraftItems(draftItems.map(di => 
                                    di.tempId === item.tempId 
                                      ? { ...di, files: di.files.filter((_, idx) => idx !== i) }
                                      : di
                                  ))
                                }} 
                                className="text-red-500 hover:text-red-700 p-1 bg-white rounded shadow-sm border border-red-100"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {!item.params.showLinkInput ? (
                        <button onClick={() => updateDraftParam(item.tempId, 'showLinkInput', true)} className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                          Or, provide a link to your files <ArrowRight size={14} />
                        </button>
                      ) : (
                        <div className="relative mb-4">
                          <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="url" placeholder="https://drive.google.com/..." value={item.params.uploadLink || ''} onChange={e => updateDraftParam(item.tempId, 'uploadLink', e.target.value)} className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" />
                        </div>
                      )}

                      <textarea 
                        rows={3} 
                        placeholder="Any other notes or instructions for our team..."
                        value={item.params.notes || ''}
                        onChange={e => updateDraftParam(item.tempId, 'notes', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg mt-4 px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
                      />
                    </div>
                  </div>

                  {/* Card Footer Subtotal */}
                  <div className="bg-white border-t border-gray-100 flex items-center justify-between p-6">
                    <span className="text-gray-500 font-medium">Credits</span>
                    <span className="text-xl font-bold text-gray-900">{estimateCredits(item)} credits</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ─── STEP 3: CONFIRM ──────────────────────────────────────────── */}
        {stepIndex === 3 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-6">
            <div className="text-center pb-6 border-b border-gray-100">
              <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <LayoutGrid size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Your order is ready</h2>
              <p className="text-gray-500 mt-2">Almost there! Review your total and submit.</p>
            </div>

            <div className="space-y-4">
              {draftItems.map(item => (
                <div key={item.tempId} className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="font-medium text-gray-700">{SERVICE_CATALOG.find(c => c.kind === item.kind)?.label}</span>
                  <span className="text-gray-900 font-bold">{estimateCredits(item)} credits</span>
                </div>
              ))}
            </div>

            <div className={`p-4 rounded-xl flex items-center gap-3 border ${canAfford ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              <Info size={24} />
              <div>
                <p className="font-bold">{canAfford ? 'Sufficient Balance' : 'Insufficient Balance'}</p>
                <p className="text-sm opacity-90">
                  Total required: {confirmedTotal} credits. You currently have {balance} credits.
                </p>
              </div>
            </div>
          </div>
        )}


        {/* ─── FLOATING BOTTOM BAR ────────────────────────────────────── */}
        {stepIndex > 0 && (
          <div className="sticky bottom-6 mt-8 bg-white border border-gray-200 shadow-xl rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4 pl-2">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 uppercase tracking-widest font-bold">Total Credits</span>
                <span className="text-2xl font-bold text-gray-900">
                  {stepIndex === 3 ? confirmedTotal : totalEstimatedCredits} <span className="text-base font-normal text-gray-500">credits</span>
                </span>
              </div>
            </div>
            
            <button
              onClick={handleNext}
              disabled={loading || uploading || (stepIndex === 1 && draftItems.length === 0) || (stepIndex === 3 && !canAfford)}
              className="bg-primary hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition shadow-md"
            >
              {uploading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Uploading...
                </>
              ) : loading ? (
                <span className="animate-pulse">Processing...</span>
              ) : stepIndex === 3 ? (
                `Submit Order`
              ) : (
                <>Next <ArrowRight size={20} /></>
              )}
            </button>
          </div>
        )}

        {/* Start order submit button inline */}
        {stepIndex === 0 && (
          <div className="flex justify-end">
            <button
              onClick={handleNext}
              disabled={loading || !title.trim()}
              className="bg-primary hover:bg-blue-700 text-white disabled:bg-gray-300 px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition shadow-md"
            >
              {loading ? 'Creating...' : <>Start Order <ArrowRight size={20} /></>}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

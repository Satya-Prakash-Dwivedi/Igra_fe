import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as orderApi from '../services/orderService'
import * as creditApi from '../services/creditService'
import * as uploadApi from '../services/uploadService'
import {
  ArrowLeft, ArrowRight, PlaySquare, Image, PlayCircle, StopCircle, Mic,
  FileText, Search, Layout, PenTool, LayoutGrid, Phone, Eye, MessageSquare,
  Plus, X, Info, Link as LinkIcon,
  Monitor, Smartphone, Square, HelpCircle, Turtle, Zap, Flame, Rocket
} from 'lucide-react'
import Button, { cn } from '../components/Button'

// Thumbnail Style Images
import exaggeratedImg from '../assets/thumbnails/exaggerated.png'
import headshotImg from '../assets/thumbnails/headshot.png'
import quoteImg from '../assets/thumbnails/quote.png'
import statementImg from '../assets/thumbnails/statement.png'
import beforeAfterImg from '../assets/thumbnails/before_after.png'
import versusImg from '../assets/thumbnails/versus.png'
import processImg from '../assets/thumbnails/process.png'
import noTextImg from '../assets/thumbnails/no_text.png'
import otherImg from '../assets/thumbnails/other.png'

const THUMBNAIL_STYLES = [
  { id: 'Exaggerated', label: 'EXAGGERATED', img: exaggeratedImg },
  { id: 'Headshot', label: 'HEADSHOT', img: headshotImg },
  { id: 'Quote', label: 'QUOTE', img: quoteImg },
  { id: 'Statement', label: 'STATEMENT', img: statementImg },
  { id: 'BeforeAfter', label: 'BEFORE & AFTER', img: beforeAfterImg },
  { id: 'Versus', label: 'VERSUS', img: versusImg },
  { id: 'Process', label: 'PROCESS', img: processImg },
  { id: 'NoText', label: 'NO TEXT', img: noTextImg },
  { id: 'Other', label: 'OTHER', img: otherImg },
]

const SERVICE_CATALOG = [
  { kind: 'VIDEO_EDIT', label: 'Video editing', icon: PlaySquare, desc: 'Professional post-production for any format', minCredits: 0 },
  { kind: 'THUMBNAIL', label: 'Thumbnail design', icon: Image, desc: 'High-impact visuals for maximum click-through', minCredits: 50 },
  { kind: 'INTRO', label: 'Custom intro', icon: PlayCircle, desc: 'Cinematic brand identifiers for your content', minCredits: 100 },
  { kind: 'OUTRO', label: 'Custom outro', icon: StopCircle, desc: 'Strategic call-to-actions and end screens', minCredits: 100 },
  { kind: 'VOICEOVER', label: 'AI Voiceover', icon: Mic, desc: 'Studio-quality synthetic voice synthesis', minCredits: 50 },
  { kind: 'SCRIPT', label: 'Script writing', icon: FileText, desc: 'Compelling narrative structuring and research', minCredits: 0 },
  { kind: 'SEO', label: 'Video SEO', icon: Search, desc: 'Metatag optimization and visibility ranking', minCredits: 100 },
  { kind: 'CHANNEL_BANNER', label: 'Channel banner', icon: Layout, desc: 'Cohesive brand identity for your profile', minCredits: 150 },
  { kind: 'LOGO_DESIGN', label: 'Logo design', icon: PenTool, desc: 'Iconic visual representation of your brand', minCredits: 100 },
  { kind: 'IMAGE_RETOUCHING', label: 'Image retouching', icon: LayoutGrid, desc: 'Professional grading and imperfection removal', minCredits: 100 },
  { kind: 'CONSULTATION', label: 'Consultation call', icon: Phone, desc: 'Direct strategy session with our specialists', minCredits: 0 },
  { kind: 'FOOTAGE_REVIEW', label: 'Footage review', icon: Eye, desc: 'Detailed analysis and directorial feedback', minCredits: 50 },
  { kind: 'CUSTOM', label: 'Custom request', icon: MessageSquare, desc: 'Tailored solutions for unique production needs', minCredits: 50 },
]

type DraftItem = {
  tempId: string
  kind: string
  params: any
  files: File[]
}

const STEPS = [
  { id: 'start', label: 'Basic Info' },
  { id: 'packages', label: 'Services' },
  { id: 'details', label: 'Configure' },
  { id: 'confirm', label: 'Review & Pay' },
]

function estimateCredits(item: DraftItem): number {
  const params = item.params || {}
  const cat = SERVICE_CATALOG.find(s => s.kind === item.kind)
  let base = cat?.minCredits || 0

  if (item.kind === 'VIDEO_EDIT') {
    base = (params.rawFootageLength || 0) * 20
    if (params.hasRawFootage === false) base += 100
  } else if (item.kind === 'VOICEOVER') {
    base = Math.max(50, (params.scriptLength || 0) * 10)
  } else if (item.kind === 'SCRIPT') {
    const words = params.wordCount || 0
    base = Math.ceil(words * 0.2)
  } else if (item.kind === 'CONSULTATION') {
    const mins = params.duration || 15
    base = Math.ceil(mins / 15) * 100
  } else if (item.kind === 'FOOTAGE_REVIEW') {
    base = Math.max(50, (params.footageLength || 0) * 10)
  }
  return base
}

export default function NewOrderPage() {
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const [title, setTitle] = useState('')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [draftItems, setDraftItems] = useState<DraftItem[]>([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmedTotal, setConfirmedTotal] = useState(0)

  useEffect(() => {
    creditApi.getWallet().then((w) => setBalance(w.balance))
  }, [])

  const getItemCountByKind = (kind: string) => {
    return draftItems.filter(i => i.kind === kind).length
  }

  const handleNext = async () => {
    setError(null)

    if (stepIndex === 0) {
      if (!title.trim()) {
        setError('Please enter a project title')
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

    if (stepIndex === 1) {
      if (draftItems.length === 0) {
        setError('Please select at least one service.')
        return
      }
      setStepIndex(2)
      return
    }

    if (stepIndex === 2) {
      if (!orderId) return
      setLoading(true)
      try {
        let cumulativeCredits = 0
        // Sequential processing to avoid overwhelming the server and hitting rate limits
        for (const draft of draftItems) {
          const assetIds: string[] = []
          if (draft.files.length > 0) {
            setUploading(true)
            for (const file of draft.files) {
              const { assetId } = await uploadApi.uploadFile(file)
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
        const errorMsg = err?.response?.data?.error || err?.response?.data?.message || err.message
        setError(`Failed to save configuration: ${errorMsg}`)
        // If we hit a 429, we should definitely stop
        if (err?.response?.status === 429) {
           setError('Rate limit exceeded. Please wait a few moments before trying again.')
        }
      } finally {
        setLoading(false)
        setUploading(false)
      }
      return
    }

    if (stepIndex === 3) {
      if (!orderId) return
      if (balance < confirmedTotal) {
        setError('Insufficient credits. Please recharge your wallet.')
        return
      }
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
    if (kind === 'VIDEO_EDIT') {
      initialParams.hasRawFootage = true
      initialParams.outputRatio = '16:9'
      initialParams.rawFootageLength = 1
      initialParams.desiredLength = 1
      initialParams.tone = 'Professional'
      initialParams.pace = 'Medium'
      initialParams.externalLinks = []
      initialParams.notes = ''
    } else if (kind === 'THUMBNAIL') {
      initialParams.style = 'Exaggerated'
      initialParams.externalLinks = []
      initialParams.notes = ''
    } else if (['INTRO', 'OUTRO', 'CHANNEL_BANNER', 'LOGO_DESIGN', 'IMAGE_RETOUCHING'].includes(kind)) {
      initialParams.externalLinks = []
      initialParams.notes = ''
    } else if (kind === 'VOICEOVER') {
      initialParams.scriptLength = 5
      initialParams.externalLinks = []
      initialParams.notes = ''
    } else if (kind === 'SCRIPT') {
      initialParams.wordCount = 500
      initialParams.externalLinks = []
      initialParams.notes = ''
    } else if (kind === 'SEO') {
      initialParams.videoUrl = ''
      initialParams.externalLinks = []
      initialParams.notes = ''
    } else if (kind === 'CONSULTATION') {
      initialParams.duration = 15
      initialParams.externalLinks = []
      initialParams.notes = ''
    } else if (kind === 'FOOTAGE_REVIEW') {
      initialParams.footageLength = 10
      initialParams.externalLinks = []
      initialParams.notes = ''
    } else if (kind === 'CUSTOM') {
      initialParams.description = 'Custom request description...'
      initialParams.externalLinks = []
      initialParams.notes = ''
    } else {
      initialParams.externalLinks = []
      initialParams.notes = ''
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

  const renderAssetsAndInstructions = (item: DraftItem) => (
    <>
      {/* Assets & Resources */}
      <div className="space-y-6 pt-10 border-t border-white/5">
        <label className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest block">Assets & Resources</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Upload Section */}
          <label className="flex-1 flex flex-col items-center justify-center p-12 bg-white/[0.01] border-2 border-dashed border-white/5 rounded-3xl hover:border-primary/40 cursor-pointer transition-all group">
            <input type="file" multiple className="hidden" onChange={(e) => {
              if (e.target.files) {
                const newFiles = Array.from(e.target.files)
                setDraftItems(draftItems.map(di => di.tempId === item.tempId ? { ...di, files: [...di.files, ...newFiles] } : di))
              }
            }} />
            <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center mb-5 group-hover:bg-primary/10 transition-all border border-primary/10">
              <Plus size={24} className="text-primary" />
            </div>
            <span className="text-base font-bold text-white mb-1">Upload Files</span>
            <span className="text-xs text-text-dim/40 font-medium">Raw, music, references</span>
          </label>

          {/* External Link Section */}
          <div className="flex-1 flex flex-col p-12 bg-white/[0.01] border border-white/5 rounded-3xl hover:border-white/20 transition-all relative group h-full">
            <div className="flex flex-col h-full gap-5">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center transition-all group-hover:bg-white/10">
                  <LinkIcon size={18} className="text-text-dim/40 group-hover:text-white" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">External Links</span>
                  <span className="text-[10px] text-text-dim/40 font-medium">Drive, Dropbox, etc.</span>
                </div>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
                {(item.params.externalLinks || ['']).map((link: string, lIdx: number) => (
                  <div key={lIdx} className="flex gap-2 animate-in slide-in-from-right-2" style={{ animationDelay: `${lIdx * 50}ms` }}>
                    <input
                      type="url"
                      placeholder={`Link #${lIdx + 1}`}
                      value={link}
                      onChange={(e) => {
                        const newLinks = [...(item.params.externalLinks || [''])]
                        newLinks[lIdx] = e.target.value
                        updateDraftParam(item.tempId, 'externalLinks', newLinks)
                      }}
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                    {(item.params.externalLinks?.length > 1 || link) && (
                      <button
                        onClick={() => {
                          const newLinks = (item.params.externalLinks || ['']).filter((_: any, i: number) => i !== lIdx)
                          updateDraftParam(item.tempId, 'externalLinks', newLinks.length ? newLinks : [''])
                        }}
                        className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center hover:bg-error hover:text-white transition-all shrink-0"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  const newLinks = [...(item.params.externalLinks || ['']), '']
                  updateDraftParam(item.tempId, 'externalLinks', newLinks)
                }}
                className="w-full py-2.5 rounded-xl border border-dashed border-white/10 text-[10px] font-bold uppercase tracking-widest text-text-dim/40 hover:border-primary/40 hover:text-primary transition-all mt-auto"
              >
                + Add Another Link
              </button>
            </div>
          </div>
        </div>

        {/* File List */}
        {item.files.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {item.files.map((f, fi) => (
              <div key={fi} className="bg-white/5 px-5 py-3 rounded-2xl flex items-center gap-4 text-[11px] font-bold border border-white/5 animate-in zoom-in-95">
                <FileText size={16} className="text-primary" />
                <span className="max-w-[180px] truncate">{f.name}</span>
                <button onClick={() => {
                  setDraftItems(draftItems.map(di => di.tempId === item.tempId ? { ...di, files: di.files.filter((_, i) => i !== fi) } : di))
                }} className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center hover:bg-error hover:text-white transition-all"><X size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Special Instructions */}
      <div className="space-y-4 pt-10 border-t border-white/5">
        <label className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest block">Special Instructions</label>
        <textarea
          rows={5}
          value={item.params.notes || ''}
          onChange={(e) => updateDraftParam(item.tempId, 'notes', e.target.value)}
          placeholder="Add any special instructions..."
          className="w-full bg-black/20 border border-white/5 rounded-2xl px-8 py-6 text-white text-base outline-none focus:border-primary/40 resize-none transition-all focus:ring-2 focus:ring-primary/5 shadow-inner"
        />
      </div>
    </>
  )

  const totalEstimatedCredits = draftItems.reduce((sum, item) => sum + estimateCredits(item), 0)
  const canAfford = balance >= (stepIndex === 3 ? confirmedTotal : totalEstimatedCredits)

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-24 animate-in fade-in duration-700 px-6 relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-10 relative z-10">
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              if (stepIndex > 0) setStepIndex(stepIndex - 1)
              else navigate('/orders')
            }}
            className="w-10 h-10 bg-bg-card/40 border border-white/5 hover:bg-white/5 rounded-xl flex items-center justify-center text-primary transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white tracking-tight">New Order</h1>
            <p className="text-text-dim/60 text-xs font-bold uppercase tracking-widest">
              Step {stepIndex + 1} of 4: {STEPS[stepIndex].label}
            </p>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                stepIndex === i ? "w-8 bg-primary" : "w-3 bg-white/10"
              )}
            />
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-error/10 border border-error/20 text-error rounded-xl p-4 flex items-center gap-3 animate-in shake duration-500 relative z-10">
          <Info size={18} />
          <span className="text-sm font-bold">{error}</span>
        </div>
      )}

      {/* Step Content */}
      <div className="relative z-10">
        {/* STEP 0: START */}
        {stepIndex === 0 && (
          <div className="bg-bg-card/40 backdrop-blur-xl rounded-2xl border border-white/5 p-8 md:p-12 space-y-8 shadow-xl">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Give your project a title</h2>
              <p className="text-text-dim/60 text-sm">This helps you and our editors identify your project easily.</p>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Vlog 2024"
              className="w-full bg-black/20 border border-white/5 rounded-xl px-6 py-4 text-white text-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-text-dim/10 font-bold"
              autoFocus
            />
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleNext}
                isLoading={loading}
                disabled={!title.trim()}
                className="h-12 px-10 rounded-xl font-bold"
              >
                Continue
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 1: SELECT SERVICES */}
        {stepIndex === 1 && (
          <div className="space-y-8">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">Select Services</h2>
              <p className="text-text-dim/60 text-sm">Choose what you need for this project.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SERVICE_CATALOG.map((pkg) => {
                const Icon = pkg.icon
                const count = getItemCountByKind(pkg.kind)
                return (
                  <div
                    key={pkg.kind}
                    className={cn(
                      "bg-bg-card/40 backdrop-blur-xl border rounded-2xl p-6 flex flex-col gap-6 transition-all duration-300 hover:border-primary/20 hover:-translate-y-1 shadow-xl",
                      count > 0 ? "border-primary/40 ring-1 ring-primary/20" : "border-white/5"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all", count > 0 ? "bg-primary text-white" : "bg-white/5 text-text-dim/40")}>
                        <Icon size={24} />
                      </div>
                      {count > 0 && (
                        <div className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-lg border border-primary/20">
                          {count} Added
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-lg text-white">{pkg.label}</h3>
                      <p className="text-xs text-text-dim/60 leading-relaxed line-clamp-2">{pkg.desc}</p>
                    </div>

                    <div className="flex gap-3 mt-auto">
                      <button
                        onClick={() => handleAddPackage(pkg.kind)}
                        className={cn(
                          "flex-1 h-10 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                          count > 0 ? "bg-primary text-white" : "bg-white/5 text-white hover:bg-white/10"
                        )}
                      >
                        <Plus size={14} /> Add Service
                      </button>
                      {count > 0 && (
                        <button
                          onClick={() => {
                            const itemsOfKind = draftItems.filter(i => i.kind === pkg.kind);
                            handleRemovePackage(itemsOfKind[itemsOfKind.length - 1].tempId);
                          }}
                          className="w-10 h-10 rounded-lg bg-error/10 text-error flex items-center justify-center hover:bg-error hover:text-white transition-all"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 2: CONFIGURE */}
        {stepIndex === 2 && (
          <div className="space-y-8">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">Configure Services</h2>
              <p className="text-text-dim/60 text-sm">Provide specific details for each service.</p>
            </div>

            <div className="space-y-6">
              {draftItems.map((item, idx) => {
                const cat = SERVICE_CATALOG.find(c => c.kind === item.kind)!
                return (
                  <div key={item.tempId} className="bg-bg-card/40 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden shadow-xl animate-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                          <cat.icon size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white">{cat.label}</h3>
                      </div>
                      <button
                        onClick={() => handleRemovePackage(item.tempId)}
                        className="text-text-dim/40 hover:text-error transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {item.kind === 'VIDEO_EDIT' ? (
                      <div className="space-y-10">
                        {/* Top Row: Raw Footage & Aspect Ratio */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                          {/* Raw Footage */}
                          <div className="space-y-5">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-1 h-1 rounded-full bg-primary" />
                              <label className="text-[10px] font-bold text-text-dim/40 uppercase tracking-[0.2em] block">Raw Footage</label>
                            </div>
                            <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
                              <button
                                onClick={() => updateDraftParam(item.tempId, 'hasRawFootage', true)}
                                className={cn(
                                  "flex-1 py-3 px-6 rounded-xl text-xs font-bold transition-all",
                                  item.params.hasRawFootage ? "bg-primary text-white shadow-lg" : "text-text-dim hover:text-white"
                                )}
                              >
                                I have it
                              </button>
                              <button
                                onClick={() => updateDraftParam(item.tempId, 'hasRawFootage', false)}
                                className={cn(
                                  "flex-1 py-3 px-6 rounded-xl text-xs font-bold transition-all",
                                  !item.params.hasRawFootage ? "bg-primary text-white shadow-lg" : "text-text-dim hover:text-white"
                                )}
                              >
                                Need it (+100)
                              </button>
                            </div>
                          </div>

                          {/* Aspect Ratio */}
                          <div className="space-y-5">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-1 h-1 rounded-full bg-primary" />
                              <label className="text-[10px] font-bold text-text-dim/40 uppercase tracking-[0.2em] block">Aspect Ratio</label>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                              {[
                                { id: '16:9', label: '16:9', icon: Monitor },
                                { id: '9:16', label: '9:16', icon: Smartphone },
                                { id: '1:1', label: '1:1', icon: Square },
                                { id: 'Other', label: '??', icon: HelpCircle },
                              ].map(ratio => (
                                <button
                                  key={ratio.id}
                                  onClick={() => updateDraftParam(item.tempId, 'outputRatio', ratio.id)}
                                  className={cn(
                                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
                                    item.params.outputRatio === ratio.id
                                      ? "bg-primary/10 border-primary/40 text-primary"
                                      : "bg-white/[0.02] border-white/5 text-text-dim/40 hover:border-white/20"
                                  )}
                                >
                                  <ratio.icon size={16} className="mb-2" />
                                  <span className="text-[9px] font-bold">{ratio.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Middle Row: Lengths */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                          <div className="space-y-4">
                            <label className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest block">Raw Length (mins)</label>
                            <input
                              type="number"
                              value={item.params.rawFootageLength || 1}
                              onChange={(e) => updateDraftParam(item.tempId, 'rawFootageLength', parseInt(e.target.value))}
                              className="w-full bg-black/20 border border-white/5 rounded-xl px-6 py-3 text-white font-bold outline-none focus:border-primary/40"
                            />
                          </div>
                          <div className="space-y-4">
                            <label className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest block">Final Length (mins)</label>
                            <input
                              type="number"
                              value={item.params.desiredLength || 1}
                              onChange={(e) => updateDraftParam(item.tempId, 'desiredLength', parseInt(e.target.value))}
                              className="w-full bg-black/20 border border-white/5 rounded-xl px-6 py-3 text-white font-bold outline-none focus:border-primary/40"
                            />
                          </div>
                        </div>

                        {/* Visual Tone & Edit Pace */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                          <div className="space-y-5">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-1 h-1 rounded-full bg-primary" />
                              <label className="text-[10px] font-bold text-text-dim/40 uppercase tracking-[0.2em] block">Visual Tone</label>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              {['Funny', 'Serious', 'Professional', 'Elegant', 'Casual', 'Informational'].map(t => (
                                <button
                                  key={t}
                                  onClick={() => updateDraftParam(item.tempId, 'tone', t)}
                                  className={cn(
                                    "py-2.5 px-4 rounded-xl text-[10px] font-bold border transition-all",
                                    item.params.tone === t
                                      ? "bg-primary text-white border-primary shadow-lg"
                                      : "bg-white/[0.02] border-white/5 text-text-dim/40 hover:border-white/20"
                                  )}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-5">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-1 h-1 rounded-full bg-primary" />
                              <label className="text-[10px] font-bold text-text-dim/40 uppercase tracking-[0.2em] block">Edit Pace</label>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                              {[
                                { id: 'Slow', icon: Turtle },
                                { id: 'Medium', icon: Zap },
                                { id: 'Fast', icon: Flame },
                                { id: 'Super', icon: Rocket },
                              ].map(p => (
                                <button
                                  key={p.id}
                                  onClick={() => updateDraftParam(item.tempId, 'pace', p.id)}
                                  className={cn(
                                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
                                    item.params.pace === p.id
                                      ? "bg-primary/10 border-primary/40 text-primary shadow-lg shadow-primary/5"
                                      : "bg-white/[0.02] border-white/5 text-text-dim/40 hover:border-white/20"
                                  )}
                                >
                                  <p.icon size={16} className="mb-2" />
                                  <span className="text-[9px] font-bold uppercase tracking-widest">{p.id}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {renderAssetsAndInstructions(item)}
                      </div>
                    ) : item.kind === 'THUMBNAIL' ? (
                      <div className="space-y-10 px-8 py-10">
                        {/* Design Style */}
                        <div className="space-y-6">
                          <label className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest block">Design Style</label>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                            {THUMBNAIL_STYLES.map((s) => (
                              <button
                                key={s.id}
                                onClick={() => updateDraftParam(item.tempId, 'style', s.id)}
                                className={cn(
                                  "group relative flex flex-col items-center gap-4 bg-bg-card/40 border rounded-2xl p-3 transition-all duration-300 hover:border-primary/40",
                                  item.params.style === s.id ? "border-primary ring-1 ring-primary/20 shadow-lg shadow-primary/5" : "border-white/5"
                                )}
                              >
                                <div className="aspect-[16/10] w-full overflow-hidden rounded-xl bg-black/40">
                                  <img
                                    src={s.img}
                                    alt={s.label}
                                    className={cn(
                                      "w-full h-full object-cover transition-all duration-500",
                                      item.params.style === s.id ? "scale-105" : "opacity-60 grayscale group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-105"
                                    )}
                                  />
                                </div>
                                <span className={cn(
                                  "text-[9px] font-black uppercase tracking-widest transition-colors",
                                  item.params.style === s.id ? "text-primary" : "text-text-dim/40 group-hover:text-white"
                                )}>
                                  {s.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {renderAssetsAndInstructions(item)}
                      </div>
                    ) : item.kind === 'VOICEOVER' ? (
                      <div className="space-y-10 px-8 py-10">
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest block">Script Length (Minutes)</label>
                          <input
                            type="number"
                            value={item.params.scriptLength || 5}
                            onChange={(e) => updateDraftParam(item.tempId, 'scriptLength', parseInt(e.target.value))}
                            className="w-full bg-black/20 border border-white/5 rounded-2xl px-8 py-4 text-white font-bold outline-none focus:border-primary/40 text-lg"
                          />
                        </div>
                        {renderAssetsAndInstructions(item)}
                      </div>
                    ) : item.kind === 'SCRIPT' ? (
                      <div className="space-y-10 px-8 py-10">
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest block">Estimated Word Count</label>
                          <input
                            type="number"
                            value={item.params.wordCount || 500}
                            onChange={(e) => updateDraftParam(item.tempId, 'wordCount', parseInt(e.target.value))}
                            className="w-full bg-black/20 border border-white/5 rounded-2xl px-8 py-4 text-white font-bold outline-none focus:border-primary/40 text-lg"
                          />
                        </div>
                        {renderAssetsAndInstructions(item)}
                      </div>
                    ) : item.kind === 'SEO' ? (
                      <div className="space-y-10 px-8 py-10">
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest block">Video URL</label>
                          <input
                            type="url"
                            placeholder="https://youtube.com/watch?v=example"
                            value={item.params.videoUrl || ''}
                            onChange={(e) => updateDraftParam(item.tempId, 'videoUrl', e.target.value)}
                            className="w-full bg-black/20 border border-white/5 rounded-2xl px-8 py-4 text-white font-bold outline-none focus:border-primary/40"
                          />
                        </div>
                        {renderAssetsAndInstructions(item)}
                      </div>
                    ) : item.kind === 'CONSULTATION' ? (
                      <div className="space-y-10 px-8 py-10">
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest block">Duration (Minutes)</label>
                          <select
                            value={item.params.duration || 15}
                            onChange={(e) => updateDraftParam(item.tempId, 'duration', parseInt(e.target.value))}
                            className="w-full bg-black/20 border border-white/5 rounded-2xl px-8 py-4 text-white font-bold outline-none focus:border-primary/40 appearance-none cursor-pointer"
                          >
                            {[15, 30, 45, 60].map(m => (
                              <option key={m} value={m} className="bg-bg-dark text-white">{m} Minutes</option>
                            ))}
                          </select>
                        </div>
                        {renderAssetsAndInstructions(item)}
                      </div>
                    ) : item.kind === 'FOOTAGE_REVIEW' ? (
                      <div className="space-y-10 px-8 py-10">
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest block">Raw Footage Length (Minutes)</label>
                          <input
                            type="number"
                            value={item.params.footageLength || 10}
                            onChange={(e) => updateDraftParam(item.tempId, 'footageLength', parseInt(e.target.value))}
                            className="w-full bg-black/20 border border-white/5 rounded-2xl px-8 py-4 text-white font-bold outline-none focus:border-primary/40 text-lg"
                          />
                        </div>
                        {renderAssetsAndInstructions(item)}
                      </div>
                    ) : item.kind === 'CUSTOM' ? (
                      <div className="space-y-10 px-8 py-10">
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest block">Description of Request</label>
                          <textarea
                            rows={4}
                            placeholder="Custom request description..."
                            value={item.params.description || ''}
                            onChange={(e) => updateDraftParam(item.tempId, 'description', e.target.value)}
                            className="w-full bg-black/20 border border-white/5 rounded-2xl px-8 py-6 text-white text-base outline-none focus:border-primary/40 resize-none transition-all focus:ring-2 focus:ring-primary/5 shadow-inner"
                          />
                        </div>
                        {renderAssetsAndInstructions(item)}
                      </div>
                    ) : (['INTRO', 'OUTRO', 'CHANNEL_BANNER', 'LOGO_DESIGN', 'IMAGE_RETOUCHING'].includes(item.kind)) ? (
                      <div className="space-y-10 px-8 py-10">
                        {renderAssetsAndInstructions(item)}
                      </div>
                    ) : (
                      <div className="p-8 space-y-8">
                        <p className="text-text-dim/40 text-xs italic">Configuration options for {cat.label} are being loaded...</p>

                        {/* Fallback Asset Section */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                          <label className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest block">Upload Files</label>
                          <div className="flex flex-col md:flex-row gap-4">
                            <label className="flex-1 flex flex-col items-center justify-center p-8 bg-white/[0.01] border-2 border-dashed border-white/5 rounded-xl hover:border-primary/40 cursor-pointer transition-all group">
                              <input type="file" multiple className="hidden" onChange={(e) => {
                                if (e.target.files) {
                                  const newFiles = Array.from(e.target.files)
                                  setDraftItems(draftItems.map(di => di.tempId === item.tempId ? { ...di, files: [...di.files, ...newFiles] } : di))
                                }
                              }} />
                              <Plus size={24} className="text-primary/40 group-hover:text-primary transition-colors mb-2" />
                              <span className="text-sm font-bold text-white">Add Files</span>
                            </label>
                          </div>
                          {item.files.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {item.files.map((f, fi) => (
                                <div key={fi} className="bg-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-bold">
                                  <FileText size={12} className="text-text-dim/40" />
                                  {f.name}
                                  <button onClick={() => {
                                    setDraftItems(draftItems.map(di => di.tempId === item.tempId ? { ...di, files: di.files.filter((_, i) => i !== fi) } : di))
                                  }} className="hover:text-error"><X size={12} /></button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
        }

        {/* STEP 3: REVIEW & PAY */}
        {stepIndex === 3 && (
          <div className="bg-bg-card/40 backdrop-blur-xl rounded-2xl border border-white/5 p-8 md:p-12 space-y-10 shadow-xl">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Review & Pay</h2>
              <p className="text-text-dim/60 text-sm">Confirm your order details and submit.</p>
            </div>

            <div className="bg-black/20 rounded-xl border border-white/5 p-6 space-y-4">
              {draftItems.map(item => (
                <div key={item.tempId} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm font-bold text-white">{SERVICE_CATALOG.find(c => c.kind === item.kind)?.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">{estimateCredits(item)}</span>
                    <span className="text-[10px] font-bold text-text-dim/40 uppercase">Credits</span>
                  </div>
                </div>
              ))}
              <div className="pt-4 flex justify-between items-center border-t border-white/10">
                <span className="text-xs font-bold text-text-dim/60 uppercase">Total Amount</span>
                <div className="text-3xl font-bold text-primary">
                  {confirmedTotal} <span className="text-xs font-bold text-text-dim/40">Credits</span>
                </div>
              </div>
            </div>

            <div className={cn(
              "p-6 rounded-xl flex items-center gap-4 border transition-all",
              canAfford ? 'bg-success/5 border-success/20 text-success' : 'bg-error/5 border-error/20 text-error'
            )}>
              <Info size={24} />
              <div className="flex-1">
                <p className="font-bold text-sm">{canAfford ? 'Your balance is sufficient' : 'Insufficient balance'}</p>
                <p className="text-[10px] uppercase tracking-widest opacity-60">Wallet: {balance} Cr | Required: {confirmedTotal} Cr</p>
              </div>
              {!canAfford && (
                <Button variant="outline" onClick={() => navigate('/credits')} className="h-10 px-6 rounded-lg text-[10px]">Recharge</Button>
              )}
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="mt-12 flex justify-between items-center bg-bg-card/60 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 shadow-2xl sticky bottom-6 group">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Total Estimate</p>
            <p className="text-3xl font-bold text-white tracking-tight italic">
              {stepIndex === 3 ? confirmedTotal : totalEstimatedCredits} <span className="text-sm font-bold text-text-dim/40 not-italic">Credits</span>
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleNext}
            isLoading={loading}
            disabled={uploading || (stepIndex === 1 && draftItems.length === 0)}
            className="h-14 px-12 rounded-2xl font-bold text-sm shadow-2xl shadow-primary/20"
          >
            {stepIndex === 3 ? 'Initiate Production' : 'Advance Protocol'}
            <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  )
}

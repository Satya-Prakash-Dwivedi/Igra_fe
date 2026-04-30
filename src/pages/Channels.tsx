import React, { useState, useEffect, useRef } from 'react'
import { Radio, Plus, User, Youtube, Trash2, X, Loader2, Upload, AlertCircle, ExternalLink, Sliders, Palette, Wind } from 'lucide-react'
import Button, { cn } from '../components/Button'
import channelService from '../services/channelService'
import type { Channel, ChannelFormData, ChannelPace, ChannelTone } from '../services/channelService'
import * as uploadApi from '../services/uploadService'
import { createLogger, serializeError } from '../services/logger'
import { toast } from 'sonner'
import { resolveApiUrl } from '../utils/urlUtils'

const logger = createLogger('Channels')

// ─── Constants ───────────────────────────────────────────────────────────────

const PACES: { label: ChannelPace; icon: string }[] = [
  { label: 'Slow', icon: '🐌' },
  { label: 'Normal', icon: '🚶' },
  { label: 'Fast', icon: '💨' },
  { label: 'Super', icon: '⚡' },
]

const TONES: { label: ChannelTone; icon: string }[] = [
  { label: 'Funny', icon: '🤸' },
  { label: 'Elegant', icon: '🦊' },
  { label: 'Serious', icon: '🚩' },
  { label: 'Casual', icon: '🧑' },
  { label: 'Professional', icon: '👷' },
  { label: 'Informational', icon: '📺' },
]

const DEFAULT_COLORS: [string, string, string] = ['#e11d48', '#141414', '#ffffff']

// ─── Sub-components ──────────────────────────────────────────────────────────

interface ChannelCardProps {
  channel: Channel
  onEdit: (channel: Channel) => void
}

const ChannelCard: React.FC<ChannelCardProps> = ({ channel, onEdit }) => (
  <div
    onClick={() => onEdit(channel)}
    className="bg-bg-card border border-white/5 rounded-[2rem] p-7 cursor-pointer hover:border-primary/40 hover:bg-white/[0.02] transition-all duration-500 group relative overflow-hidden shadow-2xl flex flex-col h-full"
  >
    {/* Decorative background glow */}
    <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

    <div className="flex items-start gap-6 relative z-10 flex-1">
      {channel.logo ? (
        <div className="relative">
          <img
            src={resolveApiUrl(channel.logo)}
            alt={channel.name}
            className="w-20 h-20 rounded-2xl object-cover border border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
        </div>
      ) : (
        <div className="w-20 h-20 rounded-2xl bg-bg-dark border border-white/10 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:border-primary/20 transition-all">
          <Youtube size={32} className="text-text-muted/20 group-hover:text-primary transition-colors duration-500" />
        </div>
      )}
      
      <div className="flex-1 min-w-0 flex flex-col h-full">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h3 className="text-white font-bold text-xl truncate group-hover:text-primary transition-colors duration-300">
            {channel.name}
          </h3>
          <ExternalLink size={16} className="text-text-muted/20 group-hover:text-primary transition-all duration-300 flex-shrink-0" />
        </div>
        
        <p className="text-text-muted text-xs truncate font-medium mb-5 opacity-60 group-hover:opacity-100 transition-opacity">
          {channel.channelUrl}
        </p>
        
        <div className="flex flex-wrap items-center gap-2 mt-auto">
           <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
              <span className="text-[10px] uppercase font-bold text-text-muted tracking-widest flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                 Pace: {channel.pace}
              </span>
           </div>
           <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
              <span className="text-[10px] uppercase font-bold text-text-muted tracking-widest flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                 Tone: {channel.tone}
              </span>
           </div>
        </div>
      </div>
    </div>
    
    {/* Brand Colors Ribbon - More prominent and stylized */}
    <div className="mt-8 relative">
      <div className="h-1.5 w-full flex rounded-full overflow-hidden shadow-inner border border-white/5">
        {channel.brandColors.map((color, i) => (
          <div key={i} className="flex-1 h-full" style={{ backgroundColor: color }} />
        ))}
      </div>
    </div>
  </div>
)

// ─── Form Component ──────────────────────────────────────────────────────────

interface ChannelFormProps {
  initial: Channel | null
  onBack: () => void
  onSaved: (channel: Channel) => void
  onDeleted: (id: string) => void
}

const ChannelForm: React.FC<ChannelFormProps> = ({ initial, onBack, onSaved, onDeleted }) => {
  const isEditing = !!initial
  const [name, setName] = useState(initial?.name || '')
  const [channelUrl, setChannelUrl] = useState(initial?.channelUrl || '')
  const [logo, setLogo] = useState(initial?.logo || '')
  const [brandColors, setBrandColors] = useState<[string, string, string]>(initial?.brandColors || DEFAULT_COLORS)
  const [pace, setPace] = useState<ChannelPace>(initial?.pace || 'Normal')
  const [tone, setTone] = useState<ChannelTone>(initial?.tone || 'Professional')
  const [description, setDescription] = useState(initial?.description || '')

  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const logoInputRef = useRef<HTMLInputElement>(null)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Channel name is required.'
    
    const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
    if (!channelUrl.trim()) {
      newErrors.channelUrl = 'Channel link is required.'
    } else if (!urlPattern.test(channelUrl.trim())) {
      newErrors.channelUrl = 'Please enter a valid URL.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file for the logo.')
      return
    }

    setIsUploadingLogo(true)
    try {
      const { url } = await uploadApi.uploadFile(file)
      setLogo(url || '')
      toast.success('Logo uploaded successfully!')
    } catch (err) {
      logger.error('channels.logo_upload_failed', { error: serializeError(err) })
      toast.error('Logo upload failed.')
    } finally {
      setIsUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  const handleColorChange = (index: number, value: string) => {
    const updated: [string, string, string] = [...brandColors] as [string, string, string]
    updated[index] = value
    setBrandColors(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const payload: ChannelFormData = {
      name: name.trim(),
      channelUrl: channelUrl.trim(),
      logo: logo || undefined,
      brandColors,
      pace,
      tone,
      description: description.trim() || undefined,
    }

    setIsSaving(true)
    try {
      let saved: Channel
      if (isEditing && initial) {
        saved = await channelService.updateChannel(initial._id, payload)
      } else {
        saved = await channelService.createChannel(payload)
      }
      toast.success(isEditing ? 'Channel updated!' : 'Channel created!')
      onSaved(saved)
    } catch (err: any) {
      logger.error('channels.save_failed', { error: serializeError(err) })
      toast.error(err.response?.data?.message || 'Failed to save channel.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!initial || !onDeleted) return
    if (!confirm(`Delete "${initial.name}"?`)) return

    setIsDeleting(true)
    try {
      await channelService.deleteChannel(initial._id)
      toast.success('Channel deleted.')
      onDeleted(initial._id)
    } catch (err) {
      logger.error('channels.delete_failed', { error: serializeError(err) })
      toast.error('Failed to delete channel.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 animate-in fade-in duration-500">
      <div className="bg-bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 md:p-12 shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-10 pb-10 border-b border-white/5">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {isEditing ? 'Edit Identity' : 'Establish New Identity'}
            </h1>
            <p className="text-text-muted text-sm">Define your channel's aesthetic and operational protocol.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-10 px-6 rounded-xl border-white/10 hover:bg-white/5" onClick={onBack}>
              Cancel
            </Button>
            {isEditing && (
              <Button
                variant="outline"
                className="bg-error/10 hover:bg-error text-error hover:text-white border-error/20 h-10 px-6 rounded-xl"
                onClick={handleDelete}
                isLoading={isDeleting}
              >
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Live Preview Section */}
        <div className="mb-12 bg-white/[0.01] p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
          <div className="flex items-center gap-2 mb-6">
             <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
             <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted">Live Identity Preview</span>
          </div>
          <div className="max-w-md mx-auto md:mx-0">
            <ChannelCard 
              channel={{
                _id: 'preview',
                userId: 'preview-user',
                name: name || 'Channel Name',
                channelUrl: channelUrl || 'https://youtube.com/@handle',
                logo: logo,
                brandColors: brandColors,
                pace: pace,
                tone: tone,
                description: description,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }} 
              onEdit={() => {}} 
            />
          </div>
        </div>

        <form className="space-y-10" onSubmit={handleSubmit}>
          {/* Logo & Basic Info */}
          <div className="flex flex-col md:flex-row gap-8">
            <div 
              onClick={() => logoInputRef.current?.click()}
              className="w-24 h-24 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group overflow-hidden relative"
            >
              {logo ? (
                <img 
                  src={resolveApiUrl(logo)} 
                  alt="Logo" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <User size={32} className="text-text-dim/20" />
              )}
              {isUploadingLogo && (
                <div className="absolute inset-0 bg-bg-dark/80 flex items-center justify-center">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              )}
              <input type="file" ref={logoInputRef} className="hidden" onChange={handleLogoChange} accept="image/*" />
            </div>

            <div className="flex-1 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Channel Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-white focus:ring-4 focus:ring-primary/10 focus:border-primary/40 outline-none transition-all placeholder:text-text-muted/20 font-medium"
                  placeholder="e.g. My Awesome Tech Channel"
                />
                {errors.name && <p className="text-error text-[10px] font-bold ml-1">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Channel Link / URL</label>
                <input
                  type="text"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-white focus:ring-4 focus:ring-primary/10 focus:border-primary/40 outline-none transition-all placeholder:text-text-muted/20 font-medium"
                  placeholder="https://youtube.com/@yourchannel"
                />
                {errors.channelUrl && <p className="text-error text-[10px] font-bold ml-1">{errors.channelUrl}</p>}
              </div>
            </div>
          </div>

          {/* Branding & Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-5">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                <Palette size={14} className="text-primary" /> Brand Colors
              </label>
              <div className="flex gap-5 p-6 bg-white/[0.02] rounded-3xl border border-white/5 shadow-inner">
                {brandColors.map((color, i) => (
                  <div key={i} className="flex flex-col items-center gap-3">
                    <div className="relative group/color">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => handleColorChange(i, e.target.value)}
                        className="w-14 h-14 rounded-2xl bg-transparent border-none cursor-pointer relative z-10"
                      />
                      <div className="absolute inset-0 rounded-2xl border-4 border-white/10 group-hover/color:border-white/20 transition-all" />
                      <div className="absolute inset-0 rounded-2xl shadow-xl" style={{ backgroundColor: color, opacity: 0.2 }} />
                    </div>
                    <span className="text-[9px] font-mono text-text-muted/40 uppercase tracking-tighter">{color}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                <Wind size={14} className="text-primary" /> Video Pace
              </label>
              <div className="flex bg-white/[0.02] p-1.5 rounded-[1.5rem] border border-white/5 shadow-inner">
                {PACES.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setPace(p.label)}
                    className={cn(
                      "flex-1 py-3 text-[10px] font-bold rounded-xl transition-all uppercase tracking-widest",
                      pace === p.label 
                        ? "bg-primary text-white shadow-2xl shadow-primary/20 scale-105" 
                        : "text-text-muted/40 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <span className="block text-base mb-1">{p.icon}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2 ml-1">
              <Sliders size={14} className="text-primary" /> Content Tone
            </label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {TONES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setTone(t.label)}
                  className={cn(
                    "py-5 text-[9px] font-bold rounded-2xl border transition-all flex flex-col items-center gap-2 uppercase tracking-widest",
                    tone === t.label 
                      ? "bg-primary/10 border-primary/40 text-primary shadow-2xl shadow-primary/5" 
                      : "bg-white/[0.02] border-white/5 text-text-muted/40 hover:border-white/20 hover:text-white"
                  )}
                >
                  <span className="text-2xl mb-1">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Special Instructions / Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 text-white placeholder:text-text-muted/20 focus:ring-4 focus:ring-primary/10 focus:border-primary/40 outline-none min-h-[160px] transition-all font-medium"
              placeholder="Tell us about your channel's unique style, specific visual preferences, or any creative guidelines..."
            />
          </div>

          <Button
            variant="primary"
            type="submit"
            fullWidth
            isLoading={isSaving}
            disabled={isDeleting || isUploadingLogo}
            className="h-12 text-lg font-bold rounded-xl"
          >
            {isEditing ? 'Save Changes' : 'Add Channel'}
          </Button>
        </form>
      </div>
    </div>
  )
}

// ─── Main Channels Page ───────────────────────────────────────────────────────

const Channels: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    const loadChannels = async () => {
      try {
        setIsLoading(true)
        setFetchError(null)
        const data = await channelService.listChannels()
        setChannels(data)
      } catch (err) {
        logger.error('channels.list_failed', { error: serializeError(err) })
        setFetchError('Could not load channels. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    loadChannels()
  }, [])

  const handleEdit = (channel: Channel) => {
    setSelectedChannel(channel)
    setIsFormVisible(true)
  }

  const handleNewChannel = () => {
    setSelectedChannel(null)
    setIsFormVisible(true)
  }

  const handleBack = () => {
    setIsFormVisible(false)
    setSelectedChannel(null)
  }

  const handleSaved = (saved: Channel) => {
    setChannels((prev) => {
      const exists = prev.find((c) => c._id === saved._id)
      return exists ? prev.map((c) => (c._id === saved._id ? saved : c)) : [saved, ...prev]
    })
    handleBack()
  }

  const handleDeleted = (id: string) => {
    setChannels((prev) => prev.filter((c) => c._id !== id))
    handleBack()
  }

  if (isFormVisible) {
    return (
      <ChannelForm
        initial={selectedChannel}
        onBack={handleBack}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-10 animate-in fade-in duration-500 relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
           <h1 className="text-3xl font-bold text-white tracking-tight">Your <span className="text-primary">Channels</span></h1>
           <p className="text-text-dim/60 text-base">Manage your connected social media identities.</p>
        </div>
        <Button variant="primary" className="h-12 px-8 rounded-xl flex items-center gap-2" onClick={handleNewChannel}>
          <Plus size={18} />
          Add Channel
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 opacity-40">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Loading channels...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && fetchError && (
        <div className="flex items-center gap-4 p-6 bg-error/10 border border-error/20 rounded-2xl text-error text-sm font-bold shadow-lg animate-in shake duration-500">
          <AlertCircle size={20} />
          {fetchError}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !fetchError && channels.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-bg-card/20 backdrop-blur-xl border border-dashed border-white/10 rounded-2xl p-12 shadow-xl animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center text-text-dim/20 mb-6">
            <Radio size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">No channels found</h2>
          <p className="text-text-dim/40 text-base max-w-sm mb-8">
            Connect your social media channels to establish branding and style preferences for your orders.
          </p>
          <Button variant="primary" className="h-12 px-10 rounded-xl" onClick={handleNewChannel}>
            Add First Channel
          </Button>
        </div>
      )}

      {/* Channel Grid */}
      {!isLoading && !fetchError && channels.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {channels.map((channel, i) => (
            <div key={channel._id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
               <ChannelCard channel={channel} onEdit={handleEdit} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Channels

import React, { useState, useEffect, useRef } from 'react'
import { Radio, Plus, User, Youtube, Trash2, X, Loader2, Upload, AlertCircle } from 'lucide-react'
import Button, { cn } from '../components/Button'
import channelService from '../services/channelService'
import type { Channel, ChannelFormData, ChannelPace, ChannelTone } from '../services/channelService'
import * as uploadApi from '../services/uploadService'
import { createLogger, serializeError } from '../services/logger'

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

// ─── Form Error Type ─────────────────────────────────────────────────────────

interface FormErrors {
  name?: string
  channelUrl?: string
  general?: string
}

// ─── Channel Card ─────────────────────────────────────────────────────────────

interface ChannelCardProps {
  channel: Channel
  onEdit: (channel: Channel) => void
}

const ChannelCard: React.FC<ChannelCardProps> = ({ channel, onEdit }) => (
  <div
    onClick={() => onEdit(channel)}
    className="bg-bg-card border border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 transition-all duration-200 group"
  >
    <div className="flex items-start gap-4">
      {channel.logo ? (
        <img
          src={channel.logo}
          alt={channel.name}
          className="w-14 h-14 rounded-lg object-cover border border-border flex-shrink-0"
        />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-bg-dark border border-border flex items-center justify-center flex-shrink-0">
          <Radio size={24} className="text-text-muted" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-text-main font-bold text-lg truncate group-hover:text-primary transition-colors">
          {channel.name}
        </h3>
        <p className="text-text-muted text-sm truncate">{channel.channelUrl}</p>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs text-text-muted bg-bg-dark px-2 py-1 rounded border border-border">
            {channel.pace}
          </span>
          <span className="text-xs text-text-muted bg-bg-dark px-2 py-1 rounded border border-border">
            {channel.tone}
          </span>
          <div className="flex gap-1 ml-1">
            {channel.brandColors.map((color, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full border border-border/50"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)

// ─── Detail / Form View ───────────────────────────────────────────────────────

interface ChannelFormProps {
  initial?: Channel | null
  onBack: () => void
  onSaved: (channel: Channel) => void
  onDeleted?: (id: string) => void
}

const ChannelForm: React.FC<ChannelFormProps> = ({ initial, onBack, onSaved, onDeleted }) => {
  const isEditing = !!initial
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(initial?.name || '')
  const [channelUrl, setChannelUrl] = useState(initial?.channelUrl || '')
  const [logo, setLogo] = useState(initial?.logo || '')
  const [brandColors, setBrandColors] = useState<[string, string, string]>(
    initial?.brandColors ?? [...DEFAULT_COLORS]
  )
  const [pace, setPace] = useState<ChannelPace>(initial?.pace || 'Normal')
  const [tone, setTone] = useState<ChannelTone>(initial?.tone || 'Informational')
  const [description, setDescription] = useState(initial?.description || '')

  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .@-]*)*\/?$/

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Channel name must be at least 2 characters.'
    }
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
      setErrors((prev) => ({ ...prev, general: 'Please select an image file for the logo.' }))
      return
    }

    setIsUploadingLogo(true)
    try {
      const { url } = await uploadApi.uploadFile(file)
      setLogo(url || '')
    } catch (err) {
      logger.error('channels.logo_upload_failed', { error: serializeError(err) })
      setErrors((prev) => ({ ...prev, general: 'Logo upload failed. Please try again.' }))
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
    setErrors({})
    setSuccessMessage(null)

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
      setSuccessMessage(isEditing ? 'Channel updated!' : 'Channel created!')
      setTimeout(() => {
        setSuccessMessage(null)
        onSaved(saved)
      }, 1500)
    } catch (err: any) {
      logger.error('channels.save_failed', { error: serializeError(err) })
      setErrors({ general: err.response?.data?.message || 'Failed to save channel. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!initial || !onDeleted) return
    if (!confirm(`Delete "${initial.name}"? This cannot be undone.`)) return

    setIsDeleting(true)
    try {
      await channelService.deleteChannel(initial._id)
      onDeleted(initial._id)
    } catch (err) {
      logger.error('channels.delete_failed', { error: serializeError(err) })
      setErrors({ general: 'Failed to delete channel. Please try again.' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex-1 p-6 md:p-8 bg-bg-dark min-h-screen">
      <div className="max-w-3xl mx-auto bg-bg-card border border-border rounded-xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300 relative">

        {successMessage && (
          <div className="absolute top-4 right-8 left-8 p-3 bg-success/10 border border-success/20 rounded-lg text-success text-sm text-center z-50 animate-in fade-in zoom-in duration-300">
            {successMessage}
          </div>
        )}

        {/* Top Bar */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-text-main font-bold text-2xl">
            {isEditing ? 'Edit Channel' : 'New Channel'}
          </h1>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="text-text-muted border-border hover:bg-bg-dark"
              onClick={onBack}
              disabled={isSaving || isDeleting}
            >
              Back
            </Button>
            {isEditing && (
              <Button
                variant="primary"
                className="bg-error hover:bg-red-700 border-error text-white flex items-center gap-2"
                onClick={handleDelete}
                isLoading={isDeleting}
                disabled={isSaving}
              >
                <Trash2 size={16} />
                Delete
              </Button>
            )}
          </div>
        </div>

        <form className="space-y-10" onSubmit={handleSubmit}>
          {/* Logo Upload */}
          <div className="space-y-4">
            <label className="text-text-muted text-sm font-medium uppercase tracking-wider">
              Upload a logo <span className="lowercase opacity-60">(optional)</span>
            </label>
            <div className="flex flex-col items-center w-fit gap-4">
              <div
                onClick={() => logoInputRef.current?.click()}
                className={cn(
                  'w-24 h-24 border-2 border-dashed border-border rounded-xl flex items-center justify-center cursor-pointer hover:border-primary transition-all group overflow-hidden relative',
                  isUploadingLogo && 'cursor-wait opacity-80'
                )}
              >
                {logo ? (
                  <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-text-muted group-hover:text-primary transition-colors" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  <Upload size={18} className="mb-1" />
                  <span className="text-[9px] font-bold uppercase">Upload</span>
                </div>
                {isUploadingLogo && (
                  <div className="absolute inset-0 bg-bg-dark/80 flex items-center justify-center z-10">
                    <Loader2 className="animate-spin text-primary" size={28} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="text-primary hover:text-primary-hover text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50"
                  disabled={isUploadingLogo || isSaving}
                >
                  Upload New
                </button>
                <button
                  type="button"
                  onClick={() => setLogo('')}
                  className="flex items-center gap-1.5 text-text-muted hover:text-error text-xs transition-colors disabled:opacity-50"
                  disabled={!logo || isUploadingLogo || isSaving}
                >
                  <X size={14} /> Clear
                </button>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
          </div>

          {/* Name & Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-text-muted text-sm font-medium uppercase tracking-wider">Name</label>
              <input
                type="text"
                placeholder="The Ai Grid"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={cn(
                  'w-full bg-transparent border-b py-2 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors text-sm',
                  errors.name ? 'border-error' : 'border-border'
                )}
              />
              {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-text-muted text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                <Youtube size={16} className="text-primary" /> Channel link
              </label>
              <input
                type="text"
                placeholder="https://www.youtube.com/@yourchannel"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                className={cn(
                  'w-full bg-transparent border-b py-2 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors text-sm',
                  errors.channelUrl ? 'border-error' : 'border-border'
                )}
              />
              {errors.channelUrl && <p className="text-xs text-error mt-1">{errors.channelUrl}</p>}
            </div>
          </div>

          {/* Brand Colors */}
          <div className="space-y-4">
            <label className="text-text-muted text-sm font-medium uppercase tracking-wider">Brand colors</label>
            <div className="flex gap-4 items-center">
              {brandColors.map((color, i) => (
                <label
                  key={i}
                  className="relative w-12 h-12 rounded-lg border-2 border-border cursor-pointer hover:scale-110 transition-transform shadow-md group overflow-hidden"
                  title={`Color ${i + 1}: ${color}`}
                >
                  <div className="w-full h-full" style={{ backgroundColor: color }} />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-[9px] font-bold">EDIT</span>
                  </div>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => handleColorChange(i, e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </label>
              ))}
              <div className="ml-2">
                <p className="text-text-muted text-xs">Click a swatch to change</p>
                <p className="text-text-main text-xs font-mono mt-0.5">
                  {brandColors.join(' · ')}
                </p>
              </div>
            </div>
          </div>

          {/* Pace Selector */}
          <div className="space-y-4">
            <label className="text-text-muted text-sm font-medium uppercase tracking-wider">Pace</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {PACES.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPace(p.label)}
                  className={cn(
                    'p-6 rounded-xl border flex flex-col items-center gap-3 transition-all duration-200 shadow-sm',
                    pace === p.label
                      ? 'bg-primary border-primary text-white scale-[1.02]'
                      : 'bg-bg-dark border-border text-text-main hover:border-primary/50'
                  )}
                >
                  <span className="text-3xl">{p.icon}</span>
                  <span className="font-bold text-sm">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tone Selector */}
          <div className="space-y-4">
            <label className="text-text-muted text-sm font-medium uppercase tracking-wider">Tone</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {TONES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setTone(t.label)}
                  className={cn(
                    'p-5 rounded-xl border flex flex-col items-center gap-2 transition-all duration-200 shadow-sm',
                    tone === t.label
                      ? 'bg-primary/10 border-primary text-text-main'
                      : 'bg-bg-dark border-border text-text-muted hover:border-primary/30'
                  )}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <span className="font-semibold text-sm">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4 pt-4">
            <div className="space-y-1">
              <h3 className="text-text-main font-bold text-lg leading-tight">Tell us about your channel</h3>
              <p className="text-text-muted text-xs leading-relaxed max-w-2xl">
                Help us replicate what makes your channel special. How do you typically edit? What's your sense of humor, pace, and is there anything else we should know?
              </p>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-bg-dark border-b border-border py-3 px-4 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary resize-none min-h-[120px] text-sm transition-colors shadow-inner"
              placeholder="Type here..."
            />
          </div>

          {errors.general && (
            <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-md text-xs text-error">
              <AlertCircle size={14} className="flex-shrink-0" />
              {errors.general}
            </div>
          )}

          {/* Save Button */}
          <Button
            variant="primary"
            type="submit"
            fullWidth
            isLoading={isSaving}
            disabled={isDeleting || isUploadingLogo}
            className="py-4 text-base font-bold rounded-xl mt-6 shadow-xl shadow-primary/20"
          >
            {isEditing ? 'Update channel' : 'Create channel'}
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
        setFetchError('Could not load channels. Please refresh the page.')
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
    <div className="flex-1 p-6 md:p-8 bg-bg-dark min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-text-main font-bold text-2xl md:text-3xl">My Channels</h1>
        <Button className="flex items-center gap-2" onClick={handleNewChannel}>
          <Plus size={18} />
          New Channel
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Loader2 className="animate-spin text-primary mb-4" size={40} />
          <p className="text-text-muted text-sm">Loading channels...</p>
        </div>
      )}

      {/* Fetch Error */}
      {!isLoading && fetchError && (
        <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
          <AlertCircle size={20} className="flex-shrink-0" />
          {fetchError}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !fetchError && channels.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-bg-card border border-border rounded-2xl p-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
            <Radio size={32} />
          </div>
          <h2 className="text-text-main font-bold text-xl mb-2">No channels yet</h2>
          <p className="text-text-muted text-sm max-w-sm mb-8 leading-relaxed">
            Add your YouTube or social channels here to set default brand colors, editing pace, and tone for your orders.
          </p>
          <Button className="px-8 py-3 rounded-xl font-bold" onClick={handleNewChannel}>
            + Add your first channel
          </Button>
        </div>
      )}

      {/* Channel List */}
      {!isLoading && !fetchError && channels.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.map((channel) => (
            <ChannelCard key={channel._id} channel={channel} onEdit={handleEdit} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Channels

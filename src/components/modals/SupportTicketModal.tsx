import React, { useState, useRef } from 'react'
import { X, Upload, AlertCircle, CheckCircle2, Loader2, ChevronDown, File as FileIcon, Trash2 } from 'lucide-react'
import Button, { cn } from '../Button'
import supportService from '../../services/supportService'
import type { SupportCategory } from '../../services/supportService'
import * as uploadApi from '../../services/uploadService'
import { createLogger, serializeError } from '../../services/logger'

const logger = createLogger('SupportTicketModal')

const CATEGORIES: SupportCategory[] = [
  'Order Problem',
  'Billing Issue',
  'Technical Issue',
  'Feature Request',
  'Other',
]

interface SupportTicketModalProps {
  isOpen: boolean
  onClose: () => void
}

const SupportTicketModal: React.FC<SupportTicketModalProps> = ({ isOpen, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [category, setCategory] = useState<SupportCategory | ''>('')
  const [message, setMessage] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachedFiles((prev) => [...prev, ...files])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    setAttachedFiles((prev) => [...prev, ...files])
  }

  const handleClose = () => {
    if (isSubmitting) return
    setCategory('')
    setMessage('')
    setAttachedFiles([])
    setError(null)
    setIsSuccess(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!category) {
      setError('Please select a category.')
      return
    }
    if (!message.trim() || message.trim().length < 10) {
      setError('Please describe your issue in at least 10 characters.')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Upload attachments if any
      const assetIds: string[] = []
      if (attachedFiles.length > 0) {
        setIsUploadingFiles(true)
        for (const file of attachedFiles) {
          const { assetId } = await uploadApi.uploadFile(file)
          assetIds.push(assetId)
        }
        setIsUploadingFiles(false)
      }

      // 2. Submit ticket
      await supportService.createTicket({
        category,
        message: message.trim(),
        attachmentAssetIds: assetIds,
      })

      setIsSuccess(true)
    } catch (err) {
      logger.error('support_ticket.submit_failed', { error: serializeError(err) })
      setIsUploadingFiles(false)
      setError('Failed to submit ticket. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-border">
          <div>
            <h2 className="text-text-main font-bold text-xl leading-tight">Get in touch with the team</h2>
            <p className="text-text-muted text-sm mt-1">We usually respond within 24 hours.</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-text-muted hover:text-text-main transition-colors disabled:opacity-50 ml-4"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success State */}
        {isSuccess ? (
          <div className="p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 size={36} className="text-success" />
            </div>
            <h3 className="text-text-main font-bold text-xl">Ticket submitted!</h3>
            <p className="text-text-muted text-sm max-w-xs leading-relaxed">
              We've received your message and will get back to you as soon as possible.
            </p>
            <Button variant="primary" onClick={handleClose} className="mt-4 px-8 py-3 rounded-xl font-bold">
              Done
            </Button>
          </div>
        ) : (
          <form className="p-8 space-y-6" onSubmit={handleSubmit}>
            {/* Category */}
            <div className="space-y-2">
              <label className="text-text-muted text-xs font-semibold uppercase tracking-wider block">
                How can we help you?
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SupportCategory)}
                  className={cn(
                    'w-full appearance-none bg-bg-dark border-b py-3 pr-8 text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer',
                    category ? 'text-text-main' : 'text-text-muted',
                    !category && error ? 'border-error' : 'border-border'
                  )}
                >
                  <option value="" disabled>Choose an option</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-bg-card text-text-main">
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-text-muted text-xs font-semibold uppercase tracking-wider block">
                Your message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type here..."
                rows={4}
                className="w-full bg-bg-dark border-b border-border py-3 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary resize-none text-sm transition-colors"
              />
            </div>

            {/* Attachments */}
            <div className="space-y-3">
              <label className="text-text-muted text-xs font-semibold uppercase tracking-wider block">
                Upload attachments <span className="lowercase opacity-60">(optional)</span>
              </label>

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/60 transition-all group"
              >
                <Upload size={22} className="text-text-muted group-hover:text-primary transition-colors" />
                <p className="text-text-muted text-sm">
                  Drop files here or <span className="text-primary font-medium">click to browse</span>
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* File list */}
              {attachedFiles.length > 0 && (
                <div className="space-y-2">
                  {attachedFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between bg-bg-dark border border-border rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileIcon size={14} className="text-text-muted flex-shrink-0" />
                        <span className="text-text-main text-xs truncate">{file.name}</span>
                        <span className="text-text-muted text-xs flex-shrink-0">
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <button type="button" onClick={() => removeFile(i)} className="text-text-muted hover:text-error transition-colors ml-2">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-lg text-xs text-error">
                <AlertCircle size={14} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              variant="primary"
              type="submit"
              fullWidth
              isLoading={isSubmitting}
              className="py-3.5 rounded-xl font-bold shadow-lg shadow-primary/20"
            >
              {isUploadingFiles ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Uploading files...
                </span>
              ) : (
                'Send'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

export default SupportTicketModal

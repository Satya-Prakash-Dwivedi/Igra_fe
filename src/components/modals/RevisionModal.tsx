import React, { useState, useRef } from 'react'
import { X, Upload, AlertCircle, CheckCircle2, Loader2, File as FileIcon, Trash2 } from 'lucide-react'
import Button, { cn } from '../Button'
import * as orderApi from '../../services/orderService'
import * as uploadApi from '../../services/uploadService'
import { createLogger, serializeError } from '../../services/logger'

const logger = createLogger('RevisionModal')

interface RevisionModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  itemId: string
  onSuccess: () => void
}

const RevisionModal: React.FC<RevisionModalProps> = ({ isOpen, onClose, orderId, itemId, onSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [notes, setNotes] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
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
    setNotes('')
    setAttachedFiles([])
    setUploadProgress({})
    setError(null)
    setIsSuccess(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!notes.trim() || notes.trim().length < 5) {
      setError('Please describe your revision requirements in at least 5 characters.')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Upload attachments if any
      const assetIds: string[] = []
      if (attachedFiles.length > 0) {
        setIsUploadingFiles(true)
        for (const file of attachedFiles) {
          const { assetId } = await uploadApi.uploadFile(file, (pct) => {
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: pct,
            }))
          })
          assetIds.push(assetId)
        }
        setIsUploadingFiles(false)
      }

      // 2. Submit revision request
      await orderApi.requestRevision(orderId, itemId, notes.trim(), assetIds)

      setIsSuccess(true)
      onSuccess()
    } catch (err: any) {
      logger.error('revision_modal.submit_failed', { error: serializeError(err) })
      setIsUploadingFiles(false)
      setError(err?.response?.data?.error || err.message || 'Failed to submit revision request. Please try again.')
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
            <h2 className="text-text-main font-bold text-xl leading-tight">Request Revision</h2>
            <p className="text-text-muted text-sm mt-1">Specify changes and provide reference files for the studio.</p>
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
            <h3 className="text-text-main font-bold text-xl">Revision Requested!</h3>
            <p className="text-text-muted text-sm max-w-xs leading-relaxed">
              Your revision instructions and reference assets have been transmitted to the production team.
            </p>
            <Button variant="primary" onClick={handleClose} className="mt-4 px-8 py-3 rounded-xl font-bold">
              Done
            </Button>
          </div>
        ) : (
          <form className="p-8 space-y-6" onSubmit={handleSubmit}>
            {/* Notes */}
            <div className="space-y-2">
              <label className="text-text-muted text-xs font-semibold uppercase tracking-wider block">
                Describe requested changes (minimum 5 characters)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What would you like to change? (e.g. adjust audio level, replace thumbnail text, etc.)"
                rows={4}
                className="w-full bg-bg-dark border-b border-border py-3 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary resize-none text-sm transition-colors"
                disabled={isSubmitting}
              />
            </div>

            {/* Attachments */}
            <div className="space-y-3">
              <label className="text-text-muted text-xs font-semibold uppercase tracking-wider block">
                Attach reference files/videos/documents <span className="lowercase opacity-60">(optional)</span>
              </label>

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => !isSubmitting && fileInputRef.current?.click()}
                className={cn(
                  "border border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/60 transition-all group",
                  isSubmitting && "opacity-50 cursor-not-allowed pointer-events-none"
                )}
              >
                <Upload size={22} className="text-text-muted group-hover:text-primary transition-colors" />
                <p className="text-text-muted text-xs">
                  Drop files here or <span className="text-primary font-medium">click to browse</span>
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                disabled={isSubmitting}
              />

              {/* File list */}
              {attachedFiles.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {attachedFiles.map((file, i) => {
                    const progress = uploadProgress[file.name] || 0
                    return (
                      <div key={i} className="flex flex-col bg-bg-dark border border-border rounded-lg p-3 gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileIcon size={14} className="text-text-muted flex-shrink-0" />
                            <span className="text-text-main text-xs truncate">{file.name}</span>
                            <span className="text-text-muted text-[10px] flex-shrink-0">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          {!isSubmitting && (
                            <button type="button" onClick={() => removeFile(i)} className="text-text-muted hover:text-error transition-colors ml-2">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        {isUploadingFiles && progress > 0 && (
                          <div className="w-full bg-border h-1 rounded-full overflow-hidden">
                            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-lg text-xs text-error animate-in shake duration-300">
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
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 size={16} className="animate-spin" /> Uploading reference assets...
                </span>
              ) : (
                'Submit Revision Request'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

export default RevisionModal

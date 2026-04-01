import React, { useState, useRef } from 'react'
import { ArrowLeft, Upload, AlertCircle, CheckCircle2, Trash2, File as FileIcon, Loader2 } from 'lucide-react'
import Button from '../Button'
import supportService from '../../services/supportService'
import * as uploadApi from '../../services/uploadService'
import { createLogger, serializeError } from '../../services/logger'

const logger = createLogger('BugReportModal')

interface BugReportModalProps {
  isOpen: boolean
  onClose: () => void
}

const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
  const screenshotInputRef = useRef<HTMLInputElement>(null)

  const [description, setDescription] = useState('')
  const [screenshots, setScreenshots] = useState<File[]>([])
  const [wantsFollowUp, setWantsFollowUp] = useState(true)
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setScreenshots((prev) => [...prev, ...files])
    if (screenshotInputRef.current) screenshotInputRef.current.value = ''
  }

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index))
  }

  const handleClose = () => {
    if (isSubmitting) return
    setDescription('')
    setScreenshots([])
    setWantsFollowUp(true)
    setError(null)
    setIsSuccess(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!description.trim() || description.trim().length < 10) {
      setError('Please describe the bug in at least 10 characters.')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Upload screenshots if any
      const assetIds: string[] = []
      if (screenshots.length > 0) {
        setIsUploadingFiles(true)
        for (const file of screenshots) {
          const assetId = await uploadApi.uploadFile(file)
          await uploadApi.finalizeUpload(assetId)
          assetIds.push(assetId)
        }
        setIsUploadingFiles(false)
      }

      // 2. Submit bug report
      await supportService.createBugReport({
        description: description.trim(),
        screenshotAssetIds: assetIds,
        wantsFollowUp,
      })

      setIsSuccess(true)
    } catch (err) {
      logger.error('bug_report.submit_failed', { error: serializeError(err) })
      setIsUploadingFiles(false)
      setError('Failed to submit bug report. Please try again.')
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

      {/* Modal Content */}
      <div className="relative bg-bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300 shadow-2xl">
        <div className="p-8">
          {/* Success State */}
          {isSuccess ? (
            <div className="flex flex-col items-center text-center gap-4 py-6">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 size={36} className="text-success" />
              </div>
              <h3 className="text-text-main font-bold text-xl">Bug report sent!</h3>
              <p className="text-text-muted text-sm max-w-xs leading-relaxed">
                Thanks for helping us improve Igra Studios. {wantsFollowUp ? "We'll follow up with you shortly." : ''}
              </p>
              <Button variant="primary" onClick={handleClose} className="mt-4 px-8 py-3 rounded-xl font-bold">
                Done
              </Button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <button
                  onClick={handleClose}
                  className="mt-1 text-primary hover:text-primary-hover transition-colors"
                >
                  <ArrowLeft size={24} />
                </button>
                <div className="space-y-1">
                  <h2 className="text-text-main font-bold text-xl leading-tight">
                    Find something that isn't working as expected?
                  </h2>
                  <p className="text-text-muted text-sm">
                    We appreciate you helping us build Igra Studios into the best app it can be!
                  </p>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Description */}
                <div className="space-y-2">
                  <label className="text-text-main font-semibold block text-sm">
                    What isn't working as expected?
                  </label>
                  <p className="text-text-muted text-xs leading-relaxed">
                    Please use as many descriptors as possible to expedite a fix. What were you doing when you found the bug? How might we replicate it?
                  </p>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-bg-dark border-b border-border p-2 text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary resize-none min-h-28 text-sm transition-colors"
                    placeholder="Type here..."
                  />
                </div>

                {/* Screenshot Upload */}
                <div className="space-y-3">
                  <label className="text-text-main font-semibold block text-sm">
                    Upload screenshots <span className="text-text-muted font-normal">(optional)</span>
                  </label>
                  <div
                    onClick={() => screenshotInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-all group"
                  >
                    <Upload size={24} className="text-text-muted group-hover:text-primary transition-colors" />
                    <p className="text-text-muted text-sm">
                      Drop files here to upload (or <span className="text-primary">click</span>)
                    </p>
                  </div>
                  <input
                    ref={screenshotInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {screenshots.length > 0 && (
                    <div className="space-y-2">
                      {screenshots.map((file, i) => (
                        <div key={i} className="flex items-center justify-between bg-bg-dark border border-border rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileIcon size={14} className="text-text-muted flex-shrink-0" />
                            <span className="text-text-main text-xs truncate">{file.name}</span>
                          </div>
                          <button type="button" onClick={() => removeScreenshot(i)} className="text-text-muted hover:text-error transition-colors ml-2">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Follow-up */}
                <div className="space-y-3 pt-2">
                  <label className="text-text-main font-semibold block text-sm">
                    Would you like us to follow up with you on this report?
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="follow-up"
                        className="accent-primary w-4 h-4"
                        checked={wantsFollowUp}
                        onChange={() => setWantsFollowUp(true)}
                      />
                      <span className="text-text-main text-sm">Yes, please</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="follow-up"
                        className="accent-primary w-4 h-4"
                        checked={!wantsFollowUp}
                        onChange={() => setWantsFollowUp(false)}
                      />
                      <span className="text-text-main text-sm">No, thanks</span>
                    </label>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-lg text-xs text-error">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Submit */}
                <Button variant="primary" type="submit" fullWidth isLoading={isSubmitting} className="py-3 rounded-xl font-semibold mt-4">
                  {isUploadingFiles ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Uploading screenshots...
                    </span>
                  ) : (
                    'Send bug report'
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default BugReportModal

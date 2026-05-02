import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bug,
  Upload,
  ChevronRight,
  X,
  Trash2,
  File as FileIcon,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Camera,
  MessageSquare,
  Zap
} from 'lucide-react'
import Button, { cn } from '../components/Button'
import * as uploadApi from '../services/uploadService'
import supportApi from '../services/supportService'
import { createLogger, serializeError } from '../services/logger'
import { toast } from 'sonner'

const logger = createLogger('ReportBug')

const ReportBug = () => {
  const navigate = useNavigate()
  const [description, setDescription] = useState('')
  const [screenshots, setScreenshots] = useState<File[]>([])
  const [wantsFollowUp, setWantsFollowUp] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const screenshotInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setScreenshots((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (description.length < 10) {
      setError('Please provide a more detailed description (min 10 characters).')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      let screenshotAssetIds: string[] = []
      if (screenshots.length > 0) {
        setIsUploadingFiles(true)
        for (const file of screenshots) {
          const { assetId } = await uploadApi.uploadFile(file)
          screenshotAssetIds.push(assetId)
        }
        setIsUploadingFiles(false)
      }

      await supportApi.createBugReport({
        description,
        screenshotAssetIds,
        wantsFollowUp
      })

      toast.success('Bug report submitted. Thank you for your feedback!')
      navigate('/dashboard')
    } catch (err: any) {
      logger.error('bug_report.submit_failed', { error: serializeError(err) })
      setError(err?.response?.data?.error || 'Failed to submit report. Please try again.')
    } finally {
      setIsSubmitting(false)
      setIsUploadingFiles(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 px-6 animate-in fade-in duration-700 relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-10 relative z-10">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center bg-bg-card/40 border border-white/5 rounded-xl text-primary hover:bg-white/5 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white tracking-tight">Report Bug</h1>
            <p className="text-text-dim/60 text-sm">Help us improve Igra Studios by reporting any issues you find.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Description */}
            <div className="bg-bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <MessageSquare size={20} />
                 </div>
                 <h3 className="text-lg font-bold text-white">Issue Description</h3>
              </div>
              
              <div className="space-y-4">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black/20 border border-white/5 rounded-xl p-6 text-white placeholder:text-text-dim/20 focus:ring-2 focus:ring-primary/50 outline-none resize-none min-h-[200px] text-sm transition-all"
                  placeholder="Describe the bug in detail..."
                />
              </div>
            </div>

            {/* Screenshots */}
            <div className="bg-bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Camera size={20} />
                 </div>
                 <h3 className="text-lg font-bold text-white">Screenshots</h3>
              </div>
              
              <div className="space-y-6">
                <div
                  onClick={() => screenshotInputRef.current?.click()}
                  className="border-2 border-dashed border-white/5 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/20 transition-all bg-white/[0.01]"
                >
                  <Upload size={24} className="text-text-dim/20" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">Upload Screenshots</p>
                    <p className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest mt-1">PNG, JPG, JPEG up to 10MB</p>
                  </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {screenshots.map((file, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileIcon size={14} className="text-text-dim/40" />
                          <div className="min-w-0">
                             <p className="text-[10px] font-bold text-white truncate">{file.name}</p>
                             <p className="text-[9px] font-bold text-text-dim/40 uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => removeScreenshot(i)} className="text-text-dim/20 hover:text-error transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="space-y-8">
           {/* Follow-up */}
           <div className="bg-bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Zap size={20} />
                 </div>
                 <h3 className="text-lg font-bold text-white">Options</h3>
              </div>
              
              <div className="space-y-3">
                 <div 
                   onClick={() => setWantsFollowUp(true)}
                   className={cn(
                     "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                     wantsFollowUp ? "bg-primary/5 border-primary/20 text-white" : "bg-transparent border-white/5 text-text-dim/40"
                   )}
                 >
                    <div className={cn("w-3 h-3 rounded-full border-2", wantsFollowUp ? "border-primary bg-primary" : "border-white/10")} />
                    <span className="text-xs font-bold">Wants follow-up</span>
                 </div>
                 
                 <div 
                   onClick={() => setWantsFollowUp(false)}
                   className={cn(
                     "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                     !wantsFollowUp ? "bg-primary/5 border-primary/20 text-white" : "bg-transparent border-white/5 text-text-dim/40"
                   )}
                 >
                    <div className={cn("w-3 h-3 rounded-full border-2", !wantsFollowUp ? "border-primary bg-primary" : "border-white/10")} />
                    <span className="text-xs font-bold">Anonymous report</span>
                 </div>
              </div>
           </div>

           {/* Submit */}
           <div className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-4 bg-error/10 border border-error/20 rounded-xl text-[10px] font-bold text-error uppercase tracking-widest">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <Button 
                onClick={handleSubmit} 
                className="w-full h-14 rounded-xl font-bold"
                isLoading={isSubmitting}
              >
                {isUploadingFiles ? 'Uploading Files...' : 'Submit Report'}
                <ChevronRight size={18} className="ml-2" />
              </Button>
           </div>
        </div>
      </div>
    </div>
  )
}

export default ReportBug

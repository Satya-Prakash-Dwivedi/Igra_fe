import api from './api'

// ─── Types ────────────────────────────────────────────────────
export interface UploadStart {
  uploadSessionId: string
  assetId: string
  presignedUrls: string[]
  partSizeBytes: number
  totalParts: number
  isDirect?: boolean
}

export interface UploadStatus {
  status: string
  totalParts: number
  uploadedParts: number
  isComplete: boolean
}

export interface UploadResult {
  assetId: string
  url: string
}

// ─── API Functions ────────────────────────────────────────────
export async function startUpload(fileName: string, fileSize: number, mimeType: string) {
  const res = await api.post('/uploads/start', { fileName, fileSize, mimeType })
  return res.data.data as UploadStart
}

export async function registerPart(sessionId: string, partNumber: number, etag: string, sizeBytes?: number) {
  const res = await api.post(`/uploads/${sessionId}/parts`, { partNumber, etag, sizeBytes })
  return res.data.data
}

export async function finalizeUpload(sessionId: string) {
  const res = await api.post(`/uploads/${sessionId}/finalize`)
  return res.data.data
}

export async function getUploadStatus(sessionId: string) {
  const res = await api.get(`/uploads/${sessionId}/status`)
  return res.data.data as UploadStatus
}

/**
 * Upload a file in chunks using the resumable upload API.
 * Returns the assetId and url once complete.
 */
export async function uploadFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  // 1. Start upload
  const { uploadSessionId, assetId, presignedUrls, partSizeBytes, totalParts, isDirect } = await startUpload(
    file.name,
    file.size,
    file.type || 'application/octet-stream',
  )

  // 1b. Direct Upload Path (Optimization for assets < 20MB)
  if (isDirect) {
    if (onProgress) onProgress(10)
    
    await fetch(presignedUrls[0], {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    })

    if (onProgress) onProgress(90)
    const finalizeRes = await finalizeUpload(uploadSessionId)
    if (onProgress) onProgress(100)
    
    return {
      assetId,
      url: finalizeRes?.url
    }
  }

  // 2. Multipart Upload Path (For large assets >= 20MB)
  for (let i = 0; i < totalParts; i++) {
    const start = i * partSizeBytes
    const end = Math.min(start + partSizeBytes, file.size)
    const blob = file.slice(start, end)

    // Upload to presigned URL (direct to storage)
    const uploadRes = await fetch(presignedUrls[i], {
      method: 'PUT',
      body: blob,
    })

    const etag = uploadRes.headers.get('etag') || `part-${i + 1}`

    // Register part with API
    await registerPart(uploadSessionId, i + 1, etag, end - start)

    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalParts) * 100))
    }
  }

  // 3. Finalize and return asset details
  const finalizeRes = await finalizeUpload(uploadSessionId)

  return {
    assetId,
    url: finalizeRes?.url
  }
}

/**
 * Resume an interrupted multipart upload by checking status and only uploading missing chunks.
 */
export async function resumeUpload(file: File, sessionId: string, onProgress?: (pct: number) => void): Promise<UploadResult> {
  const res = await api.get(`/uploads/${sessionId}/resume`)
  const { uploadSessionId, assetId, partSizeBytes, totalParts, uploadedPartNumbers, presignedUrls } = res.data.data

  let totalUploaded = uploadedPartNumbers.length

  for (let i = 0; i < totalParts; i++) {
    const partNumber = i + 1
    if (uploadedPartNumbers.includes(partNumber)) {
      if (onProgress) onProgress(Math.round((totalUploaded / totalParts) * 100))
      continue
    }

    const start = i * partSizeBytes
    const end = Math.min(start + partSizeBytes, file.size)
    const blob = file.slice(start, end)

    const uploadRes = await fetch(presignedUrls[partNumber], {
      method: 'PUT',
      body: blob,
    })

    const etag = uploadRes.headers.get('etag') || `part-${partNumber}`
    await registerPart(uploadSessionId, partNumber, etag, end - start)

    totalUploaded++
    if (onProgress) onProgress(Math.round((totalUploaded / totalParts) * 100))
  }

  const finalizeRes = await finalizeUpload(uploadSessionId)
  return {
    assetId,
    url: finalizeRes?.url
  }
}


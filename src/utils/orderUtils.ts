export function calculateDeadline(
  approvedAt: string | undefined | null,
  createdAt: string,
  orderStatus: string,
  serviceKind: string,
  params: any
): { date: Date | null; formatted: string; status: 'NORMAL' | 'URGENT' | 'OVERDUE' | 'NONE' | 'COMPLETED' } {
  // For existing orders before approvedAt was introduced, fallback to createdAt
  const isPostApproval = ['IN_PROGRESS', 'AWAITING_APPROVAL', 'COMPLETED'].includes(orderStatus)
  const baseDateStr = approvedAt || (isPostApproval ? createdAt : null)

  if (!baseDateStr) {
    return { date: null, formatted: 'Pending Approval', status: 'NONE' }
  }

  const startDate = new Date(baseDateStr)
  let daysToAdd = 1 // Default to 1 day for non-video services

  if (serviceKind === 'VIDEO_EDIT' || serviceKind === 'GAMING_STREAMS') {
    const isExpress = params?.deliverySpeed === 'EXPRESS'
    const tier = params?.packageTier || 'STANDARD'

    if (isExpress) {
      if (tier === 'BASIC') daysToAdd = 2
      else if (tier === 'STANDARD') daysToAdd = 3
      else if (tier === 'PREMIUM') daysToAdd = 4
    } else {
      if (tier === 'BASIC') daysToAdd = 6
      else if (tier === 'STANDARD') daysToAdd = 7
      else if (tier === 'PREMIUM') daysToAdd = 7
    }
  }

  const deadlineDate = new Date(startDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
  const now = new Date()
  const diffTime = deadlineDate.getTime() - now.getTime()
  const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  let status: 'NORMAL' | 'URGENT' | 'OVERDUE' | 'COMPLETED' = 'NORMAL'
  if (['COMPLETED', 'DELIVERED'].includes(orderStatus)) {
    status = 'COMPLETED'
  } else if (daysDiff < 0) {
    status = 'OVERDUE'
  } else if (daysDiff <= 1) {
    status = 'URGENT'
  }

  const formatter = new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
  
  return {
    date: deadlineDate,
    formatted: formatter.format(deadlineDate),
    status,
  }
}

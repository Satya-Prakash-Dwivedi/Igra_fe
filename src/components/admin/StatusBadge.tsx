import React from 'react'
import { cn } from '../Button'

type StatusVariant = string

const STATUS_STYLES: Record<string, string> = {
  // Order statuses
  UNDER_REVIEW:       'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  IN_PROGRESS:        'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  COMPLETED:          'bg-success/15 text-success border border-success/30',
  CANCELLED:          'bg-error/15 text-error border border-error/30',
  AWAITING_APPROVAL:  'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  FINALIZING:         'bg-teal-500/15 text-teal-400 border border-teal-500/30',
  DRAFT:              'bg-text-muted/10 text-text-muted border border-border',
  PENDING_PAYMENT:    'bg-text-muted/10 text-text-muted border border-border',
  // Item statuses
  PENDING_INPUT:      'bg-text-muted/10 text-text-muted border border-border',
  BLOCKED:            'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  READY:              'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  DELIVERED:          'bg-teal-500/15 text-teal-400 border border-teal-500/30',
  APPROVED:           'bg-success/15 text-success border border-success/30',
  FAILED:             'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  // Support statuses
  open:               'bg-text-muted/10 text-text-muted border border-border',
  in_progress:        'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  resolved:           'bg-success/15 text-success border border-success/30',
  closed:             'bg-error/15 text-error border border-error/30',
}

const STATUS_LABELS: Record<string, string> = {
  UNDER_REVIEW:      'Under Review',
  IN_PROGRESS:       'In Progress',
  COMPLETED:         'Completed',
  CANCELLED:         'Cancelled',
  AWAITING_APPROVAL: 'Awaiting Approval',
  FINALIZING:        'Finalizing',
  DRAFT:             'Draft',
  PENDING_PAYMENT:   'Pending Payment',
  PENDING_INPUT:     'Pending Input',
  BLOCKED:           'Blocked',
  READY:             'Ready',
  DELIVERED:         'Delivered',
  APPROVED:          'Approved',
  FAILED:            'Failed',
  open:              'Open',
  in_progress:       'In Progress',
  resolved:          'Resolved',
  closed:            'Closed',
}

interface StatusBadgeProps {
  status: StatusVariant
  className?: string
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const styles = STATUS_STYLES[status] ?? 'bg-text-muted/10 text-text-muted border border-border'
  const label = STATUS_LABELS[status] ?? status

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap', styles, className)}>
      {label}
    </span>
  )
}

export default StatusBadge

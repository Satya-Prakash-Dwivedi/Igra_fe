import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../Button'

interface PaginationProps {
  page: number
  pages: number
  total: number
  onPageChange: (page: number) => void
}

const Pagination: React.FC<PaginationProps> = ({ page, pages, total, onPageChange }) => {
  if (pages <= 1) return null

  const getPageNumbers = () => {
    const delta = 2
    const range: number[] = []
    for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
      range.push(i)
    }
    if (range[0] > 1) {
      if (range[0] > 2) range.unshift(-1) // ellipsis
      range.unshift(1)
    }
    if (range[range.length - 1] < pages) {
      if (range[range.length - 1] < pages - 1) range.push(-1) // ellipsis
      range.push(pages)
    }
    return range
  }

  const btnBase = 'w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all'

  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-text-muted text-xs">
        Page <span className="text-text-main font-medium">{page}</span> of{' '}
        <span className="text-text-main font-medium">{pages}</span>
        {' '}· {total} total
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={cn(btnBase, 'border border-border text-text-muted hover:text-text-main hover:border-primary/50 disabled:opacity-30 disabled:pointer-events-none')}
        >
          <ChevronLeft size={14} />
        </button>

        {getPageNumbers().map((p, i) =>
          p === -1 ? (
            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-text-muted text-sm">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                btnBase,
                p === page
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'border border-border text-text-muted hover:text-text-main hover:border-primary/50'
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className={cn(btnBase, 'border border-border text-text-muted hover:text-text-main hover:border-primary/50 disabled:opacity-30 disabled:pointer-events-none')}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

export default Pagination

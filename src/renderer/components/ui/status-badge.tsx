import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const statusBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground',
        success: 'bg-green-500/20 text-green-400 border border-green-500/30',
        error: 'bg-red-500/20 text-red-400 border border-red-500/30',
        warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
        info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        idle: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  status?: 'ready' | 'error' | 'warning' | 'idle' | 'active' | 'paused' | 'completed' | 'draft'
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, variant, status, children, ...props }, ref) => {
    // Auto-map status to variant if not explicitly provided
    let mappedVariant = variant
    if (!variant && status) {
      const statusMap: Record<string, VariantProps<typeof statusBadgeVariants>['variant']> = {
        ready: 'success',
        active: 'success',
        error: 'error',
        warning: 'warning',
        idle: 'idle',
        paused: 'warning',
        completed: 'info',
        draft: 'default',
      }
      mappedVariant = statusMap[status] || 'default'
    }

    return (
      <span
        ref={ref}
        className={cn(statusBadgeVariants({ variant: mappedVariant }), className)}
        {...props}
      >
        {children || (status ? status.toUpperCase() : '')}
      </span>
    )
  }
)
StatusBadge.displayName = 'StatusBadge'

export { StatusBadge, statusBadgeVariants }


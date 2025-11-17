import * as React from 'react'
import { cn } from '../../lib/utils'

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
  small?: boolean
  fullScreen?: boolean
}

const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ className, message, small, fullScreen, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'loading',
          small && 'small',
          fullScreen && 'fixed inset-0 flex items-center justify-center',
          'flex items-center justify-center',
          className
        )}
        {...props}
      >
        <div className="flex flex-col items-center gap-2">
          <div className={cn(
            'animate-spin rounded-full border-2 border-muted border-t-primary',
            small ? 'h-4 w-4' : 'h-8 w-8'
          )} />
          {message && (
            <p className={cn(
              'text-muted-foreground',
              small ? 'text-xs' : 'text-sm'
            )}>
              {message}
            </p>
          )}
        </div>
      </div>
    )
  }
)
LoadingState.displayName = 'LoadingState'

export { LoadingState }


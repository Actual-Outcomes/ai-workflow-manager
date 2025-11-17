import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { SectionHeader } from '../ui/section-header'
import { cn } from '../../lib/utils'

export interface DiagnosticCardProps extends React.HTMLAttributes<HTMLElement> {
  title: string
  description?: string
  actions?: React.ReactNode
  span?: number
  children: React.ReactNode
}

export const DiagnosticCard = React.forwardRef<HTMLElement, DiagnosticCardProps>(
  ({ className, title, description, actions, span, children, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn(
          'diagnostic-card',
          span && `span-${span}`,
          className
        )}
        {...props}
      >
        <Card>
          <CardHeader>
            <SectionHeader
              title={title}
              description={description}
              actions={actions}
            />
          </CardHeader>
          <CardContent>
            {children}
          </CardContent>
        </Card>
      </section>
    )
  }
)
DiagnosticCard.displayName = 'DiagnosticCard'


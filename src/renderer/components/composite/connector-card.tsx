import * as React from 'react'
import { Button } from '../ui/button'
import { StatusBadge } from '../ui/status-badge'
import { Card, CardContent, CardHeader } from '../ui/card'

export interface ConnectorCardProps {
  id: string
  name: string
  kind: string
  version: string
  status: 'ready' | 'error' | 'warning' | 'idle'
  description?: string
  healthCheck?: {
    status: string
    message?: string
    latencyMs?: number
  }
  onTest?: () => void
  onRemove?: () => void
  testLoading?: boolean
  className?: string
}

export const ConnectorCard: React.FC<ConnectorCardProps> = ({
  name,
  kind,
  version,
  status,
  description,
  healthCheck,
  onTest,
  onRemove,
  testLoading = false,
  className
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-semibold text-foreground">{name}</h4>
            <small className="text-sm text-muted-foreground">
              {kind} · v{version}
            </small>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {healthCheck && (
          <div className="flex items-center gap-2 text-sm">
            <strong className={healthCheck.status === 'healthy' ? 'text-green-400' : 'text-red-400'}>
              {healthCheck.status === 'healthy' ? '✓' : '✗'} {healthCheck.status.toUpperCase()}
            </strong>
            <span className="text-muted-foreground">{healthCheck.message || healthCheck.status}</span>
          </div>
        )}
        <div className="flex gap-2">
          {onTest && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onTest}
              disabled={testLoading}
            >
              {testLoading ? 'Testing…' : 'Run Health Check'}
            </Button>
          )}
          {onRemove && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onRemove}
            >
              Remove
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


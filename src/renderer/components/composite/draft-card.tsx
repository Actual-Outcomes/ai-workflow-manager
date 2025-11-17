import * as React from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader } from '../ui/card'
import { StatusBadge } from '../ui/status-badge'

export interface DraftCardProps {
  id: number
  name: string
  version: number
  status: string
  updatedAt: string
  onOpenDesigner?: () => void
  onValidate?: () => void
  onPublish?: () => void
  onDelete?: () => void
  disabled?: boolean
  className?: string
}

export const DraftCard: React.FC<DraftCardProps> = ({
  name,
  version,
  status,
  updatedAt,
  onOpenDesigner,
  onValidate,
  onPublish,
  onDelete,
  disabled = false,
  className
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-semibold text-foreground">{name}</h4>
            <small className="text-sm text-muted-foreground">
              v{version} · {status}
            </small>
          </div>
          <span className="text-xs text-muted-foreground">
            Updated {new Date(updatedAt).toLocaleString()}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {onOpenDesigner && (
            <Button
              size="sm"
              onClick={onOpenDesigner}
              disabled={disabled}
            >
              Open Designer
            </Button>
          )}
          {onValidate && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onValidate}
              disabled={disabled}
            >
              {disabled ? 'Working…' : 'Validate'}
            </Button>
          )}
          {onPublish && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onPublish}
              disabled={disabled}
            >
              Publish
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={disabled}
            >
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


import * as React from 'react'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { StatusBadge } from '../ui/status-badge'
import { Card, CardContent, CardHeader } from '../ui/card'

export interface WorkflowCardProps {
  id: number
  name: string
  description?: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  createdAt: string
  runs?: Array<{
    id: number
    status: string
  }>
  onRun?: () => void
  onStatusChange?: (status: string) => void
  onExport?: () => void
  onDelete?: () => void
  executing?: boolean
  className?: string
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({
  name,
  description,
  status,
  createdAt,
  runs = [],
  onRun,
  onStatusChange,
  onExport,
  onDelete,
  executing = false,
  className
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{name}</h3>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {description && (
          <p className="text-sm text-muted-foreground">
            {description || 'No description'}
          </p>
        )}
        <div className="text-xs text-muted-foreground">
          Created: {new Date(createdAt).toLocaleDateString()}
        </div>
        <div className="flex flex-wrap gap-2">
          {onRun && (
            <Button
              size="sm"
              onClick={onRun}
              disabled={executing}
            >
              {executing ? 'Starting…' : 'Run'}
            </Button>
          )}
          {onStatusChange && (
            <Select
              value={status}
              onValueChange={onStatusChange}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          )}
          {onExport && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onExport}
              title="Export workflow"
            >
              Export
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
            >
              Delete
            </Button>
          )}
        </div>
        {runs.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <strong>Runs:</strong> {runs.length}
            {runs.some((r) => r.status === 'running') && (
              <span className="text-green-400 ml-2">● Running</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


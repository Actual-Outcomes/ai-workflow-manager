/**
 * WorkflowEventPublisher - Central event bus for workflow execution events
 * 
 * Uses Observer pattern to allow subscribers to listen for workflow events.
 * Events are published during workflow execution and can be subscribed to
 * for real-time UI updates, logging, notifications, etc.
 */

export type WorkflowEventType =
  | 'workflow-started'
  | 'workflow-completed'
  | 'workflow-failed'
  | 'workflow-paused'
  | 'workflow-resumed'
  | 'node-entered'
  | 'node-exited'
  | 'action-executed'
  | 'transition-evaluated'
  | 'validator-executed'

export interface WorkflowEvent {
  type: WorkflowEventType
  runId: number
  timestamp: string
  payload: Record<string, unknown>
}

export type WorkflowEventCallback = (event: WorkflowEvent) => void

export class WorkflowEventPublisher {
  private subscribers: Map<WorkflowEventType, Set<WorkflowEventCallback>> = new Map()
  private allSubscribers: Set<WorkflowEventCallback> = new Set()

  /**
   * Subscribe to specific event types
   */
  subscribe(eventType: WorkflowEventType, callback: WorkflowEventCallback): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set())
    }
    this.subscribers.get(eventType)!.add(callback)

    // Return unsubscribe function
    return () => {
      this.subscribers.get(eventType)?.delete(callback)
    }
  }

  /**
   * Subscribe to all event types
   */
  subscribeAll(callback: WorkflowEventCallback): () => void {
    this.allSubscribers.add(callback)
    return () => {
      this.allSubscribers.delete(callback)
    }
  }

  /**
   * Publish an event to all subscribers
   */
  publish(event: WorkflowEvent): void {
    // Notify type-specific subscribers
    const typeSubscribers = this.subscribers.get(event.type)
    if (typeSubscribers) {
      typeSubscribers.forEach((callback) => {
        try {
          callback(event)
        } catch (error) {
          console.error(`Error in event subscriber for ${event.type}:`, error)
        }
      })
    }

    // Notify all-event subscribers
    this.allSubscribers.forEach((callback) => {
      try {
        callback(event)
      } catch (error) {
        console.error(`Error in all-event subscriber:`, error)
      }
    })
  }

  /**
   * Publish an event by type and payload
   */
  publishEvent(
    type: WorkflowEventType,
    runId: number,
    payload: Record<string, unknown> = {}
  ): void {
    this.publish({
      type,
      runId,
      timestamp: new Date().toISOString(),
      payload
    })
  }

  /**
   * Clear all subscribers (useful for cleanup)
   */
  clear(): void {
    this.subscribers.clear()
    this.allSubscribers.clear()
  }
}

// Singleton instance
let eventPublisherInstance: WorkflowEventPublisher | null = null

export function getWorkflowEventPublisher(): WorkflowEventPublisher {
  if (!eventPublisherInstance) {
    eventPublisherInstance = new WorkflowEventPublisher()
  }
  return eventPublisherInstance
}


import { WorkflowDatabase } from '../database'
import { LoggingService } from '../logging/loggingService'
import { NotificationPreferenceService } from '../notifications/notificationPreferenceService'
import { WorkflowExecutionService } from '../workflows/workflowExecutionService'
import { WorkflowDraftService } from '../workflows/workflowDraftService'
import { ScheduleRecord, SchedulerService } from './schedulerService'
import { RetentionService } from '../ops/retentionService'

const DEFAULT_INTERVAL_MS = 60_000

export class SchedulerRunner {
  private timer?: NodeJS.Timeout
  private readonly intervalMs: number

  constructor(
    private scheduler: SchedulerService,
    private workflowDb: WorkflowDatabase,
    private workflowExecutionService: WorkflowExecutionService,
    private workflowDraftService: WorkflowDraftService,
    private loggingService: LoggingService,
    private notificationPrefs: NotificationPreferenceService,
    private retentionService?: RetentionService,
    options?: { intervalMs?: number }
  ) {
    this.intervalMs = options?.intervalMs ?? DEFAULT_INTERVAL_MS
  }

  start() {
    this.stop()
    this.timer = setInterval(() => {
      this.runOnce().catch((error) => {
        this.loggingService.log({
          category: 'scheduler',
          action: 'runner-error',
          metadata: { error: error instanceof Error ? error.message : String(error) }
        })
      })
    }, this.intervalMs)
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = undefined
    }
  }

  async runOnce() {
    await this.scheduler.runDueSchedules(async (schedule) => {
      const workflow = this.workflowDb.getWorkflow(schedule.workflowId)
      if (!workflow) {
        this.loggingService.log({
          category: 'scheduler',
          action: 'workflow-missing',
          metadata: { scheduleId: schedule.id, workflowId: schedule.workflowId }
        })
        return
      }

      // Try to get a draft for this workflow
      // First, try to find a draft by workflow ID or name
      const allDrafts = this.workflowDraftService.listDrafts()
      let draft = allDrafts.find(d => d.id === schedule.workflowId || d.name === workflow.name)
      
      // If no draft found, create one from the latest workflow version
      if (!draft) {
        const versions = this.workflowDb.listWorkflowVersions(schedule.workflowId)
        const latest = versions[0]
        if (!latest) {
          this.loggingService.log({
            category: 'scheduler',
            action: 'workflow-version-missing',
            metadata: { scheduleId: schedule.id, workflowId: workflow.id }
          })
          return
        }

        // Create a draft from the workflow version
        try {
          const content = this.parseDefinition(latest.definition_json)
          draft = this.workflowDraftService.createDraft(workflow.name, workflow.description ?? '')
          this.workflowDraftService.updateDraft(draft.id, {
            content: {
              nodes: content.nodes,
              transitions: content.transitions
            }
          })
        } catch (error) {
          this.loggingService.log({
            category: 'scheduler',
            action: 'draft-creation-error',
            metadata: {
              scheduleId: schedule.id,
              workflowId: workflow.id,
              error: error instanceof Error ? error.message : String(error)
            }
          })
          return
        }
      }

      try {
        const runId = await this.workflowExecutionService.executeWorkflow(
          draft,
          schedule.workflowId,
          { workflowVersionId: null }
        )
        this.loggingService.log({
          category: 'scheduler',
          action: 'run-started',
          metadata: {
            scheduleId: schedule.id,
            workflowId: workflow.id,
            runId
          }
        })
        this.sendNotification(schedule, workflow.name, 'started')
        // Note: WorkflowExecutionService handles completion asynchronously
        // We don't need to wait for completion here
      } catch (error) {
        this.loggingService.log({
          category: 'scheduler',
          action: 'runtime-error',
          metadata: {
            scheduleId: schedule.id,
            workflowId: workflow.id,
            error: error instanceof Error ? error.message : String(error)
          }
        })
        this.sendNotification(schedule, workflow.name, 'failed')
      }
    })
    await this.retentionService?.enforce()
  }

  private parseDefinition(payload: string): { nodes: unknown[]; transitions: unknown[] } {
    try {
      const parsed = JSON.parse(payload ?? '{}')
      return {
        nodes: parsed.nodes ?? [],
        transitions: parsed.transitions ?? []
      }
    } catch {
      return {
        nodes: [],
        transitions: []
      }
    }
  }

  private sendNotification(
    schedule: ScheduleRecord,
    workflowName: string,
    event: 'started' | 'failed'
  ) {
    const prefs = this.notificationPrefs.getPreferences()
    if (this.isWithinQuietHours(prefs.quietHours.start, prefs.quietHours.end, new Date())) {
      this.loggingService.log({
        category: 'notifications',
        action: 'scheduler-muted',
        metadata: {
          scheduleId: schedule.id,
          workflowId: schedule.workflowId,
          workflowName,
          event,
          quietHours: prefs.quietHours
        }
      })
      return
    }

    this.loggingService.log({
      category: 'notifications',
      action: 'scheduler-event',
      metadata: {
        scheduleId: schedule.id,
        workflowId: schedule.workflowId,
        workflowName,
        event,
        channels: prefs.channels
      }
    })
  }

  private isWithinQuietHours(start: string, end: string, now: Date): boolean {
    const minutes = now.getHours() * 60 + now.getMinutes()
    const startMinutes = this.toMinutes(start)
    const endMinutes = this.toMinutes(end)
    if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes)) {
      return false
    }
    if (startMinutes === endMinutes) {
      return false
    }
    if (startMinutes < endMinutes) {
      return minutes >= startMinutes && minutes < endMinutes
    }
    return minutes >= startMinutes || minutes < endMinutes
  }

  private toMinutes(value: string): number {
    const [hours, minutes] = value.split(':').map((part) => parseInt(part, 10))
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return Number.NaN
    }
    return hours * 60 + minutes
  }
}

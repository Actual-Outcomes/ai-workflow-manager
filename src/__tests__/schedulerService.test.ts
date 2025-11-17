import Database from 'better-sqlite3'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { SchedulerService } from '../core/scheduler/schedulerService'
import { NotificationPreferenceService } from '../core/notifications/notificationPreferenceService'
import { ConfigService } from '../core/config/service'
import { LoggingService } from '../core/logging/loggingService'

const createScheduler = () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scheduler-service-'))
  process.env.AIWM_CONFIG_PATH = path.join(tempDir, 'config.json')
  const configService = new ConfigService()
  const notificationPrefs = new NotificationPreferenceService(configService)
  const loggingService = new LoggingService(tempDir)
  const dbPath = path.join(tempDir, 'app.db')
  const scheduler = new SchedulerService(notificationPrefs, loggingService, dbPath)
  return {
    tempDir,
    scheduler,
    dbPath,
    cleanup: () => {
      scheduler.close()
      fs.rmSync(tempDir, { recursive: true, force: true })
      delete process.env.AIWM_CONFIG_PATH
    }
  }
}

describe('SchedulerService', () => {
  it('adds schedules with timezone metadata', () => {
    const { scheduler, cleanup } = createScheduler()
    const schedule = scheduler.addSchedule(1, '*/5 * * * *', { timezone: 'America/New_York' })
    expect(schedule.timezone).toBe('America/New_York')
    expect(scheduler.list()).toHaveLength(1)
    cleanup()
  })

  it('rejects invalid cron expressions', () => {
    const { scheduler, cleanup } = createScheduler()
    expect(() => scheduler.addSchedule(1, 'invalid-cron')).toThrow(/Invalid cron expression/)
    cleanup()
  })

  it('runs due schedules and advances next run', async () => {
    const { scheduler, dbPath, cleanup } = createScheduler()
    const schedule = scheduler.addSchedule(42, '* * * * *')
    const db = new Database(dbPath)
    const past = new Date(Date.now() - 60_000).toISOString()
    db.prepare('UPDATE workflow_schedules SET next_run_at = ? WHERE id = ?').run(past, schedule.id)
    const executions: number[] = []
    await scheduler.runDueSchedules(async (schedule) => {
      executions.push(schedule.workflowId)
    })
    const updated = scheduler.list().find((item) => item.id === schedule.id)!
    expect(executions).toEqual([42])

    // Verify lastRunAt is a valid ISO date string in the past
    expect(updated.lastRunAt).toBeTruthy()
    expect(typeof updated.lastRunAt).toBe('string')
    expect(() => new Date(updated.lastRunAt!)).not.toThrow()
    const lastRunDate = new Date(updated.lastRunAt!)
    expect(lastRunDate.getTime()).toBeLessThanOrEqual(Date.now())
    expect(lastRunDate.getTime()).toBeGreaterThan(Date.now() - 5000) // Within last 5 seconds

    // Verify nextRunAt is updated and in the future
    expect(updated.nextRunAt).toBeTruthy()
    expect(typeof updated.nextRunAt).toBe('string')
    expect(() => new Date(updated.nextRunAt!)).not.toThrow()
    const nextRunDate = new Date(updated.nextRunAt!)
    expect(nextRunDate.getTime()).toBeGreaterThan(new Date(past).getTime())
    expect(nextRunDate.getTime()).toBeGreaterThan(Date.now())
    db.close()
    cleanup()
  })
})

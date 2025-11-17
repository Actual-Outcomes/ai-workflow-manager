import { beforeEach, describe, expect, it } from 'vitest'
import { WorkflowRuntime } from '../core/workflows/workflowRuntime'
import { ValidationService } from '../core/workflows/validationService'
import { WorkflowDraft } from '../core/workflows/workflowTypes'

const createDraft = (overrides: Partial<WorkflowDraft> = {}): WorkflowDraft => ({
  id: overrides.id ?? 1,
  name: overrides.name ?? 'Workflow',
  description: overrides.description ?? '',
  status: overrides.status ?? 'draft',
  version: overrides.version ?? 1,
  createdAt: overrides.createdAt ?? new Date().toISOString(),
  updatedAt: overrides.updatedAt ?? new Date().toISOString(),
  nodes: overrides.nodes ?? [
    { id: 'start', type: 'start', label: 'Start', entryActions: [], exitActions: [] }
  ],
  transitions: overrides.transitions ?? [
    { id: 't1', source: 'start', target: 'start', trigger: undefined, validators: [] }
  ]
})

describe('WorkflowRuntime', () => {
  let runtime: WorkflowRuntime

  beforeEach(() => {
    // Create fresh runtime instance for each test to prevent state leakage
    runtime = new WorkflowRuntime(new ValidationService())
  })

  it('starts an instance for a valid draft', () => {
    const instance = runtime.start(createDraft())
    expect(instance.status).toBe('running')
    // Verify ID is a valid UUID format (implementation uses randomUUID())
    expect(instance.id).toBeDefined()
    expect(typeof instance.id).toBe('string')
    expect(instance.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    expect(instance.id.length).toBe(36) // UUID v4 format
  })

  it('prevents starting invalid drafts', () => {
    const draft = createDraft({ nodes: [] })
    expect(() => runtime.start(draft)).toThrow(/Draft failed validation/)
  })

  it('supports pause and resume transitions', () => {
    const instance = runtime.start(createDraft({ id: 2 }))
    expect(instance.status).toBe('running')

    const paused = runtime.pause(instance.id)
    expect(paused.status).toBe('paused')
    expect(paused.id).toBe(instance.id) // Verify same instance

    const resumed = runtime.resume(instance.id)
    expect(resumed.status).toBe('running')
    expect(resumed.id).toBe(instance.id) // Verify same instance
  })

  it('completes running instances', () => {
    const instance = runtime.start(createDraft({ id: 3 }))
    expect(instance.status).toBe('running')

    const completed = runtime.complete(instance.id)
    expect(completed.status).toBe('completed')
    expect(completed.id).toBe(instance.id) // Verify same instance
  })

  it('maintains instance uniqueness', () => {
    const instance1 = runtime.start(createDraft({ id: 1 }))
    const instance2 = runtime.start(createDraft({ id: 2 }))
    expect(instance1.id).not.toBe(instance2.id)
    expect(runtime.listInstances()).toHaveLength(2)
  })
})

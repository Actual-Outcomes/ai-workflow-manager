import { describe, it, expect, beforeEach } from 'vitest'
import { TestRunnerService } from '../main/services/testRunner'
import { TestSuiteDefinition } from '../shared/testRunnerTypes'

const immediateDelay = () => Promise.resolve()
const mockSuites: TestSuiteDefinition[] = [
  {
    id: 'mock-suite',
    name: 'Mock Suite',
    description: 'Simulated suite for unit tests',
    tags: ['test'],
    steps: ['step 1', 'step 2'],
    estimatedDurationMs: 1000
  }
]

describe('TestRunnerService', () => {
  let service: TestRunnerService

  beforeEach(() => {
    service = new TestRunnerService({ delayFn: immediateDelay, suites: mockSuites })
  })

  it('lists predefined suites before execution', () => {
    const suites = service.listSuites()
    expect(suites.length).toBeGreaterThan(0)
    expect(suites.every((suite) => suite.lastRun === null)).toBe(true)
  })

  it('runs a suite and stores last result', async () => {
    const suites = service.listSuites()
    const firstSuite = suites[0]

    const result = await service.runSuite(firstSuite.id)

    expect(result.suiteId).toBe(firstSuite.id)
    expect(result.status).toBe('passed')
    expect(result.logs.length).toBeGreaterThan(0)

    const updatedSuite = service.listSuites().find((suite) => suite.id === firstSuite.id)
    expect(updatedSuite?.lastRun?.suiteId).toBe(firstSuite.id)
    expect(updatedSuite?.lastRun?.status).toBe('passed')
  })

  it('prevents concurrent runs of the same suite', async () => {
    const suites = service.listSuites()
    const suiteId = suites[0].id

    const runPromise = service.runSuite(suiteId)
    await expect(service.runSuite(suiteId)).rejects.toThrow(/already running/)
    await runPromise
  })
})

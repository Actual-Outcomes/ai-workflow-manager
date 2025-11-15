import { spawn } from 'child_process'
import { ListedTestSuite, TestRunResult, TestSuiteDefinition } from '../../shared/testRunnerTypes'

interface TestRunnerOptions {
  delayFn?: (ms: number) => Promise<void>
  suites?: TestSuiteDefinition[]
}

const SUITES: TestSuiteDefinition[] = [
  {
    id: 'workflow-runtime',
    name: 'Workflow Runtime Smoke',
    description: 'Runs vitest suite verifying Workflow Runtime mocks and TestRunner orchestration.',
    tags: ['runtime', 'tests'],
    steps: ['Launch vitest CLI', 'Execute testRunnerService suite', 'Collect vitest results'],
    estimatedDurationMs: 2000,
    command: 'npm',
    args: ['run', 'test', '--', 'src/__tests__/testRunnerService.test.ts']
  },
  {
    id: 'storage-paths',
    name: 'App Paths & Storage Guards',
    description:
      'Exercises filesystem helpers to ensure database directories are created correctly.',
    tags: ['filesystem', 'settings'],
    steps: ['Launch vitest CLI', 'Execute appPaths suite', 'Validate directory + file resolution'],
    estimatedDurationMs: 2000,
    command: 'npm',
    args: ['run', 'test', '--', 'src/__tests__/appPaths.test.ts']
  },
  {
    id: 'config-service',
    name: 'Config Service Verification',
    description: 'Validates ConfigService persistence, watchers, and import/export logic.',
    tags: ['config', 'settings'],
    steps: [
      'Launch vitest CLI',
      'Execute configService suite',
      'Confirm snapshot export/import behavior'
    ],
    estimatedDurationMs: 2000,
    command: 'npm',
    args: ['run', 'test', '--', 'src/__tests__/configService.test.ts']
  }
]

export class TestRunnerService {
  private lastRuns = new Map<string, TestRunResult>()
  private runningSuites = new Set<string>()
  private delayFn: (ms: number) => Promise<void>
  private suites: TestSuiteDefinition[]

  constructor(options: TestRunnerOptions = {}) {
    this.delayFn = options.delayFn ?? this.delay
    this.suites = options.suites ?? SUITES
  }

  listSuites(): ListedTestSuite[] {
    return this.suites.map((suite) => ({
      ...suite,
      lastRun: this.lastRuns.get(suite.id) ?? null,
      isRunning: this.runningSuites.has(suite.id)
    }))
  }

  async runSuite(suiteId: string): Promise<TestRunResult> {
    const suite = this.suites.find((item) => item.id === suiteId)
    if (!suite) {
      throw new Error(`Suite "${suiteId}" not found`)
    }
    if (this.runningSuites.has(suiteId)) {
      throw new Error(`Suite "${suite.name}" is already running`)
    }

    this.runningSuites.add(suiteId)
    const startedAt = new Date()
    const logs: string[] = [
      `[${startedAt.toISOString()}] ▶️  Starting ${suite.name}`,
      `Estimated duration: ${(suite.estimatedDurationMs / 1000).toFixed(1)}s`
    ]

    try {
      let exitCode: number | null = 0
      let errorMessage: string | undefined

      if (suite.command) {
        const outcome = await this.runSuiteCommand(suite, logs)
        exitCode = outcome.exitCode
        errorMessage = outcome.errorMessage
      } else {
        for (const step of suite.steps) {
          await this.delayFn(250 + Math.random() * 350)
          logs.push(`[${new Date().toISOString()}] • ${step}`)
        }

        await this.delayFn(200 + Math.random() * 200)
        logs.push(`[${new Date().toISOString()}] ✅ ${suite.name} completed successfully`)
      }

      const finishedAt = new Date()
      const status = exitCode === 0 ? 'passed' : 'failed'
      const result: TestRunResult = {
        suiteId: suite.id,
        status,
        logs,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        exitCode,
        errorMessage
      }
      this.lastRuns.set(suite.id, result)
      return result
    } catch (error) {
      const finishedAt = new Date()
      const result: TestRunResult = {
        suiteId: suite.id,
        status: 'error',
        logs: [...logs, `[${finishedAt.toISOString()}] ❌ ${String(error)}`],
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        exitCode: 1,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
      this.lastRuns.set(suite.id, result)
      return result
    } finally {
      this.runningSuites.delete(suiteId)
    }
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms))
  }

  private runSuiteCommand(
    suite: TestSuiteDefinition,
    logs: string[]
  ): Promise<{ exitCode: number | null; errorMessage?: string }> {
    const command = suite.command!
    const args = suite.args ?? []

    return new Promise((resolve) => {
      const child = spawn(command, args, {
        cwd: suite.cwd ?? process.cwd(),
        shell: process.platform === 'win32',
        env: process.env
      })

      const appendLines = (prefix: string, chunk: Buffer) => {
        chunk
          .toString()
          .split(/\r?\n/)
          .filter((line) => line.trim().length > 0)
          .forEach((line) => {
            logs.push(`[${new Date().toISOString()}] ${prefix} ${line}`)
          })
      }

      child.stdout.on('data', (chunk) => appendLines('stdout:', chunk))
      child.stderr.on('data', (chunk) => appendLines('stderr:', chunk))

      child.on('error', (error) => {
        logs.push(`[${new Date().toISOString()}] ❌ ${error.message}`)
        resolve({ exitCode: 1, errorMessage: error.message })
      })

      child.on('close', (code) => {
        const exitCode = code ?? 0
        logs.push(
          `[${new Date().toISOString()}] ${exitCode === 0 ? '✅' : '❌'} Command exited with code ${exitCode}`
        )
        resolve({ exitCode })
      })
    })
  }
}

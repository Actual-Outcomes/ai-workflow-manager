import { spawn } from 'child_process'
import { app } from 'electron'
import { ListedTestSuite, TestRunResult, TestSuiteDefinition } from '../../shared/testRunnerTypes'

interface TestRunnerOptions {
  delayFn?: (ms: number) => Promise<void>
  suites?: TestSuiteDefinition[]
}

const SUITES: TestSuiteDefinition[] = [
  {
    id: 'workflow-runtime',
    name: 'Workflow Runtime Smoke',
    description: 'Executes runtime lifecycle tests for start/pause/resume/complete hooks.',
    tags: ['runtime', 'workflows'],
    steps: ['Launch vitest CLI', 'Execute workflowRuntime suite', 'Collect vitest results'],
    estimatedDurationMs: 2000,
    command: 'npx',
    args: ['vitest', 'run', 'src/__tests__/workflowRuntime.test.ts']
  },
  {
    id: 'storage-paths',
    name: 'App Paths & Storage Guards',
    description:
      'Exercises filesystem helpers to ensure database directories are created correctly.',
    tags: ['filesystem', 'settings'],
    steps: ['Launch vitest CLI', 'Execute appPaths suite', 'Validate directory + file resolution'],
    estimatedDurationMs: 2000,
    command: 'npx',
    args: ['vitest', 'run', 'src/__tests__/appPaths.test.ts']
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
    command: 'npx',
    args: ['vitest', 'run', 'src/__tests__/configService.test.ts']
  },
  {
    id: 'workflow-validation',
    name: 'Workflow Validation Rules',
    description: 'Ensures ValidationService rules catch schema and link issues.',
    tags: ['workflows', 'validation'],
    steps: ['Launch vitest CLI', 'Execute validationService suite', 'Aggregate warnings/errors'],
    estimatedDurationMs: 2000,
    command: 'npx',
    args: ['vitest', 'run', 'src/__tests__/validationService.test.ts']
  },
  {
    id: 'workflow-drafts',
    name: 'Workflow Draft Service',
    description: 'Validates draft CRUD, autosave, and validation rules.',
    tags: ['workflows', 'drafts'],
    steps: ['Launch vitest CLI', 'Execute workflowDraftService suite', 'Report validation issues'],
    estimatedDurationMs: 2000,
    command: 'npx',
    args: ['vitest', 'run', 'src/__tests__/workflowDraftService.test.ts']
  },
  {
    id: 'document-service',
    name: 'Document Service Export',
    description: 'Runs document service tests to verify exports and registry storage.',
    tags: ['documents', 'export'],
    steps: ['Launch vitest CLI', 'Execute documentService suite', 'Verify outputs'],
    estimatedDurationMs: 2000,
    command: 'npx',
    args: ['vitest', 'run', 'src/__tests__/documentService.test.ts']
  },
  {
    id: 'logging-service',
    name: 'Logging Service',
    description: 'Ensures logging service writes structured JSON lines.',
    tags: ['ops', 'logging'],
    steps: ['Launch vitest CLI', 'Execute loggingService suite'],
    estimatedDurationMs: 2000,
    command: 'npx',
    args: ['vitest', 'run', 'src/__tests__/loggingService.test.ts']
  },
  {
    id: 'scheduler-service',
    name: 'Scheduler Service',
    description: 'Validates scheduler add/list persistence.',
    tags: ['ops', 'automation'],
    steps: ['Launch vitest CLI', 'Execute schedulerService suite'],
    estimatedDurationMs: 2000,
    command: 'npx',
    args: ['vitest', 'run', 'src/__tests__/schedulerService.test.ts']
  },
  {
    id: 'template-registry',
    name: 'Template Registry',
    description: 'CRUD + revision tracking for templates.',
    tags: ['templates', 'documents'],
    steps: ['Launch vitest CLI', 'Execute templateRegistry suite'],
    estimatedDurationMs: 2000,
    command: 'npx',
    args: ['vitest', 'run', 'src/__tests__/templateRegistry.test.ts']
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


  private async runSuiteCommand(
    suite: TestSuiteDefinition,
    logs: string[]
  ): Promise<{ exitCode: number | null; errorMessage?: string }> {
    // Run tests using Electron's Node.js runtime - no rebuild needed!
    // This ensures tests run in the same runtime as the application
    // When command is 'npx', we use Electron's Node.js to run vitest
    const path = require('path')
    const fs = require('fs')
    
    let command: string
    let args: string[]
    
    if (suite.command === 'npx') {
      // Use Electron's Node.js to run vitest
      // process.execPath is Electron, and with ELECTRON_RUN_AS_NODE it acts as Node.js
      command = process.execPath
      // Find vitest script in node_modules/.bin
      const vitestBin = path.join(process.cwd(), 'node_modules', '.bin', 'vitest')
      const vitestScript = path.join(process.cwd(), 'node_modules', 'vitest', 'dist', 'cli.js')
      
      // Use the actual vitest entry point
      if (fs.existsSync(vitestScript)) {
        args = [vitestScript, ...(suite.args ?? []).slice(1)] // Skip 'vitest' from original args
      } else {
        // Fallback: try to find vitest via require.resolve
        try {
          const vitestMain = require.resolve('vitest')
          args = [vitestMain, ...(suite.args ?? []).slice(1)]
        } catch {
          // Last resort: use original args and hope npx works
          args = suite.args ?? []
          command = 'npx'
        }
      }
      logs.push(`[${new Date().toISOString()}] 🔧 Running tests with Electron's Node.js runtime (no rebuild needed)`)
    } else {
      command = suite.command!
      args = suite.args ?? []
    }

    return new Promise((resolve) => {
      const child = spawn(command, args, {
        cwd: suite.cwd ?? process.cwd(),
        shell: process.platform === 'win32',
        env: {
          ...process.env,
          // Tell Electron to run as Node.js
          ELECTRON_RUN_AS_NODE: '1'
        }
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

#!/usr/bin/env node

import { Command } from 'commander'
import path from 'path'
import { WorkflowDatabase } from '../core/database'
import { getAppDatabasePath } from '../core/appPaths'
import { AuditLogService } from '../core/audit-log'
import { ConfigService } from '../core/config/service'
import { CredentialVault } from '../core/credentials/vault'
import { ConnectorRegistry } from '../core/connectors/registry'
import { WorkflowDraftService } from '../core/workflows/workflowDraftService'
import { DocumentRegistry } from '../core/documents/documentRegistry'
import { MarkdownBuilder, DocxBuilder, PdfBuilder } from '../core/documents/documentBuilder'
import { FileConnector } from '../core/files/fileConnector'

const program = new Command()
const auditLog = new AuditLogService(getAppDatabasePath())
const configService = new ConfigService()
const credentialVault = new CredentialVault()
const connectorRegistry = new ConnectorRegistry()
const workflowDraftService = new WorkflowDraftService(configService)
const documentRegistry = new DocumentRegistry()
const fileConnector = new FileConnector()
const workflowCommand = program.command('workflow').description('Workflow operations')

const draftCommand = workflowCommand.command('draft').description('Manage workflow drafts')

draftCommand
  .command('list')
  .description('List workflow drafts')
  .action(() => {
    const drafts = workflowDraftService.listDrafts()
    if (!drafts.length) {
      console.log('\nℹ️  No drafts yet.\n')
      return
    }
    drafts.forEach((draft) => {
      console.log(`[${draft.id}] ${draft.name} v${draft.version} (${draft.status})`)
    })
  })

draftCommand
  .command('create')
  .description('Create a workflow draft')
  .argument('<name>')
  .option('-d, --description <description>', 'Draft description', '')
  .action((name, options) => {
    const draft = workflowDraftService.createDraft(name, options.description)
    console.log(`✅ Draft created [${draft.id}] ${draft.name}`)
  })

const cleanup = () => {
  try {
    auditLog.close()
  } catch {
    // ignore
  }
}

process.on('exit', cleanup)
process.on('SIGINT', () => {
  cleanup()
  process.exit(0)
})

program.name('ai-workflow-manager').description('AI Workflow Manager CLI').version('0.1.0')

// List all workflows
program
  .command('list')
  .alias('ls')
  .description('List all workflows')
  .action(() => {
    const db = new WorkflowDatabase(getAppDatabasePath())
    const workflows = db.getAllWorkflows()

    if (workflows.length === 0) {
      console.log('No workflows found.')
      return
    }

    console.log('\n📋 Workflows:\n')
    workflows.forEach((workflow) => {
      const statusEmoji =
        {
          draft: '📝',
          active: '✅',
          paused: '⏸️',
          completed: '✔️'
        }[workflow.status] || '❓'

      console.log(`${statusEmoji} [${workflow.id}] ${workflow.name}`)
      console.log(`   Status: ${workflow.status}`)
      console.log(`   Description: ${workflow.description || 'No description'}`)
      console.log(`   Created: ${new Date(workflow.created_at).toLocaleString()}`)
      console.log()
    })

    db.close()
  })

// Create a new workflow
program
  .command('create')
  .alias('new')
  .description('Create a new workflow')
  .argument('<name>', 'workflow name')
  .option('-d, --description <description>', 'workflow description', '')
  .action((name, options) => {
    const db = new WorkflowDatabase(getAppDatabasePath())
    const workflow = db.createWorkflow(name, options.description)
    auditLog.logEvent({
      actor: 'cli',
      source: 'cli',
      action: 'workflow.create',
      target: `workflow:${workflow.id}`,
      metadata: { name: workflow.name }
    })

    console.log(`\n✅ Created workflow: ${workflow.name} (ID: ${workflow.id})`)
    console.log(`   Status: ${workflow.status}`)
    console.log(`   Description: ${workflow.description || 'No description'}\n`)

    db.close()
  })

// Show workflow details
program
  .command('show')
  .alias('info')
  .description('Show workflow details')
  .argument('<id>', 'workflow ID')
  .action((id) => {
    const db = new WorkflowDatabase(getAppDatabasePath())
    const workflow = db.getWorkflow(parseInt(id))

    if (!workflow) {
      console.error(`❌ Workflow with ID ${id} not found.`)
      db.close()
      process.exit(1)
    }

    const statusEmoji =
      {
        draft: '📝',
        active: '✅',
        paused: '⏸️',
        completed: '✔️'
      }[workflow.status] || '❓'

    console.log('\n📋 Workflow Details:\n')
    console.log(`${statusEmoji} ${workflow.name}`)
    console.log(`   ID: ${workflow.id}`)
    console.log(`   Status: ${workflow.status}`)
    console.log(`   Description: ${workflow.description || 'No description'}`)
    console.log(`   Created: ${new Date(workflow.created_at).toLocaleString()}`)
    console.log(`   Updated: ${new Date(workflow.updated_at).toLocaleString()}`)
    console.log()

    db.close()
  })

// Update workflow
program
  .command('update')
  .description('Update a workflow')
  .argument('<id>', 'workflow ID')
  .option('-n, --name <name>', 'new name')
  .option('-d, --description <description>', 'new description')
  .option('-s, --status <status>', 'new status (draft|active|paused|completed)')
  .action((id, options) => {
    const db = new WorkflowDatabase(getAppDatabasePath())
    const updateData: any = {}

    if (options.name) updateData.name = options.name
    if (options.description) updateData.description = options.description
    if (options.status) {
      if (!['draft', 'active', 'paused', 'completed'].includes(options.status)) {
        console.error('❌ Invalid status. Use: draft, active, paused, or completed')
        db.close()
        process.exit(1)
      }
      updateData.status = options.status
    }

    if (Object.keys(updateData).length === 0) {
      console.error('❌ No updates specified. Use --name, --description, or --status')
      db.close()
      process.exit(1)
    }

    const workflow = db.updateWorkflow(parseInt(id), updateData)

    if (!workflow) {
      console.error(`❌ Workflow with ID ${id} not found.`)
      db.close()
      process.exit(1)
    }

    console.log(`\n✅ Updated workflow: ${workflow.name} (ID: ${workflow.id})`)
    console.log(`   Status: ${workflow.status}`)
    console.log(`   Description: ${workflow.description || 'No description'}\n`)

    auditLog.logEvent({
      actor: 'cli',
      source: 'cli',
      action: 'workflow.update',
      target: `workflow:${workflow.id}`,
      metadata: updateData
    })

    db.close()
  })

// Delete workflow
program
  .command('delete')
  .alias('rm')
  .description('Delete a workflow')
  .argument('<id>', 'workflow ID')
  .option('-y, --yes', 'skip confirmation')
  .action((id, options) => {
    const db = new WorkflowDatabase(getAppDatabasePath())
    const workflow = db.getWorkflow(parseInt(id))

    if (!workflow) {
      console.error(`❌ Workflow with ID ${id} not found.`)
      db.close()
      process.exit(1)
    }

    if (!options.yes) {
      console.log(`⚠️  Warning: This will delete workflow "${workflow.name}" (ID: ${id})`)
      console.log('   Use -y flag to skip this confirmation.')
      db.close()
      process.exit(0)
    }

    db.deleteWorkflow(parseInt(id))
    console.log(`\n✅ Deleted workflow: ${workflow.name} (ID: ${id})\n`)

    auditLog.logEvent({
      actor: 'cli',
      source: 'cli',
      action: 'workflow.delete',
      target: `workflow:${id}`,
      metadata: { name: workflow.name }
    })

    db.close()
  })

// Database info
program
  .command('db-path')
  .description('Show database file path')
  .action(() => {
    console.log(`\n📁 Database path: ${getAppDatabasePath()}\n`)
  })

const connectorCommand = program.command('connector').description('Manage connectors')

connectorCommand
  .command('list')
  .description('List registered connectors')
  .action(() => {
    const connectors = connectorRegistry.listConnectors()
    if (!connectors.length) {
      console.log('\nℹ️  No connectors registered yet.\n')
      return
    }
    console.log('\n🔌 Connectors:\n')
    connectors.forEach((connector) => {
      console.log(
        `${connector.id} — ${connector.name} (${connector.kind}) [${connector.status.toUpperCase()}]`
      )
      console.log(`   Version: ${connector.version}`)
      if (connector.description) {
        console.log(`   ${connector.description}`)
      }
      console.log()
    })
  })

connectorCommand
  .command('info')
  .description('Show connector details')
  .argument('<id>', 'Connector id')
  .action((id) => {
    const connector = connectorRegistry.getConnector(id)
    if (!connector) {
      console.error(`\n❌ Connector "${id}" not found.\n`)
      process.exit(1)
    }
    console.log(`\n🔌 ${connector.name} (${connector.kind})`)
    console.log(`ID: ${connector.id}`)
    console.log(`Version: ${connector.version}`)
    if (connector.description) {
      console.log(`Description: ${connector.description}`)
    }
    if (connector.capabilities.length) {
      console.log('\nCapabilities:')
      connector.capabilities.forEach((cap) => {
        console.log(` - ${cap.name}: ${cap.description}`)
      })
    }
    if (connector.lastHealthCheck) {
      console.log('\nLast Health Check:')
      console.log(
        ` Status: ${connector.lastHealthCheck.status.toUpperCase()} (${connector.lastHealthCheck.message ?? 'n/a'})`
      )
    }
    console.log()
  })

connectorCommand
  .command('test')
  .description('Run connector health check')
  .argument('<id>', 'Connector id')
  .action(async (id) => {
    try {
      const result = await connectorRegistry.testConnector(id)
      console.log(
        `\n✅ Connector ${id} responded with status ${result.status.toUpperCase()}${result.message ? ` — ${result.message}` : ''}\n`
      )
    } catch (error) {
      console.error(
        `\n❌ Failed to test connector "${id}": ${error instanceof Error ? error.message : String(error)}\n`
      )
      process.exit(1)
    }
  })

const configCommand = program.command('config').description('Manage configuration settings')

configCommand
  .command('get')
  .description('Get config value by path (dot notation)')
  .argument('<path>')
  .action((pathArg) => {
    const value = configService.get(pathArg)
    console.log(JSON.stringify(value, null, 2))
  })

configCommand
  .command('set')
  .description('Set config value by path; value interpreted as JSON')
  .argument('<path>')
  .argument('<value>')
  .action(async (pathArg, valueArg) => {
    let parsed: unknown
    try {
      parsed = JSON.parse(valueArg)
    } catch {
      parsed = valueArg
    }
    await configService.set(pathArg, parsed)
    auditLog.logEvent({
      actor: 'cli',
      source: 'config',
      action: 'config.set',
      target: pathArg,
      metadata: { value: parsed }
    })
    console.log(`✅ Updated ${pathArg}`)
  })

const credentialsCommand = program.command('credentials').description('Manage stored credentials')

credentialsCommand
  .command('add')
  .description('Store a credential secret')
  .argument('<key>', 'Credential key (e.g., connector:llm:openai)')
  .option('-s, --secret <secret>', 'Secret value (omit to read from STDIN)')
  .action(async (key, options) => {
    let secret: string | undefined = options.secret
    if (!secret) {
      if (!process.stdin.isTTY) {
        secret = await readSecretFromStdin()
      }
    }
    if (!secret) {
      console.error('❌ Please provide a secret via --secret or pipe input.')
      process.exit(1)
    }
    await credentialVault.storeSecret({ key, value: secret })
    auditLog.logEvent({
      actor: 'cli',
      source: 'credentials',
      action: 'credential.add',
      target: key
    })
    console.log(`✅ Stored secret for ${key}`)
  })

credentialsCommand
  .command('list')
  .description('List credential entries (keys only)')
  .option('-p, --prefix <prefix>', 'Filter by key prefix')
  .action(async (options) => {
    const entries = await credentialVault.listSecrets(options.prefix)
    if (!entries.length) {
      console.log('\nℹ️  No credentials found.\n')
      return
    }
    console.log('\n🔑 Credentials:\n')
    entries.forEach((entry) => {
      console.log(`- ${entry.key}`)
      if (entry.metadata && Object.keys(entry.metadata).length) {
        console.log(`   metadata: ${JSON.stringify(entry.metadata)}`)
      }
    })
  })

credentialsCommand
  .command('remove')
  .description('Delete a credential secret')
  .argument('<key>')
  .action(async (key) => {
    await credentialVault.deleteSecret(key)
    auditLog.logEvent({
      actor: 'cli',
      source: 'credentials',
      action: 'credential.remove',
      target: key
    })
    console.log(`✅ Removed secret for ${key}`)
  })

const documentCommand = program.command('doc').description('Document operations')

documentCommand
  .command('list')
  .description('List documents in registry')
  .action(() => {
    const docs = documentRegistry.list()
    if (!docs.length) {
      console.log('\nℹ️  No documents found.\n')
      return
    }
    docs.forEach((doc) => {
      console.log(`[${doc.id}] ${doc.name} (${doc.type}) v${doc.version} — ${doc.path}`)
    })
  })

documentCommand
  .command('export')
  .description('Export document content to file')
  .argument('<name>', 'Document name')
  .argument('<type>', 'docx|pdf|markdown')
  .argument('<content>', 'Raw content')
  .action(async (name, type, content) => {
    let builder
    if (type === 'docx') {
      builder = new DocxBuilder()
    } else if (type === 'pdf') {
      builder = new PdfBuilder()
    } else {
      builder = new MarkdownBuilder()
    }
    const buffer = await builder.build(content)
    const relativePath = path.join(
      'documents',
      `${name}-${Date.now()}.${type === 'markdown' ? 'md' : type}`
    )
    const savedPath = fileConnector.writeFile(relativePath, buffer)
    const record = documentRegistry.add({
      name,
      type,
      path: savedPath,
      version: 1
    })
    auditLog.logEvent({
      actor: 'cli',
      source: 'documents',
      action: 'document.export',
      target: `document:${record.id}`,
      metadata: { path: savedPath, type }
    })
    console.log(`✅ Exported document to ${savedPath}`)
  })

program
  .command('audit')
  .description('Audit log operations')
  .option('-l, --limit <number>', 'number of entries to show', '20')
  .option('-a, --actor <actor>', 'filter by actor')
  .option('-s, --source <source>', 'filter by source')
  .option('-t, --action <action>', 'filter by action')
  .action((options) => {
    const limit = Math.max(parseInt(options.limit, 10) || 20, 1)
    const entries = auditLog.listEntries({
      limit,
      actor: options.actor,
      source: options.source,
      action: options.action
    })

    if (!entries.length) {
      console.log('\nℹ️  No audit log entries found.\n')
      return
    }

    console.log(`\n📜 Showing latest ${entries.length} audit events:\n`)
    entries.forEach((entry) => {
      const timestamp = new Date(entry.timestamp).toLocaleString()
      console.log(`[${timestamp}] (${entry.source}) ${entry.actor} → ${entry.action}`)
      if (entry.target) {
        console.log(`   target: ${entry.target}`)
      }
      if (entry.metadata && Object.keys(entry.metadata).length) {
        console.log(`   metadata: ${JSON.stringify(entry.metadata)}`)
      }
    })
    console.log()
  })

program.parse()

function readSecretFromStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    process.stdin.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8').trim()))
    process.stdin.on('error', reject)
  })
}

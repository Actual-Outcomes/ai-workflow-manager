#!/usr/bin/env node

import { Command } from 'commander'
import { WorkflowDatabase } from '../core/database'
import path from 'path'
import os from 'os'

const program = new Command()

// Default database path
const getDbPath = () => {
  const appDataPath = process.env.APPDATA || 
    (process.platform === 'darwin' 
      ? path.join(os.homedir(), 'Library', 'Application Support') 
      : path.join(os.homedir(), '.local', 'share'))
  
  return path.join(appDataPath, 'ai-workflow-manager', 'workflows.db')
}

program
  .name('ai-workflow-manager')
  .description('AI Workflow Manager CLI')
  .version('0.1.0')

// List all workflows
program
  .command('list')
  .alias('ls')
  .description('List all workflows')
  .action(() => {
    const db = new WorkflowDatabase(getDbPath())
    const workflows = db.getAllWorkflows()
    
    if (workflows.length === 0) {
      console.log('No workflows found.')
      return
    }

    console.log('\n📋 Workflows:\n')
    workflows.forEach((workflow) => {
      const statusEmoji = {
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
    const db = new WorkflowDatabase(getDbPath())
    const workflow = db.createWorkflow(name, options.description)
    
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
    const db = new WorkflowDatabase(getDbPath())
    const workflow = db.getWorkflow(parseInt(id))
    
    if (!workflow) {
      console.error(`❌ Workflow with ID ${id} not found.`)
      db.close()
      process.exit(1)
    }

    const statusEmoji = {
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
    const db = new WorkflowDatabase(getDbPath())
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
    const db = new WorkflowDatabase(getDbPath())
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
    
    db.close()
  })

// Database info
program
  .command('db-path')
  .description('Show database file path')
  .action(() => {
    console.log(`\n📁 Database path: ${getDbPath()}\n`)
  })

program.parse()


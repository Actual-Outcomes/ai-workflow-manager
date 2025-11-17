#!/usr/bin/env node

const { execSync } = require('child_process')
const { readFileSync } = require('fs')
const path = require('path')

// Get Electron version from package.json
const packageJson = JSON.parse(readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))
const electronVersion = packageJson.devDependencies.electron.replace('^', '')

console.log(`Rebuilding better-sqlite3 for Electron ${electronVersion}...`)

try {
  execSync(`npm rebuild better-sqlite3 --runtime=electron --target=${electronVersion}`, {
    stdio: 'inherit'
  })
  console.log('✓ Rebuild complete')
} catch (error) {
  console.error('✗ Rebuild failed')
  process.exit(1)
}

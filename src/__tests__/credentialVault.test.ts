import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CredentialVault } from '../core/credentials/vault'

const createDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'aiwm-vault-'))

describe('CredentialVault (JSON fallback)', () => {
  let dir: string

  beforeEach(() => {
    dir = createDir()
  })

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('stores and retrieves secrets without encryption', async () => {
    const vault = new CredentialVault({ provider: 'json', fallbackDir: dir })
    const secretValue = 'sk-test-12345'
    await vault.storeSecret({ key: 'connector:llm:openai', value: secretValue })

    // Verify retrieval
    const secret = await vault.retrieveSecret('connector:llm:openai')
    expect(secret?.value).toBe(secretValue)
    expect(secret?.key).toBe('connector:llm:openai')

    // Verify storage: without encryption, value should be stored as-is (or base64 encoded)
    const vaultFile = path.join(dir, 'secrets.json')
    expect(fs.existsSync(vaultFile)).toBe(true)
    const fileContent = fs.readFileSync(vaultFile, 'utf-8')
    const parsed = JSON.parse(fileContent)
    const storedSecret = parsed.secrets.find((s: any) => s.key === 'connector:llm:openai')
    expect(storedSecret).toBeDefined()
    // Without encryption, value might be stored as-is or base64 encoded
    expect(storedSecret.value).toBeDefined()
  })

  it('supports basic encryption when key provided', async () => {
    const key = Buffer.alloc(32, 1).toString('hex')
    const vault = new CredentialVault({
      provider: 'json',
      fallbackDir: dir,
      encryptionKey: key
    })
    const secretValue = 'secret-password-123'
    await vault.storeSecret({ key: 'connector:storage:sqlite', value: secretValue })

    // Verify retrieval works
    const secret = await vault.retrieveSecret('connector:storage:sqlite')
    expect(secret?.value).toBe(secretValue)

    // Verify encryption: check that stored value on disk is NOT plaintext
    const vaultFile = path.join(dir, 'secrets.json')
    expect(fs.existsSync(vaultFile)).toBe(true)
    const fileContent = fs.readFileSync(vaultFile, 'utf-8')
    const parsed = JSON.parse(fileContent)
    const storedSecret = parsed.secrets.find((s: any) => s.key === 'connector:storage:sqlite')
    expect(storedSecret).toBeDefined()
    expect(storedSecret.value).not.toBe(secretValue) // Should be encrypted, not plaintext
    // Encrypted value is base64 encoded (iv + tag + encrypted data)
    expect(storedSecret.value).toMatch(/^[A-Za-z0-9+/=]+$/) // Base64 string
    expect(storedSecret.value.length).toBeGreaterThan(secretValue.length) // Encrypted should be longer
    // Verify it's actually encrypted by checking it's not just base64 of plaintext
    const base64Plaintext = Buffer.from(secretValue, 'utf-8').toString('base64')
    expect(storedSecret.value).not.toBe(base64Plaintext)
  })

  it('lists secrets by prefix', async () => {
    const vault = new CredentialVault({ provider: 'json', fallbackDir: dir })
    await vault.storeSecret({ key: 'connector:llm:openai', value: 'a' })
    await vault.storeSecret({ key: 'connector:llm:claude', value: 'b' })
    await vault.storeSecret({ key: 'connector:storage:sqlite', value: 'c' })

    const secrets = await vault.listSecrets('connector:llm')
    expect(secrets).toHaveLength(2)
    expect(secrets.map((s) => s.key).sort()).toEqual([
      'connector:llm:claude',
      'connector:llm:openai'
    ])
    expect(secrets.find((s) => s.key === 'connector:llm:openai')?.value).toBe('a')
    expect(secrets.find((s) => s.key === 'connector:llm:claude')?.value).toBe('b')

    // Verify storage connector is NOT included
    expect(secrets.find((s) => s.key === 'connector:storage:sqlite')).toBeUndefined()
  })

  it('falls back to JSON when OS provider unavailable or forced', async () => {
    process.env.AIWM_FORCE_JSON_VAULT = '1'
    const vault = new CredentialVault({ provider: 'os', fallbackDir: dir })
    await vault.storeSecret({ key: 'connector:test:os', value: 'secret-os' })
    const secret = await vault.retrieveSecret('connector:test:os')
    expect(secret?.value).toBe('secret-os')
    delete process.env.AIWM_FORCE_JSON_VAULT
  })
})

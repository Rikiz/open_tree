import { safeStorage } from 'electron'
import { app } from 'electron'

export class KeychainService {
  isAvailable(): boolean {
    return safeStorage.isEncryptionAvailable()
  }

  async setPassword(service: string, account: string, password: string): Promise<void> {
    const encrypted = safeStorage.encryptString(password)
    const key = `${service}:${account}`

    // Store in-memory with fallback
    ;(global as any)._keychainStore = (global as any)._keychainStore || new Map()
    ;(global as any)._keychainStore.set(key, encrypted.toString('base64'))
  }

  async getPassword(service: string, account: string): Promise<string | null> {
    const key = `${service}:${account}`
    ;(global as any)._keychainStore = (global as any)._keychainStore || new Map()
    const encrypted = (global as any)._keychainStore.get(key)
    if (!encrypted) return null

    try {
      const buffer = Buffer.from(encrypted, 'base64')
      return safeStorage.decryptString(buffer)
    } catch {
      return null
    }
  }

  async deletePassword(service: string, account: string): Promise<void> {
    const key = `${service}:${account}`
    ;(global as any)._keychainStore = (global as any)._keychainStore || new Map()
    ;(global as any)._keychainStore.delete(key)
  }
}

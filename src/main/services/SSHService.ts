import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import os from 'os'
import fs from 'fs'

const execFileAsync = promisify(execFile)

export interface SSHKey {
  name: string
  path: string
  type: string
  publicKey: string
  hasPassphrase: boolean
}

export class SSHService {
  getDefaultKeyPaths(): string[] {
    const sshDir = path.join(os.homedir(), '.ssh')
    const defaults = ['id_rsa', 'id_ed25519', 'id_ecdsa', 'id_dsa']
    return defaults
      .map(name => path.join(sshDir, name))
      .filter(p => fs.existsSync(p))
  }

  async listKeys(): Promise<SSHKey[]> {
    const sshDir = path.join(os.homedir(), '.ssh')
    if (!fs.existsSync(sshDir)) return []

    const files = fs.readdirSync(sshDir)
    const privateKeys = files.filter(f =>
      !f.endsWith('.pub') &&
      !f.startsWith('known_hosts') &&
      !f.startsWith('config') &&
      !f.startsWith('authorized_keys') &&
      f !== 'id_rsa.pub' &&
      f !== 'id_ed25519.pub' &&
      f !== 'id_ecdsa.pub'
    ).filter(f => {
      try {
        const content = fs.readFileSync(path.join(sshDir, f), 'utf8')
        return content.startsWith('-----BEGIN') || content.startsWith('ssh-')
      } catch {
        return false
      }
    })

    const keys: SSHKey[] = []
    for (const keyFile of privateKeys) {
      const keyPath = path.join(sshDir, keyFile)
      let publicKey = ''
      const pubPath = keyPath + '.pub'
      try {
        publicKey = fs.readFileSync(pubPath, 'utf8').trim()
      } catch {}

      let keyType = 'unknown'
      try {
        const content = fs.readFileSync(keyPath, 'utf8')
        if (content.includes('OPENSSH PRIVATE KEY')) keyType = 'ed25519'
        else if (content.includes('BEGIN RSA PRIVATE KEY')) keyType = 'rsa'
        else if (content.includes('BEGIN EC PRIVATE KEY')) keyType = 'ecdsa'
      } catch {}

      keys.push({
        name: keyFile,
        path: keyPath,
        type: keyType,
        publicKey,
        hasPassphrase: false,
      })
    }

    return keys
  }

  async generateKey(type: 'rsa' | 'ed25519' | 'ecdsa' = 'ed25519', comment?: string, passphrase?: string): Promise<SSHKey> {
    const sshDir = path.join(os.homedir(), '.ssh')
    if (!fs.existsSync(sshDir)) {
      fs.mkdirSync(sshDir, { mode: 0o700 })
    }

    const keyName = `id_${type}`
    const keyPath = path.join(sshDir, keyName)

    if (fs.existsSync(keyPath)) {
      throw new Error(`Key already exists: ${keyName}`)
    }

    const args = ['-t', type, '-f', keyPath, '-N', passphrase || '', '-q']
    if (comment) args.push('-C', comment)

    await execFileAsync('ssh-keygen', args)

    const publicKey = fs.readFileSync(keyPath + '.pub', 'utf8').trim()

    // Set proper permissions
    fs.chmodSync(keyPath, 0o600)
    fs.chmodSync(keyPath + '.pub', 0o644)

    return {
      name: keyName,
      path: keyPath,
      type,
      publicKey,
      hasPassphrase: !!passphrase,
    }
  }

  async testConnection(host: string, keyPath?: string): Promise<{ success: boolean; message: string }> {
    const args = ['-T', '-o', 'StrictHostKeyChecking=no', '-o', 'ConnectTimeout=5', 'git', host]
    if (keyPath) args.splice(1, 0, '-i', keyPath)

    try {
      const { stdout, stderr } = await execFileAsync('ssh', args, { timeout: 10000 })
      return { success: true, message: stdout || stderr }
    } catch (err: any) {
      return { success: false, message: err.stderr || err.message }
    }
  }

  async copyPublicKey(keyPath: string): Promise<string> {
    return fs.readFileSync(keyPath + '.pub', 'utf8').trim()
  }

  async deleteKey(keyPath: string): Promise<void> {
    if (fs.existsSync(keyPath)) fs.unlinkSync(keyPath)
    if (fs.existsSync(keyPath + '.pub')) fs.unlinkSync(keyPath + '.pub')
  }
}

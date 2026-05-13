import { useState, useEffect } from 'react'
import { Key, Trash2, Plus, Copy, Check, Terminal } from 'lucide-react'
import { ssh, clipboard } from '@renderer/ipc'

interface SSHKeyItem { name: string; path: string; type: string; publicKey: string; hasPassphrase: boolean }

export function SSHTab() {
  const [keys, setKeys] = useState<SSHKeyItem[]>([])
  const [generating, setGenerating] = useState(false)
  const [keyType, setKeyType] = useState('ed25519')
  const [keyComment, setKeyComment] = useState('')
  const [copied, setCopied] = useState('')
  const [testResult, setTestResult] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadKeys()
  }, [])

  async function loadKeys() {
    try {
      const result = await ssh.listKeys()
      setKeys(result as SSHKeyItem[])
    } catch {}
  }

  async function handleGenerate() {
    setGenerating(true)
    setError('')
    try {
      await ssh.generateKey(keyType, keyComment || undefined)
      await loadKeys()
    } catch (err: any) {
      setError(err.message || 'Failed to generate key')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopyPubKey(keyPath: string) {
    try {
      const pubKey = await ssh.copyPublicKey(keyPath)
      await clipboard.write(pubKey)
      setCopied(keyPath)
      setTimeout(() => setCopied(''), 2000)
    } catch {}
  }

  async function handleDelete(keyPath: string) {
    await ssh.deleteKey(keyPath)
    await loadKeys()
  }

  async function handleTestConnection(keyPath: string) {
    const result = await ssh.testConnection('github.com', keyPath) as { success: boolean; message: string }
    setTestResult(keyPath + ': ' + (result.success ? '✓ Connected' : '✗ ' + result.message))
    setTimeout(() => setTestResult(''), 5000)
  }

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">SSH Keys</h3>

      {/* Key list */}
      {keys.map((k) => (
        <div key={k.path} className="flex items-center gap-3 p-2 rounded-md border mb-2">
          <Key className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium font-mono">{k.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{k.publicKey?.slice(0, 60)}...</p>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">{k.type}</span>
          <button
            onClick={() => handleCopyPubKey(k.path)}
            className="p-1 rounded hover:bg-accent text-muted-foreground"
            title="Copy public key"
          >
            {copied === k.path ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          </button>
          <button
            onClick={() => handleTestConnection(k.path)}
            className="p-1 rounded hover:bg-accent text-muted-foreground"
            title="Test connection"
          >
            <Terminal className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleDelete(k.path)}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            title="Delete key"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}

      {keys.length === 0 && (
        <p className="text-sm text-muted-foreground mb-4">No SSH keys found in ~/.ssh</p>
      )}

      {testResult && (
        <div className="mb-2 p-2 rounded bg-accent text-xs font-mono">{testResult}</div>
      )}

      {/* Generate new key */}
      <div className="mt-4 border-t pt-4">
        <h3 className="text-sm font-medium mb-2">Generate New Key</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-muted-foreground mb-1">Key type</label>
              <select
                value={keyType}
                onChange={(e) => setKeyType(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
              >
                <option value="ed25519">Ed25519 (Recommended)</option>
                <option value="rsa">RSA 4096</option>
                <option value="ecdsa">ECDSA</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-muted-foreground mb-1">Comment (email)</label>
              <input
                type="text"
                value={keyComment}
                onChange={(e) => setKeyComment(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm font-mono"
              />
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            {generating ? 'Generating...' : 'Generate Key'}
          </button>
          {error && <div className="text-xs text-destructive">{error}</div>}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Github, GitBranch as GitBranchIcon, Trash2 } from 'lucide-react'
import { auth } from '@renderer/ipc'

interface Account { id: string; service: string; username: string; email: string; avatarUrl?: string }

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  github: <Github className="w-4 h-4" />,
  gitlab: <GitBranchIcon className="w-4 h-4 text-orange-500" />,
  bitbucket: <GitBranchIcon className="w-4 h-4 text-blue-500" />,
}

const SERVICE_NAMES: Record<string, string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
  bitbucket: 'Bitbucket',
}

export function AccountsTab() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [connecting, setConnecting] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadAccounts()
  }, [])

  async function loadAccounts() {
    try {
      const result = await auth.listAccounts()
      setAccounts(result as Account[])
    } catch {}
  }

  async function handleConnect(service: string) {
    setConnecting(service)
    setError('')
    try {
      await auth.login(service)
      await loadAccounts()
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setConnecting('')
    }
  }

  async function handleRemove(id: string) {
    await auth.removeAccount(id)
    await loadAccounts()
  }

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">Connected Accounts</h3>

      {accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-4">
          Connect to a Git hosting service to clone repositories, create pull requests, and more.
        </p>
      ) : (
        <div className="space-y-2 mb-4">
          {accounts.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-2 rounded-md border">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                {a.avatarUrl ? (
                  <img src={a.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  SERVICE_ICONS[a.service]
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{a.username}</p>
                <p className="text-xs text-muted-foreground">{a.email} · {SERVICE_NAMES[a.service]}</p>
              </div>
              <button onClick={() => handleRemove(a.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <h3 className="text-sm font-medium mb-2">Add Account</h3>
      <div className="grid gap-2">
        {(['github', 'gitlab', 'bitbucket'] as const).map((service) => (
          <div
            key={service}
            className="flex items-center justify-between p-3 rounded-md border cursor-pointer hover:bg-accent"
            onClick={() => handleConnect(service)}
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2">
                {SERVICE_ICONS[service]}
                <span className="text-sm">{SERVICE_NAMES[service]}</span>
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {connecting === service ? 'Opening browser...' : 'Connect'}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-3 p-2 rounded bg-destructive/5 text-xs text-destructive">{error}</div>
      )}
    </div>
  )
}

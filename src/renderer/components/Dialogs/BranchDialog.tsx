import { useState } from 'react'
import { X, GitBranch } from 'lucide-react'
import { useRepoStore } from '@renderer/store/repoStore'
import { git } from '@renderer/ipc'

interface Props {
  onClose: () => void
}

export function BranchDialog({ onClose }: Props) {
  const branches = useRepoStore(s => s.branches)
  const currentBranch = useRepoStore(s => s.currentBranch)
  const repoPath = useRepoStore(s => s.repoPath)
  const fetchBranches = useRepoStore(s => s.fetchBranches)
  const checkout = useRepoStore(s => s.checkout)

  const [name, setName] = useState('')
  const [startPoint, setStartPoint] = useState(currentBranch || '')
  const [switchAfter, setSwitchAfter] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!repoPath || !name) return
    setCreating(true)
    setError('')
    try {
      await git.createBranch(repoPath, name, { startPoint, checkout: switchAfter })
      await fetchBranches()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create branch')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-background rounded-lg shadow-xl border w-[400px]">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            New Branch
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">Branch name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.replace(/\s/g, '-'))}
              placeholder="feature/awesome"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">Starting point</label>
            <select
              value={startPoint}
              onChange={(e) => setStartPoint(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value={currentBranch || ''}>HEAD ({currentBranch})</option>
              {branches.filter(b => !b.isRemote && b.name !== currentBranch).map(b => (
                <option key={b.name} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={switchAfter}
              onChange={(e) => setSwitchAfter(e.target.checked)}
              className="rounded"
            />
            <span>Switch to new branch after creation</span>
          </label>

          {error && <div className="text-xs text-destructive bg-destructive/5 p-2 rounded">{error}</div>}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t">
          <button onClick={onClose} className="px-4 py-1.5 text-sm rounded-md border hover:bg-accent">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name || creating}
            className="px-4 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Branch'}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { X, GitMerge } from 'lucide-react'
import { useRepoStore } from '@renderer/store/repoStore'
import { git } from '@renderer/ipc'

interface Props {
  onClose: () => void
}

export function MergeDialog({ onClose }: Props) {
  const branches = useRepoStore(s => s.branches)
  const currentBranch = useRepoStore(s => s.currentBranch)
  const repoPath = useRepoStore(s => s.repoPath)
  const refreshStatus = useRepoStore(s => s.refreshStatus)
  const fetchCommits = useRepoStore(s => s.fetchCommits)

  const [targetBranch, setTargetBranch] = useState('')
  const [noFF, setNoFF] = useState(false)
  const [squash, setSquash] = useState(false)
  const [message, setMessage] = useState('')
  const [merging, setMerging] = useState(false)
  const [error, setError] = useState('')

  const availableBranches = branches.filter(b => b.name !== currentBranch && !b.isRemote)

  async function handleMerge() {
    if (!repoPath || !targetBranch) return
    setMerging(true)
    setError('')
    try {
      await git.merge(repoPath, targetBranch, { noFastForward: noFF, squash, message: message || undefined })
      await Promise.all([refreshStatus(), fetchCommits(50)])
      onClose()
    } catch (err: any) {
      setError(err.message || 'Merge failed')
    } finally {
      setMerging(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-background rounded-lg shadow-xl border w-[450px]">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-primary" />
            Merge Branch
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Merge into <strong>{currentBranch}</strong>
          </p>

          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">Branch to merge</label>
            <select
              value={targetBranch}
              onChange={(e) => setTargetBranch(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select branch...</option>
              {availableBranches.map(b => (
                <option key={b.name} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={noFF}
                onChange={(e) => setNoFF(e.target.checked)}
                className="rounded"
              />
              <span>Create merge commit even if fast-forward is possible</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={squash}
                onChange={(e) => setSquash(e.target.checked)}
                className="rounded"
              />
              <span>Squash all commits</span>
            </label>
          </div>

          {error && <div className="text-xs text-destructive bg-destructive/5 p-2 rounded">{error}</div>}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t">
          <button onClick={onClose} className="px-4 py-1.5 text-sm rounded-md border hover:bg-accent">
            Cancel
          </button>
          <button
            onClick={handleMerge}
            disabled={!targetBranch || merging}
            className="px-4 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {merging ? 'Merging...' : 'Merge'}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { X, Tag } from 'lucide-react'
import { useRepoStore } from '@renderer/store/repoStore'
import { git } from '@renderer/ipc'

interface Props {
  onClose: () => void
}

export function TagDialog({ onClose }: Props) {
  const repoPath = useRepoStore(s => s.repoPath)
  const currentBranch = useRepoStore(s => s.currentBranch)

  const [name, setName] = useState('')
  const [annotated, setAnnotated] = useState(false)
  const [message, setMessage] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!repoPath || !name) return
    setCreating(true)
    setError('')
    try {
      await git.createTag(repoPath, name, { annotated, message: message || undefined })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create tag')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-background rounded-lg shadow-xl border w-[400px]">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            New Tag
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">Tag name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.replace(/\s/g, ''))}
              placeholder="v1.0.0"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">Commit</label>
            <input
              type="text"
              value={currentBranch || 'HEAD'}
              disabled
              className="w-full rounded-md border bg-muted px-3 py-2 text-sm font-mono text-muted-foreground"
            />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={annotated}
              onChange={(e) => setAnnotated(e.target.checked)}
              className="rounded"
            />
            <span>Annotated tag</span>
          </label>

          {annotated && (
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">Tag message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Release v1.0.0"
                rows={3}
                className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

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
            {creating ? 'Creating...' : 'Create Tag'}
          </button>
        </div>
      </div>
    </div>
  )
}

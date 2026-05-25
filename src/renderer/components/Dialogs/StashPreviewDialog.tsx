import { useState, useEffect } from 'react'
import { X, Box } from 'lucide-react'
import { git } from '@renderer/ipc'

interface Props {
  repoPath: string
  stashIndex: number
  stashMessage: string
  onClose: () => void
}

export function StashPreviewDialog({ repoPath, stashIndex, stashMessage, onClose }: Props) {
  const [diff, setDiff] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    git.stashShow(repoPath, stashIndex)
      .then((d) => setDiff(d as string))
      .catch((err: any) => setError(err.message || 'Failed to load stash contents'))
      .finally(() => setLoading(false))
  }, [repoPath, stashIndex])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-background rounded-lg shadow-xl border w-[700px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <h2 className="text-sm font-semibold flex items-center gap-2 truncate">
            <Box className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">{stashMessage || `stash@{${stashIndex}}`}</span>
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 min-h-0">
          {loading && (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
              Loading stash contents...
            </div>
          )}
          {error && (
            <div className="text-xs text-destructive bg-destructive/5 p-3 rounded">{error}</div>
          )}
          {!loading && !error && diff && (
            <pre className="text-xs font-mono whitespace-pre-wrap bg-muted/30 rounded p-3 leading-relaxed max-h-full overflow-auto">
              {diff}
            </pre>
          )}
          {!loading && !error && !diff && (
            <div className="text-xs text-muted-foreground text-center py-8">No changes in this stash</div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t shrink-0">
          <button onClick={onClose} className="px-4 py-1.5 text-sm rounded-md border hover:bg-accent">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

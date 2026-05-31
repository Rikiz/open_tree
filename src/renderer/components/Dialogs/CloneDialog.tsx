import { useState, useEffect } from 'react'
import { X, FolderOpen } from 'lucide-react'
import { dialog, git } from '@renderer/ipc'

interface ProgressData {
  stage: string
  progress: number
}

interface Props {
  onClose: () => void
}

export function CloneDialog({ onClose }: Props) {
  const [url, setUrl] = useState('')
  const [destPath, setDestPath] = useState('')
  const [cloning, setCloning] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState<ProgressData | null>(null)

  useEffect(() => {
    const cleanup = git.onProgress((data: Record<string, unknown>) => {
      setProgress({ stage: String(data.stage || ''), progress: Number(data.progress || 0) })
    })
    return () => {
      if (cleanup && typeof cleanup === 'function') cleanup()
    }
  }, [])

  async function handleBrowse() {
    const dir = await dialog.openDirectory()
    if (dir) {
      const name = url.split('/').pop()?.replace('.git', '') || 'repo'
      setDestPath(`${dir}/${name}`)
    }
  }

  async function handleClone() {
    if (!url || !destPath) return
    setCloning(true)
    setError('')
    setProgress(null)
    try {
      await git.clone(url, destPath)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Clone failed')
    } finally {
      setCloning(false)
      setProgress(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-background rounded-lg shadow-xl border w-[500px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Clone Repository</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">Repository URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/user/repo.git"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
              disabled={cloning}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">Destination Path</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={destPath}
                onChange={(e) => setDestPath(e.target.value)}
                placeholder="/path/to/repo"
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={cloning}
              />
              <button onClick={handleBrowse} className="p-2 rounded-md border hover:bg-accent" disabled={cloning}>
                <FolderOpen className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress indicator */}
          {cloning && progress && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="capitalize">{progress.stage}</span>
                <span>{progress.progress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>
          )}
          {cloning && !progress && (
            <div className="text-xs text-muted-foreground">Starting clone...</div>
          )}

          {error && <div className="text-xs text-destructive">{error}</div>}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t">
          <button onClick={onClose} className="px-4 py-1.5 text-sm rounded-md border hover:bg-accent" disabled={cloning}>
            Cancel
          </button>
          <button
            onClick={handleClone}
            disabled={!url || !destPath || cloning}
            className="px-4 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {cloning ? 'Cloning...' : 'Clone'}
          </button>
        </div>
      </div>
    </div>
  )
}

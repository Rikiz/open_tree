import { useState } from 'react'
import { X, Upload, Download } from 'lucide-react'

interface PushPullOptionsProps {
  mode: 'push' | 'pull'
  onClose: () => void
  onExecute: (options: Record<string, unknown>) => Promise<void>
}

export function PushPullOptionsDialog({ mode, onClose, onExecute }: PushPullOptionsProps) {
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState('')

  // Push options
  const [forceWithLease, setForceWithLease] = useState(false)
  const [setUpstream, setSetUpstream] = useState(true)

  // Pull options
  const [pullStrategy, setPullStrategy] = useState<'merge' | 'rebase' | 'ff-only'>('merge')

  async function handleExecute() {
    setExecuting(true)
    setError('')
    try {
      if (mode === 'push') {
        await onExecute({ forceWithLease, setUpstream })
      } else {
        await onExecute({
          rebase: pullStrategy === 'rebase',
          fastForwardOnly: pullStrategy === 'ff-only',
          noFastForward: pullStrategy === 'merge',
        })
      }
      onClose()
    } catch (err: any) {
      setError(err.message || `${mode === 'push' ? 'Push' : 'Pull'} failed`)
    } finally {
      setExecuting(false)
    }
  }

  const isPush = mode === 'push'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-background rounded-lg shadow-xl border w-[400px]">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            {isPush ? <Upload className="w-4 h-4 text-primary" /> : <Download className="w-4 h-4 text-primary" />}
            {isPush ? 'Push Options' : 'Pull Options'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {isPush ? (
            <>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceWithLease}
                  onChange={(e) => setForceWithLease(e.target.checked)}
                  className="rounded"
                />
                <span>Force with lease</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={setUpstream}
                  onChange={(e) => setSetUpstream(e.target.checked)}
                  className="rounded"
                />
                <span>Set upstream</span>
              </label>
            </>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">Pull strategy</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="pullStrategy"
                    checked={pullStrategy === 'merge'}
                    onChange={() => setPullStrategy('merge')}
                  />
                  <span>Merge (no-ff)</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="pullStrategy"
                    checked={pullStrategy === 'rebase'}
                    onChange={() => setPullStrategy('rebase')}
                  />
                  <span>Rebase</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="pullStrategy"
                    checked={pullStrategy === 'ff-only'}
                    onChange={() => setPullStrategy('ff-only')}
                  />
                  <span>Fast-forward only</span>
                </label>
              </div>
            </div>
          )}

          {error && <div className="text-xs text-destructive bg-destructive/5 p-2 rounded">{error}</div>}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t">
          <button onClick={onClose} className="px-4 py-1.5 text-sm rounded-md border hover:bg-accent">
            Cancel
          </button>
          <button
            onClick={handleExecute}
            disabled={executing}
            className="px-4 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {executing ? 'Running...' : isPush ? 'Push' : 'Pull'}
          </button>
        </div>
      </div>
    </div>
  )
}

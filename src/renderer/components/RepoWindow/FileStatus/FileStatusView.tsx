import { useState } from 'react'
import { useRepoStore } from '@renderer/store/repoStore'
import { FileItem } from './FileItem'
import { CommitPanel } from './CommitPanel'
import { Plus, Minus, RotateCcw, X, AlertTriangle } from 'lucide-react'

export function FileStatusView() {
  const status = useRepoStore(s => s.status)
  const selectedFile = useRepoStore(s => s.selectedFile)
  const selectedFileDiff = useRepoStore(s => s.selectedFileDiff)
  const selectFile = useRepoStore(s => s.selectFile)
  const stageFiles = useRepoStore(s => s.stageFiles)
  const unstageFiles = useRepoStore(s => s.unstageFiles)
  const discardFile = useRepoStore(s => s.discardFile)

  const [showStaged, setShowStaged] = useState(true)
  const [showUnstaged, setShowUnstaged] = useState(true)
  const [confirmDiscard, setConfirmDiscard] = useState<string | null>(null)

  if (!status) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Loading...
      </div>
    )
  }

  const unstagedFiles = status.files.filter(f => !f.staged)
  const stagedFiles = status.files.filter(f => f.staged)

  function handleDiscard(file: string) {
    setConfirmDiscard(file)
  }

  async function confirmDiscardAction() {
    if (!confirmDiscard) return
    await discardFile(confirmDiscard)
    setConfirmDiscard(null)
  }

  return (
    <div className="flex h-full min-h-0">
      {/* File list + commit panel */}
      <div className={`${selectedFile ? 'w-1/2' : 'flex-1'} flex flex-col min-w-0 border-r`}>
        <div className="flex-1 overflow-auto">
          {stagedFiles.length > 0 && (
            <div>
              <button
                onClick={() => setShowStaged(!showStaged)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent sticky top-0 bg-background z-10"
              >
                <span className="transform transition-transform inline-block" style={{ rotate: showStaged ? '90deg' : '0deg' }}>
                  ▶
                </span>
                Staged Files ({stagedFiles.length})
                <button
                  onClick={(e) => { e.stopPropagation(); unstageFiles(stagedFiles.map(f => f.path)) }}
                  className="ml-auto text-[10px] px-1.5 py-0.5 rounded border hover:bg-accent"
                >
                  Unstage all
                </button>
              </button>
              {showStaged && stagedFiles.map((f) => (
                <FileItem
                  key={f.path}
                  file={f}
                  onClick={() => selectFile(f.path)}
                  isSelected={selectedFile === f.path}
                  onAction={() => unstageFiles([f.path])}
                  actionLabel="Unstage"
                  actionIcon={<Minus className="w-3 h-3" />}
                />
              ))}
            </div>
          )}

          {unstagedFiles.length > 0 && (
            <div>
              <button
                onClick={() => setShowUnstaged(!showUnstaged)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent sticky top-0 bg-background z-10"
              >
                <span className="transform transition-transform inline-block" style={{ rotate: showUnstaged ? '90deg' : '0deg' }}>
                  ▶
                </span>
                Unstaged Files ({unstagedFiles.length})
                <button
                  onClick={(e) => { e.stopPropagation(); stageFiles(unstagedFiles.map(f => f.path)) }}
                  className="ml-auto text-[10px] px-1.5 py-0.5 rounded border hover:bg-accent"
                >
                  Stage all
                </button>
              </button>
              {showUnstaged && unstagedFiles.map((f) => (
                <FileItem
                  key={f.path}
                  file={f}
                  onClick={() => selectFile(f.path)}
                  isSelected={selectedFile === f.path}
                  onAction={() => stageFiles([f.path])}
                  actionLabel="Stage"
                  actionIcon={<Plus className="w-3 h-3" />}
                  onDiscard={() => handleDiscard(f.path)}
                />
              ))}
            </div>
          )}

          {status.files.length === 0 && (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Working tree clean
            </div>
          )}
        </div>

        <CommitPanel />
      </div>

      {/* Diff view */}
      {selectedFile && (
        <div className="w-1/2 overflow-auto">
          <div className="p-3">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-2 p-1 bg-accent rounded sticky top-0">
              <span>{selectedFile}</span>
              <button onClick={() => selectFile(null)} className="p-0.5 hover:bg-background rounded shrink-0">
                <X className="w-3 h-3" />
              </button>
            </div>
            {selectedFileDiff ? (
              selectedFileDiff.files.map((fileDiff, i) => (
                <div key={i}>
                  {fileDiff.hunks.map((hunk, j) => (
                    <div key={j} className="mb-3">
                      <div className="text-xs font-mono text-blue-500 bg-blue-50 dark:bg-blue-950 py-0.5 px-2 rounded-t">
                        {hunk.header}
                      </div>
                      <div className="font-mono text-xs leading-5">
                        {hunk.lines.map((line, k) => (
                          <div
                            key={k}
                            className={`px-2 py-0 whitespace-pre ${
                              line.type === 'add' ? 'diff-add' : line.type === 'delete' ? 'diff-del' : ''
                            }`}
                          >
                            <span className="text-muted-foreground mr-2 w-6 inline-block text-right select-none">
                              {line.type === 'add' ? '+' : line.type === 'delete' ? '-' : ' '}
                            </span>
                            {line.content}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground py-4 text-center">
                Binary file or no changes to display
              </div>
            )}
          </div>
        </div>
      )}

      {/* Discard confirmation dialog */}
      {confirmDiscard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-background rounded-lg shadow-xl border w-[380px]">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                <h3 className="text-sm font-semibold">Discard Changes</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to discard changes to <strong className="font-mono text-xs">{confirmDiscard}</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t">
              <button onClick={() => setConfirmDiscard(null)} className="px-4 py-1.5 text-sm rounded-md border hover:bg-accent">
                Cancel
              </button>
              <button
                onClick={confirmDiscardAction}
                className="px-4 py-1.5 text-sm rounded-md bg-destructive text-destructive-foreground hover:opacity-90"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

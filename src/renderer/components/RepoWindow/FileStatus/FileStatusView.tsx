import { useState } from 'react'
import { useRepoStore } from '@renderer/store/repoStore'
import { FileItem } from './FileItem'
import { CommitPanel } from './CommitPanel'
import { Plus, Minus, RotateCcw } from 'lucide-react'

export function FileStatusView() {
  const status = useRepoStore(s => s.status)
  const selectedFile = useRepoStore(s => s.selectedFile)
  const selectedFileDiff = useRepoStore(s => s.selectedFileDiff)
  const selectFile = useRepoStore(s => s.selectFile)
  const stageFiles = useRepoStore(s => s.stageFiles)
  const unstageFiles = useRepoStore(s => s.unstageFiles)

  const [showStaged, setShowStaged] = useState(true)
  const [showUnstaged, setShowUnstaged] = useState(true)

  if (!status) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Loading...
      </div>
    )
  }

  const unstagedFiles = status.files.filter(f => !f.staged)
  const stagedFiles = status.files.filter(f => f.staged)

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
                  onClick={(e) => { e.stopPropagation(); stageFiles(unstagedFiles.filter(f => f.status !== '?').map(f => f.path)) }}
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
                  onAction={f.status === '?' ? undefined : () => stageFiles([f.path])}
                  actionLabel="Stage"
                  actionIcon={<Plus className="w-3 h-3" />}
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
            <div className="text-xs font-mono text-muted-foreground mb-2 p-1 bg-accent rounded sticky top-0">
              {selectedFile}
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
    </div>
  )
}

import { useState } from 'react'
import { FolderOpen, Plus, Trash2, Download, Settings } from 'lucide-react'
import type { Bookmark } from '@shared/types'
import { dialog } from '@renderer/ipc'
import { ThemeToggle } from '../common/ThemeToggle'
import { CloneDialog } from '../Dialogs/CloneDialog'
import { PreferencesDialog } from '../Dialogs/PreferencesDialog'

interface Props {
  bookmarks: Bookmark[]
  onOpenRepo: (path: string) => void
  onAddRepo: (path: string) => void
  onRemoveRepo: (id: string) => void
}

export function BookmarkWindow({ bookmarks, onOpenRepo, onAddRepo, onRemoveRepo }: Props) {
  const [showClone, setShowClone] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)

  async function handleAdd() {
    const dir = await dialog.openDirectory()
    if (dir) onAddRepo(dir)
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-12 border-b flex items-center justify-between pl-[76px] pr-4 shrink-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <h1 className="text-sm font-semibold">OpenTree</h1>
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <ThemeToggle />
          <button
            onClick={() => setShowPreferences(true)}
            className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-md hover:bg-accent transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowClone(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border hover:bg-accent transition-colors"
          >
            <Download className="w-3 h-3" />
            Clone
          </button>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4">
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <FolderOpen className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No repositories yet</p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setShowClone(true)} className="px-4 py-1.5 text-xs rounded-md border hover:bg-accent">
                Clone Repository
              </button>
              <button onClick={handleAdd} className="px-4 py-1.5 text-xs rounded-md bg-primary text-primary-foreground">
                Add Existing
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-1">
            {bookmarks.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-accent cursor-pointer group"
                onClick={() => onOpenRepo(b.path)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{b.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{b.path}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveRepo(b.id) }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showClone && <CloneDialog onClose={() => setShowClone(false)} />}
      {showPreferences && <PreferencesDialog onClose={() => setShowPreferences(false)} />}
    </div>
  )
}

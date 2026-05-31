import { File, RotateCcw } from 'lucide-react'
import { ReactNode, useState } from 'react'

interface FileStatus {
  path: string
  status: string
  staged: boolean
}

interface Props {
  file: FileStatus
  onClick: () => void
  isSelected: boolean
  onAction?: () => void
  actionLabel?: string
  actionIcon?: ReactNode
  onDiscard?: () => void
}

const STATUS_COLORS: Record<string, string> = {
  'M': 'text-yellow-500',
  'A': 'text-green-500',
  'D': 'text-red-500',
  'R': 'text-blue-500',
  'C': 'text-blue-400',
  'U': 'text-destructive font-bold',
  '?': 'text-muted-foreground',
}

export function FileItem({ file, onClick, isSelected, onAction, actionLabel, actionIcon, onDiscard }: Props) {
  const color = STATUS_COLORS[file.status] || 'text-muted-foreground'
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  return (
    <>
      <div
        className={`flex items-center gap-2 pl-6 pr-2 py-1 cursor-pointer text-sm hover:bg-accent group ${
          isSelected ? 'bg-accent' : ''
        }`}
        onContextMenu={handleContextMenu}
      >
        <span onClick={onClick} className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`text-xs font-mono w-5 shrink-0 ${color}`}>{file.status}</span>
          <File className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="truncate flex-1">{file.path}</span>
        </span>
        <div className="flex items-center gap-1">
          {onDiscard && !file.staged && (
            <button
              onClick={(e) => { e.stopPropagation(); onDiscard() }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
              title="Discard changes"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
          {onAction && (
            <button
              onClick={(e) => { e.stopPropagation(); onAction() }}
              className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded border hover:bg-accent transition-opacity shrink-0"
              title={actionLabel}
            >
              {actionIcon}
              {actionLabel}
            </button>
          )}
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-[100] bg-background border rounded-md shadow-lg py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {onDiscard && !file.staged && (
              <button
                onClick={() => { onDiscard(); setContextMenu(null) }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent text-left text-destructive"
              >
                <RotateCcw className="w-3 h-3" />
                Discard Changes
              </button>
            )}
            {onAction && (
              <button
                onClick={() => { onAction(); setContextMenu(null) }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent text-left"
              >
                {actionIcon}
                {actionLabel}
              </button>
            )}
          </div>
        </>
      )}
    </>
  )
}

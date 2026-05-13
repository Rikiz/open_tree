import { File } from 'lucide-react'
import { ReactNode } from 'react'

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

export function FileItem({ file, onClick, isSelected, onAction, actionLabel, actionIcon }: Props) {
  const color = STATUS_COLORS[file.status] || 'text-muted-foreground'

  return (
    <div
      className={`flex items-center gap-2 pl-6 pr-2 py-1 cursor-pointer text-sm hover:bg-accent group ${
        isSelected ? 'bg-accent' : ''
      }`}
    >
      <span onClick={onClick} className="flex items-center gap-2 flex-1 min-w-0">
        <span className={`text-xs font-mono w-5 shrink-0 ${color}`}>{file.status}</span>
        <File className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="truncate flex-1">{file.path}</span>
      </span>
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
  )
}

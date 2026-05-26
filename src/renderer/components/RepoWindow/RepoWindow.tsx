import { ArrowLeft, GitBranch, Upload, Download, Sun, Moon, Loader2 } from 'lucide-react'
import { useRepoStore } from '@renderer/store/repoStore'
import { useThemeStore } from '@renderer/store/themeStore'
import { FileStatusView } from './FileStatus/FileStatusView'
import { HistoryView } from './History/HistoryView'
import { Sidebar } from '../Sidebar/Sidebar'
import { OperationToast } from '../common/OperationToast'
import { useEffect, useState, useRef } from 'react'

interface Props {
  onBack: () => void
}

export function RepoWindow({ onBack }: Props) {
  const repoPath = useRepoStore(s => s.repoPath)
  const status = useRepoStore(s => s.status)
  const currentBranch = useRepoStore(s => s.currentBranch)
  const error = useRepoStore(s => s.error)
  const isPulling = useRepoStore(s => s.isPulling)
  const isPushing = useRepoStore(s => s.isPushing)
  const refreshStatus = useRepoStore(s => s.refreshStatus)
  const push = useRepoStore(s => s.push)
  const pull = useRepoStore(s => s.pull)
  const { resolved, toggle } = useThemeStore()
  const [activeTab, setActiveTab] = useState<'status' | 'history'>('status')

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const prevIsPulling = useRef(false)
  const prevIsPushing = useRef(false)

  useEffect(() => {
    if (!repoPath) return
    const timer = setInterval(refreshStatus, 5000)
    return () => clearInterval(timer)
  }, [repoPath])

  useEffect(() => {
    if (prevIsPulling.current && !isPulling && !error) {
      setNotification({ type: 'success', message: 'Pull completed successfully' })
    }
    prevIsPulling.current = isPulling
  }, [isPulling, error])

  useEffect(() => {
    if (prevIsPushing.current && !isPushing && !error) {
      setNotification({ type: 'success', message: 'Push completed successfully' })
    }
    prevIsPushing.current = isPushing
  }, [isPushing, error])

  useEffect(() => {
    if (error && !isPulling && !isPushing) {
      setNotification({ type: 'error', message: error })
    }
  }, [error, isPulling, isPushing])

  if (!repoPath) return null

  const repoName = repoPath.replace(/\\/g, '/').split('/').filter(Boolean).pop() || ''

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-10 border-b flex items-center px-2 gap-1 shrink-0" style={{ WebkitAppRegion: 'drag', ...(/Mac/i.test(navigator.platform) ? { paddingLeft: '76px' } : {}) } as React.CSSProperties}>
        <button onClick={onBack} className="p-1.5 rounded hover:bg-accent" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex flex-col leading-tight min-w-0" title={repoPath}>
          <span className="text-xs font-medium truncate">{repoName}</span>
        </div>

        <div className="w-px h-4 bg-border mx-1" />

        <button onClick={() => setActiveTab('status')} className={`px-2.5 py-1 text-xs rounded hover:bg-accent ${activeTab === 'status' ? 'bg-accent' : ''}`} style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          File Status
        </button>
        <button onClick={() => setActiveTab('history')} className={`px-2.5 py-1 text-xs rounded hover:bg-accent ${activeTab === 'history' ? 'bg-accent' : ''}`} style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          History
        </button>

        <div className="w-px h-4 bg-border mx-1" />

        <button
          onClick={pull}
          disabled={isPulling}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded hover:bg-accent disabled:opacity-50"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {isPulling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Pull
        </button>
        <button
          onClick={push}
          disabled={isPushing}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded hover:bg-accent disabled:opacity-50"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {isPushing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          Push
        </button>

        <div className="flex-1" />

        <button onClick={toggle} className="p-1.5 rounded hover:bg-accent text-muted-foreground" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {resolved === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        <div className="flex items-center gap-3 text-xs text-muted-foreground px-2">
          <span className="flex items-center gap-1">
            <GitBranch className="w-3.5 h-3.5" />
            {currentBranch || '...'}
          </span>
          {status && (
            <>
              {status.ahead > 0 && <span>↑{status.ahead}</span>}
              {status.behind > 0 && <span>↓{status.behind}</span>}
              <span>{status.staged}s</span>
              <span>{status.unstaged + status.untracked}c</span>
            </>
          )}
        </div>
      </header>

      {notification && (
        <div className="px-2 pt-2 shrink-0 flex justify-center">
          <div className="w-full max-w-lg">
            <OperationToast
              type={notification.type}
              message={notification.message}
              onDismiss={() => setNotification(null)}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <div className="flex-1 min-w-0">
          {activeTab === 'status' ? <FileStatusView /> : <HistoryView />}
        </div>
      </div>
    </div>
  )
}

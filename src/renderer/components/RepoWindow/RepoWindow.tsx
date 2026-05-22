import { ArrowLeft, GitBranch, Upload, Download, Sun, Moon } from 'lucide-react'
import { useRepoStore } from '@renderer/store/repoStore'
import { useThemeStore } from '@renderer/store/themeStore'
import { FileStatusView } from './FileStatus/FileStatusView'
import { HistoryView } from './History/HistoryView'
import { Sidebar } from '../Sidebar/Sidebar'
import { useEffect, useState } from 'react'

interface Props {
  onBack: () => void
}

export function RepoWindow({ onBack }: Props) {
  const repoPath = useRepoStore(s => s.repoPath)
  const status = useRepoStore(s => s.status)
  const currentBranch = useRepoStore(s => s.currentBranch)
  const refreshStatus = useRepoStore(s => s.refreshStatus)
  const push = useRepoStore(s => s.push)
  const pull = useRepoStore(s => s.pull)
  const { resolved, toggle } = useThemeStore()
  const [activeTab, setActiveTab] = useState<'status' | 'history'>('status')

  useEffect(() => {
    if (!repoPath) return
    const timer = setInterval(refreshStatus, 5000)
    return () => clearInterval(timer)
  }, [repoPath])

  if (!repoPath) return null

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-10 border-b flex items-center px-2 gap-1 shrink-0" style={{ WebkitAppRegion: 'drag', ...(/Mac/i.test(navigator.platform) ? { paddingLeft: '76px' } : {}) } as React.CSSProperties}>
        <button onClick={onBack} className="p-1.5 rounded hover:bg-accent" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />

        <button onClick={() => setActiveTab('status')} className={`px-2.5 py-1 text-xs rounded hover:bg-accent ${activeTab === 'status' ? 'bg-accent' : ''}`} style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          File Status
        </button>
        <button onClick={() => setActiveTab('history')} className={`px-2.5 py-1 text-xs rounded hover:bg-accent ${activeTab === 'history' ? 'bg-accent' : ''}`} style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          History
        </button>

        <div className="w-px h-4 bg-border mx-1" />

        <button onClick={pull} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded hover:bg-accent" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <Download className="w-3.5 h-3.5" /> Pull
        </button>
        <button onClick={push} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded hover:bg-accent" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <Upload className="w-3.5 h-3.5" /> Push
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

      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <div className="flex-1 min-w-0">
          {activeTab === 'status' ? <FileStatusView /> : <HistoryView />}
        </div>
      </div>
    </div>
  )
}

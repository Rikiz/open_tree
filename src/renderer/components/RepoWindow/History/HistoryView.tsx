import { useState } from 'react'
import { useRepoStore } from '@renderer/store/repoStore'
import { CommitGraphCanvas, useGraphLayout } from './CommitGraph'
import { CommitDetail } from './CommitDetail'
import { git } from '@renderer/ipc'

export function HistoryView() {
  const commits = useRepoStore(s => s.commits)
  const repoPath = useRepoStore(s => s.repoPath)
  const hasMoreCommits = useRepoStore(s => s.hasMoreCommits)
  const fetchCommits = useRepoStore(s => s.fetchCommits)
  const selectCommit = useRepoStore(s => s.selectCommit)
  const selectedCommit = useRepoStore(s => s.selectedCommit)

  const [detailHash, setDetailHash] = useState<string | null>(null)

  const graphNodes = commits.map(c => ({
    hash: c.hash,
    subject: c.subject,
    author: c.author.name,
    date: c.date,
    refs: c.refs,
    parents: c.parents,
    x: 0,
    y: 0,
    color: '',
    isMerge: c.parents.length > 1,
  }))

  const graphWidth = Math.max(200, useGraphLayout(graphNodes).width)

  function handleCommitClick(hash: string) {
    setDetailHash(hash)
    selectCommit(hash)
  }

  function handleCloseDetail() {
    setDetailHash(null)
    selectCommit(null)
  }

  function handleLoadMore() {
    fetchCommits(50)
  }

  return (
    <div className="h-full flex flex-col">
      {detailHash && selectedCommit && (
        <CommitDetail
          detail={selectedCommit}
          onClose={handleCloseDetail}
        />
      )}
      <div className="flex-1 overflow-auto">
        <div className="relative" style={{ minHeight: commits.length * 32 }}>
          {/* Graph layer */}
          <div className="absolute left-0 top-0 bottom-0" style={{ width: graphWidth }}>
            <CommitGraphCanvas
              commits={graphNodes}
              width={graphWidth}
              rowHeight={32}
              onCommitClick={handleCommitClick}
            />
          </div>

          {/* Text layer */}
          <div style={{ marginLeft: graphWidth }}>
            {commits.map((c, i) => (
              <div
                key={c.hash}
                className={'flex items-center border-b h-8 px-2 hover:bg-accent cursor-pointer' + (detailHash === c.hash ? ' bg-accent' : '')}
                onClick={() => handleCommitClick(c.hash)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-primary shrink-0">{c.shortHash}</span>
                    <span className="text-sm truncate">{c.subject}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0 ml-2">
                  <span className="truncate max-w-[120px]">{c.author.name}</span>
                  <span>{new Date(c.date).toLocaleDateString()}</span>
                  {c.refs.map(ref => (
                    <span key={ref} className="inline-block px-1.5 py-0.5 rounded bg-accent text-[10px] font-mono">
                      {ref}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {/* Load more */}
            {hasMoreCommits && (
              <button
                onClick={handleLoadMore}
                className="w-full py-2 text-xs text-muted-foreground hover:bg-accent"
              >
                Load more commits...
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

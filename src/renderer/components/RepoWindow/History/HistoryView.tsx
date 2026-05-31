import { useRepoStore, type LogFilter } from '@renderer/store/repoStore'
import { CommitGraphCanvas, useGraphLayout } from './CommitGraph'
import { CommitDetail } from './CommitDetail'
import { git } from '@renderer/ipc'
import { Search, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function HistoryView() {
  const commits = useRepoStore(s => s.commits)
  const repoPath = useRepoStore(s => s.repoPath)
  const hasMoreCommits = useRepoStore(s => s.hasMoreCommits)
  const fetchCommits = useRepoStore(s => s.fetchCommits)
  const selectCommit = useRepoStore(s => s.selectCommit)
  const selectedCommit = useRepoStore(s => s.selectedCommit)
  const logFilter = useRepoStore(s => s.logFilter)
  const logFilterBy = useRepoStore(s => s.logFilter.filterBy)
  const setLogFilter = useRepoStore(s => s.setLogFilter)

  const [searchText, setSearchText] = useState(logFilter.search)
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  function handleSearchChange(value: string) {
    setSearchText(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setLogFilter({ search: value, filterBy: logFilterBy })
    }, 300)
  }

  function handleFilterByChange(filterBy: LogFilter['filterBy']) {
    setLogFilter({ search: searchText, filterBy })
  }

  function clearSearch() {
    setSearchText('')
    setLogFilter({ search: '', filterBy: logFilterBy })
  }

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
    selectCommit(hash)
  }

  function handleCloseDetail() {
    selectCommit(null)
  }

  function handleLoadMore() {
    fetchCommits(50)
  }

  const selectedHash = selectedCommit?.commit?.hash ?? null

  return (
    <div className="h-full flex flex-col">
      {/* Search bar */}
      <div className="border-b px-2 py-1.5 flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={`p-1 rounded hover:bg-accent ${showSearch ? 'bg-accent' : ''}`}
          title="Search history"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
        {showSearch && (
          <>
            <div className="flex-1 flex items-center relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchText}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search commits..."
                className="w-full h-6 text-xs rounded border bg-background px-2 pr-6 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { clearSearch(); setShowSearch(false) }
                }}
              />
              {searchText && (
                <button onClick={clearSearch} className="absolute right-1 p-0.5 rounded hover:bg-accent">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <select
              value={logFilterBy}
              onChange={(e) => handleFilterByChange(e.target.value as LogFilter['filterBy'])}
              className="h-6 text-xs rounded border bg-background px-1 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All</option>
              <option value="message">Message</option>
              <option value="author">Author</option>
              <option value="file">File</option>
            </select>
          </>
        )}
      </div>

      {selectedCommit && (
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
            {commits.length === 0 && (
              <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                {logFilter.search ? `No commits matching "${logFilter.search}"` : 'No commits'}
              </div>
            )}
            {commits.map((c, i) => (
              <div
                key={c.hash}
                className={'flex items-center border-b h-8 px-2 hover:bg-accent cursor-pointer' + (selectedHash === c.hash ? ' bg-accent' : '')}
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

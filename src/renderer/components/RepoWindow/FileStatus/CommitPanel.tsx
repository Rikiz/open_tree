import { useState } from 'react'
import { useRepoStore } from '@renderer/store/repoStore'

export function CommitPanel() {
  const commitMessage = useRepoStore(s => s.commitMessage)
  const setCommitMessage = useRepoStore(s => s.setCommitMessage)
  const commit = useRepoStore(s => s.commit)
  const status = useRepoStore(s => s.status)
  const [isCommitting, setIsCommitting] = useState(false)
  const [amend, setAmend] = useState(false)
  const [signoff, setSignoff] = useState(false)

  const stagedCount = status?.staged ?? 0

  async function handleCommit() {
    if (!commitMessage.trim()) return
    setIsCommitting(true)
    try {
      await commit(commitMessage, { amend, signoff })
      setAmend(false)
      setSignoff(false)
    } finally {
      setIsCommitting(false)
    }
  }

  return (
    <div className="border-t p-3 shrink-0">
      <textarea
        value={commitMessage}
        onChange={(e) => setCommitMessage(e.target.value)}
        placeholder="Commit message..."
        rows={3}
        className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            handleCommit()
          }
        }}
      />
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {stagedCount > 0 ? `${stagedCount} file${stagedCount > 1 ? 's' : ''} staged` : 'Nothing staged'}
          </span>
          <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={amend}
              onChange={(e) => setAmend(e.target.checked)}
              className="rounded"
            />
            Amend
          </label>
          <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={signoff}
              onChange={(e) => setSignoff(e.target.checked)}
              className="rounded"
            />
            Sign-off
          </label>
        </div>
        <button
          onClick={handleCommit}
          disabled={!commitMessage.trim() || (stagedCount === 0 && !amend) || isCommitting}
          className="inline-flex items-center gap-1 px-4 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {isCommitting ? 'Committing...' : 'Commit'}
        </button>
      </div>
    </div>
  )
}

import { X, GitCommit, User, Clock, GitBranch } from 'lucide-react'

interface CommitDetailProps {
  detail: {
    commit: {
      hash: string
      shortHash: string
      subject: string
      body: string
      author: { name: string; email: string }
      date: Date
      parents: string[]
      refs: string[]
    }
    diff: string
  }
  onClose: () => void
}

export function CommitDetail({ detail, onClose }: CommitDetailProps) {
  const { commit, diff } = detail
  const sections = diff.split(/^diff --git /m).filter(Boolean)
  const files = sections.map(s => {
    const header = s.split('\n')[0]
    const path = header.replace(/.* b\//, '').trim()
    const lines = s.split('\n')
    const additions = lines.filter(l => l.startsWith('+') && !l.startsWith('+++')).length
    const deletions = lines.filter(l => l.startsWith('-') && !l.startsWith('---')).length
    const binary = s.includes('Binary files')
    return { path, additions, deletions, binary }
  })

  const totalAdd = files.reduce((sum, f) => sum + f.additions, 0)
  const totalDel = files.reduce((sum, f) => sum + f.deletions, 0)

  const bodyLines = commit.body.split('\n').filter(Boolean)

  return (
    <div className="border-b">
      <div className="flex items-start gap-3 p-3 bg-accent/30">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <GitCommit className="w-4 h-4 shrink-0 text-primary" />
            <span className="text-xs font-mono text-primary">{commit.shortHash}</span>
            {commit.refs.map(ref => (
              <span key={ref} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-accent text-[10px] font-mono">
                <GitBranch className="w-2.5 h-2.5" />
                {ref}
              </span>
            ))}
          </div>
          <h3 className="text-sm font-medium mb-1">{commit.subject}</h3>
          {bodyLines.length > 0 && (
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap mb-2 font-sans">
              {bodyLines.join('\n')}
            </pre>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {commit.author.name} {'<'}{commit.author.email}{'>'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(commit.date).toLocaleString()}
            </span>
            <span className={totalAdd > 0 ? 'text-green-600' : ''}>+{totalAdd}</span>
            <span className={totalDel > 0 ? 'text-red-600' : ''}>-{totalDel}</span>
            <span>{files.length} file{files.length !== 1 ? 's' : ''} changed</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-accent rounded shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="max-h-64 overflow-auto">
        {files.length === 0 && (
          <div className="p-3 text-xs text-muted-foreground text-center">
            No diff content available
          </div>
        )}
        <table className="w-full text-xs font-mono">
          <tbody>
            {files.map(f => (
              <tr key={f.path} className="border-b last:border-0">
                <td className="px-3 py-1.5">
                  <span className={f.binary ? 'text-muted-foreground' : ''}>
                    {f.path}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-right w-12">
                  {f.additions > 0 && <span className="text-green-600">+{f.additions}</span>}
                </td>
                <td className="px-2 py-1.5 text-right w-12">
                  {f.deletions > 0 && <span className="text-red-600">-{f.deletions}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

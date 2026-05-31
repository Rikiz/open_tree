import { X, GitCommit, User, Clock, GitBranch, ChevronRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'

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
  const [expandedFile, setExpandedFile] = useState<string | null>(null)

  const sections = diff.split(/^diff --git /m).filter(Boolean)
  const files = sections.map(s => {
    const header = s.split('\n')[0]
    const path = header.replace(/.* b\//, '').trim()
    const lines = s.split('\n')
    const additions = lines.filter(l => l.startsWith('+') && !l.startsWith('+++')).length
    const deletions = lines.filter(l => l.startsWith('-') && !l.startsWith('---')).length
    const binary = s.includes('Binary files')
    const hunks = parseHunks(s)
    return { path, additions, deletions, binary, hunks, raw: s }
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

      <div className="max-h-96 overflow-auto">
        {files.length === 0 && (
          <div className="p-3 text-xs text-muted-foreground text-center">
            No diff content available
          </div>
        )}
        {files.map(f => (
          <div key={f.path}>
            {/* File row - clickable to expand */}
            <div
              className="flex items-center border-b cursor-pointer hover:bg-accent/50"
              onClick={() => setExpandedFile(expandedFile === f.path ? null : f.path)}
            >
              <div className="px-2 py-1.5">
                {expandedFile === f.path ? (
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
              <span className={`text-xs font-mono flex-1 ${f.binary ? 'text-muted-foreground' : ''}`}>
                {f.path}
              </span>
              <div className="px-3 py-1.5 text-right shrink-0 flex items-center gap-2">
                {f.additions > 0 && <span className="text-green-600 text-xs">+{f.additions}</span>}
                {f.deletions > 0 && <span className="text-red-600 text-xs">-{f.deletions}</span>}
              </div>
            </div>

            {/* Expanded diff */}
            {expandedFile === f.path && !f.binary && (
              <div className="border-b bg-muted/20">
                {f.hunks.map((hunk, i) => (
                  <div key={i} className="mb-1">
                    <div className="text-xs font-mono text-blue-500 bg-blue-50 dark:bg-blue-950 py-0.5 px-2">
                      {hunk.header}
                    </div>
                    <div className="font-mono text-xs leading-5">
                      {hunk.lines.map((line, j) => (
                        <div
                          key={j}
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
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface ParsedHunk {
  header: string
  lines: { type: 'add' | 'delete' | 'context'; content: string }[]
}

function parseHunks(raw: string): ParsedHunk[] {
  const hunks: ParsedHunk[] = []
  const hunkMatches = raw.match(/@@ -\d+,?\d* \+\d+,?\d* @@.*/g)
  if (!hunkMatches) return hunks

  const parts = raw.split(/^@@ .* @@.*/m)
  for (let i = 0; i < hunkMatches.length; i++) {
    const header = hunkMatches[i]
    const body = parts[i + 1] || ''
    const lines: ParsedHunk['lines'] = []

    for (const hunkLine of body.split('\n')) {
      if (hunkLine.startsWith('+')) {
        lines.push({ type: 'add', content: hunkLine.slice(1) })
      } else if (hunkLine.startsWith('-')) {
        lines.push({ type: 'delete', content: hunkLine.slice(1) })
      } else if (hunkLine.startsWith(' ')) {
        lines.push({ type: 'context', content: hunkLine.slice(1) })
      }
    }

    hunks.push({ header, lines })
  }

  return hunks
}

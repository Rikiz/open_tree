import { useState, useEffect } from 'react'
import { GitBranch, Tag, Box, Radio, Plus } from 'lucide-react'
import { useRepoStore } from '@renderer/store/repoStore'
import { git } from '@renderer/ipc'
import { BranchDialog } from '../Dialogs/BranchDialog'
import { MergeDialog } from '../Dialogs/MergeDialog'

interface TagItem { name: string; commitHash: string; isAnnotated: boolean; isSigned: boolean }
interface StashItem { index: number; message: string; branchName: string; commitHash: string }

export function Sidebar() {
  const branches = useRepoStore(s => s.branches)
  const currentBranch = useRepoStore(s => s.currentBranch)
  const checkout = useRepoStore(s => s.checkout)
  const repoPath = useRepoStore(s => s.repoPath)

  const [stashes, setStashes] = useState<StashItem[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [activeSection, setActiveSection] = useState<'branches' | 'tags'>('branches')
  const [showBranchDialog, setShowBranchDialog] = useState(false)
  const [showMergeDialog, setShowMergeDialog] = useState(false)

  useEffect(() => {
    if (!repoPath) return
    git.listStashes(repoPath).then(s => setStashes(s as StashItem[]))
    git.listTags(repoPath).then(t => setTags(t as TagItem[]))
  }, [repoPath, currentBranch])

  async function handleCheckout(name: string) {
    try {
      await checkout(name)
    } catch {}
  }

  return (
    <aside className="w-56 border-r flex flex-col shrink-0 bg-muted/20">
      {/* Section tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveSection('branches')}
          className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 ${
            activeSection === 'branches' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          Branches
        </button>
        <button
          onClick={() => setActiveSection('tags')}
          className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 ${
            activeSection === 'tags' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          Tags
        </button>
      </div>

      <div className="flex-1 overflow-auto py-1">
        {activeSection === 'branches' && (
          <div>
            {/* Actions bar */}
            <div className="flex gap-0.5 px-2 py-1 border-b">
              <button
                onClick={() => setShowBranchDialog(true)}
                className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] rounded hover:bg-accent"
              >
                <Plus className="w-3 h-3" /> Branch
              </button>
              <button
                onClick={() => setShowMergeDialog(true)}
                className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] rounded hover:bg-accent"
              >
                <GitBranch className="w-3 h-3" /> Merge
              </button>
            </div>

            {/* Branch list */}
            {branches.map((b) => (
              <div
                key={b.name}
                onClick={() => handleCheckout(b.name)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-accent ${
                  b.isCurrent ? 'bg-accent font-medium' : ''
                }`}
              >
                {b.isCurrent ? (
                  <Radio className="w-3 h-3 text-primary shrink-0" />
                ) : (
                  <GitBranch className="w-3 h-3 text-muted-foreground shrink-0" />
                )}
                <span className="truncate flex-1">{b.name}</span>
                <div className="flex gap-1 text-[10px] text-muted-foreground shrink-0">
                  {b.ahead > 0 && <span>↑{b.ahead}</span>}
                  {b.behind > 0 && <span>↓{b.behind}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'tags' && (
          <div>
            {tags.map((t) => (
              <div
                key={t.name}
                className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-accent"
              >
                <Tag className="w-3 h-3 text-yellow-500 shrink-0" />
                <span className="truncate flex-1">{t.name}</span>
              </div>
            ))}
            {tags.length === 0 && (
              <div className="px-3 py-4 text-xs text-muted-foreground text-center">No tags</div>
            )}
          </div>
        )}
      </div>

      {/* Stashes */}
      {stashes.length > 0 && (
        <div className="border-t py-1 max-h-[150px] overflow-auto">
          <div className="px-3 py-1 text-xs font-semibold text-muted-foreground">Stashes</div>
          {stashes.map((s) => (
            <div key={s.index} className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-accent">
              <Box className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="truncate text-xs">{s.message || `stash@{${s.index}}`}</span>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      {showBranchDialog && <BranchDialog onClose={() => setShowBranchDialog(false)} />}
      {showMergeDialog && <MergeDialog onClose={() => setShowMergeDialog(false)} />}
    </aside>
  )
}

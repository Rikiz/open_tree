import { useState, useEffect, useRef, useCallback } from 'react'
import { GitBranch, Tag, Box, Radio, Plus, RotateCcw, Trash2, Eye, GripHorizontal, Upload } from 'lucide-react'
import { useRepoStore } from '@renderer/store/repoStore'
import { git } from '@renderer/ipc'
import { BranchDialog } from '../Dialogs/BranchDialog'
import { MergeDialog } from '../Dialogs/MergeDialog'
import { StashPreviewDialog } from '../Dialogs/StashPreviewDialog'
import { TagDialog } from '../Dialogs/TagDialog'

interface TagItem { name: string; commitHash: string; isAnnotated: boolean; isSigned: boolean }
interface StashItem { index: number; message: string; branchName: string; commitHash: string }

export function Sidebar() {
  const branches = useRepoStore(s => s.branches)
  const currentBranch = useRepoStore(s => s.currentBranch)
  const checkout = useRepoStore(s => s.checkout)
  const repoPath = useRepoStore(s => s.repoPath)
  const refreshStatus = useRepoStore(s => s.refreshStatus)
  const fetchBranches = useRepoStore(s => s.fetchBranches)

  const [stashes, setStashes] = useState<StashItem[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [remoteBranches, setRemoteBranches] = useState<Array<{ name: string; headCommit: { hash: string } }>>([])
  const [activeSection, setActiveSection] = useState<'branches' | 'tags'>('branches')
  const [showBranchDialog, setShowBranchDialog] = useState(false)
  const [showMergeDialog, setShowMergeDialog] = useState(false)
  const [showTagDialog, setShowTagDialog] = useState(false)

  const [stashHeight, setStashHeight] = useState(150)
  const stashPanelRef = useRef<HTMLDivElement>(null)

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    stash: StashItem
  } | null>(null)

  const [branchContextMenu, setBranchContextMenu] = useState<{
    x: number
    y: number
    branch: string
    isCurrent: boolean
  } | null>(null)

  const [tagContextMenu, setTagContextMenu] = useState<{
    x: number
    y: number
    tag: TagItem
  } | null>(null)

  const [confirmDeleteBranch, setConfirmDeleteBranch] = useState<string | null>(null)
  const [branchError, setBranchError] = useState<string | null>(null)

  const [previewStash, setPreviewStash] = useState<StashItem | null>(null)

  const refreshStashes = useCallback(() => {
    if (!repoPath) return
    git.listStashes(repoPath)
      .then(s => setStashes(s as StashItem[]))
      .catch((err: any) => console.error('Failed to list stashes:', err.message))
    git.listTags(repoPath)
      .then(t => setTags(t as TagItem[]))
      .catch((err: any) => console.error('Failed to list tags:', err.message))
    git.listRemoteBranches(repoPath)
      .then(b => setRemoteBranches(b as Array<{ name: string; headCommit: { hash: string } }>))
      .catch(() => {})
  }, [repoPath])

  useEffect(() => {
    refreshStashes()
  }, [repoPath, currentBranch, refreshStashes])

  useEffect(() => {
    function handleClickOutside() {
      setContextMenu(null)
      setBranchContextMenu(null)
      setTagContextMenu(null)
    }
    if (contextMenu || branchContextMenu || tagContextMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu, branchContextMenu, tagContextMenu])

  async function handleCheckout(name: string) {
    try {
      await checkout(name)
    } catch {}
  }

  async function handleApply(stash: StashItem, pop: boolean) {
    if (!repoPath) return
    try {
      await git.stashApply(repoPath, stash.index, pop)
      await refreshStashes()
      await refreshStatus()
    } catch (err: any) {
      console.error('Failed to apply stash:', err.message)
    }
  }

  async function handleDrop(stash: StashItem) {
    if (!repoPath) return
    try {
      await git.stashDrop(repoPath, stash.index)
      await refreshStashes()
    } catch (err: any) {
      console.error('Failed to drop stash:', err.message)
    }
  }

  async function handleDeleteBranch(name: string, force = false) {
    if (!repoPath) return
    setBranchError(null)
    try {
      await git.deleteBranch(repoPath, name, force)
      await fetchBranches()
      setConfirmDeleteBranch(null)
    } catch (err: any) {
      setBranchError(err.message || 'Failed to delete branch')
    }
  }

  async function handlePushBranch(name: string) {
    if (!repoPath) return
    setBranchError(null)
    try {
      await git.push(repoPath, { setUpstream: true, remote: 'origin', branch: name })
      await refreshStatus()
      setBranchContextMenu(null)
    } catch (err: any) {
      setBranchError(err.message || 'Failed to push branch')
    }
  }

  async function handleCheckoutTag(tag: TagItem) {
    if (!repoPath) return
    try {
      await git.checkout(repoPath, tag.name)
      await refreshStatus()
    } catch (err: any) {
      console.error('Failed to checkout tag:', err.message)
    }
  }

  function handleDragStart(e: React.MouseEvent) {
    e.preventDefault()
    const startY = e.clientY
    const startHeight = stashPanelRef.current?.offsetHeight || stashHeight

    function onMouseMove(ev: MouseEvent) {
      const delta = startY - ev.clientY
      const newHeight = Math.max(60, Math.min(400, startHeight + delta))
      if (stashPanelRef.current) {
        stashPanelRef.current.style.height = `${newHeight}px`
      }
    }

    function onMouseUp() {
      if (stashPanelRef.current) {
        setStashHeight(parseInt(stashPanelRef.current.style.height, 10))
      }
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  function handleStashContextMenu(e: React.MouseEvent, stash: StashItem) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, stash })
  }

  function handleBranchContextMenu(e: React.MouseEvent, branch: string, isCurrent: boolean) {
    e.preventDefault()
    e.stopPropagation()
    setBranchContextMenu({ x: e.clientX, y: e.clientY, branch, isCurrent })
  }

  function handleTagContextMenu(e: React.MouseEvent, tag: TagItem) {
    e.preventDefault()
    e.stopPropagation()
    setTagContextMenu({ x: e.clientX, y: e.clientY, tag })
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

      <div className="flex-1 overflow-auto py-1 min-h-0">
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

            {/* Error display */}
            {branchError && (
              <div className="mx-2 mt-1 p-1.5 text-[10px] text-destructive bg-destructive/5 rounded">
                {branchError}
              </div>
            )}

            {/* Local branch list */}
            {branches.map((b) => (
              <div
                key={b.name}
                onClick={() => handleCheckout(b.name)}
                onContextMenu={(e) => handleBranchContextMenu(e, b.name, b.isCurrent)}
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

            {/* Remote branches */}
            {remoteBranches.length > 0 && (
              <div className="mt-1 border-t">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Remote</div>
                {remoteBranches.map((b) => (
                  <div
                    key={b.name}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground"
                  >
                    <GitBranch className="w-3 h-3 shrink-0 opacity-50" />
                    <span className="truncate flex-1 text-xs">{b.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'tags' && (
          <div>
            {/* Tag actions bar */}
            <div className="flex gap-0.5 px-2 py-1 border-b">
              <button
                onClick={() => setShowTagDialog(true)}
                className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] rounded hover:bg-accent"
              >
                <Plus className="w-3 h-3" /> Tag
              </button>
            </div>

            {/* Tag list */}
            {tags.map((t) => (
              <div
                key={t.name}
                className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-accent"
                onContextMenu={(e) => handleTagContextMenu(e, t)}
              >
                <Tag className="w-3 h-3 text-yellow-500 shrink-0" />
                <span className="truncate flex-1">{t.name}</span>
                {t.isAnnotated && (
                  <span className="text-[10px] text-muted-foreground">a</span>
                )}
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
        <>
          {/* Drag handle */}
          <div
            className="h-1.5 bg-border/40 hover:bg-primary/40 cursor-row-resize flex items-center justify-center shrink-0 group"
            onMouseDown={handleDragStart}
          >
            <GripHorizontal className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div
            ref={stashPanelRef}
            className="border-t py-1 overflow-auto shrink-0"
            style={{ height: stashHeight }}
          >
            <div className="px-3 py-1 text-xs font-semibold text-muted-foreground">Stashes</div>
            {stashes.map((s) => (
              <div
                key={s.index}
                onClick={() => setPreviewStash(s)}
                onDoubleClick={() => handleApply(s, true)}
                onContextMenu={(e) => handleStashContextMenu(e, s)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-accent select-none"
              >
                <Box className="w-3 h-3 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="truncate text-xs block">{s.message || `stash@{${s.index}}`}</span>
                  {s.branchName && (
                    <span className="text-[10px] text-muted-foreground truncate block">
                      {s.branchName}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Stash context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-[100] bg-background border rounded-md shadow-lg py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => { handleApply(contextMenu.stash, false); setContextMenu(null) }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent text-left"
            >
              <RotateCcw className="w-3 h-3" />
              Apply Stash
            </button>
            <button
              onClick={() => { handleApply(contextMenu.stash, true); setContextMenu(null) }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent text-left"
            >
              <Box className="w-3 h-3" />
              Pop Stash (Apply &amp; Drop)
            </button>
            <button
              onClick={() => { setPreviewStash(contextMenu.stash); setContextMenu(null) }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent text-left"
            >
              <Eye className="w-3 h-3" />
              View Contents
            </button>
            <div className="border-t my-1" />
            <button
              onClick={() => { handleDrop(contextMenu.stash); setContextMenu(null) }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent text-left text-destructive"
            >
              <Trash2 className="w-3 h-3" />
              Drop Stash
            </button>
          </div>
        </>
      )}

      {/* Branch context menu */}
      {branchContextMenu && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setBranchContextMenu(null)} />
          <div
            className="fixed z-[100] bg-background border rounded-md shadow-lg py-1 min-w-[180px]"
            style={{ left: branchContextMenu.x, top: branchContextMenu.y }}
          >
            {!branchContextMenu.isCurrent && (
              <button
                onClick={() => { handleCheckout(branchContextMenu.branch); setBranchContextMenu(null) }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent text-left"
              >
                <GitBranch className="w-3 h-3" />
                Checkout
              </button>
            )}
            <button
              onClick={() => { handlePushBranch(branchContextMenu.branch); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent text-left"
            >
              <Upload className="w-3 h-3" />
              Push to Origin
            </button>
            {!branchContextMenu.isCurrent && (
              <>
                <div className="border-t my-1" />
                <button
                  onClick={() => { setConfirmDeleteBranch(branchContextMenu.branch); setBranchContextMenu(null) }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent text-left text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Branch
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Tag context menu */}
      {tagContextMenu && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setTagContextMenu(null)} />
          <div
            className="fixed z-[100] bg-background border rounded-md shadow-lg py-1 min-w-[160px]"
            style={{ left: tagContextMenu.x, top: tagContextMenu.y }}
          >
            <button
              onClick={() => { handleCheckoutTag(tagContextMenu.tag); setTagContextMenu(null) }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent text-left"
            >
              <GitBranch className="w-3 h-3" />
              Checkout Tag
            </button>
          </div>
        </>
      )}

      {/* Delete branch confirmation */}
      {confirmDeleteBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-background rounded-lg shadow-xl border w-[380px]">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trash2 className="w-5 h-5 text-destructive shrink-0" />
                <h3 className="text-sm font-semibold">Delete Branch</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete branch <strong className="font-mono text-xs">{confirmDeleteBranch}</strong>?
              </p>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t">
              <button onClick={() => { setConfirmDeleteBranch(null); setBranchError(null) }} className="px-4 py-1.5 text-sm rounded-md border hover:bg-accent">
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBranch(confirmDeleteBranch)}
                className="px-4 py-1.5 text-sm rounded-md bg-destructive text-destructive-foreground hover:opacity-90"
              >
                Delete
              </button>
              <button
                onClick={() => handleDeleteBranch(confirmDeleteBranch, true)}
                className="px-4 py-1.5 text-sm rounded-md border border-destructive text-destructive hover:bg-destructive/10"
                title="Force delete even if not fully merged"
              >
                Force Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stash preview dialog */}
      {previewStash && repoPath && (
        <StashPreviewDialog
          repoPath={repoPath}
          stashIndex={previewStash.index}
          stashMessage={previewStash.message}
          onClose={() => setPreviewStash(null)}
        />
      )}

      {/* Dialogs */}
      {showBranchDialog && <BranchDialog onClose={() => setShowBranchDialog(false)} />}
      {showMergeDialog && <MergeDialog onClose={() => setShowMergeDialog(false)} />}
      {showTagDialog && <TagDialog onClose={() => setShowTagDialog(false)} />}
    </aside>
  )
}

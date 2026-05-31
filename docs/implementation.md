# Implementation Plan & Task Breakdown

## Progress Summary

```
✅ 15/15 features complete (100%)
53 tests · 0 failures · ~42 source files
```

---

## Phase 1: Scaffold & Core Git Engine
**Status**: ✅ Complete

- [x] Electron + React + Vite project
- [x] Window Manager + Preload
- [x] IPC Layer (35+ handlers)
- [x] Database (JSON)
- [x] GitService (25+ methods)

---

## Phase 2: Bookmark & Repository Window
**Status**: ✅ Complete

- [x] BookmarkWindow — repo list with name/path, hover delete
- [x] RepoWindow — toolbar, tab switching, auto-refresh
- [x] Sidebar — branches, tags, stashes
- [x] Theme system — light/dark/system

---

## Phase 3: File Status & Diff Viewer
**Status**: ✅ Complete

- [x] FileStatusView — staged/unstaged sections, batch stage/unstage
- [x] FileItem — status colors, hover actions
- [x] Diff Viewer — unified format, hunk/line coloring
- [x] CommitPanel — textarea, staged count, Cmd/Ctrl+Enter

---

## Phase 4: History & Branch Graph
**Status**: ✅ Complete

- [x] HistoryView — commit list, ref labels, infinite scroll
- [x] CommitGraph — Canvas, dagre-inspired lanes, 8-color palette
- [x] CommitDetail — click-to-expand

---

## Phase 5: Dialogs & Operations
**Status**: ✅ Complete

- [x] CloneDialog, BranchDialog, MergeDialog, PreferencesDialog

---

## Phase 6: Auth & SSH
**Status**: ✅ Complete

- [x] OAuth (GitHub/GitLab/Bitbucket), SSH key management, clipboard

---

## Phase 7: Testing
**Status**: ✅ Complete

- [x] 53 tests across 7 suites (unit + integration)

---

## Phase 8: UX Improvements (v2, 2026-05-31)
**Status**: ✅ Complete

All changes are cross-platform (macOS + Windows). No new tests added; existing 53 tests still pass.

### Bug Fixes
- [x] Untracked files staging — removed incorrect `status === '?'` guard in `FileStatusView.tsx`
- [x] `discardFile` in repoStore — fixed broken `git checkout` call; added `checkoutFile()` and `cleanFile()` to GitService + IPC pipeline

### Toolbar Additions
- [x] **Fetch** button with success/error toast (`RepoWindow.tsx`)
- [x] **Stash** button (creates stash from working tree, enabled only when changes exist)
- [x] **Push/Pull options** — dropdown arrow opens `PushPullOptionsDialog.tsx`: force-with-lease, set-upstream, rebase/ff-only

### Commit Panel
- [x] **Amend** / **Sign-off** checkboxes — wired to `git.commit --amend` / `--signoff` (`CommitPanel.tsx`, `repoStore.ts`)

### File Status
- [x] **Discard changes** — hover button + right-click context menu with confirmation dialog (`FileItem.tsx`, `FileStatusView.tsx`)
- [x] GitService: `checkoutFile(path, file)` = `git checkout -- <file>`, `cleanFile(path, file)` = `git clean -f -- <file>`

### History View
- [x] **Search bar** — debounced input with filter dropdown (All/Message/Author/File) (`HistoryView.tsx`)
- [x] repoStore: `logFilter` state + `setLogFilter` action → translates to `git log --grep/--author/--` options

### Commit Detail
- [x] **Expandable diff** — click file row to expand full diff with syntax-colored hunks (`CommitDetail.tsx`)

### Sidebar
- [x] **Branch context menu** — right-click: Checkout, Push to Origin, Delete (with confirm + force-delete) (`Sidebar.tsx`)
- [x] **Tag create dialog** — Create Tag button in tags section + right-click Checkout Tag (`TagDialog.tsx`)
- [x] **Remote branches** — listed under local branches in a "Remote" section (`GitService.listRemoteBranches`)

### Bookmark Window
- [x] **Search bar** — appears when >3 repos, filters by name/path (`BookmarkWindow.tsx`)
- [x] **Init repo** button — calls `git init` then adds bookmark (`BookmarkWindow.tsx`, `App.tsx`)

### Keyboard Shortcuts
- [x] `Cmd/Ctrl+R` — refresh status
- [x] `Cmd/Ctrl+Shift+S` — stage selected file
- [x] `Cmd/Ctrl+Shift+A` — unstage selected file
- [x] Hook: `src/renderer/hooks/useKeyboardShortcuts.ts`

### Clone Dialog
- [x] **Progress bar** — listens to `git:progress` IPC, shows stage + percentage bar (`CloneDialog.tsx`)

### New Files Created
```
src/renderer/hooks/useKeyboardShortcuts.ts
src/renderer/components/Dialogs/PushPullOptionsDialog.tsx
src/renderer/components/Dialogs/TagDialog.tsx
```

### New IPC Channels
```
git:checkoutFile, git:cleanFile, git:listRemoteBranches
```

### New GitService Methods
```
checkoutFile(repoPath, file)
cleanFile(repoPath, file)
listRemoteBranches(repoPath)
```

---

## Remaining Tasks (P2 — Low Priority)

| Task | Effort | Suggested files to touch |
|------|--------|--------------------------|
| [ ] **i18n Internationalization** | Medium | All `.tsx` files (wrap strings with `t()`), add locale files in `src/renderer/i18n/` |
| [ ] **Rebase dialog** (interactive rebase UI) | Medium | New `RebaseDialog.tsx`, add IPC: `git:rebase` |
| [ ] **Conflict resolution UI** | Large | New `ConflictDialog.tsx`, merge tool integration |
| [ ] **Side-by-side diff** | Medium | New `SideBySideDiff.tsx` |
| [ ] **File watcher** (chokidar for auto-refresh) | Small | `GitService.ts` → `watchRepo()` |
| [ ] **Menu bar** (File/Edit/View/Help) | Small | `src/main/menu/menu.ts` |
| [ ] **Drag & drop repo folder onto window** | Small | `BookmarkWindow.tsx` |

# Implementation Plan & Task Breakdown

## Progress Summary

```
✅ 13/15 features complete (87%)
53 tests · 0 failures · 39 source files
```

---

## Phase 1: Scaffold & Core Git Engine

**Status**: ✅ Complete

### Tasks

- [x] **Initialize Electron + React + Vite project**
  - `package.json`, `tsconfig.json`, `vite.config.ts`, `vite.main.config.ts`
  - `tailwind.config.ts`, `postcss.config.js`
  - `electron-builder.yml`

- [x] **Window Manager**
  - `src/main/windows/WindowManager.ts` — BookmarkWindow + RepoWindow lifecycle
  - `src/main/preload.ts` — Context bridge with typed IPC

- [x] **IPC Layer**
  - `src/main/ipc/index.ts` — 35+ IPC handlers
  - `src/shared/constants/ipcChannels.ts` — Channel name constants
  - `src/renderer/ipc/index.ts` — Client-side IPC wrapper

- [x] **Database Layer**
  - `src/main/database/index.ts` — JSON-based repository/account/settings storage

- [x] **GitService** (25+ methods)
  - `src/main/services/GitService.ts`
  
  | Method Group | Methods |
  |---|---|
  | Repository | `clone()`, `init()`, `isRepo()` |
  | Status | `status()` with porcelain v2 parser |
  | Diff | `diff()` with unified format parser |
  | Commit | `commit()`, `amend()` |
  | Log | `log()` with custom NUL-delimited format parser |
  | Branch | `listBranches()`, `createBranch()`, `deleteBranch()`, `checkout()` |
  | Remote | `push()`, `pull()`, `fetch()` |
  | Merge | `merge()` with conflict detection |
  | Stash | `stash()`, `listStashes()` |
  | Tag | `createTag()`, `listTags()` |
  | Advanced | `cherryPick()`, `reset()`, `revert()` |
  | Config | `getConfig()`, `setConfig()` |

---

## Phase 2: Bookmark & Repository Window

**Status**: ✅ Complete

### Tasks

- [x] **BookmarkWindow**
  - `src/renderer/components/BookmarkWindow/BookmarkWindow.tsx`
  - Empty state, repo list with name/path, hover-to-reveal delete

- [x] **RepoWindow**
  - `src/renderer/components/RepoWindow/RepoWindow.tsx`
  - Toolbar: Back, Pull, Push, Branch indicator, Theme toggle
  - Tab switching: File Status ↔ History
  - Auto-refresh status every 5s

- [x] **Sidebar**
  - `src/renderer/components/Sidebar/Sidebar.tsx`
  - Branches list (current branch highlighted, ahead/behind counts)
  - Tags list
  - Stashes list
  - Branch dialog + Merge dialog buttons

- [x] **Theme System**
  - `src/renderer/store/themeStore.ts` — Zustand with localStorage persistence
  - `src/renderer/components/common/ThemeToggle.tsx`
  - CSS variables: `:root` (light) + `.dark` (dark)

---

## Phase 3: File Status & Diff Viewer

**Status**: ✅ Complete

### Tasks

- [x] **FileStatusView**
  - `src/renderer/components/RepoWindow/FileStatus/FileStatusView.tsx`
  - Staged / Unstaged sections with collapsible headers
  - Batch Stage all / Unstage all

- [x] **FileItem** with actions
  - `src/renderer/components/RepoWindow/FileStatus/FileItem.tsx`
  - Status colors (M=yellow, A=green, D=red, ?=gray)
  - Hover-to-reveal Stage/Unstage button

- [x] **Diff Viewer** (unified format)
  - Displays hunks with line-level add/delete/context coloring
  - `diff-add` / `diff-del` CSS classes
  - Side-by-side layout: file list | diff content

- [x] **CommitPanel**
  - `src/renderer/components/RepoWindow/FileStatus/CommitPanel.tsx`
  - Textarea + character count + staged count
  - Disabled state: no message OR no staged files
  - Keyboard: Cmd/Ctrl+Enter to commit

---

## Phase 4: History & Branch Graph

**Status**: ✅ Complete

### Tasks

- [x] **HistoryView**
  - `src/renderer/components/RepoWindow/History/HistoryView.tsx`
  - Commit list with hash/subject/author/date
  - Ref labels (branch/tag badges)
  - "Load more" infinite scroll

- [x] **CommitGraph** (Canvas)
  - `src/renderer/components/RepoWindow/History/CommitGraph.tsx`
  - Dagre-inspired lane assignment algorithm
  - Edge curvature (direct parent-child vs spanning)
  - 8-color branch palette with lane consistency
  - Left-aligned graph + right-aligned text overlay

- [x] **CommitDetail** (click-to-expand)
  - `src/renderer/components/RepoWindow/History/CommitDetail.tsx`

---

## Phase 5: Dialogs & Operations

**Status**: ✅ Complete

### Tasks

- [x] **CloneDialog**
  - `src/renderer/components/Dialogs/CloneDialog.tsx`
  - URL input + destination path + Browse button

- [x] **BranchDialog**
  - `src/renderer/components/Dialogs/BranchDialog.tsx`
  - Name input (auto-replace spaces), starting point selector, auto-switch checkbox

- [x] **MergeDialog**
  - `src/renderer/components/Dialogs/MergeDialog.tsx`
  - Target branch selector, --no-ff / --squash options

- [x] **PreferencesDialog**
  - `src/renderer/components/Dialogs/PreferencesDialog.tsx`
  - Tabs: General / Accounts / SSH

---

## Phase 6: Auth & SSH

**Status**: ✅ Complete

### Tasks

- [x] **OAuth Authentication**
  - `src/main/services/AuthService.ts` — PKCE flow, localhost callback, token exchange
  - `src/main/services/KeychainService.ts` — Electron safeStorage encryption
  - `src/renderer/components/Dialogs/AccountsTab.tsx` — Connect/Remove UI
  - Services: GitHub, GitLab, Bitbucket (+ Enterprise URLs)

- [x] **SSH Key Management**
  - `src/main/services/SSHService.ts` — list/generate/test/copy/delete keys
  - `src/renderer/components/Dialogs/SSHTab.tsx` — Key list + generate form
  - Key types: Ed25519, RSA, ECDSA

- [x] **Clipboard Integration**
  - `ipcMain.handle('clipboard:write', ...)` — Copy public key

---

## Phase 7: Testing (Current)

**Status**: ✅ Complete

### Tasks

- [x] **Test Infrastructure**
  - `vitest.config.ts`, `tests/setup.ts` (jsdom + localStorage mock + canvas mock)

- [x] **GitService Parsers** (12 tests)
  - `tests/unit/GitService.test.ts`
  - `parseStatus()`: clean tree, modified, untracked, renamed, multiple types, empty
  - `parseLog()`: single, multiple, empty, multi-line bodies
  - `parseDiff()`: hunks, line types, line numbers, empty

- [x] **Graph Layout** (7 tests)
  - `tests/unit/CommitGraph.test.ts`
  - Single commit, parent-child, lane assignments, merge, divergence, large dataset

- [x] **Theme Store** (5 tests)
  - `tests/unit/Stores.test.ts`
  - Default, set light/dark, toggle, system preference

- [x] **Component Tests** (18 tests)
  - `BookmarkWindow.test.tsx` — empty state, list, click, delete, clone dialog
  - `CommitPanel.test.tsx` — textarea, counts, disable logic, keyboard
  - `FileItem.test.tsx` — render, selection, click, action button, status colors

- [x] **Integration Tests** (8 tests)
  - `tests/integration/git.integration.test.ts`
  - Real Git CLI: init→commit→status→branch→diff→stash→tag→cherry-pick

---

## Remaining Tasks (P2 — Low Priority)

| Task | Effort | Suggested files to touch |
|------|--------|--------------------------|
| [ ] **i18n Internationalization** | Medium | `src/renderer/globals.css`, all `.tsx` files (wrap strings with `t()`), add locale files in `src/renderer/i18n/` |
| [ ] **Rebase dialog** (interactive rebase UI) | Medium | New `src/renderer/components/Dialogs/RebaseDialog.tsx`, add IPC: `git:rebase` |
| [ ] **Conflict resolution UI** | Large | New `src/renderer/components/Dialogs/ConflictDialog.tsx`, merge tool integration |
| [ ] **Side-by-side diff** | Medium | New `src/renderer/components/RepoWindow/Diff/SideBySideDiff.tsx` |
| [ ] **File watcher** (chokidar for auto-refresh) | Small | `src/main/services/GitService.ts` → `watchRepo()` |
| [ ] **Menu bar** (File/Edit/View/Help) | Small | `src/main/menu/menu.ts` |
| [ ] **Drag & drop repo folder onto window** | Small | `src/renderer/components/BookmarkWindow/BookmarkWindow.tsx` |

# AI_CONTEXT.md

> **This file is for AI agents to quickly understand the project context before working on features or fixes.**
> For detailed specs, see `SPEC.md`, `ARCH.md`, and `docs/*.md`.

---

## 1. What is this project?

A **Git GUI desktop application** — functionally equivalent to Atlassian SourceTree.
Built with **Electron + React + TypeScript + Tailwind CSS**.

| Fact | Value |
|------|-------|
| Target | macOS 10.15+, Windows 10+ |
| Git support | Git only (no Mercurial) |
| Architecture | Electron multi-process (Main ↔ Preload ↔ Renderer) |
| State management | Zustand |
| Storage | JSON file (`opentree.json`) |
| Test framework | Vitest + React Testing Library |
| Test count | 53 tests, 7 suites, 0 failures |

---

## 2. Tech Stack (one line each)

```
Desktop:    Electron 33 (main process in Node.js, renderer in Chromium)
Frontend:   React 18 + TypeScript 5 + Tailwind CSS 3
State:      Zustand 5
Icons:      Lucide React
Build:      Vite 6 (separate configs for main + renderer)
Package:    electron-builder
Storage:    JSON file (no native modules required)
Git ops:    Node.js child_process → system Git CLI
Auth:       OAuth 2.0 PKCE (localhost callback server)
Crypto:     Electron safeStorage (keychain-backed encryption)
```

---

## 3. Process Model

```
┌──────────────────────────────────────────┐
│  Renderer (Chromium)                     │
│  • React components (no node.js access)  │
│  • Zustand stores                        │
│  • Tailwind + CSS variables (theming)    │
└──────────────┬───────────────────────────┘
               │ contextBridge (preload.ts)
               │ typed IPC (invoke/on/send)
┌──────────────▼───────────────────────────┐
│  Main (Node.js)                          │
│  • GitService   → child_process git CLI  │
│  • AuthService  → OAuth PKCE + HTTP      │
│  • SSHService   → ssh-keygen wrapper     │
│  • RepoManager  → bookmark CRUD          │
│  • Database     → JSON read/write        │
│  • WindowManager→ BrowserWindow lifecycle│
└──────────────┬───────────────────────────┘
               │ child_process.spawn
┌──────────────▼───────────────────────────┐
│  System Git CLI (must be installed)      │
└──────────────────────────────────────────┘
```

---

## 4. Key File Map (what to open for what task)

| If you need to... | Open |
|-------------------|------|
| Add a new Git operation | `src/main/services/GitService.ts` → `src/main/ipc/index.ts` |
| Add IPC channel | `src/shared/constants/ipcChannels.ts` → `src/main/ipc/index.ts` → `src/renderer/ipc/index.ts` |
| Change the UI | `src/renderer/components/*` |
| Add state | `src/renderer/store/repoStore.ts` |
| Add a dialog | `src/renderer/components/Dialogs/` (copy existing as template) |
| Add a hook | `src/renderer/hooks/` |
| Change theming | `src/renderer/globals.css` → CSS variables |
| Change window behavior | `src/main/windows/WindowManager.ts` |
| Change auth flow | `src/main/services/AuthService.ts` |
| Change SSH | `src/main/services/SSHService.ts` |
| Change storage | `src/main/database/index.ts` |
| Write tests | `tests/` — copy existing test structure |
| Repo bookmark logic | `src/main/services/RepoManager.ts` |

---

## 5. Common Commands

```bash
npm run dev            # Start dev mode (Vite HMR + Electron window)
npm run build          # Build main + renderer
npm test               # Run all 53 tests
npx vitest run tests/unit/GitService.test.ts   # Run specific suite
npm run typecheck      # TypeScript type checking (known pre-existing SSHService warnings)
npm run package:mac    # Build + create macOS .dmg
npm run package:win    # Build + create Windows .exe
```

---

## 6. State Flow for a User Action

Example: User clicks "Commit"

```
Renderer (CommitPanel.tsx)
  → useRepoStore.commit(message, { amend, signoff })
  → ipc.invoke('git:commit', { path, message, options })
  → Main Process (ipc/index.ts)
  → GitService.commit(path, message, options)
  → execFile('git', ['-C', path, 'commit', '-m', message])
  ← { hash, branch }
  → repoStore.refreshStatus()
  → ipc.invoke('git:status')
  ← StatusResult
  → UI re-renders (files clear, branch shows new ahead count)
```

---

## 7. Current Progress

| Phase | Status |
|-------|--------|
| Core Git operations (clone/commit/push/pull/branch) | ✅ Done |
| File status + stage/unstage + diff viewer | ✅ Done |
| History + branch graph (Canvas) + search/filter | ✅ Done |
| Merge/Rebase/Cherry-pick | ✅ Done |
| OAuth (GitHub/GitLab/Bitbucket) | ✅ Done |
| SSH key management | ✅ Done |
| Dark/Light theme | ✅ Done |
| Packaging (macOS DMG + Windows EXE) | ✅ Done |
| Testing (53 tests) | ✅ Done |
| UX improvements (see §8) | ✅ Done |
| i18n | ⬜ Not started |

See `docs/implementation.md` for detailed task breakdown.

---

## 8. UX Improvements (v2, 2026-05-31)

Added in a single pass. All cross-platform (macOS + Windows).

| Category | Feature | Key files |
|----------|---------|-----------|
| **Bug fix** | Untracked files can now be staged (was blocked) | `FileStatusView.tsx` |
| **Commit** | Amend / Sign-off checkboxes | `CommitPanel.tsx` |
| **Toolbar** | Fetch, Stash buttons | `RepoWindow.tsx` |
| **Push/Pull** | Options dialog (force-with-lease, set-upstream, rebase/ff-only) | `PushPullOptionsDialog.tsx` |
| **History** | Search bar with filter by message/author/file (debounced) | `HistoryView.tsx`, `repoStore.ts` (logFilter state) |
| **Files** | Discard changes (right-click + hover) with confirmation dialog | `FileItem.tsx`, `FileStatusView.tsx`, `GitService.checkoutFile/cleanFile` |
| **Sidebar** | Branch context menu (checkout/push/delete with confirmation) | `Sidebar.tsx` |
| **Sidebar** | Tag create dialog + right-click checkout | `TagDialog.tsx`, `Sidebar.tsx` |
| **Sidebar** | Remote branches listed under local branches | `GitService.listRemoteBranches`, `Sidebar.tsx` |
| **Sidebar** | Stash create (toolbar button) | `RepoWindow.tsx` |
| **Detail** | Commit detail shows expandable diff per file | `CommitDetail.tsx` |
| **Keys** | Keyboard shortcuts: Cmd/Ctrl+R refresh, +Shift+S stage, +Shift+A unstage | `useKeyboardShortcuts.ts` |
| **Clone** | Progress bar (stage + percentage) | `CloneDialog.tsx` |
| **Bookmark** | Search bar (shown when >3 repos), Init repo button | `BookmarkWindow.tsx`, `App.tsx` |

New GitService methods: `checkoutFile()`, `cleanFile()`, `listRemoteBranches()`.
New IPC channels: `git:checkoutFile`, `git:cleanFile`, `git:listRemoteBranches`.
New store state: `logFilter: { search, filterBy }`.

---

## 9. Quick Reference

| Concept | Convention |
|---------|------------|
| IPC channel names | `category:action` (e.g. `git:commit`, `auth:login`) |
| Component files | PascalCase.tsx, one component per file |
| Service files | PascalCase.ts (e.g. `GitService.ts`) |
| Store files | `*Store.ts` (e.g. `repoStore.ts`) |
| Hook files | `use*.ts` (e.g. `useKeyboardShortcuts.ts`) |
| Imports: renderer | `@renderer/*` alias |
| Imports: main | `@main/*` alias |
| Imports: shared | `@shared/*` alias |
| Git parsing separators | `\x00` (NUL byte) for fields, `\n` for records |
| Theming | CSS variables in `:root` and `.dark` |
| Dark mode toggle | `document.documentElement.classList.toggle('dark')` |
| Platform detection | `/Mac/i.test(navigator.platform)` for macOS-specific UI |

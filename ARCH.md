# OpenTree - Architecture Design

**Document Version**: 2.1
**Last Updated**: 2026-05-31

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Renderer Process (Chromium)            │
│  React 18 + TypeScript + Tailwind CSS + Zustand          │
│  Components: BookmarkWindow / RepoWindow / Dialogs       │
└────────────────────┬────────────────────────────────────┘
                     │ contextBridge (preload.ts)
                     │ invoke / on / send
┌────────────────────▼────────────────────────────────────┐
│                   Main Process (Node.js)                 │
│  ┌───────────────┐ ┌──────────────┐ ┌───────────────┐  │
│  │  GitService   │ │ AuthService  │ │  RepoManager  │  │
│  │  (child_      │ │ (OAuth PKCE  │ │  (bookmark    │  │
│  │   process)    │ │  + HTTP)     │ │   CRUD + JSON)│  │
│  └───────────────┘ └──────────────┘ └───────────────┘  │
│  ┌───────────────┐ ┌──────────────┐ ┌───────────────┐  │
│  │  SSHService   │ │KeychainSvc   │ │  Database     │  │
│  │  (ssh-keygen) │ │(safeStorage) │ │  (JSON file)  │  │
│  └───────────────┘ └──────────────┘ └───────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ child_process.spawn / execFile
┌────────────────────▼────────────────────────────────────┐
│              System Git CLI (must be installed)          │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Process Model

- **Main Process** (Node.js): Application lifecycle, service instantiation, IPC handlers, window management.
- **Renderer Process** (Chromium, sandboxed): React UI. No Node.js access. Communicates via typed IPC through preload bridge.
- **Git**: All operations delegate to the system `git` CLI via `child_process.execFile` (short-lived) or `child_process.spawn` (long-running with progress).
- **No utility process**. The main process handles everything; long git operations use async spawn with event-based progress.

---

## 2. Project Structure

```
src/
├── main/                           # Main process
│   ├── index.ts                    # App entry: WindowManager + IPC init
│   ├── preload.ts                  # contextBridge: invoke/on/send
│   ├── ipc/index.ts               # All IPC handlers (single file)
│   ├── services/
│   │   ├── GitService.ts           # Git CLI wrapper (30+ methods)
│   │   ├── AuthService.ts          # OAuth PKCE
│   │   ├── SSHService.ts           # SSH key management
│   │   ├── RepoManager.ts          # Bookmark CRUD
│   │   └── KeychainService.ts      # safeStorage token encryption
│   ├── database/index.ts           # JSON file storage
│   └── windows/WindowManager.ts    # BrowserWindow lifecycle
│
├── renderer/                       # Renderer process
│   ├── main.tsx                    # React entry
│   ├── globals.css                 # Tailwind + CSS variables
│   ├── ipc/index.ts               # Typed IPC client wrappers
│   ├── store/
│   │   ├── repoStore.ts            # Repo state + logFilter
│   │   └── themeStore.ts           # Theme state (persist)
│   ├── hooks/
│   │   └── useKeyboardShortcuts.ts # Global keyboard shortcuts
│   ├── utils/polyfills.ts
│   └── components/
│       ├── App.tsx                 # Root: routes Bookmark ↔ Repo window
│       ├── BookmarkWindow/         # Repo list + search + Clone/Add/Init
│       ├── RepoWindow/
│       │   ├── RepoWindow.tsx       # Main view: toolbar + tabs + sidebar
│       │   ├── FileStatus/         # Stage/unstage + diff + discard + commit
│       │   └── History/            # Commit list + graph + search + detail
│       ├── Sidebar/                # Branches (local+remote) / Tags / Stashes
│       ├── Dialogs/               # Clone/Branch/Merge/Tag/PushPull/Preferences
│       └── common/                # ThemeToggle, OperationToast
│
├── shared/
│   ├── constants/ipcChannels.ts    # Channel name constants
│   └── types/                      # Shared type definitions
```

---

## 3. Core Services

### 3.1 GitService

The core engine. All Git operations delegate to the system `git` CLI.

| Group | Methods |
|-------|--------|
| Repository | `clone()`, `init()`, `isRepo()` |
| Status | `status()` — parses `git status --porcelain=v2` |
| Staging | `add()`, `unstage()`, `checkoutFile()`, `cleanFile()` |
| Commit | `commit(options?)`, `commitDetail()` |
| Diff | `diff()` — unified diff with hunk/line parsing |
| Log | `log(options?)` — supports `grep`, `author`, `file` filters |
| Branch | `listBranches()`, `listRemoteBranches()`, `createBranch()`, `deleteBranch()`, `checkout()` |
| Remote | `push(options?)`, `pull(options?)`, `fetch()` |
| Merge | `merge()` with conflict detection |
| Stash | `stash()`, `listStashes()`, `stashApply()`, `stashDrop()`, `stashShow()` |
| Tag | `createTag()`, `listTags()` |
| Advanced | `cherryPick()`, `reset()`, `getConfig()`, `setConfig()` |

Git output parsing uses `\x00` (NUL byte) as field delimiter and `\n` as record delimiter.

### 3.2–3.5 AuthService, SSHService, RepoManager, KeychainService

Unchanged. See `SPEC.md` for details.

---

## 4. Storage Layer

JSON file at `<userData>/opentree.json`. The `Database` class provides a SQL-like API surface that internally operates on an in-memory JSON structure.

---

## 5. IPC Communication

### 5.1 Channel Naming

Channels follow `category:action`. All defined in `src/shared/constants/ipcChannels.ts`.

**Channel groups**:
- **repo** — list, add, remove, open
- **git** — status, clone, init, isRepo, add, unstage, commit, diff, log, commitDetail, listBranches, listRemoteBranches, createBranch, deleteBranch, checkout, checkoutFile, cleanFile, push, pull, fetch, merge, stash, listStashes, stashApply, stashDrop, stashShow, listTags, createTag, cherryPick, reset, config, setConfig, progress
- **dialog** — openDirectory, openFile, saveFile
- **settings** — get, set
- **auth** — login, getToken, listAccounts, removeAccount
- **ssh** — listKeys, generateKey, testConnection, copyPublicKey, deleteKey
- **clipboard** — write

### 5.2 Handler Registration

All IPC handlers in `src/main/ipc/index.ts`, via `registerIpcHandlers(wm)`.

### 5.3 Renderer Client

`src/renderer/ipc/index.ts` provides namespaced wrappers (`git`, `repo`, `dialog`, `auth`, `ssh`, `settings`, `clipboard`).

---

## 6. State Management (Renderer)

### 6.1 repoStore (Zustand)

- **State**: `repoPath`, `status`, `branches`, `currentBranch`, `commits`, `hasMoreCommits`, `selectedCommit`, `selectedFile`, `selectedFileDiff`, `commitMessage`, `logFilter`, `isLoading`, `error`, `isPulling`, `isPushing`
- **logFilter**: `{ search: string, filterBy: 'all' | 'message' | 'author' | 'file' }` — drives `git log --grep/--author/--` filtering
- **Actions**: `openRepo`, `closeRepo`, `refreshStatus`, `fetchBranches`, `fetchCommits`, `commit(message, options?)`, `stageFiles`, `unstageFiles`, `selectFile`, `selectCommit`, `checkout`, `push`, `pull`, `discardFile`, `setLogFilter`

### 6.2 themeStore (Zustand + persist)

Unchanged. Manages light/dark/system with localStorage persistence.

---

## 7. Window Management

Unchanged. WindowManager manages main window (1000×700) and repo windows (1400×900, singleton per path).

---

## 8. Build & Packaging

Unchanged. See §8 of previous version for details.

---

## 9. Testing

53 tests across 7 suites, all passing.

---

## 10. Security

Unchanged. Context isolation, CSP, safeStorage token encryption, argument-array git execution.

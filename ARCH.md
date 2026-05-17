# OpenTree - Architecture Design

**Document Version**: 2.0
**Last Updated**: 2026-05-16

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
opentree/
├── index.html                          # HTML entry (Vite serves in dev)
├── package.json
├── tsconfig.json
├── vite.main.config.ts                 # Vite config for main process (CJS)
├── vite.renderer.config.ts             # Vite config for renderer (ESM)
├── electron-builder.yml                # Packaging config
├── vitest.config.ts
├── tailwind.config.ts
├── postcss.config.js
│
├── src/
│   ├── main/                           # Main process
│   │   ├── index.ts                    # App entry: WindowManager + IPC init
│   │   ├── preload.ts                  # contextBridge: invoke/on/send
│   │   ├── ipc/
│   │   │   └── index.ts               # All IPC handlers (~235 lines, single file)
│   │   ├── services/
│   │   │   ├── GitService.ts           # Git CLI wrapper (25+ methods)
│   │   │   ├── AuthService.ts          # OAuth PKCE (GitHub/GitLab/Bitbucket)
│   │   │   ├── SSHService.ts           # SSH key management
│   │   │   ├── RepoManager.ts          # Bookmark CRUD
│   │   │   └── KeychainService.ts      # safeStorage token encryption
│   │   ├── database/
│   │   │   └── index.ts               # JSON file storage (opentree.json)
│   │   ├── windows/
│   │   │   └── WindowManager.ts        # BrowserWindow lifecycle
│   │   └── utils/                      # (reserved, currently empty)
│   │
│   ├── renderer/                       # Renderer process
│   │   ├── main.tsx                    # React entry, renders <App />
│   │   ├── globals.css                 # Tailwind + CSS variables (theming)
│   │   ├── ipc/
│   │   │   └── index.ts               # Typed IPC client wrappers
│   │   ├── store/
│   │   │   ├── repoStore.ts            # Repo state (Zustand)
│   │   │   └── themeStore.ts           # Theme state (Zustand + persist)
│   │   ├── hooks/                      # (reserved, currently empty)
│   │   ├── utils/
│   │   │   └── polyfills.ts            # Browser polyfills
│   │   ├── styles/                     # (reserved, currently empty)
│   │   └── components/
│   │       ├── App.tsx                 # Root: routes to Bookmark or Repo window
│   │       ├── BookmarkWindow/
│   │       │   └── BookmarkWindow.tsx  # Repo list + Clone/Add/Remove
│   │       ├── RepoWindow/
│   │       │   ├── RepoWindow.tsx       # Main repo view with toolbar + tabs
│   │       │   ├── FileStatus/
│   │       │   │   ├── FileStatusView.tsx  # Staged/unstaged file lists
│   │       │   │   ├── FileItem.tsx        # Single file row with actions
│   │       │   │   └── CommitPanel.tsx     # Commit message + submit
│   │       │   └── History/
│   │       │       ├── HistoryView.tsx     # Commit list + diff detail
│   │       │       ├── CommitGraph.tsx     # Canvas branch graph
│   │       │       └── CommitDetail.tsx    # Expanded commit diff/body
│   │       ├── Sidebar/
│   │       │   └── Sidebar.tsx         # Branches / Tags / Stashes
│   │       ├── Dialogs/
│   │       │   ├── CloneDialog.tsx      # Clone repo form
│   │       │   ├── BranchDialog.tsx     # Create/switch branch
│   │       │   ├── MergeDialog.tsx      # Merge branch with options
│   │       │   ├── PreferencesDialog.tsx # Settings modal container
│   │       │   ├── GeneralTab.tsx       # General settings
│   │       │   ├── AccountsTab.tsx      # OAuth account management
│   │       │   └── SSHTab.tsx           # SSH key management
│   │       └── common/
│   │           └── ThemeToggle.tsx      # Light/dark/system toggle
│   │
│   ├── shared/                         # Shared between processes
│   │   ├── constants/
│   │   │   └── ipcChannels.ts          # Channel name constants
│   │   └── types/
│   │       ├── index.ts                # Shared type definitions
│   │       └── electron.d.ts           # window.electronAPI type decl
│   │
│   └── assets/                         # Static assets (icons, images)
│
├── tests/
│   ├── setup.ts                        # Test globals (jsdom, mocks)
│   ├── unit/
│   │   ├── GitService.test.ts          # Status/log/diff parser tests (13)
│   │   ├── CommitGraph.test.ts         # Graph layout algorithm tests (7)
│   │   ├── Stores.test.ts             # Theme store tests (5)
│   │   └── components/
│   │       ├── BookmarkWindow.test.tsx  # Empty state, list render (5)
│   │       ├── CommitPanel.test.tsx    # Textarea, disable logic (7)
│   │       └── FileItem.test.tsx       # Status colors, actions (6)
│   ├── integration/
│   │   └── git.integration.test.ts     # Real Git CLI (8)
│   └── e2e/                            # (reserved, currently empty)
│
└── resources/                          # OS-specific assets
    ├── mac/icon.icns
    └── windows/icon.ico
```

---

## 3. Core Services

All services live in `src/main/services/` and are instantiated in `src/main/ipc/index.ts` via `registerIpcHandlers()`.

### 3.1 GitService

The core engine. All Git operations delegate to the system `git` CLI, invoked via `child_process.execFile` (for short operations) or `child_process.spawn` (for long operations with progress streams).

**Documented methods** (defined on the class):

| Group | Methods |
|-------|---------|
| Repository | `clone()`, `init()`, `isRepo()` |
| Status | `status()` — parses `git status --porcelain=v2` |
| Staging | `add()`, `unstage()`, `discardFile()` |
| Commit | `commit()`, `amend()`, `commitDetail()` |
| Diff | `diff()` — produces unified diff with hunk/line parsing |
| Log | `log()`, `diffCommitHash()` — NUL-delimited custom format |
| Branch | `listBranches()`, `createBranch()`, `deleteBranch()`, `checkout()` |
| Remote | `push()`, `pull()`, `fetch()` |
| Merge | `merge()` with conflict detection |
| Stash | `stash()`, `listStashes()` |
| Tag | `createTag()`, `listTags()` |
| Advanced | `cherryPick()`, `reset()` |

Git output parsing uses `\x00` (NUL byte) as field delimiter and `\n` as record delimiter for structured output (status, log, branches, tags, stashes).

### 3.2 AuthService

Handles OAuth 2.0 authentication with PKCE for GitHub, GitLab, and Bitbucket (including self-hosted enterprise instances).

- Starts a local HTTP callback server on port `7777`
- Opens the system browser to the provider's authorize URL
- Exchanges the authorization code for an access token via HTTPS
- Stores tokens in KeychainService (encrypted via Electron safeStorage)

### 3.3 SSHService

Manages SSH keys via the system `ssh-keygen` binary:

- `listKeys()` — scans `~/.ssh/` for key files
- `generateKey()` — spawns `ssh-keygen` to create RSA/Ed25519/ECDSA keys
- `testConnection()` — tests SSH connectivity to a host
- `copyPublicKey()` — reads the `.pub` file and copies to clipboard
- `deleteKey()` — removes both private and public key files

### 3.4 RepoManager

Bookmark CRUD backed by the Database layer:

- `addBookmark()` — validates path is a Git repo, creates bookmark record
- `removeBookmark()` — deletes bookmark from storage
- `listBookmarks()` — returns all bookmarks sorted by pinned status and last access
- `updateLastAccessed()` — updates timestamp on repo open

### 3.5 KeychainService

Wraps Electron's `safeStorage` for encrypting OAuth tokens and SSH passphrases:

- `setPassword()` — encrypts and stores in JSON database
- `getPassword()` — retrieves and decrypts
- Encryption key is backed by macOS Keychain or Windows Credential Manager

---

## 4. Storage Layer

The database is a **JSON file** at `<userData>/opentree.json` (e.g., `~/Library/Application Support/sourcetree-clone/opentree.json` on macOS).

The `Database` class (`src/main/database/index.ts`) provides a SQL-like API surface (`run`, `get`, `all`) that internally operates on an in-memory JSON structure:

- Data is loaded from disk on construction
- Mutations parse the pseudo-SQL string to identify the operation and JSON path
- Data is written to disk after each mutation
- Supported tables: `repositories`, `settings`

---

## 5. IPC Communication

### 5.1 Channel Naming

Channels follow the pattern `category:action` (e.g., `git:commit`, `auth:login`, `repo:list`). All channel names are defined as constants in `src/shared/constants/ipcChannels.ts`.

**Channel groups**:
- **repo** — list, add, remove, open
- **git** — status, clone, init, isRepo, add, unstage, commit, diff, log, commitDetail, listBranches, createBranch, deleteBranch, checkout, push, pull, fetch, merge, stash, listStashes, listTags, createTag, cherryPick, reset, config, setConfig, progress
- **dialog** — openDirectory, openFile, saveFile
- **settings** — get, set
- **auth** — login, getToken, listAccounts, removeAccount
- **ssh** — listKeys, generateKey, testConnection, copyPublicKey, deleteKey
- **clipboard** — write

### 5.2 Handler Registration

All IPC handlers are registered in a single file: `src/main/ipc/index.ts`, via the `registerIpcHandlers(wm: WindowManager)` function. This function instantiates all services once and registers all `ipcMain.handle(...)` calls.

### 5.3 Renderer Client

`src/renderer/ipc/index.ts` provides namespaced wrapper objects (`git`, `repo`, `dialog`, `auth`, `ssh`, `settings`, `clipboard`) that call `window.electronAPI.invoke()` with typed channels from the shared constants.

Long-running operations (clone, push) use `ipcRenderer.on` to subscribe to `git:progress` events.

---

## 6. State Management (Renderer)

### 6.1 repoStore (Zustand)

Manages all repository-related state:

- `repoPath`, `status`, `branches`, `currentBranch`, `commits`
- `selectedCommit`, `selectedFile`, `selectedFileDiff`
- `commitMessage`, `isLoading`, `error`
- Actions: `openRepo`, `refreshStatus`, `fetchBranches`, `fetchCommits`, `commit`, `stageFiles`, `unstageFiles`, `selectFile`, `selectCommit`, `checkout`, `push`, `pull`, `discardFile`

Stores internal type interfaces for `StatusResult`, `FileStatus`, `Branch`, `Commit`, `DiffResult`, `FileDiff`, `Hunk`, `DiffLine`.

### 6.2 themeStore (Zustand + persist)

Manages theme with localStorage persistence (`opentree-theme` key):

- State: `theme` (`light` | `dark` | `system`), `resolved` (actual applied mode)
- Actions: `setTheme`, `toggle`
- Applies dark mode by toggling the `dark` class on `document.documentElement`
- CSS variables for theming are in `src/renderer/globals.css` under `:root` (light) and `.dark` (dark)

---

## 7. Window Management

`WindowManager` (`src/main/windows/WindowManager.ts`) manages BrowserWindow lifecycle:

- **Main Window** (1000×700): Shows the bookmark list. Singleton — calling `createMainWindow()` twice focuses the existing one.
- **Repo Windows** (1400×900): One per repository, keyed by repo path. Singletons per key.
- All windows use `titleBarStyle: 'hiddenInset'` for native title bar integration
- `contextIsolation: true`, `nodeIntegration: false` (sandboxed renderer)
- In dev: loads `http://localhost:5173` (Vite HMR) and opens DevTools
- In production: loads `dist/renderer/index.html`

---

## 8. Build & Packaging

### 8.1 Development

```
npm run dev
```

Runs concurrently:
- `vite` — serves renderer on `localhost:5173` with HMR
- `electron .` — starts main process (waits for build output via `wait-on`)

`vite.main.config.ts` bundles main process TypeScript → `dist/main/index.cjs` (CJS) and preload → `dist/main/preload.cjs`. `vite.renderer.config.ts` bundles React app → `dist/renderer/`.

### 8.2 Production Build

```
npm run build          # Compile main + renderer
npm run package:mac    # Build + create macOS DMG + ZIP
npm run package:win    # Build + create Windows NSIS installer + portable
```

Uses `electron-builder` with config in `electron-builder.yml`:
- **macOS**: DMG + ZIP, x64 + arm64 universal
- **Windows**: NSIS installer + portable EXE, x64
- ASAR archive enabled

### 8.3 Path Aliases

| Alias | Target |
|-------|--------|
| `@main/*` | `src/main/*` |
| `@renderer/*` | `src/renderer/*` |
| `@shared/*` | `src/shared/*` |

---

## 9. Testing

- **Framework**: Vitest with jsdom environment
- **Setup**: `tests/setup.ts` configures jsdom + localStorage mock + Canvas mock
- **53 tests across 7 suites**:

| Suite | Tests | Scope |
|-------|-------|-------|
| `GitService.test.ts` | 13 | Status/log/diff parsers, GitError |
| `CommitGraph.test.ts` | 7 | Graph lane assignment, edge curvature |
| `Stores.test.ts` | 5 | Theme toggle, system preference, persistence |
| `BookmarkWindow.test.tsx` | 5 | Empty state, list render, click/delete |
| `CommitPanel.test.tsx` | 7 | Textarea, char count, disable logic, keyboard |
| `FileItem.test.tsx` | 6 | Status icons, colors, hover actions |
| `git.integration.test.ts` | 8 | Real Git: init→commit→status→branch→diff→stash→tag→cherry-pick |

---

## 10. Security

- **Context isolation**: Renderer has no Node.js access, only `window.electronAPI` bridge
- **CSP**: `Content-Security-Policy` in `index.html` restricts script/style/img/connect sources
- **Token storage**: OAuth tokens encrypted via Electron `safeStorage` (macOS Keychain / Windows Credential Manager)
- **Git execution**: Arguments passed as arrays to `child_process.execFile` (no shell injection)
- **No native modules**: JSON file storage avoids native compilation complexity

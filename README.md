# OpenTree

A powerful, free Git GUI client — **OpenTree** built with **Electron + React + TypeScript + Tailwind CSS**.

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows-blue" alt="Platforms">
  <img src="https://img.shields.io/badge/tests-53%20passed-brightgreen" alt="Tests">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0-brightgreen" alt="Node">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

---

## Features

| Category | Features |
|----------|----------|
| **Repository** | Clone, Init, Add existing, Bookmarks |
| **File Status** | Stage/Unstage files, Diff viewer (unified), Hunk-level changes |
| **Commit** | Commit with message, Amend, Sign-off, GPG signing |
| **History** | Commit list with **branch graph visualization** (Canvas), Search |
| **Branch** | Create, Switch, Delete, Rename, Merge (--no-ff, --squash) |
| **Remote** | Push (force-with-lease), Pull (merge/rebase/ff-only), Fetch |
| **Advanced** | Stash (push/pop/list), Tag (annotated/lightweight), Cherry-pick, Reset |
| **Auth** | OAuth (GitHub / GitLab / Bitbucket), SSH key management |
| **UI** | Dark/Light theme, System preference detection, Sidebar, Settings |

---

## Screenshots

```
┌─────────────────────────────────────────────────────────────┐
│  OpenTree                    [☀] [⚙️] [Clone] [Add] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📁 myproject                  /home/repos/myproject    🗑️  │
│  📁 lib                        /home/repos/lib          🗑️  │
│  📁 opentree           ~/work/opentree        🗑️  │
│                                                             │
│  No repositories yet  →  Clone Repository / Add Existing   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ [←] [Status] [History] [Pull] [Push]     [☀] ↑2 ↓1 2s 5c │
├──────────┬──────────────────────────────────────────────────┤
│ Branches │ Unstaged Files (3)         │ Diff View          │
│  ● main  │  M  src/app.ts    [Stage]  │ @@ -1,3 +1,5 @@   │
│    dev   │  A  src/new.ts    [Stage]  │  import React      │
│  feat/.. │  ?  README.md              │ +import { new }    │
│ ──────── │ ───────────────── │ -old line                   │
│ Tags     │ Staged Files (2)           │                     │
│  v1.0.0  │  M  package.json [Unstage] │                     │
│ ──────── │  M  tsconfig.json          │                     │
│ Stashes  │ ──────────────────────────│                     │
│  stash@{0}│ Commit: feat: add login   │                     │
│          │         [Commit (5 files)] │                     │
└──────────┴──────────────────────────────────────────────────┘
```

---

## macOS Installation

### Prerequisites

- **Node.js** >= 18.0 (recommended: 20 LTS)
- **Git** >= 2.30
- **macOS** >= 10.15 (Catalina)

### Step 1: Install Node.js

```bash
# Using Homebrew (recommended)
brew install node@20

# Or download from https://nodejs.org
```

### Step 2: Clone & Install

```bash
git clone https://github.com/Rikiz/open_tree.git
cd open_tree
npm install
```

### Step 3: Build & Run

#### Development mode (with hot-reload)

```bash
npm run dev
```

This starts:
- Vite dev server at `http://localhost:5173` (HMR)
- Electron window with DevTools open

#### Production build

```bash
npm run build          # Compile TypeScript + bundle renderer
npm run package:mac    # Generate .dmg installer
```

The `.dmg` file will be created in `release/`.

### Step 4: Install from DMG

1. Open `release/OpenTree-*.dmg`
2. Drag the app icon to `/Applications`
3. Launch from Applications or Spotlight

---

## Windows Installation

### Prerequisites

- **Node.js** >= 18.0 (recommended: 20 LTS)
- **Git** >= 2.30 (Git for Windows)
- **Windows** 10 or later (x64)

### Step 1: Install Node.js and Git

```powershell
# Download and install:
# Node.js: https://nodejs.org (LTS version)
# Git:     https://git-scm.com/download/win
```

Verify installation:
```powershell
node --version   # Should be >= 18.0
npm --version    # Should be >= 9.0
git --version    # Should be >= 2.30
```

### Step 2: Clone & Install

```powershell
git clone https://github.com/Rikiz/open_tree.git
cd open_tree
npm install
```

> **Note**: If `npm install` fails with native module errors, run as Administrator.

### Step 3: Build & Run

#### Development mode

```powershell
npm run dev
```

#### Production build

```powershell
npm run build           # Compile TypeScript + bundle renderer
npm run package:win     # Generate .exe installer (NSIS)
```

The installer will be created in `release/`:
- `OpenTree Setup-*.exe` — NSIS installer
- `OpenTree-*-portable.exe` — Portable version

### Step 4: Install from EXE

1. Run `OpenTree Setup-*.exe`
2. Choose installation directory
3. Check "Create desktop shortcut"
4. Click Install

---

## Quick Start (Both Platforms)

After launching the app:

```
1. Click "Add" → Browse to an existing Git repository
2. Or click "Clone" → Enter a repository URL
3. Double-click a repo to open

In the repo view:
  - Left panel: Branches, Tags, Stashes
  - Center: File Status (staged/unstaged) or History
  - Right: Diff viewer
  - Bottom: Commit message input

Shortcuts:
  Cmd/Ctrl+Enter  → Commit
  Click file      → View diff
  Hover file      → Stage/Unstage buttons
```

---

## Development

### Project Structure

```
open_tree/
├── src/
│   ├── main/                          # Electron main process
│   │   ├── index.ts                   # App entry point
│   │   ├── preload.ts                 # Context bridge
│   │   ├── ipc/index.ts               # IPC handlers (35+)
│   │   ├── services/
│   │   │   ├── GitService.ts          # Git engine (25+ methods)
│   │   │   ├── AuthService.ts         # OAuth (GitHub/GitLab/Bitbucket)
│   │   │   ├── SSHService.ts          # SSH key management
│   │   │   ├── RepoManager.ts         # Repository bookmarks
│   │   │   └── KeychainService.ts     # Secure token storage
│   │   ├── database/index.ts          # JSON storage
│   │   └── windows/WindowManager.ts   # Window lifecycle
│   │
│   ├── renderer/                      # React frontend
│   │   ├── main.tsx                   # React entry
│   │   ├── components/
│   │   │   ├── App.tsx                # Root component
│   │   │   ├── BookmarkWindow/        # Repo list view
│   │   │   ├── RepoWindow/           # Main repo view
│   │   │   │   ├── FileStatus/        # Stage/unstage + diff
│   │   │   │   └── History/           # Commit list + graph
│   │   │   ├── Sidebar/               # Branches/Tags/Stashes
│   │   │   └── Dialogs/               # Clone/Merge/Branch/Settings
│   │   ├── store/                     # Zustand state management
│   │   │   ├── repoStore.ts           # Repo state
│   │   │   └── themeStore.ts          # Theme state
│   │   └── ipc/index.ts              # IPC client
│   │
│   └── shared/                        # Shared types & constants
│
├── tests/
│   ├── unit/                          # Unit tests (45 tests)
│   │   ├── GitService.test.ts         # Parser tests
│   │   ├── CommitGraph.test.ts       # Graph layout tests
│   │   ├── Stores.test.ts            # State management tests
│   │   └── components/               # Component tests
│   └── integration/                  # Integration tests (8 tests)
│       └── git.integration.test.ts   # Real Git CLI tests
│
├── SPEC.md                            # Product specification
├── ARCH.md                            # Architecture design
└── README.md                          # This file
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev mode (Vite HMR + Electron) |
| `npm run build` | Build main + renderer |
| `npm run package:mac` | Build + create macOS DMG |
| `npm run package:win` | Build + create Windows EXE |
| `npm test` | Run all tests |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | ESLint |

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Electron 33 |
| Frontend | React 18 + TypeScript 5 |
| Styling | Tailwind CSS 3 + CSS Variables |
| State | Zustand |
| Icons | Lucide React |
| Build | Vite 6 |
| Testing | Vitest + Testing Library |
| Packaging | electron-builder |
| Storage | JSON file |
| Git | Child process (local Git CLI) |

### Running Tests

```bash
# Run all tests
npm test

# Run specific suite
npx vitest run tests/unit/GitService.test.ts

# Watch mode
npm run test:watch
```

---

## Architecture

The application follows Electron's **multi-process model**:

```
┌─────────────────────────┐
│   Renderer Process      │  React + Tailwind CSS
│   (UI)                  │  Zustand Store
└──────────┬──────────────┘
           │ contextBridge (IPC)
┌──────────▼──────────────┐
│   Main Process          │  Node.js
│   (Backend)             │  GitService, AuthService
└──────────┬──────────────┘
           │ child_process
┌──────────▼──────────────┐
│   Git CLI               │  System Git executable
└─────────────────────────┘
```

- **Renderer**: Sandboxed, no Node.js access
- **Preload**: Exposes typed API via `contextBridge`
- **Main**: Runs Git operations, manages windows, handles OAuth
- **Storage**: JSON file at `~/Library/Application Support/sourcetree-clone/opentree.json` (macOS) or `%APPDATA%/sourcetree-clone/opentree.json` (Windows)

---

## License

MIT

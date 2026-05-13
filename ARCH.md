# SourceTree Clone - Architecture Design

**Document Version**: 1.0  
**Last Updated**: 2026-05-10  

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
│                    (Electron Renderer Process)                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  React Components                                          │ │
│  │  ├── Windows (Bookmark, Repo)                             │ │
│  │  ├── Views (FileStatus, History, Diff)                    │ │
│  │  ├── Sidebar (Branches, Tags, Remotes)                    │ │
│  │  └── Dialogs (Clone, Push, Pull, Merge...)                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ▲                                   │
│                              │ IPC (Electron)                    │
│                              ▼                                   │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                        Core Services                             │
│                    (Electron Main Process)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ GitService   │  │ AuthService  │  │ RepoManager  │          │
│  │              │  │              │  │              │          │
│  │ - clone()    │  │ - OAuth      │  │ - bookmarks  │          │
│  │ - commit()   │  │ - SSH keys   │  │ - recent     │          │
│  │ - push()     │  │ - tokens     │  │ - metadata   │          │
│  │ - pull()     │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Git CLI (child_process)                                   │ │
│  │  - Spawns git commands                                     │ │
│  │  - Parses output                                           │ │
│  │  - Handles auth requests                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                         Data Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   SQLite     │  │   Keychain   │  │ File System  │          │
│  │              │  │              │  │              │          │
│  │ - bookmarks  │  │ - tokens     │  │ - .git       │          │
│  │ - accounts   │  │ - passwords  │  │ - config     │          │
│  │ - settings   │  │ - SSH keys   │  │ - repos      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Process Model

Electron follows a multi-process architecture:

- **Main Process** (Node.js): 
  - Manages application lifecycle
  - Creates/destroys windows
  - Handles native OS integrations
  - Runs background services
  - Executes Git commands
  - Manages database (SQLite)

- **Renderer Process** (Chromium):
  - Runs React UI
  - Communicates with main process via IPC
  - No direct file system access (security)

- **Utility Process** (optional):
  - Used for heavy Git operations
  - Prevents main process blocking

---

## 2. Project Structure

```
sourcetree-clone/
├── package.json
├── tsconfig.json
├── vite.main.config.ts
├── vite.renderer.config.ts
│
├── electron-builder.yml              # Build configuration
│
├── src/
│   ├── main/                         # Main process (Node.js)
│   │   ├── index.ts                  # Entry point
│   │   ├── ipc/                      # IPC handlers
│   │   │   ├── index.ts
│   │   │   ├── git.ts                # Git operation handlers
│   │   │   ├── repo.ts               # Repository handlers
│   │   │   ├── auth.ts               # Auth handlers
│   │   │   └── settings.ts           # Settings handlers
│   │   │
│   │   ├── services/                 # Core services
│   │   │   ├── GitService.ts         # Git operations
│   │   │   ├── AuthService.ts        # OAuth, SSH
│   │   │   ├── RepoManager.ts        # Repo discovery
│   │   │   ├── KeychainService.ts    # Secure storage
│   │   │   └── UpdateService.ts      # Auto-updates
│   │   │
│   │   ├── database/                 # SQLite
│   │   │   ├── index.ts
│   │   │   ├── migrations/
│   │   │   └── repositories/
│   │   │       ├── BookmarkRepo.ts
│   │   │       ├── AccountRepo.ts
│   │   │       └── SettingsRepo.ts
│   │   │
│   │   ├── windows/                  # Window management
│   │   │   ├── WindowManager.ts
│   │   │   ├── BookmarkWindow.ts
│   │   │   └── RepoWindow.ts
│   │   │
│   │   ├── menu/                     # App menu
│   │   │   └── menu.ts
│   │   │
│   │   └── utils/
│   │       ├── gitParser.ts          # Parse Git output
│   │       └── pathUtils.ts
│   │
│   ├── renderer/                     # Renderer process (React)
│   │   ├── index.html
│   │   ├── main.tsx                  # Entry point
│   │   │
│   │   ├── store/                    # State management (Zustand)
│   │   │   ├── index.ts
│   │   │   ├── repoStore.ts          # Repo state
│   │   │   ├── settingsStore.ts      # Settings state
│   │   │   └── uiStore.ts            # UI state
│   │   │
│   │   ├── hooks/                    # Custom hooks
│   │   │   ├── useRepo.ts
│   │   │   ├── useGit.ts
│   │   │   ├── useIpc.ts
│   │   │   └── useKeyboard.ts
│   │   │
│   │   ├── components/               # React components
│   │   │   ├── App.tsx
│   │   │   ├── Layout/
│   │   │   │   ├── Toolbar.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── StatusBar.tsx
│   │   │   │   └── SplitPane.tsx
│   │   │   │
│   │   │   ├── BookmarkWindow/
│   │   │   │   ├── BookmarkWindow.tsx
│   │   │   │   ├── RepoList.tsx
│   │   │   │   └── RepoListItem.tsx
│   │   │   │
│   │   │   ├── RepoWindow/
│   │   │   │   ├── RepoWindow.tsx
│   │   │   │   ├── FileStatus/
│   │   │   │   │   ├── FileStatusView.tsx
│   │   │   │   │   ├── FileList.tsx
│   │   │   │   │   ├── FileItem.tsx
│   │   │   │   │   └── CommitPanel.tsx
│   │   │   │   │
│   │   │   │   ├── History/
│   │   │   │   │   ├── HistoryView.tsx
│   │   │   │   │   ├── CommitGraph.tsx
│   │   │   │   │   ├── CommitList.tsx
│   │   │   │   │   └── CommitDetail.tsx
│   │   │   │   │
│   │   │   │   └── Diff/
│   │   │   │       ├── DiffView.tsx
│   │   │   │       ├── UnifiedDiff.tsx
│   │   │   │       ├── SideBySideDiff.tsx
│   │   │   │       └── ImageDiff.tsx
│   │   │   │
│   │   │   ├── Sidebar/
│   │   │   │   ├── BranchesSection.tsx
│   │   │   │   ├── TagsSection.tsx
│   │   │   │   ├── StashesSection.tsx
│   │   │   │   ├── RemotesSection.tsx
│   │   │   │   └── SubmodulesSection.tsx
│   │   │   │
│   │   │   ├── Dialogs/
│   │   │   │   ├── CloneDialog.tsx
│   │   │   │   ├── InitDialog.tsx
│   │   │   │   ├── PushDialog.tsx
│   │   │   │   ├── PullDialog.tsx
│   │   │   │   ├── MergeDialog.tsx
│   │   │   │   ├── RebaseDialog.tsx
│   │   │   │   ├── BranchDialog.tsx
│   │   │   │   ├── TagDialog.tsx
│   │   │   │   ├── StashDialog.tsx
│   │   │   │   ├── ConflictDialog.tsx
│   │   │   │   └── PreferencesDialog.tsx
│   │   │   │
│   │   │   └── common/               # Reusable components
│   │   │       ├── Button.tsx
│   │   │       ├── Input.tsx
│   │   │       ├── Select.tsx
│   │   │       ├── Modal.tsx
│   │   │       ├── Tooltip.tsx
│   │   │       ├── ContextMenu.tsx
│   │   │       ├── Dropdown.tsx
│   │   │       ├── VirtualList.tsx
│   │   │       └── Icons.tsx
│   │   │
│   │   ├── ipc/                      # IPC client
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── format.ts
│   │   │   ├── clipboard.ts
│   │   │   └── platform.ts
│   │   │
│   │   └── styles/
│   │       ├── globals.css
│   │       ├── themes/
│   │       │   ├── light.css
│   │       │   └── dark.css
│   │       └── components/
│   │
│   ├── shared/                       # Shared between processes
│   │   ├── types/                    # TypeScript definitions
│   │   │   ├── git.ts
│   │   │   ├── repo.ts
│   │   │   ├── auth.ts
│   │   │   └── ipc.ts
│   │   │
│   │   └── constants/
│   │       ├── ipcChannels.ts
│   │       └── defaults.ts
│   │
│   └── assets/                       # Static assets
│       ├── icons/
│       └── images/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── resources/                        # OS resources
    ├── mac/
    │   └── icon.icns
    └── windows/
        └── icon.ico
```

---

## 3. Core Services

### 3.1 GitService

GitService is the heart of the application, responsible for all Git operations.

```typescript
// src/main/services/GitService.ts
import { execFile, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execFileAsync = promisify(execFile);

export interface GitServiceOptions {
  gitPath: string;           // Path to git binary
  env?: NodeJS.ProcessEnv;   // Environment variables
}

export class GitService {
  private gitPath: string;
  private env: NodeJS.ProcessEnv;
  private activeProcesses: Map<string, ChildProcess> = new Map();

  constructor(options: GitServiceOptions) {
    this.gitPath = options.gitPath || 'git';
    this.env = { ...process.env, ...options.env };
  }

  // === Core Execution ===

  /**
   * Execute a Git command and return output
   */
  private async exec(
    repoPath: string,
    args: string[],
    options?: { input?: string; timeout?: number }
  ): Promise<{ stdout: string; stderr: string }> {
    const defaultArgs = ['-C', repoPath];
    const fullArgs = [...defaultArgs, ...args];

    try {
      const result = await execFileAsync(this.gitPath, fullArgs, {
        env: this.env,
        maxBuffer: 50 * 1024 * 1024, // 50MB
        timeout: options?.timeout || 300000, // 5 min default
        input: options?.input,
      });
      return result;
    } catch (error: any) {
      throw new GitError(
        error.message,
        error.code,
        error.stdout,
        error.stderr
      );
    }
  }

  /**
   * Spawn a long-running Git command with progress callbacks
   */
  private spawn(
    repoPath: string,
    args: string[],
    onProgress: (data: string) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const defaultArgs = ['-C', repoPath];
      const fullArgs = [...defaultArgs, ...args];

      const proc = spawn(this.gitPath, fullArgs, {
        env: this.env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const processId = `${Date.now()}-${Math.random()}`;
      this.activeProcesses.set(processId, proc);

      proc.stdout.on('data', (data) => {
        onProgress(data.toString());
      });

      proc.stderr.on('data', (data) => {
        onProgress(data.toString());
      });

      proc.on('close', (code) => {
        this.activeProcesses.delete(processId);
        if (code === 0) {
          resolve();
        } else {
          reject(new GitError(`Git exited with code ${code}`, code));
        }
      });

      proc.on('error', (error) => {
        this.activeProcesses.delete(processId);
        reject(error);
      });
    });
  }

  // === Repository ===

  async clone(
    url: string,
    destPath: string,
    options: CloneOptions,
    onProgress?: (progress: CloneProgress) => void
  ): Promise<string> {
    const args = ['clone', '--progress'];

    if (options.depth) {
      args.push('--depth', String(options.depth));
    }
    if (options.branch) {
      args.push('--branch', options.branch);
    }
    if (options.recursive) {
      args.push('--recursive');
    }
    if (options.singleBranch) {
      args.push('--single-branch');
    }

    args.push(url, destPath);

    await this.spawn(destPath, args, (data) => {
      if (onProgress) {
        const progress = this.parseCloneProgress(data);
        if (progress) onProgress(progress);
      }
    });

    return destPath;
  }

  private parseCloneProgress(data: string): CloneProgress | null {
    // Parse Git's progress output
    // Example: "Receiving objects: 50% (1234/2468)"
    const match = data.match(/(\w+):\s+(\d+)%\s+\((\d+)\/(\d+)\)/);
    if (match) {
      return {
        stage: match[1],
        progress: parseInt(match[2]),
        current: parseInt(match[3]),
        total: parseInt(match[4]),
      };
    }
    return null;
  }

  async init(path: string, options: InitOptions = {}): Promise<void> {
    const args = ['init'];
    if (options.branch) {
      args.push('--initial-branch', options.branch);
    }
    if (options.bare) {
      args.push('--bare');
    }
    args.push(path);

    await this.exec(path, args);
  }

  async isRepo(path: string): Promise<boolean> {
    try {
      await this.exec(path, ['rev-parse', '--git-dir']);
      return true;
    } catch {
      return false;
    }
  }

  // === Status ===

  async status(path: string): Promise<StatusResult> {
    const args = [
      'status',
      '--porcelain=v2',
      '--branch',
      '--renames',
    ];
    
    const { stdout } = await this.exec(path, args);
    return this.parseStatus(stdout);
  }

  private parseStatus(output: string): StatusResult {
    // Parse porcelain v2 status format
    const lines = output.split('\n');
    const files: FileStatus[] = [];
    let branch = '';
    let trackingBranch: string | undefined;
    let ahead = 0;
    let behind = 0;

    for (const line of lines) {
      if (line.startsWith('# branch.head')) {
        branch = line.split(' ')[2];
      } else if (line.startsWith('# branch.upstream')) {
        trackingBranch = line.split(' ')[2];
      } else if (line.startsWith('# branch.ab')) {
        const [fwd, rev] = line.split(' ').slice(2).map(Number);
        ahead = fwd;
        behind = Math.abs(rev);
      } else if (line.match(/^[12u]/)) {
        files.push(this.parseStatusLine(line));
      }
    }

    return {
      files,
      staged: files.filter(f => f.staged).length,
      unstaged: files.filter(f => !f.staged && f.status !== 'untracked').length,
      untracked: files.filter(f => f.status === 'untracked').length,
      conflicts: files.filter(f => f.status === 'unmerged').length,
      ahead,
      behind,
      branch,
      trackingBranch,
    };
  }

  // === Diff ===

  async diff(
    path: string,
    options: DiffOptions = {}
  ): Promise<DiffResult> {
    const args = ['diff'];

    if (options.staged) {
      args.push('--cached');
    }
    if (options.commit) {
      args.push(options.commit);
      if (options.commitCompare) {
        args.push(options.commitCompare);
      }
    }
    if (options.ignoreWhitespace) {
      args.push('-w');
    }
    if (options.contextLines !== undefined) {
      args.push(`-U${options.contextLines}`);
    }
    if (options.file) {
      args.push('--', options.file);
    }

    args.push('--no-color', '--patch-with-raw');

    const { stdout } = await this.exec(path, args);
    return this.parseDiff(stdout);
  }

  private parseDiff(output: string): DiffResult {
    // Parse unified diff format
    // Implementation handles:
    // - File headers (--- a/file, +++ b/file)
    // - Hunk headers (@@ -l,s +l,s @@)
    // - Lines (+, -, space)
    const files: FileDiff[] = [];
    // ... parsing logic
    return { files, raw: output };
  }

  // === Staging ===

  async add(path: string, files: string[]): Promise<void> {
    if (files.length === 0) return;
    await this.exec(path, ['add', '--', ...files]);
  }

  async addInteractive(
    path: string,
    file: string,
    patches: PatchData[]
  ): Promise<void> {
    // Apply specific patches using git apply --cached
    const patch = this.buildPatch(patches);
    await this.exec(path, ['apply', '--cached'], { input: patch });
  }

  async reset(path: string, files: string[]): Promise<void> {
    if (files.length === 0) return;
    await this.exec(path, ['reset', 'HEAD', '--', ...files]);
  }

  // === Commit ===

  async commit(
    path: string,
    message: string,
    options: CommitOptions = {}
  ): Promise<CommitResult> {
    const args = ['commit'];
    
    if (options.amend) {
      args.push('--amend');
    }
    if (options.signoff) {
      args.push('--signoff');
    }
    if (options.gpgSign) {
      args.push('-S');
    }
    if (options.noVerify) {
      args.push('--no-verify');
    }
    if (options.author) {
      args.push('--author', `${options.author.name} <${options.author.email}>`);
    }

    args.push('-m', message);

    await this.exec(path, args);

    // Get the new commit hash
    const { stdout } = await this.exec(path, ['rev-parse', 'HEAD']);
    return {
      hash: stdout.trim(),
      branch: await this.currentBranch(path),
    };
  }

  // === Log ===

  async log(path: string, options: LogOptions = {}): Promise<Commit[]> {
    const args = [
      'log',
      '--pretty=format:%H%x00%h%x00%an%x00%ae%x00%at%x00%s%x00%b%x00%D',
      '--no-color',
    ];

    if (options.maxCount) {
      args.push(`-n${options.maxCount}`);
    }
    if (options.skip) {
      args.push(`--skip=${options.skip}`);
    }
    if (options.since) {
      args.push(`--since=${options.since.toISOString()}`);
    }
    if (options.until) {
      args.push(`--until=${options.until.toISOString()}`);
    }
    if (options.author) {
      args.push(`--author=${options.author}`);
    }
    if (options.grep) {
      args.push(`--grep=${options.grep}`);
    }
    if (options.file) {
      args.push('--', options.file);
    }

    const { stdout } = await this.exec(path, args);
    return this.parseLog(stdout);
  }

  private parseLog(output: string): Commit[] {
    // Parse custom log format
    // Format: %H\0%h\0%an\0%ae\0%at\0%s\0%b\0%D
    const commits: Commit[] = [];
    const entries = output.split('\n').filter(Boolean);

    for (const entry of entries) {
      const parts = entry.split('\0');
      if (parts.length >= 7) {
        commits.push({
          hash: parts[0],
          shortHash: parts[1],
          message: parts[5],
          subject: parts[5].split('\n')[0],
          body: parts[6],
          author: {
            name: parts[2],
            email: parts[3],
          },
          date: new Date(parseInt(parts[4]) * 1000),
          parents: [], // Will be populated separately
          refs: parts[7] ? parts[7].split(', ') : [],
          treeHash: '',
        });
      }
    }

    return commits;
  }

  // === Branch ===

  async listBranches(path: string): Promise<Branch[]> {
    const args = [
      'for-each-ref',
      '--format=%(refname:short)%00%(objectname)%00%(upstream:short)%00%(upstream:track)',
      'refs/heads/',
    ];

    const { stdout } = await this.exec(path, args);
    const branches: Branch[] = [];
    const currentBranch = await this.currentBranch(path);

    const lines = stdout.split('\n').filter(Boolean);
    for (const line of lines) {
      const [name, hash, upstream, track] = line.split('\0');
      const ahead = this.parseTrackCount(track, 'ahead');
      const behind = this.parseTrackCount(track, 'behind');

      branches.push({
        name,
        headCommit: { hash } as Commit,
        upstream,
        isCurrent: name === currentBranch,
        isRemote: false,
        ahead,
        behind,
        lastCommitDate: new Date(),
      });
    }

    return branches;
  }

  private parseTrackCount(track: string, direction: 'ahead' | 'behind'): number {
    const match = track.match(new RegExp(`${direction} (\\d+)`));
    return match ? parseInt(match[1]) : 0;
  }

  async createBranch(
    path: string,
    name: string,
    options: BranchOptions = {}
  ): Promise<void> {
    const args = ['branch', name];
    
    if (options.startPoint) {
      args.push(options.startPoint);
    }

    await this.exec(path, args);

    if (options.checkout) {
      await this.checkout(path, name);
    }
  }

  async checkout(path: string, ref: string, options: CheckoutOptions = {}): Promise<void> {
    const args = ['checkout'];

    if (options.createBranch) {
      args.push('-b', options.createBranch);
    }
    if (options.force) {
      args.push('-f');
    }

    args.push(ref);

    await this.exec(path, args);
  }

  async currentBranch(path: string): Promise<string> {
    const { stdout } = await this.exec(path, ['rev-parse', '--abbrev-ref', 'HEAD']);
    return stdout.trim();
  }

  // === Push & Pull ===

  async push(
    path: string,
    options: PushOptions = {},
    onProgress?: (progress: PushProgress) => void
  ): Promise<PushResult> {
    const args = ['push'];

    if (options.force) {
      args.push('--force');
    }
    if (options.forceWithLease) {
      args.push('--force-with-lease');
    }
    if (options.setUpstream && options.remote && options.branch) {
      args.push('-u', options.remote, options.branch);
    }
    if (options.all) {
      args.push('--all');
    }
    if (options.tags) {
      args.push('--tags');
    }

    args.push('--progress');

    await this.spawn(path, args, (data) => {
      if (onProgress) {
        const progress = this.parsePushProgress(data);
        if (progress) onProgress(progress);
      }
    });

    return {
      remote: options.remote || 'origin',
      branch: options.branch || await this.currentBranch(path),
      updated: true,
    };
  }

  async pull(
    path: string,
    options: PullOptions = {}
  ): Promise<PullResult> {
    const args = ['pull'];

    if (options.rebase) {
      args.push('--rebase');
    }
    if (options.fastForwardOnly) {
      args.push('--ff-only');
    }
    if (options.noFastForward) {
      args.push('--no-ff');
    }

    if (options.remote) {
      args.push(options.remote);
      if (options.branch) {
        args.push(options.branch);
      }
    }

    await this.exec(path, args);

    return {
      fetchedCommits: 0,
      fastForward: false,
      conflicts: [],
      merged: [],
    };
  }

  async fetch(
    path: string,
    remote?: string,
    options: FetchOptions = {}
  ): Promise<FetchResult> {
    const args = ['fetch'];

    if (options.prune) {
      args.push('--prune');
    }
    if (options.tags) {
      args.push('--tags');
    }

    args.push(remote || '--all');

    await this.exec(path, args);

    return {
      remote: remote || 'all',
      branches: [],
      newBranches: [],
      deletedBranches: [],
    };
  }

  // === Merge ===

  async merge(
    path: string,
    branch: string,
    options: MergeOptions = {}
  ): Promise<MergeResult> {
    const args = ['merge', branch];

    if (options.noFastForward) {
      args.push('--no-ff');
    }
    if (options.fastForwardOnly) {
      args.push('--ff-only');
    }
    if (options.squash) {
      args.push('--squash');
    }
    if (options.noCommit) {
      args.push('--no-commit');
    }
    if (options.message) {
      args.push('-m', options.message);
    }

    try {
      await this.exec(path, args);
      return { fastForward: false, conflicts: [], merged: [branch] };
    } catch (error) {
      // Check for conflicts
      const status = await this.status(path);
      return {
        fastForward: false,
        conflicts: status.files.filter(f => f.status === 'unmerged').map(f => f.path),
        merged: [],
      };
    }
  }

  // === Stash ===

  async stash(path: string, message?: string, options: StashOptions = {}): Promise<void> {
    const args = ['stash', 'push'];

    if (message) {
      args.push('-m', message);
    }
    if (options.includeUntracked) {
      args.push('-u');
    }
    if (options.keepIndex) {
      args.push('-k');
    }

    await this.exec(path, args);
  }

  async listStashes(path: string): Promise<StashEntry[]> {
    const args = ['stash', 'list', '--format=%gd%x00%gs%x00%h'];

    const { stdout } = await this.exec(path, args);
    const stashes: StashEntry[] = [];
    const lines = stdout.split('\n').filter(Boolean);

    for (const line of lines) {
      const [ref, message, hash] = line.split('\0');
      const match = ref.match(/stash@\{(\d+)\}/);
      if (match) {
        stashes.push({
          index: parseInt(match[1]),
          message,
          branchName: '',
          commitHash: hash,
          date: new Date(),
        });
      }
    }

    return stashes;
  }

  // === Tag ===

  async listTags(path: string): Promise<Tag[]> {
    const args = [
      'for-each-ref',
      '--format=%(refname:short)%00%(objectname)%00%(objecttype)%00%(taggerdate)',
      'refs/tags/',
    ];

    const { stdout } = await this.exec(path, args);
    const tags: Tag[] = [];
    const lines = stdout.split('\n').filter(Boolean);

    for (const line of lines) {
      const [name, hash, type, date] = line.split('\0');
      tags.push({
        name,
        commitHash: hash,
        isAnnotated: type === 'tag',
        isSigned: false,
        date: date ? new Date(date) : undefined,
      });
    }

    return tags;
  }

  async createTag(
    path: string,
    name: string,
    options: TagOptions = {}
  ): Promise<void> {
    const args = ['tag'];

    if (options.annotated) {
      args.push('-a', name);
      if (options.message) {
        args.push('-m', options.message);
      }
    } else {
      args.push(name);
    }

    if (options.sign) {
      args.push('-s');
    }

    if (options.commit) {
      args.push(options.commit);
    }

    await this.exec(path, args);
  }

  // === Config ===

  async getConfig(path: string, key: string, global = false): Promise<string | undefined> {
    const args = ['config'];
    if (global) {
      args.push('--global');
    }
    args.push('--get', key);

    try {
      const { stdout } = await this.exec(path, args);
      return stdout.trim();
    } catch {
      return undefined;
    }
  }

  async setConfig(path: string, key: string, value: string, global = false): Promise<void> {
    const args = ['config'];
    if (global) {
      args.push('--global');
    }
    args.push(key, value);

    await this.exec(path, args);
  }

  // === Cleanup ===

  cancelOperation(operationId: string): void {
    const proc = this.activeProcesses.get(operationId);
    if (proc) {
      proc.kill();
      this.activeProcesses.delete(operationId);
    }
  }

  dispose(): void {
    for (const proc of this.activeProcesses.values()) {
      proc.kill();
    }
    this.activeProcesses.clear();
  }
}

// Custom error class
export class GitError extends Error {
  constructor(
    message: string,
    public code: number | string,
    public stdout?: string,
    public stderr?: string
  ) {
    super(message);
    this.name = 'GitError';
  }
}
```

### 3.2 AuthService

Handles OAuth authentication and SSH key management.

```typescript
// src/main/services/AuthService.ts
import { shell } from 'electron';
import * as crypto from 'crypto';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { KeychainService } from './KeychainService';

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scopes: string[];
}

const OAUTH_CONFIGS: Record<string, OAuthConfig> = {
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    redirectUri: 'http://localhost:7777/callback',
    scopes: ['repo', 'user', 'read:org'],
  },
  bitbucket: {
    clientId: process.env.BITBUCKET_CLIENT_ID!,
    clientSecret: process.env.BITBUCKET_CLIENT_SECRET!,
    authorizeUrl: 'https://bitbucket.org/site/oauth2/authorize',
    tokenUrl: 'https://bitbucket.org/site/oauth2/access_token',
    redirectUri: 'http://localhost:7777/callback',
    scopes: ['repository', 'account'],
  },
  gitlab: {
    clientId: process.env.GITLAB_CLIENT_ID!,
    clientSecret: process.env.GITLAB_CLIENT_SECRET!,
    authorizeUrl: 'https://gitlab.com/oauth/authorize',
    tokenUrl: 'https://gitlab.com/oauth/token',
    redirectUri: 'http://localhost:7777/callback',
    scopes: ['api', 'read_user'],
  },
};

export class AuthService {
  private keychain: KeychainService;
  private pendingAuths: Map<string, { resolve: Function; reject: Function }> = new Map();
  private server: any;

  constructor(keychain: KeychainService) {
    this.keychain = keychain;
  }

  // === OAuth ===

  async authenticate(service: string, enterpriseUrl?: string): Promise<Account> {
    const config = this.getOAuthConfig(service, enterpriseUrl);
    const state = this.generateState();

    // Start callback server
    await this.startCallbackServer();

    // Build authorization URL
    const authUrl = this.buildAuthUrl(config, state);

    // Store pending auth
    const authPromise = new Promise<Account>((resolve, reject) => {
      this.pendingAuths.set(state, { resolve, reject });
    });

    // Open browser
    await shell.openExternal(authUrl);

    // Wait for callback
    return authPromise;
  }

  private getOAuthConfig(service: string, enterpriseUrl?: string): OAuthConfig {
    const baseConfig = OAUTH_CONFIGS[service];
    if (!baseConfig) {
      throw new Error(`Unsupported service: ${service}`);
    }

    if (enterpriseUrl) {
      return {
        ...baseConfig,
        authorizeUrl: `${enterpriseUrl}${new URL(baseConfig.authorizeUrl).pathname}`,
        tokenUrl: `${enterpriseUrl}${new URL(baseConfig.tokenUrl).pathname}`,
      };
    }

    return baseConfig;
  }

  private buildAuthUrl(config: OAuthConfig, state: string): string {
    const url = new URL(config.authorizeUrl);
    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', config.redirectUri);
    url.searchParams.set('scope', config.scopes.join(' '));
    url.searchParams.set('state', state);
    url.searchParams.set('response_type', 'code');

    return url.toString();
  }

  private generateState(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private async startCallbackServer(): Promise<void> {
    if (this.server) return;

    return new Promise((resolve) => {
      this.server = createServer((req: IncomingMessage, res: ServerResponse) => {
        this.handleCallback(req, res);
      });
      this.server.listen(7777, () => resolve());
    });
  }

  private async handleCallback(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url || '', 'http://localhost:7777');
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    res.writeHead(200, { 'Content-Type': 'text/html' });

    if (error) {
      res.end('<h1>Authentication failed</h1><p>You can close this window.</p>');
      const pending = this.pendingAuths.get(state || '');
      if (pending) {
        pending.reject(new Error(error));
        this.pendingAuths.delete(state || '');
      }
      return;
    }

    if (code && state) {
      res.end('<h1>Authentication successful!</h1><p>You can close this window.</p>');
      const pending = this.pendingAuths.get(state);
      if (pending) {
        try {
          const account = await this.exchangeCodeForToken(code, state);
          pending.resolve(account);
        } catch (err) {
          pending.reject(err);
        } finally {
          this.pendingAuths.delete(state);
        }
      }
    }
  }

  private async exchangeCodeForToken(code: string, state: string): Promise<Account> {
    // Implementation to exchange code for access token
    // ... fetch token from OAuth provider
    return {} as Account;
  }

  // === SSH Keys ===

  async generateSSHKey(
    type: 'rsa' | 'ed25519' | 'ecdsa',
    passphrase?: string
  ): Promise<{ publicKey: string; privateKeyPath: string }> {
    const keyName = type === 'rsa' ? 'id_rsa' : `id_${type}`;
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const sshDir = path.join(homeDir, '.ssh');
    const privateKeyPath = path.join(sshDir, keyName);

    // Use ssh-keygen to generate key
    // ... implementation

    return {
      publicKey: '...',
      privateKeyPath,
    };
  }

  async addSSHKey(keyPath: string, passphrase?: string): Promise<void> {
    // Add key to SSH agent or store passphrase in keychain
    if (passphrase) {
      await this.keychain.setPassword('ssh', keyPath, passphrase);
    }
  }

  async testSSHConnection(host: string): Promise<boolean> {
    // Test SSH connection to host
    // ... implementation
    return true;
  }

  // === Credential Helpers ===

  async getCredential(host: string): Promise<{ username: string; password: string } | null> {
    return this.keychain.getPassword('git', host);
  }

  async setCredential(host: string, username: string, password: string): Promise<void> {
    await this.keychain.setPassword('git', host, `${username}:${password}`);
  }

  dispose(): void {
    if (this.server) {
      this.server.close();
    }
  }
}
```

### 3.3 RepoManager

Manages repository bookmarks and discovery.

```typescript
// src/main/services/RepoManager.ts
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { GitService } from './GitService';
import { Database } from '../database';

export interface Bookmark {
  id: string;
  path: string;
  name: string;
  icon?: string;
  lastAccessed: Date;
  addedAt: Date;
  order: number;
  pinned: boolean;
}

export class RepoManager {
  private db: Database;
  private git: GitService;

  constructor(db: Database, git: GitService) {
    this.db = db;
    this.git = git;
  }

  async addBookmark(repoPath: string): Promise<Bookmark> {
    const isRepo = await this.git.isRepo(repoPath);
    if (!isRepo) {
      throw new Error('Not a Git repository');
    }

    const name = path.basename(repoPath);
    const id = this.generateId();

    const bookmark: Bookmark = {
      id,
      path: repoPath,
      name,
      lastAccessed: new Date(),
      addedAt: new Date(),
      order: 0,
      pinned: false,
    };

    await this.db.run(
      `INSERT INTO repositories (id, path, name, last_accessed, created_at, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, repoPath, name, bookmark.lastAccessed.toISOString(), bookmark.addedAt.toISOString(), '{}']
    );

    return bookmark;
  }

  async removeBookmark(id: string): Promise<void> {
    await this.db.run('DELETE FROM repositories WHERE id = ?', [id]);
  }

  async listBookmarks(): Promise<Bookmark[]> {
    const rows = await this.db.all(
      `SELECT id, path, name, last_accessed, created_at
       FROM repositories
       ORDER BY pinned DESC, "order" ASC, last_accessed DESC`
    );

    return rows.map((row: any) => ({
      id: row.id,
      path: row.path,
      name: row.name,
      lastAccessed: new Date(row.last_accessed),
      addedAt: new Date(row.created_at),
      order: row.order || 0,
      pinned: !!row.pinned,
    }));
  }

  async updateLastAccessed(id: string): Promise<void> {
    await this.db.run(
      'UPDATE repositories SET last_accessed = ? WHERE id = ?',
      [new Date().toISOString(), id]
    );
  }

  async renameBookmark(id: string, newName: string): Promise<void> {
    await this.db.run(
      'UPDATE repositories SET name = ? WHERE id = ?',
      [newName, id]
    );
  }

  async setBookmarkOrder(id: string, order: number, pinned: boolean): Promise<void> {
    await this.db.run(
      'UPDATE repositories SET "order" = ?, pinned = ? WHERE id = ?',
      [order, pinned ? 1 : 0, id]
    );
  }

  async scanDirectory(dir: string): Promise<string[]> {
    // Recursively scan directory for Git repositories
    const repos: string[] = [];
    await this.scanDirectoryRecursive(dir, repos, 3);
    return repos;
  }

  private async scanDirectoryRecursive(dir: string, repos: string[], depth: number): Promise<void> {
    if (depth <= 0) return;

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      // Check if this is a Git repo
      const gitDir = path.join(dir, '.git');
      try {
        await fs.stat(gitDir);
        repos.push(dir);
        return; // Don't scan subdirectories of a repo
      } catch {}

      // Scan subdirectories
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await this.scanDirectoryRecursive(
            path.join(dir, entry.name),
            repos,
            depth - 1
          );
        }
      }
    } catch {}
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}
```

---

## 4. Database Layer

### 4.1 Database Setup

```typescript
// src/main/database/index.ts
import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';

export class Database {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'sourcetree.db');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      -- Repositories (bookmarks)
      CREATE TABLE IF NOT EXISTS repositories (
        id TEXT PRIMARY KEY,
        path TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        icon TEXT,
        description TEXT,
        default_branch TEXT DEFAULT 'main',
        last_accessed DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata JSON,
        "order" INTEGER DEFAULT 0,
        pinned INTEGER DEFAULT 0
      );

      -- Accounts
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        service TEXT NOT NULL,
        username TEXT NOT NULL,
        email TEXT,
        avatar_url TEXT,
        url TEXT,
        token_expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(service, username, COALESCE(url, ''))
      );

      -- Settings
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Recent repositories
      CREATE TABLE IF NOT EXISTS recent_repositories (
        repository_id TEXT PRIMARY KEY,
        last_opened DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE
      );

      -- Commit templates
      CREATE TABLE IF NOT EXISTS commit_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        template TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_repositories_path ON repositories(path);
      CREATE INDEX IF NOT EXISTS idx_repositories_last_accessed ON repositories(last_accessed);
      CREATE INDEX IF NOT EXISTS idx_accounts_service ON accounts(service);
    `);
  }

  run(sql: string, params: any[] = []): any {
    const stmt = this.db.prepare(sql);
    return stmt.run(...params);
  }

  get(sql: string, params: any[] = []): any {
    const stmt = this.db.prepare(sql);
    return stmt.get(...params);
  }

  all(sql: string, params: any[] = []): any[] {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params);
  }

  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  close(): void {
    this.db.close();
  }
}
```

---

## 5. IPC Communication

### 5.1 IPC Handler (Main Process)

```typescript
// src/main/ipc/git.ts
import { ipcMain } from 'electron';
import { GitService } from '../services/GitService';

export function registerGitHandlers(git: GitService) {
  // Clone
  ipcMain.handle('git:clone', async (event, { url, path, options }) => {
    return git.clone(url, path, options, (progress) => {
      event.sender.send('git:progress', { operation: 'clone', ...progress });
    });
  });

  // Status
  ipcMain.handle('git:status', async (_, { path }) => {
    return git.status(path);
  });

  // Diff
  ipcMain.handle('git:diff', async (_, { path, options }) => {
    return git.diff(path, options);
  });

  // Commit
  ipcMain.handle('git:commit', async (_, { path, message, options }) => {
    return git.commit(path, message, options);
  });

  // Branch operations
  ipcMain.handle('git:listBranches', async (_, { path }) => {
    return git.listBranches(path);
  });

  ipcMain.handle('git:createBranch', async (_, { path, name, options }) => {
    return git.createBranch(path, name, options);
  });

  ipcMain.handle('git:deleteBranch', async (_, { path, name, force }) => {
    return git.deleteBranch(path, name, force);
  });

  ipcMain.handle('git:checkout', async (_, { path, ref, options }) => {
    return git.checkout(path, ref, options);
  });

  // Push/Pull
  ipcMain.handle('git:push', async (event, { path, options }) => {
    return git.push(path, options, (progress) => {
      event.sender.send('git:progress', { operation: 'push', ...progress });
    });
  });

  ipcMain.handle('git:pull', async (_, { path, options }) => {
    return git.pull(path, options);
  });

  ipcMain.handle('git:fetch', async (_, { path, remote, options }) => {
    return git.fetch(path, remote, options);
  });

  // ... more handlers
}
```

### 5.2 IPC Client (Renderer Process)

```typescript
// src/renderer/ipp/index.ts
import { ipcRenderer } from 'electron';

type IpcCallback = (data: any) => void;

class IpcClient {
  private listeners: Map<string, Set<IpcCallback>> = new Map();

  async invoke(channel: string, ...args: any[]): Promise<any> {
    return ipcRenderer.invoke(channel, ...args);
  }

  on(channel: string, callback: IpcCallback): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
      ipcRenderer.on(channel, (_, data) => {
        const callbacks = this.listeners.get(channel);
        if (callbacks) {
          callbacks.forEach(cb => cb(data));
        }
      });
    }

    this.listeners.get(channel)!.add(callback);

    return () => {
      this.listeners.get(channel)?.delete(callback);
    };
  }
}

export const ipc = new IpcClient();

// Convenience wrappers
export const gitApi = {
  clone: (url: string, path: string, options?: any) =>
    ipc.invoke('git:clone', { url, path, options }),

  status: (path: string) =>
    ipc.invoke('git:status', { path }),

  diff: (path: string, options?: any) =>
    ipc.invoke('git:diff', { path, options }),

  commit: (path: string, message: string, options?: any) =>
    ipc.invoke('git:commit', { path, message, options }),

  listBranches: (path: string) =>
    ipc.invoke('git:listBranches', { path }),

  createBranch: (path: string, name: string, options?: any) =>
    ipc.invoke('git:createBranch', { path, name, options }),

  checkout: (path: string, ref: string, options?: any) =>
    ipc.invoke('git:checkout', { path, ref, options }),

  push: (path: string, options?: any) =>
    ipc.invoke('git:push', { path, options }),

  pull: (path: string, options?: any) =>
    ipc.invoke('git:pull', { path, options }),

  fetch: (path: string, remote?: string, options?: any) =>
    ipc.invoke('git:fetch', { path, remote, options }),
};
```

---

## 6. State Management

### 6.1 Zustand Store

```typescript
// src/renderer/store/repoStore.ts
import { create } from 'zustand';
import { gitApi } from '../ipc';

interface RepoState {
  // Repository info
  repoPath: string | null;
  repoInfo: RepoInfo | null;
  status: StatusResult | null;
  
  // Branches
  branches: Branch[];
  currentBranch: string | null;
  
  // Commits
  commits: Commit[];
  hasMoreCommits: boolean;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  openRepo: (path: string) => Promise<void>;
  refreshStatus: () => Promise<void>;
  fetchBranches: () => Promise<void>;
  fetchCommits: (limit?: number) => Promise<void>;
  commit: (message: string, options?: CommitOptions) => Promise<void>;
  push: (options?: PushOptions) => Promise<void>;
  pull: (options?: PullOptions) => Promise<void>;
  checkout: (branch: string) => Promise<void>;
  createBranch: (name: string, options?: BranchOptions) => Promise<void>;
}

export const useRepoStore = create<RepoState>((set, get) => ({
  // Initial state
  repoPath: null,
  repoInfo: null,
  status: null,
  branches: [],
  currentBranch: null,
  commits: [],
  hasMoreCommits: true,
  isLoading: false,
  error: null,

  // Actions
  openRepo: async (path: string) => {
    set({ isLoading: true, error: null, repoPath: path });
    try {
      const [status, branches] = await Promise.all([
        gitApi.status(path),
        gitApi.listBranches(path),
      ]);
      
      set({
        status,
        branches,
        currentBranch: status.branch,
        isLoading: false,
      });
      
      // Fetch initial commits
      get().fetchCommits(100);
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  refreshStatus: async () => {
    const { repoPath } = get();
    if (!repoPath) return;

    try {
      const status = await gitApi.status(repoPath);
      set({ status });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchBranches: async () => {
    const { repoPath } = get();
    if (!repoPath) return;

    try {
      const branches = await gitApi.listBranches(repoPath);
      set({ branches });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchCommits: async (limit = 100) => {
    const { repoPath, commits } = get();
    if (!repoPath) return;

    set({ isLoading: true });
    try {
      const newCommits = await gitApi.log(repoPath, {
        maxCount: limit,
        skip: commits.length,
      });
      
      set({
        commits: [...commits, ...newCommits],
        hasMoreCommits: newCommits.length === limit,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  commit: async (message, options) => {
    const { repoPath, refreshStatus } = get();
    if (!repoPath) return;

    try {
      await gitApi.commit(repoPath, message, options);
      await refreshStatus();
      // Refresh commits too
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  push: async (options) => {
    const { repoPath } = get();
    if (!repoPath) return;

    try {
      await gitApi.push(repoPath, options);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  pull: async (options) => {
    const { repoPath, refreshStatus } = get();
    if (!repoPath) return;

    try {
      await gitApi.pull(repoPath, options);
      await refreshStatus();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  checkout: async (branch) => {
    const { repoPath, refreshStatus, fetchBranches } = get();
    if (!repoPath) return;

    try {
      await gitApi.checkout(repoPath, branch);
      set({ currentBranch: branch });
      await Promise.all([refreshStatus(), fetchBranches()]);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  createBranch: async (name, options) => {
    const { repoPath, fetchBranches } = get();
    if (!repoPath) return;

    try {
      await gitApi.createBranch(repoPath, name, options);
      await fetchBranches();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
}));
```

---

## 7. Component Architecture

### 7.1 Key Components

#### RepoWindow (Main Repository View)

```typescript
// src/renderer/components/RepoWindow/RepoWindow.tsx
import React from 'react';
import { useRepoStore } from '../../store/repoStore';
import { Toolbar } from '../Layout/Toolbar';
import { Sidebar } from '../Layout/Sidebar';
import { FileStatusView } from './FileStatus/FileStatusView';
import { HistoryView } from './History/HistoryView';
import { StatusBar } from '../Layout/StatusBar';
import styles from './RepoWindow.module.css';

export const RepoWindow: React.FC = () => {
  const { status, isLoading } = useRepoStore();
  const [activeTab, setActiveTab] = React.useState<'status' | 'history'>('status');

  return (
    <div className={styles.container}>
      <Toolbar />
      
      <div className={styles.main}>
        <Sidebar />
        
        <div className={styles.content}>
          {activeTab === 'status' ? (
            <FileStatusView />
          ) : (
            <HistoryView />
          )}
        </div>
      </div>
      
      <StatusBar 
        branch={status?.branch}
        ahead={status?.ahead}
        behind={status?.behind}
      />
    </div>
  );
};
```

#### CommitGraph (Canvas-based)

```typescript
// src/renderer/components/RepoWindow/History/CommitGraph.tsx
import React, { useRef, useEffect, useMemo } from 'react';
import { Commit } from '../../../shared/types';
import { layoutGraph, GraphLayout } from '../../../utils/graphLayout';

interface Props {
  commits: Commit[];
  width: number;
  rowHeight: number;
  onCommitClick: (commit: Commit) => void;
}

export const CommitGraph: React.FC<Props> = ({
  commits,
  width,
  rowHeight,
  onCommitClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dpr = window.devicePixelRatio || 1;

  const layout = useMemo(() => layoutGraph(commits), [commits]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const height = commits.length * rowHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, width, height);

    // Draw edges
    drawEdges(ctx, layout, rowHeight);

    // Draw nodes
    drawNodes(ctx, layout, rowHeight, onCommitClick);
  }, [layout, width, rowHeight]);

  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rowIndex = Math.floor(y / rowHeight);

    const commit = commits[rowIndex];
    if (commit) {
      onCommitClick(commit);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      onClick={handleClick}
    />
  );
};

function drawEdges(
  ctx: CanvasRenderingContext2D,
  layout: GraphLayout,
  rowHeight: number
) {
  ctx.lineWidth = 2;

  for (const edge of layout.edges) {
    ctx.beginPath();
    ctx.strokeStyle = edge.color;

    const { from, to } = edge;
    const fromY = from.row * rowHeight + rowHeight / 2;
    const toY = to.row * rowHeight + rowHeight / 2;

    // Draw curved line
    ctx.moveTo(from.x, fromY);
    
    if (to.row - from.row === 1) {
      // Direct child - simple line
      ctx.lineTo(to.x, toY);
    } else {
      // Multi-row span - bezier curve
      const midY = (fromY + toY) / 2;
      ctx.bezierCurveTo(
        from.x, midY,
        to.x, midY,
        to.x, toY
      );
    }
    
    ctx.stroke();
  }
}

function drawNodes(
  ctx: CanvasRenderingContext2D,
  layout: GraphLayout,
  rowHeight: number,
  onClick: (commit: Commit) => void
) {
  const nodeRadius = 5;

  for (const node of layout.nodes) {
    const y = node.row * rowHeight + rowHeight / 2;

    ctx.beginPath();
    ctx.arc(node.x, y, nodeRadius, 0, Math.PI * 2);
    ctx.fillStyle = node.color;
    ctx.fill();

    // Add outline for merge commits
    if (node.isMerge) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}
```

#### DiffView

```typescript
// src/renderer/components/RepoWindow/Diff/DiffView.tsx
import React, { useMemo } from 'react';
import { FileDiff, Hunk, DiffLine } from '../../../shared/types';
import { UnifiedDiff } from './UnifiedDiff';
import { SideBySideDiff } from './SideBySideDiff';
import styles from './DiffView.module.css';

interface Props {
  diff: FileDiff;
  mode: 'unified' | 'side-by-side';
  onStageHunk?: (hunk: Hunk) => void;
  onStageLine?: (line: DiffLine) => void;
}

export const DiffView: React.FC<Props> = ({
  diff,
  mode,
  onStageHunk,
  onStageLine,
}) => {
  // Syntax highlighting via highlight.js or similar
  const highlightedHunks = useMemo(() => {
    return diff.hunks.map(hunk => ({
      ...hunk,
      lines: hunk.lines.map(line => ({
        ...line,
        // Apply syntax highlighting based on file extension
        highlighted: highlightSyntax(line.content, getFileExtension(diff.path)),
      })),
    }));
  }, [diff]);

  if (diff.binary) {
    return (
      <div className={styles.binaryNotice}>
        Binary file: {diff.path}
      </div>
    );
  }

  if (mode === 'side-by-side') {
    return (
      <SideBySideDiff
        hunks={highlightedHunks}
        onStageHunk={onStageHunk}
        onStageLine={onStageLine}
      />
    );
  }

  return (
    <UnifiedDiff
      hunks={highlightedHunks}
      onStageHunk={onStageHunk}
      onStageLine={onStageLine}
    />
  );
};

// Unified Diff Component
export const UnifiedDiff: React.FC<{
  hunks: Hunk[];
  onStageHunk?: (hunk: Hunk) => void;
  onStageLine?: (line: DiffLine) => void;
}> = ({ hunks, onStageHunk, onStageLine }) => {
  return (
    <div className={styles.unifiedDiff}>
      {hunks.map((hunk, i) => (
        <div key={i} className={styles.hunk}>
          <div className={styles.hunkHeader}>
            <span className={styles.hunkInfo}>
              @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
            </span>
            {onStageHunk && (
              <button
                className={styles.stageButton}
                onClick={() => onStageHunk(hunk)}
              >
                Stage hunk
              </button>
            )}
          </div>
          
          <div className={styles.lines}>
            {hunk.lines.map((line, j) => (
              <div
                key={j}
                className={`${styles.line} ${styles[line.type]}`}
                onClick={() => onStageLine?.(line)}
              >
                <span className={styles.lineNumber}>
                  {line.oldLineNumber || ''}
                </span>
                <span className={styles.lineNumber}>
                  {line.newLineNumber || ''}
                </span>
                <span className={styles.linePrefix}>
                  {line.type === 'add' ? '+' : line.type === 'delete' ? '-' : ' '}
                </span>
                <span
                  className={styles.lineContent}
                  dangerouslySetInnerHTML={{ __html: line.highlighted || line.content }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## 8. Theming System

### 8.1 CSS Variables

```css
/* src/renderer/styles/themes/light.css */
:root {
  /* Colors */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f5f5f5;
  --color-bg-tertiary: #e8e8e8;
  
  --color-text-primary: #24292e;
  --color-text-secondary: #586069;
  --color-text-tertiary: #6a737d;
  
  --color-border: #e1e4e8;
  --color-border-hover: #c5c9cd;
  
  /* Accent */
  --color-accent: #0366d6;
  --color-accent-hover: #005bb8;
  
  /* Git status colors */
  --color-addition: #28a745;
  --color-addition-bg: #e6ffed;
  --color-deletion: #d73a49;
  --color-deletion-bg: #ffeef0;
  --color-modification: #f9a825;
  
  /* Branch colors */
  --color-branch-1: #0366d6;
  --color-branch-2: #28a745;
  --color-branch-3: #d73a49;
  --color-branch-4: #f9a825;
  --color-branch-5: #6f42c1;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  
  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-mono: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  
  /* Animation */
  --transition-fast: 0.1s ease;
  --transition-normal: 0.2s ease;
  --transition-slow: 0.3s ease;
}

/* src/renderer/styles/themes/dark.css */
:root[data-theme="dark"] {
  --color-bg-primary: #0d1117;
  --color-bg-secondary: #161b22;
  --color-bg-tertiary: #21262d;
  
  --color-text-primary: #c9d1d9;
  --color-text-secondary: #8b949e;
  --color-text-tertiary: #6e7681;
  
  --color-border: #30363d;
  --color-border-hover: #484f58;
  
  --color-accent: #58a6ff;
  --color-accent-hover: #79b8ff;
  
  --color-addition-bg: rgba(46, 160, 67, 0.15);
  --color-deletion-bg: rgba(248, 81, 73, 0.15);
  
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
}
```

---

## 9. Build & Distribution

### 9.1 electron-builder Configuration

```yaml
# electron-builder.yml
appId: com.sourcetree-clone.app
productName: SourceTree Clone
copyright: Copyright © 2026

directories:
  output: dist
  buildResources: resources

files:
  - dist/**/*
  - package.json

mac:
  category: public.app-category.developer-tools
  icon: resources/mac/icon.icns
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: resources/mac/entitlements.plist
  entitlementsInherit: resources/mac/entitlementsInherit.plist
  target:
    - target: dmg
      arch:
        - x64
        - arm64
    - target: zip
      arch:
        - x64
        - arm64

dmg:
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications

win:
  icon: resources/windows/icon.ico
  target:
    - target: nsis
      arch:
        - x64
        - ia32
    - target: portable
      arch:
        - x64

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true

publish:
  provider: github
  owner: your-org
  repo: sourcetree-clone

# Auto-update configuration
updater:
  server: 'https://api.github.com/repos/your-org/sourcetree-clone/releases/latest'
```

---

## 10. Security Considerations

### 10.1 Key Security Measures

1. **Context Isolation**: Enabled in BrowserWindow
```typescript
new BrowserWindow({
  webPreferences: {
    contextIsolation: true,
    nodeIntegration: false,
    preload: path.join(__dirname, 'preload.js'),
  },
});
```

2. **Sandboxed Renderer**: No Node.js access in renderer

3. **Secure Storage**: Use OS keychain for credentials

4. **Content Security Policy**:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.github.com https://bitbucket.org https://gitlab.com;
">
```

5. **Input Validation**: Sanitize all user inputs and file paths

6. **URL Whitelisting**: Only allow specific domains for OAuth

---

## 11. Performance Optimization

### 11.1 Strategies

1. **Virtual Scrolling**: For long commit lists and file lists
2. **Lazy Loading**: Load commit details on demand
3. **Debouncing**: File status refresh on filesystem changes
4. **Worker Threads**: Run heavy Git operations in worker process
5. **Caching**: Cache repository metadata and icons
6. **Canvas Rendering**: Use Canvas for commit graph (not SVG)
7. **Memoization**: React.memo for expensive components
8. **Code Splitting**: Lazy load dialogs and views

### 11.2 Bundle Size Targets

- Main process: < 5 MB
- Renderer process: < 3 MB
- Total installer: < 100 MB

---

## 12. Error Handling

### 12.1 Global Error Handler

```typescript
// src/main/index.ts
import { app, dialog } from 'electron';

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  dialog.showErrorBox('Error', error.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

// In renderer
window.addEventListener('error', (event) => {
  console.error('Renderer Error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
});
```

---

## 13. Logging

```typescript
// src/main/utils/logger.ts
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

class Logger {
  private logFile: string;
  private logStream: fs.WriteStream;

  constructor() {
    const logsPath = app.getPath('logs');
    this.logFile = path.join(logsPath, 'app.log');
    this.logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
  }

  info(message: string, ...args: any[]) {
    this.log('INFO', message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log('ERROR', message, ...args);
  }

  debug(message: string, ...args: any[]) {
    if (process.env.DEBUG) {
      this.log('DEBUG', message, ...args);
    }
  }

  private log(level: string, message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message} ${args.length ? JSON.stringify(args) : ''}\n`;
    this.logStream.write(logLine);
    console.log(logLine.trim());
  }
}

export const logger = new Logger();
```

---

**End of Architecture Design Document**

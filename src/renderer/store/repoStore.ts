import { create } from 'zustand'
import { git, settings } from '../ipc'

interface StatusResult {
  files: FileStatus[]
  staged: number
  unstaged: number
  untracked: number
  conflicts: number
  ahead: number
  behind: number
  branch: string
  trackingBranch?: string
}

interface FileStatus {
  path: string
  oldPath?: string
  status: string
  staged: boolean
  additions: number
  deletions: number
  binary: boolean
}

interface Branch {
  name: string
  headCommit: { hash: string }
  upstream?: string
  isCurrent: boolean
  isRemote: boolean
  ahead: number
  behind: number
}

interface Commit {
  hash: string
  shortHash: string
  message: string
  subject: string
  body: string
  author: { name: string; email: string }
  date: Date
  parents: string[]
  refs: string[]
}

interface DiffResult {
  files: FileDiff[]
  raw: string
}

interface FileDiff {
  path: string
  binary: boolean
  additions: number
  deletions: number
  hunks: Hunk[]
}

interface Hunk {
  header: string
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: DiffLine[]
}

interface DiffLine {
  type: 'add' | 'delete' | 'context'
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}

interface CommitDetailResult {
  commit: Commit
  diff: string
}

interface RepoState {
  repoPath: string | null
  status: StatusResult | null
  branches: Branch[]
  currentBranch: string | null
  commits: Commit[]
  hasMoreCommits: boolean
  selectedCommit: CommitDetailResult | null
  selectedFile: string | null
  selectedFileDiff: DiffResult | null
  isLoading: boolean
  error: string | null
  commitMessage: string

  setCommitMessage: (msg: string) => void
  openRepo: (path: string) => Promise<void>
  closeRepo: () => void
  refreshStatus: () => Promise<void>
  fetchBranches: () => Promise<void>
  fetchCommits: (limit?: number) => Promise<void>
  commit: (message: string) => Promise<void>
  stageFiles: (files: string[]) => Promise<void>
  unstageFiles: (files: string[]) => Promise<void>
  selectFile: (file: string | null) => Promise<void>
  selectCommit: (hash: string | null) => Promise<void>
  checkout: (branch: string) => Promise<void>
  push: () => Promise<void>
  pull: () => Promise<void>
  discardFile: (file: string) => Promise<void>
}

export const useRepoStore = create<RepoState>((set, get) => ({
  repoPath: null,
  status: null,
  branches: [],
  currentBranch: null,
  commits: [],
  hasMoreCommits: true,
  selectedCommit: null,
  selectedFile: null,
  selectedFileDiff: null,
  isLoading: false,
  error: null,
  commitMessage: '',

  setCommitMessage: (msg) => set({ commitMessage: msg }),

  openRepo: async (repoPath) => {
    set({ isLoading: true, error: null, repoPath })
    try {
      const [status, branches] = await Promise.all([
        git.status(repoPath) as Promise<StatusResult>,
        git.listBranches(repoPath) as Promise<Branch[]>,
      ])
      set({ status, branches, currentBranch: status.branch, isLoading: false })
      await get().fetchCommits(50)
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },

  closeRepo: () => set({
    repoPath: null,
    status: null,
    branches: [],
    currentBranch: null,
    commits: [],
    hasMoreCommits: true,
    selectedCommit: null,
    selectedFile: null,
    selectedFileDiff: null,
    error: null,
    commitMessage: '',
  }),

  refreshStatus: async () => {
    const { repoPath } = get()
    if (!repoPath) return
    try {
      const status = await git.status(repoPath) as StatusResult
      set({ status })
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  fetchBranches: async () => {
    const { repoPath } = get()
    if (!repoPath) return
    try {
      const branches = await git.listBranches(repoPath) as Branch[]
      set({ branches })
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  fetchCommits: async (limit = 50) => {
    const { repoPath, commits, isLoading } = get()
    if (!repoPath || isLoading) return
    set({ isLoading: true })
    try {
      const newCommits = await git.log(repoPath, { maxCount: limit, skip: commits.length }) as Commit[]
      set({ commits: [...commits, ...newCommits], hasMoreCommits: newCommits.length === limit, isLoading: false })
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },

  selectCommit: async (hash) => {
    const { repoPath } = get()
    if (!repoPath || !hash) {
      set({ selectedCommit: null })
      return
    }
    set({ selectedCommit: null })
    try {
      const detail = await git.commitDetail(repoPath, hash) as CommitDetailResult
      set({ selectedCommit: detail })
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  commit: async (message) => {
    const { repoPath, refreshStatus } = get()
    if (!repoPath) return
    try {
      await git.commit(repoPath, message)
      set({ commitMessage: '' })
      await refreshStatus()
      set({ commits: [], selectedFile: null, selectedFileDiff: null, selectedCommit: null })
      await get().fetchCommits(50)
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  stageFiles: async (files) => {
    const { repoPath, refreshStatus } = get()
    if (!repoPath) return
    try {
      await git.add(repoPath, files)
      await refreshStatus()
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  unstageFiles: async (files) => {
    const { repoPath, refreshStatus } = get()
    if (!repoPath) return
    try {
      await git.unstage(repoPath, files)
      await refreshStatus()
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  selectFile: async (file) => {
    const { repoPath } = get()
    if (!repoPath) return
    set({ selectedFile: file, selectedFileDiff: null })
    if (file) {
      try {
        const diff = await git.diff(repoPath, { file }) as DiffResult
        if (!diff.files.length) {
          const stagedDiff = await git.diff(repoPath, { file, staged: true }) as DiffResult
          set({ selectedFileDiff: stagedDiff })
        } else {
          set({ selectedFileDiff: diff })
        }
      } catch { /* ignore */ }
    }
  },

  checkout: async (branch) => {
    const { repoPath, refreshStatus, fetchBranches } = get()
    if (!repoPath) return
    try {
      await git.checkout(repoPath, branch)
      set({ currentBranch: branch, commits: [], selectedFile: null, selectedFileDiff: null, selectedCommit: null })
      await Promise.all([refreshStatus(), fetchBranches()])
      await get().fetchCommits(50)
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  push: async () => {
    const { repoPath, refreshStatus } = get()
    if (!repoPath) return
    try {
      await git.push(repoPath)
      await refreshStatus()
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  pull: async () => {
    const { repoPath, refreshStatus, fetchCommits, fetchBranches } = get()
    if (!repoPath) return
    try {
      await git.pull(repoPath)
      await Promise.all([refreshStatus(), fetchBranches()])
      set({ commits: [], selectedFile: null, selectedFileDiff: null, selectedCommit: null })
      await fetchCommits(50)
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  discardFile: async (file) => {
    const { repoPath, refreshStatus } = get()
    if (!repoPath) return
    try {
      await git.checkout(repoPath, '--')
      await git.status(repoPath) // fallback for file-level checkout
      await refreshStatus()
    } catch (err: any) {
      set({ error: err.message })
    }
  },
}))

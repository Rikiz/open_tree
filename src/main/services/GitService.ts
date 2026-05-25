import { execFile, execFileSync, ChildProcess } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export interface GitServiceOptions {
  gitPath: string
}

export interface CloneOptions {
  depth?: number
  branch?: string
  recursive?: boolean
  singleBranch?: boolean
}

export interface InitOptions {
  branch?: string
  bare?: boolean
}

export interface StatusResult {
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

export interface FileStatus {
  path: string
  oldPath?: string
  status: string
  staged: boolean
  additions: number
  deletions: number
  binary: boolean
}

export interface DiffOptions {
  staged?: boolean
  file?: string
  commit?: string
  commitCompare?: string
  ignoreWhitespace?: boolean
  contextLines?: number
}

export interface DiffResult {
  files: FileDiff[]
  raw: string
}

export interface FileDiff {
  path: string
  oldPath?: string
  binary: boolean
  additions: number
  deletions: number
  hunks: Hunk[]
}

export interface Hunk {
  header: string
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: DiffLine[]
}

export interface DiffLine {
  type: 'add' | 'delete' | 'context'
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}

export interface CommitOptions {
  amend?: boolean
  signoff?: boolean
  gpgSign?: boolean
  noVerify?: boolean
  author?: { name: string; email: string }
}

export interface CommitResult {
  hash: string
  branch: string
}

export interface LogOptions {
  maxCount?: number
  skip?: number
  since?: string
  until?: string
  author?: string
  grep?: string
  file?: string
}

export interface Commit {
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

export interface Branch {
  name: string
  headCommit: { hash: string }
  upstream?: string
  isCurrent: boolean
  isRemote: boolean
  ahead: number
  behind: number
}

export interface BranchOptions {
  startPoint?: string
  checkout?: boolean
}

export interface PushOptions {
  force?: boolean
  forceWithLease?: boolean
  setUpstream?: boolean
  remote?: string
  branch?: string
  all?: boolean
  tags?: boolean
}

export interface PushResult {
  remote: string
  branch: string
  updated: boolean
}

export interface PullOptions {
  rebase?: boolean
  fastForwardOnly?: boolean
  noFastForward?: boolean
  remote?: string
  branch?: string
}

export interface PullResult {
  fetchedCommits: number
  fastForward: boolean
  conflicts: string[]
  merged: string[]
}

export interface FetchOptions {
  prune?: boolean
  tags?: boolean
}

export interface FetchResult {
  remote: string
  branches: { name: string; updated: boolean }[]
  newBranches: string[]
  deletedBranches: string[]
}

export interface MergeOptions {
  noFastForward?: boolean
  fastForwardOnly?: boolean
  squash?: boolean
  noCommit?: boolean
  message?: string
}

export interface MergeResult {
  fastForward: boolean
  conflicts: string[]
  merged: string[]
}

export interface StashOptions {
  includeUntracked?: boolean
  keepIndex?: boolean
}

export interface StashEntry {
  index: number
  message: string
  branchName: string
  commitHash: string
  date?: Date
}

export interface Tag {
  name: string
  commitHash: string
  message?: string
  isAnnotated: boolean
  isSigned: boolean
  date?: Date
}

export interface TagOptions {
  annotated?: boolean
  message?: string
  sign?: boolean
  commit?: string
}

export interface CherryPickOptions {
  noCommit?: boolean
  mainlineParent?: number
  signoff?: boolean
}

export class GitError extends Error {
  constructor(
    message: string,
    public code: number | string,
    public stdout?: string,
    public stderr?: string
  ) {
    super(message)
    this.name = 'GitError'
  }
}

export class GitService {
  private gitPath: string
  private activeProcesses: Map<string, ChildProcess> = new Map()

  constructor(options: GitServiceOptions) {
    this.gitPath = options.gitPath || 'git'
  }

  private async exec(repoPath: string, args: string[], opts?: { input?: string; timeout?: number }): Promise<{ stdout: string; stderr: string }> {
    const fullArgs = ['-C', repoPath, ...args]
    try {
      const options: Record<string, unknown> = {
        maxBuffer: 50 * 1024 * 1024,
        timeout: opts?.timeout || 300000,
        encoding: 'utf8',
      }
      if (opts?.input) {
        options.stdin = opts.input
      }
      const result = await execFileAsync(this.gitPath, fullArgs, options as any)
      return { stdout: String(result.stdout), stderr: String(result.stderr) }
    } catch (error: unknown) {
      const gitErr = error as { message: string; code: number; stdout: string; stderr: string }
      throw new GitError(gitErr.message, gitErr.code, gitErr.stdout, gitErr.stderr)
    }
  }

  async clone(url: string, destPath: string, options: CloneOptions, onProgress?: (data: Record<string, unknown>) => void): Promise<string> {
    const args = ['clone', '--progress']
    if (options.depth) args.push('--depth', String(options.depth))
    if (options.branch) args.push('--branch', options.branch)
    if (options.recursive) args.push('--recursive')
    if (options.singleBranch) args.push('--single-branch')
    args.push(url, destPath)

    // Use execFile for clone
    const proc = execFile(this.gitPath, args, { maxBuffer: 100 * 1024 * 1024 })
    const id = `clone-${Date.now()}`
    this.activeProcesses.set(id, proc)

    if (proc.stderr && onProgress) {
      proc.stderr.on('data', (data: Buffer) => {
        const text = data.toString()
        const match = text.match(/(\w+):\s+(\d+)%/)
        if (match) {
          onProgress({ stage: match[1], progress: parseInt(match[2]) })
        }
      })
    }

    return new Promise((resolve, reject) => {
      proc.on('close', (code) => {
        this.activeProcesses.delete(id)
        if (code === 0) resolve(destPath)
        else reject(new GitError(`Clone failed with code ${code}`, code ?? -1))
      })
      proc.on('error', (err) => {
        this.activeProcesses.delete(id)
        reject(err)
      })
    })
  }

  async init(dirPath: string, options: InitOptions = {}): Promise<void> {
    const args = ['init']
    if (options.branch) args.push('--initial-branch', options.branch)
    if (options.bare) args.push('--bare')
    await this.exec(dirPath, args)
  }

  async isRepo(dirPath: string): Promise<boolean> {
    try {
      await this.exec(dirPath, ['rev-parse', '--git-dir'], { timeout: 5000 })
      return true
    } catch {
      return false
    }
  }

  async commitDetail(repoPath: string, hash: string): Promise<{ commit: Commit; diff: string }> {
    const logArgs = ['log', '-1', `--pretty=format:%H%x00%h%x00%an%x00%ae%x00%at%x00%s%x00%b%x00%D%x00%P`, hash]
    const { stdout } = await this.exec(repoPath, logArgs)
    const commits = this.parseLog(stdout)
    if (commits.length === 0) throw new Error(`Commit ${hash} not found`)

    const isMerge = commits[0].parents.length > 1
    const diffArgs = ['diff-tree', '-r', '-p', '--no-commit-id']
    if (isMerge) diffArgs.push('-c')
    diffArgs.push(hash)
    const { stdout: diffStdout } = await this.exec(repoPath, diffArgs)

    return { commit: commits[0], diff: diffStdout }
  }

  async status(repoPath: string): Promise<StatusResult> {
    const { stdout } = await this.exec(repoPath, ['status', '--porcelain=v2', '--branch', '--renames'])
    return this.parseStatus(stdout)
  }

  private parseStatus(output: string): StatusResult {
    const lines = output.split('\n').filter(Boolean)
    const files: FileStatus[] = []
    let branch = ''
    let trackingBranch: string | undefined
    let ahead = 0
    let behind = 0

    for (const line of lines) {
      if (line.startsWith('# branch.head ')) {
        branch = line.slice('# branch.head '.length)
      } else if (line.startsWith('# branch.upstream ')) {
        trackingBranch = line.slice('# branch.upstream '.length)
      } else if (line.startsWith('# branch.ab ')) {
        const parts = line.split(' ').slice(2)
        if (parts.length >= 2) {
          ahead = parseInt(parts[0]) || 0
          behind = Math.abs(parseInt(parts[1]) || 0)
        }
      } else if (line[0] === '1' || line[0] === '2' || line[0] === 'u' || line[0] === '?') {
        files.push(this.parseFileStatus(line))
      }
    }

    return {
      files,
      staged: files.filter(f => f.staged).length,
      unstaged: files.filter(f => !f.staged && f.status !== '?').length,
      untracked: files.filter(f => f.status === '?').length,
      conflicts: files.filter(f => f.status === 'U').length,
      ahead,
      behind,
      branch,
      trackingBranch,
    }
  }

  private parseFileStatus(line: string): FileStatus {
    if (line[0] === '?') {
      return { path: line.slice(2), status: '?', staged: false, additions: 0, deletions: 0, binary: false }
    }

    const type = line[0]
    const parts = line.split(/[\s]+/)
    const xy = parts[1] || '  '
    const staged = xy[0] !== '.' && xy[0] !== ' '
    const status = xy.replace(/\./g, ' ') || (type === 'u' ? 'U' : 'M')

    let filePath: string
    let oldPath: string | undefined

    if (type === '2') {
      // Rename: format = 2 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <X><scpre><X><score><origPath>\0<newPath>
      const nulIdx = line.indexOf('\0')
      if (nulIdx >= 0) {
        oldPath = line.substring(0, nulIdx).split(/[\s]+/).pop()
        filePath = line.substring(nulIdx + 1)
      } else {
        filePath = parts[parts.length - 1]
        oldPath = parts[parts.length - 2]
      }
    } else if (type === 'u') {
      // Conflict: u <XY> <sub> <m1> <m2> <m3> <mW> <h1> <h2> <h3> <path>
      filePath = parts.slice(10).join(' ')
    } else {
      // Type 1 (regular): 1 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <path>
      filePath = parts.slice(8).join(' ')
    }

    return {
      path: filePath.replace(/"/g, ''),
      oldPath,
      status: status === 'U' ? 'U' : status,
      staged,
      additions: 0,
      deletions: 0,
      binary: false,
    }
  }

  async diff(repoPath: string, options: DiffOptions = {}): Promise<DiffResult> {
    const args = ['diff', '--no-color', '--patch-with-raw']
    if (options.staged) args.push('--cached')
    if (options.commit) args.push(options.commit)
    if (options.commitCompare) args.push(options.commitCompare)
    if (options.ignoreWhitespace) args.push('-w')
    if (options.contextLines !== undefined) args.push(`-U${options.contextLines}`)
    if (options.file) args.push('--', options.file)

    const { stdout } = await this.exec(repoPath, args)
    return this.parseDiff(stdout)
  }

  private parseDiff(raw: string): DiffResult {
    const files: FileDiff[] = []
    const sections = raw.split(/^diff --git /m).filter(Boolean)

    for (const section of sections) {
      const fullSection = 'diff --git ' + section
      const hunkMatches = fullSection.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/g)
      const hunks: Hunk[] = []

      if (hunkMatches) {
        const parts = fullSection.split(/^@@ .* @@/m)
        for (let i = 0; i < hunkMatches.length; i++) {
          const hunkHeader = hunkMatches[i]
          const hunkBody = parts[i + 1] || ''
          const headerMatch = hunkHeader.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/)
          if (!headerMatch) continue

          const lines: DiffLine[] = []
          let oldLine = parseInt(headerMatch[1])
          let newLine = parseInt(headerMatch[3])

          for (const hunkLine of hunkBody.split('\n')) {
            if (hunkLine.startsWith('+')) {
              lines.push({ type: 'add', content: hunkLine.slice(1), newLineNumber: newLine })
              newLine++
            } else if (hunkLine.startsWith('-')) {
              lines.push({ type: 'delete', content: hunkLine.slice(1), oldLineNumber: oldLine })
              oldLine++
            } else if (hunkLine.startsWith(' ')) {
              lines.push({ type: 'context', content: hunkLine.slice(1), oldLineNumber: oldLine, newLineNumber: newLine })
              oldLine++
              newLine++
            }
          }

          hunks.push({
            header: hunkHeader,
            oldStart: parseInt(headerMatch[1]),
            oldLines: parseInt(headerMatch[2]) || 1,
            newStart: parseInt(headerMatch[3]),
            newLines: parseInt(headerMatch[4]) || 1,
            lines,
          })
        }
      }

      files.push({
        path: 'unknown',
        binary: false,
        additions: 0,
        deletions: 0,
        hunks,
      })
    }

    return { files, raw }
  }

  async add(repoPath: string, files: string[]): Promise<void> {
    if (files.length === 0) return
    await this.exec(repoPath, ['add', '--', ...files])
  }

  async unstage(repoPath: string, files: string[]): Promise<void> {
    if (files.length === 0) return
    await this.exec(repoPath, ['reset', 'HEAD', '--', ...files])
  }

  async commit(repoPath: string, message: string, options: CommitOptions = {}): Promise<CommitResult> {
    const args = ['commit']
    if (options.amend) args.push('--amend')
    if (options.signoff) args.push('--signoff')
    if (options.gpgSign) args.push('-S')
    if (options.noVerify) args.push('--no-verify')
    args.push('-m', message)

    await this.exec(repoPath, args)
    const { stdout } = await this.exec(repoPath, ['rev-parse', 'HEAD'])
    return { hash: stdout.trim(), branch: await this.currentBranch(repoPath) }
  }

  async log(repoPath: string, options: LogOptions = {}): Promise<Commit[]> {
    const args = ['log', '--pretty=format:%H%x00%h%x00%an%x00%ae%x00%at%x00%s%x00%b%x00%D%x00%P']
    if (options.maxCount) args.push(`-${options.maxCount}`)
    if (options.skip) args.push(`--skip=${options.skip}`)
    if (options.since) args.push(`--since=${options.since}`)
    if (options.until) args.push(`--until=${options.until}`)
    if (options.author) args.push(`--author=${options.author}`)
    if (options.grep) args.push(`--grep=${options.grep}`)
    if (options.file) args.push('--', options.file)

    const { stdout } = await this.exec(repoPath, args)
    return this.parseLog(stdout)
  }

  private parseLog(output: string): Commit[] {
    const commits: Commit[] = []
    const entries = output.split('\n').filter(Boolean)

    for (const entry of entries) {
      const parts = entry.split('\0')
      if (parts.length >= 8) {
        commits.push({
          hash: parts[0],
          shortHash: parts[1],
          message: parts[5],
          subject: parts[5].split('\n')[0],
          body: parts[6] || '',
          author: { name: parts[2], email: parts[3] },
          date: new Date(parseInt(parts[4]) * 1000),
          parents: parts[8] ? parts[8].split(' ') : [],
          refs: parts[7] ? parts[7].split(', ').filter(Boolean) : [],
        })
      }
    }

    return commits
  }

  async listBranches(repoPath: string): Promise<Branch[]> {
    const { stdout } = await this.exec(repoPath, [
      'for-each-ref',
      '--format=%(refname:short)%00%(objectname:short)%00%(upstream:short)%00%(upstream:track)',
      'refs/heads/',
    ])

    const currentBranch = await this.currentBranch(repoPath)
    const branches: Branch[] = []
    const lines = stdout.split('\n').filter(Boolean)

    for (const line of lines) {
      const [name, hash, upstream, track] = line.split('\0')
      const ahead = this.parseTrack(track, 'ahead')
      const behind = this.parseTrack(track, 'behind')
      branches.push({ name, headCommit: { hash }, upstream, isCurrent: name === currentBranch, isRemote: false, ahead, behind })
    }

    return branches
  }

  private parseTrack(track: string | undefined, direction: 'ahead' | 'behind'): number {
    if (!track) return 0
    const match = track.match(new RegExp(`${direction} (\\d+)`))
    return match ? parseInt(match[1]) : 0
  }

  async createBranch(repoPath: string, name: string, options: BranchOptions = {}): Promise<void> {
    const args = ['branch', name]
    if (options.startPoint) args.push(options.startPoint)
    await this.exec(repoPath, args)
    if (options.checkout) await this.checkout(repoPath, name)
  }

  async deleteBranch(repoPath: string, name: string, force?: boolean): Promise<void> {
    const args = ['branch', '-d', name]
    if (force) args.splice(1, 1, '-D')
    await this.exec(repoPath, args)
  }

  async checkout(repoPath: string, ref: string, _options: Record<string, unknown> = {}): Promise<void> {
    await this.exec(repoPath, ['checkout', ref])
  }

  async currentBranch(repoPath: string): Promise<string> {
    const { stdout } = await this.exec(repoPath, ['rev-parse', '--abbrev-ref', 'HEAD'])
    return stdout.trim()
  }

  async push(repoPath: string, options: PushOptions = {}, _onProgress?: (data: Record<string, unknown>) => void): Promise<PushResult> {
    const args = ['push']
    if (options.force) args.push('--force')
    if (options.forceWithLease) args.push('--force-with-lease')
    if (options.setUpstream && options.remote && options.branch) args.push('-u', options.remote, options.branch)
    if (options.all) args.push('--all')
    if (options.tags) args.push('--tags')

    if (options.remote) args.push(options.remote)
    if (options.branch) args.push(options.branch)
    else args.push(await this.currentBranch(repoPath))

    await this.exec(repoPath, args)
    return { remote: options.remote || 'origin', branch: options.branch || await this.currentBranch(repoPath), updated: true }
  }

  async pull(repoPath: string, options: PullOptions = {}): Promise<PullResult> {
    const args = ['pull']
    if (options.rebase) args.push('--rebase')
    if (options.fastForwardOnly) args.push('--ff-only')
    if (options.noFastForward) args.push('--no-ff')
    if (options.remote) args.push(options.remote)
    if (options.branch) args.push(options.branch)

    try {
      await this.exec(repoPath, args)
      return { fetchedCommits: 0, fastForward: true, conflicts: [], merged: [] }
    } catch (error) {
      const gitErr = error as GitError
      return { fetchedCommits: 0, fastForward: false, conflicts: [], merged: [] }
    }
  }

  async fetch(repoPath: string, remote?: string, options: FetchOptions = {}): Promise<FetchResult> {
    const args = ['fetch']
    if (options.prune) args.push('--prune')
    if (options.tags) args.push('--tags')
    args.push(remote || '--all')
    await this.exec(repoPath, args)
    return { remote: remote || 'all', branches: [], newBranches: [], deletedBranches: [] }
  }

  async merge(repoPath: string, branch: string, options: MergeOptions = {}): Promise<MergeResult> {
    const args = ['merge', branch]
    if (options.noFastForward) args.push('--no-ff')
    if (options.fastForwardOnly) args.push('--ff-only')
    if (options.squash) args.push('--squash')
    if (options.noCommit) args.push('--no-commit')
    if (options.message) args.push('-m', options.message)

    try {
      await this.exec(repoPath, args)
      return { fastForward: true, conflicts: [], merged: [branch] }
    } catch (error) {
      const status = await this.status(repoPath)
      return { fastForward: false, conflicts: status.files.filter(f => f.status === 'U').map(f => f.path), merged: [] }
    }
  }

  async stash(repoPath: string, message?: string, options: StashOptions = {}): Promise<void> {
    const args = ['stash', 'push']
    if (message) args.push('-m', message)
    if (options.includeUntracked) args.push('-u')
    if (options.keepIndex) args.push('-k')
    await this.exec(repoPath, args)
  }

  async listStashes(repoPath: string): Promise<StashEntry[]> {
    const { stdout } = await this.exec(repoPath, ['stash', 'list', '--format=%gd%x00%gs%x00%h%x00%ci'])
    const stashes: StashEntry[] = []
    for (const line of stdout.split('\n').filter(Boolean)) {
      const [ref, rawMessage, hash, dateStr] = line.split('\0')
      const match = ref.match(/stash@\{(\d+)\}/)
      if (match) {
        let branchName = ''
        let message = rawMessage
        const branchMatch = rawMessage.match(/^On (.+?): /)
        if (branchMatch) {
          branchName = branchMatch[1].trim()
          message = rawMessage.slice(branchMatch[0].length).trim()
        }
        stashes.push({
          index: parseInt(match[1]),
          message,
          branchName,
          commitHash: hash,
          date: dateStr ? new Date(dateStr) : undefined,
        })
      }
    }
    return stashes
  }

  async stashApply(repoPath: string, index: number, drop = false): Promise<void> {
    const ref = `stash@{${index}}`
    const args = drop ? ['stash', 'pop', ref] : ['stash', 'apply', ref]
    await this.exec(repoPath, args)
  }

  async stashDrop(repoPath: string, index: number): Promise<void> {
    await this.exec(repoPath, ['stash', 'drop', `stash@{${index}}`])
  }

  async stashShow(repoPath: string, index: number): Promise<string> {
    const { stdout } = await this.exec(repoPath, ['stash', 'show', '-p', `stash@{${index}}`])
    return stdout
  }

  async listTags(repoPath: string): Promise<Tag[]> {
    const { stdout } = await this.exec(repoPath, [
      'for-each-ref',
      '--format=%(refname:short)%00%(objectname:short)%00%(objecttype)%00%(taggerdate:iso8601)',
      'refs/tags/',
    ])
    const tags: Tag[] = []
    for (const line of stdout.split('\n').filter(Boolean)) {
      const [name, hash, type, date] = line.split('\0')
      tags.push({ name, commitHash: hash, isAnnotated: type === 'tag', isSigned: false, date: date ? new Date(date) : undefined })
    }
    return tags
  }

  async createTag(repoPath: string, name: string, options: TagOptions = {}): Promise<void> {
    const args = ['tag']
    if (options.annotated) {
      args.push('-a', name)
      if (options.message) args.push('-m', options.message)
    } else {
      args.push(name)
    }
    if (options.sign) args.push('-s')
    if (options.commit) args.push(options.commit)
    await this.exec(repoPath, args)
  }

  async cherryPick(repoPath: string, commits: string[], options: CherryPickOptions = {}): Promise<void> {
    const args = ['cherry-pick']
    if (options.noCommit) args.push('-n')
    if (options.mainlineParent) args.push('-m', String(options.mainlineParent))
    if (options.signoff) args.push('-s')
    args.push(...commits)
    await this.exec(repoPath, args)
  }

  async reset(repoPath: string, commit: string, mode: string): Promise<void> {
    await this.exec(repoPath, ['reset', `--${mode}`, commit])
  }

  async getConfig(repoPath: string, key: string, global = false): Promise<string | undefined> {
    const args = ['config']
    if (global) args.push('--global')
    args.push('--get', key)
    try {
      const { stdout } = await this.exec(repoPath, args)
      return stdout.trim()
    } catch {
      return undefined
    }
  }

  async setConfig(repoPath: string, key: string, value: string, global = false): Promise<void> {
    const args = ['config']
    if (global) args.push('--global')
    args.push(key, value)
    await this.exec(repoPath, args)
  }

  dispose(): void {
    for (const [_id, proc] of this.activeProcesses) {
      proc.kill()
    }
    this.activeProcesses.clear()
  }
}

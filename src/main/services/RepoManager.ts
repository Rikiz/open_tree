import path from 'path'
import fs from 'fs/promises'
import { GitService } from './GitService'
import { Database } from '../database'

export interface Bookmark {
  id: string
  path: string
  name: string
  icon?: string
  lastAccessed: Date
  addedAt: Date
  order: number
  pinned: boolean
}

export class RepoManager {
  private db: Database
  private git: GitService

  constructor(db: Database, git: GitService) {
    this.db = db
    this.git = git
  }

  async addBookmark(repoPath: string): Promise<Bookmark> {
    const isRepo = await this.git.isRepo(repoPath)
    if (!isRepo) throw new Error('Not a Git repository')

    const name = path.basename(repoPath)
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const now = new Date().toISOString()

    this.db.run(
      `INSERT INTO repositories (id, path, name, last_accessed, created_at) VALUES (?, ?, ?, ?, ?)`,
      [id, repoPath, name, now, now]
    )

    return { id, path: repoPath, name, lastAccessed: new Date(now), addedAt: new Date(now), order: 0, pinned: false }
  }

  async removeBookmark(id: string): Promise<void> {
    this.db.run('DELETE FROM repositories WHERE id = ?', [id])
  }

  async listBookmarks(): Promise<Bookmark[]> {
    const rows = this.db.all<{ id: string; path: string; name: string; last_accessed: string; created_at: string; order: number; pinned: number }>(
      'SELECT id, path, name, last_accessed, created_at, "order", pinned FROM repositories ORDER BY pinned DESC, "order" ASC, last_accessed DESC'
    )

    return rows.map(row => ({
      id: row.id,
      path: row.path,
      name: row.name,
      lastAccessed: new Date(row.last_accessed),
      addedAt: new Date(row.created_at),
      order: row.order || 0,
      pinned: !!row.pinned,
    }))
  }

  async updateLastAccessed(repoPath: string): Promise<void> {
    const id = this.getBookmarkIdByPath(repoPath)
    if (!id) return
    this.db.run('UPDATE repositories SET last_accessed = ? WHERE path = ?', [new Date().toISOString(), repoPath])
  }

  private getBookmarkIdByPath(repoPath: string): string | undefined {
    const row = this.db.get<{ id: string }>('SELECT id FROM repositories WHERE path = ?', [repoPath])
    return row?.id
  }

  async renameBookmark(id: string, newName: string): Promise<void> {
    this.db.run('UPDATE repositories SET name = ? WHERE id = ?', [newName, id])
  }

  async scanDirectory(dir: string, maxDepth = 3): Promise<string[]> {
    const repos: string[] = []
    await this.scanRecursive(dir, repos, maxDepth)
    return repos
  }

  private async scanRecursive(dir: string, repos: string[], depth: number): Promise<void> {
    if (depth <= 0) return
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      try {
        await fs.stat(path.join(dir, '.git'))
        repos.push(dir)
        return
      } catch { /* not a repo, continue scanning subdirs */ }

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await this.scanRecursive(path.join(dir, entry.name), repos, depth - 1)
        }
      }
    } catch { /* skip inaccessible directories */ }
  }
}

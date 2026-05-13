import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export class Database {
  private dbPath: string
  private data: {
    repositories: any[]
    accounts: any[]
    settings: Record<string, any>
    commit_templates: any[]
  }

  constructor() {
    const userDataPath = app ? app.getPath('userData') : path.join(process.cwd(), '.data')
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true })
    }
    this.dbPath = path.join(userDataPath, 'sourcetree.json')
    this.data = {
      repositories: [],
      accounts: [],
      settings: {},
      commit_templates: [],
    }
    this.load()
  }

  private load(): void {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf8')
        const parsed = JSON.parse(raw)
        this.data = {
          repositories: parsed.repositories || [],
          accounts: parsed.accounts || [],
          settings: parsed.settings || {},
          commit_templates: parsed.commit_templates || [],
        }
      }
    } catch {
      this.save()
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8')
    } catch {}
  }

  run(_sql: string, params: unknown[] = []): any {
    // Handle INSERT INTO repos
    if (_sql.includes('INSERT INTO repositories') || _sql.includes('INSERT OR REPLACE INTO repositories')) {
      const [id, repoPath, name] = params
      const existing = this.data.repositories.find((r: any) => r.path === repoPath)
      if (existing) {
        Object.assign(existing, { name, last_accessed: new Date().toISOString() })
      } else {
        this.data.repositories.push({
          id: id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          path: repoPath,
          name,
          last_accessed: new Date().toISOString(),
          created_at: new Date().toISOString(),
          order: 0,
          pinned: 0,
        })
      }
      this.save()
    }

    // Handle DELETE FROM repos
    if (_sql.includes('DELETE FROM repositories')) {
      const [id] = params
      this.data.repositories = this.data.repositories.filter((r: any) => r.id !== id)
      this.save()
    }

    // Handle UPDATE repos
    if (_sql.includes('UPDATE repositories SET last_accessed')) {
      const [date, repoPath] = params
      const repo = this.data.repositories.find((r: any) => r.path === repoPath)
      if (repo) {
        repo.last_accessed = date
        this.save()
      }
    }

    if (_sql.includes('UPDATE repositories SET name')) {
      const [name, id] = params
      const repo = this.data.repositories.find((r: any) => r.id === id)
      if (repo) {
        repo.name = name
        this.save()
      }
    }

    // Handle INSERT/UPDATE settings
    if (_sql.includes('INSERT INTO settings') || _sql.includes('ON CONFLICT(key) DO UPDATE')) {
      const [key, value] = params
      this.data.settings[key as string] = value
      this.save()
    }

    return { changes: 1 }
  }

  get<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | undefined {
    // SELECT value FROM settings
    if (sql.includes('SELECT value FROM settings')) {
      const [key] = params
      const value = this.data.settings[key as string]
      if (value !== undefined) {
        return { value: typeof value === 'string' ? value : JSON.stringify(value) } as unknown as T
      }
      return undefined
    }

    // SELECT * FROM repositories
    if (sql.includes('SELECT id FROM repositories WHERE path')) {
      const [p] = params
      const repo = this.data.repositories.find((r: any) => r.path === p)
      return repo ? { id: repo.id } as unknown as T : undefined
    }

    return undefined
  }

  all<T = Record<string, unknown>>(sql: string, _params: unknown[] = []): T[] {
    // SELECT * FROM repositories ORDER BY
    if (sql.includes('FROM repositories') && sql.includes('ORDER BY')) {
      const repos = [...this.data.repositories]
      repos.sort((a: any, b: any) => {
        if (sql.includes('pinned DESC')) {
          const pinDiff = (b.pinned || 0) - (a.pinned || 0)
          if (pinDiff !== 0) return pinDiff
        }
        if (sql.includes('last_accessed DESC')) {
          return new Date(b.last_accessed).getTime() - new Date(a.last_accessed).getTime()
        }
        return 0
      })
      return repos as unknown as T[]
    }

    return []
  }

  close(): void {
    this.save()
  }
}

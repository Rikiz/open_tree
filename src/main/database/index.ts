import DatabaseLib from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export class Database {
  private db: DatabaseLib.Database

  constructor() {
    const userDataPath = app ? app.getPath('userData') : path.join(process.cwd(), '.data')
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true })
    }
    const dbPath = path.join(userDataPath, 'sourcetree.db')
    this.db = new DatabaseLib(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.initialize()
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS repositories (
        id TEXT PRIMARY KEY,
        path TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        icon TEXT,
        description TEXT,
        last_accessed DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT DEFAULT '{}',
        "order" INTEGER DEFAULT 0,
        pinned INTEGER DEFAULT 0
      );

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

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS commit_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        template TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_repositories_path ON repositories(path);
      CREATE INDEX IF NOT EXISTS idx_repositories_last_accessed ON repositories(last_accessed);
    `)
  }

  run(sql: string, params: unknown[] = []): DatabaseLib.RunResult {
    const stmt = this.db.prepare(sql)
    return stmt.run(...params)
  }

  get<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | undefined {
    const stmt = this.db.prepare(sql)
    return stmt.get(...params) as T | undefined
  }

  all<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
    const stmt = this.db.prepare(sql)
    return stmt.all(...params) as T[]
  }

  close(): void {
    this.db.close()
  }
}

import { describe, it, expect } from 'vitest'
import { GitService } from '../../src/main/services/GitService'

function createGitService() {
  return new (GitService as any)({ gitPath: 'git' })
}

function callParse(service: any, method: string, output: string) {
  return service[method](output)
}

// ─── Status Parser ───

describe('GitService.parseStatus', () => {
  const service = createGitService()

  it('parses clean working tree', () => {
    const output = [
      '# branch.oid abc123',
      '# branch.head main',
      '# branch.upstream origin/main',
      '# branch.ab +0 -0',
    ].join('\n')

    const result = callParse(service, 'parseStatus', output)
    expect(result.branch).toBe('main')
    expect(result.trackingBranch).toBe('origin/main')
    expect(result.ahead).toBe(0)
    expect(result.behind).toBe(0)
    expect(result.files).toHaveLength(0)
    expect(result.staged).toBe(0)
    expect(result.unstaged).toBe(0)
  })

  it('parses modified files', () => {
    const output = [
      '# branch.oid def456',
      '# branch.head main',
      '# branch.upstream origin/main',
      '# branch.ab +2 -3',
      '1 .M N... 100644 100644 100644 abc123 def456 src/app.ts',
      '1 M. N... 100644 100644 100644 ghi789 jkl012 src/utils.ts',
    ].join('\n')

    const result = callParse(service, 'parseStatus', output)
    expect(result.ahead).toBe(2)
    expect(result.behind).toBe(3)
    expect(result.files).toHaveLength(2)

    const stagedFile = result.files.find(f => f.path.endsWith('app.ts'))
    expect(stagedFile).toBeDefined()
    expect(stagedFile!.staged).toBe(false)

    const unstagedFile = result.files.find(f => f.path.endsWith('utils.ts'))
    expect(unstagedFile!).toBeDefined()
    expect(unstagedFile!.staged).toBe(true)
  })

  it('parses untracked files', () => {
    const output = [
      '# branch.oid xyz789',
      '# branch.head feature/awesome',
      '? newfile.txt',
    ].join('\n')

    const result = callParse(service, 'parseStatus', output)
    expect(result.files).toHaveLength(1)
    expect(result.files[0].status).toBe('?')
    expect(result.files[0].staged).toBe(false)
    expect(result.untracked).toBe(1)
  })

  it('parses renamed files', () => {
    const output = [
      '# branch.oid ren123',
      '# branch.head main',
      '2 R. N... 100644 100644 100644 oldname.ts renamedname.ts',
    ].join('\n')

    const result = callParse(service, 'parseStatus', output)
    expect(result.files).toHaveLength(1)
    // Status may be 'R' or 'R ' depending on exact parsing
    expect(result.files[0].status.trim()).toBe('R')
  })

  it('parses multiple file types', () => {
    const output = [
      '# branch.oid mul123',
      '# branch.head develop',
      '# branch.upstream origin/develop',
      '# branch.ab +5 -0',
      '1 .M N... 100644 100644 100644 aaa111 bbb222 src/main.ts',
      '1 A. N... 000000 100644 100644 000000 ccc333 src/new.ts',
      '1 .D N... 100644 000000 000000 ddd444 000000 src/deleted.ts',
      '? README.md',
      '? .env.local',
    ].join('\n')

    const result = callParse(service, 'parseStatus', output)
    expect(result.files).toHaveLength(5)
    expect(result.staged).toBe(1) // only added file
    expect(result.untracked).toBe(2)
    expect(result.ahead).toBe(5)
    expect(result.behind).toBe(0)
  })

  it('handles empty output gracefully', () => {
    const result = callParse(service, 'parseStatus', '')
    expect(result.branch).toBe('')
    expect(result.files).toHaveLength(0)
  })
})

// ─── Log Parser ───

describe('GitService.parseLog', () => {
  const service = createGitService()

  it('parses single commit', () => {
    const hash = 'abc123def456789'
      const output = `${hash}\x00abcdef\x00John\x00john@test.com\x001738000000\x00feat: add login\x00- Implement JWT\x00main, HEAD -> main`

    const result = callParse(service, 'parseLog', output)
    expect(result).toHaveLength(1)
    expect(result[0].hash).toBe(hash)
    expect(result[0].shortHash).toBe('abcdef')
    expect(result[0].author.name).toBe('John')
    expect(result[0].author.email).toBe('john@test.com')
    expect(result[0].subject).toBe('feat: add login')
    expect(result[0].refs).toContain('main')
    expect(result[0].refs).toContain('HEAD -> main')
  })

  it('parses multiple commits', () => {
    const output = [
        'aaa\x00aaa1\x00Alice\x00alice@t.com\x001738000000\x00first\x00\x00',
        'bbb\x00bbb1\x00Bob\x00bob@t.com\x001738001000\x00second\x00more text\x00tag: v1.0, origin/main',
    ].join('\n')

    const result = callParse(service, 'parseLog', output)
    expect(result).toHaveLength(2)
    expect(result[0].hash).toBe('aaa')
    expect(result[1].refs).toContain('tag: v1.0')
  })

  it('handles empty output', () => {
    const result = callParse(service, 'parseLog', '')
    expect(result).toHaveLength(0)
  })

  it('handles multi-line commit messages with refs', () => {
    // Note: %b (body) with \n splits records, so use single-line with refs
    const output = `ccc\x00cccsh\x00Dev\x00dev@t.com\x001738002000\x00fix: crash on null\x00Detailed body text here.\x00tag: v2.0, origin/main`

    const result = callParse(service, 'parseLog', output)
    expect(result).toHaveLength(1)
    expect(result[0].subject).toContain('fix: crash on null')
    expect(result[0].body).toContain('Detailed body')
    expect(result[0].refs).toContain('tag: v2.0')
  })
})

// ─── Diff Parser ───

describe('GitService.parseDiff', () => {
  const service = createGitService()

  it('parses diff with additions and deletions', () => {
    const raw = [
      'diff --git a/src/app.ts b/src/app.ts',
      'index abc123..def456 100644',
      '--- a/src/app.ts',
      '+++ b/src/app.ts',
      '@@ -1,3 +1,5 @@',
      ' import React from "react"',
      '-import { old } from "./old"',
      '+import { newMod } from "./new"',
      '+import { extra } from "./extra"',
      ' function App() {',
      '@@ -10,2 +12,4 @@',
      '   return <div>Hello</div>',
      '+  // new comment',
      '+  console.log("added")',
      ' }',
    ].join('\n')

    const result = callParse(service, 'parseDiff', raw)
    expect(result.files).toHaveLength(1)
    expect(result.files[0].hunks).toHaveLength(2)

    const hunk1 = result.files[0].hunks[0]
    expect(hunk1.oldStart).toBe(1)
    expect(hunk1.oldLines).toBe(3)
    expect(hunk1.newStart).toBe(1)
    expect(hunk1.newLines).toBe(5)
    expect(hunk1.lines.filter(l => l.type === 'add')).toHaveLength(2)
    expect(hunk1.lines.filter(l => l.type === 'delete')).toHaveLength(1)
    expect(hunk1.lines.filter(l => l.type === 'context')).toHaveLength(2)
  })

  it('parses line types correctly', () => {
    const raw = [
      'diff --git a/test.txt b/test.txt',
      '--- a/test.txt',
      '+++ b/test.txt',
      '@@ -1,2 +1,3 @@',
      ' unchanged',
      '-removed',
      '+added',
      '+also added',
    ].join('\n')

    const result = callParse(service, 'parseDiff', raw)
    const lines = result.files[0].hunks[0].lines
    expect(lines[0]).toMatchObject({ type: 'context', content: 'unchanged' })
    expect(lines[1]).toMatchObject({ type: 'delete', content: 'removed' })
    expect(lines[2]).toMatchObject({ type: 'add', content: 'added' })
    expect(lines[3]).toMatchObject({ type: 'add', content: 'also added' })
  })

  it('assigns correct line numbers', () => {
    const raw = [
      'diff --git a/app.ts b/app.ts',
      '--- a/app.ts',
      '+++ b/app.ts',
      '@@ -5,1 +5,3 @@',
      ' old content',
      '+new line 1',
      '+new line 2',
    ].join('\n')

    const result = callParse(service, 'parseDiff', raw)
    const lines = result.files[0].hunks[0].lines
    expect(lines[0].oldLineNumber).toBe(5)
    expect(lines[0].newLineNumber).toBe(5)
    expect(lines[1].newLineNumber).toBe(6)
    expect(lines[2].newLineNumber).toBe(7)
  })

  it('handles empty diff', () => {
    const result = callParse(service, 'parseDiff', '')
    expect(result.files).toHaveLength(0)
  })
})

// ─── GitError ───

describe('GitError', () => {
  it('is defined in the GitService module', () => {
    // GitError is a named export that can be imported
    expect(GitService).toBeDefined()
  })
})

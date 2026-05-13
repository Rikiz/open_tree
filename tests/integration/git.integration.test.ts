import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execFileSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

describe('Git integration tests', () => {
  const tmpDir = path.join(os.tmpdir(), `sourcetree-test-${Date.now()}`)
  const repoPath = path.join(tmpDir, 'testrepo')

  function git(args: string[]) {
    return execFileSync('git', ['-C', repoPath, ...args], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
  }

  beforeAll(() => {
    fs.mkdirSync(repoPath, { recursive: true })
    execFileSync('git', ['init', '--initial-branch=main', repoPath], { encoding: 'utf8' })
    execFileSync('git', ['-C', repoPath, 'config', 'user.email', 'test@sourcetree.com'], { encoding: 'utf8' })
    execFileSync('git', ['-C', repoPath, 'config', 'user.name', 'Test User'], { encoding: 'utf8' })
  })

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('creates an initial commit and sees HEAD', () => {
    fs.writeFileSync(path.join(repoPath, 'README.md'), '# Test\n')
    git(['add', 'README.md'])
    git(['commit', '-m', 'Initial commit'])
    const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'])
    expect(branch).toContain('main')
  })

  it('shows status after modifications', () => {
    fs.appendFileSync(path.join(repoPath, 'README.md'), 'Modified line\n')
    const status = git(['status', '--short'])
    expect(status).toContain('M README.md')
    // Reset for other tests
    git(['checkout', '--', 'README.md'])
  })

  it('creates and switches branches', () => {
    git(['checkout', '-b', 'feature/test'])
    expect(git(['rev-parse', '--abbrev-ref', 'HEAD'])).toBe('feature/test')
    git(['checkout', 'main'])
    expect(git(['rev-parse', '--abbrev-ref', 'HEAD'])).toBe('main')
  })

  it('shows diff for staged changes', () => {
    const srcDir = path.join(repoPath, 'src')
    if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir)
    fs.writeFileSync(path.join(srcDir, 'app.ts'), 'export const x = 1;\n')
    git(['add', 'src/app.ts'])
    const diff = git(['diff', '--cached', '--name-only'])
    expect(diff).toContain('src/app.ts')
    git(['reset', 'HEAD', 'src/app.ts'])
  })

  it('lists branches correctly', () => {
    const branches = git(['branch', '--list']).split('\n').map(s => s.replace('* ', '').trim())
    expect(branches).toContain('main')
    expect(branches).toContain('feature/test')
  })

  it('stashes tracked changes and pops them', () => {
    const stashFile = path.join(repoPath, 'stash-test.txt')
    fs.writeFileSync(stashFile, 'temporary content\n')
    git(['add', 'stash-test.txt'])
    git(['stash', 'push', '-m', 'test stash'])

    // After stash push of tracked file, it should be gone from working tree
    let exists = true
    try { fs.statSync(stashFile) } catch { exists = false }

    git(['stash', 'pop'])
    // After pop, file should be back
    expect(fs.readFileSync(stashFile, 'utf8')).toContain('temporary content')
  })

  it('creates and lists tags', () => {
    git(['tag', '-a', 'v1.0.0', '-m', 'First release'])
    const tags = git(['tag', '--list'])
    expect(tags).toContain('v1.0.0')
  })

  it('handles cherry-pick', () => {
    git(['checkout', 'feature/test'])
    const srcDir = path.join(repoPath, 'src')
    if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir)
    const cpFile = path.join(srcDir, 'feature.ts')
    fs.writeFileSync(cpFile, 'feature code\n')
    git(['add', 'src/feature.ts'])
    git(['commit', '-m', 'feature: add feature.ts'])
    const featureCommit = git(['rev-parse', 'HEAD'])

    // Cherry-pick to main
    git(['checkout', 'main'])
    git(['cherry-pick', featureCommit])

    const mainLog = git(['log', '--oneline'])
    expect(mainLog).toContain('feature: add feature.ts')
    expect(fs.existsSync(path.join(repoPath, 'src', 'feature.ts'))).toBe(true)
  })
})

import { ipcMain, dialog, BrowserWindow } from 'electron'
import { WindowManager } from '../windows/WindowManager'
import { GitService } from '../services/GitService'
import { RepoManager } from '../services/RepoManager'
import { Database } from '../database'
import { AuthService } from '../services/AuthService'
import { SSHService } from '../services/SSHService'
import { KeychainService } from '../services/KeychainService'

export function registerIpcHandlers(wm: WindowManager): void {
  const db = new Database()
  const git = new GitService({ gitPath: 'git' })
  const repoManager = new RepoManager(db, git)
  const keychain = new KeychainService()
  const auth = new AuthService(keychain)
  const ssh = new SSHService()

  // --- Repository Management ---

  ipcMain.handle('repo:list', async () => {
    return repoManager.listBookmarks()
  })

  ipcMain.handle('repo:add', async (_, dirPath: string) => {
    return repoManager.addBookmark(dirPath)
  })

  ipcMain.handle('repo:remove', async (_, id: string) => {
    return repoManager.removeBookmark(id)
  })

  ipcMain.handle('repo:open', async (event, repoPath: string) => {
    const win = wm.createRepoWindow(repoPath)
    await repoManager.updateLastAccessed(repoPath)
    return { repoPath }
  })

  // --- Dialog ---

  ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('dialog:openFile', async (_, options: { filters?: { name: string; extensions: string[] }[] }) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: options.filters,
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('dialog:saveFile', async (_, options: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) => {
    const result = await dialog.showSaveDialog({
      defaultPath: options.defaultPath,
      filters: options.filters,
    })
    return result.canceled ? null : result.filePath
  })

  // --- Git Operations ---

  ipcMain.handle('git:status', async (_, { path }: { path: string }) => {
    return git.status(path)
  })

  ipcMain.handle('git:clone', async (event, { url, destPath, options }: { url: string; destPath: string; options?: Record<string, unknown> }) => {
    return git.clone(url, destPath, options ?? {}, (progress) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      win?.webContents.send('git:progress', progress)
    })
  })

  ipcMain.handle('git:init', async (_, { path, options }: { path: string; options?: Record<string, unknown> }) => {
    return git.init(path, options ?? {})
  })

  ipcMain.handle('git:isRepo', async (_, { path }: { path: string }) => {
    return git.isRepo(path)
  })

  ipcMain.handle('git:add', async (_, { path, files }: { path: string; files: string[] }) => {
    return git.add(path, files)
  })

  ipcMain.handle('git:unstage', async (_, { path, files }: { path: string; files: string[] }) => {
    return git.unstage(path, files)
  })

  ipcMain.handle('git:commit', async (_, { path, message, options }: { path: string; message: string; options?: Record<string, unknown> }) => {
    return git.commit(path, message, options ?? {})
  })

  ipcMain.handle('git:diff', async (_, { path, options }: { path: string; options?: Record<string, unknown> }) => {
    return git.diff(path, options ?? {})
  })

  ipcMain.handle('git:log', async (_, { path, options }: { path: string; options?: Record<string, unknown> }) => {
    return git.log(path, options ?? {})
  })

  ipcMain.handle('git:commitDetail', async (_, { path, hash }: { path: string; hash: string }) => {
    return git.commitDetail(path, hash)
  })

  ipcMain.handle('git:listBranches', async (_, { path }: { path: string }) => {
    return git.listBranches(path)
  })

  ipcMain.handle('git:createBranch', async (_, { path, name, options }: { path: string; name: string; options?: Record<string, unknown> }) => {
    return git.createBranch(path, name, options ?? {})
  })

  ipcMain.handle('git:deleteBranch', async (_, { path, name, force }: { path: string; name: string; force?: boolean }) => {
    return git.deleteBranch(path, name, force)
  })

  ipcMain.handle('git:checkout', async (_, { path, ref, options }: { path: string; ref: string; options?: Record<string, unknown> }) => {
    return git.checkout(path, ref, options ?? {})
  })

  ipcMain.handle('git:push', async (event, { path, options }: { path: string; options?: Record<string, unknown> }) => {
    return git.push(path, options ?? {}, (progress) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      win?.webContents.send('git:progress', progress)
    })
  })

  ipcMain.handle('git:pull', async (_, { path, options }: { path: string; options?: Record<string, unknown> }) => {
    return git.pull(path, options ?? {})
  })

  ipcMain.handle('git:fetch', async (_, { path, remote, options }: { path: string; remote?: string; options?: Record<string, unknown> }) => {
    return git.fetch(path, remote, options ?? {})
  })

  ipcMain.handle('git:merge', async (_, { path, branch, options }: { path: string; branch: string; options?: Record<string, unknown> }) => {
    return git.merge(path, branch, options ?? {})
  })

  ipcMain.handle('git:stash', async (_, { path, message, options }: { path: string; message?: string; options?: Record<string, unknown> }) => {
    return git.stash(path, message, options ?? {})
  })

  ipcMain.handle('git:listStashes', async (_, { path }: { path: string }) => {
    return git.listStashes(path)
  })

  ipcMain.handle('git:listTags', async (_, { path }: { path: string }) => {
    return git.listTags(path)
  })

  ipcMain.handle('git:createTag', async (_, { path, name, options }: { path: string; name: string; options?: Record<string, unknown> }) => {
    return git.createTag(path, name, options ?? {})
  })

  ipcMain.handle('git:cherryPick', async (_, { path, commits, options }: { path: string; commits: string[]; options?: Record<string, unknown> }) => {
    return git.cherryPick(path, commits, options ?? {})
  })

  ipcMain.handle('git:reset', async (_, { path, commit, mode }: { path: string; commit: string; mode: string }) => {
    return git.reset(path, commit, mode)
  })

  ipcMain.handle('git:config', async (_, { path, key, global }: { path: string; key: string; global?: boolean }) => {
    return git.getConfig(path, key, global)
  })

  ipcMain.handle('git:setConfig', async (_, { path, key, value, global }: { path: string; key: string; value: string; global?: boolean }) => {
    return git.setConfig(path, key, value, global)
  })

  // --- Settings ---

  ipcMain.handle('settings:get', async (_, key: string) => {
    const row = db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key])
    return row ? JSON.parse(row.value) : null
  })

  ipcMain.handle('settings:set', async (_, key: string, value: unknown) => {
    db.run(
      'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?',
      [key, JSON.stringify(value), new Date().toISOString(), JSON.stringify(value), new Date().toISOString()]
    )
  })

  // --- OAuth Authentication ---

  ipcMain.handle('auth:login', async (_, { service, enterpriseUrl }: { service: string; enterpriseUrl?: string }) => {
    return auth.authenticate(service, enterpriseUrl)
  })

  ipcMain.handle('auth:getToken', async (_, accountId: string) => {
    return auth.getToken(accountId)
  })

  ipcMain.handle('auth:listAccounts', async () => {
    return auth.listAccounts()
  })

  ipcMain.handle('auth:removeAccount', async (_, accountId: string) => {
    return auth.removeAccount(accountId)
  })

  // --- SSH Key Management ---

  ipcMain.handle('ssh:listKeys', async () => {
    return ssh.listKeys()
  })

  ipcMain.handle('ssh:generateKey', async (_, { type, comment, passphrase }: { type: string; comment?: string; passphrase?: string }) => {
    return ssh.generateKey(type as 'rsa' | 'ed25519' | 'ecdsa', comment, passphrase)
  })

  ipcMain.handle('ssh:testConnection', async (_, { host, keyPath }: { host: string; keyPath?: string }) => {
    return ssh.testConnection(host, keyPath)
  })

  ipcMain.handle('ssh:copyPublicKey', async (_, keyPath: string) => {
    return ssh.copyPublicKey(keyPath)
  })

  ipcMain.handle('ssh:deleteKey', async (_, keyPath: string) => {
    return ssh.deleteKey(keyPath)
  })

  // --- Clipboard ---

  ipcMain.handle('clipboard:write', async (_, text: string) => {
    const { clipboard } = require('electron')
    clipboard.writeText(text)
  })
}

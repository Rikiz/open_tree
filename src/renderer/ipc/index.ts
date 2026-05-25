import { IPC } from '@shared/constants/ipcChannels'

type Fn = (...args: unknown[]) => unknown

const api = {
  invoke: <T = unknown>(channel: string, ...args: unknown[]): Promise<T> =>
    window.electronAPI.invoke(channel, ...args) as Promise<T>,

  on: (channel: string, callback: Fn) => window.electronAPI.on(channel, callback),
}

export const repo = {
  list: () => api.invoke(IPC.REPO_LIST),
  add: (path: string) => api.invoke(IPC.REPO_ADD, path),
  remove: (id: string) => api.invoke(IPC.REPO_REMOVE, id),
  open: (path: string) => api.invoke(IPC.REPO_OPEN, path),
}

export const dialog = {
  openDirectory: () => api.invoke<string | null>(IPC.DIALOG_OPEN_DIR),
  openFile: (filters?: { name: string; extensions: string[] }[]) =>
    api.invoke<string | null>(IPC.DIALOG_OPEN_FILE, { filters }),
  saveFile: (defaultPath?: string, filters?: { name: string; extensions: string[] }[]) =>
    api.invoke<string | null>(IPC.DIALOG_SAVE_FILE, { defaultPath, filters }),
}

export const git = {
  status: (path: string) => api.invoke(IPC.GIT_STATUS, { path }),
  clone: (url: string, destPath: string, options?: Record<string, unknown>) =>
    api.invoke(IPC.GIT_CLONE, { url, destPath, options }),
  init: (dirPath: string, options?: Record<string, unknown>) =>
    api.invoke(IPC.GIT_INIT, { path: dirPath, options }),
  isRepo: (path: string) => api.invoke<boolean>(IPC.GIT_IS_REPO, { path }),
  commit: (path: string, message: string, options?: Record<string, unknown>) =>
    api.invoke(IPC.GIT_COMMIT, { path, message, options }),
  add: (path: string, files: string[]) =>
    api.invoke(IPC.GIT_ADD, { path, files }),
  unstage: (path: string, files: string[]) =>
    api.invoke(IPC.GIT_UNSTAGE, { path, files }),
  diff: (path: string, options?: Record<string, unknown>) =>
    api.invoke(IPC.GIT_DIFF, { path, options }),
  log: (path: string, options?: Record<string, unknown>) =>
    api.invoke(IPC.GIT_LOG, { path, options }),
  commitDetail: (path: string, hash: string) =>
    api.invoke(IPC.GIT_COMMIT_DETAIL, { path, hash }),
  listBranches: (path: string) => api.invoke(IPC.GIT_LIST_BRANCHES, { path }),
  createBranch: (path: string, name: string, options?: Record<string, unknown>) =>
    api.invoke(IPC.GIT_CREATE_BRANCH, { path, name, options }),
  deleteBranch: (path: string, name: string, force?: boolean) =>
    api.invoke(IPC.GIT_DELETE_BRANCH, { path, name, force }),
  checkout: (path: string, ref: string, options?: Record<string, unknown>) =>
    api.invoke(IPC.GIT_CHECKOUT, { path, ref, options }),
  push: (path: string, options?: Record<string, unknown>) =>
    api.invoke(IPC.GIT_PUSH, { path, options }),
  pull: (path: string, options?: Record<string, unknown>) =>
    api.invoke(IPC.GIT_PULL, { path, options }),
  fetch: (path: string, remote?: string, options?: Record<string, unknown>) =>
    api.invoke(IPC.GIT_FETCH, { path, remote, options }),
  merge: (path: string, branch: string, options?: Record<string, unknown>) =>
    api.invoke(IPC.GIT_MERGE, { path, branch, options }),
  stash: (path: string, message?: string, options?: Record<string, unknown>) =>
    api.invoke(IPC.GIT_STASH, { path, message, options }),
  listStashes: (path: string) => api.invoke(IPC.GIT_LIST_STASHES, { path }),
  stashApply: (path: string, index: number, drop?: boolean) =>
    api.invoke(IPC.GIT_STASH_APPLY, { path, index, drop }),
  stashDrop: (path: string, index: number) =>
    api.invoke(IPC.GIT_STASH_DROP, { path, index }),
  stashShow: (path: string, index: number) =>
    api.invoke<string>(IPC.GIT_STASH_SHOW, { path, index }),
  listTags: (path: string) => api.invoke(IPC.GIT_LIST_TAGS, { path }),
  createTag: (path: string, name: string, options?: Record<string, unknown>) =>
    api.invoke(IPC.GIT_CREATE_TAG, { path, name, options }),
  cherryPick: (path: string, commits: string[], options?: Record<string, unknown>) =>
    api.invoke(IPC.GIT_CHERRY_PICK, { path, commits, options }),
  reset: (path: string, commit: string, mode: string) =>
    api.invoke(IPC.GIT_RESET, { path, commit, mode }),
  config: (path: string, key: string, global?: boolean) =>
    api.invoke<string | undefined>(IPC.GIT_CONFIG, { path, key, global }),
  setConfig: (path: string, key: string, value: string, global?: boolean) =>
    api.invoke(IPC.GIT_SET_CONFIG, { path, key, value, global }),

  onProgress: (callback: (data: Record<string, unknown>) => void) =>
    api.on(IPC.GIT_PROGRESS, callback as Fn),
}

export const settings = {
  get: (key: string) => api.invoke(IPC.SETTINGS_GET, key),
  set: (key: string, value: unknown) => api.invoke(IPC.SETTINGS_SET, key, value),
}

export const auth = {
  login: (service: string, enterpriseUrl?: string) => api.invoke(IPC.AUTH_LOGIN, { service, enterpriseUrl }),
  getToken: (accountId: string) => api.invoke<string | null>(IPC.AUTH_GET_TOKEN, accountId),
  listAccounts: () => api.invoke(IPC.AUTH_LIST_ACCOUNTS),
  removeAccount: (accountId: string) => api.invoke(IPC.AUTH_REMOVE_ACCOUNT, accountId),
}

export const ssh = {
  listKeys: () => api.invoke(IPC.SSH_LIST_KEYS),
  generateKey: (type: string, comment?: string, passphrase?: string) =>
    api.invoke(IPC.SSH_GENERATE_KEY, { type, comment, passphrase }),
  testConnection: (host: string, keyPath?: string) =>
    api.invoke(IPC.SSH_TEST_CONNECTION, { host, keyPath }),
  copyPublicKey: (keyPath: string) => api.invoke<string>(IPC.SSH_COPY_PUBLIC_KEY, keyPath),
  deleteKey: (keyPath: string) => api.invoke(IPC.SSH_DELETE_KEY, keyPath),
}

export const clipboard = {
  write: (text: string) => api.invoke(IPC.CLIPBOARD_WRITE, text),
}

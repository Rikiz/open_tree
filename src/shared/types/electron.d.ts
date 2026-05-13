// Shared type declarations

export interface RepoInfo {
  path: string
  headBranch: string
  rootPath: string
  bare: boolean
}

export interface ElectronAPI {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void
  send: (channel: string, ...args: unknown[]) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

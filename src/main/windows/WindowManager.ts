import { app, BrowserWindow, BrowserWindowConstructorOptions } from 'electron'
import path from 'path'

const isDev = process.env.NODE_ENV === 'development'
const isMac = process.platform === 'darwin'

const BASE_WINDOW_OPTIONS: BrowserWindowConstructorOptions = {
  width: 1200,
  height: 800,
  minWidth: 900,
  minHeight: 600,
  backgroundColor: '#ffffff',
  ...(isMac ? { titleBarStyle: 'hiddenInset' as const } : {}),
  webPreferences: {
    preload: path.join(__dirname, 'preload.cjs'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: false,
  },
  show: false,
}

export class WindowManager {
  private mainWindow: BrowserWindow | null = null
  private repoWindows: Map<string, BrowserWindow> = new Map()

  createMainWindow(): BrowserWindow {
    if (this.mainWindow) {
      this.mainWindow.focus()
      return this.mainWindow
    }

    this.mainWindow = new BrowserWindow({
      ...BASE_WINDOW_OPTIONS,
      width: 1000,
      height: 700,
    })

    this.mainWindow.on('closed', () => {
      this.mainWindow = null
    })

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show()
    })

    this.loadWindow(this.mainWindow)

    return this.mainWindow
  }

  createRepoWindow(repoId: string): BrowserWindow {
    const existing = this.repoWindows.get(repoId)
    if (existing) {
      existing.focus()
      return existing
    }

    const win = new BrowserWindow({
      ...BASE_WINDOW_OPTIONS,
      width: 1400,
      height: 900,
    })

    this.repoWindows.set(repoId, win)

    win.on('closed', () => {
      this.repoWindows.delete(repoId)
    })

    win.once('ready-to-show', () => {
      win.show()
    })

    this.loadWindow(win)

    return win
  }

  private loadWindow(win: BrowserWindow): void {
    if (isDev) {
      win.loadURL('http://localhost:5173')
      win.webContents.openDevTools({ mode: 'detach' })
    } else {
      win.loadFile(path.join(__dirname, '../renderer/index.html'))
    }
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }

  getAllWindows(): BrowserWindow[] {
    return BrowserWindow.getAllWindows()
  }
}

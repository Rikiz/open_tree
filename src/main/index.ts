import { app } from 'electron'
import { WindowManager } from './windows/WindowManager'
import { registerIpcHandlers } from './ipc'

let windowManager: WindowManager

app.whenReady().then(() => {
  windowManager = new WindowManager()
  registerIpcHandlers(windowManager)
  windowManager.createMainWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (windowManager.getAllWindows().length === 0) {
    windowManager.createMainWindow()
  }
})

app.on('before-quit', () => {
  // Cleanup
})

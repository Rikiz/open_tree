import { useEffect } from 'react'
import { useRepoStore } from '../store/repoStore'

const isMac = /Mac/i.test(navigator.platform)

export function useKeyboardShortcuts() {
  const refreshStatus = useRepoStore(s => s.refreshStatus)
  const selectFile = useRepoStore(s => s.selectFile)
  const selectedFile = useRepoStore(s => s.selectedFile)
  const status = useRepoStore(s => s.status)
  const stageFiles = useRepoStore(s => s.stageFiles)
  const unstageFiles = useRepoStore(s => s.unstageFiles)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = isMac ? e.metaKey : e.ctrlKey

      // Cmd/Ctrl+R: Refresh status
      if (mod && e.key === 'r') {
        e.preventDefault()
        refreshStatus()
        return
      }

      // Cmd/Ctrl+Shift+S: Stage selected file
      if (mod && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        if (selectedFile) {
          const file = status?.files.find(f => f.path === selectedFile)
          if (file && !file.staged) {
            stageFiles([selectedFile])
          }
        }
        return
      }

      // Cmd/Ctrl+Shift+A: Unstage selected file
      if (mod && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        if (selectedFile) {
          const file = status?.files.find(f => f.path === selectedFile)
          if (file?.staged) {
            unstageFiles([selectedFile])
          }
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [refreshStatus, selectedFile, status, stageFiles, unstageFiles])
}

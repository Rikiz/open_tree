import { useState, useEffect } from 'react'
import { repo } from '@renderer/ipc'
import { BookmarkWindow } from './BookmarkWindow/BookmarkWindow'
import { RepoWindow } from './RepoWindow/RepoWindow'
import { useRepoStore } from '@renderer/store/repoStore'
import type { Bookmark } from '@shared/types'

export function App() {
  const [currentView, setCurrentView] = useState<'bookmarks' | 'repo'>('bookmarks')
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const repoPath = useRepoStore(s => s.repoPath)
  const openRepo = useRepoStore(s => s.openRepo)

  useEffect(() => {
    loadBookmarks()
  }, [])

  useEffect(() => {
    if (repoPath) {
      setCurrentView('repo')
    }
  }, [repoPath])

  async function loadBookmarks() {
    try {
      const result = await repo.list()
      setBookmarks(result as Bookmark[])
    } catch { /* ignore */ }
  }

  async function handleOpenRepo(repoPath: string) {
    await openRepo(repoPath)
  }

  async function handleAddRepo(dirPath: string) {
    try {
      await repo.add(dirPath)
      await loadBookmarks()
    } catch (err) {
      console.error('Failed to add repo:', err)
    }
  }

  async function handleRemoveRepo(id: string) {
    await repo.remove(id)
    await loadBookmarks()
  }

  function handleBackToBookmarks() {
    setCurrentView('bookmarks')
    loadBookmarks()
  }

  if (currentView === 'repo') {
    return <RepoWindow onBack={handleBackToBookmarks} />
  }

  return (
    <BookmarkWindow
      bookmarks={bookmarks}
      onOpenRepo={handleOpenRepo}
      onAddRepo={handleAddRepo}
      onRemoveRepo={handleRemoveRepo}
    />
  )
}

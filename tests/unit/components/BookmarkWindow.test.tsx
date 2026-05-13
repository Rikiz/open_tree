import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookmarkWindow } from '@renderer/components/BookmarkWindow/BookmarkWindow'

describe('BookmarkWindow', () => {
  beforeEach(() => {
    window.electronAPI = {
      invoke: vi.fn().mockResolvedValue(null),
      on: vi.fn().mockReturnValue(() => {}),
      send: vi.fn(),
    }
    localStorage.clear()
  })

  it('renders empty state', () => {
    render(
      <BookmarkWindow
        bookmarks={[]}
        onOpenRepo={vi.fn()}
        onAddRepo={vi.fn()}
        onRemoveRepo={vi.fn()}
      />
    )
    expect(screen.getByText('No repositories yet')).toBeInTheDocument()
    expect(screen.getByText('Clone Repository')).toBeInTheDocument()
    expect(screen.getByText('Add Existing')).toBeInTheDocument()
  })

  it('renders bookmark list', () => {
    const bookmarks = [
      { id: '1', path: '/home/repos/myproject', name: 'myproject', lastAccessed: new Date(), addedAt: new Date(), order: 0, pinned: false },
      { id: '2', path: '/home/repos/lib', name: 'lib', lastAccessed: new Date(), addedAt: new Date(), order: 1, pinned: true },
    ]

    render(
      <BookmarkWindow
        bookmarks={bookmarks}
        onOpenRepo={vi.fn()}
        onAddRepo={vi.fn()}
        onRemoveRepo={vi.fn()}
      />
    )

    expect(screen.getByText('myproject')).toBeInTheDocument()
    expect(screen.getByText('lib')).toBeInTheDocument()
    expect(screen.getByText('/home/repos/myproject')).toBeInTheDocument()
  })

  it('calls onOpenRepo when clicking a bookmark', async () => {
    const onOpen = vi.fn()
    const bookmarks = [
      { id: '1', path: '/test', name: 'test', lastAccessed: new Date(), addedAt: new Date(), order: 0, pinned: false },
    ]

    render(
      <BookmarkWindow
        bookmarks={bookmarks}
        onOpenRepo={onOpen}
        onAddRepo={vi.fn()}
        onRemoveRepo={vi.fn()}
      />
    )

    await userEvent.click(screen.getByText('test'))
    expect(onOpen).toHaveBeenCalledWith('/test')
  })

  it('calls onRemoveRepo when clicking delete', async () => {
    const onRemove = vi.fn()
    const bookmarks = [
      { id: '1', path: '/test', name: 'test', lastAccessed: new Date(), addedAt: new Date(), order: 0, pinned: false },
    ]

    render(
      <BookmarkWindow
        bookmarks={bookmarks}
        onOpenRepo={vi.fn()}
        onAddRepo={vi.fn()}
        onRemoveRepo={onRemove}
      />
    )

    // The delete button appears on hover (opacity-0 → group-hover:opacity-100)
    // We need to find and click the trash button within the group
    const container = document.querySelector('.group')
    expect(container).toBeTruthy()
    if (container) {
      const buttons = container.querySelectorAll('button')
      // The delete button is the last button in the group
      const deleteBtn = buttons[buttons.length - 1]
      fireEvent.click(deleteBtn)
      expect(onRemove).toHaveBeenCalledWith('1')
    }
  })

  it('opens Clone dialog when clicking Clone button', async () => {
    render(
      <BookmarkWindow
        bookmarks={[]}
        onOpenRepo={vi.fn()}
        onAddRepo={vi.fn()}
        onRemoveRepo={vi.fn()}
      />
    )

    await userEvent.click(screen.getByText('Clone Repository'))
    expect(screen.getByText('Repository URL')).toBeInTheDocument()
  })
})

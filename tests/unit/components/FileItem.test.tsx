import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileItem } from '@renderer/components/RepoWindow/FileStatus/FileItem'

describe('FileItem', () => {
  it('renders file name and status', () => {
    render(
      <FileItem
        file={{ path: 'src/app.ts', status: 'M', staged: false }}
        onClick={vi.fn()}
        isSelected={false}
      />
    )
    expect(screen.getByText('src/app.ts')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('applies selected styling', () => {
    const { container } = render(
      <FileItem
        file={{ path: 'src/app.ts', status: 'M', staged: false }}
        onClick={vi.fn()}
        isSelected={true}
      />
    )
    const div = container.querySelector('.bg-accent')
    expect(div).toBeTruthy()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(
      <FileItem
        file={{ path: 'src/test.ts', status: 'A', staged: false }}
        onClick={onClick}
        isSelected={false}
      />
    )
    await userEvent.click(screen.getByText('src/test.ts'))
    expect(onClick).toHaveBeenCalled()
  })

  it('shows stage action button when provided', () => {
    const onAction = vi.fn()
    render(
      <FileItem
        file={{ path: 'src/test.ts', status: 'M', staged: false }}
        onClick={vi.fn()}
        isSelected={false}
        onAction={onAction}
        actionLabel="Stage"
        actionIcon={<span>+</span>}
      />
    )
    expect(screen.getByText('Stage')).toBeInTheDocument()
  })

  it('calls onAction when stage button clicked', async () => {
    const onAction = vi.fn()
    render(
      <FileItem
        file={{ path: 'src/test.ts', status: 'M', staged: false }}
        onClick={vi.fn()}
        isSelected={false}
        onAction={onAction}
        actionLabel="Stage"
        actionIcon={<span>+</span>}
      />
    )
    await userEvent.click(screen.getByText('Stage'))
    expect(onAction).toHaveBeenCalledOnce()
  })

  it('shows correct status colors', () => {
    const statusTests: { status: string; cls: string }[] = [
      { status: 'M', cls: 'text-yellow-500' },
      { status: 'A', cls: 'text-green-500' },
      { status: 'D', cls: 'text-red-500' },
      { status: '?', cls: 'text-muted-foreground' },
    ]

    for (const { status, cls } of statusTests) {
      const { container } = render(
        <FileItem
          file={{ path: 'test.ts', status, staged: false }}
          onClick={vi.fn()}
          isSelected={false}
        />
      )
      expect(container.querySelector(`.${cls}`)).toBeTruthy()
    }
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useThemeStore } from '@renderer/store/themeStore'

describe('themeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'system', resolved: 'light' })
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  it('defaults to system theme', () => {
    useThemeStore.setState({ theme: 'system' })
    expect(useThemeStore.getState().theme).toBe('system')
  })

  it('sets light theme', () => {
    const { setTheme } = useThemeStore.getState()
    setTheme('light')
    expect(useThemeStore.getState().theme).toBe('light')
    expect(useThemeStore.getState().resolved).toBe('light')
  })

  it('sets dark theme', () => {
    const { setTheme } = useThemeStore.getState()
    setTheme('dark')
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(useThemeStore.getState().resolved).toBe('dark')
  })

  it('toggles between light and dark', () => {
    useThemeStore.setState({ resolved: 'light' })
    const { toggle } = useThemeStore.getState()
    toggle()
    expect(useThemeStore.getState().resolved).toBe('dark')
    toggle()
    expect(useThemeStore.getState().resolved).toBe('light')
  })

  it('resolves system theme to dark when OS is dark', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    const { setTheme } = useThemeStore.getState()
    setTheme('system')
    expect(useThemeStore.getState().resolved).toBe('dark')
  })
})

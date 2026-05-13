import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'

export function ThemeToggle() {
  const { resolved, toggle } = useThemeStore()

  return (
    <button
      onClick={toggle}
      className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      title={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} mode`}
    >
      {resolved === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}

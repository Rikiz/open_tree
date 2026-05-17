import { useThemeStore } from '@renderer/store/themeStore'

export function GeneralTab() {
  const { theme, setTheme } = useThemeStore()

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">General Settings</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Theme</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
            className="w-48 rounded-md border bg-background px-3 py-1.5 text-sm"
          >
            <option value="system">System Default</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Default Branch Name</label>
          <input
            type="text"
            defaultValue="main"
            className="w-48 rounded-md border bg-background px-3 py-1.5 text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Git Executable Path</label>
          <input
            type="text"
            defaultValue="git"
            className="w-64 rounded-md border bg-background px-3 py-1.5 text-sm font-mono"
          />
        </div>
      </div>

      <div className="mt-6 p-3 rounded-md bg-accent/50">
        <p className="text-xs text-muted-foreground">
          OpenTree v0.1.0
          <br />
          Electron + React + TypeScript + Tailwind CSS
        </p>
      </div>
    </div>
  )
}

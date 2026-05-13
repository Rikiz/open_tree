import { useState } from 'react'
import { X, User, Key, Settings as SettingsIcon } from 'lucide-react'
import { AccountsTab } from './AccountsTab'
import { SSHTab } from './SSHTab'
import { GeneralTab } from './GeneralTab'

interface Props {
  onClose: () => void
}

export function PreferencesDialog({ onClose }: Props) {
  const [tab, setTab] = useState<'general' | 'accounts' | 'ssh'>('general')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-background rounded-lg shadow-xl border w-[600px] h-[480px] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-muted-foreground" />
            Preferences
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 flex min-h-0">
          {/* Tab sidebar */}
          <div className="w-40 border-r p-2 space-y-0.5">
            <button
              onClick={() => setTab('general')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-left ${
                tab === 'general' ? 'bg-accent font-medium' : 'hover:bg-accent/50 text-muted-foreground'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              General
            </button>
            <button
              onClick={() => setTab('accounts')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-left ${
                tab === 'accounts' ? 'bg-accent font-medium' : 'hover:bg-accent/50 text-muted-foreground'
              }`}
            >
              <User className="w-4 h-4" />
              Accounts
            </button>
            <button
              onClick={() => setTab('ssh')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-left ${
                tab === 'ssh' ? 'bg-accent font-medium' : 'hover:bg-accent/50 text-muted-foreground'
              }`}
            >
              <Key className="w-4 h-4" />
              SSH Keys
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto p-4">
            {tab === 'general' && <GeneralTab />}
            {tab === 'accounts' && <AccountsTab />}
            {tab === 'ssh' && <SSHTab />}
          </div>
        </div>
      </div>
    </div>
  )
}

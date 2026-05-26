import { useEffect, useState } from 'react'
import { Loader2, X, CheckCircle, AlertCircle } from 'lucide-react'

interface Props {
  type: 'success' | 'error'
  message: string
  onDismiss: () => void
  autoDismissMs?: number
}

export function OperationToast({ type, message, onDismiss, autoDismissMs = 4000 }: Props) {
  const [_visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 200)
    }, autoDismissMs)
    return () => clearTimeout(timer)
  }, [autoDismissMs, onDismiss])

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 text-xs rounded-md border shadow-sm animate-in slide-in-from-top-2 ${
        type === 'success'
          ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200'
          : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
      }`}
      style={{ animation: 'slideDown 0.2s ease-out' }}
    >
      {type === 'success' ? (
        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      )}
      <span className="flex-1 min-w-0 truncate">{message}</span>
      <button onClick={onDismiss} className="shrink-0 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10">
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

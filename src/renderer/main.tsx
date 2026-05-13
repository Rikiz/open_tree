import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './components/App'
import { useThemeStore } from './store/themeStore'
import './globals.css'

// Initialize theme before render
const theme = useThemeStore.getState().theme
useThemeStore.getState().setTheme(theme)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { initLocale } from './hooks/useLocale'
import { applyTheme } from './lib/theme'
import './index.css'

applyTheme()
initLocale()

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

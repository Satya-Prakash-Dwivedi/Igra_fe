import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createLogger, serializeError } from './services/logger.ts'

const logger = createLogger('app')

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

window.addEventListener('error', (event) => {
  logger.error('window.error', {
    source: event.filename,
    line: event.lineno,
    column: event.colno,
    error: serializeError(event.error),
  })
})

window.addEventListener('unhandledrejection', (event) => {
  logger.error('window.unhandled_rejection', {
    error: serializeError(event.reason),
  })
})

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)

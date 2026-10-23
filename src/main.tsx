import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

function reportError(message: string) {
  if ((window as any).__TAURI_INTERNALS__) {
    import('@tauri-apps/api/core')
      .then(({ invoke }) => invoke('log_frontend', { message }).catch(() => {}))
      .catch(() => {})
  } else {
    console.error(message)
  }
}

window.addEventListener('error', (event) => {
  reportError(`${event.message} @ ${event.filename}:${event.lineno}`)
})
window.addEventListener('unhandledrejection', (event) => {
  reportError(`unhandled rejection: ${String(event.reason)}`)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Sopprime errori in console provenienti da estensioni browser (message port, receiving end, PHANTOM, ecc.)
function isExtensionError(msg) {
  if (!msg || typeof msg !== 'string') return false
  const s = msg.toLowerCase()
  return (
    (s.includes('message port') && s.includes('closed')) ||
    (s.includes('message channel') && s.includes('closed')) ||
    s.includes('receiving end does not exist') ||
    (s.includes('asynchronous response') && s.includes('true')) ||
    s.includes('runtime.lasterror') ||
    s.includes('content.js') ||
    s.includes('contentscript') ||
    s.includes('polyfill.js') ||
    s.includes('[phantom]')
  )
}
window.addEventListener('unhandledrejection', (event) => {
  const msg = (event.reason?.message ?? event.reason?.stack ?? String(event.reason ?? '')).toString()
  if (isExtensionError(msg)) {
    event.preventDefault()
    event.stopPropagation()
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

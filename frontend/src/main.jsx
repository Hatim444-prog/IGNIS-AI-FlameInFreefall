import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../style.css'
import App from './App.tsx'

const root = document.getElementById('root')
root.classList.add('site-entering')
window.setTimeout(() => root.classList.remove('site-entering'), 850)
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

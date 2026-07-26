import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// Limpieza de service workers viejos (de builds anteriores que ya no se usan).
// El codigo actual no registra ningun service worker, pero navegadores que
// visitaron una version vieja de la app pueden tener uno instalado, sirviendo
// assets cacheados y desactualizados (pantalla en blanco tras un deploy nuevo).
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister())
  })
}
if ('caches' in window) {
  caches.keys().then((names) => {
    names.forEach((name) => caches.delete(name))
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
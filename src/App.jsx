import { useCallback, useEffect, useRef, useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Gastos from './pages/Gastos'
import Bolsillos from './pages/Bolsillos'
import Cuentas from './pages/Cuentas'
import Historial from './pages/Historial'
import Ingresar from './pages/Ingresar'
import useDB from './hooks/useDB'






const pages = {
  Dashboard,
  Ingresar,
  Gastos,
  Bolsillos,
  Cuentas,
  Historial,
}

function App() {
  const [page, setPage] = useState('Dashboard')
  const [toasts, setToasts] = useState([])
  const toastCounter = useRef(0)
  const { cuentas, bolsillos, categorias, stats, loading, reload } = useDB()

  useEffect(() => {
    const blockedTags = new Set(['INPUT', 'SELECT', 'TEXTAREA'])

    const handleKeydown = (event) => {
      const target = event.target

      if (target && target.tagName && blockedTags.has(target.tagName)) {
        return
      }

      const key = event.key.toLowerCase()

      if (key === 'n') setPage('Ingresar')
      if (key === 'g') setPage('Gastos')
      if (key === 'd') setPage('Dashboard')
      if (key === 'h') setPage('Historial')
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [])

  const toast = useCallback((message, tone = 'default') => {
    const id = `${Date.now()}-${toastCounter.current++}`
    const nextToast = { id, message, tone }

    setToasts((current) => [...current, nextToast])

    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 2800)
  }, [])

  const ActivePage = pages[page] ?? Dashboard

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--tx)' }}>
      <Sidebar active={page} onNavigate={setPage} />

      <main
        style={{
          flex: 1,
          overflow: 'hidden',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {loading && <span style={{ color: 'var(--hi)' }}>Cargando datos...</span>}
        <ActivePage
          reload={reload}
          toast={toast}
          cuentas={cuentas}
          bolsillos={bolsillos}
          categorias={categorias}
          stats={stats}
        />
      </main>

      <div className="toast-container">
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid var(--bd2)',
              background: 'var(--s2)',
              color: 'var(--tx)',
              boxShadow: '0 10px 24px rgba(0, 0, 0, 0.3)',
              minWidth: '220px',
            }}
          >
            {item.message}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App

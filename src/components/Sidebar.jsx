const navItems = [
  { key: 'Dashboard', label: 'Dashboard', icon: '▦' },
  { key: 'Ingresar', label: 'Ingresar', icon: '+' },
  { key: 'Gastos', label: 'Gastos', icon: '≡' },
  { key: 'Bolsillos', label: 'Bolsillos', icon: '◉' },
  { key: 'Cuentas', label: 'Cuentas', icon: '◎' },
  { key: 'Historial', label: 'Historial', icon: '☰' },
]

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside
      style={{
        width: '200px',
        minWidth: '200px',
        height: '100vh',
        background: 'var(--s1)',
        borderRight: '1px solid var(--bd)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px',
        gap: '24px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '4px 8px' }}>
        <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>
          fin<span style={{ color: 'var(--gr)' }}>track</span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--mu)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          control financiero
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navItems.map((item) => {
          const isActive = item.key === active

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate?.(item.key)}
              aria-current={isActive ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                width: '100%',
                borderRadius: '10px',
                border: '0',
                borderLeft: isActive ? '2px solid var(--gr)' : '2px solid transparent',
                background: 'transparent',
                color: isActive ? 'var(--tx)' : 'var(--mu)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'color 160ms ease, background 160ms ease, border-color 160ms ease',
              }}
            >
              <span style={{ fontSize: '16px', width: '18px', textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      <div style={{ marginTop: 'auto', padding: '8px 12px', fontSize: '12px', color: 'var(--hi)' }}>
        v1.0
      </div>
    </aside>
  )
}

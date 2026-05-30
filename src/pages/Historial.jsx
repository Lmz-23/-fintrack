import { useMemo, useState } from 'react'
import { Btn, Card, Input, Label, Mono, Row, Select, Sep, fmtCOP, todayStr } from '../components/UI'

const typeOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'ingreso', label: 'Ingresos' },
  { value: 'gasto', label: 'Gastos' },
  { value: 'movimiento', label: 'Movimientos' },
]

const typeConfig = {
  registro: { label: 'Ingreso', badge: 'ingreso', color: 'var(--gr)' },
  gasto: { label: 'Gasto', badge: 'gasto', color: 'var(--rd)' },
  movimiento: { label: 'Movimiento', badge: 'movimiento', color: 'var(--bl)' },
}

const iconBySubtype = {
  uber: '🚗',
  rapido: '⚡',
  balance: '⚖️',
}

const iconByType = {
  gasto: '📤',
  movimiento: '🔄',
}

const getIngresoIcon = (subtipo) => iconBySubtype[subtipo] || '💸'

const formatLabel = (item) => {
  if (item.tipo === 'registro') {
    if (item.subtipo === 'uber') return 'Ingreso Uber'
    if (item.subtipo === 'rapido') return 'Ingreso rapido'
    if (item.subtipo === 'balance') return 'Ajuste de balance'
    return 'Ingreso'
  }

  if (item.tipo === 'gasto') {
    return item.descripcion || 'Gasto'
  }

  if (item.tipo === 'movimiento') {
    return item.descripcion || 'Movimiento'
  }

  return item.descripcion || 'Movimiento'
}

export default function Historial({ toast }) {
  const [filters, setFilters] = useState({
    fechaDesde: '',
    fechaHasta: '',
    tipo: 'all',
  })
  const [items, setItems] = useState([])

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        if (item.tipo === 'registro') {
          acc.ingresos += Number(item.monto || 0)
        } else if (item.tipo === 'gasto') {
          acc.gastos += Number(item.monto || 0)
        }
        return acc
      },
      { ingresos: 0, gastos: 0 },
    )
  }, [items])

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const applyFilters = async () => {
    if (!window?.ft) return

    const filtros = {
      fechaDesde: filters.fechaDesde || null,
      fechaHasta: filters.fechaHasta || null,
    }

    const result = await window.ft.historial.get(filtros)

    const filtered = filters.tipo === 'all'
      ? result
      : result.filter((item) => {
          if (filters.tipo === 'ingreso') return item.tipo === 'registro'
          if (filters.tipo === 'gasto') return item.tipo === 'gasto'
          return item.tipo === 'movimiento'
        })

    setItems(filtered)
    toast?.('Historial actualizado', 'default')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Card>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          <Input
            label="Fecha desde"
            type="date"
            value={filters.fechaDesde}
            onChange={(event) => handleFilterChange('fechaDesde', event.target.value)}
          />
          <Input
            label="Fecha hasta"
            type="date"
            value={filters.fechaHasta}
            onChange={(event) => handleFilterChange('fechaHasta', event.target.value)}
          />
          <Select
            label="Tipo"
            value={filters.tipo}
            onChange={(event) => handleFilterChange('tipo', event.target.value)}
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Btn variant="primary" onClick={applyFilters}>
            Aplicar filtros
          </Btn>
        </div>
      </Card>

      <Card>
        <Label>Movimientos</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
          {items.length === 0 ? (
            <div style={{ color: 'var(--mu)', fontSize: '13px' }}>No hay movimientos para mostrar.</div>
          ) : (
            items.map((item, index) => {
              const config = typeConfig[item.tipo] ?? typeConfig.movimiento
              const isIngreso = item.tipo === 'registro'
              const icon =
                item.tipo === 'registro' ? getIngresoIcon(item.subtipo) : iconByType[item.tipo] || '🔄'
              const amountColor = isIngreso ? 'var(--gr)' : item.tipo === 'gasto' ? 'var(--rd)' : 'var(--bl)'
              const sign = isIngreso ? '+' : item.tipo === 'gasto' ? '-' : ''

              return (
                <div key={`${item.tipo}-${item.id}`}>
                  {index > 0 && <Sep style={{ margin: '10px 0' }} />}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                    }}
                  >
                    <Row style={{ gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>{icon}</span>
                      <div>
                        <div style={{ fontSize: '14px', color: 'var(--tx)' }}>{formatLabel(item)}</div>
                        <div style={{ fontSize: '12px', color: 'var(--mu)' }}>
                          {item.fecha || todayStr()}
                        </div>
                      </div>
                    </Row>
                    <Row style={{ gap: '12px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '4px 8px',
                          borderRadius: '999px',
                          border: `1px solid ${config.color}`,
                          color: config.color,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {config.badge}
                      </span>
                      <Mono style={{ color: amountColor }}>
                        {sign}${fmtCOP(item.monto)}
                      </Mono>
                    </Row>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      <Card>
        <Label>Totales</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', marginTop: '12px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--bd2)', background: 'var(--s2)' }}>
            <div style={{ fontSize: '11px', color: 'var(--mu)' }}>Total ingresos</div>
            <Mono style={{ color: 'var(--gr)' }}>+${fmtCOP(totals.ingresos)}</Mono>
          </div>
          <div style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--bd2)', background: 'var(--s2)' }}>
            <div style={{ fontSize: '11px', color: 'var(--mu)' }}>Total gastos</div>
            <Mono style={{ color: 'var(--rd)' }}>-${fmtCOP(totals.gastos)}</Mono>
          </div>
          <div style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--bd2)', background: 'var(--s2)' }}>
            <div style={{ fontSize: '11px', color: 'var(--mu)' }}>Balance neto</div>
            <Mono style={{ color: totals.ingresos - totals.gastos >= 0 ? 'var(--gr)' : 'var(--rd)' }}>
              ${fmtCOP(totals.ingresos - totals.gastos)}
            </Mono>
          </div>
        </div>
      </Card>
    </div>
  )
}

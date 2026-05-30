import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, Label, Mono, fmtCOP, fmtFull } from '../components/UI'

const tooltipStyle = {
  contentStyle: {
    background: 'var(--s2)',
    border: '1px solid var(--bd2)',
    borderRadius: '10px',
    color: 'var(--tx)',
    padding: '10px 12px',
  },
  itemStyle: { color: 'var(--tx)' },
  labelStyle: { color: 'var(--mu)', fontSize: '12px' },
  cursor: { fill: 'rgba(45, 212, 160, 0.08)' },
}

const formatDateShort = (value) => {
  if (!value) return ''
  const [, month, day] = value.split('-')
  return `${day}/${month}`
}

export default function Dashboard({ stats, cuentas = [], bolsillos = [] }) {
  const totalCuentas = cuentas.reduce((sum, cuenta) => sum + Number(cuenta.saldo || 0), 0)
  const totalBolsillos = bolsillos.reduce((sum, bolsillo) => sum + Number(bolsillo.saldo || 0), 0)

  const ingresoPorDia = [...(stats?.porDia ?? [])].reverse()
  const gastosPorCategoria = stats?.porCategoria ?? []
  const recientes = stats?.recientes ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card
        style={{
          background:
            'radial-gradient(circle at 90% 15%, rgba(45, 212, 160, 0.18), transparent 45%), var(--s1)',
          border: '1px solid var(--bd)',
          padding: '22px 24px',
        }}
      >
        <Label>Patrimonio total</Label>
        <div
          style={{
            marginTop: '10px',
            fontFamily: 'var(--font-mono)',
            fontSize: '44px',
            letterSpacing: '-0.02em',
            color: 'var(--tx)',
          }}
        >
          ${fmtFull(totalCuentas)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px' }}>
          {cuentas.map((cuenta) => (
            <div
              key={cuenta.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '999px',
                border: `1px solid ${cuenta.color ?? 'var(--bd2)'}`,
                background: 'rgba(255, 255, 255, 0.02)',
                fontSize: '12px',
                color: 'var(--tx)',
              }}
            >
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: cuenta.color }} />
              <span>{cuenta.nombre}</span>
              <Mono>${fmtCOP(cuenta.saldo)}</Mono>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
        <Card>
          <Label>Ingresos netos</Label>
          <div style={{ marginTop: '10px', color: 'var(--gr)', fontSize: '22px', fontWeight: 600 }}>
            ${fmtCOP(stats?.ingresosNetos ?? 0)}
          </div>
        </Card>
        <Card>
          <Label>Gastos</Label>
          <div style={{ marginTop: '10px', color: 'var(--rd)', fontSize: '22px', fontWeight: 600 }}>
            ${fmtCOP(stats?.totalGastos ?? 0)}
          </div>
        </Card>
        <Card>
          <Label>Total bolsillos</Label>
          <div style={{ marginTop: '10px', color: 'var(--am)', fontSize: '22px', fontWeight: 600 }}>
            ${fmtCOP(totalBolsillos)}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
        <Card style={{ height: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Label>Ingresos netos por dia</Label>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ingresoPorDia} margin={{ top: 10, left: 0, right: 10, bottom: 0 }}>
                <XAxis dataKey="fecha" tickFormatter={formatDateShort} stroke="var(--hi)" fontSize={11} />
                <YAxis stroke="var(--hi)" fontSize={11} />
                <Tooltip
                  contentStyle={tooltipStyle.contentStyle}
                  itemStyle={tooltipStyle.itemStyle}
                  labelStyle={tooltipStyle.labelStyle}
                  cursor={tooltipStyle.cursor}
                  formatter={(value) => `$${fmtCOP(value)}`}
                />
                <Bar dataKey="total" fill="rgba(45, 212, 160, 0.75)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card style={{ height: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Label>Gastos por categoria</Label>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gastosPorCategoria}
                  dataKey="total"
                  nameKey="nombre"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {gastosPorCategoria.map((entry) => (
                    <Cell key={entry.categoria_id ?? entry.nombre} fill={entry.color || 'var(--bd2)'} />
                  ))}
                </Pie>
                <Legend iconType="circle" />
                <Tooltip
                  contentStyle={tooltipStyle.contentStyle}
                  itemStyle={tooltipStyle.itemStyle}
                  labelStyle={tooltipStyle.labelStyle}
                  formatter={(value) => `$${fmtCOP(value)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
        <Card>
          <Label>Cuentas</Label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '12px',
              marginTop: '14px',
            }}
          >
            {cuentas.map((cuenta) => (
              <div
                key={cuenta.id}
                style={{
                  borderRadius: '12px',
                  background: 'var(--s2)',
                  border: '1px solid var(--bd2)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ height: '4px', background: cuenta.color ?? 'var(--gr)' }} />
                <div style={{ padding: '12px' }}>
                  <div style={{ fontSize: '20px' }}>{cuenta.icon}</div>
                  <div style={{ fontSize: '13px', color: 'var(--mu)', marginTop: '8px' }}>{cuenta.nombre}</div>
                  <Mono style={{ fontSize: '16px', marginTop: '6px', display: 'block' }}>
                    ${fmtCOP(cuenta.saldo)}
                  </Mono>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Label>Bolsillos</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
            {bolsillos.map((bolsillo) => {
              const pct = Math.min(Math.max(Number(bolsillo.pct || 0), 0), 100)

              return (
                <div key={bolsillo.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--tx)' }}>{bolsillo.nombre}</span>
                    <Mono>${fmtCOP(bolsillo.saldo)}</Mono>
                  </div>
                  <div style={{ height: '8px', borderRadius: '999px', background: 'var(--s3)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: bolsillo.color ?? 'var(--am)',
                        transition: 'width 180ms ease',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <Card>
        <Label>Ultimos movimientos</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
          {recientes.map((item) => {
            const isIngreso = item.tipo === 'registro'
            const color = isIngreso ? 'var(--gr)' : 'var(--rd)'
            const sign = isIngreso ? '+' : '-'

            return (
              <div
                key={`${item.tipo}-${item.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--bd2)',
                  background: 'var(--s2)',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--tx)' }}>{item.descripcion || 'Movimiento'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--mu)' }}>{item.fecha}</div>
                </div>
                <Mono style={{ color }}>{sign}${fmtCOP(item.monto)}</Mono>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

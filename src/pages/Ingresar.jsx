import { useMemo, useState } from 'react'
import { Btn, Card, Input, Label, Mono, Row, Select, Toggle, fmtCOP, todayStr, uid } from '../components/UI'

const sourceOptions = ['Efectivo', 'App', 'Transferencia', 'Bono', 'Otro']

const gastoDefaults = {
  gasolina: '',
  transferencias: '',
  peajes: '',
  mantenimiento: '',
  otros: '',
  otros_desc: '',
}

const calcDist = (neto, bolsillos) => {
  const total = Number(neto || 0)
  if (!Number.isFinite(total) || total === 0) {
    return []
  }

  const activos = bolsillos.filter((item) => Number(item.activo || 0) !== 0)
  const base = activos.filter((item) => Number(item.es_restante || 0) !== 1)
  const restante = activos.find((item) => Number(item.es_restante || 0) === 1)

  const items = base.map((item) => {
    const pct = Number(item.pct || 0)
    const monto = Math.round((total * pct) / 100)
    return {
      bolsillo: item,
      monto,
    }
  })

  const sum = items.reduce((acc, item) => acc + item.monto, 0)
  const restanteMonto = total - sum

  if (restante) {
    items.push({ bolsillo: restante, monto: restanteMonto })
  }

  return items
}

export default function Ingresar({ cuentas = [], bolsillos = [], reload, toast }) {
  const [mode, setMode] = useState('uber')
  const [uber, setUber] = useState({ fecha: todayStr(), bruto: '', gastos: gastoDefaults })
  const [rapido, setRapido] = useState({
    fecha: todayStr(),
    monto: '',
    descripcion: '',
    fuente: '',
    cuenta_id: '',
    dividir: false,
  })
  const [balanceInputs, setBalanceInputs] = useState({})
  const [balanceNota, setBalanceNota] = useState('')

  const bolsillosActivos = useMemo(
    () => bolsillos.filter((item) => Number(item.activo || 0) !== 0),
    [bolsillos],
  )

  const cuentasMap = useMemo(() => {
    const map = new Map()
    cuentas.forEach((cuenta) => map.set(cuenta.id, cuenta))
    return map
  }, [cuentas])

  const gastosUber = Object.values(uber.gastos)
    .slice(0, 5)
    .reduce((sum, value) => sum + Number(value || 0), 0)

  const netoUber = Number(uber.bruto || 0) - gastosUber
  const distribucionUber = useMemo(() => calcDist(netoUber, bolsillosActivos), [netoUber, bolsillosActivos])

  const distribucionRapida = useMemo(
    () => calcDist(rapido.monto, bolsillosActivos),
    [rapido.monto, bolsillosActivos],
  )

  const totalAnterior = cuentas.reduce((sum, cuenta) => sum + Number(cuenta.saldo || 0), 0)
  const totalNuevo = cuentas.reduce((sum, cuenta) => {
    const value = balanceInputs[cuenta.id]
    const next = value === '' || value === undefined ? Number(cuenta.saldo || 0) : Number(value)
    return sum + next
  }, 0)
  const diff = totalNuevo - totalAnterior

  const setUberField = (field, value) => {
    setUber((prev) => ({ ...prev, [field]: value }))
  }

  const setUberGasto = (field, value) => {
    setUber((prev) => ({ ...prev, gastos: { ...prev.gastos, [field]: value } }))
  }

  const handleSaveUber = async () => {
    if (!window?.ft) return
    if (!uber.bruto) {
      toast?.('Ingresa el monto bruto', 'err')
      return
    }

    const gastosOp = []

    const addGastoOp = (concepto, monto) => {
      const amount = Number(monto || 0)
      if (amount > 0) {
        gastosOp.push({ id: uid(), concepto, monto: amount })
      }
    }

    addGastoOp('Gasolina', uber.gastos.gasolina)
    addGastoOp('Transferencias', uber.gastos.transferencias)
    addGastoOp('Peajes', uber.gastos.peajes)
    addGastoOp('Mantenimiento', uber.gastos.mantenimiento)

    const otrosDesc = uber.gastos.otros_desc?.trim()
    const otrosConcepto = otrosDesc ? `Otros: ${otrosDesc}` : 'Otros'
    addGastoOp(otrosConcepto, uber.gastos.otros)

    const distribuciones = distribucionUber.map((entry) => ({
      id: uid(),
      bolsillo_id: entry.bolsillo.id,
      cuenta_id: entry.bolsillo.cuenta_id || null,
      monto: entry.monto,
    }))

    await window.ft.ingresos.guardarUber({
      id: uid(),
      fecha: uber.fecha,
      bruto: Number(uber.bruto || 0),
      gt: gastosUber,
      neto: netoUber,
      gastos_op: gastosOp,
      distribuciones,
    })

    setUber({ fecha: todayStr(), bruto: '', gastos: gastoDefaults })
    await reload?.()
    toast?.('Ingreso Uber guardado', 'ok')
  }

  const handleSaveRapido = async () => {
    if (!window?.ft) return
    if (!rapido.monto || !rapido.descripcion) {
      toast?.('Completa monto y descripcion', 'err')
      return
    }

    if (!rapido.dividir && !rapido.cuenta_id) {
      toast?.('Selecciona cuenta destino', 'err')
      return
    }

    const distribuciones = rapido.dividir
      ? distribucionRapida.map((entry) => ({
          id: uid(),
          bolsillo_id: entry.bolsillo.id,
          cuenta_id: entry.bolsillo.cuenta_id || null,
          monto: entry.monto,
        }))
      : []

    await window.ft.ingresos.guardarRapido({
      id: uid(),
      fecha: rapido.fecha,
      monto: Number(rapido.monto || 0),
      descripcion: rapido.descripcion,
      fuente: rapido.fuente || null,
      cuenta_id: rapido.dividir ? null : rapido.cuenta_id || null,
      distribuciones,
    })

    setRapido({ fecha: todayStr(), monto: '', descripcion: '', fuente: '', cuenta_id: '', dividir: false })
    await reload?.()
    toast?.('Ingreso rapido guardado', 'ok')
  }

  const handleSaveBalance = async () => {
    if (!window?.ft) return

    const ajustes = cuentas.map((cuenta) => {
      const value = balanceInputs[cuenta.id]
      const saldoNuevo = value === '' || value === undefined ? Number(cuenta.saldo || 0) : Number(value)
      return { cuenta_id: cuenta.id, saldo_nuevo: saldoNuevo }
    })

    await window.ft.ingresos.guardarBalance({
      id: uid(),
      fecha: todayStr(),
      diff,
      nota: balanceNota || null,
      ajustes,
    })

    setBalanceInputs({})
    setBalanceNota('')
    await reload?.()
    toast?.('Balance guardado', 'ok')
  }

  const renderTab = (key, label) => {
    const active = mode === key
    return (
      <button
        key={key}
        type="button"
        onClick={() => setMode(key)}
        style={{
          padding: '8px 16px',
          borderRadius: '999px',
          border: `1px solid ${active ? 'var(--gr)' : 'var(--bd2)'}`,
          background: active ? 'rgba(45, 212, 160, 0.12)' : 'transparent',
          color: active ? 'var(--tx)' : 'var(--mu)',
          fontSize: '13px',
          fontWeight: active ? 600 : 500,
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>Ingresar</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--mu)' }}>Registra ingresos y balances.</p>
        </div>
      </div>

      <Row style={{ gap: '10px', flexWrap: 'wrap' }}>
        {renderTab('uber', 'Uber')}
        {renderTab('rapido', 'Rapido')}
        {renderTab('balance', 'Balance')}
      </Row>

      {mode === 'uber' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card>
            <Row style={{ gap: '12px' }}>
              <Input
                label="Fecha"
                type="date"
                value={uber.fecha}
                onChange={(event) => setUberField('fecha', event.target.value)}
              />
              <Input
                label="Monto bruto"
                type="number"
                value={uber.bruto}
                onChange={(event) => setUberField('bruto', event.target.value)}
              />
            </Row>
          </Card>

          <Card>
            <Label>Gastos operacionales</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', marginTop: '12px' }}>
              <Input
                label="Gasolina"
                type="number"
                value={uber.gastos.gasolina}
                onChange={(event) => setUberGasto('gasolina', event.target.value)}
              />
              <Input
                label="Transferencias"
                type="number"
                value={uber.gastos.transferencias}
                onChange={(event) => setUberGasto('transferencias', event.target.value)}
              />
              <Input
                label="Peajes"
                type="number"
                value={uber.gastos.peajes}
                onChange={(event) => setUberGasto('peajes', event.target.value)}
              />
              <Input
                label="Mantenimiento"
                type="number"
                value={uber.gastos.mantenimiento}
                onChange={(event) => setUberGasto('mantenimiento', event.target.value)}
              />
              <Input
                label="Otros"
                type="number"
                value={uber.gastos.otros}
                onChange={(event) => setUberGasto('otros', event.target.value)}
              />
              <Input
                label="Descripcion"
                value={uber.gastos.otros_desc}
                onChange={(event) => setUberGasto('otros_desc', event.target.value)}
              />
            </div>
          </Card>

          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <div>
                <Label>Bruto</Label>
                <Mono>${fmtCOP(uber.bruto || 0)}</Mono>
              </div>
              <div>
                <Label>Gastos</Label>
                <Mono style={{ color: 'var(--rd)' }}>-${fmtCOP(gastosUber)}</Mono>
              </div>
              <div>
                <Label>Neto</Label>
                <Mono style={{ color: 'var(--gr)' }}>${fmtCOP(netoUber)}</Mono>
              </div>
            </Row>
          </Card>

          <Card>
            <Label>Distribucion automatica</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {distribucionUber.map((entry) => {
                const cuenta = cuentasMap.get(entry.bolsillo.cuenta_id)
                return (
                  <Row key={entry.bolsillo.id} style={{ justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--tx)' }}>{entry.bolsillo.nombre}</div>
                      <div style={{ fontSize: '12px', color: 'var(--mu)' }}>
                        {entry.bolsillo.pct}% · {cuenta?.nombre || 'Sin cuenta'}
                      </div>
                    </div>
                    <Mono>${fmtCOP(entry.monto)}</Mono>
                  </Row>
                )
              })}
              {distribucionUber.length === 0 ? (
                <div style={{ color: 'var(--mu)', fontSize: '13px' }}>No hay distribucion disponible.</div>
              ) : null}
            </div>
          </Card>

          <Btn variant="primary" onClick={handleSaveUber}>
            Guardar ingreso Uber
          </Btn>
        </div>
      ) : null}

      {mode === 'rapido' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
              <Input
                label="Fecha"
                type="date"
                value={rapido.fecha}
                onChange={(event) => setRapido((prev) => ({ ...prev, fecha: event.target.value }))}
              />
              <Input
                label="Monto"
                type="number"
                value={rapido.monto}
                onChange={(event) => setRapido((prev) => ({ ...prev, monto: event.target.value }))}
              />
              <Input
                label="Descripcion"
                value={rapido.descripcion}
                onChange={(event) => setRapido((prev) => ({ ...prev, descripcion: event.target.value }))}
              />
              <Select
                label="Fuente"
                value={rapido.fuente}
                onChange={(event) => setRapido((prev) => ({ ...prev, fuente: event.target.value }))}
              >
                <option value="">Selecciona fuente</option>
                {sourceOptions.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </Select>
              <Select
                label="Cuenta destino"
                value={rapido.cuenta_id}
                onChange={(event) => setRapido((prev) => ({ ...prev, cuenta_id: event.target.value }))}
                disabled={rapido.dividir}
              >
                <option value="">Selecciona cuenta</option>
                {cuentas.map((cuenta) => (
                  <option key={cuenta.id} value={cuenta.id}>
                    {cuenta.nombre}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <div>
                <Label>Dividir en bolsillos</Label>
                <div style={{ fontSize: '12px', color: 'var(--mu)' }}>Usa porcentajes activos.</div>
              </div>
              <Toggle
                checked={rapido.dividir}
                onChange={(checked) => setRapido((prev) => ({ ...prev, dividir: checked }))}
              />
            </Row>

            {rapido.dividir ? (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {distribucionRapida.map((entry) => (
                  <Row key={entry.bolsillo.id} style={{ justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--tx)' }}>{entry.bolsillo.nombre}</div>
                      <div style={{ fontSize: '12px', color: 'var(--mu)' }}>{entry.bolsillo.pct}%</div>
                    </div>
                    <Mono>${fmtCOP(entry.monto)}</Mono>
                  </Row>
                ))}
              </div>
            ) : null}
          </Card>

          <Btn variant="primary" onClick={handleSaveRapido}>
            Guardar ingreso rapido
          </Btn>
        </div>
      ) : null}

      {mode === 'balance' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card>
            <Label>Actualizar saldos</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', marginTop: '12px' }}>
              {cuentas.map((cuenta) => (
                <Input
                  key={cuenta.id}
                  label={`${cuenta.nombre} (${fmtCOP(cuenta.saldo)})`}
                  type="number"
                  value={balanceInputs[cuenta.id] ?? ''}
                  onChange={(event) =>
                    setBalanceInputs((prev) => ({ ...prev, [cuenta.id]: event.target.value }))
                  }
                  placeholder={fmtCOP(cuenta.saldo)}
                />
              ))}
            </div>
          </Card>

          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <div>
                <Label>Total anterior</Label>
                <Mono>${fmtCOP(totalAnterior)}</Mono>
              </div>
              <div>
                <Label>Total nuevo</Label>
                <Mono>${fmtCOP(totalNuevo)}</Mono>
              </div>
              <div>
                <Label>Diferencia</Label>
                <Mono style={{ color: diff >= 0 ? 'var(--gr)' : 'var(--rd)' }}>
                  ${fmtCOP(diff)}
                </Mono>
              </div>
            </Row>
          </Card>

          <Card>
            <Input
              label="Nota"
              value={balanceNota}
              onChange={(event) => setBalanceNota(event.target.value)}
              placeholder="Opcional"
            />
          </Card>

          <Btn variant="primary" onClick={handleSaveBalance}>
            Guardar balance
          </Btn>
        </div>
      ) : null}
    </div>
  )
}

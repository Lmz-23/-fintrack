import { useEffect, useMemo, useState } from 'react'
import { Btn, Card, Input, Label, Modal, Mono, Row, Select, Sep, fmtCOP, todayStr, uid } from '../components/UI'

const iconOptions = ['💵', '🏦', '📱', '📈', '🚗', '💳', '💼', '🎯', '🧾', '🪙']

const emptyCuentaForm = {
  nombre: '',
  icon: '💵',
  color: '#2dd4a0',
}

export default function Cuentas({ cuentas = [], reload, toast }) {
  const [movimientos, setMovimientos] = useState([])
  const [editing, setEditing] = useState(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newCuenta, setNewCuenta] = useState(emptyCuentaForm)
  const [transfer, setTransfer] = useState({ desde: '', hacia: '', monto: '', nota: '' })

  const cuentasMap = useMemo(() => {
    const map = new Map()
    cuentas.forEach((cuenta) => map.set(cuenta.id, cuenta))
    return map
  }, [cuentas])

  const loadMovimientos = async () => {
    if (!window?.ft) return
    const list = await window.ft.movimientos.getAll()
    setMovimientos(list)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMovimientos()
  }, [])

  const openEdit = (cuenta) => {
    setEditing({
      id: cuenta.id,
      nombre: cuenta.nombre,
      icon: cuenta.icon,
      color: cuenta.color,
      saldo: Number(cuenta.saldo || 0),
      nuevoSaldo: Number(cuenta.saldo || 0),
    })
  }

  const saveCuenta = async () => {
    if (!window?.ft || !editing) return
    if (!editing.nombre) {
      toast?.('Completa el nombre de la cuenta', 'danger')
      return
    }

    await window.ft.cuentas.update({
      id: editing.id,
      nombre: editing.nombre,
      icon: editing.icon,
      color: editing.color,
    })

    const nuevoSaldo = Number(editing.nuevoSaldo || 0)
    const diff = nuevoSaldo - Number(editing.saldo || 0)

    if (diff !== 0) {
      await window.ft.cuentas.setSaldo({ id: editing.id, saldo: nuevoSaldo })
    }

    if (diff !== 0) {
      await window.ft.ingresos.guardarBalance({
        id: uid(),
        fecha: todayStr(),
        diff,
        nota: 'Ajuste de saldo',
        ajustes: [{ cuenta_id: editing.id, saldo_nuevo: nuevoSaldo }],
      })
    }

    setEditing(null)
    await reload?.()
    toast?.('Cuenta actualizada', 'default')
  }

  const removeCuenta = async () => {
    if (!window?.ft || !editing) return

    try {
      await window.ft.cuentas.delete(editing.id)
      setEditing(null)
      await reload?.()
      toast?.('Cuenta eliminada', 'default')
    } catch (error) {
      toast?.(error?.message || 'No se pudo eliminar la cuenta', 'danger')
    }
  }

  const createCuenta = async () => {
    if (!window?.ft) return
    if (!newCuenta.nombre) {
      toast?.('Completa el nombre de la cuenta', 'danger')
      return
    }

    const nextOrden = cuentas.reduce((max, cuenta) => Math.max(max, Number(cuenta.orden || 0)), 0) + 1

    await window.ft.cuentas.create({
      id: uid(),
      nombre: newCuenta.nombre,
      icon: newCuenta.icon,
      color: newCuenta.color,
      orden: nextOrden,
    })

    setShowNewModal(false)
    setNewCuenta(emptyCuentaForm)
    await reload?.()
    toast?.('Cuenta creada', 'default')
  }

  const handleTransfer = async () => {
    if (!window?.ft) return
    if (!transfer.desde || !transfer.hacia) {
      toast?.('Selecciona cuentas', 'danger')
      return
    }
    if (transfer.desde === transfer.hacia) {
      toast?.('Las cuentas deben ser diferentes', 'danger')
      return
    }
    if (Number(transfer.monto || 0) <= 0) {
      toast?.('Monto invalido', 'danger')
      return
    }

    await window.ft.movimientos.create({
      id: uid(),
      fecha: todayStr(),
      desde_id: transfer.desde,
      hacia_id: transfer.hacia,
      monto: Number(transfer.monto),
      nota: transfer.nota || null,
      ts: Date.now(),
    })

    setTransfer({ desde: '', hacia: '', monto: '', nota: '' })
    await loadMovimientos()
    await reload?.()
    toast?.('Transferencia realizada', 'default')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>Cuentas</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--mu)' }}>Gestiona tus cuentas y saldos.</p>
        </div>
        <Btn variant="primary" onClick={() => setShowNewModal(true)}>
          + Nueva cuenta
        </Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {cuentas.map((cuenta) => (
          <Card
            key={cuenta.id}
            style={{
              borderLeft: `3px solid ${cuenta.color || 'var(--gr)'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '26px' }}>{cuenta.icon}</div>
            <div style={{ fontSize: '14px', color: 'var(--mu)' }}>{cuenta.nombre}</div>
            <Mono style={{ fontSize: '20px', color: cuenta.color || 'var(--tx)' }}>${fmtCOP(cuenta.saldo)}</Mono>
            <Btn variant="ghost" onClick={() => openEdit(cuenta)} style={{ alignSelf: 'flex-start' }}>
              ✎ Editar cuenta
            </Btn>
          </Card>
        ))}
      </div>

      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Mover entre cuentas</h2>
            <p style={{ margin: '6px 0 0', color: 'var(--mu)' }}>Transferencias internas.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
            <Select
              label="Desde"
              value={transfer.desde}
              onChange={(event) => setTransfer((prev) => ({ ...prev, desde: event.target.value }))}
            >
              <option value="">Selecciona cuenta</option>
              {cuentas.map((cuenta) => (
                <option key={cuenta.id} value={cuenta.id}>
                  {cuenta.nombre}
                </option>
              ))}
            </Select>
            <Select
              label="Hacia"
              value={transfer.hacia}
              onChange={(event) => setTransfer((prev) => ({ ...prev, hacia: event.target.value }))}
            >
              <option value="">Selecciona cuenta</option>
              {cuentas.map((cuenta) => (
                <option key={cuenta.id} value={cuenta.id}>
                  {cuenta.nombre}
                </option>
              ))}
            </Select>
            <Input
              label="Monto"
              type="number"
              value={transfer.monto}
              onChange={(event) => setTransfer((prev) => ({ ...prev, monto: event.target.value }))}
            />
            <Input
              label="Nota"
              value={transfer.nota}
              onChange={(event) => setTransfer((prev) => ({ ...prev, nota: event.target.value }))}
            />
          </div>
          <Btn variant="primary" onClick={handleTransfer} style={{ alignSelf: 'flex-start' }}>
            Transferir
          </Btn>
        </div>
      </Card>

      <Card>
        <Label>Movimientos recientes</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
          {movimientos.map((movimiento, index) => {
            const desde = cuentasMap.get(movimiento.desde_id)?.nombre || 'Cuenta'
            const hacia = cuentasMap.get(movimiento.hacia_id)?.nombre || 'Cuenta'
            const fecha = movimiento.fecha === todayStr() ? 'hoy' : movimiento.fecha

            return (
              <div key={movimiento.id}>
                {index > 0 && <Sep style={{ margin: '10px 0' }} />}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--tx)' }}>
                    {desde} → {hacia}
                  </div>
                  <Mono>${fmtCOP(movimiento.monto)}</Mono>
                  <div style={{ fontSize: '12px', color: 'var(--mu)' }}>
                    {fecha}
                    {movimiento.nota ? ` · ${movimiento.nota}` : ''}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Modal open={Boolean(editing)} title="Editar cuenta" onClose={() => setEditing(null)}>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Input
              label="Nombre"
              value={editing.nombre}
              onChange={(event) => setEditing((prev) => ({ ...prev, nombre: event.target.value }))}
            />
            <Select
              label="Icono"
              value={editing.icon}
              onChange={(event) => setEditing((prev) => ({ ...prev, icon: event.target.value }))}
            >
              {iconOptions.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </Select>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Label>Color</Label>
              <input
                type="color"
                value={editing.color}
                onChange={(event) => setEditing((prev) => ({ ...prev, color: event.target.value }))}
                style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '10px',
                  border: '1px solid var(--bd2)',
                  background: 'var(--s2)',
                }}
              />
            </div>
            <Input
              label="Nuevo saldo"
              type="number"
              value={editing.nuevoSaldo}
              onChange={(event) => setEditing((prev) => ({ ...prev, nuevoSaldo: event.target.value }))}
            />
            <Row style={{ justifyContent: 'space-between' }}>
              <Btn variant="danger" onClick={removeCuenta}>
                Eliminar
              </Btn>
              <Row style={{ justifyContent: 'flex-end' }}>
                <Btn variant="ghost" onClick={() => setEditing(null)}>
                  Cancelar
                </Btn>
                <Btn variant="primary" onClick={saveCuenta}>
                  Guardar cambios
                </Btn>
              </Row>
            </Row>
          </div>
        ) : null}
      </Modal>

      <Modal open={showNewModal} title="Nueva cuenta" onClose={() => setShowNewModal(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input
            label="Nombre"
            value={newCuenta.nombre}
            onChange={(event) => setNewCuenta((prev) => ({ ...prev, nombre: event.target.value }))}
          />
          <Select
            label="Icono"
            value={newCuenta.icon}
            onChange={(event) => setNewCuenta((prev) => ({ ...prev, icon: event.target.value }))}
          >
            {iconOptions.map((icon) => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </Select>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Label>Color</Label>
            <input
              type="color"
              value={newCuenta.color}
              onChange={(event) => setNewCuenta((prev) => ({ ...prev, color: event.target.value }))}
              style={{
                width: '100%',
                height: '42px',
                borderRadius: '10px',
                border: '1px solid var(--bd2)',
                background: 'var(--s2)',
              }}
            />
          </div>
          <Row style={{ justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setShowNewModal(false)}>
              Cancelar
            </Btn>
            <Btn variant="primary" onClick={createCuenta}>
              Crear cuenta
            </Btn>
          </Row>
        </div>
      </Modal>
    </div>
  )
}

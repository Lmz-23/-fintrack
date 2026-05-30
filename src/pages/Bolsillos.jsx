import { useMemo, useState } from 'react'
import { Btn, Card, Input, Label, Modal, Mono, Row, Select, Sep, Toggle, fmtCOP, uid } from '../components/UI'

const emptyForm = {
  nombre: '',
  pct: '',
  color: '#2dd4a0',
  cuenta_id: '',
}

const formatPct = (value) => {
  const num = Number(value || 0)
  return Number.isInteger(num) ? String(num) : num.toFixed(1)
}

export default function Bolsillos({ bolsillos = [], cuentas = [], reload, toast }) {
  const [showNewModal, setShowNewModal] = useState(false)
  const [newForm, setNewForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)

  const cuentasMap = useMemo(() => {
    const map = new Map()
    cuentas.forEach((cuenta) => map.set(cuenta.id, cuenta))
    return map
  }, [cuentas])

  const maxSaldo = useMemo(
    () => bolsillos.reduce((max, bolsillo) => Math.max(max, Number(bolsillo.saldo || 0)), 0),
    [bolsillos],
  )

  const pctTotal = useMemo(() => {
    return bolsillos
      .filter((bolsillo) => Number(bolsillo.es_restante || 0) !== 1 && Number(bolsillo.activo || 0) !== 0)
      .reduce((sum, bolsillo) => sum + Number(bolsillo.pct || 0), 0)
  }, [bolsillos])

  const restante = Math.max(0, 100 - pctTotal)
  const pctColor = pctTotal > 100 ? 'var(--rd)' : pctTotal === 100 ? 'var(--gr)' : 'var(--am)'

  const handleNewChange = (field, value) => {
    setNewForm((prev) => ({ ...prev, [field]: value }))
  }

  const openEdit = (bolsillo) => {
    setEditing({
      id: bolsillo.id,
      nombre: bolsillo.nombre,
      pct: bolsillo.pct,
      color: bolsillo.color,
      cuenta_id: bolsillo.cuenta_id,
      activo: Number(bolsillo.activo || 0) !== 0,
      es_restante: Number(bolsillo.es_restante || 0) === 1,
    })
  }

  const handleToggle = async (bolsillo, checked) => {
    if (!window?.ft) return

    await window.ft.bolsillos.update({
      id: bolsillo.id,
      nombre: bolsillo.nombre,
      pct: bolsillo.pct,
      activo: checked ? 1 : 0,
      color: bolsillo.color,
      cuenta_id: bolsillo.cuenta_id,
    })

    await reload?.()
    toast?.('Bolsillo actualizado', 'default')
  }

  const createBolsillo = async () => {
    if (!window?.ft) return
    if (!newForm.nombre || !newForm.pct || !newForm.cuenta_id) {
      toast?.('Completa nombre, porcentaje y cuenta', 'danger')
      return
    }

    const nextOrden = bolsillos.reduce((max, bolsillo) => Math.max(max, Number(bolsillo.orden || 0)), 0) + 1

    await window.ft.bolsillos.create({
      id: uid(),
      nombre: newForm.nombre,
      pct: Number(newForm.pct || 0),
      color: newForm.color,
      cuenta_id: newForm.cuenta_id,
      orden: nextOrden,
    })

    setShowNewModal(false)
    setNewForm(emptyForm)
    await reload?.()
    toast?.('Bolsillo creado', 'default')
  }

  const updateBolsillo = async () => {
    if (!window?.ft || !editing) return

    await window.ft.bolsillos.update({
      id: editing.id,
      nombre: editing.nombre,
      pct: Number(editing.pct || 0),
      activo: editing.activo ? 1 : 0,
      color: editing.color,
      cuenta_id: editing.cuenta_id,
    })

    setEditing(null)
    await reload?.()
    toast?.('Bolsillo actualizado', 'default')
  }

  const removeBolsillo = async () => {
    if (!window?.ft || !editing) return

    await window.ft.bolsillos.delete(editing.id)
    setEditing(null)
    await reload?.()
    toast?.('Bolsillo eliminado', 'default')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100%', borderRadius: '16px', overflow: 'hidden' }}>
      <aside
        style={{
          width: '360px',
          minWidth: '360px',
          borderRight: '1px solid var(--bd)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          background: 'var(--s1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px' }}>Bolsillos</h1>
            <p style={{ margin: '6px 0 0', color: 'var(--mu)' }}>Distribucion por porcentaje.</p>
          </div>
          <Btn variant="primary" onClick={() => setShowNewModal(true)}>
            + Nuevo bolsillo
          </Btn>
        </div>

        <Card style={{ padding: '16px' }}>
          <Label>Porcentaje asignado</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            <span
              style={{
                padding: '6px 10px',
                borderRadius: '999px',
                background: 'var(--s2)',
                border: `1px solid ${pctColor}`,
                color: pctColor,
                fontSize: '12px',
              }}
            >
              {formatPct(pctTotal)}%
            </span>
            {pctTotal < 100 ? (
              <span style={{ fontSize: '12px', color: 'var(--hi)' }}>
                El {formatPct(restante)}% restante va al bolsillo Restante
              </span>
            ) : null}
          </div>
        </Card>
      </aside>

      <section style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bolsillos.map((bolsillo, index) => {
              const pct = Number(bolsillo.pct || 0)
              const saldo = Number(bolsillo.saldo || 0)
              const cuenta = cuentasMap.get(bolsillo.cuenta_id)
              const progress = maxSaldo > 0 ? Math.max(0, (saldo / maxSaldo) * 100) : 0
              const isRestante = Number(bolsillo.es_restante || 0) === 1
              const isActive = Number(bolsillo.activo || 0) !== 0

              return (
                <div key={bolsillo.id}>
                  {index > 0 && <Sep style={{ margin: '12px 0' }} />}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: bolsillo.color || 'var(--am)',
                          }}
                        />
                        <span style={{ fontSize: '14px', color: 'var(--tx)', fontWeight: 600 }}>{bolsillo.nombre}</span>
                        {isRestante ? (
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '999px',
                              background: 'rgba(45, 212, 160, 0.15)',
                              color: 'var(--gr)',
                              fontSize: '11px',
                            }}
                          >
                            restante
                          </span>
                        ) : null}
                        {!isActive ? (
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '999px',
                              background: 'rgba(124, 123, 143, 0.15)',
                              color: 'var(--mu)',
                              fontSize: '11px',
                            }}
                          >
                            inactivo
                          </span>
                        ) : null}
                      </div>
                      <div style={{ height: '8px', background: 'var(--s3)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${progress}%`,
                            background: bolsillo.color || 'var(--am)',
                            transition: 'width 200ms ease',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <Mono>${fmtCOP(saldo)}</Mono>
                        <span style={{ fontSize: '12px', color: 'var(--mu)' }}>{formatPct(pct)}%</span>
                        <span style={{ fontSize: '12px', color: 'var(--hi)' }}>
                          Cuenta: {cuenta?.nombre ?? 'Sin cuenta'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Toggle checked={isActive} onChange={(checked) => handleToggle(bolsillo, checked)} />
                      <button
                        type="button"
                        onClick={() => openEdit(bolsillo)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          border: '1px solid var(--bd2)',
                          background: 'var(--s2)',
                          color: 'var(--tx)',
                        }}
                      >
                        ✎
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </section>

      <Modal open={showNewModal} title="Nuevo bolsillo" onClose={() => setShowNewModal(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input
            label="Nombre"
            value={newForm.nombre}
            onChange={(event) => handleNewChange('nombre', event.target.value)}
          />
          <Input
            label="Porcentaje"
            type="number"
            value={newForm.pct}
            onChange={(event) => handleNewChange('pct', event.target.value)}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Label>Color</Label>
            <input
              type="color"
              value={newForm.color}
              onChange={(event) => handleNewChange('color', event.target.value)}
              style={{
                width: '100%',
                height: '42px',
                borderRadius: '10px',
                border: '1px solid var(--bd2)',
                background: 'var(--s2)',
              }}
            />
          </div>
          <Select
            label="Cuenta enlazada"
            value={newForm.cuenta_id}
            onChange={(event) => handleNewChange('cuenta_id', event.target.value)}
          >
            <option value="">Selecciona cuenta</option>
            {cuentas.map((cuenta) => (
              <option key={cuenta.id} value={cuenta.id}>
                {cuenta.nombre}
              </option>
            ))}
          </Select>
          <Row style={{ justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setShowNewModal(false)}>
              Cancelar
            </Btn>
            <Btn variant="primary" onClick={createBolsillo}>
              Crear bolsillo
            </Btn>
          </Row>
        </div>
      </Modal>

      <Modal open={Boolean(editing)} title="Editar bolsillo" onClose={() => setEditing(null)}>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Input
              label="Nombre"
              value={editing.nombre}
              onChange={(event) => setEditing((prev) => ({ ...prev, nombre: event.target.value }))}
            />
            {!editing.es_restante ? (
              <Input
                label="Porcentaje"
                type="number"
                value={editing.pct}
                onChange={(event) => setEditing((prev) => ({ ...prev, pct: event.target.value }))}
              />
            ) : null}
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
            <Select
              label="Cuenta enlazada"
              value={editing.cuenta_id}
              onChange={(event) => setEditing((prev) => ({ ...prev, cuenta_id: event.target.value }))}
            >
              <option value="">Selecciona cuenta</option>
              {cuentas.map((cuenta) => (
                <option key={cuenta.id} value={cuenta.id}>
                  {cuenta.nombre}
                </option>
              ))}
            </Select>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Row>
                <Label>Activo</Label>
                <Toggle
                  checked={editing.activo}
                  onChange={(checked) => setEditing((prev) => ({ ...prev, activo: checked }))}
                />
              </Row>
              <Row style={{ justifyContent: 'flex-end' }}>
                {!editing.es_restante ? (
                  <Btn variant="danger" onClick={removeBolsillo}>
                    Eliminar
                  </Btn>
                ) : null}
                <Btn variant="ghost" onClick={() => setEditing(null)}>
                  Cancelar
                </Btn>
                <Btn variant="primary" onClick={updateBolsillo}>
                  Guardar
                </Btn>
              </Row>
            </Row>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

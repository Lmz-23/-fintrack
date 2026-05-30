import { useCallback, useEffect, useMemo, useState } from 'react'
import { Btn, Card, Input, Label, Modal, Mono, Row, Select, Sep, fmtCOP, todayStr, uid } from '../components/UI'

const emptyGastoForm = {
  fecha: todayStr(),
  valor: '',
  descripcion: '',
  categoria_id: '',
  origen: '',
}

const emptyCategoriaForm = {
  nombre: '',
  icon: '',
  color: '#f26b6b',
}

const getOriginKey = (tipo, id) => (tipo && id ? `${tipo}:${id}` : '')

export default function Gastos({ cuentas = [], bolsillos = [], categorias = [], reload, toast }) {
  const [gastos, setGastos] = useState([])
  const [form, setForm] = useState(emptyGastoForm)
  const [editing, setEditing] = useState(null)
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [categoriaForm, setCategoriaForm] = useState(emptyCategoriaForm)

  const categoriaMap = useMemo(() => {
    const map = new Map()
    categorias.forEach((cat) => map.set(cat.id, cat))
    return map
  }, [categorias])

  const cuentasMap = useMemo(() => {
    const map = new Map()
    cuentas.forEach((cuenta) => map.set(cuenta.id, cuenta))
    return map
  }, [cuentas])

  const bolsillosActivos = useMemo(() => bolsillos.filter((item) => Number(item.activo) !== 0), [bolsillos])

  const originOptions = useMemo(() => {
    const options = []

    bolsillosActivos.forEach((bolsillo) => {
      options.push({
        value: getOriginKey('bolsillo', bolsillo.id),
        label: `Bolsillo: ${bolsillo.nombre} (${fmtCOP(bolsillo.saldo)})`,
        nombre: bolsillo.nombre,
      })
    })

    cuentas.forEach((cuenta) => {
      options.push({
        value: getOriginKey('cuenta', cuenta.id),
        label: `Cuenta: ${cuenta.nombre} (${fmtCOP(cuenta.saldo)})`,
        nombre: cuenta.nombre,
      })
    })

    return options
  }, [bolsillosActivos, cuentas])

  const loadGastos = useCallback(async () => {
    if (!window?.ft) {
      return
    }

    const list = await window.ft.gastos.getAll()
    setGastos(list)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGastos()
  }, [loadGastos])

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const parseOrigin = (value) => {
    if (!value) return { origen_tipo: null, origen_id: null, origen_nombre: null }
    const [tipo, id] = value.split(':')
    const nombre = originOptions.find((item) => item.value === value)?.nombre ?? null
    return { origen_tipo: tipo, origen_id: id, origen_nombre: nombre }
  }

  const submitGasto = async () => {
    if (!window?.ft) return
    if (!form.descripcion || !form.valor) {
      toast?.('Completa descripcion y valor', 'danger')
      return
    }

    const originData = parseOrigin(form.origen)

    await window.ft.gastos.create({
      id: uid(),
      fecha: form.fecha,
      descripcion: form.descripcion,
      valor: Number(form.valor),
      categoria_id: form.categoria_id || null,
      origen_tipo: originData.origen_tipo,
      origen_id: originData.origen_id,
      origen_nombre: originData.origen_nombre,
      ts: Date.now(),
    })

    setForm({ ...emptyGastoForm, fecha: todayStr() })
    await loadGastos()
    await reload?.()
    toast?.('Gasto guardado', 'default')
  }

  const startEdit = (gasto) => {
    setEditing({
      id: gasto.id,
      fecha: gasto.fecha,
      descripcion: gasto.descripcion,
      valor: gasto.valor,
      categoria_id: gasto.categoria_id || '',
      origen: getOriginKey(gasto.origen_tipo, gasto.origen_id),
      origen_nombre: gasto.origen_nombre,
      ts: gasto.ts,
    })
  }

  const saveEdit = async () => {
    if (!window?.ft || !editing) return

    const originData = parseOrigin(editing.origen)

    await window.ft.gastos.update({
      id: editing.id,
      fecha: editing.fecha,
      descripcion: editing.descripcion,
      valor: Number(editing.valor),
      categoria_id: editing.categoria_id || null,
      origen_tipo: originData.origen_tipo,
      origen_id: originData.origen_id,
      origen_nombre: originData.origen_nombre,
      ts: editing.ts ?? Date.now(),
    })

    setEditing(null)
    await loadGastos()
    await reload?.()
    toast?.('Gasto actualizado', 'default')
  }

  const removeGasto = async (gastoId) => {
    if (!window?.ft) return
    await window.ft.gastos.delete(gastoId)
    await loadGastos()
    await reload?.()
    toast?.('Gasto eliminado', 'default')
  }

  const createCategoria = async () => {
    if (!window?.ft) return
    if (!categoriaForm.nombre || !categoriaForm.icon) {
      toast?.('Completa nombre e icono', 'danger')
      return
    }

    await window.ft.categorias.create({
      id: uid(),
      nombre: categoriaForm.nombre,
      icon: categoriaForm.icon,
      color: categoriaForm.color,
    })

    setCategoriaForm(emptyCategoriaForm)
    setShowCategoriaModal(false)
    await reload?.()
    toast?.('Categoria creada', 'default')
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
        <Card style={{ padding: '16px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Nuevo gasto</h2>
            <Btn variant="ghost" onClick={() => setShowCategoriaModal(true)} style={{ fontSize: '12px' }}>
              + Cat
            </Btn>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Input
              label="Fecha"
              type="date"
              value={form.fecha}
              onChange={(event) => handleFormChange('fecha', event.target.value)}
            />
            <Input
              label="Valor"
              type="number"
              value={form.valor}
              onChange={(event) => handleFormChange('valor', event.target.value)}
            />
            <Input
              label="Descripcion"
              value={form.descripcion}
              onChange={(event) => handleFormChange('descripcion', event.target.value)}
            />
            <Select
              label="Categoria"
              value={form.categoria_id}
              onChange={(event) => handleFormChange('categoria_id', event.target.value)}
            >
              <option value="">Sin categoria</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.icon ? `${categoria.icon} ${categoria.nombre}` : categoria.nombre}
                </option>
              ))}
            </Select>
            <Select
              label="Origen del descuento"
              value={form.origen}
              onChange={(event) => handleFormChange('origen', event.target.value)}
            >
              <option value="">Selecciona origen</option>
              {originOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Btn variant="primary" onClick={submitGasto}>
              Guardar gasto
            </Btn>
          </div>
        </Card>

        <Card style={{ padding: '16px', borderRadius: '12px' }}>
          <Label>Categorias</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            {categorias.map((categoria) => (
              <span
                key={categoria.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  borderRadius: '999px',
                  border: `1px solid ${categoria.color}`,
                  color: 'var(--tx)',
                  fontSize: '12px',
                }}
              >
                <span>{categoria.icon}</span>
                {categoria.nombre}
              </span>
            ))}
          </div>
        </Card>
      </aside>

      <section style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px' }}>Gastos</h1>
            <p style={{ margin: '6px 0 0', color: 'var(--mu)' }}>Lista completa de gastos.</p>
          </div>
          <Mono style={{ color: 'var(--rd)' }}>-${fmtCOP(gastos.reduce((sum, gasto) => sum + Number(gasto.valor || 0), 0))}</Mono>
        </div>

        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {gastos.map((gasto, index) => {
              const categoria = categoriaMap.get(gasto.categoria_id)
              const origenNombre =
                gasto.origen_nombre ||
                (gasto.origen_tipo === 'cuenta'
                  ? cuentasMap.get(gasto.origen_id)?.nombre
                  : bolsillosActivos.find((item) => item.id === gasto.origen_id)?.nombre)

              return (
                <div key={gasto.id}>
                  {index > 0 && <Sep style={{ margin: '10px 0' }} />}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ fontSize: '14px', color: 'var(--tx)' }}>{gasto.descripcion}</div>
                        {categoria ? (
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '4px 8px',
                              borderRadius: '999px',
                              background: categoria.color,
                              color: '#0a0a0f',
                            }}
                          >
                            {categoria.icon} {categoria.nombre}
                          </span>
                        ) : null}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--mu)', marginTop: '4px' }}>
                        {gasto.fecha} · de: {origenNombre || 'sin origen'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Mono style={{ color: 'var(--rd)' }}>-${fmtCOP(gasto.valor)}</Mono>
                      <Row>
                        <button
                          type="button"
                          onClick={() => startEdit(gasto)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            border: '1px solid var(--bd2)',
                            background: 'var(--s2)',
                            color: 'var(--tx)',
                          }}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => removeGasto(gasto.id)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            border: '1px solid var(--bd2)',
                            background: 'rgba(242, 107, 107, 0.14)',
                            color: 'var(--rd)',
                          }}
                        >
                          ×
                        </button>
                      </Row>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </section>

      <Modal open={showCategoriaModal} title="Nueva categoria" onClose={() => setShowCategoriaModal(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input
            label="Nombre"
            value={categoriaForm.nombre}
            onChange={(event) => setCategoriaForm((prev) => ({ ...prev, nombre: event.target.value }))}
          />
          <Input
            label="Icono"
            value={categoriaForm.icon}
            onChange={(event) => setCategoriaForm((prev) => ({ ...prev, icon: event.target.value }))}
            placeholder="Ej: 🍔"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Label>Color</Label>
            <input
              type="color"
              value={categoriaForm.color}
              onChange={(event) => setCategoriaForm((prev) => ({ ...prev, color: event.target.value }))}
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
            <Btn variant="ghost" onClick={() => setShowCategoriaModal(false)}>
              Cancelar
            </Btn>
            <Btn variant="primary" onClick={createCategoria}>
              Crear categoria
            </Btn>
          </Row>
        </div>
      </Modal>

      <Modal open={Boolean(editing)} title="Editar gasto" onClose={() => setEditing(null)}>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Input
              label="Fecha"
              type="date"
              value={editing.fecha}
              onChange={(event) => setEditing((prev) => ({ ...prev, fecha: event.target.value }))}
            />
            <Input
              label="Valor"
              type="number"
              value={editing.valor}
              onChange={(event) => setEditing((prev) => ({ ...prev, valor: event.target.value }))}
            />
            <Input
              label="Descripcion"
              value={editing.descripcion}
              onChange={(event) => setEditing((prev) => ({ ...prev, descripcion: event.target.value }))}
            />
            <Select
              label="Categoria"
              value={editing.categoria_id}
              onChange={(event) => setEditing((prev) => ({ ...prev, categoria_id: event.target.value }))}
            >
              <option value="">Sin categoria</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.icon ? `${categoria.icon} ${categoria.nombre}` : categoria.nombre}
                </option>
              ))}
            </Select>
            <Select
              label="Origen del descuento"
              value={editing.origen}
              onChange={(event) => setEditing((prev) => ({ ...prev, origen: event.target.value }))}
            >
              <option value="">Selecciona origen</option>
              {originOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Row style={{ justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => setEditing(null)}>
                Cancelar
              </Btn>
              <Btn variant="primary" onClick={saveEdit}>
                Guardar cambios
              </Btn>
            </Row>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

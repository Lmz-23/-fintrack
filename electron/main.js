/* eslint-disable no-undef */
import Database from 'better-sqlite3'
import { app, BrowserWindow, ipcMain } from 'electron'
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const isDev = !app.isPackaged
let db

const defaultAccounts = [
  { id: 'efectivo', nombre: 'Efectivo', icon: '💵', color: '#2dd4a0', orden: 1 },
  { id: 'cuenta_bancaria', nombre: 'Cuenta bancaria', icon: '🏦', color: '#4d9cf8', orden: 2 },
  { id: 'nequi', nombre: 'Nequi', icon: '📱', color: '#a78bfa', orden: 3 },
  { id: 'elbank', nombre: 'ElBank', icon: '📈', color: '#f5b942', orden: 4 },
  { id: 'cuenta_uber', nombre: 'Cuenta Uber', icon: '🚗', color: '#2dd4a0', orden: 5 },
]

const defaultBolsillos = [
  { id: 'deuda', nombre: 'Deuda', pct: 10, color: '#f26b6b', cuenta_id: 'nequi', orden: 1 },
  { id: 'inversion', nombre: 'Inversión', pct: 15, color: '#f5b942', cuenta_id: 'elbank', orden: 2 },
  { id: 'restante', nombre: 'Restante', pct: 0, color: '#2dd4a0', cuenta_id: 'cuenta_uber', es_restante: 1, orden: 3 },
]

const defaultCategoriasGasto = [
  { id: 'alimentacion', nombre: 'Alimentación', icon: '🍔', color: '#f26b6b' },
  { id: 'transporte', nombre: 'Transporte', icon: '🚌', color: '#4d9cf8' },
  { id: 'salud', nombre: 'Salud', icon: '❤️', color: '#ef4444' },
  { id: 'hogar', nombre: 'Hogar', icon: '🏠', color: '#f5b942' },
  { id: 'deuda', nombre: 'Deuda', icon: '💳', color: '#f26b6b' },
  { id: 'educacion', nombre: 'Educación', icon: '📚', color: '#a78bfa' },
  { id: 'entretenimiento', nombre: 'Entretenimiento', icon: '🎮', color: '#2dd4a0' },
  { id: 'inversion', nombre: 'Inversión', icon: '📈', color: '#f5b942' },
  { id: 'otro', nombre: 'Otro', icon: '📌', color: '#94a3b8' },
]

const getNow = () => Date.now()

const withDefaultId = (value) => value ?? randomUUID()

function initDB() {
  if (db) {
    return db
  }

  const dbPath = path.join(app.getPath('userData'), 'fintrack.db')
  mkdirSync(path.dirname(dbPath), { recursive: true })

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS cuentas (
      id TEXT PRIMARY KEY,
      nombre TEXT,
      icon TEXT,
      color TEXT,
      saldo REAL DEFAULT 0,
      orden INT
    );

    CREATE TABLE IF NOT EXISTS bolsillos (
      id TEXT PRIMARY KEY,
      nombre TEXT,
      pct REAL,
      activo INT DEFAULT 1,
      saldo REAL DEFAULT 0,
      color TEXT,
      cuenta_id TEXT,
      es_restante INT DEFAULT 0,
      orden INT,
      FOREIGN KEY (cuenta_id) REFERENCES cuentas(id)
    );

    CREATE TABLE IF NOT EXISTS categorias_gasto (
      id TEXT PRIMARY KEY,
      nombre TEXT,
      color TEXT,
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS registros (
      id TEXT PRIMARY KEY,
      tipo TEXT,
      fecha TEXT,
      descripcion TEXT,
      monto_bruto REAL,
      monto_gastos REAL,
      monto_neto REAL,
      cuenta_destino_id TEXT,
      fuente TEXT,
      nota TEXT,
      ts INT,
      FOREIGN KEY (cuenta_destino_id) REFERENCES cuentas(id)
    );

    CREATE TABLE IF NOT EXISTS distribuciones (
      id TEXT PRIMARY KEY,
      registro_id TEXT,
      bolsillo_id TEXT,
      cuenta_id TEXT,
      monto REAL,
      FOREIGN KEY (registro_id) REFERENCES registros(id) ON DELETE CASCADE,
      FOREIGN KEY (bolsillo_id) REFERENCES bolsillos(id),
      FOREIGN KEY (cuenta_id) REFERENCES cuentas(id)
    );

    CREATE TABLE IF NOT EXISTS gastos_operacionales (
      id TEXT PRIMARY KEY,
      registro_id TEXT,
      concepto TEXT,
      monto REAL,
      FOREIGN KEY (registro_id) REFERENCES registros(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS gastos (
      id TEXT PRIMARY KEY,
      fecha TEXT,
      descripcion TEXT NOT NULL,
      valor REAL,
      categoria_id TEXT,
      origen_tipo TEXT,
      origen_id TEXT,
      origen_nombre TEXT,
      ts INT,
      FOREIGN KEY (categoria_id) REFERENCES categorias_gasto(id)
    );

    CREATE TABLE IF NOT EXISTS movimientos (
      id TEXT PRIMARY KEY,
      fecha TEXT,
      desde_id TEXT,
      hacia_id TEXT,
      monto REAL,
      nota TEXT,
      ts INT,
      FOREIGN KEY (desde_id) REFERENCES cuentas(id),
      FOREIGN KEY (hacia_id) REFERENCES cuentas(id)
    );
  `)

  const seedDatabase = db.transaction(() => {
    const cuentasCount = db.prepare('SELECT COUNT(*) AS count FROM cuentas').get().count

    if (cuentasCount === 0) {
      const insertCuenta = db.prepare('INSERT INTO cuentas (id, nombre, icon, color, saldo, orden) VALUES (@id, @nombre, @icon, @color, 0, @orden)')
      const insertBolsillo = db.prepare('INSERT INTO bolsillos (id, nombre, pct, activo, saldo, color, cuenta_id, es_restante, orden) VALUES (@id, @nombre, @pct, 1, 0, @color, @cuenta_id, @es_restante, @orden)')
      const insertCategoria = db.prepare('INSERT INTO categorias_gasto (id, nombre, color, icon) VALUES (@id, @nombre, @color, @icon)')

      for (const account of defaultAccounts) {
        insertCuenta.run(account)
      }

      for (const bolsillo of defaultBolsillos) {
        insertBolsillo.run({
          ...bolsillo,
          es_restante: bolsillo.es_restante ?? 0,
        })
      }

      for (const categoria of defaultCategoriasGasto) {
        insertCategoria.run(categoria)
      }
    }
  })

  seedDatabase()

  return db
}

function setupIPC() {
  const ensureDB = () => initDB()
  const getCuentaIdFromBolsillo = ensureDB().prepare('SELECT cuenta_id FROM bolsillos WHERE id = ?')
  const getGastoById = ensureDB().prepare('SELECT * FROM gastos WHERE id = ?')
  const getBolsilloById = ensureDB().prepare('SELECT * FROM bolsillos WHERE id = ?')
  const getCuentaById = ensureDB().prepare('SELECT * FROM cuentas WHERE id = ?')

  const addCuentaSaldo = ensureDB().prepare('UPDATE cuentas SET saldo = saldo + ? WHERE id = ?')
  const subtractCuentaSaldo = ensureDB().prepare('UPDATE cuentas SET saldo = saldo - ? WHERE id = ?')
  const addBolsilloSaldo = ensureDB().prepare('UPDATE bolsillos SET saldo = saldo + ? WHERE id = ?')
  const subtractBolsilloSaldo = ensureDB().prepare('UPDATE bolsillos SET saldo = saldo - ? WHERE id = ?')
  const setCuentaSaldo = ensureDB().prepare('UPDATE cuentas SET saldo = ? WHERE id = ?')
  const countCuentaBolsillos = ensureDB().prepare('SELECT COUNT(*) AS count FROM bolsillos WHERE cuenta_id = ?')
  const countCuentaRegistros = ensureDB().prepare('SELECT COUNT(*) AS count FROM registros WHERE cuenta_destino_id = ?')
  const countCuentaDistribuciones = ensureDB().prepare('SELECT COUNT(*) AS count FROM distribuciones WHERE cuenta_id = ?')
  const countCuentaMovimientos = ensureDB().prepare('SELECT COUNT(*) AS count FROM movimientos WHERE desde_id = ? OR hacia_id = ?')

  const assertCuentaDeletable = (cuentaId) => {
    const total =
      countCuentaBolsillos.get(cuentaId).count +
      countCuentaRegistros.get(cuentaId).count +
      countCuentaDistribuciones.get(cuentaId).count +
      countCuentaMovimientos.get(cuentaId, cuentaId).count

    if (total > 0) {
      throw new Error('No se puede eliminar la cuenta porque tiene movimientos o bolsillos asociados.')
    }
  }

  const applyDistributionRows = (registroId, distribuciones = []) => {
    const insertDistribucion = ensureDB().prepare('INSERT INTO distribuciones (id, registro_id, bolsillo_id, cuenta_id, monto) VALUES (?, ?, ?, ?, ?)')

    for (const distribucion of distribuciones) {
      const id = withDefaultId(distribucion.id)
      const monto = Number(distribucion.monto ?? 0)
      const bolsilloId = distribucion.bolsillo_id ?? null
      const cuentaId = distribucion.cuenta_id ?? null

      insertDistribucion.run(id, registroId, bolsilloId, cuentaId, monto)

      if (bolsilloId) {
        addBolsilloSaldo.run(monto, bolsilloId)
      }

      if (cuentaId) {
        addCuentaSaldo.run(monto, cuentaId)
      }
    }
  }

  const chargeExpenseOrigin = (origenTipo, origenId, valor) => {
    const amount = Number(valor ?? 0)

    if (origenTipo === 'cuenta') {
      subtractCuentaSaldo.run(amount, origenId)
      return
    }

    if (origenTipo === 'bolsillo') {
      const bolsillo = getBolsilloById.get(origenId)

      if (!bolsillo) {
        throw new Error('Bolsillo no encontrado')
      }

      subtractBolsilloSaldo.run(amount, origenId)
      subtractCuentaSaldo.run(amount, bolsillo.cuenta_id)
    }
  }

  const refundExpenseOrigin = (origenTipo, origenId, valor) => {
    const amount = Number(valor ?? 0)

    if (origenTipo === 'cuenta') {
      addCuentaSaldo.run(amount, origenId)
      return
    }

    if (origenTipo === 'bolsillo') {
      const bolsillo = getBolsilloById.get(origenId)

      if (!bolsillo) {
        throw new Error('Bolsillo no encontrado')
      }

      addBolsilloSaldo.run(amount, origenId)
      addCuentaSaldo.run(amount, bolsillo.cuenta_id)
    }
  }

  ipcMain.handle('cuentas:getAll', () => {
    return ensureDB().prepare('SELECT * FROM cuentas ORDER BY orden').all()
  })

  ipcMain.handle('cuentas:create', (_event, cuenta) => {
    return ensureDB().prepare('INSERT INTO cuentas (id, nombre, icon, color, saldo, orden) VALUES (?, ?, ?, ?, 0, ?)').run(
      cuenta.id,
      cuenta.nombre,
      cuenta.icon,
      cuenta.color,
      cuenta.orden,
    )
  })

  ipcMain.handle('cuentas:update', (_event, cuenta) => {
    return ensureDB().prepare('UPDATE cuentas SET nombre = ?, icon = ?, color = ? WHERE id = ?').run(
      cuenta.nombre,
      cuenta.icon,
      cuenta.color,
      cuenta.id,
    )
  })

  ipcMain.handle('cuentas:setSaldo', (_event, { id, saldo }) => {
    return setCuentaSaldo.run(saldo, id)
  })

  ipcMain.handle('cuentas:delete', (_event, { id }) => {
    assertCuentaDeletable(id)
    return ensureDB().prepare('DELETE FROM cuentas WHERE id = ?').run(id)
  })

  ipcMain.handle('bolsillos:getAll', () => {
    return ensureDB().prepare('SELECT * FROM bolsillos ORDER BY orden').all()
  })

  ipcMain.handle('bolsillos:create', (_event, bolsillo) => {
    return ensureDB().prepare('INSERT INTO bolsillos (id, nombre, pct, activo, saldo, color, cuenta_id, es_restante, orden) VALUES (?, ?, ?, 1, 0, ?, ?, 0, ?)').run(
      bolsillo.id,
      bolsillo.nombre,
      bolsillo.pct,
      bolsillo.color,
      bolsillo.cuenta_id,
      bolsillo.orden,
    )
  })

  ipcMain.handle('bolsillos:update', (_event, bolsillo) => {
    return ensureDB().prepare('UPDATE bolsillos SET nombre = ?, pct = ?, activo = ?, color = ?, cuenta_id = ? WHERE id = ?').run(
      bolsillo.nombre,
      bolsillo.pct,
      bolsillo.activo,
      bolsillo.color,
      bolsillo.cuenta_id,
      bolsillo.id,
    )
  })

  ipcMain.handle('bolsillos:delete', (_event, { id }) => {
    return ensureDB().prepare('DELETE FROM bolsillos WHERE id = ?').run(id)
  })

  ipcMain.handle('categorias:getAll', () => {
    return ensureDB().prepare('SELECT * FROM categorias_gasto ORDER BY nombre').all()
  })

  ipcMain.handle('categorias:create', (_event, categoria) => {
    return ensureDB().prepare('INSERT INTO categorias_gasto (id, nombre, color, icon) VALUES (?, ?, ?, ?)').run(
      categoria.id,
      categoria.nombre,
      categoria.color,
      categoria.icon,
    )
  })

  ipcMain.handle('categorias:delete', (_event, { id }) => {
    return ensureDB().prepare('DELETE FROM categorias_gasto WHERE id = ?').run(id)
  })

  ipcMain.handle('ingresos:guardarUber', (_event, payload) => {
    const transaction = ensureDB().transaction((data) => {
      ensureDB().prepare(
        'INSERT INTO registros (id, tipo, fecha, descripcion, monto_bruto, monto_gastos, monto_neto, cuenta_destino_id, fuente, nota, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ).run(
        data.id,
        'uber',
        data.fecha,
        'Uber',
        data.bruto,
        data.gt,
        data.neto,
        null,
        'uber',
        null,
        getNow(),
      )

      const insertGastoOperacional = ensureDB().prepare('INSERT INTO gastos_operacionales (id, registro_id, concepto, monto) VALUES (?, ?, ?, ?)')

      for (const gastoOp of data.gastos_op ?? []) {
        insertGastoOperacional.run(
          withDefaultId(gastoOp.id),
          data.id,
          gastoOp.concepto,
          gastoOp.monto,
        )
      }

      applyDistributionRows(data.id, data.distribuciones ?? [])
    })

    return transaction(payload)
  })

  ipcMain.handle('ingresos:guardarRapido', (_event, payload) => {
    const transaction = ensureDB().transaction((data) => {
      ensureDB().prepare(
        'INSERT INTO registros (id, tipo, fecha, descripcion, monto_bruto, monto_gastos, monto_neto, cuenta_destino_id, fuente, nota, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ).run(
        data.id,
        'rapido',
        data.fecha,
        data.descripcion,
        data.monto,
        0,
        data.monto,
        data.cuenta_id ?? null,
        data.fuente ?? null,
        null,
        getNow(),
      )

      if ((data.distribuciones ?? []).length > 0) {
        applyDistributionRows(data.id, data.distribuciones)
      } else if (data.cuenta_id) {
        addCuentaSaldo.run(Number(data.monto ?? 0), data.cuenta_id)
      }
    })

    return transaction(payload)
  })

  ipcMain.handle('ingresos:guardarBalance', (_event, payload) => {
    const transaction = ensureDB().transaction((data) => {
      ensureDB().prepare(
        'INSERT INTO registros (id, tipo, fecha, descripcion, monto_bruto, monto_gastos, monto_neto, cuenta_destino_id, fuente, nota, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ).run(
        data.id,
        'balance',
        data.fecha,
        'Balance',
        data.diff,
        0,
        data.diff,
        null,
        'balance',
        data.nota ?? null,
        getNow(),
      )

      for (const ajuste of data.ajustes ?? []) {
        setCuentaSaldo.run(ajuste.saldo_nuevo, ajuste.cuenta_id)
      }
    })

    return transaction(payload)
  })

  ipcMain.handle('gastos:getAll', () => {
    return ensureDB().prepare(`
      SELECT
        gastos.*,
        categorias_gasto.nombre AS categoria_nombre,
        categorias_gasto.color AS categoria_color,
        categorias_gasto.icon AS categoria_icon
      FROM gastos
      LEFT JOIN categorias_gasto ON categorias_gasto.id = gastos.categoria_id
      ORDER BY gastos.ts DESC
      LIMIT 100
    `).all()
  })

  ipcMain.handle('gastos:create', (_event, gasto) => {
    const transaction = ensureDB().transaction((data) => {
      ensureDB().prepare(
        'INSERT INTO gastos (id, fecha, descripcion, valor, categoria_id, origen_tipo, origen_id, origen_nombre, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ).run(
        withDefaultId(data.id),
        data.fecha,
        data.descripcion,
        data.valor,
        data.categoria_id ?? null,
        data.origen_tipo ?? null,
        data.origen_id ?? null,
        data.origen_nombre ?? null,
        data.ts ?? getNow(),
      )

      chargeExpenseOrigin(data.origen_tipo, data.origen_id, data.valor)
    })

    return transaction(gasto)
  })

  ipcMain.handle('gastos:update', (_event, gasto) => {
    const transaction = ensureDB().transaction((data) => {
      const oldGasto = getGastoById.get(data.id)

      if (!oldGasto) {
        throw new Error('Gasto no encontrado')
      }

      refundExpenseOrigin(oldGasto.origen_tipo, oldGasto.origen_id, oldGasto.valor)

      ensureDB().prepare(
        'UPDATE gastos SET fecha = ?, descripcion = ?, valor = ?, categoria_id = ?, origen_tipo = ?, origen_id = ?, origen_nombre = ?, ts = ? WHERE id = ?',
      ).run(
        data.fecha,
        data.descripcion,
        data.valor,
        data.categoria_id ?? null,
        data.origen_tipo ?? null,
        data.origen_id ?? null,
        data.origen_nombre ?? null,
        data.ts ?? getNow(),
        data.id,
      )

      chargeExpenseOrigin(data.origen_tipo, data.origen_id, data.valor)
    })

    return transaction(gasto)
  })

  ipcMain.handle('gastos:delete', (_event, { id }) => {
    const transaction = ensureDB().transaction((gastoId) => {
      const oldGasto = getGastoById.get(gastoId)

      if (!oldGasto) {
        return { changes: 0 }
      }

      refundExpenseOrigin(oldGasto.origen_tipo, oldGasto.origen_id, oldGasto.valor)
      return ensureDB().prepare('DELETE FROM gastos WHERE id = ?').run(gastoId)
    })

    return transaction(id)
  })

  ipcMain.handle('movimientos:create', (_event, movimiento) => {
    const transaction = ensureDB().transaction((data) => {
      ensureDB().prepare(
        'INSERT INTO movimientos (id, fecha, desde_id, hacia_id, monto, nota, ts) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ).run(
        withDefaultId(data.id),
        data.fecha,
        data.desde_id,
        data.hacia_id,
        data.monto,
        data.nota ?? null,
        data.ts ?? getNow(),
      )

      subtractCuentaSaldo.run(Number(data.monto ?? 0), data.desde_id)
      addCuentaSaldo.run(Number(data.monto ?? 0), data.hacia_id)
    })

    return transaction(movimiento)
  })

  ipcMain.handle('movimientos:getAll', () => {
    return ensureDB().prepare('SELECT * FROM movimientos ORDER BY ts DESC LIMIT 50').all()
  })

  ipcMain.handle('stats:dashboard', () => {
    const database = ensureDB()

    const totalCuentas = database.prepare('SELECT COALESCE(SUM(saldo), 0) AS total FROM cuentas').get().total
    const ingresosNetos = database.prepare("SELECT COALESCE(SUM(monto_neto), 0) AS total FROM registros WHERE tipo IN ('uber', 'rapido')").get().total
    const totalGastos = database.prepare('SELECT COALESCE(SUM(valor), 0) AS total FROM gastos').get().total

    const porDia = database.prepare(`
      SELECT fecha, COALESCE(SUM(monto_neto), 0) AS total
      FROM registros
      WHERE tipo IN ('uber', 'rapido')
      GROUP BY fecha
      ORDER BY fecha DESC
      LIMIT 30
    `).all()

    const porCategoria = database.prepare(`
      SELECT
        categorias_gasto.id AS categoria_id,
        categorias_gasto.nombre,
        categorias_gasto.color,
        categorias_gasto.icon,
        COALESCE(SUM(gastos.valor), 0) AS total
      FROM gastos
      LEFT JOIN categorias_gasto ON categorias_gasto.id = gastos.categoria_id
      GROUP BY categorias_gasto.id, categorias_gasto.nombre, categorias_gasto.color, categorias_gasto.icon
      ORDER BY total DESC
    `).all()

    const recientes = database.prepare(`
      SELECT id, 'registro' AS tipo, fecha, descripcion, monto_neto AS monto, ts
      FROM registros
      UNION ALL
      SELECT id, 'gasto' AS tipo, fecha, descripcion, valor AS monto, ts
      FROM gastos
      ORDER BY ts DESC
      LIMIT 10
    `).all()

    return {
      totalCuentas,
      ingresosNetos,
      totalGastos,
      porDia,
      porCategoria,
      recientes,
    }
  })

  ipcMain.handle('historial:get', (_event, filtros = {}) => {
    const database = ensureDB()
    const params = {
      fechaDesde: filtros.fechaDesde ?? null,
      fechaHasta: filtros.fechaHasta ?? null,
    }

    return database.prepare(`
      SELECT id, 'registro' AS tipo, fecha, descripcion, monto_neto AS monto, fuente, nota, ts, tipo AS subtipo, cuenta_destino_id AS cuenta_id, NULL AS categoria_id, NULL AS origen_tipo, NULL AS origen_id, NULL AS origen_nombre
      FROM registros
      WHERE (:fechaDesde IS NULL OR fecha >= :fechaDesde)
        AND (:fechaHasta IS NULL OR fecha <= :fechaHasta)
      UNION ALL
      SELECT id, 'gasto' AS tipo, fecha, descripcion, valor AS monto, NULL AS fuente, NULL AS nota, ts, NULL AS subtipo, NULL AS cuenta_id, categoria_id, origen_tipo, origen_id, origen_nombre
      FROM gastos
      WHERE (:fechaDesde IS NULL OR fecha >= :fechaDesde)
        AND (:fechaHasta IS NULL OR fecha <= :fechaHasta)
      UNION ALL
      SELECT id, 'movimiento' AS tipo, fecha, COALESCE(nota, '') AS descripcion, monto, NULL AS fuente, nota, ts, NULL AS subtipo, NULL AS cuenta_id, NULL AS categoria_id, desde_id AS origen_tipo, hacia_id AS origen_id, NULL AS origen_nombre
      FROM movimientos
      WHERE (:fechaDesde IS NULL OR fecha >= :fechaDesde)
        AND (:fechaHasta IS NULL OR fecha <= :fechaHasta)
      ORDER BY ts DESC
    `).all(params)
  })

  return {
    getCuentaById,
    getCuentaIdFromBolsillo,
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0a0a0f',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  initDB()
  setupIPC()
  createWindow()
}).catch((error) => {
  console.error('Failed to initialize FinTrack', error)
  app.quit()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
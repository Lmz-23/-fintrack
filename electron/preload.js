/* eslint-disable no-undef */
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('ft', {
	cuentas: {
		getAll: () => ipcRenderer.invoke('cuentas:getAll'),
		create: (c) => ipcRenderer.invoke('cuentas:create', c),
		update: (c) => ipcRenderer.invoke('cuentas:update', c),
		setSaldo: (d) => ipcRenderer.invoke('cuentas:setSaldo', d),
		delete: (id) => ipcRenderer.invoke('cuentas:delete', { id }),
	},
	bolsillos: {
		getAll: () => ipcRenderer.invoke('bolsillos:getAll'),
		create: (b) => ipcRenderer.invoke('bolsillos:create', b),
		update: (b) => ipcRenderer.invoke('bolsillos:update', b),
		delete: (id) => ipcRenderer.invoke('bolsillos:delete', { id }),
	},
	categorias: {
		getAll: () => ipcRenderer.invoke('categorias:getAll'),
		create: (c) => ipcRenderer.invoke('categorias:create', c),
		delete: (id) => ipcRenderer.invoke('categorias:delete', { id }),
	},
	ingresos: {
		guardarUber: (d) => ipcRenderer.invoke('ingresos:guardarUber', d),
		guardarRapido: (d) => ipcRenderer.invoke('ingresos:guardarRapido', d),
		guardarBalance: (d) => ipcRenderer.invoke('ingresos:guardarBalance', d),
	},
	gastos: {
		getAll: (filtros) => ipcRenderer.invoke('gastos:getAll', filtros),
		create: (g) => ipcRenderer.invoke('gastos:create', g),
		update: (g) => ipcRenderer.invoke('gastos:update', g),
		delete: (id) => ipcRenderer.invoke('gastos:delete', { id }),
	},
	movimientos: {
		create: (m) => ipcRenderer.invoke('movimientos:create', m),
		getAll: () => ipcRenderer.invoke('movimientos:getAll'),
	},
	stats: {
		dashboard: () => ipcRenderer.invoke('stats:dashboard'),
	},
	historial: {
		get: (filtros) => ipcRenderer.invoke('historial:get', filtros),
	},
})
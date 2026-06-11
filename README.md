# FinTrack

<p align="center">
  <img src="https://img.shields.io/badge/version-0.0.0-blue" alt="version">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license">
  <img src="https://img.shields.io/badge/platform-Windows-blue" alt="platform">
</p>

Aplicación de escritorio para gestión de finanzas personales. Controla tus cuentas, bolsillos, gastos e ingresos con una interfaz moderna y rápida.

## Características

- **Dashboard** - Resumen visual de tus finanzas con gráficos interactivos
- **Cuentas** - Gestión de cuentas bancarias y efectivo
- **Bolsillos** - Divide tu dinero en categorías de ahorro
- **Gastos** - Registro y categorización de gastos
- **Ingresos** - Control de entradas de dinero
- **Historial** - Registro completo de todas las transacciones
- **Atajos de teclado** - Navegación rápida (D, G, N, H)
- **Base de datos local** - SQLite para almacenamiento offline seguro

## Tecnologías

- **Frontend**: React 19 + Vite 8
- **Backend**: Electron 39
- **Base de datos**: better-sqlite3
- **Gráficos**: Recharts
- **Fechas**: date-fns

## Requisitos previos

- Node.js 18+
- npm 9+
- Windows 10/11

## Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd fintrack

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

## Atajos de teclado

| Tecla | Acción |
|-------|--------|
| `D` | Dashboard |
| `N` | Nuevo registro |
| `G` | Gastos |
| `H` | Historial |

## Estructura del proyecto

```
fintrack/
├── electron/          # Proceso principal de Electron
│   ├── main.js       # Punto de entrada
│   └── preload.js    # Precarga de APIs
├── src/
│   ├── components/   # Componentes reutilizables
│   ├── hooks/        # Custom hooks (useDB, useToast)
│   ├── pages/        # Vistas de la aplicación
│   ├── App.jsx       # Componente principal
│   └── main.jsx      # Entry point
├── dist/             # Build de producción
└── package.json      # Dependencias y scripts
```

## Licencia

MIT
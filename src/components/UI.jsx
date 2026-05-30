/* eslint-disable react-refresh/only-export-components */
import { useId } from 'react'

const cardStyle = {
  background: 'var(--s1)',
  border: '0.5px solid var(--bd)',
  borderRadius: '14px',
  padding: '18px 20px',
}

const labelStyle = {
  display: 'inline-block',
  fontSize: '10px',
  lineHeight: '1',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--mu)',
}

const fieldBaseStyle = {
  width: '100%',
  background: 'var(--s2)',
  border: '1px solid var(--bd2)',
  borderRadius: '8px',
  padding: '10px 12px',
  color: 'var(--tx)',
  outline: 'none',
  transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
}

const selectStyle = {
  ...fieldBaseStyle,
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  paddingRight: '36px',
}

const buttonStyles = {
  primary: {
    background: 'var(--gr)',
    color: '#000',
    border: '1px solid transparent',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--tx)',
    border: '1px solid var(--bd2)',
  },
  danger: {
    background: 'rgba(242, 107, 107, 0.12)',
    color: 'var(--rd)',
    border: '1px solid rgba(242, 107, 107, 0.24)',
  },
  default: {
    background: 'var(--s2)',
    color: 'var(--tx)',
    border: '1px solid var(--bd2)',
  },
}

export function Card({ children, style, ...props }) {
  return (
    <div style={{ ...cardStyle, ...style }} {...props}>
      {children}
    </div>
  )
}

export function Label({ children, style, ...props }) {
  return (
    <span style={{ ...labelStyle, ...style }} {...props}>
      {children}
    </span>
  )
}

function FieldShell({ label, children, style, gap = 8, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, ...style }} {...props}>
      {label ? <Label>{label}</Label> : null}
      {children}
    </div>
  )
}

export function Input({ label, style, inputStyle, onFocus, onBlur, id, ...props }) {
  const inputId = useId()
  const handleFocus = (event) => {
    event.currentTarget.style.borderColor = 'var(--gr)'
    event.currentTarget.style.boxShadow = '0 0 0 3px rgba(45, 212, 160, 0.12)'
    onFocus?.(event)
  }

  const handleBlur = (event) => {
    event.currentTarget.style.borderColor = 'var(--bd2)'
    event.currentTarget.style.boxShadow = 'none'
    onBlur?.(event)
  }

  return (
    <FieldShell label={label} style={style}>
      <input
        id={id ?? inputId}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{ ...fieldBaseStyle, ...inputStyle }}
        {...props}
      />
    </FieldShell>
  )
}

export function Select({ label, style, selectStyle: customSelectStyle, children, id, ...props }) {
  const selectId = useId()

  return (
    <FieldShell label={label} style={style}>
      <select
        id={id ?? selectId}
        {...props}
        style={{ ...selectStyle, ...customSelectStyle }}
      >
        {children}
      </select>
    </FieldShell>
  )
}

export function Btn({
  children,
  variant = 'default',
  style,
  type = 'button',
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  ...props
}) {
  const handleMouseDown = (event) => {
    event.currentTarget.style.transform = 'translateY(1px)'
    onMouseDown?.(event)
  }

  const handleMouseUp = (event) => {
    event.currentTarget.style.transform = 'translateY(0)'
    onMouseUp?.(event)
  }

  const handleMouseLeave = (event) => {
    event.currentTarget.style.transform = 'translateY(0)'
    onMouseLeave?.(event)
  }

  return (
    <button
      type={type}
      style={{
        ...buttonStyles[variant],
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        minHeight: '40px',
        padding: '10px 14px',
        borderRadius: '12px',
        fontWeight: 600,
        transition: 'transform 160ms ease, filter 160ms ease, opacity 160ms ease',
        ...style,
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </button>
  )
}

export function Row({ children, style, ...props }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', ...style }} {...props}>
      {children}
    </div>
  )
}

export function Toggle({ checked, onChange, disabled, style }) {
  const id = useId()

  return (
    <label
      htmlFor={id}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      <span
        style={{
          position: 'relative',
          width: '44px',
          height: '26px',
          borderRadius: '999px',
          background: checked ? 'var(--gr)' : 'var(--s3)',
          border: '1px solid var(--bd2)',
          transition: 'background 160ms ease, border-color 160ms ease',
          flex: '0 0 auto',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '50%',
            left: checked ? '23px' : '3px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: 'var(--tx)',
            transform: 'translateY(-50%)',
            transition: 'left 180ms ease, background 180ms ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
          }}
        />
      </span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked, event)}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
      />
    </label>
  )
}

export function Modal({ open, title, onClose, children }) {
  if (!open) {
    return null
  }

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'grid',
        placeItems: 'center',
        padding: '20px',
        background: 'rgba(5, 5, 10, 0.72)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: 'modal-fade-in 180ms ease-out',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        style={{
          width: 'min(720px, 100%)',
          maxHeight: 'min(84vh, 860px)',
          overflow: 'auto',
          background: 'var(--s1)',
          border: '1px solid var(--bd)',
          borderRadius: '18px',
          boxShadow: '0 28px 90px rgba(0, 0, 0, 0.45)',
          animation: 'modal-slide-in 220ms ease-out',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '18px 20px',
            borderBottom: '1px solid var(--bd)',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '18px', letterSpacing: '-0.02em' }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'var(--s2)',
              color: 'var(--mu)',
              border: '1px solid var(--bd2)',
              fontSize: '18px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    </div>
  )
}

export function Mono({ children, style, ...props }) {
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, ...style }} {...props}>
      {children}
    </span>
  )
}

export function Sep({ style, ...props }) {
  return <div style={{ borderTop: '0.5px solid var(--bd)', width: '100%', ...style }} {...props} />
}

export function fmtFull(n) {
  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
  }).format(Number(n || 0))
}

export function fmtCOP(n) {
  const value = Number(n || 0)
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (abs >= 1000000) {
    const compact = abs / 1000000
    const formatted = Number.isInteger(compact) ? String(compact) : compact.toFixed(1)
    return `${sign}$${formatted.replace('.', ',')}M`
  }

  if (abs >= 1000) {
    const compact = abs / 1000
    const formatted = Number.isInteger(compact) ? String(compact) : compact.toFixed(1)
    return `${sign}$${formatted.replace('.', ',')}k`
  }

  return `${sign}$${fmtFull(abs)}`
}

export function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

export function todayStr() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default {
  Card,
  Label,
  Input,
  Select,
  Btn,
  Row,
  Toggle,
  Modal,
  Mono,
  Sep,
  fmtCOP,
  fmtFull,
  uid,
  todayStr,
}

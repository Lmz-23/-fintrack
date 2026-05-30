import { useCallback, useRef, useState } from 'react'

export default function useToast() {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const toast = useCallback((msg, type = 'ok', duration = 2500) => {
    const id = `${Date.now()}-${counter.current++}`
    const nextToast = { id, msg, type }

    setToasts((current) => [...current, nextToast])

    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, duration)
  }, [])

  return {
    toasts,
    toast,
  }
}

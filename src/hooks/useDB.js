import { useCallback, useEffect, useState } from 'react'

const initialState = {
  cuentas: [],
  bolsillos: [],
  categorias: [],
  stats: null,
}

export default function useDB() {
  const [data, setData] = useState(initialState)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const api = typeof window !== 'undefined' ? window.ft : null

    setLoading(true)

    if (!api) {
      setData(initialState)
      setLoading(false)
      return
    }

    try {
      const [cuentas, bolsillos, categorias, stats] = await Promise.all([
        api.cuentas.getAll(),
        api.bolsillos.getAll(),
        api.categorias.getAll(),
        api.stats.dashboard(),
      ])

      setData({ cuentas, bolsillos, categorias, stats })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload()
  }, [reload])

  return {
    ...data,
    loading,
    reload,
  }
}

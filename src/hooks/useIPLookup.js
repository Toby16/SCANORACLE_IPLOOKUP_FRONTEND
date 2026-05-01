import { useState, useCallback } from 'react'
import { lookupIP } from '../services/ipService.js'

export function useIPLookup() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const lookup = useCallback(async (target) => {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const result = await lookupIP(target)
      setData(result)
    } catch (err) {
      setError(err.message || 'Lookup failed.')
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
  }, [])

  return { data, loading, error, lookup, reset }
}

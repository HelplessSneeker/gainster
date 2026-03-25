"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseFetchResult<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  refresh: () => void
}

export function useFetch<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  refreshInterval?: number,
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const fetcherRef = useRef(fetcher)
  const hasDataRef = useRef(false)
  fetcherRef.current = fetcher

  const doFetch = useCallback(() => {
    // Only show loading skeleton on initial load, not background refreshes
    if (!hasDataRef.current) {
      setIsLoading(true)
    }
    let cancelled = false
    fetcherRef
      .current()
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setError(null)
          hasDataRef.current = true
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const cancel = doFetch()
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    if (!refreshInterval) return
    const id = setInterval(() => { doFetch() }, refreshInterval)
    return () => clearInterval(id)
  }, [refreshInterval, doFetch])

  return { data, error, isLoading, refresh: doFetch }
}

"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseFetchResult<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  refresh: () => void
  staleError: Error | null
}

export function useFetch<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
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
    const controller = new AbortController()
    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result)
          setError(null)
          hasDataRef.current = true
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })
    return () => { controller.abort() }
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

  return { data, error, isLoading, refresh: doFetch, staleError: data && error ? error : null }
}

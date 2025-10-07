import { useEffect, useState } from "react"

export enum LoadingStatus { NONE, LOADING, FINISHED, ERROR }

export function useDataLoader<T>(fetchFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [status, setStatus] = useState<LoadingStatus>(LoadingStatus.NONE)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      if (status === LoadingStatus.LOADING) return
      setStatus(LoadingStatus.LOADING)
      try {
        const res = await fetchFn()
        if (active) {
          setData(res)
          setStatus(LoadingStatus.FINISHED)
        }
      } catch (err) {
        if (active) {
          setError(err as Error)
          setStatus(LoadingStatus.ERROR)
        }
      }
    })()
    return () => {
      active = false
    }
  }, [fetchFn])

  return { data, status, error }
}
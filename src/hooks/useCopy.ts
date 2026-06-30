import { useState, useCallback } from 'react'

export function useCopy() {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000)
      return true
    } catch {
      return false
    }
  }, [])

  return { copiedId, copy }
}

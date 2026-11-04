// @ts-nocheck
import * as React from "react"

export function useFormReset(getElement: () => Element | null | undefined, onReset: () => void): void {
  const latest = React.useRef({ getElement, onReset })
  latest.current = { getElement, onReset }
  React.useEffect(() => {
    const onEvent = (event: Event) => {
      const el = latest.current.getElement()
      const form = event.target
      if (!el || !(form instanceof HTMLFormElement)) return
      if (form === (el as Element & { form?: HTMLFormElement | null }).form || form.contains(el)) latest.current.onReset()
    }
    document.addEventListener("reset", onEvent)
    return () => document.removeEventListener("reset", onEvent)
  }, [])
}

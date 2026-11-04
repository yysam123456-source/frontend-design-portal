// @ts-nocheck
"use client"

import * as React from "react"

import { ensureInkDefs } from "../../ink/react/defs"
import { useInkContext } from "../../ink/react/hooks"

export function useEnsureInkDefs(): void {
  const { hasProvider } = useInkContext()
  React.useLayoutEffect(() => {
    if (!hasProvider) ensureInkDefs()
  }, [hasProvider])
}

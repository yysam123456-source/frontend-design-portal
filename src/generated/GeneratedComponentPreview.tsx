import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import type { ComponentEntry, ComponentSummary } from '../types'
import PreviewBoundary from './PreviewBoundary'
import { previewRegistry } from './preview-registry'

interface GeneratedComponentPreviewProps {
  component: Pick<ComponentEntry, 'id'> | ComponentSummary
  compact?: boolean
}

export default function GeneratedComponentPreview({
  component,
  compact,
}: GeneratedComponentPreviewProps) {
  const loader = previewRegistry[component.id]

  if (!loader) {
    return (
      <div
        className={`flex w-full items-center justify-center bg-bg-secondary text-ink-muted ${
          compact ? 'h-full text-[11px]' : 'min-h-[360px] text-sm'
        }`}
      >
        暂未生成真实预览
      </div>
    )
  }

  const Preview = lazy(loader)

  return (
    <PreviewBoundary compact={compact}>
      <Suspense
        fallback={
          <div
            className={`flex w-full flex-col items-center justify-center gap-2 bg-bg-secondary ${
              compact ? 'h-full' : 'min-h-[360px]'
            }`}
          >
            <Loader2 className="h-4 w-4 animate-spin text-ink-subtle" />
            {!compact && <span className="text-xs text-ink-subtle">加载真实预览...</span>}
          </div>
        }
      >
        <Preview component={component} compact={compact} />
      </Suspense>
    </PreviewBoundary>
  )
}

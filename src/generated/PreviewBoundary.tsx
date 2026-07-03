import { Component, type ErrorInfo, type ReactNode } from 'react'

interface PreviewBoundaryProps {
  children: ReactNode
  compact?: boolean
}

interface PreviewBoundaryState {
  error: Error | null
}

export default class PreviewBoundary extends Component<PreviewBoundaryProps, PreviewBoundaryState> {
  state: PreviewBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): PreviewBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[preview-render-error]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className={`flex w-full flex-col items-center justify-center gap-2 bg-bg-secondary text-center ${
            this.props.compact ? 'h-full p-3' : 'min-h-[360px] p-8'
          }`}
        >
          <div className="text-xs font-medium text-ink">预览渲染失败</div>
          <div className="max-w-md text-[11px] leading-relaxed text-ink-muted">
            {this.state.error.message}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

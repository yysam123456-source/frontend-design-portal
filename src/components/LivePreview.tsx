import { useState, useRef, useEffect, useCallback } from 'react'
import { ExternalLink, AlertCircle } from 'lucide-react'

interface LivePreviewProps {
  url: string
  title: string
}

export default function LivePreview({ url, title }: LivePreviewProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    setStatus('loading')
    clearTimer()

    timerRef.current = setTimeout(() => {
      setStatus((current) => {
        if (current === 'loading') {
          return 'error'
        }
        return current
      })
    }, 5000)

    return () => clearTimer()
  }, [url, clearTimer])

  const handleLoad = () => {
    clearTimer()
    try {
      const iframe = iframeRef.current
      if (iframe && iframe.contentWindow) {
        const loc = iframe.contentWindow.location.href
        if (loc === 'about:blank') {
          setStatus('error')
          return
        }
      }
    } catch {
      // cross-origin: ok
    }
    setStatus('loaded')
  }

  const handleError = () => {
    clearTimer()
    setStatus('error')
  }

  return (
    <div className="relative w-full aspect-[16/10] bg-bg-secondary rounded-lg overflow-hidden border border-border">
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 transition-opacity duration-300 ${
          status === 'error' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <AlertCircle className="w-8 h-8 text-ink-subtle" />
        <p className="text-sm text-ink-muted text-center">
          该站点禁止 iframe 嵌入
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-light transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          在新标签页打开
        </a>
      </div>

      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
            <span className="text-xs text-ink-subtle">加载预览...</span>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={url}
        title={title}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-popups"
        className={`w-full h-full border-0 transition-opacity duration-300 ${
          status === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
}

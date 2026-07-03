import { useState, useMemo, useEffect, useRef } from 'react'
import { Monitor, Code2, AlertCircle, Loader2 } from 'lucide-react'
import type { ComponentEntry } from '../types'
import GeneratedComponentPreview from '../generated/GeneratedComponentPreview'
import { getPreviewRecord } from '../generated/preview-manifest'

interface ComponentPreviewProps {
  component: ComponentEntry | null
}

function buildHtmlPreview(code: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0a0a0a;
    padding: 20px;
    font-family: system-ui, -apple-system, sans-serif;
  }
</style>
</head>
<body>
${code}
</body>
</html>`
}

function buildJsPreview(code: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0a0a0a;
    color: #f8fafc;
    padding: 20px;
    font-family: system-ui, -apple-system, sans-serif;
  }
  #root { width: min(100%, 760px); min-height: 360px; display: grid; place-items: center; }
</style>
</head>
<body>
<div id="root"></div>
<script type="module">
const root = document.getElementById('root')
try {
${code}
} catch (error) {
  root.innerHTML = '<div style="color:#f87171;text-align:center;">JS demo failed: ' + (error?.message || error) + '</div>'
}
</script>
</body>
</html>`
}

function extractVideoSrc(html: string): string | null {
  const match = html.match(/<video[^>]+src=["']([^"']+)["'][^>]*>/i)
  return match ? match[1] : null
}

export default function ComponentPreview({ component }: ComponentPreviewProps) {
  const isHtml = component?.codeSnippet.language === 'html'
  const previewRecord = getPreviewRecord(component?.id)
  const hasGenerated = previewRecord?.kind === 'react-generated' && previewRecord.status === 'ready'
  const isJsDemo = previewRecord?.kind === 'js-demo' && previewRecord.status === 'ready'
  const isMediaVideo = previewRecord?.kind === 'media-video' && previewRecord.status === 'ready'
  const isMediaImage = previewRecord?.kind === 'media-image' && previewRecord.status === 'ready'
  // Detect HTML that contains a <video> tag — render directly instead of iframe to avoid sandbox media blocks
  const htmlVideoSrc = isHtml && component ? extractVideoSrc(component.codeSnippet.source) : null
  const isHtmlVideo = !!htmlVideoSrc
  const canPreview = isHtml || hasGenerated || isJsDemo || isMediaVideo || isMediaImage
  const [mode, setMode] = useState<'preview' | 'code'>(canPreview ? 'preview' : 'code')
  const [iframeStatus, setIframeStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [codeExpanded, setCodeExpanded] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset mode when component changes
  useEffect(() => {
    setMode(canPreview ? 'preview' : 'code')
  }, [canPreview, component?.id])

  const iframeUrl = useMemo(() => {
    if (!component || (!isHtml && !isJsDemo) || isHtmlVideo) return null
    const html = isHtml
      ? buildHtmlPreview(component.codeSnippet.source)
      : buildJsPreview(component.codeSnippet.source)
    const blob = new Blob([html], { type: 'text/html' })
    return URL.createObjectURL(blob)
  }, [component, isHtml, isJsDemo, isHtmlVideo])

  useEffect(() => {
    if (!isHtml && !isJsDemo) return
    setIframeStatus('loading')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setIframeStatus((s) => (s === 'loading' ? 'error' : s))
    }, 8000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (iframeUrl) URL.revokeObjectURL(iframeUrl)
    }
  }, [iframeUrl, isHtml, isJsDemo])

  if (!component) {
    return (
      <div className="w-full aspect-[16/10] bg-bg-secondary rounded-lg border border-border flex items-center justify-center">
        <p className="text-sm text-ink-muted">Select a component to preview</p>
      </div>
    )
  }

  const previewLabel = isMediaVideo
    ? 'Video Demo'
    : isMediaImage
      ? 'Image Demo'
    : hasGenerated || isHtml || isJsDemo
      ? 'Live Preview'
      : 'Pending'
  const codeLines = component.codeSnippet.source.split('\n').slice(0, 12)
  const hasMoreCode = component.codeSnippet.source.split('\n').length > 12

  return (
    <div className="w-full rounded-lg border border-border overflow-hidden bg-bg-secondary">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-bg">
        <button
          onClick={() => setMode('preview')}
          disabled={!canPreview}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            mode === 'preview'
              ? 'bg-accent/10 text-accent'
              : canPreview
                ? 'text-ink-muted hover:text-ink'
                : 'text-ink-muted/50 cursor-not-allowed'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          {previewLabel}
        </button>
        <button
          onClick={() => setMode('code')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            mode === 'code'
              ? 'bg-accent/10 text-accent'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          Source
        </button>
      </div>

      {/* Content */}
      <div className="relative">
        {mode === 'preview' ? (
          hasGenerated ? (
            <GeneratedComponentPreview component={component} />
          ) : isMediaVideo ? (
            <div className="flex aspect-[16/10] w-full items-center justify-center bg-[#050816] p-4">
              <video
                className="max-h-full max-w-full rounded-lg border border-white/10 object-contain shadow-2xl"
                autoPlay
                loop
                muted
                playsInline
                controls
                poster={previewRecord.media?.poster}
              >
                {previewRecord.media?.webm && <source src={previewRecord.media.webm} type="video/webm" />}
                {previewRecord.media?.mp4 && <source src={previewRecord.media.mp4} type="video/mp4" />}
              </video>
            </div>
          ) : isMediaImage ? (
            <div className="flex min-h-[420px] w-full items-center justify-center bg-[#050816] p-4">
              <img
                src={previewRecord.media?.poster}
                alt={component.name}
                className="max-h-full max-w-full rounded-lg border border-white/10 object-contain shadow-2xl"
              />
            </div>
          ) : isHtmlVideo ? (
            <div className="flex aspect-[16/10] w-full items-center justify-center bg-[#050816] p-4">
              <video
                className="max-h-full max-w-full rounded-lg border border-white/10 object-contain shadow-2xl"
                src={htmlVideoSrc!}
                autoPlay
                loop
                muted
                playsInline
                controls
              />
            </div>
          ) : isHtml || isJsDemo ? (
            <div className="relative w-full aspect-[16/10]">
              {iframeStatus === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 bg-bg-secondary">
                  <Loader2 className="w-5 h-5 text-ink-subtle animate-spin" />
                  <span className="text-xs text-ink-subtle">Loading preview...</span>
                </div>
              )}
              {iframeStatus === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-bg-secondary">
                  <AlertCircle className="w-6 h-6 text-ink-subtle" />
                  <p className="text-xs text-ink-muted text-center px-4">
                    This component cannot be previewed in the current environment.
                  </p>
                </div>
              )}
              <iframe
                src={iframeUrl || undefined}
                title={component.name}
                sandbox="allow-scripts allow-same-origin"
                className={`w-full h-full border-0 transition-opacity duration-300 ${
                  iframeStatus === 'loaded' ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => {
                  if (timerRef.current) clearTimeout(timerRef.current)
                  setIframeStatus('loaded')
                }}
                onError={() => {
                  if (timerRef.current) clearTimeout(timerRef.current)
                  setIframeStatus('error')
                }}
              />
            </div>
          ) : null
        ) : (
          <div className="p-4">
            {previewRecord?.status === 'unsupported' && (
              <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs leading-relaxed text-amber-700">
                Live preview is not available yet: {previewRecord.reason}
              </div>
            )}
            <div className="bg-bg rounded border border-border overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-[11px] text-ink-subtle font-mono">
                  {component.codeSnippet.language}
                </span>
                <span className="text-[10px] text-ink-muted">
                  {component.codeSnippet.source.split('\n').length} lines
                </span>
              </div>
              <pre className="p-3 overflow-x-auto text-[11px] leading-relaxed font-mono text-ink-muted">
                <code>
                  {(codeExpanded ? component.codeSnippet.source : codeLines.join('\n')) +
                    (hasMoreCode && !codeExpanded ? '\n...' : '')}
                </code>
              </pre>
              {hasMoreCode && (
                <button
                  onClick={() => setCodeExpanded(!codeExpanded)}
                  className="w-full py-2 text-[11px] text-accent hover:text-accent-light border-t border-border transition-colors"
                >
                  {codeExpanded ? 'Collapse code' : `Expand all (${component.codeSnippet.source.split('\n').length} lines)`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useMemo, useEffect, useRef } from 'react'
import { Monitor, Code2, AlertCircle, Loader2 } from 'lucide-react'
import type { ComponentEntry } from '../types'

interface ComponentPreviewProps {
  component: ComponentEntry | null
}

function buildHtmlPreview(code: string): string {
  return `
<!DOCTYPE html>
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

function buildReactPreview(code: string, _deps: string[]): string {
  // 简化 TSX：移除类型导入和类型注解
  let cleaned = code
    .replace(/import\s+type\s+[^;]+;/g, '')
    .replace(/:\s*React\.(FC|FunctionComponent|ReactNode|JSX\.Element)(<[\w\s,]+>)?/g, '')
    .replace(/:\s*\{[^}]+\}/g, '')
    .replace(/:\s*\w+(<[^>]+>)?(\[\])?/g, '')
    .replace(/interface\s+\w+\s*\{[^}]*\}/g, '')
    .replace(/type\s+\w+\s*=\s*[^;]+;/g, '')
    .replace(/export\s+default\s+/g, '')
    .replace(/export\s+/g, '')

  // 包裹成可执行代码
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://cdn.tailwindcss.com"></script>
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
    color: #e5e5e5;
  }
</style>
</head>
<body>
<div id="root"></div>
<script type="text/babel">
${cleaned}
try {
  const el = typeof Component !== 'undefined' ? Component :
             typeof App !== 'undefined' ? App :
             typeof defaultExport !== 'undefined' ? defaultExport : null;
  if (el) {
    ReactDOM.render(React.createElement(el), document.getElementById('root'));
  } else {
    document.getElementById('root').innerHTML = '<div style="padding:20px;color:#888">Preview not available for this component</div>';
  }
} catch (e) {
  document.getElementById('root').innerHTML = '<div style="padding:20px;color:#ef4444">Preview error: ' + e.message + '</div>';
}
</script>
</body>
</html>`
}

export default function ComponentPreview({ component }: ComponentPreviewProps) {
  const [mode, setMode] = useState<'preview' | 'code'>('preview')
  const [iframeStatus, setIframeStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [codeExpanded, setCodeExpanded] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const iframeUrl = useMemo(() => {
    if (!component) return null
    const { language, source } = component.codeSnippet
    let html: string
    if (language === 'html') {
      html = buildHtmlPreview(source)
    } else {
      html = buildReactPreview(source, component.codeSnippet.dependencies)
    }
    const blob = new Blob([html], { type: 'text/html' })
    return URL.createObjectURL(blob)
  }, [component])

  useEffect(() => {
    setIframeStatus('loading')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setIframeStatus((s) => (s === 'loading' ? 'error' : s))
    }, 8000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (iframeUrl) URL.revokeObjectURL(iframeUrl)
    }
  }, [iframeUrl])

  if (!component) {
    return (
      <div className="w-full aspect-[16/10] bg-bg-secondary rounded-lg border border-border flex items-center justify-center">
        <p className="text-sm text-ink-muted">选择一个组件以预览</p>
      </div>
    )
  }

  const isHtml = component.codeSnippet.language === 'html'
  const previewLabel = isHtml ? '实时预览' : '尝试预览'
  const codeLines = component.codeSnippet.source.split('\n').slice(0, 12)
  const hasMoreCode = component.codeSnippet.source.split('\n').length > 12

  return (
    <div className="w-full rounded-lg border border-border overflow-hidden bg-bg-secondary">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-bg">
        <button
          onClick={() => setMode('preview')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            mode === 'preview'
              ? 'bg-accent/10 text-accent'
              : 'text-ink-muted hover:text-ink'
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
          源码
        </button>
      </div>

      {/* Content */}
      <div className="relative">
        {mode === 'preview' ? (
          <div className="relative w-full aspect-[16/10]">
            {iframeStatus === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 bg-bg-secondary">
                <Loader2 className="w-5 h-5 text-ink-subtle animate-spin" />
                <span className="text-xs text-ink-subtle">加载预览中...</span>
              </div>
            )}
            {iframeStatus === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-bg-secondary">
                <AlertCircle className="w-6 h-6 text-ink-subtle" />
                <p className="text-xs text-ink-muted text-center px-4">
                  该组件无法在当前环境预览
                  {!isHtml && <span className="block mt-1">React 组件建议查看源码并本地运行</span>}
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
        ) : (
          <div className="p-4">
            <div className="bg-bg rounded border border-border overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-[11px] text-ink-subtle font-mono">
                  {component.codeSnippet.language}
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
                  {codeExpanded ? '收起代码' : `展开全部 (${component.codeSnippet.source.split('\n').length} 行)`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

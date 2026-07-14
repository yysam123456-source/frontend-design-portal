import { useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentEntry, ComponentSummary, ProjectMeta } from '../types'
import GeneratedComponentPreview from '../generated/GeneratedComponentPreview'
import { getPreviewRecord } from '../generated/preview-manifest'

const projectCache = new Map<string, Promise<ComponentEntry[]>>()

function loadProjectComponents(project: string) {
  if (!projectCache.has(project)) {
    projectCache.set(
      project,
      fetch(`/data/${project}.json`).then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${project}`)
        return res.json()
      })
    )
  }
  return projectCache.get(project)!
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function isCompleteHtmlDocument(source: string): boolean {
  const trimmed = source.trimStart()
  return (
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.startsWith('<!doctype') ||
    trimmed.toLowerCase().startsWith('<html')
  )
}

function buildHtmlPreview(source: string) {
  // If the source is already a complete HTML document, use it directly
  // instead of wrapping it in another full document (which breaks scripts)
  if (isCompleteHtmlDocument(source)) return source

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 100%; min-height: 100%; }
    body {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 22px;
      background: #0a0a0a;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      overflow: hidden;
      transform: scale(.86);
      transform-origin: center;
    }
  </style>
</head>
<body>${source}</body>
</html>`
}

function buildFallbackPreview(component: ComponentSummary, projectMeta?: ProjectMeta) {
  const accent = projectMeta?.accentColor || '#6366f1'
  const tags = [...(component.style || []), ...(component.techStack || [])].slice(0, 4)
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 100%; height: 100%; }
    body {
      height: 100vh;
      display: grid;
      place-items: center;
      padding: 18px;
      background:
        radial-gradient(circle at 20% 20%, ${accent}28, transparent 30%),
        radial-gradient(circle at 80% 80%, ${accent}18, transparent 28%),
        linear-gradient(135deg, #0f172a, #111827);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #fff;
      overflow: hidden;
    }
    .card {
      width: min(88%, 320px);
      min-height: 116px;
      border: 1px solid rgba(255,255,255,.14);
      border-radius: 18px;
      background: rgba(255,255,255,.08);
      box-shadow: 0 24px 80px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.12);
      backdrop-filter: blur(14px);
      padding: 18px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      animation: float 3.4s ease-in-out infinite;
    }
    .dot { width: 10px; height: 10px; border-radius: 999px; background: ${accent}; box-shadow: 0 0 24px ${accent}; }
    .top { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; color: rgba(255,255,255,.62); font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
    h1 { margin: 0; font-size: 21px; line-height: 1.08; letter-spacing: -.04em; }
    .tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 14px; }
    .tag { padding: 4px 7px; border-radius: 999px; background: rgba(255,255,255,.1); color: rgba(255,255,255,.72); font-size: 10px; }
    @keyframes float { 0%, 100% { transform: translateY(4px) scale(1); } 50% { transform: translateY(-4px) scale(1.015); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="top"><span class="dot"></span>${escapeHtml(projectMeta?.name || component.project)}</div>
    <h1>${escapeHtml(component.name)}</h1>
    <div class="tags">${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
  </div>
</body>
</html>`
}

function buildUnsupportedPreview(component: ComponentSummary, projectMeta?: ProjectMeta) {
  const accent = projectMeta?.accentColor || '#6366f1'
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; }
    body {
      height: 100vh;
      display: grid;
      place-items: center;
      padding: 18px;
      background: linear-gradient(135deg, #f8fafc, #eef2ff);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #334155;
    }
    .box {
      width: min(86%, 280px);
      border: 1px dashed rgba(100,116,139,.35);
      border-radius: 18px;
      background: rgba(255,255,255,.72);
      padding: 18px;
      text-align: center;
      box-shadow: 0 18px 50px rgba(15,23,42,.08);
    }
    .dot { width: 12px; height: 12px; border-radius: 999px; margin: 0 auto 10px; background: ${accent}; opacity: .75; }
    .title { font-size: 13px; font-weight: 700; letter-spacing: -.02em; color: #0f172a; }
    .desc { margin-top: 6px; font-size: 10px; line-height: 1.45; color: #64748b; }
  </style>
</head>
<body>
  <div class="box">
    <div class="dot"></div>
    <div class="title">${escapeHtml(component.name)}</div>
    <div class="desc">Live preview pending. This placeholder does not fake a source screenshot.</div>
  </div>
</body>
</html>`
}

interface ComponentThumbnailPreviewProps {
  component: ComponentSummary
  projectMeta?: ProjectMeta
}

export default function ComponentThumbnailPreview({
  component,
  projectMeta,
}: ComponentThumbnailPreviewProps) {
  const previewRecord = getPreviewRecord(component.id)
  const [source, setSource] = useState<string | null>(null)
  const [language, setLanguage] = useState(component.language)
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)

    loadProjectComponents(component.project)
      .then((items) => {
        if (!mounted) return
        const full = items.find((item) => item.id === component.id)
        setSource(full?.codeSnippet.source || null)
        setLanguage(full?.codeSnippet.language || component.language)
      })
      .catch(() => {
        if (mounted) setSource(null)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [component.id, component.project])

  // IntersectionObserver: only create iframe (and WebGL context) when card is visible.
  // This prevents WebGL context loss from too many simultaneous contexts.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const srcDoc = useMemo(() => {
    if (loading) return ''
    if (previewRecord?.status === 'unsupported') return buildUnsupportedPreview(component, projectMeta)
    if ((language === 'html' || previewRecord?.kind === 'html-live') && source) return buildHtmlPreview(source)
    return buildFallbackPreview(component, projectMeta)
  }, [component, language, loading, previewRecord?.status, previewRecord?.kind, projectMeta, source])

  const bgStyle = (language === 'html' || previewRecord?.kind === 'html-live') ? '#0a0a0a' : '#0b0f19'

  if (previewRecord?.kind === 'react-generated' && previewRecord.status === 'ready') {
    return (
      <div ref={containerRef} className="absolute inset-0">
        <GeneratedComponentPreview component={component} compact />
      </div>
    )
  }

  if (previewRecord?.kind === 'media-video' && previewRecord.status === 'ready') {
    return (
      <div ref={containerRef} className="absolute inset-0 flex items-center justify-center bg-[#050816]">
        <video
          className="h-full w-full object-contain"
          autoPlay
          loop
          muted
          playsInline
          poster={previewRecord.media?.poster}
        >
          {previewRecord.media?.webm && <source src={previewRecord.media.webm} type="video/webm" />}
          {previewRecord.media?.mp4 && <source src={previewRecord.media.mp4} type="video/mp4" />}
        </video>
        <div className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white">
          Official Demo
        </div>
      </div>
    )
  }

  if (previewRecord?.kind === 'media-image' && previewRecord.status === 'ready') {
    return (
      <div ref={containerRef} className="absolute inset-0 flex items-center justify-center bg-[#050816]">
        <img
          src={previewRecord.media?.poster}
          alt={`${component.name} official demo`}
          className="h-full w-full object-contain"
          loading="lazy"
        />
        <div className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white">
          Official Demo
        </div>
      </div>
    )
  }

  // For iframe-based previews, use IntersectionObserver to limit simultaneous WebGL contexts.
  // When card is not visible, show a static placeholder instead of an iframe.
  return (
    <div ref={containerRef} className="absolute inset-0" style={{ background: bgStyle }}>
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      ) : !isVisible ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-[10px] text-white/25 font-medium tracking-wide">
            {component.name}
          </div>
        </div>
      ) : (
        <iframe
          srcDoc={srcDoc}
          title={`${component.name} preview`}
          sandbox="allow-scripts allow-same-origin"
          className="absolute inset-0 w-full h-full border-0 pointer-events-none"
          style={{ background: bgStyle }}
        />
      )}
    </div>
  )
}
